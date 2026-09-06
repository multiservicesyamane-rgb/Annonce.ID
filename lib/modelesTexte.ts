// Les textes de secours, ecrits sans IA.
//
// ── Pourquoi ils existent ────────────────────────────────────────────────
// Les deux moteurs de redaction sont payants des qu'on depasse le palier
// gratuit. Un module dont la fonction principale s'arrete le jour ou un
// compte tombe a zero n'est pas un produit : c'est une demonstration.
//
// Ces modeles produisent un vrai courrier, complet et envoyable, a partir
// des seules reponses de l'utilisateur. Ils ne remplacent pas l'IA — le texte
// est plus attendu, moins personnel — mais ils garantissent que PERSONNE ne
// repart les mains vides.
//
// ── Ce qu'ils n'inventent jamais ─────────────────────────────────────────
// Aucune phrase ne suppose un diplome, une experience, une date ou un
// montant. Tout ce qui est ecrit vient de ce que l'utilisateur a saisi.

import { ligneDate, type Expediteur } from "@/lib/carriere";
import type { Demarche } from "@/lib/demarches";

/* ============================== L'appel ============================== */

/**
 * Formule d'appel deduite du destinataire.
 *
 * « Monsieur le Commissaire, » sur une declaration de perte et « Madame,
 * Monsieur, » sur une candidature : se tromper d'appel se remarque des la
 * premiere ligne d'un courrier administratif.
 */
function appel(destinataire: string): string {
  const d = destinataire.toLowerCase();
  if (/commissaire|police|gendarm/.test(d)) return "Monsieur le Commissaire,";
  if (/procureur/.test(d)) return "Monsieur le Procureur de la Republique,";
  if (/maire|mairie/.test(d)) return "Monsieur le Maire,";
  if (/greffier|greffe|tribunal|president/.test(d)) return "Monsieur le Greffier en chef,";
  if (/directeur|direction/.test(d)) return "Monsieur le Directeur,";
  return "Madame, Monsieur,";
}

/* ============================ Le courrier ============================ */

/**
 * Corps d'un courrier de demarche, compose a partir des reponses.
 *
 * Trois paragraphes, comme la consigne donnee a l'IA : l'objet, les elements
 * declares, la demande et la disponibilite. Les reponses sont reprises
 * telles quelles, sous forme de liste — c'est moins elegant qu'une phrase
 * redigee, mais c'est exact, et un agent d'accueil lit une liste plus vite
 * qu'un paragraphe.
 */
export function corpsCourrier(
  demarche: Demarche,
  reponses: Record<string, string>,
  destinataire: string,
): string {
  const elements = demarche.questions
    .map((q) => (reponses[q.id] ? `- ${q.libelle.replace(/\s*\?$/, "")} : ${reponses[q.id]}` : ""))
    .filter(Boolean);

  const paragraphes = [
    appel(destinataire),
    `Par la presente, je sollicite votre bienveillance concernant la demarche suivante : ${demarche.nom.toLowerCase()}.`,
  ];

  if (elements.length) {
    paragraphes.push(`Voici les elements de ma situation :\n${elements.join("\n")}`);
  }

  paragraphes.push(
    "Je reste a votre disposition pour tout renseignement complementaire et pour fournir " +
      "toute piece justificative que vous jugeriez utile.",
    "Dans l'attente de votre reponse, je vous prie d'agreer, " +
      appel(destinataire).replace(/,$/, "") +
      ", l'expression de mes salutations distinguees.",
  );

  return paragraphes.join("\n\n");
}

/* ======================= La lettre de motivation ======================= */

export function corpsLettreMotivation(o: {
  entreprise: string;
  poste: string;
  recruteur: string;
  pourquoi: string;
  ville: string;
}): string {
  const cible = o.recruteur.trim() || "Madame, Monsieur";
  const poste = o.poste.trim() || "le poste propose";
  const entreprise = o.entreprise.trim() || "votre entreprise";

  const paragraphes = [
    `${cible},`,
    `Je me permets de vous adresser ma candidature pour ${poste} au sein de ${entreprise}.`,
  ];

  // La motivation de l'utilisateur passe telle quelle : c'est la seule partie
  // reellement personnelle du courrier, et la reformuler la ferait sonner faux.
  if (o.pourquoi.trim()) {
    paragraphes.push(o.pourquoi.trim());
  } else {
    paragraphes.push(
      `Le poste correspond a ce que je recherche, et je souhaite mettre mon serieux et ma ` +
        `capacite d'apprentissage au service de vos equipes.`,
    );
  }

  paragraphes.push(
    "Je suis disponible pour un entretien a la date qui vous conviendra, afin de vous " +
      "presenter mon parcours plus en detail.",
    `Dans l'attente de votre retour, je vous prie d'agreer, ${cible.replace(/,$/, "")}, ` +
      "l'expression de mes salutations distinguees.",
  );

  return paragraphes.join("\n\n");
}

/* ============================ Le profil de CV ============================ */

/**
 * Profil professionnel de secours.
 *
 * Volontairement court et sans adjectif ronflant : deux lignes exactes valent
 * mieux qu'un paragraphe qui promet ce que le candidat n'a pas dit.
 */
export function profilCV(o: { poste: string; ville: string; parcours: string }): string {
  if (o.parcours.trim()) return o.parcours.trim();

  const poste = o.poste.trim();
  const ville = o.ville.trim();

  const phrases = [
    poste ? `Candidat au poste de ${poste.toLowerCase()}.` : "Candidat motive et disponible.",
    "Serieux, ponctuel, et attentif au travail bien fait.",
  ];
  if (ville) phrases.push(`Disponible sur ${ville} et ses environs.`);

  return phrases.join(" ");
}

/** Missions de secours pour une experience — neutres, jamais chiffrees. */
export function missionsCV(poste: string): string {
  const p = poste.trim().toLowerCase();
  const generales = [
    "Realisation des taches confiees dans le respect des consignes.",
    "Collaboration avec l'equipe au quotidien.",
    "Respect des horaires et des regles de securite.",
  ];

  if (/vente|commercial|caisse|boutique|magasin/.test(p)) {
    return [
      "Accueil et conseil de la clientele.",
      "Encaissement et tenue de la caisse.",
      "Mise en rayon et suivi du stock.",
    ].join("\n");
  }
  if (/chauffeur|livr|transport/.test(p)) {
    return [
      "Conduite et entretien courant du vehicule.",
      "Livraison des commandes dans les delais convenus.",
      "Respect du code de la route et des consignes de securite.",
    ].join("\n");
  }
  if (/secretaire|assistant|administratif|bureau/.test(p)) {
    return [
      "Accueil physique et telephonique.",
      "Redaction et classement des courriers et documents.",
      "Suivi des dossiers et mise a jour des tableaux de bord.",
    ].join("\n");
  }
  if (/securite|gardien|vigile/.test(p)) {
    return [
      "Controle des acces et surveillance des locaux.",
      "Rondes regulieres et signalement des anomalies.",
      "Application des consignes de securite.",
    ].join("\n");
  }

  return generales.join("\n");
}

/** Un courrier de secours reste un courrier : il porte sa date. */
export function dateCourrier(ville: string): string {
  return ligneDate(ville);
}

export type { Expediteur };
