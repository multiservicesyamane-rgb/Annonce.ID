"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import CategoryStrip from "./CategoryStrip";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import WhatsAppFloat from "./WhatsAppFloat";
import PWARegister from "./PWARegister";
import { ToastProvider } from "./Toast";

/**
 * Décide quels éléments de chrome afficher selon la route.
 * - /yamanetech : aucun chrome (admin plein écran custom)
 * - auth/dashboard/mon-activite : parcours autonomes, sans chrome public
 * - paiement/publication : header public, sans footer ni navigation basse
 * - home/listing/annonce/recherche/categorie : chrome complet + bande catégories
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  const isAdmin = pathname.startsWith("/yamanetech");
  const isAuth = pathname.startsWith("/connexion") || pathname.startsWith("/inscription");
  const isDashboard = pathname.startsWith("/dashboard");
  // Mon Activité est une application à part entière : elle porte sa propre
  // barre du haut (logo + titre + retour). Laisser le chrome public par-dessus
  // empilait DEUX en-têtes collants — celui du site en z-900 passant devant
  // celui de l'appli en z-20 — et posait le footer public et la navigation
  // basse « Accueil / Publier » sous un éditeur de facture.
  const isProApp = pathname.startsWith("/mon-activite");
  const isFocusedFlow =
    isAuth ||
    isDashboard ||
    isProApp ||
    pathname.startsWith("/paiement") ||
    pathname.startsWith("/publier");

  const noFooter = isAdmin || isFocusedFlow;
  const hideHeader = isAdmin || isAuth || isDashboard || isProApp;
  const isAnnoncePage = pathname.startsWith("/annonce/");
  
  // On cache le BottomNav et WhatsApp sur les pages où ça gène
  const hideChrome = isAdmin || isFocusedFlow;
  const hideBottomNav = hideChrome || isAnnoncePage;

  const showCatStrip =
    pathname === "/" ||
    pathname.startsWith("/categorie") ||
    pathname.startsWith("/recherche");

  // Bouton WhatsApp flottant : seulement pages "support" (pas sur les grilles où il gêne)
  const showWhatsApp =
    !hideChrome && (
      pathname === "/" ||
      pathname.startsWith("/contact") ||
      pathname.startsWith("/aide") ||
      pathname.startsWith("/securite") ||
      pathname.startsWith("/cgu") ||
      pathname.startsWith("/mentions") ||
      pathname.startsWith("/a-propos") ||
      pathname.startsWith("/blog")
    );

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <PWARegister />
      {!hideHeader && <Header />}
      {showCatStrip && <CategoryStrip />}
      <main className={`min-h-[40vh] ${hideBottomNav ? 'pb-8' : 'pb-20 lg:pb-0'}`}>{children}</main>
      {!noFooter && <Footer />}
      {!hideBottomNav && <BottomNav />}
      {showWhatsApp && <WhatsAppFloat />}
    </ToastProvider>
  );
}
