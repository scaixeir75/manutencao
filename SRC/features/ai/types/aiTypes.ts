import type { MaintenanceRecordType } from '../../../shared/types/domain';

export type ConfidenceLevel = number;

export type RiskLevel = 'baixo' | 'medio' | 'alto' | 'indeterminado';

export type SuggestedPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type AIRecordClassification =
  | MaintenanceRecordType
  | 'Anomalia / Corretiva';

export type TechnicalRecordContext = {
  description: string;
  date: string;
  equipmentId?: string;
  equipmentModel?: string;
  equipmentCritical?: boolean;
  sheetId?: string;
  initialType?: MaintenanceRecordType;
  photos?: string[];
  actionsAlreadyTaken?: string[];
};

export type ClassificationResult = {
  suggestedType: AIRecordClassification;
  confidence: ConfidenceLevel;
  justification: string;
  requiresConfirmation: boolean;
};

export type TechnicalSummaryResult = {
  summary: string;
  preservedFacts: string[];
  missingInformation: string[];
  requiresConfirmation: boolean;
};

export type HistoryEntry = {
  id: string;
  date: string;
  description: string;
  equipmentId?: string;
};

export type HistoryToolResult = {
  entries: HistoryEntry[];
  source: 'simulated';
};

export type EquipmentToolResult = {
  equipment: {
    id: string;
    name: string;
    location?: string;
  } | null;
  source: 'simulated';
};

export type PhotosToolResult = {
  photos: string[];
  source: 'simulated';
};

export type RiskAssessmentResult = {
  level: RiskLevel;
  evidence: string[];
  immediateSuggestedAction?: string;
  requiresEscalation: boolean;
  missingInformation: string[];
};

export type PlanningResult = {
  suggestedPriority: SuggestedPriority;
  actions: string[];
  dependencies: string[];
  completionCriteria: string[];
};

export type ComposedResponse = {
  suggestedType: AIRecordClassification;
  technicalSummary: string;
  risk: RiskAssessmentResult;
  plan: PlanningResult;
  missingInformation: string[];
  consultedSources: string[];
  confirmationMessage: string;
};

export type AssistTechnicalRecordMissionResult = {
  response: ComposedResponse;
  classification: ClassificationResult;
  summary: TechnicalSummaryResult;
  history: HistoryToolResult;
};
