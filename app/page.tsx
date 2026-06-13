import React from "react";
import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import AdBanner from "@/components/AdBanner";
import AdCard from "@/components/AdCard";
import HomeRecent from "@/components/HomeRecent";
import { featuredListings, premiumListings } from "@/lib/data";
import { CATEGORIES } from "@/lib/constants";

import UneCarousel from "@/components/UneCarousel";

import CategoryCarousel from "@/components/CategoryCarousel";

export default function HomePage() {
  const une = featuredListings();
  const prem = premiumListings();

  return (
    <>
      <Hero />

      {/* AD A1 */}
      <div className="wrap mt-6">
        <AdBanner slot="A1" title="🟠 Orange Money — Payez vos annonces en 1 clic" subtitle="Bannière hero · Ciblage par pays" />
      </div>

      {/* À LA UNE */}
      <section className="wrap py-9">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-[1.25rem] font-bold text-gray-900">
            Annonces à la Une <span className="badge b-une">✦ UNE</span>
          </h2>
          <Link href="/recherche" className="text-[.82rem] font-semibold text-green hover:text-gold-dark">
            Voir tout →
          </Link>
        </div>
        
        <UneCarousel listings={une} />
      </section>

      {/* PREMIUM carousel */}
      <section className="bg-gradient-to-b from-[#0f172a] to-black py-12 relative overflow-hidden">
        {/* Subtle glowing orb in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="wrap relative z-10">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="flex items-center gap-3 font-display text-[1.6rem] font-bold text-white tracking-tight">
              Annonces Premium <span className="bg-gradient-to-r from-gold to-[#F3E5AB] text-dark-900 px-3 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.3)]">VIP</span>
            </h2>
            <Link href="/recherche" className="text-[.85rem] font-semibold text-gold hover:text-white transition-colors flex items-center gap-2">
              Découvrir la sélection <span>→</span>
            </Link>
          </div>
          
          <div className="no-scrollbar flex gap-5 overflow-x-auto pb-6 snap-x pt-2">
            {prem.map((ad) => (
              <Link
                key={ad.id}
                href={`/annonce/${ad.id}/${ad.slug}`}
                className="w-[260px] shrink-0 overflow-hidden rounded-[16px] bg-[#1A1A1A]/80 backdrop-blur-md border border-white/10 transition-all duration-300 hover:-translate-y-2 hover:border-gold/50 hover:shadow-[0_12px_30px_rgba(212,175,55,0.15)] snap-start group"
              >
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-black/50">
                  <Image src={ad.image} alt={ad.title} width={400} height={300} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent"></div>
                  
                  {/* VIP Tag over image */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-black/60 backdrop-blur-md text-gold text-[.6rem] font-bold px-2.5 py-1 rounded-full border border-gold/30 uppercase tracking-widest shadow-lg">
                      ⭐ Top
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[.65rem] uppercase tracking-widest text-gray-400 font-bold">{ad.category}</span>
                  </div>
                  <h3 className="line-clamp-2 text-[.95rem] font-bold text-white leading-snug mb-3 group-hover:text-gold transition-colors">
                    {ad.title}
                  </h3>
                  <div className="font-display text-[1.15rem] font-extrabold text-gold mb-1">
                    {ad.price}
                  </div>
                  <div className="text-[.75rem] text-gray-400 font-medium">
                    <span className="opacity-70">📍</span> {ad.location}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BANNER PUBLIER */}
      <section className="wrap py-6">
        <Link href="/publier" className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-green-400 p-6 sm:p-8 text-white shadow-lg transition hover:shadow-xl hover:scale-[1.01]">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-[1.4rem] font-bold mb-1">Publier un produit ou service GRATUITEMENT !</h3>
              <p className="text-white/80 text-sm">Commencez à vendre dès aujourd'hui à des milliers d'acheteurs.</p>
            </div>
            <div className="bg-white text-green-600 px-6 py-3 rounded-full font-bold whitespace-nowrap shadow-sm">
              Publier mon annonce
            </div>
          </div>
          <div className="absolute -right-10 -top-10 text-[10rem] opacity-20 pointer-events-none">🎁</div>
        </Link>
      </section>

      {/* CATEGORIES */}
      <section className="wrap py-9">
        <h2 className="mb-5 font-display text-[1.25rem] font-bold text-gray-900">Explorer par catégorie</h2>
        {/* We will replace this with CategoryCarousel in the next step, for now it's just the wrapper */}
        <CategoryCarousel />
      </section>

      {/* AD A2 */}
      <div className="wrap">
        <AdBanner slot="A2" title="🏦 Votre marque ici" subtitle="Bannière in-feed · 250 000 vues/mois" variant="green" />
      </div>

      {/* RÉCENTES */}
      <section className="wrap py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
          <h2 className="font-display text-[1.5rem] font-extrabold text-gray-900 tracking-tight">Nouveautés Récentes</h2>
          <Link href="/recherche" className="text-[.85rem] font-bold text-blue-600 hover:text-blue-800 transition">
            Parcourir tout →
          </Link>
        </div>
        <HomeRecent />
      </section>

      {/* TRUST */}
      <section className="wrap py-9">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { ic: "💬", t: "Contact direct", d: "WhatsApp, Appel ou message. Sans intermédiaire, sans panier." },
            { ic: "✅", t: "Vendeurs vérifiés", d: "Identité et téléphone vérifiés. Badges de confiance." },
            { ic: "🌍", t: "Accès Polyvalent", d: "Disponible partout, transactions simples et rapides." },
          ].map((b) => (
            <div key={b.t} className="rounded-xl border-[1.5px] border-gray-100 bg-white p-6 text-center hover:shadow-md transition">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[1.5rem] text-blue-600">
                {b.ic}
              </div>
              <h4 className="mb-2 font-display text-[1rem] font-bold text-gray-900">{b.t}</h4>
              <p className="text-[.85rem] text-gray-500 leading-relaxed">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-grad-hero">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_20%_30%,rgba(245,166,35,.22)_0,transparent_45%),radial-gradient(at_80%_25%,rgba(45,226,230,.15)_0,transparent_45%)]" />
        <div className="relative z-10 mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-4 py-10 max-sm:flex-col max-sm:text-center">
          <div>
            <h2 className="font-display text-[1.5rem] font-extrabold text-white">
              Vendez vite avec <em className="not-italic text-neon-gold [text-shadow:0_0_16px_rgba(255,201,60,.5)]">Annonce.ID</em>
            </h2>
            <p className="mt-1 text-[.88rem] text-white/65">Publiez gratuitement ou boostez pour des milliers de vues</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/publier" className="btn btn-lg bg-white !text-green">Publier gratuitement</Link>
            <Link href="/publier" className="btn btn-gold btn-lg">✦ Annonce Premium</Link>
          </div>
        </div>
      </section>
    </>
  );
}
