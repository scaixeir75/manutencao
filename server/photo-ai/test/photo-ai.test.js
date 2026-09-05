const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const sharp=require('sharp');
const {validate,names}=require('../../../photo-ai-contract');
const {readConfig,parseInput,normalizeImage,analyze}=require('../core');
const {safeReason,createHandler}=require('../server');
const {quota}=require('../quota');
const context={fichaId:'41',equipment:'Quadros Eléctricos',week:'36'};
const field=(value,confidence='Reconhecido')=>({value,confidence,evidence:value,reason:confidence==='Duvidoso'?'Letra pouco legível.':''});
function result(){return {schemaVersion:1,fields:Object.fromEntries(names.map(n=>[n,field(({date:'2026-09-05',status:'Concluído',equipment:context.equipment})[n]||'Verificação executada')])),warnings:[]};}
const envelope=data=>new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(data)}]}]}));
test('contrato: completo, em falta e duvidoso; rejeita invenções e datas impossíveis',()=>{
  assert.equal(validate(result()).schemaVersion,1);
  const data=result();data.fields.notes={value:null,confidence:'Não confirmado',evidence:null,reason:'Campo ausente.'};data.fields.work=field('Limpeza','Duvidoso');assert.equal(validate(data).fields.work.confidence,'Duvidoso');
  data.fields.date.value='2026-02-30';assert.throws(()=>validate(data));
  data.fields.date=field('2026-09-05');data.fields.work.evidence=null;assert.throws(()=>validate(data));
  data.extra=true;assert.throws(()=>validate(data));
});
test('retenção bloqueada por defeito; produção não aceita modo de teste',()=>{
  assert.equal(readConfig({}).enabled,false);
  const env={PHOTO_AI_ENABLED:'true',PHOTO_AI_RETENTION:'limited-test-verified',OPENAI_MODEL:'test-model',OPENAI_API_KEY:'synthetic-test-only',FIREBASE_PROJECT_ID:'test-project',PHOTO_AI_ORIGINS:'http://localhost',PHOTO_AI_UIDS:'test-user',REDIS_URL:'redis://localhost'};
  assert.throws(()=>readConfig(env));assert.equal(readConfig({...env,NODE_ENV:'development'}).enabled,true);
  assert.equal(readConfig({...env,PHOTO_AI_RETENTION:'zdr-verified'}).enabled,true);
  assert.throws(()=>readConfig({...env,NODE_ENV:'development',OPENAI_API_KEY:''}));
});
test('imagem: descodifica PNG, remove metadados, rejeita MIME falso, SVG e excesso de píxeis',async()=>{
  const png=await sharp({create:{width:10,height:10,channels:3,background:'white'}}).png().withMetadata().toBuffer();
  const parsed=parseInput(JSON.stringify({image:png.toString('base64'),mime:'image/png',context}));
  const normalized=await normalizeImage(parsed.buffer,parsed.mime,sharp);const meta=await sharp(normalized).metadata();assert.equal(meta.format,'jpeg');assert.equal(meta.exif,undefined);
  await assert.rejects(normalizeImage(png,'image/jpeg',sharp));
  await assert.rejects(normalizeImage(Buffer.from('<svg/>'),'image/png',sharp));
  const huge=await sharp({create:{width:5000,height:4001,channels:3,background:'white'}}).png().toBuffer();await assert.rejects(normalizeImage(huge,'image/png',sharp));
  assert.throws(()=>parseInput(JSON.stringify({image:'!',mime:'image/png',context})));
  assert.throws(()=>parseInput(JSON.stringify({image:Buffer.alloc(8*1024*1024+1).toString('base64'),mime:'image/png',context})));
});
test('adaptador OpenAI: apenas fetch simulado, store false, JSON estrito e sem ferramentas',async()=>{
  let request;
  const data=await analyze({image:Buffer.from('synthetic'),context,signal:new AbortController().signal,config:{model:'test-model',key:'synthetic-test-only'},fetchImpl:async(url,options)=>{request=JSON.parse(options.body);assert.equal(url,'https://api.openai.com/v1/responses');return envelope(result());}});
  assert.equal(data.schemaVersion,1);assert.equal(request.store,false);assert.equal(request.background,false);assert.equal(request.text.format.strict,true);assert.equal(request.tools,undefined);
  for(const response of [new Response('bad json'),new Response('{}'),new Response('',{status:500}),envelope({invalid:true}),new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'refusal'}]}]}))]){
    await assert.rejects(analyze({image:Buffer.from('synthetic'),context,config:{},fetchImpl:async()=>response}),e=>e.status===502);
  }
});
async function fixture(t,overrides={}){
  let releases=0,calls=0,captured;const logs=[];
  const config={enabled:true,origins:['http://pmp.test'],uids:['user']};
  const server=http.createServer(createHandler({config,verifyToken:async token=>{if(token!=='valid')throw Error();return {uid:'user'};},acquire:async()=>async()=>{releases++;},normalize:async b=>Buffer.from(b),provider:async args=>{calls++;captured=args.image;return result();},logger:entry=>logs.push(entry),...overrides}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  return {url:`http://127.0.0.1:${server.address().port}/v1/photo-ai/analyze`,state:()=>({releases,calls,captured,logs})};
}
const headers={Origin:'http://pmp.test',Authorization:'Bearer valid','Content-Type':'application/json'};
const body=JSON.stringify({image:Buffer.from('synthetic').toString('base64'),mime:'image/png',context});
test('proxy HTTP: sucesso e limpeza dos buffers; nunca escreve no PMP',async t=>{
  const f=await fixture(t);const response=await fetch(f.url,{method:'POST',headers,body});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');validate(await response.json());
  assert.equal(f.state().calls,1);assert.equal(f.state().releases,1);assert(f.state().captured.every(b=>b===0));
});
test('observabilidade: só dados seguros e motivo genérico',async t=>{
  const f=await fixture(t,{config:{enabled:true,observability:true,origins:['http://pmp.test'],uids:['user']}});
  const response=await fetch(f.url,{method:'POST',headers,body});assert.equal(response.status,200);
  const log=f.state().logs[0];assert.equal(log.status,200);assert.equal(log.reason,'completed');assert.match(log.requestId,/^[0-9a-f-]{36}$/);assert.match(log.uidHash,/^[0-9a-f]{64}$/);assert.equal(typeof log.durationMs,'number');
  assert.doesNotMatch(JSON.stringify(log),/synthetic|base64|authorization|valid|Quadros/i);assert.equal(safeReason(429),'rate_limited');
});
test('proxy: autenticação, autorização, flag, quota, tipo e corpo inválidos',async t=>{
  for(const [overrides,requestHeaders,input,status] of [
    [{},{...headers,Authorization:''},body,401],
    [{},{...headers,Authorization:'Bearer invalid'},body,401],
    [{verifyToken:async()=>({uid:'stranger'})},headers,body,403],
    [{},{...headers,Origin:'https://stranger.test'},body,403],
    [{config:{enabled:false,origins:['http://pmp.test'],uids:['user']}},headers,body,503],
    [{acquire:async()=>null},headers,body,429],
    [{},{...headers,'Content-Type':'image/svg+xml'},body,415],
    [{},headers,'not json',400],
    [{},headers,JSON.stringify({image:'!',mime:'image/png',context}),415]
  ]){const f=await fixture(t,overrides);const response=await fetch(f.url,{method:'POST',headers:requestHeaders,body:input});assert.equal(response.status,status);assert.equal(f.state().calls,0);}
});
test('proxy: erro de rede, timeout do fornecedor e timeout durante autenticação',async t=>{
  for(const overrides of [{provider:async()=>{throw Error('secret internal error');}},{provider:async()=>new Promise(()=>{}),timeoutMs:40},{verifyToken:async()=>new Promise(()=>{}),timeoutMs:40}]){
    const f=await fixture(t,overrides);const response=await fetch(f.url,{method:'POST',headers,body});assert.equal(response.status,overrides.timeoutMs?504:503);assert(!JSON.stringify(await response.json()).includes('secret'));
  }
});
test('proxy: cancelamento aborta fornecedor e limpa imagem',async t=>{
  let captured,aborted=false,started;const ready=new Promise(r=>started=r);
  const f=await fixture(t,{provider:async({image,signal})=>{captured=image;started();return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(Error());},{once:true}));}});
  const controller=new AbortController();const pending=fetch(f.url,{method:'POST',headers,body,signal:controller.signal}).catch(()=>{});await ready;controller.abort();await pending;
  for(let i=0;i<30&&!aborted;i++)await new Promise(r=>setTimeout(r,10));assert(aborted);assert(captured.every(b=>b===0));
});
test('quota: operação atómica com três chaves e libertação condicionada pelo token',async()=>{
  const calls=[];const redis={eval:async(script,args)=>{calls.push({script,args});return 1;}};const release=await quota(redis)('user');await release();
  assert.equal(calls[0].args.keys.length,3);assert(calls[0].script.includes('>=5'));assert(calls[0].script.includes('>=50'));assert(calls[0].script.includes("'EX',90"));assert.equal(calls[1].args.arguments[0],calls[0].args.arguments[0]);
  assert.equal(await quota({eval:async()=>0})('user'),null);
});
