"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import SearchBar from "./SearchBar";
import type { MapPoint } from "@/lib/geo";

// Leaflet manipule `window` : chargement client uniquement, et hors du bundle
// initial pour ne pas retarder l'affichage du hero (LCP).
const ListingsMap = dynamic(() => import("./ListingsMap"), {
  ssr: false,
  // Mêmes hauteurs que la carte réelle (en-tête + carte + légende) : la place
  // est réservée dès le premier rendu, donc aucun décalage (CLS).
  // Hauteurs identiques à celles de la carte réelle → place réservée dès le
  // premier rendu, donc aucun décalage visuel (CLS) quand Leaflet arrive.
  loading: () => <div className="h-[420px] bg-[#0D1420] sm:h-[440px] md:h-[500px]" />,
});

export default function Hero({ points = [] }: { points?: MapPoint[] }) {
  return (
    <section className="hero-shell w-full bg-[#0A0E14] dark:bg-[#0A0E14] pb-0 pt-0 md:pb-3 md:pt-1.5 px-2 md:px-4 transition-colors">
      <div className="mx-auto max-w-[1000px]">
        {/* The banner card */}
        <div className="hero-card relative overflow-hidden rounded-[16px] md:rounded-[20px] bg-gradient-to-br from-[#111722] via-[#141b2e] to-[#1b1330] border border-white/10 p-3 py-4 md:px-6 md:py-5 shadow-[0_16px_50px_-16px_rgba(124,92,252,0.35)]">

          {/* Background Glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-16 h-[220px] w-[220px] rounded-full bg-[#7C5CFC]/20 blur-[70px]" />
            <div className="absolute -bottom-24 -right-16 h-[220px] w-[220px] rounded-full bg-[#F5A623]/15 blur-[70px]" />
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Title Block */}
            <div className="min-w-0 flex-1 text-center md:text-left">
              <h1 className="font-display text-[1.15rem] sm:text-[1.4rem] md:text-[1.6rem] font-extrabold leading-snug text-white tracking-tight">
                Achetez malin, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-neon-gold to-[#FFD166]">vendez vite</span> 🇸🇳
              </h1>
              {/* Masqués sur mobile : la place va à la carte, qui vend mieux
                  que du texte. Conservés sur tablette/desktop. */}
              <p className="hidden sm:block text-[0.8rem] text-gray-400 mt-1">
                Des milliers d'annonces en direct — sans commission, sans intermédiaire.
              </p>
              <div className="mt-2 hidden sm:flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                {["✓ Publication gratuite", "✓ 0% commission", "✓ Contact WhatsApp direct"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[.62rem] sm:text-[.68rem] font-bold text-gray-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Recherche + Vendre. Quand la carte est présente, ces actions sont
                posées SUR la carte (voir plus bas) : on évite le doublon. */}
            <div className={`${points.length > 0 ? "hidden" : "flex"} flex-col sm:flex-row items-center gap-2 w-full md:w-auto shrink-0 mt-1.5 md:mt-0`}>
              <Link
                href="/publier"
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-green-500 via-[#F5A623] to-[#FFD166] px-5 py-2.5 text-[0.85rem] font-extrabold text-white shadow-[0_8px_24px_-6px_rgba(245,166,35,0.55)] transition-all hover:scale-[1.04] hover:shadow-[0_10px_30px_-6px_rgba(245,166,35,0.7)] shrink-0"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="text-[1rem]">💰</span> Vendre maintenant
              </Link>
              <div className="w-full sm:w-[240px] md:w-[280px]">
                <SearchBar variant="hero" />
              </div>
            </div>
          </div>

        </div>

        {/* Carte des annonces, pleine largeur, avec la recherche posée dessus */}
        {points.length > 0 && (
          <div className="relative mt-2 overflow-hidden rounded-[16px] border border-white/10 md:mt-3 md:rounded-[20px]">
            <ListingsMap points={points} />

            {/* Recherche en surimpression. z-[1100] : au-dessus des contrôles
                Leaflet (z-1000) et des bulles (z-700). */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[1100] p-2.5 sm:p-3">
              <div className="pointer-events-auto mx-auto flex w-full max-w-[560px] flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1 rounded-xl bg-white/95 shadow-lg backdrop-blur-sm dark:bg-[#0D1420]/95">
                  <SearchBar variant="hero" />
                </div>
                <Link
                  href="/publier"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-green-500 via-[#F5A623] to-[#FFD166] px-4 py-2.5 text-[0.82rem] font-extrabold text-white shadow-lg transition-transform hover:scale-[1.03]"
                >
                  💰 Vendre
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
