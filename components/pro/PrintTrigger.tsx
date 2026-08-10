"use client";

import { useEffect, useState } from "react";

/**
 * Barre d'action au-dessus du document imprimable.
 *
 * L'impression n'est PAS déclenchée automatiquement : sur mobile, un
 * `window.print()` au chargement s'exécute souvent avant que la mise en page
 * soit stabilisée et sort un document tronqué. On laisse donc l'utilisateur
 * appuyer, une fois la page visiblement prête.
 */
export default function PrintTrigger({ kind }: { kind: "devis" | "facture" }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-dark-border dark:bg-dark-800">
      <p className="text-[.82rem] text-gray-600 dark:text-gray-300">
        Pour obtenir un PDF : <b>Imprimer</b> → destination <b>« Enregistrer au format PDF »</b>.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => window.history.back()}
          className="rounded-xl border border-gray-200 px-4 py-2 text-[.82rem] font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Retour
        </button>
        <button
          onClick={() => window.print()}
          disabled={!ready}
          className="btn btn-green px-5 py-2 text-[.83rem] font-extrabold disabled:opacity-50"
        >
          🖨️ Imprimer / PDF
        </button>
      </div>
    </div>
  );
}
