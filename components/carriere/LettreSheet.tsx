"use client";

/**
 * Ma Carriere — la page d'un courrier (lettre de motivation, demande).
 *
 * ── Dix mises en page, toutes sobres ─────────────────────────────────────
 * Le module n'en proposait qu'une, la francaise administrative. Dix
 * desormais — mais aucune n'est « creative » : une lettre adressee a une
 * administration ou a un recruteur se juge sur la tenue, jamais sur le
 * graphisme. Ce qui change d'un gabarit a l'autre, c'est la structure de
 * l'en-tete et le rythme typographique, pas la quantite de couleur. Un CV
 * peut se permettre un aplat plein ; une lettre, non.
 *
 * ── La signature ─────────────────────────────────────────────────────────
 * Elle porte le nom et les coordonnees du CANDIDAT, jamais ceux de
 * Wanteermako. La maquette montrait « Wanteermako Editeur » avec un
 * telephone et un e-mail du site : sur un courrier de candidature, cela
 * revient a signer la lettre de quelqu'un d'autre. Meme regle que pour les
 * devis de l'Espace Pro — le site n'appose sa marque sur aucun document
 * sortant.
 */

import type { ReactNode } from "react";
import {
  DEFAULT_LETTRE_TEMPLATE,
  LETTRE_ACCENT,
  ligneDate,
  type Expediteur,
  type LettreTemplateId,
} from "@/lib/carriere";

const PAGE_W = 794;
const PAGE_H = 1123;
const BLEED = -53;
/** Marge du courrier : 25 mm a 96 dpi, la norme d'un courrier administratif. */
const MARGE = 94;

const ENCRE = "#1F2937";
const DOUX = "#6B7280";
const FILET = "#D1D5DB";

type Champs = {
  from: Expediteur;
  to: string;
  objet: string;
  corps: string;
};

/** Feuille pleine page, marge annulee — les gabarits gerent leurs retraits. */
function Feuille({
  children,
  serif = true,
  padding = MARGE,
}: {
  children: ReactNode;
  serif?: boolean;
  padding?: number | string;
}) {
  return (
    <article
      style={{
        margin: BLEED,
        width: PAGE_W,
        minHeight: PAGE_H,
        background: "#fff",
        color: ENCRE,
        // Serif pour les gabarits administratifs, sans-serif pour les modernes :
        // c'est le premier signal de registre que lit un destinataire.
        fontFamily: serif ? "Georgia, 'Times New Roman', serif" : "Inter, Arial, sans-serif",
        padding,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </article>
  );
}

/** Bloc d'adresse de l'expediteur, dans l'ordre attendu d'un courrier. */
function Expe({ from, align = "left" }: { from: Expediteur; align?: "left" | "center" | "right" }) {
  return (
    <div style={{ fontSize: 12.5, lineHeight: 1.6, textAlign: align }}>
      <p style={{ fontWeight: 700 }}>{from.name || "Ton nom"}</p>
      {from.city.trim() && <p>{from.city}</p>}
      {from.phone.trim() && <p>{from.phone}</p>}
      {from.email.trim() && <p>{from.email}</p>}
    </div>
  );
}

/** Coordonnees sur une seule ligne, pour les en-tetes compacts. */
function ExpeLigne({ from, couleur = DOUX }: { from: Expediteur; couleur?: string }) {
  const items = [from.city, from.phone, from.email].map((v) => v.trim()).filter(Boolean);
  if (!items.length) return null;
  return <p style={{ fontSize: 11.5, color: couleur, marginTop: 5 }}>{items.join("  ·  ")}</p>;
}

function Destinataire({ to, align = "right" }: { to: string; align?: "left" | "right" }) {
  if (!to.trim()) return null;
  return (
    <div style={{ fontSize: 12.5, lineHeight: 1.6, textAlign: align, maxWidth: 260 }}>
      <p style={{ fontWeight: 700, whiteSpace: "pre-line" }}>{to}</p>
    </div>
  );
}

function Objet({ objet, accent }: { objet: string; accent: string }) {
  if (!objet.trim()) return null;
  return (
    <p style={{ fontSize: 12.5, marginTop: 30, fontWeight: 700, color: accent }}>
      Objet : <span style={{ fontWeight: 400, color: ENCRE }}>{objet}</span>
    </p>
  );
}

/**
 * Le corps. Les paragraphes sont separes par des lignes vides dans le texte
 * genere : on ne recompose pas, on met en page tel qu'il a ete relu.
 */
function Corps({ corps }: { corps: string }) {
  const paragraphes = corps.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div style={{ marginTop: 26, flex: 1 }}>
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
  );
}

function Signature({ from, align = "right" }: { from: Expediteur; align?: "left" | "right" }) {
  return (
    <div style={{ marginTop: 38, textAlign: align }}>
      <p style={{ fontSize: 12.5, marginBottom: 32, color: DOUX }}>Signature</p>
      <p style={{ fontSize: 13, fontWeight: 700 }}>{from.name || "Ton nom"}</p>
    </div>
  );
}

function Date({ from, align = "right" }: { from: Expediteur; align?: "left" | "right" }) {
  return <p style={{ fontSize: 12.5, marginTop: 36, textAlign: align }}>{ligneDate(from.city)}</p>;
}

/* ============================ Les gabarits ============================ */

/** Classique — la francaise administrative : expediteur a gauche, destinataire a droite. */
function Classique(c: Champs & { accent: string }) {
  return (
    <Feuille>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 40 }}>
        <Expe from={c.from} />
        <Destinataire to={c.to} />
      </div>
      <Date from={c.from} />
      <Objet objet={c.objet} accent={c.accent} />
      <Corps corps={c.corps} />
      <Signature from={c.from} />
    </Feuille>
  );
}

/** Moderne — sans-serif, nom en grand, filet de couleur sous l'en-tete. */
function Moderne(c: Champs & { accent: string }) {
  return (
    <Feuille serif={false}>
      <header style={{ borderBottom: `2px solid ${c.accent}`, paddingBottom: 16 }}>
        <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>{c.from.name || "Ton nom"}</p>
        <ExpeLigne from={c.from} />
      </header>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 30 }}>
        <Destinataire to={c.to} />
      </div>
      <Date from={c.from} />
      <Objet objet={c.objet} accent={c.accent} />
      <Corps corps={c.corps} />
      <Signature from={c.from} />
    </Feuille>
  );
}

/** Filet — un simple cheveu de couleur, rien d'autre. Le plus discret. */
function Filet(c: Champs & { accent: string }) {
  return (
    <Feuille>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 40 }}>
        <Expe from={c.from} />
        <Destinataire to={c.to} />
      </div>
      <div style={{ height: 1, background: c.accent, marginTop: 22, opacity: 0.6 }} />
      <Date from={c.from} />
      <Objet objet={c.objet} accent={c.accent} />
      <Corps corps={c.corps} />
      <Signature from={c.from} />
    </Feuille>
  );
}

/**
 * Sobre — aucune couleur du tout.
 *
 * Le gabarit a conseiller pour une administration, un tribunal, une banque :
 * il ne perd rien a l'impression en noir et blanc, et ne peut choquer
 * personne.
 */
function Sobre(c: Champs) {
  return (
    <Feuille>
      <Expe from={c.from} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 26 }}>
        <Destinataire to={c.to} />
      </div>
      <Date from={c.from} />
      {c.objet.trim() && (
        <p style={{ fontSize: 12.5, marginTop: 30, fontWeight: 700, textDecoration: "underline" }}>
          Objet : <span style={{ fontWeight: 400, textDecoration: "none" }}>{c.objet}</span>
        </p>
      )}
      <Corps corps={c.corps} />
      <Signature from={c.from} />
    </Feuille>
  );
}

/** Centre — en-tete centre, comme un papier a lettre grave. */
function Centre(c: Champs & { accent: string }) {
  return (
    <Feuille>
      <header style={{ textAlign: "center", paddingBottom: 18, borderBottom: `1px solid ${FILET}` }}>
        <p style={{ fontSize: 19, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" }}>
          {c.from.name || "Ton nom"}
        </p>
        <ExpeLigne from={c.from} />
      </header>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 30 }}>
        <Destinataire to={c.to} />
      </div>
      <Date from={c.from} />
      <Objet objet={c.objet} accent={c.accent} />
      <Corps corps={c.corps} />
      <Signature from={c.from} />
    </Feuille>
  );
}

/** Bandeau — bande coloree en tete, coordonnees en blanc dessus. */
function Bandeau(c: Champs & { accent: string }) {
  return (
    <Feuille serif={false} padding={0}>
      <header style={{ background: c.accent, color: "#fff", padding: "34px 60px 26px" }}>
        <p style={{ fontSize: 23, fontWeight: 800 }}>{c.from.name || "Ton nom"}</p>
        <ExpeLigne from={c.from} couleur="rgba(255,255,255,.85)" />
      </header>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "34px 60px 60px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Destinataire to={c.to} />
        </div>
        <Date from={c.from} />
        <Objet objet={c.objet} accent={c.accent} />
        <Corps corps={c.corps} />
        <Signature from={c.from} />
      </div>
    </Feuille>
  );
}

/** Colonne — coordonnees dans une bande laterale, corps a droite. */
function Colonne(c: Champs & { accent: string }) {
  return (
    <Feuille serif={false} padding={0}>
      <div style={{ display: "flex", flex: 1 }}>
        <aside
          style={{
            width: 210,
            background: "#F8FAFC",
            borderRight: `3px solid ${c.accent}`,
            padding: "60px 24px",
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{c.from.name || "Ton nom"}</p>
          <div style={{ marginTop: 14, fontSize: 11.5, lineHeight: 1.9, color: DOUX }}>
            {c.from.city.trim() && <p>{c.from.city}</p>}
            {c.from.phone.trim() && <p>{c.from.phone}</p>}
            {c.from.email.trim() && <p style={{ wordBreak: "break-word" }}>{c.from.email}</p>}
          </div>
        </aside>
        <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "60px 54px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Destinataire to={c.to} />
          </div>
          <Date from={c.from} />
          <Objet objet={c.objet} accent={c.accent} />
          <Corps corps={c.corps} />
          <Signature from={c.from} />
        </main>
      </div>
    </Feuille>
  );
}

/** Encadre — un filet fait le tour de la page. */
function Encadre(c: Champs & { accent: string }) {
  return (
    <Feuille padding={40}>
      <div
        style={{
          flex: 1,
          border: `1.5px solid ${c.accent}`,
          padding: 54,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 40 }}>
          <Expe from={c.from} />
          <Destinataire to={c.to} />
        </div>
        <Date from={c.from} />
        <Objet objet={c.objet} accent={c.accent} />
        <Corps corps={c.corps} />
        <Signature from={c.from} />
      </div>
    </Feuille>
  );
}

/** Initiale — un monogramme tient lieu d'en-tete. */
function Initiale(c: Champs & { accent: string }) {
  const initiales =
    (c.from.name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((m) => m[0] || "")
      .join("")
      .toUpperCase() || "??";
  return (
    <Feuille serif={false}>
      <header style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span
          style={{
            width: 54,
            height: 54,
            borderRadius: 9999,
            border: `2px solid ${c.accent}`,
            color: c.accent,
            display: "grid",
            placeItems: "center",
            fontSize: 18,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {initiales}
        </span>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800 }}>{c.from.name || "Ton nom"}</p>
          <ExpeLigne from={c.from} />
        </div>
      </header>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 34 }}>
        <Destinataire to={c.to} />
      </div>
      <Date from={c.from} />
      <Objet objet={c.objet} accent={c.accent} />
      <Corps corps={c.corps} />
      <Signature from={c.from} />
    </Feuille>
  );
}

/** Contemporain — nom en tres grand, tout le reste minuscule. */
function Contemporain(c: Champs & { accent: string }) {
  return (
    <Feuille serif={false}>
      <header>
        <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.05, letterSpacing: -0.8 }}>
          {c.from.name || "Ton nom"}
        </p>
        <div style={{ height: 4, width: 54, background: c.accent, margin: "14px 0 10px" }} />
        <ExpeLigne from={c.from} />
      </header>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32 }}>
        <Destinataire to={c.to} />
      </div>
      <Date from={c.from} />
      <Objet objet={c.objet} accent={c.accent} />
      <Corps corps={c.corps} />
      <Signature from={c.from} align="left" />
    </Feuille>
  );
}

/* ============================= Selection ============================= */

const GABARITS: Record<LettreTemplateId, (p: Champs & { accent: string }) => JSX.Element> = {
  l_classique: Classique,
  l_moderne: Moderne,
  l_filet: Filet,
  l_sobre: Sobre,
  l_centre: Centre,
  l_bandeau: Bandeau,
  l_colonne: Colonne,
  l_encadre: Encadre,
  l_initiale: Initiale,
  l_contemporain: Contemporain,
};

export default function LettreSheet({
  from,
  to,
  objet,
  corps,
  template,
}: Champs & { template?: string }) {
  // Un identifiant inconnu — un gabarit de CV enregistre sur un ancien
  // courrier, par exemple — retombe sur le classique plutot que sur un ecran
  // blanc.
  const id = (template && Object.prototype.hasOwnProperty.call(GABARITS, template)
    ? template
    : DEFAULT_LETTRE_TEMPLATE) as LettreTemplateId;
  const Gabarit = GABARITS[id];
  return <Gabarit from={from} to={to} objet={objet} corps={corps} accent={LETTRE_ACCENT[id]} />;
}
