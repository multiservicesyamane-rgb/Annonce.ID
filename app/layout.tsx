import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import CookieBanner from "@/components/CookieBanner";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://annonces.sn";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Annonces.sn — Petites Annonces Premium au Sénégal",
    template: "%s · Annonces.sn",
  },
  description:
    "Achetez, vendez, louez en Afrique de l'Ouest. 27 pays, 250 000+ annonces. Contact direct WhatsApp, sans intermédiaire.",
  keywords: ["petites annonces", "Afrique de l'Ouest", "Dakar", "Abidjan", "immobilier", "voitures", "occasion"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Annonces.sn",
    title: "Annonces.sn — Petites Annonces Premium au Sénégal",
    description: "Tout le Sénégal à portée de main · Achetez et vendez facilement.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Annonces.sn",
    statusBarStyle: "default",
    capable: true,
  },
  icons: {
    icon: "/logonavi.jpeg",
    shortcut: "/logonavi.jpeg",
    apple: "/logonavi.jpeg",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366F1" },
    { media: "(prefers-color-scheme: dark)", color: "#1E1B4B" }
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
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
        <CookieBanner />
      </body>
    </html>
  );
}
