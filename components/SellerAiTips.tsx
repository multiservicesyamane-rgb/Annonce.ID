"use client";

import { useState } from "react";

/**
 * Widget dashboard : conseils IA pour vendre plus vite (Gemini, repli template).
 */
export default function SellerAiTips() {
  const [tips, setTips] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "seller_tips", topic: "mes annonces sur Wanteermako", tier: "user" }),
      });
      const d = await res.json();
      setTips(d.text || "");
    } catch {
      setTips("📸 Ajoutez de belles photos · 💬 Répondez vite · 💰 Prix juste · 🚀 Boostez votre annonce");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/[0.08] dark:to-purple-500/[0.05] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[1.3rem]">🤖</span>
          <div>
            <h3 className="font-display text-[.98rem] font-extrabold text-gray-900 dark:text-white">Assistant IA — Vendez plus</h3>
            <p className="text-[.76rem] text-gray-500 dark:text-white/60">Des conseils personnalisés pour vendre plus vite</p>
          </div>
        </div>
        <button onClick={generate} disabled={busy} className="shrink-0 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#A855F7] px-4 py-2 text-[.8rem] font-bold text-white shadow disabled:opacity-60">
          {busy ? "⏳ Génération…" : "✨ Obtenir des conseils"}
        </button>
      </div>
      {tips && (
        <div className="mt-3 whitespace-pre-line rounded-xl bg-white/70 dark:bg-white/[0.04] p-3 text-[.84rem] leading-relaxed text-gray-700 dark:text-gray-200">
          {tips}
        </div>
      )}
    </div>
  );
}
