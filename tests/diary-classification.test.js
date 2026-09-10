const test=require('node:test');
const assert=require('node:assert/strict');
async function classifier(){return import('../diary-classification.mjs');}

test('classificação determinística usa uma única fonte de verdade para a severidade',async()=>{
 const c=await classifier();
 assert.deepEqual(c.DIARY_CATEGORIES.task,{key:'task',label:'Tarefa',severity:'info'});
 assert.deepEqual(c.DIARY_CATEGORIES.visit,{key:'visit',label:'Visita',severity:'aviso'});
 assert.deepEqual(c.DIARY_CATEGORIES.important,{key:'important',label:'Importante',severity:'urgente'});
});
test('descrições claras sugerem Tarefa, Visita ou Importante; impacto tem precedência',async()=>{
 const c=await classifier();
 assert.equal(c.classifyDiaryDescription('Limpeza de rotina concluída.').category.key,'task');
 assert.equal(c.classifyDiaryDescription('Visita do fornecedor para inspeção externa.').category.key,'visit');
 const result=c.classifyDiaryDescription('Técnico externo reportou fuga urgente; equipamento parado.');
 assert.equal(result.category.key,'important');assert.equal(result.category.severity,'urgente');
});
test('texto vazio ou ambíguo não inventa categoria',async()=>{
 const c=await classifier();
 assert.equal(c.classifyDiaryDescription('').state,'NO_DESCRIPTION');
 assert.equal(c.classifyDiaryDescription('Verificar equipamento.').state,'NEEDS_CONFIRMATION');
});
