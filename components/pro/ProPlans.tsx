"use client";

import { useState } from "react";
import Link from "next/link";
import { DOC_TEMPLATES } from "@/lib/pro";
import { PRO_PLANS, formatFcfaPlan, type ProPlanKey } from "@/lib/proBilling";

/**
 * L'offre Pro, en trois colonnes — la meme sur la page publique et dans l'appli.
 *
 * Avant, le prix n'etait ecrit qu'a un seul endroit du site : l'encadre montre
 * au professionnel au moment ou son quota sautait. La page /espace-pro, elle,
 * promettait « sans abonnement cache » — un visiteur decouvrait donc le peage
 * apres s'etre inscrit et avoir travaille. On montre le prix avant.
 *
 * Le gratuit occupe une vraie colonne. Sans lui, le lecteur ne sait ni ce qu'il
 * garde ni ce qu'il perd, et l'annonce « gratuit » de l'accueil sonne faux.
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
  const [busy, setBusy] = useState<ProPlanKey | null>(null);
  const [error, setError] = useState("");

  const mensuel = PRO_PLANS.mensuel;
  const annuel = PRO_PLANS.annuel;
  // 39 000 / 12 = 3 250. Ecrire l'equivalent mensuel evite au lecteur de poser
  // la division : c'est ce calcul, pas l'etiquette « 2 mois offerts », qui rend
  // l'annuel evident.
  const parMois = Math.round(annuel.price / 12);
  const factures = quotaFactures === 1 ? "1 facture" : `${quotaFactures} factures`;

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

  return (
    <section className={mode === "public" ? "" : "rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-dark-border dark:bg-white/[.03] sm:p-5"}>
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

      <div className={`grid gap-4 lg:grid-cols-3 ${mode === "public" ? "mt-9" : "mt-0"}`}>
        {/* ---------------------------- Gratuit ---------------------------- */}
        <Colonne titre="Gratuit" prix="0" unite="FCFA" note="Pour travailler pour de vrai, sans carte bancaire.">
          <Ligne>Devis <b>illimités</b></Ligne>
          <Ligne><b>{factures}</b> par mois</Ligne>
          <Ligne>Les {DOC_TEMPLATES.length} mises en page, logo, signature, cachet</Ligne>
          <Ligne>PDF A4, QR code, envoi par WhatsApp</Ligne>
          <Ligne>Suivi des paiements et des retards</Ligne>
          <Ligne manque>Au-delà, il faut le Pro</Ligne>
          <Bouton>
            {mode === "public" ? (
              <Link href="/mon-activite" className="btn btn-outline w-full py-2.5 text-[.85rem] font-extrabold">
                Commencer gratuitement
              </Link>
            ) : (
              <span className="block w-full rounded-[10px] border-2 border-transparent bg-gray-100 py-2.5 text-center text-[.85rem] font-bold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                Vous y êtes
              </span>
            )}
          </Bouton>
        </Colonne>

        {/* -------------------------- Pro annuel --------------------------- */}
        <Colonne
          titre={annuel.name}
          prix={annuel.price.toLocaleString("fr-FR")}
          unite="FCFA / an"
          note={`Soit ${parMois.toLocaleString("fr-FR")} F par mois — deux mois de moins qu'au tarif mensuel.`}
          avant
        >
          <Ligne><b>Factures illimitées</b></Ligne>
          <Ligne>Tout ce que contient le gratuit</Ligne>
          <Ligne>Un seul paiement dans l&apos;année</Ligne>
          <Ligne>{formatFcfaPlan(mensuel.price * 12)} au tarif mensuel, {formatFcfaPlan(annuel.price)} ici</Ligne>
          <Bouton>
            {mode === "public" ? (
              <Link href="/mon-activite" className="btn btn-gold w-full py-2.5 text-[.85rem] font-extrabold">
                Passer au Pro annuel
              </Link>
            ) : (
              <button
                onClick={() => payer("annuel")}
                disabled={busy !== null}
                className="btn btn-gold w-full py-2.5 text-[.85rem] font-extrabold disabled:opacity-60"
              >
                {busy === "annuel" ? "Ouverture…" : "Passer au Pro annuel"}
              </button>
            )}
          </Bouton>
        </Colonne>

        {/* ------------------------- Pro mensuel --------------------------- */}
        <Colonne
          titre={mensuel.name}
          prix={mensuel.price.toLocaleString("fr-FR")}
          unite="FCFA / mois"
          note="Sans engagement, résiliable à tout moment."
        >
          <Ligne><b>Factures illimitées</b></Ligne>
          <Ligne>Tout ce que contient le gratuit</Ligne>
          <Ligne>Sans engagement</Ligne>
          <Ligne manque>À renouveler chaque mois</Ligne>
          <Bouton>
            {mode === "public" ? (
              <Link href="/mon-activite" className="btn btn-outline w-full py-2.5 text-[.85rem] font-extrabold">
                Passer au Pro mensuel
              </Link>
            ) : (
              <button
                onClick={() => payer("mensuel")}
                disabled={busy !== null}
                className="btn btn-outline w-full py-2.5 text-[.85rem] font-extrabold disabled:opacity-60"
              >
                {busy === "mensuel" ? "Ouverture…" : "Passer au Pro mensuel"}
              </button>
            )}
          </Bouton>
        </Colonne>
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

/* ============================== Les briques ============================== */

/**
 * Une colonne d'offre. `avant` ne se donne qu'a une seule : une bordure doree,
 * une ombre et un bouton plein sur toute la section, sinon plus rien ne
 * ressort. L'or est reserve au Pro dans toute l'application.
 */
function Colonne({
  titre, prix, unite, note, avant, children,
}: {
  titre: string; prix: string; unite: string; note: string;
  avant?: boolean; children: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white p-5 dark:bg-[#111722] ${
        avant
          ? "border-[1.5px] border-neon-gold shadow-[0_18px_44px_-26px_rgba(245,166,35,.65)]"
          : "border-gray-200 dark:border-white/10"
      }`}
    >
      {avant && (
        <span className="absolute -top-2.5 left-5 rounded-full bg-gold px-2.5 py-0.5 text-[.6rem] font-black uppercase tracking-wider text-dark-900">
          2 mois offerts
        </span>
      )}
      <div className="font-display text-[.92rem] font-bold text-gray-900 dark:text-white">{titre}</div>
      <div className="mt-2 font-mono text-[1.75rem] font-extrabold leading-none tabular-nums tracking-tight text-gray-900 dark:text-white">
        {prix}
        <span className="ml-1.5 font-sans text-[.72rem] font-bold tracking-normal text-gray-400">{unite}</span>
      </div>
      <p className="mt-2.5 min-h-[2.8em] text-[.78rem] leading-relaxed text-gray-500 dark:text-gray-400">{note}</p>
      <ul className="mt-4 flex flex-1 flex-col gap-2.5 border-t border-gray-100 pt-4 dark:border-white/10">
        {children}
      </ul>
    </div>
  );
}

/** Le manque se dit en gris, jamais en rouge : on ne punit pas qui n'a pas payé. */
function Ligne({ children, manque }: { children: React.ReactNode; manque?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-[.82rem] leading-snug">
      <span
        aria-hidden="true"
        className={`mt-px shrink-0 font-bold ${manque ? "text-gray-300 dark:text-gray-600" : "text-emerald-600"}`}
      >
        {manque ? "—" : "✓"}
      </span>
      <span className={manque ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}>
        {children}
      </span>
    </li>
  );
}

function Bouton({ children }: { children: React.ReactNode }) {
  return <li className="mt-4 list-none">{children}</li>;
}
