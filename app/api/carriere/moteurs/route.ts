import { NextResponse } from "next/server";
import { proContext } from "@/lib/proServer";
import { isOwner } from "@/lib/owners";
import { moteursDisponibles, redigerIA } from "@/lib/ia";

export const dynamic = "force-dynamic";

/**
 * Le voyant des moteurs de redaction.
 *
 * ── Pourquoi cette route existe ──────────────────────────────────────────
 * Le repli est silencieux par construction : quand un moteur tombe, le
 * suivant prend le relais et, s'ils tombent tous, le site compose ses textes
 * lui-meme. C'est exactement ce qu'il faut pour l'utilisateur — et c'est
 * pourquoi une panne d'IA a pu durer des semaines en production sans que
 * personne s'en apercoive.
 *
 * Elle repond a deux questions qu'on ne peut pas trancher autrement :
 * quelles clefs l'hebergeur voit reellement, et laquelle repond aujourd'hui.
 *
 * ── Reservee aux comptes proprietaires ───────────────────────────────────
 * Elle ne divulgue aucune clef, mais elle dit quels services sont branches
 * et fait un appel reel : c'est un outil d'exploitation, pas une page
 * publique.
 */
export async function GET(req: Request) {
  const ctx = await proContext();
  if ("error" in ctx) return ctx.error;
  if (!isOwner(ctx.email)) {
    return NextResponse.json({ error: "Reserve." }, { status: 403 });
  }

  const configures = moteursDisponibles();

  // `?test=1` declenche un vrai appel — quelques jetons, mais c'est la seule
  // facon de distinguer « clef presente » de « clef qui fonctionne ». Une
  // clef sans solde est configuree ET inutilisable.
  const url = new URL(req.url);
  let essai: { moteur: string | null; texte: string | null } | null = null;

  if (url.searchParams.get("test") === "1") {
    const r = await redigerIA(
      "Ecris exactement : moteur operationnel.",
      "Tu reponds en francais, en trois mots maximum.",
    );
    essai = { moteur: r?.par || null, texte: r?.texte?.slice(0, 80) || null };
  }

  return NextResponse.json({
    // Clefs presentes dans l'environnement, dans l'ordre d'essai.
    configures,
    // Un moteur configure n'est pas un moteur qui repond : voir `essai`.
    aucun: configures.length === 0,
    essai,
    // Sans test, on ne sait rien de plus que la presence des clefs.
    astuce: essai ? undefined : "Ajoute ?test=1 pour faire un appel reel.",
  });
}
