"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, COUNTRIES, BOOSTS, SENEGAL_REGIONS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { uploadImages } from "@/lib/storage";
import Link from "next/link";
import ImageCropperModal from "./ImageCropperModal";

const STEPS = ["Catégorie", "Photos", "Détails", "Publication"];

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
  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

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
      if (!catSlug) return show("⚠ Veuillez choisir une catégorie principale.");
      if (cat?.subs && cat.subs.length > 0 && (!subCategory || subCategory === "Choisir…")) return show("⚠ Veuillez choisir une sous-catégorie.");
      if (commune === "Autre" && !customCommune.trim()) return show("⚠ Veuillez préciser votre lieu exact (champ obligatoire).");
    }
    if (step === 2) {
      if (photos.length === 0) return show("⚠ Vous devez ajouter au moins une photo pour continuer.");
    }
    if (step === 3) {
      if (!title || title.trim().length < 10) return show("⚠ Le titre doit faire au moins 10 caractères.");
      if (!price) return show("⚠ Veuillez indiquer un prix.");
      if (!desc || desc.trim().length < 30) return show("⚠ La description doit faire au moins 30 caractères.");
      
      // Vérifier les champs de spécifications obligatoires
      if (cat?.fields) {
        for (const field of cat.fields) {
          if (!specs[field.label] || specs[field.label] === "Choisir...") {
            return show(`⚠ Le champ "${field.label}" est obligatoire pour cette catégorie.`);
          }
        }
      }
    }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function handlePublish() {
    if (loadingProfile) return show("⏳ Chargement de votre profil...");
    if (boost === 0 && freeAdsRemaining <= 0) {
      return show("⚠ Vous n'avez plus d'annonces gratuites. Veuillez booster l'annonce.");
    }

    setIsPublishing(true);
    show("Création de l'annonce en cours...");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      show("⚠ Vous devez être connecté !");
      setIsPublishing(false);
      return;
    }

    // Envoi des photos vers Supabase Storage (les base64 deviennent des URLs ;
    // les photos déjà sous forme d'URL en mode édition sont conservées telles quelles)
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
      region: region,
      commune: commune,
      custom_commune: customCommune,
      image: uploadedPhotos.length > 0 ? uploadedPhotos[0] : "https://placehold.co/600x400?text=Sans+Image",
      photos: uploadedPhotos,
      specs: specs,
      status: boost === 0 ? "active" : "pending"
    };

    // Sauvegarde auto-adaptative : retire automatiquement toute colonne absente du
    // schéma puis réessaie (fonctionne quel que soit l'état de la table listings).
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
    if (editModeId) {
      const result = await saveAdaptive(true);
      data = result.data;
      error = result.error;
    } else {
      const result = await saveAdaptive(false);
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Supabase Error:", error);
      show(`⚠ Erreur: ${error.message}`);
      setIsPublishing(false);
      return;
    }

    if (!editModeId && (boost === 0 || isKonnecta)) {
      if (!isKonnecta) {
        await supabase.from('profiles').update({ free_ads_remaining: freeAdsRemaining - 1 }).eq('id', user.id);
      }
      
      // Si Konnecta a choisi un boost, on l'active directement
      if (isKonnecta && boost > 0) {
        const boostKey = BOOSTS[boost].key;
        await supabase.from('listings').update({ 
          status: 'active', 
          premium: boostKey === 'premium' || boostKey === 'vip' 
        }).eq('id', data.id);
      }
    }

    localStorage.removeItem("annonceid_draft");
    if (editModeId) {
      show("✅ Annonce mise à jour avec succès !");
      setTimeout(() => router.push("/dashboard"), 1500);
    } else if (boost === 0 || isKonnecta) {
      show("✅ Annonce publiée avec succès !");
      setTimeout(() => router.push("/dashboard"), 1500);
    } else {
      router.push(`/paiement?annonce_id=${data.id}`);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      <div className="mb-6 mt-4 lg:mt-8">
        <h1 className="font-display text-[1.4rem] sm:text-[1.8rem] font-extrabold dark:text-white">{editModeId ? "Modifier l'annonce" : "Créer une annonce"}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-[.95rem]">Suivez les étapes. Le rendu s'affiche en temps réel sur la droite.</p>
      </div>

      {/* STEPS HEADER - Premium Progress Bar */}
      <div className="relative mb-10 w-full">
        {/* Ligne de fond */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 dark:bg-white/10 -translate-y-1/2 rounded-full z-0"></div>
        {/* Ligne de progression */}
        <div 
          className="absolute top-1/2 left-0 h-[3px] bg-gradient-to-r from-green-500 to-neon-gold -translate-y-1/2 rounded-full z-0 transition-all duration-500 shadow-[0_0_10px_rgba(245,166,35,0.5)]"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        ></div>
        
        <div className="relative z-10 flex items-center justify-between">
          {STEPS.map((s, i) => {
            const num = i + 1;
            const isCompleted = step > num;
            const isActive = step === num;
            
            return (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[.85rem] font-bold transition-all duration-500 ${isActive ? "bg-gradient-to-br from-green-400 to-neon-gold text-dark-900 shadow-[0_0_15px_rgba(245,166,35,0.6)] scale-110" : isCompleted ? "bg-neon-gold text-dark-900" : "bg-white dark:bg-dark-900 border-2 border-gray-200 dark:border-white/20 text-gray-400"}`}>
                  {isCompleted ? "✓" : num}
                </div>
                <span className={`text-[.7rem] md:text-[.85rem] font-bold absolute -bottom-6 whitespace-nowrap transition-colors ${isActive ? "text-neon-gold" : isCompleted ? "text-gray-800 dark:text-gray-200" : "text-gray-400"}`}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative mt-8">
        
        {/* GAUCHE : ÉDITEUR WIZARD */}
        <div className="flex-1 w-full pb-24">

        <div className="bg-white dark:bg-[#111722]/80 dark:backdrop-blur-xl rounded-[24px] p-6 md:p-8 shadow-lg border border-gray-100 dark:border-white/10">
          
          {/* SECTION 1 : Catégorie */}
          {step === 1 && (
            <div className="animate-fadeUp">
              <h2 className="font-display text-[1.2rem] font-bold mb-6 dark:text-white">Catégorie & Localisation</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Catégorie principale <span className="text-brand-red">*</span></label>
                  <select 
                    className="input cursor-pointer"
                    value={catSlug || ""}
                    onChange={(e) => setCatSlug(e.target.value)}
                  >
                    <option value="" disabled>Choisir une catégorie...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {cat && (
                  <div className="animate-fadeUp">
                    <label className="label">Sous-catégorie <span className="text-brand-red">*</span></label>
                    <select className="input cursor-pointer" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                      <option disabled value="">Choisir…</option>
                      {cat.subs.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="md:col-span-2 grid md:grid-cols-2 gap-6 mt-2">
                  <div>
                    <label className="label">Région <span className="text-brand-red">*</span></label>
                    <select className="input" value={region} onChange={(e) => {
                      const r = e.target.value;
                      setRegion(r);
                      const group = SENEGAL_REGIONS.find(g => g.name === r);
                      if (group && group.communes.length > 0) setCommune(group.communes[0]);
                    }}>
                      {SENEGAL_REGIONS.map((g, i) => (
                        <option key={i} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Commune / Département <span className="text-brand-red">*</span></label>
                    <select className="input" value={commune} onChange={(e) => setCommune(e.target.value)}>
                      {SENEGAL_REGIONS.find(g => g.name === region)?.communes.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {commune === "Autre" && (
                    <div className="md:col-span-2 animate-fadeUp">
                      <label className="label">Lieu exact (Précisez) <span className="text-brand-red">*</span></label>
                      <input 
                        className="input" 
                        placeholder="Ex: Village de Ndiaganiao..." 
                        value={customCommune} 
                        onChange={(e) => setCustomCommune(e.target.value)} 
                        maxLength={50}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2 : Photos */}
          {step === 2 && (
            <div className="animate-fadeUp">
              <h2 className="font-display text-[1.2rem] font-bold mb-2 dark:text-white">Photos de l'article</h2>
              <p className="text-[.85rem] text-gray-500 mb-6">Les annonces avec photos attirent 5x plus d'acheteurs. (Max 10 photos)</p>

              <label className="block w-full cursor-pointer rounded-[20px] border-[2px] border-dashed border-neon-gold/40 dark:border-neon-gold/30 bg-gold/5 dark:bg-black/40 hover:bg-gold/10 hover:border-neon-gold/60 transition-all duration-300 px-4 py-12 text-center shadow-[inset_0_0_20px_rgba(245,166,35,0.05)] group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neon-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-neon-gold to-[#D4891A] rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-[0_5px_15px_rgba(245,166,35,0.4)] transform group-hover:-translate-y-1 transition-transform">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-dark-900"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
                <div className="font-display font-bold text-gray-900 dark:text-white text-[1.2rem]">Glissez-déposez vos photos ici</div>
                <div className="text-[.85rem] text-gray-500 mt-2">ou cliquez pour parcourir (JPG, PNG · Jusqu'à 10 Mo)</div>
              </label>

              <div className="mt-4 flex items-center gap-2 bg-neon-gold/10 border border-neon-gold/20 rounded-lg p-3 text-[.8rem] text-gray-700 dark:text-white/80">
                <span className="text-neon-gold">✨</span> Astuce : Utilisez la lumière naturelle pour obtenir les meilleurs résultats et vendre plus vite.
              </div>

              {photos.length > 0 && (
                <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {photos.map((src, i) => (
                    <div key={i} className={`relative aspect-square rounded-xl overflow-hidden shadow-sm border-2 ${i === 0 ? "border-gold" : "border-gray-200 dark:border-dark-border"}`}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-gold text-dark-900 text-center text-[.6rem] font-bold py-0.5">PRINCIPALE</div>
                      )}
                      <button onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-brand-red text-white rounded-full flex items-center justify-center text-xs backdrop-blur-sm transition">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3 : Détails */}
          {step === 3 && (
            <div className="animate-fadeUp space-y-5">
              <h2 className="font-display text-[1.2rem] font-bold mb-6 dark:text-white">Informations de l'annonce</h2>

              <div>
                <label className="label">Titre de l'annonce <span className="text-brand-red">*</span></label>
                <input
                  className="input text-lg font-medium"
                  maxLength={80}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: iPhone 14 Pro 256Go Noir - Très bon état"
                />
                <div className="text-right text-[.7rem] text-gray-400 mt-1">{title.length}/80 caractères</div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Prix (FCFA) <span className="text-brand-red">*</span></label>
                  <input
                    className="input text-lg font-bold text-green"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(formatNumber(e.target.value.replace(/\D/g, "")))}
                    placeholder="Ex: 450 000"
                  />
                </div>
                <div>
                  <label className="label">Type de prix</label>
                  <select className="input" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
                    <option value="Prix Fixe">Prix Fixe</option>
                    <option value="Négociable">Négociable</option>
                    <option value="Sur devis">Sur devis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Description détaillée <span className="text-brand-red">*</span></label>
                <textarea
                  className="input resize-y min-h-[120px]"
                  maxLength={2000}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Décrivez votre article (état, marque, défauts éventuels, raison de la vente...)"
                />
                <div className="text-right text-[.7rem] text-gray-400 mt-1">{desc.length}/2000 caractères</div>
              </div>
              
              {cat?.fields && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-dark-border">
                  <h3 className="font-bold text-[.9rem] mb-4 text-gold-dark dark:text-gold uppercase tracking-wider">Caractéristiques {cat.name}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
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

          {/* SECTION 4 : Boost & Publication */}
          {step === 4 && (
            <div className="animate-fadeUp">
              <h2 className="font-display text-[1.2rem] font-bold mb-2 dark:text-white">Visibilité & Publication</h2>
              <p className="text-[.85rem] text-gray-500 mb-6">Vendez jusqu'à 10x plus vite en mettant votre annonce en avant.</p>

              <div className="space-y-4 mb-8">
                {BOOSTS.map((b, i) => (
                  <label key={i} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${boost === i ? "border-gold bg-gold/5" : "border-gray-100 dark:border-dark-border hover:border-gold/30"}`}>
                    {b.popular && (
                      <div className="absolute -right-10 top-3 bg-gold text-dark-900 text-[.6rem] font-bold py-1 px-10 rotate-45">POPULAIRE</div>
                    )}
                    <input type="radio" name="boost" checked={boost === i} onChange={() => setBoost(i)} className="mt-1 w-5 h-5 accent-gold shrink-0" />
                    <div className="flex-1 pr-6">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="font-bold text-[1.05rem] dark:text-white leading-tight">{b.name}</span>
                        <div className="text-right shrink-0">
                          <span className={`font-bold block ${i === 0 ? "text-gray-500" : "text-green dark:text-neon-green"}`}>{i === 0 ? "Gratuit" : `${b.price} FCFA`}</span>
                          {b.duration && <span className="text-[.7rem] text-gray-400">{b.duration}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {b.features.map(f => (
                          <span key={f} className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-border rounded px-2 py-0.5 text-[.75rem] text-gray-600 dark:text-gray-300">✓ {f}</span>
                        ))}
                      </div>
                    </div>
                  </label>
                ))}
                
                {boost === 0 && (
                  <div className="bg-gray-50 dark:bg-dark-900 rounded-lg p-3 text-[.85rem] text-gray-600 dark:text-gray-400 flex items-center justify-between">
                    <span>Annonces gratuites restantes :</span>
                    <span className="font-bold text-gray-900 dark:text-white text-lg">{freeAdsRemaining}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FOOTER WIZARD BUTTONS */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 px-6 rounded-xl border border-transparent dark:border-white/10">
                ← Précédent
              </button>
            ) : <div></div>}

            {step < 4 ? (
              <button onClick={handleNext} className="btn bg-gradient-to-r from-green-500 to-neon-gold text-white font-bold px-8 rounded-xl shadow-[0_4px_15px_rgba(0,168,89,0.3)] hover:scale-105 transition-transform">
                Suivant →
              </button>
            ) : (
              <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className={`btn px-8 shadow-xl ${boost > 0 ? "btn-gold animate-pulse-slow" : "btn-green"} ${isPublishing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isPublishing ? "Publication en cours..." : (boost > 0 ? `Payer & Publier` : "Publier mon annonce")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DROITE : LIVE PREVIEW (STICKY MOCKUP) */}
      <div className="hidden xl:block w-[260px] shrink-0 relative">
        <div className="sticky top-24 pt-4">
          <div className="bg-white dark:bg-dark-800 rounded-[2rem] p-[8px] shadow-2xl border-[8px] border-gray-900 dark:border-black h-[520px] relative flex flex-col ring-1 ring-white/10 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-white/10 before:to-transparent before:pointer-events-none before:z-50 overflow-hidden group">
            
            {/* Glossy Reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none z-50"></div>

            {/* Dynamic Island / Notch */}
            <div className="absolute top-0 inset-x-0 h-5 flex justify-center z-50">
              <div className="w-[80px] h-5 bg-black rounded-b-[10px] flex items-center justify-between px-2.5 relative overflow-hidden">
                <div className="w-1 h-1 rounded-full bg-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                <div className="w-1 h-1 rounded-full bg-green/50 shadow-[0_0_8px_rgba(46,204,113,0.8)]"></div>
              </div>
            </div>
            
              <div className="bg-gray-50 dark:bg-[#0f1115] flex-1 rounded-[1.5rem] overflow-y-auto no-scrollbar pt-4 pb-12 relative flex flex-col shadow-inner">
              
              {/* Fake Header */}
              <div className="px-3 py-2 flex items-center justify-between sticky top-0 z-40 bg-white/80 dark:bg-[#0f1115]/80 backdrop-blur-md border-b border-gray-100/50 dark:border-dark-border/50">
                <span className="text-sm text-gray-400 hover:text-black cursor-pointer transition-colors">←</span>
                <span className="font-display font-bold text-[.8rem] tracking-wide text-gray-800 dark:text-gray-100">Aperçu en direct</span>
                <span className="text-sm text-gray-400 hover:text-black cursor-pointer transition-colors">⋮</span>
              </div>

              {/* Image / Carousel */}
              <div className="h-[140px] w-full relative bg-gray-100 dark:bg-dark-800 flex-shrink-0">
                {photos.length > 0 ? (
                  <img src={photos[0]} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <span className="text-3xl mb-1 drop-shadow-md">📸</span>
                    <span className="text-[.6rem] font-semibold tracking-wide uppercase text-gray-400/80">Image principale</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[.6rem] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow-lg border border-white/10">
                  1 / {Math.max(photos.length, 1)}
                </div>
              </div>

              {/* Content Wrapper */}
              <div className="flex-1 flex flex-col p-3 bg-gradient-to-b from-white to-gray-50 dark:from-[#0f1115] dark:to-[#15181e] relative z-10">
                
                {/* Price & Title */}
                <div className="mb-2">
                  <div className="text-[1.1rem] font-black text-green dark:text-neon-green mb-0.5 leading-none drop-shadow-sm">
                    {price ? `${price} FCFA` : "Prix non défini"}
                  </div>
                  <h1 className="font-bold text-[.85rem] text-gray-900 dark:text-white leading-tight mb-1 break-words line-clamp-1">
                    {title || <span className="text-gray-300 dark:text-gray-700 italic">Le titre de votre annonce s'affichera ici...</span>}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[.65rem] text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="bg-gray-100 dark:bg-dark-800 p-0.5 rounded-full text-[.6rem]">📍</span> 
                      {commune === "Autre" ? (customCommune ? customCommune : region) : `${commune}, ${region}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="bg-gray-100 dark:bg-dark-800 p-0.5 rounded-full text-[.6rem]">⏱️</span> 
                      À l'instant
                    </span>
                  </div>
                </div>

                <div className="h-px w-full bg-gray-100 dark:bg-dark-border/50 my-1.5"></div>

                {/* Seller Profile */}
                <div className="py-1 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gold to-brand-red p-[1px] shadow-sm shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden border border-white dark:border-[#0f1115] bg-white">
                      <img src={userProfile?.avatar_url || "https://i.pravatar.cc/100"} className="w-full h-full object-cover" alt="" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[.7rem] text-gray-900 dark:text-white truncate flex items-center gap-1">
                      {userProfile?.full_name || "Votre Nom"}
                      <span className="text-blue-500 text-[.6rem]">✓</span>
                    </div>
                    <div className="text-[.6rem] text-gray-500">Membre 2026</div>
                  </div>
                  <div className="bg-green/10 text-green px-1.5 py-0.5 rounded text-[.6rem] font-bold uppercase tracking-wider">Pro</div>
                </div>

                <div className="h-px w-full bg-gray-100 dark:bg-dark-border/50 my-1.5"></div>

                {/* Description Snippet */}
                <div className="mt-1 text-[.65rem] text-gray-600 dark:text-gray-400 leading-snug line-clamp-2">
                  {desc || <span className="italic text-gray-300 dark:text-gray-600">Votre description s'affichera ici. Décrivez au mieux votre article pour attirer les acheteurs...</span>}
                </div>
              </div>
              
              {/* Fake Bottom Action Bar */}
              <div className="absolute bottom-0 inset-x-0 p-2 bg-white/90 dark:bg-[#0f1115]/90 backdrop-blur-md border-t border-gray-100/50 dark:border-dark-border/50 flex gap-2 z-40">
                <div className="w-8 h-8 rounded-lg bg-green/10 text-green flex items-center justify-center text-sm shrink-0">💬</div>
                <div className="flex-1 h-8 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center font-bold text-[.7rem] uppercase tracking-wide">Contacter</div>
              </div>
            </div>
          </div>
        </div>
          <div className="mt-6 text-center text-[.85rem] text-gray-500 font-medium tracking-wide">
            ✨ C'est exactement ce que verront vos acheteurs
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] bg-dark-900 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-[.9rem] animate-fadeUp border border-gray-800">
          {toast}
        </div>
      )}

      {cropQueue.length > 0 && (
        <ImageCropperModal
          imageSrc={cropQueue[0]}
          aspectRatio={1} // Format carré pour les annonces
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
