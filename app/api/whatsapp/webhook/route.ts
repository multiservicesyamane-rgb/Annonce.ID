import { NextResponse } from "next/server";
import {
  extractIncomingMessages,
  processWhatsAppIncomingMessage,
  verifyMetaSignature,
} from "@/lib/whatsapp/ai-auto-reply";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && challenge && expectedToken && token === expectedToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification WhatsApp refusee" }, { status: 403 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!verifyMetaSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Signature WhatsApp invalide" }, { status: 403 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Payload WhatsApp invalide" }, { status: 400 });
  }

  const messages = extractIncomingMessages(payload);
  if (!messages.length) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const results = [];
  for (const message of messages) {
    results.push(await processWhatsAppIncomingMessage(message));
  }

  return NextResponse.json({
    ok: results.every((result) => result.ok),
    processed: results.filter((result) => result.ok && !result.skipped).length,
    skipped: results.filter((result) => result.skipped).length,
    results,
  });
}
