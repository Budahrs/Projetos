import test from 'node:test';
import assert from 'node:assert/strict';
import { documentosSoftware } from '../js/nucleo/especificacaoSoftware.js';
import { textoDoProjeto, lerProjeto } from '../js/nucleo/arquivoProjeto.js';

test('documentação registra somente requisitos declarados e inventaria eventos reais', () => {
  const doc = { nome: 'Teste', elementos: { b: { id: 'b', eventos: [{ evento: 'onClick', sinal: 'salvar' }] } } };
  const arquivos = documentosSoftware(doc);
  const s = JSON.parse(arquivos['documentos/especificacao.json']);
  assert.deepEqual(s.requisitos, []);
  assert.equal(s.comandos.length, 1);
  assert.match(arquivos['documentos/06-plano-testes-QA.md'], /Não executada/);
  assert.match(arquivos['documentos/01-produto-PRD.md'], /A definir/);
});

test('salvar inclui documentação atual e mantém compatibilidade e decisões autorais', () => {
  const original = { formato: 'hefestus', versao: 1, documento: { nome: 'Autor', elementos: {}, especificacaoSoftware: { produto: { objetivo: 'Organizar PDFs' }, requisitos: ['RF01: abrir PDF'] } } };
  const texto = textoDoProjeto(original);
  const aberto = lerProjeto(texto);
  assert.deepEqual(aberto.documento, original.documento);
  assert.match(aberto.documentacao.arquivos['documentos/01-produto-PRD.md'], /Organizar PDFs/);
  assert.equal(original.documentacao, undefined);
  assert.deepEqual(lerProjeto(JSON.stringify(original)).documento, original.documento);
});
