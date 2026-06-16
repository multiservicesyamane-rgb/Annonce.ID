"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdCard from "./AdCard";
import AdBanner from "./AdBanner";
import type { Listing } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import FilterDrawer from "./FilterDrawer";
import EmptyState from "./EmptyState";
import { SkeletonGrid } from "./SkeletonCard";

/**
 * Vue listing avec filtres (sidebar desktop / drawer mobile), tri,
 * pagination (charger plus) et cartes sponsorisées.
 */
export default function ListingView({
  initial,
  title,
  subtitle,
}: {
  initial: Listing[];
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [premiumOnly, setPremiumOnly] = useState(searchParams.get("premium") === "1");
  const [minPrice, setMinPrice] = useState(Number(searchParams.get("min")) || 0);
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get("max")) || 5_000_000);
  const [condition, setCondition] = useState(searchParams.get("condition") || "Tous");
  const [sellerType, setSellerType] = useState(searchParams.get("sellerType") || "Tous");
  const [sort, setSort] = useState(searchParams.get("sort") || "recent");
  const [drawer, setDrawer] = useState(false);
  
  // Pagination
  const [visibleCount, setVisibleCount] = useState(12);

  const filtered = useMemo(() => {
    let list = initial.filter((l) => {
      if (premiumOnly && !l.premium) return false;
      const num = Number(l.price.replace(/[^0-9]/g, "")) || 0;
      if (num < minPrice || num > maxPrice) return false;
      
      // Filter by condition if specs exist
      if (condition !== "Tous" && l.specs && l.specs['État'] !== condition) return false;
      
      // Filter by sellerType
      if (sellerType !== "Tous" && l.seller) {
          const isPro = l.seller.isPro;
          if (sellerType === "Professionnels vérifiés" && !isPro) return false;
          if (sellerType === "Particuliers" && isPro) return false;
      }
      
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => price(a) - price(b));
    if (sort === "price-desc") list = [...list].sort((a, b) => price(b) - price(a));
    if (sort === "views") list = [...list].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    return list;
  }, [initial, premiumOnly, minPrice, maxPrice, condition, sellerType, sort]);

  const visibleListings = filtered.slice(0, visibleCount);

  function handleApplyFilters(filters: any) {
    setPremiumOnly(filters.premiumOnly);
    setMinPrice(filters.priceRange[0]);
    setMaxPrice(filters.priceRange[1]);
    setCondition(filters.condition || "Tous");
    setSellerType(filters.sellerType || "Tous");
    setVisibleCount(12); // reset pagination

    const params = new URLSearchParams(searchParams.toString());
    if (filters.premiumOnly) params.set("premium", "1");
    else params.delete("premium");
    params.set("min", filters.priceRange[0].toString());
    params.set("max", filters.priceRange[1].toString());
    
    if (filters.condition && filters.condition !== "Tous") params.set("condition", filters.condition);
    else params.delete("condition");
    
    if (filters.sellerType && filters.sellerType !== "Tous") params.set("sellerType", filters.sellerType);
    else params.delete("sellerType");
    
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleSortChange(newSort: string) {
    setSort(newSort);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="wrap py-5">
      <div className="grid items-start gap-5 lg:grid-cols-[260px_1fr]">
        <FilterDrawer 
          open={drawer} 
          onClose={() => setDrawer(false)} 
          onApply={handleApplyFilters} 
        />

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h1 className="font-display text-[1.2rem] font-bold dark:text-white">{title}</h1>
              {subtitle && <p className="text-[.82rem] text-gray-500">{subtitle}</p>}
              <span className="text-[.85rem] text-gray-700 dark:text-white/70">
                <b className="text-green">{formatNumber(filtered.length)}</b> annonce{filtered.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDrawer(true)}
                className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-[.82rem] font-semibold text-gray-700 dark:text-white/80 lg:hidden"
              >
                ⚙ Filtrer
              </button>
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-[.8rem] dark:text-white outline-none"
              >
                <option value="recent">Plus récent</option>
                <option value="price-asc">Prix ↑</option>
                <option value="price-desc">Prix ↓</option>
                <option value="views">Plus de vues</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState 
              title="Aucune annonce trouvée" 
              description="Modifiez vos filtres ou effectuez une nouvelle recherche pour trouver ce que vous cherchez." 
              ctaLabel="Effacer les filtres"
              onCtaClick={() => handleApplyFilters({ premiumOnly: false, priceRange: [0, 5000000] })}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {visibleListings.map((ad, i) => (
                  <FragmentWithAd key={ad.id} ad={ad} index={i} />
                ))}
              </div>
              
              {visibleCount < filtered.length && (
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => setVisibleCount(v => v + 12)}
                    className="btn btn-outline"
                  >
                    Charger plus d'annonces
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FragmentWithAd({ ad, index }: { ad: Listing; index: number }) {
  return (
    <>
      <AdCard ad={ad} />
      {(index + 1) % 8 === 0 && (
        <div className="col-span-2 sm:col-span-3 lg:col-span-4">
          <AdBanner 
            slot={`listing-grid-${index}`} 
            title="Mettez votre annonce en avant" 
            subtitle="Apparaissez ici pour attirer plus d'acheteurs" 
            variant="dark" 
          />
        </div>
      )}
    </>
  );
}

function price(l: Listing) {
  return Number(l.price.replace(/[^0-9]/g, "")) || 0;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-[.74rem] font-bold uppercase tracking-wide text-gray-700">{label}</span>
      {children}
    </div>
  );
}
