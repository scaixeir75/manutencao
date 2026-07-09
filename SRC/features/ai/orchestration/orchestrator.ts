import { runClassificationAgent } from '../agents/classificationAgent';
import { runPlanningAgent } from '../agents/planningAgent';
import { runResponseCompositionAgent } from '../agents/responseCompositionAgent';
import { runRiskAssessmentAgent } from '../agents/riskAssessmentAgent';
import { runTechnicalSummaryAgent } from '../agents/technicalSummaryAgent';
import { consultHistory } from '../tools/historyTool';
import type {
  AssistTechnicalRecordMissionResult,
  TechnicalRecordContext,
} from '../types/aiTypes';

export async function orchestrateAssistTechnicalRecord(
  context: TechnicalRecordContext,
): Promise<AssistTechnicalRecordMissionResult> {
  const classification = await runClassificationAgent(context);
  const summary = await runTechnicalSummaryAgent(context, classification);
  const history = await consultHistory(context);
  const risk = await runRiskAssessmentAgent(
    context,
    classification,
    summary,
    history,
  );
  const plan = await runPlanningAgent(context, summary, risk);
  const response = await runResponseCompositionAgent({
    classification,
    summary,
    history,
    risk,
    plan,
  });

  return {
    response,
    classification,
    summary,
    history,
  };
}

