import { NextResponse } from "next/server";
import { campaignAdmin } from "@/lib/campaign";
import { publishOneListing } from "@/lib/campaign-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Publication INSTANTANÉE d'une annonce dès qu'elle est publiée sur le site.
// Idempotent (ne republie pas) → sûr même appelé plusieurs fois.
export async function POST(req: Request) {
  const sb = campaignAdmin();
  if (!sb) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

  const { listingId } = await req.json().catch(() => ({}));
  if (!listingId) return NextResponse.json({ error: "listingId requis" }, { status: 400 });

  const result = await publishOneListing(sb, listingId);
  return NextResponse.json(result);
}
