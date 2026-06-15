"use client";

import { useState } from "react";

/** Boutons de contact direct (WhatsApp / Appel / Message) + partage/favori/signaler.
 *  PAS de panier — mise en relation directe (contrainte du brief). */
export default function ContactActions({ phone = "+221770000000", title }: { phone?: string; title: string }) {
  const [toast, setToast] = useState<string | null>(null);
  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };
  const wa = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour, votre annonce "${title}" est-elle toujours disponible ?`)}`;

  return (
    <>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={() => show("🛒 Redirection vers l'achat (Bientôt disponible)")} className="btn btn-gold w-full py-4 text-[1.1rem] font-extrabold shadow-lg hover:shadow-xl transition-all">
          🛒 Acheter maintenant
        </button>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-wa w-full py-3.5 text-[1.05rem] font-bold">
          💬 Discuter sur WhatsApp
        </a>
        <a href={`tel:${phone.replace(/\s/g, "")}`} className="btn btn-green w-full py-3.5 text-[1.05rem] font-bold">
          📞 Appeler le vendeur
        </a>
        <button type="button" onClick={() => show("✉ Messagerie interne (Bientôt disponible)")} className="btn w-full py-3.5 text-[1.05rem] font-bold border-2 border-gray-200 text-gray-700 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
          ✉ Discuter sur la plateforme
        </button>
      </div>

      <div className="flex gap-1.5">
        {[
          { ic: "🔗 Partager", msg: "🔗 Lien copié" },
          { ic: "♡ Favoris", msg: "❤ Ajouté aux favoris" },
          { ic: "🚩 Signaler", msg: "🚩 Annonce signalée" },
        ].map((b) => (
          <button
            key={b.ic}
            type="button"
            onClick={() => {
              if (b.ic.includes("Partager") && typeof navigator !== "undefined" && navigator.share) {
                navigator.share({ title, url: window.location.href }).catch(() => {});
              } else if (b.ic.includes("Partager")) {
                navigator.clipboard?.writeText(window.location.href);
              }
              show(b.msg);
            }}
            className="flex-1 rounded-lg border-[1.5px] border-gray-100 bg-white py-2 text-[.74rem] font-semibold text-gray-700 transition hover:border-gold hover:text-green"
          >
            {b.ic}
          </button>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-neon-gold bg-dark-900 px-5 py-2.5 text-[.88rem] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
