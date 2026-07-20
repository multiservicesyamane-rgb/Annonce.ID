import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BUCKET = "images";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["listings", "covers", "avatars", "campaigns"]);
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
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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

function parseImageDataUri(dataUri: string): { buffer: Buffer; mime: string } | null {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([a-z0-9+/=\s]+)$/i.exec(dataUri);
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const base64 = match[2].replace(/\s/g, "");

  if (!IMAGE_EXTENSIONS[mime] || !/^[a-z0-9+/]+={0,2}$/i.test(base64) || base64.length % 4 === 1) {
    return null;
  }

  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) return null;

  return { buffer, mime };
}

function hasValidImageSignature(buffer: Buffer, mime: string) {
  if (mime === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/gif") return buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"));
  if (mime === "image/webp") return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}
function getSafeFolder(folder: unknown) {
  const safeFolder = String(folder || "listings")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");

  return ALLOWED_FOLDERS.has(safeFolder) ? safeFolder : null;
}

export async function POST(req: Request) {
  try {
    const authClient = createServerClient();
    if (!authClient) {
      return NextResponse.json({ error: "Service indisponible." }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Connexion requise pour envoyer une image." }, { status: 401 });
    }

    const sb = admin();
    if (!sb) return NextResponse.json({ error: "Service indisponible." }, { status: 500 });

    const { dataUri, folder } = await req.json().catch(() => ({}));
    if (!dataUri || typeof dataUri !== "string") {
      return NextResponse.json({ error: "Image invalide." }, { status: 400 });
    }

    const image = parseImageDataUri(dataUri);
    if (!image) {
      return NextResponse.json({ error: "Format image invalide." }, { status: 400 });
    }

    const safeFolder = getSafeFolder(folder);
    if (!safeFolder) {
      return NextResponse.json({ error: "Dossier d'upload invalide." }, { status: 400 });
    }

    await ensureBucket(sb);

    const { buffer, mime } = image;
    if (buffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image trop volumineuse (max 10 Mo)." }, { status: 400 });
    }
    if (!hasValidImageSignature(buffer, mime)) {
      return NextResponse.json({ error: "Signature image invalide." }, { status: 400 });
    }

    const ext = IMAGE_EXTENSIONS[mime];
    const path = `${safeFolder}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await sb.storage.from(BUCKET).upload(path, buffer, { contentType: mime, upsert: false, cacheControl: "31536000" });
    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: "Upload impossible." }, { status: 500 });
    }

    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e: any) {
    console.error("Upload route error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
