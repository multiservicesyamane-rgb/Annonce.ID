"use client";

import { useEffect, useState } from "react";
import AdCard from "./AdCard";

/**
 * « Vus récemment » : lit l'historique réel (objets) du localStorage,
 * alimenté par <RecordView> sur la page annonce.
 */
export default function RecentlyViewed() {
  const [viewed, setViewed] = useState<any[]>([]);

  useEffect(() => {
    try {
      const hist = JSON.parse(localStorage.getItem("annonceid_history") || "[]");
      setViewed(Array.isArray(hist) ? hist.filter((h: any) => h && h.id && h.title).slice(0, 5) : []);
    } catch {
      setViewed([]);
    }
  }, []);

  if (viewed.length === 0) return null;

  return (
    <section className="wrap py-10 border-t border-gray-100 dark:border-dark-border mt-10">
      <h2 className="mb-6 font-display text-[1.25rem] font-bold text-gray-900 dark:text-white">
        🕓 Vus récemment
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {viewed.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  );
}
