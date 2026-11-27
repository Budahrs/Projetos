import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarSessao, adicionarFala, exportarSessao, importarSessao } from '../js/shell/sessaoConversa.js';

test('sessão exportada e importada mantém falas separadas por persona', () => {
  const personas = ['aura', 'clara'];
  const s = criarSessao(personas, 'clara');
  adicionarFala(s, 'aura', 'user', 'Nota de teste');
  adicionarFala(s, 'clara', 'assistant', 'Resposta de teste');
  const pacote = exportarSessao(s, new Date('2026-11-21T00:00:00Z'));
  assert.deepEqual(importarSessao(pacote, personas), s);
  assert.equal(s.conversas.aura.length, 1);
  assert.equal(s.conversas.clara.length, 1);
});
