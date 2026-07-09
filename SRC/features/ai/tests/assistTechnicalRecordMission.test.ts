import { assistTechnicalRecord } from '../missions/assistTechnicalRecordMission';
import type { AssistTechnicalRecordMissionResult } from '../types/aiTypes';

const input = {
  description: 'Máquina de lavar faz ruído durante a centrifugação.',
  date: '2026-07-09',
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function validateResult(result: AssistTechnicalRecordMissionResult) {
  const { response } = result;

  assert(response.suggestedType, 'O tipo de registo é obrigatório.');
  assert(
    response.suggestedType !== 'Tarefa',
    'Um ruído durante a centrifugação não deve ser classificado como Tarefa.',
  );
  assert(response.plan.suggestedPriority, 'A prioridade é obrigatória.');
  assert(response.technicalSummary, 'O resumo técnico é obrigatório.');
  assert(response.risk.level, 'O nível de risco é obrigatório.');
  assert(response.plan.actions[0], 'A próxima ação é obrigatória.');
  assert(
    Array.isArray(response.missingInformation),
    'A informação em falta deve ser uma lista.',
  );
  assert(
    response.missingInformation.length > 0,
    'A resposta deve indicar a informação em falta.',
  );
  assert(response.confirmationMessage, 'A validação humana é obrigatória.');
  assert(
    result.classification.requiresConfirmation,
    'A classificação deve exigir confirmação humana.',
  );
}

export async function testAssistTechnicalRecordMission() {
  const result = await assistTechnicalRecord(input);

  validateResult(result);

  return {
    tipoDeRegisto: result.response.suggestedType,
    prioridade: result.response.plan.suggestedPriority,
    resumo: result.response.technicalSummary,
    risco: result.response.risk.level,
    proximaAcao: result.response.plan.actions[0],
    informacaoEmFalta: result.response.missingInformation,
    validacaoHumana: result.response.confirmationMessage,
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
