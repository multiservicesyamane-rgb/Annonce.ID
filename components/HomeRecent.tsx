"use client";

import { useState } from "react";
import Link from "next/link";
import AdCard from "./AdCard";
import { LISTINGS } from "@/lib/data";

const FILTERS = [
  { label: "Toutes", value: "all" },
  { label: "🏠 Immobilier", value: "Immobilier" },
  { label: "🚗 Véhicules", value: "Véhicules" },
  { label: "📱 Électronique", value: "Électronique" },
];

export default function HomeRecent() {
  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? LISTINGS : LISTINGS.filter((a) => a.category === filter);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-[20px] border px-3 py-1 text-[.78rem] transition ${
              filter === f.value
                ? "border-green bg-green text-white"
                : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gold"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
