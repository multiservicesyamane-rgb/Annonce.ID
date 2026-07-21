"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BOOSTS, SUBSCRIPTION_PLANS, CATEGORIES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { FB_GROUPS } from "@/lib/social-groups";

/* ───────── Données mock (plan stratégique B2B) ───────── */
const GRADS = ["bg-g1", "bg-g2", "bg-g3", "bg-g4", "bg-g5", "bg-g6", "bg-g7", "bg-g8"];

const NAV: { id: string; icon: string; label: string; section?: string; badge?: number }[] = [
  { id: "overview", icon: "📊", label: "Vue d'ensemble", section: "Tableau de bord" },
  { id: "crm", icon: "🎯", label: "CRM Prospects" },
  { id: "marketing", icon: "📢", label: "Centre Marketing" },
  { id: "campagne_ia", icon: "🚀", label: "Campagne IA 2025" },
  { id: "campagnes", icon: "📨", label: "Campagnes" },
  { id: "employes", icon: "👨‍💼", label: "Employés", section: "Commercial" },
  { id: "ambassadeurs", icon: "🤝", label: "Ambassadeurs" },
  { id: "offres", icon: "💎", label: "Offres commerciales" },
  { id: "moderation", icon: "🛡️", label: "Modération", section: "Plateforme" },
  { id: "import", icon: "🛒", label: "Import Produits" },
  { id: "users", icon: "👥", label: "Utilisateurs" },
  { id: "encaissement", icon: "💵", label: "Encaissement (espèces)" },
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

const ADMIN_CREDS = { email: "multiservicesyamane@gmail.com", pass: "", emails: ["multiservicesyamane@gmail.com", "multiserviceyamane@gmail.com"] };

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
    <div className="min-w-0 overflow-hidden rounded-[18px] border border-[#21262D] bg-[#161B22] p-3 sm:p-4">
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
    let alive = true;
    fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "ping" }),
    })
      .then((res) => { if (alive && res.ok) setAuthed(true); })
      .catch(() => { if (alive) setAuthed(false); });
    return () => { alive = false; };
  }, []);

  // Fonction de chargement complète
  const loadAllData = async () => {
    if (!authed) return;
    setDataLoading(true);
    try {
      const data = await adminApi("dashboard");
      setCounts(data.counts || { total: 0, pending: 0, active: 0, users: 0, favorites: 0, messages: 0, reports: 0 });
      setPendingListings(data.pendingListings || []);
      setAllListings(data.allListings || []);
      setProfiles(data.profiles || []);
      setPurchases(data.purchases || []);
      setReports(data.reports || []);
      setProspects(data.prospects || []);
      setAmbassadors(data.ambassadors || []);
      setEmployees(data.employees || []);
      setCampaigns(data.campaigns || []);
    } catch (e) {
      console.error("SuperAdmin secure load error:", e);
      T("Acces admin refuse ou configuration serveur manquante.");
    }
    setDataLoading(false);
    return;
    /*
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

      // Achats — via service role (bypass RLS) sinon les Finances restent vides
      let purchData: any[] = [];
      try { const d = await adminApi("purchases"); purchData = d.purchases || []; }
      catch { const r = await sb.from("purchases").select("*").order("created_at", { ascending: false }).limit(50); purchData = r.data || []; }
      setPurchases(purchData);

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
    */
    setDataLoading(false);
  };

  // Qualification IA (score + accroche WhatsApp) des prospects sans score.
  // Traite un petit lot par clic ; recliquer tant qu'il en reste.
  async function qualifyProspectsUi() {
    T("🤖 Qualification IA en cours…");
    try {
      const d = await adminApi("qualifyProspects");
      if (d.skipped) { T(`⚠ ${d.reason}`); return; }
      T(`✅ ${d.qualified} prospect(s) qualifié(s)${d.remaining ? ` — ${d.remaining} restant(s), recliquez` : " — tout est à jour"}`);
      loadAllData();
    } catch (e: any) {
      T(`⚠ ${e?.message || "Erreur qualification"}`);
    }
  }

  // Envoi de l'email de prospection à un prospect (plafond 15/jour côté serveur).
  async function sendProspectEmailUi(id: string) {
    try {
      const d = await adminApi("sendProspectEmail", { id });
      T(`✉️ Email envoyé (${d.sentToday}/${d.cap} aujourd'hui)`);
      loadAllData();
      return true;
    } catch (e: any) {
      T(`⚠ ${e?.message || "Envoi impossible"}`);
      return false;
    }
  }

  // Marque un prospect comme désinscrit (réponse STOP).
  async function optOutProspectUi(id: string) {
    try {
      await adminApi("optOutProspect", { id });
      T("🚫 Prospect désinscrit (STOP)");
      loadAllData();
    } catch (e: any) {
      T(`⚠ ${e?.message || "Erreur"}`);
    }
  }

  // Ajout réel d'un prospect dans la table
  async function addProspect(p: Record<string, any>) {
    return addRow("prospects", p, "Prospect ajoute");
    /*
    const sb = createClient();
    const { error } = await sb.from("prospects").insert(p);
    if (error) { T(`⚠ ${error.message.includes("row-level") ? "Accès refusé (RLS) — voir SQL admin" : error.message}`); return false; }
    T("✅ Prospect ajouté");
    loadAllData();
    return true;
    */
  }
  async function addRow(table: string, payload: Record<string, any>, okMsg: string) {
    try {
      await adminApi("b2bInsert", { table, payload });
      T(okMsg);
      loadAllData();
      return true;
    } catch (error: any) {
      T(`Erreur admin: ${error?.message || "enregistrement impossible"}`);
      return false;
    }
    /*
    const sb = createClient();
    let p: Record<string, any> = { ...payload };
    for (let i = 0; i < 10; i++) {
      const { error } = await sb.from(table).insert(p);
      if (!error) { T(okMsg); loadAllData(); return true; }
      const m = error.message || "";
      // Colonne absente → on la retire et on réessaie (schéma partiel)
      const match = m.match(/'([^']+)' column/) || m.match(/column "([^"]+)"/) || m.match(/Could not find the '([^']+)'/);
      if (match && match[1] in p) { delete p[match[1]]; continue; }
      T(`⚠ ${m.includes("row-level") ? "Accès refusé (RLS) — relance SETUP_SUPABASE.sql" : m}`);
      return false;
    }
    T("⚠ Impossible d'enregistrer (schéma incompatible)");
    return false;
    */
  }
  const addCampaign = (p: Record<string, any>) => addRow("campaigns", p, "✅ Campagne créée");
  const addEmployee = (p: Record<string, any>) => addRow("employees", p, "✅ Employé ajouté");

  useEffect(() => { loadAllData(); }, [authed]);

  async function doLogin() {
    if (!ADMIN_CREDS.emails.includes(email.toLowerCase().trim()) || !pass) {
      T("Identifiants incorrects");
      return;
    }
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ pass, otp: code.trim(), action: "ping" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Non autorise");
      setPass("");
      setCode("");
      setAuthed(true);
      T("Bienvenue, Super Administrateur");
    } catch (error: any) {
      T(error?.message || "Identifiants incorrects");
    }
  }
  async function doLogout() {
    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "logout" }),
      });
    } finally {
      setAuthed(false);
    }
  }

  async function moderate(id: string, status: string) {
    try {
      await adminApi("setListingStatus", { listingId: id, status });
    } catch {
      T("Action bloquee (droits admin requis cote serveur)");
      return;
    }
    setPendingListings((p) => p.filter((x) => x.id !== id));
    setCounts((c) => ({ ...c, pending: Math.max(0, c.pending - 1), active: status === "active" ? c.active + 1 : c.active }));
    T(status === "active" ? "Annonce approuvee" : "Annonce rejetee");
    return;
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
          <img src="/icon-512.png?v=3" alt="Wanteermako" className="mx-auto mb-4 h-16 w-16 rounded-2xl object-contain shadow-[0_0_30px_rgba(99,102,241,.4)]" />
          <h1 className="text-center text-[1.2rem] font-extrabold text-white">Super Admin</h1>
          <p className="mb-6 text-center text-[.82rem] text-[#8B949E]">Wanteermako · YamaneTech</p>
          <input className="mb-2.5 w-full rounded-[10px] border-[1.5px] border-[#30363D] bg-[#0D1117] px-3.5 py-2.5 text-[.88rem] text-white outline-none focus:border-[#6366F1]" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email administrateur" />
          <input className="mb-2.5 w-full rounded-[10px] border-[1.5px] border-[#30363D] bg-[#0D1117] px-3.5 py-2.5 text-[.88rem] text-white outline-none focus:border-[#6366F1]" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Mot de passe" />
          <input className="mb-2.5 w-full rounded-[10px] border-[1.5px] border-[#30363D] bg-[#0D1117] px-3.5 py-2.5 text-[.88rem] text-white outline-none focus:border-[#6366F1]" type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} placeholder="Code 2FA" />
          <button onClick={doLogin} className="w-full rounded-[10px] bg-g1 py-2.5 text-[.9rem] font-extrabold text-white shadow-[0_4px_20px_rgba(99,102,241,.35)] hover:-translate-y-px transition">Accéder au Super Admin →</button>
        </div>
        {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-[9px] bg-[#E6EDF3] px-4 py-2.5 text-[.82rem] font-bold text-[#1A1F36] shadow-lg">{toast}</div>}
      </div>
    );
  }

  /* ───────── APP ───────── */
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[#0D1117] text-white">
      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 z-[200] w-[240px] flex flex-col border-r border-[#21262D] bg-[#161B22] transition-transform ${sbOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex items-center gap-2.5 border-b border-[#21262D] px-4 py-4">
          <img src="/icon-512.png?v=3" alt="Wanteermako" className="h-9 w-9 rounded-[9px] object-contain shadow-[0_0_16px_rgba(99,102,241,.4)]" />
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
                {(() => {
                  const b = n.id === "moderation" ? counts.pending : n.id === "crm" ? prospects.filter((p: any) => p.status === "new").length : 0;
                  return b > 0 ? <span className="ml-auto rounded-md bg-red-500 px-1.5 py-0.5 text-[.58rem] font-bold text-white">{b}</span> : null;
                })()}
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

        <div className="mx-auto w-full min-w-0 max-w-[1500px] overflow-x-hidden p-3 sm:p-5">
          {dataLoading && page !== "overview" ? (
            <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" /></div>
          ) : (<>
            {page === "overview" && <Overview counts={counts} allListings={allListings} profiles={profiles} purchases={purchases} T={T} loading={dataLoading} reload={loadAllData} />}
            {page === "crm" && <CRM T={T} prospects={prospects} addProspect={addProspect} qualify={qualifyProspectsUi} sendEmail={sendProspectEmailUi} optOut={optOutProspectUi} />}
            {page === "marketing" && <Marketing T={T} />}
            {page === "campagne_ia" && <CampagneIA T={T} allListings={allListings} />}
            {page === "campagnes" && <Campagnes campaigns={campaigns} addCampaign={addCampaign} T={T} />}
            {page === "employes" && <Employes employees={employees} addEmployee={addEmployee} T={T} />}
            {page === "ambassadeurs" && <Ambassadeurs T={T} ambassadors={ambassadors} />}
            {page === "offres" && <Offres T={T} />}
            {page === "moderation" && <Moderation items={pendingListings} moderate={moderate} />}
            {page === "import" && <ImportProduits T={T} reload={loadAllData} profiles={profiles} />}
            {page === "users" && <Users profiles={profiles} T={T} reload={loadAllData} />}
            {page === "encaissement" && <Encaissement profiles={profiles} allListings={allListings} T={T} reload={loadAllData} />}
            {page === "finance" && <Finance purchases={purchases} counts={counts} />}
            {page === "ads" && <AdsAdmin allListings={allListings} T={T} reload={loadAllData} />}
            {page === "ia" && <IA T={T} />}
            {page === "points" && <Points profiles={profiles} />}
            {page === "diffusion" && <Diffusion allListings={allListings} T={T} />}
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

function Overview({ counts, allListings, profiles, purchases, T, loading, reload }: { counts: any; allListings: any[]; profiles: any[]; purchases: any[]; T: (m: string) => void; loading: boolean; reload: () => void }) {
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
        <button className={btnG} onClick={() => { reload(); T("Actualisation…"); }}>{loading ? "⏳" : "🔄"} Rafraîchir</button>
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
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="Répartition par catégorie" sub={`${Object.keys(byCat).length} catégories`}>
          {catEntries.length === 0 ? <div className="py-4 text-center text-[.82rem] text-[#8B949E]">Aucune annonce</div> : catEntries.map(([n, c], i) => {
            const pct = counts.total ? Math.min(100, Math.max(0, (c / counts.total) * 100)) : 0;
            return (
              <div key={n} className="mb-2.5 min-w-0">
                <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-[.8rem] text-[#C9D1D9]"><span className="min-w-0 truncate">{n}</span><span className="shrink-0 font-extrabold">{c} annonces</span></div>
                <div className="h-[7px] min-w-0 overflow-hidden rounded bg-[#21262D]"><div className="h-full max-w-full rounded" style={{ width: `${pct}%`, background: catColors[i % 6] }} /></div>
              </div>
            );
          })}
        </Card>
        <Card title="Statuts des annonces">
          {statusData.map(([n, c, v]) => {
            const pct = counts.total ? Math.min(100, Math.max(0, ((v as number) / counts.total) * 100)) : 0;
            return (
              <div key={n as string} className="mb-2 flex min-w-0 items-center gap-2.5">
                <div className="w-[72px] shrink-0 truncate text-[.76rem] font-semibold text-[#8B949E] sm:w-[80px]">{n}</div>
                <div className="relative h-6 min-w-0 flex-1 overflow-hidden rounded-md bg-[#0D1117]"><div className="h-full max-w-full rounded-md" style={{ width: `${pct}%`, background: c as string }} /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[.7rem] font-extrabold text-white">{v as number}</span></div>
              </div>
            );
          })}
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

// Tableau de bord « Objectif 100 » — suivi mensuel de l'acquisition.
function AcquisitionTracker() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { adminApi("acquisitionStats").then(setS).catch(() => {}); }, []);
  if (!s) return null;

  const mois = new Date().toLocaleDateString("fr-FR", { month: "long" });
  const Bar = ({ label, val, target, color }: { label: string; val: number; target: number; color: string }) => {
    const pct = Math.min(100, Math.round((val / target) * 100));
    return (
      <div className="rounded-[12px] border border-[#21262D] bg-[#0D1117] p-3.5">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[.75rem] font-bold text-[#8B949E]">{label}</span>
          <span className="text-[.8rem] font-extrabold text-white">{val}<span className="text-[#484F58]">/{target}</span></span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#21262D]">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="mt-1 text-right text-[.65rem] font-bold" style={{ color }}>{pct}%</div>
      </div>
    );
  };
  const Tile = ({ label, val, icon }: { label: string; val: number | string; icon: string }) => (
    <div className="rounded-[12px] border border-[#21262D] bg-[#0D1117] p-3.5">
      <div className="text-[1.35rem] font-extrabold text-white">{icon} {val}</div>
      <div className="mt-0.5 text-[.7rem] text-[#8B949E]">{label}</div>
    </div>
  );

  return (
    <div className="mb-5 rounded-[14px] border border-[#6366F1]/30 bg-gradient-to-br from-[#6366F1]/10 to-transparent p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[.95rem] font-extrabold text-white">🎯 Objectif du mois — {mois}</h2>
        <span className="text-[.68rem] text-[#8B949E]">mise à jour en direct</span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Bar label="Vendeurs inscrits ce mois" val={s.signupsMonth} target={s.targetSignups} color="#3FB950" />
        <Bar label="Abonnés PRO" val={s.proTotal} target={s.targetPro} color="#FFC93C" />
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Tile label="Boutiques créées (mois)" val={s.boutiquesMonth} icon="🏪" />
        <Tile label="Emails prospection (mois)" val={s.emailsMonth} icon="✉️" />
        <Tile label={`Emails aujourd'hui (max ${s.emailCap})`} val={`${s.emailsToday}/${s.emailCap}`} icon="📧" />
        <Tile label="Parrainages ce mois" val={s.referralsMonth} icon="🤝" />
      </div>
    </div>
  );
}

function CRM({ T, prospects, addProspect, qualify, sendEmail, optOut }: { T: (m: string) => void; prospects: any[]; addProspect: (p: Record<string, any>) => Promise<boolean>; qualify: () => Promise<void>; sendEmail: (id: string) => Promise<boolean>; optOut: (id: string) => Promise<void> }) {
  const [form, setForm] = useState(false);
  const [f, setF] = useState<Record<string, string>>({ status: "new", pack: "Basic" });
  const [sending, setSending] = useState<string | null>(null);
  const stages: [string, string, string][] = [["🆕", "Nouveaux", "new"], ["📤", "Contactés", "ct"], ["🤝", "Intéressés", "int"], ["📅", "Rendez-vous", "rdv"], ["✅", "Clients", "cli"], ["❌", "Refusés", "ref"]];
  const countBy = (st: string) => prospects.filter((p) => p.status === st).length;

  // Compteur d'envois du jour (calculé depuis les prospects chargés).
  // Indicatif : le vrai plafond serveur = PROSPECT_EMAIL_DAILY_CAP (défaut 40).
  const CAP = 40;
  const isToday = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();
  const sentToday = prospects.filter((p) => isToday(p.email_sent_at)).length;
  const withEmail = prospects.filter((p) => p.email && !p.email_opt_out).length;

  async function submit() {
    if (!f.name?.trim()) { T("⚠ Nom requis"); return; }
    const ok = await addProspect({ name: f.name, sector: f.sector || null, city: f.city || null, email: f.email || null, phone: f.phone || null, status: f.status || "new", pack: f.pack || null });
    if (ok) { setForm(false); setF({ status: "new", pack: "Basic" }); }
  }

  return (
    <>
      <AcquisitionTracker />

      <PageHead title="🎯 CRM — Prospects" sub={`${prospects.length} prospect(s) · ${countBy("cli")} client(s) · ${withEmail} avec email`}>
        <span className={`rounded-[9px] border px-3 py-2 text-[.78rem] font-bold ${sentToday >= CAP ? "border-[#F85149]/40 bg-[#F85149]/10 text-[#F85149]" : "border-[#30363D] bg-[#0D1117] text-[#8B949E]"}`} title="Emails de prospection envoyés aujourd'hui (plafond quotidien)">
          ✉️ {sentToday}/{CAP} aujourd'hui
        </span>
        <button className={btnP} onClick={() => qualify()}>🤖 Qualifier IA</button>
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
        ) : [...prospects].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)).map((p) => {
          const waNumber = (p.whatsapp || p.phone || "").replace(/\D/g, "");
          const waLink = waNumber ? `https://wa.me/${waNumber}${p.accroche_whatsapp ? `?text=${encodeURIComponent(p.accroche_whatsapp)}` : ""}` : "";
          const emailSent = isToday(p.email_sent_at) || !!p.email_sent_at;
          const canSend = p.email && !p.email_opt_out && !p.email_sent_at && sentToday < CAP;
          return (
          <div key={p.id} className={`mb-2 flex flex-wrap items-center gap-3 rounded-[12px] border p-2.5 ${p.email_opt_out ? "border-[#F85149]/30 bg-[#F85149]/5 opacity-70" : "border-[#21262D] bg-[#0D1117]"}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-g1 text-[1rem] font-bold text-white">{(p.name || "?").slice(0, 1).toUpperCase()}</div>
            <div className="min-w-[140px] flex-1"><div className="text-[.84rem] font-bold text-[#E6EDF3]">{p.name}</div><div className="text-[.72rem] text-[#8B949E]">{p.sector || "—"} · {p.city || "—"}{p.email ? <> · <span className="text-[#A5B4FC]">{p.email}</span></> : null}</div></div>
            {typeof p.score === "number" && (
              <span title="Score IA de pertinence (0-100)" className={`rounded-md px-2 py-0.5 text-[.68rem] font-bold ${p.score >= 70 ? "bg-[#2EA043]/20 text-[#3FB950]" : p.score >= 40 ? "bg-[#D29922]/20 text-[#E3B341]" : "bg-white/10 text-gray-300"}`}>⭐ {p.score}</span>
            )}
            {p.email_opt_out
              ? <span className="rounded-md bg-[#F85149]/20 px-2 py-0.5 text-[.68rem] font-bold text-[#F85149]">🚫 STOP</span>
              : <span className={`rounded-md px-2 py-0.5 text-[.68rem] font-bold ${ST_PILL[p.status] || "bg-white/10 text-gray-300"}`}>{ST_LABELS[p.status] || p.status}</span>}
            <div className="flex gap-1.5">
              {p.email && !p.email_opt_out && (
                emailSent
                  ? <span title="Email de prospection déjà envoyé" className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#2EA043]/15 text-[.78rem]">✅</span>
                  : <button
                      disabled={!canSend || sending === p.id}
                      onClick={async () => { setSending(p.id); await sendEmail(p.id); setSending(null); }}
                      title={sentToday >= CAP ? "Plafond du jour atteint (15)" : "Envoyer l'email de prospection"}
                      className={`flex h-7 w-7 items-center justify-center rounded-[7px] text-[.78rem] ${canSend ? "bg-white/5 hover:bg-[#6366F1]/30" : "cursor-not-allowed bg-white/5 opacity-40"}`}
                    >{sending === p.id ? "…" : "📧"}</button>
              )}
              {waLink && <a href={waLink} target="_blank" title={p.accroche_whatsapp ? "WhatsApp avec message IA pré-rempli" : "WhatsApp"} className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-white/5 text-[.78rem] hover:bg-[#25D366]/20">💬</a>}
              {!p.email_opt_out && <button onClick={() => optOut(p.id)} title="Marquer STOP (désinscrire)" className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-white/5 text-[.78rem] hover:bg-[#F85149]/20">🚫</button>}
            </div>
          </div>
          );
        })}
      </Card></div>
    </>
  );
}

function Marketing({ T }: { T: (m: string) => void }) {
  const [view, setView] = useState<any>(null);
  return (
    <>
      <PageHead title="📢 Centre Marketing" sub="Templates email & WhatsApp prêts à l'emploi" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <div key={t.t} className="flex flex-col gap-2 rounded-[12px] border border-[#21262D] bg-[#0D1117] p-3.5 hover:border-[#6366F1]">
            <div className="flex items-center justify-between"><span className={`text-[.64rem] font-bold uppercase tracking-wide ${t.catC}`}>{t.cat}</span><span className="text-[.68rem] text-[#484F58]">{t.cat === "WhatsApp" ? "WhatsApp" : "Email"}</span></div>
            <div className="text-[.88rem] font-bold text-[#E6EDF3]">{t.t}</div>
            <div className="line-clamp-2 text-[.75rem] leading-relaxed text-[#8B949E]">{t.p}</div>
            <div className="mt-1 flex gap-1.5">
              <button onClick={() => setView(t)} className="rounded-[7px] border border-[#30363D] bg-[#161B22] px-2.5 py-1 text-[.7rem] font-bold text-[#8B949E] hover:text-[#A5B4FC]">👁 Voir</button>
              <button onClick={() => { navigator.clipboard?.writeText(t.p); T("📋 Copié dans le presse-papier !"); }} className="rounded-[7px] border border-[#30363D] bg-[#161B22] px-2.5 py-1 text-[.7rem] font-bold text-[#8B949E] hover:text-[#A5B4FC]">📋 Copier</button>
            </div>
          </div>
        ))}
      </div>
      {view && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" onClick={() => setView(null)}>
          <div className="w-full max-w-[480px] rounded-[14px] border border-[#30363D] bg-[#161B22] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between"><h3 className="text-[1rem] font-bold text-white">{view.t}</h3><button onClick={() => setView(null)} className="text-gray-400 text-xl">✕</button></div>
            <span className={`text-[.64rem] font-bold uppercase ${view.catC}`}>{view.cat}</span>
            <p className="mt-2 whitespace-pre-wrap rounded-[10px] bg-[#0D1117] p-3 text-[.83rem] leading-relaxed text-[#C9D1D9]">{view.p}</p>
            <button onClick={() => { navigator.clipboard?.writeText(view.p); T("📋 Copié !"); }} className={`${btnP} mt-3 w-full`}>📋 Copier le texte</button>
          </div>
        </div>
      )}
    </>
  );
}

function CampagneIA({ T, allListings }: { T: (m: string) => void; allListings: any[] }) {
  const [stats, setStats] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [boosts, setBoosts] = useState<any[]>([]);
  const [influ, setInflu] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dashboard" | "planning" | "influenceurs" | "rapports">("dashboard");
  const [fPlat, setFPlat] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fWeek, setFWeek] = useState("all");

  // Modals & Forms
  const [iForm, setIForm] = useState<Record<string, any>>({ collaboration_type: "barter", status: "contacte" });
  const [showI, setShowI] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactInflu, setContactInflu] = useState<any>(null);
  const [contactMsg, setContactMsg] = useState("");

  const [weekOffset, setWeekOffset] = useState(0);
  const [selPost, setSelPost] = useState<any>(null);
  const [selSlot, setSelSlot] = useState<{ day: Date; slotIndex: number } | null>(null);
  const [pForm, setPForm] = useState<Record<string, any>>({ platform: "all", status: "scheduled" });

  const [selBoostPost, setSelBoostPost] = useState<any>(null);
  const [showR, setShowR] = useState(false);
  const [rForm, setRForm] = useState<Record<string, any>>({
    week_start: new Date().toISOString().slice(0, 10),
    total_views: 0,
    total_new_followers: 0,
    avg_engagement_rate: 0,
    total_clicks: 0,
    revenue_fcfa: 0,
    boosts_sold: 0,
    notes: ""
  });

  const [publishing, setPublishing] = useState(false);

  function loadCampaign() {
    adminApi("campaign").then((d) => { setStats(d.stats || []); setPosts(d.posts || []); setBoosts(d.boosts || []); setInflu(d.influ || []); setReports(d.reports || []); })
      .catch(() => { /* tables pas encore créées */ }).finally(() => setLoading(false));
  }
  useEffect(() => { loadCampaign(); }, []);

  // Publication automatique multi-réseaux (Gemini + Telegram/Facebook) à la demande.
  async function runAutoPublish() {
    if (publishing) return;
    setPublishing(true);
    try {
      const d = await adminApi("campaignAutoPublish");
      if (d.message) T(`ℹ️ ${d.message}`);
      else T(`✅ ${d.published} post(s) publié(s) sur ${(d.platforms || []).join(", ")}`);
      loadCampaign();
    } catch (e: any) {
      T(`❌ ${e.message || "Échec de la publication"}`);
    } finally {
      setPublishing(false);
    }
  }

  function getSlotDateTimeString(day: Date, timeStr: string) {
    const yyyymmdd = day.toISOString().slice(0, 10);
    return `${yyyymmdd}T${timeStr || "07:00"}:00+01:00`;
  }

  // Post Actions
  async function savePost() {
    if (!pForm.caption && (!pForm.annonce_ids || pForm.annonce_ids.length === 0)) {
      T("⚠ Légende requise ou sélectionnez au moins un produit");
      return;
    }
    const dt = getSlotDateTimeString(selSlot!.day, pForm.time || "07:00");
    const scheduledDate = new Date(dt);
    const now = new Date();

    // Empecher de planifier dans le passé
    if (scheduledDate < now && (pForm.status === "scheduled" || pForm.status === "published")) {
      T("⚠ L'heure choisie est dans le passé. Veuillez choisir une heure future.");
      return;
    }

    try {
      if (!pForm.id && pForm.annonce_ids && pForm.annonce_ids.length > 0) {
        // Planification multiple : boucle sur chaque annonce sélectionnée
        for (const adId of pForm.annonce_ids) {
          const ad = allListings.find(a => a.id === adId);
          const customCaption = `🔥 À NE PAS MANQUER ! \n\n👉 ${ad?.title || "Produit"} à ${(ad?.price || 0).toLocaleString("fr-FR")} FCFA \n\n📍 Disponible à ${ad?.location || "Dakar"}. Contactez le vendeur sur wanteermako.com !`;
          const payload = {
            platform: pForm.platform || "all",
            caption: customCaption,
            image_url: ad?.image || pForm.image_url || null,
            scheduled_at: dt,
            status: pForm.status || "scheduled",
            annonce_id: adId,
          };
          await adminApi("campaignPostSave", { row: payload });
        }
        T("✅ Publications planifiées avec succès");
      } else {
        // Sauvegarde d'une seule publication
        if (!pForm.caption) { T("⚠ Légende requise"); return; }
        const payload = {
          id: pForm.id || undefined,
          platform: pForm.platform || "all",
          caption: pForm.caption,
          image_url: pForm.image_url || null,
          scheduled_at: dt,
          status: pForm.status || "scheduled",
          annonce_id: pForm.annonce_id || null,
        };
        await adminApi("campaignPostSave", { row: payload });
        T(pForm.id ? "✅ Post mis à jour" : "✅ Post planifié");
      }
      setSelSlot(null);
      setPForm({ platform: "all", status: "scheduled" });
      loadCampaign();
    } catch (e: any) {
      T(`❌ ${e.message}`);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Supprimer ce post ?")) return;
    try {
      await adminApi("campaignPostDelete", { id });
      T("🗑️ Post supprimé");
      setSelPost(null);
      loadCampaign();
    } catch (e: any) {
      T(`❌ ${e.message}`);
    }
  }

  async function triggerRepublier(post: any) {
    if (!confirm("Republier ce post directement sur Facebook (API Meta) ?")) return;
    try {
      await adminApi("campaignPostRepublish", { postId: post.id });
      T("🚀 Publication Facebook relancée !");
    } catch (e: any) {
      T(`❌ ${e.message}`);
    }
  }

  async function handleBoostPost(plan: any) {
    if (!selBoostPost) return;
    try {
      const days = plan.key === "vip" ? 30 : 7;
      await adminApi("campaignBoostSave", {
        row: {
          annonce_id: selBoostPost.annonce_id || null,
          plan_key: plan.key,
          duration_days: days,
          platform: selBoostPost.platform || "both",
          budget_fcfa: plan.price,
          status: "active"
        }
      });
      T(`🔥 Boost "${plan.name}" activé pour l'annonce !`);
      setSelBoostPost(null);
      loadCampaign();
    } catch (e: any) {
      T(`❌ ${e.message}`);
    }
  }

  // Influenceur Actions
  async function saveInflu() {
    if (!iForm.nom) { T("⚠ Nom requis"); return; }
    try {
      await adminApi("campaignInfluSave", {
        row: {
          id: iForm.id || undefined,
          nom: iForm.nom,
          plateforme: iForm.plateforme || null,
          handle: iForm.handle || null,
          followers: Number(iForm.followers) || 0,
          collaboration_type: iForm.collaboration_type || "barter",
          cout_fcfa: Number(iForm.cout_fcfa) || 0,
          status: iForm.status || "contacte",
          reach_genere: Number(iForm.reach_genere) || 0
        }
      });
      T("✅ Influenceur enregistré");
      setShowI(false);
      setIForm({ collaboration_type: "barter", status: "contacte" });
      loadCampaign();
    } catch (e: any) {
      T(`❌ ${e.message}`);
    }
  }

  async function setInfluStatus(id: string, status: string) {
    try {
      await adminApi("campaignInfluSave", { row: { id, status } });
      loadCampaign();
    } catch (e: any) {
      T(`❌ ${e.message}`);
    }
  }

  async function delInflu(id: string) {
    if (!confirm("Supprimer cet influenceur ?")) return;
    try {
      await adminApi("campaignInfluDelete", { id });
      T("🗑️ Supprimé");
      loadCampaign();
    } catch (e: any) {
      T(`❌ ${e.message}`);
    }
  }

  const openContact = (inf: any) => {
    setContactInflu(inf);
    const msg = `Bonjour ${inf.nom} ! 👋 \n\nNous adorons votre travail sur ${inf.handle} (${inf.followers.toLocaleString("fr-FR")} abonnés). \n\nNous gérons la plateforme d'annonces localisées wanteermako.com et aimerions collaborer avec vous pour faire grandir notre communauté. Seriez-vous disponible pour en discuter ? \n\nMerci !`;
    setContactMsg(msg);
    setShowContact(true);
  };

  const handleContactAction = () => {
    navigator.clipboard?.writeText(contactMsg);
    T("📋 Message copié !");
    setShowContact(false);

    const cleanHandle = (contactInflu.handle || "").replace('@', '').trim();
    const plat = (contactInflu.plateforme || "").toLowerCase();
    let url = "https://instagram.com";
    if (plat.includes("instagram")) {
      url = `https://instagram.com/${cleanHandle}`;
    } else if (plat.includes("tiktok")) {
      url = `https://tiktok.com/@${cleanHandle}`;
    } else if (plat.includes("facebook")) {
      url = `https://facebook.com/${cleanHandle}`;
    }
    window.open(url, "_blank");
  };

  // Report Actions
  async function saveReport() {
    if (!rForm.week_start) { T("⚠ Date de début requise"); return; }
    try {
      await adminApi("campaignReportSave", {
        row: {
          id: rForm.id || undefined,
          week_start: rForm.week_start,
          total_views: Number(rForm.total_views) || 0,
          total_new_followers: Number(rForm.total_new_followers) || 0,
          avg_engagement_rate: Number(rForm.avg_engagement_rate) || 0,
          total_clicks: Number(rForm.total_clicks) || 0,
          revenue_fcfa: Number(rForm.revenue_fcfa) || 0,
          boosts_sold: Number(rForm.boosts_sold) || 0,
          notes: rForm.notes || null,
        }
      });
      T("✅ Rapport enregistré");
      setShowR(false);
      setRForm({
        week_start: new Date().toISOString().slice(0, 10),
        total_views: 0,
        total_new_followers: 0,
        avg_engagement_rate: 0,
        total_clicks: 0,
        revenue_fcfa: 0,
        boosts_sold: 0,
        notes: ""
      });
      loadCampaign();
    } catch (e: any) {
      T(`❌ ${e.message}`);
    }
  }

  async function delReport(id: string) {
    if (!confirm("Supprimer ce rapport ?")) return;
    try {
      await adminApi("campaignReportDelete", { id });
      T("🗑️ Rapport supprimé");
      loadCampaign();
    } catch (e: any) {
      T(`❌ ${e.message}`);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://wanteermako.com";
  const last7 = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); })();
  const sum = (arr: any[], k: string) => arr.reduce((a, x) => a + (Number(x[k]) || 0), 0);
  const weekStats = stats.filter((s) => s.date >= last7);
  const latestDate = stats[0]?.date;
  const viewsToday = sum(stats.filter((s) => s.date === latestDate), "views");
  const newFollowersWeek = sum(weekStats, "new_followers");
  const engRows = weekStats.filter((s) => Number(s.engagement_rate) > 0);
  const avgEng = engRows.length ? (sum(engRows, "engagement_rate") / engRows.length) : 0;
  const clicksWeek = sum(weekStats, "clicks_to_site");
  const waFollowers = sum(stats.filter((s) => s.platform === "whatsapp"), "new_followers");
  const boostRevenue = sum(boosts.filter((b) => b.status === "active" || b.status === "completed"), "budget_fcfa");

  const KPIS = [
    { grad: "bg-g1", icon: "👁️", label: "Vues / jour", value: viewsToday, target: 10000 },
    { grad: "bg-g4", icon: "➕", label: "Nouv. abonnés / sem", value: newFollowersWeek, target: 500 },
    { grad: "bg-g5", icon: "💥", label: "Engagement moyen %", value: Math.round(avgEng), target: 8 },
    { grad: "bg-g3", icon: "🔗", label: "Clics vers le site / sem", value: clicksWeek, target: 5000 },
    { grad: "bg-[#00C853]/90", icon: "💬", label: "Abonnés WhatsApp", value: waFollowers, target: 1000 },
    { grad: "bg-g6", icon: "💰", label: "Revenus boosts (FCFA)", value: boostRevenue, target: 200000 },
  ];

  const statusColor = (s: string) =>
    s === "published" ? "bg-emerald-500/15 text-emerald-300" :
    s === "scheduled" ? "bg-amber-500/15 text-amber-300" :
    s === "boosted" ? "bg-violet-500/15 text-violet-300" :
    "bg-white/10 text-gray-400";

  const endpoints = [
    ["POST", "/api/campaign/post-published", "Make → enregistre un post publié"],
    ["POST", "/api/campaign/stats-update", "Make → met à jour les stats du jour"],
    ["POST", "/api/campaign/weekly-report", "Make → rapport hebdomadaire"],
    ["GET", "/api/campaign/pending-annonces", "Make (15 min) → annonces sans post"],
    ["POST", "/api/campaign/boost-request", "Crée un boost + déclenche Meta Ads"],
  ];

  // Planning logic
  const getWeekDays = () => {
    const current = new Date();
    current.setDate(current.getDate() + weekOffset * 7);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getPostsForSlot = (dayStr: string, slotIndex: number) => {
    return posts.filter((p) => {
      const dtStr = p.scheduled_at || p.published_at || p.created_at;
      if (!dtStr) return false;
      const d = new Date(dtStr);
      const pDayStr = d.toISOString().slice(0, 10);
      if (pDayStr !== dayStr) return false;
      const hour = d.getHours();
      if (slotIndex === 0) return hour >= 5 && hour < 9;
      if (slotIndex === 1) return hour >= 9 && hour < 12;
      if (slotIndex === 2) return hour >= 12 && hour < 15;
      if (slotIndex === 3) return hour >= 15 && hour < 18;
      if (slotIndex === 4) return hour >= 18 && hour < 23;
      return false;
    });
  };

  const weekDays = getWeekDays();

  // Filters for Suivi des posts
  const filtered = posts.filter((p) => {
    const matchPlat = fPlat === "all" || p.platform === fPlat;
    const matchStatus = fStatus === "all" || p.status === fStatus;

    if (fWeek === "current") {
      const dtStr = p.scheduled_at || p.published_at || p.created_at;
      if (!dtStr) return false;
      const pDay = dtStr.slice(0, 10);
      const start = weekDays[0].toISOString().slice(0, 10);
      const end = weekDays[6].toISOString().slice(0, 10);
      return matchPlat && matchStatus && pDay >= start && pDay <= end;
    }

    return matchPlat && matchStatus;
  });

  const sortedReps = [...reports].sort((a, b) => a.week_start.localeCompare(b.week_start));
  const maxFollowers = Math.max(...sortedReps.map(r => r.total_new_followers), 100);
  const maxRevenue = Math.max(...sortedReps.map(r => r.revenue_fcfa), 10000);

  const topPosts = [...posts]
    .sort((a, b) => (b.reach || 0) - (a.reach || 0))
    .slice(0, 5);

  return (
    <>
      <PageHead title="🚀 Campagne IA 2025" sub="Publication automatique native (Gemini + Telegram · Facebook) — gratuite, sans Make.com" />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-[#30363D] bg-[#0D1117] p-3.5">
        <div className="flex-1 min-w-[180px]">
          <div className="text-[.85rem] font-bold text-white">⚡ Publication automatique</div>
          <div className="text-[.7rem] text-[#8B949E]">Génère les textes avec Gemini et publie les annonces en attente sur vos réseaux configurés.</div>
        </div>
        <button
          onClick={runAutoPublish}
          disabled={publishing}
          className="shrink-0 rounded-[10px] bg-g1 px-4 py-2 text-[.82rem] font-bold text-white disabled:opacity-50"
        >
          {publishing ? "⏳ Publication…" : "🚀 Publier maintenant"}
        </button>
      </div>

      <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
        {([["dashboard", "📊 Tableau de bord"], ["planning", "🗓️ Planning"], ["influenceurs", "🤝 Influenceurs"], ["rapports", "📄 Rapports"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[.78rem] font-bold ${tab === id ? "bg-g1 text-white" : "bg-white/5 text-[#A5B4FC]"}`}>{label}</button>
        ))}
      </div>

      {loading ? <div className="py-10 text-center text-[.85rem] text-[#8B949E]">Chargement…</div> : (
        <>
          {tab === "dashboard" && (
            <>
              {/* KPIs */}
              <div className="mb-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
                {KPIS.map((k) => {
                  const pct = k.target ? Math.min(100, Math.max(0, Math.round((k.value / k.target) * 100))) : 0;
                  return (
                    <div key={k.label} className={`relative overflow-hidden rounded-[14px] p-3.5 text-white ${k.grad}`}>
                      <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/10" />
                      <div className="relative">
                        <div className="mb-1 text-[1rem]">{k.icon}</div>
                        <div className="font-display text-[1.3rem] font-extrabold leading-none">{k.value.toLocaleString("fr-FR")}</div>
                        <div className="mt-1 text-[.66rem] font-medium opacity-90">{k.label}</div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-white/80" style={{ width: `${pct}%` }} /></div>
                        <div className="mt-1 text-[.6rem] opacity-80">Objectif : {k.target.toLocaleString("fr-FR")} ({pct}%)</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Suivi des posts */}
              <Card title={`📋 Suivi des posts (${posts.length})`}>
                <div className="mb-3 flex flex-wrap gap-2 items-center">
                  <select value={fPlat} onChange={(e) => setFPlat(e.target.value)} className="rounded-[8px] border border-[#30363D] bg-[#0D1117] px-2 py-1 text-[.78rem] text-white">
                    <option value="all">Toutes plateformes</option>
                    <option value="telegram">Telegram</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                  <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="rounded-[8px] border border-[#30363D] bg-[#0D1117] px-2 py-1 text-[.78rem] text-white">
                    <option value="all">Tous statuts</option>
                    <option value="draft">Brouillon</option>
                    <option value="scheduled">Planifié</option>
                    <option value="published">Publié</option>
                    <option value="boosted">Boosté</option>
                  </select>
                  <select value={fWeek} onChange={(e) => setFWeek(e.target.value)} className="rounded-[8px] border border-[#30363D] bg-[#0D1117] px-2 py-1 text-[.78rem] text-white">
                    <option value="all">Toutes les semaines</option>
                    <option value="current">Cette semaine</option>
                  </select>
                </div>
                {filtered.length === 0 ? (
                  <div className="py-8 text-center text-[.82rem] text-[#8B949E]">Aucun post pour l'instant. Make.com les ajoutera automatiquement après configuration.</div>
                ) : (
                  <Tbl head={["Annonce", "Plateforme", "Statut", "Reach", "Réactions", "Partages", "Date publication", "Actions"]}>
                    {filtered.map((p) => {
                      const ad = allListings.find(a => a.id === p.annonce_id);
                      return (
                        <tr key={p.id} className="hover:bg-white/[.02] border-b border-[#21262D]">
                          <Td>
                            {ad ? (
                              <div className="flex items-center gap-2">
                                <img src={ad.image || "https://placehold.co/50x50?text=WMK"} className="h-8 w-8 rounded object-cover shrink-0" alt="" />
                                <div className="min-w-0">
                                  <div className="font-bold text-[#E6EDF3] truncate max-w-[120px]">{ad.title}</div>
                                  <div className="text-[.65rem] text-emerald-400 font-bold">{ad.price} F</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#8B949E] text-[.75rem]">Post libre (Branding)</span>
                            )}
                          </Td>
                          <Td bold>{p.platform}</Td>
                          <Td><span className={`rounded-md px-2 py-0.5 text-[.68rem] font-bold ${statusColor(p.status)}`}>{p.status}</span></Td>
                          <Td>{(p.reach || 0).toLocaleString("fr-FR")}</Td>
                          <Td>{(p.reactions || 0).toLocaleString("fr-FR")}</Td>
                          <Td>{(p.shares || 0).toLocaleString("fr-FR")}</Td>
                          <Td>{p.published_at ? new Date(p.published_at).toLocaleDateString("fr-FR") : p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString("fr-FR") : "—"}</Td>
                          <Td>
                            <div className="flex items-center gap-2">
                              {p.post_url ? (
                                <a href={p.post_url} target="_blank" rel="noopener noreferrer" className="text-[#A5B4FC] font-bold hover:underline text-[.72rem]">Voir ↗</a>
                              ) : (
                                <span className="text-[#8B949E] text-[.72rem]">—</span>
                              )}
                              <button onClick={() => setSelBoostPost(p)} className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[.68rem] font-bold text-amber-300 hover:bg-amber-500/20">
                                ⭐ Booster
                              </button>
                              <button onClick={() => triggerRepublier(p)} className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[.68rem] font-bold text-indigo-300 hover:bg-indigo-500/20">
                                🔄 Republier
                              </button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </Tbl>
                )}
              </Card>

              {/* Configuration Make.com */}
              <div className="mt-3">
                <Card title="⚙️ Connexion Make.com — Endpoints à copier">
                  <p className="mb-2 text-[.78rem] text-[#8B949E]">Optionnel (intégration externe) : colle ces URLs dans tes scénarios Make.com. Ajoute le header <code className="text-[#A5B4FC]">x-campaign-secret</code> = ta valeur <code className="text-[#A5B4FC]">CAMPAIGN_WEBHOOK_SECRET</code> (variables d'env Netlify).</p>
                  <div className="space-y-1.5">
                    {endpoints.map(([m, path, desc]) => (
                      <div key={path} className="flex flex-wrap items-center gap-2 rounded-[8px] bg-[#0D1117] p-2">
                        <span className={`rounded px-1.5 py-0.5 text-[.62rem] font-bold ${m === "GET" ? "bg-blue-500/20 text-blue-300" : "bg-emerald-500/20 text-emerald-300"}`}>{m}</span>
                        <code className="text-[.74rem] text-[#E6EDF3]">{origin}{path}</code>
                        <button onClick={() => { navigator.clipboard?.writeText(`${origin}${path}`); T("📋 Copié"); }} className="ml-auto rounded bg-white/5 px-2 py-0.5 text-[.68rem] text-[#A5B4FC]">Copier</button>
                        <span className="w-full text-[.68rem] text-[#8B949E]">{desc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-[8px] border border-[#6366F1]/30 bg-[#6366F1]/10 p-2.5 text-[.74rem] text-[#A5B4FC]">
                    ℹ️ Variables à mettre sur Netlify : <b>CAMPAIGN_WEBHOOK_SECRET</b>, MAKE_WEBHOOK_URL, META_PAGE_ID, META_ACCESS_TOKEN, OPENAI_API_KEY, CANVA_ACCESS_TOKEN, BUFFER_ACCESS_TOKEN, MANYCHAT_API_KEY.
                  </div>
                </Card>
              </div>
            </>
          )}

          {tab === "planning" && (
            <Card title="🗓️ Calendrier des publications">
              <p className="mb-4 text-[.78rem] text-[#8B949E]">
                Visualise et planifie les publications de la campagne IA. Vert = Publié/Boosté, Orange = Planifié, Gris = Emplacement libre.
              </p>

              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <button onClick={() => setWeekOffset(w => w - 1)} className="rounded-[9px] bg-[#21262D] border border-[#30363D] hover:bg-[#30363D] px-3.5 py-1.5 text-[.78rem] font-bold text-[#C9D1D9]">
                  ⬅️ Semaine Précédente
                </button>
                <span className="font-bold text-[.82rem] text-[#A5B4FC]">
                  Semaine du {weekDays[0].toLocaleDateString("fr-FR")} au {weekDays[6].toLocaleDateString("fr-FR")}
                </span>
                <button onClick={() => setWeekOffset(w => w + 1)} className="rounded-[9px] bg-[#21262D] border border-[#30363D] hover:bg-[#30363D] px-3.5 py-1.5 text-[.78rem] font-bold text-[#C9D1D9]">
                  Semaine Suivante ➡️
                </button>
              </div>

              <div className="overflow-x-auto rounded-[12px] border border-[#30363D]">
                <table className="w-full border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#161B22]">
                      <th className="border border-[#30363D] p-3 text-left text-[.72rem] font-bold uppercase tracking-wide text-[#8B949E] w-[140px]">WAT Time</th>
                      {weekDays.map((day, i) => (
                        <th key={i} className="border border-[#30363D] p-3 text-center text-[.72rem] font-bold uppercase tracking-wide text-white">
                          <div>{["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"][i]}</div>
                          <div className="text-[.62rem] text-[#8B949E] mt-0.5">{day.toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {["🌅 07h00 WAT", "📈 10h00 WAT", "☀️ 13h00 WAT", "🚀 16h00 WAT", "🌙 20h30 WAT"].map((slotName, slotIdx) => (
                      <tr key={slotIdx}>
                        <td className="border border-[#30363D] p-3 text-[.72rem] font-bold text-[#8B949E] bg-[#161B22]">{slotName}</td>
                        {weekDays.map((day, dayIdx) => {
                          const dayStr = day.toISOString().slice(0, 10);
                          const slotPosts = getPostsForSlot(dayStr, slotIdx);

                          const slotPast = (() => {
                            const defaultTimes = ["07:00", "10:00", "13:00", "16:00", "20:30"];
                            const yyyymmdd = day.toISOString().slice(0, 10);
                            const dt = new Date(`${yyyymmdd}T${defaultTimes[slotIdx]}:00+01:00`);
                            return dt < new Date();
                          })();

                          const getPlatIcon = (plat: string) => {
                            if (plat === "facebook") return "🔵";
                            if (plat === "whatsapp") return "🟢";
                            if (plat === "instagram") return "🟣";
                            return "📱";
                          };

                          return (
                            <td
                              key={dayIdx}
                              className={`border border-[#30363D] p-1 text-[.7rem] transition text-center min-h-[90px] h-[105px] relative group ${
                                slotPast ? "bg-[#0D1117]/40 opacity-70" : "bg-[#0D1117]"
                              }`}
                            >
                              <div className="flex flex-col justify-between h-full space-y-1">
                                <div className="space-y-0.5 overflow-y-auto max-h-[70px] scrollbar-thin">
                                  {slotPosts.map((p) => {
                                    // Extraction de texte propre et court
                                    const matchTitle = p.caption.match(/👉\s*([^\n]+)/);
                                    const shortTitle = matchTitle ? matchTitle[1].slice(0, 14) : p.caption.slice(0, 14);
                                    return (
                                      <div
                                        key={p.id}
                                        onClick={() => setSelPost(p)}
                                        className={`px-1 py-0.5 rounded text-left text-[0.62rem] font-extrabold cursor-pointer truncate ${
                                          p.status === "published" || p.status === "boosted"
                                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                                            : "bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                                        }`}
                                        title={p.caption}
                                      >
                                        <span className="mr-0.5">{getPlatIcon(p.platform)}</span>
                                        {shortTitle}...
                                      </div>
                                    );
                                  })}
                                </div>
                                {!slotPast ? (
                                  <button
                                    onClick={() => {
                                      const defaultTimes = ["07:00", "10:00", "13:00", "16:00", "20:30"];
                                      setSelSlot({ day, slotIndex: slotIdx });
                                      setPForm({
                                        platform: "all",
                                        status: "scheduled",
                                        caption: "",
                                        time: defaultTimes[slotIdx]
                                      });
                                    }}
                                    className="w-full py-0.5 rounded border border-dashed border-[#30363D] hover:border-gray-500 text-gray-500 hover:text-gray-300 text-[0.6rem] font-bold mt-auto transition duration-150"
                                  >
                                    + Planifier
                                  </button>
                                ) : (
                                  <span className="text-[0.58rem] text-gray-600 font-semibold mt-auto block select-none">Passé</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === "influenceurs" && (
            <>
              <div className="mb-3 flex justify-between items-center">
                <h3 className="text-[.9rem] font-bold text-[#E6EDF3]">Influenceurs affiliés Wanteermako</h3>
                <button className="rounded-[9px] bg-[#21262D] border border-[#30363D] hover:bg-[#30363D] px-3 py-1.5 text-[.78rem] font-bold text-[#C9D1D9]" onClick={() => { setIForm({ collaboration_type: "barter", status: "contacte" }); setShowI(true); }}>
                  + Nouvel Influenceur
                </button>
              </div>

              <Card title={`🤝 Influenceurs (${influ.length})`}>
                {influ.length === 0 ? (
                  <div className="py-8 text-center text-[.82rem] text-[#8B949E]">
                    Aucun influenceur. Ajoutez-en un pour suivre vos partenariats marketing !
                  </div>
                ) : (
                  <Tbl head={["Nom", "Platform/Handle", "Abonnés", "Type Collab", "Reach Généré", "Coût", "Statut", "Actions"]}>
                    {influ.map((inf) => {
                      const cleanHandle = (inf.handle || "").replace('@', '').trim();
                      const plat = (inf.plateforme || "").toLowerCase();
                      let link = "https://instagram.com";
                      if (plat.includes("instagram")) link = `https://instagram.com/${cleanHandle}`;
                      else if (plat.includes("tiktok")) link = `https://tiktok.com/@${cleanHandle}`;
                      else if (plat.includes("facebook")) link = `https://facebook.com/${cleanHandle}`;

                      return (
                        <tr key={inf.id} className="hover:bg-white/[.02] border-b border-[#21262D]">
                          <Td bold>{inf.nom}</Td>
                          <Td>
                            <div className="text-[.78rem]">
                              <span className="text-[#8B949E] uppercase font-bold text-[.6rem] block">{inf.plateforme || "instagram"}</span>
                              <a href={link} target="_blank" rel="noopener noreferrer" className="text-[#A5B4FC] font-semibold hover:underline">
                                {inf.handle || "@—"}
                              </a>
                            </div>
                          </Td>
                          <Td>{(inf.followers || 0).toLocaleString("fr-FR")}</Td>
                          <Td>
                            <span className={`rounded-md px-1.5 py-0.5 text-[.65rem] font-bold ${inf.collaboration_type === "paid" ? "bg-amber-500/10 text-amber-300" : "bg-blue-500/10 text-blue-300"}`}>
                              {inf.collaboration_type === "paid" ? "Payant (Paid)" : "Échange (Barter)"}
                            </span>
                          </Td>
                          <Td>
                            <span className="text-emerald-400 font-bold">{(inf.reach_genere || 0).toLocaleString("fr-FR")}</span>
                          </Td>
                          <Td>{(inf.cout_fcfa || 0).toLocaleString("fr-FR")} F</Td>
                          <Td>
                            <select
                              value={inf.status || "contacte"}
                              onChange={(e) => setInfluStatus(inf.id, e.target.value)}
                              className="rounded bg-[#0D1117] border border-[#30363D] px-1.5 py-0.5 text-[.68rem] text-white"
                            >
                              <option value="contacte">Contacté</option>
                              <option value="actif">Actif</option>
                              <option value="termine">Terminé</option>
                            </select>
                          </Td>
                          <Td>
                            <div className="flex gap-2">
                              <button onClick={() => openContact(inf)} className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[.68rem] font-bold text-emerald-300 hover:bg-emerald-500/20">
                                💬 Contacter
                              </button>
                              <button onClick={() => { setIForm(inf); setShowI(true); }} className="rounded bg-white/5 px-2 py-0.5 text-[.68rem] font-bold text-[#A5B4FC] hover:bg-white/10">
                                ✏️ Modifier
                              </button>
                              <button onClick={() => delInflu(inf.id)} className="rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[.68rem] font-bold text-red-300 hover:bg-red-500/20">
                                🗑️
                              </button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </Tbl>
                )}
              </Card>
            </>
          )}

          {tab === "rapports" && (
            <>
              <div className="mb-3 flex justify-between items-center">
                <h3 className="text-[.9rem] font-bold text-[#E6EDF3]">Performance Hebdomadaire & Statistiques</h3>
                <button className="rounded-[9px] bg-[#21262D] border border-[#30363D] hover:bg-[#30363D] px-3 py-1.5 text-[.78rem] font-bold text-[#C9D1D9]" onClick={() => {
                  setRForm({
                    week_start: new Date().toISOString().slice(0, 10),
                    total_views: 0,
                    total_new_followers: 0,
                    avg_engagement_rate: 0,
                    total_clicks: 0,
                    revenue_fcfa: 0,
                    boosts_sold: 0,
                    notes: ""
                  });
                  setShowR(true);
                }}>
                  + Nouveau Rapport Hebdo
                </button>
              </div>

              {/* Graphs Section */}
              {sortedReps.length > 0 ? (
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 mb-4">
                  <Card title="📈 Nouveaux Abonnés par Semaine">
                    <div className="flex min-w-0 items-center justify-center overflow-hidden rounded-lg bg-[#0D1117] p-2 sm:p-3">
                      <svg className="block h-[180px] w-full max-w-full sm:h-[200px]" viewBox="0 0 500 200" preserveAspectRatio="none">
                        {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                          <line key={idx} x1="40" y1={String(170 - p * 140)} x2="480" y2={String(170 - p * 140)} stroke="#30363D" strokeWidth="0.5" strokeDasharray="4 4" />
                        ))}
                        <path
                          fill="none"
                          stroke="#00C853"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={sortedReps.map((r, i) => {
                            const x = 40 + i * ((500 - 60) / Math.max(sortedReps.length - 1, 1));
                            const y = 170 - (r.total_new_followers / maxFollowers) * 140;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(" ")}
                        />
                        {sortedReps.map((r, i) => {
                          const x = 40 + i * ((500 - 60) / Math.max(sortedReps.length - 1, 1));
                          const y = 170 - (r.total_new_followers / maxFollowers) * 140;
                          return (
                            <g key={i}>
                              <circle cx={x} cy={y} r="5" fill="#00C853" stroke="#161B22" strokeWidth="2" />
                              <text x={x} y={y - 10} fill="#E6EDF3" fontSize="8" fontWeight="bold" textAnchor="middle">
                                {r.total_new_followers}
                              </text>
                              <text x={x} y="190" fill="#8B949E" fontSize="7" textAnchor="middle">
                                {new Date(r.week_start).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </Card>

                  <Card title="💰 Revenus Générés via Boosts (FCFA)">
                    <div className="flex min-w-0 items-center justify-center overflow-hidden rounded-lg bg-[#0D1117] p-2 sm:p-3">
                      <svg className="block h-[180px] w-full max-w-full sm:h-[200px]" viewBox="0 0 500 200" preserveAspectRatio="none">
                        {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                          <line key={idx} x1="50" y1={String(170 - p * 140)} x2="480" y2={String(170 - p * 140)} stroke="#30363D" strokeWidth="0.5" strokeDasharray="4 4" />
                        ))}
                        {sortedReps.map((r, i) => {
                          const w = Math.max(12, (500 - 80) / sortedReps.length - 15);
                          const x = 50 + i * ((500 - 80) / sortedReps.length) + 10;
                          const h = (r.revenue_fcfa / maxRevenue) * 140;
                          const y = 170 - h;
                          return (
                            <g key={i}>
                              <rect x={x} y={y} width={w} height={h} fill="#6366F1" rx="4" />
                              <text x={x + w/2} y={y - 8} fill="#E6EDF3" fontSize="8" fontWeight="bold" textAnchor="middle">
                                {r.revenue_fcfa >= 1000 ? `${(r.revenue_fcfa / 1000).toFixed(0)}k` : r.revenue_fcfa}
                              </text>
                              <text x={x + w/2} y="190" fill="#8B949E" fontSize="7" textAnchor="middle">
                                {new Date(r.week_start).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="py-6 text-center text-[.82rem] text-[#8B949E] bg-[#161B22] border border-[#21262D] rounded-xl mb-4">
                  Aucune donnée disponible pour tracer les graphiques. Simulez/Créez un rapport pour voir le rendu visuel !
                </div>
              )}

              {/* Top 5 Posts */}
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 mb-4">
                <Card title="🔥 Top 5 Publications par Reach">
                  {topPosts.length === 0 ? (
                    <div className="py-4 text-center text-[.78rem] text-[#8B949E]">Aucune publication disponible.</div>
                  ) : (
                    <div className="space-y-2">
                      {topPosts.map((p, idx) => {
                        const ad = allListings.find(a => a.id === p.annonce_id);
                        return (
                          <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-[#0D1117] border border-[#21262D]">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[.9rem] font-extrabold text-[#A5B4FC] w-4">{idx + 1}</span>
                              {ad?.image && (
                                <img src={ad.image} className="h-8 w-8 rounded object-cover shrink-0" alt="" />
                              )}
                              <div className="min-w-0">
                                <div className="text-[.76rem] font-bold text-white truncate max-w-[150px]">{p.caption}</div>
                                <div className="text-[.62rem] text-[#8B949E] uppercase font-bold">{p.platform}</div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[.82rem] font-extrabold text-[#00C853]">{(p.reach || 0).toLocaleString("fr-FR")}</div>
                              <div className="text-[.58rem] text-[#8B949E] uppercase font-bold">Reach</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card title="📊 Synthèse des stats de campagne">
                  <div className="space-y-2.5 text-[.82rem]">
                    <div className="flex justify-between border-b border-[#21262D] pb-1.5">
                      <span className="text-[#8B949E]">Total Vues de la Campagne</span>
                      <span className="font-extrabold text-white">{(sum(reports, "total_views")).toLocaleString("fr-FR")}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#21262D] pb-1.5">
                      <span className="text-[#8B949E]">Abonnés acquis au total</span>
                      <span className="font-extrabold text-white">{(sum(reports, "total_new_followers")).toLocaleString("fr-FR")}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#21262D] pb-1.5">
                      <span className="text-[#8B949E]">Clics vers wanteermako.com</span>
                      <span className="font-extrabold text-white">{(sum(reports, "total_clicks")).toLocaleString("fr-FR")}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#21262D] pb-1.5">
                      <span className="text-[#8B949E]">Boosts Meta Ads vendus</span>
                      <span className="font-extrabold text-white">{(sum(reports, "boosts_sold")).toLocaleString("fr-FR")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Chiffre d'Affaires Boosts</span>
                      <span className="font-extrabold text-emerald-400">{(sum(reports, "revenue_fcfa")).toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Reports Table */}
              <Card title="📋 Rapports hebdomadaires réels">
                {reports.length === 0 ? (
                  <div className="py-8 text-center text-[.82rem] text-[#8B949E]">Aucun rapport hebdomadaire enregistré.</div>
                ) : (
                  <Tbl head={["Semaine", "Vues", "Abonnés", "Eng. %", "Clics", "Boosts", "CA", "Notes", ""]}>
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-white/[.02] border-b border-[#21262D]">
                        <Td bold>{new Date(rep.week_start).toLocaleDateString("fr-FR")}</Td>
                        <Td>{(rep.total_views || 0).toLocaleString("fr-FR")}</Td>
                        <Td>+{(rep.total_new_followers || 0).toLocaleString("fr-FR")}</Td>
                        <Td>{rep.avg_engagement_rate}%</Td>
                        <Td>{(rep.total_clicks || 0).toLocaleString("fr-FR")}</Td>
                        <Td>{rep.boosts_sold || 0}</Td>
                        <Td bold className="text-emerald-400">{(rep.revenue_fcfa || 0).toLocaleString("fr-FR")} F</Td>
                        <Td><span className="line-clamp-1 max-w-[150px] inline-block text-[.74rem] text-[#8B949E]">{rep.notes || "—"}</span></Td>
                        <Td>
                          <div className="flex gap-2">
                            <button onClick={() => { setRForm(rep); setShowR(true); }} className="rounded bg-white/5 px-2 py-0.5 text-[.68rem] font-bold text-[#A5B4FC] hover:bg-white/10">
                              ✏️ Modifier
                            </button>
                            <button onClick={() => delReport(rep.id)} className="rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[.68rem] font-bold text-red-300 hover:bg-red-500/20">
                              🗑️
                            </button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </Tbl>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {/* MODALS */}
      {/* 1. Planifier / Créer Post */}
      {selSlot && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" onClick={() => setSelSlot(null)}>
          <div className="w-full max-w-[500px] max-h-[90vh] overflow-y-auto scrollbar-thin rounded-[14px] border border-[#30363D] bg-[#161B22] p-5 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1rem] font-bold text-white">🗓️ Planifier une publication</h3>
              <button onClick={() => setSelSlot(null)} className="text-gray-400 text-xl hover:text-white">✕</button>
            </div>
            <p className="mb-4 text-[.75rem] text-[#8B949E]">
              Date : {selSlot.day.toLocaleDateString("fr-FR")}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[.75rem] text-[#8B949E] mb-1">Plateforme *</label>
                <select
                  value={pForm.platform || "all"}
                  onChange={(e) => setPForm({ ...pForm, platform: e.target.value })}
                  className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                >
                  <option value="all">Tous les réseaux configurés</option>
                  <option value="telegram">Telegram</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block text-[.75rem] text-[#8B949E] mb-1">Heure de publication *</label>
                <input
                  type="time"
                  value={pForm.time || "07:00"}
                  onChange={(e) => setPForm({ ...pForm, time: e.target.value })}
                  className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                />
              </div>
              <div>
                {!pForm.id ? (
                  <>
                    <label className="block text-[.75rem] text-[#8B949E] mb-1">Associer à un ou plusieurs produits (Annonces) *</label>
                    <div className="max-h-32 overflow-y-auto border border-[#30363D] bg-[#0D1117] rounded-[9px] p-2 space-y-1.5 scrollbar-thin">
                      {allListings.map((a) => {
                        const checked = (pForm.annonce_ids || []).includes(a.id);
                        return (
                          <label key={a.id} className="flex items-start gap-2 text-[.78rem] text-white cursor-pointer hover:bg-white/5 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const currentIds = pForm.annonce_ids || [];
                                const nextIds = e.target.checked
                                  ? [...currentIds, a.id]
                                  : currentIds.filter((id: string) => id !== a.id);
                                let nextCaption = pForm.caption || "";
                                if (e.target.checked && (!nextCaption || nextCaption.includes("À NE PAS MANQUER"))) {
                                  nextCaption = `🔥 À NE PAS MANQUER ! \n\n👉 ${a.title} à ${(a.price || 0).toLocaleString("fr-FR")} FCFA \n\n📍 Disponible à ${a.location || "Dakar"}. Contactez le vendeur sur wanteermako.com !`;
                                }
                                setPForm({
                                  ...pForm,
                                  annonce_ids: nextIds,
                                  caption: nextCaption,
                                  image_url: pForm.image_url || a.image
                                });
                              }}
                              className="mt-0.5 rounded border-[#30363D] bg-[#0D1117] text-[#6366F1] focus:ring-[#6366F1]"
                            />
                            <span className="truncate">{a.title} ({(a.price || 0).toLocaleString("fr-FR")} F)</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-[.75rem] text-[#8B949E] mb-1">Associer à un produit (Annonce)</label>
                    <select
                      value={pForm.annonce_id || ""}
                      onChange={(e) => {
                        const selectedAd = allListings.find(a => a.id === e.target.value);
                        setPForm({
                          ...pForm,
                          annonce_id: e.target.value || null,
                          caption: selectedAd ? `🔥 À NE PAS MANQUER ! \n\n👉 ${selectedAd.title} à ${(selectedAd.price || 0).toLocaleString("fr-FR")} FCFA \n\n📍 Disponible à ${selectedAd.location || "Dakar"}. Contactez le vendeur sur wanteermako.com !` : pForm.caption,
                          image_url: selectedAd ? selectedAd.image : pForm.image_url
                        });
                      }}
                      className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                    >
                      <option value="">-- Aucun (Post libre/branding) --</option>
                      {allListings.map((a) => (
                        <option key={a.id} value={a.id}>{a.title} ({(a.price || 0).toLocaleString("fr-FR")} F)</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <div>
                <label className="block text-[.75rem] text-[#8B949E] mb-1">Légende (Caption) *</label>
                <textarea
                  value={pForm.caption || ""}
                  onChange={(e) => setPForm({ ...pForm, caption: e.target.value })}
                  placeholder="Écrivez le texte de votre publication..."
                  className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none h-24 resize-none focus:border-[#6366F1]"
                />
              </div>
              <div>
                <label className="block text-[.75rem] text-[#8B949E] mb-1">URL de l'image (Visuel)</label>
                <input
                  type="text"
                  value={pForm.image_url || ""}
                  onChange={(e) => setPForm({ ...pForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                />
                {pForm.image_url && (
                  <img src={pForm.image_url} alt="Aperçu" className="mt-2 h-20 rounded-md object-cover" />
                )}
              </div>
              <div>
                <label className="block text-[.75rem] text-[#8B949E] mb-1">Statut *</label>
                <select
                  value={pForm.status || "scheduled"}
                  onChange={(e) => setPForm({ ...pForm, status: e.target.value })}
                  className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                >
                  <option value="scheduled">Planifié (Scheduled)</option>
                  <option value="draft">Brouillon (Draft)</option>
                  <option value="published">Publié (Published)</option>
                </select>
              </div>
            </div>
            <button onClick={savePost} className="rounded-[9px] bg-[#00C853] hover:bg-[#00E676] px-3 py-1.5 text-[.78rem] font-bold mt-5 w-full text-white">Enregistrer la publication</button>
          </div>
        </div>
      )}

      {/* 2. Détails du Post */}
      {selPost && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" onClick={() => setSelPost(null)}>
          <div className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-thin rounded-[14px] border border-[#30363D] bg-[#161B22] p-5 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1rem] font-bold text-white">📋 Détails de la publication</h3>
              <button onClick={() => setSelPost(null)} className="text-gray-400 text-xl hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              {selPost.image_url && (
                <img src={selPost.image_url} alt="" className="w-full h-40 object-cover rounded-lg" />
              )}
              <div>
                <div className="text-[.68rem] text-[#8B949E] uppercase font-bold">Plateforme</div>
                <div className="text-[.88rem] text-white font-bold">{selPost.platform}</div>
              </div>
              <div>
                <div className="text-[.68rem] text-[#8B949E] uppercase font-bold">Légende</div>
                <div className="text-[.83rem] text-gray-200 bg-[#0D1117] p-3 rounded-lg whitespace-pre-wrap leading-relaxed">{selPost.caption}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[.68rem] text-[#8B949E] uppercase font-bold">Statut</div>
                  <span className={`inline-block mt-1 rounded-md px-2 py-0.5 text-[.68rem] font-bold ${statusColor(selPost.status)}`}>{selPost.status}</span>
                </div>
                <div>
                  <div className="text-[.68rem] text-[#8B949E] uppercase font-bold">Planifié/Publié le</div>
                  <div className="text-[.78rem] text-white mt-1">
                    {new Date(selPost.scheduled_at || selPost.published_at || selPost.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-[#21262D] pt-3 text-center">
                <div>
                  <div className="text-[1rem] font-extrabold text-[#A5B4FC]">{selPost.reach || 0}</div>
                  <div className="text-[.6rem] text-[#8B949E] uppercase">Reach</div>
                </div>
                <div>
                  <div className="text-[1rem] font-extrabold text-[#A5B4FC]">{selPost.reactions || 0}</div>
                  <div className="text-[.6rem] text-[#8B949E] uppercase">Réactions</div>
                </div>
                <div>
                  <div className="text-[1rem] font-extrabold text-[#A5B4FC]">{selPost.shares || 0}</div>
                  <div className="text-[.6rem] text-[#8B949E] uppercase">Partages</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-3">
                {selPost.status !== "published" && selPost.status !== "boosted" && (
                  <button
                    onClick={() => {
                      triggerRepublier(selPost);
                      setSelPost(null);
                    }}
                    className="rounded-[9px] bg-[#00C853] hover:bg-[#00E676] px-4 py-2 text-[.78rem] font-bold text-white w-full text-center"
                  >
                    🚀 Publier maintenant sur Facebook
                  </button>
                )}
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      const dt = new Date(selPost.scheduled_at || selPost.published_at || selPost.created_at);
                      const timeStr = dt.toTimeString().slice(0, 5); // "HH:MM"
                      setSelSlot({ day: dt, slotIndex: 0 });
                      setPForm({
                        id: selPost.id,
                        platform: selPost.platform,
                        status: selPost.status,
                        caption: selPost.caption,
                        image_url: selPost.image_url,
                        annonce_id: selPost.annonce_id,
                        time: timeStr
                      });
                      setSelPost(null);
                    }}
                    className="rounded-[9px] bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-[.78rem] font-bold text-white flex-1 text-center"
                  >
                    ✏️ Modifier
                  </button>
                  {selPost.post_url && (
                    <a href={selPost.post_url} target="_blank" rel="noopener noreferrer" className="rounded-[9px] bg-[#21262D] border border-[#30363D] hover:bg-[#30363D] px-4 py-2 text-[.78rem] font-bold text-[#C9D1D9] flex-1 text-center">
                      Voir ↗
                    </a>
                  )}
                  <button onClick={() => deletePost(selPost.id)} className="rounded-[9px] bg-red-500/10 border border-red-500/20 px-4 py-2 text-[.78rem] font-bold text-red-300 hover:bg-red-500/20 flex-1 text-center">
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Ajouter / Modifier Influenceur */}
      {showI && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowI(false)}>
          <div className="w-full max-w-[500px] rounded-[14px] border border-[#30363D] bg-[#161B22] p-5 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1rem] font-bold text-white">🤝 {iForm.id ? "Modifier l'influenceur" : "Ajouter un influenceur"}</h3>
              <button onClick={() => setShowI(false)} className="text-gray-400 text-xl hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[.75rem] text-[#8B949E] mb-1">Nom Complet *</label>
                <input
                  type="text"
                  value={iForm.nom || ""}
                  onChange={(e) => setIForm({ ...iForm, nom: e.target.value })}
                  placeholder="Ex: Khalil"
                  className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Plateforme *</label>
                  <select
                    value={iForm.plateforme || "Instagram"}
                    onChange={(e) => setIForm({ ...iForm, plateforme: e.target.value })}
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Facebook">Facebook</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Handle / Identifiant *</label>
                  <input
                    type="text"
                    value={iForm.handle || ""}
                    onChange={(e) => setIForm({ ...iForm, handle: e.target.value })}
                    placeholder="Ex: @khalil_marketing"
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Abonnés *</label>
                  <input
                    type="number"
                    value={iForm.followers || 0}
                    onChange={(e) => setIForm({ ...iForm, followers: e.target.value })}
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Type de collab</label>
                  <select
                    value={iForm.collaboration_type || "barter"}
                    onChange={(e) => setIForm({ ...iForm, collaboration_type: e.target.value })}
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  >
                    <option value="barter">Échange (Barter)</option>
                    <option value="paid">Payant (Paid)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Coût (FCFA)</label>
                  <input
                    type="number"
                    value={iForm.cout_fcfa || 0}
                    onChange={(e) => setIForm({ ...iForm, cout_fcfa: e.target.value })}
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Reach généré</label>
                  <input
                    type="number"
                    value={iForm.reach_genere || 0}
                    onChange={(e) => setIForm({ ...iForm, reach_genere: e.target.value })}
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[.75rem] text-[#8B949E] mb-1">Statut *</label>
                <select
                  value={iForm.status || "contacte"}
                  onChange={(e) => setIForm({ ...iForm, status: e.target.value })}
                  className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                >
                  <option value="contacte">Contacté</option>
                  <option value="actif">Actif</option>
                  <option value="termine">Terminé</option>
                </select>
              </div>
            </div>
            <button onClick={saveInflu} className="rounded-[9px] bg-[#00C853] hover:bg-[#00E676] px-3 py-1.5 text-[.78rem] font-bold mt-5 w-full text-white">Sauvegarder l'influenceur</button>
          </div>
        </div>
      )}

      {/* 4. DM Contact */}
      {showContact && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowContact(false)}>
          <div className="w-full max-w-[480px] rounded-[14px] border border-[#30363D] bg-[#161B22] p-5 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1rem] font-bold text-white">✉️ Contacter {contactInflu?.nom}</h3>
              <button onClick={() => setShowContact(false)} className="text-gray-400 text-xl hover:text-white">✕</button>
            </div>
            <p className="mb-3 text-[.75rem] text-[#8B949E]">
              Ce message va être copié dans votre presse-papiers, puis nous allons ouvrir son profil public {contactInflu?.plateforme || "Instagram"} dans un nouvel onglet.
            </p>
            <textarea
              value={contactMsg}
              onChange={(e) => setContactMsg(e.target.value)}
              className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none h-40 resize-none leading-relaxed focus:border-[#6366F1]"
            />
            <button onClick={handleContactAction} className="rounded-[9px] bg-[#00C853] hover:bg-[#00E676] px-3 py-1.5 text-[.78rem] font-bold mt-4 w-full text-white">
              📋 Copier & Ouvrir la plateforme
            </button>
          </div>
        </div>
      )}

      {/* 5. Booster Post */}
      {selBoostPost && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" onClick={() => setSelBoostPost(null)}>
          <div className="w-full max-w-[600px] rounded-[14px] border border-[#30363D] bg-[#161B22] p-5 text-white overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1rem] font-bold text-white">⭐ Activer un Boost Sponsorisé (Meta Ads)</h3>
              <button onClick={() => setSelBoostPost(null)} className="text-gray-400 text-xl hover:text-white">✕</button>
            </div>
            <p className="mb-4 text-[.76rem] text-[#8B949E]">
              Associez cette publication de campagne à l'une des formules de visibilité de Wanteermako.com. Cela simulera le paiement et déclenchera les Meta Ads.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {BOOSTS.filter((b) => b.price > 0).map((b) => (
                <div key={b.key} className="rounded-xl border border-[#30363D] bg-[#0D1117] p-4 flex flex-col justify-between hover:border-[#00C853] transition">
                  <div>
                    <h4 className="text-[.88rem] font-bold text-white">{b.name}</h4>
                    <div className="text-[1.1rem] font-extrabold text-[#FFC93C] my-1">{b.price.toLocaleString("fr-FR")} FCFA</div>
                    <div className="text-[.7rem] text-[#8B949E] mb-2">Durée : {b.duration}</div>
                    <div className="space-y-1 text-[.68rem] text-[#8B949E]">
                      {b.features.slice(0, 3).map((f) => <div key={f}>- {f}</div>)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBoostPost(b)}
                    className="mt-4 w-full rounded-[8px] bg-[#00C853] hover:bg-[#00E676] py-1.5 text-[.74rem] font-bold text-white transition"
                  >
                    Sélectionner ce plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Ajouter / Modifier Rapport Hebdo */}
      {showR && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowR(false)}>
          <div className="w-full max-w-[500px] rounded-[14px] border border-[#30363D] bg-[#161B22] p-5 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1rem] font-bold text-white">📊 {rForm.id ? "Modifier le rapport" : "Créer un rapport hebdomadaire"}</h3>
              <button onClick={() => setShowR(false)} className="text-gray-400 text-xl hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[.75rem] text-[#8B949E] mb-1">Semaine du (Date début) *</label>
                <input
                  type="date"
                  value={rForm.week_start || ""}
                  onChange={(e) => setRForm({ ...rForm, week_start: e.target.value })}
                  className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Vues de la semaine</label>
                  <input
                    type="number"
                    value={rForm.total_views || 0}
                    onChange={(e) => setRForm({ ...rForm, total_views: e.target.value })}
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Nouveaux Abonnés</label>
                  <input
                    type="number"
                    value={rForm.total_new_followers || 0}
                    onChange={(e) => setRForm({ ...rForm, total_new_followers: e.target.value })}
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Engagement moyen (%)</label>
                  <input
                    type="number"
                    value={rForm.avg_engagement_rate || 0}
                    onChange={(e) => setRForm({ ...rForm, avg_engagement_rate: e.target.value })}
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Clics vers le site</label>
                  <input
                    type="number"
                    value={rForm.total_clicks || 0}
                    onChange={(e) => setRForm({ ...rForm, total_clicks: e.target.value })}
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Revenus Boosts (FCFA)</label>
                  <input
                    type="number"
                    value={rForm.revenue_fcfa || 0}
                    onChange={(e) => setRForm({ ...rForm, revenue_fcfa: e.target.value })}
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-[.75rem] text-[#8B949E] mb-1">Boosts vendus</label>
                  <input
                    type="number"
                    value={rForm.boosts_sold || 0}
                    onChange={(e) => setRForm({ ...rForm, boosts_sold: e.target.value })}
                    className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[.75rem] text-[#8B949E] mb-1">Notes / Synthèse</label>
                <textarea
                  value={rForm.notes || ""}
                  onChange={(e) => setRForm({ ...rForm, notes: e.target.value })}
                  placeholder="Ex: Excellente semaine, Khalil a généré un bon reach."
                  className="w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none h-20 resize-none focus:border-[#6366F1]"
                />
              </div>
            </div>
            <button onClick={saveReport} className="rounded-[9px] bg-[#00C853] hover:bg-[#00E676] px-3 py-1.5 text-[.78rem] font-bold mt-5 w-full text-white">Sauvegarder le rapport</button>
          </div>
        </div>
      )}
    </>
  );
}

function Campagnes({ campaigns, addCampaign, T }: { campaigns: any[]; addCampaign: (p: Record<string, any>) => Promise<boolean>; T: (m: string) => void }) {
  const sum = (k: string) => campaigns.reduce((a, c) => a + (Number(c[k]) || 0), 0);
  const [show, setShow] = useState(false);
  const [f, setF] = useState<Record<string, string>>({ channel: "email" });
  const inp = "rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]";
  async function create() {
    if (!f.name) { T("⚠ Nom requis"); return; }
    const ok = await addCampaign({ name: f.name, sector: f.sector || null, channel: f.channel || "email", status: "active", sent: 0, opened: 0, replied: 0 });
    if (ok) { setShow(false); setF({ channel: "email" }); }
  }
  return (
    <>
      <PageHead title="📨 Campagnes" sub={`${campaigns.length} campagne(s)`}>
        <button className={btnP} onClick={() => setShow((v) => !v)}>{show ? "✕ Fermer" : "+ Nouvelle campagne"}</button>
      </PageHead>
      {show && (
        <div className="mb-3"><Card title="Créer une campagne">
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={f.name || ""} onChange={(e) => setF((v) => ({ ...v, name: e.target.value }))} placeholder="Nom de la campagne *" className={inp} />
            <input value={f.sector || ""} onChange={(e) => setF((v) => ({ ...v, sector: e.target.value }))} placeholder="Secteur (ex: automobile)" className={inp} />
            <select value={f.channel} onChange={(e) => setF((v) => ({ ...v, channel: e.target.value }))} className={inp}>
              <option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option>
            </select>
          </div>
          <button className={`${btnP} mt-3`} onClick={create}>Créer la campagne</button>
        </Card></div>
      )}
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

function Employes({ employees, addEmployee, T }: { employees: any[]; addEmployee: (p: Record<string, any>) => Promise<boolean>; T: (m: string) => void }) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const inp = "rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]";
  async function create() {
    if (!f.name) { T("⚠ Nom requis"); return; }
    const ok = await addEmployee({ name: f.name, role: f.role || "Commercial", phone: f.phone || null, monthly_target: Number(f.target) || 3 });
    if (ok) { setShow(false); setF({}); }
  }
  return (
    <>
      <PageHead title="👨‍💼 Tableau de bord Employés" sub={`${employees.length} employé(s) · pour un compte connecté, utilise Utilisateurs`}>
        <button className={btnP} onClick={() => setShow((v) => !v)}>{show ? "✕ Fermer" : "+ Ajouter un employé"}</button>
      </PageHead>
      {show && (
        <div className="mb-3"><Card title="Ajouter un employé (fiche)">
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={f.name || ""} onChange={(e) => setF((v) => ({ ...v, name: e.target.value }))} placeholder="Nom complet *" className={inp} />
            <input value={f.role || ""} onChange={(e) => setF((v) => ({ ...v, role: e.target.value }))} placeholder="Poste (ex: Commercial)" className={inp} />
            <input value={f.phone || ""} onChange={(e) => setF((v) => ({ ...v, phone: e.target.value }))} placeholder="Téléphone" className={inp} />
            <input value={f.target || ""} onChange={(e) => setF((v) => ({ ...v, target: e.target.value }))} placeholder="Objectif mensuel (clients)" className={inp} />
          </div>
          <p className="mt-2 text-[.74rem] text-[#8B949E]">💡 Pour donner un <b>accès connecté</b> (login), crée plutôt un compte rôle « employé » dans <b>Utilisateurs</b>.</p>
          <button className={`${btnP} mt-3`} onClick={create}>Ajouter</button>
        </Card></div>
      )}
      {employees.length === 0 ? (
        <Card><div className="py-8 text-center text-[.85rem] text-[#8B949E]">Aucun employé enregistré. Clique « + Ajouter un employé ».</div></Card>
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
  const [cat, setCat] = useState<string>(Object.keys(SUBSCRIPTION_PLANS)[0] || "");
  return (
    <>
      <PageHead title="💎 Offres commerciales" sub="Tarifs réels appliqués sur le site (modifiables dans lib/constants.ts)" />

      <h3 className="mb-2 text-[.9rem] font-bold text-[#E6EDF3]">🚀 Boosts d'annonce</h3>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {BOOSTS.filter((b) => b.price > 0).map((b) => (
          <div key={b.key} className={`relative rounded-[12px] border bg-[#0D1117] p-4 ${b.popular ? "border-[#FFC93C]" : "border-[#21262D]"}`}>
            {b.popular && <span className="absolute -top-2 right-4 rounded-md bg-g5 px-2 py-0.5 text-[.62rem] font-extrabold text-[#0D1117]">POPULAIRE</span>}
            <div className="text-[.95rem] font-extrabold text-[#E6EDF3]">{b.name}</div>
            <div className="mb-1 text-[1.1rem] font-extrabold text-[#FFC93C]">{formatNumber(b.price)} FCFA</div>
            <div className="mb-2 text-[.7rem] text-[#8B949E]">Durée : {b.duration}</div>
            <div className="space-y-1 text-[.74rem] text-[#8B949E]">{b.features.map((f) => <div key={f}>✓ {f}</div>)}</div>
          </div>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-[.9rem] font-bold text-[#E6EDF3]">💼 Abonnements boutique</h3>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-[8px] border border-[#30363D] bg-[#0D1117] px-2 py-1 text-[.78rem] text-white outline-none">
          {Object.keys(SUBSCRIPTION_PLANS).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(SUBSCRIPTION_PLANS[cat] || []).filter((p) => p.price > 0).map((p) => (
          <div key={p.key} className="rounded-[12px] border border-[#21262D] bg-[#0D1117] p-4">
            <div className="text-[.95rem] font-extrabold text-[#E6EDF3]">{p.name}</div>
            <div className="mb-1 text-[1.1rem] font-extrabold text-[#A5B4FC]">{formatNumber(p.price)} FCFA<span className="text-[.7rem] font-normal text-[#8B949E]"> /{p.duration}</span></div>
            <div className="mb-2 text-[.7rem] text-[#8B949E]">{p.limits.activeAds} annonces · {p.limits.photos} photos</div>
            <div className="space-y-1 text-[.74rem] text-[#8B949E]">{p.features.map((f) => <div key={f}>✓ {f}</div>)}</div>
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
            <div className="min-w-[120px] flex-1">
              <div className="text-[.84rem] font-bold text-[#E6EDF3]">{m.title}</div>
              <div className="text-[.73rem] text-[#8B949E]">{m.category || "—"}</div>
              {m.moderation_reason && (
                <div className="mt-1 rounded-md border border-[#FFC93C]/20 bg-[#FFC93C]/10 px-2 py-1 text-[.68rem] font-semibold text-[#FFC93C]">
                  {m.moderation_reason}
                </div>
              )}
            </div>
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

// ───────── Import de produits externes (Chariow / AliExpress / ...) ─────────
const IMPORT_SOURCES = [
  { key: "chariow", label: "Chariow" },
  { key: "aliexpress", label: "AliExpress" },
  { key: "amazon", label: "Amazon" },
  { key: "alibaba", label: "Alibaba" },
  { key: "jumia", label: "Jumia" },
  { key: "autre", label: "Autre site" },
];
const IMPORT_EMPTY = { cta: "whatsapp", order_whatsapp: "", source: "aliexpress", title: "", price: "", image: "", category: "", location: "Dakar", external_url: "", description: "", featured: false };

function ImportProduits({ T, reload, profiles }: { T: (m: string) => void; reload: () => void; profiles: any[] }) {
  const inp = "w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]";
  const [f, setF] = useState<any>({ ...IMPORT_EMPTY });
  const [ownerId, setOwnerId] = useState("");
  const [ownerOptions, setOwnerOptions] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<any[]>([]);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const owners = (ownerOptions.length ? ownerOptions : profiles || []).filter((u: any) => u?.id);
  const ownerLabel = (u: any) => {
    const name = u.full_name || u.email || u.phone || u.id;
    const email = u.email && u.email !== name ? ` · ${u.email}` : "";
    return `${name}${email}`;
  };

  useEffect(() => {
    let alive = true;
    adminApi("list")
      .then((d) => { if (alive) setOwnerOptions(d.users || []); })
      .catch(() => { if (alive) setOwnerOptions([]); });
    return () => { alive = false; };
  }, []);

  const isWa = f.cta === "whatsapp";
  async function submit() {
    if (!f.title.trim()) { T("⚠️ Titre obligatoire"); return; }
    if (isWa && !f.order_whatsapp.trim()) { T("⚠️ Numéro WhatsApp obligatoire"); return; }
    if (!isWa && !f.external_url.trim()) { T("⚠️ Lien externe obligatoire"); return; }
    setBusy(true);
    try {
      const cat = CATEGORIES.find((c) => c.slug === f.category);
      const res = await fetch("/api/admin/import-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          owner_id: ownerId || undefined,
          product: { ...f, order_whatsapp: isWa ? f.order_whatsapp : "", category: cat?.name || "Autre", category_slug: f.category || "" },
        }),
      });
      const d = await res.json();
      if (!res.ok) { T("❌ " + (d.error || "Erreur")); setBusy(false); return; }
      const r = d.results?.[0] || { title: f.title, ok: true };
      setDone((p) => [r, ...p]);
      if (r.ok) { T(r.status === "pending" ? "⏳ Produit envoyé en modération" : "✅ Produit importé !"); setF({ ...IMPORT_EMPTY, source: f.source }); reload(); }
      else T("❌ " + (r.error || "Erreur"));
    } catch (e: any) { T("❌ " + (e?.message || "Erreur réseau")); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHead title="🛒 Import Produits externes" sub="Chariow, AliExpress… Le bouton « Acheter » renverra directement vers le site de vente." />
      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[.72rem] font-bold text-[#8B949E]">Boutique propriétaire</label>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inp}>
              <option value="">Compte propriétaire par défaut</option>
              {owners.map((u: any) => <option key={u.id} value={u.id}>{ownerLabel(u)}</option>)}
            </select>
            <p className="mt-1 text-[.68rem] text-[#8B949E]">Choisis la boutique qui doit afficher ce produit dans « Ma Boutique ».</p>
          </div>
          <div>
            <label className="mb-1 block text-[.72rem] font-bold text-[#8B949E]">Site de vente</label>
            <select value={f.source} onChange={(e) => set("source", e.target.value)} className={inp}>
              {IMPORT_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[.72rem] font-bold text-[#8B949E]">Catégorie</label>
            <select value={f.category} onChange={(e) => set("category", e.target.value)} className={inp}>
              <option value="">— Choisir —</option>
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[.72rem] font-bold text-[#8B949E]">Titre du produit *</label>
            <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex : Montre connectée Smart Watch" className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[.72rem] font-bold text-[#8B949E]">Que fait le bouton « Acheter » ?</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => set("cta", "whatsapp")} className={`rounded-[9px] border px-3 py-2 text-[.78rem] font-bold ${isWa ? "border-[#25D366] bg-[#25D366]/15 text-[#25D366]" : "border-[#30363D] bg-[#0D1117] text-[#8B949E]"}`}>📱 Mon WhatsApp</button>
              <button type="button" onClick={() => set("cta", "external")} className={`rounded-[9px] border px-3 py-2 text-[.78rem] font-bold ${!isWa ? "border-[#6366F1] bg-[#6366F1]/15 text-[#A5B4FC]" : "border-[#30363D] bg-[#0D1117] text-[#8B949E]"}`}>🔗 Lien externe</button>
            </div>
            <p className="mt-1 text-[.68rem] text-[#8B949E]">{isWa ? "Le client te contacte sur WhatsApp pour commander (le lien affilié reste privé)." : "Le client est redirigé directement vers le site de vente."}</p>
          </div>

          {isWa ? (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[.72rem] font-bold text-[#8B949E]">Ton numéro WhatsApp de commande *</label>
              <input value={f.order_whatsapp} onChange={(e) => set("order_whatsapp", e.target.value)} placeholder="Ex : 221770000000 (avec indicatif)" className={inp} />
              <label className="mt-2 mb-1 block text-[.72rem] font-bold text-[#8B949E]">Lien affilié (privé, optionnel — pour tes notes)</label>
              <input value={f.external_url} onChange={(e) => set("external_url", e.target.value)} placeholder="https://aliexpress.com/... (non affiché au client)" className={inp} />
            </div>
          ) : (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[.72rem] font-bold text-[#8B949E]">Lien de vente (URL externe) *</label>
              <input value={f.external_url} onChange={(e) => set("external_url", e.target.value)} placeholder="https://chariow.com/... ou https://aliexpress.com/..." className={inp} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-[.72rem] font-bold text-[#8B949E]">Prix (FCFA)</label>
            <input value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="Ex : 15000" className={inp} />
          </div>
          <div>
            <label className="mb-1 block text-[.72rem] font-bold text-[#8B949E]">Lieu / Livraison</label>
            <input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Ex : Livraison Dakar" className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[.72rem] font-bold text-[#8B949E]">Image (URL de la photo)</label>
            <input value={f.image} onChange={(e) => set("image", e.target.value)} placeholder="https://...jpg" className={inp} />
            {f.image && <img src={f.image} alt="" className="mt-2 h-20 w-20 rounded-[9px] object-cover border border-[#30363D]" />}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[.72rem] font-bold text-[#8B949E]">Description (optionnel)</label>
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Détails du produit..." className={inp} />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[.82rem] text-[#E6EDF3]">
          <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-[#6366F1]" />
          🔥 Mettre « À la Une » (affiché sur l'accueil)
        </label>
        <button onClick={submit} disabled={busy} className={`${btnP} mt-4 w-full py-2.5`}>{busy ? "⏳ Import en cours…" : "+ Importer le produit"}</button>
      </Card>

      {done.length > 0 && (
        <Card>
          <div className="mb-2 text-[.85rem] font-bold text-[#E6EDF3]">Produits importés ({done.filter((r) => r.ok).length})</div>
          {done.map((r, i) => (
            <div key={i} className="flex items-center justify-between border-b border-[#21262D] py-1.5 text-[.8rem] last:border-0">
              <span className="min-w-0 flex-1 truncate text-[#E6EDF3]">
                {r.ok ? (r.status === "pending" ? "⏳" : "✅") : "❌"} {r.title}
                {r.moderation_reason && <span className="ml-2 text-[#FFC93C]">Modération</span>}
              </span>
              {r.ok && r.slug
                ? <a href={`/annonce/${r.id}/${r.slug}`} target="_blank" rel="noopener noreferrer" className="ml-2 shrink-0 font-bold text-[#43E97B]">Voir →</a>
                : <span className="ml-2 shrink-0 text-[.7rem] text-[#F85149]">{r.error}</span>}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

async function adminApi(action: string, payload: Record<string, any> = {}) {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action, ...payload }),
  });
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
  const [created, setCreated] = useState<{ login: string; password: string } | null>(null);
  const [userPage, setUserPage] = useState(1);
  const itemsPerPage = 10;
  const [creditUser, setCreditUser] = useState<any | null>(null);
  const [userCredits, setUserCredits] = useState<any[]>([]);
  const [creditBusy, setCreditBusy] = useState(false);
  const [grantKey, setGrantKey] = useState("premium");
  const [grantQty, setGrantQty] = useState("1");

  useEffect(() => {
    setUserPage(1);
  }, [search]);

  async function refreshList() {
    try { const d = await adminApi("list"); setServerUsers(d.users || []); }
    catch { setServerUsers(null); } // pas de service role → repli sur profils anon
  }
  useEffect(() => { refreshList(); }, []);

  const source = serverUsers ?? profiles;
  const filtered = source.filter((u: any) => !search || (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase()) || (u.phone || "").includes(search));

  async function createAccount() {
    // Mode rapide terrain : nom d'utilisateur suffit (email + mot de passe optionnels)
    if (!form.username && !form.email) { T("⚠ Nom d'utilisateur OU email requis"); return; }
    setBusy(true);
    try {
      const r = await adminApi("create", {
        username: form.username || "",
        email: form.email || "",
        password: form.password || "",
        full_name: form.full_name || "",
        role: form.role || "user",
      });
      setCreated({ login: form.username || r.email || "", password: r.password || form.password || "" });
      T("✅ Compte créé"); setForm({ role: "employee" }); refreshList();
    } catch (e: any) { T(`❌ ${e.message}`); }
    finally { setBusy(false); }
  }
  async function setRole(userId: string, role: string) {
    try {
      await adminApi("setRole", { userId, role });
      T("✅ Rôle mis à jour");
      await refreshList();
      reload();
    }
    catch (e: any) {
      T(`❌ Erreur rôle : ${e.message}`);
      await refreshList(); // recharge pour annuler le changement visuel
    }
  }
  async function setVip(userId: string, value: boolean) {
    try { await adminApi("setVip", { userId, value }); T(value ? "🎁 VIP gratuit activé" : "VIP retiré"); refreshList(); reload(); }
    catch (e: any) { T(`❌ ${e.message}`); }
  }
  async function setVerified(userId: string, value: boolean) {
    try { await adminApi("setVerified", { userId, value }); T(value ? "✅ Compte vérifié" : "Vérification retirée"); refreshList(); reload(); }
    catch (e: any) { T(`❌ ${e.message}`); }
  }
  async function del(userId: string) {
    if (!confirm("Supprimer définitivement ce compte ?")) return;
    try { await adminApi("delete", { userId }); T("🗑️ Compte supprimé"); refreshList(); reload(); }
    catch (e: any) { T(`❌ ${e.message}`); }
  }
  async function openCredits(u: any) {
    setCreditUser(u); setUserCredits([]);
    try { const d = await adminApi("listCredits", { userId: u.id }); setUserCredits(d.credits || []); }
    catch (e: any) { T(`❌ ${e.message}`); }
  }
  async function grantCredit() {
    if (!creditUser) return;
    setCreditBusy(true);
    const days: Record<string, number> = { premium: 14, alaune: 30, vip: 60 };
    const names: Record<string, string> = { premium: "⭐ Premium", alaune: "🔥 À la Une", vip: "👑 VIP" };
    try {
      await adminApi("grantCredit", { userId: creditUser.id, boost_key: grantKey, boost_name: names[grantKey], duration_days: days[grantKey] || 30, quantity: grantQty });
      T("✅ Crédits ajoutés");
      const d = await adminApi("listCredits", { userId: creditUser.id }); setUserCredits(d.credits || []);
    } catch (e: any) { T(`❌ ${e.message}`); }
    finally { setCreditBusy(false); }
  }
  async function removeCredit(id: string) {
    try { await adminApi("removeCredit", { creditId: id }); T("🗑️ Crédit retiré"); setUserCredits((c) => c.filter((x) => x.id !== id)); }
    catch (e: any) { T(`❌ ${e.message}`); }
  }

const roleColor = (r: string) => r === "employee" ? "bg-blue-500/15 text-blue-300" : r === "ambassador" ? "bg-amber-500/15 text-amber-300" : r === "pro" || r === "business" ? "bg-violet-500/15 text-violet-300" : r === "admin" || r === "super_admin" ? "bg-red-500/15 text-red-300" : "bg-white/10 text-gray-400";

return (
  <>
    <PageHead title="👥 Utilisateurs & Équipe" sub={`${source.length} comptes${serverUsers ? "" : " · (liste limitée — ajoutez la clé service role)"}`}>
      <button className={btnP} onClick={() => setShowCreate((v) => !v)}>{showCreate ? "✕ Fermer" : "+ Créer un compte"}</button>
    </PageHead>

    {showCreate && (
      <div className="mb-3"><Card title="Créer un compte (terrain : nom d'utilisateur suffit)">
        <p className="mb-2 text-[.78rem] text-gray-400">💡 Sur le terrain : saisis juste un <b className="text-white">nom d'utilisateur</b> → un mot de passe est généré. Le vendeur se connecte, puis met son vrai email et ses infos.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={form.username || ""} onChange={(e) => setForm((v) => ({ ...v, username: e.target.value }))} placeholder="Nom d'utilisateur (ex: boutiquefatou)" className="rounded-[9px] border border-[#6366F1]/50 bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]" />
          <input value={form.full_name || ""} onChange={(e) => setForm((v) => ({ ...v, full_name: e.target.value }))} placeholder="Nom complet / boutique (optionnel)" className="rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]" />
          <input value={form.email || ""} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} placeholder="Email (optionnel)" className="rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]" />
          <input value={form.password || ""} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} placeholder="Mot de passe (auto si vide)" className="rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]" />
          <select value={form.role} onChange={(e) => setForm((v) => ({ ...v, role: e.target.value }))} className="rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none">
            <option value="user">👤 Utilisateur / Vendeur</option>
            <option value="pro">🚀 Vendeur Pro (boutique)</option>
            <option value="employee">👨‍💼 Employé (commercial)</option>
            <option value="ambassador">🤝 Ambassadeur</option>
          </select>
        </div>
        <button disabled={busy} className={`${btnP} mt-3 disabled:opacity-60`} onClick={createAccount}>{busy ? "⏳ Création…" : "Créer le compte"}</button>

        {created && (
          <div className="mt-3 rounded-[10px] border border-emerald-500/40 bg-emerald-500/10 p-3">
            <p className="mb-1 text-[.82rem] font-bold text-emerald-300">✅ Compte créé — note ces identifiants (à donner au vendeur) :</p>
            <div className="font-mono text-[.85rem] text-white">
              <div>👤 Identifiant : <b className="select-all">{created.login}</b></div>
              <div>🔑 Mot de passe : <b className="select-all">{created.password}</b></div>
            </div>
            <p className="mt-1 text-[.72rem] text-gray-400">Le vendeur se connecte avec ce nom d'utilisateur + mot de passe, puis modifie son compte (vrai email, infos).</p>
            <button className="mt-2 rounded-[8px] bg-emerald-500/20 px-3 py-1 text-[.78rem] text-emerald-200" onClick={() => { navigator.clipboard?.writeText(`Identifiant: ${created.login}\nMot de passe: ${created.password}`); T("📋 Copié"); }}>📋 Copier</button>
          </div>
        )}
      </Card></div>
    )}

    <div className="mb-3">
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Rechercher par nom, email ou téléphone…" className="w-full max-w-md rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3.5 py-2.5 text-[.83rem] text-white outline-none focus:border-[#6366F1]" />
    </div>
    <Card>
      {filtered.length === 0 ? <div className="py-10 text-center text-[.85rem] text-[#8B949E]">Aucun utilisateur. Créez un compte ou ajoutez la clé service role pour tout voir.</div> : (
        <>
          <div className="space-y-2">
            {filtered.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage).map((u: any) => (
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
                {u.is_verified && <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[.68rem] font-bold text-emerald-300">✓ Vérifié</span>}
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  <select value={u.role || "user"} onChange={(e) => setRole(u.id, e.target.value)} className="rounded-[7px] border border-[#30363D] bg-[#0D1117] px-2 py-1 text-[.7rem] font-bold text-[#A5B4FC] outline-none">
                    {["user", "pro", "employee", "ambassador", "admin"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => setVip(u.id, !u.free_premium)} className={`rounded-[7px] px-2.5 py-1 text-[.7rem] font-bold ${u.free_premium ? "bg-amber-500/20 text-amber-300" : "bg-white/5 text-[#FFC93C] hover:bg-amber-500/15"}`}>{u.free_premium ? "🎁 Retirer" : "🎁 VIP"}</button>
                  <button onClick={() => setVerified(u.id, !u.is_verified)} className={`rounded-[7px] px-2.5 py-1 text-[.7rem] font-bold ${u.is_verified ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-emerald-400 hover:bg-emerald-500/15"}`}>{u.is_verified ? "✓ Annuler" : "✓ Vérifier"}</button>
                  <button onClick={() => openCredits(u)} className="rounded-[7px] bg-violet-500/15 px-2.5 py-1 text-[.7rem] font-bold text-violet-300 hover:bg-violet-500/25">💳 Crédits</button>
                  {serverUsers && <button onClick={() => del(u.id)} className="rounded-[7px] bg-red-500/10 px-2.5 py-1 text-[.7rem] font-bold text-red-300 hover:bg-red-500/20">🗑️</button>}
                </div>
              </div>
            ))}
          </div>
          {filtered.length > itemsPerPage && (
            <div className="mt-4 flex flex-wrap justify-center items-center gap-1.5 border-t border-[#21262D] pt-4">
              <button
                disabled={userPage === 1}
                onClick={() => setUserPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-[#30363D] bg-[#21262D] text-[0.8rem] font-bold disabled:opacity-40 hover:text-white"
              >
                ‹ Précédent
              </button>
              {Array.from({ length: Math.ceil(filtered.length / itemsPerPage) }, (_, idx) => idx + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setUserPage(p)}
                  className={`h-8 w-8 rounded-lg text-[0.8rem] font-bold transition ${p === userPage ? "bg-[#6366F1] text-white" : "border border-[#30363D] bg-[#161B22] hover:text-white"}`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={userPage === Math.ceil(filtered.length / itemsPerPage)}
                onClick={() => setUserPage(p => Math.min(Math.ceil(filtered.length / itemsPerPage), p + 1))}
                className="px-3 py-1.5 rounded-lg border border-[#30363D] bg-[#21262D] text-[0.8rem] font-bold disabled:opacity-40 hover:text-white"
              >
                Suivant ›
              </button>
            </div>
          )}
        </>
      )}
    </Card>

    {/* MODAL — gestion des crédits d'un utilisateur */}
    {creditUser && (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" onClick={() => setCreditUser(null)}>
        <div className="w-full max-w-md rounded-2xl border border-[#30363D] bg-[#0D1117] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[.95rem] font-bold text-white">💳 Crédits — {creditUser.full_name || creditUser.email || "user"}</h3>
            <button onClick={() => setCreditUser(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>

          {/* Ajouter des crédits */}
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#21262D] bg-[#161B22] p-2.5">
            <select value={grantKey} onChange={(e) => setGrantKey(e.target.value)} className="rounded-[8px] border border-[#30363D] bg-[#0D1117] px-2 py-1.5 text-[.78rem] text-white outline-none">
              <option value="premium">⭐ Premium</option>
              <option value="alaune">🔥 À la Une</option>
              <option value="vip">👑 VIP</option>
            </select>
            <input type="number" min={1} max={50} value={grantQty} onChange={(e) => setGrantQty(e.target.value)} className="w-16 rounded-[8px] border border-[#30363D] bg-[#0D1117] px-2 py-1.5 text-[.78rem] text-white outline-none" />
            <button disabled={creditBusy} onClick={grantCredit} className="rounded-[8px] bg-emerald-500/20 px-3 py-1.5 text-[.78rem] font-bold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50">{creditBusy ? "…" : "+ Ajouter"}</button>
          </div>

          {/* Liste des crédits */}
          <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
            {userCredits.length === 0 ? (
              <p className="py-6 text-center text-[.82rem] text-gray-500">Aucun crédit pour ce compte.</p>
            ) : userCredits.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#21262D] bg-[#161B22] px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[.8rem] font-bold text-white truncate">{c.boost_name || c.boost_key}</div>
                  <div className="flex items-center gap-1.5 text-[.66rem]">
                    <span className={`rounded px-1.5 py-0.5 font-bold ${c.status === "available" ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-gray-400"}`}>{c.status === "available" ? "disponible" : "utilisé"}</span>
                    <span className="text-gray-500">{c.source === "gift" ? "🎁 offert" : c.source === "admin" ? "👑 admin" : "💵 acheté"} · {c.duration_days}j</span>
                  </div>
                </div>
                {c.status === "available"
                  ? <button onClick={() => removeCredit(c.id)} className="shrink-0 rounded-[7px] bg-red-500/10 px-2.5 py-1 text-[.7rem] font-bold text-red-300 hover:bg-red-500/20">🗑️ Retirer</button>
                  : <span className="shrink-0 text-[.66rem] text-gray-500">verrouillé</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </>
);
}

function parseDays(duration: string): number {
  if (/illimit/i.test(duration)) return 3650;
  const mois = duration.match(/(\d+)\s*mois/i);
  if (mois) return parseInt(mois[1], 10) * 30;
  const jours = duration.match(/(\d+)\s*jour/i);
  if (jours) return parseInt(jours[1], 10);
  return 30;
}

// Encaissement manuel (espèces) : activer un plan pour un client qui paie en main propre
function Encaissement({ profiles, allListings, T, reload }: { profiles: any[]; allListings: any[]; T: (m: string) => void; reload: () => void }) {
  const [serverUsers, setServerUsers] = useState<any[] | null>(null);
  useEffect(() => { adminApi("list").then((d) => setServerUsers(d.users || [])).catch(() => setServerUsers(null)); }, []);
  const allUsers = serverUsers ?? profiles;
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [kind, setKind] = useState<"boost" | "sub">("boost");
  const [category, setCategory] = useState<string>(Object.keys(SUBSCRIPTION_PLANS)[0] || "");
  const [planKey, setPlanKey] = useState<string>("");
  const [listingId, setListingId] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [days, setDays] = useState<string>("");
  const [asCredit, setAsCredit] = useState(false);
  const [qty, setQty] = useState<string>("1");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; user: string; ref: string; expires?: string; credits?: number } | null>(null);

  const selectedUser = allUsers.find((p: any) => p.id === userId);
  const userLabel = (p: any) => p.full_name || p.email || p.phone || p.id?.slice(0, 8);
  const filteredUsers = !search ? allUsers.slice(0, 40)
    : allUsers.filter((p: any) => `${p.full_name || ""} ${p.email || ""} ${p.phone || ""}`.toLowerCase().includes(search.toLowerCase())).slice(0, 40);

  const userListings = allListings.filter((l: any) => (l.user_id || l.owner_id || l.profile_id) === userId);

  const plans = kind === "boost" ? BOOSTS.filter((b) => b.price > 0) : (SUBSCRIPTION_PLANS[category] || []).filter((p) => p.price > 0);
  const selectedPlan: any = plans.find((p: any) => p.key === planKey);

  // Pré-remplit montant + durée quand on choisit un plan
  function pickPlan(key: string) {
    setPlanKey(key);
    const p: any = plans.find((x: any) => x.key === key);
    if (p) { setAmount(String(p.price)); setDays(String(parseDays(p.duration))); }
  }

  // Pour un boost : si pas d'annonce sélectionnée ou si l'admin coche "crédit",
  // on vend en crédit (réutilisable plus tard par le client).
  const sellAsCredit = kind === "boost" && (asCredit || !listingId);
  const nQty = Math.max(1, Math.min(50, Number(qty) || 1));

  async function activate() {
    if (!userId) { T("⚠ Choisis un client"); return; }
    if (!selectedPlan) { T("⚠ Choisis un plan"); return; }
    setBusy(true);
    try {
      const baseAmount = Number(amount) || selectedPlan.price;
      const r = await adminApi("activatePlan", {
        userId, kind, planKey,
        planName: selectedPlan.name,
        amount: sellAsCredit ? baseAmount * nQty : baseAmount,
        durationDays: Number(days) || parseDays(selectedPlan.duration),
        listingId: kind === "boost" && !sellAsCredit ? listingId : undefined,
        asCredit: sellAsCredit,
        quantity: sellAsCredit ? nQty : 1,
      });
      setDone({ name: selectedPlan.name, user: userLabel(selectedUser), ref: r.ref, expires: r.expires, credits: r.credits });
      T(sellAsCredit ? `✅ ${nQty} crédit(s) vendu(s)` : "✅ Plan activé (espèces encaissées)");
      reload();
      setPlanKey(""); setListingId(""); setAmount(""); setDays(""); setAsCredit(false); setQty("1");
    } catch (e: any) { T(`❌ ${e.message}`); }
    finally { setBusy(false); }
  }

  const inp = "rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none focus:border-[#6366F1]";

  return (
    <>
      <PageHead title="💵 Encaissement espèces — Activation manuelle" sub="Un client te paie en main propre → tu actives son plan ici. La transaction est enregistrée." />

      {done && (
        <div className="mb-3 rounded-[12px] border border-emerald-500/40 bg-emerald-500/10 p-3">
          {done.credits ? (
            <>
              <p className="text-[.85rem] font-bold text-emerald-300">✅ {done.credits} crédit(s) « {done.name} » vendu(s) à {done.user}</p>
              <p className="text-[.74rem] text-gray-300">Réf : {done.ref} · le client les utilisera depuis son tableau de bord → Crédits.</p>
            </>
          ) : (
            <>
              <p className="text-[.85rem] font-bold text-emerald-300">✅ {done.name} activé pour {done.user}</p>
              <p className="text-[.74rem] text-gray-300">Réf : {done.ref}{done.expires ? ` · expire le ${new Date(done.expires).toLocaleDateString("fr-FR")}` : ""}</p>
            </>
          )}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {/* 1. Client */}
        <Card title="1. Choisir le client">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Rechercher (nom, email, téléphone)…" className={`${inp} mb-2 w-full`} />
          <div className="max-h-[240px] space-y-1 overflow-y-auto">
            {filteredUsers.length === 0 ? <p className="py-4 text-center text-[.8rem] text-[#8B949E]">Aucun client.</p> :
              filteredUsers.map((p: any) => (
                <button key={p.id} onClick={() => { setUserId(p.id); setListingId(""); }}
                  className={`flex w-full items-center gap-2 rounded-[9px] border p-2 text-left text-[.8rem] ${userId === p.id ? "border-[#6366F1] bg-[#6366F1]/10" : "border-[#21262D] bg-[#0D1117] hover:border-[#30363D]"}`}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#21262D] text-[.7rem] font-bold text-white">{(userLabel(p) || "?")[0]?.toUpperCase()}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-bold text-[#E6EDF3]">{userLabel(p)}</span><span className="block truncate text-[.7rem] text-[#8B949E]">{p.email || p.phone || "—"}</span></span>
                  {userId === p.id && <span className="text-[#6366F1]">✓</span>}
                </button>
              ))}
          </div>
        </Card>

        {/* 2. Plan */}
        <Card title="2. Choisir le plan">
          <div className="mb-2 flex gap-2">
            <button onClick={() => { setKind("boost"); setPlanKey(""); }} className={`flex-1 rounded-[9px] px-3 py-2 text-[.8rem] font-bold ${kind === "boost" ? "bg-g1 text-white" : "bg-white/5 text-[#A5B4FC]"}`}>🚀 Boost annonce</button>
            <button onClick={() => { setKind("sub"); setPlanKey(""); }} className={`flex-1 rounded-[9px] px-3 py-2 text-[.8rem] font-bold ${kind === "sub" ? "bg-g1 text-white" : "bg-white/5 text-[#A5B4FC]"}`}>💎 Abonnement compte</button>
          </div>

          {kind === "sub" && (
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPlanKey(""); }} className={`${inp} mb-2 w-full`}>
              {Object.keys(SUBSCRIPTION_PLANS).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <select value={planKey} onChange={(e) => pickPlan(e.target.value)} className={`${inp} mb-2 w-full`}>
            <option value="">— Sélectionner —</option>
            {plans.map((p: any) => <option key={p.key} value={p.key}>{p.name} · {formatNumber(p.price)} FCFA · {p.duration}</option>)}
          </select>

          {kind === "boost" && userId && userListings.length > 0 && (
            <>
              <label className="mb-1 flex items-center gap-2 text-[.78rem] text-[#A5B4FC]">
                <input type="checkbox" checked={asCredit} onChange={(e) => setAsCredit(e.target.checked)} />
                Vendre comme crédit (le client l'utilisera plus tard)
              </label>
              {!asCredit && (
                <select value={listingId} onChange={(e) => setListingId(e.target.value)} className={`${inp} mb-2 w-full`}>
                  <option value="">— Annonce à booster maintenant —</option>
                  {userListings.map((l: any) => <option key={l.id} value={l.id}>{l.title || l.name || l.id?.slice(0, 8)}</option>)}
                </select>
              )}
            </>
          )}
          {kind === "boost" && userId && userListings.length === 0 && (
            <div className="mb-2 rounded-[9px] border border-[#6366F1]/40 bg-[#6366F1]/10 p-2.5 text-[.76rem] text-[#A5B4FC]">
              💳 Ce client n'a pas encore d'annonce → la vente se fait en <b>crédit boost</b>. Il l'utilisera quand il publiera une annonce.
            </div>
          )}

          {sellAsCredit && (
            <div className="mb-2"><label className="mb-1 block text-[.7rem] text-[#8B949E]">Nombre de crédits</label><input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="1" className={`${inp} w-full`} /></div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div><label className="mb-1 block text-[.7rem] text-[#8B949E]">Montant unitaire (FCFA)</label><input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`${inp} w-full`} /></div>
            <div><label className="mb-1 block text-[.7rem] text-[#8B949E]">Durée du boost (jours)</label><input value={days} onChange={(e) => setDays(e.target.value)} placeholder="30" className={`${inp} w-full`} /></div>
          </div>
          {sellAsCredit && selectedPlan && <p className="mt-1 text-[.76rem] text-emerald-300">Total à encaisser : <b>{formatNumber((Number(amount) || selectedPlan.price) * nQty)} FCFA</b> pour {nQty} crédit(s)</p>}

          <button disabled={busy} onClick={activate} className={`${btnP} mt-3 w-full disabled:opacity-60`}>
            {busy ? "⏳ En cours…" : sellAsCredit ? `💳 Vendre ${nQty} crédit(s)${selectedUser ? ` à ${userLabel(selectedUser)}` : ""}` : `💵 Encaisser & activer${selectedUser ? ` pour ${userLabel(selectedUser)}` : ""}`}
          </button>
        </Card>
      </div>
    </>
  );
}

function Finance({ purchases, counts }: { purchases: any[]; counts: any }) {
  const total = purchases.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const paid = purchases.filter(p => ["paid", "completed", "success"].includes(p.status));
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
  const [adPage, setAdPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setAdPage(1);
  }, [filter, search]);

  const filtered = allListings.filter(a => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search && !(a.title || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function changeStatus(id: string, status: string) {
    // Passe par l'API admin (service role) : la clé anon est bloquée par RLS.
    try {
      await adminApi("setListingStatus", { listingId: id, status });
    } catch (e: any) {
      T(`❌ ${e?.message || "Action refusée (droits admin requis)"}`);
      return;
    }
    T(status === "active" ? "✅ Annonce activée" : status === "rejected" ? "❌ Annonce rejetée" : `📦 Statut → ${status}`);
    reload();
  }

  async function toggleFeatured(id: string, value: boolean) {
    try { await adminApi("setFeatured", { listingId: id, value }); T(value ? "🔥 Mise à la Une" : "Retirée de la Une"); reload(); }
    catch (e: any) { T(`❌ ${e.message}`); }
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
        {filtered.length === 0 ? <div className="py-10 text-center text-[.85rem] text-[#8B949E]">Aucune annonce trouvée</div> : (
          <>
            <div className="space-y-2">
              {filtered.slice((adPage - 1) * itemsPerPage, adPage * itemsPerPage).map((a) => (
                <div key={a.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-[9px] border border-[#21262D] bg-[#0D1117] p-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-[#21262D]">{a.image && <img src={a.image} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="min-w-[120px] flex-1">
                    <div className="text-[.84rem] font-bold text-[#E6EDF3] truncate">{a.title}</div>
                    <div className="text-[.72rem] text-[#8B949E]">{a.category || "—"} · {a.location || "—"} · {a.views || 0} vues · {a.price || "—"}</div>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-[.68rem] font-bold ${a.status === "active" ? "bg-emerald-500/15 text-emerald-300" : a.status === "pending" ? "bg-amber-500/15 text-amber-300" : a.status === "sold" ? "bg-blue-500/15 text-blue-300" : a.status === "rejected" ? "bg-red-500/15 text-red-300" : "bg-white/10 text-gray-400"}`}>{a.status || "—"}</span>
                  <div className="flex gap-1.5 shrink-0">
                    {(a.featured || a.is_featured)
                      ? <button onClick={() => toggleFeatured(a.id, false)} className="rounded-[7px] bg-amber-500/25 px-2 py-1 text-[.68rem] font-bold text-amber-200 hover:bg-amber-500/35">🔥 Retirer Une</button>
                      : <button onClick={() => toggleFeatured(a.id, true)} className="rounded-[7px] bg-amber-500/10 px-2 py-1 text-[.68rem] font-bold text-amber-300 hover:bg-amber-500/25">🔥 À la Une</button>}
                    {a.status !== "active" && <button onClick={() => changeStatus(a.id, "active")} className="rounded-[7px] bg-emerald-500/15 px-2 py-1 text-[.68rem] font-bold text-emerald-300 hover:bg-emerald-500/25">✓ Activer</button>}
                    {a.status !== "rejected" && <button onClick={() => changeStatus(a.id, "rejected")} className="rounded-[7px] bg-red-500/15 px-2 py-1 text-[.68rem] font-bold text-red-300 hover:bg-red-500/25">✕ Rejeter</button>}
                    {a.status !== "inactive" && a.status !== "rejected" && <button onClick={() => changeStatus(a.id, "inactive")} className="rounded-[7px] bg-white/5 px-2 py-1 text-[.68rem] font-bold text-gray-400 hover:text-white">⏸ Désactiver</button>}
                  </div>
                </div>
              ))}
            </div>
            {filtered.length > itemsPerPage && (
              <div className="mt-4 flex flex-wrap justify-center items-center gap-1.5 border-t border-[#21262D] pt-4">
                <button
                  disabled={adPage === 1}
                  onClick={() => setAdPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#30363D] bg-[#21262D] text-[0.8rem] font-bold disabled:opacity-40 hover:text-white"
                >
                  ‹ Précédent
                </button>
                {Array.from({ length: Math.ceil(filtered.length / itemsPerPage) }, (_, idx) => idx + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setAdPage(p)}
                    className={`h-8 w-8 rounded-lg text-[0.8rem] font-bold transition ${p === adPage ? "bg-[#6366F1] text-white" : "border border-[#30363D] bg-[#161B22] hover:text-white"}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={adPage === Math.ceil(filtered.length / itemsPerPage)}
                  onClick={() => setAdPage(p => Math.min(Math.ceil(filtered.length / itemsPerPage), p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#30363D] bg-[#21262D] text-[0.8rem] font-bold disabled:opacity-40 hover:text-white"
                >
                  Suivant ›
                </button>
              </div>
            )}
          </>
        )}
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

function Points({ profiles }: { profiles: any[] }) {
  const gains = [["Créer un compte", "50"], ["Publier une annonce", "10"], ["Annonce vendue", "100"], ["Partager sur réseaux", "5"], ["Parrainer un ami", "50"], ["Parrainage converti", "200"], ["Recevoir un avis 5★", "25"], ["Se connecter / jour", "2"]];
  const rewards = [["100 pts", "1 annonce gratuite", "text-[#FFC93C]"], ["500 pts", "Mise en avant 7 jours", "text-[#4FACFE]"], ["1 000 pts", "1 mois Pack Pro offert", "text-[#A78BFA]"], ["5 000 pts", "Badge Ambassadeur Or", "text-[#FFC93C]"], ["10 000 pts", "1 an Premium offert", "text-[#F093FB]"]];
  const niveau = (pts: number) => pts >= 5000 ? "💎 Diamant" : pts >= 2000 ? "🥇 Or" : pts >= 500 ? "🥈 Argent" : "🥉 Bronze";
  // Classement RÉEL : par crédits du compte (proxy de points en attendant le système complet)
  const lead = [...profiles]
    .map((p) => ({ name: p.full_name || p.email || "(sans nom)", pts: Number(p.points ?? p.credits ?? 0) }))
    .sort((a, b) => b.pts - a.pts).slice(0, 10);
  return (
    <>
      <PageHead title="⭐ Points & Fidélité" sub="Barème du programme · classement réel des comptes" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Comment gagner des points">{gains.map(([a, p]) => <div key={a} className="mb-1.5 flex items-center justify-between rounded-lg bg-[#0D1117] p-2.5 text-[.8rem]"><span className="text-[#C9D1D9]">{a}</span><span className="font-extrabold text-[#FFC93C]">+{p} pts</span></div>)}</Card>
        <Card title="Récompenses disponibles">{rewards.map(([p, n, c]) => <div key={p} className="mb-1.5 flex items-center gap-2.5 rounded-lg bg-[#0D1117] p-2.5"><span className={`w-[70px] shrink-0 text-[.8rem] font-extrabold ${c}`}>{p}</span><span className="text-[.8rem] text-[#C9D1D9]">{n}</span></div>)}</Card>
      </div>
      <div className="mt-3"><Card title="Top comptes (par crédits)">
        {lead.length === 0 || lead.every((l) => l.pts === 0) ? (
          <div className="py-6 text-center text-[.82rem] text-[#8B949E]">Aucun point/crédit attribué pour l'instant.</div>
        ) : (
          <Tbl head={["#", "Utilisateur", "Crédits", "Niveau"]}>{lead.map((r, i) => <tr key={i}><Td><span className="font-extrabold text-[#FFC93C]">{i + 1}</span></Td><Td bold>{r.name}</Td><Td><span className="font-extrabold text-emerald-400">{r.pts.toLocaleString("fr-FR")}</span></Td><Td>{niveau(r.pts)}</Td></tr>)}</Tbl>
        )}
      </Card></div>
    </>
  );
}

function Diffusion({ allListings, T }: { allListings: any[]; T: (m: string) => void }) {
  const [picked, setPicked] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [doneGroups, setDoneGroups] = useState<Record<string, boolean>>({});
  const ad = allListings.find((a) => a.id === picked);
  const siteUrl = (typeof window !== "undefined" ? window.location.origin : "https://wanteermako.com");
  const adUrl = ad ? `${siteUrl}/annonce/${ad.id}/${ad.slug || ""}` : "";
  const shareText = ad ? `🔥 ${ad.title}\n${ad.price ? `💰 Prix : ${Number(ad.price).toLocaleString("fr-FR")} FCFA\n` : ""}${ad.location ? `📍 ${ad.location}\n` : ""}\n👉 ${adUrl}\n\nSur Wanteermako — achetez, vendez et trouvez vite.\n#Wanteermako #BonsPlans` : "";
  const packs = [["➕ Plus", "Site + Facebook", "+ 10 000 FCFA/mois"], ["🚀 Premium", "Site + FB + WhatsApp", "+ 30 000 FCFA/mois"], ["👑 Elite", "Site + FB + WA + Sponsorisé", "+ 75 000 FCFA/mois"]];
  const doneCount = Object.values(doneGroups).filter(Boolean).length;
  const filteredGroups = FB_GROUPS.filter((g, i) => {
    if (!groupFilter.trim()) return true;
    const q = groupFilter.toLowerCase().trim();
    return g.url.toLowerCase().includes(q) || `groupe ${i + 1}`.includes(q);
  });

  useEffect(() => {
    if (!picked || typeof window === "undefined") {
      setDoneGroups({});
      return;
    }
    try {
      setDoneGroups(JSON.parse(localStorage.getItem(`wmk_fb_groups_${picked}`) || "{}"));
    } catch {
      setDoneGroups({});
    }
  }, [picked]);

  function groupName(url: string, index: number) {
    const raw = (url.split("/groups/")[1] || "").replace(/\/+$/, "");
    if (!raw) return `Groupe ${index + 1}`;
    return /^\d+$/.test(raw) ? `Groupe ${index + 1} · ${raw.slice(0, 6)}...` : raw;
  }

  function saveDone(next: Record<string, boolean>) {
    setDoneGroups(next);
    if (picked && typeof window !== "undefined") {
      localStorage.setItem(`wmk_fb_groups_${picked}`, JSON.stringify(next));
    }
  }

  async function copyText() {
    if (!shareText) return;
    await navigator.clipboard?.writeText(shareText);
    T("📋 Texte de diffusion copié");
  }

  async function openGroup(url: string) {
    await copyText();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function toggleDone(url: string) {
    const next = { ...doneGroups, [url]: !doneGroups[url] };
    saveDone(next);
  }

  return (
    <>
      <PageHead title="📡 Diffusion multi-canaux" sub="Partage rapide des annonces · groupes Facebook assistés depuis l'admin" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Partager une annonce">
          <select value={picked} onChange={(e) => setPicked(e.target.value)} className="mb-2 w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none">
            <option value="">— Choisir une annonce —</option>
            {allListings.slice(0, 100).map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          {ad && (
            <>
              <textarea readOnly value={shareText} rows={4} className="mb-2 w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] p-2.5 text-[.78rem] text-[#C9D1D9] outline-none" />
              <div className="flex flex-wrap gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="rounded-[8px] bg-[#25D366] px-3 py-1.5 text-[.78rem] font-bold text-white">💬 WhatsApp</a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(adUrl)}`} target="_blank" rel="noopener noreferrer" className="rounded-[8px] bg-[#1877F2] px-3 py-1.5 text-[.78rem] font-bold text-white">📘 Facebook page/profil</a>
                <button onClick={copyText} className="rounded-[8px] border border-[#30363D] px-3 py-1.5 text-[.78rem] font-bold text-[#A5B4FC]">📋 Copier texte</button>
              </div>
            </>
          )}
        </Card>
        <Card title="Packs de diffusion (option payante)">
          <div className="mb-2 rounded-[9px] border border-[#6366F1]/30 bg-[#6366F1]/10 p-2.5 text-[.76rem] text-[#A5B4FC]">ℹ️ Les groupes Facebook se font en diffusion assistée : l'admin copie le texte, ouvre le groupe, colle et publie. C'est plus sûr pour éviter les blocages Meta.</div>
          {packs.map(([n, c, p]) => <div key={n} className="mb-2 flex flex-wrap items-center justify-between gap-1 rounded-[9px] bg-[#0D1117] p-2.5"><div><div className="text-[.82rem] font-bold text-[#E6EDF3]">{n}</div><div className="text-[.71rem] text-[#8B949E]">{c}</div></div><span className="text-[.78rem] font-extrabold text-[#FFC93C]">{p}</span></div>)}
        </Card>
      </div>
      <div className="mt-3">
        <Card title={`Groupes Facebook (${doneCount}/${FB_GROUPS.length} faits)`} sub="Clique sur Ouvrir, colle le texte dans le groupe, puis marque comme publié.">
          {!ad ? (
            <div className="py-8 text-center text-[.82rem] text-[#8B949E]">Choisis d'abord une annonce pour préparer le texte de diffusion.</div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <input
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  placeholder="Filtrer les groupes..."
                  className="min-w-[220px] flex-1 rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none"
                />
                <button onClick={copyText} className="rounded-[8px] bg-[#1877F2] px-3 py-2 text-[.78rem] font-bold text-white">📋 Copier le texte</button>
                <button onClick={() => saveDone({})} className="rounded-[8px] border border-[#30363D] px-3 py-2 text-[.78rem] font-bold text-[#8B949E]">Réinitialiser</button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredGroups.map((g, index) => {
                  const originalIndex = FB_GROUPS.findIndex((x) => x.url === g.url);
                  const done = !!doneGroups[g.url];
                  return (
                    <div key={g.url} className={`rounded-[10px] border p-2.5 ${done ? "border-emerald-500/30 bg-emerald-500/10" : "border-[#30363D] bg-[#0D1117]"}`}>
                      <div className="mb-2 min-w-0">
                        <div className="truncate text-[.8rem] font-bold text-[#E6EDF3]">{groupName(g.url, originalIndex >= 0 ? originalIndex : index)}</div>
                        <div className="truncate text-[.65rem] text-[#8B949E]">{g.url}</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => openGroup(g.url)} className="rounded-[7px] bg-[#1877F2] px-2.5 py-1 text-[.7rem] font-bold text-white">Ouvrir</button>
                        <button onClick={() => toggleDone(g.url)} className={`rounded-[7px] px-2.5 py-1 text-[.7rem] font-bold ${done ? "bg-emerald-500/20 text-emerald-300" : "border border-[#30363D] text-[#A5B4FC]"}`}>
                          {done ? "✓ Publié" : "Marquer fait"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[.7rem] text-[#8B949E]">
                Conseil : varie légèrement le texte après quelques groupes et respecte les règles de chaque communauté pour garder une bonne portée.
              </p>
            </>
          )}
        </Card>
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

const TOGGLE_KEYS = ["Mode maintenance", "Inscriptions ouvertes", "Programme ambassadeurs", "Assistant IA", "Diffusion Facebook auto", "Paiements actifs"];

function Settings({ T }: { T: (m: string) => void }) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [toggles, setToggles] = useState<Record<string, boolean>>({ "Mode maintenance": false, "Inscriptions ouvertes": true, "Programme ambassadeurs": true, "Assistant IA": true, "Diffusion Facebook auto": true, "Paiements actifs": true });
  const [cat, setCat] = useState<string>(Object.keys(SUBSCRIPTION_PLANS)[0] || "");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    adminApi("getSettings").then((d) => {
      const s = d.settings || {};
      if (s.prices) setPrices(s.prices);
      if (s.toggles) setToggles((t) => ({ ...t, ...s.toggles }));
    }).catch(() => { /* table pas encore créée */ }).finally(() => setLoaded(true));
  }, []);

  const priceVal = (key: string, fallback: number) => (typeof prices[key] === "number" ? prices[key] : fallback);
  const setPrice = (key: string, v: string) => setPrices((p) => ({ ...p, [key]: Number(v) || 0 }));

  async function save() {
    setBusy(true);
    try { await adminApi("saveSettings", { settings: { prices, toggles } }); T("✅ Tarifs enregistrés — appliqués sur le site"); }
    catch (e: any) { T(`❌ ${e.message}`); }
    finally { setBusy(false); }
  }
  async function toggleOne(n: string) {
    const next = { ...toggles, [n]: !toggles[n] };
    setToggles(next);
    try { await adminApi("saveSettings", { settings: { prices, toggles: next } }); T("✅ Enregistré"); }
    catch (e: any) { T(`❌ ${e.message}`); }
  }

  const inp = "w-28 rounded-[9px] border-[1.5px] border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-[.85rem] font-bold text-[#FFC93C] outline-none focus:border-[#6366F1]";

  return (
    <>
      <PageHead title="⚙️ Paramètres système" sub={loaded ? "Les tarifs modifiés ici s'appliquent réellement sur le site" : "Chargement…"} />
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Tarifs RÉELS — Boosts d'annonce (FCFA)">
          <div className="space-y-2">
            {BOOSTS.filter((b) => b.price > 0).map((b) => (
              <div key={b.key} className="flex items-center justify-between gap-2 rounded-[9px] bg-[#0D1117] p-2">
                <span className="text-[.82rem] text-[#C9D1D9]">{b.name} <span className="text-[#8B949E]">({b.duration})</span></span>
                <input type="number" value={priceVal(`boost:${b.key}`, b.price)} onChange={(e) => setPrice(`boost:${b.key}`, e.target.value)} className={inp} />
              </div>
            ))}
          </div>
          <button disabled={busy} className={`${btnP} mt-3 w-full disabled:opacity-60`} onClick={save}>{busy ? "⏳…" : "💾 Sauvegarder les tarifs"}</button>
        </Card>

        <Card title="Tarifs RÉELS — Abonnements (FCFA/mois)">
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="mb-2 w-full rounded-[9px] border border-[#30363D] bg-[#0D1117] px-3 py-2 text-[.83rem] text-white outline-none">
            {Object.keys(SUBSCRIPTION_PLANS).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="space-y-2">
            {(SUBSCRIPTION_PLANS[cat] || []).filter((p) => p.price > 0).map((p) => (
              <div key={p.key} className="flex items-center justify-between gap-2 rounded-[9px] bg-[#0D1117] p-2">
                <span className="text-[.82rem] text-[#C9D1D9]">{p.name}</span>
                <input type="number" value={priceVal(`sub:${cat}:${p.key}`, p.price)} onChange={(e) => setPrice(`sub:${cat}:${p.key}`, e.target.value)} className={inp} />
              </div>
            ))}
          </div>
          <button disabled={busy} className={`${btnP} mt-3 w-full disabled:opacity-60`} onClick={save}>{busy ? "⏳…" : "💾 Sauvegarder"}</button>
        </Card>

        <Card title="🧹 Maintenance — corriger l'erreur 494 (cookies)">
          <p className="mb-2 text-[.78rem] text-[#8B949E]">Retire les images base64 stockées par erreur dans les sessions (cause des cookies trop lourds). À lancer une fois.</p>
          <button className={`${btnP} w-full`} onClick={async () => {
            try { const d = await adminApi("cleanupMetadata"); T(`✅ ${d.cleaned}/${d.scanned} comptes nettoyés`); }
            catch (e: any) { T(`❌ ${e.message}`); }
          }}>Nettoyer les sessions lourdes</button>
        </Card>

        <Card title="Toggles système">
          <div className="space-y-2.5">
            {TOGGLE_KEYS.map((n) => {
              const on = !!toggles[n];
              return (
                <div key={n} className="flex items-center justify-between rounded-[9px] bg-[#0D1117] p-2.5">
                  <span className="text-[.83rem] font-semibold text-[#C9D1D9]">{n}</span>
                  <button onClick={() => toggleOne(n)} className={`relative h-[22px] w-10 rounded-full transition ${on ? "bg-emerald-500" : "bg-[#30363D]"}`}><span className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[21px]" : "left-[3px]"}`} /></button>
                </div>
              );
            })}
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
function Td({ children, bold, className }: { children: React.ReactNode; bold?: boolean; className?: string }) {
  return <td className={`border-b border-[#21262D] px-3 py-2.5 text-[.82rem] ${bold ? "font-bold text-[#E6EDF3]" : "text-[#C9D1D9]"} ${className || ""}`}>{children}</td>;
}
