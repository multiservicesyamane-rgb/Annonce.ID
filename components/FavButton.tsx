"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "annonceid_favs";

/** Lire les favoris depuis localStorage */
function readFavs(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Sauvegarder les favoris dans localStorage */
function saveFavs(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
}

/** Hook global pour les favoris persistants */
export function useFavorites() {
  const [favs, setFavs] = useState<number[]>([]);

  useEffect(() => {
    setFavs(readFavs());
  }, []);

  const toggle = useCallback((id: number) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveFavs(next);
      // Dispatch custom event pour synchroniser les autres composants
      window.dispatchEvent(new CustomEvent("favs-updated", { detail: next }));
      return next;
    });
  }, []);

  const isFav = useCallback((id: number) => favs.includes(id), [favs]);

  // Écouter les changements depuis d'autres composants
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<number[]>;
      setFavs(custom.detail);
    };
    window.addEventListener("favs-updated", handler);
    return () => window.removeEventListener("favs-updated", handler);
  }, []);

  return { favs, toggle, isFav };
}

/**
 * Bouton favori avec cœur animé. Persistant via localStorage.
 * Passer `adId` pour traquer quel annonce est mise en favori.
 */
export default function FavButton({
  adId,
  className = "",
}: {
  adId?: number;
  className?: string;
}) {
  const { isFav, toggle } = useFavorites();
  const active = adId !== undefined && isFav(adId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (adId !== undefined) toggle(adId);
      }}
      className={`transition-all duration-200 ${className}`}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={active ? "#E63946" : "none"}
        stroke={active ? "#E63946" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transform: active ? "scale(1.15)" : "scale(1)",
          transition: "transform .2s ease, fill .2s ease",
        }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
