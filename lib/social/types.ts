// Couche de publication réseaux sociaux — interface commune à tous les réseaux.
// Chaque réseau (Telegram, Facebook, …) implémente `Publisher`.

export type SocialPlatform = "telegram" | "facebook" | "instagram" | "whatsapp";

// Données prêtes à publier (texte déjà généré par Gemini en amont).
export interface PublishInput {
  caption: string;       // texte du post (généré par l'IA)
  imageUrl?: string;     // URL publique d'une image (optionnel)
  link?: string;         // lien vers l'annonce
}

export interface PublishResult {
  platform: SocialPlatform;
  ok: boolean;
  postUrl?: string;      // URL du post publié (si dispo)
  externalId?: string;   // id du post côté réseau
  error?: string;        // message d'erreur si échec
  skipped?: boolean;     // true = réseau non configuré (pas une erreur)
}

export interface Publisher {
  platform: SocialPlatform;
  // true si les variables d'environnement nécessaires sont présentes.
  isConfigured(): boolean;
  publish(input: PublishInput): Promise<PublishResult>;
}
