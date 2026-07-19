#!/usr/bin/env node
/**
 * Scrape les ACTEURS du secteur (boutiques, agences, concessionnaires…) sur
 * Google Maps via l'acteur Apify compass/crawler-google-places, et écrit un
 * CSV importable par import-prospects.mjs.
 *
 * Contrairement à scrape-prospects.mjs (annonces des sites concurrents), on
 * cible ici des PROFESSIONNELS établis : meilleure qualité de prospect,
 * données publiques d'entreprises (fiche Google Business).
 *
 * Prérequis :
 *   1. APIFY_TOKEN=apify_api_xxx dans .env.local
 *   2. L'acteur "Google Maps Scraper" (compass/crawler-google-places) est
 *      facturé au résultat (~4 $/1000 fiches, couvert par le crédit mensuel
 *      gratuit Apify pour de petits volumes). Au premier usage, ouvrir
 *      https://apify.com/compass/crawler-google-places et cliquer "Try for free".
 *
 * Usage :
 *   node scripts/scrape-acteurs.mjs                    # requêtes par défaut
 *   SCRAPE_PER_QUERY=5 node scripts/scrape-acteurs.mjs # test rapide
 *   node scripts/scrape-acteurs.mjs "agence immobilière Dakar" "boutique téléphone Thiès"
 *   → génère scripts/acteurs.csv
 *   → puis : node scripts/import-prospects.mjs scripts/acteurs.csv
 *
 * ⚠️ Conformité : données de fiches d'entreprises publiques. La prospection
 *    reste encadrée (loi sénégalaise 2008-12) : contact individuel via le
 *    bouton WhatsApp du CRM, pas d'envoi en masse.
 */
import { writeFileSync, readFileSync } from "node:fs";

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv();

const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) {
  console.error("APIFY_TOKEN manquant dans .env.local");
  process.exit(1);
}
const PER_QUERY = Number(process.env.SCRAPE_PER_QUERY || 20);

// Requêtes par défaut : secteurs phares de Wanteermako × villes principales.
// Vocabulaire "catégorie Google Maps" : "boutique téléphone" renvoie des
// boutiques de vêtements ; "magasin de téléphones portables" est précis.
const DEFAULT_QUERIES = [
  "magasin de téléphones portables Dakar",
  "agence immobilière Dakar",
  "concessionnaire automobile Dakar",
  "vente de voitures d'occasion Dakar",
  "magasin d'informatique Dakar",
  "magasin de téléphones portables Thiès",
  "agence immobilière Mbour",
];
const queries = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_QUERIES;

// Lance l'acteur en ASYNCHRONE, attend la fin, récupère le dataset
// (même mécanique que scrape-prospects.mjs).
async function runActor(input, runTimeoutSecs = 900) {
  const start = await fetch(
    `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}&timeout=${runTimeoutSecs}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
  );
  if (!start.ok) {
    const msg = (await start.text()).slice(0, 300);
    if (start.status === 402 || start.status === 403 || start.status === 404) {
      throw new Error(
        `Apify ${start.status} — l'acteur Google Maps Scraper n'est pas encore activé sur votre compte.\n` +
        `Ouvrez https://apify.com/compass/crawler-google-places, cliquez "Try for free", puis relancez.\n${msg}`,
      );
    }
    throw new Error(`Apify start ${start.status} — ${msg}`);
  }
  const run = (await start.json()).data;

  const TERMINAL = ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"];
  let status = run.status;
  const t0 = Date.now();
  while (!TERMINAL.includes(status)) {
    await new Promise((r) => setTimeout(r, 5000));
    const st = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${APIFY_TOKEN}`);
    if (st.ok) status = (await st.json()).data.status;
    if (Date.now() - t0 > (runTimeoutSecs + 60) * 1000) break;
  }

  const items = await fetch(`https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${APIFY_TOKEN}&clean=true`);
  if (!items.ok) throw new Error(`Apify dataset ${items.status}`);
  return items.json();
}

function normalizePhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9) d = "221" + d;
  return d ? "+" + d : "";
}

// Ville : champ city de la fiche, sinon dernier segment utile de l'adresse.
function cityOf(place) {
  if (place.city) return place.city;
  const parts = String(place.address || "").split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 2].replace(/\d{5}/g, "").trim() : "";
}

function toCsv(rows) {
  const cols = ["name", "sector", "city", "phone", "whatsapp", "email", "image", "notes", "source", "url"];
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [cols.join(",")];
  for (const r of rows) lines.push(cols.map((c) => esc(r[c])).join(","));
  return lines.join("\n");
}

async function main() {
  console.log(`▶ Google Maps — ${queries.length} recherche(s), max ${PER_QUERY} fiches chacune`);
  for (const q of queries) console.log(`   · ${q}`);

  const items = await runActor({
    searchStringsArray: queries,
    maxCrawledPlacesPerSearch: PER_QUERY,
    language: "fr",
    skipClosedPlaces: true,
    scrapePlaceDetailPage: false,
    maxImages: 0,
    maxReviews: 0,
  });

  const seen = new Set();
  const rows = [];
  for (const p of items) {
    if (!p || !p.title) continue;
    const phone = normalizePhone(p.phoneUnformatted || p.phone);
    if (!phone) continue;                    // sans téléphone, pas de prospection possible
    if (seen.has(phone)) continue;           // dédup intra-lot (l'import dédoublonne vs la base)
    seen.add(phone);
    rows.push({
      name: String(p.title).slice(0, 200),
      sector: p.categoryName || p.searchString || "",
      city: cityOf(p),
      phone,
      whatsapp: phone,
      email: "",
      image: p.imageUrl || "",
      notes: [
        p.totalScore ? `Note Google: ${p.totalScore}/5 (${p.reviewsCount || 0} avis)` : "",
        p.website ? `Site: ${p.website}` : "",
        p.address ? `Adresse: ${p.address}` : "",
      ].filter(Boolean).join(" · "),
      source: "Google Maps",
      url: p.url || "",
    });
  }

  const out = new URL("./acteurs.csv", import.meta.url);
  writeFileSync(out, toCsv(rows), "utf8");
  console.log(`\n✅ ${rows.length} acteurs avec téléphone (sur ${items.length} fiches) → scripts/acteurs.csv`);
  console.log(`   Importer  : node scripts/import-prospects.mjs scripts/acteurs.csv`);
  console.log(`   Qualifier : bouton « 🤖 Qualifier IA » dans le CRM Super Admin`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
