import type {
  PlanningResult,
  RiskAssessmentResult,
  TechnicalRecordContext,
  TechnicalSummaryResult,
} from '../types/aiTypes';

export async function runPlanningAgent(
  context: TechnicalRecordContext,
  summary: TechnicalSummaryResult,
  _risk: RiskAssessmentResult,
): Promise<PlanningResult> {
  const description = `${context.description} ${summary.summary}`
    .toLocaleLowerCase('pt-PT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const includesAny = (terms: string[]) =>
    terms.some((term) => description.includes(term));
  const isMechanicalSymptom = includesAny([
    'ruido',
    'barulho',
    'vibracao',
    'centrifug',
  ]);
  const isWaterLeak = includesAny(['fuga', 'agua', 'pingar']);
  const isHeatingFailure = includesAny([
    'nao aquece',
    'frio',
    'temperatura',
  ]);
  const isPowerFailure = includesAny(['nao liga', 'sem energia']);

  let nextAction = 'Realizar inspeção técnica e recolher mais informação.';

  if (isMechanicalSymptom) {
    nextAction =
      'Verificar rolamentos, fixações, carga e sistema de transmissão.';
  } else if (isWaterLeak) {
    nextAction =
      'Verificar mangueiras, uniões, vedantes e pontos de drenagem.';
  } else if (isHeatingFailure) {
    nextAction =
      'Verificar resistência, termóstato, sensor de temperatura e alimentação.';
  } else if (isPowerFailure) {
    nextAction =
      'Verificar alimentação elétrica, disjuntor, cabo, ficha e painel de comando.';
  }

  return {
    suggestedPriority: _risk.level === 'alto' ? 'alta' : 'media',
    actions: [nextAction],
    dependencies: [],
    completionCriteria: ['Registo revisto e confirmado pelo técnico.'],
  };
}
