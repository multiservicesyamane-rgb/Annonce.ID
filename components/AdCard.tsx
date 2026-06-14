import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import FavButton from "./FavButton";

/**
 * Carte annonce réutilisable. Image format Paysage (4:3) pour une vue plus large et professionnelle.
 */
export default function AdCard({ ad }: { ad: Listing }) {
  return (
    <Link
      href={`/annonce/${ad.id}/${ad.slug}`}
      className={`group flex flex-col overflow-hidden rounded-[16px] bg-white transition-all duration-300 hover:-translate-y-1 ${
        ad.premium
          ? "border-[1.5px] border-gold bg-gradient-to-b from-[#fffaeb] to-white shadow-[0_8px_20px_rgba(212,175,55,0.15)] hover:shadow-[0_12px_25px_rgba(212,175,55,0.25)]"
          : "border border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-lg"
      }`}
    >
      <div className="relative overflow-hidden w-full aspect-[4/3] bg-gray-100">
        <Image
          src={ad.image}
          alt={ad.title}
          width={300}
          height={225}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        {/* Subtle overlay on hover to make text/buttons pop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Favorite Button */}
        <FavButton adId={ad.id} className="absolute right-3 top-3 bg-white/90 backdrop-blur-md p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-red-500 shadow-sm transition-all" />
        
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {ad.premium && (
            <span className="bg-gradient-to-r from-gold to-[#F3E5AB] text-dark-900 text-[.65rem] font-extrabold px-3 py-1 rounded-full shadow-md uppercase tracking-wider border border-gold/50">
              ✦ Premium
            </span>
          )}
          {ad.featured && !ad.premium && (
            <span className="bg-dark-900/80 backdrop-blur-md text-gold text-[.65rem] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider border border-white/10">
              À la Une
            </span>
          )}
        </div>
        
        {/* Image count or tags can go bottom-left if needed */}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[.6rem] font-bold uppercase tracking-wide text-gray-500">
            {ad.category}
          </span>
          <span className="shrink-0 text-[.6rem] font-medium text-gray-400">{ad.date}</span>
        </div>
        
        <h3 className="line-clamp-2 flex-1 text-[.85rem] font-bold leading-snug text-gray-900 group-hover:text-green transition-colors">
          {ad.title}
        </h3>
        
        <div
          className={`mt-2 font-display text-[1rem] font-extrabold tracking-tight ${
            ad.premium ? "text-gold-dark" : "text-gray-900"
          }`}
        >
          {ad.price} FCFA
        </div>
        
        <div className="mt-2.5 flex items-center justify-between border-t border-gray-100 pt-2.5">
          <div className="flex items-center gap-1.5 text-[.7rem] text-gray-500 font-medium">
            <span className="text-[.8rem] opacity-70">📍</span>
            <span className="truncate">{ad.location}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
