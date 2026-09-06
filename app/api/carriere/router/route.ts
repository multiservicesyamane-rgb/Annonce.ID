import { NextResponse } from "next/server";
import { redigerIA } from "@/lib/ia";
import { proContext, txt } from "@/lib/proServer";
import { messageFerme, peutAcceder } from "@/lib/moduleAccess";
import { DEMARCHES, trouverParMots, type Demarche } from "@/lib/demarches";

export const dynamic = "force-dynamic";

/**
 * Ma Carriere — comprendre une demande ecrite librement.
 *
 * L'utilisateur tape « je veux voyager en France » ou « on m'a vole mon
 * telephone ». Cette route ne fait qu'une chose : reconnaitre DE QUELLE
 * demarche il parle, parmi celles du catalogue.
 *
 * ── Elle ne redige rien, elle ne conseille rien ──────────────────────────
 * Le modele choisit un identifiant dans une liste fermee. Il ne decrit
 * jamais les pieces a fournir ni ou aller : ces informations sortent de
 * lib/demarches.ts, ecrites et verifiables. Un modele qui improvise une
 * liste de pieces envoie quelqu'un au mauvais guichet.
 *
 * ── Elle ne consomme pas de quota ────────────────────────────────────────
 * C'est un aiguillage de quelques mots, pas une redaction. Faire payer un
 * essai pour avoir pose une question decouragerait justement l'usage qu'on
 * cherche a encourager.
 */

const SYSTEME = `Tu es un aiguilleur. On te donne la demande d'un utilisateur senegalais
et une liste fermee de demarches administratives, chacune avec un identifiant.

Ta seule tache : repondre par l'IDENTIFIANT de la demarche qui correspond le mieux.

REGLES :
- Reponds UNIQUEMENT par l'identifiant, en minuscules, sans phrase, sans ponctuation.
- Si aucune demarche ne correspond vraiment, reponds exactement : aucune
- N'invente jamais un identifiant qui ne figure pas dans la liste.
- Ne donne aucun conseil, aucune liste de pieces, aucune explication.`;

export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { email } = ctx;

    if (!peutAcceder("carriere", email)) {
      // 403 et non 401 : la session est valide, c'est la porte qui est fermee.
      return NextResponse.json({ error: messageFerme("carriere"), ferme: true }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const demande = txt(body?.texte, 500);

    if (demande.length < 3) {
      return NextResponse.json({ error: "Dis-moi ce dont tu as besoin." }, { status: 400 });
    }

    // Repli d'abord : il est instantane et gratuit. Beaucoup de demandes
    // contiennent le mot exact (« visa », « plainte », « ninea »), et le
    // modele n'apporterait rien.
    const parMots = trouverParMots(demande);

    const catalogue = DEMARCHES.map((d) => `${d.id} : ${d.nom} — ${d.resume}`).join("\n");
    const reponse = await redigerIA(
      `Demande de l'utilisateur :\n"${demande}"\n\nDemarches disponibles :\n${catalogue}\n\nIdentifiant :`,
      SYSTEME,
    );

    const id = (reponse?.texte || "").trim().toLowerCase().replace(/[^a-z-]/g, "");
    const choisie = DEMARCHES.find((d) => d.id === id) || parMots;

    if (choisie) {
      // Deuxieme temps : ce que la phrase contient DEJA comme reponses.
      // « je veux voyager en Gambie pour voir ma famille » repond a lui seul
      // a deux des quatre questions de la fiche. Les redemander donnerait
      // l'impression que rien n'a ete lu.
      const reponses = await extraire(demande, choisie);
      return NextResponse.json({ demarche: choisie, reponses, moteur: reponse?.par || null });
    }

    // On ne laisse jamais l'utilisateur devant un mur : le catalogue lui est
    // propose, il choisit lui-meme.
    return NextResponse.json({
      demarche: null,
      message: "Je n'ai pas reconnu ta demande. Choisis dans la liste ci-dessous.",
      catalogue: DEMARCHES.map((d) => ({ id: d.id, nom: d.nom, resume: d.resume })),
    });
  } catch (e: any) {
    console.error("[carriere/router]", e?.message || e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/* ============================== L'extraction ============================== */

const SYSTEME_EXTRACTION = `Tu extrais des informations d'une phrase, rien de plus.

REGLES :
- Reponds UNIQUEMENT par un objet JSON, sans texte autour, sans balises.
- Une clef par information REELLEMENT presente dans la phrase. Rien d'autre.
- Si une information n'est pas dans la phrase, N'INVENTE PAS : omets la clef.
- Pour les questions a choix, recopie EXACTEMENT une des options proposees.`;

/**
 * Ce que la demande contient deja comme reponses aux questions de la fiche.
 *
 * Tout est refiltre au retour : seules les clefs connues survivent, et pour
 * une question a choix, seule une option exacte est acceptee. Un modele qui
 * repond « Visite de la famille » la ou l'option dit « Visite familiale »
 * introduirait une valeur que l'ecran ne saurait pas afficher.
 */
async function extraire(demande: string, d: Demarche): Promise<Record<string, string>> {
  const champs = d.questions
    .map((q) =>
      q.type === "choix"
        ? `- ${q.id} : ${q.libelle} (une seule valeur parmi : ${(q.options || []).join(" | ")})`
        : `- ${q.id} : ${q.libelle} (texte libre et court)`,
    )
    .join("\n");

  const r = await redigerIA(
    `Phrase : "${demande}"\n\nInformations a extraire :\n${champs}\n\nJSON :`,
    SYSTEME_EXTRACTION,
  );
  if (!r?.texte) return {};

  try {
    // Le modele encadre parfois son JSON de ``` malgre la consigne.
    const brut = r.texte.replace(/```(?:json)?/g, "").trim();
    const debut = brut.indexOf("{");
    const fin = brut.lastIndexOf("}");
    if (debut < 0 || fin <= debut) return {};

    const objet = JSON.parse(brut.slice(debut, fin + 1)) as Record<string, unknown>;
    const propre: Record<string, string> = {};

    for (const q of d.questions) {
      const v = String(objet[q.id] ?? "").trim();
      if (!v) continue;
      if (q.type === "choix") {
        const exacte = (q.options || []).find((o) => o.toLowerCase() === v.toLowerCase());
        if (exacte) propre[q.id] = exacte;
      } else {
        propre[q.id] = v.slice(0, 200);
      }
    }
    return propre;
  } catch {
    // JSON illisible : on repart sans reponse pre-remplie, l'utilisateur
    // repond lui-meme. Jamais d'echec visible pour ca.
    return {};
  }
}
