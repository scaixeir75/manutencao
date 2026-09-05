'use strict';
const http=require('node:http');
const {createHash,randomUUID}=require('node:crypto');
const {fail,abortable,readConfig,parseInput,normalizeImage,analyze}=require('./core');
function safeReason(status){return ({200:'completed',204:'preflight',400:'invalid_request',401:'unauthenticated',403:'unauthorized',413:'request_too_large',415:'invalid_image',429:'rate_limited',502:'provider_failed',503:'disabled_or_unavailable',504:'timeout'})[status]||'internal_error';}
function createHandler({config,verifyToken,acquire,normalize,provider,timeoutMs=45000,logger=()=>{}}){
  return async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.setHeader('Vary','Origin');
    const send=(status,data)=>{if(!res.destroyed&&!res.writableEnded){res.writeHead(status);res.end(JSON.stringify(data));}};
    const requestId=randomUUID(),started=Date.now();let uidHash=null,status=500,release,buffer,image;const chunks=[];const controller=new AbortController();
    const timer=setTimeout(()=>{controller.abort();send(504,{error:'Tempo de análise excedido.'});},timeoutMs);
    res.on('close',()=>{if(!res.writableEnded)controller.abort();});
    try{
      if(req.url!=='/v1/photo-ai/analyze')throw fail(404,'Não encontrado.');
      if(!config.origins.includes(req.headers.origin))throw fail(403,'Origem não autorizada.');
      res.setHeader('Access-Control-Allow-Origin',req.headers.origin);
      if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','POST');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');status=204;send(status,{});return;}
      if(req.method!=='POST')throw fail(405,'Método inválido.');
      if(!config.enabled)throw fail(503,'Análise automática desativada.');
      const token=/^Bearer (\S+)$/.exec(req.headers.authorization||'');
      if(!token)throw fail(401,'Inicia sessão para analisar.');
      let user;try{user=await abortable(verifyToken(token[1]),controller.signal);}catch{throw fail(401,'Sessão inválida.');}
      if(!config.uids.includes(user.uid))throw fail(403,'Utilizador não autorizado.');
      uidHash=createHash('sha256').update(user.uid).digest('hex');
      if(req.headers['content-type']!=='application/json')throw fail(415,'Formato inválido.');
      if(Number(req.headers['content-length'])>12*1024*1024)throw fail(413,'Imagem demasiado grande.');
      release=await abortable(acquire(user.uid).then(async value=>{if(controller.signal.aborted){await value?.();return null;}return value;}),controller.signal);
      if(!release)throw fail(429,'Limite de análises atingido. Tenta mais tarde.');
      let size=0;
      await abortable((async()=>{for await(const chunk of req){if(controller.signal.aborted)break;size+=chunk.length;if(size>12*1024*1024)throw fail(413,'Imagem demasiado grande.');chunks.push(chunk);}})(),controller.signal);
      buffer=Buffer.concat(chunks);chunks.forEach(c=>c.fill(0));chunks.length=0;
      const input=parseInput(buffer.toString('utf8'));buffer.fill(0);buffer=input.buffer;
      image=await abortable(normalize(buffer,input.mime).then(value=>{if(controller.signal.aborted){value.fill(0);throw fail(504,'Tempo de análise excedido.');}return value;}),controller.signal);buffer.fill(0);buffer=null;
      if(controller.signal.aborted)throw fail(504,'Tempo de análise excedido.');
      const result=await abortable(provider({image,context:input.context,signal:controller.signal,config}),controller.signal);
      if(!controller.signal.aborted){status=200;send(status,result);}
    }catch(error){status=controller.signal.aborted?504:(error.status||503);send(status,{error:error.status?error.message:'Análise indisponível.'});}
    finally{
      clearTimeout(timer);chunks.forEach(c=>c.fill(0));chunks.length=0;buffer?.fill(0);image?.fill(0);if(release)await release().catch(()=>{});
      if(config.observability)logger({requestId,uidHash,status,durationMs:Date.now()-started,reason:safeReason(status)});
    }
  };
}
async function main(){
  const config=readConfig(process.env);
  let verifyToken,acquire;
  if(config.enabled){
    const {initializeApp,applicationDefault}=require('firebase-admin/app');const {getAuth}=require('firebase-admin/auth');
    initializeApp({credential:applicationDefault(),projectId:config.projectId});
    verifyToken=token=>getAuth().verifyIdToken(token,true);
    const redis=require('redis').createClient({url:process.env.REDIS_URL});redis.on('error',()=>{});await redis.connect();
    acquire=require('./quota').quota(redis);
  }
  const sharp=require('sharp');sharp.cache(false);
  const logger=entry=>console.info(JSON.stringify({event:'photo_ai_request',...entry}));
  const server=http.createServer(createHandler({config,verifyToken,acquire,normalize:(b,m)=>normalizeImage(b,m,sharp),provider:analyze,logger}));
  server.requestTimeout=50000;server.headersTimeout=10000;
  server.listen(Number(process.env.PORT||8080),'0.0.0.0');
}
if(require.main===module)main().catch(()=>{console.error('Não foi possível iniciar o serviço PHOTO-AI. Verifica a configuração.');process.exitCode=1;});
module.exports={safeReason,createHandler};
