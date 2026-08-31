import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  formatFcfa, formatDate, daysUntil,
  INVOICE_LABELS, effectiveInvoiceStatus, waNumber, type QuoteItem,
} from "@/lib/pro";
import { fetchPublicInvoice } from "@/lib/proPublic";

export const dynamic = "force-dynamic";

// Page privée par nature (lien à jeton) : jamais indexée.
export const metadata: Metadata = {
  title: "Votre facture",
  robots: { index: false, follow: false },
};

const STATUS_CLS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  sent: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  partial: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  late: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
};

export default async function FacturePublicPage({ params }: { params: { token: string } }) {
  const found = await fetchPublicInvoice(params.token);
  if (!found) notFound();

  const { invoice, client, seller, profile, payments, paymentDetails } = found;
  const items: QuoteItem[] = Array.isArray(invoice.items) ? invoice.items : [];
  const status = effectiveInvoiceStatus(invoice);

  const subtotal = invoice.subtotal || invoice.total;
  const discount = invoice.discount || 0;
  const taxRate = Number(invoice.tax_rate) || 0;
  const paid = invoice.paid_amount || 0;
  const remaining = Math.max(0, invoice.total - paid);
  const left = daysUntil(invoice.due_date);

  const waHref = (() => {
    const phone = waNumber(seller.phone);
    if (!phone) return null;
    const msg = `Bonjour, au sujet de la facture ${invoice.number || ""} « ${invoice.title} » :`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  })();

  return (
    <div className="mx-auto max-w-[620px] px-4 py-6">
      {/* Prestataire */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-dark-800">
        {profile?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-extrabold text-gray-900 dark:text-white">
              {seller.company || seller.name}
            </span>
            {profile?.is_verified && (
              <span className="rounded-md bg-green/10 px-1.5 py-0.5 text-[.6rem] font-bold text-green">Vérifié</span>
            )}
          </div>
          <div className="text-[.75rem] text-gray-500 dark:text-gray-400">
            Facture {invoice.number ? `n° ${invoice.number}` : ""}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[.68rem] font-bold ${STATUS_CLS[status] || STATUS_CLS.draft}`}>
          {INVOICE_LABELS[status] || status}
        </span>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-dark-800">
        <h1 className="font-display text-[1.3rem] font-extrabold leading-tight text-gray-900 dark:text-white">
          {invoice.title}
        </h1>
        {client?.name && (
          <p className="mt-1 text-[.82rem] text-gray-500 dark:text-gray-400">
            Facturé à {client.billing_name || client.company || client.name}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[.78rem] text-gray-500 dark:text-gray-400">
          {invoice.issue_date && <span>Émise le {formatDate(invoice.issue_date)}</span>}
          {invoice.due_date && (
            <span className={status === "late" ? "font-bold text-red-600 dark:text-red-400" : ""}>
              Échéance {formatDate(invoice.due_date)}
              {status !== "paid" && left != null && left < 0 ? ` (dépassée de ${Math.abs(left)} j)` : ""}
            </span>
          )}
        </div>

        <div className="mt-4 divide-y divide-gray-100 dark:divide-white/10">
          {items.map((it, i) => (
            <div key={i} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="text-[.9rem] font-semibold text-gray-900 dark:text-white">{it.label}</div>
                {it.qty > 1 && (
                  <div className="text-[.75rem] text-gray-500">
                    {it.qty} × {formatFcfa(it.unit_price)}
                  </div>
                )}
              </div>
              <div className="shrink-0 font-mono text-[.88rem] font-bold tabular-nums text-gray-900 dark:text-white">
                {formatFcfa(it.qty * it.unit_price)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-black/30">
          {(discount > 0 || taxRate > 0) && (
            <div className="mb-2.5 flex flex-col gap-1.5 border-b border-gray-200 pb-2.5 text-[.8rem] dark:border-white/10">
              <SumLine label="Sous-total HT" value={formatFcfa(subtotal)} />
              {discount > 0 && <SumLine label="Remise" value={`− ${formatFcfa(discount)}`} />}
              {taxRate > 0 && <SumLine label={`TVA ${taxRate} %`} value={formatFcfa(invoice.tax_amount || 0)} />}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[.8rem] font-bold text-gray-900 dark:text-white">
              {taxRate > 0 ? "Total TTC" : "Total"}
            </span>
            <span className="font-mono text-[1.15rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
              {formatFcfa(invoice.total)}
            </span>
          </div>

          {paid > 0 && (
            <div className="mt-2.5 flex flex-col gap-1.5 border-t border-gray-200 pt-2.5 text-[.8rem] dark:border-white/10">
              <SumLine label="Déjà réglé" value={`− ${formatFcfa(paid)}`} />
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Reste à payer</span>
                <span
                  className={`font-mono text-[1.05rem] font-extrabold tabular-nums ${
                    remaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-green"
                  }`}
                >
                  {formatFcfa(remaining)}
                </span>
              </div>
            </div>
          )}
        </div>

        {status === "paid" && (
          <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3.5 text-center dark:border-green-500/25 dark:bg-green-900/15">
            <div className="text-[1.3rem]">✅</div>
            <div className="mt-0.5 font-extrabold text-green-800 dark:text-green-300">Facture réglée</div>
            <p className="text-[.8rem] text-green-700 dark:text-green-400">Merci ! Rien ne reste à payer.</p>
          </div>
        )}

        {remaining > 0 && paymentDetails && (
          <div className="mt-3 rounded-xl border border-green/25 bg-green/5 p-3.5">
            <div className="text-[.68rem] font-bold uppercase tracking-wide text-green">Comment régler</div>
            <p className="mt-1 whitespace-pre-line text-[.85rem] font-semibold text-gray-800 dark:text-gray-200">
              {paymentDetails}
            </p>
          </div>
        )}

        {invoice.terms && (
          <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-black/20">
            <div className="text-[.68rem] font-bold uppercase tracking-wide text-gray-400">
              Conditions de paiement
            </div>
            <p className="mt-1 whitespace-pre-line text-[.82rem] text-gray-600 dark:text-gray-300">{invoice.terms}</p>
          </div>
        )}

        {payments.length > 0 && (
          <div className="mt-3">
            <div className="text-[.68rem] font-bold uppercase tracking-wide text-gray-400">
              Paiements enregistrés
            </div>
            <div className="mt-1 flex flex-col divide-y divide-gray-100 dark:divide-white/10">
              {payments.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2 text-[.82rem]">
                  <span className="text-gray-600 dark:text-gray-300">
                    {p.method || "Paiement"} · {formatDate(p.paid_at)}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-green">{formatFcfa(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <a
            href={`/facture/${params.token}/imprimer`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl bg-green px-5 py-3 text-center text-[.9rem] font-extrabold text-white shadow-md transition hover:opacity-90"
          >
            ⬇ Télécharger le document
          </a>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-center text-[.82rem] font-bold text-gray-700 transition hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
            >
              Poser une question
            </a>
          )}
        </div>
      </div>

      {client?.tracking_code && (
        <p className="mt-3 text-center text-[.72rem] text-gray-400">
          Code de suivi <span className="font-mono font-bold">{client.tracking_code}</span> · aucun compte requis
        </p>
      )}
    </div>
  );
}

function SumLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-mono font-semibold tabular-nums text-gray-700 dark:text-gray-200">{value}</span>
    </div>
  );
}
