import { test } from "node:test";
import assert from "node:assert/strict";
import { Nucleo } from "../js/nucleo/nucleo.js";
import { Agente } from "../js/agente/agente.js";
import { interpretar } from "../js/agente/local.js";
import { criarFerramentas, validarPropriedades } from "../js/agente/ferramentas.js";
import { PALETAS } from "../js/ui/temas.js";

function montar() {
  const n = new Nucleo();
  const app = {
    temaUI: null,
    definirTemaUI(k) { this.temaUI = k; },
    aplicarPaleta: k => {
      const t = PALETAS[k];
      return n.aplicarEmTodos(["estilo.fundo", "estilo.cor", "estilo.borda", "fundo"], el => {
        const c = t.tipos[el.tipo]; if (c) [el.estilo.fundo, el.estilo.cor, el.estilo.borda] = c;
      }, `Tema ${t.nome} em tudo`, tela => { tela.fundo = t.tela; });
    },
  };
  return { n, app, ag: new Agente(n, app) };
}

test("interpretador: criar botão com cor, texto e posição", () => {
  const { n } = montar();
  const p = interpretar('cria um botão verde escrito "Cadastrar" no canto inferior direito', n);
  assert.equal(p.acoes[0].nome, "criar_elemento");
  const e = p.acoes[0].entrada;
  assert.equal(e.tipo, "botao");
  assert.equal(e.propriedades.rotulo, "Cadastrar");
  assert.equal(e.propriedades["estilo.fundo"], "#16a34a");
  assert.equal(e.x, n.tela.largura - 140 - 24);
});

test("interpretador: acha elemento pelo nome e muda a cor", () => {
  const { n } = montar();
  const id = n.criar("botao", 10, 10);
  n.definir(id, { rotulo: "Entrar", nome: "Botão Entrar" });
  n.criar("botao", 10, 80);
  const p = interpretar("muda a cor do botão Entrar para vermelho", n);
  assert.deepEqual(p.acoes[0], { nome: "alterar_elemento", entrada: { id, propriedades: { "estilo.fundo": "#dc2626", "estados.hover.fundo": "#dc2626" } } });
});

test("interpretador: tipo citado com vários elementos pede qual", () => {
  const { n } = montar();
  n.criar("botao", 0, 0); n.criar("botao", 0, 60); n.selecionar(null);
  const p = interpretar("deixa o botão azul", n);
  assert.equal(p.acoes.length, 0);
  assert.match(p.resposta, /Qual deles/);
});

test("interpretador: quando clicar em X, abre Y", () => {
  const { n } = montar();
  const b = n.criar("botao", 0, 0); n.definir(b, { nome: "Botão Entrar" });
  const t = n.criar("toast", 0, 100); n.definir(t, { nome: "Aviso de envio" });
  const p = interpretar("quando clicar em Botão Entrar, abre o Aviso de envio", n);
  assert.equal(p.acoes[0].nome, "ligar_evento");
  assert.equal(p.acoes[0].entrada.alvo, t);
  assert.equal(p.acoes[0].entrada.acao, "abrir");
});

test("ferramentas validam propriedades e cores", () => {
  assert.throws(() => validarPropriedades("botao", { "estilo.fundo": "azulzinho" }), /hexadecimal/);
  assert.throws(() => validarPropriedades("botao", { onclick: "alert(1)" }), /não é uma propriedade/);
  assert.deepEqual(validarPropriedades("botao", { "estilo.peso": "700", rotulo: "Ok" }), { "estilo.peso": 700, rotulo: "Ok" });
});

test("turno do agente (local) vira um evento só, conversa incluída", async () => {
  const { n, ag } = montar();
  const antes = n.historico().itens.length;
  const r = await ag.enviar('cria um botão roxo escrito "Comprar" no topo');
  assert.equal(r.via, "local");
  assert.equal(n.historico().itens.length, antes + 1);
  assert.match(n.historico().itens.at(-1).texto, /^Agente: cria um botão/);
  const bt = n.elementos().find(e => e.tipo === "botao");
  assert.equal(bt.rotulo, "Comprar");
  assert.equal(bt.estilo.fundo, "#7c3aed");
  assert.equal(n.conversa().length, 2);
  // "ele" se refere ao último elemento do agente
  await ag.enviar("aumenta a fonte dele");
  assert.equal(n.elemento(bt.id).estilo.tamanhoFonte, 18);
  // um Ctrl+Z desfaz o turno inteiro, inclusive as mensagens
  n.desfazer();
  assert.equal(n.elemento(bt.id).estilo.tamanhoFonte, 14);
  assert.equal(n.conversa().length, 2);
  n.desfazer();
  assert.equal(n.elementos().length, 0);
  assert.equal(n.conversa().length, 0);
});

test("pedido 'desfaz' no chat navega no histórico sem criar turno", async () => {
  const { n, ag } = montar();
  await ag.enviar("cria uma caixa");
  const r = await ag.enviar("desfaz");
  assert.equal(r.navegou, true);
  assert.equal(n.elementos().length, 0);
});

test("tema pelo agente muda só a interface; o canvas fica igual", async () => {
  const { n, ag, app } = montar();
  const b = n.criar("botao", 0, 0);
  n.definir(b, { "estilo.fundo": "#16a34a" });
  const semConversa = () => JSON.stringify(Object.fromEntries(Object.entries(n.doc.elementos).filter(([k]) => k !== "__conversa")));
  const antes = semConversa();
  await ag.enviar("aplica o tema escuro");
  assert.equal(app.temaUI, "escuro");
  assert.equal(semConversa(), antes);
  assert.equal(n.elemento(b).estilo.fundo, "#16a34a");
});

test("paleta pelo agente com cor protegida deixa pergunta pendente", async () => {
  const { n, ag } = montar();
  const b = n.criar("botao", 0, 0);
  n.definir(b, { "estilo.fundo": "#16a34a" });
  const r = await ag.enviar("recolore os elementos com a paleta escura");
  assert.match(r.resposta, /pergunta/);
  assert.ok(n.pendente());
  assert.equal(n.elemento(b).estilo.fundo, "#16a34a");
});

test("interpretador: ícone de casa, círculo, girar e espelhar", async () => {
  const { n, ag } = montar();
  const p = interpretar("cria um ícone de casa azul", n);
  assert.equal(p.acoes[0].entrada.tipo, "icone");
  assert.equal(p.acoes[0].entrada.propriedades.simbolo, "casa");
  assert.equal(p.acoes[0].entrada.propriedades["estilo.cor"], "#2563eb");
  assert.equal(interpretar("cria um círculo verde", n).acoes[0].entrada.tipo, "elipse");
  await ag.enviar("cria uma caixa no centro");
  await ag.enviar("gira ela 45 graus");
  const cx = n.elementos().find(e => e.tipo === "caixa");
  assert.equal(n.elemento(cx.id).rotacao, 45);
  await ag.enviar("espelha ela");
  assert.equal(n.elemento(cx.id).espelharH, true);
});

test("ferramentas aceitam as novas propriedades e recusam valor fora da lista", () => {
  assert.deepEqual(validarPropriedades("icone", { simbolo: "sino", rotacao: 30, "estilo.vidro": 8 }), { simbolo: "sino", rotacao: 30, "estilo.vidro": 8 });
  assert.throws(() => validarPropriedades("icone", { simbolo: "dragao" }), /aceita/);
});

test("formas: interpretador e ferramenta criam estrela e seta com texto", async () => {
  const { n, ag } = montar();
  const p = interpretar('cria uma estrela laranja escrito "Novo"', n);
  assert.equal(p.acoes[0].entrada.tipo, "forma");
  assert.equal(p.acoes[0].entrada.propriedades.forma, "estrela5");
  assert.equal(p.acoes[0].entrada.propriedades.texto, "Novo");
  assert.equal(interpretar("cria uma seta para a esquerda", n).acoes[0].entrada.propriedades.forma, "setaEsquerda");
  await ag.enviar("cria um hexágono verde");
  const f = n.elementos().find(e => e.tipo === "forma");
  assert.equal(f.forma, "hexagono");
  assert.equal(f.estilo.fundo, "#16a34a");
  assert.match(n.html(), /<path d="M25 0H75L100 50L75 100H25L0 50Z"/);
});

test("modelos: inserir um modelo é um evento só e usa containers", async () => {
  const { n, ag } = montar();
  const r = await ag.enviar("insere o modelo menu suspenso");
  assert.ok(r.acoes?.length ?? true);
  const conts = n.elementos().filter(e => e.tipo === "container");
  assert.ok(conts.length >= 2);
  const raiz = conts.find(c => !c.pai);
  assert.equal(raiz.layout.modo, "coluna");
  assert.ok(n.elementos().filter(e => e.pai === raiz.id).length >= 6);
  n.desfazer();
  assert.equal(n.elementos().length, 0);
});

test("agente local: 'recriar o menu completo estilo office atual' insere o modelo Office completo", async () => {
  const { n, ag } = montar();
  for (const pedido of ["recriar o menu completo estilo office atual", "cria um menu completo estilo Office", "monta a faixa de opções completa estilo office", "quero o ribbon do office"]) {
    const p = interpretar(pedido, n);
    assert.equal(p.acoes[0]?.nome, "inserir_modelo", pedido);
    assert.equal(p.acoes[0].entrada.modelo, "officeCompleto", pedido);
  }
  const r = await ag.enviar("recriar o menu completo estilo office atual");
  assert.ok(!/Não entendi/.test(r.resposta), r.resposta);
  const nomes = n.elementos().map(e => e.nome);
  for (const esperado of ["Aba Página Inicial", "Aba Inserir", "Grupo Área de Transferência", "Grupo Fonte", "Grupo Parágrafo"]) {
    assert.ok(nomes.includes(esperado), `faltou ${esperado}`);
  }
  assert.ok(n.elementos().length > 100);
  assert.ok(n.elementos().some(e => e.eventos?.some(v => v.acao === "mostrarSo")), "abas trocam de verdade");
  n.desfazer();
  assert.equal(n.elementos().length, 0, "inserir o menu é um evento só");
});

test("agente local: menu Arquivo estilo Office e pedido que continua não entendido", () => {
  const { n } = montar();
  assert.equal(interpretar("cria o menu arquivo estilo office", n).acoes[0].entrada.modelo, "menuArquivoOffice");
  assert.equal(interpretar("recria o menu", n).acoes.length, 0);
});

test("agente local: 'faixa híbrida recolhível' insere o modelo de faixa híbrida", async () => {
  const { n } = montar();
  assert.equal(interpretar("cria uma faixa de opções híbrida", n).acoes[0].entrada.modelo, "faixaHibrida");
  assert.equal(interpretar("monta uma faixa recolhivel com botao direito", n).acoes[0].entrada.modelo, "faixaHibrida");
  assert.equal(interpretar("cria uma faixa hibrida que começa recolhida", n).acoes[0].entrada.modelo, "faixaHibridaRecolhida");
});

test("agente local: 'faixa estilo powerpoint' insere o modelo faixaPowerPoint", async () => {
  const { n } = montar();
  assert.equal(interpretar("cria uma faixa estilo powerpoint", n).acoes[0].entrada.modelo, "faixaPowerPoint");
  assert.equal(interpretar("monta o menu do power point", n).acoes[0].entrada.modelo, "faixaPowerPoint");
});

test("agente local: 'faixa estilo word' insere faixaWord, mas 'menu completo estilo word' continua no Office completo", async () => {
  const { n } = montar();
  assert.equal(interpretar("insere o modelo faixa estilo word", n).acoes[0].entrada.modelo, "faixaWord");
  assert.equal(interpretar("recria o menu completo estilo word", n).acoes[0].entrada.modelo, "officeCompleto");
});

test("agente: insere qualquer modelo de menu pelo nome", () => {
  const { n } = montar();
  for (const [t, id] of [["insere o mega menu", "megaMenu"], ["cria menu em tela cheia", "menuTelaCheia"], ["insere barra de abas inferior", "barraAbasInferior"], ["adiciona menu radial", "menuRadial"], ["insere barra com busca", "barraComBusca"]]) {
    const p = interpretar(t, n);
    assert.equal(p.acoes[0]?.entrada.modelo, id, t);
  }
});

test("agente: insere a barra com teclas de acesso e perfis", () => {
  const { n } = montar();
  const p = interpretar("insere barra com teclas de acesso e perfis", n);
  assert.equal(p.acoes[0]?.entrada.modelo, "menuPorPerfil");
});

test("agente: recria a faixa do Axiom", () => {
  const { n } = montar();
  for (const t of ["recria a faixa do axiom", "recriar os menus do axiom", "insere o menu do axiom studio"]) {
    const p = interpretar(t, n);
    assert.equal(p.acoes[0]?.entrada.modelo, "faixaAxiom", t);
  }
});

test("agente: componentes e temas completos do formulário", () => {
  const { n, ag } = montar();
  void ag;
  const a1 = interpretar("cria um breadcrumb com Home, Rede e Switch", n);
  assert.equal(a1.acoes[0].entrada.tipo, "componente");
  assert.deepEqual(a1.acoes[0].entrada.dados.itens, ["Home", "Rede", "Switch"]);
  assert.equal(interpretar("cria barras de progresso", n).acoes[0].entrada.dados.modelo, "progresso");
  assert.equal(interpretar("cria uma barra de ferramentas neon", n).acoes[0].entrada.dados.estiloBarra, "neon");
  assert.equal(interpretar("cria um stepper", n).acoes[0].entrada.dados.modelo, "stepper");
  assert.equal(interpretar("aplica o tema hospitalar", n).acoes[0].entrada.tema, "hospitalar");
  assert.equal(interpretar("usar tema glassmorphism", n).acoes[0].entrada.tema, "vidro");
  assert.equal(interpretar("cria uma barra de ferramentas estilo photoshop", n).acoes[0]?.nome === "construtor_criar", false);
});

test("agente: ferramenta construtor_tema aplica o tema", async () => {
  const { n, app } = montar();
  n.adicionarItemConstrutor("blocos");
  const f = criarFerramentas(n, app, () => {});
  const t = f.find(x => x.name === "construtor_tema");
  assert.ok(t);
  await t.execute({ tema: "axiom" });
  assert.equal(n.construtor().tema, "axiom");
});

test("agente cria painéis divididos e respeita 'sem painel inferior'", () => {
  const n = new Nucleo();
  const p = interpretar("cria painéis divididos sem painel inferior", n);
  assert.equal(p.acoes[0].nome, "construtor_criar");
  assert.equal(p.acoes[0].entrada.tipo, "paineis");
  assert.deepEqual(p.acoes[0].entrada.dados.regioes, ["esq", "dir"]);
});
