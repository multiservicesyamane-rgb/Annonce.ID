import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Route serveur — la clé ANTHROPIC_API_KEY reste secrète côté serveur.
export const dynamic = "force-dynamic";

// ── Maîtrise des coûts ──
// Utilisateurs (public)  → Haiku 4.5 (≈ gratuit, ~0,002 $/génération)
// Super admin            → Opus 4.8 (qualité max)
const MODELS = { user: "claude-haiku-4-5", admin: "claude-opus-4-8" } as const;

// Rate limiting basique en mémoire (anti-abus)
const rl = new Map<string, { count: number; ts: number }>();
const RL_WINDOW = 60 * 1000;
const RL_MAX = 12; // 12 générations / minute / IP

const SYSTEM = `Tu es l'assistant commercial IA d'Wanteermako (plateforme de petites annonces et de marketing B2B en Afrique de l'Ouest, par YamaneTech).
Tu écris en français, ton professionnel, chaleureux et persuasif, adapté au marché ouest-africain (Sénégal, Côte d'Ivoire, Mali, etc.).
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
    default:
      return `Rédige un texte marketing professionnel en français pour : "${topic || company}".`;
  }
}

// ── FALLBACK GRATUIT (sans API) ──
// Modèles de texte intégrés : utilisés quand la clé Claude est absente ou que
// l'appel échoue (pas de crédits, erreur réseau...). Permet de tester l'outil
// AVANT tout paiement. Bascule auto sur Claude dès que les crédits sont dispo.
function templateText(body: any): string {
  const kind = body?.kind || "email";
  const company = (body?.company || "").trim() || "votre entreprise";
  const city = (body?.city || "").trim() || "votre ville";
  const sector = (body?.sector || "").trim() || "votre secteur";
  const topic = (body?.topic || "").trim() || "votre produit";

  switch (kind) {
    case "email":
      return `Objet : Boostez la visibilité de ${company} à ${city}

Bonjour,

Nous avons remarqué votre activité dans le secteur ${sector} à ${city}. Wanteermako permet à votre entreprise de :
✅ Toucher des acheteurs qualifiés dans 27 pays d'Afrique
✅ Diffuser automatiquement vos annonces sur Facebook et WhatsApp
✅ Générer des prospects et suivre vos statistiques en temps réel

Seriez-vous disponible pour une présentation de 15 minutes cette semaine ?

Cordialement,
L'équipe Wanteermako`;
    case "whatsapp":
      return `Bonjour 👋

Je vous contacte concernant la promotion de ${sector} à ${city} sur *Wanteermako*.

Nous aidons les entreprises à :
📈 Augmenter leur visibilité
🎯 Générer des contacts qualifiés
📱 Diffuser sur Facebook & WhatsApp

Puis-je vous présenter notre offre en 5 min ? 🙏`;
    case "listing_title":
      return `🔥 ${topic} — Excellent état, prix imbattable à ${city}`;
    case "listing_description":
      return `${topic} en très bon état, disponible immédiatement à ${city}.

✅ Qualité garantie
✅ Prix négociable
✅ Vendeur sérieux et réactif

N'attendez plus : contactez-nous dès maintenant pour réserver ! Livraison possible. 📞`;
    case "facebook":
      return `🔥 BONNE AFFAIRE à ${city} ! 🔥

${topic} disponible dès maintenant sur Wanteermako. Qualité au top, prix imbattable. Ne ratez pas cette occasion ! 👇

#Wanteermako #${(sector || "BonPlan").replace(/\s+/g, "")} #${city.replace(/\s+/g, "")} #Sénégal #BonPlan`;
    default:
      return `${topic} — disponible sur Wanteermako.`;
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
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Pas de clé → on sert directement le modèle gratuit (fonctionne avant paiement)
  if (!apiKey) {
    return NextResponse.json({ text: templateText(body), source: "template" });
  }

  const client = new Anthropic({ apiKey });
  const model = body?.tier === "admin" ? MODELS.admin : MODELS.user;

  try {
    const msg = await client.messages.create({
      model,
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(body) }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return NextResponse.json({ text, source: "ai" });
  } catch (error: any) {
    // Crédits épuisés / erreur API → on bascule sur le modèle gratuit (jamais bloquant)
    console.warn("AI fallback (template):", error?.status, error?.message);
    return NextResponse.json({ text: templateText(body), source: "template" });
  }
}
