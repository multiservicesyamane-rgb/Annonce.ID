"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import { WAVE_NUMBER, ORANGE_NUMBER, whatsappLink } from "@/lib/payment";

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

  return (
    <div className="mx-auto max-w-[520px] px-4">
      <div className="rounded-[16px] border-2 border-gray-100 bg-white dark:bg-[#111722]/80 dark:backdrop-blur-xl dark:border-white/10 p-6 sm:p-8 shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green/10 text-[2rem]">🧾</div>
        <h2 className="mb-1 text-center font-display text-[1.4rem] font-extrabold text-gray-800 dark:text-white">Paiement par dépôt</h2>
        <p className="mb-6 text-center text-[.88rem] text-gray-500 dark:text-gray-400">
          Formule choisie : <b className="text-green">{itemName}</b>
        </p>

        <div className="mb-6 rounded-[12px] bg-gray-50 dark:bg-white/5 p-4 border border-gray-100 dark:border-white/5">
          <div className="flex justify-between text-[.9rem]"><span className="text-gray-500">Durée</span><span className="font-bold dark:text-white">{duration}</span></div>
          <div className="mt-2 flex justify-between border-t border-gray-200 dark:border-white/10 pt-2 text-[1.15rem] font-extrabold dark:text-white">
            <span>Montant à déposer</span><span className="text-green">{formatNumber(price)} FCFA</span>
          </div>
        </div>

        {/* Étapes */}
        <ol className="mb-5 space-y-3 text-[.88rem] text-gray-700 dark:text-gray-200">
          <li className="flex gap-2"><b className="text-green">1.</b> Dépose <b>{formatNumber(price)} FCFA</b> sur l'un des numéros ci-dessous :</li>
        </ol>

        <div className="mb-4 grid gap-2">
          <button onClick={() => copy(WAVE_NUMBER, "wave")} className="flex items-center justify-between rounded-[12px] border border-[#1DC8FF]/40 bg-[#1DC8FF]/10 px-4 py-3">
            <span className="flex items-center gap-2 font-bold text-[#0b97c4] dark:text-[#1DC8FF]">🌊 Wave</span>
            <span className="font-mono text-[1rem] font-extrabold dark:text-white">{WAVE_NUMBER}</span>
            <span className="text-[.72rem] text-gray-500">{copied === "wave" ? "✓ Copié" : "Copier"}</span>
          </button>
          <button onClick={() => copy(ORANGE_NUMBER, "orange")} className="flex items-center justify-between rounded-[12px] border border-orange-400/40 bg-orange-400/10 px-4 py-3">
            <span className="flex items-center gap-2 font-bold text-orange-600 dark:text-orange-400">🟠 Orange Money</span>
            <span className="font-mono text-[1rem] font-extrabold dark:text-white">{ORANGE_NUMBER}</span>
            <span className="text-[.72rem] text-gray-500">{copied === "orange" ? "✓ Copié" : "Copier"}</span>
          </button>
        </div>

        <ol className="mb-6 space-y-3 text-[.88rem] text-gray-700 dark:text-gray-200" start={2}>
          <li className="flex gap-2"><b className="text-green">2.</b> Envoie la <b>capture du reçu</b> sur WhatsApp (bouton ci-dessous).</li>
          <li className="flex gap-2"><b className="text-green">3.</b> Ton plan est activé <b>dès réception</b> du reçu. 🎉</li>
        </ol>

        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-block h-[56px] text-[1.05rem] font-bold text-white bg-[#25D366] hover:bg-[#1da851] shadow-lg shadow-[#25D366]/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          💬 Envoyer mon reçu sur WhatsApp
        </a>

        {/* Alternative : paiement automatique en ligne (PayTech) */}
        <div className="my-4 flex items-center gap-3 text-[.75rem] text-gray-400">
          <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
          ou payer en ligne (automatique)
          <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
        </div>

        <button
          onClick={payTech}
          disabled={processing}
          className="btn btn-block h-[52px] text-[1rem] font-bold text-white bg-gradient-to-r from-green-500 to-neon-gold shadow-lg disabled:opacity-70 transition-all hover:scale-[1.02]"
        >
          {processing ? "⏳ Ouverture du paiement…" : `💳 Payer ${formatNumber(price)} FCFA en ligne (PayTech)`}
        </button>

        <p className="mt-5 text-center text-[.75rem] text-gray-400">🔒 Wave · Orange Money · Carte · activation automatique ou par reçu</p>
      </div>
    </div>
  );
}
