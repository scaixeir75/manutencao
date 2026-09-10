const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');

test.use({channel:process.env.PMP_PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined),trace:'off',serviceWorkers:'block'});
const root=path.resolve(__dirname,'..');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT1sAAAAASUVORK5CYII=';
const firebase=`
 window.testDb ||= {};window.writes ||= [];window.listeners ||= new Map();window.sequence ||= 0;
 const read=p=>p.split('/').reduce((a,k)=>a?.[k],window.testDb)??null;
 const emit=p=>{for(const [key,list] of window.listeners)if(p===key||p.startsWith(key+'/'))for(const cb of list)cb({val:()=>structuredClone(read(key))});};
 export const initializeApp=()=>({}),getDatabase=()=>({}),ref=(db,path)=>({path}),push=r=>{const key='test'+(++window.sequence);return {key,path:r.path+'/'+key};};
 export async function set(r,v){window.writes.push({path:r.path,data:structuredClone(v)});const parts=r.path.split('/');let node=window.testDb;for(const k of parts.slice(0,-1))node=node[k]||={};node[parts.at(-1)]=structuredClone(v);emit(r.path);}
 export async function remove(r){const parts=r.path.split('/');const node=parts.slice(0,-1).reduce((n,k)=>n?.[k],window.testDb);if(node)delete node[parts.at(-1)];emit(r.path);}
 export const onValue=(r,cb)=>{const list=window.listeners.get(r.path)||[];list.push(cb);window.listeners.set(r.path,list);queueMicrotask(()=>cb({val:()=>structuredClone(read(r.path))}));},get=async r=>({val:()=>read(r.path)});
 window.testAuth ||= {currentUser:{uid:'ux-mobile',email:'ux@example.invalid'}};
 export const getAuth=()=>window.testAuth,signInWithEmailAndPassword=async()=>{},signOut=async()=>{window.testAuth.currentUser=null;window.authCallback(null);},onAuthStateChanged=(a,cb)=>{window.authCallback=cb;queueMicrotask(()=>cb(a.currentUser));};
`;
const viewports=[{name:'390',width:390,height:844},{name:'420',width:420,height:900},{name:'560',width:560,height:900},{name:'desktop',width:1280,height:900}];

async function openLocal(page){
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:firebase});
    if(url.origin==='http://pmp.test'){
      const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
      if(['index.html','photo-ai-contract.js','photo-ai-config.js','photo-ai-assisted-core.mjs','photo-ai-assisted-form.mjs','diary-classification.mjs'].includes(file))return route.fulfill({contentType:file.endsWith('.html')?'text/html':'text/javascript',body:fs.readFileSync(path.join(root,file),'utf8')});
    }
    return route.abort();
  });
  await page.goto('http://pmp.test/');
  await expect(page.locator('#loginScreen')).toHaveClass(/hidden/);
  await page.evaluate(async()=>{
    await fb.set(fb.ref(fb.db,'registos_fichas/44/history-mobile'),{
      date:'2026-09-10',week:37,status:'Pendente',tech:'Técnico de teste',created:Date.now(),
      note:'Registo técnico muito longo para confirmar a quebra de texto no Histórico e na Ficha sem esconder o contexto, o estado, a data ou qualquer detalhe operacional necessário à decisão humana.'
    });
  });
  await expect.poll(()=>page.evaluate(()=>logsFor('44').length)).toBe(1);
}

test('UX-MOBILE-004: Histórico, filtros, Fichas e lightbox mantêm-se utilizáveis',async({page})=>{
  await openLocal(page);
  for(const viewport of viewports){
    await page.setViewportSize(viewport);
    await page.evaluate(()=>showReport(44));
    await expect(page.locator('#reportView')).toBeVisible();
    await expect(page.locator('#reportBody .rficha .logentry')).toContainText('Registo técnico muito longo');
    await page.locator('#rDateFrom').fill('2026-09-01');
    await page.locator('#rDateTo').fill('2026-09-30');
    const report=await page.evaluate(()=>{
      const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
      return {scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,dates:[...document.querySelectorAll('.report-dates input,.report-dates button')].map(rect),card:rect(document.querySelector('#reportBody .rficha'))};
    });
    expect(report.scrollWidth).toBeLessThanOrEqual(report.viewport);
    for(const rect of [...report.dates,report.card]){expect(rect.left).toBeGreaterThanOrEqual(0);expect(rect.right).toBeLessThanOrEqual(viewport.width);}
    await page.evaluate(()=>openModal('44'));
    await expect(page.locator('#overlay')).toHaveClass(/open/);
    await expect(page.locator('#logList .logentry')).toContainText('Registo técnico muito longo');
    const modal=await page.locator('.modal').evaluate(node=>{const rect=value=>{const r=value.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};return {modal:rect(node),close:rect(document.querySelector('#mClose')),report:rect(document.querySelector('#mGoReport')),delete:rect(document.querySelector('.logentry .del'))};});
    expect(modal.modal.left).toBeGreaterThanOrEqual(0);expect(modal.modal.right).toBeLessThanOrEqual(viewport.width);expect(modal.modal.bottom).toBeLessThanOrEqual(viewport.height);
    if(viewport.width<=560){
      for(const target of [modal.close,modal.report,modal.delete]){expect(target.width).toBeGreaterThanOrEqual(44);expect(target.height).toBeGreaterThanOrEqual(44);}
      await page.locator('#fObs').focus();
      await page.setViewportSize({width:viewport.width,height:480});
      await expect.poll(()=>page.locator('#fObs').evaluate(node=>node.getBoundingClientRect().bottom)).toBeLessThanOrEqual(480);
      await page.locator('#logForm .savebtn').scrollIntoViewIfNeeded();
      await expect(page.locator('#logForm .savebtn')).toBeVisible();
      await page.setViewportSize(viewport);
    }
    await page.locator('#mClose').click();
    await expect(page.locator('#overlay')).not.toHaveClass(/open/);
    await page.evaluate(src=>openLightbox(src),png);
    await expect(page.locator('#lightbox')).toHaveClass(/open/);
    const lightbox=await page.locator('#lightbox').evaluate(node=>{const rect=value=>{const r=value.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};return {box:rect(node),close:rect(document.querySelector('#lbClose')),image:rect(document.querySelector('#lbImg'))};});
    expect(lightbox.box.left).toBe(0);expect(lightbox.box.right).toBe(viewport.width);expect(lightbox.box.bottom).toBe(viewport.height);
    expect(lightbox.close.width).toBeGreaterThanOrEqual(44);expect(lightbox.close.height).toBeGreaterThanOrEqual(44);
    expect(lightbox.image.width).toBeLessThanOrEqual(viewport.width);
    expect(lightbox.image.height).toBeLessThanOrEqual(viewport.height);
    await page.locator('#lbClose').click();
  }
});
