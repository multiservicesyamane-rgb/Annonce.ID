import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const key = process.env.PAYTECH_API_KEY;
    const secret = process.env.PAYTECH_API_SECRET;

    if (!key || !secret) {
      return NextResponse.json({
        success: false,
        error: "Clés API PayTech manquantes dans le fichier .env.local",
        keyPresent: !!key,
        secretPresent: !!secret,
      });
    }

    const testPayload = {
      item_name: "Test Connection Wanteermako",
      item_price: 1000,
      currency: "XOF",
      ref_command: `TEST-${Date.now()}`,
      command_name: "Test Connection",
      env: "test", // Force test mode for credentials check
      ipn_url: "https://wanteermako.com/api/paytech/ipn",
      success_url: "https://wanteermako.com/paiement/succes",
      cancel_url: "https://wanteermako.com/paiement/erreur",
      custom_field: JSON.stringify({ test: true }),
    };

    console.log("Sending diagnostic payment request to PayTech...");

    const response = await fetch("https://paytech.sn/api/payment/request-payment", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "API_KEY": key,
        "API_SECRET": secret,
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json().catch(() => null);

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      keySnippet: key.substring(0, 8) + "...",
      secretSnippet: secret.substring(0, 8) + "...",
      payTechResponse: data,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || "Erreur lors de la requête",
    });
  }
}
