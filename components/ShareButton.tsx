"use client";

import { useState } from "react";

/**
 * Partage natif via Web Share API sur mobile,
 * fallback copier-lien + boutons WhatsApp/Facebook sur desktop.
 */
export default function ShareButton({
  title,
  url,
  className = "",
}: {
  title: string;
  url?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  async function handleShare() {
    // Essayer Web Share API en premier (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // L'utilisateur a annulé ou erreur — fallback
      }
    }
    // Desktop : afficher le menu
    setMenuOpen((v) => !v);
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => { setCopied(false); setMenuOpen(false); }, 1500);
  }

  const waLink = `https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`;
  const fbLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-[10px] border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-[.82rem] font-semibold text-gray-700 dark:text-white/70 hover:border-gold hover:text-gold transition-colors"
        aria-label="Partager"
      >
        🔗 Partager
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[220px] rounded-xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-2 shadow-lg animate-fadeUp">
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[.83rem] text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-dark-700 transition"
          >
            {copied ? "✅ Lien copié !" : "📋 Copier le lien"}
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[.83rem] text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-dark-700 transition"
          >
            💬 WhatsApp
          </a>
          <a
            href={fbLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[.83rem] text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-dark-700 transition"
          >
            📘 Facebook
          </a>
        </div>
      )}
    </div>
  );
}
