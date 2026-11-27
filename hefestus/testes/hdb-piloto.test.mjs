import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarPiloto, criarLote, conferirPiloto, conferirLote, CAPACIDADES_HDB } from '../ferramentas/hdb-piloto.mjs';

test('HDB preserva uma capacidade versionada com identidade F1 e receita', async () => {
  const { pacote, referencia, manifesto } = await criarPiloto();
  const rel = await conferirPiloto(pacote, referencia);
  assert.equal(rel.status, 'integridade-verificada');
  assert.match(rel.id, /^cap-[0-9a-f]{10}$/);
  assert.equal(rel.arquivos, 5);
  assert.equal(rel.versao, manifesto.versao);
  assert.deepEqual(manifesto.receita.argumentos, ['--test', 'testes/armazem.test.mjs']);
  assert.equal(manifesto.runtime.dependenciasExternas.length, 0);
});

test('HDB não aceita pacote sem o blob da capacidade', async () => {
  const { pacote, referencia } = await criarPiloto();
  pacote.blobs = {};
  await assert.rejects(conferirPiloto(pacote, referencia));
});

test('referência deve fixar a versão que foi preservada', async () => {
  const { pacote } = await criarPiloto();
  await assert.rejects(conferirPiloto(pacote, 'compartilhado/hefestus/armazem-piloto'), /referência exata/);
});

test('lote preserva capacidades distintas e versão de preservação independente', async () => {
  const quantidade = Object.keys(CAPACIDADES_HDB).length;
  const { pacote, referencias } = await criarLote(undefined, '2.1.1');
  assert.equal(referencias.length, quantidade);
  assert.equal((await conferirLote(pacote)).length, quantidade);
  const ids = new Set();
  for (const r of referencias) {
    const verificado = await conferirPiloto(pacote, r.referencia);
    assert.equal(verificado.status, 'integridade-verificada');
    assert.equal(verificado.versao, '2.1.1');
    assert.equal(verificado.manifesto.versaoAplicativo, '2.1.0');
    ids.add(verificado.id);
  }
  assert.equal(ids.size, quantidade);
});
