"use client";

import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Hero() {
  return (
    <section className="hero-shell w-full bg-[#0A0E14] dark:bg-[#0A0E14] pb-0 pt-0 md:pb-4 md:pt-2 px-2 md:px-4 transition-colors">
      <div className="mx-auto max-w-[1320px]">
        {/* The banner card */}
        <div className="hero-card relative overflow-hidden rounded-[14px] md:rounded-[24px] bg-[#111722] dark:bg-[#111722] border border-white/5 dark:border-white/5 p-3 py-3 md:p-10 shadow-xl">
          
          {/* Background Glows */}
          <div className="absolute inset-0 overflow-hidden rounded-[14px] md:rounded-[24px] pointer-events-none">
            <div className="absolute -bottom-20 -right-20 h-[200px] w-[200px] md:h-[300px] md:w-[300px] rounded-full bg-green-500/20 dark:bg-green-500/20 blur-[60px] md:blur-[80px]" />
            <div className="absolute top-0 -left-20 h-[150px] w-[150px] md:h-[200px] md:w-[200px] rounded-full bg-neon-gold/10 dark:bg-neon-gold/10 blur-[60px] md:blur-[80px]" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-8">
            
            {/* Left Text Content */}
            <div className="flex-1 w-full max-w-[500px]">
              <h1 className="font-display text-[1.4rem] md:text-[3.2rem] font-extrabold leading-[1.05] text-white dark:text-white mb-0.5 md:mb-4">
                Vendez. Achetez.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-neon-gold to-white">Trouvez.</span>
              </h1>
              <p className="text-[.75rem] md:text-[1.1rem] text-gray-400 dark:text-gray-400 mb-2 md:mb-8 max-w-[400px] leading-snug">
                Des milliers d&apos;annonces au Sénégal. Achetez et vendez plus vite.
              </p>

              {/* CTA Button */}
              <Link href="/publier" className="inline-flex items-center justify-between w-max gap-2 md:gap-4 rounded-full border border-white/30 dark:border-gray-600 bg-white/10 dark:bg-transparent px-2.5 py-1 md:px-5 md:py-2.5 text-[.72rem] md:text-[.95rem] font-bold text-white dark:text-white hover:border-neon-gold transition-colors group">
                Déposer une annonce 
                <span className="flex items-center justify-center w-4 h-4 md:w-8 md:h-8 rounded-full bg-neon-gold text-dark-900 font-extrabold shadow-[0_0_12px_rgba(245,166,35,0.4)] group-hover:scale-110 transition-transform text-[.65rem] md:text-base">
                  +
                </span>
              </Link>

              {/* Mobile Search Bar */}
              <div className="mt-3 w-full block md:hidden">
                <SearchBar variant="hero" />
              </div>

              {/* Desktop advantages */}
              <div className="hidden md:flex items-center gap-8 mt-8 pt-6 border-t border-white/10 dark:border-white/10">
                <div className="flex flex-col">
                  <span className="text-[1.8rem] font-black text-green-400 leading-none">🛡️</span>
                  <span className="text-gray-400 dark:text-gray-400 text-[.7rem] font-bold uppercase tracking-wider mt-1">Paiements Sécurisés</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[1.8rem] font-black text-neon-gold leading-none">🤝</span>
                  <span className="text-gray-400 dark:text-gray-400 text-[.7rem] font-bold uppercase tracking-wider mt-1">Vendeurs Vérifiés</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[1.8rem] font-black text-white leading-none">⚡</span>
                  <span className="text-gray-400 dark:text-gray-400 text-[.7rem] font-bold uppercase tracking-wider mt-1">Publication Rapide</span>
                </div>
              </div>
            </div>

            {/* Right Visual (desktop only) */}
            <div className="flex-1 w-full max-w-[480px] relative hidden md:block">
              <style>{`
                @keyframes float {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-12px) rotate(1deg); }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-delayed { animation: float 7s ease-in-out infinite 2s; }
                .animate-float-slow { animation: float 8s ease-in-out infinite 1s; }
              `}</style>
              
              <div className="relative w-full aspect-[4/3] flex items-center justify-center">
                <div className="absolute w-[300px] h-[300px] bg-green-500/20 rounded-full blur-[80px]"></div>
                <div className="absolute w-[200px] h-[200px] bg-neon-gold/20 rounded-full blur-[60px] translate-x-20 -translate-y-10"></div>
                
                <div className="relative z-20 w-[240px] h-[320px] rounded-[24px] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl p-4 flex flex-col animate-float hover:border-neon-gold/50 transition-colors cursor-pointer">
                  <div className="w-full h-[140px] rounded-[16px] bg-gradient-to-br from-neon-gold/20 to-green-500/20 mb-4 overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1505156868547-9b49f4df4e04?q=80&w=400&auto=format&fit=crop" alt="iPhone" className="w-full h-full object-cover mix-blend-overlay" />
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-[0.6rem] font-bold text-neon-gold border border-white/10">VIP</div>
                  </div>
                  <div className="w-2/3 h-3 bg-white/20 rounded-full mb-2"></div>
                  <div className="w-1/2 h-3 bg-white/10 rounded-full mb-4"></div>
                  <div className="flex items-center justify-between mt-auto">
                     <div className="text-neon-gold font-bold text-lg tracking-tight">350.000 F</div>
                     <div className="w-8 h-8 rounded-full bg-neon-gold flex items-center justify-center text-dark-900 text-xs font-extrabold shadow-[0_0_15px_rgba(245,166,35,0.5)] hover:scale-110 transition-transform">+</div>
                  </div>
                </div>

                <div className="absolute z-10 -left-6 bottom-8 w-[180px] h-[120px] rounded-[16px] bg-white/[0.02] border border-white/10 backdrop-blur-lg shadow-xl p-3 flex items-center gap-3 animate-float-slow hover:border-white/50 transition-colors cursor-pointer">
                  <div className="w-[60px] h-[60px] rounded-xl overflow-hidden bg-white/5 shrink-0 relative">
                    <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=200&auto=format&fit=crop" alt="Car" className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="w-full h-2 bg-white/20 rounded-full"></div>
                    <div className="w-3/4 h-2 bg-white/10 rounded-full"></div>
                    <div className="text-white font-bold text-[0.7rem] mt-1">12.5M FCFA</div>
                  </div>
                </div>

                <div className="absolute z-30 -right-2 top-8 w-[160px] h-[180px] rounded-[20px] bg-[#111722]/80 border border-white/10 backdrop-blur-xl shadow-2xl p-3 flex flex-col animate-float-delayed hover:border-green-400/50 transition-colors cursor-pointer">
                  <div className="w-full h-[80px] rounded-xl overflow-hidden bg-white/5 mb-3 relative">
                    <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=300&auto=format&fit=crop" alt="Home" className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full mb-1.5"></div>
                  <div className="w-1/2 h-2 bg-white/10 rounded-full"></div>
                  <div className="mt-auto flex gap-1">
                    <span className="text-[0.6rem] bg-white/10 px-1.5 py-0.5 rounded text-white/70">4 Ch.</span>
                    <span className="text-[0.6rem] bg-white/10 px-1.5 py-0.5 rounded text-white/70">Dakar</span>
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
