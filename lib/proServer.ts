// Espace Freelancer — socle commun aux routes /api/pro/*.
// Les tables pro_* sont protégées par RLS ; ces routes s'authentifient d'abord
// avec la session du navigateur, puis lisent/écrivent via la clé service_role
// en filtrant TOUJOURS sur user_id. Le filtre explicite est la vraie garantie :
// jamais de requête sans `.eq("user_id", user.id)`.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_QUOTE_SECTIONS, sanitizeSections, canChargeTax, type QuoteSection } from "@/lib/pro";

export const txt = (v: unknown, max = 160) => String(v ?? "").trim().slice(0, max);

export const num = (v: unknown, max = 999_999_999_999) =>
  Math.min(max, Math.max(0, Math.round(Number(v) || 0)));

/** Date ISO courte (YYYY-MM-DD) ou null — refuse tout le reste. */
export const dateOrNull = (v: unknown): string | null => {
  const s = txt(v, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * La table est-elle réellement absente ? On teste le motif exact de PostgREST
 * (« Could not find the table … in the schema cache »), et surtout PAS le simple
 * nom de la table : d'autres erreurs le mentionnent aussi et faisaient croire à
 * tort que la migration n'était pas passée.
 */
export function isMissingTable(error: { message?: string } | null): boolean {
  const m = error?.message || "";
  return /Could not find the table/i.test(m) || /relation .* does not exist/i.test(m);
}

/** Une colonne ajoutée par la migration v2 manque-t-elle ? */
export function isMissingColumn(error: { message?: string } | null): boolean {
  const m = error?.message || "";
  return /Could not find the '.*' column/i.test(m) || /column .* does not exist/i.test(m);
}

/**
 * L'écriture a-t-elle été refusée par une contrainte `check` donnée ?
 *
 * Cas concret : le code propose dix modèles de document depuis le 31/08/2026,
 * mais `pro_settings_doc_template_chk` n'en connaît que cinq tant que
 * `database/MIGRATION_MODELES_DOCUMENTS.sql` n'a pas tourné. Sans ce test,
 * l'utilisateur qui choisit « Ardoise » reçoit le message brut de Postgres —
 * illisible, et qui ne dit pas quoi faire.
 *
 * On lit `code` (23514) autant que le nom de la contrainte : PostgREST place
 * le premier dans `code`, le second dans `message` ou `details` selon les
 * versions.
 */
export function isCheckViolation(error: unknown, constraint: string): boolean {
  const e = (error || {}) as { code?: string; message?: string; details?: string };
  const text = `${e.message || ""} ${e.details || ""}`;
  return (e.code === "23514" || /violates check constraint/i.test(text)) && text.includes(constraint);
}

export type ProContext = { sb: SupabaseClient; userId: string };

/**
 * Authentifie et prépare le contexte, ou renvoie la réponse d'erreur toute faite.
 * Usage : `const ctx = await proContext(); if ("error" in ctx) return ctx.error;`
 */
export async function proContext(): Promise<ProContext | { error: NextResponse }> {
  const supabase = createClient();
  if (!supabase) return { error: NextResponse.json({ error: "Supabase non configuré" }, { status: 500 }) };

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: NextResponse.json({ error: "Non autorisé." }, { status: 401 }) };

  const sb = adminClient();
  if (!sb) return { error: NextResponse.json({ error: "Service indisponible." }, { status: 500 }) };

  return { sb, userId: user.id };
}

/**
 * Journal d'activité : alimente à la fois « Dernières activités » du tableau de
 * bord et « Historique des modifications » de chaque fiche.
 * Volontairement silencieux : un échec d'écriture du journal ne doit jamais
 * faire échouer l'action métier qu'il accompagne.
 */
export async function logEvent(
  sb: SupabaseClient,
  userId: string,
  entity: "client" | "project" | "quote" | "invoice" | "payment",
  entityId: string | null,
  kind: string,
  message: string,
  meta: Record<string, unknown> = {},
): Promise<void> {
  try {
    await sb.from("pro_events").insert({
      user_id: userId,
      entity,
      entity_id: entityId,
      kind,
      message: message.slice(0, 300),
      meta,
    });
  } catch {
    /* le journal est secondaire — jamais bloquant */
  }
}

/**
 * Rattache les clients à une liste de documents.
 *
 * Une seule requête supplémentaire, quel que soit le nombre de documents. La
 * jointure imbriquée de PostgREST serait possible depuis que les clés
 * étrangères sont déclarées, mais elle échouerait en bloc si la migration
 * n'était pas encore passée — ici, l'absence de clients rend simplement
 * `pro_clients` null, et l'écran continue de s'afficher.
 */
export async function attachClients<T extends { client_id?: string | null }>(
  sb: SupabaseClient,
  rows: T[],
): Promise<(T & { pro_clients: any })[]> {
  const ids = [...new Set(rows.map((r) => r.client_id).filter(Boolean))] as string[];
  let byId: Record<string, any> = {};
  if (ids.length) {
    const { data } = await sb
      .from("pro_clients")
      .select("id, name, company, phone, email, tracking_code")
      .in("id", ids);
    byId = Object.fromEntries((data || []).map((c: any) => [c.id, c]));
  }
  return rows.map((r) => ({ ...r, pro_clients: r.client_id ? byId[r.client_id] || null : null }));
}

/** Vérifie qu'une entité appartient bien au professionnel connecté. */
export async function ownsRow(
  sb: SupabaseClient,
  table: string,
  id: string,
  userId: string,
): Promise<boolean> {
  const { data } = await sb.from(table).select("id").eq("id", id).eq("user_id", userId).maybeSingle();
  return !!data;
}

/** Base publique des liens partagés (devis, factures). */
export function publicBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://wanteermako.com";
}

/**
 * Numéro de pièce suivant : DEV-2026-014 / FAC-2026-007.
 *
 * Délégué à la fonction SQL `pro_next_number`, qui incrémente un compteur par
 * (professionnel, préfixe, année) de façon atomique. Compter les lignes
 * existantes ne convenait pas : supprimer une facture faisait RÉUTILISER son
 * numéro, et deux créations simultanées obtenaient le même — inacceptable pour
 * une pièce comptable.
 *
 * Repli sur le comptage si la fonction n'existe pas encore (migration non
 * exécutée) : mieux vaut un numéro imparfait qu'un blocage de la création.
 */
export async function nextDocumentNumber(
  sb: SupabaseClient,
  userId: string,
  prefix: "DEV" | "FAC",
): Promise<string> {
  const { data, error } = await sb.rpc("pro_next_number", { p_user: userId, p_prefix: prefix });
  if (!error && typeof data === "string" && data) return data;

  const table = prefix === "DEV" ? "pro_quotes" : "pro_invoices";
  const { count } = await sb.from(table).select("id", { count: "exact", head: true }).eq("user_id", userId);
  return `${prefix}-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, "0")}`;
}

/**
 * Rubriques de devis du professionnel, prêtes à être recopiées dans une pièce.
 *
 * Retombe sur les rubriques par défaut tant qu'il n'a rien réglé : un premier
 * devis part ainsi avec des conditions professionnelles, sans l'avoir obligé
 * à traverser un assistant avant de pouvoir travailler.
 *
 * Ne lève jamais : la colonne peut ne pas exister (migration non exécutée),
 * et une rubrique manquante ne doit pas empêcher de créer un devis.
 */
export async function defaultQuoteSections(
  sb: SupabaseClient,
  userId: string,
): Promise<QuoteSection[]> {
  try {
    const { data, error } = await sb
      .from("pro_settings")
      .select("quote_sections")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return DEFAULT_QUOTE_SECTIONS;

    const saved = sanitizeSections(data?.quote_sections);
    // Tableau vide = jamais réglé (valeur par défaut de la colonne), et non
    // « tout désactivé » : dans ce cas on propose nos rubriques.
    return saved.length > 0 ? saved.filter((s) => s.enabled) : DEFAULT_QUOTE_SECTIONS.filter((s) => s.enabled);
  } catch {
    return DEFAULT_QUOTE_SECTIONS.filter((s) => s.enabled);
  }
}

/**
 * Le professionnel peut-il facturer de la TVA ?
 *
 * Une grande partie des prestataires travaille sans NINEA : ils facturent
 * normalement, mais ne collectent pas de TVA. La regle est verifiee ici, au
 * plus pres de l'ecriture, et pas seulement dans l'ecran de saisie — sans
 * quoi un appel direct a l'API suffirait a produire une piece portant une
 * taxe que l'emetteur n'a pas le droit de percevoir.
 *
 * Distinction importante entre « interdit » et « pas encore connu » : tant
 * que MIGRATION_ESPACE_PRO.sql n'a pas tourne, la colonne `business_status`
 * n'existe pas. Repondre « non » dans ce cas remettrait silencieusement a
 * zero la TVA de comptes qui l'utilisent deja legitimement. On preserve donc
 * le comportement actuel jusqu'a ce que le statut soit reellement lisible.
 */
export async function taxAllowed(sb: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data, error } = await sb
      .from("pro_settings").select("business_status").eq("user_id", userId).maybeSingle();
    // Statut illisible : on ne peut pas trancher, on ne casse rien.
    if (error) return !isMissingColumn(error) ? false : true;
    return canChargeTax(data?.business_status);
  } catch {
    return true;
  }
}
