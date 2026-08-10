"use client";

// Projets — pilotage des missions, du lancement à la livraison.
// Un projet naît à la main ici, ou automatiquement quand un client accepte un
// devis (l'API d'acceptation l'ouvre alors avec le budget du devis).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatFcfa, formatDate, timeAgo, daysUntil,
  PROJECT_LABELS, QUOTE_LABELS, INVOICE_LABELS,
  effectiveQuoteStatus, effectiveInvoiceStatus, progressFromTasks,
  type Task,
} from "@/lib/pro";
import { uploadProDocument, MAX_DOC_BYTES } from "@/lib/storage";
import {
  api, card, input, lbl, Badge, Crumb, Empty, F, FilterBar, MigrationNotice, MoneyField,
  PageHead, Progress, Section, Select, useConfirm,
  PROJECT_STYLE, QUOTE_STYLE, INVOICE_STYLE,
  type Client, type Invoice, type ProEvent, type Project, type Quote, type Toast,
} from "./ui";

type Detail = { project: Project; quotes: Quote[]; invoices: Invoice[]; events: ProEvent[] };

const STATUS_OPTIONS = [
  { value: "planned", label: "Planifié" },
  { value: "active", label: "En cours" },
  { value: "paused", label: "En pause" },
  { value: "done", label: "Terminé" },
  { value: "cancelled", label: "Annulé" },
];

export default function ProjectsPanel({ toast, goTo }: { toast: Toast; goTo: (p: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [busy, setBusy] = useState(false);

  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [editing, setEditing] = useState<Project | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // Formulaire
  const [form, setForm] = useState<Record<string, string>>({});
  const [budget, setBudget] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const { ask, confirmNode } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      api("projects", { action: "list" }),
      api("clients", { action: "list" }),
    ]);
    if (p.data?.needsMigration || c.data?.needsMigration) setNeedsMigration(true);
    setProjects(p.data?.projects || []);
    setClients(c.data?.clients || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!needle) return true;
      return [p.name, p.description, p.pro_clients?.company, p.pro_clients?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [projects, query, filter]);

  /* ---------------- Actions ---------------- */

  function openNew() {
    setEditing(null);
    setForm({ status: "planned", start_date: new Date().toISOString().slice(0, 10) });
    setBudget(0);
    setTasks([]);
    setView("form");
  }

  function openEdit(p: Project) {
    setEditing(p);
    setForm({
      name: p.name || "",
      description: p.description || "",
      client_id: p.client_id || "",
      status: p.status || "planned",
      start_date: p.start_date || "",
      due_date: p.due_date || "",
      progress: String(p.progress ?? 0),
    });
    setBudget(p.budget || 0);
    setTasks(Array.isArray(p.tasks) ? p.tasks : []);
    setView("form");
  }

  async function openDetail(id: string) {
    setBusy(true);
    const { ok, data } = await api("projects", { action: "get", id });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Projet indisponible"));
    setDetail(data as Detail);
    setView("detail");
  }

  async function save() {
    if (!form.name?.trim()) return toast("⚠ Indiquez le nom du projet.");
    setBusy(true);
    const payload: Record<string, unknown> = {
      action: editing ? "update" : "create",
      name: form.name,
      description: form.description || "",
      client_id: form.client_id || "",
      status: form.status || "planned",
      start_date: form.start_date || "",
      due_date: form.due_date || "",
      budget,
      tasks,
      progress: Number(form.progress) || 0,
    };
    if (editing) payload.id = editing.id;

    const { ok, data } = await api("projects", payload);
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));
    toast(editing ? "✓ Projet mis à jour" : "✓ Projet créé");
    setView("list");
    setEditing(null);
    load();
  }

  /** Modification ciblée depuis la fiche (statut, avancement, tâches, documents). */
  async function patchProject(id: string, patch: Record<string, unknown>, message?: string) {
    setBusy(true);
    const { ok, data } = await api("projects", { action: "update", id, ...patch });
    setBusy(false);
    if (!ok) return toast("⚠ " + (data.error || "Erreur"));
    if (message) toast(message);
    if (detail?.project.id === id) {
      setDetail({ ...detail, project: { ...detail.project, ...data.project } });
    }
    load();
  }

  function remove(p: Project) {
    ask(`Supprimer le projet « ${p.name} » ? Les devis et factures liés sont conservés.`, async () => {
      const { ok, data } = await api("projects", { action: "delete", id: p.id });
      if (!ok) return toast("⚠ " + (data.error || "Erreur"));
      toast("✓ Projet supprimé");
      setView("list");
      load();
    });
  }

  /* ---------------- Rendu ---------------- */

  if (needsMigration) return <MigrationNotice />;
  if (loading) return <div className="py-16 text-center text-gray-400">Chargement…</div>;

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.company || c.name }));

  /* ===== Formulaire ===== */
  if (view === "form") {
    const autoProgress = progressFromTasks(tasks);
    return (
      <div className="mx-auto max-w-[980px]">
        {confirmNode}
        <Crumb
          onBack={() => { setView("list"); setEditing(null); }}
          parent="Projets"
          current={editing ? `Modifier ${editing.name}` : "Nouveau projet"}
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-4">
            <Section icon="📁" title="La mission">
              <div className="grid gap-3">
                <F l="Nom du projet" v={form.name} set={(v) => setForm({ ...form, name: v })} ph="Ex : Refonte de l'identité visuelle" />
                <div>
                  <span className={lbl}>Description et objectifs</span>
                  <textarea
                    className={`${input} min-h-[110px] resize-none`}
                    placeholder="Ce que le client attend, le périmètre, les livrables convenus…"
                    value={form.description || ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <Select
                  l="Client"
                  v={form.client_id}
                  set={(v) => setForm({ ...form, client_id: v })}
                  options={clientOptions}
                  placeholder={clients.length ? "Choisir un client…" : "Aucun client enregistré"}
                />
              </div>
            </Section>

            <Section icon="🗓️" title="Planning et budget">
              <div className="grid gap-3 sm:grid-cols-2">
                <F l="Date de début" v={form.start_date} set={(v) => setForm({ ...form, start_date: v })} type="date" />
                <F l="Date de livraison" v={form.due_date} set={(v) => setForm({ ...form, due_date: v })} type="date" />
                <MoneyField l="Budget prévisionnel" v={budget} set={setBudget} hint="Montant estimé de la mission." />
                <Select l="Statut" v={form.status} set={(v) => setForm({ ...form, status: v })} options={STATUS_OPTIONS} />
              </div>
            </Section>

            <Section
              icon="✅"
              title="Prestations et tâches"
              aside={
                tasks.length > 0 ? (
                  <span className="text-[.72rem] font-bold text-gray-400">
                    {tasks.filter((t) => t.done).length}/{tasks.length}
                  </span>
                ) : undefined
              }
            >
              <TaskEditor tasks={tasks} setTasks={setTasks} value={newTask} setValue={setNewTask} />
              {tasks.length > 0 && (
                <p className="mt-2.5 text-[.72rem] text-gray-400">
                  L&apos;avancement suivra les tâches cochées ({autoProgress} %) sauf si vous réglez le curseur ci-contre.
                </p>
              )}
            </Section>
          </div>

          <div className="flex flex-col gap-4">
            <div className={`${card} p-4`}>
              <span className={lbl}>Avancement</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Number(form.progress) || 0}
                  onChange={(e) => setForm({ ...form, progress: e.target.value })}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-green dark:bg-white/10"
                />
                <span className="w-12 shrink-0 text-right font-mono text-[.95rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                  {Number(form.progress) || 0} %
                </span>
              </div>
              {tasks.length > 0 && Number(form.progress) !== autoProgress && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, progress: String(autoProgress) })}
                  className="mt-2 text-[.74rem] font-bold text-green transition hover:underline"
                >
                  Aligner sur les tâches ({autoProgress} %)
                </button>
              )}
            </div>

            <button
              onClick={save}
              disabled={busy}
              className="btn btn-green w-full py-3 text-[.88rem] font-extrabold disabled:opacity-50"
            >
              {busy ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer le projet"}
            </button>

            {!editing && (
              <p className="px-1 text-[.74rem] leading-relaxed text-gray-400">
                Vous pourrez joindre des documents et rattacher des devis une fois le projet créé.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ===== Fiche projet ===== */
  if (view === "detail" && detail) {
    const p = detail.project;
    const left = daysUntil(p.due_date);
    const invoiced = detail.invoices
      .filter((i) => i.status !== "draft" && i.status !== "cancelled")
      .reduce((s, i) => s + (i.total || 0), 0);
    const cashed = detail.invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
    const taskList: Task[] = Array.isArray(p.tasks) ? p.tasks : [];
    const docs = Array.isArray(p.documents) ? p.documents : [];

    return (
      <div className="mx-auto max-w-[980px]">
        {confirmNode}
        <Crumb onBack={() => setView("list")} parent="Projets" current={p.name} />

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <div className={`${card} p-4 sm:p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-[1.15rem] font-extrabold text-gray-900 dark:text-white">{p.name}</h2>
                    <Badge cls={PROJECT_STYLE[p.status] || PROJECT_STYLE.planned}>
                      {PROJECT_LABELS[p.status] || p.status}
                    </Badge>
                  </div>
                  {p.pro_clients && (
                    <p className="text-[.82rem] text-gray-500">
                      {p.pro_clients.company || p.pro_clients.name}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[1.1rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                    {formatFcfa(p.budget)}
                  </div>
                  <div className="text-[.7rem] text-gray-400">budget prévu</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[.75rem]">
                  <span className="font-bold text-gray-600 dark:text-gray-400">Avancement</span>
                  <span className="font-mono font-extrabold text-gray-900 dark:text-white">{p.progress} %</span>
                </div>
                <Progress value={p.progress} tone={p.status === "paused" ? "amber" : "green"} />
              </div>

              <div className="mt-4 grid gap-2.5 border-t border-gray-100 pt-3.5 text-[.82rem] dark:border-white/10 sm:grid-cols-3">
                <Meta label="Début" value={formatDate(p.start_date)} />
                <Meta label="Livraison" value={formatDate(p.due_date)} />
                <Meta
                  label="Échéance"
                  value={
                    left == null ? "—"
                    : p.status === "done" ? "livré"
                    : left < 0 ? `en retard de ${Math.abs(left)} j`
                    : left === 0 ? "aujourd'hui"
                    : `dans ${left} j`
                  }
                  tone={left != null && left < 0 && p.status !== "done" ? "red" : undefined}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3.5 dark:border-white/10">
                <button onClick={() => openEdit(p)} className="btn btn-green px-4 py-2 text-[.8rem] font-bold">
                  ✏️ Modifier
                </button>
                {STATUS_OPTIONS.filter((s) => s.value !== p.status).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => patchProject(p.id, { status: s.value }, `✓ Projet ${s.label.toLowerCase()}`)}
                    disabled={busy}
                    className={btnGhost}
                  >
                    {s.label}
                  </button>
                ))}
                <button onClick={() => remove(p)} className={`${btnGhost} text-brand-red`}>
                  Supprimer
                </button>
              </div>
            </div>

            {p.description && (
              <Section icon="🎯" title="Description et objectifs">
                <p className="whitespace-pre-line text-[.85rem] leading-relaxed text-gray-600 dark:text-gray-300">
                  {p.description}
                </p>
              </Section>
            )}

            {/* Tâches cochables directement depuis la fiche */}
            <Section
              icon="✅"
              title="Prestations et tâches"
              aside={
                taskList.length > 0 ? (
                  <span className="text-[.72rem] font-bold text-gray-400">
                    {taskList.filter((t) => t.done).length}/{taskList.length}
                  </span>
                ) : undefined
              }
            >
              {taskList.length === 0 ? (
                <p className="py-2 text-[.82rem] text-gray-400">
                  Aucune tâche. Ajoutez-en via « Modifier » pour suivre l&apos;avancement automatiquement.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {taskList.map((t, i) => (
                    <li key={i}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition hover:bg-gray-50 dark:hover:bg-white/5">
                        <input
                          type="checkbox"
                          checked={t.done}
                          disabled={busy}
                          onChange={() => {
                            const next = taskList.map((x, j) => (j === i ? { ...x, done: !x.done } : x));
                            patchProject(p.id, { tasks: next });
                          }}
                          className="h-4 w-4 shrink-0 accent-green"
                        />
                        <span
                          className={`text-[.85rem] ${
                            t.done ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {t.label}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <DocumentsSection
              docs={docs}
              busy={busy}
              toast={toast}
              onChange={(next) => patchProject(p.id, { documents: next }, "✓ Documents mis à jour")}
            />

            {/* Devis et factures rattachés */}
            <Section
              icon="📄"
              title="Devis associés"
              aside={
                <button onClick={() => goTo("quotes")} className="text-[.75rem] font-bold text-green hover:underline">
                  Aller aux devis
                </button>
              }
            >
              {detail.quotes.length === 0 ? (
                <p className="py-2 text-[.82rem] text-gray-400">Aucun devis rattaché à ce projet.</p>
              ) : (
                <LinkedRows
                  rows={detail.quotes.map((q) => {
                    const s = effectiveQuoteStatus(q);
                    return {
                      id: q.id, title: q.title, sub: q.number || "", amount: q.total,
                      badge: QUOTE_LABELS[s] || s, cls: QUOTE_STYLE[s] || QUOTE_STYLE.draft,
                    };
                  })}
                />
              )}
            </Section>

            <Section
              icon="🧾"
              title="Factures associées"
              aside={
                <button onClick={() => goTo("invoices")} className="text-[.75rem] font-bold text-green hover:underline">
                  Aller aux factures
                </button>
              }
            >
              {detail.invoices.length === 0 ? (
                <p className="py-2 text-[.82rem] text-gray-400">Aucune facture rattachée à ce projet.</p>
              ) : (
                <LinkedRows
                  rows={detail.invoices.map((i) => {
                    const s = effectiveInvoiceStatus(i);
                    return {
                      id: i.id, title: i.title, sub: i.number || "", amount: i.total,
                      badge: INVOICE_LABELS[s] || s, cls: INVOICE_STYLE[s] || INVOICE_STYLE.draft,
                    };
                  })}
                />
              )}
            </Section>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-green/25 bg-green/5 p-4">
              <div className="text-[.68rem] font-bold uppercase tracking-wider text-green">Économie du projet</div>
              <dl className="mt-2.5 flex flex-col gap-2 text-[.82rem]">
                <Row label="Budget prévu" value={formatFcfa(p.budget)} />
                <Row label="Facturé" value={formatFcfa(invoiced)} />
                <Row label="Encaissé" value={formatFcfa(cashed)} tone="green" />
                {p.budget > 0 && (
                  <Row
                    label="Reste à facturer"
                    value={formatFcfa(Math.max(0, p.budget - invoiced))}
                    tone={p.budget - invoiced > 0 ? "amber" : undefined}
                  />
                )}
              </dl>
            </div>

            <div className={`${card} p-4`}>
              <h3 className="mb-2.5 font-display text-[.9rem] font-extrabold text-gray-900 dark:text-white">
                Historique des modifications
              </h3>
              {detail.events.length === 0 ? (
                <p className="py-2 text-[.78rem] text-gray-400">Aucun évènement enregistré.</p>
              ) : (
                <ol className="flex flex-col gap-2.5">
                  {detail.events.map((e) => (
                    <li key={e.id} className="text-[.76rem] leading-snug">
                      <div className="text-gray-700 dark:text-gray-300">{e.message}</div>
                      <div className="text-[.68rem] text-gray-400">{timeAgo(e.created_at)}</div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ===== Liste ===== */
  const counts = {
    all: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    planned: projects.filter((p) => p.status === "planned").length,
    paused: projects.filter((p) => p.status === "paused").length,
    done: projects.filter((p) => p.status === "done").length,
  };

  return (
    <div className="mx-auto max-w-[980px]">
      {confirmNode}
      <PageHead
        title="Projets"
        count={`${projects.length} projet${projects.length > 1 ? "s" : ""} · ${counts.active} en cours`}
        action="+ Nouveau projet"
        onAction={openNew}
      />

      {projects.length === 0 ? (
        <Empty
          icon="📁"
          title="Aucun projet pour l'instant"
          sub="Créez un projet pour suivre une mission de bout en bout. Un projet s'ouvre aussi tout seul dès qu'un client accepte un devis."
          cta="+ Créer un projet"
          onCta={openNew}
        />
      ) : (
        <>
          <FilterBar
            query={query}
            setQuery={setQuery}
            placeholder="Rechercher un projet, un client…"
            active={filter}
            setActive={setFilter}
            filters={[
              { value: "all", label: "Tous", count: counts.all },
              { value: "active", label: "En cours", count: counts.active },
              { value: "planned", label: "Planifiés", count: counts.planned },
              { value: "paused", label: "En pause", count: counts.paused },
              { value: "done", label: "Terminés", count: counts.done },
            ]}
          />

          {filtered.length === 0 ? (
            <div className={`${card} px-6 py-10 text-center`}>
              <p className="text-[.86rem] text-gray-500">Aucun projet ne correspond à cette recherche.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((p) => {
                const left = daysUntil(p.due_date);
                const late = left != null && left < 0 && p.status === "active";
                return (
                  <button
                    key={p.id}
                    onClick={() => openDetail(p.id)}
                    className={`${card} p-4 text-left transition hover:border-green/40 hover:shadow`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green/10 text-[1.1rem]">
                        📁
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-[.95rem] font-extrabold text-gray-900 dark:text-white">
                            {p.name}
                          </span>
                          <Badge cls={PROJECT_STYLE[p.status] || PROJECT_STYLE.planned}>
                            {PROJECT_LABELS[p.status] || p.status}
                          </Badge>
                          {late && <Badge cls="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">En retard</Badge>}
                        </div>
                        <div className="truncate text-[.78rem] text-gray-500">
                          {p.pro_clients?.company || p.pro_clients?.name || "Sans client"}
                          {p.due_date ? ` · livraison ${formatDate(p.due_date)}` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-[.95rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                          {formatFcfa(p.budget)}
                        </div>
                        <div className="text-[.7rem] text-gray-400">{p.progress} %</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={p.progress} tone={p.status === "paused" ? "amber" : "green"} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ============================ Sous-composants ============================ */

const btnGhost =
  "rounded-xl border border-gray-200 px-3.5 py-2 text-[.8rem] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5";

function Meta({ label, value, tone }: { label: string; value: string; tone?: "red" }) {
  return (
    <div>
      <div className="text-[.68rem] font-bold uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`font-semibold ${tone === "red" ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-gray-200"}`}>
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "green" | "amber" }) {
  const color =
    tone === "green" ? "text-green" : tone === "amber" ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white";
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-600 dark:text-gray-400">{label}</dt>
      <dd className={`font-mono font-extrabold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

function LinkedRows({
  rows,
}: { rows: { id: string; title: string; sub: string; amount: number; badge: string; cls: string }[] }) {
  return (
    <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/10">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-[.86rem] font-bold text-gray-900 dark:text-white">{r.title}</span>
              <Badge cls={r.cls}>{r.badge}</Badge>
            </div>
            {r.sub && <div className="truncate text-[.72rem] text-gray-500">{r.sub}</div>}
          </div>
          <span className="shrink-0 font-mono text-[.85rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
            {formatFcfa(r.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

function TaskEditor({
  tasks, setTasks, value, setValue,
}: { tasks: Task[]; setTasks: (t: Task[]) => void; value: string; setValue: (v: string) => void }) {
  function add() {
    const label = value.trim();
    if (!label) return;
    setTasks([...tasks, { label, done: false }]);
    setValue("");
  }

  return (
    <>
      {tasks.length > 0 && (
        <ul className="mb-3 flex flex-col gap-1">
          {tasks.map((t, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-gray-50 dark:hover:bg-white/5">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => setTasks(tasks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
                className="h-4 w-4 shrink-0 accent-green"
              />
              <span className={`flex-1 text-[.85rem] ${t.done ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"}`}>
                {t.label}
              </span>
              <button
                type="button"
                aria-label="Retirer la tâche"
                onClick={() => setTasks(tasks.filter((_, j) => j !== i))}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-brand-red dark:hover:bg-red-500/10"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          className={`${input} flex-1`}
          placeholder="Ex : Livrer les 3 propositions de logo"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(); }
          }}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-xl border border-dashed border-green/40 px-4 text-[.8rem] font-bold text-green transition hover:bg-green/5"
        >
          Ajouter
        </button>
      </div>
    </>
  );
}

/** Pièces jointes : envoi direct navigateur → Supabase Storage. */
function DocumentsSection({
  docs, busy, toast, onChange,
}: {
  docs: { name: string; url: string; size?: number }[];
  busy: boolean;
  toast: Toast;
  onChange: (next: { name: string; url: string; size?: number }[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_DOC_BYTES) return toast("⚠ Fichier trop lourd (max 10 Mo).");

    setUploading(true);
    try {
      const doc = await uploadProDocument(file);
      onChange([...docs, doc]);
      toast("✓ Document joint");
    } catch (err: any) {
      toast("⚠ " + (err?.message || "Envoi impossible"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Section icon="📎" title="Documents du projet">
      {docs.length === 0 ? (
        <p className="py-2 text-[.82rem] text-gray-400">
          Aucun document. Joignez le contrat, le brief ou un livrable (PDF, image, Word, Excel — 10 Mo max).
        </p>
      ) : (
        <div className="mb-3 flex flex-col divide-y divide-gray-100 dark:divide-white/10">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gray-100 text-[.9rem] dark:bg-white/10">
                📄
              </span>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-[.85rem] font-semibold text-gray-800 transition hover:text-green dark:text-gray-200"
              >
                {d.name}
                {d.size ? (
                  <span className="ml-2 text-[.72rem] font-normal text-gray-400">
                    {(d.size / 1024 / 1024).toFixed(1)} Mo
                  </span>
                ) : null}
              </a>
              <button
                type="button"
                aria-label="Retirer le document"
                disabled={busy}
                onClick={() => onChange(docs.filter((_, j) => j !== i))}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-brand-red disabled:opacity-50 dark:hover:bg-red-500/10"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
        onChange={onPick}
      />
      <button
        type="button"
        disabled={uploading || busy}
        onClick={() => fileRef.current?.click()}
        className="rounded-lg border border-dashed border-green/40 px-3.5 py-2 text-[.8rem] font-bold text-green transition hover:bg-green/5 disabled:opacity-50"
      >
        {uploading ? "Envoi en cours…" : "📎 Joindre un document"}
      </button>
    </Section>
  );
}
