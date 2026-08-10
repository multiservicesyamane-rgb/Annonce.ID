import { NextResponse } from "next/server";
import { createClient as createAdmin, type SupabaseClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notifications";
import { sanitizeItems, computeTotals, publicToken, documentNumber, formatFcfa } from "@/lib/pro";

export const dynamic = "force-dynamic";

// Acceptation d'un devis par le CLIENT, depuis le lien public.
// Aucune session requise : c'est le jeton long et imprévisible du lien qui
// fait autorité. On n'expose jamais rien d'autre que ce devis précis.
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function logEvent(sb: SupabaseClient, userId: string, entity: string, entityId: string | null, kind: string, message: string) {
  try {
    await sb.from("pro_events").insert({ user_id: userId, entity, entity_id: entityId, kind, message: message.slice(0, 300) });
  } catch { /* journal secondaire */ }
}

/**
 * Conversion automatique du devis accepté en facture (brouillon) et, si le
 * devis n'était rattaché à aucun projet, ouverture du projet correspondant.
 * Le professionnel retrouve donc sa mission et sa facture prêtes sans rien
 * faire — c'est le cœur de la chaîne Devis → Acceptation → Facture.
 *
 * Volontairement tolérant aux erreurs : si la facture ne peut pas être créée,
 * l'acceptation du devis reste valide. Le client ne doit jamais voir échouer
 * son « J'accepte » à cause d'un problème interne.
 */
async function convertAcceptedQuote(sb: SupabaseClient, quote: any) {
  let projectId = quote.project_id || null;

  try {
    if (!projectId) {
      const { data: project } = await sb
        .from("pro_projects")
        .insert({
          user_id: quote.user_id,
          client_id: quote.client_id,
          name: quote.title,
          description: quote.note || null,
          budget: Number(quote.total) || 0,
          start_date: new Date().toISOString().slice(0, 10),
          due_date: quote.valid_until || null,
          status: "active",
          progress: 0,
        })
        .select("id")
        .single();
      if (project) {
        projectId = project.id;
        await sb.from("pro_quotes").update({ project_id: projectId }).eq("id", quote.id);
        await logEvent(sb, quote.user_id, "project", projectId, "created", `Projet ouvert depuis le devis ${quote.number || ""}`);
      }
    }
  } catch { /* le projet est un confort, pas un prérequis */ }

  try {
    const { data: exists } = await sb
      .from("pro_invoices").select("id").eq("quote_id", quote.id).maybeSingle();
    if (exists) return { projectId, invoice: null };

    const items = sanitizeItems(quote.items);
    const t = computeTotals(items, Number(quote.discount) || 0, Number(quote.tax_rate) || 0);

    const { count } = await sb
      .from("pro_invoices").select("id", { count: "exact", head: true }).eq("user_id", quote.user_id);

    const due = new Date();
    due.setDate(due.getDate() + 30);

    const { data: invoice } = await sb
      .from("pro_invoices")
      .insert({
        user_id: quote.user_id,
        client_id: quote.client_id,
        project_id: projectId,
        quote_id: quote.id,
        number: documentNumber("FAC", count || 0),
        title: quote.title,
        items,
        subtotal: t.subtotal,
        discount: t.discount,
        tax_rate: t.taxRate,
        tax_amount: t.taxAmount,
        total: t.total,
        paid_amount: 0,
        status: "draft",
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: due.toISOString().slice(0, 10),
        terms: quote.terms || null,
        public_token: publicToken(),
      })
      .select("id, number")
      .single();

    if (invoice) {
      await logEvent(sb, quote.user_id, "invoice", invoice.id, "created", `Facture ${invoice.number} générée automatiquement`);
    }
    return { projectId, invoice };
  } catch {
    return { projectId, invoice: null };
  }
}

export async function POST(req: Request) {
  try {
    const sb = admin();
    if (!sb) return NextResponse.json({ error: "Service indisponible." }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || "").trim();
    const action = body?.action;

    // Jeton de 48 caractères hexadécimaux : tout le reste est rejeté d'emblée.
    if (!/^[a-f0-9]{48}$/.test(token)) {
      return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
    }

    const { data: quote } = await sb
      .from("pro_quotes")
      .select("*")
      .eq("public_token", token)
      .maybeSingle();
    if (!quote) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });

    // Accusé de lecture : le professionnel voit que son devis a été ouvert,
    // même si le client ne répond pas tout de suite.
    if (action === "view") {
      if (quote.status === "sent") {
        await sb
          .from("pro_quotes")
          .update({ status: "viewed", viewed_at: new Date().toISOString() })
          .eq("id", quote.id)
          .eq("status", "sent");
        createNotification(sb, {
          userId: quote.user_id,
          type: "new_listing",
          title: "👀 Devis consulté",
          body: `Votre client a ouvert « ${quote.title} ».`,
          url: "/dashboard?panel=quotes",
        }).catch(() => {});
        await logEvent(sb, quote.user_id, "quote", quote.id, "viewed", `Devis ${quote.number || ""} consulté par le client`);
      }
      return NextResponse.json({ ok: true });
    }

    const expired =
      quote.valid_until && new Date(quote.valid_until).getTime() < Date.now() - 86400000;

    if (action === "accept") {
      if (quote.status === "accepted") {
        return NextResponse.json({ ok: true, already: true });
      }
      if (quote.status !== "sent" && quote.status !== "viewed") {
        return NextResponse.json({ error: "Ce devis n'est plus disponible." }, { status: 409 });
      }
      if (expired) {
        return NextResponse.json({ error: "Ce devis a expiré." }, { status: 409 });
      }

      // Garde-fou anti double-acceptation concurrente : la transition n'est
      // permise que depuis un état encore ouvert.
      const { data: updated, error } = await sb
        .from("pro_quotes")
        .update({ status: "accepted", accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", quote.id)
        .in("status", ["sent", "viewed"])
        .select("id")
        .maybeSingle();
      if (error) return NextResponse.json({ error: "Acceptation impossible." }, { status: 500 });
      if (!updated) return NextResponse.json({ ok: true, already: true });

      await logEvent(sb, quote.user_id, "quote", quote.id, "accepted", `Devis ${quote.number || ""} accepté par le client`);

      // Le client devient actif, et la chaîne se poursuit toute seule.
      if (quote.client_id) {
        await sb.from("pro_clients")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", quote.client_id);
      }
      const { invoice } = await convertAcceptedQuote(sb, quote);

      createNotification(sb, {
        userId: quote.user_id,
        type: "new_listing",
        title: "✅ Devis accepté",
        body:
          `Votre client a accepté « ${quote.title} » (${formatFcfa(quote.total)}).` +
          (invoice ? ` Facture ${invoice.number} prête.` : ""),
        url: invoice ? "/dashboard?panel=invoices" : "/dashboard?panel=quotes",
      }).catch(() => {});

      return NextResponse.json({ ok: true });
    }

    if (action === "refuse") {
      if (quote.status !== "sent" && quote.status !== "viewed") {
        return NextResponse.json({ error: "Ce devis n'est plus disponible." }, { status: 409 });
      }
      await sb
        .from("pro_quotes")
        .update({ status: "refused", refused_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", quote.id)
        .in("status", ["sent", "viewed"]);

      await logEvent(sb, quote.user_id, "quote", quote.id, "refused", `Devis ${quote.number || ""} refusé par le client`);
      createNotification(sb, {
        userId: quote.user_id,
        type: "new_listing",
        title: "Devis refusé",
        body: `Votre client a refusé « ${quote.title} ».`,
        url: "/dashboard?panel=quotes",
      }).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
