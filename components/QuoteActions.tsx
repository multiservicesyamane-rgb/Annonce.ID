"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Boutons d'action du devis public : accepter, refuser, poser une question.
 * Le client n'a aucun compte : seul le jeton du lien fait autorité, et la
 * décision est vérifiée côté serveur.
 */
export default function QuoteActions({
  token,
  status,
  sellerPhone,
  title,
}: {
  token: string;
  status: string;
  sellerPhone: string;
  title: string;
}) {
  const [state, setState] = useState(status);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const viewSent = useRef(false);

  // Accusé de lecture : le prestataire voit que son devis a été ouvert, même si
  // le client ne répond pas tout de suite. Envoyé une seule fois, et sans
  // bloquer l'affichage — un échec ici ne doit rien changer pour le client.
  useEffect(() => {
    if (viewSent.current || status !== "sent") return;
    viewSent.current = true;
    fetch("/api/pro/quote-public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view", token }),
    }).catch(() => {});
  }, [status, token]);

  async function send(action: "accept" | "refuse") {
    setBusy(action);
    setMsg(null);
    try {
      const res = await fetch("/api/pro/quote-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, token }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(d.error || "Action impossible.");
        return;
      }
      setState(action === "accept" ? "accepted" : "refused");
    } catch {
      setMsg("Connexion impossible. Réessayez.");
    } finally {
      setBusy("");
    }
  }

  const waHref = (() => {
    let clean = String(sellerPhone || "").replace(/[^0-9]/g, "");
    if (!clean) return null;
    if (clean.length === 9 && /^[73]/.test(clean)) clean = `221${clean}`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(`Bonjour, au sujet du devis « ${title} » :`)}`;
  })();

  if (state === "accepted") {
    return (
      <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-500/25 dark:bg-green-900/15">
        <div className="text-[1.4rem]">✅</div>
        <div className="mt-1 font-extrabold text-green-800 dark:text-green-300">Devis accepté</div>
        <p className="mt-1 text-[.82rem] text-green-700 dark:text-green-400">
          Le prestataire vient d&apos;être prévenu. Il vous recontacte pour la suite.
        </p>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-xl bg-[#25D366] px-5 py-2.5 text-[.85rem] font-bold text-white"
          >
            Écrire sur WhatsApp
          </a>
        )}
      </div>
    );
  }

  if (state === "refused") {
    return (
      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
        <p className="text-[.85rem] text-gray-600 dark:text-gray-300">
          Vous avez décliné ce devis. Vous pouvez toujours contacter le prestataire.
        </p>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-xl border border-gray-300 px-5 py-2.5 text-[.85rem] font-bold text-gray-700 dark:border-white/20 dark:text-white"
          >
            Poser une question
          </a>
        )}
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
        <p className="text-[.85rem] text-gray-600 dark:text-gray-300">
          La durée de validité de ce devis est dépassée. Contactez le prestataire pour le faire réactualiser.
        </p>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-xl bg-[#25D366] px-5 py-2.5 text-[.85rem] font-bold text-white"
          >
            Écrire sur WhatsApp
          </a>
        )}
      </div>
    );
  }

  // « sent » et « viewed » sont tous deux répondables : le second signifie
  // simplement que le client a déjà ouvert le lien une première fois.
  if (state !== "sent" && state !== "viewed") {
    return (
      <p className="mt-5 rounded-xl bg-gray-50 p-3 text-center text-[.82rem] text-gray-500 dark:bg-white/5">
        Ce devis n&apos;est pas encore disponible.
      </p>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => send("accept")}
        disabled={!!busy}
        className="w-full rounded-xl bg-green px-5 py-3 text-[.92rem] font-extrabold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
      >
        {busy === "accept" ? "Envoi…" : "Accepter le devis"}
      </button>

      <div className="flex gap-2">
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-center text-[.82rem] font-bold text-gray-700 transition hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
          >
            Poser une question
          </a>
        )}
        <button
          type="button"
          onClick={() => send("refuse")}
          disabled={!!busy}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-[.82rem] font-semibold text-gray-500 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/5"
        >
          {busy === "refuse" ? "…" : "Décliner"}
        </button>
      </div>

      <a
        href={`/devis/${token}/imprimer`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-[.78rem] font-bold text-gray-500 underline-offset-2 transition hover:text-green hover:underline"
      >
        ⬇ Télécharger le PDF
      </a>

      {msg && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-[.78rem] text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {msg}
        </p>
      )}
    </div>
  );
}
