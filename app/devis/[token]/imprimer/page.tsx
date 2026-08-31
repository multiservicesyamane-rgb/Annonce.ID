import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicQuote } from "@/lib/proPublic";
import { effectiveQuoteStatus } from "@/lib/pro";
import { publicBase } from "@/lib/proServer";
import { qrSvg } from "@/lib/qr";
import DocumentPage from "@/components/pro/DocumentPage";

export const dynamic = "force-dynamic";

// Page privée par nature (lien à jeton) : jamais indexée.
export const metadata: Metadata = {
  title: "Devis — impression",
  robots: { index: false, follow: false },
};

export default async function DevisPrintPage({ params }: { params: { token: string } }) {
  const found = await fetchPublicQuote(params.token);
  if (!found) notFound();

  const { quote, seller, party } = found;

  const publicUrl = `${publicBase()}/devis/${params.token}`;

  return (
    <DocumentPage
      qr={{ svg: qrSvg(publicUrl), caption: "Scannez pour consulter et accepter ce devis en ligne." }}
      doc={{
        kind: "devis",
        number: quote.number,
        title: quote.title,
        items: Array.isArray(quote.items) ? quote.items : [],
        // Les devis créés avant la refonte n'ont pas de sous-total stocké :
        // on retombe alors sur le total, qui valait le HT à l'époque.
        subtotal: quote.subtotal || quote.total,
        discount: quote.discount || 0,
        tax_rate: Number(quote.tax_rate) || 0,
        tax_amount: quote.tax_amount || 0,
        total: quote.total,
        issue_date: quote.created_at,
        valid_until: quote.valid_until,
        terms: quote.terms,
        note: quote.note,
        sections: quote.sections,
        // Statut réel : « expiré » se déduit de la date, pas de la colonne.
        status: effectiveQuoteStatus(quote),
      }}
      seller={seller}
      client={party}
    />
  );
}
