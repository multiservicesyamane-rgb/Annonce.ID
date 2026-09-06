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

export const card =
  "rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-dark-800";

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
export function Split({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
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
      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-green px-5 text-[1rem] font-bold text-white shadow-[0_6px_20px_-8px_rgba(99,102,241,.7)] transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60"
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
      className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-green/60 px-4 py-2.5 text-[.88rem] font-bold text-green transition hover:bg-green/5 disabled:opacity-60"
    >
      <span aria-hidden="true">{busy ? "⏳" : "✨"}</span>
      {busy ? "Redaction en cours…" : children}
    </button>
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
      <h1 className="font-display text-[1.9rem] font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
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
        "flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition dark:border-white/10 dark:bg-dark-800 " +
        (disabled ? "cursor-default opacity-60" : "hover:border-green/40 active:scale-[.995]")
      }
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green/10 text-green" aria-hidden="true">
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
