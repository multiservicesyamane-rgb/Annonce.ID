/**
 * Bannière publicitaire annonceur. Design premium avec bouton "Call to Action".
 */
export default function AdBanner({
  slot,
  title,
  subtitle,
  label = "Sponsorisé",
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
      ? "bg-gradient-to-br from-green-700 via-green-600 to-emerald-800"
      : variant === "night"
        ? "bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617]"
        : "bg-gradient-to-r from-gray-900 via-gray-800 to-black";

  return (
    <div
      className={`group relative flex min-h-[110px] w-full flex-col sm:flex-row items-start sm:items-center justify-between overflow-hidden rounded-[16px] px-6 py-6 sm:px-10 text-white shadow-xl transition-all hover:shadow-2xl ${bg}`}
      role="complementary"
      aria-label={`Emplacement publicitaire ${slot}`}
    >
      {/* Decorative Background Elements */}
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl"></div>
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-gold/20 blur-2xl"></div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

      {/* Ad Tag */}
      <span className="absolute left-0 top-0 rounded-br-lg bg-black/40 px-3 py-1 text-[.65rem] font-bold uppercase tracking-widest text-white/80 backdrop-blur-md">
        {label}
      </span>

      <div className="relative z-10 max-w-[70%] mt-3 sm:mt-0">
        <div className="font-display text-[1.4rem] font-extrabold tracking-tight sm:text-[1.6rem] leading-tight">
          {title}
        </div>
        {subtitle && (
          <div className="mt-1.5 text-[.85rem] font-medium text-white/80">
            {subtitle}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-5 sm:mt-0 shrink-0">
        <button className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[.85rem] font-bold text-gray-900 shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)]">
          Découvrir <span className="text-[1.1rem]">→</span>
        </button>
      </div>
    </div>
  );
}
