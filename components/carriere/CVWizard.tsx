"use client";

import { useMemo, useState } from "react";
import CVSheet from "./templates";
import ExportA4 from "./ExportA4";
import { useDoc } from "./useDoc";
import A4Preview from "@/components/pro/A4Preview";
import ImageCropperModal from "@/components/ImageCropperModal";
import {
  ActionBar, AiBtn, Area, AsideCard, Dots, Field, Note, OutlineBtn, PrimaryBtn,
  Select, Split, Title, api, card, input, lbl, page, pageWide,
} from "./ui";
import {
  ACCENTS,
  CV_TEMPLATES,
  MOIS_LABELS,
  PHOTO_RATIO,
  accentDe,
  newId,
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
  summary: "Assistante commerciale rigoureuse, quatre ans d'experience dans le suivi des ventes et la relation client.",
  experiences: [{
    id: "x1", title: "Assistante commerciale", company: "SunuCom", location: "Dakar",
    startDate: "2021", endDate: "", isCurrent: true,
    bullets: ["Gestion des commandes clients et suivi des livraisons.", "Preparation des devis et des factures."],
  }],
  education: [{ id: "e1", degree: "Licence en Commerce", school: "Universite Cheikh Anta Diop", location: "Dakar", startDate: "2016", endDate: "2019" }],
  skills: ["Relation client", "Prospection", "Pack Office"],
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
  const [etape, setEtape] = useState(docId ? 1 : 0);
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

  const patchCv = (p: Partial<CVContent>) => doc.patch(p as Record<string, unknown>);
  const patchInfo = (p: Partial<CVContent["personalInfo"]>) =>
    patchCv({ personalInfo: { ...cv.personalInfo, ...p } });

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
  const nomComplet = `${cv.personalInfo.firstName} ${cv.personalInfo.lastName}`.trim();
  const setNomComplet = (v: string) => {
    const [prenom, ...reste] = v.trim().split(/\s+/);
    patchInfo({ firstName: prenom || "", lastName: reste.join(" ") });
  };

  const miniature = useMemo(() => (nomComplet ? cv : EXEMPLE), [nomComplet, cv]);

  /** Apercu vivant de la colonne de droite, sur grand ecran uniquement. */
  const apercuLateral = (
    <AsideCard titre="Apercu en direct">
      <A4Preview>
        <CVSheet cv={cv} template={doc.template} />
      </A4Preview>
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
    <div className={etape === 0 ? page : pageWide}>
      <div className="mb-5">
        <Dots total={ETAPES.length} current={etape} />
        {etat && <p className="mt-2 text-center text-[.74rem] text-gray-400">{etat}</p>}
      </div>

      {/* ------------------------- 1. Le modele ------------------------- */}
      {etape === 0 && (
        <>
          <Title sub={ETAPES[0].sous}>{ETAPES[0].titre}</Title>

          {/* Deux modeles cote a cote au telephone, les quatre d'un coup sur
              grand ecran : on les compare mieux qu'en faisant defiler. */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                      de ce qu'on choisit. */}
                  <span className="block overflow-hidden rounded-lg" style={{ height: 196 }}>
                    <span
                      className="block origin-top-left"
                      style={{ transform: "scale(0.174)", width: 794, height: 1123 }}
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

          {/* Quatre mises en page x six couleurs se lisent comme vingt-quatre
              modeles, pour le prix d'une variable. « D'origine » rend au
              gabarit sa teinte propre. */}
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
            <Field label="Prenom et nom" value={nomComplet} onChange={setNomComplet} placeholder="Fatou Ndiaye" maxLength={80} />
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
                  { targetJob: cv.personalInfo.title, city: cv.personalInfo.location, parcours: cv.summary },
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
                      { id: e.id, jobTitle: e.title, employer: e.company, missions: e.bullets.join("\n") },
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
              onChange={(v) => patchCv({ skills: v })}
            />
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-[1.7rem] font-extrabold leading-tight text-gray-900 dark:text-white">
                {ETAPES[APERCU].titre}
              </h1>
              <p className="mt-1 text-[.9rem] text-gray-500">{ETAPES[APERCU].sous}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-green/40 px-3 py-1 text-[.8rem] font-bold text-green">
                {CV_TEMPLATES.find((t) => t.id === doc.template)?.name}
              </span>
              <button
                type="button"
                onClick={() => setEtape(1)}
                className="rounded-lg px-3 py-2 text-[.85rem] font-bold text-gray-500 transition hover:bg-gray-100 hover:text-green dark:hover:bg-white/10"
              >
                ✎ Modifier
              </button>
            </div>
          </div>

          <ExportA4
            filename={`CV-${(nomComplet || "sans-nom").replace(/[^\w-]+/g, "-")}.pdf`}
            title={`CV ${nomComplet}`.trim()}
            footer={
              templateIsPro(doc.template) && !abonne ? (
                <Note tone="warn">Ce modele est reserve a l&apos;abonnement Pro : le PDF sort avec le modele Moderne.</Note>
              ) : null
            }
          >
            <CVSheet cv={cv} template={doc.template} />
          </ExportA4>

          <p className="mt-4 text-center text-[.82rem] text-gray-400">
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
      {onApercu && (
        <button
          type="button"
          onClick={onApercu}
          className="hidden h-[52px] shrink-0 items-center rounded-xl border-[1.5px] border-green px-4 text-[.9rem] font-bold text-green transition active:scale-95 sm:flex"
        >
          Apercu
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
