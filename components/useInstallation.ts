"use client";

import { useEffect, useState } from "react";

/**
 * Ou en est-on de l'installation de l'application ?
 *
 * Ecrit une seule fois et partage : la page /application et la banniere de
 * l'accueil posent la meme question, et la reponse est plus subtile qu'elle
 * n'en a l'air — iPadOS se declare « Macintosh », Safari n'emet jamais
 * `beforeinstallprompt`, et une application deja lancee depuis l'ecran
 * d'accueil ne doit rien proposer du tout. Deux copies de ce raisonnement
 * auraient fini par diverger.
 */

export type Invite = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export type EtatInstallation = {
  /** L'invitation du navigateur, quand il en donne une. */
  invite: Invite | null;
  /** Deja lancee depuis l'ecran d'accueil. */
  installee: boolean;
  /** iPhone ou iPad : Apple n'ouvre l'installation qu'au geste manuel. */
  ios: boolean;
  /** Lance l'installation. Renvoie ce que l'utilisateur a repondu. */
  installer: () => Promise<"accepted" | "dismissed" | "indisponible">;
};

export function useInstallation(): EtatInstallation {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [installee, setInstallee] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const enApp =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setInstallee(enApp);

    // iPadOS se declare « Macintosh » : on regarde aussi le tactile, sinon un
    // iPad recoit les instructions d'un ordinateur de bureau.
    const ua = window.navigator.userAgent;
    setIos(/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document));

    const capter = (e: Event) => {
      // Sans ceci, Chrome affiche sa propre banniere par-dessus la page —
      // deux invitations concurrentes pour le meme geste.
      e.preventDefault();
      setInvite(e as Invite);
    };
    const installe = () => {
      setInstallee(true);
      setInvite(null);
    };

    window.addEventListener("beforeinstallprompt", capter);
    window.addEventListener("appinstalled", installe);
    return () => {
      window.removeEventListener("beforeinstallprompt", capter);
      window.removeEventListener("appinstalled", installe);
    };
  }, []);

  async function installer(): Promise<"accepted" | "dismissed" | "indisponible"> {
    if (!invite) return "indisponible";
    await invite.prompt();
    const { outcome } = await invite.userChoice;
    // L'invitation ne se rejoue pas : une fois consommee, le navigateur ne la
    // redonne plus avant un bon moment.
    setInvite(null);
    return outcome === "accepted" ? "accepted" : "dismissed";
  }

  return { invite, installee, ios, installer };
}
