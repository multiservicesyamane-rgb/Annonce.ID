"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types";
import AdCard from "./AdCard";

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

    // Défilement chaque 5 secondes (plus lent pour laisser le temps de lire)
    intervalId = setInterval(scrollNext, 5000);

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
      className="no-scrollbar flex gap-2 md:gap-3 overflow-x-auto pb-4"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {displayListings.map((ad, i) => (
        <React.Fragment key={ad.id}>
          <Link
            href={`/annonce/${ad.id}/${ad.slug}`}
            className="group relative flex flex-col shrink-0 w-[185px] md:w-[260px] bg-gradient-to-br from-[#0B1526] to-[#040A14] border border-[#1E3050] rounded-[14px] p-1.5 md:p-2 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)] hover:border-[#D4AF37]"
          >
            <div className="relative w-full aspect-square rounded-[8px] overflow-hidden mb-1.5 md:mb-2">
              <Image
                src={ad.image}
                alt={ad.title}
                width={300}
                height={300}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1526]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black text-[8px] md:text-[9px] font-extrabold px-1.5 md:px-2 py-0.5 rounded-full tracking-wide uppercase shadow-md flex items-center gap-0.5">
                <span className="text-[9px] md:text-[10px]">✨</span> À la Une
              </div>
            </div>

            <div className="flex justify-between gap-1.5 flex-1">
              <div className="flex flex-col flex-1">
                <div className="font-bold text-white text-[.65rem] md:text-[.8rem] leading-tight line-clamp-2 mb-1 group-hover:text-[#D4AF37] transition-colors">{ad.title}</div>
                <div className="font-display font-extrabold text-[#D4AF37] text-[.75rem] md:text-[.9rem] mb-1">{ad.price}</div>
                <div className="text-[.6rem] md:text-[.7rem] text-[#8C9BB4] flex items-center gap-1 mt-auto">
                  <span>📍</span> <span className="truncate">{ad.location}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 justify-end hidden sm:flex">
                <button className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-[#1E3050]/50 border border-[#1E3050] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all duration-300 shadow-sm text-[.9rem] md:text-[1rem]">📞</button>
                <button className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-[#1E3050]/50 border border-[#1E3050] text-[#10B981] hover:bg-[#10B981] hover:text-white transition-all duration-300 shadow-sm text-[.9rem] md:text-[1rem]">💬</button>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-[#1E3050] flex items-center gap-1.5">
              <div className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full flex items-center justify-center text-[.6rem] md:text-[.7rem] text-[#D4AF37]">👑</div>
              <div className="text-[.55rem] md:text-[.65rem] font-bold text-[#8C9BB4] uppercase tracking-wider truncate">Certifié</div>
            </div>
          </Link>

        </React.Fragment>
      ))}
    </div>
  );
}
