"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, COUNTRIES, BOOSTS, SENEGAL_REGIONS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { uploadImages } from "@/lib/storage";
import Link from "next/link";
import ImageCropperModal from "./ImageCropperModal";

const STEPS = ["Catégorie", "Photos", "Détails", "Publier"];

export default function PublishWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [step, setStep] = useState(1);
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [catSlug, setCatSlug] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [boost, setBoost] = useState(0);
  const [region, setRegion] = useState("Dakar");
  const [commune, setCommune] = useState("Plateau");
  const [customCommune, setCustomCommune] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [priceType, setPriceType] = useState("Prix Fixe");
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [aiLoading, setAiLoading] = useState("");

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || "");
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) setUserProfile(data);
          setLoadingProfile(false);
        });
      } else {
        setLoadingProfile(false);
      }
    });

    if (editId) {
      setEditModeId(editId);
      supabase.from('listings').select('*').eq('id', editId).single().then(({ data }) => {
        if (data) {
          setCatSlug(data.category_slug);
          setSubCategory(data.category);
          setTitle(data.title);
          setDesc(data.description);
          setPrice(data.price?.toString() || "");
          setPriceType(data.price_type || "Prix Fixe");
          setPhotos(data.photos || []);
          setRegion(data.region || "Dakar");
          setCommune(data.commune);
          setCustomCommune(data.custom_commune || "");
          setSpecs(data.specs || {});
        }
      });
    } else {
      const draft = localStorage.getItem("annonceid_draft");
      if (draft) {
        try {
          const d = JSON.parse(draft);
          if (d.catSlug) setCatSlug(d.catSlug);
          if (d.subCategory) setSubCategory(d.subCategory);
          if (d.title) setTitle(d.title);
          if (d.desc) setDesc(d.desc);
          if (d.price) setPrice(d.price);
          if (d.priceType) setPriceType(d.priceType);
          if (d.photos) setPhotos(d.photos);
          if (d.region) setRegion(d.region);
          if (d.commune) setCommune(d.commune);
          if (d.customCommune) setCustomCommune(d.customCommune);
          if (d.specs) setSpecs(d.specs);
        } catch { /* ignore */ }
      }
    }
  }, [editId, supabase]);

  useEffect(() => {
    if (!catSlug && !title && !desc && !price && photos.length === 0) return;
    const t = setTimeout(() => {
      localStorage.setItem("annonceid_draft", JSON.stringify({ catSlug, subCategory, title, desc, price, priceType, photos, region, commune, customCommune, specs }));
    }, 1000);
    return () => clearTimeout(t);
  }, [catSlug, subCategory, title, desc, price, priceType, photos, region, commune, customCommune, specs]);

  const cat = CATEGORIES.find((c) => c.slug === catSlug);
  const show = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  // Aide IA (gratuit via modèles intégrés, ou Claude si crédits dispo)
  async function aiHelp(kind: "listing_title" | "listing_description") {
    const topic = (title || subCategory || cat?.name || "mon article").trim();
    setAiLoading(kind);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, topic, city: region, tier: "user" }),
      });
      const data = await res.json();
      if (data.text) {
        if (kind === "listing_title") setTitle(data.text.replace(/^["']|["']$/g, "").slice(0, 80));
        else setDesc(data.text.slice(0, 2000));
        show(data.source === "ai" ? "✨ Généré par l'IA Claude" : "📝 Suggestion générée");
      } else show("⚠ " + (data.error || "Erreur IA"));
    } catch { show("⚠ Erreur IA"); }
    finally { setAiLoading(""); }
  }

  const isKonnecta = userEmail.toLowerCase().includes('multiservicesyamane');
  const freeAdsRemaining = isKonnecta ? 999 : (userProfile?.free_ads_remaining ?? 3);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const urls = files.map(f => URL.createObjectURL(f));
      setCropQueue(prev => [...prev, ...urls]);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!catSlug) return show("⚠ Choisissez une catégorie.");
      if (cat?.subs && cat.subs.length > 0 && (!subCategory || subCategory === "Choisir…")) return show("⚠ Choisissez une sous-catégorie.");
      if (commune === "Autre" && !customCommune.trim()) return show("⚠ Précisez votre lieu.");
    }
    if (step === 2) {
      if (photos.length === 0) return show("⚠ Ajoutez au moins une photo.");
    }
    if (step === 3) {
      if (!title || title.trim().length < 10) return show("⚠ Titre: min 10 caractères.");
      if (priceType !== "Sur devis" && !price) return show("⚠ Indiquez un prix.");
      if (!desc || desc.trim().length < 30) return show("⚠ Description: min 30 caractères.");
      if (cat?.fields) {
        for (const field of cat.fields) {
          if (field.label.includes("*")) {
            if (!specs[field.label] || specs[field.label] === "Choisir...") {
              return show(`⚠ "${field.label}" est obligatoire.`);
            }
          }
        }
      }
    }
    setStep(s => s + 1);
  };

  async function handlePublish() {
    if (loadingProfile) return show("⏳ Chargement...");
    // Comptes "VIP gratuit" : annonces Premium offertes, sans limite ni paiement
    const isVipFree = !!userProfile?.free_premium;
    if (!isVipFree && boost === 0 && freeAdsRemaining <= 0) return show("⚠ Plus d'annonces gratuites.");
    setIsPublishing(true);
    show("Création en cours...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { show("⚠ Connectez-vous !"); setIsPublishing(false); return; }

    show("📤 Envoi des photos...");
    const uploadedPhotos = await uploadImages(photos, "listings");

    const payload: Record<string, any> = {
      user_id: user.id,
      title: title || "Annonce sans titre",
      slug: (title || "annonce").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(),
      description: desc || "Pas de description",
      price: price || "0",
      price_type: priceType,
      category: subCategory || cat?.name || "Autre",
      category_slug: catSlug || "autre",
      location: commune === "Autre" ? (customCommune ? `${region} - ${customCommune}` : region) : `${region} - ${commune}`,
      region, commune, custom_commune: customCommune,
      image: uploadedPhotos.length > 0 ? uploadedPhotos[0] : "https://placehold.co/600x400?text=Sans+Image",
      photos: uploadedPhotos, specs,
      // VIP gratuit → annonce Premium + active immédiatement, sans paiement
      premium: isVipFree || undefined,
      status: (boost === 0 || isVipFree) ? "active" : "pending"
    };

    async function saveAdaptive(isUpdate: boolean) {
      const p: Record<string, any> = { ...payload };
      for (let i = 0; i < 10; i++) {
        const res = isUpdate
          ? await supabase.from('listings').update(p).eq('id', editModeId!).select().single()
          : await supabase.from('listings').insert(p).select().single();
        if (!res.error) return res;
        const m = res.error.message || "";
        const match = m.match(/Could not find the '([^']+)' column/) || m.match(/column "?([a-z_]+)"? of relation/i);
        if (match && match[1] in p) { delete p[match[1]]; continue; }
        return res;
      }
      return { data: null as any, error: { message: "Schéma incompatible" } as any };
    }

    let data, error;
    if (editModeId) { const r = await saveAdaptive(true); data = r.data; error = r.error; }
    else { const r = await saveAdaptive(false); data = r.data; error = r.error; }

    if (error) { console.error("Supabase Error:", error); show(`⚠ ${error.message}`); setIsPublishing(false); return; }

    if (!editModeId && (boost === 0 || isKonnecta)) {
      if (!isKonnecta) await supabase.from('profiles').update({ free_ads_remaining: freeAdsRemaining - 1 }).eq('id', user.id);
      if (isKonnecta && boost > 0) {
        const boostKey = BOOSTS[boost].key;
        await supabase.from('listings').update({ status: 'active', premium: boostKey === 'premium' || boostKey === 'vip' }).eq('id', data.id);
      }
    }

    localStorage.removeItem("annonceid_draft");
    if (editModeId) { show("✅ Annonce mise à jour !"); setTimeout(() => router.push("/dashboard"), 1500); }
    else if (boost === 0 || isKonnecta) { show("✅ Annonce publiée !"); setTimeout(() => router.push("/dashboard"), 1500); }
    else { router.push(`/paiement?annonce_id=${data.id}`); }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Title - compact on mobile */}
      <div className="mb-3 mt-2 md:mt-6 md:mb-6">
        <h1 className="font-display text-[1.15rem] md:text-[1.6rem] font-extrabold text-gray-900 dark:text-white">{editModeId ? "Modifier l'annonce" : "Créer une annonce"}</h1>
      </div>

      {/* STEPS - Compact progress */}
      <div className="relative mb-5 md:mb-8">
        <div className="absolute top-4 left-0 w-full h-[2px] bg-gray-200 dark:bg-white/10 z-0"></div>
        <div className="absolute top-4 left-0 h-[2px] bg-gradient-to-r from-green-500 to-neon-gold z-0 transition-all duration-500"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}></div>
        <div className="relative z-10 flex items-start justify-between">
          {STEPS.map((s, i) => {
            const num = i + 1;
            const done = step > num;
            const active = step === num;
            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[.8rem] font-bold transition-all ${active ? "bg-gradient-to-br from-green-400 to-neon-gold text-dark-900 shadow-md scale-110" : done ? "bg-neon-gold text-dark-900" : "bg-white dark:bg-dark-900 border-2 border-gray-200 dark:border-white/20 text-gray-400"}`}>
                  {done ? "✓" : num}
                </div>
                <span className={`text-[.6rem] md:text-[.75rem] font-bold ${active ? "text-green dark:text-neon-gold" : done ? "text-gray-700 dark:text-gray-300" : "text-gray-400"}`}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* WIZARD CARD */}
      <div className="bg-white dark:bg-[#111722]/80 dark:backdrop-blur-xl rounded-[16px] md:rounded-[24px] p-4 md:p-6 shadow-md border border-gray-100 dark:border-white/10">

        {/* STEP 1: Catégorie */}
        {step === 1 && (
          <div className="animate-fadeUp space-y-3 md:space-y-5">
            <h2 className="font-display text-[1rem] md:text-[1.15rem] font-bold text-gray-900 dark:text-white">Catégorie & Localisation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
              <div>
                <label className="label">Catégorie <span className="text-brand-red">*</span></label>
                <select className="input" value={catSlug || ""} onChange={(e) => setCatSlug(e.target.value)}>
                  <option value="" disabled>Choisir...</option>
                  {CATEGORIES.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
                </select>
              </div>
              {cat && (
                <div className="animate-fadeUp">
                  <label className="label">Sous-catégorie <span className="text-brand-red">*</span></label>
                  <select className="input" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                    <option disabled value="">Choisir…</option>
                    {cat.subs.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Région <span className="text-brand-red">*</span></label>
                <select className="input" value={region} onChange={(e) => {
                  const r = e.target.value; setRegion(r);
                  const g = SENEGAL_REGIONS.find(g => g.name === r);
                  if (g && g.communes.length > 0) setCommune(g.communes[0]);
                }}>
                  {SENEGAL_REGIONS.map((g, i) => (<option key={i} value={g.name}>{g.name}</option>))}
                </select>
              </div>
              <div>
                <label className="label">Commune <span className="text-brand-red">*</span></label>
                <select className="input" value={commune} onChange={(e) => setCommune(e.target.value)}>
                  {SENEGAL_REGIONS.find(g => g.name === region)?.communes.map((c, i) => (<option key={i} value={c}>{c}</option>))}
                </select>
              </div>
              {commune === "Autre" && (
                <div className="col-span-full animate-fadeUp">
                  <label className="label">Lieu exact <span className="text-brand-red">*</span></label>
                  <input className="input" placeholder="Ex: Village de Ndiaganiao..." value={customCommune} onChange={(e) => setCustomCommune(e.target.value)} maxLength={50} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Photos */}
        {step === 2 && (
          <div className="animate-fadeUp space-y-2">
            <h2 className="font-display text-[0.95rem] md:text-[1.15rem] font-bold text-gray-900 dark:text-white">Photos</h2>
            <label className="block w-full cursor-pointer rounded-[14px] border-[2px] border-dashed border-neon-gold/40 bg-gold/5 dark:bg-black/40 hover:bg-gold/10 transition-all px-3 py-3 md:py-6 text-center group relative overflow-hidden">
              <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <div className="w-8 h-8 mx-auto bg-gradient-to-br from-neon-gold to-[#D4891A] rounded-lg flex items-center justify-center mb-1.5 shadow-md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-dark-900"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </div>
              <div className="font-bold text-gray-900 dark:text-white text-[.85rem]">Ajoutez vos photos</div>
              <div className="text-[.7rem] text-gray-500 mt-0.5">JPG, PNG · Max 10 photos</div>
            </label>

            {photos.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {photos.map((src, i) => (
                  <div key={i} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${i === 0 ? "border-gold" : "border-gray-200 dark:border-dark-border"}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <div className="absolute bottom-0 inset-x-0 bg-gold text-dark-900 text-center text-[.5rem] font-bold py-0.5">PRINCIPALE</div>}
                    <button onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 hover:bg-brand-red text-white rounded-full flex items-center justify-center text-[.6rem]">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Détails */}
        {step === 3 && (
          <div className="animate-fadeUp space-y-3">
            <h2 className="font-display text-[1rem] md:text-[1.15rem] font-bold text-gray-900 dark:text-white">Informations</h2>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Titre <span className="text-brand-red">*</span></label>
                <button type="button" onClick={() => aiHelp("listing_title")} disabled={!!aiLoading} className="mb-1 rounded-full bg-green/10 px-2.5 py-1 text-[.7rem] font-bold text-green hover:bg-green/20 transition disabled:opacity-50">
                  {aiLoading === "listing_title" ? "⏳…" : "✨ Aide IA"}
                </button>
              </div>
              <input className="input font-medium" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: iPhone 14 Pro 256Go Noir" />
              <div className="text-right text-[.65rem] text-gray-400 mt-0.5">{title.length}/80</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prix (FCFA) {priceType !== "Sur devis" && <span className="text-brand-red">*</span>}</label>
                <input className="input font-bold text-green" inputMode="numeric" value={price} onChange={(e) => setPrice(formatNumber(e.target.value.replace(/\D/g, "")))} placeholder="450 000" />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
                  <option value="Prix Fixe">Prix Fixe</option>
                  <option value="Négociable">Négociable</option>
                  <option value="Sur devis">Sur devis</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Description <span className="text-brand-red">*</span></label>
                <button type="button" onClick={() => aiHelp("listing_description")} disabled={!!aiLoading} className="mb-1 rounded-full bg-green/10 px-2.5 py-1 text-[.7rem] font-bold text-green hover:bg-green/20 transition disabled:opacity-50">
                  {aiLoading === "listing_description" ? "⏳…" : "✨ Aide IA"}
                </button>
              </div>
              <textarea className="input resize-none min-h-[80px] md:min-h-[100px]" maxLength={2000} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Décrivez votre article..." />
              <div className="text-right text-[.65rem] text-gray-400 mt-0.5">{desc.length}/2000</div>
            </div>
            {cat?.fields && (
              <div className="pt-3 border-t border-gray-100 dark:border-dark-border">
                <h3 className="font-bold text-[.8rem] mb-2 text-gold-dark dark:text-gold uppercase tracking-wider">{cat.name}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {cat.fields.map(f => (
                    <div key={f.label}>
                      <label className="label">{f.label}</label>
                      {f.type === 'select' ? (
                        <select className="input" value={specs[f.label] || ""} onChange={(e) => setSpecs({...specs, [f.label]: e.target.value})}>
                          <option value="">Choisir...</option>
                          {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={f.type} className="input" placeholder={f.placeholder} value={specs[f.label] || ""} onChange={(e) => setSpecs({...specs, [f.label]: e.target.value})} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Boost & Publication */}
        {step === 4 && (
          <div className="animate-fadeUp space-y-3">
            <h2 className="font-display text-[1rem] md:text-[1.15rem] font-bold text-gray-900 dark:text-white">Visibilité</h2>
            <div className="space-y-2">
              {BOOSTS.map((b, i) => (
                <label key={i} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${boost === i ? "border-gold bg-gold/5" : "border-gray-100 dark:border-dark-border hover:border-gold/30"}`}>
                  {b.popular && <div className="absolute -right-8 top-2 bg-gold text-dark-900 text-[.5rem] font-bold py-0.5 px-8 rotate-45">TOP</div>}
                  <input type="radio" name="boost" checked={boost === i} onChange={() => setBoost(i)} className="mt-0.5 w-4 h-4 accent-gold shrink-0" />
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-[.9rem] dark:text-white leading-tight">{b.name}</span>
                      <span className={`font-bold text-[.85rem] shrink-0 ${i === 0 ? "text-gray-500" : "text-green"}`}>{i === 0 ? "Gratuit" : `${b.price} F`}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {b.features.map(f => (
                        <span key={f} className="bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-border rounded px-1.5 py-0.5 text-[.65rem] text-gray-600 dark:text-gray-300">✓ {f}</span>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
              {boost === 0 && (
                <div className="bg-gray-50 dark:bg-dark-900 rounded-lg p-2.5 text-[.8rem] text-gray-600 dark:text-gray-400 flex items-center justify-between">
                  <span>Annonces gratuites :</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{freeAdsRemaining}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS - always visible */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 rounded-xl text-[.8rem]">
              ← Retour
            </button>
          ) : <div></div>}

          {step < 4 ? (
            <button onClick={handleNext} className="btn bg-gradient-to-r from-green-500 to-neon-gold text-white font-bold px-6 rounded-xl shadow-md hover:scale-105 transition-transform text-[.85rem]">
              Suivant →
            </button>
          ) : (
            <button onClick={handlePublish} disabled={isPublishing}
              className={`btn px-6 shadow-lg text-[.85rem] ${boost > 0 ? "btn-gold" : "btn-green"} ${isPublishing ? "opacity-50 cursor-not-allowed" : ""}`}>
              {isPublishing ? "En cours..." : (boost > 0 ? `Payer & Publier` : "Publier")}
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-dark-900 text-white px-5 py-2.5 rounded-full shadow-2xl font-bold text-[.82rem] animate-fadeUp border border-gray-800 max-w-[90vw] text-center">
          {toast}
        </div>
      )}

      {cropQueue.length > 0 && (
        <ImageCropperModal
          imageSrc={cropQueue[0]}
          aspectRatio={1}
          onCancel={() => setCropQueue(prev => prev.slice(1))}
          onCropDone={(base64) => {
            setPhotos(prev => [...prev, base64].slice(0, 10));
            setCropQueue(prev => prev.slice(1));
          }}
        />
      )}
    </div>
  );
}
