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
      {/* Image Container - Carré uniforme (galerie) pour maximiser la taille de l'image */}
      <div className="relative overflow-hidden w-full aspect-square bg-gray-100 dark:bg-black/50">
        <Image
          src={ad.image}
          alt={ad.title}
          width={400}
          height={400}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
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

      {/* Zone Texte compacte - on maximise l'image, on minimise l'espace vide */}
      <div className="flex flex-1 flex-col gap-0.5 p-1.5">
        {/* Titre */}
        <h3 className={`line-clamp-1 text-[.72rem] md:text-[.8rem] font-bold leading-snug transition-colors ${isPremium ? 'text-gray-900 dark:text-white group-hover:text-neon-gold' : 'text-gray-900 dark:text-gray-200 group-hover:text-green-500 dark:group-hover:text-green-400'}`}>
          {ad.title}
        </h3>

        {/* Prix */}
        <div
          className={`font-display text-[.85rem] md:text-[.95rem] font-extrabold tracking-tight ${
            isPremium ? "text-neon-gold dark:drop-shadow-[0_0_5px_rgba(245,166,35,0.5)]" : "text-green dark:text-green-400"
          }`}
        >
          {ad.price} FCFA
        </div>

        {/* Localisation & Vues */}
        <div className="mt-auto flex items-center justify-between pt-0.5 text-[.6rem] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 truncate font-medium">
            <span className={isPremium ? 'text-neon-gold' : 'opacity-70'}>📍</span>
            <span className="truncate">{ad.location}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 font-bold text-gray-400">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            {ad.views || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
