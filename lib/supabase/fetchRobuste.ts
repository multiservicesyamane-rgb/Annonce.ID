/**
 * Un `fetch` qui reessaie quand la CONNEXION n'a pas pu s'etablir.
 *
 * ── Le probleme observe ──────────────────────────────────────────────────
 * La connexion echouait par intermittence, avec cette trace dans le journal :
 *
 *     GET /auth/callback?code=… 307
 *     [TypeError: fetch failed] cause: ConnectTimeoutError
 *
 * Mesure faite depuis cette machine, cinq appels de suite vers Supabase :
 * 810 ms, 7 427 ms, 176 ms, 79 ms, 85 ms. Un appel sur cinq depasse largement
 * les autres, et le premier apres un repos peut monter a 15 s — le temps
 * d'etablir DNS puis TLS a froid.
 *
 * Or Node coupe la connexion a 10 s (delai par defaut d'undici), sans appel.
 * L'echange du code d'authentification tombait donc dans le vide, et
 * l'utilisateur revenait sur la page de connexion sans explication.
 *
 * ── Pourquoi reessayer est SUR ici ───────────────────────────────────────
 * On ne rejoue QUE les erreurs qui surviennent avant l'envoi du moindre
 * octet : delai de connexion depasse, DNS introuvable, port ferme. Dans ces
 * cas-la, le serveur n'a rien recu — rejouer ne peut rien creer deux fois.
 *
 * `ECONNRESET` est volontairement EXCLU : la coupure peut survenir apres
 * l'envoi de la requete, et rejouer un POST pourrait alors creer deux
 * documents, ou encaisser deux fois. Mieux vaut une erreur honnete qu'un
 * doublon silencieux.
 *
 * Une reponse HTTP, meme 401 ou 500, n'est jamais rejouee : c'est une
 * reponse, pas une panne de reseau.
 *
 * ── Ce que ca ne repare pas ──────────────────────────────────────────────
 * Si le reseau est reellement coupe, les trois tentatives echouent et l'erreur
 * remonte comme avant. Ce garde-fou ne masque rien : il rattrape une lenteur
 * passagere, il n'invente pas une connexion.
 */

/** Erreurs survenant AVANT l'envoi de la requete — donc rejouables sans risque. */
const AVANT_ENVOI = new Set([
  "UND_ERR_CONNECT_TIMEOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

type Panne = { code?: string; name?: string; errors?: unknown[] };

function estAvantEnvoi(p: Panne | undefined): boolean {
  if (!p) return false;
  if (p.name === "ConnectTimeoutError") return true;
  if (p.code && AVANT_ENVOI.has(p.code)) return true;
  // AggregateError : Node essaie chaque adresse resolue — IPv6 puis IPv4 —
  // et regroupe les echecs. Le code n'est alors PAS sur la cause elle-meme
  // mais sur chacune des erreurs internes. Sans ce cas, un serveur qui refuse
  // la connexion n'etait jamais rejoue : le test l'a montre, une seule
  // tentative au lieu de trois.
  if (Array.isArray(p.errors)) {
    return p.errors.some((sous) => estAvantEnvoi(sous as Panne));
  }
  return false;
}

function connexionJamaisEtablie(e: unknown): boolean {
  return estAvantEnvoi((e as { cause?: Panne })?.cause);
}

/**
 * Trois tentatives, avec une pause qui triple : 0 ms, 300 ms, 900 ms.
 *
 * La deuxieme aboutit presque toujours — la resolution DNS et la negociation
 * TLS sont alors en cache, et ce qui prenait quinze secondes en prend deux
 * cents millisecondes.
 */
export function fetchRobuste(essais = 3): typeof fetch {
  return async (entree: any, options?: any) => {
    let derniere: unknown;
    for (let i = 0; i < essais; i++) {
      try {
        return await fetch(entree, options);
      } catch (e) {
        derniere = e;
        if (!connexionJamaisEtablie(e)) throw e;
        if (i < essais - 1) {
          await new Promise((r) => setTimeout(r, 300 * 3 ** i));
        }
      }
    }
    throw derniere;
  };
}
