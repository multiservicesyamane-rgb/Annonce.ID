"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES } from "@/lib/constants";

/** Connexion / inscription par téléphone + OTP. Code démo 1234 affiché à l'écran. */
export default function AuthForm({ mode = "login" }: { mode?: "login" | "signup" }) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">(mode);
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [seconds, setSeconds] = useState(300);
  const [toast, setToast] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    if (stage !== "otp") return;
    setSeconds(300);
    const id = setInterval(() => setSeconds((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [stage]);

  // ... (inside component)
  const supabase = createClient();

  async function sendOtp() {
    setStage("otp");
    setTimeout(() => inputs.current[0]?.focus(), 50);
    
    // Tentative d'envoi réel via Supabase
    const { error } = await supabase.auth.signInWithOtp({ phone });
    
    if (error) {
      console.error(error);
      show("⚠ Erreur lors de l'envoi du SMS. Veuillez réessayer.");
    } else {
      show("📱 Code envoyé par SMS !");
    }
  }

  function onOtpChange(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 3) inputs.current[i + 1]?.focus();
  }

  async function verify() {
    const code = otp.join("");
    if (code.length < 4) return show("⚠ Entrez les 4 chiffres");
    
    // Vérification réelle via Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms"
    });

    if (!error && data?.session) {
      show("✓ Connexion réussie !");
      setTimeout(() => router.push("/dashboard"), 1000);
    } else {
      show("✗ Code incorrect ou expiré");
    }
  }

  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");

  const GoogleButton = () => (
    <button 
      type="button" 
      onClick={async () => {
        show("Redirection vers Google...");
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/dashboard` }
        });
      }} 
      className="flex w-full items-center justify-center gap-2 rounded-[10px] border-2 border-gray-100 bg-white py-2.5 text-[.88rem] font-semibold text-gray-700 hover:border-gray-300 transition-colors mt-3"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
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
            Rejoignez <em className="not-italic text-neon-gold [text-shadow:0_0_16px_rgba(255,201,60,.5)]">1,2 million</em> d&apos;utilisateurs dans 27 pays
          </h2>
          <div className="flex flex-col gap-3">
            {[
              ["🔒", "Connexion sécurisée par SMS OTP"],
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
        <Link href="/" className="mb-6 font-display text-[1.3rem] font-extrabold text-green">
          Annonce<span className="text-gold-dark">.ID</span>
        </Link>

        <div className="mb-6 flex border-b border-gray-100">
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setStage("form");
              }}
              className={`flex-1 border-b-[2.5px] py-2.5 text-[.9rem] font-semibold transition ${
                tab === t ? "border-green text-green" : "border-transparent text-gray-500"
              }`}
            >
              {t === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        {stage === "otp" ? (
          <div>
            <button
              type="button"
              onClick={() => setStage("form")}
              className="mb-4 text-[.82rem] text-gray-500 hover:text-green"
            >
              ← Modifier le numéro
            </button>
            <h2 className="mb-1 font-display text-[1.2rem] font-extrabold">Code de vérification</h2>
            <p className="mb-4 text-[.85rem] text-gray-500">
              Code envoyé au <b>{phone || "+221 77 000 00 00"}</b>
            </p>
            <p className="mb-2 text-[.78rem] text-gray-400">
              Valable <span className="font-semibold text-green">{mm}:{ss}</span>
            </p>
            <div className="my-5 flex justify-center gap-2">
              {otp.map((v, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  type="tel"
                  maxLength={1}
                  value={v}
                  onChange={(e) => onOtpChange(i, e.target.value)}
                  className="h-[60px] w-[52px] rounded-[10px] border-2 border-gray-100 bg-gray-50 text-center font-display text-2xl font-bold text-green outline-none focus:border-green focus:bg-white focus:ring-4 focus:ring-green/10"
                />
              ))}
            </div>
            <button type="button" onClick={verify} className="btn btn-green btn-block btn-lg">
              Vérifier le code
            </button>
          </div>
        ) : tab === "login" ? (
          <div>
            <h2 className="mb-1 font-display text-[1.2rem] font-extrabold">Bon retour 👋</h2>
            <p className="mb-6 text-[.85rem] text-gray-500">Entrez votre numéro pour recevoir un code SMS</p>
            <PhoneInput phone={phone} setPhone={setPhone} />
            <button type="button" onClick={sendOtp} className="btn btn-green btn-block btn-lg mt-4">
              Recevoir mon code SMS →
            </button>
            <div className="my-4 flex items-center gap-3 text-[.8rem] text-gray-300">
              <span className="h-px flex-1 bg-gray-100" /> ou <span className="h-px flex-1 bg-gray-100" />
            </div>
            <GoogleButton />
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-pale px-3 py-2.5 text-[.75rem] text-green">
              🔒 Connexion sécurisée · Sans mot de passe · Code valable 5 min
            </div>
          </div>
        ) : (
          <div>
            <h2 className="mb-1 font-display text-[1.2rem] font-extrabold">Créez votre compte</h2>
            <p className="mb-6 text-[.85rem] text-gray-500">Gratuit · Prêt en 2 minutes</p>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prénom <span className="text-brand-red">*</span></label>
                <input className="input" placeholder="Moussa" />
              </div>
              <div>
                <label className="label">Nom <span className="text-brand-red">*</span></label>
                <input className="input" placeholder="Diallo" />
              </div>
            </div>
            <div className="mb-3">
              <label className="label">Téléphone <span className="text-brand-red">*</span></label>
              <PhoneInput phone={phone} setPhone={setPhone} />
            </div>
            <button type="button" onClick={sendOtp} className="btn btn-green btn-block btn-lg">
              Créer mon compte →
            </button>
            <div className="my-4 flex items-center gap-3 text-[.8rem] text-gray-300">
              <span className="h-px flex-1 bg-gray-100" /> ou <span className="h-px flex-1 bg-gray-100" />
            </div>
            <GoogleButton />
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-neon-gold bg-dark-900 px-5 py-2.5 text-[.88rem] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function PhoneInput({ phone, setPhone }: { phone: string; setPhone: (v: string) => void }) {
  return (
    <div className="flex">
      <select className="input max-w-[120px] rounded-r-none border-r-0">
        {COUNTRIES.slice(0, 8).map((c) => (
          <option key={c.code}>{c.flag} {c.dial}</option>
        ))}
      </select>
      <input
        className="input rounded-l-none"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="77 000 00 00"
      />
    </div>
  );
}
