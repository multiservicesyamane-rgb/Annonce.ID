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
  const apiKey = process.env.GEMINI_API_KEY;

  // Pas de clé → on sert directement le modèle de secours gratuit (template)
  if (!apiKey || apiKey.includes("your_gemini")) {
    return NextResponse.json({ text: templateText(body), source: "template" });
  }

  try {
    const prompt = buildPrompt(body);
    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\n[Consigne de rédaction]:\n${prompt}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || response.statusText);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!text) {
      throw new Error("Gemini a retourné une réponse vide.");
    }

    return NextResponse.json({ text, source: "ai" });
  } catch (error: any) {
    console.warn("Gemini API error (falling back to templates):", error?.message);
    return NextResponse.json({ text: templateText(body), source: "template" });
  }
}
