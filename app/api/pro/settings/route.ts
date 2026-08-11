import { NextResponse } from "next/server";
import { proContext, txt, isMissingTable, isMissingColumn } from "@/lib/proServer";
import { sanitizeSections } from "@/lib/pro";

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

    // Espace pro activé ? Sert à décider si le basculeur de mode s'affiche.
    // Volontairement léger : trois comptages sans corps de réponse, là où
    // /api/pro/dashboard rapatrie toutes les pièces du compte.
    //
    // Est « activé » celui qui l'a demandé (ligne pro_settings créée) OU celui
    // qui a déjà travaillé avec (un client, un devis, une facture). Le second
    // cas évite de faire disparaître le module sous les pieds de quelqu'un qui
    // s'en sert déjà — aucune migration nécessaire pour autant.
    if (action === "status") {
      const [settingsRow, clientsRes, quotesRes, invoicesRes] = await Promise.all([
        sb.from("pro_settings").select("user_id").eq("user_id", userId).maybeSingle(),
        ...["pro_clients", "pro_quotes", "pro_invoices"].map((t) =>
          sb.from(t).select("id", { count: "exact", head: true }).eq("user_id", userId),
        ),
      ]);

      if (settingsRow.error && isMissingTable(settingsRow.error)) {
        return NextResponse.json({ activated: false, needsMigration: true });
      }

      const counts = {
        clients: clientsRes?.count || 0,
        quotes: quotesRes?.count || 0,
        invoices: invoicesRes?.count || 0,
      };
      const used = counts.clients > 0 || counts.quotes > 0 || counts.invoices > 0;

      return NextResponse.json({ activated: !!settingsRow.data || used, counts });
    }

    // Activation explicite : créer la ligne de réglages suffit à marquer le
    // choix, côté serveur donc valable sur tous les appareils du compte.
    if (action === "activate") {
      const { error } = await sb
        .from("pro_settings")
        .upsert({ user_id: userId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) {
        if (isMissingTable(error)) {
          return NextResponse.json({ error: "Table des réglages absente.", needsMigration: true }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Activation impossible." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, activated: true });
    }

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
      } as Record<string, unknown>;

      // Rubriques de devis : envoyées uniquement par l'écran qui les édite.
      // Absentes du corps, elles ne doivent pas être écrasées par un simple
      // enregistrement de l'identité professionnelle.
      if (body?.quote_sections !== undefined) {
        payload.quote_sections = sanitizeSections(body.quote_sections);
      }

      // `upsert` sur la clé primaire : une seule ligne par professionnel, qu'elle
      // existe déjà ou non.
      let { data, error } = await sb
        .from("pro_settings").upsert(payload, { onConflict: "user_id" }).select("*").single();

      // Colonne `quote_sections` pas encore créée : plutôt que de faire échouer
      // tout l'enregistrement — y compris l'identité professionnelle, qui n'a
      // rien demandé — on réessaie sans elle et on signale ce qui n'a pas pu
      // être conservé.
      let sectionsSkipped = false;
      if (error && isMissingColumn(error) && "quote_sections" in payload) {
        const { quote_sections: _drop, ...legacy } = payload;
        ({ data, error } = await sb
          .from("pro_settings").upsert(legacy, { onConflict: "user_id" }).select("*").single());
        sectionsSkipped = !error;
      }

      if (error) {
        if (isMissingTable(error)) {
          return NextResponse.json({ error: "Table des réglages absente.", needsMigration: true }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Enregistrement impossible." }, { status: 500 });
      }
      if (sectionsSkipped) {
        return NextResponse.json({
          ok: true,
          settings: data,
          warning: "Rubriques non enregistrées : exécutez database/MIGRATION_QUOTE_SECTIONS.sql dans Supabase.",
        });
      }
      return NextResponse.json({ ok: true, settings: data });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
