"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export default function CategoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Duplicate categories to ensure smooth infinite scrolling
  const displayCats = [...CATEGORIES, ...CATEGORIES, ...CATEGORIES];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animationId: number;
    let isHovered = false;

    const scroll = () => {
      if (!isHovered) {
        el.scrollLeft += 0.8; // adjust speed
        if (el.scrollLeft >= el.scrollWidth / 2) {
          // Reset when half is scrolled to create infinite effect
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
      className="no-scrollbar flex gap-4 overflow-x-auto pb-4 pt-2"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {displayCats.map((c, i) => (
        <Link
          key={`${c.slug}-${i}`}
          href={`/categorie/${c.slug}`}
          className="shrink-0 w-[140px] rounded-xl border-[1.5px] border-gray-100 bg-white px-3 py-5 text-center transition hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg"
        >
          <span className="mb-2 block text-[2.2rem]">{c.icon}</span>
          <div className="text-[.85rem] font-bold text-gray-800">{c.name}</div>
          <div className="text-[.7rem] text-gray-400 mt-1">{c.count} annonces</div>
        </Link>
      ))}
    </div>
  );
}
