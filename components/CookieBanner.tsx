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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-[500px] z-[9999] bg-white/95 dark:bg-[#111722]/95 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.15)] rounded-[20px] p-5 md:p-6 pb-safe animate-fadeUp">
      <div className="flex flex-col gap-4">
        
        <div>
          <h3 className="font-display font-extrabold text-[1.2rem] text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            🍪 Nous utilisons des cookies
          </h3>
          <p className="text-[0.98rem] md:text-[1rem] text-gray-600 dark:text-gray-400 leading-relaxed">
            <strong>Annonce.ID</strong> et nos partenaires (dont Google AdSense) utilisent des cookies pour personnaliser le contenu, adapter les publicités à vos préférences et analyser notre trafic. En cliquant sur "Tout Accepter", vous consentez à l'utilisation de ces technologies.
            <Link href="/politique-confidentialite" className="text-green hover:underline ml-1 font-semibold">
              En savoir plus.
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full mt-2">
          <button 
            onClick={declineCookies}
            className="flex-1 btn btn-outline border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold text-[0.9rem]"
          >
            Refuser l'essentiel
          </button>
          <button 
            onClick={acceptCookies}
            className="flex-1 btn btn-green shadow-lg shadow-green/20 py-3 rounded-xl font-bold text-[0.9rem]"
          >
            Tout Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
