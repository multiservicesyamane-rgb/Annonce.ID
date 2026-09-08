"use client";

import { useEffect, useMemo, useState } from "react";
import CVSheet from "./templates";
import ExportA4 from "./ExportA4";
import { useDoc } from "./useDoc";
import A4Preview from "@/components/pro/A4Preview";
import ImageCropperModal from "@/components/ImageCropperModal";
import {
  ActionBar, AiBtn, Area, AsideCard, BandeauVerrou, BarreOutils, Dots, Field,
  Note, OutilBtn, OutlineBtn, PanneauOutil, PrimaryBtn, Select, Split, Title,
  ZOOMS, api, card, input, lbl, messageAvantFinalisation, pageWide,
} from "./ui";
import {
  ACCENTS,
  CV_TEMPLATES,
  DEFAULT_POLICE,
  MOIS_LABELS,
  PHOTO_RATIO,
  POLICES,
  accentDe,
  newId,
  niveauCompetence,
  resumeDossier,
  templateCV,
  templateIsPro,
  type CVContent,
  type Genre,
  type TemplateId,
} from "@/lib/carriere";

/**
 * Creation d'un CV.
 *
 * ── Beaucoup d'ecrans courts, plutot que peu d'ecrans longs ──────────────
 * Le parcours comptait d'abord quatre etapes, dont une « Parcours » qui
 * empilait experience, formation, competences, langues et atouts : plusieurs
 * ecrans de defilement pour une seule pastille. Il en compte desormais sept,
 * chacun tenant dans une vue, avec « Continuer » toujours sous le pouce dans
 * la barre fixe du bas. C'est la mecanique des plateformes de CV etablies, et
 * elle demande moins d'effort qu'une longue page a derouler.
 *
 * ── Sur grand ecran, l'apercu accompagne la saisie ───────────────────────
 * Colonne de droite collante : on voit l'effet de ce qu'on tape sans quitter
 * le formulaire des yeux.
 */

const ANNEES = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

/** Les sept ecrans, dans l'ordre. */
const ETAPES = [
  { titre: "Choisis ton modele", sous: "Tu pourras en changer a tout moment." },
  { titre: "Tes coordonnees", sous: "Elles apparaissent en haut de ton CV." },
  { titre: "Ton profil", sous: "Deux ou trois phrases sur qui tu es." },
  { titre: "Ton experience", sous: "Commence par le poste le plus recent." },
  { titre: "Ta formation", sous: "Diplomes, ecoles et formations suivies." },
  { titre: "Competences et langues", sous: "Ce que tu sais faire, et dans quelles langues." },
  { titre: "Apercu de ton CV", sous: "Verifie ton document avant de l'envoyer." },
] as const;

const APERCU = 6;

/**
 * Miniature d'un gabarit, dans le selecteur de modeles.
 *
 * Largeur FIXE, et l'echelle s'en deduit. La version precedente ecrivait
 * `scale(0.174)` en dur : l'echelle ne suivait donc pas la largeur reelle de la
 * carte, et elargir la grille aurait laisse la feuille flotter dans le vide au
 * lieu de grandir. Ici, seule la largeur de la miniature est un choix — le
 * facteur et la hauteur en decoulent, et ne peuvent plus se contredire.
 */
const MINI_W = 148;
const MINI_SCALE = MINI_W / 794;
const MINI_H = Math.round(1123 * MINI_SCALE);

/** Meme mecanique, en plus petit, pour la bande de modeles du panneau. */
const VIGNETTE_W = 92;
const VIGNETTE_SCALE = VIGNETTE_W / 794;
const VIGNETTE_H = Math.round(1123 * VIGNETTE_SCALE);

const COMPETENCES_COURANTES = [
  "Relation client", "Vente", "Pack Office", "Excel", "Organisation",
  "Travail en equipe", "Caisse", "Gestion de stock", "Saisie de donnees",
  "Accueil", "Conduite", "Maintenance",
];

const ATOUTS_COURANTS = [
  "Sens de l'organisation", "Esprit d'equipe", "Rigueur", "Ponctualite",
  "Sens du contact", "Discretion",
];

/** CV d'exemple, uniquement pour les miniatures de l'etape « Modele ». */
const EXEMPLE: CVContent = {
  personalInfo: {
    firstName: "Fatou", lastName: "Ndiaye", title: "Assistante commerciale",
    email: "fatou.ndiaye@email.com", phone: "+221 77 123 45 67",
    location: "Dakar, Senegal", linkedin: "", photoUrl: "",
  },
  accent: "",
  police: "",
  summary: "Assistante commerciale rigoureuse, quatre ans d'experience dans le suivi des ventes et la relation client.",
  experiences: [{
    id: "x1", title: "Assistante commerciale", company: "SunuCom", location: "Dakar",
    startDate: "2021", endDate: "", isCurrent: true,
    bullets: ["Gestion des commandes clients et suivi des livraisons.", "Preparation des devis et des factures."],
  }],
  education: [{ id: "e1", degree: "Licence en Commerce", school: "Universite Cheikh Anta Diop", location: "Dakar", startDate: "2016", endDate: "2019" }],
  certifications: [{ id: "c1", name: "Bureautique et Pack Office", issuer: "Centre Sonatel Academy", year: "2020" }],
  skills: ["Relation client", "Prospection", "Pack Office"],
  // Notes presentes uniquement sur ce CV d'exemple : les miniatures doivent
  // montrer a quoi ressemble un modele REMPLI, barres comprises. Aucun CV
  // reel ne recoit de niveau qu'on n'a pas saisi.
  niveaux: { "Relation client": 5, Prospection: 4, "Pack Office": 4 } as const,
  languages: [{ id: "l1", name: "Francais", level: 5 }, { id: "l2", name: "Anglais", level: 3 }],
  atouts: ["Sens de l'organisation", "Rigueur"],
};

export default function CVWizard({
  docId,
  prefill,
  abonne,
  onQuitter,
  onPeage,
  toast,
}: {
  docId?: string;
  /** Reponses deja donnees a l'assistant — poste vise, ville. */
  prefill?: Partial<CVContent>;
  abonne: boolean;
  onQuitter: () => void;
  onPeage: () => void;
  toast: (m: string) => void;
}) {
  const doc = useDoc("cv", docId, prefill);
  const cv = doc.content as CVContent;
  // Ouvrir un document deja cree montre LE DOCUMENT, pas la deuxieme etape
  // de sa saisie : on clique « Ouvrir » pour le relire ou le telecharger,
  // pas pour recommencer. « Modifier » de la barre d outils ramene au
  // formulaire en un geste.
  const [etape, setEtape] = useState(docId ? APERCU : 0);
  const [genre, setGenre] = useState<Genre>("?");
  const [ia, setIa] = useState<string | null>(null);
  /** Image choisie, en attente de recadrage. */
  const [aRecadrer, setARecadrer] = useState<string | null>(null);
  /**
   * Une seule fiche ouverte a la fois dans « Experience » et « Formation ».
   *
   * Cinq experiences depliees mettaient cinq formulaires bout a bout — plus de
   * 13 000 px de haut au telephone. Repliees, elles tiennent chacune sur une
   * ligne : on voit tout son parcours d'un coup d'oeil et on n'ouvre que celle
   * qu'on modifie.
   */
  const [carteOuverte, setCarteOuverte] = useState<string | null>(null);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  /** Outil deplie sous la barre de l'apercu. `null` = aucun. */
  const [panneau, setPanneau] = useState<"modele" | "couleur" | "police" | null>(null);
  /** Zoom de l apercu lateral. Index dans ZOOMS ; 1 = page entiere. */
  const [iZoomLateral, setIZoomLateral] = useState(1);

  const patchCv = (p: Partial<CVContent>) => doc.patch(p as Record<string, unknown>);
  const patchInfo = (p: Partial<CVContent["personalInfo"]>) =>
    patchCv({ personalInfo: { ...cv.personalInfo, ...p } });

  /** Pose ou retire la note d'une competence. `0` efface. */
  const majNiveau = (nom: string, niveau: number) => {
    const niveaux = { ...(cv.niveaux || {}) };
    if (niveau >= 1 && niveau <= 5) niveaux[nom] = niveau as 1 | 2 | 3 | 4 | 5;
    else delete niveaux[nom];
    patchCv({ niveaux: Object.keys(niveaux).length ? niveaux : undefined });
  };

  /**
   * Remplace la liste des competences, et jette les notes devenues orphelines.
   *
   * Sans ce menage, supprimer « Excel » puis le retaper plus tard lui rendrait
   * l'ancienne note sans que personne l'ait demandee.
   */
  const majCompetences = (valeurs: string[]) => {
    const restants = new Set(valeurs);
    const niveaux = Object.fromEntries(
      Object.entries(cv.niveaux || {}).filter(([nom]) => restants.has(nom)),
    ) as CVContent["niveaux"];
    patchCv({ skills: valeurs, niveaux: niveaux && Object.keys(niveaux).length ? niveaux : undefined });
  };

  /* ------------------------------- L'IA ------------------------------- */

  async function rediger(cible: "summary" | "bullets", charge: Record<string, unknown>, appliquer: (t: string) => void) {
    setIa(cible + (charge.id || ""));
    try {
      const d = await api("generate", { targets: [cible], genre, kind: "cv", ...charge });
      const texte = d.textes?.[cible];
      if (texte) {
        appliquer(texte);
        // Quand aucun moteur n'a repondu, le texte vient d'un modele : le dire
        // evite qu'on envoie tel quel un courrier qu'on croyait personnalise.
        if (d.moteur === "modele") toast("Texte compose sans IA : relis-le et personnalise-le.");
      } else {
        toast("La redaction n'a rien renvoye. Reessaie.");
      }
    } catch (e: any) {
      // 402 : ce n'est pas une panne, c'est le quota. On ouvre l'abonnement.
      if (e?.status === 402) onPeage();
      else toast(e?.message || "Redaction impossible.");
    } finally {
      setIa(null);
    }
  }

  /* ------------------------------ La photo ------------------------------ */

  /** Au-dela, l'envoi est lent en 4G et la photo n'y gagne rien. */
  const PHOTO_MAX = 4 * 1024 * 1024;

  function choisirPhoto(f: File | undefined) {
    if (!f) return;
    if (!/^image\/(jpe?g|png|webp|heic)$/i.test(f.type)) {
      toast("Formats acceptes : JPG, PNG, WEBP.");
      return;
    }
    if (f.size > PHOTO_MAX) {
      toast("Photo trop lourde : 4 Mo maximum.");
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => setARecadrer(String(lecteur.result));
    lecteur.readAsDataURL(f);
  }

  /** Recadrage valide : on envoie, puis on garde l'URL publique. */
  async function envoyerPhoto(base64: string) {
    setARecadrer(null);
    setEnvoiPhoto(true);
    try {
      const { uploadImage } = await import("@/lib/storage");
      const url = await uploadImage(base64, "carriere");
      if (!url || url.startsWith("data:")) throw new Error("envoi refuse");
      patchInfo({ photoUrl: url });
    } catch {
      // Sans URL publique, la photo ne survivrait pas au rechargement et ne
      // partirait pas dans le PDF : mieux vaut le dire que la faire croire.
      toast("Envoi de la photo impossible. Reessaie.");
    } finally {
      setEnvoiPhoto(false);
    }
  }

  /* --------------------------- Le nom complet --------------------------- */
  // Un seul champ « Prenom et nom », coupe au premier espace : au Senegal le
  // prenom precede le nom (Fatou Ndiaye), et un nom compose reste entier du
  // bon cote.
  //
  // Le champ garde EXACTEMENT ce qui est tape, dans son propre etat. La version
  // precedente decoupait puis recomposait la valeur a chaque frappe, avec un
  // `trim()` au passage : l'espace etait donc efface a l'instant meme ou on le
  // tapait, le champ revenait a « Fatou », et la frappe suivante donnait
  // « FatouNdiaye ». Impossible de saisir un nom en deux mots.
  const nomComplet = `${cv.personalInfo.firstName} ${cv.personalInfo.lastName}`.trim();
  const [nomSaisi, setNomSaisi] = useState(nomComplet);

  // Le CV peut changer sans passer par le champ : chargement d'un document,
  // exemple, remplissage par l'assistant. On resynchronise alors la saisie —
  // sauf si elle dit deja la meme chose, pour ne pas manger l'espace en cours.
  useEffect(() => {
    setNomSaisi((actuel) => (actuel.trim().replace(/\s+/g, " ") === nomComplet ? actuel : nomComplet));
  }, [nomComplet]);

  const setNomComplet = (v: string) => {
    setNomSaisi(v);
    const saisie = v.replace(/^\s+/, "");
    const coupure = saisie.indexOf(" ");
    patchInfo(
      coupure === -1
        ? { firstName: saisie, lastName: "" }
        : { firstName: saisie.slice(0, coupure), lastName: saisie.slice(coupure + 1).trim() },
    );
  };

  const miniature = useMemo(() => (nomComplet ? cv : EXEMPLE), [nomComplet, cv]);

  /** Apercu vivant de la colonne de droite, sur grand ecran uniquement. */
  /* --------------------- Les outils de mise en forme ---------------------
     Definis une seule fois : l'apercu en direct de la colonne de droite et
     l'ecran d'apercu final montrent EXACTEMENT la meme barre. Les ecrire deux
     fois aurait garanti qu'un reglage finisse par n'exister que d'un cote. */

  /**
   * Ouvre un panneau de la barre d'outils — ou l'abonnement si le CV est fini.
   *
   * Changer de modele, de couleur ou de police EST une modification : sur un
   * document verrouille, l'enregistrement automatique est coupe. Laisser ces
   * boutons agir aurait donne le pire des cas — la page change sous les yeux,
   * et rien n'est garde. Un bouton qui ment est pire qu'un bouton ferme.
   */
  const ouvrirPanneau = (nom: "modele" | "couleur" | "police") => {
    if (doc.verrouille) {
      onPeage();
      return;
    }
    setPanneau((p) => (p === nom ? null : nom));
  };

  const outilsCV = (compact: boolean) => (
    <>
      <OutilBtn
        icone={doc.verrouille ? "🔒" : "▦"}
        compact={compact}
        actif={panneau === "modele"}
        onClick={() => ouvrirPanneau("modele")}
      >
        Modele
      </OutilBtn>
      <OutilBtn
        icone={doc.verrouille ? "🔒" : "🎨"}
        compact={compact}
        actif={panneau === "couleur"}
        onClick={() => ouvrirPanneau("couleur")}
      >
        Couleur
      </OutilBtn>
      <OutilBtn
        icone={doc.verrouille ? "🔒" : "Aa"}
        compact={compact}
        actif={panneau === "police"}
        onClick={() => ouvrirPanneau("police")}
      >
        Police
      </OutilBtn>
    </>
  );

  const panneauCV =
    panneau === "modele" ? (
      <PanneauOutil titre="Modele" sur={CV_TEMPLATES.find((t) => t.id === doc.template)?.name}>
        {/* Une BANDE horizontale de vraies miniatures, et non une liste de
            noms : « Mosaique » ou « Duo » ne disent rien de ce qu'on choisit,
            alors que l'image le montre. En ligne plutot qu'en grille, le
            panneau reste bas et ne recouvre pas la feuille qu'on est en train
            de regarder. */}
        <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2">
          {CV_TEMPLATES.map((t) => {
            const verrou = t.pro && !abonne;
            const choisi = doc.template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => (verrou ? onPeage() : doc.setTemplate(t.id as TemplateId))}
                aria-pressed={choisi}
                className={
                  "relative shrink-0 rounded-xl border-2 bg-white p-1.5 transition dark:bg-dark-900 " +
                  (choisi
                    ? "border-green shadow-[0_8px_22px_-12px_rgba(99,102,241,.7)]"
                    : "border-gray-200 hover:border-green/50 dark:border-white/10")
                }
              >
                <span
                  className="block overflow-hidden rounded-md ring-1 ring-black/5"
                  style={{ width: VIGNETTE_W, height: VIGNETTE_H }}
                >
                  <span
                    className="block origin-top-left"
                    style={{ transform: `scale(${VIGNETTE_SCALE})`, width: 794, height: 1123 }}
                    aria-hidden="true"
                  >
                    <span className="block" style={{ padding: 53 }}>
                      <CVSheet cv={miniature} template={t.id as TemplateId} />
                    </span>
                  </span>
                </span>
                <span
                  className={
                    "mt-1.5 block truncate text-center text-[.72rem] font-bold " +
                    (choisi ? "text-green" : "text-gray-600 dark:text-gray-300")
                  }
                  style={{ width: VIGNETTE_W }}
                >
                  {t.name}
                </span>
                {verrou && (
                  <span
                    className="absolute right-1 top-1 rounded-full bg-gold px-1.5 py-0.5 text-[.58rem] font-bold text-white"
                    aria-label="Reserve au Pro"
                  >
                    Pro
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PanneauOutil>
    ) : panneau === "couleur" ? (
      <PanneauOutil titre="Couleur d'accent" sur={cv.accent ? undefined : "celle du modele"}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => patchCv({ accent: "" })}
            className={
              "h-9 rounded-lg border px-3 text-[.8rem] font-bold transition " +
              (cv.accent
                ? "border-gray-200 text-gray-600 hover:border-green/50 dark:border-white/10 dark:text-gray-300"
                : "border-green bg-green/10 text-green")
            }
          >
            Par defaut
          </button>
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => patchCv({ accent: a.value })}
              title={a.name}
              aria-label={a.name}
              aria-pressed={cv.accent === a.value}
              className={
                "h-9 w-9 rounded-lg border-2 transition " +
                (cv.accent === a.value ? "border-green ring-2 ring-green/30" : "border-transparent hover:scale-105")
              }
              style={{ background: a.value }}
            />
          ))}
        </div>
      </PanneauOutil>
    ) : panneau === "police" ? (
      <PanneauOutil titre="Police du document">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {POLICES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => patchCv({ police: p.id })}
              className={
                "rounded-lg border px-2.5 py-2 text-left transition " +
                ((cv.police || DEFAULT_POLICE) === p.id
                  ? "border-green bg-green/10"
                  : "border-gray-200 hover:border-green/50 dark:border-white/10")
              }
            >
              {/* Le nom s'ecrit DANS sa propre police : c'est le seul apercu
                  qui vaille pour un choix de caractere. */}
              <span
                className="block text-[1rem] font-bold text-gray-900 dark:text-white"
                style={{ fontFamily: p.stack }}
              >
                {p.name}
              </span>
              <span className="block text-[.7rem] text-gray-500">{p.genre}</span>
            </button>
          ))}
        </div>
      </PanneauOutil>
    ) : null;

  /**
   * Apercu de la colonne de droite, pendant la saisie.
   *
   * Il porte la MEME barre que l'apercu final : changer de modele, de couleur
   * ou de police ne doit pas obliger a aller jusqu'au bout du parcours. La
   * barre y est compacte — icones seules — parce que la colonne fait 360 px.
   */
  const apercuLateral = (
    <AsideCard titre="Apercu en direct">
      <BarreOutils
        compact
        outils={outilsCV(true)}
        panneau={panneauCV}
        onFermer={() => setPanneau(null)}
        iZoom={iZoomLateral}
        setIZoom={setIZoomLateral}
      >
        <A4Preview zoom={ZOOMS[iZoomLateral]}>
          <CVSheet cv={cv} template={templateCV(doc.template)} />
        </A4Preview>
      </BarreOutils>
    </AsideCard>
  );

  /**
   * Fiche ouverte d'une liste : celle choisie si elle en fait partie, sinon la
   * premiere. La chaine vide veut dire « toutes repliees » — a distinguer de
   * `null`, qui signifie « rien de choisi, ouvre la premiere ».
   */
  const ouverte = (ids: string[]): string | null =>
    carteOuverte === "" ? null : carteOuverte && ids.includes(carteOuverte) ? carteOuverte : ids[0] || null;

  const etat =
    doc.etat === "enregistrement" ? "Enregistrement…"
      : doc.etat === "enregistre" ? "✓ Enregistre"
        : doc.etat === "erreur" ? "⚠ Hors ligne" : "";

  if (doc.chargement) return <p className="py-20 text-center text-gray-400">Chargement…</p>;

  /* ============================== Rendu ============================== */

  return (
    // Seul le choix du modele reste etroit : des qu'un apercu lateral
    // accompagne la saisie, il faut la largeur des deux colonnes. Avec `page`
    // (680 px), la colonne de gauche tombait a 300 px — un formulaire en
    // timbre-poste au milieu d'un ecran vide.
    // Tous les ecrans prennent la largeur : les ecrans de saisie parce qu'ils
    // posent l'apercu a droite (voir `Split`, qui borne lui-meme la colonne de
    // texte a une mesure lisible), et le choix du modele parce que c'est une
    // galerie. Il etait le seul a rester dans la colonne etroite : les
    // dix-sept gabarits y formaient cinq rangees a derouler, au milieu d'un
    // ecran vide aux deux tiers.
    <div className={pageWide}>
      <div className="mb-5">
        <Dots total={ETAPES.length} current={etape} />
        {etat && <p className="mt-2 text-center text-[.74rem] text-gray-400">{etat}</p>}
      </div>

      {/* ------------------------- 1. Le modele ------------------------- */}
      {etape === 0 && (
        <>
          <Title sub={ETAPES[0].sous}>{ETAPES[0].titre}</Title>

          {/* Deux modeles cote a cote au telephone, puis autant que la largeur
              en accepte — jusqu'a sept sur un ecran d'ordinateur. A quatre
              colonnes dans la colonne etroite des formulaires, les dix-sept
              gabarits formaient cinq rangees a derouler au milieu d'un ecran
              vide aux deux tiers : on ne pouvait pas les comparer. */}
          <div className="grid grid-cols-2 gap-3 sm:[grid-template-columns:repeat(auto-fill,minmax(164px,1fr))]">
            {CV_TEMPLATES.map((t) => {
              const verrouille = t.pro && !abonne;
              const choisi = doc.template === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => (verrouille ? onPeage() : doc.setTemplate(t.id as TemplateId))}
                  className={
                    "relative overflow-hidden rounded-2xl border-2 bg-white p-2 text-left transition dark:bg-dark-800 " +
                    (choisi ? "border-green shadow-[0_8px_24px_-12px_rgba(99,102,241,.6)]" : "border-gray-200 dark:border-white/10")
                  }
                >
                  {/* Vraie miniature du gabarit : une case grise ne dit rien
                      de ce qu'on choisit. Largeur figee et centree — la carte
                      peut s'elargir avec la grille sans que la feuille se
                      deforme ni se decale. */}
                  <span
                    className="mx-auto block overflow-hidden rounded-lg ring-1 ring-black/5"
                    style={{ width: MINI_W, height: MINI_H }}
                  >
                    <span
                      className="block origin-top-left"
                      style={{ transform: `scale(${MINI_SCALE})`, width: 794, height: 1123 }}
                      aria-hidden="true"
                    >
                      <span className="block" style={{ padding: 53 }}>
                        <CVSheet cv={miniature} template={t.id as TemplateId} />
                      </span>
                    </span>
                  </span>

                  <span className="mt-2 block text-center text-[.9rem] font-bold text-gray-900 dark:text-white">
                    {t.name}
                  </span>

                  {t.pro && (
                    <span className="absolute right-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[.65rem] font-bold text-white">
                      Pro
                    </span>
                  )}
                  {choisi && (
                    <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-green text-[.75rem] text-white">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dix-sept mises en page x six couleurs se lisent comme une
              centaine de modeles, pour le prix d'une variable. « D'origine »
              rend au gabarit sa teinte propre. */}
          <section className="mt-6">
            <p className={lbl}>Couleur</p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => patchCv({ accent: "" })}
                aria-label="Couleur d'origine du modele"
                aria-pressed={!cv.accent}
                className={
                  "grid h-9 w-9 place-items-center rounded-full border-2 text-[.7rem] font-bold transition " +
                  (!cv.accent ? "border-green text-green" : "border-gray-200 text-gray-400 dark:border-white/15")
                }
              >
                ✦
              </button>
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => patchCv({ accent: a.value })}
                  aria-label={a.name}
                  aria-pressed={cv.accent === a.value}
                  style={{ background: a.value }}
                  className={
                    "h-9 w-9 rounded-full transition " +
                    (cv.accent === a.value
                      ? "ring-2 ring-green ring-offset-2 dark:ring-offset-dark-900"
                      : "ring-1 ring-black/10")
                  }
                />
              ))}
            </div>
          </section>

          <ActionBar>
            <PrimaryBtn onClick={() => setEtape(1)}>Continuer avec ce modele</PrimaryBtn>
          </ActionBar>
        </>
      )}

      {/* ----------------------- 2. Les coordonnees ----------------------- */}
      {etape === 1 && (
        <Split aside={apercuLateral}>
          <Title sub={ETAPES[1].sous}>{ETAPES[1].titre}</Title>

          {/* La photo d'abord : c'est la premiere chose que regarde un
              recruteur senegalais, et la premiere qui manque quand elle est
              releguee en fin de formulaire. */}
          <section className={card + " mb-4 flex items-center gap-4"}>
            <span
              className="grid shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100 text-[.8rem] font-bold text-gray-400 dark:bg-white/10"
              style={{ width: 72, height: Math.round(72 / PHOTO_RATIO) }}
            >
              {cv.personalInfo.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cv.personalInfo.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                "Photo"
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[.92rem] font-bold text-gray-900 dark:text-white">Photo d&apos;identite</p>
              <p className="mt-0.5 text-[.78rem] leading-snug text-gray-500">
                Format 3,5 x 4,5 cm. JPG ou PNG, 4 Mo maximum.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-lg border-[1.5px] border-green px-3 py-1.5 text-[.82rem] font-bold text-green transition active:scale-95">
                  {envoiPhoto ? "Envoi…" : cv.personalInfo.photoUrl ? "Changer" : "Ajouter une photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={envoiPhoto}
                    onChange={(e) => {
                      choisirPhoto(e.target.files?.[0]);
                      // Remise a zero : sans elle, rechoisir le MEME fichier
                      // apres une annulation n'emettrait aucun evenement.
                      e.target.value = "";
                    }}
                  />
                </label>
                {cv.personalInfo.photoUrl && (
                  <button
                    type="button"
                    onClick={() => patchInfo({ photoUrl: "" })}
                    className="rounded-lg px-3 py-1.5 text-[.82rem] font-bold text-gray-500 transition hover:text-brand-red"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>
          </section>

          <div className="space-y-4">
            <Field label="Prenom et nom" value={nomSaisi} onChange={setNomComplet} placeholder="Fatou Ndiaye" maxLength={80} />
            <Field label="Poste recherche" value={cv.personalInfo.title} onChange={(v) => patchInfo({ title: v })} placeholder="Assistante commerciale" maxLength={100} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ville" value={cv.personalInfo.location} onChange={(v) => patchInfo({ location: v })} placeholder="Dakar" maxLength={80} />
              <Field label="Telephone" value={cv.personalInfo.phone} onChange={(v) => patchInfo({ phone: v })} placeholder="+221 77 000 00 00" type="tel" maxLength={40} />
            </div>
            <Field label="Adresse e-mail" value={cv.personalInfo.email} onChange={(v) => patchInfo({ email: v })} placeholder="nom@email.com" type="email" maxLength={120} />
          </div>

          <Barre onBack={() => setEtape(0)} onNext={() => setEtape(2)} onApercu={() => setEtape(APERCU)} />
        </Split>
      )}

      {/* -------------------------- 3. Le profil -------------------------- */}
      {etape === 2 && (
        <Split aside={apercuLateral}>
          <Title sub={ETAPES[2].sous}>{ETAPES[2].titre}</Title>

          <Area
            label="Profil professionnel"
            value={cv.summary}
            onChange={(v) => patchCv({ summary: v })}
            placeholder="Assistante commerciale organisee, trois ans d'experience dans la relation client."
            rows={6}
            maxLength={800}
          />

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <label className="min-w-[150px]">
              <span className={lbl}>Accord du texte</span>
              <select value={genre} onChange={(e) => setGenre(e.target.value as Genre)} className={input + " py-2"}>
                <option value="?">Sans accord</option>
                <option value="f">Au feminin</option>
                <option value="m">Au masculin</option>
              </select>
            </label>
            <AiBtn
              busy={ia === "summary"}
              onClick={() =>
                rediger(
                  "summary",
                  {
                    targetJob: cv.personalInfo.title,
                    city: cv.personalInfo.location,
                    parcours: cv.summary,
                    dossier: resumeDossier(cv),
                  },
                  (t) => patchCv({ summary: t }),
                )
              }
            >
              Aider a rediger
            </AiBtn>
          </div>

          <Barre onBack={() => setEtape(1)} onNext={() => setEtape(3)} onApercu={() => setEtape(APERCU)} />
        </Split>
      )}

      {/* ------------------------ 4. L'experience ------------------------ */}
      {etape === 3 && (
        <Split aside={apercuLateral}>
          <Title sub={ETAPES[3].sous}>{ETAPES[3].titre}</Title>

          {cv.experiences.length === 0 && (
            <Note>Pas encore d&apos;experience ? Un stage, un travail saisonnier ou du benevolat comptent aussi.</Note>
          )}

          {cv.experiences.map((e, i) => (
            <Fiche
              key={e.id}
              titre={e.title || `Experience ${i + 1}`}
              resume={[e.company, periodeCourte(e)].filter(Boolean).join(" \u00b7 ")}
              ouvert={ouverte(cv.experiences.map((x) => x.id)) === e.id}
              onToggle={() => setCarteOuverte((o) => (o === e.id ? "" : e.id))}
              onSupprimer={() => patchCv({ experiences: cv.experiences.filter((x) => x.id !== e.id) })}
            >
              <Field label="Poste" value={e.title} onChange={(v) => majExp(e.id, { title: v })} placeholder="Assistante commerciale" maxLength={100} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Entreprise" value={e.company} onChange={(v) => majExp(e.id, { company: v })} placeholder="SunuCom" maxLength={100} />
                <Field label="Ville" value={e.location} onChange={(v) => majExp(e.id, { location: v })} placeholder="Dakar" maxLength={80} />
              </div>

              <Periode
                debut={e.startDate}
                fin={e.endDate}
                actuel={e.isCurrent}
                onDebut={(v) => majExp(e.id, { startDate: v })}
                onFin={(v) => majExp(e.id, { endDate: v })}
                onActuel={(v) => majExp(e.id, { isCurrent: v })}
              />

              <Area
                label="Missions"
                value={e.bullets.join("\n")}
                onChange={(v) => majExp(e.id, { bullets: v.split("\n") })}
                placeholder="Une mission par ligne."
                rows={4}
                maxLength={900}
              />
              <div className="flex justify-end">
                <AiBtn
                  busy={ia === "bullets" + e.id}
                  onClick={() =>
                    rediger(
                      "bullets",
                      {
                        id: e.id,
                        jobTitle: e.title,
                        employer: e.company,
                        missions: e.bullets.join("\n"),
                        // Le poste vise oriente les missions vers la candidature
                        // en cours, au lieu d'une liste de taches interchangeable.
                        targetJob: cv.personalInfo.title,
                        dossier: resumeDossier(cv),
                      },
                      (t) =>
                        majExp(e.id, {
                          bullets: t.split("\n").map((l) => l.replace(/^[-•\s]+/, "").trim()).filter(Boolean),
                        }),
                    )
                  }
                >
                  Aider a rediger
                </AiBtn>
              </div>
            </Fiche>
          ))}

          <Ajouter
            label="Ajouter une experience"
            onClick={() => {
              const id = newId("exp");
              patchCv({
                experiences: [
                  ...cv.experiences,
                  { id, title: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, bullets: [""] },
                ],
              });
              // La fiche ajoutee s'ouvre : sinon il faudrait la deplier a la
              // main juste apres l'avoir demandee.
              setCarteOuverte(id);
            }}
          />

          <Barre onBack={() => setEtape(2)} onNext={() => setEtape(4)} onApercu={() => setEtape(APERCU)} />
        </Split>
      )}

      {/* ------------------------- 5. La formation ------------------------- */}
      {etape === 4 && (
        <Split aside={apercuLateral}>
          <Title sub={ETAPES[4].sous}>{ETAPES[4].titre}</Title>

          {cv.education.map((f, i) => (
            <Fiche
              key={f.id}
              titre={f.degree || `Formation ${i + 1}`}
              resume={[f.school, periodeCourte({ ...f, isCurrent: false })].filter(Boolean).join(" \u00b7 ")}
              ouvert={ouverte(cv.education.map((x) => x.id)) === f.id}
              onToggle={() => setCarteOuverte((o) => (o === f.id ? "" : f.id))}
              onSupprimer={() => patchCv({ education: cv.education.filter((x) => x.id !== f.id) })}
            >
              <Field label="Diplome" value={f.degree} onChange={(v) => majEdu(f.id, { degree: v })} placeholder="Licence en Commerce" maxLength={120} />
              <Field label="Etablissement" value={f.school} onChange={(v) => majEdu(f.id, { school: v })} placeholder="Universite Cheikh Anta Diop" maxLength={120} />
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Ville" value={f.location} onChange={(v) => majEdu(f.id, { location: v })} placeholder="Dakar" maxLength={80} />
                <Select label="Debut" value={f.startDate} onChange={(v) => majEdu(f.id, { startDate: v })} options={optionsAnnees} />
                <Select label="Fin" value={f.endDate} onChange={(v) => majEdu(f.id, { endDate: v })} options={optionsAnnees} />
              </div>
            </Fiche>
          ))}

          <Ajouter
            label="Ajouter une formation"
            onClick={() => {
              const id = newId("edu");
              patchCv({
                education: [...cv.education, { id, degree: "", school: "", location: "", startDate: "", endDate: "" }],
              });
              setCarteOuverte(id);
            }}
          />

          {/* ---- Certifications ----
               Sur le meme ecran que la formation, mais dans sa propre rubrique :
               une certification recente pese souvent plus lourd aupres d'un
               recruteur qu'un diplome ancien. Les melanger effacerait cette
               distinction sur le CV imprime. */}
          <div className="mt-7 border-t border-gray-100 pt-6 dark:border-white/10">
            <h2 className="mb-1 font-display text-[1.05rem] font-extrabold text-gray-900 dark:text-white">
              Certifications
            </h2>
            <p className="mb-4 text-[.85rem] text-gray-500 dark:text-gray-400">
              Attestations, formations courtes, permis. Facultatif.
            </p>

            {cv.certifications.map((c, i) => (
              <Fiche
                key={c.id}
                titre={c.name || `Certification ${i + 1}`}
                resume={[c.issuer, c.year].filter(Boolean).join(" · ")}
                ouvert={ouverte(cv.certifications.map((x) => x.id)) === c.id}
                onToggle={() => setCarteOuverte(carteOuverte === c.id ? "" : c.id)}
                onSupprimer={() =>
                  patchCv({ certifications: cv.certifications.filter((x) => x.id !== c.id) })
                }
              >
                <Field
                  label="Intitule"
                  value={c.name}
                  onChange={(v) => majCert(c.id, { name: v })}
                  placeholder="Bureautique et Pack Office"
                  maxLength={140}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Organisme"
                    value={c.issuer}
                    onChange={(v) => majCert(c.id, { issuer: v })}
                    placeholder="Centre de formation, Google…"
                    maxLength={120}
                  />
                  <Select
                    label="Annee"
                    value={c.year}
                    onChange={(v) => majCert(c.id, { year: v })}
                    options={optionsAnnees}
                  />
                </div>
              </Fiche>
            ))}

            <Ajouter
              label="Ajouter une certification"
              onClick={() => {
                const id = newId("cert");
                patchCv({ certifications: [...cv.certifications, { id, name: "", issuer: "", year: "" }] });
                setCarteOuverte(id);
              }}
            />
          </div>

          <Barre onBack={() => setEtape(3)} onNext={() => setEtape(5)} onApercu={() => setEtape(APERCU)} />
        </Split>
      )}

      {/* -------------------- 6. Competences et langues -------------------- */}
      {etape === 5 && (
        <Split aside={apercuLateral}>
          <Title sub={ETAPES[5].sous}>{ETAPES[5].titre}</Title>

          <section className="mb-6">
            <h2 className="mb-2 text-[.95rem] font-bold text-gray-900 dark:text-white">Competences</h2>
            <Etiquettes
              valeurs={cv.skills}
              suggestions={COMPETENCES_COURANTES}
              max={20}
              placeholder="Ajouter une competence"
              onChange={majCompetences}
            />

            {/* Le niveau est FACULTATIF, et le rester est un choix : sans note
                donnee, le gabarit dessine une etiquette et aucune barre.
                Remplir a la place du candidat reviendrait a affirmer sur son
                CV un niveau qu'il n'a jamais declare — devant un recruteur,
                c'est lui qui le porterait. */}
            {cv.skills.length > 0 && (
              <div className="mt-4 rounded-xl border border-gray-200 p-3.5 dark:border-white/10">
                <p className="text-[.8rem] font-bold text-gray-700 dark:text-gray-200">
                  Ton niveau <span className="font-normal text-gray-400">— facultatif</span>
                </p>
                <p className="mt-0.5 text-[.76rem] leading-relaxed text-gray-500">
                  Note une competence pour qu&apos;elle sorte avec une barre sur les modeles
                  qui en affichent. Sans note, elle reste une etiquette simple.
                </p>
                <ul className="mt-3 space-y-2">
                  {cv.skills.map((nom) => {
                    const niveau = niveauCompetence(cv, nom);
                    return (
                      <li key={nom} className="flex items-center gap-3">
                        <span className="min-w-0 flex-1 truncate text-[.85rem] text-gray-700 dark:text-gray-300">
                          {nom}
                        </span>
                        <div className="flex gap-1.5" role="group" aria-label={`Niveau de ${nom}`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              aria-label={`${nom} : niveau ${n} sur 5`}
                              aria-pressed={n <= niveau}
                              // Recliquer sur la note en cours l'efface : sans
                              // cela, une barre posee par erreur ne pouvait
                              // plus etre retiree qu'en supprimant la
                              // competence entiere.
                              onClick={() => majNiveau(nom, n === niveau ? 0 : n)}
                              className={
                                "h-4 w-4 rounded-full transition " +
                                (n <= niveau ? "bg-green" : "bg-gray-200 dark:bg-white/15")
                              }
                            />
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          <section className="mb-6">
            <h2 className="mb-2 text-[.95rem] font-bold text-gray-900 dark:text-white">Langues</h2>
            {cv.languages.map((l) => (
              <div key={l.id} className="mb-2 flex items-center gap-3">
                <input
                  value={l.name}
                  placeholder="Francais"
                  maxLength={60}
                  onChange={(e) => majLangue(l.id, { name: e.target.value })}
                  className={input + " flex-1"}
                />
                <div className="flex gap-1.5" role="group" aria-label={`Niveau de ${l.name || "la langue"}`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Niveau ${n} sur 5`}
                      onClick={() => majLangue(l.id, { level: n as 1 | 2 | 3 | 4 | 5 })}
                      className={"h-4 w-4 rounded-full transition " + (n <= l.level ? "bg-green" : "bg-gray-200 dark:bg-white/15")}
                    />
                  ))}
                </div>
                <Supprimer onClick={() => patchCv({ languages: cv.languages.filter((x) => x.id !== l.id) })} />
              </div>
            ))}
            <Ajouter
              label="Ajouter une langue"
              onClick={() => patchCv({ languages: [...cv.languages, { id: newId("lang"), name: "", level: 3 }] })}
            />
          </section>

          <section>
            <h2 className="mb-2 text-[.95rem] font-bold text-gray-900 dark:text-white">Atouts</h2>
            <Etiquettes
              valeurs={cv.atouts}
              suggestions={ATOUTS_COURANTS}
              max={6}
              placeholder="Ajouter un atout"
              onChange={(v) => patchCv({ atouts: v })}
            />
          </section>

          <Barre onBack={() => setEtape(4)} onNext={() => setEtape(APERCU)} suivant="Voir mon CV" />
        </Split>
      )}

      {/* -------------------------- 7. L'apercu -------------------------- */}
      {etape === APERCU && (
        <>
          <div className="mb-4">
            <h1 className="font-display text-[1.7rem] font-extrabold leading-tight text-gray-900 dark:text-white">
              {ETAPES[APERCU].titre}
            </h1>
            <p className="mt-1 text-[.9rem] text-gray-500">{ETAPES[APERCU].sous}</p>
          </div>

          <ExportA4
            outils={
              <>
                {outilsCV(false)}
                {/* Verrouille, « Modifier » mene a l'abonnement et non au
                    formulaire : ouvrir un editeur dont chaque frappe sera
                    refusee ferait perdre du temps a quelqu'un pour rien. */}
                <OutilBtn icone={doc.verrouille ? "🔒" : "✎"} onClick={() => (doc.verrouille ? onPeage() : setEtape(1))}>
                  Modifier
                </OutilBtn>
              </>
            }
            panneau={panneauCV}
            onFermerPanneau={() => setPanneau(null)}
            filename={`CV-${(nomComplet || "sans-nom").replace(/[^\w-]+/g, "-")}.pdf`}
            title={`CV ${nomComplet}`.trim()}
            // Rien a avertir pour un abonne, ni pour un CV deja fini : la
            // boite ne s'ouvre qu'une fois, au moment ou le geste devient
            // irreversible.
            avertissement={!abonne && !doc.verrouille ? messageAvantFinalisation("ton CV") : null}
            onTelecharge={doc.finaliser}
            footer={
              <>
                {doc.verrouille && <BandeauVerrou quoi="Ce CV" onPeage={onPeage} />}
                {templateIsPro(doc.template) && !abonne ? (
                  <Note tone="warn">Ce modele est reserve a l&apos;abonnement Pro : le PDF sort avec le modele Moderne.</Note>
                ) : null}
              </>
            }
            aside={
              <div className="mb-4 border-b border-gray-100 pb-4 dark:border-white/10">
                <p className="text-[.68rem] font-bold uppercase tracking-[.06em] text-gray-400">Ton document</p>
                <p className="mt-1.5 truncate text-[.95rem] font-extrabold text-gray-900 dark:text-white">
                  {nomComplet ? `CV — ${nomComplet}` : "CV"}
                </p>
                <p className="mt-0.5 text-[.8rem] text-gray-500">
                  Modele {CV_TEMPLATES.find((t) => t.id === doc.template)?.name} · format A4
                </p>
                <p className="mt-3 flex items-start gap-2 text-[.78rem] leading-relaxed text-gray-500">
                  <span className="text-green" aria-hidden="true">✓</span>
                  <span>
                    Enregistre dans <strong className="text-gray-700 dark:text-gray-300">Mes documents</strong>.
                  </span>
                </p>
              </div>
            }
          >
            <CVSheet cv={cv} template={templateCV(doc.template)} />
          </ExportA4>

          {/* Au telephone seulement : sur grand ecran, le rappel vit dans le
              panneau de droite, a cote des boutons. */}
          <p className="mt-4 text-center text-[.82rem] text-gray-400 lg:hidden">
            Ton CV est enregistre dans <strong className="text-gray-500">Mes documents</strong>.
          </p>

          <div className="mx-auto mt-5 hidden sm:max-w-[420px] lg:block">
            <OutlineBtn onClick={onQuitter}>Retour a Ma Carriere</OutlineBtn>
          </div>
        </>
      )}
      {aRecadrer && (
        <ImageCropperModal
          imageSrc={aRecadrer}
          aspectRatio={PHOTO_RATIO}
          maxWidth={700}
          onCropDone={envoyerPhoto}
          onCancel={() => setARecadrer(null)}
        />
      )}
    </div>
  );

  /* ---------------------------- Mises a jour ---------------------------- */

  function majExp(id: string, p: Partial<CVContent["experiences"][number]>) {
    patchCv({ experiences: cv.experiences.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  }
  function majEdu(id: string, p: Partial<CVContent["education"][number]>) {
    patchCv({ education: cv.education.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  }
  function majCert(id: string, p: Partial<CVContent["certifications"][number]>) {
    patchCv({ certifications: cv.certifications.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  }
  function majLangue(id: string, p: Partial<CVContent["languages"][number]>) {
    patchCv({ languages: cv.languages.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  }
}

/* ============================ Sous-composants ============================ */

const optionsAnnees = [{ value: "", label: "—" }, ...ANNEES.map((a) => ({ value: a, label: a }))];

/**
 * Barre du bas d'une etape de saisie.
 *
 * « Apercu » y figure des la premiere etape : pouvoir regarder son CV a
 * n'importe quel moment, sans perdre sa place, evite de remplir a l'aveugle.
 */
function Barre({
  onBack, onNext, onApercu, suivant = "Continuer",
}: {
  onBack: () => void; onNext: () => void; onApercu?: () => void; suivant?: string;
}) {
  return (
    <ActionBar>
      <button
        type="button"
        onClick={onBack}
        aria-label="Retour"
        className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl border-[1.5px] border-gray-200 text-[1.3rem] text-gray-500 transition active:scale-95 dark:border-white/15"
      >
        ‹
      </button>
      {/* Visible a CHAQUE etape, y compris au telephone. Il etait masque sous
          640 px — precisement la ou l'apercu lateral n'existe pas non plus :
          on saisissait donc sept ecrans sans jamais voir son document. Au
          telephone l'icone seule, le libelle des que la place le permet. */}
      {onApercu && (
        <button
          type="button"
          onClick={onApercu}
          aria-label="Voir l'apercu"
          title="Voir l'apercu"
          className="flex h-[52px] shrink-0 items-center gap-2 rounded-xl border-[1.5px] border-green px-3.5 text-[.9rem] font-bold text-green transition active:scale-95 sm:px-4"
        >
          <span aria-hidden="true">👁</span>
          <span className="hidden sm:inline">Apercu</span>
        </button>
      )}
      <PrimaryBtn onClick={onNext}>{suivant}</PrimaryBtn>
    </ActionBar>
  );
}

function Periode({
  debut, fin, actuel, onDebut, onFin, onActuel,
}: {
  debut: string; fin: string; actuel: boolean;
  onDebut: (v: string) => void; onFin: (v: string) => void; onActuel: (v: boolean) => void;
}) {
  const [moisD = "", anD = ""] = debut.split(" ");
  const [moisF = "", anF = ""] = fin.split(" ");
  const mois = [{ value: "", label: "Mois" }, ...MOIS_LABELS.map((m) => ({ value: m, label: m }))];
  const annees = [{ value: "", label: "Annee" }, ...ANNEES.map((a) => ({ value: a, label: a }))];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className={lbl}>Debut</span>
          <div className="grid grid-cols-2 gap-2">
            <Select label="" value={moisD} onChange={(v) => onDebut(`${v} ${anD}`.trim())} options={mois} />
            <Select label="" value={anD} onChange={(v) => onDebut(`${moisD} ${v}`.trim())} options={annees} />
          </div>
        </div>

        {!actuel && (
          <div>
            <span className={lbl}>Fin</span>
            <div className="grid grid-cols-2 gap-2">
              <Select label="" value={moisF} onChange={(v) => onFin(`${v} ${anF}`.trim())} options={mois} />
              <Select label="" value={anF} onChange={(v) => onFin(`${moisF} ${v}`.trim())} options={annees} />
            </div>
          </div>
        )}
      </div>

      <label className="flex items-center gap-2.5 text-[.9rem] font-medium text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={actuel}
          onChange={(e) => onActuel(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-green focus:ring-green"
        />
        J&apos;occupe encore ce poste
      </label>
    </div>
  );
}

/** Liste d'etiquettes (competences, atouts) avec suggestions. */
function Etiquettes({
  valeurs, suggestions, max, placeholder, onChange,
}: {
  valeurs: string[]; suggestions: string[]; max: number; placeholder: string;
  onChange: (v: string[]) => void;
}) {
  const [saisie, setSaisie] = useState("");
  const plein = valeurs.length >= max;

  const ajouter = (v: string) => {
    const t = v.trim();
    if (!t || plein || valeurs.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    onChange([...valeurs, t]);
    setSaisie("");
  };

  return (
    <div>
      {valeurs.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {valeurs.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(valeurs.filter((x) => x !== v))}
              className="flex items-center gap-1.5 rounded-full bg-green/10 px-3 py-1.5 text-[.85rem] font-semibold text-green"
            >
              {v}
              <span aria-hidden="true">×</span>
              <span className="sr-only">Retirer</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={saisie}
          maxLength={80}
          disabled={plein}
          placeholder={plein ? `Maximum ${max} atteint` : placeholder}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              ajouter(saisie);
            }
          }}
          className={input + " flex-1"}
        />
        <button
          type="button"
          onClick={() => ajouter(saisie)}
          disabled={plein}
          className="shrink-0 rounded-xl bg-green px-4 text-[1.2rem] font-bold text-white disabled:opacity-50"
          aria-label="Ajouter"
        >
          +
        </button>
      </div>

      {!plein && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions
            .filter((s) => !valeurs.some((v) => v.toLowerCase() === s.toLowerCase()))
            .slice(0, 6)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ajouter(s)}
                className="rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-[.8rem] text-gray-500 transition hover:border-green hover:text-green dark:border-white/15"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/**
 * Fiche repliable d'une liste (experience, formation).
 *
 * Repliee, elle tient sur une ligne et resume ce qu'elle contient — poste,
 * entreprise, periode. C'est ce qui permet d'avoir dix experiences sans avoir
 * dix formulaires ouverts.
 */
function Fiche({
  titre, resume, ouvert, onToggle, onSupprimer, children,
}: {
  titre: string; resume: string; ouvert: boolean;
  onToggle: () => void; onSupprimer: () => void; children: React.ReactNode;
}) {
  return (
    <section
      className={
        "mb-3 overflow-hidden rounded-2xl border bg-white transition dark:bg-dark-800 " +
        (ouvert ? "border-green/40" : "border-gray-200 dark:border-white/10")
      }
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={ouvert}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[.95rem] font-bold text-gray-900 dark:text-white">{titre}</span>
            {resume && <span className="block truncate text-[.8rem] text-gray-500">{resume}</span>}
          </span>
          <span className={"shrink-0 text-gray-400 transition " + (ouvert ? "rotate-180" : "")} aria-hidden="true">
            ⌄
          </span>
        </button>
        <Supprimer onClick={onSupprimer} />
      </div>
      {ouvert && <div className="space-y-3 border-t border-gray-100 p-4 dark:border-white/10">{children}</div>}
    </section>
  );
}

/** Periode compacte pour le resume d'une fiche repliee. */
function periodeCourte(e: { startDate: string; endDate: string; isCurrent?: boolean }): string {
  const an = (v: string) => v.split(" ").pop() || "";
  const debut = an(e.startDate);
  const fin = e.isCurrent ? "aujourd\u2019hui" : an(e.endDate);
  return [debut, fin].filter(Boolean).join(" \u2013 ");
}

function Ajouter({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-[1.5px] border-dashed border-gray-300 py-3 text-[.9rem] font-bold text-gray-500 transition hover:border-green hover:text-green dark:border-white/15"
    >
      + {label}
    </button>
  );
}

function Supprimer({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Supprimer"
      className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-brand-red"
    >
      🗑
    </button>
  );
}
