import { Metadata } from "next";
import Link from "next/link";
import AdCard from "@/components/AdCard";
import { createClient } from "@supabase/supabase-js";
import { formatNumber } from "@/lib/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Map common SEO slugs to real DB queries
const SEO_MAPPING: Record<string, { category: string, location?: string, title: string, desc: string }> = {
  "immobilier-dakar": { category: "Immobilier", location: "Dakar", title: "Annonces Immobilières à Dakar", desc: "Trouvez les meilleurs appartements, villas et terrains à Dakar." },
  "voitures-senegal": { category: "Véhicules", title: "Voitures d'occasion au Sénégal", desc: "Achetez et vendez des véhicules au meilleur prix partout au Sénégal." },
  "emploi-dakar": { category: "Emploi", location: "Dakar", title: "Offres d'emploi à Dakar", desc: "Découvrez les dernières offres d'emploi et recrutements à Dakar." },
  "electronique-senegal": { category: "Électronique", title: "Électronique & Smartphones au Sénégal", desc: "Téléphones, ordinateurs et accessoires high-tech au Sénégal." }
};

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const seo = SEO_MAPPING[params.slug];
  if (!seo) return { title: "Annonces au Sénégal" };
  return {
    title: `${seo.title} | Annonces.sn`,
    description: seo.desc,
    openGraph: {
      title: seo.title,
      description: seo.desc,
      type: "website",
    },
  };
}

export default async function SeoLandingPage({ params }: Props) {
  const seo = SEO_MAPPING[params.slug];
  
  // Default query if slug is not explicitly mapped (fallback)
  let query = supabase.from('listings').select('*').eq('status', 'active');
  
  if (seo) {
    if (seo.category) query = query.eq('category', seo.category);
    if (seo.location) query = query.ilike('location', `%${seo.location}%`);
  } else {
    // If unknown slug, try to guess category from slug
    const parts = params.slug.split("-");
    query = query.ilike('category', `%${parts[0]}%`);
  }

  const { data } = await query.order('created_at', { ascending: false }).limit(20);

  const listings = (data || []).map((ad: any) => ({
    id: ad.id,
    slug: ad.slug,
    title: ad.title,
    price: ad.price ? `${formatNumber(ad.price)} FCFA` : "Gratuit",
    location: ad.location || "Sénégal",
    image: ad.image || "https://placehold.co/600x400?text=Sans+Image",
    category: ad.category || "Autre",
    premium: ad.premium || false
  }));

  const pageTitle = seo ? seo.title : `Annonces ${params.slug.replace(/-/g, " ")}`;
  const pageDesc = seo ? seo.desc : `Découvrez nos petites annonces gratuites au Sénégal pour : ${params.slug.replace(/-/g, " ")}.`;

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-[.85rem] text-gray-500">
        <Link href="/" className="text-green hover:underline">Accueil</Link> ›{" "}
        <span className="text-gray-900 dark:text-white capitalize">{pageTitle}</span>
      </nav>

      {/* SEO Header */}
      <div className="bg-green/10 dark:bg-green/5 border border-green/20 rounded-2xl p-6 md:p-10 mb-8 text-center">
        <h1 className="font-display text-[2rem] md:text-[2.8rem] font-black text-green dark:text-neon-green mb-4">{pageTitle}</h1>
        <p className="text-gray-700 dark:text-gray-300 text-[1.1rem] max-w-2xl mx-auto">{pageDesc}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {listings.length > 0 ? (
          listings.map((ad: any) => (
            <AdCard key={ad.id} ad={ad} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <span className="text-4xl block mb-2">🔍</span>
            Aucune annonce trouvée pour le moment. Revenez plus tard !
          </div>
        )}
      </div>

      {/* SEO Content Footer (Good for indexing) */}
      <div className="mt-12 bg-gray-50 dark:bg-dark-800 rounded-xl p-8 text-[.9rem] text-gray-600 dark:text-gray-400">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3 text-[1.2rem]">Pourquoi choisir Annonces.sn pour {pageTitle.toLowerCase()} ?</h2>
        <p className="mb-4">
          Annonces.sn est la première plateforme de petites annonces premium au Sénégal. Que vous cherchiez {pageDesc.toLowerCase()} notre système vous met en relation directe avec les vendeurs sans intermédiaire.
        </p>
        <p>
          Mettez en ligne votre propre annonce gratuitement dès aujourd'hui et profitez d'une visibilité inégalée !
        </p>
        <Link href="/publier" className="btn btn-green mt-4 inline-block">Publier une annonce gratuite</Link>
      </div>
    </div>
  );
}
