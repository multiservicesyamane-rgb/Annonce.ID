// Netlify Scheduled Function — récolte quotidienne de prospects.
// Toutes les 2 h (5h30-21h30 UTC) : démarrage du run Apify du jour,
// import des fiches, extraction des emails par tranches.
export default async () => {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "https://wanteermako.com";
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET manquant dans les variables Netlify (scope Functions).");

  const res = await fetch(`${siteUrl}/api/cron/prospect-harvest`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({ source: "netlify-cron" }),
  });
  const body = await res.text();
  console.log(`prospect-harvest → HTTP ${res.status} : ${body.slice(0, 500)}`);
  if (!res.ok) throw new Error(`prospect-harvest a échoué : ${res.status}`);
};

export const config = {
  schedule: "30 5-21/2 * * *",
};
