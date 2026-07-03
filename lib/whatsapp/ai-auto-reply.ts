import crypto from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { BOOSTS, SUBSCRIPTION_PLANS } from "@/lib/constants";
import { geminiGenerate } from "@/lib/gemini";

type SupabaseAdmin = SupabaseClient<any, "public", any> | null;

export type WhatsAppIncomingMessage = {
  id: string;
  from: string;
  name?: string;
  phoneNumberId?: string;
  text: string;
  type: string;
  timestamp?: string;
  raw: unknown;
};

export type WhatsAppProcessResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  messageId: string;
  to?: string;
  source?: "ai" | "template";
  error?: string;
};

type ListingMatch = {
  id: string | number;
  title?: string | null;
  slug?: string | null;
  price?: string | number | null;
  price_type?: string | null;
  location?: string | null;
  category?: string | null;
};

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://wanteermako.com"
).replace(/\/+$/, "");

const STOP_WORDS = new Set([
  "bonjour",
  "bonsoir",
  "salut",
  "merci",
  "avec",
  "pour",
  "dans",
  "vous",
  "nous",
  "suis",
  "veux",
  "cherche",
  "avoir",
  "cest",
  "est",
  "une",
  "des",
  "les",
  "mon",
  "ton",
  "son",
  "sur",
  "pas",
  "plus",
]);

const processedInMemory = new Map<string, number>();
const DEDUPE_TTL_MS = 10 * 60 * 1000;

function envFlag(name: string, fallback = false) {
  const value = process.env[name];
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function isWhatsAppAutoReplyEnabled() {
  return envFlag("WHATSAPP_AI_ENABLED", false);
}

function graphVersion() {
  return process.env.WHATSAPP_GRAPH_VERSION || process.env.META_GRAPH_VERSION || "v20.0";
}

function adminClient(): SupabaseAdmin {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function isDuplicateInMemory(messageId: string) {
  const now = Date.now();
  for (const [id, ts] of processedInMemory.entries()) {
    if (now - ts > DEDUPE_TTL_MS) processedInMemory.delete(id);
  }
  if (processedInMemory.has(messageId)) return true;
  processedInMemory.set(messageId, now);
  return false;
}

function cleanText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function textFromMessage(message: any): string {
  const type = message?.type;
  if (type === "text") return cleanText(message?.text?.body || "");
  if (type === "button") return cleanText(message?.button?.text || message?.button?.payload || "");
  if (type === "interactive") {
    const button = message?.interactive?.button_reply;
    const list = message?.interactive?.list_reply;
    return cleanText(button?.title || button?.id || list?.title || list?.description || list?.id || "");
  }
  if (type === "image") return cleanText(message?.image?.caption || "Le client a envoye une image.");
  if (type === "video") return cleanText(message?.video?.caption || "Le client a envoye une video.");
  if (type === "document") return cleanText(message?.document?.caption || message?.document?.filename || "Le client a envoye un document.");
  if (type === "audio" || type === "voice") return "Le client a envoye un message vocal.";
  if (type === "location") return "Le client a partage sa localisation.";
  return "Le client a envoye un message WhatsApp.";
}

export function extractIncomingMessages(payload: any): WhatsAppIncomingMessage[] {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  const messages: WhatsAppIncomingMessage[] = [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value || {};
      const phoneNumberId = value?.metadata?.phone_number_id
        ? String(value.metadata.phone_number_id)
        : undefined;
      const contacts = new Map<string, string>();

      for (const contact of Array.isArray(value?.contacts) ? value.contacts : []) {
        if (contact?.wa_id) contacts.set(String(contact.wa_id), String(contact?.profile?.name || ""));
      }

      for (const message of Array.isArray(value?.messages) ? value.messages : []) {
        if (!message?.id || !message?.from) continue;
        messages.push({
          id: String(message.id),
          from: String(message.from),
          name: contacts.get(String(message.from)) || undefined,
          phoneNumberId,
          text: textFromMessage(message),
          type: String(message?.type || "unknown"),
          timestamp: message?.timestamp ? String(message.timestamp) : undefined,
          raw: message,
        });
      }
    }
  }

  return messages;
}

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function searchTerms(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
    .slice(0, 5);
}

async function searchActiveListings(messageText: string): Promise<ListingMatch[]> {
  const sb = adminClient();
  const terms = searchTerms(messageText);
  if (!sb || terms.length === 0) return [];

  const filters = terms.flatMap((term) => [
    `title.ilike.%${term}%`,
    `description.ilike.%${term}%`,
    `category.ilike.%${term}%`,
    `location.ilike.%${term}%`,
  ]);

  try {
    const { data, error } = await sb
      .from("listings")
      .select("id,title,slug,price,price_type,location,category")
      .eq("status", "active")
      .or(filters.join(","))
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;
    return (data || []) as ListingMatch[];
  } catch (error: any) {
    console.warn("WhatsApp listings search failed:", error?.message);
    return [];
  }
}

function priceLabel(value: ListingMatch["price"], priceType?: string | null) {
  if (priceType && /gratuit/i.test(priceType)) return "Gratuit";
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "Prix a discuter";
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "annonce";
}

function listingUrl(listing: ListingMatch) {
  return `${SITE_URL}/annonce/${listing.id}/${listing.slug || slugify(listing.title || "annonce")}`;
}

function listingsContext(listings: ListingMatch[]) {
  if (!listings.length) return "Aucune annonce active pertinente trouvee pour ce message.";
  return listings
    .map((listing, index) => {
      const title = listing.title || "Annonce";
      const location = listing.location || "Lieu non precise";
      const category = listing.category || "Categorie non precisee";
      return `${index + 1}. ${title} | ${category} | ${location} | ${priceLabel(listing.price, listing.price_type)} | ${listingUrl(listing)}`;
    })
    .join("\n");
}

function plainName(value: string) {
  return value.replace(/[^\p{L}\p{N}\s'-]/gu, "").replace(/\s+/g, " ").trim();
}

function businessContext() {
  const boosts = BOOSTS.filter((boost) => boost.price > 0)
    .map((boost) => `${plainName(boost.name)}: ${boost.price.toLocaleString("fr-FR")} FCFA (${boost.duration})`)
    .join("; ");

  const plans = (SUBSCRIPTION_PLANS.general || [])
    .filter((plan) => plan.price > 0)
    .map((plan) => `${plainName(plan.name)}: ${plan.price.toLocaleString("fr-FR")} FCFA/mois`)
    .join("; ");

  return [
    `Site: ${SITE_URL}`,
    `Publier une annonce: ${SITE_URL}/publier`,
    `Chercher des annonces: ${SITE_URL}/recherche`,
    `Booster une annonce: ${SITE_URL}/dashboard?panel=credits`,
    `Boosts: ${boosts || "Tarifs disponibles sur le site"}`,
    `Abonnements boutique: ${plans || "Tarifs disponibles sur le site"}`,
  ].join("\n");
}

function fallbackReply(message: WhatsAppIncomingMessage, listings: ListingMatch[]) {
  const firstName = message.name ? ` ${message.name.split(/\s+/)[0]}` : "";
  const lower = message.text.toLowerCase();

  if (/prix|tarif|boost|premium|abonnement|payer|paiement/.test(lower)) {
    return `Bonjour${firstName}, merci pour votre message.\n\nVoici les options principales:\n- Boost Standard: 1 500 FCFA\n- Premium: 3 500 FCFA\n- A la Une: 7 500 FCFA\n- VIP: 15 000 FCFA\n\nPour publier ou booster une annonce: ${SITE_URL}/publier`;
  }

  if (listings.length > 0) {
    const lines = listings.slice(0, 3).map((listing, index) => {
      return `${index + 1}. ${listing.title || "Annonce"} - ${priceLabel(listing.price, listing.price_type)}\n${listingUrl(listing)}`;
    });

    return `Bonjour${firstName}, merci pour votre message.\n\nJ'ai trouve quelques annonces qui peuvent vous interesser:\n${lines.join("\n")}\n\nDites-moi votre budget ou votre ville, je vous oriente mieux.`;
  }

  return `Bonjour${firstName}, merci pour votre message.\n\nJe suis l'assistant Wanteermako. Je peux vous aider a trouver une annonce, publier un produit, booster votre visibilite ou contacter un vendeur.\n\nEnvoyez-moi ce que vous cherchez, votre ville et votre budget.`;
}

function sanitizeReply(value: string | null) {
  if (!value) return null;
  const cleaned = value.replace(/```[\s\S]*?```/g, "").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 1400);
}

async function generateAutoReply(message: WhatsAppIncomingMessage) {
  const listings = await searchActiveListings(message.text);
  const system = `Tu es l'assistant WhatsApp officiel de Wanteermako, une marketplace de petites annonces.
Reponds uniquement en francais, avec un ton court, chaleureux et professionnel.
Ne promets jamais de paiement securise pour un achat entre particuliers. Rappelle de ne jamais payer en avance si c'est pertinent.
Si des annonces actives sont fournies, utilise-les seulement si elles correspondent au besoin du client et inclus au maximum 3 liens.
Si le message concerne publication, boutique, abonnement ou boost, donne l'etape claire et le lien utile.
Si la demande est floue, pose une question simple.
Maximum 900 caracteres.`;

  const prompt = `Client WhatsApp: ${message.name || "Client"}
Numero: ${message.from}
Message: ${message.text}

Contexte Wanteermako:
${businessContext()}

Annonces actives pertinentes:
${listingsContext(listings)}

Redige la reponse WhatsApp prete a envoyer.`;

  const ai = sanitizeReply(await geminiGenerate(prompt, system));
  if (ai) return { text: ai, source: "ai" as const, listings };
  return { text: fallbackReply(message, listings), source: "template" as const, listings };
}

async function reserveIncomingMessage(message: WhatsAppIncomingMessage) {
  if (isDuplicateInMemory(message.id)) return false;

  const sb = adminClient();
  if (!sb) return true;

  try {
    const { error } = await sb.from("whatsapp_ai_messages").insert({
      message_id: message.id,
      phone: message.from,
      direction: "in",
      body: message.text,
      payload: message.raw as any,
      status: "received",
    });

    if (!error) return true;
    if (error.code === "23505") return false;
    if (error.code === "42P01") return true;
    console.warn("WhatsApp incoming log failed:", error.message);
  } catch (error: any) {
    console.warn("WhatsApp incoming log failed:", error?.message);
  }

  return true;
}

async function logOutgoingReply(
  message: WhatsAppIncomingMessage,
  body: string,
  source: "ai" | "template",
  status: string,
  error?: string,
) {
  const sb = adminClient();
  if (!sb) return;

  try {
    await sb.from("whatsapp_ai_messages").insert({
      message_id: `${message.id}:reply`,
      phone: message.from,
      direction: "out",
      body,
      response_source: source,
      payload: { reply_to: message.id },
      status,
      error: error || null,
    });
  } catch {
    // Optional audit table. The bot must keep working even if the table is absent.
  }
}

async function whatsappGraphRequest(body: Record<string, unknown>, phoneNumberId?: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const id = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !id) {
    return { ok: false, error: "WhatsApp Cloud API non configuree" };
  }

  const response = await fetch(`https://graph.facebook.com/${graphVersion()}/${id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, error: data?.error?.message || response.statusText };
  }

  return { ok: true };
}

async function markAsRead(message: WhatsAppIncomingMessage) {
  return whatsappGraphRequest(
    {
      messaging_product: "whatsapp",
      status: "read",
      message_id: message.id,
    },
    message.phoneNumberId,
  );
}

async function sendWhatsAppText(message: WhatsAppIncomingMessage, text: string) {
  return whatsappGraphRequest(
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: message.from,
      type: "text",
      text: {
        preview_url: true,
        body: text,
      },
    },
    message.phoneNumberId,
  );
}

export async function processWhatsAppIncomingMessage(
  message: WhatsAppIncomingMessage,
): Promise<WhatsAppProcessResult> {
  if (!isWhatsAppAutoReplyEnabled()) {
    return { ok: true, skipped: true, reason: "disabled", messageId: message.id };
  }

  const reserved = await reserveIncomingMessage(message);
  if (!reserved) {
    return { ok: true, skipped: true, reason: "duplicate", messageId: message.id };
  }

  await markAsRead(message).catch(() => {});

  const reply = await generateAutoReply(message);
  const sent = await sendWhatsAppText(message, reply.text);

  if (!sent.ok) {
    await logOutgoingReply(message, reply.text, reply.source, "failed", sent.error);
    return {
      ok: false,
      messageId: message.id,
      to: message.from,
      source: reply.source,
      error: sent.error,
    };
  }

  await logOutgoingReply(message, reply.text, reply.source, "sent");
  return {
    ok: true,
    messageId: message.id,
    to: message.from,
    source: reply.source,
  };
}
