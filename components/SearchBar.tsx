"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LISTINGS, TRENDING } from "@/lib/data";
import { CATEGORIES } from "@/lib/constants";

/**
 * Barre de recherche moderne (section 7) : autocomplétion live (debounce 250ms),
 * recherches récentes (localStorage), tendances. Variante hero ou header.
 */
export default function SearchBar({ variant = "header" }: { variant?: "header" | "hero" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<typeof LISTINGS>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem("annonceid_recent") || "[]");
      if (Array.isArray(r)) setRecent(r.slice(0, 5));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function liveSearch(value: string) {
    setQ(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if (value.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      const v = value.toLowerCase();
      setSuggestions(LISTINGS.filter((a) => a.title.toLowerCase().includes(v)).slice(0, 5));
    }, 250);
  }

  function submit(term?: string) {
    const query = (term ?? q).trim();
    if (query) {
      const next = [query, ...recent.filter((r) => r !== query)].slice(0, 5);
      setRecent(next);
      try {
        localStorage.setItem("annonceid_recent", JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    router.push(`/recherche?q=${encodeURIComponent(query)}`);
  }

  function removeRecent(term: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = recent.filter((r) => r !== term);
    setRecent(next);
    localStorage.setItem("annonceid_recent", JSON.stringify(next));
  }

  const big = variant === "hero";

  return (
    <div ref={wrapRef} className={`relative ${big ? "max-w-[620px]" : "mx-auto w-full max-w-[680px] flex-1"}`}>
      <div
        className={`flex overflow-hidden rounded-[10px] border-2 border-transparent bg-white transition focus-within:border-neon-gold focus-within:shadow-glow-gold ${
          big ? "shadow-lg" : "shadow-sm"
        }`}
      >
        <input
          type="text"
          value={q}
          onChange={(e) => liveSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={big ? "Ex: iPhone 14, Villa Dakar, Toyota…" : "Que recherchez-vous ?"}
          autoComplete="off"
          aria-label="Rechercher une annonce"
          className="min-w-0 flex-1 px-3.5 py-2.5 text-[.88rem] text-gray-900 outline-none"
        />
        <div className="my-1.5 hidden w-px bg-gray-100 sm:block" />
        <select
          aria-label="Catégorie"
          className="hidden cursor-pointer border-none px-2 py-2.5 text-[.78rem] text-gray-700 outline-none sm:block"
          onChange={(e) => e.target.value && router.push(`/categorie/${e.target.value}`)}
        >
          <option value="">Catégorie</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => submit()}
          className="flex items-center gap-1 bg-gold px-4 py-2.5 text-[.85rem] font-bold text-dark-900 hover:bg-gold-dark"
        >
          🔍{big && <span>Chercher</span>}
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 animate-fadeUp rounded-lg border border-gray-100 bg-white p-3 shadow-lg">
          {recent.length > 0 && (
            <section className="mb-3">
              <div className="mb-1.5 flex items-center gap-1 text-[.68rem] font-bold uppercase tracking-wider text-gray-500">
                🕘 Recherches récentes
              </div>
              {recent.map((r) => (
                <div
                  key={r}
                  onClick={() => submit(r)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[.85rem] text-gray-700 hover:bg-gray-50"
                >
                  🔍 {r}
                  <span
                    onClick={(e) => removeRecent(r, e)}
                    className="ml-auto text-[.72rem] text-gray-300 hover:text-brand-red"
                  >
                    retirer ✕
                  </span>
                </div>
              ))}
            </section>
          )}

          <section className="mb-3">
            <div className="mb-1.5 flex items-center gap-1 text-[.68rem] font-bold uppercase tracking-wider text-gray-500">
              🔥 Tendances
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING.map((t) => (
                <span
                  key={t}
                  onClick={() => submit(t)}
                  className="cursor-pointer rounded-[20px] border border-gray-100 bg-gray-50 px-2.5 py-1 text-[.78rem] text-gray-700 transition hover:border-gold hover:bg-gold-pale hover:text-green"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          {suggestions.length > 0 && (
            <section>
              <div className="mb-1.5 flex items-center gap-1 text-[.68rem] font-bold uppercase tracking-wider text-gray-500">
                💡 Suggestions
              </div>
              {suggestions.map((a) => (
                <div
                  key={a.id}
                  onClick={() => router.push(`/annonce/${a.id}/${a.slug}`)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[.85rem] text-gray-700 hover:bg-gray-50"
                >
                  🔎 {a.title}
                  <span className="ml-auto text-[.72rem] text-gray-300">{a.category}</span>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
