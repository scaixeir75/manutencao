import { useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { MaintenanceSheetModal } from '../features/maintenance-sheets/MaintenanceSheetModal';
import { DailyRecordsScreen } from '../screens/DailyRecordsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { WeeklyPlanScreen } from '../screens/WeeklyPlanScreen';
import { initialMaintenanceSheets, initialRecords } from '../shared/data/seed';
import type { MaintenanceSheet } from '../shared/types/domain';
import type { AppRoute } from './routes';

export function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>('weekly-plan');
  const [selectedSheet, setSelectedSheet] = useState<MaintenanceSheet | null>(null);

  const records = useMemo(() => initialRecords, []);
  const maintenanceSheets = useMemo(() => initialMaintenanceSheets, []);

  return (
    <AppLayout activeRoute={activeRoute} onNavigate={setActiveRoute}>
      {activeRoute === 'weekly-plan' && (
        <WeeklyPlanScreen
          sheets={maintenanceSheets}
          records={records}
          onOpenSheet={setSelectedSheet}
        />
      )}

      {activeRoute === 'daily-records' && <DailyRecordsScreen records={records} />}

      {activeRoute === 'history' && <HistoryScreen records={records} />}

      {selectedSheet && (
        <MaintenanceSheetModal
          sheet={selectedSheet}
          records={records.filter((record) => record.sheetId === selectedSheet.id)}
          onClose={() => setSelectedSheet(null)}
          onCreateRecord={() => {
            setSelectedSheet(null);
            setActiveRoute('daily-records');
          }}
        />
      )}
    </AppLayout>
  );
}
