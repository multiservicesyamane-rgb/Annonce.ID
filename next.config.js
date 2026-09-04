// Content-Security-Policy volontairement permissive sur script/style
// (Next.js injecte des scripts/styles inline) mais restrictive sur le reste.
// À resserrer plus tard (nonces) après vérification en navigateur.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  // Sans frame-src, les iframes retombaient sur default-src 'self' : la carte
  // Google Maps des fiches annonce était bloquée par le navigateur.
  "frame-src 'self' https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    // Allow base64 data URIs (user-uploaded photos) without optimization errors
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Supabase Storage (remplace par ton projet) :
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          // HSTS UNIQUEMENT en production. Servi en developpement, ce header
          // s'applique a l'hote "localhost" : le navigateur memorise pendant un
          // an que localhost doit etre en HTTPS, puis force https://localhost:3000
          // que `next dev` ne sait pas servir. Resultat : erreur de certificat
          // sur ce projet ET sur tout autre projet local, et les antivirus qui
          // inspectent le SSL bloquent la page.
          ...(isProd
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
            : []),
          { key: "Content-Security-Policy", value: CSP },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
