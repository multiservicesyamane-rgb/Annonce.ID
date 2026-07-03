// ─── Configuration centralisée de tous les liens réseaux sociaux ───
// Chaque réseau = un lien d'invitation que l'inscrit est invité à rejoindre automatiquement.

export interface SocialChannel {
  id: string;
  platform: "facebook_group" | "facebook_page" | "instagram" | "telegram" | "whatsapp" | "pinterest";
  name: string;
  description: string;
  url: string;
  icon: string;        // emoji
  color: string;       // couleur du bouton
  priority: number;    // ordre d'affichage (1 = premier)
}

// ─── VOS LIENS (à personnaliser) ───
// Remplacez les URLs par vos vrais liens d'invitation.
export const SOCIAL_CHANNELS: SocialChannel[] = [
  // ─── TELEGRAM ───
  {
    id: "telegram_channel",
    platform: "telegram",
    name: "Canal Telegram",
    description: "Recevez les meilleures annonces en temps réel",
    url: "https://t.me/wanteermako",
    icon: "✈️",
    color: "#0088cc",
    priority: 1,
  },
  // ─── WHATSAPP ───
  {
    id: "whatsapp_channel",
    platform: "whatsapp",
    name: "Canal WhatsApp",
    description: "Rejoignez notre communauté WhatsApp",
    url: "https://whatsapp.com/channel/0029Vb0000000000000000",  // ← Remplacez par votre vrai lien
    icon: "💬",
    color: "#25D366",
    priority: 2,
  },
  // ─── FACEBOOK PAGE ───
  {
    id: "facebook_page",
    platform: "facebook_page",
    name: "Page Facebook",
    description: "Aimez notre page pour les actualités",
    url: "https://www.facebook.com/wanteermako",  // ← Remplacez
    icon: "👍",
    color: "#1877F2",
    priority: 3,
  },
  // ─── FACEBOOK GROUPE ───
  {
    id: "facebook_group",
    platform: "facebook_group",
    name: "Groupe Facebook",
    description: "Échangez avec la communauté d'acheteurs et vendeurs",
    url: "https://www.facebook.com/groups/wanteermako",  // ← Remplacez
    icon: "👥",
    color: "#1877F2",
    priority: 4,
  },
  // ─── INSTAGRAM ───
  {
    id: "instagram",
    platform: "instagram",
    name: "Instagram",
    description: "Suivez-nous pour les visuels et stories",
    url: "https://www.instagram.com/wanteermako",  // ← Remplacez
    icon: "📸",
    color: "#E4405F",
    priority: 5,
  },
  // ─── PINTEREST ───
  {
    id: "pinterest",
    platform: "pinterest",
    name: "Pinterest",
    description: "Découvrez nos tableaux d'inspiration",
    url: "https://www.pinterest.com/wanteermako",  // ← Remplacez
    icon: "📌",
    color: "#E60023",
    priority: 6,
  },
];

// Triés par priorité
export const getSortedChannels = () =>
  [...SOCIAL_CHANNELS].sort((a, b) => a.priority - b.priority);

// Obtenir les liens par plateforme
export const getChannelsByPlatform = (platform: SocialChannel["platform"]) =>
  SOCIAL_CHANNELS.filter((c) => c.platform === platform);
