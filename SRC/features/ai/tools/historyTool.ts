import type {
  EquipmentHistoryToolResult,
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
function getRecordTime(record: MaintenanceRecord) {
  const time = Date.parse(record.date);
  return Number.isNaN(time) ? null : time;
}

export async function consultarHistoricoEquipamento(
  equipamentoId: string | undefined,
  records: readonly MaintenanceRecord[],
  limite?: number,
): Promise<EquipmentHistoryToolResult> {
  const normalizedEquipmentId = equipamentoId?.trim();

  if (!normalizedEquipmentId) {
    return {
      entries: [],
      error: 'identificador_em_falta',
      message: 'Identificador do equipamento em falta',
    };
  }

  const matchingRecords = records
    .filter((record) => record.equipmentId === normalizedEquipmentId)
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      const leftTime = getRecordTime(left.record);
      const rightTime = getRecordTime(right.record);

      if (leftTime === null && rightTime === null) {
        return left.index - right.index;
      }

      if (leftTime === null) {
        return 1;
      }

      if (rightTime === null) {
        return -1;
      }

      return rightTime - leftTime;
    });

  const limitedRecords = typeof limite === 'number' && limite > 0
    ? matchingRecords.slice(0, limite)
    : matchingRecords;

  if (limitedRecords.length === 0) {
    return {
      entries: [],
      error: 'historico_indisponivel',
      message: 'Informação insuficiente',
    };
  }

  return {
    entries: limitedRecords.map(({ record }) => ({
      data: record.date,
      tipoRegisto: record.type,
      descricao: record.description,
      equipamentoId: record.equipmentId as string,
    })),
  };
}
