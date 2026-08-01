"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

type Alert = {
  id: string;
  category_slug: string | null;
  location: string | null;
  price_min: number | null;
  price_max: number | null;
  keyword: string | null;
  created_at: string;
};

const catName = (slug: string | null) =>
  slug ? CATEGORIES.find((c) => c.slug === slug)?.name || slug : "Toutes catégories";

function criteria(a: Alert): string {
  const parts: string[] = [catName(a.category_slug)];
  if (a.location) parts.push(`📍 ${a.location}`);
  if (a.price_min || a.price_max) {
    const min = a.price_min ? `${formatNumber(a.price_min)}` : "0";
    const max = a.price_max ? `${formatNumber(a.price_max)}` : "∞";
    parts.push(`💰 ${min} – ${max} FCFA`);
  }
  if (a.keyword) parts.push(`🔎 « ${a.keyword} »`);
  return parts.join("  ·  ");
}

export default function AlertesPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [notAuth, setNotAuth] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" }),
      });
      if (res.status === 401) {
        setNotAuth(true);
        return;
      }
      const d = await res.json();
      setAlerts(d.alerts || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    }).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6">
      <div className="mb-5">
        <h1 className="font-display text-[1.4rem] font-bold text-gray-900 dark:text-white">🔔 Mes alertes</h1>
        <p className="mt-1 text-[.85rem] text-gray-500 dark:text-white/60">
          Recevez un email dès qu'une nouvelle annonce correspond à vos critères. Créez une alerte depuis n'importe quelle page de résultats.
        </p>
      </div>

      {notAuth ? (
        <div className="rounded-xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-6 text-center">
          <p className="text-[.9rem] text-gray-700 dark:text-white/80">Connectez-vous pour gérer vos alertes.</p>
          <Link href="/connexion?redirect=/alertes" className="btn btn-green mt-3 inline-block px-5 py-2.5 text-[.85rem]">
            Se connecter
          </Link>
        </div>
      ) : loading ? (
        <div className="py-10 text-center text-gray-400">Chargement…</div>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-6 text-center">
          <p className="text-[.9rem] text-gray-700 dark:text-white/80">Vous n'avez pas encore d'alerte.</p>
          <Link href="/recherche" className="btn btn-outline mt-3 inline-block px-5 py-2.5 text-[.85rem]">
            Parcourir les annonces
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-3.5 shadow-sm"
            >
              <div className="min-w-0">
                <div className="truncate text-[.9rem] font-semibold text-gray-900 dark:text-white">{criteria(a)}</div>
                <div className="mt-0.5 text-[.72rem] text-gray-400">
                  Créée le {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(a.id)}
                className="shrink-0 rounded-lg border border-gray-200 dark:border-dark-border px-3 py-1.5 text-[.78rem] font-semibold text-brand-red hover:bg-brand-red/10 transition"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
