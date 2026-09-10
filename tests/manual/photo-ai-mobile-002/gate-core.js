// Field identity is supplied by the application/template, never by the model.
export const fields=Object.freeze([
  {id:'aqs01',section:'Depósitos AQS',row:'Número 01',box:[592,303,744,329],expected:'60,5',unit:'°C'},
  {id:'aqs02',section:'Depósitos AQS',row:'Número 02',box:[592,329,744,353],expected:'60,5',unit:'°C'},
  {id:'aqs03',section:'Depósitos AQS',row:'Número 03',box:[592,353,744,376],expected:'62,1',unit:'°C'},
  {id:'aqs04',section:'Depósitos AQS',row:'Número 04',box:[592,376,744,397],expected:'62',unit:'°C'},
  {id:'dish03',section:'Máquina Lava-Loiça',row:'Semana 3',box:[592,447,744,473],expected:'60',unit:'°C'},
  {id:'dish04',section:'Máquina Lava-Loiça',row:'Semana 4',box:[592,473,744,497],expected:'60',unit:'°C'},
  {id:'freeCl',section:'Análise de Água',row:'CL Livre',box:[426,592,580,621],expected:'0,53',unit:null},
  {id:'totalCl',section:'Análise de Água',row:'CL Total',box:[426,621,580,644],expected:'6,56',unit:null},
  {id:'ph',section:'Análise de Água',row:'pH',box:[426,644,580,664],expected:'6,89',unit:null}
]);
export function parseCell(raw){
  const value=typeof raw==='string'?raw.trim():'';
  return /^[+-]?\d{1,8}(?:[.,]\d{1,3})?$/.test(value)?value.replace('.',','):null;
}
export function extraction(values){
  if(values.length!==fields.length)throw Error('INCOMPLETE');
  return {documentType:{value:'DAILY_RECORD',uncertain:false},metadata:{date:{value:null,uncertain:false},time:{value:null,uncertain:false},technician:{value:null,uncertain:false}},readings:fields.map((f,i)=>({section:f.section,row:f.row,value:parseCell(values[i]),uncertain:parseCell(values[i])!==null,printedUnit:f.unit,recordedUnit:null})),checks:[],reports:[]};
}
export function score(values){const correct=fields.filter((f,i)=>parseCell(values[i])===f.expected).length;return {expected:fields.length,correct,abstained:values.filter(v=>parseCell(v)===null).length,thresholdPassed:correct/fields.length>=.7,fullGatePassed:false};}
