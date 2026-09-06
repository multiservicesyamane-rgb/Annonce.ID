// Trois moteurs de redaction, essayes l'un apres l'autre.
//
// ── Pourquoi plusieurs ───────────────────────────────────────────────────
// Un seul fournisseur, c'est un seul point de panne. Gemini a un palier
// gratuit mais plafonne ; DeepSeek et OpenAI sont payants et disponibles.
// Les enchainer donne un module qui continue d'ecrire quand l'un tombe, sans
// que l'utilisateur ait quoi que ce soit a faire.
//
// Et quand AUCUN ne repond, la redaction ne s'arrete pas non plus : le
// courrier est compose a partir des reponses saisies (lib/modelesTexte.ts).
//
// Les trois clefs sont facultatives : avec une seule, le module fonctionne
// avec celle-la ; avec aucune, il compose ses textes lui-meme.

import { geminiGenerate } from "@/lib/gemini";

export type Fournisseur = "gemini" | "openai" | "deepseek";

export type Redaction = { texte: string; par: Fournisseur };

const TOUS: Fournisseur[] = ["gemini", "deepseek", "openai"];

/**
 * Ordre d'essai.
 *
 * Gemini d'abord parce qu'il a un palier gratuit. DeepSeek ensuite : son API
 * est nettement moins chere qu'OpenAI a qualite comparable sur de la
 * redaction courte en francais. OpenAI en dernier, c'est le plus cher des
 * trois.
 *
 * CARRIERE_IA_ORDRE change l'ordre sans toucher au code —
 * « deepseek,gemini,openai » par exemple.
 */
function ordre(): Fournisseur[] {
  const brut = (process.env.CARRIERE_IA_ORDRE || TOUS.join(",")).toLowerCase();
  const liste = brut
    .split(",")
    .map((f) => f.trim())
    .filter((f): f is Fournisseur => (TOUS as string[]).includes(f));
  return liste.length ? liste : TOUS;
}

/* ====================== Les APIs au format OpenAI ====================== */

/**
 * Appel d'une API au format OpenAI.
 *
 * OpenAI et DeepSeek partagent exactement la meme forme de requete et de
 * reponse — seules l'adresse, la clef et le modele changent. Une fonction
 * pour les deux evite que l'une derive de l'autre a la premiere retouche.
 *
 * Renvoie null plutot que de lever : un fournisseur en panne doit laisser sa
 * place au suivant, pas casser la requete.
 */
async function compatibleOpenAI(
  nom: Fournisseur,
  cfg: { url: string; cle?: string; model: string },
  prompt: string,
  system: string,
): Promise<string | null> {
  if (!cfg.cle || cfg.cle.length < 20) return null;

  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.cle}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.7,
        max_tokens: 900,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || res.statusText);

    const texte = String(data?.choices?.[0]?.message?.content || "").trim();
    return texte || null;
  } catch (e: any) {
    console.warn(`[ia] ${nom}:`, e?.message);
    return null;
  }
}

export async function openaiGenerate(prompt: string, system: string): Promise<string | null> {
  return compatibleOpenAI(
    "openai",
    {
      url: "https://api.openai.com/v1/chat/completions",
      cle: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
    prompt,
    system,
  );
}

/**
 * DeepSeek — API compatible OpenAI, le tarif le plus bas des trois.
 *
 * Modele par defaut : `deepseek-v4-flash`. Verifie sur la documentation
 * officielle le 07/09/2026 — l'ancien identifiant `deepseek-chat` n'est plus
 * servi, et l'ecrire ici aurait fait echouer chaque appel avec une erreur de
 * modele inconnu.
 *
 * PREPAYEE comme OpenAI : aucun palier gratuit, aucun modele gratuit. Les
 * frais sont deduits d'un solde recharge sur platform.deepseek.com. Le tarif
 * reste tres bas — de l'ordre de quelques dixiemes de dollar pour mille
 * courriers — et il baisse encore aux heures creuses.
 */
export async function deepseekGenerate(prompt: string, system: string): Promise<string | null> {
  return compatibleOpenAI(
    "deepseek",
    {
      url: "https://api.deepseek.com/chat/completions",
      cle: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    },
    prompt,
    system,
  );
}

/* ============================== L'enchainement ============================== */

/**
 * Redige avec le premier moteur qui repond.
 *
 * Le fournisseur retenu est renvoye avec le texte : sans cette information,
 * impossible de savoir en lisant les journaux lequel des deux travaille
 * reellement — ni de constater que le second sert tous les jours parce que
 * le premier sature.
 */
export async function redigerIA(prompt: string, system: string): Promise<Redaction | null> {
  for (const fournisseur of ordre()) {
    const texte =
      fournisseur === "gemini"
        ? await geminiGenerate(prompt, system)
        : fournisseur === "deepseek"
          ? await deepseekGenerate(prompt, system)
          : await openaiGenerate(prompt, system);

    if (texte && texte.trim()) {
      return { texte: texte.trim(), par: fournisseur };
    }
    console.warn(`[ia] ${fournisseur} n'a rien rendu, on passe au suivant`);
  }
  return null;
}

/** Quels moteurs sont reellement configures — sert au diagnostic. */
export function moteursDisponibles(): Fournisseur[] {
  const dispo: Fournisseur[] = [];
  const g = process.env.GEMINI_API_KEY;
  if (g && !g.includes("your_gemini")) dispo.push("gemini");
  const d = process.env.DEEPSEEK_API_KEY;
  if (d && d.length >= 20) dispo.push("deepseek");
  const o = process.env.OPENAI_API_KEY;
  if (o && o.length >= 20) dispo.push("openai");
  return dispo;
}
