// Netlify Scheduled Function — alertes de recherche.
// Toutes les heures : notifie par email les utilisateurs dont une alerte
// correspond à une nouvelle annonce active (voir /api/cron/search-alerts).
export default async () => {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "https://wanteermako.com";
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET manquant dans les variables Netlify (scope Functions).");

  const res = await fetch(`${siteUrl}/api/cron/search-alerts`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({ source: "netlify-cron" }),
  });
  const body = await res.text();
  console.log(`search-alerts → HTTP ${res.status} : ${body.slice(0, 500)}`);
  if (!res.ok) throw new Error(`search-alerts a échoué : ${res.status}`);
};

export const config = {
  // Toutes les heures, à la minute 20 (décalé des autres crons).
  schedule: "20 * * * *",
};
