import {analyzeWithWorkersAi} from '../src/photo-ai-provider.js';
import {FREE_MODEL} from '../src/config.js';

const SUMMARY_KEYS=['outcome','stage','elapsedMs','aiCallStarted','aiCallCompleted','responseReceived','responseType','providerExtractionValid','contractV2Valid','analyzeOk','errorClass'];
const timeoutError=()=>Object.assign(Error('Integration timeout.'),{photoAiStage:'INTEGRATION_TIMEOUT',integrationTimeout:true});
const safeErrorClass=error=>{
  if(error?.integrationTimeout)return 'TIMEOUT';
  const stage=error?.photoAiStage;
  if(['AI_CALL_FAILED','AI_EMPTY_RESPONSE','AI_JSON_PARSE_FAILED','AI_OUTPUT_TRUNCATED','PROVIDER_EXTRACTION_FAILED','CONTRACT_V2_FAILED','IMAGE_DECODE_FAILED','IMAGE_PREPARATION_FAILED'].includes(stage))return stage;
  return 'UNEXPECTED';
};
const responseType=value=>value===null?'null':Array.isArray(value)?'array':typeof value;

export function printSanitizedSummary(summary,write=process.stdout.write.bind(process.stdout)){
  const safe=Object.fromEntries(SUMMARY_KEYS.map(key=>[key,summary[key]??null]));
  write('PMP_PHOTO_AI_SUMMARY='+JSON.stringify(safe)+'\n');
  return safe;
}

export async function persistSanitizedSummary(summary,writeFile,path){
  const safe=Object.fromEntries(SUMMARY_KEYS.map(key=>[key,summary[key]??null]));
  await writeFile(path,JSON.stringify(safe)+'\n',{encoding:'utf8'});
  return safe;
}

function withTimeout(task,timeoutMs){
  let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(timeoutError()),timeoutMs);});
  return Promise.race([task,timeout]).finally(()=>clearTimeout(timer));
}

async function dispose(platform){
  if(!platform?.dispose)return;
  try{await Promise.race([platform.dispose(),new Promise(resolve=>setTimeout(resolve,5000))]);}catch{}
}

export async function runRealIntegration({loadPlatform,readImage,analyze=analyzeWithWorkersAi,timeoutMs=185000,now=Date.now}){
  const started=now();
  let platform=null,image=null,result=null,stage='SETUP';
  let aiCallStarted=false,aiCallCompleted=false,responseReceived=false,responseTypeValue=null;
  let providerExtractionValid=false,contractV2Valid=false,errorClass=null,outcome='ERROR';
  try{
    await withTimeout((async()=>{
      platform=await loadPlatform();
      if(platform?.env?.PHOTO_AI_FREE_ONLY!=='true')throw Object.assign(Error('Free-only required.'),{photoAiStage:'CONFIGURATION'});
      image=await readImage();
      if(typeof image!=='string'||!image)throw Object.assign(Error('Fixture unavailable.'),{photoAiStage:'FIXTURE'});
      const ai={run:async(model,payload)=>{
        if(model!==FREE_MODEL)throw Object.assign(Error('Unexpected model.'),{photoAiStage:'MODEL'});
        aiCallStarted=true;
        const response=await platform.env.AI.run(model,payload);
        aiCallCompleted=true;
        responseReceived=true;
        responseTypeValue=responseType(response?.response);
        return response;
      }};
      result=await analyze({ai,model:FREE_MODEL,image,mime:'image/png',context:{fichaId:'synthetic',equipment:'',week:''},onStage:value=>{stage=value;}});
      providerExtractionValid=stage==='ANALYZE_OK';
      contractV2Valid=Boolean(result?.data?.schemaVersion===2);
      outcome=contractV2Valid?'SUCCESS':'ERROR';
    })(),timeoutMs);
  }catch(error){
    stage=error?.photoAiStage||stage;
    errorClass=safeErrorClass(error);
    outcome=errorClass==='TIMEOUT'?'TIMEOUT':'ERROR';
  }finally{
    image=null;
    await dispose(platform);
    result=null;
  }
  return {outcome,stage,elapsedMs:Math.max(0,now()-started),aiCallStarted,aiCallCompleted,responseReceived,responseType:responseTypeValue,providerExtractionValid,contractV2Valid,analyzeOk:outcome==='SUCCESS'&&stage==='ANALYZE_OK',errorClass};
}
