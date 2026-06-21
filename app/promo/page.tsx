import type { Metadata } from "next";
import Downloadable from "@/components/Downloadable";
import RecordButton from "@/components/RecordButton";

export const metadata: Metadata = {
  title: "Promos vidéo — Wanteermako",
  robots: { index: false, follow: false },
};

// 4 promos cinématiques (CSS pur, boucle 24s) — 16:9 & 9:16, 100% responsive
// (container queries) + transitions « luxury blur », balayage, vignette, glow.

const CYCLE = "24s";

const CSS = `
.wm-cine{container-type:size}
@keyframes wm-ken { 0%{transform:scale(1.02)} 100%{transform:scale(1.16)} }
@keyframes wm-ken2 { 0%{transform:scale(1.16)} 100%{transform:scale(1.02)} }
@keyframes wm-float { 0%,100%{transform:translate(0,0)} 50%{transform:translate(14px,-22px)} }
@keyframes wm-drift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-12px,20px) scale(1.1)} }
@keyframes wm-shine { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes wm-sweep { 0%{transform:translateX(-130%) skewX(-18deg)} 100%{transform:translateX(280%) skewX(-18deg)} }
@keyframes wm-bar { 0%{width:0%} 100%{width:100%} }
@keyframes wm-chip { 0%{opacity:0;transform:translateY(10px) scale(.85)} 100%{opacity:1;transform:none} }
/* 6 scènes — transition luxury blur + glissé + scale */
@keyframes wm-a { 0%{opacity:0;filter:blur(12px);transform:translateY(26px) scale(.96)} 1.6%{opacity:1;filter:blur(0);transform:none} 14%{opacity:1;filter:blur(0)} 16.6%{opacity:0;filter:blur(12px);transform:scale(1.05)} 100%{opacity:0} }
@keyframes wm-b { 0%,16.6%{opacity:0;filter:blur(12px);transform:translateY(26px) scale(.96)} 18.2%{opacity:1;filter:blur(0);transform:none} 31%{opacity:1;filter:blur(0)} 33.3%{opacity:0;filter:blur(12px);transform:scale(1.05)} 100%{opacity:0} }
@keyframes wm-c { 0%,33.3%{opacity:0;filter:blur(12px);transform:translateY(26px) scale(.96)} 35%{opacity:1;filter:blur(0);transform:none} 48%{opacity:1;filter:blur(0)} 50%{opacity:0;filter:blur(12px);transform:scale(1.05)} 100%{opacity:0} }
@keyframes wm-d { 0%,50%{opacity:0;filter:blur(12px);transform:translateY(26px) scale(.96)} 51.6%{opacity:1;filter:blur(0);transform:none} 64%{opacity:1;filter:blur(0)} 66.6%{opacity:0;filter:blur(12px);transform:scale(1.05)} 100%{opacity:0} }
@keyframes wm-e { 0%,66.6%{opacity:0;filter:blur(12px);transform:translateY(26px) scale(.96)} 68.2%{opacity:1;filter:blur(0);transform:none} 81%{opacity:1;filter:blur(0)} 83.3%{opacity:0;filter:blur(12px);transform:scale(1.05)} 100%{opacity:0} }
@keyframes wm-f { 0%,83.3%{opacity:0;filter:blur(12px);transform:translateY(26px) scale(.96)} 85%{opacity:1;filter:blur(0);transform:none} 98%{opacity:1;filter:blur(0)} 100%{opacity:0} }
/* flash blanc bref à chaque changement de scène */
@keyframes wm-flash { 0%,15%,32%,49%,65.5%,82%{opacity:0} 16.6%,33.3%,50%,66.6%,83.3%{opacity:.5} 18%,35%,52%,68.5%,85%{opacity:0} 100%{opacity:0} }
.wm-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:7% 6%;gap:3.5cqmin}
.wm-a{animation:wm-a ${CYCLE} infinite}.wm-b{animation:wm-b ${CYCLE} infinite}.wm-c{animation:wm-c ${CYCLE} infinite}
.wm-d{animation:wm-d ${CYCLE} infinite}.wm-e{animation:wm-e ${CYCLE} infinite}.wm-f{animation:wm-f ${CYCLE} infinite}
.wm-orb{position:absolute;border-radius:9999px;filter:blur(38px)}
.wm-glow{filter:drop-shadow(0 0 26px rgba(99,102,241,.55))}
.wm-shine{background:linear-gradient(110deg,currentColor 20%,#fff 45%,currentColor 70%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:wm-shine 3.2s linear infinite}
.wm-bar{animation:wm-bar ${CYCLE} linear infinite}
.wm-chip{animation:wm-chip .7s both}
.wm-sweep{position:absolute;top:0;left:0;height:100%;width:35%;background:linear-gradient(110deg,transparent,rgba(255,255,255,.15),transparent);animation:wm-sweep 7s ease-in-out infinite;z-index:24;pointer-events:none}
.wm-flash{position:absolute;inset:0;background:#fff;z-index:26;pointer-events:none;animation:wm-flash ${CYCLE} linear infinite}
.wm-vignette{position:absolute;inset:0;z-index:22;pointer-events:none;background:radial-gradient(120% 90% at 50% 42%,transparent 52%,rgba(0,0,0,.55) 100%)}
.wm-frame{position:relative;width:92%;max-width:560px;overflow:hidden;border-radius:2cqmin;border:1px solid rgba(255,255,255,.12);background:#05080f;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.wm-frame img{display:block;width:100%;height:auto}
.wm-ken{animation:wm-ken 10s ease-in-out infinite alternate}.wm-ken2{animation:wm-ken2 10s ease-in-out infinite alternate}
`;

type Chip = string;
type Scene =
  | { k: "hero"; sub: string }
  | { k: "text"; icon?: string; title: string; accent?: string; sub?: string; chips?: Chip[] }
  | { k: "cats"; chips: { i: string; t: string }[] }
  | { k: "shot"; icon: string; title: string; sub: string; src: string; ken2?: boolean; chips?: Chip[] }
  | { k: "cta"; tag: string };

type Promo = { key: string; label: string; accent: string; scenes: Scene[] };

const PROMOS: Promo[] = [
  {
    key: "plateforme", label: "Plateforme", accent: "#6366F1",
    scenes: [
      { k: "hero", sub: "La marketplace nouvelle génération · Afrique de l'Ouest" },
      { k: "text", title: "Vous cherchez ?", accent: "Vous vendez ?", sub: "Tout se passe ici.", chips: ["🌍 27 pays", "🚫 0% commission"] },
      { k: "text", icon: "🤝", title: "En direct.", accent: "Sans intermédiaire.", sub: "Acheteur ↔ vendeur, c'est tout.", chips: ["💬 WhatsApp", "📞 Appel direct"] },
      { k: "cats", chips: [{ i: "🏠", t: "Immobilier" }, { i: "🚗", t: "Véhicules" }, { i: "💼", t: "Emploi" }, { i: "📱", t: "Téléphones" }, { i: "🛋️", t: "Meubles" }] },
      { k: "shot", icon: "📊", title: "Tout piloter en un écran", sub: "Annonces · vues · contacts", src: "/a1.PNG", chips: ["⚡ Temps réel"] },
      { k: "cta", tag: "Achetez · Vendez · Trouvez facilement" },
    ],
  },
  {
    key: "vendeurs", label: "Vendeurs", accent: "#FF2A6D",
    scenes: [
      { k: "hero", sub: "Quelque chose à vendre ? On s'occupe de tout." },
      { k: "text", icon: "⚡", title: "Publiez en", accent: "2 minutes.", sub: "Gratuit, sans effort.", chips: ["📸 Photos", "🆓 Gratuit"] },
      { k: "shot", icon: "✨", title: "L'IA rédige votre annonce", sub: "Titre · description · détails", src: "/A5.PNG", chips: ["🤖 Google Gemini"] },
      { k: "text", icon: "📢", title: "Diffusée partout", accent: "automatiquement", sub: "Sans rien faire de plus.", chips: ["✈️ Telegram", "📘 Facebook"] },
      { k: "shot", icon: "📈", title: "Suivez vos ventes", sub: "Statistiques 100% réelles", src: "/a2.PNG", ken2: true, chips: ["🏆 Top annonces"] },
      { k: "cta", tag: "Vendez plus, sans commission" },
    ],
  },
  {
    key: "immobilier", label: "Immobilier", accent: "#10B981",
    scenes: [
      { k: "text", icon: "🏠", title: "Vous cherchez", accent: "un logement ?", sub: "Votre nouvelle adresse vous attend.", chips: ["🔑 Location", "🏷️ Vente"] },
      { k: "text", title: "Maisons · Terrains", accent: "Appartements", sub: "Pour tous les budgets.", chips: ["🏢 Studios", "🏡 Villas", "🌍 Terrains"] },
      { k: "text", icon: "📍", title: "À Dakar", accent: "et dans 27 pays", sub: "Partout en Afrique de l'Ouest." },
      { k: "shot", icon: "🛡️", title: "Des biens mis en avant", sub: "Vendeurs vérifiés", src: "/A11.PNG", chips: ["✅ Garanti Vérifié"] },
      { k: "text", icon: "💬", title: "Contactez le propriétaire", accent: "en direct", sub: "Sans agence, sans commission.", chips: ["📞 Appel", "💬 WhatsApp"] },
      { k: "cta", tag: "Immobilier sur Wanteermako" },
    ],
  },
  {
    key: "vehicules", label: "Véhicules", accent: "#FFC93C",
    scenes: [
      { k: "text", icon: "🚗", title: "Votre prochaine voiture", accent: "vous attend", sub: "Occasion & neuf.", chips: ["🚙 SUV", "🏍️ Motos", "🚐 Utilitaires"] },
      { k: "text", title: "Au meilleur", accent: "prix", sub: "Particuliers & garages.", chips: ["💰 Négociable", "🔧 Garages pro"] },
      { k: "text", icon: "🛡️", title: "Vendeurs", accent: "vérifiés", sub: "Achetez en toute confiance." },
      { k: "shot", icon: "📸", title: "Fiches détaillées", sub: "Photos · prix · localisation", src: "/A12.PNG", chips: ["🖼️ Galerie HD"] },
      { k: "text", icon: "📞", title: "Appel & WhatsApp", accent: "en 1 clic", sub: "Sans intermédiaire." },
      { k: "cta", tag: "Véhicules sur Wanteermako" },
    ],
  },
];

const CLASSES = ["wm-a", "wm-b", "wm-c", "wm-d", "wm-e", "wm-f"];

function Chips({ items, accent }: { items: Chip[]; accent: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-[1.5cqmin]">
      {items.map((c, i) => (
        <span key={c} className="wm-chip rounded-full border px-[2.5cqmin] py-[1cqmin] text-[clamp(.6rem,3.4cqmin,1rem)] font-bold text-white"
          style={{ borderColor: `${accent}66`, background: `${accent}22`, animationDelay: `${0.15 * i}s` }}>{c}</span>
      ))}
    </div>
  );
}

function SceneView({ s, cls, accent }: { s: Scene; cls: string; accent: string }) {
  if (s.k === "hero") {
    return (
      <div className={`wm-stage ${cls}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-header.png" alt="Wanteermako" className="wm-glow w-[72%] max-w-[460px] object-contain" />
        <p className="text-[clamp(.7rem,4cqmin,1.35rem)] font-semibold text-white/70">{s.sub}</p>
      </div>
    );
  }
  if (s.k === "text") {
    return (
      <div className={`wm-stage ${cls}`}>
        {s.icon && <div className="text-[clamp(2rem,16cqmin,5rem)] leading-none">{s.icon}</div>}
        <div className="font-display text-[clamp(1.1rem,10.5cqmin,3.6rem)] font-black leading-[1.04] text-white">
          {s.title} {s.accent && <span className="wm-shine" style={{ color: accent }}>{s.accent}</span>}
        </div>
        {s.sub && <p className="text-[clamp(.7rem,4cqmin,1.3rem)] text-white/70">{s.sub}</p>}
        {s.chips && <Chips items={s.chips} accent={accent} />}
      </div>
    );
  }
  if (s.k === "cats") {
    return (
      <div className={`wm-stage ${cls}`}>
        <div className="font-display text-[clamp(1rem,7cqmin,2.4rem)] font-black text-white">Tout, au même endroit</div>
        <div className="flex flex-wrap items-center justify-center gap-[2cqmin]">
          {s.chips.map((c, i) => (
            <span key={c.t} className="wm-chip rounded-full border border-white/15 bg-white/[0.07] px-[3cqmin] py-[1.6cqmin] text-[clamp(.65rem,3.8cqmin,1.15rem)] font-bold text-white" style={{ animationDelay: `${0.12 * i}s` }}>
              <span className="mr-1">{c.i}</span>{c.t}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (s.k === "shot") {
    return (
      <div className={`wm-stage ${cls}`}>
        <div>
          <div className="text-[clamp(1.4rem,10cqmin,3rem)] leading-none">{s.icon}</div>
          <h3 className="mt-[1cqmin] font-display text-[clamp(1rem,7cqmin,2.1rem)] font-black leading-tight text-white">{s.title}</h3>
          <p className="text-[clamp(.62rem,3.4cqmin,1rem)] text-white/70">{s.sub}</p>
        </div>
        <div className="wm-frame">
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-3 py-[1cqmin]">
            <span className="h-[1.4cqmin] w-[1.4cqmin] min-h-[5px] min-w-[5px] rounded-full bg-[#FF5F57]" /><span className="h-[1.4cqmin] w-[1.4cqmin] min-h-[5px] min-w-[5px] rounded-full bg-[#FEBC2E]" /><span className="h-[1.4cqmin] w-[1.4cqmin] min-h-[5px] min-w-[5px] rounded-full bg-[#28C840]" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.src} alt={s.title} className={s.ken2 ? "wm-ken2" : "wm-ken"} />
        </div>
        {s.chips && <Chips items={s.chips} accent={accent} />}
      </div>
    );
  }
  return (
    <div className={`wm-stage ${cls}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-header.png" alt="Wanteermako" className="wm-glow w-[60%] max-w-[380px] object-contain" />
      <div className="rounded-full px-[5cqmin] py-[2.4cqmin] text-[clamp(.85rem,5cqmin,1.6rem)] font-black text-white" style={{ background: `linear-gradient(90deg,${accent},#A855F7)` }}>www.wanteermako.com</div>
      <p className="text-[clamp(.7rem,4cqmin,1.2rem)] font-semibold text-white/75">{s.tag}</p>
    </div>
  );
}

function Player({ promo }: { promo: Promo }) {
  const a = promo.accent;
  return (
    <>
      <div className="wm-orb" style={{ width: "52%", height: "52%", background: a, opacity: .42, top: "-12%", left: "-10%", animation: "wm-float 9s ease-in-out infinite" }} />
      <div className="wm-orb" style={{ width: "46%", height: "46%", background: "#FFC93C", opacity: .26, bottom: "-12%", right: "-10%", animation: "wm-drift 12s ease-in-out infinite" }} />
      {promo.scenes.map((s, i) => <SceneView key={i} s={s} cls={CLASSES[i]} accent={a} />)}
      <div className="wm-sweep" />
      <div className="wm-flash" />
      <div className="wm-vignette" />
      <div className="absolute bottom-0 left-0 z-30 h-1.5 w-full bg-white/10"><div className="wm-bar h-full" style={{ background: `linear-gradient(90deg,${a},#FFC93C)` }} /></div>
    </>
  );
}

function PromoBlock({ promo }: { promo: Promo }) {
  return (
    <div className="mb-14">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[1.05rem] font-bold uppercase tracking-wider text-white/80">
          <span className="h-5 w-1.5 rounded-full" style={{ background: promo.accent }} /> Promo « {promo.label} »
        </h2>
        <RecordButton filename={`wanteermako-promo-${promo.key}`} seconds={24} />
      </div>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center lg:justify-start">
        <Downloadable filename={`wanteermako-promo-${promo.key}-16x9`} label="Image">
          <div className="wm-cine relative aspect-video w-[88vw] max-w-[680px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0B1120] shadow-2xl"><Player promo={promo} /></div>
        </Downloadable>
        <Downloadable filename={`wanteermako-promo-${promo.key}-9x16`} label="Image">
          <div className="wm-cine relative aspect-[9/16] w-[230px] shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#0B1120] shadow-2xl"><Player promo={promo} /></div>
        </Downloadable>
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
          <h1 className="font-display text-[1.8rem] sm:text-[2.4rem] font-black text-white">4 Promos vidéo <span className="text-[#FFC93C]">cinématiques</span></h1>
          <p className="mx-auto mt-2 max-w-2xl text-[.92rem] text-white/60">
            Plateforme · Vendeurs · Immobilier · Véhicules — transitions premium, contenu riche, <b className="text-white">100% responsive</b>, en 16:9 et 9:16.
            Pour une vraie vidéo : <b className="text-white">enregistrez l'écran</b> sur un cadre (~24s).
          </p>
        </header>
        {PROMOS.map((p) => <PromoBlock key={p.key} promo={p} />)}
      </div>
    </div>
  );
}
