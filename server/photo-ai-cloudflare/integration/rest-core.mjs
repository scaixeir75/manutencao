// One opt-in direct REST inference. It bypasses Wrangler's remote wrapper and
// emits or persists only a fixed, sanitised receipt.
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runRestCore,sanitizedReceipt} from './rest-core-harness.js';
import {FREE_MODEL} from '../src/config.js';

const [entry,mode,requestedModel]=process.argv.slice(2);
const SCOUT_MODEL='@cf/meta/llama-4-scout-17b-16e-instruct';
const empty={outcome:'ERROR',httpStatus:null,cloudflareCode:null,elapsedMs:0,responseReceived:false,responseType:null,providerExtractionValid:false,contractV2Valid:false,analyzeOk:false,errorClass:'UNEXPECTED'};
const print=summary=>process.stdout.write('PMP_PHOTO_AI_REST_RECEIPT='+JSON.stringify(sanitizedReceipt(summary))+'\n');
async function main(){
  const model=requestedModel||FREE_MODEL;
  if(!entry||mode!=='run'||![FREE_MODEL,SCOUT_MODEL].includes(model))return {...empty,errorClass:'ARGUMENTS'};
  return runRestCore({
    credentials:async()=>{
      const cli=args=>execFileSync(process.execPath,[entry,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],windowsHide:true,env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
      const identity=JSON.parse(cli(['whoami','--json']));
      const accounts=identity.accounts;
      if(!Array.isArray(accounts)||accounts.length!==1||!/^[a-f0-9]{32}$/i.test(accounts[0]?.id))return null;
      const auth=JSON.parse(cli(['auth','token','--json']));
      return ['oauth','api_token'].includes(auth.type)&&typeof auth.token==='string'&&auth.token?{accountId:accounts[0].id,token:auth.token}:null;
    },
    readImage:async()=> (await readFile(new URL('../../../tests/manual/photo-ai/rotina-diaria-teste.png',import.meta.url))).toString('base64'),
    model,
    request:async({accountId,token,model,payload,signal,onFetchStarted})=>{
      onFetchStarted();
      const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/ai/run/'+model,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(payload),signal});
      return {status:response.status,response};
    },
  });
}
let receipt;try{receipt=await main();}catch{receipt=empty;}
print(receipt);
if(receipt.outcome!=='SUCCESS')process.exitCode=1;
