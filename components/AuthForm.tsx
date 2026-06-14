"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/** Connexion uniquement par Google OAuth. */
export default function AuthForm({ mode = "login" }: { mode?: "login" | "signup" }) {
  const [toast, setToast] = useState<string | null>(null);
  const supabase = createClient();

  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  const GoogleButton = () => (
    <button 
      type="button" 
      onClick={async () => {
        show("Redirection vers Google...");
        const redirectUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000/auth/callback' 
          : 'https://annonce-id.vercel.app/auth/callback';
        
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: redirectUrl }
        });
      }} 
      className="flex w-full items-center justify-center gap-2 rounded-[10px] border-2 border-gray-100 bg-white py-3.5 text-[.95rem] font-semibold text-gray-700 hover:border-gray-300 transition-colors mt-3 shadow-sm hover:shadow-md"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continuer avec Google
    </button>
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-grad-hero">
      {/* Panneau gauche (confiance) */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden p-12 md:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_20%_30%,rgba(245,166,35,.22)_0,transparent_45%)]" />
        <div className="relative z-10 max-w-[360px]">
          <h2 className="mb-5 font-display text-[1.4rem] font-extrabold leading-snug text-white">
            Rejoignez la plateforme d&apos;annonces <em className="not-italic text-neon-gold [text-shadow:0_0_16px_rgba(255,201,60,.5)]">100% fiable</em>
          </h2>
          <div className="flex flex-col gap-3">
            {[
              ["🔒", "Connexion 100% sécurisée par Google"],
              ["✅", "Vendeurs vérifiés par la communauté"],
              ["💬", "Contact direct WhatsApp / Appel"],
              ["💳", "Orange Money · Wave · MTN · Moov"],
            ].map(([ic, t]) => (
              <div key={t} className="flex items-center gap-3 text-[.85rem] text-white/85">
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-neon-gold/30 bg-neon-gold/15">{ic}</span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau droit (formulaire) */}
      <div className="flex w-full flex-col justify-center bg-white px-6 py-8 md:w-[460px] md:shrink-0">
        <Link href="/" className="mb-8 font-display text-[1.4rem] font-extrabold text-green text-center">
          Annonce<span className="text-gold-dark">.ID</span>
        </Link>

        <div>
          <h2 className="mb-2 font-display text-[1.4rem] font-extrabold text-center text-gray-900">
            {mode === "signup" ? "Créez votre compte" : "Bon retour 👋"}
          </h2>
          <p className="mb-8 text-[.9rem] text-gray-500 text-center">
            Connectez-vous en un clic avec votre compte Google. Simple, rapide et sécurisé.
          </p>
          
          <GoogleButton />
          
          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-green-pale px-3 py-3 text-[.8rem] text-green text-center font-medium">
            🔒 Connexion sécurisée garantie par Google
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-neon-gold bg-dark-900 px-5 py-2.5 text-[.88rem] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
