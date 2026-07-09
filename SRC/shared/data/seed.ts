import type { MaintenanceRecord, MaintenanceSheet } from '../types/domain';

export const initialMaintenanceSheets: MaintenanceSheet[] = [
  {
    id: 'sheet-week-27-hvac',
    title: 'Verificação AVAC',
    description: 'Inspeção semanal dos sistemas de climatização e limpeza de filtros.',
    weekLabel: 'Semana 27',
    status: 'partial',
  },
  {
    id: 'sheet-week-27-pumps',
    title: 'Bombas de circulação',
    description: 'Controlo preventivo de ruído, vibração e pressões de serviço.',
    weekLabel: 'Semana 27',
    status: 'total',
  },
  {
    id: 'sheet-week-28-lighting',
    title: 'Iluminação técnica',
    description: 'Revisão de zonas comuns e substituição de pontos sinalizados.',
    weekLabel: 'Semana 28',
    status: 'partial',
  },
];

export const initialRecords: MaintenanceRecord[] = [
  {
    id: 'record-001',
    sheetId: 'sheet-week-27-hvac',
    equipmentId: 'eq-avac-01',
    title: 'Filtro com acumulação',
    description: 'Identificada acumulação no filtro da unidade nascente. Limpeza realizada.',
    type: 'Tarefa',
    date: '2026-07-03',
    photos: ['filter-before'],
  },
  {
    id: 'record-002',
    sheetId: 'sheet-week-27-pumps',
    equipmentId: 'eq-pump-02',
    title: 'Pressão estabilizada',
    description: 'Pressões dentro do intervalo esperado após verificação de rotina.',
    type: 'Visita',
    date: '2026-07-03',
    photos: [],
  },
  {
    id: 'record-003',
    title: 'Acesso técnico condicionado',
    description: 'Acesso à sala técnica condicionado por intervenção externa.',
    type: 'Importante',
    date: '2026-07-04',
    photos: ['access-note', 'door-label'],
  },
];
