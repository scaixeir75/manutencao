export const DIARY_CATEGORIES=Object.freeze({
  task:{key:'task',label:'Tarefa',severity:'info'},
  visit:{key:'visit',label:'Visita',severity:'aviso'},
  important:{key:'important',label:'Importante',severity:'urgente'}
});

const normalize=value=>String(value||'').toLocaleLowerCase('pt-PT').normalize('NFD').replace(/\p{M}+/gu,'').replace(/[^a-z0-9\s-]/g,' ').replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim();
const matches=(text,expression)=>expression.test(text);

export function classifyDiaryDescription(value){
  const text=normalize(value);
  if(!text)return {state:'NO_DESCRIPTION',category:null,message:'Sem descrição: não há sugestão de categoria.'};
  const important=matches(text,/\b(avaria|falha|fuga|incendio|risco|perigo|urgente|equipamento parado|nao funciona|sem funcionar|situacao anomala|por reparar|aguarda reparacao|pendente)\b/);
  const visit=matches(text,/\b(visita|empresa externa|tecnico externo|fornecedor|prestador|inspecao externa)\b/);
  const task=matches(text,/\b(rotina|limpeza|arrumacao|ajuste simples|verificacao concluida|intervencao concluida|reparad[oa]|resolvid[oa]|concluid[oa])\b/);
  // Safety/operational impact takes priority over who performed the work.
  if(important)return {state:'SUGGESTED',category:DIARY_CATEGORIES.important,message:'Sugestão: Importante. Confirma ou corrige antes de guardar.'};
  if(visit)return {state:'SUGGESTED',category:DIARY_CATEGORIES.visit,message:'Sugestão: Visita. Confirma ou corrige antes de guardar.'};
  if(task)return {state:'SUGGESTED',category:DIARY_CATEGORIES.task,message:'Sugestão: Tarefa. Confirma ou corrige antes de guardar.'};
  return {state:'NEEDS_CONFIRMATION',category:null,message:'Categoria necessita confirmação humana.'};
}

export function bindDiaryClassification(documentRef=document){
  const input=documentRef.getElementById('diaryText');
  const output=documentRef.getElementById('diaryCategorySuggestion');
  if(!input||!output)return;
  const render=()=>{
    const result=classifyDiaryDescription(input.value);
    output.textContent=result.message;
    output.dataset.category=result.category?.key||'';
    output.dataset.state=result.state;
  };
  input.addEventListener('input',render);render();
}
