"use client";

import { useState } from "react";
import Link from "next/link";
import { type Boost } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export default function PaymentFlow({ boost }: { boost: Boost }) {
  const [processing, setProcessing] = useState(false);
  const total = boost.price; // PayTech handles their own fees generally, or keep simple

  async function pay() {
    setProcessing(true);
    try {
      const res = await fetch("/api/paytech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          itemName: `Boost ${boost.name}`,
          refCommand: `AID-${Math.floor(Math.random() * 100000)}`
        })
      });
      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url; // Redirection PayTech
      } else {
        alert("Erreur d'initialisation du paiement");
        setProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setProcessing(false);
    }
  }

  return (
    <div className="mx-auto my-12 max-w-[500px] px-4">
      <div className="rounded-[16px] border-2 border-gray-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-[2rem]">
          🚀
        </div>
        <h2 className="mb-2 font-display text-[1.4rem] font-extrabold text-gray-800">Finaliser la commande</h2>
        <p className="mb-8 text-[.9rem] text-gray-500">
          Vous êtes sur le point de booster votre annonce en <b className="text-gold-dark">{boost.name}</b>
        </p>

        <div className="mb-8 rounded-[12px] bg-gray-50 p-5 text-left">
          <Row k="Service" v={`Boost ${boost.name}`} />
          <Row k="Durée" v={boost.duration} muted />
          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-[1.1rem] font-extrabold">
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
          <strong className="text-gray-600">PayTech</strong>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 text-[.9rem]">
      <span className={muted ? "text-gray-500" : "font-medium text-gray-700"}>{k}</span>
      <span className="font-bold text-gray-900">{v}</span>
    </div>
  );
}
