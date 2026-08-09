import {
  consultHistory,
  consultarHistoricoEquipamento,
} from '../tools/historyTool';
import type { MaintenanceRecord } from '../../../shared/types/domain';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const records: readonly MaintenanceRecord[] = [
  {
    id: 'record-old-target',
    title: 'Histórico antigo',
    description: 'Verificação anterior do equipamento alvo.',
    type: 'Tarefa',
    date: '2026-07-01',
    photos: [],
    equipmentId: 'eq-target',
  },
  {
    id: 'record-other',
    title: 'Outro equipamento',
    description: 'Ruído registado noutro equipamento.',
    type: 'Importante',
    date: '2026-07-03',
    photos: [],
    equipmentId: 'eq-other',
  },
  {
    id: 'record-new-target',
    title: 'Histórico recente',
    description: 'Nova verificação do equipamento alvo.',
    type: 'Visita',
    date: '2026-07-05',
    photos: [],
    equipmentId: 'eq-target',
  },
  {
    id: 'record-invalid-date',
    title: 'Data a confirmar',
    description: 'Registo com data não parseável.',
    type: 'Tarefa',
    date: 'A confirmar',
    photos: [],
    equipmentId: 'eq-target',
  },
];

export async function testEquipmentHistoryTool() {
  const missingIdentifier = await consultarHistoricoEquipamento('', records);
  assert(
    missingIdentifier.error === 'identificador_em_falta',
    'Deve devolver identificador_em_falta quando não existe equipamentoId.',
  );
  assert(
    missingIdentifier.entries.length === 0,
    'Sem identificador, não deve devolver entradas.',
  );

  const filtered = await consultarHistoricoEquipamento('eq-target', records);
  assert(
    filtered.entries.length === 3,
    'Deve devolver apenas registos do equipamento indicado.',
  );
  assert(
    filtered.entries.every((entry) => entry.equipamentoId === 'eq-target'),
    'Não deve devolver registos de outro equipamento.',
  );
  assert(
    filtered.entries[0].data === '2026-07-05',
    'Registos com data parseável devem ser ordenados do mais recente para o mais antigo.',
  );
  assert(
    !Object.prototype.hasOwnProperty.call(filtered.entries[0], 'estado'),
    'Não deve inventar o campo estado.',
  );

  const limited = await consultarHistoricoEquipamento('eq-target', records, 1);
  assert(
    limited.entries.length === 1,
    'Deve aplicar limite positivo.',
  );
  assert(
    limited.entries[0].data === '2026-07-05',
    'O limite deve preservar a ordenação por data descendente.',
  );

  const noResults = await consultarHistoricoEquipamento('eq-missing-history', records);
  assert(
    noResults.error === 'historico_indisponivel',
    'Sem resultados, deve devolver historico_indisponivel.',
  );
  assert(
    noResults.message === 'Informação insuficiente',
    'Sem resultados, deve indicar Informação insuficiente.',
  );
  assert(noResults.entries.length === 0, 'Sem resultados, entries deve ser vazio.');

  const previousHistory = await consultHistory(
    {
      description: 'Equipamento com ruído durante funcionamento.',
      date: '2026-07-09',
    },
    records,
  );
  assert(
    previousHistory.source === 'records',
    'consultHistory deve continuar a devolver source records.',
  );
  assert(
    previousHistory.entries.length === 1 && previousHistory.entries[0].equipmentId === 'eq-other',
    'consultHistory deve continuar a filtrar por palavras-chave técnicas.',
  );

  return {
    identificadorEmFalta: missingIdentifier.error,
    filtradosPorEquipamento: filtered.entries.length,
    limiteAplicado: limited.entries.length,
    semResultados: noResults.error,
    consultHistoryPreservada: previousHistory.source,
  };
}

testEquipmentHistoryTool()
  .then((output) => {
    console.log(JSON.stringify(output, null, 2));
  })
  .catch((error: unknown) => {
    console.error(error);
    throw error;
  });