import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Lecture PUBLIQUE des prix configurés dans l'admin (app_settings.global.prices).
// Sert à afficher les tarifs réels sur la page de paiement. Ne renvoie QUE les prix.
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ prices: {} });
    const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data } = await sb.from("app_settings").select("data").eq("id", "global").maybeSingle();
    return NextResponse.json({ prices: (data?.data as any)?.prices || {} });
  } catch {
    return NextResponse.json({ prices: {} });
  }
}
