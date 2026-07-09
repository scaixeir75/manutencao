import type {
  HistoryToolResult,
  TechnicalRecordContext,
} from '../types/aiTypes';

export async function consultHistory(
  _context: TechnicalRecordContext,
): Promise<HistoryToolResult> {
  return {
    entries: [],
    source: 'simulated',
  };
}

