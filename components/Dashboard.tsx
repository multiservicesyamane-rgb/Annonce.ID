"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MY_ADS, MESSAGES, LISTINGS } from "@/lib/data";
import AdCard from "./AdCard";
import { createClient } from "@/lib/supabase/client";

type Panel = "overview" | "ads" | "messages" | "favorites" | "stats" | "payments" | "profile" | "security";

const NAV: { id: Panel; icon: string; label: string; section?: string; badge?: number }[] = [
  { id: "overview", icon: "📊", label: "Vue d'ensemble", section: "Principal" },
  { id: "ads", icon: "📋", label: "Mes annonces" },
  { id: "messages", icon: "💬", label: "Messages", badge: 5 },
  { id: "favorites", icon: "❤", label: "Favoris" },
  { id: "stats", icon: "📈", label: "Statistiques", section: "Compte" },
  { id: "payments", icon: "💳", label: "Paiements" },
  { id: "profile", icon: "👤", label: "Profil", section: "Paramètres" },
  { id: "security", icon: "🔒", label: "Sécurité" },
];

const CHART = [120, 95, 210, 180, 340, 290, 400, 380, 320, 450, 510, 480, 390, 560];
const STATUS: Record<string, [string, string]> = {
  act: ["bg-[#22c55e]", "Active"],
  pen: ["bg-gold", "En attente"],
  exp: ["bg-gray-300", "Expirée"],
};

export default function Dashboard() {
  const [panel, setPanel] = useState<Panel>("overview");
  const [toast, setToast] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });
  }, [supabase.auth]);

  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };
  const max = Math.max(...CHART);

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || user?.phone || "Utilisateur";
  const displayEmail = user?.email || user?.phone || "Nouvel utilisateur";
  const avatarUrl = user?.user_metadata?.avatar_url || "https://i.pravatar.cc/96?img=12";

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Mobile tabs */}
      <div className="no-scrollbar fixed left-0 right-0 top-16 z-30 flex gap-1.5 overflow-x-auto border-b border-gray-100 bg-white px-2 py-2 lg:hidden">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setPanel(n.id)}
            className={`shrink-0 rounded-[20px] border-[1.5px] px-3 py-1.5 text-[.78rem] font-semibold ${
              panel === n.id ? "border-green bg-green text-white" : "border-gray-100 bg-white text-gray-700"
            }`}
          >
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      {/* Sidebar */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-gray-100 bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-gray-100 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt="" className="h-11 w-11 rounded-full border-2 border-gold object-cover" />
          <div className="min-w-0">
            <div className="text-[.9rem] font-bold truncate">{displayName}</div>
            <div className="text-[.72rem] text-gray-500 truncate">{displayEmail}</div>
            <span className="badge b-verif mt-0.5">Nouveau</span>
          </div>
        </div>
        {NAV.map((n) => (
          <div key={n.id}>
            {n.section && <div className="px-5 pb-1 pt-4 text-[.66rem] font-bold uppercase tracking-widest text-gray-300">{n.section}</div>}
            <button
              onClick={() => setPanel(n.id)}
              className={`flex w-full items-center gap-2.5 border-l-[3px] px-5 py-2.5 text-[.87rem] transition ${
                panel === n.id ? "border-green bg-green/[.06] font-semibold text-green" : "border-transparent text-gray-700 hover:text-green"
              }`}
            >
              <span className="w-5 text-center">{n.icon}</span> {n.label}
              {n.badge && <span className="ml-auto rounded-[10px] bg-brand-red px-1.5 py-0.5 text-[.62rem] font-bold text-white">{n.badge}</span>}
            </button>
          </div>
        ))}
        <div className="mt-auto border-t border-gray-100 p-4">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }} 
            className="btn btn-ghost btn-sm btn-block justify-start !text-brand-red hover:bg-red-50"
          >
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 bg-gray-50 px-4 pt-16 lg:pt-8 lg:px-6">
        {panel === "overview" && (
          <div className="animate-fadeUp">
            <h1 className="font-display text-[1.3rem] font-extrabold">Bonjour, {displayName} 👋</h1>
            <p className="mb-6 text-[.85rem] text-gray-500">Bienvenue sur votre espace vendeur</p>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Annonces actives" value="0" sub="Votre vitrine" />
              <Kpi label="Vues totales" value="0" sub="Sur vos annonces" />
              <Kpi label="Messages" value="0" sub="Boîte de réception" />
              <Kpi label="Taux réponse" value="-" sub="Pas assez de données" />
            </div>
            <div className="mb-6 flex flex-col gap-2">
              <Alert color="green">💡 Astuce : Les annonces avec de belles photos se vendent 3x plus vite ! — <Link href="/publier" className="font-semibold text-green">Publier maintenant</Link></Alert>
            </div>
            
            <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green/10 text-[1.5rem]">📢</div>
              <h3 className="font-display text-[1.1rem] font-bold text-gray-800">Vous n'avez pas encore d'annonce</h3>
              <p className="mb-4 text-[.85rem] text-gray-500">Commencez à vendre vos produits à des millions d'acheteurs.</p>
              <Link href="/publier" className="btn btn-green shadow-lg">Publier ma première annonce</Link>
            </div>
          </div>
        )}

        {panel === "ads" && (
          <div className="animate-fadeUp">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-[1.2rem] font-extrabold">Mes annonces</h2>
              <Link href="/publier" className="btn btn-green btn-sm">+ Nouvelle</Link>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border-[1.5px] border-gray-100 bg-white py-16 text-center">
               <div className="text-[3rem] opacity-40 mb-2">📦</div>
               <div className="text-[1rem] font-bold text-gray-700">Aucune annonce trouvée</div>
               <div className="text-[.85rem] text-gray-400 mb-4">Vous n'avez publié aucune annonce pour le moment.</div>
               <Link href="/publier" className="btn btn-outline btn-sm">Créer une annonce</Link>
            </div>
          </div>
        )}

        {panel === "messages" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Messages</h2>
            <div className="flex flex-col items-center justify-center rounded-lg border-[1.5px] border-gray-100 bg-white py-16 text-center">
               <div className="text-[3rem] opacity-40 mb-2">💬</div>
               <div className="text-[1rem] font-bold text-gray-700">Votre messagerie est vide</div>
               <div className="text-[.85rem] text-gray-400">Les messages des acheteurs intéressés apparaîtront ici.</div>
            </div>
          </div>
        )}

        {panel === "favorites" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Favoris</h2>
            <div className="flex flex-col items-center justify-center rounded-lg border-[1.5px] border-gray-100 bg-white py-16 text-center">
               <div className="text-[3rem] opacity-40 mb-2">❤️</div>
               <div className="text-[1rem] font-bold text-gray-700">Aucun favori</div>
               <div className="text-[.85rem] text-gray-400 mb-4">Cliquez sur le cœur d'une annonce pour la sauvegarder ici.</div>
               <Link href="/recherche" className="btn btn-outline btn-sm">Explorer les annonces</Link>
            </div>
          </div>
        )}

        {panel === "stats" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Statistiques</h2>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Vues ce mois" value="0" sub="-" />
              <Kpi label="Clics contact" value="0" sub="-" />
              <Kpi label="Conversion" value="0%" sub="-" />
              <Kpi label="Favoris" value="0" sub="-" />
            </div>
            <div className="flex items-center justify-center rounded-lg border-[1.5px] border-gray-100 bg-white py-16 text-center text-[.85rem] text-gray-400">
               Publiez des annonces pour voir vos statistiques de trafic.
            </div>
          </div>
        )}

        {panel === "payments" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Paiements</h2>
            <div className="flex flex-col items-center justify-center rounded-lg border-[1.5px] border-gray-100 bg-white py-16 text-center">
               <div className="text-[3rem] opacity-40 mb-2">💳</div>
               <div className="text-[1rem] font-bold text-gray-700">Aucun historique de paiement</div>
               <div className="text-[.85rem] text-gray-400">Vos factures pour les boosts et annonces Premium s'afficheront ici.</div>
            </div>
          </div>
        )}

        {panel === "profile" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Mon profil</h2>
            <div className="rounded-lg border-[1.5px] border-gray-100 bg-white p-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="label">Nom complet / Identifiant</label><input className="input" defaultValue={displayName} /></div>
                  <div><label className="label">Contact (Email ou Tél)</label><input className="input bg-gray-50 text-gray-500" defaultValue={displayEmail} readOnly disabled /></div>
                </div>
                <div><label className="label">Bio</label><textarea className="input resize-y" rows={3} placeholder="Présentez-vous aux acheteurs..." /></div>
              </div>
              <button onClick={() => show("✓ Profil sauvegardé")} className="btn btn-green mt-5">Sauvegarder les modifications</button>
            </div>
          </div>
        )}

        {panel === "security" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Sécurité</h2>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border-[1.5px] border-gray-100 bg-white p-5">
                <h3 className="mb-1 font-display text-[.95rem] font-bold">Contact vérifié ✅</h3>
                <p className="mb-3 text-[.83rem] text-gray-500">{displayEmail}</p>
                <button onClick={() => show("Redirection...")} className="btn btn-outline btn-sm">Modifier</button>
              </div>
              <div className="rounded-lg border-[1.5px] border-gray-100 bg-white p-5">
                <h3 className="mb-1 font-display text-[.95rem] font-bold">Vérification d&apos;identité</h3>
                <p className="mb-3 text-[.83rem] text-gray-500">Obtenez le badge « Identité vérifiée ».</p>
                <button onClick={() => show("📎 Envoi pièce…")} className="btn btn-green btn-sm">Vérifier</button>
              </div>
              <div className="rounded-lg border-[1.5px] border-[#fee2e2] bg-white p-5">
                <h3 className="mb-1 font-display text-[.95rem] font-bold text-brand-red">Zone dangereuse</h3>
                <button onClick={() => show("⚠ Confirmation requise")} className="btn btn-sm bg-[#fee2e2] !text-brand-red">Supprimer le compte</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-neon-gold bg-dark-900 px-5 py-2.5 text-[.88rem] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, up }: { label: string; value: string; sub: string; up?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-lg border-[1.5px] border-gray-100 bg-white p-4">
      <div className="text-[.75rem] text-gray-500">{label}</div>
      <div className="my-1 font-display text-[1.6rem] font-extrabold leading-none">{value}</div>
      <div className={`text-[.72rem] ${up ? "text-[#22c55e]" : "text-gray-500"}`}>{sub}</div>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-[1.5px] border-gray-100 bg-white p-5">
      <h3 className="mb-3 font-display text-base font-bold">{title}</h3>
      {children}
    </div>
  );
}
function Alert({ color, children }: { color: "red" | "green"; children: React.ReactNode }) {
  return <div className={`flex items-center gap-2 rounded-[10px] border-l-4 bg-white px-4 py-3 text-[.83rem] ${color === "red" ? "border-brand-red" : "border-[#22c55e]"}`}>{children}</div>;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-gray-100 bg-gray-50 p-3 text-left text-[.74rem] font-bold uppercase text-gray-700">{children}</th>;
}
function ActBtn({ children, onClick, className = "" }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  return <button onClick={onClick} className={`rounded-md border border-gray-100 bg-white px-2.5 py-1 text-[.72rem] font-semibold text-gray-700 hover:border-gold ${className}`}>{children}</button>;
}
