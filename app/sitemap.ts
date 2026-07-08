import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES } from "@/lib/constants";
import { ARTICLES } from "@/lib/blogData";
import { detectLanguage } from "@/lib/listingQuality";

const base = process.env.NEXT_PUBLIC_APP_URL || "https://wanteermako.com";

// Le sitemap doit lister le contenu RÉEL et indexable (pas les données de démo),
// sinon Google crawle des URLs en 404 → « site à faible valeur / pas prêt ».
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/recherche",
    "/publier",
    "/boutiques",
    "/blog",
    "/aide",
    "/securite",
    "/comment-ca-marche",
    "/contact",
    "/publicite",
    "/cgu",
    "/mentions-legales",
    "/politique-confidentialite",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.6,
  }));

  const cats = CATEGORIES.map((c) => ({
    url: `${base}/categorie/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const blog = ARTICLES.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Annonces ACTIVES réelles depuis Supabase (tolérant : si indisponible → sitemap sans annonces).
  let ads: MetadataRoute.Sitemap = [];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from("listings")
        .select("id, slug, title, description, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5000);

      ads = (data || [])
        // On n'expose pas au sitemap les annonces encore en anglais (faible valeur).
        .filter((l: any) => detectLanguage(`${l.title || ""} ${l.description || ""}`) !== "en")
        .map((l: any) => ({
          url: `${base}/annonce/${l.id}/${l.slug}`,
          lastModified: l.created_at ? new Date(l.created_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.5,
        }));
    }
  } catch {
    /* base indisponible → on renvoie au moins les pages statiques + catégories + blog */
  }

  return [...staticPages, ...cats, ...blog, ...ads];
}
