import type {
  ClassificationResult,
  HistoryToolResult,
  RiskAssessmentResult,
  TechnicalRecordContext,
  TechnicalSummaryResult,
} from '../types/aiTypes';

export async function runRiskAssessmentAgent(
  _context: TechnicalRecordContext,
  _classification: ClassificationResult,
  _summary: TechnicalSummaryResult,
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

  if (history.entries.length >= 2) {
    return {
      level: 'alto',
      evidence: [
        `${history.entries.length} ocorrências semelhantes indicam repetição do sintoma`,
      ],
      requiresEscalation: true,
      missingInformation: [],
    };
  }

  return {
    level: 'medio',
    evidence: ['Existe uma ocorrência semelhante no histórico'],
    requiresEscalation: false,
    missingInformation: [],
  };
}
