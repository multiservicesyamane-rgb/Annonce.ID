"use client";

import { useState } from "react";

const REASONS = [
  "Annonce frauduleuse / arnaque",
  "Produit interdit ou illégal",
  "Fausses informations / prix trompeur",
  "Contenu choquant ou inapproprié",
  "Doublon / spam",
  "Autre",
];

export default function ReportListing({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason) return;
    setBusy(true);
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, reason, details, contact }),
      });
      setDone(true);
    } catch { setDone(true); }
    finally { setBusy(false); }
  }

  return (
    <>
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-[.82rem] font-semibold text-gray-500 hover:text-brand-red transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          Signaler cette annonce
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full sm:max-w-[440px] bg-white dark:bg-dark-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green/10 text-[1.8rem]">✓</div>
                <h3 className="font-bold text-lg dark:text-white mb-1">Signalement envoyé</h3>
                <p className="text-sm text-gray-500 mb-5">Merci. Notre équipe va examiner cette annonce.</p>
                <button onClick={() => { setOpen(false); setDone(false); setReason(""); setDetails(""); setContact(""); }} className="btn btn-green w-full">Fermer</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-extrabold text-lg dark:text-white">🚩 Signaler l'annonce</h3>
                  <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
                </div>
                <label className="block text-[.8rem] font-bold text-gray-600 dark:text-gray-300 mb-1">Motif</label>
                <div className="space-y-1.5 mb-4">
                  {REASONS.map((r) => (
                    <label key={r} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[.85rem] cursor-pointer ${reason === r ? "border-green bg-green/5 dark:text-white" : "border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300"}`}>
                      <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-green" />
                      {r}
                    </label>
                  ))}
                </div>
                <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Détails (facultatif)" rows={3} className="w-full mb-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-sm outline-none focus:border-green resize-none" />
                <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Votre email/téléphone (facultatif)" className="w-full mb-4 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-sm outline-none focus:border-green" />
                <button onClick={submit} disabled={!reason || busy} className="btn btn-green w-full disabled:opacity-60">
                  {busy ? "Envoi…" : "Envoyer le signalement"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
