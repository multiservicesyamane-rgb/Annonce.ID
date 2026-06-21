import { NextResponse } from "next/server";

// Route serveur — Utilise le modèle Gemini 1.5 Flash (Gratuit) via l'API Key.
export const dynamic = "force-dynamic";

// Rate limiting basique en mémoire (anti-abus)
const rl = new Map<string, { count: number; ts: number }>();
const RL_WINDOW = 60 * 1000;
const RL_MAX = 15; // 15 générations / minute / IP

const SYSTEM_INSTRUCTION = `Tu es l'assistant commercial IA de la plateforme Wanteermako.
Tu rédiges TOUS les textes UNIQUEMENT en Français standard de manière chaleureuse, persuasive et professionnelle.
Il ne faut absolument JAMAIS utiliser de Wolof ni d'autre langue locale dans tes réponses. Tout doit être rédigé en Français uniquement.
Réponds UNIQUEMENT avec le texte demandé, sans préambule ni commentaire, prêt à copier-coller.`;

function buildPrompt(body: any): string {
  const kind = body?.kind || "email";
  const company = (body?.company || "").trim() || "[Entreprise]";
  const city = (body?.city || "").trim() || "Dakar";
  const sector = (body?.sector || "").trim() || "général";
  const topic = (body?.topic || "").trim();

  switch (kind) {
    case "email":
      return `Rédige un email commercial de prospection pour convaincre l'entreprise "${company}" (secteur : ${sector}, ville : ${city}) de s'abonner à Wanteermako.
Mets en avant : visibilité dans 27 pays, diffusion automatique Facebook/WhatsApp, génération de prospects qualifiés, statistiques.
Termine par un appel à l'action (proposer une présentation de 15 min). Format : Objet + corps. Maximum 150 mots.`;
    case "whatsapp":
      return `Rédige un message WhatsApp court (4-6 lignes, avec quelques emojis pertinents) pour un ${topic || "premier contact"} commercial avec une entreprise du secteur ${sector} à ${city}, afin de présenter Wanteermako et proposer une offre de visibilité. Ton direct et amical.`;
    case "listing_title":
      return `Génère 1 titre d'annonce optimisé (accrocheur, avec mots-clés SEO et 1 emoji) pour ce produit/service : "${topic}". Maximum 70 caractères. Donne uniquement le titre.`;
    case "listing_description":
      return `Rédige une description d'annonce vendeuse et structurée pour : "${topic}". Inclus caractéristiques, avantages et un appel à l'action. 80-120 mots.`;
    case "facebook":
      return `Rédige un post Facebook attractif (avec emojis et 3-5 hashtags pertinents) pour promouvoir cette annonce : "${topic}". Maximum 80 mots.`;
    case "listing_price":
      return `Pour ce produit/service : "${topic}" (catégorie : ${(body?.category || sector)}, ville : ${city}), donne UNIQUEMENT un prix conseillé réaliste pour le marché de l'occasion en Afrique de l'Ouest (FCFA). Réponds avec un NOMBRE ENTIER seul, sans texte, sans symbole, sans espace. Exemple : 150000`;
    case "seller_tips":
      return `Donne 4 conseils courts et concrets (format liste à puces avec emojis) pour vendre plus vite l'annonce "${topic}" sur une plateforme de petites annonces en Afrique de l'Ouest. Maximum 55 mots au total.`;
    default:
      return `Rédige un texte marketing professionnel en français pour : "${topic || company}".`;
  }
}

// ── FALLBACK GRATUIT (sans API) ──
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function templateText(body: any): string {
  const kind = body?.kind || "email";
  const company = (body?.company || "").trim() || "votre entreprise";
  const city = (body?.city || "").trim() || "votre ville";
  const sector = (body?.sector || "").trim() || "votre secteur";
  const topic = (body?.topic || "").trim() || "votre produit";
  const tag = (s: string) => s.replace(/\s+/g, "");

  switch (kind) {
    case "email": {
      const objets = [
        `Objet : Boostez la visibilité de ${company} à ${city}`,
        `Objet : ${company}, multipliez vos ventes à ${city}`,
        `Objet : Plus de clients pour ${company} grâce à Wanteermako`,
        `Objet : Une opportunité de visibilité pour ${company}`,
      ];
      const accroches = [
        `Nous avons remarqué votre activité dans le secteur ${sector} à ${city}.`,
        `Votre entreprise dans le secteur ${sector} mérite plus de visibilité à ${city}.`,
        `En tant qu'acteur du secteur ${sector} à ${city}, vous gagneriez à être davantage visible.`,
      ];
      const ctas = [
        `Seriez-vous disponible pour une présentation de 15 minutes cette semaine ?`,
        `Quand pouvons-nous échanger 15 minutes pour vous montrer concrètement les résultats ?`,
        `Puis-je vous appeler cette semaine pour vous présenter notre offre ?`,
      ];
      return `${pick(objets)}

Bonjour,

${pick(accroches)} Wanteermako permet à votre entreprise de :
✅ Toucher des acheteurs qualifiés dans toute l'Afrique de l'Ouest
✅ Diffuser vos annonces sur Facebook et WhatsApp
✅ Générer des prospects et suivre vos statistiques en temps réel

${pick(ctas)}

Cordialement,
L'équipe Wanteermako`;
    }
    case "whatsapp": {
      const intros = ["Bonjour 👋", "Bonjour, j'espère que vous allez bien 🙂", "Bonjour 👋"];
      const fins = [
        `Puis-je vous présenter notre offre en 5 min ? 🙏`,
        `Ça vous intéresse d'en savoir plus ? 😊`,
        `Quand seriez-vous disponible pour un échange rapide ? 📞`,
      ];
      return `${pick(intros)}

Je vous contacte concernant la promotion de ${sector} à ${city} sur *Wanteermako*.

Nous aidons les entreprises à :
📈 Augmenter leur visibilité
🎯 Générer des contacts qualifiés
📱 Être présentes sur Facebook & WhatsApp

${pick(fins)}`;
    }
    case "listing_title": {
      const tpl = [
        `🔥 ${topic} — Excellent état, prix imbattable à ${city}`,
        `✨ ${topic} de qualité à saisir à ${city}`,
        `💥 Bonne affaire : ${topic} disponible à ${city}`,
        `⭐ ${topic} — Occasion à ne pas rater (${city})`,
        `🚀 ${topic} au meilleur prix à ${city}`,
      ];
      return pick(tpl);
    }
    case "listing_description": {
      const ouv = [
        `${topic} en très bon état, disponible immédiatement à ${city}.`,
        `À vendre : ${topic}, parfait état, à ${city}.`,
        `Superbe ${topic} à saisir rapidement à ${city}.`,
      ];
      const args = pick([
        `✅ Qualité garantie\n✅ Prix négociable\n✅ Vendeur sérieux et réactif`,
        `✅ Très bon état\n✅ Prix intéressant\n✅ Disponible tout de suite`,
        `✅ Produit fiable\n✅ Bon rapport qualité/prix\n✅ Réponse rapide`,
      ]);
      const fin = pick([
        `N'attendez plus : contactez-nous dès maintenant pour réserver ! Livraison possible. 📞`,
        `Contactez-nous vite, ça part rapidement ! 📲`,
        `Intéressé(e) ? Écrivez-nous maintenant pour plus d'infos. 🤝`,
      ]);
      return `${pick(ouv)}\n\n${args}\n\n${fin}`;
    }
    case "facebook": {
      const heads = [`🔥 BONNE AFFAIRE à ${city} ! 🔥`, `💥 À SAISIR à ${city} 💥`, `✨ OFFRE DU MOMENT — ${city} ✨`];
      return `${pick(heads)}

${topic} disponible dès maintenant sur Wanteermako. ${pick(["Qualité au top, prix imbattable.", "Ne ratez pas cette occasion unique.", "Stock limité, foncez !"])} 👇

#Wanteermako #${tag(sector || "BonPlan")} #${tag(city)} #Afrique #BonPlan`;
    }
    case "seller_tips":
      return `📸 Ajoutez plusieurs photos nettes et lumineuses\n💬 Répondez rapidement aux messages\n💰 Fixez un prix juste (et négociable)\n🚀 Boostez votre annonce pour 3× plus de vues`;
    case "listing_price":
      return ""; // pas d'estimation sans IA
    default:
      return `${topic} — disponible sur Wanteermako.`;
  }
}

// ── Mode "tout générer" : titre + description + caractéristiques en JSON ──
function buildAllPrompt(body: any): string {
  const topic = (body?.topic || "").trim() || "mon article";
  const category = (body?.category || "").trim() || "général";
  const city = (body?.city || "").trim() || "Dakar";
  const fields: { label: string; options?: string[] }[] = Array.isArray(body?.fields) ? body.fields : [];
  const fieldsDesc = fields.length
    ? fields.map((f) => (f.options?.length ? `- ${f.label} (choisir UNIQUEMENT parmi : ${f.options.join(", ")})` : `- ${f.label}`)).join("\n")
    : "(aucune)";

  return `Pour cette annonce — produit/service : "${topic}" (catégorie : ${category}, ville : ${city}) —
génère un objet JSON STRICT (aucun texte autour, pas de backticks) avec exactement ces clés :
{
  "title": "titre accrocheur, max 70 caractères, avec 1 emoji et mots-clés",
  "description": "description vendeuse de 80 à 120 mots, avec puces ✅ et un appel à l'action",
  "specs": { "<libellé exact>": "<valeur plausible>", ... }
}
Pour "specs", donne une valeur réaliste pour chacune de ces caractéristiques (respecte les options imposées ; mets "" si vraiment inconnu) :
${fieldsDesc}
Réponds UNIQUEMENT avec le JSON valide.`;
}

function templateAll(body: any) {
  return {
    title: templateText({ ...body, kind: "listing_title" }).replace(/^["']|["']$/g, "").slice(0, 70),
    description: templateText({ ...body, kind: "listing_description" }),
    specs: {} as Record<string, string>,
  };
}

function parseAll(raw: string): { title?: string; description?: string; specs?: Record<string, string> } | null {
  try {
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end < 0) return null;
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  // Rate limit par IP
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const rec = rl.get(ip);
  if (!rec || now - rec.ts > RL_WINDOW) {
    rl.set(ip, { count: 1, ts: now });
  } else if (rec.count >= RL_MAX) {
    return NextResponse.json({ error: "Trop de générations. Réessayez dans une minute." }, { status: 429 });
  } else {
    rec.count++;
  }

  const body = await req.json().catch(() => ({}));
  const apiKey = process.env.GEMINI_API_KEY;
  const isAll = body?.kind === "listing_all";
  const hasKey = apiKey && !apiKey.includes("your_gemini");

  // Appel Gemini commun. Lance une erreur si échec (pour basculer sur le template).
  async function callGemini(prompt: string): Promise<string> {
    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\n[Consigne]:\n${prompt}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.5-flash"}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || response.statusText);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!text) throw new Error("Réponse vide");
    return text;
  }

  // ── Mode "tout générer" : renvoie { title, description, specs } ──
  if (isAll) {
    if (!hasKey) return NextResponse.json({ ...templateAll(body), source: "template" });
    try {
      const parsed = parseAll(await callGemini(buildAllPrompt(body)));
      if (!parsed) throw new Error("JSON invalide");
      return NextResponse.json({
        title: (parsed.title || "").slice(0, 80),
        description: (parsed.description || "").slice(0, 2000),
        specs: parsed.specs && typeof parsed.specs === "object" ? parsed.specs : {},
        source: "ai",
      });
    } catch (error: any) {
      console.warn("Gemini all error (fallback template):", error?.message);
      return NextResponse.json({ ...templateAll(body), source: "template" });
    }
  }

  // ── Mode texte simple (titre, description, email, whatsapp, facebook…) ──
  if (!hasKey) return NextResponse.json({ text: templateText(body), source: "template" });
  try {
    return NextResponse.json({ text: await callGemini(buildPrompt(body)), source: "ai" });
  } catch (error: any) {
    console.warn("Gemini API error (falling back to templates):", error?.message);
    return NextResponse.json({ text: templateText(body), source: "template" });
  }
}
