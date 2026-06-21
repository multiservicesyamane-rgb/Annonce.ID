"use client";

import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Hero() {
  return (
    <section className="hero-shell w-full bg-[#0A0E14] dark:bg-[#0A0E14] pb-0 pt-0 md:pb-3 md:pt-1.5 px-2 md:px-4 transition-colors">
      <div className="mx-auto max-w-[1000px]">
        {/* The banner card */}
        <div className="hero-card relative overflow-hidden rounded-[16px] md:rounded-[20px] bg-[#111722] dark:bg-[#111722] border border-white/5 dark:border-white/5 p-3 py-3 md:px-6 md:py-3 shadow-xl">
          
          {/* Background Glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -bottom-20 -right-20 h-[150px] w-[150px] rounded-full bg-indigo-500/10 blur-[50px]" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Title Block */}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[1.25rem] sm:text-[1.4rem] md:text-[1.55rem] font-extrabold leading-tight text-white dark:text-white tracking-tight">
                Vendez. Achetez. <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-neon-gold to-white">Trouvez.</span>
              </h1>
              <p className="text-[0.72rem] sm:text-[0.78rem] text-gray-400 mt-0.5">
                La plateforme de petites annonces directe au Sénégal, sans commission.
              </p>
            </div>
            
            {/* Search & Publish Row */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto shrink-0 mt-1 md:mt-0">
              <Link 
                href="/publier" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3.5 py-1.5 text-[0.75rem] font-bold text-white hover:bg-white/20 transition-all shrink-0"
              >
                Déposer +
              </Link>
              <div className="w-full sm:w-[240px] md:w-[280px]">
                <SearchBar variant="hero" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
