import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment, assertSucceeds } from '@firebase/rules-unit-testing';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const exportPath = process.env.PMP_FIREBASE_EXPORT || path.join(root, 'Downloads', 'manutencao-semanal-default-rtdb-export.json');
const emulatorHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '';
const [host, portText] = emulatorHost.split(':');
if (!['localhost', '127.0.0.1'].includes(host)) {
  throw new Error(`Compatibility checks require a local emulator host; received ${emulatorHost || '(unset)'}`);
}
const port = Number(portText || 9000);
if (!Number.isInteger(port) || port <= 0) throw new Error(`Invalid local emulator port: ${emulatorHost}`);
if (!fs.existsSync(exportPath)) throw new Error(`Local export not found: ${exportPath}`);

const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
const keys = value => value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : [];
const typeOf = value => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
const fieldTypes = value => Object.fromEntries(keys(value).map(key => [key, typeOf(value[key])]));
const isMirror = (entryId, value) => /^diary_/.test(entryId) && value?.source === 'diary';
const isManual = value => value && value.source === undefined && value.diaryId === undefined;

const failures = [];
const result = { registos_diarios: { total: 0, pass: 0, fail: 0 }, registos_fichas: { total: 0, pass: 0, fail: 0, manual: 0, mirrors: 0, unknown: 0 }, memoria_tecnica: { total: 0, pass: 0, fail: 0 }, historico_tecnico_diario: { total: 0, pass: 0, fail: 0 }, otherPaths: [] };

const classify = (rootPath, id, value, error) => failures.push({ path: `${rootPath}/${id}`, fields: keys(value), types: fieldTypes(value), reason: error?.code || error?.message?.split(':')[0] || 'PERMISSION_DENIED' });

const env = await initializeTestEnvironment({ projectId: 'pmp-production-compat', database: { host, port, rules: fs.readFileSync(path.join(root, 'database.rules.json'), 'utf8') } });
try {
  const db = env.authenticatedContext('compat-reader').database();
  const write = async (rootPath, id, value, bucket) => {
    result[bucket].total++;
    try { await assertSucceeds(db.ref(`${rootPath}/${id}`).set(value)); result[bucket].pass++; }
    catch (error) { result[bucket].fail++; classify(rootPath, id, value, error); }
  };

  for (const [id, value] of Object.entries(exported.registos_diarios || {})) await write('registos_diarios', id, value, 'registos_diarios');
  for (const [fichaId, entries] of Object.entries(exported.registos_fichas || {})) {
    for (const [entryId, value] of Object.entries(entries || {})) {
      const kind = isMirror(entryId, value) ? 'mirrors' : isManual(value) ? 'manual' : 'unknown';
      result.registos_fichas[kind]++;
      result.registos_fichas.total++;
      try { await assertSucceeds(db.ref(`registos_fichas/${fichaId}/${entryId}`).set(value)); result.registos_fichas.pass++; }
      catch (error) { result.registos_fichas.fail++; classify(`registos_fichas/${fichaId}`, entryId, value, error); }
    }
  }
  for (const [id, value] of Object.entries(exported.memoria_tecnica || {})) await write('memoria_tecnica', id, value, 'memoria_tecnica');
  for (const [id, value] of Object.entries(exported.historico_tecnico_diario || {})) await write('historico_tecnico_diario', id, value, 'historico_tecnico_diario');
  result.otherPaths = Object.keys(exported).filter(key => !['registos_diarios', 'registos_fichas', 'memoria_tecnica', 'historico_tecnico_diario'].includes(key));
  console.log(JSON.stringify({ exportPath, topLevelPaths: Object.keys(exported), result, failures }));
} finally { await env.cleanup(); }
