import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://annonce.id";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Annonce.ID — Petites Annonces Premium Afrique de l'Ouest",
    template: "%s · Annonce.ID",
  },
  description:
    "Achetez, vendez, louez en Afrique de l'Ouest. 27 pays, 250 000+ annonces. Contact direct WhatsApp, sans intermédiaire.",
  keywords: ["petites annonces", "Afrique de l'Ouest", "Dakar", "Abidjan", "immobilier", "voitures", "occasion"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Annonce.ID",
    title: "Annonce.ID — Petites Annonces Premium Afrique de l'Ouest",
    description: "27 pays · 250 000+ annonces · Contact direct WhatsApp.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Annonce.ID",
    statusBarStyle: "default",
    capable: true,
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1b4332" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e14" }
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Polices chargées via <link> (pas de fetch au build, fallback système si hors-ligne) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
