"use client";

import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si déjà installé ou refusé récemment
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      if (dismissed === "1") {
        setIsDismissed(true);
      }
      
      // Standalone detection
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsDismissed(true);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("PWA installée avec succès");
      setIsInstallable(false);
    } else {
      console.log("Installation PWA refusée");
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("pwa_install_dismissed", "1");
    }
  };

  if (!isInstallable || isDismissed) return null;

  return (
    <div className="fixed bottom-[80px] left-1/2 z-[999] flex w-[90%] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-2xl bg-white p-3 px-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] ring-1 ring-gray-200 dark:bg-[#161B22] dark:ring-white/10 lg:bottom-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green/10 text-green dark:bg-green/20">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Installer l'app</p>
          <p className="text-[0.65rem] text-gray-500 dark:text-gray-400">Pour un accès plus rapide</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstallClick}
          className="rounded-lg bg-green px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green/90"
        >
          Installer
        </button>
        <button 
          onClick={handleDismiss}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
          aria-label="Fermer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
