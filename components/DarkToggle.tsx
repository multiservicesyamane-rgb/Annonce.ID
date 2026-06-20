"use client";

import { useEffect, useState } from "react";

/**
 * Thème automatique : Clair la journée (6h-19h), Sombre la nuit (19h-6h).
 * L'utilisateur peut basculer manuellement. Son choix est respecté pour la session.
 */
export default function DarkToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Thème CLAIR par défaut ; on respecte le choix enregistré du visiteur.
    const stored = localStorage.getItem("annonceid_dark");
    const dark = stored === "true";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("annonceid_dark", String(next));
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-white transition-all duration-300"
      title={isDark ? "Mode Clair ☀️" : "Mode Sombre 🌙"}
      aria-label="Basculer thème clair/sombre"
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  );
}
