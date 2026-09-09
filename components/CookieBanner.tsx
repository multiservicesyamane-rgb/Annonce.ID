"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem("wanteermako_cookie_consent");
    if (!consent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  /**
   * L'événement prévient la mesure d'audience (components/Analytics.tsx).
   *
   * `storage` ne se déclenche JAMAIS dans l'onglet qui écrit — sans cet
   * événement, il faudrait recharger la page pour que l'accord prenne effet,
   * et la première visite ne serait jamais comptée.
   */
  const enregistrerChoix = (valeur: "accepted" | "declined") => {
    localStorage.setItem("wanteermako_cookie_consent", valeur);
    window.dispatchEvent(new Event("cookie-consent"));
    setShow(false);
  };

  const acceptCookies = () => enregistrerChoix("accepted");
  const declineCookies = () => enregistrerChoix("declined");

  if (!show) return null;

  return (
    /*
     * Compact, et volontairement.
     *
     * Le bandeau precedent faisait la moitie d'un ecran de telephone : titre
     * en 1,2 rem, cinq lignes de texte, deux gros boutons empiles. Sur la page
     * d'accueil, il cachait les annonces — c'est-a-dire la raison meme de la
     * visite. Un bandeau qui masque le produit fait fuir avant d'informer.
     */
    <div className="fixed bottom-3 left-3 right-3 z-[9999] rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur-md pb-safe animate-fadeUp md:left-auto md:right-4 md:max-w-[400px] dark:border-white/10 dark:bg-[#111722]/95">
      <p className="text-[.86rem] leading-relaxed text-gray-700 dark:text-gray-300">
        <span aria-hidden="true">🍪</span>{" "}
        {/*
          Ce que dit ce texte est exactement ce que fait le site.
          « Refuser » coupe la mesure d'audience ; les publicites, elles,
          continuent de s'afficher — elles sont chargees par le gabarit de
          page, hors de ce choix. Ecrire « refusez et tout s'arrete » aurait
          ete faux, et c'est precisement le genre de phrase qu'on ne peut plus
          defendre le jour ou quelqu'un verifie.

          Le nom de la regie n'apparait pas : il n'apprend rien a personne et
          fait peur. La politique de confidentialite, elle, la nomme.
        */}
        Nous comptons les visites pour améliorer le site, et la publicité le garde
        gratuit. Vous pouvez refuser le comptage — tout continue de fonctionner.{" "}
        <Link href="/politique-confidentialite" className="font-semibold text-green hover:underline">
          Détails
        </Link>
      </p>

      <div className="mt-3 flex items-center gap-2">
        {/* « Refuser l'essentiel » disait litteralement le contraire de ce
            qu'il faisait. Un mot suffit. */}
        <button
          onClick={declineCookies}
          className="flex-1 rounded-xl border border-gray-300 py-2.5 text-[.84rem] font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Refuser
        </button>
        <button
          onClick={acceptCookies}
          className="flex-1 rounded-xl bg-green py-2.5 text-[.84rem] font-bold text-white shadow-lg shadow-green/20 transition hover:opacity-95"
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
