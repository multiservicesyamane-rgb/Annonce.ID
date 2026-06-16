import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAYTECH_API_KEY = process.env.PAYTECH_API_KEY!;
const PAYTECH_SECRET_KEY = process.env.PAYTECH_API_SECRET!;

// SECURITE: 6.1 Rate Limiting basique (Map en mémoire)
const rateLimitMap = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requêtes max par minute par IP

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    let rateData = rateLimitMap.get(ip);
    if (!rateData || rateData.timestamp < windowStart) {
      rateData = { count: 0, timestamp: now };
    }
    
    if (rateData.count >= MAX_REQUESTS) {
      return NextResponse.json({ error: "Trop de requêtes. Veuillez patienter." }, { status: 429 });
    }
    
    rateLimitMap.set(ip, { count: rateData.count + 1, timestamp: rateData.timestamp });

    // 2. Auth Check
    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Protection CRITIQUE: Vérifier l'identité du serveur
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé. Veuillez vous connecter." }, { status: 401 });
    }

    // 3. SECURITE: 4.1 Validation stricte (remplacement de Zod)
    const body = await req.json().catch(() => ({}));
    const { amount, itemName, refCommand, listingId } = body;

    if (typeof amount !== 'number' || amount <= 0 || amount > 10000000) {
      return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
    }
    if (itemName && (typeof itemName !== 'string' || itemName.length > 255)) {
      return NextResponse.json({ error: "Nom d'article invalide." }, { status: 400 });
    }
    if (refCommand && (typeof refCommand !== 'string' || refCommand.length > 255)) {
      return NextResponse.json({ error: "Référence invalide." }, { status: 400 });
    }
    if (listingId && typeof listingId !== 'string') {
      return NextResponse.json({ error: "ID d'annonce invalide." }, { status: 400 });
    }

    const secureUserId = user.id;

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).trim();

    const isDev = process.env.NODE_ENV !== "production";
    const prodDomain = "https://annonce-id.vercel.app";
    // En production, Vercel définit NODE_ENV à 'production'
    const finalDomain = isDev ? prodDomain : baseUrl;

    const paymentData = {
      item_name: itemName || "Boost Annonce",
      item_price: amount,
      currency: "XOF",
      ref_command: refCommand || `CMD-${Date.now()}`,
      command_name: "Paiement Annonce.ID",
      custom_field: JSON.stringify({ userId: secureUserId, listingId: listingId || "" }),

      // Passage explicite en "live" pour la production (forcé à la demande)
      env: "live",
      ipn_url: `${finalDomain}/api/paytech/ipn`,
      success_url: `${baseUrl}/paiement/succes` + (listingId ? `?listing_id=${listingId}` : ""),
      cancel_url: `${baseUrl}/paiement/erreur`,
    };

    const response = await fetch("https://paytech.sn/api/payment/request-payment", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "API_KEY": PAYTECH_API_KEY,
        "API_SECRET": PAYTECH_SECRET_KEY,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (data.success === 1) {
      return NextResponse.json({ redirect_url: data.redirect_url });
    } else {
      console.error("PayTech Error:", data);
      return NextResponse.json({ error: `PayTech a refusé: ${JSON.stringify(data)}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: `Erreur interne: ${error.message}` }, { status: 500 });
  }
}
