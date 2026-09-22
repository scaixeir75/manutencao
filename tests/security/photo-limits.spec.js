const { test, expect } = require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

test.use({channel:process.env.PMP_PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined),serviceWorkers:'block'});
const root=path.resolve(__dirname,'..','..');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT1sAAAAASUVORK5CYII=','base64');
const firebase=`
 window.testDb={registos_diarios:{}};window.writes=[];const read=p=>p.split('/').reduce((v,k)=>v?.[k],window.testDb)??null;const snap=v=>({val:()=>structuredClone(v)});
 export const initializeApp=()=>({}),getDatabase=()=>({}),ref=(db,path)=>({path}),push=r=>({path:r.path+'/generated',key:'generated'}),get=async r=>snap(read(r.path));
 export async function set(r,value){window.writes.push({path:r.path,value:structuredClone(value)});const keys=r.path.split('/');let node=window.testDb;for(const key of keys.slice(0,-1))node=node[key]||={};node[keys.at(-1)]=structuredClone(value);}
 export const remove=async()=>{},onValue=(r,cb)=>{queueMicrotask(()=>cb(snap(read(r.path))));return ()=>{};};
 window.testAuth={currentUser:{uid:'photo-test'}};export const getAuth=()=>window.testAuth,signInWithEmailAndPassword=async()=>{},signOut=async()=>{},onAuthStateChanged=(auth,cb)=>queueMicrotask(()=>cb(auth.currentUser));
`;

async function open(page){
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:firebase});if(url.origin==='http://pmp.test'){const file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(['index.html','photo-ai-contract.js','photo-ai-config.js','photo-ai-assisted-core.mjs','photo-ai-assisted-form.mjs','diary-classification.mjs'].includes(file))return route.fulfill({contentType:file.endsWith('.html')?'text/html':'text/javascript',body:fs.readFileSync(path.join(root,file),'utf8')});}return route.abort();});
 await page.goto('http://pmp.test/');await expect.poll(()=>page.evaluate(()=>!!activeAuthSession)).toBe(true);await page.evaluate(()=>switchView('diary'));
}
async function addPng(page,count=1){await page.evaluate(async({bytes,count})=>{const binary=Uint8Array.from(atob(bytes),c=>c.charCodeAt(0));const files=Array.from({length:count},(_,i)=>new File([binary],`photo-${i}.png`,{type:'image/png'}));await handlePhotoFiles(files,$('photoAddBtn'));},{bytes:png.toString('base64'),count});}

test('P06: aceita fotos válidas, limita quantidade, rejeita ficheiro grande ou MIME inválido e remover liberta capacidade',async({page})=>{
 await open(page);await addPng(page,1);await expect(page.locator('#photoThumbs .photo-thumb')).toHaveCount(1);
 await page.evaluate(async()=>handlePhotoFiles([new File([new Uint8Array(10*1024*1024+1)],'large.png',{type:'image/png'})],$('photoAddBtn')));
 await expect(page.locator('#toast')).toContainText('excede 10 MB');await expect(page.locator('#photoThumbs .photo-thumb')).toHaveCount(1);
 await page.evaluate(async()=>handlePhotoFiles([new File(['<svg/>'],'x.svg',{type:'image/svg+xml'})],$('photoAddBtn')));
 await expect(page.locator('#toast')).toContainText('PNG, JPEG, WebP ou GIF');
 await addPng(page,4);await expect(page.locator('#photoThumbs .photo-thumb')).toHaveCount(4);await expect(page.locator('#toast')).toContainText('Máximo de 4');
 await page.evaluate(()=>removePendingPhoto(0));await addPng(page,1);await expect(page.locator('#photoThumbs .photo-thumb')).toHaveCount(4);
});

test('P06: limite agregado e dados programáticos bloqueiam a escrita sem perder texto ou fotos válidas',async({page})=>{
 await open(page);await page.locator('#diaryText').fill('Descrição preservada');await addPng(page,1);
 const result=await page.evaluate(async()=>{const before=pendingPhotos.slice(),oversized='data:image/jpeg;base64,'+'a'.repeat(800*1024);pendingPhotos=[oversized,oversized,oversized,oversized];let error='';try{await saveDiaryCanonical({text:'Descrição preservada',severity:'info',photos:pendingPhotos},'too-large');}catch(e){error=e.code;}const afterText=$('diaryText').value;pendingPhotos=before;return {error,afterText,writes:writes.length};});
 expect(result).toEqual({error:'DIARY_PHOTO_LIMIT',afterText:'Descrição preservada',writes:0});
 await page.locator('#diarySave').click();const saved=await page.evaluate(()=>testDb.registos_diarios.generated);expect(saved.text).toBe('Descrição preservada');expect(saved.photos).toHaveLength(1);expect(new TextEncoder().encode(saved.photos[0]).byteLength).toBeLessThanOrEqual(1024*1024);
});

test('P06: falha de uma foto preserva texto e a foto válida; edição rejeita conjunto legado acima do limite',async({page})=>{
 await open(page);await page.locator('#diaryText').fill('Texto não perdido');await page.evaluate(async bytes=>{const binary=Uint8Array.from(atob(bytes),c=>c.charCodeAt(0));await handlePhotoFiles([new File(['not image'],'bad.txt',{type:'text/plain'}),new File([binary],'ok.png',{type:'image/png'})],$('photoAddBtn'));},png.toString('base64'));
 await expect(page.locator('#photoThumbs .photo-thumb')).toHaveCount(1);await expect(page.locator('#diaryText')).toHaveValue('Texto não perdido');
 const dialogs=[];page.on('dialog',async dialog=>{dialogs.push(dialog.message());await dialog.accept();});
 const edit=await page.evaluate(async()=>{const large='data:image/jpeg;base64,'+'a'.repeat(1024*1024+1);diaryCache=[{id:'legacy',text:'Existente',severity:'info',date:'2026-09-22',timestamp:new Date().toISOString(),photos:[large]}];renderDiary();startEditDiary('legacy');await saveEditDiary('legacy');return {writes:writes.length};});
 expect(edit).toEqual({writes:0});expect(dialogs).toContain('Uma fotografia continua demasiado grande após o processamento.');
});
