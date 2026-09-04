"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import MonActivite, { type ProPanel } from "@/components/MonActivite";
import BusinessProfile from "@/components/pro/BusinessProfile";
import { MigrationNotice } from "@/components/pro/ui";

/**
 * Mon Activité — service à part entière, hors du tableau de bord Annonces.
 *
 * Décision du 31/08/2026 : le public visé (artisans informels — maçons,
 * menuisiers... souvent peu à l'aise avec la lecture) a besoin d'un point
 * d'entrée aussi simple qu'une appli comme Wave — de grosses tuiles carrées,
 * une icône, un mot, rien à lire de plus. Pas de sidebar dense partagée avec
 * les annonces : cette page EST l'application, avec son propre accueil.
 *
 * Les écrans eux-mêmes (Clients, Devis, Factures...) sont réutilisés tels
 * quels depuis components/pro — ils ne dépendent que de `toast` et `goTo`.
 */

type Screen = "home" | ProPanel | "business";

const TILES: { id: Screen; icon: string; label: string; grad: string; accent: string; glow: string }[] = [
  { id: "clients", icon: "👥", label: "Clients", grad: "from-[#FEF3DC] to-[#FDE4B0] dark:from-[#F59E0B]/25 dark:to-[#F59E0B]/10", accent: "text-gold-dark dark:text-neon-gold", glow: "shadow-[0_10px_28px_-10px_rgba(212,137,26,0.45)]" },
  { id: "quotes", icon: "📄", label: "Devis", grad: "from-[#EEF2FF] to-[#E0E7FF] dark:from-[#4F46E5]/25 dark:to-[#4F46E5]/10", accent: "text-[#4F46E5] dark:text-[#A5B4FC]", glow: "shadow-[0_10px_28px_-10px_rgba(79,70,229,0.45)]" },
  { id: "invoices", icon: "🧾", label: "Factures", grad: "from-[#ECFDF5] to-[#D1FAE5] dark:from-[#047857]/25 dark:to-[#047857]/10", accent: "text-[#047857] dark:text-[#6EE7B7]", glow: "shadow-[0_10px_28px_-10px_rgba(4,120,87,0.4)]" },
  { id: "projects", icon: "🗂️", label: "Projets", grad: "from-[#F5F3FF] to-[#EDE4FF] dark:from-[#7C3AED]/25 dark:to-[#7C3AED]/10", accent: "text-[#7C3AED] dark:text-[#C4B5FD]", glow: "shadow-[0_10px_28px_-10px_rgba(124,58,237,0.4)]" },
  { id: "activity", icon: "📊", label: "Tableau de bord", grad: "from-[#ECFEFF] to-[#CFFAFE] dark:from-[#0891B2]/25 dark:to-[#0891B2]/10", accent: "text-[#0891B2] dark:text-[#67E8F9]", glow: "shadow-[0_10px_28px_-10px_rgba(8,145,178,0.4)]" },
  { id: "business", icon: "🏢", label: "Mon entreprise", grad: "from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5", accent: "text-gray-600 dark:text-gray-300", glow: "shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)]" },
];

/** Écrans ouvrables directement par l'URL — voir `?ecran=` plus bas. */
const SCREEN_IDS: Screen[] = ["clients", "quotes", "invoices", "projects", "activity", "business"];

const TITLES: Record<Screen, string> = {
  home: "Mon Activité",
  quotes: "Devis",
  invoices: "Factures",
  clients: "Clients",
  activity: "Tableau de bord",
  projects: "Projets",
  business: "Mon entreprise",
};

export default function MonActivitePage() {
  const [state, setState] = useState<"loading" | "notAuth" | "needsMigration" | "inactive" | "ready">("loading");
  const [activating, setActivating] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | undefined>(undefined);

  const toast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3500);
  };

  async function loadStatus() {
    try {
      const res = await fetch("/api/pro/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      });
      if (res.status === 401) { setState("notAuth"); return; }
      const d = await res.json().catch(() => ({}));
      if (d?.needsMigration) { setState("needsMigration"); return; }
      setState(d?.activated ? "ready" : "inactive");
    } catch {
      setState("inactive");
    }
  }

  useEffect(() => { loadStatus(); }, []);

  /**
   * Écran demandé par l'URL : `/mon-activite?ecran=invoices`.
   *
   * Sans lui, la notification « ✅ Devis accepté — facture prête » déposerait
   * le professionnel sur l'accueil, à lui de retrouver la pièce.
   *
   * Lu depuis `window` et non par `useSearchParams`, qui imposerait
   * d'envelopper toute la page dans un `<Suspense>` pour un paramètre
   * facultatif — le même piège avait déjà cassé un build (commit 290e748).
   */
  useEffect(() => {
    try {
      const asked = new URLSearchParams(window.location.search).get("ecran");
      if (asked && SCREEN_IDS.includes(asked as Screen)) setScreen(asked as Screen);
    } catch { /* URL exotique : on reste sur l'accueil */ }
  }, []);

  async function activate() {
    setActivating(true);
    try {
      const res = await fetch("/api/pro/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      if (!res.ok) { toast("Activation impossible, réessayez."); return; }
      setState("ready");
    } finally {
      setActivating(false);
    }
  }

  // Le second argument désigne la pièce à ouvrir directement sur l'écran visé
  // — c'est ce qui rend cliquable « FAC-2026-019 en retard » du tableau de bord.
  const goTo = (id: string, focus?: string) => {
    setFocusId(focus);
    setScreen(id as Screen);
  };

  return (
    // min-h-screen et non 100vh−64px : depuis que SiteShell traite
    // /mon-activite comme un parcours autonome, il n'y a plus d'en-tête public
    // de 64 px à déduire.
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Barre du haut — minimale à dessein : une flèche pour revenir à
          l'accueil de l'appli, jamais plus d'un niveau de navigation.
          z-30 : elle doit passer devant les cartes, jamais l'inverse. */}
      <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-100 bg-white px-4 dark:border-dark-border dark:bg-dark-900">
        {screen === "home" ? (
          <>
            {/* Le logo est la seule porte de sortie vers le site public :
                l'appli n'affiche plus l'en-tête du site. */}
            <Link href="/" aria-label={`Retour sur ${BRAND.name}`} className="shrink-0">
              <img src="/logo-full.jpg" alt={BRAND.name} className="h-9 w-auto rounded-[6px] object-contain" />
            </Link>
            <span className="truncate font-display text-[1.05rem] font-extrabold text-gray-900 dark:text-white">
              Mon Activité
            </span>
            <Link
              href="/dashboard"
              className="ml-auto shrink-0 text-[.8rem] font-semibold text-gray-400 hover:text-green"
            >
              Mes annonces
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => { setFocusId(undefined); setScreen("home"); }}
              aria-label="Retour à l'accueil"
              className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[1.3rem] text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              ‹
            </button>
            <span className="truncate font-display text-[1.05rem] font-extrabold text-gray-900 dark:text-white">
              {TITLES[screen]}
            </span>
          </>
        )}
      </div>

      <div className="px-4 py-6 sm:px-6 sm:py-8">
        {state === "loading" && <div className="py-16 text-center text-gray-400">Chargement…</div>}

        {state === "notAuth" && (
          <div className="mx-auto max-w-[420px] rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-dark-border dark:bg-dark-800">
            <p className="text-[2rem]">🔒</p>
            <p className="mt-2 text-[.95rem] text-gray-700 dark:text-white/80">Connectez-vous pour accéder à votre activité.</p>
            <Link href="/connexion?redirect=/mon-activite" className="btn btn-green mt-4 inline-block px-6 py-3">
              Se connecter
            </Link>
          </div>
        )}

        {state === "needsMigration" && <MigrationNotice />}

        {state === "inactive" && (
          <div className="mx-auto max-w-[440px] rounded-[24px] border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-dark-border dark:bg-dark-800">
            <p className="text-[2.6rem]">💼</p>
            <h1 className="mt-2 font-display text-[1.3rem] font-extrabold text-gray-900 dark:text-white">
              Bienvenue dans Mon Activité
            </h1>
            <p className="mt-2 text-[.9rem] leading-relaxed text-gray-600 dark:text-gray-400">
              Créez vos devis et factures, gratuitement. Aucune carte bancaire, aucun papier à remplir.
            </p>
            <button onClick={activate} disabled={activating} className="btn btn-green btn-lg mt-6 w-full disabled:opacity-60">
              {activating ? "Activation…" : "Commencer"}
            </button>
          </div>
        )}

        {state === "ready" && screen === "home" && (
          <div className="mx-auto grid max-w-[720px] grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            {TILES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setScreen(t.id)}
                className={`group relative flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden rounded-[32px] bg-gradient-to-br transition-all duration-200 ease-out active:scale-[0.95] active:duration-75 hover:-translate-y-1 ${t.grad} ${t.glow}`}
              >
                {/* Reflet glossy en coin — donne le petit relief "icône d'appli". */}
                <span className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/40 blur-2xl dark:bg-white/10" aria-hidden="true" />
                <span className="grid h-[3.4rem] w-[3.4rem] place-items-center rounded-2xl bg-white/80 text-[1.9rem] shadow-sm backdrop-blur-sm transition-transform duration-200 group-hover:scale-105 dark:bg-white/10 sm:h-16 sm:w-16 sm:text-[2.2rem]">
                  <span aria-hidden="true">{t.icon}</span>
                </span>
                <span className={`relative text-[.95rem] font-extrabold sm:text-[1.05rem] ${t.accent}`}>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {state === "ready" && screen !== "home" && screen !== "business" && (
          <MonActivite panel={screen as ProPanel} toast={toast} goTo={goTo} focusId={focusId} />
        )}

        {state === "ready" && screen === "business" && <BusinessProfile toast={toast} />}
      </div>

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[9999] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-[10px] border border-neon-gold bg-dark-900 px-5 py-2.5 text-center text-[.88rem] font-medium text-white shadow-lg animate-fadeUp"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
