import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Centre de notifications de l'utilisateur connecté.
// La RLS (notif_select_own / notif_update_own) garantit qu'il n'accède qu'aux siennes.
export async function POST(req: Request) {
  const sb = createClient();
  if (!sb) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  try {
    if (action === "unreadCount") {
      const { count, error } = await sb
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false);
      if (error) return NextResponse.json({ count: 0 }); // table absente → 0
      return NextResponse.json({ count: count || 0 });
    }

    if (action === "list") {
      const { data, error } = await sb
        .from("notifications")
        .select("id, type, title, body, url, listing_id, read, created_at")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) return NextResponse.json({ notifications: [], unread: 0 });
      const unread = (data || []).filter((n: any) => !n.read).length;
      return NextResponse.json({ notifications: data || [], unread });
    }

    if (action === "markRead") {
      const id = String(body?.id || "");
      if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
      await sb.from("notifications").update({ read: true }).eq("id", id);
      return NextResponse.json({ ok: true });
    }

    if (action === "markAllRead") {
      await sb.from("notifications").update({ read: true }).eq("read", false);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur" }, { status: 500 });
  }
}
