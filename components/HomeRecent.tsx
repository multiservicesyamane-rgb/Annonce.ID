"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdCard from "./AdCard";
import { SkeletonGrid } from "./SkeletonCard";
import { createClient } from "@/lib/supabase/client";
import { formatNumber } from "@/lib/utils";
import type { Listing } from "@/lib/types";

const PAGE_SIZE = 20;
const SELECT_FIELDS = "id, slug, title, price, price_type, location, image, category, category_slug, views, created_at, premium, is_premium, featured, is_featured";

const FILTERS = [
  { label: "Toutes", value: "all" },
  { label: "Immobilier", value: "immobilier" },
  { label: "Véhicules", value: "vehicules" },
  { label: "Téléphones", value: "electronique" },
];

function formatListing(ad: any): Listing {
  return {
    id: ad.id,
    slug: ad.slug,
    title: ad.title,
    price: ad.price_type === "Sur devis" ? "Sur devis" : (ad.price && ad.price !== "0" ? `${formatNumber(ad.price)} FCFA` : "Gratuit"),
    location: ad.location || "Sénégal",
    image: ad.image || "https://placehold.co/600x400?text=Sans+Image",
    category: ad.category || "Autre",
    categorySlug: ad.category_slug || "",
    views: ad.views ?? 0,
    created_at: ad.created_at,
    premium: !!(ad.premium || ad.is_premium),
    featured: !!(ad.featured || ad.is_featured),
  } as any;
}

export default function HomeRecent({ initialListings }: { initialListings: Listing[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [filter, setFilter] = useState("all");
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [offset, setOffset] = useState(initialListings.length);
  const [hasMore, setHasMore] = useState(initialListings.length >= PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(async (nextOffset: number, nextFilter: string) => {
    let query = supabase
      .from("listings")
      .select(SELECT_FIELDS)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(nextOffset, nextOffset + PAGE_SIZE - 1);

    if (nextFilter !== "all") {
      query = query.eq("category_slug", nextFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(formatListing);
  }, [supabase]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const next = await fetchPage(offset, filter);
      setListings((current) => {
        const seen = new Set(current.map((ad) => String(ad.id)));
        const fresh = next.filter((ad) => !seen.has(String(ad.id)));
        return [...current, ...fresh];
      });
      setOffset((current) => current + next.length);
      setHasMore(next.length === PAGE_SIZE);
    } catch (e: any) {
      setError(e?.message || "Impossible de charger les annonces.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [fetchPage, filter, hasMore, offset]);

  useEffect(() => {
    let cancelled = false;

    async function reset() {
      loadingRef.current = true;
      setLoading(true);
      setError("");

      try {
        if (filter === "all") {
          if (cancelled) return;
          setListings(initialListings);
          setOffset(initialListings.length);
          setHasMore(initialListings.length >= PAGE_SIZE);
          return;
        }

        const firstPage = await fetchPage(0, filter);
        if (cancelled) return;
        setListings(firstPage);
        setOffset(firstPage.length);
        setHasMore(firstPage.length === PAGE_SIZE);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Impossible de charger les annonces.");
      } finally {
        if (!cancelled) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    }

    reset();
    return () => { cancelled = true; };
  }, [fetchPage, filter, initialListings]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMore();
      },
      { rootMargin: "520px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

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

      {listings.length === 0 && !loading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500 dark:border-dark-border dark:bg-dark-800">
          Aucune annonce active dans cette sélection.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {listings.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-4">
          <SkeletonGrid count={6} />
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div ref={sentinelRef} className="h-10" aria-hidden="true" />

      {!hasMore && listings.length > 0 && (
        <p className="mt-4 text-center text-[.78rem] font-semibold text-gray-400">
          Toutes les annonces récentes sont affichées.
        </p>
      )}

      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button type="button" onClick={() => void loadMore()} className="btn btn-outline">
            Charger plus d'annonces
          </button>
        </div>
      )}
    </>
  );
}
