// Génération de QR codes côté serveur, en SVG inline.
//
// Pourquoi pas une image : le document est imprimé (c'est notre moteur PDF).
// Une image externe peut ne pas être chargée au moment où le navigateur lance
// l'impression, et sort alors blanche. Un SVG inline fait partie du HTML : il
// est toujours là, et reste net à n'importe quelle échelle de papier.
//
// Le tracé est assemblé en UN seul `path` plutôt qu'en centaines de `rect` :
// le balisage reste petit, et aucun liseré blanc n'apparaît entre les modules
// lorsque l'imprimante arrondit les coordonnées.

import qrcode from "qrcode-generator";

/**
 * Rend `text` en SVG carré.
 *
 * Correction d'erreur « M » : un QR imprimé puis photocopié ou froissé reste
 * lisible avec ~15 % de dégradation, sans gonfler la grille comme le ferait
 * le niveau « H ».
 */
export function qrSvg(text: string, opts: { margin?: number } = {}): string {
  const margin = opts.margin ?? 2; // en modules — la « zone calme » exigée par la norme

  const qr = qrcode(0, "M"); // 0 = choisit automatiquement la plus petite version
  qr.addData(text);
  qr.make();

  const count = qr.getModuleCount();
  const size = count + margin * 2;

  let d = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        // `h1v1h-1z` : un module plein, en coordonnées relatives.
        d += `M${col + margin} ${row + margin}h1v1h-1z`;
      }
    }
  }

  // `shape-rendering="crispEdges"` : pas de lissage entre modules, sinon les
  // bords gris troublent la lecture par les scanners bon marché.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" ` +
    `width="100%" height="100%" shape-rendering="crispEdges" role="img" ` +
    `aria-label="QR code">` +
    `<rect width="${size}" height="${size}" fill="#fff"/>` +
    `<path d="${d}" fill="#111827"/>` +
    `</svg>`
  );
}
