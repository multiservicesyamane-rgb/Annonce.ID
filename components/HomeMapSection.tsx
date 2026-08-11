"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/lib/geo";

// Leaflet manipule `window` : chargement client uniquement. La carte est
// désormais sous les annonces récentes, donc hors du premier écran : son
// bundle ne pèse plus sur le LCP.
const ListingsMap = dynamic(() => import("./ListingsMap"), {
  ssr: false,
  // Mêmes hauteurs que la carte réelle → place réservée dès le premier rendu,
  // donc aucun décalage visuel (CLS) quand Leaflet arrive.
  loading: () => <div className="h-[420px] bg-[#0D1420] sm:h-[440px] md:h-[500px]" />,
});

export default function HomeMapSection({ points = [] }: { points?: MapPoint[] }) {
  if (points.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[16px] border border-gray-100 dark:border-white/10 md:rounded-[20px]">
      <ListingsMap points={points} />
    </div>
  );
}
