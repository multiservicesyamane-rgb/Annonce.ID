import React from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F4F7FE] text-gray-700 font-sans">
      {/* Sidebar - Lector Style */}
      <aside className="w-[250px] bg-white border-r border-gray-100 flex flex-col z-20 shrink-0">
        <div className="h-[60px] bg-gradient-to-r from-[#E9437E] to-[#F1618B] flex items-center px-6">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-wide">
            <span className="w-5 h-5 rounded-full bg-yellow-400"></span> Annonce.ID
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {[
            { href: "/yamanetech", icon: "🏠", label: "Dashboard", active: true },
            { href: "/yamanetech/annonces", icon: "📋", label: "Annonces" },
            { href: "/yamanetech/utilisateurs", icon: "👥", label: "Utilisateurs (Admin)" },
            { href: "/yamanetech/transactions", icon: "💳", label: "Paiements PayTech" },
            { href: "/yamanetech/signalements", icon: "⚠️", label: "Signalements" },
            { href: "/yamanetech/categories", icon: "📁", label: "Catégories" },
            { href: "/yamanetech/parametres", icon: "⚙️", label: "Paramètres Système" },
            { href: "/yamanetech/logs", icon: "📝", label: "Logs & Sécurité" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-2.5 text-[.8rem] transition-colors ${
                item.active 
                  ? "text-[#E9437E] font-semibold border-l-2 border-[#E9437E] bg-pink-50/50" 
                  : "text-gray-500 hover:text-[#E9437E] hover:bg-gray-50 border-l-2 border-transparent"
              }`}
            >
              <span className="text-base grayscale opacity-70">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F4F7FE]">
        {/* Topbar */}
        <header className="h-[60px] bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
          </div>
          <div className="flex items-center gap-5">
            <button className="relative text-gray-400 hover:text-[#E9437E] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#10B981] rounded-full"></span>
            </button>
            <button className="text-gray-400 hover:text-[#E9437E] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold border border-gray-200 cursor-pointer">
              S
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 bg-[#F4F7FE]">
          {children}
        </div>
      </main>
    </div>
  );
}
