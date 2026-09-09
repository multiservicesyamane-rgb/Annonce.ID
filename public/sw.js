/* Service Worker Wanteermako — PWA installable, hors-ligne, notifications push */

/*
 * ── Ce que ce fichier fait, et surtout ce qu'il NE fait pas ──────────────
 *
 * Il ne met en cache QUE la page « hors ligne » et les icônes. Rien d'autre.
 * Ni les pages, ni le JavaScript, ni les appels d'API.
 *
 * Ce n'est pas de la paresse, c'est le choix qui évite le pire bug d'une
 * application web : servir un ancien fichier JavaScript à côté d'un serveur
 * mis à jour. L'écran se casse alors sans erreur lisible, et vider le cache
 * d'un téléphone n'est à la portée de personne. Sur une application qui se
 * déploie plusieurs fois par jour, ce risque n'en vaut pas la chandelle.
 *
 * Ce qu'on gagne quand même : ouvrir l'application sans réseau ne montre plus
 * l'écran d'erreur du navigateur — celui avec le dinosaure — mais une page
 * qui porte notre nom et explique quoi faire. Sur une 4G qui tombe, c'est la
 * différence entre « l'application est cassée » et « je n'ai pas de réseau ».
 */

const VERSION = "wmk-v2";
const CACHE = `wmk-coquille-${VERSION}`;
const HORS_LIGNE = "/hors-ligne";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll([HORS_LIGNE, "/icon-192.png?v=3", "/logo-icon.png"]))
      // Un échec de mise en cache ne doit pas empêcher l'installation : mieux
      // vaut une application sans page hors-ligne qu'une application qui ne
      // s'installe pas.
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Ménage des versions précédentes, sinon chaque déploiement laisse son
      // cache derrière lui sur le téléphone de l'utilisateur.
      const noms = await caches.keys();
      await Promise.all(noms.filter((n) => n !== CACHE && n.startsWith("wmk-")).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // UNIQUEMENT les navigations, et uniquement en GET. Le reste — scripts,
  // images, API — passe directement au réseau, sans que le service worker
  // s'en mêle.
  if (req.method !== "GET" || req.mode !== "navigate") return;

  event.respondWith(
    fetch(req).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(HORS_LIGNE)) || Response.error();
    }),
  );
});

// Réception d'une notification push
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: "Wanteermako", body: event.data && event.data.text() }; }
  const title = data.title || "Wanteermako";
  const options = {
    body: data.body || "Vous avez une nouvelle notification.",
    icon: data.icon || "/logo-icon.png",
    badge: "/logo-icon.png",
    data: { url: data.url || "/" },
    vibrate: [80, 40, 80],
    tag: data.tag || undefined,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur la notification → ouvre l'URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
