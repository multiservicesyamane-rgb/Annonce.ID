import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const metadata = {
  title: "Boutiques — Annonce.ID",
  description: "Découvrez toutes les boutiques et vendeurs professionnels sur Annonce.ID",
};

export const dynamic = 'force-dynamic';

export default async function BoutiquesPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all profiles that have at least an avatar or a bio (= configured shop)
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio, role, created_at')
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
          Découvrez les vendeurs professionnels et boutiques partenaires sur Annonce.ID
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-green/10 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-[.82rem] font-bold">
          📦 {boutiques.length} boutique{boutiques.length > 1 ? 's' : ''} active{boutiques.length > 1 ? 's' : ''}
        </div>
      </div>

      {boutiques.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-[1.2rem] font-bold text-gray-700 dark:text-gray-300 mb-2">Aucune boutique pour le moment</h2>
          <p className="text-gray-500 text-[.9rem] mb-4">Soyez le premier à ouvrir votre boutique sur Annonce.ID !</p>
          <Link href="/publier" className="btn btn-green">
            + Ouvrir ma boutique
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boutiques.map((shop: any) => {
            let name = shop.full_name || "Boutique";
            if (name.includes('@')) name = name.split('@')[0];
            const avatar = shop.avatar_url || "https://placehold.co/100x100?text=B";
            const bio = shop.bio || "Vendeur sur Annonce.ID";
            const adCount = countMap[shop.id] || 0;
            const isPro = shop.role === 'pro' || shop.role === 'business';
            const memberSince = shop.created_at 
              ? new Date(shop.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) 
              : '';

            return (
              <Link
                key={shop.id}
                href={`/boutique/${shop.id}`}
                className="group relative flex flex-col rounded-[16px] border border-gray-100 dark:border-white/10 bg-white dark:bg-[#111722]/80 overflow-hidden shadow-sm hover:shadow-lg hover:border-gold/40 transition-all duration-300"
              >
                {/* Top gradient banner */}
                <div className="h-16 bg-gradient-to-br from-green-600/20 via-neon-gold/10 to-transparent relative">
                  {isPro && (
                    <span className="absolute top-2 right-2 bg-gradient-to-r from-neon-gold to-[#D4891A] text-dark-900 text-[.6rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      PRO
                    </span>
                  )}
                </div>

                {/* Avatar overlapping banner */}
                <div className="flex flex-col items-center -mt-8 px-4 pb-5">
                  <Image
                    src={avatar}
                    alt={name}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full border-[3px] border-white dark:border-dark-800 object-cover shadow-md bg-white group-hover:scale-105 transition-transform"
                  />
                  <h3 className="mt-2 font-display text-[.95rem] font-bold text-gray-900 dark:text-white text-center leading-tight group-hover:text-green transition-colors">
                    {name}
                  </h3>
                  <p className="text-[.75rem] text-gray-500 dark:text-gray-400 mt-1 text-center line-clamp-2 leading-snug">
                    {bio.length > 60 ? bio.slice(0, 60) + '…' : bio}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-3 text-[.72rem] text-gray-500">
                    <span className="flex items-center gap-1">
                      📦 <b className="text-gray-700 dark:text-white">{adCount}</b> annonce{adCount > 1 ? 's' : ''}
                    </span>
                    {memberSince && (
                      <span className="flex items-center gap-1">
                        🗓️ {memberSince}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="mt-3 w-full">
                    <span className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[.8rem] font-bold text-green group-hover:bg-green group-hover:text-white transition-all">
                      Voir la boutique →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
