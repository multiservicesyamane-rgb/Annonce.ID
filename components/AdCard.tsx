import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import FavButton from "./FavButton";

/**
 * Carte annonce réutilisable (section 8.2). Image carré 1:1 (style Jumia).
 * Mène vers la PAGE annonce plein écran /annonce/[id]/[slug] (jamais une modale).
 */
export default function AdCard({ ad }: { ad: Listing }) {
  return (
    <Link
      href={`/annonce/${ad.id}/${ad.slug}`}
      className={`group flex flex-col overflow-hidden rounded-lg border-[1.5px] bg-white transition hover:-translate-y-[3px] hover:border-gold hover:shadow-md ${
        ad.premium
          ? "border-transparent [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(135deg,#F5A623,#FFD166,#F5A623)_border-box]"
          : "border-gray-100"
      }`}
    >
      <div className="relative overflow-hidden">
        <Image
          src={ad.image}
          alt={ad.title}
          width={400}
          height={400}
          className="card-img-sq transition duration-500 group-hover:scale-105"
        />
        <FavButton className="absolute right-2 top-2" />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {ad.premium && <span className="badge b-prem">✦</span>}
          {ad.featured && <span className="badge b-une">UNE</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <div className="text-[.66rem] font-bold uppercase tracking-wider text-gold-dark">
          {ad.category}
        </div>
        <div className="line-clamp-2 flex-1 text-[.88rem] font-semibold leading-snug text-gray-900">
          {ad.title}
        </div>
        <div
          className={`mt-auto font-display text-base font-bold ${
            ad.premium ? "text-grad-gold" : "text-green"
          }`}
        >
          {ad.price}
        </div>
        <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5">
          <span className="truncate text-[.7rem] text-gray-500">📍 {ad.location}</span>
          <span className="shrink-0 text-[.68rem] text-gray-300">{ad.date}</span>
        </div>
      </div>
    </Link>
  );
}
