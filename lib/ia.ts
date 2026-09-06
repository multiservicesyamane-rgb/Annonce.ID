// Deux moteurs de redaction, l'un derriere l'autre.
//
// ── Pourquoi deux ────────────────────────────────────────────────────────
// Un seul fournisseur, c'est un seul point de panne. Gemini a des quotas par
// minute sur son offre gratuite : au-dela, il refuse. OpenAI est payant mais
// disponible. Les enchainer donne un module qui continue d'ecrire quand l'un
// des deux tombe — sans que l'utilisateur ait quoi que ce soit a faire.
//
// ── L'ordre, et pourquoi ─────────────────────────────────────────────────
// Gemini d'abord : il est gratuit, et la facture d'un module ouvert au public
// se compte vite. OpenAI ne prend le relais que si Gemini n'a rien rendu.
// CARRIERE_IA_ORDRE inverse l'ordre sans toucher au code — « openai,gemini »
// fait ecrire OpenAI en premier, par exemple pour comparer la qualite.
//
// Les deux clefs sont facultatives : avec une seule, le module fonctionne
// avec celle-la ; avec aucune, la redaction est simplement indisponible et
// l'editeur reste utilisable a la main.

import { geminiGenerate } from "@/lib/gemini";

export type Fournisseur = "gemini" | "openai";

export type Redaction = { texte: string; par: Fournisseur };

/** Ordre d'essai, lu une fois au demarrage du serveur. */
function ordre(): Fournisseur[] {
  const brut = (process.env.CARRIERE_IA_ORDRE || "gemini,openai").toLowerCase();
  const liste = brut
    .split(",")
    .map((f) => f.trim())
    .filter((f): f is Fournisseur => f === "gemini" || f === "openai");
  return liste.length ? liste : ["gemini", "openai"];
}

/* ============================== OpenAI ============================== */

/**
 * Appel OpenAI. Renvoie null plutot que de lever : un fournisseur en panne
 * doit laisser sa place au suivant, pas casser la requete.
 *
 * Le modele est configurable (OPENAI_MODEL) : celui par defaut est le plus
 * economique de la gamme, et la redaction d'un courrier d'une page ne demande
 * pas davantage.
 */
export async function openaiGenerate(prompt: string, system: string): Promise<string | null> {
  const cle = process.env.OPENAI_API_KEY;
  if (!cle || cle.length < 20) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cle}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
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
    console.warn("[ia] openai:", e?.message);
    return null;
  }
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
      fournisseur === "gemini" ? await geminiGenerate(prompt, system) : await openaiGenerate(prompt, system);

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
  const o = process.env.OPENAI_API_KEY;
  if (o && o.length >= 20) dispo.push("openai");
  return dispo;
}
