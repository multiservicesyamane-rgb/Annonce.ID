"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem("annonceid_cookie_consent");
    if (!consent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("annonceid_cookie_consent", "accepted");
    setShow(false);
  };

  const declineCookies = () => {
    localStorage.setItem("annonceid_cookie_consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] bg-white dark:bg-[#111722] border-t border-gray-200 dark:border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 md:p-6 pb-safe animate-fadeUp">
      <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex-1">
          <h3 className="font-display font-bold text-[1.1rem] text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            🍪 Nous utilisons des cookies
          </h3>
          <p className="text-[.9rem] text-gray-600 dark:text-gray-400 leading-relaxed">
            Annonces.sn et nos partenaires (dont Google AdSense) utilisent des cookies pour personnaliser le contenu, personnaliser les publicités et analyser notre trafic. En cliquant sur "Accepter", vous consentez à l'utilisation de tous les cookies.
            <Link href="/politique-confidentialite" className="text-green hover:underline ml-1 font-semibold">
              En savoir plus.
            </Link>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <button 
            onClick={declineCookies}
            className="btn btn-outline border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 w-full sm:w-auto"
          >
            Refuser l'essentiel
          </button>
          <button 
            onClick={acceptCookies}
            className="btn btn-green shadow-lg shadow-green/20 w-full sm:w-auto px-8"
          >
            Tout Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
