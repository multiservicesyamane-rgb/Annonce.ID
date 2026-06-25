// Envoi d'emails transactionnels (factures) via Resend.
// Configuration (Vercel + .env.local) :
//   RESEND_API_KEY = re_xxx   (https://resend.com → API Keys)
//   EMAIL_FROM     = Wanteermako <facture@wanteermako.com>  (domaine vérifié dans Resend)
// Si la clé n'est pas configurée, l'envoi est ignoré sans planter (no-op).

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export type InvoiceData = {
  to: string;
  customerName?: string;
  itemName: string;
  amount: number;
  durationDays?: number;
  method?: string;   // ex: "Espèces", "Wave", "PayTech"
  ref?: string;
  expires?: string;  // ISO
};

function invoiceHtml(d: InvoiceData): string {
  const date = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const exp = d.expires ? new Date(d.expires).toLocaleDateString("fr-FR") : null;
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1a1f36">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e8eaed">
    <div style="background:#6366F1;padding:22px 28px;color:#fff">
      <div style="font-size:20px;font-weight:800">Wanteermako</div>
      <div style="font-size:13px;opacity:.9">Reçu / Facture</div>
    </div>
    <div style="padding:26px 28px">
      <p style="font-size:15px;margin:0 0 14px">Bonjour ${d.customerName || ""},</p>
      <p style="font-size:14px;line-height:1.5;margin:0 0 20px">Merci ! Votre paiement a bien été reçu et votre formule est <b>activée</b>. Voici votre reçu :</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#6b7280">Formule</td><td style="padding:8px 0;text-align:right;font-weight:700">${d.itemName}</td></tr>
        ${d.durationDays ? `<tr><td style="padding:8px 0;color:#6b7280">Durée</td><td style="padding:8px 0;text-align:right">${d.durationDays} jours</td></tr>` : ""}
        ${d.method ? `<tr><td style="padding:8px 0;color:#6b7280">Moyen de paiement</td><td style="padding:8px 0;text-align:right">${d.method}</td></tr>` : ""}
        ${d.ref ? `<tr><td style="padding:8px 0;color:#6b7280">Référence</td><td style="padding:8px 0;text-align:right">${d.ref}</td></tr>` : ""}
        ${exp ? `<tr><td style="padding:8px 0;color:#6b7280">Expire le</td><td style="padding:8px 0;text-align:right">${exp}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#6b7280">Date</td><td style="padding:8px 0;text-align:right">${date}</td></tr>
      </table>
      <div style="margin:18px 0;padding:16px;background:#f0f1ff;border-radius:10px;text-align:center">
        <div style="font-size:12px;color:#6b7280">Montant payé</div>
        <div style="font-size:26px;font-weight:800;color:#6366F1">${fmt(d.amount)} FCFA</div>
      </div>
      <p style="font-size:12px;color:#9ca3af;line-height:1.5;margin:18px 0 0">Ceci est un reçu automatique. Pour toute question, répondez à cet email.<br/>Wanteermako — wanteermako.com</p>
    </div>
  </div></body></html>`;
}

function notifHtml(title: string, body: string, ctaUrl?: string, ctaLabel?: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1a1f36">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e8eaed">
    <div style="background:#6366F1;padding:20px 28px;color:#fff;font-size:20px;font-weight:800">Wanteermako</div>
    <div style="padding:26px 28px">
      <h2 style="font-size:17px;margin:0 0 12px;color:#111">${title}</h2>
      <p style="font-size:14px;line-height:1.6;margin:0 0 20px;color:#374151">${body}</p>
      ${ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px">${ctaLabel || "Voir sur Wanteermako"}</a>` : ""}
      <p style="font-size:12px;color:#9ca3af;line-height:1.5;margin:24px 0 0">Vous recevez cet email car vous avez un compte Wanteermako.<br/>wanteermako.com</p>
    </div>
  </div></body></html>`;
}

/** Email de notification générique (nouveau message, annonce activée, etc.). */
export async function sendNotificationEmail(opts: { to: string; subject: string; title: string; body: string; ctaUrl?: string; ctaLabel?: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return false;
  const from = process.env.EMAIL_FROM || "Wanteermako <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: notifHtml(opts.title, opts.body, opts.ctaUrl, opts.ctaLabel) }),
    });
    if (!res.ok) { console.error("Resend notif error:", await res.text()); return false; }
    return true;
  } catch (e) {
    console.error("sendNotificationEmail error:", e);
    return false;
  }
}

/** Envoie l'email de facture. Renvoie true si envoyé, false si non configuré/échec. */
export async function sendInvoiceEmail(d: InvoiceData): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !d.to) return false;
  const from = process.env.EMAIL_FROM || "Wanteermako <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: d.to,
        subject: `Reçu Wanteermako — ${d.itemName} (${fmt(d.amount)} FCFA)`,
        html: invoiceHtml(d),
      }),
    });
    if (!res.ok) { console.error("Resend error:", await res.text()); return false; }
    return true;
  } catch (e) {
    console.error("sendInvoiceEmail error:", e);
    return false;
  }
}
