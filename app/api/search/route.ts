import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Autocomplétion de recherche sur les VRAIES annonces actives (titre + catégorie).
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return NextResponse.json({ results: [] });
  const sb = createClient(url, key);

  // Recherche sur le titre OU la catégorie
  const { data } = await sb
    .from("listings")
    .select("id, slug, title, category, price, price_type, location, image")
    .eq("status", "active")
    .or(`title.ilike.%${q}%,category.ilike.%${q}%,category_slug.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(6);

  const results = (data || []).map((a: any) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category || "Autre",
    price: a.price_type === "Sur devis" ? "Sur devis" : (a.price && a.price !== "0" ? `${formatNumber(a.price)} FCFA` : "Gratuit"),
    location: a.location || "",
    image: a.image || "",
  }));

  return NextResponse.json({ results });
}
