"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getSafeRedirectPath } from "@/lib/authRedirect";
import { BRAND } from "@/lib/constants";

type Notice = {
  tone: "error" | "success" | "info";
  text: string;
};

export default function AuthForm({ mode = "login" }: { mode?: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [routeQuery, setRouteQuery] = useState("");
  const [signupsOpen, setSignupsOpen] = useState(true);
  const [supabase] = useState(() => createClient());

  const isSignup = mode === "signup";
  const isBusy = loading || oauthLoading || resetting;
  const signupBlocked = isSignup && !signupsOpen;

  // Inscriptions ouvertes/fermées : piloté depuis l'admin (toggle système).
  useEffect(() => {
    if (!isSignup) return;
    let active = true;
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (active && d?.flags && d.flags.signups === false) setSignupsOpen(false); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [isSignup]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const safeRedirect = getSafeRedirectPath(params.get("redirect"), "");
    const referral = params.get("ref");
    const kept = new URLSearchParams();

    if (safeRedirect) kept.set("redirect", safeRedirect);
    if (referral) kept.set("ref", referral);
    const query = kept.toString();
    if (query) setRouteQuery("?" + query);

    const error = params.get("error");
    const reason = params.get("reason"); // DIAGNOSTIC temporaire (login Google)
    if (error === "callback") {
      setNotice({
        tone: "error",
        text:
          "La connexion avec Google a été interrompue. Réessayez." +
          (reason ? ` [diagnostic : ${reason}]` : ""),
      });
    } else if (error === "session") {
      setNotice({ tone: "error", text: "Votre session a expiré. Reconnectez-vous pour continuer." });
    }
  }, []);

  function getRedirect() {
    if (typeof window === "undefined") return isSignup ? "/dashboard?panel=profile&welcome=1" : "/";
    const requested = new URLSearchParams(window.location.search).get("redirect");
    const fallback = isSignup ? "/dashboard?panel=profile&welcome=1" : "/";
    return getSafeRedirectPath(requested, fallback);
  }

  function getCallbackUrl() {
    return window.location.origin + "/auth/callback?next=" + encodeURIComponent(getRedirect());
  }

  function authErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
    const normalized = message.toLowerCase();

    if (normalized.includes("invalid login")) return "Email, nom d'utilisateur ou mot de passe incorrect.";
    if (normalized.includes("email not confirmed")) return "Confirmez votre adresse email avant de vous connecter.";
    if (normalized.includes("already registered") || normalized.includes("user already")) {
      return "Un compte existe déjà avec cette adresse email. Connectez-vous.";
    }
    if (normalized.includes("password")) return "Le mot de passe ne respecte pas les règles de sécurité.";
    if (normalized.includes("rate limit")) return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
    return message;
  }

  async function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const emailInput = email.trim();
    const cleanName = fullName.trim();

    if (isSignup && cleanName.length < 2) {
      setNotice({ tone: "error", text: "Indiquez votre nom ou le nom de votre boutique." });
      return;
    }
    if (!emailInput) {
      setNotice({ tone: "error", text: "Indiquez votre adresse email." });
      return;
    }
    if (signupBlocked) {
      setNotice({ tone: "error", text: "Les inscriptions sont momentanément fermées. Réessayez plus tard." });
      return;
    }
    if (isSignup && !/^\S+@\S+\.\S+$/.test(emailInput)) {
      setNotice({ tone: "error", text: "Saisissez une adresse email valide." });
      return;
    }
    if (password.length < 6) {
      setNotice({ tone: "error", text: "Le mot de passe doit contenir au moins 6 caractères." });
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const authEmail = emailInput.toLowerCase();
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: {
            data: { full_name: cleanName },
            emailRedirectTo: getCallbackUrl(),
          },
        });
        if (error) throw error;

        if (data.user) {
          await supabase
            .from("profiles")
            .upsert({ id: data.user.id, full_name: cleanName }, { onConflict: "id" });

          const referral = new URLSearchParams(window.location.search).get("ref");
          if (referral) {
            fetch("/api/referral", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: data.user.id, ref: referral }),
            }).catch(() => undefined);
          }
        }

        if (data.session) {
          window.location.href = getRedirect();
          return;
        }

        setNotice({
          tone: "success",
          text: "Votre compte est créé. Ouvrez l'email de confirmation reçu, puis connectez-vous.",
        });
      } else {
        const loginId = emailInput.includes("@")
          ? emailInput.toLowerCase()
          : emailInput.toLowerCase() + "@wanteermako.app";
        const { error } = await supabase.auth.signInWithPassword({ email: loginId, password });
        if (error) throw error;
        window.location.href = getRedirect();
      }
    } catch (error) {
      setNotice({ tone: "error", text: authErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setNotice({ tone: "info", text: "Ouverture de la connexion Google..." });
    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getCallbackUrl() },
    });
    if (error) {
      setNotice({ tone: "error", text: authErrorMessage(error) });
      setOauthLoading(false);
    }
  }

  async function handlePasswordReset() {
    const resetEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(resetEmail)) {
      setNotice({ tone: "error", text: "Indiquez d'abord l'adresse email liée à votre compte." });
      return;
    }

    setResetting(true);
    setNotice(null);
    try {
      const next = "/dashboard?panel=security";
      const redirectTo =
        window.location.origin + "/auth/callback?next=" + encodeURIComponent(next);
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo });
      if (error) throw error;
      setNotice({
        tone: "success",
        text: "Un lien de réinitialisation vient d'être envoyé à votre adresse email.",
      });
    } catch (error) {
      setNotice({ tone: "error", text: authErrorMessage(error) });
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-white dark:bg-[#0D1117] md:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <section className="hidden bg-[#111827] px-10 py-12 text-white md:flex md:items-center md:justify-center" aria-label="Avantages Wanteermako">
        <div className="w-full max-w-[440px]">
          <p className="mb-4 text-[.76rem] font-bold uppercase tracking-[.16em] text-gold">
            Acheter et vendre simplement
          </p>
          <h2 className="font-display text-[2rem] font-extrabold leading-tight">
            Votre espace de confiance pour les bonnes affaires.
          </h2>
          <p className="mt-4 max-w-[390px] text-[.95rem] leading-relaxed text-white/70">
            {BRAND.tagline}. Publiez, échangez et gérez vos annonces depuis un seul compte.
          </p>

          <ul className="mt-8 grid gap-4">
            {[
              ["publication", "Publication guidée", "Créez une annonce claire en quelques étapes."],
              ["contact", "Contact direct", "Échangez par messagerie, WhatsApp ou appel."],
              ["commission", "Aucune commission", "Vous gardez le contrôle de votre vente."],
            ].map(([key, title, description]) => (
              <li key={key} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white/10 text-gold ring-1 ring-white/10" aria-hidden="true">
                  {key === "publication" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                  ) : key === "contact" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>
                  )}
                </span>
                <span>
                  <span className="block text-[.9rem] font-bold">{title}</span>
                  <span className="mt-0.5 block text-[.78rem] leading-relaxed text-white/60">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex w-full flex-col justify-center px-5 py-8 sm:px-10 md:px-12">
        <div className="mx-auto w-full max-w-[400px]">
          <Link href="/" className="mb-7 inline-flex rounded-[10px] border border-gray-100 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white">
            <img src="/logo-full.jpg" alt={BRAND.name} className="h-10 w-auto object-contain" />
          </Link>

          <h1 className="font-display text-[1.55rem] font-extrabold text-gray-900 dark:text-white">
            {isSignup ? "Créer votre compte" : "Heureux de vous revoir"}
          </h1>
          <p className="mb-6 mt-2 text-[.88rem] leading-relaxed text-gray-500 dark:text-gray-400">
            {isSignup
              ? "Quelques secondes suffisent pour rejoindre Wanteermako."
              : "Connectez-vous pour retrouver vos annonces et vos messages."}
          </p>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isBusy}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[10px] border-2 border-gray-200 bg-white px-4 text-[.92rem] font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green/20 disabled:cursor-wait disabled:opacity-60 dark:border-white/15 dark:bg-[#161B22] dark:text-white"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {oauthLoading ? "Ouverture de Google..." : "Continuer avec Google"}
          </button>

          <div className="my-5 flex items-center gap-3 text-[.78rem] text-gray-400" aria-hidden="true">
            <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
            ou avec votre email
            <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
          </div>

          {notice && (
            <div
              id="auth-notice"
              role={notice.tone === "error" ? "alert" : "status"}
              aria-live="polite"
              className={
                "mb-4 rounded-[8px] border px-3.5 py-3 text-[.82rem] leading-relaxed " +
                (notice.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                  : notice.tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200")
              }
            >
              {notice.text}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="grid gap-4" aria-describedby={notice ? "auth-notice" : undefined} noValidate>
            {isSignup && (
              <div>
                <label htmlFor="auth-name" className="label dark:text-gray-300">Nom ou boutique</label>
                <input
                  id="auth-name"
                  name="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  required
                  className="input min-h-[48px] dark:bg-[#161B22]"
                  placeholder="Ex. Awa Ndiaye"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="label dark:text-gray-300">
                {isSignup ? "Adresse email" : "Email ou nom d'utilisateur"}
              </label>
              <input
                id="auth-email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type={isSignup ? "email" : "text"}
                inputMode={isSignup ? "email" : "text"}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                className="input min-h-[48px] dark:bg-[#161B22]"
                placeholder={isSignup ? "vous@exemple.com" : "vous@exemple.com"}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label htmlFor="auth-password" className="label !mb-0 dark:text-gray-300">Mot de passe</label>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isBusy}
                    className="text-[.75rem] font-semibold text-green hover:underline disabled:opacity-50"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={6}
                  required
                  className="input min-h-[48px] pr-12 dark:bg-[#161B22]"
                  aria-describedby={isSignup ? "password-help" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green dark:hover:text-white"
                >
                  {showPassword ? (
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m3 3 18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c5 0 9 4 10 8a12 12 0 0 1-2.1 4.1M6.6 6.6C4.4 8 2.8 10 2 12c1 4 5 8 10 8 1.3 0 2.5-.3 3.6-.8" /></svg>
                  ) : (
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              {isSignup && (
                <p id="password-help" className="mt-1.5 text-[.72rem] text-gray-500 dark:text-gray-400">
                  6 caractères minimum. Évitez un mot de passe déjà utilisé ailleurs.
                </p>
              )}
            </div>

            {signupBlocked && (
              <div role="alert" className="rounded-[10px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-[.82rem] font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                Les inscriptions sont momentanément fermées. Revenez bientôt ou contactez-nous.
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy || signupBlocked}
              className="btn btn-green min-h-[48px] w-full rounded-[10px] text-[.95rem] disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? "Veuillez patienter..." : signupBlocked ? "Inscriptions fermées" : isSignup ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>

          {isSignup && (
            <p className="mt-4 text-[.72rem] leading-relaxed text-gray-500 dark:text-gray-400">
              En créant votre compte, vous acceptez les <Link href="/cgu" className="font-semibold text-green hover:underline">conditions d'utilisation</Link> et la <Link href="/politique-confidentialite" className="font-semibold text-green hover:underline">politique de confidentialité</Link>.
            </p>
          )}

          <p className="mt-6 text-center text-[.85rem] text-gray-500 dark:text-gray-400">
            {isSignup ? (
              <>Déjà un compte ? <Link href={"/connexion" + routeQuery} className="font-bold text-green hover:underline">Se connecter</Link></>
            ) : (
              <>Nouveau sur {BRAND.name} ? <Link href={"/inscription" + routeQuery} className="font-bold text-green hover:underline">Créer un compte</Link></>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
