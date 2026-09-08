// Ma Carriere — socle des routes /api/carriere/*.
//
// L'authentification et le client d'administration sont ceux de l'Espace Pro
// (lib/proServer.ts) : meme mecanique, meme garantie — la session du
// navigateur decide QUI, la clef service_role ecrit, et chaque requete filtre
// explicitement sur user_id. Rien a dupliquer ici.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getProSubscription } from "@/lib/proBilling";
import { isOwner } from "@/lib/owners";
import { txt } from "@/lib/proServer";
import {
  CAREER_KINDS,
  PLAFOND_REDACTIONS,
  QUOTA_DOCUMENTS_GRATUIT,
  QUOTA_DOCUMENTS_PRO,
  isAccent,
  isPoliceId,
  newId,
  type CareerContent,
  type CareerKind,
  type CVContent,
  type DemandeContent,
  type LettreContent,
} from "@/lib/carriere";

export function isCareerKind(v: unknown): v is CareerKind {
  return CAREER_KINDS.includes(v as CareerKind);
}

/* ============================== Le quota ============================== */

export type EtatQuotaCarriere = {
  abonne: boolean;
  /** Documents crees depuis le 1er du mois. */
  utilises: number;
  /** Documents inclus ce mois-ci : 1 sans abonnement, 5 avec. */
  quota: number;
  /** false quand le quota de documents du mois est epuise. */
  autorise: boolean;
  /** Redactions assistees consommees — sert au garde-fou, pas au peage. */
  redactions: number;
};

/** Premier jour du mois courant, en ISO — borne du compteur. */
function debutDuMois(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

/**
 * Les comptes proprietaires — la MEME liste que pour les annonces
 * (lib/owners.ts), et non une regle propre a ce module.
 *
 * Ils n'ont pas de quota et tous les gabarits leur sont ouverts. Sans cette
 * exception, celui qui vend le produit ne peut pas l'essayer : au bout de
 * trois redactions, son propre site lui reclamait de l'argent, et le modele
 * « Pro » lui etait refuse sur sa propre plateforme.
 *
 * La comparaison porte sur l'e-mail de la SESSION, verifie par Supabase —
 * jamais sur une valeur envoyee par le navigateur.
 */
export function estProprietaire(email?: string): boolean {
  return isOwner(email);
}

/**
 * Ou en est l'utilisateur de son quota mensuel de generations ?
 *
 * L'abonnement lu est celui de l'Espace Pro : il n'y a qu'un abonnement
 * Wanteermako Pro, et il ouvre les deux modules. En creer un second aurait
 * oblige un professionnel deja abonne a payer deux fois pour la meme chose.
 *
 * Tolerant a l'absence de la table : tant que MIGRATION_MA_CARRIERE.sql n'a
 * pas tourne, personne n'a consomme quoi que ce soit — on repond zero plutot
 * que de fermer un module qui, par ailleurs, fonctionne.
 */
export async function etatQuota(
  sb: SupabaseClient,
  userId: string,
  email?: string,
): Promise<EtatQuotaCarriere> {
  const depuis = debutDuMois();

  /** Compte les lignes d'une table pour ce compte, depuis le 1er du mois. */
  const compter = async (table: string, colonne: string): Promise<number> => {
    try {
      const { count, error } = await sb
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte(colonne, depuis);
      return error ? 0 : count || 0;
    } catch {
      // Table absente (migration non passee) ou illisible : on ne ferme pas
      // la porte sur un compteur.
      return 0;
    }
  };

  const [documents, redactions] = await Promise.all([
    compter("career_documents", "created_at"),
    compter("career_usage", "created_at"),
  ]);

  // Le proprietaire du site n'a pas de quota : il doit pouvoir essayer et
  // montrer son propre produit sans se heurter a son propre peage.
  if (estProprietaire(email)) {
    return { abonne: true, utilises: documents, quota: QUOTA_DOCUMENTS_PRO, autorise: true, redactions };
  }

  const abo = await getProSubscription(sb, userId);
  const quota = abo.actif ? QUOTA_DOCUMENTS_PRO : QUOTA_DOCUMENTS_GRATUIT;

  return {
    abonne: abo.actif,
    utilises: documents,
    quota,
    autorise: documents < quota,
    redactions,
  };
}

/**
 * Le garde-fou de redaction est-il atteint ?
 *
 * Distinct du peage : celui-ci porte sur les documents. Ce plafond-la ne sert
 * qu'a arreter un script, il est hors d'atteinte d'un usage humain.
 */
export function plafondRedactionAtteint(etat: EtatQuotaCarriere, email?: string): boolean {
  if (estProprietaire(email)) return false;
  return etat.redactions >= PLAFOND_REDACTIONS;
}

/**
 * Enregistre un passage de generation.
 *
 * Appele APRES que l'IA a repondu : facturer un passage dont le texte n'est
 * jamais arrive priverait l'utilisateur d'un essai pour une panne qui n'est
 * pas la sienne. Silencieux — un echec d'ecriture du journal ne doit pas
 * annuler un document deja produit.
 */
export async function consommerPassage(
  sb: SupabaseClient,
  userId: string,
  kind: CareerKind,
): Promise<void> {
  try {
    await sb.from("career_usage").insert({ user_id: userId, kind });
  } catch {
    /* compteur secondaire — jamais bloquant */
  }
}

/* =========================== Le nettoyage =========================== */

const MAX_EXPERIENCES = 12;
const MAX_FORMATIONS = 10;
const MAX_CERTIFICATIONS = 10;
const MAX_PUCES = 8;
const MAX_LISTE = 20;

const str = (v: unknown, max = 160) => txt(v, max);

const liste = (v: unknown, n: number, max = 120): string[] =>
  Array.isArray(v) ? v.map((x) => str(x, max)).filter(Boolean).slice(0, n) : [];

/**
 * URL de photo acceptee, ou chaine vide.
 *
 * Seules `https:` et les URL relatives passent. Sans ce filtre, un appel
 * direct a l'API pourrait glisser un `javascript:` ou un `data:` dans un
 * document, qui finirait dans un attribut `src` a l'affichage.
 */
function urlPhoto(v: unknown): string {
  const s = str(v, 400);
  return /^https:\/\//i.test(s) || s.startsWith("/") ? s : "";
}

function nettoyerCV(raw: any): CVContent {
  const p = raw?.personalInfo || {};
  return {
    personalInfo: {
      firstName: str(p.firstName, 60),
      lastName: str(p.lastName, 60),
      title: str(p.title, 100),
      email: str(p.email, 120),
      phone: str(p.phone, 40),
      location: str(p.location, 80),
      linkedin: str(p.linkedin, 160),
      photoUrl: urlPhoto(p.photoUrl),
    },
    // Hors palette, on retombe sur la couleur du gabarit plutot que d'ecrire
    // une valeur arbitraire qui partirait telle quelle dans un attribut style.
    accent: isAccent(raw?.accent) ? raw.accent : "",
    // Hors liste, on repart sur la police par defaut : la valeur part dans un
    // attribut style de la feuille, elle ne peut pas etre libre.
    police: isPoliceId(raw?.police) ? raw.police : "",
    summary: str(raw?.summary, 800),
    experiences: (Array.isArray(raw?.experiences) ? raw.experiences : [])
      .slice(0, MAX_EXPERIENCES)
      .map((e: any) => ({
        id: str(e?.id, 40) || newId("exp"),
        title: str(e?.title, 100),
        company: str(e?.company, 100),
        location: str(e?.location, 80),
        startDate: str(e?.startDate, 30),
        endDate: str(e?.endDate, 30),
        isCurrent: !!e?.isCurrent,
        bullets: liste(e?.bullets, MAX_PUCES, 240),
      })),
    education: (Array.isArray(raw?.education) ? raw.education : [])
      .slice(0, MAX_FORMATIONS)
      .map((e: any) => ({
        id: str(e?.id, 40) || newId("edu"),
        degree: str(e?.degree, 120),
        school: str(e?.school, 120),
        location: str(e?.location, 80),
        startDate: str(e?.startDate, 30),
        endDate: str(e?.endDate, 30),
      })),
    certifications: (Array.isArray(raw?.certifications) ? raw.certifications : [])
      .slice(0, MAX_CERTIFICATIONS)
      .map((c: any) => ({
        id: str(c?.id, 40) || newId("cert"),
        name: str(c?.name, 140),
        issuer: str(c?.issuer, 120),
        year: str(c?.year, 20),
      })),
    skills: liste(raw?.skills, MAX_LISTE, 80),
    languages: (Array.isArray(raw?.languages) ? raw.languages : [])
      .slice(0, 8)
      .map((l: any) => ({
        id: str(l?.id, 40) || newId("lang"),
        name: str(l?.name, 60),
        // Hors de [1,5] on ramene a 3 : un niveau absurde dessinerait un
        // nombre de pastilles absurde dans le gabarit.
        level: (Math.min(5, Math.max(1, Math.round(Number(l?.level) || 3))) as 1 | 2 | 3 | 4 | 5),
      })),
    atouts: liste(raw?.atouts, 6, 60),
  };
}

function nettoyerExpediteur(raw: any) {
  return {
    name: str(raw?.name, 80),
    phone: str(raw?.phone, 40),
    email: str(raw?.email, 120),
    city: str(raw?.city, 80),
  };
}

function nettoyerLettre(raw: any): LettreContent {
  return {
    from: nettoyerExpediteur(raw?.from),
    company: str(raw?.company, 120),
    targetJob: str(raw?.targetJob, 100),
    recruiter: str(raw?.recruiter, 100),
    why: str(raw?.why, 800),
    body: str(raw?.body, 4000),
  };
}

/** Au-dela, ce ne sont plus des reponses mais un roman. */
const MAX_REPONSES = 12;

function nettoyerReponses(raw: any): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw).slice(0, MAX_REPONSES)) {
    const cle = String(k).replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
    const val = str(v, 600);
    if (cle && val) out[cle] = val;
  }
  return out;
}

function nettoyerDemande(raw: any): DemandeContent {
  // Compatibilite : les courriers crees avant la refonte portaient les champs
  // d'une candidature (company, domain, city...). On les reverse dans
  // `reponses` plutot que de les perdre — 28 documents existaient deja.
  const ancien = !raw?.demarcheId && (raw?.company || raw?.domain || raw?.note);
  const reponses = ancien
    ? nettoyerReponses({
        entreprise: raw?.company,
        domaine: raw?.domain,
        ville: raw?.city,
        disponibilite: raw?.availability,
        precisions: raw?.note,
      })
    : nettoyerReponses(raw?.reponses);

  return {
    from: nettoyerExpediteur(raw?.from),
    demarcheId: str(raw?.demarcheId, 40) || "emploi",
    to: str(raw?.to, 160) || str(raw?.company, 160),
    objet: str(raw?.objet, 200),
    reponses,
    body: str(raw?.body, 4000),
  };
}

/**
 * Ramene un contenu recu du navigateur a la forme attendue.
 *
 * Rien n'est conserve tel quel : chaque champ est retaille, les listes sont
 * plafonnees et tout ce qui n'est pas prevu disparait. Le contenu part dans
 * une colonne jsonb — sans ce filtre, le navigateur deciderait de ce que la
 * base stocke, et un document de plusieurs megaoctets suffirait a alourdir
 * tout l'ecran « Mes documents ».
 */
export function nettoyerContenu(kind: CareerKind, raw: unknown): CareerContent {
  if (kind === "cv") return nettoyerCV(raw);
  if (kind === "lettre") return nettoyerLettre(raw);
  return nettoyerDemande(raw);
}
