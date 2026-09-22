const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test.use({ channel: process.env.PMP_PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined), serviceWorkers: 'block' });
const root = path.resolve(__dirname, '..', '..');
const validPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT1sAAAAASUVORK5CYII=';
const firebase = `
  window.testDb ||= {}; window.listeners ||= new Map();
  const read=p=>p.split('/').reduce((node,key)=>node?.[key],window.testDb) ?? null;
  const emit=p=>{for(const [key,list] of window.listeners)if(p===key||p.startsWith(key+'/'))for(const cb of list)cb({val:()=>structuredClone(read(key))});};
  export const initializeApp=()=>({}),getDatabase=()=>({}),ref=(db,path)=>({path}),push=r=>({key:'generated',path:r.path+'/generated'});
  export async function set(r,value){const keys=r.path.split('/');let node=window.testDb;for(const key of keys.slice(0,-1))node=node[key]||={};node[keys.at(-1)]=structuredClone(value);emit(r.path);}
  export async function remove(r){const keys=r.path.split('/');const node=keys.slice(0,-1).reduce((value,key)=>value?.[key],window.testDb);if(node)delete node[keys.at(-1)];emit(r.path);}
  export const get=async r=>({val:()=>read(r.path)}),onValue=(r,cb)=>{const list=window.listeners.get(r.path)||[];list.push(cb);window.listeners.set(r.path,list);queueMicrotask(()=>cb({val:()=>structuredClone(read(r.path))}));};
  const auth={currentUser:{uid:'security-test'}}; export const getAuth=()=>auth,signInWithEmailAndPassword=async()=>{},signOut=async()=>{},onAuthStateChanged=(a,cb)=>queueMicrotask(()=>cb(a.currentUser));
`;

async function open(page) {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'www.gstatic.com') return route.fulfill({ contentType: 'text/javascript', body: firebase });
    if (url.origin === 'http://pmp.test') {
      const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      if (['index.html', 'photo-ai-assisted-core.mjs', 'photo-ai-assisted-form.mjs', 'diary-classification.mjs'].includes(file)) return route.fulfill({ contentType: file.endsWith('.html') ? 'text/html' : 'text/javascript', body: fs.readFileSync(path.join(root, file), 'utf8') });
    }
    return route.abort();
  });
  await page.goto('http://pmp.test/');
  await page.locator('#tabDiary').click();
}

test('dados persistidos não injetam HTML, handlers ou URLs executáveis', async ({ page }) => {
  await open(page);
  const malicious = '<svg onload=alert(1)>';
  await page.evaluate(async ({ malicious, validPhoto }) => {
    await fb.set(fb.ref(fb.db, 'registos_diarios/xss" onclick="alert(1)'), {
      text: malicious,
      severity: '"><img src=x onerror=alert(1)>',
      date: '2026-09-22', timestamp: new Date().toISOString(),
      fichaId: '44', fichaNome: '<img src=x onerror=alert(1)>',
      photos: [validPhoto, 'javascript:alert(1)', '"><img src=x onerror=alert(1)>']
    });
  }, { malicious, validPhoto });
  await page.locator('#diaryHistoryToggle').click();
  const entry = page.locator('.diary-entry').filter({ hasText: malicious });
  await expect(entry).toHaveCount(1);
  await expect(entry.locator('svg,img[onerror],*[onclick*="alert"]')).toHaveCount(0);
  await expect(entry.locator('.de-photo')).toHaveCount(1);
  await entry.locator('.de-photo').click();
  await expect(page.locator('#lightbox')).toHaveClass(/open/);
  await expect(page.locator('#lbImg')).toHaveAttribute('src', validPhoto);
});

test('Assistente mostra texto persistido como conteúdo, não como markup', async ({ page }) => {
  await open(page);
  const payload = '<img src=x onerror=alert(1)> javascript:alert(1)';
  await page.evaluate(payload => setAiTextContent('aiGeneralResponse', payload), payload);
  const response = page.locator('#aiGeneralResponse');
  await expect(response).toContainText(payload);
  await expect(response.locator('img,svg,[onerror]')).toHaveCount(0);
});
