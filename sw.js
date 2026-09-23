// Cache público e explícito da shell PWA. Nunca é uma cache de dados da aplicação.
const CACHE_PREFIX = 'pmp-public-shell-';
const CACHE = `${CACHE_PREFIX}v13`;
const LEGACY_CACHES = new Set([
  'manutencao-v2', 'manutencao-v3', 'manutencao-v4', 'manutencao-v5', 'manutencao-v6',
  'manutencao-v9', 'manutencao-v10', 'manutencao-v11', 'manutencao-v12'
]);
const PUBLIC_ASSETS = [
  './', './index.html', './photo-ai-contract.js', './photo-ai-config.js',
  './photo-ai-assisted-core.mjs', './photo-ai-assisted-form.mjs', './diary-classification.mjs',
  './manifest.webmanifest', './icon-192.png', './icon-512.png'
];

function appUrl(asset) { return new URL(asset, self.registration.scope); }
function publicAssetUrls() { return PUBLIC_ASSETS.map(asset => appUrl(asset)); }

function hasPrivateRequestHeaders(request) {
  const cacheControl = request.headers.get('cache-control') || '';
  return request.headers.has('authorization') || /(?:^|,)\s*(?:no-store|private)\b/i.test(cacheControl);
}

function hasPrivateResponseHeaders(response) {
  const cacheControl = response.headers.get('cache-control') || '';
  return /(?:^|,)\s*(?:no-store|private)\b/i.test(cacheControl);
}

function isPublicAssetRequest(request, url) {
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.search || hasPrivateRequestHeaders(request)) return false;
  return publicAssetUrls().some(assetUrl => assetUrl.href === url.href);
}

function isAppNavigation(request, url) {
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== self.location.origin || hasPrivateRequestHeaders(request)) return false;
  return url.pathname.startsWith(new URL(self.registration.scope).pathname);
}

function isShellNavigation(url) {
  return [appUrl('./').href, appUrl('./index.html').href].includes(url.href);
}

function canStorePublicResponse(response) { return response && response.ok && !hasPrivateResponseHeaders(response); }

async function cachePublicResponse(request, response) {
  if (!canStorePublicResponse(response)) return;
  const cache = await caches.open(CACHE);
  await cache.put(request, response.clone());
}

async function networkFirstPublicAsset(request) {
  try {
    const response = await fetch(request);
    await cachePublicResponse(request, response);
    return response;
  } catch (error) {
    const cached = await (await caches.open(CACHE)).match(request);
    if (cached) return cached;
    throw error;
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    // Só a shell conhecida é atualizada. Uma rota dinâmica nunca vira conteúdo offline.
    if (isShellNavigation(new URL(request.url)) && canStorePublicResponse(response)) await cachePublicResponse(appUrl('./index.html'), response);
    return response;
  } catch (error) {
    const cached = await (await caches.open(CACHE)).match(appUrl('./index.html'));
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(publicAssetUrls())).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => (key.startsWith(CACHE_PREFIX) && key !== CACHE) || LEGACY_CACHES.has(key)).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isAppNavigation(request, url)) { event.respondWith(networkFirstNavigation(request)); return; }
  if (isPublicAssetRequest(request, url)) event.respondWith(networkFirstPublicAsset(request));
});

self.addEventListener('message', event => { if (event.data === 'skipWaiting') self.skipWaiting(); });
