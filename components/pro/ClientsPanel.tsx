"use client";

// Clients — portefeuille et relation commerciale.
// Trois vues : la liste (recherche + filtres), le formulaire, et la fiche
// détaillée qui rassemble tout l'historique d'un client au même endroit.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatFcfa, formatDate, timeAgo, waNumber,
  CLIENT_LABELS, QUOTE_LABELS, INVOICE_LABELS, PROJECT_LABELS, SECTORS,
  effectiveQuoteStatus, effectiveInvoiceStatus,
} from "@/lib/pro";
import {
  api, card, input, lbl, Badge, Crumb, Empty, F, FilterBar, MigrationNotice,
  PageHead, Section, Select, Tip, useConfirm,
  CLIENT_STYLE, QUOTE_STYLE, INVOICE_STYLE, PROJECT_STYLE,
  type Client, type Invoice, type Payment, type ProEvent, type Project, type Quote, type Toast,
} from "./ui";

type Detail = {
  client: Client;
  projects: Project[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  events: ProEvent[];
};

export default function ClientsPanel({ toast, goTo }: { toast: Toast; goTo: (p: string) => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [busy, setBusy] = useState(false);

  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [editing, setEditing] = useState<Client | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState<Record<string, string>>({});

  const { ask, confirmNode } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    const [c, q] = await Promise.all([
      api("clients", { action: "list" }),
      api("quotes", { action: "list" }),
    ]);
    if (c.data?.needsMigration) setNeedsMigration(true);
    setClients(c.data?.clients || []);
    setQuotes(q.data?.quotes || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const quotesByClient = useMemo(() => {
    const m: Record<string, { count: number; amount: number }> = {};
    for (const q of quotes) {
      if (!q.client_id) continue;
      const e = (m[q.client_id] ||= { count: 0, amount: 0 });
      e.count += 1;
      if (effectiveQuoteStatus(q) === "accepted") e.amount += q.total || 0;
    }
    return m;
  }, [quotes]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!needle) return true;
      return [c.name, c.company, c.phone, c.email, c.city, c.sector, c.tracking_code]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [clients, query, filter]);

  /* ---------------- Actions ---------------- */

  function openNew() {
    setEditing(null);
    setForm({ status: "prospect" });
    setView("form");
  }

  function openEdit(c: Client) {
    setEditing(c);
    setForm({
      name: c.name || "",
      company: c.company || "",
      phone: c.phone || "",
      email: c.email || "",
      city: c.city || "",
      address: c.address || "",
      sector: c.sector || "",
      notes: c.notes || "",
      billing_name: c.billing_name || "",
      tax_id: c.tax_id || "",
      status: c.status || "prospect",
    });
    setView("form");
  }

  async function openDetail(id: string) {
    setBusy(true);
    const { ok, data } = await api("clients", { action: "get", id });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Fiche indisponible"));
    setDetail(data as Detail);
    setView("detail");
  }

  async function save() {
    const name =
      [form.firstname, form.lastname].filter(Boolean).join(" ").trim() ||
      form.name?.trim() ||
      form.company?.trim();
    if (!name) return toast("⚠ Indiquez au moins un nom ou une entreprise.");

    setBusy(true);
    const payload: Record<string, unknown> = {
      action: editing ? "update" : "create",
      name,
      company: form.company || "",
      phone: form.phone || "",
      email: form.email || "",
      city: form.city || "",
      address: form.address || "",
      sector: form.sector || "",
      notes: form.notes || "",
      billing_name: form.billing_name || "",
      tax_id: form.tax_id || "",
      status: form.status || "prospect",
    };
    if (editing) payload.id = editing.id;

    const { ok, data } = await api("clients", payload);
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));

    toast(editing ? "✓ Fiche client mise à jour" : `✓ Client enregistré · code ${data.client.tracking_code}`);
    setForm({});
    setEditing(null);
    setView("list");
    load();
  }

  async function setStatus(c: Client, status: string) {
    setBusy(true);
    const { ok, data } = await api("clients", { action: "update", id: c.id, status });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));
    toast(`✓ ${c.company || c.name} — ${CLIENT_LABELS[status]}`);
    if (detail?.client.id === c.id) setDetail({ ...detail, client: { ...detail.client, status } });
    load();
  }

  function archive(c: Client) {
    ask(`Archiver « ${c.company || c.name} » ? Ses devis et factures sont conservés.`, async () => {
      const { ok, data } = await api("clients", { action: "delete", id: c.id });
      if (!ok) return toast("⚠ " + (data.error || "Erreur"));
      toast("✓ Client archivé");
      setView("list");
      load();
    });
  }

  /* ---------------- Rendu ---------------- */

  if (needsMigration) return <MigrationNotice />;
  if (loading) return <div className="py-16 text-center text-gray-400">Chargement…</div>;

  /* ===== Formulaire ===== */
  if (view === "form") {
    return (
      <div className="mx-auto w-full max-w-[980px] xl:max-w-[1180px]">
        {confirmNode}
        <Crumb
          onBack={() => { setView("list"); setEditing(null); }}
          parent="Clients"
          current={editing ? `Modifier ${editing.company || editing.name}` : "Ajouter un client"}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4">
            <Section icon="👤" title="Identité du client">
              <div className="grid gap-3 sm:grid-cols-2">
                {editing ? (
                  <F l="Nom complet" v={form.name} set={(v) => setForm({ ...form, name: v })} ph="Ex : Mariama Diallo" />
                ) : (
                  <>
                    <F l="Prénom" v={form.firstname} set={(v) => setForm({ ...form, firstname: v })} ph="Ex : Mariama" />
                    <F l="Nom" v={form.lastname} set={(v) => setForm({ ...form, lastname: v })} ph="Ex : Diallo" />
                  </>
                )}
                <F l="Entreprise / Structure" v={form.company} set={(v) => setForm({ ...form, company: v })} ph="Ex : Tekki Foods" />
                <F l="Ville / Localisation" v={form.city} set={(v) => setForm({ ...form, city: v })} ph="Ex : Dakar, Plateau" />
              </div>
            </Section>

            <Section icon="📞" title="Coordonnées">
              <div className="grid gap-3 sm:grid-cols-2">
                <F l="Téléphone (WhatsApp)" v={form.phone} set={(v) => setForm({ ...form, phone: v })} ph="+221 77 000 00 00" />
                <F l="Adresse email" v={form.email} set={(v) => setForm({ ...form, email: v })} ph="client@entreprise.sn" />
              </div>
            </Section>

            <Section icon="🧾" title="Informations de facturation">
              <div className="grid gap-3 sm:grid-cols-2">
                <F
                  l="Raison sociale (sur la facture)"
                  v={form.billing_name}
                  set={(v) => setForm({ ...form, billing_name: v })}
                  ph="Ex : TEKKI FOODS SARL"
                  hint="Laissez vide pour reprendre le nom de l'entreprise."
                />
                <F l="NINEA / RCCM" v={form.tax_id} set={(v) => setForm({ ...form, tax_id: v })} ph="Ex : 005812345 2A2" />
                <div className="sm:col-span-2">
                  <F l="Adresse de facturation" v={form.address} set={(v) => setForm({ ...form, address: v })} ph="Ex : 12 rue Carnot, Dakar" />
                </div>
              </div>
            </Section>

            <Section icon="🏷️" title="Secteur d'activité">
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, sector: form.sector === s ? "" : s })}
                    className={`rounded-full border px-3.5 py-1.5 text-[.8rem] font-semibold transition ${
                      form.sector === s
                        ? "border-green bg-green text-white"
                        : "border-gray-200 text-gray-600 hover:border-green/50 dark:border-dark-border dark:text-gray-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Section>

            <Section icon="📝" title="Notes internes">
              <textarea
                className={`${input} min-h-[96px] resize-none`}
                placeholder="Préférences du client, budget habituel, historique…"
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <p className="mt-1.5 text-[.72rem] text-gray-400">Visible par vous seul — jamais montré au client.</p>
            </Section>
          </div>

          <div className="flex flex-col gap-4">
            <div className={`${card} p-4`}>
              <Select
                l="Statut du client"
                v={form.status}
                set={(v) => setForm({ ...form, status: v })}
                options={[
                  { value: "prospect", label: "Prospect — pas encore client" },
                  { value: "active", label: "Actif — relation en cours" },
                  { value: "inactive", label: "Inactif — dormant" },
                ]}
              />
              <p className="mt-1.5 text-[.72rem] text-gray-400">
                Un prospect passe automatiquement en « Actif » dès l&apos;envoi d&apos;un devis.
              </p>
            </div>

            <div className="rounded-2xl border border-green/25 bg-green/5 p-4">
              <div className="text-[.68rem] font-bold uppercase tracking-wider text-green">Code de suivi</div>
              <div className="mt-2 font-mono text-[1.5rem] font-extrabold tracking-widest text-gray-900 dark:text-white">
                {editing ? editing.tracking_code : "XXX-0000"}
              </div>
              <p className="mt-1.5 text-[.76rem] leading-relaxed text-gray-600 dark:text-gray-400">
                {editing
                  ? "Ce code identifie le client dans vos échanges."
                  : "Généré automatiquement à l'enregistrement."}{" "}
                Il permet à votre client de suivre ses devis <b>sans créer de compte</b>.
              </p>
            </div>

            {!editing && (
              <div className={`${card} p-4`}>
                <div className="text-[.68rem] font-bold uppercase tracking-wider text-gray-400">Conseils</div>
                <ul className="mt-2 flex flex-col gap-2.5">
                  <Tip icon="💬">Renseignez le <b>WhatsApp</b> : c&apos;est par là que partiront les devis, en un clic.</Tip>
                  <Tip icon="🧾">Le <b>NINEA</b> apparaîtra sur les factures des clients qui le réclament.</Tip>
                </ul>
              </div>
            )}

            <button
              onClick={save}
              disabled={busy}
              className="btn btn-green w-full py-3 text-[.88rem] font-extrabold disabled:opacity-50"
            >
              {busy ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Enregistrer le client"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ===== Fiche détaillée ===== */
  if (view === "detail" && detail) {
    const c = detail.client;
    const totalInvoiced = detail.invoices
      .filter((i) => i.status !== "draft" && i.status !== "cancelled")
      .reduce((s, i) => s + (i.total || 0), 0);
    const totalPaid = detail.payments.reduce((s, p) => s + (p.amount || 0), 0);
    const outstanding = Math.max(0, totalInvoiced - totalPaid);

    return (
      <div className="mx-auto w-full max-w-[980px] xl:max-w-[1180px]">
        {confirmNode}
        <Crumb onBack={() => setView("list")} parent="Clients" current={c.company || c.name} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-4">
            {/* En-tête */}
            <div className={`${card} p-4 sm:p-5`}>
              <div className="flex items-start gap-3.5">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-green/15 to-neon-gold/15 text-[1rem] font-extrabold text-green">
                  {(c.company || c.name).slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-[1.15rem] font-extrabold text-gray-900 dark:text-white">
                      {c.company || c.name}
                    </h2>
                    <Badge cls={CLIENT_STYLE[c.status] || CLIENT_STYLE.prospect}>
                      {CLIENT_LABELS[c.status] || c.status}
                    </Badge>
                  </div>
                  {c.company && <p className="text-[.82rem] text-gray-500">{c.name}</p>}
                  <p className="mt-1 font-mono text-[.75rem] font-bold text-gray-500">{c.tracking_code}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2.5 border-t border-gray-100 pt-3.5 text-[.82rem] dark:border-white/10 sm:grid-cols-2">
                <Info icon="📞" label="Téléphone" value={c.phone} link={c.phone ? `https://wa.me/${waNumber(c.phone)}` : undefined} />
                <Info icon="✉️" label="Email" value={c.email} link={c.email ? `mailto:${c.email}` : undefined} />
                <Info icon="📍" label="Ville" value={c.city} />
                <Info icon="🏷️" label="Secteur" value={c.sector} />
                <Info icon="🏢" label="Raison sociale" value={c.billing_name} />
                <Info icon="🧾" label="NINEA / RCCM" value={c.tax_id} />
                {c.address && <div className="sm:col-span-2"><Info icon="🗺️" label="Adresse" value={c.address} /></div>}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3.5 dark:border-white/10">
                <button onClick={() => openEdit(c)} className="btn btn-green px-4 py-2 text-[.8rem] font-bold">
                  ✏️ Modifier
                </button>
                {c.phone && (
                  <a
                    href={`https://wa.me/${waNumber(c.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-[#25D366] px-4 py-2 text-[.8rem] font-bold text-white transition hover:opacity-90"
                  >
                    💬 WhatsApp
                  </a>
                )}
                {c.status !== "active" && (
                  <button onClick={() => setStatus(c, "active")} disabled={busy} className={btnGhost}>
                    Marquer actif
                  </button>
                )}
                {c.status !== "inactive" && (
                  <button onClick={() => setStatus(c, "inactive")} disabled={busy} className={btnGhost}>
                    Marquer inactif
                  </button>
                )}
                <button onClick={() => archive(c)} className={`${btnGhost} text-brand-red`}>
                  Archiver
                </button>
              </div>
            </div>

            {c.notes && (
              <Section icon="📝" title="Notes internes">
                <p className="whitespace-pre-line text-[.85rem] leading-relaxed text-gray-600 dark:text-gray-300">
                  {c.notes}
                </p>
              </Section>
            )}

            <HistoryList
              icon="📁"
              title="Projets"
              empty="Aucun projet pour ce client."
              rows={detail.projects.map((p) => ({
                id: p.id,
                title: p.name,
                sub: `${PROJECT_LABELS[p.status] || p.status} · ${p.progress} %`,
                amount: p.budget,
                badge: PROJECT_LABELS[p.status] || p.status,
                cls: PROJECT_STYLE[p.status] || PROJECT_STYLE.planned,
              }))}
              onAll={() => goTo("projects")}
            />

            <HistoryList
              icon="📄"
              title="Devis"
              empty="Aucun devis envoyé à ce client."
              rows={detail.quotes.map((q) => {
                const s = effectiveQuoteStatus(q);
                return {
                  id: q.id,
                  title: q.title,
                  sub: [q.number, formatDate(q.created_at)].filter(Boolean).join(" · "),
                  amount: q.total,
                  badge: QUOTE_LABELS[s] || s,
                  cls: QUOTE_STYLE[s] || QUOTE_STYLE.draft,
                };
              })}
              onAll={() => goTo("quotes")}
            />

            <HistoryList
              icon="🧾"
              title="Factures"
              empty="Aucune facture pour ce client."
              rows={detail.invoices.map((i) => {
                const s = effectiveInvoiceStatus(i);
                return {
                  id: i.id,
                  title: i.title,
                  sub: [i.number, i.due_date ? `échéance ${formatDate(i.due_date)}` : null].filter(Boolean).join(" · "),
                  amount: i.total,
                  badge: INVOICE_LABELS[s] || s,
                  cls: INVOICE_STYLE[s] || INVOICE_STYLE.draft,
                };
              })}
              onAll={() => goTo("invoices")}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-green/25 bg-green/5 p-4">
              <div className="text-[.68rem] font-bold uppercase tracking-wider text-green">Suivi des paiements</div>
              <dl className="mt-2.5 flex flex-col gap-2 text-[.82rem]">
                <Line label="Total facturé" value={formatFcfa(totalInvoiced)} />
                <Line label="Encaissé" value={formatFcfa(totalPaid)} tone="green" />
                <Line label="Reste dû" value={formatFcfa(outstanding)} tone={outstanding > 0 ? "amber" : undefined} />
              </dl>
            </div>

            {detail.payments.length > 0 && (
              <div className={`${card} p-4`}>
                <h3 className="mb-2.5 font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">
                  Historique des paiements
                </h3>
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/10">
                  {detail.payments.slice(0, 10).map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 py-2">
                      <div className="min-w-0">
                        <div className="text-[.8rem] font-semibold text-gray-800 dark:text-gray-200">
                          {p.method || "Paiement"}
                        </div>
                        <div className="text-[.7rem] text-gray-400">{formatDate(p.paid_at)}</div>
                      </div>
                      <span className="shrink-0 font-mono text-[.83rem] font-extrabold tabular-nums text-green">
                        + {formatFcfa(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`${card} p-4`}>
              <h3 className="mb-2.5 font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">
                Historique
              </h3>
              {detail.events.length === 0 ? (
                <p className="py-2 text-[.78rem] text-gray-400">Aucun évènement enregistré.</p>
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

            <p className="text-center text-[.7rem] text-gray-400">
              Client depuis le {formatDate(c.created_at)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ===== Liste ===== */
  const counts = {
    all: clients.length,
    prospect: clients.filter((c) => c.status === "prospect").length,
    active: clients.filter((c) => c.status === "active").length,
    inactive: clients.filter((c) => c.status === "inactive").length,
  };

  return (
    <div className="mx-auto w-full max-w-[980px] xl:max-w-[1180px]">
      {confirmNode}
      <PageHead
        title="Clients"
        count={`${clients.length} client${clients.length > 1 ? "s" : ""} · ${counts.active} actif${counts.active > 1 ? "s" : ""}`}
        action="+ Nouveau client"
        onAction={openNew}
      />

      {clients.length === 0 ? (
        <Empty
          icon="👥"
          title="Aucun client pour l'instant"
          sub="Ajoutez votre premier client : vous pourrez ensuite lui envoyer un devis en quelques secondes."
          cta="+ Ajouter un client"
          onCta={openNew}
        />
      ) : (
        <>
          <FilterBar
            query={query}
            setQuery={setQuery}
            placeholder="Rechercher un nom, une entreprise, un téléphone, un code…"
            active={filter}
            setActive={setFilter}
            filters={[
              { value: "all", label: "Tous", count: counts.all },
              { value: "active", label: "Actifs", count: counts.active },
              { value: "prospect", label: "Prospects", count: counts.prospect },
              { value: "inactive", label: "Inactifs", count: counts.inactive },
            ]}
          />

          {filtered.length === 0 ? (
            <div className={`${card} px-6 py-10 text-center`}>
              <p className="text-[.86rem] text-gray-500">Aucun client ne correspond à cette recherche.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((c) => {
                const stat = quotesByClient[c.id];
                return (
                  <button
                    key={c.id}
                    onClick={() => openDetail(c.id)}
                    className={`${card} p-4 text-left transition hover:border-green/40 hover:shadow`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-green/15 to-neon-gold/15 text-[.85rem] font-extrabold text-green">
                        {(c.company || c.name).slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[.95rem] font-extrabold text-gray-900 dark:text-white">
                            {c.company || c.name}
                          </span>
                          <Badge cls={CLIENT_STYLE[c.status] || CLIENT_STYLE.prospect}>
                            {CLIENT_LABELS[c.status] || c.status}
                          </Badge>
                        </div>
                        {c.company && <div className="truncate text-[.78rem] text-gray-500">{c.name}</div>}
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[.74rem] text-gray-500">
                          {c.city && <span>📍 {c.city}</span>}
                          {c.phone && <span>💬 {c.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-white/10">
                      <span className="rounded-lg bg-gray-100 px-2 py-1 font-mono text-[.72rem] font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                        {c.tracking_code}
                      </span>
                      <span className="text-[.74rem] text-gray-500">
                        {stat?.count || 0} devis
                        {stat?.amount ? ` · ${formatFcfa(stat.amount)} signé` : ""}
                      </span>
                    </div>
                  </button>
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

function Info({ icon, label, value, link }: { icon: string; label: string; value?: string | null; link?: string }) {
  if (!value) return null;
  const body = (
    <>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[.68rem] font-bold uppercase tracking-wide text-gray-400">{label}</span>
        <span className="block truncate text-gray-800 dark:text-gray-200">{value}</span>
      </span>
    </>
  );
  return link ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className="flex gap-2 transition hover:text-green">
      {body}
    </a>
  ) : (
    <div className="flex gap-2">{body}</div>
  );
}

function Line({ label, value, tone }: { label: string; value: string; tone?: "green" | "amber" }) {
  const color =
    tone === "green" ? "text-green" : tone === "amber" ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white";
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-600 dark:text-gray-400">{label}</dt>
      <dd className={`font-mono font-extrabold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

function HistoryList({
  icon, title, rows, empty, onAll,
}: {
  icon: string; title: string; empty: string; onAll: () => void;
  rows: { id: string; title: string; sub: string; amount: number; badge: string; cls: string }[];
}) {
  return (
    <Section
      icon={icon}
      title={title}
      aside={
        rows.length > 0 ? (
          <button onClick={onAll} className="text-[.75rem] font-bold text-green transition hover:underline">
            Tout voir
          </button>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <p className="py-2 text-[.82rem] text-gray-400">{empty}</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/10">
          {rows.slice(0, 6).map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[.86rem] font-bold text-gray-900 dark:text-white">{r.title}</span>
                  <Badge cls={r.cls}>{r.badge}</Badge>
                </div>
                <div className="truncate text-[.72rem] text-gray-500">{r.sub}</div>
              </div>
              <span className="shrink-0 font-mono text-[.85rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                {formatFcfa(r.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
