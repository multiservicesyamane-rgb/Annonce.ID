// Comptes PROPRIÉTAIRES Wanteermako (les tiens).
// Ces comptes publient gratuitement, sans limite, et leurs annonces passent
// automatiquement en Premium + À la Une (visibles sur l'accueil).
//
// ⚠️ Remplace/complète par tes 4 vrais emails ci-dessous.
export const OWNER_EMAILS = [
  "multiservicesyamane@gmail.com",
  // "compte2@gmail.com",
  // "compte3@gmail.com",
  // "compte4@gmail.com",
];

export function isOwner(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  if (e.includes("multiservicesyamane")) return true;
  return OWNER_EMAILS.some((o) => o.toLowerCase().trim() === e);
}
