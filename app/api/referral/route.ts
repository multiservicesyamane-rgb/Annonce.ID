import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const POINTS_PER_REFERRAL = 50;
// Récompense parrainage : 1 boost Premium offert au parrain dès l'inscription
// d'un filleul (mode « généreux », sans condition).
const REFERRAL_BOOST = { boost_key: "premium", boost_name: "⭐ Premium (parrainage offert)", duration_days: 7 };
const isUuid = (s: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: Request) {
  const authClient = createServerClient();
  if (!authClient) return NextResponse.json({ ok: false, reason: "service indisponible" }, { status: 500 });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, reason: "connexion requise" }, { status: 401 });
  }

  const { userId, ref } = await req.json().catch(() => ({}));
  if (!isUuid(userId || "") || !isUuid(ref || "") || userId === ref) {
    return NextResponse.json({ ok: false, reason: "params invalides" }, { status: 400 });
  }
  if (user.id !== userId) {
    return NextResponse.json({ ok: false, reason: "utilisateur invalide" }, { status: 403 });
  }

  const sb = admin();
  if (!sb) return NextResponse.json({ ok: false, reason: "service indisponible" }, { status: 500 });

  try {
    const { data: sponsor } = await sb.from("profiles").select("id, referral_points").eq("id", ref).maybeSingle();
    if (!sponsor) return NextResponse.json({ ok: false, reason: "parrain introuvable" }, { status: 400 });

    const { data: updated, error: updateError } = await sb
      .from("profiles")
      .update({ referred_by: ref })
      .eq("id", user.id)
      .is("referred_by", null)
      .select("id")
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updated) return NextResponse.json({ ok: true, already: true });

    await sb.from("profiles").update({ referral_points: (sponsor.referral_points || 0) + POINTS_PER_REFERRAL }).eq("id", ref);
    try {
      await sb.from("points_ledger").insert({ user_id: ref, points: POINTS_PER_REFERRAL, reason: "Parrainage", created_at: new Date().toISOString() });
    } catch {
      // Table optionnelle.
    }

    // Boost Premium offert au parrain (apparaît dans ses crédits, applicable à
    // n'importe quelle annonce via /api/credits). N'échoue jamais le parrainage.
    let boostGifted = false;
    try {
      const { error: boostErr } = await sb.from("boost_credits").insert({
        user_id: ref,
        boost_key: REFERRAL_BOOST.boost_key,
        boost_name: REFERRAL_BOOST.boost_name,
        duration_days: REFERRAL_BOOST.duration_days,
        status: "available",
        source: "gift",
      });
      boostGifted = !boostErr;
    } catch {
      // Table boost_credits absente : le parrainage reste valide (points crédités).
    }

    return NextResponse.json({ ok: true, credited: POINTS_PER_REFERRAL, boostGifted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: e?.message }, { status: 500 });
  }
}
