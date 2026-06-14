import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { categoryBySlug, CATEGORIES } from "@/lib/constants";
import { listingsByCategory } from "@/lib/data";
import ListingView from "@/components/ListingView";
import AdBanner from "@/components/AdBanner";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = categoryBySlug(params.slug);
  if (!cat) return { title: "Catégorie introuvable" };
  return {
    title: `${cat.name} — Petites annonces`,
    description: `Toutes les annonces ${cat.name} en Afrique de l'Ouest sur Annonce.ID.`,
  };
}

export default function CategoryPage({ params }: Props) {
  const cat = categoryBySlug(params.slug);
  if (!cat) notFound();
  const list = listingsByCategory(cat.slug);

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
