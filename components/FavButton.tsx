"use client";

import { useEffect, useState, useCallback } from "react";

import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "annonceid_favs";

function readFavs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function saveFavs(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch { }
}

export function useFavorites() {
  const [favs, setFavs] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let local = readFavs();
    setFavs(local);

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);

        const { data: dbFavs } = await supabase.from('favorites').select('listing_id').eq('user_id', data.session.user.id);
        if (dbFavs) {
          const dbIds = dbFavs.map(f => String(f.listing_id));
          const merged = Array.from(new Set([...local, ...dbIds]));
          setFavs(merged);
          saveFavs(merged);

          const missingInDb = local.filter(id => !dbIds.includes(id));
          if (missingInDb.length > 0) {
            try {
              await supabase.from('favorites').insert(
                missingInDb.map(id => ({ user_id: data.session.user.id, listing_id: id }))
              );
            } catch { /* ignore duplicates */ }
          }
        }
      }
    };
    checkSession();
  }, [supabase]);

  const toggle = useCallback(async (id: string | number) => {
    const strId = String(id);
    setFavs((prev) => {
      const next = prev.includes(strId) ? prev.filter((x) => x !== strId) : [...prev, strId];
      saveFavs(next);
      window.dispatchEvent(new CustomEvent("favs-updated", { detail: next }));
      return next;
    });

    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      if (favs.includes(strId)) {
        await supabase.from('favorites').delete().eq('user_id', data.session.user.id).eq('listing_id', strId);
      } else {
        try {
          await supabase.from('favorites').insert({ user_id: data.session.user.id, listing_id: strId });
        } catch { /* ignore duplicates */ }
      }
    }
  }, [supabase, favs]);

  const isFav = useCallback((id: string | number) => favs.includes(String(id)), [favs]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string[]>;
      setFavs(custom.detail);
    };
    window.addEventListener("favs-updated", handler);
    return () => window.removeEventListener("favs-updated", handler);
  }, []);

  return { favs, toggle, isFav };
}

export default function FavButton({
  adId,
  className = "",
}: {
  adId?: string | number;
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
      className={transition - all duration-200 ${className}}
aria - label={ active ? "Retirer des favoris" : "Ajouter aux favoris" }
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
    </button >
  );
}
