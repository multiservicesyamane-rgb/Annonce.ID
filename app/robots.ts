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
      disallow: [
        // Zones privées / techniques (aucune valeur SEO)
        "/yamanetech",
        "/dashboard",
        // L'application de gestion (devis/factures) : rien d'indexable, tout
        // est derrière la connexion. Sa vitrine publique est /espace-pro.
        "/mon-activite",
        "/connexion",
        "/inscription",
        "/favoris",
        "/profil",
        "/paiement",
        "/api/",
        // Paramètres de filtre et de tri : évitent le crawl de doublons/URLs infinies
        "/*?sort=",
        "/*?min=",
        "/*?max=",
        "/*?condition=",
        "/*?sellerType=",
        "/*?location=",
        "/*?premium=",
        "/*?category=",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
