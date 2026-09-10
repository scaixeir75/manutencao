import assert from 'node:assert/strict';
import test from 'node:test';
import {extractionFromLayout,locateKnownLayout,measure,runDeterministicPipeline,wordsFromBlocks} from './poc-core.js';

const words=[{text:'44'},{text:'Rotina'},{text:'Diária'},{text:'Equipamentos'},{text:'Valores'}];
test('localiza o formulário apenas com proporção e âncoras impressas',()=>{
  assert.equal(locateKnownLayout({width:1086,height:1448,words}).located,true);
  assert.equal(locateKnownLayout({width:1086,height:1448,words:[{text:'rotina'}]}).located,false);
});
test('extrai apenas palavras geométricas da saída blocks do Tesseract',()=>{
  const words=wordsFromBlocks([{paragraphs:[{lines:[{words:[{text:'Rotina',bbox:{x0:1,y0:1,x1:2,y1:2}}]}]}]}]);
  assert.deepEqual(words.map(word=>word.text),['Rotina']);
});
test('layout gera ProviderExtractionV2 e Contract v2 com abstenções seguras',()=>{
  const output=runDeterministicPipeline({width:1086,height:1448,words});
  assert.equal(output.contract.schemaVersion,2);
  assert.ok(output.extraction.readings.every(item=>item.value===null));
  assert.ok(output.contract.document.readings.every(item=>item.confidence==='Não confirmado'));
});
test('abstenções acima do limiar acionam stop-loss sem criar valor incorreto',()=>{
  const metrics=measure(extractionFromLayout({located:true}),{elapsedMs:10});
  assert.equal(metrics.incorrect,0);assert.equal(metrics.stopLoss,true);
});
