import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendInvoiceEmail } from "@/lib/email";
import { publishOneListing } from "@/lib/campaign-engine";

export const dynamic = "force-dynamic";

// Webhook "Pulse" Chariow (https://chariow.dev, Automation > Pulses).
// Les Pulses ne sont pas signes ; la securite repose sur deux couches :
//  1. un jeton secret dans l'URL du Pulse (?token=CHARIOW_WEBHOOK_TOKEN) ;
//  2. la vente est re-verifiee aupres de l'API Chariow (GET /v1/sales/{id})
//     avant toute activation — un payload forge ne suffit donc pas.

const CHARIOW_API_BASE = (process.env.CHARIOW_API_BASE || "https://api.chariow.com/v1").replace(/\/+$/, "");
const PAID_STATUSES = ["completed", "settled"];

function parseMaybeJson(value: unknown): any {
  if (typeof value !== "string") return value || {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function safeEqual(a: string, b: string): boolean {
  return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function checkToken(req: Request): boolean {
  const expected = process.env.CHARIOW_WEBHOOK_TOKEN;
  if (!expected) return true;
  const url = new URL(req.url);
  const provided = url.searchParams.get("token") || req.headers.get("x-webhook-token") || "";
  return safeEqual(provided, expected);
}

async function fetchVerifiedSale(saleId: string): Promise<any | null> {
  const apiKey = process.env.CHARIOW_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`${CHARIOW_API_BASE}/sales/${encodeURIComponent(saleId)}`, {
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
  });
  if (!res.ok) return null;

  const json = await res.json().catch(() => ({}));
  return json?.data || null;
}

async function activateListing(supabase: any, listingId: string, boostKey: string) {
  const updateData: Record<string, unknown> = {
    status: "active",
    boost_key: boostKey || null,
  };

  if (boostKey === "premium") {
    updateData.premium = true;
    updateData.is_premium = true;
  } else if (boostKey === "alaune") {
    updateData.featured = true;
    updateData.is_featured = true;
  } else if (boostKey === "vip") {
    updateData.premium = true;
    updateData.is_premium = true;
    updateData.featured = true;
    updateData.is_featured = true;
  } else if (boostKey && boostKey !== "gratuit") {
    updateData.premium = true;
    updateData.is_premium = true;
  }

  let lastError: any = null;
  for (let i = 0; i < 6; i++) {
    const { error } = await supabase.from("listings").update(updateData).eq("id", listingId);
    if (!error) {
      lastError = null;
      break;
    }

    lastError = error;
    const message = error.message || "";
    const match = message.match(/'([^']+)' column/) || message.match(/column "([^"]+)"/) || message.match(/Could not find the '([^']+)'/);
    if (match?.[1] && match[1] in updateData) {
      delete updateData[match[1]];
      continue;
    }

    break;
  }

  if (lastError) {
    console.error("Chariow listing activation error:", lastError);
  }

  try {
    await publishOneListing(supabase, listingId);
  } catch (error) {
    console.warn("publishOneListing:", error);
  }
}

// Retourne true si la vente a deja ete traitee (retries du Pulse).
async function insertPurchaseOnce(
  supabase: any,
  userId: string,
  amount: number,
  reference: string,
  type: "boost" | "subscription" | "credits"
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("purchases")
    .select("id")
    .eq("ref_command", reference)
    .maybeSingle();

  if (existing?.id) return true;

  await supabase.from("purchases").insert({
    user_id: userId || null,
    amount,
    ref_command: reference,
    status: "success",
    type,
  });
  return false;
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Config manquante" }, { status: 500 });
    }

    if (!checkToken(req)) {
      return NextResponse.json({ error: "Jeton invalide" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const sale = payload.sale || payload.data?.sale || payload.data || {};
    const saleId = String(sale.id || payload.sale_id || "");

    if (!saleId) {
      return NextResponse.json({ error: "sale.id manquant" }, { status: 400 });
    }

    // Source de verite : la vente relue depuis l'API Chariow.
    const verified = await fetchVerifiedSale(saleId);
    if (!verified) {
      console.error("Chariow webhook: vente non verifiable", saleId);
      return NextResponse.json({ error: "Vente non verifiable aupres de Chariow" }, { status: 400 });
    }

    const status = String(verified.status || "").toLowerCase();
    if (!PAID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, status });
    }

    // custom_metadata : posee lors du checkout (userId/listingId/boostKey/...).
    // Presente dans le payload du Pulse ; on prend aussi celle de l'API si fournie.
    const metadata = {
      ...parseMaybeJson(sale.custom_metadata),
      ...parseMaybeJson(verified.custom_metadata),
    };

    const userId = String(metadata.userId || metadata.user_id || "");
    const listingId = String(metadata.listingId || metadata.listing_id || "");
    const boostKey = String(metadata.boostKey || metadata.boost_key || "");
    const subKey = String(metadata.subKey || metadata.sub_key || "");
    const category = String(metadata.category || "general");
    const amount = Math.round(Number(verified.amount?.value ?? sale.amount?.value ?? 0)) || 0;

    if (!userId && !listingId) {
      return NextResponse.json({ error: "Metadonnees paiement manquantes" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const purchaseType = listingId ? "boost" : subKey ? "subscription" : "credits";
    const alreadyProcessed = await insertPurchaseOnce(supabase, userId, amount, saleId, purchaseType);
    if (alreadyProcessed) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    if (listingId) {
      await activateListing(supabase, listingId, boostKey);
    } else if (subKey && userId) {
      await supabase.from("profiles").update({
        role: "pro",
        is_pro: true,
        subscription_plan: subKey,
        subscription_category: category,
        free_ads_remaining: subKey === "standard" ? 5 : subKey === "premium" ? 15 : 50,
      }).eq("id", userId);
    } else if (userId) {
      const { data: profile } = await supabase.from("profiles").select("credits").eq("id", userId).single();
      await supabase
        .from("profiles")
        .update({ credits: (profile?.credits || 0) + amount })
        .eq("id", userId);
    }

    if (userId) {
      try {
        const { data: userResponse } = await supabase.auth.admin.getUserById(userId);
        const email = userResponse?.user?.email || "";
        const name = (userResponse?.user?.user_metadata as any)?.full_name || "";
        if (email) {
          await sendInvoiceEmail({
            to: email,
            customerName: name,
            itemName: verified.product?.name || (listingId ? "Boost annonce" : subKey ? "Abonnement" : "Credits"),
            amount,
            method: "Chariow",
            ref: saleId,
          });
        }
      } catch (error) {
        console.error("Invoice email error:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Chariow webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
