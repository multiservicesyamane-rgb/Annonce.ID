#!/usr/bin/env node
/**
 * Importe un CSV de prospects dans la table Supabase `prospects`.
 *
 * Usage :
 *   node scripts/import-prospects.mjs chemin/vers/prospects.csv
 *
 * Colonnes attendues (en-tête CSV, ordre libre) :
 *   name, sector, city, phone, whatsapp, email, notes, source
 *
 * - Dédoublonnage par téléphone (ignore les lignes dont le numéro existe déjà).
 * - status = 'new' pour tous les nouveaux prospects.
 * - Nécessite dans .env.local : NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";

// --- Charge .env.local (simple, sans dépendance) ---
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

// --- Parseur CSV minimal (gère guillemets et virgules internes) ---
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

function normalizePhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9) d = "221" + d; // numéro local sénégalais
  return d ? "+" + d : "";
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage : node scripts/import-prospects.mjs prospects.csv");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants dans .env.local");
    process.exit(1);
  }
  // Accès direct à l'API REST Supabase (évite la dépendance WebSocket de
  // supabase-js, absente sous Node < 22).
  const rest = url.replace(/\/+$/, "") + "/rest/v1/prospects";
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  const rows = parseCsv(readFileSync(file, "utf8"));
  const header = rows.shift().map((h) => h.trim().toLowerCase());
  const idx = (name) => header.indexOf(name);

  // Numéros déjà en base → évite les doublons
  const existRes = await fetch(`${rest}?select=phone`, { headers });
  const existing = existRes.ok ? await existRes.json() : [];
  const seen = new Set((existing || []).map((p) => normalizePhone(p.phone)).filter(Boolean));

  const toInsert = [];
  let skippedNoPhone = 0, skippedDup = 0;
  for (const r of rows) {
    const phone = normalizePhone(r[idx("phone")] || r[idx("whatsapp")] || "");
    if (!phone) { skippedNoPhone++; continue; }
    if (seen.has(phone)) { skippedDup++; continue; }
    seen.add(phone);
    toInsert.push({
      name: (r[idx("name")] || "Vendeur").trim().slice(0, 200),
      sector: (r[idx("sector")] || "").trim() || null,
      city: (r[idx("city")] || "").trim() || null,
      phone,
      whatsapp: normalizePhone(r[idx("whatsapp")] || phone) || null,
      email: (r[idx("email")] || "").trim() || null,
      image_url: (r[idx("image")] || "").trim() || null,
      source_url: (r[idx("url")] || "").trim() || null,
      // notes = source + image + lien (repli si les colonnes dédiées manquent)
      notes: [
        (r[idx("notes")] || "").trim(),
        (r[idx("source")] || "").trim() ? `Source: ${r[idx("source")].trim()}` : "",
        (r[idx("image")] || "").trim() ? `Photo: ${r[idx("image")].trim()}` : "",
        (r[idx("url")] || "").trim() ? `Annonce: ${r[idx("url")].trim()}` : "",
      ].filter(Boolean).join(" · ") || null,
      status: "new",
    });
  }

  if (!toInsert.length) {
    console.log(`Rien à importer. (sans téléphone: ${skippedNoPhone}, doublons: ${skippedDup})`);
    return;
  }

  // Insertion adaptative : si les colonnes image_url/source_url n'existent pas
  // encore (migration non passée), on les retire et on retente (les infos
  // restent dans notes). Insertion par lots de 200.
  let inserted = 0;
  let dropCols = [];
  for (let i = 0; i < toInsert.length; i += 200) {
    let batch = toInsert.slice(i, i + 200).map((row) => {
      const r = { ...row };
      for (const c of dropCols) delete r[c];
      return r;
    });
    let res = await fetch(rest, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(batch) });
    // Retente en retirant une colonne inconnue signalée par PostgREST
    while (!res.ok) {
      const msg = await res.text();
      const m = msg.match(/'([a-z_]+)' column|column "?([a-z_]+)"?|Could not find the '([a-z_]+)'/);
      const col = m && (m[1] || m[2] || m[3]);
      if (col && !dropCols.includes(col)) {
        dropCols.push(col);
        batch = batch.map((row) => { const r = { ...row }; for (const c of dropCols) delete r[c]; return r; });
        res = await fetch(rest, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(batch) });
      } else {
        console.error("Erreur insert:", msg.slice(0, 300));
        process.exit(1);
      }
    }
    inserted += batch.length;
  }
  if (dropCols.length) console.log(`ℹ️  Colonnes absentes ignorées (infos gardées dans notes): ${dropCols.join(", ")}. Exécute MIGRATION_PROSPECTS_IMAGE.sql pour les activer.`);
  console.log(`✅ ${inserted} prospects importés. (sans téléphone: ${skippedNoPhone}, doublons ignorés: ${skippedDup})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
