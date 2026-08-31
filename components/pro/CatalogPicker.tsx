"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatFcfa, type QuoteItem } from "@/lib/pro";
import { api, input } from "./ui";

/**
 * Catalogue de prestations — les lignes habituelles du professionnel.
 *
 * Le problème qu'il résout : un devis se tapait entièrement de zéro, au pouce,
 * sur un téléphone. Or un menuisier refait les quinze mêmes prestations toute
 * l'année. Ici il les pose en une tape.
 *
 * Deux sens de circulation, volontairement dans le même écran :
 *   • du catalogue vers le document — on tape une prestation, elle s'ajoute ;
 *   • du document vers le catalogue — un bouton enregistre les lignes saisies,
 *     pour que le catalogue se remplisse à l'usage plutôt qu'au cours d'une
 *     séance de paramétrage que personne ne fera jamais.
 *
 * Ce qui part dans le document est une COPIE : changer un prix ici ne touche
 * aucune pièce déjà écrite, exactement comme les rubriques de devis.
 */

export type CatalogItem = {
  id: string;
  label: string;
  unit_price: number;
  unit: string | null;
  uses: number;
};

export default function CatalogPicker({
  open, onClose, onPick, currentItems, notify,
}: {
  open: boolean;
  onClose: () => void;
  /** Pose la prestation choisie sur le document en cours. */
  onPick: (item: QuoteItem) => void;
  /** Lignes déjà saisies, proposées à l'enregistrement. */
  currentItems: QuoteItem[];
  notify?: (message: string) => void;
}) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api("items", { action: "list" });
    setNeedsMigration(!!data?.needsMigration);
    setItems(data?.items || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  // Le fond ne doit pas défiler derrière la feuille.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((i) => i.label.toLowerCase().includes(needle));
  }, [items, query]);

  /** Lignes du document absentes du catalogue — les seules à proposer. */
  const savable = useMemo(() => {
    const known = new Set(items.map((i) => i.label.trim().toLowerCase()));
    const seen = new Set<string>();
    return currentItems.filter((it) => {
      const key = it.label.trim().toLowerCase();
      if (!key || known.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [items, currentItems]);

  function pick(it: CatalogItem) {
    onPick({ label: it.label, qty: 1, unit_price: it.unit_price });
    // Compteur d'usage : c'est lui qui fait remonter les prestations du
    // quotidien en tête de liste. Sans attente — le devis ne doit pas
    // patienter pour une statistique.
    api("items", { action: "use", id: it.id }).catch(() => {});
    onClose();
  }

  async function saveCurrent() {
    setBusy(true);
    const { ok, data } = await api("items", { action: "save", items: savable });
    setBusy(false);
    if (!ok) return notify?.("⚠ " + (data?.error || "Enregistrement impossible"));
    const n = Number(data?.added) || 0;
    notify?.(`✓ ${n} prestation${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""} au catalogue`);
    load();
  }

  async function remove(id: string) {
    setConfirmDelete(null);
    setItems((list) => list.filter((i) => i.id !== id));
    const { ok } = await api("items", { action: "delete", id });
    if (!ok) load();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[970] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[85vh] w-full flex-col rounded-t-[22px] bg-white shadow-2xl dark:bg-dark-800 sm:max-w-[560px] sm:rounded-[22px]">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/10">
          <div className="min-w-0 flex-1">
            <div className="text-[.95rem] font-extrabold text-gray-900 dark:text-white">📚 Mon catalogue</div>
            <div className="text-[.7rem] text-gray-500 dark:text-gray-400">
              Vos prestations habituelles, en une tape.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[1.1rem] text-gray-400 transition hover:bg-gray-100 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {items.length > 6 && (
          <div className="px-4 pt-3">
            <input
              className={input}
              placeholder="Rechercher une prestation…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {needsMigration ? (
            <p className="rounded-xl bg-amber-50 p-3.5 text-[.8rem] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              Le catalogue n&apos;est pas encore installé sur la base de données.
              Exécutez <b>MIGRATION_CATALOGUE_PRESTATIONS.sql</b>, puis revenez ici.
            </p>
          ) : loading ? (
            <p className="py-8 text-center text-[.85rem] text-gray-400">Chargement…</p>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-[2rem]">📚</p>
              <p className="mt-1 text-[.85rem] font-bold text-gray-700 dark:text-gray-200">
                {items.length === 0 ? "Votre catalogue est vide" : "Aucune prestation trouvée"}
              </p>
              <p className="mx-auto mt-1 max-w-[320px] text-[.75rem] leading-relaxed text-gray-500 dark:text-gray-400">
                {items.length === 0
                  ? "Saisissez vos lignes normalement, puis enregistrez-les ici : la prochaine fois, elles seront à une tape."
                  : "Essayez un autre mot."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-2 rounded-xl border border-gray-100 transition hover:border-green/40 dark:border-white/10"
                >
                  <button
                    type="button"
                    onClick={() => pick(it)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[.86rem] font-semibold text-gray-900 dark:text-white">
                        {it.label}
                      </span>
                      {it.uses > 0 && (
                        <span className="block text-[.68rem] text-gray-400">
                          utilisée {it.uses} fois
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-[.85rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                      {formatFcfa(it.unit_price)}
                    </span>
                  </button>

                  {confirmDelete === it.id ? (
                    <span className="flex shrink-0 items-center gap-1 pr-2">
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        className="rounded-lg bg-brand-red px-2.5 py-1.5 text-[.72rem] font-bold text-white"
                      >
                        Supprimer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-lg px-2 py-1.5 text-[.72rem] font-bold text-gray-500"
                      >
                        Non
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Retirer ${it.label} du catalogue`}
                      onClick={() => setConfirmDelete(it.id)}
                      className="mr-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-brand-red dark:hover:bg-red-500/10"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Le catalogue se remplit à l'usage : on n'oblige personne à une
            séance de paramétrage préalable. */}
        {!needsMigration && savable.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 dark:border-white/10">
            <button
              type="button"
              onClick={saveCurrent}
              disabled={busy}
              className="w-full rounded-xl border-[1.5px] border-green px-3 py-2.5 text-[.82rem] font-extrabold text-green transition hover:bg-green/5 disabled:opacity-50"
            >
              {busy
                ? "Enregistrement…"
                : `+ Ajouter au catalogue ${savable.length} ligne${savable.length > 1 ? "s" : ""} de ce document`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
