import type { Metadata } from "next";
import Downloadable from "@/components/Downloadable";

export const metadata: Metadata = {
  title: "Promos animées — Wanteermako",
  robots: { index: false, follow: false },
};

// Promos vidéo cinématiques (CSS pur, en boucle) — 16:9 et 9:16.
// Vos captures animées : zoom Ken Burns, glissements, curseur, icônes flottantes.
// Pour un vrai MP4 : enregistrez l'écran sur un cadre pendant un cycle (~21s).

const CYCLE = "21s";

const CSS = `
:root{}
@keyframes wm-ken { 0%{transform:scale(1.02) translate(0,0)} 100%{transform:scale(1.16) translate(-2%,-3%)} }
@keyframes wm-ken2 { 0%{transform:scale(1.16) translate(-2%,-2%)} 100%{transform:scale(1.02) translate(0,0)} }
@keyframes wm-float { 0%,100%{transform:translateY(0) translateX(0) rotate(0)} 50%{transform:translateY(-22px) translateX(12px) rotate(8deg)} }
@keyframes wm-drift { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(20px) scale(1.1)} }
@keyframes wm-shine { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes wm-bar { 0%{width:0%} 100%{width:100%} }
@keyframes wm-cursor {
  0%{transform:translate(15%,75%) scale(1)} 12%{transform:translate(60%,30%) scale(1)}
  16%{transform:translate(60%,30%) scale(.82)} 18%{transform:translate(60%,30%) scale(1)}
  35%{transform:translate(30%,55%) scale(1)} 50%{transform:translate(75%,60%) scale(1)}
  54%{transform:translate(75%,60%) scale(.82)} 56%{transform:translate(75%,60%) scale(1)}
  75%{transform:translate(40%,25%) scale(1)} 100%{transform:translate(15%,75%) scale(1)}
}
/* 7 scènes sur le cycle */
@keyframes wm-a { 0%{opacity:0;transform:translateY(22px) scale(.97)} 1.5%{opacity:1;transform:none} 12%{opacity:1;transform:none} 14%{opacity:0;transform:scale(1.03)} 100%{opacity:0} }
@keyframes wm-b { 0%,14%{opacity:0;transform:translateY(22px) scale(.97)} 15.5%{opacity:1;transform:none} 26%{opacity:1} 28%{opacity:0;transform:scale(1.03)} 100%{opacity:0} }
@keyframes wm-c { 0%,28%{opacity:0;transform:translateY(22px) scale(.97)} 29.5%{opacity:1;transform:none} 41%{opacity:1} 43%{opacity:0;transform:scale(1.03)} 100%{opacity:0} }
@keyframes wm-d { 0%,43%{opacity:0;transform:translateY(22px) scale(.97)} 44.5%{opacity:1;transform:none} 55%{opacity:1} 57%{opacity:0;transform:scale(1.03)} 100%{opacity:0} }
@keyframes wm-e { 0%,57%{opacity:0;transform:translateY(22px) scale(.97)} 58.5%{opacity:1;transform:none} 69%{opacity:1} 71%{opacity:0;transform:scale(1.03)} 100%{opacity:0} }
@keyframes wm-f { 0%,71%{opacity:0;transform:translateY(22px) scale(.97)} 72.5%{opacity:1;transform:none} 84%{opacity:1} 86%{opacity:0;transform:scale(1.03)} 100%{opacity:0} }
@keyframes wm-g { 0%,86%{opacity:0;transform:translateY(22px) scale(.97)} 87.5%{opacity:1;transform:none} 98%{opacity:1} 100%{opacity:0} }
.wm-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:7% 6%;gap:4%}
.wm-a{animation:wm-a ${CYCLE} infinite}.wm-b{animation:wm-b ${CYCLE} infinite}.wm-c{animation:wm-c ${CYCLE} infinite}
.wm-d{animation:wm-d ${CYCLE} infinite}.wm-e{animation:wm-e ${CYCLE} infinite}.wm-f{animation:wm-f ${CYCLE} infinite}.wm-g{animation:wm-g ${CYCLE} infinite}
.wm-orb{position:absolute;border-radius:9999px;filter:blur(40px)}
.wm-ico{position:absolute;font-size:clamp(1.2rem,3vw,2rem);filter:drop-shadow(0 4px 10px rgba(0,0,0,.4))}
.wm-shine{background:linear-gradient(110deg,#FFC93C 20%,#fff 45%,#FFC93C 70%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:wm-shine 3.5s linear infinite}
.wm-bar{animation:wm-bar ${CYCLE} linear infinite}
.wm-cursor{position:absolute;top:0;left:0;width:clamp(18px,3vw,26px);height:auto;z-index:40;animation:wm-cursor ${CYCLE} ease-in-out infinite;filter:drop-shadow(0 3px 6px rgba(0,0,0,.5))}
.wm-frame{position:relative;width:90%;max-width:520px;overflow:hidden;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:#05080f;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.wm-frame img{display:block;width:100%;height:auto;animation:wm-ken 10s ease-in-out infinite alternate}
.wm-frame .wm-ken2{animation:wm-ken2 10s ease-in-out infinite alternate}
`;

function Caption({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="relative z-30">
      <div className="text-[clamp(1.6rem,6vw,3rem)] leading-none">{icon}</div>
      <h3 className="mt-2 font-display text-[clamp(1.1rem,3.6vw,2.1rem)] font-black leading-tight text-white">{title}</h3>
      {sub && <p className="mt-1 text-[clamp(.72rem,2vw,1rem)] text-white/70">{sub}</p>}
    </div>
  );
}
function Device({ src, alt, ken2 = false }: { src: string; alt: string; ken2?: boolean }) {
  return (
    <div className="wm-frame">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-[#FF5F57]" /><span className="h-2 w-2 rounded-full bg-[#FEBC2E]" /><span className="h-2 w-2 rounded-full bg-[#28C840]" />
        <span className="ml-2 truncate rounded bg-white/5 px-2 py-0.5 text-[.55rem] text-white/40">wanteermako.com</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={ken2 ? "wm-ken2" : ""} />
    </div>
  );
}

function Scenes() {
  return (
    <>
      {/* fonds animés */}
      <div className="wm-orb" style={{ width: "50%", height: "50%", background: "#6366F1", opacity: .45, top: "-10%", left: "-8%", animation: "wm-float 9s ease-in-out infinite" }} />
      <div className="wm-orb" style={{ width: "45%", height: "45%", background: "#FFC93C", opacity: .35, bottom: "-10%", right: "-8%", animation: "wm-drift 12s ease-in-out infinite" }} />
      <div className="wm-orb" style={{ width: "35%", height: "35%", background: "#FF2A6D", opacity: .28, bottom: "25%", left: "8%", animation: "wm-float 14s ease-in-out infinite" }} />

      {/* icônes flottantes */}
      <span className="wm-ico" style={{ top: "12%", right: "10%", animation: "wm-float 7s ease-in-out infinite" }}>💬</span>
      <span className="wm-ico" style={{ bottom: "16%", left: "9%", animation: "wm-drift 8s ease-in-out infinite" }}>🔥</span>
      <span className="wm-ico" style={{ top: "22%", left: "12%", animation: "wm-float 10s ease-in-out infinite" }}>✨</span>
      <span className="wm-ico" style={{ bottom: "24%", right: "12%", animation: "wm-drift 9s ease-in-out infinite" }}>✅</span>

      {/* curseur animé */}
      <svg className="wm-cursor" viewBox="0 0 24 24" fill="white" stroke="#0B1120" strokeWidth="1.2"><path d="M4 2l6 16 2.5-6.5L19 9z" /></svg>

      {/* Scène 1 — Intro logo */}
      <div className="wm-stage wm-a">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-header.png" alt="Wanteermako" className="w-[72%] max-w-[460px] object-contain drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
        <p className="text-[clamp(.85rem,2.5vw,1.35rem)] font-semibold text-white/70">La marketplace nouvelle génération · Afrique de l'Ouest</p>
      </div>

      {/* Scène 2 — Dashboard */}
      <div className="wm-stage wm-b"><Caption icon="📊" title="Pilotez votre activité" sub="Annonces, vues et favoris en direct" /><Device src="/a1.PNG" alt="Tableau de bord" /></div>
      {/* Scène 3 — Stats */}
      <div className="wm-stage wm-c"><Caption icon="📈" title="Des statistiques réelles" sub="Suivez vos meilleures ventes" /><Device src="/a2.PNG" alt="Statistiques" ken2 /></div>
      {/* Scène 4 — IA */}
      <div className="wm-stage wm-d"><Caption icon="✨" title="L'IA rédige vos annonces" sub="Titre, description, caractéristiques" /><Device src="/A5.PNG" alt="Assistant IA" /></div>
      {/* Scène 5 — Boosts */}
      <div className="wm-stage wm-e"><Caption icon="🚀" title="Boostez votre visibilité" sub="Standard · Premium · À la Une · VIP" /><Device src="/A7.PNG" alt="Boosts" ken2 /></div>
      {/* Scène 6 — Fiche / sans commission */}
      <div className="wm-stage wm-f">
        <div className="relative z-30">
          <div className="font-display text-[clamp(1.3rem,4.5vw,2.6rem)] font-black leading-tight text-white">Vendez en direct.</div>
          <div className="wm-shine font-display text-[clamp(1.3rem,4.5vw,2.6rem)] font-black leading-tight">Sans commission.</div>
        </div>
        <Device src="/A12.PNG" alt="Fiche produit" />
      </div>
      {/* Scène 7 — CTA */}
      <div className="wm-stage wm-g">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-header.png" alt="Wanteermako" className="w-[58%] max-w-[380px] object-contain" />
        <div className="rounded-full px-6 py-3 text-[clamp(1rem,3vw,1.6rem)] font-black text-white" style={{ background: "linear-gradient(90deg,#6366F1,#A855F7)" }}>www.wanteermako.com</div>
        <p className="text-[clamp(.8rem,2.4vw,1.25rem)] font-semibold text-white/75">Achetez · Vendez · Trouvez facilement</p>
      </div>

      {/* progression */}
      <div className="absolute bottom-0 left-0 z-40 h-1.5 w-full bg-white/10"><div className="wm-bar h-full" style={{ background: "linear-gradient(90deg,#6366F1,#FFC93C)" }} /></div>
    </>
  );
}

function Frame({ label, ratioClass, widthClass, filename }: { label: string; ratioClass: string; widthClass: string; filename: string }) {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-3 rounded-full bg-white/10 px-4 py-1.5 text-[.78rem] font-bold uppercase tracking-wider text-white/80">{label}</div>
      <Downloadable filename={filename} label="Image">
        <div className={`relative ${widthClass} ${ratioClass} overflow-hidden rounded-[24px] border border-white/10 bg-[#0B1120] shadow-2xl`}>
          <Scenes />
        </div>
      </Downloadable>
    </div>
  );
}

export default function PromoPage() {
  return (
    <div className="min-h-screen bg-[#070A12] py-10">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="mx-auto max-w-[1320px] px-4">
        <header className="mb-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-header.png" alt="Wanteermako" className="mx-auto mb-4 h-14 w-auto object-contain" />
          <h1 className="font-display text-[1.8rem] sm:text-[2.4rem] font-black text-white">Promos vidéo <span className="text-[#FFC93C]">cinématiques</span></h1>
          <p className="mx-auto mt-2 max-w-2xl text-[.92rem] text-white/60">
            Vos captures animées (zoom, curseur, icônes) en boucle (~21s). Pour un vrai fichier vidéo :
            <b className="text-white"> enregistrez l'écran</b> sur le cadre voulu pendant un cycle, puis publiez (TikTok, Reels, Status, YouTube).
          </p>
        </header>

        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center">
          <Frame label="📱 9:16 — Reels / TikTok / Status" ratioClass="aspect-[9/16]" widthClass="w-[300px] sm:w-[360px]" filename="wanteermako-promo-9x16" />
          <Frame label="🖥️ 16:9 — YouTube / Facebook" ratioClass="aspect-video" widthClass="w-full max-w-[680px]" filename="wanteermako-promo-16x9" />
        </div>
      </div>
    </div>
  );
}
