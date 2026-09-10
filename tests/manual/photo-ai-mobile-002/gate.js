import {fields,extraction,score} from './gate-core.js';
import {mapLocalExtractionToContract} from './local-contract.js';
import {transition} from './session-state.js';
const status=document.querySelector('#status'),fileInput=document.querySelector('#file');
const cacheName='pmp-mobile002-smolvlm256-v1';
let model,processor,RawImage,busy=false,generation=0,sessionState='RUNTIME_READY',analysisStage='FILE_ACCEPTED';
const say=text=>{status.textContent=text;};
const safeError=error=>{const message=String(error?.message||error||'unknown error').replace(/https?:\/\/[^\s"']+/g,'[public asset URL]');return message.slice(0,320);};
const progress=(stage,detail='')=>say(`MODEL_LOAD stage: ${stage}${detail?` — ${detail}`:''}`);
const adapter=navigator.gpu?await navigator.gpu.requestAdapter():null;
const loadButton=document.querySelector('#load');
let runtime,runtimeReady=false;
loadButton.disabled=true;
if(!adapter?.features.has('shader-f16')) say('RUNTIME_FAILED\nstage: WEBGPU\nerror: WEBGPU_SHADER_F16_UNAVAILABLE');
else try{
  say('RUNTIME — a carregar Transformers.js 3.8.1…');
  // The +esm browser distribution avoids bare onnxruntime-common imports.
  runtime=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm');
  if(!runtime?.env?.backends?.onnx) throw new Error('ONNX_BACKEND_UNAVAILABLE');
  runtimeReady=true;loadButton.disabled=false;
  say('Runtime: OK\nTransformers.js: 3.8.1\nWebGPU: disponível\nONNX backend: configurado\nModelo: ainda não descarregado');
}catch(error){say(`RUNTIME_FAILED\nstage: RUNTIME\nerror: ${safeError(error)}`);}
document.querySelector('#load').onclick=async()=>{
  if(!runtimeReady||busy||model)return;busy=true;sessionState=transition(sessionState,'MODEL_LOADING');const id=++generation;progress('CONFIG');
  try{
    if(!adapter?.features.has('shader-f16'))throw new Error('WEBGPU_SHADER_F16_UNAVAILABLE');
    progress('RUNTIME');
    const lib=runtime;
    lib.env.useBrowserCache=false;lib.env.useCustomCache=true;
    const cache=await caches.open(cacheName);
    lib.env.customCache={match:r=>cache.match(r),put:(r,v)=>{const url=new URL(String(r));const allowed=url.hostname==='huggingface.co'||url.hostname.endsWith('.huggingface.co')||url.hostname.endsWith('.hf.co')||url.hostname.endsWith('.xethub.hf.co')||url.hostname.endsWith('.cas-bridge.xethub.hf.co')||url.hostname==='cdn.jsdelivr.net';if(!allowed)throw Error('CACHE_SCOPE');return cache.put(r,v);}};
    RawImage=lib.RawImage;
    progress('PROCESSOR');
    processor=await lib.AutoProcessor.from_pretrained('HuggingFaceTB/SmolVLM-256M-Instruct');
    progress('WEIGHTS');
    const loaded=await lib.AutoModelForVision2Seq.from_pretrained('HuggingFaceTB/SmolVLM-256M-Instruct',{device:'webgpu',dtype:{embed_tokens:'fp16',vision_encoder:'fp16',decoder_model_merged:'q4f16'}});
    if(id!==generation){await loaded.dispose();return;}model=loaded;sessionState=transition(sessionState,'MODEL_READY');fileInput.disabled=false;say('Modelo carregado. Seleciona exclusivamente a fixture sintética.');
  }catch(error){sessionState=transition(sessionState,'RUNTIME_READY');say(`MODEL_LOAD_FAILED\nstage: ${status.textContent.replace(/^MODEL_LOAD stage: /,'').split(' — ')[0]}\nerror: ${safeError(error)}\nmodel: HuggingFaceTB/SmolVLM-256M-Instruct\nvariant: embed_tokens_fp16 + vision_encoder_fp16 + decoder_model_merged_q4f16`);}finally{busy=false;}
};
document.querySelector('#cancel').onclick=async()=>{if(model?.dispose)await model.dispose();model=null;processor=null;sessionState=transition(sessionState,'RELEASED');location.reload();};
document.querySelector('#clear').onclick=async()=>{await caches.delete(cacheName);location.reload();};
fileInput.onchange=async()=>{
  let file=fileInput.files[0],bitmap,canvas,inputs;
  if(!file||busy||!model||sessionState!=='MODEL_READY')return;
  if(file.name!=='rotina-diaria-teste.png'||file.type!=='image/png'){say('FIXTURE_REQUIRED');return;}
  sessionState=transition(sessionState,'FILE_SELECTED');busy=true;sessionState=transition(sessionState,'ANALYZING');fileInput.disabled=true;const started=performance.now();
  // Reload destroys the execution context on timeout, including the session.
  let timedOut=false;const timer=setTimeout(()=>{timedOut=true;analysisStage='TIMEOUT';if(sessionState==='ANALYZING')sessionState=transition(sessionState,'ANALYSIS_ERROR');say(`ANALYSIS_FAILED\nstage: TIMEOUT\nerror: análise excedeu 45 segundos\nstateBefore: ANALYZING\nstateAfter: ${sessionState}\nmodelSession: ${model?'loaded':'lost'}\nwebgpu: ${adapter?'available':'lost'}`);busy=false;fileInput.disabled=false;},45000);
  try{
    analysisStage='IMAGE_DECODE';
    bitmap=await createImageBitmap(file);file=null;
    if(bitmap.width!==1086||bitmap.height!==1448)throw Error('FIXTURE_DIMENSIONS');
    const values=[];canvas=document.createElement('canvas');analysisStage='CROP_START';
    for(const f of fields){
      const [x,y,right,bottom]=f.box;canvas.width=(right-x)*3;canvas.height=(bottom-y)*3;
      canvas.getContext('2d').drawImage(bitmap,x,y,right-x,bottom-y,0,0,canvas.width,canvas.height);
      const crop=RawImage.fromCanvas(canvas);analysisStage='CROP_READY';
      const prompt=processor.apply_chat_template([{role:'user',content:[{type:'image'},{type:'text',text:'Transcribe only the handwritten number in this crop. Return null if blank or unreadable. Do not explain.'}]}],{add_generation_prompt:true});
      analysisStage='PROCESSOR_START';inputs=await processor(prompt,crop);analysisStage='PROCESSOR_OK';
      analysisStage='INFERENCE_START';
      const out=await model.generate({...inputs,max_new_tokens:16,do_sample:false});
      analysisStage='INFERENCE_OK';
      const text=processor.batch_decode(out.slice(null,[inputs.input_ids.dims.at(-1),null]),{skip_special_tokens:true})[0];
      values.push(text);for(const tensor of Object.values(inputs))tensor?.dispose?.();inputs=null;out?.dispose?.();crop.data.fill(0);
    }
    analysisStage='OUTPUT_PARSE';const data=extraction(values);analysisStage='CONTRACT_VALIDATE';const result=mapLocalExtractionToContract(data);
    sessionState=transition(sessionState,'RESULT');say(JSON.stringify({metrics:score(values),elapsedMs:Math.round(performance.now()-started),providerValid:true,contractVersion:result.schemaVersion,scope:'Números apenas; checks/unidades e S25 ainda por validar',readings:result.document.readings},null,2));
  }catch(error){if(!timedOut){const before=sessionState;if(sessionState==='ANALYZING')sessionState=transition(sessionState,'ANALYSIS_ERROR');say(`ANALYSIS_FAILED\nstage: ${analysisStage}\nerror: ${safeError(error)}\nstateBefore: ${before}\nstateAfter: ${sessionState}\nmodelSession: ${model?'loaded':'lost'}\nwebgpu: ${adapter?'available':'lost'}`);}}
  finally{clearTimeout(timer);bitmap?.close();if(canvas){canvas.width=0;canvas.height=0;}for(const tensor of Object.values(inputs||{}))tensor?.dispose?.();fileInput.value='';file=null;busy=false;fileInput.disabled=false;}
};
