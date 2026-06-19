import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Gallery from "@/components/Gallery";
import ContactActions from "@/components/ContactActions";
import AdCard from "@/components/AdCard";
import AdBanner from "@/components/AdBanner";
import ShareButton from "@/components/ShareButton";
import ReportListing from "@/components/ReportListing";
import { createClient } from "@supabase/supabase-js";
import { formatNumber } from "@/lib/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fetchAd(idParam: string) {
  // UUID check rough regex to prevent invalid input errors in supabase
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idParam)) {
    // Also try as an integer id if it is one (legacy support)
    if (isNaN(Number(idParam))) return null;
  }

  const { data } = await supabase.from('listings').select('*, profiles(full_name, avatar_url, phone)').eq('id', idParam).single();
  if (data) {
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      price: data.price_type === "Sur devis" ? "Sur devis" : (data.price && data.price !== "0" ? formatNumber(data.price) + " FCFA" : "Gratuit"),
      priceType: data.price_type || "Prix Fixe",
      category: data.category,
      categorySlug: data.category_slug,
      location: data.location,
      image: data.image || "https://placehold.co/600x400?text=Sans+Image",
      photos: data.photos || [],
      premium: data.premium,
      views: data.views,
      favorites: 0,
      date: new Date(data.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' }),
      specs: data.specs || {},
      seller: {
        id: data.user_id,
        name: data.profiles?.full_name || "Vendeur",
        avatar: data.profiles?.avatar_url || "https://placehold.co/100x100?text=V",
        phone: data.profiles?.phone || "+221770000000",
        rating: "Nouveau",
        sales: 0,
        isPro: false
      }
    } as any;
  }
  return null;
}

async function fetchSimilar(category: string, currentId: string) {
  const { data } = await supabase.from('listings')
    .select('id, slug, title, price, location, image, category')
    .eq('category', category)
    .eq('status', 'active')
    .neq('id', currentId)
    .limit(4);
    
  return (data || []).map((ad: any) => ({
    id: ad.id,
    slug: ad.slug,
    title: ad.title,
    price: ad.price ? `${formatNumber(ad.price)} FCFA` : "Gratuit",
    location: ad.location || "Sénégal",
    image: ad.image || "https://placehold.co/600x400?text=Sans+Image",
    category: ad.category || "Autre",
  }));
}

type Props = { params: { id: string; slug: string } };

// SEO dynamique par annonce (section 18)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ad = await fetchAd(params.id);
  if (!ad) return { title: "Annonce introuvable" };
  return {
    title: ad.title,
    description: ad.description.slice(0, 160),
    openGraph: {
      title: ad.title,
      description: ad.description.slice(0, 160),
      images: [{ url: ad.image }],
      type: "website",
    },
  };
}

// Génère les routes statiques pour les annonces de démo (SSG)
export function generateStaticParams() {
  return []; // SSR needed for dynamic Supabase ads
}

export default async function AnnoncePage({ params }: Props) {
  const ad = await fetchAd(params.id);
  if (!ad) notFound();

  const images = ad.photos && ad.photos.length > 0 ? ad.photos : [ad.image];
  const similar = await fetchSimilar(ad.category, ad.id);
  const seller = ad.seller;

  // Schema.org Product/Offer pour le SEO riche
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ad.title,
    description: ad.description,
    image: images,
    offers: {
      "@type": "Offer",
      price: ad.price.replace(/[^0-9]/g, ""),
      priceCurrency: "XOF",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="py-3.5 text-[.78rem] text-gray-500">
        <Link href="/" className="text-green hover:text-gold-dark">Accueil</Link> ›{" "}
        <Link href={`/categorie/${ad.categorySlug}`} className="text-green hover:text-gold-dark">{ad.category}</Link> ›{" "}
        <b className="text-gray-700">{ad.title}</b>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* GAUCHE */}
        <div className="flex flex-col">
          <Gallery images={images} title={ad.title} />

          {/* MOBILE ONLY: Title & Price immediately after image */}
          <div className="lg:hidden mt-4 bg-white dark:bg-dark-800 p-4 rounded-xl border-[1.5px] border-gray-100 dark:border-dark-border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[.65rem] font-bold uppercase tracking-wider text-dark-900 bg-neon-gold px-2.5 py-0.5 rounded-sm shadow-[0_0_10px_rgba(245,166,35,0.3)]">{ad.category}</span>
              <span className="text-[.75rem] text-gray-500 font-medium">📍 {ad.location}</span>
            </div>
            <h1 className="font-display text-[1.25rem] font-bold leading-tight dark:text-white mb-4 text-gray-900">{ad.title}</h1>
            
            {/* Price Banner style premium */}
            <div className="rounded-[16px] overflow-hidden border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/40 shadow-sm mb-4 relative">
              <div className="absolute top-0 right-0 p-3 opacity-10 dark:opacity-20 text-green-500">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <div className="p-4 flex flex-col justify-center relative z-10">
                <div className="text-[.7rem] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-1">Prix Exclusif</div>
                <div className={`font-display text-[1.8rem] font-extrabold leading-none ${ad.premium ? 'text-transparent bg-clip-text bg-gradient-to-r from-neon-gold to-white drop-shadow-[0_0_15px_rgba(245,166,35,0.4)]' : 'text-green-600 dark:text-green-400'}`}>
                  {ad.price}
                </div>
                {ad.priceType === "negociable" && <div className="text-[.7rem] font-semibold text-gray-400 mt-2 flex items-center gap-1"><span>🤝</span> Négociable avec le vendeur</div>}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-[.75rem] text-gray-500 mb-2">
              <div className="flex items-center gap-1 text-neon-gold font-bold">⭐⭐⭐⭐⭐ <span className="text-gray-400 font-normal ml-1">(Vendeur fiable)</span></div>
              <ShareButton title={ad.title} />
            </div>
            

          </div>

          <section className="mt-4 sm:mt-5 rounded-xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-4 sm:p-6 shadow-sm">
            <h3 className="mb-3 font-display text-[1rem] sm:text-[1.1rem] font-bold uppercase tracking-wider text-gray-900 dark:text-white">Description du produit</h3>
            <p className="whitespace-pre-line text-[.9rem] sm:text-[.95rem] leading-[1.7] text-gray-700 dark:text-gray-300">{ad.description}</p>
          </section>

          {Object.keys(ad.specs || {}).length > 0 && (
            <section className="mt-4 sm:mt-5 rounded-xl border border-indigo-100 dark:border-indigo-500/10 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 dark:from-indigo-500/[0.06] dark:via-[#111722] dark:to-purple-500/[0.04] p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-5 w-1.5 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500"></span>
                <h3 className="font-display text-[1rem] sm:text-[1.1rem] font-extrabold text-gray-900 dark:text-white">Caractéristiques</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(ad.specs).map(([k, v]) => (
                  <div key={k} className="flex flex-col rounded-[10px] border border-indigo-100/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.03] px-2.5 py-2">
                    <span className="text-[.62rem] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">{k}</span>
                    <span className="text-[.82rem] font-bold text-indigo-900 dark:text-white truncate">{String(v)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-4 sm:mt-5 rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-4 sm:p-5">
            <h3 className="mb-3 font-display text-[1rem] font-bold dark:text-white">📍 Localisation</h3>
            <div className="flex h-24 sm:h-36 items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-900 text-[.82rem] text-gray-500 dark:text-white/50 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Dakar&zoom=12&size=600x300&sensor=false')] bg-cover bg-center"></div>
              <div className="relative z-10 flex flex-col items-center gap-2">
                <span className="text-2xl">🗺️</span>
                <span>Zone approximative : {ad.location}</span>
              </div>
            </div>
          </section>
          <div className="mt-5">
            <AdBanner 
              slot="single-product-middle" 
              title="Votre marque ici" 
              subtitle="Ciblez des clients ultra-qualifiés sur nos pages produits." 
              variant="night" 
            />
          </div>


        </div>

        {/* DROITE : panneau contact sticky */}
        <div>
          <div className="flex flex-col gap-4 rounded-[20px] border border-gray-100 dark:border-white/5 bg-white dark:bg-[#111722]/80 dark:backdrop-blur-xl p-4 sm:p-6 lg:sticky lg:top-[calc(64px+1.5rem)] shadow-lg">
            {ad.premium && (
              <div className="flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-neon-gold/20 to-[#D4891A]/10 border border-neon-gold/30 px-3 py-2 text-[.75rem] font-bold text-neon-gold uppercase tracking-widest shadow-[0_0_15px_rgba(245,166,35,0.15)] w-max">
                <span className="animate-pulse">✨</span> Premium Collection
              </div>
            )}
            
            {/* DESKTOP ONLY: Title & Price */}
            <div className="hidden lg:block">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="text-[.68rem] font-bold uppercase tracking-widest text-gray-400 mb-1">{ad.category}</div>
                  <h1 className="font-display text-[1.4rem] font-bold leading-tight dark:text-white">{ad.title}</h1>
                </div>
                <div className="shrink-0">
                  <ShareButton title={ad.title} />
                </div>
              </div>
              
              <div className="mt-4 mb-4 p-5 rounded-[16px] bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-green-500/10 dark:text-neon-gold/5 rotate-12 transition-transform group-hover:scale-110">
                   <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className={`font-display text-[2.2rem] font-extrabold leading-none ${ad.premium ? 'text-transparent bg-clip-text bg-gradient-to-r from-neon-gold to-white drop-shadow-[0_0_15px_rgba(245,166,35,0.4)]' : 'text-green-600 dark:text-green-400'}`}>
                    {ad.price}
                  </div>
                  <div className="mt-2 text-[.75rem] font-bold uppercase tracking-widest text-gray-500 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full w-max">
                    {ad.priceType === "negociable" ? "🤝 Négociable" : ad.priceType === "fixe" ? "🔒 Ex-Showroom" : ad.priceType}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-[.75rem] text-gray-500 font-medium bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                <span className="flex items-center gap-1.5"><span className="text-neon-gold">📍</span> {ad.location}</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">📅</span> {ad.date}</span>
              </div>
              

            </div>

            <div className="my-2 hidden lg:block border-t border-gray-100 dark:border-dark-border"></div>

            {seller && (
              <div className="flex items-center gap-3 rounded-[10px] bg-gray-50 p-3">
                <Image src={seller.avatar} alt={seller.name} width={46} height={46} className="h-[46px] w-[46px] rounded-full border-2 border-gold object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-[.88rem] font-semibold">
                    {seller.name} {seller.isPro && <span className="badge b-pro !text-[.6rem]">PRO</span>}
                  </div>
                  <div className="text-[.72rem] text-gray-500">⭐ {seller.rating} · {seller.sales} ventes</div>
                </div>
                <Link href={`/boutique/${seller.id}`} className="btn btn-sm btn-outline">
                  Boutique
                </Link>
              </div>
            )}

            <ContactActions title={ad.title} adId={ad.id} sellerId={ad.seller.id} phone={seller?.phone} />

            <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] dark:bg-gold-pale/10 dark:border-gold-pale/20 p-3 text-[.76rem] text-[#92400e] dark:text-gold mt-2">
              <b className="mb-1 block">🛡️ Conseils de sécurité</b>
              Ne payez jamais à l&apos;avance. Rencontrez le vendeur dans un lieu public. Vérifiez le produit avant de payer.
            </div>
          </div>

          {/* AD A5 */}
          <div className="mt-4 hidden lg:block">
            <AdBanner slot="A5" title="Zone annonceur A5" subtitle="300×250 · Page annonce" variant="night" />
          </div>
        </div>
      </div>

      {/* Signaler l'annonce */}
      <ReportListing listingId={ad.id} />

      {/* SIMILAIRES */}
      <section className="py-9">
        <h2 className="mb-5 font-display text-[1.25rem] font-bold text-gray-900">Annonces similaires</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {similar.map((s) => (
            <AdCard key={s.id} ad={s as any} />
          ))}
        </div>
      </section>

      {/* AD A6 */}
      <div className="pb-20 lg:pb-8">
        <AdBanner slot="A6" title="Zone annonceur A6" subtitle="728×90 · Avant footer" />
      </div>

      {/* Barre contact sticky mobile (Style Jumia/E-commerce) */}
      <div className="fixed inset-x-0 bottom-0 z-[700] flex gap-2.5 border-t border-gray-200 bg-white dark:bg-dark-900 dark:border-dark-border px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,.15)] lg:hidden">
        <Link href="/" className="w-[3.8rem] h-[3.4rem] flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-800 shrink-0 shadow-sm transition hover:text-green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </Link>
        <a href={`tel:${(seller?.phone || "+221770000000").replace(/\s/g, "")}`} className="w-[3.8rem] h-[3.4rem] flex flex-col items-center justify-center rounded-xl border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 shrink-0 shadow-sm transition hover:bg-green-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        </a>
        <a
          href={(() => {
            let clean = (seller?.phone || "+221770000000").replace(/[^0-9]/g, "");
            if (clean.length === 9 && (clean.startsWith("7") || clean.startsWith("3"))) {
              clean = "221" + clean;
            }
            return `https://wa.me/${clean}?text=${encodeURIComponent(`Bonjour, votre annonce "${ad.title}" est-elle toujours disponible ?`)}`;
          })()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-[3.4rem] rounded-xl bg-[#25D366] text-white font-bold text-[1.05rem] flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(37,211,102,0.4)] active:scale-95 transition-transform"
        >
          Acheter / Discuter
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
