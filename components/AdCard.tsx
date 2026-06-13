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
      className={`group flex flex-col overflow-hidden rounded-[14px] bg-white transition-all duration-300 hover:-translate-y-[4px] hover:shadow-xl ${
        ad.premium
          ? "border-2 border-[#D4AF37] shadow-[0_4px_15px_rgba(212,175,55,0.1)]"
          : "border border-gray-200 hover:border-blue-400"
      }`}
    >
      <div className="relative overflow-hidden w-full aspect-square">
        <Image
          src={ad.image}
          alt={ad.title}
          width={400}
          height={400}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <FavButton className="absolute right-3 top-3 bg-white/80 backdrop-blur-sm p-1.5 rounded-full hover:bg-white text-gray-700 hover:text-red-500 transition" />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {ad.premium && <span className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">✦ Premium</span>}
          {ad.featured && <span className="bg-[#855F19] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">À la Une</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 bg-white">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[.65rem] font-bold uppercase tracking-widest text-gray-400">
            {ad.category}
          </div>
          <span className="shrink-0 text-[.65rem] text-gray-300">{ad.date}</span>
        </div>
        <div className="line-clamp-2 flex-1 text-[.9rem] font-bold leading-tight text-[#1A1A1A] group-hover:text-blue-600 transition-colors">
          {ad.title}
        </div>
        <div
          className={`mt-3 font-display text-[1.1rem] font-extrabold tracking-tight ${
            ad.premium ? "text-[#D4AF37]" : "text-[#1A1A1A]"
          }`}
        >
          {ad.price}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5 text-[.75rem] text-gray-500 font-medium">
            <span className="text-[.9rem]">📍</span>
            <span className="truncate">{ad.location}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
