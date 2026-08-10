import { NextResponse } from "next/server";
import { trackingCode } from "@/lib/pro";
import { proContext, txt, isMissingTable, logEvent } from "@/lib/proServer";

export const dynamic = "force-dynamic";

const MAX_CLIENTS = 500;
const STATUSES = ["prospect", "active", "inactive"];

// Portefeuille clients : lister, consulter une fiche complète, créer,
// modifier, changer de statut, archiver.
export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId } = ctx;

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "list") {
      const { data, error } = await sb
        .from("pro_clients")
        .select("*")
        .eq("user_id", userId)
        .eq("archived", false)
        .order("created_at", { ascending: false });
      if (error) {
        // Table réellement absente (migration non exécutée) → on ne casse rien.
        if (isMissingTable(error)) return NextResponse.json({ clients: [], needsMigration: true });
        throw error;
      }
      return NextResponse.json({ clients: data || [] });
    }

    // Fiche client complète : projets, devis, factures, paiements, journal.
    if (action === "get") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Client requis." }, { status: 400 });

      const { data: client } = await sb
        .from("pro_clients")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!client) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });

      const [projects, quotes, invoices, events] = await Promise.all([
        sb.from("pro_projects").select("*").eq("user_id", userId).eq("client_id", id)
          .order("created_at", { ascending: false }),
        sb.from("pro_quotes").select("*").eq("user_id", userId).eq("client_id", id)
          .order("created_at", { ascending: false }),
        sb.from("pro_invoices").select("*").eq("user_id", userId).eq("client_id", id)
          .order("created_at", { ascending: false }),
        sb.from("pro_events").select("*").eq("user_id", userId).eq("entity", "client").eq("entity_id", id)
          .order("created_at", { ascending: false }).limit(30),
      ]);

      // Paiements du client = ceux de ses factures.
      const invoiceIds = (invoices.data || []).map((i: any) => i.id);
      let payments: any[] = [];
      if (invoiceIds.length) {
        const { data } = await sb
          .from("pro_payments")
          .select("*")
          .eq("user_id", userId)
          .in("invoice_id", invoiceIds)
          .order("paid_at", { ascending: false });
        payments = data || [];
      }

      return NextResponse.json({
        client,
        projects: projects.data || [],
        quotes: quotes.data || [],
        invoices: invoices.data || [],
        payments,
        events: events.data || [],
      });
    }

    if (action === "create") {
      const name = txt(body?.name);
      if (!name) return NextResponse.json({ error: "Le nom du client est obligatoire." }, { status: 400 });

      const { count } = await sb
        .from("pro_clients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((count || 0) >= MAX_CLIENTS) {
        return NextResponse.json({ error: `Maximum ${MAX_CLIENTS} clients atteint.` }, { status: 400 });
      }

      const status = STATUSES.includes(txt(body?.status, 20)) ? txt(body?.status, 20) : "prospect";

      // Le code de suivi doit être unique : on retente si la collision se produit.
      let created: any = null;
      let lastErr: any = null;
      for (let i = 0; i < 5; i++) {
        const payload = {
          user_id: userId,
          name,
          company: txt(body?.company) || null,
          phone: txt(body?.phone, 40) || null,
          email: txt(body?.email, 160) || null,
          city: txt(body?.city, 80) || null,
          address: txt(body?.address, 300) || null,
          sector: txt(body?.sector, 80) || null,
          notes: txt(body?.notes, 2000) || null,
          billing_name: txt(body?.billing_name, 200) || null,
          tax_id: txt(body?.tax_id, 60) || null,
          status,
          tracking_code: trackingCode(name),
        };
        const { data, error } = await sb.from("pro_clients").insert(payload).select("*").single();
        if (!error) { created = data; break; }
        lastErr = error;
        if (!/duplicate|unique/i.test(error.message || "")) break;
      }
      if (!created) {
        return NextResponse.json({ error: lastErr?.message || "Création impossible." }, { status: 500 });
      }

      await logEvent(sb, userId, "client", created.id, "created", `Client « ${created.company || created.name} » créé`);
      return NextResponse.json({ ok: true, client: created });
    }

    if (action === "update") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Client requis." }, { status: 400 });

      const patch: Record<string, unknown> = {};
      const fields: Array<[string, number]> = [
        ["name", 160], ["company", 160], ["phone", 40], ["email", 160],
        ["city", 80], ["address", 300], ["sector", 80], ["notes", 2000],
        ["billing_name", 200], ["tax_id", 60],
      ];
      for (const [f, max] of fields) {
        if (f in body) patch[f] = txt(body[f], max) || null;
      }
      if ("status" in body) {
        const s = txt(body.status, 20);
        if (!STATUSES.includes(s)) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
        patch.status = s;
      }
      // Le nom reste obligatoire même en modification.
      if ("name" in patch && !patch.name) {
        return NextResponse.json({ error: "Le nom du client est obligatoire." }, { status: 400 });
      }
      if (!Object.keys(patch).length) return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });
      patch.updated_at = new Date().toISOString();

      const { data, error } = await sb
        .from("pro_clients")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single();
      if (error || !data) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });

      const label = "status" in patch
        ? `Statut passé à « ${patch.status} »`
        : "Fiche client modifiée";
      await logEvent(sb, userId, "client", id, "updated", label, { fields: Object.keys(patch) });
      return NextResponse.json({ ok: true, client: data });
    }

    if (action === "delete") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Client requis." }, { status: 400 });
      // Archivage plutôt que suppression : les devis déjà envoyés gardent leur contexte.
      const { error } = await sb
        .from("pro_clients")
        .update({ archived: true, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logEvent(sb, userId, "client", id, "archived", "Client archivé");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
