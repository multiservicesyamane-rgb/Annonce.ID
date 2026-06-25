/* Service Worker Wanteermako — PWA installable + notifications push */
const VERSION = "wmk-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler fetch minimal (network-first, sans cache agressif) — requis pour l'installabilité PWA.
self.addEventListener("fetch", () => {
  // passthrough : on laisse le navigateur gérer (pas de cache cassant)
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
