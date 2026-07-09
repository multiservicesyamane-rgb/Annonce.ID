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
    <div className="mx-auto max-w-[540px] px-3 sm:px-4">
      <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_20px_60px_-20px_rgba(124,92,252,0.45)] dark:border-white/10 dark:bg-[#111722]/90 dark:backdrop-blur-xl animate-fadeUp">
        {/* En-tête dégradé */}
        <div className="relative bg-gradient-to-br from-[#6366F1] via-[#7C5CFC] to-[#A855F7] px-5 py-7 text-center text-white sm:px-8 sm:py-8">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 15% 20%, #fff 1.5px, transparent 1.5px)", backgroundSize: "26px 26px" }}
          />
          <div className="relative">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-[1.7rem] backdrop-blur-sm ring-1 ring-white/25 sm:h-16 sm:w-16 sm:text-[2rem]">
              💳
            </div>
            <h2 className="font-display text-[1.25rem] font-extrabold sm:text-[1.45rem]">Finaliser la commande</h2>
            <p className="mt-1 text-[.85rem] text-white/80">Paiement sécurisé · Activation automatique</p>
          </div>
        </div>

        {/* Corps */}
        <div className="p-5 sm:p-7">
          {/* Récapitulatif */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 sm:p-5 dark:border-white/5 dark:bg-white/5">
            <Row k="Formule" v={itemName} />
            <Row k="Durée" v={duration} muted />
            <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-white/10">
              <span className="text-[.95rem] font-extrabold text-gray-800 dark:text-white">Total à payer</span>
              <span className="font-display text-[1.45rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#A855F7] sm:text-[1.6rem]">
                {formatNumber(total)} <span className="text-[.85rem]">FCFA</span>
              </span>
            </div>
          </div>

          {/* Moyens de paiement acceptés */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {["🌊 Wave", "🟠 Orange Money", "🟡 MTN", "🔵 Moov", "💳 Carte"].map((m) => (
              <span
                key={m}
                className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[.68rem] font-bold text-gray-600 sm:text-[.72rem] dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
              >
                {m}
              </span>
            ))}
          </div>

          {/* Bouton principal */}
          <div className="mt-5 space-y-3">
            {CHARIOW_PAYMENT_ENABLED && (
              <button
                onClick={() => pay("chariow")}
                disabled={!!processing}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#7C5CFC] to-[#A855F7] px-4 py-4 text-[1rem] font-extrabold text-white shadow-lg shadow-[#7C5CFC]/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-[#7C5CFC]/40 disabled:opacity-70 disabled:hover:scale-100 sm:py-[18px] sm:text-[1.05rem]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {processing === "chariow" ? "⏳ Ouverture du paiement sécurisé…" : `Payer ${formatNumber(total)} FCFA maintenant`}
              </button>
            )}

            {CHARIOW_PAYMENT_ENABLED && secondaryProvidersEnabled && (
              <div className="flex items-center gap-3 text-[.72rem] font-semibold uppercase tracking-wider text-gray-400">
                <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
                ou
                <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
              </div>
            )}

            {WAVE_ONLINE_PAYMENT_ENABLED && (
              <button
                onClick={() => pay("wave")}
                disabled={!!processing}
                className="w-full rounded-2xl bg-[#1DC8FF] px-4 py-4 text-[1rem] font-extrabold text-white shadow-lg shadow-[#1DC8FF]/30 transition-all hover:scale-[1.02] hover:bg-[#08b4ec] disabled:opacity-70 disabled:hover:scale-100"
              >
                {processing === "wave" ? "⏳ Ouverture de Wave…" : `🌊 Payer ${formatNumber(total)} FCFA avec Wave`}
              </button>
            )}

            {CINETPAY_ONLINE_PAYMENT_ENABLED && (
              <button
                onClick={() => pay("cinetpay")}
                disabled={!!processing}
                className="w-full rounded-2xl bg-green px-4 py-3.5 text-[.95rem] font-extrabold text-white shadow-lg shadow-green/30 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
              >
                {processing === "cinetpay" ? "⏳ Ouverture du paiement…" : `💳 Orange Money · MTN · Moov · Carte`}
              </button>
            )}

            {!hasProvider && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[.85rem] font-semibold text-amber-800">
                Aucun prestataire en ligne n'est activé. Configurez NEXT_PUBLIC_PAYMENT_PROVIDER pour continuer.
              </p>
            )}
          </div>

          {/* Réassurance */}
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center dark:border-white/5">
            {[
              { icon: "🔒", label: "Paiement crypté" },
              { icon: "⚡", label: "Activation auto" },
              { icon: "🧾", label: "Reçu par email" },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1">
                <span className="text-[1.05rem]">{t.icon}</span>
                <span className="text-[.65rem] font-semibold text-gray-400 sm:text-[.7rem]">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[.72rem] text-gray-400">
        🔒 Transaction 100% sécurisée — aucune donnée bancaire n'est stockée sur Wanteermako.
      </p>
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-[.88rem]">
      <span className={muted ? "text-gray-400 dark:text-gray-500" : "font-medium text-gray-600 dark:text-gray-300"}>{k}</span>
      <span className="text-right font-bold text-gray-900 dark:text-white">{v}</span>
    </div>
  );
}
