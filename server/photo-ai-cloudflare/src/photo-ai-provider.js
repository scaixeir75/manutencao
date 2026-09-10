import contract from '../../../photo-ai-contract.js';
import {EXTRACTION_MAX_TOKENS,extractionPrompt,providerUserTurn,normalizeProviderExtraction,validateProviderExtractionV2,mapProviderExtractionV2ToContractV2} from './provider-extraction-v2.js';

const {validate}=contract;
function numeric(value){return typeof value==='number'?value:(typeof value==='string'&&/^\d{3,4}$/.test(value)?Number(value):null);}
function providerError(message,stage,status=503,source={}){const rawStatus=numeric(source.status);const aiStatus=Number.isInteger(rawStatus)&&rawStatus>=100&&rawStatus<=599?rawStatus:null;const aiCode=[source.internalCode,source.code].map(numeric).find(value=>Number.isInteger(value)&&value>=1000&&value<=9999)||null;return Object.assign(new Error(message),{status,photoAiStage:stage,aiStatus,aiCode,...(source.imageDiagnostics?{imageDiagnostics:source.imageDiagnostics}:{})});}
export function resultMetadata(result){const keys=['response','usage','tool_calls','finish_reason'];return {resultType:typeof result,resultIsNull:result===null,resultKeys:result&&typeof result==='object'?Object.keys(result).map(key=>keys.includes(key)?key:'other'):[],responseType:typeof result?.response,responseLength:typeof result?.response==='string'?result.response.length:null,hasUsage:Boolean(result?.usage),hasToolCalls:Array.isArray(result?.tool_calls),toolCallCount:Array.isArray(result?.tool_calls)?result.tool_calls.length:0};}
function responseText(response,source){const text=response?.response;if(typeof text!=='string'||!text.trim())throw Object.assign(providerError('Análise indisponível.','AI_EMPTY_RESPONSE',503,source),{resultMetadata:resultMetadata(response)});return text.trim();}
function parseResponse(response,source){let data;try{data=JSON.parse(responseText(response,source));}catch(error){if(error?.photoAiStage)throw error;throw providerError('Análise indisponível.','AI_JSON_PARSE_FAILED',503,source);}try{return validate(data);}catch{throw providerError('Análise indisponível.','CONTRACT_V2_FAILED',503,source);}}
function prepareImage(mime,image){let decoded;try{decoded=atob(image);}catch{throw providerError('Análise indisponível.','IMAGE_DECODE_FAILED');}let imageDataUrl;try{imageDataUrl=`data:${mime};base64,${image}`;}catch{throw providerError('Análise indisponível.','IMAGE_PREPARATION_FAILED');}return {imageDataUrl,imageDiagnostics:{mime,inputBase64Length:image.length,decodedBytes:decoded.length,imageDataUrlLength:imageDataUrl.length,imageType:typeof imageDataUrl,hasValidDataUrlPrefix:imageDataUrl.startsWith(`data:${mime};base64,`),completedStages:['IMAGE_DECODE_START','IMAGE_DECODE_OK','IMAGE_PREPARED']}};}
async function run(ai,model,payload,imageDiagnostics){if(!ai||typeof ai.run!=='function')throw providerError('Análise indisponível.','AI_CALL_FAILED',503,{imageDiagnostics});try{return await ai.run(model,payload);}catch(error){throw providerError(error?.quota||error?.status===429?'Limite gratuito de análise atingido. Tenta novamente mais tarde.':'Análise indisponível.',error?.quota||error?.status===429?'AI_QUOTA':'AI_CALL_FAILED',error?.quota||error?.status===429?429:503,{...error,imageDiagnostics});}}
export async function analyzeWithWorkersAi({ai,model,image,mime,context,onStage=()=>{},onResult=()=>{}}){
  onStage('IMAGE_DECODE_START');
  let prepared;
  try{prepared=prepareImage(mime,image);}catch(error){if(error?.photoAiStage){onStage(error.photoAiStage);throw error;}onStage('IMAGE_PREPARATION_FAILED');throw Error('Análise indisponível.');}
  const {imageDataUrl,imageDiagnostics}=prepared;
  onStage('IMAGE_DECODE_OK');onStage('IMAGE_PREPARED');
  let response;
  onStage('AI_CALL_START');
  try{response=await run(ai,model,{
    messages:[{role:'system',content:extractionPrompt},{role:'user',content:providerUserTurn}],
    image:imageDataUrl,max_tokens:EXTRACTION_MAX_TOKENS,temperature:0.1,
    response_format:{type:'json_object'},
  },imageDiagnostics);}
  catch(error){onStage('AI_CALL_FAILED');throw error;}
  onStage('AI_RESPONSE_RECEIVED');
  onResult(resultMetadata(response));
  let text,data;
  // JSON Mode officially returns response as an object. It is never accepted
  // as success until the same strict local contract has validated it.
  if(response?.response&&typeof response.response==='object'&&!Array.isArray(response.response)){data=response.response;}
  else{
    try{text=responseText(response);}catch(error){onStage('AI_EMPTY_RESPONSE');throw error;}
    try{data=JSON.parse(text);}catch{const stage=response?.usage?.completion_tokens>=EXTRACTION_MAX_TOKENS?'AI_OUTPUT_TRUNCATED':'AI_JSON_PARSE_FAILED';onStage(stage);throw providerError('Análise indisponível.',stage);}
  }
  try{data=validateProviderExtractionV2(normalizeProviderExtraction(data));}catch{onStage('PROVIDER_EXTRACTION_FAILED');throw providerError('Análise indisponível.','PROVIDER_EXTRACTION_FAILED');}
  onStage('PROVIDER_EXTRACTION_OK');
  try{data=mapProviderExtractionV2ToContractV2(data);}catch{onStage('CONTRACT_V2_FAILED');throw providerError('Análise indisponível.','CONTRACT_V2_FAILED');}
  onStage('ANALYZE_OK');
  return {data,diagnostics:{...imageDiagnostics,completedStages:[...imageDiagnostics.completedStages,'AI_RESPONSE_RECEIVED','ANALYZE_OK']}};
}
export async function workersAiTextHealth({ai,model}){const response=await run(ai,model,{messages:[{role:'user',content:'Responde apenas OK.'}],max_tokens:8,temperature:0});responseText(response);return {stage:'AI_TEXT_OK'};}
export async function workersAiVisionHealth({ai,model,image}){const response=await run(ai,model,{messages:[{role:'system',content:'Responde apenas com texto curto.'},{role:'user',content:'Responde apenas OK.'}],image,max_tokens:8,temperature:0.1});responseText(response);return {stage:'AI_VISION_OK'};}
export {parseResponse};
