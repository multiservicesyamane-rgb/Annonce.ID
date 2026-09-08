// Lecture des chiffres d'audience Google Analytics, cote serveur.
//
// ── Pourquoi ce fichier plutot qu'une librairie ─────────────────────────
// `googleapis` pese plusieurs mega-octets pour deux appels HTTP. Ici on
// signe nous-memes le jeton avec le module `crypto` de Node — deja present,
// rien a installer, rien a maintenir a jour.
//
// ── Pourquoi un compte de service ───────────────────────────────────────
// L'API de donnees GA4 n'accepte pas la cle de mesure `G-…` : celle-la sert
// a ECRIRE depuis le navigateur. Pour LIRE, Google exige un compte de
// service autorise sur la propriete. Sa cle privee ne quitte jamais le
// serveur — elle ne doit surtout pas devenir une variable `NEXT_PUBLIC_*`.

import { createSign } from "crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://analyticsdata.googleapis.com/v1beta";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export type ConfigGA = { propertyId: string; email: string; key: string };

/**
 * Configuration presente et complete ?
 *
 * Les trois valeurs vont ensemble : sans l'une, l'appel echouerait avec un
 * message de Google incomprehensible cote admin. Mieux vaut le dire ici.
 */
export function configGA(): ConfigGA | null {
  const propertyId = (process.env.GA_PROPERTY_ID || "").trim();
  const email = (process.env.GA_SA_EMAIL || "").trim();
  // Les sauts de ligne d'une cle PEM ne survivent pas a une variable
  // d'environnement : ils y sont ecrits « \n ». On les retablit.
  const key = (process.env.GA_SA_KEY || "").replace(/\\n/g, "\n").trim();
  if (!propertyId || !email || !key) return null;
  return { propertyId, email, key };
}

const b64url = (s: string | Buffer) =>
  Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Jeton d'acces, obtenu par echange d'un JWT signe. Valable une heure. */
let cache: { token: string; expire: number } | null = null;

async function jeton(cfg: ConfigGA): Promise<string> {
  // Re-signer a chaque requete ferait trois allers-retours pour un ecran :
  // on garde le jeton jusqu'a une minute avant son expiration.
  if (cache && cache.expire > Date.now() + 60_000) return cache.token;

  const maintenant = Math.floor(Date.now() / 1000);
  const entete = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corps = b64url(
    JSON.stringify({
      iss: cfg.email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: maintenant,
      exp: maintenant + 3600,
    }),
  );

  const signature = createSign("RSA-SHA256").update(`${entete}.${corps}`).sign(cfg.key);
  const assertion = `${entete}.${corps}.${b64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data?.error_description || "Authentification Google refusee.");
  }

  cache = { token: data.access_token, expire: Date.now() + (data.expires_in || 3600) * 1000 };
  return cache.token;
}

type Ligne = { cles: string[]; valeurs: number[] };

/** Un rapport GA4, ramene a des lignes simples. */
async function rapport(
  cfg: ConfigGA,
  corps: Record<string, unknown>,
): Promise<Ligne[]> {
  const res = await fetch(`${API}/properties/${cfg.propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await jeton(cfg)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corps),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "Lecture Google Analytics impossible.");

  return (data.rows || []).map((r: any) => ({
    cles: (r.dimensionValues || []).map((d: any) => String(d.value ?? "")),
    valeurs: (r.metricValues || []).map((m: any) => Number(m.value) || 0),
  }));
}

const dim = (name: string) => ({ name });
const met = (name: string) => ({ name });

/**
 * Tout ce que l'ecran d'audience affiche, en un appel groupe.
 *
 * `jours` borne la periode : GA compte en jours pleins, « 30daysAgo » couvre
 * donc les trente derniers jours revolus plus celui en cours.
 */
export async function audience(jours = 30) {
  const cfg = configGA();
  if (!cfg) return null;

  const periode = [{ startDate: `${jours}daysAgo`, endDate: "today" }];

  const [totaux, parJour, pages, sources, pays, appareils, temsReel] = await Promise.all([
    rapport(cfg, {
      dateRanges: periode,
      metrics: [
        met("activeUsers"),
        met("sessions"),
        met("screenPageViews"),
        met("averageSessionDuration"),
        met("bounceRate"),
      ],
    }),
    rapport(cfg, {
      dateRanges: periode,
      dimensions: [dim("date")],
      metrics: [met("activeUsers"), met("sessions"), met("screenPageViews")],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 60,
    }),
    rapport(cfg, {
      dateRanges: periode,
      dimensions: [dim("pagePath")],
      metrics: [met("screenPageViews"), met("activeUsers")],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 15,
    }),
    rapport(cfg, {
      dateRanges: periode,
      dimensions: [dim("sessionDefaultChannelGroup")],
      metrics: [met("sessions"), met("activeUsers")],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
    rapport(cfg, {
      dateRanges: periode,
      dimensions: [dim("country")],
      metrics: [met("activeUsers")],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: 10,
    }),
    rapport(cfg, {
      dateRanges: periode,
      dimensions: [dim("deviceCategory")],
      metrics: [met("activeUsers")],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: 5,
    }),
    // Les trente dernieres minutes — le seul chiffre qui bouge sous les yeux.
    fetch(`${API}/properties/${cfg.propertyId}:runRealtimeReport`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await jeton(cfg)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ metrics: [met("activeUsers")] }),
    })
      .then((r) => r.json())
      .then((d) => Number(d?.rows?.[0]?.metricValues?.[0]?.value) || 0)
      .catch(() => 0),
  ]);

  const t = totaux[0]?.valeurs || [0, 0, 0, 0, 0];

  return {
    periode: jours,
    totaux: {
      visiteurs: t[0],
      sessions: t[1],
      pages_vues: t[2],
      // GA renvoie des secondes ; l'ecran affiche des minutes et secondes.
      duree_moyenne: Math.round(t[3]),
      taux_rebond: Math.round(t[4] * 100),
      en_ligne: temsReel,
    },
    // « 20260908 » → « 2026-09-08 », lisible et triable.
    par_jour: parJour.map((l) => ({
      date: `${l.cles[0].slice(0, 4)}-${l.cles[0].slice(4, 6)}-${l.cles[0].slice(6, 8)}`,
      visiteurs: l.valeurs[0],
      sessions: l.valeurs[1],
      pages: l.valeurs[2],
    })),
    pages: pages.map((l) => ({ chemin: l.cles[0], vues: l.valeurs[0], visiteurs: l.valeurs[1] })),
    sources: sources.map((l) => ({ canal: l.cles[0], sessions: l.valeurs[0], visiteurs: l.valeurs[1] })),
    pays: pays.map((l) => ({ pays: l.cles[0], visiteurs: l.valeurs[0] })),
    appareils: appareils.map((l) => ({ type: l.cles[0], visiteurs: l.valeurs[0] })),
  };
}
