// Biblioteca de modelos: peças de interface prontas (menus, barras, painéis, diálogos)
// montadas com containers inteligentes, como componentes de sistemas profissionais:
// uma árvore de camadas nomeadas, filhos que se arrumam sozinhos e tokens de cor/fonte.
// Ao inserir, o modelo inteiro vira um único evento desfazível.
//
// Formatos:
// · interno (o que o editor guarda): { id, nome, cat, desc, largura, altura, elementos: [{ ref, el }] }
//   com `el.pai` apontando para o `ref` do container.
// · arquivo de componente (exportar/importar): "hefestus.componente" v2, com meta, tokens e árvore.
import { criarModeloMenu } from "./menuEngine.js";
import { MENU_PDF_PADRAO } from "./menuPdfPadrao.js";
import { criarMenuPdfStudio } from "./pdfStudioMenu.js";
import { CATALOGO } from "./catalogo.js";
import { clonar } from "./protecao.js";
import { aplicarLayouts } from "./layout.js";
import { iconePorRotulo } from "./iconesAuto.js";
import { criarModelosSistemas } from "./modelosSistemas.js";
import { criarFaixaAxiom } from "./axiomFaixa.js";
import { criarModelosReferencia } from "./referenciasMenus.js";
import { FORMAS } from "./formas.js";
import { propsEfeitoBotao } from "./efeitosBotao.js";
function por(obj, caminho, valor) {
  const partes = caminho.split(".");
  let o = obj;
  for (const p of partes.slice(0, -1)) o = o[p] = typeof o[p] === "object" && o[p] !== null ? o[p] : {};
  o[partes.at(-1)] = clonar(valor);
}

// ---------- atalhos para descrever modelos (árvore; x/y relativos ao pai) ----------
const el = (tipo, x, y, largura, altura, p = {}, nome, filhos) => ({ tipo, x, y, largura, altura, p, nome, filhos });
const caixa = (x, y, l, a, fundo, p = {}, nome) =>
  el("caixa", x, y, l, a, { "estilo.fundo": fundo, "estilo.borda": "transparent", "estilo.larguraBorda": 0, "estilo.raio": 0, ...p }, nome);
const texto = (x, y, l, a, t, cor, tam = 13, p = {}, nome) =>
  el("texto", x, y, l, a, { texto: t, "estilo.cor": cor, "estilo.tamanhoFonte": tam, ...p }, nome ?? t);
const icone = (x, y, s, simbolo, cor, p = {}, nome) => el("icone", x, y, s, s, { simbolo, "estilo.cor": cor, ...p }, nome ?? `Ícone ${simbolo}`);
const linha = (x, y, l, a, cor, nome = "Separador") => el("linha", x, y, l, a, { "estilo.fundo": cor, "estilo.raio": 0 }, nome);
const botao = (x, y, l, a, rotulo, fundo, cor, borda = fundo, p = {}) =>
  el("botao", x, y, l, a, { rotulo, "estilo.fundo": fundo, "estilo.cor": cor, "estilo.borda": borda, ...p }, `Botão ${rotulo}`);
/** Container: modo livre | linha | coluna. */
const cont = (x, y, l, a, layout, estilo, nome, filhos) => el("container", x, y, l, a, {
  layout: { modo: "livre", espaco: 8, margem: 0, alinhar: "inicio", abracar: false, ...layout },
  "estilo.fundo": "transparent", "estilo.borda": "transparent", "estilo.larguraBorda": 0, "estilo.raio": 0, ...estilo,
}, nome, filhos);

/** Item de menu: container livre com ícone, rótulo e atalho (arrastar reordena o menu). */
function itemMenu(largura, [ic, rot, atalho, perigo], { cor, corSec, destaque }) {
  const c = perigo ? "#ef4444" : cor;
  return cont(0, 0, largura, 28, {}, { "estilo.fundo": destaque === rot ? `${corSec}33` : "transparent", "estilo.raio": 4 }, `Item ${rot}`, [
    ic ? icone(10, 6, 16, ic, perigo ? c : corSec) : null,
    texto(36, 5, largura - 120, 18, rot, c, 13, {}, `Rótulo ${rot}`),
    atalho ? texto(largura - 82, 5, 74, 18, atalho, corSec, 12, { "estilo.alinhamento": "direita" }, `Atalho ${rot}`) : null,
  ].filter(Boolean));
}

function modeloMenu(id, nome, desc, cfg) {
  const w = cfg.largura - 12;
  const itens = cfg.linhas.map((l, i) => (l === "-" ? linha(0, 0, w, 1, cfg.sep, `Separador ${i}`) : itemMenu(w, l, cfg)));
  return {
    id, nome, cat: "Menus", desc, tags: ["menu", "dropdown"],
    raiz: cont(0, 0, cfg.largura, 100, { modo: "coluna", espaco: 2, margem: 6, abracar: true },
      { "estilo.fundo": cfg.fundo, "estilo.raio": 6, "estilo.sombra": "media", "estilo.borda": cfg.sep, "estilo.larguraBorda": 1 }, nome, itens),
  };
}

/** Botão-ícone de barra: container livre de 34×34 com o ícone no meio. */
const botaoIcone = (ic, cor, ativo, tam = 20, lado = 34) =>
  cont(0, 0, lado, lado, {}, { "estilo.fundo": ativo ? `${cor}26` : "transparent", "estilo.raio": 7 }, `Ferramenta ${ic}`, [icone((lado - tam) / 2, (lado - tam) / 2, tam, ic, ativo ? cor : `${cor}cc`)]);

function barraDeIcones(id, nome, desc, { vertical = false, fundo, cor, ativo, raio = 8, borda = "transparent", sombra = "nenhuma", grupos, tam = 20, lado = 34 }) {
  const filhos = [];
  grupos.forEach((g, i) => {
    if (i) filhos.push(vertical ? linha(0, 0, lado - 8, 1, `${cor}55`, `Separador ${i}`) : linha(0, 0, 1, lado - 14, `${cor}55`, `Separador ${i}`));
    for (const ic of g) filhos.push(botaoIcone(ic, cor, ic === ativo, tam, lado));
  });
  return {
    id, nome, cat: "Barras", desc, tags: ["barra", "ferramentas", vertical ? "vertical" : "horizontal"],
    raiz: cont(0, 0, 100, 100, { modo: vertical ? "coluna" : "linha", espaco: 4, margem: 6, alinhar: "centro", abracar: true },
      { "estilo.fundo": fundo, "estilo.raio": raio, "estilo.borda": borda, "estilo.larguraBorda": borda === "transparent" ? 0 : 1, "estilo.sombra": sombra }, nome, filhos),
  };
}

function faixaDeOpcoes() {
  const banda = "#8a4f0d";
  const abas = ["Arquivo", "Início", "Inserir", "Design", "Exibir"];
  const comando = (ic, r) => cont(0, 0, 58, 62, { modo: "coluna", espaco: 4, margem: 2, alinhar: "centro" }, {}, `Comando ${r}`, [
    icone(0, 0, 30, ic, "#5a6274"), texto(0, 0, 56, 18, r, "#1c2130", 12, { "estilo.alinhamento": "centro" }, `Rótulo ${r}`),
  ]);
  const grupos = [
    ["Área de transferência", [["colar", "Colar"], ["cortar", "Recortar"], ["copiar", "Copiar"]]],
    ["Inserir", [["caixa", "Caixa"], ["texto", "Texto"], ["imagem", "Imagem"]]],
    ["Organizar", [["camadas", "Camadas"], ["alinhar", "Alinhar"], ["girar", "Girar"]]],
  ];
  return {
    id: "faixa", nome: "Faixa de opções", cat: "Menus", desc: "Abas com grupos de comandos grandes", tags: ["ribbon", "abas", "office"],
    raiz: cont(0, 0, 960, 138, {}, {}, "Faixa de opções", [
      cont(0, 0, 960, 34, {}, { "estilo.fundo": banda }, "Faixa das abas", [
        cont(8, 6, 400, 28, { modo: "linha", espaco: 4 }, {}, "Abas", abas.map((a, i) =>
          cont(0, 0, 72, 28, {}, { "estilo.fundo": i === 1 ? "#ffffff" : "transparent", "estilo.raio": 4 }, `Aba ${a}`, [
            texto(0, 5, 72, 18, a, i === 1 ? banda : "#ffffff", 13, { "estilo.alinhamento": "centro" }, `Rótulo ${a}`),
          ]))),
      ]),
      cont(0, 34, 960, 104, { modo: "linha", espaco: 12, margem: 8 }, { "estilo.fundo": "#ffffff", "estilo.borda": "#d2d6df", "estilo.larguraBorda": 1 }, "Corpo da faixa",
        grupos.flatMap(([g, cmds], i) => [
          ...(i ? [linha(0, 0, 1, 86, "#d2d6df", `Divisor ${i}`)] : []),
          cont(0, 0, 186, 88, { modo: "coluna", espaco: 4, alinhar: "centro" }, {}, `Grupo ${g}`, [
            cont(0, 0, 186, 62, { modo: "linha", espaco: 6 }, {}, `Comandos ${g}`, cmds.map(([ic, r]) => comando(ic, r))),
            texto(0, 0, 180, 16, g, "#5a6274", 11, { "estilo.alinhamento": "centro" }, `Nome do grupo ${g}`),
          ]),
        ])),
    ]),
  };
}

/** Menu completo no estilo Microsoft 365 atual: barra de título com busca, abas, faixa com grupos e barra de status. */
function officeCompleto() {
  const AZ = "#0f6cbd", TX = "#1b1b1b", SEC = "#616161", LIN = "#e0e0e0", FAIXA = "#f5f5f5";
  const abas = ["Arquivo", "Página Inicial", "Inserir", "Desenhar", "Design", "Layout", "Revisão", "Exibir", "Ajuda"];
  const ativa = "Página Inicial";
  const grande = (ic, r, l = 64) => cont(0, 0, l, 70, { modo: "coluna", espaco: 4, margem: 2, alinhar: "centro" }, { "estilo.raio": 4 }, `Comando ${r}`, [
    icone(0, 0, 32, ic, AZ), texto(0, 0, l - 4, 18, r, TX, 12, { "estilo.alinhamento": "centro" }, `Rótulo ${r}`),
  ]);
  const pequeno = (ic, r, l = 104) => cont(0, 0, l, 22, { modo: "linha", espaco: 6, alinhar: "centro", margem: 2 }, { "estilo.raio": 3 }, `Comando ${r}`, [
    icone(0, 0, 16, ic, AZ), texto(0, 0, l - 26, 16, r, TX, 12, {}, `Rótulo ${r}`),
  ]);
  const so = (ic, nome, ativo = false) => cont(0, 0, 26, 26, {}, { "estilo.fundo": ativo ? "#cfe4fa" : "transparent", "estilo.raio": 4 }, nome, [icone(5, 5, 16, ic, ativo ? AZ : SEC)]);
  const campo = (l, t, nome) => cont(0, 0, l, 26, {}, { "estilo.fundo": "#ffffff", "estilo.borda": "#c7c7c7", "estilo.larguraBorda": 1, "estilo.raio": 4 }, nome, [texto(8, 5, l - 28, 16, t, TX, 12, {}, `Valor ${nome}`), icone(l - 20, 6, 14, "setaBaixo", SEC)]);
  const grupo = (nome, larg, corpo) => cont(0, 0, larg, 100, { modo: "coluna", espaco: 2, alinhar: "centro" }, {}, `Grupo ${nome}`, [
    cont(0, 0, larg, 78, { modo: "linha", espaco: 4 }, {}, `Comandos ${nome}`, corpo),
    texto(0, 0, larg - 6, 16, nome, SEC, 11, { "estilo.alinhamento": "centro" }, `Nome do grupo ${nome}`),
  ]);
  const col = (nome, itens) => cont(0, 0, 110, 76, { modo: "coluna", espaco: 2 }, {}, nome, itens);
  const div = i => linha(0, 0, 1, 84, LIN, `Divisor ${i}`);
  const grupos = [
    grupo("Área de Transferência", 150, [grande("colar", "Colar", 56), col("Recortar e copiar", [pequeno("cortar", "Recortar", 92), pequeno("copiar", "Copiar", 92), pequeno("pincel", "Pincel", 92)])]),
    grupo("Fonte", 230, [cont(0, 0, 220, 76, { modo: "coluna", espaco: 6 }, {}, "Fonte e tamanho", [
      cont(0, 0, 220, 26, { modo: "linha", espaco: 6 }, {}, "Linha da fonte", [campo(136, "Aptos (Corpo)", "Fonte"), campo(60, "11", "Tamanho")]),
      cont(0, 0, 220, 26, { modo: "linha", espaco: 2 }, {}, "Linha do estilo", [so("texto", "Negrito", true), so("texto", "Itálico"), so("texto", "Sublinhado"), so("pincel", "Cor do realce"), so("tema", "Cor da fonte")]),
    ])]),
    grupo("Parágrafo", 150, [cont(0, 0, 144, 76, { modo: "coluna", espaco: 6 }, {}, "Parágrafo", [
      cont(0, 0, 144, 26, { modo: "linha", espaco: 2 }, {}, "Listas", [so("lista", "Marcadores"), so("ordenar", "Numeração"), so("filtro", "Recuo")]),
      cont(0, 0, 144, 26, { modo: "linha", espaco: 2 }, {}, "Alinhamento", [so("menos", "Esquerda", true), so("grade", "Centro"), so("lista", "Direita"), so("ordenar", "Justificar")]),
    ])]),
    grupo("Estilos", 214, ["Normal", "Sem Espaç.", "Título 1"].map((t, i) =>
      cont(0, 0, 66, 60, {}, { "estilo.fundo": "#ffffff", "estilo.borda": i === 0 ? AZ : LIN, "estilo.larguraBorda": 1, "estilo.raio": 4 }, `Estilo ${t}`, [
        texto(6, 10, 54, 20, "AaBb", i === 2 ? AZ : TX, i === 2 ? 18 : 15, { "estilo.peso": i === 2 ? 600 : 400 }, `Amostra ${t}`),
        texto(6, 38, 54, 14, t, SEC, 10, {}, `Nome ${t}`),
      ]))),
    grupo("Edição", 132, [col("Edição", [pequeno("buscar", "Localizar", 120), pequeno("editar", "Substituir", 120), pequeno("selTudo", "Selecionar", 120)])]),
    grupo("Voz e suplementos", 160, [grande("microfone", "Ditar", 70), grande("biblioteca", "Suplementos", 80)]),
  ];
  return {
    id: "officeCompleto", nome: "Office completo", cat: "Menus",
    desc: "Barra de título com busca, abas, faixa com grupos e barra de status — estilo Microsoft 365 atual",
    tags: ["office", "ribbon", "faixa", "menu completo", "microsoft 365", "abas", "barra de título", "status"],
    raiz: cont(0, 0, 1280, 250, { modo: "coluna", espaco: 0 }, { "estilo.fundo": "#ffffff", "restricoes.h": "ambos", "restricoes.v": "topo" }, "Office completo", [
      cont(0, 0, 1280, 46, { modo: "linha", espaco: 10, margem: 8, alinhar: "centro" }, { "estilo.fundo": "#ffffff", "restricoes.h": "ambos" }, "Barra de título", [
        icone(0, 0, 24, "modelo", AZ, {}, "Ícone do aplicativo"),
        so("salvar", "Salvar"), so("desfazer", "Desfazer"), so("refazer", "Refazer"),
        texto(0, 0, 190, 20, "Documento1 — Salvo", TX, 13, { "estilo.peso": 500 }, "Nome do documento"),
        cont(0, 0, 360, 30, { modo: "linha", espaco: 8, margem: 8, alinhar: "centro" }, { "estilo.fundo": "#f0f0f0", "estilo.raio": 15, "estilo.borda": LIN, "estilo.larguraBorda": 1 }, "Caixa de pesquisa", [
          icone(0, 0, 16, "buscar", SEC), texto(0, 0, 300, 18, "Pesquisar (Alt+Q)", SEC, 13, {}, "Texto da pesquisa"),
        ]),
        icone(0, 0, 20, "sino", SEC, {}, "Notificações"),
        cont(0, 0, 30, 30, {}, { "estilo.fundo": AZ, "estilo.raio": 15 }, "Avatar", [texto(0, 6, 30, 18, "RS", "#ffffff", 12, { "estilo.alinhamento": "centro", "estilo.peso": 600 }, "Iniciais")]),
      ]),
      cont(0, 0, 1280, 36, { modo: "linha", espaco: 2, margem: 8, alinhar: "centro" }, { "estilo.fundo": "#ffffff", "restricoes.h": "ambos" }, "Abas",
        [...abas.map(a => cont(0, 0, a === "Página Inicial" ? 110 : 76, 32, {}, { "estilo.fundo": "transparent", "estilo.raio": 4 }, `Aba ${a}`, [
          texto(0, 6, a === "Página Inicial" ? 110 : 76, 20, a, a === ativa ? AZ : TX, 13, { "estilo.alinhamento": "centro", "estilo.peso": a === ativa ? 600 : 400 }, `Rótulo ${a}`),
          ...(a === ativa ? [linha(16, 29, a === "Página Inicial" ? 78 : 44, 3, AZ, "Aba ativa")] : []),
        ])),
        cont(0, 0, 150, 30, { modo: "linha", espaco: 6, margem: 4, alinhar: "centro" }, { "estilo.raio": 4 }, "Comentários", [icone(0, 0, 16, "chat", SEC), texto(0, 0, 90, 18, "Comentários", TX, 12, {}, "Rótulo Comentários")]),
        cont(0, 0, 112, 28, {}, { "estilo.fundo": AZ, "estilo.raio": 4 }, "Compartilhar", [icone(10, 6, 16, "compartilhar", "#ffffff"), texto(32, 5, 74, 18, "Compartilhar", "#ffffff", 12, { "estilo.peso": 500 }, "Rótulo Compartilhar")])]),
      cont(0, 0, 1280, 112, { modo: "linha", espaco: 10, margem: 10 }, { "estilo.fundo": FAIXA, "estilo.borda": LIN, "estilo.larguraBorda": 1, "restricoes.h": "ambos" }, "Faixa de opções",
        grupos.flatMap((g, i) => (i ? [div(i), g] : [g]))),
      cont(0, 0, 1280, 26, { modo: "linha", espaco: 24, margem: 8, alinhar: "centro" }, { "estilo.fundo": "#f0f0f0", "restricoes.h": "ambos" }, "Barra de status", [
        texto(0, 0, 120, 16, "Página 1 de 1", SEC, 11, {}, "Página"), texto(0, 0, 100, 16, "0 palavras", SEC, 11, {}, "Palavras"),
        texto(0, 0, 150, 16, "Português (Brasil)", SEC, 11, {}, "Idioma"), texto(0, 0, 150, 16, "Acessibilidade: tudo certo", SEC, 11, {}, "Acessibilidade"),
        texto(0, 0, 60, 16, "100%", SEC, 11, { "estilo.alinhamento": "direita" }, "Zoom"),
      ]),
    ]),
  };
}


// ---------- modelos com comportamento e responsividade ----------
const ABERTURA_MENU = { iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "deslizar", fundoEscuro: false };
const comAbertura = (a, extra = {}) => ({ ...Object.fromEntries(Object.entries(a).map(([k, v]) => [`abertura.${k}`, v])), ...extra });
const ev = (tipo, acao, alvo, dispara) => ({ tipo, dispara, acao, alvo });

/** Menu de contexto da faixa (botão direito), com os itens do PowerPoint. Liga-se à ref "corpo" e à ref "menuCtx". */
function menuContextoFaixa(TX = "#1b1b1b", SEC = "#5f6368") {
  const itemCtx = ([ic, rot, atalho], eventos) => {
    const i = itemMenu(380, [ic, rot, atalho], { cor: TX, corSec: SEC });
    return { ...i, p: { ...i.p, "estados.hover.fundo": "#f3f4f6", eventos } };
  };
  const itens = [
    itemCtx(["ferramentas", "Personalizar Barra de Acesso Rápido…", ""], [ev("onClick", "", "", "personalizar_acesso_rapido")]),
    itemCtx(["setaBaixo", "Mostrar Acesso Rápido abaixo da Faixa", ""], [ev("onClick", "", "", "acesso_rapido_abaixo")]),
    itemCtx(["engrenagem", "Personalizar a Faixa de Opções…", ""], [ev("onClick", "", "", "personalizar_faixa")]),
    itemCtx(["setaCima", "Recolher a Faixa de Opções", "Ctrl+F1"], [ev("onClick", "alternar", "corpo", "faixa_recolhida")]),
  ];
  return cont(0, 0, 400, 170, { modo: "coluna", espaco: 2, margem: 6, abracar: true }, {
    ref: "menuCtx", "estilo.fundo": "#ffffff", "estilo.borda": "#e5e7eb", "estilo.larguraBorda": 1, "estilo.raio": 6, "estilo.sombra": "media", "acessibilidade.role": "menu", "acessibilidade.ariaLabel": "Faixa de opções",
    ...comAbertura({ iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "aparecer", fundoEscuro: false }),
  }, "Menu de contexto da faixa", itens);
}

/**
 * Faixa de opções híbrida (como no PowerPoint): abas + corpo com grupos de comandos.
 * Clique numa aba mostra o painel dela; "Recolher" esconde o corpo e clicar numa aba traz de volta.
 * Botão direito na faixa abre o menu de contexto (personalizar acesso rápido, personalizar faixa, recolher).
 */
function faixaHibrida({ id, nome, desc, cor, iniciaRecolhida = false }) {
  const TX = "#1b1b1b", SEC = "#5f6368", LIN = "#d2d6df";
  const abas = ["Arquivo", "Início", "Inserir", "Exibir"];
  const paineis = [
    ["Início", [["Área de transferência", [["colar", "Colar"], ["cortar", "Recortar"], ["copiar", "Copiar"]]], ["Organizar", [["camadas", "Camadas"], ["alinhar", "Alinhar"], ["girar", "Girar"]]]]],
    ["Inserir", [["Elementos", [["caixa", "Caixa"], ["texto", "Texto"], ["imagem", "Imagem"]]], ["Modelos", [["grade", "Grade"], ["lista", "Lista"], ["tema", "Tema"]]]]],
    ["Exibir", [["Zoom", [["previa", "Prévia"], ["grade", "Grade"], ["filtro", "Filtro"]]]]],
  ];
  const comando = (ic, r) => cont(0, 0, 60, 62, { modo: "coluna", espaco: 4, margem: 2, alinhar: "centro" }, { "estilo.raio": 4, "estados.hover.fundo": `${cor}14` }, `Comando ${r}`, [
    icone(0, 0, 30, ic, cor), texto(0, 0, 58, 18, r, TX, 12, { "estilo.alinhamento": "centro" }, `Rótulo ${r}`),
  ]);
  const painel = ([aba, grupos], i) => cont(0, 0, 960, 92, { modo: "linha", espaco: 12, margem: 8 }, {
    ref: `painel${i}`, "estilo.fundo": "#ffffff", "acessibilidade.role": "tabpanel", "acessibilidade.ariaLabel": aba,
    ...comAbertura({ iniciaFechado: i > 0, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "aparecer", fundoEscuro: false }),
  }, `Painel ${aba}`, grupos.flatMap(([g, cmds], j) => [
    ...(j ? [linha(0, 0, 1, 76, LIN, `Divisor ${g}`)] : []),
    cont(0, 0, 70 * cmds.length, 78, { modo: "coluna", espaco: 4, alinhar: "centro" }, {}, `Grupo ${g}`, [
      cont(0, 0, 70 * cmds.length, 62, { modo: "linha", espaco: 6 }, {}, `Comandos ${g}`, cmds.map(([ic, r]) => comando(ic, r))),
      texto(0, 0, 70 * cmds.length - 4, 14, g, SEC, 11, { "estilo.alinhamento": "centro" }, `Nome do grupo ${g}`),
    ]),
  ]));
  const aba = (r, i) => botao(0, 0, 84, 34, r, i === 0 ? `${cor}` : "transparent", "#ffffff", "transparent", {
    "estilo.raio": 0, "estilo.peso": 500, "estados.hover.fundo": "#ffffff26", "estados.ativo.fundo": "#00000040", "estados.ativo.cor": "#ffffff", "acessibilidade.role": "tab",
    eventos: i === 0 ? [ev("onClick", "", "", "aba_arquivo")] : [
      ev("onClick", "mostrarSo", `painel${i - 1}`, `aba_${r.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`),
      ev("onClick", "abrir", "corpo", "faixa_aberta"),
    ],
  });
  return {
    id, nome, cat: "Menus", desc, tags: ["ribbon", "faixa", "híbrido", "recolher", "botão direito", "office", "powerpoint"],
    raizes: [
      cont(0, 0, 960, 130, { modo: "coluna", espaco: 0, margem: 0, abracar: true }, {
        "estilo.fundo": "#ffffff", "estilo.borda": LIN, "estilo.larguraBorda": 1,
        eventos: [ev("onContext", "abrir", "menuCtx", "menu_faixa_aberto")],
      }, nome, [
        cont(0, 0, 960, 34, { modo: "linha", espaco: 2, margem: 0, alinhar: "centro" }, { "estilo.fundo": cor, "acessibilidade.role": "tablist" }, "Abas", abas.map(aba)),
        cont(0, 0, 960, 96, { modo: "coluna", espaco: 0, abracar: true }, {
          ref: "corpo", "acessibilidade.role": "region", "acessibilidade.ariaLabel": "Faixa de opções",
          ...comAbertura({ iniciaFechado: iniciaRecolhida, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "deslizar", fundoEscuro: false }),
        }, "Corpo da faixa", [
          ...paineis.map(painel),
          botao(0, 0, 118, 22, "▲ Recolher", "transparent", SEC, "transparent", { "estilo.tamanhoFonte": 12, "estados.hover.fundo": "#0000000d", "estilo.raio": 4, "dimensao.largura": "abracar", eventos: [ev("onClick", "fechar", "corpo", "faixa_recolhida")] }),
        ]),
      ]),
      menuContextoFaixa(TX, SEC),
    ],
  };
}

/**
 * Faixa no estilo PowerPoint (mockup): barra de título com acesso rápido, abas, grupo "Inserir Formas"
 * (galeria, Editar Forma, Caixa de Texto, Mesclar Formas) e "Estilos de Forma" (botão Função + galeria).
 * Mesmo comportamento da híbrida: abas trocam o painel, ▲ recolhe, botão direito abre o menu.
 */
function faixaPowerPoint() {
  const COR = "#b7472a", TX = "#262626", SEC = "#7a7a7a", LIN = "#d6d6d6";
  const abas = ["Arquivo", "Página Inicial", "Inserir", "Desenhar", "Design", "Transições", "Animações", "Apresentação de Slides"];
  const larg = [66, 108, 62, 78, 62, 88, 88, 176];
  const qat = (ic, cor = "#ffffff") => cont(0, 0, 28, 28, {}, { "estilo.raio": 4, "estados.hover.fundo": "#ffffff26" }, `Acesso rápido ${ic}`, [icone(5, 5, 18, ic, cor)]);
  const cinza = (l, a, nome) => cont(0, 0, l, a, {}, { "estilo.fundo": "#f2f2f2", "estilo.raio": 12, "estilo.sombra": "media", "estados.hover.fundo": "#e6e6e6" }, nome, []);
  const cel = ic => cont(0, 0, 28, 26, {}, { "estados.hover.fundo": "#e9eef7", "estilo.raio": 3 }, `Forma ${ic}`, [icone(5, 4, 18, ic, TX)]);
  const formas = ["texto", "linha", "setaDir", "caixa", "elipse", "caixa", "estrela", "setaDir", "coracao", "raio", "nuvem", "linha", "texto", "elipse", "setaDir", "caixa", "linha", "nuvem"];
  const galeria = cont(0, 0, 208, 84, { modo: "linha", espaco: 0 }, { "estilo.fundo": "#ffffff", "estilo.borda": "#bdbdbd", "estilo.larguraBorda": 1 }, "Galeria de formas", [
    cont(0, 0, 176, 84, { modo: "linha", quebrar: true, espaco: 0, margem: 2 }, {}, "Formas", formas.map(cel)),
    cont(0, 0, 28, 84, { modo: "coluna", espaco: 2, alinhar: "centro", margem: 2 }, { "estilo.fundo": "#f3f3f3" }, "Rolagem da galeria", [
      cont(0, 0, 22, 24, {}, {}, "Rolar para cima", [icone(4, 5, 14, "setaCima", "#a0a0a0")]),
      cont(0, 0, 22, 24, {}, {}, "Rolar para baixo", [icone(4, 5, 14, "setaBaixo", TX)]),
      cont(0, 0, 22, 24, {}, {}, "Mais formas", [icone(4, 5, 14, "mais", TX)]),
    ]),
  ]);
  const peq = (ic, r, ativo = true, seta = false) => cont(0, 0, 170, 26, { modo: "linha", espaco: 6, alinhar: "centro", margem: 2 }, { "estilo.raio": 3, "estados.hover.fundo": "#00000010" }, `Comando ${r}`, [
    icone(0, 0, 20, ic, ativo ? "#3b6fb6" : "#b5b5b5"), texto(0, 0, 118, 20, r, ativo ? TX : "#a8a8a8", 14, {}, `Rótulo ${r}`), seta ? icone(0, 0, 12, "setaBaixo", ativo ? TX : "#b5b5b5") : null,
  ].filter(Boolean));
  const grupoFormas = cont(0, 0, 410, 112, { modo: "coluna", espaco: 2, alinhar: "centro" }, {}, "Grupo Inserir Formas", [
    cont(0, 0, 410, 88, { modo: "linha", espaco: 10 }, {}, "Comandos Inserir Formas", [
      galeria, cont(0, 0, 184, 84, { modo: "coluna", espaco: 2 }, {}, "Comandos de forma", [peq("editar", "Editar Forma", true, true), peq("texto", "Caixa de Texto"), peq("camadas", "Mesclar Formas", false, true)]),
    ]),
    texto(0, 0, 400, 16, "Inserir Formas", SEC, 12, { "estilo.alinhamento": "centro" }, "Nome do grupo Inserir Formas"),
  ]);
  const grupoEstilos = cont(0, 0, 340, 112, { modo: "coluna", espaco: 2 }, {}, "Grupo Estilos de Forma", [
    cont(0, 0, 340, 92, { modo: "coluna", espaco: 6 }, {}, "Comandos Estilos de Forma", [
      cont(0, 0, 330, 44, { modo: "linha", espaco: 14, alinhar: "centro" }, {}, "Botão Função", [
        cinza(44, 44, "Ícone Função"), texto(0, 0, 200, 26, "Função", TX, 18, {}, "Rótulo Função"),
      ]),
      cont(0, 0, 330, 44, { modo: "linha", espaco: 6, alinhar: "centro", margem: 3 }, { "estilo.fundo": "#ffffff", "estilo.borda": "#cfcfcf", "estilo.larguraBorda": 1 }, "Galeria de estilos",
        [0, 1, 2, 3].map(i => cinza(56, 34, `Estilo ${i + 1}`)).concat([icone(0, 0, 20, "setaBaixo", "#b5b5b5")])),
    ]),
    cont(0, 0, 340, 18, { modo: "linha", espaco: 6, justificar: "entre", alinhar: "centro" }, {}, "Rodapé Estilos de Forma", [
      texto(0, 0, 300, 16, "Estilos de Forma", SEC, 12, { "estilo.alinhamento": "centro" }, "Nome do grupo Estilos de Forma"), icone(0, 0, 12, "setaDir", SEC, { "acessibilidade.ariaLabel": "Abrir caixa de diálogo" }, "Iniciador de diálogo"),
    ]),
  ]);
  const corpoPainel = (aba, i, filhos) => cont(0, 0, 960, 118, { modo: "linha", espaco: 12, margem: 6 }, {
    ref: `painel${i}`, "estilo.fundo": "#ffffff", "estilo.borda": LIN, "estilo.larguraBorda": 1, "acessibilidade.role": "tabpanel", "acessibilidade.ariaLabel": aba,
    ...comAbertura({ iniciaFechado: i !== 1, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "aparecer", fundoEscuro: false }),
  }, `Painel ${aba}`, filhos);
  const grande = (ic, r) => cont(0, 0, 70, 90, { modo: "coluna", espaco: 4, alinhar: "centro", margem: 4 }, { "estilo.raio": 4, "estados.hover.fundo": "#00000010" }, `Comando ${r}`, [icone(0, 0, 36, ic, "#3b6fb6"), texto(0, 0, 66, 18, r, TX, 13, { "estilo.alinhamento": "centro" }, `Rótulo ${r}`)]);
  const paineis = [
    corpoPainel("Página Inicial", 0, [grande("colar", "Colar"), grande("cortar", "Recortar"), grande("copiar", "Copiar"), linha(0, 0, 1, 96, LIN, "Divisor"), grande("pincel", "Pincel")]),
    corpoPainel("Inserir", 1, [grupoFormas, linha(0, 0, 1, 100, LIN, "Divisor Formas"), grupoEstilos]),
    corpoPainel("Design", 2, [grande("tema", "Temas"), grande("grade", "Variantes"), grande("telaCheia", "Tamanho do slide")]),
  ];
  const painelDe = { "Página Inicial": 0, "Inserir": 1, "Design": 2 };
  const aba = (r, i) => {
    const painel = painelDe[r];
    const slug = r.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W+/g, "_");
    return botao(0, 0, larg[i], 40, r, i === 0 ? "#00000026" : "transparent", "#ffffff", "transparent", {
      "estilo.raio": 0, "estilo.tamanhoFonte": 14, "estados.hover.fundo": "#ffffff26", "estados.ativo.fundo": "#00000040", "estados.ativo.cor": "#ffffff", "acessibilidade.role": "tab",
      eventos: painel === undefined ? [ev("onClick", "", "", `aba_${slug}`)] : [ev("onClick", "mostrarSo", `painel${painel}`, `aba_${slug}`), ev("onClick", "abrir", "corpo", "faixa_aberta")],
    });
  };
  return {
    id: "faixaPowerPoint", nome: "Faixa estilo PowerPoint", cat: "Menus", desc: "Título com acesso rápido, abas, Inserir Formas e Estilos de Forma; recolhe e tem menu de botão direito", tags: ["ribbon", "powerpoint", "faixa", "mockup", "formas", "híbrido"],
    raizes: [
      cont(0, 0, 960, 200, { modo: "coluna", espaco: 0, margem: 0, abracar: true }, {
        "estilo.fundo": "#ffffff", eventos: [ev("onContext", "abrir", "menuCtx", "menu_faixa_aberto")],
      }, "Faixa estilo PowerPoint", [
        cont(0, 0, 960, 44, {}, { "estilo.fundo": COR }, "Barra de título", [
          cont(12, 8, 190, 28, { modo: "linha", espaco: 2, alinhar: "centro" }, {}, "Acesso rápido", [qat("desfazer"), qat("setaBaixo"), qat("refazer", "#e8b4a6"), qat("previa"), qat("salvar"), qat("setaBaixo")]),
          texto(300, 12, 360, 22, "Apresentação1  -  PowerPoint", "#ffffff", 14, { "estilo.alinhamento": "centro" }, "Título do documento"),
        ]),
        cont(0, 0, 960, 40, { modo: "linha", espaco: 0, margem: 0, alinhar: "centro" }, { "estilo.fundo": COR, "acessibilidade.role": "tablist" }, "Abas", abas.map(aba)),
        cont(0, 0, 960, 118, { modo: "coluna", espaco: 0, abracar: true }, {
          ref: "corpo", "acessibilidade.role": "region", "acessibilidade.ariaLabel": "Faixa de opções",
          ...comAbertura({ iniciaFechado: false, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "deslizar", fundoEscuro: false }),
        }, "Corpo da faixa", [
          ...paineis,
          botao(0, 0, 118, 22, "▲ Recolher", "transparent", SEC, "transparent", { "estilo.tamanhoFonte": 12, "estados.hover.fundo": "#0000000d", "estilo.raio": 4, "dimensao.largura": "abracar", eventos: [ev("onClick", "fechar", "corpo", "faixa_recolhida")] }),
        ]),
      ]),
      menuContextoFaixa(TX, SEC),
    ],
  };
}

// ---------- estruturas de grupo da faixa (cada produto Office usa várias; aqui ficam todas à mão) ----------
/**
 * Peças para montar grupos de faixa. Cada "estrutura" é um jeito diferente de organizar comandos:
 * grande + pequenos (Colar), pilha de 3 (Editando), comandos grandes lado a lado (Acrobat), combos + linha de ícones (Fonte),
 * grade de ícones (Parágrafo), galeria com rolagem (Estilos) e grande + grade 2×2 (Estilos de Forma).
 */
function pecasFaixa(cor, TX = "#262626", SEC = "#6b6b6b") {
  const grande = (ic, r, { seta = false, l = 64 } = {}) => cont(0, 0, l, 78, { modo: "coluna", espaco: 3, margem: 2, alinhar: "centro" }, { "estilo.raio": 4, "estados.hover.fundo": "#00000010" }, `Comando ${r}`, [
    icone(0, 0, 34, ic, cor), texto(0, 0, l - 4, 32, seta ? `${r} ▾` : r, TX, 12, { "estilo.alinhamento": "centro" }, `Rótulo ${r}`),
  ]);
  const pequeno = (ic, r, { seta = false, l = 120, ativo = true } = {}) => cont(0, 0, l, 24, { modo: "linha", espaco: 6, alinhar: "centro", margem: 2 }, { "estilo.raio": 3, "estados.hover.fundo": "#00000010" }, `Comando ${r}`, [
    icone(0, 0, 18, ic, ativo ? cor : "#b5b5b5"), texto(0, 0, l - 40, 18, r, ativo ? TX : "#a8a8a8", 12, {}, `Rótulo ${r}`), seta ? icone(0, 0, 10, "setaBaixo", ativo ? TX : "#b5b5b5") : null,
  ].filter(Boolean));
  const pilha = (itens, l = 120) => cont(0, 0, l, 78, { modo: "coluna", espaco: 2 }, {}, "Pilha de comandos", itens.map(([ic, r, seta, ativo]) => pequeno(ic, r, { seta, l, ativo })));
  const so = (ic, nome, ativo = false) => cont(0, 0, 26, 26, {}, { "estilo.fundo": ativo ? "#d6e2f3" : "transparent", "estilo.raio": 3, "estados.hover.fundo": "#00000012" }, nome, [icone(4, 4, 18, ic, ativo ? cor : TX)]);
  const linhaIcones = (ics, l) => cont(0, 0, l, 26, { modo: "linha", espaco: 0 }, {}, "Linha de ícones", ics.map(([ic, n, a]) => so(ic, n, a)));
  const combo = (l, t, nome) => cont(0, 0, l, 24, {}, { "estilo.fundo": "#ffffff", "estilo.borda": "#bdbdbd", "estilo.larguraBorda": 1, "estilo.raio": 2 }, nome, [texto(6, 3, l - 24, 18, t, TX, 12, {}, `Valor ${nome}`), icone(l - 16, 7, 10, "setaBaixo", TX)]);
  const amostra = (t, r, fundo = "#ffffff", ativo = false) => cont(0, 0, 66, 70, { modo: "coluna", espaco: 6, margem: 4, alinhar: "centro" }, { "estilo.fundo": fundo, "estilo.borda": ativo ? "#a6a6a6" : "transparent", "estilo.larguraBorda": ativo ? 2 : 0, "estados.hover.fundo": "#e9eef7" }, `Estilo ${r}`, [
    texto(0, 0, 62, 22, "AaBbCc", TX, t, { "estilo.alinhamento": "centro" }, `Amostra ${r}`), texto(0, 0, 62, 16, r, SEC, 11, { "estilo.alinhamento": "centro" }, `Rótulo ${r}`),
  ]);
  const galeria = (itens, l) => cont(0, 0, l, 80, { modo: "linha", espaco: 0 }, { "estilo.fundo": "#ffffff", "estilo.borda": "#bdbdbd", "estilo.larguraBorda": 1 }, "Galeria", [
    cont(0, 0, l - 22, 78, { modo: "linha", espaco: 0, margem: 2, alinhar: "centro" }, {}, "Itens da galeria", itens),
    cont(0, 0, 20, 78, { modo: "coluna", espaco: 2, alinhar: "centro", margem: 2 }, { "estilo.fundo": "#f3f3f3" }, "Rolagem", [
      cont(0, 0, 16, 22, {}, {}, "Rolar para cima", [icone(2, 5, 12, "setaCima", "#a0a0a0")]),
      cont(0, 0, 16, 22, {}, {}, "Rolar para baixo", [icone(2, 5, 12, "setaBaixo", TX)]),
      cont(0, 0, 16, 22, {}, {}, "Mais estilos", [icone(2, 5, 12, "mais", TX)]),
    ]),
  ]);
  const cinza = (l, a, nome, ic = "caixa") => cont(0, 0, l, a, {}, { "estilo.fundo": "#e8eef9", "estilo.borda": "#9db3d9", "estilo.larguraBorda": 1, "estilo.raio": 8, "estados.hover.fundo": "#d3e0f5" }, nome, [icone(l / 2 - 10, a / 2 - 10, 20, ic, cor)]);
  const grade2x2 = nomes => cont(0, 0, 100, 78, { modo: "linha", quebrar: true, espaco: 8, margem: 2 }, {}, "Grade 2×2", nomes.map((n, i) => cinza(44, 34, n, ["caixa", "elipse", "linha", "estrela"][i % 4])));
  /** Rodapé do grupo: nome centralizado + iniciador de caixa de diálogo. */
  const grupo = (nome, l, corpo, iniciador = true) => cont(0, 0, l, 104, { modo: "coluna", espaco: 2, alinhar: "centro" }, {}, `Grupo ${nome}`, [
    cont(0, 0, l, 80, { modo: "linha", espaco: 4 }, {}, `Comandos ${nome}`, corpo),
    cont(0, 0, l, 16, {}, {}, `Rodapé ${nome}`, [
      texto(0, 0, l - (iniciador ? 14 : 0), 16, nome, SEC, 12, { "estilo.alinhamento": "centro" }, `Nome do grupo ${nome}`),
      iniciador ? icone(l - 12, 3, 10, "setaDir", SEC, { "acessibilidade.ariaLabel": "Abrir caixa de diálogo" }, "Iniciador de diálogo") : null,
    ].filter(Boolean)),
  ]);
  return { grande, pequeno, pilha, so, linhaIcones, combo, amostra, galeria, cinza, grade2x2, grupo };
}

const gruposDeFaixa = () => {
  const F = pecasFaixa("#2b579a");
  const unico = (id, nome, desc, tags, raiz) => ({ id, nome, cat: "Grupos de faixa", desc, tags: ["faixa", "grupo", "ribbon", ...tags], raiz });
  return [
    unico("grupoGrandePequenos", "Grupo: botão grande + pequenos", "Como Área de Transferência: Colar grande e comandos pequenos ao lado", ["colar"],
      F.grupo("Área de Transferência", 150, [F.grande("colar", "Colar", { seta: true, l: 56 }), F.pilha([["cortar", "Recortar"], ["copiar", "Copiar"], ["pincel", "Pincel"]], 88)])),
    unico("grupoPilha3", "Grupo: três comandos empilhados", "Como Editando: Localizar, Substituir, Selecionar", ["empilhado"],
      F.grupo("Editando", 130, [F.pilha([["buscar", "Localizar", true], ["editar", "Substituir"], ["seta", "Selecionar", true]], 120)], false)),
    unico("grupoGrandesLado", "Grupo: comandos grandes lado a lado", "Como Adobe Acrobat: vários botões grandes", ["grande"],
      F.grupo("Ações", 300, [F.grande("documento", "Criar PDF e compartilhar o link", { l: 96 }), F.grande("enviar", "Criar PDF e compartilhar via e-mail", { l: 96 }), F.grande("editar", "Solicitar assinaturas", { l: 96 })], false)),
    unico("grupoFonte", "Grupo: combos + linha de ícones", "Como Fonte: nome e tamanho da fonte, depois negrito, itálico e outros", ["fonte", "combo"],
      F.grupo("Fonte", 230, [cont(0, 0, 222, 78, { modo: "coluna", espaco: 8 }, {}, "Fonte e tamanho", [
        cont(0, 0, 222, 24, { modo: "linha", espaco: 4 }, {}, "Linha da fonte", [F.combo(132, "Calibri (Corpo)", "Fonte"), F.combo(50, "11", "Tamanho"), F.so("md-format-size", "Aumentar fonte"), F.so("md-format-text-variant", "Reduzir fonte")]),
        F.linhaIcones([["md-format-bold", "Negrito", false], ["md-format-italic", "Itálico"], ["md-format-underline", "Sublinhado"], ["md-format-strikethrough", "Tachado"], ["md-format-color-highlight", "Realce"], ["md-format-color-text", "Cor da fonte"]], 222),
      ])])),
    unico("grupoGradeIcones", "Grupo: grade de ícones (2 linhas)", "Como Parágrafo: listas, recuos, alinhamento e espaçamento", ["parágrafo", "ícones"],
      F.grupo("Parágrafo", 170, [cont(0, 0, 164, 78, { modo: "coluna", espaco: 8 }, {}, "Parágrafo", [
        F.linhaIcones([["md-format-list-bulleted", "Marcadores"], ["md-format-list-numbered", "Numeração"], ["md-table-of-contents", "Lista de vários níveis"], ["md-format-indent-decrease", "Diminuir recuo"], ["md-format-indent-increase", "Aumentar recuo"]], 164),
        F.linhaIcones([["md-format-align-left", "Esquerda", true], ["md-format-align-center", "Centro"], ["md-format-align-right", "Direita"], ["md-format-align-justify", "Justificar"], ["md-format-line-spacing", "Espaçamento"]], 164),
      ])])),
    unico("grupoGaleria", "Grupo: galeria com rolagem", "Como Estilos: amostras com setas de rolagem e botão \"mais\"", ["galeria", "estilos"],
      F.grupo("Estilos", 300, [F.galeria([F.amostra(13, "Normal", "#ffffff", true), F.amostra(13, "Sem Espaço"), F.amostra(15, "Título 1"), F.amostra(17, "Título 2")], 296)])),
    unico("grupoGrandeGrade", "Grupo: botão grande + grade 2×2", "Como o mockup do PowerPoint: um botão grande e quatro menores em grade", ["grade", "estilos de forma"],
      F.grupo("Estilos de Forma", 210, [cont(0, 0, 78, 78, {}, { "estilo.fundo": "#e8eef9", "estilo.borda": "#9db3d9", "estilo.larguraBorda": 1, "estilo.raio": 12, "estados.hover.fundo": "#d3e0f5" }, "Botão grande", [icone(24, 24, 30, "md-shape", "#2b579a")]), F.grade2x2(["A", "B", "C", "D"])])),
  ];
};

/** Faixa estilo Word: título centralizado com acesso rápido, abas coloridas, grupos de estruturas diferentes. */
function faixaWord() {
  const COR = "#2b579a", TX = "#262626", SEC = "#6b6b6b", LIN = "#d6d6d6";
  const F = pecasFaixa(COR, TX, SEC);
  const abas = [["Arquivo", 58], ["Página Inicial", 94], ["Inserir", 54], ["Desenhar", 68], ["Design", 58], ["Layout", 56], ["Referências", 86], ["Correspondências", 118], ["Revisão", 62], ["Exibir", 52], ["Ajuda", 52]];
  const painelDe = { "Página Inicial": 0, "Inserir": 1 };
  const qat = (ic, cor = "#ffffff") => cont(0, 0, 26, 26, {}, { "estilo.raio": 4, "estados.hover.fundo": "#ffffff26" }, `Acesso rápido ${ic}`, [icone(4, 4, 18, ic, cor)]);
  const aba = ([r, l], i) => {
    const slug = r.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\W+/g, "_");
    const painel = painelDe[r];
    return botao(0, 0, l, 34, r, i === 1 ? "#f3f3f3" : "transparent", i === 1 ? COR : "#ffffff", "transparent", {
      "estilo.raio": 0, "estilo.tamanhoFonte": 13, "estados.hover.fundo": "#ffffff26", "estados.ativo.fundo": "#f3f3f3", "estados.ativo.cor": COR, "acessibilidade.role": "tab",
      eventos: painel === undefined ? [ev("onClick", "", "", `aba_${slug}`)] : [ev("onClick", "mostrarSo", `painel${painel}`, `aba_${slug}`), ev("onClick", "abrir", "corpo", "faixa_aberta")],
    });
  };
  const painel = (nome, i, filhos) => cont(0, 0, 960, 112, { modo: "linha", espaco: 8, margem: 4 }, {
    ref: `painel${i}`, "estilo.fundo": "#f3f3f3", "estilo.borda": LIN, "estilo.larguraBorda": 1, "acessibilidade.role": "tabpanel", "acessibilidade.ariaLabel": nome,
    ...comAbertura({ iniciaFechado: i !== 0, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "aparecer", fundoEscuro: false }),
  }, `Painel ${nome}`, filhos);
  const div = n => linha(0, 0, 1, 94, LIN, `Divisor ${n}`);
  const inicio = painel("Página Inicial", 0, [
    F.grupo("Área de Transf.", 150, [F.grande("colar", "Colar", { seta: true, l: 60 }), F.pilha([["cortar", "", false], ["copiar", "", false], ["pincel", "", false]], 28)]), div(1),
    F.grupo("Fonte", 230, [cont(0, 0, 222, 78, { modo: "coluna", espaco: 8 }, {}, "Fonte e tamanho", [
      cont(0, 0, 222, 24, { modo: "linha", espaco: 4 }, {}, "Linha da fonte", [F.combo(132, "Calibri (Corpo)", "Fonte"), F.combo(50, "11", "Tamanho"), F.so("md-format-size", "Aumentar fonte"), F.so("md-format-text-variant", "Reduzir fonte")]),
      F.linhaIcones([["md-format-bold", "Negrito", false], ["md-format-italic", "Itálico"], ["md-format-underline", "Sublinhado"], ["md-format-strikethrough", "Tachado"], ["md-format-color-highlight", "Realce"], ["md-format-color-text", "Cor da fonte"]], 222),
    ])]), div(2),
    F.grupo("Parágrafo", 160, [cont(0, 0, 156, 78, { modo: "coluna", espaco: 8 }, {}, "Parágrafo", [
      F.linhaIcones([["md-format-list-bulleted", "Marcadores"], ["md-format-list-numbered", "Numeração"], ["md-table-of-contents", "Lista de vários níveis"], ["md-format-indent-decrease", "Diminuir recuo"], ["md-format-indent-increase", "Aumentar recuo"]], 156),
      F.linhaIcones([["md-format-align-left", "Esquerda", true], ["md-format-align-center", "Centro"], ["md-format-align-right", "Direita"], ["md-format-align-justify", "Justificar"], ["md-format-line-spacing", "Espaçamento"]], 156),
    ])]), div(3),
    F.grupo("Estilos", 224, [F.galeria([F.amostra(12, "Normal", "#ffffff", true), F.amostra(12, "Sem Esp."), F.amostra(14, "Título 1")], 220)]), div(4),
    F.grupo("Editando", 104, [F.pilha([["buscar", "Localizar", true], ["editar", "Substituir"], ["seta", "Selecionar", true]], 102)], false),
  ]);
  const inserir = painel("Inserir", 1, [
    F.grupo("Tabelas", 80, [F.grande("grade", "Tabela", { seta: true, l: 70 })], true), div(1),
    F.grupo("Ilustrações", 330, [F.grande("imagem", "Imagens", { l: 70 }), F.grande("caixa", "Formas", { seta: true, l: 70 }), F.grande("estrela", "Ícones", { l: 70 }), F.grande("grafico", "Gráfico", { l: 70 })], true), div(2),
    F.grupo("Links", 130, [F.pilha([["link", "Link", true], ["editar", "Indicador"], ["voltar", "Referência cruzada"]], 124)], false),
  ]);
  return {
    id: "faixaWord", nome: "Faixa estilo Word", cat: "Menus", desc: "Título centralizado, abas, e grupos de estruturas diferentes (Área de Transferência, Fonte, Parágrafo, Estilos, Editando)", tags: ["ribbon", "word", "faixa", "office", "híbrido", "mockup"],
    raizes: [
      cont(0, 0, 960, 200, { modo: "coluna", espaco: 0, margem: 0, abracar: true }, { "estilo.fundo": "#f3f3f3", eventos: [ev("onContext", "abrir", "menuCtx", "menu_faixa_aberto")] }, "Faixa estilo Word", [
        cont(0, 0, 960, 34, {}, { "estilo.fundo": COR }, "Barra de título", [
          cont(10, 4, 190, 26, { modo: "linha", espaco: 2, alinhar: "centro" }, {}, "Acesso rápido", [qat("salvar"), qat("desfazer", "#9db3d6"), qat("setaBaixo", "#9db3d6"), qat("refazer", "#9db3d6"), qat("buscar"), qat("setaBaixo")]),
          texto(300, 8, 360, 20, "Documento1  -  Word", "#ffffff", 13, { "estilo.alinhamento": "centro" }, "Título do documento"),
          texto(780, 8, 170, 20, "Compartilhar", "#ffffff", 13, { "estilo.alinhamento": "direita" }, "Compartilhar"),
        ]),
        cont(0, 0, 960, 34, { modo: "linha", espaco: 0, margem: 0, alinhar: "centro" }, { "estilo.fundo": COR, "acessibilidade.role": "tablist" }, "Abas", [
          ...abas.map(aba), cont(0, 0, 190, 26, { modo: "linha", espaco: 6, alinhar: "centro", margem: 6 }, {}, "Diga-me", [icone(0, 0, 16, "info", "#ffffff"), texto(0, 0, 160, 18, "Diga-me o que deseja fazer", "#ffffff", 12, {}, "Rótulo Diga-me")]),
        ]),
        cont(0, 0, 960, 112, { modo: "coluna", espaco: 0, abracar: true }, {
          ref: "corpo", "acessibilidade.role": "region", "acessibilidade.ariaLabel": "Faixa de opções",
          ...comAbertura({ iniciaFechado: false, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "deslizar", fundoEscuro: false }),
        }, "Corpo da faixa", [
          inicio, inserir,
          botao(0, 0, 118, 22, "▲ Recolher", "transparent", SEC, "transparent", { "estilo.tamanhoFonte": 12, "estados.hover.fundo": "#0000000d", "estilo.raio": 4, "dimensao.largura": "abracar", eventos: [ev("onClick", "fechar", "corpo", "faixa_recolhida")] }),
        ]),
      ]),
      menuContextoFaixa(TX, SEC),
    ],
  };
}

function navegacaoResponsiva() {
  const link = r => botao(0, 0, 92, 34, r, "transparent", "#d1d5db", "transparent", { "estilo.peso": 500, "estados.hover.fundo": "#ffffff1a", "estilo.raio": 6 });
  const itemGaveta = r => botao(0, 0, 248, 40, r, "transparent", "#1f2937", "transparent", { "estilo.peso": 500, "estados.hover.fundo": "#f3f4f6", "estilo.raio": 6, "estilo.alinhamento": "esquerda", "dimensao.largura": "preencher" });
  return {
    id: "navResponsiva", nome: "Navegação responsiva", cat: "Menus", desc: "Links no desktop; no celular vira ícone ☰ que abre uma gaveta", tags: ["navbar", "hambúrguer", "responsivo", "gaveta"],
    raizes: [
      cont(0, 0, 960, 64, {}, { "estilo.fundo": "#111827", "restricoes.h": "ambos", "restricoes.v": "topo" }, "Barra de navegação", [
        cont(20, 16, 200, 32, { modo: "linha", espaco: 10, alinhar: "centro" }, { "restricoes.h": "esquerda" }, "Marca", [
          icone(0, 0, 26, "modelo", "#f9fafb"), texto(0, 0, 150, 24, "Minha marca", "#f9fafb", 17, { "estilo.peso": 600 }, "Nome da marca"),
        ]),
        cont(560, 15, 384, 34, { modo: "linha", espaco: 4, alinhar: "centro", justificar: "fim" }, { "restricoes.h": "direita", "responsivo.ocultarAbaixo": 768 }, "Links",
          ["Início", "Produtos", "Preços", "Contato"].map(link)),
        el("icone", 912, 18, 28, 28, { simbolo: "hamburguer", "estilo.cor": "#f9fafb", "restricoes.h": "direita", "responsivo.mostrarAbaixo": 768, "acessibilidade.ariaLabel": "Abrir menu",
          eventos: [ev("onClick", "abrir", "gaveta", "abriu_menu")] }, "Botão menu ☰"),
      ]),
      cont(0, 0, 280, 600, { modo: "coluna", espaco: 4, margem: 16, abracar: false },
        { ref: "gaveta", "estilo.fundo": "#ffffff", "estilo.sombra": "grande", "restricoes.h": "esquerda", "restricoes.v": "ambos", "acessibilidade.role": "dialog", "acessibilidade.ariaLabel": "Menu",
          ...comAbertura({ iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "lateral", fundoEscuro: true }) },
        "Gaveta de navegação", [
          texto(0, 0, 248, 28, "Menu", "#111827", 18, { "estilo.peso": 600 }, "Título da gaveta"),
          ...["Início", "Produtos", "Preços", "Contato"].map(itemGaveta),
        ]),
    ],
  };
}

function botaoComMenu() {
  const cores = { cor: "#1f2937", corSec: "#6b7280" };
  const itens = [["novo", "Novo", "Ctrl+N"], ["abrir", "Abrir…", "Ctrl+O"], ["salvar", "Salvar", "Ctrl+S"], ["exportar", "Exportar", ""]].map(l => itemMenu(208, l, cores));
  return {
    id: "botaoMenu", nome: "Botão com menu suspenso", cat: "Menus", desc: "Clique abre o menu; Esc, clique fora ou escolher um item fecha", tags: ["dropdown", "menu", "funcional"],
    raiz: cont(0, 0, 230, 180, {}, {}, "Botão com menu", [
      botao(0, 0, 140, 40, "Arquivo ▾", "#2563eb", "#ffffff", "#1d4ed8", { ref: "gatilho", eventos: [ev("onClick", "alternar", "menu", "abriu_menu_arquivo")] }),
      cont(0, 46, 220, 130, { modo: "coluna", espaco: 2, margem: 6, abracar: true },
        { ref: "menu", "estilo.fundo": "#ffffff", "estilo.borda": "#e5e7eb", "estilo.larguraBorda": 1, "estilo.raio": 8, "estilo.sombra": "media", "acessibilidade.role": "menu", ...comAbertura(ABERTURA_MENU) },
        "Menu Arquivo", itens.map(i => ({ ...i, p: { ...i.p, "estados.hover.fundo": "#f3f4f6", eventos: [ev("onClick", "", "", `menu_${i.nome.replace("Item ", "").toLowerCase().replace(/\W+/g, "_")}`)] } }))),
    ]),
  };
}

function abasComPaineis() {
  const nomes = ["Geral", "Aparência", "Avançado"];
  const aba = (r, i) => botao(0, 0, 120, 44, r, "transparent", "#4b5563", "transparent", {
    "estilo.raio": 0, "estilo.peso": 500, "estados.hover.fundo": "#0000000d", "estados.ativo.fundo": "#ffffff", "estados.ativo.cor": "#2563eb", "acessibilidade.role": "tab",
    eventos: [ev("onClick", "mostrarSo", `painel${i}`, `aba_${r.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`)],
  });
  const painel = (r, i) => cont(0, 0, 480, 196, {}, { ref: `painel${i}`, "acessibilidade.role": "tabpanel", "restricoes.h": "ambos", "restricoes.v": "ambos",
    ...comAbertura({ iniciaFechado: i > 0, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "aparecer", fundoEscuro: false }) }, `Painel ${r}`, [
    texto(20, 18, 440, 26, `Configurações: ${r}`, "#111827", 16, { "estilo.peso": 600 }, `Título ${r}`),
    texto(20, 52, 440, 60, `Conteúdo da aba ${r}. Troque por campos, listas ou o que precisar.`, "#4b5563", 14, { "estilo.entrelinha": 1.45 }, `Texto ${r}`),
  ]);
  return {
    id: "abasPaineis", nome: "Abas com painéis", cat: "Painéis", desc: "Cada aba mostra o seu painel; a ativa fica marcada", tags: ["tabs", "abas", "funcional"],
    raiz: cont(0, 0, 480, 240, { modo: "coluna", espaco: 0, margem: 0, alinhar: "esticar", abracar: false }, { "estilo.fundo": "#ffffff", "estilo.borda": "#e5e7eb", "estilo.larguraBorda": 1, "estilo.raio": 8 }, "Abas com painéis", [
      cont(0, 0, 480, 44, { modo: "linha", espaco: 0 }, { "estilo.fundo": "#f3f4f6", "acessibilidade.role": "tablist" }, "Abas", nomes.map(aba)),
      cont(0, 0, 480, 196, {}, { "dimensao.altura": "preencher" }, "Painéis", nomes.map(painel)),
    ]),
  };
}

// ---------- coleção de menus responsivos (padrões comuns de sites e apps, montados com os comportamentos do editor) ----------
const NAV = { escuro: "#0f172a", acento: "#2563eb", tx: "#111827", sec: "#6b7280", linha: "#e5e7eb", claro: "#f8fafc" };
const linkNav = (r, l = 100, cor = "#e5e7eb", p = {}) => botao(0, 0, l, 36, r, "transparent", cor, "transparent", { "estilo.peso": 500, "estados.hover.fundo": "#ffffff1a", "estilo.raio": 6, ...p });
const marcaNav = (cor = "#f9fafb") => cont(0, 0, 170, 32, { modo: "linha", espaco: 8, alinhar: "centro" }, {}, "Marca", [icone(0, 0, 24, "modelo", cor), texto(0, 0, 130, 22, "Minha marca", cor, 16, { "estilo.peso": 600 }, "Nome da marca")]);
const iconeBt = (ic, cor, nome, p = {}) => cont(0, 0, 36, 36, {}, { "estilo.raio": 8, "estados.hover.fundo": "#00000012", ...p }, nome, [icone(6, 6, 24, ic, cor)]);
const itemSimples = (ic, rot, l, cor = NAV.tx, p = {}) => cont(0, 0, l, 40, { modo: "linha", espaco: 10, alinhar: "centro", margem: 10 }, { "estilo.raio": 8, "estados.hover.fundo": "#00000010", ...p }, `Item ${rot}`, [
  icone(0, 0, 20, ic, cor), texto(0, 0, l - 60, 20, rot, cor, 14, { "estilo.peso": 500 }, `Rótulo ${rot}`)]);

function menuSubmenus() {
  const itensSub = [["lista", "Painel"], ["grafico", "Relatórios"], ["pasta", "Arquivos"], ["engrenagem", "Configurações"]].map(([ic, r]) => ({ ...itemMenu(220, [ic, r, ""], { cor: NAV.tx, corSec: NAV.sec }), p: { ...itemMenu(220, [ic, r, ""], { cor: NAV.tx, corSec: NAV.sec }).p, "estados.hover.fundo": "#f3f4f6" } }));
  return {
    id: "menuSubmenus", nome: "Menu horizontal com submenus", cat: "Menus", desc: "Barra com links; passar o mouse em \"Produtos\" abre o submenu, que fecha ao sair", tags: ["navbar", "dropdown", "hover", "submenu", "horizontal"],
    raiz: cont(0, 0, 960, 250, {}, {}, "Menu com submenus", [
      cont(0, 0, 960, 56, { modo: "linha", espaco: 4, margem: 12, alinhar: "centro" }, { "estilo.fundo": NAV.escuro }, "Barra", [
        marcaNav(), linkNav("Início"),
        linkNav("Produtos ▾", 100, "#e5e7eb", { ref: "gatilho", eventos: [ev("onHover", "abrir", "sub", "abriu_submenu"), ev("onLeave", "fechar", "sub", "fechou_submenu")] }),
        linkNav("Preços"), linkNav("Contato")]),
      cont(300, 58, 240, 170, { modo: "coluna", espaco: 2, margem: 6, abracar: true }, {
        ref: "sub", "estilo.fundo": "#ffffff", "estilo.borda": NAV.linha, "estilo.larguraBorda": 1, "estilo.raio": 8, "estilo.sombra": "media", "acessibilidade.role": "menu",
        ...comAbertura({ iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "aparecer", fundoEscuro: false }),
      }, "Submenu Produtos", itensSub),
    ]),
  };
}

function megaMenu() {
  const coluna = (titulo, links) => cont(0, 0, 190, 150, { modo: "coluna", espaco: 8 }, {}, `Coluna ${titulo}`, [
    texto(0, 0, 180, 18, titulo.toUpperCase(), NAV.sec, 11, { "estilo.peso": 600, "estilo.espacoLetras": 1 }, `Título ${titulo}`),
    ...links.map(l => texto(0, 0, 180, 20, l, NAV.tx, 14, { "estados.hover.cor": NAV.acento }, `Link ${l}`)),
  ]);
  return {
    id: "megaMenu", nome: "Mega menu", cat: "Menus", desc: "Clique em \"Soluções\" abre um painel largo com colunas de links e um destaque", tags: ["mega", "navbar", "colunas", "dropdown"],
    raiz: cont(0, 0, 960, 330, {}, {}, "Mega menu", [
      cont(0, 0, 960, 56, { modo: "linha", espaco: 4, margem: 12, alinhar: "centro" }, { "estilo.fundo": "#ffffff", "estilo.borda": NAV.linha, "estilo.larguraBorda": 1 }, "Barra", [
        marcaNav(NAV.tx), linkNav("Início", 80, NAV.tx, { "estados.hover.fundo": "#00000010" }),
        linkNav("Soluções ▾", 110, NAV.tx, { ref: "gatilho", "estados.hover.fundo": "#00000010", eventos: [ev("onClick", "alternar", "mega", "abriu_mega_menu")] }),
        linkNav("Recursos", 90, NAV.tx, { "estados.hover.fundo": "#00000010" }), linkNav("Preços", 80, NAV.tx, { "estados.hover.fundo": "#00000010" })]),
      cont(20, 58, 900, 230, { modo: "linha", espaco: 24, margem: 24 }, {
        ref: "mega", "estilo.fundo": "#ffffff", "estilo.borda": NAV.linha, "estilo.larguraBorda": 1, "estilo.raio": 12, "estilo.sombra": "grande", "acessibilidade.role": "menu",
        ...comAbertura({ iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "deslizar", fundoEscuro: false }),
      }, "Painel do mega menu", [
        coluna("Produtos", ["Painéis", "Relatórios", "Alertas", "Integrações"]),
        coluna("Empresa", ["Sobre nós", "Clientes", "Carreiras", "Contato"]),
        coluna("Recursos", ["Documentação", "Guias", "Comunidade", "Status"]),
        cont(0, 0, 230, 170, { modo: "coluna", espaco: 8, margem: 16, justificar: "fim" }, { "estilo.fundo": NAV.acento, "estilo.raio": 10 }, "Destaque", [
          texto(0, 0, 200, 22, "Novidade", "#bfdbfe", 12, { "estilo.peso": 600 }, "Selo"), texto(0, 0, 200, 50, "Conheça o novo painel de métricas", "#ffffff", 17, { "estilo.peso": 600 }, "Chamada"),
          botao(0, 0, 120, 34, "Saiba mais", "#ffffff", NAV.acento, "#ffffff"),
        ]),
      ]),
    ]),
  };
}

function menuLateralRecolhivel() {
  const ics = [["casa", "Início"], ["grafico", "Painéis"], ["calendario", "Agenda"], ["email", "Mensagens"], ["engrenagem", "Ajustes"]];
  const compacto = ic => cont(0, 0, 48, 44, {}, { "estilo.raio": 8, "estados.hover.fundo": "#ffffff1a" }, `Ícone ${ic}`, [icone(12, 10, 24, ic, "#cbd5e1")]);
  return {
    id: "menuLateralRecolhivel", nome: "Menu lateral recolhível", cat: "Menus", desc: "Barra lateral com ícones e rótulos; o botão ‹ recolhe para só ícones e › expande de volta", tags: ["sidebar", "lateral", "recolher", "ícones"],
    raiz: cont(0, 0, 250, 440, {}, {}, "Menu lateral", [
      cont(0, 0, 240, 440, { modo: "coluna", espaco: 4, margem: 12 }, { ref: "amplo", "estilo.fundo": NAV.escuro, "estilo.raio": 12, ...comAbertura({ iniciaFechado: false, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "aparecer", fundoEscuro: false }) }, "Menu expandido", [
        cont(0, 0, 216, 44, { modo: "linha", espaco: 8, alinhar: "centro", justificar: "entre" }, {}, "Topo", [marcaNav(),
          iconeBt("voltar", "#cbd5e1", "Recolher menu", { "estados.hover.fundo": "#ffffff1a", eventos: [ev("onClick", "fechar", "amplo", "menu_recolhido"), ev("onClick", "abrir", "estreito", "menu_compacto")] })]),
        ...ics.map(([ic, r], i) => itemSimples(ic, r, 216, i === 0 ? "#ffffff" : "#cbd5e1", { "estilo.fundo": i === 0 ? "#ffffff1f" : "transparent", "estados.hover.fundo": "#ffffff14" })),
      ]),
      cont(0, 0, 72, 440, { modo: "coluna", espaco: 4, margem: 12, alinhar: "centro" }, { ref: "estreito", "estilo.fundo": NAV.escuro, "estilo.raio": 12, ...comAbertura({ iniciaFechado: true, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "aparecer", fundoEscuro: false }) }, "Menu compacto", [
        iconeBt("avancar", "#cbd5e1", "Expandir menu", { "estados.hover.fundo": "#ffffff1a", eventos: [ev("onClick", "fechar", "estreito", "menu_recolhido"), ev("onClick", "abrir", "amplo", "menu_expandido")] }),
        ...ics.map(([ic]) => compacto(ic)),
      ]),
    ]),
  };
}

function menuAcordeao() {
  const secao = (titulo, ic, itens, i) => [
    botao(0, 0, 248, 44, `${titulo}`, "transparent", NAV.tx, "transparent", { "estilo.alinhamento": "esquerda", "estilo.peso": 600, "estados.hover.fundo": "#00000008", "estilo.raio": 8, "dimensao.largura": "preencher",
      eventos: [ev("onClick", "alternar", `corpo${i}`, `secao_${titulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}`)], "acessibilidade.ariaLabel": titulo }),
    cont(0, 0, 248, 100, { modo: "coluna", espaco: 2, margem: 4, abracar: true }, { ref: `corpo${i}`, ...comAbertura({ iniciaFechado: i > 0, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "deslizar", fundoEscuro: false }) }, `Itens ${titulo}`,
      itens.map(r => cont(0, 0, 232, 34, { modo: "linha", alinhar: "centro", margem: 16 }, { "estilo.raio": 6, "estados.hover.fundo": `${NAV.acento}14` }, `Item ${r}`, [texto(0, 0, 200, 18, r, NAV.sec, 14, {}, `Rótulo ${r}`)]))),
  ];
  return {
    id: "menuAcordeao", nome: "Menu lateral acordeão", cat: "Menus", desc: "Seções que abrem e fecham ao clicar no título, cada uma com seus itens", tags: ["acordeão", "sidebar", "seções", "lateral"],
    raiz: cont(0, 0, 280, 420, { modo: "coluna", espaco: 2, margem: 12, abracar: true }, { "estilo.fundo": "#ffffff", "estilo.borda": NAV.linha, "estilo.larguraBorda": 1, "estilo.raio": 12 }, "Menu acordeão", [
      ...secao("Projetos ▾", "pasta", ["Todos os projetos", "Favoritos", "Arquivados"], 0),
      ...secao("Equipe ▾", "usuario", ["Membros", "Funções", "Convites"], 1),
      ...secao("Conta ▾", "engrenagem", ["Perfil", "Cobrança", "Segurança"], 2),
    ]),
  };
}

function menuTelaCheia() {
  const grande = r => botao(0, 0, 400, 56, r, "transparent", "#ffffff", "transparent", { "estilo.tamanhoFonte": 32, "estilo.peso": 600, "estados.hover.cor": "#93c5fd", "estados.hover.fundo": "transparent", "estilo.alinhamento": "esquerda", "dimensao.largura": "preencher", eventos: [ev("onClick", "", "", `ir_${r.toLowerCase()}`)] });
  return {
    id: "menuTelaCheia", nome: "Menu em tela cheia", cat: "Menus", desc: "O ícone ☰ abre uma camada que cobre a página inteira; ✕ ou Esc fecham", tags: ["fullscreen", "overlay", "hambúrguer", "tela cheia"],
    raiz: cont(0, 0, 960, 540, {}, {}, "Menu em tela cheia", [
      cont(0, 0, 960, 64, { modo: "linha", alinhar: "centro", justificar: "entre", margem: 20 }, { "estilo.fundo": "#ffffff", "estilo.borda": NAV.linha, "estilo.larguraBorda": 1 }, "Barra", [
        marcaNav(NAV.tx), el("icone", 0, 0, 28, 28, { simbolo: "hamburguer", "estilo.cor": NAV.tx, "acessibilidade.ariaLabel": "Abrir menu", eventos: [ev("onClick", "abrir", "tela", "abriu_menu")] }, "Botão menu ☰")]),
      cont(0, 0, 960, 540, { modo: "coluna", espaco: 10, margem: 60, justificar: "centro" }, {
        ref: "tela", "estilo.fundo": "#0f172af2", "acessibilidade.role": "dialog", "acessibilidade.ariaLabel": "Menu",
        ...comAbertura({ iniciaFechado: true, fecharFora: false, fecharEsc: true, fecharAoEscolher: true, animacao: "aparecer", fundoEscuro: false }),
      }, "Camada do menu", [
        cont(0, 0, 840, 40, { modo: "linha", justificar: "fim" }, {}, "Topo da camada", [el("icone", 0, 0, 32, 32, { simbolo: "fechar", "estilo.cor": "#ffffff", "acessibilidade.ariaLabel": "Fechar menu", eventos: [ev("onClick", "fechar", "tela", "fechou_menu")] }, "Fechar ✕")]),
        ...["Início", "Produtos", "Sobre", "Contato"].map(grande),
      ]),
    ]),
  };
}


// ---------- efeitos de caixa (vidro, neon, OLED, flutuante, bento, carrossel, cartão expansível) ----------
const _sb = (x, y, blur, cor, espalhar = 0, tipo = "sombra") => ({ tipo, visivel: true, x, y, blur, espalhar, cor });
const _grad = (angulo, ...cores) => [{ tipo: "linear", visivel: true, opacidade: 1, cor: cores[0], angulo, paradas: cores.map((cor, i) => ({ pos: Math.round((i * 100) / (cores.length - 1)), cor, alfa: 1 })) }];
const _cx = (x, y, l, a, nome, p, filhos) => el("caixa", x, y, l, a, { "estilo.borda": "transparent", "estilo.larguraBorda": 0, ...p }, nome, filhos);
function modelosEfeitosCaixa() {
  const cat = "Efeitos de caixa";
  const fundoCor = (l, a) => _cx(0, 0, l, a, "Fundo colorido", { "estilo.raio": 16, "estilo.preenchimentos": _grad(135, "#7c3aed", "#06b6d4", "#f472b6") });
  const glass = { id: "fxVidro", nome: "Caixa de vidro fosco (Glassmorphism)", cat, desc: "Fundo translúcido com desfoque do que está atrás, como vidro jateado", tags: ["glass", "vidro", "blur", "transparência"],
    raiz: cont(0, 0, 340, 200, {}, {}, "Vidro fosco", [fundoCor(340, 200),
      _cx(40, 40, 260, 120, "Caixa de vidro", { "estilo.fundo": "#ffffff73", "estilo.borda": "#ffffff80", "estilo.larguraBorda": 1, "estilo.raio": 12, "estilo.vidro": 12, "estilo.efeitos": [_sb(0, 8, 32, "#1f268726")], "animacao.hover": "elevar" }, [
        texto(20, 44, 220, 32, "Glassmorphism", "#ffffff", 22, { "estilo.peso": 600, "estilo.alinhamento": "centro" }, "Título")])]) };
  const neon = { id: "fxNeon", nome: "Caixa neon (brilho)", cat, desc: "Borda iluminada e halo de luz que dão a impressão de emitir luz própria", tags: ["neon", "glow", "brilho", "luz"],
    raiz: cont(0, 0, 300, 160, {}, {}, "Neon", [_cx(0, 0, 300, 160, "Caixa neon", { "estilo.fundo": "#09090b", "estilo.borda": "#00f2fe", "estilo.larguraBorda": 1, "estilo.raio": 12, "estilo.cor": "#00f2fe", "estilo.efeitos": [_sb(0, 0, 20, "#00f2fe99"), _sb(0, 0, 14, "#00f2fe55", 0, "sombraInterna")], "animacao.hover": "brilho" }, [
      texto(20, 62, 260, 36, "Neon Pulse", "#00f2fe", 24, { "estilo.peso": 600, "estilo.alinhamento": "centro" }, "Título")])]) };
  const oled = { id: "fxOled", nome: "Caixa Dark OLED", cat, desc: "Preto puro com contraste vibrante e sombra profunda, para telas modernas", tags: ["oled", "dark", "preto", "escuro"],
    raiz: cont(0, 0, 300, 160, {}, {}, "OLED", [_cx(0, 0, 300, 160, "Caixa OLED", { "estilo.fundo": "#000000", "estilo.borda": "#27272a", "estilo.larguraBorda": 1, "estilo.raio": 12, "estilo.efeitos": [_sb(0, 25, 50, "#000000bf", -12)], "animacao.hover": "elevar" }, [
      texto(20, 40, 260, 30, "OLED Black", "#f4f4f5", 22, { "estilo.peso": 600, "estilo.alinhamento": "centro" }, "Título"),
      texto(20, 78, 260, 20, "Preto puro, contraste vibrante", "#a78bfa", 13, { "estilo.alinhamento": "centro" }, "Legenda")])]) };
  const tilt = { id: "fxTilt", nome: "Caixa 3D inclinada", cat, desc: "Caixa levemente girada com texto em relevo; ao passar o mouse cresce e flutua", tags: ["3d", "tilt", "inclinar", "profundidade"],
    raiz: cont(0, 0, 300, 180, {}, {}, "Tilt 3D", [_cx(30, 20, 240, 130, "Caixa 3D", { rotacao: -6, "estilo.preenchimentos": _grad(145, "#ffffff", "#e2e8f0"), "estilo.borda": "#cbd5e1", "estilo.larguraBorda": 1, "estilo.raio": 14, "estilo.efeitos": [_sb(14, 22, 28, "#0f172a40"), _sb(0, 1, 0, "#ffffffcc", 0, "sombraInterna")], "animacao.hover": "escala" }, [
      texto(20, 46, 200, 36, "Efeito 3D", "#0f172a", 24, { "estilo.peso": 700, "estilo.alinhamento": "centro", rotacao: 0 }, "Título")])]) };
  const parallax = { id: "fxParallax", nome: "Caixa em camadas (parallax)", cat, desc: "Fundo em gradiente, camada de formas e texto à frente, prontos para animar em profundidade", tags: ["parallax", "camadas", "profundidade"],
    raiz: cont(0, 0, 320, 180, {}, {}, "Parallax", [_cx(0, 0, 320, 180, "Moldura", { "estilo.raio": 14, "estilo.preenchimentos": _grad(45, "#ff007f", "#7f00ff") }, [
      el("elipse", 190, -30, 170, 170, { "estilo.fundo": "#ffffff2e", "estilo.borda": "transparent", "estilo.larguraBorda": 0 }, "Camada de fundo"),
      el("elipse", -40, 90, 130, 130, { "estilo.fundo": "#ffffff1f", "estilo.borda": "transparent", "estilo.larguraBorda": 0 }, "Camada do meio"),
      texto(20, 66, 280, 40, "Parallax", "#ffffff", 30, { "estilo.peso": 700, "estilo.alinhamento": "centro" }, "Texto à frente")])]) };
  const flut = { id: "fxFlutuante", nome: "Caixa flutuante (sombras em camadas)", cat, desc: "Sombras realistas em três camadas fazem a caixa parecer flutuar; sobe ao passar o mouse", tags: ["floating", "sombra", "elevação", "flutuar"],
    raiz: cont(0, 0, 320, 200, {}, {}, "Flutuante", [_cx(30, 20, 260, 130, "Caixa flutuante", { "estilo.fundo": "#ffffff", "estilo.raio": 14, "estilo.efeitos": [_sb(0, 5, 15, "#0000000d"), _sb(0, 15, 35, "#0000001a"), _sb(0, 50, 100, "#0000001a")], "animacao.hover": "elevar" }, [
      texto(20, 48, 220, 32, "Flutuando", "#0f172a", 22, { "estilo.peso": 600, "estilo.alinhamento": "centro" }, "Título")])]) };
  const bl = (x, y, l, a, t, f) => _cx(x, y, l, a, `Bloco ${t}`, { "estilo.fundo": f, "estilo.borda": "#e4e4e7", "estilo.larguraBorda": 1, "estilo.raio": 14, "animacao.hover": "elevar" }, [texto(16, 14, l - 32, 22, t, "#18181b", 15, { "estilo.peso": 600 }, `Título ${t}`)]);
  const bento = { id: "fxBento", nome: "Bento grid", cat, desc: "Quatro blocos de tamanhos diferentes que se encaixam, no estilo bento do iOS", tags: ["bento", "grade", "blocos", "ios"],
    raiz: cont(0, 0, 500, 192, {}, {}, "Bento grid", [bl(0, 0, 328, 192, "Grande", "#e0f2fe"), bl(340, 0, 160, 192, "Médio", "#f4f4f5"), ]) };
  bento.raiz = cont(0, 0, 524, 288, {}, {}, "Bento grid", [bl(0, 0, 340, 192, "Grande", "#e0f2fe"), bl(352, 0, 172, 192, "Médio", "#f4f4f5"), bl(0, 204, 168, 84, "Pequeno", "#f4f4f5"), bl(180, 204, 344, 84, "Longo", "#fee2e2")]);
  const card = n => _cx(0, 0, 140, 100, `Card ${n}`, { "estilo.fundo": "#f8fafc", "estilo.borda": "#cbd5e1", "estilo.larguraBorda": 1, "estilo.raio": 12, "animacao.hover": "elevar" }, [texto(12, 38, 116, 22, `Card ${n}`, "#334155", 15, { "estilo.alinhamento": "centro", "estilo.peso": 500 }, `Título ${n}`)]);
  const carrossel = { id: "fxCarrossel", nome: "Faixa de cards (carrossel)", cat, desc: "Fileira de cards lado a lado, pronta para virar carrossel", tags: ["carrossel", "cards", "faixa", "slider"],
    raiz: cont(0, 0, 640, 100, { modo: "linha", espaco: 16 }, {}, "Faixa de cards", [1, 2, 3, 4].map(card)) };
  const expand = { id: "fxExpansivel", nome: "Cartão que expande em tela cheia", cat, desc: "Clique no cartão e ele abre em tela cheia com animação; Fechar ou Esc voltam", tags: ["expansível", "cartão", "tela cheia", "funcional"],
    raiz: cont(0, 0, 320, 160, {}, {}, "Cartão expansível", [
      _cx(0, 0, 320, 120, "Cartão", { ref: "gatilho", "estilo.fundo": "#f4f4f5", "estilo.borda": "#e4e4e7", "estilo.larguraBorda": 1, "estilo.raio": 14, "animacao.hover": "escala", eventos: [ev("onClick", "abrir", "expandido", "abriu_cartao")] }, [
        texto(20, 48, 280, 24, "Clique para expandir", "#18181b", 16, { "estilo.peso": 600, "estilo.alinhamento": "centro" }, "Título")]),
      cont(0, 0, 960, 540, { modo: "coluna", espaco: 20, margem: 40 }, { ref: "expandido", "estilo.fundo": "#ffffff", "acessibilidade.role": "dialog",
        ...comAbertura({ iniciaFechado: true, fecharFora: false, fecharEsc: true, fecharAoEscolher: false, animacao: "crescer", fundoEscuro: false }) }, "Cartão expandido", [
        cont(0, 0, 880, 40, { modo: "linha", justificar: "fim" }, {}, "Topo", [botao(0, 0, 100, 36, "Fechar", "#18181b", "#ffffff", "#18181b", { "estilo.raio": 6, eventos: [ev("onClick", "fechar", "expandido", "fechou_cartao")] })]),
        texto(0, 0, 880, 40, "Conteúdo cinematográfico", "#18181b", 30, { "estilo.peso": 700 }, "Título expandido")]),
    ]) };
  return [glass, neon, oled, tilt, parallax, flut, bento, carrossel, expand];
}

function barraAbasInferior() {
  const aba = ([ic, r], i) => cont(0, 0, 70, 56, { modo: "coluna", espaco: 2, alinhar: "centro", margem: 6 }, { "estilo.raio": 10, "estados.hover.fundo": "#00000008", eventos: [ev("onClick", "", "", `aba_${r.toLowerCase()}`)] }, `Aba ${r}`, [
    icone(0, 0, 24, ic, i === 0 ? NAV.acento : NAV.sec), texto(0, 0, 66, 14, r, i === 0 ? NAV.acento : NAV.sec, 11, { "estilo.alinhamento": "centro", "estilo.peso": i === 0 ? 600 : 400 }, `Rótulo ${r}`)]);
  return {
    id: "barraAbasInferior", nome: "Barra de abas inferior", cat: "Barras", desc: "Navegação do celular: 5 ícones com rótulo no rodapé, a aba atual em destaque", tags: ["mobile", "tab bar", "rodapé", "app"],
    raiz: cont(0, 0, 390, 72, { modo: "linha", espaco: 4, margem: 8, alinhar: "centro", justificar: "entre" }, { "estilo.fundo": "#ffffff", "estilo.borda": NAV.linha, "estilo.larguraBorda": 1, "estilo.sombra": "media" }, "Barra de abas",
      [["casa", "Início"], ["buscar", "Buscar"], ["mais", "Novo"], ["sino", "Avisos"], ["usuario", "Perfil"]].map(aba)),
  };
}

function menuRadial() {
  const redondo = (ic, r, x, y) => cont(x, y, 44, 44, {}, { "estilo.fundo": "#ffffff", "estilo.raio": 22, "estilo.sombra": "media", "estados.hover.fundo": "#eff6ff", "estilo.borda": NAV.linha, "estilo.larguraBorda": 1, eventos: [ev("onClick", "", "", `radial_${r}`)], "acessibilidade.ariaLabel": r }, `Opção ${r}`, [icone(10, 10, 24, ic, NAV.acento)]);
  return {
    id: "menuRadial", nome: "Menu radial", cat: "Menus", desc: "Botão redondo que abre as opções em leque ao redor; clique de novo fecha", tags: ["radial", "fab", "leque", "circular"],
    raiz: cont(0, 0, 270, 240, {}, {}, "Menu radial", [
      cont(0, 0, 270, 160, {}, { ref: "leque", ...comAbertura({ iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "crescer", fundoEscuro: false }) }, "Leque de opções", [
        redondo("casa", "inicio", 10, 122), redondo("buscar", "buscar", 48, 69), redondo("estrela", "favoritos", 115, 57), redondo("engrenagem", "ajustes", 174, 92)]),
      cont(106, 150, 58, 58, {}, { "estilo.fundo": NAV.acento, "estilo.raio": 29, "estilo.sombra": "grande", "estados.hover.fundo": "#1d4ed8", ref: "gatilho", eventos: [ev("onClick", "alternar", "leque", "alternou_radial")], "acessibilidade.ariaLabel": "Abrir opções" }, "Botão central", [icone(15, 15, 28, "mais", "#ffffff")]),
    ]),
  };
}

function menuDrillDown() {
  const linha2 = (r, ev2, seta = false) => cont(0, 0, 296, 44, { modo: "linha", alinhar: "centro", justificar: "entre", margem: 14 }, { "estilo.raio": 8, "estados.hover.fundo": "#00000008", eventos: ev2 ? [ev2] : [ev("onClick", "", "", `ir_${r.toLowerCase()}`)] }, `Item ${r}`, [
    texto(0, 0, 220, 20, r, NAV.tx, 15, { "estilo.peso": 500 }, `Rótulo ${r}`), seta ? icone(0, 0, 18, "setaDir", NAV.sec) : null].filter(Boolean));
  const painel = (nome, i, filhos) => cont(0, 0, 320, 400, { modo: "coluna", espaco: 2, margem: 12, abracar: false }, { ref: `nivel${i}`, ...comAbertura({ iniciaFechado: i > 0, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "aparecer", fundoEscuro: false }) }, nome, filhos);
  return {
    id: "menuDrillDown", nome: "Menu drill-down (mobile)", cat: "Menus", desc: "Lista em níveis: tocar num item com › abre a segunda tela, com \"‹ Voltar\" para o nível anterior", tags: ["mobile", "níveis", "drill-down", "submenu"],
    raiz: cont(0, 0, 320, 400, {}, { "estilo.fundo": "#ffffff", "estilo.borda": NAV.linha, "estilo.larguraBorda": 1, "estilo.raio": 14 }, "Menu em níveis", [
      painel("Nível 1", 0, [texto(0, 0, 296, 28, "Menu", NAV.tx, 20, { "estilo.peso": 700 }, "Título"),
        linha2("Início"), linha2("Produtos", ev("onClick", "mostrarSo", "nivel1", "abriu_produtos"), true), linha2("Preços"), linha2("Suporte", ev("onClick", "mostrarSo", "nivel1", "abriu_suporte"), true), linha2("Contato")]),
      painel("Nível 2", 1, [
        cont(0, 0, 296, 40, { modo: "linha", espaco: 6, alinhar: "centro", margem: 8 }, { "estilo.raio": 8, "estados.hover.fundo": "#00000008", eventos: [ev("onClick", "mostrarSo", "nivel0", "voltou_nivel1")] }, "Voltar", [icone(0, 0, 18, "voltar", NAV.acento), texto(0, 0, 120, 20, "Voltar", NAV.acento, 15, { "estilo.peso": 600 }, "Rótulo Voltar")]),
        texto(0, 0, 296, 28, "Produtos", NAV.tx, 20, { "estilo.peso": 700 }, "Título nível 2"),
        linha2("Painéis"), linha2("Relatórios"), linha2("Alertas"), linha2("Integrações")]),
    ]),
  };
}

function menuBlocos() {
  const bloco = (r, ic, cor) => cont(0, 0, 232, 130, { modo: "coluna", espaco: 10, margem: 18, justificar: "centro" }, { "estilo.fundo": cor, "estilo.raio": 12, "estados.hover.sombra": "grande", "estados.hover.fundo": `${cor}dd`, eventos: [ev("onClick", "", "", `ir_${r.toLowerCase()}`)] }, `Bloco ${r}`, [
    icone(0, 0, 32, ic, "#ffffff"), texto(0, 0, 190, 24, r, "#ffffff", 18, { "estilo.peso": 600 }, `Rótulo ${r}`)]);
  return {
    id: "menuBlocos", nome: "Menu em blocos coloridos", cat: "Menus", desc: "Quatro blocos grandes e coloridos como atalhos; destacam ao passar o mouse", tags: ["blocos", "tiles", "atalhos", "colorido"],
    raiz: cont(0, 0, 960, 150, { modo: "linha", espaco: 12, margem: 10, alinhar: "centro" }, { "estilo.fundo": NAV.claro, "estilo.raio": 14 }, "Menu em blocos",
      [["Painéis", "grafico", "#2563eb"], ["Equipe", "usuario", "#7c3aed"], ["Agenda", "calendario", "#059669"], ["Ajustes", "engrenagem", "#ea580c"]].map(([r, ic, c]) => bloco(r, ic, c))),
  };
}

function menuPorPerfil() {
  const aba = (r, p = {}, ac = {}) => linkNav(r, 120, NAV.tx, { "estados.hover.fundo": "#0000000d", "estilo.raio": 6, eventos: [ev("onClick", "", "", "menu_" + r.replace(/&/g, "").toLowerCase())], ...Object.fromEntries(Object.entries(ac).map(([k, v]) => ["acessibilidade." + k, v])), ...p });
  return {
    id: "menuPorPerfil", nome: "Barra com teclas de acesso e perfis", cat: "Barras", desc: "Alt+letra aciona cada item (&Arquivo, &Editar); \"Relatórios\" aparece só para admin/gestor; \"Exportar\" está indisponível com motivo. Na Prévia use \"Ver como\"", tags: ["perfil", "permissão", "atalho", "alt", "indisponível", "menu do sistema"],
    raiz: cont(0, 0, 960, 52, { modo: "linha", espaco: 4, margem: 10, alinhar: "centro" }, { "estilo.fundo": "#ffffff", "estilo.borda": NAV.linha, "estilo.larguraBorda": 1 }, "Barra por perfil", [
      aba("&Arquivo"), aba("&Editar"), aba("E&xibir"),
      aba("&Relatórios", {}, { perfis: "admin, gestor" }),
      aba("&Administração", {}, { perfis: "admin" }),
      aba("Ex&portar", {}, { indisponivel: true, motivo: "Indisponível: aguardando aprovação do gestor" }),
    ]),
  };
}

function barraComBusca() {
  return {
    id: "barraComBusca", nome: "Barra com busca", cat: "Barras", desc: "Marca, links, campo de busca e avatar na mesma barra; no celular os links viram ícone ☰", tags: ["navbar", "busca", "avatar", "responsivo"],
    raiz: cont(0, 0, 960, 64, { modo: "linha", espaco: 14, margem: 16, alinhar: "centro" }, { "estilo.fundo": "#ffffff", "estilo.borda": NAV.linha, "estilo.larguraBorda": 1, "estilo.sombra": "pequena" }, "Barra com busca", [
      marcaNav(NAV.tx),
      cont(0, 0, 300, 32, { modo: "linha", espaco: 4 }, { "responsivo.ocultarAbaixo": 768 }, "Links", ["Início", "Produtos", "Preços"].map(r => linkNav(r, 90, NAV.tx, { "estados.hover.fundo": "#00000010" }))),
      cont(0, 0, 260, 38, { modo: "linha", espaco: 8, alinhar: "centro", margem: 10 }, { "estilo.fundo": "#f3f4f6", "estilo.raio": 19, "dimensao.largura": "preencher", "estados.hover.fundo": "#e5e7eb" }, "Busca", [
        icone(0, 0, 18, "buscar", NAV.sec), texto(0, 0, 200, 18, "Buscar…", NAV.sec, 14, {}, "Texto da busca")]),
      iconeBt("sino", NAV.tx, "Avisos"),
      cont(0, 0, 36, 36, {}, { "estilo.fundo": NAV.acento, "estilo.raio": 18 }, "Avatar", [icone(8, 8, 20, "usuario", "#ffffff")]),
    ]),
  };
}



// ---------- botões com acabamento de designer: relevo, 3D, neumorfismo, neon, vidro, gradiente, ondulação ----------
function modelosBotoes() {
  /** Linha de botões: cada item é [rótulo, efeito, cor base, cor de destaque?]. */
  const fila = (id, nome, desc, tags, painel, itens, extra = {}) => ({
    id, nome, cat: "Botões", desc, tags: ["botão", ...tags],
    raiz: cont(0, 0, 100, 100, { modo: "linha", espaco: 22, margem: 30, alinhar: "centro", abracar: true },
      { "estilo.fundo": painel, "estilo.raio": 14, "estilo.borda": "transparent", "estilo.larguraBorda": 0, ...extra }, nome,
      itens.map(([rotulo, efeito, base, acento, l = 150]) => botao(0, 0, l, 52, rotulo, base, "#ffffff", base, {
        "estilo.raio": 10, "estilo.tamanhoFonte": 15, "estilo.peso": 600, ...propsEfeitoBotao(efeito, base, acento ?? base),
        eventos: [ev("onClick", "", "", `botao_${efeito}`)],
      }))),
  });
  return [
    fila("botoesRelevo", "Botões em relevo e 3D", "Bisel, tecla 3D, gradiente brilhante e elevado — todos afundam ao clicar", ["relevo", "3d", "bisel"], "#e5e7eb",
      [["Relevo", "relevo", "#2563eb"], ["3D", "tridimensional", "#16a34a"], ["Brilhante", "brilhante", "#7c3aed"], ["Elevado", "elevado", "#ea580c"]]),
    fila("botoesNeumorficos", "Botões neumórficos", "Saliência e afundamento suaves no mesmo tom do fundo", ["neumorfismo", "soft"], "#e0e5ec",
      [["Saliente", "neumorfico", "#e0e5ec"], ["Afundado", "afundado", "#e0e5ec"], ["Saliente", "neumorfico", "#e0e5ec"]]),
    fila("botoesNeon", "Botões neon e brilho", "Contorno e halo de luz em fundo escuro", ["neon", "glow", "escuro"], "#0b1020",
      [["Ciano", "neon", "#0b1020", "#22d3ee"], ["Magenta", "neon", "#0b1020", "#f43f5e"], ["Brilho", "brilho", "#7c3aed", "#a78bfa"], ["Contorno", "contorno", "#0b1020", "#34d399"]]),
    fila("botoesVidro", "Botões de vidro", "Translúcidos sobre um fundo colorido (glassmorphism)", ["vidro", "glass"], "#4f46e5",
      [["Entrar", "vidro", "#ffffff"], ["Criar conta", "vidro", "#ffffff"], ["Saiba mais", "contorno", "#4f46e5", "#ffffff"]],
      { "estilo.preenchimentos": [{ tipo: "linear", visivel: true, opacidade: 1, cor: "#4f46e5", angulo: 135, paradas: [{ pos: 0, cor: "#4f46e5", alfa: 1 }, { pos: 55, cor: "#9333ea", alfa: 1 }, { pos: 100, cor: "#ec4899", alfa: 1 }] }] }),
    fila("botoesAcao", "Botões de ação (primário, secundário, perigo)", "Conjunto de ações com ondulação ao clicar", ["ação", "primário", "perigo", "ondulação"], "#ffffff",
      [["Salvar", "ondulacao", "#2563eb"], ["Cancelar", "contorno", "#ffffff", "#475569"], ["Excluir", "ondulacao", "#dc2626"]],
      { "estilo.borda": "#e5e7eb", "estilo.larguraBorda": 1, "estilo.sombra": "pequena" }),
    fila("botoesPilula", "Botões pílula com degradê", "Cantos redondos, degradê e halo na cor do botão", ["pílula", "gradiente"], "#0f172a",
      [["Começar", "pilula", "#2563eb"], ["Explorar", "pilula", "#db2777"], ["Assinar", "pilula", "#059669"]]),
    fila("botoesPulso", "Botões com pulso", "Crescem ao passar o mouse e pulsam ao clicar", ["pulso", "animação"], "#f8fafc",
      [["Chamar", "pulso", "#0891b2"], ["Ao vivo", "pulso", "#e11d48"], ["Novo", "pulso", "#7c3aed"]],
      { "estilo.borda": "#e2e8f0", "estilo.larguraBorda": 1 }),
  ];
}

const DEFINICOES = [
  ...criarModelosSistemas({ cont, texto, botao, linha, comAbertura, ev, el, icone }),
  ...criarModelosReferencia({ cont, botao, texto, icone, el, formas: FORMAS }),
  navegacaoResponsiva(),
  menuSubmenus(),
  megaMenu(),
  menuLateralRecolhivel(),
  menuAcordeao(),
  menuTelaCheia(),
  ...modelosEfeitosCaixa(),
  menuRadial(),
  menuDrillDown(),
  menuBlocos(),
  ...modelosBotoes(),
  barraAbasInferior(),
  barraComBusca(),
  menuPorPerfil(),
  criarFaixaAxiom({ cont, texto, botao, linha, comAbertura, ev }),
  botaoComMenu(),
  abasComPaineis(),
  {
    id: "barraMenus", nome: "Barra de menus", cat: "Menus", desc: "Arquivo, Editar, Exibir… em uma linha", tags: ["menu", "menubar"],
    raiz: cont(0, 0, 960, 30, { modo: "linha", espaco: 0, margem: 0, alinhar: "centro" }, { "estilo.fundo": "#2b2b2b", "estilo.borda": "#1a1a1a", "estilo.larguraBorda": 1 }, "Barra de menus",
      ["Arquivo", "Editar", "Inserir", "Camada", "Selecionar", "Exibir", "Janela", "Ajuda"].map(m => texto(0, 0, 84, 18, m, "#e5e5e5", 13, { "estilo.alinhamento": "centro" }, `Menu ${m}`))),
  },
  modeloMenu("menuSuspenso", "Menu suspenso", "Itens com ícone, atalho e separadores", {
    largura: 260, fundo: "#2f2f2f", cor: "#ececec", corSec: "#a3a3a3", sep: "#454545", destaque: "Abrir…",
    linhas: [["novo", "Novo", "Ctrl+N"], ["abrir", "Abrir…", "Ctrl+O"], ["salvar", "Salvar", "Ctrl+S"], "-", ["exportar", "Exportar", "▸"], ["imprimir", "Imprimir…", "Ctrl+P"], "-", ["sair", "Sair", "Alt+F4"]],
  }),
  modeloMenu("menuContexto", "Menu de contexto", "Clique com o botão direito: recortar, copiar, colar", {
    largura: 220, fundo: "#ffffff", cor: "#1f2937", corSec: "#6b7280", sep: "#e5e7eb",
    linhas: [["cortar", "Recortar", "Ctrl+X"], ["copiar", "Copiar", "Ctrl+C"], ["colar", "Colar", "Ctrl+V"], "-", ["duplicar", "Duplicar", "Ctrl+D"], ["excluir", "Excluir", "Del", true]],
  }),
  faixaDeOpcoes(),
  officeCompleto(),
  faixaHibrida({ id: "faixaHibrida", nome: "Faixa de opções híbrida", desc: "Abas + faixa que recolhe (▲) e menu de botão direito, como no PowerPoint", cor: "#b7472a" }),
  faixaPowerPoint(),
  faixaWord(),
  ...gruposDeFaixa(),
  faixaHibrida({ id: "faixaHibridaRecolhida", nome: "Faixa híbrida (começa recolhida)", desc: "Só as abas; clique numa aba para abrir a faixa; botão direito abre o menu", cor: "#0f6cbd", iniciaRecolhida: true }),
  modeloMenu("menuArquivoOffice", "Menu Arquivo (Office)", "Informações, Novo, Abrir, Salvar, Imprimir, Compartilhar, Exportar, Fechar e Opções", {
    largura: 260, fundo: "#ffffff", sep: "#e0e0e0", cor: "#1b1b1b", corSec: "#616161", destaque: "Informações",
    linhas: [["info", "Informações"], ["novo", "Novo", "Ctrl+N"], ["abrir", "Abrir", "Ctrl+O"], "-", ["salvar", "Salvar", "Ctrl+S"], ["exportar", "Salvar como", "F12"], ["imprimir", "Imprimir", "Ctrl+P"], ["compartilhar", "Compartilhar"], ["baixar", "Exportar"], "-", ["engrenagem", "Opções"], ["sair", "Fechar"]],
  }),
  barraDeIcones("barraFerramentas", "Barra de ferramentas", "Ícones agrupados com separadores", {
    fundo: "#f3f4f6", cor: "#374151", ativo: "seta", borda: "#d1d5db", grupos: [["seta", "mao", "zoom"], ["caixa", "elipse", "linha", "texto"], ["contaGotas"]],
  }),
  barraDeIcones("barraFlutuante", "Barra flutuante", "Pílula escura com sombra, estilo moderno", {
    fundo: "#111827", cor: "#f9fafb", ativo: "pincel", raio: 23, sombra: "grande", grupos: [["seta", "pincel", "texto", "imagem"], ["desfazer", "refazer"]],
  }),
  barraDeIcones("trilho", "Trilho lateral", "Coluna de ícones para navegação", {
    vertical: true, fundo: "#1f2937", cor: "#e5e7eb", ativo: "casa", raio: 0, tam: 22, lado: 44, grupos: [["casa", "buscar", "grafico", "calendario"], ["engrenagem", "usuario"]],
  }),
  {
    id: "barraApp", nome: "Barra superior", cat: "Barras", desc: "Logo, título, busca, notificações e perfil", tags: ["app bar", "cabeçalho"],
    raiz: cont(0, 0, 960, 56, {}, { "estilo.fundo": "#ffffff", "estilo.borda": "#e5e7eb", "estilo.larguraBorda": 1, "estilo.sombra": "pequena" }, "Barra superior", [
      cont(16, 12, 220, 32, { modo: "linha", espaco: 12, alinhar: "centro" }, {}, "Marca", [
        icone(0, 0, 24, "hamburguer", "#374151"),
        texto(0, 0, 160, 24, "Meu sistema", "#111827", 17, { "estilo.peso": 600 }, "Título do sistema"),
      ]),
      el("campo", 330, 10, 300, 36, { placeholder: "Buscar…", "estilo.raio": 18, "estilo.fundo": "#f3f4f6", "estilo.borda": "#e5e7eb" }, "Campo de busca"),
      cont(856, 12, 90, 32, { modo: "linha", espaco: 16, alinhar: "centro" }, {}, "Ações", [icone(0, 0, 24, "sino", "#374151"), icone(0, 0, 28, "usuario", "#374151")]),
    ]),
  },
  {
    id: "abas", nome: "Barra de abas", cat: "Barras", desc: "Abas de texto com marcador na ativa", tags: ["tabs", "abas"],
    raiz: cont(0, 0, 480, 42, {}, {}, "Barra de abas", [
      cont(0, 0, 480, 40, { modo: "linha", espaco: 0, alinhar: "centro" }, {}, "Abas",
        ["Geral", "Aparência", "Atalhos", "Avançado"].map((a, i) => texto(0, 0, 120, 20, a, i === 0 ? "#2563eb" : "#6b7280", 14, { "estilo.alinhamento": "centro", "estilo.peso": i === 0 ? 600 : 400 }, `Aba ${a}`))),
      linha(0, 41, 480, 1, "#e5e7eb", "Linha de base"),
      linha(0, 38, 120, 3, "#2563eb", "Marcador da aba ativa"),
    ]),
  },
  {
    id: "barraStatus", nome: "Barra de status", cat: "Barras", desc: "Mensagem à esquerda, indicadores à direita", tags: ["status", "rodapé"],
    raiz: cont(0, 0, 960, 26, {}, { "estilo.fundo": "#e7e9ef", "estilo.borda": "#d2d6df", "estilo.larguraBorda": 1 }, "Barra de status", [
      texto(10, 4, 360, 18, "Pronto.", "#5a6274", 12, {}, "Mensagem de status"),
      cont(770, 0, 180, 26, { modo: "linha", espaco: 8, margem: 4, alinhar: "centro" }, {}, "Indicadores", [
        icone(0, 0, 16, "check", "#2f7d4f"), texto(0, 0, 60, 18, "Salvo", "#5a6274", 12, {}, "Estado de salvamento"),
        texto(0, 0, 60, 18, "100%", "#5a6274", 12, { "estilo.alinhamento": "direita" }, "Zoom"),
      ]),
    ]),
  },
  {
    id: "painelProps", nome: "Painel de propriedades", cat: "Painéis", desc: "Título, campos e um interruptor em coluna", tags: ["painel", "inspetor", "formulário"],
    raiz: cont(0, 0, 280, 300, { modo: "coluna", espaco: 6, margem: 14, abracar: true }, { "estilo.fundo": "#ffffff", "estilo.borda": "#e5e7eb", "estilo.larguraBorda": 1, "estilo.raio": 8 }, "Painel de propriedades", [
      cont(0, 0, 252, 24, { modo: "linha", espaco: 8, alinhar: "centro" }, {}, "Cabeçalho", [
        icone(0, 0, 16, "propriedades", "#96570f"), texto(0, 0, 200, 20, "PROPRIEDADES", "#5a6274", 12, { "estilo.peso": 600 }, "Título do painel"),
      ]),
      texto(0, 0, 252, 18, "Nome", "#5a6274", 12, {}, "Rótulo Nome"),
      el("campo", 0, 0, 252, 32, { placeholder: "Elemento", rotuloCampo: "Nome" }, "Campo Nome"),
      cont(0, 0, 252, 54, { modo: "linha", espaco: 12 }, {}, "Tamanho", [
        cont(0, 0, 120, 54, { modo: "coluna", espaco: 4 }, {}, "Largura", [texto(0, 0, 120, 18, "Largura", "#5a6274", 12, {}, "Rótulo Largura"), el("campo", 0, 0, 120, 32, { placeholder: "160" }, "Campo Largura")]),
        cont(0, 0, 120, 54, { modo: "coluna", espaco: 4 }, {}, "Altura", [texto(0, 0, 120, 18, "Altura", "#5a6274", 12, {}, "Rótulo Altura"), el("campo", 0, 0, 120, 32, { placeholder: "40" }, "Campo Altura")]),
      ]),
      cont(0, 0, 252, 32, {}, {}, "Visível", [texto(0, 6, 180, 20, "Visível", "#1f2937", 14, {}, "Rótulo Visível"), el("toggle", 200, 2, 52, 28, { ligado: true, "estilo.fundo": "#96570f" }, "Interruptor Visível")]),
      botao(0, 0, 252, 36, "Aplicar", "#96570f", "#ffffff"),
    ]),
  },
  {
    id: "dialogo", nome: "Caixa de diálogo", cat: "Diálogos", desc: "Título, mensagem e dois botões", tags: ["modal", "confirmação"],
    raiz: cont(0, 0, 400, 196, {}, { "estilo.fundo": "#ffffff", "estilo.borda": "#e5e7eb", "estilo.larguraBorda": 1, "estilo.raio": 10, "estilo.sombra": "grande" }, "Caixa de diálogo", [
      icone(20, 22, 22, "alerta", "#a35a00"),
      texto(52, 20, 320, 26, "Descartar alterações?", "#111827", 17, { "estilo.peso": 600 }, "Título do diálogo"),
      texto(20, 60, 360, 60, "O projeto tem mudanças que ainda não foram salvas. Se continuar, elas serão perdidas.", "#4b5563", 14, { "estilo.entrelinha": 1.45 }, "Mensagem do diálogo"),
      cont(176, 140, 208, 36, { modo: "linha", espaco: 8 }, {}, "Botões", [
        botao(0, 0, 100, 36, "Cancelar", "#ffffff", "#1f2937", "#d1d5db"),
        botao(0, 0, 100, 36, "Descartar", "#dc2626", "#ffffff"),
      ]),
    ]),
  },
  {
    id: "notificacoes", nome: "Lista de notificações", cat: "Painéis", desc: "Itens com ícone e horário, em coluna", tags: ["lista", "notificações"],
    raiz: cont(0, 0, 320, 240, { modo: "coluna", espaco: 4, margem: 14, abracar: true }, { "estilo.fundo": "#ffffff", "estilo.borda": "#e5e7eb", "estilo.larguraBorda": 1, "estilo.raio": 10, "estilo.sombra": "media" }, "Lista de notificações", [
      texto(0, 0, 200, 24, "Notificações", "#111827", 15, { "estilo.peso": 600 }, "Título das notificações"),
      ...[["email", "Nova mensagem de Ana", "agora"], ["calendario", "Reunião às 15h", "10 min"], ["check", "Exportação concluída", "1 h"]].map(([ic, t, hr], i) =>
        cont(0, 0, 292, 52, {}, { "estilo.fundo": i === 0 ? "#eff6ff" : "transparent", "estilo.raio": 6 }, `Notificação ${i + 1}`, [
          icone(10, 14, 22, ic, "#2563eb"), texto(44, 8, 230, 20, t, "#1f2937", 14, {}, `Texto ${i + 1}`), texto(44, 28, 230, 18, hr, "#9ca3af", 12, {}, `Horário ${i + 1}`),
        ])),
    ]),
  },
];

/** Converte a árvore de um modelo pronto para elementos completos com `pai`.
 *  `p.ref` dá um nome fixo à peça, para eventos de outras peças apontarem para ela. */
function achatar(raizes) {
  const elementos = [];
  let seq = 0;
  const visitar = (no, ox, oy, pai) => {
    const def = CATALOGO[no.tipo];
    if (!def) throw new Error(`Modelo com tipo desconhecido: ${no.tipo}`);
    const ref = no.p?.ref ?? `m${seq++}`;
    const novo = { ...def.padrao(), tipo: no.tipo, x: ox + no.x, y: oy + no.y, largura: no.largura, altura: no.altura };
    for (const [c, v] of Object.entries(no.p ?? {})) if (c !== "ref") por(novo, c, v);
    if (no.nome) novo.nome = no.nome;
    if (pai) novo.pai = pai;
    elementos.push({ ref, el: novo });
    for (const f of no.filhos ?? []) visitar(f, novo.x, novo.y, ref);
  };
  for (const r of [].concat(raizes)) visitar(r, 0, 0, null);
  return elementos;
}

/** Roda os containers para obter posições e tamanhos finais (e normaliza no canto 0,0). */
function assentar(elementos) {
  const doc = { elementos: Object.fromEntries(elementos.map(({ ref, el }) => [ref, el])) };
  aplicarLayouts(doc);
  const lista = elementos.map(({ ref }) => doc.elementos[ref]);
  const x0 = Math.min(...lista.map(e => e.x));
  const y0 = Math.min(...lista.map(e => e.y));
  for (const e of lista) { e.x -= x0; e.y -= y0; }
  return {
    largura: Math.max(...lista.map(e => e.x + e.largura)),
    altura: Math.max(...lista.map(e => e.y + e.altura)),
  };
}

DEFINICOES.push(criarMenuPdfStudio({cont,texto,botao,ev}));
DEFINICOES.push({ id: 'sidebarAdaptativa', nome: 'Navegação lateral adaptativa', cat: 'Menus',
  desc: 'Auto: aberta, compacta e minimal com sobreposição, Esc, clique fora e preferência de sessão', tags: ['sidebar','navegação','adaptativo','overlay'],
  raiz: cont(0,0,1000,600,{modo:'linha',espaco:0,abracar:false},{'menu.sidebar':true,'estilo.fundo':'#f8fafc'},'Navegação adaptativa',[
    cont(0,0,264,600,{modo:'coluna',espaco:6,margem:8,abracar:false},{'estilo.fundo':'#172033'},'Navegação',
      ['Início','Projetos','Relatórios','Configurações'].map((nome,i)=>cont(0,0,248,44,{modo:'linha',espaco:8,alinhar:'centro'},{'acessibilidade.role':'button','acessibilidade.ariaLabel':nome,eventos:[ev('onClick','','','navegar_'+i)]},nome,[
        icone(0,0,24,['casa','pasta','lista','engrenagem'][i],'#e2e8f0'),texto(0,0,194,24,nome,'#e2e8f0',14,{'menu.rotuloSidebar':true})
      ]))),
    cont(264,0,736,600,{modo:'coluna',espaco:12,margem:24,abracar:false},{'estilo.fundo':'#f8fafc'},'Conteúdo',[
      texto(0,0,600,40,'Conteúdo principal','#172033',24),texto(0,0,600,70,'Redimensione a prévia: a navegação muda sem criar telas separadas.','#475569',16)
    ])
  ])
});
const MODELOS = DEFINICOES.map(d => {
  const elementos = achatar(d.raizes ?? d.raiz);
  // ícone padrão (estrela) de modelo estático vira o ícone que combina com o texto ao lado
  for (const { el } of elementos) {
    if (el.tipo !== "icone" || (el.simbolo && el.simbolo !== "estrela")) continue;
    const t = elementos.find(x => x.el !== el && x.el.pai === el.pai && x.el.tipo === "texto");
    const ic = t && iconePorRotulo(t.el.texto);
    if (ic) el.simbolo = ic;
  }
  const tam = assentar(elementos);
  return { id: d.id, nome: d.nome, cat: d.cat, desc: d.desc, tags: d.tags ?? [], ...tam, elementos };
});

// Modelo funcional de rádios: interface + lógica (complemento) vêm de radio.js; aqui só a miniatura.
MODELOS.push({
  id: "radioControlador", nome: "Controlador de rádios", cat: "Painéis", largura: 440, altura: 88,
  desc: "Menu expansível que toca, cadastra, favorita e filtra rádios (com espectro de áudio, backup e emissoras prontas)",
  tags: ["rádio", "áudio", "player", "stream", "funcional"],
  elementos: [
    { ref: "m0", el: { tipo: "container", x: 0, y: 0, largura: 440, altura: 88, estilo: { fundo: "#142451", borda: "transparent", larguraBorda: 0, raio: 22 } } },
    { ref: "m1", el: { tipo: "texto", x: 20, y: 30, largura: 200, altura: 24, texto: "Suas rádios", estilo: { cor: "#f5e9dc", tamanhoFonte: 15 } } },
    { ref: "m2", el: { tipo: "botao", x: 340, y: 22, largura: 44, altura: 44, rotulo: "▶", estilo: { fundo: "#7c8cff", cor: "#fff", borda: "#7c8cff", raio: 22 } } },
  ],
});

MODELOS.push(criarModeloMenu(MENU_PDF_PADRAO,{cont,texto,botao,achatar,assentar,evento:ev}));

const CATEGORIAS_MODELOS = ["Sistemas", "Referências visuais", "Efeitos de caixa", "Menus", "Grupos de faixa", "Botões", "Barras", "Painéis", "Diálogos", "Meus modelos"];

/** Elementos completos de um modelo, com posições relativas: [{ ref, el }]. */
function elementosDoModelo(modelo) {
  return modelo.elementos.map((e, i) => ({ ref: e.ref ?? `m${i}`, el: clonar(e.el) }));
}

// ---------- arquivo de componente (formato de sistema profissional) ----------
/** Cores e fontes usadas, para documentar o componente como tokens. */
function tokens(elementos) {
  const cores = new Set();
  const fontes = new Set();
  for (const { el } of elementos) {
    for (const c of [el.estilo?.fundo, el.estilo?.cor, el.estilo?.borda, el.estados?.hover?.fundo]) if (/^#[0-9a-f]{3,8}$/i.test(c ?? "")) cores.add(c.toLowerCase());
    if (el.estilo?.fonte) fontes.add(el.estilo.fonte);
  }
  return { cores: [...cores], fontes: [...fontes] };
}

/** Modelo interno → componente com árvore de camadas, meta e tokens. */
function paraComponente(m) {
  const els = elementosDoModelo(m);
  const porRef = Object.fromEntries(els.map(e => [e.ref, e]));
  const no = ({ ref, el }) => {
    const { pai, ...props } = el;
    const filhos = els.filter(x => x.el.pai === ref).map(no);
    return { id: ref, nome: el.nome, tipo: el.tipo, propriedades: props, ...(filhos.length ? { filhos } : {}) };
  };
  const agora = new Date().toISOString();
  return {
    formato: "hefestus.componente", versao: 2,
    id: m.id,
    meta: {
      nome: m.nome, categoria: m.cat, descricao: m.desc ?? "", tags: m.tags ?? m.meta?.tags ?? [],
      versao: m.meta?.versao ?? "1.0.0", criadoEm: m.meta?.criadoEm ?? agora, atualizadoEm: agora,
    },
    tamanho: { largura: m.largura, altura: m.altura },
    ...(m.comportamento ? { comportamento: clonar(m.comportamento) } : {}),
    tokens: tokens(els),
    arvore: els.filter(e => !e.el.pai || !porRef[e.el.pai]).map(no),
  };
}

/** Componente (v2) ou modelo antigo (lista plana) → modelo interno. */
function deComponente(c) {
  if (c?.formato !== "hefestus.componente") {
    if (Array.isArray(c?.elementos) && c.largura && c.altura) return c; // formato interno
    throw new Error("arquivo não é um componente Hefestus");
  }
  const elementos = [];
  const visitar = (no, pai) => {
    const el = clonar(no.propriedades ?? {});
    el.tipo = no.tipo;
    el.nome = no.nome ?? el.nome;
    if (pai) el.pai = pai;
    elementos.push({ ref: no.id, el });
    for (const f of no.filhos ?? []) visitar(f, no.id);
  };
  for (const r of c.arvore ?? []) visitar(r, null);
  return {
    id: c.id, nome: c.meta?.nome ?? "Componente", cat: "Meus modelos", desc: c.meta?.descricao ?? "", tags: c.meta?.tags ?? [],
    comportamento: c.comportamento ? clonar(c.comportamento) : undefined,
    meta: c.meta, usuario: true, largura: c.tamanho?.largura ?? 100, altura: c.tamanho?.altura ?? 100, elementos,
  };
}

/** Miniatura SVG de um modelo: retângulos dos elementos, nas cores deles. */
const cacheMiniaturas = new WeakMap();
function miniaturaModelo(modelo, largura = 120, altura = 64) {
  const chave = `${largura}x${altura}`;
  const cache = cacheMiniaturas.get(modelo);
  if (cache?.has(chave)) return cache.get(chave);
  const esc = s => String(s).replace(/[<>"&]/g, "");
  const k = Math.min(largura / modelo.largura, altura / modelo.altura);
  const w = modelo.largura * k;
  const hh = modelo.altura * k;
  const partes = modelo.elementos.map(({ el }) => {
    const cor = c => (c && c !== "transparent" ? esc(c) : null);
    const x = el.x * k;
    const y = el.y * k;
    const l = Math.max(1, el.largura * k);
    const a = Math.max(1, el.altura * k);
    const r = Math.min((el.estilo?.raio ?? 0) * k, a / 2);
    if (el.tipo === "texto") return `<rect x="${x}" y="${y + a * 0.3}" width="${Math.min(l, (String(el.texto ?? "").length * (el.estilo?.tamanhoFonte ?? 14) * 0.55) * k)}" height="${Math.max(1, a * 0.4)}" rx="${a * 0.2}" fill="${cor(el.estilo?.cor) ?? "#888"}" opacity=".75"/>`;
    if (el.tipo === "icone") return `<circle cx="${x + l / 2}" cy="${y + a / 2}" r="${Math.max(1, l / 3)}" fill="${cor(el.estilo?.cor) ?? "#888"}" opacity=".85"/>`;
    const fundo = cor(el.estilo?.fundo) ?? "none";
    const borda = el.estilo?.larguraBorda ? cor(el.estilo?.borda) : null;
    if (fundo === "none" && !borda) return "";
    return `<rect x="${x}" y="${y}" width="${l}" height="${a}" rx="${r}" fill="${fundo}"${borda ? ` stroke="${borda}" stroke-width=".6"` : ""}/>`;
  });
  const resultado = `<svg width="${largura}" height="${altura}" viewBox="${-(largura - w) / 2} ${-(altura - hh) / 2} ${largura} ${altura}" aria-hidden="true">${partes.join("")}</svg>`;
  const mapa = cache ?? new Map(); mapa.set(chave, resultado); cacheMiniaturas.set(modelo, mapa);
  return resultado;
}

// usados pelo construtor por formulário (js/nucleo/construtor.js)

const evento = ev;
export { cont, texto, icone, linha, botao, achatar, assentar, el as elemento, MODELOS, CATEGORIAS_MODELOS, elementosDoModelo, paraComponente, deComponente, miniaturaModelo, evento };
