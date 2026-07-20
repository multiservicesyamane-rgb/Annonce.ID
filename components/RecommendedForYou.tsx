"use client";

import { useEffect, useState } from "react";
import AdCard from "./AdCard";

/**
 * « Recommandé pour vous » : basé sur la catégorie de la dernière annonce vue
 * (historique localStorage). Masqué si aucun historique.
 */
export default function RecommendedForYou() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    try {
      const hist = JSON.parse(localStorage.getItem("wanteermako_history") || "[]");
      if (!Array.isArray(hist) || hist.length === 0) return;
      const cat = hist[0]?.category;
      if (!cat) return;
      const seen = new Set(hist.map((h: any) => h.id));
      fetch(`/api/recommend?cat=${encodeURIComponent(cat)}`)
        .then((r) => r.json())
        .then((d) => {
          const list = (d.results || []).filter((x: any) => !seen.has(x.id)).slice(0, 5);
          setItems(list);
        })
        .catch(() => {});
    } catch { /* ignore */ }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="wrap py-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[1.3rem]">✨</span>
        <h2 className="font-display text-[1.2rem] md:text-[1.35rem] font-bold text-gray-900 dark:text-white">Recommandé pour vous</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  );
}
