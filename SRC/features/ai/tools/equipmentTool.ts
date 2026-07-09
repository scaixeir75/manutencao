import type { EquipmentToolResult } from '../types/aiTypes';

export async function consultEquipment(
  equipmentId?: string,
): Promise<EquipmentToolResult> {
  return {
    equipment: equipmentId
      ? {
          id: equipmentId,
          name: 'Equipamento simulado',
        }
      : null,
    source: 'simulated',
  };
}

