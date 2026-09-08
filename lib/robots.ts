// Lecture de robots.txt, avant d'aller chercher quoi que ce soit.
//
// ── Pourquoi ce fichier existe ───────────────────────────────────────────
// Meme sur des donnees publiees POUR etre lues par des machines, un site
// garde le droit de dire quelles pages il ne veut pas voir parcourues.
// robots.txt est l'endroit ou il le dit. L'ignorer, c'est passer d'un
// programme qui lit ce qu'on lui offre a un programme qui se sert.
//
// L'implementation est volontairement stricte dans le doute : robots.txt
// illisible ou hors service, on s'abstient. Un site injoignable ne vaut pas
// une autorisation.

/** Ce que nos requetes annoncent. Un robot qui ne se nomme pas se cache. */
export const AGENT = "WanteermakoBot/1.0 (+https://wanteermako.com)";

type Regles = { interdits: string[]; autorises: string[] };

/** Une ligne « Disallow: /chemin » → le chemin, ou null. */
function directive(ligne: string, nom: string): string | null {
  const m = ligne.match(new RegExp(`^\\s*${nom}\\s*:\\s*(.*)$`, "i"));
  if (!m) return null;
  return m[1].split("#")[0].trim();
}

/**
 * Extrait les regles qui NOUS concernent.
 *
 * Un bloc nommement adresse a notre agent l'emporte sur le bloc generique
 * `*` — c'est la regle du protocole, et c'est aussi la seule facon pour un
 * site de nous ouvrir ou de nous fermer sa porte en particulier.
 */
export function lireRobots(txt: string, agent = AGENT): Regles {
  const nom = agent.split("/")[0].toLowerCase();
  const generique: Regles = { interdits: [], autorises: [] };
  const propre: Regles = { interdits: [], autorises: [] };

  let cible: Regles | null = null;
  let dansUnGroupe = false;

  for (const ligne of txt.split(/\r?\n/)) {
    const ua = directive(ligne, "user-agent");
    if (ua !== null) {
      // Plusieurs `User-agent` d'affilee partagent le meme bloc de regles.
      if (!dansUnGroupe) cible = null;
      dansUnGroupe = true;
      const v = ua.toLowerCase();
      if (v === "*") cible = cible === propre ? propre : generique;
      else if (v.includes(nom)) cible = propre;
      continue;
    }

    const d = directive(ligne, "disallow");
    const a = directive(ligne, "allow");
    if (d === null && a === null) continue;
    dansUnGroupe = false;
    if (!cible) continue;
    // « Disallow: » vide veut dire « rien n'est interdit » : on l'ignore.
    if (d) cible.interdits.push(d);
    if (a) cible.autorises.push(a);
  }

  return propre.interdits.length || propre.autorises.length ? propre : generique;
}

/** Un chemin correspond-il a un motif robots.txt (`*` et `$` compris) ? */
function correspond(chemin: string, motif: string): boolean {
  const fin = motif.endsWith("$");
  const corps = fin ? motif.slice(0, -1) : motif;
  const re = new RegExp(
    "^" + corps.split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + (fin ? "$" : ""),
  );
  return re.test(chemin);
}

/**
 * Le parcours de cette adresse est-il autorise ?
 *
 * `Allow` l'emporte sur `Disallow` quand il est plus precis — c'est ainsi
 * qu'un site interdit un dossier entier tout en ouvrant une page dedans.
 */
export function autorise(regles: Regles, url: string): boolean {
  let chemin: string;
  try {
    const u = new URL(url);
    chemin = u.pathname + u.search;
  } catch {
    return false;
  }

  const plusLong = (motifs: string[]) =>
    motifs.filter((m) => correspond(chemin, m)).reduce((max, m) => Math.max(max, m.length), -1);

  const interdit = plusLong(regles.interdits);
  if (interdit < 0) return true;
  return plusLong(regles.autorises) >= interdit;
}

/**
 * Va chercher robots.txt et repond : peut-on lire cette page ?
 *
 * Le resultat est mis en cache par hote pendant l'appel, sinon lire vingt
 * offres d'un meme site demanderait vingt fois le meme fichier.
 */
export async function peutParcourir(
  url: string,
  cache: Map<string, Regles | null>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; raison?: string }> {
  let hote: string;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { ok: false, raison: "Adresse non http(s)." };
    }
    hote = u.origin;
  } catch {
    return { ok: false, raison: "Adresse invalide." };
  }

  if (!cache.has(hote)) {
    try {
      const r = await fetchImpl(`${hote}/robots.txt`, {
        headers: { "User-Agent": AGENT },
        signal: AbortSignal.timeout(10000),
      });
      // 404 : pas de robots.txt, donc aucune restriction annoncee.
      cache.set(hote, r.status === 404 ? { interdits: [], autorises: [] } : r.ok ? lireRobots(await r.text()) : null);
    } catch {
      cache.set(hote, null);
    }
  }

  const regles = cache.get(hote);
  // Dans le doute, on s'abstient : un robots.txt illisible n'est pas un
  // feu vert, c'est une absence de reponse.
  if (!regles) return { ok: false, raison: "robots.txt illisible — abstention." };
  if (!autorise(regles, url)) return { ok: false, raison: "Interdit par robots.txt." };
  return { ok: true };
}
