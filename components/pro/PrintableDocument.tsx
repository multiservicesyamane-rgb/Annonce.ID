import { formatFcfa, formatDate, type QuoteItem } from "@/lib/pro";
import PrintTrigger from "./PrintTrigger";

/**
 * Devis ou facture au format papier, prêt à imprimer ou à enregistrer en PDF.
 *
 * Pas de librairie PDF : le navigateur sait déjà produire un PDF fidèle via
 * « Imprimer → Enregistrer au format PDF », y compris sur Android. C'est aussi
 * la seule voie viable ici, les fonctions serveur Netlify étant trop limitées
 * pour embarquer un moteur de rendu.
 *
 * Les couleurs sont écrites en dur, jamais en classes de thème : ce document
 * doit sortir identique sur papier, que le site soit en clair ou en sombre.
 */

export type PrintDoc = {
  kind: "devis" | "facture";
  number: string | null;
  title: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_amount?: number;
  issue_date?: string | null;
  valid_until?: string | null;
  due_date?: string | null;
  terms?: string | null;
  note?: string | null;
  status: string;
};

export type PrintParty = {
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_id?: string | null;
};

export default function PrintableDocument({
  doc, seller, client,
}: { doc: PrintDoc; seller: PrintParty; client: PrintParty | null }) {
  const isQuote = doc.kind === "devis";
  const label = isQuote ? "DEVIS" : "FACTURE";
  const remaining = Math.max(0, doc.total - (doc.paid_amount || 0));

  return (
    <>
      {/* Feuille de style dédiée : elle neutralise le thème du site et cadre la
          page A4. Chargée uniquement sur ces deux routes. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .doc-sheet { background:#fff; color:#111827; }
            .doc-sheet * { color-scheme: light; }
            @page { size: A4; margin: 14mm; }
            @media print {
              .no-print { display: none !important; }
              body { background:#fff !important; }
              .doc-sheet { box-shadow:none !important; border:0 !important; margin:0 !important; padding:0 !important; max-width:none !important; }
              .doc-table thead { display: table-header-group; }
              .doc-row { break-inside: avoid; }
            }
          `,
        }}
      />

      <div className="mx-auto max-w-[820px] px-4 py-6">
        <PrintTrigger kind={doc.kind} />

        <div className="doc-sheet mx-auto rounded-2xl border border-gray-200 p-8 shadow-sm sm:p-10">
          {/* ---- En-tête ---- */}
          <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-gray-900 pb-5">
            <div className="min-w-0">
              <div className="text-[1.05rem] font-extrabold leading-tight">
                {seller.company || seller.name}
              </div>
              {seller.company && seller.name && (
                <div className="text-[.82rem] text-gray-600">{seller.name}</div>
              )}
              <div className="mt-1.5 text-[.8rem] leading-relaxed text-gray-600">
                {seller.phone && <div>Tél. {seller.phone}</div>}
                {seller.email && <div>{seller.email}</div>}
                {seller.address && <div>{seller.address}</div>}
                {seller.tax_id && <div>NINEA {seller.tax_id}</div>}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[1.6rem] font-extrabold tracking-tight">{label}</div>
              {doc.number && <div className="font-mono text-[.9rem] font-bold text-gray-700">{doc.number}</div>}
              <div className="mt-1.5 text-[.8rem] leading-relaxed text-gray-600">
                {doc.issue_date && <div>Émis le {formatDate(doc.issue_date)}</div>}
                {isQuote && doc.valid_until && <div>Valable jusqu&apos;au {formatDate(doc.valid_until)}</div>}
                {!isQuote && doc.due_date && (
                  <div className="font-bold text-gray-900">Échéance : {formatDate(doc.due_date)}</div>
                )}
              </div>
            </div>
          </div>

          {/* ---- Destinataire ---- */}
          <div className="mt-6 flex flex-wrap justify-between gap-6">
            <div>
              <div className="text-[.68rem] font-bold uppercase tracking-widest text-gray-500">Objet</div>
              <div className="mt-1 text-[.98rem] font-bold">{doc.title}</div>
            </div>
            {client && (
              <div className="min-w-[220px] rounded-xl bg-gray-50 p-4">
                <div className="text-[.68rem] font-bold uppercase tracking-widest text-gray-500">
                  {isQuote ? "Destinataire" : "Facturé à"}
                </div>
                <div className="mt-1 text-[.9rem] font-bold">
                  {client.company || client.name}
                </div>
                {client.company && client.name && (
                  <div className="text-[.8rem] text-gray-600">{client.name}</div>
                )}
                <div className="mt-1 text-[.8rem] leading-relaxed text-gray-600">
                  {client.address && <div>{client.address}</div>}
                  {client.phone && <div>{client.phone}</div>}
                  {client.email && <div>{client.email}</div>}
                  {client.tax_id && <div>NINEA {client.tax_id}</div>}
                </div>
              </div>
            )}
          </div>

          {/* ---- Lignes ---- */}
          <table className="doc-table mt-6 w-full border-collapse text-[.86rem]">
            <thead>
              <tr className="border-b-2 border-gray-300 text-left">
                <th className="pb-2 font-bold">Désignation</th>
                <th className="w-[70px] pb-2 text-center font-bold">Qté</th>
                <th className="w-[120px] pb-2 text-right font-bold">P.U.</th>
                <th className="w-[130px] pb-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {(doc.items || []).map((it, i) => (
                <tr key={i} className="doc-row border-b border-gray-200">
                  <td className="py-2.5 pr-3">{it.label}</td>
                  <td className="py-2.5 text-center tabular-nums">{it.qty}</td>
                  <td className="py-2.5 text-right tabular-nums">{it.unit_price.toLocaleString("fr-FR")}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums">
                    {(it.qty * it.unit_price).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ---- Totaux ---- */}
          <div className="mt-5 flex justify-end">
            <div className="w-full max-w-[320px]">
              <TotalLine label="Sous-total HT" value={formatFcfa(doc.subtotal)} />
              {doc.discount > 0 && <TotalLine label="Remise" value={`− ${formatFcfa(doc.discount)}`} />}
              {doc.tax_rate > 0 && (
                <>
                  <TotalLine label="Base imposable" value={formatFcfa(doc.subtotal - doc.discount)} />
                  <TotalLine label={`TVA ${doc.tax_rate} %`} value={formatFcfa(doc.tax_amount)} />
                </>
              )}
              <div className="mt-1.5 flex items-baseline justify-between border-t-2 border-gray-900 pt-2.5">
                <span className="text-[.9rem] font-extrabold">
                  {doc.tax_rate > 0 ? "TOTAL TTC" : "TOTAL"}
                </span>
                <span className="font-mono text-[1.15rem] font-extrabold tabular-nums">{formatFcfa(doc.total)}</span>
              </div>

              {!isQuote && (doc.paid_amount || 0) > 0 && (
                <>
                  <TotalLine label="Déjà réglé" value={`− ${formatFcfa(doc.paid_amount || 0)}`} />
                  <div className="mt-1 flex items-baseline justify-between border-t border-gray-300 pt-2">
                    <span className="text-[.86rem] font-extrabold">RESTE À PAYER</span>
                    <span className="font-mono text-[1rem] font-extrabold tabular-nums">{formatFcfa(remaining)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ---- Mentions ---- */}
          {(doc.terms || doc.note) && (
            <div className="mt-7 border-t border-gray-200 pt-4 text-[.82rem] leading-relaxed text-gray-700">
              {doc.terms && (
                <div className="mb-3">
                  <div className="text-[.68rem] font-bold uppercase tracking-widest text-gray-500">
                    Conditions de paiement
                  </div>
                  <p className="mt-1 whitespace-pre-line">{doc.terms}</p>
                </div>
              )}
              {doc.note && (
                <div>
                  <div className="text-[.68rem] font-bold uppercase tracking-widest text-gray-500">Note</div>
                  <p className="mt-1 whitespace-pre-line">{doc.note}</p>
                </div>
              )}
            </div>
          )}

          {/* ---- Bon pour accord (devis papier) ---- */}
          {isQuote && (
            <div className="mt-8 flex flex-wrap justify-between gap-6 border-t border-gray-200 pt-5 text-[.8rem]">
              <div>
                <div className="font-bold">Bon pour accord</div>
                <div className="text-gray-500">Date et signature du client</div>
                <div className="mt-10 w-[200px] border-b border-gray-400" />
              </div>
              <div className="text-right text-gray-500">
                <div className="font-bold text-gray-700">{seller.company || seller.name}</div>
                <div className="mt-10 w-[200px] border-b border-gray-400" />
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-[.7rem] text-gray-400">
            Document généré sur wanteermako.com — Espace Freelancer
          </p>
        </div>
      </div>
    </>
  );
}

function TotalLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-[.84rem]">
      <span className="text-gray-600">{label}</span>
      <span className="font-mono font-semibold tabular-nums">{value}</span>
    </div>
  );
}
