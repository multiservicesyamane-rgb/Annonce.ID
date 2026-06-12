import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

/** Bande horizontale de catégories sous le header. */
export default function CategoryStrip({ active }: { active?: string }) {
  return (
    <div className="no-scrollbar overflow-x-auto border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-[1320px] gap-1.5 whitespace-nowrap px-4 py-2.5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/categorie/${c.slug}`}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-[20px] border-[1.5px] px-3.5 py-1.5 text-[.8rem] font-medium transition ${
              active === c.slug
                ? "border-gold bg-gold-pale text-green"
                : "border-transparent bg-gray-50 text-gray-700 hover:border-gold hover:bg-gold-pale hover:text-green"
            }`}
          >
            {c.icon} {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
