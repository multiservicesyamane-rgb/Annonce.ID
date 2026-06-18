"use client";

import { useState } from "react";
import Link from "next/link";

type Shop = {
  id: string;
  name: string;
  avatar: string;
  cover: string | null;
  bio: string;
  adCount: number;
  isPro: boolean;
  phone: string;
  memberSince: string;
};

type View = "mosaic" | "list" | "detail";

export default function BoutiquesView({ boutiques }: { boutiques: Shop[] }) {
  const [view, setView] = useState<View>("mosaic");
  const [q, setQ] = useState("");

  const filtered = boutiques.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || (s.bio || "").toLowerCase().includes(q.toLowerCase()));

  const tabs: { id: View; icon: string; label: string }[] = [
    { id: "mosaic", icon: "▦", label: "Mosaïque" },
    { id: "list", icon: "☰", label: "Liste" },
    { id: "detail", icon: "🗂️", label: "Détail" },
  ];

  return (
    <div>
      {/* Barre : recherche + sélecteur de vue */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Rechercher une boutique…"
          className="flex-1 rounded-[10px] border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-800 px-4 py-2.5 text-[.88rem] text-gray-900 dark:text-white outline-none focus:border-green"
        />
        <div className="flex items-center gap-1 rounded-[10px] bg-gray-100 dark:bg-dark-800 p-1 self-start">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[.78rem] font-bold transition ${view === t.id ? "bg-white dark:bg-dark-900 text-green shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"}`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MOSAÏQUE — 2 colonnes sur mobile */}
      {view === "mosaic" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((s) => (
            <Link key={s.id} href={`/boutique/${s.id}`} className="group flex flex-col overflow-hidden rounded-[16px] border border-gray-100 dark:border-white/10 bg-white dark:bg-[#111722]/80 shadow-sm hover:shadow-lg hover:border-gold/40 transition-all">
              <div className="relative h-14 sm:h-16 bg-gradient-to-br from-green-600/20 via-neon-gold/10 to-transparent">
                {s.cover && <img src={s.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />}
                {s.isPro && <span className="absolute right-2 top-2 z-10 rounded-full bg-gradient-to-r from-neon-gold to-[#D4891A] px-2 py-0.5 text-[.55rem] font-bold uppercase tracking-wider text-dark-900 shadow-sm">PRO</span>}
              </div>
              <div className="flex flex-col items-center -mt-7 px-3 pb-4">
                <img src={s.avatar} alt={s.name} className="h-14 w-14 rounded-full border-[3px] border-white dark:border-dark-800 object-cover shadow-md bg-white group-hover:scale-105 transition-transform" />
                <h3 className="mt-1.5 line-clamp-1 text-center font-display text-[.85rem] font-bold text-gray-900 dark:text-white group-hover:text-green">{s.name}</h3>
                <div className="mt-1 text-[.68rem] text-gray-500">📦 <b className="text-gray-700 dark:text-white">{s.adCount}</b> annonce{s.adCount > 1 ? "s" : ""}</div>
                <span className="mt-2 w-full rounded-lg bg-gray-50 dark:bg-white/5 py-1.5 text-center text-[.72rem] font-bold text-green group-hover:bg-green group-hover:text-white transition-all">Voir →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* LISTE — lignes compactes */}
      {view === "list" && (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => (
            <Link key={s.id} href={`/boutique/${s.id}`} className="group flex items-center gap-3 rounded-[12px] border border-gray-100 dark:border-white/10 bg-white dark:bg-[#111722]/80 p-3 shadow-sm hover:border-gold/40 hover:shadow-md transition-all">
              <img src={s.avatar} alt={s.name} className="h-12 w-12 shrink-0 rounded-xl object-cover bg-white border border-gray-100 dark:border-white/10" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-bold text-[.9rem] text-gray-900 dark:text-white group-hover:text-green">{s.name}</h3>
                  {s.isPro && <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[.55rem] font-bold uppercase text-gold-dark">Pro</span>}
                </div>
                <p className="truncate text-[.75rem] text-gray-500 dark:text-gray-400">{s.bio}</p>
              </div>
              <div className="shrink-0 text-right text-[.72rem] text-gray-500">📦 {s.adCount}</div>
              <span className="shrink-0 rounded-lg bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-[.74rem] font-bold text-green group-hover:bg-green group-hover:text-white transition">Voir →</span>
            </Link>
          ))}
        </div>
      )}

      {/* DÉTAIL — grandes cartes avec couverture */}
      {view === "detail" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <Link key={s.id} href={`/boutique/${s.id}`} className="group flex flex-col overflow-hidden rounded-[18px] border border-gray-100 dark:border-white/10 bg-white dark:bg-[#111722]/80 shadow-sm hover:shadow-xl hover:border-gold/40 transition-all">
              <div className="relative h-28 bg-gradient-to-br from-dark-900 to-green-900">
                {s.cover && <img src={s.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {s.isPro && <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-neon-gold to-[#D4891A] px-2.5 py-0.5 text-[.6rem] font-bold uppercase tracking-wider text-dark-900 shadow">PRO</span>}
              </div>
              <div className="flex gap-3 px-4 pb-4">
                <img src={s.avatar} alt={s.name} className="-mt-8 h-16 w-16 rounded-2xl border-4 border-white dark:border-dark-800 object-cover shadow-lg bg-white shrink-0" />
                <div className="min-w-0 flex-1 pt-2">
                  <h3 className="truncate font-display text-[1.05rem] font-extrabold text-gray-900 dark:text-white group-hover:text-green">{s.name}</h3>
                  <p className="line-clamp-2 text-[.78rem] text-gray-500 dark:text-gray-400 mt-0.5">{s.bio}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[.72rem] text-gray-500">
                    <span className="rounded-full bg-gray-100 dark:bg-dark-700 px-2 py-0.5">📦 {s.adCount} annonces</span>
                    {s.memberSince && <span className="rounded-full bg-gray-100 dark:bg-dark-700 px-2 py-0.5">🗓️ {s.memberSince}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-auto flex gap-2 px-4 pb-4">
                <span className="flex-1 rounded-lg bg-green/10 py-2 text-center text-[.8rem] font-bold text-green group-hover:bg-green group-hover:text-white transition">Voir la boutique →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && <div className="py-10 text-center text-[.9rem] text-gray-500">Aucune boutique ne correspond à « {q} ».</div>}
    </div>
  );
}
