const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const norm = value => String(value || '').toLowerCase().normalize('NFD').replace(/\p{M}+/gu, '').trim();
const tokens = value => norm(value).split(/[^a-z0-9]+/).filter(Boolean);
const hasWholeWord = (text, term) => tokens(text).includes(norm(term));

function findByWholeWord(records, term) {
  return records.filter(record => hasWholeWord(record.text, term));
}

function isWaterCut(text) {
  const n = norm(text);
  return /(corte|interrupcao|falta|suspensao)/.test(n) && hasWholeWord(text, 'agua');
}

function findWaterCut(records) {
  return records.filter(record => isWaterCut(record.text));
}

function isManualResolution(anomaly, entry) {
  return entry.resolvesAnomalyId === anomaly.id || (
    /correcao de anomalia/i.test(entry.origin || '') &&
    /anomalia marcada como corrigida/i.test(entry.text || '')
  );
}

function subjectTerms(entry) {
  const stop = new Set(['anomalia', 'concluido', 'corrigido', 'reparacao', 'manutencao', 'tarefa', 'de', 'do', 'da', 'em', 'no', 'na']);
  return tokens(entry.text).filter(term => term.length > 2 && !stop.has(term));
}

function isRelatedCorrection(anomaly, correction) {
  const anomalyTerms = new Set(subjectTerms(anomaly));
  return subjectTerms(correction).some(term => anomalyTerms.has(term));
}

function pendingAnomalies(entries) {
  const ordered = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const anomalies = ordered.filter(entry => /anomalia/i.test(entry.status || entry.type || ''));
  const resolved = [];
  const pending = [];
  for (const anomaly of anomalies) {
    const explicit = ordered.some(entry => isManualResolution(anomaly, entry));
    const related = ordered.some(entry => new Date(entry.date) > new Date(anomaly.date) && /concluido|corrigido|resolvido/i.test(entry.status || entry.type || '') && isRelatedCorrection(anomaly, entry));
    if (explicit || related) resolved.push(anomaly);
    else pending.push(anomaly);
  }
  return { pending, resolved };
}

function latestByFicha(records, fichaId) {
  return records
    .filter(record => String(record.fichaId) === String(fichaId))
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}

function anomalyRanking(records) {
  const counts = new Map();
  for (const record of records.filter(record => /anomalia/i.test(record.status || record.type || ''))) {
    counts.set(record.fichaId, (counts.get(record.fichaId) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function writeBacktestReport(results) {
  const reportDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const failed = results.filter(result => !result.passed);
  fs.writeFileSync(path.join(reportDir, 'ai-backtest-report.json'), JSON.stringify({
    createdAt: new Date().toISOString(),
    mode: 'simulado',
    total: results.length,
    pass: results.length - failed.length,
    fail: failed.length,
    cases: results
  }, null, 2));
}

test('IA backtests simulados sem Firebase', async () => {
  const results = [];
  const run = (name, category, fn) => {
    const entry = { mode: 'simulado', category, name, passed: false, error: '' };
    try {
      fn();
      entry.passed = true;
      entry.status = 'PASS';
    } catch (error) {
      entry.status = 'FAIL';
      entry.error = String(error?.message || error);
    }
    results.push(entry);
  };

  run('sal vs sala', 'palavra-completa', () => {
    const records = [
      { text: 'Colocação de sal no descalcificador' },
      { text: 'Substituição de arrancador sala do depósito de água' }
    ];
    expect(findByWholeWord(records, 'sal').map(x => x.text)).toEqual(['Colocação de sal no descalcificador']);
    expect(findByWholeWord(records, 'sala').map(x => x.text)).toEqual(['Substituição de arrancador sala do depósito de água']);
  });

  run('corte de água vs corte da relva', 'pesquisa-relacional', () => {
    const records = [
      { text: 'Interrupção corte de água' },
      { text: 'Corte da relva no jardim' }
    ];
    expect(findWaterCut(records).map(x => x.text)).toEqual(['Interrupção corte de água']);
  });

  run('anomalia resolvida manualmente', 'anomalias', () => {
    const data = [
      { id: 'a1', date: '2026-08-01', status: 'Anomalia', text: 'ANOMALIA forno' },
      { id: 'c1', date: '2026-08-01', status: 'Concluído', origin: 'Correção de anomalia', resolvesAnomalyId: 'a1', text: 'Anomalia marcada como corrigida: forno' }
    ];
    expect(pendingAnomalies(data).pending).toHaveLength(0);
  });

  run('anomalia com correção não relacionada', 'anomalias', () => {
    const data = [
      { id: 'a1', date: '2026-08-01', status: 'Anomalia', text: 'ANOMALIA forno' },
      { id: 'c1', date: '2026-08-02', status: 'Concluído', text: 'reparação do armário de cozinha bancada' }
    ];
    expect(pendingAnomalies(data).pending.map(x => x.id)).toEqual(['a1']);
  });

  run('última intervenção por ficha', 'historico', () => {
    const records = [
      { fichaId: 20, date: '2026-08-01', text: 'registo antigo' },
      { fichaId: 20, date: '2026-08-04', text: 'registo mais recente' },
      { fichaId: 29, date: '2026-08-10', text: 'outra ficha' }
    ];
    expect(latestByFicha(records, 20).date).toBe('2026-08-04');
  });

  run('ranking por anomalias', 'ranking', () => {
    const records = [
      { fichaId: 1, status: 'Anomalia' },
      { fichaId: 1, status: 'Anomalia' },
      { fichaId: 1, status: 'Anomalia' },
      { fichaId: 2, status: 'Anomalia' },
      { fichaId: 3, status: 'Concluído' }
    ];
    expect(anomalyRanking(records)).toEqual([[1, 3], [2, 1]]);
  });

  writeBacktestReport(results);
  expect(results.filter(result => !result.passed), 'Backtests simulados falharam; ver tests/reports/ai-backtest-report.json').toEqual([]);
});
