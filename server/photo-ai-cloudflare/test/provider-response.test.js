import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeWithWorkersAi,resultMetadata} from '../src/photo-ai-provider.js';
import {complete,extraction} from './helpers.js';
import {deriveConfidence,mapProviderExtractionV2ToContractV2,normalizeProviderExtraction,providerExtractionV2Fingerprint,validateProviderExtractionV2} from '../src/provider-extraction-v2.js';

test('json_object makes exactly one call on success and every provider failure',async()=>{
  for(const output of [{response:extraction()},{response:JSON.stringify(extraction())},{response:'invalid'},{response:[]},{response:'[]'},{response:{metadata:{}}},new Error('private failure')]){
    let calls=0;
    try{await analyzeWithWorkersAi({ai:{run:async(_model,payload)=>{
      calls++;assert.deepEqual(payload.response_format,{type:'json_object'});
      if(output instanceof Error)throw output;return output;
    }},model:'test',image:'c3ludGhldGlj',mime:'image/png',context:{}});}
    catch(error){assert.equal(error.status,503);assert.doesNotMatch(error.message,/private failure/);}
    assert.equal(calls,1);
  }
});
test('arrays and incorrect compact types fail closed',async()=>{
  for(const response of [[], '[]', {...extraction(),readings:'wrong'}, {...extraction(),metadata:{technician:123,date:null,time:null}}]){
    const result=await analyze({response});assert.ok(result.error);assert.notEqual(result.stage,'ANALYZE_OK');
  }
});
test('checks without mandatory uncertain fail closed',async()=>{
  const data=extraction();data.checks=[{section:'Bomba',row:'Bomba 1',state:'OK'}];
  const result=await analyze({response:data});assert.equal(result.stage,'PROVIDER_EXTRACTION_FAILED');
});
test('report strings instead of text/confidence objects fail closed',async()=>{
  const data=extraction();data.reports=['Relatório sem estrutura'];
  const result=await analyze({response:data});assert.equal(result.stage,'PROVIDER_EXTRACTION_FAILED');
});
test('confidence is derived only by the server',()=>{
  assert.equal(deriveConfidence(null,false),'Não confirmado');
  assert.equal(deriveConfidence(null,true),'Não confirmado');
  assert.equal(deriveConfidence('123',false),'Reconhecido');
  assert.equal(deriveConfidence('123',true),'Duvidoso');
  assert.equal(deriveConfidence('OK',false),'Reconhecido');
  assert.equal(deriveConfidence('NOK',true),'Duvidoso');
});
test('normalizes only the exact legacy V1 structure without inventing values',()=>{
  const legacy={documentType:'Rotina Diária',metadata:{technician:null,date:'2026-09-05',time:null},readings:[{section:'Gerador',row:'Gasóleo',value:'3/4',confidence:'Reconhecido'}],checks:[{section:'Gerador',row:'Gasóleo',state:null,confidence:'Não confirmado'}],reports:[{text:null,confidence:'Não confirmado'}]};
  const normalized=normalizeProviderExtraction(legacy);
  assert.deepEqual(validateProviderExtractionV2(normalized),{documentType:{value:'Rotina Diária',uncertain:false},metadata:{technician:{value:null,uncertain:false},date:{value:'2026-09-05',uncertain:false},time:{value:null,uncertain:false}},readings:[{section:'Gerador',row:'Gasóleo',value:'3/4',uncertain:false}],checks:[{section:'Gerador',row:'Gasóleo',state:null,uncertain:false}],reports:[{text:null,uncertain:false}]});
  assert.throws(()=>normalizeProviderExtraction({...legacy,extra:'danger'}));
  assert.throws(()=>normalizeProviderExtraction({...legacy,reports:['texto sem estrutura']}));
  assert.throws(()=>normalizeProviderExtraction({...legacy,readings:[{section:'Gerador',row:'Gasóleo',value:'3/4',confidence:'Não confirmado'}]}));
});
test('fingerprint identifies a structural type mismatch without content',()=>{
  const fingerprint=providerExtractionV2Fingerprint({...extraction(),readings:[{section:'Gerador',row:'Gasóleo',value:'3/4',uncertain:'false'}]});
  assert.equal(fingerprint.valid,false);assert.deepEqual(fingerprint.failures[0],{path:'readings[0].uncertain',expected:'boolean',actualType:'string'});assert.doesNotMatch(JSON.stringify(fingerprint),/Gasóleo|3\/4/);
});
test('provider rejects confidence fields and requires uncertain booleans',async()=>{
  for(const mutate of [
    data=>{data.readings=[{section:'Bomba',row:'Bomba 1',value:'12',uncertain:'false'}];},
    data=>{data.checks=[{section:'Bomba',row:'Bomba 1',state:'OK',confidence:'Reconhecido',uncertain:false}];},
    data=>{data.reports=[{text:'Texto visível',uncertain:null}];}
  ]){const data=extraction();mutate(data);const result=await analyze({response:data});assert.equal(result.stage,'PROVIDER_EXTRACTION_FAILED');}
});
test('mapper preserves spatial rows, units, missing checks and independent reports',()=>{
  const data=extraction();
  data.readings=[
    ['Gerador','Gasóleo','3/4','L',null],
    ['AQS','Número 01','60,5','°C',null],['AQS','Número 02',null,'°C',null],
    ['Lava-Loiça','Semana 3','66','°C',null],
    ['Vácuo','Central Vácuo','-796','Bar','mBar'],
    ['Análise Água','CL Livre','0,53',null,null],['Análise Água','CL Total','6,56',null,null],['Análise Água','pH','6,89',null,null]
  ].map(([section,row,value,printedUnit,recordedUnit])=>({section,row,value,printedUnit,recordedUnit,uncertain:value===null}));
  data.checks=[{section:'AQS',row:'Número 01',state:'NOK',uncertain:false}];
  data.reports=[{text:'Primeiro assunto',uncertain:false},{text:'Segundo assunto',uncertain:true}];
  const result=mapProviderExtractionV2ToContractV2(data);
  assert.equal(result.schemaVersion,2);
  assert.equal(result.fields.equipment.value,null);
  assert.deepEqual(result.document.readings.map(row=>row.value),['3/4','60,5',null,'66','-796','0,53','6,56','6,89']);
  assert.equal(result.document.readings[1].subItem,'Número 01');
  assert.equal(result.document.readings[1].state,'NOK');
  assert.equal(result.document.readings[2].state,'Não confirmado');
  assert.equal(result.document.readings[3].subItem,'Semana 3');
  assert.equal(result.document.readings[4].printedUnit,'Bar');
  assert.equal(result.document.readings[4].recordedUnit,'mBar');
  assert.equal(result.document.reportItems.length,2);
  assert.equal(result.document.reportItems[1].confidence,'Duvidoso');
});
const absent=()=>({value:null,confidence:'Não confirmado',evidence:null,reason:'Campo vazio.'});
function v2(){return {...complete(),schemaVersion:2,document:{documentType:absent(),documentMetadata:{technician:absent(),date:absent(),time:absent()},readings:[],checks:[],reportItems:[]}};}
async function analyze(output){let stage;try{const result=await analyzeWithWorkersAi({ai:{run:async()=>output},model:'test',image:'c3ludGhldGlj',mime:'image/png',context:{},onStage:value=>{stage=value;}});return {stage,result};}catch(error){return {stage,error};}}
for(const [name,output] of [['missing',{}],['empty',{response:''}],['whitespace',{response:' \n\t'}],['null',{response:null}],['unexpected string','{"schemaVersion":2}'],['tools only',{tool_calls:[{}]}]]){
  test(`provider response ${name} fails closed`,async()=>{const result=await analyze(output);assert.equal(result.stage,'AI_EMPTY_RESPONSE');assert.ok(result.error);});
}
test('provider parses compact JSON text and accepts validated compact object',async()=>{for(const response of [JSON.stringify(extraction()),extraction()]){const result=await analyze({response});assert.equal(result.stage,'ANALYZE_OK');assert.equal(result.result.data.schemaVersion,2);}});
test('provider separates JSON syntax from compact extraction errors',async()=>{assert.equal((await analyze({response:'invalid'})).stage,'AI_JSON_PARSE_FAILED');for(const response of [{},JSON.stringify({schemaVersion:2})])assert.equal((await analyze({response})).stage,'PROVIDER_EXTRACTION_FAILED');});
test('structural metadata does not include raw content or arbitrary key names',()=>{const text='private-response';const metadata=resultMetadata({response:text,[text]:'sensitive',usage:{},tool_calls:[]});assert.doesNotMatch(JSON.stringify(metadata),/private-response|sensitive/);assert.equal(metadata.responseLength,text.length);assert.equal(metadata.toolCallCount,0);});
test('context echoed by real provider is a compact extraction failure, not an empty response',async()=>{const result=await analyze({response:{fichaId:'synthetic',equipment:'test',week:'36'},usage:{completion_tokens:37},tool_calls:[]});assert.equal(result.stage,'PROVIDER_EXTRACTION_FAILED');});
test('real provider shape with document string fails compact extraction',async()=>{const data=v2();data.document='synthetic invalid document';const result=await analyze({response:data,usage:{completion_tokens:519},tool_calls:[]});assert.equal(result.stage,'PROVIDER_EXTRACTION_FAILED');assert.ok(result.error);assert.doesNotMatch(result.error.message,/synthetic invalid document/);});
test('provider rejects legacy v1 even though shared frontend contract supports it',async()=>{const {document,...data}=v2();data.schemaVersion=1;assert.equal((await analyze({response:data})).stage,'PROVIDER_EXTRACTION_FAILED');});
test('budget exhausted with incomplete JSON has an explicit stage',async()=>{assert.equal((await analyze({response:'{"schemaVersion":',usage:{completion_tokens:3072}})).stage,'AI_OUTPUT_TRUNCATED');});
test('provider uses separated system and user turns without request context',async()=>{let payload;await analyzeWithWorkersAi({ai:{run:async(_model,input)=>{payload=input;return {response:extraction()};}},model:'test',image:'c3ludGhldGlj',mime:'image/png',context:{fichaId:'private-id',equipment:'private-context',week:'36'}});assert.deepEqual(payload.messages.map(message=>message.role),['system','user']);assert.match(payload.messages[1].content,/Analisa a imagem/);assert.doesNotMatch(JSON.stringify(payload.messages),/private-id|private-context/);});
