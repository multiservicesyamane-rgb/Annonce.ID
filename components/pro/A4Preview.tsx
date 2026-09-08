"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Feuille A4 à l'échelle, pour prévisualiser un document pendant sa saisie.
 *
 * ── Pourquoi une iframe ──────────────────────────────────────────────────
 * Le document (voir PrintableDocument) choisit sa mise en page avec des
 * media queries : en dessous de 640 px il empile les prestations en blocs,
 * au-dessus il dresse le vrai tableau qui partira à l'imprimante. Une media
 * query lit la largeur de la FENÊTRE, pas celle du conteneur — donc un aperçu
 * posé dans une colonne de 500 px, ou ouvert sur un téléphone, afficherait la
 * version « mobile » alors qu'on veut justement voir la page A4.
 *
 * L'iframe donne au document sa propre fenêtre, large de 794 px : les media
 * queries s'y résolvent comme sur un écran d'ordinateur, quel que soit
 * l'appareil qui regarde. On recopie les feuilles de style de la page hôte
 * pour que Tailwind s'y applique, puis on met le tout à l'échelle.
 *
 * ── Dimensions ───────────────────────────────────────────────────────────
 * 96 dpi est l'unité de référence du navigateur pour les millimètres :
 * A4 = 210 × 297 mm = 794 × 1123 px, marge de 14 mm = 53 px — exactement la
 * règle `@page { size: A4; margin: 14mm }` du document imprimé. L'aperçu et
 * le papier ont donc la même largeur utile, au pixel près.
 */

const PAGE_W = 794;
const PAGE_H = 1123;
const MARGIN = 53;

export default function A4Preview({
  children,
  zoom = 1,
  ajusterHauteur = false,
  onEchelle,
}: {
  children: React.ReactNode;
  /**
   * Grossissement demandé, par-dessus l'échelle qui fait tenir la page dans
   * la colonne. 1 = la page entière est visible ; au-delà, elle déborde et le
   * conteneur défile — c'est le seul moyen de lire les petits caractères d'un
   * CV sur un téléphone, où la feuille est réduite à moins d'un tiers.
   */
  zoom?: number;
  /**
   * Faire tenir la page dans la HAUTEUR visible, en plus de la largeur.
   *
   * Sans cela, une colonne large donnait une échelle de 1 : la feuille faisait
   * ses 1 123 px et il fallait dérouler pour en voir le bas. Sur un écran
   * d'aperçu, dont le seul travail est de montrer le document, c'est raté —
   * on veut la page entière du premier coup d'œil.
   */
  ajusterHauteur?: boolean;
  /**
   * Échelle réellement appliquée, remontée à chaque mesure.
   *
   * La barre d'outils affichait le MULTIPLICATEUR de zoom : elle annonçait
   * « 100 % » sur une feuille réduite à 33 % par la place disponible. Un
   * chiffre faux est pire que pas de chiffre.
   */
  onEchelle?: (echelle: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [styled, setStyled] = useState(false);
  // 0 tant que la largeur disponible n'est pas connue : la feuille reste
  // masquée plutôt que de surgir à la mauvaise taille puis se recadrer.
  const [fit, setFit] = useState(0);
  const [pages, setPages] = useState(1);

  /* ---- Place disponible → facteur d'échelle ---- */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const parLargeur = Math.min(1, host.clientWidth / PAGE_W);
      if (!ajusterHauteur) {
        setFit(parLargeur);
        return;
      }
      // Hauteur restante entre le haut de la feuille et le bas de la fenêtre.
      // Mesurée à la position actuelle, sans écouter le défilement : une
      // échelle qui bougerait pendant qu'on fait défiler serait insupportable.
      const dispo = window.innerHeight - host.getBoundingClientRect().top - 24;
      const parHauteur = dispo / PAGE_H;

      // ── Page entière, ou page lisible ? ────────────────────────────────
      // Faire tenir un A4 entier dans la hauteur est une contrainte dure :
      // sur une fenêtre de 700 px, il reste ~420 px sous la barre d'outils,
      // soit 37 % — une vignette qu'on ne peut pas relire. C'est de la
      // géométrie, aucun réglage ne la contourne.
      //
      // Alors on choisit : tant que la page entière reste lisible, on la
      // montre en entier — c'est ce qu'on veut vérifier sur un CV, qu'il
      // tienne sur UNE page. En dessous, on prend la largeur et on laisse
      // dérouler : mieux vaut une feuille lisible qu'on fait défiler qu'une
      // page entière illisible.
      const LISIBLE = 0.55;
      setFit(parHauteur >= LISIBLE ? Math.min(parLargeur, parHauteur) : parLargeur);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ajusterHauteur]);

  // L'échelle réelle : celle qui fait tenir la page, multipliée par le zoom.
  // On mesure `fit` sur le conteneur SANS le zoom, sinon agrandir la feuille
  // élargirait le conteneur, qui réduirait `fit`, qui rétrécirait la feuille —
  // une boucle qui n'aurait jamais convergé.
  const scale = fit * zoom;

  // Remontée à l'affichage, jamais pendant le rendu : la barre d'outils la
  // stocke dans son état, et un `setState` appelé en plein rendu du parent
  // ferait boucler React.
  useEffect(() => {
    onEchelle?.(scale);
  }, [scale, onEchelle]);

  /* ---- Préparation de l'iframe ---- */
  const setup = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    // Idempotent : `about:blank` peut émettre « load » plusieurs fois selon
    // le navigateur, et on ne veut pas empiler deux jeux de styles.
    if (!doc || doc.getElementById("a4-mount")) return;

    const base = doc.createElement("style");
    base.textContent =
      "html,body{margin:0;padding:0;background:transparent;color-scheme:light;}";
    doc.head.appendChild(base);

    // Feuilles de style de la page hôte : sans elles, aucune classe Tailwind
    // ne s'applique dans l'iframe. Les <link> chargent en asynchrone, d'où
    // l'attente avant d'afficher — sinon on verrait le document sans style.
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('style, link[rel="stylesheet"]'),
    );
    let pending = 0;
    const done = () => { if (--pending <= 0) setStyled(true); };

    for (const node of nodes) {
      const copy = node.cloneNode(true) as HTMLElement;
      if (copy.tagName === "LINK") {
        pending++;
        copy.addEventListener("load", done);
        copy.addEventListener("error", done);
      }
      doc.head.appendChild(copy);
    }
    if (pending === 0) setStyled(true);

    // La police du site vit sur <body> côté hôte : la classe qui la porte
    // n'existe pas ici, on recopie donc la valeur calculée.
    doc.body.style.fontFamily = getComputedStyle(document.body).fontFamily;

    const node = doc.createElement("div");
    node.id = "a4-mount";
    doc.body.appendChild(node);
    setMount(node);
  }, []);

  // Certains navigateurs n'émettent pas « load » pour une iframe `about:blank`
  // déjà prête : on tente aussi à chaque apparition. `scale` en dépendance,
  // car l'iframe n'existe qu'une fois la largeur connue.
  useEffect(() => { setup(); }, [setup, scale]);

  /* ---- Hauteur du contenu → nombre de pages ----
     La feuille fait toujours un multiple entier de 297 mm : un document court
     occupe une page pleine, comme sur du vrai papier. Le calcul converge (la
     hauteur imposée redonne le même nombre de pages), donc pas de boucle. */
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const measure = () =>
      setPages(Math.max(1, Math.ceil((sheet.scrollHeight - 1) / PAGE_H)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [mount, children]);

  const visible = styled && scale > 0;

  return (
    // `overflow-x-auto` : au-delà de zoom 1, la page est plus large que la
    // colonne. Sans ce défilement on ne verrait que sa moitié gauche, sans
    // aucun moyen d'atteindre le reste. `clientWidth` reste la largeur VISIBLE
    // d'un élément qui défile, la mesure de `fit` n'en est donc pas faussée.
    <div ref={hostRef} className="w-full overflow-x-auto">
      <div
        className="relative mx-auto overflow-hidden rounded-[3px] ring-1 ring-black/10"
        style={{
          width: PAGE_W * scale,
          height: pages * PAGE_H * scale,
          background: "#fff",
          boxShadow: "0 8px 28px -10px rgba(16,24,40,.35)",
          opacity: visible ? 1 : 0,
          transition: "opacity .15s ease",
        }}
      >
        {/* Tant que la largeur disponible est nulle — colonne masquée par
            `hidden lg:flex` sur téléphone — on ne monte rien : inutile de
            construire une iframe et d'y recopier toute la feuille de style
            pour un aperçu que personne ne verra. */}
        {scale > 0 && (
        <iframe
          ref={frameRef}
          onLoad={setup}
          title="Aperçu du document au format A4"
          scrolling="no"
          className="block border-0"
          style={{
            width: PAGE_W,
            height: pages * PAGE_H,
            // `app/globals.css` impose `iframe { max-width: 100% }` pour les
            // vidéos intégrées. Ici ce serait fatal : l'iframe rétrécirait à la
            // largeur de la colonne, sa fenêtre interne repasserait sous 640 px
            // et le document afficherait sa mise en page mobile au lieu de la
            // page A4. On rétablit donc la largeur réelle, explicitement.
            maxWidth: "none",
            minWidth: PAGE_W,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
        )}
      </div>

      {mount &&
        scale > 0 &&
        createPortal(
          <div
            ref={sheetRef}
            style={{
              width: PAGE_W,
              minHeight: pages * PAGE_H,
              padding: MARGIN,
              boxSizing: "border-box",
              background: "#fff",
              position: "relative",
            }}
          >
            {children}

            {/* Repères de fin de page. Indicatifs : à l'impression le
                navigateur évite de couper un bloc en deux (règle
                `break-inside: avoid`), le trait peut donc bouger de
                quelques lignes. */}
            {Array.from({ length: pages - 1 }, (_, i) => (
              <div
                key={i}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: (i + 1) * PAGE_H,
                  borderTop: "1px dashed #CBD5E1",
                  pointerEvents: "none",
                }}
              />
            ))}
          </div>,
          mount,
        )}
    </div>
  );
}
