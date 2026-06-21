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
    <div className="my-3 flex flex-wrap items-center gap-2 rounded-xl border border-green-200 dark:border-green-500/20 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/15 dark:to-emerald-900/10 px-3 py-2.5">
      <span className="text-[.84rem] font-bold text-green-700 dark:text-green-400">🎉 Publiée ! Partagez :</span>
      {links.map((l) => (
        <a key={l.k} href={l.href} target="_blank" rel="noopener noreferrer"
          className="rounded-lg px-2.5 py-1 text-[.72rem] font-bold text-white transition hover:opacity-90" style={{ background: l.c }}>
          {l.k}
        </a>
      ))}
      <button onClick={copy} className="rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-2.5 py-1 text-[.72rem] font-bold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10">
        {copied ? "✓ Copié" : "🔗 Lien"}
      </button>
    </div>
  );
}
