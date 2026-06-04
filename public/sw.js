/* Service worker de vamosalrio.
 *
 * Fase 1 (PWA): install / activate / fetch passthrough — NO llamamos a
 * event.respondWith(), así el navegador resuelve cada request tal cual y no
 * cacheamos nada (jamás /api ni *.supabase.co, que serviría datos viejos y
 * rompe el realtime). Tener el handler presente habilita la instalación en los
 * navegadores que lo exigen.
 *
 * Fase 2 (Web Push): handlers 'push' y 'notificationclick'.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Passthrough: sin respondWith → sin caché.
self.addEventListener("fetch", () => {});

// Push: el payload es { titulo, cuerpo, url }. showNotification SIEMPRE dentro
// de event.waitUntil(...) (requisito de Apple Push en iOS 16.4+).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }

  const titulo = data.titulo || "vamosalrio";
  const cuerpo = data.cuerpo || "";
  const url = data.url || "/feed";

  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: cuerpo,
      icon: "/vamosalrio_isotipo.png",
      badge: "/vamosalrio_isotipo.png",
      data: { url },
    }),
  );
});

// Click en la notificación: abre/enfoca la url y cierra la notif.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || "/feed";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            if ("navigate" in client) {
              client.navigate(url).catch(() => {});
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
        return undefined;
      }),
  );
});
