"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PaymentFlow from "@/components/PaymentFlow";
import ManualPayment from "@/components/ManualPayment";
import { ONLINE_PAYMENT_ENABLED } from "@/lib/payment";
import { fetchPrices, effectivePrice, type PriceMap } from "@/lib/prices";
import { BOOSTS, SUBSCRIPTION_PLANS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

import { Suspense } from "react";

function PaiementContent() {
  const searchParams = useSearchParams();
  const initialAnnonceId = searchParams.get("annonce_id") || searchParams.get("listing_id") || "";
  const initialBoost = searchParams.get("boost") || "";

  // Selection states
  const [activeTab, setActiveTab] = useState<"boost" | "subscription">("boost");
  const [selectedCategory, setSelectedCategory] = useState<"vehicules" | "immobilier" | "electronique" | "general">("vehicules");
  // Prix réels configurés dans l'admin (override des prix par défaut)
  const [prices, setPrices] = useState<PriceMap>({});
  useEffect(() => { fetchPrices().then(setPrices); }, []);
  const boostPrice = (b: any) => effectivePrice(prices, `boost:${b.key}`, b.price);
  const subPrice = (cat: string, s: any) => effectivePrice(prices, `sub:${cat}:${s.key}`, s.price);
  const [checkoutInfo, setCheckoutInfo] = useState<{
    itemName: string;
    price: number;
    duration: string;
    boostKey?: string;
    subKey?: string;
    category?: string;
  } | null>(
    initialBoost
      ? (() => {
          const b = BOOSTS.find((b) => b.key === initialBoost);
          return b
            ? {
                itemName: `Boost ${b.name}`,
                price: b.price,
                duration: b.duration,
                boostKey: b.key,
              }
            : null;
        })()
      : null
  );

  const handleSelectBoost = (b: any) => {
    setCheckoutInfo({
      itemName: `Boost ${b.name}`,
      price: boostPrice(b),
      duration: b.duration,
      boostKey: b.key,
    });
  };

  const handleSelectSubscription = (s: any, categoryKey: string) => {
    setCheckoutInfo({
      itemName: `Abonnement Boutique : ${s.name}`,
      price: subPrice(categoryKey, s),
      duration: s.duration,
      subKey: s.key,
      category: categoryKey,
    });
  };

  if (checkoutInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black py-10 transition-colors">
        <div className="wrap">
          <button
            onClick={() => setCheckoutInfo(null)}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            ← Retour aux formules
          </button>
          {ONLINE_PAYMENT_ENABLED ? (
            <PaymentFlow
              itemName={checkoutInfo.itemName}
              price={checkoutInfo.price}
              duration={checkoutInfo.duration}
              listingId={initialAnnonceId}
              boostKey={checkoutInfo.boostKey}
              subKey={checkoutInfo.subKey}
              category={checkoutInfo.category}
            />
          ) : (
            <ManualPayment
              itemName={checkoutInfo.itemName}
              price={checkoutInfo.price}
              duration={checkoutInfo.duration}
              listingId={initialAnnonceId}
              boostKey={checkoutInfo.boostKey}
              subKey={checkoutInfo.subKey}
              category={checkoutInfo.category}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-gray-50 to-white dark:from-[#0c0f1d] dark:via-black dark:to-black py-6 sm:py-10 transition-colors">
      <div className="wrap max-w-5xl px-3 sm:px-4">
        {/* Header sublime */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#6366F1] via-[#7C5CFC] to-[#A855F7] px-5 py-7 sm:py-9 text-center text-white mb-6 sm:mb-8 shadow-[0_12px_40px_-12px_rgba(124,92,252,0.5)]">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, #fff 1.5px, transparent 1.5px)", backgroundSize: "26px 26px" }} />
          <div className="relative">
            <h1 className="font-display text-[1.5rem] sm:text-[2.1rem] font-extrabold leading-tight">Boostez votre visibilité 🚀</h1>
            <p className="mx-auto mt-2 max-w-lg text-[.85rem] sm:text-[.95rem] text-white/85">
              Propulsez vos annonces ou créez votre boutique professionnelle certifiée.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-6 sm:mb-8 px-1">
          <div className="inline-flex w-full max-w-md bg-white dark:bg-dark-900 border border-gray-200 dark:border-white/10 rounded-full p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("boost")}
              className={`flex-1 px-3 sm:px-5 py-2.5 rounded-full text-[.7rem] sm:text-xs font-bold transition-all uppercase tracking-wide ${
                activeTab === "boost"
                  ? "bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white shadow-md"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              🚀 Booster
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`flex-1 px-3 sm:px-5 py-2.5 rounded-full text-[.7rem] sm:text-xs font-bold transition-all uppercase tracking-wide ${
                activeTab === "subscription"
                  ? "bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white shadow-md"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              💼 Boutique Pro
            </button>
          </div>
        </div>

        {/* BOOSTS LIST */}
        {activeTab === "boost" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {BOOSTS.filter((b) => b.price > 0).map((b) => (
              <div
                key={b.key}
                onClick={() => handleSelectBoost(b)}
                className={`relative flex flex-col justify-between rounded-[16px] border bg-white dark:bg-dark-900 p-4 sm:p-5 shadow-sm transition cursor-pointer group hover:-translate-y-1 hover:shadow-[0_12px_30px_-12px_rgba(124,92,252,0.4)] duration-300 ${b.popular ? "border-indigo-400 ring-1 ring-indigo-300/50" : "border-gray-200 dark:border-white/10 hover:border-indigo-400"}`}
              >
                {b.popular && (
                  <span className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-[#6366F1] to-[#A855F7] px-3 py-0.5 text-[.6rem] font-extrabold text-white uppercase tracking-wider shadow-sm">
                    POPULAIRE
                  </span>
                )}
                <div>
                  <h3 className="text-[1.05rem] font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 transition-colors">{b.name}</h3>
                  <div className="mt-2 font-display text-[1.35rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#A855F7]">
                    {formatNumber(boostPrice(b))} FCFA
                  </div>
                  <p className="mb-4 mt-1 text-[.75rem] text-gray-400">Durée : {b.duration}</p>
                  <div className="space-y-1.5 text-[.8rem] text-gray-600 dark:text-gray-300 pt-3 border-t border-gray-100 dark:border-white/5">
                    {b.features.map((f) => (
                      <div key={f} className="flex items-center gap-1.5">
                        <span className="text-indigo-500">✓</span> {f}
                      </div>
                    ))}
                  </div>
                </div>
                <button className="mt-5 w-full rounded-xl bg-indigo-50 dark:bg-white/5 py-2.5 text-center text-[.82rem] font-bold text-indigo-600 dark:text-indigo-300 transition group-hover:bg-gradient-to-r group-hover:from-[#6366F1] group-hover:to-[#A855F7] group-hover:text-white">
                  Sélectionner →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* SUBSCRIPTION LIST */}
        {activeTab === "subscription" && (
          <div>
            {/* Category selection pills */}
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 mb-6 sm:flex-wrap sm:justify-center">
              {(
                [
                  { key: "vehicules", label: "Véhicules 🚗" },
                  { key: "immobilier", label: "Immobilier 🏠" },
                  { key: "electronique", label: "Électronique 📱" },
                  { key: "general", label: "Général 👗" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    selectedCategory === cat.key
                      ? "bg-indigo-500/10 border-indigo-400 text-indigo-600 dark:text-indigo-300"
                      : "bg-white dark:bg-dark-900 border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {SUBSCRIPTION_PLANS[selectedCategory]
                .filter((s) => s.price > 0)
                .map((s, i) => (
                  <div
                    key={s.key}
                    onClick={() => handleSelectSubscription(s, selectedCategory)}
                    className={`relative flex flex-col justify-between rounded-[16px] border bg-white dark:bg-dark-900 p-4 sm:p-5 shadow-sm transition cursor-pointer group hover:-translate-y-1 hover:shadow-[0_12px_30px_-12px_rgba(124,92,252,0.4)] duration-300 ${i === 1 ? "border-indigo-400 ring-1 ring-indigo-300/50" : "border-gray-200 dark:border-white/10 hover:border-indigo-400"}`}
                  >
                    {i === 1 && (
                      <span className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-[#6366F1] to-[#A855F7] px-3 py-0.5 text-[.6rem] font-extrabold text-white uppercase tracking-wider shadow-sm">POPULAIRE</span>
                    )}
                    <div>
                      <h3 className="text-[1.1rem] font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                        {s.name}
                      </h3>
                      <div className="mt-2 font-display text-[1.5rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#A855F7]">
                        {formatNumber(subPrice(selectedCategory, s))} FCFA <span className="text-xs font-normal text-gray-400">/ mois</span>
                      </div>
                      <p className="mb-4 mt-1 text-[.75rem] text-gray-400">Facturation mensuelle</p>

                      <div className="bg-indigo-50/60 dark:bg-white/5 rounded-xl p-3 mb-4 space-y-1.5 text-[.75rem]">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Annonces actives :</span>
                          <span className="font-bold text-gray-800 dark:text-white">{s.limits.activeAds}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Photos max / annonce :</span>
                          <span className="font-bold text-gray-800 dark:text-white">{s.limits.photos}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[.8rem] text-gray-600 dark:text-gray-300 pt-3 border-t border-gray-100 dark:border-white/5">
                        {s.features.map((f) => (
                          <div key={f} className="flex items-start gap-1.5 leading-snug">
                            <span className="text-indigo-500 shrink-0 mt-0.5">✓</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button className="mt-5 w-full rounded-xl bg-indigo-50 dark:bg-white/5 py-2.5 text-center text-[.82rem] font-bold text-indigo-600 dark:text-indigo-300 transition group-hover:bg-gradient-to-r group-hover:from-[#6366F1] group-hover:to-[#A855F7] group-hover:text-white">
                      S'abonner →
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaiementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-black py-12 flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold">Chargement des formules...</div>}>
      <PaiementContent />
    </Suspense>
  );
}

