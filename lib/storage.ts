import { createClient } from "@/lib/supabase/client";

const BUCKET = "images";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["listings", "covers", "avatars", "campaigns"]);
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getSafeFolder(folder: string) {
  const safeFolder = String(folder || "listings")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");

  return ALLOWED_FOLDERS.has(safeFolder) ? safeFolder : null;
}

function dataURItoBlob(dataURI: string): Blob {
  const [meta, b64] = dataURI.split(",");
  const mime = (meta.match(/^data:(image\/(?:jpeg|png|webp|gif));base64$/i)?.[1] || "").toLowerCase();

  if (!mime || !IMAGE_EXTENSIONS[mime] || !b64) {
    throw new Error("Format image invalide.");
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image trop volumineuse.");
  }

  return new Blob([bytes], { type: mime });
}

export async function uploadImage(src: string, folder = "listings"): Promise<string> {
  if (!src || !src.startsWith("data:")) return src;

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUri: src, folder }),
    });
    const data = await res.json();
    if (res.ok && data?.url) return data.url;
    console.warn("[storage] Upload serveur refuse:", data?.error);
  } catch (e) {
    console.warn("[storage] Upload serveur indisponible:", e);
  }

  try {
    const safeFolder = getSafeFolder(folder);
    if (!safeFolder) throw new Error("Dossier d'upload invalide.");

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Connexion requise pour envoyer une image.");

    const blob = dataURItoBlob(src);
    const ext = IMAGE_EXTENSIONS[blob.type] || "jpg";
    const path = `${safeFolder}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false, cacheControl: "31536000" });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.warn("[storage] Upload echoue, repli sur base64:", e);
    return src;
  }
}

export async function uploadImages(srcs: string[], folder = "listings"): Promise<string[]> {
  return Promise.all((srcs || []).map((s) => uploadImage(s, folder)));
}
