import { recomendarMenu, REGRAS_MENUS } from "../nucleo/expertiseMenus.js";
// Interpretador local (sem conexão): entende pedidos comuns em português e os
// traduz para as MESMAS ferramentas que o Claude usa. Quando não entende, diz o
// que sabe fazer em vez de adivinhar.
import { gerarTema } from "../nucleo/temaGerado.js";
import { CATALOGO } from "../nucleo/catalogo.js";
import { ICONES_ELEMENTO } from "../ui/icones.js";
import { ALIAS_TEMA_UI } from "../ui/temas.js";
import { MODELOS } from "../nucleo/modelos.js";

const SIMBOLOS = {
  casa: "casa", inicio: "casa", usuario: "usuario", perfil: "usuario", pessoa: "usuario", sino: "sino", notificacao: "sino",
  coracao: "coracao", favorito: "coracao", estrela: "estrela", carrinho: "carrinho", compra: "carrinho",
  engrenagem: "engrenagem", configuracao: "engrenagem", ajustes: "engrenagem", lupa: "buscar", busca: "buscar", pesquisa: "buscar",
  check: "check", certo: "check", fechar: "fechar", xis: "fechar", mais: "mais", info: "info", informacao: "info",
  alerta: "alerta", atencao: "alerta", email: "email", "e-mail": "email", telefone: "telefone", seta: "setaDir",
};

export const CORES = {
  azul: "#2563eb", vermelho: "#dc2626", vermelha: "#dc2626", verde: "#16a34a", amarelo: "#eab308", amarela: "#eab308",
  laranja: "#ea580c", roxo: "#7c3aed", roxa: "#7c3aed", rosa: "#db2777", preto: "#111827", preta: "#111827",
  branco: "#ffffff", branca: "#ffffff", cinza: "#6b7280", transparente: "transparent",
};

const TIPOS = [
  [/(container|cont(ê|e)iner|agrupador)/, "container"],
  [/bot(ão|ao|ões|oes)/, "botao"],
  [/(i(c|ç)one|(í|i)cone)/, "icone"],
  [/(pol(í|i)gono|\barco\b|\banel\b|estrela|seta|hex(á|a)gono|pent(á|a)gono|oct(ó|o)gono|tri(â|a)ngulo|losango|cora(ç|c)(ã|a)o|bal(ã|a)o|nuvem|\braio\b|\bcruz\b|\bfaixa\b|\bselo\b|trap(é|e)zio|paralelogramo|\blua\b|explos(ã|a)o|\bforma\b)/, "forma"],
  [/(elipse|c(í|i)rculo|bola|oval)/, "elipse"],
  [/\b(linha|divisor|separador|tra(ç|c)o)\b/, "linha"],
  [/(caixa|card|cart(ão|ao)|painel|box|ret(â|a)ngulo)/, "caixa"],
  [/(t(í|i)tulo|texto|label|r(ó|o)tulo|par(á|a)grafo|legenda)/, "texto"],
  [/(campo|input|entrada)/, "campo"],
  [/(toggle|interruptor|switch|chave)/, "toggle"],
  [/menu/, "menu"],
  [/(modal|di(á|a)logo|janela|popup|pop-up)/, "modal"],
  [/(notifica(ç|c)(ã|a)o|toast|aviso)/, "toast"],
];

const CAMPO_TEXTO = { botao: "rotulo", texto: "texto", campo: "placeholder", modal: "titulo", toast: "mensagem", forma: "texto" };

/** Palavra → forma da galeria. A primeira que aparecer no pedido vale. */
const PALAVRAS_FORMA = [
  [/seta (para a |pra )?esquerda/, "setaEsquerda"], [/seta (para |pra )?cima/, "setaCima"], [/seta (para |pra )?baixo/, "setaBaixo"],
  [/seta dupla/, "setaDupla"], [/seta/, "setaDireita"], [/estrela de 4|estrela 4/, "estrela4"], [/estrela de 6|estrela 6/, "estrela6"],
  [/estrela/, "estrela5"], [/hexagono/, "hexagono"], [/pentagono/, "pentagono"], [/octogono/, "octogono"],
  [/triangulo/, "triangulo"], [/losango/, "losango"], [/coracao/, "coracao"], [/balao/, "balaoArredondado"], [/nuvem/, "nuvem"],
  [/\braio\b/, "raio"], [/\bcruz\b/, "cruz"], [/\bfaixa\b/, "faixa"], [/\bselo\b/, "selo"], [/trapezio/, "trapezio"],
  [/paralelogramo/, "paralelogramo"], [/\blua\b/, "lua"], [/explosao/, "explosao"],
];

const sem = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function tipoNo(texto) {
  for (const [re, t] of TIPOS) if (re.test(texto)) return t;
  return null;
}

function corNo(texto) {
  const m = sem(texto).match(/#[0-9a-f]{6}\b/);
  if (m) return m[0];
  for (const [nome, hex] of Object.entries(CORES)) if (new RegExp(`\\b${sem(nome)}\\b`).test(sem(texto))) return hex;
  return null;
}

/** Todas as cores citadas, na ordem em que aparecem (para "gradiente de azul para roxo"). */
function coresEmOrdem(texto) {
  const t = sem(texto);
  const achados = [];
  for (const m of t.matchAll(/#[0-9a-f]{6}\b/g)) achados.push([m.index, m[0]]);
  for (const [nome, hex] of Object.entries(CORES)) for (const m of t.matchAll(new RegExp(`\\b${sem(nome)}\\b`, "g"))) achados.push([m.index, hex]);
  return achados.sort((a, b) => a[0] - b[0]).map(a => a[1]);
}

function aspas(texto) {
  const m = texto.match(/["“”']([^"“”']+)["“”']/);
  return m ? m[1].trim() : null;
}

function textoDito(texto) {
  const q = aspas(texto);
  if (q) return q;
  const m = texto.match(/(?:escrito|dizendo|com o texto|com texto|chamad[oa]|que diz|com a mensagem|com o t[ií]tulo)\s+(.+?)(?:\s+(?:no|na|em|à|a|ao|do|da)\s+(?:canto|topo|centro|meio|baixo|cima|esquerda|direita|rodap[eé])|[.,;!]|$)/i);
  return m ? m[1].trim() : null;
}

/** Posição nomeada → { x, y } para um elemento de tamanho (w, h) na tela. */
export function posicao(texto, tela, w, h) {
  const t = sem(texto);
  const M = 24;
  const cx = Math.round((tela.largura - w) / 2);
  const cy = Math.round((tela.altura - h) / 2);
  const dir = tela.largura - w - M;
  const baixo = tela.altura - h - M;
  if (/canto superior direito|canto de cima (a|à) direita/.test(t)) return { x: dir, y: M };
  if (/canto superior esquerdo|canto de cima (a|à) esquerda/.test(t)) return { x: M, y: M };
  if (/canto inferior direito|canto de baixo (a|à) direita/.test(t)) return { x: dir, y: baixo };
  if (/canto inferior esquerdo|canto de baixo (a|à) esquerda/.test(t)) return { x: M, y: baixo };
  if (/\b(no topo|em cima|no alto|parte de cima)\b/.test(t)) return { x: cx, y: M };
  if (/\b(embaixo|em baixo|rodape|parte de baixo|na base)\b/.test(t)) return { x: cx, y: baixo };
  if (/\b(a|na|para a|pra) esquerda\b/.test(t)) return { x: M, y: cy };
  if (/\b(a|na|para a|pra) direita\b/.test(t)) return { x: dir, y: cy };
  if (/\b(no centro|no meio|centralizad[oa])\b/.test(t)) return { x: cx, y: cy };
  return null;
}

/**
 * Acha o elemento citado. Devolve { id } ou { ambiguos: [...] } ou {}.
 * Ordem: pronome (selecionado/último), texto entre aspas, nome/rótulo citado, tipo citado.
 */
export function acharElemento(texto, n, ultimo) {
  const t = sem(texto);
  const els = n.elementos();
  if (/\b(ele|ela|isso|isto|esse|essa|este|esta|dele|dela|nele|nela)\b/.test(t)) {
    const id = n.selecao ?? ultimo;
    if (id && n.elemento(id)) return { id };
  }
  const q = aspas(texto);
  const rotulos = el => [el.nome, el.rotulo, el.texto, el.titulo, el.mensagem].filter(v => typeof v === "string" && v.trim().length >= 3);
  const rotulosCurtos = el => [el.rotulo, el.texto, el.titulo, el.mensagem, el.placeholder].filter(v => typeof v === "string" && v.trim().length >= 1 && v.trim().length <= 2);
  if (q) {
    const achados = els.filter(el => [...rotulos(el), ...rotulosCurtos(el)].some(r => sem(r.trim()) === sem(q)));
    if (achados.length === 1) return { id: achados[0].id };
  }
  // rótulo de 1-2 letras só vale depois do tipo ("botão A", "campo X"), para não confundir com o artigo "a"
  const tipoRot = t.match(/\b(?:botao|campo|texto|caixa|menu|aba|item|forma|icone|toggle|titulo)\s+"?([a-z0-9]{1,2})"?(?=\s|$|[.,;!?])/);
  if (tipoRot) {
    const achados = els.filter(el => rotulosCurtos(el).some(r => sem(r.trim()) === tipoRot[1]));
    if (achados.length === 1) return { id: achados[0].id };
  }
  // o rótulo citado mais longo vence; empate entre elementos diferentes é ambiguidade
  let len = 0;
  let ids = new Set();
  for (const el of els) {
    for (const r of rotulos(el)) {
      const rr = sem(r);
      if (!t.includes(rr)) continue;
      if (rr.length > len) { len = rr.length; ids = new Set([el.id]); }
      else if (rr.length === len) ids.add(el.id);
    }
  }
  if (ids.size === 1) return { id: [...ids][0] };
  if (ids.size > 1) {
    const sel = n.selecao && ids.has(n.selecao) ? n.selecao : null;
    if (sel) return { id: sel };
    return { ambiguos: els.filter(e => ids.has(e.id)) };
  }
  const tipo = tipoNo(t);
  if (tipo) {
    const doTipo = els.filter(e => e.tipo === tipo);
    if (doTipo.length === 1) return { id: doTipo[0].id };
    if (doTipo.length > 1) return { ambiguos: doTipo };
  }
  if (n.selecao) return { id: n.selecao, implicito: true };
  return {};
}

const AJUDA = `No modo local eu entendo pedidos como:
• "cria um botão verde escrito Enviar no canto inferior direito"
• "muda a cor do botão Entrar para vermelho"
• "troca o texto do título para Bem-vindo"
• "aumenta a fonte do título" / "deixa a caixa maior" / "arredonda o cartão"
• "move o botão para o topo" / "centraliza o cartão"
• "quando clicar em Entrar, abre o Aviso de envio"
• "cria um ícone de casa azul" / "cria um círculo verde" / "cria uma linha"
• "gira o cartão 45 graus" / "espelha o ícone"
• "insere o modelo menu suspenso" / "cria uma barra de ferramentas"
• "recria o menu completo estilo Office" / "cria o menu Arquivo estilo Office"
• "agrupa em coluna" (com itens selecionados)
• "cria um menu de contexto com Copiar, Colar, - e Excluir" (vira formulário editável)
• "aplica o tema neon" (axiom, hefestus, hospitalar, vidro, industrial, minimalista, fluent, retro), "cria um breadcrumb com Home, Rede e Switch", "cria barras de progresso", "cria um stepper", "cria uma barra de ferramentas neon"
• "cria uma barra lateral com Início, Projetos e Dados", "cria abas de documento com Mapa e Andar 1", "cria blocos com Painéis, Mapa e Eventos"
• "cria uma faixa de opções com abas Início, Inserir e Exibir" / "adiciona o comando Tabela na aba Inserir"
• "tema grafite" (só a interface) / "recolore com a paleta escura" (os elementos)
• "apaga o toggle" / "desfaz"
Na página publicada no Claude, eu entendo qualquer pedido.`;

/**
 * Interpreta um pedido. Devolve { acoes: [{ nome, entrada }], resposta?, especial? }.
 * `ctx.ultimo` é o último elemento criado ou alterado pelo agente nesta conversa.
 */
export function interpretar(pedido, n, ctx = {}) {
  const texto = pedido.trim();
  const t = sem(texto);
  const tela = n.tela;
  if (/^(exportar|exporte|salvar|salve|gerar|gere)\b.*\b(aplicativo windows|programa fechado|instalador|executavel)\b/.test(t)) return {acoes:[{nome:"preparar_aplicativo_windows",entrada:{}}],resposta:"Abri a exportação Windows para escolher nome, versão e ícone. Ela prepara o pacote que gera o instalador; o EXE ainda precisa ser compilado."};
  if (/\b(menu|menus|ribbon|sidebar|barra lateral|navegacao)\b/.test(t) && /\b(planej|recomend|boas praticas|regras|melhor tipo|expertise)\w*/.test(t)) {
    const plano=recomendarMenu(texto);
    return {acoes:[],resposta:plano.motivo+' '+REGRAS_MENUS.map(r=>r.regra).join(' ')};
  }
  if (/\b(cri|ins|mont|quero)\w*/.test(t) && /\b(sidebar|barra lateral|navegacao)\b/.test(t) && /\b(adaptativ|inteligente|profissional)\w*/.test(t))
    return {acoes:[{nome:'inserir_modelo',entrada:{modelo:'sidebarAdaptativa'}}],resposta:'Criei a navegação adaptativa com modos aberto, compacto e sobreposto, nomes acessíveis e sinais editáveis.'};


  if (/^(desfaz|desfazer|desfaca|volta|voltar)\b/.test(t)) return { acoes: [], especial: "desfazer" };
  if (/^(refaz|refazer|refaca)\b/.test(t)) return { acoes: [], especial: "refazer" };
  if (/^(ajuda|help|o que (voce|vc) (sabe|faz))/.test(t)) return { acoes: [], resposta: AJUDA };

  if (/\b(cri|ins|mont|quero)\w*/.test(t) && /\b(menu|ribbon|faixa|navegacao)\b/.test(t) && /\b(inteligente|profissional|adaptativ)\w*/.test(t)) {
    const plano=recomendarMenu(texto);
    return {acoes:[{nome:'inserir_modelo',entrada:{modelo:plano.modelo}}],resposta:plano.motivo+' Criei a estrutura editável; teste a prévia e consulte a Auditoria.'};
  }
  // fora do escopo: o Hefestus só cria o visual e o comportamento visual, nunca lógica de negócio
  if (/\b(chama(r)? (a |uma )?(api|rota|endpoint)|salva(r)? (no|em) (o )?(banco|servidor|bd)|consulta(r)? (o )?banco|autentic\w+ (de verdade|real)|valida(r)? (o )?(cpf|cnpj|senha)|calcul\w+ (o )?(imposto|frete|total|juros)|enviar? e-?mail de verdade|regra de negocio|processa(r)? pagamento)\b/.test(t))
    return { acoes: [], resposta: "Isso é lógica de negócio e fica fora do escopo do Hefestus: eu só crio o visual e o comportamento visual. Posso criar o botão, o aviso de erro ou o estado de carregando, e emitir um sinal (por exemplo \"salvar_clicado\") para o seu código ligar a essa ação." };
  // tema completo por descrição (cores dos elementos): "tema escuro com azul ciano e cantos suaves"
  if (/\btema\b/.test(t) && !/\b(interface|menus?|barras?|editor)\b/.test(t) && gerarTema(texto) && (Object.keys(CORES).some(c => new RegExp(`\\b${c}\\b`).test(t)) || /\b(ciano|turquesa|violeta|lilas|dourado|esmeralda|indigo|vibrante|pastel|neutro|cantos)\b/.test(t)))
    return { acoes: [{ nome: "criar_tema", entrada: { descricao: texto } }], resposta: "Apliquei o tema nos elementos. Desfazer volta tudo de uma vez." };
  // paleta = cores dos ELEMENTOS; tema = aparência da INTERFACE (nunca muda o canvas)
  const paleta = t.match(/(?:paleta|recolor\w*|cores dos elementos)\D*?\b(clara|claro|escura|escuro|forja)\b/);
  if (paleta) return { acoes: [{ nome: "aplicar_paleta", entrada: { paleta: { clara: "claro", escura: "escuro" }[paleta[1]] ?? paleta[1] } }] };
  const tema = t.match(/tema (?:da interface |do menu |do editor )?(automatico|sistema|forja|bronze|escuro|escura|grafite|cinza|claro|clara|branco|azul|office|meia[- ]noite|marinho)/)
    ?? t.match(/(?:deixa|muda|coloca|poe).*(?:interface|menus?|barras?|editor).*\b(escuro|claro|grafite|azul)\b/);
  if (tema) return { acoes: [{ nome: "tema_interface", entrada: { tema: ALIAS_TEMA_UI[tema[1]] ?? "automatico" } }] };

  // criação pelo formulário (modo híbrido): menus/boxes do botão direito, faixas de opções e containers editáveis
  const lista = (trecho) => String(trecho ?? "").split(/\s*(?:,|;|\be\b|\n)\s*/i).map(x => x.replace(/^["“”']|["“”']$/g, "").trim()).filter(Boolean);
  const aposCom = (re) => { const m = t.match(re); return m ? texto.slice(m.index + m[0].length) : ""; };
  const verboCria = /^(cria|criar|crie|monta|montar|faz|fazer|gera|gerar|adiciona|adicionar|quero|insere|inserir)\b/.test(t);
  if (verboCria && /\b(menu de contexto|box do botao direito|menu do botao direito|caixa do botao direito|box de contexto)\b/.test(t)) {
    const itens = lista(aposCom(/\bcom (?:os |as )?(?:itens |opcoes |comandos )?/)).map(x => (/^(-|separador)$/i.test(x) ? "-" : x));
    return { acoes: [{ nome: "construtor_criar", entrada: { tipo: "menu", dados: { nome: "Menu de contexto", ...(itens.length ? { itens } : {}) } } }], resposta: `Criei o menu pelo formulário${itens.length ? ` com ${itens.filter(i => i !== "-").join(", ")}` : ""}. Dá para editar tudo na aba "Geral" do modo híbrido.` };
  }
  if (verboCria && /\b(faixa de opcoes|ribbon)\b/.test(t) && /\babas?\b/.test(t) && !/\boffice\b|microsoft 365|\bm365\b/.test(t)) {
    const abas = lista(aposCom(/\babas?\s+/));
    const estiloFaixa = /\b(escura|escuro|noc|dark)\b/.test(t) ? "escuro" : /\b(vidro|glass)/.test(t) ? "vidro" : /\b(neon|ciber|cyber)/.test(t) ? "ciber" : /\bmac/.test(t) ? "mac" : /\boffice\b/.test(t) ? "office" : "";
    if (abas.length) return { acoes: [{ nome: "construtor_criar", entrada: { tipo: "ribbon", dados: { nome: "Faixa de opções", abas, ...(estiloFaixa ? { estilo: estiloFaixa } : {}) } } }], resposta: `Criei a faixa de opções pelo formulário com as abas ${abas.join(", ")}. Adicione grupos e comandos na aba "Faixa de opções" do modo híbrido.` };
  }
  if (verboCria && /\b(barra lateral|sidebar|menu lateral)\b/.test(t)) {
    const itens = lista(aposCom(/\bcom (?:os |as )?(?:itens |opcoes )?/));
    return { acoes: [{ nome: "construtor_criar", entrada: { tipo: "lateral", dados: { nome: "Barra lateral", ...(itens.length ? { itens } : {}) } } }], resposta: `Criei a barra lateral retrátil pelo formulário${itens.length ? ` com ${itens.join(", ")}` : ""}. O botão ☰ alterna entre larga e só ícones.` };
  }
  // tema completo: "aplica o tema neon"
  const mt = t.match(/\b(?:aplic\w+|usa\w*|muda\w*|troca\w*|coloca\w*|p[oô]e)\b.*\btema\s+(axiom|hefestus|hospitalar|vidro|glass\w*|neon|cyber\w*|ciber\w*|industrial|minimalista|fluent|office|retro)\b|\btema\s+(axiom|hefestus|hospitalar|vidro|glass\w*|neon|cyber\w*|ciber\w*|industrial|minimalista|fluent|office|retro)\b/);
  if (mt) {
    const w = mt[1] ?? mt[2];
    const tema = /^glass/.test(w) ? "vidro" : /^(cyber|ciber)/.test(w) ? "neon" : w === "office" ? "fluent" : w;
    return { acoes: [{ nome: "construtor_tema", entrada: { tema } }], resposta: `Apliquei o tema ${tema} em todos os itens do formulário. Dá para desfazer num passo (Ctrl+Z).` };
  }
  // componentes: breadcrumb, paginação, chips, badges, progresso, stepper, toasts, status, barra de ferramentas
  const compRe = [["breadcrumb", /\b(breadcrumb|trilha de navegacao)\b/], ["paginacao", /\bpaginacao\b/], ["chips", /\bchips?\b/], ["badges", /\b(badges?|contadores)\b/], ["progresso", /\b(barras? de progresso|progresso)\b/],
    ["stepper", /\bstepper\b/], ["toast", /\b(toasts?|notificacoes)\b/], ["status", /\b(caixas? de status|boxes? de status|cartoes? de status)\b/], ["toolbar", /\b(barra de ferramentas|toolbar)\b/], ["modal", /\b(modal|janela modal|dialogo|caixa de dialogo)\b/], ["calendario", /\bcalendario\b/], ["slider", /\b(sliders?|controles? deslizantes?)\b/], ["tabela", /\btabela de dados\b/], ["grafico", /\b(cartao com grafico|card com grafico|grafico de barras)\b/], ["radial", /\b(menu circular|menu radial com)\b/]];
  const cp = verboCria && !/\b(office|photoshop|figma|illustrator|powerpoint|modelo)\b/.test(t) ? compRe.find(([, re]) => re.test(t)) : null;
  if (cp) {
    const itens = lista(aposCom(/\bcom (?:os |as )?(?:itens |etapas |opcoes )?/));
    const estiloBarra = /\bneon\b/.test(t) ? "neon" : /\bminimalista\b/.test(t) ? "minimalista" : /\bclassic[ao]\b/.test(t) ? "classica" : "";
    const dados = { modelo: cp[0], ...(itens.length && cp[0] !== "paginacao" ? { itens } : {}), ...(estiloBarra && cp[0] === "toolbar" ? { estiloBarra } : {}), ...(/\bvertical\b/.test(t) ? { vertical: true } : {}) };
    return { acoes: [{ nome: "construtor_criar", entrada: { tipo: "componente", dados } }], resposta: `Criei o componente (${cp[0]}) pelo formulário${itens.length ? ` com ${itens.join(", ")}` : ""}. Edite itens, cores e efeito na aba "Geral" do modo híbrido.` };
  }
  if (verboCria && /\b(paineis divididos|paineis acoplaveis|paineis dock|layout dock|tela dividida|split panels?)\b/.test(t)) {
    const regioes = [/\bsem (?:o )?(?:painel )?esquerd/.test(t) ? "" : "esq", /\bsem (?:o )?(?:painel )?direit/.test(t) ? "" : "dir", /\bsem (?:o )?(?:painel )?(?:inferior|de baixo)/.test(t) ? "" : "baixo"].filter(Boolean);
    return { acoes: [{ nome: "construtor_criar", entrada: { tipo: "paineis", dados: { regioes } } }], resposta: "Criei os painéis divididos pelo formulário: arraste os divisores, recolha com ‹ › ⌄ ou use as setas no divisor. Ponha seus elementos sobre as áreas de conteúdo." };
  }
  if (verboCria && /\b(abas de documento|abas de navegador|abas estilo navegador|barra de abas de documento)\b/.test(t)) {
    const abas = lista(aposCom(/\bcom (?:as )?(?:abas )?/));
    return { acoes: [{ nome: "construtor_criar", entrada: { tipo: "abasDoc", dados: { nome: "Abas de documento", ...(abas.length ? { abas } : {}) } } }], resposta: `Criei as abas de documento pelo formulário${abas.length ? ` com ${abas.join(", ")}` : ""}.` };
  }
  if (verboCria && /\b(blocos|tiles|grade de icones)\b/.test(t)) {
    const itens = lista(aposCom(/\bcom (?:os |as )?(?:blocos |itens )?/));
    return { acoes: [{ nome: "construtor_criar", entrada: { tipo: "blocos", dados: { nome: "Blocos", ...(/cart(?:ao|oes)/.test(t) ? { variante: "cartao" } : {}), ...(itens.length ? { itens } : {}) } } }], resposta: `Criei os blocos pelo formulário${itens.length ? ` com ${itens.join(", ")}` : ""}. Ajuste colunas, estilo e cores na aba "Geral".` };
  }
  const cmdFaixa = t.match(/^(?:adiciona|adicionar|coloca|colocar|poe|inclui|incluir)\s+(?:o |um |uma )?(?:comando|botao)\s+(.+?)\s+(?:na|a|em|nas)\s+(?:aba|guia)\s+(.+?)(?:\s+(?:no|do|em|dentro d[oa]) grupo\s+(.+))?$/);
  if (cmdFaixa) {
    const faixa = n.construtor().itens.filter(i => i.tipo === "ribbon").at(-1);
    if (faixa) {
      const lim = s => String(s ?? "").replace(/^["“”']|["“”']$/g, "").trim();
      const pega = (alvo) => { const i = t.indexOf(alvo); return i < 0 ? lim(alvo) : lim(texto.slice(i, i + alvo.length)); };
      return { acoes: [{ nome: "construtor_adicionar", entrada: { id: faixa.id, onde: "comando", dados: { rotulo: pega(cmdFaixa[1]), aba: pega(cmdFaixa[2]), ...(cmdFaixa[3] ? { grupo: pega(cmdFaixa[3]) } : {}) } } }], resposta: `Adicionei o comando "${pega(cmdFaixa[1])}" na aba "${pega(cmdFaixa[2])}" da faixa.` };
    }
  }
  const itemMenu = t.match(/^(?:adiciona|adicionar|coloca|colocar|poe|inclui|incluir)\s+(?:o |um |uma )?(?:item|opcao)\s+(.+?)\s+(?:no|ao|em)\s+(?:menu|box)/);
  if (itemMenu) {
    const menu = n.construtor().itens.filter(i => i.tipo === "menu").at(-1);
    if (menu) { const i = t.indexOf(itemMenu[1]); const rot = texto.slice(i, i + itemMenu[1].length).replace(/^["“”']|["“”']$/g, "").trim(); return { acoes: [{ nome: "construtor_adicionar", entrada: { id: menu.id, onde: "item", dados: { rotulo: rot } } }], resposta: `Adicionei "${rot}" ao menu.` }; }
  }
  if (verboCria && /\b(container|caixa)\b/.test(t) && /\b(pelo formulario|no formulario|modo formulario|editavel pelo formulario)\b/.test(t)) {
    const nome = aspas(texto) ?? undefined;
    const lg = t.match(/(\d{2,4})\s*x\s*(\d{2,4})/);
    return { acoes: [{ nome: "construtor_criar", entrada: { tipo: "caixa", dados: { ...(nome ? { nome } : {}), ...(lg ? { largura: +lg[1], altura: +lg[2] } : {}) } } }], resposta: "Criei o container pelo formulário. Edite tamanho, estilo e comportamento na aba \"Geral\"." };
  }
  // "recriar o menu completo estilo office atual" → modelo Office completo (barra de título, abas, faixa, status)
  const verboModelo = /^(recri[ae]r?|cri[ae]r?|mont[ae]r?|faz|faca|fazer|gera|gerar|insere|inserir|adiciona|adicionar|coloca|colocar|poe|quero|bota|desenha|desenhar|constr[oi]i|construir)\b/.test(t);
  if (verboModelo) {
    const office = /\boffice\b|microsoft 365|\bm365\b|\bword\b|\bribbon\b/.test(t);
    const completo = /\bcomplet[oa]\b|\binteir[oa]\b|\btodo\b/.test(t);
    const menuOuFaixa = /\b(menu|menus|faixa|ribbon|barra de menus|abas)\b/.test(t);
    if (/\b(menu|tela|painel)\s+(de |do )?(arquivo|backstage)\b/.test(t) && (office || /backstage/.test(t))) {
      return { acoes: [{ nome: "inserir_modelo", entrada: { modelo: "menuArquivoOffice" } }], resposta: "Inseri o Menu Arquivo no estilo Office." };
    }
    if (/\b(faixa|ribbon|menu)\b/.test(t) && /\bword\b/.test(t) && !completo && !/\b(hibrid|powerpoint)/.test(t)) {
      return { acoes: [{ nome: "inserir_modelo", entrada: { modelo: "faixaWord" } }], resposta: "Montei a faixa no estilo Word: título com acesso rápido, abas e grupos de estruturas diferentes (Área de Transferência, Fonte, Parágrafo, Estilos com galeria, Editando). Para montar a sua, use a categoria \"Grupos de faixa\" na Biblioteca." };
    }
    if (/\b(faixa|ribbon|menu)\b/.test(t) && /\b(powerpoint|power point|ppt)\b/.test(t) && !/\bhibrid/.test(t)) {
      return { acoes: [{ nome: "inserir_modelo", entrada: { modelo: "faixaPowerPoint" } }], resposta: "Montei a faixa no estilo PowerPoint: barra de título com acesso rápido, abas, Inserir Formas e Estilos de Forma. As abas trocam o painel, ▲ Recolher esconde a faixa e o botão direito abre o menu." };
    }
    if (/\b(faixa|ribbon)\b/.test(t) && /\b(hibrid[oa]s?|recolh\w*|botao direito|powerpoint)\b/.test(t)) {
      const recolhida = /\bcomeca\w* recolhid|\bso (as )?abas\b/.test(t);
      return { acoes: [{ nome: "inserir_modelo", entrada: { modelo: recolhida ? "faixaHibridaRecolhida" : "faixaHibrida" } }], resposta: "Inseri a faixa de opções híbrida: clique numa aba para mostrar o painel, ▲ Recolher esconde a faixa e o botão direito abre o menu (acesso rápido, personalizar, recolher). Funciona na Prévia e no HTML exportado." };
    }
    if (menuOuFaixa && (office || completo)) {
      return { acoes: [{ nome: "inserir_modelo", entrada: { modelo: "officeCompleto" } }], resposta: "Montei o menu completo no estilo Office: barra de título com pesquisa, abas, faixa com grupos e barra de status. Tudo é editável; use Camadas para ver a estrutura." };
    }
  }

  // faixa do Axiom Studio recriada
  if (/axiom/.test(t) && /(faixa|ribbon|menus?)/.test(t) && /(cri|recri|insere|inserir|coloca|monta|adiciona|quero)/.test(t))
    return { acoes: [{ nome: "inserir_modelo", entrada: { modelo: "faixaAxiom" } }], resposta: "Montei a faixa do Axiom Studio com as peças do Hefestus: 11 abas, grupos, dropdowns e comandos que emitem o sinal ax|painel|grupo|controle." };
  if (/\bradios?\b/.test(t) && /(cri|insere|inserir|coloca|monta|adiciona|quero|modelo|controlador)/.test(t))
    return { acoes: [{ nome: "inserir_modelo", entrada: { modelo: "radioControlador" } }], resposta: "Inseri o Controlador de rádios: menu expansível que toca, cadastra, favorita e filtra emissoras, com espectro de áudio e backup. Teste na Prévia." };
  // qualquer modelo de Menus/Barras/Grupos citado pelo nome (ex.: "insere o mega menu")
  if (/\b(insere|inserir|poe|coloca|cria|criar|adiciona|adicionar|quero|monta)\b/.test(t)) {
    const cand = MODELOS.filter(x => ["Menus", "Barras", "Grupos de faixa"].includes(x.cat) && t.includes(sem(x.nome))).sort((a, b) => b.nome.length - a.nome.length)[0];
    if (cand) return { acoes: [{ nome: "inserir_modelo", entrada: { modelo: cand.id } }], resposta: `Inseri "${cand.nome}". ${cand.desc}.` };
  }
  // biblioteca: "insere o modelo menu suspenso" / "cria uma barra de ferramentas"
  const mod = t.match(/(?:insere|inserir|poe|coloca|cria|adiciona)\s+(?:o |a |um |uma )?(?:modelo (?:de |do |da )?)?(barra de menus|menu suspenso|menu de contexto|faixa de opcoes|barra de ferramentas|barra flutuante|trilho lateral|barra superior|barra de abas|barra de status|painel de propriedades|caixa de dialogo|lista de notificacoes)/);
  if (mod) {
    const m = MODELOS.find(x => sem(x.nome) === mod[1]);
    if (m) return { acoes: [{ nome: "inserir_modelo", entrada: { modelo: m.id } }] };
  }
  if (/^(?:audita|auditar|analisa|analisar|verifica|verificar|revisa|revisar)\b.*\b(?:interface|acessibilidade|tela|contraste|tudo)\b/.test(t) || /^auditoria\b/.test(t)) {
    const itens = n.auditar();
    const linhas = itens.slice(0, 6).map(i => `• ${i.nome ? i.nome + ": " : ""}${i.mensagem}`).join("\n");
    return { acoes: [{ nome: "auditar_interface", entrada: { corrigir: false } }], resposta: itens.length ? `Achei ${itens.length} ponto(s):\n${linhas}${itens.length > 6 ? "\n…(o resto está no painel Auditoria)" : ""}\nDiga "corrige a acessibilidade" para aplicar o que tem conserto automático.` : "Nenhum problema encontrado: contraste, rótulos, estados e eventos estão em ordem." };
  }
  if (/^(?:corrige|corrigir|conserta|consertar|arruma|arrumar)\b.*\b(?:acessibilidade|contraste|auditoria|problemas|tudo)\b/.test(t)) return { acoes: [{ nome: "auditar_interface", entrada: { corrigir: true } }], resposta: "Apliquei as correções automáticas da auditoria. O que sobrar (sem conserto automático) aparece no painel Auditoria." };
  if (/^(?:gera|gerar|baixa|baixar|exporta|exportar)\b.*\b(?:documentacao|docs|contrato)\b/.test(t)) return { acoes: [{ nome: "gerar_documentacao", entrada: {} }], resposta: "Gerei a documentação do contrato de sinais (Markdown) e baixei o arquivo." };
  const art = t.match(/^(?:exporta|exportar|gera|gerar|baixa|baixar)\b.*\b(react|vue|web ?component|componente web|tokens?|tema css|variaveis css|storybook|testes? visua\w+|playwright)\b/);
  if (art) {
    const k = art[1];
    const tipo = /react/.test(k) ? "react" : /vue/.test(k) ? "vue" : /web|componente/.test(k) ? "webcomponent" : /storybook/.test(k) ? "storybook" : /teste|playwright/.test(k) ? "testes" : "tema";
    return { acoes: [{ nome: "exportar_artefato", entrada: { tipo } }], resposta: `Exportei o ${tipo === "tema" ? "tema (tokens CSS)" : "componente " + tipo} e baixei o arquivo.` };
  }
  const expl = t.match(/^(?:explica|explicar|descreve|descrever|o que (?:e|faz))\b\s*(.*)$/);
  if (expl) {
    const alvo = expl[1].trim() ? acharElemento(expl[1], n, ctx.ultimo) : n.selecao ? { id: n.selecao } : null;
    if (alvo?.id && n.elemento(alvo.id)) return { acoes: [], resposta: n.explicarElemento(alvo.id) };
  }
  const manter = t.match(/^(?:mantem|manter|fico com|fica com|escolho|escolhe|quero)\b.*?\bopcao (\d)\b/);
  if (manter) return { acoes: [{ nome: "manter_opcao", entrada: { numero: Number(manter[1]) } }] };
  const varia = t.match(/^(?:cria|criar|gera|gerar|faz|fazer)\b.*\bvariantes?\b(?:.*\b(tamanhos?|estilos?)\b)?/) ?? t.match(/^(?:cria|criar|gera|gerar)\b.*\b(tamanhos? p\/?m\/?g|p\/?m\/?g)\b/);
  if (varia) {
    const alvo = n.selecao ? { id: n.selecao } : acharElemento(t, n, ctx.ultimo);
    if (alvo?.id && n.elemento(alvo.id)) return { acoes: [{ nome: "criar_variantes", entrada: { id: alvo.id, tipo: /estilo/.test(t) ? "estilos" : "tamanhos" } }] };
  }
  const refin = t.match(/^(?:refina|refinar|melhora|melhorar|da opcoes|opcoes (?:de|para)|sugere|sugerir)\b(.*)$/);
  if (refin && /refin|opcoes|opcao|variac/.test(t)) {
    const alvo = refin[1].trim() ? acharElemento(refin[1], n, ctx.ultimo) : null;
    const id = alvo?.id && n.elemento(alvo.id) ? alvo.id : n.selecao;
    if (id && n.elemento(id)) return { acoes: [{ nome: "refinar_elemento", entrada: { id } }] };
  }
  const bool = t.match(/^(?:(une|unir|uni|funde|fundir)|(subtrai|subtrair|recorta|recortar)|(interseccao|intersecao|intersectar|interseccionar)|(exclui|excluir|exclua) (?:a )?sobreposicao)\b(?:.*\b(?:formas?|elementos?|selecionad\w+|shapes?)\b)?/);
  if (bool && n.selecionados().length >= 2 && (/formas?|elementos?|selecionad|shape/.test(t) || t.split(" ").length <= 2)) {
    const operacao = bool[1] ? "unir" : bool[2] ? "subtrair" : bool[3] ? "intersectar" : "excluir";
    return { acoes: [{ nome: "combinar_formas", entrada: { ids: n.selecionados(), operacao } }] };
  }
  if (/^(?:converte|converter|transforma|transformar)\b.*\b(?:em|para) vetor\b/.test(t) && n.selecionados().length) return { acoes: [{ nome: "converter_em_vetor", entrada: { ids: n.selecionados() } }] };
  const agr = t.match(/^(?:agrupa|agrupar|junta|juntar)\b.*?(?:em (linha|coluna))?$/);
  if (agr && n.selecionados().length) return { acoes: [{ nome: "agrupar_em_container", entrada: { ids: n.selecionados(), modo: agr[1] ?? "livre" } }] };

  // ligar evento: "quando clicar em X, abre Y"
  const ev = texto.match(/quando (?:clicar|clico|clicarem|apertar|aperto|tocar)\s+(?:em|no|na)?\s*(.+?),?\s+(abr[ae]|abrir|mostr[ae]|mostrar|exib[ae]|fech[ae]|fechar|escond[ae]|esconder|altern[ae]|alternar|destac[ae]|destacar)\s+(?:o|a)?\s*(.+?)[.!]?$/i);
  if (ev) {
    const origem = acharElemento(ev[1], n, ctx.ultimo);
    const alvo = acharElemento(ev[3], n, ctx.ultimo);
    if (!origem.id || origem.implicito) return { acoes: [], resposta: `Não achei "${ev[1]}". Diga o nome como aparece em Camadas.` };
    if (!alvo.id || alvo.implicito) return { acoes: [], resposta: `Não achei "${ev[3]}". Diga o nome como aparece em Camadas.` };
    const v = sem(ev[2]);
    const acao = /^(abr|mostr|exib)/.test(v) ? "abrir" : /^(fech|escond)/.test(v) ? "fechar" : /^altern/.test(v) ? "alternar" : "destacar";
    const nomeSinal = sem(`${n.rotulo(origem.id)}_clicado`).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return { acoes: [{ nome: "ligar_evento", entrada: { id: origem.id, evento: "onClick", sinal: nomeSinal, acao, alvo: alvo.id } }] };
  }

  // criar
  if (/^(cri[ae]r?|adicion[ae]r?|insir[ae]|inserir|coloc[ae]r?|poe|ponha|faz|faca|fazer|quero|bota|gera)\b/.test(t) && !/\b(texto|rotulo|titulo) (do|da|de)\b/.test(t)) {
    const tipo = tipoNo(t);
    if (tipo) {
      const def = CATALOGO[tipo].padrao();
      const props = {};
      const cor = corNo(texto);
      if (cor) props[tipo === "texto" ? "estilo.cor" : "estilo.fundo"] = cor;
      if (cor && tipo === "botao" && cor !== "transparent") props["estados.hover.fundo"] = cor;
      const dito = textoDito(texto);
      if (dito && CAMPO_TEXTO[tipo]) props[CAMPO_TEXTO[tipo]] = dito;
      if (tipo === "icone") {
        const achado = Object.entries(SIMBOLOS).find(([palavra]) => new RegExp(`\\b${palavra}\\b`).test(t));
        if (achado && ICONES_ELEMENTO.includes(achado[1])) props.simbolo = achado[1];
        if (cor) { delete props["estilo.fundo"]; props["estilo.cor"] = cor; }
      }
      if (tipo === "linha" && cor) { props["estilo.fundo"] = cor; }
      if (tipo === "forma") {
        const estr = t.match(/estrela (?:de )?(\d+)/), pol = t.match(/pol[ií]gono (?:de )?(\d+)|(\d+) lados/), arco = /\b(arco|anel)\b/.test(t);
        if (pol || /poligono/.test(t)) { props.forma = "poligono"; props.lados = Number(pol?.[1] ?? pol?.[2] ?? 6); }
        else if (estr && !["4", "5", "6"].includes(estr[1])) { props.forma = "estrela"; props.lados = Number(estr[1]); props["razao"] = 0.45; }
        else if (arco) { props.forma = "arco"; props.inicio = 0; props.fim = /meia|semi/.test(t) ? 180 : 270; props.espessura = 30; }
        else {
          const achada = PALAVRAS_FORMA.find(([re]) => re.test(t));
          props.forma = achada ? achada[1] : "retangulo";
        }
      }
      const pos = posicao(texto, tela, def.largura, def.altura);
      return { acoes: [{ nome: "criar_elemento", entrada: { tipo, ...(pos ?? {}), ...(Object.keys(props).length ? { propriedades: props } : {}) } }] };
    }
  }

  // a partir daqui, o pedido é sobre um elemento existente
  const ref = acharElemento(texto, n, ctx.ultimo);
  if (ref.ambiguos) {
    return { acoes: [], resposta: `Qual deles? ${ref.ambiguos.map(e => `"${e.nome}"`).join(", ")}. Diga o nome ou selecione na tela.` };
  }
  const id = ref.id;
  const el = id ? n.elemento(id) : null;
  const alterar = props => ({ acoes: [{ nome: "alterar_elemento", entrada: { id, propriedades: props } }] });
  const precisaAlvo = () => ({ acoes: [], resposta: "Sobre qual elemento? Selecione na tela ou diga o nome." });

  // estilo avançado: gradiente, sombra, traço, cantos e mistura
  const gradiente = t.match(/gradiente/);
  if (gradiente && /(aplic|coloc|poe|faz|fazer|muda|troca|usa|quero|cri)/.test(t) || /^gradiente\b/.test(t)) {
    if (!el) return precisaAlvo();
    const cores = coresEmOrdem(texto).slice(0, 4);
    const ang = t.match(/(-?\d+)\s*(graus|°)/);
    const tipoG = /radial|circular/.test(t) ? "radial" : /conico|angular/.test(t) ? "conico" : "linear";
    const lista = cores.length >= 2 ? cores : ["#06b6d4", "#2563eb"];
    const angulo = ang ? Number(ang[1]) : /vertical|de cima para baixo/.test(t) ? 180 : /horizontal|da esquerda/.test(t) ? 90 : 135;
    return alterar({ "estilo.preenchimentos": [{ tipo: tipoG, angulo, paradas: lista.map((cor, i) => ({ pos: Math.round(i * 100 / (lista.length - 1)), cor, alfa: 1 })) }] });
  }
  if (/\bsombra\b/.test(t) && /(coloc|poe|faz|adicion|aplic|quero|d[ae]|mais|menos|sem|tira|remov)/.test(t)) {
    if (!el) return precisaAlvo();
    if (/(sem|tira|remov)/.test(t)) return alterar({ "estilo.efeitos": [], "estilo.sombra": "nenhuma" });
    const forte = /forte|grande|marcada|profunda/.test(t), interna = /interna|embutid/.test(t);
    const ef = interna ? { tipo: "sombraInterna", x: 0, y: 2, blur: 8, espalhar: 0, cor: "#00000059" }
      : forte ? { tipo: "sombra", x: 0, y: 14, blur: 32, espalhar: -4, cor: "#00000052" } : { tipo: "sombra", x: 0, y: 4, blur: 14, espalhar: 0, cor: "#00000029" };
    return alterar({ "estilo.efeitos": [...(el.estilo?.efeitos ?? []), ef] });
  }
  if (/\b(borda|contorno|traco)\b/.test(t) && /(tracejad|pontilhad)/.test(t)) {
    if (!el) return precisaAlvo();
    const w = t.match(/(\d+)\s*px/);
    const cor = corNo(texto) ?? el.estilo?.borda ?? "#1f2937";
    return alterar({ "estilo.tracos": [{ cor, largura: w ? Number(w[1]) : 2, posicao: "dentro", estilo: /pontilhad/.test(t) ? "pontilhado" : "tracejado" }] });
  }
  if (/\bcantos?\b/.test(t) && /(cima|topo|baixo|base|esquerd|direit)/.test(t) && /(arredond|raio)/.test(t)) {
    if (!el) return precisaAlvo();
    const r = Number(t.match(/(\d+)\s*px/)?.[1] ?? 16);
    const c = [0, 0, 0, 0];
    if (/cima|topo/.test(t)) { c[0] = r; c[1] = r; }
    if (/baixo|base/.test(t)) { c[2] = r; c[3] = r; }
    if (/esquerd/.test(t)) { c[0] = r; c[3] = r; }
    if (/direit/.test(t)) { c[1] = r; c[2] = r; }
    return alterar({ "estilo.cantos": c });
  }
  if (/mistur|blend|multiplicar|sobrepor|clarear|escurecer/.test(t) && /(modo|mistur|blend|coloc|poe|usa|aplic)/.test(t)) {
    if (!el) return precisaAlvo();
    const m = /multiplic/.test(t) ? "multiply" : /sobrepor|overlay/.test(t) ? "overlay" : /clarear/.test(t) ? "lighten" : /escurecer/.test(t) ? "darken" : /tela|screen/.test(t) ? "screen" : "normal";
    return alterar({ "estilo.mistura": m });
  }

  if (/^(apag[ae]r?|remov[ae]r?|exclu[ia]r?|delet[ae]r?|tir[ae]r?)\b/.test(t)) {
    return el ? { acoes: [{ nome: "remover_elemento", entrada: { id } }] } : precisaAlvo();
  }

  const novoTexto = texto.match(/(?:muda|mude|troca|troque|altera|altere|coloca|coloque|p[oõ]e|escreve|escreva)\s+(?:o\s+)?(?:texto|r[oó]tulo|t[ií]tulo|nome|mensagem|placeholder)\b.*?\s+para\s+["“]?(.+?)["”]?[.!]?$/i);
  if (novoTexto) {
    if (!el) return precisaAlvo();
    const campo = /\bnome\b/.test(t) && !CAMPO_TEXTO[el.tipo] ? "nome" : CAMPO_TEXTO[el.tipo] ?? "nome";
    return alterar({ [campo]: novoTexto[1].trim() });
  }

  const giro = t.match(/^(gir[ae]r?|rotacion[ae]r?|vir[ae]r?)\b.*?(-?\d+)\s*(graus|°)?/);
  if (giro || /^(gir[ae]r?|rotacion[ae]r?|vir[ae]r?)\b/.test(t)) {
    if (!el) return precisaAlvo();
    const graus = giro ? Number(giro[2]) : 90;
    return alterar({ rotacao: ((Math.round((el.rotacao ?? 0) + graus) % 360) + 540) % 360 - 180 });
  }
  if (/^(espelh[ae]r?|inverte|inverta)\b/.test(t)) {
    if (!el) return precisaAlvo();
    return /vertical|de cabeca para baixo/.test(t) ? alterar({ espelharV: !el.espelharV }) : alterar({ espelharH: !el.espelharH });
  }

  if (/^(centraliz[ae]r?)\b/.test(t)) {
    if (!el) return precisaAlvo();
    return { acoes: [{ nome: "organizar", entrada: { id, acao: "centralizar_horizontal" } }, { nome: "organizar", entrada: { id, acao: "centralizar_vertical" } }] };
  }

  if (/^(mov[ae]r?|lev[ae]r?|posicion[ae]r?|manda|mande|joga|coloc[ae]r?|poe)\b/.test(t)) {
    if (!el) return precisaAlvo();
    const pos = posicao(texto, tela, el.largura, el.altura);
    if (pos) return alterar(pos);
  }

  if (/\b(aument[ae]r?|maior|amplia)\b/.test(t) || /\b(diminu[ia]r?|menor|reduz[ai]?r?)\b/.test(t)) {
    if (!el) return precisaAlvo();
    const mais = /\b(aument[ae]r?|maior|amplia)\b/.test(t);
    if (/\b(fonte|letra|texto)\b/.test(t)) return alterar({ "estilo.tamanhoFonte": Math.max(8, el.estilo.tamanhoFonte + (mais ? 4 : -2)) });
    if (/\b(raio|arredond)/.test(t)) return alterar({ "estilo.raio": Math.max(0, el.estilo.raio + (mais ? 6 : -4)) });
    const f = mais ? 1.25 : 0.8;
    return alterar({ largura: Math.round(el.largura * f), altura: Math.round(el.altura * f) });
  }

  if (/arredond/.test(t)) return el ? alterar({ "estilo.raio": Math.max(16, el.estilo.raio) }) : precisaAlvo();
  if (/\b(quadrad[oa]|sem arredondar|cantos retos)\b/.test(t)) return el ? alterar({ "estilo.raio": 0 }) : precisaAlvo();
  if (/\bsem borda\b/.test(t)) return el ? alterar({ "estilo.larguraBorda": 0 }) : precisaAlvo();
  if (/\b(com sombra|sombra)\b/.test(t)) return el ? alterar({ "estilo.sombra": /\bsem sombra\b/.test(t) ? "nenhuma" : "media" }) : precisaAlvo();
  if (/\bnegrito\b/.test(t)) return el ? alterar({ "estilo.peso": 700 }) : precisaAlvo();
  if (/^(escond[ae]r?|ocult[ae]r?|some com)\b/.test(t)) return el ? alterar({ visivel: false }) : precisaAlvo();
  if (/^(mostr[ae]r?|exib[ae]r?)\b/.test(t)) return el ? alterar({ visivel: true }) : precisaAlvo();
  if (/^(trav[ae]r?)\b/.test(t)) return el ? alterar({ travado: true }) : precisaAlvo();
  if (/^(destrav[ae]r?)\b/.test(t)) return el ? alterar({ travado: false }) : precisaAlvo();

  // estados: foco por teclado e desabilitado
  const c0 = corNo(texto);
  if (/\b(foco|anel de foco|contorno)\b/.test(t) && c0) return el ? alterar({ "estados.focus.contorno": c0 }) : precisaAlvo();
  if (/\b(desabilitad[oa]|indisponivel|inativ[oa])\b/.test(t) && (c0 || /opacidade|apagad|esmaecid/.test(t))) {
    if (!el) return precisaAlvo();
    const props = {};
    if (c0) props[/\b(texto|letra)\b/.test(t) ? "estados.disabled.cor" : "estados.disabled.fundo"] = c0;
    const op = t.match(/(\d{1,3})\s*%/);
    if (op) props["estados.disabled.opacidade"] = Math.min(100, +op[1]) / 100;
    return alterar(props);
  }
  const cor = corNo(texto);
  if (cor) {
    if (!el) return precisaAlvo();
    const doTexto = /\b(texto|letra|fonte|escrita)\b/.test(t) || el.tipo === "texto";
    const props = { [doTexto ? "estilo.cor" : "estilo.fundo"]: cor };
    if (!doTexto && el.tipo === "botao" && cor !== "transparent") props["estados.hover.fundo"] = cor;
    if (/\bborda\b/.test(t)) return alterar({ "estilo.borda": cor });
    return alterar(props);
  }

  return { acoes: [], resposta: `Não entendi esse pedido no modo local.\n\n${AJUDA}` };
}


