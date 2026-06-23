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
  const pathname = usePathname();
  const supabase = createClient();

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
    <header className="header-shell sticky top-0 z-[900] w-full bg-[#0A0E14]/95 dark:bg-[#0A0E14]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 transition-colors">
      <div className="mx-auto max-w-[1320px] px-3 py-1 md:py-1.5">
        
        <div className="flex items-center justify-between gap-2 md:gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <span className="inline-flex items-center rounded-[10px] bg-white px-1.5 py-1 shadow-sm">
              <img src="/logo-full.jpg" alt="Wanteermako" className="h-[34px] md:h-[46px] w-auto object-contain" />
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

            {/* Account Icon (mobile) */}
            <Link href={user ? "/dashboard" : "/connexion"} className="md:hidden text-gray-600 dark:text-white hover:text-green transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Link>

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
