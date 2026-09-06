"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import A4Preview from "@/components/pro/A4Preview";
import { ActionBar, OutlineBtn, PrimaryBtn } from "./ui";

/**
 * Apercu A4 d'un document de carriere, et son export.
 *
 * ── Le PDF ───────────────────────────────────────────────────────────────
 * Meme mecanique que les devis et factures (components/pro/DocumentPage) :
 * la feuille est rendue dans l'iframe de 794 px d'A4Preview, capturee en
 * image, puis posee page par page dans un PDF A4. Fabriquer le PDF dans le
 * navigateur est ce qui le fait marcher dans les navigateurs integres de
 * WhatsApp et Facebook, ou `window.print()` ne fait rien.
 *
 * Difference avec DocumentPage : la feuille capturee est celle que
 * l'utilisateur regarde, pas une copie hors champ. L'ecran « Apercu de ton
 * CV » montre justement la page en grand — inutile d'en rendre deux.
 *
 * ── Le partage WhatsApp ──────────────────────────────────────────────────
 * Un lien wa.me ne sait PAS joindre un fichier, il n'envoie que du texte.
 * Le seul moyen d'envoyer le PDF lui-meme est le partage natif de l'appareil
 * (navigator.share avec un fichier), disponible sur Chrome Android mais pas
 * partout. Quand il manque, le bouton telecharge et dit ou retrouver le
 * fichier — plutot que de promettre un envoi qui n'aura pas lieu.
 */

const A4_W = 210;
const A4_H = 297;
const PAGE_PX = 1123;

export default function ExportA4({
  filename,
  title,
  children,
  footer,
}: {
  filename: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Le partage de fichiers n'existe qu'au navigateur, et pas sur tous : on ne
  // montre le bouton « natif » que la ou il fonctionne reellement.
  useEffect(() => {
    try {
      const probe = new File(["x"], "x.pdf", { type: "application/pdf" });
      setCanShare(!!navigator.canShare?.({ files: [probe] }));
    } catch {
      setCanShare(false);
    }
  }, []);

  async function render(): Promise<File | null> {
    const frame = hostRef.current?.querySelector("iframe");
    const node = frame?.contentDocument?.querySelector("#a4-mount > div") as HTMLElement | null;
    if (!node) return null;

    const { toJpeg } = await import("html-to-image");
    // pixelRatio 2 : ~190 points par pouce une fois ramene a 210 mm. Net a
    // l'ecran comme sur papier, sans le poids d'un PNG — le fichier part
    // souvent par WhatsApp, sur une connexion 4G.
    const options = { quality: 0.98, pixelRatio: 2, backgroundColor: "#ffffff" };
    // Double passe : la premiere amorce le chargement des polices et images,
    // la seconde les retrouve en cache. Sans elle, elles manquent une fois
    // sur deux dans le fichier produit.
    await toJpeg(node, options);
    const image = await toJpeg(node, options);

    const pages = Math.max(1, Math.round(node.offsetHeight / PAGE_PX));
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    for (let i = 0; i < pages; i++) {
      if (i > 0) pdf.addPage();
      // L'image entiere est posee sur chaque page, remontee d'une hauteur a
      // chaque tour. L'alias « doc » evite que jsPDF reembarque le fichier
      // une fois par page.
      pdf.addImage(image, "JPEG", 0, -i * A4_H, A4_W, pages * A4_H, "doc");
    }
    return new File([pdf.output("blob")], filename, { type: "application/pdf" });
  }

  async function telecharger(): Promise<File | null> {
    const file = await render();
    if (!file) return null;
    // Une URL d'objet plutot qu'une URL de donnees : plusieurs navigateurs
    // mobiles refusent d'enregistrer une data: de plusieurs centaines de Ko.
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return file;
  }

  async function onPdf() {
    setBusy("pdf");
    setMsg(null);
    try {
      if (!(await telecharger())) throw new Error("feuille introuvable");
      setMsg("PDF enregistre dans tes telechargements.");
    } catch (e) {
      console.error("[carriere] PDF echoue", e);
      setMsg("Telechargement impossible. Reessaie, ou fais une capture d'ecran.");
    } finally {
      setBusy(null);
    }
  }

  async function onShare() {
    setBusy("share");
    setMsg(null);
    try {
      const file = await render();
      if (!file) throw new Error("feuille introuvable");
      await navigator.share({ files: [file], title });
    } catch (e) {
      // Refermer le panneau de partage n'est pas une erreur.
      if ((e as Error)?.name !== "AbortError") {
        console.error("[carriere] partage echoue", e);
        setMsg("Partage impossible. Utilise « Telecharger le PDF ».");
      }
    } finally {
      setBusy(null);
    }
  }

  /** Repli quand l'appareil ne sait pas partager un fichier. */
  async function onShareFallback() {
    setBusy("share");
    setMsg(null);
    try {
      if (!(await telecharger())) throw new Error("feuille introuvable");
      setMsg("Ton document est dans tes telechargements : ouvre WhatsApp, puis joins-le a ta conversation.");
    } catch (e) {
      console.error("[carriere] partage de repli echoue", e);
      setMsg("Telechargement impossible. Reessaie, ou fais une capture d'ecran.");
    } finally {
      setBusy(null);
    }
  }

  const boutons = (
    <>
      <PrimaryBtn onClick={onPdf} disabled={busy !== null}>
        <span aria-hidden="true">⬇</span>
        {busy === "pdf" ? "Preparation…" : "Telecharger le PDF"}
      </PrimaryBtn>

      <OutlineBtn onClick={canShare ? onShare : onShareFallback} disabled={busy !== null}>
        <span aria-hidden="true">↗</span>
        {busy === "share" ? "Preparation…" : "Partager"}
      </OutlineBtn>
    </>
  );

  return (
    // Sur grand ecran, la feuille et ses actions sont cote a cote : les
    // boutons restent visibles sans avoir a derouler toute la page A4, qui
    // fait a elle seule plus d'un ecran de haut.
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-8">
      <div ref={hostRef} className="mb-5 lg:mb-0">
        <A4Preview>{children}</A4Preview>
      </div>

      <div className="lg:sticky lg:top-24">
        {footer}

        {/* Au telephone, les actions rejoignent la barre fixe du bas : sans
            cela il faudrait derouler une page A4 entiere — 1 123 px — avant
            d'atteindre « Telecharger ». Sur grand ecran elles restent dans la
            colonne de droite, a cote de la feuille. */}
        <div className="lg:hidden">
          <ActionBar>{boutons}</ActionBar>
        </div>
        <div className="mt-5 hidden space-y-3 lg:mt-0 lg:block">{boutons}</div>

        {msg && (
          <p role="status" aria-live="polite" className="mt-3 text-center text-[.85rem] leading-relaxed text-gray-500">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
