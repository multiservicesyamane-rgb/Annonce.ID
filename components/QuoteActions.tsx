"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Boutons d'action du devis public : accepter, refuser, poser une question.
 * Le client n'a aucun compte : seul le jeton du lien fait autorité, et la
 * décision est vérifiée côté serveur.
 *
 * C'est la seule page de Wanteermako que voit le client d'un prestataire, et
 * la plus consultée du produit : chaque devis envoyé est une démonstration de
 * l'outil auprès de quelqu'un qui ne le connaît pas. D'où trois partis pris.
 *
 * 1. Sur téléphone, une barre fixe en bas porte le total et « Accepter ». Un
 *    devis détaillé fait plusieurs écrans de haut : sans elle, le geste attendu
 *    n'existe qu'après avoir tout fait défiler, là où le pouce ne va pas.
 * 2. L'état vit ici et nulle part ailleurs — la barre fixe et les boutons de
 *    bas de page sont deux vues du même `state`, jamais deux composants qui
 *    pourraient se contredire.
 * 3. Après acceptation, on dit ce qui se passe ensuite. Un écran qui se
 *    contente de « c'est accepté » laisse le client sans savoir s'il doit
 *    payer, rappeler, ou attendre.
 */
export default function QuoteActions({
  token,
  status,
  sellerPhone,
  title,
  total,
}: {
  token: string;
  status: string;
  sellerPhone: string;
  title: string;
  /** Total formaté, repris dans la barre fixe : le montant ne se devine pas. */
  total?: string;
}) {
  const [state, setState] = useState(status);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const viewSent = useRef(false);
  const bloc = useRef<HTMLDivElement>(null);

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
      // Accepté depuis la barre fixe, le client est en bas de page : la
      // confirmation, elle, s'affiche au milieu du document. Sans ce
      // défilement, il ne verrait rien se passer.
      requestAnimationFrame(() => {
        bloc.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
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
      <div ref={bloc} className="mt-5">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-500/25 dark:bg-emerald-900/15">
          <div className="text-[1.4rem]" aria-hidden="true">✅</div>
          <div className="mt-1 font-extrabold text-emerald-800 dark:text-emerald-300">Devis accepté</div>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[.82rem] leading-relaxed text-emerald-700 dark:text-emerald-400">
            Le prestataire vient d&apos;être prévenu. Il vous recontacte pour convenir
            de la suite, et vous recevrez une facture pour ce montant. Rien n&apos;est
            à régler tout de suite.
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
        <Signature />
      </div>
    );
  }

  if (state === "refused") {
    return (
      <div ref={bloc} className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
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
    <div ref={bloc} className="mt-5 flex flex-col gap-2">
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

      <Signature />

      {/* Barre fixe, téléphone seulement : le montant et le geste restent sous
          le pouce, quelle que soit la longueur du devis. La page réserve la
          hauteur correspondante (pb-28) pour ne rien masquer. */}
      <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-dark-900/95 sm:hidden">
        <div className="mx-auto flex max-w-[620px] items-center gap-3">
          {total && (
            <div className="min-w-0 shrink-0">
              <div className="text-[.6rem] font-bold uppercase tracking-[.06em] text-gray-400">Total</div>
              <div className="font-mono text-[.95rem] font-extrabold tabular-nums text-gray-900 dark:text-white">
                {total}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => send("accept")}
            disabled={!!busy}
            className="ml-auto flex-1 rounded-xl bg-green px-4 py-3 text-[.9rem] font-extrabold text-white shadow-lg transition active:scale-[.98] disabled:opacity-50"
          >
            {busy === "accept" ? "Envoi…" : "Accepter le devis"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * La seule mention de Wanteermako sur la page.
 *
 * Le client vient de voir l'outil fonctionner de bout en bout — c'est le
 * meilleur moment pour lui en parler, et le seul endroit où le produit se
 * recommande tout seul. Discret par construction : une ligne, pas de bouton,
 * jamais au-dessus de la décision qu'il est venu prendre.
 */
function Signature() {
  return (
    <p className="mt-4 text-center text-[.72rem] leading-relaxed text-gray-400">
      Devis établi avec Wanteermako ·{" "}
      <a href="/espace-pro" className="font-semibold underline underline-offset-2 hover:text-green">
        faites les vôtres gratuitement
      </a>
    </p>
  );
}
