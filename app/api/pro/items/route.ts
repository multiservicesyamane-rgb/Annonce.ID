import { NextResponse } from "next/server";
import { proContext, txt, num, isMissingTable } from "@/lib/proServer";

export const dynamic = "force-dynamic";

// Un catalogue plus long qu'un écran de téléphone ne se consulte plus : au
// delà, c'est une recherche qu'il faut, pas une liste. Le plafond évite aussi
// qu'un « enregistrer les lignes » répété ne remplisse la table sans fin.
const MAX_ITEMS = 300;

/**
 * Catalogue de prestations — les lignes habituelles du professionnel.
 *
 * Commodité de saisie, jamais une référence : une prestation ajoutée à un
 * devis en est RECOPIÉE (label et prix figés dans la pièce), exactement comme
 * les rubriques. Changer un prix ici ne réécrit aucun document déjà envoyé.
 */
export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId } = ctx;

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // Du plus utilisé au moins utilisé : après quelques semaines, les trois
    // prestations du quotidien sont en tête et le catalogue devient un
    // raccourci plutôt qu'une liste à parcourir.
    if (action === "list") {
      const { data, error } = await sb
        .from("pro_items")
        .select("*")
        .eq("user_id", userId)
        .order("uses", { ascending: false })
        .order("last_used_at", { ascending: false, nullsFirst: false })
        .order("label", { ascending: true })
        .limit(MAX_ITEMS);
      if (error) {
        // Table absente (migration non exécutée) : l'éditeur de lignes doit
        // continuer à fonctionner sans catalogue, pas tomber en panne.
        if (isMissingTable(error)) return NextResponse.json({ items: [], needsMigration: true });
        throw error;
      }
      return NextResponse.json({ items: data || [] });
    }

    // Enregistre une ou plusieurs prestations. Réenregistrer une ligne
    // existante n'est pas une erreur : son prix est mis à jour, ce qui est
    // exactement ce qu'on veut après une hausse des matériaux.
    if (action === "save") {
      const raw = Array.isArray(body?.items) ? body.items : [body?.item];
      const rows = raw
        .map((it: unknown) => {
          const o = (it || {}) as Record<string, unknown>;
          return {
            label: txt(o.label, 200),
            unit_price: num(o.unit_price),
            unit: txt(o.unit, 20) || null,
          };
        })
        .filter((r: { label: string }) => r.label.length > 0)
        .slice(0, 50);

      if (!rows.length) return NextResponse.json({ error: "Aucune prestation à enregistrer." }, { status: 400 });

      const { data: existing, error: readError } = await sb
        .from("pro_items").select("id, label").eq("user_id", userId);
      if (readError) {
        if (isMissingTable(readError)) return NextResponse.json({ needsMigration: true }, { status: 400 });
        throw readError;
      }

      // Le tri insertion / mise à jour se fait ici plutôt qu'avec un `upsert` :
      // l'unicité repose sur un index sur EXPRESSION — (user_id, lower(label)) —
      // et PostgREST n'accepte que des noms de colonnes dans `onConflict`. Il ne
      // saurait donc pas viser cet index. L'index reste en place et fait foi
      // contre les écritures concurrentes ; ici on lui évite simplement le conflit.
      const known = new Map(
        (existing || []).map((e: { id: string; label: string }) => [e.label.trim().toLowerCase(), e.id]),
      );

      const toInsert = rows.filter((r: { label: string }) => !known.has(r.label.toLowerCase()));
      const toUpdate = rows.filter((r: { label: string }) => known.has(r.label.toLowerCase()));

      if ((existing?.length || 0) + toInsert.length > MAX_ITEMS) {
        return NextResponse.json(
          { error: `Catalogue plein (${MAX_ITEMS} prestations). Supprimez-en avant d'en ajouter.` },
          { status: 400 },
        );
      }

      if (toInsert.length) {
        const { error } = await sb
          .from("pro_items")
          .insert(toInsert.map((r: object) => ({ ...r, user_id: userId })));
        // 23505 : deux enregistrements simultanés de la même prestation. La
        // ligne existe, c'est le résultat voulu — rien à signaler.
        if (error && error.code !== "23505") throw error;
      }

      for (const r of toUpdate) {
        await sb
          .from("pro_items")
          .update({ unit_price: r.unit_price, unit: r.unit })
          .eq("id", known.get(r.label.toLowerCase()))
          .eq("user_id", userId);
      }

      return NextResponse.json({ saved: rows.length, added: toInsert.length, updated: toUpdate.length });
    }

    // Une prestation vient d'être posée sur un devis : on note l'usage, c'est
    // ce qui fait remonter les lignes du quotidien en tête de liste.
    if (action === "use") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Prestation requise." }, { status: 400 });

      const { data: current } = await sb
        .from("pro_items").select("uses").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!current) return NextResponse.json({ ok: true });

      await sb
        .from("pro_items")
        .update({ uses: (Number(current.uses) || 0) + 1, last_used_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Prestation requise." }, { status: 400 });
      const { error } = await sb.from("pro_items").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (error) {
    console.error("[api/pro/items]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
