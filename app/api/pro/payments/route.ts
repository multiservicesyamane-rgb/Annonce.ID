import { NextResponse } from "next/server";
import { formatFcfa } from "@/lib/pro";
import { proContext, txt, num, isMissingTable, logEvent } from "@/lib/proServer";

export const dynamic = "force-dynamic";

/**
 * Recalcule le total encaissé d'une facture à partir de ses paiements, puis en
 * déduit le statut. On resomme la table plutôt que d'incrémenter un compteur :
 * une suppression de paiement ou un double envoi ne peut pas dériver.
 */
async function refreshInvoice(sb: any, userId: string, invoiceId: string) {
  const { data: rows } = await sb
    .from("pro_payments").select("amount").eq("user_id", userId).eq("invoice_id", invoiceId);
  const paid = (rows || []).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);

  const { data: inv } = await sb
    .from("pro_invoices").select("total, due_date, status").eq("id", invoiceId).eq("user_id", userId).maybeSingle();
  if (!inv) return null;

  const total = Number(inv.total) || 0;
  const late = inv.due_date && new Date(inv.due_date).getTime() < Date.now() - 86400000;

  let status = inv.status;
  if (inv.status !== "cancelled") {
    if (total > 0 && paid >= total) status = "paid";
    else if (paid > 0) status = late ? "late" : "partial";
    else if (inv.status === "paid" || inv.status === "partial") status = late ? "late" : "sent";
    else if (late && inv.status !== "draft") status = "late";
  }

  const patch: Record<string, unknown> = { paid_amount: paid, status, updated_at: new Date().toISOString() };
  patch.paid_at = total > 0 && paid >= total ? new Date().toISOString() : null;

  const { data } = await sb
    .from("pro_invoices").update(patch).eq("id", invoiceId).eq("user_id", userId).select("*").single();
  return data;
}

// Encaissements : enregistrement manuel des paiements reçus (Wave, Orange
// Money, espèces…). Gère les règlements partiels et l'historique.
export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId } = ctx;

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "list") {
      let q = sb.from("pro_payments").select("*").eq("user_id", userId);
      const invoiceId = txt(body?.invoice_id, 60);
      if (invoiceId) q = q.eq("invoice_id", invoiceId);

      const { data, error } = await q.order("paid_at", { ascending: false }).limit(500);
      if (error) {
        if (isMissingTable(error)) return NextResponse.json({ payments: [], needsMigration: true });
        throw error;
      }
      return NextResponse.json({ payments: data || [] });
    }

    if (action === "create") {
      const invoiceId = txt(body?.invoice_id, 60);
      if (!invoiceId) return NextResponse.json({ error: "Facture requise." }, { status: 400 });

      const { data: inv } = await sb
        .from("pro_invoices")
        .select("id, number, total, paid_amount, status")
        .eq("id", invoiceId).eq("user_id", userId).maybeSingle();
      if (!inv) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
      if (inv.status === "cancelled") {
        return NextResponse.json({ error: "Cette facture est annulée." }, { status: 409 });
      }

      const remaining = Math.max(0, (Number(inv.total) || 0) - (Number(inv.paid_amount) || 0));
      if (remaining <= 0) return NextResponse.json({ error: "Cette facture est déjà soldée." }, { status: 409 });

      // Sans montant précisé, on solde le restant dû — le cas le plus courant.
      const asked = "amount" in body ? num(body.amount) : remaining;
      if (asked <= 0) return NextResponse.json({ error: "Le montant doit être supérieur à zéro." }, { status: 400 });
      // On ne peut pas encaisser plus que dû : le trop-perçu se règle hors facture.
      const amount = Math.min(asked, remaining);

      const { error } = await sb.from("pro_payments").insert({
        user_id: userId,
        invoice_id: invoiceId,
        amount,
        method: txt(body?.method, 40) || null,
        note: txt(body?.note, 500) || null,
        paid_at: new Date().toISOString(),
      });
      if (error) {
        if (isMissingTable(error)) {
          return NextResponse.json({ error: "Table des paiements absente.", needsMigration: true }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Enregistrement impossible." }, { status: 500 });
      }

      const invoice = await refreshInvoice(sb, userId, invoiceId);
      const method = txt(body?.method, 40);
      await logEvent(
        sb, userId, "payment", invoiceId, "payment",
        `Paiement de ${formatFcfa(amount)} sur ${inv.number}${method ? ` (${method})` : ""}`,
        { amount, method },
      );

      return NextResponse.json({
        ok: true,
        invoice,
        amount,
        partial: amount < remaining,
        capped: asked > remaining,
      });
    }

    if (action === "delete") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Paiement requis." }, { status: 400 });

      const { data: p } = await sb
        .from("pro_payments").select("invoice_id, amount").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!p) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });

      const { error } = await sb.from("pro_payments").delete().eq("id", id).eq("user_id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const invoice = await refreshInvoice(sb, userId, p.invoice_id);
      await logEvent(
        sb, userId, "payment", p.invoice_id, "payment_removed",
        `Paiement de ${formatFcfa(p.amount)} annulé`,
      );
      return NextResponse.json({ ok: true, invoice });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
