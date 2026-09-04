"use client";

// Espace Freelancer — briques d'interface partagées par les cinq panneaux.
// Un seul endroit pour les styles, les appels réseau et les composants
// récurrents : les écrans restent cohérents sans se répéter.

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { formatFcfa, type QuoteItem } from "@/lib/pro";

/**
 * Catalogue de prestations, chargé à la demande.
 *
 * En import direct on créerait un cycle — ui.tsx → CatalogPicker → ui.tsx,
 * ce dernier ayant besoin de `api` et `input`. Le chargement différé le
 * dénoue, et accessoirement la fenêtre n'est téléchargée que si on l'ouvre :
 * autant d'octets épargnés sur un forfait téléphonique.
 */
const CatalogPicker = dynamic(() => import("./CatalogPicker"), { ssr: false });

/* ============================ Styles ============================ */

/* Trois niveaux de profondeur — la hiérarchie vient de l'élévation, pas d'un
   empilement d'ombres : `card` pour le contenu courant, `cardRaised` pour les
   pièces qui doivent capter le regard (totaux, dialogues). */
export const card =
  "rounded-2xl border border-gray-200/80 dark:border-dark-border bg-white dark:bg-dark-800 shadow-[0_1px_2px_rgba(16,24,40,.04)]";
export const cardRaised =
  "rounded-2xl border border-gray-200/70 dark:border-dark-border bg-white dark:bg-dark-800 shadow-[0_12px_32px_-12px_rgba(16,24,40,.18)]";
export const input =
  "w-full rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-900 px-3.5 py-2.5 text-[.88rem] text-gray-900 dark:text-white placeholder:text-gray-400 outline-none transition-[border-color,box-shadow] focus:border-green focus:ring-4 focus:ring-green/12";
export const lbl =
  "mb-1.5 block text-[.7rem] font-bold uppercase tracking-[.04em] text-gray-500 dark:text-gray-400";

/** Colonne latérale des formulaires : le récapitulatif suit le défilement sur
    grand écran, pour que le total et le bouton restent sous les yeux même avec
    une longue liste de prestations. */
// top-20 et non top-4 : la barre du haut de /mon-activite est collante et
// haute de 64 px. À top-4 la colonne venait se glisser DESSOUS au défilement,
// et on perdait le haut de l'aperçu.
export const stickyAside = "flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start";

export const CLIENT_STYLE: Record<string, string> = {
  prospect: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  active: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
};

export const PROJECT_STYLE: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  active: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  done: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export const QUOTE_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  sent: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  viewed: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  refused: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  expired: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
};

export const INVOICE_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  sent: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  partial: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  late: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
};

/* ============================ Types ============================ */

export type Client = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  sector: string | null;
  notes: string | null;
  billing_name: string | null;
  tax_id: string | null;
  status: string;
  tracking_code: string;
  created_at: string;
};

export type Project = {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  budget: number;
  start_date: string | null;
  due_date: string | null;
  progress: number;
  status: string;
  tasks: { label: string; done: boolean }[];
  documents: { name: string; url: string; size?: number }[];
  created_at: string;
  updated_at?: string;
  pro_clients?: Partial<Client> | null;
};

export type Quote = {
  id: string;
  number: string | null;
  title: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  valid_until: string | null;
  note: string | null;
  terms: string | null;
  public_token: string;
  client_id: string | null;
  project_id: string | null;
  version: number;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  created_at: string;
  pro_clients?: Partial<Client> | null;
};

export type Invoice = {
  id: string;
  number: string | null;
  title: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  terms: string | null;
  public_token: string;
  client_id: string | null;
  project_id: string | null;
  quote_id: string | null;
  reminded_at: string | null;
  created_at: string;
  pro_clients?: Partial<Client> | null;
};

export type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  method: string | null;
  note: string | null;
  paid_at: string;
};

export type ProEvent = {
  id: string;
  entity: string;
  entity_id: string | null;
  kind: string;
  message: string;
  created_at: string;
};

export type Toast = (m: string) => void;

/**
 * Navigation entre écrans du module.
 *
 * `focusId` ouvre directement la pièce concernée. Sans lui, « FAC-2026-019 en
 * retard » déposait le professionnel sur la liste complète des factures, à lui
 * de retrouver la ligne qu'il venait pourtant de désigner du doigt.
 */
export type GoTo = (panel: string, focusId?: string) => void;

/* ============================ Réseau ============================ */

export async function api(resource: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/pro/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function apiGet(resource: string) {
  const res = await fetch(`/api/pro/${resource}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/* ============================ Mise en page ============================ */

/**
 * Ligne de tête d'un écran : le décompte à gauche, l'action principale à
 * droite.
 *
 * Le titre n'est plus affiché : la barre collante de /mon-activite le porte
 * déjà, et le répéter en 1,7 rem juste en dessous mangeait un tiers d'un écran
 * de téléphone avant le moindre contenu. Il reste dans le DOM en `sr-only`,
 * pour que la page garde un h1 et que les lecteurs d'écran l'annoncent.
 */
export function PageHead({
  title, count, action, onAction, children,
}: {
  title: string; count?: string; action?: string; onAction?: () => void; children?: React.ReactNode;
}) {
  const hasRow = !!(count || action || children);
  return (
    <div
      className={
        hasRow
          ? "mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-gray-100 pb-3 dark:border-white/[.06]"
          : ""
      }
    >
      <h1 className="sr-only">{title}</h1>
      {hasRow && (
        <>
          <p className="min-w-0 text-[.82rem] text-gray-500 dark:text-gray-400">{count}</p>
          <div className="flex flex-wrap items-center gap-2">
            {children}
            {action && (
              <button onClick={onAction} className="btn btn-green shrink-0 px-5 py-2.5 text-[.85rem] font-extrabold">
                {action}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function Crumb({ onBack, parent, current }: { onBack: () => void; parent: string; current: string }) {
  return (
    <div className="mb-5 flex items-center gap-2 text-[.85rem]">
      <button onClick={onBack} className="font-semibold text-gray-500 transition hover:text-green">
        ‹ {parent}
      </button>
      <span className="text-gray-300">›</span>
      <span className="truncate font-extrabold text-gray-900 dark:text-white">{current}</span>
    </div>
  );
}

export function Section({
  icon, title, children, aside,
}: { icon: string; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className={`${card} p-4 sm:p-5`}>
      <div className="-mx-4 mb-4 flex items-center gap-2.5 border-b border-gray-100 px-4 pb-3 dark:border-white/[.06] sm:-mx-5 sm:px-5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-green/10 text-[.9rem] ring-1 ring-inset ring-green/15">
          {icon}
        </span>
        <h3 className="flex-1 font-display text-[.95rem] font-extrabold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </div>
  );
}

export function F({
  l, v, set, ph, type = "text", hint,
}: { l: string; v?: string; set: (v: string) => void; ph?: string; type?: string; hint?: string }) {
  return (
    <div>
      <span className={lbl}>{l}</span>
      <input type={type} className={input} value={v || ""} placeholder={ph} onChange={(e) => set(e.target.value)} />
      {hint && <p className="mt-1 text-[.7rem] text-gray-400">{hint}</p>}
    </div>
  );
}

/** Champ montant : saisie en chiffres, affichage avec séparateurs de milliers. */
export function MoneyField({
  l, v, set, ph = "0", hint,
}: { l: string; v: number; set: (v: number) => void; ph?: string; hint?: string }) {
  return (
    <div>
      <span className={lbl}>{l}</span>
      <div className="relative">
        <input
          className={`${input} pr-14 text-right`}
          inputMode="numeric"
          placeholder={ph}
          value={v ? v.toLocaleString("fr-FR") : ""}
          onChange={(e) => set(Number(e.target.value.replace(/\D/g, "")) || 0)}
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[.72rem] font-bold text-gray-400">
          FCFA
        </span>
      </div>
      {hint && <p className="mt-1 text-[.7rem] text-gray-400">{hint}</p>}
    </div>
  );
}

export function Select({
  l, v, set, options, placeholder,
}: {
  l: string; v?: string; set: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div>
      <span className={lbl}>{l}</span>
      <select className={input} value={v || ""} onChange={(e) => set(e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function Badge({ children, cls }: { children: React.ReactNode; cls: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[.66rem] font-bold ${cls}`}>{children}</span>;
}

export function Kpi({
  label, value, tone, small, sub, onClick,
}: {
  label: string; value: string; tone?: "green" | "amber" | "red" | "blue";
  small?: boolean; sub?: string; onClick?: () => void;
}) {
  const color =
    tone === "green" ? "text-green"
    : tone === "amber" ? "text-amber-600 dark:text-amber-400"
    : tone === "red" ? "text-red-600 dark:text-red-400"
    : tone === "blue" ? "text-blue-600 dark:text-blue-400"
    : "text-gray-900 dark:text-white";
  // Filet de couleur en tête de carte : lecture du ton au coup d'œil, sans
  // teinter tout le fond (qui écraserait la valeur, seule chose à lire).
  const bar =
    tone === "green" ? "bg-green"
    : tone === "amber" ? "bg-amber-500"
    : tone === "red" ? "bg-brand-red"
    : tone === "blue" ? "bg-blue-500"
    : "bg-gray-300 dark:bg-white/20";
  const Tag: any = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`${card} group relative overflow-hidden p-3.5 text-left ${
        onClick ? "transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-green/40 hover:shadow-[0_10px_24px_-12px_rgba(99,102,241,.45)]" : ""
      }`}
    >
      <span className={`absolute inset-x-0 top-0 h-[3px] ${bar}`} />
      <div className="mt-1 text-[.66rem] font-bold uppercase tracking-[.06em] text-gray-400">{label}</div>
      <div
        className={`mt-1.5 font-mono font-extrabold leading-none tabular-nums ${
          small ? "text-[.95rem]" : "text-[1.4rem] sm:text-[1.5rem]"
        } ${color}`}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[.7rem] text-gray-500">{sub}</div>}
    </Tag>
  );
}

export function Tip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[.78rem] leading-relaxed text-gray-600 dark:text-gray-400">
      <span className="shrink-0">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

export function Empty({
  icon, title, sub, cta, onCta,
}: { icon: string; title: string; sub: string; cta?: string; onCta?: () => void }) {
  return (
    <div className={`${card} px-6 py-14 text-center`}>
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-green/10 text-[1.8rem]">{icon}</div>
      <h3 className="mt-4 font-display text-[1.05rem] font-extrabold text-gray-900 dark:text-white">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-[44ch] text-[.86rem] leading-relaxed text-gray-500 dark:text-gray-400">{sub}</p>
      {cta && (
        <button onClick={onCta} className="btn btn-green mt-5 px-6 py-2.5 text-[.85rem] font-extrabold">
          {cta}
        </button>
      )}
    </div>
  );
}

export function MigrationNotice({ what = "Base de données à préparer" }: { what?: string }) {
  return (
    <div className={`${card} mx-auto max-w-[620px] p-8 text-center`}>
      <div className="text-[1.8rem]">🗄️</div>
      <h2 className="mt-2 font-display text-[1.05rem] font-extrabold text-gray-900 dark:text-white">{what}</h2>
      <p className="mt-1 text-[.85rem] text-gray-500 dark:text-gray-400">
        Exécutez <b>database/MIGRATION_MON_ACTIVITE.sql</b> dans Supabase → SQL Editor, puis rechargez la page.
      </p>
    </div>
  );
}

/** Barre d'avancement d'un projet. */
export function Progress({ value, tone = "green" }: { value: number; tone?: "green" | "amber" }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
      <div
        className={`h-full rounded-full transition-all ${tone === "amber" ? "bg-amber-500" : "bg-green"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Barre de recherche + filtres par statut, partagée par les listes. */
export function FilterBar({
  query, setQuery, placeholder, filters, active, setActive,
}: {
  query: string; setQuery: (v: string) => void; placeholder: string;
  filters: { value: string; label: string; count: number }[];
  active: string; setActive: (v: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          className={`${input} pl-10`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActive(f.value)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[.78rem] font-semibold transition ${
              active === f.value
                ? "border-green bg-green text-white"
                : "border-gray-200 text-gray-600 hover:border-green/50 dark:border-dark-border dark:text-gray-300"
            }`}
          >
            {f.label}
            <span className={`ml-1.5 text-[.7rem] ${active === f.value ? "text-white/80" : "text-gray-400"}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================ Éditeur de lignes ============================ */

/**
 * Saisie des prestations, partagée par les devis et les factures.
 * Mobile : la désignation prend toute la largeur, puis quantité et prix côte à
 * côte. Desktop : tout sur une seule ligne.
 */
export function ItemsEditor({
  items, setItems, placeholder = "Ex : Création du logo", notify,
}: {
  items: QuoteItem[];
  setItems: (v: QuoteItem[]) => void;
  placeholder?: string;
  /** Retour d'action pour l'enregistrement au catalogue. */
  notify?: (message: string) => void;
}) {
  const patch = (i: number, field: keyof QuoteItem, value: string | number) =>
    setItems(items.map((x, j) => (j === i ? { ...x, [field]: value } : x)));

  // Le catalogue est monté ici plutôt que dans chaque panneau : devis et
  // factures éditent leurs lignes avec ce même composant, ils en héritent donc
  // sans une ligne de code de plus.
  const [catalogOpen, setCatalogOpen] = useState(false);

  /**
   * Pose une prestation du catalogue. Si la dernière ligne est encore vide —
   * le cas au premier ajout, l'éditeur en ouvrant toujours une — on la remplit
   * au lieu d'en empiler une seconde et de laisser un trou dans le document.
   */
  function addFromCatalog(item: QuoteItem) {
    const last = items[items.length - 1];
    if (last && !last.label.trim() && !last.unit_price) {
      setItems([...items.slice(0, -1), item]);
      return;
    }
    setItems([...items, item]);
  }

  return (
    <>
      <div className="hidden gap-2 px-1 pb-2 text-[.66rem] font-bold uppercase tracking-[.06em] text-gray-400 sm:flex">
        <span className="flex-1">Désignation</span>
        <span className="w-[70px] text-center">Qté</span>
        <span className="w-[120px] text-right">Prix unitaire</span>
        <span className="w-[110px] text-right">Total</span>
        <span className="w-9" />
      </div>

      <div className="flex flex-col gap-3 sm:gap-1">
        {items.map((it, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-xl border border-gray-100 p-2.5 transition-colors dark:border-white/10 sm:flex-row sm:items-center sm:gap-2 sm:border-0 sm:p-1 sm:hover:bg-gray-50 sm:dark:hover:bg-white/[.03]"
          >
            <input
              className={`${input} w-full sm:flex-1`}
              placeholder={placeholder}
              value={it.label}
              onChange={(e) => patch(i, "label", e.target.value)}
            />
            <div className="flex items-center gap-2">
              <label className="flex flex-1 items-center gap-2 sm:flex-none">
                <span className="text-[.7rem] font-bold text-gray-400 sm:hidden">Qté</span>
                <input
                  className={`${input} w-full text-center sm:w-[70px]`}
                  inputMode="numeric"
                  value={it.qty || ""}
                  onChange={(e) => patch(i, "qty", Number(e.target.value.replace(/\D/g, "")) || 0)}
                />
              </label>
              <label className="flex flex-[2] items-center gap-2 sm:flex-none">
                <span className="text-[.7rem] font-bold text-gray-400 sm:hidden">Prix</span>
                <input
                  className={`${input} w-full text-right sm:w-[120px]`}
                  inputMode="numeric"
                  placeholder="0"
                  value={it.unit_price ? it.unit_price.toLocaleString("fr-FR") : ""}
                  onChange={(e) => patch(i, "unit_price", Number(e.target.value.replace(/\D/g, "")) || 0)}
                />
              </label>
              <span className="hidden w-[110px] shrink-0 text-right font-mono text-[.84rem] font-extrabold tabular-nums text-gray-900 dark:text-white sm:block">
                {((it.qty || 0) * (it.unit_price || 0)).toLocaleString("fr-FR")}
              </span>
              <button
                type="button"
                aria-label="Retirer la ligne"
                onClick={() => setItems(items.length > 1 ? items.filter((_, j) => j !== i) : items)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-brand-red dark:hover:bg-red-500/10"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setItems([...items, { label: "", qty: 1, unit_price: 0 }])}
          className="w-full rounded-xl border border-dashed border-green/40 px-3 py-2.5 text-[.8rem] font-bold text-green transition hover:border-green hover:bg-green/5 sm:w-auto"
        >
          + Ajouter une ligne
        </button>
        <button
          type="button"
          onClick={() => setCatalogOpen(true)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[.8rem] font-bold text-gray-600 transition hover:border-green/50 hover:text-green dark:border-dark-border dark:text-gray-300 sm:w-auto"
        >
          📚 Mon catalogue
        </button>
      </div>

      <CatalogPicker
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onPick={addFromCatalog}
        currentItems={items}
        notify={notify}
      />
    </>
  );
}

/**
 * Barre d'action fixe en bas d'écran, sur mobile uniquement.
 *
 * Sur un formulaire de devis à dix prestations, le bouton d'enregistrement se
 * retrouvait à des écrans de défilement du champ qu'on vient de remplir. Ici
 * il reste sous le pouce, avec le total à côté : on voit ce qu'on valide.
 *
 * Positionnée AU-DESSUS de la navigation basse du site (`BottomNav`, ~60 px,
 * z-800) : la recouvrir supprimerait le seul moyen de quitter la page.
 * Sur ordinateur elle disparaît — la colonne latérale collante fait déjà ce
 * travail (voir `stickyAside`).
 */
export function MobileActionBar({
  label, onAction, busy, total, onPreview,
}: {
  label: string; onAction: () => void; busy?: boolean; total?: number;
  /** Ouvre l'aperçu A4 plein écran — la colonne d'aperçu n'existe pas ici. */
  onPreview?: () => void;
}) {
  return (
    <>
      {/* Cale : sans elle, le dernier champ du formulaire finit masqué. */}
      <div aria-hidden="true" className="h-[84px] lg:hidden" />

      {/* Collée au bas de l'écran. Elle laissait auparavant 60 px sous elle
          pour la navigation basse du site — mais /mon-activite est un parcours
          autonome, sans cette navigation : la barre flottait dans le vide. */}
      <div
        className="fixed inset-x-0 z-[790] border-t border-gray-200 bg-white/95 px-3 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,.07)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0A0E14]/95 lg:hidden"
        style={{ bottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-3">
          {total !== undefined && (
            <div className="min-w-0 flex-1">
              <div className="text-[.62rem] font-bold uppercase tracking-wide text-gray-400">Total</div>
              <div className="truncate font-mono text-[1.05rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                {formatFcfa(total)}
              </div>
            </div>
          )}
          {onPreview && (
            <button
              onClick={onPreview}
              className="shrink-0 rounded-xl border-[1.5px] border-gray-300 px-3.5 py-3 text-[.82rem] font-bold text-gray-700 transition active:scale-[.98] dark:border-white/20 dark:text-gray-200"
            >
              👁 Aperçu
            </button>
          )}
          <button
            onClick={onAction}
            disabled={busy}
            className={`shrink-0 rounded-xl bg-green px-5 py-3 text-[.86rem] font-extrabold text-white shadow-md transition active:scale-[.98] disabled:opacity-50 ${
              total === undefined && !onPreview ? "w-full" : ""
            }`}
          >
            {busy ? "…" : label}
          </button>
        </div>
      </div>
    </>
  );
}

/** Récapitulatif HT → remise → TVA → TTC, identique sur devis et factures. */
export function TotalsBox({
  subtotal, discount, taxRate, taxAmount, total, title = "Total",
}: {
  subtotal: number; discount: number; taxRate: number; taxAmount: number; total: number; title?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-green/25 bg-gradient-to-b from-green/[.07] to-green/[.02] shadow-[0_10px_28px_-16px_rgba(99,102,241,.5)] dark:from-green/[.12] dark:to-transparent">
      <div className="border-b border-green/15 px-4 py-2.5 text-[.66rem] font-bold uppercase tracking-[.08em] text-green">
        {title}
      </div>

      <div className="flex flex-col gap-1.5 px-4 pt-3.5 text-[.8rem]">
        <Row label="Sous-total HT" value={formatFcfa(subtotal)} />
        {discount > 0 && <Row label="Remise" value={`− ${formatFcfa(discount)}`} tone="red" />}
        {taxRate > 0 && (
          <>
            <Row label="Base imposable" value={formatFcfa(subtotal - discount)} />
            <Row label={`TVA ${taxRate} %`} value={formatFcfa(taxAmount)} />
          </>
        )}
      </div>

      <div className="mt-3 border-t border-green/20 px-4 py-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-[.75rem] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
            {taxRate > 0 ? "Total TTC" : "Total"}
          </span>
          <span className="font-mono text-[1.55rem] font-extrabold leading-none tabular-nums text-gray-900 dark:text-white">
            {formatFcfa(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "red" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span
        className={`font-mono tabular-nums font-semibold ${
          tone === "red" ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-gray-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* ============================ Boîte de confirmation ============================ */

/**
 * Confirmation en ligne : évite `window.confirm`, bloquant et hors charte,
 * pour les actions destructives (suppression, annulation).
 */
export function useConfirm() {
  const [pending, setPending] = useState<{ id: string; label: string; run: () => void } | null>(null);
  const node = useMemo(() => {
    if (!pending) return null;
    return (
      <div className="fixed inset-0 z-[120] grid place-items-center bg-black/50 p-4" onClick={() => setPending(null)}>
        <div
          className={`${cardRaised} w-full max-w-[380px] p-5 text-center`}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[.9rem] font-semibold text-gray-900 dark:text-white">{pending.label}</p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setPending(null)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-[.83rem] font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              onClick={() => { const r = pending.run; setPending(null); r(); }}
              className="flex-1 rounded-xl bg-brand-red px-4 py-2.5 text-[.83rem] font-bold text-white transition hover:opacity-90"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    );
  }, [pending]);

  const ask = (label: string, run: () => void) => setPending({ id: String(Date.now()), label, run });
  return { ask, confirmNode: node };
}
