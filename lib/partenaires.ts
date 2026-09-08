// Le programme partenaire — les plans, et ce qu'ils ouvrent reellement.
//
// ── Pourquoi ce fichier existe ───────────────────────────────────────────
// La page /partenaires annonce deux abonnements et promet des revenus. Sans
// contrepartie technique, un partenaire qui paie 10 000 F butait sur le
// SIXIEME document du mois : Ma Carriere en donne cinq avec l'abonnement Pro.
// Cinq CV a 3 000 F font 15 000 F de chiffre d'affaires — moins que ce qu'il
// aurait fallu pour tenir la promesse, et a peine plus que son abonnement.
//
// Le statut « actif » doit donc ouvrir un vrai volume, sinon valider une
// candidature ne veut rien dire.

import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanPartenaire = "starter" | "agence";

/** Combien de documents par mois, reglable sans redeploiement. */
function volume(cle: string, defaut: number): number {
  const n = Number(process.env[cle]);
  return Number.isFinite(n) && n > 0 ? n : defaut;
}

export const PLANS_PARTENAIRE: Record<
  PlanPartenaire,
  { cle: PlanPartenaire; nom: string; prixMensuel: number; prixAnnuel: number; documents: number }
> = {
  starter: {
    cle: "starter",
    nom: "Starter",
    prixMensuel: 10000,
    prixAnnuel: 80000,
    // Trente documents : a 3 000 F revendus, 90 000 F de chiffre d'affaires
    // possible pour 10 000 F d'abonnement. La marge existe VRAIMENT, ce qui
    // n'etait pas le cas avec le quota Pro de cinq.
    documents: volume("PARTENAIRE_DOCS_STARTER", 30),
  },
  agence: {
    cle: "agence",
    nom: "Agence Pro",
    prixMensuel: 25000,
    prixAnnuel: 200000,
    documents: volume("PARTENAIRE_DOCS_AGENCE", 100),
  },
};

export function estPlanPartenaire(v: unknown): v is PlanPartenaire {
  return v === "starter" || v === "agence";
}

export type EtatPartenaire = {
  /** Inscrit au programme, quel que soit son statut. */
  inscrit: boolean;
  statut: "candidat" | "actif" | "suspendu" | null;
  plan: PlanPartenaire | null;
  expire_at: string | null;
  /**
   * Abonnement en cours : statut « actif » ET echeance non depassee.
   *
   * Les deux conditions comptent. L'encaissement se fait a la main, par Wave
   * ou en especes : sans echeance, « actif » vaudrait a vie et il faudrait
   * compter sur la memoire de l'administrateur pour couper. Un abonnement que
   * personne ne pense a arreter n'est pas un abonnement, c'est un cadeau.
   */
  actif: boolean;
  /** Documents par mois ouverts par le plan. 0 si l'abonnement ne court pas. */
  documents: number;
};

const ABSENT: EtatPartenaire = {
  inscrit: false, statut: null, plan: null, expire_at: null, actif: false, documents: 0,
};

/**
 * Ou en est ce compte vis-a-vis du programme partenaire ?
 *
 * Tolerant a l'absence de la table : tant que MIGRATION_PARTENAIRES.sql n'a
 * pas tourne, personne n'est partenaire — on repond « absent » plutot que de
 * faire tomber Ma Carriere, qui appelle cette fonction a chaque quota.
 */
export async function etatPartenaire(
  sb: SupabaseClient,
  userId: string,
): Promise<EtatPartenaire> {
  try {
    const { data, error } = await sb
      .from("partenaires")
      .select("statut, plan, expire_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return ABSENT;

    const plan = estPlanPartenaire(data.plan) ? data.plan : null;
    const expire = data.expire_at ? new Date(data.expire_at).getTime() : 0;
    const actif = data.statut === "actif" && expire > Date.now();

    return {
      inscrit: true,
      statut: (data.statut as EtatPartenaire["statut"]) || "candidat",
      plan,
      expire_at: data.expire_at || null,
      actif,
      documents: actif && plan ? PLANS_PARTENAIRE[plan].documents : 0,
    };
  } catch {
    return ABSENT;
  }
}
