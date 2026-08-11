"use client";

// Rubriques réutilisables des devis : déroulé de la mission, conditions,
// modalités de paiement…
//
// Réglées UNE fois ici, elles sont recopiées dans chaque devis créé ensuite.
// Volontairement facultatif : tant que le professionnel n'y touche pas, ses
// devis partent avec les rubriques par défaut. Le forcer à traverser un
// assistant avant son premier devis ferait fuir celui qui veut juste envoyer
// un prix dans la journée.

import { useEffect, useState } from "react";
import { DEFAULT_QUOTE_SECTIONS, type QuoteSection } from "@/lib/pro";
import { api, cardRaised, input, Section, type Toast } from "./ui";

export default function QuoteSectionsEditor({
  toast, onClose,
}: { toast: Toast; onClose: () => void }) {
  const [sections, setSections] = useState<QuoteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api("settings", { action: "get" });
      const saved = data?.settings?.quote_sections;
      // Rien d'enregistré : on part des rubriques par défaut, déjà remplies
      // d'exemples. Un formulaire vide n'aide personne à démarrer.
      setSections(Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_QUOTE_SECTIONS);
      setLoading(false);
    })();
  }, []);

  const patchSection = (i: number, patch: Partial<QuoteSection>) =>
    setSections((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const patchItem = (si: number, ii: number, patch: Partial<QuoteSection["items"][number]>) =>
    setSections((prev) =>
      prev.map((s, j) =>
        j === si ? { ...s, items: s.items.map((it, k) => (k === ii ? { ...it, ...patch } : it)) } : s,
      ),
    );

  const addItem = (si: number) =>
    setSections((prev) =>
      prev.map((s, j) => (j === si ? { ...s, items: [...s.items, { label: "", body: "" }] } : s)),
    );

  const removeItem = (si: number, ii: number) =>
    setSections((prev) =>
      prev.map((s, j) => (j === si ? { ...s, items: s.items.filter((_, k) => k !== ii) } : s)),
    );

  async function save() {
    setBusy(true);
    const { ok, data } = await api("settings", { action: "save", quote_sections: sections });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));
    // Migration pas encore passée : l'API a enregistré le reste mais pas les
    // rubriques. Le dire franchement plutôt que d'afficher un faux succès.
    if (data?.warning) return toast("⚠ " + data.warning);
    toast("✓ Rubriques enregistrées — vos prochains devis les reprendront");
    onClose();
  }

  const activeCount = sections.filter((s) => s.enabled).length;

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div
        className={`${cardRaised} mx-auto my-6 w-full max-w-[680px] p-5 sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.15rem] font-extrabold text-gray-900 dark:text-white">
              Mes devis par défaut
            </h2>
            <p className="mt-0.5 text-[.82rem] text-gray-500 dark:text-gray-400">
              Réglez ces rubriques une fois : chaque nouveau devis les reprendra automatiquement.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-400">Chargement…</div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-green/25 bg-green/5 px-3.5 py-2.5 text-[.78rem] leading-relaxed text-gray-600 dark:text-gray-300">
              Les devis <b>déjà envoyés ne changent pas</b> : chaque devis garde une copie des
              rubriques telles qu'elles étaient au moment de sa création.
            </div>

            {sections.map((s, si) => (
              <Section
                key={s.key}
                icon={s.icon || "•"}
                title={s.title}
                aside={
                  <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[.72rem] font-bold text-gray-500 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) => patchSection(si, { enabled: e.target.checked })}
                      className="h-4 w-4 accent-[#6366F1]"
                    />
                    {s.enabled ? "Affichée" : "Masquée"}
                  </label>
                }
              >
                <div className={s.enabled ? "" : "pointer-events-none opacity-40"}>
                  <div className="flex flex-col gap-3">
                    {s.items.map((it, ii) => (
                      <div
                        key={ii}
                        className="rounded-xl border border-gray-100 p-2.5 dark:border-white/10"
                      >
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green/10 text-[.66rem] font-bold text-green">
                            {ii + 1}
                          </span>
                          <input
                            className={input}
                            value={it.label}
                            placeholder="Intitulé — ex : Révisions incluses"
                            onChange={(e) => patchItem(si, ii, { label: e.target.value })}
                          />
                          <button
                            type="button"
                            aria-label="Retirer cette entrée"
                            onClick={() => removeItem(si, ii)}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-brand-red dark:hover:bg-red-500/10"
                          >
                            ✕
                          </button>
                        </div>
                        <textarea
                          className={`${input} mt-2 min-h-[62px] resize-none`}
                          value={it.body}
                          placeholder="Texte affiché au client…"
                          onChange={(e) => patchItem(si, ii, { body: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>

                  {s.items.length < 12 && (
                    <button
                      type="button"
                      onClick={() => addItem(si)}
                      className="mt-3 w-full rounded-xl border border-dashed border-green/40 px-3 py-2 text-[.8rem] font-bold text-green transition hover:border-green hover:bg-green/5"
                    >
                      + Ajouter une entrée
                    </button>
                  )}
                </div>
              </Section>
            ))}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setSections(DEFAULT_QUOTE_SECTIONS)}
                className="text-[.8rem] font-bold text-gray-500 transition hover:text-green"
              >
                ↺ Revenir aux rubriques proposées
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="btn btn-green px-6 py-2.5 text-[.85rem] font-extrabold disabled:opacity-50"
              >
                {busy ? "Enregistrement…" : `Enregistrer (${activeCount} rubrique${activeCount > 1 ? "s" : ""})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
