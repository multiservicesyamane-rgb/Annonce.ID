"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";

/**
 * Enregistre la recherche courante (catégorie + lieu + fourchette de prix) comme
 * alerte : l'utilisateur reçoit un email à chaque nouvelle annonce correspondante.
 */
export default function SearchAlertButton({
  categoryName,
  location,
  minPrice,
  maxPrice,
}: {
  categoryName?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3500);
  };

  async function save() {
    setBusy(true);
    try {
      const slug =
        categoryName && categoryName !== "Toutes"
          ? CATEGORIES.find((c) => c.name === categoryName)?.slug || undefined
          : undefined;
      const loc = location && location !== "Toutes" ? location : undefined;

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          category_slug: slug,
          location: loc,
          price_min: minPrice && minPrice > 0 ? minPrice : undefined,
          price_max: maxPrice && maxPrice < 1_000_000_000 ? maxPrice : undefined,
        }),
      });

      if (res.status === 401) {
        show("Connectez-vous pour créer une alerte.");
        const back = window.location.pathname + window.location.search;
        setTimeout(() => router.push(`/connexion?redirect=${encodeURIComponent(back)}`), 1200);
        return;
      }
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        show("⚠ " + (d.error || "Erreur"));
        return;
      }
      show("🔔 Alerte créée ! Vous serez averti par email des nouvelles annonces.");
    } catch {
      show("⚠ Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        title="Être alerté des nouvelles annonces correspondant à cette recherche"
        className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-gold/50 bg-gold/10 px-3 py-2 text-[.82rem] font-semibold text-gold-dark dark:text-gold hover:bg-gold/20 transition disabled:opacity-50"
      >
        🔔 {busy ? "…" : "Créer une alerte"}
      </button>
      {msg && (
        <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 rounded-full border border-gray-800 bg-dark-900 px-5 py-2.5 text-center text-[.82rem] font-bold text-white shadow-2xl max-w-[90vw]">
          {msg}
        </div>
      )}
    </>
  );
}
