"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Vue d'ensemble", href: "/yamanetech/super-admin", icon: "📊" },
    { name: "Modération", href: "/yamanetech/super-admin/moderation", icon: "⚡" },
    { name: "Publicités", href: "/yamanetech/super-admin/publicites", icon: "📢" },
    { name: "Utilisateurs", href: "/yamanetech/super-admin/utilisateurs", icon: "👥" },
    { name: "Finances", href: "/yamanetech/super-admin/finances", icon: "💰" },
    { name: "Catégories", href: "/yamanetech/super-admin/categories", icon: "🗂️" },
    { name: "Paramètres", href: "/yamanetech/super-admin/parametres", icon: "⚙️" },
  ];

  return (
    <aside className="w-[260px] bg-[#0D0D0D] border-r border-[#2A2A2A] flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-[#2A2A2A]">
        <Link href="/" className="block">
          <h2 className="font-display font-extrabold text-xl text-white">
            YamaneTech<span className="text-[#D4AF37]">.</span>
          </h2>
          <div className="text-[.65rem] uppercase tracking-widest text-[#D4AF37] font-bold mt-1">
            Super Admin
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-[#1A1A1A]"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2A2A2A]">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-white transition"
        >
          <span>←</span> Retour plateforme
        </Link>
      </div>
    </aside>
  );
}
