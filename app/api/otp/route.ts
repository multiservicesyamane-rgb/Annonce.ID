import { NextResponse } from "next/server";

const otpRateLimitMap = new Map<string, { count: number, timestamp: number }>();
const OTP_RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const OTP_MAX_REQUESTS = 5;

const DEMO_CODE = "1234";
const isSmsConfigured = Boolean(process.env.AFRICASTALKING_API_KEY);
const allowDemoOtp = process.env.NODE_ENV !== "production" && process.env.OTP_DEMO_ENABLED === "true";

export async function POST(req: Request) {
  // 1. Rate Limiting
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const windowStart = now - OTP_RATE_LIMIT_WINDOW;

  let rateData = otpRateLimitMap.get(ip);
  if (!rateData || rateData.timestamp < windowStart) {
    rateData = { count: 0, timestamp: now };
  }

  if (rateData.count >= OTP_MAX_REQUESTS) {
    return NextResponse.json({ error: "Trop de requêtes SMS. Veuillez patienter 15 minutes." }, { status: 429 });
  }

  otpRateLimitMap.set(ip, { count: rateData.count + 1, timestamp: rateData.timestamp });

  // 2. Validation
  const body = await req.json().catch(() => ({}));
  const { phone, code } = body;

  if (!phone || typeof phone !== 'string' || phone.length < 8 || phone.length > 20) {
    return NextResponse.json({ ok: false, error: "Numéro de téléphone invalide" }, { status: 400 });
  }
  if (code !== undefined && (typeof code !== 'string' || code.length > 10)) {
    return NextResponse.json({ ok: false, error: "Format du code invalide" }, { status: 400 });
  }

  // 3. Verification du code
  if (code !== undefined) {
    if (!isSmsConfigured && !allowDemoOtp) {
      return NextResponse.json({ ok: false, error: "Service OTP non configure" }, { status: 503 });
    }
    const valid = isSmsConfigured
      ? false // TODO: comparer avec otp_codes en base
      : code === DEMO_CODE;
    return NextResponse.json({ ok: valid, verified: valid });
  }

  // 4. Envoi d'un code
  if (!isSmsConfigured) {
    if (!allowDemoOtp) {
      return NextResponse.json({ ok: false, error: "Service OTP non configure" }, { status: 503 });
    }
    return NextResponse.json({ ok: true, demo: true, demoCode: DEMO_CODE });
  }

  return NextResponse.json({ ok: true, demo: false });
}