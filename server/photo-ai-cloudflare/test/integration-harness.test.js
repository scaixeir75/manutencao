import test from 'node:test';
import assert from 'node:assert/strict';
import {persistSanitizedSummary,printSanitizedSummary,runRealIntegration} from '../integration/real-ai-harness.js';
import {extraction} from './helpers.js';

const fixture=Buffer.from('synthetic-fixture').toString('base64');
const platform=run=>({env:{PHOTO_AI_FREE_ONLY:'true',AI:{run}},dispose:async()=>{}});
const args=run=>({loadPlatform:async()=>platform(run),readImage:async()=>fixture,timeoutMs:25});

test('integration harness emits a safe success summary',async()=>{
  const summary=await runRealIntegration(args(async()=>({response:extraction()})));
  assert.equal(summary.outcome,'SUCCESS');assert.equal(summary.analyzeOk,true);assert.equal(summary.providerExtractionValid,true);assert.equal(summary.contractV2Valid,true);
});
test('integration harness classifies provider failure',async()=>{
  const summary=await runRealIntegration(args(async()=>{throw Error('provider detail');}));
  assert.equal(summary.outcome,'ERROR');assert.equal(summary.stage,'AI_CALL_FAILED');assert.equal(summary.errorClass,'AI_CALL_FAILED');
});
test('integration harness classifies timeout and emits a summary',async()=>{
  const summary=await runRealIntegration(args(async()=>await new Promise(()=>{})));
  assert.equal(summary.outcome,'TIMEOUT');assert.equal(summary.errorClass,'TIMEOUT');assert.equal(summary.aiCallStarted,true);
});
test('integration harness also bounds remote platform setup',async()=>{
  const summary=await runRealIntegration({loadPlatform:async()=>await new Promise(()=>{}),readImage:async()=>fixture,timeoutMs:25});
  assert.equal(summary.outcome,'TIMEOUT');assert.equal(summary.stage,'INTEGRATION_TIMEOUT');assert.equal(summary.aiCallStarted,false);
});
test('integration harness separates invalid JSON and invalid compact extraction',async()=>{
  const invalidJson=await runRealIntegration(args(async()=>({response:'{'})));
  const invalidExtraction=await runRealIntegration(args(async()=>({response:{documentType:'wrong'}})));
  assert.equal(invalidJson.stage,'AI_JSON_PARSE_FAILED');assert.equal(invalidExtraction.stage,'PROVIDER_EXTRACTION_FAILED');
});
test('integration harness reports contract and unexpected failures without details',async()=>{
  const contractFailure=await runRealIntegration({...args(async()=>({response:extraction()})),analyze:async({onStage})=>{onStage('CONTRACT_V2_FAILED');throw Object.assign(Error('private'),{photoAiStage:'CONTRACT_V2_FAILED'});}});
  const unexpected=await runRealIntegration({loadPlatform:async()=>{throw Error('private');},readImage:async()=>fixture,timeoutMs:25});
  assert.equal(contractFailure.errorClass,'CONTRACT_V2_FAILED');assert.equal(unexpected.errorClass,'UNEXPECTED');
});
test('printed summary has fixed safe keys only',()=>{
  let text='';const summary=printSanitizedSummary({outcome:'ERROR',stage:'AI_CALL_FAILED',elapsedMs:1,aiCallStarted:true,aiCallCompleted:false,responseReceived:false,responseType:null,providerExtractionValid:false,contractV2Valid:false,analyzeOk:false,errorClass:'AI_CALL_FAILED',token:'secret',image:'base64'},value=>{text+=value;});
  assert.deepEqual(Object.keys(summary),['outcome','stage','elapsedMs','aiCallStarted','aiCallCompleted','responseReceived','responseType','providerExtractionValid','contractV2Valid','analyzeOk','errorClass']);assert.doesNotMatch(text,/secret|base64/);
});
test('persisted summary has the same fixed safe keys only',async()=>{
  let content='';const summary=await persistSanitizedSummary({outcome:'SUCCESS',stage:'ANALYZE_OK',elapsedMs:1,aiCallStarted:true,aiCallCompleted:true,responseReceived:true,responseType:'object',providerExtractionValid:true,contractV2Valid:true,analyzeOk:true,errorClass:null,image:'base64'},async(_path,value)=>{content=value;},'temporary-receipt');
  assert.equal(summary.analyzeOk,true);assert.doesNotMatch(content,/base64/);assert.deepEqual(Object.keys(JSON.parse(content)),['outcome','stage','elapsedMs','aiCallStarted','aiCallCompleted','responseReceived','responseType','providerExtractionValid','contractV2Valid','analyzeOk','errorClass']);
});
