import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kit Affiches — Wanteermako",
  robots: { index: false, follow: false }, // page privée, non indexée
};

// Page privée (non liée au menu) : affiches marketing ultra-premium intégrant
// les vraies captures du site (preuve de confiance). Charte : ardoise #0B1120,
// indigo #6366F1, or #FFC93C, émeraude #10B981, rose néon #FF2A6D.

const SITE = "www.wanteermako.com";

/* eslint-disable @next/next/no-img-element */
function LogoFull({ className = "h-9" }: { className?: string }) {
  return <img src="/logo-header.png" alt="Wanteermako" className={`${className} w-auto object-contain`} />;
}

// Vraies captures (respecter la casse exacte des fichiers !)
const SHOTS: { src: string; badge: string; title: string; sub: string; accent: string }[] = [
  { src: "/a1.PNG", badge: "Tableau de bord", title: "Pilotez votre activité", sub: "Annonces, vues et favoris en un coup d'œil.", accent: "#6366F1" },
  { src: "/A3.PNG", badge: "Statistiques", title: "Des données 100% réelles", sub: "Suivez les performances de chaque annonce.", accent: "#10B981" },
  { src: "/A4.PNG", badge: "Gestion", title: "Gérez toutes vos annonces", sub: "En ligne, brouillons, expirées — tout au même endroit.", accent: "#6366F1" },
  { src: "/A5.PNG", badge: "Marketing", title: "Partage réseaux en 1 clic", sub: "WhatsApp, Facebook, Instagram directement.", accent: "#FF2A6D" },
  { src: "/A6.PNG", badge: "Assistant IA", title: "L'IA rédige pour vous", sub: "Titre, description et caractéristiques automatiques.", accent: "#FFC93C" },
  { src: "/A8.PNG", badge: "Publication", title: "Publiez en 5 étapes", sub: "Simple, rapide, guidé par catégorie.", accent: "#6366F1" },
  { src: "/A7.PNG", badge: "Boutique", title: "Votre boutique en ligne", sub: "Une vitrine pro, certifiée et personnalisée.", accent: "#FFC93C" },
  { src: "/A9.PNG", badge: "Boosts", title: "Boostez votre visibilité", sub: "Standard, Premium, À la Une, VIP.", accent: "#FF2A6D" },
  { src: "/A11.PNG", badge: "Messagerie", title: "Discutez avec vos clients", sub: "Chat intégré + WhatsApp & appel direct.", accent: "#10B981" },
  { src: "/A12.PNG", badge: "Vitrine", title: "Des annonces qui brillent", sub: "Mise en avant premium, badge « Vérifié ».", accent: "#FFC93C" },
  { src: "/a2.PNG", badge: "Top annonces", title: "Vos meilleures ventes", sub: "Classement et vues par annonce.", accent: "#6366F1" },
];

export default function AffichesPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] py-10">
      {/* halo premium */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(at_15%_0%,rgba(99,102,241,0.18)_0,transparent_40%),radial-gradient(at_85%_100%,rgba(245,201,60,0.12)_0,transparent_40%)]" />

      <div className="relative mx-auto max-w-[1320px] px-4">
        <header className="mb-10 text-center">
          <div className="mb-4 flex justify-center"><LogoFull className="h-12 sm:h-16" /></div>
          <h1 className="font-display text-[1.8rem] sm:text-[2.4rem] font-black text-white">
            Kit Affiches <span className="text-[#FFC93C]">Premium</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-[.92rem] text-white/60">
            Affiches sublimes intégrant les vraies captures de la plateforme. <b className="text-white">Clic droit → Enregistrer</b> ou capture d'écran pour publier / imprimer.
          </p>
        </header>

        {/* ── Affiches "preuve réelle" (carré) ── */}
        <SectionTitle>🖥️ Aperçu réel — confiance & transparence</SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SHOTS.map((s) => <ShotCard key={s.src} {...s} />)}
        </div>

        {/* ── Affiches message (carré) ── */}
        <SectionTitle>📐 Messages clés (format carré 1:1)</SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AfficheGrandPublic />
          <AfficheReseaux />
          <AfficheBoutiquePro />
        </div>

        {/* ── Affiches A4 portrait ── */}
        <SectionTitle>🖼️ Format portrait (A4) — flyer / impression</SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2">
          <AffichePortrait />
          <AffichePortraitB2B />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 mt-14 flex items-center gap-2 text-[1.05rem] font-bold uppercase tracking-wider text-white/70">
      <span className="h-5 w-1.5 rounded-full bg-gradient-to-b from-[#6366F1] to-[#FFC93C]" />
      {children}
    </h2>
  );
}

/* ───────── Carte avec capture réelle (ultra premium) ───────── */
function ShotCard({ src, badge, title, sub, accent }: { src: string; badge: string; title: string; sub: string; accent: string }) {
  return (
    <div className="group relative flex aspect-square flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#0B1120] p-5 shadow-2xl">
      <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(at 80% 0%, ${accent}33 0, transparent 55%)` }} />
      <div className="relative flex items-center justify-between">
        <LogoFull className="h-7" />
        <span className="rounded-full px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-wider" style={{ background: `${accent}22`, color: accent }}>{badge}</span>
      </div>

      {/* mockup navigateur avec la vraie capture */}
      <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#05080f] shadow-lg">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
          <span className="ml-2 truncate text-[.58rem] text-white/40">{SITE}</span>
        </div>
        <img src={src} alt={title} className="h-[150px] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]" />
      </div>

      <div className="relative mt-auto pt-4">
        <h3 className="font-display text-[1.25rem] font-extrabold leading-tight text-white">{title}</h3>
        <p className="mt-1 text-[.8rem] text-white/65">{sub}</p>
      </div>
      <Footer />
    </div>
  );
}

/* ───────── Affiches message carré ───────── */
function AfficheGrandPublic() {
  return (
    <Poster className="aspect-square bg-[radial-gradient(at_20%_15%,rgba(99,102,241,0.35)_0,transparent_45%),radial-gradient(at_85%_80%,rgba(245,201,60,0.22)_0,transparent_45%)] bg-[#0B1120]">
      <div className="flex items-center justify-between">
        <LogoFull className="h-8" />
        <span className="rounded-full bg-[#10B981]/15 px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-wider text-[#10B981]">100% gratuit</span>
      </div>
      <div className="mt-auto">
        <h3 className="font-display text-[2rem] font-black leading-[1.05] text-white">Vendez en direct.<br /><span className="text-[#FFC93C]">Sans commission.</span></h3>
        <p className="mt-3 text-[.86rem] text-white/70">La 1ʳᵉ plateforme de petites annonces premium d'Afrique de l'Ouest.</p>
        <ul className="mt-4 space-y-1.5 text-[.82rem] text-white/85">
          <li>💬 Contact direct WhatsApp & appel</li>
          <li>🚫 Zéro commission</li>
          <li>⚡ Publication en 2 minutes</li>
        </ul>
      </div>
      <Footer />
    </Poster>
  );
}

function AfficheReseaux() {
  return (
    <Poster className="aspect-square bg-[radial-gradient(at_80%_20%,rgba(99,102,241,0.4)_0,transparent_50%)] bg-[#0B1120]">
      <div className="flex items-center justify-between">
        <LogoFull className="h-8" />
        <span className="rounded-full bg-[#6366F1]/20 px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-wider text-[#A5B4FC]">Nouveauté</span>
      </div>
      <div className="mt-auto">
        <div className="mb-3 text-[1.7rem]">📢 🤖</div>
        <h3 className="font-display text-[1.9rem] font-black leading-[1.05] text-white">Diffusée <span className="text-[#6366F1]">automatiquement</span></h3>
        <p className="mt-3 text-[.9rem] text-white/80">Sur <b className="text-white">Telegram</b> & <b className="text-white">Facebook</b> dès la publication — visibilité maximale, sans effort.</p>
        <div className="mt-4 flex gap-2"><Pill>Telegram</Pill><Pill>Facebook</Pill><Pill>+ IA</Pill></div>
      </div>
      <Footer />
    </Poster>
  );
}

function AfficheBoutiquePro() {
  return (
    <Poster className="aspect-square bg-[radial-gradient(at_15%_85%,rgba(245,201,60,0.25)_0,transparent_50%)] bg-[#0B1120]">
      <div className="flex items-center justify-between">
        <LogoFull className="h-8" />
        <span className="rounded-full bg-[#FFC93C]/15 px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-wider text-[#FFC93C]">Pro</span>
      </div>
      <div className="mt-auto">
        <h3 className="font-display text-[1.95rem] font-black leading-[1.05] text-white">Votre <span className="text-[#FFC93C]">boutique</span> certifiée</h3>
        <p className="mt-2 text-[.86rem] text-white/70">À partir de</p>
        <div className="font-display text-[2.6rem] font-black leading-none text-[#FFC93C]">5 000 <span className="text-[1.1rem] text-white/80">FCFA/mois</span></div>
        <ul className="mt-3 space-y-1 text-[.8rem] text-white/85">
          <li>🏪 Vitrine web personnalisée</li>
          <li>📈 Jusqu'à 120 annonces actives</li>
          <li>✅ Badge « Boutique Vérifiée »</li>
        </ul>
      </div>
      <Footer />
    </Poster>
  );
}

/* ───────── A4 portrait ───────── */
function AffichePortrait() {
  return (
    <Poster className="aspect-[1/1.414] bg-[radial-gradient(at_20%_10%,rgba(99,102,241,0.35)_0,transparent_45%),radial-gradient(at_80%_90%,rgba(245,201,60,0.2)_0,transparent_45%)] bg-[#0B1120]">
      <div className="flex items-center justify-between">
        <LogoFull className="h-10" />
        <span className="rounded-full bg-[#10B981]/15 px-3 py-1 text-[.66rem] font-bold uppercase tracking-wider text-[#10B981]">Gratuit</span>
      </div>
      <div className="my-auto">
        <h3 className="font-display text-[2.6rem] font-black leading-[1.02] text-white">Vendez en un clic.<br /><span className="text-[#FFC93C]">Achetez en direct !</span></h3>
        <p className="mt-4 text-[1rem] text-white/70">Petites annonces premium en Afrique de l'Ouest — 27 pays.</p>
        <ul className="mt-6 space-y-2.5 text-[.98rem] text-white/90">
          <li>💬 Contact direct WhatsApp & téléphone</li>
          <li>🚫 Zéro commission, 100% pour vous</li>
          <li>🤖 Diffusion auto Telegram & Facebook</li>
          <li>⚡ Publication gratuite en 2 minutes</li>
        </ul>
      </div>
      <FooterBig />
    </Poster>
  );
}

function AffichePortraitB2B() {
  return (
    <Poster className="aspect-[1/1.414] bg-[radial-gradient(at_80%_15%,rgba(245,201,60,0.25)_0,transparent_45%),radial-gradient(at_15%_85%,rgba(99,102,241,0.3)_0,transparent_45%)] bg-[#0B1120]">
      <div className="flex items-center justify-between">
        <LogoFull className="h-10" />
        <span className="rounded-full bg-[#FFC93C]/15 px-3 py-1 text-[.66rem] font-bold uppercase tracking-wider text-[#FFC93C]">Professionnels</span>
      </div>
      <div className="my-auto">
        <h3 className="font-display text-[2.3rem] font-black leading-[1.05] text-white">Propulsez votre commerce</h3>
        <p className="mt-3 text-[.98rem] text-white/75">Boutique en ligne certifiée dès <b className="text-[#FFC93C]">5 000 FCFA/mois</b>.</p>
        <ul className="mt-6 space-y-2.5 text-[.96rem] text-white/90">
          <li>🏪 Vitrine référencée sur Google</li>
          <li>🤖 Produits diffusés Telegram & Facebook</li>
          <li>📈 Jusqu'à 120 annonces actives</li>
          <li>💬 Bouton WhatsApp sur chaque produit</li>
          <li>✅ Badge « Boutique Vérifiée »</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-2"><Pill>Orange Money</Pill><Pill>Wave</Pill><Pill>MTN MoMo</Pill><Pill>Carte</Pill></div>
      </div>
      <FooterBig />
    </Poster>
  );
}

/* ───────── helpers ───────── */
function Poster({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`relative flex flex-col overflow-hidden rounded-[22px] border border-white/10 p-6 shadow-2xl ${className}`}>{children}</div>;
}
function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[.72rem] font-semibold text-white/85">{children}</span>;
}
function Footer() {
  return (
    <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3">
      <span className="text-[.76rem] font-bold text-[#FFC93C]">{SITE}</span>
      <span className="text-[.62rem] text-white/45">Achetez · Vendez · Trouvez</span>
    </div>
  );
}
function FooterBig() {
  return (
    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
      <span className="font-display text-[1.05rem] font-black text-[#FFC93C]">{SITE}</span>
      <span className="text-[.72rem] text-white/60">Achetez · Vendez · Trouvez facilement</span>
    </div>
  );
}
