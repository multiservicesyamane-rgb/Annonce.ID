// Abonnement de l'Espace Pro : les plans, le quota gratuit, et la lecture de
// l'etat d'un professionnel.
//
// Le paiement lui-meme n'est PAS ici : il se passe sur Chariow. Ce module ne
// fait que constater un abonnement actif et compter les pieces du mois.

import type { SupabaseClient } from "@supabase/supabase-js";

export type ProPlanKey = "mensuel" | "annuel";

export type ProPlan = {
  key: ProPlanKey;
  name: string;
  price: number;
  /** Duree d'activation, en jours. */
  days: number;
  /** Argument de vente affiche sous le prix. */
  note: string;
};

export const PRO_PLANS: Record<ProPlanKey, ProPlan> = {
  mensuel: {
    key: "mensuel",
    name: "Pro mensuel",
    price: 3900,
    days: 30,
    note: "Sans engagement, resiliable a tout moment",
  },
  annuel: {
    key: "annuel",
    name: "Pro annuel",
    price: 39000,
    days: 365,
    // 3 900 x 12 = 46 800. A 39 000, deux mois ne sont pas payes.
    note: "2 mois offerts par rapport au mensuel",
  },
};

/**
 * Nombre de factures qu'un compte gratuit peut creer par mois.
 *
 * Une seule : de quoi faire le tour du produit en conditions reelles — creer
 * la facture, l'envoyer, la voir acceptee — sans pouvoir s'en servir comme
 * outil de travail. Le quota porte sur les FACTURES et jamais sur les devis :
 * un devis ne rapporte rien tant qu'il n'est pas accepte, et fermer la porte
 * d'entree ferait fuir avant meme l'essai.
 *
 * PRO_QUOTA_FACTURES releve ce plafond sans toucher au code — il faut tout de
 * meme un redeploiement pour que l'hebergeur relise la variable. Le peage
 * arrive apres une promesse publique de gratuite faite par email : pouvoir le
 * desserrer en changeant une valeur, le temps que les professionnels
 * s'installent, vaut mieux que de livrer un correctif dans l'urgence.
 */
export const QUOTA_GRATUIT_FACTURES = (() => {
  const n = Number(process.env.PRO_QUOTA_FACTURES);
  return Number.isFinite(n) && n > 0 ? n : 1;
})();

export function formatFcfaPlan(n: number): string {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export type ProSubscription = {
  actif: boolean;
  plan: ProPlanKey | null;
  expires_at: string | null;
  /** Jours restants, arrondi au superieur. null si pas d'abonnement. */
  jours_restants: number | null;
};

const SANS_ABONNEMENT: ProSubscription = {
  actif: false,
  plan: null,
  expires_at: null,
  jours_restants: null,
};

/**
 * Etat de l'abonnement d'un professionnel.
 *
 * Tolerant a l'absence de table : tant que MIGRATION_ABONNEMENT_PRO.sql n'a
 * pas ete passe, tout le monde est considere « gratuit » plutot que de voir
 * l'Espace Pro tomber en erreur.
 */
export async function getProSubscription(
  sb: SupabaseClient,
  userId: string,
): Promise<ProSubscription> {
  try {
    const { data, error } = await sb
      .from("pro_subscriptions")
      .select("plan, expires_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return SANS_ABONNEMENT;

    const fin = new Date(data.expires_at).getTime();
    const restant = fin - Date.now();
    return {
      actif: restant > 0,
      plan: (data.plan as ProPlanKey) || null,
      expires_at: data.expires_at,
      jours_restants: restant > 0 ? Math.ceil(restant / 86400000) : 0,
    };
  } catch {
    return SANS_ABONNEMENT;
  }
}

/** Premier jour du mois courant, en ISO — borne du compteur de quota. */
export function debutDuMois(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export type EtatQuota = {
  abonne: boolean;
  utilisees: number;
  quota: number;
  /** false quand le compte gratuit a epuise son quota du mois. */
  peutCreer: boolean;
};

/**
 * Peut-on creer une facture de plus ce mois-ci ?
 *
 * A appeler cote SERVEUR uniquement, avant toute creation. Un controle pose
 * dans l'interface ne protege rien : il suffit d'appeler la route a la main
 * pour le contourner.
 */
export async function getEtatQuota(
  sb: SupabaseClient,
  userId: string,
): Promise<EtatQuota> {
  const abo = await getProSubscription(sb, userId);
  if (abo.actif) {
    return { abonne: true, utilisees: 0, quota: Infinity, peutCreer: true };
  }

  const { count, error } = await sb
    .from("pro_invoices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", debutDuMois());

  // En cas d'erreur de lecture on laisse passer : un compteur casse ne doit
  // jamais empecher un professionnel de facturer son client.
  const utilisees = error ? 0 : count || 0;
  return {
    abonne: false,
    utilisees,
    quota: QUOTA_GRATUIT_FACTURES,
    peutCreer: utilisees < QUOTA_GRATUIT_FACTURES,
  };
}

/** Le message montre au professionnel quand le quota est atteint. */
export function messageQuotaAtteint(): string {
  return (
    `Vous avez utilise votre facture gratuite du mois. ` +
    `Passez au Pro pour en creer autant que vous voulez : ` +
    `${formatFcfaPlan(PRO_PLANS.mensuel.price)} par mois, ou ` +
    `${formatFcfaPlan(PRO_PLANS.annuel.price)} par an.`
  );
}
