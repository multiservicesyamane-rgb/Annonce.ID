import Image from "next/image";
import Link from "next/link";
import AdCard from "@/components/AdCard";
import { createClient } from "@supabase/supabase-js";
import { formatNumber } from "@/lib/utils";

type Props = { params: { vendeur: string } };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) {
  return { title: `Boutique` };
}

export default async function BoutiquePage({ params }: Props) {
  const sellerId = params.vendeur;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch profile
  const { data: profile } = await supabase.from('profiles').select('id, full_name, avatar_url, phone, role, created_at, bio, social_links').eq('id', sellerId).single() as { data: any };
  
  // Fetch their active listings
  const { data: dbListings } = await supabase.from('listings').select('id, slug, title, price, location, image, category, views').eq('user_id', sellerId).eq('status', 'active').order('created_at', { ascending: false });

  let name = profile?.full_name || "Boutique Pro";
  if (name.includes('@')) {
    name = name.split('@')[0];
  }
  const bio = profile?.bio || "La référence en bonnes affaires";
  const avatar = profile?.avatar_url || "https://placehold.co/120x120?text=B";
  const role = profile?.role === 'admin' ? 'Administrateur' : profile?.role === 'pro' ? 'Boutique Pro' : 'Vendeur vérifié';
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '2024';
  const socialLinks = profile?.social_links || {};

  const ads = (dbListings || []).map((ad: any) => ({
    id: ad.id,
    slug: ad.slug,
    title: ad.title,
    price: ad.price ? `${formatNumber(ad.price)} FCFA` : "Gratuit",
    location: ad.location || "Sénégal",
    image: ad.image || "https://placehold.co/600x400?text=Sans+Image",
    category: ad.category || "Autre",
    views: ad.views ?? 0,
  }));

  return (
    <div>
      {/* Bannière boutique */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-green-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_20%_30%,rgba(0,136,85,.15)_0,transparent_45%)]" />
        <div className="relative z-10 mx-auto flex max-w-[1320px] flex-wrap items-center gap-6 px-4 py-12">
          <Image src={avatar} alt={name} width={100} height={100} className="h-[100px] w-[100px] rounded-full border-[3px] border-gold object-cover shadow-lg bg-white" />
          <div>
            <h1 className="flex items-center gap-2 font-display text-[1.8rem] font-extrabold text-white leading-none mb-1">
              {name}
            </h1>
            <p className="text-white/60 text-[.9rem] mb-3">{bio}</p>
            <div className="flex flex-wrap gap-3 text-[.8rem] text-white/90">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                ✅ <span className="font-bold">{role}</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                🗓️ Membre depuis {memberSince}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                ⭐ <span className="font-bold text-gold">4.8/5</span> (12 avis)
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                📦 {ads.length} annonces actives
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap py-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-[1.2rem] font-bold">Annonces de {name}</h2>
          <Link href="/recherche" className="text-[.82rem] font-semibold text-green">Voir tout →</Link>
        </div>
        
        {ads.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            Ce vendeur n'a pas encore d'annonces en ligne.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {ads.map((a: any) => (
              <Link key={a.id} href={`/annonce/${a.slug}`} className="block hover:opacity-90 transition-opacity">
                <AdCard ad={a} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
