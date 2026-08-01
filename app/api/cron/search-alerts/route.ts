import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifySearchAlerts } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Autorisation : Scheduled Function Netlify (Authorization: Bearer CRON_SECRET).
// En prod, fermé si le secret manque. En dev, ouvert pour pouvoir tester.
function authorized(req: Request): boolean {
  const cron = process.env.CRON_SECRET;
  if (!cron) return process.env.NODE_ENV !== "production";
  return (req.headers.get("authorization") || "") === `Bearer ${cron}`;
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const sb = admin();
  if (!sb) return NextResponse.json({ error: "Service indisponible (service role manquante)" }, { status: 500 });

  const alerts = await notifySearchAlerts(sb).catch(() => ({ listings: 0, emails: 0 }));
  return NextResponse.json({ ok: true, ...alerts });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
