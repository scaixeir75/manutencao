const {test,expect}=require('@playwright/test');
const fs=require('node:fs');const path=require('node:path');
const {names}=require('../photo-ai-contract');
test.use({channel:process.env.PMP_PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined),trace:'off'});
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const photoCode=html.slice(html.indexOf('let photoAiSession=null;'),html.indexOf('function openModal(f)'));
const events=html.slice(html.indexOf("$('photoAiOpenBtn').onclick"),html.indexOf('let reportFilter=new Set();'));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT1sAAAAASUVORK5CYII=','base64');
const complete=()=>({schemaVersion:1,fields:Object.fromEntries(names.map(n=>{const value=({date:'2026-09-05',status:'Concluído',equipment:'Quadros Eléctricos'})[n]||'Verificação executada';return [n,{value,confidence:'Reconhecido',evidence:value,reason:''}];})),warnings:[]});
async function setup(page){
  // HTML/CSS e funções reais; Firebase, fornecedor e confirmações isolados em memória.
  await page.route('**/*',route=>route.abort());
  await page.setContent(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''));
  await page.addScriptTag({path:path.join(__dirname,'../photo-ai-contract.js')});
  await page.addScriptTag({content:`
    const $=id=>document.getElementById(id),CATALOG={'41':'Quadros Eléctricos'},modalFicha='41',week=36;
    const escapeHtml=v=>String(v),isoWeek=()=>36,diaryDateOf=e=>e.date;
    let diaryCache=[];window.historyRows=[];window.writes=[];window.confirmed=false;window.confirmCount=0;window.revoked=[];window.fetchCount=0;
    const logsFor=()=>window.historyRows,renderLogList=()=>{},showToast=m=>window.toast=m;
    const askConfirm=async()=>{window.confirmCount++;return window.confirmed;};
    const nativeRevoke=URL.revokeObjectURL.bind(URL);URL.revokeObjectURL=u=>{window.revoked.push(u);nativeRevoke(u);};
    window.fbAuth={auth:{currentUser:{uid:'user',getIdToken:async()=>'synthetic-test-token'}}};
    window.firebaseReady=true;let sequence=0;
    window.fb={db:{},ref:(db,p)=>p,push:p=>{const key=String(++sequence);return {key,path:p+'/'+key};},set:async(target,data)=>{window.writes.push({target:target.path,data});if(window.failWrite===window.writes.length)throw Error('Falha simulada.');}};
    window.PMP_PHOTO_AI={enabled:true,endpoint:'https://proxy.test/v1/photo-ai/analyze'};
    window.fetch=async(url,options)=>{window.fetchCount++;window.lastRequest=JSON.parse(options.body);return {ok:true,json:async()=>window.reply};};
    ${photoCode}
    ${events}
    window.photoState=()=>({session:!!photoAiSession,file:!!photoAiSession?.file,url:photoAiSession?.objectUrl||null,busy:!!photoAiSession?.controller});
    $('loginScreen').classList.add('hidden');$('overlay').classList.add('open');openPhotoAiPanel();
  `});
  await page.evaluate(data=>window.reply=data,complete());
}
async function select(page){await page.locator('#photoAiGalleryInput').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:png});}
async function discarded(page){
  await expect.poll(()=>page.evaluate(()=>photoState().file)).toBe(false);
  expect(await page.evaluate(()=>photoState().url)).toBeNull();
  await expect(page.locator('#photoAiImage')).not.toHaveAttribute('src',/./);
  await expect(page.locator('#photoAiGalleryInput')).toHaveValue('');
}
test.beforeEach(async({page})=>setup(page));
test('frontend desativado ou sem endpoint não faz pedido de análise',async({page})=>{
  for(const config of [{enabled:false,endpoint:'https://proxy.test/v1/photo-ai/analyze'},{enabled:true,endpoint:''}]){
    await page.evaluate(()=>openPhotoAiPanel());
    await page.evaluate(config=>window.PMP_PHOTO_AI=config,config);
    await select(page);await expect(page.locator('#photoAiAnalyzeBtn')).toBeDisabled();
    expect(await page.evaluate(()=>fetchCount)).toBe(0);
    await page.locator('#photoAiCancelBtn').click();
  }
});
test('resposta completa, dados editáveis, imagem descartada e sem gravação automática',async({page})=>{
  await select(page);await page.locator('#photoAiAnalyzeBtn').click();await discarded(page);
  await expect(page.locator('#photoAiWork')).toHaveValue('Verificação executada');await expect(page.locator('#photoAiWorkConfidence')).toHaveValue('Reconhecido');await expect(page.locator('#photoAiFichaConfidence')).toHaveValue('Não confirmado');
  await page.locator('#photoAiWork').fill('Revisto pelo utilizador');expect(await page.evaluate(()=>writes)).toEqual([]);
  await page.locator('#photoAiConfirmBtn').click();expect(await page.evaluate(()=>confirmCount)).toBe(1);expect(await page.evaluate(()=>writes)).toEqual([]);
});
test('campos ausentes e duvidosos mantêm incerteza; ficha não muda',async({page})=>{
  await page.evaluate(()=>{reply.fields.notes={value:null,confidence:'Não confirmado',evidence:null,reason:'Informação insuficiente.'};reply.fields.work.confidence='Duvidoso';reply.fields.work.reason='Caligrafia ambígua.';reply.fields.equipment.value='Outro equipamento';});
  await select(page);await page.locator('#photoAiAnalyzeBtn').click();await discarded(page);
  await expect(page.locator('#photoAiNotes')).toHaveValue('');await expect(page.locator('#photoAiNotesConfidence')).toHaveValue('Não confirmado');await expect(page.locator('#photoAiWorkConfidence')).toHaveValue('Duvidoso');await expect(page.locator('#photoAiFicha')).toHaveValue('41');
  await expect(page.locator('#photoAiFeedback')).toContainText('Outro equipamento');
});
for(const mode of ['invalid','network','quota','unauthenticated','bad-token'])test('descarte em erro: '+mode,async({page})=>{
  await select(page);
  await page.evaluate(mode=>{
    if(mode==='invalid')window.reply={bad:true};
    if(mode==='network')window.fetch=async()=>{throw Error('Erro de rede.');};
    if(mode==='quota')window.fetch=async()=>({ok:false,status:429});
    if(mode==='unauthenticated')window.fbAuth.auth.currentUser=null;
    if(mode==='bad-token')window.fbAuth.auth.currentUser.getIdToken=async()=>{throw Error('Sessão expirada.');};
  },mode);
  await page.locator('#photoAiAnalyzeBtn').click();await discarded(page);expect(await page.evaluate(()=>writes)).toEqual([]);await expect(page.locator('#photoAiWork')).toHaveValue('');
});
for(const stage of ['fetch','token','response'])test('timeout e descarte durante '+stage,async({page})=>{
  await page.clock.install();await select(page);
  await page.evaluate(stage=>{
    const never=()=>new Promise(()=>{});
    if(stage==='token')window.fbAuth.auth.currentUser.getIdToken=never;
    if(stage==='fetch')window.fetch=never;
    if(stage==='response')window.fetch=async()=>({ok:true,json:never});
  },stage);
  await page.locator('#photoAiAnalyzeBtn').click();await page.clock.fastForward(46000);await discarded(page);await expect(page.locator('#photoAiFeedback')).toContainText('tempo excedido');
  expect(await page.evaluate(()=>photoState().busy)).toBe(false);
});
test('cancelar e resposta tardia não preenchem nova folha nem apagam nova fotografia',async({page})=>{
  await select(page);await page.evaluate(()=>window.fetch=()=>new Promise(resolve=>window.finishOld=resolve));
  await page.locator('#photoAiAnalyzeBtn').click();await expect.poll(()=>page.evaluate(()=>typeof window.finishOld)).toBe('function');
  await page.locator('#photoAiCancelBtn').click();await discarded(page);expect(await page.evaluate(()=>photoState().session)).toBe(false);
  await page.locator('#photoAiOpenBtn').click();await select(page);const newUrl=await page.evaluate(()=>photoState().url);
  await page.evaluate(()=>window.finishOld({ok:true,json:async()=>window.reply}));
  await expect(page.locator('#photoAiWork')).toHaveValue('');expect(await page.evaluate(()=>photoState().url)).toBe(newUrl);expect(await page.evaluate(()=>writes)).toEqual([]);
});
test('imagem inválida ou demasiado grande descarta sessão anterior',async({page})=>{
  for(const file of [{name:'invalid.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')},{name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(8*1024*1024+1)}]){
    await select(page);await page.locator('#photoAiGalleryInput').setInputFiles(file);await discarded(page);expect(await page.evaluate(()=>photoState().session)).toBe(false);
  }
  expect(await page.evaluate(()=>fetchCount)).toBe(0);
});
for(const destination of ['history','diary'])test('confirmação humana escreve apenas no destino '+destination,async({page})=>{
  await select(page);await page.locator('#photoAiAnalyzeBtn').click();await discarded(page);
  await page.locator('input[name="photoAiDestination"][value="'+destination+'"]').check();await page.evaluate(()=>window.confirmed=true);
  await page.locator('#photoAiConfirmBtn').click();await expect.poll(()=>page.evaluate(()=>writes.length)).toBe(1);
  const written=await page.evaluate(()=>writes[0]);expect(written.target).toMatch(destination==='history'?/^registos_fichas\/41\//:/^registos_diarios\//);expect(JSON.stringify(written)).not.toMatch(/image|base64|blob:|photo|pendingPhotos/);
  await discarded(page);expect(await page.evaluate(()=>photoState().session)).toBe(false);
});
test('falha parcial: repetir usa referências estáveis, sem duplicar execução ou anomalia',async({page})=>{
  await select(page);await page.locator('#photoAiAnalyzeBtn').click();await discarded(page);
  await page.locator('#photoAiCreateAnomaly').check();await page.evaluate(()=>{window.confirmed=true;window.failWrite=2;});
  await page.locator('#photoAiConfirmBtn').click();await expect(page.locator('#photoAiFeedback')).toContainText('Falha simulada');
  await page.locator('#photoAiConfirmBtn').click();await expect.poll(()=>page.evaluate(()=>writes.length)).toBe(3);
  const rows=await page.evaluate(()=>writes);expect(rows[1].target).toBe(rows[2].target);expect(new Set(rows.map(r=>r.target)).size).toBe(2);await discarded(page);
});
test('rascunho manual: confirmação recusada e erro de gravação descartam imagem',async({page})=>{
  await select(page);await page.locator('#photoAiWork').fill('Trabalho manual');await page.locator('#photoAiDate').fill('2026-09-05');await page.locator('#photoAiStatus').selectOption('Concluído');
  await page.locator('#photoAiConfirmBtn').click();await discarded(page);expect(await page.evaluate(()=>writes)).toEqual([]);
  await page.evaluate(()=>{window.confirmed=true;window.failWrite=1;});await page.locator('#photoAiConfirmBtn').click();await discarded(page);await expect(page.locator('#photoAiFeedback')).toContainText('Falha simulada');
});
test('fecho da página descarta fotografia e impede resposta tardia',async({page})=>{
  await select(page);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await discarded(page);expect(await page.evaluate(()=>photoState().session)).toBe(false);
});
test('móvel 390 px: painel sem overflow e campos editáveis',async({page})=>{
  await page.setViewportSize({width:390,height:844});await select(page);await page.locator('#photoAiAnalyzeBtn').click();await discarded(page);
  expect(await page.locator('#photoAiPanel').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await page.locator('#photoAiWork').fill('Revisão móvel');await expect(page.locator('#photoAiConfirmBtn')).toBeEnabled();
  await page.screenshot({path:'test-results/photo-ai-mobile.png',fullPage:true});
});
test('página completa: arranque, fluxo real de eventos e logout com Firebase simulado',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://pmp.test/**',route=>{
    const filename=new URL(route.request().url()).pathname.slice(1);
    if(['photo-ai-contract.js','photo-ai-config.js'].includes(filename))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(__dirname,'..',filename),'utf8')});
    return route.fulfill({contentType:'text/html',body:html});
  });
  await page.route('https://www.gstatic.com/firebasejs/**',route=>route.fulfill({contentType:'text/javascript',body:`
    export const initializeApp=()=>({}),getDatabase=()=>({}),ref=()=>({}),push=()=>({key:'test'}),set=()=>{throw Error('Escrita não autorizada no teste');},remove=set;
    export const onValue=(ref,cb)=>queueMicrotask(()=>cb({val:()=>null})),get=async()=>({val:()=>null});
    const auth={currentUser:{uid:'user',email:'synthetic@example.invalid',getIdToken:async()=>'test'}};
    export const getAuth=()=>auth,signInWithEmailAndPassword=async()=>{},signOut=async()=>{auth.currentUser=null;window.mockAuthCallback(null);},onAuthStateChanged=(a,cb)=>{window.mockAuthCallback=cb;queueMicrotask(()=>cb(a.currentUser));};
  `}));
  await page.goto('http://pmp.test/');
  await expect(page.locator('#loginScreen')).toHaveClass(/hidden/);
  await page.evaluate(()=>{openModal('41');openPhotoAiPanel();});await select(page);
  await expect(page.locator('#photoAiImage')).toHaveAttribute('src',/^blob:/);
  await page.evaluate(()=>{window.fbAuth.auth.currentUser=null;window.mockAuthCallback(null);});
  await expect(page.locator('#photoAiImage')).not.toHaveAttribute('src',/./);await expect(page.locator('#photoAiPanel')).toBeHidden();expect(errors).toEqual([]);
});
