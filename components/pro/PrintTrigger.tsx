"use client";

import { useEffect, useState } from "react";

/**
 * Barre d'action au-dessus du document imprimable.
 *
 * L'impression n'est PAS déclenchée automatiquement : sur mobile, un
 * `window.print()` au chargement s'exécute souvent avant que la mise en page
 * soit stabilisée et sort un document tronqué. On laisse donc l'utilisateur
 * appuyer, une fois la page visiblement prête.
 *
 * Barre collante en haut : sur un document long consulté au téléphone, le
 * bouton reste atteignable sans remonter.
 */
export default function PrintTrigger({ kind }: { kind: "devis" | "facture" }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <div className="no-print sticky top-2 z-10 mb-4 rounded-xl bg-white/95 p-2.5 shadow-md backdrop-blur sm:mb-5 sm:p-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.history.back()}
          aria-label="Retour"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[1rem] text-gray-500 transition hover:bg-gray-100"
        >
          ‹
        </button>

        <p className="hidden min-w-0 flex-1 text-[.8rem] leading-snug text-gray-500 sm:block">
          Aperçu du {kind}. Pour un PDF : <b className="text-gray-700">Imprimer</b> → destination{" "}
          <b className="text-gray-700">« Enregistrer au format PDF »</b>.
        </p>
        <p className="min-w-0 flex-1 text-[.78rem] leading-snug text-gray-500 sm:hidden">
          Aperçu du {kind}
        </p>

        <button
          onClick={() => window.print()}
          disabled={!ready}
          className="shrink-0 rounded-lg px-4 py-2 text-[.83rem] font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "#4F46E5" }}
        >
          🖨️ <span className="hidden sm:inline">Imprimer / </span>PDF
        </button>
      </div>
    </div>
  );
}
