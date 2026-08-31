"use client";

import { useEffect, useRef, useState } from "react";
import A4Preview from "./A4Preview";
import PrintableDocument, { type PrintDoc, type PrintParty } from "./PrintableDocument";

/**
 * Page d'un devis ou d'une facture, avec sa barre d'actions.
 *
 * ── Un PDF, au format A4 ────────────────────────────────────────────────
 * Le bouton ne comptait d'abord que sur « Imprimer → Enregistrer au format
 * PDF » du navigateur. Ce pari ne tient pas pour le public visé :
 * `window.print()` ne fait RIEN dans les navigateurs intégrés (WhatsApp,
 * Facebook) — par lesquels arrivent justement la plupart des destinataires —
 * ni dans plusieurs WebView Android. Il a ensuite produit une image, qui se
 * téléchargeait partout mais n'est pas une pièce présentable : un devis
 * s'archive, se joint à un dossier, s'imprime — c'est un PDF qu'on attend.
 *
 * Le PDF est donc fabriqué ICI, dans le navigateur : aucune fonction
 * serveur (trop limitée pour un moteur de rendu), et ça marche dans les
 * navigateurs intégrés puisqu'il n'y a ni impression ni téléchargement
 * distant — juste un Blob.
 *
 * Chaque page mesure exactement 210 × 297 mm. La feuille d'A4Preview fait
 * toujours un multiple entier de 1123 px (= 297 mm à 96 dpi) : le document
 * se découpe donc en pages pleines, jamais sur une coupure bâtarde.
 *
 * Le contenu de la page est une image de la feuille, pas du texte
 * sélectionnable — c'est le prix à payer pour que le PDF soit au pixel près
 * ce que montrent l'aperçu et l'imprimante, sans réécrire toute la mise en
 * page dans jsPDF (deux mises en page à maintenir = deux qui divergent).
 *
 * ── Pourquoi une iframe cachée ───────────────────────────────────────────
 * La capture doit produire une page A4, pas ce que l'écran affiche. Or le
 * document choisit sa mise en page avec des media queries, qui lisent la
 * largeur de la FENÊTRE : capturé depuis un téléphone, il sortirait en
 * version mobile empilée. On capture donc la feuille rendue dans l'iframe de
 * 794 px d'A4Preview, hors champ. Vérifié : 794 × 1123 px en sortie.
 */

/** Page A4 en millimètres — l'unité de travail de jsPDF ici. */
const A4_W = 210;
const A4_H = 297;
/** Hauteur d'une page dans la feuille capturée (297 mm à 96 dpi). */
const PAGE_PX = 1123;
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
      const probe = new File(["x"], "x.pdf", { type: "application/pdf" });
      setCanShare(!!navigator.canShare?.({ files: [probe] }));
    } catch {
      setCanShare(false);
    }
  }, []);

  const label = doc.kind === "devis" ? "devis" : "facture";
  const filename = `${label}-${(doc.number || "sans-numero").replace(/[^\w-]+/g, "-")}.pdf`;

  /** Rend la feuille A4 de l'iframe en fichier PDF, une page A4 par page. */
  async function render(): Promise<File | null> {
    const frame = captureRef.current?.querySelector("iframe");
    const node = frame?.contentDocument?.querySelector("#a4-mount > div") as HTMLElement | null;
    if (!node) return null;

    const { toJpeg } = await import("html-to-image");
    // `pixelRatio: 2` donne ~190 points par pouce une fois ramené à 210 mm :
    // net à l'écran comme sur papier, sans le poids d'un PNG sans perte —
    // l'audience est en 4G, et le fichier passe souvent par WhatsApp.
    const options = { quality: 0.98, pixelRatio: 2, backgroundColor: "#ffffff" };
    // Double passe : la première amorce le chargement du logo, de la signature
    // et du cachet, que la seconde retrouve en cache. Sans elle, ces images
    // manquent une fois sur deux dans le fichier produit.
    await toJpeg(node, options);
    const image = await toJpeg(node, options);

    // A4Preview impose déjà une hauteur multiple de PAGE_PX : l'arrondi ne
    // rattrape qu'une éventuelle demi-décimale de mesure, il n'invente pas
    // une page. Le minimum à 1 couvre le cas d'une feuille pas encore mesurée.
    const pages = Math.max(1, Math.round(node.offsetHeight / PAGE_PX));

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    for (let i = 0; i < pages; i++) {
      if (i > 0) pdf.addPage();
      // L'image entière est posée sur chaque page, remontée d'une hauteur de
      // page à chaque tour : seule la tranche voulue tombe dans le format, le
      // reste déborde et le lecteur PDF le rogne. L'alias « doc » est
      // essentiel — sans lui, jsPDF réembarquerait le fichier une fois par
      // page et un devis de trois pages pèserait trois fois trop lourd.
      pdf.addImage(image, "JPEG", 0, -i * A4_H, A4_W, pages * A4_H, "doc");
    }

    // `output("blob")` évite de repasser par une URL de données : la CSP du
    // site autorise `connect-src 'self' https: wss:` sans `data:` (voir
    // next.config.js), donc tout `fetch(dataUrl)` échouerait ici.
    return new File([pdf.output("blob")], filename, { type: "application/pdf" });
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
                {busy ? "…" : (
                  <>
                    ⬇ <span className="hidden sm:inline">Télécharger le </span>PDF
                  </>
                )}
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
