"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Bannière publicitaire annonceur. Design premium avec bouton "Call to Action".
 */
export default function AdBanner({
  slot,
  label = "Sponsorisé",
  variant = "dark",
  href = "/dashboard?panel=campaigns",
}: {
  slot: string;
  /** @deprecated ignoré : le repli affiche désormais de l'auto-promo */
  title?: string;
  /** @deprecated ignoré : le repli affiche désormais de l'auto-promo */
  subtitle?: string;
  label?: string;
  variant?: "dark" | "green" | "night";
  href?: string;
}) {
  const bg =
    variant === "green"
      ? "bg-gradient-to-br from-green-700 via-green-600 to-emerald-800"
      : variant === "night"
        ? "bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617]"
        : "bg-gradient-to-r from-gray-900 via-gray-800 to-black";

  const className = `group relative block w-full overflow-hidden rounded-[16px] text-white shadow-xl transition-all hover:shadow-2xl ${bg}`;

  // Auto-promotion affichée à la place d'un bloc pub VIDE (aucun annonceur actif).
  // On ne montre jamais « Votre publicité ici » aux visiteurs.
  const PROMOS = [
    { title: "Vendez gratuitement sur Wanteermako", subtitle: "Publication gratuite · 0% commission · contact WhatsApp direct.", cta: "Publier une annonce", href: "/publier" },
    { title: "Découvrez nos boutiques Pro", subtitle: "Des vendeurs vérifiés et leurs catalogues, au même endroit.", cta: "Voir les boutiques", href: "/boutiques" },
    { title: "Boostez votre annonce", subtitle: "Passez en Premium / À la Une et gagnez en visibilité.", cta: "Découvrir les options", href: "/publier" },
  ];
  // Choix déterministe selon le slot (stable entre serveur et client).
  const promoIndex = slot.split("").reduce((n, c) => n + c.charCodeAt(0), 0) % PROMOS.length;
  const promo = PROMOS[promoIndex];

  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    try {
      supabase.from('campagnes_pub').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(1).then(({ data }) => {
        if (data && data.length > 0) {
          setActiveCampaign({
            hero: data[0].hero,
            footer: data[0].footer,
            catalogue: data[0].catalogue,
            product: data[0].product,
            url: data[0].url,
            weeks: data[0].weeks,
            startDate: data[0].start_date,
            status: data[0].status,
            id: data[0].id
          });
        }
      });
    } catch {}
  }, [supabase]);

  const Inner = () => (
    <div className="flex min-h-[110px] w-full flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-6 sm:px-10">
      {/* Decorative Background Elements */}
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl"></div>
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-gold/20 blur-2xl"></div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

      {/* Étiquette auto-promo (pas « Sponsorisé » : aucun annonceur payant ici) */}
      <span className="absolute left-0 top-0 rounded-br-lg bg-black/40 px-3 py-1 text-[.65rem] font-bold uppercase tracking-widest text-white/80 backdrop-blur-md">
        Wanteermako
      </span>

      <div className="relative z-10 max-w-[70%] mt-3 sm:mt-0">
        <div className="font-display text-[1.4rem] font-extrabold tracking-tight sm:text-[1.6rem] leading-tight">
          {promo.title}
        </div>
        <div className="mt-1.5 text-[.85rem] font-medium text-white/80">
          {promo.subtitle}
        </div>
      </div>

      <div className="relative z-10 mt-5 sm:mt-0 shrink-0">
        <button className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[.85rem] font-bold text-gray-900 shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] transition-all group-hover:scale-105 group-hover:bg-gray-50 group-hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)]">
          {promo.cta} <span className="text-[1.1rem]">→</span>
        </button>
      </div>
    </div>
  );

  let activeImage = null;
  if (activeCampaign) {
    if (slot.includes('home-top')) activeImage = activeCampaign.hero;
    else if (slot.includes('home-middle')) activeImage = activeCampaign.footer;
    else if (slot.includes('listing') || slot.includes('A9')) activeImage = activeCampaign.catalogue;
    else if (slot.includes('A5') || slot.includes('A6')) activeImage = activeCampaign.product;

    // Fallback : si l'image spécifique n'existe pas, prendre la première image disponible
    if (!activeImage) {
      activeImage = activeCampaign.hero || activeCampaign.footer || activeCampaign.catalogue || activeCampaign.product;
    }
  }

  if (activeImage) {
    return (
      <a href={activeCampaign.url || href || "#"} target={activeCampaign.url ? "_blank" : "_self"} className="group relative block w-full overflow-hidden rounded-[16px] shadow-xl transition-all hover:shadow-2xl">
        <span className="absolute left-0 top-0 z-20 rounded-br-lg bg-black/60 px-3 py-1 text-[.65rem] font-bold uppercase tracking-widest text-white/90 backdrop-blur-md">
          {label}
        </span>
        <div className="w-full relative bg-gray-100 flex items-center justify-center h-[80px] sm:h-[100px] md:h-[120px]">
          {activeImage.startsWith('data:video') ? (
             <video src={activeImage} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          ) : (
             <img src={activeImage} className="w-full h-full object-cover" alt="Publicité" />
          )}
        </div>
      </a>
    );
  }

  return (
    <Link href={promo.href} className={className} aria-label={promo.title}>
      <Inner />
    </Link>
  );
}
