import { test } from "node:test";
import assert from "node:assert/strict";
import { Nucleo } from "../js/nucleo/nucleo.js";
import { aplicarControles, controlesDaLista } from "../js/nucleo/controlador.js";
import { dadosRuntime } from "../js/nucleo/runtime.js";
import { css } from "../js/nucleo/exportar.js";

test("interruptores preservam parâmetros e modificam só a representação executada", () => {
  const n = new Nucleo(); n.novo(false);
  const id = n.criar("botao", 10, 10);
  n.definir(id, { "estilo.sombra": "grande", "estilo.desfoque": 12, "estilo.vidro": 8, "estilo.raio": 16 });
  const antes = structuredClone(n.elemento(id));
  n.definir(id, { controlador: { sombra: false, desfoque: false, vidro: false, borda: false, contorno: false } });
  const efetivo = aplicarControles(n.elemento(id));
  assert.equal(efetivo.estilo.sombra, "nenhuma"); assert.equal(efetivo.estilo.raio, 0);
  assert.equal(efetivo.estilo.desfoque, 0); assert.equal(efetivo.estilo.vidro, 0);
  assert.equal(efetivo.estilo.larguraBorda, 0);
  assert.deepEqual(n.elemento(id).estilo, antes.estilo);
  assert.notEqual(css({ id, ...antes }), css({ id, ...n.elemento(id) }));
  n.desfazer(); assert.deepEqual(n.elemento(id).estilo, antes.estilo);
  n.refazer(); assert.equal(n.elemento(id).controlador.sombra, false);
});

test("reativar retorna aos valores configurados, inclusive efeitos avançados", () => {
  const el = { tipo: "caixa", estilo: { sombra: "media", desfoque: 9, efeitos: [{ tipo: "desfoque", blur: 7 }, { tipo: "sombra", blur: 19 }] }, controlador: { desfoque: false, sombra: false } };
  assert.deepEqual(aplicarControles(el).estilo.efeitos, []);
  el.controlador = { desfoque: true, sombra: true };
  assert.equal(aplicarControles(el).estilo.desfoque, 9);
  assert.equal(aplicarControles(el).estilo.efeitos.length, 2);
});

test("desligar reações mantém eventos e código autoral para reativar", () => {
  const el = { id: "a", tipo: "botao", estilo: {}, eventos: [{ tipo: "onClick", dispara: "teste" }], codigo: { html: "<b>Olá</b>", js: "raiz.dataset.ok='sim'" }, controlador: { reacoes: false } };
  assert.equal(dadosRuntime([el]).regras.length, 0);
  assert.equal(aplicarControles(el).codigo.js, "");
  assert.equal(el.eventos.length, 1); assert.ok(el.codigo.js);
  el.controlador.reacoes = true;
  assert.equal(dadosRuntime([el]).regras.length, 1);
});

test("controlador é salvo no projeto e preservado no artefato", () => {
  const n = new Nucleo(); n.novo(false); const id = n.criar("botao", 0, 0);
  n.definir(id, { "controlador.sombra": false, "estilo.sombra": "grande" });
  const m = new Nucleo(); m.restaurar(structuredClone(n.serializar()));
  assert.equal(m.elemento(id).controlador.sombra, false);
  const modelo = n.modeloDaSelecao([id], "Botão");
  assert.equal(modelo.elementos[0].el.estilo.sombra, "grande");
  assert.equal(modelo.elementos[0].el.controlador.sombra, false);
});

test("desligar as reações do grupo suspende suas peças sem apagar configurações", () => {
  const lista = [{ id: "grupo", tipo: "container", estilo: {}, controlador: { reacoes: false } }, { id: "botao", tipo: "botao", pai: "grupo", estilo: {}, eventos: [{ tipo: "onClick", dispara: "salvar" }] }];
  assert.equal(dadosRuntime(lista).regras.length, 0);
  assert.equal(controlesDaLista(lista)[1].eventos.length, 0);
  assert.equal(lista[1].eventos.length, 1);
  lista[0].controlador.reacoes = true;
  assert.equal(dadosRuntime(lista).regras.length, 1);
});
