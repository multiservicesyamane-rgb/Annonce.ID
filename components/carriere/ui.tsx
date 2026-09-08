"use client";

/**
 * Ma Carriere — briques d'interface.
 *
 * Elles reprennent a la lettre les maquettes validees : fond blanc, une seule
 * action pleine largeur par ecran, cartes a bordure fine, indigo #6366F1 pour
 * l'action et or #F5A623 reserve a ce qui est paye.
 *
 * Volontairement separees de components/pro/ui.tsx : l'Espace Pro est un
 * outil de bureau dense (tableaux, colonnes, aperçu lateral), Ma Carriere est
 * un parcours telephone depouille. Partager les memes classes aurait fait
 * deriver l'un des deux a chaque retouche de l'autre.
 */

import type { ReactNode } from "react";

/* ============================== Classes ============================== */

/**
 * Enveloppe d'un ecran.
 *
 * Les maquettes sont dessinees pour un telephone, et la colonne etroite qui
 * en decoule reste la bonne mesure pour un FORMULAIRE : au-dela de ~680 px,
 * une ligne de saisie devient penible a suivre a l'œil. On elargit donc
 * modestement sur grand ecran, et on rend la marge basse au parcours des que
 * la barre du bas disparait (elle est masquee a partir de `lg`).
 */
export const page = "mx-auto w-full max-w-[560px] px-4 pb-28 pt-4 lg:max-w-[680px] lg:px-6 lg:pb-14 lg:pt-6";

/**
 * Enveloppe des ecrans d'apercu.
 *
 * Assez large pour poser la saisie et l'apercu cote a cote (voir `Split`),
 * ou la feuille A4 et ses boutons. C'est ce qui evite de derouler la page
 * entiere pour voir l'effet de ce qu'on tape, ou pour atteindre « Telecharger
 * le PDF » sous une page de 1 123 px de haut.
 */
export const pageWide = "mx-auto w-full max-w-[560px] px-4 pb-28 pt-4 lg:max-w-[1180px] lg:px-6 lg:pb-14 lg:pt-6";

/**
 * Carte du module.
 *
 * En theme sombre elle porte un lisere lumineux plutot qu'un trait gris : le
 * module est le visage « tech » du site, et l'identite neon (indigo, violet,
 * or) y a sa place. En theme clair le halo reste une ombre coloree tres douce
 * — un neon sur fond blanc ne se voit pas, il salit.
 */
export const card =
  "rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] dark:border-white/10 dark:bg-dark-800 dark:shadow-[0_0_0_1px_rgba(99,102,241,.12),0_8px_30px_-14px_rgba(99,102,241,.5)]";

/** Halo neon reutilisable, pose sur les elements qui doivent capter le regard. */
export const glow =
  "shadow-[0_10px_30px_-12px_rgba(99,102,241,.55)] dark:shadow-[0_0_18px_-2px_rgba(99,102,241,.45),0_0_40px_-10px_rgba(139,92,246,.4)]";

export const input =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[.95rem] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green focus:ring-2 focus:ring-green/20 dark:border-white/10 dark:bg-dark-800 dark:text-white";

export const lbl = "mb-1.5 block text-[.78rem] font-semibold text-gray-500 dark:text-gray-400";

/**
 * Deux colonnes sur grand ecran : la saisie a gauche, un apercu qui suit a
 * droite.
 *
 * C'est la reponse au vrai defaut du module : une colonne unique de 680 px
 * sur un ecran de 1 400 px oblige a derouler la page entiere pour voir l'effet
 * de ce qu'on tape. A droite, l'apercu reste colle en haut et le formulaire
 * tient en une vue.
 *
 * L'apercu est MASQUE au telephone (`hidden lg:block`) : l'y empiler
 * rallongerait la page, exactement ce qu'on cherche a eviter.
 */
/**
 * Saisie a gauche, apercu a droite — le partage d'ecran des editeurs de CV.
 *
 * ── Pourquoi une largeur en POURCENTAGE ──────────────────────────────────
 * La colonne d'apercu etait figee a 360 px. Sur un ecran de 1 920 px, la
 * feuille A4 y tombait sous 45 % de sa taille : un timbre-poste a cote d'un
 * formulaire qui, lui, s'etalait sur 1 400 px. L'aperçu doit grandir avec
 * l'ecran, sinon il ne sert qu'a confirmer qu'il se passe quelque chose.
 *
 * Le plancher en pixels reste : sous 320 px de colonne, la page devient
 * illisible et mieux vaut rendre la place au formulaire.
 */
export function Split({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div
      className={
        "lg:grid lg:items-start lg:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,36%)] " +
        "xl:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(420px,42%)]"
      }
    >
      <div className="min-w-0">{children}</div>
      {aside && <aside className="hidden lg:sticky lg:top-24 lg:block">{aside}</aside>}
    </div>
  );
}

/** Cartouche de l'apercu lateral. */
export function AsideCard({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-dark-800">
      <p className="mb-2 text-center text-[.75rem] font-bold uppercase tracking-wide text-gray-400">{titre}</p>
      {children}
    </div>
  );
}

/**
 * Barre d'action fixe, en bas de l'ecran.
 *
 * C'est la piece qui supprime le defilement : « Continuer » et « Apercu »
 * restent sous le pouce quoi qu'il arrive, au lieu d'attendre au bas d'un
 * formulaire. Le parcours peut alors compter plus d'etapes, chacune plus
 * courte — c'est exactement ce que font les plateformes de CV etablies, et
 * c'est plus confortable qu'une longue page a derouler.
 *
 * Pendant un parcours, la barre d'onglets du module s'efface au profit de
 * celle-ci (voir app/carriere/page.tsx) : deux barres empilees mangeraient un
 * tiers de l'ecran d'un telephone.
 */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[810] border-t border-gray-200 bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0A0E14]/95">
      <div className="mx-auto flex max-w-[560px] items-center gap-3 lg:max-w-[900px]">{children}</div>
    </div>
  );
}

/**
 * Progression en pastilles.
 *
 * Remplace les etapes nommees des que le parcours depasse quatre ecrans :
 * sept libelles sur la largeur d'un telephone deviennent illisibles, alors
 * que sept pastilles se lisent d'un coup d'œil et tiennent sur une ligne.
 */
export function Dots({ total, current }: { total: number; current: number }) {
  return (
    <div
      className="flex justify-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`Etape ${current + 1} sur ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={
            "h-2 rounded-full transition-all " +
            (i === current
              ? "w-6 bg-green"
              : i < current
                ? "w-2 bg-green/50"
                : "w-2 bg-gray-200 dark:bg-white/15")
          }
        />
      ))}
    </div>
  );
}

/* ============================== Boutons ============================== */

export function PrimaryBtn({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      // min-h-[52px] : la regle des maquettes, et la taille en dessous de
      // laquelle une cible devient penible au pouce.
      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(100deg,#4F46E5,#6366F1,#8B5CF6)] px-5 text-[1rem] font-bold text-white shadow-[0_10px_26px_-10px_rgba(99,102,241,.85)] transition hover:shadow-[0_12px_34px_-10px_rgba(139,92,246,.9)] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-[0_0_20px_-4px_rgba(99,102,241,.7),0_0_44px_-12px_rgba(139,92,246,.6)]"
    >
      {children}
    </button>
  );
}

export function OutlineBtn({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-green bg-white px-5 text-[1rem] font-bold text-green transition active:scale-[.99] disabled:opacity-60 dark:bg-transparent"
    >
      {children}
    </button>
  );
}

/** Bouton discret d'appel a l'IA — jamais plein, jamais l'action principale. */
export function AiBtn({
  children,
  onClick,
  busy,
}: {
  children: ReactNode;
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-green/60 bg-gradient-to-r from-green/5 to-neon-magenta/5 px-4 py-2.5 text-[.88rem] font-bold text-green shadow-[0_0_0_0_rgba(99,102,241,0)] transition hover:border-green hover:shadow-[0_0_18px_-4px_rgba(99,102,241,.75)] disabled:opacity-60 dark:from-green/15 dark:to-neon-magenta/10 dark:text-[#A5B4FC] dark:hover:shadow-[0_0_22px_-4px_rgba(139,92,246,.8)]"
    >
      <span aria-hidden="true">{busy ? "⏳" : "✨"}</span>
      {busy ? "Redaction en cours…" : children}
    </button>
  );
}

/**
 * Bouton de la barre d'outils de l'apercu.
 *
 * L'icone porte le sens, le libelle le confirme — et le libelle disparait sous
 * `sm` pour que quatre outils plus le zoom tiennent sur la largeur d'un
 * telephone sans se chevaucher. Le `title` et l'`aria-label` gardent le mot
 * pour la souris et les lecteurs d'ecran.
 */
export function OutilBtn({
  icone,
  children,
  onClick,
  actif,
  compact,
}: {
  icone: string;
  children: string;
  onClick: () => void;
  actif?: boolean;
  /** Icone seule, quelle que soit la largeur — pour la colonne d'apercu. */
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={children}
      aria-label={children}
      aria-pressed={actif}
      className={
        "flex h-9 shrink-0 items-center gap-1.5 rounded-lg border text-[.82rem] font-bold transition " +
        (compact ? "w-9 justify-center " : "px-2.5 sm:px-3 ") +
        (actif
          ? "border-green bg-green/10 text-green shadow-[0_0_14px_-4px_rgba(99,102,241,.6)]"
          : "border-gray-200 bg-white text-gray-600 hover:border-green/50 hover:text-green dark:border-white/10 dark:bg-dark-900 dark:text-gray-300")
      }
    >
      <span aria-hidden="true">{icone}</span>
      {!compact && <span className="hidden sm:inline">{children}</span>}
    </button>
  );
}

/** Paliers de zoom. 1 = page entiere visible, au-dela la feuille deborde. */
export const ZOOMS = [0.75, 1, 1.25, 1.5, 2];

/**
 * Barre d'outils d'un apercu, et la feuille qu'elle commande.
 *
 * ── Le panneau se SUPERPOSE, il ne pousse pas ────────────────────────────
 * Premiere version : le panneau ouvert poussait la feuille vers le bas. Sur la
 * liste complete des modeles, cela chassait le document entierement hors de
 * l'ecran — on choisissait un modele sans voir ce qu'il donnait, ce qui est
 * exactement l'inverse du but. Il se pose donc PAR-DESSUS le haut de la
 * feuille, avec sa propre hauteur maximale et son propre defilement : la page
 * ne bouge jamais, et tout tient dans la premiere vue.
 */
export function BarreOutils({
  outils,
  panneau,
  onFermer,
  iZoom,
  setIZoom,
  echelle,
  compact,
  children,
}: {
  outils?: ReactNode;
  /** Contenu deplie. `null` = rien d'ouvert. */
  panneau?: ReactNode;
  onFermer: () => void;
  iZoom: number;
  setIZoom: (maj: (i: number) => number) => void;
  /**
   * Echelle REELLE de la feuille, remontee par l'apercu.
   *
   * La barre affichait le multiplicateur de zoom : « 100 % » s'inscrivait
   * au-dessus d'une feuille reduite au tiers par la place disponible. On
   * montre desormais ce qu'on voit, et l'absence de valeur retombe sur le
   * multiplicateur — mieux vaut l'ancien chiffre que rien.
   */
  echelle?: number;
  /** Colonne etroite : icones seules, barre non collante. */
  compact?: boolean;
  children: ReactNode;
}) {
  const zoom = ZOOMS[iZoom];
  const pourcent = Math.round((echelle ?? zoom) * 100);
  return (
    <div className="relative">
      <div
        className={
          compact
            ? "mb-2 rounded-xl border border-gray-200 bg-white/90 p-1.5 backdrop-blur-md dark:border-white/10 dark:bg-dark-800/90"
            : // `top-16` : la hauteur exacte de l'en-tete collant du module.
              "sticky top-16 z-20 -mx-4 mb-3 border-b border-gray-200/70 bg-gray-50/90 px-4 py-2 backdrop-blur-md dark:border-white/10 dark:bg-dark-900/90 sm:-mx-6 sm:px-6 lg:rounded-xl lg:border lg:bg-white/90 lg:px-3 dark:lg:bg-dark-800/90"
        }
      >
        {/* Defilement horizontal plutot qu'un passage a la ligne : deux rangees
            de boutons mangeraient l'apercu qu'elles servent. */}
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {outils}

          <div className="ml-auto flex shrink-0 items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 dark:border-white/10 dark:bg-dark-900">
            <button
              type="button"
              onClick={() => setIZoom((i) => Math.max(0, i - 1))}
              disabled={iZoom === 0}
              aria-label="Reduire l'apercu"
              className="grid h-8 w-8 place-items-center rounded-md text-[1.1rem] font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/10"
            >
              −
            </button>
            <span className={`text-center font-mono text-[.72rem] font-bold tabular-nums text-gray-600 dark:text-gray-300 ${compact ? "w-9" : "w-11"}`}>
              {pourcent}%
            </span>
            <button
              type="button"
              onClick={() => setIZoom((i) => Math.min(ZOOMS.length - 1, i + 1))}
              disabled={iZoom === ZOOMS.length - 1}
              aria-label="Agrandir l'apercu"
              className="grid h-8 w-8 place-items-center rounded-md text-[1.1rem] font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/10"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {panneau && (
        <>
          {/* Voile de fermeture : un clic a cote referme, comme partout. */}
          <button
            type="button"
            aria-label="Fermer le panneau"
            onClick={onFermer}
            className="fixed inset-0 z-30 cursor-default bg-transparent"
          />
          <div className="absolute inset-x-0 top-0 z-40 max-h-[58vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_24px_60px_-24px_rgba(16,24,40,.55)] dark:border-white/10 dark:bg-dark-800">
            {panneau}
          </div>
        </>
      )}

      {children}
    </div>
  );
}

/** Contenu deplie par un `OutilBtn`, sous la barre de l'apercu. */
export function PanneauOutil({
  titre,
  sur,
  children,
}: {
  titre: string;
  /** Valeur courante, rappelee a droite du titre. */
  sur?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className="text-[.7rem] font-bold uppercase tracking-[.06em] text-gray-400">{titre}</span>
        {sur && <span className="truncate text-[.78rem] font-semibold text-gray-500">{sur}</span>}
      </p>
      {children}
    </div>
  );
}

/* ============================== Champs ============================== */

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  const rempli = value.trim().length > 0;
  return (
    <label className="block">
      <span className={lbl}>{label}</span>
      <span className="relative block">
        <input
          type={type}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={input + (rempli ? " pr-11" : "")}
        />
        {/* Coche de champ rempli : elle dit d'un coup d'œil ce qui reste a
            faire sur l'ecran, sans avoir a relire chaque ligne. */}
        {rempli && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded bg-green/15 text-[.7rem] font-bold text-green"
          >
            ✓
          </span>
        )}
      </span>
    </label>
  );
}

export function Area({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength = 600,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className={lbl}>{label}</span>
      <textarea
        rows={rows}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={input + " resize-y leading-relaxed"}
      />
      <span className="mt-1 block text-right text-[.72rem] text-gray-400">
        {value.length} / {maxLength}
      </span>
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      {/* Sans libelle, pas de bloc vide : deux menus cote a cote (mois/annee)
          partagent un seul titre au-dessus d'eux. */}
      {label && <span className={lbl}>{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={input}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ============================ Progression ============================ */

/**
 * Barre d'etapes numerotees des maquettes.
 *
 * Le CV en affiche quatre (Modele, Informations, Parcours, Export) alors que
 * la saisie couvre l'experience, la formation, les competences ET les langues.
 * Les quatre pastilles sont tenues : le parcours regroupe ces quatre blocs
 * dans une seule etape depliable, plutot que d'etaler sept pastilles sur la
 * largeur d'un telephone.
 */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="mb-5 flex items-start">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span className={"h-[2px] flex-1 " + (i === 0 ? "bg-transparent" : done || active ? "bg-green" : "bg-gray-200 dark:bg-white/10")} />
              <span
                className={
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[.8rem] font-bold transition " +
                  (done
                    ? "bg-green/15 text-green"
                    : active
                      ? "bg-green text-white"
                      : "border border-gray-200 text-gray-400 dark:border-white/15")
                }
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={"h-[2px] flex-1 " + (i === steps.length - 1 ? "bg-transparent" : done ? "bg-green" : "bg-gray-200 dark:bg-white/10")} />
            </div>
            <span
              className={
                "mt-1.5 text-center text-[.72rem] " +
                (active ? "font-bold text-green" : "font-medium text-gray-400")
              }
            >
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ============================== Titres ============================== */

export function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <header className="mb-6">
      {/* Le degrade se deplace lentement (gradShift, deja au catalogue du
          site). `bg-clip-text` le fait vivre DANS les lettres : c'est la seule
          fantaisie de l'entete, tout le reste du module reste sobre. */}
      <h1 className="animate-gradShift bg-[linear-gradient(100deg,#4F46E5,#8B5CF6,#F59E0B,#4F46E5)] bg-[length:300%_auto] bg-clip-text font-display text-[1.9rem] font-extrabold leading-tight tracking-tight text-transparent motion-reduce:animate-none">
        {children}
      </h1>
      {sub && <p className="mt-1.5 text-[.95rem] leading-relaxed text-gray-500 dark:text-gray-400">{sub}</p>}
    </header>
  );
}

/** Carte cliquable de la liste « Services rapides ». */
export function RowCard({
  icon,
  title,
  desc,
  onClick,
  badge,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  onClick?: () => void;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      className={
        "group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 text-left transition-[transform,box-shadow,border-color] dark:border-white/10 dark:bg-dark-800 " +
        (disabled
          ? "cursor-default opacity-60"
          : "hover:-translate-y-0.5 hover:border-green/50 hover:shadow-[0_14px_34px_-16px_rgba(99,102,241,.65)] active:scale-[.995] dark:hover:border-green/60 dark:hover:shadow-[0_0_0_1px_rgba(99,102,241,.35),0_0_28px_-6px_rgba(139,92,246,.5)]")
      }
    >
      {/* Lueur qui s'allume au survol, derriere le contenu. Un dégrade fige
          alourdirait les six cartes ; la, il ne se montre qu'a l'approche. */}
      {!disabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-green/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100 dark:bg-green/40"
        />
      )}
      <span
        className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-green/15 to-neon-magenta/15 text-green ring-1 ring-inset ring-green/20 transition-shadow group-hover:shadow-[0_0_16px_-2px_rgba(99,102,241,.6)] dark:from-green/25 dark:to-neon-magenta/20"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[1rem] font-bold text-gray-900 dark:text-white">{title}</span>
        <span className="block truncate text-[.84rem] text-gray-500 dark:text-gray-400">{desc}</span>
      </span>
      {badge ? (
        <span className="shrink-0 rounded-full bg-gold-pale px-2.5 py-1 text-[.7rem] font-bold text-gold-dark">
          {badge}
        </span>
      ) : (
        !disabled && <span className="shrink-0 text-[1.2rem] text-green" aria-hidden="true">›</span>
      )}
    </button>
  );
}

/* ============================== Divers ============================== */

export function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  return (
    <p
      className={
        "flex gap-2.5 rounded-xl px-4 py-3 text-[.85rem] leading-relaxed " +
        (tone === "warn"
          ? "bg-gold-pale text-gold-dark"
          : "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-300")
      }
    >
      <span aria-hidden="true">{tone === "warn" ? "⚠️" : "🛡️"}</span>
      <span>{children}</span>
    </p>
  );
}

/**
 * Ce que l'on dit AVANT le premier telechargement, sur un compte gratuit.
 *
 * Le texte insiste sur ce qui se corrige mal apres coup — le nom, les dates,
 * les numeros — parce que c'est exactement ce qu'on relit trop vite. Et il
 * rappelle ce qui reste possible : le document restera telechargeable. Un
 * avertissement qui ne dit que ce qu'on perd fait reculer sans convertir.
 */
export function messageAvantFinalisation(quoi: string): string {
  return (
    `Ce telechargement termine ${quoi}. Avec le plan gratuit tu pourras ` +
    `toujours le retelecharger, mais plus le modifier. ` +
    `Verifie l'orthographe de ton nom, tes dates et tes numeros avant de continuer.`
  );
}

/**
 * Le bandeau d'un document fini que l'on ne peut plus modifier.
 *
 * Il dit ce qui reste ouvert avant ce qui est ferme, et propose une sortie.
 * Un mur sans porte ne vend rien.
 */
export function BandeauVerrou({ quoi, onPeage }: { quoi: string; onPeage: () => void }) {
  return (
    <div className="mb-4 rounded-xl border border-gold/40 bg-gold-pale p-4">
      <p className="flex gap-2.5 text-[.85rem] font-bold leading-relaxed text-gold-dark">
        <span aria-hidden="true">🔒</span>
        <span>{quoi} est termine</span>
      </p>
      <p className="mt-1.5 pl-[26px] text-[.83rem] leading-relaxed text-gold-dark/90">
        Tu peux le telecharger et le partager autant que tu veux. Pour le reprendre
        et le modifier, il faut l&apos;abonnement Pro.
      </p>
      <div className="mt-3 pl-[26px]">
        <button
          type="button"
          onClick={onPeage}
          className="rounded-lg bg-gold-dark px-4 py-2 text-[.83rem] font-bold text-white transition active:scale-[.99]"
        >
          Voir l&apos;abonnement
        </button>
      </div>
    </div>
  );
}

/** Appel des routes /api/carriere/*, avec le message d'erreur deja extrait. */
export async function api(resource: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/carriere/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Le 402 n'est pas une panne : c'est le peage. On le laisse remonter tel
    // quel pour que l'ecran ouvre la page d'abonnement.
    throw Object.assign(new Error(data?.error || "Erreur"), { status: res.status, data });
  }
  return data;
}
