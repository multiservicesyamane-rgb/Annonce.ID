// Configuration du PAIEMENT MANUEL (en attendant l'activation des paiements en ligne).
// Le client dépose sur Wave / Orange Money puis envoie le reçu sur WhatsApp.
// L'admin active ensuite le plan dans le super admin → Encaissement.
//
// ⚠️ Mets ici TES vrais numéros.

// Active/desactive les boutons de paiement EN LIGNE.
// Par defaut, on garde le paiement manuel. Pour Chariow :
// NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED=true
// NEXT_PUBLIC_PAYMENT_PROVIDER=chariow
const paymentProvider = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "manual").toLowerCase();
const explicitOnline = process.env.NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED === "true";
const explicitChariow = process.env.NEXT_PUBLIC_CHARIOW_PAYMENT_ENABLED === "true";
const explicitWave = process.env.NEXT_PUBLIC_WAVE_PAYMENT_ENABLED === "true";
const explicitCinetPay = process.env.NEXT_PUBLIC_CINETPAY_PAYMENT_ENABLED === "true";
export const PAYMENT_REQUIRED = process.env.NEXT_PUBLIC_PAYMENT_REQUIRED !== "false";

// Abonnements Boutique masqués sur le site pour l'instant (stratégie : on ne
// vend en ligne que les 3 boosts). Pour les réactiver plus tard : passer à true
// (et créer les produits Chariow correspondants pour le paiement en ligne).
// L'admin peut toujours activer un abonnement à la main via Encaissement.
export const SUBSCRIPTIONS_ENABLED = false;

export const PAYMENT_PROVIDER = paymentProvider;
export const ONLINE_PAYMENT_ENABLED =
  PAYMENT_REQUIRED &&
  (
    explicitOnline ||
    explicitChariow ||
    explicitWave ||
    explicitCinetPay ||
    paymentProvider !== "manual"
  );

export const CHARIOW_PAYMENT_ENABLED =
  explicitChariow || paymentProvider === "chariow" || paymentProvider === "all";
export const WAVE_ONLINE_PAYMENT_ENABLED =
  explicitWave || paymentProvider === "wave" || paymentProvider === "all";
export const CINETPAY_ONLINE_PAYMENT_ENABLED =
  explicitCinetPay || paymentProvider === "cinetpay" || paymentProvider === "all";

// Numéro Wave où le client dépose
export const WAVE_NUMBER = "77 682 78 51";

// Numéro Orange Money où le client dépose
export const ORANGE_NUMBER = "77 682 78 51";

// Numéro WhatsApp (format international SANS +, ni espaces) pour recevoir le reçu.
export const WHATSAPP_NUMBER = "221776827851";

/** Construit un lien wa.me avec un message pré-rempli. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
