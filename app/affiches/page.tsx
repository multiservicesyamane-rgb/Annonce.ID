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
  { src: "/a2.PNG", badge: "Statistiques", title: "Des données 100% réelles", sub: "Vues par annonce et top des ventes.", accent: "#10B981" },
  { src: "/A3.PNG", badge: "Gestion", title: "Gérez toutes vos annonces", sub: "En ligne, brouillons, expirées — au même endroit.", accent: "#6366F1" },
  { src: "/A4.PNG", badge: "Marketing", title: "Partage réseaux en 1 clic", sub: "WhatsApp, Facebook, Instagram directement.", accent: "#FF2A6D" },
  { src: "/A5.PNG", badge: "Assistant IA", title: "L'IA rédige votre annonce", sub: "Titre, description et caractéristiques automatiques.", accent: "#FFC93C" },
  { src: "/A6.PNG", badge: "Publication", title: "Publiez en 4 étapes", sub: "Catégorie, photos, détails, en ligne.", accent: "#6366F1" },
  { src: "/A7.PNG", badge: "Boosts", title: "Boostez votre visibilité", sub: "Standard, Premium, À la Une, VIP.", accent: "#FF2A6D" },
  { src: "/A8.PNG", badge: "Boutique Pro", title: "Abonnements professionnels", sub: "Vitrine certifiée dès 5 000 FCFA/mois.", accent: "#FFC93C" },
  { src: "/A9.PNG", badge: "Messagerie", title: "Discutez avec vos clients", sub: "Chat intégré + WhatsApp & appel direct.", accent: "#10B981" },
  { src: "/A11.PNG", badge: "À la une", title: "Vos annonces mises en avant", sub: "Badge « Garanti Vérifié », visibilité maximale.", accent: "#FFC93C" },
  { src: "/A12.PNG", badge: "Fiche produit", title: "Une fiche qui vend", sub: "Galerie premium + Acheter / Discuter WhatsApp.", accent: "#6366F1" },
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
    <div className="group relative flex flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#0B1120] p-5 shadow-2xl">
      <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(at 80% 0%, ${accent}3d 0, transparent 60%)` }} />
      <div className="relative flex items-center justify-between gap-2">
        <LogoFull className="h-10" />
        <span className="shrink-0 rounded-full px-3 py-1 text-[.62rem] font-bold uppercase tracking-wider" style={{ background: `${accent}26`, color: accent }}>{badge}</span>
      </div>

      {/* mockup navigateur avec la vraie capture */}
      <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#05080f] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 truncate rounded bg-white/5 px-2 py-0.5 text-[.6rem] text-white/45">{SITE}</span>
        </div>
        <img src={src} alt={title} className="h-[210px] w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.05]" />
      </div>

      <div className="relative mt-5">
        <h3 className="font-display text-[1.35rem] font-extrabold leading-tight text-white">{title}</h3>
        <p className="mt-1.5 text-[.84rem] text-white/65">{sub}</p>
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
        <LogoFull className="h-10" />
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
        <LogoFull className="h-10" />
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
        <LogoFull className="h-10" />
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
