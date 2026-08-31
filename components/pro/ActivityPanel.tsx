"use client";

// « Activité » — le pouls financier de l'espace freelance, en un coup d'œil.
//
// Recentré le 31/08/2026 : la cible (artisans informels — maçons, menuisiers...
// souvent peu à l'aise avec la lecture) n'a pas besoin d'un tableau de bord
// comptable. Ce que « L'argent que je dois recevoir » et « L'argent déjà reçu »
// répondent presque à eux seuls. Tout le reste (courbe 12 mois, taux
// d'acceptation, délai moyen de paiement, fil d'activité) a été retiré : ça
// vivait ici uniquement parce que ActivityPanel était l'écran d'accueil du
// module — devenu inutile maintenant que l'accueil est /mon-activite.
// L'entête et le bouton « Mon entreprise » ont aussi disparu : la page
// englobante (app/mon-activite) affiche déjà le titre et le retour.

import { useCallback, useEffect, useState } from "react";
import { formatFcfa, formatFcfaShort } from "@/lib/pro";
import { apiGet, Empty, MigrationNotice, type Toast } from "./ui";

type Stats = {
  needsMigration?: boolean;
  revenue: { cashed: number; cashedMonth: number; pending: number };
  clients: { total: number };
  quotes: { total: number };
  invoices: { total: number };
  attention: { kind: string; id: string; label: string; client: string | null; amount: number; days: number | null }[];
};

export default function ActivityPanel({ goTo, toast }: { goTo: (panel: string) => void; toast: Toast }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await apiGet("dashboard");
    setStats(data as Stats);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-16 text-center text-gray-400">Chargement…</div>;
  if (!stats || stats.needsMigration) return <MigrationNotice />;

  const { revenue, clients, quotes, invoices, attention } = stats;
  const isEmpty = clients.total === 0 && quotes.total === 0 && invoices.total === 0;

  if (isEmpty) {
    return (
      <div className="mx-auto w-full max-w-[560px]">
        <Empty
          icon="📊"
          title="Votre activité démarre ici"
          sub="Ajoutez un client, envoyez-lui un devis : dès qu'il l'accepte, le projet et la facture se créent tout seuls."
          cta="+ Ajouter mon premier client"
          onCta={() => goTo("clients")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[560px]">
      {/* ---- À traiter en priorité — la seule liste de cet écran, courte
          par nature (au plus quelques retards à la fois). ---- */}
      {attention.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 dark:border-amber-500/25 dark:bg-amber-500/5">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-[1rem]">⚠️</span>
            <h3 className="font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">
              À traiter en priorité
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {attention.slice(0, 4).map((a) => (
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

      {/* ---- Le pouls financier : deux nombres, rien d'autre. ---- */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-dark-border dark:bg-dark-800">
          <p className="text-[.8rem] font-bold text-gray-500 dark:text-gray-400">💰 Déjà reçu</p>
          <p className="mt-2 font-mono text-[1.5rem] font-extrabold tabular-nums text-[#047857] sm:text-[1.7rem]">
            {formatFcfaShort(revenue.cashed)}
          </p>
          <p className="mt-1 text-[.72rem] text-gray-400">dont {formatFcfaShort(revenue.cashedMonth)} ce mois</p>
        </div>
        <button
          onClick={() => goTo("invoices")}
          className="rounded-[24px] border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:shadow-md dark:border-dark-border dark:bg-dark-800"
        >
          <p className="text-[.8rem] font-bold text-gray-500 dark:text-gray-400">⏳ En attente</p>
          <p className={`mt-2 font-mono text-[1.5rem] font-extrabold tabular-nums sm:text-[1.7rem] ${revenue.pending > 0 ? "text-amber-600" : "text-gray-400"}`}>
            {formatFcfaShort(revenue.pending)}
          </p>
          <p className="mt-1 text-[.72rem] text-gray-400">facturé non encaissé</p>
        </button>
      </div>
    </div>
  );
}
