"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import { WAVE_NUMBER, ORANGE_NUMBER, whatsappLink } from "@/lib/payment";
import { BRAND } from "@/lib/constants";

type ManualPaymentProps = {
  itemName: string;
  price: number;
  duration: string;
  listingId?: string;
  boostKey?: string;
  subKey?: string;
  category?: string;
};

export default function ManualPayment({
  itemName,
  price,
  duration,
  listingId,
}: ManualPaymentProps) {
  const [copied, setCopied] = useState<"" | "wave" | "orange">("");
  const [copyError, setCopyError] = useState("");

  async function copyNumber(number: string, provider: "wave" | "orange") {
    setCopyError("");
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(number.replace(/\s/g, ""));
      setCopied(provider);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopyError("Copie automatique indisponible. Sélectionnez le numéro pour le copier.");
    }
  }

  const listingReference = listingId ? "\nAnnonce : " + listingId : "";
  const message =
    "Bonjour, je souhaite activer : *" +
    itemName +
    "* (" +
    formatNumber(price) +
    " FCFA, " +
    duration +
    ")." +
    listingReference +
    "\nJe joins le reçu de mon dépôt pour vérification.";

  const accounts = [
    { key: "wave" as const, name: "Wave", number: WAVE_NUMBER, color: "border-[#1DC8FF]/50 bg-[#1DC8FF]/10 text-[#087da0]" },
    { key: "orange" as const, name: "Orange Money", number: ORANGE_NUMBER, color: "border-orange-400/50 bg-orange-50 text-orange-700" },
  ];

  return (
    <div className="mx-auto max-w-[620px]">
      <section
        aria-labelledby="manual-payment-title"
        className="overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#161B22]"
      >
        <header className="border-b border-gray-100 px-5 py-4 dark:border-white/10 sm:px-6">
          <h2 id="manual-payment-title" className="font-display text-[1.05rem] font-extrabold text-gray-900 dark:text-white">
            Paiement manuel
          </h2>
          <p className="mt-1 text-[.76rem] text-gray-500 dark:text-gray-400">
            Le support active la formule après vérification du reçu.
          </p>
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
              <dt className="font-bold text-gray-900 dark:text-white">Montant à déposer</dt>
              <dd className="font-display text-[1.55rem] font-extrabold leading-none text-green">
                {formatNumber(price)} <span className="text-[.78rem]">FCFA</span>
              </dd>
            </div>
          </dl>

          <ol className="mt-6 grid gap-5 text-[.84rem] text-gray-700 dark:text-gray-200">
            <li>
              <div className="mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green text-[.72rem] text-white" aria-hidden="true">1</span>
                Déposez le montant exact
              </div>
              <div className="grid gap-2.5">
                {accounts.map((account) => (
                  <button
                    key={account.key}
                    type="button"
                    onClick={() => copyNumber(account.number, account.key)}
                    aria-label={"Copier le numéro " + account.name + " " + account.number}
                    className={"flex min-h-[58px] w-full items-center gap-3 rounded-[8px] border px-4 text-left transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green/20 dark:bg-white/5 " + account.color}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[.7rem] font-bold uppercase">{account.name}</span>
                      <span className="block select-all break-all font-mono text-[1rem] font-extrabold text-gray-900 dark:text-white">{account.number}</span>
                    </span>
                    <span className="shrink-0 text-[.72rem] font-bold">
                      {copied === account.key ? "Copié" : "Copier"}
                    </span>
                  </button>
                ))}
              </div>
              <div aria-live="polite" className="mt-2 min-h-[20px] text-[.72rem] text-red-600 dark:text-red-300">
                {copyError}
              </div>
            </li>

            <li className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green text-[.72rem] font-bold text-white" aria-hidden="true">2</span>
              <span className="pt-0.5">Conservez la capture ou le reçu du dépôt.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green text-[.72rem] font-bold text-white" aria-hidden="true">3</span>
              <span className="pt-0.5">Envoyez le reçu au support WhatsApp pour vérification.</span>
            </li>
          </ol>

          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-[8px] bg-[#25D366] px-4 text-center text-[.95rem] font-bold text-white transition hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/25"
          >
            Envoyer mon reçu sur WhatsApp
          </a>

          <p className="mt-4 text-center text-[.7rem] leading-relaxed text-gray-500 dark:text-gray-400">
            Ne partagez jamais votre code secret Mobile Money. {BRAND.name} demande uniquement le reçu de la transaction.
          </p>
        </div>
      </section>
    </div>
  );
}
