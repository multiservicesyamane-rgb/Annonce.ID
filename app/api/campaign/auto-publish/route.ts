import { NextResponse } from "next/server";
import { campaignAdmin } from "@/lib/campaign";
import { configuredPlatforms } from "@/lib/social";
import { publishPendingAnnonces, publishDueScheduled, retryFailedPosts } from "@/lib/campaign-engine";

export const dynamic = "force-dynamic";
// Laisse le temps à l'IA + aux réseaux de répondre.
export const maxDuration = 60;

// Autorisation : Scheduled Function Netlify (Authorization: Bearer CRON_SECRET) OU header manuel
// x-campaign-secret (= CAMPAIGN_WEBHOOK_SECRET). Si aucun secret configuré → ouvert (mode test).
function authorized(req: Request): boolean {
  const cron = process.env.CRON_SECRET;
  const camp = process.env.CAMPAIGN_WEBHOOK_SECRET;
  if (!cron && !camp) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization") || "";
  if (cron && auth === `Bearer ${cron}`) return true;
  if (camp && (req.headers.get("x-campaign-secret") || "") === camp) return true;
  return false;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const platforms = configuredPlatforms();
  if (!platforms.length) {
    return NextResponse.json(
      { error: "Aucun réseau configuré. Renseignez TELEGRAM_BOT_TOKEN/TELEGRAM_CHANNEL_ID ou META_PAGE_ID/META_ACCESS_TOKEN." },
      { status: 503 },
    );
  }

  const sb = campaignAdmin();
  if (!sb) return NextResponse.json({ error: "Service indisponible (service role manquante)" }, { status: 500 });

  // Phase 1 : posts planifiés arrivés à échéance. Phase 2 : nouvelles annonces
  // sans post. Phase 3 : reprise des posts en échec (max 3 tentatives).
  const scheduled = await publishDueScheduled(sb);
  const pending = await publishPendingAnnonces(sb);
  const retried = await retryFailedPosts(sb);

  return NextResponse.json({ ok: true, platforms, scheduled, pending, retried });
}

// GET/POST → Scheduled Function Netlify (netlify/functions/auto-publish-cron.mjs) ou déclenchement manuel.
export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
