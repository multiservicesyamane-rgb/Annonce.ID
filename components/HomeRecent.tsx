"use client";

import { useState } from "react";
import Link from "next/link";
import AdCard from "./AdCard";
import { Listing } from "@/lib/types";

const FILTERS = [
  { label: "Toutes", value: "all" },
  { label: "🏠 Immobilier", value: "Immobilier" },
  { label: "🚗 Véhicules", value: "Véhicules" },
  { label: "📱 Électronique", value: "Électronique" },
];

export default function HomeRecent({ initialListings }: { initialListings: Listing[] }) {
  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? initialListings : initialListings.filter((a) => a.category === filter);

  return (
    <>
      <div className="mb-4 flex overflow-x-auto snap-x no-scrollbar gap-1.5 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`shrink-0 snap-start whitespace-nowrap rounded-full border px-3 py-1 text-[.65rem] md:px-4 md:py-1.5 md:text-[.75rem] font-bold transition-all duration-300 ${
              filter === f.value
                ? "border-gold bg-gold text-[#0A0E14] shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                : "border-gray-200 bg-white text-gray-600 dark:border-white/5 dark:bg-white/5 dark:text-gray-400 hover:border-gold/50 dark:hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link href="/recherche" className="btn btn-outline btn-lg">
          Voir toutes les annonces →
        </Link>
      </div>
    </>
  );
}
