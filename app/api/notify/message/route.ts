import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { sendNotificationEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://wanteermako.com";

// Notifie le destinataire d'un nouveau message (push + email). Appelé après l'envoi d'un message.
export async function POST(req: Request) {
  const supabase = createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { toUserId, listingId, listingTitle } = await req.json().catch(() => ({}));
  if (!toUserId || toUserId === user.id) return NextResponse.json({ ok: true, skipped: true });

  const fromName = user.user_metadata?.full_name || "Un acheteur";
  const title = "💬 Nouveau message";
  const body = `${fromName} vous a écrit${listingTitle ? ` à propos de « ${listingTitle} »` : ""}.`;
  const url = "/dashboard?panel=messages";

  try {
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

    // Notification in-app (fil persistant) + push, en une fois.
    await createNotification(admin, { userId: toUserId, type: "message", title, body, url, listingId });

    // Email (best-effort) — récupère l'email du destinataire via service role
    const { data } = await admin.auth.admin.getUserById(toUserId);
    const email = data?.user?.email;
    if (email) {
      await sendNotificationEmail({
        to: email,
        subject: "💬 Nouveau message sur Wanteermako",
        title,
        body,
        ctaUrl: `${SITE}${url}`,
        ctaLabel: "Voir le message",
      });
    }
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}
