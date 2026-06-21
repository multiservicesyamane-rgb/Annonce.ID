import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

// Catalogue des catégories — UNE seule ligne horizontale (scroll), grandes tuiles.
export default function CategoryCatalogue() {
  return (
    <section className="wrap py-3">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="font-display text-[1.05rem] md:text-[1.35rem] font-extrabold text-gray-900 dark:text-white">
          Nos <span className="text-[#6366F1]">catégories</span>
        </h2>
        <Link href="/recherche" className="shrink-0 text-[.8rem] font-semibold text-[#6366F1] hover:underline">Tout voir →</Link>
      </div>

      {/* Une ligne, défilement horizontal — tuiles compactes */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/categorie/${c.slug}`}
            className="group flex w-[78px] shrink-0 flex-col items-center gap-1.5 rounded-[14px] border border-gray-100 dark:border-white/10 bg-white dark:bg-[#111722]/80 p-2 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#6366F1]/50 hover:shadow-md sm:w-[90px]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1]/12 via-[#A855F7]/10 to-[#FFC93C]/10 text-[1.4rem] transition-transform group-hover:scale-110 sm:h-12 sm:w-12 sm:text-[1.6rem]">
              {c.icon}
            </div>
            <h3 className="line-clamp-2 text-[.64rem] font-bold leading-tight text-gray-700 dark:text-white group-hover:text-[#6366F1] sm:text-[.7rem]">
              {c.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
