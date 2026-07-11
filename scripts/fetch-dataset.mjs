#!/usr/bin/env node
/**
 * Récupère les résultats d'un run Apify déjà lancé (utile si le script
 * principal a été coupé côté réseau alors que le run continuait chez Apify).
 *
 * Usage : node scripts/fetch-dataset.mjs <runId> <datasetId>
 * Écrit scripts/prospects.csv quand le run est terminé.
 */
import { writeFileSync, readFileSync } from "node:fs";

const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
let TOKEN = "";
for (const line of raw.split(/\r?\n/)) { const m = line.match(/^APIFY_TOKEN=(.*)$/); if (m) TOKEN = m[1].replace(/^["']|["']$/g, "").trim(); }

const runId = process.argv[2];
const datasetId = process.argv[3];
if (!runId || !datasetId) { console.error("Usage: node scripts/fetch-dataset.mjs <runId> <datasetId>"); process.exit(1); }

const TERMINAL = ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"];
let status = "RUNNING";
while (!TERMINAL.includes(status)) {
  await new Promise((r) => setTimeout(r, 8000));
  try {
    const st = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${TOKEN}`);
    if (st.ok) { status = (await st.json()).data.status; process.stdout.write(`\r  statut: ${status}   `); }
  } catch {}
}
console.log(`\n  run terminé (${status}), récupération du dataset…`);

const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${TOKEN}&clean=true`);
const items = await res.json();
const rows = items.filter((it) => it && it.name && !it["#error"]);

const cols = ["name", "sector", "city", "phone", "whatsapp", "email", "image", "notes", "source", "url"];
const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const lines = [cols.join(",")];
for (const r of rows) lines.push(cols.map((c) => esc(r[c])).join(","));
writeFileSync(new URL("./prospects.csv", import.meta.url), lines.join("\n"), "utf8");

const withPhone = rows.filter((r) => r.phone).length;
console.log(`✅ ${rows.length} fiches → scripts/prospects.csv (dont ${withPhone} avec téléphone).`);
