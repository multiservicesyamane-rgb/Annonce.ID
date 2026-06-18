import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Back-office serveur : utilise la clé SERVICE ROLE (bypass RLS) pour gérer
// réellement la plateforme. Protégé par le mot de passe Super Admin.
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "YamaneTech@2025";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body?.pass !== ADMIN_PASS) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const sb = admin();
  if (!sb) {
    return NextResponse.json({ error: "Back-office non configuré : SUPABASE_SERVICE_ROLE_KEY manquante côté serveur." }, { status: 500 });
  }

  const action = body?.action;

  try {
    // Lister tous les utilisateurs (auth + profil) — bypass RLS
    if (action === "list") {
      const { data: list, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) throw error;
      const ids = list.users.map((u) => u.id);
      const { data: profs } = await sb.from("profiles").select("*").in("id", ids.length ? ids : ["_"]);
      const byId: Record<string, any> = {};
      (profs || []).forEach((p) => { byId[p.id] = p; });
      const users = list.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        full_name: byId[u.id]?.full_name || u.user_metadata?.full_name || "",
        role: byId[u.id]?.role || "user",
        free_premium: !!byId[u.id]?.free_premium,
        phone: byId[u.id]?.phone || "",
        avatar_url: byId[u.id]?.avatar_url || "",
      }));
      return NextResponse.json({ users });
    }

    // Créer un compte (par email OU par nom d'utilisateur avec mot de passe auto-généré)
    if (action === "create") {
      let { email, password, full_name, role, username } = body;
      // Mode rapide terrain : juste un nom d'utilisateur → email technique généré
      if (!email && username) {
        const u = String(username).toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
        if (!u) return NextResponse.json({ error: "Nom d'utilisateur invalide." }, { status: 400 });
        email = `${u}@wanteermako.app`;
        if (!full_name) full_name = username;
      }
      if (!email) return NextResponse.json({ error: "Email ou nom d'utilisateur requis." }, { status: 400 });
      // Mot de passe par défaut si non fourni
      const generated = !password;
      if (!password) password = "wmk-" + Math.random().toString(36).slice(2, 8);

      const { data: created, error } = await sb.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: full_name || "" },
      });
      if (error) throw error;
      const uid = created.user.id;
      await sb.from("profiles").upsert({ id: uid, full_name: full_name || "", role: role || "user" }, { onConflict: "id" });
      // On renvoie les identifiants pour que l'admin les communique au vendeur
      return NextResponse.json({ ok: true, id: uid, email, password, generated, username: username || null });
    }

    // Modifier le rôle
    if (action === "setRole") {
      const { userId, role } = body;
      const { error } = await sb.from("profiles").update({ role }).eq("id", userId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // Activer/retirer le VIP gratuit (annonces Premium offertes)
    if (action === "setVip") {
      const { userId, value } = body;
      const { error } = await sb.from("profiles").update({ free_premium: !!value }).eq("id", userId);
      if (error) throw error;
      await sb.from("listings").update({ premium: !!value }).eq("user_id", userId);
      return NextResponse.json({ ok: true });
    }

    // Supprimer un compte
    if (action === "delete") {
      const { userId } = body;
      await sb.from("profiles").delete().eq("id", userId);
      const { error } = await sb.auth.admin.deleteUser(userId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
