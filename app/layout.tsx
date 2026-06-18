import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import CookieBanner from "@/components/CookieBanner";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wanteermako.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Wanteermako — Petites Annonces Premium au Sénégal",
    template: "%s · Wanteermako",
  },
  description:
    "Achetez, vendez, louez en Afrique de l'Ouest. 27 pays, 250 000+ annonces. Contact direct WhatsApp, sans intermédiaire.",
  keywords: ["petites annonces", "Afrique de l'Ouest", "Dakar", "Abidjan", "immobilier", "voitures", "occasion"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Wanteermako",
    title: "Wanteermako — Petites Annonces Premium au Sénégal",
    description: "Tout le Sénégal à portée de main · Achetez et vendez facilement.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Wanteermako",
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
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Anti-flash : applique le thème AVANT le rendu */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var s=localStorage.getItem('annonceid_dark');
            var dark;
            if(s!==null){dark=s==='true';}
            else{var h=new Date().getHours();dark=h<6||h>=19;}
            if(dark)document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
          })();
        `}} />
        {/* Google AdSense (validation du site + diffusion des annonces) */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8749142175860365"
          crossOrigin="anonymous"
        />
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
