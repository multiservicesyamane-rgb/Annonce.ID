// Netlify Scheduled Function — envoi automatique des emails de prospection.
// Une fois par jour à 08h00 UTC (= 08h00 Dakar) : envoie le lot du jour
// (jusqu'au plafond quotidien, partagé avec les envois manuels du CRM).
export default async () => {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "https://wanteermako.com";
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET manquant dans les variables Netlify (scope Functions).");

  const res = await fetch(`${siteUrl}/api/cron/prospect-emails`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({ source: "netlify-cron" }),
  });
  const body = await res.text();
  console.log(`prospect-emails → HTTP ${res.status} : ${body.slice(0, 500)}`);
  if (!res.ok) throw new Error(`prospect-emails a échoué : ${res.status}`);
};

export const config = {
  schedule: "0 8 * * *",
};
