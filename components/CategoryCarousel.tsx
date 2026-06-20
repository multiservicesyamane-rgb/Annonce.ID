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
        const isGold = i % 2 === 0;
        return (
          <Link
            key={`${c.slug}-${i}`}
            href={c.slug === "tous" ? "/recherche" : `/categorie/${c.slug}`}
            className="shrink-0 w-[80px] md:w-[95px] flex flex-col items-center justify-center text-center transition-all duration-300 relative group"
          >
            {/* The 3D Platform container */}
            <div className="relative w-full h-[65px] md:h-[75px] flex items-end justify-center mb-2">
              
              {/* Bottom Glow */}
              <div className={`absolute -bottom-1 w-12 md:w-14 h-4 md:h-6 rounded-full ${isGold ? 'bg-gold shadow-[0_0_20px_rgba(245,166,35,0.6)]' : 'bg-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.6)]'} blur-[8px] opacity-60 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              {/* The Base/Pedestal Disc */}
              <div className="absolute bottom-0 w-12 md:w-14 h-4 md:h-5 rounded-[50%] border-b-[2px] border-r border-black/30 dark:border-black/50 overflow-hidden" style={{ transform: "scaleY(0.6)" }}>
                <div className={`absolute inset-0 ${isGold ? 'bg-gradient-to-r from-[#F5A623] to-[#D4891A]' : 'bg-gradient-to-r from-[#818CF8] to-[#4F46E5]'}`}></div>
                {/* Top surface of the disc */}
                <div className={`absolute inset-x-0 top-0 h-[80%] rounded-[50%] ${isGold ? 'bg-[#FFD166]' : 'bg-[#818CF8]'}`}></div>
              </div>
              
              {/* The Icon */}
              <span className="relative z-10 text-[2.2rem] md:text-[2.6rem] pb-1.5 md:pb-2 drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] group-hover:-translate-y-2.5 transition-transform duration-500 ease-out">
                {c.icon}
              </span>
            </div>
            
            <div className="text-[0.7rem] md:text-[0.78rem] font-bold text-gray-500 dark:text-gray-400 group-hover:text-[#6366F1] dark:group-hover:text-white transition-colors">{c.name}</div>
          </Link>
        );
      })}
    </div>
  );
}
