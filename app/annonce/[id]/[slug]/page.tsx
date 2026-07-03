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
import SharePublishedBanner from "@/components/SharePublishedBanner";
import RecordView from "@/components/RecordView";
import { createClient } from "@supabase/supabase-js";
import { formatNumber, limitEmojis } from "@/lib/utils";
import { categoryBySlug } from "@/lib/constants";
import { getRootUrl, getSubdomainUrl } from "@/lib/categories";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Mise en cache (ISR) : chaque fiche annonce est servie depuis le cache pendant
// 5 min → réduit fortement le transfert serveur Vercel (page la plus visitée).
export const revalidate = 300;

async function fetchAd(idParam: string) {
  // UUID check rough regex to prevent invalid input errors in supabase
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idParam)) {
    // Also try as an integer id if it is one (legacy support)
    if (isNaN(Number(idParam))) return null;
  }

  const { data } = await supabase.from('listings').select('*, profiles(full_name, avatar_url, phone, role, created_at)').eq('id', idParam).single();
  if (data) {
    // Statut "vérifié" du vendeur — requête séparée et sécurisée (la colonne peut ne pas exister)
    let sellerVerified = false;
    try {
      const { data: sv } = await supabase.from('profiles').select('is_verified').eq('id', data.user_id).maybeSingle();
      sellerVerified = !!sv?.is_verified;
    } catch { /* colonne absente → false */ }

    // Nombre d'annonces ACTIVES du vendeur (chiffre vérifiable, remplace les faux « 0 ventes »)
    let sellerActiveCount = 0;
    try {
      const { count } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', data.user_id)
        .eq('status', 'active');
      sellerActiveCount = count || 0;
    } catch { /* ignore */ }
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
      externalUrl: data.external_url || null,
      source: data.source || null,
      orderWhatsapp: data.order_whatsapp || null,
      views: data.views,
      favorites: 0,
      date: new Date(data.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' }),
      specs: data.specs || {},
      seller: {
        id: data.user_id,
        name: data.profiles?.full_name || "Vendeur",
        avatar: data.profiles?.avatar_url || "https://placehold.co/100x100?text=V",
        phone: data.phone || data.profiles?.phone || "+221776827851",
        memberSince: data.profiles?.created_at ? new Date(data.profiles.created_at).getFullYear() : null,
        activeListings: sellerActiveCount,
        isPro: data.profiles?.role === "pro",
        isVerified: sellerVerified
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

export default async function AnnoncePage({ params }: Props) {
  const ad = await fetchAd(params.id);
  if (!ad) notFound();

  const images = ad.photos && ad.photos.length > 0 ? ad.photos : [ad.image];
  const similar = await fetchSimilar(ad.category, ad.id);
  const seller = ad.seller;
  const adCategory = categoryBySlug(ad.categorySlug);

  // Schema.org pour le SEO riche : Product + Offer (avec vendeur) + fil d'Ariane.
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://wanteermako.com";
  const canonicalUrl = `${base}/annonce/${ad.id}/${ad.slug}`;
  const priceValue = ad.price.replace(/[^0-9]/g, ""); // "" si "Sur devis" / "Gratuit"
  const categoryUrl = adCategory ? getSubdomainUrl(adCategory) : base;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: ad.title,
        description: ad.description,
        image: images,
        category: ad.category,
        offers: {
          "@type": "Offer",
          url: canonicalUrl,
          priceCurrency: "XOF",
          ...(priceValue ? { price: priceValue } : {}),
          availability: "https://schema.org/InStock",
          seller: {
            "@type": seller?.isPro ? "Organization" : "Person",
            name: seller?.name || "Vendeur",
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: base },
          { "@type": "ListItem", position: 2, name: ad.category, item: categoryUrl },
          { "@type": "ListItem", position: 3, name: ad.title },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RecordView ad={{ id: ad.id, slug: ad.slug, title: ad.title, price: ad.price, location: ad.location, image: ad.image, category: ad.category, premium: ad.premium }} />

      {/* Breadcrumb */}
      <nav className="py-3.5 text-[.78rem] text-gray-500">
        <Link href={getRootUrl()} className="text-green hover:text-gold-dark">Accueil</Link> ›{" "}
        {adCategory ? (
          <Link href={getSubdomainUrl(adCategory)} className="text-green hover:text-gold-dark">{ad.category}</Link>
        ) : (
          <span className="text-green">{ad.category}</span>
        )} ›{" "}
        <b className="text-gray-700">{ad.title}</b>
      </nav>

      {/* Bandeau de partage après publication (s'affiche si ?published=1) */}
      <SharePublishedBanner title={ad.title} />

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
            <h1 className="font-display text-[1.25rem] font-bold leading-tight dark:text-white mb-4 text-gray-900">{limitEmojis(ad.title)}</h1>
            
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
              <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                {seller?.memberSince && <span>👤 Membre depuis {seller.memberSince}</span>}
                {seller?.memberSince && <span className="text-gray-300">·</span>}
                <span>{seller?.activeListings ?? 0} annonce{(seller?.activeListings ?? 0) > 1 ? "s" : ""} active{(seller?.activeListings ?? 0) > 1 ? "s" : ""}</span>
              </div>
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
            <div className="overflow-hidden rounded-[12px] border border-gray-200 dark:border-dark-border">
              <iframe
                title="Carte de localisation"
                src={`https://maps.google.com/maps?q=${encodeURIComponent((ad.location || "Dakar") + ", Afrique de l'Ouest")}&z=12&output=embed`}
                className="h-44 w-full sm:h-56"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[.8rem] font-medium text-gray-600 dark:text-white/70">
              <span className="text-neon-gold">📍</span> Zone : {ad.location}
            </p>
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
                  <h1 className="font-display text-[1.4rem] font-bold leading-tight dark:text-white">{limitEmojis(ad.title)}</h1>
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
              <div className="relative flex items-center gap-3 overflow-hidden rounded-[18px] border border-gray-100 dark:border-white/10 bg-gradient-to-br from-white to-gray-50 dark:from-white/[0.05] dark:to-transparent p-3 sm:p-3.5 shadow-sm">
                {(seller.isPro || seller.isVerified) && (
                  <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />
                )}
                <div className="rounded-full p-[2.5px] shrink-0 shadow-md" style={{ background: (seller.isPro || seller.isVerified) ? "conic-gradient(from 210deg,#F7DF8B,#C9991F,#FBE9A8,#B8860B,#F7DF8B)" : "linear-gradient(135deg,#9CA3AF,#D1D5DB)" }}>
                  <div className="rounded-full bg-white p-[2px] dark:bg-[#111722]">
                    <Image src={seller.avatar} alt={seller.name} width={48} height={48} className="h-[44px] w-[44px] rounded-full object-cover" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[0.9rem] font-extrabold text-gray-900 dark:text-white truncate">{seller.name}</span>
                    {seller.isPro && <span className="rounded-md bg-gradient-to-r from-neon-gold to-[#D4891A] px-1.5 py-0.5 text-[0.55rem] font-black uppercase tracking-wide text-dark-900">PRO</span>}
                    {seller.isVerified && <span className="inline-flex items-center gap-0.5 rounded-md bg-green/10 px-1.5 py-0.5 text-[0.58rem] font-bold text-green"><svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>Vérifié</span>}
                  </div>
                  <div className="text-[0.72rem] text-gray-500 dark:text-gray-400 mt-0.5">
                    {seller.memberSince ? `Membre depuis ${seller.memberSince}` : "Nouveau vendeur"} · {seller.activeListings ?? 0} annonce{(seller.activeListings ?? 0) > 1 ? "s" : ""} active{(seller.activeListings ?? 0) > 1 ? "s" : ""}
                  </div>
                </div>
                <Link href={`/boutique/${seller.id}`} className="shrink-0 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#A855F7] px-3.5 py-2 text-[0.75rem] font-bold text-white shadow-md shadow-purple-500/20 transition hover:scale-[1.04]">
                  Boutique →
                </Link>
              </div>
            )}

            <ContactActions title={ad.title} adId={ad.id} sellerId={ad.seller.id} phone={seller?.phone} externalUrl={ad.externalUrl} source={ad.source} orderWhatsapp={ad.orderWhatsapp} />

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
        <Link href={`/dashboard?panel=messages&contact=${ad.seller.id}&listing=${ad.id}`} aria-label="Discuter avec le vendeur" className="relative w-[3.8rem] h-[3.4rem] flex items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] via-[#7C5CFC] to-[#A855F7] text-white shrink-0 shadow-[0_4px_14px_rgba(124,92,252,0.45)] transition active:scale-95">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white"></span>
        </Link>
        <a href={`tel:${(seller?.phone || "+221776827851").replace(/\s/g, "")}`} className="w-[3.8rem] h-[3.4rem] flex flex-col items-center justify-center rounded-xl border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 shrink-0 shadow-sm transition hover:bg-green-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        </a>
        <a
          href={(() => {
            let clean = (seller?.phone || "+221776827851").replace(/[^0-9]/g, "");
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
