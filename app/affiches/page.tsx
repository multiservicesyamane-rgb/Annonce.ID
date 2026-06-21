import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kit Affiches — Wanteermako",
  robots: { index: false, follow: false }, // page non indexée (privée)
};

// Page privée (non liée dans le menu) regroupant les affiches marketing prêtes
// à screenshoter / imprimer. Couleurs de la charte : ardoise #0B1120, indigo
// #6366F1, or #FFC93C, émeraude #10B981, rose néon #FF2A6D.

const SITE = "www.wanteermako.com";

function Logo({ className = "h-9" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-icon.png" alt="Wanteermako" className={`${className} w-auto rounded-xl object-contain`} />;
}

export default function AffichesPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] py-10">
      <div className="mx-auto max-w-[1320px] px-4">
        <header className="mb-8 text-center">
          <h1 className="font-display text-[1.8rem] sm:text-[2.4rem] font-black text-white">
            Kit Affiches <span className="text-[#FFC93C]">Wanteermako</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-[.92rem] text-white/60">
            Affiches premium prêtes à l'emploi. Faites un <b className="text-white">clic droit → Enregistrer l'image</b> ou une <b className="text-white">capture d'écran</b> de chaque carte pour la publier sur vos réseaux ou l'imprimer.
          </p>
        </header>

        {/* ── Affiches CARRÉ (1:1) — idéal Instagram / Facebook / Telegram ── */}
        <SectionTitle>📐 Format carré (1:1) — réseaux sociaux</SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AfficheGrandPublic />
          <AfficheReseaux />
          <AfficheBoutiquePro />
          <AfficheBoosts />
          <AfficheIA />
          <AfficheConfiance />
        </div>

        {/* ── Affiche PORTRAIT (A4) — impression / flyer ── */}
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
    <h2 className="mb-4 mt-12 flex items-center gap-2 text-[1.05rem] font-bold uppercase tracking-wider text-white/70">
      <span className="h-5 w-1.5 rounded-full bg-gradient-to-b from-[#6366F1] to-[#FFC93C]" />
      {children}
    </h2>
  );
}

/* ───────────────────────── AFFICHES CARRÉ ───────────────────────── */

function AfficheGrandPublic() {
  return (
    <Poster className="aspect-square bg-[radial-gradient(at_20%_15%,rgba(99,102,241,0.35)_0,transparent_45%),radial-gradient(at_85%_80%,rgba(245,201,60,0.22)_0,transparent_45%)] bg-[#0B1120]">
      <div className="flex items-center justify-between">
        <Logo />
        <span className="rounded-full bg-[#10B981]/15 px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-wider text-[#10B981]">100% gratuit</span>
      </div>
      <div className="mt-auto">
        <h3 className="font-display text-[2rem] font-black leading-[1.05] text-white">
          Vendez en direct.<br /><span className="text-[#FFC93C]">Sans commission.</span>
        </h3>
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
        <Logo />
        <span className="rounded-full bg-[#6366F1]/20 px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-wider text-[#A5B4FC]">Nouveauté</span>
      </div>
      <div className="mt-auto">
        <div className="mb-3 flex gap-2 text-[1.7rem]">📢 🤖</div>
        <h3 className="font-display text-[1.9rem] font-black leading-[1.05] text-white">
          Votre annonce diffusée <span className="text-[#6366F1]">automatiquement</span>
        </h3>
        <p className="mt-3 text-[.9rem] text-white/80">Sur <b className="text-white">Telegram</b> & <b className="text-white">Facebook</b> dès la publication — visibilité maximale, sans effort.</p>
        <div className="mt-4 flex gap-2">
          <Pill>Telegram</Pill><Pill>Facebook</Pill><Pill>+ IA</Pill>
        </div>
      </div>
      <Footer />
    </Poster>
  );
}

function AfficheBoutiquePro() {
  return (
    <Poster className="aspect-square bg-[radial-gradient(at_15%_85%,rgba(245,201,60,0.25)_0,transparent_50%)] bg-[#0B1120]">
      <div className="flex items-center justify-between">
        <Logo />
        <span className="rounded-full bg-[#FFC93C]/15 px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-wider text-[#FFC93C]">Pro</span>
      </div>
      <div className="mt-auto">
        <h3 className="font-display text-[1.95rem] font-black leading-[1.05] text-white">
          Votre <span className="text-[#FFC93C]">boutique en ligne</span> certifiée
        </h3>
        <p className="mt-2 text-[.86rem] text-white/70">À partir de</p>
        <div className="font-display text-[2.6rem] font-black text-[#FFC93C] leading-none">5 000 <span className="text-[1.1rem] text-white/80">FCFA/mois</span></div>
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

function AfficheBoosts() {
  const tiers = [
    { n: "Standard", p: "1 500", d: "7 j", c: "#6366F1" },
    { n: "Premium", p: "3 500", d: "14 j", c: "#A5B4FC" },
    { n: "À la Une", p: "7 500", d: "30 j", c: "#FF2A6D" },
    { n: "VIP", p: "15 000", d: "60 j", c: "#FFC93C" },
  ];
  return (
    <Poster className="aspect-square bg-[#0B1120]">
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-[1.4rem]">🚀</span>
      </div>
      <h3 className="mt-3 font-display text-[1.7rem] font-black leading-tight text-white">Boostez votre visibilité</h3>
      <div className="mt-auto grid grid-cols-2 gap-2.5">
        {tiers.map((t) => (
          <div key={t.n} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[.74rem] font-bold" style={{ color: t.c }}>{t.n}</div>
            <div className="font-display text-[1.15rem] font-extrabold text-white leading-none mt-1">{t.p}<span className="text-[.6rem] text-white/60"> FCFA</span></div>
            <div className="text-[.62rem] text-white/50 mt-0.5">{t.d}</div>
          </div>
        ))}
      </div>
      <Footer />
    </Poster>
  );
}

function AfficheIA() {
  return (
    <Poster className="aspect-square bg-[radial-gradient(at_50%_0%,rgba(99,102,241,0.35)_0,transparent_55%)] bg-[#0B1120]">
      <div className="flex items-center justify-between">
        <Logo />
        <span className="rounded-full bg-[#6366F1]/20 px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-wider text-[#A5B4FC]">IA</span>
      </div>
      <div className="mt-auto">
        <div className="mb-2 text-[2rem]">✨</div>
        <h3 className="font-display text-[1.95rem] font-black leading-[1.05] text-white">
          L'IA rédige votre annonce <span className="text-[#6366F1]">pour vous</span>
        </h3>
        <p className="mt-3 text-[.88rem] text-white/80">Titre, description et caractéristiques générés automatiquement. Vous gagnez du temps, vous vendez plus vite.</p>
      </div>
      <Footer />
    </Poster>
  );
}

function AfficheConfiance() {
  return (
    <Poster className="aspect-square bg-[radial-gradient(at_85%_85%,rgba(16,185,129,0.25)_0,transparent_50%)] bg-[#0B1120]">
      <div className="flex items-center justify-between">
        <Logo />
        <span className="rounded-full bg-[#10B981]/15 px-2.5 py-1 text-[.6rem] font-bold uppercase tracking-wider text-[#10B981]">Sécurisé</span>
      </div>
      <div className="mt-auto">
        <div className="mb-2 text-[2rem]">✅</div>
        <h3 className="font-display text-[1.95rem] font-black leading-[1.05] text-white">
          Achetez en <span className="text-[#10B981]">toute confiance</span>
        </h3>
        <ul className="mt-4 space-y-1.5 text-[.84rem] text-white/85">
          <li>🔒 Connexion sécurisée</li>
          <li>✅ Vendeurs vérifiés</li>
          <li>📱 Paiement Wave · Orange Money · MTN</li>
        </ul>
      </div>
      <Footer />
    </Poster>
  );
}

/* ───────────────────────── AFFICHES PORTRAIT (A4) ───────────────────────── */

function AffichePortrait() {
  return (
    <Poster className="aspect-[1/1.414] bg-[radial-gradient(at_20%_10%,rgba(99,102,241,0.35)_0,transparent_45%),radial-gradient(at_80%_90%,rgba(245,201,60,0.2)_0,transparent_45%)] bg-[#0B1120]">
      <div className="flex items-center justify-between">
        <Logo className="h-11" />
        <span className="rounded-full bg-[#10B981]/15 px-3 py-1 text-[.66rem] font-bold uppercase tracking-wider text-[#10B981]">Gratuit</span>
      </div>
      <div className="my-auto">
        <h3 className="font-display text-[2.6rem] font-black leading-[1.02] text-white">Vendez en un clic.<br /><span className="text-[#FFC93C]">Achetez en direct !</span></h3>
        <p className="mt-4 text-[1rem] text-white/70">La 1ʳᵉ plateforme de petites annonces premium d'Afrique de l'Ouest — 27 pays.</p>
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
        <Logo className="h-11" />
        <span className="rounded-full bg-[#FFC93C]/15 px-3 py-1 text-[.66rem] font-bold uppercase tracking-wider text-[#FFC93C]">Professionnels</span>
      </div>
      <div className="my-auto">
        <h3 className="font-display text-[2.3rem] font-black leading-[1.05] text-white">Propulsez votre commerce</h3>
        <p className="mt-3 text-[.98rem] text-white/75">Créez votre boutique en ligne certifiée à partir de <b className="text-[#FFC93C]">5 000 FCFA/mois</b>.</p>
        <ul className="mt-6 space-y-2.5 text-[.96rem] text-white/90">
          <li>🏪 Vitrine web référencée sur Google</li>
          <li>🤖 Produits diffusés sur Telegram & Facebook</li>
          <li>📈 Jusqu'à 120 annonces actives</li>
          <li>💬 Bouton WhatsApp sur chaque produit</li>
          <li>✅ Badge « Boutique Vérifiée »</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-2 text-[.74rem]">
          <Pill>Orange Money</Pill><Pill>Wave</Pill><Pill>MTN MoMo</Pill><Pill>Carte</Pill>
        </div>
      </div>
      <FooterBig />
    </Poster>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function Poster({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative flex flex-col overflow-hidden rounded-[20px] border border-white/10 p-6 shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[.72rem] font-semibold text-white/85">{children}</span>;
}

function Footer() {
  return (
    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
      <span className="text-[.78rem] font-bold text-white">{SITE}</span>
      <span className="text-[.66rem] text-white/50">Achetez · Vendez · Trouvez</span>
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
