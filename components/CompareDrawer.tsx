"use client";

import { useState } from "react";
import type { Listing } from "@/lib/types";
import AdCard from "./AdCard";

/**
 * Tiroir (Drawer) pour comparer jusqu'à 3 annonces.
 * Fixé en bas de l'écran.
 */
export default function CompareDrawer({
  comparedAds,
  onRemove,
  onClear
}: {
  comparedAds: Listing[];
  onRemove: (id: number) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (comparedAds.length === 0) return null;

  return (
    <div className={`fixed inset-x-0 bottom-0 z-[1000] border-t-2 border-gold bg-white dark:bg-dark-900 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-none transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-[calc(100%-60px)]"}`}>
      {/* Header / Toggle */}
      <div 
        className="flex h-[60px] cursor-pointer items-center justify-between px-6 bg-gray-50 dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 transition"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold font-bold text-dark-900">
            {comparedAds.length}
          </span>
          <span className="font-display font-bold text-gray-900 dark:text-white">
            Comparer des annonces
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }}
            className="text-[.8rem] font-semibold text-brand-red hover:underline"
          >
            Tout effacer
          </button>
          <span className="text-xl text-gray-400">{open ? "▼" : "▲"}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 overflow-x-auto max-h-[60vh]">
        <div className="flex min-w-max gap-4">
          {comparedAds.map(ad => (
            <div key={ad.id} className="relative w-[280px]">
              <button 
                onClick={() => onRemove(ad.id)}
                className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
              >
                ✕
              </button>
              <AdCard ad={ad} />
              <div className="mt-4 rounded-lg bg-gray-50 dark:bg-dark-800 p-3 text-[.8rem]">
                <div className="mb-1 flex justify-between border-b border-gray-200 dark:border-dark-border pb-1">
                  <span className="text-gray-500 dark:text-white/50">Marque</span>
                  <span className="font-bold dark:text-white">{ad.specs?.Marque || "N/A"}</span>
                </div>
                <div className="mb-1 flex justify-between border-b border-gray-200 dark:border-dark-border pb-1">
                  <span className="text-gray-500 dark:text-white/50">État</span>
                  <span className="font-bold dark:text-white">{ad.specs?.État || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-white/50">Année</span>
                  <span className="font-bold dark:text-white">{ad.specs?.Année || "N/A"}</span>
                </div>
              </div>
            </div>
          ))}
          {comparedAds.length < 3 && (
            <div className="flex w-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-800/50 p-6 text-center text-gray-400">
              <span className="mb-2 text-3xl">+</span>
              <span className="text-[.85rem] font-semibold">Ajouter une annonce pour comparer (max 3)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
