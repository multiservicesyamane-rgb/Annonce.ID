"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

export default function MarketingPanel({ ads, user }: { ads: any[], user: any }) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const baseUrl = window.location.origin;
      const boutiqueUrl = `${baseUrl}/boutique/${user.id}`;
      
      let msg = `👋 Bonjour ! Je viens de mettre à jour mon catalogue sur Annonce.ID.\n\n`;
      msg += `🔥 Voici mes dernières nouveautés :\n`;
      
      const recentAds = ads.slice(0, 3);
      recentAds.forEach((ad: any) => {
        msg += `- *${ad.title}* (${ad.price} FCFA)\n`;
      });
      
      msg += `\n🛒 Découvrez tout mon catalogue et commandez en ligne ici 👇\n${boutiqueUrl}`;
      setCustomMessage(msg);
    }
  }, [ads, user]);

  const generateWhatsAppLink = (ad: any) => {
    if (typeof window === 'undefined') return '#';
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/annonce/${ad.id}/${ad.slug}`;
    const message = `👋 Bonjour ! J'ai publié une nouvelle annonce : *${ad.title}* à *${ad.price} FCFA*.\n\nRetrouvez tous les détails ici 👇\n${url}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const generateFacebookLink = (ad: any) => {
    if (typeof window === 'undefined') return '#';
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/annonce/${ad.id}/${ad.slug}`;
    const quote = `🌟 Découvrez mon annonce : ${ad.title} à ${ad.price} FCFA.\n\n👉 Retrouvez tous les détails et l'image ici :`;
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`;
  };

  const handleInstagramAdShare = (ad: any) => {
    if (typeof window === 'undefined') return;
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/annonce/${ad.id}/${ad.slug}`;
    const message = `Découvrez mon annonce :\n\n🌟 ${ad.title}\n💰 ${ad.price} FCFA\n\n👉 Retrouvez tous les détails et commandez ici :\n${url}`;
    navigator.clipboard.writeText(message);
    alert("Détails et lien copiés ! Ouvrez Instagram, ajoutez votre image et collez ce texte.");
    window.open("https://instagram.com", "_blank");
  };

  const handleCopy = (ad: any) => {
    if (typeof window === 'undefined') return;
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/annonce/${ad.id}/${ad.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(ad.id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const generateCatalogWhatsAppLink = () => {
    return `https://wa.me/?text=${encodeURIComponent(customMessage)}`;
  };

  const generateCatalogEmailLink = () => {
    const subject = "Découvrez mes nouveaux produits !";
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(customMessage)}`;
  };

  const generateCatalogFacebookLink = () => {
    if (typeof window === 'undefined' || !user) return '#';
    const baseUrl = window.location.origin;
    const boutiqueUrl = `${baseUrl}/boutique/${user.id}`;
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(boutiqueUrl)}&quote=${encodeURIComponent(customMessage)}`;
  };

  const handleInstagramShare = () => {
    navigator.clipboard.writeText(customMessage);
    alert("Texte et lien copiés ! Ouvrez Instagram pour créer votre publication ou Story, puis collez-les.");
    window.open("https://instagram.com", "_blank");
  };

  return (
    <div className="animate-fadeUp max-w-[1200px] mx-auto space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-800 p-5 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm">
          <div className="text-gray-500 text-xs font-bold mb-1">VUES ANNONCES</div>
          <div className="text-xl sm:text-2xl font-extrabold text-green">
            {ads.reduce((acc, ad) => acc + (ad.views || 0), 0).toLocaleString('fr-FR')}
          </div>
        </div>
        <div className="bg-white dark:bg-dark-800 p-5 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm">
          <div className="text-gray-500 text-xs font-bold mb-1">CLICS WHATSAPP</div>
          <div className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
            {user?.whatsapp_clicks || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-dark-800 p-5 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm">
          <div className="text-gray-500 text-xs font-bold mb-1">PRODUITS ACTIFS</div>
          <div className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">{ads.length}</div>
        </div>
        <div className="bg-white dark:bg-dark-800 p-5 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm">
          <div className="text-gray-500 text-xs font-bold mb-1">VISITES BOUTIQUE</div>
          <div className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
            {user?.boutique_views || 0}
          </div>
        </div>
      </div>

      {/* Campagne WhatsApp */}
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-dark-900">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-brand-wa">📱</span> Campagne WhatsApp Rapide
          </h3>
          <span className="text-xs bg-green/10 text-green px-3 py-1 rounded-full font-bold">Nouveau</span>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Saviez-vous que 80% des ventes en ligne en Afrique se concluent sur WhatsApp ? 
              Générez un statut professionnel en un clic pour vos produits à la une.
            </p>
            {ads.length > 0 ? (
              <a 
                href={generateWhatsAppLink(ads[0])}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-[#25D366] hover:bg-green-600 text-white rounded-xl font-bold w-full py-4 shadow-lg shadow-green/20 transition-transform hover:scale-[1.02]"
              >
                Partager ma dernière annonce
              </a>
            ) : (
              <Link href="/publier" className="block text-center rounded-xl bg-green text-white font-bold w-full py-4">
                Publier une annonce d'abord
              </Link>
            )}
          </div>
          {/* Mockup WhatsApp */}
          <div className="bg-[#E5DDD5] dark:bg-[#0b141a] p-4 rounded-xl shadow-inner relative max-w-[300px] mx-auto w-full">
            <div className="bg-[#DCF8C6] dark:bg-[#005c4b] p-3 rounded-lg rounded-tr-none shadow-sm ml-auto w-[90%] text-sm text-gray-900 dark:text-white">
              <div className="font-bold text-[#25D366] text-xs mb-1">Promo Spéciale ✨</div>
              👋 Bonjour ! J'ai publié une nouvelle annonce : <br/>
              *{ads[0]?.title || "Nom du produit"}* à *{ads[0]?.price || "10 000"} FCFA*.
              <br/><br/>
              Retrouvez tous les détails ici 👇<br/>
              <span className="text-blue-500 underline">https://annonce.id/a/...</span>
              <div className="text-[.6rem] text-right mt-1 text-gray-500 dark:text-gray-300">14:00 ✓✓</div>
            </div>
          </div>
        </div>
      </div>

      {/* Campagne Mailing & WhatsApp Masse */}
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-dark-900">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-gold">🚀</span> Diffuser ma boutique aux clients
          </h3>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Envoyez vos dernières nouveautés directement à vos clients fidèles. Cela génère en moyenne <strong className="text-gray-900 dark:text-white">3x plus de ventes</strong> rapides.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <a 
                href={generateCatalogWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-green-600 text-white rounded-xl font-bold w-full py-4 shadow-sm transition"
              >
                <WhatsappIcon /> Partager par WhatsApp
              </a>
              <a 
                href={generateCatalogFacebookLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1864D9] text-white rounded-xl font-bold w-full py-3 shadow-sm transition text-sm"
              >
                <FacebookIcon /> Facebook
              </a>
              <button 
                onClick={handleInstagramShare}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-90 text-white rounded-xl font-bold w-full py-3 shadow-sm transition text-sm"
              >
                <InstagramIcon /> Instagram
              </button>
              <a 
                href={generateCatalogEmailLink()}
                className="col-span-2 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-dark-900 dark:hover:bg-dark-700 text-gray-900 dark:text-white rounded-xl font-bold w-full py-3 shadow-sm transition text-sm"
              >
                <MailIcon /> Envoyer par Email
              </a>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-900 p-5 rounded-xl border border-gray-100 dark:border-dark-border shadow-sm">
            <h4 className="font-bold text-[.85rem] mb-3 text-gray-700 dark:text-white">Aperçu du message</h4>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full text-[.8rem] text-gray-700 dark:text-gray-300 space-y-2 whitespace-pre-wrap font-mono bg-white dark:bg-dark-800 p-4 rounded-lg border border-gray-200 dark:border-dark-border h-48 focus:ring-2 focus:ring-green outline-none resize-none"
              placeholder="Écrivez votre message personnalisé ici..."
            />
          </div>
        </div>
      </div>

      {/* Produits à promouvoir */}
      <div>
        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          🌟 Produits à promouvoir
        </h3>
        {ads.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 dark:bg-dark-900 rounded-xl text-gray-500">
            Aucun produit à promouvoir. <Link href="/publier" className="text-green underline">Ajouter une annonce</Link>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-200 dark:border-dark-border flex flex-col gap-4">
                <div className="flex gap-4">
                  <img src={ad.image || "https://placehold.co/100x100"} alt={ad.title} className="w-16 h-16 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-bold text-sm line-clamp-2 text-gray-900 dark:text-white">{ad.title}</h4>
                    <div className="text-green font-extrabold text-sm mt-1">{ad.price} FCFA</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-auto">
                  <a 
                    href={generateWhatsAppLink(ad)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Partager sur WhatsApp"
                    className="flex items-center justify-center py-2 px-3 text-lg rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition"
                  >
                    <WhatsappIcon />
                  </a>
                  <a 
                    href={generateFacebookLink(ad)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Partager sur Facebook"
                    className="flex items-center justify-center py-2 px-3 text-lg rounded-lg bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition"
                  >
                    <FacebookIcon />
                  </a>
                  <button 
                    onClick={() => handleInstagramAdShare(ad)}
                    title="Partager sur Instagram"
                    className="flex items-center justify-center py-2 px-3 text-lg rounded-lg bg-gradient-to-tr from-[#f09433]/10 via-[#dc2743]/10 to-[#bc1888]/10 text-[#bc1888] hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white transition"
                  >
                    <InstagramIcon />
                  </button>
                  <button 
                    onClick={() => handleCopy(ad)}
                    title="Copier le lien"
                    className="flex items-center justify-center py-2 px-3 text-lg rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-900 dark:text-white dark:hover:bg-dark-700 transition"
                  >
                    {copiedLink === ad.id ? "✓" : <LinkIcon />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conseils Marketing Sénégal */}
      <div className="bg-dark-900 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 text-9xl opacity-5">💡</div>
        <h3 className="font-display font-extrabold text-xl mb-6 text-gold">Conseils Marketing Sénégal</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/5 p-4 rounded-xl">
            <h4 className="font-bold text-green-pale mb-2 flex items-center gap-2">⏰ Meilleures heures</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Envoyez vos statuts entre 8h-10h et 18h-21h. C'est le moment où les Sénégalais sont le plus actifs sur WhatsApp.
            </p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl">
            <h4 className="font-bold text-green-pale mb-2 flex items-center gap-2">📸 Visuels de qualité</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Vos annonces avec des photos nettes reçoivent 3x plus de clics. Prenez vos photos à la lumière du jour.
            </p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl">
            <h4 className="font-bold text-green-pale mb-2 flex items-center gap-2">🔥 Urgence & Offres</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Utilisez des mots comme "Stock limité" ou "Promo ce weekend". Cela accélère la décision d'achat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
