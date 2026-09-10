import {normalizeStructuredData,validateField} from './photo-ai-assisted-core.mjs';
const states=['Não registado','OK','NOK'];
export const fields=[
 ['generator','Grupo Gerador — quartos','generator','fuel','level',null,['Não registado','1/4','2/4','3/4','4/4']],
 ...[1,2,3,4].flatMap(i=>[[`aqs${i}`,`AQS ${String(i).padStart(2,'0')} — temperatura`,'aqs',String(i).padStart(2,'0'),'temperature','°C'],[`aqs${i}Status`,`AQS ${String(i).padStart(2,'0')} — estado`,'aqs',String(i).padStart(2,'0'),'check',null,states]]),
 ...[1,2,3,4,5].flatMap(i=>[[`dish${i}`,`Lava-Loiça — Semana ${i} temperatura`,'dishwasher',`week${i}`,'temperature','°C'],[`dish${i}Status`,`Lava-Loiça — Semana ${i} estado`,'dishwasher',`week${i}`,'check',null,states]]),
 ['electricity','Eletricidade','counters','electricity','counter','kWh'],['water','Água','counters','water','counter','m3'],['gas','Gás','counters','gas','counter','m3'],
 ['freeCl','CL Livre','water','free','chlorine',null],['totalCl','CL Total','water','total','chlorine',null],['ph','pH','water','ph','ph','pH'],['vacuum','Central Vácuo — valor','vacuum','central','pressure',null]
];
export function openAssistedForm({existing=null,canEdit,canSave,date,fichaId,fichaName,confirm,allocateId,save,notify}){
 const previous=document.getElementById('assistedRoutineModal');previous?.closeAssisted?.();
 if(String(fichaId)!=='44'||(existing&&!canEdit(existing))){notify('Dados da folha disponíveis apenas para a Ficha 44 e dentro do prazo de edição.');return;}
 const modal=document.createElement('div');modal.id='assistedRoutineModal';modal.className='confirm-overlay open';modal.style.zIndex='299';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Preencher dados da folha');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 modal.innerHTML=`<div class="confirm-box" style="max-height:90vh;overflow:auto;width:min(620px,94vw);box-sizing:border-box;text-align:left"><h3>Preencher dados da folha — Ficha 44</h3><p>Preenchimento humano. Fotografia opcional, apenas como referência temporária neste dispositivo.</p><label>Fotografia de referência<input data-assisted-photo type="file" accept="image/png,image/jpeg,image/webp"><img data-assisted-photo-preview alt="Referência temporária" style="display:none;max-width:100%"></label><fieldset data-assisted-fields style="min-width:0;border:0;padding:0">${fields.map(([id,label,,,,unit,opts])=>`<label style="display:block;margin:8px 0">${esc(label)} ${esc(unit||'')}${opts?`<select data-assisted="${id}" style="width:100%;padding:8px">${opts.map(x=>`<option>${esc(x)}</option>`).join('')}</select>`:`<input data-assisted="${id}" inputmode="decimal" style="width:100%;box-sizing:border-box;padding:8px">`}</label>`).join('')}<label>Central Vácuo — unidade registada (unidade impressa: Bar)<input data-assisted="vacuumUnit" style="width:100%;box-sizing:border-box"></label><label>Relatório — um assunto por linha<textarea data-assisted="reportItems" style="width:100%;box-sizing:border-box"></textarea></label></fieldset><p data-assisted-error role="status"></p><div><button type="button" data-assisted-action="cancel">Cancelar</button><button type="button" data-assisted-action="preview">Pré-visualizar</button></div><div data-assisted-preview></div></div>`;
 document.body.append(modal);
 const control=id=>modal.querySelector(`[data-assisted="${id}"]`),fieldset=modal.querySelector('fieldset'),preview=modal.querySelector('[data-assisted-preview]'),error=modal.querySelector('[data-assisted-error]'),photo=modal.querySelector('[data-assisted-photo]'),img=modal.querySelector('img');
 // Editing changes only explicit form fields, not metadata or legacy extensions.
 const source=existing?.structuredData?structuredClone(existing.structuredData):normalizeStructuredData();
 source.measurements||=[];source.checks||=[];source.reportItems||=[];
 const key=m=>`${m.section}|${m.item}|${m.type}`;
 const by=new Map(source.measurements.map(m=>[key(m),m]));
 for(const [id,,section,item,type] of fields){const m=by.get(`${section}|${item}|${type}`);control(id).value=type==='check'?(m?.status||source.checks.find(c=>c.section===section&&c.item===item)?.status||'Não registado'):(m?.value??(id==='generator'?'Não registado':''));}
 control('vacuumUnit').value=by.get('vacuum|central|pressure')?.recordedUnit||'';control('reportItems').value=source.reportItems.join('\n');
 const initial=new Map([...modal.querySelectorAll('[data-assisted]')].map(c=>[c.dataset.assisted,c.value]));
 let url=null,closed=false,busy=false,writing=false,targetId=existing?.id||null,draft=null;
 function cleanupPhoto(){if(url)URL.revokeObjectURL(url);url=null;photo.value='';img.removeAttribute('src');img.style.display='none';}
 function close(){if(writing)return;closed=true;cleanupPhoto();draft=null;document.removeEventListener('keydown',escape);window.removeEventListener('pagehide',pagehide);modal.remove();}
 function escape(e){if(e.key==='Escape'){e.stopImmediatePropagation();close();}}
 function pagehide(){writing=false;close();}
 modal.closeAssisted=close;document.addEventListener('keydown',escape);window.addEventListener('pagehide',pagehide);
 modal.addEventListener('click',e=>{if(e.target===modal)close();});
 photo.onchange=()=>{const file=photo.files?.[0];if(!file)return;cleanupPhoto();if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024){error.textContent='Fotografia inválida ou superior a 8 MB.';return;}url=URL.createObjectURL(file);img.src=url;img.style.display='block';};
 modal.querySelector('[data-assisted-action="cancel"]').onclick=close;
 function build(){
  const data=structuredClone(source),map=new Map(data.measurements.map(m=>[key(m),m]));
  for(const [id,label,section,item,type,unit] of fields){
   if(existing&&control(id).value===initial.get(id)&&!(id==='vacuum'&&control('vacuumUnit').value!==initial.get('vacuumUnit')))continue;
   const raw=control(id).value.trim(),value=raw==='Não registado'?null:validateField(id,raw);
   if(type!=='check'&&raw&&raw!=='Não registado'&&value===null)throw Error(`Valor inválido: ${label}.`);
   const k=`${section}|${item}|${type}`,previous=map.get(k),m={...(previous||{}),section,item,type,value:type==='check'?null:value,unit:previous?previous.unit:unit,status:type==='check'?raw:(previous?.status??null)};
   if(m.unit===undefined)m.unit=unit;
   if(id==='vacuum'){m.printedUnit=map.get(k)?.printedUnit||'Bar';m.recordedUnit=control('vacuumUnit').value.trim()||null;}
   map.set(k,m);
   // Legacy checks remain supported; only one representation for an edited check.
   if(type==='check')data.checks=data.checks.filter(c=>c.section!==section||c.item!==item);
  }
  data.measurements=[...map.values()];
  if(control('reportItems').value!==initial.get('reportItems'))data.reportItems=control('reportItems').value.split('\n').map(s=>s.trim()).filter(Boolean);
  return existing?data:normalizeStructuredData(data);
 }
 const previewButton=modal.querySelector('[data-assisted-action="preview"]');
 previewButton.onclick=()=>{
  try{draft=build();error.textContent='';}catch(e){error.textContent=e.message;return;}
  fieldset.hidden=true;fieldset.disabled=true;previewButton.hidden=true;
  preview.innerHTML='<h4>Pré-visualização</h4>'+draft.measurements.map(m=>`<p>${esc(m.section)} — ${esc(m.item)}: ${esc(m.type==='check'?m.status||'Não registado':m.value??'Não registado')} ${esc(m.recordedUnit||m.unit||'')}${m.printedUnit?` (impresso: ${esc(m.printedUnit)})`:''}</p>`).join('')+draft.checks.map(c=>`<p>${esc(c.section)} — ${esc(c.item)}: ${esc(c.status)}</p>`).join('')+draft.reportItems.map(x=>`<p>${esc(x)}</p>`).join('')+'<button type="button" data-assisted-action="back">Voltar e corrigir</button> <button type="button" data-assisted-action="confirm">Confirmar</button>';
  const back=preview.querySelector('[data-assisted-action="back"]'),button=preview.querySelector('[data-assisted-action="confirm"]');
  back.onclick=()=>{if(busy)return;draft=null;preview.replaceChildren();fieldset.hidden=false;fieldset.disabled=false;previewButton.hidden=false;};
  button.onclick=async()=>{
   if(busy||closed)return;busy=true;button.disabled=true;back.disabled=true;
   try{
    if(!await confirm('Confirmar gravação dos dados estruturados?'))return;
    if(closed)return;
    if(!canSave()||(existing&&!canEdit(existing)))throw Error('Sessão indisponível ou prazo de edição expirado.');
    // Freeze a stable identity before the write so a retry cannot create duplicates.
    targetId=targetId||allocateId();
    const entry={...(existing||{}),text:existing?.text||'Preenchimento assistido da Rotina Diária',severity:existing?.severity||'info',date:existing?.date||date,timestamp:existing?.timestamp||new Date().toISOString(),fichaId:String(fichaId),fichaNome:existing?.fichaNome||fichaName,structuredData:draft};delete entry.id;
    if(existing)entry.editedAt=new Date().toISOString();
    writing=true;await save(entry,targetId);writing=false;close();notify('Dados estruturados guardados após confirmação.');
   }catch{error.textContent='Não foi possível guardar. Verifique a sessão e a ligação; pode tentar novamente.';}
   finally{writing=false;cleanupPhoto();busy=false;if(!closed){button.disabled=false;back.disabled=false;}}
  };
 };
 return modal;
}
