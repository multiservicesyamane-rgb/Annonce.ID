import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/serverSecurity";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  const { pass, otp } = await req.json().catch(() => ({}));
  const adminAuth = verifyAdminPassword(req, pass, { otp });
  if (!adminAuth.ok) return adminAuth.response;
  const sb = admin();
  if (!sb) return NextResponse.json({ error: "service role manquante" }, { status: 500 });

  const { subToSlug, nameToSlug } = buildMap();
  const validSlugs = new Set((CATEGORIES as any[]).map((c) => c.slug));

  const { data: rows } = await sb.from("listings").select("id, category, category_slug").limit(2000);
  let fixed = 0;
  const samples: string[] = [];

  for (const r of rows || []) {
    // On ne touche QUE les annonces dont le slug n'existe plus (orphelines).
    if (validSlugs.has(r.category_slug)) continue;
    const cat = String(r.category || "").toLowerCase().trim();
    const correct = subToSlug[cat] || nameToSlug[cat] || "services";
    await sb.from("listings").update({ category_slug: correct }).eq("id", r.id);
    fixed++;
    if (samples.length < 10) samples.push(`${r.category}: ${r.category_slug} → ${correct}`);
  }

  return NextResponse.json({ ok: true, fixed, total: (rows || []).length, samples });
}
