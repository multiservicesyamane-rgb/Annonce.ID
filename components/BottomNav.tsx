import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  // Masquée sur l'admin
  if (pathname?.startsWith("/yamanetech")) return null;

  const ITEMS = [
    { href: "/", icon: "🏠", label: "Accueil" },
    { href: "/recherche", icon: "🔍", label: "Chercher" },
    { href: "/publier", icon: "+", label: "Publier", primary: true },
    { href: "/dashboard", icon: "💬", label: "Messages" },
    { href: "/dashboard", icon: "👤", label: "Compte" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[800] flex border-t border-dark-border bg-dark-900/95 px-0 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-md lg:hidden">
      {ITEMS.map((it) => {
        const active = pathname === it.href;
        if (it.primary) {
          return (
            <Link key={it.href} href={it.href} className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[.62rem] font-semibold text-neon-gold">
              <span className="-mt-3 flex h-11 w-11 items-center justify-center rounded-full bg-grad-gold text-[1.4rem] text-dark-900 shadow-glow-gold">
                {it.icon}
              </span>
              {it.label}
            </Link>
          );
        }
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[.62rem] font-semibold transition ${
              active ? "text-neon-gold" : "text-white/50"
            }`}
          >
            <span className="text-[1.25rem]">{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
