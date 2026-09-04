import { NextResponse } from "next/server";
import { effectiveQuoteStatus, effectiveInvoiceStatus, daysUntil } from "@/lib/pro";
import { proContext, isMissingTable } from "@/lib/proServer";

export const dynamic = "force-dynamic";

/** Clé « 2026-08 » — sert d'axe pour la courbe d'évolution. */
const monthKey = (d: string | Date) => new Date(d).toISOString().slice(0, 7);

/** Les 12 derniers mois, du plus ancien au plus récent. */
function last12Months(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
    });
  }
  return out;
}

/**
 * Mon Activité — vision consolidée de la santé de l'activité.
 *
 * Conventions retenues, valables partout dans le module :
 *   • Chiffre d'affaires = montant FACTURÉ (hors brouillons et annulées).
 *   • Encaissé          = somme réelle des paiements enregistrés.
 *   • En attente        = facturé − encaissé.
 * Un devis accepté n'est donc PAS du chiffre d'affaires tant qu'il n'est pas
 * facturé : c'est ce qui distingue une prévision d'une créance.
 */
export async function GET() {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId } = ctx;

    const [clientsRes, projectsRes, quotesRes, invoicesRes, paymentsRes, eventsRes] = await Promise.all([
      sb.from("pro_clients").select("id, name, company, status, created_at").eq("user_id", userId).eq("archived", false),
      sb.from("pro_projects").select("id, name, status, budget, due_date, progress, client_id").eq("user_id", userId),
      sb.from("pro_quotes").select("id, number, title, total, status, valid_until, client_id, created_at").eq("user_id", userId),
      sb.from("pro_invoices").select("id, number, title, total, paid_amount, status, due_date, issue_date, client_id, created_at").eq("user_id", userId),
      sb.from("pro_payments").select("id, amount, method, paid_at, invoice_id").eq("user_id", userId),
      sb.from("pro_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(15),
    ]);

    // Migration non exécutée : on renvoie un tableau de bord vide plutôt qu'une
    // erreur, le reste du site continue de fonctionner.
    if (isMissingTable(clientsRes.error) || isMissingTable(quotesRes.error)) {
      return NextResponse.json({ needsMigration: true });
    }

    const clients = clientsRes.data || [];
    const projects = projectsRes.data || [];
    const quotes = quotesRes.data || [];
    const invoices = invoicesRes.data || [];
    const payments = paymentsRes.data || [];

    const now = new Date();
    const thisMonth = monthKey(now);
    const thisYear = String(now.getFullYear());

    /* ---------- Chiffre d'affaires ---------- */

    const billable = invoices.filter((i: any) => i.status !== "draft" && i.status !== "cancelled");
    const revenueTotal = billable.reduce((s: number, i: any) => s + (Number(i.total) || 0), 0);
    const revenueMonth = billable
      .filter((i: any) => monthKey(i.issue_date || i.created_at) === thisMonth)
      .reduce((s: number, i: any) => s + (Number(i.total) || 0), 0);
    const revenueYear = billable
      .filter((i: any) => String(new Date(i.issue_date || i.created_at).getFullYear()) === thisYear)
      .reduce((s: number, i: any) => s + (Number(i.total) || 0), 0);

    // Le chiffre d'affaires exclut les factures annulées : l'encaissé doit les
    // exclure aussi, sans quoi « en attente » se retrouve négatif et rabote à
    // zéro, en cachant l'incohérence. L'historique des transactions, lui, garde
    // tout : un paiement reçu reste un fait, même si la facture a été annulée.
    const cancelledInvoiceIds = new Set(
      invoices.filter((i: any) => i.status === "cancelled").map((i: any) => i.id),
    );
    const cashedPayments = payments.filter((p: any) => !cancelledInvoiceIds.has(p.invoice_id));

    const cashedTotal = cashedPayments.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    const cashedMonth = cashedPayments
      .filter((p: any) => monthKey(p.paid_at) === thisMonth)
      .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    const pendingRevenue = Math.max(0, revenueTotal - cashedTotal);

    /* ---------- Portefeuille ---------- */

    const clientsActive = clients.filter((c: any) => c.status === "active").length;
    const clientsProspect = clients.filter((c: any) => c.status === "prospect").length;

    const projectsActive = projects.filter((p: any) => p.status === "active").length;
    const projectsDone = projects.filter((p: any) => p.status === "done").length;
    const projectsLate = projects.filter(
      (p: any) => p.status === "active" && p.due_date && (daysUntil(p.due_date) ?? 0) < 0,
    ).length;

    /* ---------- Devis ---------- */

    const quotesWithStatus = quotes.map((q: any) => ({ ...q, status: effectiveQuoteStatus(q) }));
    const quotesPending = quotesWithStatus.filter((q: any) => q.status === "sent" || q.status === "viewed");
    const quotesAccepted = quotesWithStatus.filter((q: any) => q.status === "accepted");
    const quotesRefused = quotesWithStatus.filter((q: any) => q.status === "refused");

    // Taux d'acceptation : sur les devis réellement tranchés (un devis encore en
    // attente ne doit pas peser dans le calcul, sinon le taux baisse à tort).
    const decided = quotesAccepted.length + quotesRefused.length;
    const acceptanceRate = decided ? Math.round((quotesAccepted.length / decided) * 100) : null;

    /* ---------- Factures ---------- */

    const invoicesWithStatus = invoices.map((i: any) => ({ ...i, status: effectiveInvoiceStatus(i) }));
    const unpaid = invoicesWithStatus.filter(
      (i: any) => i.status !== "paid" && i.status !== "cancelled" && i.status !== "draft",
    );
    const overdue = unpaid.filter((i: any) => i.status === "late");
    // « Arrive à échéance » : dans les 7 jours, pas encore en retard.
    const dueSoon = unpaid.filter((i: any) => {
      const d = daysUntil(i.due_date);
      return d != null && d >= 0 && d <= 7;
    });

    const unpaidAmount = unpaid.reduce(
      (s: number, i: any) => s + Math.max(0, (Number(i.total) || 0) - (Number(i.paid_amount) || 0)), 0,
    );
    const overdueAmount = overdue.reduce(
      (s: number, i: any) => s + Math.max(0, (Number(i.total) || 0) - (Number(i.paid_amount) || 0)), 0,
    );

    /* ---------- Évolution sur 12 mois ---------- */

    const months = last12Months();
    const billedByMonth: Record<string, number> = {};
    for (const i of billable) {
      const k = monthKey(i.issue_date || i.created_at);
      billedByMonth[k] = (billedByMonth[k] || 0) + (Number(i.total) || 0);
    }
    const cashedByMonth: Record<string, number> = {};
    for (const p of cashedPayments) {
      const k = monthKey(p.paid_at);
      cashedByMonth[k] = (cashedByMonth[k] || 0) + (Number(p.amount) || 0);
    }
    const evolution = months.map((m) => ({
      key: m.key,
      label: m.label,
      billed: billedByMonth[m.key] || 0,
      cashed: cashedByMonth[m.key] || 0,
    }));

    // Comparaison au mois précédent : une tuile qui ne dit pas « + ou − » ne
    // sert à rien pour piloter.
    const prevKey = months[months.length - 2]?.key;
    const prevMonthRevenue = prevKey ? billedByMonth[prevKey] || 0 : 0;
    const monthTrend = prevMonthRevenue > 0
      ? Math.round(((revenueMonth - prevMonthRevenue) / prevMonthRevenue) * 100)
      : null;

    /* ---------- Indicateurs de performance ---------- */

    const paidInvoices = invoicesWithStatus.filter((i: any) => i.status === "paid");
    const averageInvoice = billable.length ? Math.round(revenueTotal / billable.length) : 0;

    // Délai moyen d'encaissement : de l'émission au dernier paiement reçu.
    const paymentByInvoice: Record<string, string> = {};
    for (const p of payments) {
      const cur = paymentByInvoice[p.invoice_id];
      if (!cur || new Date(p.paid_at) > new Date(cur)) paymentByInvoice[p.invoice_id] = p.paid_at;
    }
    const delays = paidInvoices
      .map((i: any) => {
        const last = paymentByInvoice[i.id];
        if (!last || !i.issue_date) return null;
        const d = Math.round((new Date(last).getTime() - new Date(i.issue_date).getTime()) / 86400000);
        return d >= 0 ? d : null;
      })
      .filter((d): d is number => d != null);
    const averageDelay = delays.length ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : null;

    const collectionRate = revenueTotal > 0 ? Math.round((cashedTotal / revenueTotal) * 100) : null;

    /* ---------- Dernières transactions ---------- */

    const invoiceById = Object.fromEntries(invoices.map((i: any) => [i.id, i]));
    const clientById = Object.fromEntries(clients.map((c: any) => [c.id, c]));
    const transactions = [...payments]
      .sort((a: any, b: any) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())
      .slice(0, 8)
      .map((p: any) => {
        const inv = invoiceById[p.invoice_id];
        const cl = inv?.client_id ? clientById[inv.client_id] : null;
        return {
          id: p.id,
          amount: Number(p.amount) || 0,
          method: p.method,
          paid_at: p.paid_at,
          invoice_number: inv?.number || null,
          invoice_title: inv?.title || null,
          client: cl ? cl.company || cl.name : null,
        };
      });

    /* ---------- À traiter en priorité ---------- */

    const attention = [
      ...overdue.slice(0, 5).map((i: any) => ({
        kind: "invoice_late" as const,
        id: i.id,
        label: `${i.number || "Facture"} — ${i.title}`,
        client: i.client_id ? clientById[i.client_id]?.company || clientById[i.client_id]?.name || null : null,
        amount: Math.max(0, (Number(i.total) || 0) - (Number(i.paid_amount) || 0)),
        days: daysUntil(i.due_date),
      })),
      ...quotesPending
        .filter((q: any) => q.valid_until && (daysUntil(q.valid_until) ?? 99) <= 7)
        .slice(0, 5)
        .map((q: any) => ({
          kind: "quote_expiring" as const,
          id: q.id,
          label: `${q.number || "Devis"} — ${q.title}`,
          client: q.client_id ? clientById[q.client_id]?.company || clientById[q.client_id]?.name || null : null,
          amount: Number(q.total) || 0,
          days: daysUntil(q.valid_until),
        })),
    ];

    return NextResponse.json({
      revenue: {
        total: revenueTotal,
        month: revenueMonth,
        year: revenueYear,
        cashed: cashedTotal,
        cashedMonth,
        pending: pendingRevenue,
        monthTrend,
      },
      clients: { total: clients.length, active: clientsActive, prospect: clientsProspect },
      projects: { total: projects.length, active: projectsActive, done: projectsDone, late: projectsLate },
      quotes: {
        total: quotes.length,
        pending: quotesPending.length,
        pendingAmount: quotesPending.reduce((s: number, q: any) => s + (Number(q.total) || 0), 0),
        accepted: quotesAccepted.length,
        acceptedAmount: quotesAccepted.reduce((s: number, q: any) => s + (Number(q.total) || 0), 0),
        refused: quotesRefused.length,
      },
      invoices: {
        total: invoices.length,
        unpaid: unpaid.length,
        unpaidAmount,
        overdue: overdue.length,
        overdueAmount,
        dueSoon: dueSoon.length,
        dueSoonAmount: dueSoon.reduce(
          (s: number, i: any) => s + Math.max(0, (Number(i.total) || 0) - (Number(i.paid_amount) || 0)), 0,
        ),
      },
      performance: { acceptanceRate, averageInvoice, averageDelay, collectionRate },
      evolution,
      transactions,
      attention,
      events: eventsRes.data || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
