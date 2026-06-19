import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendInvoiceEmail } from "@/lib/email";

// Forcer le rendu dynamique : cette route ne doit pas être évaluée au build
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const PAYTECH_API_SECRET = process.env.PAYTECH_API_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Initialisation paresseuse (uniquement à l'exécution, pas au build)
    if (!PAYTECH_API_SECRET || !supabaseUrl || !supabaseServiceKey) {
      console.error("IPN Error: variables d'environnement manquantes");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Utiliser le Service Role Key pour contourner les RLS lors de la mise à jour serveur
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // PayTech envoie les données sous format "application/x-www-form-urlencoded"
    const text = await req.text();
    const params = new URLSearchParams(text);
    
    const type_event = params.get('type_event');
    const custom_field = params.get('custom_field'); // user_id
    const ref_command = params.get('ref_command');
    const item_price = params.get('item_price');
    const api_secret_sha256 = params.get('api_secret_sha256');

    // 1. Vérification de sécurité (Signature PayTech)
    const expectedHash = crypto.createHash('sha256').update(PAYTECH_API_SECRET).digest('hex');
    if (api_secret_sha256 !== expectedHash) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    if (type_event === "sale_complete") {
      let payload: any = {};
      try {
        payload = JSON.parse(custom_field || "{}");
      } catch (e) {
        payload = { userId: custom_field };
      }

      const { userId, listingId, boostKey, subKey, category } = payload;

      if (userId || listingId) {
        // 2. Ajouter la transaction dans la table "purchases"
        await supabase.from("purchases").insert({
          user_id: userId || null,
          amount: parseInt(item_price || "0", 10),
          ref_command: ref_command,
          status: "success",
          type: listingId ? "boost" : "credits"
        });

        // 3. Activer le Boost de l'annonce si un listingId est fourni
        if (listingId) {
          const updateData: any = { status: "active" };
          
          if (boostKey === "premium") {
            updateData.premium = true;
            updateData.is_premium = true;
          } else if (boostKey === "alaune") {
            updateData.featured = true;
            updateData.is_featured = true;
          } else if (boostKey === "vip") {
            updateData.premium = true;
            updateData.is_premium = true;
            updateData.featured = true;
            updateData.is_featured = true;
          } else if (boostKey === "basic") {
            // basic boost - standard active position
          } else {
            // fallback to premium
            updateData.premium = true;
            updateData.is_premium = true;
          }

          await supabase.from("listings").update(updateData).eq("id", listingId);
        } else if (subKey && userId) {
          // Activer la formule d'abonnement boutique sur le profil de l'utilisateur
          await supabase.from("profiles").update({
            role: "pro",
            is_pro: true,
            subscription_plan: subKey,
            subscription_category: category || "general",
            free_ads_remaining: subKey === "standard" ? 5 : subKey === "premium" ? 15 : 50
          }).eq("id", userId);
        } else if (userId) {
          // Sinon créditer le compte (logique originale des crédits)
          const { data: profile } = await supabase.from("profiles").select("credits").eq("id", userId).single();
          const currentCredits = profile?.credits || 0;
          const newCredits = currentCredits + parseInt(item_price || "0", 10);
          await supabase.from("profiles").update({ credits: newCredits }).eq("id", userId);
        }

        // Facture par email
        if (userId) {
          try {
            const { data: u } = await supabase.auth.admin.getUserById(userId);
            const email = u?.user?.email || "";
            const name = (u?.user?.user_metadata as any)?.full_name || "";
            await sendInvoiceEmail({
              to: email, customerName: name,
              itemName: params.get("item_name") || (listingId ? "Boost annonce" : subKey ? "Abonnement" : "Crédits"),
              amount: parseInt(item_price || "0", 10), method: "PayTech", ref: ref_command || undefined,
            });
          } catch (e) { console.error("Invoice email error:", e); }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("IPN Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
