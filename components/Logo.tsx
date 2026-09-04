import Link from "next/link";
import { BRAND } from "@/lib/constants";

/**
 * Le logo de l'en-tete, dans ses deux versions d'origine.
 *
 *   logo-clair.png  760x199  trace bleu sur fond transparent
 *   logo-dark.png   760x218  version neon, fond transparent
 *
 * Il en faut deux parce que l'en-tete change de couleur avec le theme : la
 * coquille passe au blanc en theme clair (globals.css, regle
 * `html:not(.dark) .header-shell`) et reste ardoise en theme sombre. La
 * version neon disparait sur du blanc, la version bleue sur de l'ardoise.
 *
 * Le passage de l'une a l'autre se fait en IMAGE DE FOND et non avec deux
 * <img> dont un masque : le navigateur ne telecharge que celle dont la regle
 * s'applique, soit un fichier au lieu de deux (~200 Ko economises a chaque
 * visite). Le prix a payer est de porter le ratio en CSS, une image de fond
 * n'ayant pas de dimension propre.
 *
 * Le ratio retenu est celui de la version claire (la plus large des deux) :
 * ainsi les deux s'affichent a pleine hauteur, la version neon laissant
 * simplement un peu de marge a droite.
 */
export default function Logo({
  homeHref = "/",
  className = "",
}: {
  homeHref?: string;
  className?: string;
}) {
  return (
    <Link
      href={homeHref}
      aria-label={"Accueil " + BRAND.name}
      className={"flex shrink-0 items-center " + className}
    >
      {/*
        Sur telephone le logo est dimensionne par sa LARGEUR, pas par sa
        hauteur : `min(40vw,166px)` garantit qu'il ne prendra jamais plus des
        deux cinquiemes de la barre, quel que soit l'ecran, et la hauteur suit
        par le ratio. Le dimensionner par la hauteur revenait a parier sur une
        largeur d'ecran — et sur un 360 px, il poussait la recherche, le theme
        et le compte hors du cadre. A partir de 640 px la place ne manque plus.
      */}
      <span
        aria-hidden="true"
        className="block aspect-[760/199] w-[min(40vw,166px)] shrink-0 bg-[url('/logo-clair.png')] bg-contain bg-left bg-no-repeat dark:bg-[url('/logo-dark.png')] sm:h-11 sm:w-auto md:h-[52px]"
      />
    </Link>
  );
}
