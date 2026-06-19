import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendInvoiceEmail } from "@/lib/email";

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

// Écriture "adaptative" : si une colonne n'existe pas encore en base, on la retire
// du payload et on réessaie. Évite de planter quand le schéma est partiel.
async function adaptiveWrite(run: (p: any) => PromiseLike<{ error: any }>, payload: any) {
  let p: any = { ...payload };
  for (let i = 0; i < 12; i++) {
    const { error } = await run(p);
    if (!error) return;
    const m: string = error.message || "";
    const match = m.match(/'([^']+)' column/) || m.match(/column "([^"]+)"/) || m.match(/Could not find the '([^']+)'/);
    if (match && match[1] in p) { delete p[match[1]]; continue; }
    throw error;
  }
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

    // Encaissement manuel (espèces) : activer un boost d'annonce OU un abonnement
    // de compte, enregistrer la transaction et appliquer les avantages.
    if (action === "activatePlan") {
      const { userId, kind, planKey, planName, amount, durationDays, listingId, asCredit, quantity } = body;
      if (!userId) return NextResponse.json({ error: "Utilisateur requis." }, { status: 400 });

      const days = Number(durationDays) || 30;
      const now = new Date();
      const expires = new Date(now.getTime() + days * 86400000).toISOString();
      const amt = Number(amount) || 0;
      const ref = `CASH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // Email + nom du client (pour la facture)
      let custEmail = ""; let custName = "";
      try {
        const { data: u } = await sb.auth.admin.getUserById(userId);
        custEmail = u?.user?.email || "";
        custName = (u?.user?.user_metadata as any)?.full_name || "";
      } catch { /* ignore */ }
      if (!custName) { try { const { data: pr } = await sb.from("profiles").select("full_name").eq("id", userId).single(); custName = pr?.full_name || ""; } catch { /* ignore */ } }

      // 1) Enregistrer le paiement espèces (best-effort : ne doit jamais bloquer
      //    l'activation du plan, même si la table purchases est absente/partielle)
      try {
        await adaptiveWrite(
          (p) => sb.from("purchases").insert(p),
          {
            user_id: userId,
            amount: amt,
            ref_command: ref,
            status: "success",
            type: kind === "sub" ? "subscription" : "boost",
            method: "cash",
            plan_key: planKey || null,
            plan_name: planName || null,
            expires_at: expires,
          }
        );
      } catch (e: any) {
        console.error("activatePlan: purchases insert échoué (ignoré):", e?.message);
      }

      if (kind === "boost") {
        const featured = planKey === "alaune" || planKey === "vip";
        // Sans annonce (ou vente explicite en crédit) → on crée des bons de boost
        // réutilisables plus tard par le client sur ses annonces.
        if (asCredit || !listingId) {
          const qty = Math.max(1, Math.min(50, Number(quantity) || 1));
          const rows = Array.from({ length: qty }, () => ({
            user_id: userId,
            boost_key: planKey || "basic",
            boost_name: planName || planKey || "Boost",
            duration_days: days,
            status: "available",
            source: "cash",
          }));
          const { error: credErr } = await sb.from("boost_credits").insert(rows);
          if (credErr) {
            if (/boost_credits/.test(credErr.message || "")) {
              return NextResponse.json({ error: "Table boost_credits manquante. Exécute MIGRATION_CREDITS.sql dans Supabase." }, { status: 500 });
            }
            throw credErr;
          }
          await sendInvoiceEmail({ to: custEmail, customerName: custName, itemName: `${qty} crédit(s) — ${planName || planKey || "Boost"}`, amount: amt, durationDays: days, method: "Espèces", ref });
          return NextResponse.json({ ok: true, ref, credits: qty });
        }
        await adaptiveWrite(
          (p) => sb.from("listings").update(p).eq("id", listingId),
          {
            status: "active",
            premium: true,
            featured,
            is_premium: true,
            is_featured: featured,
            boost_key: planKey || null,
            premium_until: expires,
            boost_expires_at: expires,
          }
        );
      } else {
        // Abonnement de compte : avantages premium jusqu'à expiration
        await adaptiveWrite(
          (p) => sb.from("profiles").update(p).eq("id", userId),
          {
            free_premium: true,
            subscription_plan: planName || planKey || "premium",
            plan_key: planKey || null,
            subscription_expires_at: expires,
            plan_expires_at: expires,
          }
        );
      }

      await sendInvoiceEmail({ to: custEmail, customerName: custName, itemName: planName || planKey || (kind === "sub" ? "Abonnement" : "Boost"), amount: amt, durationDays: days, method: "Espèces", ref, expires });
      return NextResponse.json({ ok: true, ref, expires });
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
