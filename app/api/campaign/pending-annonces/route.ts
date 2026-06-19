import { NextResponse } from "next/server";
import { campaignAdmin, checkCampaignSecret } from "@/lib/campaign";

export const dynamic = "force-dynamic";

// Make.com (toutes les 15 min) → récupère les dernières annonces SANS post associé,
// pour déclencher la génération automatique (ChatGPT + Canva + Buffer).
export async function GET(req: Request) {
  if (!checkCampaignSecret(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const sb = campaignAdmin();
  if (!sb) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

  // annonces actives récentes
  const { data: listings, error } = await sb
    .from("listings")
    .select("id, title, description, price, category, location, image")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ids déjà postés
  const { data: posted } = await sb.from("campaign_posts").select("annonce_id");
  const postedIds = new Set((posted || []).map((p) => p.annonce_id).filter(Boolean));

  const pending = (listings || []).filter((l) => !postedIds.has(l.id)).slice(0, 10);
  return NextResponse.json({ count: pending.length, annonces: pending });
}
