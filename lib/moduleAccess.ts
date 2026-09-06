// Qui a le droit d'ouvrir un module, tant qu'il n'est pas public.
//
// ── Pourquoi une porte, et pas un demi-deploiement ──────────────────────
// Un module se termine en conditions reelles : mêmes données, même base,
// même téléphone. Le mettre « en ligne mais fermé » vaut mieux que de le
// garder en local, où rien ne ressemble à la production.
//
// ── La règle ────────────────────────────────────────────────────────────
// Fermé  → seuls les comptes propriétaires (lib/owners.ts) entrent.
// Ouvert → tout le monde.
//
// L'état se change par une variable d'environnement, sans toucher au code
// ni relire une ligne : `CARRIERE_PUBLIC=on` ouvre Ma Carrière au public.

import { isOwner } from "@/lib/owners";

export type Module = "carriere" | "pro";

/**
 * Défauts délibérément différents.
 *
 * `carriere` est fermé : le module vient d'être écrit, personne d'autre que
 * le propriétaire n'y a de document réel.
 *
 * `pro` est OUVERT, et le refermer serait une faute : au 06/09/2026, six
 * comptes qui ne sont pas ceux du propriétaire y ont déjà des clients et des
 * factures. Fermer l'Espace Pro leur retirerait l'accès à leurs propres
 * pièces comptables — pas à une nouveauté, à leur comptabilité. Il reste donc
 * ouvert sauf demande explicite via `PRO_PUBLIC=off`.
 */
const DEFAUTS: Record<Module, boolean> = {
  carriere: false,
  pro: true,
};

const VARIABLES: Record<Module, string> = {
  carriere: "CARRIERE_PUBLIC",
  pro: "PRO_PUBLIC",
};

/** Le module est-il ouvert à tous ? */
export function moduleOuvert(m: Module): boolean {
  const brut = (process.env[VARIABLES[m]] || "").trim().toLowerCase();
  if (brut === "on" || brut === "true" || brut === "1") return true;
  if (brut === "off" || brut === "false" || brut === "0") return false;
  return DEFAUTS[m];
}

/**
 * Cet e-mail peut-il entrer ?
 *
 * L'e-mail vient TOUJOURS de la session vérifiée par Supabase (voir
 * `proContext`), jamais d'une valeur envoyée par le navigateur — sinon la
 * porte s'ouvrirait avec une ligne dans la console.
 */
export function peutAcceder(m: Module, email?: string): boolean {
  return moduleOuvert(m) || isOwner(email);
}

/** Message affiché à quelqu'un qui frappe à une porte encore fermée. */
export function messageFerme(m: Module): string {
  return m === "carriere"
    ? "Ma Carrière est en cours de finition. Le module ouvrira bientôt à tous."
    : "Ce module est momentanément réservé.";
}
