import type { Publisher, PublishInput, PublishResult } from "./types";

// Telegram Bot API — 100% gratuit et illimité.
// Config requise :
//   TELEGRAM_BOT_TOKEN   — token du bot (via @BotFather)
//   TELEGRAM_CHANNEL_ID  — @moncanal ou id numérique (-100…). Le bot doit être admin du canal.

function token() {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}
function channel() {
  return process.env.TELEGRAM_CHANNEL_ID || "";
}

export const telegramPublisher: Publisher = {
  platform: "telegram",

  isConfigured() {
    return Boolean(token() && channel());
  },

  async publish(input: PublishInput): Promise<PublishResult> {
    if (!this.isConfigured()) {
      return { platform: "telegram", ok: false, skipped: true, error: "Telegram non configuré" };
    }

    const base = `https://api.telegram.org/bot${token()}`;
    const text = input.link ? `${input.caption}\n\n${input.link}` : input.caption;

    try {
      let res: Response;
      if (input.imageUrl) {
        // Photo + légende (limite légende Telegram : 1024 caractères)
        res = await fetch(`${base}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: channel(),
            photo: input.imageUrl,
            caption: text.slice(0, 1024),
            parse_mode: "HTML",
          }),
        });
      } else {
        res = await fetch(`${base}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: channel(), text, parse_mode: "HTML", disable_web_page_preview: false }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        return { platform: "telegram", ok: false, error: data?.description || res.statusText };
      }

      const msgId = data?.result?.message_id;
      const chatUser = data?.result?.chat?.username;
      const postUrl = chatUser && msgId ? `https://t.me/${chatUser}/${msgId}` : undefined;
      return { platform: "telegram", ok: true, externalId: msgId ? String(msgId) : undefined, postUrl };
    } catch (e: any) {
      return { platform: "telegram", ok: false, error: e?.message || "Erreur réseau Telegram" };
    }
  },
};
