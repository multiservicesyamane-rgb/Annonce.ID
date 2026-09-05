/**
 * Campagne « la plateforme + l'Espace Pro », avec l'affiche en tete.
 *
 * Deux publics, un seul visuel :
 *   membres   — comptes inscrits (auth.users), hors @wanteermako.app.
 *               Ils connaissent la plateforme : le message va droit au module pro.
 *   prospects — table `prospects`. Ils n'ont JAMAIS rien demande : le message
 *               presente d'abord la plateforme, et porte la mention legale du
 *               demarchage, reprise mot pour mot de lib/prospect-email.ts.
 *
 * L'opt-out est respecte sans condition : un prospect qui a repondu STOP n'est
 * jamais rappele, quelle que soit l'option passee en ligne de commande.
 *
 * Apres un envoi reussi, `email_sent_at` et `email_sent_count` sont mis a jour
 * sur le prospect — sinon le cron de relance le recontacterait avec l'autre
 * modele, en croyant n'avoir jamais ecrit.
 *
 * Usage :
 *   node scripts/campagne-affiche.mjs                          liste, n'envoie RIEN
 *   node scripts/campagne-affiche.mjs --apercu                 ecrit les deux HTML
 *   node scripts/campagne-affiche.mjs --public membres --go
 *   node scripts/campagne-affiche.mjs --public prospects --go
 *   node scripts/campagne-affiche.mjs --public tous --go
 */
import fs from "node:fs";

const SITE = "https://www.wanteermako.com";
const AFFICHE =
  "https://kbcljnfsyzqkcrkjoedm.supabase.co/storage/v1/object/public/images/campagnes/affiche-plateforme-2026-09.jpg";
const EXCLUDE_DOMAINS = ["wanteermako.app"];
const THROTTLE_MS = 800;

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : null;
};

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
);
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const K = env.SUPABASE_SERVICE_ROLE_KEY;
const SB = { apikey: K, Authorization: "Bearer " + K };

const esc = (s) =>
  String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ------------------------------- le message ------------------------------- */

const SUJETS = {
  membres: "Nouveau sur Wanteermako : vos devis et vos factures",
  prospects: "Vendez au Senegal, et faites vos devis - gratuitement",
};

function intro(pub) {
  if (pub === "membres") {
    return `Vous avez deja un compte sur Wanteermako. Voici ce qui vient de s&rsquo;y ajouter, et qui ne coute rien.`;
  }
  return `Wanteermako est la plateforme d&rsquo;annonces du Senegal : on y publie ce qu&rsquo;on vend en deux minutes, et on touche des acheteurs de Dakar a Ziguinchor. C&rsquo;est gratuit, et depuis peu il y a davantage.`;
}

function pied(pub, lieu) {
  if (pub === "membres") {
    return `Vous recevez ce message parce que vous avez un compte sur Wanteermako.<br>Pour ne plus recevoir ce genre d&rsquo;annonce, repondez simplement &laquo;&nbsp;STOP&nbsp;&raquo;.`;
  }
  return `Vous recevez cet email car votre etablissement est reference publiquement comme professionnel${esc(lieu)}.<br>Pour ne plus etre contacte, repondez simplement &laquo;&nbsp;STOP&nbsp;&raquo;.`;
}

const ETAPES = [
  ["1", "Vous creez un devis en quelques tapes"],
  ["2", "Vous l&rsquo;envoyez par WhatsApp, avec un simple lien"],
  ["3", "Votre client l&rsquo;accepte depuis son telephone, sans creer de compte"],
  ["4", "La facture se cree toute seule, numerotee"],
];

function html(pub, nom, lieu) {
  const bonjour = nom ? "Bonjour " + esc(nom) + "," : "Bonjour,";
  return [
    '<!doctype html><html lang="fr"><body style="margin:0;background:#f4f5f7">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7"><tr><td align="center" style="padding:20px 12px">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e8eaed">',

    // L'affiche en tete, cliquable : c'est elle qui doit arreter le pouce.
    '<tr><td style="padding:0">',
    '<a href="' + SITE + '" style="display:block">',
    '<img src="' + AFFICHE + '" width="560" alt="Wanteermako - acheter, vendre, trouver facilement au Senegal"',
    ' style="display:block;width:100%;max-width:560px;height:auto;border:0"></a>',
    "</td></tr>",

    '<tr><td style="padding:24px 26px;font-family:Arial,Helvetica,sans-serif;color:#1a1f36">',
    '<p style="font-size:15px;margin:0 0 14px">' + bonjour + "</p>",
    '<p style="font-size:14px;line-height:1.6;margin:0 0 18px">' + intro(pub) + "</p>",

    '<p style="font-size:15px;font-weight:bold;margin:0 0 10px">Vos devis et vos factures, sur le meme site.</p>',
    '<div style="margin:0 0 18px;padding:16px;background:#f7f8ff;border-radius:10px;border:1px solid #e7e9ff">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1a1f36">',
    ETAPES.map(
      ([n, t]) =>
        '<tr><td style="padding:5px 0;width:22px;color:#6366F1;font-weight:bold">' +
        n +
        '</td><td style="padding:5px 0">' +
        t +
        "</td></tr>"
    ).join(""),
    "</table></div>",

    '<p style="font-size:14px;line-height:1.6;margin:0 0 20px">',
    "Fiches clients, suivi des paiements, catalogue de vos prestations, dix mises en page, ",
    "un vrai PDF A4 et un QR code sur chaque piece. Avec ou sans NINEA, TVA optionnelle : ",
    "ca s&rsquo;adapte a votre statut reel. <b>Gratuit, sans carte bancaire.</b>",
    "</p>",

    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 8px"><tr>',
    '<td style="padding:0 5px"><a href="' + SITE + '/publier"',
    ' style="display:inline-block;background:#0B1120;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;padding:12px 20px;border-radius:9px">Publier une annonce</a></td>',
    '<td style="padding:0 5px"><a href="' + SITE + '/espace-pro"',
    ' style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;padding:12px 20px;border-radius:9px">Decouvrir l&rsquo;Espace Pro</a></td>',
    "</tr></table>",

    "</td></tr>",
    '<tr><td style="padding:14px 24px 20px;font-family:Arial,sans-serif;font-size:11px;color:#9AA0B0;text-align:center;line-height:1.6;border-top:1px solid #eceef2">',
    pied(pub, lieu),
    "<br>Wanteermako &mdash; www.wanteermako.com",
    "</td></tr></table></td></tr></table></body></html>",
  ].join("");
}

function texte(pub, nom, lieu) {
  const bonjour = nom ? "Bonjour " + nom + "," : "Bonjour,";
  const tete =
    pub === "membres"
      ? "Vous avez deja un compte sur Wanteermako. Voici ce qui vient de s'y ajouter, et qui ne coute rien."
      : "Wanteermako est la plateforme d'annonces du Senegal : on y publie ce qu'on vend en deux minutes, et on touche des acheteurs de Dakar a Ziguinchor. C'est gratuit, et depuis peu il y a davantage.";
  const bas =
    pub === "membres"
      ? "Vous recevez ce message parce que vous avez un compte sur Wanteermako.\nPour ne plus recevoir ce genre d'annonce, repondez « STOP »."
      : `Vous recevez cet email car votre etablissement est reference publiquement comme professionnel${lieu}.\nPour ne plus etre contacte, repondez « STOP ».`;
  return [
    bonjour,
    "",
    tete,
    "",
    "VOS DEVIS ET VOS FACTURES, SUR LE MEME SITE",
    "1. Vous creez un devis en quelques tapes",
    "2. Vous l'envoyez par WhatsApp, avec un simple lien",
    "3. Votre client l'accepte depuis son telephone, sans creer de compte",
    "4. La facture se cree toute seule, numerotee",
    "",
    "Fiches clients, suivi des paiements, catalogue de vos prestations, dix mises",
    "en page, un vrai PDF A4 et un QR code sur chaque piece. Avec ou sans NINEA,",
    "TVA optionnelle. Gratuit, sans carte bancaire.",
    "",
    "Publier une annonce : " + SITE + "/publier",
    "Decouvrir l'Espace Pro : " + SITE + "/espace-pro",
    "",
    "--",
    bas,
    "Wanteermako - www.wanteermako.com",
  ].join("\n");
}

/* ------------------------------ destinataires ----------------------------- */

async function membres() {
  const r = await fetch(U + "/auth/v1/admin/users?per_page=200", { headers: SB });
  if (!r.ok) throw new Error("Supabase auth " + r.status);
  const { users } = await r.json();
  return users
    .filter((u) => u.email && (u.email_confirmed_at || u.confirmed_at))
    .filter((u) => !EXCLUDE_DOMAINS.includes(u.email.split("@")[1]))
    .map((u) => {
      const n = (u.user_metadata?.full_name || u.user_metadata?.name || "").trim();
      return { public: "membres", email: u.email, nom: n ? n.split(/\s+/)[0] : "", lieu: "" };
    });
}

async function prospects() {
  // email_opt_out non vrai : la desinscription prime sur tout le reste.
  const q =
    "select=id,name,email,city,email_sent_count&email=not.is.null&email_opt_out=not.is.true&limit=1000";
  const r = await fetch(U + "/rest/v1/prospects?" + q, { headers: SB });
  if (!r.ok) throw new Error("Supabase rest " + r.status + " " + (await r.text()).slice(0, 120));
  const rows = await r.json();
  const vus = new Set();
  const out = [];
  for (const p of rows) {
    const mail = String(p.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) continue;
    if (vus.has(mail)) continue; // deux fiches, une seule boite : un seul envoi
    vus.add(mail);
    out.push({
      public: "prospects",
      email: mail,
      nom: (p.name || "").trim(),
      lieu: p.city ? " a " + p.city : "",
      id: p.id,
      envois: Number(p.email_sent_count || 0),
    });
  }
  return out;
}

async function marquerProspect(d) {
  await fetch(U + "/rest/v1/prospects?id=eq." + encodeURIComponent(d.id), {
    method: "PATCH",
    headers: { ...SB, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      email_sent_at: new Date().toISOString(),
      email_sent_count: d.envois + 1,
    }),
  }).catch(() => {});
}

/* --------------------------------- envoi ---------------------------------- */

async function envoyer(d) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: env.BREVO_SENDER_EMAIL, name: "Wanteermako" },
      replyTo: { email: env.BREVO_SENDER_EMAIL, name: "Wanteermako" },
      to: [{ email: d.email, ...(d.nom ? { name: d.nom } : {}) }],
      subject: SUJETS[d.public],
      htmlContent: html(d.public, d.nom, d.lieu),
      textContent: texte(d.public, d.nom, d.lieu),
    }),
  });
  const b = await r.json().catch(() => ({}));
  return r.ok ? { ok: true } : { ok: false, error: b?.message || "HTTP " + r.status };
}

/* --------------------------------- main ----------------------------------- */

if (has("--apercu")) {
  fs.writeFileSync("apercu-membres.html", html("membres", "Moussa", ""), "utf8");
  fs.writeFileSync("apercu-prospects.html", html("prospects", "Garage Ndiaye", " a Dakar"), "utf8");
  console.log("apercu-membres.html et apercu-prospects.html ecrits");
  process.exit(0);
}

const pub = val("--public") || "tous";
const only = val("--only");

let cible = [];
if (only) {
  // Essai sur une seule adresse : on fabrique les fiches a la main pour voir
  // les DEUX versions arriver dans une vraie boite, plutot que dans un
  // navigateur qui ne rend pas comme un client mail.
  if (pub === "membres" || pub === "tous") {
    cible.push({ public: "membres", email: only, nom: "", lieu: "" });
  }
  if (pub === "prospects" || pub === "tous") {
    cible.push({ public: "prospects", email: only, nom: "Garage Ndiaye", lieu: " a Dakar" });
  }
} else {
  if (pub === "membres" || pub === "tous") cible = cible.concat(await membres());
  if (pub === "prospects" || pub === "tous") cible = cible.concat(await prospects());
}

const nbM = cible.filter((d) => d.public === "membres").length;
const nbP = cible.filter((d) => d.public === "prospects").length;
console.log("Expediteur : Wanteermako <" + env.BREVO_SENDER_EMAIL + ">");
console.log("Membres   : " + nbM + "  (sujet : " + SUJETS.membres + ")");
console.log("Prospects : " + nbP + "  (sujet : " + SUJETS.prospects + ")");
console.log("TOTAL     : " + cible.length);

if (!has("--go")) {
  console.log("\nMode liste : RIEN n'a ete envoye. Ajouter --go pour envoyer.");
  process.exit(0);
}

let ok = 0;
let ko = 0;
const echecs = [];
for (let i = 0; i < cible.length; i++) {
  const d = cible[i];
  const r = await envoyer(d);
  if (r.ok) {
    ok++;
    if (d.public === "prospects" && d.id) await marquerProspect(d);
  } else {
    ko++;
    echecs.push(d.email + " : " + r.error);
  }
  if ((i + 1) % 25 === 0 || i === cible.length - 1) {
    console.log("  " + (i + 1) + "/" + cible.length + "  (" + ok + " envoyes, " + ko + " echecs)");
  }
  if (i < cible.length - 1) await new Promise((res) => setTimeout(res, THROTTLE_MS));
}
console.log("\nTermine : " + ok + " envoye(s), " + ko + " echec(s).");
if (echecs.length) console.log("Echecs :\n  " + echecs.slice(0, 20).join("\n  "));
