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

  // Fetch profile — try by UUID first, then fallback to name slug match
  let profile: any = null;
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sellerId);
  
  if (isUuid) {
    const { data } = await supabase.from('profiles').select('*').eq('id', sellerId).single();
    profile = data;
  }
  
  // Fallback: search by name slug (ex: "boutique-pro" → matches "Boutique Pro")
  if (!profile) {
    const nameSearch = decodeURIComponent(sellerId).replace(/-/g, ' ');
    const { data } = await supabase.from('profiles').select('*').ilike('full_name', `%${nameSearch}%`).limit(1).single();
    profile = data;
  }

  const resolvedId = profile?.id || sellerId;

  // Fetch their active listings
  const { data: dbListings } = await supabase.from('listings').select('id, slug, title, price, price_type, location, image, category, views').eq('user_id', resolvedId).eq('status', 'active').order('created_at', { ascending: false });

  let name = profile?.full_name || "Boutique Pro";
  if (name.includes('@')) {
    name = name.split('@')[0];
  }
  const bio = profile?.bio || "La référence en bonnes affaires";
  const avatar = profile?.avatar_url || "https://placehold.co/120x120?text=B";
  const role = profile?.role === 'admin' ? 'Administrateur' : profile?.role === 'pro' ? 'Boutique Pro' : 'Vendeur vérifié';
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '2024';
  const socialLinks = profile?.social_links || {};
  const phoneDigits = (profile?.phone || "").replace(/\D/g, "");

  const ads = (dbListings || []).map((ad: any) => ({
    id: ad.id,
    slug: ad.slug,
    title: ad.title,
    price: ad.price_type === "Sur devis" ? "Sur devis" : (ad.price && ad.price !== "0" ? `${formatNumber(ad.price)} FCFA` : "Gratuit"),
    location: ad.location || "Sénégal",
    image: ad.image || "https://placehold.co/600x400?text=Sans+Image",
    category: ad.category || "Autre",
    views: ad.views ?? 0,
  }));

  const totalViews = (dbListings || []).reduce((s: number, a: any) => s + (a.views || 0), 0);
  const categories = Array.from(new Set(ads.map((a: any) => a.category))).slice(0, 8);
  const social = socialLinks as Record<string, string>;
  const socialIcons: { key: string; label: string; icon: string; prefix?: string }[] = [
    { key: "website", label: "Site web", icon: "🌐" },
    { key: "facebook", label: "Facebook", icon: "📘" },
    { key: "instagram", label: "Instagram", icon: "📸" },
    { key: "tiktok", label: "TikTok", icon: "🎵" },
  ];

  return (
    <div>
      {/* ── En-tête boutique : couverture + logo + contact ── */}
      {/* Bande de couverture */}
      <div className="relative h-[150px] sm:h-[230px] overflow-hidden bg-gradient-to-br from-green-700 via-green-900 to-dark-900">
        {profile?.cover_url && <Image src={profile.cover_url} alt="Couverture" fill sizes="100vw" className="object-cover" priority />}
        {!profile?.cover_url && (
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1.5px, transparent 1.5px), radial-gradient(circle at 70% 60%, #fff 1.5px, transparent 1.5px)", backgroundSize: "32px 32px" }} />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      </div>

      {/* Carte profil (chevauche la couverture) */}
      <div className="wrap">
        <div className="relative -mt-10 sm:-mt-14 mb-2 rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Logo entreprise */}
            <Image src={avatar} alt={name} width={104} height={104} className="-mt-14 sm:-mt-20 h-[88px] w-[88px] sm:h-[104px] sm:w-[104px] rounded-2xl border-4 border-white dark:border-dark-800 object-cover shadow-xl bg-white" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-[1.3rem] sm:text-[1.7rem] font-extrabold text-gray-900 dark:text-white leading-tight">{name}</h1>
                {(profile?.role === 'pro' || profile?.role === 'business' || profile?.free_premium) && (
                  <span className="rounded-full bg-gradient-to-r from-gold to-gold-light px-2 py-0.5 text-[.62rem] font-extrabold uppercase tracking-wide text-dark-900">✦ VIP</span>
                )}
              </div>
              <p className="text-gray-500 dark:text-white/60 text-[.82rem] sm:text-[.9rem] mt-0.5 line-clamp-2">{bio}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[.7rem] sm:text-[.78rem]">
                <span className="rounded-full bg-green/10 px-2.5 py-1 font-bold text-green">✅ {role}</span>
                <span className="rounded-full bg-gray-100 dark:bg-dark-700 px-2.5 py-1 font-medium text-gray-600 dark:text-white/70">🗓️ Depuis {memberSince}</span>
                <span className="rounded-full bg-gray-100 dark:bg-dark-700 px-2.5 py-1 font-medium text-gray-600 dark:text-white/70">📦 {ads.length} annonces</span>
              </div>
            </div>

            {/* Boutons contact */}
            <div className="flex gap-2 shrink-0">
              {phoneDigits && (
                <a href={`https://wa.me/${phoneDigits}`} target="_blank" className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2.5 text-[.82rem] font-bold text-white shadow-sm hover:scale-[1.03] transition">💬 WhatsApp</a>
              )}
              {phoneDigits && (
                <a href={`tel:${profile?.phone}`} className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-900 px-4 py-2.5 text-[.82rem] font-bold text-gray-800 dark:text-white hover:border-green transition">📞 Appeler</a>
              )}
            </div>
          </div>

          {/* Bandeau statistiques */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-border py-2.5 text-center">
              <div className="font-display text-[1.15rem] sm:text-[1.4rem] font-extrabold text-gray-900 dark:text-white">{ads.length}</div>
              <div className="text-[.66rem] sm:text-[.72rem] font-semibold uppercase tracking-wide text-gray-500">Annonces</div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-border py-2.5 text-center">
              <div className="font-display text-[1.15rem] sm:text-[1.4rem] font-extrabold text-gray-900 dark:text-white">{formatNumber(totalViews)}</div>
              <div className="text-[.66rem] sm:text-[.72rem] font-semibold uppercase tracking-wide text-gray-500">Vues</div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-border py-2.5 text-center">
              <div className="font-display text-[1.15rem] sm:text-[1.4rem] font-extrabold text-gold">★ 4.8</div>
              <div className="text-[.66rem] sm:text-[.72rem] font-semibold uppercase tracking-wide text-gray-500">Note</div>
            </div>
          </div>

          {/* Liens sociaux */}
          {socialIcons.some((s) => social[s.key]) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {socialIcons.filter((s) => social[s.key]).map((s) => (
                <a key={s.key} href={social[s.key].startsWith("http") ? social[s.key] : `https://${social[s.key]}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-900 px-3 py-1.5 text-[.74rem] font-semibold text-gray-700 dark:text-white/80 hover:border-green transition">
                  <span>{s.icon}</span> {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="wrap py-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[1.2rem] sm:text-[1.4rem] font-extrabold">Annonces de {name}</h2>
          <Link href="/recherche" className="text-[.82rem] font-semibold text-green hover:underline">Voir tout →</Link>
        </div>
        {categories.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c} className="rounded-full bg-green/10 px-3 py-1 text-[.74rem] font-semibold text-green">{c}</span>
            ))}
          </div>
        )}

        {ads.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            Ce vendeur n'a pas encore d'annonces en ligne.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {ads.map((a: any) => (
              <AdCard key={a.id} ad={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
