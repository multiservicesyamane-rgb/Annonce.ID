"use client";

import { useEffect, useRef, useState } from "react";
import A4Preview from "./A4Preview";
import PrintableDocument, { type PrintDoc, type PrintParty } from "./PrintableDocument";

/**
 * Page d'un devis ou d'une facture, avec sa barre d'actions.
 *
 * ── Pourquoi un téléchargement d'IMAGE ───────────────────────────────────
 * Il n'existait ici qu'un bouton « Imprimer », en comptant sur « Imprimer →
 * Enregistrer au format PDF » du navigateur. Ce pari ne tient pas pour le
 * public visé : `window.print()` ne fait RIEN dans les navigateurs intégrés
 * (WhatsApp, Facebook) — par lesquels arrivent justement la plupart des
 * destinataires — ni dans plusieurs WebView Android. L'utilisateur appuyait
 * sur un bouton qui promettait un PDF, et il ne se passait rien.
 *
 * Une image se télécharge partout, sans service d'impression installé, et
 * s'envoie sur WhatsApp en s'affichant directement dans la conversation —
 * là où un PDF demande une application pour l'ouvrir. Pour un artisan qui
 * envoie ses devis par WhatsApp, c'est le bon format.
 *
 * L'impression reste offerte : sur ordinateur c'est le meilleur chemin vers
 * un vrai PDF, et rien n'y empêche `window.print()`.
 *
 * ── Pourquoi une iframe cachée ───────────────────────────────────────────
 * La capture doit produire une page A4, pas ce que l'écran affiche. Or le
 * document choisit sa mise en page avec des media queries, qui lisent la
 * largeur de la FENÊTRE : capturé depuis un téléphone, il sortirait en
 * version mobile empilée. On capture donc la feuille rendue dans l'iframe de
 * 794 px d'A4Preview, hors champ. Vérifié : 794 × 1123 px en sortie.
 */
export default function DocumentPage({
  doc, seller, client, qr,
}: {
  doc: PrintDoc;
  seller: PrintParty;
  client: PrintParty | null;
  qr?: { svg: string; caption: string } | null;
}) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  // `window.print` et le partage de fichiers n'existent qu'au navigateur, et
  // le partage n'est pas offert partout : on ne montre le bouton que là où il
  // marche, plutôt que d'afficher une action qui échouera.
  useEffect(() => {
    setReady(true);
    try {
      const probe = new File(["x"], "x.jpg", { type: "image/jpeg" });
      setCanShare(!!navigator.canShare?.({ files: [probe] }));
    } catch {
      setCanShare(false);
    }
  }, []);

  const label = doc.kind === "devis" ? "devis" : "facture";
  const filename = `${label}-${(doc.number || "sans-numero").replace(/[^\w-]+/g, "-")}.jpg`;

  /**
   * Convertit l'URL de données produite par html-to-image en fichier.
   *
   * Décodage à la main plutôt que `fetch(dataUrl).blob()`, qui paraît plus
   * court mais échoue ici : la CSP du site autorise `connect-src 'self' https:
   * wss:` sans `data:` (voir next.config.js), donc le navigateur refuse la
   * requête — « Failed to fetch », et aucun fichier. Ajouter `data:` à la CSP
   * pour contourner reviendrait à ouvrir une porte pour une commodité.
   */
  function toFile(dataUrl: string): File {
    const [head, body] = dataUrl.split(",");
    const mime = head.match(/:(.*?);/)?.[1] || "image/jpeg";
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  }

  /** Rend la feuille A4 de l'iframe en fichier image. */
  async function render(): Promise<File | null> {
    const frame = captureRef.current?.querySelector("iframe");
    const node = frame?.contentDocument?.querySelector("#a4-mount > div") as HTMLElement | null;
    if (!node) return null;

    const { toJpeg } = await import("html-to-image");
    const options = { quality: 0.95, pixelRatio: 2, backgroundColor: "#ffffff" };
    // Double passe : la première amorce le chargement du logo, de la signature
    // et du cachet, que la seconde retrouve en cache. Sans elle, ces images
    // manquent une fois sur deux dans le fichier produit.
    await toJpeg(node, options);
    return toFile(await toJpeg(node, options));
  }

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const file = await render();
      if (!file) throw new Error("document introuvable");
      // Une URL d'objet plutôt que l'URL de données : plusieurs navigateurs
      // mobiles refusent d'enregistrer une data: de plusieurs centaines de Ko.
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error("[document] téléchargement échoué", e);
      setError("Téléchargement impossible. Utilisez « Imprimer », ou faites une capture d'écran.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    setBusy(true);
    setError(null);
    try {
      const file = await render();
      if (!file) throw new Error("document introuvable");
      await navigator.share({ files: [file], title: `${label} ${doc.number || ""}`.trim() });
    } catch (e) {
      // L'utilisateur qui referme le panneau de partage n'est pas une erreur.
      if ((e as Error)?.name !== "AbortError") {
        console.error("[document] partage échoué", e);
        setError("Partage impossible. Essayez « Télécharger ».");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Feuille A4 hors champ, uniquement pour la capture. */}
      <div
        ref={captureRef}
        aria-hidden="true"
        className="no-print pointer-events-none fixed top-0 opacity-0"
        style={{ left: -10000, width: 794 }}
      >
        <A4Preview>
          <PrintableDocument mode="preview" doc={doc} seller={seller} client={client} qr={qr} />
        </A4Preview>
      </div>

      <div className="doc-page px-3 py-4 sm:px-5 sm:py-8">
        <div className="mx-auto max-w-[820px]">
          {/* Barre collante : sur un document long consulté au téléphone, les
              actions restent atteignables sans remonter. */}
          <div className="no-print sticky top-2 z-10 mb-4 rounded-xl bg-white/95 p-2.5 shadow-md backdrop-blur sm:mb-5 sm:p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.history.back()}
                aria-label="Retour"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[1rem] text-gray-500 transition hover:bg-gray-100"
              >
                ‹
              </button>

              <span className="min-w-0 flex-1 truncate text-[.8rem] text-gray-500">
                {doc.number ? `${label} ${doc.number}` : `Votre ${label}`}
              </span>

              {canShare && (
                <button
                  onClick={share}
                  disabled={!ready || busy}
                  className="shrink-0 rounded-lg border-[1.5px] border-gray-300 px-3 py-2 text-[.83rem] font-bold text-gray-700 transition disabled:opacity-50"
                >
                  📤 <span className="hidden sm:inline">Envoyer</span>
                </button>
              )}

              <button
                onClick={download}
                disabled={!ready || busy}
                className="shrink-0 rounded-lg px-4 py-2 text-[.83rem] font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#4F46E5" }}
              >
                {busy ? "…" : "⬇ Télécharger"}
              </button>

              <button
                onClick={() => window.print()}
                disabled={!ready}
                aria-label="Imprimer"
                className="hidden shrink-0 rounded-lg border-[1.5px] border-gray-300 px-3 py-2 text-[.83rem] font-bold text-gray-700 transition disabled:opacity-50 sm:block"
              >
                🖨️ Imprimer
              </button>
            </div>

            {error && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[.76rem] leading-relaxed text-red-800">
                {error}
              </p>
            )}
          </div>

          <PrintableDocument doc={doc} seller={seller} client={client} qr={qr} />
        </div>
      </div>
    </>
  );
}
