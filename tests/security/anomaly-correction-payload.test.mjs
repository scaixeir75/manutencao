import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('markAnomalyAsResolved produz created em epoch milliseconds', () => {
  const source = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(source, /tech:'Correção de anomalia'.*created:Date\.now\(\)/s);
});
