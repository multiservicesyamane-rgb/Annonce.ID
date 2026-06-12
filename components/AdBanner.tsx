/**
 * Bannière publicitaire annonceur (section 15). Slot identifié, label "Publicité".
 * En prod : alimentée par la table `ad_banners` (ciblage pays/catégorie, tracking).
 */
export default function AdBanner({
  slot,
  title,
  subtitle,
  label = "Publicité",
  variant = "dark",
}: {
  slot: string;
  title: string;
  subtitle?: string;
  label?: string;
  variant?: "dark" | "green" | "night";
}) {
  const bg =
    variant === "green"
      ? "bg-[linear-gradient(135deg,#1A2231,#2D6A4F)]"
      : variant === "night"
        ? "bg-[linear-gradient(135deg,#1A2231,#0A0E14)]"
        : "bg-grad-hero";

  return (
    <div
      className={`relative flex min-h-[90px] items-center overflow-hidden rounded-lg px-6 py-5 text-white ${bg}`}
      role="complementary"
      aria-label={`Emplacement publicitaire ${slot}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_80%_50%,rgba(245,166,35,.3),transparent_50%)]" />
      <span className="absolute right-2.5 top-1.5 text-[.6rem] uppercase tracking-wide text-white/40">
        {label}
      </span>
      <div className="relative z-10">
        <div className="font-display text-[1.1rem] font-extrabold">{title}</div>
        {subtitle && (
          <div className="mt-0.5 text-[.82rem] text-white/70">
            Zone annonceur {slot} · {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
