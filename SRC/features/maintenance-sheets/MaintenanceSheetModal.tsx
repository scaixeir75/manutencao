import { X } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { MaintenanceRecord, MaintenanceSheet } from '../../shared/types/domain';

type MaintenanceSheetModalProps = {
  sheet: MaintenanceSheet;
  records: MaintenanceRecord[];
  onClose: () => void;
  onCreateRecord: () => void;
};

export function MaintenanceSheetModal({
  sheet,
  records,
  onClose,
  onCreateRecord,
}: MaintenanceSheetModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Ficha de Manutenção</p>
            <h2 id="sheet-title">{sheet.title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar ficha">
            <X size={20} />
          </button>
        </header>

        <div className="detail-grid">
          <div>
            <span className="field-label">Semana</span>
            <strong>{sheet.weekLabel}</strong>
          </div>
          <div>
            <span className="field-label">Execução</span>
            <StatusBadge tone={sheet.status === 'total' ? 'success' : 'warning'}>
              {sheet.status === 'total' ? 'Total' : 'Parcial'}
            </StatusBadge>
          </div>
        </div>

        <div className="section-header compact">
          <div>
            <p className="eyebrow">Registos associados</p>
            <h3>{records.length} registos nesta ficha</h3>
          </div>
          <button className="primary-button" type="button" onClick={onCreateRecord}>
            Criar registo
          </button>
        </div>

        <div className="record-stack">
          {records.map((record) => (
            <article className="record-row" key={record.id}>
              <div>
                <strong>{record.title}</strong>
                <p>{record.description}</p>
              </div>
              <StatusBadge>{record.type}</StatusBadge>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
