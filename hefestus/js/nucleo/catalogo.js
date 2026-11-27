import { ICONES_ELEMENTO, NOMES_COR } from "../ui/icones.js";
import { FORMAS } from "./formas.js";
import { MODOS_MISTURA } from "./estiloAvancado.js";
import { FONTES_BIB } from "./fontes.js";
import { MODOS_LAYOUT, ALINHAR_LAYOUT, JUSTIFICAR_LAYOUT } from "./layout.js";

// Catálogo de tipos de elemento do Hefestus.
// Cada tipo define valores padrão, os campos específicos que aparecem no painel
// de propriedades e como é renderizado (no canvas e no HTML exportado).

const base = (extra = {}) => ({
  x: 0, y: 0, largura: 160, altura: 40, z: 0, rotacao: 0, espelharH: false, espelharV: false,
  visivel: true, travado: false,
  estilo: {
    fundo: "#ffffff", cor: "#1f2937", borda: "#d1d5db", larguraBorda: 1,
    raio: 6, tamanhoFonte: 14, peso: 400, sombra: "nenhuma", opacidade: 1,
    fonte: "sistema", alinhamento: "", entrelinha: 1.3, desfoque: 0, vidro: 0,
  },
  estados: {
    hover: { fundo: "" },
    active: { fundo: "" },
    focus: { contorno: "", fundo: "" },
    disabled: { fundo: "", cor: "", opacidade: 0.5 },
  },
  transicao: { duracao: 150, easing: "ease-out" },
  eventos: [],
  acessibilidade: { role: "", ariaLabel: "" },
  ...extra,
});

const mesclar = (a, b) => {
  const r = structuredClone(a);
  for (const [k, v] of Object.entries(b)) {
    r[k] = v && typeof v === "object" && !Array.isArray(v) && r[k] ? mesclar(r[k], v) : v;
  }
  return r;
};

export const CATALOGO = {
  botao: {
    nome: "Botão", icone: "botao", grupo: "Controles",
    padrao: () => mesclar(base(), {
      largura: 140, altura: 40, rotulo: "Botão", variante: "primario", desabilitado: false,
      estilo: { fundo: "#2563eb", cor: "#ffffff", borda: "#1d4ed8", peso: 600 },
      estados: { hover: { fundo: "#1d4ed8" }, active: { fundo: "#1e40af" } },
      eventos: [{ tipo: "onClick", dispara: "clicado", acao: "", alvo: "" }],
      acessibilidade: { role: "button", ariaLabel: "" },
    }),
    campos: [
      { rotulo: "Rótulo", caminho: "rotulo", tipo: "texto" },
      { rotulo: "Desabilitado", caminho: "desabilitado", tipo: "check" },
    ],
    eventos: ["onClick", "onContext", "onHover", "onLeave", "onFocus"],
  },
  texto: {
    nome: "Texto", icone: "texto", grupo: "Texto",
    padrao: () => mesclar(base(), {
      largura: 220, altura: 32, texto: "Texto",
      estilo: { fundo: "transparent", borda: "transparent", larguraBorda: 0, tamanhoFonte: 16 },
      estados: { hover: { fundo: "" }, active: { fundo: "" } },
    }),
    campos: [{ rotulo: "Texto", caminho: "texto", tipo: "area" }],
    eventos: [],
  },
  caixa: {
    nome: "Caixa", icone: "caixa", grupo: "Formas",
    padrao: () => mesclar(base(), {
      largura: 280, altura: 180,
      estilo: { fundo: "#f8fafc", borda: "#cbd5e1", raio: 10 },
    }),
    campos: [],
    eventos: ["onClick", "onContext", "onHover", "onLeave"],
  },
  container: {
    nome: "Grupo", icone: "modelo", grupo: "Layout",
    padrao: () => mesclar(base(), {
      largura: 240, altura: 160,
      layout: { modo: "coluna", espaco: 8, margem: 12, alinhar: "inicio", abracar: true },
      estilo: { fundo: "#ffffff", borda: "#d1d5db", raio: 8 },
    }),
    campos: [
      { rotulo: "Organizar filhos", caminho: "layout.modo", tipo: "select", opcoes: MODOS_LAYOUT },
      { rotulo: "Alinhar filhos", caminho: "layout.alinhar", tipo: "select", opcoes: ALINHAR_LAYOUT },
      { rotulo: "Espaço entre filhos", caminho: "layout.espaco", tipo: "numero", min: 0, max: 200 },
      { rotulo: "Margem interna", caminho: "layout.margem", tipo: "numero", min: 0, max: 200 },
      { rotulo: "Distribuir no eixo", caminho: "layout.justificar", tipo: "select", opcoes: JUSTIFICAR_LAYOUT },
      { rotulo: "Navegação lateral adaptativa (2 grupos: navegação e conteúdo)", caminho: "menu.sidebar", tipo: "check" },
      { rotulo: "Faixa com grupos adaptativos", caminho: "menu.adaptativo", tipo: "check" },
      { rotulo: "Prioridade do grupo (maior preserva)", caminho: "menu.prioridade", tipo: "numero", min: 0, max: 1000 },
      { rotulo: "Abraçar o conteúdo", caminho: "layout.abracar", tipo: "check" },
      { rotulo: "Quebrar linha quando faltar espaço", caminho: "layout.quebrar", tipo: "check" },
      { rotulo: "Empilhar em coluna em telas", caminho: "layout.empilharAbaixo", tipo: "select", opcoes: [["0", "Nunca"], ["480", "menores que 480 px"], ["768", "menores que 768 px"], ["1024", "menores que 1024 px"]] },
    ],
    eventos: ["onClick", "onContext", "onHover", "onLeave"],
  },
  forma: {
    nome: "Forma", icone: "estrela", grupo: "Formas",
    padrao: () => mesclar(base(), {
      largura: 140, altura: 100, forma: "retangulo", texto: "",
      estilo: { fundo: "#4472c4", cor: "#ffffff", borda: "#2f528f", larguraBorda: 1, raio: 0 },
    }),
    campos: [
      { rotulo: "Forma", caminho: "forma", tipo: "select", opcoes: Object.entries(FORMAS).map(([id, f]) => [id, f.nome]) },
      { rotulo: "Lados", caminho: "lados", tipo: "numero", min: 3, max: 60, quando: e => e.forma === "poligono", padrao: 6 },
      { rotulo: "Pontas", caminho: "lados", tipo: "numero", min: 3, max: 60, quando: e => e.forma === "estrela", padrao: 5 },
      { rotulo: "Profundidade das pontas (raio interno)", caminho: "razao", tipo: "numero", min: 0.1, max: 0.95, passo: 0.05, quando: e => e.forma === "estrela", padrao: 0.45 },
      { rotulo: "Arredondar cantos (%)", caminho: "canto", tipo: "numero", min: 0, max: 50, quando: e => e.forma === "poligono" || e.forma === "estrela", padrao: 0 },
      { rotulo: "Girar o desenho (graus)", caminho: "giro", tipo: "numero", min: -360, max: 360, quando: e => e.forma === "poligono" || e.forma === "estrela", padrao: 0 },
      { rotulo: "Início do arco (graus, 0 = topo)", caminho: "inicio", tipo: "numero", min: -360, max: 720, quando: e => e.forma === "arco", padrao: 0 },
      { rotulo: "Fim do arco (graus)", caminho: "fim", tipo: "numero", min: -360, max: 720, quando: e => e.forma === "arco", padrao: 270 },
      { rotulo: "Espessura do anel (%)", caminho: "espessura", tipo: "numero", min: 1, max: 100, quando: e => e.forma === "arco", padrao: 30 },
      { rotulo: "Furo pelo critério par-ímpar (caminhos com furos)", caminho: "evenodd", tipo: "check", quando: e => e.forma === "vetor" },
      { rotulo: "Texto dentro da forma", caminho: "texto", tipo: "area" },
    ],
    eventos: ["onClick", "onContext", "onHover", "onLeave"],
  },
  elipse: {
    nome: "Elipse", icone: "elipse", grupo: "Formas",
    padrao: () => mesclar(base(), {
      largura: 120, altura: 120,
      estilo: { fundo: "#dbeafe", borda: "#93c5fd", raio: 0 },
    }),
    campos: [],
    eventos: ["onClick", "onContext", "onHover", "onLeave"],
  },
  linha: {
    nome: "Linha", icone: "linha", grupo: "Formas",
    padrao: () => mesclar(base(), {
      largura: 200, altura: 2,
      estilo: { fundo: "#1f2937", borda: "transparent", larguraBorda: 0, raio: 1 },
    }),
    campos: [],
    eventos: [],
  },
  icone: {
    nome: "Ícone", icone: "icone", grupo: "Formas",
    padrao: () => mesclar(base(), {
      largura: 32, altura: 32, simbolo: "estrela", traco: 1.8, estiloIcone: "traco", corIcone: "",
      estilo: { fundo: "transparent", cor: "#1f2937", borda: "transparent", larguraBorda: 0, raio: 0 },
      acessibilidade: { role: "img", ariaLabel: "" },
    }),
    campos: [
      { rotulo: "Símbolo", caminho: "simbolo", tipo: "select", opcoes: ICONES_ELEMENTO.map(n => [n, n]) },
      { rotulo: "Estilo do ícone", caminho: "estiloIcone", tipo: "select", opcoes: [["traco", "Traço (uma cor)"], ["colorido", "Colorido"]] },
      { rotulo: "Cor do colorido", caminho: "corIcone", tipo: "select", opcoes: [["", "Automática (pelo significado)"], ...NOMES_COR.map(n => [n, n])] },
      { rotulo: "Espessura do traço", caminho: "traco", tipo: "numero", min: 0.5, max: 4, passo: 0.1 },
    ],
    eventos: ["onClick", "onContext", "onHover", "onLeave"],
  },
  campo: {
    nome: "Campo de texto", icone: "campo", grupo: "Controles",
    padrao: () => mesclar(base(), {
      largura: 240, altura: 40, placeholder: "Digite aqui", rotuloCampo: "Nome",
      estilo: { raio: 6 },
      eventos: [{ tipo: "onChange", dispara: "valor_alterado", acao: "", alvo: "" }],
      acessibilidade: { role: "textbox", ariaLabel: "" },
    }),
    campos: [
      { rotulo: "Placeholder", caminho: "placeholder", tipo: "texto" },
    ],
    eventos: ["onChange", "onFocus"],
  },
  toggle: {
    nome: "Toggle", icone: "toggle", grupo: "Controles",
    padrao: () => mesclar(base(), {
      largura: 52, altura: 28, ligado: false,
      estilo: { fundo: "#cbd5e1", cor: "#ffffff", borda: "transparent", larguraBorda: 0, raio: 14 },
      estados: { hover: { fundo: "" }, active: { fundo: "#2563eb" } },
      eventos: [{ tipo: "onChange", dispara: "alternado", acao: "", alvo: "" }],
      acessibilidade: { role: "switch", ariaLabel: "" },
    }),
    campos: [{ rotulo: "Ligado", caminho: "ligado", tipo: "check" }],
    eventos: ["onChange"],
  },
  menu: {
    nome: "Menu", icone: "menu", grupo: "Navegação",
    padrao: () => mesclar(base(), {
      largura: 200, altura: 152, itens: ["Novo", "Abrir...", "Salvar", "Sair"],
      estilo: { fundo: "#1f2937", cor: "#f9fafb", borda: "#111827", raio: 8 },
      estados: { hover: { fundo: "#374151" }, active: { fundo: "" } },
      eventos: [{ tipo: "onSelect", dispara: "item_selecionado", acao: "", alvo: "" }],
      acessibilidade: { role: "menu", ariaLabel: "" },
    }),
    campos: [{ rotulo: "Itens (um por linha)", caminho: "itens", tipo: "lista" }],
    eventos: ["onSelect"],
  },
  modal: {
    nome: "Modal", icone: "modal", grupo: "Flutuantes",
    padrao: () => mesclar(base(), {
      largura: 360, altura: 200, titulo: "Confirmar ação", mensagem: "Tem certeza?",
      overlay: true, fechaAoClicarFora: true, iniciaAberto: true,
      estilo: { fundo: "#ffffff", borda: "#e5e7eb", raio: 12, sombra: "grande" },
      eventos: [{ tipo: "onClose", dispara: "modal_fechado", acao: "", alvo: "" }],
      acessibilidade: { role: "dialog", ariaLabel: "" },
    }),
    campos: [
      { rotulo: "Título", caminho: "titulo", tipo: "texto" },
      { rotulo: "Mensagem", caminho: "mensagem", tipo: "area" },
      { rotulo: "Escurecer fundo", caminho: "overlay", tipo: "check" },
      { rotulo: "Fechar ao clicar fora", caminho: "fechaAoClicarFora", tipo: "check" },
      { rotulo: "Visível ao abrir a prévia", caminho: "iniciaAberto", tipo: "check" },
    ],
    eventos: ["onOpen", "onClose"],
  },
  toast: {
    nome: "Notificação", icone: "toast", grupo: "Flutuantes",
    padrao: () => mesclar(base(), {
      largura: 280, altura: 48, mensagem: "Alterações salvas", autoFechar: 3000, iniciaAberto: true,
      estilo: { fundo: "#111827", cor: "#f9fafb", borda: "transparent", larguraBorda: 0, raio: 8, sombra: "media" },
      acessibilidade: { role: "status", ariaLabel: "" },
    }),
    campos: [
      { rotulo: "Mensagem", caminho: "mensagem", tipo: "texto" },
      { rotulo: "Fecha sozinho após (ms)", caminho: "autoFechar", tipo: "numero" },
      { rotulo: "Visível ao abrir a prévia", caminho: "iniciaAberto", tipo: "check" },
    ],
    eventos: ["onOpen", "onClose"],
  },
};

export const SOMBRAS = {
  nenhuma: "none",
  pequena: "0 1px 2px rgba(0,0,0,.12)",
  media: "0 4px 12px rgba(0,0,0,.16)",
  grande: "0 12px 32px rgba(0,0,0,.24)",
};

/** Campos comuns a todo elemento, por painel da lateral direita. */
export const CAMPOS_ESTILO = [
  { rotulo: "Fundo", caminho: "estilo.fundo", tipo: "cor" },
  { rotulo: "Texto", caminho: "estilo.cor", tipo: "cor" },
  { rotulo: "Borda", caminho: "estilo.borda", tipo: "cor" },
  { rotulo: "Largura da borda", caminho: "estilo.larguraBorda", tipo: "numero", min: 0, max: 12 },
  { rotulo: "Raio", caminho: "estilo.raio", tipo: "numero", min: 0, max: 64 },
  { rotulo: "Tamanho da fonte", caminho: "estilo.tamanhoFonte", tipo: "numero", min: 8, max: 96 },
  { rotulo: "Peso", caminho: "estilo.peso", tipo: "select", opcoes: [["300", "Leve"], ["400", "Normal"], ["600", "Seminegrito"], ["700", "Negrito"]] },
  { rotulo: "Sombra", caminho: "estilo.sombra", tipo: "select", opcoes: [["nenhuma", "Nenhuma"], ["pequena", "Pequena"], ["media", "Média"], ["grande", "Grande"]] },
  { rotulo: "Opacidade", caminho: "estilo.opacidade", tipo: "numero", min: 0, max: 1, passo: 0.05 },
];

/** Estilo avançado: listas editadas pelo painel Aparência (e pelo agente, em JSON). */
export const CAMPOS_AVANCADO = [
  { rotulo: "Preenchimentos (camadas)", caminho: "estilo.preenchimentos", tipo: "avancado", lista: "preenchimentos" },
  { rotulo: "Traços", caminho: "estilo.tracos", tipo: "avancado", lista: "tracos" },
  { rotulo: "Efeitos (sombras, desfoque, vidro)", caminho: "estilo.efeitos", tipo: "avancado", lista: "efeitos" },
  { rotulo: "Cantos individuais [↖,↗,↘,↙]", caminho: "estilo.cantos", tipo: "avancado", lista: "cantos" },
  { rotulo: "Modo de mistura", caminho: "estilo.mistura", tipo: "select", opcoes: MODOS_MISTURA },
];

export const CAMPOS_TEXTO = [
  { rotulo: "Fonte", caminho: "estilo.fonte", tipo: "select", opcoes: Object.entries(FONTES_BIB).map(([k, f]) => [k, `${f.nome} · ${f.cat}`]) },
  { rotulo: "Alinhamento", caminho: "estilo.alinhamento", tipo: "select", opcoes: [["", "Padrão do tipo"], ["esquerda", "Esquerda"], ["centro", "Centro"], ["direita", "Direita"]] },
  { rotulo: "Entrelinha", caminho: "estilo.entrelinha", tipo: "numero", min: 0.8, max: 3, passo: 0.05 },
];

export const CAMPOS_TRANSFORMACAO = [
  { rotulo: "Rotação (graus)", caminho: "rotacao", tipo: "numero", min: -360, max: 360 },
  { rotulo: "Espelhar na horizontal", caminho: "espelharH", tipo: "check" },
  { rotulo: "Espelhar na vertical", caminho: "espelharV", tipo: "check" },
];

export const CAMPOS_EFEITOS = [
  { rotulo: "Desfoque (px)", caminho: "estilo.desfoque", tipo: "numero", min: 0, max: 40 },
  { rotulo: "Vidro fosco: desfoca o que está atrás (px)", caminho: "estilo.vidro", tipo: "numero", min: 0, max: 40 },
];

/** Tipos que têm texto próprio (mostram os campos de tipografia). */
export const TIPOS_COM_TEXTO = ["botao", "texto", "campo", "menu", "modal", "toast", "forma"];

export const CAMPOS_COMPORTAMENTO = [
  { rotulo: "Fundo ao passar o mouse", caminho: "estados.hover.fundo", tipo: "cor", vazio: true },
  { rotulo: "Fundo ao pressionar", caminho: "estados.active.fundo", tipo: "cor", vazio: true },
  { rotulo: "Fundo quando ativo (aba ou item escolhido)", caminho: "estados.ativo.fundo", tipo: "cor", vazio: true },
  { rotulo: "Texto quando ativo", caminho: "estados.ativo.cor", tipo: "cor", vazio: true },
  { rotulo: "Anel de foco (cor do contorno ao navegar por teclado)", caminho: "estados.focus.contorno", tipo: "cor", vazio: true },
  { rotulo: "Fundo com foco", caminho: "estados.focus.fundo", tipo: "cor", vazio: true },
  { rotulo: "Fundo quando desabilitado ou indisponível", caminho: "estados.disabled.fundo", tipo: "cor", vazio: true },
  { rotulo: "Texto quando desabilitado ou indisponível", caminho: "estados.disabled.cor", tipo: "cor", vazio: true },
  { rotulo: "Opacidade quando desabilitado (0 a 1)", caminho: "estados.disabled.opacidade", tipo: "numero", min: 0, max: 1, passo: 0.05 },
  { rotulo: "Duração da transição (ms)", caminho: "transicao.duracao", tipo: "numero", min: 0, max: 2000, passo: 10 },
  { rotulo: "Curva", caminho: "transicao.easing", tipo: "select", opcoes: [["ease-out", "Suave na saída"], ["ease-in-out", "Suave"], ["linear", "Linear"], ["ease-in", "Suave na entrada"]] },
];

export const CAMPOS_ACESSIBILIDADE = [
  { rotulo: "Papel (role)", caminho: "acessibilidade.role", tipo: "texto" },
  { rotulo: "Rótulo acessível (aria-label)", caminho: "acessibilidade.ariaLabel", tipo: "texto" },
  { rotulo: "Tecla de acesso (Alt + letra)", caminho: "acessibilidade.tecla", tipo: "texto" },
  { rotulo: "Indisponível (bloqueado com motivo)", caminho: "acessibilidade.indisponivel", tipo: "check" },
  { rotulo: "Motivo da indisponibilidade", caminho: "acessibilidade.motivo", tipo: "texto" },
  { rotulo: "Perfis que veem este item (ex.: admin, gestor)", caminho: "acessibilidade.perfis", tipo: "texto" },
];

export const CAMPOS_LAYOUT = [
  { rotulo: "X", caminho: "x", tipo: "numero" },
  { rotulo: "Y", caminho: "y", tipo: "numero" },
  { rotulo: "Largura", caminho: "largura", tipo: "numero", min: 8 },
  { rotulo: "Altura", caminho: "altura", tipo: "numero", min: 8 },
  { rotulo: "Camada (z)", caminho: "z", tipo: "numero" },
  { rotulo: "Travar posição", caminho: "travado", tipo: "check" },
  { rotulo: "Visível", caminho: "visivel", tipo: "check" },
];

/** Larguras de tela usadas para ocultar, mostrar e empilhar. */
export const PONTOS_QUEBRA = [["0", "Nunca"], ["480", "menores que 480 px (celular)"], ["768", "menores que 768 px (tablet)"], ["1024", "menores que 1024 px (notebook)"]];

/** Como o elemento se adapta quando a tela muda de tamanho. */
export const CAMPOS_RESPONSIVO = [
  { rotulo: "Na horizontal", caminho: "restricoes.h", tipo: "select", opcoes: [["auto", "Automático"], ["esquerda", "Preso à esquerda"], ["direita", "Preso à direita"], ["ambos", "Esquerda e direita (estica)"], ["centro", "Centralizado"], ["escala", "Proporcional (%)"]] },
  { rotulo: "Na vertical", caminho: "restricoes.v", tipo: "select", opcoes: [["auto", "Automático"], ["topo", "Preso ao topo"], ["base", "Preso à base"], ["ambos", "Topo e base (estica)"], ["centro", "Centralizado"], ["escala", "Proporcional (%)"]] },
  { rotulo: "Ocultar em telas", caminho: "responsivo.ocultarAbaixo", tipo: "select", opcoes: PONTOS_QUEBRA },
  { rotulo: "Mostrar só em telas", caminho: "responsivo.mostrarAbaixo", tipo: "select", opcoes: [["0", "Sempre mostrar"], ...PONTOS_QUEBRA.slice(1)] },
];

/** Tamanho de quem está dentro de um container em linha/coluna. */
export const CAMPOS_FILHO = [
  { rotulo: "Largura dentro do container", caminho: "dimensao.largura", tipo: "select", opcoes: [["fixa", "Fixa"], ["preencher", "Preencher o espaço"], ["abracar", "Abraçar o conteúdo"]] },
  { rotulo: "Altura dentro do container", caminho: "dimensao.altura", tipo: "select", opcoes: [["fixa", "Fixa"], ["preencher", "Preencher o espaço"]] },
];

/** Qualquer elemento pode abrir e fechar como menu, gaveta ou dica. */
export const CAMPOS_ABERTURA = [
  { rotulo: "Começa fechado (abre por um evento)", caminho: "abertura.iniciaFechado", tipo: "check" },
  { rotulo: "Animação ao abrir", caminho: "abertura.animacao", tipo: "select", opcoes: [["nenhuma", "Nenhuma"], ["aparecer", "Aparecer"], ["deslizar", "Deslizar para baixo"], ["crescer", "Crescer"], ["lateral", "Entrar pela lateral"]] },
  { rotulo: "Fechar ao clicar fora", caminho: "abertura.fecharFora", tipo: "check" },
  { rotulo: "Fechar com Esc", caminho: "abertura.fecharEsc", tipo: "check" },
  { rotulo: "Fechar ao escolher um item", caminho: "abertura.fecharAoEscolher", tipo: "check" },
  { rotulo: "Escurecer o fundo", caminho: "abertura.fundoEscuro", tipo: "check" },
  { rotulo: "Abrir colado ao gatilho (dropdown)", caminho: "abertura.ancorar", tipo: "check" },
];

export const CAMPOS_CANVAS = [
  { rotulo: "Largura da tela", caminho: "largura", tipo: "numero", min: 200 },
  { rotulo: "Altura da tela", caminho: "altura", tipo: "numero", min: 200 },
  { rotulo: "Fundo da tela", caminho: "fundo", tipo: "cor" },
  { rotulo: "HTML responsivo (adapta à largura da tela)", caminho: "responsivo", tipo: "check", padrao: true },
];

/** Ações visuais permitidas em eventos (escopo fechado: sem lógica de negócio). */
export const ACOES = [
  ['animar','Disparar animação no alvo'],
  ["aplicarEstilo", "Aplicar estilo ao alvo"],
  ["aplicarForma", "Aplicar forma vetorial ao alvo"],
  ["", "Só emitir o sinal"],
  ["abrir", "Abrir elemento"],
  ["fechar", "Fechar elemento"],
  ["alternar", "Alternar elemento"],
  ["destacar", "Destacar elemento"],
  ["mostrarSo", "Mostrar só este (esconde os irmãos)"],
  ["fixar", "Fixar aberto / soltar (alterna o pino)"],
];

/** Lê um caminho "a.b.c" de um objeto. */
export const ler = (obj, caminho) => caminho.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
