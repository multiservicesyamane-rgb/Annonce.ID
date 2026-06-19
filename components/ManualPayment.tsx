"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import { WAVE_NUMBER, ORANGE_NUMBER, whatsappLink, ONLINE_PAYMENT_ENABLED } from "@/lib/payment";

export default function ManualPayment({
  itemName,
  price,
  duration,
  listingId,
  boostKey,
  subKey,
  category,
}: {
  itemName: string;
  price: number;
  duration: string;
  listingId?: string;
  boostKey?: string;
  subKey?: string;
  category?: string;
}) {
  const [copied, setCopied] = useState("");
  const [processing, setProcessing] = useState(false);

  async function payTech() {
    setProcessing(true);
    try {
      const res = await fetch("/api/paytech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: price,
          itemName,
          refCommand: `WMK-${Date.now()}`,
          listingId: listingId || "",
          boostKey: boostKey || "",
          subKey: subKey || "",
          category: category || "",
        }),
      });
      if (res.status === 401) { alert("Connecte-toi d'abord pour payer en ligne."); window.location.href = "/connexion"; return; }
      const data = await res.json();
      if (data.redirect_url) window.location.href = data.redirect_url;
      else { alert(data.error || "Erreur d'initialisation du paiement."); setProcessing(false); }
    } catch {
      alert("Erreur de connexion au paiement.");
      setProcessing(false);
    }
  }

  function copy(num: string, label: string) {
    navigator.clipboard?.writeText(num.replace(/\s/g, ""));
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  const message =
    `Bonjour 👋, je souhaite activer : *${itemName}* (${formatNumber(price)} FCFA, ${duration}).\n` +
    `Je viens de faire le dépôt et je vous envoie le reçu. Merci d'activer mon plan.`;

  const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <li className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green text-[.78rem] font-extrabold text-white">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );

  return (
    <div className="mx-auto max-w-[540px] px-4">
      <div className="overflow-hidden rounded-[22px] border border-gray-100 bg-white dark:bg-[#111722] dark:border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]">
        {/* En-tête dégradé */}
        <div className="relative bg-gradient-to-br from-green-600 via-green-700 to-emerald-900 px-6 py-7 text-center text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #fff 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm text-[1.8rem] shadow-inner">🧾</div>
            <h2 className="font-display text-[1.35rem] font-extrabold">Finaliser votre commande</h2>
            <p className="mt-1 text-[.85rem] text-white/85">{itemName}</p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          {/* Montant en évidence */}
          <div className="mb-6 rounded-[16px] border border-green/20 bg-green/5 p-5 text-center">
            <div className="text-[.74rem] font-semibold uppercase tracking-wider text-gray-500">Montant à déposer</div>
            <div className="my-1 font-display text-[2.2rem] font-extrabold leading-none text-green">{formatNumber(price)}<span className="ml-1 text-[1rem] font-bold">FCFA</span></div>
            <div className="text-[.78rem] text-gray-500">Durée : <b className="text-gray-700 dark:text-gray-300">{duration}</b></div>
          </div>

          {/* Étapes */}
          <ol className="mb-5 space-y-4 text-[.9rem] text-gray-700 dark:text-gray-200">
            <Step n={1}>Déposez le montant sur l'un des numéros ci-dessous (appui long pour copier) :</Step>
          </ol>

          <div className="mb-5 grid gap-2.5">
            <button onClick={() => copy(WAVE_NUMBER, "wave")} className="group flex items-center gap-3 rounded-[14px] border border-[#1DC8FF]/40 bg-gradient-to-r from-[#1DC8FF]/15 to-transparent px-4 py-3.5 text-left transition hover:border-[#1DC8FF]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1DC8FF]/20 text-[1.1rem]">🌊</span>
              <span className="flex-1">
                <span className="block text-[.7rem] font-semibold uppercase tracking-wide text-[#0b97c4] dark:text-[#1DC8FF]">Wave</span>
                <span className="block font-mono text-[1.05rem] font-extrabold tracking-wide dark:text-white">{WAVE_NUMBER}</span>
              </span>
              <span className="rounded-md bg-white/70 dark:bg-white/10 px-2 py-1 text-[.7rem] font-bold text-gray-600 dark:text-gray-300">{copied === "wave" ? "✓ Copié" : "📋 Copier"}</span>
            </button>
            <button onClick={() => copy(ORANGE_NUMBER, "orange")} className="group flex items-center gap-3 rounded-[14px] border border-orange-400/40 bg-gradient-to-r from-orange-400/15 to-transparent px-4 py-3.5 text-left transition hover:border-orange-400">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-400/20 text-[1.1rem]">🟠</span>
              <span className="flex-1">
                <span className="block text-[.7rem] font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">Orange Money</span>
                <span className="block font-mono text-[1.05rem] font-extrabold tracking-wide dark:text-white">{ORANGE_NUMBER}</span>
              </span>
              <span className="rounded-md bg-white/70 dark:bg-white/10 px-2 py-1 text-[.7rem] font-bold text-gray-600 dark:text-gray-300">{copied === "orange" ? "✓ Copié" : "📋 Copier"}</span>
            </button>
          </div>

          <ol className="mb-6 space-y-4 text-[.9rem] text-gray-700 dark:text-gray-200">
            <Step n={2}>Envoyez la <b>capture du reçu</b> sur WhatsApp (bouton ci-dessous).</Step>
            <Step n={3}>Votre plan est activé <b>dès réception</b> du reçu. 🎉</Step>
          </ol>

          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#25D366] text-[1.05rem] font-bold text-white shadow-lg shadow-[#25D366]/30 transition-all hover:scale-[1.02] hover:bg-[#1da851]"
          >
            💬 Envoyer mon reçu sur WhatsApp
          </a>

          {/* Alternative : paiement automatique en ligne (PayTech) — masqué tant que
              le compte PayTech n'est pas activé en production. */}
          {ONLINE_PAYMENT_ENABLED && (
            <>
              <div className="my-4 flex items-center gap-3 text-[.75rem] text-gray-400">
                <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
                ou payer en ligne (automatique)
                <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
              </div>
              <button
                onClick={payTech}
                disabled={processing}
                className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-green-500 to-neon-gold text-[1rem] font-bold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-70"
              >
                {processing ? "⏳ Ouverture du paiement…" : `💳 Payer ${formatNumber(price)} FCFA en ligne (PayTech)`}
              </button>
            </>
          )}

          <div className="mt-6 flex items-center justify-center gap-4 border-t border-gray-100 dark:border-white/10 pt-4 text-[.72rem] font-medium text-gray-400">
            <span className="flex items-center gap-1">🔒 Sécurisé</span>
            <span className="flex items-center gap-1">⚡ Activation rapide</span>
            <span className="flex items-center gap-1">🧾 Reçu par email</span>
          </div>
        </div>
      </div>
    </div>
  );
}
