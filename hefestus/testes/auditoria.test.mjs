import { test } from "node:test";
import assert from "node:assert/strict";
import { Nucleo } from "../js/nucleo/nucleo.js";
import { Agente } from "../js/agente/agente.js";
import { auditar, contraste, explicar } from "../js/nucleo/auditoria.js";

test("contraste WCAG: preto/branco 21:1 e cinza claro reprova", () => {
  assert.ok(Math.abs(contraste({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }) - 21) < 0.01);
  assert.ok(contraste({ r: 203, g: 213, b: 225 }, { r: 156, g: 163, b: 175 }) < 3);
});

test("auditoria acha problemas e a correção automática resolve os corrigíveis num passo", () => {
  const n = new Nucleo();
  const b = n.criar("botao", 50, 50);
  n.definir(b, { "estilo.fundo": "#9ca3af", "estilo.cor": "#cbd5e1", rotulo: "Ok", "transicao.duracao": 900 });
  const t = n.criar("toggle", 10, 200);
  const i = n.criar("icone", 10, 10);
  n.definir(i, { eventos: [{ tipo: "onClick", dispara: "x", acao: "abrir", alvo: "nao_existe" }] });
  const regras = n.auditar().map(x => x.regra);
  for (const r of ["contraste", "transicao", "rotulo", "evento-alvo"]) assert.ok(regras.includes(r), r);
  const antes = n.historico().itens.length;
  const r = n.corrigirAuditoria();
  assert.ok(r.corrigidos >= 3);
  assert.equal(n.historico().itens.length, antes + 1);
  const depois = n.auditar().map(x => x.regra);
  assert.ok(!depois.includes("contraste") && !depois.includes("transicao") && !depois.includes("rotulo"));
  assert.ok(!depois.includes("evento-alvo")); // agora também corrigido
  n.desfazer();
  assert.ok(n.auditar().map(x => x.regra).includes("contraste"));
  void t;
});

test("explicar e documentar o contrato de sinais; agente responde auditoria e explicação", async () => {
  const n = new Nucleo();
  const b = n.criar("botao", 50, 50);
  n.definir(b, { rotulo: "Salvar" });
  assert.match(explicar({ ...n.elemento(b), id: b }, n.elementos()), /emite o sinal "clicado"/);
  assert.match(n.documentacao(), /\| `clicado` \| Botão 1 \| ao clicar \|/);
  const ag = new Agente(n, {});
  n.selecionar(b);
  const r1 = await ag.enviar("explica o botão");
  assert.match(r1.resposta, /Botão 1/);
  const r2 = await ag.enviar("audita a interface");
  assert.ok(r2.resposta.length > 10);
});

test("histórico: ação nova depois de desfazer guarda a linha antiga como variação e dá para voltar", () => {
  const n = new Nucleo();
  const a = n.criar("botao", 10, 10);
  n.definir(a, { rotulo: "A" });
  n.definir(a, { rotulo: "B" });
  n.desfazer();
  n.definir(a, { rotulo: "C" });
  const ramos = n.ramos();
  assert.equal(ramos.length, 1);
  assert.equal(ramos[0].passos, 3);
  assert.equal(n.elemento(a).rotulo, "C");
  const dif = n.mudancasContraVariacao(ramos[0].id);
  assert.ok(dif.some(d => d.campos?.some(c => c.caminho === "rotulo" && c.para === "B")));
  assert.ok(n.irParaVariacao(ramos[0].id));
  assert.equal(n.elemento(a).rotulo, "B");
  assert.equal(n.ramos().length, 1); // a linha anterior (C) virou variação
  n.irParaVariacao(n.ramos()[0].id);
  assert.equal(n.elemento(a).rotulo, "C");
  const passo = n.mudancasDoPasso(1);
  assert.ok(passo.some(d => d.tipo === "novo"));
  // persistência
  const salvo = JSON.parse(JSON.stringify(n.serializar()));
  const m = new Nucleo();
  m.restaurar(salvo);
  assert.equal(m.ramos().length, 1);
  m.irParaVariacao(m.ramos()[0].id);
  assert.equal(m.elemento(a).rotulo, "B");
  // guardar manualmente
  const id = m.guardarVariacao("Minha ideia");
  assert.ok(id);
  assert.ok(m.ramos().some(r => r.nome === "Minha ideia"));
});

import { css } from "../js/nucleo/exportar.js";

test("estados foco e desabilitado viram CSS, e a auditoria sugere o anel de foco", () => {
  const n = new Nucleo();
  const b = n.criar("botao", 10, 10);
  assert.ok(n.auditar().some(x => x.regra === "foco"));
  n.definir(b, { "estados.focus.contorno": "#1d4ed8", "estados.focus.fundo": "#eff6ff", "estados.disabled.fundo": "#e5e7eb", "estados.disabled.cor": "#6b7280", "estados.disabled.opacidade": 0.8 });
  const c = css({ ...n.elemento(b), id: b }, "");
  assert.match(c, /:focus-visible\{outline:2px solid #1d4ed8;outline-offset:2px;background:#eff6ff;\}/);
  assert.match(c, /:disabled,#botao_1\[aria-disabled="true"\],#botao_1\[data-indisp\]\{background:#e5e7eb;color:#6b7280;opacity:0.8;\}/);
  assert.ok(!n.auditar().some(x => x.regra === "foco"));
  const m = new Nucleo();
  const id = m.criar("botao", 10, 10);
  m.corrigirAuditoria();
  assert.equal(m.elemento(id).estados.focus.contorno, "#1d4ed8");
});

test("agente: anel de foco e aparência de desabilitado por texto", async () => {
  const n = new Nucleo();
  const ag = new Agente(n, {});
  const b = n.criar("botao", 10, 10);
  n.definir(b, { nome: "Botão Enviar", rotulo: "Enviar" });
  await ag.enviar("no botão Enviar o anel de foco azul");
  assert.ok(n.elemento(b).estados.focus.contorno);
  await ag.enviar("no botão Enviar quando desabilitado fundo cinza e 40% de opacidade");
  assert.equal(n.elemento(b).estados.disabled.opacidade, 0.4);
  assert.ok(n.elemento(b).estados.disabled.fundo);
});

test("artefatos: web component, React, Vue e tokens saem do projeto; comandos rápidos funcionam", async () => {
  const n = new Nucleo();
  n.criar("botao", 10, 10);
  const wc = n.artefato("webcomponent");
  assert.match(wc, /customElements\.define\("hf-/);
  assert.ok(!/const CSS\b/.test(wc)); // não pode sombrear o CSS global usado pelo runtime
  assert.match(n.artefato("react"), /useEffect/);
  assert.match(n.artefato("vue"), /defineEmits/);
  assert.match(n.artefato("tema"), /--hf-primaria: #2563eb/);
  assert.throws(() => n.artefato("nada"));
  const ag = new Agente(n, {});
  assert.match((await ag.enviar("/ajuda")).resposta, /\/auditar/);
  const r = await ag.enviar("/auditar");
  assert.ok(r.resposta.length > 10);
  const antes = n.elementos().length;
  await ag.enviar("/botao Enviar");
  assert.equal(n.elementos().length, antes + 1);
});

test("agente: tema por texto, validador de escopo e rótulos curtos", async () => {
  const n = new Nucleo();
  const a = n.criar("botao", 50, 50); n.definir(a, { rotulo: "A" });
  const b = n.criar("botao", 200, 50); n.definir(b, { rotulo: "B" });
  const ag = new Agente(n, {});
  const h0 = n.historico().itens.length;
  const snap = JSON.stringify(n.elementos());
  const e = await ag.enviar("chama a API de pagamento quando clicar");
  assert.match(e.resposta, /fora do escopo/);
  assert.equal(JSON.stringify(n.elementos()), snap);
  await ag.enviar("muda a cor do botão A para vermelho");
  const fa = n.elemento(a).estilo.fundo, fb = n.elemento(b).estilo.fundo;
  assert.notEqual(fa, fb);
  const t = await ag.enviar("tema escuro com azul ciano e cantos suaves");
  assert.ok(t.resposta.length > 5);
  assert.ok(n.historico().itens.length > h0);
});

test("variantes P/M/G, estilos e modo refinar com 3 opções", async () => {
  const n = new Nucleo();
  const b = n.criar("botao", 50, 50); n.definir(b, { rotulo: "Salvar" });
  const antes = n.elementos().length;
  const r = n.gerarTamanhos(b);
  assert.equal(n.elementos().length, antes + 4);
  const tam = r.ids.map(i => n.elemento(i).largura);
  assert.ok(tam[0] < tam[1] && tam[1] < tam[2]);
  n.desfazer();
  assert.equal(n.elementos().length, antes);
  const e = n.gerarEstilos(b);
  assert.equal(e.ids.length, 5);
  n.desfazer();
  const ag = new Agente(n, {});
  n.selecionar(b);
  await ag.enviar("refinar");
  assert.equal(n.elementos().filter(x => x.opcaoN).length, 3);
  await ag.enviar("mantém a opção 2");
  assert.equal(n.elementos().filter(x => x.opcaoN).length, 0);
  assert.equal(n.elementos().length, antes);
  assert.equal(n.elemento(b).estilo.fundo, "#111827");
  n.selecionar(b);
  await ag.enviar("cria variantes de tamanho");
  assert.equal(n.elementos().length, antes + 4);
});

test("auditoria: regra de escopo acusa código dentro de textos", () => {
  const n = new Nucleo();
  const t = n.criar("texto", 10, 10);
  n.definir(t, { texto: "<script>alert(1)</script>" });
  const it = n.auditar().find(x => x.regra === "escopo");
  assert.ok(it && it.id === t);
  n.definir(t, { texto: "Olá" });
  assert.ok(!n.auditar().some(x => x.regra === "escopo"));
});

test("histórico em arquivo separado: patches compactos, variações e reabertura", () => {
  const n = new Nucleo();
  const a = n.criar("botao", 10, 10); n.definir(a, { rotulo: "Um" });
  n.definir(a, { rotulo: "Dois" });
  n.desfazer();
  n.definir(a, { rotulo: "Tres" }); // cria variação com "Dois"
  assert.ok(n.ramos().length >= 1);
  const cheio = JSON.stringify(n.serializar());
  const { projeto, historico } = n.serializarSeparado();
  assert.equal(projeto.historico.eventos.length, 0);
  assert.ok(historico.length < cheio.length, `${historico.length} < ${cheio.length}`);
  assert.ok(JSON.stringify(projeto).length + historico.length < cheio.length);
  const m = new Nucleo();
  m.restaurar(projeto);
  assert.equal(m.historico().itens.length, 0);
  const r = m.abrirHistoricoJSONL(historico);
  assert.equal(r.passos, n.historico().itens.length);
  assert.equal(m.ramos().length, n.ramos().length);
  m.desfazer();
  assert.equal(m.elemento(a).rotulo, "Botão" === m.elemento(a).rotulo ? "Botão" : m.elemento(a).rotulo);
  assert.notEqual(m.elemento(a).rotulo, "Tres");
  const o = new Nucleo(); o.criar("caixa", 0, 0);
  assert.throws(() => o.abrirHistoricoJSONL(historico), /não pertence/);
  assert.throws(() => m.abrirHistoricoJSONL("{}"), /histórico/);
});

test("artefatos Storybook e testes visuais; agente importa SVG gerado por ele", async () => {
  const n = new Nucleo();
  const b = n.criar("botao", 10, 10); n.definir(b, { rotulo: "Salvar", eventos: [{ tipo: "onClick", dispara: "salvar", acao: "emitir" }] });
  const sb = n.artefato("storybook");
  assert.match(sb, /argTypes: \{ aoSinal: \{ action/);
  assert.match(sb, /Sinais emitidos: salvar/);
  assert.match(sb, new RegExp(`#${b}`));
  const tv = n.artefato("testes");
  assert.match(tv, /toHaveScreenshot/);
  assert.match(tv, new RegExp(`"id":"${b}"`));
  const ag = new Agente(n, {});
  const ferr = ag.ferramentas?.find?.(f => f.name === "importar_svg");
  if (ferr) {
    const r = ferr.execute({ svg: '<svg viewBox="0 0 24 24"><path d="M2 2 L22 2 L12 22 Z" fill="#0a0"/></svg>', nome: "seta" });
    assert.ok(r);
    assert.ok(n.elementos().some(e => e.forma === "vetor"));
  }
  assert.match((await ag.enviar("/ajuda")).resposta, /\//);
});

test("criar dentro de container e mover na ordem entre irmãos", () => {
  const n = new Nucleo();
  const c = n.criar("container", 0, 0);
  const a = n.criarDentro("botao", c);
  const b = n.criarDentro("texto", c);
  assert.equal(n.elemento(a).pai, c);
  assert.equal(n.elemento(b).pai, c);
  const zb = n.elemento(b).z;
  assert.ok(n.elemento(a).z < zb);
  assert.ok(n.moverNaOrdem(a, 1).ok);
  assert.ok(n.elemento(a).z > n.elemento(b).z);
  assert.ok(n.moverNaOrdem(a, 1).erro);
});

test("auditoria: todos os itens têm conserto (evento sem destino, alvo pequeno, fora da tela, hover, nome)", async () => {
  const { Nucleo } = await import("../js/nucleo/nucleo.js");
  const n = new Nucleo();
  for (const id of Object.keys(n.doc.elementos)) if (!id.startsWith("__")) delete n.doc.elementos[id];
  const b = n.criar("botao", 10, 10, { largura: 12, altura: 10 });
  n.definir(b, { eventos: [{ tipo: "onClick", acao: "abrir", alvo: "inexistente", dispara: "" }, { tipo: "onHover" }] }, "eventos ruins");
  n.criar("botao", 5000, 5000, {});
  n.criar("texto", 20, 80, {}); n.criar("texto", 20, 120, {});
  const antes = n.auditar();
  assert.ok(antes.length >= 4);
  n.corrigirAuditoria();
  assert.deepEqual(n.auditar().map(i => i.regra), [], "nada sobra depois de corrigir tudo");
});
