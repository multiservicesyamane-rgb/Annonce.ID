"use client";

// Devis — propositions commerciales, de la rédaction à l'acceptation.
// Le client répond depuis un lien public, sans compte : c'est ce lien que l'on
// envoie par WhatsApp. L'acceptation déclenche seule la suite de la chaîne.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatFcfa, formatDate, timeAgo, computeTotals, waNumber, daysUntil,
  QUOTE_LABELS, TAX_RATES, effectiveQuoteStatus, quoteIsOpen, canChargeTax,
  sanitizeSections, DEFAULT_QUOTE_SECTIONS,
  type QuoteItem,
} from "@/lib/pro";
import {
  api, card, input, lbl, Badge, Crumb, Empty, F, FilterBar, ItemsEditor, Kpi,
  MigrationNotice, MobileActionBar, MoneyField, PageHead, Section, Select, Tip, TotalsBox, useConfirm,
  QUOTE_STYLE,
  type Client, type ProEvent, type Project, type Quote, type Toast,
} from "./ui";
import { PreviewAside, PreviewOverlay } from "./DocPreview";
import type { PrintDoc, PrintParty } from "./PrintableDocument";

type Detail = { quote: Quote; events: ProEvent[]; invoice: { id: string; number: string; status: string; total: number } | null };

export default function QuotesPanel({ toast, goTo }: { toast: Toast; goTo: (p: string) => void }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [busy, setBusy] = useState(false);

  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [editing, setEditing] = useState<Quote | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // Formulaire
  const [form, setForm] = useState<Record<string, string>>({});
  const [items, setItems] = useState<QuoteItem[]>([{ label: "", qty: 1, unit_price: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  // Droit de facturer la TVA, lu depuis le profil d'entreprise.
  const [taxAllowed, setTaxAllowed] = useState(true);
  // Identité de l'émetteur et rubriques par défaut : de quoi composer
  // l'aperçu A4 exactement comme le fera la pièce imprimée.
  const [seller, setSeller] = useState<PrintParty | null>(null);
  const [proSections, setProSections] = useState<unknown>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { ask, confirmNode } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    const [q, c, p] = await Promise.all([
      api("quotes", { action: "list" }),
      api("clients", { action: "list" }),
      api("projects", { action: "list" }),
    ]);
    if (q.data?.needsMigration || c.data?.needsMigration) setNeedsMigration(true);
    setQuotes(q.data?.quotes || []);
    setClients(c.data?.clients || []);
    setProjects(p.data?.projects || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Profil d'entreprise : statut (qui conditionne la TVA), en-tête du document
  // et rubriques par défaut.
  useEffect(() => {
    let off = false;
    api("settings", { action: "get" }).then(({ data }) => {
      if (off) return;
      const st = data?.settings?.business_status;
      // Colonne absente (migration non passée) : on ne bride rien.
      if (st !== undefined) setTaxAllowed(canChargeTax(st));
      if (data?.seller) setSeller(data.seller as PrintParty);
      setProSections(data?.settings?.quote_sections ?? null);
    });
    return () => { off = true; };
  }, []);

  const withStatus = useMemo(
    () => quotes.map((q) => ({ ...q, status: effectiveQuoteStatus(q) })),
    [quotes],
  );

  const stats = useMemo(() => {
    const pending = withStatus.filter((q) => q.status === "sent" || q.status === "viewed");
    const accepted = withStatus.filter((q) => q.status === "accepted");
    return {
      pending: pending.length,
      pendingAmount: pending.reduce((s, q) => s + (q.total || 0), 0),
      accepted: accepted.length,
      acceptedAmount: accepted.reduce((s, q) => s + (q.total || 0), 0),
    };
  }, [withStatus]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return withStatus.filter((q) => {
      if (filter === "pending" && q.status !== "sent" && q.status !== "viewed") return false;
      if (filter !== "all" && filter !== "pending" && q.status !== filter) return false;
      if (!needle) return true;
      return [q.title, q.number, q.pro_clients?.company, q.pro_clients?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [withStatus, query, filter]);

  const totals = useMemo(() => computeTotals(items, discount, taxRate), [items, discount, taxRate]);

  /* ------------- Aperçu en direct (colonne de droite / plein écran) -------------
     On assemble ici la pièce telle qu'elle partirait maintenant. Rien n'est
     inventé pour l'occasion : ce sont les valeurs du formulaire, passées au
     composant d'impression. */

  // Rubriques que le serveur recopiera à la création (voir defaultQuoteSections)
  // : celles du profil si elles existent, les nôtres sinon. Sur un devis déjà
  // enregistré, ce sont celles figées dans la pièce.
  const previewSections = useMemo(() => {
    if (editing) return (editing as unknown as { sections?: unknown }).sections;
    const saved = sanitizeSections(proSections);
    return saved.length > 0 ? saved : DEFAULT_QUOTE_SECTIONS;
  }, [editing, proSections]);

  const previewClient = useMemo<PrintParty | null>(() => {
    const c = clients.find((x) => x.id === form.client_id);
    if (!c) return null;
    return {
      name: c.name,
      company: c.billing_name || c.company || null,
      phone: c.phone,
      email: c.email,
      address: c.address || c.city || null,
      tax_id: c.tax_id,
    };
  }, [clients, form.client_id]);

  const previewDoc = useMemo<PrintDoc>(() => ({
    kind: "devis",
    number: editing?.number || null,
    // Un titre vide laisserait un trou dans l'en-tête : on montre l'intitulé
    // du champ à la place, le temps qu'il soit rempli.
    title: form.title?.trim() || "Objet du devis",
    items: items.filter((i) => i.label.trim()),
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax_rate: totals.taxRate,
    tax_amount: totals.taxAmount,
    total: totals.total,
    issue_date: editing?.created_at || new Date().toISOString(),
    valid_until: form.valid_until || null,
    terms: form.terms || null,
    note: form.note || null,
    sections: previewSections,
    // Brouillon tant que rien n'est enregistré : pas de cartouche d'état.
    status: editing ? effectiveQuoteStatus(editing) : "draft",
  }), [editing, form, items, totals, previewSections]);

  /* ---------------- Actions ---------------- */

  function openNew() {
    setEditing(null);
    setForm({});
    setItems([{ label: "", qty: 1, unit_price: 0 }]);
    setDiscount(0);
    setTaxRate(0);
    setView("form");
  }

  function openEdit(q: Quote) {
    setEditing(q);
    setForm({
      title: q.title || "",
      client_id: q.client_id || "",
      project_id: q.project_id || "",
      valid_until: q.valid_until || "",
      note: q.note || "",
      terms: q.terms || "",
    });
    setItems(Array.isArray(q.items) && q.items.length ? q.items : [{ label: "", qty: 1, unit_price: 0 }]);
    setDiscount(q.discount || 0);
    setTaxRate(Number(q.tax_rate) || 0);
    setView("form");
  }

  async function openDetail(id: string) {
    setBusy(true);
    const { ok, data } = await api("quotes", { action: "get", id });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Devis indisponible"));
    setDetail(data as Detail);
    setView("detail");
  }

  async function save() {
    const clean = items.filter((i) => i.label.trim());
    if (!form.title?.trim()) return toast("⚠ Indiquez l'objet du devis.");
    if (!clean.length) return toast("⚠ Ajoutez au moins une prestation.");

    setBusy(true);
    const payload: Record<string, unknown> = {
      action: editing ? "update" : "create",
      title: form.title,
      client_id: form.client_id || "",
      project_id: form.project_id || "",
      items: clean,
      discount,
      tax_rate: taxRate,
      valid_until: form.valid_until || "",
      note: form.note || "",
      terms: form.terms || "",
    };
    if (editing) payload.id = editing.id;

    const { ok, data } = await api("quotes", payload);
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));

    toast(
      editing
        ? data.quote.version > (editing.version || 1)
          ? `✓ Devis révisé (version ${data.quote.version}) — renvoyez-le au client`
          : "✓ Devis mis à jour"
        : "✓ Devis créé — envoyez-le à votre client",
    );
    setView("list");
    setEditing(null);
    load();
  }

  /** Envoi : marque « envoyé » puis ouvre WhatsApp avec le lien prérempli. */
  async function send(q: Quote) {
    setBusy(true);
    const { ok, data } = await api("quotes", { action: "send", id: q.id });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));

    const url: string = data.url;
    const phone = waNumber(data.quote?.pro_clients?.phone || q.pro_clients?.phone);
    const msg = `Bonjour, voici votre devis « ${q.title} » : ${formatFcfa(q.total)}\n${url}`;

    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    } else {
      await navigator.clipboard?.writeText(url).catch(() => {});
      toast("✓ Lien copié (ce client n'a pas de WhatsApp enregistré)");
    }
    if (detail?.quote.id === q.id) openDetail(q.id);
    load();
  }

  async function copyLink(q: Quote) {
    await navigator.clipboard?.writeText(`${window.location.origin}/devis/${q.public_token}`).catch(() => {});
    toast("✓ Lien du devis copié");
  }

  function openPdf(q: Quote) {
    window.open(`/devis/${q.public_token}/imprimer`, "_blank", "noopener");
  }

  /** Réponse reçue hors ligne (téléphone, en personne). */
  async function setStatus(q: Quote, status: "accepted" | "refused") {
    const label = status === "accepted" ? "accepté" : "refusé";
    ask(`Marquer ce devis comme ${label} ?${status === "accepted" ? " La facture sera créée automatiquement." : ""}`, async () => {
      setBusy(true);
      const { ok, data } = await api("quotes", { action: "set_status", id: q.id, status });
      if (ok && status === "accepted") {
        // Le raccourci manuel doit produire le même résultat que l'acceptation
        // par le client : une facture prête, sans double saisie.
        await api("invoices", { action: "create", quote_id: q.id });
      }
      setBusy(false);
      if (!ok) return toast("⚠ " + (data.error || "Erreur"));
      toast(status === "accepted" ? "✓ Devis accepté — facture créée" : "✓ Devis marqué refusé");
      if (detail?.quote.id === q.id) openDetail(q.id);
      load();
    });
  }

  async function toInvoice(q: Quote) {
    setBusy(true);
    const { ok, data } = await api("invoices", { action: "create", quote_id: q.id });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));
    toast(`✓ Facture ${data.invoice.number} créée`);
    goTo("invoices");
  }

  function remove(q: Quote) {
    ask(`Supprimer le devis « ${q.title} » ?`, async () => {
      const { ok, data } = await api("quotes", { action: "delete", id: q.id });
      if (!ok) return toast("⚠ " + (data.error || "Erreur"));
      toast("✓ Devis supprimé");
      setView("list");
      load();
    });
  }

  /* ---------------- Rendu ---------------- */

  if (needsMigration) return <MigrationNotice />;
  if (loading) return <div className="py-16 text-center text-gray-400">Chargement…</div>;

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.company || c.name }));
  const projectOptions = projects
    .filter((p) => !form.client_id || !p.client_id || p.client_id === form.client_id)
    .map((p) => ({ value: p.id, label: p.name }));

  /* ===== Formulaire ===== */
  if (view === "form") {
    return (
      <div className="mx-auto w-full max-w-[980px] lg:max-w-[1280px] xl:max-w-[1560px]">
        {confirmNode}
        <Crumb
          onBack={() => { setView("list"); setEditing(null); }}
          parent="Devis"
          current={editing ? `Modifier ${editing.number || editing.title}` : "Nouveau devis"}
        />

        {clients.length === 0 ? (
          <Empty
            icon="👥"
            title="Ajoutez d'abord un client"
            sub="Un devis est toujours adressé à un client. Créez-en un, puis revenez ici."
            cta="Aller aux clients"
            onCta={() => goTo("clients")}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] xl:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(440px,520px)]">
            <div className="flex flex-col gap-4">
              <Section icon="🧾" title="Informations">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    l="Client"
                    v={form.client_id}
                    set={(v) => setForm({ ...form, client_id: v, project_id: "" })}
                    options={clientOptions}
                    placeholder="Choisir un client…"
                  />
                  <F l="Objet du devis" v={form.title} set={(v) => setForm({ ...form, title: v })} ph="Ex : Logo + charte graphique" />
                  <Select
                    l="Projet (optionnel)"
                    v={form.project_id}
                    set={(v) => setForm({ ...form, project_id: v })}
                    options={projectOptions}
                    placeholder={projects.length ? "Aucun projet rattaché" : "Aucun projet créé"}
                  />
                  <F l="Valable jusqu'au" v={form.valid_until} set={(v) => setForm({ ...form, valid_until: v })} type="date" />
                </div>
              </Section>

              <Section icon="📋" title="Prestations">
                <ItemsEditor items={items} setItems={setItems} notify={toast} />
              </Section>

              <Section icon="💰" title="Remise et taxes">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MoneyField
                    l="Remise commerciale"
                    v={discount}
                    set={setDiscount}
                    hint="Montant déduit du sous-total HT."
                  />
                  <div>
                    <span className={lbl}>TVA</span>
                    <div className="flex gap-2">
                      {TAX_RATES.map((r) => {
                        // Sans NINEA, pas de TVA : le bouton reste visible mais
                        // inerte, avec l'explication juste dessous. Le masquer
                        // laisserait croire à un bug.
                        const blocked = r > 0 && !taxAllowed;
                        return (
                          <button
                            key={r}
                            type="button"
                            disabled={blocked}
                            onClick={() => setTaxRate(r)}
                            className={`flex-1 rounded-xl border px-3 py-2.5 text-[.83rem] font-bold transition ${
                              taxRate === r
                                ? "border-green bg-green text-white"
                                : blocked
                                  ? "cursor-not-allowed border-gray-200 text-gray-300 dark:border-dark-border dark:text-gray-600"
                                  : "border-gray-200 text-gray-600 hover:border-green/50 dark:border-dark-border dark:text-gray-300"
                            }`}
                          >
                            {r === 0 ? "Non assujetti" : `${r} %`}
                          </button>
                        );
                      })}
                    </div>
                    {!taxAllowed && (
                      <p className="mt-1.5 text-[.72rem] text-gray-500 dark:text-gray-400">
                        TVA indisponible sans NINEA — réglable dans « Profil entreprise ».
                      </p>
                    )}
                    <p className="mt-1 text-[.7rem] text-gray-400">
                      La TVA sénégalaise est de 18 %. Laissez « Non assujetti » si vous ne la facturez pas.
                    </p>
                  </div>
                </div>
              </Section>

              <Section icon="📄" title="Conditions de paiement">
                <textarea
                  className={`${input} min-h-[80px] resize-none`}
                  placeholder="Ex : 50 % à la commande, solde à la livraison. Paiement par Wave ou Orange Money."
                  value={form.terms || ""}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                />
              </Section>

              <Section icon="💬" title="Note pour le client (optionnel)">
                <textarea
                  className={`${input} min-h-[80px] resize-none`}
                  placeholder="Délais de réalisation, nombre de retouches incluses…"
                  value={form.note || ""}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </Section>
            </div>

            <PreviewAside
              doc={previewDoc}
              seller={seller}
              client={previewClient}
              actionLabel={editing ? "Enregistrer" : "Créer le devis"}
              onAction={save}
              busy={busy}
              onExpand={() => setPreviewOpen(true)}
            >
              {editing && (editing.status === "sent" || editing.status === "viewed") && (
                <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-3.5 text-[.78rem] leading-relaxed text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/5 dark:text-amber-200">
                  Ce devis est déjà chez le client. L&apos;enregistrer créera la <b>version {(editing.version || 1) + 1}</b> et
                  il faudra le lui renvoyer.
                </div>
              )}

              {!editing && (
                <div className={`${card} p-4`}>
                  <div className="text-[.68rem] font-bold uppercase tracking-wider text-gray-400">Ensuite</div>
                  <ul className="mt-2 flex flex-col gap-2.5">
                    <Tip icon="💬">Vous l&apos;enverrez par <b>WhatsApp</b> en un clic.</Tip>
                    <Tip icon="🔗">Votre client l&apos;ouvre par lien et l&apos;accepte <b>sans compte</b>.</Tip>
                    <Tip icon="⚡">À l&apos;acceptation, le <b>projet et la facture</b> se créent tout seuls.</Tip>
                  </ul>
                </div>
              )}
            </PreviewAside>

            <MobileActionBar
              label={editing ? "Enregistrer" : "Créer le devis"}
              onAction={save}
              busy={busy}
              total={totals.total}
              onPreview={() => setPreviewOpen(true)}
            />
          </div>
        )}

        {/* Sur téléphone, l'aperçu n'a pas de colonne où vivre : il s'ouvre
            par-dessus la saisie, à la demande. */}
        <PreviewOverlay
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          doc={previewDoc}
          seller={seller}
          client={previewClient}
        />
      </div>
    );
  }

  /* ===== Fiche devis ===== */
  if (view === "detail" && detail) {
    const q = detail.quote;
    const status = effectiveQuoteStatus(q);
    const left = daysUntil(q.valid_until);
    const versions = detail.events.filter((e) => e.kind === "revised");

    return (
      <div className="mx-auto w-full max-w-[980px] xl:max-w-[1180px]">
        {confirmNode}
        <Crumb onBack={() => setView("list")} parent="Devis" current={q.number || q.title} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-4">
            <div className={`${card} p-4 sm:p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-[1.15rem] font-extrabold text-gray-900 dark:text-white">{q.title}</h2>
                    <Badge cls={QUOTE_STYLE[status] || QUOTE_STYLE.draft}>{QUOTE_LABELS[status] || status}</Badge>
                    {q.version > 1 && (
                      <Badge cls="bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">v{q.version}</Badge>
                    )}
                  </div>
                  <p className="text-[.82rem] text-gray-500">
                    {q.number}
                    {q.pro_clients ? ` · ${q.pro_clients.company || q.pro_clients.name}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[1.25rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                    {formatFcfa(q.total)}
                  </div>
                  {q.tax_rate > 0 && <div className="text-[.7rem] text-gray-400">TTC · TVA {q.tax_rate} %</div>}
                </div>
              </div>

              <div className="mt-4 grid gap-2.5 border-t border-gray-100 pt-3.5 text-[.82rem] dark:border-white/10 sm:grid-cols-3">
                <Meta label="Créé le" value={formatDate(q.created_at)} />
                <Meta label="Envoyé le" value={q.sent_at ? formatDate(q.sent_at) : "—"} />
                <Meta
                  label="Validité"
                  value={
                    !q.valid_until ? "sans limite"
                    : left == null ? formatDate(q.valid_until)
                    : left < 0 ? `expiré depuis ${Math.abs(left)} j`
                    : `${formatDate(q.valid_until)} (${left} j)`
                  }
                  tone={left != null && left < 0 ? "red" : undefined}
                />
              </div>

              {q.viewed_at && (
                <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-[.78rem] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  👀 Consulté par le client {timeAgo(q.viewed_at)}
                </p>
              )}
              {q.accepted_at && (
                <p className="mt-3 rounded-xl bg-green/10 px-3 py-2 text-[.78rem] font-semibold text-green">
                  ✅ Accepté {timeAgo(q.accepted_at)}
                  {detail.invoice ? ` — facture ${detail.invoice.number} créée` : ""}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3.5 dark:border-white/10">
                {quoteIsOpen(q) || status === "draft" || status === "expired" ? (
                  <button
                    onClick={() => send(q)}
                    disabled={busy}
                    className="rounded-xl bg-[#25D366] px-4 py-2 text-[.8rem] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {q.sent_at ? "↻ Renvoyer sur WhatsApp" : "💬 Envoyer sur WhatsApp"}
                  </button>
                ) : null}
                <button onClick={() => copyLink(q)} className={btnGhost}>🔗 Copier le lien</button>
                <button onClick={() => openPdf(q)} className={btnGhost}>⬇ Télécharger</button>
                {status !== "accepted" && (
                  <button onClick={() => openEdit(q)} className={btnGhost}>✏️ Modifier</button>
                )}
                {quoteIsOpen(q) && (
                  <>
                    <button onClick={() => setStatus(q, "accepted")} disabled={busy} className={btnGhost}>
                      Marquer accepté
                    </button>
                    <button onClick={() => setStatus(q, "refused")} disabled={busy} className={btnGhost}>
                      Marquer refusé
                    </button>
                  </>
                )}
                {status === "accepted" && !detail.invoice && (
                  <button onClick={() => toInvoice(q)} disabled={busy} className="btn btn-green px-4 py-2 text-[.8rem] font-bold">
                    Créer la facture
                  </button>
                )}
                {status !== "accepted" && (
                  <button onClick={() => remove(q)} className={`${btnGhost} text-brand-red`}>Supprimer</button>
                )}
              </div>
            </div>

            <Section icon="📋" title="Prestations">
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/10">
                {(q.items || []).map((it, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-[.88rem] font-semibold text-gray-900 dark:text-white">{it.label}</div>
                      {it.qty > 1 && (
                        <div className="text-[.74rem] text-gray-500">{it.qty} × {formatFcfa(it.unit_price)}</div>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-[.85rem] font-bold tabular-nums text-gray-900 dark:text-white">
                      {formatFcfa(it.qty * it.unit_price)}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {q.terms && (
              <Section icon="📄" title="Conditions de paiement">
                <p className="whitespace-pre-line text-[.85rem] leading-relaxed text-gray-600 dark:text-gray-300">{q.terms}</p>
              </Section>
            )}
            {q.note && (
              <Section icon="💬" title="Note au client">
                <p className="whitespace-pre-line text-[.85rem] leading-relaxed text-gray-600 dark:text-gray-300">{q.note}</p>
              </Section>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <TotalsBox
              subtotal={q.subtotal || q.total}
              discount={q.discount || 0}
              taxRate={Number(q.tax_rate) || 0}
              taxAmount={q.tax_amount || 0}
              total={q.total}
              title="Récapitulatif"
            />

            {versions.length > 0 && (
              <div className={`${card} p-4`}>
                <h3 className="mb-2.5 font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">
                  Historique des versions
                </h3>
                <ol className="flex flex-col gap-2.5">
                  {versions.map((e) => (
                    <li key={e.id} className="text-[.76rem] leading-snug">
                      <div className="text-gray-700 dark:text-gray-300">{e.message}</div>
                      <div className="text-[.68rem] text-gray-400">{timeAgo(e.created_at)}</div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className={`${card} p-4`}>
              <h3 className="mb-2.5 font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">Suivi</h3>
              {detail.events.length === 0 ? (
                <p className="py-2 text-[.78rem] text-gray-400">Aucun évènement.</p>
              ) : (
                <ol className="flex flex-col gap-2.5">
                  {detail.events.map((e) => (
                    <li key={e.id} className="text-[.76rem] leading-snug">
                      <div className="text-gray-700 dark:text-gray-300">{e.message}</div>
                      <div className="text-[.68rem] text-gray-400">{timeAgo(e.created_at)}</div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ===== Liste ===== */
  const counts = {
    all: withStatus.length,
    draft: withStatus.filter((q) => q.status === "draft").length,
    pending: withStatus.filter((q) => q.status === "sent" || q.status === "viewed").length,
    accepted: withStatus.filter((q) => q.status === "accepted").length,
    refused: withStatus.filter((q) => q.status === "refused").length,
    expired: withStatus.filter((q) => q.status === "expired").length,
  };

  return (
    <div className="mx-auto w-full max-w-[980px] xl:max-w-[1180px]">
      {confirmNode}
      {/* Les rubriques par défaut se règlent dans « Mon entreprise », avec les
          autres réglages de document : sur cet écran de liste, le bouton
          concurrençait l'action principale sans jamais servir deux fois. */}
      <PageHead
        title="Devis"
        count={`${quotes.length} devis · ${counts.pending} en attente`}
        action="+ Nouveau devis"
        onAction={openNew}
      />

      {quotes.length === 0 ? (
        <Empty
          icon="📄"
          title="Aucun devis"
          sub="Créez votre premier devis : votre client le recevra par WhatsApp et pourra l'accepter en un clic, sans créer de compte."
          cta="+ Créer un devis"
          onCta={openNew}
        />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="En attente" value={String(stats.pending)} tone={stats.pending ? "amber" : undefined} />
            <Kpi label="Acceptés" value={String(stats.accepted)} tone="green" />
            <Kpi label="Montant en attente" value={formatFcfa(stats.pendingAmount)} small />
            <Kpi label="Montant signé" value={formatFcfa(stats.acceptedAmount)} tone="green" small />
          </div>

          <FilterBar
            query={query}
            setQuery={setQuery}
            placeholder="Rechercher un devis, un client, un numéro…"
            active={filter}
            setActive={setFilter}
            filters={[
              { value: "all", label: "Tous", count: counts.all },
              { value: "draft", label: "Brouillons", count: counts.draft },
              { value: "pending", label: "En attente", count: counts.pending },
              { value: "accepted", label: "Acceptés", count: counts.accepted },
              { value: "refused", label: "Refusés", count: counts.refused },
              { value: "expired", label: "Expirés", count: counts.expired },
            ]}
          />

          {filtered.length === 0 ? (
            <div className={`${card} px-6 py-10 text-center`}>
              <p className="text-[.86rem] text-gray-500">Aucun devis ne correspond à cette recherche.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((q) => (
                <div key={q.id} className={`${card} p-4`}>
                  <button onClick={() => openDetail(q.id)} className="flex w-full items-start gap-3 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[.95rem] font-extrabold text-gray-900 dark:text-white">{q.title}</span>
                        <Badge cls={QUOTE_STYLE[q.status] || QUOTE_STYLE.draft}>
                          {QUOTE_LABELS[q.status] || q.status}
                        </Badge>
                        {q.version > 1 && (
                          <Badge cls="bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">v{q.version}</Badge>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-[.78rem] text-gray-500">
                        {q.pro_clients?.company || q.pro_clients?.name || "Sans client"}
                        {q.number ? ` · ${q.number}` : ""}
                        {q.items?.length ? ` · ${q.items.length} prestation(s)` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[1rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                        {formatFcfa(q.total)}
                      </div>
                      {q.tax_rate > 0 && <div className="text-[.68rem] text-gray-400">TTC</div>}
                    </div>
                  </button>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
                    {(quoteIsOpen(q) || q.status === "draft" || q.status === "expired") && (
                      <button
                        onClick={() => send(q)}
                        disabled={busy}
                        className="flex-1 rounded-xl bg-[#25D366] px-4 py-2.5 text-[.83rem] font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                      >
                        {q.sent_at ? "↻ Renvoyer sur WhatsApp" : "💬 Envoyer sur WhatsApp"}
                      </button>
                    )}
                    <button onClick={() => copyLink(q)} className={btnGhost}>🔗 Lien</button>
                    <button onClick={() => openPdf(q)} className={btnGhost}>⬇ Télécharger</button>
                    {q.status === "accepted" && (
                      <button onClick={() => openDetail(q.id)} className={btnGhost}>Voir la suite</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ============================ Sous-composants ============================ */

const btnGhost =
  "rounded-xl border border-gray-200 px-3.5 py-2 text-[.8rem] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5";

function Meta({ label, value, tone }: { label: string; value: string; tone?: "red" }) {
  return (
    <div>
      <div className="text-[.68rem] font-bold uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`font-semibold ${tone === "red" ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-gray-200"}`}>
        {value}
      </div>
    </div>
  );
}
