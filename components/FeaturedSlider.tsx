"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { id: any; slug: string; title: string; price: string; location: string; image: string; category: string };

/**
 * Bandeau « À la Une » — 5 affiches produits qui défilent (style flash premium).
 * Chaque slide est cliquable → renvoie sur la fiche de l'annonce.
 */
export default function FeaturedSlider({ listings }: { listings: Item[] }) {
  const slides = (listings || []).slice(0, 12);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 2500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <div className="wrap mt-3">
      <div className="relative h-[172px] sm:h-[210px] md:h-[250px] overflow-hidden rounded-[20px] border border-gray-100 dark:border-white/10 bg-[#0B1120] shadow-lg">
        {slides.map((s, idx) => (
          <Link
            key={String(s.id)}
            href={`/annonce/${s.id}/${s.slug}`}
            aria-hidden={idx !== i}
            tabIndex={idx === i ? 0 : -1}
            className={`absolute inset-0 flex transition-opacity duration-700 ${idx === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            {/* Panneau texte (gauche) */}
            <div className="relative flex w-[56%] flex-col justify-center gap-1 overflow-hidden bg-gradient-to-br from-[#111722] via-[#1a1f3a] to-[#2a1f4a] p-3 sm:gap-2 sm:p-7">
              <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-[#6366F1]/30 blur-3xl" />
              <span className="relative w-max rounded-full bg-gradient-to-r from-neon-gold to-[#D4891A] px-2.5 py-0.5 text-[.55rem] font-black uppercase tracking-wider text-dark-900 shadow sm:px-3 sm:py-1 sm:text-[.6rem]">✦ À la Une</span>
              <h2 className="relative font-display text-[.92rem] font-black leading-tight text-white line-clamp-2 sm:text-[1.45rem]">{s.title}</h2>
              <div className="relative font-display text-[1rem] font-black text-neon-gold drop-shadow sm:text-[1.45rem]">{s.price}</div>
              <div className="relative truncate text-[.66rem] text-white/70 sm:text-[.82rem]">📍 {s.location}</div>
              <span className="relative mt-0.5 w-max rounded-full bg-gradient-to-r from-[#6366F1] to-[#A855F7] px-3.5 py-1.5 text-[.7rem] font-bold text-white shadow-lg sm:px-5 sm:py-2 sm:text-[.85rem]">Voir l'annonce →</span>
              <span className="relative mt-0.5 hidden text-[.55rem] font-semibold uppercase tracking-widest text-white/40 sm:block sm:text-[.64rem]">Achetez · Vendez · Trouvez facilement</span>
            </div>
            {/* Image produit (droite) — bien affichée, pas en fond */}
            <div className="relative w-[44%] bg-gradient-to-br from-gray-100 to-gray-300 dark:from-[#0b0e16] dark:to-[#161b2b]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
            </div>
          </Link>
        ))}

        {slides.length > 1 && (
          <>
            <button onClick={() => setI((v) => (v - 1 + slides.length) % slides.length)} aria-label="Précédent" className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl text-white backdrop-blur hover:bg-black/70">‹</button>
            <button onClick={() => setI((v) => (v + 1) % slides.length)} aria-label="Suivant" className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl text-white backdrop-blur hover:bg-black/70">›</button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {slides.map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} aria-label={`Affiche ${idx + 1}`} className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-neon-gold" : "w-2 bg-white/50 hover:bg-white/80"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
