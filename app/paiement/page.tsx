"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PaymentFlow from "@/components/PaymentFlow";
import ManualPayment from "@/components/ManualPayment";
import { ONLINE_PAYMENT_ENABLED } from "@/lib/payment";
import { fetchPublicSettings, effectivePrice, isOnlinePayable, type PriceMap } from "@/lib/prices";
import { BOOSTS, SUBSCRIPTION_PLANS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

type ActiveTab = "boost" | "subscription";
type CategoryKey = "vehicules" | "immobilier" | "electronique" | "general";

type CheckoutInfo = {
  itemName: string;
  price: number;
  duration: string;
  boostKey?: string;
  subKey?: string;
  category?: string;
};

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "vehicules", label: "Véhicules" },
  { key: "immobilier", label: "Immobilier" },
  { key: "electronique", label: "Électronique" },
  { key: "general", label: "Général" },
];

function PaiementContent() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get("annonce_id") || searchParams.get("listing_id") || "";
  const initialBoost = searchParams.get("boost") || "";
  const autoOpened = useRef(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>("boost");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("vehicules");
  const [prices, setPrices] = useState<PriceMap>({});
  const [onlineOffers, setOnlineOffers] = useState<string[]>([]);
  const [pricingReady, setPricingReady] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);

  useEffect(() => {
    let active = true;
    fetchPublicSettings()
      .then(({ prices: nextPrices, online }) => {
        if (active) { setPrices(nextPrices); setOnlineOffers(online); }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setPricingReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!pricingReady || autoOpened.current || !initialBoost || !listingId) return;
    const boost = BOOSTS.find((item) => item.key === initialBoost && item.price > 0);
    autoOpened.current = true;
    if (!boost) return;

    setActiveTab("boost");
    setCheckoutInfo({
      itemName: "Boost " + boost.name,
      price: effectivePrice(prices, "boost:" + boost.key, boost.price),
      duration: boost.duration,
      boostKey: boost.key,
    });
  }, [initialBoost, listingId, prices, pricingReady]);

  function boostPrice(boost: (typeof BOOSTS)[number]) {
    return effectivePrice(prices, "boost:" + boost.key, boost.price);
  }

  function subscriptionPrice(category: CategoryKey, plan: (typeof SUBSCRIPTION_PLANS)[CategoryKey][number]) {
    return effectivePrice(prices, "sub:" + category + ":" + plan.key, plan.price);
  }

  function selectBoost(boost: (typeof BOOSTS)[number]) {
    if (!listingId || !pricingReady) return;
    setCheckoutInfo({
      itemName: "Boost " + boost.name,
      price: boostPrice(boost),
      duration: boost.duration,
      boostKey: boost.key,
    });
  }

  function selectSubscription(plan: (typeof SUBSCRIPTION_PLANS)[CategoryKey][number]) {
    if (!pricingReady) return;
    setCheckoutInfo({
      itemName: "Abonnement Boutique : " + plan.name,
      price: subscriptionPrice(selectedCategory, plan),
      duration: plan.duration,
      subKey: plan.key,
      category: selectedCategory,
    });
  }

  if (checkoutInfo) {
    return (
      <div className="min-h-[calc(100dvh-90px)] bg-gray-50 py-6 transition-colors dark:bg-[#0D1117] sm:py-9">
        <div className="wrap max-w-[760px]">
          <button
            type="button"
            onClick={() => setCheckoutInfo(null)}
            className="mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-[8px] px-2 text-sm font-semibold text-gray-600 transition hover:bg-white hover:text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green/20 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Modifier la formule
          </button>

          <header className="mb-5">
            <p className="text-[.72rem] font-bold uppercase tracking-[.12em] text-green">Étape 2 sur 2</p>
            <h1 className="mt-1 font-display text-[1.45rem] font-extrabold text-gray-900 dark:text-white sm:text-[1.7rem]">
              Vérifier et payer
            </h1>
            <p className="mt-1 text-[.84rem] text-gray-500 dark:text-gray-400">
              Contrôlez la formule et le montant avant d’ouvrir le paiement sécurisé.
            </p>
          </header>

          {/* Paiement en ligne (Chariow) pour toute offre reliée à un produit
              Chariow (CHARIOW_PRODUCTS). Les offres non reliées passent par le
              paiement manuel (dépôt Wave/OM + reçu WhatsApp + activation via
              Admin > Encaissement). Ajouter un produit Chariow + son mapping
              suffit à basculer une offre en ligne, sans toucher au code. */}
          {ONLINE_PAYMENT_ENABLED && isOnlinePayable(onlineOffers, checkoutInfo) ? (
            <PaymentFlow
              itemName={checkoutInfo.itemName}
              price={checkoutInfo.price}
              duration={checkoutInfo.duration}
              listingId={listingId}
              boostKey={checkoutInfo.boostKey}
              subKey={checkoutInfo.subKey}
              category={checkoutInfo.category}
            />
          ) : (
            <ManualPayment
              itemName={checkoutInfo.itemName}
              price={checkoutInfo.price}
              duration={checkoutInfo.duration}
              listingId={listingId}
              boostKey={checkoutInfo.boostKey}
              subKey={checkoutInfo.subKey}
              category={checkoutInfo.category}
            />
          )}
        </div>
      </div>
    );
  }

  const boostUnavailable = activeTab === "boost" && !listingId;

  return (
    <div className="min-h-[calc(100dvh-90px)] bg-gray-50 py-6 transition-colors dark:bg-[#0D1117] sm:py-9">
      <div className="wrap max-w-5xl">
        <header className="mb-6 border-b border-gray-200 pb-6 dark:border-white/10">
          <Link href="/dashboard" className="inline-flex min-h-[40px] items-center gap-2 text-[.8rem] font-semibold text-gray-500 hover:text-green dark:text-gray-400">
            <span aria-hidden="true">←</span>
            Retour à mon espace
          </Link>
          <p className="mt-3 text-[.72rem] font-bold uppercase tracking-[.12em] text-green">Visibilité vendeur</p>
          <h1 className="mt-1 font-display text-[1.55rem] font-extrabold text-gray-900 dark:text-white sm:text-[1.9rem]">
            Boosts et boutiques professionnelles
          </h1>
          <p className="mt-2 max-w-2xl text-[.86rem] leading-relaxed text-gray-500 dark:text-gray-400">
            Mettez une annonce précise en avant ou choisissez une formule mensuelle pour votre boutique.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Type de formule"
          className="mb-6 grid w-full max-w-md grid-cols-2 rounded-[8px] border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-dark-900"
        >
          <button
            id="payment-tab-boost"
            type="button"
            role="tab"
            aria-selected={activeTab === "boost"}
            aria-controls="payment-panel-boost"
            onClick={() => setActiveTab("boost")}
            className={
              "min-h-[44px] rounded-[6px] px-3 text-[.78rem] font-bold transition " +
              (activeTab === "boost"
                ? "bg-green text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white")
            }
          >
            Booster une annonce
          </button>
          <button
            id="payment-tab-subscription"
            type="button"
            role="tab"
            aria-selected={activeTab === "subscription"}
            aria-controls="payment-panel-subscription"
            onClick={() => setActiveTab("subscription")}
            className={
              "min-h-[44px] rounded-[6px] px-3 text-[.78rem] font-bold transition " +
              (activeTab === "subscription"
                ? "bg-green text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white")
            }
          >
            Boutique Pro
          </button>
        </div>

        {boostUnavailable && (
          <div role="note" className="mb-6 flex flex-col gap-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[.85rem] font-bold">
                Choisissez d’abord l’annonce à booster.
              </p>
              <p className="mt-0.5 text-[.76rem] leading-relaxed opacity-80">
                Un boost est toujours rattaché à une annonce qui vous appartient.
              </p>
            </div>
            <Link href="/dashboard?panel=ads" className="btn min-h-[42px] shrink-0 border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
              Voir mes annonces
            </Link>
          </div>
        )}

        {activeTab === "boost" && (
          <section
            id="payment-panel-boost"
            role="tabpanel"
            aria-labelledby="payment-tab-boost"
            aria-busy={!pricingReady}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {BOOSTS.filter((boost) => boost.price > 0).map((boost) => (
              <article
                key={boost.key}
                className={
                  "relative flex flex-col justify-between rounded-[8px] border bg-white p-4 shadow-sm dark:bg-dark-900 sm:p-5 " +
                  (boost.popular ? "border-green ring-1 ring-green/20" : "border-gray-200 dark:border-white/10")
                }
              >
                {boost.popular && (
                  <span className="absolute right-4 top-0 -translate-y-1/2 rounded-full bg-green px-2.5 py-0.5 text-[.62rem] font-bold text-white">
                    Recommandé
                  </span>
                )}
                <div>
                  <h2 className="text-[1rem] font-bold text-gray-900 dark:text-white">{boost.name}</h2>
                  <p className="mt-2 font-display text-[1.4rem] font-extrabold text-green">
                    {pricingReady ? formatNumber(boostPrice(boost)) + " FCFA" : "Chargement..."}
                  </p>
                  <p className="mt-0.5 text-[.74rem] text-gray-500 dark:text-gray-400">Pendant {boost.duration}</p>
                  <ul className="mt-4 grid gap-2 border-t border-gray-100 pt-4 text-[.78rem] text-gray-600 dark:border-white/10 dark:text-gray-300">
                    {boost.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 leading-relaxed">
                        <span className="mt-0.5 font-bold text-emerald-600" aria-hidden="true">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => selectBoost(boost)}
                  disabled={!pricingReady || !listingId}
                  className="btn btn-green mt-5 min-h-[44px] w-full disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Choisir cette formule
                </button>
              </article>
            ))}
          </section>
        )}

        {activeTab === "subscription" && (
          <section
            id="payment-panel-subscription"
            role="tabpanel"
            aria-labelledby="payment-tab-subscription"
            aria-busy={!pricingReady}
          >
            <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Catégorie de boutique">
              {CATEGORIES.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setSelectedCategory(category.key)}
                  aria-pressed={selectedCategory === category.key}
                  className={
                    "min-h-[42px] shrink-0 rounded-[8px] border px-4 text-xs font-bold transition " +
                    (selectedCategory === category.key
                      ? "border-green bg-green/10 text-green"
                      : "border-gray-200 bg-white text-gray-500 hover:text-gray-900 dark:border-white/10 dark:bg-dark-900 dark:text-gray-400 dark:hover:text-white")
                  }
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SUBSCRIPTION_PLANS[selectedCategory]
                .filter((plan) => plan.price > 0)
                .map((plan, index) => (
                  <article
                    key={plan.key}
                    className={
                      "relative flex flex-col justify-between rounded-[8px] border bg-white p-4 shadow-sm dark:bg-dark-900 sm:p-5 " +
                      (index === 1 ? "border-green ring-1 ring-green/20" : "border-gray-200 dark:border-white/10")
                    }
                  >
                    {index === 1 && (
                      <span className="absolute right-4 top-0 -translate-y-1/2 rounded-full bg-green px-2.5 py-0.5 text-[.62rem] font-bold text-white">
                        Recommandé
                      </span>
                    )}
                    <div>
                      <h2 className="text-[1rem] font-bold text-gray-900 dark:text-white">{plan.name}</h2>
                      <p className="mt-2 font-display text-[1.35rem] font-extrabold text-green">
                        {pricingReady ? formatNumber(subscriptionPrice(selectedCategory, plan)) + " FCFA" : "Chargement..."}
                      </p>
                      <p className="mt-0.5 text-[.72rem] text-gray-500 dark:text-gray-400">par mois</p>

                      <dl className="mt-4 grid gap-2 border-t border-gray-100 pt-4 text-[.76rem] dark:border-white/10">
                        <div className="flex justify-between gap-3">
                          <dt className="text-gray-500 dark:text-gray-400">Annonces actives</dt>
                          <dd className="font-bold text-gray-900 dark:text-white">{plan.limits.activeAds}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-gray-500 dark:text-gray-400">Photos par annonce</dt>
                          <dd className="font-bold text-gray-900 dark:text-white">{plan.limits.photos}</dd>
                        </div>
                      </dl>

                      <ul className="mt-4 grid gap-2 text-[.78rem] text-gray-600 dark:text-gray-300">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 leading-relaxed">
                            <span className="mt-0.5 font-bold text-emerald-600" aria-hidden="true">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectSubscription(plan)}
                      disabled={!pricingReady}
                      className="btn btn-green mt-5 min-h-[44px] w-full disabled:cursor-wait disabled:opacity-45"
                    >
                      Choisir cet abonnement
                    </button>
                  </article>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function PaiementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4 text-sm font-semibold text-gray-500 dark:bg-[#0D1117] dark:text-gray-400">
          Chargement des formules...
        </div>
      }
    >
      <PaiementContent />
    </Suspense>
  );
}
