import {validateProviderExtractionV2,mapProviderExtractionV2ToContractV2} from '../../../server/photo-ai-cloudflare/src/provider-extraction-v2.js';
import {FIXTURE_REFERENCE,POC_LIMITS} from './reference-fixture.js';

// Normalized template regions. They deliberately describe positions rather
// than interpreting a value read in a neighbouring cell.
export const KNOWN_TEMPLATE=Object.freeze({
  aspect:1086/1448,
  readings:Object.freeze([
    ['Grupo Gerador','Gasóleo (L)',.42,.116,.54,.140,'L'],
    ['Eletricidade','Contagem (kWh)',.42,.153,.54,.177,'kWh'],
    ['Água','Contagem (m3)',.42,.177,.54,.201,'m3'],
    ['Gás','Contagem (m3)',.42,.201,.54,.225,'m3'],
    ...[1,2,3,4].map((number,index)=>['Depósitos AQS / Termo-acumuladores','Número '+String(number).padStart(2,'0'),.54,.210+index*.024,.68,.234+index*.024,'°C']),
    ...[1,2,3,4,5].map((week,index)=>['Registo de Temperatura - Máquina Lava-Loiça','Semana '+week,.54,.278+index*.024,.68,.302+index*.024,'°C']),
    ['Gases Medicinais','Central Vácuo',.42,.347,.54,.371,'Bar'],
    ['Análise de Água (Cozinha)','CL Livre',.42,.396,.54,.420,null],
    ['Análise de Água (Cozinha)','CL Total',.42,.420,.54,.444,null],
    ['Análise de Água (Cozinha)','pH',.42,.444,.54,.468,null]
  ])
});

const empty=(value=null)=>({value,uncertain:false});
const noCheck=(section,row)=>({section,row,state:null,uncertain:false});

export function wordsFromBlocks(blocks){
  if(!Array.isArray(blocks))return [];
  return blocks.flatMap(block=>(block.paragraphs||[]).flatMap(paragraph=>(paragraph.lines||[]).flatMap(line=>line.words||[])));
}

export function locateKnownLayout({width,height,words=[]}){
  const aspect=width/height;
  const text=words.map(word=>String(word.text||'').toLocaleLowerCase('pt-PT')).join(' ');
  const anchors=['rotina','equipamentos','valores'].filter(anchor=>text.includes(anchor));
  // The aspect check prevents applying this template to another form. At least
  // two printed anchors are required before any fixed regions are considered.
  return {located:Math.abs(aspect-KNOWN_TEMPLATE.aspect)<.08&&anchors.length>=2,anchors,aspect};
}

function reading(section,row,unit){
  return {section,row,value:null,uncertain:false,printedUnit:unit,recordedUnit:null};
}

export function extractionFromLayout(layout){
  if(!layout.located)throw Error('Layout conhecido não localizado.');
  const readings=KNOWN_TEMPLATE.readings.map(([section,row,,,,,unit])=>reading(section,row,unit));
  const checks=KNOWN_TEMPLATE.readings.map(([section,row])=>noCheck(section,row));
  const extraction={
    documentType:empty(FIXTURE_REFERENCE.documentType),
    metadata:{technician:empty(),date:empty(),time:empty()},
    readings,checks,reports:[]
  };
  return validateProviderExtractionV2(extraction);
}

export function measure(extraction,{elapsedMs=0,ocrMs=0,initialBytes=0}={}){
  const returned=new Map(extraction.readings.filter(item=>item.value!==null).map(item=>[item.section+'\u0000'+item.row,item.value]));
  const expected=FIXTURE_REFERENCE.readings;
  let correct=0,incorrect=0,abstained=0;
  for(const [section,row,value] of expected){
    const actual=returned.get(section+'\u0000'+row);
    if(actual===undefined||actual===null)abstained++;
    else if(actual===value)correct++;
    else incorrect++;
  }
  const manualRate=expected.length?abstained/expected.length:1;
  const stopReasons=[];
  if(incorrect)stopReasons.push('valor incorreto devolvido como leitura');
  if(manualRate>POC_LIMITS.maxManualRate)stopReasons.push('mais de 30% dos campos legíveis ficaram por transcrever');
  if(elapsedMs>POC_LIMITS.maxMs)stopReasons.push('timeout superior a 45 segundos');
  if(initialBytes>POC_LIMITS.maxInitialBytes)stopReasons.push('recursos iniciais acima de 50 MB');
  return {expected:expected.length,correct,incorrect,abstained,manualRate,elapsedMs,ocrMs,initialBytes,stopReasons,stopLoss:stopReasons.length>0};
}

export function runDeterministicPipeline(input){
  const layout=locateKnownLayout(input);
  const extraction=extractionFromLayout(layout);
  const contract=mapProviderExtractionV2ToContractV2(extraction);
  return {layout,extraction,contract,metrics:measure(extraction,input)};
}
