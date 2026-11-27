// Componentes do formulário (breadcrumb, paginação, chips, badges, progresso, stepper, toast, status, barra de ferramentas)
// e os efeitos visuais comuns (sombra, brilho, vidro, neon, gradiente, borda). Tudo é DADO; a árvore de elementos sai daqui.
import { cont, texto, icone, linha, elemento } from "./modelos.js";
import { evento as _ev } from "./modelos.js";

const evento = (tipo, dispara, acao, alvo) => _ev(tipo, acao, alvo, dispara);
const sem = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toLowerCase();
const num = (v, r, min = 0, max = 5000) => (Number.isFinite(+v) ? Math.max(min, Math.min(max, +v)) : r);
const hex = (v, r) => (/^#[0-9a-f]{3,8}$/i.test(String(v ?? "")) || v === "transparent" ? v : r);
const larg = (t, tam = 13, extra = 0) => Math.ceil(String(t ?? "").length * tam * 0.58) + extra;
const mix = (c, a) => { const h = hex(c, "#888888"); return /^#[0-9a-f]{6}$/i.test(h) ? h + Math.round(a * 255).toString(16).padStart(2, "0") : h; };

// ------------------------------------------------------------ efeitos
export const EFEITOS = [["nenhum", "Nenhum"], ["sombra", "Sombra"], ["brilho", "Brilho (glow)"], ["neon", "Neon (borda + brilho)"], ["vidro", "Vidro fosco"], ["gradiente", "Gradiente"], ["borda", "Borda de destaque"]];
/** Propriedades de estilo de um efeito; mescle por cima das props do container. */
export function propsEfeito(efeito, acento = "#22d3ee", fundo = "#0f172a") {
  const a = hex(acento, "#22d3ee"), f = hex(fundo, "#0f172a");
  const sombra = (blur, alfa, tipo = "sombra") => ({ tipo, visivel: true, x: 0, y: 0, blur, espalhar: 0, cor: mix(a, alfa) });
  switch (efeito) {
    case "sombra": return { "estilo.sombra": "grande" };
    case "brilho": return { "estilo.efeitos": [sombra(20, 0.45)] };
    case "neon": return { "estilo.borda": a, "estilo.larguraBorda": 1, "estilo.efeitos": [sombra(18, 0.7), sombra(10, 0.25, "sombraInterna")] };
    case "vidro": return { "estilo.vidro": 14, "estilo.fundo": "#ffffff1f", "estilo.borda": "#ffffff40", "estilo.larguraBorda": 1 };
    case "gradiente": return { "estilo.preenchimentos": [
      { tipo: "linear", visivel: true, opacidade: 1, cor: a, angulo: 135, paradas: [{ pos: 0, cor: a, alfa: 0.45 }, { pos: 100, cor: a, alfa: 0 }] },
      { tipo: "solido", visivel: true, opacidade: 1, cor: f, paradas: [] }] };
    case "borda": return { "estilo.borda": a, "estilo.larguraBorda": 2 };
    default: return {};
  }
}

// ------------------------------------------------------------ estado "ativo" (abas, itens, dias): irmãos exclusivos
/** Contêiner oculto com um marcador por opção; clicar numa origem faz `mostrarSo` no marcador dela e o runtime marca a origem como ativa. */
export function marcadores(id, chaves, ativoIdx) {
  return cont(0, 0, 1, 1, { modo: "livre" }, { ref: `${id}_var_estado`, visivel: false, "abertura.iniciaFechado": true }, "Estados", chaves.map((k, i) =>
    cont(0, 0, 1, 1, {}, { ref: `${id}_var_estado_${k}`, ...(i === ativoIdx ? {} : { visivel: false, "abertura.iniciaFechado": true }) }, `Estado ${k}`, [])));
}
/** Props de uma origem exclusiva: visual inativo + `estados.ativo`; `on` marca o ativo inicial. */
export const propsAtivo = (on, inativo, ativo) => ({ "estilo.fundo": inativo.fundo ?? "transparent", ...(inativo.cor ? { "estilo.cor": inativo.cor } : {}), ...(inativo.raio != null ? { "estilo.raio": inativo.raio } : {}), ...(inativo.cantos ? { "estilo.cantos": inativo.cantos } : {}), "estados.ativo": ativo, ...(on ? { ativoInicial: true } : {}) });

// ------------------------------------------------------------ componentes
export const MODELOS_COMP = [
  ["breadcrumb", "Breadcrumb (trilha)"], ["paginacao", "Paginação"], ["chips", "Chips / tags"], ["badges", "Badges (contadores)"],
  ["progresso", "Barras de progresso"], ["stepper", "Stepper (etapas)"], ["toast", "Notificações (toasts)"], ["status", "Caixas de status"], ["toolbar", "Barra de ferramentas"],
  ["modal", "Janela modal (diálogo)"], ["calendario", "Calendário"], ["slider", "Controles deslizantes"], ["tabela", "Tabela de dados"], ["grafico", "Cartão com gráfico"], ["radial", "Menu radial (circular)"],
];
export const VARIANTES_MODAL = [["info", "Informação"], ["confirmacao", "Confirmação"], ["alerta", "Alerta"], ["erro", "Erro"], ["sucesso", "Sucesso"]];
export const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const ESTILOS_BARRA = [["classica", "Clássica (Office)"], ["moderna", "Moderna (ícones coloridos)"], ["neon", "Neon / escuro"], ["minimalista", "Minimalista"]];
export const FORMATOS_PROGRESSO = [["barra", "Barra contínua"], ["segmentada", "Segmentada"]];
const VERDE = "#22c55e", AMBAR = "#f59e0b", VERM = "#ef4444", AZUL = "#3b82f6";

const ITENS_PADRAO = {
  breadcrumb: [{ id: "i1", rotulo: "Home", icone: "casa", sinal: "ir_home" }, { id: "i2", rotulo: "Rede", icone: "", sinal: "ir_rede" }, { id: "i3", rotulo: "Switches", icone: "", sinal: "ir_switches" }, { id: "i4", rotulo: "Switch 01", icone: "", sinal: "" }],
  paginacao: [],
  chips: [{ id: "i1", rotulo: "Rede", icone: "wifi", cor: "#3b82f6", sinal: "chip_rede" }, { id: "i2", rotulo: "Backup", icone: "backup", cor: "#8b5cf6", sinal: "chip_backup" }, { id: "i3", rotulo: "Alerta", icone: "alerta", cor: AMBAR, sinal: "chip_alerta" }],
  badges: [{ id: "i1", rotulo: "Novo", valor: "", cor: AZUL }, { id: "i2", rotulo: "Alertas", valor: "3", cor: AMBAR }, { id: "i3", rotulo: "Offline", valor: "1", cor: VERM }, { id: "i4", rotulo: "Online", valor: "48", cor: VERDE }],
  progresso: [{ id: "i1", rotulo: "CPU", valor: 42, cor: VERDE }, { id: "i2", rotulo: "Memória", valor: 67, cor: AMBAR }, { id: "i3", rotulo: "Disco", valor: 85, cor: VERM }],
  stepper: [{ id: "i1", rotulo: "Dados", sinal: "" }, { id: "i2", rotulo: "Configuração", sinal: "" }, { id: "i3", rotulo: "Revisão", sinal: "" }, { id: "i4", rotulo: "Conclusão", sinal: "" }],
  toast: [{ id: "i1", rotulo: "Sucesso", detalhe: "Backup concluído.", icone: "online", cor: VERDE, sinal: "" }, { id: "i2", rotulo: "Atenção", detalhe: "Uso de CPU acima de 80%.", icone: "alerta", cor: AMBAR, sinal: "" }, { id: "i3", rotulo: "Erro", detalhe: "Falha na conexão com o servidor.", icone: "offline", cor: VERM, sinal: "" }],
  status: [{ id: "i1", rotulo: "Online", valor: "48", icone: "online", cor: VERDE, sinal: "" }, { id: "i2", rotulo: "Alerta", valor: "3", icone: "alerta", cor: AMBAR, sinal: "" }, { id: "i3", rotulo: "Offline", valor: "1", icone: "offline", cor: VERM, sinal: "" }, { id: "i4", rotulo: "Manutenção", valor: "2", icone: "manutencao", cor: AZUL, sinal: "" }],
  modal: [{ id: "i1", rotulo: "Cancelar", cor: "", sinal: "modal_cancelar" }, { id: "i2", rotulo: "Confirmar", cor: "#22d3ee", sinal: "modal_confirmar" }],
  calendario: [],
  slider: [{ id: "i1", rotulo: "Volume", valor: 70, cor: "#22d3ee" }, { id: "i2", rotulo: "Brilho", valor: 40, cor: "#f59e0b" }],
  tabela: [{ id: "i1", rotulo: "Painel 01", valor: "Online", detalhe: "10:24:32", cor: VERDE, sinal: "" }, { id: "i2", rotulo: "Servidor DB", valor: "Alerta", detalhe: "09:12:18", cor: AMBAR, sinal: "" }, { id: "i3", rotulo: "Roteador Core", valor: "Offline", detalhe: "08:47:20", cor: VERM, sinal: "" }],
  grafico: [],
  radial: [{ id: "i1", rotulo: "Início", icone: "casa", sinal: "radial_inicio" }, { id: "i2", rotulo: "Mapa", icone: "mapa", sinal: "radial_mapa" }, { id: "i3", rotulo: "Alertas", icone: "sino", sinal: "radial_alertas" }, { id: "i4", rotulo: "Ajustes", icone: "engrenagem", sinal: "radial_ajustes" }, { id: "i5", rotulo: "Usuário", icone: "usuario", sinal: "radial_usuario" }],
  toolbar: [{ id: "i1", rotulo: "Selecionar", icone: "selecionar", sinal: "ferr_selecionar" }, { id: "i2", rotulo: "Mover", icone: "mover", sinal: "ferr_mover" }, { id: "i3", rotulo: "Desenhar", icone: "caneta", sinal: "ferr_desenhar" }, { id: "i4", rotulo: "Texto", icone: "texto", sinal: "ferr_texto" }, { id: "i5", rotulo: "Zoom", icone: "zoom", sinal: "ferr_zoom" }],
};

export function novoComponente(seq, modelo = "breadcrumb") {
  const m = MODELOS_COMP.some(x => x[0] === modelo) ? modelo : "breadcrumb";
  const nome = MODELOS_COMP.find(x => x[0] === m)[1];
  return { id: `cp${seq}`, tipo: "componente", nome: `${nome} ${seq}`, x: 40, y: 40, modelo: m, largura: m === "progresso" || m === "slider" ? 280 : m === "toast" ? 380 : m === "modal" ? 380 : m === "tabela" ? 520 : m === "grafico" ? 260 : 0,
    fundo: "#0f1a2b", borda: "#1f3350", cor: "#e2e8f0", corSub: "#94a3b8", acento: "#22d3ee", raio: 10, efeito: "nenhum",
    titulo: m === "modal" ? "Confirmação" : m === "grafico" ? "Vendas (7 dias)" : "", mensagem: m === "modal" ? "Deseja realmente executar esta ação?" : m === "grafico" ? "R$ 125.420" : "", legenda: "+12%", variante: m === "modal" ? "confirmacao" : "", iniciaOculto: false,
    serie: "40,65,50,80,60,95,70", colunas: ["Nome", "Status", "Último acesso"], mes: 10, ano: 2026, raioMenu: 90,
    estiloBarra: "moderna", vertical: false, tipoGrafico: "barras", formaMenu: "circulo", formato: "barra", valor: m === "paginacao" ? 3 : m === "calendario" ? 14 : m === "grafico" ? 78 : 2, total: 8, ativo: 0,
    itens: JSON.parse(JSON.stringify(ITENS_PADRAO[m])) };
}
export const novoItemComp = c => {
  let n = c.itens.length + 1; while (c.itens.some(i => i.id === `i${n}`)) n++;
  const base = { id: `i${n}`, rotulo: `Item ${n}`, sinal: "" };
  if (["chips", "toolbar", "status", "toast", "radial"].includes(c.modelo)) base.icone = "estrela";
  if (c.modelo === "tabela") { base.valor = "Online"; base.detalhe = "00:00:00"; }
  if (c.modelo === "modal") base.cor = "";
  if (["chips", "badges", "progresso", "slider", "status", "toast", "tabela"].includes(c.modelo)) base.cor = "#3b82f6";
  if (["badges", "status"].includes(c.modelo)) base.valor = "0";
  if (c.modelo === "progresso" || c.modelo === "slider") base.valor = 50;
  if (c.modelo === "toast") base.detalhe = "Mensagem.";
  return base;
};

/** Ícone colorido do conjunto de ícones (cor própria do item). */
const icc = (x, y, t, nome, cor, ref, auto = false) => icone(x, y, t, nome || "estrela", cor, { ref, estiloIcone: "colorido", corIcone: auto ? "" : hex(cor, "") });

export function arvoreComponente(c) {
  const id = c.id, fundo = hex(c.fundo, "#0f1a2b"), borda = hex(c.borda, "#1f3350"), cor = hex(c.cor, "#e2e8f0"), sub = hex(c.corSub, "#94a3b8"), ac = hex(c.acento, "#22d3ee");
  const raio = num(c.raio, 10, 0, 60);
  const ctxEf = !["chips", "badges", "status", "toast"].includes(c.modelo);
  const base = (extra = {}) => ({ ref: id, ...extra, ...(ctxEf ? propsEfeito(c.efeito, ac, fundo) : {}) });
  const efCartao = k => propsEfeito(c.efeito, k, fundo);
  const caixa = (extra = {}) => ({ "estilo.fundo": fundo, "estilo.borda": borda, "estilo.larguraBorda": 1, "estilo.raio": raio, ...extra });
  const clique = it => (it.sinal ? { eventos: [evento("onClick", it.sinal, "", "")] } : {});
  const W = num(c.largura, 0, 0, 2000);
  const m = c.modelo;

  if (m === "breadcrumb") {
    const n = c.itens.length;
    const partes = c.itens.flatMap((it, i) => {
      const ult = i === n - 1, r = `${id}_${it.id}`, cc = ult ? ac : sub;
      const no = cont(0, 0, (it.icone ? 22 : 0) + larg(it.rotulo, 13, 8), 24, { modo: "linha", espaco: 6, alinhar: "centro" }, { ref: r, ...clique(it), ...(ult ? {} : { "estados.hover.fundo": "#ffffff14" }), "estilo.raio": 6 }, `Trilha ${it.rotulo}`, [
        ...(it.icone ? [icone(0, 0, 16, it.icone, cc, { ref: `${r}_ic` })] : []),
        texto(0, 0, larg(it.rotulo, 13, 4), 18, it.rotulo, ult ? cor : cc, 13, { ref: `${r}_tx`, ...(ult ? { "estilo.peso": 700 } : {}) }, `Rótulo ${it.rotulo}`)]);
      return ult ? [no] : [no, icone(0, 0, 14, "setaDir", sub, { ref: `${r}_sep` }, "Separador")];
    });
    return cont(0, 0, 100, 36, { modo: "linha", espaco: 4, margem: 6, alinhar: "centro", abracar: true }, base(caixa()), c.nome, partes);
  }

  if (m === "paginacao") {
    const total = num(c.total, 8, 1, 30), atual = num(c.valor, 1, 1, total);
    const variante = cur => {
      const v = `${id}_var_${cur}`;
      const botao = (rot, ic, on, sinal, alvoPag, off) => cont(0, 0, 30, 30, { modo: "livre" }, { ref: `${v}_${sinal}`, "estilo.raio": 8, "estilo.fundo": on ? ac : "transparent", ...(off ? {} : { "estados.hover.fundo": on ? ac : "#ffffff18", eventos: [evento("onClick", `${id}_${sinal}`, "mostrarSo", `${id}_var_${alvoPag}`)] }) }, String(rot), [
        ic ? icone(7, 7, 16, ic, off ? mix(cor, 0.35) : cor, { ref: `${v}_${sinal}_ic` }) : texto(0, 5, 30, 20, String(rot), on ? hex(c.corAcentoTexto, "#04201c") : cor, 13, { "estilo.alinhamento": "centro", ref: `${v}_${sinal}_tx`, ...(on ? { "estilo.peso": 700 } : {}) }, `Página ${rot}`)]);
      const paginas = []; for (let p = 1; p <= total; p++) if (p === 1 || p === total || Math.abs(p - cur) <= 1) paginas.push(p); else if (paginas.at(-1) !== "…") paginas.push("…");
      return cont(0, 0, 100, 30, { modo: "linha", espaco: 4, alinhar: "centro", abracar: true }, { ref: v, ...(cur === atual ? {} : { visivel: false, "abertura.iniciaFechado": true }) }, `Página ${cur}`, [
        botao("Anterior", "setaEsq", false, "ant", Math.max(1, cur - 1), cur === 1),
        ...paginas.map(p => p === "…" ? texto(0, 0, 20, 20, "…", sub, 13, { "estilo.alinhamento": "centro" }, "Reticências") : botao(p, null, p === cur, `pag_${p}`, p)),
        botao("Próxima", "setaDir", false, "prox", Math.min(total, cur + 1), cur === total)]);
    };
    return cont(0, 0, 100, 40, { modo: "coluna", espaco: 0, margem: 5, abracar: true }, base(caixa()), c.nome, Array.from({ length: total }, (_, k) => variante(k + 1)));
  }

  if (m === "chips") {
    return cont(0, 0, 100, 36, { modo: "linha", espaco: 8, margem: 6, alinhar: "centro", abracar: true }, base({ "estilo.fundo": "transparent", "estilo.borda": "transparent" }), c.nome,
      c.itens.map(it => { const r = `${id}_${it.id}`, k = hex(it.cor, ac); return cont(0, 0, 16 + (it.icone ? 22 : 0) + larg(it.rotulo, 13, 6), 28, { modo: "linha", espaco: 6, margem: 8, alinhar: "centro" },
        { ref: r, "estilo.fundo": mix(k, 0.16), "estilo.borda": mix(k, 0.6), "estilo.larguraBorda": 1, "estilo.raio": 14, ...clique(it), "estados.hover.fundo": mix(k, 0.3), ...(c.efeito && c.efeito !== "vidro" && c.efeito !== "gradiente" ? efCartao(k) : {}) }, `Chip ${it.rotulo}`, [
          ...(it.icone ? [icone(0, 0, 14, it.icone, k, { ref: `${r}_ic` })] : []), texto(0, 0, larg(it.rotulo, 13, 4), 18, it.rotulo, cor, 13, { ref: `${r}_tx` }, `Rótulo ${it.rotulo}`)]); }));
  }

  if (m === "badges") {
    return cont(0, 0, 100, 36, { modo: "linha", espaco: 8, margem: 6, alinhar: "centro", abracar: true }, base({ "estilo.fundo": "transparent", "estilo.borda": "transparent" }), c.nome,
      c.itens.map(it => { const r = `${id}_${it.id}`, k = hex(it.cor, ac), tv = String(it.valor ?? "");
        return cont(0, 0, 24 + larg(it.rotulo, 12, 0) + (tv ? 28 : 0), 24, { modo: "linha", espaco: 6, margem: 8, alinhar: "centro" }, { ref: r, "estilo.fundo": k, "estilo.raio": 12, ...clique(it), ...(c.efeito === "brilho" || c.efeito === "neon" ? { "estilo.efeitos": efCartao(k)["estilo.efeitos"] } : {}) }, `Badge ${it.rotulo}`, [
          texto(0, 0, larg(it.rotulo, 12, 2), 16, it.rotulo, "#ffffff", 12, { "estilo.peso": 700, ref: `${r}_tx` }, `Rótulo ${it.rotulo}`),
          ...(tv ? [cont(0, 0, Math.max(18, larg(tv, 11, 10)), 16, { modo: "livre" }, { ref: `${r}_n`, "estilo.fundo": "#00000040", "estilo.raio": 8 }, "Contador", [texto(0, 1, Math.max(18, larg(tv, 11, 10)), 14, tv, "#ffffff", 11, { "estilo.alinhamento": "centro", "estilo.peso": 700, ref: `${r}_n_tx` }, "Valor")])] : [])]); }));
  }

  if (m === "progresso") {
    const Wc = W || 280, seg = c.formato === "segmentada", trilho = Wc - 24 - 120;
    const linhas = c.itens.map(it => { const r = `${id}_${it.id}`, k = hex(it.cor, ac), v = num(it.valor, 0, 0, 100);
      const barra = seg
        ? cont(0, 0, trilho, 12, { modo: "linha", espaco: 3 }, { ref: `${r}_trilho` }, "Segmentos", Array.from({ length: 10 }, (_, i) => cont(0, 0, (trilho - 27) / 10, 12, {}, { ref: `${r}_s${i}`, "estilo.fundo": i < Math.round(v / 10) ? k : mix(cor, 0.14), "estilo.raio": 2 }, `Segmento ${i + 1}`)))
        : cont(0, 0, trilho, 10, { modo: "livre" }, { ref: `${r}_trilho`, "estilo.fundo": mix(cor, 0.14), "estilo.raio": 5 }, "Trilho", [cont(0, 0, Math.max(2, Math.round(trilho * v / 100)), 10, {}, { ref: `${r}_fill`, "estilo.fundo": k, "estilo.raio": 5 }, "Preenchimento", [])]);
      return cont(0, 0, Wc - 24, 22, { modo: "linha", espaco: 8, alinhar: "centro" }, { ref: r }, `Progresso ${it.rotulo}`, [
        texto(0, 0, 64, 16, it.rotulo, cor, 12, { ref: `${r}_tx` }, `Rótulo ${it.rotulo}`), barra, texto(0, 0, 40, 16, `${v}%`, sub, 12, { "estilo.alinhamento": "direita", ref: `${r}_v` }, "Valor")]); });
    return cont(0, 0, Wc, 100, { modo: "coluna", espaco: 8, margem: 12, abracar: true }, base(caixa()), c.nome, linhas);
  }

  if (m === "stepper") {
    const n = c.itens.length, atual = num(c.valor, 1, 1, n), passoW = 130;
    const variante = cur => {
      const v = `${id}_var_${cur}`;
      const passos = c.itens.flatMap((it, i) => {
        const feito = i + 1 < cur, agora = i + 1 === cur, r = `${v}_${it.id}`;
        const bola = cont(0, 0, 28, 28, { modo: "livre" }, { ref: `${r}_bola`, "estilo.fundo": feito ? ac : "transparent", "estilo.borda": feito || agora ? ac : mix(sub, 0.6), "estilo.larguraBorda": 2, "estilo.raio": 14 }, `Etapa ${i + 1}`,
          [feito ? icone(5, 5, 18, "check", hex(c.corAcentoTexto, "#04201c"), { ref: `${r}_ic` }) : texto(0, 4, 28, 18, String(i + 1), agora ? ac : sub, 13, { "estilo.alinhamento": "centro", "estilo.peso": 700, ref: `${r}_n` }, "Número")]);
        const passo = cont(0, 0, passoW, 52, { modo: "coluna", espaco: 4, alinhar: "centro" }, { ref: r, eventos: [evento("onClick", it.sinal || `${id}_etapa_${i + 1}`, "mostrarSo", `${id}_var_${i + 1}`)] }, `Passo ${it.rotulo}`, [bola, texto(0, 0, passoW - 8, 18, it.rotulo, agora ? cor : sub, 12, { "estilo.alinhamento": "centro", ...(agora ? { "estilo.peso": 700 } : {}), ref: `${r}_tx` }, `Rótulo ${it.rotulo}`)]);
        return i < n - 1 ? [passo, cont(0, 0, 44, 52, { modo: "livre" }, {}, "Ligação", [linha(0, 13, 44, 2, feito ? ac : mix(sub, 0.4), "Linha")])] : [passo];
      });
      return cont(0, 0, 100, 52, { modo: "linha", espaco: 0, alinhar: "inicio", abracar: true }, { ref: v, ...(cur === atual ? {} : { visivel: false, "abertura.iniciaFechado": true }) }, `Etapa atual ${cur}`, passos);
    };
    return cont(0, 0, 100, 70, { modo: "coluna", espaco: 0, margem: 12, abracar: true }, base(caixa()), c.nome, Array.from({ length: n }, (_, k) => variante(k + 1)));
  }

  if (m === "toast") {
    const Wc = W || 380;
    const cartoes = c.itens.map(it => { const r = `${id}_${it.id}`, k = hex(it.cor, ac);
      return cont(0, 0, Wc - 20, 58, { modo: "linha", espaco: 10, margem: 10, alinhar: "centro" }, { ref: r, "estilo.fundo": mix(k, 0.12), "estilo.borda": mix(k, 0.55), "estilo.larguraBorda": 1, "estilo.raio": 10, ...clique(it), ...efCartao(k) }, `Toast ${it.rotulo}`, [
        icc(0, 0, 26, it.icone || "info", k, `${r}_ic`),
        cont(0, 0, Wc - 112, 38, { modo: "coluna", espaco: 2, abracar: true }, {}, "Texto", [
          texto(0, 0, Wc - 112, 18, it.rotulo, cor, 13, { "estilo.peso": 700, ref: `${r}_tx` }, `Título ${it.rotulo}`),
          texto(0, 0, Wc - 112, 16, it.detalhe ?? "", sub, 12, { ref: `${r}_dt` }, "Detalhe")]),
        cont(0, 0, 22, 22, { modo: "livre" }, { ref: `${r}_x`, "estilo.raio": 11, "estados.hover.fundo": "#ffffff22", eventos: [evento("onClick", `${r}_fechar`, "fechar", r)] }, `Fechar ${it.rotulo}`, [icone(4, 4, 14, "fechar", sub, { ref: `${r}_x_ic` })])]); });
    return cont(0, 0, Wc, 100, { modo: "coluna", espaco: 8, margem: 10, abracar: true }, base({ ...caixa(), "estilo.fundo": "transparent", "estilo.borda": "transparent" }), c.nome, cartoes);
  }

  if (m === "status") {
    const cartoes = c.itens.map(it => { const r = `${id}_${it.id}`, k = hex(it.cor, ac);
      return cont(0, 0, 130, 74, { modo: "linha", espaco: 10, margem: 12, alinhar: "centro" }, { ref: r, "estilo.fundo": mix(k, 0.12), "estilo.borda": mix(k, 0.5), "estilo.larguraBorda": 1, "estilo.raio": raio, ...clique(it), "estados.hover.fundo": mix(k, 0.22), ...efCartao(k) }, `Status ${it.rotulo}`, [
        icc(0, 0, 34, it.icone || "info", k, `${r}_ic`),
        cont(0, 0, 70, 48, { modo: "coluna", espaco: 0, abracar: true }, {}, "Texto", [
          texto(0, 0, 70, 16, it.rotulo, sub, 12, { ref: `${r}_tx` }, `Rótulo ${it.rotulo}`),
          texto(0, 0, 70, 30, String(it.valor ?? ""), cor, 24, { "estilo.peso": 700, ref: `${r}_v` }, "Valor")])]); });
    return cont(0, 0, 100, 80, { modo: "linha", espaco: 10, margem: 6, alinhar: "centro", abracar: true }, base({ "estilo.fundo": "transparent", "estilo.borda": "transparent" }), c.nome, cartoes);
  }

  if (m === "modal") {
    const Wc = W || 380, v = { info: ["info", AZUL], confirmacao: ["ajuda", AZUL], alerta: ["alerta", AMBAR], erro: ["offline", VERM], sucesso: ["online", VERDE] }[c.variante] ?? ["info", AZUL];
    const botoes = c.itens.map((it, i) => { const r = `${id}_${it.id}`, ult = i === c.itens.length - 1, k = hex(it.cor, "") || (ult ? ac : "");
      return cont(0, 0, Math.max(84, larg(it.rotulo, 13, 32)), 34, { modo: "livre" }, { ref: r, "estilo.raio": 8, "estilo.fundo": k || "transparent", "estilo.borda": k || mix(sub, 0.7), "estilo.larguraBorda": 1, "estados.hover.fundo": k ? k : "#ffffff14",
        eventos: [evento("onClick", it.sinal || `${r}_clique`, "fechar", id)], "acessibilidade.ariaLabel": it.rotulo }, `Botão ${it.rotulo}`,
        [texto(0, 8, Math.max(84, larg(it.rotulo, 13, 32)), 18, it.rotulo, k ? hex(c.corAcentoTexto, "#04201c") : cor, 13, { "estilo.alinhamento": "centro", "estilo.peso": 700, ref: `${r}_tx` }, `Rótulo ${it.rotulo}`)]); });
    return cont(0, 0, Wc, 200, { modo: "coluna", espaco: 12, margem: 24, alinhar: "centro", abracar: true },
      base({ ...caixa(), "estilo.sombra": "grande", ...(c.iniciaOculto ? { visivel: false, "abertura.iniciaFechado": true } : {}), "acessibilidade.role": "dialog", "acessibilidade.ariaLabel": c.titulo || c.nome }), c.nome, [
        icc(0, 0, 44, v[0], v[1], `${id}_ic`),
        texto(0, 0, Wc - 48, 22, c.titulo ?? "", cor, 17, { "estilo.peso": 700, "estilo.alinhamento": "centro", ref: `${id}_titulo` }, "Título"),
        texto(0, 0, Wc - 48, 40, c.mensagem ?? "", sub, 13, { "estilo.alinhamento": "centro", ref: `${id}_msg` }, "Mensagem"),
        cont(0, 0, 100, 34, { modo: "linha", espaco: 10, abracar: true, alinhar: "centro" }, {}, "Botões", botoes)]);
  }

  if (m === "calendario") {
    const mes = num(c.mes, 10, 1, 12), ano = num(c.ano, 2026, 1900, 2200), sel = num(c.valor, 0, 0, 31);
    const primeiro = new Date(ano, mes - 1, 1).getDay(), dias = new Date(ano, mes, 0).getDate(), L = 32;
    const linhasN = Math.ceil((primeiro + dias) / 7);
    const dia = d => { const pos = primeiro + d - 1, on = d === sel;
      return cont((pos % 7) * L, Math.floor(pos / 7) * L, L, L, { modo: "livre" }, { ref: `${id}_d${d}`, "estilo.raio": 16, ...propsAtivo(on, { fundo: "transparent", cor, raio: 16 }, { fundo: ac, cor: hex(c.corAcentoTexto, "#04201c") }), "estados.hover.fundo": "#ffffff18",
        eventos: [evento("onClick", `${id}_dia_${d}`, "mostrarSo", `${id}_var_estado_d${d}`)] }, `Dia ${d}`,
        [texto(0, 7, L, 18, String(d), "inherit", 13, { "estilo.alinhamento": "centro", ref: `${id}_d${d}_tx` }, `Número ${d}`)]); };
    const seta = (ic, sinal) => cont(0, 0, 28, 28, { modo: "livre" }, { ref: `${id}_${sinal}`, "estilo.raio": 14, "estados.hover.fundo": "#ffffff18", eventos: [evento("onClick", `${id}_${sinal}`, "", "")] }, sinal === "ant" ? "Mês anterior" : "Próximo mês", [icone(6, 6, 16, ic, cor, { ref: `${id}_${sinal}_ic` })]);
    const sem = ["D", "S", "T", "Q", "Q", "S", "S"].map((x, i) => texto(0, 0, L, 18, x, sub, 12, { "estilo.alinhamento": "centro", ref: `${id}_sem${i}` }, `Dia da semana ${x}`));
    const chaves = Array.from({ length: dias }, (_, k) => `d${k + 1}`);
    return cont(0, 0, L * 7 + 24, 300, { modo: "coluna", espaco: 4, margem: 12, abracar: true }, base(caixa()), c.nome, [
      cont(0, 0, L * 7, 30, { modo: "linha", espaco: 0, alinhar: "centro", justificar: "entre" }, {}, "Cabeçalho", [seta("setaEsq", "ant"), texto(0, 0, 140, 20, `${MESES[mes - 1]} ${ano}`, cor, 14, { "estilo.peso": 700, "estilo.alinhamento": "centro", ref: `${id}_titulo` }, "Mês e ano"), seta("setaDir", "prox")]),
      cont(0, 0, L * 7, 20, { modo: "linha", espaco: 0 }, {}, "Dias da semana", sem),
      cont(0, 0, L * 7, linhasN * L, { modo: "livre" }, { ref: `${id}_grade` }, "Dias", Array.from({ length: dias }, (_, k) => dia(k + 1))),
      marcadores(id, chaves, sel >= 1 ? sel - 1 : -1)]);
  }

  if (m === "slider") {
    const Wc = W || 280, trilho = Wc - 24 - 120;
    const linhas = c.itens.map(it => { const r = `${id}_${it.id}`, k = hex(it.cor, ac), v = num(it.valor, 0, 0, 100), px = Math.round(trilho * v / 100);
      return cont(0, 0, Wc - 24, 24, { modo: "linha", espaco: 8, alinhar: "centro" }, { ref: r }, `Controle ${it.rotulo}`, [
        texto(0, 0, 64, 16, it.rotulo, cor, 12, { ref: `${r}_tx` }, `Rótulo ${it.rotulo}`),
        cont(0, 0, trilho, 10, { modo: "livre" }, { ref: `${r}_trilho`, "estilo.fundo": mix(cor, 0.16), "estilo.raio": 5 }, "Trilho", [
          cont(0, 0, Math.max(2, px), 10, {}, { ref: `${r}_fill`, "estilo.fundo": k, "estilo.raio": 5 }, "Preenchimento", []),
          cont(Math.max(0, Math.min(trilho - 18, px - 9)), -4, 18, 18, {}, { ref: `${r}_knob`, "estilo.fundo": "#ffffff", "estilo.borda": k, "estilo.larguraBorda": 3, "estilo.raio": 9, "estilo.sombra": "pequena" }, "Botão do controle", [])]),
        texto(0, 0, 40, 16, `${v}`, sub, 12, { "estilo.alinhamento": "direita", ref: `${r}_v` }, "Valor")]); });
    return cont(0, 0, Wc, 100, { modo: "coluna", espaco: 10, margem: 12, abracar: true }, base(caixa()), c.nome, linhas);
  }

  if (m === "tabela") {
    const Wc = W || 520, col = (c.colunas?.length ? c.colunas : ["Nome", "Status", "Último acesso"]).slice(0, 6), nc = col.length;
    const util = Wc - 24, w0 = nc === 1 ? util : Math.round(util * 0.34), wr = nc > 1 ? Math.floor((util - w0) / (nc - 1)) : 0, w = col.map((_, i) => (i === 0 ? w0 : wr));
    const cab = cont(0, 0, util, 30, { modo: "linha", espaco: 0, alinhar: "centro" }, { "estilo.fundo": mix(cor, 0.08), "estilo.raio": 6 }, "Cabeçalho", col.map((t, i) => texto(0, 0, w[i], 18, t, sub, 12, { "estilo.peso": 700, ref: `${id}_h${i}` }, `Coluna ${t}`)));
    const linhas = c.itens.map(it => { const r = `${id}_${it.id}`, k = hex(it.cor, ac), extra = Array.isArray(it.extra) ? it.extra : [];
      const celula = i => {
        if (i === 0) return texto(0, 0, w[0], 18, it.rotulo, cor, 13, { ref: `${r}_c0` }, `Nome ${it.rotulo}`);
        if (i === 1) return cont(0, 0, w[1], 20, { modo: "linha", espaco: 8, alinhar: "centro" }, {}, "Status", [cont(0, 0, 10, 10, {}, { ref: `${r}_dot`, "estilo.fundo": k, "estilo.raio": 5 }, "Ponto", []), texto(0, 0, Math.max(20, w[1] - 20), 18, String(it.valor ?? ""), k, 13, { ref: `${r}_c1` }, "Texto do status")]);
        const v = i === 2 ? it.detalhe : extra[i - 3];
        return texto(0, 0, w[i], 18, String(v ?? ""), sub, 13, { ref: `${r}_c${i}` }, `Coluna ${i + 1}`);
      };
      return cont(0, 0, util, 34, { modo: "linha", espaco: 0, alinhar: "centro" }, { ref: r, "estilo.raio": 6, "estados.hover.fundo": "#ffffff0f", ...clique(it) }, `Linha ${it.rotulo}`, col.map((_, i) => celula(i))); });
    return cont(0, 0, Wc, 100, { modo: "coluna", espaco: 4, margem: 12, abracar: true }, base(caixa()), c.nome, [cab, ...linhas]);
  }

  if (m === "grafico") {
    const Wc = W || 260, serie = String(c.serie ?? "").split(/[,;\s]+/).map(Number).filter(Number.isFinite).slice(0, 24), max = Math.max(1, ...serie), H = 64, bw = Math.max(4, Math.floor((Wc - 24 - (serie.length - 1) * 4) / Math.max(1, serie.length)));
    const tipo = c.tipoGrafico ?? "barras";
    const cabeca = [texto(0, 0, Wc - 24, 16, c.titulo ?? "", sub, 12, { ref: `${id}_titulo` }, "Título"),
      cont(0, 0, Wc - 24, 32, { modo: "linha", espaco: 8, alinhar: "fim" }, {}, "Valor", [texto(0, 0, Math.min(Wc - 90, larg(c.mensagem, 26, 4)), 32, c.mensagem ?? "", cor, 26, { "estilo.peso": 700, ref: `${id}_valor` }, "Valor"), texto(0, 0, 54, 18, c.legenda ?? "", VERDE, 13, { "estilo.peso": 700, ref: `${id}_delta` }, "Variação")])];
    if (tipo === "rosca") {
      const pct = num(c.valor, 78, 0, 100), D = 96;
      const anel = (ref, fim, cc) => elemento("forma", 0, 0, D, D, { ref, forma: "arco", inicio: 0, fim, espessura: 18, "estilo.fundo": cc, "estilo.larguraBorda": 0, "estilo.borda": "transparent" }, "Anel");
      return cont(0, 0, Wc, 150, { modo: "coluna", espaco: 6, margem: 12, abracar: true }, base(caixa()), c.nome, [...cabeca,
        cont(0, 0, D, D, { modo: "livre" }, { ref: `${id}_rosca` }, "Rosca", [anel(`${id}_trilho`, 359.9, mix(cor, 0.14)), ...(pct > 0 ? [anel(`${id}_arco`, Math.max(1, Math.min(359.9, pct * 3.6)), ac)] : []), texto(0, D / 2 - 11, D, 22, `${pct}%`, cor, 18, { "estilo.peso": 700, "estilo.alinhamento": "centro", ref: `${id}_pct` }, "Percentual")])]);
    }
    if (tipo === "linha" && serie.length > 1) {
      const GW = Wc - 24, pts = serie.map((v, i) => [Math.round(i * 100 / (serie.length - 1) * 10) / 10, Math.round((100 - (v / max) * 88 - 6) * 10) / 10]);
      const linhaD = "M" + pts.map(p => p.join(" ")).join("L"), areaD = `${linhaD}L100 100L0 100Z`;
      return cont(0, 0, Wc, 150, { modo: "coluna", espaco: 6, margem: 12, abracar: true }, base(caixa()), c.nome, [...cabeca,
        cont(0, 0, GW, H, { modo: "livre" }, { ref: `${id}_linhas` }, "Linha", [
          elemento("forma", 0, 0, GW, H, { ref: `${id}_area`, forma: "vetor", caminho: areaD, "estilo.fundo": mix(ac, 0.2), "estilo.larguraBorda": 0, "estilo.borda": "transparent" }, "Área"),
          elemento("forma", 0, 0, GW, H, { ref: `${id}_curva`, forma: "vetor", caminho: linhaD, "estilo.fundo": "transparent", "estilo.borda": ac, "estilo.larguraBorda": 2 }, "Curva")])]);
    }
    return cont(0, 0, Wc, 150, { modo: "coluna", espaco: 6, margem: 12, abracar: true }, base(caixa()), c.nome, [...cabeca,
      cont(0, 0, Wc - 24, H, { modo: "linha", espaco: 4, alinhar: "fim" }, { ref: `${id}_barras` }, "Barras", serie.map((v, i) => cont(0, 0, bw, Math.max(3, Math.round(H * v / max)), {}, { ref: `${id}_b${i}`, "estilo.fundo": i === serie.length - 1 ? ac : mix(ac, 0.45), "estilo.raio": 3 }, `Barra ${i + 1}`, [])))]);
  }

  if (m === "radial") {
    const R = num(c.raioMenu, 90, 50, 240), B = 48, D = 2 * R + B + 24, n = Math.max(1, c.itens.length), cx = D / 2;
    const HEX = "M50 0L93.3 25L93.3 75L50 100L6.7 75L6.7 25Z", hex6 = c.formaMenu === "hexagono";
    const forma = { ...(hex6 ? { mascara: { d: HEX } } : {}) };
    const itens = c.itens.map((it, i) => { const a = (-90 + i * 360 / n) * Math.PI / 180, r = `${id}_${it.id}`;
      return cont(Math.round(cx + R * Math.cos(a) - B / 2), Math.round(cx + R * Math.sin(a) - B / 2), B, B, { modo: "livre" }, { ref: r, ...forma, "estilo.raio": hex6 ? 0 : B / 2, "estilo.fundo": mix(ac, 0.16), "estilo.borda": mix(ac, 0.7), "estilo.larguraBorda": 1, "estados.hover.fundo": mix(ac, 0.4), ...clique(it), "acessibilidade.ariaLabel": it.rotulo, "acessibilidade.role": "menuitem" },
        `Item ${it.rotulo}`, [icone(12, 12, 24, it.icone || "estrela", ac, { ref: `${r}_ic` })]); });
    const centro = cont(Math.round(cx - 32), Math.round(cx - 32), 64, 64, { modo: "livre" }, { ref: `${id}_centro`, ...forma, "estilo.raio": hex6 ? 0 : 32, "estilo.fundo": ac }, "Centro", [icone(18, 18, 28, "hamburguer", hex(c.corAcentoTexto, "#04201c"), { ref: `${id}_centro_ic` })]);
    return cont(0, 0, D, D, { modo: "livre" }, base({ "estilo.fundo": fundo, "estilo.borda": borda, "estilo.larguraBorda": 1, "estilo.raio": D / 2 }), c.nome, [centro, ...itens]);
  }

  // toolbar
  const est = c.estiloBarra ?? "moderna", V = !!c.vertical, ativo = num(c.ativo, 0, -1, 99);
  const lado = 36;
  const cores = { classica: { f: "transparent", b: "transparent", c: cor, hov: "#ffffff18", on: mix(ac, 0.25) }, moderna: { f: fundo, b: borda, c: cor, hov: "#ffffff14", on: mix(ac, 0.22) },
    neon: { f: "#05080f", b: ac, c: ac, hov: mix(ac, 0.2), on: mix(ac, 0.3) }, minimalista: { f: "transparent", b: "transparent", c: sub, hov: "#ffffff10", on: "transparent" } }[est] ?? {};
  const ferrs = c.itens.filter(x => !x.separador);
  const botoes = c.itens.flatMap((it, i) => {
    if (it.separador) return [V ? linha(0, 0, 24, 1, mix(sub, 0.4), "Separador") : linha(0, 0, 1, 24, mix(sub, 0.4), "Separador")];
    const r = `${id}_${it.id}`, on = i === ativo, moderna = est === "moderna";
    const corAtiva = est === "minimalista" ? ac : cores.c;
    return [cont(0, 0, lado, lado, { modo: "livre" }, { ref: r, ...propsAtivo(on, { fundo: "transparent", cor: cores.c, raio: est === "minimalista" ? 18 : 8 }, { fundo: cores.on, cor: corAtiva }), "estados.hover.fundo": cores.hov,
      eventos: [evento("onClick", it.sinal || `${r}_clique`, "mostrarSo", `${id}_var_estado_${it.id}`)], "acessibilidade.ariaLabel": it.rotulo },
      `Ferramenta ${it.rotulo}`, [moderna ? icc(7, 7, 22, it.icone, hex(it.cor, "") || ac, `${r}_ic`, !hex(it.cor, "")) : icone(8, 8, 20, it.icone || "estrela", "inherit", { ref: `${r}_ic` })])];
  });
  botoes.push(marcadores(id, ferrs.map(x => x.id), ferrs.findIndex(x => c.itens.indexOf(x) === ativo)));
  return cont(0, 0, 100, 100, { modo: V ? "coluna" : "linha", espaco: 4, margem: 6, alinhar: "centro", abracar: true }, base({ "estilo.fundo": cores.f, "estilo.borda": cores.b, "estilo.larguraBorda": cores.b === "transparent" ? 0 : 1, "estilo.raio": est === "minimalista" ? 22 : raio }), c.nome, botoes);
}
