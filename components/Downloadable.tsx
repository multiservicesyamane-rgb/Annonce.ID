"use client";

import { useRef, useState } from "react";

/**
 * Enveloppe une affiche/visuel et ajoute un bouton « ⬇ PNG » qui exporte
 * UNIQUEMENT le contenu (le bouton est hors de la zone capturée) en image HD.
 */
export default function Downloadable({ filename, label = "PNG", children }: { filename: string; label?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(ref.current, { pixelRatio: 2.5, cacheBust: true });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.png`;
      a.click();
    } catch (e) {
      console.error("Export PNG échoué:", e);
      alert("Téléchargement impossible. Réessayez ou faites une capture d'écran.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="group/dl relative">
      <div ref={ref}>{children}</div>
      <button
        onClick={download}
        disabled={busy}
        className="absolute bottom-3 right-3 z-50 rounded-lg bg-black/70 px-3 py-1.5 text-[.72rem] font-bold text-white opacity-0 backdrop-blur transition hover:bg-black/90 group-hover/dl:opacity-100 disabled:opacity-60"
      >
        {busy ? "⏳…" : `⬇ ${label}`}
      </button>
    </div>
  );
}
