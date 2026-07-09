import type {
  HistoryToolResult,
  TechnicalRecordContext,
} from '../types/aiTypes';
import type { MaintenanceRecord } from '../../../shared/types/domain';

export async function consultHistory(
  _context: TechnicalRecordContext,
  records: readonly MaintenanceRecord[] = [],
): Promise<HistoryToolResult> {
  return {
    entries: records.map((record) => ({
      id: record.id,
      date: record.date,
      description: record.description,
      equipmentId: record.equipmentId,
    })),
    source: 'records',
  };
}
