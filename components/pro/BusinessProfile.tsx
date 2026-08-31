"use client";

// Profil d'entreprise — tout ce qui habille les pièces comptables :
// identité, modèle de document, signature et cachet, règlement, valeurs par
// défaut.
//
// C'était une fenêtre enfouie dans « Mon Activité », que personne n'ouvrait :
// `pro_settings` est resté vide, donc les factures partaient sans raison
// sociale ni NINEA. C'est désormais un écran à part entière, dans les réglages.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TAX_RATES, canChargeTax, INVOICE_TITLES, DOC_TEMPLATES,
  type BusinessStatus, type DocTemplate,
} from "@/lib/pro";
import { createClient } from "@/lib/supabase/client";
import { api, card, input, lbl, F, PageHead, Section, stickyAside, type Toast } from "./ui";

const ACCENTS = ["#4F46E5", "#0891B2", "#047857", "#B45309", "#B91C1C", "#7C3AED", "#111827"];

/**
 * Vignette d'un modèle : en-tête, tableau de facturation, bandeau de total.
 *
 * Elle est dessinée à partir de la MÊME spécification que le document réel
 * (DOC_TEMPLATES dans lib/pro), pas d'une image ni d'une description : ce que
 * l'on voit ici ne peut pas cesser de correspondre à ce qui s'imprime. Choisir
 * un modèle sur dix depuis une liste de noms serait un pari — ici on voit la
 * différence.
 */
function TemplateThumb({ tpl, accent }: { tpl: DocTemplate; accent: string }) {
  const s = tpl.spec;
  const tint = `${accent}22`;

  // En-tête : le même vocabulaire que le document (bandeau, filet, encadré,
  // barre latérale, centré, rien).
  const head =
    s.header === "band" ? (
      <div className="flex h-4 items-center gap-1 px-1.5" style={{ background: accent }}>
        <span className="h-1 w-4 rounded-sm bg-white/90" />
        <span className="ml-auto h-1 w-3 rounded-sm bg-white/70" />
      </div>
    ) : s.header === "frame" ? (
      <div className="m-1 flex h-3.5 items-center gap-1 rounded-[2px] px-1" style={{ border: `1px solid ${accent}` }}>
        <span className="h-1 w-4 rounded-sm bg-gray-400" />
        <span className="ml-auto h-1 w-3 rounded-sm" style={{ background: accent }} />
      </div>
    ) : s.header === "side" ? (
      <div className="m-1 flex h-3.5 items-center gap-1 pl-1.5" style={{ borderLeft: `2px solid ${accent}` }}>
        <span className="h-1 w-4 rounded-sm bg-gray-400" />
        <span className="ml-auto h-1 w-3 rounded-sm" style={{ background: accent }} />
      </div>
    ) : s.header === "stack" ? (
      <div className="flex flex-col items-center gap-0.5 pt-1.5">
        <span className="h-1 w-6 rounded-sm bg-gray-400" />
        <span className="h-1 w-4 rounded-sm" style={{ background: accent }} />
        <span className="mt-0.5 h-[1.5px] w-10" style={{ background: accent }} />
      </div>
    ) : (
      <div className="m-1">
        <div className="flex items-center gap-1">
          <span className="h-1 w-4 rounded-sm bg-gray-400" />
          <span className="ml-auto h-1 w-3 rounded-sm" style={{ background: s.header === "plain" ? "#9CA3AF" : accent }} />
        </div>
        <div
          className="mt-1 w-full"
          style={{ height: s.header === "plain" ? 1 : 2, background: s.header === "plain" ? "#E5E7EB" : accent }}
        />
      </div>
    );

  // Tableau : c'est lui qui distingue vraiment les modèles entre eux.
  const framed = s.table !== "rule";
  const rows = [0, 1, 2];

  return (
    <span className="block overflow-hidden rounded-[4px] bg-white" style={{ border: "1px solid #E5E7EB" }}>
      {head}

      <span className="block px-1.5 pb-1.5 pt-1">
        <span
          className="block"
          style={framed ? { border: `1px solid ${accent}` } : undefined}
        >
          <span
            className="flex h-2.5 items-center gap-1 px-1"
            style={{
              background: s.table === "head" ? accent : s.table === "rule" ? "transparent" : tint,
              borderBottom:
                s.table === "head" ? "none" : `${s.table === "rule" ? 1.5 : 1}px solid ${accent}`,
            }}
          >
            <span className={`h-[2px] w-5 rounded-sm ${s.table === "head" ? "bg-white/90" : "bg-gray-500"}`} />
            <span className={`ml-auto h-[2px] w-2.5 rounded-sm ${s.table === "head" ? "bg-white/70" : "bg-gray-400"}`} />
          </span>

          {rows.map((r) => (
            <span
              key={r}
              className="flex h-2.5 items-center gap-1 px-1"
              style={{
                background: s.table === "zebra" && r % 2 === 1 ? tint : "transparent",
                borderBottom: r < 2 ? "1px solid #E5E7EB" : "none",
              }}
            >
              <span className="h-[2px] w-6 rounded-sm bg-gray-300" />
              {s.table === "grid" && <span className="h-2.5 w-px bg-gray-200" />}
              <span className="ml-auto h-[2px] w-3 rounded-sm bg-gray-400" />
            </span>
          ))}
        </span>

        {/* Bandeau de total : plein ou simplement encadré. */}
        <span
          className="mt-1 flex h-2.5 items-center justify-end rounded-[2px] px-1"
          style={s.solid ? { background: accent } : { border: `1.5px solid ${accent}` }}
        >
          <span className={`h-[2px] w-4 rounded-sm ${s.solid ? "bg-white/90" : "bg-gray-500"}`} />
        </span>
      </span>
    </span>
  );
}

type Asset = "logo_url" | "signature_url" | "stamp_url";

export default function BusinessProfile({ toast }: { toast: Toast }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [taxRate, setTaxRate] = useState(0);
  const [template, setTemplate] = useState("classique");
  const [status, setStatus] = useState<BusinessStatus>("informel");
  const [docTitle, setDocTitle] = useState("FACTURE");
  const [accent, setAccent] = useState<string | null>(null);
  const [assets, setAssets] = useState<Record<Asset, string | null>>({
    logo_url: null, signature_url: null, stamp_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<Asset | null>(null);
  const [supabase] = useState(() => createClient());

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
          signature_label: s.signature_label || "",
        });
        setTaxRate(Number(s.default_tax_rate) || 0);
        setTemplate(s.doc_template || "classique");
        setStatus(s.business_status === "formel" ? "formel" : "informel");
        setDocTitle(s.invoice_title || "FACTURE");
        setAccent(s.doc_accent || null);
        setAssets({
          logo_url: s.logo_url || null,
          signature_url: s.signature_url || null,
          stamp_url: s.stamp_url || null,
        });
      }
      setLoading(false);
    })();
  }, []);

  /** Dépose un fichier dans `pro-docs`, sous le dossier du compte. */
  const upload = useCallback(async (field: Asset, blob: Blob, ext: string) => {
    setUploading(field);
    try {
      const { data: session } = await supabase.auth.getUser();
      const uid = session?.user?.id;
      if (!uid) { toast("⚠ Session expirée"); return; }

      // Le premier segment DOIT être l'identifiant du compte : c'est ce que
      // vérifie la policy d'écriture du bucket. Le suffixe aléatoire rend
      // l'URL non devinable, et évite qu'un remplacement soit masqué par le
      // cache du navigateur.
      const path = `${uid}/entreprise/${field}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("pro-docs").upload(path, blob, { upsert: false });
      if (error) { toast("⚠ " + error.message); return; }

      const { data: pub } = supabase.storage.from("pro-docs").getPublicUrl(path);
      setAssets((a) => ({ ...a, [field]: pub.publicUrl }));
      toast("✓ Image ajoutée — pensez à enregistrer");
    } finally {
      setUploading(null);
    }
  }, [supabase, toast]);

  async function onPick(field: Asset, file: File | null) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return toast("⚠ Image PNG, JPEG ou WebP attendue.");
    if (file.size > 2 * 1024 * 1024) return toast("⚠ Image trop lourde (2 Mo maximum).");
    await upload(field, file, file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg");
  }

  async function save() {
    setBusy(true);
    const { ok, data } = await api("settings", {
      action: "save",
      ...form,
      default_tax_rate: taxRate,
      business_status: status,
      invoice_title: docTitle,
      doc_template: template,
      doc_accent: accent,
      ...assets,
    });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));
    if (data?.warning) return toast("⚠ " + data.warning);
    toast("✓ Profil d'entreprise enregistré");
  }

  if (loading) return <div className="py-16 text-center text-gray-400">Chargement…</div>;

  const activeAccent = accent || DOC_TEMPLATES.find((t) => t.id === template)?.spec.accent || "#4F46E5";

  return (
    <div className="mx-auto w-full max-w-[980px] xl:max-w-[1180px]">
      <PageHead title="Profil entreprise" count="Ce qui apparaît sur vos devis et factures" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <Section icon="📋" title="Votre situation">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {([
                {
                  id: "informel" as const,
                  title: "Je n'ai pas encore de papiers",
                  sub: "Vous facturez normalement, sans TVA.",
                },
                {
                  id: "formel" as const,
                  title: "J'ai un NINEA / RCCM",
                  sub: "Numéro imprimé, TVA disponible.",
                },
              ]).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setStatus(o.id);
                    // Repasser en informel remet la TVA à zéro : la garder
                    // afficherait un taux que le serveur refusera d'écrire.
                    if (o.id === "informel") setTaxRate(0);
                  }}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    status === o.id
                      ? "border-green bg-green/5 ring-2 ring-green/20"
                      : "border-gray-200 hover:border-green/40 dark:border-dark-border"
                  }`}
                >
                  <span className="block text-[.85rem] font-extrabold text-gray-900 dark:text-white">{o.title}</span>
                  <span className="mt-0.5 block text-[.72rem] leading-snug text-gray-500 dark:text-gray-400">{o.sub}</span>
                </button>
              ))}
            </div>

            {status === "informel" && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-[.76rem] leading-relaxed text-gray-600 dark:border-dark-border dark:bg-white/5 dark:text-gray-300">
                Vous gardez <b>toutes les fonctions</b> : devis, factures, clients, projets, relances,
                signature. Seule la TVA est indisponible — on ne collecte pas une taxe sans être
                immatriculé. Vos clients entreprises réclameront un NINEA pour justifier leur
                dépense : c&apos;est souvent la seule raison d&apos;en demander un.
              </div>
            )}
          </Section>

          <Section icon="🏢" title="Identité">
            <div className="grid gap-3 sm:grid-cols-2">
              <F
                l="Raison sociale"
                v={form.business_name}
                set={(v) => setForm({ ...form, business_name: v })}
                ph="Ex : YAMANE TECH"
                hint="Laissez vide pour utiliser votre nom de profil."
              />
              {status === "formel" && (
                <F l="NINEA / RCCM" v={form.tax_id} set={(v) => setForm({ ...form, tax_id: v })} ph="Ex : 005812345 2A2" />
              )}
              <F l="Téléphone professionnel" v={form.phone} set={(v) => setForm({ ...form, phone: v })} ph="+221 77 000 00 00" />
              <F l="Email professionnel" v={form.email} set={(v) => setForm({ ...form, email: v })} ph="contact@monentreprise.sn" />
              <div className="sm:col-span-2">
                <F l="Adresse" v={form.address} set={(v) => setForm({ ...form, address: v })} ph="Ex : 12 rue Carnot, Dakar" />
              </div>
            </div>
          </Section>

          <Section icon="🖼️" title="Logo">
            <p className="mb-3 text-[.78rem] leading-relaxed text-gray-500 dark:text-gray-400">
              Sans logo, l'en-tête de vos documents reprend la photo de votre boutique d'annonces —
              rarement ce qu'on veut sur une facture.
            </p>
            <AssetField
              value={assets.logo_url}
              busy={uploading === "logo_url"}
              onPick={(f) => onPick("logo_url", f)}
              onClear={() => setAssets((a) => ({ ...a, logo_url: null }))}
              hint="PNG à fond transparent de préférence."
            />
          </Section>

          <Section icon="🎨" title="Modèle de document">
            <p className="mb-3 text-[.78rem] leading-relaxed text-gray-500 dark:text-gray-400">
              Dix mises en page. Ce qui change n&apos;est pas la couleur mais la structure :
              l&apos;en-tête, et surtout le dessin du <b className="text-gray-700 dark:text-gray-200">tableau
              de facturation</b> — le bloc que votre client regarde en premier.
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {DOC_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  aria-pressed={template === t.id}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    template === t.id
                      ? "border-green bg-green/5 ring-2 ring-green/20"
                      : "border-gray-200 hover:border-green/40 dark:border-dark-border"
                  }`}
                >
                  <TemplateThumb tpl={t} accent={accent || t.spec.accent} />
                  <span className="mt-2 block text-[.82rem] font-extrabold text-gray-900 dark:text-white">
                    {t.name}
                  </span>
                  <span className="block text-[.67rem] leading-snug text-gray-500 dark:text-gray-400">
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <span className={lbl}>Couleur d&apos;accent</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAccent(null)}
                  className={`rounded-lg border px-3 py-1.5 text-[.75rem] font-bold transition ${
                    accent === null ? "border-green text-green" : "border-gray-200 text-gray-500 dark:border-dark-border"
                  }`}
                >
                  Celle du modèle
                </button>
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Accent ${c}`}
                    onClick={() => setAccent(c)}
                    className={`h-8 w-8 rounded-lg border-2 transition ${
                      accent === c ? "border-gray-900 dark:border-white" : "border-transparent"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </Section>

          <Section icon="✍️" title="Signature et cachet">
            <p className="mb-3 text-[.78rem] leading-relaxed text-gray-500 dark:text-gray-400">
              Apposés au bas des devis et factures. Dessinez votre signature au doigt, ou importez
              une image scannée.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className={lbl}>Signature</span>
                <SignaturePad
                  value={assets.signature_url}
                  busy={uploading === "signature_url"}
                  onDrawn={(blob) => upload("signature_url", blob, "png")}
                  onPick={(f) => onPick("signature_url", f)}
                  onClear={() => setAssets((a) => ({ ...a, signature_url: null }))}
                />
              </div>
              <div>
                <span className={lbl}>Cachet</span>
                <AssetField
                  value={assets.stamp_url}
                  busy={uploading === "stamp_url"}
                  onPick={(f) => onPick("stamp_url", f)}
                  onClear={() => setAssets((a) => ({ ...a, stamp_url: null }))}
                  hint="Photo ou scan du tampon."
                />
              </div>
            </div>

            <div className="mt-3">
              <F
                l="Mention sous la signature"
                v={form.signature_label}
                set={(v) => setForm({ ...form, signature_label: v })}
                ph="Ex : Ibrahima Diop — Gérant"
                hint="Sans elle, une signature scannée n'indique pas qui signe."
              />
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
                <span className={lbl}>Intitulé de vos pièces</span>
                <div className="flex gap-2">
                  {INVOICE_TITLES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDocTitle(t)}
                      className={`flex-1 rounded-xl border px-3 py-2.5 text-[.83rem] font-bold transition ${
                        docTitle === t
                          ? "border-green bg-green text-white"
                          : "border-gray-200 text-gray-600 hover:border-green/50 dark:border-dark-border dark:text-gray-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[.7rem] text-gray-400">
                  Le mot attendu n&apos;est pas le même pour un artisan et pour une société.
                </p>
              </div>

              <div>
                <span className={lbl}>TVA appliquée par défaut</span>
                <div className="flex gap-2">
                  {TAX_RATES.map((r) => {
                    const blocked = r > 0 && !canChargeTax(status);
                    return (
                      <button
                        key={r}
                        type="button"
                        disabled={blocked}
                        onClick={() => setTaxRate(r)}
                        className={`flex-1 rounded-xl border px-3 py-2.5 text-[.83rem] font-bold transition ${
                          taxRate === r
                            ? "border-green bg-green text-white"
                            : blocked
                              ? "cursor-not-allowed border-gray-200 text-gray-300 dark:border-dark-border dark:text-gray-600"
                              : "border-gray-200 text-gray-600 hover:border-green/50 dark:border-dark-border dark:text-gray-300"
                        }`}
                      >
                        {r === 0 ? "Non assujetti" : `${r} %`}
                      </button>
                    );
                  })}
                </div>
                {!canChargeTax(status) && (
                  <p className="mt-1.5 text-[.72rem] text-gray-500 dark:text-gray-400">
                    Renseignez un NINEA dans « Votre situation » pour pouvoir facturer la TVA.
                  </p>
                )}
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
        </div>

        {/* Aperçu de l'en-tête — ce que le client verra en haut de la pièce. */}
        <div className={stickyAside}>
          <div className={`${card} overflow-hidden`}>
            <div className="border-b border-gray-100 px-4 py-2.5 text-[.66rem] font-bold uppercase tracking-[.08em] text-gray-400 dark:border-white/10">
              Aperçu de l&apos;en-tête
            </div>
            <div className="bg-white p-4" style={{ colorScheme: "light" }}>
              <div className="flex items-start gap-3">
                {assets.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assets.logo_url} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-gray-200 object-contain" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-[.9rem] font-extrabold text-gray-900">
                    {form.business_name || "Votre raison sociale"}
                  </div>
                  <div className="mt-0.5 space-y-0.5 text-[.68rem] leading-relaxed text-gray-500">
                    {form.address && <div className="truncate">{form.address}</div>}
                    {form.phone && <div>Tél. {form.phone}</div>}
                    {form.tax_id && <div>NINEA {form.tax_id}</div>}
                  </div>
                </div>
              </div>
              <div className="mt-3 h-[3px] rounded-full" style={{ background: activeAccent }} />
              <div className="mt-3 flex items-end justify-between gap-3">
                {assets.signature_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assets.signature_url} alt="" className="h-10 object-contain" />
                ) : (
                  <div className="text-[.66rem] italic text-gray-400">Signature non définie</div>
                )}
                {assets.stamp_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assets.stamp_url} alt="" className="h-12 w-12 object-contain opacity-90" />
                )}
              </div>
              {form.signature_label && (
                <div className="mt-1 text-[.66rem] font-semibold text-gray-700">{form.signature_label}</div>
              )}
            </div>
          </div>

          <button
            onClick={save}
            disabled={busy}
            className="btn btn-green w-full py-3 text-[.88rem] font-extrabold disabled:opacity-50"
          >
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== Import d'image simple ==================== */

function AssetField({
  value, busy, onPick, onClear, hint,
}: {
  value: string | null; busy: boolean;
  onPick: (f: File | null) => void; onClear: () => void; hint?: string;
}) {
  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-2.5 dark:border-dark-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain" />
          <button
            type="button"
            onClick={onClear}
            className="ml-auto shrink-0 rounded-lg px-3 py-1.5 text-[.76rem] font-bold text-brand-red transition hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            Retirer
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 px-3 py-4 text-[.8rem] font-bold text-gray-500 transition hover:border-green hover:text-green dark:border-dark-border">
          {busy ? "Envoi…" : "Choisir une image"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] || null)}
          />
        </label>
      )}
      {hint && <p className="mt-1 text-[.7rem] text-gray-400">{hint}</p>}
    </div>
  );
}

/* ==================== Signature dessinée ==================== */

/**
 * Zone de dessin au doigt ou à la souris.
 *
 * Le trait est capturé en coordonnées CSS puis mis à l'échelle du ratio de
 * l'écran : sans cela, la signature sort floue sur mobile, où un pixel CSS
 * vaut deux ou trois pixels réels. Le fond reste transparent pour se poser
 * sur le papier sans rectangle blanc.
 */
function SignaturePad({
  value, busy, onDrawn, onPick, onClear,
}: {
  value: string | null; busy: boolean;
  onDrawn: (b: Blob) => void; onPick: (f: File | null) => void; onClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    if (value) return; // pas de toile quand une signature est déjà posée
    const cv = canvasRef.current;
    if (!cv) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = cv.getBoundingClientRect();
    cv.width = Math.round(rect.width * ratio);
    cv.height = Math.round(rect.height * ratio);
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
  }, [value]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    dirty.current = true;
    if (!hasInk) setHasInk(true);
  }

  function up() { drawing.current = false; }

  function wipe() {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    dirty.current = false;
    setHasInk(false);
  }

  function validate() {
    const cv = canvasRef.current;
    if (!cv || !dirty.current) return;
    cv.toBlob((b) => { if (b) onDrawn(b); }, "image/png");
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-2.5 dark:border-dark-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className="h-12 shrink-0 bg-white object-contain" />
        <button
          type="button"
          onClick={onClear}
          className="ml-auto shrink-0 rounded-lg px-3 py-1.5 text-[.76rem] font-bold text-brand-red transition hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          Refaire
        </button>
      </div>
    );
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        // `touch-none` : sans lui, glisser le doigt fait défiler la page au
        // lieu de tracer.
        className="h-[110px] w-full touch-none rounded-xl border border-dashed border-gray-300 bg-white dark:border-dark-border"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={wipe}
          disabled={!hasInk}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-[.76rem] font-bold text-gray-500 transition hover:bg-gray-50 disabled:opacity-40 dark:border-dark-border"
        >
          Effacer
        </button>
        <button
          type="button"
          onClick={validate}
          disabled={!hasInk || busy}
          className="rounded-lg bg-green px-3 py-1.5 text-[.76rem] font-bold text-white transition disabled:opacity-40"
        >
          {busy ? "Envoi…" : "Valider le tracé"}
        </button>
        <label className="ml-auto cursor-pointer self-center text-[.74rem] font-bold text-gray-500 underline decoration-dotted transition hover:text-green">
          importer
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] || null)}
          />
        </label>
      </div>
    </div>
  );
}
