"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PriceSlider from "./PriceSlider";
import { CATEGORIES } from "@/lib/constants";

/**
 * Tiroir de filtres (slide depuis la droite sur mobile, statique sur desktop).
 */
export default function FilterDrawer({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}) {
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [condition, setCondition] = useState<string>("Tous");
  const [sellerType, setSellerType] = useState<string>("Tous");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);

  // Prevent scroll when open on mobile
  useEffect(() => {
    if (open && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div 
          className="fixed inset-0 z-[990] bg-black/50 backdrop-blur-sm lg:hidden animate-fadeUp"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-[995] w-[300px] bg-white dark:bg-dark-800 shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:block lg:w-[260px] lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-100 dark:lg:border-dark-border ${
        open ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border p-4">
            <h2 className="font-display text-[1.1rem] font-bold dark:text-white">Filtres</h2>
            <button onClick={onClose} className="p-2 text-gray-500 lg:hidden">✕</button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Catégories (en premier) */}
            <div className="mb-6">
              <h3 className="mb-3 text-[.85rem] font-bold text-gray-900 dark:text-white">Catégories</h3>
              <div className="flex flex-col gap-1">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/categorie/${c.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[.85rem] font-medium text-gray-700 dark:text-white/80 hover:bg-green/10 hover:text-green dark:hover:text-green-400 transition-colors"
                  >
                    <span className="text-[1.05rem]">{c.icon}</span>
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Prix */}
            <div className="mb-6">
              <h3 className="mb-3 text-[.85rem] font-bold text-gray-900 dark:text-white">Prix</h3>
              <PriceSlider onChange={setPriceRange} />
            </div>

            {/* État */}
            <div className="mb-6">
              <h3 className="mb-3 text-[.85rem] font-bold text-gray-900 dark:text-white">État du produit</h3>
              <div className="flex flex-col gap-2">
                {["Tous", "Neuf (Jamais utilisé)", "Occasion (Bon état)", "Pour pièces"].map(c => (
                  <label key={c} className="flex cursor-pointer items-center gap-2 text-[.85rem] text-gray-700 dark:text-white/80">
                    <input 
                      type="radio" 
                      name="condition" 
                      checked={condition === c}
                      onChange={() => setCondition(c)}
                      className="accent-green" 
                    /> {c}
                  </label>
                ))}
              </div>
            </div>

            {/* Type Vendeur */}
            <div className="mb-6">
              <h3 className="mb-3 text-[.85rem] font-bold text-gray-900 dark:text-white">Type de vendeur</h3>
              <div className="flex flex-col gap-2">
                {["Tous", "Particuliers", "Professionnels vérifiés"].map(t => (
                  <label key={t} className="flex cursor-pointer items-center gap-2 text-[.85rem] text-gray-700 dark:text-white/80">
                    <input 
                      type="radio" 
                      name="seller" 
                      checked={sellerType === t}
                      onChange={() => setSellerType(t)}
                      className="accent-green" 
                    /> {t}
                  </label>
                ))}
              </div>
            </div>

            {/* Premium toggle */}
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gold bg-gold-pale p-3 text-[.85rem] font-semibold text-dark-900">
              <span>✦ Premium uniquement</span>
              <div className={`relative h-5 w-9 rounded-full transition-colors ${premiumOnly ? "bg-green" : "bg-gray-300"}`}>
                <input type="checkbox" className="sr-only" checked={premiumOnly} onChange={(e) => setPremiumOnly(e.target.checked)} />
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${premiumOnly ? "left-0.5 translate-x-4" : "left-0.5"}`} />
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-dark-border p-4">
            <button 
              onClick={() => {
                onApply({ condition, sellerType, premiumOnly, priceRange });
                onClose();
              }} 
              className="btn btn-green btn-block"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
