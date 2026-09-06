"use client";

import { useState } from "react";
import { ActionBar, Dots, Note, PrimaryBtn, Title, api, input, lbl, page, pageWide } from "./ui";
import type { CareerKind } from "@/lib/carriere";
import {
  DEMARCHES, avertissementsDe, demarcheParId, piecesDe, trouverParMots, type Demarche,
} from "@/lib/demarches";

/**
 * L'assistant — il comprend une demande ecrite librement, puis il guide.
 *
 * ── Ce qu'il fait, et ce qu'il ne fait pas ───────────────────────────────
 * L'utilisateur ecrit ce qu'il veut, avec ses mots. L'IA sert uniquement a
 * reconnaitre DE QUELLE demarche il parle (voir app/api/carriere/router).
 * Ensuite, tout vient de lib/demarches.ts : les questions posees, les pieces
 * a fournir, l'institution ou les obtenir. Le modele ne decrit jamais une
 * procedure administrative — il se tromperait, et quelqu'un irait au mauvais
 * guichet avec le mauvais dossier.
 *
 * ── Deux colonnes au recapitulatif ──────────────────────────────────────
 * « Ce que je redige pour toi » d'un cote, « Ce que tu dois fournir » de
 * l'autre, avec ou l'obtenir. C'est la regle du module : le site ne fabrique
 * jamais une piece delivree par une administration.
 */

const EXEMPLES = [
  "Je veux voyager en France",
  "J'ai perdu ma carte d'identite",
  "Je cherche un emploi",
  "Je veux creer mon entreprise",
  "Je veux resilier mon abonnement Orange",
  "Je veux porter plainte",
];

export type SortieAssistant = {
  demarche: Demarche;
  reponses: Record<string, string>;
  /** L'editeur a ouvrir en premier. */
  kind: CareerKind;
};

export default function Assistant({
  ia,
  onTerminer,
  onQuitter,
  toast,
}: {
  /** Un moteur de redaction repond-il ? Faux = mode degrade assume. */
  ia: boolean;
  onTerminer: (s: SortieAssistant) => void;
  onQuitter: () => void;
  toast: (m: string) => void;
}) {
  const [demande, setDemande] = useState("");
  const [demarche, setDemarche] = useState<Demarche | null>(null);
  const [catalogue, setCatalogue] = useState<{ id: string; nom: string; resume: string }[] | null>(null);
  const [reponses, setReponses] = useState<Record<string, string>>({});
  /** -1 : la demande libre. 0..n-1 : les questions. n : le recapitulatif. */
  const [etape, setEtape] = useState(-1);
  const [busy, setBusy] = useState(false);
  /** L'IA a-t-elle releve des informations dans la phrase ? */
  const [compris, setCompris] = useState(false);
  /**
   * La demarche vient-elle d'une vraie comprehension, ou d'une correspondance
   * de mots-cles ? Une supposition se fait confirmer, elle ne s'impose pas :
   * « resilier mon contrat de mariage » contient « mariage » ET « resilier »,
   * et enchainer sur la mauvaise fiche est exactement ce qui rend l'assistant
   * incoherent.
   */
  const [supposition, setSupposition] = useState(false);

  async function router(texte: string) {
    const t = texte.trim();
    if (t.length < 3) {
      toast("Ecris en quelques mots ce dont tu as besoin.");
      return;
    }
    setBusy(true);
    setCatalogue(null);
    try {
      // L'IA passe en premier : elle reconnait la demarche ET releve ce que la
      // phrase contient deja. La reconnaissance locale ne servait qu'a router,
      // et l'intercepter avant l'IA revenait a ne jamais lire la phrase.
      const d = await api("router", { texte: t });
      if (d.demarche) {
        setDemarche(d.demarche);
        setReponses(d.reponses || {});
        setCompris(Object.keys(d.reponses || {}).length > 0);

        if (d.parIA === false) {
          // Mots-cles : on s'arrete et on demande confirmation.
          setSupposition(true);
          setCatalogue(d.catalogue || null);
          return;
        }

        setSupposition(false);
        // On reprend a la premiere question restee sans reponse.
        const questions = d.demarche.questions || [];
        const premiere = questions.findIndex((q: any) => !(d.reponses || {})[q.id]);
        setEtape(premiere < 0 ? questions.length : premiere);
      } else {
        // Jamais de mur : on montre le catalogue et l'utilisateur choisit.
        setCatalogue(d.catalogue || []);
      }
    } catch {
      // L'IA n'a pas repondu (session, reseau, quota). On retombe sur la
      // reconnaissance par mots-cles, en local : « visa », « plainte »,
      // « ninea » suffisent. Et si elle ne trouve pas non plus, le catalogue.
      const directe = trouverParMots(t);
      if (directe) {
        setDemarche(directe);
        setEtape(0);
      } else {
        setCatalogue(DEMARCHES.map((d) => ({ id: d.id, nom: d.nom, resume: d.resume })));
      }
    } finally {
      setBusy(false);
    }
  }

  /** Choix direct dans le catalogue : aucune raison de repasser par le reseau. */
  function choisirDansCatalogue(id: string) {
    const d = demarcheParId(id);
    if (!d) return;
    setDemarche(d);
    setCatalogue(null);
    setEtape(0);
  }

  /* ====================== 1. La demande, en clair ====================== */

  if (etape === -1 || !demarche) {
    return (
      <div className={page}>
        <Title sub="Ecris ce dont tu as besoin, avec tes mots. Je te guide ensuite.">
          De quoi as-tu besoin ?
        </Title>

        {!ia && (
          <Note tone="warn">
            L&apos;assistant IA est indisponible : je ne pourrai pas lire ta phrase finement.
            Je te proposerai une demarche a confirmer, et tu pourras corriger.
          </Note>
        )}

        <label className="block">
          <span className={lbl}>Ta demande</span>
          <textarea
            rows={4}
            value={demande}
            maxLength={500}
            autoFocus
            placeholder="Exemple : je veux voyager en France pour mes etudes"
            onChange={(e) => setDemande(e.target.value)}
            className={input + " resize-y leading-relaxed"}
          />
        </label>

        <p className="mb-2 mt-5 text-[.82rem] font-semibold text-gray-500">Ou choisis un exemple :</p>
        <div className="flex flex-wrap gap-2">
          {EXEMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setDemande(ex);
                router(ex);
              }}
              className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[.84rem] text-gray-600 transition hover:border-green hover:text-green dark:border-white/15 dark:bg-dark-800 dark:text-gray-300"
            >
              {ex}
            </button>
          ))}
        </div>

        {catalogue && (
          <section className="mt-6">
            <Note tone="warn">Je n&apos;ai pas reconnu ta demande. Choisis dans la liste.</Note>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {catalogue.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => choisirDansCatalogue(c.id)}
                  className="rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-green dark:border-white/10 dark:bg-dark-800"
                >
                  <span className="block text-[.92rem] font-bold text-gray-900 dark:text-white">{c.nom}</span>
                  <span className="block text-[.8rem] text-gray-500">{c.resume}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <p className="mt-6 text-center text-[.8rem] text-gray-400">
          🔒 Tes informations restent sur ton compte.
        </p>

        <ActionBar>
          <Retour onClick={onQuitter} />
          <PrimaryBtn onClick={() => router(demande)} disabled={busy}>
            {busy ? "Je lis ta demande…" : "Continuer"}
          </PrimaryBtn>
        </ActionBar>
      </div>
    );
  }

  /* ============== 1 bis. La supposition, a confirmer ============== */

  if (supposition) {
    return (
      <div className={page}>
        <Title sub="Je n'ai pas pu analyser ta phrase — l'assistant IA est indisponible.">
          C&apos;est bien de ca qu&apos;il s&apos;agit ?
        </Title>

        <Note tone="warn">
          J&apos;ai devine a partir des mots de ta demande, ce qui se trompe souvent.
          Confirme, ou choisis toi-meme dans la liste.
        </Note>

        <button
          type="button"
          onClick={() => {
            setSupposition(false);
            setCatalogue(null);
            setEtape(0);
          }}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-green bg-green/5 px-4 py-4 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[1rem] font-bold text-green">{demarche.nom}</span>
            <span className="mt-0.5 block text-[.84rem] text-gray-500">{demarche.resume}</span>
          </span>
          <span className="shrink-0 text-[1.2rem] text-green" aria-hidden="true">›</span>
        </button>

        {catalogue && (
          <>
            <p className="mb-2 mt-6 text-[.85rem] font-semibold text-gray-500">Ou alors :</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {catalogue
                .filter((c) => c.id !== demarche.id)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => choisirDansCatalogue(c.id)}
                    className="rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-green dark:border-white/10 dark:bg-dark-800"
                  >
                    <span className="block text-[.92rem] font-bold text-gray-900 dark:text-white">{c.nom}</span>
                    <span className="block text-[.8rem] text-gray-500">{c.resume}</span>
                  </button>
                ))}
            </div>
          </>
        )}

        <ActionBar>
          <Retour onClick={() => { setSupposition(false); setDemarche(null); setEtape(-1); }} />
        </ActionBar>
      </div>
    );
  }

  const questions = demarche.questions;

  /* ======================= 2. Le recapitulatif ======================= */

  if (etape >= questions.length) {
    // Les pieces dependent des reponses : un voyage en Gambie ne demande pas
    // le dossier d'un visa Schengen.
    const pieces = piecesDe(demarche, reponses);
    const redigees = pieces.filter((p) => p.source === "site");
    const aFournir = pieces.filter((p) => p.source === "fournir");
    const premier = redigees[0]?.editeur as CareerKind | undefined;

    return (
      <div className={pageWide}>
        <Title sub={demarche.resume}>{demarche.nom}</Title>

        {compris && (
          <p className="mb-4 rounded-xl bg-green/10 px-4 py-3 text-[.85rem] leading-relaxed text-green">
            ✨ J&apos;ai lu ta demande et rempli ce que j&apos;ai pu.
          </p>
        )}

        {/* Le premier avertissement est celui qui depend des reponses — « la
            Gambie est dans l'espace CEDEAO, pas besoin de visa » —, donc le
            plus utile a lire. */}
        {avertissementsDe(demarche, reponses).map((a) => (
          <Note key={a} tone="warn">{a}</Note>
        ))}

        {/* Un bouton par document : ils se creent UN PAR UN, dans l'ordre que
            l'utilisateur choisit. Un bouton unique « tout creer » laisserait
            croire que les trois sortent d'un coup, ce qui n'est pas le cas. */}
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <section className="mt-5">
          <h2 className="mb-2 text-[.95rem] font-bold text-gray-900 dark:text-white">
            Ce que je redige pour toi
          </h2>
          <ul className="space-y-2">
            {redigees.map((p) => (
              <li
                key={p.nom}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-green/30 bg-green/[.04] p-3"
              >
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green text-[.68rem] text-white"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[.92rem] font-bold text-gray-900 dark:text-white">{p.nom}</span>
                  <span className="block text-[.82rem] leading-snug text-gray-500">{p.detail}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onTerminer({ demarche, reponses, kind: (p.editeur || "demande") as CareerKind })}
                  className="shrink-0 rounded-lg bg-green px-4 py-2 text-[.84rem] font-bold text-white transition active:scale-95"
                >
                  Creer
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-[.95rem] font-bold text-gray-900 dark:text-white">
            Ce que tu dois fournir toi-meme
          </h2>
          <ul className="space-y-2">
            {aFournir.map((p) => (
              <li key={p.nom} className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <span className="block text-[.92rem] font-bold text-gray-900 dark:text-white">{p.nom}</span>
                <span className="block text-[.82rem] leading-snug text-gray-500">{p.detail}</span>
                {p.ou && (
                  <span className="mt-1.5 block text-[.8rem] font-semibold text-gray-600 dark:text-gray-300">
                    📍 {p.ou}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {/* Rappel systematique : la table nomme l'institution, jamais une
              adresse, un tarif ni un delai — ils changent trop souvent pour
              etre ecrits ici sans finir par tromper quelqu'un. */}
          <p className="mt-3 text-[.8rem] leading-relaxed text-gray-400">
            Les pieces exactes, les tarifs et les delais varient selon la commune et la periode.
            Verifie sur place avant de te deplacer avec ton dossier.
          </p>
        </section>
        </div>

        <ActionBar>
          <Retour onClick={() => setEtape(questions.length - 1)} />
          <PrimaryBtn
            onClick={() => premier && onTerminer({ demarche, reponses, kind: premier })}
            disabled={!premier}
          >
            {redigees.length > 1 ? "Commencer par le premier" : "Creer mon document"}
            <span aria-hidden="true">→</span>
          </PrimaryBtn>
        </ActionBar>
      </div>
    );
  }

  /* ========================= 3. Les questions ========================= */

  const q = questions[etape];
  const valeur = reponses[q.id] || "";
  const repondre = (v: string) => setReponses((r) => ({ ...r, [q.id]: v }));

  return (
    <div className={page}>
      <div className="mb-5">
        <Dots total={questions.length} current={etape} />
      </div>

      {compris && (
        <p className="mb-4 rounded-xl bg-green/10 px-4 py-3 text-[.85rem] leading-relaxed text-green">
          ✨ J&apos;ai retenu : {demarche.questions
            .filter((x) => reponses[x.id])
            .map((x) => reponses[x.id])
            .join(" · ")}. Complete le reste.
        </p>
      )}

      <header className="mb-6">
        <p className="text-[.82rem] font-semibold text-gray-400">{demarche.nom}</p>
        <h1 className="mt-1 font-display text-[1.55rem] font-extrabold leading-tight text-gray-900 dark:text-white">
          {q.libelle}
        </h1>
        {q.aide && <p className="mt-1.5 text-[.88rem] leading-relaxed text-gray-500">{q.aide}</p>}
      </header>

      {q.type === "choix" ? (
        <div className="space-y-3">
          {(q.options || []).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                repondre(o);
                setEtape(etape + 1);
              }}
              className={
                "flex w-full items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3.5 text-left transition " +
                (valeur === o
                  ? "border-green bg-green/5"
                  : "border-gray-200 bg-white hover:border-green/40 dark:border-white/10 dark:bg-dark-800")
              }
            >
              <span className={"flex-1 text-[.98rem] font-bold " + (valeur === o ? "text-green" : "text-gray-900 dark:text-white")}>
                {o}
              </span>
              {valeur === o && (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green text-[.72rem] text-white" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          rows={3}
          value={valeur}
          maxLength={600}
          autoFocus
          onChange={(e) => repondre(e.target.value)}
          className={input + " resize-y leading-relaxed"}
        />
      )}

      <ActionBar>
        <Retour onClick={() => setEtape(etape === 0 ? -1 : etape - 1)} />
        <PrimaryBtn onClick={() => setEtape(etape + 1)}>
          {etape === questions.length - 1 ? "Voir ce qu'il me faut" : "Continuer"}
          <span aria-hidden="true">→</span>
        </PrimaryBtn>
      </ActionBar>
    </div>
  );
}

/** Fleche de retour de la barre du bas, identique a celle des editeurs. */
function Retour({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retour"
      className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl border-[1.5px] border-gray-200 text-[1.3rem] text-gray-500 transition active:scale-95 dark:border-white/15"
    >
      ‹
    </button>
  );
}
