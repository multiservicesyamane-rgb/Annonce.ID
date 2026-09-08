"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants";

/* eslint-disable @next/next/no-img-element */
function LogoDark({ className = "h-9" }: { className?: string }) {
  return (
    <img
      src="/logo-dark.png"
      alt="Wanteermako"
      className={`${className} w-auto object-contain drop-shadow-[0_2px_14px_rgba(99,102,241,0.35)]`}
    />
  );
}

// Les 3 affiches portrait 4:5 officielles du kit
const POSTERS_PORTRAIT = [
  {
    id: "carriere-ia",
    titre: "Affiche Carrière : Boostez Votre CV avec l'IA",
    type: "Format Portrait 4:5 (Flyer A4 / Statut WhatsApp / Story)",
    src: "/partenaires/affiche-carriere-ia-pro.jpg",
    accent: "#8B5CF6",
    badge: "PÔLE CARRIÈRE",
    desc: "Pour attirer étudiants, chercheurs d'emploi et professionnels qui souhaitent un CV & lettre de motivation conformes aux recruteurs.",
    dimensions: "1080 x 1350 px · HD",
    targetAudience: "Étudiants, Diplômés, Cadres en recherche",
    suggestedPrice: "2 000 à 5 000 FCFA / CV",
  },
  {
    id: "pro-costume",
    titre: "Affiche Espace Pro : Devis & Factures en 2 Min (Gold Edition)",
    type: "Format Portrait 4:5 (Flyer A4 / Statut WhatsApp / Story)",
    src: "/partenaires/affiche-pro-homme-costume.jpg",
    accent: "#FFC93C",
    badge: "PÔLE ENTREPRISES",
    desc: "Mise en avant du service de devis et factures WhatsApp pour prestataires, artisans et commerçants.",
    dimensions: "1080 x 1350 px · HD",
    targetAudience: "Commerçants, Artisans, PME, Freelances",
    suggestedPrice: "10 000 à 30 000 FCFA / mois",
  },
  {
    id: "pro-nuit",
    titre: "Affiche Espace Pro : Devis & Facturation (City Night Edition)",
    type: "Format Portrait 4:5 (Flyer A4 / Statut WhatsApp / Story)",
    src: "/partenaires/affiche-pro-nuit-urbaine.jpg",
    accent: "#6366F1",
    badge: "PÔLE ENTREPRISES",
    desc: "Design moderne avec fond urbain nocturne pour promouvoir la gestion commerciale sans papier.",
    dimensions: "1080 x 1350 px · HD",
    targetAudience: "Boutiques en ligne, Prestataires de services",
    suggestedPrice: "15 000 FCFA / mois",
  },
];

// L'unique grande bannière 16:9 conservée
const BANNIERE_DUO = {
  id: "banniere-gold-indigo",
  titre: "Grande Bannière Duo : Accélérez Votre Réussite (Or & Indigo)",
  type: "Format Panoramique 16:9 (Facebook Cover / LinkedIn / Web)",
  src: "/partenaires/banniere-duo-or-indigo.jpg",
  accent: "#FFC93C",
  badge: "ÉCOSYSTÈME COMPLET",
  desc: "Présentation 50/50 des deux modules Espace Pro et Carrière. Idéal pour la photo de couverture Facebook et les bannières web.",
  dimensions: "1920 x 1080 px · Ultra HD",
  targetAudience: "Grand Public & Professionnels",
  suggestedPrice: "Offre Globale Agence",
};

// Planning hebdomadaire
const PLANNING_SEMAINE = [
  {
    jour: "Lundi",
    titre: "🚀 Boost Début de Semaine : Objectif Emploi & CV",
    affiche: "Affiche Carrière (CV IA)",
    canaux: "Statuts WhatsApp + Groupes Facebook Emploi / Étudiants",
    horaire: "07h30 - 09h00 (Au réveil dans les transports)",
    message: "« Nouvelle semaine, nouvelles opportunités ! Démarquez-vous des autres candidats avec un CV rédigé par l'IA et validé par les cabinets RH. Reçu en PDF en 10 minutes pour 3 000 FCFA. Écrivez-moi sur WhatsApp ! »",
  },
  {
    jour: "Mardi",
    titre: "💼 Digitalisation des Commerçants & Artisans",
    affiche: "Affiche Espace Pro (Gold Edition)",
    canaux: "Statuts WhatsApp + Groupes Commerçants & Marketplace",
    horaire: "12h30 - 14h00 (Pause déjeuner des entrepreneurs)",
    message: "« Artisans, prestataires, commerçants : arrêtez les devis sur papier brouillon ! Envoyez des devis et factures pro avec QR code sur WhatsApp en 1 clic. Configuration complète de votre espace pro disponible dès aujourd'hui. »",
  },
  {
    jour: "Mercredi",
    titre: "⭐ Preuve Sociale & Témoignage Client",
    affiche: "Affiche Carrière (CV IA) ou Bannière Duo",
    canaux: "Instagram + Statuts WhatsApp + LinkedIn",
    horaire: "18h30 - 20h00 (En fin de journée)",
    message: "« Déjà plusieurs CV rédigés cette semaine pour nos clients ! Vous aussi, optimisez vos chances de décrocher un entretien avant la fin du mois. Contactez notre agence partenaire agréée Wanteermako. »",
  },
  {
    jour: "Jeudi",
    titre: "🏢 Offre PME & Boutiques de Quartier",
    affiche: "Affiche Espace Pro (City Night)",
    canaux: "Groupes Facebook Locaux + Démarchage direct WhatsApp",
    horaire: "10h00 - 12h00",
    message: "« Offrez une image 100% professionnelle à votre commerce. Devis instantanés, suivi des paiements Wave & Orange Money sans intermédiaire. Répondez pour voir une démo gratuite de votre première facture ! »",
  },
  {
    jour: "Vendredi",
    titre: "📄 Pack Candidature du Week-end",
    affiche: "Affiche Carrière (CV IA)",
    canaux: "Statuts WhatsApp + TikTok / Instagram Reels",
    horaire: "17h00 - 19h00",
    message: "« Préparez vos dossiers de candidature pour lundi matin ! Pack complet : CV Moderne A4 + Lettre de motivation ciblée + Demande officielle. Places limitées pour ce week-end, réservez votre créneau maintenant. »",
  },
  {
    jour: "Samedi",
    titre: "🏪 Présentation Globale de Votre Agence",
    affiche: "Grande Bannière Duo (Or & Indigo)",
    canaux: "Facebook (Publication & Story) + Statuts WhatsApp",
    horaire: "11h00 - 15h00",
    message: "« Nous sommes Partenaire Officiel Wanteermako. Nous accompagnons les candidats vers l'emploi et les entreprises vers la numérisation. Tous nos services disponibles 7j/7 via WhatsApp. »",
  },
  {
    jour: "Dimanche",
    titre: "🎯 Préparation & Réservation pour la Semaine",
    affiche: "Grande Bannière Duo (Dark Fintech)",
    canaux: "Statuts WhatsApp (Rappel doux)",
    horaire: "20h00 - 22h00",
    message: "« Prêt à démarrer une semaine productive ? Commandez votre devis pro ou votre CV ce soir pour le recevoir dès demain matin 8h00 dans votre boîte mail ou WhatsApp. »",
  },
];

export default function PartenairesLandingPage() {
  const [periode, setPeriode] = useState<"mensuel" | "annuel">("mensuel");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [tabJour, setTabJour] = useState(0);

  // Simulateur de revenus
  const [nbCv, setNbCv] = useState(25);
  const [prixCv, setPrixCv] = useState(3000);
  const [nbPros, setNbPros] = useState(8);
  const [prixPro, setPrixPro] = useState(15000);
  const [nbAnnonces, setNbAnnonces] = useState(15);
  const [prixAnnonce, setPrixAnnonce] = useState(2500);

  const gainCv = nbCv * prixCv;
  const gainPros = nbPros * prixPro;
  const gainAnnonces = nbAnnonces * prixAnnonce;
  const totalMensuel = gainCv + gainPros + gainAnnonces;

  const makeWaLink = (planName: string, prix: string) => {
    const text = encodeURIComponent(
      `Bonjour Wanteermako ! Je souhaite souscrire au "${planName}" (${prix}) et activer mon profil Partenaire Officiel pour lancer mon agence locale.`
    );
    return `https://wa.me/221770000000?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-[#070C18] text-white">
      {/* Halo lumineux */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(at_15%_0%,rgba(99,102,241,0.22)_0,transparent_45%),radial-gradient(at_85%_100%,rgba(245,201,60,0.15)_0,transparent_45%)]" />

      {/* ══════════════════════════════════════════════════════════
          1. HERO HEADER
         ══════════════════════════════════════════════════════════ */}
      <header className="relative border-b border-white/10 py-14 text-center">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-6 flex justify-center">
            <LogoDark className="h-12 sm:h-16" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC93C]/40 bg-[#FFC93C]/10 px-4 py-1.5 text-[.75rem] font-bold uppercase tracking-wider text-[#FFC93C] backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#FFC93C] animate-pulse" />
            Programme Partenaires & Agences Locales
          </div>

          <h1 className="mt-5 font-display text-[2.2rem] font-black leading-[1.1] sm:text-[3.4rem]">
            Lancez Votre Propre Agence Digitale <br />
            <span className="bg-gradient-to-r from-[#FFC93C] via-[#F5A623] to-[#818CF8] bg-clip-text text-transparent">
              en Devenant Partenaire Wanteermako
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-[1.05rem] leading-relaxed text-white/75 sm:text-[1.15rem]">
            Aidez les chercheurs d'emploi avec des <b className="text-white">CV optimisés par l'IA</b> et les commerçants locaux avec des <b className="text-white">Devis & Factures WhatsApp</b>. Encaissez entre <b className="text-[#FFC93C]">300 000 et 1 000 000 FCFA / mois</b> de marge nette.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#plans-partenaire"
              className="rounded-xl bg-gradient-to-r from-[#FFC93C] to-[#F5A623] px-7 py-3.5 text-[.92rem] font-black text-[#0B1120] shadow-xl shadow-amber-500/20 transition hover:scale-105"
            >
              👑 Découvrir les Plans Partenaires →
            </a>
            <Link
              href="/partenaires/dashboard"
              className="rounded-xl border border-[#10B981]/50 bg-[#10B981]/15 px-6 py-3.5 text-[.92rem] font-bold text-[#10B981] backdrop-blur transition hover:bg-[#10B981]/25"
            >
              🚀 Accéder à l'Espace Dashboard Partenaire
            </Link>
            <a
              href="#kit-affiches"
              className="rounded-xl border border-white/20 bg-white/[0.06] px-6 py-3.5 text-[.92rem] font-bold text-white backdrop-blur transition hover:bg-white/10"
            >
              🖼️ Voir le Kit d'Affiches Fourni
            </a>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-[1320px] px-4 py-12">
        {/* ══════════════════════════════════════════════════════════
            2. LES 3 SOURCES DE REVENUS DU PARTENAIRE
           ══════════════════════════════════════════════════════════ */}
        <section className="mb-24">
          <div className="text-center">
            <span className="text-[.75rem] font-black uppercase tracking-widest text-[#6366F1]">
              Votre Modèle Économique
            </span>
            <h2 className="mt-1 font-display text-[1.9rem] font-extrabold sm:text-[2.6rem]">
              3 Pôles Rentables à Vendre dans Votre Ville
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-[.9rem] text-white/65">
              Wanteermako fournit la technologie en marque blanche, vous fixez vos propres prix et gardez 100% de la marge.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Pôle 1 : Carrière */}
            <div className="flex flex-col rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-b from-[#8B5CF6]/15 to-white/[0.02] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B5CF6]/25 text-[1.6rem]">
                  🧠
                </span>
                <span className="rounded-full bg-[#8B5CF6]/20 px-3 py-1 text-[.65rem] font-black text-[#A5B4FC]">
                  PÔLE CARRIÈRE
                </span>
              </div>
              <h3 className="mt-4 font-display text-[1.35rem] font-bold text-white">
                Création de CV & Lettres IA
              </h3>
              <p className="mt-2 text-[.85rem] leading-relaxed text-white/70">
                Générez des CV modernes A4 conformes aux exigences des cabinets RH en 3 minutes grâce à l'IA.
              </p>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-[.78rem]">
                <div className="flex justify-between text-white/60">
                  <span>Temps de création :</span>
                  <b className="text-white">3 minutes chrono</b>
                </div>
                <div className="mt-1.5 flex justify-between text-white/60">
                  <span>Prix moyen facturé :</span>
                  <b className="text-[#FFC93C]">2 000 à 5 000 FCFA / CV</b>
                </div>
              </div>
            </div>

            {/* Pôle 2 : Espace Pro */}
            <div className="flex flex-col rounded-2xl border border-[#FFC93C]/30 bg-gradient-to-b from-[#FFC93C]/15 to-white/[0.02] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFC93C]/25 text-[1.6rem]">
                  🧾
                </span>
                <span className="rounded-full bg-[#FFC93C]/20 px-3 py-1 text-[.65rem] font-black text-[#FFC93C]">
                  PÔLE ENTREPRISES
                </span>
              </div>
              <h3 className="mt-4 font-display text-[1.35rem] font-bold text-white">
                Devis & Factures WhatsApp
              </h3>
              <p className="mt-2 text-[.85rem] leading-relaxed text-white/70">
                Numérisez les artisans et commerçants de votre quartier en configurant leur gestion commerciale avec QR code.
              </p>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-[.78rem]">
                <div className="flex justify-between text-white/60">
                  <span>Temps de saisie :</span>
                  <b className="text-white">2 minutes par devis</b>
                </div>
                <div className="mt-1.5 flex justify-between text-white/60">
                  <span>Abonnement facturé :</span>
                  <b className="text-[#FFC93C]">10 000 à 30 000 FCFA / mois</b>
                </div>
              </div>
            </div>

            {/* Pôle 3 : Annonces & Boutiques */}
            <div className="flex flex-col rounded-2xl border border-[#10B981]/30 bg-gradient-to-b from-[#10B981]/15 to-white/[0.02] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/25 text-[1.6rem]">
                  🏪
                </span>
                <span className="rounded-full bg-[#10B981]/20 px-3 py-1 text-[.65rem] font-black text-[#10B981]">
                  PÔLE E-COMMERCE
                </span>
              </div>
              <h3 className="mt-4 font-display text-[1.35rem] font-bold text-white">
                Gestion d'Annonces & Boosts
              </h3>
              <p className="mt-2 text-[.85rem] leading-relaxed text-white/70">
                Mettez en ligne les catalogues de produits des commerçants sur Wanteermako et activez leurs options VIP.
              </p>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-[.78rem]">
                <div className="flex justify-between text-white/60">
                  <span>Rédaction IA :</span>
                  <b className="text-white">Automatique</b>
                </div>
                <div className="mt-1.5 flex justify-between text-white/60">
                  <span>Commission :</span>
                  <b className="text-[#FFC93C]">1 500 à 5 000 FCFA / produit</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            3. SECTION KIT MARKETING (LES 5 AFFICHES HD FOURNIES)
           ══════════════════════════════════════════════════════════ */}
        <section id="kit-affiches" className="mb-24 scroll-mt-10">
          <div className="text-center">
            <span className="rounded-full bg-[#FFC93C]/20 px-3.5 py-1 text-[.72rem] font-black uppercase tracking-wider text-[#FFC93C]">
              🖼️ LE KIT MARKETING INCLUS
            </span>
            <h2 className="mt-3 font-display text-[2rem] font-black sm:text-[2.8rem]">
              Affiches Officielles Fournies aux Partenaires
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-[.92rem] text-white/70">
              Voici les visuels haute définition que vous recevez. Depuis votre <b>Dashboard Partenaire</b>, vous pouvez inscrire votre numéro de téléphone et votre nom d'agence directement dessus en 1 clic !
            </p>

            <div className="mt-5">
              <Link
                href="/partenaires/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] px-6 py-3 text-[.88rem] font-black text-white shadow-xl transition hover:scale-105"
              >
                <span>🎨 Personnaliser avec Mon Numéro dans le Dashboard →</span>
              </Link>
            </div>
          </div>

          {/* Grille des 3 Affiches Portrait (4:5) */}
          <div className="mt-12">
            <h3 className="mb-4 flex items-center gap-2 text-[1.1rem] font-bold text-white">
              <span className="h-5 w-1.5 rounded-full bg-[#FFC93C]" />
              Affiches Portrait (Flyers A4 / Statuts WhatsApp / Stories Instagram)
            </h3>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {POSTERS_PORTRAIT.map((poster) => (
                <div
                  key={poster.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-2xl backdrop-blur transition hover:border-[#FFC93C]/60"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-black/60">
                    <img
                      src={poster.src}
                      alt={poster.titre}
                      className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <button
                      onClick={() => setZoomImage(poster.src)}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white opacity-0 shadow backdrop-blur transition group-hover:opacity-100 hover:bg-black"
                      title="Agrandir"
                    >
                      🔍
                    </button>
                    <span
                      className="absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[.6rem] font-black uppercase text-white shadow-lg"
                      style={{ background: poster.accent }}
                    >
                      {poster.badge}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-1 flex-col justify-between">
                    <div>
                      <h4 className="font-display text-[1.05rem] font-bold text-white leading-snug">
                        {poster.titre}
                      </h4>
                      <p className="mt-1 text-[.76rem] text-white/60 leading-relaxed">
                        {poster.desc}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="text-[.68rem] text-white/50">{poster.dimensions}</span>
                      <Link
                        href="/partenaires/dashboard"
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-[.72rem] font-bold text-white hover:bg-[#FFC93C] hover:text-[#0B1120] transition"
                      >
                        Personnaliser ✏️
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unique Grande Bannière Duo 16:9 Panoramique */}
          <div className="mt-14">
            <h3 className="mb-4 flex items-center gap-2 text-[1.1rem] font-bold text-white">
              <span className="h-5 w-1.5 rounded-full bg-[#6366F1]" />
              Grande Bannière Panoramique 16:9 (Facebook Cover / LinkedIn / Web)
            </h3>

            <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04] p-5 shadow-2xl backdrop-blur transition hover:border-[#6366F1]">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black/60">
                <img
                  src={BANNIERE_DUO.src}
                  alt={BANNIERE_DUO.titre}
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-102"
                />
                <button
                  onClick={() => setZoomImage(BANNIERE_DUO.src)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white opacity-0 shadow backdrop-blur transition group-hover:opacity-100 hover:bg-black"
                  title="Agrandir"
                >
                  🔍
                </button>
                <span
                  className="absolute bottom-4 left-4 rounded-full px-3 py-1 text-[.65rem] font-black uppercase text-[#0B1120] shadow-lg"
                  style={{ background: BANNIERE_DUO.accent }}
                >
                  {BANNIERE_DUO.badge}
                </span>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h4 className="font-display text-[1.2rem] font-bold text-white">
                    {BANNIERE_DUO.titre}
                  </h4>
                  <p className="text-[.8rem] text-white/65">
                    {BANNIERE_DUO.desc} · <span className="text-[#FFC93C]">{BANNIERE_DUO.dimensions}</span>
                  </p>
                </div>
                <Link
                  href="/partenaires/dashboard"
                  className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] px-5 py-2.5 text-[.82rem] font-bold text-white shadow transition hover:scale-105"
                >
                  Personnaliser la Bannière ✏️
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            4. PLANNING DE PUBLICATION RÉSEAUX SOCIAUX 7J/7
           ══════════════════════════════════════════════════════════ */}
        <section id="planning-reseaux" className="mb-24 scroll-mt-10">
          <div className="text-center">
            <span className="rounded-full bg-[#6366F1]/20 px-3.5 py-1 text-[.72rem] font-black uppercase tracking-wider text-[#A5B4FC]">
              📅 GUIDE QUOTIDIEN DE PUBLICATION
            </span>
            <h2 className="mt-3 font-display text-[2rem] font-black sm:text-[2.8rem]">
              Où et Quand Publier Vos Affiches Chaque Jour
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-[.9rem] text-white/70">
              Suivez ce planning stratégique pour Facebook, Instagram, TikTok et WhatsApp afin d'obtenir un flux continu de clients.
            </p>
          </div>

          {/* Onglets des jours */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {PLANNING_SEMAINE.map((p, index) => (
              <button
                key={p.jour}
                onClick={() => setTabJour(index)}
                className={`rounded-xl px-4 py-2 text-[.82rem] font-bold transition ${
                  tabJour === index
                    ? "bg-[#FFC93C] text-[#0B1120] shadow-lg shadow-amber-500/20"
                    : "border border-white/15 bg-white/[0.04] text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {p.jour}
              </button>
            ))}
          </div>

          {/* Fiche détaillée */}
          <div className="mt-6 rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.05] to-black/40 p-6 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
              <div>
                <span className="text-[.75rem] font-bold uppercase tracking-wider text-[#FFC93C]">
                  {PLANNING_SEMAINE[tabJour].jour} · Stratégie Quotidienne
                </span>
                <h3 className="mt-1 font-display text-[1.5rem] font-black text-white sm:text-[1.8rem]">
                  {PLANNING_SEMAINE[tabJour].titre}
                </h3>
              </div>
              <span className="rounded-full bg-[#6366F1]/20 px-3.5 py-1.5 text-[.75rem] font-bold text-[#A5B4FC] border border-[#6366F1]/40">
                ⏰ Horaire Idéal : {PLANNING_SEMAINE[tabJour].horaire}
              </span>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <span className="text-[.7rem] font-bold uppercase text-white/50">Affiche Recommandée</span>
                <div className="mt-1.5 font-bold text-white text-[.95rem]">
                  {PLANNING_SEMAINE[tabJour].affiche}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <span className="text-[.7rem] font-bold uppercase text-white/50">Canaux de Diffusion</span>
                <div className="mt-1.5 font-bold text-[#FFC93C] text-[.95rem]">
                  {PLANNING_SEMAINE[tabJour].canaux}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <span className="text-[.7rem] font-bold uppercase text-white/50">Action Recommandée</span>
                <div className="mt-1.5 font-bold text-[#10B981] text-[.95rem]">
                  Publier l'affiche avec vos coordonnées
                </div>
              </div>
            </div>

            {/* Texte prêt à copier */}
            <div className="mt-6 rounded-2xl border border-[#FFC93C]/30 bg-black/50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[.75rem] font-bold uppercase tracking-wider text-[#FFC93C]">
                  📋 Texte Prêt à Copier-Coller :
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(PLANNING_SEMAINE[tabJour].message);
                    alert("Texte copié !");
                  }}
                  className="rounded-lg bg-white/10 px-3 py-1 text-[.72rem] font-bold text-white hover:bg-white/20"
                >
                  Copier le Texte 📄
                </button>
              </div>
              <p className="mt-3 font-mono text-[.85rem] leading-relaxed text-white/90">
                {PLANNING_SEMAINE[tabJour].message}
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            5. CHECKLIST CONFIGURATION DU PROFIL PRO
           ══════════════════════════════════════════════════════════ */}
        <section id="guide-pro" className="mb-24 scroll-mt-10">
          <div className="text-center">
            <span className="rounded-full bg-[#10B981]/20 px-3.5 py-1 text-[.72rem] font-black uppercase tracking-wider text-[#10B981]">
              💼 CONFIGURATION DE VOTRE PROFIL PRO
            </span>
            <h2 className="mt-3 font-display text-[2rem] font-black sm:text-[2.8rem]">
              Comment Préparer Votre Activité Pro
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-[.9rem] text-white/70">
              4 étapes indispensables pour inspirer confiance et encaisser sans friction.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                num: "01",
                icon: "📱",
                titre: "WhatsApp Business Pro",
                desc: "Définissez votre nom d'agence commerciale, photo de profil nette et message de bienvenue automatique.",
              },
              {
                num: "02",
                icon: "🧾",
                titre: "Catalogue de Prix WhatsApp",
                desc: "Ajoutez vos 2 offres : 'Création de CV IA (3 000 F)' et 'Gestion Devis/Factures Entreprise (15 000 F/m)'.",
              },
              {
                num: "03",
                icon: "💳",
                titre: "Comptes Wave & OM Prêts",
                desc: "Paramétrez vos comptes Mobile Money pour pouvoir envoyer votre lien de paiement instantanément.",
              },
              {
                num: "04",
                icon: "📁",
                titre: "Dossier de Suivi Clients",
                desc: "Classez les PDF de CV et devis délivrés pour fidéliser et renouveler les abonnements chaque mois.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[2rem]">{step.icon}</span>
                  <span className="font-display text-[1.6rem] font-black text-white/20">
                    {step.num}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-[1.15rem] font-bold text-white">
                  {step.titre}
                </h3>
                <p className="mt-2 text-[.82rem] leading-relaxed text-white/65">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            6. GRILLE TARIFAIRE DES PLANS PARTENAIRES
           ══════════════════════════════════════════════════════════ */}
        <section id="plans-partenaire" className="mb-24 scroll-mt-10">
          <div className="text-center">
            <span className="rounded-full bg-[#FFC93C]/20 px-3.5 py-1 text-[.72rem] font-black uppercase tracking-wider text-[#FFC93C]">
              👑 TARIFS & FORMULES D'ADHÉSION
            </span>
            <h2 className="mt-3 font-display text-[2rem] font-black sm:text-[2.8rem]">
              Choisissez Votre Formule & Activez Votre Compte
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-[.92rem] text-white/70">
              Paiement direct sécurisé par Mobile Money (Wave, Orange Money, MTN, Moov) ou via WhatsApp.
            </p>

            {/* Toggle Mensuel / Annuel */}
            <div className="mt-6 inline-flex items-center rounded-xl border border-white/15 bg-white/[0.04] p-1 backdrop-blur">
              <button
                onClick={() => setPeriode("mensuel")}
                className={`rounded-lg px-4 py-1.5 text-[.8rem] font-bold transition ${
                  periode === "mensuel"
                    ? "bg-[#FFC93C] text-[#0B1120] shadow"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Paiement Mensuel
              </button>
              <button
                onClick={() => setPeriode("annuel")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[.8rem] font-bold transition ${
                  periode === "annuel"
                    ? "bg-[#FFC93C] text-[#0B1120] shadow"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Paiement Annuel
                <span className="rounded bg-[#10B981] px-1.5 py-0.5 text-[.6rem] font-black text-white">
                  -25%
                </span>
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {/* Plan 1 : Starter */}
            <div className="flex flex-col rounded-3xl border border-white/15 bg-white/[0.03] p-7 shadow-xl backdrop-blur transition hover:border-white/30">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[.68rem] font-bold uppercase tracking-wider text-white/80">
                  🌱 STARTER PARTENAIRE
                </span>
              </div>
              <h3 className="mt-4 font-display text-[1.5rem] font-black text-white">
                Pour Démarrer en Douceur
              </h3>
              <p className="mt-1 text-[.8rem] text-white/60">Idéal pour étudiants et freelances débutants.</p>

              <div className="my-6 border-y border-white/10 py-5">
                <div className="font-display text-[2.4rem] font-black text-white">
                  {periode === "mensuel" ? "10 000" : "80 000"}{" "}
                  <span className="text-[1rem] font-bold text-white/60">
                    FCFA / {periode === "mensuel" ? "mois" : "an"}
                  </span>
                </div>
                <div className="mt-1 text-[.72rem] text-[#10B981] font-semibold">
                  ✓ Rentable dès 3 CV vendus à 3 500 F
                </div>
              </div>

              <ul className="flex-1 space-y-3 text-[.82rem] text-white/85">
                <li className="flex items-center gap-2">✓ <b>50 CV & Lettres IA</b> par mois</li>
                <li className="flex items-center gap-2">✓ <b>20 Entreprises</b> Devis & Factures</li>
                <li className="flex items-center gap-2">✓ <b>Export PDF A4 HD</b> certifié avec QR Code</li>
                <li className="flex items-center gap-2">✓ <b>Accès Dashboard Partenaire & Studio Affiches</b></li>
                <li className="flex items-center gap-2 text-white/40">✕ Accès illimité débridé</li>
              </ul>

              <a
                href={makeWaLink(
                  "Starter Partenaire",
                  periode === "mensuel" ? "10 000 FCFA/mois" : "80 000 FCFA/an"
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-8 block w-full rounded-xl border border-white/20 bg-white/10 py-3.5 text-center text-[.88rem] font-bold text-white transition hover:bg-white/20"
              >
                Prendre le Plan Starter →
              </a>
            </div>

            {/* Plan 2 : Agence Pro (STAR) */}
            <div className="relative flex flex-col rounded-3xl border-2 border-[#FFC93C] bg-gradient-to-b from-[#FFC93C]/15 via-[#0B1120] to-[#070C18] p-7 shadow-2xl shadow-amber-500/10 lg:-translate-y-3">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FFC93C] to-[#F5A623] px-4 py-1 text-[.68rem] font-black uppercase text-[#0B1120] shadow-md">
                ⭐ FORMULE LA PLUS RENTABLE
              </span>

              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#FFC93C]/20 px-3 py-1 text-[.68rem] font-black uppercase tracking-wider text-[#FFC93C]">
                  👑 AGENCE PARTENAIRE PRO
                </span>
              </div>
              <h3 className="mt-4 font-display text-[1.5rem] font-black text-white">
                Pack Illimité Sans Limite
              </h3>
              <p className="mt-1 text-[.8rem] text-white/70">
                Pour lancer une véritable agence de services digitaux.
              </p>

              <div className="my-6 border-y border-white/10 py-5">
                <div className="font-display text-[2.6rem] font-black text-[#FFC93C]">
                  {periode === "mensuel" ? "25 000" : "200 000"}{" "}
                  <span className="text-[1rem] font-bold text-white/60">
                    FCFA / {periode === "mensuel" ? "mois" : "an"}
                  </span>
                </div>
                <div className="mt-1 text-[.72rem] text-[#10B981] font-semibold">
                  ✓ Potentiel de 300 000 à 1 000 000 FCFA/mois de gains
                </div>
              </div>

              <ul className="flex-1 space-y-3 text-[.82rem] text-white/90">
                <li className="flex items-center gap-2">✓ <b className="text-[#FFC93C]">Générateur CV & Lettres IA ILLIMITÉ</b></li>
                <li className="flex items-center gap-2">✓ <b className="text-[#FFC93C]">Devis & Factures WhatsApp ILLIMITÉS</b></li>
                <li className="flex items-center gap-2">✓ <b>Gestion Multi-Comptes Clients</b></li>
                <li className="flex items-center gap-2">✓ <b>Badge Partenaire Certifié Wanteermako</b></li>
                <li className="flex items-center gap-2">✓ <b>Studio Affiches Personnalisées avec votre numéro</b></li>
                <li className="flex items-center gap-2">✓ <b>Support VIP WhatsApp 7j/7 dédié</b></li>
              </ul>

              <a
                href={makeWaLink(
                  "Agence Partenaire Pro",
                  periode === "mensuel" ? "25 000 FCFA/mois" : "200 000 FCFA/an"
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-8 block w-full rounded-xl bg-gradient-to-r from-[#FFC93C] to-[#F5A623] py-4 text-center text-[.92rem] font-black text-[#0B1120] shadow-xl transition hover:scale-105"
              >
                👑 ACTIVER MON ACCÈS PRO ILLIMITÉ →
              </a>
            </div>

            {/* Plan 3 : Pack Grossiste */}
            <div className="flex flex-col rounded-3xl border border-white/15 bg-white/[0.03] p-7 shadow-xl backdrop-blur transition hover:border-white/30">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[.68rem] font-bold uppercase tracking-wider text-white/80">
                  🎟️ SANS ABONNEMENT
                </span>
              </div>
              <h3 className="mt-4 font-display text-[1.5rem] font-black text-white">
                Pack Grossiste Crédits
              </h3>
              <p className="mt-1 text-[.8rem] text-white/60">
                Achetez des crédits à prix réduit et utilisez quand vous voulez.
              </p>

              <div className="my-6 border-y border-white/10 py-5">
                <div className="font-display text-[2.4rem] font-black text-white">
                  5 000 <span className="text-[1rem] font-bold text-white/60">FCFA</span>
                </div>
                <div className="mt-1 text-[.72rem] text-[#10B981] font-semibold">
                  10 Crédits (soit 500 F / document)
                </div>
              </div>

              <ul className="flex-1 space-y-3 text-[.82rem] text-white/85">
                <li className="flex items-center gap-2">✓ <b>10 Crédits</b> au choix (CV IA ou Devis/Facture)</li>
                <li className="flex items-center gap-2">✓ Revente conseillée : <b>3 000 FCFA / doc</b></li>
                <li className="flex items-center gap-2">✓ <b>2 500 FCFA de marge nette</b> par vente</li>
                <li className="flex items-center gap-2">✓ Crédits valables à vie sans expiration</li>
                <li className="flex items-center gap-2">✓ Zéro prélèvement automatique</li>
              </ul>

              <a
                href={makeWaLink("Pack Grossiste 10 Crédits", "5 000 FCFA")}
                target="_blank"
                rel="noreferrer"
                className="mt-8 block w-full rounded-xl border border-white/20 bg-white/10 py-3.5 text-center text-[.88rem] font-bold text-white transition hover:bg-white/20"
              >
                Acheter 10 Crédits (5 000 F) →
              </a>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            7. CALCULATEUR DE REVENUS
           ══════════════════════════════════════════════════════════ */}
        <section id="calculateur" className="mb-24 rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-black/40 p-6 backdrop-blur-xl sm:p-10">
          <div className="flex flex-col items-center justify-between gap-6 border-b border-white/10 pb-8 lg:flex-row">
            <div>
              <span className="rounded-full bg-[#6366F1]/20 px-3 py-1 text-[.7rem] font-bold uppercase tracking-wider text-[#A5B4FC]">
                📊 Simulateur de Gains
              </span>
              <h2 className="mt-2 font-display text-[1.8rem] font-black sm:text-[2.4rem]">
                Combien Allez-Vous Gagner ?
              </h2>
              <p className="mt-1 text-[.88rem] text-white/65">
                Ajustez le volume de clients par mois pour voir votre chiffre d'affaires.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-[#FFC93C]/40 bg-[#FFC93C]/10 px-8 py-5 text-center shadow-xl">
              <span className="text-[.75rem] font-bold uppercase tracking-wider text-white/70">
                Revenu Mensuel Estimé :
              </span>
              <span className="mt-1 font-display text-[2.4rem] font-black text-[#FFC93C] sm:text-[3rem]">
                {totalMensuel.toLocaleString("fr-FR")}{" "}
                <span className="text-[1.2rem]">FCFA</span>
              </span>
              <span className="text-[.68rem] text-[#10B981] font-semibold">
                ✓ 100% de la marge conservée par vous
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex justify-between font-bold">
                <span className="text-[.9rem] text-white">📄 CV & Candidatures</span>
                <span className="text-[#A5B4FC]">{nbCv} CV / mois</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={nbCv}
                onChange={(e) => setNbCv(Number(e.target.value))}
                className="mt-3 w-full accent-[#8B5CF6]"
              />
              <div className="mt-3 flex items-center justify-between text-[.75rem] text-white/60">
                <span>Prix facturé :</span>
                <span className="font-bold text-white">{prixCv.toLocaleString()} FCFA</span>
              </div>
              <div className="mt-2 text-right text-[.85rem] font-black text-[#8B5CF6]">
                Gain : {gainCv.toLocaleString()} FCFA
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex justify-between font-bold">
                <span className="text-[.9rem] text-white">🧾 Commerçants / Devis</span>
                <span className="text-[#FFC93C]">{nbPros} clients</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={nbPros}
                onChange={(e) => setNbPros(Number(e.target.value))}
                className="mt-3 w-full accent-[#FFC93C]"
              />
              <div className="mt-3 flex items-center justify-between text-[.75rem] text-white/60">
                <span>Tarif abonnement :</span>
                <span className="font-bold text-white">{prixPro.toLocaleString()} FCFA/m</span>
              </div>
              <div className="mt-2 text-right text-[.85rem] font-black text-[#FFC93C]">
                Gain : {gainPros.toLocaleString()} FCFA
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex justify-between font-bold">
                <span className="text-[.9rem] text-white">🚀 Annonces / Boosts</span>
                <span className="text-[#10B981]">{nbAnnonces} produits</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={nbAnnonces}
                onChange={(e) => setNbAnnonces(Number(e.target.value))}
                className="mt-3 w-full accent-[#10B981]"
              />
              <div className="mt-3 flex items-center justify-between text-[.75rem] text-white/60">
                <span>Commission / annonce :</span>
                <span className="font-bold text-white">{prixAnnonce.toLocaleString()} FCFA</span>
              </div>
              <div className="mt-2 text-right text-[.85rem] font-black text-[#10B981]">
                Gain : {gainAnnonces.toLocaleString()} FCFA
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            8. CALL TO ACTION FINAL
           ══════════════════════════════════════════════════════════ */}
        <section className="rounded-3xl border border-[#FFC93C]/40 bg-gradient-to-r from-[#6366F1] via-[#4F46E5] to-[#FFC93C] p-[1px] shadow-2xl">
          <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-[#070C18] p-8 text-center sm:p-12 sm:text-left md:flex-row">
            <div>
              <span className="rounded-full bg-[#10B981]/20 px-3 py-1 text-[.7rem] font-bold text-[#10B981]">
                🚀 ESPACE PARTENAIRE OUVERT
              </span>
              <h3 className="mt-3 font-display text-[1.8rem] font-black text-white sm:text-[2.2rem]">
                Prêt à Développer Votre Agence Locale ?
              </h3>
              <p className="mt-1 max-w-xl text-[.9rem] text-white/75">
                Rejoignez le réseau des partenaires officiels Wanteermako et accédez immédiatement à votre studio d'affiches personnalisées et à vos générateurs IA.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#plans-partenaire"
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FFC93C] to-[#F5A623] px-7 py-4 text-[.95rem] font-black text-[#0B1120] shadow-2xl transition hover:scale-105"
              >
                <span>VOIR LES PLANS 🚀</span>
              </a>
              <Link
                href="/partenaires/dashboard"
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-[.95rem] font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                <span>ACCÉDER AU DASHBOARD →</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Lightbox Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-white/20">
            <img
              src={zoomImage}
              alt="Affiche agrandie"
              className="h-auto max-h-[85vh] w-auto object-contain"
            />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/80 text-white font-bold hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
