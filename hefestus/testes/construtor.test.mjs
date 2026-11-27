import { test } from "node:test";
import assert from "node:assert/strict";
import { Nucleo } from "../js/nucleo/nucleo.js";
import { validarConstrutor, novoFilho, novaAba, novoGrupo, novoItem, novoItemMenu } from "../js/nucleo/construtor.js";

const marcados = (n, id) => n.elementos().filter(e => e.construtor === id);

test("construtor: container gerado pelo formulário, editado e removido (desfazível)", () => {
  const n = new Nucleo();
  const { id, ok } = n.adicionarItemConstrutor("caixa");
  assert.ok(ok);
  assert.ok(marcados(n, id).length >= 2);
  assert.equal(n.elemento(id).tipo, "container");
  n.atualizarConstrutor(spec => { const c = spec.itens.find(i => i.id === id); c.largura = 500; c.estilo.fundo = "#112233"; c.filhos.push(novoFilho(c)); }, "editar", id);
  assert.equal(n.elemento(id).largura, 500);
  assert.equal(n.elemento(id).estilo.fundo, "#112233");
  assert.equal(marcados(n, id).filter(e => e.tipo === "botao").length, 1);
  n.atualizarConstrutor(spec => { spec.itens = []; }, "remover", id, { remover: true });
  assert.equal(marcados(n, id).length, 0);
  assert.equal(n.construtor().itens.length, 0);
  n.desfazer();
  assert.ok(marcados(n, id).length >= 3);
});

test("construtor: faixa de opções com abas, grupos e comandos; clique na aba mostra o corpo", () => {
  const n = new Nucleo();
  const { id } = n.adicionarItemConstrutor("ribbon");
  n.atualizarConstrutor(spec => {
    const f = spec.itens.find(i => i.id === id);
    f.abas.push(novaAba(f));
    const g = novoGrupo(f.abas[1]); g.itens.push({ ...novoItem(g), rotulo: "Salvar", sinal: "salvar" });
    f.abas[1].grupos = [g];
  }, "abas", id);
  const els = marcados(n, id);
  const abas = els.filter(e => e.nome?.startsWith("Aba "));
  assert.equal(abas.length, 2);
  const corpos = els.filter(e => e.nome?.startsWith("Corpo "));
  assert.equal(corpos.length, 2);
  assert.equal(corpos.filter(c => c.visivel === false).length, 1);
  const ev = abas[1].eventos[0];
  assert.equal(ev.acao, "mostrarSo");
  assert.ok(corpos.some(c => c.id === ev.alvo));
  assert.ok(els.some(e => e.nome === "Comando Salvar" && e.eventos?.[0]?.dispara === "salvar"));
});

test("construtor: menu do botão direito ligado ao container (onContext → abrir) e validação", () => {
  const n = new Nucleo();
  const c = n.adicionarItemConstrutor("caixa").id;
  const m = n.adicionarItemConstrutor("menu").id;
  assert.equal(n.elemento(m).visivel, false);
  n.atualizarConstrutor(spec => { spec.itens.find(i => i.id === c).comportamento.menuContexto = m; }, "ligar", c);
  const ev = n.elemento(c).eventos.find(e => e.tipo === "onContext");
  assert.deepEqual([ev.acao, ev.alvo], ["abrir", m]);
  const itens = marcados(n, m).filter(e => e.nome.startsWith("Item "));
  assert.equal(itens.length, 3);
  assert.ok(itens.every(i => i.eventos?.[0]?.acao === "fechar" && i.eventos[0].alvo === m));
  n.atualizarConstrutor(spec => { const mm = spec.itens.find(i => i.id === m); mm.itens.push({ ...novoItemMenu(mm), rotulo: "Novo", sinal: "ctx_copiar" }); }, "dup", m);
  assert.ok(validarConstrutor(n.construtor()).some(e => /repetido/.test(e)));
  n.atualizarConstrutor(spec => { spec.itens = spec.itens.filter(i => i.id !== m); }, "rm", m, { remover: true });
  assert.ok(validarConstrutor(n.construtor()).some(e => /não existe mais/.test(e)));
});

import { Agente } from "../js/agente/agente.js";
test("agente cria menu de contexto, faixa e comandos pelo formulário", async () => {
  const n = new Nucleo();
  const ag = new Agente(n, {});
  await ag.enviar("cria um menu de contexto com Copiar, Colar, - e Excluir");
  const menu = n.construtor().itens.find(i => i.tipo === "menu");
  assert.ok(menu);
  assert.deepEqual(menu.itens.map(i => i.separador ? "-" : i.rotulo), ["Copiar", "Colar", "-", "Excluir"]);
  assert.ok(n.elementos().some(e => e.nome === "Item Excluir" && e.construtor === menu.id));
  await ag.enviar("cria uma faixa de opções com abas Início, Inserir e Exibir");
  const faixa = n.construtor().itens.find(i => i.tipo === "ribbon");
  assert.deepEqual(faixa.abas.map(a => a.nome), ["Início", "Inserir", "Exibir"]);
  await ag.enviar("adiciona o comando Tabela na aba Inserir");
  const f2 = n.construtor().itens.find(i => i.tipo === "ribbon");
  assert.ok(f2.abas[1].grupos.some(g => g.itens.some(c => c.rotulo === "Tabela")));
  assert.ok(n.elementos().some(e => e.nome === "Comando Tabela"));
  await ag.enviar("adiciona o item Recortar no menu");
  assert.ok(n.construtor().itens.find(i => i.tipo === "menu").itens.some(i => i.rotulo === "Recortar"));
  const antes = n.elementos().length;
  n.desfazer();
  assert.ok(n.elementos().length < antes);
});

test("faixa: grupo que recolhe vira botão com o ícone principal e aba condicional some sem a seleção", () => {
  const n = new Nucleo();
  const { id } = n.adicionarItemConstrutor("ribbon");
  n.atualizarConstrutor(sp => {
    const f = sp.itens.find(i => i.id === id);
    f.abas.push({ ...novaAba(f), nome: "Formatar", quando: ["container"] });
    const a = f.abas[0];
    a.grupos.push(novoGrupo(a), novoGrupo(a));
    a.grupos[0].recolher = true; a.grupos[0].iconePrincipal = "pincel"; a.grupos[0].organizacao = "grade"; a.grupos[0].tamanho = "pequeno";
    a.grupos[1].recolher = true; a.grupos[1].itens.push({ id: "i1", rotulo: "X", icone: "mais", sinal: "x" });
    a.grupoAtivo = 1;
  }, "teste", id);
  const el = k => n.doc.elementos[k];
  const [g1, g2] = ["g1", "g2"].map(g => `${id}_a1_${g}`);
  assert.equal(el(`${g1}_exp`).visivel, false);          // grupo 1 recolhido
  assert.notEqual(el(`${g1}_rec`).visivel, false);       // mostra o botão
  assert.equal(el(`${g2}_rec`).visivel, false);          // grupo 2 expandido
  assert.equal(el(`${g1}_rec_ic`).simbolo, "pincel");
  assert.ok(el(`${g1}_rec`).eventos.some(e => e.acao === "mostrarSo" && e.alvo === `${g1}_exp`));
  assert.ok(el(`${g1}_rec`).eventos.some(e => e.acao === "mostrarSo" && e.alvo === `${g2}_rec`));
  assert.equal(el(`${id}_aba_a2`).visivel, false);       // condicional escondida
  n.atualizarConstrutor(sp => { sp.itens.find(i => i.id === id).simulaSelecao = "container"; }, "sim", id);
  assert.notEqual(el(`${id}_aba_a2`).visivel, false);
  assert.equal(el(`${id}`).largura, n.tela.largura);     // faixa de largura total
});

test("faixa que retrai: corpos começam fechados, abas abrem, sair do mouse fecha", () => {
  const n = new Nucleo();
  const { id } = n.adicionarItemConstrutor("ribbon");
  n.atualizarConstrutor(sp => { const f = sp.itens.find(i => i.id === id); f.comportamento = "retrai"; f.abrirCom = "hover"; }, "retrai", id);
  const el = k => n.doc.elementos[k];
  assert.equal(el(`${id}_corpos`).abertura.iniciaFechado, true);
  assert.equal(el(`${id}_corpos`).abertura.fecharFora, true);
  assert.ok(el(`${id}_aba_a1`).eventos.some(e => e.tipo === "onHover" && e.acao === "abrir" && e.alvo === `${id}_corpos`));
  assert.ok(el(id).eventos.some(e => e.tipo === "onLeave" && e.acao === "fechar" && e.alvo === `${id}_corpos`));
  n.atualizarConstrutor(sp => { sp.itens.find(i => i.id === id).comportamento = "fixa"; }, "fixa", id);
  assert.ok(!el(`${id}_corpos`).abertura?.iniciaFechado);
  assert.ok(!(el(id).eventos ?? []).length);
});

test("lições dos exemplos: blocos, barra lateral, abas de documento, submenu e comando desabilitado", () => {
  const n = new Nucleo();
  const el = k => n.doc.elementos[k];
  const b = n.construtorCriar("blocos", { colunas: 2, itens: ["A", { titulo: "B", subtitulo: "desc", status: "#22c55e" }, "C"] });
  assert.ok(el(`${b.id}_i2_st`), "ponto de status");
  assert.equal(marcados(n, b.id).filter(e => /^bl\d+_i\d$/.test(e.id)).length, 3);
  const l = n.construtorCriar("lateral", { itens: ["Início", "Dados"] });
  assert.equal(el(`${l.id}_rec`).visivel !== false, false);
  assert.equal(el(`${l.id}_rec`).abertura.iniciaFechado, true);
  assert.ok(el(`${l.id}_exp_alt`).eventos.some(e => e.acao === "mostrarSo" && e.alvo === `${l.id}_rec`));
  const d = n.construtorCriar("abasDoc", { abas: ["Mapa", "Andar 1"] });
  assert.ok(el(`${d.id}_a1_x`) && el(`${d.id}_mais`));
  const m = n.construtorCriar("menu", { itens: ["Mover", "Excluir"] });
  n.construtorAdicionar(m.id, "subitem", { item: "Mover", rotulo: "Para frente" });
  const it = el(`${m.id}_i1`);
  assert.ok(it.eventos.some(e => e.tipo === "onHover" && e.acao === "abrir" && e.alvo === `${m.id}_i1_sub`));
  assert.ok(it.eventos.some(e => e.tipo === "onLeave" && e.acao === "fechar"));
  assert.equal(el(`${m.id}_i1_sub`).visivel, false);
  assert.ok(el(`${m.id}_i1_sub`).x >= el(m.id).x + el(m.id).largura - 12, "submenu à direita");
  n.construtorEditar(m.id, "itens.1.desabilitado", true);
  assert.ok(!(el(`${m.id}_i2`).eventos ?? []).length);
  // não nascem uns sobre os outros
  assert.ok(el(l.id).y >= el(b.id).y + el(b.id).altura);
});

test("faixa que retrai tem pino: ação fixar sobre o corpo", () => {
  const n = new Nucleo();
  const { id } = n.adicionarItemConstrutor("ribbon");
  n.atualizarConstrutor(sp => { const f = sp.itens.find(i => i.id === id); f.comportamento = "retrai"; f.busca = true; }, "retrai", id);
  const pino = n.doc.elementos[`${id}_pino`];
  assert.ok(pino.eventos.some(e => e.acao === "fixar" && e.alvo === `${id}_corpos`));
  assert.ok(n.doc.elementos[`${id}_busca`]);
  n.atualizarConstrutor(sp => { sp.itens.find(i => i.id === id).pino = false; }, "sem pino", id);
  assert.ok(!n.doc.elementos[`${id}_pino`]);
});

test("estilos prontos da faixa e pacote de ícones de rede", async () => {
  const n = new Nucleo();
  const { id } = n.construtorCriar("ribbon", { abas: ["Início"], estilo: "escuro" });
  assert.equal(n.doc.elementos[`${id}_corpo_a1`]["estilo.fundo"] ?? n.doc.elementos[`${id}_corpo_a1`].estilo?.fundo, "#0f1a2b");
  assert.equal(n.construtor().itens.find(i => i.id === id).abas[0].grupos[0].cor, "#38bdf8");
  const { ICONES_MENU } = await import("../js/ui/icones.js");
  assert.ok(ICONES_MENU.find(c => c.nome === "Rede e monitoramento").itens.includes("firewall"));
});

test("ícones: conjunto colorido cobre todos os nomes e respeita cor semântica", async () => {
  const m = await import("../js/ui/icones.js");
  m.definirIconesColoridos(true); // desde a v0.33 o conjunto colorido é opcional (Exibir › Ícones coloridos)
  assert.ok(m.ICONES_ELEMENTO.length > 640);
  for (const n of ["online", "offline", "alertas", "pdf", "zabbix", "executar", "importar"]) assert.ok(m.ICONES_ELEMENTO.includes(n), n);
  assert.equal(m.corDoIcone("online"), m.COR.verde);
  assert.equal(m.corDoIcone("offline"), m.COR.vermelho);
  assert.equal(m.corDoIcone("online", "roxo"), m.COR.roxo);
  for (const n of m.ICONES_ELEMENTO.filter(x => !x.startsWith("usr-") && !m.ehWindows(x))) assert.match(m.iconeColorido(n, 20), /<rect[^>]+fill-opacity/, n);
  m.definirIconesColoridos(false);
});

test("ícones: elemento colorido sai no HTML exportado", async () => {
  const { marcacao } = await import("../js/nucleo/exportar.js");
  const n = new Nucleo();
  const id = n.criar("icone", 10, 10, { simbolo: "online", estiloIcone: "colorido" });
  const html = marcacao(n.elemento(id));
  assert.match(html, /<rect x="1" y="1" width="22" height="22" rx="6" fill="#16a34a"/);
});

test("componentes novos: cada modelo gera elementos marcados e sem erros", async () => {
  const { MODELOS_COMP } = await import("../js/nucleo/construtor.js");
  const n = new Nucleo();
  for (const [modelo] of MODELOS_COMP) {
    const r = n.construtorCriar("componente", { modelo });
    assert.ok(r.ok, modelo);
    const els = n.elementos().filter(e => e.construtor === r.id);
    assert.ok(els.length >= 3, `${modelo}: ${els.length}`);
    assert.deepEqual(r.erros, [], modelo);
    assert.ok(els.every(e => e.largura > 0 && e.altura > 0), `${modelo}: tamanho`);
    assert.ok(els.every(e => typeof e.nome === "string"), `${modelo}: nome é texto`);
  }
});

test("componentes: progresso respeita o valor e paginação tem anterior/próxima", () => {
  const n = new Nucleo();
  const p = n.construtorCriar("componente", { modelo: "progresso", itens: [{ rotulo: "CPU", valor: 50 }] });
  const trilho = n.elemento(`${p.id}_i1_trilho`), fill = n.elemento(`${p.id}_i1_fill`);
  assert.ok(fill.largura > 0 && Math.abs(fill.largura - trilho.largura / 2) <= 2);
  const g = n.construtorCriar("componente", { modelo: "paginacao", valor: 4, total: 9 });
  for (const k of ["ant", "prox", "pag_4", "pag_1", "pag_9"]) assert.ok(n.elemento(`${g.id}_var_4_${k}`), k);
  assert.equal(n.elemento(`${g.id}_var_4_pag_4_tx`).estilo.peso, 700);
  assert.notEqual(n.elemento(`${g.id}_var_4`).visivel, false);
  assert.equal(n.elemento(`${g.id}_var_5`).visivel, false);
  const ev = n.elemento(`${g.id}_var_4_pag_9`).eventos[0];
  assert.equal(ev.acao, "mostrarSo"); assert.equal(ev.alvo, `${g.id}_var_9`);
});

test("temas: aplicam em todos os tipos num passo e podem ser desfeitos", () => {
  const n = new Nucleo();
  const ids = ["caixa", "menu", "blocos", "lateral", "abasDoc", "ribbon"].map(t => n.adicionarItemConstrutor(t).id);
  const comp = n.construtorCriar("componente", { modelo: "status" }).id;
  const antes = n.elemento(ids[2])?.estilo?.fundo;
  const r = n.construtorTema("neon");
  assert.ok(r.ok);
  const spec = n.construtor();
  assert.equal(spec.tema, "neon");
  assert.equal(spec.itens.find(i => i.id === ids[2]).acento, "#e879f9");
  assert.equal(spec.itens.find(i => i.id === comp).efeito, "neon");
  assert.ok(n.elementos().some(e => e.construtor === ids[2] && e.estilo.efeitos?.length));
  assert.ok(n.desfazer());
  assert.notEqual(n.construtor().tema, "neon");
  assert.throws(() => n.construtorTema("inexistente"));
  void antes;
});

test("formatos de aba, variantes da lateral e efeitos mudam a aparência gerada", () => {
  const n = new Nucleo();
  const a = n.adicionarItemConstrutor("abasDoc").id;
  n.construtorEditar(a, "formato", "pilula");
  assert.equal(n.elemento(`${a}_a1`).estilo.raio, 100);
  n.construtorEditar(a, "formato", "cartao");
  assert.deepEqual(n.elemento(`${a}_a1`).estilo.cantos, [10, 10, 0, 0]);
  n.construtorEditar(a, "formato", "sublinhada");
  assert.ok(n.elemento(`${a}_a1`).estados.ativo.sublinha && n.elemento(`${a}_a1`).ativoInicial, "sublinha da aba ativa");
  assert.ok(!n.elemento(`${a}_a2`).ativoInicial);
  const l = n.adicionarItemConstrutor("lateral").id;
  n.construtorEditar(l, "variante", "flutuante");
  assert.equal(n.elemento(`${l}_exp`).estilo.sombra, "grande");
  n.construtorEditar(l, "variante", "vidro");
  assert.ok(n.elemento(`${l}_exp`).estilo.vidro > 0);
  const b = n.adicionarItemConstrutor("blocos").id;
  for (const [ef, chk] of [["neon", e => e.estilo.efeitos.length === 2], ["gradiente", e => e.estilo.preenchimentos.length === 2], ["vidro", e => e.estilo.vidro > 0], ["borda", e => e.estilo.larguraBorda === 2], ["brilho", e => e.estilo.efeitos.length === 1]]) {
    n.construtorEditar(b, "efeito", ef);
    assert.ok(chk(n.elemento(`${b}_i1`)), ef);
  }
});

test("itens diferentes não se sobrescrevem (refs automáticas isoladas por item)", () => {
  const n = new Nucleo();
  const a = n.construtorCriar("componente", { modelo: "status" }).id, b = n.construtorCriar("componente", { modelo: "toast" }).id, c = n.construtorCriar("lateral", {}).id;
  const ids = n.elementos().map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of [a, b, c]) {
    const els = n.elementos().filter(e => e.construtor === id);
    for (const e of els) if (e.pai) assert.equal(n.elemento(e.pai)?.construtor, id, `${e.id}: pai de outro item`);
  }
});

test("componentes extras: modal, calendário, slider, tabela, gráfico e menu radial", () => {
  const n = new Nucleo();
  const m = n.construtorCriar("componente", { modelo: "modal", variante: "erro", titulo: "Falha", mensagem: "Algo deu errado", iniciaOculto: true });
  assert.ok(m.ok && n.elemento(m.id).visivel === false && n.elemento(m.id).abertura?.iniciaFechado);
  assert.equal(n.elemento(`${m.id}_titulo`).texto, "Falha");
  const ev = n.elemento(`${m.id}_i2`).eventos[0];
  assert.equal(ev.acao, "fechar"); assert.equal(ev.alvo, m.id);
  const c = n.construtorCriar("componente", { modelo: "calendario", mes: 10, ano: 2026, valor: 14 });
  assert.ok(n.elemento(`${c.id}_d31`) && !n.elemento(`${c.id}_d32`));
  assert.equal(n.elemento(`${c.id}_titulo`).texto, "Outubro 2026");
  const s = n.construtorCriar("componente", { modelo: "slider", itens: [{ rotulo: "Vol", valor: 50 }] });
  const tr = n.elemento(`${s.id}_i1_trilho`), kn = n.elemento(`${s.id}_i1_knob`);
  assert.ok(kn.x > tr.x && kn.x < tr.x + tr.largura);
  const t = n.construtorCriar("componente", { modelo: "tabela" });
  assert.equal(n.elemento(`${t.id}_i2_c1`).texto, "Alerta");
  const g = n.construtorCriar("componente", { modelo: "grafico", serie: "1,2,4" });
  assert.equal(n.elementos().filter(e => new RegExp(`^${g.id}_b\\d+$`).test(e.id)).length, 3);
  const r = n.construtorCriar("componente", { modelo: "radial" });
  const raiz = n.elemento(r.id), i1 = n.elemento(`${r.id}_i1`);
  assert.ok(Math.abs(i1.x + i1.largura / 2 - (raiz.x + raiz.largura / 2)) < 2, "primeiro item no topo do círculo");
  assert.ok(i1.y < raiz.y + raiz.altura / 2);
  for (const id of [m.id, c.id, s.id, t.id, g.id, r.id]) assert.ok(n.elementos().every(e => typeof e.nome === "string"));
});

test("agente: componentes extras e atalhos", async () => {
  const { interpretar } = await import("../js/agente/local.js");
  const n = new Nucleo();
  for (const [f, mod] of [["cria um calendario", "calendario"], ["cria um menu circular", "radial"], ["cria uma tabela de dados", "tabela"], ["cria um slider", "slider"], ["cria um cartão com gráfico", "grafico"], ["cria uma janela modal", "modal"]])
    assert.equal(interpretar(f, n).acoes[0].entrada.dados?.modelo, mod, f);
});

test("estado ativo: abas, itens e dias marcam o ativo inicial e escolhem por mostrarSo", () => {
  const n = new Nucleo();
  const ad = n.adicionarItemConstrutor("abasDoc").id;
  assert.ok(n.elemento(`${ad}_a1`).ativoInicial);
  const ev = n.elemento(`${ad}_a2`).eventos[0];
  assert.equal(ev.acao, "mostrarSo"); assert.equal(ev.alvo, `${ad}_var_estado_a2`);
  assert.notEqual(n.elemento(`${ad}_var_estado_a1`).visivel, false);
  assert.equal(n.elemento(`${ad}_var_estado_a2`).visivel, false);
  const cal = n.construtorCriar("componente", { modelo: "calendario", valor: 5 }).id;
  assert.ok(n.elemento(`${cal}_d5`).ativoInicial && !n.elemento(`${cal}_d6`).ativoInicial);
  assert.equal(n.elemento(`${cal}_d6`).pai, n.elemento(`${cal}_d5`).pai, "dias são irmãos (mesmo contêiner)");
  const fx = n.adicionarItemConstrutor("ribbon").id;
  assert.ok(n.elemento(`${fx}_aba_a1`).ativoInicial && n.elemento(`${fx}_aba_a1`).estados.ativo.fundo);
  const lt = n.adicionarItemConstrutor("lateral").id;
  assert.ok(n.elemento(`${lt}_exp_i1`).ativoInicial);
});

test("pendências: ▾ da faixa, atalhos, gráficos de linha/rosca, tabela dinâmica, hexágono e rótulo longo", () => {
  const n = new Nucleo();
  const fx = n.adicionarItemConstrutor("ribbon").id;
  n.construtorAdicionar(fx, "comando", { rotulo: "Access Point", icone: "accessPoint", sinal: "ap" });
  const pos = () => { const g = n.construtor().itens.find(x => x.id === fx).abas[0].grupos; const gi = g.findIndex(x => x.itens.some(i => i.rotulo === "Access Point")); return [gi, g[gi].itens.findIndex(i => i.rotulo === "Access Point")]; };
  const [gi, ii] = pos();
  n.construtorEditar(fx, `abas.0.grupos.${gi}.itens.${ii}.atalho`, "Ctrl+Shift+A");
  const cmd0 = n.elementos().find(e => e.construtor === fx && e.nome === "Comando Access Point");
  assert.ok(cmd0.largura >= 60 + 20, "rótulo longo ganha largura");
  assert.equal(cmd0.acessibilidade.atalho, "Ctrl+Shift+A");
  n.atualizarConstrutor(sp => { const i = sp.itens.find(x => x.id === fx).abas[0].grupos[gi].itens[ii]; i.submenu = [{ id: "s1", rotulo: "Novo AP", sinal: "ap_novo", atalho: "", icone: "" }, { id: "s2", rotulo: "Remover", sinal: "ap_rem", atalho: "", icone: "" }]; }, "dropdown", fx);
  const cmd = n.elementos().find(e => e.construtor === fx && e.nome === "Comando Access Point");
  const dd = n.elemento(`${cmd.id}_dd`);
  assert.ok(dd && dd.visivel === false && dd.abertura.iniciaFechado && dd.abertura.fecharFora);
  assert.equal(dd.y, cmd.y + cmd.altura + 4);
  assert.equal(cmd.eventos[0].acao, "alternar"); assert.equal(cmd.eventos[0].alvo, `${cmd.id}_dd`);
  assert.equal(n.elemento(`${cmd.id}_dd_s1`).eventos[0].acao, "fechar");
  const g1 = n.construtorCriar("componente", { modelo: "grafico", tipoGrafico: "linha", serie: "1,3,2,5" });
  assert.ok(n.elemento(`${g1.id}_curva`).caminho.startsWith("M0 ") && n.elemento(`${g1.id}_area`).caminho.endsWith("Z"));
  const g2 = n.construtorCriar("componente", { modelo: "grafico", tipoGrafico: "rosca", valor: 50 });
  assert.equal(n.elemento(`${g2.id}_arco`).fim, 180); assert.equal(n.elemento(`${g2.id}_pct`).texto, "50%");
  const t = n.construtorCriar("componente", { modelo: "tabela", colunas: ["A", "B", "C", "D", "E"], itens: [{ rotulo: "x", valor: "ok", detalhe: "c3", extra: ["c4", "c5"] }] });
  assert.equal(n.elemento(`${t.id}_i1_c4`).texto, "c5"); assert.equal(n.elemento(`${t.id}_h4`).texto, "E");
  const r = n.construtorCriar("componente", { modelo: "radial", formaMenu: "hexagono" });
  assert.ok(n.elemento(`${r.id}_i1`).mascara?.d && n.elemento(`${r.id}_centro`).mascara);
  const m = n.construtorCriar("menu", { itens: [{ rotulo: "Salvar", atalho: "Ctrl+S" }] });
  assert.equal(n.elemento(`${m.id}_i1`).acessibilidade.atalho, "Ctrl+S");
});

test("painéis divididos: gera regiões, divisores, marca data-hf-dock e valida", () => {
  const n = new Nucleo();
  const { id } = n.adicionarItemConstrutor("paineis");
  const ids = marcados(n, id).map(e => e.id ?? "");
  const els = n.elementos().filter(e => e.construtor === id);
  assert.ok(els.some(e => e.painelDock), "raiz carrega a configuração");
  const html = n.html();
  assert.match(html, /data-hf-dock="/);
  for (const k of ["esq", "dir", "baixo", "centro"]) assert.ok(n.doc.elementos[`${id}_${k}`], `região ${k}`);
  for (const k of ["esq", "dir", "baixo"]) { assert.ok(n.doc.elementos[`${id}_div_${k}`]); assert.ok(n.doc.elementos[`${id}_${k}_btn`]); assert.ok(n.doc.elementos[`${id}_${k}_corpo`]); }
  n.construtorEditar(id, "regioes", ["esq"]);
  assert.ok(!n.doc.elementos[`${id}_dir`] && n.doc.elementos[`${id}_esq`]);
  n.construtorEditar(id, "regioes", []);
  assert.ok(validarConstrutor(n.construtor()).some(e => /sem regiões/.test(e)));
  assert.ok(ids.length > 0);
});

test("abas: formatos com máscara, borda mista e animações de mouse/clique", () => {
  const n = new Nucleo();
  const { id } = n.construtorCriar("abasDoc", { formato: "mista", abaEsq: "barra", abaDir: "redonda", animHover: "elevar", animClique: "ondulacao" });
  const aba = n.doc.elementos[`${id}_a1`];
  assert.match(aba.mascara.d, /^M 12 0 .*C/);
  assert.deepEqual(aba.animacao, { hover: "elevar", clique: "ondulacao" });
  const html = n.html();
  assert.match(html, /hf-onda/);
  assert.match(html, /translate:0 -2px/);
  n.construtorEditar(id, "formato", "paralelogramo");
  assert.match(n.doc.elementos[`${id}_a1`].mascara.d, /^M12 0/);
});

test("abas: curva suave, chanfro e largura ajustada ao texto", () => {
  const n = new Nucleo();
  const { id } = n.construtorCriar("abasDoc", { formato: "curva", abas: ["Oi", "Configurações avançadas do sistema"] });
  const a = n.doc.elementos[`${id}_a1`], b = n.doc.elementos[`${id}_a2`];
  assert.match(a.mascara.d, /C/);
  assert.ok(b.largura > a.largura * 2, "aba maior para texto maior");
  n.construtorEditar(id, "formato", "mista"); n.construtorEditar(id, "abaEsq", "degrau"); n.construtorEditar(id, "abaDir", "chanfro");
  assert.match(n.doc.elementos[`${id}_a1`].mascara.d, /^M 8 0/);
});

test("faixa: corpos e abas marcados para se ajustar à largura da tela", async () => {
  const n = new Nucleo();
  const { id } = n.construtorCriar("ribbon", { abas: ["Início"] });
  assert.ok(n.elementos().some(e => e.construtor === id && e.autoAjuste), "corpo marcado");
  const { dadosRuntime } = await import("../js/nucleo/runtime.js");
  assert.ok(dadosRuntime(n.elementos()).ajustes.length >= 2);
});

test("ícones automáticos pelo rótulo e estilo colorido nos menus", async () => {
  const { iconePorRotulo, iconeDe } = await import("../js/nucleo/iconesAuto.js");
  assert.equal(iconePorRotulo("Salvar projeto"), "salvar");
  assert.equal(iconePorRotulo("Imprimir"), "impressora");
  assert.equal(iconePorRotulo("Configurações"), "engrenagem");
  assert.equal(iconePorRotulo("zzzz"), null);
  assert.equal(iconeDe({ rotulo: "Abrir", icone: "estrela" }), "abrir");
  assert.equal(iconeDe({ rotulo: "Abrir", icone: "casa" }), "casa", "escolha do usuário vence");
  const n = new Nucleo();
  const { id } = n.construtorCriar("ribbon", { abas: ["Início"] });
  n.construtorAdicionar(id, "comando", { rotulo: "Imprimir", sinal: "imp" });
  const ic = n.elementos().find(e => e.construtor === id && e.simbolo === "impressora");
  assert.ok(ic, "ícone inferido");
  assert.equal(ic.estiloIcone, "colorido");
});
