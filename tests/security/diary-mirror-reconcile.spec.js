const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test.use({ channel: process.env.PMP_PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined), serviceWorkers: 'block' });
const root = path.resolve(__dirname, '..', '..');
const firebase = `
  window.testDb ||= {registos_diarios:{},registos_fichas:{},memoria_tecnica:{}};window.listeners ||= new Map();window.writes ||= [];
  const read=p=>p.split('/').reduce((node,key)=>node?.[key],window.testDb) ?? null;const snap=value=>({val:()=>structuredClone(value)});
  const emit=path=>{for(const [key,callbacks] of window.listeners)if(path===key||path.startsWith(key+'/'))for(const callback of [...callbacks])callback(snap(read(key)));};
  export const initializeApp=()=>({}),getDatabase=()=>({}),ref=(db,path)=>({path}),push=r=>({key:'generated',path:r.path+'/generated'}),get=async r=>snap(read(r.path));
  export async function set(r,value){window.writes.push(r.path);if(r.path.startsWith('registos_fichas/')&&window.failMirror)throw Error('mirror write failed');if(r.path.startsWith('registos_fichas/')&&window.pauseMirror&&!window.releaseMirror){window.mirrorStarted=true;await new Promise(resolve=>window.releaseMirror=resolve);}const keys=r.path.split('/');let node=window.testDb;for(const key of keys.slice(0,-1))node=node[key]||={};node[keys.at(-1)]=structuredClone(value);emit(r.path);}
  export async function remove(r){window.writes.push('remove:'+r.path);const keys=r.path.split('/');const node=keys.slice(0,-1).reduce((value,key)=>value?.[key],window.testDb);if(node)delete node[keys.at(-1)];emit(r.path);}
  export const onValue=(r,callback)=>{const callbacks=window.listeners.get(r.path)||new Set();callbacks.add(callback);window.listeners.set(r.path,callbacks);queueMicrotask(()=>callback(snap(read(r.path))));return ()=>{callbacks.delete(callback);if(!callbacks.size)window.listeners.delete(r.path);};};
  window.testAuth={currentUser:{uid:'mirror-test'}};export const getAuth=()=>window.testAuth,signInWithEmailAndPassword=async()=>{},signOut=async()=>{window.testAuth.currentUser=null;window.authCallback(null);},onAuthStateChanged=(auth,callback)=>{window.authCallback=callback;queueMicrotask(()=>callback(auth.currentUser));};
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
  await expect.poll(() => page.evaluate(() => firebaseSessionUnsubscribers.size)).toBe(3);
}

const diary = (text, fichaId = '44') => ({ text, severity: 'info', date: '2026-09-22', timestamp: '2026-09-22T10:00:00.000Z', fichaId, fichaNome: 'Rotina Diária', structuredData: { templateId: 'daily', source: 'assisted_form', measurements: [], checks: [], reportItems: [] } });

test('cria, edita e elimina um único mirror derivado', async ({ page }) => {
  await open(page);
  await page.evaluate(async record => saveDiaryCanonical(record, 'd1'), diary('Original'));
  await expect.poll(() => page.evaluate(() => testDb.registos_fichas?.['44']?.diary_d1?.note)).toBe('Original');
  await page.evaluate(async record => saveDiaryCanonical(record, 'd1'), diary('Revisto'));
  await expect.poll(() => page.evaluate(() => testDb.registos_fichas?.['44']?.diary_d1?.note)).toBe('Revisto');
  expect(await page.evaluate(() => Object.keys(testDb.registos_fichas['44']).filter(key => key === 'diary_d1').length)).toBe(1);
  await page.evaluate(async () => { await fb.remove(fb.ref(fb.db, 'registos_diarios/d1')); });
  await expect.poll(() => page.evaluate(() => !!testDb.registos_fichas?.['44']?.diary_d1)).toBe(false);
});

test('reconcilia ausência, desatualização e órfão sem tocar no log manual', async ({ page }) => {
  const consoleErrors=[];page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
  await open(page);
  await page.evaluate(async record => saveDiaryCanonical(record, 'd2'), diary('Canónico'));
  await expect.poll(() => page.evaluate(() => !!testDb.registos_fichas?.['44']?.diary_d2)).toBe(true);
  await page.evaluate(() => {
    testDb.registos_fichas['44'].diary_d2.note='Desatualizado';
    LOGS['44']=[structuredClone(testDb.registos_fichas['44'].diary_d2)];
  });
  const stale = await page.evaluate(() => syncDiaryEntriesToFichaHistory({notify:true}));
  expect(stale).toMatchObject({ok:true,repaired:1});
  expect(await page.evaluate(() => testDb.registos_fichas['44'].diary_d2.note)).toBe('Canónico');
  await page.evaluate(() => {
    delete testDb.registos_fichas['44'].diary_d2;
    testDb.registos_fichas['44'].diary_orphan={id:'diary_orphan',date:'2026-09-22',week:39,status:'Concluído',tech:'Legado',note:'legado',created:1,source:'diary',diaryId:'orphan'};
    testDb.registos_fichas['44'].manual={id:'manual',date:'2026-09-22',week:39,status:'Concluído',tech:'Técnico',note:'Manual',created:1};
    testDb.registos_fichas['44'].diary_manual={id:'diary_manual',date:'2026-09-22',week:39,status:'Concluído',tech:'Técnico',note:'Manual com prefixo',created:1,source:'manual'};
    LOGS['44']=[{id:'diary_orphan',date:'2026-09-22',week:39,status:'Concluído',tech:'Legado',note:'legado',created:1,source:'diary',diaryId:'orphan'},{id:'manual',date:'2026-09-22',week:39,status:'Concluído',tech:'Técnico',note:'Manual',created:1},{id:'diary_manual',date:'2026-09-22',week:39,status:'Concluído',tech:'Técnico',note:'Manual com prefixo',created:1,source:'manual'}];
  });
  const result = await page.evaluate(() => syncDiaryEntriesToFichaHistory({notify:true}));
  expect(result.ok,consoleErrors.join('\n')).toBe(true);
  const state = await page.evaluate(() => ({mirror:testDb.registos_fichas['44'].diary_d2?.note,orphan:testDb.registos_fichas['44'].diary_orphan,manual:testDb.registos_fichas['44'].manual?.note,prefixedManual:testDb.registos_fichas['44'].diary_manual?.note}));
  expect(state).toEqual({mirror:'Canónico',orphan:undefined,manual:'Manual',prefixedManual:'Manual com prefixo'});
  const repeated = await page.evaluate(async () => { writes.length=0; return syncDiaryEntriesToFichaHistory({notify:true}); });
  expect(repeated).toMatchObject({ok:true,repaired:0});
  expect(await page.evaluate(() => writes)).toEqual([]);
});

test('falha do mirror preserva o canónico, informa e logout cancela retry e bloqueia escrita seguinte', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { failMirror=true; });
  await page.evaluate(async record => saveDiaryCanonical(record, 'd3'), diary('Preservado'));
  await expect.poll(() => page.locator('#toast').textContent()).toContain('Histórico derivado ainda não foi sincronizado');
  expect(await page.evaluate(() => testDb.registos_diarios.d3.text)).toBe('Preservado');
  expect(await page.evaluate(() => testDb.registos_fichas?.['44']?.diary_d3)).toBeUndefined();
  const firstFailureWrites=await page.evaluate(()=>writes.length);
  await page.waitForTimeout(1600);
  expect(await page.evaluate(()=>writes.length)).toBe(firstFailureWrites+1);
  await page.waitForTimeout(1600);
  expect(await page.evaluate(()=>writes.length)).toBe(firstFailureWrites+1);
  await page.evaluate(async () => { failMirror=false;await syncDiaryEntriesToFichaHistory({notify:true});failMirror=true;await syncDiaryEntriesToFichaHistory({notify:true}); });
  const writesBeforeLogout=await page.evaluate(()=>writes.length);
  await page.evaluate(() => authCallback(null));
  await page.waitForTimeout(1600);
  expect(await page.evaluate(()=>writes.length)).toBe(writesBeforeLogout);
  await page.evaluate(() => { testAuth.currentUser={uid:'mirror-test'};authCallback(testAuth.currentUser); });
  await expect.poll(() => page.evaluate(() => firebaseSessionUnsubscribers.size)).toBe(3);
  await page.evaluate(records => {
    failMirror=false;pauseMirror=true;mirrorStarted=false;releaseMirror=null;
    diaryCache=records;
    LOGS={'44':[]};window.pendingMirrorSync=syncDiaryEntriesToFichaHistory({notify:true});
  },[{id:'d4',...diary('Primeiro')},{id:'d5',...diary('Segundo')}]);
  await expect.poll(() => page.evaluate(() => !!mirrorStarted)).toBe(true);
  await page.evaluate(() => authCallback(null));
  await page.evaluate(() => releaseMirror());
  await page.evaluate(() => pendingMirrorSync);
  expect(await page.evaluate(() => testDb.registos_fichas?.['44']?.diary_d5)).toBeUndefined();
});
