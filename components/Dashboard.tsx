"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MY_ADS, MESSAGES, LISTINGS } from "@/lib/data";
import AdCard from "./AdCard";

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
  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };
  const max = Math.max(...CHART);

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
          <Image src="https://i.pravatar.cc/96?img=12" alt="" width={44} height={44} className="h-11 w-11 rounded-full border-2 border-gold object-cover" />
          <div>
            <div className="text-[.9rem] font-bold">Moussa Diallo</div>
            <div className="text-[.72rem] text-gray-500">⭐ 4.8 · Pro</div>
            <span className="badge b-verif mt-0.5">✅ Vérifié</span>
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
          <Link href="/" className="btn btn-ghost btn-sm btn-block justify-start !text-brand-red">
            🚪 Déconnexion
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 bg-gray-50 px-4 pt-16 lg:pt-8 lg:px-6">
        {panel === "overview" && (
          <div className="animate-fadeUp">
            <h1 className="font-display text-[1.3rem] font-extrabold">Bonjour, Moussa 👋</h1>
            <p className="mb-6 text-[.85rem] text-gray-500">Résumé de votre activité</p>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Annonces actives" value="12" sub="↑ +2 ce mois" up />
              <Kpi label="Vues totales" value="8 432" sub="↑ +18%" up />
              <Kpi label="Messages" value="47" sub="5 non lus" />
              <Kpi label="Taux réponse" value="94%" sub="↑ Excellent" up />
            </div>
            <div className="mb-6 flex flex-col gap-2">
              <Alert color="red">⚠ 2 annonces expirent dans 3 jours — <button onClick={() => show("Renouveler")} className="font-semibold text-brand-red">Renouveler</button></Alert>
              <Alert color="green">✦ Boostez pour +300% de vues — <Link href="/paiement" className="font-semibold text-green">Booster</Link></Alert>
            </div>
            <Card title="Vues — 14 jours">
              <div className="flex h-20 items-end gap-[3px]">
                {CHART.map((x, i) => (
                  <div key={i} className="flex-1 rounded-t bg-green transition hover:bg-gold" style={{ height: `${Math.round((x / max) * 100)}%` }} />
                ))}
              </div>
            </Card>
            <div className="mt-4">
              <Card title="Annonces récentes">
                {MY_ADS.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 border-b border-gray-100 py-2.5 last:border-0">
                    <Image src={LISTINGS.find((l) => l.id === a.id)?.image ?? ""} alt="" width={44} height={44} className="h-11 w-11 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[.85rem] font-semibold">{a.title}</div>
                      <div className="text-[.75rem] text-gray-500">{a.category} · {a.views} vues</div>
                    </div>
                    <div className="text-[.8rem] font-bold text-green">{a.price.split(" ").slice(0, 2).join(" ")}</div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        )}

        {panel === "ads" && (
          <div className="animate-fadeUp">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-[1.2rem] font-extrabold">Mes annonces</h2>
              <Link href="/publier" className="btn btn-green btn-sm">+ Nouvelle</Link>
            </div>
            <div className="overflow-x-auto rounded-lg bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr>{["Annonce", "Prix", "Vues", "Statut", "Actions"].map((h) => <Th key={h}>{h}</Th>)}</tr>
                </thead>
                <tbody>
                  {MY_ADS.map((a) => (
                    <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="flex items-center gap-2.5 p-3">
                        <Image src={LISTINGS.find((l) => l.id === a.id)?.image ?? ""} alt="" width={42} height={42} className="h-[42px] w-[42px] rounded-lg object-cover" />
                        <div className="text-[.85rem] font-semibold">{a.title}<div className="text-[.72rem] font-normal text-gray-500">{a.category}</div></div>
                      </td>
                      <td className="whitespace-nowrap p-3 text-[.85rem] font-bold text-green">{a.price}</td>
                      <td className="p-3 text-[.85rem]">{a.views}</td>
                      <td className="p-3 text-[.85rem]"><span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${STATUS[a.status][0]}`} />{STATUS[a.status][1]}</td>
                      <td className="p-3">
                        <div className="flex gap-1.5">
                          <ActBtn onClick={() => show("Modifier")}>✎</ActBtn>
                          <ActBtn onClick={() => show("Booster")} className="text-gold-dark">✦</ActBtn>
                          <ActBtn onClick={() => show("Supprimé")} className="text-brand-red">🗑</ActBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {panel === "messages" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Messages</h2>
            <div className="overflow-hidden rounded-lg border-[1.5px] border-gray-100 bg-white">
              {MESSAGES.map((m) => (
                <button key={m.name} onClick={() => show(`Conversation avec ${m.name}`)} className={`flex w-full items-center gap-3 border-b border-gray-100 p-4 text-left last:border-0 ${m.unread ? "bg-[#f0fdf4]" : ""}`}>
                  <Image src={m.avatar} alt="" width={42} height={42} className="h-[42px] w-[42px] rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[.87rem] font-semibold">{m.name}</div>
                    <div className="truncate text-[.78rem] text-gray-500">{m.message}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[.7rem] text-gray-300">{m.time}</div>
                    {m.unread && <div className="ml-auto mt-1 h-2.5 w-2.5 rounded-full bg-green" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {panel === "favorites" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Favoris</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[LISTINGS[0], LISTINGS[2], LISTINGS[1]].map((ad) => <AdCard key={ad.id} ad={ad} />)}
            </div>
          </div>
        )}

        {panel === "stats" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Statistiques</h2>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Vues ce mois" value="3 241" sub="↑ +22%" up />
              <Kpi label="Clics contact" value="284" sub="↑ +14%" up />
              <Kpi label="Conversion" value="8.7%" sub="↑" up />
              <Kpi label="Favoris" value="156" sub="↑ +31%" up />
            </div>
            <Card title="Sources de trafic">
              {[["Recherche directe", 52, "bg-green"], ["Réseaux sociaux", 28, "bg-brand-blue"], ["Lien partagé", 12, "bg-gold"], ["Autre", 8, "bg-gray-300"]].map(([l, p, c]) => (
                <div key={l as string} className="mb-2">
                  <div className="mb-1 flex justify-between text-[.8rem]"><span>{l}</span><span className="font-semibold">{p}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded bg-gray-100"><div className={`h-full ${c}`} style={{ width: `${p}%` }} /></div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {panel === "payments" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Paiements</h2>
            <div className="overflow-x-auto rounded-lg bg-white">
              <table className="w-full border-collapse">
                <thead><tr>{["Date", "Description", "Montant", "Statut"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
                <tbody>
                  {[["01/06/2026", "À la Une — Villa Almadies", "9 000 FCFA"], ["15/05/2026", "Premium — iPhone 15", "3 500 FCFA"]].map(([d, desc, m]) => (
                    <tr key={d} className="border-b border-gray-100 last:border-0">
                      <td className="p-3 text-[.85rem]">{d}</td>
                      <td className="p-3 text-[.85rem]">{desc}</td>
                      <td className="p-3 text-[.85rem] font-bold text-green">{m}</td>
                      <td className="p-3"><span className="badge b-verif">✓ Payé</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {panel === "profile" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Mon profil</h2>
            <div className="rounded-lg border-[1.5px] border-gray-100 bg-white p-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Prénom</label><input className="input" defaultValue="Moussa" /></div>
                  <div><label className="label">Nom</label><input className="input" defaultValue="Diallo" /></div>
                </div>
                <div><label className="label">Téléphone</label><input className="input" defaultValue="+221 77 123 45 67" /></div>
                <div><label className="label">Bio</label><textarea className="input resize-y" rows={3} defaultValue="Vendeur pro de véhicules et électronique à Dakar." /></div>
              </div>
              <button onClick={() => show("✓ Profil sauvegardé")} className="btn btn-green mt-5">Sauvegarder</button>
            </div>
          </div>
        )}

        {panel === "security" && (
          <div className="animate-fadeUp">
            <h2 className="mb-6 font-display text-[1.2rem] font-extrabold">Sécurité</h2>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border-[1.5px] border-gray-100 bg-white p-5">
                <h3 className="mb-1 font-display text-[.95rem] font-bold">Téléphone vérifié ✅</h3>
                <p className="mb-3 text-[.83rem] text-gray-500">+221 77 123 45 67</p>
                <button onClick={() => show("SMS OTP envoyé (démo 1234)")} className="btn btn-outline btn-sm">Modifier</button>
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
