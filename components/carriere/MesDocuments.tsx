"use client";

import { useState } from "react";
import { PrimaryBtn, Title, api, page } from "./ui";
import { KIND_LABELS, accord, type CareerKind } from "@/lib/carriere";

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
    <div className={page}>
      <Title sub="Tes CV, lettres et demandes enregistres.">Mes documents</Title>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-white/15">
          <p className="text-[2rem]" aria-hidden="true">📄</p>
          <p className="mt-2 text-[.95rem] font-bold text-gray-900 dark:text-white">Aucun document pour l&apos;instant</p>
          <p className="mt-1 text-[.85rem] text-gray-500">Ton premier CV prend une dizaine de minutes.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((d) => (
            <li key={d.id} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-dark-800">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green/10 text-[1.2rem]" aria-hidden="true">
                  {ICONE[d.kind] || "📄"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[1rem] font-bold text-gray-900 dark:text-white">{d.title || KIND_LABELS[d.kind]}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[.8rem] text-gray-500">
                    <span className="rounded-full bg-green/10 px-2 py-0.5 font-semibold text-green">
                      {accord(d.kind, "Pret")} a modifier
                    </span>
                    <span>Modifie le {quand(d.updated_at)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => supprimer(d)}
                  disabled={suppression === d.id}
                  aria-label={`Supprimer ${d.title}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-brand-red disabled:opacity-50"
                >
                  🗑
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOuvrir(d)}
                className="mt-3 w-full rounded-xl border-[1.5px] border-green py-2.5 text-[.9rem] font-bold text-green transition active:scale-[.99]"
              >
                Ouvrir ›
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Pleine largeur au pouce, borne sur grand ecran : un bouton de 900 px
          de long n'aide personne. */}
      <div className="mt-6 sm:max-w-[300px]">
        <PrimaryBtn onClick={onNouveau}>+ Nouveau document</PrimaryBtn>
      </div>
    </div>
  );
}
