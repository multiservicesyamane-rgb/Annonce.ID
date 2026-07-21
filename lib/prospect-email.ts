import type { SupabaseClient } from "@supabase/supabase-js";
import { sendBrevoEmail, brevoConfigured } from "@/lib/brevo";

// Emails de prospection du CRM : modèle unique, adapté au secteur du prospect
// (téléphonie / automobile / immobilier / générique). Plafond quotidien pour
// protéger la réputation d'expéditeur. Nécessite les colonnes de
// database/MIGRATION_PROSPECTS_EMAIL_OUTREACH.sql.

const SITE = "https://wanteermako.com";
const WA_DISPLAY = "+221 77 682 78 51";
const WA_LINK = `https://wa.me/221776827851?text=${encodeURIComponent("Bonjour, je vous écris suite à votre email au sujet de Wanteermako.")}`;

// Boîte du propriétaire : reçoit les RÉPONSES des prospects (reply-to) et une
// COPIE (BCC) de chaque email envoyé, pour suivi depuis le téléphone.
function ownerInbox(): string {
  return process.env.PROSPECT_INBOX || process.env.SUPER_ADMIN_EMAIL || "wanteermako@gmail.com";
}

// Plafond d'envois par JOUR (tous prospects confondus). Brevo gratuit = 300/j.
// Défaut prudent (40) : monter progressivement via PROSPECT_EMAIL_DAILY_CAP
// pour chauffer le domaine sans se faire blacklister.
export function dailyCap(): number {
  const n = Number(process.env.PROSPECT_EMAIL_DAILY_CAP);
  return Number.isFinite(n) && n > 0 ? n : 40;
}

// Jours entre deux emails à un même prospect (relance hebdomadaire).
export function relanceDays(): number {
  const n = Number(process.env.PROSPECT_EMAIL_RELANCE_DAYS);
  return Number.isFinite(n) && n > 0 ? n : 7;
}

// Nombre MAX d'emails par entreprise (1er + relances). Au-delà : on arrête.
// Plafonné pour rester dans les clous (anti-spam / réputation / légal).
export function maxSends(): number {
  const n = Number(process.env.PROSPECT_EMAIL_MAX_SENDS);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

type Sector = "immobilier" | "automobile" | "telephonie" | "generique";

function detectSector(text: string): Sector {
  const t = (text || "").toLowerCase();
  if (/immo|agence|terrain|maison|appart|villa|logement|foncier|location/.test(t)) return "immobilier";
  if (/auto|voiture|v[ée]hic|concession|moto|garage|showroom/.test(t)) return "automobile";
  if (/t[ée]l[ée]phone|phone|smartphone|mobile|gsm|apple|samsung|multim[ée]dia|[ée]lectro|informat/.test(t)) return "telephonie";
  return "generique";
}

// Vocabulaire par secteur : ce que les acheteurs cherchent, et le mot "vitrine".
const WORDS: Record<Sector, { cherche: string; vitrine: string; item: string }> = {
  immobilier: { cherche: "un logement", vitrine: "vos biens", item: "chaque bien : photos, prix, surface, quartier" },
  automobile: { cherche: "un véhicule", vitrine: "votre parc", item: "chaque véhicule : photos, prix, kilométrage" },
  telephonie: { cherche: "un téléphone ou un accessoire", vitrine: "vos produits", item: "chaque produit : photos, prix, description" },
  generique: { cherche: "des produits comme les vôtres", vitrine: "vos produits", item: "chaque produit : photos, prix, description" },
};

export interface ProspectForEmail {
  name?: string | null;
  sector?: string | null;
  city?: string | null;
  email?: string | null;
  source_url?: string | null;
  notes?: string | null;
}

function esc(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildProspectEmail(p: ProspectForEmail, attempt = 1): { subject: string; html: string; text: string } {
  const name = (p.name || "votre établissement").trim();
  const city = (p.city || "").trim();
  const sector = detectSector(`${p.sector || ""} ${p.name || ""} ${p.notes || ""}`);
  const w = WORDS[sector];
  const lieu = city ? ` à ${city}` : "";
  const isFollowUp = attempt >= 2;

  // Objet + phrase d'accroche : version « premier contact » ou « relance »,
  // pour ne jamais renvoyer un email identique.
  const subject = isFollowUp
    ? `${name}, votre vitrine gratuite vous attend toujours`
    : `${name}, ${w.vitrine} devant les acheteurs du Sénégal`;
  const lead = isFollowUp
    ? `Je me permets de revenir vers vous : chaque jour, des acheteurs sénégalais cherchent ${w.cherche} en ligne, et votre vitrine gratuite sur Wanteermako reste disponible${lieu}.`
    : `Vous faites partie des professionnels qui comptent${lieu} — et chaque jour, des acheteurs sénégalais cherchent ${w.cherche} en ligne. Notre rôle est simple : les amener jusqu'à vous.`;

  const bullets: [string, string][] = [
    [`Une vitrine gratuite pour ${w.vitrine}`, w.item],
    ["Les acheteurs vous contactent en direct", "par WhatsApp ou téléphone — aucun intermédiaire, aucune commission sur vos ventes"],
    ["Une page boutique à votre enseigne", "votre nom, vos coordonnées, tout au même endroit"],
    ["Des options de visibilité, à votre rythme", "mises en avant disponibles si vous le souhaitez — jamais obligatoires"],
  ];

  const html = `
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">Une vitrine gratuite pour ${esc(w.vitrine)}, là où les acheteurs cherchent déjà.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F7;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #E8EAEE">
  <tr><td style="padding:26px 34px 0">
    <table role="presentation" width="100%"><tr>
      <td style="font-family:Georgia,serif;font-size:21px;font-weight:700;color:#1F2437">Wanteermako</td>
      <td align="right" style="font-family:Arial,sans-serif;font-size:11px;color:#8A90A3;letter-spacing:.4px;text-transform:uppercase">Marketplace · Sénégal</td>
    </tr></table>
    <div style="height:3px;background:linear-gradient(90deg,#6366F1,#8B5CF6,#EC4899);border-radius:3px;margin-top:14px"></div>
  </td></tr>
  <tr><td style="padding:28px 34px 0;font-family:Arial,Helvetica,sans-serif">
    <p style="font-size:15px;color:#1F2437;margin:0 0 16px">Bonjour <b>${esc(name)}</b>,</p>
    <p style="font-size:14px;color:#3D4356;line-height:1.75;margin:0 0 18px">
      ${esc(lead)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px">
      ${bullets.map(([t, d]) => `<tr>
        <td width="26" valign="top" style="padding:7px 0;font-size:14px;color:#4F46E5;font-weight:800">✓</td>
        <td style="padding:7px 0;font-family:Arial,sans-serif;font-size:14px;color:#1F2437;line-height:1.5"><b>${esc(t)}</b><br><span style="color:#6B7185;font-size:13px">${esc(d)}</span></td>
      </tr>`).join("")}
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 8px"><tr><td style="background:#4F46E5;border-radius:10px">
      <a href="${SITE}" style="display:inline-block;padding:13px 30px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none">Ouvrir ma vitrine gratuite</a>
    </td></tr></table>
    <p style="text-align:center;font-family:Arial,sans-serif;font-size:13px;color:#6B7185;margin:0 0 24px">
      ou répondez « <b>OK</b> » à cet email&nbsp;: je prépare un exemple de votre page, gratuitement, et vous décidez ensuite.<br>
      WhatsApp&nbsp;: <a href="${WA_LINK}" style="color:#128C7E;font-weight:700;text-decoration:none">${WA_DISPLAY}</a>
    </p>
    <div style="height:1px;background:#ECEDF2"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 26px"><tr>
      <td width="44" valign="middle"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;font-family:Arial,sans-serif;font-size:17px;font-weight:800;text-align:center;line-height:40px">W</div></td>
      <td style="padding-left:12px;font-family:Arial,sans-serif"><span style="font-size:14px;font-weight:700;color:#1F2437">L'équipe Wanteermako</span><br><span style="font-size:12px;color:#6B7185">wanteermako.com · WhatsApp ${WA_DISPLAY}</span></td>
    </tr></table>
  </td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px"><tr><td style="padding:16px 24px;font-family:Arial,sans-serif;font-size:11px;color:#9AA0B0;text-align:center;line-height:1.6">
  Vous recevez cet email car votre établissement est référencé publiquement comme professionnel${esc(lieu)}.<br>Pour ne plus être contacté, répondez simplement «&nbsp;STOP&nbsp;».
</td></tr></table>
</td></tr></table>`;

  const text = `Bonjour ${name},

${lead}

Sur Wanteermako (wanteermako.com) :
${bullets.map(([t, d]) => `- ${t} : ${d}`).join("\n")}

Ouvrir votre vitrine gratuite : ${SITE}
Ou répondez « OK » : je prépare un exemple de votre page, gratuitement.
WhatsApp : ${WA_DISPLAY}

L'équipe Wanteermako — wanteermako.com

--
Vous recevez cet email car votre établissement est référencé publiquement. Pour ne plus être contacté, répondez « STOP ».`;

  return { subject, html, text };
}

function startOfTodayIso() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function emailsSentToday(sb: SupabaseClient): Promise<number> {
  const { count } = await sb
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .gte("email_sent_at", startOfTodayIso());
  return count || 0;
}

/**
 * Envoie l'email de prospection à un prospect.
 * Règles : opt-out respecté ; plafond quotidien ; relance autorisée seulement
 * après `relanceDays` jours et tant que le nombre d'envois < `maxSends`.
 * Tolérant au schéma : fonctionne même si email_sent_count n'existe pas encore
 * (avant la migration relance → comportement « 1 seul envoi »).
 */
export async function sendProspectEmail(sb: SupabaseClient, id: string) {
  if (!brevoConfigured()) return { error: "BREVO_API_KEY manquante côté serveur" };
  if (!id) return { error: "prospect manquant" };

  // Sélection tolérante : email_sent_count peut manquer (migration non appliquée).
  const cols = "id, name, sector, city, email, source_url, notes, email_sent_at, email_opt_out";
  let p: any = null;
  const withCount = await sb.from("prospects").select(`${cols}, email_sent_count`).eq("id", id).maybeSingle();
  if (withCount.error && /email_sent_count/i.test(withCount.error.message || "")) {
    const noCount = await sb.from("prospects").select(cols).eq("id", id).maybeSingle();
    if (noCount.error) {
      if (/email_sent_at|email_opt_out/i.test(noCount.error.message || "")) return { error: "Exécuter database/MIGRATION_PROSPECTS_EMAIL_OUTREACH.sql d'abord" };
      return { error: noCount.error.message };
    }
    p = noCount.data ? { ...noCount.data, email_sent_count: noCount.data.email_sent_at ? 1 : 0 } : null;
  } else if (withCount.error) {
    if (/email_sent_at|email_opt_out/i.test(withCount.error.message || "")) return { error: "Exécuter database/MIGRATION_PROSPECTS_EMAIL_OUTREACH.sql d'abord" };
    return { error: withCount.error.message };
  } else {
    p = withCount.data;
  }

  if (!p) return { error: "prospect introuvable" };
  if (!p.email) return { error: "ce prospect n'a pas d'email" };
  if (p.email_opt_out) return { error: "prospect désinscrit (STOP)" };

  const count = Number(p.email_sent_count || 0);
  const maxN = maxSends();
  if (count >= maxN) return { error: `plafond de relances atteint (${maxN} max)`, already: true };
  if (p.email_sent_at) {
    const gap = relanceDays();
    if (Date.now() - new Date(p.email_sent_at).getTime() < gap * 86400000) {
      return { error: `déjà contacté il y a moins de ${gap} jours`, already: true };
    }
  }

  const cap = dailyCap();
  const sent = await emailsSentToday(sb);
  if (sent >= cap) return { error: `plafond du jour atteint (${cap}/jour)`, capReached: true, sentToday: sent, cap };

  const attempt = count + 1;
  const { subject, html, text } = buildProspectEmail(p, attempt);
  const inbox = ownerInbox();
  const r = await sendBrevoEmail({
    to: p.email,
    toName: p.name || undefined,
    subject,
    html,
    text,
    replyToEmail: inbox,          // réponses du prospect → boîte du propriétaire
    replyToName: "Wanteermako",
    bcc: inbox,                   // copie de suivi → boîte du propriétaire
  });
  if (!r.ok) return { error: r.error || "échec d'envoi" };

  // Mise à jour tolérante au schéma (email_sent_count optionnel).
  const upd: Record<string, unknown> = { email_sent_at: new Date().toISOString(), email_sent_count: attempt, status: "ct" };
  const u = await sb.from("prospects").update(upd).eq("id", id);
  if (u.error && /email_sent_count/i.test(u.error.message || "")) {
    delete upd.email_sent_count;
    await sb.from("prospects").update(upd).eq("id", id);
  }

  return { ok: true, sentToday: sent + 1, cap, to: p.email, attempt };
}

/**
 * Envoi automatique du lot quotidien (cron du matin).
 * Complète le plafond du jour SANS le dépasser : si l'admin a déjà envoyé
 * des emails à la main, on n'envoie que le reste. Meilleurs prospects d'abord
 * (score IA décroissant). Anti-doublon, opt-out et marquage gérés par
 * sendProspectEmail (réutilisé tel quel pour rester cohérent avec le CRM).
 */
export async function sendProspectEmailsBatch(sb: SupabaseClient, maxOverride?: number) {
  if (!brevoConfigured()) return { error: "BREVO_API_KEY manquante côté serveur" };

  const cap = dailyCap();
  const already = await emailsSentToday(sb);
  let remaining = Math.max(0, cap - already);
  if (typeof maxOverride === "number" && maxOverride > 0) remaining = Math.min(remaining, maxOverride);
  if (remaining <= 0) {
    return { ok: true, sent: 0, attempted: 0, sentToday: already, cap, note: "plafond du jour déjà atteint" };
  }

  // Candidats : jamais contactés OU à relancer (dernier envoi > relanceDays,
  // sous le plafond de relances). Les plus anciens/nouveaux d'abord.
  const cutoff = new Date(Date.now() - relanceDays() * 86400000).toISOString();
  let candidates: any[] | null = null;
  let query = await sb
    .from("prospects")
    .select("id")
    .not("email", "is", null)
    .not("email_opt_out", "is", true)
    .lt("email_sent_count", maxSends())
    .or(`email_sent_at.is.null,email_sent_at.lt.${cutoff}`)
    .order("email_sent_at", { ascending: true, nullsFirst: true })
    .limit(remaining);

  if (query.error && /email_sent_count/i.test(query.error.message || "")) {
    // Migration relance pas encore appliquée → comportement « 1 seul envoi ».
    query = await sb
      .from("prospects")
      .select("id")
      .not("email", "is", null)
      .not("email_opt_out", "is", true)
      .is("email_sent_at", null)
      .order("score", { ascending: false, nullsFirst: false })
      .limit(remaining);
  }
  if (query.error) {
    if (/email_sent_at|email_opt_out|score/i.test(query.error.message || "")) {
      return { error: "Exécuter database/MIGRATION_PROSPECTS_EMAIL_OUTREACH.sql d'abord" };
    }
    return { error: query.error.message };
  }
  candidates = query.data;

  let sent = 0;
  const errors: string[] = [];
  for (const c of candidates || []) {
    const r = await sendProspectEmail(sb, c.id);
    if (r.ok) sent++;
    else if (r.capReached) break; // sécurité (course avec un envoi manuel)
    else if (r.error) errors.push(r.error);
    await new Promise((res) => setTimeout(res, 1200)); // throttle doux (réputation expéditeur)
  }

  return {
    ok: true,
    sent,
    attempted: (candidates || []).length,
    sentToday: already + sent,
    cap,
    errors: errors.slice(0, 5),
  };
}

/** Marque un prospect comme désinscrit (réponse STOP). */
export async function optOutProspect(sb: SupabaseClient, id: string) {
  if (!id) return { error: "prospect manquant" };
  const { error } = await sb.from("prospects").update({ email_opt_out: true }).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
