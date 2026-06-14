"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";

/**
 * Filtre de prix avec deux champs input synchronisés et une jauge visuelle simplifiée.
 */
export default function PriceSlider({
  min = 0,
  max = 5000000,
  onChange,
}: {
  min?: number;
  max?: number;
  onChange?: (val: [number, number]) => void;
}) {
  const [values, setValues] = useState<[number, number]>([min, max]);

  function handleMin(val: string) {
    const n = parseInt(val.replace(/\D/g, ""), 10) || 0;
    const next: [number, number] = [Math.min(n, values[1]), values[1]];
    setValues(next);
    onChange?.(next);
  }

  function handleMax(val: string) {
    const n = parseInt(val.replace(/\D/g, ""), 10) || 0;
    const next: [number, number] = [values[0], Math.max(n, values[0])];
    setValues(next);
    onChange?.(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <label className="absolute left-3 top-2 text-[.6rem] font-bold uppercase text-gray-400">Min (FCFA)</label>
          <input
            type="text"
            inputMode="numeric"
            value={values[0] === 0 ? "" : formatNumber(values[0])}
            onChange={(e) => handleMin(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-900 pb-2 pl-3 pr-3 pt-6 text-[.85rem] font-bold text-gray-900 dark:text-white outline-none focus:border-green"
            placeholder="0"
          />
        </div>
        <span className="text-gray-300">-</span>
        <div className="relative flex-1">
          <label className="absolute left-3 top-2 text-[.6rem] font-bold uppercase text-gray-400">Max (FCFA)</label>
          <input
            type="text"
            inputMode="numeric"
            value={values[1] === max ? "" : formatNumber(values[1])}
            onChange={(e) => handleMax(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-900 pb-2 pl-3 pr-3 pt-6 text-[.85rem] font-bold text-gray-900 dark:text-white outline-none focus:border-green"
            placeholder={formatNumber(max)}
          />
        </div>
      </div>
      
      {/* Jauge visuelle */}
      <div className="relative h-1.5 w-full rounded-full bg-gray-200 dark:bg-dark-700">
        <div 
          className="absolute h-full rounded-full bg-green"
          style={{
            left: `${(values[0] / max) * 100}%`,
            right: `${100 - Math.min((values[1] / max) * 100, 100)}%`
          }}
        />
      </div>
    </div>
  );
}
