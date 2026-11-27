import { test } from "node:test";
import assert from "node:assert/strict";
import { selecionarNoRetangulo, podeSelecionar } from "../js/nucleo/selecao.js";
import { Nucleo } from "../js/nucleo/nucleo.js";

const caixa = (id, x, y, largura, altura, extra = {}) => ({ id, x, y, largura, altura, tipo: "caixa", ...extra });
test("retângulo inclui container vazio e seleciona o pai uma única vez", () => {
  const els = [caixa("grupo", 10, 10, 100, 100, { tipo: "container" }), caixa("filho", 20, 20, 20, 20, { pai: "grupo" }), caixa("vazio", 150, 10, 30, 30, { tipo: "container" })];
  assert.deepEqual(selecionarNoRetangulo(els, { x: 0, y: 0, largura: 200, altura: 120 }), ["grupo", "vazio"]);
  assert.deepEqual(selecionarNoRetangulo(els, { x: 15, y: 15, largura: 30, altura: 30 }), ["filho"]);
});
test("Alt seleciona por interseção; padrão exige objeto inteiro", () => {
  const els = [caixa("parcial", 20, 20, 100, 100)];
  const r = { x: 0, y: 0, largura: 30, altura: 30 };
  assert.deepEqual(selecionarNoRetangulo(els, r), []);
  assert.deepEqual(selecionarNoRetangulo(els, r, true), ["parcial"]);
});
test("pais ocultos e bloqueados impedem seleção dos descendentes", () => {
  const els = [caixa("oculto", 0, 0, 100, 100, { visivel: false }), caixa("filho", 10, 10, 10, 10, { pai: "oculto" }), caixa("bloqueado", 0, 0, 100, 100, { travado: true }), caixa("outro", 10, 10, 10, 10, { pai: "bloqueado" })];
  assert.deepEqual(selecionarNoRetangulo(els, { x: 0, y: 0, largura: 200, altura: 200 }), []);
});
test("ciclo de parentesco inválido não bloqueia a ferramenta", () => {
  const a = caixa("a", 0, 0, 1, 1, { pai: "b" }), b = caixa("b", 0, 0, 1, 1, { pai: "a" });
  assert.equal(podeSelecionar(a, { a, b }), false);
});
test("selecionar tudo e inverter ignoram objetos ocultos e bloqueados", () => {
  const n = new Nucleo();
  n.doc.elementos = { __canvas: n.tela, livre: caixa("livre", 0, 0, 10, 10), oculto: caixa("oculto", 0, 0, 10, 10, { visivel: false }), bloqueado: caixa("bloqueado", 0, 0, 10, 10, { travado: true }) };
  n.selecionarTudo(); assert.deepEqual(n.selecionados(), ["livre"]);
  n.inverterSelecao(); assert.deepEqual(n.selecionados(), []);
});
