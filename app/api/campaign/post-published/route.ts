import { NextResponse } from "next/server";
import { campaignAdmin, checkCampaignSecret } from "@/lib/campaign";

export const dynamic = "force-dynamic";

// Make.com → enregistre un post publié dans campaign_posts (status=published).
export async function POST(req: Request) {
  if (!checkCampaignSecret(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const sb = campaignAdmin();
  if (!sb) return NextResponse.json({ error: "Service indisponible (service role manquante)" }, { status: 500 });

  const b = await req.json().catch(() => ({}));
  const { annonce_id, platform, caption, image_url, post_url, reach, reactions, shares, make_scenario_id } = b;
  if (!platform) return NextResponse.json({ error: "platform requis" }, { status: 400 });

  const { data, error } = await sb.from("campaign_posts").insert({
    annonce_id: annonce_id || null,
    platform,
    caption: caption || null,
    image_url: image_url || null,
    post_url: post_url || null,
    reach: Number(reach) || 0,
    reactions: Number(reactions) || 0,
    shares: Number(shares) || 0,
    make_scenario_id: make_scenario_id || null,
    status: "published",
    published_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
