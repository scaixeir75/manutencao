const FUEL=new Set(['1/4','2/4','3/4','4/4']);
const STATES=['OK','NOK','Não registado'];
export function validateField(field,value){
 if(value==null||String(value).trim()==='')return null;
 const s=String(value).trim();
 if(field==='generator')return FUEL.has(s)?s:null;
 return /^[+-]?\d+(?:[.,]\d+)?$/.test(s)&&Number.isFinite(Number(s.replace(',','.')))?Number(s.replace(',','.')):null;
}
export function normalizeStructuredData(data={}){
 return {templateId:data.templateId||'rotina-diaria-v1',source:'assisted_form',measurements:(data.measurements||[]).map(m=>({section:String(m.section||''),item:String(m.item||''),type:String(m.type||''),value:validateField(m.section==='generator'&&m.type==='level'?'generator':'number',m.value),unit:m.unit??null,status:STATES.includes(m.status)?m.status:null,printedUnit:m.printedUnit??null,recordedUnit:m.recordedUnit??null})),checks:(data.checks||[]).map(c=>({section:String(c.section||''),item:String(c.item||''),status:STATES.includes(c.status)?c.status:'Não registado'})),reportItems:(data.reportItems||[]).map(String)};
}
export function validateAssistedRecord(record){const r={...record};if(r.structuredData)r.structuredData=normalizeStructuredData(r.structuredData);return r;}
const mirror=r=>r.diaryId!=null&&(r.source==='diary'||String(r.id)===`diary_${r.diaryId}`);
export function dedupeDiaryHistory(rows=[]){
 // Prefer canonical rows even when the mirror arrives first; never dedupe anonymous text.
 const originals=new Set(rows.filter(r=>!mirror(r)&&r.id!=null&&r.source!=='diary').map(r=>String(r.id)));
 const seen=new Set();return rows.filter(r=>{if(mirror(r)&&originals.has(String(r.diaryId)))return false;const key=r.id==null?Symbol():mirror(r)?`mirror:${r.fichaId||''}:${r.diaryId}`:`record:${r.fichaId||''}:${r.id}`;if(seen.has(key))return false;seen.add(key);return true;});
}
const dateOf=r=>String(r.date||r.timestamp||'').slice(0,10);
const inPeriod=(r,{from,to})=>(!from&&!to)||(!!dateOf(r)&&(!from||dateOf(r)>=from)&&(!to||dateOf(r)<=to));
export function structuredMeasurements(rows=[],o={}){return rows.filter(r=>inPeriod(r,o)).flatMap(r=>(r.structuredData?.measurements||[]).filter(m=>(!o.section||m.section===o.section)&&(!o.item||m.item===o.item)&&(!o.type||m.type===o.type)&&m.value!=null&&m.value!=='').map(m=>({...m,date:dateOf(r),timestamp:r.timestamp||'',recordId:r.id})));}
export function aggregateMeasurements(rows,o={}){
 const values=structuredMeasurements(dedupeDiaryHistory(rows),o).sort((a,b)=>a.date.localeCompare(b.date)||a.timestamp.localeCompare(b.timestamp)||String(a.recordId).localeCompare(String(b.recordId))).map(x=>validateField('number',x.value)).filter(x=>x!==null);
 if(!values.length)return {count:0,average:null,min:null,max:null,last:null};return {count:values.length,average:values.reduce((a,b)=>a+b,0)/values.length,min:Math.min(...values),max:Math.max(...values),last:values.at(-1)};
}
function checksFor(rows,o={}){return dedupeDiaryHistory(rows).filter(r=>inPeriod(r,o)).flatMap(r=>{const by=new Map();for(const c of [...(r.structuredData?.checks||[]),...(r.structuredData?.measurements||[]).filter(m=>m.type==='check')])if((!o.section||c.section===o.section)&&(!o.item||c.item===o.item))by.set(`${c.section}|${c.item}`,c);return [...by.values()];});}
export function countChecks(rows,status,o={}){return checksFor(rows,o).filter(c=>c.status===status).length;}
export function tryStructuredQuery(question,rows=[],{normalize=s=>String(s).toLowerCase().normalize('NFD').replace(/\p{M}+/gu,''),now=new Date()}={}){
 const q=normalize(question);if(!/\baqs(?:\b|0?[1-4]\b)/.test(q))return null;
 const metric=/\bmedia\b/.test(q)?'average':/\bminim/.test(q)?'min':/\bmaxim/.test(q)?'max':/\bultim/.test(q)?'last':/\bnok\b/.test(q)?'countNok':/\bok\b/.test(q)?'countOk':null;if(!metric)return null;
 const sub=q.match(/\baqs\s*0?([1-4])\b/)?.[1];if(!sub)return {status:'AMBIGUOUS_SUBITEM',message:'Indica AQS 01, 02, 03 ou 04.'};
 const months=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
 const month=q.match(new RegExp(`\\b(${months.join('|')})\\b(?:\\s+(?:de\\s+)?(\\d{4}))?`));
 if((!month&&/\b(ontem|hoje|semana|mes|ano|entre|desde|ate)\b|\d{4}|\d{1,2}[/-]\d/.test(q))||(q.match(new RegExp(`\\b(${months.join('|')})\\b`,'g'))||[]).length>1)return {status:'INSUFFICIENT_DATA',message:'Informação insuficiente. Indica um único mês e ano para esta consulta estruturada.'};
 const year=Number(month?.[2]||now.getFullYear()),index=months.indexOf(month?.[1]),prefix=`${year}-${String(index+1).padStart(2,'0')}`;
 const o={section:'aqs',item:sub.padStart(2,'0'),type:'temperature',from:month?`${prefix}-01`:undefined,to:month?`${prefix}-${new Date(year,index+1,0).getDate()}`:undefined};const period=month?`${month[1]} de ${year}`:'todo o histórico';
 if(metric.startsWith('count')){const checks=checksFor(rows,o).filter(c=>['OK','NOK'].includes(c.status));if(!checks.length)return {status:'INSUFFICIENT_DATA',message:'Informação insuficiente.'};const wanted=metric==='countNok'?'NOK':'OK',result=checks.filter(c=>c.status===wanted).length;return {status:'OK',metric,result,context:`AQS ${o.item} · ${period} · ${wanted}: ${result}`};}
 const readings=structuredMeasurements(dedupeDiaryHistory(rows),o);if(readings.some(m=>m.unit!=null&&m.unit!=='°C'))return {status:'INSUFFICIENT_DATA',message:'Informação insuficiente. Unidades incompatíveis; não foi efetuada conversão.'};
 const result=aggregateMeasurements(rows,o);if(!result.count)return {status:'INSUFFICIENT_DATA',message:'Informação insuficiente.'};const label={average:'média',min:'mínimo',max:'máximo',last:'última leitura'}[metric];return {status:'OK',metric,result:result[metric],count:result.count,context:`AQS ${o.item} · ${period} · ${label} · ${result.count} leituras: ${result[metric]} °C`};
}
