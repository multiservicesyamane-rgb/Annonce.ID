import type { Metadata } from "next";
import Link from "next/link";
import PaymentFlow from "@/components/PaymentFlow";
import { BOOSTS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Paiement" };

export default function PaiementPage({ searchParams }: { searchParams: { boost?: string, annonce_id?: string, listing_id?: string } }) {
  if (!searchParams.boost) {
    return (
      <div className="mx-auto my-12 max-w-[800px] px-4">
        <h1 className="mb-8 text-center font-display text-[1.6rem] font-extrabold text-gray-800">
          Choisissez un plan de Boost
        </h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {BOOSTS.filter(b => b.price > 0).map((b) => (
            <Link
              key={b.key}
              href={`/paiement?boost=${b.key}${searchParams.annonce_id ? `&annonce_id=${searchParams.annonce_id}` : ''}`}
              className="relative flex flex-col justify-between rounded-[12px] border-2 border-gray-100 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
            >
              {b.popular && (
                <span className="absolute -top-3 right-4 rounded-full bg-grad-gold px-3 py-0.5 text-[.65rem] font-bold text-dark-900 shadow-sm">
                  POPULAIRE
                </span>
              )}
              <div>
                <h3 className="text-[1.1rem] font-bold text-gray-800">{b.name}</h3>
                <div className="mt-1 font-display text-[1.4rem] font-extrabold text-green">
                  {formatNumber(b.price)} FCFA
                </div>
                <p className="mb-4 mt-1 text-[.8rem] text-gray-500">Durée : {b.duration}</p>
                <div className="space-y-1 text-[.85rem] text-gray-600">
                  {b.features.map(f => <div key={f}>✓ {f}</div>)}
                </div>
              </div>
              <div className="mt-6 w-full rounded-md bg-gray-50 py-2 text-center text-[.85rem] font-bold text-gray-700 transition group-hover:bg-gold-pale group-hover:text-gold-dark">
                Sélectionner
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const boost = BOOSTS.find((b) => b.key === searchParams.boost) ?? BOOSTS[2];
  const listingId = searchParams.listing_id || searchParams.annonce_id;
  return <PaymentFlow boost={boost} listingId={listingId} />;
}
