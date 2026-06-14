import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Gallery from "@/components/Gallery";
import ContactActions from "@/components/ContactActions";
import AdCard from "@/components/AdCard";
import AdBanner from "@/components/AdBanner";
import ShareButton from "@/components/ShareButton";
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

  const { data } = await supabase.from('listings').select('*, profiles(full_name, avatar_url)').eq('id', idParam).single();
  if (data) {
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      price: data.price ? formatNumber(data.price) + " FCFA" : "Gratuit",
      priceType: "fixe",
      category: data.category,
      categorySlug: data.category_slug,
      location: data.location,
      image: data.image || "https://placehold.co/600x400?text=Sans+Image",
      photos: data.photos || [],
      premium: data.premium,
      views: data.views,
      favorites: 0,
      date: new Date(data.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' }),
      specs: {},
      seller: {
        name: data.profiles?.full_name || "Vendeur",
        avatar: data.profiles?.avatar_url || "https://placehold.co/100x100?text=V",
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
          <div className="lg:hidden mt-4 bg-white dark:bg-dark-800 p-4 rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[.65rem] font-bold uppercase tracking-wider text-white bg-gold-dark px-2 py-0.5 rounded-sm">{ad.category}</span>
              <span className="text-[.75rem] text-gray-500">📍 {ad.location}</span>
            </div>
            <h1 className="font-display text-[1.15rem] font-bold leading-snug dark:text-white mb-3 text-gray-900">{ad.title}</h1>
            
            {/* Price Banner style e-commerce (adapté aux couleurs du site) */}
            <div className="rounded-md overflow-hidden border border-green mb-3">
              <div className="bg-green text-white px-3 py-1 flex items-center justify-between">
                <span className="font-bold text-[.75rem] uppercase flex items-center gap-1.5">⚡ Prix de l'Annonce</span>
                <span className="text-[.65rem] opacity-90">Postée le {ad.date}</span>
              </div>
              <div className="bg-green/5 dark:bg-green/10 p-3 flex flex-col justify-center border-b border-green/10">
                <div className="font-display text-[1.6rem] font-extrabold text-green leading-none">{ad.price}</div>
                {ad.priceType === "negociable" && <div className="text-[.7rem] font-semibold text-green/70 mt-1 uppercase tracking-wide">↔ Négociable</div>}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-[.75rem] text-gray-500">
              <div className="flex items-center gap-1 text-gold font-bold">⭐⭐⭐⭐⭐ <span className="text-gray-400 font-normal">(Aucun avis)</span></div>
              <ShareButton title={ad.title} />
            </div>
          </div>

          <section className="mt-5 rounded-lg border-[1.5px] border-gray-100 bg-white p-5">
            <h3 className="mb-3 font-display text-[1.05rem] font-bold">Description</h3>
            <p className="whitespace-pre-line text-[.9rem] leading-loose text-gray-700">{ad.description}</p>
          </section>

          <section className="mt-5 rounded-lg border-[1.5px] border-gray-100 bg-white p-5">
            <h3 className="mb-3 font-display text-[1.05rem] font-bold">Caractéristiques</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(ad.specs).map(([k, v]) => (
                <div key={k} className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-[.83rem]">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-900">{String(v)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5">
            <h3 className="mb-3 font-display text-[1.05rem] font-bold dark:text-white">📍 Localisation</h3>
            <div className="flex h-40 items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-900 text-[.85rem] text-gray-500 dark:text-white/50 relative overflow-hidden">
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

          {/* AVIS (Mock) */}
          <section className="mt-5 rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5 mb-5 lg:mb-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-[1.05rem] font-bold dark:text-white">Avis sur le vendeur</h3>
              <div className="text-[.85rem] font-bold text-gold">⭐ 4.8/5 (12 avis)</div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="border-b border-gray-50 dark:border-dark-border pb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[.85rem] dark:text-white">Ousmane S.</span>
                  <span className="text-[.7rem] text-gray-400">Il y a 2 jours</span>
                </div>
                <div className="text-gold text-[.7rem] mb-1">⭐⭐⭐⭐⭐</div>
                <p className="text-[.85rem] text-gray-600 dark:text-white/70">Vendeur très sérieux, produit conforme à la description. Je recommande !</p>
              </div>
            </div>
            <button className="btn btn-outline btn-sm btn-block mt-4">Laisser un avis</button>
          </section>
        </div>

        {/* DROITE : panneau contact sticky */}
        <div>
          <div className="flex flex-col gap-3.5 rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5 lg:sticky lg:top-[calc(64px+1rem)]">
            {ad.premium && (
              <div className="flex items-center gap-1.5 rounded-[10px] bg-grad-gold px-3 py-2 text-[.78rem] font-bold text-dark-900 shadow-glow-gold">
                ✦ PREMIUM · Vendeur Vérifié ✅
              </div>
            )}
            
            {/* DESKTOP ONLY: Title & Price are hidden on mobile since they appear under gallery */}
            <div className="hidden lg:block">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[.68rem] font-bold uppercase tracking-wider text-gold-dark">{ad.category}</div>
                  <h1 className="mt-1 font-display text-[1.2rem] font-bold leading-snug dark:text-white">{ad.title}</h1>
                </div>
                <ShareButton title={ad.title} />
              </div>
              <div className="mt-3">
                <div className="font-display text-[1.9rem] font-extrabold leading-none text-grad-gold">{ad.price}</div>
                <div className="mt-1 text-[.78rem] text-gray-500">
                  {ad.priceType === "negociable" ? "↔ Prix négociable" : ad.priceType === "fixe" ? "Prix fixe" : ad.priceType}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[.78rem] text-gray-500">
                <span>📍 {ad.location}</span>
                <span>📅 {ad.date}</span>
                <span>👁 {(ad.views ?? 0).toLocaleString("fr-FR")} vues</span>
                <span>❤ {ad.favorites ?? 0}</span>
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
                <Link href={`/boutique/${seller.name.toLowerCase().replace(/\s/g, "-")}`} className="btn btn-sm btn-outline">
                  Boutique
                </Link>
              </div>
            )}

            <ContactActions title={ad.title} />

            <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] dark:bg-gold-pale/10 dark:border-gold-pale/20 p-3 text-[.76rem] text-[#92400e] dark:text-gold mt-2">
              <b className="mb-1 block">🛡️ Conseils de sécurité</b>
              Ne payez jamais à l&apos;avance. Rencontrez le vendeur dans un lieu public. Vérifiez le produit avant de payer.
            </div>
            
            <button className="text-[.75rem] text-gray-400 hover:text-brand-red flex items-center gap-1.5 justify-center mt-1 transition-colors">
              ⚠️ Signaler cette annonce
            </button>
          </div>

          {/* AD A5 */}
          <div className="mt-4 hidden lg:block">
            <AdBanner slot="A5" title="Zone annonceur A5" subtitle="300×250 · Page annonce" variant="night" />
          </div>
        </div>
      </div>

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
      <div className="fixed inset-x-0 bottom-0 z-[700] flex gap-2 border-t border-gray-200 bg-white dark:bg-dark-900 dark:border-dark-border p-2 shadow-[0_-4px_20px_rgba(0,0,0,.1)] lg:hidden pb-safe">
        <Link href="/" className="w-[3.5rem] flex flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-800 shrink-0 shadow-sm transition hover:text-green">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </Link>
        <a href="tel:+221770000000" className="w-[3.5rem] flex flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-dark-border text-brand-red bg-red-50 dark:bg-red-900/20 shrink-0 shadow-sm transition hover:bg-red-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        </a>
        <a
          href={`https://wa.me/221770000000?text=${encodeURIComponent(`Bonjour, votre annonce "${ad.title}" est-elle toujours disponible ?`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg bg-orange-500 text-white font-bold text-[.95rem] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          Acheter / Discuter
        </a>
      </div>
    </div>
  );
}
