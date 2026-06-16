import { COUNTRIES } from "@/lib/constants";
import ListingView from "@/components/ListingView";
import { createClient } from "@supabase/supabase-js";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Recherche" };
export const dynamic = 'force-dynamic';

type Props = { searchParams: { q?: string; pays?: string } };

export default async function SearchPage({ searchParams }: Props) {
  const q = searchParams.q ?? "";
  const pays = searchParams.pays ?? "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase.from('listings').select('id, slug, title, price, location, image, category, description, created_at, premium, specs, profiles!inner(role)').eq('status', 'active');

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%,location.ilike.%${q}%`);
  }

  // Note: we don't strictly have countryCode in DB, we use location. 
  // If `pays` is provided, we can map it or just rely on location string
  // For now we will fetch all and filter in memory if needed, or if location contains country.

  const { data: dbListings } = await query.order('created_at', { ascending: false });

  // Format to match Listing interface expected by ListingView
  const results = (dbListings || []).map((ad: any) => ({
    id: ad.id,
    slug: ad.slug,
    title: ad.title,
    price: ad.price ? `${formatNumber(ad.price)} FCFA` : "Gratuit",
    location: ad.location || "Sénégal",
    image: ad.image || "https://placehold.co/600x400?text=Sans+Image",
    category: ad.category || "Autre",
    premium: ad.premium || false,
    specs: ad.specs || {},
    seller: {
      isPro: ad.profiles?.role === 'pro'
    }
  } as any));

  const country = COUNTRIES.find((c) => c.code === pays);
  const title = q
    ? `Résultats pour « ${q} »`
    : country
      ? `Annonces — ${country.flag} ${country.name}`
      : "Toutes les annonces";

  return <ListingView initial={results} title={title} subtitle={`${results.length} annonce(s) trouvée(s)`} />;
}
