import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Signalement d'une annonce. Insertion serveur (service role) dans la table
// "reports". Tolérant : si la table n'existe pas encore, on n'échoue pas.
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const { listingId, reason, details, contact } = await req.json().catch(() => ({}));
    if (!listingId || !reason) {
      return NextResponse.json({ error: "Motif requis." }, { status: 400 });
    }
    const sb = admin();
    if (!sb) return NextResponse.json({ ok: true }); // pas de service role : on n'expose pas l'erreur

    const { error } = await sb.from("reports").insert({
      listing_id: listingId,
      reason: String(reason).slice(0, 120),
      details: String(details || "").slice(0, 1000),
      contact: String(contact || "").slice(0, 200),
      status: "open",
    });
    if (error) {
      console.error("Report insert error:", error.message);
      // Table manquante ou autre : on confirme quand même au visiteur.
      return NextResponse.json({ ok: true, stored: false });
    }
    return NextResponse.json({ ok: true, stored: true });
  } catch (e: any) {
    console.error("Report route error:", e);
    return NextResponse.json({ ok: true, stored: false });
  }
}
