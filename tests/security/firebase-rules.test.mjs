import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const rules = fs.readFileSync(path.join(root, 'database.rules.json'), 'utf8');
const emulatorHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '';
const [host, portText] = emulatorHost.split(':');
if (!['localhost', '127.0.0.1'].includes(host)) {
  throw new Error(`Rules tests require a local emulator host; received ${emulatorHost || '(unset)'}`);
}
const port = Number(portText || 9000);
if (!Number.isInteger(port) || port <= 0) throw new Error(`Invalid local emulator port: ${emulatorHost}`);

let env;
let anon;
let userA;
let userB;

const diary = (overrides = {}) => ({
  text: 'Registo de teste',
  severity: 'info',
  timestamp: '2026-09-21T10:00:00.000Z',
  date: '2026-09-21',
  ...overrides
});
const structuredData = {
  templateId: 'rotina-diaria-v1',
  source: 'assisted_form',
  metadata: { document: 'synthetic' },
  measurements: [
    { section: 'generator', item: 'fuel', type: 'level', value: '3/4', unit: null, status: null, printedUnit: 'L', recordedUnit: null },
    { section: 'aqs', item: '01', type: 'temperature', value: 55, unit: '°C', status: 'OK', printedUnit: '°C', recordedUnit: '°C' }
  ],
  checks: [{ section: 'aqs', item: '01', status: 'OK' }],
  reportItems: ['Item de teste']
};
const fichaLog = (overrides = {}) => ({
  id: 'entry-1', date: '2026-09-21', week: 39, status: 'Concluído',
  tech: 'Teste', note: 'Observação de teste', created: 1789984800000, ...overrides
});
const mirror = (overrides = {}) => ({
  id: 'diary_d1', diaryId: 'd1', source: 'diary', date: '2026-09-21',
  week: 39, status: 'Concluído', tech: 'Registo Diário', note: 'Registo de teste',
  created: 1789984800000, ...overrides
});
const memory = (overrides = {}) => ({
  id: 'memory-1', status: 'approved', approvedByHuman: true,
  ruleText: 'Regra aprovada de teste', basisText: 'Base factual de teste',
  createdAt: '2026-09-21T10:00:00.000Z', approvedAt: '2026-09-21T10:00:00.000Z',
  version: 1, source: 'ai_suggestion', fichaId: '44', fichaNome: 'Ficha de teste',
  sourceQuestion: 'Pergunta de teste', sourceRecords: [{ text: 'Base factual de teste' }], ...overrides
});
const technicalHistory = (overrides = {}) => ({
  id: 'daily_sheet_2026_09_21_manual_preview', schemaVersion: 1,
  source: 'manual_preview', extractionMode: 'manual_simulation', date: '2026-09-21',
  sheetDateConfirmed: false, technicianName: null, imageStored: false,
  imageDiscarded: true, validatedByHuman: true, requiresHumanReview: true,
  createdAt: '2026-09-21T10:00:00.000Z',
  readings: {
    generatorFuelLevel: { label: 'Grupo Gerador', confidence: 'low', requiresHumanReview: true },
    electricityMeter: { label: 'Eletricidade', confidence: 'low', requiresHumanReview: true },
    waterMeter: { label: 'Água', confidence: 'low', requiresHumanReview: true },
    gasMeter: { label: 'Gás', confidence: 'low', requiresHumanReview: true },
    aqsTemperatures: [],
    dishwasherTemperature: { label: 'Lava-Loiça', confidence: 'low', requiresHumanReview: true },
    medicalVacuum: { label: 'Vácuo', confidence: 'low', requiresHumanReview: true },
    waterAnalysis: {
      freeChlorine: { label: 'CL Livre', confidence: 'low', requiresHumanReview: true },
      totalChlorine: { label: 'CL Total', confidence: 'low', requiresHumanReview: true },
      ph: { label: 'pH', confidence: 'low', requiresHumanReview: true }
    }
  },
  checks: [{ area: 'Grupo Gerador', status: 'unclear', confidence: 'low', requiresHumanReview: true }],
  operationalReport: {
    rawText: null, normalizedText: null, confidence: 'low', requiresHumanReview: true,
    suggestedDestinations: ['none'], suggestedCategory: null, suggestedVisibleAction: null,
    humanConfirmationRequired: true
  },
  ...overrides
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'pmp-rules-test',
    database: { host, port, rules }
  });
  anon = env.unauthenticatedContext().database();
  userA = env.authenticatedContext('userA').database();
  userB = env.authenticatedContext('userB').database();
});

after(async () => { await env?.cleanup(); });

test('anónimo não lê nem escreve os quatro paths', async () => {
  for (const pathName of ['registos_diarios', 'registos_fichas', 'memoria_tecnica', 'historico_tecnico_diario']) {
    await assertFails(anon.ref(pathName).once('value'));
    await assertFails(anon.ref(`${pathName}/x`).set({ value: 1 }));
  }
});

test('registos_diarios aceita normal, edição, legado e estruturado; rejeita campos inválidos', async () => {
  const ref = userA.ref('registos_diarios/d1');
  await assertSucceeds(ref.set(diary()));
  await assertSucceeds(ref.update({ text: 'Texto editado' }));
  const operational = diary({ createdByHuman: true, operationalIntent: 'visit', sourceContext: 'daily_sheet_manual_preview', source: 'daily_sheet_operational_report' });
  await assertSucceeds(userA.ref('registos_diarios/operational').set(operational));
  await assertSucceeds(userA.ref('registos_diarios/operational').update({ text: 'Operacional editado' }));
  await assertSucceeds(userA.ref('registos_diarios/legacy').set(diary()));
  await assertSucceeds(userA.ref('registos_diarios/structured').set(diary({ structuredData, photos: ['data:image/jpeg;base64,synthetic'] })));
  await assertFails(userA.ref('registos_diarios/bad-severity').set(diary({ severity: 'unknown' })));
  await assertFails(userA.ref('registos_diarios/bad-type').set(diary({ text: 42 })));
  await assertFails(userA.ref('registos_diarios/bad-field').set(diary({ injected: true })));
  await assertFails(userA.ref('registos_diarios/bad-human').set(diary({ createdByHuman: 'yes' })));
  await assertFails(userA.ref('registos_diarios/bad-intent').set(diary({ operationalIntent: 'other' })));
  await assertFails(userA.ref('registos_diarios/bad-context').set(diary({ sourceContext: 42 })));
  await assertFails(userA.ref('registos_diarios/bad-source').set(diary({ source: 'unknown' })));
  await assertFails(userA.ref('registos_diarios/legacy-id').set(diary({ id: 'legacy-id' })));
  const legacy = diary({ id: 'legacy-edit' });
  const edited = { ...legacy };
  delete edited.id;
  edited.text = 'Editado pelo fluxo real';
  await assertSucceeds(userA.ref('registos_diarios/legacy-edit').set(edited));
  await assertSucceeds(ref.remove());
});

test('registos_fichas aceita log manual normal com created', async () => {
  await assertSucceeds(userA.ref('registos_fichas/44/manual-normal').set(fichaLog({ id: 'manual-normal' })));
});

test('registos_fichas aceita correção nova com created', async () => {
  await assertSucceeds(userA.ref('registos_fichas/44/correction-new').set(fichaLog({ id: 'correction-new', tech: 'Correção de anomalia', confirmation: 'Confirmação humana', origin: 'Correção de anomalia', resolvesAnomalyId: 'anomaly-new' })));
});

test('registos_fichas aceita correção legacy completa sem created', async () => {
  const legacyCorrection = fichaLog({ id: 'correction-legacy', tech: 'Correção de anomalia', confirmation: 'Confirmação humana', origin: 'Correção de anomalia', resolvesAnomalyId: 'anomaly-legacy' });
  delete legacyCorrection.created;
  await assertSucceeds(userA.ref('registos_fichas/44/correction-legacy').set(legacyCorrection));
});

test('registos_fichas rejeita log genérico sem created', async () => {
  const missingCreated = fichaLog({ id: 'missing-created' });
  delete missingCreated.created;
  await assertFails(userA.ref('registos_fichas/44/missing-created').set(missingCreated));
});

test('registos_fichas rejeita correção sem origin válido', async () => {
  const invalid = fichaLog({ id: 'invalid-origin', tech: 'Correção de anomalia', confirmation: 'Confirmação humana', origin: 'Outro', resolvesAnomalyId: 'anomaly-invalid' });
  delete invalid.created;
  await assertFails(userA.ref('registos_fichas/44/invalid-origin').set(invalid));
});

test('registos_fichas rejeita correção legacy sem confirmation', async () => {
  const invalid = fichaLog({ id: 'missing-confirmation', tech: 'Correção de anomalia', origin: 'Correção de anomalia', resolvesAnomalyId: 'anomaly-missing' });
  delete invalid.created;
  await assertFails(userA.ref('registos_fichas/44/missing-confirmation').set(invalid));
});

test('registos_fichas rejeita correção legacy sem resolvesAnomalyId', async () => {
  const invalid = fichaLog({ id: 'missing-resolution', tech: 'Correção de anomalia', confirmation: 'Confirmação humana', origin: 'Correção de anomalia' });
  delete invalid.created;
  await assertFails(userA.ref('registos_fichas/44/missing-resolution').set(invalid));
});

test('registos_fichas rejeita tipos inválidos e status inválido', async () => {
  await assertFails(userA.ref('registos_fichas/44/invalid-confirmation').set(fichaLog({ id: 'invalid-confirmation', confirmation: 1, origin: 'Correção de anomalia', resolvesAnomalyId: 'anomaly-type' })));
  await assertFails(userA.ref('registos_fichas/44/invalid-status').set(fichaLog({ id: 'invalid-status', status: 'Other' })));
});

test('registos_fichas aceita mirror coerente', async () => {
  await assertSucceeds(userA.ref('registos_fichas/44/diary_mirror-ok').set(mirror({ id: 'diary_mirror-ok', diaryId: 'mirror-ok' })));
});

test('registos_fichas rejeita mirror com diaryId incompatível', async () => {
  await assertFails(userA.ref('registos_fichas/44/diary_mirror-bad').set(mirror({ id: 'diary_mirror-bad', diaryId: 'different' })));
});

test('registos_fichas rejeita update de source inválido em mirror', async () => {
  const ref = userA.ref('registos_fichas/44/diary_mirror-source');
  await assertSucceeds(ref.set(mirror({ id: 'diary_mirror-source', diaryId: 'mirror-source' })));
  await assertFails(ref.update({ source: 'manual' }));
});

test('registos_fichas rejeita campos de correção em mirror', async () => {
  const ref = userA.ref('registos_fichas/44/diary_mirror-correction');
  await assertSucceeds(ref.set(mirror({ id: 'diary_mirror-correction', diaryId: 'mirror-correction' })));
  await assertFails(ref.update({ origin: 'Correção de anomalia' }));
});

test('registos_fichas permite apagar log manual usado pelo runtime', async () => {
  const ref = userA.ref('registos_fichas/44/manual-delete');
  await assertSucceeds(ref.set(fichaLog({ id: 'manual-delete' })));
  await assertSucceeds(ref.remove());
});

test('registos_fichas permite apagar mirror obsoleto durante sincronização', async () => {
  const ref = userA.ref('registos_fichas/44/diary_mirror-delete');
  await assertSucceeds(ref.set(mirror({ id: 'diary_mirror-delete', diaryId: 'mirror-delete' })));
  await assertSucceeds(ref.remove());
});

test('memoria_tecnica valida estrutura e é imutável', async () => {
  const ref = userA.ref('memoria_tecnica/memory-1');
  await assertSucceeds(ref.set(memory()));
  await assertFails(ref.update({ ruleText: 'alterada' }));
  await assertFails(ref.remove());
  const missingSourceQuestion = memory({ id: 'missing' });
  delete missingSourceQuestion.sourceQuestion;
  await assertFails(userA.ref('memoria_tecnica/missing').set(missingSourceQuestion));
  await assertFails(userA.ref('memoria_tecnica/bad-type').set(memory({ id: 'bad-type', version: '1' })));
  await assertFails(userA.ref('memoria_tecnica/bad-field').set(memory({ id: 'bad-field', arbitrary: true })));
  await assertSucceeds(userA.ref('memoria_tecnica/direct-approved').set(memory({ id: 'direct-approved' })));
});

test('historico_tecnico_diario preserva descarte e bloqueia imagens e mutações', async () => {
  const ref = userA.ref('historico_tecnico_diario/h1');
  await assertSucceeds(ref.set(technicalHistory({ id: 'h1' })));
  await assertFails(userA.ref('historico_tecnico_diario/bad-image').set(technicalHistory({ id: 'bad-image', imageStored: true })));
  await assertFails(userA.ref('historico_tecnico_diario/bad-discard').set(technicalHistory({ id: 'bad-discard', imageDiscarded: false })));
  await assertFails(userA.ref('historico_tecnico_diario/bad-validation').set(technicalHistory({ id: 'bad-validation', validatedByHuman: false })));
  for (const field of ['image', 'imageUrl', 'imageBase64', 'photo', 'photoUrl', 'storagePath']) {
    await assertFails(userA.ref(`historico_tecnico_diario/bad-${field}`).set(technicalHistory({ id: `bad-${field}`, [field]: 'forbidden' })));
  }
  await assertFails(ref.update({ validatedByHuman: false }));
  await assertFails(ref.remove());
});

test('userB tem acesso autenticado partilhado, sem isolamento por UID', async () => {
  await assertSucceeds(userA.ref('registos_diarios/shared').set(diary({ text: 'Criado por A' })));
  await assertSucceeds(userB.ref('registos_diarios/shared').once('value'));
  await assertSucceeds(userB.ref('registos_diarios/shared').update({ text: 'Alterado por B' }));
});
