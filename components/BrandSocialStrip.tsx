"use client";

/**
 * Bande « Suivez Wanteermako » : réseaux sociaux de la marque (dashboard).
 */
const SOCIALS = [
  { k: "Telegram", icon: "✈️", c: "#229ED9", href: "https://t.me/wanteermako" },
  { k: "Facebook", icon: "📘", c: "#1877F2", href: "https://www.facebook.com/wanteermako" },
  { k: "WhatsApp", icon: "💬", c: "#25D366", href: "https://wa.me/?text=" + encodeURIComponent("Découvrez Wanteermako : https://wanteermako.com") },
];

export default function BrandSocialStrip() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-800 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[1.2rem]">📱</span>
        <h3 className="font-display text-[.98rem] font-extrabold text-gray-900 dark:text-white">Suivez Wanteermako</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {SOCIALS.map((s) => (
          <a key={s.k} href={s.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[.8rem] font-bold text-white shadow-sm transition hover:opacity-90" style={{ background: s.c }}>
            <span>{s.icon}</span> {s.k}
          </a>
        ))}
      </div>
      <p className="mt-2 text-[.72rem] text-gray-500 dark:text-white/50">Restez informé des nouveautés et bons plans 🎁</p>
    </div>
  );
}
