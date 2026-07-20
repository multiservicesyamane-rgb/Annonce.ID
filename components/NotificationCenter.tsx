"use client";

import { useEffect, useState, useCallback } from "react";

type Notif = {
  id: string;
  type: string;
  title: string;
  body?: string;
  url?: string;
  read: boolean;
  created_at: string;
};

// Icône + couleur par type (charte du site : vert/ambre/rouge/indigo).
const STYLE: Record<string, { icon: string; ring: string; bg: string }> = {
  message: { icon: "💬", ring: "text-indigo-500", bg: "bg-indigo-500/10" },
  new_listing: { icon: "🆕", ring: "text-green", bg: "bg-green/10" },
  listing_approved: { icon: "✅", ring: "text-green", bg: "bg-green/10" },
  listing_sold: { icon: "📦", ring: "text-brand-red", bg: "bg-red-500/10" },
  listing_expired: { icon: "⏰", ring: "text-amber-500", bg: "bg-amber-500/10" },
};

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `il y a ${j} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function NotificationCenter() {
  const [items, setItems] = useState<Notif[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "list" }),
      });
      const d = await res.json();
      setItems(d.notifications || []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markAll() {
    setBusy(true);
    try {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ action: "markAllRead" }) });
      setItems((prev) => (prev || []).map((n) => ({ ...n, read: true })));
    } finally { setBusy(false); }
  }

  async function open(n: Notif) {
    if (!n.read) {
      fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ action: "markRead", id: n.id }) }).catch(() => {});
      setItems((prev) => (prev || []).map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.url) window.location.href = n.url;
  }

  const unread = (items || []).filter((n) => !n.read).length;

  return (
    <div className="animate-fadeUp mx-auto max-w-[720px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.25rem] sm:text-[1.5rem] font-extrabold text-gray-900 dark:text-white">🔔 Notifications</h1>
          <p className="mt-0.5 text-[.8rem] text-gray-500 dark:text-gray-400">{unread > 0 ? `${unread} non lue(s)` : "Tout est à jour"}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} disabled={busy} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[.78rem] font-bold text-green hover:bg-green/5 disabled:opacity-60 dark:border-dark-border dark:bg-dark-800">
            {busy ? "…" : "✓ Tout marquer comme lu"}
          </button>
        )}
      </div>

      {items === null ? (
        // Skeleton (structure réelle, pas un spinner)
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-dark-border dark:bg-dark-800">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-gray-100 dark:bg-dark-700" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-dark-700" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-dark-700" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-14 text-center dark:border-dark-border dark:bg-dark-800">
          <div className="mb-2 text-[2.2rem]">🔔</div>
          <h3 className="font-bold text-gray-800 dark:text-white">Aucune notification</h3>
          <p className="mx-auto mt-1 max-w-xs text-[.82rem] text-gray-500 dark:text-gray-400">
            Tu seras prévenu ici quand un acheteur t'écrit, ou quand une de tes annonces est publiée, vendue ou expirée.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((n) => {
            const s = STYLE[n.type] || { icon: "🔔", ring: "text-gray-500", bg: "bg-gray-500/10" };
            return (
              <li key={n.id}>
                <button
                  onClick={() => open(n)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition hover:border-green/40 ${n.read ? "border-gray-100 bg-white dark:border-dark-border dark:bg-dark-800" : "border-green/30 bg-green/[0.04] dark:bg-green/[0.06]"}`}
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[1.15rem] ${s.bg} ${s.ring}`}>{s.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-[.9rem] text-gray-900 dark:text-white">{n.title}</span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-green" aria-label="non lue" />}
                    </div>
                    {n.body && <p className="mt-0.5 text-[.8rem] leading-snug text-gray-600 dark:text-gray-300">{n.body}</p>}
                    <span className="mt-1 block text-[.7rem] text-gray-400">{timeAgo(n.created_at)}</span>
                  </div>
                  {n.url && (
                    <span className="mt-1 shrink-0 text-gray-300 dark:text-gray-600" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
