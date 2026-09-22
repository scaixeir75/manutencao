const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test.use({ channel: process.env.PMP_PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined), serviceWorkers: 'block' });
const root = path.resolve(__dirname, '..', '..');
const firebase = `
  export const initializeApp=()=>({}),getDatabase=()=>({}),ref=(db,path)=>({path}),push=r=>({key:'generated',path:r.path+'/generated'}),get=async()=>({val:()=>null}),set=async()=>{},remove=async()=>{},onValue=(r,callback)=>{queueMicrotask(()=>callback({val:()=>null}));return ()=>{};};
  window.testAuth={currentUser:{uid:'scale-test'}};export const getAuth=()=>window.testAuth,signInWithEmailAndPassword=async()=>{},signOut=async()=>{},onAuthStateChanged=(auth,callback)=>queueMicrotask(()=>callback(auth.currentUser));
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
  await expect.poll(() => page.evaluate(() => !!activeAuthSession)).toBe(true);
}

test('reconciliação e lista mantêm custo linear sem escritas quando 100–5000 mirrors já estão sincronizados', async ({ page }) => {
  await open(page);
  const measurements = await page.evaluate(async sizes => {
    const results=[];
    for (const count of sizes) {
      const records=Array.from({length:count},(_,index)=>({
        id:`scale-${index}`, fichaId:'44', fichaNome:'Rotina Diária', text:`Registo sintético ${index}`,
        severity:'info', date:'2026-09-22', timestamp:`2026-09-22T10:${String(index%60).padStart(2,'0')}:00.000Z`, structuredData:{measurements:[],checks:[],reportItems:[]}
      }));
      diaryCache=records;
      LOGS={'44':records.map(buildDiaryMirrorEntry)};
      const writes=[];
      const originalSet=fb.set,originalRemove=fb.remove;
      fb.set=async(...args)=>{writes.push(args[0].path);return originalSet(...args);};
      fb.remove=async(...args)=>{writes.push(args[0].path);return originalRemove(...args);};
      const syncStart=performance.now();
      const sync=await syncDiaryEntriesToFichaHistory();
      const syncMs=performance.now()-syncStart;
      const stableWrites=writes.length;
      LOGS={'44':records.slice(1).map(buildDiaryMirrorEntry)};
      writes.length=0;
      const repairStart=performance.now();
      const repair=await syncDiaryEntriesToFichaHistory();
      const repairMs=performance.now()-repairStart;
      const renderStart=performance.now();
      renderDiary();
      const renderMs=performance.now()-renderStart;
      fb.set=originalSet;fb.remove=originalRemove;
      results.push({count,syncMs,repairMs,renderMs,repaired:sync.repaired,stableWrites,repairWrites:writes.length,repairedEntries:repair.repaired,rendered:document.querySelectorAll('#diaryList .diary-entry').length});
    }
    return results;
  }, [100,1000,5000]);
  console.log('P05 escala:', measurements);
  for (const result of measurements) {
    expect(result).toMatchObject({repaired:0,stableWrites:0,repairWrites:1,repairedEntries:1,rendered:10});
  }
  expect(measurements[2].syncMs).toBeLessThan(Math.max(250, measurements[1].syncMs * 12));
  expect(measurements[2].renderMs).toBeLessThan(Math.max(250, measurements[1].renderMs * 12));
});
