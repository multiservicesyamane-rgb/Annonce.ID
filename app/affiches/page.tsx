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

        {/* ── Affiches 100% HTML (sans captures) — moitié sombre / clair ── */}
        <SectionTitle>🎨 Affiches HTML — stats & prix nets (moitié sombre / clair)</SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AfficheStatsSplit />
          <AfficheBoostsSplit />
          <AfficheBoutiqueSplit />
          <AfficheHeroSplit />
          <AfficheAutoSplit />
          <AfficheImmoSplit />
        </div>

        {/* ── Affiches "preuve réelle" (carré) ── */}
        <SectionTitle>🖥️ Aperçu réel — confiance & transparence</SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SHOTS.map((s) => <ShotCard key={s.src} {...s} />)}
        </div>

        {/* ── 11 affiches CLAIRES (fond blanc sublime néon, captures sombres) ── */}
        <SectionTitle>☀️ Affiches claires — fond blanc sublime (néon)</SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SHOTS_LIGHT.map((s) => <ShotCardLight key={s.src} {...s} />)}
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

// 11 affiches CLAIRES — mêmes captures, textes retravaillés + plus percutants
const SHOTS_LIGHT: { src: string; badge: string; title: string; sub: string; accent: string }[] = [
  { src: "/a1.PNG", badge: "Tableau de bord", title: "Tout votre business, un seul écran", sub: "Annonces, vues et favoris pilotés en temps réel.", accent: "#6366F1" },
  { src: "/a2.PNG", badge: "Statistiques", title: "Vos chiffres parlent pour vous", sub: "Mesurez l'impact réel de chaque annonce.", accent: "#10B981" },
  { src: "/A3.PNG", badge: "Gestion", title: "La gestion sans prise de tête", sub: "En ligne, brouillons, expirées — tout sous contrôle.", accent: "#6366F1" },
  { src: "/A4.PNG", badge: "Marketing", title: "Un clic, partout à la fois", sub: "WhatsApp, Facebook, Instagram en un instant.", accent: "#FF2A6D" },
  { src: "/A5.PNG", badge: "Assistant IA", title: "Laissez l'IA écrire à votre place", sub: "Titre, description et détails générés en 1 clic.", accent: "#FFC93C" },
  { src: "/A6.PNG", badge: "Publication", title: "Publier n'a jamais été si simple", sub: "4 étapes, 2 minutes, et c'est en ligne.", accent: "#6366F1" },
  { src: "/A7.PNG", badge: "Boosts", title: "Passez devant tout le monde", sub: "Standard, Premium, À la Une, VIP.", accent: "#FF2A6D" },
  { src: "/A8.PNG", badge: "Boutique Pro", title: "Votre boutique, votre marque", sub: "Vitrine certifiée dès 5 000 FCFA/mois.", accent: "#FFC93C" },
  { src: "/A9.PNG", badge: "Messagerie", title: "Parlez à vos clients, vendez plus", sub: "Chat intégré + WhatsApp & appel direct.", accent: "#10B981" },
  { src: "/A11.PNG", badge: "À la une", title: "Soyez impossible à manquer", sub: "Mise en avant + badge « Garanti Vérifié ».", accent: "#FFC93C" },
  { src: "/A12.PNG", badge: "Fiche produit", title: "Une fiche qui donne envie d'acheter", sub: "Galerie premium + Acheter / Discuter WhatsApp.", accent: "#6366F1" },
];

function BrandLight({ className = "h-7" }: { className?: string }) {
  return (
    <span className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-icon.png" alt="" className={`${className} w-auto rounded-lg object-contain`} />
      <span className="font-display text-[.95rem] font-black bg-gradient-to-r from-[#6366F1] to-[#FFC93C] bg-clip-text text-transparent">Wanteermako</span>
    </span>
  );
}

function ShotCardLight({ src, badge, title, sub, accent }: { src: string; badge: string; title: string; sub: string; accent: string }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-xl">
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(at 88% 0%, ${accent}24 0, transparent 55%), radial-gradient(at 8% 100%, rgba(245,201,60,0.14) 0, transparent 50%)` }} />
      <div className="relative flex items-center justify-between gap-2">
        <BrandLight />
        <span className="shrink-0 rounded-full px-3 py-1 text-[.62rem] font-bold uppercase tracking-wider" style={{ background: `${accent}1f`, color: accent }}>{badge}</span>
      </div>

      {/* capture (reste sombre — image fixe) dans un cadre clair */}
      <div className="relative mt-4 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-center gap-1.5 border-b border-black/10 bg-gray-50 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 truncate rounded bg-black/5 px-2 py-0.5 text-[.6rem] text-black/40">wanteermako.com</span>
        </div>
        <img src={src} alt={title} className="h-[210px] w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.05]" />
      </div>

      <div className="relative mt-5">
        <h3 className="font-display text-[1.3rem] font-extrabold leading-tight text-[#0B1120]">{title}</h3>
        <p className="mt-1.5 text-[.84rem] text-[#0B1120]/60">{sub}</p>
      </div>
      <div className="relative mt-4 flex items-center justify-between border-t border-black/10 pt-3">
        <span className="text-[.76rem] font-black text-[#6366F1]">www.wanteermako.com</span>
        <span className="text-[.62rem] font-medium text-[#0B1120]/45">Achetez · Vendez · Trouvez</span>
      </div>
    </div>
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

/* ───────── Affiches HTML moitié sombre / clair ───────── */
function SplitFrame({ dark, light }: { dark: React.ReactNode; light: React.ReactNode }) {
  return (
    <div className="relative flex aspect-square flex-col overflow-hidden rounded-[22px] border border-white/10 shadow-2xl">
      <div className="relative flex min-h-[44%] flex-col justify-between overflow-hidden bg-[#0B1120] p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_85%_0%,rgba(99,102,241,0.35)_0,transparent_60%)]" />
        <div className="relative">{dark}</div>
      </div>
      <div className="h-[3px] w-full bg-gradient-to-r from-[#6366F1] via-[#FFC93C] to-[#FF2A6D]" />
      <div className="relative flex flex-1 flex-col bg-[#F8FAFC] p-5">{light}</div>
    </div>
  );
}
function DarkHead({ badge, color }: { badge: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <LogoFull className="h-9" />
      <span className="shrink-0 rounded-full px-2.5 py-1 text-[.58rem] font-bold uppercase tracking-wider" style={{ background: `${color}26`, color }}>{badge}</span>
    </div>
  );
}
function PriceRow({ name, price, sub, color }: { name: string; price: string; sub: string; color: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 py-2 last:border-0">
      <div>
        <div className="text-[.86rem] font-extrabold text-[#0B1120]">{name}</div>
        <div className="text-[.64rem] text-[#0B1120]/50">{sub}</div>
      </div>
      <div className="font-display text-[1.05rem] font-black" style={{ color }}>{price}<span className="text-[.58rem] text-[#0B1120]/50"> FCFA</span></div>
    </div>
  );
}
function FooterLight() {
  return (
    <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-2.5">
      <span className="text-[.74rem] font-black text-[#6366F1]">www.wanteermako.com</span>
      <span className="text-[.6rem] font-medium text-[#0B1120]/45">Achetez · Vendez · Trouvez</span>
    </div>
  );
}

function AfficheStatsSplit() {
  const bars = [18, 17, 13, 13, 10, 9, 8];
  return (
    <SplitFrame
      dark={<>
        <DarkHead badge="Performance" color="#10B981" />
        <h3 className="mt-3 font-display text-[1.5rem] font-black leading-tight text-white">La marketplace qui <span className="text-[#FFC93C]">fait vendre</span></h3>
      </>}
      light={<>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["27", "Pays"], ["0%", "Commission"], ["2 min", "Pour publier"]].map(([n, l]) => (
            <div key={l} className="rounded-xl bg-white py-2 shadow-sm">
              <div className="font-display text-[1.25rem] font-black text-[#0B1120]">{n}</div>
              <div className="text-[.58rem] font-bold uppercase tracking-wide text-[#0B1120]/50">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[.66rem] font-bold uppercase tracking-wide text-[#0B1120]/45">Visibilité par annonce</div>
        <div className="mt-1.5 flex h-12 items-end gap-1.5">
          {bars.map((v, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#6366F1] to-[#A855F7]" style={{ height: `${(v / 18) * 100}%` }} />
          ))}
        </div>
        <FooterLight />
      </>}
    />
  );
}

function AfficheBoostsSplit() {
  return (
    <SplitFrame
      dark={<>
        <DarkHead badge="Boosts" color="#FF2A6D" />
        <h3 className="mt-3 font-display text-[1.5rem] font-black leading-tight text-white">🚀 Boostez votre visibilité</h3>
      </>}
      light={<>
        <PriceRow name="🚀 Standard" sub="7 jours · 3 photos" price="1 500" color="#6366F1" />
        <PriceRow name="⭐ Premium" sub="14 jours · 5 photos" price="3 500" color="#6366F1" />
        <PriceRow name="🔥 À la Une" sub="30 jours · accueil" price="7 500" color="#FF2A6D" />
        <PriceRow name="👑 VIP" sub="60 jours · illimité" price="15 000" color="#D4891A" />
        <FooterLight />
      </>}
    />
  );
}

function AfficheBoutiqueSplit() {
  return (
    <SplitFrame
      dark={<>
        <DarkHead badge="Boutique Pro" color="#FFC93C" />
        <h3 className="mt-3 font-display text-[1.5rem] font-black leading-tight text-white">🏪 Votre boutique <span className="text-[#FFC93C]">certifiée</span></h3>
      </>}
      light={<>
        <PriceRow name="Standard" sub="15 annonces + vitrine" price="5 000" color="#6366F1" />
        <PriceRow name="Premium" sub="50 annonces + 1 boost" price="10 000" color="#6366F1" />
        <PriceRow name="VIP" sub="120 annonces + Vérifié" price="20 000" color="#D4891A" />
        <div className="mt-2 text-[.62rem] text-[#0B1120]/50">Par mois · paiement Mobile Money</div>
        <FooterLight />
      </>}
    />
  );
}

function AfficheAutoSplit() {
  return (
    <SplitFrame
      dark={<>
        <DarkHead badge="Automobile" color="#6366F1" />
        <h3 className="mt-3 font-display text-[1.5rem] font-black leading-tight text-white">🚗 Spécial garages & concessionnaires</h3>
      </>}
      light={<>
        <PriceRow name="Standard Auto" sub="5 voitures actives" price="10 000" color="#6366F1" />
        <PriceRow name="Premium Auto" sub="15 voitures + WhatsApp" price="25 000" color="#6366F1" />
        <PriceRow name="VIP Auto" sub="50 voitures + Vérifié" price="50 000" color="#D4891A" />
        <div className="mt-2 text-[.62rem] text-[#0B1120]/50">Par mois</div>
        <FooterLight />
      </>}
    />
  );
}

function AfficheImmoSplit() {
  return (
    <SplitFrame
      dark={<>
        <DarkHead badge="Immobilier" color="#10B981" />
        <h3 className="mt-3 font-display text-[1.5rem] font-black leading-tight text-white">🏠 Spécial agences & courtiers</h3>
      </>}
      light={<>
        <PriceRow name="Standard Immo" sub="5 biens actifs" price="15 000" color="#6366F1" />
        <PriceRow name="Premium Immo" sub="15 biens + géoloc." price="35 000" color="#6366F1" />
        <PriceRow name="VIP Immo" sub="40 biens + Vérifié" price="75 000" color="#D4891A" />
        <div className="mt-2 text-[.62rem] text-[#0B1120]/50">Par mois</div>
        <FooterLight />
      </>}
    />
  );
}

function AfficheHeroSplit() {
  return (
    <SplitFrame
      dark={<>
        <DarkHead badge="100% gratuit" color="#10B981" />
        <h3 className="mt-3 font-display text-[1.7rem] font-black leading-[1.05] text-white">Vendez en direct.</h3>
      </>}
      light={<>
        <div className="font-display text-[1.7rem] font-black leading-[1.05] text-[#0B1120]">Sans <span className="text-[#6366F1]">commission.</span></div>
        <ul className="mt-3 space-y-1.5 text-[.8rem] font-medium text-[#0B1120]/80">
          <li>💬 Contact direct WhatsApp</li>
          <li>🤖 Diffusion auto Telegram & Facebook</li>
          <li>⚡ Publication en 2 minutes</li>
        </ul>
        <FooterLight />
      </>}
    />
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
