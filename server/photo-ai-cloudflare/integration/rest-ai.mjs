// One opt-in REST inference. Credentials and content are never written or logged.
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {extractionPrompt,providerUserTurn,EXTRACTION_MAX_TOKENS} from '../src/provider-extraction-v2.js';
import {FREE_MODEL} from '../src/config.js';
import {VISION_HEALTH_IMAGE} from '../src/vision-health-fixture.js';
const [entry,mode]=process.argv.slice(2);
const labels={3006:'Request too large',3007:'Request timeout',3008:'Request aborted',3036:'Daily free allocation exhausted',3040:'Out of capacity',5004:'Invalid base64 input',5016:'Model agreement required',5035:'Workers Paid required'};
const numeric=value=>Number.isInteger(value)?value:null;
function safeMessage(value,secrets=[]){
  if(typeof value!=='string')return 'Cloudflare error (message absent)';
  let text=value;
  for(const secret of [...secrets,extractionPrompt,...extractionPrompt.split('\n')]){
    if(typeof secret==='string'&&secret.length)text=text.split(secret).join('[REDACTED]');
  }
  return text
    .replace(/(?:authorization|headers?|prompt|messages)\s*[:=][^\r\n]*/gi,'[REDACTED]')
    .replace(/Bearer\s+\S+/gi,'[REDACTED]')
    .replace(/data:image\/[^,\s]+,[A-Za-z0-9+/=\s]+/gi,'[REDACTED]')
    .replace(/https?:\/\/[^\s"'<>]+/gi,'[REDACTED]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,'[REDACTED]')
    .replace(/\b(?:request[_ -]?id|cf-ray|ray[_ -]?id)\s*[:=]?\s*[\w-]+/gi,'[REDACTED]')
    .replace(/[A-Za-z0-9+/_=.-]{32,}/g,'[REDACTED]')
    .replace(/[\x00-\x1f\x7f]/g,' ')
    .slice(0,500);
}
if(mode==='self-test'){
  assert.equal(safeMessage('Model input is not valid: unsupported field image'),'Model input is not valid: unsupported field image');
  for(const sample of ['https://example.test/private','12345678-1234-1234-1234-123456789abc','request_id: private-id','Authorization: Bearer private-token','data:image/png;base64,'+'A'.repeat(100),extractionPrompt,'private-token']){
    const result=safeMessage(sample,['private-token']);
    assert.doesNotMatch(result,/example|12345678|private|Bearer|data:image|Analisa a imagem/);
  }
  assert.ok(safeMessage('long text '.repeat(100)).length<=500);
  console.log('REST sanitizer: 9 checks OK; no network call.');
}
let token=null,image=null,payload=null,body=null,envelope=null,bytes=null,auth=null;
let stage='LOCAL_MEASUREMENT';
if(mode!=='self-test')try{
  bytes=await readFile(new URL('../../../tests/manual/photo-ai/rotina-diaria-teste.png',import.meta.url));
  if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.toString('ascii',12,16)!=='IHDR')throw Error('INVALID_PNG');
  image='data:image/png;base64,'+bytes.toString('base64');
  const isControl=mode==='control';
  payload=isControl
    ? {messages:[{role:'system',content:'You are a helpful assistant.'},{role:'user',content:'Describe the image.'}],image,max_tokens:8}
    : {messages:[{role:'system',content:extractionPrompt},{role:'user',content:providerUserTurn}],image,max_tokens:EXTRACTION_MAX_TOKENS,temperature:0.1};
  body=JSON.stringify(payload);
  const parsedBody=JSON.parse(body);
  const audit={bodyType:typeof body,bodyKeys:Object.keys(payload),messagesIsArray:Array.isArray(payload.messages),messagesLength:Array.isArray(payload.messages)?payload.messages.length:null,roles:Array.isArray(payload.messages)?payload.messages.map(message=>message?.role):[],contentTypes:Array.isArray(payload.messages)?payload.messages.map(message=>typeof message?.content):[],contentLengths:Array.isArray(payload.messages)?payload.messages.map(message=>typeof message?.content==='string'?message.content.trim().length:null):[],imageType:typeof payload.image,imagePrefixValid:typeof payload.image==='string'&&payload.image.startsWith('data:image/png;base64,'),imageLength:typeof payload.image==='string'?payload.image.length:null,serializedHasMessages:Object.hasOwn(parsedBody,'messages')&&Array.isArray(parsedBody.messages),serializedLength:body.length,contentType:'application/json',wrapperIndevido:false};
  console.log(JSON.stringify({serialization:audit}));
  const health=Buffer.from(VISION_HEALTH_IMAGE.split(',')[1],'base64');
  console.log(JSON.stringify({fixture:{bytes:bytes.length,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),base64Length:image.length-22,dataUrlLength:image.length,requestBytes:Buffer.byteLength(body),promptCharacters:isControl?null:extractionPrompt.length,maxTokens:payload.max_tokens},visionHealth:{bytes:health.length,width:health.readUInt32BE(16),height:health.readUInt32BE(20),maxTokens:8}}));
  if(mode==='measure'||mode==='audit')process.exitCode=0;
  else{
    if(!['run','control'].includes(mode)||!entry)throw Error('EXPLICIT_RUN_REQUIRED');
    // Child output remains private; never inherit stdout/stderr for auth commands.
    const cli=(args)=>execFileSync(process.execPath,[entry,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],windowsHide:true,env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
    stage='AUTH';
    const identity=JSON.parse(cli(['whoami','--json']));
    const accounts=identity.accounts;
    if(!Array.isArray(accounts)||accounts.length!==1||!/^[a-f0-9]{32}$/i.test(accounts[0].id))throw Error('ACCOUNT_NOT_UNAMBIGUOUS');
    auth=JSON.parse(cli(['auth','token','--json']));
    if(!['oauth','api_token'].includes(auth.type)||typeof auth.token!=='string'||!auth.token)throw Error('AUTH_UNAVAILABLE');
    token=auth.token;auth=null;
    const endpoint='https://api.cloudflare.com/client/v4/accounts/'+accounts[0].id+'/ai/run/'+FREE_MODEL;
    stage='REST_CALL';
    const started=Date.now();
    // Diagnostic ceiling only; the existing core runner has no equivalent timer.
    const response=await fetch(endpoint,{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body,signal:AbortSignal.timeout(180000)});
    try{envelope=await response.json();}catch{envelope=null;}
    const result=envelope?.result,hasResult=result!==null&&result!==undefined;
    const safeKeys=new Set(['response','usage','tool_calls','finish_reason']);
    const errors=Array.isArray(envelope?.errors)?envelope.errors:[];
    const codes=errors.map(error=>numeric(error?.code));
    console.log(JSON.stringify({mode,httpStatus:response.status,success:typeof envelope?.success==='boolean'?envelope.success:null,errorCodes:codes,errorMessagesSanitized:errors.map(error=>safeMessage(error?.message,[token,image,image?.slice(22),body,accounts[0].id])),hasResult,resultType:result===null?'null':Array.isArray(result)?'array':typeof result,resultKeys:hasResult&&typeof result==='object'?Object.keys(result).map(key=>safeKeys.has(key)?key:'other'):[],hasResponse:result?.response!==undefined&&result?.response!==null,responseType:result?.response===null?'null':typeof result?.response,responseLength:typeof result?.response==='string'?result.response.length:null,elapsedMs:Date.now()-started}));
    process.exitCode=response.ok&&envelope?.success===true?0:1;
  }
}catch(error){
  console.log(JSON.stringify({stage,error:stage==='AUTH'?'AUTH_SETUP_FAILED':stage==='REST_CALL'?(error?.name==='TimeoutError'?'DIAGNOSTIC_TIMEOUT':'REST_TRANSPORT_FAILED'):'LOCAL_SETUP_FAILED'}));
  process.exitCode=1;
}finally{token=null;image=null;payload=null;body=null;envelope=null;bytes=null;auth=null;}
