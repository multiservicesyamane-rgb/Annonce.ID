"use client";

/**
 * Ma Carriere — la page d'un courrier (lettre de motivation, demande).
 *
 * Mise en page administrative francaise classique : expediteur en haut a
 * gauche, destinataire a droite, date, objet, corps, signature.
 *
 * ── La signature ─────────────────────────────────────────────────────────
 * Elle porte le nom et les coordonnees du CANDIDAT, jamais ceux de
 * Wanteermako. La maquette montrait « Wanteermako Editeur » avec un
 * telephone et un e-mail du site : sur un courrier de candidature, cela
 * revient a signer la lettre de quelqu'un d'autre. Meme regle que pour les
 * devis de l'Espace Pro — le site n'appose sa marque sur aucun document
 * sortant.
 */

import { ligneDate, type Expediteur } from "@/lib/carriere";

const PAGE_W = 794;
const PAGE_H = 1123;
const BLEED = -53;
/** Marge du courrier : 25 mm a 96 dpi, la norme d'un courrier administratif. */
const MARGE = 94;

export default function LettreSheet({
  from,
  to,
  objet,
  corps,
}: {
  from: Expediteur;
  to: string;
  objet: string;
  corps: string;
}) {
  // Les paragraphes sont separes par des lignes vides dans le texte genere ;
  // on ne recompose pas le corps, on le met en page tel qu'il a ete relu.
  const paragraphes = corps.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <article
      style={{
        margin: BLEED,
        width: PAGE_W,
        minHeight: PAGE_H,
        background: "#fff",
        color: "#1F2937",
        fontFamily: "Georgia, 'Times New Roman', serif",
        padding: MARGE,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 40 }}>
        <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
          <p style={{ fontWeight: 700 }}>{from.name || "Ton nom"}</p>
          {from.city.trim() && <p>{from.city}</p>}
          {from.phone.trim() && <p>{from.phone}</p>}
          {from.email.trim() && <p>{from.email}</p>}
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.6, textAlign: "right", maxWidth: 240 }}>
          {to.trim() && <p style={{ fontWeight: 700 }}>{to}</p>}
        </div>
      </div>

      <p style={{ fontSize: 12.5, marginTop: 40, textAlign: "right" }}>{ligneDate(from.city)}</p>

      {objet.trim() && (
        <p style={{ fontSize: 12.5, marginTop: 34, fontWeight: 700 }}>
          Objet : <span style={{ fontWeight: 400 }}>{objet}</span>
        </p>
      )}

      <div style={{ marginTop: 28, flex: 1 }}>
        {paragraphes.length ? (
          paragraphes.map((p, i) => (
            <p
              key={i}
              style={{
                fontSize: 13,
                lineHeight: 1.85,
                marginBottom: 15,
                textAlign: "justify",
                whiteSpace: "pre-line",
              }}
            >
              {p}
            </p>
          ))
        ) : (
          <p style={{ fontSize: 13, lineHeight: 1.85, color: "#9CA3AF" }}>
            Le corps de ta lettre apparaitra ici.
          </p>
        )}
      </div>

      <div style={{ marginTop: 40, textAlign: "right" }}>
        <p style={{ fontSize: 12.5, marginBottom: 34 }}>Signature</p>
        <p style={{ fontSize: 13, fontWeight: 700 }}>{from.name || "Ton nom"}</p>
      </div>
    </article>
  );
}
