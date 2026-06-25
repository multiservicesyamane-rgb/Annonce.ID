import Image from "next/image";
import Link from "next/link";
import AdCard from "@/components/AdCard";
import { createClient } from "@supabase/supabase-js";
import { formatNumber } from "@/lib/utils";

type Props = { params: { vendeur: string } };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) {
  return { title: `Boutique — Annonce.ID` };
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
  const { data: dbListings } = await supabase.from('listings').select('id, slug, title, price, price_type, location, image, category, views, created_at').eq('user_id', resolvedId).eq('status', 'active').order('created_at', { ascending: false });

  // Vraies notes/avis (aucune donnée fictive)
  const { data: reviewRows } = await supabase.from('reviews').select('rating').eq('seller_id', resolvedId);
  const reviewCount = reviewRows?.length || 0;
  const avgRating = reviewCount ? (reviewRows!.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviewCount) : 0;

  let name = profile?.full_name || "Boutique Pro";
  if (name.includes('@')) {
    name = name.split('@')[0];
  }
  const bio = profile?.bio || "La référence en bonnes affaires";
  const avatar = profile?.avatar_url || "https://placehold.co/120x120?text=B";
  const role = profile?.role === 'admin' ? 'Administrateur' : profile?.role === 'pro' ? 'Boutique Pro' : profile?.role === 'ambassador' ? 'Ambassadeur' : profile?.role === 'employee' ? 'Commercial' : 'Vendeur';
  const isVerifiedSeller = !!(profile?.is_verified || profile?.role === 'pro' || profile?.role === 'business' || profile?.free_premium);
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
    created_at: ad.created_at,
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
      {/* ══ EN-TÊTE BOUTIQUE PREMIUM (clair + sombre) ══ */}
      {/* Couverture */}
      <div className="relative h-[130px] sm:h-[210px] overflow-hidden bg-gradient-to-br from-indigo-800 via-purple-900 to-[#0A0A18]">
        {profile?.cover_url && <Image src={profile.cover_url} alt="Couverture" fill sizes="100vw" className="object-cover" priority />}
        {!profile?.cover_url && (
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1.5px, transparent 1.5px), radial-gradient(circle at 70% 60%, #fff 1.5px, transparent 1.5px)", backgroundSize: "30px 30px" }} />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Carte profil premium (glass) */}
      <div className="wrap">
        <div className="relative z-10 -mt-16 sm:-mt-24 mb-3 rounded-[26px] border border-gray-100 dark:border-white/10 bg-gradient-to-b from-white to-gray-50/70 dark:from-[#171430]/90 dark:to-[#0C0A1A]/90 dark:backdrop-blur-2xl p-5 sm:p-7 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)] dark:shadow-[0_30px_90px_-30px_rgba(124,58,237,0.45)]">
          {/* halos déco (sombre) — couche clippée pour ne pas couper l'avatar */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]">
            <div className="absolute -top-24 left-1/2 hidden h-64 w-64 -translate-x-1/2 rounded-full bg-purple-500/15 blur-3xl dark:block" />
            <div className="absolute -right-20 top-10 hidden h-52 w-52 rounded-full bg-amber-400/10 blur-3xl dark:block" />
          </div>

          <div className="relative flex flex-col items-center text-center">
            {/* Avatar — anneau or sublime */}
            <div className="relative -mt-[68px] sm:-mt-[96px]">
              <div className="rounded-full p-[4px] shadow-2xl" style={{ background: "conic-gradient(from 210deg, #F7DF8B, #C9991F, #FBE9A8, #B8860B, #F7DF8B)" }}>
                <div className="rounded-full bg-white p-[3px] dark:bg-[#0C0A1A]">
                  <img src={avatar} alt={name} className="h-[96px] w-[96px] sm:h-[124px] sm:w-[124px] rounded-full object-cover bg-white" />
                </div>
              </div>
              {isVerifiedSeller && (
                <span className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-amber-300/70 bg-gradient-to-r from-[#1b1530] to-[#2a2140] px-2.5 py-1 text-[.58rem] font-extrabold uppercase tracking-wider text-amber-300 shadow-lg">
                  🛡️ Premium Vérifié
                </span>
              )}
            </div>

            {/* Nom + bio */}
            <h1 className="mt-5 font-display text-[1.5rem] sm:text-[2rem] font-black leading-tight text-gray-900 dark:text-white">{name}</h1>
            <p className="mt-1 max-w-md text-[.85rem] sm:text-[.95rem] text-gray-500 dark:text-white/55 line-clamp-2">{bio}</p>

            {/* Pills */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[.72rem] sm:text-[.8rem]">
              {profile?.is_verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300/40 bg-green-500/10 px-3 py-1.5 font-bold text-green-600 dark:text-green-400">✅ {role} vérifié</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-1.5 font-semibold text-gray-700 dark:text-white/70">👤 {role}</span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-1.5 font-semibold text-gray-700 dark:text-white/70">🗓️ Depuis {memberSince}</span>
            </div>

            {/* Boutons contact — dégradés sublimes */}
            {phoneDigits && (
              <div className="mt-4 flex w-full max-w-md gap-3">
                <a href={`https://wa.me/${phoneDigits}`} target="_blank" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1FAD55] to-[#25D366] px-4 py-3 text-[.9rem] font-extrabold text-white shadow-lg shadow-green-500/30 transition hover:scale-[1.02] hover:shadow-green-500/50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                  WhatsApp
                </a>
                <a href={`tel:${profile?.phone}`} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6D28D9] to-[#A855F7] px-4 py-3 text-[.9rem] font-extrabold text-white shadow-lg shadow-purple-500/30 transition hover:scale-[1.02] hover:shadow-purple-500/50">
                  📞 Appeler
                </a>
              </div>
            )}
          </div>

          {/* Stats — tuiles dorées premium */}
          <div className="relative mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
            {[
              { v: String(ads.length), l: "Annonces" },
              { v: formatNumber(totalViews), l: "Vues" },
              { v: reviewCount ? `★ ${avgRating.toFixed(1)}` : "★ —", l: reviewCount ? `${reviewCount} avis` : "Aucun avis" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-amber-200/60 dark:border-amber-400/20 bg-gradient-to-b from-amber-50 to-white dark:from-amber-400/[0.07] dark:to-transparent py-3 text-center shadow-sm">
                <div className="font-display text-[1.25rem] sm:text-[1.6rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#C9991F] to-[#9A7B1A] dark:from-[#FBE9A8] dark:to-[#C9991F]">{s.v}</div>
                <div className="mt-0.5 text-[.6rem] sm:text-[.7rem] font-bold uppercase tracking-wider text-gray-500 dark:text-white/45">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Liens sociaux */}
          {socialIcons.some((s) => social[s.key]) && (
            <div className="relative mt-4 flex flex-wrap justify-center gap-2">
              {socialIcons.filter((s) => social[s.key]).map((s) => (
                <a key={s.key} href={social[s.key].startsWith("http") ? social[s.key] : `https://${social[s.key]}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-[.74rem] font-semibold text-gray-700 dark:text-white/80 transition hover:border-green hover:text-green">
                  <span>{s.icon}</span> {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="wrap py-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-[1.1rem] sm:text-[1.4rem] font-extrabold">Annonces de {name}</h2>
          <Link href="/recherche" className="text-[.8rem] font-semibold text-green hover:underline">Voir tout →</Link>
        </div>
        {categories.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            {categories.map((c) => (
              <span key={c} className="shrink-0 whitespace-nowrap rounded-full bg-green/10 px-3 py-1 text-[.72rem] font-semibold text-green">{c}</span>
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
