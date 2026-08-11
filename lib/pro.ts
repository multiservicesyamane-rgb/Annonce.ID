// Espace Freelancer — helpers partagés.
// Chaîne : Client → Projet → Devis → Acceptation → Facture → Paiement → Suivi.
//
// Tous les montants sont des ENTIERS en FCFA : la zone UEMOA n'a pas de
// centimes, et travailler en entiers supprime toute dérive d'arrondi.

export type QuoteItem = { label: string; qty: number; unit_price: number };
export type Task = { label: string; done: boolean };
export type ProDocument = { name: string; url: string; size?: number };

/**
 * Rubrique réutilisable d'un devis (déroulé de la mission, conditions,
 * modalités de paiement…). Réglée une fois dans « Mes devis par défaut »,
 * puis RECOPIÉE dans chaque devis créé — jamais référencée, sinon modifier
 * ses conditions réécrirait des devis déjà envoyés et acceptés.
 */
export type QuoteSection = {
  key: string;
  title: string;
  icon: string;
  enabled: boolean;
  items: { label: string; body: string }[];
};

/* ============================ Statuts ============================ */

export const CLIENT_STATUSES = ["prospect", "active", "inactive"] as const;
export const PROJECT_STATUSES = ["planned", "active", "paused", "done", "cancelled"] as const;
export const QUOTE_STATUSES = ["draft", "sent", "viewed", "accepted", "refused", "expired"] as const;
export const INVOICE_STATUSES = ["draft", "sent", "partial", "paid", "late", "cancelled"] as const;

export const CLIENT_LABELS: Record<string, string> = {
  prospect: "Prospect",
  active: "Actif",
  inactive: "Inactif",
};

export const PROJECT_LABELS: Record<string, string> = {
  planned: "Planifié",
  active: "En cours",
  paused: "En pause",
  done: "Terminé",
  cancelled: "Annulé",
};

export const QUOTE_LABELS: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  viewed: "Consulté",
  accepted: "Accepté",
  refused: "Refusé",
  expired: "Expiré",
};

export const INVOICE_LABELS: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  partial: "Partiellement payée",
  paid: "Payée",
  late: "En retard",
  cancelled: "Annulée",
};

export const PAYMENT_METHODS = ["Wave", "Orange Money", "Free Money", "Espèces", "Virement", "Chèque"];

/** Taux de TVA au Sénégal. 0 pour les non-assujettis (cas le plus courant en solo). */
export const TAX_RATES = [0, 18];

export const SECTORS = [
  "Alimentaire",
  "Mode & Textile",
  "Cosmétique",
  "ONG / Associatif",
  "Évènementiel",
  "Juridique / Cabinet",
  "Tech / Startup",
  "Bâtiment / Artisanat",
  "Transport",
  "Art & Culture",
  "Autre",
];

/* ============================ Calculs ============================ */

export type Totals = {
  subtotal: number;   // HT avant remise
  discount: number;   // remise appliquée (bornée au sous-total)
  taxable: number;    // base imposable = subtotal - discount
  taxRate: number;
  taxAmount: number;
  total: number;      // TTC
};

/** Somme des lignes, en FCFA entiers. */
export function itemsSubtotal(items: QuoteItem[]): number {
  return (items || []).reduce((sum, it) => {
    const qty = Number(it?.qty) || 0;
    const price = Number(it?.unit_price) || 0;
    return sum + Math.max(0, Math.round(qty * price));
  }, 0);
}

/**
 * Chaîne de calcul unique — utilisée par le formulaire, l'API et les PDF.
 * Un seul endroit de vérité : l'écran de saisie et la facture ne peuvent pas
 * diverger. La remise est bornée au sous-total (jamais de total négatif).
 */
export function computeTotals(items: QuoteItem[], discount = 0, taxRate = 0): Totals {
  const subtotal = itemsSubtotal(items);
  const safeDiscount = Math.min(Math.max(0, Math.round(Number(discount) || 0)), subtotal);
  const taxable = subtotal - safeDiscount;
  const rate = Math.min(100, Math.max(0, Number(taxRate) || 0));
  const taxAmount = Math.round((taxable * rate) / 100);
  return {
    subtotal,
    discount: safeDiscount,
    taxable,
    taxRate: rate,
    taxAmount,
    total: taxable + taxAmount,
  };
}

/** Compat : l'ancien appelant ne connaissait ni remise ni TVA. */
export function quoteTotal(items: QuoteItem[]): number {
  return itemsSubtotal(items);
}

/** Nettoie et borne les lignes reçues du client (anti-abus + cohérence). */
/* ==================== Rubriques de devis ==================== */

/**
 * Rubriques proposées au premier réglage. Elles sont PRÉ-REMPLIES d'exemples
 * réalistes : un champ vide reste vide, un exemple se corrige en dix secondes.
 *
 * Le contenu est calibré pour le Sénégal, pas décalqué d'un modèle européen :
 * avance à la commande (usage courant ici), Wave et Orange Money en premier,
 * montants en FCFA, et une mention sur la TVA puisque la plupart des solos
 * ne sont pas assujettis.
 */
export const DEFAULT_QUOTE_SECTIONS: QuoteSection[] = [
  {
    key: "processus",
    title: "Déroulé de la mission",
    icon: "🧭",
    enabled: true,
    items: [
      { label: "1. Cadrage", body: "Un échange pour comprendre votre besoin, votre cible et vos délais." },
      { label: "2. Proposition", body: "Je vous soumets une première version pour validation." },
      { label: "3. Ajustements", body: "Vous me faites vos retours, j'affine jusqu'à votre accord." },
      { label: "4. Livraison", body: "Vous recevez les fichiers finaux dans les formats convenus." },
    ],
  },
  {
    key: "profil",
    title: "À propos de moi",
    icon: "👤",
    enabled: true,
    items: [
      { label: "Mon parcours", body: "Présentez en deux phrases votre expérience et votre spécialité." },
      { label: "Références", body: "Citez deux ou trois clients ou projets marquants." },
    ],
  },
  {
    key: "conditions",
    title: "Conditions",
    icon: "🛡️",
    enabled: true,
    items: [
      { label: "Propriété des fichiers", body: "La propriété est transférée au client après paiement intégral." },
      { label: "Révisions incluses", body: "2 séries de retouches sont comprises. Au-delà, chaque série est facturée 15 000 FCFA." },
      { label: "Délais", body: "Les délais courent à compter de la réception de l'avance et de tous les éléments nécessaires." },
    ],
  },
  {
    key: "paiement",
    title: "Modalités de paiement",
    icon: "💰",
    enabled: true,
    items: [
      { label: "Avance", body: "50 % à la commande, le solde à la livraison." },
      { label: "Moyens acceptés", body: "Wave, Orange Money, Free Money ou virement bancaire." },
      { label: "Validité du devis", body: "Ce devis est valable 30 jours à compter de sa date d'émission." },
    ],
  },
  {
    key: "faq",
    title: "Questions fréquentes",
    icon: "❓",
    enabled: false,
    items: [
      { label: "Puis-je modifier le projet en cours de route ?", body: "Oui. Tout ajout hors du périmètre fait l'objet d'un devis complémentaire." },
      { label: "Que se passe-t-il si j'annule ?", body: "L'avance couvre le travail déjà réalisé et reste acquise." },
    ],
  },
];

/**
 * Rubriques assainies : le contenu vient du navigateur, donc rien n'est cru.
 * Les bornes correspondent à celles de la base (8 rubriques max) et à ce
 * qu'un document imprimé peut absorber sans devenir illisible.
 */
export function sanitizeSections(raw: unknown): QuoteSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 8)
    .map((s: any, i: number) => ({
      // Une clé stable est nécessaire pour retrouver une rubrique d'un
      // enregistrement à l'autre ; à défaut on en fabrique une.
      key: String(s?.key ?? `section-${i}`).trim().slice(0, 40) || `section-${i}`,
      title: String(s?.title ?? "").trim().slice(0, 80),
      icon: String(s?.icon ?? "•").trim().slice(0, 8) || "•",
      enabled: s?.enabled !== false,
      items: (Array.isArray(s?.items) ? s.items : [])
        .slice(0, 12)
        .map((it: any) => ({
          label: String(it?.label ?? "").trim().slice(0, 120),
          body: String(it?.body ?? "").trim().slice(0, 800),
        }))
        // Une entrée sans titre ET sans texte n'apporte rien au document.
        .filter((it: { label: string; body: string }) => it.label || it.body),
    }))
    .filter((s) => s.title && s.items.length > 0);
}

/** Rubriques réellement imprimables : actives et non vides. */
export function visibleSections(raw: unknown): QuoteSection[] {
  return sanitizeSections(raw).filter((s) => s.enabled);
}

export function sanitizeItems(raw: unknown): QuoteItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 60)
    .map((it: any) => ({
      label: String(it?.label ?? "").trim().slice(0, 160),
      qty: Math.min(9999, Math.max(0, Math.round(Number(it?.qty) || 0))),
      unit_price: Math.min(999_999_999, Math.max(0, Math.round(Number(it?.unit_price) || 0))),
    }))
    .filter((it) => it.label);
}

/** Tâches d'un projet, bornées (le champ est libre côté navigateur). */
export function sanitizeTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 60)
    .map((t: any) => ({ label: String(t?.label ?? "").trim().slice(0, 200), done: !!t?.done }))
    .filter((t) => t.label);
}

/** Documents joints : on n'accepte que des URL http(s) déjà hébergées. */
export function sanitizeDocuments(raw: unknown): ProDocument[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 30)
    .map((d: any) => ({
      name: String(d?.name ?? "").trim().slice(0, 160),
      url: String(d?.url ?? "").trim().slice(0, 600),
      size: Number(d?.size) > 0 ? Math.round(Number(d.size)) : undefined,
    }))
    .filter((d) => d.name && /^https?:\/\//i.test(d.url));
}

/**
 * Avancement déduit des tâches cochées, quand le professionnel n'a pas
 * réglé le curseur lui-même. Évite le projet bloqué à 0 % alors que tout
 * est fait.
 */
export function progressFromTasks(tasks: Task[]): number {
  if (!tasks?.length) return 0;
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
}

/* ============================ Identifiants ============================ */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Code de suivi lisible et dictable au téléphone : « TKF-4821 ».
 * Les 3 lettres viennent du nom du client, les 4 chiffres sont aléatoires.
 */
export function trackingCode(name: string): string {
  const letters = String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  let prefix = letters.slice(0, 3);
  while (prefix.length < 3) prefix += ALPHABET[Math.floor(Math.random() * 26)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-${digits}`;
}

/**
 * Jeton du lien public : long et imprévisible (impossible à deviner en
 * changeant un chiffre), comme l'exige un portail client sans compte.
 */
export function publicToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// La numérotation des pièces (DEV-2026-014 / FAC-2026-007) vit côté serveur :
// voir `nextDocumentNumber` dans lib/proServer.ts, qui s'appuie sur un compteur
// SQL atomique. Elle ne peut pas se calculer depuis le navigateur.

/* ============================ Formatage ============================ */

/** Montant formaté pour l'affichage. */
export function formatFcfa(n: number | string | null | undefined): string {
  const v = Number(String(n ?? "").replace(/[^0-9-]/g, "")) || 0;
  return `${v.toLocaleString("fr-FR")} FCFA`;
}

/** Version compacte pour les tuiles d'indicateurs : 1,2 M · 450 k. */
export function formatFcfaShort(n: number | null | undefined): string {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1).replace(".", ",")} M`;
  if (Math.abs(v) >= 10_000) return `${Math.round(v / 1000)} k`;
  return v.toLocaleString("fr-FR");
}

/* ---- Montant en toutes lettres (mention attendue sur une facture) ---- */

const WORD_UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf",
];
const WORD_TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

/** 0-99 — gère les irrégularités du français (71, 80, 91…). */
function wordsBelow100(n: number): string {
  if (n < 20) return WORD_UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  // 70-79 et 90-99 se construisent sur 60 et 80 + une unité de 10 à 19.
  if (t === 7 || t === 9) {
    if (t === 7 && u === 1) return "soixante-et-onze";
    return `${WORD_TENS[t]}-${WORD_UNITS[10 + u]}`;
  }
  if (u === 0) return t === 8 ? "quatre-vingts" : WORD_TENS[t];
  if (u === 1 && t !== 8) return `${WORD_TENS[t]}-et-un`;
  return `${WORD_TENS[t]}-${WORD_UNITS[u]}`;
}

/** 0-999 — « cent » reste invariable quand il est suivi d'un nombre. */
function wordsBelow1000(n: number): string {
  if (n < 100) return wordsBelow100(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (r === 0) return h === 1 ? "cent" : `${WORD_UNITS[h]} cents`;
  const head = h === 1 ? "cent" : `${WORD_UNITS[h]} cent`;
  return `${head} ${wordsBelow100(r)}`;
}

/**
 * « quinze mille » — la mention « Arrêtée à la somme de… » qui figure sur toute
 * facture sérieuse, et qui protège contre l'altération du montant en chiffres.
 */
export function amountInWords(n: number | null | undefined): string {
  const v = Math.max(0, Math.round(Number(n) || 0));
  if (v === 0) return "zéro";

  const parts: string[] = [];
  let rest = v;

  const scales: { value: number; singular: string; plural: string }[] = [
    { value: 1_000_000_000, singular: "un milliard", plural: "milliards" },
    { value: 1_000_000, singular: "un million", plural: "millions" },
    { value: 1_000, singular: "mille", plural: "mille" },
  ];

  for (const s of scales) {
    const count = Math.floor(rest / s.value);
    if (count === 0) continue;
    if (count === 1) parts.push(s.singular);
    else parts.push(`${wordsBelow1000(count)} ${s.plural}`);
    rest %= s.value;
  }

  if (rest > 0) parts.push(wordsBelow1000(rest));
  return parts.join(" ");
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/** « il y a 3 jours » — pour le fil d'activité. */
export function timeAgo(d: string | null | undefined): string {
  if (!d) return "";
  const ms = Date.now() - new Date(d).getTime();
  if (Number.isNaN(ms)) return "";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j === 1) return "hier";
  if (j < 31) return `il y a ${j} jours`;
  const m = Math.floor(j / 30);
  return m < 12 ? `il y a ${m} mois` : `il y a ${Math.floor(m / 12)} an(s)`;
}

/** Jours restants avant échéance (négatif = en retard). */
export function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / 86400000);
}

/* ============================ Règles métier ============================ */

/**
 * Statut réel d'une facture, recalculé à la lecture.
 * La base stocke le dernier état connu, mais « en retard » dépend de la date
 * du jour : le calculer à l'affichage évite un cron de plus et ne peut pas
 * se désynchroniser.
 */
export function effectiveInvoiceStatus(inv: {
  status: string;
  due_date?: string | null;
  total?: number;
  paid_amount?: number;
}): string {
  if (inv.status === "cancelled" || inv.status === "draft") return inv.status;
  const paid = Number(inv.paid_amount) || 0;
  const total = Number(inv.total) || 0;
  if (total > 0 && paid >= total) return "paid";
  const late = inv.due_date != null && (daysUntil(inv.due_date) ?? 0) < 0;
  if (paid > 0) return late ? "late" : "partial";
  return late ? "late" : inv.status;
}

/** Statut réel d'un devis : « expiré » dès que la date de validité est passée. */
export function effectiveQuoteStatus(q: { status: string; valid_until?: string | null }): string {
  if (q.status === "accepted" || q.status === "refused" || q.status === "draft") return q.status;
  if (q.valid_until && (daysUntil(q.valid_until) ?? 0) < 0) return "expired";
  return q.status;
}

/** Un devis est-il encore répondable par le client ? */
export function quoteIsOpen(q: { status: string; valid_until?: string | null }): boolean {
  const s = effectiveQuoteStatus(q);
  return s === "sent" || s === "viewed";
}

/** Numéro WhatsApp sénégalais → format international pour wa.me. */
export function waNumber(phone: string | null | undefined): string {
  const digits = String(phone || "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  return digits.length === 9 && /^[73]/.test(digits) ? `221${digits}` : digits;
}
