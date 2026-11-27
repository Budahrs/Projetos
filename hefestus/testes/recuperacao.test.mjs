import { test } from "node:test";
import assert from "node:assert/strict";
import { Nucleo } from "../js/nucleo/nucleo.js";
import { examinarDocumento, compararEstados, normalizarTitulo, ultimoEstadoValido } from "../js/nucleo/recuperacao.js";
import { dadosRuntime } from "../js/nucleo/runtime.js";
import { paraComponente, deComponente } from "../js/nucleo/modelos.js";

const novo = () => { const n = new Nucleo(); n.novo(false); return n; };

test("fallback preserva zero, false e texto vazio; corrige apenas dados inválidos", () => {
  const n = novo(), id = n.criar("botao", 0, 0);
  n.definir(id, { visivel: false, rotulo: "", "estilo.opacidade": 0 });
  const doc = structuredClone(n.doc); doc.elementos[id].largura = null;
  const r = examinarDocumento(doc, n.doc);
  assert.equal(r.doc.elementos[id].largura, n.elemento(id).largura);
  assert.equal(r.doc.elementos[id].x, 0);
  assert.equal(r.doc.elementos[id].visivel, false);
  assert.equal(r.doc.elementos[id].rotulo, "");
  assert.equal(r.doc.elementos[id].estilo.opacidade, 0);
  assert.deepEqual(r.problemas.map(p => p.campo), ["largura"]);
});

test("recuperação seletiva mantém aparência nova, restaura evento e permite Voltar/Refazer", () => {
  const n = novo(), id = n.criar("botao", 40, 40);
  const cursor = n.projeto.cursor;
  const eventosAntes = structuredClone(n.elemento(id).eventos);
  n.definir(id, { "estilo.fundo": "#123456", eventos: [{ tipo: "onClick", dispara: "novo" }] });
  const c = n.compararComHistorico(cursor);
  n.recuperarCampos(c, c.mudancas.filter(m => m.campo === "eventos"));
  assert.equal(n.elemento(id).estilo.fundo, "#123456");
  assert.deepEqual(n.elemento(id).eventos, eventosAntes);
  n.desfazer(); assert.equal(n.elemento(id).eventos[0].dispara, "novo");
  n.refazer(); assert.deepEqual(n.elemento(id).eventos, eventosAntes);
});

test("recuperação parcial rejeita alvo órfão e permite recuperar o conjunto dependente", () => {
  const n = novo(), a = n.criar("botao", 0, 0), b = n.criar("menu", 100, 100);
  const cursor = n.projeto.cursor;
  const eventosAntes = structuredClone(n.elemento(a).eventos);
  n.definir(a, { eventos: [{ tipo: "onClick", acao: "abrir", alvo: b }] });
  const c = n.compararComHistorico(cursor - 1);
  const remover = c.mudancas.find(m => m.id === b);
  assert.throws(() => n.recuperarCampos(c, [remover]), /dependentes/);
  assert.ok(n.elemento(b));
  n.recuperarCampos(c, c.mudancas);
  assert.equal(n.elemento(b), undefined);
  assert.deepEqual(n.elemento(a).eventos, eventosAntes);
});

test("comparação inclui empilhamento, tela e dados internos sem truncar valores", () => {
  const n = novo(), id = n.criar("botao", 0, 0), a = structuredClone(n.doc);
  n.elemento(id).z = 99; n.tela.nome = "Outro"; n.doc.elementos.__conversa = { mensagens: ["x".repeat(80)] };
  const c = compararEstados(n.doc, a);
  assert.ok(c.some(m => m.id === id && m.campo === "z"));
  assert.ok(c.some(m => m.id === "__canvas" && m.campo === "nome"));
  assert.ok(c.some(m => m.id === "__conversa"));
});

test("carregar projeto danificado usa último estado válido e preserva o original", () => {
  const n = novo(), id = n.criar("botao", 12, 20);
  n.definir(id, { largura: 240 });
  const d = structuredClone(n.serializar()); d.documento.elementos[id].largura = null;
  const m = novo(); m.restaurar(d);
  assert.equal(m.elemento(id).largura, 240);
  assert.equal(m.originalRecuperacao.documento.elementos[id].largura, null);
  assert.ok(m.relatorioRecuperacao.length);
  assert.ok(ultimoEstadoValido(m.projeto));
});

test("ciclos, tipos desconhecidos e ações com alvo ausente são recuperados sem apagar o original", () => {
  const n = novo(), a = n.criar("container", 0, 0), b = n.criar("container", 30, 30);
  const doc = structuredClone(n.doc);
  doc.elementos[a].pai = b; doc.elementos[b].pai = a;
  doc.elementos.estranho = { tipo: "plugin_ausente", nome: "Teste", configuracao: 123 };
  doc.elementos[a].eventos = [{ tipo: "onClick", acao: "abrir", alvo: "ausente" }];
  const r = examinarDocumento(doc);
  assert.ok(r.problemas.length >= 3);
  assert.equal(r.doc.elementos.estranho.recuperacao.original.configuracao, 123);
  assert.equal(dadosRuntime([{ id: a, ...r.doc.elementos[a] }]).regras.length, 0);
  assert.equal(examinarDocumento(r.doc).valido, true);
});

test("salvamento truncado mantém cursor e documento coerentes após Voltar", () => {
  const n = novo(), id = n.criar("botao", 0, 0);
  for (let i = 1; i <= 15; i++) n.mover(id, i * 10, 0);
  n.irPara(3);
  const m = novo(); m.restaurar(structuredClone(n.serializar(4)));
  assert.equal(m.elemento(id).x, 20);
  assert.equal(m.projeto.cursor, 3);
  m.desfazer(); assert.equal(m.elemento(id).x, 10);
  m.refazer(); assert.equal(m.elemento(id).x, 20);
});

test("grupo encapsula peças, código e comportamentos em artefato reutilizável", () => {
  const n = novo(), a = n.criar("botao", 10, 10), b = n.criar("campo", 110, 10);
  const g = n.agruparEmContainer([a, b]);
  n.definir(g, { codigo: { html: "<b>Pesquisa</b>", css: "b { color: red; }", js: "raiz.dataset.pronto = 'sim';" } });
  const c = paraComponente(n.modeloDaSelecao([g], "Pesquisa"));
  const m = novo(), ids = m.inserirModelo(deComponente(c));
  const grupo = ids.find(id => m.elemento(id).grupo);
  assert.equal(m.elemento(grupo).codigo.html, "<b>Pesquisa</b>");
  assert.equal(m.filhos(grupo).length, 2);
  assert.match(m.html(), /raiz.dataset.pronto/);
  assert.throws(() => m.desagrupar(grupo), /código próprio/);
});

test("agrupar pai e filho mantém a composição interna", () => {
  const n = novo(), a = n.criar("botao", 0, 0), b = n.criar("botao", 100, 0);
  const g = n.agruparEmContainer([a, b]);
  const externo = n.agruparEmContainer([g, a]);
  assert.equal(n.elemento(a).pai, g);
  assert.equal(n.elemento(g).pai, externo);
});

test("nomes normalizados preservam siglas e marcas conhecidas", () => {
  assert.equal(normalizarTitulo(" bArRa   dE pEsQuIsA "), "Barra de Pesquisa");
  assert.equal(normalizarTitulo("menu HTML e iphone"), "Menu HTML e iPhone");
});

test("falha no comando reverte documento e histórico e preserva o estado que falhou", () => {
  const n = novo(), id = n.criar("botao", 0, 0), cursor = n.projeto.cursor;
  assert.throws(() => n.comando({ texto: "Falha", alvos: [id], propriedades: ["x"] }, d => { d.elementos[id].x = 999; throw new Error("interrompido"); }), /interrompido/);
  assert.equal(n.elemento(id).x, 0);
  assert.equal(n.projeto.cursor, cursor);
  assert.equal(n.originalRecuperacao.elementos[id].x, 999);
});

test("dados internos e propriedades numéricas aninhadas inválidas são recuperados", () => {
  const n = novo(), id = n.criar("botao", 0, 0), d = structuredClone(n.doc);
  d.elementos.__conversa = { mensagens: null };
  d.elementos.__construtor = { itens: "invalido" };
  d.elementos[id].estados.hover = null;
  d.elementos[id].estilo.opacidade = "invalido";
  const r = examinarDocumento(d, n.doc);
  assert.equal(r.doc.elementos[id].estilo.opacidade, 1);
  assert.ok(r.doc.elementos[id].estados.hover);
  assert.equal(examinarDocumento(r.doc).valido, true);
});

test("principal corrompido abre backup e impede sobrescrever o original silenciosamente", () => {
  const n = novo(), id = n.criar("botao", 40, 20);
  clearTimeout(n._timer);
  const mapa = new Map([["hefestus.projeto.v1", "{incompleto"], ["hefestus.projeto.v1.valido", JSON.stringify(n.serializar())]]);
  globalThis.localStorage = { getItem: k => mapa.get(k) ?? null, setItem: (k, v) => mapa.set(k, v) };
  try {
    const m = new Nucleo();
    assert.equal(m.elemento(id).x, 40);
    assert.equal(m.originalRecuperacao, "{incompleto");
    assert.equal(m.salvarLocalAgora(), false);
    assert.equal(mapa.get("hefestus.projeto.v1"), "{incompleto");
    assert.equal(m.retomarSalvamento(), true);
    assert.equal(JSON.parse(mapa.get("hefestus.projeto.v1.original")), "{incompleto");
    assert.equal(JSON.parse(mapa.get("hefestus.projeto.v1")).formato, "hefestus");
  } finally { delete globalThis.localStorage; }
});

test("falha de armazenamento é visível e não apaga a última cópia íntegra", () => {
  const n = novo(); clearTimeout(n._timer);
  globalThis.localStorage = { getItem: () => "copia-anterior", setItem: () => { throw new Error("QuotaExceededError"); } };
  try {
    assert.equal(n.salvarLocalAgora(), false);
    assert.match(n.erroSalvamento, /exporte/);
  } finally { delete globalThis.localStorage; }
});

test("nome e rótulo podem ser auditados e corrigidos em um passo desfazível", () => {
  const n = novo(), id = n.criar("botao", 0, 0, { nome: "bOtAo dE tEsTe", rotulo: "aBrIr mEnU" });
  const c = n.projeto.cursor;
  n.padronizarNomes();
  assert.equal(n.elemento(id).nome, "Botao de Teste");
  assert.equal(n.elemento(id).rotulo, "Abrir Menu");
  assert.equal(n.projeto.cursor, c + 1);
  n.desfazer(); assert.equal(n.elemento(id).nome, "bOtAo dE tEsTe");
});
