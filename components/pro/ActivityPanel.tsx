"use client";

// « Tableau de bord » — la vue de pilotage complète de l'espace pro.
//
// Cet écran avait été réduit à deux nombres le 31/08/2026, à l'époque où il
// servait encore de page d'accueil du module. Depuis, /mon-activite a son
// propre accueil en grosses tuiles : c'est LÀ que vit la simplicité, pour
// l'artisan qui vient juste faire son devis. Cet écran-ci est l'inverse — on y
// entre exprès pour tout voir. Il expose donc l'intégralité de ce que calcule
// /api/pro/dashboard : argent, portefeuille, performance, historique. Rien n'y
// est saisissable, c'est une vue de lecture.

import { useEffect, useMemo, useState } from "react";
import { formatFcfa, formatFcfaShort, timeAgo, formatDate } from "@/lib/pro";
import { apiGet, card, Kpi, Empty, MigrationNotice, type GoTo, type ProEvent, type Toast } from "./ui";

type Month = { key: string; label: string; billed: number; cashed: number };

type Stats = {
  needsMigration?: boolean;
  revenue: { total: number; month: number; year: number; cashed: number; cashedMonth: number; pending: number; monthTrend: number | null };
  clients: { total: number; active: number; prospect: number };
  projects: { total: number; active: number; done: number; late: number };
  quotes: { total: number; pending: number; pendingAmount: number; accepted: number; acceptedAmount: number; refused: number };
  invoices: { total: number; unpaid: number; unpaidAmount: number; overdue: number; overdueAmount: number; dueSoon: number; dueSoonAmount: number };
  performance: { acceptanceRate: number | null; averageInvoice: number; averageDelay: number | null; collectionRate: number | null };
  evolution: Month[];
  transactions: { id: string; amount: number; method: string | null; paid_at: string; invoice_number: string | null; invoice_title: string | null; client: string | null }[];
  attention: { kind: string; id: string; label: string; client: string | null; amount: number; days: number | null }[];
  events: ProEvent[];
};

export default function ActivityPanel({ goTo }: { goTo: GoTo; toast: Toast }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // `alive` : le professionnel peut retourner à l'accueil avant la réponse.
    // Sans ce garde, le setState tirait sur un composant démonté.
    let alive = true;
    (async () => {
      const { data } = await apiGet("dashboard");
      if (!alive) return;
      setStats(data as Stats);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <div className="py-16 text-center text-gray-400">Chargement…</div>;
  if (!stats || stats.needsMigration) return <MigrationNotice />;

  const { revenue, clients, projects, quotes, invoices, performance, evolution, transactions, attention, events } = stats;

  if (clients.total === 0 && quotes.total === 0 && invoices.total === 0) {
    return (
      <div className="mx-auto w-full max-w-[560px]">
        <Empty
          icon="📊"
          title="Votre activité démarre ici"
          sub="Ajoutez un client, envoyez-lui un devis : dès qu'il l'accepte, le projet et la facture se créent tout seuls et vos chiffres se remplissent."
          cta="+ Ajouter mon premier client"
          onCta={() => goTo("clients")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-col gap-4 xl:max-w-[1180px]">
      {/* ---- À traiter en priorité — au-dessus de tout : c'est la seule partie
          de l'écran qui réclame une action aujourd'hui. ---- */}
      {attention.length > 0 && (
        <section className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4 dark:border-amber-500/25 dark:bg-amber-500/5">
          <h2 className="mb-2.5 flex items-center gap-2 font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">
            <span aria-hidden="true">⚠️</span> À traiter en priorité
          </h2>
          <div className="flex flex-col gap-2">
            {attention.map((a) => (
              <button
                key={`${a.kind}-${a.id}`}
                onClick={() => goTo(a.kind === "invoice_late" ? "invoices" : "quotes", a.id)}
                className="flex min-h-[52px] items-center gap-2.5 rounded-xl bg-white p-3 text-left transition hover:shadow dark:bg-dark-800"
              >
                <span className="shrink-0 text-[1rem]" aria-hidden="true">
                  {a.kind === "invoice_late" ? "🔴" : "⏳"}
                </span>
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
                <span className="shrink-0 font-mono text-[.85rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                  {formatFcfaShort(a.amount)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---- L'argent ---- */}
      <section aria-label="Chiffre d'affaires" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        <Kpi label="CA de l'année" value={formatFcfaShort(revenue.year)} sub={String(new Date().getFullYear())} />
        <Kpi
          label="Encaissé"
          value={formatFcfaShort(revenue.cashed)}
          tone="green"
          sub={`dont ${formatFcfaShort(revenue.cashedMonth)} ce mois`}
        />
        <Kpi
          label="En attente"
          value={formatFcfaShort(revenue.pending)}
          tone={revenue.pending > 0 ? "amber" : undefined}
          sub="facturé non encaissé"
          onClick={() => goTo("invoices")}
        />
      </section>

      {/* ---- Le portefeuille ---- */}
      <section aria-label="Portefeuille" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Clients actifs"
          value={String(clients.active)}
          sub={`${clients.prospect} prospect(s) · ${clients.total} au total`}
          onClick={() => goTo("clients")}
        />
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
          sub={quotes.pending > 0 ? formatFcfaShort(quotes.pendingAmount) : `${quotes.total} devis au total`}
          onClick={() => goTo("quotes")}
        />
        <Kpi
          label="Factures impayées"
          value={String(invoices.unpaid)}
          tone={invoices.overdue > 0 ? "red" : invoices.unpaid > 0 ? "amber" : undefined}
          sub={
            invoices.overdue > 0
              ? `${invoices.overdue} en retard · ${formatFcfaShort(invoices.overdueAmount)}`
              : `${invoices.dueSoon} à échéance ≤ 7 j`
          }
          onClick={() => goTo("invoices")}
        />
      </section>

      {/* Deux colonnes seulement à partir de lg ; en dessous tout s'empile dans
          l'ordre de lecture : graphique, encaissements, performance, fil. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <RevenueChart data={evolution} />
          <Transactions rows={transactions} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Performance perf={performance} quotes={quotes} invoices={invoices} />
          <Feed events={events} />
        </div>
      </div>
    </div>
  );
}

/* ====================== Évolution sur 12 mois ====================== */

/**
 * Barres en CSS pur, sans librairie de graphes : le module doit s'ouvrir vite
 * en 4G.
 *
 * Couleurs — indigo = facturé, vert = encaissé, les deux teintes que le reste
 * du module porte déjà. Le couple est passé au validateur de palette : en clair
 * #4F46E5 / #047857 (deutan ΔE 23.9, vision normale 28.6), en sombre #6366F1 /
 * #059669 sur le fond #0B1120 (23.6 / 28.1) — lisible en daltonisme rouge-vert.
 * L'écart tritan (6.4) frôle le plancher, donc l'identité ne repose JAMAIS sur
 * la seule couleur : légende, ordre des barres toujours identique, et lecture
 * chiffrée du mois pointé juste au-dessus du graphique.
 */
function RevenueChart({ data }: { data: Month[] }) {
  const [sel, setSel] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const max = useMemo(() => Math.max(1, ...data.map((d) => Math.max(d.billed, d.cashed))), [data]);
  const hasData = data.some((d) => d.billed > 0 || d.cashed > 0);
  // Par défaut on lit le mois en cours (le dernier) ; le survol ou le tap
  // déplace la lecture. Une bulle flottante, elle, serait inatteignable au
  // doigt — or l'immense majorité des professionnels sont sur téléphone.
  const shown = data.length ? data[sel ?? data.length - 1] : null;

  const longMonth = (key: string) => {
    const d = new Date(`${key}-01T00:00:00`);
    return Number.isNaN(d.getTime()) ? key : d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  return (
    <section className={`${card} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h2 className="font-display text-[.95rem] font-extrabold text-gray-900 dark:text-white">Facturé et encaissé</h2>
        <div className="flex items-center gap-3 text-[.7rem] font-semibold text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm bg-[#4F46E5] dark:bg-[#6366F1]" aria-hidden="true" /> Facturé
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm bg-[#047857] dark:bg-[#059669]" aria-hidden="true" /> Encaissé
          </span>
        </div>
      </div>

      {!hasData ? (
        <p className="py-10 text-center text-[.82rem] text-gray-400">
          Le graphique se remplira dès votre première facture.
        </p>
      ) : (
        <>
          {/* Lecture chiffrée du mois pointé : c'est elle qui remplace la bulle
              au survol, et elle donne la valeur exacte que la barre approxime. */}
          {shown && (
            <p aria-live="polite" className="mt-1 text-[.74rem] text-gray-500 dark:text-gray-400">
              <span className="font-bold capitalize text-gray-700 dark:text-gray-200">{longMonth(shown.key)}</span>
              {" · "}facturé{" "}
              <span className="font-mono font-bold tabular-nums text-[#4F46E5] dark:text-[#818CF8]">
                {formatFcfa(shown.billed)}
              </span>
              {" · "}encaissé{" "}
              <span className="font-mono font-bold tabular-nums text-[#047857] dark:text-[#34D399]">
                {formatFcfa(shown.cashed)}
              </span>
            </p>
          )}

          {/* 12 mois × 2 barres : sur un écran de 320 px on laisse glisser
              horizontalement plutôt que d'écraser les barres à 3 px de large. */}
          <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1">
            <div className="flex h-[150px] min-w-[340px] items-end gap-1 sm:h-[170px]" onMouseLeave={() => setSel(null)}>
              {data.map((d, i) => (
                <button
                  key={d.key}
                  type="button"
                  onMouseEnter={() => setSel(i)}
                  onFocus={() => setSel(i)}
                  onClick={() => setSel(i)}
                  aria-label={`${longMonth(d.key)} : facturé ${formatFcfa(d.billed)}, encaissé ${formatFcfa(d.cashed)}`}
                  className={`group flex h-full min-w-0 flex-1 flex-col justify-end gap-1 rounded-md pt-1 transition-colors ${
                    sel === i ? "bg-gray-100 dark:bg-white/10" : "hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {/* gap-[2px] : le liseré de fond entre deux barres accolées,
                      indispensable pour les séparer sans compter sur la teinte. */}
                  <span className="flex h-full w-full items-end justify-center gap-[2px] px-[2px]">
                    <span
                      className="w-1/2 max-w-[14px] rounded-t bg-[#4F46E5] dark:bg-[#6366F1]"
                      style={{ height: `${d.billed > 0 ? Math.max(3, (d.billed / max) * 100) : 0}%` }}
                    />
                    <span
                      className="w-1/2 max-w-[14px] rounded-t bg-[#047857] dark:bg-[#059669]"
                      style={{ height: `${d.cashed > 0 ? Math.max(3, (d.cashed / max) * 100) : 0}%` }}
                    />
                  </span>
                  <span className="text-[.62rem] font-semibold text-gray-400">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 border-t border-gray-100 pt-2 dark:border-white/10">
            <span className="text-[.68rem] text-gray-400">Plus haute barre : {formatFcfaShort(max)}</span>
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              aria-expanded={showTable}
              className="shrink-0 text-[.72rem] font-bold text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
            >
              {showTable ? "Masquer les chiffres" : "Voir les chiffres"}
            </button>
          </div>

          {/* Vue tableau : le graphique reste une image, les montants exacts
              doivent rester atteignables (lecteur d'écran, recopie, contrôle). */}
          {showTable && (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[280px] text-[.74rem]">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-400 dark:border-white/10">
                    <th scope="col" className="py-1.5 font-semibold">
                      Mois
                    </th>
                    <th scope="col" className="py-1.5 text-right font-semibold">
                      Facturé
                    </th>
                    <th scope="col" className="py-1.5 text-right font-semibold">
                      Encaissé
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {data.map((d) => (
                    <tr key={d.key}>
                      <th scope="row" className="py-1.5 text-left font-semibold capitalize text-gray-700 dark:text-gray-300">
                        {longMonth(d.key)}
                      </th>
                      <td className="py-1.5 text-right font-mono tabular-nums text-gray-700 dark:text-gray-300">
                        {formatFcfa(d.billed)}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-gray-700 dark:text-gray-300">
                        {formatFcfa(d.cashed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ====================== Derniers encaissements ====================== */

function Transactions({ rows }: { rows: Stats["transactions"] }) {
  return (
    <section className={`${card} p-4 sm:p-5`}>
      <h2 className="mb-3 font-display text-[.95rem] font-extrabold text-gray-900 dark:text-white">
        Derniers encaissements
      </h2>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-[.82rem] text-gray-400">Aucun paiement enregistré pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-100 dark:divide-white/10">
          {rows.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#047857]/10 text-[.9rem]" aria-hidden="true">
                💰
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[.85rem] font-bold text-gray-900 dark:text-white">
                  {t.client || t.invoice_title || "Encaissement"}
                </div>
                <div className="truncate text-[.72rem] text-gray-500">
                  {[t.invoice_number, t.method, formatDate(t.paid_at)].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span className="shrink-0 font-mono text-[.85rem] font-extrabold tabular-nums text-[#047857] dark:text-[#34D399]">
                + {formatFcfaShort(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ====================== Performance ====================== */

function Performance({
  perf,
  quotes,
  invoices,
}: {
  perf: Stats["performance"];
  quotes: Stats["quotes"];
  invoices: Stats["invoices"];
}) {
  return (
    <section className={`${card} p-4`}>
      <h2 className="mb-3 font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">Performance</h2>
      <div className="flex flex-col gap-3.5">
        <Perf
          label="Devis acceptés"
          value={perf.acceptanceRate == null ? "—" : `${perf.acceptanceRate} %`}
          bar={perf.acceptanceRate}
          hint={`${quotes.accepted} accepté(s) · ${quotes.refused} refusé(s)`}
        />
        <Perf
          label="Argent déjà rentré"
          value={perf.collectionRate == null ? "—" : `${perf.collectionRate} %`}
          bar={perf.collectionRate}
          hint="part du facturé qui est encaissée"
        />
        <Perf
          label="Facture moyenne"
          value={perf.averageInvoice ? formatFcfa(perf.averageInvoice) : "—"}
          hint={`sur ${invoices.total} facture(s)`}
        />
        <Perf
          label="Délai moyen de paiement"
          value={perf.averageDelay == null ? "—" : `${perf.averageDelay} jour(s)`}
          hint="de l'émission au règlement"
        />
      </div>
    </section>
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
            className={`h-full rounded-full ${
              bar >= 60 ? "bg-[#047857] dark:bg-[#059669]" : bar >= 30 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, bar))}%` }}
          />
        </div>
      )}
      {hint && <div className="mt-0.5 text-[.68rem] text-gray-400">{hint}</div>}
    </div>
  );
}

/* ====================== Fil d'activité ====================== */

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

function Feed({ events }: { events: ProEvent[] }) {
  return (
    <section className={`${card} p-4`}>
      <h2 className="mb-3 font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">Dernières activités</h2>
      {events.length === 0 ? (
        <p className="py-3 text-center text-[.8rem] text-gray-400">Rien à signaler.</p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {events.map((e) => (
            <li key={e.id} className="flex gap-2.5">
              <span className="shrink-0 text-[.85rem]" aria-hidden="true">
                {EVENT_ICON[e.kind] || "•"}
              </span>
              <div className="min-w-0">
                <div className="text-[.78rem] leading-snug text-gray-700 dark:text-gray-300">{e.message}</div>
                <div className="text-[.68rem] text-gray-400">{timeAgo(e.created_at)}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
