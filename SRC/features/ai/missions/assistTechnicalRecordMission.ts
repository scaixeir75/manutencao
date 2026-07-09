import { orchestrateAssistTechnicalRecord } from '../orchestration/orchestrator';
import type {
  AssistTechnicalRecordMissionResult,
  TechnicalRecordContext,
} from '../types/aiTypes';

export async function assistTechnicalRecord(
  context: TechnicalRecordContext,
): Promise<AssistTechnicalRecordMissionResult> {
  return orchestrateAssistTechnicalRecord(context);
}

