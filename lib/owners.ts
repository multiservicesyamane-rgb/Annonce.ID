// Comptes PROPRIÉTAIRES Wanteermako (les tiens).
// Ces comptes publient gratuitement, sans limite, et leurs annonces passent
// automatiquement en Premium + À la Une (visibles sur l'accueil).
//
// ⚠️ Remplace/complète par tes 4 vrais emails ci-dessous.
export const OWNER_EMAILS = [
  "multiservicesyamane@gmail.com",
  "ibrahimadiop363@gmail.com",
  "wanteermako@gmail.com",
  "analysteprogrammeur1374@gmail.com",
  // Ajoutés le 06/09/2026 : ils manquaient à la liste, alors qu'ils font
  // partie des comptes du propriétaire. Cette liste ne sert plus seulement
  // aux annonces gratuites — elle ouvre aussi Ma Carrière et lève le quota de
  // l'Espace Pro. Un oubli ici ferme une porte, il ne se voit pas tout seul.
  "khalilpro1374@gmail.com",
  "admin@yamanetech.com",
];

export function isOwner(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  if (e.includes("multiservicesyamane")) return true;
  return OWNER_EMAILS.some((o) => o.toLowerCase().trim() === e);
}
