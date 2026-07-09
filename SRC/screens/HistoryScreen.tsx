import { Pencil, Trash2 } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { MaintenanceRecord } from '../shared/types/domain';

type HistoryScreenProps = {
  records: MaintenanceRecord[];
};

export function HistoryScreen({ records }: HistoryScreenProps) {
  return (
    <section className="screen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Histórico de Registos</p>
          <h1>Atividade centralizada</h1>
        </div>
        <select className="filter-select" defaultValue="Todos">
          <option>Todos</option>
          <option>Tarefa</option>
          <option>Visita</option>
          <option>Importante</option>
        </select>
      </div>

      <div className="history-list">
        {records.map((record) => (
          <article className="history-item" key={record.id}>
            <div className="history-date">
              <strong>{record.date.slice(8, 10)}</strong>
              <span>{record.date.slice(5, 7)}</span>
            </div>
            <div>
              <div className="history-title">
                <h2>{record.title}</h2>
                <StatusBadge>{record.type}</StatusBadge>
              </div>
              <p>{record.description}</p>
              {record.photos.length > 0 && (
                <div className="thumb-strip">
                  {record.photos.map((photo) => (
                    <span className="photo-thumb" key={photo} aria-label="Miniatura de fotografia" />
                  ))}
                </div>
              )}
            </div>
            <div className="action-group">
              <button className="icon-button" type="button" aria-label="Editar registo">
                <Pencil size={17} />
              </button>
              <button className="icon-button danger" type="button" aria-label="Eliminar registo">
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
