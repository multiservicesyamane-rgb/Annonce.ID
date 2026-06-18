"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* ───────── Données mock (plan stratégique B2B) ───────── */
const GRADS = ["bg-g1", "bg-g2", "bg-g3", "bg-g4", "bg-g5", "bg-g6", "bg-g7", "bg-g8"];

const NAV: { id: string; icon: string; label: string; section?: string; badge?: number }[] = [
  { id: "overview", icon: "📊", label: "Vue d'ensemble", section: "Tableau de bord" },
  { id: "crm", icon: "🎯", label: "CRM Prospects", badge: 23 },
  { id: "marketing", icon: "📢", label: "Centre Marketing" },
  { id: "campagnes", icon: "📨", label: "Campagnes" },
  { id: "employes", icon: "👨‍💼", label: "Employés", section: "Commercial" },
  { id: "ambassadeurs", icon: "🤝", label: "Ambassadeurs" },
  { id: "offres", icon: "💎", label: "Offres commerciales" },
  { id: "moderation", icon: "🛡️", label: "Modération", section: "Plateforme", badge: 8 },
  { id: "users", icon: "👥", label: "Utilisateurs" },
  { id: "finance", icon: "💰", label: "Finances" },
  { id: "ads", icon: "📺", label: "Publicités" },
  { id: "ia", icon: "🤖", label: "Assistant IA", section: "Outils" },
  { id: "points", icon: "⭐", label: "Points & Fidélité" },
  { id: "diffusion", icon: "📡", label: "Diffusion multi-canaux" },
  { id: "rapports", icon: "📄", label: "Rapports" },
  { id: "settings", icon: "⚙️", label: "Paramètres" },
];

const PROSPECTS = [
  { n: "Auto Dakar Plus", s: "Automobile", v: "Dakar", st: "int", pack: "Premium", ag: "Ibrahim", g: "bg-g1", ic: "🚗" },
  { n: "Immobilier Excellence", s: "Immobilier", v: "Abidjan", st: "rdv", pack: "Enterprise", ag: "Aminata", g: "bg-g4", ic: "🏠" },
  { n: "TechStore Bamako", s: "Électronique", v: "Bamako", st: "new", pack: "Basic", ag: "—", g: "bg-g3", ic: "📱" },
  { n: "BTP Conseil Cotonou", s: "Services", v: "Cotonou", st: "ct", pack: "Pro", ag: "Ibrahim", g: "bg-g7", ic: "🔧" },
  { n: "Fashion Palace", s: "Mode", v: "Lomé", st: "int", pack: "Basic", ag: "Aminata", g: "bg-g5", ic: "👗" },
];
const ST_LABELS: Record<string, string> = { new: "🆕 Nouveau", ct: "📤 Contacté", int: "🤝 Intéressé", rdv: "📅 Rendez-vous", cli: "✅ Client", ref: "❌ Refusé" };
const ST_PILL: Record<string, string> = { new: "bg-white/10 text-gray-300", ct: "bg-blue-500/15 text-blue-300", int: "bg-amber-500/15 text-amber-300", rdv: "bg-violet-500/15 text-violet-300", cli: "bg-emerald-500/15 text-emerald-300", ref: "bg-red-500/15 text-red-300" };

const EMPLOYES = [
  { n: "Ibrahim Traoré", r: "Responsable Contact", em: 32, wa: 18, rdv: 2, cli: 1, com: 45000, target: 3, g: "bg-g1", rank: "🥈" },
  { n: "Aminata Koné", r: "Responsable Prospection", em: 48, wa: 0, rdv: 0, cli: 0, com: 15000, target: 1.5, g: "bg-g5", rank: "🥉" },
  { n: "Kwame Mensah", r: "Responsable Partenariats", em: 12, wa: 8, rdv: 4, cli: 2, com: 82000, target: 3, g: "bg-g4", rank: "🥇" },
];

const TEMPLATES = [
  { cat: "Automobile", catC: "text-[#4FACFE]", t: "Email Automobile", p: "Augmentez la visibilité de votre parc automobile…" },
  { cat: "Immobilier", catC: "text-[#43E97B]", t: "Email Immobilier", p: "Plus de visibilité pour vos biens immobiliers…" },
  { cat: "WhatsApp", catC: "text-[#25D366]", t: "WhatsApp Premier contact", p: "Bonjour 👋 Je me permets de vous contacter…" },
  { cat: "WhatsApp", catC: "text-[#25D366]", t: "WhatsApp Relance J+3", p: "Je reviens vers vous suite à mon précédent message…" },
  { cat: "Électronique", catC: "text-[#A78BFA]", t: "Email Électronique", p: "Vendez plus de produits tech grâce à Wanteermako…" },
  { cat: "Emploi", catC: "text-[#FB923C]", t: "Email Recrutement", p: "Trouvez les meilleurs candidats plus vite…" },
];

const OFFRES = [
  { ic: "🆓", n: "Pack Gratuit", feats: ["10 annonces actives", "Profil simple", "Contact direct", "Stats de base"], color: "text-gray-300", prix: "0 FCFA/mois" },
  { ic: "⭐", n: "Pack Basic", feats: ["50 annonces actives", "Page entreprise", "Badge vérifié", "Support email"], color: "text-[#4FACFE]", prix: "25 000 FCFA/mois" },
  { ic: "🚀", n: "Pack Pro", feats: ["Annonces illimitées", "Page entreprise complète", "Mise en avant", "Import Excel/CSV", "Assistant IA"], color: "text-[#A18CD1]", prix: "75 000 FCFA/mois", pop: true },
  { ic: "👑", n: "Pack Premium", feats: ["Tout le Pro", "Diffusion Facebook auto", "WhatsApp illimité", "Génération leads", "Account manager"], color: "text-[#FFC93C]", prix: "150 000 FCFA/mois" },
  { ic: "🏢", n: "Enterprise", feats: ["Tout Premium", "API personnalisée", "Sync. stock", "Formation équipe", "SLA garantie"], color: "text-[#F093FB]", prix: "300 000+ FCFA/mois" },
];

const AMBASSADEURS = [
  { n: "Fatoumata Bah", l: "🥇 Or", lc: "text-[#FFC93C]", v: 8, c: 82000, g: "bg-g5" },
  { n: "Seydou Camara", l: "🥈 Argent", lc: "text-gray-300", v: 5, c: 45000, g: "bg-g1" },
  { n: "Ama Asante", l: "🥈 Argent", lc: "text-gray-300", v: 4, c: 32000, g: "bg-g3" },
  { n: "Moussa Touré", l: "🥉 Bronze", lc: "text-[#CD7F32]", v: 2, c: 15000, g: "bg-g8" },
  { n: "Binta Koné", l: "🥉 Bronze", lc: "text-[#CD7F32]", v: 1, c: 7500, g: "bg-g7" },
];

const ADMIN_CREDS = { email: "admin@yamanetech.com", pass: "YamaneTech@2025" };

/* ───────── Composants UI ───────── */
function Kpi({ grad, icon, label, value, trend, suffix }: { grad: string; icon: string; label: string; value: number; trend?: string; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: number; const start = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - start) / 700); setN(Math.round(value * p)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className={`relative overflow-hidden rounded-[16px] p-3 sm:p-4 ${grad}`}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[10px] bg-white/20 text-[.9rem] sm:text-[1rem]">{icon}</div>
        {trend && <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[.68rem] font-bold text-white">{trend}</span>}
      </div>
      <div className="relative z-10 mt-2 text-[1.3rem] sm:text-[1.6rem] font-extrabold leading-none text-white">{n.toLocaleString("fr-FR")}{suffix || ""}</div>
      <div className="relative z-10 mt-1 text-[.65rem] sm:text-[.75rem] text-white/80">{label}</div>
    </div>
  );
}

function Card({ title, sub, children, action }: { title?: string; sub?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[#21262D] bg-[#161B22] p-3 sm:p-4 overflow-hidden">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
          <div>{title && <h3 className="text-[.93rem] font-extrabold text-white">{title}</h3>}{sub && <div className="text-[.72rem] text-[#8B949E] mt-0.5">{sub}</div>}</div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export default function SuperAdminApp() {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState("overview");
  const [sbOpen, setSbOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState("");

  // Données réelles
  const [counts, setCounts] = useState({ total: 0, pending: 0, active: 0, users: 0, favorites: 0, messages: 0, reports: 0 });
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [prospects, setProspects] = useState<any[]>([]);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const T = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2100); };

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("sa_authed") === "1") {
      setAuthed(true);
      if (!sessionStorage.getItem("sa_pass")) {
        sessionStorage.setItem("sa_pass", ADMIN_CREDS.pass);
      }
    }
  }, []);

  // Fonction de chargement complète
  const loadAllData = async () => {
    if (!authed) return;
    setDataLoading(true);
    const sb = createClient();
    try {
      const [t, p, a, u, fav, msg, rep] = await Promise.all([
        sb.from("listings").select("*", { count: "exact", head: true }),
        sb.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        sb.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
        sb.from("profiles").select("*", { count: "exact", head: true }),
        sb.from("favorites").select("*", { count: "exact", head: true }),
        sb.from("messages").select("*", { count: "exact", head: true }),
        sb.from("reports").select("*", { count: "exact", head: true }),
      ]);
      setCounts({ total: t.count || 0, pending: p.count || 0, active: a.count || 0, users: u.count || 0, favorites: fav.count || 0, messages: msg.count || 0, reports: rep.count || 0 });

      // Annonces en attente
      const { data: pend } = await sb.from("listings").select("id, title, category, image, status, created_at, user_id").eq("status", "pending").order("created_at", { ascending: false }).limit(50);
      setPendingListings(pend || []);

      // Toutes les annonces (pour section Ads admin)
      const { data: allAds } = await sb.from("listings").select("id, title, slug, category, image, status, views, price, location, created_at, user_id").order("created_at", { ascending: false }).limit(100);
      setAllListings(allAds || []);

      // Profils
      const { data: profs } = await sb.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
      setProfiles(profs || []);

      // Achats
      const { data: purchData } = await sb.from("purchases").select("*").order("created_at", { ascending: false }).limit(50);
      setPurchases(purchData || []);

      // Signalements
      const { data: repData } = await sb.from("reports").select("*").order("created_at", { ascending: false }).limit(30);
      setReports(repData || []);

      // ── Données B2B (CRM, ambassadeurs, employés, campagnes) ──
      const [pros, amb, emp, camp] = await Promise.all([
        sb.from("prospects").select("*").order("created_at", { ascending: false }).limit(100),
        sb.from("ambassadors").select("*").order("commission_total", { ascending: false }).limit(100),
        sb.from("employees").select("*").order("created_at", { ascending: false }).limit(100),
        sb.from("campaigns").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      setProspects(pros.data || []);
      setAmbassadors(amb.data || []);
      setEmployees(emp.data || []);
      setCampaigns(camp.data || []);
    } catch (e) { console.error("SuperAdmin load error:", e); }
    setDataLoading(false);
  };

  // Ajout réel d'un prospect dans la table
  async function addProspect(p: Record<string, any>) {
    const sb = createClient();
    const { error } = await sb.from("prospects").insert(p);
    if (error) { T(`⚠ ${error.message.includes("row-level") ? "Accès refusé (RLS) — voir SQL admin" : error.message}`); return false; }
    T("✅ Prospect ajouté");
    loadAllData();
    return true;
  }

  useEffect(() => { loadAllData(); }, [authed]);

  function doLogin() {
    if (email === ADMIN_CREDS.email && pass === ADMIN_CREDS.pass && (code === "1234" || code === "")) {
      sessionStorage.setItem("sa_authed", "1"); sessionStorage.setItem("sa_pass", pass); setAuthed(true); T("✅ Bienvenue, Super Administrateur");
    } else T("❌ Identifiants incorrects");
  }
  function doLogout() { sessionStorage.removeItem("sa_authed"); sessionStorage.removeItem("sa_pass"); setAuthed(false); }

  async function moderate(id: string, status: string) {
    const sb = createClient();
    const { error } = await sb.from("listings").update({ status }).eq("id", id);
    if (error) { T("⚠ Action bloquée (droits admin requis côté base)"); return; }
    setPendingListings((p) => p.filter((x) => x.id !== id));
    setCounts((c) => ({ ...c, pending: Math.max(0, c.pending - 1), active: status === "active" ? c.active + 1 : c.active }));
    T(status === "active" ? "✅ Annonce approuvée" : "❌ Annonce rejetée");
  }

  /* ───────── LOGIN ───────── */
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1117] p-4">
        <div className="w-full max-w-[400px] rounded-[24px] border border-[#30363D] bg-[#161B22] p-5 sm:p-8 shadow-[0_0_60px_rgba(99,102,241,.15)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-g1 text-[1.3rem] font-extrabold text-white shadow-[0_0_30px_rgba(99,102,241,.4)]">SA</div>
          <h1 className="text-center text-[1.2rem] font-extrabold text-white">Super Admin</h1>
          <p className="mb-6 text-center text-[.82rem] text-[#8B949E]">Wanteermako · YamaneTech</p>
          <input className="mb-2.5 w-full rounded-[10px] border-[1.5px] border-[#30363D] bg-[#0D1117] px-3.5 py-2.5 text-[.88rem] text-white outline-none focus:border-[#6366F1]" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email administrateur" />
          <input className="mb-2.5 w-full rounded-[10px] border-[1.5px] border-[#30363D] bg-[#0D1117] px-3.5 py-2.5 text-[.88rem] text-white outline-none focus:border-[#6366F1]" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Mot de passe" />
          <input className="mb-2.5 w-full rounded-[10px] border-[1.5px] border-[#30363D] bg-[#0D1117] px-3.5 py-2.5 text-[.88rem] text-white outline-none focus:border-[#6366F1]" type="text" maxLength={4} value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} placeholder="Code 2FA (1234)" />
          <button onClick={doLogin} className="w-full rounded-[10px] bg-g1 py-2.5 text-[.9rem] font-extrabold text-white shadow-[0_4px_20px_rgba(99,102,241,.35)] hover:-translate-y-px transition">Accéder au Super Admin →</button>
        </div>
        {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-[9px] bg-[#E6EDF3] px-4 py-2.5 text-[.82rem] font-bold text-[#1A1F36] shadow-lg">{toast}</div>}
      </div>
    );
  }

  /* ───────── APP ───────── */
  return (
    <div className="flex min-h-screen bg-[#0D1117] text-white">
      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 z-[200] w-[240px] flex flex-col border-r border-[#21262D] bg-[#161B22] transition-transform ${sbOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex items-center gap-2.5 border-b border-[#21262D] px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-g1 text-[.8rem] font-extrabold text-white shadow-[0_0_16px_rgba(99,102,241,.4)]">SA</div>
          <div className="font-extrabold leading-tight text-[.88rem]">YamaneTech<span className="block text-[.64rem] font-semibold tracking-wide text-[#FFC93C]">SUPER ADMIN</span></div>
        </div>
        <div className="m-2.5 flex items-center gap-2.5 rounded-[11px] border border-[#6366F1]/20 bg-[#6366F1]/10 px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-g1 text-[.85rem] font-extrabold text-white">SA</div>
          <div><div className="text-[.84rem] font-bold">Super Administrateur</div><div className="text-[.68rem] font-semibold text-[#FFC93C]">Wanteermako</div></div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2.5 py-1">
          {NAV.map((n) => (
            <div key={n.id}>
              {n.section && <div className="px-2 pb-1 pt-3 text-[.6rem] font-bold uppercase tracking-widest text-[#484F58]">{n.section}</div>}
              <button onClick={() => { setPage(n.id); setSbOpen(false); }} className={`mb-0.5 flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-left text-[.83rem] font-semibold transition ${page === n.id ? "border-l-2 border-[#6366F1] bg-[#6366F1]/15 text-[#A5B4FC]" : "text-[#8B949E] hover:bg-white/5 hover:text-white"}`}>
                <span className="w-4 text-center text-[.85rem]">{n.icon}</span>
                <span className="truncate">{n.label}</span>
                {n.badge && <span className="ml-auto rounded-md bg-red-500 px-1.5 py-0.5 text-[.58rem] font-bold text-white">{n.badge}</span>}
              </button>
            </div>
          ))}
        </nav>
        <div className="border-t border-[#21262D] p-2.5">
          <button onClick={doLogout} className="flex w-full items-center gap-2 rounded-[9px] px-3 py-2.5 text-[.82rem] font-semibold text-[#F85149] hover:bg-[#F85149]/10">🚪 Déconnexion</button>
        </div>
      </aside>
      {sbOpen && <div onClick={() => setSbOpen(false)} className="fixed inset-0 z-[190] bg-black/60 lg:hidden" />}

      {/* Main */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-w-0">
        <header className="sticky top-0 z-[100] flex items-center gap-3 border-b border-[#21262D] bg-[#161B22]/90 px-5 py-3 backdrop-blur">
          <button onClick={() => setSbOpen(true)} className="text-[1.2rem] text-[#8B949E] lg:hidden">☰</button>
          <div className="relative hidden sm:block max-w-[300px] flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[.8rem] text-[#484F58]">🔍</span>
            <input className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] py-2 pl-8 pr-3 text-[.83rem] text-white outline-none focus:border-[#6366F1]" placeholder="Rechercher prospects, campagnes…" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => T("Recherche")} className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-[#30363D] bg-white/5 sm:hidden">🔍</button>
            <button onClick={() => T("3 alertes système")} className="relative flex h-9 w-9 items-center justify-center rounded-[9px] border border-[#30363D] bg-white/5">🔔<span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" /></button>
            <button onClick={() => T("Export global…")} className="rounded-[9px] bg-g1 px-3 py-2 text-[.78rem] font-bold text-white shadow-[0_0_20px_rgba(99,102,241,.3)]"><span className="sm:hidden">⬇</span><span className="hidden sm:inline">⬇ Exporter</span></button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1500px] p-3 sm:p-5">
          {dataLoading && page !== "overview" ? (
            <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" /></div>
          ) : (<>
          {page === "overview" && <Overview counts={counts} allListings={allListings} profiles={profiles} purchases={purchases} T={T} loading={dataLoading} />}
          {page === "crm" && <CRM T={T} prospects={prospects} addProspect={addProspect} />}
          {page === "marketing" && <Marketing T={T} />}
          {page === "campagnes" && <Campagnes campaigns={campaigns} />}
          {page === "employes" && <Employes employees={employees} />}
          {page === "ambassadeurs" && <Ambassadeurs T={T} ambassadors={ambassadors} />}
          {page === "offres" && <Offres T={T} />}
          {page === "moderation" && <Moderation items={pendingListings} moderate={moderate} />}
          {page === "users" && <Users profiles={profiles} T={T} reload={loadAllData} />}
          {page === "finance" && <Finance purchases={purchases} counts={counts} />}
          {page === "ads" && <AdsAdmin allListings={allListings} T={T} reload={loadAllData} />}
          {page === "ia" && <IA T={T} />}
          {page === "points" && <Points />}
          {page === "diffusion" && <Diffusion />}
          {page === "rapports" && <Rapports T={T} allListings={allListings} profiles={profiles} purchases={purchases} />}
          {page === "settings" && <Settings T={T} />}
          </>)}
        </div>
      </div>

      {toast && <div className="fixed bottom-5 left-1/2 z-[9999] -translate-x-1/2 rounded-[9px] bg-[#E6EDF3] px-4 py-2.5 text-[.82rem] font-bold text-[#1A1F36] shadow-lg">{toast}</div>}
    </div>
  );
}

/* ───────── Sections ───────── */
function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-[1.1rem] sm:text-[1.3rem] font-extrabold">{title}</h1>{sub && <p className="mt-0.5 text-[.75rem] sm:text-[.8rem] text-[#8B949E]">{sub}</p>}</div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
const btnP = "rounded-[9px] bg-g1 px-3.5 py-2 text-[.78rem] font-bold text-white";
const btnG = "rounded-[9px] border border-[#30363D] bg-[#21262D] px-3.5 py-2 text-[.78rem] font-bold text-[#8B949E] hover:text-white";

function Overview({ counts, allListings, profiles, purchases, T, loading }: { counts: any; allListings: any[]; profiles: any[]; purchases: any[]; T: (m: string) => void; loading: boolean }) {
  const totalRevenue = purchases.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const totalViews = allListings.reduce((s: number, a: any) => s + (a.views || 0), 0);

  // Catégories réelles
  const byCat: Record<string, number> = {};
  allListings.forEach((a) => { const c = a.category || "Autre"; byCat[c] = (byCat[c] || 0) + 1; });
  const catEntries = Object.entries(byCat).sort((x, y) => y[1] - x[1]).slice(0, 6);
  const catColors = ["#667EEA", "#FFC93C", "#F093FB", "#43E97B", "#4FACFE", "#A78BFA"];

  // Statuts annonces
  const statusData = [
    ["Actives", "#10B981", allListings.filter(a => a.status === "active").length],
    ["En attente", "#F59E0B", counts.pending],
    ["Inactives", "#6B7280", allListings.filter(a => a.status === "inactive").length],
    ["Vendues", "#3B82F6", allListings.filter(a => a.status === "sold").length],
    ["Rejetées", "#EF4444", allListings.filter(a => a.status === "rejected").length],
  ] as const;

  return (
    <>
      <PageHead title="🚀 Super Admin — Wanteermako" sub="Tableau de bord temps réel · données Supabase">
        <button className={btnG} onClick={() => T("Actualisation…")}>{loading ? "⏳" : "🔄"} Rafraîchir</button>
      </PageHead>
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Kpi grad="bg-g1" icon="📦" label="Annonces totales" value={counts.total} trend="réel" />
        <Kpi grad="bg-g8" icon="✅" label="Annonces actives" value={counts.active} trend="réel" />
        <Kpi grad="bg-g5" icon="👥" label="Utilisateurs" value={counts.users} trend="réel" />
        <Kpi grad="bg-g3" icon="⏳" label="En attente" value={counts.pending} trend="réel" />
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Kpi grad="bg-g4" icon="👁️" label="Vues totales" value={totalViews} />
        <Kpi grad="bg-g7" icon="❤️" label="Favoris" value={counts.favorites} />
        <Kpi grad="bg-g6" icon="💬" label="Messages" value={counts.messages} />
        <Kpi grad="bg-g2" icon="💰" label="Revenus (FCFA)" value={totalRevenue} />
      </div>
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <Card title="Répartition par catégorie" sub={`${Object.keys(byCat).length} catégories`}>
          {catEntries.length === 0 ? <div className="py-4 text-center text-[.82rem] text-[#8B949E]">Aucune annonce</div> : catEntries.map(([n, c], i) => (
            <div key={n} className="mb-2.5">
              <div className="mb-1 flex justify-between text-[.8rem] text-[#C9D1D9]"><span>{n}</span><span className="font-extrabold">{c} annonces</span></div>
              <div className="h-[7px] overflow-hidden rounded bg-[#21262D]"><div className="h-full rounded" style={{ width: `${(c / counts.total) * 100}%`, background: catColors[i % 6] }} /></div>
            </div>
          ))}
        </Card>
        <Card title="Statuts des annonces">
          {statusData.map(([n, c, v]) => (
            <div key={n as string} className="mb-2 flex items-center gap-2.5">
              <div className="w-[80px] text-[.76rem] font-semibold text-[#8B949E]">{n}</div>
              <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-[#0D1117]"><div className="h-full rounded-md" style={{ width: `${counts.total ? ((v as number) / counts.total * 100) : 0}%`, background: c as string }} /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[.7rem] font-extrabold text-white">{v as number}</span></div>
            </div>
          ))}
        </Card>
      </div>
      <div className="mt-3"><Card title="Dernières annonces publiées" sub={`${allListings.length} annonces chargées`}>
        {allListings.slice(0, 8).map((a) => (
          <div key={a.id} className="mb-2 flex items-center gap-2.5 rounded-[9px] bg-[#0D1117] p-2.5">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[9px] bg-[#21262D]">{a.image && <img src={a.image} alt="" className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-[.83rem] font-bold">{a.title}</div><div className="text-[.7rem] text-[#8B949E]">{a.category || "—"} · {a.location || "—"} · {a.views || 0} vues</div></div>
            <span className={`rounded-md px-2 py-0.5 text-[.68rem] font-bold ${a.status === "active" ? "bg-emerald-500/15 text-emerald-300" : a.status === "pending" ? "bg-amber-500/15 text-amber-300" : a.status === "sold" ? "bg-blue-500/15 text-blue-300" : "bg-white/10 text-gray-400"}`}>{a.status === "active" ? "✅ Active" : a.status === "pending" ? "⏳ Attente" : a.status === "sold" ? "📦 Vendu" : a.status || "—"}</span>
            <div className="text-right shrink-0"><div className="text-[.85rem] font-extrabold text-[#FFC93C]">{a.price || "—"}</div></div>
          </div>
        ))}
      </Card></div>
    </>
  );
}

function CRM({ T, prospects, addProspect }: { T: (m: string) => void; prospects: any[]; addProspect: (p: Record<string, any>) => Promise<boolean> }) {
  const [form, setForm] = useState(false);
  const [f, setF] = useState<Record<string, string>>({ status: "new", pack: "Basic" });
  const stages: [string, string, string][] = [["🆕", "Nouveaux", "new"], ["📤", "Contactés", "ct"], ["🤝", "Intéressés", "int"], ["📅", "Rendez-vous", "rdv"], ["✅", "Clients", "cli"], ["❌", "Refusés", "ref"]];
  const countBy = (st: string) => prospects.filter((p) => p.status === st).length;

  async function submit() {
    if (!f.name?.trim()) { T("⚠ Nom requis"); return; }
    const ok = await addProspect({ name: f.name, sector: f.sector || null, city: f.city || null, email: f.email || null, phone: f.phone || null, status: f.status || "new", pack: f.pack || null });
    if (ok) { setForm(false); setF({ status: "new", pack: "Basic" }); }
  }

  return (
    <>
      <PageHead title="🎯 CRM — Prospects" sub={`${prospects.length} prospect(s) · ${countBy("cli")} client(s)`}>
        <button className={btnP} onClick={() => setForm((v) => !v)}>{form ? "✕ Fermer" : "+ Nouveau prospect"}</button>
      </PageHead>

      {form && (
        <div className="mb-3"><Card title="Ajouter un prospect">
          <div className="grid gap-2 sm:grid-cols-2">
            {[["name", "Nom de l'entreprise *"], ["sector", "Secteur"], ["city", "Ville"], ["email", "Email"], ["phone", "Téléphone"]].map(([k, ph]) => (
              <input key={k} value={f[k] || ""} onChange={(e) => setF((v) => ({ ...v, [k]: e.target.value }))} placeholder={ph} className="rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]" />
            ))}
            <select value={f.status} onChange={(e) => setF((v) => ({ ...v, status: e.target.value }))} className="rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none">
              {stages.map((s) => <option key={s[2]} value={s[2]}>{s[1]}</option>)}
            </select>
            <select value={f.pack} onChange={(e) => setF((v) => ({ ...v, pack: e.target.value }))} className="rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none">
              {["Basic", "Pro", "Premium", "Enterprise"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <button className={`${btnP} mt-3`} onClick={submit}>Enregistrer le prospect</button>
        </Card></div>
      )}

      <Card title="Pipeline de vente">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {stages.map(([ic, n, st]) => (
            <div key={st} className="rounded-[11px] border border-[#21262D] bg-[#0D1117] p-2.5">
              <div className="mb-2 flex items-center justify-between border-b border-[#21262D] pb-1.5 text-[.73rem] font-bold text-[#8B949E]">{ic} {n}<span className="rounded bg-white/10 px-1.5 text-[.7rem]">{countBy(st)}</span></div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-3"><Card title="Prospects">
        {prospects.length === 0 ? (
          <div className="py-8 text-center text-[.85rem] text-[#8B949E]">Aucun prospect pour l'instant. Cliquez sur « + Nouveau prospect » pour commencer.</div>
        ) : prospects.map((p) => (
          <div key={p.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-[12px] border border-[#21262D] bg-[#0D1117] p-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-g1 text-[1rem] font-bold text-white">{(p.name || "?").slice(0, 1).toUpperCase()}</div>
            <div className="min-w-[140px] flex-1"><div className="text-[.84rem] font-bold text-[#E6EDF3]">{p.name}</div><div className="text-[.72rem] text-[#8B949E]">{p.sector || "—"} · {p.city || "—"}{p.pack ? <> · Pack: <b className="text-[#FFC93C]">{p.pack}</b></> : null}</div></div>
            <span className={`rounded-md px-2 py-0.5 text-[.68rem] font-bold ${ST_PILL[p.status] || "bg-white/10 text-gray-300"}`}>{ST_LABELS[p.status] || p.status}</span>
            <div className="flex gap-1.5">
              {p.email && <a href={`mailto:${p.email}`} className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-white/5 text-[.78rem] hover:bg-[#6366F1]/20">📧</a>}
              {p.phone && <a href={`https://wa.me/${(p.phone || "").replace(/\D/g, "")}`} target="_blank" className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-white/5 text-[.78rem] hover:bg-[#25D366]/20">💬</a>}
            </div>
          </div>
        ))}
      </Card></div>
    </>
  );
}

function Marketing({ T }: { T: (m: string) => void }) {
  return (
    <>
      <PageHead title="📢 Centre Marketing" sub="Templates email & WhatsApp prêts à l'emploi">
        <button className={btnP} onClick={() => T("+ Template créé")}>+ Nouveau template</button>
      </PageHead>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <div key={t.t} className="flex flex-col gap-2 rounded-[12px] border border-[#21262D] bg-[#0D1117] p-3.5 hover:border-[#6366F1]">
            <div className="flex items-center justify-between"><span className={`text-[.64rem] font-bold uppercase tracking-wide ${t.catC}`}>{t.cat}</span><span className="text-[.68rem] text-[#484F58]">{t.cat === "WhatsApp" ? "WhatsApp" : "Email"}</span></div>
            <div className="text-[.88rem] font-bold text-[#E6EDF3]">{t.t}</div>
            <div className="line-clamp-2 text-[.75rem] leading-relaxed text-[#8B949E]">{t.p}</div>
            <div className="mt-1 flex gap-1.5">
              <button onClick={() => T(`Template : ${t.t}`)} className="rounded-[7px] border border-[#30363D] bg-[#161B22] px-2.5 py-1 text-[.7rem] font-bold text-[#8B949E] hover:text-[#A5B4FC]">👁 Voir</button>
              <button onClick={() => T("📋 Copié !")} className="rounded-[7px] border border-[#30363D] bg-[#161B22] px-2.5 py-1 text-[.7rem] font-bold text-[#8B949E] hover:text-[#A5B4FC]">📋 Copier</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Campagnes({ campaigns }: { campaigns: any[] }) {
  const sum = (k: string) => campaigns.reduce((a, c) => a + (Number(c[k]) || 0), 0);
  return (
    <>
      <PageHead title="📨 Campagnes" sub={`${campaigns.length} campagne(s)`} />
      <div className="mb-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Kpi grad="bg-g1" icon="📤" label="Envois totaux" value={sum("sent")} />
        <Kpi grad="bg-g3" icon="👁️" label="Ouvertures" value={sum("opened")} />
        <Kpi grad="bg-g8" icon="✅" label="Réponses" value={sum("replied")} />
        <Kpi grad="bg-g5" icon="📨" label="Campagnes" value={campaigns.length} />
      </div>
      <Card title="Campagnes">
        {campaigns.length === 0 ? (
          <div className="py-8 text-center text-[.85rem] text-[#8B949E]">Aucune campagne. (Création de campagne à venir.)</div>
        ) : (
          <Tbl head={["Campagne", "Secteur", "Canal", "Envois", "Ouvertures", "Réponses", "Statut"]}>
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-white/[.02]"><Td bold>{c.name}</Td><Td>{c.sector || "—"}</Td><Td>{c.channel || "—"}</Td><Td>{c.sent || 0}</Td><Td>{c.opened || 0}</Td><Td><span className="text-emerald-400 font-bold">{c.replied || 0}</span></Td><Td><span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[.68rem] font-bold text-emerald-300">{c.status || "active"}</span></Td></tr>
            ))}
          </Tbl>
        )}
      </Card>
    </>
  );
}

function Employes({ employees }: { employees: any[] }) {
  return (
    <>
      <PageHead title="👨‍💼 Tableau de bord Employés" sub={`${employees.length} employé(s)`} />
      {employees.length === 0 ? (
        <Card><div className="py-8 text-center text-[.85rem] text-[#8B949E]">Aucun employé enregistré. (Ajout d'employés à venir.)</div></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((e, i) => {
            const g = GRADS[i % 8];
            return (
              <div key={e.id} className="relative overflow-hidden rounded-[12px] border border-[#21262D] bg-[#0D1117] p-4">
                <div className={`mb-2.5 flex h-11 w-11 items-center justify-center rounded-[13px] text-[1rem] font-extrabold text-white ${g}`}>{(e.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}</div>
                <div className="text-[.88rem] font-extrabold text-[#E6EDF3]">{e.name}</div>
                <div className="mb-3 text-[.7rem] text-[#8B949E]">{e.role || "Commercial"}</div>
                <div className="flex items-center justify-between rounded-[8px] bg-[#0D1117] border border-[#21262D] p-2.5"><span className="text-[.72rem] text-[#8B949E]">Objectif mensuel</span><span className="text-[.9rem] font-extrabold text-[#FFC93C]">{e.monthly_target || 3} clients</span></div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Ambassadeurs({ T, ambassadors }: { T: (m: string) => void; ambassadors: any[] }) {
  const sum = (k: string) => ambassadors.reduce((a, x) => a + (Number(x[k]) || 0), 0);
  return (
    <>
      <PageHead title="🤝 Programme Ambassadeurs" sub={`${ambassadors.length} ambassadeur(s)`} />
      <div className="mb-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Kpi grad="bg-g4" icon="👥" label="Ambassadeurs" value={ambassadors.length} />
        <Kpi grad="bg-g1" icon="💰" label="Commissions (FCFA)" value={sum("commission_total")} />
        <Kpi grad="bg-g5" icon="🔗" label="Clics sur liens" value={sum("clicks")} />
        <Kpi grad="bg-g8" icon="✅" label="Clients apportés" value={sum("clients_count")} />
      </div>
      <Card title="Ambassadeurs">
        {ambassadors.length === 0 ? (
          <div className="py-8 text-center text-[.85rem] text-[#8B949E]">Aucun ambassadeur inscrit pour l'instant.</div>
        ) : ambassadors.map((a, i) => (
          <div key={a.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-[12px] border border-[#21262D] bg-[#0D1117] p-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-[10px] text-[.85rem] font-bold text-white ${GRADS[i % 8]}`}>{(a.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}</div>
            <div className="min-w-[100px] flex-1"><div className="text-[.83rem] font-bold text-[#E6EDF3]">{a.name}</div><div className="text-[.68rem] font-bold text-[#FFC93C]">{a.level || "bronze"}{a.ref_code ? ` · ${a.ref_code}` : ""}</div></div>
            <div className="flex gap-4 text-[.75rem]"><div><div className="text-[.9rem] font-extrabold text-[#FFC93C]">{a.clients_count || 0}</div><div className="text-[.66rem] text-[#8B949E]">Clients</div></div><div><div className="text-[.9rem] font-extrabold text-[#FFC93C]">{(a.commission_total || 0).toLocaleString("fr-FR")} F</div><div className="text-[.66rem] text-[#8B949E]">Commission</div></div></div>
          </div>
        ))}
      </Card>
    </>
  );
}

function Offres({ T }: { T: (m: string) => void }) {
  return (
    <>
      <PageHead title="💎 Offres commerciales" sub="Gérer les packs et tarifs">
        <button className={btnP} onClick={() => T("✅ Tarifs sauvegardés")}>💾 Sauvegarder</button>
      </PageHead>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {OFFRES.map((o) => (
          <div key={o.n} onClick={() => T(`Offre: ${o.n} · ${o.prix}`)} className={`relative cursor-pointer rounded-[12px] border bg-[#0D1117] p-4 transition hover:border-[#6366F1] ${o.pop ? "border-[#FFC93C]" : "border-[#21262D]"}`}>
            {o.pop && <span className="absolute -top-2 right-4 rounded-md bg-g5 px-2 py-0.5 text-[.62rem] font-extrabold text-[#0D1117]">POPULAIRE</span>}
            <div className="text-[1.5rem]">{o.ic}</div>
            <div className="mt-1 text-[.95rem] font-extrabold text-[#E6EDF3]">{o.n}</div>
            <div className={`mb-2 text-[1.1rem] font-extrabold ${o.color}`}>{o.prix}</div>
            <div className="space-y-1 text-[.75rem] text-[#8B949E]">{o.feats.map((f) => <div key={f}>✓ {f}</div>)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function Moderation({ items, moderate }: { items: any[]; moderate: (id: string, s: string) => void }) {
  return (
    <>
      <PageHead title="🛡️ Modération" sub={`${items.length} annonce(s) en attente`} />
      <Card>
        <div className="mb-3 rounded-[9px] border border-[#FFC93C]/20 bg-[#FFC93C]/10 px-3.5 py-2.5 text-[.82rem] text-[#FFC93C]">⏳ <b>{items.length} annonces</b> attendent votre validation (délai max 24h)</div>
        {items.length === 0 ? <div className="py-10 text-center text-[.85rem] text-[#8B949E]">✅ Aucune annonce en attente.</div> : items.map((m) => (
          <div key={m.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-[9px] border border-[#21262D] bg-[#0D1117] p-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-[#21262D]">{m.image && <img src={m.image} alt="" className="h-full w-full object-cover" />}</div>
            <div className="min-w-[120px] flex-1"><div className="text-[.84rem] font-bold text-[#E6EDF3]">{m.title}</div><div className="text-[.73rem] text-[#8B949E]">{m.category || "—"}</div></div>
            <div className="flex shrink-0 gap-1.5">
              <button onClick={() => moderate(m.id, "active")} className="rounded-[7px] bg-g1 px-2.5 py-1.5 text-[.74rem] font-bold text-white">✓ Approuver</button>
              <button onClick={() => moderate(m.id, "rejected")} className="rounded-[7px] border border-[#F85149]/20 bg-[#F85149]/10 px-2.5 py-1.5 text-[.74rem] font-bold text-[#F85149]">✕ Rejeter</button>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

async function adminApi(action: string, payload: Record<string, any> = {}) {
  const pass = (typeof window !== "undefined" && sessionStorage.getItem("sa_pass")) || ADMIN_CREDS.pass;
  const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pass, action, ...payload }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Erreur serveur");
  return data;
}

function Users({ profiles, T, reload }: { profiles: any[]; T: (m: string) => void; reload: () => void }) {
  const [search, setSearch] = useState("");
  const [serverUsers, setServerUsers] = useState<any[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ role: "employee" });
  const [busy, setBusy] = useState(false);

  async function refreshList() {
    try { const d = await adminApi("list"); setServerUsers(d.users || []); }
    catch { setServerUsers(null); } // pas de service role → repli sur profils anon
  }
  useEffect(() => { refreshList(); }, []);

  const source = serverUsers ?? profiles;
  const filtered = source.filter((u: any) => !search || (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase()) || (u.phone || "").includes(search));

  async function createAccount() {
    if (!form.email || !form.password) { T("⚠ Email + mot de passe requis"); return; }
    setBusy(true);
    try {
      await adminApi("create", { email: form.email, password: form.password, full_name: form.full_name || "", role: form.role || "user" });
      T("✅ Compte créé"); setShowCreate(false); setForm({ role: "employee" }); refreshList();
    } catch (e: any) { T(`❌ ${e.message}`); }
    finally { setBusy(false); }
  }
  async function setRole(userId: string, role: string) {
    try { await adminApi("setRole", { userId, role }); T("✅ Rôle mis à jour"); refreshList(); reload(); }
    catch (e: any) { T(`❌ ${e.message}`); }
  }
  async function setVip(userId: string, value: boolean) {
    try { await adminApi("setVip", { userId, value }); T(value ? "🎁 VIP gratuit activé" : "VIP retiré"); refreshList(); reload(); }
    catch (e: any) { T(`❌ ${e.message}`); }
  }
  async function del(userId: string) {
    if (!confirm("Supprimer définitivement ce compte ?")) return;
    try { await adminApi("delete", { userId }); T("🗑️ Compte supprimé"); refreshList(); reload(); }
    catch (e: any) { T(`❌ ${e.message}`); }
  }

  const roleColor = (r: string) => r === "employee" ? "bg-blue-500/15 text-blue-300" : r === "ambassador" ? "bg-amber-500/15 text-amber-300" : r === "pro" || r === "business" ? "bg-violet-500/15 text-violet-300" : r === "admin" || r === "super_admin" ? "bg-red-500/15 text-red-300" : "bg-white/10 text-gray-400";

  return (
    <>
      <PageHead title="👥 Utilisateurs & Équipe" sub={`${source.length} comptes${serverUsers ? "" : " · (liste limitée — ajoutez la clé service role)"}`}>
        <button className={btnP} onClick={() => setShowCreate((v) => !v)}>{showCreate ? "✕ Fermer" : "+ Créer un compte"}</button>
      </PageHead>

      {showCreate && (
        <div className="mb-3"><Card title="Créer un compte (employé, ambassadeur…)">
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={form.full_name || ""} onChange={(e) => setForm((v) => ({ ...v, full_name: e.target.value }))} placeholder="Nom complet" className="rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]" />
            <input value={form.email || ""} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} placeholder="Email *" className="rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]" />
            <input value={form.password || ""} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} placeholder="Mot de passe *" className="rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]" />
            <select value={form.role} onChange={(e) => setForm((v) => ({ ...v, role: e.target.value }))} className="rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none">
              <option value="employee">👨‍💼 Employé (commercial)</option>
              <option value="ambassador">🤝 Ambassadeur</option>
              <option value="pro">🚀 Vendeur Pro</option>
              <option value="user">👤 Utilisateur</option>
            </select>
          </div>
          <button disabled={busy} className={`${btnP} mt-3 disabled:opacity-60`} onClick={createAccount}>{busy ? "⏳ Création…" : "Créer le compte"}</button>
        </Card></div>
      )}

      <div className="mb-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Rechercher par nom, email ou téléphone…" className="w-full max-w-md rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3.5 py-2.5 text-[.83rem] text-white outline-none focus:border-[#6366F1]" />
      </div>
      <Card>
        {filtered.length === 0 ? <div className="py-10 text-center text-[.85rem] text-[#8B949E]">Aucun utilisateur. Créez un compte ou ajoutez la clé service role pour tout voir.</div> : (
          <div className="space-y-2">
            {filtered.map((u: any) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#21262D] bg-[#0D1117] p-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#21262D]">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[.8rem] font-bold text-white">{(u.full_name || u.email || "?")[0]?.toUpperCase()}</div>}
                </div>
                <div className="min-w-[140px] flex-1">
                  <div className="text-[.84rem] font-bold text-[#E6EDF3]">{u.full_name || "(sans nom)"}</div>
                  <div className="text-[.72rem] text-[#8B949E]">{u.email || u.phone || "—"}</div>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[.68rem] font-bold ${roleColor(u.role || "user")}`}>{u.role || "user"}</span>
                {u.free_premium && <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[.68rem] font-bold text-amber-300">🎁 VIP</span>}
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  <select value={u.role || "user"} onChange={(e) => setRole(u.id, e.target.value)} className="rounded-[7px] border border-[#30363D] bg-[#0D1117] px-2 py-1 text-[.7rem] font-bold text-[#A5B4FC] outline-none">
                    {["user", "pro", "employee", "ambassador", "admin"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => setVip(u.id, !u.free_premium)} className={`rounded-[7px] px-2.5 py-1 text-[.7rem] font-bold ${u.free_premium ? "bg-amber-500/20 text-amber-300" : "bg-white/5 text-[#FFC93C] hover:bg-amber-500/15"}`}>{u.free_premium ? "🎁 Retirer" : "🎁 VIP"}</button>
                  {serverUsers && <button onClick={() => del(u.id)} className="rounded-[7px] bg-red-500/10 px-2.5 py-1 text-[.7rem] font-bold text-red-300 hover:bg-red-500/20">🗑️</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function Finance({ purchases, counts }: { purchases: any[]; counts: any }) {
  const total = purchases.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const paid = purchases.filter(p => p.status === "paid" || p.status === "completed");
  const paidTotal = paid.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const pending = purchases.filter(p => p.status === "pending");
  const pendingTotal = pending.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  return (
    <>
      <PageHead title="💰 Finances" sub={`${purchases.length} transactions · Données réelles Supabase`} />
      <div className="mb-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Kpi grad="bg-g1" icon="💰" label="Revenus totaux (FCFA)" value={total} trend="réel" />
        <Kpi grad="bg-g8" icon="✅" label="Payés (FCFA)" value={paidTotal} trend={`${paid.length} tx`} />
        <Kpi grad="bg-g5" icon="⏳" label="En attente (FCFA)" value={pendingTotal} trend={`${pending.length} tx`} />
        <Kpi grad="bg-g3" icon="📊" label="Transactions totales" value={purchases.length} />
      </div>
      <Card title="Dernières transactions">
        {purchases.length === 0 ? <div className="py-10 text-center text-[.85rem] text-[#8B949E]">Aucune transaction enregistrée</div> : (
          <Tbl head={["Date", "Référence", "Type", "Montant", "Statut"]}>
            {purchases.map((p, i) => (
              <tr key={p.id || i} className="hover:bg-white/[.02]">
                <Td>{p.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR") : "—"}</Td>
                <Td bold>{p.ref_command || "—"}</Td>
                <Td>{p.type || "boost"}</Td>
                <Td><span className="font-extrabold text-emerald-400">{(p.amount || 0).toLocaleString("fr-FR")} FCFA</span></Td>
                <Td><span className={`rounded-md px-2 py-0.5 text-[.68rem] font-bold ${p.status === "paid" || p.status === "completed" ? "bg-emerald-500/15 text-emerald-300" : p.status === "pending" ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300"}`}>{p.status === "paid" || p.status === "completed" ? "✓ Payé" : p.status === "pending" ? "⏳ En attente" : p.status || "—"}</span></Td>
              </tr>
            ))}
          </Tbl>
        )}
      </Card>
    </>
  );
}

function AdsAdmin({ allListings, T, reload }: { allListings: any[]; T: (m: string) => void; reload: () => void }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = allListings.filter(a => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search && !(a.title || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function changeStatus(id: string, status: string) {
    const sb = createClient();
    const { error } = await sb.from("listings").update({ status }).eq("id", id);
    if (error) { T("⚠ Erreur: droits insuffisants"); return; }
    T(status === "active" ? "✅ Annonce activée" : status === "rejected" ? "❌ Annonce rejetée" : `📦 Statut → ${status}`);
    reload();
  }

  const totalViews = allListings.reduce((s: number, a: any) => s + (a.views || 0), 0);
  return (
    <>
      <PageHead title="📺 Gestion des annonces" sub={`${allListings.length} annonces totales · ${totalViews} vues`} />
      <div className="mb-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Kpi grad="bg-g1" icon="📦" label="Total" value={allListings.length} />
        <Kpi grad="bg-g8" icon="✅" label="Actives" value={allListings.filter(a => a.status === "active").length} />
        <Kpi grad="bg-g5" icon="⏳" label="En attente" value={allListings.filter(a => a.status === "pending").length} />
        <Kpi grad="bg-g3" icon="👁️" label="Vues totales" value={totalViews} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2 items-center">
        {[["all", "Toutes"], ["active", "Actives"], ["pending", "Attente"], ["inactive", "Inactives"], ["sold", "Vendues"], ["rejected", "Rejetées"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-[7px] px-3 py-1.5 text-[.76rem] font-bold transition ${filter === k ? "bg-[#6366F1] text-white" : "bg-[#21262D] text-[#8B949E] hover:text-white"}`}>{l}</button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Chercher…" className="ml-auto rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-[.8rem] text-white outline-none focus:border-[#6366F1] w-full sm:w-auto sm:max-w-[200px]" />
      </div>
      <Card>
        {filtered.length === 0 ? <div className="py-10 text-center text-[.85rem] text-[#8B949E]">Aucune annonce trouvée</div> : filtered.map((a) => (
          <div key={a.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-[9px] border border-[#21262D] bg-[#0D1117] p-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-[#21262D]">{a.image && <img src={a.image} alt="" className="h-full w-full object-cover" />}</div>
            <div className="min-w-[120px] flex-1">
              <div className="text-[.84rem] font-bold text-[#E6EDF3] truncate">{a.title}</div>
              <div className="text-[.72rem] text-[#8B949E]">{a.category || "—"} · {a.location || "—"} · {a.views || 0} vues · {a.price || "—"}</div>
            </div>
            <span className={`rounded-md px-2 py-0.5 text-[.68rem] font-bold ${a.status === "active" ? "bg-emerald-500/15 text-emerald-300" : a.status === "pending" ? "bg-amber-500/15 text-amber-300" : a.status === "sold" ? "bg-blue-500/15 text-blue-300" : a.status === "rejected" ? "bg-red-500/15 text-red-300" : "bg-white/10 text-gray-400"}`}>{a.status || "—"}</span>
            <div className="flex gap-1.5 shrink-0">
              {a.status !== "active" && <button onClick={() => changeStatus(a.id, "active")} className="rounded-[7px] bg-emerald-500/15 px-2 py-1 text-[.68rem] font-bold text-emerald-300 hover:bg-emerald-500/25">✓ Activer</button>}
              {a.status !== "rejected" && <button onClick={() => changeStatus(a.id, "rejected")} className="rounded-[7px] bg-red-500/15 px-2 py-1 text-[.68rem] font-bold text-red-300 hover:bg-red-500/25">✕ Rejeter</button>}
              {a.status !== "inactive" && a.status !== "rejected" && <button onClick={() => changeStatus(a.id, "inactive")} className="rounded-[7px] bg-white/5 px-2 py-1 text-[.68rem] font-bold text-gray-400 hover:text-white">⏸ Désactiver</button>}
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

async function callAI(payload: Record<string, any>): Promise<{ text: string; source: string }> {
  // tier "admin" → modèle Opus 4.8 (qualité max) côté super admin
  const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, tier: "admin" }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Erreur IA");
  return { text: data.text || "", source: data.source || "template" };
}

function AIBlock({ title, accent, payloadBase, fields, T }: { title: string; accent: string; payloadBase: Record<string, any>; fields: { key: string; ph: string }[]; T: (m: string) => void }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [out, setOut] = useState<string | null>(null);
  const [src, setSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true); setOut(null);
    try { const res = await callAI({ ...payloadBase, ...vals }); setOut(res.text); setSrc(res.source); }
    catch (e: any) { T(`❌ ${e.message}`); }
    finally { setLoading(false); }
  }
  return (
    <Card title={title}>
      {fields.map((f) => (
        <input key={f.key} value={vals[f.key] || ""} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} placeholder={f.ph} className="mb-2 w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]" />
      ))}
      <button disabled={loading} className={`${btnP} w-full disabled:opacity-60`} onClick={run}>{loading ? "⏳ Génération…" : "🤖 Générer avec l'IA →"}</button>
      {out && (
        <div className="mt-3 whitespace-pre-line rounded-[9px] border-l-[3px] bg-[#0D1117] p-3 text-[.8rem] leading-relaxed text-[#C9D1D9]" style={{ borderLeftColor: accent }}>
          {out}
          <div className="mt-2 flex items-center gap-2">
            <button className={btnG} onClick={() => { navigator.clipboard?.writeText(out); T("📋 Copié !"); }}>📋 Copier</button>
            <span className={`rounded-md px-1.5 py-0.5 text-[.62rem] font-bold ${src === "ai" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{src === "ai" ? "✨ IA Claude" : "📝 Modèle gratuit"}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function IA({ T }: { T: (m: string) => void }) {
  return (
    <>
      <PageHead title="🤖 Assistant IA Commercial" sub="Propulsé par Claude (Anthropic) — génération réelle de textes marketing" />
      <div className="grid gap-3 lg:grid-cols-2">
        <AIBlock title="Email commercial de prospection" accent="#6366F1" payloadBase={{ kind: "email" }} fields={[{ key: "company", ph: "Nom de l'entreprise" }, { key: "sector", ph: "Secteur (ex: automobile)" }, { key: "city", ph: "Ville" }]} T={T} />
        <AIBlock title="Message WhatsApp" accent="#25D366" payloadBase={{ kind: "whatsapp" }} fields={[{ key: "sector", ph: "Secteur" }, { key: "city", ph: "Ville" }, { key: "topic", ph: "Type (premier contact, relance…)" }]} T={T} />
        <AIBlock title="Titre d'annonce optimisé (SEO)" accent="#FFC93C" payloadBase={{ kind: "listing_title" }} fields={[{ key: "topic", ph: "Décrivez le produit/service" }]} T={T} />
        <AIBlock title="Description d'annonce" accent="#43E97B" payloadBase={{ kind: "listing_description" }} fields={[{ key: "topic", ph: "Produit/service à décrire" }]} T={T} />
        <AIBlock title="Post Facebook" accent="#4FACFE" payloadBase={{ kind: "facebook" }} fields={[{ key: "topic", ph: "Annonce à promouvoir" }]} T={T} />
      </div>
    </>
  );
}

function Points() {
  const gains = [["Créer un compte", "50"], ["Publier une annonce", "10"], ["Annonce vendue", "100"], ["Partager sur réseaux", "5"], ["Parrainer un ami", "50"], ["Parrainage converti", "200"], ["Recevoir un avis 5★", "25"], ["Se connecter / jour", "2"]];
  const rewards = [["100 pts", "1 annonce gratuite", "text-[#FFC93C]"], ["500 pts", "Mise en avant 7 jours", "text-[#4FACFE]"], ["1 000 pts", "1 mois Pack Pro offert", "text-[#A78BFA]"], ["5 000 pts", "Badge Ambassadeur Or", "text-[#FFC93C]"], ["10 000 pts", "1 an Premium offert", "text-[#F093FB]"]];
  const lead = [["Moussa Diallo", 8420, "💎 Diamant"], ["Aminata Koné", 5810, "🥇 Or"], ["Ibrahim Traoré", 3240, "🥈 Argent"], ["Fatou Sow", 1890, "🥉 Bronze"]];
  return (
    <>
      <PageHead title="⭐ Points & Fidélité" sub="Récompenser les utilisateurs actifs" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Comment gagner des points">{gains.map(([a, p]) => <div key={a} className="mb-1.5 flex items-center justify-between rounded-lg bg-[#0D1117] p-2.5 text-[.8rem]"><span className="text-[#C9D1D9]">{a}</span><span className="font-extrabold text-[#FFC93C]">+{p} pts</span></div>)}</Card>
        <Card title="Récompenses disponibles">{rewards.map(([p, n, c]) => <div key={p} className="mb-1.5 flex items-center gap-2.5 rounded-lg bg-[#0D1117] p-2.5"><span className={`w-[70px] shrink-0 text-[.8rem] font-extrabold ${c}`}>{p}</span><span className="text-[.8rem] text-[#C9D1D9]">{n}</span></div>)}</Card>
      </div>
      <div className="mt-3"><Card title="Top utilisateurs par points">
        <Tbl head={["#", "Utilisateur", "Points", "Niveau"]}>{lead.map((r, i) => <tr key={i}><Td><span className="font-extrabold text-[#FFC93C]">{i + 1}</span></Td><Td bold>{r[0]}</Td><Td><span className="font-extrabold text-emerald-400">{(r[1] as number).toLocaleString("fr-FR")}</span></Td><Td>{r[2]}</Td></tr>)}</Tbl>
      </Card></div>
    </>
  );
}

function Diffusion() {
  const pages = [["📘", "Auto Sénégal", "Automobile · 12 400 abonnés", true], ["📘", "Immo Abidjan", "Immobilier · 8 900 abonnés", true], ["📘", "Tech Dakar", "Électronique · 5 200 abonnés", true], ["📘", "Emploi Mali", "Emploi · 3 800 abonnés", false]];
  const packs = [["🆓 Basic", "Site Wanteermako", "Inclus"], ["➕ Plus", "Site + Facebook", "+ 10 000 FCFA/mois"], ["🚀 Premium", "Site + FB + WhatsApp", "+ 30 000 FCFA/mois"], ["👑 Elite", "Site + FB + WA + Sponsorisé", "+ 75 000 FCFA/mois"]];
  return (
    <>
      <PageHead title="📡 Diffusion multi-canaux" sub="Pages Facebook et groupes WhatsApp" />
      <div className="mb-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Kpi grad="bg-g1" icon="📘" label="Pages Facebook" value={12} />
        <Kpi grad="bg-g4" icon="💬" label="Groupes WhatsApp" value={28} />
        <Kpi grad="bg-g5" icon="🤖" label="Publications/mois" value={8450} />
        <Kpi grad="bg-g3" icon="👁️" label="Portée totale" value={284000} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Pages Facebook par secteur">{pages.map(([ic, n, s, on]) => <div key={n as string} className="mb-2 flex items-center gap-2.5 rounded-[9px] bg-[#0D1117] p-2.5"><span>{ic}</span><div className="flex-1"><div className="text-[.83rem] font-bold text-[#E6EDF3]">{n}</div><div className="text-[.7rem] text-[#8B949E]">{s}</div></div><span className={`rounded-md px-2 py-0.5 text-[.68rem] font-bold ${on ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-gray-400"}`}>{on ? "Active" : "Planifiée"}</span></div>)}</Card>
        <Card title="Packs de diffusion">{packs.map(([n, c, p]) => <div key={n} className="mb-2 flex flex-wrap items-center justify-between gap-1 rounded-[9px] bg-[#0D1117] p-2.5"><div><div className="text-[.82rem] font-bold text-[#E6EDF3]">{n}</div><div className="text-[.71rem] text-[#8B949E]">{c}</div></div><span className="text-[.78rem] font-extrabold text-[#FFC93C]">{p}</span></div>)}</Card>
      </div>
    </>
  );
}

function Rapports({ T, allListings, profiles, purchases }: { T: (m: string) => void; allListings: any[]; profiles: any[]; purchases: any[] }) {
  function downloadCSV(filename: string, headers: string[], rows: string[][]) {
    const bom = "\uFEFF";
    const csv = bom + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    T(`✅ ${filename} téléchargé !`);
  }

  const exportAnnonces = () => downloadCSV("annonces_annonce_id.csv", ["Titre", "Catégorie", "Prix", "Lieu", "Statut", "Vues", "Date"], allListings.map(a => [a.title || "", a.category || "", a.price || "", a.location || "", a.status || "", String(a.views || 0), a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : ""]));
  const exportUsers = () => downloadCSV("utilisateurs_annonce_id.csv", ["Nom", "Rôle", "Téléphone", "Crédits", "Date inscription"], profiles.map(u => [u.full_name || "", u.role || "user", u.phone || "", String(u.free_ads_remaining ?? 0), u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : ""]));
  const exportFinances = () => downloadCSV("finances_annonce_id.csv", ["Référence", "Type", "Montant", "Statut", "Date"], purchases.map(p => [p.ref_command || "", p.type || "", String(p.amount || 0), p.status || "", p.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR") : ""]));

  const raps = [
    ["📦", "Export Annonces", `CSV · ${allListings.length} annonces`, "bg-g1", exportAnnonces],
    ["👥", "Export Utilisateurs", `CSV · ${profiles.length} comptes`, "bg-g5", exportUsers],
    ["💰", "Export Finances", `CSV · ${purchases.length} transactions`, "bg-g4", exportFinances],
  ] as const;

  return (
    <>
      <PageHead title="📄 Rapports & Exports" sub="Export CSV de vos données réelles" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {raps.map(([ic, t, s, g, fn]) => (
          <div key={t} className="cursor-pointer rounded-[18px] border border-[#21262D] bg-[#161B22] p-4 transition hover:border-[#6366F1]">
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-[12px] text-[1.2rem] ${g}`}>{ic}</div>
            <h3 className="text-[.88rem] font-bold text-[#E6EDF3]">{t}</h3>
            <p className="mb-3 text-[.76rem] text-[#8B949E]">{s}</p>
            <button className={btnP} onClick={() => fn()}>⬇ Télécharger CSV</button>
          </div>
        ))}
      </div>
    </>
  );
}

function Settings({ T }: { T: (m: string) => void }) {
  const tarifs = [["Pack Basic (mensuel)", "25000"], ["Pack Pro (mensuel)", "75000"], ["Pack Premium (mensuel)", "150000"], ["Pack Enterprise (mensuel)", "300000"], ["Boost Premium", "3500"], ["Boost À la Une", "9000"], ["Commission ambassadeurs (%)", "10"]];
  const [toggles, setToggles] = useState<Record<string, boolean>>({ "Mode maintenance": false, "Inscriptions ouvertes": true, "Programme ambassadeurs": true, "Assistant IA": true, "Diffusion Facebook auto": true, "Paiements actifs": true });
  return (
    <>
      <PageHead title="⚙️ Paramètres système" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Tarifs des offres (FCFA)">
          <div className="space-y-2.5">
            {tarifs.map(([l, v]) => <div key={l}><label className="mb-1 block text-[.75rem] font-bold text-[#8B949E]">{l}</label><input defaultValue={v} className="w-full rounded-[9px] border-[1.5px] border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.85rem] font-bold text-[#FFC93C] outline-none focus:border-[#6366F1]" /></div>)}
            <button className={`${btnP} w-full`} onClick={() => T("✅ Tarifs sauvegardés")}>Sauvegarder les tarifs</button>
          </div>
        </Card>
        <Card title="Toggles système">
          <div className="space-y-2.5">
            {Object.entries(toggles).map(([n, on]) => (
              <div key={n} className="flex items-center justify-between rounded-[9px] bg-[#0D1117] p-2.5">
                <span className="text-[.83rem] font-semibold text-[#C9D1D9]">{n}</span>
                <button onClick={() => { setToggles((t) => ({ ...t, [n]: !t[n] })); T("Paramètre modifié"); }} className={`relative h-[22px] w-10 rounded-full transition ${on ? "bg-emerald-500" : "bg-[#30363D]"}`}><span className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[21px]" : "left-[3px]"}`} /></button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ───────── Table helpers ───────── */
function Tbl({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[600px]">
        <thead><tr>{head.map((h) => <th key={h} className="border-b border-[#21262D] px-3 py-2.5 text-left text-[.68rem] font-bold uppercase tracking-wide text-[#484F58]">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Td({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return <td className={`border-b border-[#21262D] px-3 py-2.5 text-[.82rem] ${bold ? "font-bold text-[#E6EDF3]" : "text-[#C9D1D9]"}`}>{children}</td>;
}
