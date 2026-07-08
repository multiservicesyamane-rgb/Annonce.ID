"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import {
  CHARIOW_PAYMENT_ENABLED,
  CINETPAY_ONLINE_PAYMENT_ENABLED,
  WAVE_ONLINE_PAYMENT_ENABLED,
} from "@/lib/payment";

type Provider = "paytech" | "cinetpay" | "wave" | "chariow";

export default function PaymentFlow({
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
  const [processing, setProcessing] = useState<"" | Provider>("");
  const total = price;
  const secondaryProvidersEnabled = WAVE_ONLINE_PAYMENT_ENABLED || CINETPAY_ONLINE_PAYMENT_ENABLED;
  const hasProvider = CHARIOW_PAYMENT_ENABLED || secondaryProvidersEnabled;

  async function pay(provider: Provider) {
    setProcessing(provider);
    try {
      const res = await fetch(`/api/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          itemName: itemName,
          refCommand: `WMK-${Math.floor(Math.random() * 100000)}`,
          listingId: listingId || "",
          boostKey: boostKey || "",
          subKey: subKey || "",
          category: category || "",
        }),
      });

      if (res.status === 401) {
        alert("Votre session de connexion a expiré. Veuillez vous reconnecter.");
        window.location.href = "/connexion";
        return;
      }

      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        alert(data.error || "Erreur d'initialisation du paiement");
        setProcessing("");
      }
    } catch (err) {
      console.error(err);
      setProcessing("");
    }
  }

  return (
    <div className="mx-auto max-w-[500px] px-4">
      <div className="rounded-[16px] border-2 border-gray-100 bg-white dark:bg-[#111722]/80 dark:backdrop-blur-xl dark:border-white/10 p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-[2rem]">
          💳
        </div>
        <h2 className="mb-2 font-display text-[1.4rem] font-extrabold text-gray-800 dark:text-white">Finaliser la commande</h2>
        <p className="mb-8 text-[.9rem] text-gray-500 dark:text-gray-400">
          Vous êtes sur le point de souscrire à : <br />
          <b className="text-gold-dark dark:text-gold text-[1rem]">{itemName}</b>
        </p>

        <div className="mb-8 rounded-[12px] bg-gray-50 dark:bg-white/5 p-5 text-left border border-gray-100 dark:border-white/5">
          <Row k="Description" v={itemName} />
          <Row k="Durée" v={duration} muted />
          <div className="mt-4 flex justify-between border-t border-gray-200 dark:border-white/10 pt-4 text-[1.1rem] font-extrabold dark:text-white">
            <span>Total à payer</span>
            <span className="text-green">{formatNumber(total)} FCFA</span>
          </div>
        </div>

        {CHARIOW_PAYMENT_ENABLED && (
          <button
            onClick={() => pay("chariow")}
            disabled={!!processing}
            className="btn btn-block h-[56px] text-[1.05rem] font-bold text-white bg-gray-950 hover:bg-gray-800 shadow-lg shadow-gray-950/20 disabled:opacity-70 transition-all hover:scale-[1.02]"
          >
            {processing === "chariow" ? "⏳ Ouverture de Chariow…" : `Payer ${formatNumber(total)} FCFA avec Chariow`}
          </button>
        )}

        {CHARIOW_PAYMENT_ENABLED && secondaryProvidersEnabled && (
          <div className="my-4 flex items-center gap-3 text-[.75rem] text-gray-400">
            <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
            ou autre moyen
            <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
          </div>
        )}

        {WAVE_ONLINE_PAYMENT_ENABLED && (
          <button
            onClick={() => pay("wave")}
            disabled={!!processing}
            className="btn btn-block h-[56px] text-[1.1rem] font-bold text-white bg-[#1DC8FF] hover:bg-[#08b4ec] shadow-lg shadow-[#1DC8FF]/30 disabled:opacity-70 transition-all hover:scale-[1.02]"
          >
            {processing === "wave" ? "⏳ Ouverture de Wave…" : `🌊 PAYER ${formatNumber(total)} FCFA avec Wave`}
          </button>
        )}

        {CINETPAY_ONLINE_PAYMENT_ENABLED && (
          <button
            onClick={() => pay("cinetpay")}
            disabled={!!processing}
            className={`${WAVE_ONLINE_PAYMENT_ENABLED ? "mt-3" : ""} btn btn-green btn-block h-[52px] text-[1rem] font-bold shadow-lg shadow-green/30 disabled:opacity-70 transition-all hover:scale-[1.02]`}
          >
            {processing === "cinetpay" ? "⏳ Ouverture du paiement…" : `💳 Orange Money · MTN · Moov · Carte`}
          </button>
        )}

        {!hasProvider && (
          <p className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-[.85rem] font-semibold text-amber-800">
            Aucun prestataire en ligne n'est active. Configurez NEXT_PUBLIC_PAYMENT_PROVIDER pour continuer.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[.75rem] text-gray-400">
          <span>🔒 Paiement 100% sécurisé · Chariow · Wave · Orange Money · MTN · Moov · Carte</span>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 text-[.9rem]">
      <span className={muted ? "text-gray-500" : "font-medium text-gray-700 dark:text-gray-300"}>{k}</span>
      <span className="font-bold text-gray-900 dark:text-white text-right">{v}</span>
    </div>
  );
}
