// Remet en ligne les annonces NATIVES passées en "expired" par le cron, et
// repousse leur date d'expiration (phase de lancement : le site a besoin de
// contenu, et une boutique n'apparaît que si elle a au moins une annonce active).
//
//   node scripts/restore-expired-listings.mjs           # DRY RUN (n'écrit rien)
//   node scripts/restore-expired-listings.mjs --apply    # applique (avec backup)
//
// Ne touche PAS aux annonces importées (source renseignée : aliexpress…),
// ni aux annonces vendues, refusées ou désactivées à la main par le vendeur.

import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const EXTEND_DAYS = 365; // nouvelle durée de validité

function env(key) {
  const raw = fs.readFileSync(path.resolve(".env.local"), "utf8");
  const all = [...raw.matchAll(new RegExp(`^${key}=(.*)$`, "mg"))].map((m) =>
    m[1].replace(/^﻿/, "").replace(/\r$/, "").trim().replace(/^["']|["']$/g, ""),
  );
  return all[all.length - 1]; // dotenv garde la dernière occurrence
}

const SB = env("NEXT_PUBLIC_SUPABASE_URL");
const KEY = env("SUPABASE_SERVICE_ROLE_KEY");
if (!SB || !KEY) throw new Error("URL ou clé service role manquante dans .env.local");
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const res = await fetch(
  `${SB}/rest/v1/listings?select=id,title,status,source,expires_at,user_id&limit=2000`,
  { headers },
);
if (!res.ok) throw new Error(`Lecture échouée : ${res.status} ${await res.text()}`);
const rows = await res.json();

// Annonces natives uniquement (pas les imports)
const native = rows.filter((l) => !l.source);
const toReactivate = native.filter((l) => l.status === "expired");
const newExpiry = new Date(Date.now() + EXTEND_DAYS * 86400000).toISOString();
// On repousse l'échéance de toutes les natives qui seront actives après ce script
const toExtend = native.filter(
  (l) =>
    (l.status === "active" || l.status === "expired") &&
    (!l.expires_at || new Date(l.expires_at).getTime() < Date.now() + 30 * 86400000),
);

console.log(`annonces natives : ${native.length}`);
console.log(`  → à remettre en ligne (expired → active) : ${toReactivate.length}`);
console.log(`  → dates d'expiration à repousser (+${EXTEND_DAYS} j) : ${toExtend.length}`);
console.log("\n--- échantillon des remises en ligne ---");
for (const l of toReactivate.slice(0, 12)) console.log(`  * ${l.title}`);

if (!APPLY) {
  console.log("\nDRY RUN — rien n'a été écrit. Relance avec --apply pour appliquer.");
  process.exit(0);
}

const backup = path.resolve(`scripts/backup-statuses-${Date.now()}.json`);
fs.writeFileSync(
  backup,
  JSON.stringify(native.map(({ id, status, expires_at }) => ({ id, status, expires_at })), null, 2),
  "utf8",
);
console.log(`\nBackup écrit : ${backup}`);

async function patch(id, body) {
  const r = await fetch(`${SB}/rest/v1/listings?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!r.ok) console.warn(`  ✗ ${id} : ${r.status} ${await r.text()}`);
  return r.ok;
}

let reactivated = 0;
for (const l of toReactivate) if (await patch(l.id, { status: "active", expires_at: newExpiry })) reactivated++;

let extended = 0;
const already = new Set(toReactivate.map((l) => l.id));
for (const l of toExtend) {
  if (already.has(l.id)) continue;
  if (await patch(l.id, { expires_at: newExpiry })) extended++;
}

console.log(`\nRemises en ligne : ${reactivated} | échéances repoussées : ${extended}`);
