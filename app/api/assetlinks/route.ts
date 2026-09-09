import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Digital Asset Links — la preuve que l'application Android nous appartient.
 *
 * ── A quoi ca sert, concretement ─────────────────────────────────────────
 * L'application du Play Store sera une TWA : une fenetre Chrome sans habillage
 * qui affiche wanteermako.com. Sans ce fichier, Android ne peut pas verifier
 * que le site et l'application sortent bien de la meme maison, et il laisse
 * alors une BARRE D'ADRESSE en haut de l'ecran. L'utilisateur voit l'URL, et
 * ce n'est plus une application — c'est un navigateur deguise.
 *
 * Servi depuis /.well-known/assetlinks.json (voir la reecriture dans
 * next.config.js), a la racine du domaine, comme Google l'exige.
 *
 * ── Pourquoi une route et non un fichier ─────────────────────────────────
 * L'empreinte du certificat n'existe QUE lorsque l'application a ete creee
 * dans la Play Console : c'est Google qui signe, et qui donne l'empreinte.
 * Elle ne peut donc pas etre ecrite d'avance dans le depot. Elle se pose dans
 * une variable d'environnement, et se change sans redeployer le code.
 *
 * Tant qu'elle est absente : 404. Volontairement. Un fichier present mais
 * contenant une fausse empreinte est PIRE que pas de fichier — la verification
 * echoue au lieu d'etre simplement absente, et le diagnostic devient un
 * cauchemar.
 */

/** Nom de paquet Android. Doit correspondre exactement a celui de la Play Console. */
const PAQUET = process.env.TWA_PACKAGE_NAME || "com.wanteermako.app";

export async function GET() {
  // Plusieurs empreintes sont possibles, separees par des virgules : Google
  // signe l'application distribuee, mais la clef de televersement en a une
  // autre. Les deux doivent figurer, sinon l'application marche depuis le
  // Store et affiche la barre d'adresse quand on l'installe a la main.
  const empreintes = (process.env.TWA_SHA256_FINGERPRINTS || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (!empreintes.length) {
    return NextResponse.json(
      { error: "TWA_SHA256_FINGERPRINTS non configuree." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: PAQUET,
          sha256_cert_fingerprints: empreintes,
        },
      },
    ],
    {
      headers: {
        "Content-Type": "application/json",
        // Google relit ce fichier regulierement. Une heure : assez court pour
        // qu'une correction d'empreinte prenne effet le jour meme, assez long
        // pour ne pas etre interroge a chaque ouverture de l'application.
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
