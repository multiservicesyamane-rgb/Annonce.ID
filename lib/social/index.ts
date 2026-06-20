import type { Publisher, PublishInput, PublishResult, SocialPlatform } from "./types";
import { telegramPublisher } from "./telegram";
import { facebookPublisher } from "./facebook";

export type { PublishInput, PublishResult, SocialPlatform } from "./types";

// Registre des réseaux disponibles. Pour ajouter Instagram/WhatsApp :
// créer lib/social/<reseau>.ts puis l'ajouter ici.
export const PUBLISHERS: Publisher[] = [telegramPublisher, facebookPublisher];

// Réseaux réellement configurés (variables d'env présentes).
export function configuredPlatforms(): SocialPlatform[] {
  return PUBLISHERS.filter((p) => p.isConfigured()).map((p) => p.platform);
}

// Publie sur tous les réseaux configurés (ou la liste `only` si fournie).
export async function publishToAll(
  input: PublishInput,
  only?: SocialPlatform[],
): Promise<PublishResult[]> {
  const targets = PUBLISHERS.filter((p) => {
    if (only && only.length && !only.includes(p.platform)) return false;
    return p.isConfigured();
  });

  if (!targets.length) return [];

  // En parallèle — un échec sur un réseau n'empêche pas les autres.
  return Promise.all(targets.map((p) => p.publish(input)));
}
