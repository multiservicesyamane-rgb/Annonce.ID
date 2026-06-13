"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBar from "./SearchBar";
import { createClient } from "@/lib/supabase/client";

/** Header sticky sombre translucide. Le sélecteur pays est discret (détail en footer). */
export default function Header() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });
  }, [supabase.auth]);

  return (
    <header className="sticky top-0 z-[900] border-b border-dark-border bg-dark-900/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[64px] max-w-[1320px] flex-wrap items-center gap-3 px-4 py-2 md:flex-nowrap">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 font-display text-[1.3rem] font-extrabold text-white">
          Annonces <span className="text-neon-gold">West</span>
          <span className="rounded-[5px] bg-grad-gold px-1.5 py-0.5 text-[.62rem] font-bold tracking-wide text-dark-900">
            27 PAYS
          </span>
        </Link>

        <div className="order-3 w-full md:order-none md:flex-1">
          <SearchBar variant="header" />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {/* Country Selector */}
          <button className="hidden items-center gap-1 rounded bg-dark-800 px-2.5 py-1.5 text-[.75rem] font-bold text-gray-300 hover:text-white md:flex transition-colors border border-gray-700 hover:border-gray-600">
            🇸🇳 SN ▾
          </button>
          
          {/* Dark Mode Toggle */}
          <button className="hidden h-[34px] w-[34px] items-center justify-center rounded-full text-gold hover:bg-white/10 md:flex transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          </button>
          
          {/* Notifications Bell */}
          {user && (
            <div className="relative group hidden md:block">
              <button className="relative h-[34px] w-[34px] flex items-center justify-center rounded-full text-gold hover:bg-white/10 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#E9437E] rounded-full"></span>
              </button>
              
              {/* Notifications Dropdown (Hover) */}
              <div className="absolute right-0 top-full mt-2 w-[320px] rounded-xl bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[999] border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                  <span className="font-bold text-gray-800 text-[.9rem]">Notifications</span>
                  <span className="text-[.75rem] font-bold text-green cursor-pointer hover:underline">Tout lire</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
                    <span className="text-2xl mb-2">📭</span>
                    <span className="text-[.8rem]">Aucune notification</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          {!user ? (
            <Link
              href="/connexion"
              className="btn btn-outline btn-sm hidden border-gray-600 bg-dark-800 !text-white hover:bg-dark-700 md:inline-flex rounded-[8px]"
            >
              Connexion
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="btn btn-outline btn-sm hidden border-green bg-green/10 !text-green hover:bg-green hover:!text-white md:inline-flex rounded-[8px] transition-colors"
            >
              👤 Mon Compte
            </Link>
          )}
          
          <Link href="/publier" className="btn btn-gold btn-sm rounded-[8px]">
            + Publier
          </Link>
        </div>
      </div>
    </header>
  );
}
