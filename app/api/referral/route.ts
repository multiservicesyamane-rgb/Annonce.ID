import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const POINTS_PER_REFERRAL = 50;
const isUuid = (s: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Enregistre un parrainage : le nouvel utilisateur (userId) a été parrainé par (ref).
// Crédite des points au parrain. Idempotent (1 seule fois par filleul).
export async function POST(req: Request) {
  const { userId, ref } = await req.json().catch(() => ({}));
  if (!isUuid(userId || "") || !isUuid(ref || "") || userId === ref) {
    return NextResponse.json({ ok: false, reason: "params invalides" });
  }
  const sb = admin();
  if (!sb) return NextResponse.json({ ok: false, reason: "service indisponible" });

  try {
    // Déjà parrainé ? → on ne crédite pas deux fois
    const { data: me } = await sb.from("profiles").select("referred_by").eq("id", userId).maybeSingle();
    if (me?.referred_by) return NextResponse.json({ ok: true, already: true });

    await sb.from("profiles").update({ referred_by: ref }).eq("id", userId);

    // Crédite le parrain (+points)
    const { data: sponsor } = await sb.from("profiles").select("referral_points").eq("id", ref).maybeSingle();
    if (sponsor) {
      await sb.from("profiles").update({ referral_points: (sponsor.referral_points || 0) + POINTS_PER_REFERRAL }).eq("id", ref);
      // Journal (best-effort)
      try { await sb.from("points_ledger").insert({ user_id: ref, points: POINTS_PER_REFERRAL, reason: "Parrainage", created_at: new Date().toISOString() }); } catch { /* table optionnelle */ }
    }
    return NextResponse.json({ ok: true, credited: POINTS_PER_REFERRAL });
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: e?.message });
  }
}
