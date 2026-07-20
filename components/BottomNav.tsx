"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "Accueil",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/favoris",
    label: "Favoris",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: "/publier",
    label: "Vendre",
    primary: true,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    href: "/dashboard?panel=messages",
    label: "Messages",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/boutiques",
    label: "Boutiques",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9h18l-1.5-5h-15L3 9Z" />
        <path d="M5 9v11h14V9" />
        <path d="M9 20v-6h6v6" />
      </svg>
    ),
  },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/yamanetech")) return null;

  return (
    <nav
      aria-label="Navigation principale mobile"
      className="fixed inset-x-0 bottom-0 z-[800] flex rounded-t-[16px] border-t border-gray-200 bg-white/95 px-0 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-colors dark:border-white/5 dark:bg-[#0A0E14]/90 dark:shadow-none lg:hidden"
    >
      {ITEMS.map((item) => {
        const itemPath = item.href.split("?")[0];
        const active = itemPath === "/" ? pathname === "/" : pathname.startsWith(itemPath);

        if ("primary" in item && item.primary) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="group relative flex min-h-[52px] flex-1 flex-col items-center justify-start"
            >
              <span className="absolute -top-8 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-green text-white shadow-[0_6px_20px_rgba(99,102,241,0.4)] ring-2 ring-green/20 transition-transform group-active:scale-95 dark:border-[#0A0E14]">
                {item.icon}
              </span>
              <span className="mt-8 text-[.65rem] font-bold text-green">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              "flex min-h-[52px] flex-1 flex-col items-center gap-1 py-1 text-[.65rem] font-medium transition " +
              (active ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500")
            }
          >
            <span className={"transition-transform " + (active ? "scale-110 opacity-100" : "opacity-80")}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
