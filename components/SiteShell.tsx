"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import CategoryStrip from "./CategoryStrip";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import WhatsAppFloat from "./WhatsAppFloat";
import { ToastProvider } from "./Toast";

/**
 * Décide quels éléments de chrome afficher selon la route.
 * - /yamanetech : aucun chrome (admin plein écran custom)
 * - auth/paiement/dashboard : header + bottom nav, pas de footer
 * - home/listing/annonce/recherche/categorie : chrome complet + bande catégories
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  const isAdmin = pathname.startsWith("/yamanetech");
  
  const isAuthOrDashboard = 
    pathname.startsWith("/connexion") ||
    pathname.startsWith("/inscription") ||
    pathname.startsWith("/paiement") ||
    pathname.startsWith("/publier") ||
    pathname.startsWith("/dashboard");

  const noFooter = isAdmin || isAuthOrDashboard;
  const isAnnoncePage = pathname.startsWith("/annonce/");
  
  // On cache le BottomNav et WhatsApp sur les pages où ça gène
  const hideChrome = isAdmin || isAuthOrDashboard;
  const hideBottomNav = hideChrome || isAnnoncePage;

  const showCatStrip =
    pathname === "/" ||
    pathname.startsWith("/categorie") ||
    pathname.startsWith("/recherche");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <Header />
      {showCatStrip && <CategoryStrip />}
      <main className={`min-h-[40vh] ${hideBottomNav ? 'pb-8' : 'pb-20 lg:pb-0'}`}>{children}</main>
      {!noFooter && <Footer />}
      {!hideBottomNav && <BottomNav />}
      {!(hideChrome || isAnnoncePage) && <WhatsAppFloat />}
    </ToastProvider>
  );
}
