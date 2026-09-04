/**
 * Annonce du module pro (devis / factures) aux comptes inscrits.
 *
 * Les destinataires viennent de auth.users via l'API admin Supabase : la table
 * `profiles` ne porte pas d'adresse email. Les comptes @wanteermako.app sont
 * ecartes, ce sont les comptes internes.
 *
 * Usage :
 *   node scripts/annonce-module-pro.mjs                 liste, n'envoie RIEN
 *   node scripts/annonce-module-pro.mjs --apercu        ecrit l'email en HTML
 *   node scripts/annonce-module-pro.mjs --only a@b.com --go   une seule adresse
 *   node scripts/annonce-module-pro.mjs --go            envoie a tout le monde
 *
 * Sans --go, rien ne part : le defaut est volontairement inoffensif.
 */
import fs from "node:fs";

const SITE = "https://www.wanteermako.com";
const EXCLUDE_DOMAINS = ["wanteermako.app"];
const THROTTLE_MS = 900;

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

const SUJET = "Vos devis et vos factures, maintenant sur Wanteermako";

function html(prenom) {
  const bonjour = prenom ? "Bonjour " + prenom + "," : "Bonjour,";
  const domaine = SITE.replace("https://", "");
  return [
    '<!doctype html><html lang="fr"><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1a1f36">',
    '<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e8eaed">',
    '<div style="background:#6366F1;padding:22px 28px;color:#fff">',
    '<div style="font-size:20px;font-weight:800">Wanteermako</div>',
    '<div style="font-size:13px;opacity:.9">Nouveau &mdash; Espace Pro</div>',
    "</div>",
    '<div style="padding:26px 28px">',
    '<p style="font-size:15px;margin:0 0 14px">' + bonjour + "</p>",
    '<p style="font-size:14px;line-height:1.6;margin:0 0 16px">',
    "Jusqu&rsquo;ici, Wanteermako vous servait &agrave; vendre. Vous pouvez d&eacute;sormais y g&eacute;rer aussi ",
    "<b>vos devis et vos factures</b> &mdash; c&rsquo;est le nouvel Espace Pro, et il est <b>gratuit</b>.",
    "</p>",
    '<div style="margin:20px 0;padding:18px;background:#f7f8ff;border-radius:10px;border:1px solid #e7e9ff">',
    '<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5">',
    '<tr><td style="padding:6px 0;width:24px;color:#6366F1;font-weight:700">1</td><td style="padding:6px 0">Vous cr&eacute;ez un devis en quelques tapes</td></tr>',
    '<tr><td style="padding:6px 0;color:#6366F1;font-weight:700">2</td><td style="padding:6px 0">Vous l&rsquo;envoyez par WhatsApp, avec un simple lien</td></tr>',
    '<tr><td style="padding:6px 0;color:#6366F1;font-weight:700">3</td><td style="padding:6px 0">Votre client l&rsquo;accepte depuis son t&eacute;l&eacute;phone, sans cr&eacute;er de compte</td></tr>',
    '<tr><td style="padding:6px 0;color:#6366F1;font-weight:700">4</td><td style="padding:6px 0">La facture se cr&eacute;e toute seule, num&eacute;rot&eacute;e</td></tr>',
    "</table></div>",
    '<p style="font-size:14px;line-height:1.6;margin:0 0 18px">',
    "Il y a aussi les fiches clients, le suivi des paiements (encaiss&eacute;, en attente, en retard), ",
    "un catalogue de vos prestations habituelles, dix mises en page au choix, un vrai PDF A4 ",
    "et un QR code sur chaque pi&egrave;ce. Avec ou sans NINEA, TVA optionnelle : &ccedil;a s&rsquo;adapte &agrave; votre statut r&eacute;el.",
    "</p>",
    '<div style="text-align:center;margin:26px 0">',
    '<a href="' + SITE + '/mon-activite" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px">Ouvrir mon Espace Pro</a>',
    "</div>",
    '<p style="font-size:13px;line-height:1.6;color:#6b7280;margin:0">',
    "Vous pr&eacute;f&eacute;rez d&rsquo;abord voir &agrave; quoi &ccedil;a ressemble ? ",
    '<a href="' + SITE + '/espace-pro" style="color:#6366F1">La pr&eacute;sentation est ici</a>.',
    "</p>",
    '<p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:22px 0 0;border-top:1px solid #eceef2;padding-top:14px">',
    "Vous recevez ce message parce que vous avez un compte sur Wanteermako. ",
    "Pour ne plus recevoir ce genre d&rsquo;annonce, r&eacute;pondez simplement STOP &agrave; cet email.<br/>",
    "Wanteermako &mdash; " + domaine,
    "</p></div></div></body></html>",
  ].join("");
}

function texte(prenom) {
  const bonjour = prenom ? "Bonjour " + prenom + "," : "Bonjour,";
  return [
    bonjour,
    "",
    "Jusqu'ici, Wanteermako vous servait a vendre. Vous pouvez desormais y gerer",
    "aussi vos devis et vos factures : c'est le nouvel Espace Pro, et il est gratuit.",
    "",
    "1. Vous creez un devis en quelques tapes",
    "2. Vous l'envoyez par WhatsApp, avec un simple lien",
    "3. Votre client l'accepte depuis son telephone, sans creer de compte",
    "4. La facture se cree toute seule, numerotee",
    "",
    "Il y a aussi les fiches clients, le suivi des paiements, un catalogue de vos",
    "prestations, dix mises en page, un vrai PDF A4 et un QR code sur chaque piece.",
    "Avec ou sans NINEA, TVA optionnelle.",
    "",
    "Ouvrir mon Espace Pro : " + SITE + "/mon-activite",
    "La presentation : " + SITE + "/espace-pro",
    "",
    "Vous recevez ce message parce que vous avez un compte sur Wanteermako.",
    "Pour ne plus recevoir ce genre d'annonce, repondez STOP a cet email.",
    "Wanteermako - " + SITE.replace("https://", ""),
  ].join("\n");
}

async function destinataires() {
  const res = await fetch(
    env.NEXT_PUBLIC_SUPABASE_URL + "/auth/v1/admin/users?per_page=200",
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );
  if (!res.ok) throw new Error("Supabase " + res.status + " " + (await res.text()).slice(0, 200));
  const { users } = await res.json();
  return users
    .filter((u) => u.email && (u.email_confirmed_at || u.confirmed_at))
    .filter((u) => !EXCLUDE_DOMAINS.includes(u.email.split("@")[1]))
    .map((u) => {
      const nom = (u.user_metadata?.full_name || u.user_metadata?.name || "").trim();
      return { email: u.email, prenom: nom ? nom.split(/\s+/)[0] : "" };
    });
}

async function envoyer(d) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME || "Wanteermako" },
      replyTo: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME || "Wanteermako" },
      to: [{ email: d.email, ...(d.prenom ? { name: d.prenom } : {}) }],
      subject: SUJET,
      htmlContent: html(d.prenom),
      textContent: texte(d.prenom),
    }),
  });
  const body = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, id: body.messageId } : { ok: false, error: body?.message || "HTTP " + res.status };
}

if (has("--apercu")) {
  fs.writeFileSync("apercu-annonce-pro.html", html("Moussa"), "utf8");
  console.log("Apercu ecrit dans apercu-annonce-pro.html");
  console.log("\n--- version texte ---\n");
  console.log(texte("Moussa"));
  process.exit(0);
}

const tous = await destinataires();
const only = val("--only");
const cible = only ? tous.filter((d) => d.email === only) : tous;

console.log("Sujet      : " + SUJET);
console.log("Expediteur : " + env.BREVO_SENDER_NAME + " <" + env.BREVO_SENDER_EMAIL + ">");
console.log("Destinataires retenus : " + cible.length + " (sur " + tous.length + " comptes eligibles)");
for (const d of cible) console.log("  " + d.email + (d.prenom ? "  (" + d.prenom + ")" : ""));

if (!has("--go")) {
  console.log("\nMode liste : RIEN n'a ete envoye. Ajouter --go pour envoyer.");
  process.exit(0);
}

console.log("");
let ok = 0;
let ko = 0;
for (const d of cible) {
  const r = await envoyer(d);
  if (r.ok) {
    ok++;
    console.log("  envoye  " + d.email);
  } else {
    ko++;
    console.log("  ECHEC   " + d.email + " : " + r.error);
  }
  if (cible.length > 1) await new Promise((r) => setTimeout(r, THROTTLE_MS));
}
console.log("\nTermine : " + ok + " envoye(s), " + ko + " echec(s).");
