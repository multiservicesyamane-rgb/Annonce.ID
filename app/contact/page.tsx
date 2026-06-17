"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-12 md:py-20">
      <div className="text-center mb-16">
        <h1 className="font-display text-[2.5rem] md:text-[3.5rem] font-black text-gray-900 dark:text-white leading-tight mb-4">
          Contactez-nous
        </h1>
        <p className="text-[1.1rem] text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Une question ? Un problème technique ? Notre équipe est là pour vous aider du lundi au samedi.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
        {/* Contact Info */}
        <div className="bg-gray-50 dark:bg-dark-800 rounded-2xl p-8 border border-gray-100 dark:border-dark-border">
          <h3 className="font-bold text-[1.2rem] text-gray-900 dark:text-white mb-6">Nos coordonnées</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green/10 text-green flex items-center justify-center text-xl shrink-0">📍</div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">Adresse</div>
                <div className="text-gray-500 text-[.9rem]">Dakar, Sénégal</div>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green/10 text-green flex items-center justify-center text-xl shrink-0">📧</div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">Email</div>
                <div className="text-gray-500 text-[.9rem]">support@annonce.id</div>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green/10 text-green flex items-center justify-center text-xl shrink-0">💬</div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">WhatsApp</div>
                <div className="text-gray-500 text-[.9rem]">+221 77 000 00 00</div>
              </div>
            </div>
          </div>

          <hr className="my-8 border-gray-200 dark:border-dark-border" />
          
          <h3 className="font-bold text-[1.1rem] text-gray-900 dark:text-white mb-3">Réseaux Sociaux</h3>
          <div className="flex gap-3">
            <a href="#" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-900 flex items-center justify-center hover:bg-green hover:text-white transition-colors">fb</a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-900 flex items-center justify-center hover:bg-green hover:text-white transition-colors">in</a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-900 flex items-center justify-center hover:bg-green hover:text-white transition-colors">tw</a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-dark-border">
          <h3 className="font-bold text-[1.4rem] text-gray-900 dark:text-white mb-6">Envoyez-nous un message</h3>
          
          {status === "success" ? (
            <div className="bg-green/10 border border-green text-green rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <h4 className="font-bold text-[1.2rem] mb-1">Message envoyé !</h4>
              <p className="text-[.95rem]">Nous vous répondrons dans les plus brefs délais.</p>
              <button onClick={() => setStatus("idle")} className="mt-4 text-sm underline font-semibold hover:text-green-dark">Envoyer un autre message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label">Votre nom <span className="text-brand-red">*</span></label>
                  <input 
                    required 
                    type="text" 
                    className="input" 
                    placeholder="Ex: Moussa Diop"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label">Votre adresse email <span className="text-brand-red">*</span></label>
                  <input 
                    required 
                    type="email" 
                    className="input" 
                    placeholder="Ex: moussa@email.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Sujet <span className="text-brand-red">*</span></label>
                <select 
                  required 
                  className="input cursor-pointer"
                  value={form.subject}
                  onChange={e => setForm({...form, subject: e.target.value})}
                >
                  <option value="" disabled>Sélectionnez un sujet...</option>
                  <option value="Aide">Aide avec mon compte</option>
                  <option value="Paiement">Problème de paiement</option>
                  <option value="Signalement">Signaler une annonce</option>
                  <option value="Partenariat">Partenariat professionnel</option>
                  <option value="Autre">Autre demande</option>
                </select>
              </div>

              <div>
                <label className="label">Message <span className="text-brand-red">*</span></label>
                <textarea 
                  required 
                  className="input min-h-[150px] resize-y" 
                  placeholder="Expliquez-nous comment nous pouvons vous aider..."
                  value={form.message}
                  onChange={e => setForm({...form, message: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={status === "loading"}
                className={`btn btn-green w-full ${status === "loading" ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {status === "loading" ? "Envoi en cours..." : "Envoyer le message"}
              </button>
              
              <p className="text-center text-[.75rem] text-gray-500 mt-4">
                En soumettant ce formulaire, vous acceptez notre <Link href="/politique-confidentialite" className="underline hover:text-green">politique de confidentialité</Link>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
