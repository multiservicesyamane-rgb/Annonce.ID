#!/usr/bin/env node
/**
 * Scrape des vendeurs (prospects B2B) sur CoinAfrique, Expat-Dakar et Jiji
 * via TON compte Apify (acteur apify/web-scraper), et écrit un CSV importable
 * par import-prospects.mjs.
 *
 * Prérequis :
 *   1. Compte Apify + acteur web-scraper approuvé une fois.
 *   2. APIFY_TOKEN=apify_api_xxx dans .env.local
 *
 * Usage :
 *   node scripts/scrape-prospects.mjs            # 100 par site
 *   SCRAPE_PER_SITE=10 node scripts/scrape-prospects.mjs   # test rapide
 *   node scripts/scrape-prospects.mjs coinafrique          # un seul site
 *   → génère scripts/prospects.csv
 *
 * Méthode (2 phases par site) :
 *   Phase A : ouvre les pages LISTE, défile pour charger les annonces,
 *             collecte les URLs d'annonces.
 *   Phase B : ouvre chaque annonce, extrait nom, secteur, ville, téléphone,
 *             WhatsApp (= le numéro tel:/wa.me présent dans la page).
 *
 * ⚠️ Conformité : ces sites interdisent le scraping dans leurs CGU, et la loi
 *    sénégalaise (CDP, Loi 2008-12) encadre la prospection. Vise les VENDEURS
 *    PROS, garde des volumes bas, informe les personnes au 1er contact.
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
const PER_SITE = Number(process.env.SCRAPE_PER_SITE || 100);
const only = (process.argv[2] || "").toLowerCase();

const SITES = [
  {
    key: "coinafrique",
    source: "CoinAfrique",
    listUrls: [
      "https://sn.coinafrique.com/categorie/voitures",
      "https://sn.coinafrique.com/categorie/telephones-et-tablettes",
      "https://sn.coinafrique.com/categorie/immobilier",
      "https://sn.coinafrique.com/",
    ],
    adMatch: "/annonce/",
    base: "https://sn.coinafrique.com",
  },
  {
    key: "expatdakar",
    source: "Expat-Dakar",
    listUrls: [
      "https://www.expat-dakar.com/voitures",
      "https://www.expat-dakar.com/telephones",
      "https://www.expat-dakar.com/immobilier",
    ],
    adMatch: "/annonces/",
    base: "https://www.expat-dakar.com",
  },
  {
    key: "jiji",
    source: "Jiji",
    listUrls: [
      "https://jiji.sn/voitures",
      "https://jiji.sn/telephones-mobiles",
      "https://jiji.sn/immobilier",
    ],
    adMatch: ".html",
    base: "https://jiji.sn",
  },
];

// ---- pageFunction PHASE A : collecte des URLs d'annonces (avec scroll) ----
function listPageFunction(context) {
  return (async function () {
    const $ = context.jQuery;
    for (let i = 0; i < 6; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(function (r) { setTimeout(r, 1500); });
    }
    const match = context.customData.adMatch;
    const base = context.customData.base;
    const hrefs = $("a").map(function (i, el) { return $(el).attr("href"); }).get().filter(Boolean);
    const ads = [];
    const seen = {};
    for (let k = 0; k < hrefs.length; k++) {
      let h = hrefs[k];
      if (h.indexOf(match) === -1) continue;
      if (h.indexOf("http") !== 0) h = base + h;
      if (!seen[h]) { seen[h] = 1; ads.push(h); }
    }
    return { ads };
  })();
}

// ---- pageFunction PHASE B : extraction d'une annonce ----
function detailPageFunction(context) {
  return (async function () {
    const $ = context.jQuery;
    await new Promise(function (r) { setTimeout(r, 2500); });
    const source = context.customData.source;
    const url = context.request.url;

    const title = ($("h1").first().text() || "").trim();

    // Téléphone : lien tel: ou wa.me présent dans la page
    let phone = "";
    const tel = $("a[href^='tel:']").first().attr("href");
    if (tel) phone = tel.replace("tel:", "").trim();
    if (!phone) {
      const wa = $("a[href*='wa.me'], a[href*='whatsapp']").first().attr("href") || "";
      const m = wa.match(/(\+?221)?[\s]?[0-9]{9,}/);
      if (m) phone = m[0];
    }

    // Secteur : CoinAfrique => segment d'URL après /annonce/ ; sinon fil d'ariane
    let sector = "";
    const parts = url.split("/").filter(Boolean);
    const ai = parts.indexOf("annonce");
    if (ai > -1 && parts[ai + 1]) sector = parts[ai + 1].replace(/-/g, " ");
    if (!sector) {
      sector = ($("[class*='breadcrumb'] a, nav a").map(function (i, el) { return $(el).text().trim(); }).get().filter(Boolean).slice(-1)[0]) || "";
    }

    // Ville : élément de localisation
    let city = ($("[class*='location'], [class*='region'], [class*='ville'], [class*='address']").first().text() || "").trim();
    city = city.replace(/\s+/g, " ").slice(0, 60);

    // Nom vendeur si présent
    let name = ($("[class*='user-name'], [class*='seller-name'], [class*='author'], [class*='vendeur']").first().text() || "").trim();
    if (!name) name = title.slice(0, 80);

    // Image principale : balise og:image (fiable), sinon 1re grande image
    let image = ($("meta[property='og:image']").attr("content") || "").trim();
    if (!image) {
      const imgs = $("img").map(function (i, el) { return $(el).attr("src") || $(el).attr("data-src") || ""; }).get()
        .filter(function (s) { return s && s.indexOf("http") === 0 && s.indexOf("logo") === -1 && s.indexOf("icon") === -1; });
      image = imgs[0] || "";
    }

    return { source: source, name: name, sector: sector, city: city, phone: phone, whatsapp: phone, image: image, url: url };
  })();
}

async function runActor(input) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=290`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
  );
  if (!res.ok) {
    throw new Error(`Apify ${res.status} — ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

async function scrapeSite(site) {
  console.log(`\n▶ ${site.source}`);
  // Phase A : collecte des URLs d'annonces
  const listItems = await runActor({
    startUrls: site.listUrls.map((url) => ({ url })),
    maxPagesPerCrawl: site.listUrls.length,
    proxyConfiguration: { useApifyProxy: true },
    injectJQuery: true,
    customData: { adMatch: site.adMatch, base: site.base },
    pageFunction: listPageFunction.toString(),
  });
  let adUrls = [];
  for (const it of listItems) if (it && it.ads) adUrls = adUrls.concat(it.ads);
  adUrls = Array.from(new Set(adUrls)).slice(0, PER_SITE);
  console.log(`  liste : ${adUrls.length} annonces trouvées`);
  if (!adUrls.length) return [];

  // Phase B : extraction des annonces
  const detailItems = await runActor({
    startUrls: adUrls.map((url) => ({ url })),
    maxPagesPerCrawl: adUrls.length + 2,
    maxConcurrency: 5,
    proxyConfiguration: { useApifyProxy: true },
    injectJQuery: true,
    customData: { source: site.source },
    pageFunction: detailPageFunction.toString(),
  });
  const rows = detailItems.filter((it) => it && it.name && !it["#error"]);
  const withPhone = rows.filter((r) => r.phone).length;
  console.log(`  détails : ${rows.length} fiches (${withPhone} avec téléphone)`);
  return rows;
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
  let all = [];
  for (const site of SITES) {
    if (only && site.key !== only) continue;
    try { all = all.concat(await scrapeSite(site)); }
    catch (e) { console.error(`  ✗ ${site.source}: ${e.message}`); }
  }
  const out = new URL("./prospects.csv", import.meta.url);
  writeFileSync(out, toCsv(all), "utf8");
  const withPhone = all.filter((r) => r.phone).length;
  console.log(`\n✅ ${all.length} fiches → scripts/prospects.csv (dont ${withPhone} avec téléphone).`);
  console.log(`   Importer :  node scripts/import-prospects.mjs scripts/prospects.csv`);
}

main().catch((e) => { console.error(e); process.exit(1); });
