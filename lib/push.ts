// Envoi de notifications push (Web Push / VAPID). No-op si non configuré.
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

let configured = false;
function ensure(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contact@wanteermako.com", pub, priv);
  configured = true;
  return true;
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string; icon?: string };

/** Envoie une notification push à tous les appareils d'un utilisateur. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ensure()) return 0;
  const sb = admin();
  if (!sb || !userId) return 0;
  const { data: subs } = await sb.from("push_subscriptions").select("*").eq("user_id", userId);
  if (!subs || subs.length === 0) return 0;
  const data = JSON.stringify(payload);
  let sent = 0;
  await Promise.all(
    subs.map(async (s: any) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, data);
        sent++;
      } catch (e: any) {
        // Abonnement expiré/invalide → on le supprime
        if (e?.statusCode === 410 || e?.statusCode === 404) {
          await sb.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    })
  );
  return sent;
}
