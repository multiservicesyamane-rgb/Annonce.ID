/**
 * Skeleton loader pour les cartes annonce.
 * Pulse animé avec les mêmes dimensions que AdCard (aspect 4:3, titre, prix, location).
 */
export default function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[16px] border border-gray-100 bg-white dark:bg-dark-800 dark:border-dark-border">
      {/* Image placeholder */}
      <div className="w-full aspect-[4/3] animate-skeletonPulse bg-gray-100 dark:bg-dark-700" />
      <div className="p-4 flex flex-col gap-3">
        {/* Category + date */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 rounded-md animate-skeletonPulse bg-gray-100 dark:bg-dark-700" />
          <div className="h-3 w-10 rounded-md animate-skeletonPulse bg-gray-100 dark:bg-dark-700" />
        </div>
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-full rounded-md animate-skeletonPulse bg-gray-100 dark:bg-dark-700" />
          <div className="h-4 w-3/4 rounded-md animate-skeletonPulse bg-gray-100 dark:bg-dark-700" />
        </div>
        {/* Price */}
        <div className="h-5 w-28 rounded-md animate-skeletonPulse bg-gray-100 dark:bg-dark-700" />
        {/* Location */}
        <div className="border-t border-gray-100 dark:border-dark-border pt-3">
          <div className="h-3.5 w-24 rounded-md animate-skeletonPulse bg-gray-100 dark:bg-dark-700" />
        </div>
      </div>
    </div>
  );
}

/** Grid de skeleton cards — pour les pages listing */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
