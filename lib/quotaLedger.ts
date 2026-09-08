// Le registre des creations — ce qui a ete PRIS, et non ce qui RESTE.
//
// ── Pourquoi ce module existe ────────────────────────────────────────────
// Les deux quotas (Ma Carriere, Espace Pro) se comptaient en denombrant les
// lignes presentes en base. Un quota compte alors ce qui reste, pas ce qui a
// ete consomme : supprimer sa facture du mois rendait l'unite, et
// « creer / telecharger / supprimer / recreer » tournait indefiniment.
//
// Le registre porte une ligne par creation et n'est jamais efface. Il survit
// a la suppression de la piece — c'est tout son interet.
//
// ── Tolerant a l'absence de la table ─────────────────────────────────────
// Tant que MIGRATION_VERROU_GRATUIT.sql n'a pas tourne, `compter` renvoie
// null et l'appelant retombe sur l'ancien denombrement. Le module continue de
// fonctionner avec l'ancienne regle plutot que de fermer la porte a tout le
// monde sur une table manquante — c'est la meme prudence que partout ailleurs
// dans ce projet.

import type { SupabaseClient } from "@supabase/supabase-js";

export type QuotaModule = "carriere" | "pro";

/** Premier jour du mois courant, en ISO — la borne de tous les compteurs. */
export function debutDuMoisUTC(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

/**
 * Combien de creations ce mois-ci ?
 *
 * `null` quand le registre n'est pas lisible (migration pas passee, table
 * illisible) : c'est un signal pour l'appelant, pas un zero. Repondre zero
 * ferait croire a un quota intact et offrirait le mois une seconde fois.
 */
export async function compter(
  sb: SupabaseClient,
  userId: string,
  module: QuotaModule,
): Promise<number | null> {
  try {
    const { count, error } = await sb
      .from("quota_ledger")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("module", module)
      .gte("created_at", debutDuMoisUTC());
    if (error) return null;
    return count || 0;
  } catch {
    return null;
  }
}

/**
 * Inscrit une creation au registre.
 *
 * Silencieux : un registre indisponible ne doit pas annuler un document que
 * l'utilisateur vient de creer. Le risque assume est d'offrir une unite de
 * plus, jamais de perdre le travail de quelqu'un.
 */
export async function inscrire(
  sb: SupabaseClient,
  userId: string,
  module: QuotaModule,
  kind: string,
  ref: string,
): Promise<void> {
  try {
    await sb.from("quota_ledger").insert({ user_id: userId, module, kind, ref });
  } catch {
    /* registre indisponible — jamais bloquant */
  }
}
