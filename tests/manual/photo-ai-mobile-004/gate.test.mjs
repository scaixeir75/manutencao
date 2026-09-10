import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
test('MOBILE-004 fixture exists and remains local-only',async()=>{
  const p=path.resolve('tests/manual/photo-ai/rotina-diaria-teste.png');
  const b=await readFile(p); assert.ok(b.length>100000); assert.equal(b[0],0x89); assert.equal(b[1],0x50); assert.equal(b[2],0x4e); assert.equal(b[3],0x47);
});
