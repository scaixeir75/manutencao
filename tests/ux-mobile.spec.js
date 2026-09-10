const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');

test.use({channel:process.env.PMP_PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined),trace:'off',serviceWorkers:'block'});
const root=path.resolve(__dirname,'..');
const firebase=`
 window.testDb ||= {};window.writes ||= [];window.listeners ||= new Map();window.sequence ||= 0;
 const read=p=>p.split('/').reduce((a,k)=>a?.[k],window.testDb)??null;
 const emit=p=>{for(const [key,list] of window.listeners)if(p===key||p.startsWith(key+'/'))for(const cb of list)cb({val:()=>structuredClone(read(key))});};
 export const initializeApp=()=>({}),getDatabase=()=>({}),ref=(db,path)=>({path}),push=r=>{const key='test'+(++window.sequence);return {key,path:r.path+'/'+key};};
 export async function set(r,v){const parts=r.path.split('/');let node=window.testDb;for(const k of parts.slice(0,-1))node=node[k]||={};node[parts.at(-1)]=structuredClone(v);emit(r.path);}
 export async function remove(r){const parts=r.path.split('/');const node=parts.slice(0,-1).reduce((n,k)=>n?.[k],window.testDb);if(node)delete node[parts.at(-1)];emit(r.path);}
 export const onValue=(r,cb)=>{const list=window.listeners.get(r.path)||[];list.push(cb);window.listeners.set(r.path,list);queueMicrotask(()=>cb({val:()=>structuredClone(read(r.path))}));},get=async r=>({val:()=>read(r.path)});
 window.testAuth ||= {currentUser:{uid:'ux-mobile',email:'ux@example.invalid'}};
 export const getAuth=()=>window.testAuth,signInWithEmailAndPassword=async()=>{},signOut=async()=>{window.testAuth.currentUser=null;window.authCallback(null);},onAuthStateChanged=(a,cb)=>{window.authCallback=cb;queueMicrotask(()=>cb(a.currentUser));};
`;

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
}

const viewports=[{name:'390',width:390,height:844},{name:'420',width:420,height:900},{name:'560',width:560,height:900},{name:'desktop',width:1280,height:900}];
test('UX-MOBILE-002: casca, navegação e Plano Semanal mantêm-se operacionais',async({page})=>{
  await openLocal(page);
  for(const viewport of viewports){
    await page.setViewportSize(viewport);
    await expect(page.locator('#planView')).toBeVisible();
    await expect(page.locator('#tabPlano')).toBeVisible();
    await expect(page.locator('#tabDiary')).toBeVisible();
    await expect(page.locator('#calendar .month')).toHaveCount(12);
    await expect(page.locator('#calendar .dot')).toHaveCount(52);
    const layout=await page.evaluate(()=>{
      const rect=selector=>{const value=document.querySelector(selector)?.getBoundingClientRect();return value&&{left:value.left,right:value.right,top:value.top,bottom:value.bottom,width:value.width,height:value.height};};
      return {scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,header:rect('header'),title:rect('header h1'),tabs:rect('.maintabs'),logout:rect('#logoutBtn'),consult:rect('#consultar'),report:rect('#openReport')};
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport);
    for(const rect of [layout.header,layout.tabs,layout.logout,layout.consult,layout.report]){
      expect(rect.left).toBeGreaterThanOrEqual(0);expect(rect.right).toBeLessThanOrEqual(viewport.width);
    }
    expect(layout.logout.width).toBeGreaterThanOrEqual(44);
    expect(layout.logout.height).toBeGreaterThanOrEqual(44);
    const overlapsTitle=layout.logout.left<layout.title.right&&layout.logout.right>layout.title.left&&layout.logout.top<layout.title.bottom&&layout.logout.bottom>layout.title.top;
    expect(overlapsTitle,JSON.stringify({viewport,logout:layout.logout,title:layout.title})).toBe(false);
    await page.locator('#calendar .dot[data-w="12"]').click();
    await expect(page.locator('#weekInput')).toHaveValue('12');
    await page.locator('#p1').click();
    await expect(page.locator('#weekInput')).toHaveValue('13');
    await page.locator('.task').first().click();
    await expect(page.locator('#overlay')).toHaveClass(/open/);
    const modal=await page.locator('.modal').evaluate(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom};});
    expect(modal.left).toBeGreaterThanOrEqual(0);expect(modal.right).toBeLessThanOrEqual(viewport.width);expect(modal.bottom).toBeLessThanOrEqual(viewport.height);
    await page.locator('#mClose').click();
    await page.locator('#tabDiary').click();await expect(page.locator('#diaryView')).toBeVisible();
    await page.locator('#tabPlano').click();await expect(page.locator('#planView')).toBeVisible();
    await page.locator('#planAiHelper .ai-helper-toggle').click();await expect(page.locator('#planAiHelper')).toHaveClass(/is-open/);
    await page.locator('#planAiHelper .ai-helper-toggle').click();await expect(page.locator('#planAiHelper')).not.toHaveClass(/is-open/);
  }
});
