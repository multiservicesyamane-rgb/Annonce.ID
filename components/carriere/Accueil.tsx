"use client";

import { Note, RowCard, Title, pageWide } from "./ui";

/**
 * Accueil du module — la porte d'entree de Ma Carriere.
 *
 * ── « Demarche administrative » est affichee, pas ouverte ────────────────
 * La maquette annonce cinq services. Quatre sont livres ; le cinquieme ouvre
 * le catalogue des 105 documents administratifs, qui est un produit a lui
 * seul. Il reste visible avec la mention « Bientot » : cela mesure l'appetit
 * du public sans rien promettre qui n'existe pas encore.
 */

const Doc = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);

const Mail = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);

const Case = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const Toque = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10 12 5 2 10l10 5 10-5Z" />
    <path d="M6 12v5c3 2 9 2 12 0v-5" />
  </svg>
);

const Tampon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 22h14" />
    <path d="M5 18h14v-2a4 4 0 0 0-4-4h-.5l.7-4.2A3 3 0 0 0 12.2 4h-.4a3 3 0 0 0-3 3.8L9.5 12H9a4 4 0 0 0-4 4Z" />
  </svg>
);

const Dossier = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2Z" />
  </svg>
);

export default function Accueil({
  ia,
  quota,
  onAssistant,
  onCv,
  onLettre,
  onDemande,
  onDocuments,
}: {
  /** Un moteur de redaction repond-il ? */
  ia: boolean;
  quota: { abonne: boolean; utilises: number; quota: number } | null;
  onAssistant: () => void;
  onCv: () => void;
  onLettre: () => void;
  onDemande: (type: "emploi" | "stage") => void;
  onDocuments: () => void;
}) {
  const restant = quota && !quota.abonne ? Math.max(0, quota.quota - quota.utilises) : null;

  return (
    <div className={pageWide}>
      <Title sub="Cree tes documents professionnels en quelques minutes.">Ma Carriere</Title>

      <button
        type="button"
        onClick={onAssistant}
        className="group relative mb-4 w-full overflow-hidden rounded-2xl bg-[linear-gradient(115deg,#4F46E5,#6366F1,#8B5CF6,#4F46E5)] bg-[length:250%_auto] p-5 text-left text-white shadow-[0_14px_38px_-14px_rgba(99,102,241,.9)] transition-[transform,box-shadow] hover:shadow-[0_18px_46px_-14px_rgba(139,92,246,.95)] active:scale-[.995] motion-safe:animate-gradShift dark:shadow-[0_0_26px_-6px_rgba(99,102,241,.75),0_0_60px_-18px_rgba(139,92,246,.7)]"
      >
        {/* Deux halos qui derivent lentement derriere le degrade : c'est la
            piece la plus voyante du module, celle qu'on veut voir en premier. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 -top-14 h-40 w-40 rounded-full bg-white/25 blur-3xl motion-safe:animate-floatBlob"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 right-0 h-40 w-40 rounded-full bg-neon-gold/30 blur-3xl motion-safe:animate-floatBlob"
        />
        <div className="relative flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 text-[1.4rem]" aria-hidden="true">
            💬
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[1.35rem] font-extrabold leading-tight">
              Assistant <span className="text-gold-light">✦</span>
            </span>
            <span className="mt-1 block text-[.9rem] leading-snug text-white/85">
              Dis-moi ce dont tu as besoin, je t&apos;accompagne etape par etape.
            </span>
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-green" aria-hidden="true">
            →
          </span>
        </div>
        <div className="relative mt-4 border-t border-white/20 pt-3 text-[.8rem] text-white/80">
          CV · Lettre de motivation · Candidature
        </div>
      </button>

      {ia ? (
        <Note>L&apos;assistant lit ta demande, pose les questions qui manquent, puis redige.</Note>
      ) : (
        // Dit avant de commencer, pas apres : quelqu'un qui sait que l'IA dort
        // relit son texte au lieu de l'envoyer tel quel.
        <Note tone="warn">
          L&apos;assistant IA est momentanement indisponible. Tu peux creer tous tes documents,
          mais les textes seront composes a partir de modeles : relis-les et personnalise-les
          avant d&apos;envoyer.
        </Note>
      )}

      {/* Le plafond vient de la reponse de l'API, jamais d'une constante lue
          ici : CARRIERE_QUOTA_GRATUIT est une variable serveur, invisible du
          navigateur. Affichee depuis le code client, elle resterait a 3 meme
          apres que tu l'aies relevee. */}
      {restant !== null && quota && (
        <p className="mt-3 text-center text-[.82rem] text-gray-500">
          Il te reste <strong className="text-gray-700 dark:text-gray-200">{restant}</strong> redaction
          {restant > 1 ? "s" : ""} assistee{restant > 1 ? "s" : ""} ce mois-ci
          {restant === 0 ? " — l'ecriture a la main reste libre." : ` sur ${quota.quota}.`}
        </p>
      )}

      <h2 className="mb-3 mt-7 font-display text-[1.15rem] font-extrabold text-gray-900 dark:text-white">
        Services rapides
      </h2>

      {/* Une colonne au telephone, deux des que la largeur le permet : six
          cartes empilees sur un ecran d'ordinateur laissent les trois
          dernieres sous la ligne de flottaison pour rien. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <RowCard icon={Doc} title="Creer mon CV" desc="Presente ton parcours et tes competences" onClick={onCv} />
        <RowCard icon={Mail} title="Lettre de motivation" desc="Convaincs le recruteur en quelques clics" onClick={onLettre} />
        <RowCard icon={Case} title="Demande d'emploi" desc="Envoie une demande spontanee a une entreprise" onClick={() => onDemande("emploi")} />
        <RowCard icon={Toque} title="Demande de stage" desc="Prepare ta demande pour une premiere experience" onClick={() => onDemande("stage")} />
        <RowCard icon={Tampon} title="Demarche administrative" desc="Courriers, attestations et formalites officielles" badge="Bientot" disabled />
        <RowCard icon={Dossier} title="Mes documents" desc="Retrouve tes CV et lettres enregistres" onClick={onDocuments} />
      </div>
    </div>
  );
}
