import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PaymentValidationError, resolveCheckoutIntent } from "@/lib/paymentSecurity";

export const dynamic = "force-dynamic";

// API Chariow (https://chariow.dev) :
// POST /v1/checkout avec un product_id — le PRIX est celui configuré sur le
// produit dans la boutique Chariow, pas un montant libre. Chaque offre du site
// (boost / abonnement) doit donc correspondre à un produit Chariow publié,
// idéalement de type "Licence" (seul type autorisant les achats répétés).

const CHARIOW_API_BASE = (process.env.CHARIOW_API_BASE || "https://api.chariow.com/v1").replace(/\/+$/, "");

type ChariowCheckoutResponse = {
  message?: string;
  errors?: Record<string, string[]> | unknown[];
  data?: {
    step?: "payment" | "completed" | "already_purchased";
    message?: string | null;
    purchase?: { id?: string; status?: string } | null;
    payment?: { checkout_url?: string | null; transaction_id?: string | null } | null;
  };
};

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 5;

function getBaseUrl(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.trim().replace(/\/+$/, "");

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;

  return new URL(req.url).origin;
}

// Correspondance offre du site -> produit Chariow.
// CHARIOW_PRODUCTS = {"boost:premium":"prd_...","sub:standard:auto":"prd_...","default":"prd_..."}
function resolveProductId(boostKey: string, subKey: string, category: string): string | null {
  let map: Record<string, string> = {};
  try {
    map = JSON.parse(process.env.CHARIOW_PRODUCTS || "{}");
  } catch {
    console.error("CHARIOW_PRODUCTS n'est pas un JSON valide");
  }

  const keys = [
    boostKey ? `boost:${boostKey}` : "",
    subKey && category ? `sub:${subKey}:${category}` : "",
    subKey ? `sub:${subKey}` : "",
    "default",
  ].filter(Boolean);

  for (const key of keys) {
    if (typeof map[key] === "string" && map[key].trim()) return map[key].trim();
  }
  return process.env.CHARIOW_PRODUCT_DEFAULT || null;
}

// Chariow attend un numero local en chiffres + un code pays ISO.
function cleanPhone(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length > 9 && digits.startsWith("221")) digits = digits.slice(3);
  return digits || "770000000";
}

function splitName(full: string): { first: string; last: string } {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Client", last: "Wanteermako" };
  if (parts.length === 1) return { first: parts[0].slice(0, 50), last: "Wanteermako" };
  return { first: parts[0].slice(0, 50), last: parts.slice(1).join(" ").slice(0, 50) };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.CHARIOW_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chariow non configure (CHARIOW_API_KEY manquante)." },
        { status: 500 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    let rateData = rateLimitMap.get(ip);

    if (!rateData || rateData.timestamp < windowStart) {
      rateData = { count: 0, timestamp: now };
    }

    if (rateData.count >= MAX_REQUESTS) {
      return NextResponse.json({ error: "Trop de requetes. Veuillez patienter." }, { status: 429 });
    }

    rateLimitMap.set(ip, { count: rateData.count + 1, timestamp: rateData.timestamp });

    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configure" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorise. Veuillez vous connecter." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const intent = await resolveCheckoutIntent(user.id, body);

    const productId = resolveProductId(intent.boostKey, intent.subKey, intent.category);
    if (!productId) {
      return NextResponse.json(
        { error: "Offre non reliee a un produit Chariow (CHARIOW_PRODUCTS)." },
        { status: 500 }
      );
    }

    // Coordonnees client requises par Chariow (email, nom, telephone).
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone, email")
      .eq("id", user.id)
      .maybeSingle();

    const email =
      user.email ||
      profile?.email ||
      `client-${user.id.replace(/-/g, "").slice(0, 12)}@wanteermako.com`;
    const { first, last } = splitName(
      profile?.name || (user.user_metadata as any)?.full_name || (user.user_metadata as any)?.name || ""
    );
    const phoneNumber = cleanPhone(profile?.phone || user.phone || "");
    const phoneCountry = (process.env.CHARIOW_PHONE_COUNTRY || "SN").toUpperCase();

    const baseUrl = getBaseUrl(req);
    const redirectUrl =
      `${baseUrl}/paiement/succes?sale={sale_id}` + (intent.listingId ? `&listing_id=${intent.listingId}` : "");

    // custom_metadata (max 10 cles, 255 caracteres par valeur) : repris tel quel
    // dans le payload du Pulse, c'est notre seul lien vente -> utilisateur/annonce.
    const payload = {
      product_id: productId,
      email,
      first_name: first,
      last_name: last,
      phone: {
        number: phoneNumber,
        country_code: phoneCountry,
      },
      redirect_url: redirectUrl,
      custom_metadata: {
        userId: intent.metadata.userId,
        listingId: intent.metadata.listingId,
        boostKey: intent.metadata.boostKey,
        subKey: intent.metadata.subKey,
        category: intent.metadata.category,
        expectedAmount: String(intent.metadata.expectedAmount),
        intentType: intent.metadata.intentType,
      },
    };

    const response = await fetch(`${CHARIOW_API_BASE}/checkout`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({})) as ChariowCheckoutResponse;
    const step = data.data?.step;

    if (response.ok && step === "payment" && data.data?.payment?.checkout_url) {
      return NextResponse.json({ redirect_url: data.data.payment.checkout_url });
    }

    if (response.ok && step === "completed") {
      // Produit gratuit : la vente est finalisee immediatement, le Pulse fera l'activation.
      return NextResponse.json({
        redirect_url: `${baseUrl}/paiement/succes` + (intent.listingId ? `?listing_id=${intent.listingId}` : ""),
      });
    }

    if (step === "already_purchased") {
      return NextResponse.json(
        { error: "Ce produit a deja ete achete avec ce compte. (Utilisez un produit Chariow de type Licence pour autoriser les achats repetes.)" },
        { status: 400 }
      );
    }

    console.error("Chariow error:", data);
    return NextResponse.json({ error: "Chariow a refuse la demande de paiement." }, { status: 400 });
  } catch (error: any) {
    console.error("Chariow API Error:", error);
    if (error instanceof PaymentValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Erreur interne du paiement." }, { status: 500 });
  }
}
