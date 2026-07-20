"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";
import DarkToggle from "./DarkToggle";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/constants";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  const [homeHref, setHomeHref] = useState("/");
  const [supabase] = useState(() => createClient());
  const pathname = usePathname();

  useEffect(() => {
    const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || BRAND.domain)
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");
    const host = window.location.hostname.replace(/^www\./, "");
    if (host !== root && host.endsWith("." + root)) {
      setHomeHref("https://" + root);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!active) return;
      setUser(currentUser);

      if (!currentUser) {
        setUnread(0);
        return;
      }

      // Cloche = notifications non lues (messages, annonce approuvée/vendue/expirée).
      // Repli sur le comptage des messages si la table notifications n'existe pas encore.
      try {
        const res = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ action: "unreadCount" }),
        });
        if (res.ok) {
          const d = await res.json();
          if (active) setUnread(d.count || 0);
          return;
        }
      } catch { /* repli ci-dessous */ }

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", currentUser.id)
        .eq("read", false);

      if (active) setUnread(count || 0);
    }

    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setUser(currentSession?.user || null);
      if (!currentSession?.user) setUnread(0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="sticky top-0 z-[900] w-full px-2 pb-1 pt-2 transition-colors">
      <div className="header-shell mx-auto max-w-[1320px] rounded-[16px] border border-white/5 bg-[#0A0E14]/85 px-3 py-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <Link href={homeHref} aria-label={"Accueil " + BRAND.name} className="flex shrink-0 items-center">
            <span className="inline-flex items-center rounded-[10px] bg-white px-1.5 py-1 shadow-md ring-1 ring-black/5 md:px-2">
              <img src="/logo-full.jpg" alt={BRAND.name} className="h-[34px] w-auto object-contain md:h-[58px]" />
            </span>
          </Link>

          <div className="hidden max-w-[550px] flex-1 md:flex">
            <SearchBar variant="header" />
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/recherche"
              aria-label="Rechercher une annonce"
              title="Rechercher"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-green dark:bg-white/10 dark:text-white dark:hover:bg-white/20 md:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </Link>

            <DarkToggle />

            {user && (
              <Link
                href="/dashboard?panel=notifications"
                aria-label={unread > 0 ? unread + " notification(s) non lue(s)" : "Ouvrir les notifications"}
                title={unread > 0 ? unread + " notification(s) non lue(s)" : "Notifications"}
                className="relative flex h-9 w-9 items-center justify-center text-gray-600 transition hover:text-green dark:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute right-0 top-0 flex h-[16px] min-w-[16px] items-center justify-center rounded-full border-[1.5px] border-white bg-red-500 px-0.5 text-[.58rem] font-extrabold text-white dark:border-[#0A0E14]">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <Link href="/dashboard" aria-label="Mon compte" className="flex h-9 w-9 items-center justify-center rounded-full border border-green-500/40 bg-green-500/15 text-green-600 md:hidden dark:text-green-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            ) : (
              <Link href="/connexion" className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] bg-green px-3 py-1.5 text-[.78rem] font-extrabold text-white shadow-md md:hidden">
                Connexion
              </Link>
            )}

            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/boutiques"
                className="flex items-center gap-1.5 rounded-[10px] border border-gold bg-gold/10 px-3 py-1.5 text-[.8rem] font-bold text-gold-dark transition-colors hover:bg-gold hover:text-dark-900 dark:text-gold"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9h18l-1.5-5h-15L3 9Z" />
                  <path d="M5 9v11h14V9" />
                  <path d="M9 20v-6h6v6" />
                </svg>
                Boutiques
              </Link>

              {!user ? (
                <Link
                  href="/connexion"
                  className="flex items-center gap-1.5 rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[.82rem] font-bold text-gray-800 transition-colors hover:border-green hover:bg-gray-100 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Connexion
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-[10px] border border-green-500 bg-green-500/10 px-3 py-1.5 text-[.8rem] font-bold text-green-600 transition-colors hover:bg-green-500 hover:text-white dark:text-green-400"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Compte
                </Link>
              )}

              <Link href="/publier" className="flex items-center rounded-[10px] bg-green px-3 py-1.5 text-[.82rem] font-bold text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)] transition hover:bg-green-600">
                + Vendre
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
