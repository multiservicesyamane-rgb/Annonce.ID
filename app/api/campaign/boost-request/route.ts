import { NextResponse } from "next/server";
import { campaignAdmin, checkCampaignSecret } from "@/lib/campaign";

export const dynamic = "force-dynamic";

// Crée une demande de boost sponsorisé (liée à un plan existant) puis, si configuré,
// déclenche le webhook Make.com pour lancer la campagne Meta Ads.
export async function POST(req: Request) {
  if (!checkCampaignSecret(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const sb = campaignAdmin();
  if (!sb) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

  const b = await req.json().catch(() => ({}));
  const { annonce_id, user_id, plan_key, duration_days, platform, budget_fcfa } = b;

  const { data, error } = await sb.from("campaign_boosts").insert({
    annonce_id: annonce_id || null,
    user_id: user_id || null,
    plan_key: plan_key || null,
    duration_days: Number(duration_days) || 7,
    platform: platform || "both",
    budget_fcfa: Number(budget_fcfa) || 5000,
    status: "pending",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Déclenche Make.com (Meta Ads) si l'URL est configurée
  const hook = process.env.MAKE_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "boost_request", boost_id: data.id, ...b }),
      });
    } catch (e) { console.error("Make webhook error:", e); }
  }

  return NextResponse.json({ ok: true, id: data.id });
}
