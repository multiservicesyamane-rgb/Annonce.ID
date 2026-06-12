"use client";

import { useState } from "react";
import Link from "next/link";
import { PAYMENT_METHODS, type Boost } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

/** Paiement mobile money (section 13). PAS de panier produit — uniquement le boost. */
export default function PaymentFlow({ boost }: { boost: Boost }) {
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [phone, setPhone] = useState("77 123 45 67");
  const [done, setDone] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fees = method.key === "carte" ? Math.round(boost.price * 0.015) : 0;
  const total = boost.price + fees;

  function pay() {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 2000);
  }

  const steps = ["Annonce", "Options", "Paiement", "Confirmation"];
  const current = done ? 4 : 3;

  return (
    <div>
      {/* Progress */}
      <div className="mx-auto mt-5 flex max-w-[1000px] items-center gap-2 px-4 text-[.78rem]">
        {steps.map((s, i) => {
          const n = i + 1;
          const state = n < current ? "done" : n === current ? "active" : "todo";
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${state === "active" ? "font-semibold text-green" : state === "done" ? "text-gold-dark" : "text-gray-300"}`}>
                <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[.7rem] font-bold ${state === "active" ? "bg-green text-white" : state === "done" ? "bg-gold text-dark-900" : "bg-gray-100 text-gray-500"}`}>
                  {state === "done" ? "✓" : n}
                </span>
                {s}
              </div>
              {i < steps.length - 1 && <span className="h-0.5 w-[40px] bg-gray-100" />}
            </div>
          );
        })}
      </div>

      {done ? (
        <div className="mx-auto my-8 max-w-[560px] px-4">
          <div className="rounded-lg border-[1.5px] border-gray-100 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 animate-fadeUp items-center justify-center rounded-full bg-green-pale">
              <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="mb-2 font-display text-[1.4rem] font-extrabold">Paiement réussi ! 🎉</h2>
            <p className="mb-6 text-[.9rem] text-gray-500">
              Votre annonce est maintenant <b className="text-green">{boost.name}</b>
            </p>
            <div className="mb-6 rounded-[10px] bg-gray-50 p-4 text-left">
              <Row k="Référence" v="#AID-2026-08432" mono />
              <Row k="Montant" v={`${formatNumber(total)} FCFA`} />
              <Row k="Méthode" v={method.name} />
            </div>
            <div className="flex flex-col gap-2.5">
              <Link href="/dashboard" className="btn btn-green btn-block btn-lg">Voir mon annonce →</Link>
              <button onClick={() => {}} className="btn btn-wa btn-block">💬 Partager</button>
              <Link href="/publier" className="btn btn-outline btn-block">Publier une autre annonce</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto my-6 grid max-w-[1000px] gap-6 px-4 md:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-4 rounded-lg border-[1.5px] border-gray-100 bg-white p-6">
              <h2 className="mb-4 font-display text-[1.1rem] font-bold">Méthode de paiement</h2>
              <div className="flex flex-col gap-2.5">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.key}
                    onClick={() => setMethod(m)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 bg-white p-3.5 transition ${method.key === m.key ? "border-green bg-green/[.04]" : "border-gray-100 hover:border-gold"}`}
                  >
                    <input type="radio" name="pay" checked={method.key === m.key} onChange={() => setMethod(m)} className="accent-green" />
                    <span className="flex h-7 w-10 items-center justify-center rounded text-[1.2rem]" style={{ background: m.color, color: "#fff" }}>{m.icon}</span>
                    <span>
                      <strong className="block text-[.88rem]">{m.name}</strong>
                      <span className="text-[.75rem] text-gray-500">{m.scope}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border-[1.5px] border-gray-100 bg-white p-6">
              <h2 className="mb-4 font-display text-[1.1rem] font-bold">Paiement par {method.name}</h2>
              {method.key === "carte" ? (
                <div className="grid gap-4">
                  <div><label className="label">Numéro de carte <span className="text-brand-red">*</span></label><input className="input" placeholder="0000 0000 0000 0000" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Expiration</label><input className="input" placeholder="MM/AA" /></div>
                    <div><label className="label">CVV</label><input className="input" placeholder="123" /></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="label">Numéro Mobile Money <span className="text-brand-red">*</span></label>
                    <div className="flex">
                      <span className="rounded-l-[10px] border-2 border-r-0 border-gray-100 bg-gray-50 px-3 py-2.5 text-[.88rem]">🇸🇳 +221</span>
                      <input className="input rounded-l-none" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="rounded-[10px] border-l-[3px] border-gold bg-gold-pale p-4">
                    <p className="mb-3 text-[.83rem] font-semibold">Comment ça marche :</p>
                    {["Cliquez sur « Payer maintenant »", "Recevez une notification sur votre téléphone", "Validez avec votre code secret"].map((t, i) => (
                      <div key={t} className="mb-2 flex gap-3 rounded-[10px] bg-gray-50 p-3 text-[.83rem] text-gray-700 last:mb-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green text-[.72rem] font-bold text-white">{i + 1}</span>
                        {t}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Récap (sticky) */}
          <div>
            <div className="rounded-lg border-[1.5px] border-gray-100 bg-white p-5 md:sticky md:top-[calc(64px+1rem)]">
              <h3 className="mb-4 font-display text-base font-bold">Récapitulatif</h3>
              <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=120&h=120&fit=crop" alt="" className="h-14 w-14 rounded-lg object-cover" />
                <div className="min-w-0">
                  <div className="truncate text-[.85rem] font-semibold">Villa F5 piscine Almadies</div>
                  <div className="text-[.75rem] text-gray-500">Immobilier · Dakar</div>
                </div>
              </div>
              <Row k={`Boost ${boost.name}`} v={`${formatNumber(boost.price)} FCFA`} />
              <Row k="Durée" v={boost.duration} muted />
              {fees > 0 && <Row k="Frais (1,5%)" v={`${formatNumber(fees)} FCFA`} muted />}
              <div className="mt-2 flex justify-between border-t border-gray-100 pt-3 text-base font-bold">
                <span>Total</span>
                <span className="text-green">{formatNumber(total)} FCFA</span>
              </div>
              <button onClick={pay} disabled={processing} className="btn btn-gold btn-block btn-lg mt-4 disabled:opacity-70">
                {processing ? "📱 Notification envoyée…" : `🔒 Payer · ${formatNumber(total)} FCFA`}
              </button>
              <Link href="/publier" className="mt-3 block text-center text-[.8rem] text-gray-500">← Modifier</Link>
              <div className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-[.75rem] text-gray-500">
                🔒 Paiement sécurisé · Certifié CinetPay & PCI-DSS
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v, muted, mono }: { k: string; v: string; muted?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between py-1 text-[.85rem]">
      <span className={muted ? "text-gray-500" : ""}>{k}</span>
      <span className={`${mono ? "font-mono" : ""} font-semibold`}>{v}</span>
    </div>
  );
}
