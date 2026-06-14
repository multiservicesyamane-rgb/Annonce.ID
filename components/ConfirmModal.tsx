"use client";

import { useEffect, useRef } from "react";

/**
 * Modale de confirmation pour actions destructives.
 * Overlay sombre + glassmorphism + boutons Annuler/Confirmer.
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Confirmer l'action",
  description = "Cette action est irréversible. Voulez-vous continuer ?",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Fermer avec Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Bloquer le scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeUp"
        onClick={onClose}
      />
      {/* Modal */}
      <div
        ref={ref}
        className="relative z-10 w-full max-w-[400px] rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-6 shadow-lg animate-fadeUp"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 dark:bg-dark-700 text-[1.5rem] mx-auto">
          {danger ? "⚠️" : "❓"}
        </div>
        <h3 className="text-center font-display text-[1.1rem] font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-center text-[.85rem] text-gray-500 dark:text-white/60 mb-6">
          {description}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn btn-outline flex-1 dark:border-dark-border dark:!text-white/70 dark:hover:bg-dark-700"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`btn flex-1 ${danger ? "bg-brand-red text-white hover:bg-red-700" : "btn-green"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
