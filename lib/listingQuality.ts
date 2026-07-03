export type ListingDraftForValidation = {
  title: string;
  description: string;
  photos?: string[];
};

export type ListingQualityResult = {
  valid: boolean;
  errors: string[];
};

export type DuplicateCandidate = {
  id: string | number;
  title?: string | null;
  price?: string | number | null;
  phone?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export type DuplicateMatch = {
  id: string | number;
  title: string;
  status?: string | null;
  created_at?: string | null;
  reason: "same_hash" | "similar";
  score: number;
};

const PHONE_IN_TITLE_RE =
  /(?:\+?221[\s.-]*)?(?:7[05678]|3[03]|8[08])(?:[\s.-]*\d){7}\b/;

const EMOJI_SEQUENCE_RE =
  /\p{Extended_Pictographic}(?:\u200d\p{Extended_Pictographic})*(?:\uFE0F|[\u{1F3FB}-\u{1F3FF}])*/gu;

const FRENCH_HINT_WORDS = new Set([
  "avec",
  "pour",
  "neuf",
  "occasion",
  "livraison",
  "disponible",
  "qualite",
  "garantie",
  "prix",
  "vente",
  "acheter",
  "vendre",
  "maison",
  "voiture",
  "telephone",
  "ordinateur",
]);

const ENGLISH_HINT_WORDS = new Set([
  "with",
  "for",
  "new",
  "used",
  "shipping",
  "delivery",
  "available",
  "quality",
  "wireless",
  "waterproof",
  "portable",
  "original",
  "case",
  "cover",
  "charger",
  "cable",
  "phone",
  "watch",
  "smart",
  "men",
  "women",
  "kids",
  "bike",
  "car",
  "home",
  "kitchen",
  "fashion",
  "electric",
  "bluetooth",
  "headphones",
]);

const ENGLISH_TO_FRENCH: Array<[RegExp, string]> = [
  [/\bwireless\b/gi, "sans fil"],
  [/\bwaterproof\b/gi, "étanche"],
  [/\bportable\b/gi, "portable"],
  [/\boriginal\b/gi, "original"],
  [/\bcharger\b/gi, "chargeur"],
  [/\bcable\b/gi, "câble"],
  [/\bphone\b/gi, "téléphone"],
  [/\bsmart\s*watch\b/gi, "montre connectée"],
  [/\bwatch\b/gi, "montre"],
  [/\bheadphones?\b/gi, "écouteurs"],
  [/\bearbuds?\b/gi, "écouteurs"],
  [/\bspeaker\b/gi, "haut-parleur"],
  [/\bcover\b/gi, "coque"],
  [/\bcase\b/gi, "coque"],
  [/\bprotector\b/gi, "protection"],
  [/\bscreen\b/gi, "écran"],
  [/\bmen'?s?\b/gi, "homme"],
  [/\bwomen'?s?\b/gi, "femme"],
  [/\bkids?\b/gi, "enfant"],
  [/\bbike\b/gi, "vélo"],
  [/\bcar\b/gi, "voiture"],
  [/\bhome\b/gi, "maison"],
  [/\bkitchen\b/gi, "cuisine"],
  [/\bfashion\b/gi, "mode"],
  [/\belectric\b/gi, "électrique"],
  [/\bquality\b/gi, "qualité"],
  [/\bdelivery\b/gi, "livraison"],
  [/\bshipping\b/gi, "livraison"],
  [/\bavailable\b/gi, "disponible"],
  [/\bnew\b/gi, "neuf"],
  [/\bused\b/gi, "occasion"],
  [/\bfor\b/gi, "pour"],
  [/\bwith\b/gi, "avec"],
];

export function normalizeListingTitle(title: string): string {
  return (title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(PHONE_IN_TITLE_RE, " ")
    .replace(EMOJI_SEQUENCE_RE, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function priceDigits(price: string | number | null | undefined): string {
  return String(price ?? "").replace(/\D/g, "") || "0";
}

export function sellerPhoneDigits(phone: string | null | undefined): string {
  return String(phone ?? "").replace(/\D/g, "").slice(-9);
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createDuplicateKey(input: {
  title: string;
  price: string | number | null | undefined;
  phone: string | null | undefined;
}): string {
  const base = [
    normalizeListingTitle(input.title),
    priceDigits(input.price),
    sellerPhoneDigits(input.phone),
  ].join("|");
  return stableHash(base);
}

export function validateListingDraft(draft: ListingDraftForValidation): ListingQualityResult {
  const errors: string[] = [];
  const title = (draft.title || "").trim();
  const description = (draft.description || "").trim();
  const photos = draft.photos || [];

  if (title.length < 10 || title.length > 80) {
    errors.push("Le titre doit contenir entre 10 et 80 caractères.");
  }
  if (PHONE_IN_TITLE_RE.test(title)) {
    errors.push("Ne mettez pas de numéro de téléphone dans le titre.");
  }
  if (hasEmojiRun(title)) {
    errors.push("Évitez les suites d'emojis dans le titre.");
  }
  if (description.length < 30) {
    errors.push("La description doit contenir au moins 30 caractères.");
  }
  if (photos.length < 1) {
    errors.push("Ajoutez au moins une photo.");
  }

  return { valid: errors.length === 0, errors };
}

export function hasEmojiRun(text: string): boolean {
  const matches = [...(text || "").matchAll(EMOJI_SEQUENCE_RE)];
  if (matches.length < 2) return false;

  for (let i = 1; i < matches.length; i++) {
    const previous = matches[i - 1];
    const current = matches[i];
    const previousEnd = (previous.index || 0) + previous[0].length;
    const between = text.slice(previousEnd, current.index || 0);
    if (!between.trim()) return true;
  }

  return false;
}

function tokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.split(" ").filter(Boolean));
  const tokensB = new Set(b.split(" ").filter(Boolean));
  if (!tokensA.size || !tokensB.size) return 0;

  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection++;
  });

  return intersection / Math.max(tokensA.size, tokensB.size);
}

export function findDuplicateListing(
  input: {
    title: string;
    price: string | number | null | undefined;
    phone: string | null | undefined;
    duplicateKey?: string;
  },
  candidates: DuplicateCandidate[],
): DuplicateMatch | null {
  const duplicateKey =
    input.duplicateKey || createDuplicateKey({ title: input.title, price: input.price, phone: input.phone });
  const normalizedTitle = normalizeListingTitle(input.title);
  const price = priceDigits(input.price);
  const phone = sellerPhoneDigits(input.phone);

  for (const candidate of candidates) {
    const candidateKey = createDuplicateKey({
      title: candidate.title || "",
      price: candidate.price,
      phone: candidate.phone || input.phone,
    });
    if (candidateKey === duplicateKey) {
      return {
        id: candidate.id,
        title: candidate.title || "Annonce similaire",
        status: candidate.status,
        created_at: candidate.created_at,
        reason: "same_hash",
        score: 1,
      };
    }

    const samePrice = priceDigits(candidate.price) === price;
    const samePhone = sellerPhoneDigits(candidate.phone || input.phone) === phone;
    const score = tokenSimilarity(normalizedTitle, normalizeListingTitle(candidate.title || ""));
    if (samePrice && samePhone && score >= 0.86) {
      return {
        id: candidate.id,
        title: candidate.title || "Annonce similaire",
        status: candidate.status,
        created_at: candidate.created_at,
        reason: "similar",
        score,
      };
    }
  }

  return null;
}

function words(text: string): string[] {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z]{3,}/g) || [];
}

export function detectLanguage(text: string): "fr" | "en" | "unknown" {
  const tokens = words(text);
  if (!tokens.length) return "unknown";

  const englishHits = tokens.filter((word) => ENGLISH_HINT_WORDS.has(word)).length;
  const frenchHits = tokens.filter((word) => FRENCH_HINT_WORDS.has(word)).length;

  if (englishHits >= 2 && englishHits > frenchHits) return "en";
  if (frenchHits > englishHits) return "fr";
  return "unknown";
}

export function translateImportedEnglish(text: string): { text: string; changed: boolean; remainingEnglish: boolean } {
  let translated = text || "";
  for (const [pattern, replacement] of ENGLISH_TO_FRENCH) {
    translated = translated.replace(pattern, replacement);
  }

  translated = translated.replace(/\s{2,}/g, " ").trim();
  return {
    text: translated,
    changed: translated !== text,
    remainingEnglish: detectLanguage(translated) === "en",
  };
}

export function prepareImportedListingText(input: {
  title: string;
  description?: string;
  source?: string;
}): {
  title: string;
  description: string;
  sourceLanguage: "fr" | "en" | "unknown";
  needsModeration: boolean;
  moderationReason?: string;
} {
  const fallbackDescription = `${input.title} — disponible chez ${input.source || "notre partenaire"}. Cliquez sur « Acheter » pour commander.`;
  const rawTitle = (input.title || "").trim();
  const rawDescription = (input.description || "").trim() || fallbackDescription;
  const sourceLanguage = detectLanguage(`${rawTitle} ${rawDescription}`);

  if (sourceLanguage !== "en") {
    return {
      title: rawTitle,
      description: rawDescription,
      sourceLanguage,
      needsModeration: false,
    };
  }

  const title = translateImportedEnglish(rawTitle);
  const description = translateImportedEnglish(rawDescription);
  const needsModeration =
    !title.changed ||
    !description.changed ||
    title.remainingEnglish ||
    description.remainingEnglish;

  return {
    title: title.text || rawTitle,
    description: description.text || rawDescription,
    sourceLanguage,
    needsModeration,
    moderationReason: needsModeration
      ? "Import en anglais: traduction automatique insuffisante, validation humaine requise."
      : undefined,
  };
}
