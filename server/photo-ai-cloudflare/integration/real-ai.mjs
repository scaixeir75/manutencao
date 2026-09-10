// Opt-in one-inference runner. It never writes credentials, image bytes or a
// provider response. Every path emits exactly one `PMP_PHOTO_AI_SUMMARY` line.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {persistSanitizedSummary,printSanitizedSummary,runRealIntegration} from './real-ai-harness.js';

const [entry,mode]=process.argv.slice(2);
const validMode=mode==='baseline';

async function main(){
  if(!entry||!validMode)return {outcome:'ERROR',stage:'ARGUMENTS',elapsedMs:0,aiCallStarted:false,aiCallCompleted:false,responseReceived:false,responseType:null,providerExtractionValid:false,contractV2Valid:false,analyzeOk:false,errorClass:'UNEXPECTED'};
  return runRealIntegration({
    loadPlatform:async()=>{
      const {getPlatformProxy}=await import(pathToFileURL(entry));
      return getPlatformProxy({configPath:fileURLToPath(new URL('./wrangler.jsonc',import.meta.url)),persist:false,remoteBindings:true});
    },
    readImage:async()=> (await readFile(new URL('../../../tests/manual/photo-ai/rotina-diaria-teste.png',import.meta.url))).toString('base64'),
    // The automation transport can end before draining stdout. Keep an
    // optional, explicitly supplied temporary receipt containing only the
    // same safe summary, never request or provider content.
    timeoutMs:90000,
  });
}

let summary;
try{summary=await main();}
catch{summary={outcome:'ERROR',stage:'HARNESS_UNEXPECTED',elapsedMs:0,aiCallStarted:false,aiCallCompleted:false,responseReceived:false,responseType:null,providerExtractionValid:false,contractV2Valid:false,analyzeOk:false,errorClass:'UNEXPECTED'};}
printSanitizedSummary(summary);
if(process.env.PMP_PHOTO_AI_SUMMARY_FILE)await persistSanitizedSummary(summary,writeFile,process.env.PMP_PHOTO_AI_SUMMARY_FILE);
if(summary.outcome!=='SUCCESS')process.exitCode=1;
