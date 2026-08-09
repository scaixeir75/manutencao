import { useEffect, useState } from 'react';
import { Camera, Check, Copy, Plus, Sparkles } from 'lucide-react';
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

function formatCompleteSuggestion(result: AssistTechnicalRecordMissionResult) {
  const missingInformation = result.response.missingInformation.length > 0
    ? result.response.missingInformation.map((item) => `- ${item}`).join('\n')
    : '- Nenhuma identificada';

  return [
    'Assistente IA — Sugestão para Registo Técnico',
    '',
    `Tipo: ${result.response.suggestedType}`,
    `Prioridade: ${priorityLabels[result.response.plan.suggestedPriority]}`,
    `Resumo: ${result.response.technicalSummary}`,
    `Risco: ${riskLabels[result.response.risk.level]}`,
    `Próxima ação: ${result.response.plan.actions[0]}`,
    '',
    'Informação em falta:',
    missingInformation,
    '',
    'Nota: Confirmação do técnico necessária.',
    'Nota: Supervisão humana necessária antes de qualquer ação crítica.',
  ].join('\n');
}

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
  const [copiedSuggestion, setCopiedSuggestion] = useState<string | null>(null);

  const hasEnoughDescription = description.trim().length >= 12;
  const hasInsufficientHistory = assistantResult?.response.risk.level === 'indeterminado';

  const copySuggestion = async (key: string, value: string) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const copyTarget = document.createElement('textarea');
      copyTarget.value = value;
      copyTarget.setAttribute('readonly', 'true');
      copyTarget.style.position = 'fixed';
      copyTarget.style.opacity = '0';
      document.body.appendChild(copyTarget);
      copyTarget.select();
      document.execCommand('copy');
      document.body.removeChild(copyTarget);
    }

    setCopiedSuggestion(key);
    window.setTimeout(() => setCopiedSuggestion(null), 1800);
  };

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

      <aside className="ai-assistant-panel" aria-live="polite">
          <div className="ai-assistant-heading">
            <Sparkles size={18} aria-hidden="true" />
            <strong>Assistente IA</strong>
            <span>Sugestão para validação</span>
          </div>

          <p className="ai-supervision-note">
            Supervisão humana necessária: esta sugestão não altera registos nem executa ações críticas.
          </p>

          {!hasEnoughDescription && (
            <p className="ai-assistant-message idle">
              Escreve uma descrição com pelo menos 12 caracteres para ativar o Assistente IA.
            </p>
          )}

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
                <dd>
                  <span className="ai-badge">{assistantResult.response.suggestedType}</span>
                </dd>
              </div>
              <div>
                <dt>Prioridade</dt>
                <dd>
                  <span className="ai-badge priority">
                    {priorityLabels[assistantResult.response.plan.suggestedPriority]}
                  </span>
                </dd>
              </div>
              <div className="wide">
                <dt>
                  Resumo
                  <button
                    className="ai-copy-button"
                    type="button"
                    onClick={() => copySuggestion('summary', assistantResult.response.technicalSummary)}
                    aria-label="Copiar resumo"
                    title="Copiar resumo"
                  >
                    {copiedSuggestion === 'summary' ? (
                      <Check size={14} aria-hidden="true" />
                    ) : (
                      <Copy size={14} aria-hidden="true" />
                    )}
                  </button>
                </dt>
                <dd className="ai-text-block">{assistantResult.response.technicalSummary}</dd>
              </div>
              <div>
                <dt>Risco</dt>
                <dd>
                  <span className={`ai-badge risk-${assistantResult.response.risk.level}`}>
                    {riskLabels[assistantResult.response.risk.level]}
                  </span>
                </dd>
              </div>
              <div className="wide">
                <dt>
                  Próxima ação
                  <button
                    className="ai-copy-button"
                    type="button"
                    onClick={() => copySuggestion('action', assistantResult.response.plan.actions[0])}
                    aria-label="Copiar próxima ação"
                    title="Copiar próxima ação"
                  >
                    {copiedSuggestion === 'action' ? (
                      <Check size={14} aria-hidden="true" />
                    ) : (
                      <Copy size={14} aria-hidden="true" />
                    )}
                  </button>
                </dt>
                <dd className="ai-text-block">{assistantResult.response.plan.actions[0]}</dd>
              </div>
              {hasInsufficientHistory && (
                <div className="wide ai-status-note">
                  Histórico insuficiente para avaliar risco com confiança.
                </div>
              )}
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
                <dd>
                  <span className="ai-validation-note">Confirmação do técnico necessária</span>
                </dd>
              </div>
              <div className="wide ai-manual-actions">
                <button
                  className="ai-copy-complete-button"
                  type="button"
                  onClick={() => copySuggestion('complete', formatCompleteSuggestion(assistantResult))}
                >
                  {copiedSuggestion === 'complete' ? (
                    <Check size={15} aria-hidden="true" />
                  ) : (
                    <Copy size={15} aria-hidden="true" />
                  )}
                  {copiedSuggestion === 'complete'
                    ? 'Sugestão copiada'
                    : 'Copiar sugestão completa'}
                </button>
              </div>
            </dl>
          )}
        </aside>

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
