// SW mínimo: evita 404 si el navegador tiene uno registrado en /sw.js.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
