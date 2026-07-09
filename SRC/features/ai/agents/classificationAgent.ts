import type {
  ClassificationResult,
  TechnicalRecordContext,
} from '../types/aiTypes';

export async function runClassificationAgent(
  context: TechnicalRecordContext,
): Promise<ClassificationResult> {
  const description = context.description.toLocaleLowerCase('pt-PT');
  const anomalyTerms = [
    'ruído',
    'ruido',
    'barulho',
    'avaria',
    'erro',
    'fuga',
    'não aquece',
    'nao aquece',
    'não liga',
    'nao liga',
  ];
  const detectedTerm = anomalyTerms.find((term) => description.includes(term));

  if (detectedTerm) {
    return {
      suggestedType: 'Anomalia / Corretiva',
      confidence: 0.9,
      justification: `Foi detetado um indício de anomalia: "${detectedTerm}".`,
      requiresConfirmation: true,
    };
  }

  return {
    suggestedType: context.initialType ?? 'Tarefa',
    confidence: context.initialType ? 1 : 0.5,
    justification: context.initialType
      ? 'Foi mantido o tipo indicado no contexto.'
      : 'Resultado simulado até existir um mecanismo de classificação.',
    requiresConfirmation: !context.initialType,
  };
}
