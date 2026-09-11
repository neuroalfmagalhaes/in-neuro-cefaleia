const CACHE_NAME = 'in-neuro-cefaleia-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      './',
      './index.html',
      './manifest.json',
      './data/algoritmo.json',
      './icon-192.png',
      './icon-512.png',
      './assets/logo.png',
      './assets/marca-dagua.png',
      // jsPDF: sem isto em cache, não há como gerar PDF offline.
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first: evita que o app fique preso numa versão antiga do algoritmo,
// e mantém uma cópia em cache para funcionar offline.
self.addEventListener('fetch', (event) => {
  // Só GET entra no cache — POST (ex.: /.netlify/functions/extract) não é cacheável.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
