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

/* ------------------------------------------------------------------ */
/* VIDÉO — présentation d'annonce (max 1 min 30)                       */
/* ------------------------------------------------------------------ */

const VIDEO_BUCKET = "videos";
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 Mo
export const MAX_VIDEO_SECONDS = 90; // 1 min 30

const VIDEO_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
};

/**
 * Lit la durée (en secondes) d'un fichier vidéo côté navigateur.
 * Gère le cas fréquent des MP4 de téléphone qui renvoient une durée `Infinity`
 * au chargement des métadonnées : on force le calcul par un « seek » très loin.
 * Rejette uniquement si le navigateur ne sait pas décoder la vidéo (HEVC…).
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;

    let timer: ReturnType<typeof setTimeout>;
    const cleanup = () => {
      clearTimeout(timer);
      v.onloadedmetadata = null;
      v.onerror = null;
      v.ontimeupdate = null;
      URL.revokeObjectURL(url);
    };
    const done = (d: number) => {
      cleanup();
      resolve(Number.isFinite(d) && d > 0 ? d : 0);
    };

    // Filet de sécurité : si rien ne se déclenche (fichier bloquant), on n'attend
    // pas indéfiniment — on considère la durée comme indéterminée (0).
    timer = setTimeout(() => done(0), 15000);

    v.onloadedmetadata = () => {
      if (v.duration === Infinity || Number.isNaN(v.duration)) {
        // Durée absente de l'en-tête : on saute très loin pour forcer son calcul.
        v.ontimeupdate = () => {
          v.ontimeupdate = null;
          done(v.duration);
        };
        try {
          v.currentTime = 1e101;
        } catch {
          done(0);
        }
      } else {
        done(v.duration);
      }
    };
    v.onerror = () => {
      const code = v.error?.code;
      cleanup();
      const err = new Error("Vidéo illisible.") as Error & { code?: number };
      err.code = code;
      reject(err);
    };
    v.src = url;
  });
}

/**
 * Envoie une vidéo directement vers Supabase Storage (bucket public `videos`).
 * Upload direct navigateur → Storage : indispensable car les fonctions
 * serveur Netlify sont limitées à ~6 Mo de corps de requête, trop peu pour
 * une vidéo. Renvoie l'URL publique.
 */
export async function uploadVideo(file: File): Promise<string> {
  if (!file) throw new Error("Aucune vidéo sélectionnée.");
  if (!file.type.startsWith("video/")) throw new Error("Le fichier doit être une vidéo.");
  if (file.size > MAX_VIDEO_BYTES) throw new Error("Vidéo trop lourde (max 50 Mo).");

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Connexion requise pour envoyer une vidéo.");

  const ext = VIDEO_EXTENSIONS[file.type] || (file.name.split(".").pop() || "mp4").toLowerCase();
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
  if (error) throw new Error(error.message || "Envoi de la vidéo impossible.");

  const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/* ------------------------------------------------------------------ */
/* DOCUMENTS — pièces jointes des projets de l'espace freelance        */
/* ------------------------------------------------------------------ */

const DOC_BUCKET = "pro-docs";
export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 Mo

/**
 * Envoie un document de projet (contrat, brief, livrable) vers le bucket
 * `pro-docs`. Upload direct navigateur → Storage, pour la même raison que les
 * vidéos : les fonctions serveur Netlify plafonnent à ~6 Mo de corps.
 *
 * Le bucket est public en lecture (chemin aléatoire, donc URL non devinable) :
 * le professionnel peut partager le lien à son client sans expiration.
 */
export async function uploadProDocument(file: File): Promise<{ name: string; url: string; size: number }> {
  if (!file) throw new Error("Aucun fichier sélectionné.");
  if (file.size > MAX_DOC_BYTES) throw new Error("Fichier trop lourd (max 10 Mo).");

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Connexion requise pour joindre un document.");

  // Nom d'origine conservé pour l'affichage, jamais pour le chemin : un nom de
  // fichier accentué ou espacé casse l'URL de stockage.
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(DOC_BUCKET)
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) throw new Error(error.message || "Envoi du document impossible.");

  const { data } = supabase.storage.from(DOC_BUCKET).getPublicUrl(path);
  return { name: file.name.slice(0, 160), url: data.publicUrl, size: file.size };
}
