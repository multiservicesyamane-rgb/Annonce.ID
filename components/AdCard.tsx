import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import FavButton from "./FavButton";
import { colorForCategory } from "@/lib/constants";

function getRelativeTime(dateString?: string) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "À l'instant";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch (e) {
    return "";
  }
}

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
    cardStyles = "border-[1.5px] border-[#FFD24A] ring-1 ring-neon-gold/25 shadow-[0_10px_30px_rgba(245,166,35,0.18)] hover:shadow-[0_18px_46px_rgba(245,166,35,0.38)] bg-gradient-to-br from-[#FFFEF8] via-[#FFF4D6] to-[#FFE7AE] dark:from-[#211a07] dark:via-[#2a2009] dark:to-[#161208] hover:border-[#FFE08A]";
    titleStyles = "text-gray-900 dark:text-white group-hover:text-[#D4891A] dark:group-hover:text-neon-gold";
    priceStyles = "text-transparent bg-clip-text bg-gradient-to-r from-[#D4891A] via-[#F5A623] to-[#FFC93C] font-black dark:drop-shadow-[0_0_8px_rgba(245,166,35,0.4)]";
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
      {/* Image Container — carré, image pleine (cover), badges minimaux */}
      <div className="relative overflow-hidden w-full aspect-square bg-gray-50 dark:bg-black/40">
        <Image
          src={ad.image}
          alt={ad.title}
          width={400}
          height={400}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />

        {/* Badge Premium / À la Une — petit pill glassmorphism en haut gauche, ne gêne pas l'image */}
        {(isPremium || isFeatured) && (
          <span className={`absolute top-2 left-2 inline-flex items-center gap-0.5 rounded-full px-2 py-[2px] text-[0.5rem] md:text-[0.56rem] font-extrabold uppercase tracking-wide backdrop-blur-md shadow-sm pointer-events-none ${isPremium ? 'bg-neon-gold/80 text-dark-900' : 'bg-purple-600/80 text-white'}`}>
            {isPremium ? '★' : '✦'}
          </span>
        )}
        
        {/* Favorite Button — compact, coin haut droit */}
        <FavButton
          adId={ad.id}
          className="absolute right-2 top-2 bg-white/80 dark:bg-dark-900/70 backdrop-blur-md p-1 rounded-full hover:bg-white text-gray-400 hover:text-red-500 transition-all border border-transparent dark:border-white/10 shadow-sm"
        />
      </div>

      {/* Info Content Section — catégorie + titre + prix */}
      <div className="flex flex-1 flex-col gap-0.5 p-2 md:p-2.5">
        {/* Catégorie tag + badge Premium/Une label — placés ici pour ne pas gêner l'image */}
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          {ad.category && (
            <span
              className="inline-block max-w-[70%] truncate rounded px-1.5 py-[1px] text-[0.44rem] md:text-[0.5rem] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: colorForCategory(ad.category) }}
            >
              {ad.category}
            </span>
          )}
          {isPremium && (
            <span className="text-[0.44rem] md:text-[0.5rem] font-extrabold uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#D4891A] to-neon-gold">
              Premium
            </span>
          )}
          {isFeatured && !isPremium && (
            <span className="text-[0.44rem] md:text-[0.5rem] font-extrabold uppercase tracking-wide text-purple-500 dark:text-purple-400">
              À la Une
            </span>
          )}
        </div>

        {/* Titre sur 2 lignes */}
        <h3 className={`line-clamp-2 min-h-[2.1em] text-[0.74rem] md:text-[0.84rem] font-bold leading-snug transition-colors ${titleStyles}`}>
          {ad.title}
        </h3>

        {/* Prix + badge de confiance */}
        <div className="flex items-center justify-between gap-1">
          <div className={`font-display text-[0.88rem] md:text-[1.05rem] font-extrabold tracking-tight ${priceStyles}`}>
            {ad.price}
          </div>
          {(ad.seller?.isVerified || ad.seller?.isPro) && (
            <span className={`shrink-0 inline-flex items-center gap-0.5 rounded border px-1 py-[0.1rem] text-[0.46rem] md:text-[0.5rem] font-bold ${ad.seller?.isVerified ? "border-green-300/50 bg-green-500/10 text-green-600 dark:text-green-400" : "border-blue-300/50 bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              {ad.seller?.isVerified ? "Vérifié" : "Pro"}
            </span>
          )}
        </div>

        {/* Localisation & date (compact) */}
        <div className="mt-0.5 flex items-center justify-between text-[0.56rem] md:text-[0.64rem] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 truncate font-medium">
            <span className={isPremium ? 'text-neon-gold' : isFeatured ? 'text-purple-500' : 'opacity-60'}>📍</span>
            <span className="truncate">{ad.location}</span>
          </span>
          {ad.created_at && (
            <span className="font-medium shrink-0 opacity-80">{getRelativeTime(ad.created_at)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
