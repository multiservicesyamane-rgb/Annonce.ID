import { NextResponse } from "next/server";
import { proContext, txt, isMissingTable } from "@/lib/proServer";
import { messageFerme, peutAcceder } from "@/lib/moduleAccess";
import { etatQuota, isCareerKind, nettoyerContenu } from "@/lib/carriereServer";
import { moteursDisponibles } from "@/lib/ia";
import {
  DEFAULT_LETTRE_TEMPLATE,
  DEFAULT_TEMPLATE,
  isLettreTemplateId,
  isTemplateId,
  lettreTemplateIsPro,
  templateIsPro,
  titreParDefaut,
} from "@/lib/carriere";

export const dynamic = "force-dynamic";

/** Au-dela, « Mes documents » n'est plus une liste mais une archive. */
const MAX_DOCUMENTS = 60;

// Ma Carriere — les documents de l'utilisateur : lister, ouvrir, creer,
// enregistrer, supprimer.
export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId, email } = ctx;

    if (!peutAcceder("carriere", email)) {
      // 403 et non 401 : la session est valide, c'est la porte qui est fermee.
      return NextResponse.json({ error: messageFerme("carriere"), ferme: true }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    /* ------------------------------ Lister ------------------------------ */
    if (action === "list") {
      const { data, error } = await sb
        .from("career_documents")
        // Le contenu est volontairement absent : la liste n'affiche qu'un
        // titre et une date, et rapatrier le CV complet de chaque ligne
        // ferait payer plusieurs dizaines de kilo-octets a une audience 4G.
        .select("id, kind, title, template, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(MAX_DOCUMENTS);

      if (error) {
        // Migration pas encore passee : le module s'affiche vide plutot que
        // de tomber en erreur.
        if (isMissingTable(error)) {
          return NextResponse.json({ documents: [], needsMigration: true, quota: null });
        }
        throw error;
      }

      return NextResponse.json({
        documents: data || [],
        quota: await etatQuota(sb, userId, email),
        // Sert a prevenir l'utilisateur AVANT qu'il commence : sans moteur,
        // l'assistant ne comprend pas les phrases et les textes sont composes
        // a partir de modeles. Le lui cacher, c'est lui faire prendre une
        // approximation pour une redaction.
        ia: moteursDisponibles().length > 0,
      });
    }

    /* ------------------------------ Ouvrir ------------------------------ */
    if (action === "get") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Document requis." }, { status: 400 });

      const { data, error } = await sb
        .from("career_documents")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

      if (error && isMissingTable(error)) {
        return NextResponse.json({ error: "Module non installe." }, { status: 503 });
      }
      if (!data) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

      return NextResponse.json({ document: data, quota: await etatQuota(sb, userId, email) });
    }

    /* ------------------------------- Creer ------------------------------- */
    if (action === "create") {
      const kind = body?.kind;
      if (!isCareerKind(kind)) {
        return NextResponse.json({ error: "Type de document inconnu." }, { status: 400 });
      }

      const { count } = await sb
        .from("career_documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((count || 0) >= MAX_DOCUMENTS) {
        return NextResponse.json(
          { error: `Vous avez atteint ${MAX_DOCUMENTS} documents. Supprimez-en un pour continuer.` },
          { status: 400 },
        );
      }

      // Le peage est ICI, a la creation : un document gratuit par mois, cinq
      // avec l'abonnement. C'est le seul endroit ou il compte — une fois le
      // document ouvert, on ecrit et on recommence sans limite.
      const q = await etatQuota(sb, userId, email);
      if (!q.autorise) {
        // 402 et non 403 : ce n'est pas interdit, c'est paye. L'ecran s'en
        // sert pour ouvrir l'abonnement plutot qu'un message d'erreur.
        return NextResponse.json(
          {
            error: "Quota de documents atteint",
            quota: q,
            message: q.abonne
              ? `Ton abonnement inclut ${q.quota} documents par mois. Tu les as tous utilises.`
              : `Ton document gratuit du mois est utilise. L'abonnement en ouvre ${q.quota === 1 ? 5 : q.quota}.`,
          },
          { status: 402 },
        );
      }

      const contenu = nettoyerContenu(kind, body?.content);
      const template = await templateAutorise(sb, userId, email, body?.template);

      const { data, error } = await sb
        .from("career_documents")
        .insert({
          user_id: userId,
          kind,
          title: txt(body?.title, 120) || titreParDefaut(kind, contenu),
          template,
          content: contenu,
        })
        .select()
        .maybeSingle();

      if (error) {
        if (isMissingTable(error)) {
          return NextResponse.json(
            { error: "Le module Ma Carriere n'est pas encore installe sur ce compte." },
            { status: 503 },
          );
        }
        throw error;
      }

      return NextResponse.json({ document: data });
    }

    /* ---------------------------- Enregistrer ---------------------------- */
    if (action === "update") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Document requis." }, { status: 400 });

      // On relit le type en base au lieu de faire confiance a celui envoye :
      // sans cela, un contenu de lettre pourrait etre nettoye comme un CV et
      // ecraser un document existant par un objet presque vide.
      const { data: existant } = await sb
        .from("career_documents")
        .select("kind")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!existant) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

      const kind = existant.kind as Parameters<typeof nettoyerContenu>[0];
      const patch: Record<string, unknown> = {};

      if (body?.content !== undefined) patch.content = nettoyerContenu(kind, body.content);
      if (body?.title !== undefined) patch.title = txt(body.title, 120);
      if (body?.template !== undefined) {
        patch.template = await templateAutorise(sb, userId, email, body.template);
      }
      if (!Object.keys(patch).length) {
        return NextResponse.json({ error: "Rien a enregistrer." }, { status: 400 });
      }

      const { data, error } = await sb
        .from("career_documents")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .maybeSingle();
      if (error) throw error;

      return NextResponse.json({ document: data });
    }

    /* ----------------------------- Supprimer ----------------------------- */
    if (action === "delete") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Document requis." }, { status: 400 });

      const { error } = await sb
        .from("career_documents")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    console.error("[carriere/documents]", e?.message || e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/**
 * Gabarit reellement applicable au document.
 *
 * Le verrou Pro est repose ici et pas seulement dans l'ecran de choix : la
 * grille des modeles affiche une pastille « Pro », mais un appel direct a
 * l'API contournerait l'affichage. Un compte gratuit qui demande « Executif »
 * repart avec le gabarit par defaut plutot qu'avec une erreur — son travail
 * est enregistre, il lui manque seulement l'habillage paye.
 */
async function templateAutorise(
  sb: Parameters<typeof etatQuota>[0],
  userId: string,
  email: string,
  demande: unknown,
): Promise<string> {
  const id = txt(demande, 40);

  // Gabarits de COURRIER : leur propre liste, leur propre repli. Un identifiant
  // « l_… » valide ne doit pas retomber sur un gabarit de CV — la lettre
  // sortirait dans une mise en page qui n'est pas la sienne.
  if (isLettreTemplateId(id)) {
    if (!lettreTemplateIsPro(id)) return id;
    const q = await etatQuota(sb, userId, email);
    return q.abonne ? id : DEFAULT_LETTRE_TEMPLATE;
  }

  if (!isTemplateId(id)) return DEFAULT_TEMPLATE;
  if (!templateIsPro(id)) return id;

  const quota = await etatQuota(sb, userId, email);
  return quota.abonne ? id : DEFAULT_TEMPLATE;
}
