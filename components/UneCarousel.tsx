"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types";

export default function UneCarousel({ listings }: { listings: Listing[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ensure we have at least 10 items
  let displayListings = [...listings];
  if (displayListings.length > 0) {
    while (displayListings.length < 10) {
      displayListings = [...displayListings, ...displayListings.map(u => ({ ...u, id: u.id + Math.random() }))];
    }
  }
  displayListings = displayListings.slice(0, 10);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animationId: number;
    let isHovered = false;

    const scroll = () => {
      if (!isHovered) {
        el.scrollLeft += 0.5; // very slow scroll
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          // Reset to start if we reached the end
          el.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    const handleMouseEnter = () => (isHovered = true);
    const handleMouseLeave = () => (isHovered = false);

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("touchstart", handleMouseEnter, { passive: true });
    el.addEventListener("touchend", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("touchstart", handleMouseEnter);
      el.removeEventListener("touchend", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar flex gap-4 overflow-x-auto pb-4"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {displayListings.map((ad, i) => (
        <React.Fragment key={ad.id}>
          <Link
            href={`/annonce/${ad.id}/${ad.slug}`}
            className="group relative flex flex-col shrink-0 w-[280px] bg-gradient-to-br from-[#0B1526] to-[#040A14] border border-[#1E3050] rounded-[16px] p-3.5 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)] hover:border-[#D4AF37]"
          >
            <div className="relative w-full aspect-square rounded-[10px] overflow-hidden mb-4">
              <Image
                src={ad.image}
                alt={ad.title}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1526]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-2 left-2 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black text-[10px] font-extrabold px-3 py-1.5 rounded-full tracking-widest uppercase shadow-md flex items-center gap-1.5">
                <span className="text-xs">✨</span> À la Une
              </div>
            </div>

            <div className="flex justify-between gap-3 flex-1">
              <div className="flex flex-col flex-1">
                <div className="font-bold text-white text-[.95rem] leading-tight line-clamp-2 mb-2 group-hover:text-[#D4AF37] transition-colors">{ad.title}</div>
                <div className="font-display font-extrabold text-[#D4AF37] text-[1.1rem] mb-2">{ad.price}</div>
                <div className="text-[.75rem] text-[#8C9BB4] flex items-center gap-1.5 mt-auto">
                  <span>📍</span> {ad.location}
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end">
                <button className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-[#1E3050]/50 border border-[#1E3050] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all duration-300 shadow-sm text-[1.2rem]">📞</button>
                <button className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-[#1E3050]/50 border border-[#1E3050] text-[#10B981] hover:bg-[#10B981] hover:text-white transition-all duration-300 shadow-sm text-[1.2rem]">💬</button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1E3050] flex items-center gap-2.5">
              <div className="w-7 h-7 flex-shrink-0 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full flex items-center justify-center text-[.8rem] text-[#D4AF37]">👑</div>
              <div className="text-[.75rem] font-bold text-[#8C9BB4] uppercase tracking-wider truncate">Vendeur Certifié</div>
            </div>
          </Link>

          {/* Insert CTA card right after the first item */}
          {i === 0 && (
            <Link
              href="/publier"
              className="group shrink-0 w-[280px] bg-gradient-to-br from-[#121A2F] to-[#0B1526] border border-[#1E3050] rounded-[16px] p-6 flex flex-col items-center justify-center text-center shadow-lg hover:-translate-y-2 transition-all duration-300 hover:border-[#D4AF37] hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.1)_0%,transparent_70%)] pointer-events-none"></div>
              <h3 className="font-display font-bold text-white text-[1.1rem] mb-4 leading-snug relative z-10 group-hover:text-[#D4AF37] transition-colors">
                Propulsez vos ventes au sommet
              </h3>
              <div className="w-20 h-20 mb-5 bg-[#1E3050]/50 rounded-full flex items-center justify-center text-4xl border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.2)] relative z-10">
                💎
              </div>
              <p className="text-[.85rem] text-[#8C9BB4] mb-6 leading-relaxed relative z-10">
                Rejoignez l'élite et affichez vos annonces ici pour un maximum de visibilité.
              </p>
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] hover:from-[#F3E5AB] hover:to-[#D4AF37] text-black rounded-full font-bold px-6 py-3 transition-all duration-300 shadow-md relative z-10 w-full text-sm">
                Activer "À la Une"
              </div>
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
