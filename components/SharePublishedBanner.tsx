"use client";

import { useEffect, useState } from "react";

/**
 * Bandeau affiché après publication d'une annonce (?published=1) :
 * félicite le vendeur et propose de partager sur ses réseaux pour vendre + vite.
 */
export default function SharePublishedBanner({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("published") !== "1") return;
    const u = new URL(window.location.href);
    u.searchParams.delete("published");
    setUrl(u.toString());
    setShow(true);
    // nettoie l'URL (sans recharger) pour ne pas réafficher au refresh
    window.history.replaceState({}, "", u.toString());
  }, []);

  if (!show) return null;

  const enc = encodeURIComponent;
  const text = `${title} — à voir sur Wanteermako`;
  const links = [
    { k: "WhatsApp", c: "#25D366", href: `https://wa.me/?text=${enc(text + " " + url)}` },
    { k: "Facebook", c: "#1877F2", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { k: "Telegram", c: "#229ED9", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { k: "X", c: "#111", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
  ];

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  }

  return (
    <div className="my-4 rounded-2xl border border-green-200 dark:border-green-500/20 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/15 dark:to-emerald-900/10 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="text-[1.4rem]">🎉</span>
        <div>
          <h2 className="font-display text-[1rem] sm:text-[1.15rem] font-extrabold text-gray-900 dark:text-white">Annonce publiée !</h2>
          <p className="text-[.8rem] text-gray-600 dark:text-white/70">Partagez-la maintenant pour vendre plus vite 🚀</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <a key={l.k} href={l.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[.8rem] font-bold text-white shadow-sm transition hover:opacity-90"
            style={{ background: l.c }}>
            {l.k}
          </a>
        ))}
        <button onClick={copy} className="flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-3.5 py-2 text-[.8rem] font-bold text-gray-800 dark:text-white transition hover:bg-gray-50 dark:hover:bg-white/10">
          {copied ? "✓ Lien copié" : "🔗 Copier le lien"}
        </button>
      </div>
      <p className="mt-2 text-[.68rem] text-gray-500 dark:text-white/50">Pour Instagram : copiez le lien et collez-le dans votre story ou bio.</p>
    </div>
  );
}
