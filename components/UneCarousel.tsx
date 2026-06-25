"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types";
import { colorForCategory } from "@/lib/constants";
function getRelativeTime(dateString?: string) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "À l'instant";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch (e) {
    return "";
  }
}

export default function UneCarousel({ listings }: { listings: Listing[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!listings || listings.length === 0) {
    return null;
  }

  let displayListings = listings;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let intervalId: ReturnType<typeof setInterval>;
    let isHovered = false;

    const scrollNext = () => {
      if (!isHovered && el && el.children.length > 0) {
        // L'utilisateur veut "pousser 2" : donc on fait défiler par 2 cartes à la fois
        const firstChild = el.children[0] as HTMLElement;
        const scrollAmount = (firstChild.offsetWidth + 16) * 2; 
        
        // Si on est à la fin, on revient au début
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    };

    // Défilement plus rapide (toutes les 2,8 s)
    intervalId = setInterval(scrollNext, 2800);

    const handleMouseEnter = () => (isHovered = true);
    const handleMouseLeave = () => (isHovered = false);

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("touchstart", handleMouseEnter, { passive: true });
    el.addEventListener("touchend", handleMouseLeave);

    return () => {
      clearInterval(intervalId);
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("touchstart", handleMouseEnter);
      el.removeEventListener("touchend", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar flex gap-3 md:gap-4 overflow-x-auto pb-4 px-1"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {displayListings.map((ad, i) => (
        <React.Fragment key={ad.id}>
          <Link
            href={`/annonce/${ad.id}/${ad.slug}`}
            className="group relative flex flex-col shrink-0 w-[156px] md:w-[250px] bg-gradient-to-br from-[#6366F1] via-[#7C5CFC] to-[#A855F7] rounded-[20px] p-1.5 md:p-2 shadow-[0_10px_25px_rgba(99,102,241,0.2)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(124,92,252,0.35)]"
          >
            {/* Image Container — carré, image pleine (cover) */}
            <div className="relative w-full aspect-square rounded-[14px] overflow-hidden mb-2">
              <Image
                src={ad.image}
                alt={ad.title}
                width={300}
                height={300}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#4338CA]/70 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
              
              {/* Featured Badge */}
              <div className="absolute top-1.5 left-1.5 bg-white/95 dark:bg-dark-900/90 text-[#6D28D9] dark:text-neon-gold text-[8px] md:text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase shadow-md flex items-center gap-0.5 border border-purple-200 dark:border-white/5">
                <span>✦</span> À la Une
              </div>
              {/* Badge catégorie — couleur spécifique */}
              {ad.category && (
                <div className="absolute top-1.5 right-1.5 max-w-[60%] truncate text-white text-[8px] md:text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-md" style={{ backgroundColor: colorForCategory(ad.category) }}>
                  {ad.category}
                </div>
              )}
            </div>

            {/* Info details */}
            <div className="flex-1 px-1">
              <div className="font-bold text-white text-[0.7rem] md:text-[0.82rem] leading-tight line-clamp-2 mb-0.5 group-hover:underline">
                {ad.title}
              </div>
              <div className="font-display font-black text-white text-[0.82rem] md:text-[1.05rem] mb-1.5 drop-shadow-sm">
                {ad.price}
              </div>
              <div className="text-[0.6rem] md:text-[0.7rem] text-white/80 flex items-center justify-between gap-1 mt-auto font-medium">
                <span className="flex items-center gap-1 truncate">
                  <span>📍</span> <span className="truncate">{ad.location}</span>
                </span>
                {ad.created_at && (
                  <span className="shrink-0 text-white/60">
                    {getRelativeTime(ad.created_at)}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom certification strip */}
            <div className="mt-2.5 mx-0.5 pt-2 border-t border-white/15 flex items-center gap-1.5">
              <div className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 bg-white/15 border border-white/25 rounded-full flex items-center justify-center text-[0.55rem] md:text-[0.65rem] text-white">
                👑
              </div>
              <div className="text-[0.55rem] md:text-[0.65rem] font-extrabold text-white/90 uppercase tracking-widest truncate">
                Garanti Vérifié
              </div>
            </div>
          </Link>
        </React.Fragment>
      ))}
    </div>
  );
}
