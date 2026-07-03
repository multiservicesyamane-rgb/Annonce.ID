import { createClient } from "@supabase/supabase-js";
import { formatNumber } from "@/lib/utils";
import type { Listing } from "@/lib/types";

const RECENT_SELECT =
  "id, slug, title, price, price_type, location, image, category, category_slug, views, created_at, premium, is_premium, featured, is_featured";

const HIGHLIGHT_SELECT =
  "id, slug, title, price, price_type, location, image, category, views, created_at";

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(supabaseUrl, supabaseKey);
}

function formatPrice(ad: any) {
  return ad.price_type === "Sur devis"
    ? "Sur devis"
    : ad.price && ad.price !== "0"
      ? `${formatNumber(ad.price)} FCFA`
      : "Gratuit";
}

function formatRecentListing(ad: any): Listing {
  return {
    id: ad.id,
    slug: ad.slug,
    title: ad.title,
    price: formatPrice(ad),
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

function formatHighlightListing(ad: any): Listing {
  return {
    id: ad.id,
    slug: ad.slug,
    title: ad.title,
    price: formatPrice(ad),
    location: ad.location || "Sénégal",
    image: ad.image || "https://placehold.co/600x400?text=Sans+Image",
    category: ad.category || "Autre",
    views: ad.views ?? 0,
    created_at: ad.created_at,
  } as any;
}

export async function getRecentListings(categorySlug?: string) {
  const supabase = getSupabase();
  let query = supabase
    .from("listings")
    .select(RECENT_SELECT)
    .eq("status", "active");

  if (categorySlug) {
    query = query.eq("category_slug", categorySlug);
  }

  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(20);

  return (data || []).map(formatRecentListing);
}

export async function getFeaturedListings(categorySlug?: string) {
  const supabase = getSupabase();
  let query = supabase
    .from("listings")
    .select(HIGHLIGHT_SELECT)
    .eq("status", "active")
    .or("featured.eq.true,is_featured.eq.true");

  if (categorySlug) {
    query = query.eq("category_slug", categorySlug);
  }

  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(10);

  return (data || []).map(formatHighlightListing);
}

export async function getPremiumListings(categorySlug?: string) {
  const supabase = getSupabase();
  let query = supabase
    .from("listings")
    .select(HIGHLIGHT_SELECT)
    .eq("status", "active")
    .or("premium.eq.true,is_premium.eq.true");

  if (categorySlug) {
    query = query.eq("category_slug", categorySlug);
  }

  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(8);

  return (data || []).map(formatHighlightListing);
}
