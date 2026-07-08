import { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/lib/blogData";

export const metadata: Metadata = {
  title: "Blog & Guides | Wanteermako",
  description:
    "Guides pratiques pour acheter et vendre au Sénégal : conseils de vente, sécurité anti-arnaque, immobilier à Dakar, voitures d'occasion et plus.",
};

// Contenu ORIGINAL statique : revalidation quotidienne suffit.
export const revalidate = 86400;

export default function BlogIndexPage() {
  const [featured, ...rest] = ARTICLES;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 pb-20">
      <div className="mb-10 text-center">
        <h1 className="font-display text-[2.5rem] font-black text-gray-900 dark:text-white mb-3">
          Blog & Guides Wanteermako
        </h1>
        <p className="text-gray-500 text-[1.1rem] max-w-2xl mx-auto">
          Nos conseils pour acheter et vendre en toute sécurité au Sénégal :
          bonnes pratiques de vente, pièges à éviter, immobilier, véhicules et high-tech.
        </p>
      </div>

      {/* Article vedette (le plus récent) */}
      {featured && (
        <Link
          href={`/blog/${featured.slug}`}
          className="group mb-12 grid gap-6 md:grid-cols-2 items-center bg-white dark:bg-dark-800 rounded-2xl border-[1.5px] border-gray-100 dark:border-dark-border overflow-hidden hover:shadow-xl transition-all duration-300"
        >
          <div className="aspect-video md:aspect-[4/3] overflow-hidden">
            <img
              src={featured.image}
              alt={featured.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="p-6 md:p-8">
            <span className="text-green uppercase tracking-wider bg-green/10 px-2 py-1 rounded text-[.75rem] font-bold">
              {featured.category}
            </span>
            <h2 className="font-display text-[1.6rem] md:text-[2rem] font-black leading-tight my-3 text-gray-900 dark:text-white group-hover:text-green transition-colors">
              {featured.title}
            </h2>
            <p className="text-gray-500 text-[.95rem] mb-4 line-clamp-3">{featured.excerpt}</p>
            <span className="text-[.85rem] font-bold text-dark-900 dark:text-white group-hover:text-green transition-colors">
              Lire le guide →
            </span>
          </div>
        </Link>
      )}

      {/* Grille des autres articles */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group flex flex-col bg-white dark:bg-dark-800 rounded-2xl border-[1.5px] border-gray-100 dark:border-dark-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-3 text-[.75rem] font-bold">
                <span className="text-green uppercase tracking-wider bg-green/10 px-2 py-1 rounded">
                  {article.category}
                </span>
                <span className="text-gray-400 dark:text-gray-500">{article.date}</span>
              </div>

              <h2 className="font-display text-[1.1rem] font-bold leading-snug mb-3 text-gray-900 dark:text-white group-hover:text-green transition-colors line-clamp-2">
                {article.title}
              </h2>

              <p className="text-gray-500 text-[.9rem] mb-4 line-clamp-3 flex-1">{article.excerpt}</p>

              <div className="flex items-center text-[.8rem] text-dark-900 dark:text-white mt-auto border-t border-gray-50 dark:border-dark-border pt-4 font-bold group-hover:text-green transition-colors">
                Lire le guide
                <svg
                  className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
