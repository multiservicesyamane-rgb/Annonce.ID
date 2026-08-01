import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/push";
import { sendBrevoEmail } from "@/lib/brevo";

// Centre de notifications : création d'une notification (fil in-app + push),
// et balayage des annonces expirées. Nécessite database/MIGRATION_NOTIFICATIONS.sql.

export type NotificationType = "message" | "new_listing" | "listing_approved" | "listing_sold" | "listing_expired";

export interface NewNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  url?: string;
  listingId?: string;
  push?: boolean; // envoyer aussi un push (défaut true)
}

/**
 * Crée une notification pour un utilisateur (insertion via service role) et,
 * par défaut, envoie un push best-effort. Ne jette jamais : une notification
 * ratée ne doit pas casser l'action métier qui l'a déclenchée.
 */
export async function createNotification(sb: SupabaseClient, n: NewNotification): Promise<boolean> {
  if (!n.userId || !n.title) return false;
  try {
    const { error } = await sb.from("notifications").insert({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      body: n.body || null,
      url: n.url || null,
      listing_id: n.listingId || null,
    });
    if (error) return false;
  } catch {
    return false;
  }
  if (n.push !== false) {
    sendPushToUser(n.userId, { title: n.title, body: n.body || "", url: n.url, tag: n.type }).catch(() => {});
  }
  return true;
}

/**
 * Balaye les annonces expirées :
 *  - notifie le vendeur pour celles expirées dans les dernières 26 h (fraîches) ;
 *  - passe TOUTES les actives expirées au statut 'expired' (les anciennes sans
 *    notification, pour ne pas inonder l'historique).
 * Idempotent : une annonce ne repasse pas 'active' → pas de double notification.
 * Requiert un client service role (accès complet aux listings).
 */
export async function sweepExpiredListings(sb: SupabaseClient) {
  // Phase de lancement : l'expiration automatique est DÉSACTIVÉE par défaut.
  // Le site a encore peu d'annonces ; les faire expirer le viderait et viderait
  // aussi les boutiques (une boutique n'apparaît que si elle a une annonce active).
  // Pour la réactiver plus tard : LISTINGS_EXPIRATION=on dans l'environnement.
  if (process.env.LISTINGS_EXPIRATION !== "on") {
    return { notified: 0, expired: 0, skipped: "expiration désactivée (LISTINGS_EXPIRATION!=on)" };
  }

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const freshFromIso = new Date(now - 26 * 60 * 60 * 1000).toISOString();

  // 1) Fraîchement expirées → notifier
  const { data: fresh } = await sb
    .from("listings")
    .select("id, user_id, title")
    .eq("status", "active")
    .lt("expires_at", nowIso)
    .gte("expires_at", freshFromIso)
    .limit(200);

  let notified = 0;
  for (const l of fresh || []) {
    if (!l.user_id) continue;
    const ok = await createNotification(sb, {
      userId: l.user_id,
      type: "listing_expired",
      title: "⏰ Annonce expirée",
      body: `Ton annonce « ${l.title || "sans titre"} » a expiré. Renouvelle-la pour rester visible.`,
      url: "/dashboard?panel=ads",
      listingId: l.id,
    });
    if (ok) notified++;
  }

  // 2) Toutes les actives expirées → statut 'expired' (fraîches incluses).
  const { data: expired } = await sb
    .from("listings")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expires_at", nowIso)
    .select("id");

  return { notified, expired: expired?.length || 0 };
}

/* ------------------------------------------------------------------ */
/* T8 — Alertes de recherche : notifier les nouvelles annonces        */
/* ------------------------------------------------------------------ */

function priceNum(v: unknown): number {
  return Number(String(v ?? "").replace(/[^0-9]/g, "")) || 0;
}

// Une annonce correspond-elle aux critères d'une alerte ?
function listingMatchesAlert(l: any, a: any): boolean {
  if (a.category_slug && l.category_slug !== a.category_slug) return false;
  if (a.location) {
    const loc = String(l.location || "").toLowerCase();
    if (!loc.includes(String(a.location).toLowerCase())) return false;
  }
  const p = priceNum(l.price);
  if (p > 0) {
    if (a.price_min && p < Number(a.price_min)) return false;
    if (a.price_max && p > Number(a.price_max)) return false;
  }
  if (a.keyword) {
    const hay = `${l.title || ""} ${l.description || ""}`.toLowerCase();
    if (!hay.includes(String(a.keyword).toLowerCase())) return false;
  }
  return true;
}

function alertEmailHtml(o: { title: string; price: string; location: string; image?: string; url: string; manageUrl: string }): string {
  const safe = (s: string) => String(s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <p style="font-size:15px">🔔 Une nouvelle annonce correspond à votre alerte&nbsp;:</p>
    <a href="${o.url}" style="text-decoration:none;color:inherit">
      <div style="border:1px solid #eee;border-radius:12px;overflow:hidden">
        ${o.image ? `<img src="${o.image}" alt="" style="width:100%;max-height:260px;object-fit:cover;display:block"/>` : ""}
        <div style="padding:14px">
          <div style="font-size:16px;font-weight:bold">${safe(o.title)}</div>
          <div style="font-size:18px;font-weight:bold;color:#16a34a;margin-top:6px">${safe(o.price)}</div>
          <div style="font-size:13px;color:#666;margin-top:4px">📍 ${safe(o.location)}</div>
        </div>
      </div>
    </a>
    <p style="text-align:center;margin:18px 0">
      <a href="${o.url}" style="background:#16a34a;color:#fff;padding:11px 22px;border-radius:9px;text-decoration:none;font-weight:bold">Voir l'annonce</a>
    </p>
    <p style="font-size:12px;color:#999;text-align:center">Vous recevez cet email car vous avez créé une alerte sur Wanteermako.
      <br/><a href="${o.manageUrl}" style="color:#999">Gérer mes alertes</a></p>
  </div>`;
}

/**
 * Parcourt les annonces actives jamais traitées (récentes) et envoie un email
 * aux utilisateurs dont une alerte correspond. Chaque annonce est marquée
 * `alerts_sent_at` → traitée une seule fois (pas de doublon). Ne jette jamais.
 * Requiert un client service role + database/MIGRATION_SEARCH_ALERTS.sql.
 */
export async function notifySearchAlerts(sb: SupabaseClient) {
  try {
    const sinceIso = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: listings } = await sb
      .from("listings")
      .select("id, slug, title, description, price, category_slug, location, image, user_id, created_at, alerts_sent_at")
      .eq("status", "active")
      .is("alerts_sent_at", null)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true })
      .limit(50);
    if (!listings || listings.length === 0) return { listings: 0, emails: 0 };

    const { data: alerts } = await sb
      .from("search_alerts")
      .select("id, user_id, email, category_slug, location, price_min, price_max, keyword")
      .eq("active", true)
      .limit(2000);

    const base = process.env.NEXT_PUBLIC_APP_URL || "https://wanteermako.com";
    let emails = 0;

    for (const l of listings) {
      const matched = (alerts || []).filter((a: any) => a.user_id !== l.user_id && listingMatchesAlert(l, a));
      const seen = new Set<string>(); // 1 email max par destinataire et par annonce
      for (const a of matched) {
        const to = String(a.email || "").trim().toLowerCase();
        if (!to || seen.has(to)) continue;
        seen.add(to);
        const url = `${base}/annonce/${l.id}/${l.slug}`;
        const price = priceNum(l.price) ? `${priceNum(l.price).toLocaleString("fr-FR")} FCFA` : "Prix sur demande";
        const r = await sendBrevoEmail({
          to,
          subject: `🔔 Nouvelle annonce : ${String(l.title || "").slice(0, 60)}`,
          html: alertEmailHtml({ title: l.title, price, location: l.location || "Sénégal", image: l.image, url, manageUrl: `${base}/alertes` }),
        });
        if (r.ok) emails++;
        if (a.user_id) {
          createNotification(sb, {
            userId: a.user_id,
            type: "new_listing",
            title: "🔔 Nouvelle annonce correspondante",
            body: l.title || "",
            url: `/annonce/${l.id}/${l.slug}`,
            listingId: l.id,
          }).catch(() => {});
        }
      }
      // Marque l'annonce comme traitée (même sans match) → jamais re-scannée.
      await sb.from("listings").update({ alerts_sent_at: new Date().toISOString() }).eq("id", l.id);
    }
    return { listings: listings.length, emails };
  } catch {
    return { listings: 0, emails: 0 };
  }
}
