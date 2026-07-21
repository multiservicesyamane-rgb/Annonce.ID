import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendProspectEmailsBatch } from "@/lib/prospect-email";

export const dynamic = "force-dynamic";
// Jusqu'à 15 envois Brevo avec throttle → laisse le temps.
export const maxDuration = 60;

// Autorisation : Scheduled Function Netlify (Authorization: Bearer CRON_SECRET),
// comme /api/cron/prospect-harvest. Fermé si le secret manque en production.
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

  const result = await sendProspectEmailsBatch(sb);
  const status = "error" in result && result.error ? 500 : 200;
  return NextResponse.json(result, { status });
}

// GET/POST → Scheduled Function Netlify (netlify/functions/prospect-emails-cron.mjs) ou manuel.
export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
