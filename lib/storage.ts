import { createClient } from "@/lib/supabase/client";

// Nom du bucket Supabase Storage (public). À créer dans Supabase :
// Storage > New bucket > nom "images" > Public.
const BUCKET = "images";

/** Convertit une data URI base64 en Blob (côté navigateur). */
function dataURItoBlob(dataURI: string): Blob {
  const [meta, b64] = dataURI.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Envoie une image vers Supabase Storage et renvoie son URL publique.
 * - Si `src` est déjà une URL (http/https), elle est renvoyée telle quelle.
 * - Si l'upload échoue (bucket absent, hors-ligne...), on renvoie la base64
 *   d'origine pour ne pas bloquer l'utilisateur (repli dégradé).
 */
export async function uploadImage(src: string, folder = "listings"): Promise<string> {
  if (!src || !src.startsWith("data:")) return src; // déjà une URL distante

  try {
    const supabase = createClient();
    const blob = dataURItoBlob(src);
    const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false, cacheControl: "31536000" });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.warn("[storage] Upload échoué, repli sur base64:", e);
    return src; // repli : on garde la base64 pour ne pas casser la publication
  }
}

/** Envoie plusieurs images en parallèle et renvoie les URLs (ou base64 en repli). */
export async function uploadImages(srcs: string[], folder = "listings"): Promise<string[]> {
  return Promise.all((srcs || []).map((s) => uploadImage(s, folder)));
}
