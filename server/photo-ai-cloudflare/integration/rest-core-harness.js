import {analyzeWithWorkersAi} from '../src/photo-ai-provider.js';
import {FREE_MODEL} from '../src/config.js';
import {providerExtractionV2Fingerprint} from '../src/provider-extraction-v2.js';
import {mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const keys=['outcome','httpStatus','cloudflareCode','elapsedMs','responseReceived','responseType','providerExtractionValid','contractV2Valid','analyzeOk','errorClass','providerFingerprint'];
const timeoutError=()=>Object.assign(Error('REST timeout.'),{restTimeout:true,photoAiStage:'REST_TIMEOUT'});
const cleanCode=value=>Number.isInteger(value)&&value>=1000&&value<=9999?value:null;
const responseType=value=>value===null?'null':Array.isArray(value)?'array':typeof value;
const errorClass=error=>error?.restTimeout?'TIMEOUT':error?.photoAiStage==='AI_CALL_FAILED'?'REST_PROVIDER_FAILED':error?.photoAiStage||'UNEXPECTED';

export function sanitizedReceipt(summary){return Object.fromEntries(keys.map(key=>[key,summary[key]??null]));}
function withTimeout(task,timeoutMs,controller){let timer;const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(timeoutError());},timeoutMs);});return Promise.race([task,timeout]).finally(()=>clearTimeout(timer));}
const defaultReceiptPath=fileURLToPath(new URL('./.tmp/rest-core-receipt.json',import.meta.url));
function writeReceiptSync(path,value){mkdirSync(dirname(path),{recursive:true});const temp=join(dirname(path),`.${value.stage}-${process.pid}.tmp`);writeFileSync(temp,JSON.stringify(value)+'\n',{encoding:'utf8'});renameSync(temp,path);}

export async function runRestCore({credentials,readImage,request,timeoutMs=90000,now=Date.now,analyze=analyzeWithWorkersAi,receiptPath=defaultReceiptPath,model=FREE_MODEL}){
  const started=now();const controller=new AbortController();
  let image=null,stage='SETUP',httpStatus=null,cloudflareCode=null,responseReceived=false,responseTypeValue=null,providerExtractionValid=false,contractV2Valid=false,outcome='ERROR',failure=null,providerFingerprint=null;
  const persist=nextStage=>{stage=nextStage;writeReceiptSync(receiptPath,{stage,timestamp:new Date(now()).toISOString(),elapsedMs:Math.max(0,now()-started),httpStatus,cloudflareCode,responseReceived,responseType:responseTypeValue,providerExtractionValid,contractV2Valid,analyzeOk:stage==='ANALYZE_OK',errorClass:null,providerFingerprint});};
  persist('STARTED');
  try{
    const auth=await credentials();
    if(!auth?.accountId||!auth?.token)throw Object.assign(Error('Authentication unavailable.'),{photoAiStage:'AUTH'});
    persist('AUTH_READY');
    image=await readImage();
    if(typeof image!=='string'||!image)throw Object.assign(Error('Fixture unavailable.'),{photoAiStage:'FIXTURE'});
    const ai={run:async(requestedModel,payload)=>{
      if(requestedModel!==model)throw Object.assign(Error('Unexpected model.'),{photoAiStage:'MODEL'});
      persist('PAYLOAD_READY');
      const markFetchStarted=()=>persist('FETCH_STARTED');
      const reply=await request({accountId:auth.accountId,token:auth.token,model:requestedModel,payload,signal:controller.signal,onFetchStarted:markFetchStarted});
      httpStatus=Number.isInteger(reply?.status)?reply.status:null;
      cloudflareCode=cleanCode(reply?.cloudflareCode);
      persist('HTTP_RECEIVED');
      let envelope=reply;
      if(reply?.response&&typeof reply.response.json==='function')envelope=await reply.response.json();
      const first=Array.isArray(envelope?.errors)?envelope.errors[0]:null;
      cloudflareCode=cloudflareCode??cleanCode(first?.code);
      persist('BODY_PARSED');
      if(httpStatus===null||httpStatus<200||httpStatus>=300||envelope?.success!==true)throw Object.assign(Error('Cloudflare request failed.'),{status:httpStatus,code:cloudflareCode});
      responseReceived=true;
      responseTypeValue=responseType(envelope?.result?.response);
      providerFingerprint=providerExtractionV2Fingerprint(envelope?.result?.response);
      return envelope.result;
    }};
    const result=await withTimeout(analyze({ai,model,image,mime:'image/png',context:{fichaId:'synthetic',equipment:'',week:''},onStage:value=>{if(value==='PROVIDER_EXTRACTION_OK'){providerExtractionValid=true;persist('PROVIDER_VALID');}if(value==='ANALYZE_OK'){contractV2Valid=true;persist('CONTRACT_V2_VALID');persist('ANALYZE_OK');}else stage=value;}}),timeoutMs,controller);
    providerExtractionValid=providerExtractionValid||stage==='ANALYZE_OK';
    contractV2Valid=result?.data?.schemaVersion===2;
    outcome=contractV2Valid?'SUCCESS':'ERROR';
  }catch(error){failure=error;stage=error?.photoAiStage||stage;outcome=error?.restTimeout?'TIMEOUT':'ERROR';writeReceiptSync(receiptPath,{stage:'FAILED',timestamp:new Date(now()).toISOString(),elapsedMs:Math.max(0,now()-started),httpStatus,cloudflareCode,responseReceived,responseType:responseTypeValue,providerExtractionValid,contractV2Valid,analyzeOk:false,errorClass:errorClass(error),providerFingerprint});}
  finally{image=null;controller.abort();}
  const receipt=sanitizedReceipt({outcome,httpStatus,cloudflareCode,elapsedMs:Math.max(0,now()-started),responseReceived,responseType:responseTypeValue,providerExtractionValid,contractV2Valid,analyzeOk:outcome==='SUCCESS'&&contractV2Valid,errorClass:failure?errorClass(failure):null,providerFingerprint});
  writeReceiptSync(receiptPath,{stage:receipt.analyzeOk?'ANALYZE_OK':'FAILED',timestamp:new Date(now()).toISOString(),...receipt});
  return receipt;
}
