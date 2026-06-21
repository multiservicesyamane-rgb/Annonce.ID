import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "images";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "YamaneTech@2025";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function dataUriToBuffer(dataUri: string): { buffer: Buffer; mime: string } {
  const [meta, b64] = dataUri.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
  return { buffer: Buffer.from(b64, "base64"), mime };
}

async function up(sb: any, dataUri: string, folder: string): Promise<string> {
  const { buffer, mime } = dataUriToBuffer(dataUri);
  const ext = (mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, { contentType: mime, cacheControl: "31536000" });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Convertit le base64 existant (listings.image, profiles.avatar_url/cover_url) en URLs Storage.
// À relancer jusqu'à remaining = 0. Protégé par le mot de passe admin.
export async function POST(req: Request) {
  const { pass } = await req.json().catch(() => ({}));
  if (pass !== ADMIN_PASS) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const sb = admin();
  if (!sb) return NextResponse.json({ error: "service role manquante" }, { status: 500 });

  let migrated = 0;
  const errors: string[] = [];

  const { data: ls } = await sb.from("listings").select("id, image").like("image", "data:%").limit(15);
  for (const l of ls || []) {
    try { const u = await up(sb, l.image, "listings"); await sb.from("listings").update({ image: u }).eq("id", l.id); migrated++; }
    catch (e: any) { errors.push(`listing ${l.id}: ${e?.message}`); }
  }

  const { data: pa } = await sb.from("profiles").select("id, avatar_url").like("avatar_url", "data:%").limit(15);
  for (const p of pa || []) {
    try { const u = await up(sb, p.avatar_url, "avatars"); await sb.from("profiles").update({ avatar_url: u }).eq("id", p.id); migrated++; }
    catch (e: any) { errors.push(`avatar ${p.id}: ${e?.message}`); }
  }

  const { data: pc } = await sb.from("profiles").select("id, cover_url").like("cover_url", "data:%").limit(15);
  for (const p of pc || []) {
    try { const u = await up(sb, p.cover_url, "covers"); await sb.from("profiles").update({ cover_url: u }).eq("id", p.id); migrated++; }
    catch (e: any) { errors.push(`cover ${p.id}: ${e?.message}`); }
  }

  const { count: remL } = await sb.from("listings").select("id", { count: "exact", head: true }).like("image", "data:%");
  const { count: remA } = await sb.from("profiles").select("id", { count: "exact", head: true }).like("avatar_url", "data:%");
  const { count: remC } = await sb.from("profiles").select("id", { count: "exact", head: true }).like("cover_url", "data:%");

  return NextResponse.json({ ok: true, migrated, remaining: (remL || 0) + (remA || 0) + (remC || 0), remL: remL || 0, remA: remA || 0, remC: remC || 0, errors: errors.slice(0, 5) });
}
