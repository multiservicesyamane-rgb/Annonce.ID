import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMIN_PASS = process.env.ADMIN_PASSWORD || "YamaneTech@2025";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Construit une table sous-catégorie/catégorie → slug (sans "Autre", sans ambiguïté).
function buildMap() {
  const subToSlug: Record<string, string> = {};
  const ambiguous = new Set<string>();
  const nameToSlug: Record<string, string> = {};
  for (const c of CATEGORIES as any[]) {
    nameToSlug[c.name.toLowerCase()] = c.slug;
    for (const s of c.subs || []) {
      const key = String(s).toLowerCase();
      if (key === "autre") continue;
      if (subToSlug[key] && subToSlug[key] !== c.slug) ambiguous.add(key);
      subToSlug[key] = c.slug;
    }
  }
  ambiguous.forEach((k) => delete subToSlug[k]);
  return { subToSlug, nameToSlug };
}

// Recale category_slug d'après la sous-catégorie (corrige ex: "Appartement" sous "electronique").
export async function POST(req: Request) {
  const { pass } = await req.json().catch(() => ({}));
  if (pass !== ADMIN_PASS) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const sb = admin();
  if (!sb) return NextResponse.json({ error: "service role manquante" }, { status: 500 });

  const { subToSlug, nameToSlug } = buildMap();
  const validSlugs = new Set((CATEGORIES as any[]).map((c) => c.slug));

  const { data: rows } = await sb.from("listings").select("id, category, category_slug").limit(2000);
  let fixed = 0;
  const samples: string[] = [];

  for (const r of rows || []) {
    const cat = String(r.category || "").toLowerCase().trim();
    if (!cat) continue;
    const correct = subToSlug[cat] || nameToSlug[cat];
    // On corrige seulement si on connaît le bon slug ET qu'il diffère.
    // Pour "Autre" / inconnu : on garde le slug actuel s'il est valide.
    if (correct && correct !== r.category_slug) {
      await sb.from("listings").update({ category_slug: correct }).eq("id", r.id);
      fixed++;
      if (samples.length < 8) samples.push(`${r.category}: ${r.category_slug} → ${correct}`);
    } else if (!correct && !validSlugs.has(r.category_slug)) {
      await sb.from("listings").update({ category_slug: "services" }).eq("id", r.id);
      fixed++;
    }
  }

  return NextResponse.json({ ok: true, fixed, total: (rows || []).length, samples });
}
