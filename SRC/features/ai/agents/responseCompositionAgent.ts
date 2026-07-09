import type {
  ClassificationResult,
  ComposedResponse,
  HistoryToolResult,
  PlanningResult,
  RiskAssessmentResult,
  TechnicalSummaryResult,
} from '../types/aiTypes';

type ResponseCompositionInput = {
  classification: ClassificationResult;
  summary: TechnicalSummaryResult;
  history: HistoryToolResult;
  risk: RiskAssessmentResult;
  plan: PlanningResult;
};

export async function runResponseCompositionAgent({
  classification,
  summary,
  history,
  risk,
  plan,
}: ResponseCompositionInput): Promise<ComposedResponse> {
  return {
    suggestedType: classification.suggestedType,
    technicalSummary: summary.summary,
    risk,
    plan,
    missingInformation: [
      ...new Set([...summary.missingInformation, ...risk.missingInformation]),
    ],
    consultedSources: history.source === 'records' ? ['Histórico de registos'] : [],
    confirmationMessage: 'Confirme ou corrija a sugestão antes de gravar o registo.',
  };
}
