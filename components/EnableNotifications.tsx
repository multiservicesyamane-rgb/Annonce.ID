"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function EnableNotifications() {
  const supabase = createClient();
  const [state, setState] = useState<"idle" | "on" | "loading" | "unsupported" | "denied">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "granted") setState("on");
    else if (Notification.permission === "denied") setState("denied");
  }, []);

  async function enable() {
    setState("loading");
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState("denied"); return; }
      const reg = await navigator.serviceWorker.ready;
      const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
      if (!pub) { setMsg("Clé push manquante."); setState("idle"); return; }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(pub) });
      const json: any = sub.toJSON();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMsg("Connectez-vous d'abord."); setState("idle"); return; }
      await supabase.from("push_subscriptions").upsert(
        { user_id: user.id, endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        { onConflict: "endpoint" }
      );
      setState("on");
      setMsg("✅ Notifications activées sur cet appareil !");
      fetch("/api/push/test", { method: "POST" }).catch(() => {});
    } catch (e: any) {
      setMsg("Erreur : " + (e?.message || "réessayez"));
      setState("idle");
    }
  }

  if (state === "unsupported") return null;

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/[0.08] dark:to-purple-500/[0.04] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[1.3rem]">🔔</span>
        <h3 className="font-display text-[.98rem] font-extrabold text-gray-900 dark:text-white">Notifications téléphone</h3>
      </div>
      <p className="text-[.78rem] text-gray-500 dark:text-white/60 mb-3">
        Soyez alerté en temps réel : nouveaux messages, annonce vendue, bonnes affaires — même quand le site est fermé.
      </p>
      {state === "on" ? (
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/15 px-3.5 py-2 text-[.82rem] font-bold text-green-600 dark:text-green-400">✓ Activées sur cet appareil</div>
      ) : state === "denied" ? (
        <p className="text-[.78rem] font-semibold text-amber-600 dark:text-amber-400">⚠️ Notifications bloquées. Autorisez-les dans les réglages du navigateur, puis rechargez.</p>
      ) : (
        <button onClick={enable} disabled={state === "loading"} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#A855F7] px-4 py-2.5 text-[.85rem] font-extrabold text-white shadow-md shadow-purple-500/20 transition hover:scale-[1.02] disabled:opacity-60">
          {state === "loading" ? "⏳ Activation…" : "🔔 Activer les notifications"}
        </button>
      )}
      {msg && <p className="mt-2 text-[.74rem] text-gray-500 dark:text-white/55">{msg}</p>}
    </div>
  );
}
