import { useEffect, useState } from 'react';
import { Camera, Plus, Sparkles } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { assistTechnicalRecord } from '../features/ai';
import type {
  AssistTechnicalRecordMissionResult,
  RiskLevel,
  SuggestedPriority,
} from '../features/ai';
import type { MaintenanceRecord } from '../shared/types/domain';

const priorityLabels: Record<SuggestedPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

const riskLabels: Record<RiskLevel, string> = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
  indeterminado: 'Indeterminado',
};

type DailyRecordsScreenProps = {
  records: MaintenanceRecord[];
};

export function DailyRecordsScreen({ records }: DailyRecordsScreenProps) {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [assistantResult, setAssistantResult] =
    useState<AssistTechnicalRecordMissionResult | null>(null);
  const [assistantStatus, setAssistantStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  const hasEnoughDescription = description.trim().length >= 12;

  useEffect(() => {
    if (!hasEnoughDescription) {
      setAssistantResult(null);
      setAssistantStatus('idle');
      return;
    }

    let isCurrentRequest = true;
    setAssistantStatus('loading');

    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await assistTechnicalRecord({
          description: description.trim(),
          date,
        }, {
          historyRecords: records,
        });

        if (isCurrentRequest) {
          setAssistantResult(result);
          setAssistantStatus('success');
        }
      } catch {
        if (isCurrentRequest) {
          setAssistantResult(null);
          setAssistantStatus('error');
        }
      }
    }, 400);

    return () => {
      isCurrentRequest = false;
      window.clearTimeout(timeoutId);
    };
  }, [date, description, hasEnoughDescription, records]);

  return (
    <section className="screen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Registos Diários</p>
          <h1>Ocorrências operacionais</h1>
        </div>
        <button className="primary-button" type="button">
          <Plus size={18} aria-hidden="true" />
          Novo registo
        </button>
      </div>

      <form className="record-form" aria-label="Base para novo registo diário">
        <label>
          Data
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Tipo
          <select defaultValue="Tarefa">
            <option>Tarefa</option>
            <option>Visita</option>
            <option>Importante</option>
          </select>
        </label>
        <label className="wide">
          Descrição
          <textarea
            rows={4}
            placeholder="Descreve a ocorrência de manutenção"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
      </form>

      {hasEnoughDescription && (
        <aside className="ai-assistant-panel" aria-live="polite">
          <div className="ai-assistant-heading">
            <Sparkles size={18} aria-hidden="true" />
            <strong>Assistente IA</strong>
            <span>Sugestão para validação</span>
          </div>

          {assistantStatus === 'loading' && (
            <p className="ai-assistant-message">A analisar o registo...</p>
          )}

          {assistantStatus === 'error' && (
            <p className="ai-assistant-message error">
              Assistente IA temporariamente indisponível.
            </p>
          )}

          {assistantStatus === 'success' && assistantResult && (
            <dl className="ai-suggestion-grid">
              <div>
                <dt>Tipo</dt>
                <dd>{assistantResult.response.suggestedType}</dd>
              </div>
              <div>
                <dt>Prioridade</dt>
                <dd>
                  {priorityLabels[assistantResult.response.plan.suggestedPriority]}
                </dd>
              </div>
              <div className="wide">
                <dt>Resumo</dt>
                <dd>{assistantResult.response.technicalSummary}</dd>
              </div>
              <div>
                <dt>Risco</dt>
                <dd>{riskLabels[assistantResult.response.risk.level]}</dd>
              </div>
              <div className="wide">
                <dt>Próxima ação</dt>
                <dd>{assistantResult.response.plan.actions[0]}</dd>
              </div>
              <div className="wide">
                <dt>Informação em falta</dt>
                <dd>
                  {assistantResult.response.missingInformation.length > 0
                    ? (
                        <ul className="ai-missing-list">
                          {assistantResult.response.missingInformation.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )
                    : 'Nenhuma identificada'}
                </dd>
              </div>
              <div className="wide confirmation">
                <dt>Confirmação humana</dt>
                <dd>Confirmação do técnico necessária</dd>
              </div>
            </dl>
          )}
        </aside>
      )}

      <div className="record-stack">
        {records.map((record) => (
          <article className="record-row" key={record.id}>
            <div>
              <strong>{record.title}</strong>
              <p>{record.description}</p>
            </div>
            <div className="row-meta">
              <StatusBadge>{record.type}</StatusBadge>
              <span>{record.date}</span>
              {record.photos.length > 0 && <Camera size={17} aria-label="Com fotografia" />}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
