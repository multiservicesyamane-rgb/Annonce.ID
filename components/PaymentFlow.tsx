"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";

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
  const [processing, setProcessing] = useState(false);
  const total = price;

  async function pay() {
    setProcessing(true);
    try {
      const res = await fetch("/api/paytech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          itemName: itemName,
          refCommand: `AID-${Math.floor(Math.random() * 100000)}`,
          listingId: listingId || "",
          boostKey: boostKey || "",
          subKey: subKey || "",
          category: category || "",
        }),
      });
      
      if (res.status === 401) {
        alert("Votre session de connexion a expiré ou est inexistante. Veuillez vous reconnecter.");
        window.location.href = "/connexion";
        return;
      }

      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url; // Redirection PayTech
      } else {
        alert(data.error || "Erreur d'initialisation du paiement");
        setProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setProcessing(false);
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

        <button
          onClick={pay}
          disabled={processing}
          className="btn btn-green btn-block h-[56px] text-[1.1rem] font-bold shadow-lg shadow-green/30 disabled:opacity-70 transition-all hover:scale-[1.02]"
        >
          {processing ? "⏳ Redirection vers PayTech..." : `💳 PAYER ${formatNumber(total)} FCFA`}
        </button>

        <div className="mt-6 flex items-center justify-center gap-2 text-[.75rem] text-gray-400">
          <span>🔒 Paiement 100% sécurisé via</span>
          <strong className="text-gray-600 dark:text-gray-300">PayTech</strong>
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
