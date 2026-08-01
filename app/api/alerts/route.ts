import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const MAX_ALERTS_PER_USER = 20;

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function clean(v: unknown): string {
  return String(v ?? "").trim().slice(0, 120);
}
function toInt(v: unknown): number | null {
  const n = Number(String(v ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

// Alertes de recherche de l'utilisateur connecté : lister, créer, supprimer.
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
      const { data, error } = await sb
        .from("search_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        if (/search_alerts/.test(error.message || "")) return NextResponse.json({ alerts: [] });
        throw error;
      }
      return NextResponse.json({ alerts: data || [] });
    }

    if (action === "create") {
      const { count } = await sb
        .from("search_alerts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count || 0) >= MAX_ALERTS_PER_USER) {
        return NextResponse.json({ error: `Maximum ${MAX_ALERTS_PER_USER} alertes. Supprimez-en une avant d'en créer une nouvelle.` }, { status: 400 });
      }

      const categorySlug = clean(body?.category_slug) || null;
      const location = clean(body?.location) || null;
      const keyword = clean(body?.keyword) || null;
      const priceMin = toInt(body?.price_min) ?? 0;
      const priceMax = toInt(body?.price_max);

      // Au moins un critère (sinon l'alerte notifierait TOUTES les annonces).
      if (!categorySlug && !location && !keyword && !priceMax) {
        return NextResponse.json({ error: "Précisez au moins un critère (catégorie, lieu, mot-clé ou prix max)." }, { status: 400 });
      }

      const payload = {
        user_id: user.id,
        email: user.email || null,
        category_slug: categorySlug,
        location,
        keyword,
        price_min: priceMin,
        price_max: priceMax,
        active: true,
      };
      const { data, error } = await sb.from("search_alerts").insert(payload).select("*").single();
      if (error) return NextResponse.json({ error: error.message || "Création impossible." }, { status: 500 });
      return NextResponse.json({ ok: true, alert: data });
    }

    if (action === "delete") {
      const id = clean(body?.id);
      if (!id) return NextResponse.json({ error: "Alerte requise." }, { status: 400 });
      const { error } = await sb.from("search_alerts").delete().eq("id", id).eq("user_id", user.id);
      if (error) return NextResponse.json({ error: error.message || "Suppression impossible." }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
