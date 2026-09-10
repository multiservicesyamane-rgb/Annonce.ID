"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useInstallation } from "./useInstallation";

/**
 * La banniere d'installation de l'accueil.
 *
 * ── Trois conditions pour se montrer, et elles comptent toutes ───────────
 *   1. l'application n'est pas deja installee — la proposer a quelqu'un qui
 *      l'utilise deja est le meilleur moyen de passer pour un site qui ne
 *      sait pas a qui il parle ;
 *   2. elle n'a pas ete refusee — un « non merci » qui revient a chaque
 *      visite n'est plus une proposition, c'est du harcelement ;
 *   3. le navigateur sait installer, OU on est sur iPhone (ou l'on renvoie
 *      vers les instructions, faute d'invitation automatique).
 *
 * ── Et une regle de taille ───────────────────────────────────────────────
 * Une seule ligne. Les annonces sont la raison de la visite : une banniere
 * qui les repousse sous la ligne de flottaison coute plus qu'elle ne
 * rapporte, meme quand ce qu'elle propose est utile.
 */

const CLE_REFUS = "wmk_install_refuse";

export default function InstallerBanniere() {
  const { invite, installee, ios, installer } = useInstallation();
  const [refuse, setRefuse] = useState(true); // masquee tant qu'on n'a pas lu le stockage
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      setRefuse(localStorage.getItem(CLE_REFUS) === "1");
    } catch {
      // Navigation privee ou stockage refuse : on montre la banniere. Ne pas
      // pouvoir memoriser un refus vaut mieux que de ne jamais rien proposer.
      setRefuse(false);
    }
  }, []);

  function refuser() {
    setRefuse(true);
    try {
      localStorage.setItem(CLE_REFUS, "1");
    } catch {
      /* le refus ne tiendra pas cette session — sans consequence */
    }
  }

  async function surInstaller() {
    const r = await installer();
    if (r === "accepted") setMessage("Installation lancee. L'icone arrive sur ton ecran d'accueil.");
    else if (r === "dismissed") refuser();
  }

  if (installee || refuse) return null;
  // Ni invitation du navigateur, ni iPhone : il n'y a rien a proposer qui
  // fonctionne. Mieux vaut ne rien afficher qu'un bouton qui ne fait rien.
  if (!invite && !ios) return null;

  return (
    <section className="wrap pt-3" aria-label="Installer l'application">
      <div className="flex items-center gap-3 rounded-2xl border border-green/25 bg-green/[0.06] px-3 py-2.5 sm:px-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[1.15rem] shadow-sm dark:bg-white/10" aria-hidden="true">
          📱
        </span>

        <p className="min-w-0 flex-1 text-[.8rem] leading-snug text-gray-700 dark:text-gray-300 sm:text-[.86rem]">
          <strong className="text-gray-900 dark:text-white">Mets Wanteermako sur ton ecran d&apos;accueil.</strong>{" "}
          <span className="hidden sm:inline">Rien a telecharger, ton forfait ne le sentira pas passer.</span>
          {message && <span className="block font-semibold text-green">{message}</span>}
        </p>

        {invite ? (
          <button
            type="button"
            onClick={surInstaller}
            className="shrink-0 rounded-xl bg-green px-4 py-2 text-[.8rem] font-bold text-white transition active:scale-95"
          >
            Installer
          </button>
        ) : (
          // iPhone : aucune invitation possible, on emmene vers les etapes.
          <Link
            href="/application"
            className="shrink-0 rounded-xl bg-green px-4 py-2 text-[.8rem] font-bold text-white transition active:scale-95"
          >
            Comment faire
          </Link>
        )}

        <button
          type="button"
          onClick={refuser}
          aria-label="Ne plus proposer"
          className="shrink-0 rounded-lg px-1.5 text-[1.1rem] leading-none text-gray-400 transition hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </section>
  );
}
