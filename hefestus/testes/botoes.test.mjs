import { test } from "node:test";
import assert from "node:assert/strict";
import { MODELOS, CATEGORIAS_MODELOS } from "../js/nucleo/modelos.js";
import { Nucleo } from "../js/nucleo/nucleo.js";
import { EFEITOS_BOTAO, propsEfeitoBotao, miniaturaEfeitoBotao, textoSobre } from "../js/nucleo/efeitosBotao.js";
import { examinarDocumento } from "../js/nucleo/recuperacao.js";

test("todo efeito de botão devolve estilo completo e uma miniatura válida", () => {
  assert.ok(EFEITOS_BOTAO.length >= 12);
  for (const e of EFEITOS_BOTAO) {
    const p = propsEfeitoBotao(e.id, "#2563eb", "#22d3ee");
    for (const k of ["estilo.fundo", "estilo.borda", "estilo.cor", "estilo.efeitos", "estilo.preenchimentos"]) assert.ok(k in p, `${e.id}: falta ${k}`);
    assert.match(miniaturaEfeitoBotao(e.id), /background:/);
  }
  assert.equal(textoSobre("#ffffff"), "#111827");
  assert.equal(textoSobre("#0b1020"), "#ffffff");
});

test("aplicar efeito de botão muda o selecionado em um único passo desfazível", () => {
  const n = new Nucleo(); n.novo(false);
  const id = n.criar("botao", 10, 10, { rotulo: "Salvar", estilo: { fundo: "#16a34a" } });
  n.selecionar(id);
  const antes = JSON.stringify(n.elemento(id).estilo);
  assert.equal(n.aplicarEfeitoBotao("relevo").acao, "aplicado");
  assert.ok(n.elemento(id).estilo.efeitos.length >= 3 && n.elemento(id).estilo.preenchimentos.length === 1);
  n.aplicarEfeitoBotao("ondulacao");
  assert.equal(n.elemento(id).animacao.clique, "ondulacao");
  assert.ok(n.html().includes("hf-botao"));
  n.desfazer(); n.desfazer();
  assert.equal(JSON.stringify(n.elemento(id).estilo), antes);
});

test("a categoria Botões existe e seus modelos entram sem problemas no documento", () => {
  assert.ok(CATEGORIAS_MODELOS.includes("Botões"));
  const bot = MODELOS.filter(m => m.cat === "Botões");
  assert.ok(bot.length >= 6);
  for (const m of bot) {
    const n = new Nucleo(); n.novo(false);
    const ids = n.inserirModelo(m, 0, 0);
    assert.ok(ids.some(i => n.elemento(i).tipo === "botao"), m.nome);
    assert.deepEqual(examinarDocumento(n.doc).problemas, [], m.nome);
  }
});

test("inserir um modelo seleciona só as peças abertas, não a gaveta que começa fechada", () => {
  const n = new Nucleo(); n.novo(false);
  n.inserirModelo(MODELOS.find(m => m.id === "navResponsiva"), 0, 0);
  const sel = n.selecionados();
  assert.ok(sel.length >= 1);
  for (const id of sel) assert.ok(!n.elemento(id).abertura?.iniciaFechado, id);
});

test("o modelo Menu do Hefestus nasce do menu real: abas no padrão do PowerPoint, ícones, submenus e grupos novos", async () => {
  const { HEFESTUS_MENU_SPEC: spec } = await import("../js/nucleo/hefestusMenuSpec.js");
  // v0.33 reorganizou a faixa como o PowerPoint (menuEstrutura.js); Formatar é a aba contextual (com seleção)
  assert.deepEqual(spec.map(a => a.id), ["arquivo", "inicio", "inserir", "desenhar", "design", "layout", "comportamento", "revisao", "exibir", "ajuda", "formatar"]);
  const todos = spec.flatMap(a => a.grupos.flatMap(g => g.comandos));
  assert.ok(todos.length >= 160);
  assert.ok(todos.every(c => c.icone && (c.tam === "grande" || c.tam === "pequeno")));
  const grupos = spec.flatMap(a => a.grupos.map(g => g.nome));
  for (const g of ["Componentes", "Formulário", "Sistemas", "Painéis", "Texto", "Efeitos de botão", "Armazém", "Componente"]) assert.ok(grupos.includes(g), g);
  assert.ok(todos.some(c => c.sub?.length > 3));
  const n = new Nucleo(); n.novo(false);
  const ids = n.inserirModelo(MODELOS.find(m => m.id === "menuHefestus"), 0, 0);
  assert.ok(ids.length > 400);
  assert.deepEqual(examinarDocumento(n.doc).problemas, []);
});
