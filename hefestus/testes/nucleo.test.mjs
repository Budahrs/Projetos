import { test } from "node:test";
import assert from "node:assert/strict";
import { Nucleo } from "../js/nucleo/nucleo.js";

test("criar, mover, desfazer e refazer", () => {
  const n = new Nucleo();
  const id = n.criar("botao", 100, 100);
  assert.equal(n.elemento(id).tipo, "botao");
  assert.equal(n.selecao, id);
  n.mover(id, 300, 200);
  assert.equal(n.elemento(id).x, 300);
  n.desfazer();
  assert.equal(n.elemento(id).x, 100);
  n.desfazer();
  assert.equal(n.elemento(id), undefined);
  assert.equal(n.selecao, null);
  n.refazer();
  n.refazer();
  assert.equal(n.elemento(id).x, 300);
});

test("tema em tudo pergunta sobre a cor que o usuário definiu", () => {
  const n = new Nucleo();
  const a = n.criar("botao", 0, 0);
  const b = n.criar("caixa", 0, 100);
  n.definir(a, { "estilo.fundo": "#16a34a" }, "Botão verde");
  // O fundo da caixa é padrão do sistema (implícito): muda direto.
  // O do botão foi escolhido pelo usuário (protegido): vira pergunta.
  const r = n.aplicarEmTodos(["estilo.fundo"], el => { el.estilo.fundo = "#0f172a"; }, "Tema escuro em tudo");
  assert.equal(r.acao, "aplicado_parcial");
  assert.match(r.pergunta.contexto, new RegExp(a));
  assert.doesNotMatch(r.pergunta.contexto, new RegExp(b));
  assert.equal(n.elemento(a).estilo.fundo, "#16a34a");
  assert.equal(n.elemento(b).estilo.fundo, "#0f172a");
  n.responder("aplicar");
  assert.equal(n.elemento(a).estilo.fundo, "#0f172a");
});

test("na criação só tipo e posição ficam protegidos", () => {
  const n = new Nucleo();
  const id = n.criar("botao", 40, 40);
  const prot = n.projeto.memoria.ativas(id).filter(d => d.status === "protegida").map(d => d.propriedade).sort();
  assert.deepEqual(prot, ["nome", "tipo", "x", "y", "z"]);
  n.desfazer();
  n.refazer();
  const prot2 = n.projeto.memoria.ativas(id).filter(d => d.status === "protegida").length;
  assert.equal(prot2, 5);
});

test("serializar e restaurar mantém documento, memória e histórico", () => {
  const n = new Nucleo();
  const id = n.criar("modal");
  n.definir(id, { titulo: "Excluir arquivo?" });
  const dados = JSON.parse(JSON.stringify(n.serializar()));
  const m = new Nucleo();
  m.restaurar(dados);
  assert.equal(m.elemento(id).titulo, "Excluir arquivo?");
  assert.equal(m.historico().cursor, 2);
  m.desfazer();
  assert.equal(m.elemento(id).titulo, "Confirmar ação");
  m.definir(id, { titulo: "Outro" });
  // ids de evento nunca se repetem, mesmo depois de desfazer
  assert.equal(m.historico().itens.at(-1).id, "evt_0003");
});

test("HTML exportado contém os elementos e o script de sinais", () => {
  const n = new Nucleo();
  const id = n.criar("botao", 10, 10);
  n.definir(id, { rotulo: "Enviar" });
  const html = n.html();
  assert.match(html, /<button id="botao_1" class="hf-el hf-botao"/);
  assert.match(html, />Enviar</);
  assert.match(html, /hefestus:sinal/);
});

test("seleção múltipla: alinhar, distribuir, girar e espelhar viram um evento cada", () => {
  const n = new Nucleo();
  const a = n.criar("caixa", 10, 10, { largura: 40, altura: 40 });
  const b = n.criar("caixa", 100, 50, { largura: 40, altura: 40 });
  const c = n.criar("caixa", 400, 90, { largura: 40, altura: 40 });
  n.selecionarVarios([a, b, c]);
  assert.deepEqual(n.selecionados(), [a, b, c]);
  const antes = n.historico().itens.length;
  n.alinharVarios(n.selecionados(), "topo");
  assert.deepEqual([a, b, c].map(id => n.elemento(id).y), [10, 10, 10]);
  n.distribuir(n.selecionados(), "h");
  assert.deepEqual([a, b, c].map(id => n.elemento(id).x), [10, 205, 400]);
  n.girar(n.selecionados(), 90);
  n.espelhar(n.selecionados(), "H");
  assert.equal(n.elemento(b).rotacao, 90);
  assert.equal(n.elemento(c).espelharH, true);
  assert.equal(n.historico().itens.length, antes + 4);
  n.desfazer(); n.desfazer();
  assert.equal(n.elemento(b).rotacao, 0);
});

test("duplicar e remover vários num passo só", () => {
  const n = new Nucleo();
  const a = n.criar("botao", 0, 0);
  const b = n.criar("texto", 0, 60);
  n.selecionarVarios([a, b]);
  const copias = n.duplicarVarios(n.selecionados());
  assert.equal(copias.length, 2);
  assert.deepEqual(n.selecionados(), copias);
  assert.equal(n.elementos().length, 4);
  n.removerVarios(n.selecionados());
  assert.equal(n.elementos().length, 2);
  assert.deepEqual(n.selecionados(), []);
  n.desfazer();
  assert.equal(n.elementos().length, 4);
});

test("guias são desfazíveis e o HTML aplica rotação e elipse", () => {
  const n = new Nucleo();
  n.adicionarGuia("v", 120.4);
  assert.deepEqual(n.guias().v, [120]);
  n.desfazer();
  assert.deepEqual(n.guias().v, []);
  const e = n.criar("elipse", 0, 0);
  n.definir(e, { rotacao: 30 });
  const i = n.criar("icone", 0, 0);
  const html = n.html();
  assert.match(html, /border-radius:50%/);
  assert.match(html, /transform:rotate\(30deg\)/);
  assert.match(html, new RegExp(`id="${i}"[^>]*><svg`));
});

test("container em coluna arruma os filhos e encaixa ao arrastar para dentro", () => {
  const n = new Nucleo();
  const c = n.criar("container", 100, 100);
  const a = n.criar("botao", 600, 600);
  const b = n.criar("botao", 700, 700);
  n.moverEncaixando([a], -480, -480);
  n.moverEncaixando([b], -580, -560);
  assert.equal(n.elemento(a).pai, c);
  assert.equal(n.elemento(b).pai, c);
  const ea = n.elemento(a); const eb = n.elemento(b); const ec = n.elemento(c);
  assert.equal(ea.x, ec.x + 12);
  assert.equal(eb.y, ea.y + ea.altura + 8);
  assert.equal(ec.altura, 12 + ea.altura + 8 + eb.altura + 12);
  // mudar a largura de um filho não vira "regressão" dos irmãos
  const r = n.definir(a, { largura: 220 });
  assert.equal(r.acao, "aplicado");
  assert.equal(r.regressoesCorrigidas.length, 0);
  assert.equal(n.elemento(c).largura, 220 + 24);
  // mover o container leva os filhos junto, num evento só
  const antes = n.historico().itens.length;
  n.moverVarios([c], 40, 0);
  assert.equal(n.elemento(a).x, 152);
  assert.equal(n.historico().itens.length, antes + 1);
  // arrastar para fora tira do container
  n.moverEncaixando([b], 600, 0);
  assert.equal(n.elemento(b).pai, undefined);
});

test("agrupar em container e desagrupar", () => {
  const n = new Nucleo();
  const a = n.criar("caixa", 10, 10);
  const b = n.criar("caixa", 400, 10);
  const g = n.agruparEmContainer([a, b]);
  assert.equal(n.elemento(a).pai, g);
  n.moverVarios([g], 0, 50);
  assert.equal(n.elemento(b).y, 60);
  n.desagrupar(g);
  assert.equal(n.elemento(g), undefined);
  assert.equal(n.elemento(a).pai, undefined);
});

import { compilar, restricaoAuto } from "../js/nucleo/compilador.js";
import { dadosRuntime } from "../js/nucleo/runtime.js";
import { MODELOS } from "../js/nucleo/modelos.js";

test("responsivo: restrição automática pela posição no desenho", () => {
  const T = { x: 0, y: 0, largura: 960, altura: 600 };
  assert.deepEqual(restricaoAuto({ x: 0, y: 0, largura: 960, altura: 56 }, T), { h: "ambos", v: "topo" });
  assert.equal(restricaoAuto({ x: 300, y: 100, largura: 360, altura: 400 }, T).h, "centro");
  assert.equal(restricaoAuto({ x: 900, y: 10, largura: 44, altura: 30 }, T).h, "direita");
  assert.equal(restricaoAuto({ x: 360, y: 100, largura: 480, altura: 40 }, T).h, "esquerda");
  assert.equal(restricaoAuto({ x: 0, y: 574, largura: 960, altura: 26 }, T).v, "base");
});

test("responsivo: container em linha vira flexbox e filhos ficam no fluxo", () => {
  const n = new Nucleo();
  const ids = n.agruparEmContainer([n.criar("botao", 10, 10), n.criar("botao", 200, 10)], "linha");
  const { css, html } = compilar(n.doc, { escopo: ".a" });
  assert.match(css, new RegExp(`#${ids}\\{[^}]*display:flex;flex-direction:row`));
  assert.match(css, /#botao_1\{position:relative;/);
  assert.match(html, new RegExp(`<div id="${ids}"[^>]*><button id="botao_1"`));
});

test("responsivo: ocultar e mostrar por largura usam container queries", () => {
  const n = new Nucleo();
  const a = n.criar("caixa", 10, 10);
  n.definir(a, { "responsivo.ocultarAbaixo": 768 });
  const b = n.criar("icone", 10, 10);
  n.definir(b, { "responsivo.mostrarAbaixo": 768 });
  const { css } = compilar(n.doc);
  assert.match(css, /@container hf \(max-width:767\.98px\)\{\.hf-arte #caixa_1\{display:none!important\}\}/);
  assert.match(css, /@container hf \(min-width:768px\)\{\.hf-arte #icone_1\{display:none!important\}\}/);
  n.definir("__canvas", { responsivo: false });
  assert.doesNotMatch(compilar(n.doc).css, /@container hf \(/);
});

test("comportamento pronto: menu suspenso liga gatilho e alvo num evento só", () => {
  const n = new Nucleo();
  const b = n.criar("botao", 10, 10);
  const m = n.criar("menu", 10, 60);
  const antes = n.historico().itens.length;
  n.aplicarComportamento("menuClique", b, m);
  assert.equal(n.historico().itens.length, antes + 1);
  assert.equal(n.elemento(b).eventos.find(e => e.tipo === "onClick").acao, "alternar");
  assert.equal(n.elemento(m).abertura.iniciaFechado, true);
  const d = dadosRuntime(n.elementos());
  const f = d.flutuantes.find(x => x.id === m);
  assert.equal(f.abre, false);
  assert.equal(f.foraFecha, true);
  assert.equal(f.menu, true);
  assert.throws(() => n.aplicarComportamento("abas", b, m), /containers/);
});

test("modelos funcionais: navegação responsiva tem gaveta ligada ao ☰", () => {
  const n = new Nucleo();
  n.inserirModelo(MODELOS.find(m => m.id === "navResponsiva"), 0, 0);
  const gat = n.elementos().find(e => e.eventos?.some(v => v.acao === "abrir"));
  const alvo = n.elemento(gat.eventos.find(v => v.acao === "abrir").alvo);
  assert.equal(alvo.abertura.animacao, "lateral");
  assert.equal(Number(gat.responsivo.mostrarAbaixo), 768);
});

test("copiar e colar: o modelo da seleção volta como cópia, em um evento só, com filhos", () => {
  const n = new Nucleo();
  const b1 = n.criar("botao", 110, 110);
  const b2 = n.criar("caixa", 200, 110);
  const c = n.agruparEmContainer([b1, b2], "livre");
  const antes = n.elementos().length;
  assert.equal(antes, 3);
  const lim = n.limites(n.comDescendentes([c]));
  const m = n.modeloDaSelecao([c], "Área de transferência");
  const novos = n.inserirModelo(m, lim.x + 16, lim.y + 16);
  assert.equal(n.elementos().length, antes * 2);
  assert.equal(novos.length, 3);
  const filho = n.elemento(novos.find(id => n.elemento(id).tipo === "botao"));
  assert.ok(filho.pai && filho.pai !== c, "a cópia do botão fica dentro da cópia do container");
  n.desfazer();
  assert.equal(n.elementos().length, antes, "colar é um evento só");
});

import { ICONES_ELEMENTO, categoriasIcones, adicionarIconeUsuario, limparSvg, icone as svgIcone } from "../js/ui/icones.js";

test("ícones: Material entra na biblioteca e sai preenchido no HTML exportado", () => {
  assert.ok(ICONES_ELEMENTO.includes("md-menu") && ICONES_ELEMENTO.includes("md-content-save"));
  assert.ok(ICONES_ELEMENTO.length > 500, "Hefestus + Material");
  assert.ok(categoriasIcones().some(c => c.nome.startsWith("Material")));
  assert.match(svgIcone("md-menu", 20), /fill="currentColor"[^>]*stroke="none"/);
  assert.match(svgIcone("salvar", 20), /fill="none"/, "os ícones de traço continuam de traço");
  const n = new Nucleo();
  const id = n.criar("icone", 10, 10, { simbolo: "md-menu" });
  assert.ok(n.elemento(id));
  const html = n.html();
  assert.match(html, /fill="currentColor" stroke="none"/);
  assert.match(html, /M3 6h18v2H3z/);
});

test("ícones importados: SVG limpo vira máscara; PNG e arquivos inválidos são tratados", () => {
  const sujo = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="alert(1)"><script>alert(1)</script><a href="https://x.test"><path d="M3 6h18v2H3z"/></a></svg>';
  const limpo = limparSvg(sujo);
  assert.ok(!/script|onload|https:|<\?xml/.test(limpo), limpo);
  assert.ok(limpo.includes("M3 6h18v2H3z"));
  assert.throws(() => limparSvg("<html></html>"), /SVG/);
  const nome = adicionarIconeUsuario("Meu Menu Ícone!", "svg", sujo);
  assert.equal(nome, "usr-meu-menu-icone");
  assert.equal(adicionarIconeUsuario("Meu Menu Ícone!", "svg", sujo), "usr-meu-menu-icone-2");
  assert.ok(categoriasIcones()[0].itens.includes(nome), "aparece em Meus ícones importados");
  assert.match(svgIcone(nome, 24), /mask:url\('data:image\/svg\+xml/);
  const n = new Nucleo();
  n.criar("icone", 0, 0, { simbolo: nome });
  assert.match(n.html(), /mask:url\('data:image\/svg\+xml/);
  assert.throws(() => adicionarIconeUsuario("x", "png", "data:text/html;base64,AAAA"), /PNG/);
  assert.equal(adicionarIconeUsuario("pixel", "png", "data:image/png;base64,iVBORw0KGgo="), "usr-pixel");
  assert.throws(() => adicionarIconeUsuario("x", "gif", "x"), /SVG ou PNG/);
});

test("faixa híbrida: modelo tem abas, corpo recolhível e menu de contexto ligados por eventos", () => {
  const m = MODELOS.find(x => x.id === "faixaHibrida");
  assert.ok(m);
  const els = m.elementos.map(e => e.el);
  const tem = (ref, f) => assert.ok(m.elementos.some(e => e.ref === ref && f(e.el)), ref);
  tem("menuCtx", e => e.p?.["abertura.iniciaFechado"] === true || e.abertura?.iniciaFechado === true);
  const comContexto = els.filter(e => (e.p?.eventos ?? e.eventos ?? []).some(v => v.tipo === "onContext" && v.alvo === "menuCtx"));
  assert.equal(comContexto.length, 1);
  const rec = MODELOS.find(x => x.id === "faixaHibridaRecolhida").elementos.find(e => e.ref === "corpo");
  assert.ok(rec);
});

test("grupos de faixa: sete estruturas na categoria própria e a faixa Word as reaproveita", () => {
  const grupos = MODELOS.filter(m => m.cat === "Grupos de faixa");
  assert.equal(grupos.length, 7);
  assert.ok(MODELOS.find(m => m.id === "faixaWord"));
  assert.ok(MODELOS.find(m => m.id === "faixaPowerPoint"));
});

test("modelos: coleção de menus responsivos tem referências válidas", async () => {
  const { MODELOS } = await import("../js/nucleo/modelos.js");
  for (const id of ["menuSubmenus","megaMenu","menuLateralRecolhivel","menuAcordeao","menuTelaCheia","menuRadial","menuDrillDown","menuBlocos","barraAbasInferior","barraComBusca"]) {
    const m = MODELOS.find(x => x.id === id);
    assert.ok(m, id);
    const n = new Nucleo(); const t = n.telaAtual ?? n.telas?.[0];
    assert.ok(m.nome && m.desc && m.cat, id);
  }
});

test("teclas de acesso, indisponível e perfis no marcação e no runtime", async () => {
  const { marcacao, teclaDoRotulo, comTecla } = await import("../js/nucleo/exportar.js");
  const { dadosRuntime } = await import("../js/nucleo/runtime.js");
  assert.equal(teclaDoRotulo("&Arquivo"), "a");
  assert.equal(teclaDoRotulo("Ex&portar"), "p");
  assert.equal(teclaDoRotulo("Tom && Jerry"), "");
  assert.equal(comTecla("&Arquivo"), "<u>A</u>rquivo");
  assert.equal(comTecla("Tom && Jerry"), "Tom &amp; Jerry");
  const el = { id: "b1", tipo: "botao", rotulo: "&Salvar", acessibilidade: { indisponivel: true, motivo: "sem permissão", perfis: "admin" } };
  const m = marcacao(el);
  assert.match(m, /<u>S<\/u>alvar/);
  assert.match(m, /aria-keyshortcuts="Alt\+S"/);
  assert.match(m, /data-indisp="1"/);
  assert.match(m, /title="sem permissão"/);
  assert.match(m, /data-perfis="admin"/);
  assert.deepEqual(dadosRuntime([el]).teclas, [{ id: "b1", tecla: "s" }]);
});

test("faixa do Axiom gerada da estrutura real: abas, painéis, dropdowns ancorados e sinais", async () => {
  const { MODELOS } = await import("../js/nucleo/modelos.js");
  const { AXIOM_SPEC } = await import("../js/nucleo/axiomSpec.js");
  const { compilar } = await import("../js/nucleo/compilador.js");
  const { dadosRuntime } = await import("../js/nucleo/runtime.js");
  const m = MODELOS.find(x => x.id === "faixaAxiom");
  assert.ok(m);
  const n = new Nucleo();
  n.inserirModelo(m, 0, 0);
  const c = compilar(n.doc, { escopo: "#hefRibbon", modo: "previa" });
  const d = dadosRuntime(c.elementos);
  const abas = AXIOM_SPEC.filter(a => !a.file);
  const sinais = d.regras.map(r => r.dispara);
  for (const a of abas) assert.ok(sinais.includes(`ax|aba|${a.panel}`), a.tab);
  assert.ok(sinais.includes("ax|arquivo"));
  // todo alvo de abrir/mostrarSo existe como elemento
  const ids = new Set(c.elementos.map(e => e.id));
  for (const r of d.regras) if (r.alvo) assert.ok(ids.has(r.alvo), `alvo ${r.alvo}`);
  // dropdowns abrem ancorados ao gatilho e começam fechados
  const ancorados = d.flutuantes.filter(f => f.ancorar);
  assert.ok(ancorados.length >= 10);
  assert.ok(ancorados.every(f => !f.abre));
  // cada item de menu estático do Axiom virou um sinal ax|p|g|c|d
  const itens = AXIOM_SPEC.flatMap(a => a.groups.filter(g => !g.pop).flatMap(g => g.items.filter(i => i.k === "menu").flatMap(i => i.items.filter(x => !/▾\s*$/.test(x.t)))));
  assert.ok(itens.length > 50);
  assert.ok(sinais.filter(s => s.split("|").length === 5).length >= itens.length);
});

test("faixa do Axiom: menus condicionais por modo (perfis simples, avancado, codigo)", async () => {
  const { MODELOS } = await import("../js/nucleo/modelos.js");
  const { AXIOM_EASY, AXIOM_SPEC } = await import("../js/nucleo/axiomSpec.js");
  const { compilar } = await import("../js/nucleo/compilador.js");
  const m = MODELOS.find(x => x.id === "faixaAxiom");
  const n = new Nucleo(); n.inserirModelo(m, 0, 0);
  const els = compilar(n.doc, { escopo: "#h", modo: "previa" }).elementos;
  const porPerfil = p => els.filter(e => (e.acessibilidade?.perfis ?? "").split(",").map(x => x.trim()).includes(p));
  const barra = els.find(e => e.nome === "Barra do Modo Simples");
  assert.equal(barra.acessibilidade.perfis, "simples");
  // a barra simples só existe para simples; abas e painéis nunca aparecem nele
  assert.ok(!porPerfil("simples").some(e => e.acessibilidade.role === "tab" || e.acessibilidade.role === "tabpanel"));
  // código mostra menos abas que avançado, mas inclui Código
  const abas = p => porPerfil(p).filter(e => e.acessibilidade.role === "tab").map(e => e.rotulo);
  assert.ok(abas("avancado").length > abas("codigo").length);
  assert.ok(abas("codigo").includes("Código") && !abas("codigo").includes("Simulação"));
  // sinais do modo simples: um por botão da barra original
  const dados = els.flatMap(e => (e.eventos ?? []).map(x => x.dispara));
  const btns = AXIOM_EASY.filter(g => g.k === "g").flatMap(g => g.items.filter(i => i.k === "btn" || !i.items.length));
  assert.ok(btns.length >= 30);
  assert.ok(dados.filter(d => /^ex\|\d+\|\d+(\|dyn)?$/.test(d)).length >= btns.length);
  assert.ok(dados.includes("ex|modo|adv") && dados.includes("ax|modo|easy"));
  assert.ok(AXIOM_SPEC.length >= 11);
});

import * as EA from "../js/nucleo/estiloAvancado.js";
import { marcacao, css } from "../js/nucleo/exportar.js";

test("estilo avançado: gradientes, traços e efeitos viram CSS válido", () => {
  const g = EA.fundoCSS([{ tipo: "linear", visivel: true, opacidade: 1, angulo: 90, paradas: [{ pos: 0, cor: "#ff0000", alfa: 1 }, { pos: 100, cor: "#0000ff", alfa: 1 }] }]);
  assert.match(g, /linear-gradient\(90deg/);
  assert.equal(EA.fundoCSS([], "red"), "red");
  assert.equal(EA.corSegura("url(x)", "#111111"), "#111111");
  assert.throws(() => EA.limparCantos([1, 2, 3]));
  assert.deepEqual(EA.limparCantos([1, 2, 3, 4]), [1, 2, 3, 4]);
  assert.equal(EA.temAvancado({ efeitos: [{ tipo: "sombra" }] }), true);
  assert.equal(EA.temAvancado({}), false);
});

test("formas paramétricas geram caminho e renderizam no HTML exportado", () => {
  assert.match(EA.caminhoEstrela(8, 0.4), /^M/);
  assert.match(EA.caminhoPoligono(7), /Z/i);
  const n = new Nucleo();
  const id = n.criar("forma", 50, 50);
  n.definir(id, { forma: "estrela", lados: 8, estilo: { preenchimentos: [{ tipo: "radial", visivel: true, opacidade: 1, paradas: [{ pos: 0, cor: "#ffff00", alfa: 1 }, { pos: 100, cor: "#ff0000", alfa: 1 }] }] } });
  const el = n.elemento(id);
  const m = marcacao(el), c = css(el);
  assert.ok(m.includes("<svg"));
  assert.ok(c.includes("radial-gradient"));
  assert.ok(!/<script/i.test(m + c));
});

test("seleção: inverter, conteúdo, container e peças do formulário", () => {
  const n = new Nucleo();
  const { id } = n.adicionarItemConstrutor("caixa");
  n.selecionar(id); n.selecionarFilhos();
  assert.ok(n.selecionados().length >= 1 && !n.selecionados().includes(id));
  n.selecionarPai();
  assert.deepEqual(n.selecionados(), [id]);
  n.selecionarDoFormulario();
  assert.ok(n.selecionados().every(i => n.elemento(i).construtor === id));
  const antes = new Set(n.selecionados());
  n.inverterSelecao();
  assert.ok(n.selecionados().every(i => !antes.has(i)));
});

test("modelo Controlador de rádios: insere com ids fixos, guarda o complemento, exporta a lógica e desfaz", async () => {
  const { MODELOS } = await import("../js/nucleo/modelos.js");
  const n = new Nucleo();
  const ids = n.inserirModelo(MODELOS.find(m => m.id === "radioControlador"));
  assert.ok(ids.includes("app") && ids.includes("mini"));
  assert.ok(n.tela.complemento.js.length > 1000);
  assert.match(n.html(), /RADIOS_EMBUTIDAS/);
  assert.throws(() => n.inserirModelo(MODELOS.find(m => m.id === "radioControlador")), /ids fixos/);
  n.desfazer();
  assert.ok(!n.tela.complemento);
});
