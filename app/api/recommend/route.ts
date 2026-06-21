import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Recommandations « Pour vous » : dernières annonces actives d'une catégorie.
export async function GET(req: Request) {
  const cat = (new URL(req.url).searchParams.get("cat") || "").trim();
  if (!cat) return NextResponse.json({ results: [] });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return NextResponse.json({ results: [] });
  const sb = createClient(url, key);

  const { data } = await sb
    .from("listings")
    .select("id, slug, title, category, price, price_type, location, image, premium, views, created_at")
    .eq("status", "active")
    .ilike("category", `%${cat}%`)
    .order("created_at", { ascending: false })
    .limit(12);

  const results = (data || []).map((a: any) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category || "Autre",
    price: a.price_type === "Sur devis" ? "Sur devis" : (a.price && a.price !== "0" ? `${formatNumber(a.price)} FCFA` : "Gratuit"),
    location: a.location || "Sénégal",
    image: a.image || "https://placehold.co/600x400?text=Sans+Image",
    premium: a.premium || false,
    views: a.views ?? 0,
    created_at: a.created_at,
  }));

  return NextResponse.json({ results });
}
