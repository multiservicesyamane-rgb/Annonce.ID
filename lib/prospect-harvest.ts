import type { SupabaseClient } from "@supabase/supabase-js";

// Récolte quotidienne de prospects : un petit lot Google Maps par jour
// (rotation secteurs × villes), import dédupliqué dans `prospects`, puis
// extraction des emails depuis les sites web par tranches successives.
// Objectif : ~10 nouveaux emails/jour, dans le crédit gratuit Apify.
// Nécessite database/MIGRATION_PROSPECTS_HARVEST.sql.

const STATE_ID = "prospect_harvest";
const PER_QUERY = 20;
const QUERIES_PER_DAY = 2;

const SECTORS = [
  "magasin de téléphones portables",
  "agence immobilière",
  "concessionnaire automobile",
  "magasin d'informatique",
  "magasin d'électroménager",
  "magasin de meubles",
  "boutique de mode",
];
const CITIES = ["Dakar", "Pikine", "Guédiawaye", "Rufisque", "Thiès", "Mbour", "Saint-Louis", "Kaolack"];
// 56 combinaisons → à 2/jour, un cycle complet dure 28 jours.
const COMBOS = SECTORS.flatMap((s) => CITIES.map((c) => `${s} ${c}`));

type HarvestState = {
  date?: string;
  runId?: string;
  datasetId?: string;
  ingested?: boolean;
  queryIndex?: number;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}
function normalizePhone(raw: unknown) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9) d = "221" + d;
  return d ? "+" + d : "";
}

async function getState(sb: SupabaseClient): Promise<HarvestState> {
  const { data } = await sb.from("app_settings").select("data").eq("id", STATE_ID).maybeSingle();
  return (data?.data as HarvestState) || {};
}
async function saveState(sb: SupabaseClient, state: HarvestState) {
  await sb.from("app_settings").upsert({ id: STATE_ID, data: state, updated_at: new Date().toISOString() });
}

// Écriture adaptative : retire les colonnes absentes du schéma et réessaie
// (même approche que le back-office).
async function adaptiveInsert(sb: SupabaseClient, table: string, row: Record<string, unknown>) {
  const payload = { ...row };
  for (let i = 0; i < 6; i++) {
    const { error } = await sb.from(table).insert(payload);
    if (!error) return true;
    const m = (error.message || "").match(/'([^']+)' column|column "([^"]+)"|Could not find the '([^']+)'/);
    const col = m && (m[1] || m[2] || m[3]);
    if (col && col in payload) { delete payload[col]; continue; }
    return false;
  }
  return false;
}

/** Phase 1 — Démarre le run Apify du jour (2 requêtes en rotation). */
export async function startDailyRun(sb: SupabaseClient) {
  const token = process.env.APIFY_TOKEN;
  if (!token) return { phase: "start", skipped: true, reason: "APIFY_TOKEN manquant côté serveur" };

  const state = await getState(sb);
  if (state.date === today()) return { phase: "start", skipped: true, reason: "run du jour déjà démarré" };

  const idx = state.queryIndex || 0;
  const queries = Array.from({ length: QUERIES_PER_DAY }, (_, i) => COMBOS[(idx + i) % COMBOS.length]);

  const res = await fetch(`https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${token}&timeout=600`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      searchStringsArray: queries,
      maxCrawledPlacesPerSearch: PER_QUERY,
      language: "fr",
      skipClosedPlaces: true,
      scrapePlaceDetailPage: false,
      maxImages: 0,
      maxReviews: 0,
    }),
  });
  if (!res.ok) return { phase: "start", error: `Apify ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const run = (await res.json()).data;

  await saveState(sb, {
    date: today(),
    runId: run.id,
    datasetId: run.defaultDatasetId,
    ingested: false,
    queryIndex: (idx + QUERIES_PER_DAY) % COMBOS.length,
  });
  return { phase: "start", started: true, queries };
}

/** Phase 2 — Importe le résultat du run une fois terminé (dédup tél/email). */
export async function ingestRun(sb: SupabaseClient) {
  const token = process.env.APIFY_TOKEN;
  const state = await getState(sb);
  if (!token || !state.runId || state.ingested) {
    return { phase: "ingest", skipped: true, reason: state.ingested ? "déjà importé" : "aucun run en attente" };
  }

  const st = await fetch(`https://api.apify.com/v2/actor-runs/${state.runId}?token=${token}`);
  if (!st.ok) return { phase: "ingest", error: `Apify status ${st.status}` };
  const status = (await st.json()).data.status;
  if (!["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
    return { phase: "ingest", skipped: true, reason: `run ${status}` };
  }

  const items = await fetch(`https://api.apify.com/v2/datasets/${state.datasetId}/items?token=${token}&clean=true`);
  if (!items.ok) return { phase: "ingest", error: `Apify dataset ${items.status}` };
  const places: any[] = await items.json();

  // Contacts déjà connus → déduplication
  const { data: existing } = await sb.from("prospects").select("phone,email");
  const phones = new Set((existing || []).map((p: any) => normalizePhone(p.phone)).filter(Boolean));

  let inserted = 0;
  for (const p of places) {
    if (!p?.title) continue;
    const phone = normalizePhone(p.phoneUnformatted || p.phone);
    if (!phone || !phone.startsWith("+221") || phones.has(phone)) continue;
    phones.add(phone);
    const city = p.city || "";
    const ok = await adaptiveInsert(sb, "prospects", {
      name: String(p.title).slice(0, 200),
      sector: p.categoryName || p.searchString || null,
      city: city || null,
      phone,
      whatsapp: phone,
      email: null,
      source_url: p.website || null,
      image_url: p.imageUrl || null,
      notes: [
        p.totalScore ? `Note Google: ${p.totalScore}/5 (${p.reviewsCount || 0} avis)` : "",
        p.website ? `Site: ${p.website}` : "",
        "Récolte auto Google Maps",
      ].filter(Boolean).join(" · "),
      status: "new",
    });
    if (ok) inserted++;
  }

  await saveState(sb, { ...state, ingested: true });
  return { phase: "ingest", runStatus: status, places: places.length, inserted };
}

// ---- Extraction d'email depuis le site web d'un prospect ----

const JUNK = /no-?reply|example\.|exemple|monsite|votresite|yourdomain|placeholder|sentry|wixpress|godaddy|cloudflare|schema\.org/i;

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/gi, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}
function isRealEmail(e: string) {
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,10}$/.test(e)) return false;
  const labels = e.split("@")[1].split(".");
  if (!labels.slice(0, -1).some((l) => /[a-z]/.test(l))) return false;
  return !JUNK.test(e);
}
function extractEmails(html: string): string[] {
  const text = decodeEntities(html);
  const found = new Set<string>();
  for (const m of text.matchAll(/mailto:([^"'?\s>]+)/gi)) {
    let e = m[1].trim().toLowerCase();
    try { e = decodeURIComponent(e); } catch {}
    if (isRealEmail(e)) found.add(e);
  }
  for (const m of text.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)) {
    const e = m[0].toLowerCase();
    if (isRealEmail(e)) found.add(e);
  }
  return [...found];
}

async function fetchText(url: string, timeoutMs = 6000): Promise<string> {
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

async function emailForWebsite(website: string): Promise<string> {
  let base: URL;
  try { base = new URL(website); } catch { return ""; }
  if (/facebook\.com|instagram\.com|wa\.me|whatsapp|linktr\.ee/i.test(base.hostname)) return "";

  const paths = ["", "/contact", "/contactez-nous", "/nous-contacter", "/a-propos", "/mentions-legales"];
  const visited = new Set<string>();
  const queue = paths.map((p) => (p ? new URL(p, base.origin).href : base.href));

  while (queue.length && visited.size < 6) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);
    const html = await fetchText(url);
    if (!html) continue;
    const emails = extractEmails(html);
    if (emails.length) {
      const own = emails.find((e) => e.endsWith("@" + base.hostname.replace(/^www\./, "")));
      return own || emails[0];
    }
  }
  return "";
}

/** Phase 3 — Extrait les emails d'une tranche de prospects sans email. */
export async function enrichEmailsSlice(sb: SupabaseClient, limit = 4) {
  const { data: batch, error } = await sb
    .from("prospects")
    .select("id, name, email, source_url, notes, email_checked_at")
    .is("email", null)
    .is("email_checked_at", null)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 6)));

  if (error) {
    return { phase: "enrich", skipped: true, reason: "Exécuter database/MIGRATION_PROSPECTS_HARVEST.sql" };
  }
  if (!batch?.length) return { phase: "enrich", checked: 0, found: 0 };

  // Adresses déjà utilisées → jamais deux prospects avec le même email
  const { data: withEmail } = await sb.from("prospects").select("email").not("email", "is", null);
  const used = new Set((withEmail || []).map((p: any) => (p.email || "").toLowerCase()));

  let found = 0;
  const results: any[] = [];
  for (const p of batch) {
    let site = p.source_url || "";
    if (!site) {
      const m = (p.notes || "").match(/Site:\s*(\S+)/i);
      if (m) site = m[1];
    }
    let email = "";
    if (site) email = await emailForWebsite(site);
    if (email && used.has(email)) email = "";
    if (email) { used.add(email); found++; }

    await sb.from("prospects").update({
      email: email || null,
      email_checked_at: new Date().toISOString(),
    }).eq("id", p.id);
    results.push({ name: p.name, email: email || null });
  }
  return { phase: "enrich", checked: batch.length, found, results };
}

/** Orchestration : chaque passage du cron exécute la phase utile du moment. */
export async function harvestTick(sb: SupabaseClient) {
  const start = await startDailyRun(sb);
  const ingest = await ingestRun(sb);
  const enrich = await enrichEmailsSlice(sb);
  return { start, ingest, enrich };
}
