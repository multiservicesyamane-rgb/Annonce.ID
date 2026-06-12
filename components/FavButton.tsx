"use client";

import { useState } from "react";

/** Bouton favori (toggle rouge). Démo : état local. En prod → table `favorites`. */
export default function FavButton({ className = "" }: { className?: string }) {
  const [active, setActive] = useState(false);
  return (
    <button
      type="button"
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setActive((v) => !v);
      }}
      className={`flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/90 text-[.9rem] shadow-xs transition ${
        active ? "scale-110 text-brand-red" : "text-gray-300 hover:text-brand-red"
      } ${className}`}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
