"use client";

/**
 * Ma Carriere — les quatre mises en page de CV.
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
  periode,
  type CVContent,
  type Langue,
  type TemplateId,
} from "@/lib/carriere";

const PAGE_W = 794;
const PAGE_H = 1123;
const BLEED = -53;

/** Feuille pleine page, marge de la feuille annulee. */
function Sheet({ children, bg = "#ffffff" }: { children: ReactNode; bg?: string }) {
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
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
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
function Parcours({ cv, accent }: { cv: CVContent; accent: string }) {
  return (
    <>
      {cv.summary.trim() && (
        <section style={{ marginBottom: 22 }}>
          <H color={accent}>Profil</H>
          <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "#374151" }}>{cv.summary}</p>
        </section>
      )}

      {cv.experiences.length > 0 && (
        <section style={{ marginBottom: 22 }}>
          <H color={accent}>Experience professionnelle</H>
          {cv.experiences.map((e) => (
            <div key={e.id} style={{ marginBottom: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{e.title}</p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>
                    {[e.company, e.location].filter(Boolean).join(", ")}
                  </p>
                </div>
                <p style={{ fontSize: 11.5, color: "#6B7280", whiteSpace: "nowrap" }}>{periode(e)}</p>
              </div>
              <ul style={{ marginTop: 6, paddingLeft: 14 }}>
                {e.bullets.filter(Boolean).map((b, i) => (
                  <li key={i} style={{ fontSize: 12, lineHeight: 1.6, color: "#374151", listStyle: "disc" }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {cv.education.length > 0 && (
        <section style={{ marginBottom: 22 }}>
          <H color={accent}>Formation</H>
          {cv.education.map((f) => (
            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{f.degree}</p>
                <p style={{ fontSize: 11.5, color: "#6B7280" }}>
                  {[f.school, f.location].filter(Boolean).join(", ")}
                </p>
              </div>
              <p style={{ fontSize: 11.5, color: "#6B7280", whiteSpace: "nowrap" }}>{periode({ ...f, isCurrent: false })}</p>
            </div>
          ))}
        </section>
      )}

      {cv.atouts.length > 0 && (
        <section>
          <H color={accent}>Atouts</H>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px" }}>
            {cv.atouts.map((a, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#374151" }}>
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
            <ul style={{ paddingLeft: 14 }}>
              {cv.skills.map((s, i) => (
                <li key={i} style={{ fontSize: 11.5, lineHeight: 1.9, listStyle: "disc" }}>
                  {s}
                </li>
              ))}
            </ul>
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
                {cv.skills.map((s, i) => (
                  <p key={i} style={{ fontSize: 11.5, color: "#374151", lineHeight: 1.9 }}>
                    {s}
                  </p>
                ))}
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
            {/* Un simple filet dore sous chaque competence, de longueur fixe.
                Les maquettes montraient des barres de longueurs differentes :
                elles se lisent comme un niveau de maitrise, or le formulaire
                ne demande aucun niveau — le CV afficherait une note que le
                candidat n'a jamais donnee. */}
            {cv.skills.map((s, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 11, marginBottom: 4 }}>{s}</p>
                <span style={{ display: "block", width: 34, height: 2, background: or, opacity: 0.7, borderRadius: 2 }} />
              </div>
            ))}
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
              {/* Pas de pastilles ici : elles diraient un niveau de maitrise
                  que le candidat n'a jamais saisi. Seules les LANGUES en
                  portent, parce que leur niveau est reellement demande. */}
              {cv.skills.map((s, i) => (
                <p key={i} style={{ fontSize: 11.5, lineHeight: 1.9 }}>
                  {s}
                </p>
              ))}
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

/* ============================= Selection ============================= */

const GABARITS: Record<TemplateId, (p: { cv: CVContent }) => JSX.Element> = {
  moderne: Moderne,
  classique: Classique,
  executif: Executif,
  africain: Africain,
};

export default function CVSheet({ cv, template }: { cv: CVContent; template: TemplateId }) {
  const Gabarit = GABARITS[template] || Moderne;
  return <Gabarit cv={cv} />;
}
