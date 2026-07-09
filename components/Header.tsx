"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";
import DarkToggle from "./DarkToggle";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  // Sur un sous-domaine de categorie (vehicules.wanteermako.com...), le logo
  // doit ramener a l'accueil PRINCIPAL, pas a l'accueil du sous-domaine.
  const [homeHref, setHomeHref] = useState("/");
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "wanteermako.com")
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");
    const host = window.location.hostname.replace(/^www\./, "");
    if (host !== root && host.endsWith(`.${root}`)) {
      setHomeHref(`https://${root}`);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUser(user);
      // Messages non lus → badge de notification
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false)
        .then(({ count }) => setUnread(count || 0));
    });
  }, [supabase]);

  return (
    <header className="sticky top-0 z-[900] w-full px-2 pt-2 pb-1 transition-colors">
      <div className="header-shell mx-auto max-w-[1320px] rounded-2xl border border-white/5 bg-[#0A0E14]/85 backdrop-blur-2xl px-3 py-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)]">

        <div className="flex items-center justify-between gap-2 md:gap-4">
          
          {/* Logo */}
          <Link href={homeHref} className="flex items-center shrink-0">
            <span className="inline-flex items-center rounded-[12px] bg-white px-2 py-1 shadow-md ring-1 ring-black/5">
              <img src="/logo-full.jpg" alt="Wanteermako" className="h-[44px] md:h-[58px] w-auto object-contain" />
            </span>
          </Link>

          {/* Search Bar - Center on PC, Hidden on Mobile */}
          {!pathname.startsWith("/dashboard") && (
            <div className="hidden md:flex flex-1 max-w-[550px]">
              <SearchBar variant="header" />
            </div>
          )}

          {/* Right Icons */}
          <div className="flex items-center gap-2 md:gap-3">
            <DarkToggle />
            
            {/* Notification Bell (logged in) */}
            {user && (
              <Link href="/dashboard" title={unread > 0 ? `${unread} message(s) non lu(s)` : "Notifications"} className="text-gray-600 dark:text-white hover:text-green relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unread > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 flex items-center justify-center rounded-full bg-red-500 text-[.58rem] font-extrabold text-white border-[1.5px] border-white dark:border-[#0A0E14]">{unread > 9 ? "9+" : unread}</span>
                ) : (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-neon-gold border-[1.5px] border-white dark:border-[#0A0E14]"></span>
                )}
              </Link>
            )}

            {/* Compte / Connexion (mobile) — clair pour tous */}
            {user ? (
              <Link href="/dashboard" aria-label="Mon compte" className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-green-500/40 bg-green-500/15 text-green-600 dark:text-green-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </Link>
            ) : (
              <Link href="/connexion" className="md:hidden inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500 to-[#F5A623] px-3 py-1.5 text-[.78rem] font-extrabold text-white shadow-md">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Connexion
              </Link>
            )}

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/boutiques"
                className="flex items-center px-3 py-1.5 border border-gold bg-gold/10 text-gold-dark dark:text-gold hover:bg-gold hover:text-dark-900 rounded-[10px] transition-colors font-bold text-[.8rem]"
              >
                🏪 Boutiques
              </Link>
              {!user ? (
                <Link
                  href="/connexion"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-green rounded-[10px] transition-colors font-bold text-[.82rem]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Connexion
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="flex items-center px-3 py-1.5 border border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white rounded-[10px] transition-colors font-bold text-[.8rem]"
                >
                  👤 Compte
                </Link>
              )}
              
              <Link href="/publier" className="flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-[#F5A623] text-white hover:scale-105 rounded-[10px] transition-transform font-bold text-[.82rem] shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                + Vendre
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
