"use client";

// Clients — portefeuille et relation commerciale.
// Trois vues : la liste (recherche + filtres), le formulaire, et la fiche
// détaillée qui rassemble tout l'historique d'un client au même endroit.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatFcfa, waNumber, CLIENT_LABELS, SECTORS, effectiveQuoteStatus,
} from "@/lib/pro";
import {
  api, card, input, lbl, Badge, Crumb, Empty, F, FilterBar, MigrationNotice,
  PageHead, Section, Select, useConfirm, CLIENT_STYLE,
  type Client, type Invoice, type Payment, type ProEvent, type Project, type Quote, type Toast,
  TONE_TEXT,
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
  // Les champs avancés (entreprise, facturation, secteur, notes) restent
  // repliés pour une première saisie — un maçon n'a besoin que d'un nom et
  // d'un numéro pour envoyer un devis. On les déplie automatiquement en
  // modification, pour ne jamais cacher une info déjà renseignée.
  const [showMore, setShowMore] = useState(false);

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
    setShowMore(false);
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
    setShowMore(Boolean(c.company || c.email || c.city || c.address || c.sector || c.notes || c.billing_name || c.tax_id));
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

  /* ===== Formulaire — l'essentiel d'abord (nom + téléphone), le reste
     replié : la plupart des clients d'un artisan n'ont besoin de rien de
     plus pour recevoir un devis par WhatsApp. ===== */
  if (view === "form") {
    return (
      <div className="mx-auto w-full max-w-[480px]">
        {confirmNode}
        <Crumb
          onBack={() => { setView("list"); setEditing(null); }}
          parent="Clients"
          current={editing ? `Modifier ${editing.company || editing.name}` : "Ajouter un client"}
        />

        <div className="flex flex-col gap-4">
          <Section icon="👤" title="Le client">
            <div className="grid gap-3">
              {editing ? (
                <F l="Nom complet" v={form.name} set={(v) => setForm({ ...form, name: v })} ph="Ex : Mariama Diallo" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <F l="Prénom" v={form.firstname} set={(v) => setForm({ ...form, firstname: v })} ph="Ex : Mariama" />
                  <F l="Nom" v={form.lastname} set={(v) => setForm({ ...form, lastname: v })} ph="Ex : Diallo" />
                </div>
              )}
              <F l="Téléphone (WhatsApp)" v={form.phone} set={(v) => setForm({ ...form, phone: v })} ph="+221 77 000 00 00" />
            </div>
          </Section>

          {!showMore ? (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="text-[.82rem] font-bold text-green transition hover:underline"
            >
              + Ajouter entreprise, adresse, notes…
            </button>
          ) : (
            <>
              <Section icon="🏢" title="Entreprise et facturation (optionnel)">
                <div className="grid gap-3 sm:grid-cols-2">
                  <F l="Entreprise / Structure" v={form.company} set={(v) => setForm({ ...form, company: v })} ph="Ex : Tekki Foods" />
                  <F l="Ville" v={form.city} set={(v) => setForm({ ...form, city: v })} ph="Ex : Dakar, Plateau" />
                  <F l="Adresse email" v={form.email} set={(v) => setForm({ ...form, email: v })} ph="client@entreprise.sn" />
                  <F l="NINEA / RCCM" v={form.tax_id} set={(v) => setForm({ ...form, tax_id: v })} ph="Ex : 005812345 2A2" />
                  <div className="sm:col-span-2">
                    <F
                      l="Raison sociale (sur la facture)"
                      v={form.billing_name}
                      set={(v) => setForm({ ...form, billing_name: v })}
                      ph="Ex : TEKKI FOODS SARL"
                      hint="Laissez vide pour reprendre le nom de l'entreprise."
                    />
                  </div>
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
                  className={`${input} min-h-[80px] resize-none`}
                  placeholder="Préférences du client, budget habituel…"
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
                <p className="mt-1.5 text-[.72rem] text-gray-400">Visible par vous seul.</p>
              </Section>

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
              </div>
            </>
          )}

          <button
            onClick={save}
            disabled={busy}
            className="btn btn-green w-full py-3.5 text-[.9rem] font-extrabold disabled:opacity-50"
          >
            {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Enregistrer le client"}
          </button>
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
    const extraInfo = [c.email, c.city, c.sector, c.billing_name, c.tax_id, c.address].some(Boolean);

    return (
      <div className="mx-auto w-full max-w-[560px]">
        {confirmNode}
        <Crumb onBack={() => setView("list")} parent="Clients" current={c.company || c.name} />

        <div className="flex flex-col gap-4">
          {/* En-tête — juste l'essentiel pour contacter le client. */}
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
                {c.phone && <p className="mt-0.5 text-[.85rem] text-gray-600 dark:text-gray-300">📞 {c.phone}</p>}
              </div>
            </div>

            {extraInfo && (
              <div className="mt-3 grid gap-2 border-t border-gray-100 pt-3 text-[.8rem] dark:border-white/10 sm:grid-cols-2">
                <Info icon="✉️" label="Email" value={c.email} link={c.email ? `mailto:${c.email}` : undefined} />
                <Info icon="📍" label="Ville" value={c.city} />
                <Info icon="🏷️" label="Secteur" value={c.sector} />
                <Info icon="🏢" label="Raison sociale" value={c.billing_name} />
                <Info icon="🧾" label="NINEA / RCCM" value={c.tax_id} />
                {c.address && <div className="sm:col-span-2"><Info icon="🗺️" label="Adresse" value={c.address} /></div>}
              </div>
            )}

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
              <button onClick={() => archive(c)} className={`${btnGhost} text-brand-red`}>
                Archiver
              </button>
            </div>
          </div>

          {/* Portefeuille — un chiffre, sans détail à faire défiler. */}
          <div className="rounded-2xl border border-green/25 bg-green/5 p-4">
            <div className="text-[.68rem] font-bold uppercase tracking-wider text-green">Suivi des paiements</div>
            <dl className="mt-2.5 flex flex-col gap-2 text-[.82rem]">
              <Line label="Total facturé" value={formatFcfa(totalInvoiced)} />
              <Line label="Encaissé" value={formatFcfa(totalPaid)} tone="green" />
              <Line label="Reste dû" value={formatFcfa(outstanding)} tone={outstanding > 0 ? "amber" : undefined} />
            </dl>
          </div>

          {/* Projets / Devis / Factures — un compteur qui renvoie vers
              l'écran dédié, plutôt que trois listes empilées à faire défiler. */}
          <div className="grid grid-cols-3 gap-2.5">
            <CountTile icon="📁" label="Projets" count={detail.projects.length} onClick={() => goTo("projects")} />
            <CountTile icon="📄" label="Devis" count={detail.quotes.length} onClick={() => goTo("quotes")} />
            <CountTile icon="🧾" label="Factures" count={detail.invoices.length} onClick={() => goTo("invoices")} />
          </div>

          {c.notes && (
            <Section icon="📝" title="Notes internes">
              <p className="whitespace-pre-line text-[.85rem] leading-relaxed text-gray-600 dark:text-gray-300">
                {c.notes}
              </p>
            </Section>
          )}
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
  const color = TONE_TEXT[tone || "neutral"];
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-600 dark:text-gray-400">{label}</dt>
      <dd className={`font-mono font-extrabold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

/** Compteur qui renvoie vers l'écran dédié — remplace une liste à faire défiler. */
function CountTile({ icon, label, count, onClick }: { icon: string; label: string; count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${card} p-3.5 text-center transition hover:border-green/40 hover:shadow`}>
      <div className="text-[1.3rem]">{icon}</div>
      <div className="mt-1 font-mono text-[1.15rem] font-extrabold tabular-nums text-gray-900 dark:text-white">{count}</div>
      <div className="text-[.7rem] font-semibold text-gray-500">{label}</div>
    </button>
  );
}
