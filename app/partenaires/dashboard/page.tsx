"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants";

type Partenaire = {
  code: string;
  statut: "candidat" | "actif" | "suspendu";
  agence: string;
  ville: string;
  telephone: string;
  points: number;
  plan: string | null;
  /** Jusqu'a quand l'abonnement court. Null tant qu'aucun n'a ete paye. */
  expire_at: string | null;
};

/** Appel de /api/partenaires, avec le message d'erreur deja extrait. */
async function appel(payload: Record<string, unknown>) {
  const res = await fetch("/api/partenaires", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Le lien a partager, tel que le partenaire le colle dans WhatsApp.
 *
 * Construit sur l'origine REELLE du navigateur : en developpement le lien
 * doit pointer sur localhost, sinon on teste un parrainage en cliquant vers
 * la production. Le domaine de marque sert de repli au premier rendu serveur.
 */
function lienParrainage(code: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : `https://${BRAND.domain}`;
  return `${base}/?ref=${code}`;
}

/** Ce que dit la pastille d'etat, selon la situation reelle du compte. */
const ETATS: Record<string, { texte: string; couleur: string }> = {
  candidat: { texte: "● Candidature enregistree", couleur: "#FFC93C" },
  actif: { texte: "● Partenaire actif", couleur: "#10B981" },
  suspendu: { texte: "● Compte suspendu", couleur: "#FF2A6D" },
};

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

// Les 3 affiches portrait 4:5 officielles
const POSTERS_PORTRAIT_STUDIO = [
  {
    id: "carriere-ia",
    titre: "Affiche Carrière : Boostez Votre CV avec l'IA",
    type: "Format Portrait 4:5 (Flyer A4 / Statut WhatsApp / Story)",
    src: "/partenaires/affiche-carriere-ia-pro.jpg",
    accent: "#8B5CF6",
    badge: "PÔLE CARRIÈRE",
    suggestedService: "Création CV IA (3 000 FCFA)",
  },
  {
    id: "pro-costume",
    titre: "Affiche Espace Pro : Devis & Factures en 2 Min (Gold Edition)",
    type: "Format Portrait 4:5 (Flyer A4 / Statut WhatsApp / Story)",
    src: "/partenaires/affiche-pro-homme-costume.jpg",
    accent: "#FFC93C",
    badge: "PÔLE ENTREPRISES",
    suggestedService: "Gestion Devis Pro (15 000 FCFA/m)",
  },
  {
    id: "pro-nuit",
    titre: "Affiche Espace Pro : Devis & Facturation (City Night)",
    type: "Format Portrait 4:5 (Flyer A4 / Statut WhatsApp / Story)",
    src: "/partenaires/affiche-pro-nuit-urbaine.jpg",
    accent: "#6366F1",
    badge: "PÔLE ENTREPRISES",
    suggestedService: "Numérisation Commerce",
  },
];

// L'unique grande bannière 16:9 conservée
const BANNIERE_DUO_STUDIO = {
  id: "banniere-gold-indigo",
  titre: "Grande Bannière Duo : Accélérez Votre Réussite (Or & Indigo)",
  type: "Format Panoramique 16:9 (Facebook Cover / LinkedIn / Web)",
  src: "/partenaires/banniere-duo-or-indigo.jpg",
  accent: "#FFC93C",
  badge: "ÉCOSYSTÈME COMPLET",
  suggestedService: "Bannière Officielle Agence & Facebook Cover",
};

export default function PartnerDashboardPage() {
  // Vides au depart, et c'est important : la version precedente les
  // pre-remplissait d'un faux numero et d'une fausse agence. Celui qui
  // telechargeait une affiche sans y toucher publiait un document portant le
  // telephone de quelqu'un d'autre.
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerAgency, setPartnerAgency] = useState("");
  const [partnerCity, setPartnerCity] = useState("");
  const [activeTab, setActiveTab] = useState<"studio" | "outils" | "scripts">("studio");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [partenaire, setPartenaire] = useState<Partenaire | null>(null);
  const [etat, setEtat] = useState<"chargement" | "nonConnecte" | "migration" | "pret">("chargement");
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const { ok, status, data } = await appel({ action: "get" });
    if (status === 401) return setEtat("nonConnecte");
    if (data?.needsMigration) return setEtat("migration");
    if (!ok) return setEtat("pret");
    if (data.partenaire) {
      const p = data.partenaire as Partenaire;
      setPartenaire(p);
      setPartnerAgency(p.agence || "");
      setPartnerCity(p.ville || "");
      setPartnerPhone(p.telephone || "");
    }
    setEtat("pret");
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function enregistrer() {
    if (!partnerAgency.trim()) {
      setMessage("Indiquez le nom de votre agence avant d'enregistrer.");
      return;
    }
    setEnregistrement(true);
    setMessage(null);
    const { ok, data } = await appel({
      action: "save",
      agence: partnerAgency,
      ville: partnerCity,
      telephone: partnerPhone,
    });
    setEnregistrement(false);
    if (!ok) return setMessage(data?.error || "Enregistrement impossible.");
    setPartenaire(data.partenaire as Partenaire);
    setMessage(data.nouveau ? "Bienvenue — votre code de parrainage est pret." : "Coordonnees enregistrees.");
  }

  // Téléchargement d'affiche personnalisée en Canvas HD
  async function telechargerAffichePersonnalisee(poster: {
    id: string;
    titre: string;
    src: string;
    isBanner?: boolean;
  }) {
    setDownloadingId(poster.id);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = poster.src;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (partnerPhone || partnerAgency) {
        const isBanner16_9 = poster.isBanner || poster.id.startsWith("banniere");
        const bannerHeight = Math.round(canvas.height * (isBanner16_9 ? 0.16 : 0.11));
        const bannerMargin = Math.round(canvas.width * 0.035);
        const bannerY = canvas.height - bannerHeight - Math.round(canvas.height * 0.02);
        const bannerWidth = canvas.width - bannerMargin * 2;
        const bannerRadius = Math.round(bannerHeight * 0.22);

        ctx.save();
        ctx.fillStyle = "rgba(7, 12, 24, 0.95)";
        ctx.strokeStyle = "#FFC93C";
        ctx.lineWidth = Math.max(4, Math.round(canvas.width * 0.003));

        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(bannerMargin, bannerY, bannerWidth, bannerHeight, bannerRadius);
        } else {
          ctx.rect(bannerMargin, bannerY, bannerWidth, bannerHeight);
        }
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const phoneFontSize = Math.round(bannerHeight * 0.35);
        ctx.font = `bold ${phoneFontSize}px sans-serif`;
        ctx.fillStyle = "#FFC93C";
        const phoneText = partnerPhone ? `📞 WhatsApp & Appel : ${partnerPhone}` : "📞 Contact Direct Disponible";
        ctx.fillText(phoneText, canvas.width / 2, bannerY + bannerHeight * 0.36);

        const agencyFontSize = Math.round(bannerHeight * 0.24);
        ctx.font = `600 ${agencyFontSize}px sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        const agencyText = partnerAgency
          ? `🏢 ${partnerAgency}${partnerCity ? " · " + partnerCity : ""} · Partenaire Agréé Wanteermako`
          : `🏢 Partenaire Officiel Agréé Wanteermako${partnerCity ? " · " + partnerCity : ""}`;
        ctx.fillText(agencyText, canvas.width / 2, bannerY + bannerHeight * 0.74);

        ctx.restore();
      }

      const a = document.createElement("a");
      a.download = `affiche-personnalisee-${poster.id}-${partnerAgency.replace(/\s+/g, "_")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch (e) {
      console.error("Erreur Canvas:", e);
      const a = document.createElement("a");
      a.download = `${poster.id}.jpg`;
      a.href = poster.src;
      a.click();
    } finally {
      setDownloadingId(null);
    }
  }

  /** Ecran plein, meme fond, pour les trois cas ou le tableau n'a rien a montrer. */
  const ecranSimple = (titre: string, texte: string, lien?: { href: string; libelle: string }) => (
    <div className="grid min-h-screen place-items-center bg-[#070C18] px-4 text-center text-white">
      <div className="max-w-md">
        <LogoDark className="mx-auto h-10" />
        <h1 className="mt-6 font-display text-[1.5rem] font-black">{titre}</h1>
        <p className="mt-2 text-[.9rem] leading-relaxed text-white/70">{texte}</p>
        {lien && (
          <Link
            href={lien.href}
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-[#FFC93C] to-[#F5A623] px-6 py-3 text-[.88rem] font-black text-[#0B1120] shadow-lg"
          >
            {lien.libelle}
          </Link>
        )}
      </div>
    </div>
  );

  if (etat === "chargement") {
    return <div className="grid min-h-screen place-items-center bg-[#070C18] text-white/50">Chargement…</div>;
  }
  if (etat === "nonConnecte") {
    return ecranSimple(
      "Connecte-toi pour ouvrir ton espace",
      "Tes coordonnees, ton code de parrainage et tes points sont attaches a ton compte. Sans connexion, il n'y a rien a afficher.",
      { href: "/connexion", libelle: "Se connecter" },
    );
  }
  if (etat === "migration") {
    return ecranSimple(
      "Espace partenaire pas encore installe",
      "Les tables du programme n'ont pas encore ete creees sur cette base. La page des partenaires, elle, reste consultable.",
      { href: "/partenaires", libelle: "Voir la presentation" },
    );
  }

  return (
    <div className="min-h-screen bg-[#070C18] text-white">
      {/* Halo lumineux */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(at_15%_0%,rgba(99,102,241,0.22)_0,transparent_45%),radial-gradient(at_85%_100%,rgba(245,201,60,0.15)_0,transparent_45%)]" />

      {/* Top Navigation Bar du Dashboard */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070C18]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Link href="/partenaires">
              <LogoDark className="h-8" />
            </Link>
            <span className="hidden rounded-full border border-[#FFC93C]/40 bg-[#FFC93C]/10 px-2.5 py-0.5 text-[.65rem] font-bold uppercase tracking-wider text-[#FFC93C] sm:inline-block">
              Espace Dashboard Partenaire
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/partenaires"
              className="text-[.78rem] text-white/70 hover:text-white transition"
            >
              ← Présentation & Plans
            </Link>
            {/* La pastille annoncait « Statut Actif » a tout visiteur, meme
                sans compte. Elle dit desormais l'etat reel — un badge qui ment
                sur un espace partenaire, c'est une promesse de revenus qui
                ment avec lui. */}
            {(() => {
              const e = partenaire ? ETATS[partenaire.statut] : null;
              if (!e) {
                return (
                  <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-[.72rem] font-black text-white/70">
                    ○ Pas encore inscrit
                  </span>
                );
              }
              return (
                <span
                  className="rounded-xl px-3 py-1 text-[.72rem] font-black"
                  style={{ background: `${e.couleur}22`, color: e.couleur, border: `1px solid ${e.couleur}55` }}
                >
                  {e.texte}
                </span>
              );
            })()}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8">
        {/* En-tête du Dashboard */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/15 bg-gradient-to-r from-white/[0.04] via-[#0B1120] to-[#070C18] p-6 backdrop-blur sm:flex-row sm:items-center">
          <div>
            <div className="text-[.72rem] font-bold uppercase tracking-wider text-[#FFC93C]">
              Bienvenue sur votre Espace Agence
            </div>
            <h1 className="mt-1 font-display text-[1.8rem] font-black text-white sm:text-[2.2rem]">
              {partnerAgency || "Votre Agence Locale"}
            </h1>
            <p className="text-[.82rem] text-white/60">
              Personnalisez vos affiches, lancez vos outils de travail et gérez vos clients.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("studio")}
              className={`rounded-xl px-4 py-2 text-[.82rem] font-bold transition ${
                activeTab === "studio"
                  ? "bg-[#FFC93C] text-[#0B1120] shadow"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              🎨 Studio Affiches
            </button>
            <button
              onClick={() => setActiveTab("outils")}
              className={`rounded-xl px-4 py-2 text-[.82rem] font-bold transition ${
                activeTab === "outils"
                  ? "bg-[#FFC93C] text-[#0B1120] shadow"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              ⚡ Outils CV & Devis
            </button>
            <button
              onClick={() => setActiveTab("scripts")}
              className={`rounded-xl px-4 py-2 text-[.82rem] font-bold transition ${
                activeTab === "scripts"
                  ? "bg-[#FFC93C] text-[#0B1120] shadow"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              📲 Scripts WhatsApp
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ONGLET 1 : STUDIO D'AFFICHES PERSONNALISÉES
           ══════════════════════════════════════════════════════════ */}
        {activeTab === "studio" && (
          <div className="mt-8 space-y-10">
            {/* Formulaire de configuration des coordonnées */}
            <div className="rounded-2xl border border-[#FFC93C]/40 bg-black/40 p-6 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="text-[1.2rem]">✏️</span>
                <div>
                  <h3 className="font-display text-[1.1rem] font-bold text-white">
                    Paramètres de Vos Coordonnées
                  </h3>
                  <p className="text-[.76rem] text-white/60">
                    Ces informations s'impriment automatiquement en bas de chaque affiche lors du téléchargement.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[.72rem] font-bold uppercase text-[#FFC93C]">
                    📞 Votre Numéro WhatsApp & Appel
                  </label>
                  <input
                    type="text"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    placeholder="Ex: +221 77 123 45 67"
                    className="mt-1.5 w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-[.88rem] text-white focus:border-[#FFC93C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[.72rem] font-bold uppercase text-[#FFC93C]">
                    🏢 Nom de Votre Agence
                  </label>
                  <input
                    type="text"
                    value={partnerAgency}
                    onChange={(e) => setPartnerAgency(e.target.value)}
                    placeholder="Ex: Alpha Digital Services"
                    className="mt-1.5 w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-[.88rem] text-white focus:border-[#FFC93C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[.72rem] font-bold uppercase text-[#FFC93C]">
                    📍 Ville & Pays
                  </label>
                  <input
                    type="text"
                    value={partnerCity}
                    onChange={(e) => setPartnerCity(e.target.value)}
                    placeholder="Ex: Dakar, Sénégal"
                    className="mt-1.5 w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-[.88rem] text-white focus:border-[#FFC93C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Sans cet enregistrement, tout etait a retaper a chaque visite
                  — et un partenaire qui retape ses coordonnees chaque matin
                  finit par ne plus revenir. */}
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                <button
                  onClick={enregistrer}
                  disabled={enregistrement}
                  className="rounded-xl bg-gradient-to-r from-[#FFC93C] to-[#F5A623] px-5 py-2.5 text-[.84rem] font-black text-[#0B1120] shadow-lg transition hover:scale-105 disabled:opacity-50"
                >
                  {enregistrement ? "Enregistrement…" : partenaire ? "Enregistrer mes coordonnees" : "Rejoindre le programme"}
                </button>
                {message && (
                  <p role="status" aria-live="polite" className="text-[.8rem] text-white/75">
                    {message}
                  </p>
                )}
              </div>
            </div>

            {/* Code de parrainage et points — la contrepartie concrete du
                programme. Ils n'existaient nulle part : le partenaire ne
                pouvait ni partager son lien, ni savoir ou il en etait. */}
            {partenaire && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#6366F1]/40 bg-black/40 p-6 backdrop-blur">
                  <h3 className="font-display text-[1.05rem] font-bold text-white">Ton lien de parrainage</h3>
                  <p className="mt-1 text-[.76rem] text-white/60">
                    Partage-le. Chaque inscription qui passe par ce lien t&apos;est rattachee.
                  </p>
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
                    <code className="min-w-0 flex-1 truncate font-mono text-[.8rem] text-[#A5B4FC]">
                      {lienParrainage(partenaire.code)}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(lienParrainage(partenaire.code)).catch(() => {});
                        setMessage("Lien copie.");
                      }}
                      className="shrink-0 rounded-lg bg-[#6366F1] px-3 py-1.5 text-[.74rem] font-bold text-white"
                    >
                      Copier
                    </button>
                  </div>
                  <p className="mt-2 text-[.74rem] text-white/50">
                    Code a dicter au telephone : <b className="text-white/80">{partenaire.code}</b>
                  </p>
                </div>

                <div className="rounded-2xl border border-[#10B981]/40 bg-black/40 p-6 backdrop-blur">
                  <h3 className="font-display text-[1.05rem] font-bold text-white">Tes points</h3>
                  <p className="mt-3 font-display text-[2.6rem] font-black leading-none text-[#10B981]">
                    {partenaire.points}
                  </p>
                  {/* L'echeance, dite au partenaire lui-meme : c'est lui qui
                      doit savoir quand payer, pas seulement l'administration. */}
                  <p className="mt-3 border-t border-white/10 pt-3 text-[.76rem] text-white/70">
                    {partenaire.expire_at && new Date(partenaire.expire_at).getTime() > Date.now() ? (
                      <>
                        Abonnement <b className="text-white">{partenaire.plan || "actif"}</b> jusqu&apos;au{" "}
                        <b className="text-white">
                          {new Date(partenaire.expire_at).toLocaleDateString("fr-FR")}
                        </b>
                      </>
                    ) : (
                      "Aucun abonnement en cours. Contacte-nous par WhatsApp pour l'activer."
                    )}
                  </p>
                  <p className="mt-2 text-[.76rem] leading-relaxed text-white/60">
                    {partenaire.points === 0
                      ? "Aucun point pour l'instant. Ils arrivent avec tes filleuls et tes missions livrees."
                      : "Cumules sur tes filleuls et tes missions livrees."}
                  </p>
                </div>
              </div>
            )}

            {/* 1. Les 3 Affiches Portrait (4:5) */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-[1.15rem] font-bold text-white">
                <span className="h-5 w-1.5 rounded-full bg-[#FFC93C]" />
                Affiches Format Portrait 4:5 (Flyers A4 / Statuts WhatsApp / Stories)
              </h3>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {POSTERS_PORTRAIT_STUDIO.map((poster) => (
                  <div
                    key={poster.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-2xl backdrop-blur transition hover:border-[#FFC93C]"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-black/60">
                      <img
                        src={poster.src}
                        alt={poster.titre}
                        className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      />

                      {/* Aperçu du bandeau personnalisé */}
                      <div className="absolute inset-x-3 bottom-3 rounded-xl border border-[#FFC93C] bg-[#070C18]/95 p-2 text-center shadow-2xl backdrop-blur-md">
                        <div className="text-[.74rem] font-black text-[#FFC93C]">
                          📞 {partnerPhone || "Votre Numéro"}
                        </div>
                        <div className="truncate text-[.62rem] font-semibold text-white/90">
                          🏢 {partnerAgency || "Votre Agence"} · {partnerCity}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-1 flex-col justify-between">
                      <div>
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-[.6rem] font-black uppercase text-white shadow"
                          style={{ background: poster.accent }}
                        >
                          {poster.badge}
                        </span>
                        <h4 className="mt-2 font-display text-[1.05rem] font-bold text-white leading-snug">
                          {poster.titre}
                        </h4>
                        <p className="mt-1 text-[.74rem] text-[#FFC93C]">
                          💡 Service conseillé : <b>{poster.suggestedService}</b>
                        </p>
                      </div>

                      <div className="mt-4 border-t border-white/10 pt-3">
                        <button
                          onClick={() => telechargerAffichePersonnalisee(poster)}
                          disabled={downloadingId === poster.id}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFC93C] to-[#F5A623] py-2.5 text-[.82rem] font-black text-[#0B1120] shadow-lg transition hover:scale-102 disabled:opacity-50"
                        >
                          <span>
                            {downloadingId === poster.id
                              ? "⏳ Export HD en cours..."
                              : "⬇ Télécharger Affiche HD"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. L'unique Grande Bannière 16:9 Panoramique */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-[1.15rem] font-bold text-white">
                <span className="h-5 w-1.5 rounded-full bg-[#6366F1]" />
                Grande Bannière Panoramique 16:9 (Facebook Cover / LinkedIn / Web)
              </h3>

              <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04] p-5 shadow-2xl backdrop-blur transition hover:border-[#6366F1]">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black/60">
                  <img
                    src={BANNIERE_DUO_STUDIO.src}
                    alt={BANNIERE_DUO_STUDIO.titre}
                    className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-102"
                  />

                  {/* Aperçu du bandeau personnalisé sur la bannière 16:9 */}
                  <div className="absolute inset-x-4 bottom-4 rounded-xl border border-[#FFC93C] bg-[#070C18]/95 p-2.5 text-center shadow-2xl backdrop-blur-md">
                    <div className="text-[.82rem] font-black text-[#FFC93C]">
                      📞 {partnerPhone || "Votre Numéro WhatsApp"}
                    </div>
                    <div className="text-[.68rem] font-semibold text-white/90">
                      🏢 {partnerAgency || "Votre Agence"} · {partnerCity} · Partenaire Officiel Wanteermako
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[.6rem] font-black uppercase text-[#0B1120] shadow"
                      style={{ background: BANNIERE_DUO_STUDIO.accent }}
                    >
                      {BANNIERE_DUO_STUDIO.badge}
                    </span>
                    <h4 className="mt-1 font-display text-[1.2rem] font-bold text-white">
                      {BANNIERE_DUO_STUDIO.titre}
                    </h4>
                    <p className="text-[.78rem] text-[#FFC93C]">
                      💡 Utilisation idéale : <b>{BANNIERE_DUO_STUDIO.suggestedService}</b>
                    </p>
                  </div>

                  <button
                    onClick={() => telechargerAffichePersonnalisee({ ...BANNIERE_DUO_STUDIO, isBanner: true })}
                    disabled={downloadingId === BANNIERE_DUO_STUDIO.id}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] px-6 py-3 text-[.88rem] font-bold text-white shadow-lg transition hover:scale-105 disabled:opacity-50"
                  >
                    <span>
                      {downloadingId === BANNIERE_DUO_STUDIO.id
                        ? "⏳ Export Bannière HD..."
                        : "⬇ Télécharger Bannière 16:9 HD"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET 2 : OUTILS DE TRAVAIL RAPIDES
           ══════════════════════════════════════════════════════════ */}
        {activeTab === "outils" && (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col rounded-3xl border border-[#8B5CF6]/30 bg-gradient-to-b from-[#8B5CF6]/15 to-white/[0.02] p-7 shadow-xl">
              <div className="text-[2.2rem]">🧠</div>
              <h3 className="mt-3 font-display text-[1.4rem] font-black text-white">
                Créateur de CV & Lettres IA
              </h3>
              <p className="mt-2 text-[.82rem] text-white/70 leading-relaxed">
                Remplissez les informations de votre client et laissez notre IA générer un CV format A4 conforme aux cabinets de recrutement en 3 minutes.
              </p>
              <div className="mt-auto pt-6">
                <Link
                  href="/carriere"
                  className="block w-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] py-3 text-center text-[.88rem] font-black text-white shadow-lg transition hover:scale-105"
                >
                  + Rédiger un CV Client →
                </Link>
              </div>
            </div>

            <div className="flex flex-col rounded-3xl border border-[#FFC93C]/30 bg-gradient-to-b from-[#FFC93C]/15 to-white/[0.02] p-7 shadow-xl">
              <div className="text-[2.2rem]">🧾</div>
              <h3 className="mt-3 font-display text-[1.4rem] font-black text-white">
                Générateur Devis & Factures WhatsApp
              </h3>
              <p className="mt-2 text-[.82rem] text-white/70 leading-relaxed">
                Configurez le profil d'un commerçant ou artisan, saisissez ses prestations et générez son lien public de devis validable en 1 clic.
              </p>
              <div className="mt-auto pt-6">
                <Link
                  href="/mon-activite"
                  className="block w-full rounded-xl bg-gradient-to-r from-[#FFC93C] to-[#F5A623] py-3 text-center text-[.88rem] font-black text-[#0B1120] shadow-lg transition hover:scale-105"
                >
                  + Nouveau Devis Client →
                </Link>
              </div>
            </div>

            <div className="flex flex-col rounded-3xl border border-[#10B981]/30 bg-gradient-to-b from-[#10B981]/15 to-white/[0.02] p-7 shadow-xl">
              <div className="text-[2.2rem]">🚀</div>
              <h3 className="mt-3 font-display text-[1.4rem] font-black text-white">
                Mise en Ligne d'Annonces & Boosts
              </h3>
              <p className="mt-2 text-[.82rem] text-white/70 leading-relaxed">
                Prenez en charge la publication des produits de vos commerçants locaux sur Wanteermako et activez leurs options de mise en avant VIP.
              </p>
              <div className="mt-auto pt-6">
                <Link
                  href="/publier"
                  className="block w-full rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] py-3 text-center text-[.88rem] font-black text-white shadow-lg transition hover:scale-105"
                >
                  + Publier une Annonce →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET 3 : SCRIPTS WHATSAPP COPIER-COLLER
           ══════════════════════════════════════════════════════════ */}
        {activeTab === "scripts" && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-b from-[#8B5CF6]/10 to-transparent p-6">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#A5B4FC]">
                  📱 Script Candidats / Étudiants (Pour Vendre des CV à 3 000 FCFA)
                </span>
                <button
                  onClick={() => {
                    const text = `Salut ! 👋 Tu cherches un emploi ou un stage ? Je refais ton CV complet et ta lettre de motivation avec une IA adaptée aux recruteurs. Format A4 Haute Définition · Prêt en 10 minutes · Seulement 3 000 FCFA. Contacte mon agence ${partnerAgency} au ${partnerPhone} pour commencer !`;
                    navigator.clipboard.writeText(text);
                    alert("Script copié !");
                  }}
                  className="rounded-lg bg-[#8B5CF6] px-3 py-1.5 text-[.74rem] font-bold text-white shadow"
                >
                  Copier le Script 📄
                </button>
              </div>
              <div className="mt-3 rounded-xl bg-black/50 p-4 font-mono text-[.82rem] text-white/85 leading-relaxed">
                "Salut ! 👋 Tu cherches un emploi ou un stage ? <br /><br />
                Je refais ton <b>CV complet et ta lettre de motivation</b> avec une IA adaptée aux exigences des recruteurs et cabinets RH.<br /><br />
                📄 Format A4 Haute Définition · Prêt en 10 minutes · <b>Seulement 3 000 FCFA</b>.<br /><br />
                Contacte mon agence <b>{partnerAgency}</b> au <b>{partnerPhone}</b> pour commencer !"
              </div>
            </div>

            <div className="rounded-2xl border border-[#FFC93C]/30 bg-gradient-to-b from-[#FFC93C]/10 to-transparent p-6">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#FFC93C]">
                  🏢 Script Commerçants / Artisans (Pour Vendre des Devis à 15 000 FCFA/m)
                </span>
                <button
                  onClick={() => {
                    const text = `Bonjour cher entrepreneur ! Fini les devis sur papier brouillon ! Je vous configure votre système officiel de Devis & Factures certifiés avec QR Code envoyés directement sur WhatsApp. Vos clients valident en 1 clic. Contactez notre agence ${partnerAgency} au ${partnerPhone} pour une démo gratuite !`;
                    navigator.clipboard.writeText(text);
                    alert("Script copié !");
                  }}
                  className="rounded-lg bg-[#FFC93C] px-3 py-1.5 text-[.74rem] font-bold text-[#0B1120] shadow"
                >
                  Copier le Script 📄
                </button>
              </div>
              <div className="mt-3 rounded-xl bg-black/50 p-4 font-mono text-[.82rem] text-white/85 leading-relaxed">
                "Bonjour cher entrepreneur ! 💼<br /><br />
                Fini de rédiger vos devis et factures sur papier brouillon ! Je vous configure votre système officiel de <b>Devis & Factures certifiés avec QR Code</b> envoyés directement sur WhatsApp.<br /><br />
                ✅ Vos clients valident en 1 clic sans installer d'application.<br />
                ✅ Suivi de vos paiements Wave & Orange Money.<br />
                💰 Formule complète à seulement <b>15 000 FCFA / mois</b>.<br /><br />
                Contactez notre agence <b>{partnerAgency}</b> au <b>{partnerPhone}</b> pour voir une démo gratuite !"
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
