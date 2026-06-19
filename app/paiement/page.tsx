"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import PaymentFlow from "@/components/PaymentFlow";
import ManualPayment from "@/components/ManualPayment";
import { ONLINE_PAYMENT_ENABLED } from "@/lib/payment";
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
      price: b.price,
      duration: b.duration,
      boostKey: b.key,
    });
  };

  const handleSelectSubscription = (s: any, categoryKey: string) => {
    setCheckoutInfo({
      itemName: `Abonnement Boutique : ${s.name}`,
      price: s.price,
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
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8 transition-colors">
      <div className="wrap max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="font-display text-[1.8rem] md:text-[2.2rem] font-extrabold text-gray-900 dark:text-white leading-tight">
            Paiements & Boosts
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-lg mx-auto">
            Propulsez la visibilité de vos annonces ou créez votre boutique professionnelle certifiée.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white dark:bg-dark-900 border border-gray-200 dark:border-white/10 rounded-full p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("boost")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
                activeTab === "boost"
                  ? "bg-gradient-to-r from-green-500 to-neon-gold text-white shadow-md"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              🚀 Booster une Annonce
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
                activeTab === "subscription"
                  ? "bg-gradient-to-r from-green-500 to-neon-gold text-white shadow-md"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Store Boutique Pro
            </button>
          </div>
        </div>

        {/* BOOSTS LIST */}
        {activeTab === "boost" && (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {BOOSTS.filter((b) => b.price > 0).map((b) => (
              <div
                key={b.key}
                onClick={() => handleSelectBoost(b)}
                className="relative flex flex-col justify-between rounded-[16px] border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-900 p-6 shadow-sm transition hover:border-gold hover:shadow-md cursor-pointer group hover:-translate-y-1 transform duration-300"
              >
                {b.popular && (
                  <span className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-gold to-[#F3E5AB] px-3 py-0.5 text-[.6rem] font-extrabold text-black uppercase tracking-wider shadow-sm">
                    POPULAIRE
                  </span>
                )}
                <div>
                  <h3 className="text-[1.05rem] font-bold text-gray-800 dark:text-white group-hover:text-gold transition-colors">{b.name}</h3>
                  <div className="mt-2 font-display text-[1.35rem] font-extrabold text-green">
                    {formatNumber(b.price)} FCFA
                  </div>
                  <p className="mb-4 mt-1 text-[.75rem] text-gray-400">Durée : {b.duration}</p>
                  <div className="space-y-1.5 text-[.8rem] text-gray-600 dark:text-gray-300 pt-3 border-t border-gray-100 dark:border-white/5">
                    {b.features.map((f) => (
                      <div key={f} className="flex items-center gap-1.5">
                        <span className="text-gold">✓</span> {f}
                      </div>
                    ))}
                  </div>
                </div>
                <button className="mt-6 w-full rounded-xl bg-gray-50 dark:bg-white/5 py-2.5 text-center text-[.8rem] font-bold text-gray-700 dark:text-gray-300 transition group-hover:bg-gold group-hover:text-black">
                  Sélectionner
                </button>
              </div>
            ))}
          </div>
        )}

        {/* SUBSCRIPTION LIST */}
        {activeTab === "subscription" && (
          <div>
            {/* Category selection pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
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
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    selectedCategory === cat.key
                      ? "bg-gold/10 border-gold text-gold"
                      : "bg-white dark:bg-dark-900 border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Plans grid */}
            <div className="grid gap-6 sm:grid-cols-3">
              {SUBSCRIPTION_PLANS[selectedCategory]
                .filter((s) => s.price > 0)
                .map((s) => (
                  <div
                    key={s.key}
                    onClick={() => handleSelectSubscription(s, selectedCategory)}
                    className="relative flex flex-col justify-between rounded-[16px] border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-900 p-6 shadow-sm transition hover:border-gold hover:shadow-md cursor-pointer group hover:-translate-y-1 transform duration-300"
                  >
                    <div>
                      <h3 className="text-[1.1rem] font-bold text-gray-800 dark:text-white group-hover:text-gold transition-colors">
                        {s.name}
                      </h3>
                      <div className="mt-2 font-display text-[1.5rem] font-extrabold text-green">
                        {formatNumber(s.price)} FCFA <span className="text-xs font-normal text-gray-400">/ mois</span>
                      </div>
                      <p className="mb-4 mt-1 text-[.75rem] text-gray-400">Facturation mensuelle</p>
                      
                      {/* Limits summary */}
                      <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 mb-4 space-y-1.5 text-[.75rem]">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Annonces actives :</span>
                          <span className="font-bold text-gray-800 dark:text-white">{s.limits.activeAds}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Photos max / annonce :</span>
                          <span className="font-bold text-gray-800 dark:text-white">{s.limits.photos}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-1.5 text-[.8rem] text-gray-600 dark:text-gray-300 pt-3 border-t border-gray-100 dark:border-white/5">
                        {s.features.map((f) => (
                          <div key={f} className="flex items-start gap-1.5 leading-snug">
                            <span className="text-gold shrink-0 mt-0.5">✓</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button className="mt-6 w-full rounded-xl bg-gray-50 dark:bg-white/5 py-2.5 text-center text-[.8rem] font-bold text-gray-700 dark:text-gray-300 transition group-hover:bg-gold group-hover:text-black">
                      S'abonner
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

