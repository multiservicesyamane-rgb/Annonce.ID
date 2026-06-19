// Configuration du PAIEMENT MANUEL (en attendant l'activation des paiements en ligne).
// Le client dépose sur Wave / Orange Money puis envoie le reçu sur WhatsApp.
// L'admin active ensuite le plan dans le super admin → Encaissement.
//
// ⚠️ Mets ici TES vrais numéros.

// Active/désactive les boutons de paiement EN LIGNE (Wave API / CinetPay).
// false = on n'affiche que le paiement manuel (recommandé pour l'instant).
export const ONLINE_PAYMENT_ENABLED = false;

// Numéro Wave où le client dépose (affiché tel quel)
export const WAVE_NUMBER = "96 18 69 03";

// Numéro Orange Money où le client dépose (à compléter)
export const ORANGE_NUMBER = "96 18 69 03";

// Numéro WhatsApp (format international SANS +, ni espaces) pour recevoir le reçu.
// Ex Sénégal : 2217XXXXXXXX. À COMPLÉTER avec ton vrai WhatsApp.
export const WHATSAPP_NUMBER = "221961869003";

/** Construit un lien wa.me avec un message pré-rempli. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
