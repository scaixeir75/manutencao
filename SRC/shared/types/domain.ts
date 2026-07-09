export type MaintenanceRecordType = 'Tarefa' | 'Visita' | 'Importante';

export type MaintenanceSheetStatus = 'partial' | 'total';

export type MaintenanceSheet = {
  id: string;
  title: string;
  description: string;
  weekLabel: string;
  status: MaintenanceSheetStatus;
};

export type MaintenanceRecord = {
  id: string;
  title: string;
  description: string;
  type: MaintenanceRecordType;
  date: string;
  photos: string[];
  sheetId?: string;
  equipmentId?: string;
};

export type Equipment = {
  id: string;
  name: string;
  location?: string;
};
