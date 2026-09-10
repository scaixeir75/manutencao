// Referência humana imutável da fixture sintética. Só valores claramente
// visíveis entram nesta lista; campos vazios e traços ficam fora dela.
export const FIXTURE_REFERENCE=Object.freeze({
  documentType:'44 - Rotina Diária',
  readings:Object.freeze([
    ['Eletricidade','Contagem (kWh)','3757950'],
    ['Água','Contagem (m3)','56980'],
    ['Gás','Contagem (m3)','46791'],
    ['Depósitos AQS / Termo-acumuladores','Número 01','60,5'],
    ['Depósitos AQS / Termo-acumuladores','Número 02','60,5'],
    ['Depósitos AQS / Termo-acumuladores','Número 03','62,1'],
    ['Depósitos AQS / Termo-acumuladores','Número 04','62'],
    ['Registo de Temperatura - Máquina Lava-Loiça','Semana 3','60'],
    ['Registo de Temperatura - Máquina Lava-Loiça','Semana 4','60'],
    ['Gases Medicinais','Central Vácuo','-796'],
    ['Análise de Água (Cozinha)','CL Livre','0,53'],
    ['Análise de Água (Cozinha)','CL Total','6,56'],
    ['Análise de Água (Cozinha)','pH','6,89']
  ])
});

export const POC_LIMITS=Object.freeze({maxMs:45000,maxInitialBytes:50*1024*1024,maxManualRate:.30});
