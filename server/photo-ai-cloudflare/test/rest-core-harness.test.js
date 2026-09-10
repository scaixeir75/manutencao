import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {runRestCore,sanitizedReceipt} from '../integration/rest-core-harness.js';
import {extraction} from './helpers.js';

const image=Buffer.from('synthetic').toString('base64');
const args=(request,receiptPath=join(tmpdir(),`pmp-receipt-${Math.random().toString(16).slice(2)}.json`))=>({credentials:async()=>({accountId:'a'.repeat(32),token:'secret'}),readImage:async()=>image,request,timeoutMs:30,receiptPath});
test('REST core uses the Worker adapter and reaches ANALYZE_OK',async()=>{
  let payload;const receipt=await runRestCore(args(async request=>{payload=request.payload;return {status:200,success:true,cloudflareCode:null,result:{response:extraction()}};}));
  assert.equal(receipt.analyzeOk,true);assert.equal(receipt.providerExtractionValid,true);assert.equal(receipt.contractV2Valid,true);assert.equal(payload.response_format.type,'json_object');assert.equal(payload.messages.length,2);assert.match(payload.image,/^data:image\/png;base64,/);
});
test('REST core keeps its model selection explicit',async()=>{
  let model;const receipt=await runRestCore({...args(async request=>{model=request.model;return {status:200,success:true,result:{response:extraction()}};}),model:'@cf/meta/llama-4-scout-17b-16e-instruct'});
  assert.equal(receipt.analyzeOk,true);assert.equal(model,'@cf/meta/llama-4-scout-17b-16e-instruct');
});
test('REST core reports provider and parsing failures without content',async()=>{
  const provider=await runRestCore(args(async()=>({status:503,success:false,cloudflareCode:3040,result:null})));
  const parser=await runRestCore(args(async()=>({status:200,success:true,cloudflareCode:null,result:{response:'{'}})));
  assert.equal(provider.cloudflareCode,3040);assert.equal(provider.errorClass,'REST_PROVIDER_FAILED');assert.equal(parser.errorClass,'AI_JSON_PARSE_FAILED');
});
test('REST core receipt has no credential or content keys',async()=>{
  const receipt=sanitizedReceipt({outcome:'ERROR',httpStatus:400,cloudflareCode:3030,elapsedMs:1,responseReceived:false,responseType:null,providerExtractionValid:false,contractV2Valid:false,analyzeOk:false,errorClass:'REST_PROVIDER_FAILED',token:'secret',image:'base64'});
  assert.deepEqual(Object.keys(receipt),['outcome','httpStatus','cloudflareCode','elapsedMs','responseReceived','responseType','providerExtractionValid','contractV2Valid','analyzeOk','errorClass','providerFingerprint']);assert.doesNotMatch(JSON.stringify(receipt),/secret|base64/);
});
test('receipt records FETCH_STARTED while a fetch mock is blocked',async()=>{
  const receiptPath=join(tmpdir(),`pmp-receipt-blocked-${Date.now()}.json`);
  let release;const blocked=new Promise(resolve=>{release=resolve;});
  const running=runRestCore(args(async({onFetchStarted})=>{onFetchStarted();await blocked;return {status:200,success:true,result:{response:extraction()}};},receiptPath));
  await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(JSON.parse(readFileSync(receiptPath,'utf8')).stage,'FETCH_STARTED');release();await running;
});
test('receipt records parser progress and provider validation',async()=>{
  const receiptPath=join(tmpdir(),`pmp-receipt-progress-${Date.now()}.json`);
  let observed=[];const result=await runRestCore(args(async({onFetchStarted})=>{onFetchStarted();return {status:200,success:true,result:{response:extraction()}};},receiptPath));
  const persisted=JSON.parse(readFileSync(receiptPath,'utf8'));observed.push(persisted.stage);
  assert.equal(result.analyzeOk,true);assert.equal(persisted.stage,'ANALYZE_OK');assert.deepEqual(observed,['ANALYZE_OK']);
});
