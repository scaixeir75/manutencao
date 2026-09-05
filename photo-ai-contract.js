(function(root){
  'use strict';
  const names=['date','equipment','work','status','notes','anomaly'];
  const confidence=['Reconhecido','Duvidoso','Não confirmado'];
  const field={type:'object',additionalProperties:false,required:['value','confidence','evidence','reason'],properties:{value:{type:['string','null'],maxLength:4000},confidence:{type:'string',enum:confidence},evidence:{type:['string','null'],maxLength:4000},reason:{type:'string',maxLength:500}}};
  const schema={type:'object',additionalProperties:false,required:['schemaVersion','fields','warnings'],properties:{schemaVersion:{type:'integer',enum:[1]},fields:{type:'object',additionalProperties:false,required:names,properties:Object.fromEntries(names.map(n=>[n,field]))},warnings:{type:'array',maxItems:10,items:{type:'string',maxLength:500}}}};
  function exact(o,keys){return o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));}
  function validate(data){
    if(!exact(data,['schemaVersion','fields','warnings'])||data.schemaVersion!==1||!exact(data.fields,names)||!Array.isArray(data.warnings)||data.warnings.length>10||data.warnings.some(w=>typeof w!=='string'||w.length>500))throw Error('Resposta de análise inválida.');
    for(const n of names){const f=data.fields[n];
      if(!exact(f,['value','confidence','evidence','reason'])||!confidence.includes(f.confidence)||typeof f.reason!=='string'||f.reason.length>500||[f.value,f.evidence].some(v=>v!==null&&(typeof v!=='string'||!v.trim()||v.length>4000)))throw Error('Campo de análise inválido.');
      if(f.confidence==='Não confirmado'?(f.value!==null):(f.value===null||f.evidence===null))throw Error('Informação sem evidência.');
      if(f.confidence!=='Reconhecido'&&!f.reason.trim())throw Error('Falta explicar a incerteza.');
    }
    const date=data.fields.date.value;
    if(date!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))throw Error('Data inválida.');
    if(![null,'Concluído','Pendente'].includes(data.fields.status.value))throw Error('Estado inválido.');
    return data;
  }
  const api={names,schema,validate};
  if(typeof module!=='undefined')module.exports=api;else root.PhotoAiContract=api;
})(typeof globalThis==='undefined'?this:globalThis);
