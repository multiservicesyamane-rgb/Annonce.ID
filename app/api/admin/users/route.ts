import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendInvoiceEmail } from "@/lib/email";
import { configuredPlatforms } from "@/lib/social";
import { publishPendingAnnonces, publishDueScheduled, publishOneListing } from "@/lib/campaign-engine";

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
        is_verified: !!byId[u.id]?.is_verified,
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

    // Activer/retirer la vérification de l'utilisateur
    if (action === "setVerified") {
      const { userId, value } = body;
      const { error } = await sb.from("profiles").update({ is_verified: !!value }).eq("id", userId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // Lister les crédits boost d'un utilisateur
    if (action === "listCredits") {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: "Utilisateur requis." }, { status: 400 });
      const { data, error } = await sb.from("boost_credits").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) return NextResponse.json({ credits: [] });
      return NextResponse.json({ credits: data || [] });
    }

    // Ajouter des crédits boost à un utilisateur (offert par l'admin)
    if (action === "grantCredit") {
      const { userId, boost_key, boost_name, duration_days, quantity } = body;
      if (!userId || !boost_key) return NextResponse.json({ error: "Utilisateur et type de boost requis." }, { status: 400 });
      const qty = Math.max(1, Math.min(50, Number(quantity) || 1));
      const rows = Array.from({ length: qty }, () => ({
        user_id: userId,
        boost_key,
        boost_name: boost_name || boost_key,
        duration_days: Number(duration_days) || 30,
        status: "available",
        source: "admin",
      }));
      const { error } = await sb.from("boost_credits").insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, added: qty });
    }

    // Retirer / supprimer un crédit boost précis
    if (action === "removeCredit") {
      const { creditId } = body;
      if (!creditId) return NextResponse.json({ error: "Crédit requis." }, { status: 400 });
      const { error } = await sb.from("boost_credits").delete().eq("id", creditId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
        // Publication instantanée sur les réseaux dès l'activation (idempotent).
        try { await publishOneListing(sb, listingId); } catch (e) { console.warn("publishOneListing:", e); }
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

    // Nettoyage des sessions lourdes : retire les images base64 / champs trop
    // longs de user_metadata (cause de l'erreur 494 « headers too large »).
    if (action === "cleanupMetadata") {
      let cleaned = 0, scanned = 0;
      for (let page = 1; page <= 20; page++) {
        const { data: list, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        const users = list.users;
        if (users.length === 0) break;
        for (const u of users) {
          scanned++;
          const meta: any = { ...(u.user_metadata || {}) };
          let changed = false;
          for (const k of Object.keys(meta)) {
            const v = meta[k];
            if (typeof v === "string" && (v.startsWith("data:") || v.length > 800)) { delete meta[k]; changed = true; }
          }
          if (changed) {
            await sb.auth.admin.updateUserById(u.id, { user_metadata: meta });
            cleaned++;
          }
        }
        if (users.length < 200) break;
      }
      return NextResponse.json({ ok: true, scanned, cleaned });
    }

    // Données du module Campagne IA (stats, posts, boosts, influenceurs, rapports) — bypass RLS
    if (action === "campaign") {
      const [stats, posts, boosts, influ, reports] = await Promise.all([
        sb.from("campaign_daily_stats").select("*").order("date", { ascending: false }).limit(120),
        sb.from("campaign_posts").select("*").order("created_at", { ascending: false }).limit(100),
        sb.from("campaign_boosts").select("*").order("created_at", { ascending: false }).limit(100),
        sb.from("campaign_influenceurs").select("*").order("created_at", { ascending: false }).limit(100),
        sb.from("campaign_weekly_reports").select("*").order("week_start", { ascending: false }).limit(52),
      ]);
      return NextResponse.json({ stats: stats.data || [], posts: posts.data || [], boosts: boosts.data || [], influ: influ.data || [], reports: reports.data || [] });
    }

    // Influenceurs : créer / mettre à jour / supprimer
    if (action === "campaignInfluSave") {
      const { row } = body;
      if (!row) return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
      const res = row.id
        ? await sb.from("campaign_influenceurs").update(row).eq("id", row.id)
        : await sb.from("campaign_influenceurs").insert(row);
      if (res.error) {
        if (/campaign_influenceurs/.test(res.error.message || "")) return NextResponse.json({ error: "Table manquante. Exécute MIGRATION_CAMPAIGN.sql." }, { status: 500 });
        throw res.error;
      }
      return NextResponse.json({ ok: true });
    }
    if (action === "campaignInfluDelete") {
      const { id } = body;
      const { error } = await sb.from("campaign_influenceurs").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === "campaignPostSave") {
      const { row } = body;
      if (!row) return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
      const res = row.id
        ? await sb.from("campaign_posts").update(row).eq("id", row.id)
        : await sb.from("campaign_posts").insert(row);
      if (res.error) throw res.error;
      return NextResponse.json({ ok: true });
    }
    if (action === "campaignPostDelete") {
      const { id } = body;
      const { error } = await sb.from("campaign_posts").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === "campaignReportSave") {
      const { row } = body;
      if (!row) return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
      const res = row.id
        ? await sb.from("campaign_weekly_reports").update(row).eq("id", row.id)
        : await sb.from("campaign_weekly_reports").insert(row);
      if (res.error) throw res.error;
      return NextResponse.json({ ok: true });
    }
    if (action === "campaignReportDelete") {
      const { id } = body;
      const { error } = await sb.from("campaign_weekly_reports").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === "campaignBoostSave") {
      const { row } = body;
      if (!row) return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
      const res = row.id
        ? await sb.from("campaign_boosts").update(row).eq("id", row.id)
        : await sb.from("campaign_boosts").insert(row).select().single();
      if (res.error) throw res.error;

      // Déclenche Make.com (Meta Ads) si l'URL est configurée et que c'est une création
      if (!row.id && res.data) {
        const hook = process.env.MAKE_WEBHOOK_URL;
        if (hook) {
          try {
            await fetch(hook, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ event: "boost_request", boost_id: res.data.id, ...row }),
            });
          } catch (e) { console.error("Make webhook error in admin route:", e); }
        }
      }
      return NextResponse.json({ ok: true });
    }
    if (action === "campaignPostRepublish") {
      const { postId } = body;
      const { data: post } = await sb.from("campaign_posts").select("*").eq("id", postId).single();
      if (!post) return NextResponse.json({ error: "Post introuvable." }, { status: 404 });
      
      let listing = null;
      if (post.annonce_id) {
        const { data: listData } = await sb.from("listings").select("*").eq("id", post.annonce_id).single();
        listing = listData;
      }

      const pageId = process.env.META_PAGE_ID;
      const accessToken = process.env.META_ACCESS_TOKEN;

      if (!pageId || !accessToken || pageId === "your_facebook_page_id" || accessToken.includes("your_meta")) {
        return NextResponse.json({ error: "Configuration API Meta Facebook (META_PAGE_ID ou META_ACCESS_TOKEN) manquante ou invalide dans .env.local." }, { status: 400 });
      }

      let caption = post.caption;
      if (!caption && listing) {
        caption = `🔥 À NE PAS MANQUER ! 👉 ${listing.title}\n💰 Prix : ${listing.price ? listing.price + " FCFA" : "Sur devis"}\n📍 Disponible à ${listing.location || 'Sénégal'}.\nContactez le vendeur sur wanteermako.com !`;
      }

      let facebookPostId = "";
      const imageUrl = post.image_url || listing?.image;
      const linkUrl = listing ? `https://wanteermako.com/annonce/${listing.id}/${listing.slug}` : "https://wanteermako.com";
      const fullMessage = `${caption}\n\n👉 Voir l'annonce : ${linkUrl}`;

      try {
        if (imageUrl && imageUrl.startsWith("http")) {
          // Publication avec Photo
          const fbRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: imageUrl,
              message: fullMessage,
              access_token: accessToken
            })
          });
          const fbData = await fbRes.json();
          if (!fbRes.ok) {
            throw new Error(`Erreur Facebook Graph API (Photos) : ${fbData?.error?.message || fbRes.statusText}`);
          }
          facebookPostId = fbData.post_id || fbData.id;
        } else {
          // Publication sans Photo (Lien uniquement)
          const fbRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              link: linkUrl,
              message: caption,
              access_token: accessToken
            })
          });
          const fbData = await fbRes.json();
          if (!fbRes.ok) {
            throw new Error(`Erreur Facebook Graph API (Feed) : ${fbData?.error?.message || fbRes.statusText}`);
          }
          facebookPostId = fbData.id;
        }

        // Mettre à jour l'état du post en Base de Données
        await sb.from("campaign_posts").update({
          status: "published",
          published_at: new Date().toISOString(),
          post_url: facebookPostId ? `https://facebook.com/${facebookPostId}` : null
        }).eq("id", postId);

        return NextResponse.json({ ok: true, facebookPostId });
      } catch (err: any) {
        console.error("Facebook Direct Publish Error:", err);
        return NextResponse.json({ error: err.message || "Erreur de publication sur Facebook." }, { status: 500 });
      }
    }

    // Publication automatique multi-réseaux (Telegram + Facebook…) via Gemini.
    // Déclenchement manuel depuis l'admin (même moteur que le cron /api/campaign/auto-publish).
    if (action === "campaignAutoPublish") {
      const platforms = configuredPlatforms();
      if (!platforms.length) {
        return NextResponse.json({ error: "Aucun réseau configuré (TELEGRAM_BOT_TOKEN/CHANNEL_ID ou META_PAGE_ID/ACCESS_TOKEN)." }, { status: 400 });
      }

      // Phase 1 : posts planifiés arrivés à échéance. Phase 2 : nouvelles annonces sans post.
      const scheduled = await publishDueScheduled(sb);
      const pending = await publishPendingAnnonces(sb);

      const published =
        pending.summary.reduce((n: number, s: any) => n + s.results.filter((r: any) => r.ok).length, 0) +
        scheduled.summary.filter((s: any) => s.published).length;

      if (!published && !pending.annonces && !scheduled.due) {
        return NextResponse.json({ ok: true, published: 0, message: "Aucune annonce ni post planifié en attente.", platforms });
      }
      return NextResponse.json({ ok: true, published, platforms, scheduled, pending });
    }

    // Achats / transactions (bypass RLS pour les Finances admin)
    if (action === "purchases") {
      const { data } = await sb.from("purchases").select("*").order("created_at", { ascending: false }).limit(500);
      return NextResponse.json({ purchases: data || [] });
    }

    // Paramètres globaux (tarifs, toggles) — stockés dans app_settings
    if (action === "getSettings") {
      const { data } = await sb.from("app_settings").select("data").eq("id", "global").maybeSingle();
      return NextResponse.json({ settings: data?.data || {} });
    }
    if (action === "saveSettings") {
      const { settings } = body;
      const { error } = await sb.from("app_settings").upsert({ id: "global", data: settings || {}, updated_at: new Date().toISOString() });
      if (error) {
        if (/app_settings/.test(error.message || "")) {
          return NextResponse.json({ error: "Table app_settings manquante. Relance SETUP_SUPABASE.sql." }, { status: 500 });
        }
        throw error;
      }
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
