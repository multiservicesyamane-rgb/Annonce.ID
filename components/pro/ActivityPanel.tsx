"use client";

// « Mon Activité » — le tableau de bord d'ouverture de l'espace freelance.
// Objectif : en un écran, savoir où en est l'activité et ce qu'il faut traiter
// aujourd'hui. Rien ici n'est saisissable : c'est une vue de pilotage.

import { useCallback, useEffect, useState } from "react";
import { formatFcfa, formatFcfaShort, timeAgo, formatDate } from "@/lib/pro";
import { apiGet, card, Kpi, Empty, MigrationNotice, type ProEvent, type Toast } from "./ui";
import BusinessSettings from "./BusinessSettings";

type Stats = {
  needsMigration?: boolean;
  revenue: { total: number; month: number; year: number; cashed: number; cashedMonth: number; pending: number; monthTrend: number | null };
  clients: { total: number; active: number; prospect: number };
  projects: { total: number; active: number; done: number; late: number };
  quotes: { total: number; pending: number; pendingAmount: number; accepted: number; acceptedAmount: number; refused: number };
  invoices: { total: number; unpaid: number; unpaidAmount: number; overdue: number; overdueAmount: number; dueSoon: number; dueSoonAmount: number };
  performance: { acceptanceRate: number | null; averageInvoice: number; averageDelay: number | null; collectionRate: number | null };
  evolution: { key: string; label: string; billed: number; cashed: number }[];
  transactions: { id: string; amount: number; method: string | null; paid_at: string; invoice_number: string | null; invoice_title: string | null; client: string | null }[];
  attention: { kind: string; id: string; label: string; client: string | null; amount: number; days: number | null }[];
  events: ProEvent[];
};

export default function ActivityPanel({ goTo, toast }: { goTo: (panel: string) => void; toast: Toast }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await apiGet("dashboard");
    setStats(data as Stats);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-16 text-center text-gray-400">Chargement…</div>;
  if (!stats || stats.needsMigration) return <MigrationNotice />;

  const { revenue, clients, projects, quotes, invoices, performance, evolution, transactions, attention, events } = stats;
  const isEmpty = clients.total === 0 && quotes.total === 0 && invoices.total === 0;

  const settingsNode = settingsOpen ? (
    <BusinessSettings toast={toast} onClose={() => setSettingsOpen(false)} />
  ) : null;

  if (isEmpty) {
    return (
      <div className="mx-auto w-full max-w-[980px] xl:max-w-[1180px]">
        {settingsNode}
        <Head onSettings={() => setSettingsOpen(true)} />
        <Empty
          icon="📊"
          title="Votre activité démarre ici"
          sub="Ajoutez un client, envoyez-lui un devis : dès qu'il l'accepte, le projet et la facture se créent tout seuls et vos indicateurs se remplissent."
          cta="+ Ajouter mon premier client"
          onCta={() => goTo("clients")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[980px] xl:max-w-[1180px]">
      {settingsNode}
      <Head onSettings={() => setSettingsOpen(true)} />

      {/* ---- Chiffre d'affaires ---- */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="CA du mois"
          value={formatFcfaShort(revenue.month)}
          tone="green"
          sub={
            revenue.monthTrend == null
              ? "premier mois de référence"
              : `${revenue.monthTrend >= 0 ? "▲" : "▼"} ${Math.abs(revenue.monthTrend)} % vs mois dernier`
          }
        />
        <Kpi label="CA de l'année" value={formatFcfaShort(revenue.year)} sub={`${new Date().getFullYear()}`} />
        <Kpi label="Encaissé" value={formatFcfaShort(revenue.cashed)} tone="green" sub={`dont ${formatFcfaShort(revenue.cashedMonth)} ce mois`} />
        <Kpi
          label="En attente"
          value={formatFcfaShort(revenue.pending)}
          tone={revenue.pending > 0 ? "amber" : undefined}
          sub="facturé non encaissé"
          onClick={() => goTo("invoices")}
        />
      </div>

      {/* ---- À traiter en priorité ---- */}
      {attention.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 dark:border-amber-500/25 dark:bg-amber-500/5">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-[1rem]">⚠️</span>
            <h3 className="font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">
              À traiter en priorité
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {attention.map((a) => (
              <button
                key={`${a.kind}-${a.id}`}
                onClick={() => goTo(a.kind === "invoice_late" ? "invoices" : "quotes")}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 text-left transition hover:shadow dark:bg-dark-800"
              >
                <span className="shrink-0 text-[1rem]">{a.kind === "invoice_late" ? "🔴" : "⏳"}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[.85rem] font-bold text-gray-900 dark:text-white">{a.label}</div>
                  <div className="truncate text-[.74rem] text-gray-500">
                    {a.client ? `${a.client} · ` : ""}
                    {a.kind === "invoice_late"
                      ? `en retard de ${Math.abs(a.days ?? 0)} jour(s)`
                      : a.days === 0
                        ? "expire aujourd'hui"
                        : `expire dans ${a.days} jour(s)`}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[.88rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                  {formatFcfa(a.amount)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Portefeuille ---- */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Clients actifs" value={String(clients.active)} sub={`${clients.prospect} prospect(s)`} onClick={() => goTo("clients")} />
        <Kpi
          label="Projets en cours"
          value={String(projects.active)}
          tone={projects.late > 0 ? "amber" : undefined}
          sub={projects.late > 0 ? `${projects.late} en retard` : `${projects.done} terminé(s)`}
          onClick={() => goTo("projects")}
        />
        <Kpi
          label="Devis en attente"
          value={String(quotes.pending)}
          tone={quotes.pending > 0 ? "amber" : undefined}
          sub={formatFcfa(quotes.pendingAmount)}
          onClick={() => goTo("quotes")}
        />
        <Kpi
          label="Factures impayées"
          value={String(invoices.unpaid)}
          tone={invoices.overdue > 0 ? "red" : invoices.unpaid > 0 ? "amber" : undefined}
          sub={invoices.overdue > 0 ? `${invoices.overdue} en retard` : `${invoices.dueSoon} à échéance ≤ 7 j`}
          onClick={() => goTo("invoices")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <RevenueChart data={evolution} />

          {/* ---- Dernières transactions ---- */}
          <div className={`${card} p-4 sm:p-5`}>
            <h3 className="mb-3 font-display text-[.95rem] font-extrabold text-gray-900 dark:text-white">
              Dernières transactions
            </h3>
            {transactions.length === 0 ? (
              <p className="py-4 text-center text-[.82rem] text-gray-400">
                Aucun encaissement enregistré pour l&apos;instant.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/10">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green/10 text-[.9rem]">💰</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[.85rem] font-bold text-gray-900 dark:text-white">
                        {t.client || t.invoice_title || "Encaissement"}
                      </div>
                      <div className="truncate text-[.72rem] text-gray-500">
                        {[t.invoice_number, t.method, formatDate(t.paid_at)].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[.88rem] font-extrabold tabular-nums text-green">
                      + {formatFcfa(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* ---- Indicateurs de performance ---- */}
          <div className={`${card} p-4`}>
            <h3 className="mb-3 font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">
              Performance
            </h3>
            <div className="flex flex-col gap-3">
              <Perf
                label="Taux d'acceptation des devis"
                value={performance.acceptanceRate == null ? "—" : `${performance.acceptanceRate} %`}
                bar={performance.acceptanceRate}
                hint={`${quotes.accepted} accepté(s) · ${quotes.refused} refusé(s)`}
              />
              <Perf
                label="Taux d'encaissement"
                value={performance.collectionRate == null ? "—" : `${performance.collectionRate} %`}
                bar={performance.collectionRate}
                hint="part du facturé déjà encaissée"
              />
              <Perf
                label="Facture moyenne"
                value={performance.averageInvoice ? formatFcfa(performance.averageInvoice) : "—"}
                hint={`sur ${invoices.total} facture(s)`}
              />
              <Perf
                label="Délai moyen de paiement"
                value={performance.averageDelay == null ? "—" : `${performance.averageDelay} jours`}
                hint="de l'émission au règlement"
              />
            </div>
          </div>

          {/* ---- Fil d'activité ---- */}
          <div className={`${card} p-4`}>
            <h3 className="mb-3 font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">
              Dernières activités
            </h3>
            {events.length === 0 ? (
              <p className="py-3 text-center text-[.8rem] text-gray-400">Rien à signaler.</p>
            ) : (
              <ol className="flex flex-col gap-2.5">
                {events.map((e) => (
                  <li key={e.id} className="flex gap-2.5">
                    <span className="shrink-0 text-[.85rem]">{EVENT_ICON[e.kind] || "•"}</span>
                    <div className="min-w-0">
                      <div className="text-[.78rem] leading-snug text-gray-700 dark:text-gray-300">{e.message}</div>
                      <div className="text-[.68rem] text-gray-400">{timeAgo(e.created_at)}</div>
                    </div>
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

const EVENT_ICON: Record<string, string> = {
  created: "✨",
  updated: "✏️",
  revised: "♻️",
  sent: "📤",
  viewed: "👀",
  accepted: "✅",
  refused: "❌",
  payment: "💰",
  payment_removed: "↩️",
  reminded: "🔔",
  cancelled: "🚫",
  archived: "📦",
  deleted: "🗑️",
};

function Head({ onSettings }: { onSettings: () => void }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-[1.5rem] font-extrabold tracking-tight text-gray-900 dark:text-white">
          Mon Activité
        </h1>
        <p className="mt-0.5 text-[.82rem] text-gray-500 dark:text-gray-400">
          La santé de votre activité en temps réel
        </p>
      </div>
      <button
        onClick={onSettings}
        className="shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-[.83rem] font-bold text-gray-600 transition hover:border-green/50 hover:text-green dark:border-dark-border dark:text-gray-300"
      >
        🏢 Mon entreprise
      </button>
    </div>
  );
}

function Perf({ label, value, bar, hint }: { label: string; value: string; bar?: number | null; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[.76rem] font-semibold text-gray-600 dark:text-gray-400">{label}</span>
        <span className="shrink-0 font-mono text-[.85rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
          {value}
        </span>
      </div>
      {bar != null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div
            className={`h-full rounded-full ${bar >= 60 ? "bg-green" : bar >= 30 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${Math.min(100, Math.max(0, bar))}%` }}
          />
        </div>
      )}
      {hint && <div className="mt-0.5 text-[.68rem] text-gray-400">{hint}</div>}
    </div>
  );
}

/**
 * Évolution du chiffre d'affaires sur 12 mois.
 * Barres en CSS pur : pas de librairie de graphes à charger sur un réseau 4G,
 * et le rendu reste net en thème clair comme sombre.
 */
function RevenueChart({ data }: { data: { key: string; label: string; billed: number; cashed: number }[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.billed, d.cashed)));
  const hasData = data.some((d) => d.billed > 0 || d.cashed > 0);

  return (
    <div className={`${card} p-4 sm:p-5`}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-[.95rem] font-extrabold text-gray-900 dark:text-white">
          Évolution du chiffre d&apos;affaires
        </h3>
        <div className="flex items-center gap-3 text-[.7rem] font-semibold text-gray-500">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-green" /> Facturé</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-neon-gold" /> Encaissé</span>
        </div>
      </div>
      <p className="mb-4 text-[.72rem] text-gray-400">12 derniers mois</p>

      {!hasData ? (
        <p className="py-8 text-center text-[.82rem] text-gray-400">
          La courbe se remplira dès votre première facture.
        </p>
      ) : (
        <div className="flex h-[150px] items-end gap-1.5">
          {data.map((d) => (
            <div key={d.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div className="flex h-full w-full items-end justify-center gap-[2px]">
                <div
                  className="w-1/2 rounded-t bg-green/85 transition-all group-hover:bg-green"
                  style={{ height: `${Math.max(d.billed > 0 ? 3 : 0, (d.billed / max) * 100)}%` }}
                  title={`Facturé ${d.label} : ${formatFcfa(d.billed)}`}
                />
                <div
                  className="w-1/2 rounded-t bg-neon-gold/85 transition-all group-hover:bg-neon-gold"
                  style={{ height: `${Math.max(d.cashed > 0 ? 3 : 0, (d.cashed / max) * 100)}%` }}
                  title={`Encaissé ${d.label} : ${formatFcfa(d.cashed)}`}
                />
              </div>
              <span className="text-[.62rem] font-semibold text-gray-400">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
