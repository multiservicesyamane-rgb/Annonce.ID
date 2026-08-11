import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  formatFcfa, formatDate, QUOTE_LABELS, effectiveQuoteStatus, visibleSections, type QuoteItem,
} from "@/lib/pro";
import { fetchPublicQuote } from "@/lib/proPublic";
import QuoteActions from "@/components/QuoteActions";

export const dynamic = "force-dynamic";

// Page privée par nature (lien à jeton) : jamais indexée.
export const metadata: Metadata = {
  title: "Votre devis",
  robots: { index: false, follow: false },
};

const STATUS_CLS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  sent: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  viewed: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  refused: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  expired: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
};

const STATUS_TEXT: Record<string, string> = {
  ...QUOTE_LABELS,
  sent: "En attente de votre réponse",
  viewed: "En attente de votre réponse",
};

export default async function DevisPublicPage({ params }: { params: { token: string } }) {
  const found = await fetchPublicQuote(params.token);
  if (!found) notFound();

  const { quote, client, seller, profile } = found;
  const sections = visibleSections(quote.sections);
  const items: QuoteItem[] = Array.isArray(quote.items) ? quote.items : [];
  const status = effectiveQuoteStatus(quote);

  // Les devis antérieurs à la refonte n'ont pas de sous-total stocké.
  const subtotal = quote.subtotal || quote.total;
  const discount = quote.discount || 0;
  const taxRate = Number(quote.tax_rate) || 0;

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
            Devis {quote.number ? `n° ${quote.number}` : ""}
            {quote.version > 1 ? ` · version ${quote.version}` : ""}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[.68rem] font-bold ${STATUS_CLS[status] || STATUS_CLS.draft}`}>
          {STATUS_TEXT[status] || status}
        </span>
      </div>

      {/* Devis */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-dark-800">
        <h1 className="font-display text-[1.3rem] font-extrabold leading-tight text-gray-900 dark:text-white">
          {quote.title}
        </h1>
        {client?.name && (
          <p className="mt-1 text-[.82rem] text-gray-500 dark:text-gray-400">
            Pour {client.billing_name || client.company || client.name}
          </p>
        )}

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

        {/* Récapitulatif : détaillé seulement s'il y a une remise ou de la TVA */}
        <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-black/30">
          {(discount > 0 || taxRate > 0) && (
            <div className="mb-2.5 flex flex-col gap-1.5 border-b border-gray-200 pb-2.5 text-[.8rem] dark:border-white/10">
              <SumLine label="Sous-total HT" value={formatFcfa(subtotal)} />
              {discount > 0 && <SumLine label="Remise" value={`− ${formatFcfa(discount)}`} />}
              {taxRate > 0 && <SumLine label={`TVA ${taxRate} %`} value={formatFcfa(quote.tax_amount || 0)} />}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[.8rem] font-bold text-gray-900 dark:text-white">
                {taxRate > 0 ? "Total TTC" : "Total"}
              </div>
              {quote.valid_until && (
                <div className="text-[.72rem] text-gray-500">
                  Valable jusqu&apos;au {formatDate(quote.valid_until)}
                </div>
              )}
            </div>
            <div className="font-mono text-[1.15rem] font-extrabold tabular-nums text-green">
              {formatFcfa(quote.total)}
            </div>
          </div>
        </div>

        {quote.terms && (
          <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-black/20">
            <div className="text-[.68rem] font-bold uppercase tracking-wide text-gray-400">
              Conditions de paiement
            </div>
            <p className="mt-1 whitespace-pre-line text-[.82rem] text-gray-600 dark:text-gray-300">{quote.terms}</p>
          </div>
        )}

        {quote.note && (
          <p className="mt-3 whitespace-pre-line rounded-xl border border-gray-100 bg-gray-50 p-3 text-[.82rem] text-gray-600 dark:border-white/10 dark:bg-black/20 dark:text-gray-300">
            {quote.note}
          </p>
        )}

        {/* Rubriques du devis : déroulé de la mission, conditions, modalités
            de paiement. C'est ce qui rassure le client juste avant d'accepter,
            donc elles se lisent AVANT les boutons de décision. */}
        {sections.map((s) => (
          <div
            key={s.key}
            className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 dark:border-white/10 dark:bg-black/20"
          >
            <div className="flex items-center gap-1.5 text-[.68rem] font-bold uppercase tracking-wide text-gray-400">
              {s.icon && <span aria-hidden="true">{s.icon}</span>}
              <span>{s.title}</span>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {s.items.map((it, i) => (
                <div key={i} className="text-[.82rem] leading-relaxed">
                  {it.label && (
                    <span className="font-bold text-gray-800 dark:text-gray-100">{it.label}</span>
                  )}
                  {it.label && it.body && <span className="text-gray-400"> — </span>}
                  {it.body && (
                    <span className="whitespace-pre-line text-gray-600 dark:text-gray-300">{it.body}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <QuoteActions
          token={params.token}
          status={status}
          sellerPhone={seller.phone || ""}
          title={quote.title}
        />
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
