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
  { id: "executif", name: "Executif", pro: true },
  { id: "africain", name: "Africain", pro: false },
] as const;

export type TemplateId = (typeof CV_TEMPLATES)[number]["id"];

export const DEFAULT_TEMPLATE: TemplateId = "moderne";

export function isTemplateId(v: unknown): v is TemplateId {
  return CV_TEMPLATES.some((t) => t.id === v);
}

/** Un gabarit reserve aux abonnes ? Sert cote serveur autant qu'a l'ecran. */
export function templateIsPro(id: string): boolean {
  return CV_TEMPLATES.find((t) => t.id === id)?.pro === true;
}

/* ============================ Les couleurs ============================ */

/**
 * Palette d'accent, commune aux quatre gabarits.
 *
 * Quatre mises en page multipliees par six couleurs se lisent comme
 * vingt-quatre modeles, pour le prix d'une variable. Les teintes sont toutes
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
  executif: "#0F172A",
  africain: "#14532D",
};

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
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: string[];
  languages: Langue[];
  /** Qualites illustrees en pied de CV sur le gabarit Moderne. */
  atouts: string[];
};

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
 * Passages de generation offerts a un compte gratuit, par mois.
 *
 * On compte les PASSAGES et non les documents : l'assistant produit un CV et
 * une lettre d'un seul coup, et « Recommencer avec l'IA » relance le tout.
 * Compter par document aurait laisse une seule relance consommer deux unites,
 * ce que personne ne comprend en regardant l'ecran.
 *
 * Trois : de quoi produire un dossier, le relire et le refaire une fois —
 * assez pour juger la qualite, pas assez pour s'en servir tous les jours.
 *
 * CARRIERE_QUOTA_GRATUIT desserre le plafond sans toucher au code (il faut
 * tout de meme un redeploiement pour que l'hebergeur relise la variable).
 */
export const QUOTA_GRATUIT_CARRIERE = (() => {
  const n = Number(process.env.CARRIERE_QUOTA_GRATUIT);
  return Number.isFinite(n) && n > 0 ? n : 3;
})();

/* ============================= Utilitaires ============================= */

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function fullName(p: PersonalInfo): string {
  return `${p.firstName} ${p.lastName}`.trim();
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
    summary: "",
    experiences: [],
    education: [],
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
