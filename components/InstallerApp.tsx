"use client";

import { useEffect, useState } from "react";

/**
 * Le bouton d'installation, et ce qu'il faut dire quand il ne peut pas exister.
 *
 * ── Pourquoi ce n'est pas un simple lien de téléchargement ───────────────
 * Il n'y a aucun fichier à télécharger. L'application EST le site : le
 * navigateur l'installe lui-même, sans passer par un magasin, sans consommer
 * de forfait. C'est un avantage sur ce marché, mais c'est aussi ce qui
 * surprend — d'où une page qui l'explique au lieu d'un bouton muet.
 *
 * ── Trois cas, trois écrans ──────────────────────────────────────────────
 *   Android / Chrome  `beforeinstallprompt` existe : un vrai bouton.
 *   iPhone / Safari   l'événement N'EXISTE PAS. Apple n'ouvre l'installation
 *                     qu'au geste manuel « Partager → Sur l'écran d'accueil ».
 *                     Un bouton y serait un mensonge : on montre les étapes.
 *   Déjà installée    on le dit, plutôt que de proposer de refaire.
 */

type Invite = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallerApp() {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [installee, setInstallee] = useState(false);
  const [ios, setIos] = useState(false);
  const [etat, setEtat] = useState<string | null>(null);

  useEffect(() => {
    // Déjà lancée depuis l'écran d'accueil : inutile de proposer l'installation.
    const enApp =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setInstallee(enApp);

    // iPadOS se déclare « Macintosh » : on regarde aussi le tactile, sinon un
    // iPad reçoit les instructions d'un ordinateur de bureau.
    const ua = window.navigator.userAgent;
    setIos(/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document));

    const capter = (e: Event) => {
      // Sans ceci, Chrome affiche sa propre bannière par-dessus la page —
      // deux invitations concurrentes pour le même geste.
      e.preventDefault();
      setInvite(e as Invite);
    };
    window.addEventListener("beforeinstallprompt", capter);
    window.addEventListener("appinstalled", () => {
      setInstallee(true);
      setInvite(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", capter);
  }, []);

  async function installer() {
    if (!invite) return;
    await invite.prompt();
    const { outcome } = await invite.userChoice;
    // L'invitation ne se rejoue pas : une fois consommée, le navigateur ne la
    // redonne plus avant un bon moment.
    setInvite(null);
    setEtat(
      outcome === "accepted"
        ? "Installation lancée. Retrouve l'icône Wanteermako sur ton écran d'accueil."
        : "Installation annulée. Tu peux revenir quand tu veux.",
    );
  }

  if (installee) {
    return (
      <div className="rounded-2xl border border-green/30 bg-green/[0.06] p-5 text-center">
        <p className="text-[1.6rem]" aria-hidden="true">✓</p>
        <p className="mt-1 text-[.95rem] font-bold text-gray-900 dark:text-white">
          L&apos;application est déjà installée
        </p>
        <p className="mt-1 text-[.85rem] text-gray-600 dark:text-gray-400">
          Tu l&apos;utilises en ce moment même.
        </p>
      </div>
    );
  }

  if (ios) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-dark-800">
        <p className="text-[.95rem] font-bold text-gray-900 dark:text-white">
          Sur iPhone, en trois gestes
        </p>
        <ol className="mt-3 space-y-2.5">
          {[
            ["1", "Ouvre cette page dans Safari (pas Chrome)."],
            ["2", "Appuie sur Partager, en bas de l'écran."],
            ["3", "Choisis « Sur l'écran d'accueil », puis Ajouter."],
          ].map(([n, t]) => (
            <li key={n} className="flex gap-3 text-[.88rem] leading-relaxed text-gray-700 dark:text-gray-300">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green text-[.75rem] font-bold text-white">
                {n}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[.8rem] leading-relaxed text-gray-500">
          Apple ne permet pas de le faire à ta place : c&apos;est le seul chemin sur iPhone.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={installer}
        disabled={!invite}
        className="w-full rounded-xl bg-green px-6 py-4 text-[1rem] font-bold text-white shadow-lg shadow-green/25 transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        ⬇ Installer l&apos;application
      </button>

      {!invite && !etat && (
        // On dit POURQUOI le bouton est éteint. « Indisponible » sans raison
        // laisse croire à une panne du site.
        <p className="mt-3 text-[.82rem] leading-relaxed text-gray-500">
          Ton navigateur ne propose pas encore l&apos;installation. Ouvre cette page dans
          <strong className="text-gray-700 dark:text-gray-300"> Chrome</strong>, ou utilise le menu
          <strong className="text-gray-700 dark:text-gray-300"> ⋮ → Installer l&apos;application</strong>.
        </p>
      )}

      {etat && (
        <p role="status" aria-live="polite" className="mt-3 text-[.88rem] font-semibold text-green">
          {etat}
        </p>
      )}
    </div>
  );
}
