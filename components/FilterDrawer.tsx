"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<string>("Toutes");
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [condition, setCondition] = useState<string>("Tous");
  const [sellerType, setSellerType] = useState<string>("Tous");
  const [location, setLocation] = useState<string>("Toutes");
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

  // Sync state with URL search params
  useEffect(() => {
    setCategory(searchParams.get("category") || "Toutes");
    setPremiumOnly(searchParams.get("premium") === "1");
    setCondition(searchParams.get("condition") || "Tous");
    setSellerType(searchParams.get("sellerType") || "Tous");
    setLocation(searchParams.get("location") || "Toutes");
    const min = Number(searchParams.get("min")) || 0;
    const max = Number(searchParams.get("max")) || 5000000;
    setPriceRange([min, max]);
  }, [searchParams, open]);

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
            {/* Catégories */}
            <div className="mb-5">
              <h3 className="mb-2 text-[.8rem] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Catégories</h3>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-[10px] border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-900 px-3 py-2.5 text-[.88rem] text-gray-900 dark:text-white outline-none focus:border-green transition"
              >
                <option value="Toutes">Toutes les catégories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.slug} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Localisation */}
            <div className="mb-5">
              <h3 className="mb-2 text-[.8rem] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Localisation</h3>
              <select 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-[10px] border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-900 px-3 py-2.5 text-[.88rem] text-gray-900 dark:text-white outline-none focus:border-green transition"
              >
                <option value="Toutes">Tout le Sénégal</option>
                <option value="Dakar">Dakar</option>
                <option value="Thiès">Thiès</option>
                <option value="Saint-Louis">Saint-Louis</option>
                <option value="Ziguinchor">Ziguinchor</option>
                <option value="Diourbel">Diourbel</option>
                <option value="Kaolack">Kaolack</option>
                <option value="Autre">Autre région</option>
              </select>
            </div>

            {/* Prix */}
            <div className="mb-6">
              <h3 className="mb-3 text-[.8rem] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fourchette de Prix</h3>
              <PriceSlider onChange={setPriceRange} />
            </div>

            {/* État */}
            <div className="mb-5">
              <h3 className="mb-2 text-[.8rem] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">État du produit</h3>
              <select 
                value={condition} 
                onChange={(e) => setCondition(e.target.value)}
                className="w-full rounded-[10px] border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-900 px-3 py-2.5 text-[.88rem] text-gray-900 dark:text-white outline-none focus:border-green transition"
              >
                {["Tous", "Neuf (Jamais utilisé)", "Occasion (Bon état)", "Pour pièces"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Type Vendeur */}
            <div className="mb-6">
              <h3 className="mb-2 text-[.8rem] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type de vendeur</h3>
              <select 
                value={sellerType} 
                onChange={(e) => setSellerType(e.target.value)}
                className="w-full rounded-[10px] border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-900 px-3 py-2.5 text-[.88rem] text-gray-900 dark:text-white outline-none focus:border-green transition"
              >
                {["Tous", "Particuliers", "Professionnels vérifiés"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
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
                onApply({ category, condition, sellerType, premiumOnly, priceRange, location });
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
