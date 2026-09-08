"use client";

import { useMemo, useState } from "react";
import Pagination, { usePagination } from "@/components/Pagination";
import { PrimaryBtn, Title, api, input, pageWide } from "./ui";
import { CAREER_KINDS, KIND_LABELS, accord, type CareerKind } from "@/lib/carriere";

type Tri = "recent" | "ancien" | "nom";

const TRIS: { id: Tri; label: string }[] = [
  { id: "recent", label: "Modifié récemment" },
  { id: "ancien", label: "Plus anciens d'abord" },
  { id: "nom", label: "Par nom" },
];

export type DocRow = {
  id: string;
  kind: CareerKind;
  title: string;
  template: string;
  updated_at: string;
};

const ICONE: Record<CareerKind, string> = { cv: "📄", lettre: "✉️", demande: "💼" };

/** « Modifie le 6 sept. » — repere suffisant pour retrouver un document. */
function quand(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function MesDocuments({
  documents,
  onOuvrir,
  onNouveau,
  onRecharger,
  toast,
}: {
  documents: DocRow[];
  onOuvrir: (d: DocRow) => void;
  onNouveau: () => void;
  onRecharger: () => void;
  toast: (m: string) => void;
}) {
  const [suppression, setSuppression] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<"all" | CareerKind>("all");
  const [tri, setTri] = useState<Tri>("recent");

  /** Compteurs des pastilles. Un filtre qui ne dit pas combien il cache
      oblige a cliquer dessus pour le savoir. */
  const comptes = useMemo(() => {
    const c: Record<string, number> = { all: documents.length };
    for (const k of CAREER_KINDS) c[k] = documents.filter((d) => d.kind === k).length;
    return c;
  }, [documents]);

  const filtres = useMemo(() => {
    const aiguille = recherche.trim().toLowerCase();
    const liste = documents.filter((d) => {
      if (filtre !== "all" && d.kind !== filtre) return false;
      if (!aiguille) return true;
      // On cherche aussi dans le TYPE : taper « lettre » doit ramener les
      // lettres, meme celles dont le titre ne contient pas le mot.
      return [d.title, KIND_LABELS[d.kind]]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(aiguille));
    });

    const trie = [...liste];
    if (tri === "nom") {
      // `localeCompare` en francais : sans lui, « Élise » passe apres « Zoe ».
      trie.sort((a, b) => (a.title || "").localeCompare(b.title || "", "fr"));
    } else {
      trie.sort((a, b) => {
        const ecart = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        return tri === "recent" ? ecart : -ecart;
      });
    }
    return trie;
  }, [documents, recherche, filtre, tri]);

  const pagination = usePagination(filtres, recherche + "|" + filtre + "|" + tri);

  async function supprimer(d: DocRow) {
    // Un document represente parfois une heure de saisie : on demande avant.
    if (!window.confirm(`Supprimer « ${d.title} » ? Cette action est definitive.`)) return;
    setSuppression(d.id);
    try {
      await api("documents", { action: "delete", id: d.id });
      toast("Document supprime.");
      onRecharger();
    } catch {
      toast("Suppression impossible.");
    } finally {
      setSuppression(null);
    }
  }

  return (
    // `pageWide` et non `page` : cet ecran est une GALERIE, pas un formulaire.
    // Dans les 680 px de `page`, la grille a trois colonnes donnait des cartes
    // de 213 px — le titre tronque a « CV — … », la pastille d'etat coupee sur
    // deux lignes et la date sur trois. Une liste a besoin de la largeur de
    // l'ecran ; seule la saisie a besoin d'une colonne etroite.
    <div className={pageWide}>
      <Title sub="Tes CV, lettres et demandes enregistres.">Mes documents</Title>

      {/* ---- Recherche, filtres et tri ----
           Ils n'apparaissent qu'a partir de six documents : sous ce seuil on
           voit tout d'un coup d'oeil, et trois rangees de commandes au-dessus
           de deux cartes ne servent qu'a encombrer. */}
      {documents.length > 5 && (
        <div className="mb-5 flex flex-col gap-3">
          <label className="relative block">
            <span className="sr-only">Rechercher un document</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un document…"
              className={`${input} pl-11`}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {([{ id: "all", label: "Tous" }] as { id: "all" | CareerKind; label: string }[])
              .concat(CAREER_KINDS.map((k) => ({ id: k, label: KIND_LABELS[k] })))
              .filter((f) => f.id === "all" || comptes[f.id] > 0)
              .map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltre(f.id)}
                  aria-pressed={filtre === f.id}
                  className={
                    "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[.83rem] font-bold transition " +
                    (filtre === f.id
                      ? "border-green bg-green text-white shadow-[0_6px_16px_-8px_rgba(99,102,241,.8)]"
                      : "border-gray-200 text-gray-600 hover:border-green/50 hover:text-green dark:border-white/10 dark:text-gray-300")
                  }
                >
                  {f.label}
                  <span className={filtre === f.id ? "text-white/70" : "text-gray-400"}>{comptes[f.id]}</span>
                </button>
              ))}

            <select
              value={tri}
              onChange={(e) => setTri(e.target.value as Tri)}
              aria-label="Trier les documents"
              className="ml-auto h-9 rounded-xl border border-gray-200 bg-white px-3 text-[.83rem] font-bold text-gray-600 outline-none transition focus:border-green dark:border-white/10 dark:bg-dark-800 dark:text-gray-300"
            >
              {TRIS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-white/15">
          <p className="text-[2rem]" aria-hidden="true">📄</p>
          <p className="mt-2 text-[.95rem] font-bold text-gray-900 dark:text-white">Aucun document pour l&apos;instant</p>
          <p className="mt-1 text-[.85rem] text-gray-500">Ton premier CV prend une dizaine de minutes.</p>
        </div>
      ) : filtres.length === 0 ? (
        // Distinct du vide initial : ici il Y A des documents, c'est la
        // recherche qui ne trouve rien. Dire « aucun document » ferait croire
        // qu'ils ont disparu.
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-white/15">
          <p className="text-[.95rem] font-bold text-gray-900 dark:text-white">Aucun document ne correspond</p>
          <p className="mt-1 text-[.85rem] text-gray-500">Essaie un autre mot, ou enleve le filtre.</p>
          <button
            type="button"
            onClick={() => {
              setRecherche("");
              setFiltre("all");
            }}
            className="mt-4 text-[.85rem] font-bold text-green transition hover:underline"
          >
            Tout afficher
          </button>
        </div>
      ) : (
        // `minmax(280px, 1fr)` plutot qu'un nombre fixe de colonnes : la grille
        // pose autant de cartes que la largeur en accepte, et jamais de carte
        // plus etroite que ce que son contenu demande.
        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {pagination.visibles.map((d) => (
            <li
              key={d.id}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-4 transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-green/50 hover:shadow-[0_14px_34px_-16px_rgba(99,102,241,.6)] dark:border-white/10 dark:bg-dark-800 dark:hover:shadow-[0_0_0_1px_rgba(99,102,241,.3),0_0_26px_-6px_rgba(139,92,246,.45)]"
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-green/15 to-neon-magenta/15 text-[1.2rem] ring-1 ring-inset ring-green/20"
                  aria-hidden="true"
                >
                  {ICONE[d.kind] || "📄"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[1rem] font-bold text-gray-900 dark:text-white">
                    {d.title || KIND_LABELS[d.kind]}
                  </p>
                  {/* La date sur sa propre ligne : cote a cote avec la pastille,
                      elles se coupaient toutes les deux des que la carte
                      retrecissait. */}
                  <p className="mt-1.5">
                    <span className="inline-block rounded-full bg-green/10 px-2 py-0.5 text-[.75rem] font-semibold text-green">
                      {accord(d.kind, "Pret")} a modifier
                    </span>
                  </p>
                  <p className="mt-1 truncate text-[.78rem] text-gray-500">
                    Modifie le {quand(d.updated_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => supprimer(d)}
                  disabled={suppression === d.id}
                  aria-label={`Supprimer ${d.title}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-brand-red disabled:opacity-50 dark:hover:bg-red-500/10"
                >
                  🗑
                </button>
              </div>

              {/* `mt-auto` : sur une rangee, toutes les cartes n'ont pas des
                  titres de meme longueur — les boutons s'alignent quand meme. */}
              <div className="mt-auto pt-4">
                <button
                  type="button"
                  onClick={() => onOuvrir(d)}
                  className="w-full rounded-xl border-[1.5px] border-green py-2.5 text-[.9rem] font-bold text-green transition group-hover:bg-green/5 active:scale-[.99]"
                >
                  Ouvrir ›
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination {...pagination} nom="document" />

      {/* Pleine largeur au pouce, borne sur grand ecran : un bouton de 900 px
          de long n'aide personne. */}
      <div className="mt-6 sm:max-w-[300px]">
        <PrimaryBtn onClick={onNouveau}>+ Nouveau document</PrimaryBtn>
      </div>
    </div>
  );
}
