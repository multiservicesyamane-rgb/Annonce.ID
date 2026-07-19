import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/serverSecurity";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const CONFIRM = "DELETE_MOUSSA_AND_PROMOTE_ADMIN";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const adminAuth = verifyAdminPassword(req, body?.pass, { otp: body?.otp });
  if (!adminAuth.ok) return adminAuth.response;
  if (body?.confirm !== CONFIRM) {
    return NextResponse.json({ error: "Confirmation invalide." }, { status: 401 });
  }
  if (process.env.ALLOW_DESTRUCTIVE_ADMIN_CLEANUP !== "true") {
    return NextResponse.json({ error: "Nettoyage destructif desactive cote serveur." }, { status: 403 });
  }

  const supabase = admin();
  if (!supabase) {
    return NextResponse.json({ error: "Service role manquante." }, { status: 500 });
  }

  try {
    const { data: profiles, error: fetchErr } = await supabase.from("profiles").select("*");
    if (fetchErr) throw fetchErr;

    const moussaProfiles = (profiles || []).filter((p: any) =>
      (p.full_name && p.full_name.toLowerCase().includes("moussa")) ||
      (p.email && p.email.toLowerCase().includes("moussa")) ||
      p.id === "moussa-id"
    );

    const deleted: string[] = [];
    for (const p of moussaProfiles) {
      await supabase.from("listings").delete().eq("user_id", p.id);
      await supabase.from("profiles").delete().eq("id", p.id);
      try {
        await supabase.auth.admin.deleteUser(p.id);
      } catch {
        // Profile-only rows can exist during cleanup.
      }
      deleted.push(p.full_name || p.email || p.id);
    }

    const adminEmail = "multiservicesyamane@gmail.com";
    const authList = await supabase.auth.admin.listUsers();
    let adminPromoted = false;

    const adminUser = authList.data?.users.find((u) => u.email?.toLowerCase() === adminEmail);
    if (adminUser) {
      const existingProfile = (profiles || []).find((p: any) => p.id === adminUser.id);
      if (existingProfile) {
        await supabase.from("profiles").update({ role: "admin", is_verified: true }).eq("id", adminUser.id);
      } else {
        await supabase.from("profiles").insert({
          id: adminUser.id,
          full_name: "Administrateur Yamane",
          role: "admin",
          is_verified: true,
          email: adminEmail,
        });
      }
      adminPromoted = true;
    }

    return NextResponse.json({ success: true, deletedMoussaProfiles: deleted, adminPromoted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}
