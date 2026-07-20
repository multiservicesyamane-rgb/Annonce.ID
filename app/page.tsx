import React from "react";
import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import AdBanner from "@/components/AdBanner";
import AdSensePlaceholder from "@/components/AdSensePlaceholder";
import AdCard from "@/components/AdCard";
import HomeRecent from "@/components/HomeRecent";
import { getFeaturedListings, getPremiumListings, getRecentListings } from "@/lib/homeSections";
import { createClient } from "@supabase/supabase-js";

import UneCarousel from "@/components/UneCarousel";
import FeaturedSlider from "@/components/FeaturedSlider";

import CategoryCarousel from "@/components/CategoryCarousel";
import ScrollReveal from "@/components/ScrollReveal";
import { SkeletonGrid } from "@/components/SkeletonCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import RecommendedForYou from "@/components/RecommendedForYou";

// Revalidate every 30s for fast loads + near-realtime data
export const revalidate = 30;

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [formattedListings, une, prem] = await Promise.all([
    getRecentListings(),
    getFeaturedListings(),
    getPremiumListings(),
  ]);

  // Repli : si aucune annonce À la Une / Premium, on affiche les plus récentes
  const uneList = une.length > 0 ? une : formattedListings.slice(0, 10);
  const premList = prem.length > 0 ? prem : formattedListings.slice(0, 8);

  // Boutiques = vendeurs ayant ≥1 annonce active (auto-activation, comme la page /boutiques)
  const { data: allBoutiques } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio, role, has_boutique')
    .limit(200);

  const { data: boutiqueCounts } = await supabase
    .from('listings')
    .select('user_id')
    .eq('status', 'active');

  const bCountMap: Record<string, number> = {};
  (boutiqueCounts || []).forEach((l: any) => { bCountMap[l.user_id] = (bCountMap[l.user_id] || 0) + 1; });

  const activeSellers = (allBoutiques || [])
    .filter((b: any) => (bCountMap[b.id] || 0) > 0);
  const boutiques = activeSellers.slice(0, 8);
  // Avatars pour la preuve sociale (petits ronds), sans aucun chiffre.
  const sellerAvatars = activeSellers.slice(0, 12);

  return (
    <>
      <Hero />

      {/* Bandeau "À la Une" + Premium (déduplication par id), cliquable */}
      <FeaturedSlider listings={[...uneList, ...premList].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i)} />

      {/* Preuve sociale : petits ronds (photos vendeurs), SANS aucun chiffre.
          On réintroduira des compteurs quand la plateforme aura du volume. */}
      {sellerAvatars.length > 0 && (
        <section className="wrap pt-3 pb-1">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 px-4 py-3 md:py-4 shadow-sm">
            <div className="flex -space-x-2.5">
              {sellerAvatars.map((s: any, i: number) => (
                <div
                  key={s.id}
                  className="h-8 w-8 md:h-10 md:w-10 rounded-full border-2 border-white dark:border-dark-800 overflow-hidden bg-gray-100 dark:bg-dark-700 shadow-sm"
                  style={{ zIndex: sellerAvatars.length - i }}
                >
                  {s.avatar_url ? (
                    <img src={s.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[.6rem] md:text-[.72rem] font-bold text-gray-500 dark:text-gray-300">
                      {(s.full_name || 'V').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-[.72rem] md:text-[.9rem] font-semibold text-gray-600 dark:text-gray-300">
              Des vendeurs de confiance sur Wanteermako
            </span>
          </div>
        </section>
      )}

      {/* Bannière AdSense MASQUÉE jusqu'à activation (remettre true le moment venu) */}
      {false && (
        <div className="wrap mt-2 flex justify-center">
          <div className="h-[50px] w-full max-w-[320px] rounded-md bg-gray-200 dark:bg-[#111722] md:h-[90px] md:max-w-[728px]" />
        </div>
      )}

      {/* À LA UNE — section vedette, premium */}
      {uneList.length > 0 && (
        <ScrollReveal className="wrap pt-3 pb-1 md:pt-4" delay={100}>
          <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#7C5CFC] to-[#A855F7] px-4 py-2.5 shadow-[0_8px_24px_rgba(124,92,252,0.3)]">
            <h2 className="flex items-center gap-2 font-display text-[1rem] md:text-[1.3rem] font-black text-white">
              <span className="text-neon-gold drop-shadow">✦</span> Annonces à la Une
            </h2>
            <Link href="/recherche?featured=1" className="shrink-0 rounded-full bg-white/15 px-3.5 py-1.5 text-[.76rem] font-bold text-white backdrop-blur hover:bg-white/25">
              Voir tout →
            </Link>
          </div>

          <UneCarousel listings={uneList} />
        </ScrollReveal>
      )}


      {/* PREMIUM carousel */}
      {premList.length > 0 && (
        <ScrollReveal delay={200}>
        <section className="bg-gradient-to-b from-gray-50 to-white dark:from-[#0f172a] dark:to-black py-4 md:py-8 relative overflow-hidden transition-colors">
          {/* Subtle glowing orb in background (Dark mode only) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[100px] pointer-events-none hidden dark:block"></div>
          <div className="wrap relative z-10">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="flex items-center gap-3 font-display text-[1.2rem] md:text-[1.4rem] font-bold text-gray-900 dark:text-white tracking-tight">
                Annonces Premium <span className="bg-gradient-to-r from-gold to-[#F3E5AB] text-dark-900 px-3 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.3)]">VIP</span>
              </h2>
              <Link href="/recherche" className="text-[.85rem] font-semibold text-gold hover:text-gold-dark dark:hover:text-white transition-colors flex items-center gap-2">
                Découvrir la sélection <span>→</span>
              </Link>
            </div>
            
            <div className="no-scrollbar flex gap-1.5 md:gap-3 overflow-x-auto pb-4 snap-x pt-2 px-1">
              {premList.map((ad) => (
                <Link
                  key={ad.id}
                  href={`/annonce/${ad.id}/${ad.slug}`}
                  className="w-[200px] md:w-[290px] shrink-0 overflow-hidden rounded-[16px] border-[1.5px] border-[#FFD24A] ring-1 ring-neon-gold/25 bg-gradient-to-br from-[#FFFEF8] via-[#FFF4D6] to-[#FFE7AE] dark:from-[#211a07] dark:via-[#2a2009] dark:to-[#161208] shadow-[0_10px_30px_rgba(245,166,35,0.18)] transition-all duration-300 hover:-translate-y-2 hover:border-[#FFE08A] hover:shadow-[0_18px_46px_rgba(245,166,35,0.38)] snap-start group"
                >
                  <div className="relative w-full aspect-square overflow-hidden bg-gray-100 dark:bg-black/50">
                    <Image src={ad.image} alt={ad.title} width={400} height={400} sizes="(max-width: 768px) 200px, 290px" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-100" />
                    
                    {/* VIP Tag over image */}
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 dark:bg-black/60 backdrop-blur-md text-gold-dark dark:text-gold text-[.6rem] font-bold px-2.5 py-1 rounded-full border border-gold/30 uppercase tracking-widest shadow-sm dark:shadow-lg">
                        ⭐ Top
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-1.5 md:p-3">
                    <div className="flex items-center justify-between mb-0.5 md:mb-1.5">
                      <span className="text-[.5rem] md:text-[.6rem] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">{ad.category}</span>
                    </div>
                    <h3 className="line-clamp-2 text-[.7rem] md:text-[.85rem] font-bold text-gray-900 dark:text-white leading-tight mb-1 md:mb-2 group-hover:text-gold dark:group-hover:text-gold transition-colors">
                      {ad.title}
                    </h3>
                    <div className="font-display text-[.8rem] md:text-[1.05rem] font-black mb-0.5 text-transparent bg-clip-text bg-gradient-to-r from-[#D4891A] via-[#F5A623] to-[#FFC93C]">
                      {ad.price}
                    </div>
                    <div className="text-[.55rem] md:text-[.7rem] text-gray-500 dark:text-gray-400 font-medium">
                      <span className="opacity-70">📍</span> {ad.location}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        </ScrollReveal>
      )}

      {/* NOUVELLES ANNONCES (Déplacé sous Premium) */}
      <ScrollReveal className="wrap py-3 md:py-6" delay={50}>
        <div className="mb-3 md:mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-gray-100 dark:border-dark-border pb-2 md:pb-3">
          <div>
            <h2 className="font-display text-[1.2rem] md:text-[1.4rem] font-bold text-gray-900 dark:text-white">
              Annonces Récentes
            </h2>
            <p className="text-[.85rem] text-gray-500 mt-1">Les dernières bonnes affaires au Sénégal</p>
          </div>
        </div>
        
        <HomeRecent initialListings={formattedListings} />
      </ScrollReveal>

      {/* Bande publicitaire — sous les produits récents */}
      <ScrollReveal className="wrap py-3" delay={120}>
        <AdBanner
          slot="home-top"
          title="Propulsez vos ventes dès aujourd'hui"
          subtitle="Boostez votre annonce et gagnez en visibilité auprès des acheteurs du Sénégal."
          variant="night"
        />
      </ScrollReveal>

      {/* CATEGORIES */}
      <ScrollReveal className="wrap py-2 md:py-4">
        <h2 className="mb-2 md:mb-3 font-display text-[1.15rem] md:text-[1.3rem] font-bold text-gray-900 dark:text-white">Explorer par catégorie</h2>
        {/* We will replace this with CategoryCarousel in the next step, for now it's just the wrapper */}
        <CategoryCarousel />
      </ScrollReveal>

      {/* BLOC PROMO — Vendez sur Wanteermako */}
      <ScrollReveal className="wrap py-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#7C5CFC] to-[#A855F7] p-5 sm:p-7 shadow-[0_10px_30px_rgba(124,92,252,0.3)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[.6rem] font-black uppercase tracking-wider text-white">💼 Vendeurs</div>
              <h2 className="font-display text-[1.4rem] sm:text-[2rem] font-black leading-tight text-white">Vendez sur Wanteermako, <span className="text-neon-gold">gagnez plus</span></h2>
              <p className="mt-1 text-[.84rem] text-white/85">Publication gratuite · 0% commission · diffusion auto Telegram & Facebook</p>
            </div>
            <Link href="/publier" className="shrink-0 rounded-xl bg-white px-6 py-3 text-[.9rem] font-black text-[#6366F1] shadow-lg transition hover:scale-105">Publier une annonce →</Link>
          </div>
        </div>
      </ScrollReveal>

      {/* BOUTIQUES OFFICIELLES (Déplacé sous Premium) */}
      {boutiques && boutiques.length > 0 && (
        <ScrollReveal className="wrap py-3 md:py-6">
          <div className="mb-3 md:mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-[1.2rem] md:text-[1.4rem] font-bold text-gray-900 dark:text-white">
                Nos Boutiques Partenaires 🏪
              </h2>
              <p className="text-[.85rem] text-gray-500 mt-1">Découvrez les meilleures entreprises et vendeurs pros</p>
            </div>
            <Link href="/boutiques" className="text-[.85rem] font-semibold text-green hover:text-gold-dark">
              Toutes les boutiques →
            </Link>
          </div>
          
          <div className="no-scrollbar flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x">
            {boutiques.map((b: any) => {
              // Éviter d'afficher l'email si full_name n'est pas configuré
              let displayName = b.full_name || 'Boutique Pro';
              if (displayName.includes('@')) {
                displayName = displayName.split('@')[0];
              }
              
              const isPro = b.role === 'pro' || b.role === 'business' || (b.full_name || '').toLowerCase().includes('multiservice') || (b.full_name || '').toLowerCase().includes('tech');
              
              return (
                <Link key={b.id} href={`/boutique/${b.id}`} className="flex flex-col items-center gap-2.5 w-[90px] md:w-[110px] shrink-0 snap-start group">
                  <div className={`w-[75px] h-[75px] md:w-[95px] md:h-[95px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${isPro ? 'avatar-ring-premium shadow-[0_0_15px_rgba(245,166,35,0.15)]' : 'avatar-ring-standard'}`}>
                    <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white dark:border-[#0D1117] bg-white dark:bg-[#161B22]">
                      {b.avatar_url ? (
                        <Image src={b.avatar_url} alt={displayName} width={90} height={90} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[1.1rem] font-extrabold text-gray-400">{displayName.slice(0, 2).toUpperCase()}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-[0.72rem] md:text-[0.8rem] font-bold text-center leading-tight line-clamp-2 text-gray-800 dark:text-white group-hover:text-[#6366F1] dark:group-hover:text-green-400 transition-colors">
                    {displayName}
                  </span>
                </Link>
              );
            })}
          </div>
        </ScrollReveal>
      )}

      {/* BANNER PUBLIER */}
      <ScrollReveal className="wrap py-2 md:py-4">
        <Link href="/publier" className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-green-400 p-4 sm:p-8 text-white shadow-lg transition hover:shadow-xl hover:scale-[1.01]">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
            <div>
              <h3 className="font-display text-[1.1rem] md:text-[1.4rem] font-bold mb-1">Publier un produit ou service GRATUITEMENT !</h3>
              <p className="text-white/80 text-[.75rem] md:text-sm">Commencez à vendre dès aujourd'hui à des milliers d'acheteurs.</p>
            </div>
            <div className="bg-white text-green-600 px-4 py-2 md:px-6 md:py-3 text-[.85rem] md:text-base rounded-full font-bold whitespace-nowrap shadow-sm">
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



      {/* RECOMMANDÉ POUR VOUS (basé sur l'historique de vues) */}
      <RecommendedForYou />

      {/* VUS RÉCEMMENT */}
      <RecentlyViewed />

      {/* TRUST */}
      <ScrollReveal className="wrap py-3 md:py-6" delay={150}>
        <div className="flex overflow-x-auto snap-x no-scrollbar gap-3 pb-2 md:grid md:grid-cols-3 md:gap-4 md:pb-0">
          {[
            { ic: "💬", t: "Contact direct", d: "WhatsApp, Appel ou message. Sans intermédiaire, sans panier." },
            { ic: "✅", t: "Vendeurs vérifiés", d: "Identité et téléphone vérifiés. Badges de confiance." },
            { ic: "🌍", t: "Accès Polyvalent", d: "Disponible partout, transactions simples et rapides." },
          ].map((b) => (
            <div key={b.t} className="w-[200px] shrink-0 snap-start md:w-auto rounded-xl border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-4 md:p-6 text-center hover:shadow-md transition">
              <div className="mx-auto mb-3 md:mb-4 flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-dark-700 text-[1.2rem] md:text-[1.5rem] text-blue-600 dark:text-blue-400">
                {b.ic}
              </div>
              <h4 className="mb-1 md:mb-2 font-display text-[.9rem] md:text-[1rem] font-bold text-gray-900 dark:text-white">{b.t}</h4>
              <p className="text-[.75rem] md:text-[.85rem] text-gray-500 leading-snug md:leading-relaxed">{b.d}</p>
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
              Vendez vite avec <em className="not-italic text-neon-gold [text-shadow:0_0_16px_rgba(255,201,60,.5)]">Wanteermako</em>
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
