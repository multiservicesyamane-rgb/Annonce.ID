import { NextResponse } from "next/server";
import { proContext, txt, isMissingTable } from "@/lib/proServer";

export const dynamic = "force-dynamic";

// Identité professionnelle : ce qui figure en en-tête des devis et factures.
// Une seule ligne par compte, créée à la première sauvegarde.
export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId } = ctx;

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "get") {
      const { data, error } = await sb
        .from("pro_settings").select("*").eq("user_id", userId).maybeSingle();
      if (error && isMissingTable(error)) return NextResponse.json({ settings: null, needsMigration: true });
      return NextResponse.json({ settings: data || null });
    }

    if (action === "save") {
      const rate = Math.min(100, Math.max(0, Number(body?.default_tax_rate) || 0));
      const payload = {
        user_id: userId,
        business_name: txt(body?.business_name, 200) || null,
        tax_id: txt(body?.tax_id, 60) || null,
        address: txt(body?.address, 300) || null,
        email: txt(body?.email, 160) || null,
        phone: txt(body?.phone, 40) || null,
        payment_details: txt(body?.payment_details, 500) || null,
        default_terms: txt(body?.default_terms, 1000) || null,
        default_tax_rate: rate,
        updated_at: new Date().toISOString(),
      };

      // `upsert` sur la clé primaire : une seule ligne par professionnel, qu'elle
      // existe déjà ou non.
      const { data, error } = await sb
        .from("pro_settings").upsert(payload, { onConflict: "user_id" }).select("*").single();
      if (error) {
        if (isMissingTable(error)) {
          return NextResponse.json({ error: "Table des réglages absente.", needsMigration: true }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Enregistrement impossible." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, settings: data });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
