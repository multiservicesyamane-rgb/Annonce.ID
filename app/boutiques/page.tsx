import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import BoutiquesView from "@/components/BoutiquesView";
import { BRAND } from "@/lib/constants";

export const metadata = {
  title: `Boutiques — ${BRAND.name}`,
  description: `Découvrez toutes les boutiques et vendeurs professionnels sur ${BRAND.name}`,
};

// Force dynamic rendering to query profiles and listings in real-time from Supabase
export const dynamic = "force-dynamic";

export default async function BoutiquesPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  // Nombre d'annonces ACTIVES par vendeur
  const { data: listingCounts } = await supabase
    .from('listings')
    .select('user_id')
    .eq('status', 'active');

  const countMap: Record<string, number> = {};
  (listingCounts || []).forEach((l: any) => {
    countMap[l.user_id] = (countMap[l.user_id] || 0) + 1;
  });

  // Boutique = TOUT vendeur ayant au moins 1 annonce active (affichage automatique,
  // indépendant du flag has_boutique pour ne jamais rater un vendeur).
  const boutiques = (allProfiles || []).filter(
    (p: any) => (countMap[p.id] || 0) > 0,
  );

  return (
    <div className="wrap py-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-[1.6rem] md:text-[2.2rem] font-extrabold text-gray-900 dark:text-white mb-2">
          🏪 Toutes les Boutiques
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-[.95rem] max-w-xl mx-auto">
          Découvrez les vendeurs professionnels et boutiques partenaires sur {BRAND.name}
        </p>
      </div>

      {boutiques.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-[1.2rem] font-bold text-gray-700 dark:text-gray-300 mb-2">Aucune boutique active pour le moment</h2>
          <p className="text-gray-500 text-[.9rem] mb-4">Une boutique apparaît ici automatiquement dès qu'un vendeur publie sa première annonce.</p>
          <Link href="/publier" className="btn btn-green">
            Publier une annonce
          </Link>
        </div>
      ) : (
        <BoutiquesView
          boutiques={boutiques.map((shop: any) => ({
            id: shop.id,
            name: (shop.full_name || "Boutique").includes("@") ? (shop.full_name || "Boutique").split("@")[0] : (shop.full_name || "Boutique"),
            avatar: shop.avatar_url || "https://placehold.co/100x100?text=B",
            cover: shop.cover_url || null,
            bio: shop.bio || `Vendeur sur ${BRAND.name}`,
            isPro: shop.role === "pro" || shop.role === "business" || !!shop.free_premium,
            phone: shop.phone || "",
            memberSince: shop.created_at ? new Date(shop.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "",
          }))}
        />
      )}
    </div>
  );
}
