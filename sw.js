// Service worker v3 — estratégia "network-first":
// tenta SEMPRE buscar a versão nova da internet; só usa a cache se estiver offline.
// Assim a app atualiza-se sozinha sempre que houver ligação.
const CACHE = 'manutencao-v4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // ativa imediatamente a nova versão, sem esperar
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // apaga caches antigas (v2, etc.) e assume controlo já
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // só tratamos pedidos GET do mesmo site
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // se a internet respondeu, guarda uma cópia fresca e devolve-a
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

// permite que a página peça ao SW para se atualizar de imediato
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
