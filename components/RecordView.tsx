"use client";

import { useEffect } from "react";

/**
 * Enregistre l'annonce consultée dans l'historique local (localStorage),
 * pour alimenter « Vus récemment » et « Recommandé pour vous ».
 */
export default function RecordView({ ad }: { ad: any }) {
  useEffect(() => {
    if (!ad?.id) return;
    try {
      const key = "annonceid_history";
      const hist = JSON.parse(localStorage.getItem(key) || "[]");
      const arr = Array.isArray(hist) ? hist.filter((h: any) => h && h.id && h.id !== ad.id) : [];
      arr.unshift(ad);
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 12)));
    } catch { /* ignore */ }
  }, [ad]);

  return null;
}
