/**
 * Bibliotheque de campagnes email.
 *
 * Six modeles, chacun bati autour d'un visuel deja realise. Le visuel n'est
 * pas un decor : c'est lui qui arrete le pouce, le texte ne fait que
 * transformer. D'ou un seul message par email, et un seul bouton.
 *
 * Deux publics, jamais melanges :
 *   membres   — comptes inscrits (auth.users), hors @wanteermako.app
 *   prospects — table `prospects`, jamais inscrits. Ils recoivent la mention
 *               legale du demarchage, reprise de lib/prospect-email.ts, et
 *               l'opt-out est filtre sans condition.
 *
 * Les visuels vivent sur le bucket public Supabase : un email ne peut pas
 * afficher une image locale, et les heberger la evite un deploiement a chaque
 * changement d'affiche.
 *
 * Usage :
 *   node scripts/campagnes.mjs                          liste les modeles
 *   node scripts/campagnes.mjs --modele boosts          previsualise
 *   node scripts/campagnes.mjs --modele boosts --apercu ecrit le HTML
 *   node scripts/campagnes.mjs --modele boosts --public membres --go
 *   node scripts/campagnes.mjs --modele boosts --only a@b.com --go
 *
 * Sans --go, rien ne part.
 */
import fs from "node:fs";

const SITE = "https://www.wanteermako.com";
const BUCKET =
  "https://kbcljnfsyzqkcrkjoedm.supabase.co/storage/v1/object/public/images/campagnes";
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

/* ============================== Les modeles ============================== */

/**
 * `intro` differe par public : un membre connait la plateforme, un prospect la
 * decouvre. Ecrire le meme texte pour les deux, c'est parler a cote de l'un
 * des deux a chaque envoi.
 */
const MODELES = {
  decouverte: {
    titre: "Decouverte de la plateforme",
    image: "affiche-plateforme-2026-09.jpg",
    sujet: {
      membres: "Wanteermako : tout ce que vous pouvez y faire",
      prospects: "Vendez au Senegal, gratuitement",
    },
    intro: {
      membres:
        "Vous avez un compte chez nous. Voici, en une image, tout ce que la plateforme vous permet de faire.",
      prospects:
        "Wanteermako est la plateforme d&rsquo;annonces du Senegal : on y publie ce qu&rsquo;on vend en deux minutes, et on touche des acheteurs de Dakar a Ziguinchor.",
    },
    points: [
      "Publication gratuite, sans carte bancaire",
      "0 % de commission : vous encaissez tout",
      "Contact direct par WhatsApp ou par telephone",
      "Des acheteurs partout au Senegal",
    ],
    cta: { texte: "Publier une annonce", url: SITE + "/publier" },
  },

  publier: {
    titre: "Publier en 2 minutes",
    image: "publier.jpg",
    sujet: {
      membres: "Votre prochaine annonce en 2 minutes",
      prospects: "Publiez votre annonce gratuitement, en 2 minutes",
    },
    intro: {
      membres:
        "Vous avez quelque chose a vendre ? Trois etapes, deux minutes, et c&rsquo;est en ligne.",
      prospects:
        "Une photo, un prix, une description : votre annonce est en ligne en deux minutes, et elle ne vous coute rien.",
    },
    points: [
      "Details : le titre, le prix, la description",
      "Photos : jusqu&rsquo;a 12 images, ajoutees en un clic",
      "Publier : votre annonce part chez des milliers d&rsquo;acheteurs",
      "L&rsquo;assistant IA redige le titre et la description a votre place",
    ],
    cta: { texte: "Publier maintenant", url: SITE + "/publier" },
  },

  boosts: {
    titre: "Boosts et visibilite",
    image: "boosts.jpg",
    sujet: {
      membres: "Votre annonce merite d&rsquo;etre vue",
      prospects: "Faites remonter votre annonce au Senegal",
    },
    intro: {
      membres:
        "Une annonce bien placee se vend plus vite. Voici les trois formules, et ce qu&rsquo;elles changent vraiment.",
      prospects:
        "Publier est gratuit. Pour etre vu en premier, il existe trois formules — les voici sans detour.",
    },
    points: [
      "Premium, 3 500 F : mise en avant prioritaire et 5 photos",
      "A la Une, 7 500 F : affichage sur l&rsquo;accueil et 8 photos",
      "VIP, 15 000 F : accueil et recherche, photos illimitees",
      "Le gratuit reste gratuit : 2 annonces par compte, publication immediate",
    ],
    cta: { texte: "Voir mes annonces", url: SITE + "/dashboard" },
  },

  national: {
    titre: "Portee nationale",
    image: "national.jpg",
    sujet: {
      membres: "Vos annonces sont vues bien au-dela de Dakar",
      prospects: "Des acheteurs partout au Senegal, pas seulement a Dakar",
    },
    intro: {
      membres:
        "Dakar, Thies, Mbour, Saint-Louis, Ziguinchor : vos annonces ne s&rsquo;arretent pas a votre quartier.",
      prospects:
        "Votre clientele ne se limite pas a votre rue. Sur Wanteermako, une annonce publiee a Dakar est vue a Thies, a Mbour et a Ziguinchor.",
    },
    points: [
      "Une audience locale, sur un site pense pour le Senegal",
      "Filtrage par region et par commune",
      "Une carte qui montre les annonces pres de chez l&rsquo;acheteur",
      "Presence nationale, sans frais de deplacement",
    ],
    cta: { texte: "Voir les annonces", url: SITE },
  },

  guide: {
    titre: "Guide en 4 etapes",
    image: "guide.jpg",
    sujet: {
      membres: "Le mode d&rsquo;emploi, en une image",
      prospects: "Creer une annonce, en 4 etapes",
    },
    intro: {
      membres:
        "Gardez cette image : elle resume tout le parcours, de la connexion a la publication.",
      prospects:
        "Vous n&rsquo;avez jamais publie d&rsquo;annonce en ligne ? Ce guide tient en quatre etapes et en quelques minutes.",
    },
    points: [
      "Connectez-vous, puis cliquez sur « Publier »",
      "Ajoutez vos photos",
      "Renseignez le titre, le prix et la description",
      "Choisissez la visibilite, et publiez",
    ],
    cta: { texte: "Commencer", url: SITE + "/publier" },
  },

  pro: {
    titre: "Espace Pro (devis et factures)",
    image: "affiche-plateforme-2026-09.jpg",
    sujet: {
      membres: "Vos devis et vos factures, sur Wanteermako",
      prospects: "Faites vos devis et vos factures, gratuitement",
    },
    intro: {
      membres:
        "Vous avez deja un compte. L&rsquo;Espace Pro s&rsquo;y ajoute : devis, factures et suivi des paiements.",
      prospects:
        "Wanteermako ne sert pas qu&rsquo;a vendre : vous pouvez y faire vos devis et vos factures, gratuitement.",
    },
    points: [
      "Un devis en quelques tapes, envoye par WhatsApp",
      "Le client accepte depuis son telephone, sans creer de compte",
      "La facture se cree toute seule, numerotee",
      "Dix mises en page, un PDF A4, un QR code sur chaque piece",
    ],
    cta: { texte: "Ouvrir l&rsquo;Espace Pro", url: SITE + "/espace-pro" },
  },
};

/* ============================== Le rendu ================================= */

function pied(pub, lieu) {
  if (pub === "membres") {
    return "Vous recevez ce message parce que vous avez un compte sur Wanteermako.<br>Pour ne plus recevoir ce genre d&rsquo;annonce, repondez simplement &laquo;&nbsp;STOP&nbsp;&raquo;.";
  }
  return (
    "Vous recevez cet email car votre etablissement est reference publiquement comme professionnel" +
    esc(lieu) +
    ".<br>Pour ne plus etre contacte, repondez simplement &laquo;&nbsp;STOP&nbsp;&raquo;."
  );
}

function html(m, pub, nom, lieu) {
  const bonjour = nom ? "Bonjour " + esc(nom) + "," : "Bonjour,";
  return [
    '<!doctype html><html lang="fr"><body style="margin:0;background:#f4f5f7">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7"><tr><td align="center" style="padding:20px 12px">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e8eaed">',

    // Le visuel en tete, cliquable : c'est lui qui arrete le pouce.
    '<tr><td style="padding:0"><a href="' + m.cta.url + '" style="display:block">',
    '<img src="' + BUCKET + "/" + m.image + '" width="560" alt="Wanteermako"',
    ' style="display:block;width:100%;max-width:560px;height:auto;border:0"></a></td></tr>',

    '<tr><td style="padding:24px 26px;font-family:Arial,Helvetica,sans-serif;color:#1a1f36">',
    '<p style="font-size:15px;margin:0 0 14px">' + bonjour + "</p>",
    '<p style="font-size:14px;line-height:1.6;margin:0 0 18px">' + m.intro[pub] + "</p>",

    '<div style="margin:0 0 20px;padding:16px;background:#f7f8ff;border-radius:10px;border:1px solid #e7e9ff">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1a1f36">',
    m.points
      .map(
        (p) =>
          '<tr><td style="padding:5px 0;width:18px;color:#6366F1;font-weight:bold">&bull;</td><td style="padding:5px 0">' +
          p +
          "</td></tr>"
      )
      .join(""),
    "</table></div>",

    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td>',
    '<a href="' + m.cta.url + '"',
    ' style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:15px;padding:13px 26px;border-radius:10px">' +
      m.cta.texte +
      "</a>",
    "</td></tr></table>",

    "</td></tr>",
    '<tr><td style="padding:14px 24px 20px;font-family:Arial,sans-serif;font-size:11px;color:#9AA0B0;text-align:center;line-height:1.6;border-top:1px solid #eceef2">',
    pied(pub, lieu),
    "<br>Wanteermako &mdash; www.wanteermako.com",
    "</td></tr></table></td></tr></table></body></html>",
  ].join("");
}

const sansEntites = (s) =>
  String(s)
    .replace(/&rsquo;/g, "'")
    .replace(/&laquo;&nbsp;|&nbsp;&raquo;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&bull;/g, "-");

function texte(m, pub, nom, lieu) {
  const bonjour = nom ? "Bonjour " + nom + "," : "Bonjour,";
  const bas =
    pub === "membres"
      ? "Vous recevez ce message parce que vous avez un compte sur Wanteermako.\nPour ne plus recevoir ce genre d'annonce, repondez « STOP »."
      : `Vous recevez cet email car votre etablissement est reference publiquement comme professionnel${lieu}.\nPour ne plus etre contacte, repondez « STOP ».`;
  return [
    bonjour,
    "",
    sansEntites(m.intro[pub]),
    "",
    ...m.points.map((p) => "- " + sansEntites(p)),
    "",
    sansEntites(m.cta.texte) + " : " + m.cta.url,
    "",
    "--",
    bas,
    "Wanteermako - www.wanteermako.com",
  ].join("\n");
}

/* ============================ Destinataires ============================== */

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
  const q =
    "select=id,name,email,city,email_sent_count&email=not.is.null&email_opt_out=not.is.true&limit=1000";
  const r = await fetch(U + "/rest/v1/prospects?" + q, { headers: SB });
  if (!r.ok) throw new Error("Supabase rest " + r.status);
  const vus = new Set();
  const out = [];
  for (const p of await r.json()) {
    const mail = String(p.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail) || vus.has(mail)) continue;
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

async function envoyer(m, d) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: env.BREVO_SENDER_EMAIL, name: "Wanteermako" },
      replyTo: { email: env.BREVO_SENDER_EMAIL, name: "Wanteermako" },
      to: [{ email: d.email, ...(d.nom ? { name: d.nom } : {}) }],
      subject: sansEntites(m.sujet[d.public]),
      htmlContent: html(m, d.public, d.nom, d.lieu),
      textContent: texte(m, d.public, d.nom, d.lieu),
    }),
  });
  const b = await r.json().catch(() => ({}));
  return r.ok ? { ok: true } : { ok: false, error: b?.message || "HTTP " + r.status };
}

/* ================================= Main ================================== */

const cle = val("--modele");
if (!cle) {
  console.log("Modeles disponibles :\n");
  for (const [k, m] of Object.entries(MODELES)) {
    console.log("  " + k.padEnd(12) + m.titre);
    console.log("  " + " ".repeat(12) + "membres   : " + sansEntites(m.sujet.membres));
    console.log("  " + " ".repeat(12) + "prospects : " + sansEntites(m.sujet.prospects));
    console.log("");
  }
  console.log("Exemple : node scripts/campagnes.mjs --modele boosts --public membres --go");
  process.exit(0);
}

const M = MODELES[cle];
if (!M) {
  console.error("Modele inconnu : " + cle + "\nDisponibles : " + Object.keys(MODELES).join(", "));
  process.exit(1);
}

if (has("--apercu")) {
  for (const pub of ["membres", "prospects"]) {
    const f = `apercu-${cle}-${pub}.html`;
    fs.writeFileSync(f, html(M, pub, pub === "membres" ? "Moussa" : "Garage Ndiaye", " a Dakar"), "utf8");
    console.log("ecrit : " + f);
  }
  process.exit(0);
}

const pub = val("--public") || "tous";
const only = val("--only");

let cible = [];
if (only) {
  if (pub === "membres" || pub === "tous") cible.push({ public: "membres", email: only, nom: "", lieu: "" });
  if (pub === "prospects" || pub === "tous")
    cible.push({ public: "prospects", email: only, nom: "Garage Ndiaye", lieu: " a Dakar" });
} else {
  if (pub === "membres" || pub === "tous") cible = cible.concat(await membres());
  if (pub === "prospects" || pub === "tous") cible = cible.concat(await prospects());
}

console.log("Modele     : " + cle + " — " + M.titre);
console.log("Visuel     : " + BUCKET + "/" + M.image);
console.log("Expediteur : Wanteermako <" + env.BREVO_SENDER_EMAIL + ">");
console.log("Membres    : " + cible.filter((d) => d.public === "membres").length);
console.log("Prospects  : " + cible.filter((d) => d.public === "prospects").length);
console.log("TOTAL      : " + cible.length);

if (!has("--go")) {
  console.log("\nMode liste : RIEN n'a ete envoye. Ajouter --go pour envoyer.");
  process.exit(0);
}

let ok = 0;
let ko = 0;
const echecs = [];
for (let i = 0; i < cible.length; i++) {
  const d = cible[i];
  const r = await envoyer(M, d);
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
