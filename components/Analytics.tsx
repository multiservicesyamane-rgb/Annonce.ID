"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Google Analytics 4 — combien de personnes entrent sur le site, par jour.
 *
 * ── Pourquoi ce fichier existe ───────────────────────────────────────────
 * Le site ne mesurait RIEN. AdSense était bien chargé, mais AdSense compte des
 * impressions publicitaires, pas des visites : il ne dit ni combien de gens
 * viennent, ni d'où, ni ce qu'ils regardent. Sur WordPress, le module
 * « Site Kit by Google » branchait Analytics et Search Console d'un coup ;
 * en Next.js il n'y a pas de module, on pose la balise soi-même.
 *
 * ── Chargé APRÈS consentement, jamais avant ──────────────────────────────
 * GA dépose des cookies. La bannière du site demande déjà l'accord et le
 * range dans `wanteermako_cookie_consent` : on s'y branche. Charger la balise
 * avant la réponse rendrait la bannière mensongère — et le refus sans effet.
 *
 * ── Les changements de page comptent ─────────────────────────────────────
 * Next.js ne recharge pas le document quand on navigue : sans le suivi de
 * `pathname`, Google ne verrait que la toute première page de chaque visite,
 * et le nombre de pages vues serait faux d'un facteur dix.
 *
 * Sans `NEXT_PUBLIC_GA_ID`, ce composant ne fait rien du tout.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const CLE_CONSENTEMENT = "wanteermako_cookie_consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function Analytics() {
  const pathname = usePathname();
  const [autorise, setAutorise] = useState(false);

  /* ---- Le consentement, à l'arrivée puis à chaque changement d'avis ---- */
  useEffect(() => {
    if (!GA_ID) return;

    const lire = () => {
      try {
        setAutorise(localStorage.getItem(CLE_CONSENTEMENT) === "accepted");
      } catch {
        // Navigation privée ou stockage bloqué : dans le doute, on ne suit pas.
        setAutorise(false);
      }
    };

    lire();
    // `storage` couvre les autres onglets ; `cookie-consent` est émis par la
    // bannière elle-même, car `storage` ne se déclenche jamais dans l'onglet
    // qui écrit — sans lui, il faudrait recharger pour que l'accord prenne.
    window.addEventListener("storage", lire);
    window.addEventListener("cookie-consent", lire);
    return () => {
      window.removeEventListener("storage", lire);
      window.removeEventListener("cookie-consent", lire);
    };
  }, []);

  /* ---- Chargement de la balise, une seule fois ---- */
  useEffect(() => {
    if (!GA_ID || !autorise) return;
    if (document.getElementById("ga4")) return;

    const script = document.createElement("script");
    script.id = "ga4";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // `arguments` et non un tableau construit : c'est la forme que gtag.js
      // attend, et la seule qui fonctionne avec sa file d'attente.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    // `send_page_view: false` : on envoie les pages nous-mêmes ci-dessous,
    // sinon la première serait comptée deux fois.
    window.gtag("config", GA_ID, { send_page_view: false });
  }, [autorise]);

  /* ---- Une page vue à chaque navigation ---- */
  useEffect(() => {
    if (!GA_ID || !autorise || !pathname) return;
    window.gtag?.("event", "page_view", {
      page_path: pathname + window.location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, autorise]);

  return null;
}
