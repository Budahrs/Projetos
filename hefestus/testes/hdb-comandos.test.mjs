import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CommandRegistry } from '../js/nucleo/comandos.js';

test('registro de comandos usa contexto e notifica apenas ação habilitada', () => {
  let ativo = false, contador = 0;
  const r = new CommandRegistry(() => ({ ativo }));
  r.registrar({ id: 'fixture', contexto: c => c.ativo, acao: () => ++contador });
  const eventos = []; r.observar(id => eventos.push(id));
  assert.equal(r.executar('fixture'), false);
  ativo = true; assert.equal(r.executar('fixture'), 1);
  assert.deepEqual(eventos, ['fixture']);
});
