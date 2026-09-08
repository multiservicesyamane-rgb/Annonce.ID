import { NextResponse } from "next/server";
import { proContext, txt, isMissingTable, isMissingColumn } from "@/lib/proServer";
import { messageFerme, peutAcceder } from "@/lib/moduleAccess";
import {
  documentVerrouille,
  etatQuota,
  isCareerKind,
  messageVerrou,
  nettoyerContenu,
} from "@/lib/carriereServer";
import { inscrire } from "@/lib/quotaLedger";
import { moteursDisponibles } from "@/lib/ia";
import {
  DEFAULT_LETTRE_TEMPLATE,
  DEFAULT_TEMPLATE,
  documentVide,
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
      // Le contenu est volontairement absent : la liste n'affiche qu'un titre
      // et une date, et rapatrier le CV complet de chaque ligne ferait payer
      // plusieurs dizaines de kilo-octets a une audience 4G.
      const COLONNES = "id, kind, title, template, created_at, updated_at";
      const lister = (colonnes: string) =>
        sb
          .from("career_documents")
          .select(colonnes)
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(MAX_DOCUMENTS);

      let { data, error } = await lister(`${COLONNES}, finalise_at`);
      // MIGRATION_VERROU_GRATUIT.sql pas encore passe : la colonne manque. On
      // relit sans elle plutot que de renvoyer une liste vide — le module
      // fonctionne, il lui manque seulement le verrou.
      if (error && isMissingColumn(error)) ({ data, error } = await lister(COLONNES));

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

      const etat = await etatQuota(sb, userId, email);
      return NextResponse.json({
        document: data,
        quota: etat,
        // L'ecran a besoin de le savoir AVANT d'ouvrir l'editeur : decouvrir
        // le verrou au premier enregistrement ferait perdre ce qui vient
        // d'etre tape.
        verrouille: documentVerrouille(data.finalise_at, etat),
      });
    }

    /* ------------------------------- Creer ------------------------------- */
    if (action === "create") {
      const kind = body?.kind;
      if (!isCareerKind(kind)) {
        return NextResponse.json({ error: "Type de document inconnu." }, { status: 400 });
      }

      const contenu = nettoyerContenu(kind, body?.content);

      // Rien de saisi : on ne cree pas. Et surtout, on ne compte pas.
      //
      // L'enregistrement est automatique 1,2 s apres un changement, et il
      // partait des l'ouverture de l'editeur : venir regarder les modeles
      // puis ressortir creait un CV vide et consommait le document gratuit du
      // mois. Depuis le registre, cette unite ne revenait meme plus en
      // supprimant le document — la fuite s'etait transformee en piege.
      //
      // 422 et non 400 : la demande est bien formee, elle est seulement
      // prematuree. L'ecran s'en sert pour se taire et reessayer a la frappe
      // suivante, sans afficher d'erreur a quelqu'un qui n'a rien fait.
      if (documentVide(kind, contenu)) {
        return NextResponse.json({ error: "Document encore vide.", vide: true }, { status: 422 });
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

      // Premier peage : le nombre de documents du mois. Un gratuit, cinq avec
      // l'abonnement. Le compteur vient du REGISTRE et non du nombre de
      // documents presents — sans quoi supprimer le sien rendait l'unite.
      //
      // Second peage, plus bas dans `update` : une fois le document
      // telecharge, il ne se remodifie plus sans abonnement.
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

      // Le registre est ecrit APRES l'insertion, avec l'identifiant reel : une
      // ligne inscrite pour un document qui n'aurait pas ete cree ferait payer
      // une unite pour rien.
      await inscrire(sb, userId, "carriere", kind, data?.id || "");

      return NextResponse.json({ document: data });
    }

    /* ---------------------------- Enregistrer ---------------------------- */
    if (action === "update") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Document requis." }, { status: 400 });

      // On relit le type en base au lieu de faire confiance a celui envoye :
      // sans cela, un contenu de lettre pourrait etre nettoye comme un CV et
      // ecraser un document existant par un objet presque vide.
      const relire = (colonnes: string) =>
        sb.from("career_documents").select(colonnes).eq("id", id).eq("user_id", userId).maybeSingle();

      // Le `select` prend une chaine construite : TypeScript ne peut plus
      // deduire la forme de la ligne, d'ou la remise a plat ci-dessous.
      type LigneDoc = { kind: string; finalise_at?: string | null };
      const { data: avecColonne, error: errLecture } = await relire("kind, finalise_at");
      let existant = avecColonne as unknown as LigneDoc | null;
      // Sans ce repli, une colonne manquante ferait repondre « Document
      // introuvable » a CHAQUE enregistrement : le module entier cesserait
      // d'enregistrer tant que la migration n'aurait pas tourne.
      if (errLecture && isMissingColumn(errLecture)) {
        const { data: sansColonne } = await relire("kind");
        existant = sansColonne as unknown as LigneDoc | null;
      }
      if (!existant) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

      const kind = existant.kind as Parameters<typeof nettoyerContenu>[0];

      // Le verrou du plan gratuit. Il est pose ICI, cote serveur : griser un
      // champ dans l'interface n'empeche personne d'appeler la route a la
      // main, et c'est precisement ce peage-la qui finance le module.
      //
      // 402 et non 403 : ce n'est pas interdit, c'est paye. L'ecran s'en sert
      // pour ouvrir l'abonnement plutot qu'afficher une erreur.
      const etatDoc = await etatQuota(sb, userId, email);
      if (documentVerrouille(existant.finalise_at, etatDoc)) {
        return NextResponse.json(
          { error: messageVerrou(kind), verrouille: true, quota: etatDoc },
          { status: 402 },
        );
      }
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

    /* ---------------------------- Finaliser ---------------------------- */
    //
    // Appele par l'ecran d'apercu au PREMIER telechargement reussi, et par lui
    // seul. C'est le moment ou le document a une valeur entre les mains de son
    // auteur : avant, ce n'est qu'un brouillon qu'on peaufine.
    //
    // Pourquoi pas « des la creation », au pied de la lettre ? Parce que
    // l'enregistrement de Ma Carriere est automatique, 1,2 s apres la premiere
    // frappe : le verrou se serait referme sur un CV contenant une seule
    // lettre du prenom.
    //
    // L'horodatage est pose pour TOUT LE MONDE, abonne compris — c'est un fait
    // ("ce document a ete produit tel jour"), pas une sanction. Le verrou,
    // lui, ne regarde que l'etat de l'abonnement AU MOMENT de la modification :
    // un abonne modifie ses documents finalises, et retrouve ce droit sur tous
    // ses documents s'il se reabonne.
    if (action === "finaliser") {
      const id = txt(body?.id, 60);
      if (!id) return NextResponse.json({ error: "Document requis." }, { status: 400 });

      const { data, error } = await sb
        .from("career_documents")
        .update({ finalise_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        // Le premier telechargement fait foi. Sans ce filtre, chaque
        // telechargement repousserait la date et l'on ne saurait plus quand le
        // document a reellement ete termine.
        .is("finalise_at", null)
        .select("id, finalise_at")
        .maybeSingle();

      // Colonne absente (migration pas passee) : rien a verrouiller, et
      // surtout pas de quoi faire echouer un telechargement qui, lui, a
      // parfaitement fonctionne.
      if (error && (isMissingColumn(error) || isMissingTable(error))) {
        return NextResponse.json({ ok: true, verrouille: false });
      }
      if (error) throw error;

      const etat = await etatQuota(sb, userId, email);
      return NextResponse.json({
        ok: true,
        // `data` est nul quand le document etait deja finalise : le filtre
        // `.is(null)` n'a alors rien mis a jour. Le document est verrouille
        // dans les deux cas — il ne l'est pas moins parce qu'on le telecharge
        // une seconde fois.
        verrouille: !etat.peutModifier,
        quota: etat,
      });
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
