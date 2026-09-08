// Abonnement de l'Espace Pro : les plans, le quota gratuit, et la lecture de
// l'etat d'un professionnel.
//
// Le paiement lui-meme n'est PAS ici : il se passe sur Chariow. Ce module ne
// fait que constater un abonnement actif et compter les pieces du mois.

import type { SupabaseClient } from "@supabase/supabase-js";
import { isOwner } from "@/lib/owners";
import { compter as compterLedger } from "@/lib/quotaLedger";

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
  /**
   * Une facture deja remise au client se corrige-t-elle ?
   *
   * Faux sans abonnement. Le plan gratuit donne UNE facture finie par mois,
   * pas un modele qu'on reecrit pour chaque client — sans ce second verrou, le
   * quota mensuel ne coutait rien a contourner.
   */
  peutModifier: boolean;
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
  email?: string,
): Promise<EtatQuota> {
  // Les comptes proprietaires facturent sans limite, comme ils publient sans
  // limite (lib/owners.ts). Meme regle pour les annonces, l'Espace Pro et Ma
  // Carriere : une seule liste a tenir a jour.
  if (isOwner(email)) {
    return { abonne: true, utilisees: 0, quota: Infinity, peutCreer: true, peutModifier: true };
  }

  const abo = await getProSubscription(sb, userId);
  if (abo.actif) {
    return { abonne: true, utilisees: 0, quota: Infinity, peutCreer: true, peutModifier: true };
  }

  // Le compteur qui fait foi est le REGISTRE des creations : il survit a la
  // suppression de la facture. Denombrer les factures presentes comptait ce
  // qui reste et non ce qui a ete pris — creer, telecharger, supprimer,
  // recreer remettait le quota a zero a chaque tour.
  const inscrites = await compterLedger(sb, userId, "pro");

  let utilisees = inscrites ?? 0;
  if (inscrites === null) {
    // MIGRATION_VERROU_GRATUIT.sql pas encore passe : on retombe sur l'ancien
    // denombrement. Moins etanche, mais le professionnel continue de
    // facturer — un compteur casse ne doit jamais l'en empecher.
    const { count, error } = await sb
      .from("pro_invoices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", debutDuMois());
    utilisees = error ? 0 : count || 0;
  }

  return {
    abonne: false,
    utilisees,
    quota: QUOTA_GRATUIT_FACTURES,
    peutCreer: utilisees < QUOTA_GRATUIT_FACTURES,
    peutModifier: false,
  };
}

/**
 * Cette facture est-elle fermee a la correction ?
 *
 * Deux facons d'etre « remise au client », et l'une ne suffit pas :
 *   - `finalise_at` : envoyee, lien copie, ou PDF telecharge ;
 *   - un statut autre que « brouillon », pour les factures anterieures a la
 *     migration, qui n'ont pas d'horodatage mais ont bien quitte le bureau.
 *
 * Une facture restee brouillon se corrige librement, meme sans abonnement :
 * on ne fige pas ce que le client n'a jamais vu.
 */
export function factureVerrouillee(
  facture: { finalise_at?: string | null; status?: string | null },
  etat: EtatQuota,
): boolean {
  if (etat.peutModifier) return false;
  return !!facture.finalise_at || (facture.status || "draft") !== "draft";
}

/** Le message montre quand la correction est refusee. */
export function messageVerrouFacture(): string {
  return (
    "Cette facture a deja ete remise a votre client : le plan gratuit ne " +
    "permet plus de la corriger. Passez au Pro pour reprendre vos factures " +
    `autant de fois que necessaire — ${formatFcfaPlan(PRO_PLANS.mensuel.price)} par mois. ` +
    "Elle reste telechargeable sans rien payer."
  );
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
