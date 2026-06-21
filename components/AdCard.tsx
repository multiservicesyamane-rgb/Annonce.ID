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
  const isFeatured = ad.featured;

  let cardStyles = "border border-gray-200/60 dark:border-white/5 bg-white dark:bg-[#111722]/80 shadow-sm dark:shadow-none hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md";
  let titleStyles = "text-gray-900 dark:text-gray-200 group-hover:text-[#6366F1] dark:group-hover:text-green-400";
  let priceStyles = "text-[#6366F1] dark:text-green-400";

  if (isPremium) {
    cardStyles = "border-[1.5px] border-neon-gold/70 shadow-[0_8px_20px_rgba(245,166,35,0.1)] hover:shadow-[0_12px_30px_rgba(245,166,35,0.25)] bg-gradient-to-b from-white to-[#fffbeb] dark:from-[#111722] dark:to-[#1a1710] hover:border-neon-gold";
    titleStyles = "text-gray-900 dark:text-white group-hover:text-neon-gold";
    priceStyles = "text-neon-gold font-black dark:drop-shadow-[0_0_8px_rgba(245,166,35,0.4)]";
  } else if (isFeatured) {
    cardStyles = "border-[1.5px] border-purple-500/60 dark:border-purple-400/50 shadow-[0_8px_20px_rgba(168,85,247,0.1)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.25)] bg-gradient-to-b from-white to-[#faf5ff] dark:from-[#111722] dark:to-[#17101a] hover:border-purple-500";
    titleStyles = "text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400";
    priceStyles = "text-purple-600 dark:text-purple-400 font-black dark:drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]";
  }

  return (
    <Link
      href={`/annonce/${ad.id}/${ad.slug}`}
      className={`group flex flex-col overflow-hidden rounded-[20px] transition-all duration-300 hover:-translate-y-1.5 w-full ${cardStyles}`}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden w-full aspect-square bg-gray-50 dark:bg-black/40">
        <Image
          src={ad.image}
          alt={ad.title}
          width={400}
          height={400}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        
        {/* Subtle top overlay gradient */}
        <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/35 to-transparent pointer-events-none"></div>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 pointer-events-none">
          {isPremium && (
            <span className="bg-gradient-to-r from-neon-gold to-[#D4891A] text-dark-900 text-[0.6rem] md:text-[0.65rem] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
              ★ Premium
            </span>
          )}
          {isFeatured && (
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[0.6rem] md:text-[0.65rem] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md animate-pulse">
              ✦ À la Une
            </span>
          )}
        </div>
        
        {/* Favorite Button */}
        <FavButton 
          adId={ad.id} 
          className="absolute right-2.5 top-2.5 bg-white/95 dark:bg-dark-900/80 backdrop-blur-md p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-red-500 transition-all border border-transparent dark:border-white/10 shadow-sm" 
        />
      </div>

      {/* Info Content Section */}
      <div className="flex flex-1 flex-col gap-1 p-2 md:p-3">
        {/* Category Label */}
        {ad.category && (
          <span className="text-[0.52rem] md:text-[0.6rem] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mb-0.5">
            {ad.category}
          </span>
        )}

        {/* Title */}
        <h3 className={`line-clamp-2 text-[0.72rem] md:text-[0.86rem] font-bold leading-snug transition-colors mb-1 ${titleStyles}`}>
          {ad.title}
        </h3>

        {/* Price */}
        <div className={`font-display text-[0.85rem] md:text-[1.05rem] font-extrabold tracking-tight mt-auto ${priceStyles}`}>
          {ad.price}
        </div>

        {/* Location & Meta info */}
        <div className="mt-1 flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-2 text-[0.58rem] md:text-[0.66rem] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 truncate font-medium">
            <span className={isPremium ? 'text-neon-gold' : isFeatured ? 'text-purple-500' : 'opacity-60'}>📍</span>
            <span className="truncate">{ad.location}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
