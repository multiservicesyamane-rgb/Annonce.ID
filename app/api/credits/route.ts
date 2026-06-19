import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Crédits boost de l'utilisateur connecté : lister, et utiliser un crédit sur
// une de ses annonces. Tout est vérifié côté serveur avec sa session.
export async function POST(req: Request) {
  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const sb = admin();
    if (!sb) return NextResponse.json({ error: "Service indisponible (clé service role manquante)." }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "list") {
      const { data, error } = await sb.from("boost_credits").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) {
        if (/boost_credits/.test(error.message || "")) return NextResponse.json({ credits: [] });
        throw error;
      }
      return NextResponse.json({ credits: data || [] });
    }

    if (action === "use") {
      const { creditId, listingId } = body;
      if (!creditId || !listingId) return NextResponse.json({ error: "Crédit et annonce requis." }, { status: 400 });

      // Le crédit appartient-il à l'utilisateur et est-il disponible ?
      const { data: credit, error: cErr } = await sb.from("boost_credits").select("*").eq("id", creditId).eq("user_id", user.id).eq("status", "available").single();
      if (cErr || !credit) return NextResponse.json({ error: "Crédit introuvable ou déjà utilisé." }, { status: 400 });

      // L'annonce appartient-elle à l'utilisateur ?
      const { data: listing, error: lErr } = await sb.from("listings").select("id,user_id").eq("id", listingId).single();
      if (lErr || !listing || listing.user_id !== user.id) {
        return NextResponse.json({ error: "Cette annonce ne vous appartient pas." }, { status: 403 });
      }

      const days = credit.duration_days || 30;
      const expires = new Date(Date.now() + days * 86400000).toISOString();
      const featured = credit.boost_key === "alaune" || credit.boost_key === "vip";

      // Appliquer le boost à l'annonce (écriture adaptative simplifiée)
      let lp: any = { status: "active", premium: true, featured, is_premium: true, is_featured: featured, boost_key: credit.boost_key, premium_until: expires, boost_expires_at: expires };
      for (let i = 0; i < 10; i++) {
        const { error } = await sb.from("listings").update(lp).eq("id", listingId);
        if (!error) break;
        const m = error.message || "";
        const match = m.match(/'([^']+)' column/) || m.match(/column "([^"]+)"/) || m.match(/Could not find the '([^']+)'/);
        if (match && match[1] in lp) { delete lp[match[1]]; continue; }
        throw error;
      }

      // Marquer le crédit comme utilisé
      await sb.from("boost_credits").update({ status: "used", listing_id: listingId, used_at: new Date().toISOString(), expires_at: expires }).eq("id", creditId);

      return NextResponse.json({ ok: true, expires });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
