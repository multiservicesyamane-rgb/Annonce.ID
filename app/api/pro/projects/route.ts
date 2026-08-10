import { NextResponse } from "next/server";
import { sanitizeTasks, sanitizeDocuments, progressFromTasks, PROJECT_STATUSES } from "@/lib/pro";
import { proContext, txt, num, dateOrNull, isMissingTable, logEvent, attachClients, ownsRow } from "@/lib/proServer";

export const dynamic = "force-dynamic";

const STATUSES: string[] = [...PROJECT_STATUSES];

// Projets du professionnel : pilotage des missions, de la planification à la
// livraison. Un projet peut naître à la main ou automatiquement quand un devis
// est accepté (voir /api/pro/quote-public).
export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId } = ctx;

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "list") {
      const { data, error } = await sb
        .from("pro_projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) {
        if (isMissingTable(error)) return NextResponse.json({ projects: [], needsMigration: true });
        throw error;
      }
      return NextResponse.json({ projects: await attachClients(sb, data || []) });
    }

    // Fiche projet : devis et factures rattachés + historique des modifications.
    if (action === "get") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Projet requis." }, { status: 400 });

      const { data: project } = await sb
        .from("pro_projects").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

      const [quotes, invoices, events] = await Promise.all([
        sb.from("pro_quotes").select("*").eq("user_id", userId).eq("project_id", id)
          .order("created_at", { ascending: false }),
        sb.from("pro_invoices").select("*").eq("user_id", userId).eq("project_id", id)
          .order("created_at", { ascending: false }),
        sb.from("pro_events").select("*").eq("user_id", userId).eq("entity", "project").eq("entity_id", id)
          .order("created_at", { ascending: false }).limit(40),
      ]);

      const [withClient] = await attachClients(sb, [project]);
      return NextResponse.json({
        project: withClient,
        quotes: quotes.data || [],
        invoices: invoices.data || [],
        events: events.data || [],
      });
    }

    if (action === "create") {
      const name = txt(body?.name, 200);
      if (!name) return NextResponse.json({ error: "Indiquez le nom du projet." }, { status: 400 });

      const clientId = txt(body?.client_id, 60) || null;
      if (clientId && !(await ownsRow(sb, "pro_clients", clientId, userId))) {
        return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
      }

      const status = STATUSES.includes(txt(body?.status, 20)) ? txt(body?.status, 20) : "planned";
      const tasks = sanitizeTasks(body?.tasks);

      const payload = {
        user_id: userId,
        client_id: clientId,
        name,
        description: txt(body?.description, 3000) || null,
        budget: num(body?.budget),
        start_date: dateOrNull(body?.start_date),
        due_date: dateOrNull(body?.due_date),
        progress: Math.min(100, num(body?.progress, 100)),
        status,
        tasks,
        documents: sanitizeDocuments(body?.documents),
      };

      const { data, error } = await sb.from("pro_projects").insert(payload).select("*").single();
      if (error) {
        if (isMissingTable(error)) return NextResponse.json({ error: "Table des projets absente.", needsMigration: true }, { status: 400 });
        return NextResponse.json({ error: error.message || "Création impossible." }, { status: 500 });
      }

      await logEvent(sb, userId, "project", data.id, "created", `Projet « ${name} » créé`);
      return NextResponse.json({ ok: true, project: data });
    }

    if (action === "update") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Projet requis." }, { status: 400 });

      const { data: before } = await sb
        .from("pro_projects").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!before) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

      const patch: Record<string, unknown> = {};
      if ("name" in body) {
        const n = txt(body.name, 200);
        if (!n) return NextResponse.json({ error: "Le nom du projet est obligatoire." }, { status: 400 });
        patch.name = n;
      }
      if ("description" in body) patch.description = txt(body.description, 3000) || null;
      if ("budget" in body) patch.budget = num(body.budget);
      if ("start_date" in body) patch.start_date = dateOrNull(body.start_date);
      if ("due_date" in body) patch.due_date = dateOrNull(body.due_date);
      if ("progress" in body) patch.progress = Math.min(100, num(body.progress, 100));
      if ("documents" in body) patch.documents = sanitizeDocuments(body.documents);
      if ("client_id" in body) {
        const cid = txt(body.client_id, 60) || null;
        if (cid && !(await ownsRow(sb, "pro_clients", cid, userId))) {
          return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
        }
        patch.client_id = cid;
      }
      if ("status" in body) {
        const s = txt(body.status, 20);
        if (!STATUSES.includes(s)) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
        patch.status = s;
        // Un projet terminé est forcément à 100 % : évite l'incohérence visible
        // sur la barre d'avancement.
        if (s === "done" && !("progress" in body)) patch.progress = 100;
      }
      if ("tasks" in body) {
        const tasks = sanitizeTasks(body.tasks);
        patch.tasks = tasks;
        // L'avancement suit les tâches cochées, sauf réglage manuel simultané.
        if (!("progress" in body) && tasks.length) patch.progress = progressFromTasks(tasks);
      }
      if (!Object.keys(patch).length) return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });
      patch.updated_at = new Date().toISOString();

      const { data, error } = await sb
        .from("pro_projects").update(patch).eq("id", id).eq("user_id", userId).select("*").single();
      if (error || !data) return NextResponse.json({ error: "Modification impossible." }, { status: 500 });

      // Journal lisible : on décrit le changement, pas la liste des colonnes.
      let msg = "Projet modifié";
      if (patch.status && patch.status !== before.status) msg = `Statut : ${before.status} → ${patch.status}`;
      else if (patch.progress != null && patch.progress !== before.progress) msg = `Avancement : ${before.progress} % → ${patch.progress} %`;
      else if (patch.tasks) msg = "Tâches mises à jour";
      else if (patch.documents) msg = "Documents mis à jour";
      await logEvent(sb, userId, "project", id, "updated", msg, { fields: Object.keys(patch) });

      return NextResponse.json({ ok: true, project: data });
    }

    if (action === "delete") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Projet requis." }, { status: 400 });
      // Les devis et factures liés survivent au projet : on ne perd pas de trace
      // comptable, on détache seulement.
      await sb.from("pro_quotes").update({ project_id: null }).eq("project_id", id).eq("user_id", userId);
      await sb.from("pro_invoices").update({ project_id: null }).eq("project_id", id).eq("user_id", userId);
      const { error } = await sb.from("pro_projects").delete().eq("id", id).eq("user_id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logEvent(sb, userId, "project", id, "deleted", "Projet supprimé");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
