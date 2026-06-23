"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/** Connexion par Email + mot de passe ou Google OAuth. */
export default function AuthForm({ mode = "login" }: { mode?: "login" | "signup" }) {
  const [toast, setToast] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectQuery, setRedirectQuery] = useState("");
  const supabase = createClient();

  // Conserve ?redirect=/... à travers les liens connexion ⇄ inscription.
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("redirect");
    if (r && r.startsWith("/") && !r.startsWith("//")) setRedirectQuery(`?redirect=${encodeURIComponent(r)}`);
  }, []);

  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  // Destination après connexion : ?redirect=/... (ex. la fiche produit visée),
  // sinon le tableau de bord. On n'accepte que des chemins internes (sécurité).
  const getRedirect = () => {
    if (typeof window === "undefined") return "/dashboard";
    const r = new URLSearchParams(window.location.search).get("redirect") || "";
    return r.startsWith("/") && !r.startsWith("//") ? r : "/dashboard";
  };

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return show("⚠ Email et mot de passe requis.");
    if (mode === "signup" && password.length < 6) return show("⚠ Mot de passe : 6 caractères minimum.");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        // Créer/compléter le profil
        if (data.user) {
          await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName || email.split("@")[0] }, { onConflict: "id" });
          // Parrainage : si arrivé via ?ref=<id>, on crédite le parrain
          const ref = new URLSearchParams(window.location.search).get("ref");
          if (ref) {
            fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: data.user.id, ref }) }).catch(() => {});
          }
        }
        if (data.session) {
          window.location.href = getRedirect();
        } else {
          show("✅ Compte créé ! Vérifiez votre email pour confirmer (si demandé), puis connectez-vous.");
        }
      } else {
        // Connexion par email OU par nom d'utilisateur (sans @ → complété automatiquement)
        const loginId = email.includes("@") ? email.trim() : `${email.trim().toLowerCase()}@wanteermako.app`;
        const { error } = await supabase.auth.signInWithPassword({ email: loginId, password });
        if (error) throw error;
        window.location.href = getRedirect();
      }
    } catch (err: any) {
      const m = err?.message || "Erreur";
      show(m.includes("Invalid login") ? "❌ Email ou mot de passe incorrect." : m.includes("already registered") ? "❌ Cet email a déjà un compte. Connectez-vous." : `❌ ${m}`);
    } finally {
      setLoading(false);
    }
  }

  const GoogleButton = () => (
    <button
      type="button"
      onClick={async () => {
        show("Redirection vers Google...");
        // Utilise TOUJOURS le domaine courant (wanteermako.com, vercel.app ou localhost)
        const dest = getRedirect();
        const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(dest)}`;
        await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectUrl } });
      }}
      className="flex w-full items-center justify-center gap-2 rounded-[10px] border-2 border-gray-100 bg-white py-3 text-[.92rem] font-semibold text-gray-700 hover:border-gray-300 transition-colors shadow-sm hover:shadow-md"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
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
            {[["🔒", "Connexion sécurisée"], ["✅", "Vendeurs vérifiés par la communauté"], ["💬", "Contact direct WhatsApp / Appel"], ["💳", "Orange Money · Wave · MTN · Moov"]].map(([ic, t]) => (
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
        <Link href="/" className="mb-6 flex justify-center">
          <span className="inline-flex rounded-2xl bg-white border border-gray-100 px-4 py-2 shadow-sm">
            <img src="/logo-full.jpg" alt="Wanteermako" className="h-9 w-auto object-contain" />
          </span>
        </Link>

        <h2 className="mb-2 font-display text-[1.4rem] font-extrabold text-center text-gray-900">
          {mode === "signup" ? "Créez votre compte" : "Bon retour 👋"}
        </h2>
        <p className="mb-6 text-[.88rem] text-gray-500 text-center">
          {mode === "signup" ? "Inscrivez-vous par email ou avec Google." : "Connectez-vous par email ou avec Google."}
        </p>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom complet ou boutique" className="rounded-[10px] border-2 border-gray-100 bg-gray-50 px-4 py-3 text-[.92rem] outline-none focus:border-green focus:bg-white transition" />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="text" placeholder={mode === "signup" ? "Adresse email" : "Email ou nom d'utilisateur"} className="rounded-[10px] border-2 border-gray-100 bg-gray-50 px-4 py-3 text-[.92rem] outline-none focus:border-green focus:bg-white transition" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mot de passe" className="rounded-[10px] border-2 border-gray-100 bg-gray-50 px-4 py-3 text-[.92rem] outline-none focus:border-green focus:bg-white transition" />
          <button type="submit" disabled={loading} className="btn btn-green rounded-[10px] py-3 text-[.95rem] font-bold disabled:opacity-60">
            {loading ? "⏳ Patientez…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[.78rem] text-gray-400">
          <div className="h-px flex-1 bg-gray-100" /> ou <div className="h-px flex-1 bg-gray-100" />
        </div>

        <GoogleButton />

        <p className="mt-6 text-center text-[.85rem] text-gray-500">
          {mode === "signup" ? (
            <>Déjà un compte ? <Link href={`/connexion${redirectQuery}`} className="font-bold text-green">Se connecter</Link></>
          ) : (
            <>Pas encore de compte ? <Link href={`/inscription${redirectQuery}`} className="font-bold text-green">Créer un compte</Link></>
          )}
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 max-w-[90vw] rounded-[10px] border border-neon-gold bg-dark-900 px-5 py-2.5 text-center text-[.88rem] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
