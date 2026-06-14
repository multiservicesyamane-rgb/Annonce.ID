"use client";

import { useEffect, useState } from "react";

/**
 * Toggle dark/light mode.
 * Persiste dans localStorage. Ajoute/retire la classe `dark` sur <html>.
 */
export default function DarkToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Lire la préférence
    const stored = localStorage.getItem("annonceid_dark");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "true" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("annonceid_dark", String(next));
  }

  return (
    <button
      onClick={toggle}
      className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-gold hover:bg-white/10 transition-colors"
      aria-label={dark ? "Mode clair" : "Mode sombre"}
      title={dark ? "Mode clair" : "Mode sombre"}
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
