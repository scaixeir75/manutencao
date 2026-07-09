import { assistTechnicalRecord } from '../missions/assistTechnicalRecordMission';
import type { MaintenanceRecord } from '../../../shared/types/domain';

const noiseInput = {
  description: 'Máquina de lavar faz ruído durante a centrifugação.',
  date: '2026-07-09',
};

function createHistoryRecord(
  id: string,
  description: string,
): MaintenanceRecord {
  return {
    id,
    title: 'Ocorrência histórica',
    description,
    type: 'Importante',
    date: '2026-07-01',
    photos: [],
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function testAssistTechnicalRecordMission() {
  const unrelatedHistory = [
    createHistoryRecord('history-unrelated', 'Filtro limpo durante a visita.'),
  ] as const;
  const noMatchResult = await assistTechnicalRecord(noiseInput, {
    historyRecords: unrelatedHistory,
  });

  assert(
    noMatchResult.history.entries.length === 0,
    'O histórico sem palavras-chave equivalentes não deve ser devolvido.',
  );
  assert(
    noMatchResult.response.risk.level === 'indeterminado',
    'Sem histórico relevante, o risco deve ser indeterminado.',
  );

  const oneSimilarRecord = [
    createHistoryRecord(
      'history-noise-001',
      'Detetado barulho durante o funcionamento.',
    ),
  ] as const;
  const oneMatchSnapshot = JSON.stringify(oneSimilarRecord);
  const mediumRiskResult = await assistTechnicalRecord(noiseInput, {
    historyRecords: oneSimilarRecord,
  });

  assert(
    mediumRiskResult.history.entries.length === 1,
    'Uma ocorrência equivalente deve ser devolvida.',
  );
  assert(
    mediumRiskResult.response.risk.level === 'medio',
    'Uma ocorrência semelhante deve resultar em risco médio.',
  );
  assert(
    JSON.stringify(oneSimilarRecord) === oneMatchSnapshot,
    'A consulta não pode alterar os registos históricos.',
  );

  const twoSimilarRecords = [
    ...oneSimilarRecord,
    createHistoryRecord(
      'history-noise-002',
      'Registada vibração forte ao centrifugar.',
    ),
  ] as const;
  const highRiskResult = await assistTechnicalRecord(noiseInput, {
    historyRecords: twoSimilarRecords,
  });

  assert(
    highRiskResult.history.entries.length === 2,
    'Duas ocorrências equivalentes devem ser devolvidas.',
  );
  assert(
    highRiskResult.response.risk.level === 'alto',
    'Duas ocorrências semelhantes devem resultar em risco alto.',
  );

  const leakResult = await assistTechnicalRecord({
    description: 'Máquina com fuga de água junto à drenagem.',
    date: '2026-07-09',
  });
  assert(
    leakResult.response.plan.actions[0] ===
      'Verificar mangueiras, uniões, vedantes e pontos de drenagem.',
    'Uma fuga deve produzir uma ação específica para o circuito de água.',
  );

  const heatingResult = await assistTechnicalRecord({
    description: 'A máquina não aquece durante o programa.',
    date: '2026-07-09',
  });
  assert(
    heatingResult.response.plan.actions[0] ===
      'Verificar resistência, termóstato, sensor de temperatura e alimentação.',
    'Uma falha de aquecimento deve produzir uma ação específica.',
  );

  const powerResult = await assistTechnicalRecord({
    description: 'O equipamento não liga e está sem energia.',
    date: '2026-07-09',
  });
  assert(
    powerResult.response.plan.actions[0] ===
      'Verificar alimentação elétrica, disjuntor, cabo, ficha e painel de comando.',
    'Uma falha de alimentação deve produzir uma ação específica.',
  );

  assert(
    highRiskResult.classification.requiresConfirmation &&
      highRiskResult.response.confirmationMessage.length > 0,
    'A validação humana deve continuar obrigatória.',
  );

  return {
    semHistoricoRelevante: noMatchResult.response.risk.level,
    umaOcorrenciaSemelhante: mediumRiskResult.response.risk.level,
    duasOcorrenciasSemelhantes: highRiskResult.response.risk.level,
    proximaAcaoFuga: leakResult.response.plan.actions[0],
    proximaAcaoAquecimento: heatingResult.response.plan.actions[0],
    validacaoHumana: true,
  };
}

testAssistTechnicalRecordMission()
  .then((output) => {
    console.log(JSON.stringify(output, null, 2));
  })
  .catch((error: unknown) => {
    console.error(error);
    throw error;
  });
