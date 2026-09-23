const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', '..', 'sw.js'), 'utf8');
const origin = 'https://scaixeir75.github.io';
const scope = `${origin}/manutencao/`;

class MemoryCache {
  constructor() { this.entries = new Map(); this.puts = []; }
  key(request) { return typeof request === 'string' ? new URL(request, scope).href : request.url || request.href; }
  async addAll(requests) { for (const request of requests) await this.put(request, new Response('precache', { status: 200 })); }
  async put(request, response) { this.puts.push(this.key(request)); this.entries.set(this.key(request), response.clone()); }
  async match(request) { const response = this.entries.get(this.key(request)); return response && response.clone(); }
}

function createRuntime(fetchImpl = async request => new Response(`network:${request.url}`, { status: 200 })) {
  const listeners = new Map(); const stores = new Map();
  const caches = {
    async open(name) { if (!stores.has(name)) stores.set(name, new MemoryCache()); return stores.get(name); },
    async keys() { return [...stores.keys()]; }, async delete(name) { return stores.delete(name); }
  };
  const self = {
    location: { origin }, registration: { scope }, clients: { claim: async () => {} }, skipWaiting: async () => {},
    addEventListener(type, handler) { listeners.set(type, handler); }
  };
  vm.runInNewContext(source, { self, caches, fetch: fetchImpl, URL, Request, Response, Promise, RegExp });
  return { listeners, stores, caches };
}

async function dispatch(runtime, request) {
  let responsePromise;
  runtime.listeners.get('fetch')({ request, respondWith(value) { responsePromise = Promise.resolve(value); } });
  return responsePromise;
}

function navigationRequest(url) { return { url, method: 'GET', mode: 'navigate', headers: new Headers() }; }

test('P07: pré-cache contém apenas a allowlist pública conhecida', async () => {
  const runtime = createRuntime(); let install;
  runtime.listeners.get('install')({ waitUntil(value) { install = value; } }); await install;
  assert.deepEqual([...runtime.stores.get('pmp-public-shell-v13').entries.keys()], [
    `${scope}`, `${scope}index.html`, `${scope}photo-ai-contract.js`, `${scope}photo-ai-config.js`,
    `${scope}photo-ai-assisted-core.mjs`, `${scope}photo-ai-assisted-form.mjs`, `${scope}diary-classification.mjs`,
    `${scope}manifest.webmanifest`, `${scope}icon-192.png`, `${scope}icon-512.png`
  ]);
});

test('P07: assets conhecidos atualizam cache; URLs desconhecidas e query strings não entram', async () => {
  const runtime = createRuntime(); const cache = await runtime.caches.open('pmp-public-shell-v13');
  assert.equal((await dispatch(runtime, new Request(`${scope}photo-ai-config.js`))).status, 200);
  assert.deepEqual(cache.puts, [`${scope}photo-ai-config.js`]);
  assert.equal(await dispatch(runtime, new Request(`${scope}photo-ai-config.js?rev=next`)), undefined);
  assert.equal(await dispatch(runtime, new Request(`${scope}unknown.json`)), undefined);
  assert.deepEqual(cache.puts, [`${scope}photo-ai-config.js`]);
});

test('P07: pedidos autenticados, private/no-store, não GET e origens externas não são intercetados', async () => {
  const runtime = createRuntime(); const cache = await runtime.caches.open('pmp-public-shell-v13');
  const requests = [
    new Request(`${scope}index.html`, { headers: { authorization: 'Bearer secret' } }),
    new Request(`${scope}index.html`, { headers: { 'cache-control': 'private' } }),
    new Request(`${scope}index.html`, { method: 'POST' }),
    new Request('https://manutencao-semanal-default-rtdb.firebaseio.com/registos.json'),
    new Request('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js')
  ];
  for (const request of requests) assert.equal(await dispatch(runtime, request), undefined);
  assert.equal(cache.puts.length, 0);
});

test('P07: no-store não é guardado e navegação offline usa apenas a shell index conhecida', async () => {
  let online = true;
  const runtime = createRuntime(async request => {
    if (!online) throw new Error('offline');
    if (request.url.endsWith('photo-ai-config.js')) return new Response('secret', { status: 200, headers: { 'cache-control': 'no-store' } });
    return new Response('html', { status: 200 });
  });
  const cache = await runtime.caches.open('pmp-public-shell-v13');
  await dispatch(runtime, new Request(`${scope}photo-ai-config.js`)); assert.equal(cache.puts.length, 0);
  await dispatch(runtime, navigationRequest(scope));
  assert.deepEqual(cache.puts, [`${scope}index.html`]);
  await dispatch(runtime, navigationRequest(`${scope}registos/44`));
  assert.deepEqual(cache.puts, [`${scope}index.html`]);
  online = false;
  const fallback = await dispatch(runtime, navigationRequest(`${scope}registos/44`));
  assert.equal(await fallback.text(), 'html'); assert.deepEqual(cache.puts, [`${scope}index.html`]);
});

test('P07: activate preserva o cache atual e remove somente versões PMP conhecidas', async () => {
  const runtime = createRuntime();
  const legacy = ['manutencao-v2', 'manutencao-v3', 'manutencao-v4', 'manutencao-v5', 'manutencao-v6', 'manutencao-v9', 'manutencao-v10', 'manutencao-v11', 'manutencao-v12'];
  for (const name of legacy) await runtime.caches.open(name);
  await runtime.caches.open('pmp-public-shell-v12'); await runtime.caches.open('pmp-public-shell-v13');
  await runtime.caches.open('manutencao-outro'); await runtime.caches.open('foreign-cache');
  let activate; runtime.listeners.get('activate')({ waitUntil(value) { activate = value; } }); await activate;
  assert.deepEqual((await runtime.caches.keys()).sort(), ['foreign-cache', 'manutencao-outro', 'pmp-public-shell-v13']);
});
