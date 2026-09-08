// Ma Carriere — socle commun au module CV / lettre de motivation / demande.
//
// Ce fichier ne contient AUCUNE couleur et aucun JSX : il decrit ce qu'est un
// document, et rien de la facon dont on l'affiche. Il est importe aussi bien
// par les ecrans que par les routes serveur.
//
// Origine : le modele de donnees vient du projet cvurgent (types/cv.ts), mais
// il a ete ramene a ce que les maquettes validees utilisent reellement. Les
// certifications, projets, liens et sections libres du modele d'origine ne
// sont saisis nulle part dans le parcours en 4 etapes : les porter aurait
// ajoute des champs que personne ne remplit et que les gabarits ignorent.

/* ========================= Les trois documents ========================= */

export const CAREER_KINDS = ["cv", "lettre", "demande"] as const;
export type CareerKind = (typeof CAREER_KINDS)[number];

export const KIND_LABELS: Record<CareerKind, string> = {
  cv: "CV",
  lettre: "Lettre de motivation",
  demande: "Demande d'emploi ou de stage",
};

/**
 * Genre grammatical du nom de chaque document, pour accorder les etats
 * affiches en liste (« Pret a modifier » / « Prete a modifier »). La maquette
 * ecrivait les deux a la main ; les accorder ici evite qu'un quatrieme
 * document arrive un jour avec le mauvais accord.
 */
export const KIND_GENDER: Record<CareerKind, "m" | "f"> = {
  cv: "m",
  lettre: "f",
  demande: "f",
};

export function accord(kind: CareerKind, masculin: string): string {
  return KIND_GENDER[kind] === "f" ? masculin + "e" : masculin;
}

/* ============================ Les gabarits ============================ */

export const CV_TEMPLATES = [
  { id: "moderne", name: "Moderne", pro: false },
  { id: "classique", name: "Classique", pro: false },
  { id: "minimal", name: "Minimal", pro: false },
  { id: "etudiant", name: "Etudiant", pro: false },
  { id: "africain", name: "Africain", pro: false },
  { id: "bandeau", name: "Bandeau", pro: false },
  { id: "elegant", name: "Elegant", pro: false },
  { id: "duo", name: "Duo", pro: false },
  { id: "executif", name: "Executif", pro: true },
  { id: "chrono", name: "Chronologie", pro: true },
  { id: "compact", name: "Compact", pro: true },
  { id: "cadre", name: "Cadre", pro: true },
  { id: "mosaique", name: "Mosaique", pro: true },
  { id: "diagonale", name: "Diagonale", pro: true },
  { id: "nuit", name: "Nuit", pro: true },
  { id: "neon", name: "Neon", pro: true },
  { id: "cyber", name: "Cyber", pro: true },
  // Seconde serie. Trois gratuits pour elargir le choix d'entree, sept
  // reserves : le gratuit doit rester utilisable, pas complet.
  { id: "miroir", name: "Miroir", pro: false },
  { id: "portrait", name: "Portrait", pro: false },
  { id: "bicolore", name: "Bicolore", pro: false },
  { id: "ligne", name: "Ligne", pro: true },
  { id: "numerote", name: "Numerote", pro: true },
  { id: "carte", name: "Carte", pro: true },
  { id: "journal", name: "Journal", pro: true },
  { id: "signature", name: "Signature", pro: true },
  { id: "arche", name: "Arche", pro: true },
  { id: "grille", name: "Grille", pro: true },
  // Troisieme serie — les codes des modeles de CV professionnels du commerce :
  // colonne a bord courbe, rubriques en pilules, cartes sur fond gris, photo
  // en medaillon. Trois gratuits, dont « Vague », la mise en page la plus
  // reconnaissable : la porte d'entree doit donner envie, pas frustrer.
  { id: "vague", name: "Vague", pro: false },
  { id: "sillon", name: "Sillon", pro: false },
  { id: "tandem", name: "Tandem", pro: false },
  { id: "fiche", name: "Fiche", pro: true },
  { id: "pilule", name: "Pilule", pro: true },
  { id: "medaillon", name: "Medaillon", pro: true },
  { id: "biseau", name: "Biseau", pro: true },
  { id: "ruban", name: "Ruban", pro: true },
  { id: "entete", name: "En-tete", pro: true },
  { id: "relief", name: "Relief", pro: true },
] as const;

export type TemplateId = (typeof CV_TEMPLATES)[number]["id"];

export const DEFAULT_TEMPLATE: TemplateId = "moderne";

export function isTemplateId(v: unknown): v is TemplateId {
  return CV_TEMPLATES.some((t) => t.id === v);
}

/**
 * Identifiant de gabarit de CV sur, garanti valide.
 *
 * Un « l_… » de courrier enregistre par erreur sur un CV, ou un identifiant
 * disparu d'une version a l'autre, retombe sur Moderne plutot que de laisser
 * un ecran blanc.
 */
export function templateCV(v: unknown): TemplateId {
  return isTemplateId(v) ? v : DEFAULT_TEMPLATE;
}

/** Un gabarit reserve aux abonnes ? Sert cote serveur autant qu'a l'ecran. */
export function templateIsPro(id: string): boolean {
  return CV_TEMPLATES.find((t) => t.id === id)?.pro === true;
}

/* ====================== Les gabarits de courrier ======================
 *
 * Lettres de motivation et courriers de demarche partagent les memes dix
 * mises en page : ce sont deux usages du meme objet — un courrier formel a
 * en-tete, avec objet, corps et signature.
 *
 * Volontairement SOBRES, toutes. Un CV peut se permettre un aplat de couleur,
 * pas une lettre adressee a une administration ou a un recruteur : la lettre
 * se juge sur la tenue, jamais sur le graphisme. Ce qui change d'un gabarit a
 * l'autre, c'est la structure de l'en-tete et le rythme typographique, pas la
 * quantite de couleur.
 */
export const LETTRE_TEMPLATES = [
  { id: "l_classique", name: "Classique", pro: false },
  { id: "l_moderne", name: "Moderne", pro: false },
  { id: "l_filet", name: "Filet", pro: false },
  { id: "l_sobre", name: "Sobre", pro: false },
  { id: "l_centre", name: "Centre", pro: false },
  { id: "l_bandeau", name: "Bandeau", pro: true },
  { id: "l_colonne", name: "Colonne", pro: true },
  { id: "l_encadre", name: "Encadre", pro: true },
  { id: "l_initiale", name: "Initiale", pro: true },
  { id: "l_contemporain", name: "Contemporain", pro: true },
] as const;

export type LettreTemplateId = (typeof LETTRE_TEMPLATES)[number]["id"];

export const DEFAULT_LETTRE_TEMPLATE: LettreTemplateId = "l_classique";

export function isLettreTemplateId(v: unknown): v is LettreTemplateId {
  return LETTRE_TEMPLATES.some((t) => t.id === v);
}

/** Un gabarit de courrier reserve aux abonnes ? */
export function lettreTemplateIsPro(id: string): boolean {
  return LETTRE_TEMPLATES.find((t) => t.id === id)?.pro === true;
}

/** Teinte d'encre de chaque gabarit. Toutes sombres : une lettre s'imprime. */
export const LETTRE_ACCENT: Record<LettreTemplateId, string> = {
  l_classique: "#1F2937",
  l_moderne: "#2B4C8C",
  l_filet: "#0F766E",
  l_sobre: "#111827",
  l_centre: "#7F1D1D",
  l_bandeau: "#2B4C8C",
  l_colonne: "#14532D",
  l_encadre: "#7F1D1D",
  l_initiale: "#B45309",
  l_contemporain: "#0F172A",
};

/* ============================ Les couleurs ============================ */

/**
 * Palette d'accent, commune aux huit gabarits.
 *
 * Huit mises en page multipliees par six couleurs se lisent comme
 * quarante-huit modeles, pour le prix d'une variable. Les teintes sont toutes
 * SOMBRES et saturees : un CV s'imprime souvent en noir et blanc et se lit
 * sur des ecrans mediocres — un accent pastel disparait dans les deux cas.
 */
export const ACCENTS = [
  { id: "bleu", name: "Bleu", value: "#2B4C8C" },
  { id: "nuit", name: "Nuit", value: "#111827" },
  { id: "vert", name: "Vert", value: "#14532D" },
  { id: "bordeaux", name: "Bordeaux", value: "#7F1D1D" },
  { id: "ocre", name: "Ocre", value: "#B45309" },
  { id: "sarcelle", name: "Sarcelle", value: "#0F766E" },
] as const;

/** Couleur d'origine de chaque gabarit, quand l'utilisateur n'a rien choisi. */
export const TEMPLATE_ACCENT: Record<TemplateId, string> = {
  moderne: "#2B4C8C",
  classique: "#111827",
  minimal: "#1F2937",
  etudiant: "#0F766E",
  africain: "#14532D",
  bandeau: "#0F766E",
  elegant: "#111827",
  duo: "#2B4C8C",
  executif: "#0F172A",
  chrono: "#7F1D1D",
  compact: "#2B4C8C",
  cadre: "#7F1D1D",
  mosaique: "#B45309",
  diagonale: "#2B4C8C",
  nuit: "#0F172A",
  // Les deux gabarits creatifs allument leur propre palette lumineuse : ces
  // valeurs ne servent que de repli, la feuille ne les peint pas telles quelles.
  neon: "#22D3EE",
  cyber: "#A855F7",
  miroir: "#2B4C8C",
  portrait: "#0F172A",
  bicolore: "#0F766E",
  ligne: "#111827",
  numerote: "#7F1D1D",
  carte: "#2B4C8C",
  journal: "#111827",
  signature: "#14532D",
  arche: "#B45309",
  grille: "#1F2937",
  vague: "#2B4C8C",
  sillon: "#1F2937",
  tandem: "#111827",
  fiche: "#0F766E",
  pilule: "#2B4C8C",
  medaillon: "#0F172A",
  biseau: "#2B4C8C",
  // L'accent de « Ruban » se detache sur une colonne noire : il lui faut une
  // teinte chaude, un bleu nuit s'y noierait.
  ruban: "#B45309",
  entete: "#7F1D1D",
  relief: "#0F766E",
};

/* ============================ Les polices ============================ */

/**
 * Polices proposees pour la feuille.
 *
 * Deliberement courtes et sures : chacune existe soit sur toutes les machines
 * (Georgia, Arial, Times), soit deja chargee par le site (Inter, Sora). Une
 * police qu'il faudrait aller telecharger arriverait apres la capture du PDF —
 * le document sortirait dans une police de repli, differente de l'apercu.
 *
 * Le choix n'est pas cosmetique : une candidature dans l'administration ou une
 * banque se lit mieux en serif, une candidature dans le numerique en sans.
 */
export const POLICES = [
  { id: "inter", name: "Inter", stack: "Inter, Arial, Helvetica, sans-serif", genre: "Sans-serif moderne" },
  { id: "sora", name: "Sora", stack: "Sora, Inter, Arial, sans-serif", genre: "Sans-serif marquee" },
  { id: "georgia", name: "Georgia", stack: "Georgia, 'Times New Roman', serif", genre: "Serif classique" },
  { id: "times", name: "Times", stack: "'Times New Roman', Times, serif", genre: "Serif administratif" },
  { id: "arial", name: "Arial", stack: "Arial, Helvetica, sans-serif", genre: "Neutre, partout" },
] as const;

export type PoliceId = (typeof POLICES)[number]["id"];

export const DEFAULT_POLICE: PoliceId = "inter";

export function isPoliceId(v: unknown): v is PoliceId {
  return POLICES.some((p) => p.id === v);
}

/** Pile de polices d'un CV. Repli sur Inter, jamais sur rien. */
export function policeDe(id: unknown): string {
  return (POLICES.find((p) => p.id === id) || POLICES[0]).stack;
}

export function isAccent(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

/**
 * Accent applique a un CV.
 *
 * Une chaine vide veut dire « la couleur du gabarit », et non « pas de
 * couleur » : changer de modele reprend alors sa teinte d'origine, au lieu de
 * trainer celle du modele precedent.
 */
export function accentDe(accent: string | undefined, template: TemplateId): string {
  return isAccent(accent) ? accent : TEMPLATE_ACCENT[template] || TEMPLATE_ACCENT.moderne;
}

/* ========================= Le contenu d'un CV ========================= */

export type Experience = {
  id: string;
  title: string;
  company: string;
  location: string;
  /** Format libre court : « Janvier 2021 ». Les mois sont des menus a l'ecran. */
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
};

/**
 * Certification ou attestation.
 *
 * Distincte de la formation : un diplome sanctionne des annees d etude, une
 * certification atteste d une competence precise et porte souvent une date de
 * validite. Les melanger dans la meme rubrique brouille les deux — et au
 * Senegal, une certification recente (Google, Microsoft, un centre de
 * formation) pese parfois plus lourd qu un diplome ancien.
 */
export type Certification = {
  id: string;
  name: string;
  /** Organisme qui l a delivree. */
  issuer: string;
  /** Annee d obtention, format libre court. */
  year: string;
};

export type Education = {
  id: string;
  degree: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
};

/**
 * Niveau de langue sur 5, et non le bareme europeen A1..C2 du modele d'origine.
 * Les maquettes affichent cinq pastilles : une echelle de 1 a 5 se dessine
 * directement, la ou le bareme demandait une table de correspondance dans
 * chaque gabarit.
 */
export type Langue = { id: string; name: string; level: 1 | 2 | 3 | 4 | 5 };

export type PersonalInfo = {
  firstName: string;
  lastName: string;
  /** Poste recherche — s'affiche sous le nom sur tous les gabarits. */
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  /**
   * Photo d'identite, URL publique du bucket `images`.
   *
   * Au Senegal un CV se presente presque toujours avec photo — c'est une
   * attente du recruteur, pas une coquetterie. Le cadrage impose le format
   * officiel 3,5 x 4,5 cm (voir PHOTO_RATIO).
   */
  photoUrl: string;
};

/** Format d'une photo d'identite : 3,5 x 4,5 cm. */
export const PHOTO_RATIO = 3.5 / 4.5;

export type CVContent = {
  personalInfo: PersonalInfo;
  /** Couleur d'accent choisie, ou "" pour celle du gabarit. */
  accent: string;
  /** Police de la feuille (voir POLICES). Vide = Inter, la valeur par defaut. */
  police: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  skills: string[];
  /**
   * Niveau declare pour une competence, de 1 a 5. Clef = le libelle exact.
   *
   * ── Pourquoi une table et non un champ sur la competence ────────────────
   * `skills` est un tableau de chaines lu par tous les gabarits. En
   * faire des objets aurait demande de reecrire quarante-huit endroits d'un
   * coup, pour un gain purement visuel : la table se pose a cote, et rien de
   * ce qui existe ne bouge.
   *
   * Facultatif, et c'est le point : sans niveau declare, le gabarit dessine
   * une etiquette et AUCUNE barre. Inventer un pourcentage reviendrait a
   * ecrire sur le CV de quelqu'un une affirmation sur son niveau qu'il n'a
   * jamais faite — devant un recruteur, c'est lui qui la porterait.
   *
   * Renommer une competence lui fait perdre son niveau : la barre disparait,
   * le libelle reste. Une perte visible et sans gravite, la ou un tableau
   * parallele aurait decale silencieusement tous les niveaux.
   */
  niveaux?: Record<string, 1 | 2 | 3 | 4 | 5>;
  languages: Langue[];
  /** Qualites illustrees en pied de CV sur le gabarit Moderne. */
  atouts: string[];
};

/** Niveau declare pour cette competence, ou 0 quand l'auteur n'en a pas mis. */
export function niveauCompetence(cv: CVContent, nom: string): 0 | 1 | 2 | 3 | 4 | 5 {
  const n = cv.niveaux?.[nom];
  return n && n >= 1 && n <= 5 ? n : 0;
}

/* =================== Lettre de motivation et demande =================== */

/**
 * Qui signe le courrier.
 *
 * Toujours le candidat, jamais Wanteermako : la maquette signait « Wanteermako
 * Editeur » avec un telephone et un e-mail du site, ce qui revient a envoyer
 * une candidature au nom de quelqu'un d'autre. Meme regle que pour les devis
 * de l'Espace Pro — aucune marque du site sur un document sortant.
 */
export type Expediteur = {
  name: string;
  phone: string;
  email: string;
  city: string;
};

export function expediteurVide(): Expediteur {
  return { name: "", phone: "", email: "", city: "" };
}

export type LettreContent = {
  from: Expediteur;
  company: string;
  targetJob: string;
  recruiter: string;
  /** Reponse a « Pourquoi ce poste ? » — la matiere premiere de la lettre. */
  why: string;
  /** Corps genere, modifiable ensuite a la main. */
  body: string;
};

export const DEMANDE_TYPES = ["emploi", "stage"] as const;
export type DemandeType = (typeof DEMANDE_TYPES)[number];

/**
 * Un courrier de demarche.
 *
 * ── Pourquoi ce n'est plus un formulaire fixe ────────────────────────────
 * La premiere version avait les champs d'une candidature — Entreprise,
 * Domaine, Disponibilite — et les affichait pour TOUTES les demarches. On
 * demandait donc « Entreprise » a quelqu'un qui declare la perte de sa carte
 * d'identite. Les champs viennent desormais de la fiche (lib/demarches.ts) :
 * chaque demarche pose ses propres questions, et elles seules.
 *
 * `reponses` est indexe par l'identifiant des questions de la fiche.
 */
export type DemandeContent = {
  from: Expediteur;
  /** Fiche a l'origine du courrier. "emploi" pour une candidature. */
  demarcheId: string;
  /** A qui le courrier est adresse — libelle propre a chaque demarche. */
  to: string;
  /** Objet du courrier, propose par la fiche puis modifiable. */
  objet: string;
  /** Reponses aux questions de la fiche. */
  reponses: Record<string, string>;
  body: string;
};

export type CareerContent = CVContent | LettreContent | DemandeContent;

/* ============================== Le genre ============================== */

/**
 * Genre du redacteur, uniquement pour accorder le texte genere.
 *
 * Les maquettes montraient « Motive-e, rigoureux-se, dote-e » : le point median
 * dans une lettre de candidature a Dakar se lit comme un texte casse et dessert
 * le candidat. On accorde donc pour de vrai, et quand on ne sait pas, on
 * demande a l'IA de tourner la phrase autrement plutot que de deviner.
 */
export const GENRES = ["f", "m", "?"] as const;
export type Genre = (typeof GENRES)[number];

export function consigneAccord(genre: Genre): string {
  if (genre === "f") return "Le candidat est une FEMME : accorde tous les adjectifs au feminin.";
  if (genre === "m") return "Le candidat est un HOMME : accorde tous les adjectifs au masculin.";
  return (
    "Le genre du candidat est INCONNU : tourne chaque phrase pour eviter tout accord " +
    "(« ma rigueur », « mon sens de l'organisation »). N'utilise JAMAIS de point median " +
    "ni de parentheses du type « motive(e) »."
  );
}

/* ============================== Le quota ============================== */

/**
 * Documents offerts a un compte gratuit, par mois.
 *
 * Un seul : de quoi produire son CV, le telecharger, le montrer — assez pour
 * juger le produit en conditions reelles, pas assez pour s'en servir comme
 * outil de travail. C'est la porte d'entree, et elle doit rester ouverte :
 * quelqu'un qui ne peut rien produire ne reviendra pas.
 */
export const QUOTA_DOCUMENTS_GRATUIT = (() => {
  const n = Number(process.env.CARRIERE_DOCS_GRATUIT);
  return Number.isFinite(n) && n > 0 ? n : 1;
})();

/**
 * Documents inclus dans l'abonnement, par mois.
 *
 * Cinq : une candidature complete fait deja trois pieces (CV, lettre,
 * demande), et il en reste pour une seconde. Au-dela, c'est un usage
 * professionnel qui justifiera un palier superieur le jour venu.
 */
export const QUOTA_DOCUMENTS_PRO = (() => {
  const n = Number(process.env.CARRIERE_DOCS_PRO);
  return Number.isFinite(n) && n > 0 ? n : 5;
})();

/**
 * Garde-fou de redaction, par mois et par compte.
 *
 * Le peage porte sur les DOCUMENTS, pas sur les appels a l'IA : une fois ton
 * document ouvert, tu rediges et tu recommences autant que tu veux. Ce
 * plafond tres haut n'existe que pour arreter un script — un humain ne
 * l'atteint jamais.
 */
export const PLAFOND_REDACTIONS = (() => {
  const n = Number(process.env.CARRIERE_PLAFOND_IA);
  return Number.isFinite(n) && n > 0 ? n : 60;
})();

/* ============================= Utilitaires ============================= */

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function fullName(p: PersonalInfo): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

/**
 * Extrait factuel du CV, a joindre aux demandes de redaction.
 *
 * L'assistant ecrivait jusqu'ici a l'aveugle : pour le PROFIL il ne recevait
 * que le poste vise et la ville, pour une LETTRE il ne voyait pas le CV du
 * tout. Il produisait donc des textes justes mais interchangeables — « motive
 * et rigoureux » — alors que l'utilisateur venait de saisir ses trois
 * experiences et ses diplomes juste au-dessus.
 *
 * On ne transmet que ce qui a ete DECLARE, jamais de deduction : le modele
 * reste tenu de n'inventer aucun fait, il a simplement de quoi s'appuyer.
 * Le tout est plafonne, un CV bavard ne doit pas gonfler la requete.
 */
export function resumeDossier(cv: CVContent, maxSignes = 1800): string {
  const p = cv.personalInfo;
  const lignes: string[] = [];

  if (p.title.trim()) lignes.push(`Poste vise : ${p.title.trim()}`);
  if (p.location.trim()) lignes.push(`Ville : ${p.location.trim()}`);

  const exp = cv.experiences.filter((e) => e.title.trim() || e.company.trim());
  if (exp.length) {
    lignes.push("Experiences declarees :");
    for (const e of exp.slice(0, 5)) {
      const tete = [e.title.trim(), e.company.trim()].filter(Boolean).join(" chez ");
      const quand = periode(e);
      lignes.push(`- ${tete}${quand ? ` (${quand})` : ""}`);
      for (const b of e.bullets.filter((x) => x.trim()).slice(0, 3)) lignes.push(`  · ${b.trim()}`);
    }
  }

  const form = cv.education.filter((f) => f.degree.trim() || f.school.trim());
  if (form.length) {
    lignes.push("Formation declaree :");
    for (const f of form.slice(0, 4)) {
      const tete = [f.degree.trim(), f.school.trim()].filter(Boolean).join(", ");
      const quand = periode({ ...f, isCurrent: false });
      lignes.push(`- ${tete}${quand ? ` (${quand})` : ""}`);
    }
  }

  const certs = (cv.certifications || []).filter((c) => c.name.trim());
  if (certs.length) {
    lignes.push("Certifications :");
    for (const c of certs.slice(0, 6)) {
      const suite = [c.issuer.trim(), c.year.trim()].filter(Boolean).join(", ");
      lignes.push(`- ${c.name.trim()}${suite ? ` (${suite})` : ""}`);
    }
  }

  const comp = cv.skills.filter((s) => s.trim());
  if (comp.length) lignes.push(`Competences declarees : ${comp.slice(0, 20).join(", ")}`);

  const langues = cv.languages.filter((l) => l.name.trim());
  if (langues.length) {
    lignes.push(`Langues : ${langues.map((l) => `${l.name.trim()} (${l.level}/5)`).join(", ")}`);
  }

  const atouts = cv.atouts.filter((a) => a.trim());
  if (atouts.length) lignes.push(`Atouts : ${atouts.slice(0, 10).join(", ")}`);

  const texte = lignes.join("\n");
  return texte.length > maxSignes ? `${texte.slice(0, maxSignes)}…` : texte;
}

export function initials(p: PersonalInfo): string {
  const a = p.firstName?.trim()[0] || "";
  const b = p.lastName?.trim()[0] || "";
  return (a + b).toUpperCase() || "??";
}

export function periode(e: { startDate: string; endDate: string; isCurrent?: boolean }): string {
  const fin = e.isCurrent ? "Present" : e.endDate;
  return [e.startDate, fin].filter(Boolean).join(" - ");
}

const MOIS = [
  "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
];

/** Les douze mois, tels qu'affiches dans les menus deroulants de l'editeur. */
export const MOIS_LABELS = MOIS.map((m) => m.charAt(0).toUpperCase() + m.slice(1));

/**
 * Ligne de date d'un courrier : « Thies, le 6 septembre 2026 ».
 *
 * Toujours la date du jour — la maquette portait « le 26 mai 2024 » en dur,
 * ce qui date un courrier de deux ans avant meme qu'il soit envoye.
 */
export function ligneDate(ville: string, d = new Date()): string {
  const jour = d.getDate();
  const date = `le ${jour === 1 ? "1er" : jour} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
  return ville.trim() ? `${ville.trim()}, ${date}` : date.charAt(0).toUpperCase() + date.slice(1);
}

/* ========================== Documents vierges ========================== */

export function cvVide(): CVContent {
  return {
    personalInfo: {
      firstName: "", lastName: "", title: "", email: "", phone: "",
      location: "", linkedin: "", photoUrl: "",
    },
    accent: "",
    police: "",
    summary: "",
    experiences: [],
    education: [],
    certifications: [],
    skills: [],
    languages: [],
    atouts: [],
  };
}

export function lettreVide(): LettreContent {
  return { from: expediteurVide(), company: "", targetJob: "", recruiter: "", why: "", body: "" };
}

export function demandeVide(): DemandeContent {
  return { from: expediteurVide(), demarcheId: "emploi", to: "", objet: "", reponses: {}, body: "" };
}

export function contenuVide(kind: CareerKind): CareerContent {
  if (kind === "cv") return cvVide();
  if (kind === "lettre") return lettreVide();
  return demandeVide();
}

/**
 * Ce document ne contient-il encore RIEN de saisi ?
 *
 * ── Le bug que cette regle corrige ───────────────────────────────────────
 * L'enregistrement de Ma Carriere est automatique, 1,2 s apres un changement.
 * Il partait des le montage de l'editeur : ouvrir « Creer mon CV » pour
 * regarder les modeles, puis ressortir, creait un CV vide. Sur un plan gratuit
 * a un document par mois, le quota etait consomme sans qu'une seule lettre ait
 * ete tapee — et « Mes documents » se remplissait de CV sans nom.
 *
 * La regle vit ICI et non dans l'ecran : le serveur et le navigateur doivent
 * repondre la MEME chose. Deux definitions auraient fini par diverger, et le
 * navigateur aurait envoye sans fin un document que le serveur refuse.
 *
 * ── Ce qui ne compte pas comme du contenu ────────────────────────────────
 * Le modele, la couleur, la police, et le `demarcheId` d'un courrier sont des
 * valeurs par defaut ou des choix d'habillage, pas une saisie. Les compter
 * recreerait exactement le document fantome : choisir un modele suffirait.
 */
export function documentVide(kind: CareerKind, c: CareerContent): boolean {
  const plein = (v: unknown): boolean => typeof v === "string" && v.trim() !== "";
  /** Une ligne de liste porte-t-elle au moins un champ rempli ? */
  const lignes = (arr: unknown, champs: string[]): boolean =>
    Array.isArray(arr) &&
    arr.some((o) => champs.some((f) => plein((o as Record<string, unknown>)?.[f])));

  if (kind === "cv") {
    const cv = c as CVContent;
    const p = cv.personalInfo || ({} as CVContent["personalInfo"]);
    const experiences =
      Array.isArray(cv.experiences) &&
      cv.experiences.some(
        (e) =>
          plein(e?.title) || plein(e?.company) || plein(e?.location) ||
          plein(e?.startDate) || plein(e?.endDate) ||
          (Array.isArray(e?.bullets) && e.bullets.some(plein)),
      );

    return !(
      plein(p.firstName) || plein(p.lastName) || plein(p.title) ||
      plein(p.email) || plein(p.phone) || plein(p.location) ||
      plein(p.linkedin) || plein(p.photoUrl) ||
      plein(cv.summary) ||
      experiences ||
      lignes(cv.education, ["degree", "school", "location", "startDate", "endDate"]) ||
      lignes(cv.certifications, ["name", "issuer", "year"]) ||
      lignes(cv.languages, ["name"]) ||
      (Array.isArray(cv.skills) && cv.skills.some(plein)) ||
      (Array.isArray(cv.atouts) && cv.atouts.some(plein))
    );
  }

  if (kind === "lettre") {
    const l = c as LettreContent;
    const f = l.from || expediteurVide();
    return !(
      plein(f.name) || plein(f.phone) || plein(f.email) || plein(f.city) ||
      plein(l.company) || plein(l.targetJob) || plein(l.recruiter) ||
      plein(l.why) || plein(l.body)
    );
  }

  const d = c as DemandeContent;
  const f = d.from || expediteurVide();
  return !(
    plein(f.name) || plein(f.phone) || plein(f.email) || plein(f.city) ||
    plein(d.to) || plein(d.objet) || plein(d.body) ||
    Object.values(d.reponses || {}).some(plein)
  );
}

/** Titre par defaut d'un document, tel qu'il apparait dans « Mes documents ». */
export function titreParDefaut(kind: CareerKind, c: CareerContent): string {
  if (kind === "cv") {
    const poste = (c as CVContent).personalInfo.title.trim();
    return poste ? `CV — ${poste}` : "CV";
  }
  if (kind === "lettre") {
    const entreprise = (c as LettreContent).company.trim();
    return entreprise ? `Lettre de motivation — ${entreprise}` : "Lettre de motivation";
  }
  const d = c as DemandeContent;
  // L'objet fait un bien meilleur titre que le destinataire : « Declaration
  // de perte — carte d'identite » se retrouve, « Commissariat » non.
  return d.objet.trim() || d.to.trim() || "Courrier";
}
