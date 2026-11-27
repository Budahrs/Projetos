import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORMAS, formasPorCategoria, miniaturaForma } from '../js/nucleo/formas.js';

test('biblioteca de formas agrupa sem perder identidades e gera miniatura', () => {
  const ids = formasPorCategoria().flatMap(c => c.itens.map(x => x.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids.sort(), Object.keys(FORMAS).sort());
  assert.match(miniaturaForma('retangulo'), /<svg.*<path/);
});
