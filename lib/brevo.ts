// Envoi d'emails via Brevo (API v3). Utilisé pour la prospection et, à terme,
// les emails de cycle de vie. L'expéditeur par défaut est l'adresse pro du
// domaine authentifié (SPF+DKIM+DMARC) pour maximiser la boîte de réception.

const DEFAULT_SENDER = process.env.BREVO_SENDER_EMAIL || "contact@wanteermako.com";
const DEFAULT_NAME = process.env.BREVO_SENDER_NAME || "Wanteermako";

export function brevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}

export interface BrevoEmail {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  senderEmail?: string;
  senderName?: string;
  replyToEmail?: string;   // où arrivent les réponses (défaut : l'expéditeur)
  replyToName?: string;
  bcc?: string;            // copie cachée (ex : boîte du propriétaire pour suivi)
}

export async function sendBrevoEmail(e: BrevoEmail): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return { ok: false, error: "BREVO_API_KEY manquante côté serveur" };
  if (!e.to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.to)) return { ok: false, error: "email destinataire invalide" };

  const sender = { email: e.senderEmail || DEFAULT_SENDER, name: e.senderName || DEFAULT_NAME };
  const replyTo = e.replyToEmail
    ? { email: e.replyToEmail, name: e.replyToName || sender.name }
    : sender;
  const validBcc = e.bcc && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.bcc) ? e.bcc : "";
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender,
        replyTo,
        to: [{ email: e.to, ...(e.toName ? { name: e.toName } : {}) }],
        ...(validBcc ? { bcc: [{ email: validBcc }] } : {}),
        subject: e.subject,
        htmlContent: e.html,
        ...(e.text ? { textContent: e.text } : {}),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: body?.message || `Brevo HTTP ${res.status}` };
    return { ok: true, id: body?.messageId };
  } catch (err: any) {
    return { ok: false, error: err?.message || "échec réseau Brevo" };
  }
}
