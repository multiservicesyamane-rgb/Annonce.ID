import type { Publisher, PublishInput, PublishResult } from "./types";

// Facebook Pages — Graph API (gratuite). Publie sur UNE ou PLUSIEURS pages.
// Config :
//   META_PAGES        — (multi-pages) JSON: [{"id":"...","token":"...","name":"..."}]
//   ou META_PAGE_ID + META_ACCESS_TOKEN  — (page unique, repli)
// Doc : https://developers.facebook.com/docs/pages-api/posts

const GRAPH = "https://graph.facebook.com/v21.0";

type FbPage = { id: string; token: string; name?: string };

// Pages à NE PAS publier, par ID (liste séparée par des virgules dans l'env).
// Ex : META_PAGES_DISABLED="2233992096679300" désactive cette page sans toucher
// à la config META_PAGES. Réversible : vider la variable réactive la page.
function disabledPageIds(): Set<string> {
  return new Set(
    (process.env.META_PAGES_DISABLED || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function getPages(): FbPage[] {
  const disabled = disabledPageIds();
  const keepEnabled = (pages: FbPage[]) => pages.filter((p) => !disabled.has(p.id));

  // 1) Multi-pages via META_PAGES (JSON)
  const raw = process.env.META_PAGES;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const pages = arr
          .map((p: any) => ({ id: String(p.id || ""), token: String(p.token || p.access_token || ""), name: p.name }))
          .filter((p: FbPage) => p.id && p.token);
        if (pages.length) return keepEnabled(pages);
      }
    } catch { /* JSON invalide → repli page unique */ }
  }
  // 2) Repli : page unique
  const id = process.env.META_PAGE_ID || "";
  const token = process.env.META_ACCESS_TOKEN || "";
  return keepEnabled(id && token ? [{ id, token }] : []);
}

async function postToPage(page: FbPage, message: string, input: PublishInput): Promise<{ ok: boolean; externalId?: string; error?: string }> {
  let endpoint: string;
  let payload: Record<string, string>;
  if (input.imageUrl) {
    endpoint = `${GRAPH}/${page.id}/photos`;
    payload = { url: input.imageUrl, caption: message, access_token: page.token };
  } else {
    endpoint = `${GRAPH}/${page.id}/feed`;
    payload = { message, access_token: page.token };
    if (input.link) payload.link = input.link;
  }
  try {
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok || data?.error) return { ok: false, error: data?.error?.message || res.statusText };
    return { ok: true, externalId: data?.post_id || data?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erreur réseau Facebook" };
  }
}

export const facebookPublisher: Publisher = {
  platform: "facebook",

  isConfigured() {
    return getPages().length > 0;
  },

  async publish(input: PublishInput): Promise<PublishResult> {
    const pages = getPages();
    if (pages.length === 0) {
      return { platform: "facebook", ok: false, skipped: true, error: "Facebook non configuré" };
    }

    const message = input.link ? `${input.caption}\n\n${input.link}` : input.caption;
    const results = await Promise.all(pages.map((p) => postToPage(p, message, input)));

    const okOnes = results.filter((r) => r.ok);
    const firstId = okOnes[0]?.externalId;
    if (okOnes.length === 0) {
      return { platform: "facebook", ok: false, error: results.map((r) => r.error).filter(Boolean).join(" | ") || "Échec" };
    }
    return {
      platform: "facebook",
      ok: true,
      externalId: firstId,
      postUrl: firstId ? `https://www.facebook.com/${firstId}` : undefined,
      // info: combien de pages OK / total
      error: okOnes.length < pages.length ? `${okOnes.length}/${pages.length} pages publiées` : undefined,
    };
  },
};
