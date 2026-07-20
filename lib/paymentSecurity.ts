import { randomUUID } from "crypto";
import { createClient as createSupabaseAdminClient, type SupabaseClient } from "@supabase/supabase-js";

import { BOOSTS, SUBSCRIPTION_PLANS } from "@/lib/constants";
import { boostPriceKey, subPriceKey, type PriceMap } from "@/lib/prices";

export type CheckoutIntentType = "boost" | "subscription";

export type CheckoutIntent = {
  type: CheckoutIntentType;
  amount: number;
  itemName: string;
  reference: string;
  listingId: string;
  boostKey: string;
  subKey: string;
  category: string;
  userId: string;
  metadata: {
    userId: string;
    listingId: string;
    boostKey: string;
    subKey: string;
    category: string;
    expectedAmount: number;
    intentType: CheckoutIntentType;
  };
};

export class PaymentValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PaymentValidationError";
    this.status = status;
  }
}

export function createPaymentAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new PaymentValidationError("Configuration serveur de paiement incomplete.", 500);
  }

  return createSupabaseAdminClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function cleanString(value: unknown, maxLength = 120): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function isSafeIdentifier(value: string): boolean {
  return /^[a-zA-Z0-9_-]{1,120}$/.test(value);
}

function priceFromSettings(prices: PriceMap | null, key: string, fallback: number): number {
  const value = prices?.[key];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

async function loadServerPrices(supabase: SupabaseClient): Promise<PriceMap | null> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("data")
    .eq("id", "global")
    .maybeSingle();

  const prices = (data?.data as { prices?: unknown } | null)?.prices;
  if (error || !prices || typeof prices !== "object") return null;
  return prices as PriceMap;
}

export async function ensureListingOwnedByUser(
  supabase: SupabaseClient,
  listingId: string,
  userId: string
): Promise<void> {
  if (!listingId) return;

  if (!isSafeIdentifier(listingId)) {
    throw new PaymentValidationError("Identifiant d'annonce invalide.", 400);
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id,user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    throw new PaymentValidationError("Verification de l'annonce impossible.", 500);
  }

  if (!data) {
    throw new PaymentValidationError("Annonce introuvable.", 404);
  }

  if (String(data.user_id) !== String(userId)) {
    throw new PaymentValidationError("Cette annonce ne vous appartient pas.", 403);
  }
}

export async function resolveCheckoutIntent(userId: string, body: unknown): Promise<CheckoutIntent> {
  if (!userId) {
    throw new PaymentValidationError("Utilisateur non authentifie.", 401);
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const boostKey = cleanString(payload.boostKey, 40);
  const subKey = cleanString(payload.subKey, 40);
  const categoryInput = cleanString(payload.category, 40);
  const listingId = cleanString(payload.listingId, 120);
  const supabase = createPaymentAdminClient();
  const prices = await loadServerPrices(supabase);

  if (subKey) {
    const category = Object.prototype.hasOwnProperty.call(SUBSCRIPTION_PLANS, categoryInput)
      ? categoryInput
      : "general";
    const plan = SUBSCRIPTION_PLANS[category]?.find((item) => item.key === subKey);

    if (!plan || plan.price <= 0) {
      throw new PaymentValidationError("Abonnement invalide.", 400);
    }

    const amount = Math.round(priceFromSettings(prices, subPriceKey(category, subKey), plan.price));

    if (amount <= 0) {
      throw new PaymentValidationError("Montant d'abonnement invalide.", 400);
    }

    return buildIntent({
      type: "subscription",
      amount,
      itemName: `Abonnement ${plan.name}`,
      userId,
      listingId: "",
      boostKey: "",
      subKey,
      category,
    });
  }

  if (boostKey) {
    const boost = BOOSTS.find((item) => item.key === boostKey);

    if (!boost || boost.price <= 0) {
      throw new PaymentValidationError("Option de boost invalide.", 400);
    }

    if (!listingId) {
      throw new PaymentValidationError("Choisissez une annonce a booster.", 400);
    }

    await ensureListingOwnedByUser(supabase, listingId, userId);

    const amount = Math.round(priceFromSettings(prices, boostPriceKey(boostKey), boost.price));

    if (amount <= 0) {
      throw new PaymentValidationError("Montant de boost invalide.", 400);
    }

    return buildIntent({
      type: "boost",
      amount,
      itemName: boost.name,
      userId,
      listingId,
      boostKey,
      subKey: "",
      category: "",
    });
  }

  throw new PaymentValidationError("Selection de paiement invalide.", 400);
}

function buildIntent(input: Omit<CheckoutIntent, "reference" | "metadata">): CheckoutIntent {
  return {
    ...input,
    reference: `WMK-${Date.now()}-${randomUUID().slice(0, 8)}`,
    metadata: {
      userId: input.userId,
      listingId: input.listingId,
      boostKey: input.boostKey,
      subKey: input.subKey,
      category: input.category,
      expectedAmount: input.amount,
      intentType: input.type,
    },
  };
}

export function parseExpectedAmount(value: unknown): number | null {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

export function assertProviderAmount(providerAmount: unknown, expectedAmount: unknown): void {
  const paid = parseExpectedAmount(providerAmount);
  const expected = parseExpectedAmount(expectedAmount);

  if (!paid || !expected || paid < expected) {
    throw new PaymentValidationError("Montant de paiement invalide.", 400);
  }
}

export async function purchaseAlreadyExists(
  supabase: SupabaseClient,
  refCommand: string
): Promise<boolean> {
  if (!refCommand) return false;

  const { data, error } = await supabase
    .from("purchases")
    .select("id")
    .eq("ref_command", refCommand)
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.id);
}
