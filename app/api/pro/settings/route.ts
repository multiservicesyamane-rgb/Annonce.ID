import { NextResponse } from "next/server";
import { proContext, txt, isMissingTable, isMissingColumn } from "@/lib/proServer";
import { fetchSeller } from "@/lib/proPublic";
import { sanitizeSections, businessStatus, canChargeTax, invoiceTitle, docTemplate } from "@/lib/pro";

export const dynamic = "force-dynamic";

/** Colonnes apportées par MIGRATION_ESPACE_PRO.sql, à retirer si elle n'a pas tourné. */
const NEW_COLUMNS = [
  "quote_sections", "logo_url", "signature_url", "stamp_url",
  "doc_template", "doc_accent", "signature_label",
  "business_status", "invoice_title",
] as const;

/**
 * Modèle de document. La liste fait autorité dans lib/pro (DOC_TEMPLATES) et
 * doit rester identique à la contrainte SQL `pro_settings_doc_template_chk`
 * — voir database/MIGRATION_MODELES_DOCUMENTS.sql. Un identifiant inconnu
 * retombe sur « classique » plutôt que d'être écrit tel quel : la base le
 * refuserait avec un message incompréhensible pour l'utilisateur.
 */
const docTemplateId = (v: unknown) => docTemplate(txt(v, 20)).id;

/** Couleur d'accent : hexadécimal strict, sinon rien. Cette valeur finit dans
 *  un attribut de style du document ; une chaîne libre y serait injectée. */
const hexColor = (v: unknown) => {
  const s = txt(v, 7);
  return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : null;
};

/**
 * URL d'un fichier déposé (logo, signature, cachet).
 *
 * N'accepte QUE le stockage du projet. Sans ce filtre, un logo pointant vers
 * un domaine tiers serait embarqué dans chaque facture envoyée à un client :
 * le tiers verrait passer les ouvertures de documents, et pourrait changer
 * l'image après coup sur une pièce déjà transmise.
 */
const assetUrl = (v: unknown) => {
  const s = txt(v, 700);
  if (!s) return null;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
  return base && s.startsWith(`${base}/storage/v1/object/public/pro-docs/`) ? s : null;
};

// Identité professionnelle : ce qui figure en en-tête des devis et factures.
// Une seule ligne par compte, créée à la première sauvegarde.
export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId } = ctx;

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // Espace pro activé ? Sert à décider si le basculeur de mode s'affiche.
    // Volontairement léger : trois comptages sans corps de réponse, là où
    // /api/pro/dashboard rapatrie toutes les pièces du compte.
    //
    // Est « activé » celui qui l'a demandé (ligne pro_settings créée) OU celui
    // qui a déjà travaillé avec (un client, un devis, une facture). Le second
    // cas évite de faire disparaître le module sous les pieds de quelqu'un qui
    // s'en sert déjà — aucune migration nécessaire pour autant.
    if (action === "status") {
      const [settingsRow, clientsRes, quotesRes, invoicesRes] = await Promise.all([
        sb.from("pro_settings").select("user_id").eq("user_id", userId).maybeSingle(),
        ...["pro_clients", "pro_quotes", "pro_invoices"].map((t) =>
          sb.from(t).select("id", { count: "exact", head: true }).eq("user_id", userId),
        ),
      ]);

      if (settingsRow.error && isMissingTable(settingsRow.error)) {
        return NextResponse.json({ activated: false, needsMigration: true });
      }

      const counts = {
        clients: clientsRes?.count || 0,
        quotes: quotesRes?.count || 0,
        invoices: invoicesRes?.count || 0,
      };
      const used = counts.clients > 0 || counts.quotes > 0 || counts.invoices > 0;

      return NextResponse.json({ activated: !!settingsRow.data || used, counts });
    }

    // Activation explicite : créer la ligne de réglages suffit à marquer le
    // choix, côté serveur donc valable sur tous les appareils du compte.
    if (action === "activate") {
      const { error } = await sb
        .from("pro_settings")
        .upsert({ user_id: userId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) {
        if (isMissingTable(error)) {
          return NextResponse.json({ error: "Table des réglages absente.", needsMigration: true }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Activation impossible." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, activated: true });
    }

    if (action === "get") {
      const { data, error } = await sb
        .from("pro_settings").select("*").eq("user_id", userId).maybeSingle();
      if (error && isMissingTable(error)) return NextResponse.json({ settings: null, needsMigration: true });

      // `seller` est l'en-tête tel qu'il sortira sur le papier — logo, modèle,
      // couleur, signature, cachet, mentions. Les écrans de devis et de
      // factures s'en servent pour l'aperçu en direct ; le calculer ici plutôt
      // que côté navigateur garantit que l'aperçu et l'impression racontent la
      // même chose (voir fetchSeller dans lib/proPublic.ts).
      const seller = await fetchSeller(sb, userId);
      return NextResponse.json({ settings: data || null, seller });
    }

    if (action === "save") {
      let rate = Math.min(100, Math.max(0, Number(body?.default_tax_rate) || 0));

      // Sans NINEA, pas de TVA. Appliqué ici et pas seulement dans l'écran :
      // un appel direct à l'API suffirait sinon à contourner la règle, et la
      // contrainte SQL rejetterait l'écriture avec un message incompréhensible.
      //
      // Le statut envoyé prime ; à défaut on lit celui déjà enregistré. Tant
      // que la migration n'a pas tourné, la colonne n'existe pas : on laisse
      // alors le taux tel quel plutôt que de remettre à zéro la TVA de comptes
      // qui l'utilisent déjà légitimement.
      if (body?.business_status !== undefined) {
        if (!canChargeTax(businessStatus(body.business_status))) rate = 0;
      } else if (rate > 0) {
        const statusRow = await sb
          .from("pro_settings").select("business_status").eq("user_id", userId).maybeSingle();
        const known = !statusRow.error || !isMissingColumn(statusRow.error);
        if (known && !canChargeTax(statusRow.data?.business_status)) rate = 0;
      }
      const payload = {
        user_id: userId,
        business_name: txt(body?.business_name, 200) || null,
        tax_id: txt(body?.tax_id, 60) || null,
        address: txt(body?.address, 300) || null,
        email: txt(body?.email, 160) || null,
        phone: txt(body?.phone, 40) || null,
        payment_details: txt(body?.payment_details, 500) || null,
        default_terms: txt(body?.default_terms, 1000) || null,
        default_tax_rate: rate,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>;

      // Champs apportés par MIGRATION_ESPACE_PRO.sql. Chacun n'est écrit que
      // s'il est présent dans le corps : l'écran d'identité et celui des
      // rubriques enregistrent séparément, et aucun ne doit effacer le travail
      // de l'autre en envoyant un champ vide qu'il n'édite pas.
      if (body?.quote_sections !== undefined) payload.quote_sections = sanitizeSections(body.quote_sections);
      if (body?.doc_template !== undefined) payload.doc_template = docTemplateId(body.doc_template);
      if (body?.doc_accent !== undefined) payload.doc_accent = hexColor(body.doc_accent);
      if (body?.signature_label !== undefined) payload.signature_label = txt(body.signature_label, 120) || null;
      if (body?.invoice_title !== undefined) payload.invoice_title = invoiceTitle(body.invoice_title);

      // Statut et TVA sont liés : sans NINEA on ne collecte pas de TVA. La
      // regle est appliquee ICI et pas seulement dans l'ecran, sinon un appel
      // direct a l'API suffirait a la contourner - et la contrainte SQL
      // rejetterait l'ecriture avec un message incomprehensible.
      if (body?.business_status !== undefined) {
        payload.business_status = businessStatus(body.business_status);
      }
      for (const k of ["logo_url", "signature_url", "stamp_url"] as const) {
        if (body?.[k] !== undefined) payload[k] = assetUrl(body[k]);
      }

      // `upsert` sur la clé primaire : une seule ligne par professionnel, qu'elle
      // existe déjà ou non.
      let { data, error } = await sb
        .from("pro_settings").upsert(payload, { onConflict: "user_id" }).select("*").single();

      // Migration pas encore exécutée : plutôt que de faire échouer tout
      // l'enregistrement — y compris l'identité professionnelle, qui n'a rien
      // demandé — on réessaie sans les colonnes récentes et on signale ce qui
      // n'a pas pu être conservé.
      let sectionsSkipped = false;
      if (error && isMissingColumn(error)) {
        const legacy = { ...payload };
        for (const k of NEW_COLUMNS) delete legacy[k];
        ({ data, error } = await sb
          .from("pro_settings").upsert(legacy, { onConflict: "user_id" }).select("*").single());
        sectionsSkipped = !error;
      }

      if (error) {
        if (isMissingTable(error)) {
          return NextResponse.json({ error: "Table des réglages absente.", needsMigration: true }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Enregistrement impossible." }, { status: 500 });
      }
      if (sectionsSkipped) {
        return NextResponse.json({
          ok: true,
          settings: data,
          warning: "Réglages partiellement enregistrés : exécutez database/MIGRATION_ESPACE_PRO.sql dans Supabase.",
        });
      }
      return NextResponse.json({ ok: true, settings: data });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
