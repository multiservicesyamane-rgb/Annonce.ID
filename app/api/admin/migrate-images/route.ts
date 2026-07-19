import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/serverSecurity";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "images";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["listings", "avatars", "covers"]);
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

let bucketReady = false;
async function ensureBucket(sb: any) {
  if (bucketReady) return;
  const { data } = await sb.storage.getBucket(BUCKET);
  if (!data) {
    await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_IMAGE_BYTES });
  }
  bucketReady = true;
}

function dataUriToBuffer(dataUri: string): { buffer: Buffer; mime: string } | null {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([a-z0-9+/=\s]+)$/i.exec(dataUri);
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const base64 = match[2].replace(/\s/g, "");

  if (!IMAGE_EXTENSIONS[mime] || !/^[a-z0-9+/]+={0,2}$/i.test(base64) || base64.length % 4 === 1) {
    return null;
  }

  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;

  return { buffer, mime };
}

async function up(sb: any, dataUri: string, folder: string): Promise<string> {
  const safeFolder = ALLOWED_FOLDERS.has(folder) ? folder : "listings";
  const image = dataUriToBuffer(dataUri);
  if (!image) throw new Error("Format image invalide.");

  await ensureBucket(sb);

  const { buffer, mime } = image;
  const ext = IMAGE_EXTENSIONS[mime];
  const path = `${safeFolder}/migration/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, { contentType: mime, cacheControl: "31536000" });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function POST(req: Request) {
  const { pass, otp } = await req.json().catch(() => ({}));
  const adminAuth = verifyAdminPassword(req, pass, { otp });
  if (!adminAuth.ok) return adminAuth.response;
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

  const { data: lp } = await sb.from("listings").select("id, photos").not("photos", "is", null).limit(60);
  for (const l of lp || []) {
    const arr = Array.isArray(l.photos) ? l.photos : [];
    if (!arr.some((p: any) => typeof p === "string" && p.startsWith("data:"))) continue;
    const next: string[] = [];
    for (const p of arr) {
      if (typeof p === "string" && p.startsWith("data:")) {
        try { next.push(await up(sb, p, "listings")); migrated++; } catch { next.push(p); }
      } else next.push(p);
    }
    try { await sb.from("listings").update({ photos: next }).eq("id", l.id); } catch { /* ignore */ }
  }

  const { count: remL } = await sb.from("listings").select("id", { count: "exact", head: true }).like("image", "data:%");
  const { count: remA } = await sb.from("profiles").select("id", { count: "exact", head: true }).like("avatar_url", "data:%");
  const { count: remC } = await sb.from("profiles").select("id", { count: "exact", head: true }).like("cover_url", "data:%");

  return NextResponse.json({ ok: true, migrated, remaining: (remL || 0) + (remA || 0) + (remC || 0), remL: remL || 0, remA: remA || 0, remC: remC || 0, errors: errors.slice(0, 5) });
}
