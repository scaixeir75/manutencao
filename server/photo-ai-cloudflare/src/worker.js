import {readConfig} from './config.js';
import {verifyFirebaseIdToken} from './firebase-id-token.js';
import {PhotoAiRateLimiter} from './rate-limiter-do.js';
import {analyzeWithWorkersAi} from './photo-ai-provider.js';

const MAX_BYTES=8*1024*1024, MAX_REQUEST_BYTES=12*1024*1024;
function error(status,message){return Object.assign(new Error(message),{status});}
function response(status,data,origin){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','vary':'Origin',...(origin?{'access-control-allow-origin':origin}: {})}});}
function allowedOrigin(request,config){const origin=request.headers.get('origin');return config.origins.includes(origin)?origin:null;}
function getToken(request){const match=/^Bearer (\S+)$/.exec(request.headers.get('authorization')||'');if(!match)throw error(401,'Inicia sessão para analisar.');return match[1];}
function parseInput(data){
  if(!data||Object.keys(data).sort().join(',')!=='context,image,mime'||!['image/jpeg','image/png','image/webp'].includes(data.mime)||typeof data.image!=='string'||!data.image.length||data.image.length%4||/[^A-Za-z0-9+/=]/.test(data.image))throw error(415,'Imagem inválida.');
  if(data.image.length>Math.ceil(MAX_BYTES/3)*4)throw error(413,'Imagem demasiado grande.');
  const decoded=Math.floor(data.image.replace(/=+$/,'').length*3/4);if(decoded>MAX_BYTES)throw error(413,'Imagem demasiado grande.');
  const context=data.context;if(!context||Object.keys(context).sort().join(',')!=='equipment,fichaId,week'||Object.values(context).some(value=>typeof value!=='string'||value.length>200))throw error(400,'Contexto inválido.');
  return {image:data.image,mime:data.mime,context};
}
function withTimeout(promise,controller,timeoutMs){let timer;const cancelled=new Promise((_,reject)=>{const abort=()=>reject(error(504,'Tempo de análise excedido.'));if(controller.signal.aborted)abort();else controller.signal.addEventListener('abort',abort,{once:true});});return Promise.race([promise,cancelled,new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(error(504,'Tempo de análise excedido.'));},timeoutMs);})]).finally(()=>clearTimeout(timer));}
function safeLog(config,entry){if(config.observability)console.info(JSON.stringify({event:'photo_ai_request',requestId:entry.requestId,uidHash:entry.uidHash||null,status:entry.status,durationMs:entry.durationMs,reason:entry.reason}));}
async function uidHash(uid){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(uid));return [...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,'0')).join('');}

export default {
  async fetch(request,env){
    let config,origin,uidHashValue=null,status=500,release=null;
    const requestId=crypto.randomUUID(),started=Date.now(),controller=new AbortController();
    const abort=()=>controller.abort();request.signal.addEventListener('abort',abort,{once:true});
    try{
      config=readConfig(env);origin=allowedOrigin(request,config);if(!origin)throw error(403,'Origem não autorizada.');
      if(new URL(request.url).pathname!=='/v1/photo-ai/analyze')throw error(404,'Não encontrado.');
      if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':origin,'access-control-allow-methods':'POST','access-control-allow-headers':'Authorization, Content-Type','access-control-max-age':'600','vary':'Origin'}});
      if(request.method!=='POST')throw error(405,'Método inválido.');
      if(!config.enabled)throw error(503,'Análise automática desativada.');
      if(Number(request.headers.get('content-length')||0)>MAX_REQUEST_BYTES)throw error(413,'Imagem demasiado grande.');
      const user=await verifyFirebaseIdToken(getToken(request),{projectId:config.projectId,fetchImpl:env.__testKeyFetch||fetch});
      if(!config.uids.includes(user.uid))throw error(403,'Utilizador não autorizado.');
      uidHashValue=await uidHash(user.uid);
      const body=await request.text();if(new TextEncoder().encode(body).byteLength>MAX_REQUEST_BYTES)throw error(413,'Imagem demasiado grande.');
      const input=parseInput(JSON.parse(body));
      const id=env.PHOTO_AI_RATE_LIMITER.idFromName(uidHashValue),stub=env.PHOTO_AI_RATE_LIMITER.get(id);
      const lock=await stub.acquire();if(!lock)throw error(429,'Limite de análises atingido. Tenta mais tarde.');
      release=()=>stub.release(lock);
      const result=await withTimeout(analyzeWithWorkersAi({ai:env.AI,model:config.model,...input,signal:controller.signal}),controller,config.timeoutMs);
      status=200;return response(status,result,origin);
    }catch(cause){
      status=controller.signal.aborted?504:(cause.status||503);
      return response(status,{error:cause.status?cause.message:'Análise indisponível.'},origin);
    }finally{
      request.signal.removeEventListener('abort',abort);
      if(release)await release().catch(()=>{});
      if(config)safeLog(config,{requestId,uidHash:uidHashValue,status,durationMs:Date.now()-started,reason:status===200?'completed':status===429?'rate_limited':status===504?'timeout':'failed'});
    }
  }
};
export {PhotoAiRateLimiter,MAX_BYTES,MAX_REQUEST_BYTES,parseInput};
