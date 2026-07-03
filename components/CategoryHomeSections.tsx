import Image from "next/image";
import Link from "next/link";
import FeaturedSlider from "@/components/FeaturedSlider";
import HomeRecent from "@/components/HomeRecent";
import ScrollReveal from "@/components/ScrollReveal";
import UneCarousel from "@/components/UneCarousel";
import type { Category } from "@/lib/constants";
import {
  getFeaturedListings,
  getPremiumListings,
  getRecentListings,
} from "@/lib/homeSections";

type CategoryHomeSectionsProps = {
  category: Category;
};

export default async function CategoryHomeSections({ category }: CategoryHomeSectionsProps) {
  const [recentListings, une, prem] = await Promise.all([
    getRecentListings(category.slug),
    getFeaturedListings(category.slug),
    getPremiumListings(category.slug),
  ]);

  const uneList = une.length > 0 ? une : recentListings.slice(0, 10);
  const premList = prem.length > 0 ? prem : recentListings.slice(0, 8);
  const featuredSliderListings = [...uneList, ...premList].filter(
    (v, i, a) => a.findIndex((x) => x.id === v.id) === i,
  );

  return (
    <>
      <section className="wrap pt-4 md:pt-6">
        <nav className="text-[.78rem] text-gray-500">
          <Link href="/" className="text-green hover:text-gold-dark">Accueil</Link> › <b className="text-gray-700">{category.name}</b>
        </nav>

        <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#7C5CFC] to-[#A855F7] p-4 text-white shadow-[0_10px_30px_rgba(124,92,252,0.3)] md:p-6">
          <div className="mb-1 text-[2rem] leading-none">{category.icon}</div>
          <h1 className="font-display text-[1.55rem] font-black leading-tight md:text-[2.1rem]">
            {category.name}
          </h1>
          <p className="mt-1 max-w-2xl text-[.86rem] text-white/85 md:text-[.95rem]">
            Les meilleures annonces de cette catégorie, mises à jour régulièrement.
          </p>
        </div>

        {category.subs.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {category.subs.slice(0, 10).map((sub) => (
              <span
                key={sub}
                className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[.72rem] font-bold text-gray-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
              >
                {sub}
              </span>
            ))}
          </div>
        )}
      </section>

      {featuredSliderListings.length > 0 && (
        <FeaturedSlider listings={featuredSliderListings} />
      )}

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
                  className="w-[200px] md:w-[290px] shrink-0 overflow-hidden rounded-[16px] bg-white dark:bg-[#1A1A1A]/80 backdrop-blur-md border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none transition-all duration-300 hover:-translate-y-2 hover:border-gold/50 dark:hover:border-gold/50 hover:shadow-[0_12px_30px_rgba(212,175,55,0.15)] snap-start group"
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
                    <div className="font-display text-[.8rem] md:text-[1.05rem] font-extrabold text-gold mb-0.5">
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

      <ScrollReveal className="wrap py-3 md:py-6" delay={50}>
        <div className="mb-3 md:mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-gray-100 dark:border-dark-border pb-2 md:pb-3">
          <div>
            <h2 className="font-display text-[1.2rem] md:text-[1.4rem] font-bold text-gray-900 dark:text-white">
              Annonces Récentes
            </h2>
            <p className="text-[.85rem] text-gray-500 mt-1">Les dernières bonnes affaires dans {category.name}</p>
          </div>
        </div>

        <HomeRecent initialListings={recentListings} categorySlug={category.slug} />
      </ScrollReveal>
    </>
  );
}
