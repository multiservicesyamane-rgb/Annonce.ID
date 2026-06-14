"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";
import DarkToggle from "./DarkToggle";
import { createClient } from "@/lib/supabase/client";

/** Header sticky sombre translucide. Le sélecteur pays est discret (détail en footer). */
export default function Header() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });
  }, [supabase.auth]);

  return (
    <header className="sticky top-0 z-[900] border-b border-dark-border bg-dark-900/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[64px] max-w-[1320px] flex-wrap items-center justify-between px-3 py-2 md:flex-nowrap md:gap-3 md:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 font-display text-[1.15rem] font-extrabold text-white md:text-[1.3rem]">
          Annonce<span className="text-neon-gold">.ID</span>
        </Link>

        {!pathname.startsWith("/dashboard") && (
          <div className="order-3 w-full hidden lg:block md:order-none md:flex-1">
            <SearchBar variant="header" />
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1.5 md:ml-auto md:gap-3">

          
          {/* Dark Mode Toggle */}
          <DarkToggle />
          
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
              className="flex items-center justify-center h-9 w-9 md:w-auto md:px-3 md:py-1.5 border border-gray-600 bg-dark-800 text-white hover:bg-dark-700 rounded-[8px] transition-colors"
              title="Connexion"
            >
              <span className="text-[1.1rem] md:mr-1.5">🔐</span>
              <span className="hidden md:inline font-bold text-[.85rem]">Connexion</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1 md:gap-2">
              <Link
                href={`/boutique/${user.id}`}
                className="flex items-center justify-center h-8 w-8 md:h-9 md:w-auto md:px-3 md:py-1.5 border-none md:border border-gold bg-gold/10 text-gold hover:bg-gold hover:text-dark-900 rounded-[8px] transition-colors"
                title="Ma Boutique"
              >
                <span className="text-[1.1rem] md:mr-1.5">🏪</span>
                <span className="hidden md:inline font-bold text-[.85rem]">Ma Boutique</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center justify-center h-8 w-8 md:h-9 md:w-auto md:px-3 md:py-1.5 border-none md:border border-green bg-green/10 text-green hover:bg-green hover:text-white rounded-[8px] transition-colors"
                title="Mon Compte"
              >
                <span className="text-[1.1rem] md:mr-1.5">👤</span>
                <span className="hidden md:inline font-bold text-[.85rem]">Mon Compte</span>
              </Link>
            </div>
          )}
          
          <Link href="/publier" className="btn btn-gold btn-sm px-2 py-1.5 md:px-4 md:py-2 rounded-[8px]">
            <span className="hidden sm:inline">+ Vendre</span>
            <span className="sm:hidden text-[.75rem] font-bold">Vendre</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
