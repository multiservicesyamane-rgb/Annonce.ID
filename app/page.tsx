import React from "react";
import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import AdBanner from "@/components/AdBanner";
import AdSensePlaceholder from "@/components/AdSensePlaceholder";
import AdCard from "@/components/AdCard";
import HomeRecent from "@/components/HomeRecent";
import { CATEGORIES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";

import UneCarousel from "@/components/UneCarousel";

import CategoryCarousel from "@/components/CategoryCarousel";
import ScrollReveal from "@/components/ScrollReveal";
import { SkeletonGrid } from "@/components/SkeletonCard";
import RecentlyViewed from "@/components/RecentlyViewed";

// Revalidate every 30s for fast loads + near-realtime data
export const revalidate = 30;

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch recent active listings — only lightweight columns (NOT photos/description which are huge base64)
  const { data: recentListings } = await supabase
    .from('listings')
    .select('id, slug, title, price, location, image, category, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  // Transform to match Listing interface
  const formattedListings = (recentListings || []).map((ad: any) => ({
    id: ad.id,
    slug: ad.slug,
    title: ad.title,
    price: ad.price ? `${formatNumber(ad.price)} FCFA` : "Gratuit",
    location: ad.location || "Sénégal",
    image: ad.image || "https://placehold.co/600x400?text=Sans+Image",
    category: ad.category || "Autre",
  } as any));

  const une = formattedListings.slice(0, 10);
  const prem = formattedListings.slice(0, 8); // Currently using recent for premium

  // Fetch boutiques (profils avec avatar)
  const { data: boutiques } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .not('avatar_url', 'is', null)
    .limit(8);

  return (
    <>
      <Hero />

      {/* CTA VENDRE (Affiche sur tous les écrans) */}
      <ScrollReveal className="wrap mt-6">
        <Link href="/publier" className="flex items-center justify-between bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-xl shadow-md border border-green-400 hover:shadow-lg transition">
          <div className="flex items-center gap-3">
            <div className="text-[1.8rem] bg-white/20 p-2 rounded-lg leading-none">🚀</div>
            <div>
              <div className="font-bold text-[1.05rem] leading-tight">Vendez rapidement</div>
              <div className="text-[.75rem] opacity-90 mt-0.5">Publiez votre annonce en 2 min</div>
            </div>
          </div>
          <div className="bg-white text-green-600 text-[.85rem] font-bold px-4 py-2 rounded-full shadow-sm whitespace-nowrap ml-2">
            + Vendre
          </div>
        </Link>
      </ScrollReveal>



      {/* À LA UNE */}
      <ScrollReveal className="wrap py-9" delay={100}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-[1.25rem] font-bold text-gray-900">
            Annonces à la Une <span className="badge b-une">✦ UNE</span>
          </h2>
          <Link href="/recherche" className="text-[.82rem] font-semibold text-green hover:text-gold-dark">
            Voir tout →
          </Link>
        </div>
        
        <UneCarousel listings={une} />
      </ScrollReveal>

      {/* ZONE STRATÉGIQUE PUB 1 : Entre À la Une et Premium */}
      <ScrollReveal className="wrap py-6" delay={150}>
        <AdBanner 
          slot="home-top" 
          title="Propulsez vos ventes dès aujourd'hui" 
          subtitle="Placez votre marque ici et touchez 250 000 acheteurs." 
          variant="night" 
        />
      </ScrollReveal>

      {/* PREMIUM carousel */}
      <ScrollReveal delay={200}>
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
      </ScrollReveal>

      {/* NOUVELLES ANNONCES (Déplacé sous Premium) */}
      <ScrollReveal className="wrap py-12" delay={50}>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-100 dark:border-dark-border pb-4">
          <div>
            <h2 className="font-display text-[1.4rem] font-bold text-gray-900 dark:text-white">
              Annonces Récentes
            </h2>
            <p className="text-[.85rem] text-gray-500 mt-1">Les dernières bonnes affaires au Sénégal</p>
          </div>
        </div>
        
        <HomeRecent initialListings={formattedListings} />
      </ScrollReveal>

      {/* CATEGORIES */}
      <ScrollReveal className="wrap py-9">
        <h2 className="mb-5 font-display text-[1.25rem] font-bold text-gray-900 dark:text-white">Explorer par catégorie</h2>
        {/* We will replace this with CategoryCarousel in the next step, for now it's just the wrapper */}
        <CategoryCarousel />
      </ScrollReveal>

      {/* BOUTIQUES OFFICIELLES (Déplacé sous Premium) */}
      {boutiques && boutiques.length > 0 && (
        <ScrollReveal className="wrap py-12">
          <div className="mb-6 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-[1.4rem] font-bold text-gray-900 dark:text-white">
                Nos Boutiques Partenaires 🏪
              </h2>
              <p className="text-[.85rem] text-gray-500 mt-1">Découvrez les meilleures entreprises et vendeurs pros</p>
            </div>
            <Link href="/recherche" className="text-[.85rem] font-semibold text-green hover:text-gold-dark">
              Toutes les boutiques →
            </Link>
          </div>
          
          <div className="no-scrollbar flex gap-6 overflow-x-auto pb-4 snap-x">
            {boutiques.map((b: any) => {
              // Éviter d'afficher l'email si full_name n'est pas configuré
              let displayName = b.full_name || 'Boutique Pro';
              if (displayName.includes('@')) {
                displayName = displayName.split('@')[0];
              }
              
              return (
                <Link key={b.id} href={`/boutique/${b.id}`} className="flex flex-col items-center gap-3 w-[100px] shrink-0 snap-start group">
                  <div className="w-[85px] h-[85px] rounded-full overflow-hidden border-[3px] border-gray-100 dark:border-dark-border group-hover:border-gold transition-all shadow-sm">
                    <Image src={b.avatar_url} alt={displayName} width={85} height={85} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[.8rem] font-bold text-center leading-tight line-clamp-2 text-gray-800 dark:text-white group-hover:text-green">
                    {displayName}
                  </span>
                </Link>
              );
            })}
          </div>
        </ScrollReveal>
      )}

      {/* BANNER PUBLIER */}
      <ScrollReveal className="wrap py-6">
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
      </ScrollReveal>


      {/* AD A2 (Zone Stratégique Pub 2) */}
      <ScrollReveal className="wrap py-4">
        <AdBanner 
          slot="home-middle" 
          title="Votre publicité ici" 
          subtitle="Augmentez votre visibilité au cœur de notre plateforme" 
          variant="green" 
        />
      </ScrollReveal>



      {/* VUS RÉCEMMENT */}
      <RecentlyViewed />

      {/* TRUST */}
      <ScrollReveal className="wrap py-9" delay={150}>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { ic: "💬", t: "Contact direct", d: "WhatsApp, Appel ou message. Sans intermédiaire, sans panier." },
            { ic: "✅", t: "Vendeurs vérifiés", d: "Identité et téléphone vérifiés. Badges de confiance." },
            { ic: "🌍", t: "Accès Polyvalent", d: "Disponible partout, transactions simples et rapides." },
          ].map((b) => (
            <div key={b.t} className="rounded-xl border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-6 text-center hover:shadow-md transition">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-dark-700 text-[1.5rem] text-blue-600 dark:text-blue-400">
                {b.ic}
              </div>
              <h4 className="mb-2 font-display text-[1rem] font-bold text-gray-900 dark:text-white">{b.t}</h4>
              <p className="text-[.85rem] text-gray-500 leading-relaxed">{b.d}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>



      {/* CTA */}
      <ScrollReveal>
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
      </ScrollReveal>
    </>
  );
}
