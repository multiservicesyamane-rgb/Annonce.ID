import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/serverSecurity";
import { createClient } from "@supabase/supabase-js";
import { OWNER_EMAILS } from "@/lib/owners";
import { slugify } from "@/lib/utils";
import {
  createDuplicateKey,
  findDuplicateListing,
  prepareImportedListingText,
  validateListingDraft,
} from "@/lib/listingQuality";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Écriture adaptative : retire les colonnes inexistantes et réessaie.
async function adaptiveInsert(sb: any, payload: any) {
  let p: any = { ...payload };
  for (let i = 0; i < 14; i++) {
    const { data, error } = await sb.from("listings").insert(p).select("id,slug").single();
    if (!error) return { data };
    const m: string = error.message || "";
    const match = m.match(/'([^']+)' column/) || m.match(/column "([^"]+)"/) || m.match(/Could not find the '([^']+)'/);
    if (match && match[1] in p) { delete p[match[1]]; continue; }
    return { error };
  }
  return { error: { message: "Trop de colonnes manquantes." } };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const adminAuth = verifyAdminPassword(req, body?.password || body?.pass, { otp: body?.otp });
    if (!adminAuth.ok) return adminAuth.response;

    const sb = admin();
    if (!sb) return NextResponse.json({ error: "Service indisponible (clé service role manquante)." }, { status: 500 });

    // Résoudre le compte propriétaire explicite, puis le compte par défaut.
    const requestedOwnerId = String(body?.owner_id || body?.ownerId || body?.product?.owner_id || "").trim();
    const ownerEmail = (body?.owner_email || OWNER_EMAILS[0] || "").toLowerCase().trim();
    let ownerId: string | null = null;

    if (requestedOwnerId) {
      if (!UUID_RE.test(requestedOwnerId)) {
        return NextResponse.json({ error: "ID propriétaire invalide." }, { status: 400 });
      }
      const { data: profById } = await sb.from("profiles").select("id").eq("id", requestedOwnerId).maybeSingle();
      ownerId = profById?.id || null;
      if (!ownerId) {
        try {
          const { data: authUser } = await (sb as any).auth.admin.getUserById(requestedOwnerId);
          ownerId = authUser?.user?.id || null;
        } catch { /* ignore */ }
      }
      if (!ownerId) {
        return NextResponse.json({ error: "Compte propriétaire introuvable." }, { status: 400 });
      }
    }

    if (!ownerId && ownerEmail) {
      const { data: prof } = await sb.from("profiles").select("id").ilike("email", ownerEmail).maybeSingle();
      ownerId = prof?.id || null;
    }
    if (!ownerId && ownerEmail) {
      // Repli : chercher dans auth.users
      try {
        const { data: list } = await (sb as any).auth.admin.listUsers();
        const u = list?.users?.find((x: any) => (x.email || "").toLowerCase() === ownerEmail);
        ownerId = u?.id || null;
      } catch { /* ignore */ }
    }
    if (!ownerId) {
      return NextResponse.json({ error: `Aucun compte trouvé pour ${ownerEmail || "le propriétaire demandé"}. Connecte-toi une fois avec ce compte sur le site, puis réessaie.` }, { status: 400 });
    }

    const products: any[] = Array.isArray(body?.products) ? body.products : (body?.product ? [body.product] : []);
    if (products.length === 0) return NextResponse.json({ error: "Aucun produit à importer." }, { status: 400 });

    const results: any[] = [];
    for (const prod of products) {
      const title = (prod?.title || "").trim();
      const externalUrl = (prod?.external_url || "").trim();
      const orderWa = (prod?.order_whatsapp || "").trim();
      if (!title || (!externalUrl && !orderWa)) { results.push({ title, ok: false, error: "Titre + (lien externe OU numéro WhatsApp) requis." }); continue; }

      const photos = Array.isArray(prod?.photos) ? prod.photos.filter(Boolean) : (prod?.image ? [prod.image] : []);
      const preparedText = prepareImportedListingText({
        title,
        description: prod?.description,
        source: prod?.source,
      });
      const quality = validateListingDraft({
        title: preparedText.title,
        description: preparedText.description,
        photos,
      });
      const duplicateKey = createDuplicateKey({
        title: preparedText.title,
        price: prod?.price,
        phone: orderWa,
      });
      const { data: duplicateCandidates } = await sb
        .from("listings")
        .select("id, title, price, phone, status, created_at")
        .eq("user_id", ownerId)
        .in("status", ["active", "pending"])
        .order("created_at", { ascending: false })
        .limit(100);
      const duplicate = findDuplicateListing(
        { title: preparedText.title, price: prod?.price, phone: orderWa, duplicateKey },
        duplicateCandidates || [],
      );
      const moderationReasons = [
        preparedText.moderationReason,
        quality.valid ? undefined : quality.errors.join(" "),
        duplicate ? `Doublon probable de l'annonce ${duplicate.id}: ${duplicate.title}` : undefined,
      ].filter(Boolean);
      const needsModeration = preparedText.needsModeration || !quality.valid || !!duplicate;
      const payload: any = {
        user_id: ownerId,
        title: preparedText.title,
        slug: `${slugify(preparedText.title).slice(0, 60)}-${Math.random().toString(36).slice(2, 7)}`,
        description: preparedText.description,
        price: String(prod?.price ?? "").replace(/[^0-9]/g, "") || "0",
        price_type: "Prix Fixe",
        category: prod?.category || "Autre",
        category_slug: prod?.category_slug || "",
        location: (prod?.location || "Dakar").trim(),
        image: prod?.image || photos[0] || "https://placehold.co/600x400?text=Produit",
        photos,
        external_url: externalUrl,
        order_whatsapp: (prod?.order_whatsapp || "").trim() || null,
        source: (prod?.source || "").trim().toLowerCase(),
        source_language: preparedText.sourceLanguage,
        moderation_reason: moderationReasons.join(" "),
        duplicate_key: duplicateKey,
        status: needsModeration ? "pending" : "active",
        // Visibilité forte (produits vitrine)
        premium: !needsModeration, is_premium: !needsModeration, featured: !needsModeration && !!prod?.featured, is_featured: !needsModeration && !!prod?.featured, boost_key: needsModeration ? null : (prod?.featured ? "alaune" : "premium"),
      };

      const { data, error } = await adaptiveInsert(sb, payload);
      if (error) results.push({ title, ok: false, error: error.message || "Erreur insertion" });
      else results.push({
        title: preparedText.title,
        ok: true,
        id: data?.id,
        slug: data?.slug,
        status: payload.status,
        moderation_reason: payload.moderation_reason || undefined,
      });
    }

    const okCount = results.filter((r) => r.ok).length;
    return NextResponse.json({ ok: true, imported: okCount, total: products.length, results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
