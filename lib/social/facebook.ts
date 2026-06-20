import type { Publisher, PublishInput, PublishResult } from "./types";

// Facebook Page — Graph API (gratuite).
// Config requise :
//   META_PAGE_ID       — id de la Page Facebook
//   META_ACCESS_TOKEN  — token de Page longue durée (permission pages_manage_posts)
// Doc : https://developers.facebook.com/docs/pages-api/posts

const GRAPH = "https://graph.facebook.com/v21.0";

function pageId() {
  return process.env.META_PAGE_ID || "";
}
function accessToken() {
  return process.env.META_ACCESS_TOKEN || "";
}

export const facebookPublisher: Publisher = {
  platform: "facebook",

  isConfigured() {
    return Boolean(pageId() && accessToken());
  },

  async publish(input: PublishInput): Promise<PublishResult> {
    if (!this.isConfigured()) {
      return { platform: "facebook", ok: false, skipped: true, error: "Facebook non configuré" };
    }

    const message = input.link ? `${input.caption}\n\n${input.link}` : input.caption;

    try {
      let endpoint: string;
      let payload: Record<string, string>;

      if (input.imageUrl) {
        // Publication d'une photo avec légende (poste une image sur la Page)
        endpoint = `${GRAPH}/${pageId()}/photos`;
        payload = { url: input.imageUrl, caption: message, access_token: accessToken() };
      } else {
        // Publication d'un statut texte (avec lien éventuel)
        endpoint = `${GRAPH}/${pageId()}/feed`;
        payload = { message, access_token: accessToken() };
        if (input.link) payload.link = input.link;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || data?.error) {
        return { platform: "facebook", ok: false, error: data?.error?.message || res.statusText };
      }

      // photos → { id, post_id } ; feed → { id }
      const externalId = data?.post_id || data?.id;
      const postUrl = externalId ? `https://www.facebook.com/${externalId}` : undefined;
      return { platform: "facebook", ok: true, externalId, postUrl };
    } catch (e: any) {
      return { platform: "facebook", ok: false, error: e?.message || "Erreur réseau Facebook" };
    }
  },
};
