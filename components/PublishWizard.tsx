"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, COUNTRIES, BOOSTS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

const STEPS = ["Catégorie", "Détails", "Photos", "Contact", "Boost"];
const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300&h=300&fit=crop",
];

export default function PublishWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [catSlug, setCatSlug] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [boost, setBoost] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const cat = CATEGORIES.find((c) => c.slug === catSlug);
  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  function next() {
    if (step === 1 && !catSlug) return show("⚠ Choisissez une catégorie");
    if (step < 5) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (boost === 0) {
        show("🎉 Annonce publiée gratuitement !");
        setTimeout(() => router.push("/dashboard"), 1200);
      } else {
        show("Redirection paiement…");
        setTimeout(() => router.push(`/paiement?boost=${BOOSTS[boost].key}`), 900);
      }
    }
  }
  function prev() {
    if (step > 1) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border-[1.5px] border-gray-100 bg-white shadow-xs">
      {/* Steps header */}
      <div className="flex border-b border-gray-100 bg-gray-50 p-5">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n === step ? "active" : n < step ? "done" : "todo";
          return (
            <div key={label} className="relative flex flex-1 flex-col items-center">
              {i < STEPS.length - 1 && (
                <span className="absolute left-1/2 top-[13px] -z-0 h-0.5 w-full bg-gray-100" />
              )}
              <span
                className={`relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 text-[.72rem] font-bold transition ${
                  state === "active"
                    ? "scale-110 border-green bg-green text-white"
                    : state === "done"
                      ? "border-gold bg-gold text-dark-900"
                      : "border-gray-300 bg-white text-gray-500"
                }`}
              >
                {n}
              </span>
              <span className={`mt-1 text-center text-[.64rem] font-semibold ${state === "active" ? "text-green" : "text-gray-500"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="p-6">
        {/* STEP 1 — Catégorie & localisation */}
        {step === 1 && (
          <div className="animate-fadeUp">
            <h2 className="font-display text-[1.1rem] font-bold">Que souhaitez-vous publier ?</h2>
            <p className="mb-5 text-[.83rem] text-gray-500">Choisissez la catégorie</p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCatSlug(c.slug)}
                  className={`rounded-[10px] border-2 px-2 py-4 text-center transition ${
                    catSlug === c.slug ? "border-green bg-green/[.06]" : "border-gray-100 bg-gray-50 hover:border-gold hover:bg-gold-pale"
                  }`}
                >
                  <span className="mb-1 block text-[1.6rem]">{c.icon}</span>
                  <span className="text-[.76rem] font-semibold text-gray-700">{c.name}</span>
                </button>
              ))}
            </div>
            {cat && (
              <div className="mt-5">
                <label className="label">Sous-catégorie <span className="text-brand-red">*</span></label>
                <select className="input">
                  <option>Choisir…</option>
                  {cat.subs.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Pays <span className="text-brand-red">*</span></label>
                <select className="input">
                  {COUNTRIES.map((c) => (
                    <option key={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Ville <span className="text-brand-red">*</span></label>
                <select className="input">
                  <option>Dakar</option>
                  <option>Thiès</option>
                  <option>Saint-Louis</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="label">Adresse / Zone précise <span className="text-brand-red">*</span></label>
              <input className="input" placeholder="Ex : Almadies, près de la mosquée" />
            </div>
          </div>
        )}

        {/* STEP 2 — Détails + champs dynamiques */}
        {step === 2 && (
          <div className="animate-fadeUp">
            <h2 className="font-display text-[1.1rem] font-bold">
              Décrivez votre {cat ? cat.name.toLowerCase() : "article"}
            </h2>
            <p className="mb-5 text-[.83rem] text-gray-500">Plus c&apos;est détaillé, plus vous vendez vite</p>

            <div className="mb-4">
              <label className="label">Titre <span className="text-brand-red">*</span></label>
              <input
                className="input"
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : iPhone 14 Pro 256Go noir, parfait état"
              />
              <div className="mt-1 text-right text-[.72rem] text-gray-300">{title.length}/80</div>
            </div>

            <div className="mb-4">
              <label className="label">Description <span className="text-brand-red">*</span></label>
              <textarea
                className="input resize-y"
                rows={4}
                maxLength={2000}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="État, caractéristiques, raison de la vente…"
              />
              <div className="mt-1 text-right text-[.72rem] text-gray-300">{desc.length}/2000</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Prix (FCFA) <span className="text-brand-red">*</span></label>
                <input
                  className="input"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(formatNumber(e.target.value.replace(/\D/g, "")))}
                  placeholder="Ex : 150 000"
                />
              </div>
              <div>
                <label className="label">Type de prix</label>
                <select className="input">
                  <option>Prix fixe</option>
                  <option>Négociable</option>
                  <option>Gratuit</option>
                  <option>Échange</option>
                </select>
              </div>
            </div>

            {cat && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="mb-3 text-[.76rem] font-bold uppercase tracking-wide text-gold-dark">
                  {cat.icon} Détails spécifiques — {cat.name}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {cat.fields.map((f) => (
                    <div key={f.label}>
                      <label className="label">{f.label}</label>
                      {f.type === "select" ? (
                        <select className="input">
                          <option>Choisir…</option>
                          {f.options?.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input className="input" type={f.type} placeholder={f.placeholder} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Photos */}
        {step === 3 && (
          <div className="animate-fadeUp">
            <h2 className="font-display text-[1.1rem] font-bold">Ajoutez vos photos</h2>
            <p className="mb-5 text-[.83rem] text-gray-500">1 à 10 photos · Format carré recommandé</p>
            <label className="block w-full cursor-pointer rounded-[10px] border-2 border-dashed border-gold bg-gold-pale px-4 py-8 text-center transition hover:bg-[#fef0c7]">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files).map(f => URL.createObjectURL(f));
                    setPhotos(prev => [...prev, ...newFiles].slice(0, 10));
                  }
                }}
              />
              <div className="mb-1 text-[2rem]">📸</div>
              <p className="text-[.88rem] font-semibold text-gray-700">Cliquez pour ajouter des photos</p>
              <span className="text-[.75rem] text-gray-500">JPG, PNG · Max 5 Mo · Recadrage carré auto</span>
            </label>
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2.5">
                {photos.map((src, i) => (
                  <div
                    key={i}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 ${i === 0 ? "border-gold" : "border-gray-100"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    {i === 0 && (
                      <div className="absolute inset-x-0 bottom-0 bg-gold py-0.5 text-center text-[.6rem] font-bold text-dark-900">
                        COUVERTURE
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[.7rem] text-white hover:bg-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-lg border-l-[3px] border-gold bg-gold-pale p-3 text-[.78rem] text-gray-700">
              💡 <b>Conseils :</b> Plein jour · Fond neutre · Tous les angles · 1ère photo = couverture
            </div>
          </div>
        )}

        {/* STEP 4 — Contact */}
        {step === 4 && (
          <div className="animate-fadeUp">
            <h2 className="font-display text-[1.1rem] font-bold">Vos coordonnées</h2>
            <p className="mb-5 text-[.83rem] text-gray-500">Comment les acheteurs vous contacteront</p>
            <div className="mb-4">
              <label className="label">Téléphone / WhatsApp <span className="text-brand-red">*</span></label>
              <div className="flex">
                <select className="input max-w-[130px] rounded-r-none border-r-0">
                  {COUNTRIES.slice(0, 8).map((c) => (
                    <option key={c.code}>{c.flag} {c.dial}</option>
                  ))}
                </select>
                <input className="input rounded-l-none" type="tel" placeholder="77 000 00 00" />
              </div>
            </div>
            <div className="mb-4">
              <label className="label">Mode de contact préféré</label>
              <div className="flex flex-col gap-2">
                {["💬 WhatsApp (recommandé)", "📞 Appel", "✉ Message interne"].map((m) => (
                  <label key={m} className="flex cursor-pointer items-center gap-2 rounded-lg border-[1.5px] border-gray-100 p-2.5 text-[.85rem]">
                    <input type="checkbox" defaultChecked className="accent-green" /> {m}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Affichage du numéro</label>
              <select className="input">
                <option>En clair</option>
                <option>Masqué (messages)</option>
                <option>WhatsApp uniquement</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 5 — Boost */}
        {step === 5 && (
          <div className="animate-fadeUp">
            <h2 className="font-display text-[1.1rem] font-bold">Boostez votre visibilité</h2>
            <p className="mb-5 text-[.83rem] text-gray-500">Plus de visibilité = plus de contacts</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {BOOSTS.map((b, i) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setBoost(i)}
                  className={`relative rounded-[10px] border-2 p-4 text-left transition ${
                    boost === i ? "border-green bg-green/[.04]" : b.popular ? "border-gold bg-gold-pale" : "border-gray-100 hover:border-gold"
                  }`}
                >
                  {b.popular && (
                    <span className="absolute -top-2.5 right-4 rounded-md bg-grad-gold px-2 py-0.5 text-[.6rem] font-bold text-dark-900">
                      POPULAIRE
                    </span>
                  )}
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[.9rem] font-bold">{b.name}</span>
                    <span className="font-display text-[1.1rem] font-extrabold text-green">{b.price === 0 ? "0" : formatNumber(b.price)}</span>
                  </div>
                  <div className="text-[.75rem] leading-relaxed text-gray-500">
                    {b.features.map((f) => (
                      <div key={f}>✓ {f}</div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="mb-3 font-display text-[.95rem] font-bold">Récapitulatif</h3>
              <div className="mb-3 flex items-center gap-3 rounded-[10px] bg-gray-50 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos.length > 0 ? photos[0] : "https://placehold.co/64/E8E8E4/BEBEBB?text=📷"} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-[.88rem] font-semibold">{title || "Votre titre"}</div>
                  <div className="mt-0.5 text-[.75rem] text-gray-500">{cat?.name ?? "Catégorie"} · Dakar</div>
                  <div className="mt-0.5 font-display font-bold text-green">{price || "—"} FCFA</div>
                </div>
              </div>
              <div className="rounded-lg border-l-[3px] border-green bg-green/[.05] p-3 text-[.8rem] text-gray-700">
                ✓ Publication <b>immédiate</b> après validation. Confirmation par SMS/WhatsApp.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-5">
        <button type="button" onClick={prev} className={`btn btn-outline ${step === 1 ? "invisible" : ""}`}>
          ← Retour
        </button>
        <div className="text-[.78rem] text-gray-500">Étape {step} / 5</div>
        <button type="button" onClick={next} className={step === 5 ? "btn btn-gold" : "btn btn-green"}>
          {step === 5 ? "🚀 Publier" : "Continuer →"}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-neon-gold bg-dark-900 px-5 py-2.5 text-[.88rem] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
