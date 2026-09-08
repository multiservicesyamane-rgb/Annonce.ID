import { NextResponse } from "next/server";
import { proContext, txt, isMissingTable } from "@/lib/proServer";

export const dynamic = "force-dynamic";

/**
 * Espace partenaire — la fiche d'une agence, ses points, ses missions.
 *
 * ── Pourquoi cette route existe ──────────────────────────────────────────
 * Le tableau de bord tenait les coordonnees de l'agence dans un `useState`
 * pre-rempli d'un faux numero et d'une fausse agence. Deux consequences, et
 * la seconde est grave :
 *   1. le partenaire retapait tout a chaque visite ;
 *   2. celui qui telechargeait une affiche sans toucher aux champs publiait
 *      un document portant le numero de telephone de quelqu'un d'autre.
 *
 * Les coordonnees vivent donc en base, attachees au compte.
 *
 * ── Meme socle que les autres modules ────────────────────────────────────
 * `proContext` authentifie avec la session du navigateur, puis on ecrit avec
 * la clef service_role en filtrant TOUJOURS sur user_id. Les tables sont en
 * RLS sans aucune policy publique : le navigateur ne les lit jamais en direct.
 *
 * Tolerant a l'absence des tables : tant que MIGRATION_PARTENAIRES.sql n'a pas
 * tourne, l'ecran s'affiche en mode « pas encore installe » plutot que de
 * tomber en erreur — c'est la regle suivie par Ma Carriere et l'Espace Pro.
 */

/** Longueur du code de parrainage. Six signes : lisible a l'oral, au telephone. */
const LONGUEUR_CODE = 6;

/**
 * Alphabet du code de parrainage, ampute de ce qui se confond.
 *
 * Ni O ni 0, ni I ni 1 : le code se dicte au telephone et s'ecrit sur une
 * affiche. Un caractere ambigu s'y transforme en filleul perdu.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function nouveauCode(): string {
  let code = "";
  for (let i = 0; i < LONGUEUR_CODE; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const ctx = await proContext();
    if ("error" in ctx) return ctx.error;
    const { sb, userId } = ctx;

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    /* ------------------------------ Ouvrir ------------------------------ */
    if (action === "get") {
      const { data, error } = await sb
        .from("partenaires")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && isMissingTable(error)) {
        return NextResponse.json({ partenaire: null, needsMigration: true });
      }
      if (error) throw error;

      // Pas encore inscrit : on ne cree rien ici. Une fiche naitrait a chaque
      // visite d'un curieux, et le tableau des candidatures se remplirait de
      // comptes qui n'ont jamais rien demande.
      if (!data) return NextResponse.json({ partenaire: null });

      const [points, missions] = await Promise.all([
        sb.from("partenaire_points").select("*").eq("user_id", userId)
          .order("created_at", { ascending: false }).limit(50),
        sb.from("partenaire_missions").select("*").eq("user_id", userId)
          .order("created_at", { ascending: false }).limit(50),
      ]);

      return NextResponse.json({
        partenaire: data,
        points: points.data || [],
        missions: missions.data || [],
      });
    }

    /* ----------------------- Rejoindre / enregistrer ---------------------- */
    if (action === "save") {
      const nom = txt(body?.agence, 120);
      if (!nom) return NextResponse.json({ error: "Indiquez le nom de votre agence." }, { status: 400 });

      const champs = {
        agence: nom,
        ville: txt(body?.ville, 80),
        telephone: txt(body?.telephone, 40),
      };

      const { data: existant, error: errLecture } = await sb
        .from("partenaires").select("user_id").eq("user_id", userId).maybeSingle();

      if (errLecture && isMissingTable(errLecture)) {
        return NextResponse.json(
          { error: "L'espace partenaire n'est pas encore installe sur ce compte.", needsMigration: true },
          { status: 503 },
        );
      }

      if (existant) {
        const { data, error } = await sb
          .from("partenaires").update(champs).eq("user_id", userId).select("*").maybeSingle();
        if (error) throw error;
        return NextResponse.json({ partenaire: data });
      }

      // Premiere inscription. Le code de parrainage est unique : on retente
      // sur collision plutot que de renvoyer une erreur a quelqu'un qui vient
      // de s'inscrire — la faute ne serait pas la sienne.
      for (let i = 0; i < 5; i++) {
        const { data, error } = await sb
          .from("partenaires")
          .insert({ user_id: userId, code: nouveauCode(), statut: "candidat", ...champs })
          .select("*")
          .maybeSingle();
        if (!error && data) return NextResponse.json({ partenaire: data, nouveau: true });
        if (!/duplicate|unique/i.test(error?.message || "")) throw error;
      }
      return NextResponse.json({ error: "Inscription impossible, reessayez." }, { status: 500 });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    console.error("[partenaires]", e?.message || e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
