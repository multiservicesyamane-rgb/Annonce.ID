"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import CategoryStrip from "./CategoryStrip";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
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
  const noFooter =
    isAdmin ||
    pathname.startsWith("/connexion") ||
    pathname.startsWith("/inscription") ||
    pathname.startsWith("/paiement") ||
    pathname.startsWith("/dashboard");
  const showCatStrip =
    pathname === "/" ||
    pathname.startsWith("/categorie") ||
    pathname.startsWith("/annonce") ||
    pathname.startsWith("/recherche");

  if (isAdmin) {
    return <>{children}</>;
  }

  const isAnnoncePage = pathname.startsWith("/annonce/");

  return (
    <ToastProvider>
      <Header />
      {showCatStrip && <CategoryStrip />}
      <main className={`min-h-[40vh] ${isAnnoncePage ? 'pb-20' : 'pb-20 lg:pb-0'}`}>{children}</main>
      {!noFooter && <Footer />}
      {!isAnnoncePage && <BottomNav />}
    </ToastProvider>
  );
}
