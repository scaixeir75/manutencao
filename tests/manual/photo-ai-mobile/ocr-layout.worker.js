// Build entry for the future mobile PoC. This module is intentionally not
// referenced by the PMP UI. File and OCR output only exist while one message
// is being processed by this Worker.
import {createWorker} from 'tesseract.js';
import {runDeterministicPipeline,wordsFromBlocks} from './poc-core.js';

let active=null;
self.onmessage=async event=>{
  if(event.data?.type==='cancel'){await active?.terminate();active=null;return;}
  const {file,languagePath,timeoutMs=45000}=event.data||{};
  if(!(file instanceof Blob)){self.postMessage({ok:false,code:'INVALID_FILE'});return;}
  const started=performance.now();
  const timeout=setTimeout(()=>active?.terminate(),timeoutMs);
  try{
    active=await createWorker('eng',1,{langPath:languagePath,gzip:true,cacheMethod:'none',logger:()=>{}});
    const result=await active.recognize(file,{}, {blocks:true});
    const bitmap=await createImageBitmap(file);
    const pipeline=runDeterministicPipeline({width:bitmap.width,height:bitmap.height,words:wordsFromBlocks(result.data.blocks),elapsedMs:performance.now()-started,ocrMs:performance.now()-started});
    bitmap.close();
    self.postMessage({ok:true,pipeline});
  }catch(error){self.postMessage({ok:false,code:error?.message==='Layout conhecido não localizado.'?'LAYOUT_NOT_FOUND':'OCR_FAILED'});}
  finally{clearTimeout(timeout);await active?.terminate();active=null;}
};
