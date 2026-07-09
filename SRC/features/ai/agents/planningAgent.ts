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
  const description = `${context.description} ${summary.summary}`.toLocaleLowerCase('pt-PT');
  const isSpinNoise =
    (description.includes('ruído') ||
      description.includes('ruido') ||
      description.includes('barulho')) &&
    description.includes('centrifug');

  return {
    suggestedPriority: isSpinNoise ? 'media' : 'baixa',
    actions: isSpinNoise
      ? ['Verificar rolamentos, fixações, carga e sistema de transmissão.']
      : ['Validar o registo com o técnico responsável.'],
    dependencies: [],
    completionCriteria: ['Registo revisto e confirmado pelo técnico.'],
  };
}
