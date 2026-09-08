"use client";

/**
 * Ma Carriere — les mises en page de CV (voir CV_TEMPLATES pour la liste).
 *
 * Adaptes des gabarits du projet cvurgent, avec deux differences voulues :
 *  - les niveaux de langue sont des pastilles sur 5 (voir lib/carriere.ts) ;
 *  - chaque gabarit deborde volontairement la marge de la feuille.
 *
 * ── Le debordement ───────────────────────────────────────────────────────
 * A4Preview pose une marge de 53 px (14 mm) tout autour, comme la regle
 * `@page { margin: 14mm }` des devis. Un CV a colonne coloree ne supporte
 * pas cette marge : la bande bleue se retrouverait posee au milieu d'un
 * cadre blanc au lieu d'atteindre le bord. Les gabarits annulent donc la
 * marge (margin: -53) et gerent eux-memes leurs retraits interieurs. C'est
 * la difference entre un CV et une piece comptable : l'un est un visuel,
 * l'autre un document administratif.
 */

import type { ReactNode } from "react";
import {
  PHOTO_RATIO,
  accentDe,
  fullName,
  initials,
  niveauCompetence,
  periode,
  policeDe,
  type CVContent,
  type Langue,
  type TemplateId,
} from "@/lib/carriere";

const PAGE_W = 794;
const PAGE_H = 1123;
const BLEED = -53;

/** Feuille pleine page, marge de la feuille annulee. */
function Sheet({
  children,
  bg = "#ffffff",
  police = "inherit",
}: {
  children: ReactNode;
  bg?: string;
  /** Pile de polices choisie par l utilisateur (voir POLICES). */
  police?: string;
}) {
  return (
    <article
      style={{
        margin: BLEED,
        width: PAGE_W,
        minHeight: PAGE_H,
        background: bg,
        color: "#1F2937",
        // Le CV est imprime : on fige la police plutot que d'heriter de celle
        // du site, qui n'est pas garantie dans l'iframe de capture.
        fontFamily: police,
        display: "flex",
      }}
    >
      {children}
    </article>
  );
}

/* ============================ Briques ============================ */

function Dots({ level, color, off }: { level: Langue["level"]; color: string; off: string }) {
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 9999,
            background: i <= level ? color : off,
            display: "inline-block",
          }}
        />
      ))}
    </span>
  );
}

function Bars({ level, color, off }: { level: Langue["level"]; color: string; off: string }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{ width: 14, height: 4, borderRadius: 2, background: i <= level ? color : off }}
        />
      ))}
    </span>
  );
}

/** Titre de rubrique du corps principal, souligne a la facon des maquettes. */
function H({ children, color }: { children: ReactNode; color: string }) {
  return (
    <h2
      style={{
        color,
        fontSize: 12.5,
        fontWeight: 800,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        borderBottom: `1px solid ${color}33`,
        paddingBottom: 5,
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

/** Titre de rubrique de la colonne laterale (sur fond fonce). */
function HSide({ children, color = "#ffffff" }: { children: ReactNode; color?: string }) {
  return (
    <h2
      style={{
        color,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.1,
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {children}
    </h2>
  );
}

/** Experiences + formation : le corps commun a tous les gabarits. */
function Parcours({
  cv, accent, formationDabord = false, sombre = false,
}: {
  cv: CVContent;
  accent: string;
  /** Un etudiant met ses etudes avant une experience qu'il n'a pas encore. */
  formationDabord?: boolean;
  /**
   * Corps pose sur un fond fonce (gabarits « creatifs »).
   *
   * Les encres etaient ecrites en dur en gris fonce : un parcours entier
   * devenait illisible des qu'un gabarit passait la page en sombre.
   */
  sombre?: boolean;
}) {
  const encreForte = sombre ? "#F8FAFC" : "#111827";
  const encre = sombre ? "#D5DCE8" : "#374151";
  const encreDouce = sombre ? "#93A0B4" : "#6B7280";
  const experience = cv.experiences.length > 0 && (
    <section style={{ marginBottom: 22 }}>
      <H color={accent}>Experience professionnelle</H>
      {cv.experiences.map((e) => (
        <div key={e.id} style={{ marginBottom: 15 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: encreForte }}>{e.title}</p>
              <p style={{ fontSize: 12, color: encreDouce }}>
                {[e.company, e.location].filter(Boolean).join(", ")}
              </p>
            </div>
            <p style={{ fontSize: 11.5, color: encreDouce, whiteSpace: "nowrap" }}>{periode(e)}</p>
          </div>
          <ul style={{ marginTop: 6, paddingLeft: 14 }}>
            {e.bullets.filter(Boolean).map((b, i) => (
              <li key={i} style={{ fontSize: 12, lineHeight: 1.6, color: encre, listStyle: "disc" }}>
                {b}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );

  const formation = cv.education.length > 0 && (
    <section style={{ marginBottom: 22 }}>
      <H color={accent}>Formation</H>
      {cv.education.map((f) => (
        <div key={f.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: encreForte }}>{f.degree}</p>
            <p style={{ fontSize: 11.5, color: encreDouce }}>
              {[f.school, f.location].filter(Boolean).join(", ")}
            </p>
          </div>
          <p style={{ fontSize: 11.5, color: encreDouce, whiteSpace: "nowrap" }}>
            {periode({ ...f, isCurrent: false })}
          </p>
        </div>
      ))}
    </section>
  );

  /**
   * Certifications — posees juste apres la formation, jamais melangees a elle.
   *
   * Un diplome sanctionne des annees d etude, une certification atteste d une
   * competence precise. Au Senegal, une certification recente pese souvent
   * plus lourd aupres d un recruteur qu un diplome ancien : elle merite sa
   * propre rubrique, pas une ligne noyee dans les etudes.
   *
   * Ecrite ici, dans la brique commune : tous les gabarits l affichent
   * sans qu aucun n ait a etre touche.
   */
  const certifications = cv.certifications?.length > 0 && (
    <section style={{ marginBottom: 22 }}>
      <H color={accent}>Certifications</H>
      {cv.certifications.map((c) => (
        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 9 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: encreForte }}>{c.name}</p>
            {c.issuer.trim() && <p style={{ fontSize: 11.5, color: encreDouce }}>{c.issuer}</p>}
          </div>
          {c.year.trim() && (
            <p style={{ fontSize: 11.5, color: encreDouce, whiteSpace: "nowrap" }}>{c.year}</p>
          )}
        </div>
      ))}
    </section>
  );

  return (
    <>
      {cv.summary.trim() && (
        <section style={{ marginBottom: 22 }}>
          <H color={accent}>Profil</H>
          <p style={{ fontSize: 12.5, lineHeight: 1.65, color: encre }}>{cv.summary}</p>
        </section>
      )}

      {formationDabord ? formation : experience}
      {formationDabord ? experience : formation}
      {certifications}

      {cv.atouts.length > 0 && (
        <section>
          <H color={accent}>Atouts</H>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px" }}>
            {cv.atouts.map((a, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: encre }}>
                <span style={{ color: accent, fontWeight: 700 }} aria-hidden="true">
                  ◆
                </span>
                {a}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}


/**
 * Photo d'identite, ou initiales a defaut.
 *
 * Au Senegal un CV se presente presque toujours avec photo : c'est une
 * attente du recruteur. Les gabarits a medaillon la veulent ronde, les
 * gabarits sobres au format officiel 3,5 x 4,5 cm — d'ou les deux formes.
 *
 * Pas d'attribut `crossOrigin` : html-to-image va chercher le fichier
 * lui-meme au moment de la capture et l'incorpore au PDF. C'est deja ainsi
 * que le logo et la signature des devis arrivent dans leur fichier.
 */
/**
 * Les competences, avec la barre de niveau quand l'auteur en a declare un.
 *
 * Presque toutes les maquettes de reference montrent des barres. Elles
 * manquaient ici pour une raison qui tenait : le formulaire ne demandait aucun
 * niveau, et dessiner une barre en aurait affirme un a la place du candidat —
 * devant un recruteur, c'est lui qui l'aurait porte.
 *
 * Le niveau se saisit desormais, et il reste FACULTATIF. Sans note, la
 * competence sort en simple libelle, sans barre : la maquette est respectee
 * quand il y a de quoi la remplir, et rien n'est invente quand il n'y en a pas.
 */
function Competences({
  cv, texte, remplissage, piste, taille = 11.5,
}: {
  cv: CVContent;
  texte: string;
  /** Couleur de la portion remplie. */
  remplissage: string;
  /** Couleur du rail, sous la portion remplie. */
  piste: string;
  taille?: number;
}) {
  return (
    <>
      {cv.skills.map((nom, i) => {
        const n = niveauCompetence(cv, nom);
        return (
          <div key={i} style={{ marginBottom: n ? 10 : 6 }}>
            <p style={{ fontSize: taille, color: texte, lineHeight: 1.5 }}>{nom}</p>
            {n > 0 && (
              <span
                style={{ display: "block", height: 4, borderRadius: 2, background: piste, marginTop: 4 }}
              >
                <span
                  style={{
                    display: "block",
                    width: `${n * 20}%`,
                    height: "100%",
                    borderRadius: 2,
                    background: remplissage,
                  }}
                />
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

function Photo({
  p, taille, forme, bordure, couleurTexte, marge = 20,
}: {
  p: CVContent["personalInfo"];
  taille: number;
  forme: "cercle" | "rect";
  bordure: string;
  couleurTexte: string;
  marge?: number;
}) {
  const rond = forme === "cercle";
  const cadre = {
    width: taille,
    height: rond ? taille : Math.round(taille / PHOTO_RATIO),
    borderRadius: rond ? 9999 : 6,
    border: `2px solid ${bordure}`,
    overflow: "hidden" as const,
    marginBottom: marge,
    flexShrink: 0,
  };

  if (p.photoUrl) {
    return (
      <div style={cadre}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        ...cadre,
        display: "grid",
        placeItems: "center",
        fontSize: Math.round(taille / 3),
        fontWeight: 800,
        color: couleurTexte,
      }}
    >
      {initials(p)}
    </div>
  );
}

function Contacts({ cv, color }: { cv: CVContent; color: string }) {
  const p = cv.personalInfo;
  const items = [
    { icon: "✉", v: p.email },
    { icon: "☏", v: p.phone },
    { icon: "in", v: p.linkedin },
  ].filter((i) => i.v.trim());
  return (
    <>
      {items.map((i) => (
        <p key={i.v} style={{ display: "flex", gap: 8, fontSize: 11, color, marginBottom: 7, wordBreak: "break-word" }}>
          <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">
            {i.icon}
          </span>
          <span style={{ flex: 1 }}>{i.v}</span>
        </p>
      ))}
    </>
  );
}

/* ===================== Briques des maquettes ===================== */
/*
 * Ce qui revient dans presque tous les modeles de CV professionnels du
 * commerce, et qui manquait ici : la pastille ronde d'icone devant chaque
 * coordonnee, le titre de rubrique en pilule pleine, et le bord courbe entre
 * la colonne et le corps.
 *
 * Ce sont des STRUCTURES, pas des copies : proportions, hierarchie, place de
 * la photo, rythme des rubriques. Aucun fichier n'est repris.
 */

/** Pastille ronde portant une icone — la signature des maquettes a colonne. */
function Pastille({
  children, fond, encre, taille = 21,
}: {
  children: ReactNode;
  fond: string;
  encre: string;
  taille?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: taille,
        height: taille,
        borderRadius: 9999,
        background: fond,
        color: encre,
        display: "inline-grid",
        placeItems: "center",
        fontSize: Math.round(taille * 0.5),
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Coordonnees avec pastille d'icone.
 *
 * La ville figure ici et non a part : sur les maquettes, telephone, e-mail,
 * adresse et lien forment un seul bloc aligne. Les separer cassait la
 * colonne d'icones en deux.
 */
function ContactsPastilles({
  cv, texte, fond, encre, taille = 11,
}: {
  cv: CVContent;
  texte: string;
  fond: string;
  encre: string;
  taille?: number;
}) {
  const p = cv.personalInfo;
  const items = [
    { i: "☎", v: p.phone },
    { i: "✉", v: p.email },
    { i: "◉", v: p.location },
    { i: "in", v: p.linkedin },
  ].filter((x) => x.v.trim());

  return (
    <>
      {items.map((x) => (
        <p
          key={x.v}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontSize: taille,
            color: texte,
            marginBottom: 9,
            wordBreak: "break-word",
          }}
        >
          <Pastille fond={fond} encre={encre}>{x.i}</Pastille>
          <span style={{ flex: 1, minWidth: 0 }}>{x.v}</span>
        </p>
      ))}
    </>
  );
}

/** Titre de rubrique en pilule pleine, pleine largeur. */
function HPilule({
  children, fond, encre,
}: {
  children: ReactNode;
  fond: string;
  encre: string;
}) {
  return (
    <h2
      style={{
        background: fond,
        color: encre,
        fontSize: 11.5,
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: "uppercase",
        padding: "6px 14px",
        borderRadius: 9999,
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

/**
 * Bord courbe entre la colonne et le corps.
 *
 * Un SVG et non un `border-radius` : le rayon d'un coin arrondi ne depasse
 * jamais la moitie de la hauteur, alors que la courbe des maquettes file sur
 * toute la page. Le trace est pose en absolu sur le bord droit de la colonne.
 */
function BordCourbe({ couleur, largeur = 46 }: { couleur: string; largeur?: number }) {
  return (
    <svg
      width={largeur}
      height={PAGE_H}
      viewBox={`0 0 ${largeur} ${PAGE_H}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", top: 0, left: "100%", display: "block" }}
      aria-hidden="true"
    >
      <path d={`M0 0 C ${largeur * 1.4} ${PAGE_H * 0.3}, ${largeur * 1.4} ${PAGE_H * 0.7}, 0 ${PAGE_H} Z`} fill={couleur} />
    </svg>
  );
}

/** Carte blanche posee sur un fond gris — le rythme des maquettes « fiche ». */
function CarteBlanche({ children, marge = 16 }: { children: ReactNode; marge?: number }) {
  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: 10,
        padding: "16px 18px",
        marginBottom: marge,
        boxShadow: "0 1px 3px rgba(16,24,40,.10)",
      }}
    >
      {children}
    </section>
  );
}

/* ============================ Gabarits ============================ */

/** Moderne — colonne bleue a gauche, corps a droite. */
function Moderne({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "moderne");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <aside style={{ width: 260, background: accent, color: "#fff", padding: "44px 26px" }}>
<Photo p={p} taille={76} forme="cercle" bordure="rgba(255,255,255,.5)" couleurTexte="#fff" marge={22} />
        <h1 style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.15 }}>{fullName(p) || "Ton nom"}</h1>
        <p style={{ fontSize: 13.5, opacity: 0.85, marginTop: 6 }}>{p.title}</p>
        {p.location.trim() && (
          <p style={{ fontSize: 11.5, opacity: 0.8, marginTop: 10 }}>◉ {p.location}</p>
        )}

        <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,.25)", margin: "26px 0" }} />
        <HSide>Contact</HSide>
        <Contacts cv={cv} color="rgba(255,255,255,.9)" />

        {cv.skills.length > 0 && (
          <>
            <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,.25)", margin: "26px 0" }} />
            <HSide>Competences</HSide>
            <Competences
              cv={cv}
              texte="#ffffff"
              remplissage="#ffffff"
              piste="rgba(255,255,255,.28)"
            />
          </>
        )}

        {cv.languages.length > 0 && (
          <>
            <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,.25)", margin: "26px 0" }} />
            <HSide>Langues</HSide>
            {cv.languages.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                <span style={{ fontSize: 11.5 }}>{l.name}</span>
                <Dots level={l.level} color="#fff" off="rgba(255,255,255,.3)" />
              </div>
            ))}
          </>
        )}
      </aside>

      <main style={{ flex: 1, padding: "44px 38px" }}>
        <Parcours cv={cv} accent={accent} />
      </main>
    </Sheet>
  );
}

/** Classique — bandeau sombre en tete, deux colonnes en dessous. */
function Classique({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "classique");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ background: accent, color: "#fff", padding: "34px 38px" }}>
          <h1 style={{ fontSize: 27, fontWeight: 800 }}>{fullName(p) || "Ton nom"}</h1>
          <p style={{ fontSize: 13.5, opacity: 0.8, marginTop: 4 }}>{p.title}</p>
        </header>

        <div style={{ flex: 1, display: "flex" }}>
          <aside style={{ width: 232, borderRight: "1px solid #E5E7EB", padding: "30px 24px" }}>
            {p.photoUrl && (
              <Photo p={p} taille={110} forme="rect" bordure="#E5E7EB" couleurTexte="#9CA3AF" marge={18} />
            )}
            <HSide color="#111827">Contact</HSide>
            <Contacts cv={cv} color="#4B5563" />
            {p.location.trim() && (
              <p style={{ display: "flex", gap: 8, fontSize: 11, color: "#4B5563" }}>
                <span style={{ width: 14, opacity: 0.7 }} aria-hidden="true">◉</span>
                <span style={{ flex: 1 }}>{p.location}</span>
              </p>
            )}

            {cv.skills.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <HSide color="#111827">Competences</HSide>
                <Competences cv={cv} texte="#374151" remplissage={accent} piste="#E5E7EB" />
              </div>
            )}

            {cv.languages.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <HSide color="#111827">Langues</HSide>
                {cv.languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                    <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                    <Dots level={l.level} color="#111827" off="#D1D5DB" />
                  </div>
                ))}
              </div>
            )}
          </aside>

          <main style={{ flex: 1, padding: "30px 32px" }}>
            <Parcours cv={cv} accent={accent} />
          </main>
        </div>
      </div>
    </Sheet>
  );
}

/** Executif — colonne nuit et accents dores. Reserve aux abonnes. */
function Executif({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "executif");
  const or = "#D4A017";
  const p = cv.personalInfo;
  return (
    <Sheet>
      <aside style={{ width: 262, background: accent, color: "#fff", padding: "46px 26px" }}>
        {p.photoUrl && <Photo p={p} taille={104} forme="rect" bordure={or} couleurTexte={or} marge={18} />}
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
          {fullName(p) || "Ton nom"}
        </h1>
        <p style={{ fontSize: 12.5, color: or, marginTop: 6 }}>{p.title}</p>
        <hr style={{ border: 0, borderTop: `2px solid ${or}`, width: 46, margin: "18px 0 26px" }} />

        <HSide>Contact</HSide>
        <Contacts cv={cv} color="rgba(255,255,255,.85)" />
        {p.location.trim() && (
          <p style={{ display: "flex", gap: 8, fontSize: 11, color: "rgba(255,255,255,.85)" }}>
            <span style={{ width: 14, opacity: 0.7 }} aria-hidden="true">◉</span>
            <span style={{ flex: 1 }}>{p.location}</span>
          </p>
        )}

        {cv.skills.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <HSide>Competences cles</HSide>
            {/* La barre suit la note donnee par le candidat, et n'apparait que
                s'il en a donne une. Le filet de longueur fixe qui tenait cette
                place ne disait rien ; une barre inventee aurait dit un
                mensonge. */}
            <Competences cv={cv} texte="#ffffff" remplissage={or} piste="rgba(255,255,255,.22)" taille={11} />
          </div>
        )}

        {cv.languages.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <HSide>Langues</HSide>
            {cv.languages.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                <span style={{ fontSize: 11 }}>{l.name}</span>
                <Bars level={l.level} color={or} off="rgba(255,255,255,.22)" />
              </div>
            ))}
          </div>
        )}
      </aside>

      <main style={{ flex: 1, padding: "46px 38px" }}>
        <Parcours cv={cv} accent={accent} />
      </main>
    </Sheet>
  );
}

/**
 * Africain — colonne verte, bandeau tisse en tete.
 *
 * Le motif est dessine en degrades CSS et non charge comme image : la
 * capture PDF passe par html-to-image, qui n'embarque de facon fiable que ce
 * qui est deja dans la page. Une image distante sortirait blanche une fois
 * sur deux dans le fichier telecharge.
 */
function Africain({ cv }: { cv: CVContent }) {
  const vert = accentDe(cv.accent, "africain");
  const or = "#D4A017";
  const p = cv.personalInfo;
  const motif =
    `repeating-linear-gradient(45deg, ${or} 0 10px, transparent 10px 20px),` +
    `repeating-linear-gradient(-45deg, #B45309 0 10px, transparent 10px 20px)`;
  return (
    <Sheet>
      <aside style={{ width: 260, background: vert, color: "#fff", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 46, background: motif, backgroundColor: "#166534" }} aria-hidden="true" />
        <div style={{ padding: "30px 26px 44px" }}>
<Photo p={p} taille={74} forme="cercle" bordure={or} couleurTexte={or} />
          <h1 style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.15 }}>{fullName(p) || "Ton nom"}</h1>
          <p style={{ fontSize: 13, color: or, marginTop: 6 }}>{p.title}</p>

          <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,.25)", margin: "24px 0" }} />
          <HSide color={or}>Contact</HSide>
          <Contacts cv={cv} color="rgba(255,255,255,.9)" />
          {p.location.trim() && (
            <p style={{ display: "flex", gap: 8, fontSize: 11, color: "rgba(255,255,255,.9)" }}>
              <span style={{ width: 14, opacity: 0.7 }} aria-hidden="true">◉</span>
              <span style={{ flex: 1 }}>{p.location}</span>
            </p>
          )}

          {cv.skills.length > 0 && (
            <>
              <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,.25)", margin: "24px 0" }} />
              <HSide color={or}>Competences</HSide>
              {/* La barre ne parait que si le candidat a note la competence.
                  Sans note, le libelle seul — jamais un niveau suppose. */}
              <Competences cv={cv} texte="#ffffff" remplissage={or} piste="rgba(255,255,255,.22)" />
            </>
          )}

          {cv.languages.length > 0 && (
            <>
              <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,.25)", margin: "24px 0" }} />
              <HSide color={or}>Langues</HSide>
              {cv.languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                  <span style={{ fontSize: 11.5 }}>{l.name}</span>
                  <Dots level={l.level} color={or} off="rgba(255,255,255,.25)" />
                </div>
              ))}
            </>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, padding: "44px 36px" }}>
        <Parcours cv={cv} accent={vert} />
      </main>
    </Sheet>
  );
}

/**
 * Minimal — aucune couleur de fond, une seule colonne.
 *
 * C'est le gabarit qui passe le mieux les lecteurs automatiques de CV et les
 * photocopieuses : pas d'aplat, pas de colonne, du texte aligne a gauche. Les
 * gabarits a bande coloree sont plus jolis a l'ecran, celui-ci est plus sur
 * quand on ne sait pas ce que le recruteur fera du fichier.
 */
function Minimal({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "minimal");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <main style={{ flex: 1, padding: "60px 64px" }}>
        <header style={{ borderBottom: `2px solid ${accent}`, paddingBottom: 16, marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {p.photoUrl && <Photo p={p} taille={82} forme="rect" bordure="#E5E7EB" couleurTexte="#9CA3AF" marge={0} />}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, color: "#111827" }}>
                {fullName(p) || "Ton nom"}
              </h1>
              <p style={{ fontSize: 14, color: accent, marginTop: 4, fontWeight: 600 }}>{p.title}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 10, fontSize: 11, color: "#6B7280" }}>
                {[p.location, p.phone, p.email, p.linkedin].filter(Boolean).map((v) => (
                  <span key={v}>{v}</span>
                ))}
              </div>
            </div>
          </div>
        </header>

        <Parcours cv={cv} accent={accent} />

        {(cv.skills.length > 0 || cv.languages.length > 0) && (
          <section style={{ marginTop: 4 }}>
            <H color={accent}>Competences et langues</H>
            {cv.skills.length > 0 && (
              <p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151" }}>{cv.skills.join(" · ")}</p>
            )}
            {cv.languages.length > 0 && (
              <p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151", marginTop: 4 }}>
                {cv.languages.map((l) => `${l.name} (${l.level}/5)`).join(" · ")}
              </p>
            )}
          </section>
        )}
      </main>
    </Sheet>
  );
}

/**
 * Etudiant — la formation avant l'experience.
 *
 * Un premier CV se juge sur les etudes ; commencer par une experience vide ou
 * par un stage de trois semaines dessert le candidat. L'ordre des rubriques
 * est ici inverse, et c'est toute la difference.
 */
function Etudiant({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "etudiant");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ background: `${accent}12`, borderBottom: `3px solid ${accent}`, padding: "38px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {p.photoUrl ? (
              <Photo p={p} taille={78} forme="cercle" bordure={accent} couleurTexte={accent} marge={0} />
            ) : null}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: 27, fontWeight: 800, color: "#111827" }}>{fullName(p) || "Ton nom"}</h1>
              <p style={{ fontSize: 13.5, color: accent, fontWeight: 700, marginTop: 3 }}>{p.title}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 8, fontSize: 11, color: "#4B5563" }}>
                {[p.location, p.phone, p.email].filter(Boolean).map((v) => (
                  <span key={v}>{v}</span>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "30px 48px" }}>
          <Parcours cv={cv} accent={accent} formationDabord />

          {(cv.skills.length > 0 || cv.languages.length > 0) && (
            <section style={{ display: "flex", gap: 32 }}>
              {cv.skills.length > 0 && (
                <div style={{ flex: 1 }}>
                  <H color={accent}>Competences</H>
                  <Competences cv={cv} texte="#374151" remplissage={accent} piste="#E5E7EB" taille={12} />
                </div>
              )}
              {cv.languages.length > 0 && (
                <div style={{ width: 200 }}>
                  <H color={accent}>Langues</H>
                  {cv.languages.map((l) => (
                    <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "#374151" }}>{l.name}</span>
                      <Dots level={l.level} color={accent} off="#D1D5DB" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </Sheet>
  );
}

/**
 * Chronologie — une frise verticale le long des experiences.
 *
 * Met en valeur un parcours continu : les postes s'enchainent visuellement,
 * ce qu'une liste ne montre pas. Reserve aux abonnes.
 */
function Chrono({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "chrono");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ background: accent, color: "#fff", padding: "34px 48px", display: "flex", alignItems: "center", gap: 20 }}>
          {p.photoUrl && <Photo p={p} taille={72} forme="cercle" bordure="rgba(255,255,255,.6)" couleurTexte="#fff" marge={0} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>{fullName(p) || "Ton nom"}</h1>
            <p style={{ fontSize: 13.5, opacity: 0.85, marginTop: 3 }}>{p.title}</p>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, opacity: 0.9, lineHeight: 1.7 }}>
            {[p.phone, p.email, p.location].filter(Boolean).map((v) => (
              <div key={v}>{v}</div>
            ))}
          </div>
        </header>

        <main style={{ flex: 1, padding: "30px 48px" }}>
          {cv.summary.trim() && (
            <section style={{ marginBottom: 22 }}>
              <H color={accent}>Profil</H>
              <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "#374151" }}>{cv.summary}</p>
            </section>
          )}

          {cv.experiences.length > 0 && (
            <section style={{ marginBottom: 22 }}>
              <H color={accent}>Parcours</H>
              <div style={{ position: "relative", paddingLeft: 22 }}>
                {/* Le trait de la frise, derriere les pastilles. */}
                <span
                  style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 2, background: `${accent}33` }}
                  aria-hidden="true"
                />
                {cv.experiences.map((e) => (
                  <div key={e.id} style={{ position: "relative", marginBottom: 16 }}>
                    <span
                      style={{
                        position: "absolute", left: -22, top: 4, width: 12, height: 12,
                        borderRadius: 9999, background: accent, border: "2px solid #fff",
                      }}
                      aria-hidden="true"
                    />
                    <p style={{ fontSize: 11, color: accent, fontWeight: 700 }}>{periode(e)}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{e.title}</p>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>
                      {[e.company, e.location].filter(Boolean).join(", ")}
                    </p>
                    <ul style={{ marginTop: 5, paddingLeft: 14 }}>
                      {e.bullets.filter(Boolean).map((b, i) => (
                        <li key={i} style={{ fontSize: 12, lineHeight: 1.6, color: "#374151", listStyle: "disc" }}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {cv.education.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <H color={accent}>Formation</H>
              {cv.education.map((f) => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{f.degree}</p>
                    <p style={{ fontSize: 11.5, color: "#6B7280" }}>{[f.school, f.location].filter(Boolean).join(", ")}</p>
                  </div>
                  <p style={{ fontSize: 11.5, color: "#6B7280", whiteSpace: "nowrap" }}>
                    {periode({ ...f, isCurrent: false })}
                  </p>
                </div>
              ))}
            </section>
          )}

          {(cv.skills.length > 0 || cv.languages.length > 0) && (
            <section>
              <H color={accent}>Competences et langues</H>
              <p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151" }}>
                {[...cv.skills, ...cv.languages.map((l) => `${l.name} (${l.level}/5)`)].join(" · ")}
              </p>
            </section>
          )}
        </main>
      </div>
    </Sheet>
  );
}

/**
 * Compact — deux colonnes de largeur egale, sans aplat.
 *
 * Pour les parcours charges : a surface egale il fait tenir nettement plus de
 * lignes qu'une colonne unique, sans reduire la taille du texte au point de
 * le rendre penible. Reserve aux abonnes.
 */
function Compact({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "compact");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ borderTop: `6px solid ${accent}`, padding: "30px 44px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>{fullName(p) || "Ton nom"}</h1>
              <p style={{ fontSize: 13, color: accent, fontWeight: 700, marginTop: 2 }}>{p.title}</p>
            </div>
            <div style={{ textAlign: "right", fontSize: 10.5, color: "#6B7280", lineHeight: 1.7 }}>
              {[p.phone, p.email, p.location, p.linkedin].filter(Boolean).map((v) => (
                <div key={v}>{v}</div>
              ))}
            </div>
          </div>
          {cv.summary.trim() && (
            <p style={{ fontSize: 12, lineHeight: 1.6, color: "#374151", marginTop: 14 }}>{cv.summary}</p>
          )}
        </header>

        <main style={{ flex: 1, display: "flex", gap: 28, padding: "18px 44px 40px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {cv.experiences.length > 0 && (
              <section>
                <H color={accent}>Experience</H>
                {cv.experiences.map((e) => (
                  <div key={e.id} style={{ marginBottom: 13 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{e.title}</p>
                    <p style={{ fontSize: 11, color: "#6B7280" }}>
                      {[e.company, periode(e)].filter(Boolean).join(" · ")}
                    </p>
                    <ul style={{ marginTop: 4, paddingLeft: 13 }}>
                      {e.bullets.filter(Boolean).map((b, i) => (
                        <li key={i} style={{ fontSize: 11.5, lineHeight: 1.55, color: "#374151", listStyle: "disc" }}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}
          </div>

          <div style={{ width: 250, flexShrink: 0 }}>
            {cv.education.length > 0 && (
              <section style={{ marginBottom: 18 }}>
                <H color={accent}>Formation</H>
                {cv.education.map((f) => (
                  <div key={f.id} style={{ marginBottom: 9 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{f.degree}</p>
                    <p style={{ fontSize: 11, color: "#6B7280" }}>
                      {[f.school, periode({ ...f, isCurrent: false })].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </section>
            )}

            {cv.skills.length > 0 && (
              <section style={{ marginBottom: 18 }}>
                <H color={accent}>Competences</H>
                <Competences cv={cv} texte="#374151" remplissage={accent} piste="#E5E7EB" />
              </section>
            )}

            {cv.languages.length > 0 && (
              <section style={{ marginBottom: 18 }}>
                <H color={accent}>Langues</H>
                {cv.languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                    <Dots level={l.level} color={accent} off="#D1D5DB" />
                  </div>
                ))}
              </section>
            )}

            {cv.atouts.length > 0 && (
              <section>
                <H color={accent}>Atouts</H>
                <ul style={{ paddingLeft: 13 }}>
                  {cv.atouts.map((a, i) => (
                    <li key={i} style={{ fontSize: 11.5, lineHeight: 1.7, color: "#374151", listStyle: "disc" }}>
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </main>
      </div>
    </Sheet>
  );
}

/** Bandeau — large bandeau colore en tete, photo a droite, une seule colonne. */
function Bandeau({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "bandeau");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            background: accent,
            color: "#fff",
            padding: "38px 44px",
            display: "flex",
            alignItems: "center",
            gap: 26,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1 }}>{fullName(p) || "Ton nom"}</h1>
            <p style={{ fontSize: 14, opacity: 0.88, marginTop: 6 }}>{p.title}</p>
            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: "4px 22px" }}>
              <Contacts cv={cv} color="rgba(255,255,255,.92)" />
              {p.location.trim() && (
                <p style={{ display: "flex", gap: 8, fontSize: 11, color: "rgba(255,255,255,.92)" }}>
                  <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
                  <span>{p.location}</span>
                </p>
              )}
            </div>
          </div>
          <Photo p={p} taille={96} forme="cercle" bordure="rgba(255,255,255,.6)" couleurTexte="#fff" marge={0} />
        </header>

        <main style={{ flex: 1, padding: "32px 44px" }}>
          {(cv.skills.length > 0 || cv.languages.length > 0) && (
            <section style={{ marginBottom: 22, display: "flex", gap: 34 }}>
              {cv.skills.length > 0 && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <H color={accent}>Competences</H>
                  <p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151" }}>{cv.skills.join(" · ")}</p>
                </div>
              )}
              {cv.languages.length > 0 && (
                <div style={{ width: 210, flexShrink: 0 }}>
                  <H color={accent}>Langues</H>
                  {cv.languages.map((l) => (
                    <div
                      key={l.id}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}
                    >
                      <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                      <Bars level={l.level} color={accent} off="#E5E7EB" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          <Parcours cv={cv} accent={accent} />
        </main>
      </div>
    </Sheet>
  );
}

/**
 * Elegant — aucun aplat de couleur, tout se joue sur les filets et l'espace.
 * C'est le gabarit a conseiller quand le CV part chez un employeur qui
 * l'imprimera en noir et blanc : il ne perd rien a la conversion.
 */
function Elegant({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "elegant");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "52px 62px" }}>
        <header style={{ textAlign: "center", paddingBottom: 22 }}>
          {p.photoUrl && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Photo p={p} taille={88} forme="cercle" bordure="#E5E7EB" couleurTexte="#9CA3AF" marge={18} />
            </div>
          )}
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#111827" }}>
            {fullName(p) || "Ton nom"}
          </h1>
          <p style={{ fontSize: 13, letterSpacing: 1.4, color: accent, marginTop: 8, textTransform: "uppercase" }}>
            {p.title}
          </p>
          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: `1px solid ${accent}`,
              borderBottom: `1px solid ${accent}`,
              paddingBottom: 12,
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "2px 26px",
            }}
          >
            <Contacts cv={cv} color="#4B5563" />
            {p.location.trim() && (
              <p style={{ display: "flex", gap: 8, fontSize: 11, color: "#4B5563" }}>
                <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
                <span>{p.location}</span>
              </p>
            )}
          </div>
        </header>

        <main style={{ flex: 1, paddingTop: 26 }}>
          <Parcours cv={cv} accent={accent} />
          {(cv.skills.length > 0 || cv.languages.length > 0) && (
            <section style={{ marginTop: 22 }}>
              <H color={accent}>Competences et langues</H>
              {cv.skills.length > 0 && (
                <p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151" }}>{cv.skills.join(" · ")}</p>
              )}
              {cv.languages.length > 0 && (
                <p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151", marginTop: 6 }}>
                  {cv.languages.map((l) => `${l.name} (${l.level}/5)`).join(" · ")}
                </p>
              )}
            </section>
          )}
        </main>
      </div>
    </Sheet>
  );
}

/** Duo — deux colonnes de meme largeur sous un titre plein cadre. */
function Duo({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "duo");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            padding: "36px 40px 22px",
            borderBottom: `4px solid ${accent}`,
            display: "flex",
            alignItems: "flex-end",
            gap: 22,
          }}
        >
          {p.photoUrl && <Photo p={p} taille={84} forme="rect" bordure="#E5E7EB" couleurTexte="#9CA3AF" marge={0} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 29, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 13.5, color: accent, fontWeight: 600, marginTop: 5 }}>{p.title}</p>
          </div>
        </header>

        <div style={{ flex: 1, display: "flex", gap: 30, padding: "28px 40px" }}>
          <main style={{ flex: 1, minWidth: 0 }}>
            <Parcours cv={cv} accent={accent} />
          </main>

          <aside style={{ width: 240, flexShrink: 0, borderLeft: "1px solid #E5E7EB", paddingLeft: 26 }}>
            <H color={accent}>Contact</H>
            <Contacts cv={cv} color="#4B5563" />
            {p.location.trim() && (
              <p style={{ display: "flex", gap: 8, fontSize: 11, color: "#4B5563" }}>
                <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
                <span style={{ flex: 1 }}>{p.location}</span>
              </p>
            )}

            {cv.skills.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <H color={accent}>Competences</H>
                <Competences cv={cv} texte="#374151" remplissage={accent} piste="#E5E7EB" />
              </div>
            )}

            {cv.languages.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <H color={accent}>Langues</H>
                {cv.languages.map((l) => (
                  <div
                    key={l.id}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}
                  >
                    <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                    <Dots level={l.level} color={accent} off="#D1D5DB" />
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </Sheet>
  );
}

/** Cadre — un filet fait le tour de la page, le titre s'y encastre. */
function Cadre({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "cadre");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, padding: 26, display: "flex" }}>
        <div style={{ flex: 1, border: `2px solid ${accent}`, display: "flex", flexDirection: "column", padding: 30 }}>
          <header
            style={{
              textAlign: "center",
              paddingBottom: 20,
              marginBottom: 24,
              borderBottom: `1px solid ${accent}55`,
            }}
          >
            {p.photoUrl && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Photo p={p} taille={84} forme="cercle" bordure={accent} couleurTexte={accent} marge={16} />
              </div>
            )}
            <h1 style={{ fontSize: 27, fontWeight: 800, color: accent, lineHeight: 1.15 }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 13, color: "#4B5563", marginTop: 5 }}>{p.title}</p>
            <div
              style={{ marginTop: 12, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "2px 22px" }}
            >
              <Contacts cv={cv} color="#4B5563" />
              {p.location.trim() && (
                <p style={{ display: "flex", gap: 8, fontSize: 11, color: "#4B5563" }}>
                  <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
                  <span>{p.location}</span>
                </p>
              )}
            </div>
          </header>

          <main style={{ flex: 1 }}>
            <Parcours cv={cv} accent={accent} />
            {(cv.skills.length > 0 || cv.languages.length > 0) && (
              <section style={{ marginTop: 22 }}>
                <H color={accent}>Competences et langues</H>
                {cv.skills.length > 0 && (
                  <p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151" }}>{cv.skills.join(" · ")}</p>
                )}
                {cv.languages.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
                    {cv.languages.map((l) => (
                      <span key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#374151" }}>
                        {l.name}
                        <Dots level={l.level} color={accent} off="#D1D5DB" />
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>
    </Sheet>
  );
}

/** Mosaique — competences et langues en pastilles, avant le parcours. */
function Mosaique({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "mosaique");
  const p = cv.personalInfo;
  return (
    <Sheet bg="#FAFAF9">
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "38px 42px 26px", display: "flex", alignItems: "center", gap: 24 }}>
          <Photo p={p} taille={92} forme="cercle" bordure={accent} couleurTexte={accent} marge={0} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 13.5, color: accent, fontWeight: 600, marginTop: 5 }}>{p.title}</p>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: "2px 22px" }}>
              <Contacts cv={cv} color="#4B5563" />
              {p.location.trim() && (
                <p style={{ display: "flex", gap: 8, fontSize: 11, color: "#4B5563" }}>
                  <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
                  <span>{p.location}</span>
                </p>
              )}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "0 42px 38px" }}>
          {cv.skills.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <H color={accent}>Competences</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {cv.skills.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11.5,
                      color: "#374151",
                      background: "#fff",
                      border: `1px solid ${accent}44`,
                      borderRadius: 999,
                      padding: "5px 12px",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {cv.languages.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <H color={accent}>Langues</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {cv.languages.map((l) => (
                  <span
                    key={l.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      fontSize: 11.5,
                      color: "#374151",
                      background: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      padding: "6px 12px",
                    }}
                  >
                    {l.name}
                    <Dots level={l.level} color={accent} off="#E5E7EB" />
                  </span>
                ))}
              </div>
            </section>
          )}

          <Parcours cv={cv} accent={accent} />
        </main>
      </div>
    </Sheet>
  );
}

/** Diagonale — un coin colore taille en biais, le reste tres sobre. */
function Diagonale({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "diagonale");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Le biais est un simple polygone : html-to-image le capture tel quel,
            la ou un degrade CSS complexe sort parfois aplati du PDF. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 340,
            height: 250,
            background: accent,
            clipPath: "polygon(100% 0, 100% 100%, 0 0)",
          }}
        />

        <header style={{ padding: "48px 44px 26px", position: "relative" }}>
          {p.photoUrl && <Photo p={p} taille={80} forme="rect" bordure="#E5E7EB" couleurTexte="#9CA3AF" marge={16} />}
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#111827", lineHeight: 1.1, maxWidth: 420 }}>
            {fullName(p) || "Ton nom"}
          </h1>
          <p style={{ fontSize: 13.5, color: accent, fontWeight: 600, marginTop: 6, maxWidth: 420 }}>{p.title}</p>
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: `2px solid ${accent}`,
              maxWidth: 420,
              display: "flex",
              flexWrap: "wrap",
              gap: "2px 22px",
            }}
          >
            <Contacts cv={cv} color="#4B5563" />
            {p.location.trim() && (
              <p style={{ display: "flex", gap: 8, fontSize: 11, color: "#4B5563" }}>
                <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
                <span>{p.location}</span>
              </p>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: "0 44px 40px", position: "relative" }}>
          <Parcours cv={cv} accent={accent} />
          {(cv.skills.length > 0 || cv.languages.length > 0) && (
            <section style={{ marginTop: 22 }}>
              <H color={accent}>Competences et langues</H>
              {cv.skills.length > 0 && (
                <p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151" }}>{cv.skills.join(" · ")}</p>
              )}
              {cv.languages.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
                  {cv.languages.map((l) => (
                    <span key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#374151" }}>
                      {l.name}
                      <Bars level={l.level} color={accent} off="#E5E7EB" />
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </Sheet>
  );
}

/**
 * Nuit — page sombre, contenu pose sur une carte claire.
 *
 * Le corps reste sur fond blanc a dessein : `Parcours` ecrit en gris fonce, et
 * un parcours entier en blanc sur noir vide une cartouche d'encre a l'impression
 * — or ce CV finit souvent imprime dans un cybercafe.
 */
function Nuit({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "nuit");
  const p = cv.personalInfo;
  const clair = "#E8ECF4";
  return (
    <Sheet bg="#0B1220">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 26 }}>
        <header style={{ display: "flex", alignItems: "center", gap: 22, padding: "14px 18px 24px" }}>
          <Photo p={p} taille={88} forme="cercle" bordure="rgba(255,255,255,.35)" couleurTexte={clair} marge={0} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 13.5, color: clair, opacity: 0.75, marginTop: 5 }}>{p.title}</p>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: "2px 22px" }}>
              <Contacts cv={cv} color="rgba(232,236,244,.8)" />
              {p.location.trim() && (
                <p style={{ display: "flex", gap: 8, fontSize: 11, color: "rgba(232,236,244,.8)" }}>
                  <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
                  <span>{p.location}</span>
                </p>
              )}
            </div>
          </div>
        </header>

        {(cv.skills.length > 0 || cv.languages.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 18px 20px" }}>
            {cv.skills.map((s, i) => (
              <span
                key={`s${i}`}
                style={{
                  fontSize: 11,
                  color: clair,
                  border: "1px solid rgba(255,255,255,.25)",
                  borderRadius: 999,
                  padding: "4px 11px",
                }}
              >
                {s}
              </span>
            ))}
            {cv.languages.map((l) => (
              <span
                key={l.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  color: clair,
                  border: "1px solid rgba(255,255,255,.25)",
                  borderRadius: 999,
                  padding: "4px 11px",
                }}
              >
                {l.name}
                <Dots level={l.level} color="#fff" off="rgba(255,255,255,.3)" />
              </span>
            ))}
          </div>
        )}

        <main style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "30px 34px" }}>
          <Parcours cv={cv} accent={accent} />
        </main>
      </div>
    </Sheet>
  );
}

/* ======================= Les deux gabarits neon =======================
   Page sombre et liseres lumineux, pour les metiers ou l'on attend un CV
   qui sorte du lot : graphisme, audiovisuel, evenementiel, developpement.

   Ils ignorent volontairement l'accent choisi par l'utilisateur : la palette
   d'accents est faite de teintes SOMBRES (voir ACCENTS dans lib/carriere.ts),
   qui disparaitraient sur un fond noir. Ces deux-la portent donc leur propre
   couple de couleurs.

   Le halo est un `boxShadow` et non un filtre : html-to-image le restitue tel
   quel dans le PDF, la ou un `filter` sort parfois aplati.
   ===================================================================== */

const NEON_FOND = "#080B14";
const NEON_CARTE = "#0F1526";

function Halo({ couleur, force = 14 }: { couleur: string; force?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        height: 3,
        borderRadius: 2,
        background: couleur,
        boxShadow: `0 0 ${force}px ${couleur}`,
      }}
    />
  );
}

/** Pastille lumineuse : competences et langues des gabarits neon. */
function Puce({ children, couleur }: { children: ReactNode; couleur: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        color: "#E6EDF7",
        background: "rgba(255,255,255,.04)",
        border: `1px solid ${couleur}66`,
        boxShadow: `0 0 10px ${couleur}33`,
        borderRadius: 999,
        padding: "5px 12px",
      }}
    >
      {children}
    </span>
  );
}

/** Neon — nom en lettres lumineuses, filets cyan et magenta. */
function Neon({ cv }: { cv: CVContent }) {
  const cyan = "#22D3EE";
  const rose = "#F472B6";
  const p = cv.personalInfo;
  return (
    <Sheet bg={NEON_FOND}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "44px 46px 40px" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                lineHeight: 1.08,
                color: "#FFFFFF",
                textShadow: `0 0 18px ${cyan}AA`,
              }}
            >
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 14, color: cyan, marginTop: 7, letterSpacing: 0.6 }}>{p.title}</p>
          </div>
          {p.photoUrl && (
            <Photo p={p} taille={92} forme="cercle" bordure={cyan} couleurTexte="#E6EDF7" marge={0} />
          )}
        </header>

        <div style={{ margin: "18px 0 20px", display: "flex", gap: 8 }}>
          <div style={{ flex: 2 }}>
            <Halo couleur={cyan} />
          </div>
          <div style={{ flex: 1 }}>
            <Halo couleur={rose} />
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 24px", marginBottom: 22 }}>
          <Contacts cv={cv} color="#AEBBD0" />
          {p.location.trim() && (
            <p style={{ display: "flex", gap: 8, fontSize: 11, color: "#AEBBD0" }}>
              <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
              <span>{p.location}</span>
            </p>
          )}
        </div>

        {(cv.skills.length > 0 || cv.languages.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {cv.skills.map((s, i) => (
              <Puce key={`s${i}`} couleur={cyan}>
                {s}
              </Puce>
            ))}
            {cv.languages.map((l) => (
              <Puce key={l.id} couleur={rose}>
                {l.name}
                <Dots level={l.level} color={rose} off="rgba(255,255,255,.2)" />
              </Puce>
            ))}
          </div>
        )}

        <main style={{ flex: 1 }}>
          <Parcours cv={cv} accent={cyan} sombre />
        </main>
      </div>
    </Sheet>
  );
}

/** Cyber — colonne laterale violette lumineuse, corps sombre a droite. */
function Cyber({ cv }: { cv: CVContent }) {
  const violet = "#A855F7";
  const vert = "#4ADE80";
  const p = cv.personalInfo;
  return (
    <Sheet bg={NEON_FOND}>
      <aside
        style={{
          width: 268,
          background: NEON_CARTE,
          borderRight: `1px solid ${violet}55`,
          boxShadow: `inset -14px 0 26px -18px ${violet}`,
          padding: "42px 26px",
        }}
      >
        <Photo p={p} taille={84} forme="cercle" bordure={violet} couleurTexte="#E6EDF7" marge={20} />
        <h1
          style={{ fontSize: 23, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.15, textShadow: `0 0 16px ${violet}99` }}
        >
          {fullName(p) || "Ton nom"}
        </h1>
        <p style={{ fontSize: 12.5, color: violet, marginTop: 6 }}>{p.title}</p>

        <div style={{ margin: "20px 0" }}>
          <Halo couleur={violet} force={12} />
        </div>

        <HSide color={vert}>Contact</HSide>
        <Contacts cv={cv} color="#AEBBD0" />
        {p.location.trim() && (
          <p style={{ display: "flex", gap: 8, fontSize: 11, color: "#AEBBD0" }}>
            <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
            <span style={{ flex: 1 }}>{p.location}</span>
          </p>
        )}

        {cv.skills.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <HSide color={vert}>Competences</HSide>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {cv.skills.map((s, i) => (
                <Puce key={i} couleur={violet}>
                  {s}
                </Puce>
              ))}
            </div>
          </div>
        )}

        {cv.languages.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <HSide color={vert}>Langues</HSide>
            {cv.languages.map((l) => (
              <div
                key={l.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}
              >
                <span style={{ fontSize: 11.5, color: "#D5DCE8" }}>{l.name}</span>
                <Bars level={l.level} color={vert} off="rgba(255,255,255,.18)" />
              </div>
            ))}
          </div>
        )}
      </aside>

      <main style={{ flex: 1, padding: "42px 36px" }}>
        <Parcours cv={cv} accent={vert} sombre />
      </main>
    </Sheet>
  );
}

/* ======================= Seconde serie de gabarits =======================
   Dix mises en page de plus, toutes bâties sur les mêmes briques : ce sont
   les STRUCTURES qui different, pas le contenu. Un gabarit qui se contenterait
   de changer une couleur n'apporterait rien — l'utilisateur a deja six teintes
   pour chacun. */

/** Bloc lateral commun aux gabarits a colonne : contact, competences, langues. */
function ColonneLaterale({
  cv, texte, titre, off,
}: {
  cv: CVContent;
  texte: string;
  titre: string;
  off: string;
}) {
  const p = cv.personalInfo;
  return (
    <>
      <HSide color={titre}>Contact</HSide>
      <Contacts cv={cv} color={texte} />
      {p.location.trim() && (
        <p style={{ display: "flex", gap: 8, fontSize: 11, color: texte }}>
          <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
          <span style={{ flex: 1 }}>{p.location}</span>
        </p>
      )}

      {cv.skills.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <HSide color={titre}>Competences</HSide>
          <Competences cv={cv} texte={texte} remplissage={titre} piste={off} />
        </div>
      )}

      {cv.languages.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <HSide color={titre}>Langues</HSide>
          {cv.languages.map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
              <span style={{ fontSize: 11.5, color: texte }}>{l.name}</span>
              <Dots level={l.level} color={titre} off={off} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/** Competences et langues sur une ligne, pour les gabarits sans colonne. */
function BasDePage({ cv, accent }: { cv: CVContent; accent: string }) {
  if (cv.skills.length === 0 && cv.languages.length === 0) return null;
  return (
    <section style={{ marginTop: 20 }}>
      <H color={accent}>Competences et langues</H>
      {cv.skills.length > 0 && (
        <p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151" }}>{cv.skills.join(" · ")}</p>
      )}
      {cv.languages.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
          {cv.languages.map((l) => (
            <span key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#374151" }}>
              {l.name}
              <Dots level={l.level} color={accent} off="#D1D5DB" />
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

/** Miroir — la colonne coloree passe a DROITE. L'oeil occidental lit le
    parcours en premier, la fiche signaletique ensuite. */
function Miroir({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "miroir");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <main style={{ flex: 1, padding: "44px 34px 44px 38px" }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
          {fullName(p) || "Ton nom"}
        </h1>
        <p style={{ fontSize: 13.5, color: accent, fontWeight: 600, marginTop: 5, marginBottom: 22 }}>{p.title}</p>
        <Parcours cv={cv} accent={accent} />
      </main>
      <aside style={{ width: 250, background: accent, color: "#fff", padding: "44px 24px" }}>
        <Photo p={p} taille={74} forme="cercle" bordure="rgba(255,255,255,.5)" couleurTexte="#fff" marge={22} />
        <ColonneLaterale cv={cv} texte="rgba(255,255,255,.9)" titre="#ffffff" off="rgba(255,255,255,.3)" />
      </aside>
    </Sheet>
  );
}

/** Portrait — la photo occupe toute la largeur en tete, le nom par-dessus. */
function Portrait({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "portrait");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ position: "relative", height: 210, background: accent, overflow: "hidden" }}>
          {p.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.photoUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.42, display: "block" }}
            />
          )}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 42px 26px" }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.9)", marginTop: 5 }}>{p.title}</p>
          </div>
        </header>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 24px", padding: "18px 42px 0" }}>
          <Contacts cv={cv} color="#4B5563" />
          {p.location.trim() && (
            <p style={{ display: "flex", gap: 8, fontSize: 11, color: "#4B5563" }}>
              <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
              <span>{p.location}</span>
            </p>
          )}
        </div>
        <main style={{ flex: 1, padding: "24px 42px 40px" }}>
          <Parcours cv={cv} accent={accent} />
          <BasDePage cv={cv} accent={accent} />
        </main>
      </div>
    </Sheet>
  );
}

/** Bicolore — le tiers haut colore, le reste blanc. */
function Bicolore({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "bicolore");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ background: accent, color: "#fff", padding: "40px 44px 34px", display: "flex", gap: 24, alignItems: "center" }}>
          {p.photoUrl && (
            <Photo p={p} taille={86} forme="cercle" bordure="rgba(255,255,255,.6)" couleurTexte="#fff" marge={0} />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>{fullName(p) || "Ton nom"}</h1>
            <p style={{ fontSize: 13.5, opacity: 0.88, marginTop: 5 }}>{p.title}</p>
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: "2px 20px" }}>
              <Contacts cv={cv} color="rgba(255,255,255,.9)" />
              {p.location.trim() && (
                <p style={{ display: "flex", gap: 8, fontSize: 11, color: "rgba(255,255,255,.9)" }}>
                  <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
                  <span>{p.location}</span>
                </p>
              )}
            </div>
          </div>
        </header>
        <main style={{ flex: 1, padding: "30px 44px 40px" }}>
          <Parcours cv={cv} accent={accent} />
          <BasDePage cv={cv} accent={accent} />
        </main>
      </div>
    </Sheet>
  );
}

/** Ligne — un filet vertical court sur toute la hauteur, a gauche du corps. */
function Ligne({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "ligne");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "48px 46px" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 22 }}>
          {p.photoUrl && <Photo p={p} taille={72} forme="rect" bordure="#E5E7EB" couleurTexte="#9CA3AF" marge={0} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: 27, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 13, color: accent, fontWeight: 600, marginTop: 4 }}>{p.title}</p>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: "2px 20px" }}>
              <Contacts cv={cv} color="#6B7280" />
            </div>
          </div>
        </header>
        {/* Le filet vertical : il tient le regard du haut au bas de la page. */}
        <div style={{ display: "flex", flex: 1, gap: 26 }}>
          <span style={{ width: 3, background: accent, borderRadius: 2, flexShrink: 0 }} aria-hidden="true" />
          <main style={{ flex: 1, minWidth: 0 }}>
            <Parcours cv={cv} accent={accent} />
            <BasDePage cv={cv} accent={accent} />
          </main>
        </div>
      </div>
    </Sheet>
  );
}

/** Numerote — chaque rubrique porte son numero en gros chiffre. */
function Numerote({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "numerote");
  const p = cv.personalInfo;
  const rubriques: [string, ReactNode][] = [];
  if (cv.summary.trim()) {
    rubriques.push(["Profil", <p key="p" style={{ fontSize: 12.5, lineHeight: 1.65, color: "#374151" }}>{cv.summary}</p>]);
  }
  if (cv.experiences.length) {
    rubriques.push([
      "Experience",
      <div key="e">
        {cv.experiences.map((e) => (
          <div key={e.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{e.title}</p>
              <p style={{ fontSize: 11.5, color: "#6B7280", whiteSpace: "nowrap" }}>{periode(e)}</p>
            </div>
            <p style={{ fontSize: 12, color: "#6B7280" }}>{[e.company, e.location].filter(Boolean).join(", ")}</p>
            <ul style={{ marginTop: 5, paddingLeft: 14 }}>
              {e.bullets.filter(Boolean).map((b, i) => (
                <li key={i} style={{ fontSize: 12, lineHeight: 1.6, color: "#374151", listStyle: "disc" }}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>,
    ]);
  }
  if (cv.education.length) {
    rubriques.push([
      "Formation",
      <div key="f">
        {cv.education.map((f) => (
          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 9 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{f.degree}</p>
              <p style={{ fontSize: 11.5, color: "#6B7280" }}>{[f.school, f.location].filter(Boolean).join(", ")}</p>
            </div>
            <p style={{ fontSize: 11.5, color: "#6B7280", whiteSpace: "nowrap" }}>{periode({ ...f, isCurrent: false })}</p>
          </div>
        ))}
      </div>,
    ]);
  }
  if (cv.skills.length || cv.languages.length) {
    rubriques.push([
      "Competences",
      <div key="c">
        {cv.skills.length > 0 && <p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151" }}>{cv.skills.join(" · ")}</p>}
        {cv.languages.length > 0 && (
          <p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151", marginTop: 5 }}>
            {cv.languages.map((l) => `${l.name} (${l.level}/5)`).join(" · ")}
          </p>
        )}
      </div>,
    ]);
  }

  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "48px 46px" }}>
        <header style={{ borderBottom: `3px solid ${accent}`, paddingBottom: 18, marginBottom: 26 }}>
          <h1 style={{ fontSize: 29, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
            {fullName(p) || "Ton nom"}
          </h1>
          <p style={{ fontSize: 13.5, color: accent, fontWeight: 600, marginTop: 5 }}>{p.title}</p>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: "2px 20px" }}>
            <Contacts cv={cv} color="#6B7280" />
            {p.location.trim() && (
              <p style={{ display: "flex", gap: 8, fontSize: 11, color: "#6B7280" }}>
                <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
                <span>{p.location}</span>
              </p>
            )}
          </div>
        </header>
        {/* Les numeros disent l'ORDRE de lecture — ils ne sont pas decoratifs :
            profil, puis experience, puis formation. */}
        {rubriques.map(([titre, contenu], i) => (
          <section key={titre} style={{ display: "flex", gap: 18, marginBottom: 22 }}>
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: `${accent}33`,
                lineHeight: 1,
                width: 42,
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: accent, marginBottom: 10 }}>
                {titre}
              </h2>
              {contenu}
            </div>
          </section>
        ))}
      </div>
    </Sheet>
  );
}

/** Carte — chaque rubrique dans son propre encadre. */
function Carte({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "carte");
  const p = cv.personalInfo;
  const encadre = {
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 18,
    marginBottom: 14,
    background: "#fff",
  };
  return (
    <Sheet bg="#F7F8FA">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 38px" }}>
        <header style={{ ...encadre, display: "flex", alignItems: "center", gap: 20, borderTop: `3px solid ${accent}` }}>
          {p.photoUrl && <Photo p={p} taille={76} forme="cercle" bordure="#E5E7EB" couleurTexte="#9CA3AF" marge={0} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: 25, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 13, color: accent, fontWeight: 600, marginTop: 4 }}>{p.title}</p>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: "2px 20px" }}>
              <Contacts cv={cv} color="#6B7280" />
            </div>
          </div>
        </header>
        <div style={{ ...encadre, flex: 1 }}>
          <Parcours cv={cv} accent={accent} />
        </div>
        {(cv.skills.length > 0 || cv.languages.length > 0) && (
          <div style={encadre}>
            <BasDePage cv={cv} accent={accent} />
          </div>
        )}
      </div>
    </Sheet>
  );
}

/** Journal — serif, nom en capitales espacees, filets fins. */
function Journal({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "journal");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "46px 50px",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <header style={{ textAlign: "center", borderTop: `3px solid ${accent}`, borderBottom: `1px solid ${accent}`, padding: "18px 0" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: "#111827" }}>
            {fullName(p) || "Ton nom"}
          </h1>
          <p style={{ fontSize: 12.5, letterSpacing: 1.6, textTransform: "uppercase", color: accent, marginTop: 7 }}>
            {p.title}
          </p>
        </header>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "2px 22px", padding: "12px 0 22px", borderBottom: "1px solid #E5E7EB" }}>
          <Contacts cv={cv} color="#4B5563" />
          {p.location.trim() && (
            <p style={{ display: "flex", gap: 8, fontSize: 11, color: "#4B5563" }}>
              <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
              <span>{p.location}</span>
            </p>
          )}
        </div>
        <main style={{ flex: 1, paddingTop: 22 }}>
          <Parcours cv={cv} accent={accent} />
          <BasDePage cv={cv} accent={accent} />
        </main>
      </div>
    </Sheet>
  );
}

/** Signature — les coordonnees passent en pied de page. */
function SignatureCV({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "signature");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: "50px 46px 26px" }}>
          <header style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#111827", lineHeight: 1.05 }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 14, color: accent, fontWeight: 600, marginTop: 6 }}>{p.title}</p>
          </header>
          <Parcours cv={cv} accent={accent} />
          <BasDePage cv={cv} accent={accent} />
        </div>
        {/* Bandeau de pied : les coordonnees restent la derniere chose lue,
            juste avant que le recruteur decroche son telephone. */}
        <footer
          style={{
            background: accent,
            color: "#fff",
            padding: "16px 46px",
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 26px",
            alignItems: "center",
          }}
        >
          <Contacts cv={cv} color="rgba(255,255,255,.92)" />
          {p.location.trim() && (
            <p style={{ display: "flex", gap: 8, fontSize: 11, color: "rgba(255,255,255,.92)" }}>
              <span style={{ opacity: 0.7, width: 14 }} aria-hidden="true">◉</span>
              <span>{p.location}</span>
            </p>
          )}
        </footer>
      </div>
    </Sheet>
  );
}

/** Arche — une arche coloree derriere l'en-tete. */
function Arche({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "arche");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 250,
            background: accent,
            borderBottomLeftRadius: "50% 70px",
            borderBottomRightRadius: "50% 70px",
          }}
        />
        <header style={{ position: "relative", textAlign: "center", padding: "38px 46px 30px", color: "#fff" }}>
          {p.photoUrl && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Photo p={p} taille={82} forme="cercle" bordure="rgba(255,255,255,.7)" couleurTexte="#fff" marge={14} />
            </div>
          )}
          <h1 style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.1 }}>{fullName(p) || "Ton nom"}</h1>
          <p style={{ fontSize: 13.5, opacity: 0.9, marginTop: 5 }}>{p.title}</p>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "2px 22px" }}>
            <Contacts cv={cv} color="rgba(255,255,255,.92)" />
          </div>
        </header>
        <main style={{ position: "relative", flex: 1, padding: "26px 46px 40px" }}>
          <Parcours cv={cv} accent={accent} />
          <BasDePage cv={cv} accent={accent} />
        </main>
      </div>
    </Sheet>
  );
}

/** Grille — filets fins, structure modulaire stricte. */
function Grille({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "grille");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 40 }}>
        <div style={{ flex: 1, border: "1px solid #E5E7EB", display: "flex", flexDirection: "column" }}>
          <header style={{ borderBottom: "1px solid #E5E7EB", padding: "26px 28px" }}>
            <h1 style={{ fontSize: 25, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 13, color: accent, fontWeight: 600, marginTop: 4 }}>{p.title}</p>
          </header>
          <div style={{ display: "flex", flex: 1 }}>
            <aside style={{ width: 216, borderRight: "1px solid #E5E7EB", padding: "24px 20px" }}>
              {p.photoUrl && (
                <Photo p={p} taille={96} forme="rect" bordure="#E5E7EB" couleurTexte="#9CA3AF" marge={18} />
              )}
              <ColonneLaterale cv={cv} texte="#4B5563" titre={accent} off="#D1D5DB" />
            </aside>
            <main style={{ flex: 1, minWidth: 0, padding: "24px 26px" }}>
              <Parcours cv={cv} accent={accent} />
            </main>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/* ============================= Selection ============================= */

/* ================== Serie « maquettes professionnelles » ==================
 *
 * Dix mises en page reprenant les codes des modeles de CV que le public
 * reconnait : colonne a bord courbe, rubriques en pilules pleines, cartes
 * blanches sur fond gris, photo en medaillon a cheval sur le bandeau.
 *
 * Ce sont les STRUCTURES qui sont reprises — proportions, hierarchie, place
 * de la photo, rythme des rubriques — jamais un fichier.
 *
 * Toutes suivent les memes regles que le reste de la serie : une seule
 * couleur d'accent, marges tenues, lisible imprime en noir et blanc. Un CV
 * finit sur le bureau d'un recruteur, souvent photocopie.
 */

/** Vague — colonne sombre a bord courbe, la mise en page la plus repandue. */
function Vague({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "vague");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <aside
        style={{
          width: 252,
          background: accent,
          color: "#fff",
          padding: "44px 24px 40px",
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        {/* La courbe deborde sur le corps : la colonne passe donc au-dessus. */}
        <BordCourbe couleur={accent} />

        <div style={{ display: "grid", placeItems: "center", marginBottom: 22 }}>
          <Photo p={p} taille={104} forme="cercle" bordure="rgba(255,255,255,.55)" couleurTexte="#fff" marge={0} />
        </div>

        <HSide>Contact</HSide>
        <ContactsPastilles cv={cv} texte="rgba(255,255,255,.94)" fond="rgba(255,255,255,.16)" encre="#fff" />

        {cv.skills.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <HSide>Competences</HSide>
            <Competences cv={cv} texte="#ffffff" remplissage="#ffffff" piste="rgba(255,255,255,.26)" />
          </div>
        )}

        {cv.languages.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <HSide>Langues</HSide>
            {cv.languages.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                <span style={{ fontSize: 11.5 }}>{l.name}</span>
                <Bars level={l.level} color="#fff" off="rgba(255,255,255,.3)" />
              </div>
            ))}
          </div>
        )}
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: "44px 38px 40px 62px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1, color: "#111827" }}>
          {fullName(p) || "Ton nom"}
        </h1>
        {p.title.trim() && (
          <p style={{ fontSize: 13.5, color: accent, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 7 }}>
            {p.title}
          </p>
        )}
        <span style={{ display: "block", width: 62, height: 3, background: accent, borderRadius: 2, margin: "16px 0 22px" }} />
        <Parcours cv={cv} accent={accent} />
      </main>
    </Sheet>
  );
}

/** Fiche — cartes blanches posees sur un fond gris, bandeau colore en tete. */
function Fiche({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "fiche");
  const p = cv.personalInfo;
  return (
    <Sheet bg="#EEF1F5">
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ background: accent, color: "#fff", padding: "30px 40px", display: "flex", alignItems: "center", gap: 22 }}>
          <Photo p={p} taille={86} forme="cercle" bordure="rgba(255,255,255,.6)" couleurTexte="#fff" marge={0} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.1 }}>{fullName(p) || "Ton nom"}</h1>
            <p style={{ fontSize: 13, opacity: 0.9, marginTop: 5, letterSpacing: 1.2, textTransform: "uppercase" }}>
              {p.title}
            </p>
          </div>
        </header>

        <div style={{ flex: 1, padding: "20px 30px 28px", display: "flex", gap: 18, alignItems: "flex-start" }}>
          <div style={{ width: 226, flexShrink: 0 }}>
            <CarteBlanche>
              <H color={accent}>Contact</H>
              <ContactsPastilles cv={cv} texte="#374151" fond={accent + "1A"} encre={accent} />
            </CarteBlanche>

            {cv.skills.length > 0 && (
              <CarteBlanche>
                <H color={accent}>Competences</H>
                <Competences cv={cv} texte="#374151" remplissage={accent} piste="#E5E7EB" />
              </CarteBlanche>
            )}

            {cv.languages.length > 0 && (
              <CarteBlanche marge={0}>
                <H color={accent}>Langues</H>
                {cv.languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                    <Bars level={l.level} color={accent} off="#E5E7EB" />
                  </div>
                ))}
              </CarteBlanche>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <CarteBlanche marge={0}>
              <Parcours cv={cv} accent={accent} />
            </CarteBlanche>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** Pilule — chaque rubrique annoncee par un titre en pilule pleine. */
function Pilule({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "pilule");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "40px 44px 22px", display: "flex", alignItems: "center", gap: 22 }}>
          <Photo p={p} taille={94} forme="cercle" bordure={accent} couleurTexte={accent} marge={0} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1, color: accent }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 13, color: "#4B5563", marginTop: 6, letterSpacing: 1.4, textTransform: "uppercase" }}>
              {p.title}
            </p>
          </div>
        </header>

        <div style={{ flex: 1, padding: "0 44px 40px", display: "flex", gap: 26, alignItems: "flex-start" }}>
          <div style={{ width: 214, flexShrink: 0 }}>
            <HPilule fond={accent} encre="#fff">Contact</HPilule>
            <ContactsPastilles cv={cv} texte="#374151" fond={accent + "1A"} encre={accent} />

            {cv.skills.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <HPilule fond={accent} encre="#fff">Competences</HPilule>
                <Competences cv={cv} texte="#374151" remplissage={accent} piste="#E5E7EB" />
              </div>
            )}

            {cv.languages.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <HPilule fond={accent} encre="#fff">Langues</HPilule>
                {cv.languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                    <Dots level={l.level} color={accent} off="#E5E7EB" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {cv.summary.trim() && (
              <section style={{ marginBottom: 18 }}>
                <HPilule fond={accent} encre="#fff">Profil</HPilule>
                <p style={{ fontSize: 12, lineHeight: 1.7, color: "#374151" }}>{cv.summary}</p>
              </section>
            )}
            <Parcours cv={cv} accent={accent} />
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** Medaillon — photo ronde a cheval sur le bandeau, comme les maquettes. */
function Medaillon({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "medaillon");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ background: accent, color: "#fff", padding: "36px 44px 46px", position: "relative" }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, paddingRight: 140 }}>
            {fullName(p) || "Ton nom"}
          </h1>
          <p style={{ fontSize: 13, opacity: 0.9, marginTop: 7, letterSpacing: 1.5, textTransform: "uppercase", paddingRight: 140 }}>
            {p.title}
          </p>
          {/* A cheval sur le bord bas du bandeau : le medaillon deborde de
              moitie sur le corps blanc, exactement comme sur les maquettes. */}
          <div style={{ position: "absolute", right: 44, top: 30 }}>
            <Photo p={p} taille={112} forme="cercle" bordure="#ffffff" couleurTexte="#fff" marge={0} />
          </div>
        </header>

        <div style={{ flex: 1, padding: "26px 44px 40px", display: "flex", gap: 28, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Parcours cv={cv} accent={accent} />
          </div>
          <div style={{ width: 210, flexShrink: 0 }}>
            <H color={accent}>Contact</H>
            <ContactsPastilles cv={cv} texte="#374151" fond={accent} encre="#fff" />

            {cv.skills.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <H color={accent}>Competences</H>
                <Competences cv={cv} texte="#374151" remplissage={accent} piste="#E5E7EB" />
              </div>
            )}

            {cv.languages.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <H color={accent}>Langues</H>
                {cv.languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                    <Dots level={l.level} color={accent} off="#E5E7EB" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** Biseau — angles coupes en haut a gauche et en bas a droite. */
function Biseau({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "biseau");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Deux triangles obtenus par des bordures : aucune image, rien a
            charger, et le trace survit a la capture du PDF. */}
        <span
          aria-hidden="true"
          style={{ position: "absolute", top: 0, left: 0, width: 0, height: 0, borderTop: "168px solid " + accent, borderRight: "168px solid transparent" }}
        />
        <span
          aria-hidden="true"
          style={{ position: "absolute", bottom: 0, right: 0, width: 0, height: 0, borderBottom: "120px solid " + accent + "22", borderLeft: "120px solid transparent" }}
        />

        <header style={{ padding: "44px 44px 20px", display: "flex", alignItems: "flex-start", gap: 24, position: "relative" }}>
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 104 }}>
            <h1 style={{ fontSize: 31, fontWeight: 800, lineHeight: 1.1, color: "#111827" }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 13, color: accent, fontWeight: 700, marginTop: 6, letterSpacing: 1.4, textTransform: "uppercase" }}>
              {p.title}
            </p>
          </div>
          <Photo p={p} taille={96} forme="rect" bordure={accent} couleurTexte={accent} marge={0} />
        </header>

        <div style={{ flex: 1, padding: "8px 44px 44px", display: "flex", gap: 28, alignItems: "flex-start", position: "relative" }}>
          <div style={{ width: 208, flexShrink: 0 }}>
            <HPilule fond={accent} encre="#fff">Contact</HPilule>
            <ContactsPastilles cv={cv} texte="#374151" fond={accent + "1A"} encre={accent} />

            {cv.skills.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <HPilule fond={accent} encre="#fff">Competences</HPilule>
                <Competences cv={cv} texte="#374151" remplissage={accent} piste="#E5E7EB" />
              </div>
            )}

            {cv.languages.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <HPilule fond={accent} encre="#fff">Langues</HPilule>
                {cv.languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                    <Bars level={l.level} color={accent} off="#E5E7EB" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Parcours cv={cv} accent={accent} />
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** Ruban — colonne sombre, photo cerclee, rubriques a pastille. */
function Ruban({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "ruban");
  const p = cv.personalInfo;
  const encreColonne = "#0F172A";
  return (
    <Sheet>
      <aside style={{ width: 262, background: encreColonne, color: "#fff", padding: "40px 26px", flexShrink: 0 }}>
        <div style={{ display: "grid", placeItems: "center", marginBottom: 20 }}>
          {/* L'anneau est un fond colore debordant de la photo : deux cadres
              concentriques auraient fait un second reglage a tenir. */}
          <span style={{ padding: 5, borderRadius: 9999, background: accent, display: "inline-flex" }}>
            <Photo p={p} taille={102} forme="cercle" bordure={encreColonne} couleurTexte="#fff" marge={0} />
          </span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, textAlign: "center" }}>
          {fullName(p) || "Ton nom"}
        </h1>
        <p style={{ fontSize: 11.5, color: accent, textAlign: "center", marginTop: 6, letterSpacing: 1.3, textTransform: "uppercase" }}>
          {p.title}
        </p>

        <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,.16)", margin: "22px 0" }} />
        <HSide color={accent}>Contact</HSide>
        <ContactsPastilles cv={cv} texte="rgba(255,255,255,.9)" fond={accent} encre="#fff" />

        {cv.skills.length > 0 && (
          <>
            <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,.16)", margin: "22px 0" }} />
            <HSide color={accent}>Competences</HSide>
            <Competences cv={cv} texte="rgba(255,255,255,.92)" remplissage={accent} piste="rgba(255,255,255,.18)" />
          </>
        )}

        {cv.languages.length > 0 && (
          <>
            <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,.16)", margin: "22px 0" }} />
            <HSide color={accent}>Langues</HSide>
            {cv.languages.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                <span style={{ fontSize: 11.5 }}>{l.name}</span>
                <Dots level={l.level} color={accent} off="rgba(255,255,255,.22)" />
              </div>
            ))}
          </>
        )}
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: "44px 36px" }}>
        <Parcours cv={cv} accent={accent} />
      </main>
    </Sheet>
  );
}

/** Entete — formes angulaires en tete, a la maniere d'un papier a en-tete. */
function Entete({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "entete");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ position: "relative", height: 150, flexShrink: 0, overflow: "hidden" }}>
          <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: accent }} />
          {/* Le biseau clair qui traverse le bandeau : une seule forme posee
              de biais. Deux triangles superposes bougeaient a l'export. */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute", top: 0, right: 0, width: 300, height: "100%",
              background: "rgba(255,255,255,.14)", transform: "skewX(-18deg)", transformOrigin: "top right",
            }}
          />
          <div style={{ position: "relative", padding: "34px 44px", display: "flex", alignItems: "center", gap: 22 }}>
            <Photo p={p} taille={82} forme="cercle" bordure="rgba(255,255,255,.7)" couleurTexte="#fff" marge={0} />
            <div style={{ flex: 1, minWidth: 0, color: "#fff" }}>
              <h1 style={{ fontSize: 29, fontWeight: 800, lineHeight: 1.1 }}>{fullName(p) || "Ton nom"}</h1>
              <p style={{ fontSize: 12.5, opacity: 0.92, marginTop: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {p.title}
              </p>
            </div>
          </div>
        </header>

        <div style={{ background: "#F3F4F6", padding: "12px 44px", display: "flex", flexWrap: "wrap", gap: "6px 26px" }}>
          <ContactsPastilles cv={cv} texte="#374151" fond={accent} encre="#fff" taille={10.5} />
        </div>

        <main style={{ flex: 1, padding: "26px 44px 40px" }}>
          <Parcours cv={cv} accent={accent} />
          {(cv.skills.length > 0 || cv.languages.length > 0) && (
            <section style={{ marginTop: 20, display: "flex", gap: 32, alignItems: "flex-start" }}>
              {cv.skills.length > 0 && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <H color={accent}>Competences</H>
                  <Competences cv={cv} texte="#374151" remplissage={accent} piste="#E5E7EB" />
                </div>
              )}
              {cv.languages.length > 0 && (
                <div style={{ width: 210, flexShrink: 0 }}>
                  <H color={accent}>Langues</H>
                  {cv.languages.map((l) => (
                    <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                      <Bars level={l.level} color={accent} off="#E5E7EB" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </Sheet>
  );
}

/** Tandem — bandeau clair pleine largeur, puis deux colonnes egales. */
function Tandem({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "tandem");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ borderBottom: "4px solid " + accent, padding: "44px 44px 24px", display: "flex", gap: 24, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.05, color: "#111827", letterSpacing: -0.5 }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 13.5, color: accent, fontWeight: 700, marginTop: 8, letterSpacing: 2, textTransform: "uppercase" }}>
              {p.title}
            </p>
          </div>
          <Photo p={p} taille={92} forme="rect" bordure={accent + "55"} couleurTexte={accent} marge={0} />
        </header>

        <div style={{ background: "#F9FAFB", padding: "14px 44px", display: "flex", flexWrap: "wrap", gap: "6px 24px" }}>
          <ContactsPastilles cv={cv} texte="#374151" fond={accent + "1A"} encre={accent} taille={10.5} />
        </div>

        <div style={{ flex: 1, padding: "24px 44px 40px", display: "flex", gap: 30, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Parcours cv={cv} accent={accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {cv.skills.length > 0 && (
              <section style={{ marginBottom: 20 }}>
                <H color={accent}>Competences</H>
                <Competences cv={cv} texte="#374151" remplissage={accent} piste="#E5E7EB" />
              </section>
            )}
            {cv.languages.length > 0 && (
              <section>
                <H color={accent}>Langues</H>
                {cv.languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                    <Bars level={l.level} color={accent} off="#E5E7EB" />
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** Relief — colonne teintee tres claire, photo rectangulaire au format officiel. */
function Relief({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "relief");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <aside style={{ width: 248, background: accent + "0F", padding: "40px 24px", flexShrink: 0 }}>
        <Photo p={p} taille={98} forme="rect" bordure={accent + "55"} couleurTexte={accent} marge={20} />
        <h1 style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.15, color: "#111827" }}>
          {fullName(p) || "Ton nom"}
        </h1>
        <p style={{ fontSize: 12, color: accent, fontWeight: 700, marginTop: 6, letterSpacing: 1.2, textTransform: "uppercase" }}>
          {p.title}
        </p>

        <div style={{ marginTop: 24 }}>
          <H color={accent}>Contact</H>
          <ContactsPastilles cv={cv} texte="#374151" fond={accent} encre="#fff" />
        </div>

        {cv.skills.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <H color={accent}>Competences</H>
            {/* La piste est BLANCHE et non grise : sur un fond deja teinte, un
                gris clair se confondrait avec le fond et la barre semblerait
                pleine a tous les niveaux. */}
            <Competences cv={cv} texte="#374151" remplissage={accent} piste="#FFFFFF" />
          </div>
        )}

        {cv.languages.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <H color={accent}>Langues</H>
            {cv.languages.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                <Dots level={l.level} color={accent} off="#FFFFFF" />
              </div>
            ))}
          </div>
        )}
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: "40px 36px" }}>
        <Parcours cv={cv} accent={accent} />
      </main>
    </Sheet>
  );
}

/** Sillon — rubriques separees par un filet plein, sans colonne. */
function Sillon({ cv }: { cv: CVContent }) {
  const accent = accentDe(cv.accent, "sillon");
  const p = cv.personalInfo;
  return (
    <Sheet>
      <div style={{ flex: 1, minWidth: 0, padding: "46px 52px 40px" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 24, paddingBottom: 20, borderBottom: "3px solid " + accent }}>
          <Photo p={p} taille={90} forme="cercle" bordure={accent} couleurTexte={accent} marge={0} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.05, color: "#111827" }}>
              {fullName(p) || "Ton nom"}
            </h1>
            <p style={{ fontSize: 13, color: "#4B5563", marginTop: 7, letterSpacing: 1.6, textTransform: "uppercase" }}>
              {p.title}
            </p>
          </div>
        </header>

        <div style={{ padding: "14px 0", borderBottom: "1px solid #E5E7EB", display: "flex", flexWrap: "wrap", gap: "6px 26px" }}>
          <ContactsPastilles cv={cv} texte="#374151" fond={accent} encre="#fff" taille={10.5} />
        </div>

        <div style={{ paddingTop: 20 }}>
          <Parcours cv={cv} accent={accent} />
        </div>

        {(cv.skills.length > 0 || cv.languages.length > 0) && (
          <section style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid #E5E7EB", display: "flex", gap: 34, alignItems: "flex-start" }}>
            {cv.skills.length > 0 && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <H color={accent}>Competences</H>
                <Competences cv={cv} texte="#374151" remplissage={accent} piste="#E5E7EB" taille={12} />
              </div>
            )}
            {cv.languages.length > 0 && (
              <div style={{ width: 220, flexShrink: 0 }}>
                <H color={accent}>Langues</H>
                {cv.languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, color: "#374151" }}>{l.name}</span>
                    <Bars level={l.level} color={accent} off="#E5E7EB" />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </Sheet>
  );
}

const GABARITS: Record<TemplateId, (p: { cv: CVContent }) => JSX.Element> = {
  moderne: Moderne,
  classique: Classique,
  minimal: Minimal,
  etudiant: Etudiant,
  africain: Africain,
  bandeau: Bandeau,
  elegant: Elegant,
  duo: Duo,
  executif: Executif,
  chrono: Chrono,
  compact: Compact,
  cadre: Cadre,
  mosaique: Mosaique,
  diagonale: Diagonale,
  nuit: Nuit,
  neon: Neon,
  cyber: Cyber,
  miroir: Miroir,
  portrait: Portrait,
  bicolore: Bicolore,
  ligne: Ligne,
  numerote: Numerote,
  carte: Carte,
  journal: Journal,
  signature: SignatureCV,
  arche: Arche,
  grille: Grille,
  vague: Vague,
  fiche: Fiche,
  pilule: Pilule,
  medaillon: Medaillon,
  biseau: Biseau,
  ruban: Ruban,
  entete: Entete,
  tandem: Tandem,
  relief: Relief,
  sillon: Sillon,
};

export default function CVSheet({ cv, template }: { cv: CVContent; template: TemplateId }) {
  const Gabarit = GABARITS[template] || Moderne;
  // La police est posee ICI et une seule fois : les gabarits l heritent. La
  // faire passer en parametre a travers chacun aurait garanti qu on en
  // oublie un, et ce gabarit-la serait sorti dans une autre police que
  // l apercu.
  return (
    <div style={{ fontFamily: policeDe(cv.police) }}>
      <Gabarit cv={cv} />
    </div>
  );
}
