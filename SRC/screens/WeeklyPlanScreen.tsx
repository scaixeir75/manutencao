import { ArrowRight } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { MaintenanceRecord, MaintenanceSheet } from '../shared/types/domain';

type WeeklyPlanScreenProps = {
  sheets: MaintenanceSheet[];
  records: MaintenanceRecord[];
  onOpenSheet: (sheet: MaintenanceSheet) => void;
};

export function WeeklyPlanScreen({ sheets, records, onOpenSheet }: WeeklyPlanScreenProps) {
  return (
    <section className="screen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Plano da Semana</p>
          <h1>Fichas agendadas por semana</h1>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-item">
          <span>Fichas</span>
          <strong>{sheets.length}</strong>
        </div>
        <div className="summary-item">
          <span>Registos</span>
          <strong>{records.length}</strong>
        </div>
        <div className="summary-item">
          <span>Com fotografias</span>
          <strong>{records.filter((record) => record.photos.length > 0).length}</strong>
        </div>
      </div>

      <div className="sheet-grid">
        {sheets.map((sheet) => {
          const sheetRecords = records.filter((record) => record.sheetId === sheet.id);

          return (
            <article className="sheet-card" key={sheet.id}>
              <div>
                <p className="eyebrow">{sheet.weekLabel}</p>
                <h2>{sheet.title}</h2>
                <p>{sheet.description}</p>
              </div>
              <div className="card-footer">
                <StatusBadge tone={sheet.status === 'total' ? 'success' : 'warning'}>
                  {sheet.status === 'total' ? 'Execução total' : 'Execução parcial'}
                </StatusBadge>
                <span>{sheetRecords.length} registos</span>
              </div>
              <button className="text-button" type="button" onClick={() => onOpenSheet(sheet)}>
                Abrir ficha
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
