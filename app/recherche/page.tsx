import { searchListings, LISTINGS } from "@/lib/data";
import { COUNTRIES } from "@/lib/constants";
import ListingView from "@/components/ListingView";

export const metadata = { title: "Recherche" };

type Props = { searchParams: { q?: string; pays?: string } };

export default function SearchPage({ searchParams }: Props) {
  const q = searchParams.q ?? "";
  const pays = searchParams.pays ?? "";

  let results = q ? searchListings(q) : LISTINGS;
  if (pays) results = results.filter((l) => l.countryCode === pays);

  const country = COUNTRIES.find((c) => c.code === pays);
  const title = q
    ? `Résultats pour « ${q} »`
    : country
      ? `Annonces — ${country.flag} ${country.name}`
      : "Toutes les annonces";

  return <ListingView initial={results} title={title} subtitle={`${results.length} annonce(s) trouvée(s)`} />;
}
