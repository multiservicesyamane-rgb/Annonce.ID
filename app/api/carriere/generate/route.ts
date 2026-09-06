import { NextResponse } from "next/server";
import { redigerIA } from "@/lib/ia";
import { proContext, txt } from "@/lib/proServer";
import { messageFerme, peutAcceder } from "@/lib/moduleAccess";
import { consommerPassage, etatQuota } from "@/lib/carriereServer";
import { consigneAccord, ligneDate, type Genre } from "@/lib/carriere";

export const dynamic = "force-dynamic";

/**
 * Ma Carriere — redaction assistee.
 *
 * ── Un appel = un passage ────────────────────────────────────────────────
 * La requete peut demander PLUSIEURS textes a la fois (`targets`), et ne
 * consomme qu'une unite de quota. C'est ce qui rend l'assistant honnete : il
 * annonce « J'ai prepare 2 documents pour toi » et ne facture qu'un essai.
 * Facturer par document ferait consommer deux unites la ou l'ecran n'en
 * montre qu'une, et personne ne comprendrait son compteur.
 *
 * ── Le quota est verifie ici ─────────────────────────────────────────────
 * Et pas seulement dans l'ecran : l'ecran cache le bouton, l'API refuse
 * l'appel. Seule la seconde protection compte.
 */

const CIBLES = ["summary", "bullets", "lettre", "demande"] as const;
type Cible = (typeof CIBLES)[number];

/** Garde-fou : au-dela, un seul appel produirait un roman. */
const MAX_CIBLES = 3;

const SYSTEME = `Tu rediges des documents de candidature pour des chercheurs d'emploi au Senegal.

REGLES ABSOLUES :
- Ecris en FRANCAIS uniquement. Jamais de wolof, jamais d'anglais.
- N'INVENTE AUCUN FAIT : aucun diplome, aucune entreprise, aucune date, aucun
  chiffre qui ne t'a pas ete donne. Si une information manque, tourne la phrase
  sans elle. Un CV ou une lettre qui invente met le candidat en difficulte le
  jour de l'entretien.
- JAMAIS de point median ni de « (e) » : ecris « motive » ou « motivee », selon
  la consigne d'accord qui t'est donnee.
- Pas de formules creuses ni de superlatifs (« profil d'exception »,
  « passionne par les defis »). Du concret, sobre et credible.
- Reponds UNIQUEMENT avec le texte demande. Aucun preambule, aucun titre,
  aucun guillemet autour, aucun commentaire.`;

export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId, email } = ctx;

    if (!peutAcceder("carriere", email)) {
      // 403 et non 401 : la session est valide, c'est la porte qui est fermee.
      return NextResponse.json({ error: messageFerme("carriere"), ferme: true }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    const demandees: Cible[] = (Array.isArray(body?.targets) ? body.targets : [body?.target])
      .map((t: unknown) => txt(t, 20))
      .filter((t: string): t is Cible => CIBLES.includes(t as Cible))
      .slice(0, MAX_CIBLES);

    if (!demandees.length) {
      return NextResponse.json({ error: "Rien a rediger." }, { status: 400 });
    }

    const quota = await etatQuota(sb, userId, email);
    if (!quota.autorise) {
      // 402 et non 403 : l'acces n'est pas interdit, il est paye. L'ecran
      // s'en sert pour ouvrir la page d'abonnement plutot qu'un message
      // d'erreur.
      return NextResponse.json(
        {
          error: "Quota epuise",
          quota,
          message: `Tes ${quota.quota} redactions gratuites du mois sont utilisees.`,
        },
        { status: 402 },
      );
    }

    const genre: Genre = ["f", "m"].includes(txt(body?.genre, 2)) ? (txt(body?.genre, 2) as Genre) : "?";

    const textes: Record<string, string> = {};
    /** Quel moteur a reellement ecrit — renvoye pour le diagnostic. */
    let moteur: string | null = null;
    for (const cible of demandees) {
      const r = await redigerIA(consigne(cible, body, genre), SYSTEME);
      // Une cible sans reponse n'annule pas les autres : mieux vaut rendre la
      // lettre seule que de tout perdre parce que le resume a echoue.
      if (r) {
        textes[cible] = nettoyer(r.texte);
        moteur = r.par;
      }
    }

    if (!Object.keys(textes).length) {
      return NextResponse.json(
        { error: "La redaction n'a pas abouti. Reessaie dans un instant." },
        { status: 503 },
      );
    }

    // Le passage n'est compte qu'ici, une fois un texte reellement obtenu :
    // une panne de l'IA ne doit pas manger l'essai de l'utilisateur.
    await consommerPassage(sb, userId, body?.kind === "lettre" ? "lettre" : "cv");

    return NextResponse.json({ textes, moteur, quota: await etatQuota(sb, userId, email) });
  } catch (e: any) {
    console.error("[carriere/generate]", e?.message || e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/** Retire les guillemets et les entetes que le modele ajoute malgre tout. */
function nettoyer(t: string): string {
  return t
    .trim()
    .replace(/^["«»']+|["«»']+$/g, "")
    .replace(/^(Objet|Reponse|Texte)\s*:\s*/i, "")
    .trim();
}

/* ============================ Les consignes ============================ */

function consigne(cible: Cible, b: any, genre: Genre): string {
  const accord = consigneAccord(genre);
  const poste = txt(b?.targetJob, 100) || "le poste vise";
  const ville = txt(b?.city, 80) || "Dakar";
  const entreprise = txt(b?.company, 120);

  if (cible === "summary") {
    const parcours = txt(b?.parcours, 600);
    return `Redige le PROFIL PROFESSIONNEL d'un CV : 2 a 3 phrases, a la premiere personne.
Poste vise : ${poste}.
Ville : ${ville}.
${parcours ? `Parcours declare par le candidat :\n${parcours}` : "Le candidat n'a pas encore decrit son parcours : reste general, ne suppose ni diplome ni annees d'experience."}
${accord}
Longueur : 400 signes maximum.`;
  }

  if (cible === "bullets") {
    const intitule = txt(b?.jobTitle, 100) || poste;
    const employeur = txt(b?.employer, 120);
    const brut = txt(b?.missions, 600);
    return `Redige les MISSIONS d'une experience professionnelle sur un CV.
Poste occupe : ${intitule}${employeur ? ` chez ${employeur}` : ""}.
${brut ? `Ce que le candidat en dit :\n${brut}` : "Le candidat n'a rien precise : propose 3 missions courantes et sobres pour ce poste, sans chiffre invente."}
Rends EXACTEMENT 3 a 4 lignes, une mission par ligne, commencant par un tiret.
Chaque ligne commence par un verbe a l'infinitif ou un nom d'action. Pas de pourcentage ni de montant qui ne soit pas donne ci-dessus.`;
  }

  if (cible === "lettre") {
    const pourquoi = txt(b?.why, 800);
    const recruteur = txt(b?.recruiter, 100) || "Madame, Monsieur";
    return `Redige le CORPS d'une lettre de motivation.
Destinataire : ${recruteur}.
Entreprise : ${entreprise || "l'entreprise"}.
Poste vise : ${poste}.
Ville : ${ville}.
${pourquoi ? `Motivation exprimee par le candidat :\n${pourquoi}` : "Le candidat n'a pas detaille sa motivation : reste sur son interet pour le poste et l'entreprise, sans inventer d'experience."}
${accord}

Structure : 3 paragraphes courts — l'interet pour le poste, ce que le candidat apporte, la disponibilite et la demande d'entretien.
Commence directement par l'appel (« ${recruteur}, »). Termine par une formule de politesse complete.
N'ecris NI la date, NI l'adresse, NI l'objet, NI la signature : ils sont ajoutes automatiquement.
Longueur : 1 200 signes maximum.`;
  }

  // demande — courrier de demarche, pilote par la fiche
  const nomDemarche = txt(b?.demarche, 120) || "une demarche administrative";
  const destinataire = txt(b?.destinataire, 160) || "Madame, Monsieur";
  const objetCourrier = txt(b?.objet, 200);
  const contexte = txt(b?.contexte, 1500);

  return `Redige le CORPS d'un courrier administratif.

Demarche : ${nomDemarche}.
Destinataire : ${destinataire}.
${objetCourrier ? `Objet : ${objetCourrier}.` : ""}
Ville de l'expediteur : ${ville}.

Ce que la personne a declare :
${contexte || "Elle n'a rien precise : reste general, et n'invente aucun fait."}
${accord}

Structure : 3 paragraphes courts — l'objet de la demande, les elements utiles
declares ci-dessus, la demande precise et la disponibilite.
Commence par l'appel qui convient au destinataire (« Monsieur le Commissaire, »,
« Monsieur le Maire, », « Madame, Monsieur, »…). Termine par une formule de
politesse administrative complete.
N'ecris NI la date (« ${ligneDate(ville)} » est ajoutee automatiquement), NI
l'adresse, NI l'objet, NI la signature.
N'affirme aucun fait qui ne figure pas ci-dessus : ni date, ni numero, ni montant.
Longueur : 1 200 signes maximum.`;
}
