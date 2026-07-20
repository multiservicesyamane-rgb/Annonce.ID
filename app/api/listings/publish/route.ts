import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { BOOSTS } from "@/lib/constants";
import { FREE_LISTING_LIMIT, isPaidBoostKey, normalizeFreeAdsRemaining } from "@/lib/businessRules";
import { isOwner } from "@/lib/owners";
import {
  createDuplicateKey,
  findDuplicateListing,
  validateListingDraft,
} from "@/lib/listingQuality";

export const dynamic = "force-dynamic";

const BOOST_KEYS = new Set(BOOSTS.map((boost) => boost.key));

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status });
}

async function adaptiveWrite(
  sb: any,
  mode: "insert" | "update",
  payload: Record<string, unknown>,
  editId?: string,
) {
  const p = { ...payload };
  for (let i = 0; i < 10; i++) {
    const res = mode === "update"
      ? await sb.from("listings").update(p).eq("id", editId).select().single()
      : await sb.from("listings").insert(p).select().single();
    if (!res.error) return res;

    const message = res.error.message || "";
    const match =
      message.match(/Could not find the '([^']+)' column/) ||
      message.match(/column "?([a-z_]+)"? of relation/i);
    if (match?.[1] && match[1] in p) {
      delete p[match[1]];
      continue;
    }
    return res;
  }
  return { data: null, error: { message: "Schema incompatible" } } as any;
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    if (!supabase) return jsonError("Supabase non configure", 500);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return jsonError("Non autorise.", 401);

    const sb = admin();
    if (!sb) return jsonError("Service indisponible.", 500);

    const body = await req.json().catch(() => ({}));
    const listing = body?.listing || {};
    const editModeId = typeof body?.editModeId === "string" && body.editModeId.trim()
      ? body.editModeId.trim()
      : null;
    const duplicateConfirmed = body?.duplicateConfirmed === true;
    const boostKey = BOOST_KEYS.has(body?.boostKey) ? body.boostKey : "gratuit";

    const title = String(listing.title || "").trim();
    const description = String(listing.description || "").trim();
    const photos = Array.isArray(listing.photos) ? listing.photos.filter(Boolean) : [];
    const quality = validateListingDraft({ title, description, photos });
    if (!quality.valid) return jsonError(quality.errors[0] || "Annonce invalide.");

    const priceType = String(listing.priceType || listing.price_type || "Prix Fixe");
    const price = String(listing.price || "0");
    if (priceType !== "Sur devis" && !price) return jsonError("Indiquez un prix.");

    const phone = String(listing.phone || "").trim();
    const duplicateKey = createDuplicateKey({ title, price, phone });
    const { data: candidates, error: duplicateErr } = await sb
      .from("listings")
      .select("id, title, price, phone, status, created_at")
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false })
      .limit(100);
    if (duplicateErr) throw duplicateErr;

    const duplicate = findDuplicateListing(
      { title, price, phone, duplicateKey },
      (candidates || []).filter((item: any) => String(item.id) !== String(editModeId || "")),
    );
    if (duplicate && !duplicateConfirmed) {
      return jsonError("Annonce similaire detectee.", 409, { duplicate });
    }

    const { data: profile, error: profileErr } = await sb
      .from("profiles")
      .select("id, free_ads_remaining, free_premium")
      .eq("id", user.id)
      .maybeSingle();
    if (profileErr) throw profileErr;

    const owner = isOwner(user.email);
    const vipFree = owner || !!profile?.free_premium;
    const freeAdsRemaining = owner ? 999 : normalizeFreeAdsRemaining(profile?.free_ads_remaining);
    const paidBoost = isPaidBoostKey(boostKey);

    if (!editModeId && !paidBoost && !vipFree && freeAdsRemaining <= 0) {
      return jsonError(`Vous avez deja utilise vos ${FREE_LISTING_LIMIT} annonces gratuites.`);
    }

    if (editModeId) {
      const { data: owned, error: ownedErr } = await sb
        .from("listings")
        .select("id, user_id")
        .eq("id", editModeId)
        .maybeSingle();
      if (ownedErr) throw ownedErr;
      if (!owned || owned.user_id !== user.id) return jsonError("Annonce introuvable.", 404);
    }

    const premiumBoost = boostKey === "premium" || boostKey === "vip";
    const featuredBoost = boostKey === "alaune" || boostKey === "vip";
    const activeWithoutPayment = !paidBoost || vipFree;
    const payload: Record<string, unknown> = {
      user_id: user.id,
      title,
      slug: String(listing.slug || ""),
      description,
      price,
      price_type: priceType,
      category: String(listing.category || "Autre"),
      category_slug: String(listing.categorySlug || listing.category_slug || "autre"),
      phone: phone || undefined,
      location: String(listing.location || ""),
      region: String(listing.region || ""),
      commune: String(listing.commune || ""),
      custom_commune: String(listing.customCommune || listing.custom_commune || ""),
      image: String(listing.image || photos[0] || "https://placehold.co/600x400?text=Sans+Image"),
      photos,
      specs: typeof listing.specs === "object" && listing.specs ? listing.specs : {},
      duplicate_key: duplicateKey,
      premium: vipFree ? true : activeWithoutPayment && premiumBoost ? true : undefined,
      featured: vipFree ? true : activeWithoutPayment && featuredBoost ? true : undefined,
      is_premium: vipFree ? true : activeWithoutPayment && premiumBoost ? true : undefined,
      is_featured: vipFree ? true : activeWithoutPayment && featuredBoost ? true : undefined,
      boost_key: paidBoost ? boostKey : undefined,
      status: activeWithoutPayment ? "active" : "pending",
    };

    const result = await adaptiveWrite(sb, editModeId ? "update" : "insert", payload, editModeId || undefined);
    if (result.error) return jsonError(result.error.message || "Publication impossible.", 500);

    if (!editModeId) {
      const profUpdate: Record<string, unknown> = { has_boutique: true };
      if (phone) profUpdate.phone = phone;
      if (!paidBoost && !vipFree && !owner) {
        profUpdate.free_ads_remaining = Math.max(0, freeAdsRemaining - 1);
      }
      await sb.from("profiles").update(profUpdate).eq("id", user.id);
    }

    return NextResponse.json({
      ok: true,
      listing: result.data,
      requiresPayment: !activeWithoutPayment,
      freeAdsRemaining: !editModeId && !paidBoost && !vipFree && !owner
        ? Math.max(0, freeAdsRemaining - 1)
        : freeAdsRemaining,
    });
  } catch (error: any) {
    return jsonError(error?.message || "Erreur serveur", 500);
  }
}
