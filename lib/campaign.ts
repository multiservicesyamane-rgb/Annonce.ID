import { createClient } from "@supabase/supabase-js";

// Client Supabase avec clé service_role (bypass RLS) — UNIQUEMENT côté serveur.
export function campaignAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Sécurité des webhooks Make.com : si CAMPAIGN_WEBHOOK_SECRET est défini, on exige
// le header "x-campaign-secret". Sinon (non configuré) on laisse passer (mode test).
export function checkCampaignSecret(req: Request): boolean {
  const secret = process.env.CAMPAIGN_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return (req.headers.get("x-campaign-secret") || "") === secret;
}
