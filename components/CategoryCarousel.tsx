"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export default function CategoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Create a "Toutes" category for the beginning
  const allCategory = { slug: "tous", name: "Toutes", icon: "🌍", count: "100 000+" };
  
  // Duplicate categories to ensure smooth infinite scrolling - REMOVED to keep "Toutes" visible
  const displayCats = [allCategory, ...CATEGORIES];

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar flex gap-2 md:gap-4 overflow-x-auto pb-4 pt-2 px-4 max-w-[1320px] mx-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {displayCats.map((c, i) => {
        const isMagenta = i % 2 === 0;
        return (
          <Link
            key={`${c.slug}-${i}`}
            href={c.slug === "tous" ? "/recherche" : `/categorie/${c.slug}`}
            className="shrink-0 w-[75px] md:w-[90px] flex flex-col items-center justify-center text-center transition-all duration-300 relative group"
          >
            {/* The 3D Platform container */}
            <div className="relative w-full h-[60px] md:h-[70px] flex items-end justify-center mb-1.5 md:mb-2">
              
              {/* Bottom Glow */}
              <div className={`absolute -bottom-1 w-10 md:w-12 h-4 md:h-6 rounded-full ${isMagenta ? 'bg-neon-magenta shadow-[0_0_20px_#FF2A6D]' : 'bg-neon-cyan shadow-[0_0_20px_#2DE2E6]'} blur-[8px] opacity-60 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              {/* The Base/Pedestal Disc */}
              <div className="absolute bottom-0 w-10 md:w-12 h-3 md:h-4 rounded-[50%] border-b-[2px] border-r border-black/40 overflow-hidden" style={{ transform: "scaleY(0.6)" }}>
                <div className={`absolute inset-0 ${isMagenta ? 'bg-gradient-to-r from-[#FF2A6D] to-[#FF5E8E]' : 'bg-gradient-to-r from-[#2DE2E6] to-[#5EF2F5]'}`}></div>
                {/* Top surface of the disc */}
                <div className={`absolute inset-x-0 top-0 h-[80%] rounded-[50%] ${isMagenta ? 'bg-[#FF5E8E]' : 'bg-[#5EF2F5]'}`}></div>
              </div>
              
              {/* The Icon */}
              <span className="relative z-10 text-[2rem] md:text-[2.5rem] pb-1.5 md:pb-2 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] group-hover:-translate-y-2 transition-transform duration-500 ease-out">
                {c.icon}
              </span>
            </div>
            
            <div className="text-[.65rem] md:text-[.75rem] font-bold text-gray-400 group-hover:text-white transition-colors">{c.name}</div>
          </Link>
        );
      })}
    </div>
  );
}
