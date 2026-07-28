// Nettoyage des titres d'annonces déjà en base (emojis/accroches en tête +
// résidus de templates en fin de titre).
//
//   node scripts/clean-listing-titles.mjs           # DRY RUN (n'écrit rien)
//   node scripts/clean-listing-titles.mjs --apply    # applique (avec backup)
//
// Un backup {id, old, new} est écrit avant toute modification → réversible.

import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");

// ── Lecture des variables d'env depuis .env.local ──
function readEnv() {
  const raw = fs.readFileSync(path.resolve(".env.local"), "utf8");
  const get = (k) => {
    const m = raw.match(new RegExp(`^${k}=(.*)$`, "m"));
    return m ? m[1].replace(/^﻿/, "").replace(/^["']|["']$/g, "").trim() : "";
  };
  return { url: get("NEXT_PUBLIC_SUPABASE_URL"), key: get("SUPABASE_SERVICE_ROLE_KEY") };
}

// ── Logique de nettoyage (miroir de tidyTitle + retrait des résidus template) ──
const EMOJI = /\p{Extended_Pictographic}(‍\p{Extended_Pictographic})*[️\u{1F3FB}-\u{1F3FF}]*/gu;
const LEAD = /^(?:[\s:|·•–—-]|\p{Extended_Pictographic}[️\u{1F3FB}-\u{1F3FF}‍]*)+/u;
const LEADIN = /^(?:bonne affaire|super affaire|top affaire|à saisir|a saisir|à ne pas rater|a ne pas rater|promo(?:tion)?|offre(?: du moment)?|urgent|deal|vente flash|d[ée]stockage)\s*[:\-–—]\s*/i;

// Suffixes issus des anciens templates marketing (à retirer jusqu'à la fin).
const JUNK_TAILS = [
  /\s*[—–-]\s*Occasion à ne pas rater\b.*$/i,
  /\s*[—–-]\s*Excellent état,?\s*prix imbattable.*$/i,
  /\s+de qualité à saisir.*$/i,
  /\s+au meilleur prix.*$/i,
  /\s*[—–-]\s*prix imbattable.*$/i,
];

function tidy(text) {
  if (!text) return "";
  let t = String(text).replace(/\s{2,}/g, " ").trim();
  t = t.replace(LEAD, "").trim();
  t = t.replace(LEADIN, "").trim();
  t = t.replace(LEAD, "").trim();
  return t;
}

function deepClean(title) {
  let t = tidy(title);
  for (const re of JUNK_TAILS) t = t.replace(re, "").trim();
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}

async function main() {
  const { url, key } = readEnv();
  if (!url || !key) throw new Error("URL ou clé service role manquante dans .env.local");
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  // Récupération paginée de toutes les annonces
  const all = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${url}/rest/v1/listings?select=id,title&order=created_at.asc&limit=1000&offset=${offset}`, { headers });
    if (!res.ok) throw new Error(`Lecture échouée: ${res.status} ${await res.text()}`);
    const page = await res.json();
    all.push(...page);
    if (page.length < 1000) break;
  }

  const changes = [];
  for (const row of all) {
    const next = deepClean(row.title);
    // Sécurité : on ne remplace que si ça change ET si le résultat reste utilisable.
    if (next && next !== String(row.title || "").trim() && next.length >= 5) {
      changes.push({ id: row.id, old: row.title, new: next });
    }
  }

  console.log(`Total annonces lues : ${all.length}`);
  console.log(`Titres à nettoyer   : ${changes.length}`);
  console.log("\n── Échantillon (30 premiers) ──");
  for (const c of changes.slice(0, 30)) {
    console.log(`AVANT: ${c.old}`);
    console.log(`APRÈS: ${c.new}\n`);
  }

  if (!APPLY) {
    console.log("DRY RUN — rien n'a été écrit. Relance avec --apply pour appliquer.");
    return;
  }

  // Backup avant écriture (réversible)
  const backup = path.resolve(`scripts/backup-titles-${Date.now()}.json`);
  fs.writeFileSync(backup, JSON.stringify(changes, null, 2), "utf8");
  console.log(`\nBackup écrit : ${backup}`);

  let ok = 0, ko = 0;
  for (const c of changes) {
    const res = await fetch(`${url}/rest/v1/listings?id=eq.${c.id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ title: c.new }),
    });
    if (res.ok) ok++;
    else { ko++; console.warn(`✗ ${c.id}: ${res.status} ${await res.text()}`); }
  }
  console.log(`\nAppliqué : ${ok} OK, ${ko} échecs.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
