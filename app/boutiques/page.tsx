import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import BoutiquesView from "@/components/BoutiquesView";

export const metadata = {
  title: "Boutiques — Wanteermako",
  description: "Découvrez toutes les boutiques et vendeurs professionnels sur Wanteermako",
};

export const dynamic = 'force-dynamic';

export default async function BoutiquesPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all profiles that have at least an avatar or a bio (= configured shop)
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  // Filter to keep only "real" boutiques (with avatar, bio, or pro role)
  const boutiques = (allProfiles || []).filter((p: any) => {
    if (p.role === 'pro' || p.role === 'business') return true;
    if (p.bio && p.bio.trim() !== '') return true;
    if (p.avatar_url && p.avatar_url.trim() !== '') return true;
    const name = (p.full_name || '').toLowerCase();
    const isProName = name.includes('multiservice') || name.includes('entreprise') || 
                      name.includes('sarl') || name.includes('suarl') || 
                      name.includes('boutique') || name.includes('shop') || 
                      name.includes('store') || name.includes('tech') ||
                      name.includes('immo') || name.includes('auto');
    return isProName;
  });

  // Fetch listing counts per user in one query
  const { data: listingCounts } = await supabase
    .from('listings')
    .select('user_id')
    .eq('status', 'active');

  const countMap: Record<string, number> = {};
  (listingCounts || []).forEach((l: any) => {
    countMap[l.user_id] = (countMap[l.user_id] || 0) + 1;
  });

  return (
    <div className="wrap py-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-[1.6rem] md:text-[2.2rem] font-extrabold text-gray-900 dark:text-white mb-2">
          🏪 Toutes les Boutiques
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-[.95rem] max-w-xl mx-auto">
          Découvrez les vendeurs professionnels et boutiques partenaires sur Wanteermako
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-green/10 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-[.82rem] font-bold">
          📦 {boutiques.length} boutique{boutiques.length > 1 ? 's' : ''} active{boutiques.length > 1 ? 's' : ''}
        </div>
      </div>

      {boutiques.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-[1.2rem] font-bold text-gray-700 dark:text-gray-300 mb-2">Aucune boutique pour le moment</h2>
          <p className="text-gray-500 text-[.9rem] mb-4">Soyez le premier à ouvrir votre boutique sur Wanteermako !</p>
          <Link href="/publier" className="btn btn-green">
            + Ouvrir ma boutique
          </Link>
        </div>
      ) : (
        <BoutiquesView
          boutiques={boutiques.map((shop: any) => ({
            id: shop.id,
            name: (shop.full_name || "Boutique").includes("@") ? (shop.full_name || "Boutique").split("@")[0] : (shop.full_name || "Boutique"),
            avatar: shop.avatar_url || "https://placehold.co/100x100?text=B",
            cover: shop.cover_url || null,
            bio: shop.bio || "Vendeur sur Wanteermako",
            adCount: countMap[shop.id] || 0,
            isPro: shop.role === "pro" || shop.role === "business" || !!shop.free_premium,
            phone: shop.phone || "",
            memberSince: shop.created_at ? new Date(shop.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "",
          }))}
        />
      )}
    </div>
  );
}
