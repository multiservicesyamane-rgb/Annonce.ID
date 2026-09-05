/**
 * Journal des campagnes : qui a recu quoi, et qui ne doit plus rien recevoir.
 *
 * Un envoi de masse ne se decide pas deux fois de la meme facon. Sans memoire,
 * on renvoie le meme visuel aux memes personnes et on ecrit a des adresses qui
 * ont deja rebondi — c'est exactement ce qui brule la reputation du domaine, et
 * donc les factures de l'Espace Pro qui partent par le meme expediteur.
 *
 * Le journal repond a trois questions avant chaque envoi :
 *   1. cette adresse est-elle morte ?          -> `bannis`, jamais rappeles
 *   2. a-t-elle deja vu ce message ?           -> `envois`, modele ET visuel
 *   3. l'a-t-on sollicitee trop recemment ?    -> `envois`, date du dernier
 *
 * `reportes` garde les adresses qui ont rebondi temporairement (boite pleine,
 * ou serveur qui refuse l'IP partagee Brevo). On ne les banni pas — on les
 * fait passer en dernier.
 *
 * Le fichier contient des adresses de prospects : il n'entre pas dans git.
 *
 * Usage :
 *   node scripts/journal-campagnes.mjs            etat du journal
 *   node scripts/journal-campagnes.mjs --init     reconstruit depuis Brevo
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const FICHIER = fileURLToPath(new URL("./journal-campagnes.json", import.meta.url));

export const jour = (d = new Date()) => d.toISOString().slice(0, 10);

const VIDE = { version: 1, maj: null, bannis: {}, reportes: {}, envois: {} };

export function charger() {
  try {
    return { ...VIDE, ...JSON.parse(fs.readFileSync(FICHIER, "utf8")) };
  } catch {
    return { ...VIDE };
  }
}

export function sauver(j) {
  j.maj = new Date().toISOString();
  fs.writeFileSync(FICHIER, JSON.stringify(j, null, 2), "utf8");
}

const cle = (e) => String(e || "").trim().toLowerCase();

export const estBanni = (j, email) => Boolean(j.bannis[cle(email)]);
export const lignes = (j, email) => j.envois[cle(email)] || [];
export const nbEnvois = (j, email) => lignes(j, email).length;

export function dernierContact(j, email) {
  const l = lignes(j, email);
  return l.length ? l.map((e) => e.date).sort().pop() : null;
}

/** Le visuel compte autant que le texte : deux modeles peuvent partager l'affiche. */
export function dejaVu(j, email, modele, image) {
  return lignes(j, email).some((e) => e.modele === modele || (image && e.image === image));
}

export function envoisDuJour(j, d = jour(), pub = null) {
  let n = 0;
  for (const l of Object.values(j.envois)) {
    n += l.filter((e) => e.date === d && (!pub || e.public === pub)).length;
  }
  return n;
}

export function noter(j, { email, public: pub }, modele, image, d = jour()) {
  const k = cle(email);
  (j.envois[k] ||= []).push({ date: d, modele, image, public: pub });
  delete j.reportes[k];
}

const ecart = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

/** Petit hachage stable : il fait tourner la tete de liste d'un jour a l'autre. */
function graine(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Trie le vivier du plus legitime au moins legitime pour l'envoi du jour.
 * A nombre d'envois egal, l'ordre change chaque jour : sans cela on ecrirait
 * toujours aux memes vingt premiers noms de la liste.
 */
export function classer(vivier, j, { modele, image, repos = 7, d = jour() }) {
  const ecartes = { bannis: [], dejaVu: [], repos: [] };
  const gardes = [];
  for (const p of vivier) {
    if (estBanni(j, p.email)) {
      ecartes.bannis.push(p.email);
      continue;
    }
    if (dejaVu(j, p.email, modele, image)) {
      ecartes.dejaVu.push(p.email);
      continue;
    }
    const dc = dernierContact(j, p.email);
    if (dc && ecart(dc, d) < repos) {
      ecartes.repos.push(p.email + " (" + dc + ")");
      continue;
    }
    gardes.push({ ...p, _n: nbEnvois(j, p.email), _dc: dc || "0000-00-00", _r: j.reportes[cle(p.email)] ? 1 : 0 });
  }
  gardes.sort(
    (a, b) =>
      a._n - b._n ||
      a._r - b._r ||
      a._dc.localeCompare(b._dc) ||
      graine(a.email + d) - graine(b.email + d)
  );
  return { gardes, ecartes };
}

/* ============================ Reconstruction ============================= */

function env() {
  return Object.fromEntries(
    fs
      .readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
  );
}

async function evenements(H, type, debut, fin) {
  const out = [];
  for (let offset = 0; ; offset += 2500) {
    const u = `https://api.brevo.com/v3/smtp/statistics/events?limit=2500&offset=${offset}&startDate=${debut}&endDate=${fin}&event=${type}`;
    const r = await fetch(u, { headers: H });
    if (!r.ok) throw new Error("Brevo " + type + " " + r.status);
    const l = (await r.json()).events || [];
    out.push(...l);
    if (l.length < 2500) return out;
  }
}

/**
 * Reconstruit le journal a partir de ce que Brevo a reellement fait. La base
 * `prospects` ne retient qu'un compteur : elle ne dit ni quel message est parti,
 * ni quelles adresses sont mortes.
 */
async function init(debut, fin) {
  const E = env();
  const H = { "api-key": E.BREVO_API_KEY, Accept: "application/json" };
  const j = charger();

  for (const type of ["hardBounces", "blocked", "invalid", "unsubscribed"]) {
    for (const e of await evenements(H, type, debut, fin)) {
      j.bannis[cle(e.email)] = type + (e.reason ? " : " + String(e.reason).split("\n")[0].slice(0, 120) : "");
    }
  }
  for (const e of await evenements(H, "softBounces", debut, fin)) {
    if (!estBanni(j, e.email)) j.reportes[cle(e.email)] = String(e.date).slice(0, 10);
  }

  // Une adresse qui recoit quatre messages dans la meme journee n'est pas une
  // cible : c'est la boite de test ou l'on se relit avant d'envoyer. La compter
  // comme une campagne fausserait le budget du jour. L'admin, lui, est un membre
  // comme un autre : il reste dans le journal.
  const compte = new Map();
  const requetes = await evenements(H, "requests", debut, fin);
  for (const e of requetes) {
    const k = cle(e.email) + "|" + String(e.date).slice(0, 10);
    compte.set(k, (compte.get(k) || 0) + 1);
  }
  const expediteur = cle(E.BREVO_SENDER_EMAIL);
  for (const e of requetes) {
    const k = cle(e.email);
    const d = String(e.date).slice(0, 10);
    if (k === expediteur || compte.get(k + "|" + d) > 3) continue;
    if (lignes(j, k).some((x) => x.date === d)) continue;
    (j.envois[k] ||= []).push({
      date: d,
      modele: "affiche",
      image: "affiche-plateforme-2026-09.jpg",
      public: null,
    });
  }
  sauver(j);
  return j;
}

if (import.meta.url === "file://" + process.argv[1] || process.argv[1]?.endsWith("journal-campagnes.mjs")) {
  const args = process.argv.slice(2);
  const j = args.includes("--init")
    ? await init(args[args.indexOf("--debut") + 1] || "2026-08-01", jour())
    : charger();
  const dates = {};
  for (const l of Object.values(j.envois)) for (const e of l) dates[e.date] = (dates[e.date] || 0) + 1;
  console.log("Journal    : " + FICHIER);
  console.log("Adresses   : " + Object.keys(j.envois).length + " deja sollicitees");
  console.log("Bannies    : " + Object.keys(j.bannis).length + " (rebond definitif, jamais rappelees)");
  console.log("Reportees  : " + Object.keys(j.reportes).length + " (rebond temporaire, passent en dernier)");
  console.log("Envois par jour :");
  for (const d of Object.keys(dates).sort()) console.log("   " + d + "  " + dates[d]);
}
