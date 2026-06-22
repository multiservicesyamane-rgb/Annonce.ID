"use client";

/**
 * Bande « Suivez Wanteermako » : réseaux sociaux de la marque (dashboard).
 */
const SOCIALS = [
  { k: "Chaîne WhatsApp", icon: "💬", c: "#25D366", href: "https://whatsapp.com/channel/0029Vb7qR3c6RGJAcYWa8L1I" },
  { k: "Telegram", icon: "✈️", c: "#229ED9", href: "https://t.me/wanteermako" },
  { k: "Facebook", icon: "📘", c: "#1877F2", href: "https://www.facebook.com/wanteermako" },
];

export default function BrandSocialStrip() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-800 px-3 py-2">
      <span className="text-[.78rem] font-bold text-gray-700 dark:text-white/80">📱 Suivez-nous :</span>
      {SOCIALS.map((s) => (
        <a key={s.k} href={s.href} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[.72rem] font-bold text-white transition hover:opacity-90" style={{ background: s.c }}>
          <span>{s.icon}</span> {s.k}
        </a>
      ))}
    </div>
  );
}
