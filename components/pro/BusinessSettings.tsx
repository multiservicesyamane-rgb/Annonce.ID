"use client";

// Identité professionnelle : l'en-tête qui figure sur tous les devis et
// factures. Sans elle, les documents portent seulement le nom du profil, ce qui
// suffit rarement à un client qui réclame une facture en bonne et due forme.

import { useEffect, useState } from "react";
import { TAX_RATES } from "@/lib/pro";
import { api, card, input, lbl, F, Section, type Toast } from "./ui";

export default function BusinessSettings({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [taxRate, setTaxRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api("settings", { action: "get" });
      const s = data?.settings;
      if (s) {
        setForm({
          business_name: s.business_name || "",
          tax_id: s.tax_id || "",
          address: s.address || "",
          email: s.email || "",
          phone: s.phone || "",
          payment_details: s.payment_details || "",
          default_terms: s.default_terms || "",
        });
        setTaxRate(Number(s.default_tax_rate) || 0);
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setBusy(true);
    const { ok, data } = await api("settings", {
      action: "save",
      ...form,
      default_tax_rate: taxRate,
    });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));
    toast("✓ Identité professionnelle enregistrée");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div
        className={`${card} mx-auto my-6 w-full max-w-[620px] p-5 sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.15rem] font-extrabold text-gray-900 dark:text-white">
              Mon entreprise
            </h2>
            <p className="mt-0.5 text-[.82rem] text-gray-500 dark:text-gray-400">
              Ces informations apparaissent en en-tête de vos devis et factures.
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
            <Section icon="🏢" title="Identité">
              <div className="grid gap-3 sm:grid-cols-2">
                <F
                  l="Raison sociale"
                  v={form.business_name}
                  set={(v) => setForm({ ...form, business_name: v })}
                  ph="Ex : YAMANE TECH"
                  hint="Laissez vide pour utiliser votre nom de profil."
                />
                <F l="NINEA / RCCM" v={form.tax_id} set={(v) => setForm({ ...form, tax_id: v })} ph="Ex : 005812345 2A2" />
                <F l="Téléphone professionnel" v={form.phone} set={(v) => setForm({ ...form, phone: v })} ph="+221 77 000 00 00" />
                <F l="Email professionnel" v={form.email} set={(v) => setForm({ ...form, email: v })} ph="contact@monentreprise.sn" />
                <div className="sm:col-span-2">
                  <F l="Adresse" v={form.address} set={(v) => setForm({ ...form, address: v })} ph="Ex : 12 rue Carnot, Dakar" />
                </div>
              </div>
            </Section>

            <Section icon="💳" title="Comment vos clients vous règlent">
              <textarea
                className={`${input} min-h-[70px] resize-none`}
                placeholder="Ex : Wave ou Orange Money au 77 000 00 00 — ou virement CBAO SN012..."
                value={form.payment_details || ""}
                onChange={(e) => setForm({ ...form, payment_details: e.target.value })}
              />
              <p className="mt-1.5 text-[.72rem] text-gray-400">
                Affiché en évidence sur la facture que reçoit votre client.
              </p>
            </Section>

            <Section icon="⚙️" title="Valeurs par défaut">
              <div className="flex flex-col gap-3">
                <div>
                  <span className={lbl}>TVA appliquée par défaut</span>
                  <div className="flex gap-2">
                    {TAX_RATES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTaxRate(r)}
                        className={`flex-1 rounded-xl border px-3 py-2.5 text-[.83rem] font-bold transition ${
                          taxRate === r
                            ? "border-green bg-green text-white"
                            : "border-gray-200 text-gray-600 hover:border-green/50 dark:border-dark-border dark:text-gray-300"
                        }`}
                      >
                        {r === 0 ? "Non assujetti" : `${r} %`}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className={lbl}>Conditions de paiement habituelles</span>
                  <textarea
                    className={`${input} min-h-[70px] resize-none`}
                    placeholder="Ex : 50 % à la commande, solde à la livraison."
                    value={form.default_terms || ""}
                    onChange={(e) => setForm({ ...form, default_terms: e.target.value })}
                  />
                </div>
              </div>
            </Section>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-[.83rem] font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="btn btn-green flex-1 py-2.5 text-[.85rem] font-extrabold disabled:opacity-50"
              >
                {busy ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
