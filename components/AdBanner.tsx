"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Bannière publicitaire annonceur. Design premium avec bouton "Call to Action".
 */
export default function AdBanner({
  slot,
  title,
  subtitle,
  label = "Sponsorisé",
  variant = "dark",
  href = "/dashboard?panel=campaigns",
}: {
  slot: string;
  title: string;
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

  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  useEffect(() => {
    try {
      const camp = localStorage.getItem("annonceid_campaign");
      if (camp) {
        setActiveCampaign(JSON.parse(camp));
      }
    } catch {}
  }, []);

  const Inner = () => (
    <div className="flex min-h-[110px] w-full flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-6 sm:px-10">
      {/* Decorative Background Elements */}
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl"></div>
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-gold/20 blur-2xl"></div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

      {/* Ad Tag */}
      <span className="absolute left-0 top-0 rounded-br-lg bg-black/40 px-3 py-1 text-[.65rem] font-bold uppercase tracking-widest text-white/80 backdrop-blur-md">
        {label}
      </span>

      <div className="relative z-10 max-w-[70%] mt-3 sm:mt-0">
        <div className="font-display text-[1.4rem] font-extrabold tracking-tight sm:text-[1.6rem] leading-tight">
          {title}
        </div>
        {subtitle && (
          <div className="mt-1.5 text-[.85rem] font-medium text-white/80">
            {subtitle}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-5 sm:mt-0 shrink-0">
        <button className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[.85rem] font-bold text-gray-900 shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] transition-all group-hover:scale-105 group-hover:bg-gray-50 group-hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)]">
          Découvrir <span className="text-[1.1rem]">→</span>
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
        <div className="w-full relative bg-gray-100 flex items-center justify-center aspect-[4/1]">
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
    <Link href={href} className={className} aria-label={`Emplacement publicitaire ${slot}`}>
      <Inner />
    </Link>
  );
}
