import type { Metadata } from "next";
import PaymentFlow from "@/components/PaymentFlow";
import { BOOSTS } from "@/lib/constants";

export const metadata: Metadata = { title: "Paiement" };

export default function PaiementPage({ searchParams }: { searchParams: { boost?: string } }) {
  const boost = BOOSTS.find((b) => b.key === searchParams.boost) ?? BOOSTS[2]; // défaut : À la Une
  return <PaymentFlow boost={boost} />;
}
