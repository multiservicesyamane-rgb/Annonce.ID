"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import AdCard from "./AdCard";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { whatsappLink } from "@/lib/payment";
import { formatNumber } from "@/lib/utils";
import ConfirmModal from "./ConfirmModal";
import EmptyState from "./EmptyState";
import { useFavorites } from "./FavButton";
import ImageCropperModal from "./ImageCropperModal";
import ChatInterface from "./ChatInterface";
import MarketingPanel from "./MarketingPanel";
type Panel = "overview" | "stats" | "ads" | "campaigns" | "purchases" | "showroom" | "credits" | "favorites" | "messages" | "reviews" | "alerts" | "profile" | "faq" | "security";

const NAV: { id: string; icon: string; label: string; section?: string; badge?: number; isLink?: boolean; href?: string }[] = [
  { id: "overview", icon: "📊", label: "Accueil", section: "Principal" },
  { id: "stats", icon: "📈", label: "Statistiques" },
  { id: "ads", icon: "📋", label: "Gérer mes annonces" },
  { id: "campaigns", icon: "🚀", label: "Marketing & Pub" },
  { id: "publish", icon: "➕", label: "Publier une annonce", isLink: true, href: "/publier" },
  { id: "purchases", icon: "🛒", label: "Historique d'achats" },
  { id: "showroom", icon: "🏪", label: "Ma Boutique" },
  { id: "favorites", icon: "❤", label: "Mes Favoris", section: "Interactions" },
  { id: "messages", icon: "💬", label: "Messagerie & Chat" },
  { id: "reviews", icon: "⭐", label: "Avis reçus" },
  { id: "alerts", icon: "🔔", label: "Gérer mes alertes" },
  { id: "profile", icon: "👤", label: "Mon Profil & CV", section: "Paramètres" },
  { id: "security", icon: "🔒", label: "Sécurité & Vie privée" },
  { id: "faq", icon: "❓", label: "FAQ" },
];

const CHART = [120, 95, 210, 180, 340, 290, 400, 380, 320, 450, 510, 480, 390, 560];

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [panel, setPanel] = useState<Panel>((searchParams.get("panel") as Panel) || "overview");
  const [toast, setToast] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLanguage, setProfileLanguage] = useState("Français");

  // Security Panel States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showroomName, setShowroomName] = useState("");
  const [showroomBio, setShowroomBio] = useState("");
  const [showroomSocials, setShowroomSocials] = useState<any>({});
  const [showroomCover, setShowroomCover] = useState("");
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState<string | null>(null);
  const [alertPrefs, setAlertPrefs] = useState<any>({ messages: true, expired: true, stats: false, search: true, promos: false });
  const [reviews, setReviews] = useState<any[]>([]);
  const [receivedFavsCount, setReceivedFavsCount] = useState(0);
  const [ads, setAds] = useState<any[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [boostCredits, setBoostCredits] = useState<any[]>([]);
  const [usingCredit, setUsingCredit] = useState<string | null>(null);
  const [creditTarget, setCreditTarget] = useState<Record<string, string>>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const supabase = createClient();
  const { favs } = useFavorites();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adToDelete, setAdToDelete] = useState<string | number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adTab, setAdTab] = useState("en_ligne");
  const [searchQuery, setSearchQuery] = useState("");
  const [marketingTab, setMarketingTab] = useState("whatsapp");
  const [campaignWeeks, setCampaignWeeks] = useState(1);
  const [fileHero, setFileHero] = useState<string | null>(null);
  const [typeHero, setTypeHero] = useState<string | null>(null);

  const [fileFooter, setFileFooter] = useState<string | null>(null);
  const [typeFooter, setTypeFooter] = useState<string | null>(null);

  const [fileCatalogue, setFileCatalogue] = useState<string | null>(null);
  const [typeCatalogue, setTypeCatalogue] = useState<string | null>(null);

  const [fileProduct, setFileProduct] = useState<string | null>(null);
  const [typeProduct, setTypeProduct] = useState<string | null>(null);

  const [cropModalImage, setCropModalImage] = useState<string | null>(null);
  const [cropModalZone, setCropModalZone] = useState<"hero" | "footer" | "catalogue" | "product" | "avatar" | "cover" | null>(null);

  const [campaignUrlType, setCampaignUrlType] = useState("custom");
  const [campaignUrl, setCampaignUrl] = useState("");

  // Date et persistences (Local Storage Mock)
  const [campaignStartDate, setCampaignStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);

  const getCampaignPrice = (weeks: number) => {
    if (weeks === 1) return 10000;
    if (weeks === 2) return 18000;
    if (weeks === 3) return 25000;
    return 30000;
  };

  const handlePanelChange = (id: string) => {
    setPanel(id as Panel);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    // Lire le panel depuis l'URL si présent (ex: ?panel=campaigns)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("panel");
      if (p && ["overview", "ads", "campaigns", "purchases", "showroom", "credits", "favorites", "messages", "alerts", "profile", "faq", "security"].includes(p)) {
        setPanel(p as Panel);
        // Nettoyer l'URL sans recharger
        window.history.replaceState({}, '', window.location.pathname);
      }

      // Load real campaigns from Supabase
      try {
        supabase.from('campagnes_pub').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(1).then(({ data }) => {
          if (data && data.length > 0) {
            setActiveCampaign({
              hero: data[0].hero,
              footer: data[0].footer,
              catalogue: data[0].catalogue,
              product: data[0].product,
              url: data[0].url,
              weeks: data[0].weeks,
              startDate: data[0].start_date,
              status: data[0].status,
              id: data[0].id
            });
          }
        });

        const purch = localStorage.getItem('annonceid_purchases');
        if (purch) setPurchases(JSON.parse(purch));
      } catch { }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);

        // Fetch user profile from profiles table
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data: profData }) => {
          const defaultName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Ma Boutique";
          if (profData) {
            setProfile(profData);
            setProfileName(profData.full_name || defaultName);
            setProfileBio(profData.bio || "La référence en bonnes affaires");
            setProfilePhone(profData.phone || "");
            setShowroomName(profData.full_name || defaultName);
            setShowroomBio(profData.bio || "La référence en bonnes affaires");
            setShowroomSocials(profData.social_links || {});
            setShowroomCover(profData.cover_url || "");
            setAlertPrefs(profData.alert_prefs || { messages: true, expired: true, stats: false, search: true, promos: false });
          } else {
            setProfileName(defaultName);
            setShowroomName(defaultName);
            setShowroomBio("La référence en bonnes affaires");
          }
          setLoadingProfile(false);
        });

        // Fetch listings
        supabase.from('listings').select('id, slug, title, price, price_type, location, image, category, category_slug, status, views, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
          if (data) {
            const formatted = data.map((d: any) => ({
              ...d,
              price: d.price_type === "Sur devis" ? "Sur devis" : (d.price && d.price !== "0" ? `${formatNumber(d.price)} FCFA` : "Gratuit")
            }));
            setAds(formatted);
          }
          setLoadingAds(false);
        });

        // Fetch reviews reçus (avis sur le vendeur)
        supabase.from('reviews').select('rating, comment, created_at, listing_id').eq('seller_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setReviews(data);
        });

        // Fetch purchases from DB with fallback to localStorage
        supabase.from('purchases').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data: dbPurchases }) => {
          if (dbPurchases && dbPurchases.length > 0) {
            setPurchases(dbPurchases.map(p => ({
              id: p.ref_command || p.id,
              date: p.created_at,
              type: p.type,
              amount: p.amount,
              status: p.status
            })));
          } else {
            const purch = localStorage.getItem('annonceid_purchases');
            if (purch) setPurchases(JSON.parse(purch));
          }
        });
      } else {
        setLoadingAds(false);
      }
    });
  }, [supabase.auth]);

  // Fetch count of favorites received on user's listings
  useEffect(() => {
    if (user && ads.length > 0) {
      const listingIds = ads.map(a => a.id);
      supabase.from('favorites').select('id', { count: 'exact', head: true }).in('listing_id', listingIds).then(({ count, error }) => {
        if (!error && count !== null) {
          setReceivedFavsCount(count);
        }
      });
    }
  }, [ads, user, supabase]);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if ((e.target as Element).closest('.dots-btn')) return;
      setOpenMenuId(null);
    };
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  async function toggleSold(id: number) {
    const ad = ads.find(a => a.id === id);
    if (!ad) return;
    const newStatus = ad.status === 'sold' ? 'active' : 'sold';

    // Optimistic UI update
    setAds(ads.map(a => a.id === id ? { ...a, status: newStatus } : a));

    // DB Update
    await supabase.from('listings').update({ status: newStatus }).eq('id', id);
    show(newStatus === 'sold' ? "✅ Annonce marquée comme vendue !" : "✅ Annonce remise en vente !");
    setOpenMenuId(null);
  }

  async function toggleActive(id: number) {
    const ad = ads.find(a => a.id === id);
    if (!ad) return;
    const newStatus = ad.status === 'inactive' ? 'active' : 'inactive';

    // Optimistic UI update
    setAds(ads.map(a => a.id === id ? { ...a, status: newStatus } : a));

    // DB Update
    await supabase.from('listings').update({ status: newStatus }).eq('id', id);
    show(newStatus === 'active' ? "✅ Annonce activée !" : "⏸️ Annonce désactivée.");
    setOpenMenuId(null);
  }

  async function handleDeleteAd() {
    if (!adToDelete) return;

    // Optimistic UI
    setAds(ads.filter(a => a.id !== adToDelete));

    // DB Update
    await supabase.from('listings').delete().eq('id', adToDelete);

    show("🗑️ Annonce supprimée avec succès !");
    setAdToDelete(null);
  }

  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };
  const max = Math.max(...CHART);

  // Crédits boost : vendus par l'admin (espèces) ou achetés, utilisables sur ses annonces
  async function loadBoostCredits() {
    try {
      const res = await fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list" }) });
      const d = await res.json();
      setBoostCredits(d.credits || []);
    } catch { /* ignore */ }
  }
  useEffect(() => { if (panel === "credits") loadBoostCredits(); }, [panel]);

  async function useBoostCredit(creditId: string) {
    const listingId = creditTarget[creditId];
    if (!listingId) { show("Choisis l'annonce à booster"); return; }
    setUsingCredit(creditId);
    try {
      const res = await fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "use", creditId, listingId }) });
      const d = await res.json();
      if (d.ok) { show("✓ Boost appliqué à ton annonce !"); loadBoostCredits(); }
      else show(`❌ ${d.error || "Erreur"}`);
    } catch { show("❌ Erreur de connexion"); }
    finally { setUsingCredit(null); }
  }

  const displayName = profileName || profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || user?.phone || "Utilisateur";
  const displayEmail = user?.email || user?.phone || "Nouvel utilisateur";
  const isKonnecta = typeof displayEmail === 'string' && displayEmail.toLowerCase().includes('multiservicesyamane');
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || "https://i.pravatar.cc/96?img=12";

  // Favoris: fetch from Supabase based on stored IDs
  const [favListings, setFavListings] = useState<any[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  useEffect(() => {
    if (favs.length === 0) { setFavListings([]); return; }
    setLoadingFavs(true);
    supabase.from('listings').select('id, slug, title, price, location, image, category').in('id', favs).then(({ data }) => {
      if (data) setFavListings(data.map((ad: any) => ({
        id: ad.id, slug: ad.slug, title: ad.title,
        price: ad.price ? `${ad.price} FCFA` : 'Gratuit',
        location: ad.location || 'Sénégal',
        image: ad.image || 'https://placehold.co/600x400?text=Sans+Image',
        category: ad.category || 'Autre',
      })));
      setLoadingFavs(false);
    });
  }, [favs, supabase]);

  const filteredAds = ads.filter(ad => {
    // Tab filter
    let matchTab = false;
    if (adTab === 'en_ligne') matchTab = ad.status === 'active' || !ad.status;
    else if (adTab === 'hors_ligne') matchTab = ad.status === 'inactive';
    else if (adTab === 'en_attente') matchTab = ad.status === 'pending';
    else if (adTab === 'expirees') matchTab = ad.status === 'expired';
    else if (adTab === 'rejetees') matchTab = ad.status === 'rejected';
    else if (adTab === 'brouillons') matchTab = ad.status === 'draft';
    else matchTab = true;

    // Search filter
    let matchSearch = true;
    if (searchQuery.trim() !== "") {
      matchSearch = ad.title?.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return matchTab && matchSearch;
  });

  const getNextMondays = () => {
    const dates = [];
    let d = new Date();
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7)); // Prochain Lundi
    for (let i = 0; i < 4; i++) {
      dates.push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
    return dates;
  };
  const availableWeeks = getNextMondays();

  // Mettre à jour la date par défaut si elle n'est pas un lundi disponible
  useEffect(() => {
    if (availableWeeks.length > 0 && campaignStartDate === new Date().toISOString().split('T')[0]) {
      setCampaignStartDate(availableWeeks[0].toISOString().split('T')[0]);
    }
  }, []);

  const fileToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      if (file.type.startsWith('video/')) {
        if (file.size > 1.5 * 1024 * 1024) {
          show("❌ Vidéo trop lourde pour le test (Max: 1.5MB).");
          return reject("File too large");
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      } else {
        // Compression des images pour le LocalStorage
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxW = 1200;
            let w = img.width;
            let h = img.height;
            if (w > maxW) {
              h = Math.round((h * maxW) / w);
              w = maxW;
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.drawImage(img, 0, 0, w, h);
            // Qualité 0.5 pour réduire le poids au maximum (spécial LocalStorage)
            resolve(canvas.toDataURL("image/jpeg", 0.5));
          };
          img.src = ev.target?.result as string;
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden dark:bg-dark-900">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-900 px-4 py-3 lg:hidden">
        <div className="font-bold dark:text-white flex items-center gap-2">
          <span className="text-xl">📊</span> Tableau de bord
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl dark:text-white">☰</button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-black/60 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[1001] w-[260px] flex-col border-r border-gray-100 dark:border-dark-border bg-white dark:bg-dark-900 shadow-2xl transition-transform duration-300 lg:static lg:flex lg:w-[220px] lg:translate-x-0 lg:shadow-none ${isMobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full flex"}`}>
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border px-3 pt-3">
          <span className="text-[.8rem] font-extrabold dark:text-white">📊 Mon Espace</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-xl text-gray-400 lg:hidden">✕</button>
        </div>
        {/* Carte profil gradient (style Wanteermako) */}
        <div className="m-3 relative overflow-hidden rounded-[18px] bg-g1 p-4 text-white">
          <div className="absolute -right-5 -top-7 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-5 left-5 h-16 w-16 rounded-full bg-white/[.07]" />
          <div className="relative z-10">
            <div className="mb-2 h-12 w-12 overflow-hidden rounded-[14px] border-2 border-white/30 bg-white/20">
              {loadingProfile ? <div className="h-full w-full animate-pulse bg-white/20"></div> : avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg font-extrabold">{(displayName || "U").slice(0, 2).toUpperCase()}</div>}
            </div>
            <div className="text-[.92rem] font-extrabold truncate">{loadingProfile ? "Chargement..." : displayName}</div>
            <div className="text-[.7rem] opacity-85 truncate">📍 {profile?.location || profile?.region || "Sénégal"}</div>
            <div className="mt-2.5 flex gap-3">
              <div><div className="text-[1rem] font-extrabold leading-none">{ads.length}</div><div className="text-[.62rem] opacity-80">Annonces</div></div>
              <div><div className="text-[1rem] font-extrabold leading-none">{ads.reduce((a, d) => a + (d.views || 0), 0)}</div><div className="text-[.62rem] opacity-80">Vues</div></div>
              <div><div className="text-[1rem] font-extrabold leading-none">{receivedFavsCount}</div><div className="text-[.62rem] opacity-80">Favoris</div></div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1">
              <span className="rounded-md border border-white/30 bg-white/20 px-1.5 py-0.5 text-[.62rem] font-bold">✓ Vérifié</span>
              {(profile?.role === "pro" || profile?.role === "business") && <span className="rounded-md border border-white/30 bg-white/20 px-1.5 py-0.5 text-[.62rem] font-bold">🏆 Pro</span>}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {NAV.map((n) => (
            <div key={n.id}>
              {n.section && <div className="px-5 pb-1 pt-4 text-[.66rem] font-bold uppercase tracking-widest text-gray-300 dark:text-white/40">{n.section}</div>}
              {n.isLink ? (
                <Link
                  href={n.href!}
                  className={`flex w-full items-center gap-2.5 border-l-[3px] px-5 py-2.5 text-[.87rem] transition border-transparent text-gray-700 dark:text-white/70 hover:text-green`}
                >
                  <span className="w-5 text-center">{n.icon}</span> {n.label}
                </Link>
              ) : (
                <button
                  onClick={() => handlePanelChange(n.id)}
                  className={`flex w-full items-center gap-2.5 border-l-[3px] px-5 py-2.5 text-[.87rem] transition ${panel === n.id ? "border-green bg-green/[.06] font-semibold text-green" : "border-transparent text-gray-700 dark:text-white/70 hover:text-green"
                    }`}
                >
                  <span className="w-5 text-center shrink-0">{n.icon}</span>
                  <span className="truncate">{n.label}</span>
                  {n.badge && <span className="ml-auto rounded-[10px] bg-brand-red px-1.5 py-0.5 text-[.62rem] font-bold text-white shrink-0">{n.badge}</span>}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 dark:border-dark-border p-4">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="btn btn-ghost btn-sm btn-block justify-start !text-brand-red dark:hover:bg-dark-800"
          >
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 bg-gray-50 dark:bg-dark-900 px-4 py-6 lg:p-8 overflow-y-auto w-full">
        {panel === "overview" && (
          <div className="animate-fadeUp max-w-[1000px] mx-auto">
            {/* Hero profil — Compact (Transport Style) */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[16px] border border-gray-100 dark:border-dark-border bg-white dark:bg-[#161B22] p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 shrink-0 rounded-full border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-[#0D1117] overflow-hidden shadow-sm">
                  {loadingProfile ? <div className="h-full w-full animate-pulse bg-gray-200 dark:bg-dark-800"></div> : avatarUrl
                    ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-[1.2rem] font-extrabold text-gray-400">{(displayName || 'U').slice(0, 2).toUpperCase()}</div>}
                </div>
                <div>
                  <div className="font-display text-[1.2rem] sm:text-[1.3rem] font-extrabold dark:text-white leading-tight">
                    {loadingProfile ? "Chargement du profil..." : `Bonjour, ${displayName} 👋`}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[.75rem] text-gray-500 dark:text-[#8B949E]">
                    <span className="capitalize">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="rounded bg-green/10 px-1.5 py-0.5 font-bold text-green">✓ Vendeur vérifié</span>
                  </div>
                </div>
              </div>
              <Link href="/publier" className="btn btn-green h-10 px-5 w-full sm:w-auto text-[.85rem] shrink-0 font-bold">+ Publier</Link>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiGrad gradient="bg-g1" icon="📦" label="Annonces actives" value={ads.filter(a => a.status === 'active' || !a.status).length} />
              <KpiGrad gradient="bg-g3" icon="👁️" label="Vues totales" value={ads.reduce((acc, ad) => acc + (ad.views || 0), 0)} />
              <KpiGrad gradient="bg-g5" icon="❤️" label="Favoris reçus" value={receivedFavsCount} />
              <KpiGrad gradient="bg-g4" icon="🗂️" label="Annonces totales" value={ads.length} />
            </div>

            {ads.length > 0 && (() => {
              const byCat: Record<string, number> = {};
              ads.forEach((a) => { const c = a.category || "Autre"; byCat[c] = (byCat[c] || 0) + 1; });
              const entries = Object.entries(byCat).sort((x, y) => y[1] - x[1]).slice(0, 6);
              const cols = ["bg-g1", "bg-g3", "bg-g4", "bg-g5", "bg-g7", "bg-g8"];
              return (
                <div className="mb-6 rounded-[18px] border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5">
                  <h3 className="mb-3 font-display text-[1rem] font-bold dark:text-white">Mes catégories</h3>
                  <div className="flex flex-col gap-2.5">
                    {entries.map(([c, n], i) => (
                      <div key={c} className="flex items-center gap-2 text-[.8rem]">
                        <span className="w-28 truncate text-gray-600 dark:text-white/70">{c}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-dark-700"><div className={`h-full rounded ${cols[i % 6]}`} style={{ width: `${n / ads.length * 100}%` }} /></div>
                        <span className="w-6 text-right font-bold dark:text-white">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="mb-6 flex flex-col gap-2">
              <Alert color="green">💡 Astuce : Les annonces avec de belles photos se vendent 3x plus vite ! — <Link href="/publier" className="font-semibold text-green">Publier maintenant</Link></Alert>
            </div>

            {loadingAds ? (
              <div className="py-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green"></div>
              </div>
            ) : ads.length === 0 ? (
              <EmptyState
                title="Vous n'avez pas encore d'annonce"
                description="Commencez à vendre vos produits à des millions d'acheteurs en publiant votre première annonce."
                ctaLabel="Publier une annonce"
                ctaHref="/publier"
                emoji="📢"
              />
            ) : (
              <div className="mt-4">
                <h3 className="mb-3 font-display text-[1.1rem] font-bold dark:text-white">Dernières annonces publiées</h3>
                <div className="rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-4">
                  {ads.slice(0, 3).map((a) => (
                    <div key={a.id} className="relative flex items-center gap-3 border-b border-gray-100 dark:border-dark-border py-4 last:border-0">
                      <Link href={`/annonce/${a.id}/${a.slug}`} className="shrink-0 flex items-center gap-3">
                        <img src={a.image || "https://placehold.co/150x150?text=Sans+Image"} alt="" className="h-16 w-16 rounded-lg object-cover hover:opacity-80 transition" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/annonce/${a.id}/${a.slug}`} className="truncate block text-[.9rem] sm:text-[1rem] font-bold dark:text-white hover:text-green">
                          {a.title}
                        </Link>
                        <div className="text-[.85rem] font-bold text-green mt-1">{a.price}</div>
                        <div className="text-[.75rem] text-gray-500 dark:text-white/50 mt-1 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${a.status === 'inactive' ? 'bg-gray-400' : a.status === 'sold' ? 'bg-brand-red' : 'bg-green'}`}></span>
                          {a.status === 'inactive' ? 'Inactif' : a.status === 'sold' ? 'Vendu' : 'Actif'} · {a.views || 0} vues
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 relative">
                        <Link href={`/paiement?annonce_id=${a.id}`} className="btn btn-gold btn-sm h-7 text-[.7rem] px-2 whitespace-nowrap hidden sm:inline-flex">
                          ⭐ Booster
                        </Link>
                        <button
                          onClick={(e) => { e.preventDefault(); setOpenMenuId(openMenuId === a.id ? null : a.id); }}
                          className="dots-btn p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-dark-900 rounded-full transition"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === a.id && (
                          <div className="absolute right-0 top-10 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-gray-100 dark:border-dark-border py-2 z-50 animate-fadeUp">
                            <Link href={`/publier?edit=${a.id}`} className="block w-full text-left px-4 py-2 text-[.85rem] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">✏️ Modifier</Link>
                            <button onClick={() => toggleActive(a.id)} className="block w-full text-left px-4 py-2 text-[.85rem] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">
                              {a.status === 'inactive' ? '▶️ Activer l\'annonce' : '⏸️ Désactiver l\'annonce'}
                            </button>
                            <button onClick={() => toggleSold(a.id)} className="block w-full text-left px-4 py-2 text-[.85rem] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">
                              {a.status === 'sold' ? '📦 Remettre en vente' : '✅ Marquer comme vendu'}
                            </button>
                            <Link href={`/paiement?annonce_id=${a.id}`} className="block w-full text-left px-4 py-2 text-[.85rem] text-gold font-bold hover:bg-gray-50 dark:hover:bg-dark-700 sm:hidden">⭐ Booster</Link>
                            <div className="my-1 border-t border-gray-100 dark:border-dark-border"></div>
                            <button onClick={() => { setAdToDelete(a.id); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-[.85rem] text-brand-red font-bold hover:bg-red-50 dark:hover:bg-red-900/10">🗑️ Supprimer</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {panel === "stats" && (
          <div className="animate-fadeUp max-w-[1000px] mx-auto">
            <h1 className="font-display text-[1.3rem] font-extrabold dark:text-white">📈 Statistiques</h1>
            <p className="mb-6 text-[.85rem] text-gray-500 dark:text-white/60">Performances de vos annonces (données réelles)</p>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiGrad gradient="bg-g1" icon="👁️" label="Vues totales" value={ads.reduce((a, d) => a + (d.views || 0), 0)} />
              <KpiGrad gradient="bg-g3" icon="📦" label="Annonces actives" value={ads.filter(a => a.status === 'active' || !a.status).length} />
              <KpiGrad gradient="bg-g5" icon="❤️" label="Favoris reçus" value={receivedFavsCount} />
              <KpiGrad gradient="bg-g8" icon="📊" label="Vues / annonce" value={ads.length ? Math.round(ads.reduce((a, d) => a + (d.views || 0), 0) / ads.length) : 0} />
            </div>

            {ads.length === 0 ? (
              <EmptyState title="Pas encore de données" description="Publiez des annonces pour voir vos statistiques apparaître ici." ctaLabel="Publier une annonce" ctaHref="/publier" emoji="📈" />
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                {/* Vues par annonce (barres) */}
                <div className="rounded-[18px] border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5">
                  <h3 className="mb-4 font-display text-[1rem] font-bold dark:text-white">Vues par annonce</h3>
                  <div className="flex items-end gap-2 h-[180px]">
                    {[...ads].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8).map((a, i) => {
                      const max = Math.max(...ads.map(x => x.views || 0), 1);
                      const grads = ['bg-g1', 'bg-g3', 'bg-g4', 'bg-g5'];
                      return (
                        <div key={a.id} className="flex-1 flex flex-col items-center gap-1 group">
                          <div className="text-[.6rem] font-bold text-gray-400">{a.views || 0}</div>
                          <div className={`w-full max-w-[34px] rounded-t-md ${grads[i % 4]} transition-all`} style={{ height: `${Math.max(4, (a.views || 0) / max * 140)}px` }} title={a.title}></div>
                          <div className="text-[.55rem] text-gray-400 truncate w-full text-center">{(a.title || '').slice(0, 6)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top annonces */}
                <div className="rounded-[18px] border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5">
                  <h3 className="mb-4 font-display text-[1rem] font-bold dark:text-white">Top annonces</h3>
                  <div className="flex flex-col gap-2">
                    {[...ads].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((a, i) => (
                      <Link key={a.id} href={`/annonce/${a.id}/${a.slug}`} className="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-dark-border last:border-0 hover:opacity-80">
                        <span className="w-5 font-extrabold text-green">{i + 1}</span>
                        <span className="flex-1 truncate text-[.82rem] font-semibold dark:text-white">{a.title}</span>
                        <span className="text-[.78rem] font-bold text-green">{(a.views || 0).toLocaleString('fr-FR')}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {panel === "reviews" && (
          <div className="animate-fadeUp max-w-[1000px] mx-auto">
            <h1 className="font-display text-[1.3rem] font-extrabold dark:text-white">⭐ Avis reçus</h1>
            <p className="mb-6 text-[.85rem] text-gray-500 dark:text-white/60">{reviews.length} avis · Note {reviews.length ? (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—'}/5</p>

            {reviews.length === 0 ? (
              <EmptyState title="Aucun avis pour l'instant" description="Vos acheteurs pourront laisser un avis après une transaction. Ils apparaîtront ici." emoji="⭐" />
            ) : (
              <>
                <div className="mb-5 rounded-[18px] border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5">
                  <div className="flex items-center gap-5 flex-wrap">
                    <div className="text-center">
                      <div className="font-display text-[2.6rem] font-extrabold text-green leading-none">{(reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1)}</div>
                      <div className="text-[1.1rem]">{'⭐'.repeat(Math.round(reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length))}</div>
                      <div className="text-[.75rem] text-gray-500 mt-1">{reviews.length} avis</div>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      {[5, 4, 3, 2, 1].map(n => {
                        const c = reviews.filter(r => Math.round(r.rating) === n).length;
                        const pct = reviews.length ? c / reviews.length * 100 : 0;
                        return (
                          <div key={n} className="flex items-center gap-2 mb-1 text-[.78rem]">
                            <span className="w-3 font-bold dark:text-white">{n}</span>
                            <div className="flex-1 h-[7px] rounded bg-gray-100 dark:bg-dark-700 overflow-hidden"><div className="h-full bg-amber" style={{ width: `${pct}%`, background: 'var(--amber)' }}></div></div>
                            <span className="w-6 text-gray-500">{c}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="rounded-[18px] border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5">
                  {reviews.map((r, i) => (
                    <div key={i} className="flex gap-3 py-3 border-b border-gray-100 dark:border-dark-border last:border-0">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-g5 flex items-center justify-center text-white font-bold">A</div>
                      <div className="flex-1">
                        <div className="text-[.75rem] text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : ''} · {'⭐'.repeat(Math.round(r.rating || 0))}</div>
                        <div className="text-[.85rem] dark:text-white mt-1">{r.comment || '(sans commentaire)'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {panel === "ads" && (
          <div className="animate-fadeUp max-w-[1000px] mx-auto">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-[1.4rem] font-extrabold dark:text-white">Gérer mes annonces</h2>
              <Link href="/publier" className="btn btn-green btn-sm">+ Nouveau</Link>
            </div>

            {/* TABS */}
            <div className="flex overflow-x-auto border-b border-gray-200 dark:border-dark-border mb-6 no-scrollbar">
              {[
                { id: "brouillons", label: "Brouillons" },
                { id: "en_attente", label: "En attente de validation" },
                { id: "en_ligne", label: "En ligne" },
                { id: "expirees", label: "Expirée(s)" },
                { id: "hors_ligne", label: "Hors ligne" },
                { id: "rejetees", label: "Rejetée(s)" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAdTab(tab.id)}
                  className={`px-4 py-2.5 text-[.85rem] font-bold whitespace-nowrap border-b-2 transition-colors ${adTab === tab.id ? "border-green text-gray-900 dark:text-white" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SEARCH AND FILTERS */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-dark-800 p-4 rounded-lg border border-gray-100 dark:border-dark-border">
              <div className="flex-1 w-full relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Recherche rapide..."
                  className="input !pl-9 w-full sm:max-w-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="flex items-center gap-2 text-[.85rem] font-semibold text-gray-600 dark:text-gray-300">
                ⚙ Filtrer
              </button>
            </div>

            {loadingAds ? (
              <div className="py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green"></div>
              </div>
            ) : filteredAds.length === 0 ? (
              <div className="bg-gray-100/50 dark:bg-dark-800/50 rounded-xl p-10 text-center border border-gray-100 dark:border-dark-border">
                <h3 className="font-display text-lg font-bold mb-2 dark:text-white">Vous n'avez pas d'annonces dans cette catégorie</h3>
                <p className="text-[.9rem] text-gray-500 mb-6 max-w-md mx-auto">Veuillez créer une annonce pour tout ce que vous souhaitez vendre sur la plateforme.</p>
                <Link href="/publier" className="btn btn-green">Poster une annonce</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredAds.map((ad) => (
                  <div key={ad.id} className="relative group flex items-start gap-4 rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-3 sm:p-4">
                    <Link href={`/annonce/${ad.id}/${ad.slug}`} className="shrink-0">
                      <img src={ad.image || "https://placehold.co/150x150?text=Sans+Image"} alt="" className="h-20 w-20 sm:h-24 sm:w-24 rounded-md object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <Link href={`/annonce/${ad.id}/${ad.slug}`} className="truncate block text-[1rem] font-bold dark:text-white hover:text-green max-w-full">
                          {ad.title}
                        </Link>
                        <div className="text-[.9rem] font-bold text-green dark:text-neon-green shrink-0">{ad.price}</div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[.75rem] text-gray-500 dark:text-white/50">
                        {ad.category} · {ad.views || 0} vues ·
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[.65rem] font-bold uppercase ${ad.status === 'inactive' ? 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-300' : ad.status === 'sold' ? 'bg-red-50 text-brand-red dark:bg-red-900/20' : 'bg-green/10 text-green'}`}>
                          {ad.status === 'inactive' ? '⏸️ Inactif' : ad.status === 'sold' ? '📦 Vendu' : '✓ Actif'}
                        </span>
                      </div>

                      {/* Mobile stats text */}
                      <div className="mt-2 text-[.75rem] text-gray-400 sm:hidden">
                        Créée le {new Date(ad.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>

                    {/* 3-dots Menu Button */}
                    <div className="flex items-center gap-2 shrink-0 relative ml-auto">
                      <Link href={`/paiement?annonce_id=${ad.id}`} className="btn btn-gold btn-sm h-7 text-[.7rem] px-2 whitespace-nowrap hidden sm:inline-flex">
                        ⭐ Booster
                      </Link>
                      <button
                        onClick={(e) => { e.preventDefault(); setOpenMenuId(openMenuId === ad.id ? null : ad.id); }}
                        className="dots-btn p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-dark-900 rounded-full transition"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === ad.id && (
                        <div className="absolute right-0 top-10 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-gray-100 dark:border-dark-border py-2 z-50 animate-fadeUp">
                          <Link href={`/publier?edit=${ad.id}`} className="block w-full text-left px-4 py-2 text-[.85rem] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">✏️ Modifier</Link>
                          <button onClick={() => toggleActive(ad.id)} className="block w-full text-left px-4 py-2 text-[.85rem] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">
                            {ad.status === 'inactive' ? '▶️ Activer l\'annonce' : '⏸️ Désactiver l\'annonce'}
                          </button>
                          <button onClick={() => toggleSold(ad.id)} className="block w-full text-left px-4 py-2 text-[.85rem] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">
                            {ad.status === 'sold' ? '📦 Remettre en vente' : '✅ Marquer comme vendu'}
                          </button>
                          <Link href={`/paiement?annonce_id=${ad.id}`} className="block w-full text-left px-4 py-2 text-[.85rem] text-gold font-bold hover:bg-gray-50 dark:hover:bg-dark-700 sm:hidden">⭐ Booster</Link>
                          <div className="my-1 border-t border-gray-100 dark:border-dark-border"></div>
                          <button onClick={() => { setAdToDelete(ad.id); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-[.85rem] text-brand-red font-bold hover:bg-red-50 dark:hover:bg-red-900/10">🗑️ Supprimer</button>
                        </div>
                      )}
                    </div>

                    {ad.status === 'sold' && (
                      <div className="absolute inset-0 bg-white/60 dark:bg-black/60 z-[5] flex items-center justify-center backdrop-blur-[1px] pointer-events-none rounded-[10px]">
                        <span className="bg-brand-red text-white font-bold px-3 py-1 rounded-lg rotate-[-12deg] text-sm border-2 border-white shadow-md">VENDU</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {panel === "favorites" && (
          <div className="animate-fadeUp max-w-[1000px] mx-auto">
            <h2 className="mb-1 font-display text-[1.2rem] sm:text-[1.4rem] font-extrabold dark:text-white">❤️ Mes favoris</h2>
            <p className="mb-6 text-[.85rem] text-gray-500 dark:text-white/60">{favListings.length} annonce(s) sauvegardée(s)</p>
            {loadingFavs ? (
              <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green"></div></div>
            ) : favListings.length === 0 ? (
              <EmptyState
                title="Aucun favori"
                description="Cliquez sur le cœur d'une annonce pour la sauvegarder ici."
                ctaLabel="Explorer les annonces"
                ctaHref="/recherche"
                emoji="❤️"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {favListings.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>
            )}
          </div>
        )}



        {panel === "profile" && (
          <div className="animate-fadeUp max-w-[800px] mx-auto">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold dark:text-white">Mon profil</h2>
            <div className="rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-6">
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100 dark:border-dark-border">
                <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full border border-gray-200 dark:border-dark-border object-cover" />
                <div>
                  <label className="btn btn-outline btn-sm mb-2 cursor-pointer inline-block">
                    Changer la photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCropModalZone("avatar");
                        setCropModalImage(URL.createObjectURL(e.target.files[0]));
                      }
                    }} />
                  </label>
                  <p className="text-[.75rem] text-gray-500">JPG, PNG ou GIF. Max 2Mo.</p>
                </div>
              </div>

              <div className="grid gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Nom de la boutique / Entreprise</label>
                    <input
                      className="input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Numéro de téléphone</label>
                    <input
                      className="input"
                      placeholder="+221 77 000 00 00"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Description de la boutique</label>
                  <textarea
                    className="input resize-y"
                    rows={3}
                    placeholder="Que propose votre boutique ?"
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Langue de communication</label>
                  <select
                    className="input max-w-[200px]"
                    value={profileLanguage}
                    onChange={(e) => setProfileLanguage(e.target.value)}
                  >
                    <option value="Français">Français</option>
                    <option value="Anglais">Anglais</option>
                    <option value="Wolof">Wolof</option>
                  </select>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!user) return;
                  const { error } = await supabase.from('profiles').update({
                    full_name: profileName,
                    bio: profileBio,
                    phone: profilePhone
                  }).eq('id', user.id);
                  if (error) {
                    show("❌ Erreur : " + error.message);
                  } else {
                    show("✓ Profil sauvegardé avec succès !");
                    setProfile((prev: any) => prev ? { ...prev, full_name: profileName, bio: profileBio, phone: profilePhone } : { full_name: profileName, bio: profileBio, phone: profilePhone });
                  }
                }}
                className="btn btn-green mt-6"
              >
                Sauvegarder les modifications
              </button>
            </div>
          </div>
        )}

        {panel === "security" && (
          <div className="animate-fadeUp max-w-[800px] mx-auto">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold dark:text-white">Sécurité & Confidentialité</h2>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5 flex justify-between items-center">
                <div>
                  <h3 className="mb-1 font-display text-[.95rem] font-bold dark:text-white">Contact vérifié ✅</h3>
                  <p className="text-[.83rem] text-gray-500 dark:text-white/60">{displayEmail}</p>
                </div>
                <button onClick={() => show("La modification de l'email n'est pas encore disponible.")} className="btn btn-outline btn-sm">Modifier</button>
              </div>

              <div className="rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5 flex justify-between items-center">
                <div>
                  <h3 className="mb-1 font-display text-[.95rem] font-bold dark:text-white">Mot de passe</h3>
                  <p className="text-[.83rem] text-gray-500 dark:text-white/60">Sécurisez votre compte avec un mot de passe fort.</p>
                </div>
                <button onClick={async () => {
                  if (user?.email) {
                    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                      redirectTo: window.location.origin + '/dashboard',
                    });
                    if (error) {
                      show("Erreur : " + error.message);
                    } else {
                      show("✓ Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.");
                    }
                  }
                }} className="btn btn-outline btn-sm">Changer</button>
              </div>

              <div className="rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5 flex justify-between items-center">
                <div>
                  <h3 className="mb-1 font-display text-[.95rem] font-bold dark:text-white">Sessions actives</h3>
                  <p className="text-[.83rem] text-gray-500 dark:text-white/60">1 appareil connecté actuellement.</p>
                </div>
                <button onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/connexion';
                }} className="btn btn-outline btn-sm">Déconnexion</button>
              </div>

              <div className="rounded-lg border-[1.5px] border-[#fee2e2] dark:border-brand-red/30 bg-white dark:bg-[#fee2e2]/5 p-5 mt-4">
                <h3 className="mb-1 font-display text-[.95rem] font-bold text-brand-red">Zone dangereuse</h3>
                <p className="mb-4 text-[.83rem] text-gray-500 dark:text-white/60">La suppression de votre compte est irréversible et supprimera toutes vos annonces.</p>
                <button onClick={() => setShowDeleteModal(true)} className="btn btn-sm bg-[#fee2e2] dark:bg-brand-red/20 !text-brand-red">Supprimer le compte</button>
              </div>
            </div>
          </div>
        )}

        {panel === "campaigns" && (
          <div className="animate-fadeUp max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-[1.6rem] font-extrabold dark:text-white">Marketing & Publicité</h2>
            </div>

            {/* Tabs for Marketing vs Banner Ads */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-dark-border mb-8 overflow-x-auto">
              <button
                onClick={() => setMarketingTab("whatsapp")}
                className={`px-4 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition ${marketingTab === "whatsapp" ? 'border-green text-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                📱 Marketing WhatsApp
              </button>
              <button
                onClick={() => setMarketingTab("banners")}
                className={`px-4 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition ${marketingTab === "banners" ? 'border-green text-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                🖼️ Bannières Publicitaires
              </button>
            </div>

            {marketingTab === "whatsapp" ? (
              <MarketingPanel ads={ads} user={user} />
            ) : (
              <div className="max-w-[900px] mx-auto">
                <p className="text-gray-500 dark:text-white/70 mb-8 text-[.95rem]">
                  Ne vous contentez plus d'un seul emplacement. En réservant votre espace publicitaire, **votre bannière s'affichera partout** sur la plateforme (Accueil, Catalogue, Pages Produits).
                  <br /><span className="text-gold font-bold">⚠️ Limité à 2 annonceurs par semaine en diaporama.</span>
                </p>

                <div className="bg-white dark:bg-dark-800 rounded-[2rem] shadow-xl border border-gray-100 dark:border-dark-border overflow-hidden">

                  {!activeCampaign ? (
                    <>
                      {/* ETAPE 1: VISUEL SUBLIME */}
                      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] p-8 md:p-10 text-white relative">
                        <div className="absolute top-0 right-0 p-6 opacity-20 text-[4rem] pointer-events-none">✨</div>
                        <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-gold text-dark-900 flex items-center justify-center text-sm">1</span>
                          Où s'affichera votre annonce ?
                        </h3>

                        <div className="grid md:grid-cols-3 gap-4">
                          {/* Mockup 1 */}
                          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
                            <div className="w-full h-12 bg-gradient-to-r from-gold/50 to-gold rounded-lg mb-3 flex items-center justify-center">
                              <span className="text-[.65rem] font-bold uppercase tracking-widest text-black">Bannière Hero</span>
                            </div>
                            <div className="font-bold text-sm">En haut de l'Accueil</div>
                            <div className="text-[.7rem] text-white/70 mt-1">La première chose vue.</div>
                          </div>
                          {/* Mockup 2 */}
                          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
                            <div className="grid grid-cols-2 gap-2 mb-3 h-12">
                              <div className="bg-white/20 rounded-md"></div>
                              <div className="bg-white/20 rounded-md"></div>
                            </div>
                            <div className="w-full h-6 bg-gradient-to-r from-gold/50 to-gold rounded-md mb-2"></div>
                            <div className="font-bold text-sm">Au coeur du Catalogue</div>
                            <div className="text-[.7rem] text-white/70 mt-1">Au milieu des résultats (In-Grid).</div>
                          </div>
                          {/* Mockup 3 */}
                          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
                            <div className="w-full h-12 bg-white/20 rounded-lg mb-3 flex flex-col justify-end p-1">
                              <div className="w-full h-4 bg-gradient-to-r from-gold/50 to-gold rounded-sm"></div>
                            </div>
                            <div className="font-bold text-sm">Pages Produits</div>
                            <div className="text-[.7rem] text-white/70 mt-1">Juste avant les avis clients.</div>
                          </div>
                        </div>

                        <div className="mt-6 text-[.85rem] text-white/80 border-t border-white/10 pt-4 text-center">
                          <span className="text-gold font-bold">Quatre visuels nécessaires</span> : Vous devrez fournir un fichier distinct et optimisé pour chacune de ces zones.
                        </div>
                      </div>

                      <div className="p-8 md:p-10">
                        {/* ETAPE 2: UPLOAD & DUREE */}
                        <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2 dark:text-white">
                          <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-900 text-gray-900 dark:text-white flex items-center justify-center text-sm">2</span>
                          Votre Fichier & Durée
                        </h3>

                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                          {/* Upload Zones (4 Zones) */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Hero */}
                            <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">1️⃣ Accueil (Haut)</label>
                              <label className="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl h-24 flex flex-col items-center justify-center text-center cursor-pointer hover:border-green hover:bg-green/5 transition relative group overflow-hidden">
                                <input
                                  type="file" accept="image/*,video/mp4" className="hidden"
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const f = e.target.files[0];
                                      if (f.type.startsWith('video/')) {
                                        setTypeHero(f.type);
                                        setFileHero(await fileToBase64(f));
                                      } else {
                                        setTypeHero(f.type);
                                        setCropModalZone("hero");
                                        setCropModalImage(URL.createObjectURL(f));
                                      }
                                    }
                                  }}
                                />
                                {fileHero ? (
                                  typeHero?.startsWith('video/') ? <video src={fileHero} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={fileHero} className="w-full h-full object-cover" alt="Hero" />
                                ) : (
                                  <>
                                    <div className="font-bold text-[.75rem]">Upload Hero</div>
                                    <div className="text-[.6rem] text-gray-500">1200x300px</div>
                                  </>
                                )}
                              </label>
                            </div>

                            {/* Footer */}
                            <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">2️⃣ Accueil (Bas)</label>
                              <label className="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl h-24 flex flex-col items-center justify-center text-center cursor-pointer hover:border-green hover:bg-green/5 transition relative group overflow-hidden">
                                <input
                                  type="file" accept="image/*,video/mp4" className="hidden"
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const f = e.target.files[0];
                                      if (f.type.startsWith('video/')) {
                                        setTypeFooter(f.type);
                                        setFileFooter(await fileToBase64(f));
                                      } else {
                                        setTypeFooter(f.type);
                                        setCropModalZone("footer");
                                        setCropModalImage(URL.createObjectURL(f));
                                      }
                                    }
                                  }}
                                />
                                {fileFooter ? (
                                  typeFooter?.startsWith('video/') ? <video src={fileFooter} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={fileFooter} className="w-full h-full object-cover" alt="Footer" />
                                ) : (
                                  <>
                                    <div className="font-bold text-[.75rem]">Upload Footer</div>
                                    <div className="text-[.6rem] text-gray-500">1200x300px</div>
                                  </>
                                )}
                              </label>
                            </div>

                            {/* Catalogue */}
                            <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">3️⃣ Catalogue</label>
                              <label className="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl h-24 flex flex-col items-center justify-center text-center cursor-pointer hover:border-green hover:bg-green/5 transition relative group overflow-hidden">
                                <input
                                  type="file" accept="image/*,video/mp4" className="hidden"
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const f = e.target.files[0];
                                      if (f.type.startsWith('video/')) {
                                        setTypeCatalogue(f.type);
                                        setFileCatalogue(await fileToBase64(f));
                                      } else {
                                        setTypeCatalogue(f.type);
                                        setCropModalZone("catalogue");
                                        setCropModalImage(URL.createObjectURL(f));
                                      }
                                    }
                                  }}
                                />
                                {fileCatalogue ? (
                                  typeCatalogue?.startsWith('video/') ? <video src={fileCatalogue} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={fileCatalogue} className="w-full h-full object-cover" alt="Catalogue" />
                                ) : (
                                  <>
                                    <div className="font-bold text-[.75rem]">Upload Catalogue</div>
                                    <div className="text-[.6rem] text-gray-500">800x200px</div>
                                  </>
                                )}
                              </label>
                            </div>

                            {/* Product */}
                            <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">4️⃣ Page Produit</label>
                              <label className="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl h-24 flex flex-col items-center justify-center text-center cursor-pointer hover:border-green hover:bg-green/5 transition relative group overflow-hidden">
                                <input
                                  type="file" accept="image/*,video/mp4" className="hidden"
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const f = e.target.files[0];
                                      if (f.type.startsWith('video/')) {
                                        setTypeProduct(f.type);
                                        setFileProduct(await fileToBase64(f));
                                      } else {
                                        setTypeProduct(f.type);
                                        setCropModalZone("product");
                                        setCropModalImage(URL.createObjectURL(f));
                                      }
                                    }
                                  }}
                                />
                                {fileProduct ? (
                                  typeProduct?.startsWith('video/') ? <video src={fileProduct} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={fileProduct} className="w-full h-full object-cover" alt="Product" />
                                ) : (
                                  <>
                                    <div className="font-bold text-[.75rem]">Upload Produit</div>
                                    <div className="text-[.6rem] text-gray-500">800x200px</div>
                                  </>
                                )}
                              </label>
                            </div>
                          </div>

                          {/* Duration and Date selector */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">Durée & Réductions</label>
                              <div className="grid grid-cols-2 gap-2">
                                {[1, 2, 3, 4].map((weeks) => (
                                  <button
                                    key={weeks}
                                    onClick={() => setCampaignWeeks(weeks)}
                                    className={`rounded-lg font-bold border transition text-sm flex items-center justify-center py-2.5 ${campaignWeeks === weeks ? 'bg-green border-green text-white shadow-md' : 'bg-gray-50 dark:bg-dark-900 border-gray-200 dark:border-dark-border text-gray-700 dark:text-white hover:border-green'}`}
                                  >
                                    {weeks} sem.
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mt-6 mb-6">
                              <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                Lien de redirection (Optionnel)
                              </label>
                              <select
                                value={campaignUrlType}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCampaignUrlType(val);
                                  if (val === "boutique") {
                                    setCampaignUrl(user ? `/boutique/${user.id}` : "/");
                                  } else if (val.startsWith("/annonce")) {
                                    setCampaignUrl(val);
                                  } else {
                                    setCampaignUrl("");
                                  }
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-900 text-gray-700 dark:text-white focus:outline-none focus:border-green appearance-none mb-3"
                              >
                                <option value="custom">-- Choisir un lien de redirection --</option>
                                <option value="boutique">🏪 Ma Boutique Complète</option>
                                {ads.length > 0 && (
                                  <optgroup label="📦 Mes Produits">
                                    {ads.map(ad => (
                                      <option key={ad.id} value={`/annonce/${ad.id}/${ad.slug}`}>
                                        {ad.title.length > 40 ? ad.title.substring(0, 40) + '...' : ad.title}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                <option value="custom">🔗 Lien externe personnalisé</option>
                              </select>

                              {campaignUrlType === "custom" && (
                                <input
                                  type="url"
                                  placeholder="Ex: https://wa.me/... ou https://maboutique.com"
                                  value={campaignUrl}
                                  onChange={(e) => setCampaignUrl(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-900 text-gray-700 dark:text-white focus:outline-none focus:border-green"
                                />
                              )}
                              <p className="text-[.75rem] text-gray-500 mt-1">
                                Les utilisateurs qui cliquent sur vos bannières seront redirigés vers ce lien.
                              </p>
                            </div>

                            <div className="flex gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">Début</label>
                                <select
                                  value={campaignStartDate}
                                  onChange={(e) => setCampaignStartDate(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-900 text-gray-700 dark:text-white focus:outline-none focus:border-green appearance-none"
                                >
                                  {availableWeeks.map((date, i) => {
                                    // Simuler la 2ème semaine comme indisponible si on veut tester l'indisponibilité
                                    const isOccupied = purchases.some(p => p.startDate === date.toISOString().split('T')[0]);
                                    return (
                                      <option key={i} value={date.toISOString().split('T')[0]} disabled={isOccupied}>
                                        {date.toLocaleDateString('fr-FR')} {isOccupied ? "(Occupé)" : "(Disponible)"}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              <div className="flex-1 opacity-70">
                                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">Fin estimée</label>
                                <input
                                  type="text"
                                  disabled
                                  value={
                                    campaignStartDate ?
                                      new Date(new Date(campaignStartDate).getTime() + campaignWeeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')
                                      : ''
                                  }
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-white cursor-not-allowed"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <hr className="border-gray-100 dark:border-dark-border mb-8" />

                        {/* ETAPE 3: PAIEMENT */}
                        <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2 dark:text-white">
                          <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-900 text-gray-900 dark:text-white flex items-center justify-center text-sm">3</span>
                          Validation & Paiement
                        </h3>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-dark-900 rounded-xl p-6 border border-gray-100 dark:border-dark-border">
                          <div>
                            <div className="text-gray-500 text-sm mb-1">Montant total pour {campaignWeeks} semaine{campaignWeeks > 1 ? 's' : ''}</div>
                            <div className="font-display font-extrabold text-[2rem] text-gray-900 dark:text-white leading-none">
                              {getCampaignPrice(campaignWeeks).toLocaleString('fr-FR')} <span className="text-xl text-gray-400 font-normal">FCFA</span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (!fileHero && !fileFooter && !fileCatalogue && !fileProduct) {
                                show("⚠️ Veuillez uploader au moins un visuel avant de payer.");
                                return;
                              }

                              if (isKonnecta) {
                                const newCampaign = {
                                  hero: fileHero,
                                  footer: fileFooter,
                                  catalogue: fileCatalogue,
                                  product: fileProduct,
                                  url: campaignUrl,
                                  weeks: campaignWeeks,
                                  start_date: campaignStartDate,
                                  status: 'active'
                                };

                                let data, error;

                                if (editingCampaignId) {
                                  const res = await supabase.from('campagnes_pub').update(newCampaign).eq('id', editingCampaignId).select();
                                  data = res.data;
                                  error = res.error;
                                  setEditingCampaignId(null);
                                  show("✅ Campagne mise à jour avec succès !");
                                } else {
                                  const res = await supabase.from('campagnes_pub').insert([newCampaign]).select();
                                  data = res.data;
                                  error = res.error;

                                  const newPurchase = {
                                    id: `PUB-${Date.now()}`,
                                    date: new Date().toISOString(),
                                    type: 'Campagne Publicitaire',
                                    amount: getCampaignPrice(campaignWeeks),
                                    status: 'Complété'
                                  };

                                  const allPurchases = [newPurchase, ...purchases];
                                  localStorage.setItem('annonceid_purchases', JSON.stringify(allPurchases));
                                  setPurchases(allPurchases);
                                  show("🎉 Nouvelle campagne activée (Privilège Super Admin).");
                                }

                                if (data && data.length > 0) {
                                  setActiveCampaign({
                                    hero: data[0].hero,
                                    footer: data[0].footer,
                                    catalogue: data[0].catalogue,
                                    product: data[0].product,
                                    url: data[0].url,
                                    weeks: data[0].weeks,
                                    startDate: data[0].start_date,
                                    status: data[0].status,
                                    id: data[0].id
                                  });
                                }

                                show("🎉 Campagne validée et sauvegardée en base (Privilège Super Admin).");
                                setFileHero(null);
                                setFileFooter(null);
                                setFileCatalogue(null);
                                setFileProduct(null);
                                setCampaignWeeks(1);
                                setTimeout(() => handlePanelChange("campaigns"), 1500);
                                return;
                              }

                              show("Redirection vers PayTech...");
                              try {
                                const res = await fetch("/api/cinetpay", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    amount: getCampaignPrice(campaignWeeks),
                                    itemName: `Campagne Publicitaire ${campaignWeeks} semaine(s)`,
                                    refCommand: `PUB-${Date.now()}`
                                  })
                                });
                                const data = await res.json();
                                if (data.redirect_url) {
                                  window.location.href = data.redirect_url;
                                } else {
                                  show(`❌ ${data.error || "Erreur lors de l'initialisation du paiement."}`);
                                }
                              } catch (error) {
                                show("Erreur de connexion avec PayTech.");
                              }
                            }}
                            className="btn btn-green w-full md:w-auto px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                          >
                            Payer avec PayTech
                          </button>
                        </div>

                        <p className="text-center text-[.75rem] text-gray-400 mt-4">
                          Votre campagne sera soumise à validation et débutera immédiatement après acceptation.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 md:p-10 text-center animate-fadeUp">
                      <div className="text-4xl mb-4">🚀</div>
                      <h3 className="font-display font-bold text-2xl mb-2 text-green">Campagne Active !</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-8">Votre bannière est actuellement diffusée sur la plateforme.</p>

                      <div className="grid md:grid-cols-2 gap-6 text-left mb-6">
                        <div className="bg-gray-50 dark:bg-dark-900 p-4 rounded-xl border border-gray-200 dark:border-dark-border">
                          <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Accueil (Haut)</div>
                          {activeCampaign.hero?.startsWith('data:video') ? <video src={activeCampaign.hero} autoPlay loop muted playsInline className="w-full h-24 object-cover rounded-lg" /> : <img src={activeCampaign.hero} className="w-full h-24 object-cover rounded-lg" />}
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-900 p-4 rounded-xl border border-gray-200 dark:border-dark-border">
                          <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Accueil (Bas)</div>
                          {activeCampaign.footer?.startsWith('data:video') ? <video src={activeCampaign.footer} autoPlay loop muted playsInline className="w-full h-24 object-cover rounded-lg" /> : <img src={activeCampaign.footer} className="w-full h-24 object-cover rounded-lg" />}
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-900 p-4 rounded-xl border border-gray-200 dark:border-dark-border">
                          <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Catalogue</div>
                          {activeCampaign.catalogue?.startsWith('data:video') ? <video src={activeCampaign.catalogue} autoPlay loop muted playsInline className="w-full h-24 object-cover rounded-lg" /> : <img src={activeCampaign.catalogue} className="w-full h-24 object-cover rounded-lg" />}
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-900 p-4 rounded-xl border border-gray-200 dark:border-dark-border">
                          <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Page Produit</div>
                          {activeCampaign.product?.startsWith('data:video') ? <video src={activeCampaign.product} autoPlay loop muted playsInline className="w-full h-24 object-cover rounded-lg" /> : <img src={activeCampaign.product} className="w-full h-24 object-cover rounded-lg" />}
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-gray-50 dark:bg-dark-900 p-4 rounded-xl border border-gray-200 dark:border-dark-border text-left">
                        <div>
                          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Date de début :</span>
                          <div className="font-bold dark:text-white">{new Date(activeCampaign.startDate).toLocaleDateString('fr-FR')}</div>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Durée :</span>
                          <div className="font-bold dark:text-white">{activeCampaign.weeks} semaine{activeCampaign.weeks > 1 ? 's' : ''}</div>
                        </div>
                      </div>

                      {isKonnecta && (
                        <div className="mt-8 flex flex-col items-center justify-center gap-4">
                          <button
                            onClick={() => {
                              setFileHero(activeCampaign.hero);
                              setFileFooter(activeCampaign.footer);
                              setFileCatalogue(activeCampaign.catalogue);
                              setFileProduct(activeCampaign.product);
                              setCampaignUrl(activeCampaign.url || "");
                              setCampaignUrlType("custom");
                              setCampaignWeeks(activeCampaign.weeks);
                              setEditingCampaignId(activeCampaign.id);
                              setActiveCampaign(null);
                            }}
                            className="btn btn-outline"
                          >
                            ✏️ Modifier la campagne
                          </button>
                          <button
                            onClick={async () => {
                              if (activeCampaign?.id) {
                                await supabase.from('campagnes_pub').update({ status: 'inactive' }).eq('id', activeCampaign.id);
                              }
                              setActiveCampaign(null);
                              show("Campagne arrêtée (Privilège Super Admin).");
                            }}
                            className="text-brand-red text-sm font-bold underline hover:text-red-700"
                          >
                            Arrêter la campagne
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {panel === "purchases" && (
          <div className="animate-fadeUp max-w-[800px] mx-auto">
            <h2 className="mb-6 font-display text-[1.4rem] font-extrabold dark:text-white">Historique de mes achats</h2>
            {purchases.length === 0 ? (
              <EmptyState
                title="Aucune transaction pour le moment"
                description="Vos achats de boosts et de campagnes apparaîtront ici."
                emoji="🧾"
                ctaLabel="Booster une annonce"
                ctaHref="/publier"
              />
            ) : (
              <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-border overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-dark-900 border-b border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 text-sm">
                      <th className="p-4 font-semibold">ID Commande</th>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Description</th>
                      <th className="p-4 font-semibold">Montant</th>
                      <th className="p-4 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-900 transition">
                        <td className="p-4 font-mono text-sm text-gray-600 dark:text-gray-300">{p.id}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                        <td className="p-4 text-sm font-semibold text-gray-900 dark:text-white">{p.type}</td>
                        <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">{p.amount.toLocaleString('fr-FR')} FCFA</td>
                        <td className="p-4">
                          <span className="bg-green/10 text-green px-2.5 py-1 rounded-full text-[.75rem] font-bold border border-green/20">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {panel === "showroom" && (
          <div className="animate-fadeUp w-full max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8">

            {/* Colonne Gauche : Editeur */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-[1.3rem] sm:text-[1.6rem] font-extrabold dark:text-white">Ma Boutique</h2>
                <div className="flex items-center gap-3">
                  <button onClick={() => setLivePreviewOpen(true)} className="lg:hidden flex items-center gap-2 bg-dark-900 text-white dark:bg-white dark:text-black font-bold px-4 py-2 rounded-xl text-sm shadow-sm">
                    👁️ Aperçu
                  </button>
                  <div className="flex items-center gap-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border px-4 py-2 rounded-xl shadow-sm">
                    <span className="text-sm font-semibold text-gray-500 hidden sm:inline">
                      {typeof window !== 'undefined' ? `${window.location.origin}/boutique/${user?.id || ''}` : `boutique/${user?.id || ''}`}
                    </span>
                    <span className="text-sm font-semibold text-gray-500 sm:hidden">Lien</span>
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined' && user?.id) {
                          navigator.clipboard.writeText(`${window.location.origin}/boutique/${user.id}`);
                          show("📋 Lien de la boutique copié !");
                        }
                      }}
                      className="text-gray-400 hover:text-green"
                      title="Copier le lien"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Image de couverture */}
              <div className="mb-6">
                <label className="relative block h-[140px] sm:h-[180px] w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-dark-border bg-gradient-to-br from-dark-900 to-green-900 cursor-pointer group">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCropModalZone("cover");
                      setCropModalImage(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                  {showroomCover && <img src={showroomCover} alt="couverture" className="absolute inset-0 h-full w-full object-cover" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                    <span className="rounded-full bg-white/90 px-4 py-2 text-[.8rem] font-bold text-gray-900">📷 {showroomCover ? "Changer la couverture" : "Ajouter une image de couverture"}</span>
                  </div>
                  {!showroomCover && <div className="absolute inset-0 flex items-center justify-center text-white/70 text-[.85rem] font-semibold">📷 Image de couverture de votre boutique</div>}
                </label>
              </div>

              {/* Profile Card Editor */}
              <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-800 p-6 shadow-sm mb-6 relative">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <label className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-border flex items-center justify-center text-2xl shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition group relative">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCropModalZone("avatar");
                        setCropModalImage(URL.createObjectURL(e.target.files[0]));
                      }
                    }} />
                    <img src={avatarUrl} alt="logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <span className="text-white text-[.6rem] font-bold">Modifier</span>
                    </div>
                  </label>
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start">
                      <div className="w-full">
                        <input
                          className="showroom-name-input font-bold text-lg bg-transparent border-b border-transparent hover:border-gray-300 dark:text-white focus:outline-none focus:border-green mb-1 w-full"
                          value={showroomName}
                          onChange={(e) => setShowroomName(e.target.value)}
                        />
                        <div className="text-sm text-gray-500">@{showroomName.toLowerCase().replace(/\s+/g, '')}</div>
                      </div>
                      <button className="text-gray-400 hover:text-green ml-2">✏️</button>
                    </div>

                    <textarea
                      className="showroom-bio-input w-full text-sm mt-3 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-dark-border focus:border-green focus:outline-none resize-none text-gray-600 dark:text-gray-300 p-2 rounded -ml-2"
                      rows={2}
                      value={showroomBio}
                      onChange={(e) => setShowroomBio(e.target.value)}
                    />

                    {/* Social links */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {['instagram', 'tiktok', 'youtube', 'whatsapp', 'facebook'].map(social => {
                        const hasLink = !!showroomSocials[social];
                        return (
                          <div key={social} className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingSocial(editingSocial === social ? null : social)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${hasLink ? 'bg-green/10 text-green font-bold' : 'bg-gray-100 dark:bg-dark-900 text-gray-400 hover:text-green hover:bg-green/10'}`}
                              title={hasLink ? `${social}: ${showroomSocials[social]}` : `Ajouter un lien ${social}`}
                            >
                              {social === 'whatsapp' ? '💬' : social === 'instagram' ? '📷' : social === 'facebook' ? 'f' : social === 'tiktok' ? '♪' : '▶'}
                            </button>
                            {editingSocial === social && (
                              <input
                                type="text"
                                placeholder={`Lien ${social}...`}
                                className="input py-1 px-2 text-xs w-32"
                                value={showroomSocials[social] || ""}
                                onChange={(e) => {
                                  setShowroomSocials({ ...showroomSocials, [social]: e.target.value });
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Save Button for Showroom */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={async () => {
                      if (!user) return;

                      const { error } = await supabase.from('profiles').update({
                        full_name: showroomName,
                        bio: showroomBio,
                        social_links: showroomSocials
                      }).eq('id', user.id);

                      if (error) {
                        show("❌ Erreur lors de la sauvegarde : " + error.message);
                      } else {
                        show("✓ Boutique sauvegardée avec succès !");
                        setProfile((prev: any) => prev ? { ...prev, full_name: showroomName, bio: showroomBio, social_links: showroomSocials } : { full_name: showroomName, bio: showroomBio, social_links: showroomSocials });
                      }
                    }}
                    className="btn btn-green btn-sm shadow-sm"
                  >
                    Sauvegarder la boutique
                  </button>
                </div>
              </div>

              <Link href="/publier" className="w-full py-4 rounded-xl bg-green text-white font-bold text-[1.1rem] shadow-lg shadow-green/20 hover:bg-green-600 transition mb-6 flex justify-center items-center gap-2">
                <span className="text-2xl leading-none -mt-1">+</span> Ajouter une annonce
              </Link>

              {/* Draggable Products List */}
              <div className="space-y-3">
                {ads.length > 0 ? ads.map((prod, idx) => (
                  <div key={prod.id || idx} className="flex items-center gap-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border rounded-xl p-3 shadow-sm cursor-move hover:border-green transition">
                    <div className="text-gray-300 flex flex-col gap-1 px-1">
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                    </div>
                    <img src={prod.image || "https://placehold.co/150x150?text=Sans+Image"} alt={prod.title} className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase truncate">{prod.title}</h4>
                      <div className="text-sm font-semibold text-green mt-0.5">{prod.price} FCFA</div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white">⋮</button>
                  </div>
                )) : (
                  <div className="text-center p-6 bg-gray-50 dark:bg-dark-900 rounded-xl text-gray-500 text-sm">
                    Vous n'avez pas encore d'annonces en ligne.
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Droite : Live Preview */}
            <div className={`fixed inset-0 z-[900] bg-black/80 lg:bg-transparent lg:static lg:flex lg:w-[350px] lg:shrink-0 justify-center items-start lg:pt-4 ${livePreviewOpen ? "flex" : "hidden"} lg:!flex`}>
              {/* Mobile Close Button */}
              {livePreviewOpen && (
                <button onClick={() => setLivePreviewOpen(false)} className="lg:hidden absolute top-4 right-4 text-white bg-white/10 rounded-full w-10 h-10 flex items-center justify-center text-xl backdrop-blur-md z-50">
                  ✕
                </button>
              )}
              {/* Phone Mockup Frame */}
              <div className="relative w-full h-full lg:max-w-[350px] lg:h-[700px] bg-[#0A0E14] lg:rounded-[3rem] lg:border-[10px] lg:border-gray-900 lg:dark:border-black shadow-2xl overflow-hidden flex flex-col mx-auto mt-0 lg:mt-0">
                {/* Mockup Content (The Store Page) */}
                <div className="flex-1 overflow-y-auto bg-[#0A0E14] scrollbar-hide flex flex-col pt-6 lg:pt-0">
                  {/* Banner & Profile Section */}
                  <div className="relative bg-gradient-to-b from-[#1c2333] to-[#0A0E14] pb-4 shrink-0">
                    <div className="pt-4 px-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full bg-[#E65100] border-[2px] border-[#FFB300] flex items-center justify-center overflow-hidden shadow-lg mb-2">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-[2rem] font-display font-bold">{(showroomName || displayName || 'Y').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      
                      <h2 className="font-display font-black text-white text-[1.2rem] uppercase tracking-wide leading-tight">
                        {showroomName || displayName || "Ma Boutique"}
                      </h2>
                      <p className="text-[#8B949E] text-[.8rem] mt-0.5 mb-3 leading-tight">
                        {showroomBio || "La référence en bonnes affaires"}
                      </p>

                      {/* Badges Grid */}
                      <div className="flex flex-wrap gap-1.5">
                        <div className="bg-white/10 border border-white/10 rounded-full px-2 py-1 flex items-center gap-1 text-[.6rem] text-white font-medium">
                          <span className="text-green-400 bg-green-400/20 rounded-sm w-3 h-3 flex items-center justify-center text-[.5rem]">✓</span> Vendeur vérifié
                        </div>
                        <div className="bg-white/10 border border-white/10 rounded-full px-2 py-1 flex items-center gap-1 text-[.6rem] text-white font-medium">
                          <span>📅</span> Membre depuis {new Date().getFullYear()}
                        </div>
                        <div className="bg-white/10 border border-white/10 rounded-full px-2 py-1 flex items-center gap-1 text-[.6rem] text-white font-medium">
                          <span className="text-[#FFB300]">⭐</span> 4.8/5 (12 avis)
                        </div>
                        <div className="bg-white/10 border border-white/10 rounded-full px-2 py-1 flex items-center gap-1 text-[.6rem] text-white font-medium">
                          <span>📦</span> {ads.length} annonces
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Listings Section */}
                  <div className="p-4 bg-[#0A0E14] flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-display font-bold text-[.9rem] leading-snug max-w-[200px]">
                        Annonces de {showroomName || displayName || "Ma Boutique"}
                      </h3>
                      <span className="text-[#5C6BC0] text-xs font-bold whitespace-nowrap">Voir tout →</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pb-[80px]">
                      {ads.length > 0 ? ads.map((prod, idx) => (
                        <div key={prod.id || idx} className="bg-[#161B22] rounded-xl overflow-hidden border border-white/5 relative">
                          <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full z-10 backdrop-blur-sm">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                          </div>
                          <img src={prod.image || "https://placehold.co/400x400?text=Sans+Image"} alt={prod.title} className="w-full aspect-square object-cover" />
                          <div className="p-2.5">
                            <h4 className="font-bold text-[.75rem] text-white leading-tight line-clamp-2">{prod.title}</h4>
                            <div className="text-[.75rem] font-black text-[#5C6BC0] mt-1">{prod.price} FCFA</div>
                            <div className="text-[.6rem] text-gray-500 mt-1 truncate">📍 {prod.location || "Dakar"}</div>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-2 text-center p-6 text-gray-500 text-xs bg-[#161B22] rounded-xl border border-white/5">
                          Votre boutique est vide.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fake WhatsApp Button */}
                  <div className="absolute bottom-[30px] right-4 z-50">
                    <div className="w-[50px] h-[50px] bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,211,102,0.4)]">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {panel === "credits" && (
          <div className="animate-fadeUp max-w-[1000px] mx-auto">
            {/* Crédits boost disponibles (vendus par l'admin en espèces, ou achetés) */}
            {(() => {
              const available = boostCredits.filter((c: any) => c.status === "available");
              if (available.length === 0) return null;
              return (
                <div className="mb-10 rounded-2xl border-2 border-green/40 bg-green/5 p-5 sm:p-6">
                  <h3 className="font-display text-[1.1rem] sm:text-[1.3rem] font-extrabold dark:text-white mb-1">🎟️ Mes crédits boost ({available.length})</h3>
                  <p className="text-sm text-gray-500 mb-4">Utilise un crédit pour booster une de tes annonces — sans payer.</p>
                  <div className="space-y-3">
                    {available.map((c: any) => (
                      <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-800 p-3">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold dark:text-white">{c.boost_name || c.boost_key}</span>
                          <span className="ml-2 text-[.78rem] text-gray-500">{c.duration_days} jours</span>
                        </div>
                        <select
                          value={creditTarget[c.id] || ""}
                          onChange={(e) => setCreditTarget((v) => ({ ...v, [c.id]: e.target.value }))}
                          className="bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-sm outline-none focus:border-green sm:w-[220px]"
                        >
                          <option value="">— Choisir une annonce —</option>
                          {ads.map((a: any) => <option key={a.id} value={a.id}>{a.title || a.id}</option>)}
                        </select>
                        <button
                          onClick={() => useBoostCredit(c.id)}
                          disabled={usingCredit === c.id}
                          className="btn btn-green whitespace-nowrap disabled:opacity-60"
                        >
                          {usingCredit === c.id ? "⏳…" : "⭐ Booster"}
                        </button>
                      </div>
                    ))}
                  </div>
                  {ads.length === 0 && <p className="mt-3 text-[.8rem] text-amber-600">💡 Publie une annonce pour pouvoir utiliser tes crédits.</p>}
                </div>
              );
            })()}

            <div className="text-center mb-8">
              <h2 className="font-display text-[1.3rem] sm:text-[1.6rem] font-extrabold dark:text-white mb-2">Acheter des Crédits</h2>
              <p className="text-sm text-gray-500">Obtenez plus de visibilité en utilisant vos crédits pour booster vos annonces.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Pack Découverte", credits: 50, price: "5 000 FCFA", popular: false, color: "border-gray-200 dark:border-dark-border" },
                { name: "Pack Pro", credits: 150, price: "12 000 FCFA", popular: true, color: "border-orange-500 shadow-lg scale-105" },
                { name: "Pack VIP", credits: 500, price: "35 000 FCFA", popular: false, color: "border-gold" },
              ].map((pack, idx) => (
                <div key={idx} className={`relative rounded-2xl border-2 bg-white dark:bg-dark-800 p-6 flex flex-col ${pack.color}`}>
                  {pack.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 text-[.65rem] font-bold uppercase tracking-widest rounded-full">Populaire</span>}
                  <div className="text-center mb-6">
                    <h3 className="font-bold text-gray-500 dark:text-gray-400 mb-2">{pack.name}</h3>
                    <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-1">{pack.credits} <span className="text-lg">Crédits</span></div>
                    <div className="text-xl font-bold text-green">{pack.price}</div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex gap-2">✓ Validité illimitée</li>
                    <li className="flex gap-2">✓ Boosts applicables instantanément</li>
                    <li className="flex gap-2">✓ Priorité support client</li>
                  </ul>
                  <a
                    href={whatsappLink(`Bonjour 👋, je souhaite acheter le *${pack.name}* (${pack.credits} crédits - ${pack.price}). Je fais le dépôt et j'envoie le reçu.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 rounded-lg font-bold transition text-center block ${pack.popular ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-dark-900 dark:text-white dark:hover:bg-dark-700"}`}
                  >
                    💬 Commander (dépôt + WhatsApp)
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {panel === "messages" && (
          <div className="animate-fadeUp max-w-[1000px] mx-auto h-[calc(100dvh-150px)] min-h-[460px] flex flex-col">
            <h2 className="mb-3 font-display text-[1.2rem] sm:text-[1.4rem] font-extrabold dark:text-white shrink-0">Messagerie & Discussions</h2>
            <div className="flex-1 min-h-0 bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
              <ChatInterface />
            </div>
          </div>
        )}


        {panel === "security" && (
          <div className="animate-fadeUp max-w-[800px] mx-auto">
            <h2 className="mb-6 font-display text-[1.2rem] sm:text-[1.4rem] font-extrabold dark:text-white">Sécurité & Vie privée</h2>
            <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-800 p-6 shadow-sm mb-6">
              <h3 className="font-bold text-lg mb-1 dark:text-white">Mon adresse email</h3>
              <p className="text-[.8rem] text-gray-500 mb-4">Si votre compte a été créé sur le terrain (nom d'utilisateur), mettez ici votre <b>vrai email</b> pour sécuriser votre compte.</p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="votre@email.com" className="flex-1 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green" />
                <button
                  className="btn btn-green whitespace-nowrap"
                  onClick={async () => {
                    if (!newEmail || !newEmail.includes("@")) { show("❌ Email invalide"); return; }
                    const { error } = await supabase.auth.updateUser({ email: newEmail });
                    if (error) { show("❌ Erreur: " + error.message); }
                    else { show("✓ Email mis à jour. Vérifiez votre boîte mail pour confirmer."); setNewEmail(""); }
                  }}
                >Enregistrer l'email</button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-800 p-6 shadow-sm mb-6">
              <h3 className="font-bold text-lg mb-4 dark:text-white">Modifier le mot de passe</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-[.8rem] text-gray-500 font-bold mb-1 block">Nouveau mot de passe</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green" />
                </div>
                <div>
                  <label className="text-[.8rem] text-gray-500 font-bold mb-1 block">Confirmer le nouveau mot de passe</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green" />
                </div>
                <button
                  className="btn btn-green w-full"
                  onClick={async () => {
                    if (!newPassword || newPassword !== confirmPassword) {
                      show("❌ Les mots de passe ne correspondent pas");
                      return;
                    }
                    if (newPassword.length < 6) {
                      show("❌ Le mot de passe doit faire au moins 6 caractères");
                      return;
                    }
                    const { error } = await supabase.auth.updateUser({ password: newPassword });
                    if (error) {
                      show("❌ Erreur: " + error.message);
                    } else {
                      show("✓ Mot de passe mis à jour");
                      setNewPassword("");
                      setConfirmPassword("");
                    }
                  }}
                >
                  Mettre à jour le mot de passe
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-2 text-brand-red">Zone de danger</h3>
              <p className="text-sm text-red-700/80 mb-4">La suppression de votre compte est définitive et entraînera la perte de toutes vos données, annonces, et achats.</p>
              <button onClick={() => show("⚠️ Pour supprimer votre compte, veuillez nous contacter à contact@annonce.id avec votre adresse email.")} className="btn btn-outline text-brand-red border-brand-red hover:bg-brand-red hover:text-white">Supprimer mon compte</button>
            </div>
          </div>
        )}

        {panel === "alerts" && (
          <div className="animate-fadeUp max-w-[800px] mx-auto">
            <h2 className="mb-6 font-display text-[1.2rem] sm:text-[1.4rem] font-extrabold dark:text-white">Gérer mes alertes</h2>
            <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-800 p-6 shadow-sm">
              <div className="space-y-6">
                {[
                  { key: "messages", title: "Nouveaux messages", desc: "Soyez alerté par email lorsqu'un acheteur vous contacte." },
                  { key: "expired", title: "Annonces expirées", desc: "Recevez un rappel 48h avant l'expiration de vos annonces." },
                  { key: "stats", title: "Statistiques mensuelles", desc: "Recevez un rapport complet sur les vues de vos annonces." },
                  { key: "search", title: "Alertes de recherche", desc: "Notification si une annonce correspond à vos critères enregistrés." },
                  { key: "promos", title: "Promotions & Nouveautés", desc: "Actualités de la plateforme et offres spéciales sur les boosts." },
                ].map((item, idx) => {
                  const isActive = !!alertPrefs[item.key];
                  return (
                    <div key={idx} className="flex items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-dark-border last:border-0 last:pb-0">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isActive}
                          onChange={async () => {
                            if (!user) return;
                            const newPrefs = { ...alertPrefs, [item.key]: !isActive };
                            setAlertPrefs(newPrefs);
                            const { error } = await supabase.from('profiles').update({
                              alert_prefs: newPrefs
                            }).eq('id', user.id);
                            if (error) {
                              show("❌ Erreur sauvegarde préférences");
                            } else {
                              show("✓ Préférence d'alerte mise à jour !");
                            }
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-dark-900 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {panel === "faq" && (
          <div className="animate-fadeUp max-w-[800px] mx-auto">
            <h2 className="mb-2 font-display text-[1.2rem] sm:text-[1.4rem] font-extrabold dark:text-white">Foire Aux Questions</h2>
            <p className="mb-6 text-sm text-gray-500">Trouvez rapidement des réponses à vos questions les plus fréquentes.</p>

            <div className="space-y-4">
              {[
                { q: "Comment publier une annonce gratuitement ?", a: "Vous avez droit à 3 annonces gratuites par mois. Rendez-vous dans la section 'Publier une annonce', remplissez le formulaire, et sélectionnez l'option gratuite à la dernière étape." },
                { q: "Quels sont les avantages du mode Premium ?", a: "Le mode Premium place votre annonce en tête de liste, lui ajoute un badge 'VIP', et augmente sa visibilité de 500% par rapport à une annonce classique." },
                { q: "Comment modifier ou supprimer mon annonce ?", a: "Allez dans 'Gérer mes annonces'. Cliquez sur les boutons 'Modifier' ou 'Supprimer' situés à côté de l'annonce concernée." },
                { q: "Les paiements par Orange Money sont-ils sécurisés ?", a: "Oui, tous nos paiements sont cryptés et traités directement par l'API officielle de Wave et Orange Money." },
              ].map((faq, idx) => (
                <details key={idx} className="group rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-800 p-5 shadow-sm cursor-pointer">
                  <summary className="font-bold text-gray-900 dark:text-white list-none flex justify-between items-center outline-none">
                    {faq.q}
                    <span className="transition group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-dark-border pt-4">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => show("Demande de suppression envoyée au support.")}
        title="Supprimer votre compte ?"
        description="Attention ! Cette action supprimera définitivement votre profil et toutes vos annonces. Voulez-vous continuer ?"
        confirmLabel="Oui, supprimer"
        danger
      />

      {/* Modal Suppression d'Annonce */}
      <ConfirmModal
        open={!!adToDelete}
        onClose={() => setAdToDelete(null)}
        onConfirm={handleDeleteAd}
        title="Supprimer cette annonce ?"
        description="Attention ! Cette action est irréversible. L'annonce sera définitivement supprimée de la plateforme."
        confirmLabel="Oui, supprimer l'annonce"
        danger
      />

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-neon-gold bg-dark-900 px-5 py-2.5 text-[.88rem] font-medium text-white shadow-lg animate-fadeUp">
          {toast}
        </div>
      )}
      {cropModalImage && cropModalZone && (
        <ImageCropperModal
          imageSrc={cropModalImage}
          maxWidth={cropModalZone === 'avatar' ? 256 : cropModalZone === 'cover' ? 1600 : 1200}
          aspectRatio={cropModalZone === 'avatar' ? 1 : cropModalZone === 'cover' ? 3 : 4} // avatar 1:1, couverture ~3:1, bannières 4:1
          onCancel={() => {
            setCropModalImage(null);
            setCropModalZone(null);
          }}
          onCropDone={async (base64) => {
            if (cropModalZone === 'hero') setFileHero(base64);
            if (cropModalZone === 'footer') setFileFooter(base64);
            if (cropModalZone === 'catalogue') setFileCatalogue(base64);
            if (cropModalZone === 'product') setFileProduct(base64);
            if (cropModalZone === 'cover') {
              if (user) {
                try {
                  const coverUrl = await uploadImage(base64, "covers");
                  // Sécurité : on n'enregistre JAMAIS une base64 (échec d'upload = bucket manquant)
                  if (coverUrl.startsWith("data:")) {
                    show("❌ Stockage d'images non configuré : crée le bucket public « images » dans Supabase → Storage.");
                  } else {
                    const { error } = await supabase.from('profiles').update({ cover_url: coverUrl }).eq('id', user.id);
                    if (error) throw error;
                    setShowroomCover(coverUrl);
                    setProfile((prev: any) => prev ? { ...prev, cover_url: coverUrl } : { cover_url: coverUrl });
                    show("✓ Image de couverture mise à jour !");
                  }
                } catch (e: any) {
                  show("❌ Erreur (colonne cover_url manquante ? Lancez MIGRATION_VIP.sql).");
                  console.error(e);
                }
              }
            }
            if (cropModalZone === 'avatar') {
              if (user) {
                try {
                  // Envoi vers Supabase Storage (URL légère). On NE stocke PAS de base64
                  // dans la session/profil (sinon cookie géant → erreur 494).
                  const avatarUrl = await uploadImage(base64, "avatars");
                  if (avatarUrl.startsWith("data:")) {
                    show("❌ Stockage d'images non configuré : crée le bucket public « images » dans Supabase → Storage.");
                  } else {
                    const { error: dbError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
                    if (dbError) throw dbError;
                    setProfile((prev: any) => prev ? { ...prev, avatar_url: avatarUrl } : { avatar_url: avatarUrl });
                    show("✓ Photo mise à jour !");
                  }
                } catch (e: any) {
                  show("❌ Erreur lors de l'enregistrement de la photo.");
                  console.error(e);
                }
              }
            }
            setCropModalImage(null);
            setCropModalZone(null);
          }}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, sub, up }: { label: string; value: string; sub: string; up?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-4">
      <div className="text-[.75rem] text-gray-500 dark:text-white/60">{label}</div>
      <div className="my-1 font-display text-[1.3rem] sm:text-[1.6rem] font-extrabold leading-none dark:text-white">{value}</div>
      <div className={`text-[.72rem] ${up ? "text-green dark:text-neon-green font-bold" : "text-gray-500 dark:text-white/40"}`}>{sub}</div>
    </div>
  );
}

// KPI carte gradient (style Wanteermako) — compteur animé
function KpiGrad({ gradient, icon, label, value }: { gradient: string; icon: string; label: string; value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: number; const start = performance.now(); const dur = 700;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className={`relative flex flex-col justify-between overflow-hidden rounded-[14px] p-4 shadow-sm text-white ${gradient}`}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"></div>
      <div className="mb-2 flex items-center justify-between relative z-10">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/20 text-[.9rem]">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <div className="font-display text-[1.4rem] font-extrabold leading-none">
          {n.toLocaleString('fr-FR')}
        </div>
        <div className="mt-1.5 text-[.7rem] font-medium opacity-90">
          {label}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-[1.5px] border-gray-100 dark:border-dark-border bg-white dark:bg-dark-800 p-5">
      <h3 className="mb-4 font-display text-base font-bold dark:text-white">{title}</h3>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-900 p-3 text-left text-[.74rem] font-bold uppercase text-gray-700 dark:text-white/50">{children}</th>;
}

function Alert({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg p-3 text-[.85rem] ${color === "green" ? "bg-green/10 text-green-dark dark:text-neon-green" : "bg-gray-100 dark:bg-dark-800 text-gray-800 dark:text-white"}`}>
      {children}
    </div>
  );
}
