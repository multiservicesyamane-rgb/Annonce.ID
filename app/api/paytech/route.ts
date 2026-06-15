import { NextResponse } from "next/server";

const PAYTECH_API_KEY = process.env.PAYTECH_API_KEY!;
const PAYTECH_SECRET_KEY = process.env.PAYTECH_API_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, itemName, refCommand, listingId } = body;

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).trim();

    const isDev = process.env.NODE_ENV !== "production";
    const prodDomain = "https://annonce-id.vercel.app";

    const paymentData = {
      item_name: itemName || "Boost Annonce",
      item_price: amount,
      currency: "XOF",
      ref_command: refCommand || `CMD-${Date.now()}`,
      command_name: "Paiement Boost Annonce.ID",
      env: isDev ? "test" : "live",
      ipn_url: isDev ? `${prodDomain}/api/paytech/ipn` : `${baseUrl}/api/paytech/ipn`,
      success_url: (isDev ? `${prodDomain}/paiement/succes` : `${baseUrl}/paiement/succes`) + (listingId ? `?listing_id=${listingId}` : ""),
      cancel_url: isDev ? `${prodDomain}/paiement/erreur` : `${baseUrl}/paiement/erreur`,
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
