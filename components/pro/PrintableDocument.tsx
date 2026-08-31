import {
  formatFcfa, formatDate, amountInWords, visibleSections, invoiceTitle,
  docTemplate, TAX_EXEMPT_MENTION, type QuoteItem,
} from "@/lib/pro";

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
  .doc-fill,
  .doc-items thead tr,
  .doc-items tbody tr {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* ================== TABLEAU DE FACTURATION ==================
     C'est la piece maitresse : le client la lit avant tout le reste, et c'est
     elle qu'il verifie. Elle porte donc la SEULE bordure coloree de la page —
     partout ailleurs les filets restent gris. Impossible de la manquer, et
     impossible de la confondre avec un autre bloc.

     Deux mises en page pour un seul balisage : blocs lisibles au pouce sous
     640 px, vrai tableau au-dessus (et toujours a l'impression). */
  .doc-items {
    width:100%;
    border-collapse:collapse;
    font-variant-numeric:tabular-nums;
  }
  .doc-items thead { display:none; }
  .doc-items tbody tr { display:block; padding:.7rem .75rem; border-bottom:1px solid ${LINE}; }
  .doc-items td { display:flex; justify-content:space-between; gap:1rem; padding:.18rem 0; font-size:.86rem; }
  .doc-items td::before {
    content: attr(data-label);
    color:${MUTED};
    font-size:.78rem;
    flex:0 0 auto;
  }
  .doc-items td.doc-designation { display:block; font-weight:700; font-size:.92rem; padding-bottom:.35rem; }
  .doc-items td.doc-designation::before { content:none; }

  /* Sous 640 px le tableau n'existe plus : le reperage passe par un bord
     colore a gauche de chaque ligne, faute de cadre. */
  @media screen and (max-width: 639px) {
    .doc-items { border:0 !important; }
    .doc-items tbody tr {
      border-left:3px solid var(--doc-accent);
      background:transparent !important;
    }
  }

  @media (min-width: 640px) {
    .doc-items thead { display:table-header-group; }
    .doc-items tbody tr { display:table-row; padding:0; }
    .doc-items td { display:table-cell; padding:.62rem .7rem; vertical-align:top; font-size:.85rem; }
    .doc-items td::before { content:none; }
    .doc-items td.doc-designation { display:table-cell; padding:.62rem .7rem; font-size:.85rem; font-weight:600; }
    .doc-items th { padding:.55rem .7rem; }
    .doc-items .doc-num { text-align:right; white-space:nowrap; }
    .doc-items .doc-qty { text-align:center; }
  }

  /* ---- Les quatre dessins de tableau (voir DOC_TEMPLATES dans lib/pro) ---- */

  /* « head » : cadre de couleur, intitules en aplat plein. Le plus lisible. */
  .doc-t-head { border:1.5px solid var(--doc-accent); }
  .doc-t-head thead tr { background: var(--doc-accent); color:#fff; }
  .doc-t-head tbody tr:last-child { border-bottom:0; }

  /* « grid » : entierement quadrille — l'oeil suit la ligne jusqu'au montant,
     ce qui compte sur une facture de vingt lignes. */
  .doc-t-grid { border:1.5px solid var(--doc-accent); }
  .doc-t-grid thead tr { background: var(--doc-tint); }
  .doc-t-grid th { border-bottom:1.5px solid var(--doc-accent); }
  .doc-t-grid td, .doc-t-grid th { border-right:1px solid ${LINE}; }
  .doc-t-grid td:last-child, .doc-t-grid th:last-child { border-right:0; }
  .doc-t-grid tbody tr:last-child { border-bottom:0; }

  /* « zebra » : une ligne sur deux teintee — meme service que le quadrillage,
     en plus doux. */
  .doc-t-zebra { border:1.5px solid var(--doc-accent); }
  .doc-t-zebra thead tr { background: var(--doc-tint); }
  .doc-t-zebra th { border-bottom:1.5px solid var(--doc-accent); }
  .doc-t-zebra tbody tr:nth-child(even) { background: var(--doc-tint); }
  .doc-t-zebra tbody tr { border-bottom:0; }

  /* « rule » : pas de cadre du tout, un seul filet epais. Pour le modele
     epure, ou chaque trait doit se justifier. */
  .doc-t-rule thead tr { border-bottom:2.5px solid var(--doc-accent); }

  /* ---- Impression : on force la grille, quel que soit l'écran d'origine ---- */
  @page { size: A4; margin: 14mm; }
  @media print {
    .no-print { display:none !important; }
    body, .doc-page { background:#fff !important; min-height:0 !important; padding:0 !important; }
    .doc-sheet {
      box-shadow:none !important; border:0 !important; border-radius:0 !important;
      margin:0 !important; padding:0 !important; max-width:none !important; width:100% !important;
    }
    /* Le tableau peut courir sur plusieurs pages : la ligne d'intitules se
       repete en tete de chacune (table-header-group) et aucune ligne n'est
       coupee en deux. Sans cela, la page 2 d'une facture longue arrive sans
       dire quelle colonne est quoi. */
    .doc-items thead { display:table-header-group; }
    .doc-items tbody tr { display:table-row; padding:0; break-inside:avoid; }
    .doc-items td { display:table-cell; padding:.48rem .6rem; vertical-align:top; font-size:.83rem; }
    .doc-items td::before { content:none; }
    .doc-items td.doc-designation { display:table-cell; padding:.48rem .6rem; font-size:.83rem; }
    .doc-items th { padding:.45rem .6rem; }
    .doc-items .doc-num { text-align:right; }
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
   * "page" — feuille habillée pour l'écran (coins arrondis, ombre,
   *   rembourrage). Le fond de page et la barre d'actions appartiennent à
   *   DocumentPage, qui l'enveloppe.
   * "preview" — document nu, destiné à être posé dans une feuille A4 à
   *   l'échelle (voir A4Preview) : ni ombre ni rembourrage, la feuille tenant
   *   déjà lieu de marge. Sert à l'aperçu pendant la saisie et à la capture
   *   du fichier téléchargé.
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
  const tpl = docTemplate(seller.template).spec;
  const ACCENT = seller.accent || tpl.accent || ACCENT_DEFAULT;

  // Sur bandeau plein, l'en-tête s'écrit en blanc sur la couleur ; ailleurs à
  // l'encre sur le papier.
  const onBand = tpl.header === "band";
  // Reçu : tout est centré, émetteur au-dessus de l'intitulé.
  const stacked = tpl.header === "stack";
  const headTint = tpl.tinted ? `${ACCENT}0D` : "#F9FAFB"; // 0D ≈ 5 % d'opacité
  const headCaps = tpl.caps ? "tracking-[.12em]" : "tracking-wider";

  const sheet = (
    <article
      className={
        preview
          ? "doc-sheet doc-preview"
          : "doc-sheet overflow-hidden rounded-2xl px-5 py-7 shadow-lg sm:px-10 sm:py-9"
      }
      // La couleur descend en variables CSS : le tableau de facturation s'en
      // sert pour son cadre et ses aplats (voir .doc-t-* dans SHEET_CSS),
      // plutôt qu'un style en ligne recopié sur chaque cellule.
      style={{
        ["--doc-accent" as string]: ACCENT,
        ["--doc-tint" as string]: `${ACCENT}14`, // 14 ≈ 8 % d'opacité
        ...(preview ? {} : { boxShadow: "0 10px 40px rgba(17,24,39,.08)" }),
      }}
    >
            {/* ================= En-tête =================
                Six traitements distincts : filet, bandeau plein, encadré,
                barre latérale, tout centré, ou rien. Le balisage reste
                identique — seuls l'habillage et les couleurs changent, pour
                que l'impression et la version mobile se comportent pareil
                quel que soit le modèle. */}
            <header
              className={`doc-avoid ${onBand ? "doc-fill doc-band -mx-5 -mt-7 mb-6 px-5 pb-5 pt-7 sm:-mx-10 sm:-mt-9 sm:px-10 sm:pb-6 sm:pt-9" : ""} ${
                tpl.header === "frame" ? "rounded-lg p-4 sm:p-5" : ""
              } ${tpl.header === "side" ? "border-l-[5px] pl-4 sm:pl-5" : ""}`}
              style={
                onBand
                  ? { background: ACCENT, color: "#fff" }
                  : tpl.header === "frame"
                    ? { border: `1.5px solid ${ACCENT}` }
                    : tpl.header === "side"
                      ? { borderLeftColor: ACCENT }
                      : undefined
              }
            >
              <div
                className={
                  stacked
                    ? "flex flex-col items-center gap-4 text-center"
                    : "flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"
                }
              >
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
                      <div className="text-[.85rem]" style={{ color: onBand ? "#FFFFFFCC" : MUTED }}>{seller.name}</div>
                    )}
                    <div
                      className="mt-1.5 space-y-0.5 text-[.8rem] leading-relaxed"
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
                <div className={stacked ? "shrink-0" : "shrink-0 sm:text-right"}>
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
                    className="mt-2 space-y-0.5 text-[.8rem] leading-relaxed"
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
                      className="mt-2.5 inline-block rounded-md px-2.5 py-1 text-[.7rem] font-extrabold tracking-widest"
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
                        className="max-w-[110px] text-left text-[.66rem] leading-snug sm:text-right"
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
              {/* Reçu : le filet ferme l'en-tête centré. */}
              {stacked && <div className="mt-4 h-[2px]" style={{ background: ACCENT }} />}
              {/* Épuré et barre latérale : un simple cheveu, pas d'aplat —
                  moins d'encre, plus de calme. */}
              {(tpl.header === "plain" || tpl.header === "side") && (
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
                    <div className="text-[.83rem]" style={{ color: MUTED }}>{client.name}</div>
                  )}
                  <div className="mt-1 space-y-0.5 text-[.8rem] leading-relaxed" style={{ color: MUTED }}>
                    {client.address && <div>{client.address}</div>}
                    {client.phone && <div>{client.phone}</div>}
                    {client.email && <div className="break-all">{client.email}</div>}
                    {client.tax_id && <div>NINEA {client.tax_id}</div>}
                  </div>
                </div>
              )}
            </section>

            {/* ================= Prestations =================
                Le bloc que le client regarde en premier. Son cadre est le seul
                trait coloré de la page (classe .doc-t-*, dessin choisi par le
                modèle) : il attire l'oeil sans qu'on ait à grossir quoi que ce
                soit. Les montants sont en chiffres tabulaires, donc alignés
                colonne par colonne, ce qui rend une addition vérifiable à vue. */}
            <section className="mt-6">
              <table className={`doc-items doc-t-${tpl.table}`}>
                <thead>
                  <tr>
                    <th className={`text-left text-[.72rem] font-extrabold uppercase ${headCaps}`}>Désignation</th>
                    <th className={`w-[70px] text-center text-[.72rem] font-extrabold uppercase ${headCaps}`}>Qté</th>
                    <th className={`w-[128px] text-right text-[.72rem] font-extrabold uppercase ${headCaps}`}>P.U.</th>
                    <th className={`w-[140px] text-right text-[.72rem] font-extrabold uppercase ${headCaps}`}>Montant</th>
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
                      <td className="doc-num font-bold" data-label="Montant">
                        {(it.qty * it.unit_price).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* ================= Totaux ================= */}
            <section className="doc-avoid mt-5 flex justify-end">
              <div className="w-full sm:w-[365px]">
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
                  <span className="text-[.85rem] font-extrabold tracking-wide">
                    {doc.tax_rate > 0 ? "TOTAL TTC" : "TOTAL"}
                  </span>
                  <span className="font-mono text-[1.3rem] font-extrabold tabular-nums">
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
                      <span className="text-[.85rem] font-extrabold">RESTE À PAYER</span>
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
              className="doc-avoid mt-5 rounded-lg px-3.5 py-2.5 text-[.83rem] leading-relaxed"
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
                className="doc-avoid mt-6 space-y-4 pt-5 text-[.85rem] leading-relaxed"
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
                        <div key={i} className="text-[.85rem] leading-relaxed">
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
                className="doc-avoid mt-7 flex flex-col gap-6 pt-5 text-[.83rem] sm:flex-row sm:justify-between"
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

            <footer className="mt-8 text-center text-[.7rem]" style={{ color: "#9CA3AF" }}>
              {doc.number ? `${label.toLowerCase()} ${doc.number} · ` : ""}
              document généré sur wanteermako.com — Espace Freelancer
            </footer>
    </article>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHEET_CSS }} />

      {sheet}
    </>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[.68rem] font-bold uppercase tracking-[.12em]" style={{ color: MUTED }}>
      {children}
    </div>
  );
}

function TotalLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-[.86rem]">
      <span style={{ color: MUTED }}>{label}</span>
      <span className="font-mono font-semibold tabular-nums">{value}</span>
    </div>
  );
}
