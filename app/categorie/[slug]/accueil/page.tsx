import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryHomeSections from "@/components/CategoryHomeSections";
import { categoryBySlug, CATEGORIES } from "@/lib/constants";

type Props = { params: { slug: string } };

export const revalidate = 60;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = categoryBySlug(params.slug);
  if (!cat) return { title: "Catégorie introuvable" };
  return {
    title: `${cat.name} — Accueil catégorie`,
    description: `Les annonces à la Une, Premium VIP et récentes pour ${cat.name} sur Wanteermako.`,
  };
}

export default async function CategoryHomePage({ params }: Props) {
  const cat = categoryBySlug(params.slug);
  if (!cat) notFound();

  return <CategoryHomeSections category={cat} />;
}
