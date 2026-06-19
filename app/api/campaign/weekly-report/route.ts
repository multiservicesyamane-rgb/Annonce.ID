import { NextResponse } from "next/server";
import { campaignAdmin, checkCampaignSecret } from "@/lib/campaign";

export const dynamic = "force-dynamic";

// Make.com → insère un rapport hebdomadaire.
export async function POST(req: Request) {
  if (!checkCampaignSecret(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const sb = campaignAdmin();
  if (!sb) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

  const b = await req.json().catch(() => ({}));
  const { error } = await sb.from("campaign_weekly_reports").insert({
    week_start: b.week_start || new Date().toISOString().slice(0, 10),
    total_views: Number(b.total_views) || 0,
    total_new_followers: Number(b.total_new_followers) || 0,
    avg_engagement_rate: Number(b.avg_engagement || b.avg_engagement_rate) || 0,
    total_clicks: Number(b.total_clicks) || 0,
    revenue_fcfa: Number(b.revenue_fcfa) || 0,
    boosts_sold: Number(b.boosts_sold) || 0,
    notes: b.notes || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
