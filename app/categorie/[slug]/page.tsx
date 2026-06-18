import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { categoryBySlug, CATEGORIES } from "@/lib/constants";
import ListingView from "@/components/ListingView";
import AdBanner from "@/components/AdBanner";
import { createClient } from "@supabase/supabase-js";
import { formatNumber } from "@/lib/utils";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = categoryBySlug(params.slug);
  if (!cat) return { title: "Catégorie introuvable" };
  return {
    title: `${cat.name} — Petites annonces`,
    description: `Toutes les annonces ${cat.name} en Afrique de l'Ouest sur Wanteermako.`,
  };
}

// Since it's dynamic data now, we probably want to revalidate occasionally
export const revalidate = 60;

export default async function CategoryPage({ params }: Props) {
  const cat = categoryBySlug(params.slug);
  if (!cat) notFound();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch real listings from Supabase based on category
  const { data: dbListings } = await supabase
    .from('listings')
    .select('id, slug, title, price, price_type, location, image, category, views, premium, profiles(role)')
    .eq('status', 'active')
    .eq('category_slug', cat.slug)
    .order('created_at', { ascending: false })
    .limit(60);

  // Map to the format ListingView expects
  const list = (dbListings || []).map((ad: any) => ({
    id: ad.id,
    slug: ad.slug,
    title: ad.title,
    price: ad.price_type === "Sur devis" ? "Sur devis" : (ad.price && ad.price !== "0" ? `${formatNumber(ad.price)} FCFA` : "Gratuit"),
    location: ad.location || "Sénégal",
    image: ad.image || "https://placehold.co/600x400?text=Sans+Image",
    category: ad.category || "Autre",
    views: ad.views ?? 0,
    premium: ad.premium || false,
    specs: ad.specs || {},
    seller: {
      isPro: ad.profiles?.role === 'pro'
    }
  } as any));

  return (
    <>
      <div className="wrap pt-3.5">
        <nav className="text-[.78rem] text-gray-500">
          <Link href="/" className="text-green hover:text-gold-dark">Accueil</Link> › <b className="text-gray-700">{cat.name}</b>
        </nav>
        {/* AD A9 — catégorie sponsor */}
        <div className="mt-3">
          <AdBanner slot="A9" title={`${cat.icon} ${cat.name}`} subtitle="Bannière en tête de catégorie" />
        </div>
      </div>
      <Suspense fallback={<div className="wrap py-10 text-center">Chargement des annonces...</div>}>
        <ListingView initial={list} title={`${cat.icon} ${cat.name}`} subtitle={`${cat.subs.join(" · ")}`} />
      </Suspense>
    </>
  );
}
