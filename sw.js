// Service Worker de Gambito — Goal Hunter
// Estrategia: cache-first con actualización en segundo plano (stale-while-revalidate).
// Cubre tanto los archivos propios (index.html, manifest, íconos) como los externos
// que carga la app (Google Fonts, SheetJS) — con esto sí funcionan offline, algo que
// era imposible cuando la app corría como archivo local (file://).

const CACHE_NAME = 'gambito-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nunca cachear las llamadas al Apps Script — esos datos siempre deben ir a la red,
  // nunca servirse desde una copia vieja en caché.
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    caches.match(event.request).then((cacheada) => {
      const fetchPromise = fetch(event.request)
        .then((respuestaRed) => {
          // Guarda copia fresca en caché para la próxima vez que no haya señal.
          if (respuestaRed && respuestaRed.status === 200) {
            const copia = respuestaRed.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return respuestaRed;
        })
        .catch(() => cacheada); // sin internet: usa lo que haya en caché

      // Sirve caché al instante si existe; si no, espera la red.
      return cacheada || fetchPromise;
    })
  );
});
