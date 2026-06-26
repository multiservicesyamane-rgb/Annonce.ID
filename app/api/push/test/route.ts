import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

// Envoie une notification push de test à l'utilisateur connecté.
export async function POST() {
  const supabase = createClient();
  if (!supabase) return NextResponse.json({ ok: false, reason: "non configuré" }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "non connecté" }, { status: 401 });
  const sent = await sendPushToUser(user.id, {
    title: "🔔 Wanteermako",
    body: "Notifications activées ! Vous serez alerté de vos messages et bonnes affaires.",
    url: "/dashboard",
  });
  return NextResponse.json({ ok: true, sent });
}
