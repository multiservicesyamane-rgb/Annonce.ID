"use client";

import { useDeferredValue, useEffect } from "react";
import { formatFcfa } from "@/lib/pro";
import PrintableDocument, { type PrintDoc, type PrintParty } from "./PrintableDocument";
import A4Preview from "./A4Preview";

/**
 * Aperçu en direct d'un devis ou d'une facture, pendant sa saisie.
 *
 * Ce qui est montré n'est PAS une maquette approchante : c'est le composant
 * d'impression lui-même (PrintableDocument), avec le modèle, la couleur, le
 * logo, la signature et le cachet du professionnel. Ce qu'on voit ici est,
 * au pixel près, ce que le client recevra.
 *
 * Sur ordinateur l'aperçu occupe la colonne de droite et suit le défilement ;
 * sur téléphone la place manque, il s'ouvre alors en plein écran depuis le
 * bouton « Aperçu » de la barre d'action basse.
 */

type Common = { doc: PrintDoc; seller: PrintParty | null; client: PrintParty | null };

/** Émetteur d'attente : le temps que le profil d'entreprise arrive. */
const FALLBACK_SELLER: PrintParty = { name: "Votre entreprise" };

function Sheet({ doc, seller, client }: Common) {
  // La frappe reste prioritaire : React sert d'abord le champ, puis rafraîchit
  // la feuille. Sans cela, chaque caractère relayoute un document entier.
  const deferred = useDeferredValue(doc);

  return (
    <A4Preview>
      <PrintableDocument mode="preview" doc={deferred} seller={seller || FALLBACK_SELLER} client={client} />
    </A4Preview>
  );
}

/* ====================== Ordinateur : colonne de droite ====================== */

export function PreviewAside({
  doc, seller, client, actionLabel, onAction, busy, onExpand, children,
}: Common & {
  actionLabel: string;
  onAction: () => void;
  busy?: boolean;
  /** Ouvre la feuille en plein écran, à taille réelle. */
  onExpand?: () => void;
  /** Encarts contextuels (conseils, avertissement de révision…). */
  children?: React.ReactNode;
}) {
  return (
    <aside className="hidden lg:sticky lg:top-4 lg:flex lg:flex-col lg:gap-3 lg:self-start">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-3.5 py-2.5 dark:border-dark-border dark:bg-dark-800">
        <div className="min-w-0 flex-1">
          <div className="text-[.62rem] font-bold uppercase tracking-wide text-gray-400">
            Aperçu A4 · total
          </div>
          <div className="truncate font-mono text-[1.05rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
            {formatFcfa(doc.total)}
          </div>
        </div>
        {/* Réduite à la largeur de la colonne, la page tourne autour de 60 % :
            lisible, mais juste. Le plein écran la rend à sa taille réelle. */}
        {onExpand && (
          <button
            onClick={onExpand}
            title="Voir en grand"
            className="shrink-0 rounded-xl border-[1.5px] border-gray-200 px-3 py-2.5 text-[.8rem] font-bold text-gray-600 transition hover:border-green/50 hover:text-green dark:border-dark-border dark:text-gray-300"
          >
            ⤢
          </button>
        )}
        <button
          onClick={onAction}
          disabled={busy}
          className="shrink-0 rounded-xl bg-green px-5 py-2.5 text-[.85rem] font-extrabold text-white shadow-sm transition active:scale-[.98] disabled:opacity-50"
        >
          {busy ? "Enregistrement…" : actionLabel}
        </button>
      </div>

      {/* La feuille peut faire plusieurs pages : elle défile dans son cadre,
          sans emmener tout le formulaire avec elle. */}
      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto rounded-2xl bg-gray-200/60 p-3 dark:bg-black/40">
        <Sheet doc={doc} seller={seller} client={client} />
      </div>

      {children}
    </aside>
  );
}

/* ====================== Plein écran ======================
   Seul aperçu disponible sur téléphone, où aucune colonne ne tient à côté
   du formulaire ; sur ordinateur c'est la loupe de la colonne de droite. */

export function PreviewOverlay({
  open, onClose, doc, seller, client,
}: Common & { open: boolean; onClose: () => void }) {
  // Le fond ne doit pas défiler derrière l'aperçu.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  // Fermeture au bouton retour du téléphone plutôt que sortie de la page.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[960] flex flex-col bg-gray-200 dark:bg-[#0A0E14]">
      <div className="flex items-center gap-3 border-b border-black/10 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-dark-800">
        <button
          onClick={onClose}
          aria-label="Fermer l'aperçu"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[1.2rem] text-gray-500 transition active:bg-gray-100 dark:active:bg-white/10"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[.85rem] font-extrabold text-gray-900 dark:text-white">
            Aperçu {doc.kind === "devis" ? "du devis" : "de la facture"}
          </div>
          <div className="text-[.68rem] text-gray-500 dark:text-gray-400">
            Format A4 — tel que votre client le recevra
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[.58rem] font-bold uppercase tracking-wide text-gray-400">Total</div>
          <div className="font-mono text-[.9rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
            {formatFcfa(doc.total)}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        {/* Au-delà de la largeur d'une page, l'agrandir n'apporterait rien :
            A4Preview plafonne à 1, on centre simplement la feuille. */}
        <div className="mx-auto w-full max-w-[794px]">
          <Sheet doc={doc} seller={seller} client={client} />
          <p className="mt-3 text-center text-[.7rem] leading-relaxed text-gray-500 dark:text-gray-400">
            Le document n&apos;est pas encore enregistré. Fermez cet aperçu pour
            continuer la saisie.
          </p>
        </div>
      </div>
    </div>
  );
}
