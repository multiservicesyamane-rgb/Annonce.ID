"use client";

import { useEffect, useState } from "react";
import { FB_GROUPS } from "@/lib/social-groups";

/**
 * Bandeau affiché après publication d'une annonce (?published=1) :
 * partage réseaux + diffusion assistée dans les groupes Facebook.
 */
export default function SharePublishedBanner({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("published") !== "1") return;
    const u = new URL(window.location.href);
    u.searchParams.delete("published");
    setUrl(u.toString());
    setShow(true);
    window.history.replaceState({}, "", u.toString());
  }, []);

  if (!show) return null;

  const enc = encodeURIComponent;
  const text = `${title} — à voir sur Wanteermako`;
  const groupText = `${title}\n\n👉 ${url}\n\n📲 Sur Wanteermako — Achetez, vendez, trouvez facilement.\n#Wanteermako #Sénégal #BonsPlans`;
  const links = [
    { k: "WhatsApp", c: "#25D366", href: `https://wa.me/?text=${enc(text + " " + url)}` },
    { k: "Facebook", c: "#1877F2", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { k: "Telegram", c: "#229ED9", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { k: "X", c: "#111", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
  ];

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  }
  async function copyText() {
    try { await navigator.clipboard.writeText(groupText); setTextCopied(true); setTimeout(() => setTextCopied(false), 2200); } catch { /* ignore */ }
  }

  function groupName(u: string) {
    const s = u.split("/groups/")[1] || "";
    return /^\d+$/.test(s) ? `Groupe ${s.slice(0, 4)}…` : s;
  }

  return (
    <div className="my-3 space-y-2">
      {/* Partage réseaux */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-green-200 dark:border-green-500/20 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/15 dark:to-emerald-900/10 px-3 py-2.5">
        <span className="text-[.84rem] font-bold text-green-700 dark:text-green-400">🎉 Publiée ! Partagez :</span>
        {links.map((l) => (
          <a key={l.k} href={l.href} target="_blank" rel="noopener noreferrer"
            className="rounded-lg px-2.5 py-1 text-[.72rem] font-bold text-white transition hover:opacity-90" style={{ background: l.c }}>
            {l.k}
          </a>
        ))}
        <button onClick={copy} className="rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-2.5 py-1 text-[.72rem] font-bold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10">
          {copied ? "✓ Copié" : "🔗 Lien"}
        </button>
      </div>

      {/* Diffusion assistée groupes Facebook */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-900/10 px-3 py-2.5">
        <button onClick={() => setGroupsOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 text-left">
          <span className="text-[.84rem] font-bold text-blue-700 dark:text-blue-400">📢 Diffuser dans mes {FB_GROUPS.length} groupes Facebook</span>
          <span className="text-blue-600 dark:text-blue-400 text-[.8rem]">{groupsOpen ? "▲" : "▼"}</span>
        </button>

        {groupsOpen && (
          <div className="mt-3 space-y-3">
            {/* 1) Texte prêt à coller */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[.72rem] font-bold uppercase tracking-wide text-gray-500 dark:text-white/50">1. Copie le texte</span>
                <button onClick={copyText} className="rounded-lg bg-blue-600 px-3 py-1 text-[.72rem] font-bold text-white hover:bg-blue-700">
                  {textCopied ? "✓ Texte copié !" : "📋 Copier le texte"}
                </button>
              </div>
              <textarea readOnly value={groupText} rows={4} className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-2 text-[.74rem] text-gray-700 dark:text-white/80" />
            </div>

            {/* 2) Ouvre chaque groupe et colle (Ctrl+V) */}
            <div>
              <span className="text-[.72rem] font-bold uppercase tracking-wide text-gray-500 dark:text-white/50">2. Ouvre un groupe → colle → Publier</span>
              <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {FB_GROUPS.map((g, i) => (
                  <a key={g.url} href={g.url} target="_blank" rel="noopener noreferrer"
                    className="truncate rounded-lg border border-blue-200 dark:border-blue-500/30 bg-white dark:bg-white/5 px-2 py-1.5 text-center text-[.7rem] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition">
                    Groupe {i + 1}
                  </a>
                ))}
              </div>
            </div>

            <p className="text-[.68rem] text-gray-500 dark:text-white/45">
              ℹ️ Facebook ne permet plus la publication auto dans les groupes. Astuce : garde l'image de l'annonce ouverte pour la joindre rapidement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
