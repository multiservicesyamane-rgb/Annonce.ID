"use client";

import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Hero() {
  return (
    <section className="hero-shell w-full bg-[#0A0E14] dark:bg-[#0A0E14] pb-0 pt-0 md:pb-4 md:pt-2 px-2 md:px-4 transition-colors">
      <div className="mx-auto max-w-[1000px]">
        {/* The banner card */}
        <div className="hero-card relative overflow-hidden rounded-[20px] md:rounded-[24px] bg-[#111722] dark:bg-[#111722] border border-white/5 dark:border-white/5 p-3 py-3.5 md:px-6 md:py-4 shadow-xl">
          
          {/* Background Glows */}
          <div className="absolute inset-0 overflow-hidden rounded-[20px] md:rounded-[24px] pointer-events-none">
            <div className="absolute -bottom-20 -right-20 h-[200px] w-[200px] md:h-[300px] md:w-[300px] rounded-full bg-indigo-500/20 dark:bg-indigo-500/15 blur-[60px] md:blur-[80px]" />
            <div className="absolute top-0 -left-20 h-[150px] w-[150px] md:h-[250px] md:w-[250px] rounded-full bg-neon-gold/10 dark:bg-neon-gold/8 blur-[60px] md:blur-[80px]" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Left Text Content */}
            <div className="flex-1 w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[0.58rem] font-bold text-neon-gold mb-1.5 uppercase tracking-wider">
                ⚡ Simple • Rapide • Direct
              </div>
              <h1 className="font-display text-[1.4rem] sm:text-[1.8rem] md:text-[2rem] font-extrabold leading-[1.1] text-white dark:text-white mb-1 tracking-tight text-left">
                Vendez. Achetez. <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-neon-gold to-white">Trouvez.</span>
              </h1>
              
              <p className="text-[0.75rem] sm:text-[0.8rem] md:text-[0.85rem] text-gray-300 dark:text-gray-300 mb-2.5 max-w-[620px] leading-relaxed text-left">
                La plateforme de petites annonces la plus rapide au Sénégal. Connectez-vous directement par WhatsApp, sans commission.
              </p>

              {/* Action and Search bar Row */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <Link 
                  href="/publier" 
                  className="inline-flex items-center justify-between gap-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/15 dark:bg-white/5 backdrop-blur-md px-3.5 py-1.5 text-[0.75rem] md:text-[0.78rem] font-bold text-white dark:text-white hover:border-neon-gold hover:bg-white/20 transition-all duration-300 group shrink-0 w-max"
                >
                  Déposer une annonce 
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neon-gold text-dark-900 font-extrabold shadow-[0_0_12px_rgba(245,166,35,0.5)] group-hover:scale-110 transition-transform text-xs">
                    +
                  </span>
                </Link>

                {/* Search Bar inline wrapper */}
                <div className="w-full max-w-[420px]">
                  <SearchBar variant="hero" />
                </div>
              </div>

              {/* Desktop advantages */}
              <div className="hidden md:flex items-center gap-6 mt-3.5 pt-2.5 border-t border-white/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-[1rem]">🛡️</span>
                  <span className="text-white font-bold text-[0.62rem] tracking-wide">PAIEMENTS SÉCURISÉS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[1rem] text-neon-gold">🤝</span>
                  <span className="text-neon-gold font-bold text-[0.62rem] tracking-wide">VENDEURS VÉRIFIÉS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[1rem]">⚡</span>
                  <span className="text-white font-bold text-[0.62rem] tracking-wide">PUBLICATION RAPIDE</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
