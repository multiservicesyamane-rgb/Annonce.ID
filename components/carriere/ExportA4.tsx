"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import A4Preview from "@/components/pro/A4Preview";
import { ActionBar, BarreOutils, OutlineBtn, PrimaryBtn, ZOOMS } from "./ui";

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
 *
 * ── Le verrou du plan gratuit ────────────────────────────────────────────
 * Sur un compte gratuit, ce premier telechargement TERMINE le document : il
 * ne sera plus modifiable. On le dit AVANT, et on demande confirmation.
 *
 * Ce n'est pas une politesse : sans elle, quelqu'un qui telecharge pour
 * verifier son PDF, y voit une faute de frappe et revient la corriger
 * trouverait porte close — pour un geste que rien ne l'avertissait d'etre
 * definitif. Un produit qui piege son utilisateur au premier essai ne le
 * convertit pas, il le perd.
 */

const A4_W = 210;
const A4_H = 297;
const PAGE_PX = 1123;

export default function ExportA4({
  filename,
  title,
  children,
  footer,
  aside,
  outils,
  panneau,
  onFermerPanneau,
  avertissement,
  onTelecharge,
}: {
  filename: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * Texte de l'avertissement montre AVANT le premier telechargement.
   * `null` quand il n'y a rien a avertir : abonne, ou document deja fini.
   */
  avertissement?: string | null;
  /** Appele apres un telechargement ou un partage REUSSI. */
  onTelecharge?: () => void;
  /** Boutons propres au document (modele, couleur, police), a gauche de la barre. */
  outils?: ReactNode;
  /** Panneau deplie sous la barre par l'un de ces boutons. */
  panneau?: ReactNode;
  /** Referme le panneau — appele par le clic a cote. */
  onFermerPanneau?: () => void;
  /**
   * Ce qui accompagne les boutons sur grand ecran — nom du modele, rappel
   * d'enregistrement. Sans lui, la colonne de droite n'etait qu'une paire de
   * boutons flottant au milieu de 900 px de vide a cote d'une page A4.
   * Masque au telephone, ou les actions vivent dans la barre du bas.
   */
  aside?: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // Index dans ZOOMS. On demarre a 1 — la page entiere — et non a un
  // grossissement : la premiere chose a verifier sur un CV, c'est qu'il tient
  // sur une page.
  const [iZoom, setIZoom] = useState(1);
  const zoom = ZOOMS[iZoom];
  /** Echelle reellement appliquee, pour que la barre dise la verite. */
  const [echelle, setEchelle] = useState<number | undefined>(undefined);
  // Geste en attente de confirmation. `null` = rien a confirmer. Il porte
  // l'action demandee pour la rejouer telle quelle une fois l'accord donne :
  // confirmer un partage ne doit pas declencher un telechargement.
  const [aConfirmer, setAConfirmer] = useState<"pdf" | "share" | "shareFallback" | null>(null);

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
      // Apres le succes, jamais avant : verrouiller un document dont le PDF a
      // echoue laisserait quelqu'un sans fichier ET sans droit de le refaire.
      onTelecharge?.();
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
      onTelecharge?.();
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
      onTelecharge?.();
    } catch (e) {
      console.error("[carriere] partage de repli echoue", e);
      setMsg("Telechargement impossible. Reessaie, ou fais une capture d'ecran.");
    } finally {
      setBusy(null);
    }
  }

  /** Rejoue le geste demande une fois qu'il n'y a plus rien a confirmer. */
  function lancer(geste: "pdf" | "share" | "shareFallback") {
    if (geste === "pdf") return onPdf();
    if (geste === "share") return onShare();
    return onShareFallback();
  }

  /**
   * Porte d'entree de tous les boutons d'export.
   *
   * Sans avertissement — abonne, ou document deja fini — le geste part
   * directement : personne n'a envie d'une boite de dialogue a chaque
   * telechargement.
   */
  function demander(geste: "pdf" | "share" | "shareFallback") {
    if (avertissement) {
      setAConfirmer(geste);
      return;
    }
    lancer(geste);
  }

  const boutons = (
    <>
      <PrimaryBtn onClick={() => demander("pdf")} disabled={busy !== null}>
        <span aria-hidden="true">⬇</span>
        {busy === "pdf" ? "Preparation…" : "Telecharger le PDF"}
      </PrimaryBtn>

      <OutlineBtn onClick={() => demander(canShare ? "share" : "shareFallback")} disabled={busy !== null}>
        <span aria-hidden="true">↗</span>
        {busy === "share" ? "Preparation…" : "Partager"}
      </OutlineBtn>
    </>
  );

  /**
   * L'avertissement du plan gratuit, avant le premier telechargement.
   *
   * Une boite posee par-dessus l'ecran, et non un bandeau : c'est le seul
   * moment ou une interruption se justifie, parce que le geste suivant est
   * irreversible. Le bouton de sortie est le premier et le plus visible —
   * « verifier encore » doit rester plus facile que « terminer ».
   */
  const confirmation = aConfirmer && (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verrou-titre"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-dark-800">
        <h2 id="verrou-titre" className="text-[1.05rem] font-extrabold text-gray-900 dark:text-white">
          <span aria-hidden="true">🔒</span> Derniere verification
        </h2>
        <p className="mt-2 text-[.9rem] leading-relaxed text-gray-600 dark:text-gray-300">{avertissement}</p>

        <div className="mt-5 space-y-3">
          <OutlineBtn onClick={() => setAConfirmer(null)}>
            <span aria-hidden="true">←</span> Verifier encore
          </OutlineBtn>
          <PrimaryBtn
            onClick={() => {
              const geste = aConfirmer;
              setAConfirmer(null);
              lancer(geste);
            }}
          >
            <span aria-hidden="true">⬇</span> C'est bon, telecharger
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );

  return (
    // Sur grand ecran, la feuille et ses actions sont cote a cote : les
    // boutons restent visibles sans avoir a derouler toute la page A4, qui
    // fait a elle seule plus d'un ecran de haut.
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-8">
      <div className="mb-5 lg:mb-0">
        <BarreOutils
          outils={outils}
          panneau={panneau}
          onFermer={onFermerPanneau ?? (() => {})}
          iZoom={iZoom}
          setIZoom={setIZoom}
          echelle={echelle}
        >
          <div ref={hostRef}>
            <A4Preview zoom={zoom} ajusterHauteur onEchelle={setEchelle}>
              {children}
            </A4Preview>
          </div>
        </BarreOutils>
      </div>

      <div className="lg:sticky lg:top-24">
        {footer}

        {/* Au telephone, les actions rejoignent la barre fixe du bas : sans
            cela il faudrait derouler une page A4 entiere — 1 123 px — avant
            d'atteindre « Telecharger ». Sur grand ecran elles deviennent un
            vrai panneau, pose a cote de la feuille. */}
        <div className="lg:hidden">
          <ActionBar>{boutons}</ActionBar>
        </div>

        <div className="mt-5 hidden lg:mt-0 lg:block">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] dark:border-white/10 dark:bg-dark-800 dark:shadow-[0_0_0_1px_rgba(99,102,241,.12),0_8px_30px_-14px_rgba(99,102,241,.5)]">
            {aside}
            <div className="space-y-3">{boutons}</div>
          </div>
        </div>

        {msg && (
          <p role="status" aria-live="polite" className="mt-3 text-center text-[.85rem] leading-relaxed text-gray-500">
            {msg}
          </p>
        )}
      </div>

      {confirmation}
    </div>
  );
}
