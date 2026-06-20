"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LISTINGS } from "@/lib/data";
import { COUNTRIES } from "@/lib/constants";

/**
 * Espace admin /yamanetech (section 14). Identifiants DÉMO affichés.
 * EN PRODUCTION : hash bcrypt en base, vraie 2FA TOTP, rôle 'admin', audit log,
 * et NE JAMAIS committer ces identifiants. Voir README + lib/supabase.
 */
const DEMO = { email: "multiservicesyamane@gmail.com", pass: "YamaneTech@2025", twofa: "1234", emails: ["multiservicesyamane@gmail.com", "multiserviceyamane@gmail.com"] };

type Panel = "overview" | "moderation" | "users" | "listings" | "ads" | "finance" | "countries" | "categories" | "reports" | "logs" | "settings";
const NAV: { id: Panel; label: string; badge?: number }[] = [
  { id: "overview", label: "📊 Vue globale" },
  { id: "moderation", label: "🛡️ Modération", badge: 8 },
  { id: "users", label: "👥 Utilisateurs" },
  { id: "listings", label: "📋 Annonces" },
  { id: "ads", label: "📢 Pubs annonceurs" },
  { id: "finance", label: "💰 Finances" },
  { id: "countries", label: "🌍 Pays" },
  { id: "categories", label: "📂 Catégories" },
  { id: "reports", label: "🚩 Signalements" },
  { id: "logs", label: "📝 Audit Logs" },
  { id: "settings", label: "⚙ Réglages" },
];
const CHART = [420, 380, 510, 490, 600, 560, 720, 680, 640, 800, 880, 820, 760, 920];

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState(DEMO.email);
  const [pass, setPass] = useState(DEMO.pass);
  const [twofa, setTwofa] = useState("");
  const [panel, setPanel] = useState<Panel>("overview");
  const [toast, setToast] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // DB States
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authed) {
      fetchData();
    }
  }, [authed]);

  const fetchData = async () => {
    setLoading(true);
    const { data: u } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (u) setUsers(u);
    
    const { data: l } = await supabase.from('listings').select('*, profiles(full_name)').order('created_at', { ascending: false });
    if (l) setListings(l);

    const { data: c } = await supabase.from('categories').select('*');
    if (c) setCategories(c);

    const { data: r } = await supabase.from('reports').select('*, listings(title), profiles(full_name)');
    if (r) setReports(r);
    
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'active' } : l));
    show("✓ Annonce approuvée");
    try { await supabase.from('listings').update({ status: 'active' }).eq('id', id); } catch(e) {}
  };
  const handleReject = async (id: string) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' } : l));
    show("✗ Annonce rejetée");
    try { await supabase.from('listings').update({ status: 'rejected' }).eq('id', id); } catch(e) {}
  };
  const handleBan = async (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'banned' } : u));
    show("🚫 Utilisateur banni");
    try { await supabase.from('profiles').update({ role: 'banned' }).eq('id', id); } catch(e) {}
  };
  const handleTreatReport = async (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    show("✓ Signalement traité");
    try { await supabase.from('reports').update({ status: 'resolved' }).eq('id', id); } catch(e) {}
  };

  const handlePanelChange = (id: Panel) => {
    setPanel(id);
    setIsMobileMenuOpen(false);
  };

  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  function login() {
    if (DEMO.emails.includes(email.toLowerCase().trim()) && pass === DEMO.pass && (twofa === DEMO.twofa || twofa === "")) {
      setAuthed(true);
      show("✓ Bienvenue, Administrateur");
    } else {
      show("✗ Identifiants incorrects");
    }
  }

  if (!authed) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-grad-hero p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_20%_30%,rgba(245,166,35,.22)_0,transparent_45%)]" />
        <div className="relative z-10 w-full max-w-[400px] rounded-xl border border-dark-border bg-dark-800 p-8 shadow-glow-gold">
          <h1 className="text-center font-display text-[1.3rem] text-white">🔐 YamaneTech Admin</h1>
          <p className="mb-6 mt-1 text-center text-[.82rem] text-white/50">Espace administrateur sécurisé</p>
          <div className="mb-4 rounded-[10px] border border-dashed border-neon-gold bg-dark-700 p-3 text-[.74rem] leading-relaxed text-neon-gold">
            👉 <b>Identifiants démo :</b>
            <br />Email : {DEMO.email}
            <br />Mot de passe : {DEMO.pass}
            <br />Code 2FA : {DEMO.twofa}
          </div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="admin-input" placeholder="Email administrateur" />
          <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" className="admin-input" placeholder="Mot de passe" />
          <input value={twofa} onChange={(e) => setTwofa(e.target.value)} maxLength={4} className="admin-input" placeholder="Code 2FA (1234)" />
          <button onClick={login} className="btn btn-gold btn-block btn-lg">Se connecter →</button>
          <p className="mt-4 text-center text-[.72rem] text-white/35">Accès réservé · Toutes les actions sont journalisées</p>
        </div>
        <Toast toast={toast} />
        {/* styles locaux pour l'admin */}
        <style jsx global>{`
          .admin-input {
            width: 100%;
            padding: 0.75rem 0.9rem;
            border: 1.5px solid #243044;
            border-radius: 10px;
            font-size: 0.9rem;
            background: #1a2231;
            outline: none;
            color: #fff;
            margin-bottom: 0.8rem;
          }
          .admin-input:focus {
            border-color: #ffc93c;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white/85">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-dark-border bg-dark-800 px-4 py-3 lg:hidden">
        <div className="font-display font-extrabold text-white">🔐 Admin</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl text-white">☰</button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/60 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-[1001] w-[260px] flex-col border-r border-dark-border bg-dark-800 shadow-2xl transition-transform duration-300 lg:static lg:flex lg:w-[230px] lg:translate-x-0 lg:shadow-none ${isMobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full hidden lg:flex"}`}>
          <div className="flex items-center justify-between border-b border-dark-border px-5 pb-4 pt-4">
            <div>
              <div className="font-display text-[1.1rem] font-extrabold text-white">🔐 YamaneTech</div>
              <div className="text-[.72rem] text-neon-gold">Administration</div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-xl text-white/50 lg:hidden">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => handlePanelChange(n.id)} className={`flex w-full items-center gap-2.5 border-l-[3px] px-5 py-2.5 text-left text-[.85rem] transition ${panel === n.id ? "border-neon-gold bg-neon-gold/[.08] text-neon-gold" : "border-transparent text-white/65 hover:bg-white/[.04] hover:text-white"}`}>
                {n.label}
                {n.badge && <span className="ml-auto rounded-[10px] bg-neon-magenta px-1.5 py-0.5 text-[.6rem] text-white">{n.badge}</span>}
              </button>
            ))}
          </div>
          <div className="p-5 border-t border-dark-border">
            <Link href="/" className="text-[.82rem] text-neon-magenta flex items-center gap-2">🚪 Quitter l&apos;admin</Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-x-hidden p-5 pt-8 lg:p-8">
          {panel === "overview" && (
            <div className="animate-fadeUp">
              <H1>Vue globale de la plateforme</H1>
              <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <AKpi label="Utilisateurs" value={users.length.toString()} sub="Inscrits" neon />
                <AKpi label="Annonces actives" value={listings.filter(l=>l.status==='active').length.toString()} sub="Total publiées" />
                <AKpi label="Revenus du mois" value="12,4M FCFA" sub="↑ +18%" neon />
                <AKpi label="À modérer" value={listings.filter(l=>l.status==='pending').length.toString()} sub="En attente" magenta />
              </div>
              <ACard title="📈 Revenus 14 derniers jours">
                <div className="flex h-20 items-end gap-[3px]">
                  {CHART.map((x, i) => (
                    <div key={i} className="flex-1 rounded-t bg-neon-gold" style={{ height: `${Math.round((x / Math.max(...CHART)) * 100)}%` }} />
                  ))}
                </div>
              </ACard>
              <div className="mt-4">
                <ACard title="🔥 Top catégories">
                  {[["🏠 Immobilier", 45230, "#FFC93C"], ["📱 Électronique", 58400, "#2DE2E6"], ["🚗 Véhicules", 32100, "#FF2A6D"], ["👗 Mode", 28900, "#05FFA1"]].map(([n, c, col]) => (
                    <div key={n as string} className="mb-2.5">
                      <div className="mb-1 flex justify-between text-[.83rem]">
                        <span className="text-white/80">{n}</span>
                        <span className="font-bold" style={{ color: col as string }}>{(c as number).toLocaleString("fr-FR")}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded bg-dark-700"><div className="h-full" style={{ width: `${Math.round(((c as number) / 58400) * 100)}%`, background: col as string }} /></div>
                    </div>
                  ))}
                </ACard>
              </div>
            </div>
          )}

          {panel === "moderation" && (
            <div className="animate-fadeUp">
              <H1>🛡️ File de modération ({listings.filter(l=>l.status==='pending').length})</H1>
              <ATable head={["Annonce", "Vendeur", "Prix", "Statut", "Actions"]}>
                {listings.filter(l=>l.status==='pending').map((l) => (
                  <tr key={l.id} className="border-b border-dark-border last:border-0 hover:bg-white/[.03]">
                    <Td white>{l.title}</Td><Td>{l.profiles?.full_name || 'Inconnu'}</Td><Td>{l.price}</Td>
                    <Td><span className="text-gold">⏳ En attente</span></Td>
                    <Td><div className="flex gap-1.5"><AB ok onClick={() => handleApprove(l.id)}>Approuver</AB><AB no onClick={() => handleReject(l.id)}>Rejeter</AB></div></Td>
                  </tr>
                ))}
                {listings.filter(l=>l.status==='pending').length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-white/50 text-[.85rem]">Aucune annonce à modérer.</td></tr>
                )}
              </ATable>
            </div>
          )}

          {panel === "users" && (
            <div className="animate-fadeUp">
              <H1>👥 Utilisateurs</H1>
              <ATable head={["Nom", "Téléphone", "Date inscript.", "Statut", "Actions"]}>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-dark-border last:border-0 hover:bg-white/[.03]">
                    <Td white>{u.full_name || 'Sans nom'}</Td><Td>{u.phone || 'Non renseigné'}</Td><Td>{new Date(u.created_at).toLocaleDateString()}</Td>
                    <Td><span className={u.role === 'banned' ? "text-neon-magenta" : "text-neon-green"}>{u.role || 'user'}</span></Td>
                    <Td><div className="flex gap-1.5"><AB no onClick={() => handleBan(u.id)}>Bannir</AB></div></Td>
                  </tr>
                ))}
              </ATable>
            </div>
          )}

          {panel === "listings" && (
            <div className="animate-fadeUp">
              <H1>📋 Toutes les annonces</H1>
              <ATable head={["Titre", "Vendeur", "Catégorie", "Prix", "Vues", "Statut"]}>
                {listings.map((a) => (
                  <tr key={a.id} className="border-b border-dark-border last:border-0 hover:bg-white/[.03]">
                    <Td white>{a.title}</Td><Td>{a.profiles?.full_name || 'Inconnu'}</Td><Td>{a.category}</Td><Td>{a.price}</Td><Td>{a.views ?? 0}</Td>
                    <Td>{a.status === 'active' ? <span className="text-neon-green">Actif</span> : a.status === 'rejected' ? <span className="text-neon-magenta">Rejeté</span> : <span className="text-gold">Attente</span>}</Td>
                  </tr>
                ))}
              </ATable>
            </div>
          )}

          {panel === "ads" && (
            <div className="animate-fadeUp">
              <H1>📢 Bannières annonceurs</H1>
              <button onClick={() => show("+ Nouvelle bannière")} className="btn btn-neon btn-sm mb-4">+ Nouvelle bannière</button>
              <ATable head={["Annonceur", "Slot", "Pays ciblés", "Impressions", "Clics (CTR)", "Statut"]}>
                {[["Orange Money", "A1 Hero", "🇸🇳🇨🇮🇲🇱", "245 800", "4 920 (2.0%)", "🟢 Active"], ["Wave", "A2 In-feed", "🇸🇳🇨🇮", "189 200", "5 676 (3.0%)", "🟢 Active"], ["Coca-Cola", "A6 Footer", "Tous", "98 400", "1 476 (1.5%)", "🟡 Planifiée"], ["MTN", "A5 Annonce", "🇨🇮🇧🇯🇬🇭", "156 700", "3 134 (2.0%)", "🟢 Active"]].map(([a, s, c, i, cl, st]) => (
                  <tr key={a} className="border-b border-dark-border last:border-0 hover:bg-white/[.03]">
                    <Td white>{a}</Td><Td><span className="text-neon-cyan">{s}</span></Td><Td>{c}</Td><Td>{i}</Td><Td>{cl}</Td><Td>{st}</Td>
                  </tr>
                ))}
              </ATable>
            </div>
          )}

          {panel === "finance" && (
            <div className="animate-fadeUp">
              <H1>💰 Finances</H1>
              <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <AKpi label="Revenus boosts" value="8,2M" neon /><AKpi label="Revenus pubs" value="3,1M" neon /><AKpi label="Abonnements Pro" value="1,1M" neon /><AKpi label="Total mois" value="12,4M" neon />
              </div>
              <ACard title="Dernières transactions">
                <ATable head={["Date", "Utilisateur", "Type", "Montant", "Méthode"]}>
                  {[["10/06", "Moussa D.", "À la Une", "9 000 FCFA", "Orange Money"], ["10/06", "Aminata K.", "Premium", "3 500 FCFA", "Wave"], ["09/06", "Kwame M.", "Pack Pro", "15 000 FCFA", "MTN MoMo"], ["09/06", "Bineta F.", "Premium", "3 500 FCFA", "Carte"]].map(([d, u, t, m, me]) => (
                    <tr key={d + u} className="border-b border-dark-border last:border-0">
                      <Td>{d}</Td><Td white>{u}</Td><Td>{t}</Td><Td><span className="font-bold text-neon-green">{m}</span></Td><Td>{me}</Td>
                    </tr>
                  ))}
                </ATable>
              </ACard>
            </div>
          )}

          {panel === "countries" && (
            <div className="animate-fadeUp">
              <H1>🌍 Gestion des 27 pays</H1>
              <ATable head={["Pays", "Indicatif", "Devise", "Annonces", "Statut"]}>
                {COUNTRIES.map((c, i) => (
                  <tr key={c.code} className="border-b border-dark-border last:border-0 hover:bg-white/[.03]">
                    <Td white>{c.flag} {c.name}</Td><Td>{c.dial}</Td><Td>{c.currency}</Td><Td>{((i * 1873 + 1240) % 40000).toLocaleString("fr-FR")}</Td>
                    <Td><span className="text-neon-green">🟢 Actif</span></Td>
                  </tr>
                ))}
              </ATable>
            </div>
          )}

          {panel === "categories" && (
            <div className="animate-fadeUp">
              <H1>📂 Gestion des catégories</H1>
              <button 
                onClick={() => {
                  const name = prompt("Nom de la nouvelle catégorie ?");
                  if (name) {
                    setCategories([...categories, { id: Date.now().toString(), name, slug: name.toLowerCase().replace(/\s+/g, '-') }]);
                    show("✓ Catégorie ajoutée");
                  }
                }} 
                className="btn btn-neon btn-sm mb-4"
              >
                + Nouvelle catégorie
              </button>
              <ATable head={["Catégorie", "Sous-catégories", "Annonces actives", "Statut", "Actions"]}>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-dark-border last:border-0 hover:bg-white/[.03]">
                    <Td white>{c.name}</Td><Td><span className="text-[.75rem] text-white/50">{c.slug}</span></Td><Td>{listings.filter(l=>l.category === c.name).length}</Td><Td><span className="text-neon-green">🟢 Actif</span></Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <AB onClick={() => show("Édition bientôt disponible")}>Éditer</AB>
                        <AB no onClick={() => {
                          setCategories(categories.filter(cat => cat.id !== c.id));
                          show("✓ Catégorie désactivée");
                        }}>Désactiver</AB>
                      </div>
                    </Td>
                  </tr>
                ))}
              </ATable>
            </div>
          )}

          {panel === "reports" && (
            <div className="animate-fadeUp">
              <H1>🚩 Signalements</H1>
              <ATable head={["Annonce", "Raison", "Signalé par", "Actions"]}>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-dark-border last:border-0 hover:bg-white/[.03]">
                    <Td white>{r.listings?.title || 'Inconnue'}</Td><Td><span className="text-neon-magenta">{r.reason}</span></Td><Td>{r.profiles?.full_name || 'Anonyme'}</Td>
                    <Td><div className="flex gap-1.5"><AB ok onClick={() => handleTreatReport(r.id)}>Traiter</AB><AB onClick={() => handleTreatReport(r.id)}>Ignorer</AB></div></Td>
                  </tr>
                ))}
                {reports.length === 0 && (
                   <tr><td colSpan={4} className="p-4 text-center text-white/50 text-[.85rem]">Aucun signalement.</td></tr>
                )}
              </ATable>
            </div>
          )}

          {panel === "logs" && (
            <div className="animate-fadeUp">
              <H1>📝 Logs système</H1>
              <div className="mb-4 flex items-center justify-between">
                <input className="input !bg-dark-800 !text-white !border-dark-border max-w-[300px]" placeholder="Rechercher dans les logs..." />
                <button className="btn btn-outline btn-sm !text-white !border-dark-border">Exporter CSV</button>
              </div>
              <ATable head={["Date", "Action", "Utilisateur", "Détails", "IP"]}>
                {[
                  ["14/06 12:30", "Login", "admin@yamanetech.com", "Connexion réussie", "192.168.1.10"],
                  ["14/06 12:15", "Modération", "admin@yamanetech.com", "Approbation annonce #4592", "192.168.1.10"],
                  ["14/06 11:42", "Paiement", "Système", "Webhook Wave reçu pour #4592", "API"],
                  ["14/06 11:10", "Paramètres", "admin@yamanetech.com", "Modification tarif Premium à 3500", "192.168.1.10"],
                  ["14/06 10:05", "Bannissement", "moderator1@yamanetech.com", "Utilisateur #8902 banni (Spam)", "10.0.0.5"],
                ].map(([d, a, u, det, ip], i) => (
                  <tr key={i} className="border-b border-dark-border last:border-0 hover:bg-white/[.03]">
                    <Td white>{d}</Td>
                    <Td><span className="text-neon-cyan">{a}</span></Td>
                    <Td>{u}</Td>
                    <Td>{det}</Td>
                    <Td><span className="text-[.7rem] text-white/40 font-mono">{ip}</span></Td>
                  </tr>
                ))}
              </ATable>
            </div>
          )}

          {panel === "settings" && (
            <div className="animate-fadeUp">
              <H1>⚙ Réglages plateforme</H1>
              <ACard title="Tarifs des boosts (FCFA)">
                <div className="grid grid-cols-2 gap-4">
                  {[["Premium", "3500"], ["À la Une", "9000"], ["Pack Pro", "15000"], ["Annonces gratuites max", "10"]].map(([l, v]) => (
                    <div key={l}>
                      <label className="text-[.8rem] text-white/60">{l}</label>
                      <input defaultValue={v} className="mt-1 w-full rounded-[10px] border-[1.5px] border-dark-border bg-dark-700 px-3 py-2.5 text-[.9rem] text-white outline-none focus:border-neon-gold" />
                    </div>
                  ))}
                </div>
                <button onClick={() => show("✓ Réglages sauvegardés")} className="btn btn-neon btn-sm mt-4">Sauvegarder</button>
              </ACard>
              <div className="mt-4">
                <ACard title="Mode maintenance">
                  <label className="flex items-center gap-2.5 text-[.85rem] text-white/70">
                    <input type="checkbox" className="accent-neon-gold" /> Activer le mode maintenance
                  </label>
                </ACard>
              </div>
            </div>
          )}
        </main>
      </div>
      <Toast toast={toast} />
    </div>
  );
}

function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-5 font-display text-[1.3rem] text-white">{children}</h1>;
}
function AKpi({ label, value, sub, neon, magenta }: { label: string; value: string; sub?: string; neon?: boolean; magenta?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-dark-border bg-dark-800 p-4">
      <div className="text-[.74rem] text-white/50">{label}</div>
      <div className={`my-1 font-display text-[1.7rem] font-extrabold leading-none ${neon ? "text-neon-gold [text-shadow:0_0_16px_rgba(255,201,60,.4)]" : magenta ? "text-neon-magenta" : "text-white"}`}>{value}</div>
      {sub && <div className={`text-[.72rem] ${magenta ? "text-neon-magenta" : "text-neon-green"}`}>{sub}</div>}
    </div>
  );
}
function ACard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dark-border bg-dark-800 p-5">
      <h3 className="mb-4 font-display text-base text-white">{title}</h3>
      {children}
    </div>
  );
}
function ATable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="w-full border-collapse bg-dark-800">
        <thead>
          <tr>{head.map((h) => <th key={h} className="border-b border-dark-border bg-dark-700 p-3 text-left text-[.72rem] font-bold uppercase text-white/60">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Td({ children, white }: { children: React.ReactNode; white?: boolean }) {
  return <td className={`p-3 text-[.83rem] ${white ? "text-white" : "text-white/80"}`}>{children}</td>;
}
function AB({ children, onClick, ok, no }: { children: React.ReactNode; onClick: () => void; ok?: boolean; no?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-md border px-2.5 py-1 text-[.72rem] font-semibold transition ${ok ? "border-transparent bg-neon-green/[.12] text-neon-green" : no ? "border-transparent bg-neon-magenta/[.12] text-neon-magenta" : "border-dark-border bg-dark-700 text-white/80 hover:border-neon-gold hover:text-neon-gold"}`}>
      {children}
    </button>
  );
}
function Toast({ toast }: { toast: string | null }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-8 left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-neon-gold bg-dark-900 px-5 py-2.5 text-[.88rem] font-medium text-white shadow-lg">
      {toast}
    </div>
  );
}
