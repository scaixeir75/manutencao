import type {
  HistoryToolResult,
  TechnicalRecordContext,
} from '../types/aiTypes';
import type { MaintenanceRecord } from '../../../shared/types/domain';

const technicalKeywordGroups = [
  ['ruido', 'barulho', 'vibracao'],
  ['centrifugacao', 'centrifugar'],
  ['fuga', 'agua', 'pingar'],
  ['erro', 'codigo', 'avaria'],
  ['nao aquece', 'frio', 'temperatura'],
  ['nao liga', 'sem energia'],
] as const;

function normalizeText(text: string) {
  return text
    .toLocaleLowerCase('pt-PT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getMatchingGroups(text: string) {
  const normalizedText = normalizeText(text);

  return technicalKeywordGroups.filter((group) =>
    group.some((term) => normalizedText.includes(term)),
  );
}

export async function consultHistory(
  context: TechnicalRecordContext,
  records: readonly MaintenanceRecord[] = [],
): Promise<HistoryToolResult> {
  const currentGroups = getMatchingGroups(context.description);

  if (currentGroups.length === 0) {
    return {
      entries: [],
      source: 'records',
    };
  }

  const relevantRecords = records.filter((record) => {
    const historicalGroups = getMatchingGroups(record.description);
    return currentGroups.some((group) => historicalGroups.includes(group));
  });

  return {
    entries: relevantRecords.map((record) => ({
      id: record.id,
      date: record.date,
      description: record.description,
      equipmentId: record.equipmentId,
    })),
    source: 'records',
  };
}
