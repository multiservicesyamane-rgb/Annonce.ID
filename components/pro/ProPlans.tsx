"use client";

import { useState } from "react";
import Link from "next/link";
import { DOC_TEMPLATES } from "@/lib/pro";
import { PRO_PLANS, formatFcfaPlan, type ProPlanKey } from "@/lib/proBilling";

/**
 * L'offre Pro : deux plans, Gratuit et Pro — la meme section sur la page
 * publique et dans l'appli.
 *
 * Avant, le prix n'etait ecrit qu'a un seul endroit du site : l'encadre montre
 * au professionnel au moment ou son quota sautait. La page /espace-pro, elle,
 * promettait « sans abonnement cache » — un visiteur decouvrait donc le peage
 * apres s'etre inscrit et avoir travaille. On montre le prix avant.
 *
 * Mensuel et annuel ne sont PAS deux offres : c'est la meme, payee autrement.
 * Les presenter en deux colonnes obligeait a comparer trois cases dont deux
 * identiques, et noyait la seule question qui compte — est-ce que je passe au
 * Pro. Une case a cocher change le mode de paiement, et le prix affiche avec.
 * Le mensuel est montre en premier : 3 900 F se decide plus vite que 39 000 F,
 * et l'economie de l'annuel ne se comprend qu'apres avoir vu le prix du mois.
 *
 * Ce que le Pro change, exactement : la limite de factures saute. Rien d'autre.
 * Les dix mises en page, le logo, le cachet, le QR code et le suivi des
 * paiements sont a tout le monde — les annoncer comme des avantages Pro serait
 * reprendre d'une main ce que la page donne de l'autre.
 *
 *   mode="public"  liens vers l'appli, aucun paiement declenche ici
 *   mode="app"     ouvre le tunnel Chariow, comme l'ancien ProUpgrade
 */
export default function ProPlans({
  mode = "app",
  message,
  onClose,
  quotaFactures = 1,
}: {
  mode?: "public" | "app";
  /** Contexte affiche en tete, cote appli : pourquoi cette offre apparait maintenant. */
  message?: string;
  onClose?: () => void;
  /**
   * Nombre de factures offertes par mois. Passe par la page serveur, qui seule
   * peut lire PRO_QUOTA_FACTURES — cette variable n'est pas exposee au client,
   * et l'importer ici afficherait « 1 » meme apres l'avoir desserree.
   */
  quotaFactures?: number;
}) {
  const [annuel, setAnnuel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const plan = annuel ? PRO_PLANS.annuel : PRO_PLANS.mensuel;
  const douzeMois = PRO_PLANS.mensuel.price * 12;
  // 46 800 − 39 000 = 7 800, soit deux mois. On montre l'economie en francs :
  // « 2 mois offerts » est une formule, un montant est une preuve.
  const economie = douzeMois - PRO_PLANS.annuel.price;
  const parMois = Math.round(PRO_PLANS.annuel.price / 12);
  const factures = quotaFactures === 1 ? "1 facture" : `${quotaFactures} factures`;

  async function payer(cle: ProPlanKey) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/chariow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proPlan: cle }),
      });
      if (res.status === 401) {
        window.location.href = "/connexion?redirect=/mon-activite";
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.redirect_url) {
        setError(data.error || "Le paiement n'a pas pu être ouvert. Réessayez.");
        setBusy(false);
        return;
      }
      window.location.href = data.redirect_url;
    } catch {
      setError("Connexion au service de paiement impossible. Vérifiez votre réseau.");
      setBusy(false);
    }
  }

  return (
    <section
      className={
        mode === "public"
          ? ""
          : "rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-dark-border dark:bg-white/[.03] sm:p-5"
      }
    >
      {mode === "app" ? (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[1.05rem] font-black text-gray-900 dark:text-white">
              Passez au Pro
            </h3>
            <p className="mt-1 max-w-[52ch] text-[.84rem] leading-relaxed text-gray-600 dark:text-gray-400">
              {message ||
                `Le gratuit vous offre ${factures} par mois. Le Pro lève la limite — vos devis, eux, ont toujours été illimités.`}
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
      ) : (
        <div className="text-center">
          <h2 className="font-display text-[1.5rem] font-bold text-gray-900 dark:text-white md:text-[1.8rem]">
            Le prix, avant que vous vous inscriviez
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-[.9rem] leading-relaxed text-gray-600 dark:text-gray-400">
            Vous pouvez travailler gratuitement, sans limite de durée. Le Pro ne
            débloque qu&apos;une chose : le nombre de factures.
          </p>
        </div>
      )}

      <div className={`grid gap-4 md:grid-cols-2 ${mode === "public" ? "mt-9" : "mt-0"}`}>
        {/* ============================= Gratuit ============================= */}
        <div className="flex flex-col rounded-2xl border-2 border-gray-100 bg-white p-5 dark:border-dark-border dark:bg-[#111722]">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-[1rem] font-extrabold text-gray-900 dark:text-white">
              🆓 Gratuit
            </span>
            <span className="shrink-0 font-mono text-[1.05rem] font-extrabold tabular-nums text-gray-500">
              0 F
            </span>
          </div>
          <p className="mt-1.5 text-[.8rem] leading-relaxed text-gray-500 dark:text-gray-400">
            Pour travailler pour de vrai, sans carte bancaire et sans limite de durée.
          </p>

          <div className="mt-4 flex flex-1 flex-wrap content-start gap-1.5">
            <Atout>Devis illimités</Atout>
            <Atout>{factures} par mois</Atout>
            <Atout>{DOC_TEMPLATES.length} mises en page</Atout>
            <Atout>Logo, signature, cachet</Atout>
            <Atout>PDF A4 et QR code</Atout>
            <Atout>Envoi par WhatsApp</Atout>
            <Atout>Suivi des paiements</Atout>
          </div>

          <div className="mt-5">
            {mode === "public" ? (
              <Link
                href="/mon-activite"
                className="btn btn-outline w-full py-2.5 text-[.85rem] font-extrabold"
              >
                Commencer gratuitement
              </Link>
            ) : (
              <span className="block w-full rounded-[10px] bg-gray-100 py-2.5 text-center text-[.85rem] font-bold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                Votre formule actuelle
              </span>
            )}
          </div>
        </div>

        {/* =============================== Pro =============================== */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-gold bg-gold/[.04] p-5 shadow-[0_18px_44px_-26px_rgba(245,166,35,.65)] dark:bg-gold/[.06]">
          {/* Le bandeau en biais des offres d'annonces : meme langage, meme or. */}
          <div className="absolute -right-8 top-3 rotate-45 bg-gold px-8 py-0.5 text-[.5rem] font-black tracking-wider text-dark-900">
            PRO
          </div>

          <div className="flex items-baseline justify-between gap-3 pr-8">
            <span className="font-display text-[1rem] font-extrabold text-gray-900 dark:text-white">
              👑 Pro
            </span>
          </div>

          {/* Le prix change avec la case a cocher, et lui seul : le reste de la
              colonne ne bouge pas, sinon on ne voit pas ce qui a change. */}
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-mono text-[2rem] font-extrabold leading-none tabular-nums tracking-tight text-gray-900 dark:text-white">
              {plan.price.toLocaleString("fr-FR")}
            </span>
            <span className="text-[.8rem] font-bold text-gray-500 dark:text-gray-400">
              FCFA {annuel ? "/ an" : "/ mois"}
            </span>
            {annuel && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[.66rem] font-black text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                − {economie.toLocaleString("fr-FR")} F
              </span>
            )}
          </div>

          <p className="mt-1.5 min-h-[2.6em] text-[.8rem] leading-relaxed text-gray-600 dark:text-gray-400">
            {annuel
              ? `Soit ${parMois.toLocaleString("fr-FR")} F par mois. Deux mois de moins qu'au tarif mensuel, payés une seule fois.`
              : "Sans engagement, résiliable à tout moment."}
          </p>

          {/* La case a cocher : un seul geste, qui ne change que le paiement. */}
          <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] border-gold/40 bg-white px-3 py-2.5 transition hover:border-gold dark:bg-[#111722]">
            <input
              type="checkbox"
              checked={annuel}
              onChange={(e) => setAnnuel(e.target.checked)}
              className="h-4 w-4 shrink-0 accent-gold"
            />
            <span className="text-[.82rem] font-bold leading-snug text-gray-800 dark:text-gray-100">
              Payer à l&apos;année
              <span className="ml-1.5 font-extrabold text-gold-dark dark:text-neon-gold">
                2 mois offerts
              </span>
            </span>
          </label>

          <div className="mt-4 flex flex-1 flex-wrap content-start gap-1.5">
            <Atout fort>Factures illimitées</Atout>
            <Atout>Tout ce que contient le gratuit</Atout>
            <Atout>{annuel ? "Un seul paiement dans l'année" : "Résiliable à tout moment"}</Atout>
          </div>

          <div className="mt-5">
            {mode === "public" ? (
              <Link
                href="/mon-activite"
                className="btn btn-gold w-full py-2.5 text-[.85rem] font-extrabold"
              >
                Passer au Pro — {formatFcfaPlan(plan.price)}
              </Link>
            ) : (
              <button
                onClick={() => payer(plan.key)}
                disabled={busy}
                className="btn btn-gold w-full py-2.5 text-[.85rem] font-extrabold disabled:opacity-60"
              >
                {busy ? "Ouverture…" : `Passer au Pro — ${formatFcfaPlan(plan.price)}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[.78rem] text-red-800 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      <p className="mx-auto mt-5 max-w-[56ch] text-center text-[.76rem] leading-relaxed text-gray-500 dark:text-gray-400">
        Paiement Mobile Money ou carte, par Chariow. Vos devis et factures déjà
        créés restent accessibles, quoi qu&apos;il arrive.
      </p>
    </section>
  );
}

/** Pastille d'avantage, reprise des offres de boost : compacte, elle tient a
    plusieurs par ligne sur un telephone la ou une liste a puces prend la page. */
function Atout({ children, fort }: { children: React.ReactNode; fort?: boolean }) {
  return (
    <span
      className={`rounded-md border px-1.5 py-0.5 text-[.68rem] leading-snug ${
        fort
          ? "border-emerald-200 bg-emerald-50 font-bold text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-gray-200 bg-gray-50 text-gray-600 dark:border-dark-border dark:bg-dark-900 dark:text-gray-300"
      }`}
    >
      ✓ {children}
    </span>
  );
}
