// Service worker: l'app si apre anche senza rete (palestra senza campo).
// Cambia VERSIONE a ogni pubblicazione: il telefono scarica i file nuovi.
const VERSIONE = "seduta-8";
const FILE = ["./", "index.html", "programma.js", "motore.js", "assistente.js", "app.js", "alternative.json", "sapere.md", "manifest.webmanifest", "icona.svg", "icona-192.png", "icona-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => Promise.all(FILE.map(f => c.add(f).catch(() => {})))));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSIONE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // Gemini e altro: rete diretta
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    if (res.ok) { const copia = res.clone(); caches.open(VERSIONE).then(c => c.put(e.request, copia)); }
    return res;
  }).catch(() => caches.match("index.html"))));
});
