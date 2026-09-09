"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import Accueil from "@/components/carriere/Accueil";
import Assistant, { type SortieAssistant } from "@/components/carriere/Assistant";
import CourrierWizard from "@/components/carriere/CourrierWizard";
import CVWizard from "@/components/carriere/CVWizard";
import MesDocuments, { type DocRow } from "@/components/carriere/MesDocuments";
import { api } from "@/components/carriere/ui";
import { effacerBrouillon, lireBrouillon } from "@/components/carriere/useDoc";
import ProUpgrade from "@/components/pro/ProUpgrade";
import { MigrationNotice } from "@/components/pro/ui";
import { documentVide } from "@/lib/carriere";
import type { CVContent, DemandeContent, LettreContent } from "@/lib/carriere";

/**
 * Ma Carriere — CV, lettre de motivation et demande d'emploi.
 *
 * ── Une route a part, et non un panneau du tableau de bord ───────────────
 * Ce module n'a rien a voir avec la vente d'annonces : son public cherche un
 * emploi, pas un acheteur. Il a donc sa propre porte d'entree et sa propre
 * barre du bas, a la facon de Mon Activite (voir app/mon-activite/page.tsx).
 * SiteShell reconnait /carriere comme un parcours autonome et retire
 * l'en-tete, le pied de page et la navigation basse du site public — sans
 * quoi deux barres du bas se superposeraient.
 *
 * ── Un seul ecran a la fois ─────────────────────────────────────────────
 * La navigation vit dans un etat local, pas dans l'URL : les editeurs
 * enregistrent en continu et un retour navigateur au milieu d'une saisie
 * ferait perdre le fil. Seule exception, `?ecran=documents`, pour pointer
 * quelqu'un directement sur ses documents.
 */

type Ecran =
  | { v: "accueil" }
  | { v: "documents" }
  | { v: "assistant" }
  | { v: "cv"; id?: string; prefill?: Partial<CVContent> }
  | { v: "lettre"; id?: string; prefill?: Partial<LettreContent> }
  | { v: "demande"; id?: string; prefill?: Partial<DemandeContent> }
  | { v: "peage" };

const TITRES: Record<Ecran["v"], string> = {
  accueil: "Ma Carriere",
  documents: "Mes documents",
  assistant: "Assistant",
  cv: "Creer mon CV",
  lettre: "Lettre de motivation",
  demande: "Demande d'emploi ou de stage",
  peage: "Passer a Pro",
};

export default function CarrierePage() {
  const [etat, setEtat] = useState<"chargement" | "nonConnecte" | "ferme" | "migration" | "pret">("chargement");
  const [ecran, setEcran] = useState<Ecran>({ v: "accueil" });
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [quota, setQuota] = useState<{ abonne: boolean; utilises: number; quota: number } | null>(null);
  /** Un moteur de redaction repond-il ? Faux = mode degrade assume. */
  const [ia, setIa] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const toast = (m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(null), 3500);
  };

  const charger = useCallback(async () => {
    try {
      const d = await api("documents", { action: "list" });
      setDocuments(d.documents || []);
      setQuota(d.quota || null);
      setIa(d.ia !== false);
      setEtat(d.needsMigration ? "migration" : "pret");
    } catch (e: any) {
      if (e?.status === 401) setEtat("nonConnecte");
      else if (e?.status === 403) setEtat("ferme");
      else setEtat("pret");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  /**
   * Le brouillon compose sans compte, repris juste apres la connexion.
   *
   * Quelqu'un cree un compte PRECISEMENT pour telecharger le document qu'il
   * vient d'ecrire. Le deposer sur l'accueil du module, en le laissant
   * retrouver son travail tout seul, serait la meilleure facon de le perdre a
   * la derniere marche.
   *
   * Une seule fois par visite (`reprisFaite`) : sans ce garde-fou, revenir a
   * l'accueil rouvrirait l'editeur en boucle et on ne pourrait plus rien
   * faire d'autre.
   */
  const reprisFaite = useRef(false);
  useEffect(() => {
    if (etat !== "pret" || reprisFaite.current) return;
    reprisFaite.current = true;
    for (const kind of ["cv", "lettre", "demande"] as const) {
      const brouillon = lireBrouillon(kind);
      if (!brouillon) continue;
      // Un brouillon vide n'a rien a reprendre — et il ne doit pas ouvrir un
      // editeur ni traîner dans le navigateur.
      if (documentVide(kind, brouillon)) {
        effacerBrouillon(kind);
        continue;
      }
      setEcran({ v: kind, prefill: brouillon as any });
      toast("On reprend la ou tu t'etais arrete.");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat]);

  // Lu depuis `window` et non par `useSearchParams`, qui imposerait
  // d'envelopper la page dans un <Suspense> pour un parametre facultatif —
  // le meme piege avait deja casse un build (voir app/mon-activite).
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("ecran") === "documents") {
        setEcran({ v: "documents" });
      }
    } catch {
      /* URL exotique : on reste sur l'accueil */
    }
  }, []);

  /**
   * Quota epuise ? On n'ouvre pas l'editeur.
   *
   * ── Ce que ce garde-fou repare ──────────────────────────────────────────
   * Le serveur refusait deja la creation (402), mais l'ecran ne le disait pas :
   * l'editeur s'ouvrait, on tapait son CV, l'enregistrement automatique
   * echouait, et il ne restait qu'un discret « erreur » dans un coin. On
   * croyait que ca passait — et on perdait son travail sans jamais savoir
   * pourquoi.
   *
   * Refuser a la PORTE vaut mieux que refuser apres coup : personne ne perd
   * ce qu'il a ecrit, et le peage s'explique avant l'effort, pas apres.
   *
   * Quota inconnu (`null`, lecture en echec) : on laisse passer. Un compteur
   * casse ne doit pas fermer le module — le serveur reste le juge.
   */
  const ouvrir = (cible: Ecran) => {
    if (quota && !quota.abonne && quota.utilises >= quota.quota) {
      setEcran({ v: "peage" });
      return;
    }
    setEcran(cible);
  };

  /** Retour a l'accueil du module, en rafraichissant la liste au passage. */
  const rentrer = () => {
    setEcran({ v: "accueil" });
    charger();
  };

  /**
   * Sortie de l'assistant : ses reponses deviennent le debut du document.
   *
   * Une candidature complete commence par le CV — la lettre s'appuie sur lui,
   * et l'editeur de courrier reprend ensuite les coordonnees saisies ici.
   */
  const depuisAssistant = (s: SortieAssistant) => {
    const r = s.reponses;

    // Les reponses deviennent le contexte du courrier : sans elles, la
    // redaction repartirait de zero et l'utilisateur aurait repondu pour rien.
    const contexte = s.demarche.questions
      .map((q) => (r[q.id] ? `${q.libelle} ${r[q.id]}` : ""))
      .filter(Boolean)
      .join("\n");

    // Le destinataire porte un nom different selon la demarche : on prend le
    // premier renseigne plutot que d'imposer un identifiant unique a toutes
    // les fiches.
    const destinataire =
      r.entreprise || r.destinataire || r.etablissement || r.operateur || r.commune || "";

    if (s.kind === "cv") {
      setEcran({
        v: "cv",
        prefill: {
          personalInfo: {
            firstName: "", lastName: "", title: r.poste || "", email: "", phone: "",
            location: r.ville || "", linkedin: "", photoUrl: "",
          },
        },
      });
      return;
    }

    if (s.kind === "lettre") {
      setEcran({
        v: "lettre",
        prefill: { company: destinataire, targetJob: r.poste || r.filiere || "", why: contexte },
      });
      return;
    }

    // Le courrier de demarche emporte sa fiche et ses reponses : l'editeur
    // affichera exactement les champs de cette demarche, pas ceux d'une
    // candidature.
    setEcran({
      v: "demande",
      prefill: {
        demarcheId: s.demarche.id,
        reponses: r,
        to: destinataire,
        objet: "",
      },
    });
  };

  const abonne = quota?.abonne === true;

  /**
   * Visiteur sans compte.
   *
   * L'ecran lui opposait un cadenas et « Connecte-toi ». Quelqu'un qui recoit
   * le lien par WhatsApp voyait une porte fermee sans savoir ce qu'il y avait
   * derriere, et repartait. Il compose desormais son document en entier ; la
   * connexion n'est demandee qu'au telechargement, quand il a quelque chose
   * entre les mains et une raison de creer un compte.
   */
  const invite = etat === "nonConnecte";

  /**
   * Emmene vers la connexion, et revient ici.
   *
   * Le brouillon reste dans le navigateur : il sera repris au retour, sans
   * quoi la creation de compte ferait perdre le travail qu'elle recompense.
   */
  const versConnexion = () => {
    window.location.href = "/connexion?redirect=/carriere";
  };

  /** Les deux ecrans de navigation, par opposition aux parcours de creation. */
  const surAccueil = ecran.v === "accueil" || ecran.v === "documents";

  return (
    // `isolate` : le fond lumineux ci-dessous est en z-index negatif. Sans
    // contexte d'empilement ici, il passerait sous le fond de la page et on ne
    // verrait rien du tout.
    <div className="relative isolate min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Aurore de fond — deux nappes lumineuses fixes, tres diluees.
          `fixed` et non `absolute` : elles doivent rester en place quand la
          page defile, sinon la lueur file vers le haut et disparait. Elles ne
          captent aucun clic et se dissipent presque entierement en theme
          clair, ou un neon sur blanc salirait au lieu d'eclairer. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-green/10 blur-[110px] dark:bg-green/25" />
        <span className="absolute -right-24 top-1/3 h-[380px] w-[380px] rounded-full bg-neon-magenta/10 blur-[110px] dark:bg-neon-magenta/20" />
      </div>

      {/* Barre du haut : un seul niveau de retour, jamais plus. */}
      <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-100 bg-white px-4 dark:border-dark-border dark:bg-dark-900">
        {ecran.v === "accueil" ? (
          <>
            <Link href="/" aria-label={`Retour sur ${BRAND.name}`} className="shrink-0">
              <img src="/logo-full.jpg" alt={BRAND.name} className="h-9 w-auto rounded-[6px] object-contain" />
            </Link>
            <span className="truncate font-display text-[1.05rem] font-extrabold text-gray-900 dark:text-white">
              Ma Carriere
            </span>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={rentrer}
              aria-label="Retour"
              className="-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-[1.3rem] text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              ‹
            </button>
            <span className="truncate font-display text-[1.05rem] font-extrabold text-gray-900 dark:text-white">
              {TITRES[ecran.v]}
            </span>
          </>
        )}

        {/* Navigation de grand ecran : elle prend le relais de la barre du bas,
            masquee a partir de `lg`. Sans elle, un utilisateur sur ordinateur
            n'aurait plus aucun moyen de sortir du module. */}
        <div className="ml-auto hidden items-center gap-1 lg:flex">
          <button
            type="button"
            onClick={() => (invite ? versConnexion() : setEcran({ v: "documents" }))}
            className="rounded-lg px-3 py-2 text-[.85rem] font-bold text-gray-500 transition hover:bg-gray-100 hover:text-green dark:hover:bg-white/10"
          >
            Mes documents
          </button>
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-[.85rem] font-bold text-gray-500 transition hover:bg-gray-100 hover:text-green dark:hover:bg-white/10"
          >
            Accueil
          </Link>
          <Link
            href="/profil"
            className="rounded-lg px-3 py-2 text-[.85rem] font-bold text-gray-500 transition hover:bg-gray-100 hover:text-green dark:hover:bg-white/10"
          >
            Profil
          </Link>
        </div>
      </div>

      {etat === "chargement" && <p className="py-20 text-center text-gray-400">Chargement…</p>}

      {etat === "ferme" && (
        <div className="mx-auto mt-10 max-w-[460px] rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-dark-border dark:bg-dark-800">
          <p className="text-[2rem]" aria-hidden="true">🚧</p>
          <h2 className="mt-2 font-display text-[1.1rem] font-extrabold text-gray-900 dark:text-white">
            Bientôt disponible
          </h2>
          <p className="mt-2 text-[.9rem] leading-relaxed text-gray-600 dark:text-gray-400">
            Ma Carrière est en cours de finition. Le module ouvrira à tous très bientôt.
          </p>
          <Link href="/dashboard" className="btn btn-green mt-5 inline-block px-6 py-3">
            Retour au tableau de bord
          </Link>
        </div>
      )}

      {etat === "migration" && (
        <div className="px-4 py-8">
          <MigrationNotice file="MIGRATION_MA_CARRIERE.sql" />
        </div>
      )}

      {(etat === "pret" || invite) && (
        <>
          {ecran.v === "accueil" && (
            <Accueil
              ia={ia}
              quota={quota}
              invite={invite}
              onAssistant={() => ouvrir({ v: "assistant" })}
              onCv={() => ouvrir({ v: "cv" })}
              onLettre={() => ouvrir({ v: "lettre" })}
              onDemande={(type) => ouvrir({ v: "demande", prefill: { demarcheId: "emploi", reponses: { offre: type === "stage" ? "Non, candidature spontanee" : "" } } })}
              onDocuments={() => (invite ? versConnexion() : setEcran({ v: "documents" }))}
            />
          )}

          {ecran.v === "documents" && (
            <MesDocuments
              documents={documents}
              abonne={abonne}
              onOuvrir={(d) =>
                setEcran(d.kind === "cv" ? { v: "cv", id: d.id } : { v: d.kind, id: d.id })
              }
              onNouveau={() => setEcran({ v: "accueil" })}
              onRecharger={charger}
              toast={toast}
            />
          )}

          {ecran.v === "assistant" && (
            <Assistant ia={ia} onTerminer={depuisAssistant} onQuitter={rentrer} toast={toast} />
          )}

          {ecran.v === "cv" && (
            <CVWizard
              docId={ecran.id}
              prefill={ecran.prefill}
              abonne={abonne}
              invite={invite}
              onQuitter={rentrer}
              onPeage={() => setEcran({ v: "peage" })}
              onConnexion={versConnexion}
              toast={toast}
            />
          )}

          {(ecran.v === "lettre" || ecran.v === "demande") && (
            <CourrierWizard
              kind={ecran.v}
              docId={ecran.id}
              prefill={ecran.prefill}
              abonne={abonne}
              invite={invite}
              onQuitter={rentrer}
              onPeage={() => setEcran({ v: "peage" })}
              onConnexion={versConnexion}
              toast={toast}
            />
          )}

          {ecran.v === "peage" && (
            <div className="px-4 py-6">
              {/* Le peage porte sur les DOCUMENTS crees dans le mois, pas sur
                  les redactions : ce message annoncait « tes redactions
                  assistees sont utilisees » alors qu'on peut reecrire un texte
                  autant qu'on veut. Il promettait la mauvaise chose au mauvais
                  moment. */}
              <ProUpgrade
                module="carriere"
                quotaInclus={quota?.quota ?? 1}
                message={
                  quota
                    ? `Tu as créé ${quota.utilises} document${quota.utilises > 1 ? "s" : ""} sur ${quota.quota} ce mois-ci. Le Pro lève la limite et ouvre tous les modèles — réécrire tes textes, lui, n'a jamais été compté.`
                    : undefined
                }
                onClose={rentrer}
              />
            </div>
          )}
        </>
      )}

      {/* Barre du bas du module. Elle ne remplace pas celle du site : SiteShell
          masque la navigation publique sur /carriere, il n'y en a donc qu'une
          a l'ecran.

          `lg:hidden`, comme la navigation basse du site : une barre d'onglets
          collee en bas est une convention de telephone. Sur un ecran
          d'ordinateur elle mange la hauteur utile pour rien — les memes liens
          vivent alors dans la barre du haut. */}
      <nav
        aria-label="Navigation Ma Carriere"
        // Effacee pendant un parcours de creation : l'editeur y installe sa
        // propre barre d'action (« Retour / Apercu / Continuer »). Empiler les
        // deux mangerait un tiers de la hauteur d'un telephone, et le doigt
        // finirait par changer d'onglet en voulant valider une etape.
        hidden={!surAccueil}
        className="fixed inset-x-0 bottom-0 z-[800] flex border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl dark:border-white/5 dark:bg-[#0A0E14]/90 lg:hidden"
      >
        <Link href="/" className="flex min-h-[52px] flex-1 flex-col items-center gap-1 py-1 text-[.65rem] font-medium text-gray-400">
          <span aria-hidden="true">🏠</span>
          Accueil
        </Link>
        <button
          type="button"
          onClick={rentrer}
          aria-current="page"
          className="flex min-h-[52px] flex-1 flex-col items-center gap-1 py-1 text-[.65rem] font-bold text-green"
        >
          <span aria-hidden="true">💼</span>
          Ma Carriere
        </button>
        <Link href="/profil" className="flex min-h-[52px] flex-1 flex-col items-center gap-1 py-1 text-[.65rem] font-medium text-gray-400">
          <span aria-hidden="true">👤</span>
          Profil
        </Link>
      </nav>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-[9999] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-[10px] border border-neon-gold bg-dark-900 px-5 py-2.5 text-center text-[.88rem] font-medium text-white shadow-lg"
        >
          {message}
        </div>
      )}
    </div>
  );
}
