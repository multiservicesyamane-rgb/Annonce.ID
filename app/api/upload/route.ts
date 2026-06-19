import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BUCKET = "images";

// Upload serveur via la clé service_role : crée le bucket public au besoin et
// contourne les soucis de permissions Storage côté navigateur. Renvoie l'URL.
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
    await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
  }
  bucketReady = true;
}

function dataUriToBuffer(dataUri: string): { buffer: Buffer; mime: string } {
  const [meta, b64] = dataUri.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
  return { buffer: Buffer.from(b64, "base64"), mime };
}

export async function POST(req: Request) {
  try {
    const sb = admin();
    if (!sb) return NextResponse.json({ error: "Service indisponible (clé service role manquante)." }, { status: 500 });

    const { dataUri, folder } = await req.json().catch(() => ({}));
    if (!dataUri || typeof dataUri !== "string" || !dataUri.startsWith("data:")) {
      return NextResponse.json({ error: "Image invalide." }, { status: 400 });
    }

    await ensureBucket(sb);

    const { buffer, mime } = dataUriToBuffer(dataUri);
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image trop volumineuse (max 10 Mo)." }, { status: 400 });
    }
    const ext = (mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const safeFolder = String(folder || "listings").replace(/[^a-z0-9_-]/gi, "") || "listings";
    const path = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await sb.storage.from(BUCKET).upload(path, buffer, { contentType: mime, upsert: false, cacheControl: "31536000" });
    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e: any) {
    console.error("Upload route error:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
