// v3: limpa o cache de quem já tenha gravado a tela de bloqueio (401) no
// lugar do app, antes da correção abaixo.
const CACHE_NAME = 'in-neuro-cefaleia-v3';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      './',
      './index.html',
      './manifest.json',
      './data/algoritmo.json',
      './data/operadoras.json',
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
        // O site é protegido: sem sessão válida, o Netlify devolve 401 com a
        // tela de bloqueio. Guardar isso no cache sobrescreveria o app, e o
        // PWA passaria a abrir a tela de bloqueio mesmo já autenticado.
        // Só resposta boa entra no cache.
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return resp;
      })
      // Sem rede: serve do cache. Se não houver cópia, o erro sobe — melhor
      // que devolver uma resposta enganosa.
      .catch(() => caches.match(event.request))
  );
});
