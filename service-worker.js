/*
 * Mises à jour automatiques : quand le téléphone est en ligne, on prend toujours
 * la dernière version du site (nouveaux mots, photos…). Sinon, on sert la copie gardée.
 * Pas besoin de changer VERSION pour ajouter des mots ; seulement pour tout vider (rare).
 */
const VERSION = 'bocal-v3';

const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './messages.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];
const FONTS_CSS = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap';
const NETWORK_TIMEOUT = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE.map((u) => new Request(u, { cache: 'reload' })));
    try { const r = await fetch(FONTS_CSS); if (r.ok) await cache.put(FONTS_CSS, r); } catch (e) { /* hors ligne */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  // Polices : elles ne changent jamais, la copie gardée suffit.
  if (isFont) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    })());
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Le site : réseau d'abord (toujours la dernière version), copie gardée si hors ligne.
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const isPage = req.mode === 'navigate';
    const key = isPage ? './index.html' : url.pathname + url.search;
    try {
      const res = await withTimeout(fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }), NETWORK_TIMEOUT);
      if (res.ok) await cache.put(isPage ? './index.html' : req, res.clone());
      if (res.ok || !isPage) return res;
      throw new Error('page indisponible');
    } catch (e) {
      const hit = await cache.match(isPage ? './index.html' : req, { ignoreSearch: isPage }) || await cache.match(key);
      if (hit) return hit;
      return new Response('Hors ligne', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
