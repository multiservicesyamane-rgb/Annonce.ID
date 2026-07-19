import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

type AdminAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

type AdminAuthOptions = {
  otp?: unknown;
  sessionToken?: unknown;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const adminAuthAttempts = new Map<string, RateLimitEntry>();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 8;
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const ADMIN_SESSION_COOKIE = "wmk_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = ADMIN_SESSION_TTL_MS / 1000;
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function constantTimeHexEqual(leftHex: string, rightHex: string) {
  if (!/^[a-f0-9]{64}$/i.test(leftHex) || !/^[a-f0-9]{64}$/i.test(rightHex)) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(leftHex, "hex"),
    Buffer.from(rightHex, "hex")
  );
}

function constantTimeTextEqual(left: string, right: string) {
  return constantTimeHexEqual(sha256Hex(left), sha256Hex(right));
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function getCookie(req: Request, name: string) {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(valueParts.join("="));
      } catch {
        return valueParts.join("=");
      }
    }
  }
  return "";
}

export function getAdminSessionTokenFromRequest(req: Request) {
  return getCookie(req, ADMIN_SESSION_COOKIE);
}
function getAdminSessionSecret() {
  const raw =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD_SHA256 ||
    process.env.ADMIN_PASSWORD ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";

  return raw ? sha256Hex(raw) : null;
}

export function createAdminSessionToken(now = Date.now()) {
  const secret = getAdminSessionSecret();
  if (!secret) return null;

  const payload = base64UrlEncode(JSON.stringify({
    scope: "admin",
    iat: now,
    exp: now + ADMIN_SESSION_TTL_MS,
  }));
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function verifyAdminSessionToken(token: unknown, now = Date.now()) {
  if (typeof token !== "string" || !token.includes(".")) return false;

  const secret = getAdminSessionSecret();
  if (!secret) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (!constantTimeHexEqual(signature, expected)) return false;

  try {
    const decoded = JSON.parse(base64UrlDecode(payload));
    return decoded?.scope === "admin" && typeof decoded?.exp === "number" && decoded.exp > now;
  } catch {
    return false;
  }
}

function decodeBase32(secret: string) {
  const clean = secret.toUpperCase().replace(/[\s=-]/g, "");
  if (!clean || /[^A-Z2-7]/.test(clean)) {
    throw new Error("Secret 2FA invalide.");
  }

  let bits = "";
  for (const char of clean) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) throw new Error("Secret 2FA invalide.");
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  if (bytes.length < 10) throw new Error("Secret 2FA trop court.");
  return Buffer.from(bytes);
}

function getAdminTotpSecret() {
  const raw = process.env.ADMIN_2FA_SECRET?.trim() || "";
  const required = process.env.ADMIN_2FA_REQUIRED === "true";
  const placeholder = new Set(["", "xxx", "change-moi", "change-me", "demo", "test"]);

  if (placeholder.has(raw.toLowerCase())) {
    if (required) throw new Error("ADMIN_2FA_SECRET manquant ou invalide.");
    return null;
  }

  return decodeBase32(raw);
}

function hotp(secret: Buffer, counter: number) {
  const buffer = Buffer.alloc(8);
  let value = counter;
  for (let i = 7; i >= 0; i--) {
    buffer[i] = value & 0xff;
    value = Math.floor(value / 256);
  }

  const hmac = createHmac("sha1", secret).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

function verifyTotp(secret: Buffer, token: unknown, now = Date.now()) {
  const provided = typeof token === "string" ? token.replace(/\s/g, "") : "";
  if (!/^\d{6}$/.test(provided)) return false;

  const counter = Math.floor(now / 1000 / TOTP_STEP_SECONDS);
  for (const skew of [-1, 0, 1]) {
    if (constantTimeTextEqual(provided, hotp(secret, counter + skew))) return true;
  }

  return false;
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  return firstForwardedIp || req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string, now = Date.now()) {
  const entry = adminAuthAttempts.get(key);
  return Boolean(entry && entry.count >= DEFAULT_MAX_ATTEMPTS && entry.resetAt > now);
}

function registerFailedAttempt(key: string, now = Date.now()) {
  const entry = adminAuthAttempts.get(key);

  if (!entry || entry.resetAt <= now) {
    adminAuthAttempts.set(key, {
      count: 1,
      resetAt: now + DEFAULT_WINDOW_MS,
    });
    return;
  }

  entry.count += 1;
}

export function verifyAdminPassword(
  req: Request,
  candidate: unknown,
  options: AdminAuthOptions = {}
): AdminAuthResult {
  if (verifyAdminSessionToken(getAdminSessionTokenFromRequest(req))) {
    return { ok: true };
  }

  const key = `admin:${getClientIp(req)}`;

  if (isRateLimited(key)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Trop de tentatives. Reessayez plus tard." },
        { status: 429 }
      ),
    };
  }

  const providedPassword = typeof candidate === "string" ? candidate : "";
  const configuredHash = process.env.ADMIN_PASSWORD_SHA256?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredHash && !configuredPassword) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "ADMIN_PASSWORD ou ADMIN_PASSWORD_SHA256 manquant." },
        { status: 500 }
      ),
    };
  }

  if (configuredHash && !/^[a-f0-9]{64}$/.test(configuredHash)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "ADMIN_PASSWORD_SHA256 doit etre un hash SHA-256 hexadecimal." },
        { status: 500 }
      ),
    };
  }

  const expectedHash = configuredHash || sha256Hex(configuredPassword || "");
  const providedHash = sha256Hex(providedPassword);
  const valid = constantTimeHexEqual(providedHash, expectedHash);

  if (!valid) {
    registerFailedAttempt(key);
    return {
      ok: false,
      response: NextResponse.json({ error: "Non autorise." }, { status: 401 }),
    };
  }

  try {
    const totpSecret = getAdminTotpSecret();
    if (totpSecret && !verifyTotp(totpSecret, options.otp)) {
      registerFailedAttempt(key);
      return {
        ok: false,
        response: NextResponse.json({ error: "Code 2FA invalide ou manquant." }, { status: 401 }),
      };
    }
  } catch (error: any) {
    return {
      ok: false,
      response: NextResponse.json({ error: error?.message || "Configuration 2FA invalide." }, { status: 500 }),
    };
  }

  adminAuthAttempts.delete(key);
  return { ok: true };
}
