"use client";

import { useMemo, useState } from "react";
import AdCard from "./AdCard";
import AdBanner from "./AdBanner";
import type { Listing } from "@/lib/types";
import { COUNTRIES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

/**
 * Vue listing avec filtres (sidebar desktop / drawer mobile), tri, chips,
 * et insertion d'une carte sponsorisée tous les 8 résultats (slot A4).
 */
export default function ListingView({
  initial,
  title,
  subtitle,
}: {
  initial: Listing[];
  title: string;
  subtitle?: string;
}) {
  const [country, setCountry] = useState("");
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(500_000_000);
  const [sort, setSort] = useState("recent");
  const [drawer, setDrawer] = useState(false);

  const filtered = useMemo(() => {
    let list = initial.filter((l) => {
      if (country && l.countryCode !== country) return false;
      if (premiumOnly && !l.premium) return false;
      const num = Number(l.price.replace(/[^0-9]/g, "")) || 0;
      if (num > maxPrice) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => price(a) - price(b));
    if (sort === "price-desc") list = [...list].sort((a, b) => price(b) - price(a));
    if (sort === "views") list = [...list].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    return list;
  }, [initial, country, premiumOnly, maxPrice, sort]);

  const filters = (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
        <span className="font-display text-[.95rem] font-bold">Filtrer</span>
        <button
          type="button"
          onClick={() => {
            setCountry("");
            setPremiumOnly(false);
            setMaxPrice(500_000_000);
          }}
          className="text-[.74rem] text-gray-500 hover:text-green"
        >
          Réinit.
        </button>
      </div>

      <Field label="Pays">
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="input">
          <option value="">Tous les pays</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={`Prix max : ${formatNumber(maxPrice)} FCFA`}>
        <input
          type="range"
          min={0}
          max={500_000_000}
          step={5_000_000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-green"
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2 text-[.83rem] text-gray-700">
        <input type="checkbox" checked={premiumOnly} onChange={(e) => setPremiumOnly(e.target.checked)} className="accent-green" />
        ✦ Premium uniquement
      </label>

      {/* AD A3 */}
      <AdBanner slot="A3" title="Pub A3" subtitle="300×250 · Sidebar" variant="night" />
    </div>
  );

  return (
    <div className="wrap py-5">
      <div className="grid items-start gap-5 lg:grid-cols-[240px_1fr]">
        <aside className="sticky top-[calc(64px+.75rem)] hidden rounded-lg border-[1.5px] border-gray-100 bg-white p-4 lg:block">
          {filters}
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h1 className="font-display text-[1.2rem] font-bold">{title}</h1>
              {subtitle && <p className="text-[.82rem] text-gray-500">{subtitle}</p>}
              <span className="text-[.85rem] text-gray-700">
                <b className="text-green">{formatNumber(filtered.length)}</b> annonce{filtered.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDrawer(true)}
                className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-gray-100 bg-white px-3 py-2 text-[.82rem] font-semibold text-gray-700 lg:hidden"
              >
                ⚙ Filtrer
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border-[1.5px] border-gray-100 bg-white px-3 py-2 text-[.8rem] outline-none"
              >
                <option value="recent">Plus récent</option>
                <option value="price-asc">Prix ↑</option>
                <option value="price-desc">Prix ↓</option>
                <option value="views">Plus de vues</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
              Aucune annonce ne correspond à ces filtres.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((ad, i) => (
                <FragmentWithAd key={ad.id} ad={ad} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-[1500] lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {filters}
            <button type="button" onClick={() => setDrawer(false)} className="btn btn-green btn-block mt-4">
              Voir les résultats
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FragmentWithAd({ ad, index }: { ad: Listing; index: number }) {
  return (
    <>
      <AdCard ad={ad} />
      {(index + 1) % 8 === 0 && (
        <div className="col-span-2 sm:col-span-3 lg:col-span-4">
          <AdBanner slot="A4" title="Annonce sponsorisée" subtitle="In-grid · tous les 8 résultats" label="Sponsorisé" variant="green" />
        </div>
      )}
    </>
  );
}

function price(l: Listing) {
  return Number(l.price.replace(/[^0-9]/g, "")) || 0;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-[.74rem] font-bold uppercase tracking-wide text-gray-700">{label}</span>
      {children}
    </div>
  );
}
