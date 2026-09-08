// Lecture des offres d'emploi publiees en donnees structurees `JobPosting`.
//
// ── Pourquoi ce format, et pas un scraper ────────────────────────────────
// Les sites d'emploi glissent dans leur HTML un bloc
// `<script type="application/ld+json">` decrivant l'offre au format
// schema.org. Ils le font EXPRES pour etre lus par des machines — c'est ce
// qui leur vaut d'apparaitre dans Google for Jobs. Lire ce bloc, c'est se
// servir d'une porte ouverte volontairement ; deduire le contenu de la mise
// en page, c'est forcer une fenetre.
//
// Consequence pratique : ce module ne devine RIEN. Si un site ne publie pas
// de `JobPosting`, il ne rend rien, et c'est le bon comportement — mieux vaut
// zero offre qu'une offre inventee a partir d'un titre mal decoupe.
//
// ── Ce qu'on reprend, et ce qu'on ne reprend pas ─────────────────────────
// Un EXTRAIT de la description, jamais le texte entier. L'offre appartient a
// l'entreprise qui l'a redigee : on en donne assez pour decider si elle nous
// concerne, et on renvoie chez l'editeur pour le reste. Recopier l'integralite
// serait un probleme de droit d'auteur, et du contenu duplique que Google
// declasse — les deux a la fois.

/** Longueur de l'extrait conserve. Assez pour juger, trop peu pour se substituer. */
const EXTRAIT_MAX = 600;

export type OffreEmploi = {
  titre: string;
  entreprise: string;
  /** « Dakar », « Dakar, Senegal », ou « Teletravail ». */
  lieu: string;
  /** Temps plein, Temps partiel, Stage… en clair. */
  contrat: string;
  /** Extrait de la description, en texte brut. */
  extrait: string;
  /** Remuneration telle qu'annoncee, ou chaine vide. */
  salaire: string;
  /** Publiee le, au format ISO ou chaine vide. */
  publiee: string;
  /** Date limite annoncee (`validThrough`), ou chaine vide. */
  expire: string;
  /** L'adresse de l'offre chez l'editeur. C'est la qu'on renvoie. */
  source: string;
  /** Nom de domaine de la source, pour l'attribution affichee. */
  domaine: string;
};

/* ========================= Extraction du JSON-LD ========================= */

/**
 * Tous les objets JSON-LD d'une page.
 *
 * Un bloc invalide n'interrompt rien : les pages reelles en contiennent
 * souvent plusieurs, et un seul mal forme ne doit pas faire perdre les autres.
 */
export function extraireJsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html)) !== null) {
    const brut = m[1].trim();
    if (!brut) continue;
    try {
      out.push(JSON.parse(brut));
    } catch {
      /* bloc illisible : on passe au suivant */
    }
  }
  return out;
}

/** Un objet porte-t-il ce type schema.org ? `@type` peut etre une liste. */
function estDeType(o: any, type: string): boolean {
  const t = o?.["@type"];
  if (typeof t === "string") return t.toLowerCase() === type.toLowerCase();
  if (Array.isArray(t)) return t.some((x) => String(x).toLowerCase() === type.toLowerCase());
  return false;
}

/**
 * Les `JobPosting` caches dans un ensemble d'objets JSON-LD.
 *
 * On descend dans `@graph` et dans les tableaux : les sites imbriquent
 * volontiers l'offre au milieu d'un fil d'Ariane et d'une fiche
 * d'organisation, et une lecture a plat n'en trouverait aucune.
 */
export function trouverJobPostings(objets: unknown[]): any[] {
  const trouves: any[] = [];

  const visiter = (n: unknown, profondeur = 0) => {
    if (!n || typeof n !== "object" || profondeur > 6) return;
    if (Array.isArray(n)) {
      for (const x of n) visiter(x, profondeur + 1);
      return;
    }
    const o = n as Record<string, unknown>;
    if (estDeType(o, "JobPosting")) trouves.push(o);
    if (Array.isArray(o["@graph"])) visiter(o["@graph"], profondeur + 1);
  };

  visiter(objets);
  return trouves;
}

/* ============================ Normalisation ============================ */

const CONTRATS: Record<string, string> = {
  FULL_TIME: "Temps plein",
  PART_TIME: "Temps partiel",
  CONTRACTOR: "Prestation",
  TEMPORARY: "Temporaire",
  INTERN: "Stage",
  VOLUNTEER: "Benevolat",
  PER_DIEM: "Journalier",
  OTHER: "Autre",
};

/** Texte brut a partir d'un fragment HTML : les descriptions en sont pleines. */
export function texteBrut(html: unknown): string {
  if (typeof html !== "string") return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const chaine = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Premiere valeur exploitable d'un champ qui peut etre seul ou en tableau. */
function premier(v: unknown): any {
  return Array.isArray(v) ? v[0] : v;
}

function lieuDe(o: any): string {
  // Une offre entierement a distance le declare ainsi, et n'a souvent aucune
  // adresse. Afficher « lieu inconnu » serait faux : il est connu, c'est
  // « n'importe ou ».
  const type = chaine(o?.jobLocationType).toUpperCase();
  if (type === "TELECOMMUTE") return "Teletravail";

  const adresse = premier(o?.jobLocation)?.address;
  const ville = chaine(adresse?.addressLocality);
  const region = chaine(adresse?.addressRegion);
  const pays = chaine(adresse?.addressCountry) || chaine(adresse?.addressCountry?.name);

  return [ville, region || pays].filter(Boolean).join(", ");
}

function salaireDe(o: any): string {
  const s = o?.baseSalary;
  if (!s) return "";
  const v = s.value || s;
  const min = Number(v?.minValue), max = Number(v?.maxValue), val = Number(v?.value);
  const devise = chaine(s.currency) || chaine(v?.currency) || "";
  const unite = chaine(v?.unitText).toLowerCase();
  const periode = unite === "hour" ? "/heure" : unite === "day" ? "/jour"
    : unite === "week" ? "/semaine" : unite === "month" ? "/mois"
    : unite === "year" ? "/an" : "";

  const nombre = (n: number) => n.toLocaleString("fr-FR");
  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
    return `${nombre(min)} – ${nombre(max)} ${devise}${periode}`.trim();
  }
  if (Number.isFinite(val) && val > 0) return `${nombre(val)} ${devise}${periode}`.trim();
  return "";
}

function domaineDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Une offre brute ramenee a la forme du site.
 *
 * `sourceUrl` est l'adresse de la page lue. Elle sert de repli quand l'offre
 * ne porte pas d'URL propre — la majorite des cas : le champ `url` est
 * facultatif dans schema.org, et rarement rempli.
 */
export function normaliserOffre(brut: any, sourceUrl: string): OffreEmploi | null {
  const titre = chaine(brut?.title);
  if (!titre) return null; // Sans intitule, l'offre n'est pas exploitable.

  const source = chaine(brut?.url) || sourceUrl;
  const description = texteBrut(brut?.description);
  const extrait =
    description.length > EXTRAIT_MAX ? description.slice(0, EXTRAIT_MAX).trimEnd() + "…" : description;

  const type = chaine(premier(brut?.employmentType)).toUpperCase().replace(/[\s-]/g, "_");

  return {
    titre,
    entreprise: chaine(premier(brut?.hiringOrganization)?.name),
    lieu: lieuDe(brut),
    contrat: CONTRATS[type] || "",
    extrait,
    salaire: salaireDe(brut),
    publiee: chaine(brut?.datePosted),
    expire: chaine(brut?.validThrough),
    source,
    domaine: domaineDe(source),
  };
}

/**
 * L'offre a-t-elle passe sa date limite ?
 *
 * Sans date annoncee, on repond NON : beaucoup d'offres n'en portent pas, et
 * les ecarter toutes viderait la liste. C'est le seul cas ou l'on prefere une
 * offre peut-etre perimee a une absence d'offre — mais c'est aussi pourquoi
 * l'import passe par une relecture humaine.
 */
export function offreExpiree(o: OffreEmploi, maintenant = Date.now()): boolean {
  if (!o.expire) return false;
  const t = new Date(o.expire).getTime();
  return Number.isFinite(t) && t < maintenant;
}

/**
 * Toutes les offres d'une page, prêtes a etre relues.
 *
 * Les doublons sont ecartes sur le couple titre + entreprise : une meme offre
 * apparait souvent deux fois, une fois dans le corps et une fois dans un bloc
 * « offres similaires ».
 */
export function lireOffres(html: string, sourceUrl: string): OffreEmploi[] {
  const brutes = trouverJobPostings(extraireJsonLd(html));
  const vues = new Set<string>();
  const out: OffreEmploi[] = [];

  for (const b of brutes) {
    const o = normaliserOffre(b, sourceUrl);
    if (!o) continue;
    const cle = `${o.titre.toLowerCase()}|${o.entreprise.toLowerCase()}`;
    if (vues.has(cle)) continue;
    vues.add(cle);
    out.push(o);
  }
  return out;
}
