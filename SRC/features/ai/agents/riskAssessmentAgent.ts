import type {
  ClassificationResult,
  HistoryToolResult,
  RiskAssessmentResult,
  TechnicalRecordContext,
  TechnicalSummaryResult,
} from '../types/aiTypes';

export async function runRiskAssessmentAgent(
  context: TechnicalRecordContext,
  _classification: ClassificationResult,
  summary: TechnicalSummaryResult,
  history: HistoryToolResult,
): Promise<RiskAssessmentResult> {
  if (history.entries.length === 0) {
    return {
      level: 'indeterminado',
      evidence: [],
      requiresEscalation: false,
      missingInformation: [
        'Histórico recente de ocorrências semelhantes',
        'Informação insuficiente para avaliar o risco',
      ],
    };
  }

  const relevantTerms = ['ruído', 'ruido', 'barulho', 'centrifug'];
  const similarOccurrences = history.entries.filter((entry) => {
    const description = entry.description.toLocaleLowerCase('pt-PT');
    return relevantTerms.some((term) => description.includes(term));
  });

  if (similarOccurrences.length >= 2 && context.equipmentCritical) {
    return {
      level: 'alto',
      evidence: [
        `${similarOccurrences.length} ocorrências semelhantes`,
        'Equipamento identificado como crítico',
      ],
      requiresEscalation: true,
      missingInformation: [],
    };
  }

  if (similarOccurrences.length > 0) {
    return {
      level: 'medio',
      evidence: [`${similarOccurrences.length} ocorrência(s) semelhante(s)`],
      requiresEscalation: false,
      missingInformation: [],
    };
  }

  return {
    level: 'indeterminado',
    evidence: [`Sem ocorrências semelhantes a "${summary.summary}"`],
    requiresEscalation: false,
    missingInformation: ['Histórico recente de ocorrências semelhantes'],
  };
}
