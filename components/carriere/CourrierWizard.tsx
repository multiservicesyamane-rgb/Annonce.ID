"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ExportA4 from "./ExportA4";
import LettreSheet from "./LettreSheet";
import { useDoc } from "./useDoc";
import A4Preview from "@/components/pro/A4Preview";
import {
  ActionBar, AiBtn, Area, AsideCard, BandeauVerrou, BarreOutils, Field, Note,
  OutilBtn, OutlineBtn, PanneauOutil, PrimaryBtn, ZOOMS,
  Split, Steps, Title, api, card, input, lbl, messageAvantFinalisation, pageWide,
} from "./ui";
import { LETTRE_TEMPLATES, resumeDossier } from "@/lib/carriere";
import type { CVContent, DemandeContent, Genre, LettreContent } from "@/lib/carriere";
import { demarcheParId, destinataireDe, enTeteDe, objetDe, type Demarche } from "@/lib/demarches";

/**
 * Lettre de motivation et courrier de demarche.
 *
 * ── Les champs viennent de la fiche, pas d'un formulaire fige ────────────
 * La premiere version affichait « Entreprise / Domaine / Disponibilite »
 * quelle que soit la demande : on demandait donc son entreprise a quelqu'un
 * qui declare la perte de sa carte d'identite. Pour un courrier de demarche,
 * les champs sont maintenant EXACTEMENT les questions de la fiche
 * (lib/demarches.ts), et le destinataire porte le nom qui convient —
 * commissariat, mairie, greffe, service client.
 *
 * La lettre de motivation garde ses champs propres : entreprise, poste,
 * recruteur, motivation. Ce sont les bons, et ils ne changent pas.
 */

const ETAPES = ["Informations", "Courrier", "Apercu"];

/** Miniature d un gabarit : seule la largeur est un choix, le reste suit. */
const VIGNETTE_W = 92;
const VIGNETTE_SCALE = VIGNETTE_W / 794;
const VIGNETTE_H = Math.round(1123 * VIGNETTE_SCALE);

export default function CourrierWizard({
  kind,
  docId,
  prefill,
  abonne,
  onQuitter,
  onPeage,
  toast,
}: {
  kind: "lettre" | "demande";
  docId?: string;
  /** Reponses deja donnees a l'assistant. */
  prefill?: Partial<LettreContent & DemandeContent>;
  abonne: boolean;
  onQuitter: () => void;
  onPeage: () => void;
  toast: (m: string) => void;
}) {
  const doc = useDoc(kind, docId, prefill);
  /** Panneau « Modele » deplie sous la barre de l apercu. */
  const [panneauModele, setPanneauModele] = useState(false);
  /** Zoom de l apercu final. Index dans ZOOMS ; 1 = page entiere. */
  const [iZoomCourrier, setIZoomCourrier] = useState(1);
  const c = doc.content as LettreContent & DemandeContent;
  // Meme regle que pour les CV : un courrier deja ecrit s ouvre sur sa page,
  // pas sur le questionnaire.
  const [etape, setEtape] = useState(docId ? ETAPES.length - 1 : 0);
  const [genre, setGenre] = useState<Genre>("?");
  const [busy, setBusy] = useState(false);

  const patch = (p: Partial<LettreContent & DemandeContent>) => doc.patch(p as Record<string, unknown>);
  const patchFrom = (p: Partial<LettreContent["from"]>) => patch({ from: { ...c.from, ...p } });
  const repondre = (id: string, v: string) => patch({ reponses: { ...(c.reponses || {}), [id]: v } });

  /** La fiche qui pilote le courrier. Repli sur la candidature a un emploi. */
  const demarche: Demarche | undefined = useMemo(
    () => (kind === "demande" ? demarcheParId(c.demarcheId || "emploi") || demarcheParId("emploi") : undefined),
    [kind, c.demarcheId],
  );

  const enTete = demarche ? enTeteDe(demarche.id) : null;
  const reponses = c.reponses || {};

  /* ------------------- Le dernier CV, repris deux fois ------------------- */
  // 1. Les coordonnees : les recopier evite de retaper nom, telephone et
  //    e-mail a chaque courrier.
  // 2. Le parcours : il part avec la demande de redaction. Une lettre de
  //    motivation ecrite sans connaitre le CV du candidat ne peut produire
  //    qu'un texte interchangeable — c'est ce qu'elle faisait jusqu'ici.
  const tente = useRef(false);
  const [dossier, setDossier] = useState("");
  useEffect(() => {
    // On va chercher le CV meme si les coordonnees sont deja remplies : c'est
    // le parcours qui nous interesse dans ce cas.
    if (tente.current || doc.chargement) return;
    tente.current = true;
    (async () => {
      try {
        const liste = await api("documents", { action: "list" });
        const dernierCv = (liste.documents || []).find((d: any) => d.kind === "cv");
        if (!dernierCv) return;
        const d = await api("documents", { action: "get", id: dernierCv.id });
        const cv = d.document?.content as CVContent | undefined;
        if (!cv?.personalInfo) return;
        setDossier(resumeDossier(cv));
        if (c.from.name.trim()) return;
        const p = cv.personalInfo;
        patchFrom({
          name: `${p.firstName} ${p.lastName}`.trim(),
          phone: p.phone,
          email: p.email,
          city: p.location,
        });
      } catch {
        /* pas de CV, ou liste illisible : l'utilisateur saisira a la main */
      }
    })();
  }, [doc.chargement, c.from.name]); // eslint-disable-line react-hooks/exhaustive-deps

  /* -------------- Objet et destinataire proposes par la fiche -------------- */
  const objet =
    kind === "lettre"
      ? `Candidature au poste de ${c.targetJob || "…"}`
      : c.objet?.trim() || (demarche ? objetDe(demarche.id, reponses) : "");

  const destinataire =
    kind === "lettre"
      ? [c.recruiter, c.company].filter(Boolean).join("\n")
      : c.to?.trim() || (demarche ? destinataireDe(demarche.id, reponses) : "");

  /* ----------------------------- La redaction ----------------------------- */

  async function rediger() {
    setBusy(true);
    try {
      const charge =
        kind === "lettre"
          ? {
              company: c.company,
              targetJob: c.targetJob,
              recruiter: c.recruiter,
              why: c.why,
              city: c.from.city,
              // Le parcours reel du candidat, extrait de son dernier CV.
              dossier,
            }
          : {
              demarche: demarche?.nom || "",
              // Envoyes en plus du contexte redige : le repli sans IA
              // recompose le courrier a partir de la fiche et des reponses
              // brutes, il lui faut donc les identifiants d'origine.
              demarcheId: demarche?.id || "",
              reponses,
              destinataire,
              objet,
              city: c.from.city,
              // Les reponses partent avec LEUR LIBELLE : « Quel document as-tu
              // perdu ? Carte d'identite ». Un modele qui recoit seulement
              // « document: carte » devine, et devine parfois mal.
              contexte: (demarche?.questions || [])
                .map((q) => (reponses[q.id] ? `${q.libelle} ${reponses[q.id]}` : ""))
                .filter(Boolean)
                .join("\n"),
            };
      const d = await api("generate", { targets: [kind === "lettre" ? "lettre" : "demande"], genre, kind, ...charge });
      const texte = d.textes?.lettre || d.textes?.demande;
      if (!texte) {
        toast("La redaction n'a rien renvoye. Reessaie.");
        return;
      }
      // On fige l'objet et le destinataire au moment de la redaction : ce sont
      // eux qui apparaissent sur la page, ils ne doivent plus bouger tout
      // seuls si une reponse change ensuite.
      patch({ body: texte, ...(kind === "demande" ? { objet, to: destinataire } : {}) });
      // Un texte de modele n'est pas un texte redige : on le signale plutot que
      // de laisser croire a une personnalisation qui n'a pas eu lieu.
      if (d.moteur === "modele") toast("Texte compose sans IA : relis-le et personnalise-le.");
      setEtape(1);
    } catch (e: any) {
      if (e?.status === 402) onPeage();
      else toast(e?.message || "Redaction impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (doc.chargement) return <p className="py-20 text-center text-gray-400">Chargement…</p>;

  /* ------------------------- Le choix du modele -------------------------
     Defini une seule fois : l'apercu lateral et l'apercu final montrent la
     meme barre. Les gabarits de courrier ont leurs propres identifiants
     (« l_… ») — un gabarit de CV enregistre par erreur retomberait sur le
     classique plutot que sur une page blanche. */

  // Changer de mise en page EST une modification : sur un courrier fini,
  // l'enregistrement automatique est coupe, et laisser le bouton agir
  // changerait la page a l'ecran sans rien garder.
  const outilsCourrier = (compact: boolean) => (
    <OutilBtn
      icone={doc.verrouille ? "🔒" : "▦"}
      compact={compact}
      actif={panneauModele}
      onClick={() => (doc.verrouille ? onPeage() : setPanneauModele((v) => !v))}
    >
      Modele
    </OutilBtn>
  );

  const panneauCourrier = panneauModele ? (
    <PanneauOutil titre="Modele" sur={LETTRE_TEMPLATES.find((t) => t.id === doc.template)?.name}>
      {/* Bande horizontale de vraies miniatures : « Colonne » ou « Initiale »
          ne disent rien de ce qu'on choisit, l'image le montre. */}
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2">
        {LETTRE_TEMPLATES.map((t) => {
          const choisi = doc.template === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => doc.setTemplate(t.id as never)}
              aria-pressed={choisi}
              className={
                "shrink-0 rounded-xl border-2 bg-white p-1.5 transition dark:bg-dark-900 " +
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
                    <LettreSheet
                      from={c.from}
                      to={destinataire}
                      objet={objet}
                      corps={c.body}
                      template={t.id}
                    />
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
            </button>
          );
        })}
      </div>
    </PanneauOutil>
  ) : null;

  const apercuLateral = (
    <AsideCard titre="Apercu du courrier">
      <BarreOutils
        compact
        outils={outilsCourrier(true)}
        panneau={panneauCourrier}
        onFermer={() => setPanneauModele(false)}
        iZoom={iZoomCourrier}
        setIZoom={setIZoomCourrier}
      >
        <A4Preview zoom={ZOOMS[iZoomCourrier]}>
          <LettreSheet from={c.from} to={destinataire} objet={objet} corps={c.body} template={doc.template} />
        </A4Preview>
      </BarreOutils>
    </AsideCard>
  );

  /** Assez rempli pour etre redige ? */
  const pret = kind === "lettre" ? !!c.company.trim() : !!destinataire.trim();

  return (
    <div className={pageWide}>
      <Steps steps={ETAPES} current={etape} />

      {/* ---------------------- 1. Les informations ---------------------- */}
      {etape === 0 && (
        <Split aside={apercuLateral}>
          <Title
            sub={
              kind === "lettre"
                ? "Quelques reponses suffisent pour creer une lettre personnalisee."
                : demarche?.resume || "Reponds aux questions, je redige le courrier."
            }
          >
            {kind === "lettre" ? "Preparons ta lettre" : demarche?.nom || "Ton courrier"}
          </Title>

          {kind === "demande" && demarche?.avertissement && <Note tone="warn">{demarche.avertissement}</Note>}

          <div className="mt-4 space-y-4">
            {kind === "lettre" ? (
              <>
                <Field label="Entreprise" value={c.company} onChange={(v) => patch({ company: v })} placeholder="SunuCom" maxLength={120} />
                <Field label="Poste vise" value={c.targetJob} onChange={(v) => patch({ targetJob: v })} placeholder="Assistante commerciale" maxLength={100} />
                <Field label="Nom du recruteur" value={c.recruiter} onChange={(v) => patch({ recruiter: v })} placeholder="Equipe recrutement" maxLength={100} />
                <Area
                  label="Pourquoi ce poste ?"
                  value={c.why}
                  onChange={(v) => patch({ why: v })}
                  placeholder="Ce qui t'interesse dans ce poste et ce que tu sais faire."
                  rows={5}
                  maxLength={800}
                />
              </>
            ) : (
              <>
                <Field
                  label={enTete?.libelle || "Destinataire"}
                  value={c.to}
                  onChange={(v) => patch({ to: v })}
                  placeholder={demarche ? destinataireDe(demarche.id, reponses) : ""}
                  maxLength={160}
                />

                {/* Les champs de la demarche, et eux seuls. */}
                {(demarche?.questions || []).map((q) =>
                  q.type === "choix" ? (
                    <label key={q.id} className="block">
                      <span className={lbl}>{q.libelle}</span>
                      <select
                        value={reponses[q.id] || ""}
                        onChange={(e) => repondre(q.id, e.target.value)}
                        className={input}
                      >
                        <option value="">Choisir…</option>
                        {(q.options || []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                      {q.aide && <span className="mt-1 block text-[.78rem] text-gray-400">{q.aide}</span>}
                    </label>
                  ) : (
                    <Area
                      key={q.id}
                      label={q.libelle}
                      value={reponses[q.id] || ""}
                      onChange={(v) => repondre(q.id, v)}
                      placeholder={q.aide || ""}
                      rows={2}
                      maxLength={600}
                    />
                  ),
                )}

                <Field
                  label="Objet du courrier"
                  value={c.objet}
                  onChange={(v) => patch({ objet: v })}
                  placeholder={demarche ? objetDe(demarche.id, reponses) : ""}
                  maxLength={200}
                />
              </>
            )}
          </div>

          <section className={card + " mt-6 space-y-4"}>
            <div>
              <p className="text-[.95rem] font-bold text-gray-900 dark:text-white">Tes coordonnees</p>
              <p className="mt-1 text-[.82rem] text-gray-500">Elles signent le courrier, en bas de la page.</p>
            </div>
            <Field label="Prenom et nom" value={c.from.name} onChange={(v) => patchFrom({ name: v })} placeholder="Moussa Diop" maxLength={80} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Telephone" value={c.from.phone} onChange={(v) => patchFrom({ phone: v })} placeholder="+221 77 000 00 00" type="tel" maxLength={40} />
              <Field label="Ville" value={c.from.city} onChange={(v) => patchFrom({ city: v })} placeholder="Dakar" maxLength={80} />
            </div>
            <Field label="Adresse e-mail" value={c.from.email} onChange={(v) => patchFrom({ email: v })} placeholder="nom@email.com" type="email" maxLength={120} />
          </section>

          <div className="mt-6 flex flex-wrap items-end justify-end gap-3">
            <label className="min-w-[150px]">
              <span className={lbl}>Accord du texte</span>
              <select value={genre} onChange={(e) => setGenre(e.target.value as Genre)} className={input + " py-2"}>
                <option value="?">Sans accord</option>
                <option value="f">Au feminin</option>
                <option value="m">Au masculin</option>
              </select>
            </label>
          </div>

          <ActionBar>
            {c.body.trim() && (
              <button
                type="button"
                onClick={() => setEtape(1)}
                className="hidden h-[52px] shrink-0 items-center rounded-xl border-[1.5px] border-green px-4 text-[.9rem] font-bold text-green transition active:scale-95 sm:flex"
              >
                Texte redige
              </button>
            )}
            <PrimaryBtn onClick={rediger} disabled={busy || !pret}>
              <span aria-hidden="true">{busy ? "⏳" : "✨"}</span>
              {busy ? "Redaction en cours…" : "Rediger le courrier"}
            </PrimaryBtn>
          </ActionBar>
        </Split>
      )}

      {/* ------------------------- 2. Le texte ------------------------- */}
      {etape === 1 && (
        <Split aside={apercuLateral}>
          <Title sub="Relis et corrige : c'est ton courrier, pas celui de la machine.">Ton texte</Title>

          <Area
            label="Corps du courrier"
            value={c.body}
            onChange={(v) => patch({ body: v })}
            rows={16}
            maxLength={4000}
            placeholder="Le texte genere apparaitra ici."
          />

          <div className="mt-4 flex justify-end">
            <AiBtn busy={busy} onClick={rediger}>
              Recommencer la redaction
            </AiBtn>
          </div>

          <Note>
            Verifie les noms, les dates et les chiffres avant d&apos;envoyer. Un courrier qui se trompe
            de destinataire se remarque tout de suite.
          </Note>

          <ActionBar>
            <button
              type="button"
              onClick={() => setEtape(0)}
              aria-label="Retour"
              className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl border-[1.5px] border-gray-200 text-[1.3rem] text-gray-500 transition active:scale-95 dark:border-white/15"
            >
              ‹
            </button>
            <PrimaryBtn onClick={() => setEtape(2)} disabled={!c.body.trim()}>
              Voir la page
            </PrimaryBtn>
          </ActionBar>
        </Split>
      )}

      {/* -------------------------- 3. L'apercu -------------------------- */}
      {etape === 2 && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-[1.7rem] font-extrabold leading-tight text-gray-900 dark:text-white">
                Apercu du courrier
              </h1>
              <p className="mt-1 text-[.9rem] text-gray-500">Verifie ton document avant de l&apos;envoyer.</p>
            </div>
            <button
              type="button"
              onClick={() => (doc.verrouille ? onPeage() : setEtape(1))}
              className="rounded-lg px-3 py-2 text-[.85rem] font-bold text-gray-500 transition hover:bg-gray-100 hover:text-green dark:hover:bg-white/10"
            >
              {doc.verrouille ? "🔒" : "✎"} Modifier le texte
            </button>
          </div>

          <ExportA4
            filename={`${(objet || "courrier").replace(/[^\w-]+/g, "-").slice(0, 60)}.pdf`}
            title={objet}
            avertissement={
              !abonne && !doc.verrouille
                ? messageAvantFinalisation(kind === "lettre" ? "ta lettre" : "ton courrier")
                : null
            }
            onTelecharge={doc.finaliser}
            footer={
              doc.verrouille ? (
                <BandeauVerrou quoi={kind === "lettre" ? "Cette lettre" : "Ce courrier"} onPeage={onPeage} />
              ) : null
            }
            aside={
              <div className="mb-4 border-b border-gray-100 pb-4 dark:border-white/10">
                <p className="text-[.68rem] font-bold uppercase tracking-[.06em] text-gray-400">Ton document</p>
                <p className="mt-1.5 text-[.95rem] font-extrabold leading-snug text-gray-900 dark:text-white">
                  {objet || (kind === "lettre" ? "Lettre de motivation" : "Courrier")}
                </p>
                {destinataire.trim() && (
                  <p className="mt-0.5 line-clamp-2 text-[.8rem] text-gray-500">
                    Pour {destinataire.split("\n")[0]}
                  </p>
                )}
                <p className="mt-3 flex items-start gap-2 text-[.78rem] leading-relaxed text-gray-500">
                  <span className="text-green" aria-hidden="true">✓</span>
                  <span>
                    Enregistre dans <strong className="text-gray-700 dark:text-gray-300">Mes documents</strong>.
                  </span>
                </p>
              </div>
            }
          >
            <LettreSheet from={c.from} to={destinataire} objet={objet} corps={c.body} template={doc.template} />
          </ExportA4>

          {/* Au telephone seulement : sur grand ecran le rappel est dans le
              panneau de droite. */}
          <p className="mt-4 text-center text-[.82rem] text-gray-400 lg:hidden">
            Ton courrier est enregistre dans <strong className="text-gray-500">Mes documents</strong>.
          </p>

          <div className="mx-auto mt-5 hidden sm:max-w-[420px] lg:block">
            <OutlineBtn onClick={onQuitter}>Retour a Ma Carriere</OutlineBtn>
          </div>
        </>
      )}
    </div>
  );
}
