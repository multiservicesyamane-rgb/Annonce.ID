"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Widget Parrainage : lien personnel, partage, points et nombre de filleuls.
 * « Invitez un ami = 50 points ».
 */
export default function ReferralWidget() {
  const supabase = createClient();
  const [link, setLink] = useState("");
  const [points, setPoints] = useState(0);
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setLink(`${window.location.origin}/inscription?ref=${user.id}`);
      const { data: me } = await supabase.from("profiles").select("referral_points").eq("id", user.id).maybeSingle();
      setPoints(me?.referral_points || 0);
      const { count: c } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", user.id);
      setCount(c || 0);
    });
  }, [supabase]);

  const enc = encodeURIComponent;
  const msg = `Rejoins Wanteermako, la marketplace n°1 d'Afrique de l'Ouest, et publie tes annonces gratuitement : ${link}`;

  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  }

  if (!link) return null;

  return (
    <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/[0.08] dark:to-yellow-500/[0.04] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[1.3rem]">🎁</span>
          <div>
            <h3 className="font-display text-[.98rem] font-extrabold text-gray-900 dark:text-white">Parrainez & gagnez un boost</h3>
            <p className="text-[.76rem] text-gray-500 dark:text-white/60">Chaque ami inscrit → <b className="text-amber-600 dark:text-amber-400">1 boost Premium OFFERT</b> 🎁</p>
          </div>
        </div>
        <div className="flex gap-3 text-center">
          <div><div className="font-display text-[1.2rem] font-black text-amber-600 dark:text-amber-400">{count}</div><div className="text-[.6rem] font-bold uppercase text-gray-500">Filleuls</div></div>
          <div><div className="font-display text-[1.2rem] font-black text-amber-600 dark:text-amber-400">{points}</div><div className="text-[.6rem] font-bold uppercase text-gray-500">Points</div></div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input readOnly value={link} className="min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-[.78rem] text-gray-700 dark:text-white/80" />
        <button onClick={copy} className="rounded-lg bg-gray-900 dark:bg-white/10 px-3.5 py-2 text-[.78rem] font-bold text-white">{copied ? "✓ Copié" : "Copier"}</button>
        <a href={`https://wa.me/?text=${enc(msg)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#25D366] px-3.5 py-2 text-[.78rem] font-bold text-white">WhatsApp</a>
        <a href={`https://t.me/share/url?url=${enc(link)}&text=${enc("Rejoins Wanteermako !")}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#229ED9] px-3.5 py-2 text-[.78rem] font-bold text-white">Telegram</a>
      </div>
    </div>
  );
}
