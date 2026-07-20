"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import { getCurrentPathWithSearch, getLoginUrl } from "@/lib/authRedirect";
import {
  CHARIOW_PAYMENT_ENABLED,
  CINETPAY_ONLINE_PAYMENT_ENABLED,
  WAVE_ONLINE_PAYMENT_ENABLED,
} from "@/lib/payment";
import { BRAND } from "@/lib/constants";

type Provider = "paytech" | "cinetpay" | "wave" | "chariow";

type PaymentFlowProps = {
  itemName: string;
  price: number;
  duration: string;
  listingId?: string;
  boostKey?: string;
  subKey?: string;
  category?: string;
};

export default function PaymentFlow({
  itemName,
  price,
  duration,
  listingId,
  boostKey,
  subKey,
  category,
}: PaymentFlowProps) {
  const [processing, setProcessing] = useState<"" | Provider>("");
  const [error, setError] = useState("");

  const paytechEnabled =
    !CHARIOW_PAYMENT_ENABLED &&
    !WAVE_ONLINE_PAYMENT_ENABLED &&
    !CINETPAY_ONLINE_PAYMENT_ENABLED;
  const hasProvider =
    CHARIOW_PAYMENT_ENABLED ||
    WAVE_ONLINE_PAYMENT_ENABLED ||
    CINETPAY_ONLINE_PAYMENT_ENABLED ||
    paytechEnabled;

  const methodLabels = Array.from(
    new Set(
      [
        CHARIOW_PAYMENT_ENABLED ? "Mobile Money ou carte" : "",
        WAVE_ONLINE_PAYMENT_ENABLED ? "Wave" : "",
        CINETPAY_ONLINE_PAYMENT_ENABLED ? "Orange Money, MTN, Moov ou carte" : "",
        paytechEnabled ? "Mobile Money ou carte" : "",
      ].filter(Boolean),
    ),
  );

  async function pay(provider: Provider) {
    if (processing) return;
    setProcessing(provider);
    setError("");

    try {
      const response = await fetch("/api/" + provider, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: price,
          itemName,
          listingId: listingId || "",
          boostKey: boostKey || "",
          subKey: subKey || "",
          category: category || "",
        }),
      });

      if (response.status === 401) {
        window.location.href = getLoginUrl(getCurrentPathWithSearch());
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.redirect_url) {
        setError(data.error || "Le paiement n’a pas pu être initialisé. Réessayez.");
        return;
      }

      window.location.href = data.redirect_url;
    } catch {
      setError("Connexion au service de paiement impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setProcessing("");
    }
  }

  return (
    <div className="mx-auto max-w-[620px]">
      <section
        aria-labelledby="checkout-summary-title"
        className="overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#161B22]"
      >
        <header className="border-b border-gray-100 px-5 py-4 dark:border-white/10 sm:px-6">
          <h2 id="checkout-summary-title" className="font-display text-[1.05rem] font-extrabold text-gray-900 dark:text-white">
            Récapitulatif
          </h2>
          <p className="mt-1 text-[.76rem] text-gray-500 dark:text-gray-400">Activation automatique après confirmation du paiement.</p>
        </header>

        <div className="p-5 sm:p-6">
          <dl className="grid gap-3 text-[.86rem]">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">Formule</dt>
              <dd className="max-w-[65%] text-right font-bold text-gray-900 dark:text-white">{itemName}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">Durée</dt>
              <dd className="text-right font-semibold text-gray-700 dark:text-gray-200">{duration}</dd>
            </div>
            <div className="mt-1 flex items-end justify-between gap-4 border-t border-dashed border-gray-200 pt-4 dark:border-white/10">
              <dt className="font-bold text-gray-900 dark:text-white">Total à payer</dt>
              <dd className="text-right font-display text-[1.55rem] font-extrabold leading-none text-green">
                {formatNumber(price)} <span className="text-[.78rem]">FCFA</span>
              </dd>
            </div>
          </dl>

          {methodLabels.length > 0 && (
            <div className="mt-5 rounded-[8px] bg-gray-50 px-3 py-2.5 text-[.74rem] text-gray-600 dark:bg-white/5 dark:text-gray-300">
              <span className="font-bold">Moyens disponibles : </span>
              {methodLabels.join(" · ")}
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-[8px] border border-red-200 bg-red-50 px-3.5 py-3 text-[.82rem] leading-relaxed text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="mt-5 grid gap-3" aria-busy={Boolean(processing)}>
            {CHARIOW_PAYMENT_ENABLED && (
              <button
                type="button"
                onClick={() => pay("chariow")}
                disabled={Boolean(processing)}
                className="btn btn-green min-h-[50px] w-full text-[.94rem] disabled:cursor-wait disabled:opacity-60"
              >
                {processing === "chariow" ? "Ouverture du paiement..." : "Continuer vers le paiement sécurisé"}
              </button>
            )}

            {WAVE_ONLINE_PAYMENT_ENABLED && (
              <button
                type="button"
                onClick={() => pay("wave")}
                disabled={Boolean(processing)}
                className="flex min-h-[50px] w-full items-center justify-center rounded-[8px] bg-[#1DC8FF] px-4 text-[.94rem] font-extrabold text-white transition hover:bg-[#08b4ec] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1DC8FF]/25 disabled:cursor-wait disabled:opacity-60"
              >
                {processing === "wave" ? "Ouverture de Wave..." : "Payer avec Wave"}
              </button>
            )}

            {CINETPAY_ONLINE_PAYMENT_ENABLED && (
              <button
                type="button"
                onClick={() => pay("cinetpay")}
                disabled={Boolean(processing)}
                className="btn min-h-[50px] w-full border-green bg-white text-[.94rem] font-extrabold text-green hover:bg-green/5 dark:bg-transparent disabled:cursor-wait disabled:opacity-60"
              >
                {processing === "cinetpay" ? "Ouverture du paiement..." : "Payer par Mobile Money ou carte"}
              </button>
            )}

            {paytechEnabled && (
              <button
                type="button"
                onClick={() => pay("paytech")}
                disabled={Boolean(processing)}
                className="btn btn-green min-h-[50px] w-full text-[.94rem] disabled:cursor-wait disabled:opacity-60"
              >
                {processing === "paytech" ? "Ouverture du paiement..." : "Continuer vers le paiement sécurisé"}
              </button>
            )}

            {!hasProvider && (
              <p role="alert" className="rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3 text-[.82rem] font-semibold text-amber-800">
                Aucun prestataire de paiement n’est disponible pour le moment.
              </p>
            )}
          </div>

          <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center text-[.68rem] font-semibold text-gray-500 dark:border-white/10 dark:text-gray-400">
            <li>Paiement chiffré</li>
            <li>Activation automatique</li>
            <li>Montant vérifié</li>
          </ul>
        </div>
      </section>

      <p className="mt-4 text-center text-[.7rem] leading-relaxed text-gray-500 dark:text-gray-400">
        Aucune donnée bancaire n’est stockée par {BRAND.name}.
      </p>
    </div>
  );
}
