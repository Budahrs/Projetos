import { iconeHephaestus } from './iconesHephaestus.js';
import { abrirPendenciasProjetos } from "./painelPendencias.js";
import { abrirPainelDados } from "./painelDados.js";
import { abrirConexoesEditor } from "./conexoesEditor.js";
import { abrirOficinaProjetos } from "./oficinaProjetos.js";
import { registrarMetricaRibbon, medirAcaoRibbon, exportarMetricasRibbon } from "../nucleo/metricasRibbon.js";
import { abrirOpcoesTemas } from "./opcoesTemas.js";
import { CommandRegistry } from "../nucleo/comandos.js";
import { animarMenu } from "./movimentoMenus.js";
import { CATEGORIAS_COMPORTAMENTOS } from "../nucleo/comportamentos.js";
import { abrirImportacaoHTML } from "./importarHTML.js";
// Menu do Hephaestus em dois estilos que usam a MESMA definição de comandos:
// · Faixa de opções (Office): abas, grupos, abas contextuais, flyouts que abrem para o
//   lado empurrando os vizinhos e compactação automática em quatro níveis. Se mesmo
//   compactando o flyout não couber, ele vira um painel flutuante (nada fica escondido).
// · Barra de menus (Clip Studio): menus suspensos com submenus em cascata, atalhos à
//   direita, navegação por teclado e posicionamento que respeita as bordas da tela.

import { organizarFaixa, auditarFaixa, PERFIS_FAIXA, padraoRecomendado } from "./orquestrador.js";
import { reorganizarAbas, definirEmpilhar } from "./menuEstrutura.js";
import { h, botaoIcone, avisar } from "./dom.js";
import { icone } from "./icones.js";
import { motorMenus } from "../nucleo/motorMenus.js";
import { FaixaDeOpcoes } from "./faixa.js";
import { CATALOGO } from "../nucleo/catalogo.js";
import { FORMAS, formasPorCategoria, miniaturaForma, ESTILOS_FORMA, PALETA } from "../nucleo/formas.js";
import { FONTES_BIB, CATEGORIAS_FONTES } from "../nucleo/fontes.js";
import { MODELOS_COMP } from "../nucleo/componentes.js";
import { EFEITOS_BOTAO, miniaturaEfeitoBotao } from "../nucleo/efeitosBotao.js";
import { MODELOS, CATEGORIAS_MODELOS, miniaturaModelo } from "../nucleo/modelos.js";
import { categoriasIcones, rotuloIcone, iconeColorido, iconeMenu, iconesWindowsAtivos, definirIconesWindows } from "./icones.js";
import { TEMAS_UI, PALETAS, ESTILOS_MENU, FORMATOS, miniaturaTema } from "./temas.js";
import { VERSAO } from "../nucleo/semente.js";
import { abasHephaestus } from "./abasHephaestus.js";
function abasBase(app) { return abasHephaestus(app, abasLegadas(app)); }
const VARIANTES = {
  primario: { nome: "Primário", v: { "estilo.fundo": "#2563eb", "estilo.cor": "#ffffff", "estilo.borda": "#1d4ed8", "estados.hover.fundo": "#1d4ed8" } },
  secundario: { nome: "Secundário", v: { "estilo.fundo": "#e5e7eb", "estilo.cor": "#111827", "estilo.borda": "#d1d5db", "estados.hover.fundo": "#d1d5db" } },
  contorno: { nome: "Contorno", v: { "estilo.fundo": "transparent", "estilo.cor": "#2563eb", "estilo.borda": "#2563eb", "estados.hover.fundo": "#eff6ff" } },
  perigo: { nome: "Perigo", v: { "estilo.fundo": "#dc2626", "estilo.cor": "#ffffff", "estilo.borda": "#b91c1c", "estados.hover.fundo": "#b91c1c" } },
  sutil: { nome: "Sutil", v: { "estilo.fundo": "transparent", "estilo.cor": "#374151", "estilo.borda": "transparent", "estados.hover.fundo": "#f3f4f6" } },
};

const TELAS = [
  ["Desktop", 1280, 800], ["Notebook", 1440, 900], ["Tablet", 768, 1024], ["Celular", 390, 844],
];

/** Galeria completa de formas por categoria (abre ao lado, empurrando os vizinhos). */
function galeriaFormas(app) {
  return {
    tipo: "categorias", flutuante: true, variante: "formas",
    categorias: formasPorCategoria().filter(cat => ['Retângulos', 'Formas básicas'].includes(cat.nome)).map(cat => ({
      nome: cat.nome,
      itens: cat.itens.map(f => ({ id: f.id, titulo: f.nome, html: miniaturaForma(f.id, 18), acao: () => app.inserirForma(f.id) })),
    })),
  };
}

/** Biblioteca de modelos (prontos + do usuário) agrupada por categoria. */
function galeriaModelos(app) {
  const todos = [...new Map([...MODELOS, ...app.modelosUsuario()].map(m=>[m.id,m])).values()];
  return {
    tipo: "modelos", flutuante: true, variante: "galeria",
    categorias: CATEGORIAS_MODELOS.map(cat => ({
      nome: cat,
      // html só é desenhado quando a galeria aparece (a lista de comandos também chama esta função).
      itens: todos.filter(m => m.cat === cat).map(m => ({ id: m.id, titulo: `${m.nome}: ${m.desc}`, rotulo: m.nome, get html() { return miniaturaModelo(m, 160, 84); }, acao: () => app.inserirModelo(m) })),
    })).filter(c => c.itens.length),
  };
}

/** Biblioteca de ícones de menu. `acao` recebe o nome do ícone. */
/** Grupo da faixa → painel da direita que ele abre pelo iniciador ↗ (como a "caixa de diálogo" do PowerPoint). */
const LANCADORES = { "Efeitos": "efeitos", "Efeitos de botão": "efeitos", "Cor": "estilo", "Estilos de Forma": "estilo", "Texto": "estilo", "Fonte e ícone": "estilo", "Elemento": "eventos", "Tamanho e posição": "propriedades", "Ordem e giro": "propriedades" };
const FAIXA_NO_MENU = new Set();

function galeriaIcones(acao, colorido = false) {
  return {
    tipo: "categorias", flutuante: true,
    categorias: categoriasIcones().map(c => ({ nome: c.nome, itens: c.itens.map(i => ({ id: i, titulo: rotuloIcone(i), html: colorido ? iconeColorido(i, 20) : icone(i, 18), acao: () => acao(i) })) })),
  };
}

/** Biblioteca de fontes, cada nome escrito na própria fonte. */
function galeriaFontes(app, atual) {
  return {
    tipo: "fontes", flutuante: true,
    categorias: CATEGORIAS_FONTES.map(cat => ({
      nome: cat,
      itens: Object.entries(FONTES_BIB).filter(([, f]) => f.cat === cat)
        .map(([k, f]) => ({ id: k, rotulo: f.nome, titulo: f.nome, estilo: `font-family:${f.pilha}`, ativo: atual === k, acao: () => app.aplicarFonte(k) })),
    })),
  };
}

/** Lista de temas da INTERFACE (nunca mudam o canvas). */
function listaTemas(app) {
  return Object.entries(TEMAS_UI).map(([k, t]) => ({
    id: `tema-${k}`, rotulo: t.nome, titulo: `${t.nome}: ${t.desc}`, tam: "pequeno", html: miniaturaTema(k, 22),
    ativo: () => (app.ui.temaUI ?? "automatico") === k, acao: () => app.definirTemaUI(k),
  }));
}

function miniaturaFormato(k) {
  const r = { quadrado: 0, arredondado: 3, moderno: 7 }[k];
  return `<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true"><rect x="1" y="1" width="20" height="14" rx="${r}" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="4" y="5" width="9" height="3" rx="${r / 3}" fill="currentColor"/></svg>`;
}

/**
 * Definição das abas, organizadas por função:
 * Arquivo (saída) · Início (edição e seleção) · Inserir (formas e componentes) · Organizar (transformação)
 * Design (cor, tema, efeitos) · Exibir (navegação e guias) · Comportamento · Histórico · contextual Formatar.
 * Cada comando: { id, rotulo, icone, tam, acao, ativo, desabilitado, flyout }.
 */
function abasLegadas(app) {
  const n = app.n;
  const sel = () => n.selecionados();
  const semSel = () => !n.selecionados().length;
  const menosDe = k => () => n.selecionados().length < k;
  const inserirP = tipo => ({ ...inserir(tipo), tam: "pequeno" });
  const inserir = tipo => ({ id: `ins-${tipo}`, rotulo: CATALOGO[tipo].nome, icone: CATALOGO[tipo].icone, tam: "grande", acao: () => app.inserir(tipo) });
  const histDesf = () => n.historico().cursor === 0;
  const histRefz = () => n.historico().cursor === n.historico().itens.length;
  const todosTravados = () => sel().length > 0 && sel().every(id => n.elemento(id).travado);
  const todosOcultos = () => sel().length > 0 && sel().every(id => n.elemento(id).visivel === false);
  const alinhar = (m, r, ic) => ({ id: `al-${m}`, rotulo: r, icone: ic, tam: "pequeno", acao: () => n.alinharVarios(sel(), m), desabilitado: semSel });

  const lista = [
    {
      id: "arquivo", rotulo: "Arquivo", classe: "arquivo",
      grupos: [
        { nome: "Projeto", icone: "novo", cmds: [
          { id: "novo", rotulo: "Novo", icone: "novo", tam: "grande", acao: () => app.novoProjeto() },
          { id: "abrir", rotulo: "Abrir", icone: "abrir", tam: "grande", acao: () => app.abrirArquivo(), atalho: "Ctrl+O" },
          { id: "salvar", rotulo: "Salvar", icone: "salvar", tam: "grande", acao: () => app.salvar(), atalho: "Ctrl+S" },
          { id: "salvar-como", rotulo: "Salvar como…", titulo: "Salva o projeto num arquivo .hefestus novo", icone: "salvar", tam: "pequeno", acao: () => app.salvar(true), atalho: "Ctrl+Shift+S" },
        ] },
        { nome: "Exportar", icone: "exportar", cmds: [
          { id: "exp-windows", rotulo: "Aplicativo Windows…", titulo: "Salvar o projeto com gerador de instalador EXE", icone: "aplicativo", tam: "grande", acao: () => app.exportarAplicativoWindows() },
          { id: "exp-html", rotulo: "HTML + documentos", titulo: "Baixar ZIP com HTML e pasta documentos", icone: "exportar", tam: "grande", acao: () => app.baixarHTML() },
          {
            id: "exp-comp", rotulo: "Componente…", titulo: "Exporta a interface como componente React, Vue ou Web Component, ou os tokens de tema em CSS", icone: "codigo", tam: "pequeno",
            flyout: [["react", "React (.jsx)"], ["vue", "Vue (.vue)"], ["webcomponent", "Web Component (.js)"], ["tema", "Tokens de tema (.css)"], ["storybook", "Storybook (.stories.jsx)"], ["testes", "Testes visuais (Playwright)"]].map(([k, r]) => ({ id: `exp-${k}`, rotulo: r, icone: "codigo", tam: "pequeno", acao: () => app.baixarArtefato(k) })),
          },
          { id: "exp-docs", rotulo: "Documentação dos sinais (.md)", titulo: "Gera um Markdown com o contrato de sinais, regras, elementos e a auditoria", icone: "documento", tam: "pequeno", acao: () => app.baixarDocumentacao() },
          { id: "exp-separado", rotulo: "Projeto + histórico separados", titulo: "Baixa o projeto (leve) e o histórico em JSONL de patches compactos, em dois arquivos", icone: "salvar", tam: "pequeno", acao: () => app.baixarSeparado() },
          { id: "abrir-hist", rotulo: "Abrir histórico (.jsonl)…", titulo: "Reaplica um histórico salvo à parte ao projeto aberto (precisa ser o mesmo estado final)", icone: "abrir", tam: "pequeno", acao: () => app.entradaHistorico.click() },
          { id: "cop-html", rotulo: "Copiar HTML", icone: "copiar", tam: "pequeno", acao: () => app.copiar("html") },
          { id: "cop-json", rotulo: "Copiar JSON", icone: "codigo", tam: "pequeno", acao: () => app.copiar("json") },
          { id: "ver-cod", rotulo: "Ver código", icone: "codigo", tam: "pequeno", acao: () => app.setModo("web") },
        ] },
        { nome: "Biblioteca", icone: "biblioteca", cmds: [
          { id: "arq-salvar-modelo", rotulo: "Salvar seleção como modelo", icone: "modelo", tam: "pequeno", acao: () => app.salvarModelo(), desabilitado: semSel },
          { id: "arq-exp-modelos", rotulo: "Exportar meus modelos", icone: "exportar", tam: "pequeno", acao: () => app.exportarModelos(), desabilitado: () => !app.modelosUsuario().length },
          { id: "arq-imp-modelos", rotulo: "Importar modelos", icone: "abrir", tam: "pequeno", acao: () => app.importarModelos() },
        ] },
        { nome: "Nome", icone: "texto", campo: true },
      ],
    },
    {
      id: "inicio", rotulo: "Início", rotuloMenu: "Editar",
      grupos: [
        { nome: "Área de transferência", icone: "colar", cmds: [
          { id: "colar", rotulo: "Colar", icone: "colar", tam: "grande", acao: () => app.colarSelecao(), desabilitado: () => !app.prancheta, atalho: "Ctrl+V" },
          { id: "cortar", rotulo: "Recortar", icone: "cortar", tam: "pequeno", acao: () => app.recortarSelecao(), desabilitado: semSel, atalho: "Ctrl+X" },
          { id: "copiar-el", rotulo: "Copiar", icone: "copiar", tam: "pequeno", acao: () => app.copiarSelecao(), desabilitado: semSel, atalho: "Ctrl+C" },
          { id: "pincel-formatacao", rotulo: "Pincel de formatação", titulo: "Copiar visual, efeitos, vínculos, interações e código conforme as opções. Substitui as categorias no destino. Duplo clique mantém o pincel; Esc encerra.", icone: "pincel", tam: "pequeno", acao: () => app.ativarPincel(), ativo: () => app.ui.ferramenta==='pincel', desabilitado: () => !app.pincel && (sel().length!==1 || !n.elemento(sel()[0])?.estilo) },
          { id:'pincel-opcoes',rotulo:'Opções do pincel',icone:'propriedades',tam:'pequeno',flyout:()=>[
            ...[['visual','Cores, fonte e bordas'],['efeitos','Efeitos e sombras'],['interacoes','Vínculos, interações e transições'],['codigo','Código HTML, CSS e JavaScript']].map(([chave,rotulo])=>({id:'pincel-'+chave,rotulo,icone:'pincel',tam:'pequeno',ativo:()=>app.ui.pincelOpcoes?.[chave]??true,acao:()=>{app.ui.pincelOpcoes??={visual:true,efeitos:true,interacoes:true,codigo:true};app.ui.pincelOpcoes[chave]=!app.ui.pincelOpcoes[chave];app.salvarUI();}})),
            {id:'pincel-continuo',rotulo:'Ativar pincel contínuo',icone:'pincel',tam:'pequeno',acao:()=>{if(!app.pincel)app.ativarPincel();if(app.pincel){app.pincel.continuo=true;app.mensagem('Pincel contínuo: clique nos destinos. Esc encerra.');}}},
          ] },
          { id: "colar-lugar", rotulo: "Colar no mesmo lugar", icone: "colar", tam: "pequeno", acao: () => app.colarSelecao(true), desabilitado: () => !app.prancheta, atalho: "Ctrl+Shift+V" },
        ] },
        { nome: "Histórico", icone: "relogio", cmds: [
          { id: "desf", rotulo: "Desfazer", icone: "desfazer", tam: "grande", acao: () => n.desfazer(), desabilitado: histDesf, atalho: "Ctrl+Z" },
          { id: "refz", rotulo: "Refazer", icone: "refazer", tam: "grande", acao: () => n.refazer(), desabilitado: histRefz, atalho: "Ctrl+Y" },
        ] },
        { nome: "Edição", icone: "duplicar", cmds: [
          { id: "dup", rotulo: "Duplicar", icone: "duplicar", tam: "grande", acao: () => n.duplicarVarios(sel()), desabilitado: semSel, atalho: "Ctrl+D" },
          { id: "exc", rotulo: "Excluir", icone: "excluir", tam: "pequeno", acao: () => n.removerVarios(sel()), desabilitado: semSel, atalho: "Del" },
          { id: "trav", rotulo: "Travar posição", icone: "travar", tam: "pequeno", acao: () => n.definirNosSelecionados({ travado: !todosTravados() }, `${todosTravados() ? "Destravar" : "Travar"} ${n.descreverGrupo(sel())}`), desabilitado: semSel, ativo: todosTravados },
          { id: "vis", rotulo: "Ocultar", icone: "olhoFechado", tam: "pequeno", acao: () => n.definirNosSelecionados({ visivel: todosOcultos() }, `${todosOcultos() ? "Mostrar" : "Ocultar"} ${n.descreverGrupo(sel())}`), desabilitado: semSel, ativo: todosOcultos },
        ] },
        { nome: "Seleção", icone: "selTudo", cmds: [
          { id: "sel-tudo", rotulo: "Selecionar tudo", icone: "selTudo", tam: "grande", acao: () => n.selecionarTudo(), atalho: "Ctrl+A" },
          { id: "sel-tipo", rotulo: "Mesmo tipo", icone: "camadas", tam: "pequeno", acao: () => n.selecionarMesmo("tipo"), desabilitado: semSel },
          { id: "sel-cor", rotulo: "Mesma cor", icone: "tema", tam: "pequeno", acao: () => n.selecionarMesmo("cor"), desabilitado: semSel },
          { id: "sel-painel", rotulo: "Painel de seleção", titulo: "Lista de objetos", icone: "camadas", tam: "pequeno", acao: () => app.abrirPainelEsq("camadas") },
          { id: "sel-inv", rotulo: "Inverter seleção", icone: "espelharH", tam: "pequeno", acao: () => n.inverterSelecao(), atalho: "Ctrl+Shift+A" },
          { id: "sel-filhos", rotulo: "Selecionar conteúdo", icone: "grade", tam: "pequeno", acao: () => n.selecionarFilhos(), desabilitado: semSel },
          { id: "sel-pai", rotulo: "Selecionar o container", icone: "setaCima", tam: "pequeno", acao: () => n.selecionarPai(), desabilitado: semSel },
          { id: "sel-form", rotulo: "Mesmo item do formulário", icone: "painelLateral", tam: "pequeno", acao: () => n.selecionarDoFormulario(), desabilitado: semSel },
          { id: "sel-nada", rotulo: "Limpar seleção", icone: "fechar", tam: "pequeno", acao: () => n.selecionar(null), desabilitado: semSel, atalho: "Esc" },
        ] },
        { nome: "Inserir rápido", icone: "mais", cmds: [inserir("botao"), inserir("texto"), inserir("caixa")] },
        { nome: "Vetor e organizar", icone: "boolUnir", cmds: [
          ["ic-unir", "Unir formas", "boolUnir", () => app.combinar("unir"), semSel],
          ["ic-subtrair", "Subtrair (corte)", "boolSubtrair", () => app.combinar("subtrair"), semSel],
          ["ic-intersectar", "Interseção (corte condicional)", "boolInterseccao", () => app.combinar("intersectar"), semSel],
          ["ic-excluir", "Excluir sobreposição", "boolExcluir", () => app.combinar("excluir"), semSel],
          ["ic-agrupar", "Agrupar (Ctrl+G)", "agrupar", () => app.agrupar("livre"), semSel],
          ["ic-desagrupar", "Desagrupar", "desagrupar", () => app.desagrupar(), () => !sel().some(id => n.elemento(id)?.tipo === "container")],
          ["ic-frente", "Trazer para frente (Ctrl+])", "frente", () => n.camadaVarios(sel(), "frente"), semSel],
          ["ic-tras", "Enviar para trás (Ctrl+[)", "tras", () => n.camadaVarios(sel(), "tras"), semSel],
          ["ic-mascara", "Criar máscara", "mascaraCriar", () => app.mascara(), () => sel().length < 2],
          ["ic-liberar", "Liberar máscara", "mascaraLiberar", () => app.liberarMascara(), semSel],
          ["ic-girar", "Girar 90°", "girar", () => n.girar(sel(), 90), semSel],
          ["ic-espelhar", "Espelhar horizontal", "espelharH", () => n.espelhar(sel(), "H"), semSel],
        ].map(([id, rotulo, icone, acao, desabilitado]) => ({ id, rotulo, icone, tam: "icone", acao, desabilitado })) },
      ],
    },
    {
      id: "inserir", rotulo: "Inserir",
      grupos: [
        { nome: "Biblioteca", icone: "biblioteca", cmds: [
          { id: "ins-modelos", rotulo: "Modelos", icone: "modelo", tam: "grande", flyout: () => galeriaModelos(app) },
          { id: "ins-bib", rotulo: "Painel Biblioteca", icone: "biblioteca", tam: "pequeno", acao: () => app.abrirPainelEsq("biblioteca"), ativo: () => app.ui.esq === "biblioteca" },
          {id:'ins-html-forja',rotulo:'Colar HTML e recriar artefato',icone:'codigo',tam:'pequeno',acao:()=>abrirImportacaoHTML(app)},
          { id: "ins-salvar-modelo", rotulo: "Salvar como modelo", icone: "salvar", tam: "pequeno", acao: () => app.salvarModelo(), desabilitado: semSel },
        ] },
        { nome: "Formas", icone: "estrela", cmds: [
          { id: "ins-formas", rotulo: "Formas básicas", icone: "caixa", tam: "grande", flyout: () => galeriaFormas(app) },
          inserirP("caixa"), inserirP("elipse"), inserirP("linha"),
        ] },
        { nome: "Vetor", icone: "caneta", cmds: [
          { id: "ins-caneta", rotulo: "Caneta", titulo: "Desenhar curvas e formas livres (P)", icone: "caneta", tam: "grande", acao: () => app.setFerramenta(app.ui.ferramenta === "caneta" ? "selecao" : "caneta"), ativo: () => app.ui.ferramenta === "caneta", atalho: "P" },
          { id: "ins-nos", rotulo: "Editar nós", titulo: "Mover nós e alças do vetor selecionado (duplo clique). Converte formas, caixas e elipses em vetor.", icone: "nos", tam: "grande", acao: () => app.editarNos(sel()[0]), desabilitado: () => sel().length !== 1 },
          { id: "ins-svg", rotulo: "Importar SVG", titulo: "Traz um arquivo SVG como formas vetoriais editáveis (sem gradientes, texto ou filtros)", icone: "abrir", tam: "pequeno", acao: () => app.entradaSVG.click() },
          { id: "ins-vetorizar", rotulo: "Converter em vetor", icone: "estrela", tam: "pequeno", acao: () => n.converterEmVetor(sel()), desabilitado: semSel },
        ] },
        { nome: "Texto", icone: "texto", cmds: [inserir("texto")] },
        { nome: "Controles", icone: "botao", cmds: [inserirP("botao"), inserirP("campo"), inserirP("toggle")] },
        { nome: "Navegação", icone: "menu", cmds: [inserir("menu")] },
        { nome: "Flutuantes", icone: "modal", cmds: [inserirP("modal"), inserirP("toast")] },
        { nome: "Componentes", icone: "mais", cmds: [
          { id: "ins-comp", rotulo: "Componentes", titulo: "Breadcrumb, paginação, chips, progresso, stepper, calendário, tabela, gráfico, menu radial…", icone: "mais", tam: "grande",
            flyout: () => MODELOS_COMP.map(([k, r]) => ({ id: `ins-comp-${k}`, rotulo: r, tam: "pequeno", icone: "mais", acao: () => app.n.adicionarItemConstrutor("componente", k) })) },
        ] },
        { nome: "Formulário", icone: "painelLateral", cmds: [
          ...[["caixa", "Caixa", "caixa"], ["ribbon", "Faixa de opções", "menu"], ["menu", "Menu", "lista"], ["blocos", "Blocos", "grade"], ["lateral", "Barra lateral", "painelLateral"], ["abasDoc", "Abas de documento", "tela"], ["paineis", "Painéis", "camadas"]]
            .map(([t, r, ic]) => ({ id: `ins-form-${t}`, rotulo: r, titulo: `Cria ${r.toLowerCase()} editável pelo formulário da Visual Script`, icone: ic, tam: "pequeno", acao: () => app.n.adicionarItemConstrutor(t) })),
        ] },
        { nome: "Sistemas", icone: "volume", cmds: [
          { id: "ins-radio", rotulo: "Controlador de rádios", titulo: "Menu expansível que toca, cadastra, favorita e filtra rádios (funcional)", icone: "volume", tam: "grande", acao: () => app.n.inserirRadio() },
        ] },
      ],
    },
    {
      id: "organizar", rotulo: "Organizar",
      grupos: [
        { nome: "Alinhar", icone: "alinhar", cmds: [
          alinhar("esquerda", "À esquerda", "al-esq"), alinhar("centroH", "Ao centro", "al-centroH"), alinhar("direita", "À direita", "al-dir"),
          alinhar("topo", "Ao topo", "al-topo"), alinhar("centroV", "Ao meio", "al-centroV"), alinhar("base", "À base", "al-base"),
        ] },
        { nome: "Distribuir", icone: "distH", cmds: [
          { id: "dist-h", rotulo: "Na horizontal", icone: "distH", tam: "grande", acao: () => n.distribuir(sel(), "h"), desabilitado: menosDe(3) },
          { id: "dist-v", rotulo: "Na vertical", icone: "distV", tam: "grande", acao: () => n.distribuir(sel(), "v"), desabilitado: menosDe(3) },
        ] },
        { nome: "Girar e espelhar", icone: "girar", cmds: [
          { id: "gir-d", rotulo: "Girar 90° à direita", icone: "girar", tam: "pequeno", acao: () => n.girar(sel(), 90), desabilitado: semSel },
          { id: "gir-e", rotulo: "Girar 90° à esquerda", icone: "girarEsq", tam: "pequeno", acao: () => n.girar(sel(), -90), desabilitado: semSel },
          { id: "gir-0", rotulo: "Zerar rotação", icone: "seta", tam: "pequeno", acao: () => n.definirRotacao(sel(), 0), desabilitado: semSel },
          { id: "esp-h", rotulo: "Espelhar horizontal", icone: "espelharH", tam: "pequeno", acao: () => n.espelhar(sel(), "H"), desabilitado: semSel, atalho: "Shift+H" },
          { id: "esp-v", rotulo: "Espelhar vertical", icone: "espelharV", tam: "pequeno", acao: () => n.espelhar(sel(), "V"), desabilitado: semSel, atalho: "Shift+V" },
        ] },
        { nome: "Combinar formas", icone: "boolUnir", cmds: [
          { id: "bool-unir", rotulo: "Unir", titulo: "Funde as formas selecionadas em uma só", icone: "boolUnir", tam: "grande", acao: () => app.combinar("unir"), desabilitado: menosDe(2) },
          { id: "bool-subtrair", rotulo: "Subtrair", titulo: "Recorta as formas de cima da que está mais ao fundo", icone: "boolSubtrair", tam: "grande", acao: () => app.combinar("subtrair"), desabilitado: menosDe(2) },
          { id: "bool-intersectar", rotulo: "Interseção", titulo: "Fica só o que as formas têm em comum", icone: "boolInterseccao", tam: "grande", acao: () => app.combinar("intersectar"), desabilitado: menosDe(2) },
          { id: "bool-excluir", rotulo: "Excluir sobreposição", titulo: "Fica tudo, menos onde as formas se sobrepõem", icone: "boolExcluir", tam: "grande", acao: () => app.combinar("excluir"), desabilitado: menosDe(2) },
          { id: "traco-forma", rotulo: "Traço em forma", titulo: "Converte o traço (borda) do elemento numa forma preenchida, com pontas, junções e tracejado. Usa o motor Craft: só na janela própria", icone: "contorno", tam: "pequeno", acao: () => app.tracoEmForma(), desabilitado: () => sel().length !== 1 || !n.podeConverterTraco(sel()[0]) },
        ] },
        { nome: "Máscara", icone: "boolInterseccao", cmds: [
          { id: "mascara-criar", rotulo: "Criar máscara", titulo: "A forma mais à frente recorta os outros elementos selecionados", icone: "boolInterseccao", tam: "grande", acao: () => app.mascara(), desabilitado: menosDe(2) },
          { id: "mascara-liberar", rotulo: "Liberar máscara", titulo: "Remove a máscara do elemento (ou da forma mascarante) selecionado", icone: "boolExcluir", tam: "pequeno", acao: () => app.liberarMascara(), desabilitado: semSel },
        ] },
        { nome: "Variantes", icone: "modelo", cmds: [
          { id: "var-tamanhos", rotulo: "Tamanhos P/M/G", titulo: "Cria três tamanhos do elemento selecionado lado a lado", icone: "modelo", tam: "pequeno", acao: () => app.variantes("tamanhos"), desabilitado: () => sel().length !== 1 },
          { id: "var-estilos", rotulo: "Estilos (primário, contorno…)", titulo: "Cria variantes de estilo do elemento selecionado", icone: "modelo", tam: "pequeno", acao: () => app.variantes("estilos"), desabilitado: () => sel().length !== 1 },
          { id: "var-refinar", rotulo: "Refinar (3 opções)", titulo: "Gera 3 acabamentos para você escolher", icone: "estrela", tam: "pequeno", acao: () => app.variantes("refinar"), desabilitado: () => sel().length !== 1 },
        ] },
        { nome: "Grupos", icone: "modelo", cmds: [
          { id: "agrupar", rotulo: "Agrupar", icone: "modelo", tam: "grande", acao: () => app.agrupar("livre"), desabilitado: semSel, atalho: "Ctrl+G" },
          { id: "ag-linha", rotulo: "Grupo em linha", icone: "distH", tam: "pequeno", acao: () => app.agrupar("linha"), desabilitado: semSel },
          { id: "ag-coluna", rotulo: "Grupo em coluna", icone: "distV", tam: "pequeno", acao: () => app.agrupar("coluna"), desabilitado: semSel },
          { id: "desagrupar", rotulo: "Desagrupar", icone: "selTudo", tam: "pequeno", acao: () => app.desagrupar(), desabilitado: () => !sel().some(id => n.elemento(id)?.tipo === "container"), atalho: "Ctrl+Shift+G" },
        ] },
        { nome: "Camadas", icone: "camadas", cmds: [
          { id: "frente", rotulo: "Trazer para frente", icone: "frente", tam: "grande", acao: () => n.camadaVarios(sel(), "frente"), desabilitado: semSel, atalho: "Ctrl+]" },
          { id: "tras", rotulo: "Enviar para trás", icone: "tras", tam: "grande", acao: () => n.camadaVarios(sel(), "tras"), desabilitado: semSel, atalho: "Ctrl+[" },
        ] },
      ],
    },
    {
      id: "design", rotulo: "Opções",
      grupos: [
        { nome: "Temas e conforto", icone: "tema", cmds: [
          {id:"pendencias-projetos",rotulo:"Pedidos e métricas",icone:"ferramentas",tam:"pequeno",acao:()=>abrirPendenciasProjetos(app)},
          {id:"painel-dados",rotulo:"Dados e indicadores",icone:"ferramentas",tam:"pequeno",acao:()=>abrirPainelDados(app)},
          {id:"conexoes-editor",rotulo:"IA local e contexto",icone:"ferramentas",tam:"pequeno",acao:()=>abrirConexoesEditor(app)},
          {id:"criar-tela-projeto",rotulo:"Criar interface do programa",icone:"ferramentas",tam:"pequeno",acao:()=>abrirOficinaProjetos(app)},
          {id:"oficina-projetos",rotulo:"Projetos e componentes",icone:"ferramentas",tam:"pequeno",acao:()=>abrirOficinaProjetos(app)},
          {id:"layouts-faixa",rotulo:"Layouts da faixa",icone:"design",tam:"pequeno",acao:()=>app.ribbon.faixa.layouts()},
          {id:"metricas-exportar",rotulo:"Exportar métricas locais",icone:"salvar",tam:"pequeno",acao:()=>app.baixarJSON(exportarMetricasRibbon(app.ui),"metricas-ribbon.json")},
          {id:"temas-criar",rotulo:"Criar e importar temas",icone:"tema",tam:"pequeno",acao:()=>abrirOpcoesTemas(app)},
          {id:"movimento-reduzido",rotulo:"Reduzir movimento",icone:"engrenagem",tam:"pequeno",ativo:()=>app.ui.reduzirMovimento!==false,acao:()=>{app.ui.reduzirMovimento=app.ui.reduzirMovimento===false;app.aplicarAparencia();app.salvarUI();app.render();}},
          {
            id: "gal-temas", tipo: "temas", rotulo: "Tema da interface (menus e barras)", colunas: 4, linhas: 1,
            itens: () => Object.entries(TEMAS_UI).map(([k, t]) => ({ id: k, titulo: `${t.nome}: ${t.desc}. Muda só menus, barras e painéis.`, html: miniaturaTema(k, 34), ativo: (app.ui.temaUI ?? "automatico") === k, acao: () => app.definirTemaUI(k) })),
            flyout: () => listaTemas(app),
          },
        ] },
        { nome: "Elementos", icone: "pincel", cmds: [
          {
            id: "paletas", rotulo: "Recolorir elementos", titulo: "Troca as cores de TODOS os elementos do canvas. O que você definiu antes vira pergunta.", icone: "pincel", tam: "grande",
            flyout: Object.entries(PALETAS).map(([k, p]) => ({ id: `pal-${k}`, rotulo: `Paleta ${p.nome}`, icone: "pincel", tam: "pequeno", acao: () => app.aplicarPaleta(k) })),
          },
        ] },
        { nome: "Cor", icone: "contaGotas", cmds: [
          { id: "conta", rotulo: "Conta-gotas", icone: "contaGotas", tam: "grande", acao: () => app.setFerramenta(app.ui.ferramenta === "conta" ? "selecao" : "conta"), ativo: () => app.ui.ferramenta === "conta", atalho: "I" },
          { id: "d-fontes", rotulo: "Fontes", icone: "fonte", tam: "grande", desabilitado: semSel, flyout: () => galeriaFontes(app, n.selecionado()?.estilo?.fonte) },
          { id: "p-estilo", rotulo: "Cores e estilo", icone: "pincel", tam: "grande", acao: () => app.abrirPainelDir("estilo") },
        ] },
        { nome: "Efeitos", icone: "efeitos", cmds: [
          {
            id: "sombras", rotulo: "Sombra", icone: "efeitos", tam: "grande", desabilitado: semSel,
            flyout: [["nenhuma", "Sem sombra"], ["pequena", "Pequena"], ["media", "Média"], ["grande", "Grande"]]
              .map(([v, r]) => ({ id: `sombra-${v}`, rotulo: r, icone: "efeitos", tam: "pequeno", acao: () => n.definirNosSelecionados({ "estilo.sombra": v }, `Sombra ${r.toLowerCase()} em ${n.descreverGrupo(sel())}`) })),
          },
          { id: "vidro", rotulo: "Vidro fosco", icone: "caixa", tam: "pequeno", desabilitado: semSel, acao: () => n.definirNosSelecionados({ "estilo.vidro": 12, "estilo.fundo": "#ffffff66" }, `Vidro fosco em ${n.descreverGrupo(sel())}`) },
          { id: "desfoque", rotulo: "Desfocar", icone: "elipse", tam: "pequeno", desabilitado: semSel, acao: () => n.definirNosSelecionados({ "estilo.desfoque": 4 }, `Desfoque em ${n.descreverGrupo(sel())}`) },
          { id: "p-efeitos", rotulo: "Mais efeitos", icone: "propriedades", tam: "pequeno", acao: () => app.abrirPainelDir("efeitos") },
        ] },
        { nome: "Tela", icone: "tela", cmds: [
          {
            id: "telas", rotulo: "Tamanho da tela", icone: "tela", tam: "grande",
            flyout: [["Monitor deste PC", globalThis.screen?.width ?? 1920, globalThis.screen?.height ?? 1080], ...TELAS].map(([r, w, a]) => ({ id: `tela-${r}`, rotulo: `${r} ${w}×${a}`, icone: "tela", tam: "pequeno", acao: () => n.definir("__canvas", { largura: w, altura: a }, `Tela ${r} (${w}×${a})`) })),
          },
        ] },
      ],
    },
    {
      id: "exibir", rotulo: "Exibir",
      grupos: [
        { nome: "Zoom", icone: "zoom", cmds: [
          { id: "z-mais", rotulo: "Aumentar", icone: "zoom", tam: "pequeno", acao: () => app.zoomPasso(0.1), atalho: "Ctrl+=" },
          { id: "z-menos", rotulo: "Diminuir", icone: "menos", tam: "pequeno", acao: () => app.zoomPasso(-0.1), atalho: "Ctrl+-" },
          { id: "z-100", rotulo: "Tamanho real (100%)", icone: "tela", tam: "pequeno", acao: () => app.definirZoom(1), atalho: "Ctrl+1" },
          { id: "z-ajustar", rotulo: "Ajustar à janela", icone: "telaCheia", tam: "grande", acao: () => app.definirZoom(app.area.ajustarZoom()), atalho: "Ctrl+0" },
        ] },
        { nome: "Navegar", icone: "mao", cmds: [
          { id: "f-mao", rotulo: "Mão", icone: "mao", tam: "grande", acao: () => app.setFerramenta(app.ui.ferramenta === "mao" ? "selecao" : "mao"), ativo: () => app.ui.ferramenta === "mao", atalho: "H" },
          { id: "f-zoom", rotulo: "Lupa", icone: "zoom", tam: "grande", acao: () => app.setFerramenta(app.ui.ferramenta === "zoom" ? "selecao" : "zoom"), ativo: () => app.ui.ferramenta === "zoom", atalho: "Z" },
        ] },
        { nome: "Mostrar", icone: "guia", cmds: [
          { id: "reguas", rotulo: "Réguas", icone: "regua", tam: "pequeno", acao: () => app.alternarUI("reguas", true), ativo: () => app.ui.reguas !== false },
          { id: "grade", rotulo: "Grade", icone: "grade", tam: "pequeno", acao: () => app.alternarUI("grade"), ativo: () => app.ui.grade },
          { id: "ima", rotulo: "Encaixar", icone: "ima", tam: "pequeno", acao: () => app.alternarUI("snap"), ativo: () => app.ui.snap },
          { id: "ver-fechados", rotulo: "Mostrar ocultos", titulo: "Mostra menus, painéis, gavetas e abas que começam fechados ou ocultos (ficam tracejados). Desligado, só aparecem ao serem selecionados.", icone: "olho", tam: "pequeno", acao: () => app.alternarUI("verFechados"), ativo: () => app.ui.verFechados === true },
          { id: "lim-guias", rotulo: "Limpar guias", icone: "excluir", tam: "pequeno", acao: () => n.limparGuias(), desabilitado: () => !n.guias().v.length && !n.guias().h.length },
        ] },
        { nome: "Interface", icone: "design", cmds: [
          { id: "modo-hibrido", rotulo: "Modo híbrido", titulo: "Canvas em cima; ao selecionar um elemento, o editor completo (componentes, estilo, comportamento) abre embaixo", icone: "painelLateral", tam: "grande", acao: () => app.alternarHibrido(), ativo: () => !!app.ui.hibrido },
          {
            id: "estilo-menu", rotulo: "Estilo do menu", icone: "menu", tam: "grande",
            flyout: () => Object.entries(ESTILOS_MENU).map(([k, e]) => ({ id: `em-${k}`, rotulo: e.nome, titulo: e.desc, icone: k === "faixa" ? "ferramentas" : "lista", tam: "pequeno", ativo: () => (app.ui.estiloMenu ?? "faixa") === k, acao: () => app.definirEstiloMenu(k) })),
          },
          {
            id: "formato", rotulo: "Formato", icone: "contorno", tam: "grande",
            flyout: () => Object.entries(FORMATOS).map(([k, f]) => ({ id: `fm-${k}`, rotulo: f.nome, titulo: f.desc, html: miniaturaFormato(k), tam: "pequeno", ativo: () => (app.ui.formato ?? "arredondado") === k, acao: () => app.definirFormato(k) })),
          },
          { id: "tema-ui", rotulo: "Tema", icone: "tema", tam: "pequeno", flyout: () => listaTemas(app) },
          { id: "densidade", rotulo: `Densidade: ${["compacta", "normal", "folgada"][app.ui.densidade ?? 1]}`, titulo: "Distância vertical entre os itens da faixa (compacta, normal, folgada)", icone: "camadas", tam: "pequeno",
            acao: () => { app.ui.densidade = ((app.ui.densidade ?? 1) + 1) % 3; app.salvarUI(); app.render(); } },
          { id: "ic-windows", rotulo: `Ícones: ${app.ui.iconesWindows === false ? "traço" : "Windows"}`, titulo: "Alterna entre os ícones do Windows e os de traço fino nos menus", icone: "tema", tam: "pequeno",
            acao: () => { app.ui.iconesWindows = app.ui.iconesWindows === false; definirIconesWindows(app.ui.iconesWindows); app.salvarUI(); app.render(); } },
          { id: "sons", rotulo: "Sons de encaixe", icone: "volume", tam: "pequeno", acao: () => app.alternarSons(), ativo: () => app.ui.sons !== false },
          { id: "barra-ferr", rotulo: "Barra de ferramentas", icone: "ferramentas", tam: "pequeno", acao: () => app.alternarBarra(), ativo: () => app.ui.barraFerr !== false, atalho: "F6" },
        ] },
        { nome:'Movimento',icone:'estados',cmds:[
          {id:'movimento-menus',rotulo:'Animação dos menus',icone:'estados',tam:'grande',flyout:()=>[
            ...[['nenhuma','Sem animação'],['suave','Aparecer suavemente'],['revelar','Revelar ao abrir']].map(([valor,rotulo])=>({id:'mov-menu-'+valor,rotulo,icone:'estados',tam:'pequeno',ativo:()=>(app.ui.animacaoMenus??'suave')===valor,acao:()=>{app.ui.animacaoMenus=valor;app.salvarUI();}})),
            ...[[100,'Rápida'],[180,'Normal'],[300,'Lenta']].map(([valor,rotulo])=>({id:'dur-menu-'+valor,rotulo:'Duração: '+rotulo,icone:'relogio',tam:'pequeno',ativo:()=>(app.ui.duracaoMenus??180)===valor,acao:()=>{app.ui.duracaoMenus=valor;app.salvarUI();}})),
          ]},
        ]},
        { nome: "Painéis", icone: "painelLateral", cmds: [
          { id: "pn-esq", rotulo: "Painéis à esquerda", icone: "camadas", tam: "grande",
            flyout: () => [["agente", "Agente", "chat"], ["ferramentas", "Componentes", "mais"], ["biblioteca", "Biblioteca", "biblioteca"], ["camadas", "Camadas", "camadas"], ["auditoria", "Auditoria", "check"], ["historico", "Linha do tempo", "relogio"], ["decisoes", "Decisões protegidas", "escudo"]]
              .map(([id, r, ic]) => ({ id: `pn-${id}`, rotulo: r, icone: ic, tam: "pequeno", ativo: () => app.ui.esq === id, acao: () => app.abrirPainelEsq(app.ui.esq === id ? null : id) })) },
          { id: "pn-dir", rotulo: "Painéis à direita", icone: "propriedades", tam: "grande",
            flyout: () => [["propriedades", "Propriedades", "propriedades"], ["estilo", "Estilo e cores", "pincel"], ["efeitos", "Transformação e efeitos", "efeitos"], ["responsivo", "Responsivo", "telaCheia"], ["comportamento", "Comportamento", "estados"], ["eventos", "Eventos e sinais", "raio"], ["acessibilidade", "Acessibilidade", "acess"]]
              .map(([id, r, ic]) => ({ id: `pn-${id}`, rotulo: r, icone: ic, tam: "pequeno", ativo: () => (app.ui.dir ?? []).includes(id), acao: () => app.alternarPainelDir(id) })) },
        ] },
        { nome: "Janela", icone: "telaCheia", cmds: [
          { id: "cheia", rotulo: "Tela cheia", icone: "telaCheia", tam: "grande", acao: () => app.telaCheia() },
          ...((app.ui.estiloMenu ?? "faixa") === "faixa"
            ? [{ id: "recolher", rotulo: app.ui.ribbonRecolhido ? "Fixar faixa" : "Recolher faixa", icone: app.ui.ribbonRecolhido ? "alfinete" : "setaCima", tam: "grande", acao: () => app.ribbon.alternarRecolhido(), atalho: "Ctrl+F1" }]
            : []),
        ] },
      ],
    },
    {
      id: "comportamento", rotulo: "Comportamento",
      grupos: [
        { nome: "Testar", icone: "previa", cmds: [
          { id: "previa", rotulo: "Prévia interativa", icone: "previa", tam: "grande", acao: () => app.setModo(app.ui.modo === "previa" ? "designer" : "previa"), ativo: () => app.ui.modo === "previa" },
          ...[["Desktop", 1440, "tela"], ["Tablet", 768, "painelLateral"], ["Celular", 390, "telefone"]].map(([r, w, ic]) => ({
            id: `prev-${w}`, rotulo: `${r} (${w})`, icone: ic, tam: "pequeno", ativo: () => app.ui.modo === "previa" && app.ui.larguraPrevia === w,
            acao: () => { app.ui.larguraPrevia = w; app.setModo("previa"); },
          })),
        ] },
        {nome:'Criar interação',icone:'raio',cmds:CATEGORIAS_COMPORTAMENTOS.map(cat=>({id:'comp-tipo-'+cat.id,rotulo:cat.nome,icone:'raio',tam:'pequeno',desabilitado:semSel,acao:()=>{app.ui.tipoComportamento=cat.id;app.abrirPainelDir('comportamento');}}))},
        { nome: "Prontos", icone: "raio", cmds: [
          { id: "comp-prontos", rotulo: "Comportam. prontos", titulo: "Menu suspenso, menu ao passar o mouse, dica, gaveta, acordeão, abas e modal", icone: "raio", tam: "grande", acao: () => app.abrirPainelDir("comportamento"), desabilitado: semSel },
          { id: "comp-resp", rotulo: "Responsivo", icone: "telaCheia", tam: "grande", acao: () => app.abrirPainelDir("responsivo") },
          { id: "comp-html-resp", rotulo: "HTML responsivo", icone: "codigo", tam: "pequeno", ativo: () => n.tela.responsivo !== false, acao: () => n.definir("__canvas", { responsivo: n.tela.responsivo === false }, n.tela.responsivo === false ? "Ligar HTML responsivo" : "HTML com tamanho fixo") },
        ] },
        { nome: "Elemento", icone: "estados", cmds: [
          { id: "p-estados", rotulo: "Estados", icone: "estados", tam: "grande", acao: () => app.abrirPainelDir("comportamento"), desabilitado: semSel },
          { id: "p-eventos", rotulo: "Eventos", icone: "raio", tam: "grande", acao: () => app.abrirPainelDir("eventos"), desabilitado: semSel },
          { id: "p-acess", rotulo: "Acessibilidade", icone: "acess", tam: "grande", acao: () => app.abrirPainelDir("acessibilidade"), desabilitado: semSel },
        ] },
        { nome: "Contrato", icone: "sinal", cmds: [
          { id: "ver-sinais", rotulo: "Sinais emitidos", icone: "sinal", tam: "grande", acao: () => app.mostrarSinais() },
        ] },
      ],
    },
    {
      id: "historico", rotulo: "Histórico",
      grupos: [
        { nome: "Navegar", icone: "relogio", cmds: [
          { id: "h-desf", rotulo: "Desfazer", icone: "desfazer", tam: "grande", acao: () => n.desfazer(), desabilitado: histDesf },
          { id: "h-refz", rotulo: "Refazer", icone: "refazer", tam: "grande", acao: () => n.refazer(), desabilitado: histRefz },
          { id: "h-linha", rotulo: "Linha do tempo", icone: "relogio", tam: "grande", acao: () => app.abrirPainelEsq("historico"), ativo: () => app.ui.esq === "historico" },
        ] },
        { nome: "Proteção", icone: "escudo", cmds: [
          { id: "h-dec", rotulo: "Decisões protegidas", icone: "escudo", tam: "grande", acao: () => app.abrirPainelEsq("decisoes"), ativo: () => app.ui.esq === "decisoes" },
        ] },
        { nome: "Agente", icone: "chat", cmds: [
          { id: "h-ag", rotulo: "Conversa com o agente", icone: "chat", tam: "grande", acao: () => app.abrirPainelEsq("agente"), ativo: () => app.ui.esq === "agente" },
        ] },
        { nome: "Armazém", icone: "servidor", cmds: [
          { id: "arm-abrir", rotulo: "Armazém de referências", titulo: "Cópias compactadas das ferramentas, artefatos e modelos dos seus programas", icone: "servidor", tam: "grande", acao: () => app.abrirArmazem("armazem"), ativo: () => app.ui.esq === "armazem" },
          { id: "arm-sinc", rotulo: "Sincronizar programa…", titulo: "Lê o manifesto de um programa e traz para o armazém só o que mudou", icone: "importar", tam: "pequeno", acao: () => app.abrirArmazem("sincronizar") },
          { id: "arm-cons", rotulo: "Consolidar ferramentas", titulo: "Acha ferramentas equivalentes, roda fixtures nas duas e monta o ranking", icone: "camadas", tam: "pequeno", acao: () => app.abrirArmazem("consolidar") },
          { id: "arm-prop", rotulo: "Pacote de atualização…", titulo: "Gera o pacote que um programa (opt-in) puxa do Hephaestus", icone: "exportar", tam: "pequeno", acao: () => app.abrirArmazem("propagar") },
        ] },
      ],
    },
  ];

  lista.push({
    id: "ajuda", rotulo: "Ajuda",
    grupos: [
      { nome: "Ajuda", icone: "ajuda", cmds: [
        { id: "autoformatar-artefato", rotulo: "Formatar artefato", titulo: "Autoformatar o menu ou controlador selecionado e seus filhos; Ctrl+Z restaura", icone: "design", tam: "grande", desabilitado: semSel, acao: () => { const r = n.autoformatarArtefato(); app.mensagem(r.mensagem); } },
        { id: "autoformatar-menus", rotulo: "Formatar Hephaestus", titulo: "Autoformatar o próprio menu do Hephaestus", icone: "design", tam: "grande", acao: () => app.ribbon.autoformatarMenus() },
        { id: "orquestrador", rotulo: "Organizar menus", icone: "ferramentas", tam: "grande", acao: () => app.ribbon.configurarOrquestrador() },
        { id: "auditar-projeto", rotulo: "Auditar projeto", icone: "check", tam: "grande", acao: () => app.abrirPainelDir("auditoria") },
        { id: "ajuda-busca", rotulo: "Pesquisar comandos", icone: "buscar", tam: "grande", acao: () => app.barra.focarBusca(), atalho: "Ctrl+F" },
        { id: "atalhos", rotulo: "Atalhos de teclado", icone: "ajuda", tam: "grande", acao: () => app.mostrarAtalhos(), atalho: "F1" },
        { id: "ag-ajuda", rotulo: "Pedir ao agente", icone: "chat", tam: "grande", acao: () => app.abrirPainelEsq("agente") },
        { id: "primeiros-passos", rotulo: "Primeiros passos", titulo: "Roteiro da primeira sessão e o teste dos 5 minutos", icone: "play", tam: "grande", acao: () => app.abrirPainelEsq("primeiros"), ativo: () => app.ui.esq === "primeiros" },
      ] },
      { nome: "Projeto", icone: "check", cmds: [
        { id: "aj-audit", rotulo: "Auditoria do projeto", titulo: "Procura e corrige problemas de contraste, nomes, eventos sem alvo e mais", icone: "check", tam: "grande", acao: () => app.abrirPainelEsq("auditoria") },
        { id: "aj-doc", rotulo: "Documentação dos sinais", icone: "documento", tam: "pequeno", acao: () => app.baixarDocumentacao() },
        { id: "aj-sobre", rotulo: "Sobre o Hephaestus", icone: "info", tam: "pequeno", acao: () => avisar(`Hephaestus v${VERSAO} · editor visual de interfaces com código real`) },
      ] },
    ],
  });

  const ids = n.selecionados();
  if (ids.length) {
    const unico = ids.length === 1 ? n.selecionado() : null;
    const aplicar = (valores, texto) => n.definirNosSelecionados(valores, `${texto} em ${n.descreverGrupo(n.selecionados())}`);
    lista.push({
      id: "formatar", rotulo: "Formatar", classe: "contextual",
      contexto: unico ? `Ferramentas de ${CATALOGO[unico.tipo]?.nome ?? "Elemento"}` : `${ids.length} elementos`,
      grupos: [
        ...(["forma", "caixa", "elipse", "botao"].includes(unico?.tipo) ? [{ nome: "Ícone na forma", icone: "icone", cmds: [
          { id: "f-icone-forma", rotulo: "Adicionar ícone à forma", icone: "icone", tam: "pequeno", flyout: () => galeriaIcones(i => n.adicionarIconeNaForma(unico.id, i)) },
          { id: "f-importar-icone", rotulo: "Importar ícones SVG/PNG", icone: "abrir", tam: "pequeno", acao: () => app.importarIcones() }
        ] }] : []),
        { nome: "Inserir Formas", icone: "estrela", cmds: [
          {
            id: "gal-formas", tipo: "galeria", rotulo: "Formas", colunas: 6, linhas: 3,
            itens: () => Object.entries(FORMAS).map(([id, f]) => ({ id, titulo: f.nome, html: miniaturaForma(id, 18), acao: () => app.inserirForma(id) })),
            flyout: () => galeriaFormas(app),
          },
          {
            id: "f-alterar-forma", rotulo: "Alterar Forma", titulo: "Troca a forma selecionada por outra do catálogo (retângulos, básicas, setas, fluxograma, estrelas…)", icone: "estrela", tam: "pequeno",
            desabilitado: () => unico?.tipo !== "forma",
            flyout: () => ({
              tipo: "categorias", flutuante: true, variante: "formas",
              categorias: formasPorCategoria().map(cat => ({ nome: cat.nome, itens: cat.itens.map(f => ({ id: f.id, titulo: f.nome, html: miniaturaForma(f.id, 18), acao: () => n.definir(unico.id, { forma: f.id }, `Alterar forma para ${f.nome}`) })) })),
            }),
          },
          { id: "f-editar-pontos", rotulo: "Editar Pontos", titulo: "Mover os nós e alças da forma (converte caixas e elipses em vetor)", icone: "nos", tam: "pequeno", desabilitado: () => !unico || !["forma", "caixa", "elipse"].includes(unico.tipo), acao: () => app.editarNos(unico.id) },
        ] },
        { nome: "Estilos de Forma", icone: "pincel", cmds: [
          {
            id: "gal-estilos", tipo: "estilos", rotulo: "Estilos de forma", colunas: 3, linhas: 1,
            itens: () => ESTILOS_FORMA.map(e => ({ id: e.nome, titulo: e.nome, html: "Abc", estilo: `background:${e.fundo};color:${e.cor};border:2px solid ${e.borda}`, acao: () => aplicar({ "estilo.fundo": e.fundo, "estilo.borda": e.borda, "estilo.cor": e.cor, "estilo.larguraBorda": 1 }, `Estilo ${e.nome}`) })),
            flyout: () => ESTILOS_FORMA.map(e => ({ id: `est-${e.nome}`, rotulo: e.nome, tam: "pequeno", html: `<span class="mini-abc" style="background:${e.fundo};color:${e.cor};border-color:${e.borda}">Abc</span>`, acao: () => aplicar({ "estilo.fundo": e.fundo, "estilo.borda": e.borda, "estilo.cor": e.cor, "estilo.larguraBorda": 1 }, `Estilo ${e.nome}`) })),
          },
          {
            id: "preench", rotulo: "Preenchimento da forma", icone: "preencher", tam: "pequeno",
            flyout: () => ({ tipo: "cores", cores: PALETA, acao: c => aplicar({ "estilo.fundo": c }, `Preenchimento ${c}`),
              extras: [{ id: "sem-preench", rotulo: "Sem preenchimento", icone: "fechar", tam: "pequeno", acao: () => aplicar({ "estilo.fundo": "transparent" }, "Sem preenchimento") },
                { id: "conta-preench", rotulo: "Conta-gotas", icone: "contaGotas", tam: "pequeno", acao: () => app.setFerramenta("conta") }] }),
          },
          {
            id: "contorno", rotulo: "Contorno da forma", icone: "contorno", tam: "pequeno",
            flyout: () => ({ tipo: "cores", cores: PALETA, acao: c => aplicar({ "estilo.borda": c, "estilo.larguraBorda": Math.max(1, unico?.estilo?.larguraBorda || 1) }, `Contorno ${c}`),
              extras: [
                { id: "sem-cont", rotulo: "Sem contorno", icone: "fechar", tam: "pequeno", acao: () => aplicar({ "estilo.larguraBorda": 0 }, "Sem contorno") },
                ...[1, 2, 4, 6].map(w => ({ id: `esp-${w}`, rotulo: `Espessura ${w} px`, icone: "linha", tam: "pequeno", acao: () => aplicar({ "estilo.larguraBorda": w }, `Contorno de ${w} px`) })),
              ] }),
          },
          {
            id: "efeitos-forma", rotulo: "Efeitos da forma", icone: "efeitos", tam: "pequeno",
            flyout: () => [
              ...[["pequena", "Sombra pequena"], ["media", "Sombra média"], ["grande", "Sombra grande"]].map(([v, r]) => ({ id: `ef-${v}`, rotulo: r, icone: "efeitos", tam: "pequeno", acao: () => aplicar({ "estilo.sombra": v }, r) })),
              { id: "ef-desf", rotulo: "Desfoque", icone: "elipse", tam: "pequeno", acao: () => aplicar({ "estilo.desfoque": 4 }, "Desfoque") },
              { id: "ef-vidro", rotulo: "Vidro fosco", icone: "caixa", tam: "pequeno", acao: () => aplicar({ "estilo.vidro": 12 }, "Vidro fosco") },
              { id: "ef-nada", rotulo: "Remover efeitos", icone: "fechar", tam: "pequeno", acao: () => aplicar({ "estilo.sombra": "nenhuma", "estilo.desfoque": 0, "estilo.vidro": 0 }, "Remover efeitos") },
            ],
          },
        ] },
        ...(["botao", "caixa", "container", "forma", "elipse"].includes(unico?.tipo) || (!unico && ids.length) ? [{ nome: "Efeitos de botão", icone: "efeitos", cmds: [
          {
            id: "gal-efeitos-botao", tipo: "estilos", rotulo: "Efeitos de botão", colunas: 4, linhas: 1,
            itens: () => EFEITOS_BOTAO.slice(0, 4).map(e => ({ id: e.id, titulo: `${e.nome} — ${e.desc}`, html: "Abc", estilo: miniaturaEfeitoBotao(e.id), acao: () => n.aplicarEfeitoBotao(e.id) })),
            flyout: () => EFEITOS_BOTAO.map(e => ({ id: `efb-${e.id}`, rotulo: e.nome, titulo: e.desc, tam: "pequeno", html: `<span class="mini-abc" style="${miniaturaEfeitoBotao(e.id)}">Abc</span>`, acao: () => n.aplicarEfeitoBotao(e.id) })),
          },
        ] }] : []),
        ...(ids.some(id => ["texto", "botao", "campo"].includes(n.elemento(id)?.tipo)) ? [{ nome: "Texto", icone: "texto", cmds: [
          { id: "t-negrito", rotulo: "Negrito", icone: "md-format-bold", tam: "pequeno", ativo: () => (unico?.estilo?.peso ?? 400) >= 600, acao: () => aplicar({ "estilo.peso": (unico?.estilo?.peso ?? 400) >= 600 ? 400 : 700 }, "Negrito") },
          ...[["esquerda", "Alinhar à esquerda", "md-format-align-left"], ["centro", "Centralizar texto", "md-format-align-center"], ["direita", "Alinhar à direita", "md-format-align-right"]]
            .map(([v, r, ic]) => ({ id: `t-al-${v}`, rotulo: r, icone: ic, tam: "pequeno", ativo: () => unico?.estilo?.alinhamento === v, acao: () => aplicar({ "estilo.alinhamento": v }, r) })),
          { id: "t-cor", rotulo: "Cor do texto", icone: "md-format-color-text", tam: "pequeno",
            flyout: () => ({ tipo: "cores", cores: PALETA, acao: c => aplicar({ "estilo.cor": c }, `Cor do texto ${c}`) }) },
        ] }] : []),
        { nome: "Fonte e ícone", icone: "fonte", cmds: [
          { id: "f-fonte", rotulo: "Fonte", icone: "fonte", tam: "grande", flyout: () => galeriaFontes(app, unico?.estilo?.fonte) },
          { id: "f-tam-fonte", tipo: "spinner", rotulo: "Tamanho da fonte", icone: "texto", unidade: "pt", valor: () => (unico ? unico.estilo?.tamanhoFonte ?? null : null), aoMudar: v => n.definir(unico.id, { "estilo.tamanhoFonte": Math.max(6, Math.min(200, v)) }, `Fonte ${v} em ${unico.nome}`) },
          ...(ids.some(id => n.elemento(id)?.tipo === "icone")
            ? [{ id: "f-trocar-icone", rotulo: "Trocar ícone", icone: "icone", tam: "pequeno", flyout: () => galeriaIcones(i => app.trocarIcone(i), app.ui.estiloIcones === "colorido") }]
            : []),
        ] },
        { nome: "Organizar", icone: "camadas", cmds: [
          { id: "f-avancar", rotulo: "Avançar", icone: "frente", tam: "pequeno", acao: () => n.camadaVarios(n.selecionados(), "frente") },
          { id: "f-recuar", rotulo: "Recuar", icone: "tras", tam: "pequeno", acao: () => n.camadaVarios(n.selecionados(), "tras") },
          { id: "f-dup", rotulo: "Duplicar", icone: "duplicar", tam: "pequeno", acao: () => n.duplicarVarios(n.selecionados()) },
          {
            id: "f-alinhar", rotulo: "Alinhar", icone: "alinhar", tam: "pequeno",
            flyout: () => [
              ["esquerda", "À esquerda", "al-esq"], ["centroH", "Ao centro", "al-centroH"], ["direita", "À direita", "al-dir"],
              ["topo", "Ao topo", "al-topo"], ["centroV", "Ao meio", "al-centroV"], ["base", "À base", "al-base"],
            ].map(([m, r, ic]) => ({ id: `fal-${m}`, rotulo: r, icone: ic, tam: "pequeno", acao: () => n.alinharVarios(n.selecionados(), m) }))
              .concat([
                { id: "fdist-h", rotulo: "Distribuir na horizontal", icone: "distH", tam: "pequeno", desabilitado: menosDe(3), acao: () => n.distribuir(n.selecionados(), "h") },
                { id: "fdist-v", rotulo: "Distribuir na vertical", icone: "distV", tam: "pequeno", desabilitado: menosDe(3), acao: () => n.distribuir(n.selecionados(), "v") },
              ]),
          },
          {
            id: "f-girar", rotulo: "Girar", icone: "girar", tam: "pequeno",
            flyout: () => [
              { id: "fg-d", rotulo: "Girar 90° à direita", icone: "girar", tam: "pequeno", acao: () => n.girar(n.selecionados(), 90) },
              { id: "fg-e", rotulo: "Girar 90° à esquerda", icone: "girarEsq", tam: "pequeno", acao: () => n.girar(n.selecionados(), -90) },
              { id: "fg-h", rotulo: "Espelhar horizontal", icone: "espelharH", tam: "pequeno", acao: () => n.espelhar(n.selecionados(), "H") },
              { id: "fg-v", rotulo: "Espelhar vertical", icone: "espelharV", tam: "pequeno", acao: () => n.espelhar(n.selecionados(), "V") },
            ],
          },
          { id: "f-exc", rotulo: "Excluir", icone: "excluir", tam: "pequeno", acao: () => n.removerVarios(n.selecionados()) },
        ] },
        { nome: "Tamanho e posição", icone: "altura", cmds: [
          { id: "t-alt", tipo: "spinner", rotulo: "Altura", icone: "altura", valor: () => (unico ? unico.altura : null), aoMudar: v => n.geometria(unico.id, { altura: Math.max(8, v) }, `Altura ${v} em ${unico.nome}`) },
          { id: "t-larg", tipo: "spinner", rotulo: "Largura", icone: "largura", valor: () => (unico ? unico.largura : null), aoMudar: v => n.geometria(unico.id, { largura: Math.max(8, v) }, `Largura ${v} em ${unico.nome}`) },
          { id: "t-x", tipo: "spinner", rotulo: "Posição X", icone: "mao", valor: () => (unico ? unico.x : null), aoMudar: v => n.geometria(unico.id, { x: v }, `Posição X ${v} em ${unico.nome}`) },
          { id: "t-y", tipo: "spinner", rotulo: "Posição Y", icone: "mao", valor: () => (unico ? unico.y : null), aoMudar: v => n.geometria(unico.id, { y: v }, `Posição Y ${v} em ${unico.nome}`) },
        ] },
        { nome: "Comportamento", icone: "estados", cmds: [
          { id: "f-cmp-estados", rotulo: "Estados", titulo: "Hover, clique, foco e desabilitado do elemento", icone: "estados", tam: "grande", acao: () => app.abrirPainelDir("comportamento") },
          { id: "f-cmp-eventos", rotulo: "Eventos", titulo: "O que acontece ao clicar, passar o mouse ou digitar", icone: "raio", tam: "grande", acao: () => app.abrirPainelDir("eventos") },
          { id: "f-cmp-resp", rotulo: "Responsivo", titulo: "Como o elemento se adapta à largura da tela", icone: "telaCheia", tam: "pequeno", acao: () => app.abrirPainelDir("responsivo") },
          { id: "f-cmp-acess", rotulo: "Acessibilidade", titulo: "Papel, nome e foco para leitores de tela", icone: "acess", tam: "pequeno", acao: () => app.abrirPainelDir("acessibilidade") },
          { id: "f-cmp-insp", rotulo: "Inspetor completo", titulo: "Todas as propriedades em um painel só", icone: "propriedades", tam: "pequeno", acao: () => app.abrirPainelDir("inspetor") },
        ] },
        { nome: "Componente", icone: "estrela", cmds: [
          { id: "f-reconhecer", rotulo: "Reconhecer componente", titulo: "Propõe o que as formas selecionadas são (botão, campo, cartão, menu…); nada muda sem você aceitar", icone: "buscar", tam: "pequeno", acao: () => app.reconhecerComponente() },
          { id: "f-vincular", rotulo: "Vincular a ferramenta…", titulo: "Liga um evento a uma ferramenta do armazém, por referência versionada", icone: "link", tam: "pequeno", acao: () => app.vincularSelecao(), desabilitado: () => n.selecionados().length !== 1 },
        ] },
      ],
    });
  }
  return reorganizarAbas(lista, n);
}

/**
 * Todos os comandos dos menus numa lista plana, para a busca (Ctrl+P): uma fonte só,
 * então qualquer comando novo na faixa já aparece na busca com o atalho e o caminho.
 */
/** Mesma definição de abas, com cada comando registrando que foi usado (alimenta recentes e "mais usados"). */
function abas(app) {
  const lista = abasBase(app);
  const envolver = c => {
    if (!c || typeof c.acao !== "function" || c.__uso) return c;
    const original = c.acao;
    return { ...c, __uso: true, acao: (...a) => { app.usou?.(c.id); return medirAcaoRibbon(()=>original(...a),(ok,ms)=>{registrarMetricaRibbon(app.ui,c.id,ok,ms);app.salvarUI();}); } };
  };
  for (const aba of lista) for (const g of aba.grupos ?? []) if (g.cmds) g.cmds = g.cmds.map(function visitar(c) { const v = envolver(c); return Array.isArray(v.flyout) ? { ...v, flyout: v.flyout.map(visitar) } : v; });
  return lista;
}

function comandosDaInterface(app) {
  const out = [];
  const vistos = new Set();
  const visitar = (c, caminho) => {
    if (!c || c.tipo === "spinner" || c.cor !== undefined) return;
    if (c.flyout && !(c.tipo === "galeria" || c.tipo === "estilos" || c.tipo === "temas")) {
      const f = typeof c.flyout === "function" ? c.flyout() : c.flyout;
      if (Array.isArray(f)) for (const x of f) visitar(x, `${caminho} › ${c.rotulo}`);
      return;
    }
    if (!c.acao || vistos.has(c.id)) return;
    vistos.add(c.id);
    out.push({ id: c.id, rotulo: c.rotulo, icone: c.icone ?? "caixa", atalho: c.atalho, caminho, desabilitado: c.desabilitado, acao: c.acao });
  };
  for (const aba of abas(app)) for (const g of aba.grupos) for (const c of g.cmds ?? []) visitar(c, `${aba.rotuloMenu ?? aba.rotulo} › ${g.nome}`);
  for (const aba of abasLegadas(app)) for (const g of aba.grupos) for (const c of g.cmds ?? []) visitar(c, `Ferramentas › ${g.nome}`);
  out.push({id:"oficina-menu",rotulo:"Modelos e ferramentas da Visual Script",icone:"ferramentas",caminho:"Criar › Menus",acao:()=>{app.setModo("forja");app.estudio.abrirAba("modelos");}});
  return out;
}

class Ribbon {
  constructor(app) {
    this.registro = new CommandRegistry(() => ({ app, n: app.n }));
    app.n.on(() => this.registro.notificar());
    this.app = app;
    this.aberto = false; // faixa: no modo recolhido, se o corpo está visível agora
    this.rolagemGaleria = {};
    this.menuAberto = null; // barra de menus: id da aba cujo menu está aberto
    this.niveis = []; // barra de menus: pilha de menus suspensos abertos
    this.raiz = h("header", { class: "ribbon" });
    this.faixa = new FaixaDeOpcoes(this); // recolher, abas ocultas, acesso rápido e menu de botão direito
    this.faixa.ligar(this.raiz);
    this.qatLinha = h("div", { class: "qat-linha", hidden: true });

    // faixa de título: acesso rápido · nome do documento · modos
    this.qat = h("div", { class: "qat", role: "toolbar", "aria-label": "Acesso rápido" });
    this.tecladoQat = motorMenus().tecladoBarra(this.qat);
    this.tituloDoc = h("div", { class: "titulo-doc" });
    this.modos = h("div", { class: "modos", role: "group", "aria-label": "Modo de trabalho" });
    this.listaAbas = h("div", { class: "abas-lista" });
    this.tecladoAbas = motorMenus().tecladoBarra(this.listaAbas);
    this.corpo = h("div", { class: "corpo-ribbon", role: "tabpanel" });
    this.btFixar = h("button", { type: "button", class: "bt-fixar", onclick: () => this.alternarRecolhido() });
    // camada fixa para painéis flutuantes e menus suspensos: fica DENTRO do cabeçalho
    // (conta como "dentro" para recolher), mas não é cortada pelo corpo da faixa
    this.camada = h("div", { class: "camada-menus" });
    this.moldura = h("div", { class: "corpo-moldura" }, this.corpo, this.btFixar);
    this.espaco = h("select", {class:"workspace-menu", "aria-label":"Área de trabalho", onchange:e=>{
      const cfg={interface:{perfil:"criacao",aba:"inicio"},logica:{perfil:"revisao",aba:"comportamento"},entrega:{perfil:"completo",aba:"arquivo"}}[e.target.value];
      this.ui.areaTrabalho=e.target.value;this.ui.orquestrador={...this.ui.orquestrador,...cfg,organizar:true,autoformatar:true,limite:6};this.ui.aba=cfg.aba;this.ui.ribbonRecolhido=false;this.app.salvarUI();this.app.render();
    } }, [["interface","Criar interface"],["logica","Lógica e eventos"],["entrega","Revisar e exportar"]].map(([id,nome])=>h("option",{value:id},nome)));
    this.btBuscar = h("button",{type:"button",class:"modo",title:"Buscar ferramentas (Ctrl+K)",onclick:()=>this.app.barra.focarBusca()},"Buscar");
    this.btOficina = h("button",{type:"button",class:"modo bt-oficina",title:"Visual Script VisualScript (F7 ou Ctrl+Shift+O)",onclick:()=>this.app.setModo("forja")},"Visual Script VisualScript");
    this.barraTitulo = h("div", { class: "barra-titulo" },
      h("div", { class: "marca", html: `${icone("bigorna", 16)}<span>HEPHAESTUS <small>2.1</small></span>` }),
      this.qat, this.tituloDoc, this.espaco, this.btBuscar, this.btOficina, this.modos);
    this.keyTips = motorMenus().instalarKeyTips(this.raiz);
    this.raiz.append(
      this.barraTitulo,
      h("div", { class: "abas" }, this.listaAbas, (this.toggleHP=h("div", {class:"hp-workspace-toggle",role:"group","aria-label":"Área de trabalho"}))),
      this.moldura,
      this.qatLinha,
      this.camada
    );

    document.addEventListener('scroll',()=>{
      for(const nv of this.niveis){const ancora=nv.pai||this.listaAbas.querySelector('[data-menu="'+this.menuAberto+'"]');if(ancora)this.posicionarMenu(nv.el,ancora.getBoundingClientRect(),nv.pai?'direita':'baixo');}
      this.posicionarSolto();
    },true);
    new ResizeObserver(() => this.compactar()).observe(this.corpo);
    window.addEventListener("resize", () => {
      for (const nivel of this.niveis) {
        const ancora = nivel.pai ?? this.listaAbas.querySelector(`[data-menu="${this.menuAberto}"]`);
        this.posicionarMenu(nivel.el, ancora?.getBoundingClientRect() ?? nivel.ancora, nivel.pai ? "direita" : "baixo");
      }
      this.posicionarSolto();
    });
    // recolher quando não está em uso
    document.addEventListener("pointerdown", e => {
      if (this.raiz.contains(e.target)) return;
      if (this.menuAberto) this.fecharMenus();
      if (this.aberto) this.fechar();
      else if (this.ui.flyout && this.solto) { this.ui.flyout = null; this.render(); }
    });
    this.raiz.addEventListener("pointerleave", e => {
      // no toque o pointerleave chega logo após soltar o dedo: a faixa só fecha tocando fora
      if (!this.ui.ribbonRecolhido || !this.aberto || this.classico || e.pointerType === "touch") return;
      clearTimeout(this.timerFechar);
      this.timerFechar = setTimeout(() => {
        const focoDentro = this.raiz.contains(document.activeElement) && /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName);
        if (!this.ui.flyout && !focoDentro) this.fechar();
      }, 1400);
    });
    this.raiz.addEventListener("pointerenter", () => clearTimeout(this.timerFechar));
  }

  get ui() { return this.app.ui; }
  /** Comandos da faixa (para a Barra de Acesso Rápido). */
  comandos() { return comandosDaInterface(this.app); }
  get classico() { return this.ui.estiloMenu === "classico"; }

  /**
   * Dicas de tecla (Alt): mostra uma letra sobre cada aba; apertar a letra abre a aba.
   * A letra é a primeira do nome que ainda não foi usada, para nunca haver duas iguais.
   */
  dicasDeTecla() {
    this.fecharDicas();
    const botoes = [...this.listaAbas.querySelectorAll("button.aba")];
    const usadas = new Set(), mapa = new Map();
    for (const b of botoes) {
      const nome = (b.querySelector(".aba-txt")?.textContent ?? b.textContent).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      const letra = [...nome].find(ch => /[a-z0-9]/.test(ch) && !usadas.has(ch));
      if (!letra) continue;
      usadas.add(letra); mapa.set(letra, b);
    }
    this.dicas = { mapa, marcas: [] };
    for (const [letra, b] of mapa) {
      const r = b.getBoundingClientRect();
      const m = h("span", { class: "dica-tecla", style: `position:fixed;left:${r.left + r.width / 2 - 8}px;top:${r.bottom - 8}px` }, letra);
      document.body.append(m);
      this.dicas.marcas.push(m);
    }
    this._dicaTecla = e => {
      if (e.key === "Alt" || e.key === "Shift" || e.key === "Control") return;
      e.preventDefault(); e.stopPropagation();
      const b = this.dicas?.mapa.get(e.key.toLowerCase());
      this.fecharDicas();
      if (b) b.click();
    };
    document.addEventListener("keydown", this._dicaTecla, true);
    document.addEventListener("pointerdown", () => this.fecharDicas(), { once: true, capture: true });
  }
  fecharDicas() {
    if (!this.dicas) return;
    this.dicas.marcas.forEach(m => m.remove());
    document.removeEventListener("keydown", this._dicaTecla, true);
    this.dicas = null;
  }

  /** Alterna entre faixa fixa e faixa que se recolhe sozinha. */
  alternarRecolhido() {
    if (this.classico) return;
    this.faixa.guardarLayout(); this.ui.ribbonRecolhido = !this.ui.ribbonRecolhido;
    this.aberto = false;
    this.app.salvarUI();
    this.app.render();
  }

  fechar() {
    if (!this.aberto) return;
    this.aberto = false;
    this.ui.flyout = null;
    this.ui.grupoAberto = null;
    this.app.render();
  }

  autoformatarMenus() {
    this.faixa.guardarLayout();
    if (!this.ui.orquestrador?.autoformatar) this.ui.menusAntesAutoformatar = { ...(this.ui.orquestrador ?? {}) };
    this.ui.orquestrador = padraoRecomendado(this.ui.orquestrador);
    this.app.salvarUI(); this.app.render();
    this.app.mensagem("Menus autoformatados: ícones 32/16 px, pilhas de até 3 e grupos de até 6 ações simples. Restaure em Ajuda › Organizar menus.");
  }

  configurarOrquestrador() {
    const atual = this.ui.orquestrador ?? {};
    const perfil = h("select", { "aria-label": "Perfil de trabalho" }, Object.entries(PERFIS_FAIXA).map(([id,p]) => h("option", { value: id, selected: (atual.perfil ?? "completo") === id }, p.nome)));
    const limite = h("input", { type: "number", min: 3, max: 12, value: atual.limite ?? 6, "aria-label": "Comandos por grupo" });
    const autoformatar = h("input", { type: "checkbox", checked: !!atual.autoformatar });
    const organizar = h("input", { type: "checkbox", checked: atual.organizar !== false });
    const itens = auditarFaixa(abasBase(this.app), atual.limite ?? 6);
    this.app.dialogo({ titulo: "Organização e boas práticas", icone: "ferramentas",
      texto: "O perfil prioriza abas. Grupos extensos usam Mais; todos os comandos continuam disponíveis na busca. A auditoria do projeto permite revisar e desfazer as correções.",
      corpo: h("div", { class: "orquestrador-config" },
        h("label", {}, "Perfil de trabalho ", perfil), h("label", {}, "Comandos visíveis por grupo ", limite),
        h("label", {}, organizar, " Organizar grupos automaticamente"),
        h("label", {}, autoformatar, " Padronizar tamanhos e rótulos"),
        h("p", {}, "Padrão recomendado: ícones 32/16 px, uma ação em destaque por grupo, pilhas de até 3 ações, rótulos concisos com descrição completa na dica."),
        h("p", {}, `${itens.length} recomendações para o catálogo atual`),
        h("ul", { class: "orquestrador-relatorio" }, itens.map(i => h("li", {}, `${i.caminho}: ${i.mensagem}`)))),
      opcoes: [ { id: "auto", rotulo: "Autoformatar menus", fazer: () => this.autoformatarMenus() },
        ...(this.ui.menusAntesAutoformatar ? [{ id: "restaurar", rotulo: "Restaurar anterior", fazer: () => {
          this.ui.orquestrador = { ...this.ui.menusAntesAutoformatar }; delete this.ui.menusAntesAutoformatar;
          this.app.salvarUI(); this.app.render();
        } }] : []),
        { id: "aplicar", rotulo: "Aplicar", primario: true, fazer: () => {
        const valor = Number(limite.value);
        if (autoformatar.checked && !atual.autoformatar) this.ui.menusAntesAutoformatar = { ...atual };
        this.ui.orquestrador = { autoformatar: autoformatar.checked, perfil: perfil.value, organizar: organizar.checked, limite: Number.isFinite(valor) ? Math.max(3, Math.min(12, Math.round(valor))) : 6 };
        this.app.salvarUI(); this.app.render();
      } }, { id: "cancelar", rotulo: "Cancelar", fazer: () => {} } ] });
  }

  render() {
    const inicioRender=performance.now();
    this.espaco.value=this.ui.areaTrabalho??"interface";
    const eraVisivel=this._visivelRibbon,abaAnterior=this._abaRibbon;
    const retAnterior=eraVisivel?this.moldura.getBoundingClientRect():null;
    const copiaAnterior=eraVisivel&&this.ui.ribbonRecolhido&&!this.aberto?this.moldura.cloneNode(true):null;
    this.menuAdaptativo?.destruir(); this.menuAdaptativo = null;
    this.empilhar ??= new Set();
    definirEmpilhar(this.empilhar);
    for (const c of this.comandos()) this.registro.registrar(c);
    const todas = abas(this.app);
    this.todas = todas;
    if (!todas.some(a => a.id === this.ui.aba)) this.ui.aba = "inicio";
    { const vis = this.faixa.abasVisiveis(todas); if (!vis.some(a => a.id === this.ui.aba)) this.ui.aba = vis[0].id; }
    const classico = this.classico;
    const auto = !classico && !!this.ui.ribbonRecolhido;
    const visivel = !auto || this.aberto;
    this.raiz.dataset.densidade=this.ui.densidadeFaixa??"confortavel";
    this.raiz.classList.toggle("classico", classico);
    this.raiz.classList.toggle("autoformatada", !!this.ui.orquestrador?.autoformatar);
    this.raiz.classList.toggle("recolhido", auto);
    this.raiz.classList.toggle("aberto", auto && this.aberto);
    this.btFixar.innerHTML = icone(auto ? "alfinete" : "setaCima", 15);
    this.btFixar.title = auto ? "Fixar a faixa de opções (Ctrl+F1)" : "Recolher a faixa de opções quando não estiver em uso (Ctrl+F1)";
    this.btFixar.setAttribute("aria-label", this.btFixar.title);

    // acesso rápido
    const n = this.app.n;
    const { itens, cursor } = n.historico();
    const botoes = this.faixa.botoesQat((id, c) => botaoIcone(c.icone, c.titulo, () => (c.fixo ? c.acao() : this.executar(() => this.registro.executar(id))),
      { tam: 16, class: "qat-bt", attrs: { disabled: !!c.desab, "data-qat": id, ...(c.pressionado === undefined ? {} : { "aria-pressed": String(c.pressionado) }) } }));
    const abaixo = this.faixa.qatAbaixo && !classico;
    this.qat.replaceChildren(...(abaixo ? [] : botoes));
    this.qatLinha.hidden = !abaixo;
    this.qatLinha.replaceChildren(...(abaixo ? botoes : []));
    this.qat.hidden = abaixo;
    this.tecladoQat.atualizar();
    this.tituloDoc.textContent = this.app.n.nome;

    if(!this.toggleHP.childElementCount) this.toggleHP.replaceChildren(h("span",{class:"hp-toggle-indicator","aria-hidden":"true"}),...[["designer","DESIGNER","design"],["visual-script","CÓDIGO","codigo"]].map(([id,rot,ic])=>h("button",{type:"button","data-area":id,"aria-pressed":"false",title:id==="designer"?"Designer — criar a interface (F7)":"Código — blocos, grafo e código-fonte (F7)",onclick:()=>this.app.setModo(id==="designer"?id:"codigo")},h("span",{html:icone(ic,15)}),rot)));
    this.toggleHP.dataset.area=this.ui.areaAtiva;
    for(const bt of this.toggleHP.querySelectorAll('button'))bt.setAttribute('aria-pressed',String(bt.dataset.area===this.ui.areaAtiva));
    this.modos.replaceChildren(); // Os dois modos ficam nos controles flutuantes compartilhados.

    this.removerSolto();
    if (classico) {
      this._visivelRibbon=false;
      this.moldura.hidden = true;
      this.renderMenubar(todas);
      this.tecladoAbas.atualizar();
      return;
    }
    this.fecharMenus();
    this.moldura.hidden = false;
    this.listaAbas.className = "abas-lista";
    this.listaAbas.setAttribute("role", "tablist");
    this.listaAbas.setAttribute("aria-label", "Abas do menu");
    this.listaAbas.replaceChildren(...this.faixa.abasVisiveis(todas).map(a => {
      const selecionada = a.id === this.ui.aba && visivel;
      return h("button", {
        type: "button", role: "tab", class: `aba ${a.classe ?? ""}`, "aria-selected": String(selecionada),
        onclick: () => {
          this._inicioEscolha=performance.now();this.metricaInteracao("trocar-aba");
          const mesma = this.ui.aba === a.id;
          this.ui.aba = a.id;
          this.ui.flyout = null;
          this.ui.grupoAberto = null;
          if (auto) this.aberto = !(mesma && this.aberto);
          this.app.salvarUI();
          this.app.render();
        },
        ondblclick: () => this.alternarRecolhido(),
      }, a.contexto ? h("span", { class: "ctx-rotulo" }, a.contexto) : null, h("span", { class: "aba-txt" }, a.rotulo));
    }));

    const aba = todas.find(a => a.id === this.ui.aba);
    this.corpo.dataset.dens = ["compacta", "normal", "folgada"][this.ui.densidade ?? 1];
    this.corpo.replaceChildren(...aba.grupos.map(g => this.grupo(g)));
    this.tecladoAbas.atualizar();
    // no celular os grupos empilham num painel rolável (CSS): nada vai para "Mais"
    if (!globalThis.matchMedia?.("(max-width: 700px)").matches) this.menuAdaptativo = motorMenus().instalar(this.corpo, [...this.corpo.children].filter(e => e.classList.contains("grupo")).map((el, i) => ({ el, nome: aba.grupos[i].nome, prioridade: aba.grupos[i].prioridade ?? 100 })), { editor: true, camada: this.camada });
    const visivelRibbon=!this.ui.ribbonRecolhido||!!this.aberto;
    if(visivelRibbon&&(!eraVisivel||abaAnterior!==this.ui.aba))animarMenu(this.moldura,this.ui);
    if(!visivelRibbon&&eraVisivel&&copiaAnterior&&retAnterior){
      copiaAnterior.inert=true;copiaAnterior.setAttribute('aria-hidden','true');copiaAnterior.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
      copiaAnterior.style.cssText=`display:block;position:fixed;left:${retAnterior.left}px;top:${retAnterior.top}px;width:${retAnterior.width}px;height:${retAnterior.height}px;pointer-events:none;z-index:99999;overflow:hidden`;
      this.camada.append(copiaAnterior);const a=animarMenu(copiaAnterior,this.ui,true);if(a)a.finished.catch(()=>{}).finally(()=>copiaAnterior.remove());else copiaAnterior.remove();
    }
    this._visivelRibbon=visivelRibbon;this._abaRibbon=this.ui.aba;
    requestAnimationFrame(() => {this.compactar();this.metricaInteracao("render",performance.now()-inicioRender);});
  }

  grupo(g) {
    const cmds = h("div", { class: "grupo-cmds" });
    if (g.campo) {
      const entrada = h("input", { id: "nome-projeto", type: "text", value: this.app.n.nome, "aria-label": "Nome do projeto",
        onchange: e => this.app.n.definir("__canvas", { nome: e.target.value.trim() || "Projeto sem título" }, "Renomear projeto") });
      cmds.append(h("label", { class: "campo-ribbon" }, "Nome do projeto", entrada));
    }
    let pilha = null;
    for (const c of g.cmds ?? []) {
      let el;
      if (c.tipo === "galeria" || c.tipo === "estilos" || c.tipo === "temas") el = this.galeria(c);
      else if (c.tipo === "spinner") el = this.spinner(c);
      else el = this.comando(c);
      if (c.tam === "icone") {
        if (!pilha || pilha.dataset.tipo !== "icone") cmds.append((pilha = h("div", { class: "grade-icones", "data-tipo": "icone" })));
        pilha.append(el);
      } else if (c.tam === "medio") {
        if (!pilha || pilha.dataset.tipo !== "medio" || pilha.childElementCount >= 2) cmds.append((pilha = h("div", { class: "pilha-med", "data-tipo": "medio" })));
        pilha.append(el);
      } else if (c.tam === "pequeno" || c.tipo === "spinner") {
        const max = c.tipo === "spinner" ? 2 : 3;
        if (!pilha || pilha.childElementCount >= max || pilha.dataset.tipo !== (c.tipo ?? "cmd")) {
          cmds.append((pilha = h("div", { class: "pilha-peq", "data-tipo": c.tipo ?? "cmd" })));
        }
        pilha.append(el);
      } else {
        pilha = null;
        cmds.append(el);
      }
      if (c.flyout && this.ui.flyout === c.id) {
        const f = this.flyout(c);
        if (f.dataset.flutuante === "true") requestAnimationFrame(() => this.soltar(f));
        else cmds.append(f);
        pilha = null;
      }
    }
    const recolhido = h("button", {
      type: "button", class: "cmd grande grupo-recolhido", title: g.nome,
      "aria-expanded": "false",
      onclick: () => { delete (this.ui.gruposRecolhidos??={})[this.ui.aba+"::"+g.nome];this.ui.grupoAberto = g.nome; this.metricaInteracao("expandir-grupo");this.app.salvarUI();this.render(); },
      html: `${icone(g.icone ?? "caixa", 30)}<span class="cmd-txt">${g.nome}${icone("setaBaixo", 12).replace('class="ic"', 'class="ic seta"')}</span>`,
    });
    return h("div", { class: "grupo", "data-grupo": g.nome, "data-protegido": String(this.ui.gruposFixados?.[this.ui.aba+"::"+g.nome] || this.ui.grupoAberto === g.nome || (g.cmds ?? []).some(c => c.id === this.ui.flyout)) },
      cmds, recolhido, h("div", { class: "grupo-rotulo" }, g.nome,
        LANCADORES[g.nome] ? h("button", {
          type: "button", class: "iniciador", title: `Abrir o painel ${LANCADORES[g.nome]} à direita`, "aria-label": `Abrir configurações de ${g.nome}`,
          html: icone("setaDiagonal", 9), onclick: e => { e.stopPropagation(); this.app.abrirPainelDir(LANCADORES[g.nome]); },
        }) : null));
  }

  /** Executa a ação de um comando e recolhe a faixa se ela estiver no modo automático. */
  executar(acao) {
    if(this._inicioEscolha!=null){this.metricaInteracao("tempo-aba-ate-comando",performance.now()-this._inicioEscolha);this._inicioEscolha=null;}
    if (this.ui.grupoAberto) this.ui.grupoAberto = null;
    if (this.classico && FAIXA_NO_MENU.has(this.menuAberto)) this.fecharMenus();
    if (this.solto) this.ui.flyout = null;
    acao?.();
    if (this.ui.ribbonRecolhido && this.aberto) {
      this.aberto = false;
      this.ui.flyout = null;
      this.app.render();
    } else this.app.render();
  }

  metricaInteracao(tipo,ms=0) {
    const b=this.ui.interacoesFaixa??={};const a=b[tipo]??{quantidade:0,totalMs:0};b[tipo]={quantidade:a.quantidade+1,totalMs:a.totalMs+Math.max(0,ms),ultimaEm:Date.now()};
  }

  alternarFlyout(id) {
    this.metricaInteracao("overflow-ou-flyout");
    this.ui.flyout = this.ui.flyout === id ? null : id;
    this.render();
  }

  comando(c) {
    this.registro.registrar(c);
    const estado = this.registro.estado(c.id);
    const desab = !estado.habilitado;
    const ativo = c.flyout ? this.ui.flyout === c.id : estado.marcado;
    const visual = c.cor !== undefined
      ? `<span class="amostra-cmd" style="background:${c.cor === "transparent" ? "repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 0 0/8px 8px" : c.cor}"></span>`
      : c.html ?? iconeHephaestus(c.icone,c.tam === "grande" ? 32 : 19) ?? ((this.ui.iconesCor === false || iconesWindowsAtivos()) ? iconeMenu(c.icone, c.tam === "grande" ? 32 : c.tam === "medio" ? 22 : 18) : iconeColorido(c.icone, c.tam === "grande" ? 34 : c.tam === "medio" ? 22 : 19));
    const seta = c.flyout ? icone(ativo ? "setaDir" : "setaBaixo", 12).replace('class="ic"', 'class="ic seta"') : "";
    const titulo = `${c.titulo ?? c.rotulo}${c.atalho ? ` (${c.atalho})` : ""}`;
    const attrs = {
      type: "button", class: `cmd ${c.tam === "grande" ? "grande" : c.tam === "icone" ? "pequeno so-icone" : c.tam === "medio" ? "medio" : c.cor !== undefined ? "cor" : "pequeno"}`, title: titulo, disabled: desab,
      html: c.tam === "grande"
        ? `${visual}<span class="cmd-txt">${c.rotulo}${seta}</span>`
        : c.cor !== undefined || c.tam === "icone" ? visual : `${visual}<span class="cmd-txt">${c.rotulo}</span>${seta}`,
      onclick: () => (c.flyout ? this.alternarFlyout(c.id) : this.executar(() => this.registro.executar(c.id))),
      "data-cmd": c.id, hidden: !estado.visivel,
    };
    if (c.cor !== undefined || c.tam === "icone") attrs["aria-label"] = titulo;
    if (c.flyout) attrs["aria-expanded"] = String(!!ativo);
    else if (c.ativo) attrs["aria-pressed"] = String(!!ativo);
    return h("button", attrs);
  }

  /** Galeria inline (formas, estilos ou temas) com setas de rolar e botão "mais" que abre a galeria completa. */
  galeria(c) {
    const itens = c.itens();
    const linhas = c.linhas ?? 3;
    const colunas = c.colunas ?? 6;
    const porPagina = linhas * colunas;
    const totalLinhas = Math.ceil(itens.length / colunas);
    const inicio = Math.min(this.rolagemGaleria[c.id] ?? 0, Math.max(0, totalLinhas - linhas));
    const visiveis = itens.slice(inicio * colunas, inicio * colunas + porPagina);
    const desab = c.desabilitado?.() ?? false;
    const grade = h("div", { class: `galeria-grade ${c.tipo}`, style: `grid-template-columns:repeat(${colunas}, auto)` },
      visiveis.map(it => h("button", {
        type: "button", class: `galeria-item ${it.ativo ? "ativo" : ""}`, title: it.titulo, "aria-label": it.titulo, disabled: desab,
        "aria-pressed": it.ativo === undefined ? null : String(!!it.ativo),
        html: it.html, style: it.estilo ?? "",
        onclick: () => this.executar(it.acao),
      })));
    const rolar = d => { this.rolagemGaleria[c.id] = Math.max(0, Math.min(totalLinhas - linhas, inicio + d)); this.render(); };
    const lateral = h("div", { class: "galeria-setas" },
      h("button", { type: "button", title: "Linha anterior", disabled: inicio === 0, onclick: () => rolar(-1), html: icone("setaCima", 10) }),
      h("button", { type: "button", title: "Próxima linha", disabled: inicio >= totalLinhas - linhas, onclick: () => rolar(1), html: icone("setaBaixo", 10) }),
      c.flyout ? h("button", { type: "button", title: `${c.rotulo}: ver todos`, "data-cmd": c.id, "aria-expanded": String(this.ui.flyout === c.id), onclick: () => this.alternarFlyout(c.id), html: icone(this.ui.flyout === c.id ? "setaDir" : "mais", 10) }) : null);
    return h("div", { class: `galeria ${c.tipo}`, role: "group", "aria-label": c.rotulo }, grade, lateral);
  }

  /** Campo numérico com ícone (como Altura/Largura do PowerPoint). */
  spinner(c) {
    const desab = c.desabilitado?.() ?? false;
    const v = c.valor();
    const entrada = h("input", {
      type: "number", class: "num", value: v ?? "", disabled: desab || v === null, "aria-label": c.rotulo, step: c.passo ?? 1, min:c.min, max:c.max,
      onchange: e => { const n = Number(e.target.value); if (!Number.isNaN(n)) this.executar(() => c.aoMudar(n)); },
    });
    return h("label", { class: "spinner", title: c.rotulo }, h("span", { html: icone(c.icone, 18) }), entrada, h("span", { class: "spinner-un" }, c.unidade ?? "px"));
  }

  /** Conteúdo do flyout: lista de comandos, galeria por categorias, fontes, modelos ou paleta de cores. */
  flyout(c) {
    const f = typeof c.flyout === "function" ? c.flyout() : c.flyout;
    const caixa = h("div", { class: "flyout", role: "group", "aria-label": c.rotulo, "data-de": c.id, "data-flutuante": String(!!f.flutuante) });
    if (Array.isArray(f)) {
      const grade=h("div", { class: "flyout-grade" }, f.map(x => this.comando(x)));
      const busca=h("input",{type:"search",placeholder:"Buscar neste grupo…","aria-label":"Buscar comandos de "+c.rotulo});
      busca.oninput=()=>{const q=busca.value.toLocaleLowerCase();for(const b of grade.children)b.hidden=!((b.textContent+' '+b.title).toLocaleLowerCase().includes(q));};
      busca.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();this.ui.flyout=null;this.render();this.corpo.querySelector('[data-cmd="'+CSS.escape(c.id)+'"]')?.focus();}};
      caixa.append(busca,grade);
    } else if (f.tipo === "categorias" || f.tipo === "modelos" || f.tipo === "fontes") {
      caixa.classList.add("flyout-categorias", `flyout-${f.tipo}`);
      if (f.variante) caixa.classList.add(`flyout-${f.variante}`);
      for (const cat of f.categorias) {
        caixa.append(h("div", { class: "flyout-cat" },
          h("div", { class: "flyout-cat-nome" }, cat.nome),
          h("div", { class: "flyout-cat-grade" }, cat.itens.map(it => h("button", {
            type: "button", class: `galeria-item ${it.ativo ? "ativo" : ""}`, title: it.titulo, "aria-label": it.titulo,
            style: it.estilo ?? "",
            html: f.tipo === "categorias" ? it.html : f.tipo === "modelos" ? `${it.html}<span>${it.rotulo}</span>` : "",
            onclick: () => this.executar(it.acao),
          }, f.tipo === "fontes" ? it.rotulo : null)))));
      }
    } else if (f.tipo === "cores") {
      caixa.classList.add("flyout-cores");
      caixa.append(
        h("div", { class: "paleta-ribbon" }, f.cores.map(cor => this.comando({ id: `${c.id}-${cor}`, rotulo: cor, titulo: cor, cor, acao: () => f.acao(cor) }))),
        h("div", { class: "flyout-grade" }, (f.extras ?? []).map(x => this.comando(x))));
    }
    return caixa;
  }

  // ---------------- flyout solto (quando não cabe na faixa) ----------------
  /** Tira o flyout da faixa e o mostra como painel flutuante sob o comando que o abriu. */
  soltar(f) {
    this.removerSolto();
    f.classList.add("flutuante");
    f.dataset.flutuante = "true";
    this.camada.append(f);
    this.solto = f;
    this.posicionarSolto();
    animarMenu(f,this.ui);
    this.compactar();
  }

  posicionarSolto() {
    const f = this.solto;
    if (!f) return;
    const ancora = this.corpo.querySelector(`[data-cmd="${CSS.escape(f.dataset.de)}"]`) ?? this.corpo;
    const r = ancora.getBoundingClientRect();
    const base = this.moldura.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    f.style.maxWidth = `${vw - 16}px`;
    motorMenus().limitarPainel(f,r);
  }

  removerSolto() {
    this.solto?.remove();
    this.solto = null;
  }

  /** Compacta grupos da direita para a esquerda até caber; o grupo com flyout aberto nunca compacta.
   *  Se mesmo assim não couber, o flyout aberto sai da faixa e vira painel flutuante. */
  compactar() {
    if (this.menuAdaptativo) { this.menuAdaptativo.atualizar(); return; }
    const gs = [...this.corpo.querySelectorAll(".grupo")];
    for (const g of gs) g.dataset.nivel = this.ui.gruposRecolhidos?.[this.ui.aba+"::"+g.dataset.grupo] ? "3" : "0";
    // Sobrou espaço → comandos grandes, sem empilhar; faltou → empilha (pequenos/médios) só nesta aba.
    const larg = this.corpo.clientWidth;
    if (this.empilhar?.has(this.ui.aba) && larg > (this.largEmp?.[this.ui.aba] ?? 1e9) + 60) { this.empilhar.delete(this.ui.aba); this.render(); return; }
    if (this.empilhar && !this.empilhar.has(this.ui.aba) && this.corpo.scrollWidth > larg + 1) { this.empilhar.add(this.ui.aba); (this.largEmp ??= {})[this.ui.aba] = larg; this.render(); return; }
    // Sem barra de rolagem horizontal: enquanto não couber, o grupo mais largo perde o rótulo, depois os textos, depois vira um botão.
    for (let i = 0; i < gs.length * 3 && this.corpo.scrollWidth > this.corpo.clientWidth + 1; i++) {
      // Grupos fixados ou recolhidos pela pessoa ficam como estão; cede primeiro o menos usado (casa 0.36), depois o mais largo.
      const uso = g => [...g.querySelectorAll("[data-cmd]")].reduce((n, b) => n + (this.ui.uso?.[b.dataset.cmd]?.n || 0), 0);
      const largura = g => g.getBoundingClientRect?.().width ?? 0;
      const cand = gs.filter(g => +g.dataset.nivel < 3 && g.dataset.protegido !== "true" && !this.ui.gruposRecolhidos?.[this.ui.aba+"::"+g.dataset.grupo])
        .sort((a, b) => uso(a) - uso(b) || largura(b) - largura(a))[0];
      if (!cand) break;
      cand.dataset.nivel = String(+cand.dataset.nivel + 1);
    }
    // Ícones/itens cortados na vertical: reduz os que não cabem.
    this.corpo.classList?.remove("apertado");
    if (gs.some(g => { const c = g.querySelector?.(".grupo-cmds"); return c && c.scrollHeight > c.clientHeight + 1; })) this.corpo.classList.add("apertado");
    const inline = this.corpo.querySelector(".flyout");
    if (inline && inline.scrollWidth > this.corpo.clientWidth) this.soltar(inline);
  }

  // ---------------- barra de menus (estilo Clip Studio) ----------------
  renderMenubar(todas) {
    this.listaAbas.className = "menubar";
    this.listaAbas.setAttribute("role", "menubar");
    this.listaAbas.setAttribute("aria-label", "Menus");
    this.listaAbas.replaceChildren(...todas.map(a => h("button", {
      type: "button", role: "menuitem", class: `menubar-item ${a.classe ?? ""}`, "aria-haspopup": "menu",
      "aria-expanded": String(this.menuAberto === a.id), "data-menu": a.id,
      title: a.contexto ?? "",
      onclick: () => (this.menuAberto === a.id ? this.fecharMenus() : this.abrirMenu(a.id)),
      onpointerenter: () => { if (this.menuAberto && this.menuAberto !== a.id) this.abrirMenu(a.id); },
      onkeydown: e => {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); this.abrirMenu(a.id, true); }
        else if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); this.vizinhoMenubar(a.id, e.key === "ArrowRight" ? 1 : -1, false); }
        else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); this.fecharMenus(); }
      },
    }, a.rotuloMenu ?? a.rotulo)));
    if (this.menuAberto) {
      if (todas.some(a => a.id === this.menuAberto)) this.abrirMenu(this.menuAberto);
      else this.fecharMenus();
    }
  }

  focarMenubar() {
    const bt = this.listaAbas.querySelector(".menubar-item");
    bt?.focus();
  }

  vizinhoMenubar(id, d, abrir = true) {
    const ids = this.todas.map(a => a.id);
    const prox = ids[(ids.indexOf(id) + d + ids.length) % ids.length];
    if (abrir) this.abrirMenu(prox, true);
    else this.listaAbas.querySelector(`[data-menu="${prox}"]`)?.focus();
  }

  abrirMenu(id, focar = false) {
    const aba = this.todas.find(a => a.id === id);
    if (!aba) return;
    this.fecharNiveis(0);
    this.menuAberto = id;
    for (const b of this.listaAbas.children) b.setAttribute("aria-expanded", String(b.dataset.menu === id));
    const bt = this.listaAbas.querySelector(`[data-menu="${id}"]`);
    // Inserir e Formatar abrem como faixa de opções (grupos com ícones grandes), não como lista
    if (FAIXA_NO_MENU.has(id)) { this.abrirFaixaSuspensa(aba, bt); return; }
    const entradas = [];
    // abas com muitos grupos viram um menu em seções (título + comandos, em colunas); as pequenas mantêm submenus
    const emSecoes = aba.grupos.length > 4;
    aba.grupos.forEach(g => {
      const filhos = [];
      if (g.campo) filhos.push({ tipo: "campo" });
      for (const c of g.cmds ?? []) filhos.push(this.entradaDe(c));
      if (!filhos.length) return;
      if (emSecoes) entradas.push({ tipo: "secao", rotulo: g.nome, filhos });
      else entradas.push({ tipo: "sub", rotulo: g.nome, icone: g.icone ?? "ferramentas", filhos: () => filhos });
    });
    this.abrirNivel(0, entradas, bt.getBoundingClientRect(), "baixo", aba.rotuloMenu ?? aba.rotulo, focar, emSecoes);
  }

  abrirFaixaSuspensa(aba, bt) {
    const r = bt.getBoundingClientRect();
    const painel = h("div", { class: "faixa-suspensa", role: "region", "aria-label": aba.rotuloMenu ?? aba.rotulo },
      h("div", { class: "corpo-ribbon" }, aba.grupos.map(g => this.grupo(g))));
    this.camada.append(painel);
    this.niveis.push({ el: painel, pai: null, ancora: r });
    motorMenus().limitarPainel(painel,r);animarMenu(painel,this.ui);
  }

  fecharMenus() {
    if (!this.menuAberto && !this.niveis.length) return;
    this.fecharNiveis(0);
    this.menuAberto = null;
    for (const b of this.listaAbas.children) b.setAttribute?.("aria-expanded", "false");
  }

  fecharNiveis(desde) {
    while (this.niveis.length > desde) {
      const nv = this.niveis.pop();
      nv.seguro?.destruir();
      nv.el.remove();
      nv.pai?.setAttribute("aria-expanded", "false");
    }
  }

  /** Converte um comando da faixa numa entrada de menu suspenso. */
  entradaDe(c) {
    if (c.tipo === "spinner") return { tipo: "spinner", c };
    if (c.tipo === "galeria" || c.tipo === "estilos" || c.tipo === "temas") {
      return { tipo: "sub", rotulo: c.rotulo, icone: c.icone ?? (c.tipo === "temas" ? "tema" : c.tipo === "estilos" ? "pincel" : "estrela"), desabilitado: c.desabilitado,
        filhos: () => (c.flyout ? this.entradasDeFlyout(c.flyout) : [{ tipo: "grade", itens: c.itens() }]) };
    }
    if (c.flyout) return { tipo: "sub", rotulo: c.rotulo, icone: c.icone, html: c.html, desabilitado: c.desabilitado, filhos: () => this.entradasDeFlyout(c.flyout) };
    return { tipo: "item", c };
  }

  entradasDeFlyout(fl) {
    const f = typeof fl === "function" ? fl() : fl;
    if (Array.isArray(f)) return f.map(x => this.entradaDe(x));
    if (f.tipo === "categorias") return f.categorias.map(cat => ({ tipo: "sub", rotulo: cat.nome, html: cat.itens[0]?.html, filhos: () => [{ tipo: "grade", itens: cat.itens }] }));
    if (f.tipo === "modelos") return f.categorias.map(cat => ({ tipo: "sub", rotulo: cat.nome, icone: "modelo", filhos: () => [{ tipo: "modelos", itens: cat.itens }] }));
    if (f.tipo === "fontes") return f.categorias.map(cat => ({ tipo: "sub", rotulo: cat.nome, icone: "fonte",
      filhos: () => cat.itens.map(it => ({ tipo: "item", c: { rotulo: it.rotulo, estiloTexto: it.estilo, ativo: () => it.ativo, acao: it.acao } })) }));
    if (f.tipo === "cores") return [{ tipo: "cores", cores: f.cores, acao: f.acao }, { sep: true }, ...(f.extras ?? []).map(x => this.entradaDe(x))];
    return [];
  }

  abrirNivel(nivel, entradas, ancora, lado, rotulo, focar, colunas = false) {
    this.fecharNiveis(nivel);
    const menu = h("div", { class: `menu-suspenso${colunas ? " em-secoes" : ""}`, role: "menu", "aria-label": rotulo, tabindex: "-1" });
    let timer;
    for (const e of entradas) {
      if (e.tipo === "secao") {
        menu.append(h("div", { class: "mi-secao", role: "group", "aria-label": e.rotulo },
          h("div", { class: "mi-titulo", role: "presentation" }, e.rotulo),
          ...e.filhos.map(f => (f.sep ? h("div", { class: "mi-sep", role: "separator" }) : this.itemMenu(f, nivel, () => clearTimeout(timer), t => (timer = t))))));
        continue;
      }
      if (e.sep) { menu.append(h("div", { class: "mi-sep", role: "separator" })); continue; }
      menu.append(this.itemMenu(e, nivel, () => clearTimeout(timer), t => (timer = t)));
    }
    if (!menu.childElementCount) menu.append(h("div", { class: "mi-vazio" }, "Nada aqui por enquanto."));
    menu.addEventListener("keydown", ev => this.teclaMenu(ev, nivel));
    this.camada.append(menu);
    this.niveis.push({ el: menu, pai: lado === "direita" ? ancora.el : null, ancora: ancora.rect ?? ancora });
    if(lado === "direita" && ancora.el) this.niveis.at(-1).seguro = motorMenus().protegerSubmenu(ancora.el,menu,()=>this.fecharNiveis(nivel));
    this.posicionarMenu(menu, ancora.rect ?? ancora, lado);
    animarMenu(menu,this.ui);
    if (focar) menu.querySelector(".mi:not(:disabled)")?.focus();
  }

  itemMenu(e, nivel, cancelarTimer, guardarTimer) {
    if (e.tipo === "grade" || e.tipo === "modelos") {
      return h("div", { class: `mi-grade ${e.tipo === "modelos" ? "modelos" : ""}`, role: "group" }, e.itens.map(it => h("button", {
        type: "button", class: `mi galeria-item ${it.ativo ? "ativo" : ""}`, role: "menuitem", title: it.titulo, "aria-label": it.titulo,
        html: e.tipo === "modelos" ? `${it.html}<span>${it.rotulo}</span>` : it.html, style: it.estilo ?? "",
        onclick: () => this.executarMenu(it.acao),
      })));
    }
    if (e.tipo === "cores") {
      return h("div", { class: "mi-grade cores", role: "group" }, e.cores.map(cor => h("button", {
        type: "button", class: "mi cmd cor", role: "menuitem", title: cor, "aria-label": cor,
        html: `<span class="amostra-cmd" style="background:${cor}"></span>`, onclick: () => this.executarMenu(() => e.acao(cor)),
      })));
    }
    if (e.tipo === "spinner" || e.tipo === "campo") {
      const c = e.c;
      const v = e.tipo === "campo" ? this.app.n.nome : c.valor();
      const entrada = h("input", {
        type: e.tipo === "campo" ? "text" : "number", class: "num", value: v ?? "", disabled: e.tipo === "spinner" && v === null,
        "aria-label": e.tipo === "campo" ? "Nome do projeto" : c.rotulo,
        onkeydown: ev => { ev.stopPropagation(); if (ev.key === "Enter") ev.target.dispatchEvent(new Event("change")); if (ev.key === "Escape") this.fecharMenus(); },
        onchange: ev => {
          const val = ev.target.value;
          this.executarMenu(() => {
            if (e.tipo === "campo") this.app.n.definir("__canvas", { nome: val.trim() || "Projeto sem título" }, "Renomear projeto");
            else if (!Number.isNaN(Number(val))) c.aoMudar(Number(val));
          });
        },
      });
      return h("label", { class: "mi mi-campo" }, h("span", { class: "mi-ic", html: icone(e.tipo === "campo" ? "texto" : c.icone, 16) }),
        h("span", { class: "mi-txt" }, e.tipo === "campo" ? "Nome do projeto" : c.rotulo), entrada);
    }
    const c = e.tipo === "item" ? e.c : e;
    const desab = c.desabilitado?.() ?? false;
    const ativo = e.tipo === "item" ? c.ativo?.() : false;
    const marca = ativo ? icone("check", 16) : c.html && !c.icone ? c.html : iconeMenu(c.icone ?? "caixa", 16);
    const bt = h("button", {
      type: "button", class: `mi ${ativo ? "marcado" : ""}`, role: e.tipo === "item" && c.ativo ? "menuitemcheckbox" : "menuitem", "aria-disabled": String(desab), tabindex: "-1",
      "aria-checked": e.tipo === "item" && c.ativo ? String(!!ativo) : null,
      "aria-haspopup": e.tipo === "sub" ? "menu" : null, "aria-expanded": e.tipo === "sub" ? "false" : null,
      title: c.titulo && c.titulo !== c.rotulo ? c.titulo : "",
      html: `<span class="mi-ic">${c.icone || c.html || ativo ? marca : ""}</span><span class="mi-txt"${c.estiloTexto ? ` style="${c.estiloTexto}"` : ""}></span><span class="mi-atalho">${e.tipo === "sub" ? icone("setaDir", 13) : c.atalho ?? ""}</span>`,
    });
    bt.querySelector(".mi-txt").textContent = c.rotulo;
    const abrirSub = focar => {
      if (desab) return;
      bt.setAttribute("aria-expanded", "true");
      this.abrirNivel(nivel + 1, e.filhos(), { el: bt, rect: bt.getBoundingClientRect() }, "direita", c.rotulo, focar);
      this.niveis[nivel+1]?.el.addEventListener("pointerenter", cancelarTimer);
    };
    bt.abrirSub = abrirSub;
    bt.addEventListener("pointerenter", ev => {
      cancelarTimer();
      const seguro=this.niveis[nivel+1]?.seguro;
      const atraso=seguro?.contem({x:ev.clientX,y:ev.clientY}) ? 350 : 140;
      if (e.tipo === "sub") guardarTimer(setTimeout(() => abrirSub(false), atraso));
      else guardarTimer(setTimeout(() => this.fecharNiveis(nivel + 1), atraso));
    });
    bt.addEventListener("click", () => { if (!desab) e.tipo === "sub" ? abrirSub(false) : this.executarMenu(c.acao); });
    return bt;
  }

  posicionarMenu(menu, r, lado) {
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    menu.style.maxHeight = `${vh - 16}px`;
    menu.style.maxWidth = `${vw - 16}px`;
    // Galerias usam a largura da janela; os cartões mantêm tamanho legível.
    if (menu.querySelector(".mi-grade.modelos")) menu.style.width = `${Math.min(1040, vw - 16)}px`;
    else if (menu.querySelector(".mi-grade:not(.cores)")) menu.style.width = `${Math.min(600, vw - 16)}px`;
    const w = menu.offsetWidth;
    const a = menu.offsetHeight;
    motorMenus().limitarPainel(menu,r,{lado,rtl:getComputedStyle(this.raiz).direction==='rtl'});
  }

  teclaMenu(ev, nivel) {
    const menu = this.niveis[nivel]?.el;
    if (!menu) return;
    const itens = [...menu.querySelectorAll(".mi:not(:disabled)")].filter(b => b.tagName === "BUTTON");
    const i = itens.indexOf(document.activeElement);
    if(ev.key === 'Tab') { this.fecharMenus(); this.listaAbas.querySelector('[tabindex="0"]')?.focus(); return; }
    if(ev.key.length===1&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey&&ev.key!==' ') {
      const agora=Date.now();this.buscaMenu=agora-(this.buscaMenuHora||0)>700?'':this.buscaMenu||'';this.buscaMenu+=ev.key.toLocaleLowerCase();this.buscaMenuHora=agora;
      const ordem=[...itens.slice(i+1),...itens.slice(0,i+1)];const alvo=ordem.find(b=>b.textContent.trim().toLocaleLowerCase().startsWith(this.buscaMenu));if(alvo){ev.preventDefault();alvo.focus();}return;
    }
    const mover = d => { ev.preventDefault(); itens[(i + d + itens.length) % itens.length]?.focus(); };
    if (ev.key === "ArrowDown") mover(1);
    else if (ev.key === "ArrowUp") mover(-1);
    else if (ev.key === "Home") { ev.preventDefault(); itens[0]?.focus(); }
    else if (ev.key === "End") { ev.preventDefault(); itens.at(-1)?.focus(); }
    else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      if (document.activeElement?.abrirSub && document.activeElement.getAttribute("aria-haspopup")) document.activeElement.abrirSub(true);
      else this.vizinhoMenubar(this.menuAberto, 1);
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      if (nivel > 0) { const pai = this.niveis[nivel].pai; this.fecharNiveis(nivel); pai?.focus(); }
      else this.vizinhoMenubar(this.menuAberto, -1);
    } else if (ev.key === "Escape") {
      ev.preventDefault();
      ev.stopPropagation();
      if (nivel > 0) { const pai = this.niveis[nivel].pai; this.fecharNiveis(nivel); pai?.focus(); }
      else { const id = this.menuAberto; this.fecharMenus(); this.listaAbas.querySelector(`[data-menu="${id}"]`)?.focus(); }
    }
  }

  executarMenu(acao) {
    this.fecharMenus();
    acao?.();
    this.app.render();
  }
}
export { VARIANTES, abasBase, abasLegadas, comandosDaInterface, Ribbon };
