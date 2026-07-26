import { NextResponse } from "next/server";

// Route serveur — Utilise le modèle Gemini 1.5 Flash (Gratuit) via l'API Key.
export const dynamic = "force-dynamic";

// Rate limiting basique en mémoire (anti-abus)
const rl = new Map<string, { count: number; ts: number }>();
const RL_WINDOW = 60 * 1000;
const RL_MAX = 15; // 15 générations / minute / IP

const SYSTEM_INSTRUCTION = `Tu es un copywriter expert des petites annonces en Afrique de l'Ouest (marché sénégalais).
Tu écris en FRANÇAIS uniquement (JAMAIS de wolof ni d'autre langue locale), dans un style clair, concret et crédible.
Règles de qualité IMPÉRATIVES :
- Sois SPÉCIFIQUE au produit et à sa catégorie : mets en avant les détails qui comptent réellement pour un acheteur de CETTE catégorie.
- Appuie-toi UNIQUEMENT sur les informations fournies. N'invente jamais un chiffre précis non fourni (% de batterie, année, kilométrage, superficie, durée de garantie, numéro) — si l'info manque, reste sur des formulations générales.
- VARIE la formulation et la structure à chaque génération : ne commence pas toujours de la même façon.
- BANNIS les clichés vides : « prix imbattable », « à ne pas rater », « occasion en or », « qualité au top », « bonne affaire », « foncez », les rafales d'emojis et les MAJUSCULES criardes.
- Ton chaleureux mais professionnel, orienté confiance (les acheteurs se méfient des arnaques).
Réponds UNIQUEMENT avec le texte demandé, prêt à publier, sans préambule ni guillemets autour.`;

// Angle de rédaction par catégorie : ce qui compte vraiment pour l'acheteur.
const CATEGORY_ANGLES: Record<string, string> = {
  vehicules: "Priorise : marque/modèle, année, kilométrage, boîte (auto/manuelle), carburant, état mécanique, papiers à jour (carte grise, visite technique), entretien.",
  immobilier: "Priorise : type de bien, superficie et nombre de pièces, quartier précis, commodités (eau, électricité, parking, sécurité), meublé ou non, proximité (écoles, routes, marché), disponibilité.",
  electronique: "Priorise : marque/modèle, stockage/RAM, état (neuf/comme neuf/occasion), autonomie, accessoires fournis, déverrouillé, garantie éventuelle.",
  maison: "Priorise : type d'appareil/meuble, marque, état, dimensions, bon fonctionnement testé, faible usure, accessoires.",
  mode: "Priorise : marque, taille/pointure, matière, couleur, état (neuf avec étiquette ?), authenticité, coupe.",
  emploi: "Décris clairement : intitulé du poste, missions, profil et expérience recherchés, type de contrat, lieu, rémunération si connue, comment postuler. Ton professionnel, sans survente.",
  services: "Priorise : nature du service, expérience/expertise, zone d'intervention, délais, ce qui vous distingue, garanties, comment réserver.",
  sport: "Priorise : type d'article, marque, état, taille, niveau (débutant/confirmé), accessoires inclus.",
  "equipements-pro": "Priorise : type de matériel, marque/modèle, capacité/puissance, état, heures d'usage, secteur d'utilisation, entretien.",
  agriculture: "Priorise : nature (animal, semence, matériel, récolte), quantité/poids, race/variété, âge, santé/rendement, origine, période de disponibilité.",
  animaux: "Priorise : espèce/race, âge, sexe, vaccins/santé, tempérament, ce qui est fourni. Ton responsable.",
  entreprises: "Priorise : type d'opportunité/fonds de commerce, secteur, emplacement, potentiel, raison de cession, sérieux du dossier.",
  alimentation: "Priorise : produit, quantité/format, fraîcheur, origine/provenance, conservation, halal si pertinent, livraison possible.",
  numerique: "Priorise : type de produit, ce qu'il apporte/contient, format de livraison, compatibilité, accès immédiat, support.",
};

// Détermine l'angle : d'abord via categorySlug, sinon en devinant depuis le texte de catégorie.
function angleFor(body: any): string {
  const slug = String(body?.categorySlug || "").toLowerCase().trim();
  if (CATEGORY_ANGLES[slug]) return CATEGORY_ANGLES[slug];
  const c = String(body?.category || "").toLowerCase();
  if (/voiture|moto|scooter|auto|camion|v[eé]hicule|transport|pi[eè]ce/.test(c)) return CATEGORY_ANGLES.vehicules;
  if (/maison|appart|terrain|villa|immo|location|studio|chambre|bureau|boutique/.test(c)) return CATEGORY_ANGLES.immobilier;
  if (/t[eé]l[eé]phone|phone|iphone|samsung|ordinateur|\bpc\b|laptop|tablette|multim[eé]dia|[eé]cran|console/.test(c)) return CATEGORY_ANGLES.electronique;
  if (/[eé]lectrom[eé]nager|meuble|frigo|cong[eé]l|cuisini[eè]re|climatiseur/.test(c)) return CATEGORY_ANGLES.maison;
  if (/mode|v[eê]tement|chaussure|\bsac\b|montre|beaut[eé]|bijou|accessoire/.test(c)) return CATEGORY_ANGLES.mode;
  if (/emploi|recrut|poste|stage|\bcv\b/.test(c)) return CATEGORY_ANGLES.emploi;
  if (/service|prestation|r[eé]paration|couture|plomb|ma[cç]on|coiff/.test(c)) return CATEGORY_ANGLES.services;
  if (/sport|loisir|v[eé]lo|fitness|musique|instrument|\bjeu\b/.test(c)) return CATEGORY_ANGLES.sport;
  if (/agricult|[eé]levage|mouton|b[oœ]uf|volaille|semence|r[eé]colte/.test(c)) return CATEGORY_ANGLES.agriculture;
  if (/animal|animaux|chien|chat|oiseau|poule/.test(c)) return CATEGORY_ANGLES.animaux;
  if (/aliment|boisson|nourriture|[eé]picerie|fruit|l[eé]gume/.test(c)) return CATEGORY_ANGLES.alimentation;
  if (/num[eé]rique|ebook|formation|logiciel|licence|template/.test(c)) return CATEGORY_ANGLES.numerique;
  return "Mets en avant les 3-4 informations les plus utiles à un acheteur pour cette catégorie, de façon concrète et honnête.";
}

// Reformate les caractéristiques déjà saisies pour ancrer la génération sur des faits réels.
function specsContext(body: any): string {
  const specs = body?.specs && typeof body.specs === "object" ? body.specs : null;
  if (!specs) return "";
  const entries = Object.entries(specs).filter(([, v]) => v && String(v).trim() && String(v) !== "Choisir...");
  if (!entries.length) return "";
  return (
    "Informations déjà renseignées par le vendeur (utilise-les, ne les contredis pas) :\n" +
    entries.map(([k, v]) => `- ${k} : ${v}`).join("\n") +
    "\n"
  );
}

function buildPrompt(body: any): string {
  const kind = body?.kind || "email";
  const company = (body?.company || "").trim() || "[Entreprise]";
  const city = (body?.city || "").trim() || "Dakar";
  const sector = (body?.sector || "").trim() || "général";
  const topic = (body?.topic || "").trim();
  const category = (body?.category || "").trim() || sector;

  switch (kind) {
    case "email":
      return `Rédige un email commercial de prospection pour convaincre l'entreprise "${company}" (secteur : ${sector}, ville : ${city}) de s'abonner à Wanteermako.
Mets en avant : visibilité dans 27 pays, diffusion automatique Facebook/WhatsApp, génération de prospects qualifiés, statistiques.
Termine par un appel à l'action (proposer une présentation de 15 min). Format : Objet + corps. Maximum 150 mots.`;
    case "whatsapp":
      return `Rédige un message WhatsApp court (4-6 lignes, avec quelques emojis pertinents) pour un ${topic || "premier contact"} commercial avec une entreprise du secteur ${sector} à ${city}, afin de présenter Wanteermako et proposer une offre de visibilité. Ton direct et amical.`;
    case "listing_title":
      return `Génère 1 SEUL titre d'annonce pour : "${topic}".
Catégorie : ${category} — Ville : ${city}.
${angleFor(body)}
${specsContext(body)}Contraintes : 40 à 70 caractères, ultra-spécifique (place en premier l'info la plus vendeuse selon la catégorie : modèle, état, taille, quartier…), français impeccable, au plus 1 emoji pertinent (ou aucun), aucun cliché ni majuscules criardes. Donne UNIQUEMENT le titre, sans guillemets.`;
    case "listing_description":
      return `Rédige la description d'une annonce pour : "${topic}".
Catégorie : ${category} — Ville : ${city}.
${angleFor(body)}
${specsContext(body)}Structure : (1) une accroche concrète et spécifique (pas de cliché) ; (2) 3 à 5 points clés = les détails réels qui comptent pour cette catégorie ; (3) une phrase de mise en confiance ; (4) un appel à l'action clair (visite, essai, contact). 90 à 140 mots, français soigné, emojis avec parcimonie. N'invente aucun fait précis non fourni.`;
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

// Extrait un détail concret des caractéristiques saisies (ex: "128 Go", "Noir").
function detailFrom(body: any): string {
  const specs = body?.specs && typeof body.specs === "object" ? body.specs : null;
  if (!specs) return "";
  const vals = Object.values(specs)
    .map((v) => String(v || "").trim())
    .filter((v) => v && v !== "Choisir...");
  return vals.slice(0, 2).join(" · ");
}

// Transforme les caractéristiques saisies en liste à puces (pour la description).
function specListFrom(body: any): string {
  const specs = body?.specs && typeof body.specs === "object" ? body.specs : null;
  if (!specs) return "";
  const lines = Object.entries(specs)
    .filter(([, v]) => v && String(v).trim() && String(v) !== "Choisir...")
    .slice(0, 5)
    .map(([k, v]) => `✅ ${k} : ${v}`);
  return lines.join("\n");
}

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
      const d = detailFrom(body);
      const detail = d ? ` ${d}` : "";
      const tpl = [
        `${topic}${detail} — ${city}`,
        `${topic}${detail}, bon état · ${city}`,
        `À vendre : ${topic}${detail} (${city})`,
        `${topic}${detail} disponible à ${city}`,
        `✨ ${topic}${detail} · ${city}`,
      ];
      return pick(tpl).slice(0, 70);
    }
    case "listing_description": {
      const ouv = pick([
        `${topic} disponible à ${city}, en bon état et prêt à l'emploi.`,
        `À vendre à ${city} : ${topic}. Voici l'essentiel à savoir.`,
        `Je propose ${topic} à ${city}, à un prix cohérent avec le marché.`,
      ]);
      const args =
        specListFrom(body) ||
        pick([
          `✅ Bon état général\n✅ Prix cohérent avec le marché\n✅ Vendeur réactif et sérieux`,
          `✅ Fonctionne parfaitement\n✅ Peu servi\n✅ Disponible tout de suite`,
          `✅ Produit fiable\n✅ Bon rapport qualité/prix\n✅ Réponse rapide`,
        ]);
      const fin = pick([
        `Intéressé(e) ? Contactez-moi pour organiser une visite ou en savoir plus. 📞`,
        `Écrivez-moi pour plus de photos ou pour convenir d'un rendez-vous. 📲`,
        `Disponible pour toute question — contactez-moi directement. 🤝`,
      ]);
      return `${ouv}\n\n${args}\n\n${fin}`;
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

  return `Tu prépares une annonce de qualité pour : "${topic}" (catégorie : ${category}, ville : ${city}).
${angleFor(body)}
${specsContext(body)}Génère un objet JSON STRICT (aucun texte autour, pas de backticks) avec exactement ces clés :
{
  "title": "titre spécifique et vendeur, 40-70 caractères, au plus 1 emoji, sans cliché",
  "description": "description structurée de 90 à 140 mots : accroche concrète + 3 à 5 points clés (détails réels de la catégorie) + mise en confiance + appel à l'action ; français soigné, emojis avec parcimonie, aucun cliché",
  "specs": { "<libellé exact>": "<valeur plausible>", ... }
}
Pour "specs", complète CHAQUE caractéristique ci-dessous avec une valeur réaliste et cohérente avec le titre (respecte les options imposées ; mets "" si vraiment indéterminable) :
${fieldsDesc}
N'invente aucun fait précis invérifiable (faux numéro, chiffres inventés). Varie le style. Réponds UNIQUEMENT avec le JSON valide.`;
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
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          maxOutputTokens: 2048,
          // Tâches créatives courtes : on désactive le « thinking » de gemini-2.5
          // (il consommait le budget de tokens et ralentissait la réponse).
          thinkingConfig: { thinkingBudget: 0 },
        },
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
