"use client";

import { useState } from "react";
import { PRO_PLANS, formatFcfaPlan, type ProPlanKey } from "@/lib/proBilling";

/* eslint-disable @next/next/no-img-element */

/**
 * L'offre Pro, montree au moment ou le quota gratuit bloque.
 *
 * Le paiement se fait sur Chariow : on demande a /api/chariow une session de
 * paiement, puis on quitte le site. C'est la meme route que les boosts et les
 * Boutiques Pro — un seul tunnel a maintenir, un seul webhook a surveiller.
 *
 * L'annuel est mis en avant : encaisser 3 900 FCFA douze fois coute bien plus
 * cher en frais Mobile Money qu'une fois 39 000, et un professionnel qui a
 * paye son annee ne se repose pas la question chaque mois.
 */
export default function ProUpgrade({
  message,
  onClose,
}: {
  message?: string;
  onClose?: () => void;
}) {
  const [busy, setBusy] = useState<ProPlanKey | null>(null);
  const [error, setError] = useState("");

  async function payer(plan: ProPlanKey) {
    if (busy) return;
    setBusy(plan);
    setError("");
    try {
      const res = await fetch("/api/chariow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proPlan: plan }),
      });
      if (res.status === 401) {
        window.location.href = "/connexion?redirect=/mon-activite";
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.redirect_url) {
        setError(data.error || "Le paiement n'a pas pu être ouvert. Réessayez.");
        setBusy(null);
        return;
      }
      window.location.href = data.redirect_url;
    } catch {
      setError("Connexion au service de paiement impossible. Vérifiez votre réseau.");
      setBusy(null);
    }
  }

  const offres: { plan: ProPlanKey; mis_en_avant: boolean }[] = [
    { plan: "annuel", mis_en_avant: true },
    { plan: "mensuel", mis_en_avant: false },
  ];

  return (
    <div className="rounded-2xl border border-green/25 bg-green/[.04] p-4 dark:border-green/25 dark:bg-green/[.07] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[1.05rem] font-black text-gray-900 dark:text-white">
            Passez au Pro
          </h3>
          <p className="mt-1 text-[.84rem] leading-relaxed text-gray-600 dark:text-gray-400">
            {message ||
              "Vous avez utilisé votre facture gratuite du mois. Le Pro lève la limite et retire la mention Wanteermako de vos documents."}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 rounded-lg px-2 py-1 text-[1.1rem] leading-none text-gray-400 hover:bg-black/5 dark:hover:bg-white/10"
          >
            ×
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {offres.map(({ plan, mis_en_avant }) => {
          const p = PRO_PLANS[plan];
          return (
            <button
              key={plan}
              onClick={() => payer(plan)}
              disabled={busy !== null}
              className={`relative rounded-xl border p-3.5 text-left transition disabled:opacity-60 ${
                mis_en_avant
                  ? "border-green bg-white shadow-sm hover:shadow-md dark:border-green dark:bg-[#111722]"
                  : "border-gray-200 bg-white hover:border-green/50 dark:border-white/10 dark:bg-[#111722]"
              }`}
            >
              {mis_en_avant && (
                <span className="absolute -top-2 right-3 rounded-full bg-green px-2 py-0.5 text-[.6rem] font-black uppercase tracking-wider text-white">
                  Le plus avantageux
                </span>
              )}
              <div className="text-[.78rem] font-bold text-gray-500 dark:text-gray-400">{p.name}</div>
              <div className="mt-0.5 font-display text-[1.3rem] font-black leading-none text-gray-900 dark:text-white">
                {formatFcfaPlan(p.price)}
                <span className="ml-1 text-[.72rem] font-bold text-gray-400">
                  {plan === "annuel" ? "/ an" : "/ mois"}
                </span>
              </div>
              <div className="mt-1.5 text-[.72rem] leading-snug text-gray-500 dark:text-gray-400">{p.note}</div>
              <div className="mt-2.5 text-[.78rem] font-extrabold text-green">
                {busy === plan ? "Ouverture…" : "Choisir →"}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[.78rem] text-red-800 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      <p className="mt-3 text-[.72rem] leading-relaxed text-gray-500 dark:text-gray-400">
        Devis illimités dans les deux cas. Le gratuit conserve une facture par mois — vous ne
        perdez jamais l&apos;accès à vos documents déjà créés.
      </p>
    </div>
  );
}
