import { NextResponse } from "next/server";
import { campaignAdmin, checkCampaignSecret } from "@/lib/campaign";

export const dynamic = "force-dynamic";

// Make.com → upsert des stats sociales du jour (par date + plateforme).
export async function POST(req: Request) {
  if (!checkCampaignSecret(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const sb = campaignAdmin();
  if (!sb) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

  const b = await req.json().catch(() => ({}));
  const { date, platform, views, new_followers, engagement_rate, clicks_to_site, is_viral } = b;
  if (!platform) return NextResponse.json({ error: "platform requis" }, { status: 400 });
  const day = date || new Date().toISOString().slice(0, 10);

  // upsert manuel (date + platform)
  const { data: existing } = await sb.from("campaign_daily_stats").select("id").eq("date", day).eq("platform", platform).maybeSingle();
  const row = {
    date: day, platform,
    views: Number(views) || 0,
    new_followers: Number(new_followers) || 0,
    engagement_rate: Number(engagement_rate) || 0,
    clicks_to_site: Number(clicks_to_site) || 0,
    is_viral: !!is_viral,
  };
  const { error } = existing
    ? await sb.from("campaign_daily_stats").update(row).eq("id", existing.id)
    : await sb.from("campaign_daily_stats").insert(row);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
