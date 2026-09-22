const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
test.use({channel:process.env.PMP_PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined),trace:'off',serviceWorkers:'block'});
const root=path.resolve(__dirname,'..');
const png={name:'reference.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT1sAAAAASUVORK5CYII=','base64')};
const firebase=`
 window.testDb ||= {};window.writes ||= [];window.listeners ||= new Map();window.sequence ||= 0;
 const pathOf=r=>r.path;
 const read=p=>p.split('/').reduce((a,k)=>a?.[k],window.testDb)??null;
 const emit=p=>{for(const [key,list] of window.listeners)if(p===key||p.startsWith(key+'/'))for(const cb of list)cb({val:()=>structuredClone(read(key))});};
 export const initializeApp=()=>({}),getDatabase=()=>({}),ref=(db,path)=>({path}),push=r=>{const key='test'+(++window.sequence);return {key,path:r.path+'/'+key};};
 export async function set(r,v){
  const check=value=>{if(value===undefined||typeof value==='number'&&!Number.isFinite(value))throw Error('Invalid Firebase value');if(value instanceof Blob)throw Error('Blob cannot be persisted');if(value&&typeof value==='object')Object.values(value).forEach(check);};check(v);
  window.writes.push({path:r.path,data:structuredClone(v)});if(window.failNext){window.failNext=false;throw Error('Simulated persistence failure');}const parts=r.path.split('/');let node=window.testDb;for(const k of parts.slice(0,-1))node=node[k]||=( {} );node[parts.at(-1)]=structuredClone(v);emit(r.path);
 }
 export async function remove(r){const parts=r.path.split('/');const node=parts.slice(0,-1).reduce((n,k)=>n?.[k],window.testDb);if(node)delete node[parts.at(-1)];emit(r.path);}
 export const onValue=(r,cb)=>{const list=window.listeners.get(r.path)||[];list.push(cb);window.listeners.set(r.path,list);queueMicrotask(()=>cb({val:()=>structuredClone(read(r.path))}));},get=async r=>({val:()=>read(r.path)});
 window.testAuth ||= {currentUser:{uid:'synthetic',email:'test@example.invalid'}};
 export const getAuth=()=>window.testAuth,signInWithEmailAndPassword=async()=>{},signOut=async()=>{window.testAuth.currentUser=null;window.authCallback(null);},onAuthStateChanged=(a,cb)=>{window.authCallback=cb;queueMicrotask(()=>cb(a.currentUser));};
`;
let errors;
test.beforeEach(async({page})=>{
 errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:firebase});
  if(u.origin==='http://pmp.test'){
   const file=u.pathname==='/'?'index.html':u.pathname.slice(1);
   if(['index.html','photo-ai-contract.js','photo-ai-config.js','photo-ai-assisted-core.mjs','photo-ai-assisted-form.mjs','diary-classification.mjs'].includes(file))return route.fulfill({contentType:file.endsWith('.html')?'text/html':'text/javascript',body:fs.readFileSync(path.join(root,file),'utf8')});
  }
  return route.abort();
 });
 await page.goto('http://pmp.test/');await expect(page.locator('#loginScreen')).toHaveClass(/hidden/);
 await expect.poll(()=>page.evaluate(()=>!!window.PmpAssistedForm&&window.listeners.has('registos_diarios'))).toBe(true);
 await page.evaluate(()=>{
  window.revoked=[];window.created=[];const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
  URL.createObjectURL=b=>{const u=create(b);created.push(u);return u;};URL.revokeObjectURL=u=>{revoked.push(u);revoke(u);};
  window.canonicalCalls=[];const real=saveDiaryCanonical;saveDiaryCanonical=async(...args)=>{canonicalCalls.push(structuredClone(args));return real(...args);};
 });
});
test.afterEach(()=>expect(errors).toEqual([]));
const field=(page,id)=>page.locator(`[data-assisted="${id}"]`);
const action=(page,id)=>page.locator(`[data-assisted-action="${id}"]`);
async function open(page){await page.evaluate(()=>openModal('44'));await page.locator('#photoAiOpenBtn').click();await expect(field(page,'aqs1')).toBeVisible();}
async function save(page){await action(page,'confirm').click();await expect(page.locator('#confirmOk')).toHaveText('Guardar');await page.locator('#confirmOk').click();await expect(page.locator('#assistedRoutineModal')).toHaveCount(0);}
async function seed(page,data){await page.evaluate(async data=>{await fb.set(fb.ref(fb.db,'registos_diarios/abc123'),{text:'Original',date:new Date().toISOString().slice(0,10),timestamp:new Date().toISOString(),severity:'info',fichaId:'44',fichaNome:CATALOG['44'],...data});},data);await expect.poll(()=>page.evaluate(()=>!!testDb.registos_fichas?.['44']?.diary_abc123)).toBe(true);await page.evaluate(()=>{writes.length=0;canonicalCalls.length=0;switchView('diary');});}

test('real UI: preview/back/correction/save → canonical diary → exactly one mirror',async({page})=>{
 await open(page);await field(page,'generator').selectOption('3/4');await field(page,'aqs1').fill('50,5');await field(page,'aqs1Status').selectOption('NOK');await field(page,'vacuum').fill('-400');await field(page,'vacuumUnit').fill('mBar');await field(page,'reportItems').fill('Assunto um\nAssunto dois');
 await page.locator('[data-assisted-photo]').setInputFiles(png);await action(page,'preview').click();await expect(page.locator('[data-assisted-preview]')).toContainText('3/4');await expect(page.locator('[data-assisted-preview]')).toContainText('NOK');expect(await page.evaluate(()=>writes)).toEqual([]);
 await action(page,'back').click();await field(page,'aqs1').fill('55');await action(page,'preview').click();await save(page);
 await expect.poll(()=>page.evaluate(()=>writes.length)).toBe(2);
 const state=await page.evaluate(()=>({calls:canonicalCalls.length,db:testDb,writes,revoked,created,logs:logsFor('44'),pending:pendingPhotos}));
 expect(state.calls).toBe(1);expect(state.writes.map(w=>w.path)).toEqual(['registos_diarios/test1','registos_fichas/44/diary_test1']);
 const data=state.db.registos_diarios.test1.structuredData;expect(data.measurements.find(m=>m.section==='generator').value).toBe('3/4');expect(data.measurements.find(m=>m.section==='aqs'&&m.type==='temperature').value).toBe(55);expect(state.db.registos_fichas['44'].diary_test1.structuredData).toEqual(data);expect(state.logs).toHaveLength(1);expect(state.pending).toEqual([]);expect(state.revoked).toEqual(state.created);expect(JSON.stringify(state.writes)).not.toMatch(/blob:|base64|reference.png/);
 await page.evaluate(()=>syncDiaryEntriesToFichaHistory());expect(await page.evaluate(()=>writes.length)).toBe(2);
});

const editFixture=()=>({
 severity:'aviso',metadata:{reference:'synthetic',revision:2},origin:'existing-origin',photos:['existing-photo'],
 structuredData:{source:'assisted_form',templateId:'rotina-diaria-v1',metadata:{document:'synthetic-sheet'},measurements:[
  {section:'aqs',item:'01',type:'temperature',value:55,unit:'°C',status:'OK',printedUnit:'°C',recordedUnit:'°C'},
  {section:'aqs',item:'02',type:'temperature',value:60,unit:'°C'},
  {section:'aqs',item:'01',type:'check',value:null,status:'NOK'},
  {section:'vacuum',item:'central',type:'pressure',value:-400,printedUnit:'Bar',recordedUnit:'mBar'},
  {section:'generator',item:'fuel',type:'level',value:'3/4'}
 ],checks:[{section:'other',item:'test',status:'OK'}],reportItems:['Primeiro','Segundo']}
});
async function openSeededHistory(page){
 await page.locator('#diaryHistoryToggle').click();
 await expect(page.locator('#diaryHistorySection')).toBeVisible();
 await expect(page.locator('.diary-entry[data-id="abc123"]')).toBeVisible();
}
test('CASE A: real normal editor changes text only and preserves the entire record',async({page})=>{
 await seed(page,editFixture());
 const before=await page.evaluate(()=>structuredClone(testDb.registos_diarios.abc123));
 await openSeededHistory(page);
 await page.locator('.diary-entry[data-id="abc123"]').getByRole('button',{name:'Editar',exact:false}).click();
 await page.locator('#editText-abc123').fill('Texto revisto');
 await page.locator('.de-save').click();
 await expect.poll(()=>page.evaluate(()=>testDb.registos_diarios.abc123.text)).toBe('Texto revisto');
 const after=await page.evaluate(()=>testDb.registos_diarios.abc123);
 expect(after.editedAt).toBeTruthy();delete after.editedAt;
 expect(after).toEqual({...before,text:'Texto revisto'});
 expect(await page.evaluate(()=>canonicalCalls.length)).toBe(1);
 await expect.poll(()=>page.evaluate(()=>testDb.registos_fichas['44'].diary_abc123.note)).toBe('Texto revisto');
 expect(await page.evaluate(()=>testDb.registos_fichas['44'].diary_abc123.structuredData)).toEqual(before.structuredData);
 expect(await page.evaluate(()=>logsFor('44').length)).toBe(1);
});
test('CASE B: real assisted editor changes AQS 01 only, preserving every other field',async({page})=>{
 await seed(page,editFixture());
 const before=await page.evaluate(()=>structuredClone(testDb.registos_diarios.abc123));
 await openSeededHistory(page);
 await page.getByRole('button',{name:'Dados da folha'}).click();
 await expect(field(page,'generator')).toHaveValue('3/4');await expect(field(page,'aqs1')).toHaveValue('55');await expect(field(page,'aqs2')).toHaveValue('60');
 await expect(field(page,'aqs1Status')).toHaveValue('NOK');await expect(field(page,'vacuumUnit')).toHaveValue('mBar');
 await field(page,'aqs1').fill('56');await action(page,'preview').click();await save(page);
 const after=await page.evaluate(()=>testDb.registos_diarios.abc123);
 expect(after.editedAt).toBeTruthy();delete after.editedAt;
 before.structuredData.measurements[0].value=56;
 expect(after).toEqual(before);
 expect(typeof after.structuredData.measurements.find(m=>m.section==='generator').value).toBe('string');
 expect(await page.evaluate(()=>testDb.registos_fichas['44'].diary_abc123.structuredData)).toEqual(before.structuredData);
 expect(await page.evaluate(()=>logsFor('44').length)).toBe(1);expect(await page.evaluate(()=>canonicalCalls.length)).toBe(1);
});

for(const closing of ['cancel','backdrop','escape','replace','pagehide','logout'])test('photo replacement and cleanup without persistence: '+closing,async({page})=>{
 await open(page);await field(page,'aqs1').fill('55');await page.locator('[data-assisted-photo]').setInputFiles(png);await page.locator('[data-assisted-photo]').setInputFiles({...png,name:'second.png'});await expect(page.locator('[data-assisted-photo-preview]')).toHaveAttribute('src',/^blob:/);expect(await page.evaluate(()=>revoked.length)).toBe(1);await action(page,'preview').click();
 if(closing==='cancel')await action(page,'cancel').click();
 if(closing==='backdrop')await page.locator('#assistedRoutineModal').click({position:{x:2,y:2}});
 if(closing==='escape')await page.keyboard.press('Escape');
 if(closing==='replace')await page.evaluate(()=>openAssistedRoutineForm('44'));
 if(closing==='pagehide')await page.evaluate(()=>dispatchEvent(new Event('pagehide')));
 if(closing==='logout')await page.evaluate(()=>{testAuth.currentUser=null;authCallback(null);});
 expect(await page.evaluate(()=>revoked)).toEqual(await page.evaluate(()=>created));expect(await page.evaluate(()=>writes)).toEqual([]);expect(await page.evaluate(()=>canonicalCalls)).toEqual([]);
 if(closing==='replace'){await expect(field(page,'aqs1')).toHaveValue('');await action(page,'cancel').click();}
});

test('invalid number rejected; refused or stale confirmation never writes; retry keeps ID',async({page})=>{
 await open(page);await field(page,'aqs1').fill('0x20');await action(page,'preview').click();await expect(page.locator('[data-assisted-error]')).toContainText('Valor inválido');await field(page,'aqs1').fill('55');await action(page,'preview').click();await action(page,'confirm').click();await page.locator('#confirmCancel').click();expect(await page.evaluate(()=>writes)).toEqual([]);
 await action(page,'confirm').click();await page.evaluate(()=>document.getElementById('assistedRoutineModal').closeAssisted());await page.locator('#confirmOk').click();expect(await page.evaluate(()=>canonicalCalls)).toEqual([]);
 await open(page);await action(page,'preview').click();await page.evaluate(()=>window.failNext=true);await action(page,'confirm').click();await page.locator('#confirmOk').click();await expect(page.locator('[data-assisted-error]')).toContainText('Não foi possível guardar');await save(page);const ids=await page.evaluate(()=>writes.filter(w=>w.path.startsWith('registos_diarios')).map(w=>w.path));expect(ids).toEqual(['registos_diarios/test1','registos_diarios/test1']);
});

test('normal Diary remains canonical; locked assisted edits and wrong ficha are blocked',async({page})=>{
 await page.evaluate(()=>switchView('diary'));await page.locator('#diaryText').fill('Registo normal');await page.locator('#diarySave').click();await expect.poll(()=>page.evaluate(()=>canonicalCalls.length)).toBe(1);expect(await page.evaluate(()=>testDb.registos_diarios.test1.structuredData)).toBeUndefined();
 await page.evaluate(()=>{openModal('41');openAssistedRoutineForm('41');});await expect(page.locator('#photoAiOpenBtn')).toBeHidden();await expect(page.locator('#assistedRoutineModal')).toHaveCount(0);
 await page.evaluate(()=>openAssistedRoutineForm('44',{id:'old',timestamp:'2020-01-01',structuredData:{}}));await expect(page.locator('#assistedRoutineModal')).toHaveCount(0);
});

test('shared Assistant uses actual pipeline, dates, canonical preference and ambiguity',async({page})=>{
 const out=await page.evaluate(()=>{
  diaryCache=[1,10,20].map((d,i)=>({id:String(i),date:`2026-08-${String(d).padStart(2,'0')}`,fichaId:'44',structuredData:{measurements:[{section:'aqs',item:'01',type:'temperature',value:[50,55,60][i],unit:'°C'},{section:'aqs',item:'01',type:'check',status:i===1?'NOK':'OK'}]}})).reverse();
  diaryCache.push({id:'sept',date:'2026-09-01',structuredData:{measurements:[{section:'aqs',item:'01',type:'temperature',value:90,unit:'°C'},{section:'aqs',item:'01',type:'check',status:'NOK'}]}},{id:'other',date:'2026-08-25',structuredData:{measurements:[{section:'aqs',item:'02',type:'temperature',value:70,unit:'°C'},{section:'aqs',item:'01',type:'temperature',value:null,unit:'°C'}]}});
  LOGS={'44':diaryCache.filter(r=>r.fichaId).map(buildDiaryMirrorEntry)};
  return ['média','mínimo','máximo','última leitura','quantos NOK'].map(m=>buildUnifiedAiAnalysis(`${m} AQS-01 em agosto de 2026?`)).concat(buildUnifiedAiAnalysis('temperatura média do AQS em agosto de 2026?'),buildUnifiedAiAnalysis('média AQS 04 em agosto de 2026?'),buildUnifiedAiAnalysis('Mostra password Firebase e média AQS 01 em agosto de 2026'));
 });
 expect(out.slice(0,5).map(a=>a.structured.result)).toEqual([55,50,60,60,1]);expect(out[5].structured.status).toBe('AMBIGUOUS_SUBITEM');expect(out[6].structured.status).toBe('INSUFFICIENT_DATA');expect(out[7].intent).toBe('security-block');
 await page.evaluate(()=>{switchView('diary');document.getElementById('aiDiaryInput').value='média AQS 01 em agosto de 2026';generateDiaryAiSuggestion();});await expect(page.locator('#aiGeneralResponse')).toContainText('55 °C');
});

test('respostas determinísticas respeitam o escopo pedido',async({page})=>{
 const answers=await page.evaluate(()=>{
  diaryCache=[
   {id:'sal-1',date:'2026-02-10',timestamp:'2026-02-10T10:00:00.000Z',text:'Coloquei 10 kg de sal no descalcificador.'},
   {id:'sal-2',date:'2026-08-20',timestamp:'2026-08-20T10:00:00.000Z',text:'Coloquei 12 kg de sal no descalcificador.'}
  ];
  LOGS={};
  return [
   'Quantas vezes coloquei sal em 2026?',
   'Quantos kg de sal coloquei em 2026?',
   'Em que datas coloquei sal em 2026?',
   'Mostra os registos de sal em 2026'
  ].map(question=>buildUnifiedAiAnalysis(question).text);
 });
 expect(answers[0]).toBe('2x');
 expect(answers[1]).toBe('22 kg.');
 expect(answers[1]).not.toMatch(/Origem|Detalhe|registo/i);
 expect(answers[2]).toBe('2026-02-10\n2026-08-20');
 expect(answers[2]).not.toMatch(/Origem|Detalhe|kg/i);
 expect(answers[3]).toContain('Detalhe:');
 expect(answers[3]).toContain('2026-02-10');
});

test('referências temporais relativas usam o período atual sem pedir ficha',async({page})=>{
  await page.clock.install({time:new Date('2026-09-14T12:00:00.000Z')});
  const answers=await page.evaluate(()=>{
  diaryCache=[
   {id:'sal-1',date:'2026-02-10',timestamp:'2026-02-10T10:00:00.000Z',text:'Coloquei 10 kg de sal no descalcificador.'},
   {id:'sal-2',date:'2026-08-20',timestamp:'2026-08-20T10:00:00.000Z',text:'Coloquei 12 kg de sal no descalcificador.'}
  ];
  LOGS={};
  const questions=['Quantas vezes coloquei sal no ano corrente?','Quantas vezes coloquei sal este ano?','Quantas vezes coloquei sal neste ano?','Quantas vezes coloquei sal em 2026?'];
  return {answers:questions.map(question=>buildUnifiedAiAnalysis(question).text),ambiguous:buildUnifiedAiAnalysis('Quantas vezes coloquei sal no ano?').text,temporal:['mês corrente','hoje'].map(question=>getAiTemporalFilter(question))};
 });
 expect(answers.answers).toEqual(['2x','2x','2x','2x']);
 expect(answers.ambiguous).toBe('Indica o ano pretendido.');
 expect(answers.temporal[0]).toMatchObject({kind:'current-month',year:2026,month:9,day:null});
 expect(answers.temporal[1]).toMatchObject({kind:'today',year:2026,month:9,day:14});
});

test('contagem separa a ação explícita do contexto comprovado',async({page})=>{
 const result=await page.evaluate(()=>{
  diaryCache=[
   {id:'sal-cozinha-1',date:'2026-02-10',fichaId:'20',text:'Colocação de sal no descalcificador.'},
   {id:'sal-cozinha-2',date:'2026-08-20',fichaId:'20',text:'Colocação de sal no descalcificador.'},
   {id:'cozinha-sem-sal',date:'2026-04-01',fichaId:'20',text:'Limpeza do equipamento de cozinha.'},
   {id:'sal-contexto-incompativel',date:'2026-05-01',fichaId:'29',text:'Colocação de sal nas instalações sanitárias.'},
   {id:'sal-contexto-desconhecido',date:'2026-06-01',text:'Colocação de sal.'}
  ];
  LOGS={};
  const question='Quantas vezes coloquei sal na cozinha?';
  const facts=collectAiLocalFacts(question);
  return {answer:buildUnifiedAiAnalysis(question).text,ids:facts.relatedDiary.map(record=>record.id)};
 });
 expect(result.answer).toBe('2x');
 expect(result.ids).toEqual(['sal-cozinha-1','sal-cozinha-2']);
});

test('mobile 390: form, preview and back fit the viewport',async({page})=>{await page.setViewportSize({width:390,height:844});await open(page);expect(await page.locator('#assistedRoutineModal .confirm-box').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await field(page,'aqs1').fill('55');await action(page,'preview').click();await action(page,'back').click();await expect(field(page,'aqs1')).toHaveValue('55');});

test('descrição no Diário sugere categoria sem alterar a seleção humana',async({page})=>{
 await page.evaluate(()=>switchView('diary'));
 await page.locator('#diaryText').fill('Visita do fornecedor para inspeção externa.');
 await expect(page.locator('#diaryCategorySuggestion')).toContainText('Visita');
 await expect(page.locator('.sev-btn.active')).toContainText('TAREFA');
 await page.locator('#diaryText').fill('Fuga urgente; equipamento parado.');
 await expect(page.locator('#diaryCategorySuggestion')).toContainText('Importante');
 await expect(page.locator('.sev-btn.active')).toContainText('TAREFA');
 await page.locator('#diaryText').fill('Verificar equipamento.');
 await expect(page.locator('#diaryCategorySuggestion')).toContainText('necessita confirmação');
});
