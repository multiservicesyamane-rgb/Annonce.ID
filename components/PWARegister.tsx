"use client";

import { useEffect } from "react";

/** Enregistre le service worker → site installable comme application mobile + push. */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
      if (document.readyState === "complete") onLoad();
      else window.addEventListener("load", onLoad);
    }
  }, []);
  return null;
}
