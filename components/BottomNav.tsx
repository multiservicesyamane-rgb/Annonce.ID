import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/yamanetech")) return null;

  const ITEMS = [
    { 
      href: "/", 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ), 
      label: "Accueil" 
    },
    { 
      href: "/favoris", 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      ), 
      label: "Favoris" 
    },
    { 
      href: "/publier", 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ), 
      label: "Déposer", 
      primary: true 
    },
    { 
      href: "/dashboard", 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ), 
      label: "Messages" 
    },
    { 
      href: "/profil", 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ), 
      label: "Profil" 
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[800] flex border-t border-gray-200 dark:border-white/5 bg-white/95 dark:bg-[#0A0E14]/90 px-0 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
      {ITEMS.map((it) => {
        const active = pathname === it.href;
        
        if (it.primary) {
          return (
            <Link key={it.href} href={it.href} className="relative flex flex-1 flex-col items-center justify-start group">
              <div className="absolute -top-8 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-neon-magenta to-[#FF5E8E] text-white shadow-[0_4px_15px_rgba(255,42,109,0.5)] dark:shadow-glow-magenta transition-transform group-hover:scale-105 border-[3px] border-white dark:border-[#0A0E14]">
                {it.icon}
              </div>
              <span className="mt-8 text-[.6rem] font-medium text-neon-magenta">
                {it.label}
              </span>
            </Link>
          );
        }
        
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-1 flex-col items-center gap-1 py-1 text-[.65rem] font-medium transition ${
              active ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            <span className={`${active ? 'opacity-100 scale-110' : 'opacity-80'} transition-transform`}>
              {it.icon}
            </span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
