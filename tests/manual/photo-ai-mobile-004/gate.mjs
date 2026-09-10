import fs from 'node:fs/promises';
import path from 'node:path';
import {createWorker} from 'tesseract.js';
import {FIXTURE_REFERENCE} from '../photo-ai-mobile/reference-fixture.js';

const root=process.cwd();
const fixture=path.join(root,'tests/manual/photo-ai/rotina-diaria-teste.png');
const langPath=path.join(root,'node_modules/@tesseract.js-data/eng/4.0.0');
const W=1086,H=1448;
// Fixed template crops only; no form detection or OCR of the surrounding form.
const fields=[
  ['Grupo Gerador','Gasóleo (L)',[420,160,595,205],'01234/'],
  ['Eletricidade','Contagem (kWh)',[420,210,595,250],'0123456789'],
  ['Água','Contagem (m3)',[420,240,595,280],'0123456789'],
  ['Gás','Contagem (m3)',[420,270,595,310],'0123456789'],
  ...[1,2,3,4].map((n,i)=>['Depósitos AQS / Termo-acumuladores',`Número ${String(n).padStart(2,'0')}`,[580,298+i*24,755,330+i*24],'0123456789.,']),
  ['Registo de Temperatura - Máquina Lava-Loiça','Semana 3',[580,442,755,478],'0123456789.,'],
  ['Registo de Temperatura - Máquina Lava-Loiça','Semana 4',[580,468,755,504],'0123456789.,'],
  ['Gases Medicinais','Central Vácuo',[420,495,600,550],'0123456789.,-mBar '],
  ['Análise de Água (Cozinha)','CL Livre',[420,584,595,625],'0123456789.,'],
  ['Análise de Água (Cozinha)','CL Total',[420,614,595,650],'0123456789.,'],
  ['Análise de Água (Cozinha)','pH',[420,640,595,675],'0123456789.,']
];
const expected=new Map(FIXTURE_REFERENCE.readings.map(([s,r,v])=>[`${s}\0${r}`,v]));
const key=(s,r)=>`${s}\0${r}`;
function normalize(raw,section,row){
  const t=String(raw||'').replace(/\s+/g,' ').trim();
  if(!t)return null;
  if(section==='Grupo Gerador') return /^(?:1\/4|2\/4|3\/4|4\/4)$/.test(t)?t:null;
  if(section==='Gases Medicinais') { const m=t.match(/-?\d+(?:[.,]\d+)?/); return m?m[0].replace('.',','):null; }
  const m=t.match(/-?\d+(?:[.,]\d+)?/); return m?m[0].replace('.',','):null;
}
async function main(){
  const stat=await fs.stat(fixture); const worker=await createWorker('eng',1,{langPath,gzip:true,cacheMethod:'none',logger:()=>{}});
  const rows=[]; const started=Date.now();
  try{
    await worker.setParameters({preserve_interword_spaces:'1'});
    for(const [section,row,rect,whitelist] of fields){
      await worker.setParameters({tessedit_char_whitelist:whitelist});
      const {data}=await worker.recognize(fixture,{rectangle:{left:rect[0],top:rect[1],width:rect[2]-rect[0],height:rect[3]-rect[1]}},{blocks:true});
      const value=normalize(data.text,section,row); const exp=expected.get(key(section,row));
      rows.push({section,row,raw:String(data.text||'').trim(),value,state:value?'Duvidoso':'Não confirmado',classification:value===null?'ABSTENÇÃO':value===exp?'CORRETO':'INCORRETO'});
    }
  } finally { await worker.terminate(); }
  const legible=rows.filter(r=>expected.has(key(r.section,r.row))); const correct=legible.filter(r=>r.classification==='CORRETO').length; const abstained=legible.filter(r=>r.classification==='ABSTENÇÃO').length; const incorrect=legible.filter(r=>r.classification==='INCORRETO').length;
  const result={fixtureBytes:stat.size,dimensions:`${W}x${H}`,elapsedMs:Date.now()-started,fields:rows,summary:{tested:legible.length,correct,incorrect,abstained,rate:correct/legible.length,zeroSwaps:incorrect===0,performanceOk:Date.now()-started<45000},privacy:{imagePersisted:false,ocrPersisted:false,transmitted:false}};
  console.log(JSON.stringify(result,null,2));
  if(result.summary.rate<.8||incorrect>0) process.exitCode=2;
}
main().catch(err=>{console.error(JSON.stringify({outcome:'FAILED',errorClass:err?.name||'Error',message:String(err?.message||err)}));process.exitCode=1;});
