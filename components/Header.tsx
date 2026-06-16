"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";
import DarkToggle from "./DarkToggle";
import { createClient } from "@/lib/supabase/client";

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
    <header className="sticky top-0 z-[900] w-full bg-[#0A0E14]/95 backdrop-blur-md border-b border-white/5 transition-colors">
      <div className="mx-auto max-w-[1320px] px-3 md:px-4 py-2 md:py-3">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          
          {/* Top Row on Mobile (Logo + Icons), Left side on PC */}
          <div className="flex w-full md:w-auto items-center justify-between">
            
            {/* Logo */}
            <div className="flex flex-col">
              <Link href="/" className="flex items-center">
                <img src="/annoncesn.jpeg" alt="Annonce.Sn" className="h-[35px] md:h-[45px] w-auto object-contain rounded-md" />
              </Link>
              <div className="hidden md:flex items-center gap-1 mt-0.5 text-[.75rem] text-gray-400 font-medium ml-1">
                Achetez, vendez, trouvez facilement
              </div>
            </div>

            {/* Mobile-only right side (Icons) */}
            <div className="flex md:hidden items-center gap-4">
              <DarkToggle />
              
              {/* Bell Icon (Only if logged in) */}
              {user && (
                <Link href="/dashboard" className="text-white hover:text-neon-gold relative group">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-neon-gold border-[1.5px] border-[#0A0E14]"></span>
                </Link>
              )}

              {/* Account / User Icon (Always visible) */}
              <Link href={user ? "/dashboard" : "/connexion"} className="text-white hover:text-green-400 transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </Link>
            </div>
          </div>

          {/* Search Bar - Center on PC, Hidden on Mobile */}
          {!pathname.startsWith("/dashboard") && (
            <div className="hidden md:flex flex-1 md:max-w-[600px] order-3 md:order-none">
              <SearchBar variant="header" />
            </div>
          )}

          {/* Right Icons & Auth - PC Only (Mobile handled above) */}
          <div className="hidden md:flex shrink-0 items-center gap-4 order-2 md:order-none">
            <DarkToggle />
            
            {/* Desktop Notification Bell */}
            {user && (
              <div className="relative group cursor-pointer text-white hover:text-neon-gold transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-neon-gold border-[1.5px] border-[#0A0E14] shadow-[0_0_10px_rgba(245,166,35,0.8)]"></span>
              </div>
            )}

            {/* Desktop Buttons */}
            {!user ? (
              <Link
                href="/connexion"
                className="flex items-center justify-center gap-1.5 px-4 py-2 border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-green-400 rounded-[12px] transition-colors font-bold text-[.9rem]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Connexion</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/boutique/${user.id}`}
                  className="flex items-center justify-center px-3 py-1.5 border border-gold bg-gold/10 text-gold hover:bg-gold hover:text-dark-900 rounded-[10px] transition-colors font-bold text-[.85rem]"
                >
                  🏪 Ma Boutique
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center px-3 py-1.5 border border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded-[10px] transition-colors font-bold text-[.85rem]"
                >
                  👤 Mon Compte
                </Link>
              </div>
            )}
            
            <Link href="/publier" className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-[#F5A623] text-white hover:scale-105 rounded-[12px] transition-transform font-bold text-[.9rem] shadow-[0_0_15px_rgba(0,168,89,0.5)]">
              + Vendre
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
