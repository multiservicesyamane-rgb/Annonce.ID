import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getListing, similarListings, GALLERY, LISTINGS } from "@/lib/data";
import Gallery from "@/components/Gallery";
import ContactActions from "@/components/ContactActions";
import AdCard from "@/components/AdCard";
import AdBanner from "@/components/AdBanner";

type Props = { params: { id: string; slug: string } };

// SEO dynamique par annonce (section 18)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ad = getListing(Number(params.id));
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
  return LISTINGS.map((l) => ({ id: String(l.id), slug: l.slug }));
}

export default function AnnoncePage({ params }: Props) {
  const ad = getListing(Number(params.id));
  if (!ad) notFound();

  const images = [ad.image, ...GALLERY.filter((x) => x !== ad.image).slice(0, 4)];
  const similar = similarListings(ad);
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
        <div>
          <Gallery images={images} title={ad.title} />

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
                  <span className="font-semibold text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-lg border-[1.5px] border-gray-100 bg-white p-5">
            <h3 className="mb-3 font-display text-[1.05rem] font-bold">📍 Localisation</h3>
            <div className="flex h-40 items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-gray-300 bg-gray-50 text-[.85rem] text-gray-500">
              🗺 Carte — {ad.location}
            </div>
          </section>
        </div>

        {/* DROITE : panneau contact sticky */}
        <div>
          <div className="flex flex-col gap-3.5 rounded-lg border-[1.5px] border-gray-100 bg-white p-5 lg:sticky lg:top-[calc(64px+1rem)]">
            {ad.premium && (
              <div className="flex items-center gap-1.5 rounded-[10px] bg-grad-gold px-3 py-2 text-[.78rem] font-bold text-dark-900 shadow-glow-gold">
                ✦ PREMIUM · Vendeur Vérifié ✅
              </div>
            )}
            <div>
              <div className="text-[.68rem] font-bold uppercase tracking-wider text-gold-dark">{ad.category}</div>
              <h1 className="mt-1 font-display text-[1.2rem] font-bold leading-snug">{ad.title}</h1>
            </div>
            <div>
              <div className="font-display text-[1.9rem] font-extrabold leading-none text-grad-gold">{ad.price}</div>
              <div className="mt-1 text-[.78rem] text-gray-500">
                {ad.priceType === "negociable" ? "↔ Prix négociable" : ad.priceType === "fixe" ? "Prix fixe" : ad.priceType}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[.78rem] text-gray-500">
              <span>📍 {ad.location}</span>
              <span>📅 {ad.date}</span>
              <span>👁 {(ad.views ?? 0).toLocaleString("fr-FR")} vues</span>
              <span>❤ {ad.favorites ?? 0}</span>
            </div>

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

            <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] p-3 text-[.76rem] text-[#92400e]">
              <b className="mb-1 block">🛡️ Conseils de sécurité</b>
              Ne payez jamais à l&apos;avance. Rencontrez le vendeur dans un lieu public. Vérifiez le produit avant de payer.
            </div>
          </div>

          {/* AD A5 */}
          <div className="mt-4">
            <AdBanner slot="A5" title="Zone annonceur A5" subtitle="300×250 · Page annonce" variant="night" />
          </div>
        </div>
      </div>

      {/* SIMILAIRES */}
      <section className="py-9">
        <h2 className="mb-5 font-display text-[1.25rem] font-bold text-gray-900">Annonces similaires</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {similar.map((s) => (
            <AdCard key={s.id} ad={s} />
          ))}
        </div>
      </section>

      {/* AD A6 */}
      <div className="pb-8">
        <AdBanner slot="A6" title="Zone annonceur A6" subtitle="728×90 · Avant footer" />
      </div>

      {/* Barre contact sticky mobile */}
      <div className="fixed inset-x-0 bottom-0 z-[700] flex gap-2 border-t border-gray-100 bg-white p-2.5 shadow-[0_-4px_16px_rgba(0,0,0,.08)] lg:hidden">
        <a
          href={`https://wa.me/221770000000`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-wa flex-1"
        >
          💬 WhatsApp
        </a>
        <a href="tel:+221770000000" className="btn btn-green flex-1">📞 Appeler</a>
      </div>
    </div>
  );
}
