"use client";

import { useEffect, useState } from "react";
import AdCard from "./AdCard";
import type { Listing } from "@/lib/types";
import { LISTINGS } from "@/lib/data";

/**
 * Composant Vus Récemment.
 * Utilise localStorage pour récupérer les IDs vus (idéalement géré dans la page annonce).
 */
export default function RecentlyViewed() {
  const [viewed, setViewed] = useState<Listing[]>([]);

  useEffect(() => {
    // Simulation : on récupère 4 annonces aléatoires comme "vus récemment"
    // Dans la vraie vie, on lirait "annonceid_history" du localStorage.
    try {
      const historyIds = JSON.parse(localStorage.getItem("annonceid_history") || "[]") as number[];
      if (historyIds.length > 0) {
        const found = historyIds.map(id => LISTINGS.find(l => l.id === id)).filter(Boolean) as Listing[];
        setViewed(found.slice(0, 4));
      } else {
        // Fallback demo
        setViewed(LISTINGS.slice(0, 4));
      }
    } catch {
      setViewed(LISTINGS.slice(0, 4));
    }
  }, []);

  if (viewed.length === 0) return null;

  return (
    <section className="wrap py-10 border-t border-gray-100 dark:border-dark-border mt-10">
      <h2 className="mb-6 font-display text-[1.25rem] font-bold text-gray-900 dark:text-white">
        Vus récemment
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {viewed.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  );
}
