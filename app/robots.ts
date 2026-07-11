import type { MetadataRoute } from "next";

// Domaine canonique = apex (le www redirige 301 vers l'apex).
const base = (process.env.NEXT_PUBLIC_APP_URL || "https://wanteermako.com")
  .replace(/\/+$/, "")
  .replace(/^https?:\/\/www\./, "https://");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/yamanetech", "/dashboard", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
