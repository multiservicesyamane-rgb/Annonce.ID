#!/usr/bin/env node
/**
 * Enrichit un CSV de prospects avec leurs EMAILS, en visitant le site web de
 * chaque acteur (page d'accueil + pages contact classiques) et en extrayant
 * les adresses trouvées. Gratuit : simples requêtes HTTP, sans Apify.
 *
 * Usage :
 *   node scripts/enrich-emails.mjs                    # scripts/acteurs.csv
 *   node scripts/enrich-emails.mjs chemin/fichier.csv
 *
 * - Ne touche pas aux lignes qui ont déjà un email.
 * - Réécrit le fichier en place, colonne `email` remplie quand trouvée.
 * - Les pages Facebook/Instagram sont ignorées (connexion requise).
 */
import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2] || new URL("./acteurs.csv", import.meta.url);

// --- CSV minimal (mêmes règles que import-prospects.mjs) ---
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* ignore */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}
function toCsvLine(vals) {
  return vals.map((v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(",");
}

// Adresses techniques/junk à ignorer.
const JUNK = /no-?reply|example\.|exemple|monsite|votresite|yourdomain|placeholder|sentry|wixpress|@.*\.(png|jpe?g|gif|svg|webp|css|js)$|godaddy|cloudflare|schema\.org/i;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Décode les emails masqués anti-robots : &#097;, &#x40;, &amp;#64;…
function decodeEntities(s) {
  return s
    .replace(/&amp;/gi, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

// Validation stricte : forme d'email réelle, TLD plausible, domaine avec lettres.
function isRealEmail(e) {
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,10}$/.test(e)) return false;
  const domain = e.split("@")[1];
  const labels = domain.split(".");
  if (!labels.slice(0, -1).some((l) => /[a-z]/.test(l))) return false; // ex: "263.high"
  return !JUNK.test(e);
}

function extractEmails(htmlText) {
  const text = decodeEntities(htmlText);
  const found = new Set();
  // mailto: d'abord (les plus fiables)
  for (const m of text.matchAll(/mailto:([^"'?\s>]+)/gi)) {
    let e = m[1].trim().toLowerCase();
    try { e = decodeURIComponent(e); } catch {}
    if (isRealEmail(e)) found.add(e);
  }
  // puis texte brut
  for (const m of text.matchAll(EMAIL_RE)) {
    const e = m[0].toLowerCase();
    if (isRealEmail(e)) found.add(e);
  }
  return [...found];
}

async function fetchText(url, timeoutMs = 12000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36" },
    });
    if (!res.ok) return "";
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text") && !type.includes("html")) return "";
    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(t);
  }
}

const CONTACT_PATHS = ["", "/contact", "/contact-us", "/contactez-nous", "/nous-contacter", "/a-propos", "/about", "/mentions-legales"];

// Emails déclarés dans les données structurées (JSON-LD schema.org).
function extractJsonLdEmails(html) {
  const found = [];
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const e of m[1].matchAll(/"email"\s*:\s*"([^"]+)"/gi)) {
      const v = decodeEntities(e[1]).replace(/^mailto:/i, "").trim().toLowerCase();
      if (isRealEmail(v)) found.push(v);
    }
  }
  return found;
}

// Liens internes de type "contact" découverts sur la page d'accueil
// (les sites n'utilisent pas tous les chemins standards).
function discoverContactLinks(html, base) {
  const links = new Set();
  for (const m of html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]{0,80}?)<\/a>/gi)) {
    const href = m[1];
    const label = m[2].replace(/<[^>]+>/g, "");
    if (/contact|about|propos|équipe|equipe|mentions/i.test(href + " " + label)) {
      try {
        const u = new URL(href, base.origin);
        if (u.hostname === base.hostname) links.add(u.href);
      } catch {}
    }
    if (links.size >= 3) break;
  }
  return [...links];
}

function pickEmail(emails, base) {
  if (!emails.length) return "";
  // Préfère un email du même domaine que le site, sinon le premier trouvé.
  const own = emails.find((e) => e.endsWith("@" + base.hostname.replace(/^www\./, "")));
  return own || emails[0];
}

async function emailForWebsite(website) {
  if (!website) return "";
  let base;
  try { base = new URL(website); } catch { return ""; }
  if (/facebook\.com|instagram\.com|wa\.me|whatsapp/i.test(base.hostname)) return "";

  const visited = new Set();
  const queue = CONTACT_PATHS.map((p) => (p ? new URL(p, base.origin).href : base.href));

  while (queue.length) {
    const url = queue.shift();
    if (visited.has(url) || visited.size >= 10) continue;
    visited.add(url);

    const html = await fetchText(url);
    if (!html) continue;

    const emails = [...extractEmails(html), ...extractJsonLdEmails(html)];
    if (emails.length) return pickEmail(emails, base);

    // Depuis l'accueil, suit les liens "contact" propres au site.
    if (url === base.href || url === base.origin + "/") {
      for (const l of discoverContactLinks(html, base)) queue.unshift(l);
    }
  }
  return "";
}

async function main() {
  const text = readFileSync(file, "utf8");
  const rows = parseCsv(text);
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const iEmail = header.indexOf("email");
  const iWebsite = header.indexOf("website");
  const iNotes = header.indexOf("notes");
  const iName = header.indexOf("name");
  if (iEmail === -1) { console.error("Colonne 'email' introuvable dans le CSV."); process.exit(1); }

  let enriched = 0, tried = 0;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if ((row[iEmail] || "").trim()) continue;

    // Site web : colonne dédiée, sinon "Site: xxx" dans les notes (anciens CSV).
    let site = iWebsite > -1 ? (row[iWebsite] || "").trim() : "";
    if (!site && iNotes > -1) {
      const m = (row[iNotes] || "").match(/Site:\s*(\S+)/i);
      if (m) site = m[1];
    }
    if (!site) continue;

    tried++;
    process.stdout.write(`· ${row[iName] || "?"} → ${site.slice(0, 50)} … `);
    const email = await emailForWebsite(site);
    if (email) { row[iEmail] = email; enriched++; console.log(`✉️  ${email}`); }
    else console.log("aucun email trouvé");
  }

  writeFileSync(file, rows.map(toCsvLine).join("\n"), "utf8");
  console.log(`\n✅ ${enriched} email(s) trouvé(s) sur ${tried} site(s) visités. Fichier mis à jour.`);
  console.log(`   Importer : node scripts/import-prospects.mjs ${String(file).replace(/.*[\\/]scripts[\\/]/, "scripts/")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
