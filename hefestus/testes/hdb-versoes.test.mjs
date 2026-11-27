import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compararVersoes, satisfaz, proximaVersao, maiorQueSatisfaz } from '../js/nucleo/versoes.js';

test('versionamento ordena números e seleciona versão compatível', () => {
  assert.ok(compararVersoes('2.10.0', '2.9.0') > 0);
  assert.equal(maiorQueSatisfaz(['1.0.0', '1.2.0', '2.0.0'], '^1.0.0'), '1.2.0');
  assert.equal(satisfaz('2.0.0', '^1.0.0'), false);
});

test('versionamento mantém semântica de correção e recurso', () => {
  assert.equal(proximaVersao('2.1.0', 'correcao'), '2.1.1');
  assert.equal(proximaVersao('2.1.0', 'recurso'), '2.2.0');
});
