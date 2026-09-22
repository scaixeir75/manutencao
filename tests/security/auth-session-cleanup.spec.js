const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test.use({ channel: process.env.PMP_PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined), serviceWorkers: 'block' });
const root = path.resolve(__dirname, '..', '..');
const firebase = `
  window.testDb ||= {registos_diarios:{entry:{text:'Registo privado',severity:'info',date:'2026-09-22',timestamp:'2026-09-22T10:00:00.000Z',fichaId:'44',fichaNome:'Rotina Diária'}},registos_fichas:{},memoria_tecnica:{}};
  window.listeners ||= new Map();
  const read=p=>p.split('/').reduce((node,key)=>node?.[key],window.testDb) ?? null;
  const snap=value=>({val:()=>structuredClone(value)});
  const emit=(path,value=read(path))=>{for(const [key,callbacks] of window.listeners)if(path===key||path.startsWith(key+'/'))for(const callback of [...callbacks])callback(snap(value));};
  window.emitFirebase=(path,value)=>emit(path,value);window.listenerCount=()=>[...window.listeners.values()].reduce((n,set)=>n+set.size,0);window.captureFirebaseCallback=path=>[...(window.listeners.get(path)||[])][0];
  export const initializeApp=()=>({}),getDatabase=()=>({}),ref=(db,path)=>({path}),push=r=>({key:'generated',path:r.path+'/generated'});
  export async function set(r,value){const keys=r.path.split('/');let node=window.testDb;for(const key of keys.slice(0,-1))node=node[key]||={};node[keys.at(-1)]=structuredClone(value);emit(r.path);}
  export async function remove(r){const keys=r.path.split('/');const node=keys.slice(0,-1).reduce((value,key)=>value?.[key],window.testDb);if(node)delete node[keys.at(-1)];emit(r.path);}
  export const get=async r=>snap(read(r.path));
  export const onValue=(r,callback)=>{const callbacks=window.listeners.get(r.path)||new Set();callbacks.add(callback);window.listeners.set(r.path,callbacks);queueMicrotask(()=>callback(snap(read(r.path))));return ()=>{callbacks.delete(callback);if(!callbacks.size)window.listeners.delete(r.path);};};
  window.testAuth={currentUser:{uid:'session-user',email:'session@example.invalid'}};
  export const getAuth=()=>window.testAuth,signInWithEmailAndPassword=async()=>{},signOut=async()=>{window.testAuth.currentUser=null;window.authCallback(null);},onAuthStateChanged=(auth,callback)=>{window.authCallback=callback;queueMicrotask(()=>callback(auth.currentUser));};
`;

async function open(page) {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'www.gstatic.com') return route.fulfill({ contentType: 'text/javascript', body: firebase });
    if (url.origin === 'http://pmp.test') {
      const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      if (['index.html', 'photo-ai-contract.js', 'photo-ai-config.js', 'photo-ai-assisted-core.mjs', 'photo-ai-assisted-form.mjs', 'diary-classification.mjs'].includes(file)) return route.fulfill({ contentType: file.endsWith('.html') ? 'text/html' : 'text/javascript', body: fs.readFileSync(path.join(root, file), 'utf8') });
    }
    return route.abort();
  });
  await page.goto('http://pmp.test/');
  await expect.poll(() => page.evaluate(() => listenerCount())).toBe(3);
  await expect(page.locator('#loginScreen')).toHaveClass(/hidden/);
}

test('logout sem reload remove dados, modais, fotos e listeners da sessão', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await open(page);
  await page.evaluate(() => {
    switchView('diary');openModal('44');startEditDiary('entry');
    pendingPhotos=[`data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT1sAAAAASUVORK5CYII=`];renderPhotoThumbs();
    openLightbox(pendingPhotos[0]);openAssistedRoutineForm('44');$('aiDiaryInput').value='Contexto privado';generateDiaryAiSuggestion();
  });
  await expect(page.locator('.de-editbox')).toHaveCount(1);
  await expect(page.locator('#assistedRoutineModal')).toHaveCount(1);
  await page.evaluate(() => { window.staleFirebaseCallback=captureFirebaseCallback('registos_diarios'); });
  await page.evaluate(() => authCallback(null));
  await expect(page.locator('#loginScreen')).not.toHaveClass(/hidden/);
  const state = await page.evaluate(() => ({diary:diaryCache.length,logs:Object.keys(LOGS).length,memory:technicalMemoryCache.length,pending:pendingPhotos.length,list:$('diaryList').textContent,modal:$('overlay').classList.contains('open'),editing:!!document.querySelector('.de-editbox'),assisted:!!document.querySelector('#assistedRoutineModal'),lightbox:$('lightbox').classList.contains('open'),listeners:listenerCount(),assistant:$('aiDiaryInput').value}));
  expect(state).toEqual({diary:0,logs:0,memory:0,pending:0,list:'',modal:false,editing:false,assisted:false,lightbox:false,listeners:0,assistant:''});
  await page.evaluate(() => staleFirebaseCallback({val:()=>({late:{text:'Dados da sessão anterior',timestamp:'2026-09-22T11:00:00.000Z'}})}));
  await expect.poll(() => page.evaluate(() => diaryCache.length)).toBe(0);
  expect(errors).toEqual([]);
});

test('cleanup repetido é seguro e novo login cria apenas uma geração de listeners', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { authCallback(null); cleanupAuthenticatedSession(); cleanupAuthenticatedSession(); });
  await expect.poll(() => page.evaluate(() => listenerCount())).toBe(0);
  await page.evaluate(() => { testAuth.currentUser={uid:'session-user',email:'session@example.invalid'};authCallback(testAuth.currentUser); });
  await expect.poll(() => page.evaluate(() => listenerCount())).toBe(3);
  const state = await page.evaluate(() => ({diary:diaryCache.length,logs:Object.keys(LOGS).length,active:!!activeAuthSession,generation:authSessionGeneration,loginHidden:$('loginScreen').classList.contains('hidden')}));
  expect(state.diary).toBe(1);expect(state.logs).toBe(1);expect(state.active).toBe(true);expect(state.generation).toBeGreaterThan(0);expect(state.loginHidden).toBe(true);
});
