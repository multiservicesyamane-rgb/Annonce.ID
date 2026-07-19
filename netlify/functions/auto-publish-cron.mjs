// Netlify Scheduled Function — publication sociale (Telegram/Facebook).
// Appelle la route Next.js protégée par CRON_SECRET. Horaires en UTC
// (= heure de Dakar) : 9h, 15h, 21h.
export default async () => {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "https://wanteermako.com";
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET manquant dans les variables Netlify (scope Functions).");

  const res = await fetch(`${siteUrl}/api/campaign/auto-publish`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({ source: "netlify-cron" }),
  });
  const body = await res.text();
  console.log(`auto-publish → HTTP ${res.status} : ${body.slice(0, 500)}`);
  if (!res.ok) throw new Error(`auto-publish a échoué : ${res.status}`);
};

export const config = {
  schedule: "0 9,15,21 * * *",
};
