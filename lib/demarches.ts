// Ma Carriere — le catalogue des demarches.
//
// ── Pourquoi une table ecrite a la main ─────────────────────────────────
// L'assistant comprend une demande formulee librement, puis pose des
// questions. Il ne doit JAMAIS inventer ce qu'une administration exige :
// un modele de langue qui improvise une liste de pieces envoie quelqu'un
// au mauvais guichet avec le mauvais dossier. L'IA sert donc a deux choses
// et deux seulement : reconnaitre de quelle demarche on parle, et rediger
// les courriers. Tout le reste — pieces, institution, avertissements — sort
// de ce fichier, ecrit et verifiable.
//
// ── Ce que ce fichier ne contient pas ───────────────────────────────────
// Aucune adresse, aucun tarif, aucun delai. Ils varient selon la commune et
// changent sans preavis ; les figer ici reviendrait a publier des
// informations fausses six mois plus tard. On nomme l'INSTITUTION, ce qui
// reste vrai, et on invite a verifier sur place.

import type { CareerKind } from "@/lib/carriere";

/* ============================== Les types ============================== */

export type PublicCible = "particulier" | "etudiant" | "entrepreneur";

export type Question = {
  id: string;
  libelle: string;
  /** Choix ferme, ou saisie libre quand aucune liste n'a de sens. */
  type: "choix" | "texte";
  options?: string[];
  /** Aide affichee sous le champ. */
  aide?: string;
};

export type Piece = {
  nom: string;
  detail: string;
  /**
   * `site`    : Wanteermako redige ce document.
   * `fournir` : l'utilisateur doit se le procurer — le site ne le fabrique
   *             pas, et ne le fabriquera jamais (ce serait un faux).
   */
  source: "site" | "fournir";
  /** Ou l'obtenir. Une institution, jamais une adresse. */
  ou?: string;
  /** Quel editeur ouvrir, pour les pieces que le site redige. */
  editeur?: CareerKind;
};

export type Demarche = {
  id: string;
  nom: string;
  /** Phrase affichee sous le titre du recapitulatif. */
  resume: string;
  publics: PublicCible[];
  /** Mots reconnus dans une demande ecrite librement — routage de secours. */
  motsCles: string[];
  questions: Question[];
  pieces: Piece[];
  /**
   * Pieces qui dependent des reponses.
   *
   * Certaines demarches n'ont pas UNE liste mais plusieurs : un voyage en
   * Gambie et un voyage en France ne demandent pas les memes documents — le
   * premier releve de la libre circulation CEDEAO, le second d'un visa.
   * Quand cette fonction rend une liste, elle remplace `pieces`.
   */
  piecesSelon?: (reponses: Record<string, string>) => Piece[] | null;
  /** Mise en garde affichee en tete du recapitulatif, quand elle s'impose. */
  avertissement?: string;
  /** Mise en garde qui depend des reponses — ajoutee a la precedente. */
  avertissementSelon?: (reponses: Record<string, string>) => string | null;
};

/* ========================= Le regime de voyage ========================= */

/**
 * Etats membres de la CEDEAO.
 *
 * Un ressortissant senegalais y circule sans visa : c'est le protocole de
 * libre circulation, en vigueur depuis 1979. Servir a la Gambie la liste de
 * pieces d'un visa Schengen, comme le faisait la premiere version, envoyait
 * quelqu'un constituer un dossier dont il n'a pas besoin.
 */
const PAYS_CEDEAO = [
  "benin", "burkina", "cap-vert", "cape vert", "cabo verde", "cote d ivoire",
  "cote divoire", "ivoire", "gambie", "ghana", "guinee", "guinee bissau",
  "bissau", "liberia", "mali", "niger", "nigeria", "nigéria", "sierra leone",
  "togo", "senegal",
];

/**
 * Etats dont l'appartenance a la CEDEAO a change depuis 2024.
 *
 * On ne tranche pas a leur place : la libre circulation y a ete annoncee
 * maintenue apres les retraits, mais la situation bouge. Le module le dit
 * plutot que d'affirmer une regle qui pourrait ne plus tenir au moment ou
 * quelqu'un se presente a la frontiere.
 */
const CEDEAO_INCERTAIN = ["mali", "burkina", "niger"];

export type RegimeVoyage = "cedeao" | "visa";

/** Enleve accents, ponctuation et casse — « Côte d'Ivoire » = « cote d ivoire ». */
function normaliser(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function regimeVoyage(pays: string): RegimeVoyage {
  const p = normaliser(pays);
  if (!p) return "visa";
  return PAYS_CEDEAO.some((c) => p.includes(c)) ? "cedeao" : "visa";
}

export function cedeaoIncertain(pays: string): boolean {
  const p = normaliser(pays);
  return CEDEAO_INCERTAIN.some((c) => p.includes(c));
}

/** Pieces d'un deplacement dans l'espace CEDEAO — pas de visa. */
function piecesCedeao(r: Record<string, string>): Piece[] {
  const long = /6 mois|1 an|Plus d/i.test(r.duree || "");
  const travailOuEtudes = /Travail|Etudes/i.test(r.motif || "");

  const base: Piece[] = [
    {
      nom: "Piece d'identite en cours de validite",
      detail: "Carte nationale d'identite CEDEAO ou passeport : l'une des deux suffit.",
      source: "fournir",
      ou: "Centre d'etat civil, ou Direction de la Police des Etrangers pour le passeport",
    },
    {
      nom: "Carnet de vaccination",
      detail: "Demande a l'entree de certains pays, selon la periode.",
      source: "fournir",
      ou: "Un centre de vaccination internationale",
    },
  ];

  if (travailOuEtudes || long) {
    base.push({
      nom: "Carte de sejour sur place",
      detail:
        "La libre circulation autorise l'entree ; s'installer pour travailler ou etudier demande en general une demarche une fois arrive.",
      source: "fournir",
      ou: "Les services d'immigration du pays d'accueil, apres l'arrivee",
    });
    base.push({
      nom: "Lettre de presentation",
      detail: "Expose ton projet a l'employeur, a l'ecole ou aux services locaux.",
      source: "site",
      editeur: "demande",
    });
  }

  return base;
}

/* ============================ Les demarches ============================ */

export const DEMARCHES: Demarche[] = [
  /* ------------------------------ Voyage ------------------------------ */
  {
    id: "visa",
    nom: "Voyage a l'etranger",
    resume: "Savoir ce qu'il te faut pour partir, selon le pays.",
    publics: ["particulier", "etudiant", "entrepreneur"],
    motsCles: [
      "visa", "voyage", "voyager", "partir", "sejour", "ambassade", "consulat", "schengen",
      "france", "belgique", "canada", "espagne", "italie", "maroc", "etats-unis", "europe",
      "gambie", "mali", "guinee", "mauritanie", "cote d'ivoire", "ghana", "nigeria", "togo", "benin",
      "chine", "dubai", "emirats", "turquie", "inde", "canton", "salon", "foire",
    ],
    questions: [
      { id: "destination", libelle: "Dans quel pays veux-tu aller ?", type: "texte", aide: "France, Belgique, Canada, Maroc…" },
      { id: "motif", libelle: "Pour quelle raison ?", type: "choix", options: ["Etudes", "Travail", "Affaires et commerce", "Visite familiale", "Tourisme", "Soins medicaux"] },
      { id: "duree", libelle: "Combien de temps comptes-tu rester ?", type: "choix", options: ["Moins de 3 mois", "3 a 6 mois", "6 mois a 1 an", "Plus d'un an"] },
      { id: "heberge", libelle: "Ou vas-tu loger ?", type: "choix", options: ["Chez un proche", "A l'hotel", "Logement etudiant", "Je ne sais pas encore"] },
    ],
    pieces: [
      { nom: "Lettre explicative de sejour", detail: "Expose le motif du voyage et les garanties de retour.", source: "site", editeur: "demande" },
      { nom: "Passeport en cours de validite", detail: "Doit couvrir toute la duree du sejour.", source: "fournir", ou: "Direction de la Police des Etrangers et des Titres de Voyage" },
      { nom: "Formulaire de demande de visa", detail: "Propre a chaque pays, a remplir sur le site officiel.", source: "fournir", ou: "Ambassade ou consulat du pays, ou son prestataire de depot" },
      { nom: "Attestation d'hebergement", detail: "Signee par la personne qui heberge, dans le pays d'accueil.", source: "fournir", ou: "La personne qui t'heberge — c'est elle qui la signe" },
      { nom: "Justificatifs financiers", detail: "Releves bancaires ou prise en charge.", source: "fournir", ou: "Ta banque" },
      { nom: "Assurance voyage", detail: "Obligatoire pour la plupart des destinations.", source: "fournir", ou: "Une compagnie d'assurance" },
      { nom: "Lettre d'invitation", detail: "Pour un voyage d'affaires : l'entreprise ou le salon qui te recoit l'etablit.", source: "fournir", ou: "Ton partenaire commercial sur place" },
      { nom: "Demande de lettre d'invitation", detail: "Le courrier par lequel tu la reclames a ton fournisseur ou a l'organisateur.", source: "site", editeur: "demande" },
    ],
    // La liste ci-dessus est celle d'un pays a visa. Pour l'espace CEDEAO,
    // elle est remplacee : pas de visa, donc pas de dossier consulaire.
    piecesSelon: (r) => (regimeVoyage(r.destination || "") === "cedeao" ? piecesCedeao(r) : null),
    avertissement:
      "Les pieces exactes changent selon le pays, le motif et ta situation. Verifie toujours la liste officielle avant de deposer ton dossier.",
    avertissementSelon: (r) => {
      const pays = (r.destination || "").trim();
      if (!pays) return null;
      if (regimeVoyage(pays) !== "cedeao") return null;
      if (cedeaoIncertain(pays))
        return `${pays} fait partie de l'espace CEDEAO, ou un Senegalais circule sans visa. Attention : l'appartenance de ce pays a la CEDEAO a change depuis 2024 — verifie la regle en vigueur avant de partir.`;
      return `Bonne nouvelle : ${pays} est dans l'espace CEDEAO. Un Senegalais n'a pas besoin de visa — une piece d'identite en cours de validite suffit pour entrer.`;
    },
  },
  {
    id: "passeport",
    nom: "Passeport",
    resume: "Premiere demande ou renouvellement d'un passeport senegalais.",
    publics: ["particulier", "etudiant", "entrepreneur"],
    motsCles: ["passeport", "biometrique", "titre de voyage", "renouveler passeport"],
    questions: [
      { id: "cas", libelle: "C'est une premiere demande ou un renouvellement ?", type: "choix", options: ["Premiere demande", "Renouvellement", "Passeport perdu ou vole"] },
    ],
    pieces: [
      { nom: "Extrait de naissance", detail: "Recent, selon ce que demande le guichet.", source: "fournir", ou: "Mairie de ton lieu de naissance" },
      { nom: "Carte nationale d'identite", detail: "En cours de validite.", source: "fournir", ou: "Centre d'etat civil ou commissariat" },
      { nom: "Certificat de residence", detail: "Justifie ton domicile actuel.", source: "fournir", ou: "Mairie ou commissariat de ton quartier" },
      { nom: "Declaration de perte", detail: "Uniquement si le passeport a ete perdu ou vole.", source: "site", editeur: "demande" },
    ],
    avertissement:
      "Le passeport est delivre par l'Etat : ce site ne le fabrique pas et ne peut pas accelerer la procedure. Il prepare seulement les courriers qui accompagnent ton dossier.",
  },

  /* --------------------------- Etat civil --------------------------- */
  {
    id: "etat-civil",
    nom: "Acte d'etat civil",
    resume: "Obtenir un extrait de naissance, de mariage ou de deces.",
    publics: ["particulier", "etudiant", "entrepreneur"],
    motsCles: ["extrait de naissance", "acte de naissance", "etat civil", "acte de mariage", "acte de deces", "copie integrale"],
    questions: [
      { id: "acte", libelle: "Quel acte te faut-il ?", type: "choix", options: ["Extrait de naissance", "Acte de mariage", "Acte de deces"] },
      { id: "lieu", libelle: "Dans quelle commune l'acte a-t-il ete enregistre ?", type: "texte", aide: "C'est la commune du lieu, pas celle ou tu habites." },
    ],
    pieces: [
      { nom: "Demande ecrite a la mairie", detail: "Courrier de demande de copie d'acte.", source: "site", editeur: "demande" },
      { nom: "Piece d'identite", detail: "Celle du demandeur.", source: "fournir", ou: "A photographier ou scanner toi-meme" },
    ],
    avertissement:
      "Un acte d'etat civil est delivre par la mairie qui l'a enregistre. Ce site redige la demande, il ne produit jamais l'acte lui-meme.",
  },
  {
    id: "residence",
    nom: "Certificat de residence",
    resume: "Justifier officiellement l'adresse ou tu habites.",
    publics: ["particulier", "etudiant", "entrepreneur"],
    motsCles: ["certificat de residence", "domicile", "justificatif de domicile", "residence"],
    questions: [
      { id: "usage", libelle: "Pour quelle demarche en as-tu besoin ?", type: "texte", aide: "Passeport, dossier de visa, banque, concours…" },
    ],
    pieces: [
      { nom: "Demande de certificat de residence", detail: "Courrier adresse a la mairie ou au commissariat.", source: "site", editeur: "demande" },
      { nom: "Piece d'identite", detail: "Celle du demandeur.", source: "fournir", ou: "A photographier ou scanner toi-meme" },
      { nom: "Justificatif d'adresse", detail: "Facture d'eau ou d'electricite, contrat de bail.", source: "fournir", ou: "Ton fournisseur, ou ton bailleur" },
    ],
  },

  /* ---------------------------- Perte, vol ---------------------------- */
  {
    id: "perte-document",
    nom: "Perte ou vol d'un document",
    resume: "Declarer la perte d'une piece et demander son remplacement.",
    publics: ["particulier", "etudiant", "entrepreneur"],
    motsCles: ["perte", "perdu", "vol", "vole", "declaration de perte", "duplicata", "j'ai perdu"],
    questions: [
      { id: "document", libelle: "Quel document as-tu perdu ?", type: "choix", options: ["Carte d'identite", "Passeport", "Permis de conduire", "Carte grise", "Diplome", "Autre"] },
      { id: "circonstances", libelle: "Ou et quand l'as-tu perdu ?", type: "texte", aide: "Reste factuel : la declaration engage ta responsabilite." },
    ],
    pieces: [
      { nom: "Declaration de perte", detail: "Courrier a presenter au commissariat.", source: "site", editeur: "demande" },
      { nom: "Recepisse de declaration", detail: "Remis par la police apres depot.", source: "fournir", ou: "Commissariat ou brigade de gendarmerie" },
      { nom: "Demande de duplicata", detail: "Courrier a l'administration qui a delivre le document.", source: "site", editeur: "demande" },
    ],
    avertissement: "Une declaration de perte est une declaration sur l'honneur : ce que tu y ecris t'engage devant la loi.",
  },
  {
    id: "permis",
    nom: "Permis de conduire",
    resume: "Duplicata, renouvellement ou conversion d'un permis.",
    publics: ["particulier", "entrepreneur"],
    motsCles: ["permis", "permis de conduire", "conduire", "transport", "chauffeur", "duplicata permis"],
    questions: [
      { id: "cas", libelle: "De quoi s'agit-il ?", type: "choix", options: ["Duplicata apres perte", "Renouvellement", "Conversion d'un permis etranger", "Ajout d'une categorie"] },
    ],
    pieces: [
      { nom: "Demande ecrite", detail: "Courrier adresse au service des transports terrestres.", source: "site", editeur: "demande" },
      { nom: "Declaration de perte", detail: "Uniquement en cas de duplicata.", source: "site", editeur: "demande" },
      { nom: "Piece d'identite", detail: "En cours de validite.", source: "fournir", ou: "A photographier ou scanner toi-meme" },
      { nom: "Photos d'identite", detail: "Au format demande par le service.", source: "fournir", ou: "Un studio photo" },
    ],
  },

  /* ------------------------------ Justice ------------------------------ */
  {
    id: "casier",
    nom: "Casier judiciaire",
    resume: "Demander un extrait de casier judiciaire.",
    publics: ["particulier", "etudiant", "entrepreneur"],
    motsCles: ["casier", "casier judiciaire", "bulletin", "extrait de casier", "b3"],
    questions: [
      { id: "usage", libelle: "Pourquoi te le demande-t-on ?", type: "choix", options: ["Embauche", "Concours ou fonction publique", "Dossier de visa", "Creation d'entreprise", "Autre"] },
    ],
    pieces: [
      { nom: "Demande d'extrait de casier", detail: "Courrier adresse au greffe du tribunal.", source: "site", editeur: "demande" },
      { nom: "Extrait de naissance", detail: "Souvent exige a l'appui de la demande.", source: "fournir", ou: "Mairie de ton lieu de naissance" },
      { nom: "Piece d'identite", detail: "Celle du demandeur.", source: "fournir", ou: "A photographier ou scanner toi-meme" },
    ],
    avertissement:
      "Le casier judiciaire est delivre par le tribunal. Ce site prepare la demande — il n'a evidemment aucun acces a ton dossier judiciaire.",
  },
  {
    id: "plainte",
    nom: "Porter plainte",
    resume: "Rediger une plainte a deposer au commissariat ou au procureur.",
    publics: ["particulier", "entrepreneur"],
    motsCles: ["plainte", "porter plainte", "escroquerie", "arnaque", "vol", "menace", "litige", "procureur"],
    questions: [
      { id: "objet", libelle: "Que s'est-il passe ?", type: "texte", aide: "Les faits, sans commentaire : qui, quoi, quand, ou." },
      { id: "prejudice", libelle: "Quel prejudice as-tu subi ?", type: "texte", aide: "Montant, materiel, moral. Reste sur ce que tu peux prouver." },
      { id: "auteur", libelle: "Connais-tu la personne mise en cause ?", type: "choix", options: ["Oui, je la connais", "Non, elle est inconnue"] },
    ],
    pieces: [
      { nom: "Lettre de plainte", detail: "Expose des faits, adresse au commissariat ou au procureur.", source: "site", editeur: "demande" },
      { nom: "Preuves", detail: "Captures, recus, messages, temoignages.", source: "fournir", ou: "A rassembler toi-meme" },
      { nom: "Piece d'identite", detail: "Celle du plaignant.", source: "fournir", ou: "A photographier ou scanner toi-meme" },
    ],
    avertissement:
      "Une plainte met en cause une personne : n'ecris que des faits verifiables. Une accusation fausse est elle-meme une infraction. Pour un dossier grave, consulte un avocat.",
  },
  {
    id: "divorce",
    nom: "Divorce",
    resume: "Preparer une demande de divorce devant le tribunal.",
    publics: ["particulier"],
    motsCles: ["divorce", "divorcer", "separation", "rupture de mariage"],
    questions: [
      { id: "type", libelle: "Quelle est la situation ?", type: "choix", options: ["Les deux epoux sont d'accord", "Un seul demande le divorce", "Je ne sais pas encore"] },
      { id: "enfants", libelle: "Y a-t-il des enfants mineurs ?", type: "choix", options: ["Oui", "Non"] },
    ],
    pieces: [
      { nom: "Requete au tribunal", detail: "Courrier exposant la demande.", source: "site", editeur: "demande" },
      { nom: "Acte de mariage", detail: "Copie recente.", source: "fournir", ou: "Mairie ou l'acte a ete enregistre" },
      { nom: "Actes de naissance des enfants", detail: "Si des enfants sont concernes.", source: "fournir", ou: "Mairie du lieu de naissance" },
    ],
    avertissement:
      "Un divorce se juge au tribunal et engage ta famille et ton patrimoine. Ce site prepare un courrier de saisine : prends l'avis d'un avocat avant de deposer.",
  },
  {
    id: "mariage",
    nom: "Mariage",
    resume: "Constituer un dossier de mariage a la mairie.",
    publics: ["particulier"],
    motsCles: ["mariage", "se marier", "publication des bans", "dossier de mariage"],
    questions: [
      { id: "commune", libelle: "Dans quelle commune veux-tu te marier ?", type: "texte" },
      { id: "regime", libelle: "Avez-vous choisi un regime matrimonial ?", type: "choix", options: ["Oui", "Pas encore", "Je ne sais pas ce que c'est"] },
    ],
    pieces: [
      { nom: "Demande de publication des bans", detail: "Courrier adresse a l'officier d'etat civil.", source: "site", editeur: "demande" },
      { nom: "Extraits de naissance des deux epoux", detail: "Recents.", source: "fournir", ou: "Mairie du lieu de naissance de chacun" },
      { nom: "Certificats de residence", detail: "Pour chacun des epoux.", source: "fournir", ou: "Mairie ou commissariat du quartier" },
      { nom: "Pieces d'identite", detail: "Des deux epoux et des temoins.", source: "fournir", ou: "A photographier ou scanner vous-memes" },
    ],
  },

  /* ----------------------------- Entreprise ----------------------------- */
  {
    id: "ninea",
    nom: "NINEA et creation d'entreprise",
    resume: "Declarer une activite et obtenir un NINEA.",
    publics: ["entrepreneur"],
    motsCles: ["ninea", "entreprise", "societe", "rccm", "creer entreprise", "formaliser", "guichet unique", "apix", "impots"],
    questions: [
      { id: "forme", libelle: "Sous quelle forme veux-tu exercer ?", type: "choix", options: ["Entreprise individuelle", "SARL", "SUARL", "GIE", "Je ne sais pas encore"] },
      { id: "activite", libelle: "Quelle est ton activite ?", type: "texte", aide: "Commerce de vetements, maconnerie, transport…" },
    ],
    pieces: [
      { nom: "Demande d'immatriculation", detail: "Courrier accompagnant le dossier.", source: "site", editeur: "demande" },
      { nom: "Formulaire du guichet unique", detail: "Formulaire officiel de creation.", source: "fournir", ou: "Guichet unique de creation d'entreprise (APIX)" },
      { nom: "Piece d'identite du dirigeant", detail: "En cours de validite.", source: "fournir", ou: "A photographier ou scanner toi-meme" },
      { nom: "Certificat de residence", detail: "Ou justificatif d'adresse de l'entreprise.", source: "fournir", ou: "Mairie ou commissariat du quartier" },
    ],
    avertissement:
      "Le NINEA est attribue par l'administration fiscale. Les formalites de creation se font au guichet unique — ce site prepare les courriers, pas l'immatriculation.",
  },


  /* ------------------------- Consommation, contrats ------------------------- */
  {
    id: "resiliation",
    nom: "Resilier un abonnement",
    resume: "Mettre fin a un contrat telephone, internet ou television.",
    publics: ["particulier", "entrepreneur"],
    motsCles: ["resilier", "resiliation", "abonnement", "sonatel", "orange", "free", "expresso", "canal", "internet", "forfait"],
    questions: [
      { id: "operateur", libelle: "Quel fournisseur ?", type: "texte", aide: "Sonatel/Orange, Free, Expresso, Canal+…" },
      { id: "motif", libelle: "Pourquoi resilies-tu ?", type: "choix", options: ["Service insatisfaisant", "Demenagement", "Trop cher", "Double abonnement", "Autre"] },
      { id: "reference", libelle: "Quel est ton numero de client ou de ligne ?", type: "texte" },
    ],
    pieces: [
      { nom: "Lettre de resiliation", detail: "Courrier adresse au service client.", source: "site", editeur: "demande" },
      { nom: "Derniere facture", detail: "Pour justifier ta reference client.", source: "fournir", ou: "Ton espace client, ou une agence du fournisseur" },
    ],
  },
  {
    id: "reclamation",
    nom: "Reclamation",
    resume: "Contester une facture ou reclamer un service non rendu.",
    publics: ["particulier", "entrepreneur"],
    motsCles: ["reclamation", "reclamer", "facture", "remboursement", "contestation", "litige", "senelec", "sen'eau", "eau", "electricite"],
    questions: [
      { id: "destinataire", libelle: "A qui s'adresse la reclamation ?", type: "texte", aide: "Senelec, Sen'Eau, une banque, un commercant…" },
      { id: "objet", libelle: "Que reproches-tu ?", type: "texte", aide: "Sois precis : date, montant, ce qui etait prevu." },
      { id: "attente", libelle: "Que demandes-tu ?", type: "choix", options: ["Un remboursement", "Une correction de facture", "Un service rendu", "Des explications"] },
    ],
    pieces: [
      { nom: "Lettre de reclamation", detail: "Courrier au service client, avec la demande claire.", source: "site", editeur: "demande" },
      { nom: "Facture ou recu", detail: "La preuve du paiement ou du contrat.", source: "fournir", ou: "Ton fournisseur, ou tes archives" },
    ],
  },

  /* -------------------------- Emploi et etudes -------------------------- */
  {
    id: "emploi",
    nom: "Candidature a un emploi",
    resume: "CV et lettre pour repondre a une offre ou candidater spontanement.",
    publics: ["particulier", "etudiant"],
    motsCles: ["emploi", "travail", "job", "postuler", "candidature", "recrutement", "cv", "lettre de motivation", "embauche", "stage"],
    questions: [
      { id: "poste", libelle: "Quel poste vises-tu ?", type: "texte", aide: "Assistante commerciale, chauffeur, comptable…" },
      { id: "entreprise", libelle: "Quelle entreprise ?", type: "texte", aide: "Laisse vide si tu n'as pas encore d'entreprise precise." },
      { id: "offre", libelle: "Reponds-tu a une offre publiee ?", type: "choix", options: ["Oui, une offre precise", "Non, candidature spontanee"] },
    ],
    pieces: [
      { nom: "CV", detail: "Ton parcours sur une page.", source: "site", editeur: "cv" },
      { nom: "Lettre de motivation", detail: "Adaptee au poste et a l'entreprise.", source: "site", editeur: "lettre" },
      { nom: "Copie de la piece d'identite", detail: "Demandee par certains employeurs.", source: "fournir", ou: "A photographier ou scanner toi-meme" },
      { nom: "Diplomes ou attestations", detail: "Si l'offre les exige.", source: "fournir", ou: "Ton etablissement, ou un ancien employeur" },
    ],
  },
  {
    id: "etudes",
    nom: "Inscription ou bourse",
    resume: "Dossier d'inscription universitaire ou demande de bourse.",
    publics: ["etudiant"],
    motsCles: ["bourse", "inscription", "universite", "ecole", "etudes", "campus", "master", "licence", "formation"],
    questions: [
      { id: "etablissement", libelle: "Quel etablissement vises-tu ?", type: "texte" },
      { id: "objet", libelle: "Que demandes-tu ?", type: "choix", options: ["Une inscription", "Une bourse", "Une equivalence de diplome", "Un transfert"] },
      { id: "filiere", libelle: "Dans quelle filiere ?", type: "texte" },
    ],
    pieces: [
      { nom: "Lettre de motivation", detail: "Adressee a l'etablissement.", source: "site", editeur: "lettre" },
      { nom: "Demande ecrite", detail: "Courrier de demande d'inscription ou de bourse.", source: "site", editeur: "demande" },
      { nom: "Releves de notes et diplomes", detail: "Ton parcours scolaire.", source: "fournir", ou: "Ton etablissement precedent" },
      { nom: "Extrait de naissance", detail: "Souvent exige au dossier.", source: "fournir", ou: "Mairie de ton lieu de naissance" },
    ],
  },

  /* --------------------- Commerce international --------------------- */
  {
    id: "fournisseur",
    nom: "Contacter un fournisseur etranger",
    resume: "Demander un devis, negocier et passer commande a l'etranger.",
    publics: ["entrepreneur"],
    motsCles: [
      "alibaba", "fournisseur", "grossiste", "proforma", "devis fournisseur", "commander",
      "commande", "usine", "fabricant", "1688", "aliexpress", "made in china", "echantillon",
    ],
    questions: [
      { id: "produit", libelle: "Quel produit veux-tu acheter ?", type: "texte", aide: "Sois precis : matiere, taille, modele, usage." },
      { id: "quantite", libelle: "Quelle quantite ?", type: "texte", aide: "Un fournisseur ne repond pas sans quantite. « 500 pieces », « 1 conteneur 20 pieds »." },
      { id: "pays", libelle: "Dans quel pays est le fournisseur ?", type: "texte", aide: "Chine, Turquie, Emirats, Inde…" },
      { id: "etape", libelle: "Ou en es-tu ?", type: "choix", options: ["Je cherche un prix", "Je veux un echantillon", "Je suis pret a commander", "J'ai un probleme avec une commande"] },
    ],
    pieces: [
      { nom: "Demande de facture proforma", detail: "Le courrier qui demande prix, delai et conditions, avec les bonnes questions.", source: "site", editeur: "demande" },
      { nom: "Facture proforma du fournisseur", detail: "Sa reponse chiffree : c'est elle qui sert ensuite a la banque et a la douane.", source: "fournir", ou: "Ton fournisseur" },
      { nom: "Fiche technique du produit", detail: "Dimensions, matiere, certifications.", source: "fournir", ou: "Ton fournisseur" },
    ],
    avertissement:
      "Verifie toujours un fournisseur avant de payer : anciennete du compte, references, paiement securise. Un virement direct sur un compte personnel ne se recupere pas.",
  },
  {
    id: "import",
    nom: "Importer des marchandises",
    resume: "Faire entrer une marchandise au Senegal, du fournisseur au dedouanement.",
    publics: ["entrepreneur"],
    motsCles: [
      "import", "importer", "importation", "douane", "dedouanement", "conteneur", "fret",
      "transitaire", "connaissement", "marchandise", "port de dakar", "import export",
    ],
    questions: [
      { id: "produit", libelle: "Qu'est-ce que tu importes ?", type: "texte", aide: "Certains produits sont soumis a controle : alimentaire, medicament, cosmetique." },
      { id: "origine", libelle: "De quel pays ?", type: "texte", aide: "Chine, Turquie, Emirats, France…" },
      { id: "transport", libelle: "Par quel moyen ?", type: "choix", options: ["Maritime (conteneur)", "Aerien", "Je ne sais pas encore"] },
      { id: "statut", libelle: "Ton entreprise est-elle formalisee ?", type: "choix", options: ["Oui, j'ai un NINEA", "Non, pas encore"] },
    ],
    pieces: [
      { nom: "Demande de facture proforma", detail: "Pour obtenir du fournisseur le document de base du dossier.", source: "site", editeur: "demande" },
      { nom: "Demande de domiciliation bancaire", detail: "Courrier a ta banque, quand elle l'exige pour l'operation.", source: "site", editeur: "demande" },
      { nom: "Facture commerciale et liste de colisage", detail: "Etablies par le fournisseur, elles decrivent ce qui est dans le colis.", source: "fournir", ou: "Ton fournisseur" },
      { nom: "Connaissement ou lettre de transport", detail: "Le titre qui prouve l'expedition.", source: "fournir", ou: "La compagnie maritime ou aerienne" },
      { nom: "Certificat d'origine", detail: "Souvent demande, et parfois necessaire pour beneficier d'un tarif reduit.", source: "fournir", ou: "La chambre de commerce du pays d'origine" },
      { nom: "Declaration en douane", detail: "Elle se depose par un professionnel agree, pas par l'importateur lui-meme.", source: "fournir", ou: "Un transitaire agree en douane" },
      { nom: "NINEA et registre du commerce", detail: "Une importation commerciale se fait au nom d'une entreprise declaree.", source: "fournir", ou: "Guichet unique de creation d'entreprise" },
    ],
    avertissement:
      "Les droits de douane, les produits soumis a controle et les seuils changent regulierement. Fais confirmer ton dossier par un transitaire agree AVANT d'expedier : une marchandise bloquee au port coute des frais de stationnement chaque jour.",
  },
  {
    id: "export",
    nom: "Exporter des produits",
    resume: "Vendre une production senegalaise a l'etranger.",
    publics: ["entrepreneur"],
    motsCles: ["export", "exporter", "exportation", "vendre a l'etranger", "expedier", "client etranger"],
    questions: [
      { id: "produit", libelle: "Qu'est-ce que tu exportes ?", type: "texte", aide: "Artisanat, produits agricoles, transformes, textile…" },
      { id: "destination", libelle: "Vers quel pays ?", type: "texte" },
      { id: "client", libelle: "As-tu deja un acheteur ?", type: "choix", options: ["Oui, un acheteur identifie", "Non, je cherche des clients"] },
    ],
    pieces: [
      { nom: "Offre commerciale", detail: "Le courrier de presentation avec prix et conditions, adresse a l'acheteur.", source: "site", editeur: "demande" },
      { nom: "Facture proforma", detail: "Ta propre proforma — l'Espace Pro de Wanteermako la genere.", source: "fournir", ou: "Ton Espace Pro (Mon Activite), rubrique Devis" },
      { nom: "Certificat d'origine", detail: "Atteste que la marchandise est senegalaise.", source: "fournir", ou: "La chambre de commerce" },
      { nom: "Certificat sanitaire ou phytosanitaire", detail: "Pour l'alimentaire et l'agricole, selon le pays destinataire.", source: "fournir", ou: "Les services veterinaires ou phytosanitaires competents" },
      { nom: "Declaration d'exportation", detail: "Deposee par un professionnel agree.", source: "fournir", ou: "Un transitaire agree en douane" },
    ],
    avertissement:
      "Chaque pays destinataire impose ses propres controles a l'entree, en particulier sur l'alimentaire. Fais confirmer la liste par l'acheteur ou par un transitaire avant d'expedier.",
  },
  {
    id: "partenariat",
    nom: "Partenariat ou distribution",
    resume: "Proposer une collaboration, une representation ou une distribution exclusive.",
    publics: ["entrepreneur"],
    motsCles: ["partenariat", "partenaire", "distribution", "distributeur", "representation", "franchise", "collaboration", "representant"],
    questions: [
      { id: "entreprise", libelle: "Quelle entreprise vises-tu ?", type: "texte" },
      { id: "proposition", libelle: "Que proposes-tu exactement ?", type: "texte", aide: "Distribuer ses produits au Senegal, la representer, un partenariat technique…" },
      { id: "atout", libelle: "Qu'apportes-tu ?", type: "texte", aide: "Reseau, boutique, entrepot, clientele, experience du marche." },
    ],
    pieces: [
      { nom: "Lettre de proposition de partenariat", detail: "Presente ton projet, ce que tu apportes et ce que tu demandes.", source: "site", editeur: "demande" },
      { nom: "Presentation de ton activite", detail: "Ce que fait ton entreprise, en une page.", source: "fournir", ou: "A preparer toi-meme, ou depuis ton Espace Pro" },
    ],
  },
  {
    id: "banque-pro",
    nom: "Compte bancaire professionnel",
    resume: "Ouvrir un compte au nom de l'entreprise, ou demander une facilite.",
    publics: ["entrepreneur"],
    motsCles: ["compte bancaire", "banque", "compte professionnel", "domiciliation", "credit", "financement", "pret"],
    questions: [
      { id: "banque", libelle: "Quelle banque ?", type: "texte" },
      { id: "objet", libelle: "Que demandes-tu ?", type: "choix", options: ["Ouvrir un compte professionnel", "Une domiciliation d'importation", "Un financement", "Un chequier ou une carte"] },
    ],
    pieces: [
      { nom: "Demande ecrite a la banque", detail: "Courrier d'accompagnement du dossier.", source: "site", editeur: "demande" },
      { nom: "NINEA et registre du commerce", detail: "L'existence legale de l'entreprise.", source: "fournir", ou: "Guichet unique de creation d'entreprise" },
      { nom: "Piece d'identite du dirigeant", detail: "En cours de validite.", source: "fournir", ou: "A photographier ou scanner toi-meme" },
      { nom: "Justificatif d'adresse", detail: "De l'entreprise ou du dirigeant.", source: "fournir", ou: "Mairie, ou une facture recente" },
    ],
    avertissement:
      "Une demande de financement s'apprecie sur des chiffres. Prepare ton chiffre d'affaires et tes charges avant le rendez-vous — le courrier ouvre la porte, il ne remplace pas le dossier.",
  },
];

/* ======================= Destinataire et objet ======================= */

/**
 * Comment s'ouvre le courrier de chaque demarche.
 *
 * Le formulaire demandait « Entreprise » a tout le monde, y compris a qui
 * declare la perte de sa carte d'identite. Chaque fiche nomme donc son
 * destinataire — commissariat, mairie, greffe, service client — et propose
 * un objet, construit a partir des reponses.
 *
 * Les exemples cites en `placeholder` sont des ILLUSTRATIONS de forme, pas
 * des adresses : ils montrent a quoi ressemble une ligne « destinataire »,
 * l'utilisateur ecrit la sienne.
 */
export type EnTete = { libelle: string; placeholder: string; objet: string };

const EN_TETES: Record<string, EnTete> = {
  visa: {
    libelle: "Ambassade ou consulat",
    placeholder: "Consulat general de France",
    objet: "Demande de visa {motif} — {destination}",
  },
  passeport: {
    libelle: "Service destinataire",
    placeholder: "Direction de la Police des Etrangers et des Titres de Voyage",
    objet: "Passeport — {cas}",
  },
  "etat-civil": {
    libelle: "Mairie",
    placeholder: "Monsieur le Maire de {lieu}",
    objet: "Demande de copie — {acte}",
  },
  residence: {
    libelle: "Mairie ou commissariat",
    placeholder: "Monsieur le Maire",
    objet: "Demande de certificat de residence",
  },
  "perte-document": {
    libelle: "Destinataire",
    placeholder: "Monsieur le Commissaire",
    objet: "Declaration de perte — {document}",
  },
  permis: {
    libelle: "Service des transports",
    placeholder: "Direction des Transports Terrestres",
    objet: "Permis de conduire — {cas}",
  },
  casier: {
    libelle: "Greffe du tribunal",
    placeholder: "Monsieur le Greffier en chef",
    objet: "Demande d'extrait de casier judiciaire",
  },
  plainte: {
    libelle: "Autorite saisie",
    placeholder: "Monsieur le Procureur de la Republique",
    objet: "Plainte",
  },
  divorce: {
    libelle: "Tribunal",
    placeholder: "Monsieur le President du Tribunal",
    objet: "Requete en divorce",
  },
  mariage: {
    libelle: "Mairie",
    placeholder: "Monsieur le Maire de {commune}",
    objet: "Demande de publication des bans",
  },
  ninea: {
    libelle: "Administration destinataire",
    placeholder: "Guichet unique de creation d'entreprise",
    objet: "Demande d'immatriculation — {forme}",
  },
  resiliation: {
    libelle: "Service client",
    placeholder: "Service client {operateur}",
    objet: "Resiliation de mon abonnement",
  },
  reclamation: {
    libelle: "Destinataire",
    placeholder: "Service client {destinataire}",
    objet: "Reclamation",
  },
  emploi: {
    libelle: "Entreprise",
    placeholder: "SunuCom",
    objet: "Candidature — {poste}",
  },
  etudes: {
    libelle: "Etablissement",
    placeholder: "Universite Cheikh Anta Diop",
    objet: "{objet} — {filiere}",
  },
  fournisseur: {
    libelle: "Fournisseur",
    placeholder: "Service commercial",
    objet: "Demande de facture proforma — {produit}",
  },
  import: {
    libelle: "Destinataire",
    placeholder: "Service commercial",
    objet: "Importation — {produit} depuis {origine}",
  },
  export: {
    libelle: "Acheteur",
    placeholder: "Service achats",
    objet: "Offre commerciale — {produit}",
  },
  partenariat: {
    libelle: "Entreprise",
    placeholder: "{entreprise}",
    objet: "Proposition de partenariat",
  },
  "banque-pro": {
    libelle: "Banque",
    placeholder: "Monsieur le Directeur d'agence, {banque}",
    objet: "{objet}",
  },
};

const EN_TETE_DEFAUT: EnTete = { libelle: "Destinataire", placeholder: "", objet: "Demande" };

export function enTeteDe(id: string): EnTete {
  return EN_TETES[id] || EN_TETE_DEFAUT;
}

/**
 * Objet du courrier, construit a partir des reponses.
 *
 * Les `{cle}` non renseignees disparaissent, ainsi que le tiret qui les
 * precedait : un objet ne doit jamais afficher « Demande de visa — » ni un
 * accolade restee en place.
 */
export function objetDe(id: string, reponses: Record<string, string>): string {
  const brut = enTeteDe(id).objet.replace(/\{(\w+)\}/g, (_, cle) => (reponses[cle] || "").trim());
  return brut
    .replace(/\s*—\s*$/, "")
    .replace(/^\s*—\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Destinataire propose, avec les reponses deja connues injectees. */
export function destinataireDe(id: string, reponses: Record<string, string>): string {
  return enTeteDe(id)
    .placeholder.replace(/\{(\w+)\}/g, (_, cle) => (reponses[cle] || "").trim())
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ============================== Utilitaires ============================== */

export function demarcheParId(id: string): Demarche | undefined {
  return DEMARCHES.find((d) => d.id === id);
}

/**
 * Routage de secours, sans IA : on compte les mots-cles reconnus dans la
 * demande. Sert quand le modele est indisponible ou qu'il repond a cote —
 * l'assistant continue de fonctionner, simplement moins finement.
 */
export function trouverParMots(texte: string): Demarche | null {
  const t = texte.toLowerCase();
  let meilleure: { d: Demarche; score: number } | null = null;

  for (const d of DEMARCHES) {
    let score = 0;
    for (const mot of d.motsCles) if (t.includes(mot)) score += mot.length;
    if (score > 0 && (!meilleure || score > meilleure.score)) meilleure = { d, score };
  }
  return meilleure?.d || null;
}

/**
 * Les pieces reellement applicables, une fois les reponses connues.
 *
 * C'est la seule fonction que les ecrans doivent appeler : lire `pieces`
 * directement redonnerait la liste generique, celle qui servait un dossier de
 * visa a qui part en Gambie.
 */
export function piecesDe(d: Demarche, reponses: Record<string, string>): Piece[] {
  return d.piecesSelon?.(reponses) || d.pieces;
}

/** Avertissements applicables : celui de la fiche, plus celui des reponses. */
export function avertissementsDe(d: Demarche, reponses: Record<string, string>): string[] {
  const selon = d.avertissementSelon?.(reponses);
  // Celui qui depend des reponses passe en premier : il est plus precis, et
  // c'est souvent lui qui change la decision.
  return [selon, d.avertissement].filter((x): x is string => !!x && x.trim().length > 0);
}

/** Les pieces que le site redige lui-meme. */
export const pieceRedigee = (p: Piece) => p.source === "site";
