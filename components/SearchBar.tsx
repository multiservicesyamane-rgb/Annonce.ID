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
  const [filterOpen, setFilterOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
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

  // Simple fuzzy match function (Levenshtein distance <= 2)
  function fuzzyMatch(str: string, query: string) {
    const s = str.toLowerCase();
    const q = query.toLowerCase();
    if (s.includes(q)) return true;
    
    // Check if all words are present (order-agnostic)
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length > 1 && words.every(w => s.includes(w))) return true;

    // Simple typo tolerance for single words (>4 chars)
    if (words.length === 1 && q.length > 4) {
      let mismatches = 0;
      let i = 0, j = 0;
      while (i < s.length && j < q.length) {
        if (s[i] === q[j]) { j++; } 
        else { mismatches++; if (mismatches > 2) return false; }
        i++;
      }
      return j === q.length || j >= q.length - 1;
    }
    return false;
  }

  function liveSearch(value: string) {
    setQ(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const v = value.trim();
      if (v.length < 2) {
        setSuggestions([]);
        return;
      }
      // Suggestions sur de VRAIES annonces (API), repli sur la démo si hors-ligne
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(v)}`);
        const data = await res.json();
        if (Array.isArray(data?.results) && data.results.length) {
          setSuggestions(data.results.slice(0, 5));
          return;
        }
      } catch { /* repli ci-dessous */ }
      setSuggestions(LISTINGS.filter((a) => fuzzyMatch(a.title, v)).slice(0, 5));
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
    // Si la recherche correspond à une catégorie → page catégorie (résultats exacts)
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const nq = norm(query);
    const matchCat = nq.length >= 3 && CATEGORIES.find((c) => {
      const n = norm(c.name), s = norm(c.slug);
      return n === nq || s === nq || n.startsWith(nq) || s.startsWith(nq) || nq.startsWith(s) || nq.startsWith(n);
    });
    if (matchCat) { router.push(`/categorie/${matchCat.slug}`); return; }
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
        className={`search-shell flex items-center overflow-hidden rounded-full border border-gray-200 dark:border-transparent dark:bg-gradient-to-r dark:from-[#6366F1]/40 dark:via-[#F5A623]/20 dark:to-[#F5A623]/40 bg-white dark:p-[1px] p-0 transition-all focus-within:shadow-[0_0_12px_rgba(99,102,241,0.15)] dark:focus-within:shadow-[0_0_20px_rgba(245,166,35,0.25)] ${
          big ? "shadow-md" : "shadow-sm"
        }`}
      >
        <div className="flex w-full items-center bg-white dark:bg-[#0A0E14]/90 backdrop-blur-md rounded-full px-3 py-1.5 sm:py-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-indigo-400 mr-2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            value={q}
            onChange={(e) => liveSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Rechercher une annonce..."
            autoComplete="off"
            aria-label="Rechercher une annonce"
            className="min-w-0 flex-1 bg-transparent text-[.88rem] text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          />
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="ml-2 text-gray-400 dark:text-neon-gold hover:text-green dark:hover:text-white transition-colors relative"
            aria-label="Filtres"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[950] max-h-[65vh] w-[230px] max-w-[85vw] overflow-y-auto animate-fadeUp rounded-[16px] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0E14]/95 backdrop-blur-xl p-2 shadow-2xl">
          <div className="px-3 py-2 text-[.75rem] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Catégories
          </div>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              className="w-full text-left px-3 py-2 text-[.85rem] font-medium text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
              onClick={() => {
                setFilterOpen(false);
                router.push(`/categorie/${c.slug}`);
              }}
            >
              <span className="text-[1.1rem]">{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
      )}

      {open && !filterOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 animate-fadeUp rounded-lg border border-gray-100 dark:border-white/10 bg-white dark:bg-[#111722] p-3 shadow-lg">
          {recent.length > 0 && (
            <section className="mb-3">
              <div className="mb-1.5 flex items-center gap-1 text-[.68rem] font-bold uppercase tracking-wider text-gray-500">
                🕘 Recherches récentes
              </div>
              {recent.map((r) => (
                <div
                  key={r}
                  onClick={() => submit(r)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[.85rem] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
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
                  className="cursor-pointer rounded-[20px] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-2.5 py-1 text-[.78rem] text-gray-700 dark:text-gray-300 transition hover:border-gold dark:hover:border-indigo-500 hover:bg-gold-pale dark:hover:bg-indigo-500/20 hover:text-green dark:hover:text-white"
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
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[.85rem] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  🔎 {a.title}
                  <span className="ml-auto text-[.72rem] text-gray-400">{a.category}</span>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
