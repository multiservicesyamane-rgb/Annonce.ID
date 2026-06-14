import Link from "next/link";

/**
 * Composant réutilisable d'état vide avec emoji, titre, description et CTA optionnel.
 * Utilisé dans : recherche 0 résultats, favoris vides, messages vides, etc.
 */
export default function EmptyState({
  emoji = "📭",
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
}: {
  emoji?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed border-gray-200 dark:border-dark-border bg-white dark:bg-dark-800 py-16 px-6 text-center animate-fadeUp">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-dark-700 text-[2.2rem]">
        {emoji}
      </div>
      <h3 className="font-display text-[1.1rem] font-bold text-gray-800 dark:text-white mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-[.85rem] text-gray-500 dark:text-white/50 max-w-[320px] mb-4">
          {description}
        </p>
      )}
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="btn btn-green shadow-lg">
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && onCtaClick && !ctaHref && (
        <button onClick={onCtaClick} className="btn btn-green shadow-lg">
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
