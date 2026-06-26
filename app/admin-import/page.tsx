"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { OWNER_EMAILS } from "@/lib/owners";

type Result = { title: string; ok: boolean; id?: string; slug?: string; error?: string };

const SOURCES = [
  { key: "chariow", label: "Chariow" },
  { key: "aliexpress", label: "AliExpress" },
  { key: "amazon", label: "Amazon" },
  { key: "alibaba", label: "Alibaba" },
  { key: "jumia", label: "Jumia" },
  { key: "autre", label: "Autre site" },
];

const empty = {
  source: "chariow",
  title: "",
  price: "",
  image: "",
  category: "",
  location: "Livraison",
  external_url: "",
  description: "",
  featured: false,
};

export default function AdminImportPage() {
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [owner, setOwner] = useState(OWNER_EMAILS[0] || "");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("wmk_admin_pass");
    if (saved) { setPass(saved); setAuthed(true); }
  }, []);

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.title.trim() || !form.external_url.trim()) { show("⚠️ Titre et lien externe obligatoires"); return; }
    setBusy(true);
    try {
      const cat = CATEGORIES.find((c) => c.slug === form.category);
      const res = await fetch("/api/admin/import-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: pass,
          owner_email: owner,
          product: {
            ...form,
            category: cat?.name || "Autre",
            category_slug: form.category || "",
          },
        }),
      });
      const d = await res.json();
      if (!res.ok) { show("❌ " + (d.error || "Erreur")); setBusy(false); return; }
      const r: Result = d.results?.[0] || { title: form.title, ok: true };
      setResults((prev) => [r, ...prev]);
      if (r.ok) { show("✅ Produit importé !"); setForm({ ...empty, source: form.source }); }
      else show("❌ " + (r.error || "Erreur"));
    } catch (e: any) {
      show("❌ " + (e?.message || "Erreur réseau"));
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0D1117] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-[#161B22] p-6 shadow-sm">
          <h1 className="text-lg font-extrabold dark:text-white mb-1">🔒 Import produits — Admin</h1>
          <p className="text-[.8rem] text-gray-500 mb-4">Entre le mot de passe administrateur.</p>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && pass) { sessionStorage.setItem("wmk_admin_pass", pass); setAuthed(true); } }}
            placeholder="Mot de passe admin"
            className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-[#0D1117] px-3 py-2.5 text-sm dark:text-white"
          />
          <button
            onClick={() => { if (pass) { sessionStorage.setItem("wmk_admin_pass", pass); setAuthed(true); } }}
            className="btn btn-green w-full mt-3 py-2.5 font-bold"
          >
            Entrer
          </button>
        </div>
      </div>
    );
  }

  const input = "w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-[#0D1117] px-3 py-2.5 text-sm dark:text-white";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-extrabold dark:text-white">🛒 Importer un produit externe</h1>
          <Link href="/dashboard" className="text-[.8rem] text-green font-bold">← Dashboard</Link>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-[#161B22] p-5 shadow-sm flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[.75rem] font-bold text-gray-600 dark:text-white/70 mb-1">Site de vente</label>
              <select value={form.source} onChange={(e) => set("source", e.target.value)} className={input}>
                {SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[.75rem] font-bold text-gray-600 dark:text-white/70 mb-1">Catégorie</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={input}>
                <option value="">— Choisir —</option>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[.75rem] font-bold text-gray-600 dark:text-white/70 mb-1">Titre du produit *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex : Montre connectée Smart Watch" className={input} />
          </div>

          <div>
            <label className="block text-[.75rem] font-bold text-gray-600 dark:text-white/70 mb-1">Lien de vente (URL externe) *</label>
            <input value={form.external_url} onChange={(e) => set("external_url", e.target.value)} placeholder="https://chariow.com/... ou https://aliexpress.com/..." className={input} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[.75rem] font-bold text-gray-600 dark:text-white/70 mb-1">Prix (FCFA)</label>
              <input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Ex : 15000" className={input} />
            </div>
            <div>
              <label className="block text-[.75rem] font-bold text-gray-600 dark:text-white/70 mb-1">Lieu / Livraison</label>
              <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Ex : Livraison Dakar" className={input} />
            </div>
          </div>

          <div>
            <label className="block text-[.75rem] font-bold text-gray-600 dark:text-white/70 mb-1">Image (URL de la photo)</label>
            <input value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://...jpg" className={input} />
            {form.image && <img src={form.image} alt="" className="mt-2 h-24 w-24 rounded-lg object-cover border border-gray-200" />}
          </div>

          <div>
            <label className="block text-[.75rem] font-bold text-gray-600 dark:text-white/70 mb-1">Description (optionnel)</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Détails du produit..." className={input} />
          </div>

          <label className="flex items-center gap-2 text-[.85rem] dark:text-white/80">
            <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-green" />
            🔥 Mettre « À la Une » (affiché sur l'accueil)
          </label>

          <details className="text-[.78rem]">
            <summary className="cursor-pointer text-gray-500 dark:text-white/60 font-semibold">Compte propriétaire (avancé)</summary>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="email du compte propriétaire" className={`${input} mt-2`} />
            <p className="mt-1 text-gray-400">Le produit sera publié sous ce compte. Laisse par défaut si tu ne sais pas.</p>
          </details>

          <button onClick={submit} disabled={busy} className="btn btn-green w-full py-3 font-bold mt-1">
            {busy ? "Import en cours..." : "+ Importer le produit"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-5 rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-[#161B22] p-4">
            <h2 className="text-[.9rem] font-bold dark:text-white mb-2">Produits importés ({results.filter((r) => r.ok).length})</h2>
            <div className="flex flex-col gap-1.5">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-[.8rem] border-b border-gray-100 dark:border-dark-border py-1.5 last:border-0">
                  <span className="dark:text-white/80 truncate">{r.ok ? "✅" : "❌"} {r.title}</span>
                  {r.ok && r.slug
                    ? <Link href={`/annonce/${r.id}/${r.slug}`} target="_blank" className="text-green font-bold shrink-0 ml-2">Voir →</Link>
                    : <span className="text-red-500 text-[.7rem] shrink-0 ml-2">{r.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-[10px] bg-dark-900 px-5 py-2.5 text-[.88rem] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
