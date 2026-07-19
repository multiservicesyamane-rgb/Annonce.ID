import type { SupabaseClient } from "@supabase/supabase-js";
import { geminiGenerate } from "@/lib/gemini";

// Qualification IA des prospects du CRM : score de pertinence (0-100) +
// accroche WhatsApp personnalisée. Gemini si GEMINI_API_KEY est présente,
// sinon heuristique + template gratuits. Nécessite les colonnes ajoutées par
// database/MIGRATION_PROSPECTS_QUALIFICATION.sql.

const SITE = "wanteermako.com";

interface ProspectRow {
  id: string;
  name?: string | null;
  sector?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
}

function supportNumber(): string | null {
  const raw = (process.env.WHATSAPP_NUMBER || "").replace(/\D/g, "");
  return raw ? `+${raw}` : null;
}

// Secteurs phares de la plateforme (immobilier, téléphones, véhicules…).
const HOT_SECTORS = /immo|terrain|maison|appart|villa|t[ée]l[ée]phone|phone|[ée]lectro|informat|multim[ée]dia|v[ée]hic|voiture|auto|moto/i;

// Score de repli sans IA : complétude des données + secteur porteur.
function heuristicScore(p: ProspectRow): number {
  let s = 20;
  if (p.phone || p.whatsapp) s += 30;
  if (p.sector) s += 15;
  if (p.city) s += 10;
  if (p.email) s += 10;
  if (HOT_SECTORS.test(p.sector || "") || HOT_SECTORS.test(p.name || "")) s += 15;
  return Math.min(s, 100);
}

// Accroche de repli sans IA : factuelle, sans promesse de résultat.
function templateAccroche(p: ProspectRow): string {
  const support = supportNumber();
  const cible = [
    p.sector ? `en ${p.sector.toLowerCase()}` : "",
    p.city ? `à ${p.city}` : "",
  ].filter(Boolean).join(" ");
  return [
    `Bonjour 👋 Je vous contacte de la part de Wanteermako (${SITE}), la plateforme d'annonces au Sénégal.`,
    `Nous accompagnons les vendeurs${cible ? ` ${cible}` : ""} qui veulent présenter leurs produits en ligne.`,
    `Vous pouvez créer gratuitement votre boutique et publier vos annonces en quelques minutes.`,
    `Souhaitez-vous que je vous montre comment démarrer ?`,
    support ? `Assistance : ${support}` : "",
  ].filter(Boolean).join(" ");
}

function parseJsonBlock(text: string): { score?: unknown; accroche?: unknown } | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

// Qualifie UN prospect : Gemini si possible, repli heuristique/template sinon.
async function qualifyOne(p: ProspectRow): Promise<{ score: number; accroche: string; source: "ai" | "template" }> {
  const support = supportNumber();
  const prompt = `Analyse ce prospect, un vendeur potentiel à recruter sur la marketplace Wanteermako (${SITE}) :
- Nom / activité : ${p.name || "—"}
- Secteur : ${p.sector || "—"}
- Ville : ${p.city || "—"}
- Notes : ${(p.notes || "").slice(0, 300) || "—"}

Réponds UNIQUEMENT avec un JSON strict, sans texte autour :
{"score": <entier 0-100>, "accroche": "<message>"}

Règles :
- "score" = pertinence commerciale comme futur vendeur PRO. Secteurs forts : immobilier, téléphones/électronique, véhicules. Un professionnel identifiable (boutique, stock) score plus haut qu'un particulier.
- "accroche" = premier message WhatsApp en français, maximum 60 mots, poli et personnalisé avec son activité et sa ville, qui l'invite à créer gratuitement sa boutique sur ${SITE}. N'invente RIEN : aucune promesse de résultat, aucun prix, aucune fonctionnalité non mentionnée ici.${support ? ` Termine par "Assistance : ${support}".` : ""}`;

  const raw = await geminiGenerate(prompt);
  if (raw) {
    const json = parseJsonBlock(raw);
    const score = Number(json?.score);
    const accroche = typeof json?.accroche === "string" ? json.accroche.trim() : "";
    if (Number.isFinite(score) && accroche) {
      return { score: Math.max(0, Math.min(100, Math.round(score))), accroche, source: "ai" };
    }
  }
  return { score: heuristicScore(p), accroche: templateAccroche(p), source: "template" };
}

/**
 * Qualifie les prospects sans score/accroche, par petits lots (appels Gemini
 * en parallèle pour tenir dans le temps d'exécution serverless).
 * Retourne aussi le nombre restant pour permettre de relancer d'un clic.
 */
export async function qualifyProspects(sb: SupabaseClient, limit = 6) {
  const UNQUALIFIED = "score.is.null,accroche_whatsapp.is.null";

  const { data: batch, error } = await sb
    .from("prospects")
    .select("id, name, sector, city, phone, whatsapp, email, notes")
    .or(UNQUALIFIED)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 10)));

  if (error) {
    return { skipped: true, reason: "Exécuter database/MIGRATION_PROSPECTS_QUALIFICATION.sql pour activer la qualification" };
  }
  if (!batch || !batch.length) {
    return { qualified: 0, remaining: 0, results: [] };
  }

  const results = await Promise.all(
    batch.map(async (p: ProspectRow) => {
      const q = await qualifyOne(p);
      const { error: upErr } = await sb
        .from("prospects")
        .update({ score: q.score, accroche_whatsapp: q.accroche })
        .eq("id", p.id);
      return { id: p.id, name: p.name, score: q.score, source: q.source, error: upErr?.message };
    }),
  );

  const { count } = await sb
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .or(UNQUALIFIED);

  return {
    qualified: results.filter((r) => !r.error).length,
    remaining: count || 0,
    results,
  };
}
