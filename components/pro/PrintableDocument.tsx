import {
  formatFcfa, formatDate, amountInWords, visibleSections, invoiceTitle,
  TAX_EXEMPT_MENTION, type QuoteItem,
} from "@/lib/pro";
import PrintTrigger from "./PrintTrigger";

/**
 * Devis ou facture au format papier, prêt à imprimer ou à enregistrer en PDF.
 *
 * Pas de librairie PDF : le navigateur sait déjà produire un PDF fidèle via
 * « Imprimer → Enregistrer au format PDF », y compris sur Android. C'est aussi
 * la seule voie viable ici, les fonctions serveur Netlify étant trop limitées
 * pour embarquer un moteur de rendu.
 *
 * Deux mises en page pour un seul balisage :
 *   • écran étroit → chaque prestation devient un bloc lisible au pouce ;
 *   • écran large ET impression → un vrai tableau aligné.
 * Le basculement est purement CSS (voir SHEET_CSS) : le HTML reste un tableau
 * sémantique, et l'impression retrouve toujours sa grille quelle que soit la
 * taille de l'écran depuis lequel on imprime.
 *
 * Les couleurs sont écrites en dur, jamais en classes de thème : ce document
 * doit sortir identique sur papier, que le site soit en clair ou en sombre.
 */

export type PrintDoc = {
  kind: "devis" | "facture";
  number: string | null;
  title: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_amount?: number;
  issue_date?: string | null;
  valid_until?: string | null;
  due_date?: string | null;
  terms?: string | null;
  note?: string | null;
  status: string;
  /** Rubriques recopiées dans la pièce à sa création (voir lib/pro.ts). */
  sections?: unknown;
};

export type PrintParty = {
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_id?: string | null;
  logo?: string | null;
  /* Réglés dans « Profil entreprise » — émetteur seulement. */
  signature?: string | null;
  stamp?: string | null;
  signature_label?: string | null;
  template?: string | null;
  accent?: string | null;
  /** « formel » = immatriculé (NINEA), « informel » = sans papiers. */
  status?: string | null;
  /** Intitulé choisi pour les factures : FACTURE, REÇU ou NOTE. */
  doc_title?: string | null;
};

const ACCENT_DEFAULT = "#4F46E5";

/**
 * Les cinq modèles de document.
 *
 * Ce ne sont PAS cinq nuances d'un même document : chacun change la structure
 * de l'en-tête, la présence d'aplats et le traitement des totaux. Un modèle
 * qui ne ferait varier qu'une couleur n'en serait pas un.
 *
 *   accent   couleur par défaut, écrasée par le choix du professionnel
 *   header   "rule" filet sous l'en-tête · "band" bandeau plein ·
 *            "frame" en-tête encadré · "plain" aucun ornement
 *   tinted   bloc destinataire et totaux légèrement teintés de l'accent
 *   solid    bandeau du total en aplat de couleur (sinon simple filet)
 *   caps     intitulés de colonnes en capitales espacées
 */
type TemplateSpec = {
  accent: string;
  header: "rule" | "band" | "frame" | "plain";
  tinted: boolean;
  solid: boolean;
  caps: boolean;
};

const TEMPLATES: Record<string, TemplateSpec> = {
  // Sobre et sûr : un filet de couleur, des aplats discrets. Le défaut.
  classique: { accent: "#4F46E5", header: "rule", tinted: true, solid: true, caps: false },
  // Titre en couleur, blocs doux, colonnes en capitales — style agence.
  moderne: { accent: "#0891B2", header: "rule", tinted: true, solid: true, caps: true },
  // Bandeau plein en tête : le plus affirmé, très lisible en noir et blanc.
  bande: { accent: "#047857", header: "band", tinted: false, solid: true, caps: true },
  // Minimaliste : aucun aplat, tout à l'encre. Économe à l'impression.
  epure: { accent: "#111827", header: "plain", tinted: false, solid: false, caps: false },
  // Encadré, mentions serrées : l'allure d'une pièce administrative.
  officiel: { accent: "#92400E", header: "frame", tinted: false, solid: false, caps: true },
};

const templateSpec = (id?: string | null): TemplateSpec =>
  TEMPLATES[id || ""] || TEMPLATES.classique;
const INK = "#111827";
const MUTED = "#6B7280";
const LINE = "#E5E7EB";

/** Cartouche d'état, imprimé en couleur d'encre pour rester lisible en N&B. */
const STAMPS: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "PAYÉE", color: "#047857", bg: "#ECFDF5" },
  partial: { label: "PARTIELLEMENT PAYÉE", color: "#1D4ED8", bg: "#EFF6FF" },
  late: { label: "EN RETARD", color: "#B91C1C", bg: "#FEF2F2" },
  cancelled: { label: "ANNULÉE", color: "#6B7280", bg: "#F3F4F6" },
  accepted: { label: "ACCEPTÉ", color: "#047857", bg: "#ECFDF5" },
  refused: { label: "REFUSÉ", color: "#B91C1C", bg: "#FEF2F2" },
  expired: { label: "EXPIRÉ", color: "#6B7280", bg: "#F3F4F6" },
};

const SHEET_CSS = `
  .doc-page { background:#F3F4F6; min-height:100vh; }
  .doc-sheet { background:#fff; color:${INK}; }
  .doc-sheet, .doc-sheet * { color-scheme: light; }

  /* Les navigateurs suppriment les aplats à l'impression pour économiser
     l'encre. Sur les modèles à bandeau ou à total plein, cela effacerait le
     fond en laissant le texte blanc sur blanc — donc illisible. On force donc
     le rendu des couleurs pour ces éléments précis, et eux seuls. */
  .doc-fill {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* ---- Prestations : blocs sur mobile, tableau dès 640px ---- */
  .doc-items { width:100%; border-collapse:collapse; }
  .doc-items thead { display:none; }
  .doc-items tr { display:block; padding:.7rem 0; border-bottom:1px solid ${LINE}; }
  .doc-items td { display:flex; justify-content:space-between; gap:1rem; padding:.15rem 0; font-size:.84rem; }
  .doc-items td::before {
    content: attr(data-label);
    color:${MUTED};
    font-size:.75rem;
    flex:0 0 auto;
  }
  .doc-items td.doc-designation { display:block; font-weight:600; font-size:.9rem; padding-bottom:.3rem; }
  .doc-items td.doc-designation::before { content:none; }

  @media (min-width: 640px) {
    .doc-items thead { display:table-header-group; }
    .doc-items tr { display:table-row; padding:0; }
    .doc-items td { display:table-cell; padding:.6rem .5rem; vertical-align:top; }
    .doc-items td::before { content:none; }
    .doc-items td.doc-designation { display:table-cell; padding:.6rem .5rem; font-size:.84rem; }
    .doc-items .doc-num { text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
    .doc-items .doc-qty { text-align:center; }
  }

  /* ---- Impression : on force la grille, quel que soit l'écran d'origine ---- */
  @page { size: A4; margin: 14mm; }
  @media print {
    .no-print { display:none !important; }
    body, .doc-page { background:#fff !important; min-height:0 !important; padding:0 !important; }
    .doc-sheet {
      box-shadow:none !important; border:0 !important; border-radius:0 !important;
      margin:0 !important; padding:0 !important; max-width:none !important; width:100% !important;
    }
    .doc-items thead { display:table-header-group; }
    .doc-items tr { display:table-row; padding:0; break-inside:avoid; }
    .doc-items td { display:table-cell; padding:.45rem .5rem; vertical-align:top; }
    .doc-items td::before { content:none; }
    .doc-items td.doc-designation { display:table-cell; padding:.45rem .5rem; font-size:.82rem; }
    .doc-items .doc-num { text-align:right; font-variant-numeric:tabular-nums; }
    .doc-items .doc-qty { text-align:center; }
    .doc-avoid { break-inside:avoid; }
    /* La feuille perd son padding a l'impression : les marges negatives du
       bandeau le pousseraient hors de la page. On le remet a plat. */
    .doc-band { margin:0 0 1.2rem 0 !important; padding:1rem 1.1rem !important; }
  }

  /* ---- Aperçu à l'écran (A4Preview) ----
     La feuille A4 fournit déjà la marge de 14 mm : l'article s'y pose sans
     rembourrage. Le bandeau, calé sur des marges négatives pour déborder de
     ce rembourrage, doit donc être remis à plat — exactement comme à
     l'impression, où il se cale sur la marge de page. */
  .doc-preview .doc-band { margin:0 0 1.2rem 0 !important; padding:1rem 1.1rem !important; }
`;

export default function PrintableDocument({
  doc, seller, client, qr, mode = "page",
}: {
  doc: PrintDoc; seller: PrintParty; client: PrintParty | null;
  /** SVG inline (voir lib/qr.ts) menant à la page publique de la pièce. */
  qr?: { svg: string; caption: string } | null;
  /**
   * "page" — document servi seul, sur son fond gris, avec la barre d'impression.
   * "preview" — document nu, destiné à être posé dans une feuille A4 à
   *   l'échelle pendant la saisie (voir A4Preview) : ni fond de page, ni barre,
   *   ni rembourrage, la feuille tenant déjà lieu de marge.
   */
  mode?: "page" | "preview";
}) {
  const preview = mode === "preview";
  const isQuote = doc.kind === "devis";
  // Un devis reste un devis ; l'intitulé choisi ne concerne que les pièces
  // de facturation, où « REÇU » ou « NOTE » convient parfois mieux.
  const label = isQuote ? "DEVIS" : invoiceTitle(seller.doc_title, "FACTURE");
  const paid = doc.paid_amount || 0;
  const remaining = Math.max(0, doc.total - paid);
  const stamp = STAMPS[doc.status];
  const detailed = doc.discount > 0 || doc.tax_rate > 0;
  // Rubriques figées dans la pièce : seules les actives et non vides sortent.
  const sections = visibleSections(doc.sections);

  // Couleur du document : accent choisi, sinon celle du modèle, sinon le
  // défaut. Écrite en dur dans les styles — jamais une classe de thème — pour
  // que le papier sorte identique en mode clair comme en sombre.
  const tpl = templateSpec(seller.template);
  const ACCENT = seller.accent || tpl.accent || ACCENT_DEFAULT;

  // Sur bandeau plein, l'en-tête s'écrit en blanc sur la couleur ; ailleurs à
  // l'encre sur le papier.
  const onBand = tpl.header === "band";
  const headTint = tpl.tinted ? `${ACCENT}0D` : "#F9FAFB"; // 0D ≈ 5 % d'opacité
  const headCaps = tpl.caps ? "tracking-[.12em]" : "tracking-wider";

  const sheet = (
    <article
      className={
        preview
          ? "doc-sheet doc-preview"
          : "doc-sheet overflow-hidden rounded-2xl px-5 py-7 shadow-lg sm:px-10 sm:py-9"
      }
      style={preview ? undefined : { boxShadow: "0 10px 40px rgba(17,24,39,.08)" }}
    >
            {/* ================= En-tête =================
                Cinq traitements distincts : filet, bandeau plein, encadré ou
                rien. Le balisage reste identique — seuls l'habillage et les
                couleurs changent, pour que l'impression et la version mobile
                se comportent pareil quel que soit le modèle. */}
            <header
              className={`doc-avoid ${onBand ? "doc-fill doc-band -mx-5 -mt-7 mb-6 px-5 pb-5 pt-7 sm:-mx-10 sm:-mt-9 sm:px-10 sm:pb-6 sm:pt-9" : ""} ${
                tpl.header === "frame" ? "rounded-lg p-4 sm:p-5" : ""
              }`}
              style={
                onBand
                  ? { background: ACCENT, color: "#fff" }
                  : tpl.header === "frame"
                    ? { border: `1.5px solid ${ACCENT}` }
                    : undefined
              }
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                {/* Émetteur */}
                <div className="flex min-w-0 items-start gap-3">
                  {seller.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={seller.logo}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      style={{ border: `1px solid ${LINE}` }}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-[1.05rem] font-extrabold leading-tight sm:text-[1.15rem]">
                      {seller.company || seller.name}
                    </div>
                    {seller.company && seller.name && (
                      <div className="text-[.82rem]" style={{ color: onBand ? "#FFFFFFCC" : MUTED }}>{seller.name}</div>
                    )}
                    <div
                      className="mt-1.5 space-y-0.5 text-[.78rem] leading-relaxed"
                      style={{ color: onBand ? "#FFFFFFCC" : MUTED }}
                    >
                      {seller.address && <div>{seller.address}</div>}
                      {seller.phone && <div>Tél. {seller.phone}</div>}
                      {seller.email && <div className="break-all">{seller.email}</div>}
                      {seller.tax_id && <div>NINEA {seller.tax_id}</div>}
                    </div>
                  </div>
                </div>

                {/* Identité du document */}
                <div className="shrink-0 sm:text-right">
                  <div
                    className="text-[1.7rem] font-extrabold leading-none tracking-tight sm:text-[2rem]"
                    style={{ color: onBand ? "#fff" : tpl.header === "plain" ? INK : ACCENT }}
                  >
                    {label}
                  </div>
                  {doc.number && (
                    <div className="mt-1 font-mono text-[.9rem] font-bold tracking-wide">{doc.number}</div>
                  )}
                  <div
                    className="mt-2 space-y-0.5 text-[.78rem] leading-relaxed"
                    style={{ color: onBand ? "#FFFFFFCC" : MUTED }}
                  >
                    {doc.issue_date && <div>Émis le {formatDate(doc.issue_date)}</div>}
                    {isQuote && doc.valid_until && <div>Valable jusqu&apos;au {formatDate(doc.valid_until)}</div>}
                    {!isQuote && doc.due_date && (
                      <div className="font-bold" style={{ color: onBand ? "#fff" : INK }}>
                        Échéance : {formatDate(doc.due_date)}
                      </div>
                    )}
                  </div>
                  {stamp && (
                    <div
                      className="mt-2.5 inline-block rounded-md px-2.5 py-1 text-[.68rem] font-extrabold tracking-widest"
                      style={{ color: stamp.color, background: stamp.bg, border: `1px solid ${stamp.color}33` }}
                    >
                      {stamp.label}
                    </div>
                  )}

                  {/* QR vers la page publique : le destinataire vérifie la pièce
                      depuis le papier, sans avoir à ressaisir un lien. */}
                  {qr && (
                    <div className="mt-3 flex items-center gap-2.5 sm:justify-end">
                      <div
                        className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-md bg-white p-[3px]"
                        style={{ border: `1px solid ${LINE}` }}
                        dangerouslySetInnerHTML={{ __html: qr.svg }}
                      />
                      <div
                        className="max-w-[110px] text-left text-[.62rem] leading-snug sm:text-right"
                        style={{ color: onBand ? "#FFFFFFCC" : MUTED }}
                      >
                        {qr.caption}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {tpl.header === "rule" && (
                <div className="mt-5 h-[3px] rounded-full" style={{ background: ACCENT }} />
              )}
              {/* Épuré : un simple cheveu, pas d'aplat — moins d'encre, plus
                  de calme. */}
              {tpl.header === "plain" && (
                <div className="mt-5 h-px" style={{ background: LINE }} />
              )}
            </header>

            {/* ================= Objet et destinataire ================= */}
            <section className="doc-avoid mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <Caption>Objet</Caption>
                <p className="mt-1 text-[1rem] font-bold leading-snug">{doc.title}</p>
              </div>

              {client && (
                <div
                  className="w-full rounded-xl p-4 sm:w-[280px] sm:shrink-0"
                  style={{ background: headTint, border: `1px solid ${tpl.tinted ? `${ACCENT}33` : LINE}` }}
                >
                  <Caption>{isQuote ? "Destinataire" : "Facturé à"}</Caption>
                  <div className="mt-1 text-[.92rem] font-bold leading-snug">
                    {client.company || client.name}
                  </div>
                  {client.company && client.name && (
                    <div className="text-[.8rem]" style={{ color: MUTED }}>{client.name}</div>
                  )}
                  <div className="mt-1 space-y-0.5 text-[.78rem] leading-relaxed" style={{ color: MUTED }}>
                    {client.address && <div>{client.address}</div>}
                    {client.phone && <div>{client.phone}</div>}
                    {client.email && <div className="break-all">{client.email}</div>}
                    {client.tax_id && <div>NINEA {client.tax_id}</div>}
                  </div>
                </div>
              )}
            </section>

            {/* ================= Prestations ================= */}
            <section className="mt-6">
              <table className="doc-items">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${INK}` }}>
                    <th className={`px-2 pb-2 text-left text-[.7rem] font-bold uppercase ${headCaps}`}>Désignation</th>
                    <th className={`w-[64px] px-2 pb-2 text-center text-[.7rem] font-bold uppercase ${headCaps}`}>Qté</th>
                    <th className={`w-[120px] px-2 pb-2 text-right text-[.7rem] font-bold uppercase ${headCaps}`}>P.U.</th>
                    <th className={`w-[130px] px-2 pb-2 text-right text-[.7rem] font-bold uppercase ${headCaps}`}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {(doc.items || []).map((it, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                      <td className="doc-designation">{it.label}</td>
                      <td className="doc-qty" data-label="Quantité">{it.qty}</td>
                      <td className="doc-num" data-label="Prix unitaire">
                        {it.unit_price.toLocaleString("fr-FR")}
                      </td>
                      <td className="doc-num font-semibold" data-label="Montant">
                        {(it.qty * it.unit_price).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* ================= Totaux ================= */}
            <section className="doc-avoid mt-5 flex justify-end">
              <div className="w-full sm:w-[330px]">
                {detailed && (
                  <>
                    <TotalLine label="Sous-total HT" value={formatFcfa(doc.subtotal)} />
                    {doc.discount > 0 && <TotalLine label="Remise" value={`− ${formatFcfa(doc.discount)}`} />}
                    {doc.tax_rate > 0 && (
                      <>
                        <TotalLine label="Base imposable" value={formatFcfa(doc.subtotal - doc.discount)} />
                        <TotalLine label={`TVA ${doc.tax_rate} %`} value={formatFcfa(doc.tax_amount)} />
                      </>
                    )}
                  </>
                )}

                {/* Total : aplat de couleur sur les modèles affirmés, simple
                    encadré sur les modèles sobres — mêmes informations, deux
                    intensités. */}
                <div
                  className={`mt-2 flex items-baseline justify-between gap-3 rounded-lg px-3 py-2.5 ${tpl.solid ? "doc-fill" : ""}`}
                  style={
                    tpl.solid
                      ? { background: ACCENT, color: "#fff" }
                      : { border: `2px solid ${ACCENT}`, color: INK }
                  }
                >
                  <span className="text-[.82rem] font-extrabold tracking-wide">
                    {doc.tax_rate > 0 ? "TOTAL TTC" : "TOTAL"}
                  </span>
                  <span className="font-mono text-[1.1rem] font-extrabold tabular-nums">
                    {formatFcfa(doc.total)}
                  </span>
                </div>

                {!isQuote && paid > 0 && (
                  <div className="mt-2">
                    <TotalLine label="Déjà réglé" value={`− ${formatFcfa(paid)}`} />
                    <div
                      className="mt-1 flex items-baseline justify-between gap-3 pt-2"
                      style={{ borderTop: `1px solid ${LINE}` }}
                    >
                      <span className="text-[.82rem] font-extrabold">RESTE À PAYER</span>
                      <span
                        className="font-mono text-[1.05rem] font-extrabold tabular-nums"
                        style={{ color: remaining > 0 ? "#B91C1C" : "#047857" }}
                      >
                        {formatFcfa(remaining)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Montant en toutes lettres : protège le chiffre contre l'altération. */}
            <p
              className="doc-avoid mt-5 rounded-lg px-3.5 py-2.5 text-[.8rem] leading-relaxed"
              style={{ background: "#F9FAFB", border: `1px solid ${LINE}` }}
            >
              <span style={{ color: MUTED }}>
                {isQuote ? "Devis arrêté à la somme de " : `${label.charAt(0)}${label.slice(1).toLowerCase()} arrêtée à la somme de `}
              </span>
              <span className="font-semibold">{amountInWords(doc.total)} francs CFA</span>
              <span style={{ color: MUTED }}>.</span>

              {/* Régime : une pièce sans TVA doit dire pourquoi, sinon le
                  client se demande si la taxe a simplement été oubliée. */}
              {doc.tax_rate === 0 && (
                <>
                  <br />
                  <span style={{ color: MUTED }}>{TAX_EXEMPT_MENTION}</span>
                </>
              )}
            </p>

            {/* ================= Mentions ================= */}
            {(doc.terms || doc.note) && (
              <section
                className="doc-avoid mt-6 space-y-4 pt-5 text-[.82rem] leading-relaxed"
                style={{ borderTop: `1px solid ${LINE}` }}
              >
                {doc.terms && (
                  <div>
                    <Caption>Conditions de paiement</Caption>
                    <p className="mt-1 whitespace-pre-line">{doc.terms}</p>
                  </div>
                )}
                {doc.note && (
                  <div>
                    <Caption>Note</Caption>
                    <p className="mt-1 whitespace-pre-line" style={{ color: MUTED }}>{doc.note}</p>
                  </div>
                )}
              </section>
            )}

            {/* ================= Rubriques réutilisables =================
                Déroulé de la mission, conditions, modalités de paiement…
                Réglées une fois par le professionnel, recopiées dans la pièce
                à sa création (donc figées : retoucher ses réglages ne modifie
                pas un devis déjà envoyé). */}
            {sections.length > 0 && (
              <section
                className="mt-6 pt-5"
                style={{ borderTop: `1px solid ${LINE}` }}
              >
                {sections.map((s) => (
                  <div key={s.key} className="doc-avoid mb-5 last:mb-0">
                    <Caption>{s.icon ? `${s.icon} ${s.title}` : s.title}</Caption>
                    <div className="mt-2 space-y-2">
                      {s.items.map((it, i) => (
                        <div key={i} className="text-[.82rem] leading-relaxed">
                          {it.label && <span className="font-bold">{it.label}</span>}
                          {it.label && it.body && <span style={{ color: MUTED }}> — </span>}
                          {it.body && (
                            <span className="whitespace-pre-line" style={{ color: MUTED }}>{it.body}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* ================= Signatures =================
                Sur un devis, le client doit pouvoir signer : on lui garde un
                emplacement vierge. Sur une facture, seul l'émetteur signe. */}
            {(isQuote || seller.signature || seller.stamp) && (
              <section
                className="doc-avoid mt-7 flex flex-col gap-6 pt-5 text-[.8rem] sm:flex-row sm:justify-between"
                style={{ borderTop: `1px solid ${LINE}` }}
              >
                {isQuote && (
                  <div>
                    <div className="font-bold">Bon pour accord</div>
                    <div style={{ color: MUTED }}>Date et signature du client</div>
                    <div className="mt-12 w-[190px]" style={{ borderBottom: `1px solid #9CA3AF` }} />
                  </div>
                )}

                <div className={isQuote ? "sm:text-right" : "sm:ml-auto sm:text-right"}>
                  <div className="font-bold">{seller.company || seller.name}</div>
                  <div style={{ color: MUTED }}>{seller.signature_label || "Le prestataire"}</div>

                  {seller.signature || seller.stamp ? (
                    // Signature et cachet se chevauchent légèrement, comme sur
                    // un document réellement tamponné.
                    <div className="relative mt-2 flex h-[86px] items-end justify-start sm:justify-end">
                      {seller.signature && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={seller.signature} alt="Signature" className="h-[62px] object-contain" />
                      )}
                      {seller.stamp && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={seller.stamp}
                          alt="Cachet"
                          className="h-[78px] w-[78px] object-contain"
                          style={{ marginLeft: seller.signature ? "-18px" : 0, opacity: 0.92 }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="mt-12 w-[190px] sm:ml-auto" style={{ borderBottom: `1px solid #9CA3AF` }} />
                  )}
                </div>
              </section>
            )}

            <footer className="mt-8 text-center text-[.68rem]" style={{ color: "#9CA3AF" }}>
              {doc.number ? `${label.toLowerCase()} ${doc.number} · ` : ""}
              document généré sur wanteermako.com — Espace Freelancer
            </footer>
    </article>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHEET_CSS }} />

      {preview ? (
        sheet
      ) : (
        <div className="doc-page px-3 py-4 sm:px-5 sm:py-8">
          <div className="mx-auto max-w-[820px]">
            <PrintTrigger kind={doc.kind} />
            {sheet}
          </div>
        </div>
      )}
    </>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[.65rem] font-bold uppercase tracking-[.14em]" style={{ color: MUTED }}>
      {children}
    </div>
  );
}

function TotalLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-[.83rem]">
      <span style={{ color: MUTED }}>{label}</span>
      <span className="font-mono font-semibold tabular-nums">{value}</span>
    </div>
  );
}
