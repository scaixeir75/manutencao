const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');

test.use({channel:process.env.PMP_PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined),trace:'off',serviceWorkers:'block'});
const root=path.resolve(__dirname,'..');
const png={name:'mobile.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT1sAAAAASUVORK5CYII=','base64')};
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
  await page.locator('#tabDiary').click();
}

async function seedEditableDiary(page){
  await page.evaluate(async()=>{
    await fb.set(fb.ref(fb.db,'registos_diarios/mobile-edit'),{
      text:'Texto original para edição mobile',severity:'aviso',date:'2026-09-10',timestamp:new Date().toISOString(),fichaId:'44',fichaNome:CATALOG['44'],
      photos:['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT1sAAAAASUVORK5CYII='],
      metadata:{source:'ux-mobile'},structuredData:{source:'assisted_form',metadata:{template:'rotina'},measurements:[{section:'aqs',item:'01',type:'temperature',value:55,unit:'°C',status:'OK'},{section:'aqs',item:'02',type:'temperature',value:60,unit:'°C'},{section:'generator',item:'fuel',type:'level',value:'3/4'}],checks:[{section:'aqs',item:'01',status:'OK'}],reportItems:['Item independente']}
    });
  });
  if(!await page.locator('#diaryHistorySection').isVisible())await page.locator('#diaryHistoryToggle').click();
  await expect(page.locator('.diary-entry[data-id="mobile-edit"]')).toBeVisible();
}

function isInside(rect,width,height){return rect.left>=0&&rect.right<=width&&rect.top>=0&&rect.bottom<=height;}

test('UX-MOBILE-003: Registos Diários permanece utilizável nas quatro larguras',async({page})=>{
  await openLocal(page);
  for(const viewport of viewports){
    await page.setViewportSize(viewport);
    await expect(page.locator('#diaryView')).toBeVisible();
    await page.locator('#diaryText').fill('Visita do fornecedor para inspeção externa.');
    await expect(page.locator('#diaryCategorySuggestion')).toContainText('Visita');
    await expect(page.locator('.sev-btn.active')).toContainText('TAREFA');
    const layout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,form:document.querySelector('.diary-form').getBoundingClientRect(),save:document.querySelector('#diarySave').getBoundingClientRect(),description:document.querySelector('#diaryText').getBoundingClientRect()}));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.form.right).toBeLessThanOrEqual(viewport.width);
    expect(layout.save.right).toBeLessThanOrEqual(viewport.width);
    if(viewport.width<=560){
      await page.locator('#diaryText').focus();
      await page.setViewportSize({width:viewport.width,height:480});
      await expect.poll(()=>page.locator('#diaryText').evaluate(node=>node.getBoundingClientRect().bottom)).toBeLessThanOrEqual(480);
      const focused=await page.locator('#diaryText').evaluate(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width};});
      expect(focused.left).toBeGreaterThanOrEqual(0);expect(focused.right).toBeLessThanOrEqual(viewport.width);expect(focused.bottom).toBeLessThanOrEqual(480);
      await page.locator('#diarySave').scrollIntoViewIfNeeded();
      const saveVisible=await page.locator('#diarySave').evaluate((node,height)=>{const r=node.getBoundingClientRect();return {visible:r.top>=0&&r.bottom<=height+1,top:r.top,bottom:r.bottom,height:r.height,viewport:height};},480);
      expect(saveVisible.visible,JSON.stringify(saveVisible)).toBe(true);
      await page.setViewportSize(viewport);
    }
  }
});

test('UX-MOBILE-003: fotografias, edição e dados estruturados preservam-se',async({page})=>{
  await openLocal(page);await page.setViewportSize({width:390,height:844});
  await page.locator('#photoInput').setInputFiles(png);
  await expect(page.locator('#photoThumbs .photo-thumb')).toHaveCount(1);
  const targets=await page.evaluate(()=>['.mic-btn','.photo-thumb .pt-remove'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {selector,width:r.width,height:r.height};}));
  expect(targets,JSON.stringify(targets)).toEqual(targets.map(target=>({...target,width:Math.max(44,target.width),height:Math.max(44,target.height)})));
  await page.locator('.pt-remove').click();await expect(page.locator('#photoThumbs .photo-thumb')).toHaveCount(0);
  await seedEditableDiary(page);
  const editButton = page.locator('.diary-entry[data-id="mobile-edit"]').getByRole('button', { name: '✏️ Editar', exact: true });
  await editButton.click();
  await expect(page.locator('#editText-mobile-edit')).toBeFocused();
  const editTargets=await page.evaluate(()=>['.de-save','.de-cancel'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {selector,width:r.width,height:r.height};}));
  expect(editTargets,JSON.stringify(editTargets)).toEqual(editTargets.map(target=>({...target,width:Math.max(44,target.width),height:Math.max(44,target.height)})));
  await page.locator('.de-cancel').click();await expect(page.locator('#editText-mobile-edit')).toHaveCount(0);
  await editButton.click();
  await page.locator('#editText-mobile-edit').fill('Texto revisto no mobile');
  await page.locator('#editSev-mobile-edit').selectOption('urgente');
  await page.locator('.de-save').click();
  await expect.poll(()=>page.evaluate(()=>testDb.registos_diarios['mobile-edit']?.text)).toBe('Texto revisto no mobile');
  const record=await page.evaluate(()=>testDb.registos_diarios['mobile-edit']);
  expect(record.severity).toBe('urgente');expect(record.structuredData.measurements.find(row=>row.section==='aqs'&&row.item==='02').value).toBe(60);expect(record.structuredData.measurements.find(row=>row.section==='generator').value).toBe('3/4');expect(record.structuredData.reportItems).toEqual(['Item independente']);expect(record.metadata).toEqual({source:'ux-mobile'});expect(record.photos).toHaveLength(1);
  await page.locator('.de-photo').click();await expect(page.locator('#lightbox')).toHaveClass(/open/);
  const lightbox=await page.locator('#lightbox').evaluate(node=>{const r=node.getBoundingClientRect(),button=node.querySelector('.lb-close').getBoundingClientRect();return {r:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},button:{width:button.width,height:button.height}};});
  expect(isInside(lightbox.r,390,844)).toBe(true);expect(lightbox.button.width).toBeGreaterThanOrEqual(44);expect(lightbox.button.height).toBeGreaterThanOrEqual(44);
  await page.locator('#lbClose').click();await expect(page.locator('#lightbox')).not.toHaveClass(/open/);
});

test('UX-DIARY-TEXTAREA-001: a descrição cresce, limita o scroll e reduz em criação e edição',async({page})=>{
  await openLocal(page);
  const longText=Array.from({length:14},(_,index)=>`Linha ${index+1} com texto suficiente para testar o crescimento.`).join('\n');
  const veryLongText=Array.from({length:80},(_,index)=>`Linha longa ${index+1} para atingir o limite da caixa.`).join('\n');
  for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
    await page.setViewportSize(viewport);
    const description=page.locator('#diaryText');
    await description.fill('Texto curto');
    const minimum=await description.evaluate(node=>node.getBoundingClientRect().height);
    await description.fill('Linha única longa para confirmar que a largura inteira da textarea é usada antes de existir uma quebra automática provocada apenas pelo conteúdo. '.repeat(4));
    const singleLine=await description.evaluate(node=>{const style=getComputedStyle(node);return {scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,paddingLeft:parseFloat(style.paddingLeft),paddingRight:parseFloat(style.paddingRight)};});
    expect(singleLine.scrollWidth).toBeLessThanOrEqual(singleLine.clientWidth);
    expect(singleLine.paddingRight).toBe(singleLine.paddingLeft);
    await description.fill(longText);
    const grown=await description.evaluate(node=>node.getBoundingClientRect().height);
    expect(grown).toBeGreaterThan(minimum);
    await description.fill(veryLongText);
    const capped=await description.evaluate(node=>{const style=getComputedStyle(node),wrapper=node.parentElement.getBoundingClientRect(),rect=node.getBoundingClientRect();return {height:rect.height,width:rect.width,scrollHeight:node.scrollHeight,overflowY:style.overflowY,paddingLeft:parseFloat(style.paddingLeft),paddingRight:parseFloat(style.paddingRight),paddingBottom:parseFloat(style.paddingBottom),wrapperWidth:wrapper.width};});
    expect(capped.height).toBeLessThanOrEqual(280);
    expect(capped.scrollHeight).toBeGreaterThan(capped.height);
    expect(capped.overflowY).toBe('auto');
    const microphone=await page.locator('#micBtn').evaluate(node=>({height:node.getBoundingClientRect().height,width:node.getBoundingClientRect().width}));
    expect(capped.paddingRight).toBe(capped.paddingLeft);
    expect(capped.paddingRight).toBeLessThan(microphone.width);
    expect(capped.width).toBeCloseTo(capped.wrapperWidth,1);
    expect(capped.paddingBottom).toBeGreaterThanOrEqual(microphone.height+10);
    await description.fill('');
    const reduced=await description.evaluate(node=>({height:node.getBoundingClientRect().height,overflowY:getComputedStyle(node).overflowY}));
    expect(reduced.height).toBeLessThan(grown);
    expect(reduced.overflowY).toBe('hidden');
    const layout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport);

    await seedEditableDiary(page);
    await page.locator('.diary-entry[data-id="mobile-edit"]').getByRole('button',{name:'✏️ Editar',exact:true}).click();
    const editText=page.locator('#editText-mobile-edit');
    const editMinimum=await editText.evaluate(node=>node.getBoundingClientRect().height);
    await editText.fill(longText);
    const editGrown=await editText.evaluate(node=>node.getBoundingClientRect().height);
    expect(editGrown).toBeGreaterThan(editMinimum);
    await editText.fill(veryLongText);
    const editCapped=await editText.evaluate(node=>({height:node.getBoundingClientRect().height,scrollHeight:node.scrollHeight,overflowY:getComputedStyle(node).overflowY}));
    expect(editCapped.height).toBeLessThanOrEqual(280);
    expect(editCapped.scrollHeight).toBeGreaterThan(editCapped.height);
    expect(editCapped.overflowY).toBe('auto');
    await editText.fill('');
    expect(await editText.evaluate(node=>node.getBoundingClientRect().height)).toBeLessThan(editGrown);
    await page.locator('.de-cancel').click();
  }
});

test('UX-MOBILE-003: filtros e miniaturas não criam overflow nas quatro larguras',async({page})=>{
  await openLocal(page);
  for(const viewport of viewports){
    await page.setViewportSize(viewport);
    await page.locator('#photoInput').setInputFiles(png);
    await expect(page.locator('#photoThumbs .photo-thumb')).toHaveCount(1);
    const photoLayout=await page.evaluate(()=>{
      const thumb=document.querySelector('#photoThumbs .photo-thumb').getBoundingClientRect();
      return {scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,thumb};
    });
    expect(photoLayout.scrollWidth).toBeLessThanOrEqual(photoLayout.viewport);
    expect(photoLayout.thumb.left).toBeGreaterThanOrEqual(0);
    expect(photoLayout.thumb.right).toBeLessThanOrEqual(viewport.width);
    if(viewport.width<=560){
      const remove=await page.locator('.pt-remove').evaluate(node=>{const r=node.getBoundingClientRect();return {width:r.width,height:r.height};});
      expect(remove.width).toBeGreaterThanOrEqual(44);
      expect(remove.height).toBeGreaterThanOrEqual(44);
    }
    await page.locator('.pt-remove').click();
    await page.locator('#diaryHistoryToggle').click();
    await expect(page.locator('#diaryHistorySection')).toBeVisible();
    const filterLayout=await page.evaluate(()=>({
      scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,
      controls:[...document.querySelectorAll('#diaryHistorySection button,#diaryHistorySection input,#diaryHistorySection select')].map(node=>{
        const r=node.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};
      })
    }));
    expect(filterLayout.scrollWidth).toBeLessThanOrEqual(filterLayout.viewport);
    for(const control of filterLayout.controls){
      expect(control.left).toBeGreaterThanOrEqual(0);
      expect(control.right).toBeLessThanOrEqual(viewport.width);
    }
    await page.locator('#diaryHistoryToggle').click();
  }
});
