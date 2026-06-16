import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import FavButton from "./FavButton";

/**
 * Carte annonce : Image parfaitement claire en haut, texte en bas.
 * Design premium distinct pour les annonces "À la Une".
 */
export default function AdCard({ ad }: { ad: Listing }) {
  const isPremium = ad.premium;

  return (
    <Link
      href={`/annonce/${ad.id}/${ad.slug}`}
      className={`group flex flex-col overflow-hidden rounded-[16px] transition-all duration-300 hover:-translate-y-1 w-full ${
        isPremium
          ? "border-[1.5px] border-neon-gold shadow-[0_8px_20px_rgba(245,166,35,0.15)] hover:shadow-[0_12px_25px_rgba(245,166,35,0.3)] bg-gradient-to-b from-white to-[#fffbeb] dark:from-[#111722] dark:to-[#1a1710]"
          : "border border-gray-100 dark:border-white/5 bg-white dark:bg-[#111722]/80 shadow-sm dark:shadow-none hover:border-gray-300 dark:hover:border-white/20 hover:shadow-lg"
      }`}
    >
      {/* Image Container - Aspect ratio dynamique : Carré pour Premium, Standard pour les autres */}
      <div className={`relative overflow-hidden w-full ${isPremium ? 'aspect-square' : 'aspect-[4/3]'} bg-gray-100 dark:bg-black/50`}>
        <Image
          src={ad.image}
          alt={ad.title}
          width={400}
          height={isPremium ? 400 : 300}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        
        {/* Uniquement un très léger dégradé en haut pour lire les badges si la photo est blanche, pas de flou sur l'image */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none"></div>

        {/* Badges Haut */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {isPremium && (
            <span className="bg-gradient-to-r from-neon-gold to-[#D4891A] text-dark-900 text-[.6rem] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-[0_2px_10px_rgba(245,166,35,0.5)]">
              ★ Premium
            </span>
          )}
          {!isPremium && ad.featured && (
            <span className="bg-black/60 backdrop-blur-md text-white text-[.6rem] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/20">
              En vue
            </span>
          )}
        </div>
        
        {/* Favorite Button */}
        <FavButton adId={ad.id} className="absolute right-2 top-2 bg-white/90 dark:bg-black/60 backdrop-blur-md p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-red-500 transition-all border border-transparent dark:border-white/10" />
      </div>

      {/* Zone Texte en bas - Padding réduit pour maximiser l'image */}
      <div className="flex flex-1 flex-col p-2">
        {/* Catégorie & Date */}
        <div className="flex items-center justify-between mb-1">
          <span className={`rounded-md px-1.5 py-0.5 text-[.55rem] font-bold uppercase tracking-wide ${isPremium ? 'bg-neon-gold/10 text-neon-gold dark:text-[#ffca58]' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
            {ad.category}
          </span>
          <span className="shrink-0 text-[.55rem] font-medium text-gray-400 dark:text-gray-500">{ad.date}</span>
        </div>
        
        {/* Titre */}
        <h3 className={`line-clamp-2 flex-1 text-[.75rem] md:text-[.85rem] font-bold leading-snug transition-colors ${isPremium ? 'text-gray-900 dark:text-white group-hover:text-neon-gold' : 'text-gray-900 dark:text-gray-200 group-hover:text-green-500 dark:group-hover:text-green-400'}`}>
          {ad.title}
        </h3>
        
        {/* Prix */}
        <div
          className={`mt-1.5 font-display text-[.9rem] md:text-[1.05rem] font-extrabold tracking-tight ${
            isPremium ? "text-neon-gold dark:drop-shadow-[0_0_5px_rgba(245,166,35,0.5)]" : "text-green dark:text-green-400"
          }`}
        >
          {ad.price} FCFA
        </div>
        
        {/* Localisation & Vues */}
        <div className="mt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/10 pt-2">
          <div className="flex items-center gap-1.5 text-[.65rem] text-gray-500 dark:text-gray-400 font-medium">
            <span className={`text-[.75rem] ${isPremium ? 'text-neon-gold' : 'opacity-70'}`}>📍</span>
            <span className="truncate">{ad.location}</span>
          </div>
          <div className="flex items-center gap-1 text-[.6rem] text-gray-400 font-bold">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>{ad.views || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
