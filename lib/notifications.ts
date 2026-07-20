import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/push";

// Centre de notifications : création d'une notification (fil in-app + push),
// et balayage des annonces expirées. Nécessite database/MIGRATION_NOTIFICATIONS.sql.

export type NotificationType = "message" | "listing_approved" | "listing_sold" | "listing_expired";

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
