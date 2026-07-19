// Module Gemini 1.5 Flash (gratuit) réutilisable côté serveur.
// Sert l'IA si GEMINI_API_KEY est présente, sinon repli gratuit par templates.

const SYSTEM_INSTRUCTION = `Tu es l'assistant marketing IA de la plateforme Wanteermako.
Tu rédiges TOUS les textes UNIQUEMENT en Français standard, de manière chaleureuse, vendeuse et professionnelle.
N'utilise JAMAIS de Wolof ni d'autre langue locale.
Réponds UNIQUEMENT avec le texte demandé, sans préambule ni commentaire, prêt à publier.`;

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Appel générique Gemini. Retourne null en cas d'échec/absence de clé (au lieu de throw).
export async function geminiGenerate(prompt: string, system = SYSTEM_INSTRUCTION): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("your_gemini")) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.5-flash"}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\n[Consigne]:\n${prompt}` }] }],
          // 2048 et non 800 : sur gemini-2.5-*, les tokens de "thinking" comptent
          // dans maxOutputTokens — à 800 la réponse était tronquée en plein texte.
          generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || res.statusText);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return text || null;
  } catch (e: any) {
    console.warn("Gemini error:", e?.message);
    return null;
  }
}

export interface ListingForCaption {
  title?: string;
  description?: string;
  price?: number | string;
  category?: string;
  location?: string;
}

function tag(s: string) {
  return (s || "").replace(/[^\p{L}\p{N}]+/gu, "");
}

// Légende de secours gratuite (sans IA) — toujours disponible.
export function templateCaption(l: ListingForCaption): string {
  const title = (l.title || "Bonne affaire").trim();
  const city = (l.location || "Afrique de l'Ouest").trim();
  const cat = (l.category || "").trim();
  const heads = [`🔥 BONNE AFFAIRE à ${city} ! 🔥`, `💥 À SAISIR à ${city} 💥`, `✨ OFFRE DU MOMENT — ${city} ✨`];
  const prix = l.price ? ` — ${Number(l.price).toLocaleString("fr-FR")} FCFA` : "";
  const cta = pick([
    "Stock limité, contactez-nous vite ! 👇",
    "Ne ratez pas cette occasion, écrivez-nous ! 👇",
    "Disponible maintenant, foncez ! 👇",
  ]);
  return `${pick(heads)}

${title}${prix}

${cta}

#Wanteermako #${tag(cat || "BonPlan")} #${tag(city)} #Afrique #BonPlan`;
}

// Génère la légende d'une annonce : IA si possible, sinon template gratuit.
export async function captionForListing(l: ListingForCaption): Promise<{ text: string; source: "ai" | "template" }> {
  const prix = l.price ? `${Number(l.price).toLocaleString("fr-FR")} FCFA` : "non précisé";
  const prompt = `Rédige un post réseaux sociaux court et vendeur (avec emojis et 3-5 hashtags pertinents en fin de texte) pour promouvoir cette annonce :
- Titre : ${l.title || "—"}
- Catégorie : ${l.category || "—"}
- Lieu : ${l.location || "—"}
- Prix : ${prix}
- Détails : ${(l.description || "").slice(0, 400)}
Maximum 90 mots. Ajoute un appel à l'action. Inclus le hashtag #Wanteermako.`;

  const ai = await geminiGenerate(prompt);
  if (ai) return { text: ai, source: "ai" };
  return { text: templateCaption(l), source: "template" };
}
