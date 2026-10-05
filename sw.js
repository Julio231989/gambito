// Service Worker de Gambito — Goal Hunter  (v2)
// Objetivo: que la app abra y se pueda revisar todo lo registrado SIN señal.
//  - Archivos propios (index.html, manifest, íconos): stale-while-revalidate.
//  - Recursos externos (SheetJS, Google Fonts): cache-first. Se guardan también las
//    respuestas "opacas" (status 0) que es como llegan los <script>/<link> de otro dominio;
//    la versión anterior las descartaba y por eso nada externo quedaba disponible offline.
//  - Llamadas al Apps Script: SIEMPRE a la red (nunca desde caché).
//  - Al cambiar CACHE_NAME se descarta la caché vieja y se avisa a la app para que ofrezca recargar.

const VERSION = 'v5';                       // súbelo cada vez que publiques cambios en index.html
const CACHE_NAME = 'gambito-shell-' + VERSION;
const CACHE_EXT  = 'gambito-ext-v1';        // librerías y fuentes de terceros (cambian muy poco)

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

// Externos que la app necesita. Se intentan precachear al instalar; si alguno falla
// (sin señal en ese momento) no se cancela la instalación: se guardan en la primera carga online.
const EXTERNOS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
];

const NUNCA_CACHEAR = ['script.google.com', 'script.googleusercontent.com'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(CACHE_NAME);
    await shell.addAll(APP_SHELL);
    const ext = await caches.open(CACHE_EXT);
    await Promise.all(EXTERNOS.map(async (url) => {
      try { await ext.put(url, await fetch(url, { mode: 'no-cors' })); } catch (e) { /* se guarda luego */ }
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const nombres = await caches.keys();
    const habiaVersionVieja = nombres.some((n) => n.startsWith('gambito-shell-') && n !== CACHE_NAME);
    await Promise.all(
      nombres.filter((n) => n !== CACHE_NAME && n !== CACHE_EXT).map((n) => caches.delete(n))
    );
    await self.clients.claim();
    if (habiaVersionVieja) {
      const clientes = await self.clients.matchAll({ type: 'window' });
      clientes.forEach((c) => c.postMessage({ type: 'SW_ACTUALIZADO' }));
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                                   // POST al Sheet y demás: directo a la red
  const url = new URL(req.url);
  if (NUNCA_CACHEAR.some((h) => url.hostname === h || url.hostname.endsWith('.' + h))) return;

  // Externos (otro origen): cache-first
  if (url.origin !== self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_EXT);
      const guardada = await cache.match(req);
      if (guardada) return guardada;
      try {
        const red = await fetch(req);
        if (red && (red.status === 200 || red.type === 'opaque')) cache.put(req, red.clone());
        return red;
      } catch (e) {
        return Response.error();   // sin señal y sin copia: la app sigue sin esa fuente/librería
      }
    })());
    return;
  }

  // Propios: stale-while-revalidate; las navegaciones caen siempre a index.html si no hay red
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const guardada = await cache.match(req, { ignoreSearch: true });
    const desdeRed = fetch(req)
      .then((r) => { if (r && r.status === 200) cache.put(req, r.clone()); return r; })
      .catch(() => null);
    if (guardada) { event.waitUntil(desdeRed); return guardada; }
    const r = await desdeRed;
    if (r) return r;
    if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
    return Response.error();
  })());
});
