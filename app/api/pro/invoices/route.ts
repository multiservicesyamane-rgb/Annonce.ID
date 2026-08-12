import { NextResponse } from "next/server";
import { sanitizeItems, computeTotals, publicToken, formatFcfa, waNumber } from "@/lib/pro";
import {
  proContext, txt, num, dateOrNull, isMissingTable,
  logEvent, attachClients, ownsRow, publicBase, nextDocumentNumber, taxAllowed,
} from "@/lib/proServer";

export const dynamic = "force-dynamic";

/** Échéance par défaut : 30 jours, l'usage courant en prestation de services. */
function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

// Factures : émission, envoi, encaissement, relance.
export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId } = ctx;

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "list") {
      const { data, error } = await sb
        .from("pro_invoices")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) {
        if (isMissingTable(error)) return NextResponse.json({ invoices: [], needsMigration: true });
        throw error;
      }
      return NextResponse.json({ invoices: await attachClients(sb, data || []) });
    }

    if (action === "get") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Facture requise." }, { status: 400 });

      const { data: invoice } = await sb
        .from("pro_invoices").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!invoice) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });

      const [payments, events] = await Promise.all([
        sb.from("pro_payments").select("*").eq("user_id", userId).eq("invoice_id", id)
          .order("paid_at", { ascending: false }),
        sb.from("pro_events").select("*").eq("user_id", userId).eq("entity", "invoice").eq("entity_id", id)
          .order("created_at", { ascending: false }).limit(40),
      ]);

      const [withClient] = await attachClients(sb, [invoice]);
      return NextResponse.json({
        invoice: withClient,
        payments: payments.data || [],
        events: events.data || [],
      });
    }

    if (action === "create") {
      // Trois origines : depuis un devis accepté, depuis un projet, ou saisie libre.
      const fromQuoteId = txt(body?.quote_id, 60);
      let title = txt(body?.title);
      let items = sanitizeItems(body?.items);
      let clientId = txt(body?.client_id, 60) || null;
      let projectId = txt(body?.project_id, 60) || null;
      let discount = num(body?.discount);
      let taxRate = Number(body?.tax_rate) || 0;
      let terms = txt(body?.terms, 1000) || null;

      if (fromQuoteId) {
        const { data: q } = await sb
          .from("pro_quotes")
          .select("id, title, items, client_id, project_id, discount, tax_rate, terms, number, status")
          .eq("id", fromQuoteId)
          .eq("user_id", userId)
          .maybeSingle();
        if (!q) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });

        const { data: exists } = await sb
          .from("pro_invoices").select("id, number").eq("quote_id", fromQuoteId).eq("user_id", userId).maybeSingle();
        if (exists) {
          return NextResponse.json({ error: `Ce devis a déjà sa facture (${exists.number}).` }, { status: 409 });
        }

        // La facture reprend le devis à l'identique : mêmes lignes, même remise,
        // même TVA. C'est la contrepartie de l'engagement du client.
        title = title || q.title;
        items = sanitizeItems(q.items);
        clientId = q.client_id || null;
        projectId = q.project_id || null;
        discount = Number(q.discount) || 0;
        taxRate = Number(q.tax_rate) || 0;
        terms = q.terms || terms;
      }

      if (!title) return NextResponse.json({ error: "Indiquez l'objet de la facture." }, { status: 400 });
      if (!items.length) return NextResponse.json({ error: "Ajoutez au moins une ligne." }, { status: 400 });

      if (clientId && !(await ownsRow(sb, "pro_clients", clientId, userId))) {
        return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
      }
      if (projectId && !(await ownsRow(sb, "pro_projects", projectId, userId))) {
        return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
      }

      // Sans NINEA, pas de TVA : la règle vaut aussi pour un appel direct, et
      // pour un taux hérité d'un devis converti en facture.
      if (taxRate > 0 && !(await taxAllowed(sb, userId))) taxRate = 0;
      const t = computeTotals(items, discount, taxRate);

      const payload = {
        user_id: userId,
        client_id: clientId,
        project_id: projectId,
        quote_id: fromQuoteId || null,
        number: await nextDocumentNumber(sb, userId, "FAC"),
        title,
        items,
        subtotal: t.subtotal,
        discount: t.discount,
        tax_rate: t.taxRate,
        tax_amount: t.taxAmount,
        total: t.total,
        paid_amount: 0,
        status: "draft",
        issue_date: dateOrNull(body?.issue_date) || new Date().toISOString().slice(0, 10),
        due_date: dateOrNull(body?.due_date) || defaultDueDate(),
        terms,
        public_token: publicToken(),
      };

      const { data, error } = await sb.from("pro_invoices").insert(payload).select("*").single();
      if (error) {
        if (isMissingTable(error)) {
          return NextResponse.json({ error: "Table des factures absente.", needsMigration: true }, { status: 400 });
        }
        // L'index unique sur quote_id bloque la double conversion concurrente.
        if (/duplicate|unique/i.test(error.message || "")) {
          return NextResponse.json({ error: "Ce devis a déjà sa facture." }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || "Création impossible." }, { status: 500 });
      }

      await logEvent(
        sb, userId, "invoice", data.id, "created",
        fromQuoteId ? `Facture ${data.number} créée depuis un devis accepté` : `Facture ${data.number} créée`,
      );
      return NextResponse.json({ ok: true, invoice: data });
    }

    if (action === "update") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Facture requise." }, { status: 400 });

      const { data: before } = await sb
        .from("pro_invoices").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!before) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
      // Une facture déjà encaissée ne se réécrit pas : ce serait falsifier une
      // pièce comptable. On l'annule et on en émet une nouvelle.
      if (Number(before.paid_amount) > 0) {
        return NextResponse.json(
          { error: "Cette facture a déjà reçu un paiement : elle n'est plus modifiable." },
          { status: 409 },
        );
      }

      const patch: Record<string, unknown> = {};
      if ("title" in body) {
        const t = txt(body.title);
        if (!t) return NextResponse.json({ error: "L'objet de la facture est obligatoire." }, { status: 400 });
        patch.title = t;
      }
      if ("terms" in body) patch.terms = txt(body.terms, 1000) || null;
      if ("issue_date" in body) patch.issue_date = dateOrNull(body.issue_date) || before.issue_date;
      if ("due_date" in body) patch.due_date = dateOrNull(body.due_date);
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

      if ("items" in body || "discount" in body || "tax_rate" in body) {
        const items = "items" in body ? sanitizeItems(body.items) : sanitizeItems(before.items);
        if (!items.length) return NextResponse.json({ error: "Ajoutez au moins une ligne." }, { status: 400 });
        const disc = "discount" in body ? num(body.discount) : Number(before.discount) || 0;
        let rate = "tax_rate" in body ? Number(body.tax_rate) || 0 : Number(before.tax_rate) || 0;
        if (rate > 0 && !(await taxAllowed(sb, userId))) rate = 0;
        const t = computeTotals(items, disc, rate);
        patch.items = items;
        patch.subtotal = t.subtotal;
        patch.discount = t.discount;
        patch.tax_rate = t.taxRate;
        patch.tax_amount = t.taxAmount;
        patch.total = t.total;
      }

      if (!Object.keys(patch).length) return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });
      patch.updated_at = new Date().toISOString();

      const { data, error } = await sb
        .from("pro_invoices").update(patch).eq("id", id).eq("user_id", userId).select("*").single();
      if (error || !data) return NextResponse.json({ error: "Modification impossible." }, { status: 500 });

      await logEvent(sb, userId, "invoice", id, "updated", "Facture modifiée", { fields: Object.keys(patch) });
      return NextResponse.json({ ok: true, invoice: data });
    }

    if (action === "send") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Facture requise." }, { status: 400 });

      const { data, error } = await sb
        .from("pro_invoices")
        .update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        .in("status", ["draft", "sent", "late", "partial"])
        .select("*")
        .single();
      if (error || !data) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });

      let client: any = null;
      if (data.client_id) {
        const { data: c } = await sb
          .from("pro_clients").select("name, company, phone, email").eq("id", data.client_id).maybeSingle();
        client = c || null;
      }

      await logEvent(sb, userId, "invoice", id, "sent", `Facture ${data.number} envoyée au client`);
      return NextResponse.json({
        ok: true,
        invoice: { ...data, pro_clients: client },
        url: `${publicBase()}/facture/${data.public_token}`,
      });
    }

    // Relance d'impayé : prépare le message WhatsApp et horodate la relance.
    if (action === "remind") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Facture requise." }, { status: 400 });

      const { data, error } = await sb
        .from("pro_invoices")
        .update({ reminded_at: new Date().toISOString() })
        .eq("id", id).eq("user_id", userId).select("*").single();
      if (error || !data) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });

      let client: any = null;
      if (data.client_id) {
        const { data: c } = await sb
          .from("pro_clients").select("name, company, phone").eq("id", data.client_id).maybeSingle();
        client = c || null;
      }

      const due = Number(data.total) - Number(data.paid_amount || 0);
      const url = `${publicBase()}/facture/${data.public_token}`;
      const message =
        `Bonjour${client?.name ? ` ${client.name}` : ""}, petit rappel concernant la facture ` +
        `${data.number} « ${data.title} » : il reste ${formatFcfa(due)} à régler.\n${url}`;

      await logEvent(sb, userId, "invoice", id, "reminded", `Relance envoyée pour ${data.number}`);
      return NextResponse.json({ ok: true, invoice: data, url, message, phone: waNumber(client?.phone) });
    }

    if (action === "cancel") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Facture requise." }, { status: 400 });
      const { data, error } = await sb
        .from("pro_invoices")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id).eq("user_id", userId).select("*").single();
      if (error || !data) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
      await logEvent(sb, userId, "invoice", id, "cancelled", `Facture ${data.number} annulée`);
      return NextResponse.json({ ok: true, invoice: data });
    }

    if (action === "delete") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Facture requise." }, { status: 400 });
      const { data: inv } = await sb
        .from("pro_invoices").select("number, paid_amount").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!inv) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
      if (Number(inv.paid_amount) > 0) {
        return NextResponse.json({ error: "Facture encaissée : annulez-la plutôt que de la supprimer." }, { status: 409 });
      }
      await sb.from("pro_payments").delete().eq("invoice_id", id).eq("user_id", userId);
      const { error } = await sb.from("pro_invoices").delete().eq("id", id).eq("user_id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logEvent(sb, userId, "invoice", null, "deleted", `Facture ${inv.number || ""} supprimée`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
