"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  async function sendOtp() {
    setStage("otp");
    setTimeout(() => inputs.current[0]?.focus(), 50);
    try {
      await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
    } catch {
      /* mode démo : ignore */
    }
    show("📱 Code envoyé ! (démo : 1234)");
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
    const res = await fetch("/api/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: code === "1234" }));
    if (res.ok) {
      show("✓ Connexion réussie !");
      setTimeout(() => router.push("/dashboard"), 1000);
    } else {
      show("✗ Code incorrect — essayez 1234");
    }
  }

  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");

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
            <p className="mb-2 text-[.85rem] text-gray-500">
              Code envoyé au <b>{phone || "+221 77 000 00 00"}</b>
            </p>
            <div className="mb-4 rounded-[10px] border-[1.5px] border-dashed border-gold bg-gold-pale p-3 text-center text-[.82rem] font-semibold text-gold-dark">
              👉 Code démo : <b className="font-display text-[1.2rem] tracking-[.2em]">1234</b>
              <br />
              <span className="text-[.7rem] font-normal">(En production, un vrai SMS serait envoyé)</span>
            </div>
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
            <p className="mt-3 text-center text-[.8rem] text-gray-500">
              Pas reçu ?{" "}
              <button type="button" onClick={() => show("Renvoi SMS… (démo 1234)")} className="font-semibold text-green">
                Renvoyer
              </button>
            </p>
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
            <button type="button" onClick={() => show("Facebook…")} className="flex w-full items-center justify-center gap-2 rounded-[10px] border-2 border-gray-100 bg-white py-2.5 text-[.88rem] font-semibold text-gray-700 hover:border-brand-blue hover:text-brand-blue">
              📘 Continuer avec Facebook
            </button>
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
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Pays <span className="text-brand-red">*</span></label>
                <select className="input">
                  {COUNTRIES.map((c) => (
                    <option key={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Ville <span className="text-brand-red">*</span></label>
                <select className="input">
                  <option>Dakar</option>
                  <option>Abidjan</option>
                </select>
              </div>
            </div>
            <button type="button" onClick={sendOtp} className="btn btn-green btn-block btn-lg">
              Créer mon compte →
            </button>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-pale px-3 py-2.5 text-[.75rem] text-green">
              🔒 Données protégées · Sans publicité · Gratuit
            </div>
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
