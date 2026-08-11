import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicInvoice } from "@/lib/proPublic";
import { effectiveInvoiceStatus } from "@/lib/pro";
import PrintableDocument from "@/components/pro/PrintableDocument";

export const dynamic = "force-dynamic";

// Page privée par nature (lien à jeton) : jamais indexée.
export const metadata: Metadata = {
  title: "Facture — impression",
  robots: { index: false, follow: false },
};

export default async function FacturePrintPage({ params }: { params: { token: string } }) {
  const found = await fetchPublicInvoice(params.token);
  if (!found) notFound();

  const { invoice, seller, party, paymentDetails } = found;

  // Les coordonnées de règlement se lisent sur la facture papier : on les joint
  // aux conditions plutôt que de les reléguer hors du document.
  const terms = [invoice.terms, paymentDetails ? `Règlement : ${paymentDetails}` : null]
    .filter(Boolean)
    .join("\n");

  return (
    <PrintableDocument
      doc={{
        kind: "facture",
        number: invoice.number,
        title: invoice.title,
        items: Array.isArray(invoice.items) ? invoice.items : [],
        subtotal: invoice.subtotal || invoice.total,
        discount: invoice.discount || 0,
        tax_rate: Number(invoice.tax_rate) || 0,
        tax_amount: invoice.tax_amount || 0,
        total: invoice.total,
        paid_amount: invoice.paid_amount || 0,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        terms: terms || null,
        // Statut réel : « en retard » se déduit de l'échéance et de l'encaissé.
        status: effectiveInvoiceStatus(invoice),
      }}
      seller={seller}
      client={party}
    />
  );
}
