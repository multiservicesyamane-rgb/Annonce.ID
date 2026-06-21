import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promos animées — Wanteermako",
  robots: { index: false, follow: false },
};

// Promos vidéo animées (CSS pur, en boucle) — formats 16:9 et 9:16.
// Pour obtenir un vrai fichier vidéo : enregistrez l'écran (screen record)
// pendant un cycle complet (~20s). Charte : ardoise #0B1120, indigo #6366F1,
// or #FFC93C, émeraude #10B981, rose #FF2A6D.

const CSS = `
@keyframes wm-float { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-26px) translateX(14px)} }
@keyframes wm-drift { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(24px) scale(1.08)} }
@keyframes wm-shine { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes wm-bar { 0%{width:0%} 100%{width:100%} }
/* chaque scène visible sur sa tranche du cycle (20s, 5 scènes) */
@keyframes wm-s1 { 0%{opacity:0;transform:translateY(24px) scale(.96)} 2%{opacity:1;transform:none} 18%{opacity:1;transform:none} 20%,100%{opacity:0;transform:scale(1.04)} }
@keyframes wm-s2 { 0%,20%{opacity:0;transform:translateY(24px) scale(.96)} 22%{opacity:1;transform:none} 38%{opacity:1} 40%,100%{opacity:0;transform:scale(1.04)} }
@keyframes wm-s3 { 0%,40%{opacity:0;transform:translateY(24px) scale(.96)} 42%{opacity:1;transform:none} 58%{opacity:1} 60%,100%{opacity:0;transform:scale(1.04)} }
@keyframes wm-s4 { 0%,60%{opacity:0;transform:translateY(24px) scale(.96)} 62%{opacity:1;transform:none} 78%{opacity:1} 80%,100%{opacity:0;transform:scale(1.04)} }
@keyframes wm-s5 { 0%,80%{opacity:0;transform:translateY(24px) scale(.96)} 82%{opacity:1;transform:none} 98%{opacity:1} 100%{opacity:0} }
.wm-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:8%}
.wm-s1{animation:wm-s1 20s infinite}
.wm-s2{animation:wm-s2 20s infinite}
.wm-s3{animation:wm-s3 20s infinite}
.wm-s4{animation:wm-s4 20s infinite}
.wm-s5{animation:wm-s5 20s infinite}
.wm-orb{position:absolute;border-radius:9999px;filter:blur(40px);opacity:.5}
.wm-shine{background:linear-gradient(110deg,#FFC93C 20%,#fff 40%,#FFC93C 60%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:wm-shine 4s linear infinite}
.wm-bar{animation:wm-bar 20s linear infinite}
`;

function Scenes() {
  return (
    <>
      {/* fonds animés */}
      <div className="wm-orb" style={{ width: "45%", height: "45%", background: "#6366F1", top: "-8%", left: "-6%", animation: "wm-float 9s ease-in-out infinite" }} />
      <div className="wm-orb" style={{ width: "40%", height: "40%", background: "#FFC93C", bottom: "-8%", right: "-6%", animation: "wm-drift 11s ease-in-out infinite" }} />
      <div className="wm-orb" style={{ width: "30%", height: "30%", background: "#FF2A6D", bottom: "20%", left: "10%", opacity: .3, animation: "wm-float 13s ease-in-out infinite" }} />

      {/* Scène 1 — Logo */}
      <div className="wm-stage wm-s1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-header.png" alt="Wanteermako" className="w-[70%] max-w-[460px] object-contain drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
        <p className="mt-6 text-[clamp(.9rem,2.5vw,1.4rem)] font-semibold tracking-wide text-white/70">La marketplace nouvelle génération · Afrique de l'Ouest</p>
      </div>

      {/* Scène 2 — Sans commission */}
      <div className="wm-stage wm-s2">
        <div className="text-[clamp(2rem,7vw,4.5rem)] font-black leading-[1.02] text-white">Vendez en direct.</div>
        <div className="wm-shine text-[clamp(2rem,7vw,4.5rem)] font-black leading-[1.02]">Sans commission.</div>
        <p className="mt-5 text-[clamp(.85rem,2.4vw,1.3rem)] text-white/70">💬 Contact direct WhatsApp · 🚫 0% de commission</p>
      </div>

      {/* Scène 3 — Réseaux auto */}
      <div className="wm-stage wm-s3">
        <div className="text-[clamp(2.6rem,9vw,6rem)]">📢 🤖</div>
        <div className="mt-3 text-[clamp(1.6rem,5.5vw,3.6rem)] font-black leading-[1.05] text-white">Diffusion <span style={{ color: "#6366F1" }}>automatique</span></div>
        <p className="mt-4 text-[clamp(.9rem,2.6vw,1.4rem)] text-white/80">Chaque annonce publiée sur <b className="text-white">Telegram</b> & <b className="text-white">Facebook</b></p>
      </div>

      {/* Scène 4 — IA + Boutique */}
      <div className="wm-stage wm-s4">
        <div className="text-[clamp(1.5rem,5vw,3.2rem)] font-black text-white">✨ L'IA rédige vos annonces</div>
        <div className="my-4 h-px w-1/3 bg-white/15" />
        <div className="text-[clamp(1.4rem,4.6vw,3rem)] font-black text-white">🏪 Boutique pro dès</div>
        <div className="text-[clamp(2rem,7vw,4.4rem)] font-black" style={{ color: "#FFC93C" }}>5 000 FCFA<span className="text-[clamp(.8rem,2vw,1.2rem)] text-white/70"> /mois</span></div>
      </div>

      {/* Scène 5 — CTA */}
      <div className="wm-stage wm-s5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-header.png" alt="Wanteermako" className="w-[55%] max-w-[380px] object-contain" />
        <div className="mt-6 rounded-full px-6 py-3 text-[clamp(1rem,3vw,1.6rem)] font-black text-white" style={{ background: "linear-gradient(90deg,#6366F1,#A855F7)" }}>www.wanteermako.com</div>
        <p className="mt-4 text-[clamp(.85rem,2.4vw,1.3rem)] font-semibold text-white/75">Achetez · Vendez · Trouvez facilement</p>
      </div>

      {/* barre de progression du cycle */}
      <div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/10">
        <div className="wm-bar h-full" style={{ background: "linear-gradient(90deg,#6366F1,#FFC93C)" }} />
      </div>
    </>
  );
}

function Frame({ label, ratioClass, widthClass }: { label: string; ratioClass: string; widthClass: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 rounded-full bg-white/10 px-4 py-1.5 text-[.78rem] font-bold uppercase tracking-wider text-white/80">{label}</div>
      <div className={`relative ${widthClass} ${ratioClass} overflow-hidden rounded-[24px] border border-white/10 bg-[#0B1120] shadow-2xl`}>
        <Scenes />
      </div>
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
          <h1 className="font-display text-[1.8rem] sm:text-[2.4rem] font-black text-white">Promos animées <span className="text-[#FFC93C]">Premium</span></h1>
          <p className="mx-auto mt-2 max-w-2xl text-[.92rem] text-white/60">
            Animations en boucle (~20s). Pour en faire une <b className="text-white">vraie vidéo</b> : lancez un
            <b className="text-white"> enregistrement d'écran</b> sur le cadre voulu pendant un cycle complet, puis publiez sur TikTok, Reels, Status WhatsApp ou YouTube.
          </p>
        </header>

        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center">
          <Frame label="📱 Format 9:16 — Reels / TikTok / Status" ratioClass="aspect-[9/16]" widthClass="w-[300px] sm:w-[340px]" />
          <Frame label="🖥️ Format 16:9 — YouTube / Facebook" ratioClass="aspect-video" widthClass="w-full max-w-[640px]" />
        </div>
      </div>
    </div>
  );
}
