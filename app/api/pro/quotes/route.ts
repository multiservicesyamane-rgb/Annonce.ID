import { NextResponse } from "next/server";
import { sanitizeItems, computeTotals, publicToken } from "@/lib/pro";
import {
  proContext, txt, num, dateOrNull, isMissingTable,
  logEvent, attachClients, ownsRow, publicBase, nextDocumentNumber,
} from "@/lib/proServer";

export const dynamic = "force-dynamic";

// Devis : propositions commerciales, de la rédaction à l'acceptation.
export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId } = ctx;

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "list") {
      const { data, error } = await sb
        .from("pro_quotes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) {
        if (isMissingTable(error)) return NextResponse.json({ quotes: [], needsMigration: true });
        throw error;
      }
      return NextResponse.json({ quotes: await attachClients(sb, data || []) });
    }

    if (action === "get") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Devis requis." }, { status: 400 });

      const { data: quote } = await sb
        .from("pro_quotes").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!quote) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });

      // L'historique des versions est reconstitué depuis le journal : chaque
      // modification après envoi y dépose un instantané des lignes.
      const { data: events } = await sb
        .from("pro_events").select("*").eq("user_id", userId).eq("entity", "quote").eq("entity_id", id)
        .order("created_at", { ascending: false }).limit(40);

      const { data: invoice } = await sb
        .from("pro_invoices").select("id, number, status, total").eq("user_id", userId).eq("quote_id", id).maybeSingle();

      const [withClient] = await attachClients(sb, [quote]);
      return NextResponse.json({ quote: withClient, events: events || [], invoice: invoice || null });
    }

    if (action === "create") {
      const title = txt(body?.title);
      if (!title) return NextResponse.json({ error: "Indiquez l'objet du devis." }, { status: 400 });

      const items = sanitizeItems(body?.items);
      if (!items.length) return NextResponse.json({ error: "Ajoutez au moins une ligne." }, { status: 400 });

      const clientId = txt(body?.client_id, 60) || null;
      if (clientId && !(await ownsRow(sb, "pro_clients", clientId, userId))) {
        return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
      }
      const projectId = txt(body?.project_id, 60) || null;
      if (projectId && !(await ownsRow(sb, "pro_projects", projectId, userId))) {
        return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
      }

      const t = computeTotals(items, num(body?.discount), Number(body?.tax_rate) || 0);

      const payload = {
        user_id: userId,
        client_id: clientId,
        project_id: projectId,
        number: await nextDocumentNumber(sb, userId, "DEV"),
        title,
        items,
        subtotal: t.subtotal,
        discount: t.discount,
        tax_rate: t.taxRate,
        tax_amount: t.taxAmount,
        total: t.total,
        status: "draft",
        valid_until: dateOrNull(body?.valid_until),
        note: txt(body?.note, 2000) || null,
        terms: txt(body?.terms, 1000) || null,
        public_token: publicToken(),
        version: 1,
      };

      const { data, error } = await sb.from("pro_quotes").insert(payload).select("*").single();
      if (error) return NextResponse.json({ error: error.message || "Création impossible." }, { status: 500 });

      await logEvent(sb, userId, "quote", data.id, "created", `Devis ${data.number} créé — ${title}`);
      return NextResponse.json({ ok: true, quote: data });
    }

    if (action === "update") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Devis requis." }, { status: 400 });

      const { data: before } = await sb
        .from("pro_quotes").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!before) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
      // Un devis accepté est un engagement : il ne se modifie plus.
      if (before.status === "accepted") {
        return NextResponse.json({ error: "Ce devis est accepté : il n'est plus modifiable." }, { status: 409 });
      }

      const patch: Record<string, unknown> = {};
      if ("title" in body) {
        const t = txt(body.title);
        if (!t) return NextResponse.json({ error: "L'objet du devis est obligatoire." }, { status: 400 });
        patch.title = t;
      }
      if ("note" in body) patch.note = txt(body.note, 2000) || null;
      if ("terms" in body) patch.terms = txt(body.terms, 1000) || null;
      if ("valid_until" in body) patch.valid_until = dateOrNull(body.valid_until);
      if ("client_id" in body) {
        const cid = txt(body.client_id, 60) || null;
        if (cid && !(await ownsRow(sb, "pro_clients", cid, userId))) {
          return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
        }
        patch.client_id = cid;
      }
      if ("project_id" in body) {
        const pid = txt(body.project_id, 60) || null;
        if (pid && !(await ownsRow(sb, "pro_projects", pid, userId))) {
          return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
        }
        patch.project_id = pid;
      }

      // Les montants se recalculent en bloc : lignes, remise et taux forment un
      // tout, on repart toujours des valeurs courantes pour les champs absents.
      const touchesMoney = "items" in body || "discount" in body || "tax_rate" in body;
      if (touchesMoney) {
        const items = "items" in body ? sanitizeItems(body.items) : sanitizeItems(before.items);
        if (!items.length) return NextResponse.json({ error: "Ajoutez au moins une ligne." }, { status: 400 });
        const discount = "discount" in body ? num(body.discount) : Number(before.discount) || 0;
        const rate = "tax_rate" in body ? Number(body.tax_rate) || 0 : Number(before.tax_rate) || 0;
        const t = computeTotals(items, discount, rate);
        patch.items = items;
        patch.subtotal = t.subtotal;
        patch.discount = t.discount;
        patch.tax_rate = t.taxRate;
        patch.tax_amount = t.taxAmount;
        patch.total = t.total;
      }

      if (!Object.keys(patch).length) return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });

      // Modifier un devis déjà parti chez le client crée une nouvelle version :
      // on garde l'instantané précédent et on repasse le devis « envoyé ».
      const wasOut = before.status === "sent" || before.status === "viewed";
      if (wasOut) {
        patch.version = (Number(before.version) || 1) + 1;
        patch.status = "sent";
        patch.viewed_at = null;
      }
      patch.updated_at = new Date().toISOString();

      const { data, error } = await sb
        .from("pro_quotes").update(patch).eq("id", id).eq("user_id", userId).select("*").single();
      if (error || !data) return NextResponse.json({ error: "Modification impossible." }, { status: 500 });

      await logEvent(
        sb, userId, "quote", id, wasOut ? "revised" : "updated",
        wasOut ? `Version ${data.version} — devis révisé après envoi` : "Devis modifié",
        { snapshot: { items: before.items, total: before.total, version: before.version } },
      );
      return NextResponse.json({ ok: true, quote: data });
    }

    // Marque le devis comme envoyé et renvoie le lien public à partager.
    if (action === "send") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Devis requis." }, { status: 400 });

      const { data, error } = await sb
        .from("pro_quotes")
        .update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        .in("status", ["draft", "sent", "viewed", "expired"])
        .select("*")
        .single();
      if (error || !data) return NextResponse.json({ error: "Devis introuvable ou déjà traité." }, { status: 404 });

      let client: any = null;
      if (data.client_id) {
        const { data: c } = await sb
          .from("pro_clients").select("name, company, phone, email").eq("id", data.client_id).maybeSingle();
        client = c || null;
        // Un prospect à qui l'on envoie un devis devient un client actif.
        await sb.from("pro_clients").update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", data.client_id).eq("user_id", userId).eq("status", "prospect");
      }

      await logEvent(sb, userId, "quote", id, "sent", `Devis ${data.number} envoyé au client`);
      return NextResponse.json({
        ok: true,
        quote: { ...data, pro_clients: client },
        url: `${publicBase()}/devis/${data.public_token}`,
      });
    }

    // Réponse enregistrée à la main (le client a répondu par téléphone, en
    // personne, ou n'utilisera jamais le lien).
    if (action === "set_status") {
      const id = txt(body?.id, 60);
      const status = txt(body?.status, 20);
      if (!id) return NextResponse.json({ error: "Devis requis." }, { status: 400 });
      if (!["accepted", "refused", "draft"].includes(status)) {
        return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
      }

      const stamp: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === "accepted") stamp.accepted_at = new Date().toISOString();
      if (status === "refused") stamp.refused_at = new Date().toISOString();

      const { data, error } = await sb
        .from("pro_quotes").update(stamp).eq("id", id).eq("user_id", userId).select("*").single();
      if (error || !data) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });

      await logEvent(sb, userId, "quote", id, status, `Devis ${data.number} marqué « ${status} » manuellement`);
      return NextResponse.json({ ok: true, quote: data });
    }

    if (action === "delete") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Devis requis." }, { status: 400 });
      const { data: q } = await sb
        .from("pro_quotes").select("status, number").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!q) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
      if (q.status === "accepted") {
        return NextResponse.json({ error: "Un devis accepté ne peut pas être supprimé." }, { status: 409 });
      }
      const { error } = await sb.from("pro_quotes").delete().eq("id", id).eq("user_id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logEvent(sb, userId, "quote", null, "deleted", `Devis ${q.number || ""} supprimé`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
