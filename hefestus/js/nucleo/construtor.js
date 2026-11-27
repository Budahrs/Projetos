// Construtor por formulário: containers (com comportamento) e faixa de opções descritos como DADOS;
// os elementos do canvas são gerados a partir deles com ids estáveis. Editar o formulário regenera só aquele item.
import { cont, texto, icone, linha, botao, achatar, evento as _ev } from "./modelos.js";
/** (tipo, sinal, ação, alvo) — a ordem natural do formulário. */
const evento = (tipo, dispara, acao, alvo) => _ev(tipo, acao, alvo, dispara);
import { aplicarLayouts } from "./layout.js";
import { marcadores, propsAtivo, VARIANTES_MODAL, MESES, EFEITOS, propsEfeito, MODELOS_COMP, ESTILOS_BARRA, FORMATOS_PROGRESSO, novoComponente, novoItemComp, arvoreComponente } from "./componentes.js";
import { iconeDe } from "./iconesAuto.js";
import { arvorePaineis, novoPaineis } from "./paineis.js";
import { larguraAba, recuoAba, mascaraAba, BORDAS_ABA, MASCARAS_ABA, ANIM_HOVER, ANIM_CLIQUE, TEMAS, FORMATOS_ABA, VARIANTES_LATERAL, aplicarTema } from "./temas.js";
import { visivel, estadoSimulado } from "./superficies.js";

/** Efeito visual do item (sombra, brilho, neon, vidro, gradiente, borda) como props de estilo. */
const efeitoDe = it => propsEfeito(it.efeito, it.acento ?? it.corIcone ?? it.corAtiva ?? it.fundoAtivo ?? "#22d3ee", it.fundo ?? "#0f172a");

const ACOES_CLIQUE = [["", "Só emitir o sinal"], ["abrir", "Abrir o container alvo"], ["fechar", "Fechar o container alvo"], ["alternar", "Alternar o container alvo"], ["destacar", "Destacar o container alvo"], ["mostrarSo", "Mostrar só o alvo (esconde os irmãos)"]];
const MODOS_LAYOUT = [["livre", "Livre"], ["linha", "Em linha"], ["coluna", "Em coluna"]];
const TIPOS_FILHO = [["texto", "Texto"], ["botao", "Botão"], ["icone", "Ícone"]];
const ICONES_COMANDO = ["auto", "aplicativo", "instalador", "colar", "cortar", "copiar", "caixa", "texto", "imagem", "camadas", "alinhar", "girar", "salvar", "abrir", "buscar", "engrenagem", "estrela", "casa", "email", "calendario", "check", "mais", "menos", "excluir", "pincel", "tema", "exportar", "hamburguer", "setaDir", "fechar", "usuario", "usuarios", "sino", "alerta", "grafico", "lista", "grade", "pasta", "info", "localizacao", "wifi", "ferramentas", "play", "pausa", "chave", "escudo", "switchRede", "roteador", "firewall", "accessPoint", "servidor", "rack", "bancoDados", "nobreak", "tablet", "televisao", "impressora", "cameraIp", "sensor", "vpn", "dns", "topologia", "pulso", "monitorPulso", "hospital", "velocimetro", "linkAtivo", "linkInativo", "linkLento", "online", "offline", "oscilando", "lentidao", "manutencao", "desconhecido", "erro", "estavel", "critico", "alertas", "selecionar", "mover", "caneta", "zoom", "executar", "parar", "backup", "wifi", "info", "cpu", "memoria", "disco", "servidor", "roteador", "switchRede", "pdf", "excel", "terminal", "logs", "agendar", "mapa", "andar", "usuario", "chave", "escudo", "sino", "nuvem"];

const EI = v => (v === "colorido" ? { estiloIcone: "colorido" } : {});
const sem = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toLowerCase();
const num = (v, r, min = 0, max = 5000) => (Number.isFinite(+v) ? Math.max(min, Math.min(max, +v)) : r);

const construtorVazio = () => ({ itens: [], seq: 0 });

// ------------------------------------------------------------ itens padrão
function novaCaixa(seq) {
  const id = `cx${seq}`;
  return { id, tipo: "caixa", nome: `Caixa ${seq}`, x: 40 + (seq % 5) * 24, y: 40 + (seq % 5) * 24, largura: 320, altura: 160,
    layout: { modo: "coluna", espaco: 8, margem: 12, alinhar: "inicio", abracar: false },
    estilo: { fundo: "#ffffff", borda: "#d2d6df", larguraBorda: 1, raio: 10, sombra: "pequena" },
    comportamento: { sinal: "", acao: "", alvo: "", hoverFundo: "", iniciaOculto: false, menuContexto: "" },
    filhos: [{ id: "f1", tipo: "texto", texto: "Título da caixa", largura: 280, altura: 24, tamanhoFonte: 16, cor: "#111827" }] };
}
function novoFilho(c) {
  const k = (c.filhos?.length ?? 0) + 1;
  let n = k; while ((c.filhos ?? []).some(f => f.id === `f${n}`)) n++;
  return { id: `f${n}`, tipo: "botao", rotulo: `Botão ${n}`, largura: 120, altura: 34, fundo: "#2563eb", cor: "#ffffff", tamanhoFonte: 14, sinal: "" };
}
const grupoPadrao = (id, nome, itens = []) => ({ id, nome, itens, organizacao: "linha", tamanho: "grande", recolher: false, iconePrincipal: "", fundo: "", borda: "", raio: 0, sombra: "nenhuma", cor: "#5a6274", hoverFundo: "#eef1f6" });
function novaFaixa(seq) {
  const id = `rb${seq}`;
  return { id, tipo: "ribbon", nome: `Faixa ${seq}`, x: 0, y: 0, largura: 0, banda: "#8a4f0d", abaAtiva: 0, simulaSelecao: "", busca: false, comportamento: "fixa", pino: true, abrirCom: "clique", retraiFora: true, retraiMouse: true, retraiEsc: true, animacao: "deslizar",
    abas: [{ id: "a1", nome: "Início", quando: [], corAba: "", grupoAtivo: 0, grupos: [grupoPadrao("g1", "Comandos", [{ id: "i1", rotulo: "Colar", icone: "colar", sinal: "colar" }, { id: "i2", rotulo: "Copiar", icone: "copiar", sinal: "copiar" }])] }] };
}
const novaAba = (f) => { let n = f.abas.length + 1; while (f.abas.some(a => a.id === `a${n}`)) n++; return { id: `a${n}`, nome: `Aba ${n}`, quando: [], corAba: "", grupoAtivo: 0, grupos: [grupoPadrao("g1", "Grupo")] }; };
const novoGrupo = (a) => { let n = a.grupos.length + 1; while (a.grupos.some(g => g.id === `g${n}`)) n++; return grupoPadrao(`g${n}`, `Grupo ${n}`); };
const novoItem = (g) => { let n = g.itens.length + 1; while (g.itens.some(i => i.id === `i${n}`)) n++; return { id: `i${n}`, rotulo: `Comando ${n}`, icone: "auto", sinal: "" }; };

function novoMenu(seq) {
  const id = `mn${seq}`;
  return { id, tipo: "menu", nome: `Menu ${seq}`, x: 60 + (seq % 5) * 24, y: 60 + (seq % 5) * 24, largura: 260, contexto: true,
    fundo: "#ffffff", borda: "#d2d6df", cor: "#1b1b1b", corAtalho: "#5f6368", hoverFundo: "#eef1f6", raio: 6, sombra: "media", iniciaOculto: true,
    itens: [{ id: "i1", rotulo: "Copiar", icone: "copiar", atalho: "Ctrl+C", sinal: "ctx_copiar" }, { id: "i2", rotulo: "Colar", icone: "colar", atalho: "Ctrl+V", sinal: "ctx_colar" }, { id: "i3", separador: true }, { id: "i4", rotulo: "Excluir", icone: "excluir", atalho: "Del", sinal: "ctx_excluir", perigo: true }] };
}
const novoItemMenu = (m) => { let n = m.itens.length + 1; while (m.itens.some(i => i.id === `i${n}`)) n++; return { id: `i${n}`, rotulo: `Item ${n}`, icone: "auto", atalho: "", sinal: "" }; };
const novoSeparador = (m) => { let n = m.itens.length + 1; while (m.itens.some(i => i.id === `i${n}`)) n++; return { id: `i${n}`, separador: true }; };


// ---- lições dos exemplos: blocos (home/touch/mega menu), barra lateral retrátil e abas de documento
const VARIANTES_BLOCO = [["icone", "Ícone em cima (home / touch)"], ["cartao", "Cartão: ícone + título + descrição (mega menu)"]];
function novoBlocos(seq) {
  return { id: `bl${seq}`, tipo: "blocos", nome: `Blocos ${seq}`, x: 40, y: 40, colunas: 3, larguraBloco: 200, alturaBloco: 96, espaco: 10, variante: "icone",
    fundo: "#0f2438", borda: "#1f4d6b", cor: "#e6f1f8", corSub: "#8fb3c9", corIcone: "#22d3ee", raio: 12, sombra: "nenhuma", hoverFundo: "#16344f",
    itens: [{ id: "i1", titulo: "Painéis", subtitulo: "Monitoração geral", icone: "grafico", sinal: "abrir_paineis", status: "" }, { id: "i2", titulo: "Mapa", subtitulo: "Localização", icone: "localizacao", sinal: "abrir_mapa", status: "" }, { id: "i3", titulo: "Eventos", subtitulo: "Histórico", icone: "lista", sinal: "abrir_eventos", status: "" }] };
}
const novoBloco = b => { let n = b.itens.length + 1; while (b.itens.some(i => i.id === `i${n}`)) n++; return { id: `i${n}`, titulo: `Bloco ${n}`, subtitulo: "", icone: "estrela", sinal: "", status: "" }; };
function novaLateral(seq) {
  return { id: `lt${seq}`, tipo: "lateral", nome: `Barra lateral ${seq}`, x: 0, y: 0, largura: 200, larguraRecolhida: 56, altura: 420, marca: "Meu app", fundo: "#0b1220", cor: "#cbd5e1", fundoAtivo: "#1d4ed8", corAtiva: "#ffffff", hoverFundo: "#ffffff14", raio: 0, ativo: 0, recolhida: false,
    itens: [{ id: "i1", rotulo: "Início", icone: "casa", sinal: "ir_inicio" }, { id: "i2", rotulo: "Projetos", icone: "pasta", sinal: "ir_projetos" }, { id: "i3", rotulo: "Dados", icone: "grafico", sinal: "ir_dados" }, { id: "i4", rotulo: "Configurações", icone: "engrenagem", sinal: "ir_config" }] };
}
const novoItemLateral = l => { let n = l.itens.length + 1; while (l.itens.some(i => i.id === `i${n}`)) n++; return { id: `i${n}`, rotulo: `Item ${n}`, icone: "estrela", sinal: "" }; };
function novaAbasDoc(seq) {
  return { id: `ad${seq}`, tipo: "abasDoc", nome: `Abas de documento ${seq}`, x: 0, y: 0, altura: 38, fundo: "#0b1220", corAba: "#1e293b", cor: "#cbd5e1", corAtiva: "#14b8a6", corTextoAtivo: "#04201c", fechavel: true, botaoMais: true, ativa: 0,
    abas: [{ id: "a1", nome: "Mapa principal", sinal: "" }, { id: "a2", nome: "Andar 1", sinal: "" }] };
}
const novaAbaDoc = d => { let n = d.abas.length + 1; while (d.abas.some(a => a.id === `a${n}`)) n++; return { id: `a${n}`, nome: `Aba ${n}`, sinal: "" }; };
const novoSubitem = it => { it.submenu ??= []; let n = it.submenu.length + 1; while (it.submenu.some(s => s.id === `s${n}`)) n++; return { id: `s${n}`, rotulo: `Subitem ${n}`, icone: "", atalho: "", sinal: "" }; };

// ------------------------------------------------------------ spec → árvore de elementos
function arvoreMenu(m) {
  const w = num(m.largura, 260, 120) - 12;
  const filhos = m.itens.map(it => {
    const ref = `${m.id}_${it.id}`;
    if (it.separador) return linha(0, 0, w, 1, m.borda ?? "#d2d6df", "Separador");
    const off = !!it.desabilitado;
    const c = off ? "#9aa1ae" : it.perigo ? "#ef4444" : (m.cor ?? "#1b1b1b");
    const sub = !off && it.submenu?.length ? `${ref}_sub` : "";
    const evs = off ? [] : [...(it.sinal ? [evento("onClick", it.sinal, "fechar", m.id)] : []), ...(sub ? [evento("onHover", "", "abrir", sub), evento("onLeave", "", "fechar", sub)] : [])];
    return cont(0, 0, w, 28, {}, { ref, "estilo.raio": 4, ...(off ? {} : { "estados.hover.fundo": m.hoverFundo || "#eef1f6" }), ...(evs.length ? { eventos: evs } : {}), ...(it.atalho && !off ? { "acessibilidade.atalho": it.atalho } : {}) }, `Item ${it.rotulo}`, [
      it.icone ? icone(10, 6, 16, iconeDe(it), c, { ref: `${ref}_ic`, ...EI(m.estiloIcone ?? "traco") }) : null,
      texto(36, 5, w - 120, 18, it.rotulo ?? "", c, 13, { ref: `${ref}_tx` }, `Rótulo ${it.rotulo}`),
      it.submenu?.length ? icone(w - 24, 6, 16, "setaDir", c, { ref: `${ref}_seta` }) : it.atalho ? texto(w - 82, 5, 74, 18, it.atalho, m.corAtalho ?? "#5f6368", 12, { "estilo.alinhamento": "direita", ref: `${ref}_at` }, `Atalho ${it.rotulo}`) : null,
    ].filter(Boolean));
  });
  return cont(0, 0, num(m.largura, 260, 120), 100, { modo: "coluna", espaco: 2, margem: 6, abracar: true },
    { ref: m.id, "estilo.fundo": m.fundo ?? "#ffffff", "estilo.borda": m.borda ?? "#d2d6df", "estilo.larguraBorda": 1, "estilo.raio": num(m.raio, 6, 0, 40), "estilo.sombra": sombraOk(m.sombra), ...efeitoDe(m), ...(m.iniciaOculto ? { visivel: false, "abertura.iniciaFechado": true } : {}) },
    m.nome, filhos);
}

/** Caixa do submenu de um item: mesma aparência do menu, oculta, aberta ao passar o mouse no item. */
function arvoreSubmenu(m, it, suf = "sub") {
  const base = `${m.id}_${it.id}_${suf}`;
  const w = Math.max(160, num(m.largura, 260, 120) - 40) - 12;
  const filhos = it.submenu.map(sb => {
    const ref = `${base}_${sb.id}`;
    const c = m.cor ?? "#1b1b1b";
    const fecha = sb.sinal ? [evento("onClick", sb.sinal, "fechar", base), ...(suf === "sub" ? [evento("onClick", sb.sinal, "fechar", m.id)] : [])] : [];
    return cont(0, 0, w, 28, {}, { ref, "estilo.raio": 4, "estados.hover.fundo": m.hoverFundo || "#eef1f6", ...(fecha.length ? { eventos: fecha } : {}), ...(sb.atalho ? { "acessibilidade.atalho": sb.atalho } : {}) }, `Subitem ${sb.rotulo}`, [
      sb.icone ? icone(10, 6, 16, iconeDe(sb), c, { ref: `${ref}_ic`, ...EI(m.estiloIcone ?? "traco") }) : null,
      texto(sb.icone ? 36 : 12, 5, w - (sb.icone ? 100 : 90), 18, sb.rotulo ?? "", c, 13, { ref: `${ref}_tx` }, `Rótulo ${sb.rotulo}`),
      sb.atalho ? texto(w - 82, 5, 74, 18, sb.atalho, m.corAtalho ?? "#5f6368", 12, { "estilo.alinhamento": "direita", ref: `${ref}_at` }, `Atalho ${sb.rotulo}`) : null].filter(Boolean));
  });
  return cont(0, 0, w + 12, 40, { modo: "coluna", espaco: 2, margem: 6, abracar: true },
    { ref: base, "estilo.fundo": m.fundo ?? "#ffffff", "estilo.borda": m.borda ?? "#d2d6df", "estilo.larguraBorda": 1, "estilo.raio": num(m.raio, 6, 0, 40), "estilo.sombra": sombraOk(m.sombra), visivel: false, "abertura.iniciaFechado": true, ...(suf === "dd" ? { "abertura.fecharFora": true, "abertura.fecharEsc": true } : {}) }, `Submenu ${it.rotulo}`, filhos);
}

const sombraOk = s => (["nenhuma", "pequena", "media", "grande"].includes(s) ? s : "nenhuma");

const fundoOk = (v, r) => (/^#[0-9a-f]{3,8}$/i.test(String(v ?? "")) || v === "transparent" ? v : r);

/** Grade de blocos: linhas de N colunas; cada bloco = ícone + título + subtítulo (+ ponto de status). */
function arvoreBlocos(b) {
  const cols = Math.max(1, Math.min(8, Math.round(num(b.colunas, 3, 1, 8))));
  const W = num(b.larguraBloco, 200, 60), H = num(b.alturaBloco, 96, 40);
  const cartao = b.variante === "cartao";
  const bloco = it => {
    const ref = `${b.id}_${it.id}`;
    const cIc = fundoOk(b.corIcone, "#22d3ee");
    const interno = cartao
      ? [icone(0, 0, 32, iconeDe(it, it.titulo), cIc, { ref: `${ref}_ic`, ...EI(b.estiloIcone ?? "colorido") }),
        cont(0, 0, W - 76, H - 24, { modo: "coluna", espaco: 2, abracar: true }, {}, `Texto ${it.titulo}`, [
          texto(0, 0, W - 76, 20, it.titulo ?? "", fundoOk(b.cor, "#e6f1f8"), 14, { "estilo.peso": 700, ref: `${ref}_tx` }, `Título ${it.titulo}`),
          ...(it.subtitulo ? [texto(0, 0, W - 76, 32, it.subtitulo, fundoOk(b.corSub, "#8fb3c9"), 11, { ref: `${ref}_sb` }, `Descrição ${it.titulo}`)] : [])])]
      : [icone(0, 0, 36, iconeDe(it, it.titulo), cIc, { ref: `${ref}_ic`, ...EI(b.estiloIcone ?? "colorido") }),
        texto(0, 0, W - 16, 18, it.titulo ?? "", fundoOk(b.cor, "#e6f1f8"), 13, { "estilo.peso": 700, "estilo.alinhamento": "centro", ref: `${ref}_tx` }, `Título ${it.titulo}`),
        ...(it.subtitulo ? [texto(0, 0, W - 16, 15, it.subtitulo, fundoOk(b.corSub, "#8fb3c9"), 11, { "estilo.alinhamento": "centro", ref: `${ref}_sb` }, `Subtítulo ${it.titulo}`)] : [])];
    return cont(0, 0, W, H, { modo: cartao ? "linha" : "coluna", espaco: cartao ? 12 : 4, margem: 10, alinhar: "centro" },
      { ref, "estilo.fundo": fundoOk(b.fundo, "#0f2438"), "estilo.borda": fundoOk(b.borda, "#1f4d6b"), "estilo.larguraBorda": 1, "estilo.raio": num(b.raio, 12, 0, 60), "estilo.sombra": sombraOk(b.sombra),
        "estados.hover.fundo": fundoOk(b.hoverFundo, "#16344f"), ...efeitoDe(b), ...(it.sinal ? { eventos: [evento("onClick", it.sinal, "", "")] } : {}) }, `Bloco ${it.titulo}`,
      [...interno, ...(fundoOk(it.status, "") ? [cont(0, 0, 10, 10, {}, { ref: `${ref}_st`, "estilo.fundo": it.status, "estilo.raio": 5 }, `Status ${it.titulo}`)] : [])]);
  };
  const linhas = []; for (let i = 0; i < b.itens.length; i += cols) linhas.push(cont(0, 0, W * cols, H, { modo: "linha", espaco: num(b.espaco, 10, 0, 80), abracar: true }, {}, `Linha ${linhas.length + 1}`, b.itens.slice(i, i + cols).map(bloco)));
  return cont(0, 0, W * cols, H, { modo: "coluna", espaco: num(b.espaco, 10, 0, 80), abracar: true }, { ref: b.id }, b.nome, linhas);
}

/** Variantes visuais da barra lateral (solida | flutuante | vidro | neon) + efeito livre. */
function varianteLateral(l) {
  const a = fundoOk(l.acento ?? l.fundoAtivo, "#22d3ee");
  const v = { flutuante: { "estilo.raio": 18, "estilo.sombra": "grande" }, vidro: { ...propsEfeito("vidro", a), "estilo.raio": 16 }, neon: { ...propsEfeito("neon", a, l.fundo), "estilo.raio": 14 } }[l.variante] ?? {};
  return { ...v, ...efeitoDe(l) };
}

/** Barra lateral vertical com ícone + rótulo; duas versões (larga e só ícones) que alternam pelo botão ☰. */
function arvoreLateral(l) {
  const A = num(l.altura, 420, 120);
  const ativo = Math.min(Math.max(0, l.ativo ?? 0), Math.max(0, l.itens.length - 1));
  const cor = fundoOk(l.cor, "#cbd5e1"), corA = fundoOk(l.corAtiva, "#ffffff");
  const versao = (sufixo, W, larga) => {
    const alterna = evento("onClick", `lateral_${sem(l.nome)}_${larga ? "recolher" : "expandir"}`, "mostrarSo", `${l.id}_${larga ? "rec" : "exp"}`);
    const topo = cont(0, 0, W - 16, 40, { modo: "linha", espaco: 8, alinhar: "centro" }, {}, "Topo", [
      cont(0, 0, 32, 32, { modo: "livre" }, { ref: `${l.id}_${sufixo}_alt`, "estilo.raio": 6, "estados.hover.fundo": fundoOk(l.hoverFundo, "#ffffff14"), eventos: [alterna] }, "Alternar largura", [icone(6, 6, 20, "hamburguer", cor, { ref: `${l.id}_${sufixo}_alt_ic` })]),
      ...(larga ? [texto(0, 0, W - 72, 20, l.marca ?? "", fundoOk(l.corMarca, corA), 15, { "estilo.peso": 700, ref: `${l.id}_${sufixo}_marca` }, "Marca")] : [])]);
    const itens = l.itens.map((it, i) => {
      const ref = `${l.id}_${sufixo}_${it.id}`, on = i === ativo;
      const c = on ? corA : cor;
      return cont(0, 0, W - 16, 38, { modo: "linha", espaco: 12, margem: larga ? 10 : 0, alinhar: "centro", ...(larga ? {} : { alinhar: "centro" }) },
        { ref, ...propsAtivo(on, { fundo: "transparent", cor, raio: 8 }, { fundo: fundoOk(l.fundoAtivo, "#1d4ed8"), cor: corA }), "estados.hover.fundo": fundoOk(l.hoverFundo, "#ffffff14"),
          eventos: [evento("onClick", it.sinal || `${ref}_clique`, "mostrarSo", `${l.id}_${sufixo}_var_estado_${it.id}`)] }, `Item ${it.rotulo}`, [
          icone(0, 0, 20, iconeDe(it), "inherit", { ref: `${ref}_ic`, ...EI(l.estiloIcone ?? "traco") }),
          ...(larga ? [texto(0, 0, W - 76, 18, it.rotulo ?? "", "inherit", 13, { ref: `${ref}_tx` }, `Rótulo ${it.rotulo}`)] : [])]);
    });
    return cont(0, 0, W, A, { modo: "coluna", espaco: 6, margem: 8, alinhar: larga ? "inicio" : "centro" },
      { ref: `${l.id}_${sufixo}`, "estilo.fundo": fundoOk(l.fundo, "#0b1220"), "estilo.raio": num(l.raio, 0, 0, 40), ...varianteLateral(l), ...((larga ? !l.recolhida : l.recolhida) ? {} : { visivel: false, "abertura.iniciaFechado": true }) }, larga ? "Barra larga" : "Barra só ícones", [topo, ...itens, marcadores(`${l.id}_${sufixo}`, l.itens.map(i => i.id), ativo)]);
  };
  const exp = versao("exp", num(l.largura, 200, 120), true), rec = versao("rec", num(l.larguraRecolhida, 56, 40), false);
  return cont(0, 0, num(l.largura, 200, 120), A, { modo: "linha", abracar: true, margem: 0 }, { ref: l.id }, l.nome, [exp, rec]);
}

/** Abas de documento estilo navegador: nome + × (opcional) e botão +. */
function arvoreAbasDoc(d) {
  const H = num(d.altura, 38, 24), ativa = Math.min(Math.max(0, d.ativa ?? 0), Math.max(0, d.abas.length - 1));
  const fmt = FORMATOS_ABA.some(f => f[0] === d.formato) ? d.formato : "arredondada";
  const acento = fundoOk(d.corAtiva, "#14b8a6"), aba0 = fundoOk(d.corAba, "#1e293b"), txt = fundoOk(d.cor, "#cbd5e1"), txtOn = fundoOk(d.corTextoAtivo, "#04201c");
  const sub = fmt === "sublinhada";
  const mascara = mascaraAba(fmt, d) ? { "mascara.d": mascaraAba(fmt, d) } : {};
  const raios = { mista: { raio: 0 }, paralelogramo: { raio: 0 }, hexagono: { raio: 0 }, pasta: { raio: 0, cantos: [12, 12, 0, 0] }, quadrada: { raio: 2 }, pilula: { raio: 100 }, cartao: { raio: 0, cantos: [10, 10, 0, 0] }, sublinhada: { raio: 0 } }[fmt] ?? { raio: 8 };
  const aba = (a, i) => {
    const ref = `${d.id}_${a.id}`;
    const W = larguraAba(a.nome, fmt, d, d.fechavel ? 26 : 0), marg = 4;
    return cont(0, 0, W, H - 8, { modo: "linha", espaco: 6, margem: marg, alinhar: "centro" },
      { ref, ...mascara, ...propsAtivo(i === ativa, { fundo: sub ? "transparent" : aba0, cor: txt, ...raios }, sub ? { cor: acento, sublinha: acento } : { fundo: acento, cor: txtOn }),
        eventos: [evento("onClick", a.sinal || `aba_${sem(a.nome)}`, "mostrarSo", `${d.id}_var_estado_${a.id}`)] }, `Aba ${a.nome}`, [
        texto(0, 0, W - 2 * marg - (d.fechavel ? 24 + Math.round(recuoAba(fmt, d) * W / 2) : 0), 18, a.nome ?? "", "inherit", 13, { ref: `${ref}_tx`, "estilo.alinhamento": "centro" }, `Rótulo ${a.nome}`),
        ...(d.fechavel ? [cont(0, 0, 18, 18, { modo: "livre" }, { ref: `${ref}_x`, "estilo.raio": 9, "estados.hover.fundo": "#00000030", eventos: [evento("onClick", `fechar_${sem(a.nome)}`, "", "")] }, `Fechar ${a.nome}`, [icone(3, 3, 12, "fechar", "inherit", { ref: `${ref}_x_ic` })])] : [])]);
  };
  const mais = d.botaoMais ? [cont(0, 0, H - 8, H - 8, { modo: "livre" }, { ref: `${d.id}_mais`, "estilo.raio": fmt === "pilula" ? 100 : 8, "estilo.fundo": sub ? "transparent" : aba0, "estados.hover.fundo": acento, eventos: [evento("onClick", `nova_aba_${sem(d.nome)}`, "", "")] }, "Nova aba", [icone((H - 8 - 16) / 2, (H - 8 - 16) / 2, 16, "mais", txt, { ref: `${d.id}_mais_ic` })])] : [];
  return cont(0, 0, 600, H, { modo: "linha", espaco: 6, margem: 4, alinhar: "centro", abracar: true }, { ref: d.id, "estilo.fundo": fundoOk(d.fundo, "#0b1220"), ...efeitoDe(d) }, d.nome, [...d.abas.map(aba), ...mais, marcadores(d.id, d.abas.map(a => a.id), ativa)]);
}

function arvoreCaixa(c) {
  const comp = c.comportamento ?? {};
  const eventos = [];
  if (comp.sinal || comp.acao) eventos.push(evento("onClick", comp.sinal || "", comp.acao || "", comp.alvo || ""));
  if (comp.menuContexto) eventos.push(evento("onContext", "contexto", "abrir", comp.menuContexto));
  const filho = f => {
    const ref = `${c.id}_${f.id}`;
    const evs = f.sinal ? [evento("onClick", f.sinal, "", "")] : [];
    if (f.tipo === "botao") return botao(0, 0, num(f.largura, 120, 8), num(f.altura, 34, 8), f.rotulo ?? "Botão", f.fundo ?? "#2563eb", f.cor ?? "#ffffff", f.fundo ?? "#2563eb", { ref, "estilo.tamanhoFonte": num(f.tamanhoFonte, 14, 8, 96), ...(evs.length ? { eventos: evs } : {}) });
    if (f.tipo === "icone") return icone(0, 0, num(f.largura, 24, 8), f.simbolo ?? "estrela", f.cor ?? "#374151", { ref, ...(evs.length ? { eventos: evs } : {}) }, f.nome ?? `Ícone ${f.id}`);
    return { ...texto(0, 0, num(f.largura, 200, 8), num(f.altura, 24, 8), f.texto ?? "Texto", f.cor ?? "#111827", num(f.tamanhoFonte, 14, 8, 96), { ref, ...(evs.length ? { eventos: evs } : {}) }, f.nome ?? `Texto ${f.id}`) };
  };
  const e = c.estilo ?? {}, l = c.layout ?? {};
  const raiz = cont(0, 0, num(c.largura, 320, 16), num(c.altura, 160, 16), { modo: l.modo ?? "livre", espaco: num(l.espaco, 8, 0, 200), margem: num(l.margem, 0, 0, 200), alinhar: l.alinhar ?? "inicio", abracar: !!l.abracar },
    { ref: c.id, "estilo.fundo": e.fundo ?? "#ffffff", "estilo.borda": e.borda ?? "transparent", "estilo.larguraBorda": num(e.larguraBorda, 0, 0, 40), "estilo.raio": num(e.raio, 0, 0, 400), "estilo.sombra": sombraOk(e.sombra),
      ...(comp.hoverFundo ? { "estados.hover.fundo": comp.hoverFundo } : {}), ...efeitoDe({ ...c, fundo: e.fundo }), ...(eventos.length ? { eventos } : {}), ...(comp.iniciaOculto ? { visivel: false, "abertura.iniciaFechado": true } : {}) },
    c.nome, (c.filhos ?? []).map(filho));
  return raiz;
}

/** Tipos de objeto que podem abrir uma aba condicional (Ferramentas de…) e organizações de grupo. */
const TIPOS_OBJETO = [["container", "Container"], ["texto", "Texto"], ["botao", "Botão"], ["forma", "Forma"], ["icone", "Ícone"], ["campo", "Campo"]];
const ORGANIZACOES_GRUPO = [["linha", "Em linha"], ["coluna", "Em coluna"], ["grade", "Em grade (2 linhas)"]];
const TAMANHOS_COMANDO = [["grande", "Grande (ícone + rótulo embaixo)"], ["pequeno", "Pequeno (ícone + rótulo ao lado)"]];
/** Estilos prontos da faixa (inspirados nos exemplos): cores da barra de abas, do corpo, dos comandos e dos grupos. */
const ESTILOS_FAIXA = {
  office: { nome: "Office claro", banda: "#2b579a", corpoFundo: "#ffffff", corpoBorda: "#d2d6df", abaTexto: "#ffffff", abaAtivaFundo: "#ffffff", abaAtivaTexto: "#2b579a", corRotulo: "#1c2130", grupo: { cor: "#2b579a", hoverFundo: "#e8eef9", fundo: "", borda: "" } },
  claroHefestus: { nome: "Hefestus (âmbar)", banda: "#8a4f0d", corpoFundo: "#ffffff", corpoBorda: "#d2d6df", abaTexto: "#ffffff", abaAtivaFundo: "#ffffff", abaAtivaTexto: "#8a4f0d", corRotulo: "#1c2130", grupo: { cor: "#5a6274", hoverFundo: "#eef1f6", fundo: "", borda: "" } },
  escuro: { nome: "Escuro (NOC)", banda: "#0b1220", corpoFundo: "#0f1a2b", corpoBorda: "#1f3350", abaTexto: "#cbd5e1", abaAtivaFundo: "#0f1a2b", abaAtivaTexto: "#38bdf8", corRotulo: "#e2e8f0", grupo: { cor: "#38bdf8", hoverFundo: "#ffffff14", fundo: "", borda: "" } },
  vidro: { nome: "Vidro (glassmorphism)", banda: "#1b2a58", corpoFundo: "#243566", corpoBorda: "#3b5398", abaTexto: "#dbe6ff", abaAtivaFundo: "#243566", abaAtivaTexto: "#ffffff", corRotulo: "#eef3ff", grupo: { cor: "#9ec1ff", hoverFundo: "#ffffff1f", fundo: "#ffffff0d", borda: "#ffffff22", raio: 10 } },
  ciber: { nome: "Ciber (neon)", banda: "#08080f", corpoFundo: "#10101c", corpoBorda: "#ff2a4d", abaTexto: "#e5e7eb", abaAtivaFundo: "#10101c", abaAtivaTexto: "#ff2a4d", corRotulo: "#f1f5f9", grupo: { cor: "#22d3ee", hoverFundo: "#ff2a4d22", fundo: "", borda: "" } },
  mac: { nome: "macOS claro", banda: "#e9e9eb", corpoFundo: "#f6f6f7", corpoBorda: "#d3d3d6", abaTexto: "#3a3a3c", abaAtivaFundo: "#f6f6f7", abaAtivaTexto: "#0a64d6", corRotulo: "#2c2c2e", grupo: { cor: "#0a64d6", hoverFundo: "#0a64d614", fundo: "", borda: "" } },
};
const COMPORTAMENTOS_FAIXA = [["fixa", "Sempre aberta"], ["retrai", "Retrai quando não usada"]];
const ABRIR_COM = [["clique", "Clicar numa aba"], ["hover", "Passar o mouse numa aba"]];
const ANIMACOES_FAIXA = [["nenhuma", "Nenhuma"], ["deslizar", "Deslizar"], ["aparecer", "Aparecer"]];
const SOMBRAS_GRUPO = [["nenhuma", "Nenhuma"], ["pequena", "Pequena"], ["media", "Média"], ["grande", "Grande"]];
const hexOk = (v, r) => (/^#[0-9a-f]{3,8}$/i.test(String(v ?? "")) || v === "transparent" ? v : r);

/** Aplica um estilo pronto: campos da faixa e cores de todos os grupos. */
function aplicarEstiloFaixa(f, chave) {
  const e = ESTILOS_FAIXA[chave]; if (!e) return;
  const { nome, grupo, ...cores } = e; Object.assign(f, cores, { estilo: chave });
  for (const a of f.abas) for (const g of a.grupos) Object.assign(g, grupo);
}
/** Aba visível dada a seleção simulada: `quando` vazio = sempre; lista de tipos (formato antigo) ou condição em texto (superficies.js). */
const abaVisivel = (a, sim) => visivel(a.quando, estadoSimulado(sim));
/** Ícone do botão em que o grupo se recolhe: o configurado, senão o do primeiro comando. */
const iconeDoGrupo = g => (g.iconePrincipal && g.iconePrincipal !== "auto" ? g.iconePrincipal : null) || (g.itens?.[0] ? iconeDe(g.itens[0]) : "estrela");

const formaAbaFaixa = (fmt, it) => mascaraAba(fmt, it) ? { "estilo.raio": 0, "mascara.d": mascaraAba(fmt, it) } : fmt === "pasta" ? { "estilo.raio": 0, "estilo.cantos": [12, 12, 0, 0] } : ({ quadrada: { "estilo.raio": 0 }, pilula: { "estilo.raio": 100 }, cartao: { "estilo.raio": 0, "estilo.cantos": [8, 8, 0, 0] }, sublinhada: { "estilo.raio": 0 } }[fmt] ?? { "estilo.raio": 4 });

function arvoreFaixa(f) {
  const banda = f.banda ?? "#8a4f0d";
  const L = num(f.largura, 960, 200);
  const corpoFundo = hexOk(f.corpoFundo, "#ffffff"), corpoBorda = hexOk(f.corpoBorda, "#d2d6df"), corRot = hexOk(f.corRotulo, "#1c2130");
  const abaTexto = hexOk(f.abaTexto, "#ffffff"), abaAtivaFundo = hexOk(f.abaAtivaFundo, "#ffffff"), abaAtivaTexto = hexOk(f.abaAtivaTexto, banda);
  const retrai = f.comportamento === "retrai";
  const visiveis = f.abas.map(a => abaVisivel(a, f.simulaSelecao ?? ""));
  let ativa = Math.min(Math.max(0, f.abaAtiva ?? 0), Math.max(0, f.abas.length - 1));
  if (!visiveis[ativa]) ativa = Math.max(0, visiveis.indexOf(true));
  const ref = (a, g, it) => `${f.id}_${a.id}_${g.id}${it ? `_${it.id}` : ""}`;

  const larguraCmd = g => (g.tamanho === "pequeno" ? 112 : Math.max(60, ...g.itens.map(it => Math.ceil(String(it.rotulo ?? "").length * 6.6) + 12 + (it.submenu?.length ? 10 : 0))));
  const comando = (a, g, it) => {
    const pq = g.tamanho === "pequeno";
    const WC = larguraCmd(g), dd = it.submenu?.length && !it.desabilitado;
    const rotuloTxt = `${it.rotulo ?? ""}${dd ? " ▾" : ""}`;
    const off = !!it.desabilitado;
    const ev = dd ? { eventos: [evento("onClick", it.sinal || `${ref(a, g, it)}_menu`, "alternar", `${ref(a, g, it)}_dd`)] } : it.sinal && !off ? { eventos: [evento("onClick", it.sinal, "", "")], ...(it.atalho ? { "acessibilidade.atalho": it.atalho } : {}) } : {};
    const hov = { ...(off ? {} : { "estados.hover.fundo": hexOk(g.hoverFundo, "#eef1f6") }), "estilo.raio": 4 };
    const cor = off ? "#b6bcc8" : hexOk(g.cor, "#5a6274");
    return pq
      ? cont(0, 0, 112, 24, { modo: "linha", espaco: 6, margem: 3, alinhar: "centro" }, { ref: ref(a, g, it), ...ev, ...hov }, `Comando ${it.rotulo}`, [
        icone(0, 0, 16, iconeDe(it), cor, { ref: `${ref(a, g, it)}_ic`, ...EI(f.estiloIcone ?? "colorido") }),
        texto(0, 0, 84, 16, rotuloTxt, off ? "#9aa1ae" : corRot, 12, { ref: `${ref(a, g, it)}_tx` }, `Rótulo ${it.rotulo}`)])
      : cont(0, 0, WC, 62, { modo: "coluna", espaco: 4, margem: 2, alinhar: "centro" }, { ref: ref(a, g, it), ...ev, ...hov }, `Comando ${it.rotulo}`, [
        icone(0, 0, f.padraoFormatacao ? 32 : 30, iconeDe(it), cor, { ref: `${ref(a, g, it)}_ic`, ...EI(f.estiloIcone ?? "colorido") }),
        texto(0, 0, WC - 2, 18, rotuloTxt, off ? "#9aa1ae" : corRot, 12, { "estilo.alinhamento": "centro", ref: `${ref(a, g, it)}_tx` }, `Rótulo ${it.rotulo}`)]);
  };

  /** Corpo do grupo conforme a organização: linha, coluna ou grade de 2 linhas. */
  const comandos = (a, g) => {
    const cs = g.itens.map(it => comando(a, g, it));
    const pq = g.tamanho === "pequeno";
    const org = g.organizacao ?? "linha";
    const wI = larguraCmd(g), hI = pq ? 24 : 62, esp = pq ? 2 : 6;
    if (org === "coluna") return cont(0, 0, wI, Math.max(hI, cs.length * (hI + esp)), { modo: "coluna", espaco: esp }, {}, `Comandos ${g.nome}`, cs);
    if (org === "grade" && cs.length > 1) {
      const metade = Math.ceil(cs.length / 2);
      const col = (i, n) => cont(0, 0, wI, (hI + esp) * 2, { modo: "coluna", espaco: esp }, {}, `Coluna ${n}`, cs.slice(i, i + 2));
      const colunas = []; for (let i = 0; i < cs.length; i += 2) colunas.push(col(i, colunas.length + 1));
      return cont(0, 0, Math.max(wI, colunas.length * (wI + 6)), (hI + esp) * 2, { modo: "linha", espaco: 6 }, {}, `Comandos ${g.nome}`, metade ? colunas : cs);
    }
    return cont(0, 0, Math.max(60, cs.length * (wI + 6)), hI, { modo: "linha", espaco: 6 }, {}, `Comandos ${g.nome}`, cs);
  };

  const grupoAberto = (a, g, extra = {}) => {
    const aparencia = {
      "estilo.fundo": hexOk(g.fundo, "transparent") || "transparent", "estilo.borda": hexOk(g.borda, "transparent") || "transparent",
      "estilo.larguraBorda": g.borda && g.borda !== "transparent" ? 1 : 0, "estilo.raio": num(g.raio, 0, 0, 40), "estilo.sombra": sombraOk(g.sombra),
    };
    const nomeCor = hexOk(g.cor, "#5a6274");
    return cont(0, 0, 80, 88, { modo: "coluna", espaco: 4, alinhar: "centro", margem: 2, abracar: true }, { ref: ref(a, g, null), ...aparencia, ...extra }, `Grupo ${g.nome}`, [
      comandos(a, g),
      texto(0, 0, 72, 16, g.nome, nomeCor, 11, { "estilo.alinhamento": "centro" }, `Nome do grupo ${g.nome}`),
    ]);
  };

  /** Grupo recolhido: só o botão com o ícone da função principal; clicar expande este e recolhe os outros que recolhem. */
  const grupoRecolhido = (a, g, outros, extra = {}) => cont(0, 0, 64, 62, { modo: "coluna", espaco: 4, margem: 2, alinhar: "centro" },
    { ref: `${ref(a, g, null)}_rec`, "estados.hover.fundo": hexOk(g.hoverFundo, "#eef1f6"), "estilo.raio": 4,
      eventos: [evento("onClick", `grupo_${sem(g.nome)}`, "mostrarSo", `${ref(a, g, null)}_exp`), ...outros.map(o => evento("onClick", `grupo_${sem(g.nome)}`, "mostrarSo", `${ref(a, o, null)}_rec`))], ...extra }, `Grupo recolhido ${g.nome}`, [
      icone(0, 0, 30, iconeDoGrupo(g), hexOk(g.cor, "#5a6274"), { ref: `${ref(a, g, null)}_rec_ic` }),
      texto(0, 0, 60, 16, g.nome, "#5a6274", 11, { "estilo.alinhamento": "centro", ref: `${ref(a, g, null)}_rec_tx` }, `Rótulo ${g.nome}`)]);

  const corpo = (a, i) => {
    const recolhem = a.grupos.filter(g => g.recolher);
    const aberto = recolhem.length ? recolhem[Math.min(Math.max(0, a.grupoAtivo ?? 0), recolhem.length - 1)] : null;
    return cont(0, 0, L, 104, { modo: "linha", espaco: 12, margem: 8 },
      { ref: `${f.id}_corpo_${a.id}`, autoAjuste: true, "estilo.fundo": f.formatoAba === "pasta" ? hexOk(a.corAba, "#a6a6a6") : corpoFundo, "estilo.borda": corpoBorda, "estilo.larguraBorda": 1, ...(i === ativa ? {} : { visivel: false, "abertura.iniciaFechado": true }) }, `Corpo ${a.nome}`,
      a.grupos.flatMap((g, k) => {
        const div = k ? [linha(0, 0, 1, 86, corpoBorda, `Divisor ${g.nome}`)] : [];
        if (!g.recolher) return [...div, grupoAberto(a, g)];
        const expandido = g === aberto;
        const exp = grupoAberto(a, g, { ref: `${ref(a, g, null)}_exp`, ...(expandido ? {} : { visivel: false, "abertura.iniciaFechado": true }) });
        const rec = grupoRecolhido(a, g, recolhem.filter(o => o !== g), expandido ? { visivel: false, "abertura.iniciaFechado": true } : {});
        return [...div, cont(0, 0, 80, 88, { modo: "linha", abracar: true, margem: 0, alinhar: "centro" }, { ref: ref(a, g, null) }, `Slot ${g.nome}`, [exp, rec])];
      }));
  };
  const aba = (a, i) => {
    const cond = a.quando?.length > 0;
    const corAba = hexOk(a.corAba, cond ? "#2563eb" : banda);
    const Wa = larguraAba(a.nome, f.formatoAba, f, 4, 13, cond ? 120 : 64);
    const pasta = f.formatoAba === "pasta", corPasta = hexOk(a.corAba, "#a6a6a6");
    return cont(0, 0, Wa, 28, {}, { ref: `${f.id}_aba_${a.id}`, ...(pasta ? propsAtivo(i === ativa, { fundo: /^#[0-9a-f]{6}$/i.test(corPasta) ? `${corPasta}88` : corPasta, cor: "#ffffff" }, { fundo: corPasta, cor: "#ffffff" }) : propsAtivo(i === ativa, { fundo: cond ? `${corAba}33` : "transparent", cor: abaTexto }, { fundo: abaAtivaFundo, cor: cond ? corAba : abaAtivaTexto })), ...formaAbaFaixa(f.formatoAba, f), ...(visiveis[i] ? {} : { visivel: false, "abertura.iniciaFechado": true }),
      eventos: [evento(retrai && f.abrirCom === "hover" ? "onHover" : "onClick", `aba_${sem(a.nome)}`, "mostrarSo", `${f.id}_corpo_${a.id}`),
        ...(retrai ? [evento(f.abrirCom === "hover" ? "onHover" : "onClick", `faixa_abriu_${sem(f.nome)}`, "abrir", `${f.id}_corpos`)] : [])] }, `Aba ${a.nome}`, [
      texto(0, 5, Wa, 18, a.nome, "inherit", 13, { "estilo.alinhamento": "centro", ref: `${f.id}_aba_${a.id}_tx` }, `Rótulo ${a.nome}`)]);
  };
  const eventosFaixa = retrai && f.retraiMouse !== false ? { eventos: [evento("onLeave", `faixa_retraiu_${sem(f.nome)}`, "fechar", `${f.id}_corpos`)] } : {};
  const abertura = retrai ? { "abertura.iniciaFechado": true, "abertura.fecharFora": f.retraiFora !== false, "abertura.fecharEsc": f.retraiEsc !== false, "abertura.animacao": ["nenhuma", "deslizar", "aparecer"].includes(f.animacao) ? f.animacao : "deslizar" } : {};
  return cont(0, 0, L, 138, {}, { ref: f.id, ...eventosFaixa }, f.nome, [
    cont(0, 0, L, 34, {}, { "estilo.fundo": banda }, "Faixa das abas", [cont(8, 6, Math.max(120, f.abas.reduce((t, a) => t + larguraAba(a.nome, f.formatoAba, f, 4, 13, a.quando?.length ? 120 : 64) + 4, 0)), 28, { modo: "linha", espaco: 4, abracar: false }, { autoAjuste: true }, "Abas", f.abas.map(aba)),
      ...(retrai && f.pino !== false ? [cont(Math.max(300, L - 36), 3, 28, 28, { modo: "livre" }, { ref: `${f.id}_pino`, "estilo.raio": 14, "estados.hover.fundo": "#ffffff30",
        eventos: [evento("onClick", `faixa_pino_${sem(f.nome)}`, "fixar", `${f.id}_corpos`)] }, "Pino: fixar a faixa aberta", [icone(5, 5, 18, "alfinete", abaTexto, { ref: `${f.id}_pino_ic` })])] : []),
      ...(f.busca ? [cont(Math.max(300, L - (retrai && f.pino !== false ? 304 : 268)), 5, 252, 24, { modo: "linha", espaco: 8, margem: 8, alinhar: "centro" }, { ref: `${f.id}_busca`, "estilo.fundo": "#ffffff2e", "estilo.raio": 12, eventos: [evento("onClick", `busca_${sem(f.nome)}`, "", "")] }, "Busca de comandos", [
        icone(0, 0, 14, "buscar", abaTexto, { ref: `${f.id}_busca_ic` }), texto(0, 0, 200, 16, "Buscar comandos…", abaTexto, 12, { ref: `${f.id}_busca_tx` }, "Texto da busca")])] : [])]),
    cont(0, 34, L, 104, { modo: "livre" }, { ref: `${f.id}_corpos`, ...abertura }, "Corpos das abas", f.abas.map(corpo)),
  ]);
}

/** Refs automáticas (m0, m1…) repetem-se entre itens: prefixa com o id do item e acerta o `pai` dos filhos. */
function isolarRefs(lista, prefixo) {
  const novo = r => (/^m\d+$/.test(r) ? `${prefixo}__${r}` : r);
  return lista.map(({ ref, el }) => ({ ref: novo(ref), el: el.pai ? { ...el, pai: novo(el.pai) } : el }));
}

/** Elementos [{ id, el }] de um item, com posição absoluta e marcados com `construtor`. */
const ANIM_OK_H = ["nenhuma", "brilho", "elevar", "escala", "balanco"], ANIM_OK_C = ["nenhuma", "afundar", "pulso", "ondulacao"];
function gerarItem(item, tela) {
  // faixa com largura 0 acompanha a largura inteira da tela
  if (item.tipo === "ribbon" && !item.largura) item = { ...item, largura: Math.max(200, Math.round(tela?.largura ?? 960)) };
  const arvores = { ribbon: arvoreFaixa, menu: arvoreMenu, blocos: arvoreBlocos, lateral: arvoreLateral, abasDoc: arvoreAbasDoc, componente: arvoreComponente, paineis: arvorePaineis };
  const raiz = (arvores[item.tipo] ?? arvoreCaixa)(item);
  raiz.x = 0; raiz.y = 0;
  const lista = isolarRefs(achatar(raiz), item.id);
  // todos os corpos de aba ocupam o mesmo lugar: reposiciona antes dos layouts
  const doc = { elementos: Object.fromEntries(lista.map(({ ref, el }) => [ref, el])) };
  aplicarLayouts(doc);
  const ox = num(item.x, 0, -5000), oy = num(item.y, 0, -5000);
  // animação ao passar o mouse e ao clicar: vale para tudo o que reage (tem clique ou cor de hover)
  const animH = ANIM_OK_H.includes(item.animHover) ? item.animHover : "brilho", animC = ANIM_OK_C.includes(item.animClique) ? item.animClique : "afundar";
  const saida = lista.map(({ ref, el }) => {
    const e = doc.elementos[ref];
    const pos = { x: Math.round(e.x + ox), y: Math.round(e.y + oy) };
    const reage = (e.eventos?.length || e.estados?.hover?.fundo) && ["container", "botao", "forma", "caixa"].includes(e.tipo);
    return { id: ref, el: { ...e, ...pos, construtor: item.id, ...(reage && (animH !== "nenhuma" || animC !== "nenhuma") ? { animacao: { hover: animH, clique: animC } } : {}) } };
  });
  // submenus: caixas soltas ao lado direito do item que as abre
  if (item.tipo === "menu") for (const it of item.itens) {
    if (it.separador || it.desabilitado || !it.submenu?.length) continue;
    const linhaEl = saida.find(x => x.id === `${item.id}_${it.id}`)?.el;
    if (!linhaEl) continue;
    const r2 = arvoreSubmenu(item, it); r2.x = 0; r2.y = 0;
    const l2 = isolarRefs(achatar(r2), `${item.id}_${it.id}_sub`), d2 = { elementos: Object.fromEntries(l2.map(({ ref, el }) => [ref, el])) };
    aplicarLayouts(d2);
    const dx = linhaEl.x + num(item.largura, 260, 120) - 10, dy = linhaEl.y - 6;
    for (const { ref } of l2) { const e = d2.elementos[ref]; saida.push({ id: ref, el: { ...e, x: Math.round(e.x + dx), y: Math.round(e.y + dy), construtor: item.id } }); }
  }
  // comandos da faixa com ▾: caixa de opções logo abaixo do comando
  if (item.tipo === "ribbon") for (const a of item.abas) for (const g of a.grupos) for (const it of g.itens) {
    if (!it.submenu?.length || it.desabilitado) continue;
    const cmd = saida.find(x => x.id === `${item.id}_${a.id}_${g.id}_${it.id}`)?.el;
    if (!cmd) continue;
    const m = { id: `${item.id}_${a.id}_${g.id}`, largura: 220, fundo: hexOk(item.corpoFundo, "#ffffff"), borda: hexOk(item.corpoBorda, "#d2d6df"), cor: hexOk(item.corRotulo, "#1c2130"), hoverFundo: hexOk(g.hoverFundo, "#eef1f6"), corAtalho: "#8892a6", raio: 6, sombra: "media" };
    const r2 = arvoreSubmenu(m, it, "dd"); r2.x = 0; r2.y = 0;
    const l2 = isolarRefs(achatar(r2), `${m.id}_${it.id}_dd`), d2 = { elementos: Object.fromEntries(l2.map(({ ref, el }) => [ref, el])) };
    aplicarLayouts(d2);
    for (const { ref } of l2) { const e = d2.elementos[ref]; saida.push({ id: ref, el: { ...e, x: Math.round(e.x + cmd.x), y: Math.round(e.y + cmd.y + cmd.altura + 4), construtor: item.id } }); }
  }
  return saida;
}

/** Problemas do formulário: sinais repetidos, rótulos vazios, alvo inexistente. */
function validarConstrutor(spec) {
  const erros = [];
  const sinais = new Map();
  const nota = (sinal, onde) => { if (!sinal) return; if (sinais.has(sinal)) erros.push(`Sinal "${sinal}" repetido em ${sinais.get(sinal)} e ${onde}`); else sinais.set(sinal, onde); };
  for (const it of spec.itens) {
    if (it.tipo === "caixa") {
      nota(it.comportamento?.sinal, it.nome);
      if (it.comportamento?.menuContexto && !spec.itens.some(x => x.id === it.comportamento.menuContexto)) erros.push(`${it.nome}: o menu do botão direito não existe mais.`);
      if (it.comportamento?.acao && !spec.itens.some(x => x.id === it.comportamento.alvo)) erros.push(`${it.nome}: a ação "${it.comportamento.acao}" precisa de um container alvo.`);
      for (const f of it.filhos ?? []) { nota(f.sinal, `${it.nome} › ${f.rotulo ?? f.texto ?? f.id}`); if (f.tipo === "botao" && !(f.rotulo ?? "").trim()) erros.push(`${it.nome}: botão sem rótulo.`); }
    } else if (it.tipo === "blocos") {
      for (const i of it.itens) { nota(i.sinal, `${it.nome} › ${i.titulo}`); if (!(i.titulo ?? "").trim()) erros.push(`${it.nome}: bloco sem título.`); }
    } else if (it.tipo === "lateral") {
      for (const i of it.itens) { nota(i.sinal, `${it.nome} › ${i.rotulo}`); if (!(i.rotulo ?? "").trim()) erros.push(`${it.nome}: item sem rótulo.`); }
    } else if (it.tipo === "componente") {
      for (const i of it.itens) { nota(i.sinal, `${it.nome} › ${i.rotulo ?? i.id}`); if (!i.separador && !(i.rotulo ?? "").trim() && it.modelo !== "paginacao") erros.push(`${it.nome}: item sem rótulo.`); }
    } else if (it.tipo === "paineis") {
      if (!(it.regioes ?? []).length) erros.push(`${it.nome}: sem regiões laterais (só a área central).`);
    } else if (it.tipo === "abasDoc") {
      for (const a of it.abas) if (!(a.nome ?? "").trim()) erros.push(`${it.nome}: aba sem nome.`);
    } else if (it.tipo === "menu") {
      for (const i of it.itens) { if (i.separador) continue; nota(i.sinal, `${it.nome} › ${i.rotulo}`); if (!(i.rotulo ?? "").trim()) erros.push(`${it.nome}: item sem rótulo.`); for (const sb of i.submenu ?? []) { nota(sb.sinal, `${it.nome} › ${i.rotulo} › ${sb.rotulo}`); if (!(sb.rotulo ?? "").trim()) erros.push(`${it.nome}: subitem sem rótulo.`); } }
    } else for (const a of it.abas) for (const g of a.grupos) for (const i of g.itens) { nota(i.sinal, `${it.nome} › ${a.nome} › ${i.rotulo}`); if (!(i.rotulo ?? "").trim()) erros.push(`${it.nome} › ${a.nome}: comando sem rótulo.`); for (const sb of i.submenu ?? []) { nota(sb.sinal, `${it.nome} › ${i.rotulo} › ${sb.rotulo}`); if (!(sb.rotulo ?? "").trim()) erros.push(`${it.nome}: opção sem rótulo em ${i.rotulo}.`); } }
  }
  return erros;
}
export { BORDAS_ABA, ANIM_HOVER, ANIM_CLIQUE, VARIANTES_MODAL, MESES, EFEITOS, propsEfeito, MODELOS_COMP, ESTILOS_BARRA, FORMATOS_PROGRESSO, novoComponente, novoItemComp, TEMAS, FORMATOS_ABA, VARIANTES_LATERAL, aplicarTema, novoPaineis, arvorePaineis, ACOES_CLIQUE, MODOS_LAYOUT, TIPOS_FILHO, ICONES_COMANDO, construtorVazio, novaCaixa, novoFilho, grupoPadrao, novaFaixa, novaAba, novoGrupo, novoItem, novoMenu, novoItemMenu, novoSeparador, VARIANTES_BLOCO, novoBlocos, novoBloco, novaLateral, novoItemLateral, novaAbasDoc, novaAbaDoc, novoSubitem, TIPOS_OBJETO, ORGANIZACOES_GRUPO, TAMANHOS_COMANDO, ESTILOS_FAIXA, COMPORTAMENTOS_FAIXA, ABRIR_COM, ANIMACOES_FAIXA, SOMBRAS_GRUPO, aplicarEstiloFaixa, abaVisivel, iconeDoGrupo, gerarItem, validarConstrutor };
