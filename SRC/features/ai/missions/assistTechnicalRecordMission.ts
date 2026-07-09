import { orchestrateAssistTechnicalRecord } from '../orchestration/orchestrator';
import type {
  AIMissionDependencies,
  AssistTechnicalRecordMissionResult,
  TechnicalRecordContext,
} from '../types/aiTypes';

export async function assistTechnicalRecord(
  context: TechnicalRecordContext,
  dependencies: AIMissionDependencies = {},
): Promise<AssistTechnicalRecordMissionResult> {
  return orchestrateAssistTechnicalRecord(context, dependencies);
}
