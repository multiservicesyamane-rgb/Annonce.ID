import type { MetadataRoute } from "next";
import { LISTINGS } from "@/lib/data";
import { CATEGORIES } from "@/lib/constants";

const base = process.env.NEXT_PUBLIC_APP_URL || "https://wanteermako.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/recherche", "/publier", "/connexion", "/aide", "/securite", "/cgu"].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const cats = CATEGORIES.map((c) => ({
    url: `${base}/categorie/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const ads = LISTINGS.map((l) => ({
    url: `${base}/annonce/${l.id}/${l.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...cats, ...ads];
}
