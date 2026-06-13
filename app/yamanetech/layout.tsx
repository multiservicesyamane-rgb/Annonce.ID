import Link from "next/link";

export default function YamanetechLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      {/* Sidebar - Dark theme */}
      <aside className="no-scrollbar fixed left-0 top-0 z-40 h-screen w-[260px] overflow-y-auto bg-[#1e1e2d] text-gray-300">
        <div className="flex h-[70px] items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gold text-dark-900">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-display text-[1.2rem] font-bold text-white">IDstore</span>
        </div>

        <div className="px-4 py-4">
          <Link href="/yamanetech" className="flex items-center gap-3 rounded-lg bg-gold px-4 py-3 text-[.85rem] font-bold text-dark-900 transition hover:bg-gold-light">
            <span>🏠</span> Dashboard
          </Link>
        </div>

        <nav className="flex flex-col px-4 pb-10">
          <Section title="GESTION" />
          <NavItem href="/yamanetech/utilisateurs" icon="👥" label="Utilisateurs" />
          <NavItem href="/yamanetech/annonces" icon="📋" label="Annonces" />
          <NavItem href="/yamanetech/categories" icon="🗂️" label="Catégories" />
          <NavItem href="/yamanetech/villes" icon="🌍" label="Villes & Pays" />

          <Section title="PROMOTION" />
          <NavItem href="/yamanetech/publicites" icon="📢" label="Publicités" />
          <NavItem href="/yamanetech/premium" icon="⭐" label="Annonces Premium" />

          <Section title="FINANCES" />
          <NavItem href="/yamanetech/paiements" icon="💳" label="Paiements" />
          <NavItem href="/yamanetech/revenus" icon="💰" label="Revenus" />
          <NavItem href="/yamanetech/commissions" icon="% " label="Commissions" />

          <Section title="COMMUNICATION" />
          <NavItem href="/yamanetech/messagerie" icon="💬" label="Messagerie" />
          <NavItem href="/yamanetech/notifications" icon="🔔" label="Notifications" />
          <NavItem href="/yamanetech/support" icon="🎧" label="Support" />

          <Section title="ANALYTICS" />
          <NavItem href="/yamanetech/statistiques" icon="📊" label="Statistiques" />
          <NavItem href="/yamanetech/rapports" icon="📄" label="Rapports" />

          <Section title="PARAMÈTRES" />
          <NavItem href="/yamanetech/parametres" icon="⚙️" label="Paramètres" />
          <NavItem href="/yamanetech/securite" icon="🛡️" label="Sécurité" />

          <div className="mt-6 border-t border-[#2a2a3c] pt-4">
            <Link href="/" className="flex items-center gap-3 rounded-lg px-4 py-2 text-[.85rem] transition hover:bg-[#2a2a3c] hover:text-white">
              <span>↪️</span> Quitter l'Admin
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-[260px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-gray-200 bg-white px-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="h-10 w-[300px] rounded-[8px] border border-gray-200 bg-gray-50 pl-10 pr-4 text-[.85rem] focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-gray-500">
              <button className="relative transition hover:text-dark-900">
                🔔 <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-red text-[.5rem] font-bold text-white">5</span>
              </button>
              <button className="relative transition hover:text-dark-900">
                ✉️ <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-red text-[.5rem] font-bold text-white">3</span>
              </button>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right text-[.8rem]">
                <div className="font-bold text-dark-900">Admin IDstore</div>
                <div className="text-[.7rem] text-gray-500">Super Admin</div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://i.pravatar.cc/100?img=11" alt="Admin" className="h-10 w-10 rounded-full border-2 border-gold object-cover" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return <div className="mb-2 mt-6 px-4 text-[.65rem] font-bold uppercase tracking-wider text-[#6b6b80]">{title}</div>;
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg px-4 py-2 text-[.85rem] transition hover:bg-[#2a2a3c] hover:text-white">
      <span className="flex items-center gap-3">{icon} {label}</span>
      <span className="text-[#6b6b80]">›</span>
    </Link>
  );
}
