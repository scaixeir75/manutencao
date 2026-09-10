import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createWorker} from 'tesseract.js';
import {runDeterministicPipeline,wordsFromBlocks} from './poc-core.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const fixture=path.join(root,'tests/manual/photo-ai/rotina-diaria-teste.png');
const languagePath=path.join(root,'node_modules/@tesseract.js-data/eng/4.0.0');
const started=performance.now();
let worker;
try{
  worker=await createWorker('eng',1,{langPath:languagePath,gzip:true,cacheMethod:'none',logger:()=>{}});
  const ocrStarted=performance.now();
  const result=await worker.recognize(fixture,{}, {blocks:true});
  // The runner never writes OCR output, image bytes, or values to disk/logs.
  const pipeline=runDeterministicPipeline({width:1086,height:1448,words:wordsFromBlocks(result.data.blocks),ocrMs:performance.now()-ocrStarted,elapsedMs:performance.now()-started,initialBytes:0});
  const safe={
    engine:'tesseract.js/WASM local',
    layout:{located:pipeline.layout.located,anchorCount:pipeline.layout.anchors.length},
    providerExtractionV2:true,contractV2:true,
    metrics:pipeline.metrics,
    imageTransmitted:false,imagePersisted:false,externalApi:false
  };
  console.log(JSON.stringify(safe));
  process.exitCode=pipeline.metrics.stopLoss?2:0;
}catch(error){console.log(JSON.stringify({engine:'tesseract.js/WASM local',failed:true,code:error?.message==='Layout conhecido não localizado.'?'LAYOUT_NOT_FOUND':'OCR_FAILED',imageTransmitted:false,imagePersisted:false,externalApi:false}));process.exitCode=1;}
finally{await worker?.terminate();}
