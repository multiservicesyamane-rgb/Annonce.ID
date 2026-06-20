import type { SupabaseClient } from "@supabase/supabase-js";
import { captionForListing } from "@/lib/gemini";
import { publishToAll, type SocialPlatform } from "@/lib/social";

const SITE = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://wanteermako.com";

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

// "all" (ou "meta") → tous les réseaux configurés ; sinon le réseau précis.
function targetsFor(platform?: string): SocialPlatform[] | undefined {
  if (!platform || platform === "all" || platform === "meta") return undefined;
  return [platform as SocialPlatform];
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

  const { data: posted } = await sb.from("campaign_posts").select("annonce_id");
  const postedIds = new Set((posted || []).map((p: any) => p.annonce_id).filter(Boolean));
  const pending = (listings || []).filter((l: any) => !postedIds.has(l.id)).slice(0, batchSize());

  const summary: any[] = [];
  for (const l of pending) {
    const { text: caption, source } = await captionForListing(l);
    const imageUrl = isUrl(l.image) ? l.image : undefined;
    const results = await publishToAll({ caption, imageUrl, link: listingLink(l.id, l.slug) });

    for (const r of results) {
      await sb.from("campaign_posts").insert({
        annonce_id: l.id,
        platform: r.platform,
        caption,
        image_url: imageUrl || null,
        post_url: r.postUrl || null,
        status: r.ok ? "published" : "failed",
        published_at: r.ok ? new Date().toISOString() : null,
      });
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
    await sb.from("campaign_posts").insert({
      annonce_id: l.id,
      platform: r.platform,
      caption,
      image_url: imageUrl || null,
      post_url: r.postUrl || null,
      status: r.ok ? "published" : "failed",
      published_at: r.ok ? new Date().toISOString() : null,
    });
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
    await sb.from("campaign_posts").update({
      status: ok ? "published" : "failed",
      published_at: ok ? new Date().toISOString() : null,
      post_url: firstUrl,
    }).eq("id", post.id);

    summary.push({ post_id: post.id, platform: post.platform, published: ok, results });
  }

  return { due: (due || []).length, summary };
}
