import { recomendarMenu } from "../nucleo/expertiseMenus.js";
// Ferramentas do agente: a única porta do agente para o documento.
// Cada uma valida a entrada (só tipos do catálogo, só propriedades visuais, valores
// coerentes) e executa pelo núcleo, ou seja, pela skill de proteção e pelo histórico.
import { validarConstrutor as validarConstrutorSpec } from "../nucleo/construtor.js";
import { gerarTema, aplicarTemaGerado } from "../nucleo/temaGerado.js";
import { FORMAS } from "../nucleo/formas.js";
import { FONTES_BIB } from "../nucleo/fontes.js";
import { MODELOS } from "../nucleo/modelos.js";
import { TEMAS_UI } from "../ui/temas.js";
import {
  CATALOGO, CAMPOS_ESTILO, CAMPOS_COMPORTAMENTO, CAMPOS_ACESSIBILIDADE, CAMPOS_LAYOUT, ACOES,
  CAMPOS_TEXTO, CAMPOS_AVANCADO, CAMPOS_TRANSFORMACAO, CAMPOS_EFEITOS, CAMPOS_RESPONSIVO, CAMPOS_FILHO, CAMPOS_ABERTURA,
} from "../nucleo/catalogo.js";
import { COMPORTAMENTOS } from "../nucleo/comportamentos.js";
import { limparPreenchimentos, limparTracos, limparEfeitos, limparCantos } from "../nucleo/estiloAvancado.js";

export const PALETAS_VALIDAS = ["claro", "escuro", "forja"];
export const TEMAS_UI_VALIDOS = Object.keys(TEMAS_UI);
const ACOES_VALIDAS = ACOES.map(a => a[0]);
const ORGANIZAR = ["alinhar_esquerda", "centralizar_horizontal", "alinhar_direita", "alinhar_topo", "centralizar_vertical", "alinhar_base", "frente", "tras", "duplicar", "girar_90", "espelhar_horizontal", "espelhar_vertical"];
const COR = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|#[0-9a-f]{8}|transparent|)$/i;

/** Definições de campo permitidas para um tipo: caminho → { tipo, opcoes? }. */
export function camposPermitidos(tipo) {
  const defs = [
    ...CAMPOS_ESTILO, ...CAMPOS_COMPORTAMENTO, ...CAMPOS_ACESSIBILIDADE, ...CAMPOS_LAYOUT,
    ...CAMPOS_TEXTO, ...CAMPOS_TRANSFORMACAO, ...CAMPOS_EFEITOS, ...CAMPOS_AVANCADO,
    ...CAMPOS_RESPONSIVO, ...CAMPOS_FILHO, ...CAMPOS_ABERTURA,
    { caminho: "nome", tipo: "texto" },
    ...(CATALOGO[tipo]?.campos ?? []),
  ];
  return Object.fromEntries(defs.map(d => [d.caminho, d]));
}

/** Converte e valida um valor para o campo; lança Error com mensagem clara se não servir. */
function coagir(def, caminho, valor) {
  switch (def.tipo) {
    case "numero": {
      const n = Number(valor);
      if (!Number.isFinite(n)) throw new Error(`${caminho} precisa ser número`);
      if (def.min !== undefined && n < def.min) return def.min;
      if (def.max !== undefined && n > def.max) return def.max;
      return caminho === "estilo.opacidade" || (def.passo && def.passo < 1) ? n : Math.round(n);
    }
    case "check": return valor === true || valor === "true" || valor === 1;
    case "cor": {
      const c = String(valor ?? "").trim();
      if (!COR.test(c)) throw new Error(`${caminho} precisa ser cor hexadecimal (#rrggbb) ou "transparent"`);
      return c.toLowerCase();
    }
    case "select": {
      const ok = def.opcoes.map(o => String(o[0]));
      if (!ok.includes(String(valor))) throw new Error(`${caminho} aceita: ${ok.join(", ")}`);
      return /^\d+$/.test(String(valor)) ? Number(valor) : String(valor);
    }
    case "avancado": {
      const f = { preenchimentos: limparPreenchimentos, tracos: limparTracos, efeitos: limparEfeitos, cantos: limparCantos }[def.lista];
      return f(valor);
    }
    case "lista": {
      const l = Array.isArray(valor) ? valor : String(valor).split(/\n|,/);
      return l.map(s => String(s).trim()).filter(Boolean).slice(0, 30);
    }
    default: return String(valor ?? "").slice(0, 500);
  }
}

/** Valida um mapa { caminho: valor } para o elemento; devolve o mapa limpo. */
export function validarPropriedades(tipo, props) {
  if (!props || typeof props !== "object" || Array.isArray(props)) throw new Error("propriedades deve ser um objeto { caminho: valor }");
  const permitidos = camposPermitidos(tipo);
  const limpo = {};
  for (const [caminho, valor] of Object.entries(props)) {
    const def = permitidos[caminho];
    if (!def) throw new Error(`"${caminho}" não é uma propriedade de ${CATALOGO[tipo]?.nome ?? tipo}. Use uma de: ${Object.keys(permitidos).join(", ")}`);
    limpo[caminho] = coagir(def, caminho, valor);
  }
  return limpo;
}

/** Resumo enxuto do documento para o agente ler. */
export function resumoDocumento(n) {
  const t = n.tela;
  return {
    tela: { largura: t.largura, altura: t.altura, fundo: t.fundo },
    selecionado: n.selecao,
    ...(n.selecionados().length > 1 ? { selecionados: n.selecionados() } : {}),
    elementos: n.elementos().map(e => ({
      id: e.id, tipo: e.tipo, nome: e.nome,
      x: e.x, y: e.y, largura: e.largura, altura: e.altura,
      ...(e.rotulo !== undefined ? { rotulo: e.rotulo } : {}),
      ...(e.texto !== undefined ? { texto: e.texto } : {}),
      ...(e.titulo !== undefined ? { titulo: e.titulo } : {}),
      ...(e.mensagem !== undefined ? { mensagem: e.mensagem } : {}),
      fundo: e.estilo?.fundo, corTexto: e.estilo?.cor,
      ...(e.visivel === false ? { visivel: false } : {}),
      ...(e.travado ? { travado: true } : {}),
      ...(e.pai ? { pai: e.pai } : {}),
      ...(e.tipo === "container" ? { layout: e.layout?.modo } : {}),
      ...(e.rotacao ? { rotacao: e.rotacao } : {}),
      ...(e.simbolo ? { simbolo: e.simbolo } : {}),
      ...((e.eventos ?? []).length ? { eventos: e.eventos.map(v => `${v.tipo}→${v.dispara}${v.acao ? ` (${v.acao} ${v.alvo})` : ""}`) } : {}),
    })),
  };
}

/** Resultado padronizado de um comando da skill, para devolver ao agente. */
function resultado(n, r, extra = {}) {
  if (!r) return { ok: false, erro: "nada foi feito" };
  const out = { ok: r.acao === "aplicado" || r.acao === "aplicado_parcial", ...extra };
  if (r.regressoesCorrigidas?.length) out.protecao = `desfiz mudança não pedida em ${n.descrever(r.regressoesCorrigidas)}`;
  if (r.pergunta) {
    out.pergunta_pendente = true;
    out.aviso = "O usuário precisa responder uma pergunta na tela antes de continuar. Pare aqui e avise.";
  }
  if (r.acao === "perguntado") out.ok = false;
  return out;
}

const existe = (n, id) => {
  const el = n.elemento(String(id ?? ""));
  if (!el || String(id).startsWith("__")) throw new Error(`não existe elemento "${id}". Ids atuais: ${n.elementos().map(e => e.id).join(", ") || "nenhum"}`);
  return el;
};

/**
 * As ferramentas, no formato do recurso `sample` (name, description, inputSchema, execute).
 * `registrar(texto)` anota cada ação feita, para o painel mostrar.
 */
export function criarFerramentas(n, app, registrar = () => {}) {
  const tipos = Object.keys(CATALOGO);
  return [
    {
      name: "criar_elemento",
      description: `Cria um elemento na tela. tipo: ${tipos.join(", ")}. x/y são o canto superior esquerdo em px. propriedades opcionais usam os mesmos caminhos de alterar_elemento. Devolve o id criado.`,
      inputSchema: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: tipos },
          x: { type: "number" }, y: { type: "number" }, largura: { type: "number" }, altura: { type: "number" },
          propriedades: { type: "object", description: "ex.: {\"rotulo\": \"Enviar\", \"estilo.fundo\": \"#16a34a\"}" },
        },
        required: ["tipo"],
      },
      execute(i) {
        const tipo = String(i.tipo);
        if (!CATALOGO[tipo]) throw new Error(`tipo inválido: ${tipo}. Use: ${tipos.join(", ")}`);
        const props = i.propriedades ? validarPropriedades(tipo, i.propriedades) : {};
        const extra = {};
        if (i.largura !== undefined) extra.largura = Math.max(8, Math.round(Number(i.largura)));
        if (i.altura !== undefined) extra.altura = Math.max(8, Math.round(Number(i.altura)));
        const x = i.x !== undefined ? Number(i.x) : undefined;
        const y = i.y !== undefined ? Number(i.y) : undefined;
        const id = n.criar(tipo, x, y, extra);
        let r = { acao: "aplicado" };
        if (Object.keys(props).length) r = n.definir(id, props, `Configurar ${n.rotulo(id)}`);
        registrar(`Criou ${n.rotulo(id)}`);
        return resultado(n, r, { id, nome: n.rotulo(id) });
      },
    },
    {
      name: "alterar_elemento",
      description: `Muda propriedades de um elemento existente. Caminhos: x, y, largura, altura, nome, visivel, travado, estilo.fundo, estilo.cor (cor do texto), estilo.borda, estilo.larguraBorda, estilo.raio, estilo.tamanhoFonte, estilo.peso (300|400|600|700), estilo.sombra (nenhuma|pequena|media|grande), estilo.opacidade (0-1), estilo.fonte (${Object.keys(FONTES_BIB).join("|")}), estilo.alinhamento (esquerda|centro|direita), estilo.entrelinha, estilo.desfoque (px), estilo.vidro (px, vidro fosco), rotacao (graus), espelharH, espelharV, estados.hover.fundo, estados.active.fundo, transicao.duracao, acessibilidade.ariaLabel, e os do tipo (botao: rotulo, desabilitado; texto: texto; campo: placeholder; toggle: ligado; menu: itens; modal: titulo, mensagem, overlay, fechaAoClicarFora, iniciaAberto; toast: mensagem, autoFechar, iniciaAberto; icone: simbolo, traco; container: layout.modo (livre|linha|coluna), layout.espaco, layout.margem, layout.alinhar (inicio|centro|fim|esticar), layout.abracar; forma: forma (${Object.keys(FORMAS).join(", ")}), texto). Responsivo: restricoes.h (auto|esquerda|direita|ambos|centro|escala), restricoes.v (auto|topo|base|ambos|centro|escala), responsivo.ocultarAbaixo e responsivo.mostrarAbaixo (0|480|768|1024), dimensao.largura (fixa|preencher|abracar) e dimensao.altura (fixa|preencher) dentro de containers, layout.justificar (inicio|centro|fim|entre), layout.quebrar, layout.empilharAbaixo. Abrir/fechar: abertura.iniciaFechado, abertura.animacao (nenhuma|aparecer|deslizar|crescer|lateral), abertura.fecharFora, abertura.fecharEsc, abertura.fecharAoEscolher, abertura.fundoEscuro, abertura.ancorar (abre colado ao gatilho); estilo avançado (valem para caixa, container, forma, elipse, botão): estilo.preenchimentos = lista [{tipo: solido|linear|radial|conico|imagem, cor, angulo, paradas:[{pos 0-100, cor, alfa 0-1}], opacidade}] (o primeiro fica por cima), estilo.tracos = [{cor, largura, posicao: dentro|centro|fora, estilo: solido|tracejado|pontilhado, ponta, juncao}], estilo.efeitos = [{tipo: sombra|sombraInterna|desfoque|vidro, x, y, blur, espalhar, cor (aceita rgba)}], estilo.cantos = [topo-esq, topo-dir, base-dir, base-esq], estilo.mistura (normal|multiply|screen|overlay...); forma paramétrica: forma=poligono|estrela|arco com lados, razao, canto, giro, inicio, fim, espessura; estados.ativo.fundo e estados.ativo.cor. Linha usa estilo.fundo como cor e altura como espessura. Cores em #rrggbb. Para a tela inteira use id "__canvas" com largura, altura ou fundo.`,
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" }, propriedades: { type: "object" } },
        required: ["id", "propriedades"],
      },
      execute(i) {
        const id = String(i.id);
        let props;
        if (id === "__canvas") {
          props = {};
          for (const [k, v] of Object.entries(i.propriedades ?? {})) {
            if (k === "fundo") { const c = String(v).trim(); if (!COR.test(c)) throw new Error("fundo precisa ser #rrggbb"); props.fundo = c; }
            else if (k === "largura" || k === "altura") props[k] = Math.max(200, Math.round(Number(v)));
            else throw new Error(`a tela aceita só largura, altura e fundo (recebi ${k})`);
          }
        } else {
          props = validarPropriedades(existe(n, id).tipo, i.propriedades);
        }
        const r = n.definir(id, props, `Alterar ${Object.keys(props).join(", ")} de ${n.rotulo(id)}`);
        registrar(`Alterou ${n.rotulo(id)}: ${Object.keys(props).join(", ")}`);
        return resultado(n, r, { id });
      },
    },
    {
      name: "remover_elemento",
      description: "Remove um elemento. O usuário pode desfazer com Ctrl+Z.",
      inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
      execute(i) {
        const id = String(i.id);
        existe(n, id);
        const nome = n.rotulo(id);
        const r = n.remover(id);
        registrar(`Removeu ${nome}`);
        return resultado(n, r);
      },
    },
    {
      name: "ligar_evento",
      description: `Faz um elemento emitir um sinal quando algo acontece e, opcionalmente, executar uma ação visual em outro elemento. evento: onClick, onContext (botão direito), onHover, onFocus, onChange, onSelect, onOpen, onClose (conforme o tipo). acao: ${ACOES_VALIDAS.filter(Boolean).join(", ")} ou vazio. Não existe lógica de negócio: o sinal só avisa quem usa a interface.`,
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" }, evento: { type: "string" }, sinal: { type: "string", description: "nome em snake_case, ex. login_enviado" },
          acao: { type: "string" }, alvo: { type: "string", description: "id do elemento afetado pela ação" },
        },
        required: ["id", "evento", "sinal"],
      },
      execute(i) {
        const id = String(i.id);
        const el = existe(n, id);
        const evento = String(i.evento);
        const permitidos = CATALOGO[el.tipo].eventos;
        if (!permitidos.includes(evento)) throw new Error(`${CATALOGO[el.tipo].nome} aceita os eventos: ${permitidos.join(", ") || "nenhum"}`);
        const acao = String(i.acao ?? "");
        if (!ACOES_VALIDAS.includes(acao)) throw new Error(`acao aceita: ${ACOES_VALIDAS.filter(Boolean).join(", ")} ou vazio`);
        const alvo = acao ? String(i.alvo ?? "") : "";
        if (acao) existe(n, alvo);
        const sinal = String(i.sinal).trim().replace(/\s+/g, "_").replace(/[^\w]/g, "").toLowerCase() || `${id}_${evento.slice(2).toLowerCase()}`;
        const eventos = [...(el.eventos ?? []).filter(e => e.tipo !== evento), { tipo: evento, dispara: sinal, acao, alvo }];
        const r = n.definir(id, { eventos }, `Ligar ${evento} de ${el.nome} ao sinal ${sinal}`);
        registrar(`Ligou ${evento} de ${el.nome} → ${sinal}${acao ? ` (${acao} ${n.rotulo(alvo)})` : ""}`);
        return resultado(n, r);
      },
    },
    {
      name: "aplicar_paleta",
      description: `Recolore TODOS os elementos do canvas com uma paleta. Use só quando o usuário pedir para recolorir os elementos/o design; "tema" sozinho é da interface (use tema_interface). paleta: ${PALETAS_VALIDAS.join(", ")}. Cores que o usuário definiu antes viram uma pergunta para ele.`,
      inputSchema: { type: "object", properties: { paleta: { type: "string", enum: PALETAS_VALIDAS } }, required: ["paleta"] },
      execute(i) {
        const paleta = String(i.paleta ?? i.tema);
        if (!PALETAS_VALIDAS.includes(paleta)) throw new Error(`paleta aceita: ${PALETAS_VALIDAS.join(", ")}`);
        const r = app.aplicarPaleta(paleta);
        registrar(`Recoloriu os elementos com a paleta ${paleta}`);
        return resultado(n, r);
      },
    },
    {
      name: "tema_interface",
      description: `Muda o tema da INTERFACE do editor (menus, barras, painéis). Não mexe no canvas nem nos elementos. tema: ${TEMAS_UI_VALIDOS.join(", ")}.`,
      inputSchema: { type: "object", properties: { tema: { type: "string", enum: TEMAS_UI_VALIDOS } }, required: ["tema"] },
      execute(i) {
        const tema = String(i.tema);
        if (!TEMAS_UI_VALIDOS.includes(tema)) throw new Error(`tema aceita: ${TEMAS_UI_VALIDOS.join(", ")}`);
        app.definirTemaUI?.(tema);
        registrar(`Tema da interface: ${TEMAS_UI[tema].nome}`);
        return { ok: true, tema };
      },
    },
    {
      name: "ligar_comportamento",
      description: `Liga um comportamento pronto entre um gatilho e um alvo, num passo só. comportamento: ${Object.entries(COMPORTAMENTOS).map(([k, c]) => `${k} (${c.nome}: ${c.desc})`).join("; ")}.`,
      inputSchema: { type: "object", properties: { comportamento: { type: "string", enum: Object.keys(COMPORTAMENTOS) }, gatilho: { type: "string" }, alvo: { type: "string" } }, required: ["comportamento", "gatilho", "alvo"] },
      execute(i) {
        const g = String(i.gatilho);
        const a = String(i.alvo);
        existe(n, g);
        existe(n, a);
        const r = n.aplicarComportamento(String(i.comportamento), g, a);
        registrar(`${COMPORTAMENTOS[i.comportamento]?.nome ?? i.comportamento}: ${n.rotulo(g)} → ${n.rotulo(a)}`);
        return resultado(n, r);
      },
    },
    {
      name: "inserir_modelo",
      description: `Insere um modelo pronto da biblioteca (já montado com containers inteligentes). modelo: ${MODELOS.map(m => `${m.id} (${m.nome})`).join(", ")}. x e y opcionais (canto superior esquerdo).`,
      inputSchema: { type: "object", properties: { modelo: { type: "string" }, x: { type: "number" }, y: { type: "number" } }, required: ["modelo"] },
      execute(i) {
        const m = app.acharModelo?.(String(i.modelo)) ?? MODELOS.find(x => x.id === String(i.modelo));
        if (!m) throw new Error(`modelo desconhecido. Use: ${MODELOS.map(x => x.id).join(", ")}`);
        const ids = n.inserirModelo(m, i.x === undefined ? undefined : Number(i.x), i.y === undefined ? undefined : Number(i.y));
        registrar(`Inseriu o modelo ${m.nome} (${ids.length} peças)`);
        return resultado(n, n.ultimoResultado ?? { acao: "aplicado" }, { ids: ids.slice(0, 40), raiz: ids[0] });
      },
    },
    {
      name: "agrupar_em_container",
      description: "Põe elementos dentro de um novo container inteligente. modo: livre (mantém posições, move junto), linha ou coluna (arruma sozinho com espaço e margem).",
      inputSchema: { type: "object", properties: { ids: { type: "array", items: { type: "string" } }, modo: { type: "string", enum: ["livre", "linha", "coluna"] } }, required: ["ids"] },
      execute(i) {
        const ids = (i.ids ?? []).map(String);
        for (const id of ids) existe(n, id);
        const modo = ["livre", "linha", "coluna"].includes(i.modo) ? i.modo : "livre";
        const id = n.agruparEmContainer(ids, modo);
        registrar(`Agrupou ${ids.length} elementos em ${n.rotulo(id)} (${modo})`);
        return resultado(n, n.ultimoResultado, { id });
      },
    },
    {
      name: "criar_variantes",
      description: "Cria variantes de um componente lado a lado num container: tipo=\"tamanhos\" (P/M/G) ou tipo=\"estilos\" (primário, secundário, contorno, fantasma, perigo).",
      inputSchema: { type: "object", properties: { id: { type: "string" }, tipo: { type: "string", enum: ["tamanhos", "estilos"] } }, required: ["id", "tipo"] },
      execute(i) {
        existe(n, String(i.id));
        const r = i.tipo === "tamanhos" ? n.gerarTamanhos(String(i.id)) : n.gerarEstilos(String(i.id));
        registrar(`Criou variantes (${i.tipo}) de ${n.rotulo(String(i.id))}`);
        return resultado(n, r.resultado, { container: r.container, ids: r.ids });
      },
    },
    {
      name: "refinar_elemento",
      description: "Gera 3 opções de acabamento (1 suave, 2 contraste, 3 minimalista) do elemento, lado a lado, para o usuário escolher. Depois, manter_opcao fica com a escolhida.",
      inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
      execute(i) {
        existe(n, String(i.id));
        const r = n.refinar(String(i.id));
        registrar(`Gerou 3 opções para ${n.rotulo(String(i.id))}`);
        return resultado(n, r.resultado, { opcoes: r.opcoes });
      },
    },
    {
      name: "manter_opcao",
      description: "Fica com a opção N (1-3) gerada por refinar_elemento: aplica no elemento original e descarta as outras.",
      inputSchema: { type: "object", properties: { numero: { type: "integer" } }, required: ["numero"] },
      execute(i) {
        const r = n.manterOpcao(Number(i.numero));
        registrar(`Manteve a opção ${i.numero}`);
        return resultado(n, r);
      },
    },
    {
      name: "construtor_listar",
      description: "Lista o que já foi criado pelo FORMULÁRIO (modo híbrido): containers, menus/boxes do botão direito e faixas de opções, com ids e campos. Use antes de editar.",
      inputSchema: { type: "object", properties: {} },
      execute() {
        const spec = n.construtor();
        return { itens: spec.itens.map(i => ({ id: i.id, tipo: i.tipo, nome: i.nome, ...(i.tipo === "menu" ? { itens: i.itens.map(x => x.separador ? "-" : x.rotulo) } : {}), ...(i.tipo === "ribbon" ? { abas: i.abas.map(a => ({ nome: a.nome, grupos: a.grupos.map(g => ({ nome: g.nome, comandos: g.itens.map(c => c.rotulo) })) })) } : {}), ...(i.tipo === "caixa" ? { filhos: (i.filhos ?? []).map(f => f.rotulo ?? f.texto ?? f.simbolo) } : {}) })), problemas: validarConstrutorSpec(spec) };
      },
    },
    {
      name: "construtor_tema",
      description: "Aplica um TEMA COMPLETO a todos os itens do formulário (faixa, menus, blocos, laterais, abas, componentes, containers): axiom, hefestus, hospitalar, vidro, neon, industrial, minimalista, fluent, retro. Num passo desfazível.",
      inputSchema: { type: "object", properties: { tema: { type: "string", enum: ["axiom", "hefestus", "hospitalar", "vidro", "neon", "industrial", "minimalista", "fluent", "retro"] } }, required: ["tema"] },
      execute(i) {
        const r = n.construtorTema(String(i.tema));
        registrar(`Aplicou o tema ${i.tema}`);
        return resultado(n, n.ultimoResultado, { problemas: r.erros });
      },
    },
    {
      name: "construtor_criar",
      description: "PREFERIDO para criar menus e caixas: cria pelo formulário (tipo=paineis: painéis divididos com divisores arrastáveis; dados regioes esq|dir|baixo, tamEsq, tamDir, tamBaixo, largura, altura, titulos{esq,dir,baixo,centro}) (editável depois pelo usuário na aba do modo híbrido). tipo=caixa (container: nome, x, y, largura, altura, fundo, borda, raio, modo livre|linha|coluna, filhos[{tipo texto|botao|icone, texto|rotulo, sinal}]), tipo=menu (menu/box do botão direito: nome, itens[\"Copiar\", \"-\", {rotulo, icone, atalho, sinal}]) ou tipo=ribbon (faixa de opções: nome, abas[\"Início\", \"Inserir\"], busca, estilo office|claroHefestus|escuro|vidro|ciber|mac), tipo=blocos (grade de blocos home/touch/mega menu: colunas, variante icone|cartao, itens[{titulo, subtitulo, icone, status}]), tipo=lateral (barra lateral retrátil: marca, itens[{rotulo, icone}]) ou tipo=abasDoc (abas de documento estilo navegador: abas[\"Mapa\", \"Andar 1\"], fechavel). tipo=componente (modelo breadcrumb|paginacao|chips|badges|progresso|stepper|toast|status|toolbar|modal|calendario|slider|tabela|grafico|radial; modal: variante info|confirmacao|alerta|erro|sucesso, titulo, mensagem, itens[botões]; calendario: mes, ano, valor; grafico: tipoGrafico barras|linha|rosca, titulo, mensagem, legenda, serie 1,2,3, valor (rosca); radial: formaMenu circulo|hexagono; tabela: colunas[3], itens[{rotulo, valor, detalhe, cor}]; valor, total, estiloBarra classica|moderna|neon|minimalista, vertical, efeito nenhum|sombra|brilho|neon|vidro|gradiente|borda, itens[{rotulo, icone, valor, cor, detalhe}]). Todo item aceita efeito/acento; blocos/lateral/abasDoc têm formato/variante.",
      inputSchema: { type: "object", properties: { tipo: { type: "string", enum: ["caixa", "menu", "ribbon", "blocos", "lateral", "abasDoc", "componente", "paineis"] }, dados: { type: "object" } }, required: ["tipo"] },
      execute(i) {
        const r = n.construtorCriar(String(i.tipo), i.dados ?? {});
        registrar(`Criou ${({ ribbon: "uma faixa de opções", menu: "um menu", blocos: "blocos", lateral: "uma barra lateral", abasDoc: "abas de documento", componente: "um componente", paineis: "painéis divididos" })[i.tipo] ?? "um container"} pelo formulário`);
        return resultado(n, n.ultimoResultado, { id: r.id, problemas: r.erros });
      },
    },
    {
      name: "construtor_editar",
      description: "Muda um campo de um item criado pelo formulário, por caminho: caixa (nome, x, y, largura, altura, estilo.fundo, estilo.borda, estilo.raio, layout.modo, comportamento.sinal, comportamento.acao, comportamento.alvo, comportamento.menuContexto = id do menu que abre no botão direito, comportamento.hoverFundo), menu (nome, fundo, cor, hoverFundo, largura), ribbon (nome, banda, largura, abaAtiva).",
      inputSchema: { type: "object", properties: { id: { type: "string" }, caminho: { type: "string" }, valor: {} }, required: ["id", "caminho", "valor"] },
      execute(i) {
        const r = n.construtorEditar(String(i.id), String(i.caminho), i.valor);
        registrar(`Formulário: ${i.caminho} de ${i.id}`);
        return resultado(n, n.ultimoResultado, { ok: r.ok, problemas: r.erros });
      },
    },
    {
      name: "construtor_adicionar",
      description: "Acrescenta ao formulário: onde=filho (em caixa; dados: tipo, texto|rotulo, sinal), item ou separador (em menu; dados: rotulo, icone, atalho, sinal), aba (em ribbon; dados: nome), grupo (ribbon; dados: nome, aba), comando (ribbon; dados: rotulo, icone, sinal, aba, grupo), bloco (em blocos; dados: titulo, subtitulo, icone, status), item (também em lateral; dados: rotulo, icone), aba (também em abasDoc; dados: nome), subitem (em menu; dados: item, rotulo, atalho).",
      inputSchema: { type: "object", properties: { id: { type: "string" }, onde: { type: "string", enum: ["filho", "item", "separador", "aba", "grupo", "comando", "bloco", "subitem"] }, dados: { type: "object" } }, required: ["id", "onde"] },
      execute(i) {
        const r = n.construtorAdicionar(String(i.id), String(i.onde), i.dados ?? {});
        registrar(`Formulário: adicionou ${i.onde} em ${i.id}`);
        return resultado(n, n.ultimoResultado, { ok: r.ok, problemas: r.erros });
      },
    },
    {
      name: "construtor_remover",
      description: "Remove um item criado pelo formulário (e todos os elementos gerados por ele).",
      inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
      execute(i) {
        const id = String(i.id);
        if (!n.construtor().itens.some(x => x.id === id)) throw new Error(`item "${id}" não existe no formulário`);
        n.atualizarConstrutor(sp => { sp.itens = sp.itens.filter(x => x.id !== id); }, `Remover ${id} (formulário)`, id, { remover: true });
        registrar(`Removeu ${id} do formulário`);
        return resultado(n, n.ultimoResultado, {});
      },
    },
    {
      name: "importar_svg",
      description: "Desenha um ícone/ilustração: recebe o código SVG (path, rect, circle, ellipse, polygon, line; fill/stroke/transform; sem gradientes, texto ou filtros) e cria formas vetoriais editáveis agrupadas. Escreva o SVG com viewBox, ex.: 24x24.",
      inputSchema: { type: "object", properties: { svg: { type: "string" }, nome: { type: "string" }, x: { type: "number" }, y: { type: "number" } }, required: ["svg"] },
      execute(i) {
        const r = n.importarSVG(String(i.svg ?? "").slice(0, 200000), i.x, i.y, String(i.nome ?? "Ícone"));
        if (r.erro) throw new Error(r.erro);
        registrar(`Desenhou ${i.nome ?? "um ícone"} em SVG (${r.formas} forma(s))`);
        return resultado(n, n.ultimoResultado, { id: r.id, formas: r.formas });
      },
    },
    {
      name: "combinar_formas",
      description: "Operação booleana entre 2 ou mais formas/caixas/elipses: unir, subtrair (a mais ao fundo menos as de cima), intersectar ou excluir (tudo menos a sobreposição). Gera um vetor editável e remove os originais.",
      inputSchema: { type: "object", properties: { ids: { type: "array", items: { type: "string" } }, operacao: { type: "string", enum: ["unir", "subtrair", "intersectar", "excluir"] } }, required: ["ids", "operacao"] },
      execute(i) {
        const ids = (i.ids ?? []).map(String);
        for (const id of ids) existe(n, id);
        const r = n.booleana(ids, String(i.operacao));
        if (r.erro) throw new Error(r.erro);
        registrar(`${i.operacao} de ${ids.length} formas`);
        return resultado(n, n.ultimoResultado, { id: r.id });
      },
    },
    {
      name: "converter_em_vetor",
      description: "Transforma formas, caixas ou elipses em vetor livre (caminho editável por nós).",
      inputSchema: { type: "object", properties: { ids: { type: "array", items: { type: "string" } } }, required: ["ids"] },
      execute(i) {
        const ids = (i.ids ?? []).map(String);
        for (const id of ids) existe(n, id);
        const novos = n.converterEmVetor(ids);
        if (!novos.length) throw new Error("só formas, caixas, botões, campos e elipses viram vetor");
        registrar(`Converteu ${novos.length} elemento(s) em vetor`);
        return resultado(n, n.ultimoResultado, { ids: novos });
      },
    },
    {
      name: "criar_tema",
      description: "Cria e aplica um tema completo nos ELEMENTOS a partir de uma descrição: modo (escuro/claro), cor de destaque (azul, ciano, verde…), saturação (pastel, vibrante, neutro) e cantos (suaves, retos, pílula). Ex.: \"escuro com azul ciano e cantos suaves\".",
      inputSchema: { type: "object", properties: { descricao: { type: "string" } }, required: ["descricao"] },
      execute(i) {
        const tema = gerarTema(String(i.descricao ?? ""));
        if (!tema) throw new Error("não entendi o tema: diga o modo (escuro/claro) e uma cor de destaque");
        const r = aplicarTemaGerado(n, tema);
        registrar(`Aplicou o tema ${tema.nome}`);
        return { ...resultado(n, r), tema: { nome: tema.nome, ...tema.tokens, raio: tema.raio } };
      },
    },
    {
      name: "preparar_aplicativo_windows",
      description: "Abre a exportação do aplicativo Windows para configurar nome, versão e ícone. Gera material de compilação, não um EXE já compilado.",
      inputSchema: {type:"object",properties:{}},
      execute() { if (!app.exportarAplicativoWindows) throw new Error("Abra esta ferramenta no editor do Hefestus."); app.exportarAplicativoWindows(); return {estado:"aguardando_configuracao",exeGerado:false}; },
    },
    {
      name:'importar_html',
      description:'Recria uma página ou trecho HTML como artefato isolado, com código editável na Forja. Preserva CSS/JS embutidos sem executá-los no Designer; não converte cada tag em um objeto nativo.',
      inputSchema:{type:'object',properties:{html:{type:'string'},css:{type:'string'},js:{type:'string'},nome:{type:'string'},largura:{type:'number'},altura:{type:'number'},online:{type:'boolean'},combinarComSelecao:{type:'boolean'}},required:['html']},
      execute(i){const id=i.combinarComSelecao?n.comporHTMLComSelecao(i):n.importarHTML(i);if(!id)throw new Error('A criação do artefato não foi aplicada.');return {id,nome:n.elemento(id).nome,analise:n.elemento(id).codigo?.analise??null,modo:i.combinarComSelecao?'composicao-de-artefatos':'html-isolado',executadoNoDesigner:false};},
    },
    {
      name: "planejar_menu",
      description: "Recomenda o tipo e as regras de menu por objetivo. Leia antes de criar menus adaptativos; não altera o documento.",
      inputSchema: {type:"object",properties:{descricao:{type:"string"}},required:["descricao"]},
      execute(i) { return recomendarMenu(String(i.descricao || '')); },
    },
    {
      name: "auditar_interface",
      description: "Audita a interface: contraste WCAG, nome acessível, estado hover, transições longas, alvos pequenos, eventos apontando para elementos inexistentes, nomes repetidos. Com corrigir=true aplica as correções automáticas (num passo desfazível).",
      inputSchema: { type: "object", properties: { corrigir: { type: "boolean" } } },
      execute(i) {
        let itens = n.auditar();
        let corrigidos = 0;
        if (i.corrigir) { corrigidos = n.corrigirAuditoria(itens).corrigidos; itens = n.auditar(); registrar(`Corrigiu ${corrigidos} problema(s) da auditoria`); }
        else registrar(`Auditou a interface: ${itens.length} item(ns)`);
        return { corrigidos, restantes: itens.length, itens: itens.slice(0, 30).map(x => ({ gravidade: x.gravidade, elemento: x.nome, id: x.id, problema: x.mensagem, correcao: x.resumo })) };
      },
    },
    {
      name: "explicar_elemento",
      description: "Explica em palavras o que um elemento é, como aparece, como reage e que sinais emite.",
      inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
      execute(i) { const id = String(i.id); existe(n, id); return { texto: n.explicarElemento(id) }; },
    },
    {
      name: "exportar_artefato",
      description: "Exporta a interface como artefato derivado e baixa o arquivo: react (.jsx), vue (.vue), webcomponent (.js) ou tema (tokens de tema em CSS).",
      inputSchema: { type: "object", properties: { tipo: { type: "string", enum: ["react", "vue", "webcomponent", "tema", "storybook", "testes"] } }, required: ["tipo"] },
      execute(i) {
        const tipo = String(i.tipo);
        const texto = n.artefato(tipo);
        n.exportarArtefato(tipo);
        registrar(`Exportou ${tipo}`);
        return { bytes: texto.length };
      },
    },
    {
      name: "gerar_documentacao",
      description: "Gera a documentação Markdown do contrato de sinais, regras, elementos e auditoria, e baixa o arquivo.",
      inputSchema: { type: "object", properties: {} },
      execute() { n.exportarDocumentacao(); registrar("Gerou a documentação do contrato de sinais"); return { texto: n.documentacao().slice(0, 1500) }; },
    },
    {
      name: "colocar_no_container",
      description: "Coloca um elemento dentro de um container existente (ou tira, com container vazio). Em linha/coluna ele se arruma sozinho.",
      inputSchema: { type: "object", properties: { id: { type: "string" }, container: { type: "string" } }, required: ["id"] },
      execute(i) {
        const id = String(i.id);
        existe(n, id);
        const c = String(i.container ?? "");
        if (c) { existe(n, c); if (n.elemento(c).tipo !== "container") throw new Error(`${c} não é um container`); }
        const r = n.definir(id, { pai: c }, c ? `Colocar ${n.rotulo(id)} em ${n.rotulo(c)}` : `Tirar ${n.rotulo(id)} do container`);
        registrar(c ? `Colocou ${n.rotulo(id)} em ${n.rotulo(c)}` : `Tirou ${n.rotulo(id)} do container`);
        return resultado(n, r);
      },
    },
    {
      name: "organizar",
      description: `Alinha à tela, muda a camada ou duplica um elemento. acao: ${ORGANIZAR.join(", ")}.`,
      inputSchema: { type: "object", properties: { id: { type: "string" }, acao: { type: "string", enum: ORGANIZAR } }, required: ["id", "acao"] },
      execute(i) {
        const id = String(i.id);
        existe(n, id);
        const acao = String(i.acao);
        const al = { alinhar_esquerda: "esquerda", centralizar_horizontal: "centroH", alinhar_direita: "direita", alinhar_topo: "topo", centralizar_vertical: "centroV", alinhar_base: "base" }[acao];
        let r;
        let extra = {};
        if (al) r = n.alinhar(id, al);
        else if (acao === "frente" || acao === "tras") r = n.camada(id, acao);
        else if (acao === "duplicar") { const novo = n.duplicar(id); r = { acao: "aplicado" }; extra = { id: novo }; }
        else if (acao === "girar_90") r = n.girar([id], 90);
        else if (acao === "espelhar_horizontal") r = n.espelhar([id], "H");
        else if (acao === "espelhar_vertical") r = n.espelhar([id], "V");
        else throw new Error(`acao aceita: ${ORGANIZAR.join(", ")}`);
        registrar(`${acao.replace(/_/g, " ")}: ${n.rotulo(id)}`);
        return resultado(n, r, extra);
      },
    },
  ];
}

