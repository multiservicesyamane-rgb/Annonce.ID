"use client";

import { useEffect } from "react";

/**
 * Force le mode sombre (Dashboard) sur tout le site et masque le bouton.
 */
export default function DarkToggle() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("annonceid_dark", "true");
  }, []);

  return null; // Masque l'icône car le site est maintenant 100% sombre
}
