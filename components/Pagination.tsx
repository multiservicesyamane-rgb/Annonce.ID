"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Pagination des listes longues — documents, clients, devis, factures, projets.
 *
 * ── Pourquoi pas un défilement infini ────────────────────────────────────
 * Soixante documents empilés font une page de plus de quatre mille pixels :
 * on ne retrouve rien, et sur un forfait téléphonique on télécharge soixante
 * miniatures pour en regarder trois. Des pages numérotées donnent un repère
 * stable — « c'était à la page 2 » — que le défilement ne donne jamais.
 *
 * ── Découpage à l'écran, pas au serveur ──────────────────────────────────
 * Les API du module renvoient déjà la liste entière : on la découpe ici. Cela
 * suffit jusqu'à quelques centaines de lignes et ne demande aucun changement
 * de contrat. Au-delà, c'est la requête elle-même qu'il faudra paginer —
 * découper une liste de dix mille lignes après l'avoir téléchargée ne
 * résoudrait plus rien.
 */

/** Vingt-quatre : trois rangées pleines sur ordinateur, douze sur téléphone. */
export const PAR_PAGE = 24;

export function usePagination<T>(items: T[], cle = "", parPage = PAR_PAGE) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / parPage));

  // Une recherche ou un filtre change la liste : rester à la page 3 y montrerait
  // le milieu d'un résultat qu'on vient à peine de demander. `cle` porte la
  // signature du filtre courant, fournie par l'appelant.
  useEffect(() => {
    setPage(1);
  }, [cle]);

  // Suppression du dernier élément d'une page : sans ce garde-fou, on resterait
  // sur une page qui n'existe plus et l'écran serait vide.
  useEffect(() => {
    setPage((p) => Math.min(p, pages));
  }, [pages]);

  const debut = (page - 1) * parPage;
  return {
    page,
    setPage,
    pages,
    total: items.length,
    /** Les éléments de la page courante. */
    visibles: items.slice(debut, debut + parPage),
    premier: items.length === 0 ? 0 : debut + 1,
    dernier: Math.min(debut + parPage, items.length),
  };
}

/**
 * Suite de numéros avec points de suspension : 1 … 4 5 6 … 20.
 *
 * Vingt boutons de page tiennent sur un écran d'ordinateur, jamais sur un
 * téléphone. On garde toujours la première, la dernière et les voisines.
 */
function numeros(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const debut = Math.max(2, page - 1);
  const fin = Math.min(pages - 1, page + 1);
  if (debut > 2) out.push("…");
  for (let i = debut; i <= fin; i++) out.push(i);
  if (fin < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

export default function Pagination({
  page,
  pages,
  setPage,
  total,
  premier,
  dernier,
  /** « document », « client »… pour écrire « 25–48 sur 61 documents ». */
  nom = "élément",
  resume,
}: {
  page: number;
  pages: number;
  setPage: (p: number) => void;
  total: number;
  premier: number;
  dernier: number;
  nom?: string;
  /**
   * Totaux de la liste ENTIÈRE, affichés à droite du pied.
   *
   * C'est le chiffre qu'on cherche en bas d'un tableau comptable : « total
   * facturé, solde dû ». Il porte sur tout, pas sur la page affichée — un
   * total qui changerait en tournant la page ne voudrait rien dire.
   */
  resume?: ReactNode;
}) {
  // Une page unique n'a pas besoin de navigation, mais un pied de totaux garde
  // tout son sens : on n'abandonne que si les deux sont vides.
  if (pages <= 1 && !resume) return null;

  const aller = (p: number) => {
    setPage(Math.min(pages, Math.max(1, p)));
    // Changer de page sans remonter laisserait l'utilisateur au milieu de la
    // nouvelle liste, persuadé qu'il ne s'est rien passé.
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const btn =
    "grid h-9 min-w-[36px] place-items-center rounded-lg border px-2 text-[.85rem] font-bold transition disabled:opacity-40";
  const neutre =
    "border-gray-200 text-gray-600 hover:border-green/50 hover:text-green dark:border-white/10 dark:text-gray-300";

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-col items-center gap-3 border-t border-gray-100 pt-5 dark:border-white/10 sm:flex-row sm:justify-between"
    >
      <p className="text-[.8rem] text-gray-500 dark:text-gray-400">
        <b className="font-semibold text-gray-700 dark:text-gray-200">
          {premier}–{dernier}
        </b>{" "}
        sur {total} {nom}
        {total > 1 ? "s" : ""}
      </p>

      <div className={`flex items-center gap-1.5 ${pages <= 1 ? "hidden" : ""}`}>
        <button type="button" onClick={() => aller(page - 1)} disabled={page === 1} aria-label="Page précédente" className={`${btn} ${neutre}`}>
          ‹
        </button>

        {/* Les numéros ne tiennent pas sur un téléphone : on y montre
            « 3 / 12 », et la suite complète à partir de `sm`. */}
        <span className="px-2 text-[.85rem] font-bold tabular-nums text-gray-600 dark:text-gray-300 sm:hidden">
          {page} / {pages}
        </span>

        <span className="hidden items-center gap-1.5 sm:flex">
          {numeros(page, pages).map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} className="px-1 text-gray-400" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => aller(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n}`}
                className={
                  `${btn} ` +
                  (n === page
                    ? "border-green bg-green text-white shadow-[0_6px_16px_-8px_rgba(99,102,241,.8)]"
                    : neutre)
                }
              >
                {n}
              </button>
            ),
          )}
        </span>

        <button type="button" onClick={() => aller(page + 1)} disabled={page === pages} aria-label="Page suivante" className={`${btn} ${neutre}`}>
          ›
        </button>
      </div>

      {resume && (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[.8rem] sm:justify-end">
          {resume}
        </div>
      )}
    </nav>
  );
}
