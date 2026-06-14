"use client";

import React, { useState } from "react";
import Link from "next/link";

const PACKS = [
  {
    id: "kheweul",
    name: "KHEWEUL",
    color: "bg-[#b08df1]",
    features: [
      "Responsabilité civile",
      "Défense recours",
      "Personnes transportées"
    ],
    price: "16 200 F Cfa"
  },
  {
    id: "nopale",
    name: "NOPALE",
    color: "bg-[#7bc86c]",
    features: [
      "Responsabilité civile",
      "Défense recours",
      "Personnes transportées",
      "Bris de glace"
    ],
    price: "38 900 F Cfa"
  },
  {
    id: "karangue",
    name: "KARANGUE",
    color: "bg-[#f19a4a]",
    features: [
      "Responsabilité civile",
      "Défense recours",
      "Avance sur recours",
      "Personnes transportées",
      "Bris de glace"
    ],
    price: "40 700 F Cfa"
  }
];

const STEPS = ["Packs", "Détails", "Résumé", "Félicitation"];

export default function AssurancePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);

  return (
    <div className="bg-gray-50 dark:bg-dark-900 min-h-screen pb-20">
      {/* HERO SECTION */}
      <section className="bg-[#e78000] text-white py-16 relative overflow-hidden">
        <div className="wrap relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight text-white">
              Achetez votre assurance et recevez attestation rapidement
            </h1>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-[.95rem] font-medium">
                <span className="text-white">✓</span> Disponible 7j/7 et 24h/24
              </li>
              <li className="flex items-center gap-2 text-[.95rem] font-medium">
                <span className="text-white">✓</span> Paiement par Orange Money ou Wave
              </li>
              <li className="flex items-center gap-2 text-[.95rem] font-medium">
                <span className="text-white">✓</span> Accès immédiat à votre attestation digitale
              </li>
            </ul>
            <button 
              onClick={() => {
                const formElement = document.getElementById("form-section");
                formElement?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[#002a3a] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-black transition hover:scale-105"
            >
              Obtenir mon tarif en ligne
            </button>
          </div>
          
          <div className="relative w-full max-w-[500px] h-[300px] hidden md:block">
            {/* Visual placeholders instead of external image dependencies */}
            <div className="absolute right-0 bottom-0 text-[12rem] leading-none opacity-20">🚗</div>
            <div className="absolute left-10 bottom-0 text-[10rem] leading-none opacity-20">📱</div>
            <div className="absolute right-20 top-0 text-[8rem] leading-none opacity-20">🛡️</div>
          </div>
        </div>
      </section>

      {/* SUBTITLE */}
      <div className="text-center py-10 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-border">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white px-4">
          Simplifiez Votre Assurance Auto au Sénégal avec <span className="underline decoration-green underline-offset-4">Annonces West</span>
        </h2>
      </div>

      {/* FORM SECTION */}
      <section id="form-section" className="wrap py-12">
        {/* STEPPER */}
        <div className="max-w-3xl mx-auto mb-12 px-4">
          <div className="flex justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-200 dark:bg-dark-border -z-10"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#e78000] -z-10 transition-all duration-500" style={{ width: `${((currentStep - 1) / 3) * 100}%` }}></div>
            
            {STEPS.map((step, idx) => {
              const stepNum = idx + 1;
              const isActive = currentStep === stepNum;
              const isPast = currentStep > stepNum;
              
              return (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300 ${
                    isActive ? "bg-[#e78000] border-[#e78000] text-white" : 
                    isPast ? "bg-[#e78000] border-[#e78000] text-white" : 
                    "bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-border text-gray-400"
                  }`}>
                    {isPast ? "✓" : stepNum}
                  </div>
                  <span className={`text-xs sm:text-sm font-medium ${isActive ? "text-[#e78000]" : isPast ? "text-gray-700 dark:text-gray-300" : "text-gray-500"}`}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP CONTENT */}
        <div className="max-w-5xl mx-auto px-4">
          {currentStep === 1 && (
            <div className="animate-fadeUp">
              <h3 className="text-center text-[1.15rem] sm:text-xl font-bold text-gray-600 dark:text-gray-300 mb-8 bg-gray-100 dark:bg-dark-800 py-4 px-4 rounded-lg">
                Votre tarif et vos garanties auto en 2 min. 100% en ligne !!!
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PACKS.map(pack => (
                  <div key={pack.id} className="bg-white dark:bg-dark-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-dark-border flex flex-col hover:shadow-md transition">
                    <div className={`${pack.color} text-white text-center py-4 font-display font-extrabold tracking-widest text-lg`}>
                      {pack.name}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <ul className="space-y-3 mb-8 flex-1">
                        {pack.features.map((f, i) => (
                          <li key={i} className="flex gap-2.5 text-[.9rem] text-gray-700 dark:text-gray-300 items-start">
                            <span className="text-gray-400 mt-0.5">✓</span> <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto text-center border-t border-gray-100 dark:border-dark-border pt-6">
                        <div className="text-[.85rem] text-gray-500 mb-1 font-medium">À partir de</div>
                        <div className="text-2xl font-display font-extrabold text-[#e78000] mb-6">{pack.price}</div>
                        <button 
                          onClick={() => {
                            setSelectedPack(pack.id);
                            setCurrentStep(2);
                            window.scrollTo({ top: document.getElementById('form-section')?.offsetTop, behavior: 'smooth' });
                          }}
                          className="w-full text-center py-3 border border-gray-200 dark:border-dark-border rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-dark-700 transition active:scale-[0.98]"
                        >
                          Choisir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-fadeUp bg-white dark:bg-dark-800 p-6 sm:p-10 rounded-xl border border-gray-100 dark:border-dark-border shadow-sm max-w-3xl mx-auto">
              <h3 className="font-display text-xl font-bold mb-6 text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-dark-border">Détails du véhicule et propriétaire</h3>
              
              <div className="grid gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Marque du véhicule</label>
                    <select className="input cursor-pointer">
                      <option>Sélectionnez...</option>
                      <option>Toyota</option>
                      <option>Peugeot</option>
                      <option>Renault</option>
                      <option>Hyundai</option>
                      <option>Dacia</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Année de mise en circulation</label>
                    <input type="number" className="input" placeholder="Ex: 2018" />
                  </div>
                </div>
                
                <div>
                  <label className="label">Nom et Prénom</label>
                  <input type="text" className="input" placeholder="Votre nom complet" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Téléphone</label>
                    <input type="tel" className="input" placeholder="77 000 00 00" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input" placeholder="vous@exemple.com" />
                  </div>
                </div>
                
                <div className="pt-6 flex justify-between items-center border-t border-gray-100 dark:border-dark-border mt-2">
                  <button onClick={() => setCurrentStep(1)} className="btn btn-outline">← Retour</button>
                  <button onClick={() => setCurrentStep(3)} className="btn bg-[#e78000] hover:bg-orange-600 text-white px-8">Continuer →</button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-fadeUp bg-white dark:bg-dark-800 p-6 sm:p-10 rounded-xl border border-gray-100 dark:border-dark-border shadow-sm max-w-3xl mx-auto">
              <h3 className="font-display text-xl font-bold mb-6 text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-dark-border">Résumé et Paiement</h3>
              
              <div className="bg-gray-50 dark:bg-dark-900 p-6 rounded-lg mb-8 border border-gray-100 dark:border-dark-border">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-dark-border pb-4">
                  <div>
                    <div className="text-[.85rem] text-gray-500 font-medium">Pack sélectionné</div>
                    <div className="font-bold text-[1.1rem] text-gray-900 dark:text-white">{PACKS.find(p => p.id === selectedPack)?.name || 'KHEWEUL'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[.85rem] text-gray-500 font-medium">Montant total à payer</div>
                    <div className="font-extrabold text-2xl text-[#e78000]">{PACKS.find(p => p.id === selectedPack)?.price || '16 200 F Cfa'}</div>
                  </div>
                </div>
                <ul className="space-y-2 text-[.9rem] text-gray-600 dark:text-gray-400 font-medium">
                  <li className="flex justify-between"><span>Véhicule :</span> <span className="text-gray-900 dark:text-white">Toyota (2018)</span></li>
                  <li className="flex justify-between"><span>Durée :</span> <span className="text-gray-900 dark:text-white">12 mois</span></li>
                  <li className="flex justify-between"><span>Début couverture :</span> <span className="text-gray-900 dark:text-white">{new Date().toLocaleDateString('fr-FR')}</span></li>
                </ul>
              </div>
              
              <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Choisissez votre moyen de paiement</h4>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <label className="relative flex flex-col items-center justify-center p-5 border-2 border-[#e78000] bg-orange-50/50 dark:bg-orange-900/10 rounded-lg cursor-pointer transition-all hover:shadow-md">
                  <input type="radio" name="payment" className="absolute top-3 right-3" defaultChecked />
                  <div className="w-14 h-14 bg-[#e78000] rounded-full flex items-center justify-center text-white font-bold mb-3 shadow-sm">OM</div>
                  <span className="text-[.95rem] font-bold">Orange Money</span>
                </label>
                <label className="relative flex flex-col items-center justify-center p-5 border-2 border-gray-200 dark:border-dark-border hover:border-blue-400 bg-gray-50 dark:bg-dark-900 rounded-lg cursor-pointer transition-all hover:shadow-md">
                  <input type="radio" name="payment" className="absolute top-3 right-3" />
                  <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-3 shadow-sm">W</div>
                  <span className="text-[.95rem] font-bold">Wave</span>
                </label>
              </div>
              
              <div className="pt-6 flex justify-between items-center border-t border-gray-100 dark:border-dark-border mt-2">
                <button onClick={() => setCurrentStep(2)} className="btn btn-outline">← Retour</button>
                <button onClick={() => setCurrentStep(4)} className="btn bg-[#002a3a] hover:bg-black text-white px-8 h-12 text-[1rem]">Payer maintenant</button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="animate-fadeUp bg-white dark:bg-dark-800 p-8 sm:p-12 rounded-xl border border-gray-100 dark:border-dark-border shadow-sm max-w-2xl mx-auto text-center">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-sm">
                ✓
              </div>
              <h3 className="font-display text-3xl font-bold mb-4 text-gray-900 dark:text-white">Félicitations !</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-[1.05rem]">
                Votre paiement a été traité avec succès. Votre attestation d'assurance digitale a été envoyée sur votre adresse email et par WhatsApp. Vous êtes maintenant couvert !
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="btn btn-outline h-12 px-6">Télécharger l'attestation PDF</button>
                <Link href="/" className="btn bg-[#e78000] hover:bg-orange-600 text-white h-12 px-8">Retour à l'accueil</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
