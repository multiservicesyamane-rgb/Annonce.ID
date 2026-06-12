import { NextResponse } from "next/server";

/**
 * Route OTP.
 * - DÉMO : si aucun fournisseur SMS configuré, renvoie le code fixe 1234.
 * - PRODUCTION : brancher Africa's Talking / Twilio / Orange SMS API ici,
 *   insérer le code dans la table `otp_codes` (expires_at 5min, rate limit 5/15min).
 *
 * POST /api/otp { phone }            → envoie un code
 * POST /api/otp { phone, code }      → vérifie un code
 */

const DEMO_CODE = "1234";
const isSmsConfigured = Boolean(process.env.AFRICASTALKING_API_KEY);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { phone, code } = body as { phone?: string; code?: string };

  if (!phone) {
    return NextResponse.json({ ok: false, error: "Numéro requis" }, { status: 400 });
  }

  // Vérification d'un code
  if (code !== undefined) {
    const valid = isSmsConfigured
      ? false /* TODO: comparer avec otp_codes en base */
      : code === DEMO_CODE;
    return NextResponse.json({ ok: valid, verified: valid });
  }

  // Envoi d'un code
  if (!isSmsConfigured) {
    return NextResponse.json({ ok: true, demo: true, demoCode: DEMO_CODE });
  }

  // TODO production : générer un code aléatoire, l'envoyer via Africa's Talking,
  // le stocker dans `otp_codes`. Voir README.
  return NextResponse.json({ ok: true, demo: false });
}
