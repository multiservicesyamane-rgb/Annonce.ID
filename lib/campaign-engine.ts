import type { SupabaseClient } from "@supabase/supabase-js";
import { captionForListing } from "@/lib/gemini";
import { publishToAll, type PublishResult, type SocialPlatform } from "@/lib/social";

const SITE = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://wanteermako.com";

// Reprise sur échec : 3 tentatives max, espacées de 6 h (le cron passe 3×/jour).
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 6 * 60 * 60 * 1000;

function batchSize() {
  return Number(process.env.CAMPAIGN_BATCH_SIZE) || 3;
}
function isUrl(v: unknown): v is string {
  return typeof v === "string" && /^https?:\/\//i.test(v);
}
function listingLink(id: string, slug?: string) {
  // Lien court et professionnel : wanteermako.com/<slug> (redirige vers la fiche).
  // Repli sur l'URL canonique si le slug manque.
  return slug ? `${SITE}/${slug}` : `${SITE}/annonce/${id}`;
}
function nextAttemptIso() {
  return new Date(Date.now() + RETRY_DELAY_MS).toISOString();
}

// "all" (ou "meta") → tous les réseaux configurés ; sinon le réseau précis.
function targetsFor(platform?: string): SocialPlatform[] | undefined {
  if (!platform || platform === "all" || platform === "meta") return undefined;
  return [platform as SocialPlatform];
}

// Colonnes ajoutées par database/MIGRATION_CAMPAIGN_RETRY.sql. Tant que la
// migration n'est pas exécutée, insert/update retombent sur le schéma d'origine
// pour ne jamais bloquer la publication.
const RETRY_COLUMNS = ["attempts", "error_message", "next_attempt_at"] as const;

function isMissingColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  return error.code === "42703" || error.code === "PGRST204" || msg.includes("column");
}
function withoutRetryColumns(row: Record<string, unknown>) {
  const legacy: Record<string, unknown> = { ...row };
  for (const c of RETRY_COLUMNS) delete legacy[c];
  return legacy;
}
async function insertPost(sb: SupabaseClient, row: Record<string, unknown>) {
  const { error } = await sb.from("campaign_posts").insert(row);
  if (error && isMissingColumn(error)) {
    await sb.from("campaign_posts").insert(withoutRetryColumns(row));
  }
}
async function updatePost(sb: SupabaseClient, id: string, patch: Record<string, unknown>) {
  const { error } = await sb.from("campaign_posts").update(patch).eq("id", id);
  if (error && isMissingColumn(error)) {
    await sb.from("campaign_posts").update(withoutRetryColumns(patch)).eq("id", id);
  }
}

// Ligne campaign_posts pour un résultat de publication (succès ou échec).
function postRow(annonceId: string, caption: string, imageUrl: string | undefined, r: PublishResult) {
  return {
    annonce_id: annonceId,
    platform: r.platform,
    caption,
    image_url: imageUrl || null,
    post_url: r.postUrl || null,
    status: r.ok ? "published" : "failed",
    published_at: r.ok ? new Date().toISOString() : null,
    attempts: 1,
    error_message: r.ok ? null : r.error || "échec inconnu",
    next_attempt_at: r.ok ? null : nextAttemptIso(),
  };
}

/**
 * Phase 1 — Publie les NOUVELLES annonces actives qui n'ont encore aucun post.
 * Génère la légende avec Gemini, publie sur tous les réseaux configurés.
 */
export async function publishPendingAnnonces(sb: SupabaseClient) {
  const { data: listings } = await sb
    .from("listings")
    .select("id, title, slug, description, price, category, location, image")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(40);

  const candidates = listings || [];

  // Dédup ciblée sur les seules candidates. (L'ancien code chargeait TOUTE la
  // table campaign_posts, plafonnée à 1000 lignes par Supabase : au-delà, la
  // dédup devenait aléatoire → doublons sur les réseaux.)
  let postedIds = new Set<string>();
  if (candidates.length) {
    const { data: posted } = await sb
      .from("campaign_posts")
      .select("annonce_id")
      .in("annonce_id", candidates.map((l: any) => l.id));
    postedIds = new Set((posted || []).map((p: any) => p.annonce_id).filter(Boolean));
  }
  const pending = candidates.filter((l: any) => !postedIds.has(l.id)).slice(0, batchSize());

  const summary: any[] = [];
  for (const l of pending) {
    const { text: caption, source } = await captionForListing(l);
    const imageUrl = isUrl(l.image) ? l.image : undefined;
    const results = await publishToAll({ caption, imageUrl, link: listingLink(l.id, l.slug) });

    for (const r of results) {
      await insertPost(sb, postRow(l.id, caption, imageUrl, r));
    }
    summary.push({ annonce_id: l.id, title: l.title, caption_source: source, results });
  }

  return { annonces: pending.length, summary };
}

/**
 * Publication INSTANTANÉE d'une seule annonce, déclenchée au moment où elle
 * devient "active" sur le site. Idempotent : ne republie pas si déjà posté.
 */
export async function publishOneListing(sb: SupabaseClient, listingId: string) {
  if (!listingId) return { ok: false, reason: "listingId manquant" };

  const { data: l } = await sb
    .from("listings")
    .select("id, title, slug, description, price, category, location, image, status")
    .eq("id", listingId)
    .maybeSingle();

  if (!l) return { ok: false, reason: "annonce introuvable" };
  if (l.status !== "active") return { ok: false, skipped: true, reason: "annonce non active" };

  // Anti-doublon : si l'annonce a déjà au moins un post, on ne republie pas.
  const { data: already } = await sb.from("campaign_posts").select("id").eq("annonce_id", listingId).limit(1);
  if (already && already.length) return { ok: true, skipped: true, reason: "déjà publié" };

  const { text: caption, source } = await captionForListing(l);
  const imageUrl = isUrl(l.image) ? l.image : undefined;
  const results = await publishToAll({ caption, imageUrl, link: listingLink(l.id, l.slug) });

  for (const r of results) {
    await insertPost(sb, postRow(l.id, caption, imageUrl, r));
  }

  return { ok: true, annonce_id: l.id, caption_source: source, results };
}

/**
 * Phase 2 — Publie les posts PLANIFIÉS dont l'heure est arrivée
 * (status = scheduled ET scheduled_at <= maintenant). Rend le calendrier fonctionnel.
 */
export async function publishDueScheduled(sb: SupabaseClient) {
  const nowIso = new Date().toISOString();
  const { data: due } = await sb
    .from("campaign_posts")
    .select("id, annonce_id, platform, caption, image_url")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso)
    .limit(20);

  const summary: any[] = [];
  for (const post of due || []) {
    // Lien vers l'annonce associée (si dispo)
    let link: string | undefined;
    if (post.annonce_id) {
      const { data: l } = await sb.from("listings").select("id, slug").eq("id", post.annonce_id).maybeSingle();
      if (l) link = listingLink(l.id, l.slug);
    }

    const only = targetsFor(post.platform);
    const results = await publishToAll(
      { caption: post.caption || "", imageUrl: isUrl(post.image_url) ? post.image_url : undefined, link },
      only,
    );

    if (!results.length) {
      // Aucun réseau configuré pour cette plateforme → on laisse planifié, mais on signale.
      summary.push({ post_id: post.id, platform: post.platform, published: false, reason: "réseau non configuré" });
      continue;
    }

    const ok = results.some((r) => r.ok);
    const firstUrl = results.find((r) => r.ok)?.postUrl || null;
    const firstErr = results.find((r) => !r.ok)?.error || null;
    await updatePost(sb, post.id, {
      status: ok ? "published" : "failed",
      published_at: ok ? new Date().toISOString() : null,
      post_url: firstUrl,
      attempts: 1,
      error_message: ok ? null : firstErr || "échec inconnu",
      next_attempt_at: ok ? null : nextAttemptIso(),
    });

    summary.push({ post_id: post.id, platform: post.platform, published: ok, results });
  }

  return { due: (due || []).length, summary };
}

/**
 * Phase 3 — Retente les posts en ÉCHEC (max 3 tentatives, espacées de 6 h).
 * Un échec de publication ne bloque jamais l'annonce elle-même.
 * Nécessite database/MIGRATION_CAMPAIGN_RETRY.sql ; sans elle, la phase est ignorée.
 */
export async function retryFailedPosts(sb: SupabaseClient) {
  const nowIso = new Date().toISOString();
  const { data: failed, error } = await sb
    .from("campaign_posts")
    .select("id, annonce_id, platform, caption, image_url, attempts")
    .eq("status", "failed")
    .lt("attempts", MAX_ATTEMPTS)
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso}`)
    .limit(10);

  if (error) {
    return { retried: 0, skipped: true, reason: "Exécuter database/MIGRATION_CAMPAIGN_RETRY.sql pour activer la reprise" };
  }

  const summary: any[] = [];
  for (const post of failed || []) {
    const attempts = (post.attempts || 0) + 1;

    // L'annonce doit toujours exister et être active, sinon on abandonne le post.
    let listing: { id: string; slug?: string; status?: string } | null = null;
    if (post.annonce_id) {
      const { data: l } = await sb.from("listings").select("id, slug, status").eq("id", post.annonce_id).maybeSingle();
      listing = l as any;
    }
    if (!listing || listing.status !== "active") {
      await updatePost(sb, post.id, { attempts: MAX_ATTEMPTS, error_message: "annonce plus active — abandon" });
      summary.push({ post_id: post.id, platform: post.platform, published: false, reason: "annonce plus active" });
      continue;
    }

    const results = await publishToAll(
      { caption: post.caption || "", imageUrl: isUrl(post.image_url) ? post.image_url : undefined, link: listingLink(listing.id, listing.slug) },
      targetsFor(post.platform),
    );
    const r = results.find((x) => x.ok) || results[0];
    if (!r) {
      // Réseau non configuré : on ne consomme pas de tentative.
      summary.push({ post_id: post.id, platform: post.platform, published: false, reason: "réseau non configuré" });
      continue;
    }

    if (r.ok) {
      await updatePost(sb, post.id, {
        status: "published",
        published_at: new Date().toISOString(),
        post_url: r.postUrl || null,
        attempts,
        error_message: null,
        next_attempt_at: null,
      });
    } else {
      await updatePost(sb, post.id, {
        attempts,
        error_message: r.error || "échec inconnu",
        next_attempt_at: attempts < MAX_ATTEMPTS ? nextAttemptIso() : null,
      });
    }
    summary.push({ post_id: post.id, platform: post.platform, published: r.ok, attempts });
  }

  return { retried: (failed || []).length, summary };
}
