import type {
  ClassificationResult,
  TechnicalRecordContext,
  TechnicalSummaryResult,
} from '../types/aiTypes';

export async function runTechnicalSummaryAgent(
  context: TechnicalRecordContext,
  _classification: ClassificationResult,
): Promise<TechnicalSummaryResult> {
  const description = context.description.trim();
  const normalizedDescription = description.toLocaleLowerCase('pt-PT');
  const isSpinNoise =
    (normalizedDescription.includes('ruído') ||
      normalizedDescription.includes('ruido') ||
      normalizedDescription.includes('barulho')) &&
    normalizedDescription.includes('centrifug');
  const missingInformation = [];

  if (!context.equipmentModel) {
    missingInformation.push('Modelo do equipamento');
  }
  if (!context.photos?.length) {
    missingInformation.push('Fotografia');
  }
  if (!description) {
    missingInformation.push('Descrição do registo');
  }

  return {
    summary: isSpinNoise
      ? 'Ruído anormal durante a centrifugação.'
      : description || 'Resumo técnico indisponível.',
    preservedFacts: description ? [description] : [],
    missingInformation,
    requiresConfirmation: true,
  };
}
