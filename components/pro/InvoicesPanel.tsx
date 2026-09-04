"use client";

// Factures — cycle de facturation et encaissements.
// Une facture naît d'un devis accepté (automatiquement), d'un projet, ou d'une
// saisie libre. Les paiements se saisissent à la main : Wave, Orange Money et
// les espèces n'ont pas d'API de rapprochement au Sénégal.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatFcfa, formatDate, timeAgo, computeTotals, waNumber, daysUntil,
  INVOICE_LABELS, PAYMENT_METHODS, TAX_RATES, effectiveInvoiceStatus, canChargeTax,
  type QuoteItem,
} from "@/lib/pro";
import {
  api, card, cardRaised, input, lbl, Badge, Crumb, Empty, F, FilterBar, ItemsEditor, Kpi,
  MigrationNotice, MobileActionBar, MoneyField, PageHead, Progress, Section, Select, TotalsBox, useConfirm,
  INVOICE_STYLE,
  type Client, type GoTo, type Invoice, type Payment, type ProEvent, type Project, type Quote, type Toast,
} from "./ui";
import { PreviewAside, PreviewOverlay } from "./DocPreview";
import type { PrintDoc, PrintParty } from "./PrintableDocument";

type Detail = { invoice: Invoice; payments: Payment[]; events: ProEvent[] };

export default function InvoicesPanel({ toast, goTo, focusId }: { toast: Toast; goTo: GoTo; focusId?: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [busy, setBusy] = useState(false);

  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [editing, setEditing] = useState<Invoice | null>(null);
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
  // En-tête de l'émetteur, pour que l'aperçu A4 soit celui de la vraie pièce.
  const [seller, setSeller] = useState<PrintParty | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Pièce déjà émise qu'on regarde. Voir `viewerNode` plus bas.
  const [viewing, setViewing] = useState<Invoice | null>(null);

  // Saisie d'un encaissement
  const [payFor, setPayFor] = useState<Invoice | null>(null);

  const { ask, confirmNode } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    const [i, q, c, p] = await Promise.all([
      api("invoices", { action: "list" }),
      api("quotes", { action: "list" }),
      api("clients", { action: "list" }),
      api("projects", { action: "list" }),
    ]);
    if (i.data?.needsMigration) setNeedsMigration(true);
    setInvoices(i.data?.invoices || []);
    setQuotes(q.data?.quotes || []);
    setClients(c.data?.clients || []);
    setProjects(p.data?.projects || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Pièce désignée depuis le tableau de bord : on l'ouvre d'emblée plutôt que
  // de déposer le professionnel devant la liste entière.
  useEffect(() => {
    if (focusId) openDetail(focusId);
    // openDetail dépend de l'état courant mais n'a pas à relancer l'ouverture :
    // seul un nouveau focusId doit le faire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  // Profil d'entreprise : statut (qui conditionne la TVA) et en-tête du document.
  useEffect(() => {
    let off = false;
    api("settings", { action: "get" }).then(({ data }) => {
      if (off) return;
      const st = data?.settings?.business_status;
      // Colonne absente (migration non passée) : on ne bride rien.
      if (st !== undefined) setTaxAllowed(canChargeTax(st));
      if (data?.seller) setSeller(data.seller as PrintParty);
    });
    return () => { off = true; };
  }, []);

  const withStatus = useMemo(
    () => invoices.map((i) => ({ ...i, status: effectiveInvoiceStatus(i) })),
    [invoices],
  );

  const stats = useMemo(() => {
    const billable = withStatus.filter((i) => i.status !== "draft" && i.status !== "cancelled");
    const billed = billable.reduce((s, i) => s + (i.total || 0), 0);
    // Sur le même périmètre que « facturé » : compter l'encaissement d'une
    // facture annulée en face d'un chiffre d'affaires qui l'exclut donnait un
    // « reste à encaisser » faux.
    const cashed = billable.reduce((s, i) => s + (i.paid_amount || 0), 0);
    const unpaid = billable.filter((i) => i.status !== "paid");
    const overdue = unpaid.filter((i) => i.status === "late");
    return {
      billed,
      cashed,
      outstanding: Math.max(0, billed - cashed),
      unpaidCount: unpaid.length,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, i) => s + Math.max(0, (i.total || 0) - (i.paid_amount || 0)), 0),
    };
  }, [withStatus]);

  // Devis acceptés qui n'ont pas encore leur facture (rattrapage manuel).
  const toInvoice = useMemo(() => {
    const invoiced = new Set(invoices.map((i) => i.quote_id).filter(Boolean));
    return quotes.filter((q) => q.status === "accepted" && !invoiced.has(q.id));
  }, [quotes, invoices]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return withStatus.filter((i) => {
      if (filter === "unpaid" && (i.status === "paid" || i.status === "cancelled" || i.status === "draft")) return false;
      if (filter !== "all" && filter !== "unpaid" && i.status !== filter) return false;
      if (!needle) return true;
      return [i.title, i.number, i.pro_clients?.company, i.pro_clients?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [withStatus, query, filter]);

  const totals = useMemo(() => computeTotals(items, discount, taxRate), [items, discount, taxRate]);

  /* ------------- Aperçu en direct (colonne de droite / plein écran) -------------
     La facture telle qu'elle partirait maintenant : mêmes valeurs, même
     composant que la version imprimée. */

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
    kind: "facture",
    number: editing?.number || null,
    title: form.title?.trim() || "Objet de la facture",
    items: items.filter((i) => i.label.trim()),
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax_rate: totals.taxRate,
    tax_amount: totals.taxAmount,
    total: totals.total,
    paid_amount: editing?.paid_amount || 0,
    issue_date: form.issue_date || editing?.issue_date || new Date().toISOString(),
    due_date: form.due_date || null,
    terms: form.terms || null,
    // Brouillon tant que rien n'est enregistré : pas de cartouche d'état.
    status: editing ? effectiveInvoiceStatus(editing) : "draft",
  }), [editing, form, items, totals]);

  /* ------------- Voir une facture déjà émise -------------
     Le détail d'une facture montrait ses DONNÉES — lignes, échéance, historique
     des paiements — mais jamais la facture elle-même. Or c'est le document qui
     compte : c'est lui que le client reçoit, et c'est lui qu'on veut relire
     avant de l'envoyer. Le seul chemin existant s'appelait « ⬇ Télécharger »,
     ce qui annonce un fichier, pas une lecture.
     On rouvre donc la feuille A4 — le même composant que l'aperçu de saisie et
     que la version imprimée — à partir de la pièce enregistrée. */

  const partyOf = (c?: Partial<Client> | null): PrintParty | null =>
    c
      ? {
          name: c.name || "",
          company: c.billing_name || c.company || null,
          phone: c.phone || null,
          email: c.email || null,
          address: c.address || c.city || null,
          tax_id: c.tax_id || null,
        }
      : null;

  const docOf = (inv: Invoice): PrintDoc => ({
    kind: "facture",
    number: inv.number,
    title: inv.title,
    items: Array.isArray(inv.items) ? inv.items : [],
    subtotal: inv.subtotal || inv.total,
    discount: inv.discount || 0,
    tax_rate: Number(inv.tax_rate) || 0,
    tax_amount: inv.tax_amount || 0,
    total: inv.total,
    paid_amount: inv.paid_amount || 0,
    issue_date: inv.issue_date,
    due_date: inv.due_date,
    terms: inv.terms,
    status: effectiveInvoiceStatus(inv),
  });

  const viewerNode = viewing ? (
    <PreviewOverlay
      open
      onClose={() => setViewing(null)}
      doc={docOf(viewing)}
      seller={seller}
      client={partyOf(viewing.pro_clients)}
      onDownload={() => openPdf(viewing)}
      note="Facture enregistrée. « Télécharger le PDF » produit exactement cette feuille."
    />
  ) : null;

  /* ---------------- Actions ---------------- */

  function openNew() {
    setEditing(null);
    const due = new Date();
    due.setDate(due.getDate() + 30);
    setForm({
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: due.toISOString().slice(0, 10),
    });
    setItems([{ label: "", qty: 1, unit_price: 0 }]);
    setDiscount(0);
    setTaxRate(0);
    setView("form");
  }

  function openEdit(inv: Invoice) {
    setEditing(inv);
    setForm({
      title: inv.title || "",
      client_id: inv.client_id || "",
      project_id: inv.project_id || "",
      issue_date: inv.issue_date || "",
      due_date: inv.due_date || "",
      terms: inv.terms || "",
    });
    setItems(Array.isArray(inv.items) && inv.items.length ? inv.items : [{ label: "", qty: 1, unit_price: 0 }]);
    setDiscount(inv.discount || 0);
    setTaxRate(Number(inv.tax_rate) || 0);
    setView("form");
  }

  async function openDetail(id: string) {
    setBusy(true);
    const { ok, data } = await api("invoices", { action: "get", id });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Facture indisponible"));
    setDetail(data as Detail);
    setView("detail");
  }

  async function save() {
    const clean = items.filter((i) => i.label.trim());
    if (!form.title?.trim()) return toast("⚠ Indiquez l'objet de la facture.");
    if (!clean.length) return toast("⚠ Ajoutez au moins une ligne.");

    setBusy(true);
    const payload: Record<string, unknown> = {
      action: editing ? "update" : "create",
      title: form.title,
      client_id: form.client_id || "",
      project_id: form.project_id || "",
      items: clean,
      discount,
      tax_rate: taxRate,
      issue_date: form.issue_date || "",
      due_date: form.due_date || "",
      terms: form.terms || "",
    };
    if (editing) payload.id = editing.id;

    const { ok, data } = await api("invoices", payload);
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));
    toast(editing ? "✓ Facture mise à jour" : `✓ Facture ${data.invoice.number} créée`);
    setView("list");
    setEditing(null);
    load();
  }

  async function fromQuote(q: Quote) {
    setBusy(true);
    const { ok, data } = await api("invoices", { action: "create", quote_id: q.id });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));
    toast(`✓ Facture ${data.invoice.number} créée`);
    load();
  }

  async function send(inv: Invoice) {
    setBusy(true);
    const { ok, data } = await api("invoices", { action: "send", id: inv.id });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));

    const url: string = data.url;
    const phone = waNumber(data.invoice?.pro_clients?.phone || inv.pro_clients?.phone);
    const msg = `Bonjour, voici votre facture ${inv.number} « ${inv.title} » : ${formatFcfa(inv.total)}\n${url}`;
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    } else {
      await navigator.clipboard?.writeText(url).catch(() => {});
      toast("✓ Lien copié (ce client n'a pas de WhatsApp enregistré)");
    }
    if (detail?.invoice.id === inv.id) openDetail(inv.id);
    load();
  }

  /** Relance d'impayé : le serveur prépare le message, on ouvre WhatsApp. */
  async function remind(inv: Invoice) {
    setBusy(true);
    const { ok, data } = await api("invoices", { action: "remind", id: inv.id });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));

    if (data.phone) {
      window.open(`https://wa.me/${data.phone}?text=${encodeURIComponent(data.message)}`, "_blank", "noopener");
      toast("✓ Relance préparée");
    } else {
      await navigator.clipboard?.writeText(data.message).catch(() => {});
      toast("✓ Message de relance copié (pas de WhatsApp enregistré)");
    }
    if (detail?.invoice.id === inv.id) openDetail(inv.id);
    load();
  }

  async function registerPayment(inv: Invoice, amount: number, method: string) {
    setBusy(true);
    const { ok, data } = await api("payments", {
      action: "create",
      invoice_id: inv.id,
      amount,
      method,
    });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));

    setPayFor(null);
    toast(
      data.partial
        ? `✓ Acompte de ${formatFcfa(data.amount)} enregistré`
        : `✓ Facture soldée (${method})`,
    );
    if (detail?.invoice.id === inv.id) openDetail(inv.id);
    load();
  }

  function removePayment(p: Payment) {
    ask(`Annuler ce paiement de ${formatFcfa(p.amount)} ?`, async () => {
      const { ok, data } = await api("payments", { action: "delete", id: p.id });
      if (!ok) return toast("⚠ " + (data.error || "Erreur"));
      toast("✓ Paiement annulé");
      if (detail) openDetail(detail.invoice.id);
      load();
    });
  }

  function cancel(inv: Invoice) {
    ask(`Annuler la facture ${inv.number} ? Elle restera visible mais ne comptera plus.`, async () => {
      const { ok, data } = await api("invoices", { action: "cancel", id: inv.id });
      if (!ok) return toast("⚠ " + (data.error || "Erreur"));
      toast("✓ Facture annulée");
      if (detail?.invoice.id === inv.id) openDetail(inv.id);
      load();
    });
  }

  function remove(inv: Invoice) {
    ask(`Supprimer définitivement la facture ${inv.number} ?`, async () => {
      const { ok, data } = await api("invoices", { action: "delete", id: inv.id });
      if (!ok) return toast("⚠ " + (data.error || "Erreur"));
      toast("✓ Facture supprimée");
      setView("list");
      load();
    });
  }

  function openPdf(inv: Invoice) {
    window.open(`/facture/${inv.public_token}/imprimer`, "_blank", "noopener");
  }

  /**
   * Lien public de la facture, tel que le client le reçoit.
   *
   * Il n'existait que par « Envoyer », qui part directement sur WhatsApp — et
   * ne copiait le lien QUE si le client n'avait pas de numéro. Impossible donc
   * d'envoyer une facture par e-mail, SMS ou Messenger. Les devis avaient déjà
   * ce bouton ; les factures ne l'avaient pas.
   */
  async function copyLink(inv: Invoice) {
    await navigator.clipboard?.writeText(`${window.location.origin}/facture/${inv.public_token}`).catch(() => {});
    toast("✓ Lien de la facture copié");
  }

  /* ---------------- Rendu ---------------- */

  if (needsMigration) return <MigrationNotice what="Table des factures à créer" />;
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
          parent="Factures"
          current={editing ? `Modifier ${editing.number}` : "Nouvelle facture"}
        />

        {clients.length === 0 ? (
          <Empty
            icon="👥"
            title="Ajoutez d'abord un client"
            sub="Une facture est toujours adressée à un client."
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
                  <F l="Objet de la facture" v={form.title} set={(v) => setForm({ ...form, title: v })} ph="Ex : Prestation de design" />
                  <Select
                    l="Projet (optionnel)"
                    v={form.project_id}
                    set={(v) => setForm({ ...form, project_id: v })}
                    options={projectOptions}
                    placeholder={projects.length ? "Aucun projet rattaché" : "Aucun projet créé"}
                  />
                  <div />
                  <F l="Date d'émission" v={form.issue_date} set={(v) => setForm({ ...form, issue_date: v })} type="date" />
                  <F
                    l="Date d'échéance"
                    v={form.due_date}
                    set={(v) => setForm({ ...form, due_date: v })}
                    type="date"
                    hint="30 jours par défaut."
                  />
                </div>
              </Section>

              <Section icon="📋" title="Lignes de la facture">
                <ItemsEditor items={items} setItems={setItems} placeholder="Ex : Prestation réalisée" notify={toast} />
              </Section>

              <Section icon="💰" title="Remise et taxes">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MoneyField l="Remise" v={discount} set={setDiscount} hint="Montant déduit du sous-total HT." />
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
                  </div>
                </div>
              </Section>

              <Section icon="📄" title="Conditions de paiement">
                <textarea
                  className={`${input} min-h-[80px] resize-none`}
                  placeholder="Ex : Paiement à 30 jours. Wave ou Orange Money au 77 000 00 00."
                  value={form.terms || ""}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                />
              </Section>
            </div>

            <PreviewAside
              doc={previewDoc}
              seller={seller}
              client={previewClient}
              actionLabel={editing ? "Enregistrer" : "Créer la facture"}
              onAction={save}
              busy={busy}
              onExpand={() => setPreviewOpen(true)}
            />

            <MobileActionBar
              label={editing ? "Enregistrer" : "Créer la facture"}
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

  /* ===== Fiche facture ===== */
  if (view === "detail" && detail) {
    const inv = detail.invoice;
    const status = effectiveInvoiceStatus(inv);
    const remaining = Math.max(0, (inv.total || 0) - (inv.paid_amount || 0));
    const left = daysUntil(inv.due_date);
    const pct = inv.total > 0 ? Math.round(((inv.paid_amount || 0) / inv.total) * 100) : 0;

    return (
      <div className="mx-auto w-full max-w-[980px] xl:max-w-[1180px]">
        {confirmNode}
        {viewerNode}
        {payFor && (
          <PaymentDialog
            key={payFor.id}
            invoice={payFor}
            busy={busy}
            onClose={() => setPayFor(null)}
            onSubmit={(amount, method) => registerPayment(payFor, amount, method)}
          />
        )}
        <Crumb onBack={() => setView("list")} parent="Factures" current={inv.number || inv.title} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-4">
            <div className={`${card} p-4 sm:p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-[1.15rem] font-extrabold text-gray-900 dark:text-white">{inv.title}</h2>
                    <Badge cls={INVOICE_STYLE[status] || INVOICE_STYLE.draft}>{INVOICE_LABELS[status] || status}</Badge>
                  </div>
                  <p className="text-[.82rem] text-gray-500">
                    {inv.number}
                    {inv.pro_clients ? ` · ${inv.pro_clients.company || inv.pro_clients.name}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[1.25rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                    {formatFcfa(inv.total)}
                  </div>
                  {inv.tax_rate > 0 && <div className="text-[.7rem] text-gray-400">TTC · TVA {inv.tax_rate} %</div>}
                </div>
              </div>

              {inv.total > 0 && (inv.paid_amount || 0) > 0 && status !== "cancelled" && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[.75rem]">
                    <span className="font-bold text-gray-600 dark:text-gray-400">
                      Encaissé {formatFcfa(inv.paid_amount)}
                    </span>
                    <span className="font-mono font-extrabold text-gray-900 dark:text-white">{pct} %</span>
                  </div>
                  <Progress value={pct} />
                </div>
              )}

              <div className="mt-4 grid gap-2.5 border-t border-gray-100 pt-3.5 text-[.82rem] dark:border-white/10 sm:grid-cols-3">
                <Meta label="Émise le" value={formatDate(inv.issue_date)} />
                <Meta
                  label="Échéance"
                  value={
                    !inv.due_date ? "—"
                    : status === "paid" ? formatDate(inv.due_date)
                    : left == null ? formatDate(inv.due_date)
                    : left < 0 ? `en retard de ${Math.abs(left)} j`
                    : left === 0 ? "aujourd'hui"
                    : `dans ${left} j`
                  }
                  tone={status === "late" ? "red" : undefined}
                />
                <Meta label="Reste dû" value={formatFcfa(remaining)} tone={remaining > 0 ? "red" : undefined} />
              </div>

              {inv.reminded_at && (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[.78rem] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                  🔔 Dernière relance {timeAgo(inv.reminded_at)}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3.5 dark:border-white/10">
                {status !== "paid" && status !== "cancelled" && (
                  <button
                    onClick={() => setPayFor(inv)}
                    disabled={busy}
                    className="btn btn-green px-4 py-2 text-[.8rem] font-bold disabled:opacity-50"
                  >
                    💰 Enregistrer un paiement
                  </button>
                )}
                {status !== "cancelled" && (
                  <button
                    onClick={() => send(inv)}
                    disabled={busy}
                    className="rounded-xl bg-[#25D366] px-4 py-2 text-[.8rem] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {inv.status === "draft" ? "💬 Envoyer" : "↻ Renvoyer"}
                  </button>
                )}
                {(status === "late" || status === "partial" || status === "sent") && (
                  <button onClick={() => remind(inv)} disabled={busy} className={btnGhost}>🔔 Relancer</button>
                )}
                <button onClick={() => setViewing(inv)} className={btnGhost}>👁 Voir la facture</button>
                <button onClick={() => copyLink(inv)} className={btnGhost}>🔗 Copier le lien</button>
                <button onClick={() => openPdf(inv)} className={btnGhost}>⬇ Télécharger</button>
                {(inv.paid_amount || 0) === 0 && status !== "cancelled" && (
                  <button onClick={() => openEdit(inv)} className={btnGhost}>✏️ Modifier</button>
                )}
                {status !== "cancelled" && (inv.paid_amount || 0) === 0 && (
                  <button onClick={() => cancel(inv)} className={btnGhost}>Annuler la facture</button>
                )}
                {(inv.paid_amount || 0) === 0 && (
                  <button onClick={() => remove(inv)} className={`${btnGhost} text-brand-red`}>Supprimer</button>
                )}
              </div>

              {/* Trois boutons disparaissent d'un coup dès le premier
                  encaissement. Sans un mot d'explication, on croit à une panne
                  plutôt qu'à une règle — et on cherche le bouton ailleurs. */}
              {(inv.paid_amount || 0) > 0 && status !== "cancelled" && (
                <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-[.78rem] font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-300">
                  🔒 Facture encaissée : elle ne peut plus être modifiée, annulée ni supprimée.
                  Pour corriger une erreur, supprimez d&apos;abord le paiement dans l&apos;historique ci-dessous.
                </p>
              )}
            </div>

            <Section icon="📋" title="Détail">
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/10">
                {(inv.items || []).map((it, i) => (
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

            {inv.terms && (
              <Section icon="📄" title="Conditions de paiement">
                <p className="whitespace-pre-line text-[.85rem] leading-relaxed text-gray-600 dark:text-gray-300">{inv.terms}</p>
              </Section>
            )}

            <Section icon="💰" title="Historique des paiements">
              {detail.payments.length === 0 ? (
                <p className="py-2 text-[.82rem] text-gray-400">Aucun paiement enregistré.</p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/10">
                  {detail.payments.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-green/10 text-[.9rem]">💰</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[.85rem] font-bold text-gray-900 dark:text-white">
                          {p.method || "Paiement"}
                        </div>
                        <div className="text-[.72rem] text-gray-500">{formatDate(p.paid_at)}</div>
                      </div>
                      <span className="shrink-0 font-mono text-[.88rem] font-extrabold tabular-nums text-green">
                        + {formatFcfa(p.amount)}
                      </span>
                      <button
                        onClick={() => removePayment(p)}
                        aria-label="Annuler ce paiement"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-brand-red dark:hover:bg-red-500/10"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <div className="flex flex-col gap-4">
            <TotalsBox
              subtotal={inv.subtotal || inv.total}
              discount={inv.discount || 0}
              taxRate={Number(inv.tax_rate) || 0}
              taxAmount={inv.tax_amount || 0}
              total={inv.total}
              title="Récapitulatif"
            />

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
    draft: withStatus.filter((i) => i.status === "draft").length,
    unpaid: withStatus.filter((i) => i.status !== "paid" && i.status !== "cancelled" && i.status !== "draft").length,
    late: withStatus.filter((i) => i.status === "late").length,
    paid: withStatus.filter((i) => i.status === "paid").length,
  };

  return (
    <div className="mx-auto w-full max-w-[980px] xl:max-w-[1180px]">
      {confirmNode}
      {viewerNode}
      {payFor && (
        <PaymentDialog
          invoice={payFor}
          busy={busy}
          onClose={() => setPayFor(null)}
          onSubmit={(amount, method) => registerPayment(payFor, amount, method)}
        />
      )}

      <PageHead
        title="Factures"
        count={`${invoices.length} facture${invoices.length > 1 ? "s" : ""} · ${counts.unpaid} impayée${counts.unpaid > 1 ? "s" : ""}`}
        action="+ Nouvelle facture"
        onAction={openNew}
      />

      {invoices.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Facturé" value={formatFcfa(stats.billed)} small />
          <Kpi label="Encaissé" value={formatFcfa(stats.cashed)} tone="green" small />
          <Kpi label="Reste à encaisser" value={formatFcfa(stats.outstanding)} tone={stats.outstanding ? "amber" : undefined} small />
          <Kpi
            label="En retard"
            value={formatFcfa(stats.overdueAmount)}
            tone={stats.overdueCount ? "red" : undefined}
            sub={`${stats.overdueCount} facture(s)`}
            small
          />
        </div>
      )}

      {/* Rattrapage : devis acceptés sans facture */}
      {toInvoice.length > 0 && (
        <div className="mb-4 rounded-2xl border border-green/25 bg-green/5 p-4">
          <div className="text-[.8rem] font-extrabold text-gray-900 dark:text-white">
            {toInvoice.length} devis accepté{toInvoice.length > 1 ? "s" : ""} à facturer
          </div>
          <div className="mt-2.5 flex flex-col gap-2">
            {toInvoice.map((q) => (
              <div key={q.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 dark:bg-dark-800">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[.86rem] font-bold text-gray-900 dark:text-white">{q.title}</div>
                  <div className="truncate text-[.74rem] text-gray-500">
                    {q.pro_clients?.company || q.pro_clients?.name || "Sans client"} · {formatFcfa(q.total)}
                  </div>
                </div>
                <button
                  onClick={() => fromQuote(q)}
                  disabled={busy}
                  className="btn btn-green shrink-0 px-4 py-2 text-[.8rem] font-bold disabled:opacity-50"
                >
                  Facturer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <Empty
          icon="🧾"
          title="Aucune facture"
          sub="Dès qu'un client accepte un devis, sa facture est créée automatiquement. Vous pouvez aussi en créer une librement."
          cta="+ Nouvelle facture"
          onCta={openNew}
        />
      ) : (
        <>
          <FilterBar
            query={query}
            setQuery={setQuery}
            placeholder="Rechercher une facture, un client, un numéro…"
            active={filter}
            setActive={setFilter}
            filters={[
              { value: "all", label: "Toutes", count: counts.all },
              { value: "unpaid", label: "Impayées", count: counts.unpaid },
              { value: "late", label: "En retard", count: counts.late },
              { value: "paid", label: "Payées", count: counts.paid },
              { value: "draft", label: "Brouillons", count: counts.draft },
            ]}
          />

          {filtered.length === 0 ? (
            <div className={`${card} px-6 py-10 text-center`}>
              <p className="text-[.86rem] text-gray-500">Aucune facture ne correspond à cette recherche.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((inv) => {
                const remaining = Math.max(0, (inv.total || 0) - (inv.paid_amount || 0));
                const left = daysUntil(inv.due_date);
                return (
                  <div key={inv.id} className={`${card} p-4`}>
                    <button onClick={() => openDetail(inv.id)} className="flex w-full items-start gap-3 text-left">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-[.95rem] font-extrabold text-gray-900 dark:text-white">
                            {inv.title}
                          </span>
                          <Badge cls={INVOICE_STYLE[inv.status] || INVOICE_STYLE.draft}>
                            {INVOICE_LABELS[inv.status] || inv.status}
                          </Badge>
                        </div>
                        <div className="mt-0.5 truncate text-[.78rem] text-gray-500">
                          {inv.pro_clients?.company || inv.pro_clients?.name || "Sans client"}
                          {inv.number ? ` · ${inv.number}` : ""}
                          {inv.due_date && inv.status !== "paid"
                            ? left != null && left < 0
                              ? ` · en retard de ${Math.abs(left)} j`
                              : ` · échéance ${formatDate(inv.due_date)}`
                            : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-[1rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                          {formatFcfa(inv.total)}
                        </div>
                        {remaining > 0 && remaining !== inv.total && (
                          <div className="text-[.68rem] text-amber-600 dark:text-amber-400">
                            reste {formatFcfa(remaining)}
                          </div>
                        )}
                      </div>
                    </button>

                    {inv.status !== "cancelled" && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
                        {inv.status !== "paid" && (
                          <button
                            onClick={() => setPayFor(inv)}
                            disabled={busy}
                            className="flex-1 rounded-xl bg-green px-4 py-2.5 text-[.83rem] font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                          >
                            💰 Enregistrer un paiement
                          </button>
                        )}
                        {(inv.status === "late" || inv.status === "partial") && (
                          <button onClick={() => remind(inv)} disabled={busy} className={btnGhost}>🔔 Relancer</button>
                        )}
                        <button onClick={() => setViewing(inv)} className={btnGhost}>👁 Voir</button>
                        <button onClick={() => send(inv)} disabled={busy} className={btnGhost}>💬 Envoyer</button>
                        <button onClick={() => copyLink(inv)} className={btnGhost}>🔗 Lien</button>
                        <button onClick={() => openPdf(inv)} className={btnGhost}>⬇ Télécharger</button>
                      </div>
                    )}
                  </div>
                );
              })}
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

/**
 * Saisie d'un encaissement. Le montant est prérempli au restant dû (cas le plus
 * fréquent) mais reste modifiable pour enregistrer un acompte.
 */
function PaymentDialog({
  invoice, busy, onClose, onSubmit,
}: {
  invoice: Invoice;
  busy: boolean;
  onClose: () => void;
  onSubmit: (amount: number, method: string) => void;
}) {
  const remaining = Math.max(0, (invoice.total || 0) - (invoice.paid_amount || 0));
  const [amount, setAmount] = useState(remaining);
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className={`${cardRaised} w-full max-w-[420px] p-5`} onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-[1.05rem] font-extrabold text-gray-900 dark:text-white">
          Enregistrer un paiement
        </h3>
        <p className="mt-0.5 text-[.8rem] text-gray-500">
          {invoice.number} · reste dû {formatFcfa(remaining)}
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <MoneyField l="Montant reçu" v={amount} set={setAmount} />
          {amount > 0 && amount < remaining && (
            <p className="rounded-xl bg-blue-50 px-3 py-2 text-[.76rem] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              Acompte : il restera {formatFcfa(remaining - amount)} à encaisser.
            </p>
          )}

          <div>
            <span className={lbl}>Moyen de paiement</span>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`rounded-lg border px-3 py-1.5 text-[.78rem] font-semibold transition ${
                    method === m
                      ? "border-green bg-green text-white"
                      : "border-gray-200 text-gray-600 hover:border-green/50 dark:border-white/15 dark:text-gray-300"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-[.83rem] font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Annuler
          </button>
          <button
            onClick={() => onSubmit(amount, method)}
            disabled={busy || amount <= 0}
            className="btn btn-green flex-1 py-2.5 text-[.83rem] font-extrabold disabled:opacity-50"
          >
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
