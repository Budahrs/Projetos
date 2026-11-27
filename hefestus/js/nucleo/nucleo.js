import { formatarSpec, planoFormatacao } from "./autoformatar.js";
// Núcleo do Hefestus: um projeto (documento + memória + histórico) e os comandos
// que o editor usa. Toda alteração passa pela skill Melhoria na Execução,
// que aplica só o que foi pedido, protege o resto e grava um evento desfazível.

import { faixaPronta, FAIXAS_PRONTAS } from "./prontos.js";
import { gerarItem, validarConstrutor, construtorVazio, novaCaixa, novaFaixa, novoMenu, novoFilho, novoItemMenu, novoSeparador, novaAba, novoGrupo, novoItem, grupoPadrao, novoBlocos, novoBloco, novaLateral, novoItemLateral, novaAbasDoc, novaAbaDoc, novoSubitem, aplicarEstiloFaixa, novoComponente, novoItemComp, aplicarTema, TEMAS, novoPaineis } from "./construtor.js";
import { exportarHistorico, importarHistorico } from "./historicoArquivo.js";
import { lerSVG } from "./svgImport.js";
import { transformar, lerCaminho, escreverCaminho } from "./vetor.js";
import { gerarTamanhos, gerarEstilos, refinar, manterOpcao } from "./variantes.js";
import { Projeto, SkillMelhoriaExecucao, clonar } from "./protecao.js";
import { CATALOGO } from "./catalogo.js";
import { listar } from "./exportar.js";
import { gerarHTML } from "./compilador.js";
import { podeSelecionar } from "./selecao.js";
import { EFEITOS_BOTAO, propsEfeitoBotao } from "./efeitosBotao.js";
import { RADIO } from "./radio.js";
import { elementosDoModelo } from "./modelos.js";
import { aplicarLayouts, controladosPorLayout, descendentes, filhosDe } from "./layout.js";
import { planoComportamento } from "./comportamentos.js";
import { contornosDoElemento, mascaraPara, normalizarContornos, estiloParaVetor, operar, OPERACOES } from "./vetorElemento.js";
import { auditar, correcoes, explicar, documentar } from "./auditoria.js";
import { diferenca } from "./diferenca.js";
import { gerarArtefato, ARTEFATOS } from "./artefatos.js";
import { migrarProjeto, lerProjeto, textoDoProjeto, nomeArquivoProjeto } from "./arquivoProjeto.js";
import { emJanelaNativa, abrirComDialogo, salvarComDialogo, gravarEm, nomeDoCaminho, craftBooleana, craftContornarTraco } from "./nativo.js";
import { examinarDocumento, ultimoEstadoValido, compararEstados, normalizarTitulo } from "./recuperacao.js";
import { classificar, TIPOS_RECONHECIDOS } from "./classificador.js";
import { auditarContratos, migrarTipo, verificarLimites } from "./contrato.js";
import { auditarSuperficies } from "./superficies.js";
import { novoVinculo, eventoDoVinculo } from "./vinculos.js";
import { documentosProjeto } from "./documentacaoProjeto.js";
import { criarZIP, lerZIP } from "./zip.js";
import { prepararHTMLImportado } from "./importarHTML.js";
import { sincronizarObjetosForja } from "./forjaObjetos.js";
const CHAVE = "hefestus.projeto.v1";
const LIMITE_HISTORICO = 120;

function definirCaminho(obj, caminho, valor) {
  const partes = caminho.split(".");
  let o = obj;
  for (const p of partes.slice(0, -1)) {
    if (typeof o[p] !== "object" || o[p] === null) o[p] = {};
    o = o[p];
  }
  o[partes.at(-1)] = clonar(valor);
}

class Nucleo {
  constructor() {
    this.skill = new SkillMelhoriaExecucao();
    this.ouvintes = new Set();
    this.selecao = null;
    this.multi = [];
    this.sujo = false;
    this.ultimoResultado = null;
    this.caminhoArquivo = null;
    if (!this.carregarLocal()) this.novo(false);
    sincronizarObjetosForja(this.doc);
  }

  // ----------------------------------------------------------
  // Eventos para a interface
  // ----------------------------------------------------------
  on(fn) {
    this.ouvintes.add(fn);
    return () => this.ouvintes.delete(fn);
  }
  /** `versao` sobe a cada mudança de conteúdo (não de seleção): a tela só redesenha quando ela muda. */
  emitir(motivo) {
    if(["documento","novo","historico","recuperacao"].includes(motivo))this._revisao=(this._revisao??0)+1;
    sincronizarObjetosForja(this.doc);
    if (motivo !== "selecao" && motivo !== "salvo") this.versao = (this.versao ?? 0) + 1;
    for (const fn of this.ouvintes) fn(motivo);
  }

  // ----------------------------------------------------------
  // Leitura
  // ----------------------------------------------------------
  get doc() { return this.projeto.doc; }
  get tela() { return this.doc.elementos.__canvas; }
  get nome() { return this.tela.nome ?? "Projeto sem título"; }
  elemento(id) { return id ? this.doc.elementos[id] : undefined; }
  elementos() { return listar(this.doc); }
  selecionado() {
    const el = this.elemento(this.selecao);
    return el ? { id: this.selecao, ...el } : null;
  }
  historico() {
    return {
      itens: this.projeto.historico.map((e, i) => ({ indice: i + 1, id: e.id, texto: e.pedido })),
      cursor: this.projeto.cursor,
    };
  }
  pendente() { return this.projeto.pendente?.pergunta ?? null; }
  html() { return gerarHTML(this.doc); }

  // ----------------------------------------------------------
  // Comandos (todos passam pela skill)
  // ----------------------------------------------------------
  get revisao() { return this._revisao??0; }

  comando(pedido, aplicar) {
    if(pedido.revisaoEsperada!==undefined&&pedido.revisaoEsperada!==this.revisao)throw Object.assign(new Error("O documento mudou. Refaça a operação sobre a revisão atual."),{codigo:"REVISAO_OBSOLETA"});
    const p = this.projeto;
    const antes = clonar(p.doc), memAntes = clonar(p.memoria.decisoes);
    const historico = p.historico.slice(), cursor = p.cursor, ramos = p.ramos.slice();
    let r;
    try { r = this.skill.executar(p, pedido, aplicar); }
    catch (erro) {
      this.originalRecuperacao = clonar(p.doc);
      p.doc = antes; p.memoria.decisoes = memAntes; p.historico = historico; p.cursor = cursor; p.ramos = ramos; p.pendente = undefined;
      this.avisoRecuperacao = `A alteração falhou e foi revertida: ${erro.message}. O estado anterior foi preservado.`;
      this.emitir("recuperacao");
      throw erro;
    }
    this.posComando(r);
    return r;
  }

  responder(opcaoId) {
    const r = this.skill.responder(this.projeto, opcaoId);
    this.posComando(r);
    return r;
  }

  posComando(r) {
    sincronizarObjetosForja(this.doc);
    this.rebaixarLayout();
    this.ultimoResultado = r;
    if (r.acao === "aplicado" || r.acao === "aplicado_parcial") this.sujo = true;
    this.limparSelecaoOrfa();
    this.autosalvar();
    this.emitir(r.pergunta ? "pergunta" : "documento");
  }

  novoId(tipo) {
    let n = 1;
    while (this.doc.elementos[`${tipo}_${n}`]) n++;
    return { id: `${tipo}_${n}`, n };
  }

  rotulo(id) {
    const el = this.elemento(id);
    return el?.nome ?? id;
  }

  criar(tipo, x, y, extra = {}) {
    const def = CATALOGO[tipo];
    if (!def) throw new Error(`Tipo desconhecido: ${tipo}`);
    const { id, n } = this.novoId(tipo);
    const nome = typeof extra.nome === "string" && extra.nome.trim() ? extra.nome : `${def.nome} ${n}`;
    const zMax = Math.max(0, ...this.elementos().map(e => e.z ?? 0));
    const padrao=def.padrao();
    const el = { ...padrao, ...extra, estilo:{...padrao.estilo,...extra.estilo}, tipo, nome, z: zMax + 1 };
    el.x = Math.round(x ?? (this.tela.largura - el.largura) / 2);
    el.y = Math.round(y ?? (this.tela.altura - el.altura) / 2);
    const r = this.comando(
      { texto: `Inserir ${nome}`, alvos: [id], propriedades: ["*"] },
      d => { d.elementos[id] = el; }
    );
    this.projeto.memoria.aliases[nome.toLowerCase()] = [id];
    if (r.acao === "aplicado") {
      // O usuário escolheu o tipo, a posição e o que veio em `extra`; o resto são padrões do sistema.
      const escolhidos = new Set(["tipo", "nome", "x", "y", "z", ...Object.keys(extra)]);
      this.rebaixarPadroes(id, p => escolhidos.has(p.split(".")[0]));
      this.selecionar(id);
    }
    return id;
  }


  // ---------------------------------------------------------- vetores
  /** Cria uma forma vetorial a partir de contornos em px do documento (caneta, booleanas). */
  criarVetor(contornos, { aberto = false, texto = "Desenhar com a caneta", estilo, z } = {}) {
    const caixa = normalizarContornos(contornos);
    if (!caixa) return null;
    const def = CATALOGO.forma.padrao();
    const { id, n } = this.novoId("forma");
    const zMax = Math.max(0, ...this.elementos().map(e => e.z ?? 0));
    const est = estilo ?? (aberto ? { ...def.estilo, fundo: "transparent", borda: "#1f2937", larguraBorda: 2 } : def.estilo);
    const el = { ...def, tipo: "forma", nome: `Forma ${n}`, forma: "vetor", evenodd: true, ...caixa, estilo: est, z: z ?? zMax + 1 };
    const r = this.comando({ texto, alvos: [id], propriedades: ["*"] }, d => { d.elementos[id] = el; });
    this.projeto.memoria.aliases[el.nome.toLowerCase()] = [id];
    if (r.acao === "aplicado") { this.rebaixarPadroes(id, p => ["tipo", "nome", "x", "y", "z"].includes(p.split(".")[0])); this.selecionar(id); return id; }
    return null;
  }

  importarHTML(entrada) {
    const item=prepararHTMLImportado(entrada),padrao=CATALOGO.container.padrao();
    return this.criar('container',undefined,undefined,{...item,grupo:true,layout:{...padrao.layout,modo:'livre',abracar:false,margem:0},estilo:{...padrao.estilo,fundo:'transparent',borda:'transparent',larguraBorda:0,raio:0}});
  }
  comporHTMLComSelecao(entrada,origens=this.selecionados()) {
    const novo=prepararHTMLImportado(entrada),ids=this.comDescendentes(origens).filter(id=>this.elemento(id)&&!id.startsWith('__'));
    if(!ids.length)throw new Error('Selecione o artefato que será combinado com o HTML.');
    const b=this.limites(ids),tela={...clonar(this.tela),largura:b.largura,altura:b.altura};
    const elementos=Object.fromEntries(ids.map(id=>{const e=clonar(this.elemento(id));e.x-=b.x;e.y-=b.y;if(e.pai&&!ids.includes(e.pai))delete e.pai;return [id,e];}));
    const isolado=ids.length===1?this.elemento(ids[0]).codigo:null;
    const anterior=prepararHTMLImportado({html:isolado?.isolado?isolado.html:gerarHTML({elementos:{__canvas:tela,...elementos}}),css:isolado?.isolado?isolado.css??'':'',js:isolado?.isolado?isolado.js??'':'',nome:'Artefato combinado da seleção',largura:Math.min(4000,Math.max(80,b.largura)),altura:Math.min(4000,Math.max(80,b.altura)),online:isolado?.recursosExternos===true||entrada.online===true||!!tela.complemento?.emissoras?.length});
    const partes=[novo,anterior],largura=Math.max(...partes.map(p=>p.largura)),altura=partes.reduce((s,p)=>s+p.altura,0)+16,padrao=CATALOGO.container.padrao();
    const root={...clonar(padrao),tipo:'container',nome:novo.nome+' + seleção',grupo:true,x:0,y:0,largura,altura,layout:{...padrao.layout,modo:'livre',abracar:false,margem:0},estilo:{...padrao.estilo,fundo:'transparent',borda:'transparent',larguraBorda:0}};
    let y=0;const modelo={id:'composicao_html',nome:root.nome,cat:'Meus modelos',largura,altura,elementos:[{ref:'composicao',el:root},...partes.map((p,i)=>{const el={...clonar(padrao),...p,tipo:'container',grupo:true,pai:'composicao',x:(largura-p.largura)/2,y,layout:{...padrao.layout,modo:'livre',abracar:false,margem:0},estilo:{...padrao.estilo,fundo:'transparent',borda:'transparent',larguraBorda:0}};y+=p.altura+16;return {ref:'parte_'+i,el};})]};
    // O artefato anterior é fotografado com seus IDs/código num escopo próprio.
    // Os originais permanecem no documento. A composição inteira é um único Undo.
    return this.inserirModelo(modelo)[0];
  }

  /** Contornos (px do documento) de um vetor, para editar nós. */
  contornosDoVetor(id) {
    const el = this.elemento(id);
    if (!el || el.tipo !== "forma") return null;
    return contornosDoElemento(el);
  }

  /** Grava os contornos editados no próprio elemento (reenquadra o elemento no desenho). */
  definirVetor(id, contornos, texto = "Editar nós") {
    const el = this.elemento(id);
    const caixa = normalizarContornos(contornos);
    if (!el || !caixa) return null;
    return this.definir(id, { forma: "vetor", evenodd: true, rotacao: 0, ...caixa }, `${texto} de ${this.rotulo(id)}`);
  }

  /** Transforma formas, caixas e elipses em vetor editável (mantém estilo e posição na pilha). */
  converterEmVetor(ids) {
    const alvos = ids.filter(i => contornosDoElemento(this.elemento(i)));
    if (!alvos.length) return [];
    const novos = [];
    const r = this.comando({ texto: `Converter ${this.descreverGrupo(alvos)} em vetor`, alvos, propriedades: ["*"], tipo: "remover" }, d => {
      for (const id of alvos) {
        const el = d.elementos[id];
        const caixa = normalizarContornos(contornosDoElemento(el));
        if (!caixa) continue;
        if (el.tipo === "forma") { Object.assign(el, { forma: "vetor", evenodd: true, rotacao: 0, ...caixa }); delete el.lados; delete el.razao; delete el.canto; delete el.giro; novos.push(id); continue; }
        d.elementos[id] = { ...el, tipo: "forma", forma: "vetor", texto:el.texto??el.rotulo??el.placeholder??"", evenodd: true, ...caixa, rotacao:0, estilo: estiloParaVetor(el) };
        novos.push(id);
      }
    });
    if (r.acao === "aplicado") this.selecionarVarios(novos);
    return novos;
  }

  novoIdEm(d, tipo) { let n = 1; while (d.elementos[`${tipo}_${n}`]) n++; return { id: `${tipo}_${n}`, n }; }

  /** Operação booleana entre 2+ elementos: o mais ao fundo é a base. Cria um vetor e remove os originais. */
  /** Elementos que entram na booleana, do mais ao fundo para o mais à frente. */
  itensBooleana(ids) {
    return ids.map(i => ({ ...this.elemento(i), id: i })).filter(e => e.tipo && contornosDoElemento(e)).sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  }

  /**
   * Booleana com a ferramenta do Craft (FigCraft pathops) quando roda na janela própria: curvas exatas.
   * No navegador, ou se o motor falhar, usa a booleana em JS de sempre.
   */
  async booleanaPrecisa(ids, op) {
    if (!emJanelaNativa() || !OPERACOES[op]) return this.booleana(ids, op);
    const itens = this.itensBooleana(ids);
    if (itens.length < 2) return this.booleana(ids, op);
    try {
      const d = await craftBooleana(itens.map(e => escreverCaminho(contornosDoElemento(e))), op);
      return { ...this.booleana(ids, op, lerCaminho(d)), motor: "craft" };
    } catch (e) {
      console.warn("[Hefestus] booleana do Craft falhou; usando a de JS", e);
      return this.booleana(ids, op);
    }
  }

  /** Traço que será convertido: o primeiro visível de estilo.tracos, ou a borda simples. */
  tracoDoElemento(el) {
    const t = (el?.estilo?.tracos ?? []).find(x => x.visivel !== false && Number(x.largura) > 0);
    if (t) return { origem: "tracos", cor: t.cor, largura: Number(t.largura), posicao: t.posicao ?? "dentro", ponta: t.ponta ?? "reta", juncao: t.juncao ?? "reta", estilo: t.estilo ?? "solido", t };
    const bw = Number(el?.estilo?.larguraBorda) || 0;
    if (bw > 0 && el.estilo.borda && el.estilo.borda !== "transparent") return { origem: "borda", cor: el.estilo.borda, largura: bw, posicao: "dentro", ponta: "reta", juncao: "reta", estilo: "solido" };
    return null;
  }

  podeConverterTraco(id) {
    const el = this.elemento(id);
    return !!(el && contornosDoElemento(el) && this.tracoDoElemento(el));
  }

  /**
   * Converter traço em forma (ferramenta do Craft, só na janela própria): a área do traço vira uma
   * forma preenchida com a cor do traço, por cima do elemento, e o elemento perde o traço. Um passo, desfazível.
   */
  async converterTracoEmForma(id) {
    const el = this.elemento(id);
    const cs = el && contornosDoElemento(el);
    if (!cs) return { erro: "Selecione uma forma, caixa, elipse, botão ou campo." };
    const tr = this.tracoDoElemento(el);
    if (!tr) return { erro: "O elemento não tem traço (borda) para converter." };
    if (!emJanelaNativa()) return { erro: "Converter traço em forma usa o motor Craft: abra o Hefestus na janela própria." };
    const w = tr.largura;
    const tracejado = tr.estilo === "tracejado" ? [w * 3, w * 2] : tr.estilo === "pontilhado" ? [w, w] : [];
    let d;
    try {
      d = await craftContornarTraco(escreverCaminho(cs), { largura: w, posicao: tr.posicao, ponta: tr.ponta, juncao: tr.juncao, tracejado, fechado: cs.every(c => c.fechado) });
    } catch (e) {
      return { erro: `O motor Craft não converteu o traço: ${e?.message ?? e}` };
    }
    const res = lerCaminho(d);
    if (!res.length) return { erro: "O traço ficou vazio." };
    const caixa = normalizarContornos(res);
    const { id: novo, n } = this.novoId("forma");
    const forma = {
      ...CATALOGO.forma.padrao(), tipo: "forma", nome: `Traço de ${this.rotulo(id)}`, forma: "vetor", evenodd: true, ...caixa,
      estilo: { ...estiloParaVetor(el), fundo: tr.cor, larguraBorda: 0, tracos: [], preenchimentos: [], efeitos: [], sombra: "nenhuma" },
      z: (el.z ?? 0) + 0.5, ...(el.pai ? { pai: el.pai } : {}),
    };
    const r = this.comando({ texto: `Converter traço de ${this.rotulo(id)} em forma`, alvos: [novo, id], propriedades: ["*"] }, doc => {
      doc.elementos[novo] = forma;
      const alvo = doc.elementos[id];
      alvo.estilo = { ...alvo.estilo };
      if (tr.origem === "tracos") alvo.estilo.tracos = alvo.estilo.tracos.filter(x => x !== tr.t && !(x.cor === tr.t.cor && x.largura === tr.t.largura && x.posicao === tr.t.posicao));
      else alvo.estilo.larguraBorda = 0;
    });
    if (r.acao === "aplicado") { this.projeto.memoria.aliases[forma.nome.toLowerCase()] = [novo]; this.selecionar(novo); return { id: novo, n }; }
    return { erro: "Não foi possível aplicar." };
  }

  booleana(ids, op, resultadoPronto = null) {
    if (!OPERACOES[op]) return { erro: "Operação desconhecida." };
    const itens = this.itensBooleana(ids);
    if (itens.length < 2) return { erro: "Selecione pelo menos 2 formas, caixas ou elipses." };
    const res = resultadoPronto ?? operar(itens.map(contornosDoElemento), op);
    if (!res.length) return { erro: "O resultado ficou vazio (as formas não se sobrepõem)." };
    const base = itens[0];
    const caixa = normalizarContornos(res);
    const { id, n } = this.novoId("forma");
    const el = { ...CATALOGO.forma.padrao(), tipo: "forma", nome: `Forma ${n}`, forma: "vetor", evenodd: true, ...caixa, estilo: estiloParaVetor(base), z: Math.max(...itens.map(e => e.z ?? 0)), ...(base.pai ? { pai: base.pai } : {}) };
    const antigos = itens.map(e => e.id);
    const r = this.comando({ texto: `${OPERACOES[op]} de ${antigos.length} formas`, alvos: [id, ...antigos], propriedades: ["*"], tipo: "remover" }, d => { d.elementos[id] = el; for (const a of antigos) delete d.elementos[a]; });
    if (r.acao === "aplicado") { this.projeto.memoria.aliases[el.nome.toLowerCase()] = [id]; this.selecionar(id); return { id }; }
    return { erro: "Não foi possível aplicar." };
  }

  // ---------- construtor por formulário ----------
  construtor() { return clonar(this.doc.elementos.__construtor ?? construtorVazio()); }

  /**
   * Aplica `mutar(spec)` ao formulário e regenera os elementos do item `idItem` (ou remove, se `remover`).
   * Tudo num passo desfazível. Itens cujo id muda de container são tratados pelo `construtor` marcado nos elementos.
   */
  atualizarConstrutor(mutar, texto, idItem, { remover = false } = {}) {
    const spec = this.construtor();
    mutar(spec);
    const varios = Array.isArray(idItem);
    const ids = varios ? idItem : [idItem];
    const item = varios ? null : spec.itens.find(i => i.id === idItem);
    const antigos = Object.entries(this.doc.elementos).filter(([, e]) => ids.includes(e.construtor)).map(([id]) => id);
    const novos = remover ? [] : ids.flatMap(i => { const x = spec.itens.find(y => y.id === i); return x ? gerarItem(x, this.tela) : []; });
    const zMax = Math.max(0, ...this.elementos().map(e => e.z ?? 0));
    const zAntigo = Object.fromEntries(antigos.map(id => [id, this.doc.elementos[id].z]));
    const alvos = ["__construtor", ...new Set([...antigos, ...novos.map(n => n.id)])];
    // o formulário é dono do que gera: decisões protegidas antigas desses elementos não valem para a nova geração
    const mem = this.projeto.memoria;
    mem.decisoes = mem.decisoes.filter(d => !antigos.includes(d.alvo));
    const r = this.comando({ texto, alvos, propriedades: ["*"], tipo: "remover" }, d => {
      d.elementos.__construtor = spec;
      for (const id of antigos) delete d.elementos[id];
      novos.forEach(({ id, el }, i) => { d.elementos[id] = { ...el, z: zAntigo[id] ?? zMax + 1 + i }; });
      if (!remover) this.conferirGerados(d, new Set(novos.map(n => n.id)));
    });
    if (r.acao === "aplicado") this.rebaixarPadroesVarios(novos.map(({ id }) => id), () => false);
    if (r.acao === "aplicado" && item && !remover) this.selecionar(item.id);
    return { ok: r.acao === "aplicado", spec, erros: validarConstrutor(spec) };
  }

  /** O que o formulário gera já nasce conforme a auditoria: a tela cresce para caber, e contraste, hover, foco, nome e rótulo são corrigidos. */
  conferirGerados(d, ids) {
    const t = d.elementos.__canvas;
    const dentroAjuste = e => { for (let p = d.elementos[e.pai], k = 0; p && k < 30; p = d.elementos[p.pai], k++) if (p.autoAjuste) return true; return false; };
    const visiveis = [...ids].map(id => d.elementos[id]).filter(e => e && e.visivel !== false && !e.abertura?.iniciaFechado && !e.autoAjuste && !dentroAjuste(e));
    if (t && visiveis.length) {
      const L = Math.ceil(Math.max(...visiveis.map(e => e.x + e.largura))), A = Math.ceil(Math.max(...visiveis.map(e => e.y + e.altura)));
      if (L > t.largura) t.largura = L + 20;
      if (A > t.altura) t.altura = A + 20;
    }
    const lista = Object.entries(d.elementos).filter(([id]) => !id.startsWith("__")).map(([id, e]) => ({ id, ...e }));
    const itens = auditar(lista, { largura: t?.largura, altura: t?.altura, fundo: t?.fundo }, ids).filter(i => ids.has(i.id) && i.correcao && ["contraste", "hover", "foco", "nome", "rotulo", "fora"].includes(i.regra));
    for (const [id, patch] of Object.entries(correcoes(itens))) for (const [caminho, valor] of Object.entries(patch)) {
      const partes = caminho.split("."); let o = d.elementos[id];
      for (const k of partes.slice(0, -1)) o = (o[k] ??= {});
      o[partes.at(-1)] = valor;
    }
  }

  /** Aplica um tema completo a todos os itens do formulário, num único passo desfazível. */
  construtorTema(chave) {
    if (!TEMAS[chave]) throw new Error(`tema "${chave}" não existe`);
    const ids = this.construtor().itens.map(i => i.id);
    if (!ids.length) return { ok: false, erros: ["Crie algum item no formulário antes de aplicar um tema."] };
    return this.atualizarConstrutor(sp => { aplicarTema(sp, chave); }, `Tema ${TEMAS[chave].nome}`, ids);
  }

  /** A tela do projeto representa o monitor do PC: largura e altura reais da tela. Silencioso = sem passo de histórico (projeto novo). */
  ajustarTelaAoMonitor(silencioso = false, largura = globalThis.screen?.width, altura = globalThis.screen?.height) {
    if (!(largura >= 320) || !(altura >= 240)) return false;
    largura = Math.round(largura); altura = Math.round(altura);
    const t = this.tela;
    if (t.largura === largura && t.altura === altura) return false;
    if (silencioso) { t.largura = largura; t.altura = altura; t.responsivo = true; return true; }
    this.definir("__canvas", { largura, altura, responsivo: true }, `Tela do tamanho do monitor (${largura}×${altura})`);
    return true;
  }

  /** Ajusta a tela ao espaço real do modo híbrido e refaz as faixas de largura total. */
  ajustarTelaReal(largura, altura) {
    const t = this.tela;
    if (Math.abs(t.largura - largura) < 2 && Math.abs(t.altura - altura) < 2) return false;
    this.definir("__canvas", { largura, altura }, `Tela ajustada ao espaço real (${largura}×${altura})`);
    for (const it of this.construtor().itens) if (it.tipo === "ribbon" && !it.largura) this.atualizarConstrutor(() => {}, `Faixa na largura da tela: ${it.nome}`, it.id);
    return true;
  }

  /** Cria um item no formulário (caixa, faixa ou menu) e já gera os elementos. */
  adicionarItemConstrutor(tipo, modelo) {
    const atual = this.construtor();
    const seq = atual.seq + 1;
    const novo = { caixa: novaCaixa, ribbon: novaFaixa, menu: novoMenu, blocos: novoBlocos, lateral: novaLateral, abasDoc: novaAbasDoc, componente: s => novoComponente(s, modelo), paineis: novoPaineis }[tipo]?.(seq);
    if (!novo) throw new Error(`tipo de item desconhecido: ${tipo}`);
    // não nasce em cima do que já existe: abaixo do item mais baixo (menus do botão direito flutuam e ficam de fora)
    if (tipo !== "menu") {
      const base = atual.itens.filter(i => i.tipo !== "menu").map(i => this.doc.elementos[i.id]).filter(Boolean);
      if (base.length) novo.y = Math.round(Math.max(...base.map(e => e.y + e.altura)) + 16);
    }
    const r = this.atualizarConstrutor(spec => { spec.seq = seq; spec.itens.push(novo); }, `Novo item pelo formulário: ${novo.nome}`, novo.id);
    return { id: novo.id, ...r };
  }

  /** Cria um item do formulário já com dados (usado pelo agente): nome, posição, itens de menu, abas… */
  construtorCriar(tipo, dados = {}) {
    const slug = t => String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
    const base = this.adicionarItemConstrutor(tipo, dados.modelo);
    if (!base.ok) throw new Error("não consegui criar o item");
    const id = base.id;
    const dd = { ...dados };
    const r = this.atualizarConstrutor(spec => {
      const it = spec.itens.find(i => i.id === id);
      if (dd.nome) it.nome = String(dd.nome).slice(0, 60);
      for (const k of ["x", "y", "largura", "altura"]) if (Number.isFinite(+dd[k])) it[k] = +dd[k];
      if (tipo === "caixa") {
        if (dd.fundo) it.estilo.fundo = dd.fundo;
        if (dd.borda) it.estilo.borda = dd.borda;
        if (dd.raio != null) it.estilo.raio = +dd.raio;
        if (dd.modo) it.layout.modo = dd.modo;
        if (Array.isArray(dd.filhos)) it.filhos = dd.filhos.map((f, i) => ({ ...novoFilho({ filhos: [] }), ...f, id: `f${i + 1}` }));
      } else if (tipo === "menu") {
        if (Array.isArray(dd.itens)) it.itens = dd.itens.map((x, i) => (x === "-" || x?.separador ? { id: `i${i + 1}`, separador: true } : { id: `i${i + 1}`, icone: "estrela", atalho: "", sinal: "", ...(typeof x === "string" ? { rotulo: x } : x) }))
          .map(x => (x.separador || x.sinal ? x : { ...x, sinal: `${id}_${String(x.rotulo).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase()}` }));
        if (dd.fundo) it.fundo = dd.fundo;
      } else if (tipo === "blocos") {
        for (const k of ["colunas", "larguraBloco", "alturaBloco"]) if (Number.isFinite(+dd[k])) it[k] = +dd[k];
        if (dd.variante) it.variante = dd.variante === "cartao" ? "cartao" : "icone";
        if (Array.isArray(dd.itens) && dd.itens.length) it.itens = dd.itens.map((x, i) => ({ id: `i${i + 1}`, subtitulo: "", icone: "estrela", status: "", ...(typeof x === "string" ? { titulo: x } : x) })).map(x => ({ ...x, sinal: x.sinal ?? `${id}_${slug(x.titulo)}` }));
        if (dd.fundo) it.fundo = dd.fundo;
      } else if (tipo === "lateral") {
        if (Number.isFinite(+dd.altura)) it.altura = +dd.altura;
        if (dd.marca) it.marca = String(dd.marca);
        if (Array.isArray(dd.itens) && dd.itens.length) it.itens = dd.itens.map((x, i) => ({ id: `i${i + 1}`, icone: "estrela", ...(typeof x === "string" ? { rotulo: x } : x) })).map(x => ({ ...x, sinal: x.sinal ?? `${id}_${slug(x.rotulo)}` }));
        if (dd.fundo) it.fundo = dd.fundo;
      } else if (tipo === "abasDoc") {
        if (Array.isArray(dd.abas) && dd.abas.length) it.abas = dd.abas.map((x, i) => ({ id: `a${i + 1}`, sinal: "", ...(typeof x === "string" ? { nome: x } : x) }));
        if (dd.fechavel != null) it.fechavel = !!dd.fechavel;
        if (dd.formato) it.formato = String(dd.formato);
        for (const k of ["abaEsq", "abaDir"]) if (dd[k]) it[k] = String(dd[k]);
        for (const k of ["animHover", "animClique"]) if (dd[k]) it[k] = String(dd[k]);
      } else if (tipo === "paineis") {
        for (const k of ["largura", "altura", "tamEsq", "tamDir", "tamBaixo", "divisor"]) if (Number.isFinite(+dd[k])) it[k] = +dd[k];
        if (Array.isArray(dd.regioes)) it.regioes = dd.regioes.filter(k => ["esq", "dir", "baixo"].includes(k));
        if (dd.titulos && typeof dd.titulos === "object") it.titulos = { ...it.titulos, ...Object.fromEntries(Object.entries(dd.titulos).map(([k, v]) => [k, String(v)])) };
        for (const k of ["fundo", "borda", "cor", "acento"]) if (dd[k]) it[k] = String(dd[k]);
      } else if (tipo === "componente") {
                for (const k of ["valor", "total", "ativo"]) if (Number.isFinite(+dd[k])) it[k] = +dd[k];
        for (const k of ["titulo", "mensagem", "variante", "serie", "legenda"]) if (dd[k] != null) it[k] = String(dd[k]);
        for (const k of ["mes", "ano", "raioMenu"]) if (Number.isFinite(+dd[k])) it[k] = +dd[k];
        if (Array.isArray(dd.colunas)) it.colunas = dd.colunas.map(String).slice(0, 6);
        if (dd.tipoGrafico) it.tipoGrafico = ["barras", "linha", "rosca"].includes(dd.tipoGrafico) ? dd.tipoGrafico : "barras";
        if (dd.formaMenu) it.formaMenu = dd.formaMenu === "hexagono" ? "hexagono" : "circulo";
        if (dd.iniciaOculto != null) it.iniciaOculto = !!dd.iniciaOculto;
        if (dd.estiloBarra) it.estiloBarra = dd.estiloBarra;
        if (dd.vertical != null) it.vertical = !!dd.vertical;
        if (dd.efeito) it.efeito = dd.efeito;
        if (dd.fundo) it.fundo = dd.fundo;
        if (dd.acento) it.acento = dd.acento;
        if (Array.isArray(dd.itens) && dd.itens.length) it.itens = dd.itens.map((x, i) => ({ ...novoItemComp({ ...it, itens: [] }), ...(typeof x === "string" ? { rotulo: x } : x), id: `i${i + 1}` })).map(x => ({ ...x, sinal: x.sinal ?? `${id}_${slug(x.rotulo)}` }));
      } else if (tipo === "ribbon") {
        if (dd.busca != null) it.busca = !!dd.busca;
        if (Array.isArray(dd.abas) && dd.abas.length) it.abas = dd.abas.map((a, i) => ({ id: `a${i + 1}`, nome: typeof a === "string" ? a : a.nome, quando: [], corAba: "", grupoAtivo: 0, grupos: (typeof a === "object" && a.grupos) || [grupoPadrao("g1", "Grupo")] }));
        if (dd.banda) it.banda = dd.banda;
        if (dd.estilo) aplicarEstiloFaixa(it, String(dd.estilo));
      }
    }, `Criar ${dd.nome ?? tipo} pelo formulário`, id);
    return { id, ...r };
  }

  /** Muda um campo do formulário por caminho ("estilo.fundo", "comportamento.menuContexto", "banda"…). */
  construtorEditar(id, caminho, valor) {
    const spec = this.construtor();
    const it = spec.itens.find(i => i.id === id);
    if (!it) throw new Error(`item "${id}" não existe no formulário`);
    const partes = String(caminho).split(".");
    if (["id", "tipo", "filhos", "itens", "abas"].includes(partes[0]) && partes.length === 1) throw new Error("use construtor_adicionar para listas");
    return this.atualizarConstrutor(sp => {
      let o = sp.itens.find(i => i.id === id);
      for (const p of partes.slice(0, -1)) { if (typeof o[p] !== "object" || o[p] === null) o[p] = {}; o = o[p]; }
      o[partes.at(-1)] = valor;
    }, `Formulário: ${caminho} de ${it.nome}`, id);
  }

  /** Acrescenta ao formulário: filho (container), item/separador (menu), aba/grupo/comando (faixa). */
  construtorAdicionar(id, o, dados = {}) {
    const it = this.construtor().itens.find(i => i.id === id);
    if (!it) throw new Error(`item "${id}" não existe no formulário`);
    const slug = t => String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
    return this.atualizarConstrutor(sp => {
      const x = sp.itens.find(i => i.id === id);
      if (o === "filho" && x.tipo === "caixa") x.filhos.push({ ...novoFilho(x), ...dados });
      else if ((o === "item" || o === "separador") && x.tipo === "menu") x.itens.push(o === "separador" ? novoSeparador(x) : { ...novoItemMenu(x), ...dados, sinal: dados.sinal ?? `${id}_${slug(dados.rotulo)}` });
      else if (o === "bloco" && x.tipo === "blocos") x.itens.push({ ...novoBloco(x), ...dados, sinal: dados.sinal ?? `${id}_${slug(dados.titulo)}` });
      else if (o === "item" && x.tipo === "lateral") x.itens.push({ ...novoItemLateral(x), ...dados, sinal: dados.sinal ?? `${id}_${slug(dados.rotulo)}` });
      else if (o === "item" && x.tipo === "componente") x.itens.push({ ...novoItemComp(x), ...dados });
      else if (o === "aba" && x.tipo === "abasDoc") x.abas.push({ ...novaAbaDoc(x), ...(dados.nome ? { nome: dados.nome } : {}) });
      else if (o === "subitem" && x.tipo === "menu") { const pai = x.itens.find(i => slug(i.rotulo) === slug(dados.item)) ?? x.itens.filter(i => !i.separador).at(-1); if (!pai) throw new Error("menu sem itens"); pai.submenu ??= []; pai.submenu.push({ ...novoSubitem(pai), ...(dados.rotulo ? { rotulo: dados.rotulo } : {}), ...(dados.icone ? { icone: dados.icone } : {}), ...(dados.atalho ? { atalho: dados.atalho } : {}), sinal: dados.sinal ?? `${id}_${slug(dados.rotulo)}` }); }
      else if (o === "aba" && x.tipo === "ribbon") x.abas.push({ ...novaAba(x), ...(dados.nome ? { nome: dados.nome } : {}) });
      else if (o === "grupo" && x.tipo === "ribbon") { const a = x.abas.find(a => a.nome === dados.aba) ?? x.abas.at(-1); a.grupos.push({ ...novoGrupo(a), ...(dados.nome ? { nome: dados.nome } : {}) }); }
      else if (o === "comando" && x.tipo === "ribbon") {
        const a = x.abas.find(a => slug(a.nome) === slug(dados.aba)) ?? x.abas[x.abaAtiva ?? 0] ?? x.abas[0];
        const g = a.grupos.find(g => slug(g.nome) === slug(dados.grupo)) ?? a.grupos.at(-1) ?? (a.grupos.push(novoGrupo(a)), a.grupos.at(-1));
        g.itens.push({ ...novoItem(g), rotulo: dados.rotulo ?? "Comando", icone: dados.icone ?? "estrela", sinal: dados.sinal ?? slug(dados.rotulo) });
      } else throw new Error(`"${o}" não se aplica a ${x.tipo}`);
    }, `Formulário: adicionar ${o} em ${it.nome}`, id);
  }

  /** Move o elemento uma posição entre os irmãos (mesmo container), trocando a ordem de empilhamento. */
  moverNaOrdem(id, delta) {
    const el = this.elemento(id);
    if (!el) return { erro: "Elemento não encontrado." };
    const irmaos = this.elementos().filter(e => (e.pai ?? null) === (el.pai ?? null)).sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
    const i = irmaos.findIndex(e => e.id === id), j = i + delta;
    if (i < 0 || j < 0 || j >= irmaos.length) return { erro: "Já está no limite." };
    const a = irmaos[i], b = irmaos[j];
    let za = a.z ?? 0, zb = b.z ?? 0;
    if (za === zb) zb = za + (delta > 0 ? 1 : -1);
    this.definirVarios({ [a.id]: { z: zb }, [b.id]: { z: za } }, `Mover ${a.nome} na ordem`);
    return { ok: true };
  }

  /** Cria um componente DENTRO de um container (ao estilo "adicionar item neste grupo"), no canto interno. */
  criarDentro(tipo, paiId) {
    const pai = this.elemento(paiId);
    if (!pai || pai.tipo !== "container") return this.criar(tipo);
    const { id } = this.novoId(tipo);
    this.criar(tipo, Math.round(pai.x + 16), Math.round(pai.y + 16), { pai: paiId });
    return id;
  }

  /** Importa um SVG como formas vetoriais editáveis (agrupadas num container). Sem gradientes, texto ou filtros. */
  importarSVG(texto, x, y, nomeArquivo = "SVG") {
    const svg = lerSVG(texto);
    if (!svg) return { erro: "Não encontrei formas simples (path, rect, circle, ellipse, polygon, line) nesse SVG." };
    const esc = Math.max(0.25, Math.min(10, 240 / Math.max(svg.largura, svg.altura, 1)));
    const W = svg.largura * esc, H = svg.altura * esc;
    const ox = Math.round(x ?? (this.tela.largura - W) / 2), oy = Math.round(y ?? (this.tela.altura - H) / 2);
    const zMax = Math.max(0, ...this.elementos().map(e => e.z ?? 0));
    const novos = [];
    const usados = new Set(Object.keys(this.doc.elementos));
    const prox = tipo => { let k = 1; while (usados.has(`${tipo}_${k}`)) k++; usados.add(`${tipo}_${k}`); return { id: `${tipo}_${k}`, n: k }; };
    const cont = prox("container");
    for (const [i, f] of svg.formas.entries()) {
      const cs = transformar(f.contornos, (px, py) => [ox + (px - svg.x) * esc, oy + (py - svg.y) * esc]);
      const caixa = normalizarContornos(cs);
      if (!caixa) continue;
      const { id, n } = prox("forma");
      const base = CATALOGO.forma.padrao();
      const sw = f.stroke !== "none" ? Math.max(0.5, Math.round(f.sw * esc * 10) / 10) : 0;
      novos.push([id, { ...base, tipo: "forma", nome: `${String(nomeArquivo).slice(0, 24)} · ${f.nome}`, forma: "vetor", evenodd: true, ...caixa,
        estilo: { ...base.estilo, fundo: f.fill === "none" ? "transparent" : f.fill, borda: f.stroke === "none" ? "transparent" : f.stroke, larguraBorda: sw, raio: 0, opacidade: f.opacidade },
        z: zMax + 1 + i, ...(svg.formas.length > 1 ? { pai: cont.id } : {}) }]);
      void n;
    }
    if (!novos.length) return { erro: "O SVG não gerou formas visíveis." };
    const itens = [...novos];
    if (svg.formas.length > 1) {
      const def = CATALOGO.container.padrao();
      const b = { x: ox, y: oy, largura: Math.round(W), altura: Math.round(H) };
      itens.unshift([cont.id, { ...def, tipo: "container", nome: `SVG ${String(nomeArquivo).slice(0, 24)}`, ...b, z: zMax, layout: { ...def.layout, modo: "livre", margem: 0, abracar: false }, estilo: { ...def.estilo, fundo: "transparent", borda: "transparent", larguraBorda: 0 } }]);
    }
    const r = this.comando({ texto: `Importar SVG (${novos.length} forma${novos.length > 1 ? "s" : ""})`, alvos: itens.map(([id]) => id), propriedades: ["*"] }, d => { for (const [id, el] of itens) d.elementos[id] = el; });
    if (r.acao !== "aplicado") return { erro: "Não foi possível aplicar." };
    const raiz = svg.formas.length > 1 ? cont.id : novos[0][0];
    this.selecionar(raiz);
    return { id: raiz, formas: novos.length };
  }

  /** Máscara: o elemento mais à frente recorta os demais (que ficam visíveis só dentro do contorno dele). */
  criarMascara(ids) {
    const itens = ids.map(i => ({ ...this.elemento(i), id: i })).filter(e => e.tipo).sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
    if (itens.length < 2) return { erro: "Selecione a forma da máscara e pelo menos um elemento para recortar." };
    const fonte = itens.at(-1);
    if (!contornosDoElemento(fonte)) return { erro: "A máscara precisa ser uma forma, caixa ou elipse (o elemento mais à frente)." };
    const alvos = itens.slice(0, -1);
    const mapa = {};
    for (const a of alvos) { const m = mascaraPara(a, fonte); if (m) mapa[a.id] = { mascara: { ...m, fonte: fonte.id } }; }
    mapa[fonte.id] = { visivel: false, eMascara: true };
    this.definirVarios(mapa, `Máscara ${fonte.nome} em ${alvos.length} elemento(s)`);
    return { fonte: fonte.id, alvos: alvos.map(a => a.id) };
  }

  liberarMascara(id) {
    const el = this.elemento(id);
    if (!el) return { erro: "Elemento não encontrado." };
    const fonteId = el.eMascara ? id : el.mascara?.fonte;
    const alvos = this.elementos().filter(e => e.mascara && (e.id === id || e.mascara.fonte === id));
    if (!alvos.length && !el.eMascara) return { erro: "Este elemento não tem máscara." };
    const r = this.comando({ texto: `Liberar máscara de ${this.rotulo(id)}`, alvos: [...alvos.map(a => a.id), ...(fonteId && this.elemento(fonteId) ? [fonteId] : [])], propriedades: ["*"] }, d => {
      for (const a of alvos) delete d.elementos[a.id].mascara;
      const restam = Object.entries(d.elementos).some(([k, e]) => e.mascara && e.mascara.fonte === fonteId);
      if (fonteId && d.elementos[fonteId] && !restam) { d.elementos[fonteId].visivel = true; delete d.elementos[fonteId].eMascara; }
    });
    return r.acao === "aplicado" ? { liberados: alvos.length } : { erro: "Não foi possível aplicar." };
  }

  /** O que um container automático controla (posição dos filhos, tamanho abraçado) não é decisão do usuário. */
  rebaixarLayout() {
    const pares = new Set(controladosPorLayout(this.doc.elementos).map(([a, p]) => `${a}::${p}`));
    if (!pares.size) return;
    let mudou = false;
    for (const d of this.projeto.memoria.ativas()) {
      if (d.status === "protegida" && pares.has(`${d.alvo}::${d.propriedade}`)) { d.status = "implicita"; d.origem = "layout"; mudou = true; }
    }
    const ultimo = this.projeto.historico[this.projeto.cursor - 1];
    if (mudou && ultimo) ultimo.memDepois = clonar(this.projeto.memoria.decisoes);
  }

  /** Descendentes (filhos de containers) dos ids, sem repetir os próprios ids. */
  comDescendentes(ids) {
    const todos = new Set(ids);
    for (const id of ids) for (const d of descendentes(this.doc.elementos, id)) todos.add(d);
    return [...todos];
  }
  filhos(id) { return filhosDe(this.doc.elementos, id); }

  /** Container mais à frente cujo retângulo contém o centro de `ret` (ignorando `excluir`). */
  containerEm(ret, excluir = new Set()) {
    const cx = ret.x + ret.largura / 2;
    const cy = ret.y + ret.altura / 2;
    return this.elementos()
      .filter(e => e.tipo === "container" && !excluir.has(e.id) && e.visivel !== false && cx >= e.x && cx <= e.x + e.largura && cy >= e.y && cy <= e.y + e.altura)
      .sort((a, b) => (b.z ?? 0) - (a.z ?? 0))[0]?.id ?? null;
  }

  /**
   * Move e, ao soltar, encaixa no container sob o centro (ou tira do container).
   * Um único evento. Devolve { entrou: [ids], saiu: [ids] }.
   */
  moverEncaixando(ids, dx, dy) {
    const livres = ids.filter(id => !this.elemento(id)?.travado);
    const movidos = new Set(this.comDescendentes(livres));
    const topo = livres.filter(id => !movidos.has(this.elemento(id).pai) || !livres.includes(this.elemento(id).pai));
    const mapa = {};
    const entrou = [];
    const saiu = [];
    for (const id of movidos) {
      const e = this.elemento(id);
      mapa[id] = { x: Math.round(e.x + dx), y: Math.round(e.y + dy) };
    }
    for (const id of topo) {
      const e = this.elemento(id);
      if (livres.includes(e.pai)) continue;
      // Editar um filho não dissolve silenciosamente um agrupamento explícito.
      if (this.elemento(e.pai)?.grupo) continue;
      const alvo = this.containerEm({ ...e, x: e.x + dx, y: e.y + dy }, movidos);
      if ((alvo ?? undefined) !== (e.pai ?? undefined)) {
        mapa[id].pai = alvo ?? "";
        (alvo ? entrou : saiu).push(id);
      }
    }
    const texto = entrou.length ? `Encaixar ${this.descreverGrupo(entrou)} em ${this.rotulo(mapa[entrou[0]].pai)}`
      : saiu.length ? `Tirar ${this.descreverGrupo(saiu)} do container` : `Mover ${this.descreverGrupo(livres)}`;
    const r = this.definirVarios(mapa, texto);
    // "" marca saída: o recálculo de layout remove `pai` vazio
    return { r, entrou, saiu };
  }

  /** Liga um comportamento pronto (menu suspenso, dica, gaveta, abas…) num comando só. */
  aplicarComportamento(chave, gatilho, alvo) {
    const { mapa, texto } = planoComportamento(this, chave, gatilho, alvo);
    return this.definirVarios(mapa, texto);
  }

  gerarTamanhos(id) { return gerarTamanhos(this, id); }
  gerarEstilos(id, quais) { return gerarEstilos(this, id, quais); }
  refinar(id) { return refinar(this, id); }
  manterOpcao(num) { return manterOpcao(this, num); }

  /** Agrupa os elementos num container livre do tamanho deles (Ctrl+G). */
  agruparEmContainer(ids, modo = "livre", extra = {}) {
    const validos = [...new Set(ids)].filter(id => !id.startsWith("__") && this.elemento(id));
    const lista = validos.filter(id => !validos.some(outro => outro !== id && this.comDescendentes([outro]).includes(id)));
    if (!lista.length) return null;
    const b = this.limites(lista);
    const { id, n } = this.novoId("container");
    const paiComum = lista.every(i => this.elemento(i).pai === this.elemento(lista[0]).pai) ? this.elemento(lista[0]).pai : undefined;
    const zMin = Math.min(...lista.map(i => this.elemento(i).z ?? 0));
    const def = CATALOGO.container.padrao();
    const cont = {
      ...def, tipo: "container", grupo: true, nome: `Grupo ${n}`, x: b.x, y: b.y, largura: b.largura, altura: b.altura, z: zMin - 0.5,
      layout: { ...def.layout, modo, margem: 0, abracar: modo !== "livre" },
      estilo: { ...def.estilo, fundo: "transparent", borda: "transparent", larguraBorda: 0 },
      ...(paiComum ? { pai: paiComum } : {}),
      ...extra,
    };
    const r = this.comando(
      { texto: `Agrupar ${this.descreverGrupo(lista)} em ${cont.nome}`, alvos: [id, ...lista], propriedades: ["*"] },
      d => { d.elementos[id] = cont; for (const i of lista) d.elementos[i].pai = id; }
    );
    if (r.acao === "aplicado") {
      this.projeto.memoria.aliases[cont.nome.toLowerCase()] = [id];
      this.rebaixarPadroes(id, p => ["tipo", "nome", "x", "y", "z"].includes(p.split(".")[0]));
      this.selecionar(id);
    }
    return id;
  }

  /** Desfaz o agrupamento: os filhos ficam onde estão e o container sai. */
  desagrupar(id) {
    const c = this.elemento(id);
    if (c?.tipo !== "container") return;
    if (c.codigo && Object.values(c.codigo).some(Boolean)) throw new Error("Este grupo tem código próprio. Exporte ou transfira esse código antes de desagrupar.");
    if (this.elementos().some(e => (e.eventos ?? []).some(ev => ev.alvo === id)) || (c.eventos ?? []).length)
      throw new Error("Este grupo participa de comportamentos. Ajuste os vínculos na aba Comportamento antes de desagrupar.");
    const filhos = this.filhos(id);
    const r = this.comando(
      { texto: `Desagrupar ${c.nome}`, alvos: [id, ...filhos], propriedades: ["*"], tipo: "remover" },
      d => { for (const f of filhos) { if (c.pai) d.elementos[f].pai = c.pai; else delete d.elementos[f].pai; } delete d.elementos[id]; }
    );
    if (r.acao === "aplicado") this.selecionarVarios(filhos);
    return filhos;
  }

  // ----------------------------------------------------------
  // Containers conceituais: reconhecer, contrato, vínculos
  // ----------------------------------------------------------
  /** Propostas do classificador para os elementos (padrão: a seleção). Não muda nada. */
  reconhecerComponentes(ids = this.selecionados()) {
    const lista = ids.flatMap(id => this.comDescendentes([id])).filter((v, i, a) => a.indexOf(v) === i);
    return classificar(lista.map(id => ({ id, ...this.elemento(id) })), this.tela);
  }

  /**
   * Aceita uma proposta: vários elementos viram um grupo com tipo conceitual fixo (semantica.tipo);
   * um elemento só ganha o tipo conceitual. Um passo desfazível.
   */
  aplicarReconhecimento(proposta) {
    const def = TIPOS_RECONHECIDOS[proposta?.tipo];
    if (!def) throw new Error(`tipo reconhecido desconhecido: ${proposta?.tipo}`);
    const semantica = { tipo: proposta.tipo, confianca: proposta.confianca, origem: "classificador", motivos: proposta.motivos };
    const ids = proposta.ids.filter(id => this.elemento(id));
    if (ids.length === 1) {
      this.definir(ids[0], { semantica }, `Reconhecer ${this.rotulo(ids[0])} como ${def.nome}`);
      return ids[0];
    }
    let k = 1;
    while (this.elementos().some(e => e.nome === `${def.nome} ${k}`)) k++;
    return this.agruparEmContainer(ids, "livre", { nome: `${def.nome} ${k}`, semantica });
  }

  /** Migração explícita do tipo conceitual (o tipo é fixo sem ela). */
  migrarTipoSemantico(id, novoTipo, motivo = "") {
    const el = this.elemento(id);
    if (!el) throw new Error(`elemento não encontrado: ${id}`);
    const patch = migrarTipo(el, novoTipo, { confirmado: true, motivo });
    if (!Object.keys(patch).length) return null;
    return this.definir(id, patch, `Migrar ${el.nome} de ${el.semantica?.tipo ?? el.tipo} para ${novoTipo}`);
  }

  /** Avisos do contrato para uma geometria proposta (o painel avisa antes de aplicar). */
  limitesViolados(id, geo) { const el = this.elemento(id); return el ? verificarLimites(el, { ...el, ...geo }) : []; }

  /** Liga um evento do elemento a uma ferramenta do armazém, por referência versionada. Um passo. */
  vincular(id, { evento = "onClick", ref, args = {} }) {
    const el = this.elemento(id);
    if (!el) throw new Error(`elemento não encontrado: ${id}`);
    const v = novoVinculo(el, { evento, ref, args });
    return this.comando(
      { texto: `Vincular ${el.nome} a ${v.ref}`, alvos: [id], propriedades: ["vinculos", "eventos"] },
      d => { const e = d.elementos[id]; e.vinculos = [...(e.vinculos ?? []), v]; e.eventos = [...(e.eventos ?? []), eventoDoVinculo(v)]; }
    );
  }

  desvincular(id, vinculoId) {
    const el = this.elemento(id);
    const v = el?.vinculos?.find(x => x.id === vinculoId);
    if (!v) return null;
    return this.comando(
      { texto: `Desvincular ${el.nome} de ${v.ref}`, alvos: [id], propriedades: ["vinculos", "eventos"], tipo: "remover" },
      d => { const e = d.elementos[id]; e.vinculos = e.vinculos.filter(x => x.id !== vinculoId); e.eventos = (e.eventos ?? []).filter(x => x.vinculoId !== vinculoId); }
    );
  }

  /** Marca como implícitas (escolha do sistema) as decisões do alvo que o usuário não escolheu. */
  rebaixarPadroes(id, foiEscolhido, fechar = true) {
    this.rebaixarPadroesVarios([id], foiEscolhido, fechar);
  }

  /** Um percurso e uma cópia da memória para toda a inserção. */
  rebaixarPadroesVarios(ids, foiEscolhido, fechar = true) {
    const p = this.projeto, alvos = new Set(ids);
    for (const d of p.memoria.decisoes) {
      if (alvos.has(d.alvo) && d.status === "protegida" && !foiEscolhido(d.propriedade)) {
        d.status = "implicita"; d.origem = "agente";
      }
    }
    if (!fechar) return;
    const ultimo = p.historico[p.cursor - 1];
    if (ultimo) ultimo.memDepois = clonar(p.memoria.decisoes);
  }

  /** Muda propriedades de um elemento (ou da tela, id "__canvas"). */
  definir(id, valores, texto) {
    const props = Object.keys(valores);
    if (!props.length) return;
    if (this.elemento(id)?.tipo === 'container' && ('x' in valores || 'y' in valores || (this.elemento(id).grupo && ('largura' in valores || 'altura' in valores))))
      return this.definirVarios({[id]:valores}, texto ?? `Mover ${this.rotulo(id)}`);
    return this.comando(
      { texto: texto ?? `Alterar ${props.join(", ")} de ${this.rotulo(id)}`, alvos: [id], propriedades: props },
      d => { for (const [c, v] of Object.entries(valores)) definirCaminho(d.elementos[id], c, v); }
    );
  }

  mover(id, x, y) {
    return this.definir(id, { x: Math.round(x), y: Math.round(y) }, `Mover ${this.rotulo(id)}`);
  }

  geometria(id, g, texto) {
    const v = {};
    for (const k of ["x", "y", "largura", "altura"]) if (g[k] !== undefined) v[k] = Math.round(g[k]);
    const el = this.elemento(id);
    if (el?.tipo === "container" && el.layout?.modo !== "livre" && el.layout?.abracar !== false && (v.largura !== undefined || v.altura !== undefined)) v["layout.abracar"] = false;
    if (el?.grupo) return this.definirVarios({[id]:v},texto ?? `Transformar ${this.rotulo(id)}`);
    if (el?.tipo === "container" && (v.x !== undefined || v.y !== undefined)) {
      const dx = (v.x ?? el.x) - el.x;
      const dy = (v.y ?? el.y) - el.y;
      const descs = this.comDescendentes([id]).filter(d => d !== id);
      if (descs.length && (dx || dy)) {
        const mapa = { [id]: v };
        for (const d of descs) { const e = this.elemento(d); mapa[d] = { x: e.x + dx, y: e.y + dy }; }
        return this.definirVarios(mapa, texto ?? `Mover ${this.rotulo(id)}`);
      }
    }
    return this.definir(id, v, texto ?? `Redimensionar ${this.rotulo(id)}`);
  }

  remover(id) {
    return this.removerVarios([id]);
  }

  duplicar(id) {
    if (!this.elemento(id)) return;
    return this.duplicarVarios([id])[0];
  }

  camada(id, direcao) {
    const els = this.elementos();
    const zs = els.map(e => e.z ?? 0);
    const z = direcao === "frente" ? Math.max(...zs) + 1 : Math.min(...zs) - 1;
    return this.definir(id, { z }, direcao === "frente" ? `Trazer ${this.rotulo(id)} para a frente` : `Enviar ${this.rotulo(id)} para trás`);
  }

  alinhar(id, modo) {
    const el = this.elemento(id);
    if (!el) return;
    const t = this.tela;
    const pos = {
      esquerda: { x: 0 }, centroH: { x: (t.largura - el.largura) / 2 }, direita: { x: t.largura - el.largura },
      topo: { y: 0 }, centroV: { y: (t.altura - el.altura) / 2 }, base: { y: t.altura - el.altura },
    }[modo];
    const nomes = { esquerda: "à esquerda", centroH: "ao centro", direita: "à direita", topo: "ao topo", centroV: "ao meio", base: "à base" };
    return this.geometria(id, pos, `Alinhar ${this.rotulo(id)} ${nomes[modo]}`);
  }

  /** Pedido amplo: aplica a cor/estilo em todos; decisões protegidas viram pergunta. */
  aplicarEmTodos(propriedades, fn, texto, fnTela) {
    return this.comando({ texto, amplo: true, propriedades }, d => {
      for (const [id, el] of Object.entries(d.elementos)) {
        if (!id.startsWith("__")) fn(el);
        else if (id === "__canvas" && fnTela) fnTela(el);
      }
    });
  }

  pendenteCompleto() { return this.projeto.pendente ?? null; }

  /** "Cartão (fundo, borda); Título (cor do texto)" a partir de itens { alvo, propriedade }. */
  descrever(itens) {
    const NOMES = {
      "estilo.fundo": "fundo", "estilo.cor": "cor do texto", "estilo.borda": "borda", "estilo.raio": "raio",
      "estilo.tamanhoFonte": "tamanho da fonte", "estilo.peso": "peso da fonte", "estilo.sombra": "sombra",
      "estilo.opacidade": "opacidade", "estilo.larguraBorda": "largura da borda", fundo: "fundo",
      x: "posição", y: "posição", largura: "largura", altura: "altura",
    };
    const porAlvo = new Map();
    for (const { alvo, propriedade } of itens) {
      const nome = NOMES[propriedade] ?? propriedade.split(".").at(-1);
      if (!porAlvo.has(alvo)) porAlvo.set(alvo, new Set());
      porAlvo.get(alvo).add(nome);
    }
    return [...porAlvo].map(([a, ps]) => `${a === "__canvas" ? "Tela" : this.rotulo(a)} (${[...ps].join(", ")})`).join("; ");
  }

  // ----------------------------------------------------------
  // Conversa com o agente (guardada no documento, em __conversa)
  // ----------------------------------------------------------
  conversa() {
    return this.doc.elementos.__conversa?.mensagens ?? [];
  }

  /** Acrescenta uma mensagem direto no documento (fora da skill: não é decisão de design). */
  anotar(papel, texto, extra = {}) {
    const els = this.doc.elementos;
    els.__conversa ??= { mensagens: [] };
    els.__conversa.mensagens.push({ papel, texto, quando: new Date().toISOString(), ...extra });
    this.emitir("conversa");
  }

  /**
   * Um turno do agente: tudo o que acontecer dentro de `fn` (comandos e mensagens)
   * vira UM evento no histórico. Um Ctrl+Z desfaz o turno inteiro, conversa incluída.
   */
  async turno(texto, fn) {
    const p = this.projeto;
    const c0 = p.cursor;
    const futuro = c0 < p.historico.length ? p.historico.slice() : null; // vira variação, não se perde
    const docAntes = clonar(p.doc);
    const memAntes = clonar(p.memoria.decisoes);
    this.emTurno = true;
    try {
      return await fn();
    } finally {
      this.emTurno = false;
      // descarta os eventos individuais do turno e grava um só
      p.historico = p.historico.slice(0, c0);
      p.cursor = c0;
      if (futuro) p.guardarRamo(undefined, futuro);
      p.gravar({
        id: p.novoEventoId(),
        pedido: `Agente: ${texto}`,
        docAntes,
        docDepois: clonar(p.doc),
        memAntes,
        memDepois: clonar(p.memoria.decisoes),
      });
      this.sujo = true;
      this.limparSelecaoOrfa();
      this.autosalvar();
      this.emitir("documento");
    }
  }

  // ----------------------------------------------------------
  // Seleção (um ou vários)
  // ----------------------------------------------------------
  /** Ids selecionados (o principal é o último). */
  selecionados() {
    const ids = this.multi.length ? this.multi : this.selecao ? [this.selecao] : [];
    return ids.filter(id => this.elemento(id) && !id.startsWith("__"));
  }

  selecionar(id, { somar = false } = {}) {
    if (somar && id) {
      const set = new Set(this.selecionados());
      set.has(id) ? set.delete(id) : set.add(id);
      return this.selecionarVarios([...set]);
    }
    this.selecao = id && this.elemento(id) ? id : null;
    this.multi = [];
    this.emitir("selecao");
  }

  selecionarVarios(ids) {
    const ok = [...new Set(ids)].filter(id => this.elemento(id) && !id.startsWith("__"));
    this.selecao = ok.at(-1) ?? null;
    this.multi = ok.length > 1 ? ok : [];
    this.emitir("selecao");
  }

  selecionarTudo() {
    this.selecionarVarios(this.elementos().filter(e => podeSelecionar(e, this.doc.elementos) && e.tipo !== "container").map(e => e.id));
  }

  /** Seleciona os elementos com o mesmo tipo ou a mesma cor de fundo do selecionado. */
  selecionarMesmo(criterio) {
    const base = this.selecionado();
    if (!base) return;
    const iguais = this.elementos().filter(e => podeSelecionar(e, this.doc.elementos) && (criterio === "tipo" ? e.tipo === base.tipo : e.estilo?.fundo === base.estilo?.fundo));
    this.selecionarVarios(iguais.map(e => e.id));
  }

  /** Seleciona tudo o que NÃO está selecionado (ignora travados). */
  inverterSelecao() {
    const atuais = new Set(this.selecionados());
    this.selecionarVarios(this.elementos().filter(e => podeSelecionar(e, this.doc.elementos) && e.tipo !== "container" && !atuais.has(e.id)).map(e => e.id));
  }
  /** Seleciona todos os descendentes dos selecionados (o conteúdo de um container). */
  selecionarFilhos() {
    const raizes = new Set(this.selecionados()); if (!raizes.size) return;
    const todos = this.elementos(), dentro = new Set(raizes);
    for (let mudou = true; mudou;) { mudou = false; for (const e of todos) if (e.pai && dentro.has(e.pai) && !dentro.has(e.id)) { dentro.add(e.id); mudou = true; } }
    this.selecionarVarios(todos.filter(e => dentro.has(e.id) && !raizes.has(e.id) && !e.travado).map(e => e.id));
  }
  /** Sobe um nível: seleciona o container que contém o selecionado. */
  selecionarPai() {
    const pais = [...new Set(this.selecionados().map(id => this.elemento(id)?.pai).filter(id => id && this.elemento(id)))];
    if (pais.length) this.selecionarVarios(pais);
  }
  /** Seleciona todas as peças geradas pelo mesmo item do formulário (menu, faixa, componente…). */
  selecionarDoFormulario() {
    const base = this.selecionado(); if (!base?.construtor) return;
    this.selecionarVarios(this.elementos().filter(e => e.construtor === base.construtor && !e.travado).map(e => e.id));
  }

  limparSelecaoOrfa() {
    this.multi = this.multi.filter(id => this.elemento(id));
    if (this.multi.length < 2) this.multi = [];
    if (this.selecao && !this.elemento(this.selecao)) this.selecao = this.multi.at(-1) ?? null;
  }

  /** Retângulo que envolve os elementos. */
  limites(ids = this.selecionados()) {
    const els = ids.map(id => this.elemento(id)).filter(Boolean);
    if (!els.length) return null;
    const x = Math.min(...els.map(e => e.x));
    const y = Math.min(...els.map(e => e.y));
    return { x, y, largura: Math.max(...els.map(e => e.x + e.largura)) - x, altura: Math.max(...els.map(e => e.y + e.altura)) - y };
  }

  // ----------------------------------------------------------
  // Operações em grupo: sempre UM comando (um evento, um desfazer)
  // ----------------------------------------------------------
  /** mapa = { id: { caminho: valor } } */
  definirVarios(mapa, texto) {
    mapa = Object.fromEntries(Object.entries(mapa).map(([id,v]) => [id,{...v}]));
    // Coordenadas do documento são absolutas. Expande movimentos sem duplicar
    // as posições já calculadas pelo arraste, layout ou geometria.
    for (const [id,v] of Object.entries(mapa)) {
      const e = this.elemento(id);
      if (e?.tipo !== 'container' || (!('x' in v) && !('y' in v) && !(e.grupo && ('largura' in v || 'altura' in v)))) continue;
      const dx = (v.x ?? e.x) - e.x, dy = (v.y ?? e.y) - e.y;
      const sx=e.grupo&&e.layout?.modo==='livre'&&e.largura>0 ? (v.largura??e.largura)/e.largura : 1;
      const sy=e.grupo&&e.layout?.modo==='livre'&&e.altura>0 ? (v.altura??e.altura)/e.altura : 1;
      for (const filho of this.comDescendentes([id]).filter(f => f !== id)) {
        const f = this.elemento(filho);
        mapa[filho] = {x:e.x+dx+(f.x-e.x)*sx,y:e.y+dy+(f.y-e.y)*sy,...(sx!==1?{largura:f.largura*sx}:{}),...(sy!==1?{altura:f.altura*sy}:{}),...mapa[filho]};
      }
    }
    const ids = Object.keys(mapa).filter(id => this.elemento(id));
    if (!ids.length) return;
    const props = [...new Set(ids.flatMap(id => Object.keys(mapa[id])))];
    return this.comando({ texto, alvos: ids, propriedades: props }, d => {
      for (const id of ids) for (const [c, v] of Object.entries(mapa[id])) definirCaminho(d.elementos[id], c, v);
    });
  }

  /** Aplica um efeito de botão (relevo, 3D, neon…) aos selecionados, partindo da cor de fundo de cada um. */
  aplicarEfeitoBotao(efeito, acento) {
    const ids = this.selecionados().filter(id => ["botao", "caixa", "container", "forma", "elipse"].includes(this.elemento(id)?.tipo));
    if (!ids.length) return { acao: "ignorado", motivo: "Selecione um botão, caixa ou container." };
    const nome = EFEITOS_BOTAO.find(e => e.id === efeito)?.nome ?? efeito;
    const mapa = {};
    for (const id of ids) {
      const e = this.elemento(id), f = e.estilo?.fundo;
      const base = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(f ?? "") ? f.slice(0, 7) : (acento ?? "#2563eb");
      mapa[id] = propsEfeitoBotao(efeito, base, acento ?? base);
    }
    return this.definirVarios(mapa, `Efeito de botão “${nome}” em ${this.descreverGrupo(ids)}`);
  }

  /** O mesmo valor em todos os selecionados. */
  definirNosSelecionados(valores, texto) {
    const ids = this.selecionados();
    return this.definirVarios(Object.fromEntries(ids.map(id => [id, valores])), texto ?? `Alterar ${Object.keys(valores).join(", ")} em ${this.descreverGrupo(ids)}`);
  }

  descreverGrupo(ids) {
    return ids.length === 1 ? this.rotulo(ids[0]) : `${ids.length} elementos`;
  }

  moverVarios(ids, dx, dy, texto) {
    const livres = this.comDescendentes(ids.filter(id => !this.elemento(id)?.travado));
    return this.definirVarios(
      Object.fromEntries(livres.map(id => { const e = this.elemento(id); return [id, { x: Math.round(e.x + dx), y: Math.round(e.y + dy) }]; })),
      texto ?? `Mover ${this.descreverGrupo(livres)}`
    );
  }

  /** Com um elemento, alinha à tela; com vários, alinha entre si. */
  alinharVarios(ids, modo) {
    if (ids.length === 1) return this.alinhar(ids[0], modo);
    const b = this.limites(ids);
    const nomes = { esquerda: "à esquerda", centroH: "ao centro", direita: "à direita", topo: "ao topo", centroV: "ao meio", base: "à base" };
    const mapa = {};
    for (const id of ids) {
      const e = this.elemento(id);
      if (e.travado) continue;
      mapa[id] = {
        esquerda: { x: b.x }, centroH: { x: Math.round(b.x + (b.largura - e.largura) / 2) }, direita: { x: b.x + b.largura - e.largura },
        topo: { y: b.y }, centroV: { y: Math.round(b.y + (b.altura - e.altura) / 2) }, base: { y: b.y + b.altura - e.altura },
      }[modo];
    }
    return this.definirVarios(mapa, `Alinhar ${ids.length} elementos ${nomes[modo]}`);
  }

  /** Espaçamento igual entre 3 ou mais elementos. eixo: "h" | "v". */
  distribuir(ids, eixo) {
    if (ids.length < 3) return;
    const pos = eixo === "h" ? "x" : "y";
    const tam = eixo === "h" ? "largura" : "altura";
    const els = ids.map(id => ({ id, ...this.elemento(id) })).sort((a, b) => a[pos] - b[pos]);
    const inicio = els[0][pos];
    const fim = els.at(-1)[pos] + els.at(-1)[tam];
    const vao = (fim - inicio - els.reduce((s, e) => s + e[tam], 0)) / (els.length - 1);
    let cursor = inicio;
    const mapa = {};
    for (const e of els) {
      mapa[e.id] = { [pos]: Math.round(cursor) };
      cursor += e[tam] + vao;
    }
    return this.definirVarios(mapa, `Distribuir ${ids.length} elementos na ${eixo === "h" ? "horizontal" : "vertical"}`);
  }

  girar(ids, graus) {
    const norm = g => { let r = ((g % 360) + 360) % 360; if (r > 180) r -= 360; return Math.round(r); };
    return this.definirVarios(
      Object.fromEntries(ids.map(id => [id, { rotacao: norm((this.elemento(id).rotacao ?? 0) + graus) }])),
      `Girar ${this.descreverGrupo(ids)} ${graus > 0 ? "+" : ""}${graus}°`
    );
  }

  definirRotacao(ids, graus) {
    return this.definirVarios(Object.fromEntries(ids.map(id => [id, { rotacao: Math.round(graus) }])), `Rotação ${Math.round(graus)}° em ${this.descreverGrupo(ids)}`);
  }

  espelhar(ids, eixo) {
    const c = eixo === "H" ? "espelharH" : "espelharV";
    return this.definirVarios(
      Object.fromEntries(ids.map(id => [id, { [c]: !this.elemento(id)[c] }])),
      `Espelhar ${this.descreverGrupo(ids)} na ${eixo === "H" ? "horizontal" : "vertical"}`
    );
  }

  camadaVarios(ids, direcao) {
    const todos = this.elementos();
    const zs = todos.map(e => e.z ?? 0);
    const ordem = ids.map(id => ({ id, z: this.elemento(id).z ?? 0 })).sort((a, b) => a.z - b.z);
    const base = direcao === "frente" ? Math.max(...zs) + 1 : Math.min(...zs) - ordem.length;
    return this.definirVarios(Object.fromEntries(ordem.map((o, i) => [o.id, { z: base + i }])),
      `${direcao === "frente" ? "Trazer para a frente" : "Enviar para trás"}: ${this.descreverGrupo(ids)}`);
  }

  removerVarios(ids) {
    ids = this.comDescendentes(ids);
    const afetados = this.elementos().filter(e => !ids.includes(e.id) && (e.eventos ?? []).some(ev => ids.includes(ev.alvo))).map(e => e.id);
    return this.comando(
      { texto: ids.length === 1 ? `Remover ${this.rotulo(ids[0])}` : `Remover ${ids.length} elementos`, alvos: [...ids, ...afetados], propriedades: ["eventos"], tipo: "remover" },
      d => {
        for (const id of ids) delete d.elementos[id];
        for (const id of afetados) for (const ev of d.elementos[id].eventos) if (ids.includes(ev.alvo)) ev.suspenso = true;
      }
    );
  }

  /** Duplica vários num comando só e seleciona as cópias. */
  duplicarVarios(ids, desloc = 16) {
    const originais = ids;
    ids = this.comDescendentes(ids);
    const zMax = Math.max(0, ...this.elementos().map(e => e.z ?? 0));
    const novos = [];
    const reservados = new Set();
    const mapaIds = {};
    for (const [i, id] of ids.entries()) {
      const el = this.elemento(id);
      let n = 1;
      while (this.doc.elementos[`${el.tipo}_${n}`] || reservados.has(`${el.tipo}_${n}`)) n++;
      const novo = `${el.tipo}_${n}`;
      reservados.add(novo);
      mapaIds[id] = novo;
      const copia = { ...clonar(el), nome: `${el.nome} (cópia)`, x: el.x + desloc, y: el.y + desloc, z: zMax + 1 + i };
      novos.push([novo, copia]);
    }
    for (const [, c] of novos) if (c.pai && mapaIds[c.pai]) c.pai = mapaIds[c.pai];
    const r = this.comando(
      { texto: `Duplicar ${this.descreverGrupo(ids)}`, alvos: novos.map(([id]) => id), propriedades: ["*"] },
      d => { for (const [id, el] of novos) d.elementos[id] = el; }
    );
    const principais = originais.map(id => mapaIds[id]).filter(Boolean);
    if (r.acao === "aplicado") this.selecionarVarios(principais);
    return principais;
  }

  // ----------------------------------------------------------
  // Modelos (biblioteca): inserir um conjunto pronto num evento só
  // ----------------------------------------------------------
  /** Insere um modelo com o canto em (x, y) — ou centralizado — e seleciona tudo. */
  /** Modelo de rádios: mantém os ids (a lógica depende deles) e grava o complemento de execução na tela. */
  inserirRadio() {
    const ja = Object.keys(RADIO.elementos).filter(id => this.doc.elementos[id]);
    if (ja.length) throw new Error(`O controlador de rádios usa ids fixos e já existe elemento com ${ja.slice(0, 3).join(", ")}. Use uma tela nova ou renomeie.`);
    const vazio = Object.keys(this.doc.elementos).filter(k => k !== "__canvas").length === 0;
    const zMax = Math.max(0, ...this.elementos().map(e => e.z ?? 0));
    const r = this.comando({ texto: "Inserir modelo Controlador de rádios", alvos: ["__canvas", ...Object.keys(RADIO.elementos)], propriedades: ["*"] }, d => {
      Object.entries(RADIO.elementos).forEach(([id, el], i) => { d.elementos[id] = { ...clonar(el), id, z: zMax + 1 + i }; });
      const t = d.elementos.__canvas;
      t.complemento = clonar(RADIO.complemento);
      t.responsivo = true;
      t.largura = Math.max(t.largura, RADIO.tela.largura); t.altura = Math.max(t.altura, RADIO.tela.altura);
      if (vazio) t.fundo = RADIO.tela.fundo;
    });
    void r;
    return Object.keys(RADIO.elementos);
  }

  inserirModelo(modelo, x, y) {
    // faixas prontas viram faixas REAIS do formulário (abas que trocam, sinais, tudo editável)
    if (FAIXAS_PRONTAS[modelo.id]) {
      const atual = this.construtor(), seq = atual.seq + 1, f = faixaPronta(modelo.id, seq);
      this.atualizarConstrutor(spec => { spec.seq = seq; spec.itens.push(f); }, `Modelo ${modelo.nome} inserido como faixa do formulário`, f.id);
      const ids = this.elementos().filter(e => e.construtor === f.id).map(e => e.id);
      return ids;
    }
    if (modelo.id === "radioControlador") return this.inserirRadio();
    const itens = elementosDoModelo(modelo);
    const zMax = Math.max(0, ...this.elementos().map(e => e.z ?? 0));
    const ox = Math.round(x ?? Math.max(0, (this.tela.largura - modelo.largura) / 2));
    const oy = Math.round(y ?? Math.max(0, (this.tela.altura - modelo.altura) / 2));
    const reservados = new Set();
    const proximos = {};
    const mapa = {};
    const novos = itens.map(({ ref, el }, i) => {
      let k = proximos[el.tipo] ?? 1;
      while (this.doc.elementos[`${el.tipo}_${k}`] || reservados.has(`${el.tipo}_${k}`)) k++;
      const id = `${el.tipo}_${k}`;
      reservados.add(id); proximos[el.tipo] = k + 1;
      mapa[ref] = id;
      return [id, { ...el, nome: el.nome ?? `${CATALOGO[el.tipo]?.nome ?? "Elemento"} ${k}`, x: el.x + ox, y: el.y + oy, z: zMax + 1 + i }];
    });
    // eventos e containers entre peças do mesmo modelo continuam ligados; para fora do modelo, não
    for (const [, el] of novos) {
      if (el.pai) { if (mapa[el.pai]) el.pai = mapa[el.pai]; else delete el.pai; }
      el.eventos = (el.eventos ?? []).map(ev => ({ ...ev, alvo: ev.alvo ? mapa[ev.alvo] ?? "" : "" }));
    }
    const ids = novos.map(([id]) => id);
    const r = this.comando(
      { texto: `Inserir modelo ${modelo.nome}`, alvos: ids, propriedades: ["*"] },
      d => { for (const [id, el] of novos) d.elementos[id] = el; }
    );
    if (r.acao === "aplicado") {
      for (const [id, el] of novos) {
        this.projeto.memoria.aliases[el.nome.toLowerCase()] = [id];
        // escolha do usuário: o modelo e onde ele ficou; o desenho das peças é ponto de partida
      }
      this.rebaixarPadroesVarios(ids, p => ["tipo", "nome", "x", "y", "z"].includes(p.split(".")[0]));
      // seleciona só as peças de topo: mover o container leva os filhos junto
      const topo = novos.filter(([, el]) => !el.pai || !ids.includes(el.pai));
      const abertas = topo.filter(([, el]) => !el.abertura?.iniciaFechado && el.visivel !== false); // gaveta/menu que começa fechado não é o que se vê ao inserir
      this.selecionarVarios((abertas.length ? abertas : topo).map(([id]) => id));
    }
    return ids;
  }

  /** Uma forma com ícone vira um grupo clicável, num único passo desfazível. */
  adicionarIconeNaForma(id, simbolo) {
    const forma = this.elemento(id);
    if (!forma || !["forma", "caixa", "elipse", "botao"].includes(forma.tipo)) return null;
    const grupoId = this.novoId("container").id, iconeId = this.novoId("icone").id;
    const def = CATALOGO.container.padrao(), pad = CATALOGO.icone.padrao();
    const tamanho = Math.max(8, Math.min(24, forma.largura * .45, forma.altura * .65));
    const grupo = { ...def, tipo: "container", grupo: true, nome: `Botão com ícone · ${forma.nome}`,
      x: forma.x, y: forma.y, largura: forma.largura, altura: forma.altura, z: forma.z,
      layout: { ...def.layout, modo: "livre", abracar: false, margem: 0 },
      estilo: { ...def.estilo, fundo: "transparent", borda: "transparent", larguraBorda: 0 },
      eventos: clonar(forma.eventos ?? []), acessibilidade: { ...forma.acessibilidade, role: "button", ariaLabel: forma.rotulo || forma.texto || forma.nome },
      ...(forma.pai ? { pai: forma.pai } : {}) };
    for (const k of ["rotacao", "abertura", "controlador"]) if (forma[k] !== undefined) grupo[k] = clonar(forma[k]);
    const temTexto = !!(forma.rotulo || forma.texto);
    const ic = { ...pad, tipo: "icone", nome: "Ícone do botão", simbolo, pai: grupoId,
      x: temTexto ? forma.x + 8 : forma.x + (forma.largura - tamanho) / 2,
      y: forma.y + (forma.altura - tamanho) / 2, largura: tamanho, altura: tamanho, z: (forma.z ?? 0) + .1,
      estilo: { ...pad.estilo, cor: forma.estilo?.cor ?? "#ffffff" }, acessibilidade: { ...pad.acessibilidade, ariaLabel: "", role: "presentation" } };
    const textoId = temTexto ? this.novoId("texto").id : null;
    const alvos = [id, grupoId, iconeId, ...(textoId ? [textoId] : [])];
    const r = this.comando({ texto: `Adicionar ícone a ${forma.nome}`, alvos, propriedades: ["*"] }, d => {
      d.elementos[grupoId] = grupo; d.elementos[iconeId] = ic;
      if (textoId) d.elementos[textoId] = { ...CATALOGO.texto.padrao(), tipo: "texto", nome: "Rótulo do botão", pai: grupoId,
        texto: forma.rotulo || forma.texto, x: forma.x + tamanho + 18, y: forma.y,
        largura: Math.max(8, forma.largura - tamanho - 24), altura: forma.altura, z: (forma.z ?? 0) + .2,
        estilo: { ...CATALOGO.texto.padrao().estilo, ...forma.estilo, fundo: "transparent", borda: "transparent", larguraBorda: 0, sombra: "nenhuma", raio: 0 } };
      const fundo = d.elementos[id]; if (textoId) { fundo.rotulo = ""; fundo.texto = ""; }
      fundo.pai = grupoId; fundo.eventos = []; fundo.rotacao = 0;
      delete fundo.abertura;
    });
    if (r.acao === "aplicado") {
      this.rebaixarPadroesVarios([grupoId, iconeId, ...(textoId ? [textoId] : [])], p => ["tipo", "nome", "x", "y", "z", "simbolo", "pai"].includes(p.split(".")[0]));
      this.selecionar(grupoId); return grupoId;
    }
    return null;
  }

  /** Monta um modelo a partir dos elementos indicados (posições relativas ao canto do grupo). */
  modeloDaSelecao(ids, nome) {
    ids = this.comDescendentes(ids);
    const b = this.limites(ids);
    if (!b) return null;
    const ordem = ids.map(id => ({ id, el: this.elemento(id) })).filter(o => o.el).sort((a, c) => (a.el.z ?? 0) - (c.el.z ?? 0));
    return {
      id: `u_${Date.now().toString(36)}`, nome: nome || "Meu modelo", cat: "Meus modelos", usuario: true,
      desc: `${ordem.length} elemento${ordem.length > 1 ? "s" : ""}`, largura: b.largura, altura: b.altura,
      elementos: ordem.map(({ id, el }) => {
        const c = clonar(el);
        delete c.z;
        c.x -= b.x;
        c.y -= b.y;
        if (c.pai && !ids.includes(c.pai)) delete c.pai;
        return { ref: id, el: c };
      }),
    };
  }

  // ----------------------------------------------------------
  // Guias (ficam na tela, desfazíveis como qualquer mudança)
  // ----------------------------------------------------------
  guias() {
    const g = this.tela.guias ?? {};
    return { v: [...(g.v ?? [])], h: [...(g.h ?? [])] };
  }
  adicionarGuia(eixo, pos) {
    const g = this.guias();
    g[eixo].push(Math.round(pos));
    return this.definir("__canvas", { guias: g }, `Nova guia ${eixo === "v" ? "vertical" : "horizontal"} em ${Math.round(pos)}`);
  }
  moverGuia(eixo, i, pos) {
    const g = this.guias();
    g[eixo][i] = Math.round(pos);
    return this.definir("__canvas", { guias: g }, `Mover guia para ${Math.round(pos)}`);
  }
  removerGuia(eixo, i) {
    const g = this.guias();
    g[eixo].splice(i, 1);
    return this.definir("__canvas", { guias: g }, "Remover guia");
  }
  limparGuias() {
    return this.definir("__canvas", { guias: { v: [], h: [] } }, "Limpar guias");
  }

  // ----------------------------------------------------------
  // Histórico
  // ----------------------------------------------------------
  desfazer() {
    if (this.emTurno || !this.projeto.desfazer()) return false;
    this.posNavegar();
    return true;
  }
  refazer() {
    if (this.emTurno || !this.projeto.refazer()) return false;
    this.posNavegar();
    return true;
  }
  // ---------------------------------------------------------- variações (ramificações do histórico)
  ramosSerializados(limite, eventosPrincipais) {
    const p = this.projeto;
    if (limite < 40 || !p.ramos.length) return {};
    const principais = new Set((eventosPrincipais ?? p.historico.slice(Math.max(0, p.historico.length - limite))).map(e => e.id));
    const extras = {};
    const ramos = p.ramos.map(r => {
      const cauda = r.eventos.slice(-limite);
      for (const e of cauda) if (!principais.has(e.id)) extras[e.id] = e;
      return { id: r.id, nome: r.nome, criadoEm: r.criadoEm, ids: cauda.map(e => e.id) };
    });
    return { ramos, eventosRamos: extras };
  }

  /** Variações guardadas (da mais recente para a mais antiga). */
  ramos() {
    return this.projeto.ramos.map(r => ({ id: r.id, nome: r.nome, passos: r.eventos.length, ultimo: r.eventos.at(-1)?.pedido ?? "", criadoEm: r.criadoEm })).reverse();
  }

  /** Guarda o ponto atual como variação para voltar depois (a linha atual continua). */
  guardarVariacao(nome) {
    const p = this.projeto;
    const r = p.guardarRamo(nome, p.historico.slice(0, p.cursor));
    if (r) { this.autosalvar(); this.emitir("historico"); }
    return r?.id ?? null;
  }

  irParaVariacao(id) {
    if (this.emTurno || !this.projeto.trocarRamo(id)) return false;
    this.posNavegar();
    return true;
  }

  removerVariacao(id) { this.projeto.removerRamo(id); this.autosalvar(); this.emitir("historico"); }
  renomearVariacao(id, nome) { this.projeto.renomearRamo(id, nome); this.autosalvar(); this.emitir("historico"); }

  /** O que mudou neste passo do histórico (indice 1..n) ou entre o estado atual e uma variação. */
  mudancasDoPasso(indice) {
    const ev = this.projeto.historico[indice - 1];
    return ev ? diferenca(ev.docAntes, ev.docDepois) : [];
  }
  mudancasContraVariacao(id) {
    const r = this.projeto.ramos.find(x => x.id === id);
    return r ? diferenca(this.projeto.doc, r.eventos.at(-1).docDepois) : [];
  }

  irPara(cursor) {
    while (this.projeto.cursor > cursor && this.projeto.desfazer());
    while (this.projeto.cursor < cursor && this.projeto.refazer());
    this.posNavegar();
  }
  posNavegar() {
    this.projeto.pendente = undefined;
    this.limparSelecaoOrfa();
    this.sujo = true;
    this.autosalvar();
    this.emitir("historico");
  }

  /** Compara o presente com o mesmo ponto que a ferramenta Voltar usa. */
  compararComHistorico(cursor = this.projeto.cursor - 1) {
    const p = this.projeto;
    const destino = Math.max(0, Math.min(Math.trunc(cursor), p.historico.length));
    const referencia = p.historico.length ? p.docEm(p.historico, destino) : p.doc;
    const memoria = p.historico.length ? destino ? p.historico[destino - 1].memDepois : p.historico[0].memAntes : p.memoria.decisoes;
    return { cursor: destino, referencia: clonar(referencia), memoria: clonar(memoria), mudancas: compararEstados(p.doc, referencia) };
  }

  /** Restaura só os campos escolhidos; o restante do trabalho permanece. Um passo de Voltar. */
  recuperarCampos(comparacao, escolhidos = comparacao.mudancas) {
    if (this.emTurno) throw new Error("Aguarde o agente terminar antes de recuperar dados.");
    const antes = clonar(this.doc), depois = clonar(antes), memAntes = clonar(this.projeto.memoria.decisoes);
    for (const m of escolhidos) {
      const base = m.id === "__projeto" ? depois : depois.elementos;
      if (m.campo === "*" && m.id !== "__projeto") {
        if (m.anterior === undefined) delete base[m.id]; else base[m.id] = clonar(m.anterior);
      } else {
        let o = m.id === "__projeto" ? base : base[m.id];
        if (!o) throw new Error("Recupere o objeto completo antes de seus campos.");
        const partes = m.campo.split(".");
        for (const k of partes.slice(0, -1)) o = o[k] ??= {};
        if (m.anterior === undefined) delete o[partes.at(-1)]; else o[partes.at(-1)] = clonar(m.anterior);
      }
    }
    const exame = examinarDocumento(depois);
    if (!exame.valido) throw new Error("A recuperação criaria dados inválidos ou vínculos quebrados. Inclua os objetos e comportamentos dependentes na seleção.");
    if (!compararEstados(antes, depois).length) return false;
    const p = this.projeto;
    p.doc = depois;
    // Atualiza somente as decisões dos campos recuperados; preserva as demais.
    p.memoria.decisoes = p.memoria.decisoes.filter(d => !escolhidos.some(m => m.id === d.alvo && (m.campo === "*" || d.propriedade === m.campo || d.propriedade.startsWith(m.campo + ".") || m.campo.startsWith(d.propriedade + "."))));
    const restauradas = (comparacao.memoria ?? []).filter(d => escolhidos.some(m => m.id === d.alvo && (m.campo === "*" || d.propriedade === m.campo || d.propriedade.startsWith(m.campo + ".") || m.campo.startsWith(d.propriedade + "."))));
    p.memoria.decisoes.push(...clonar(restauradas));
    p.gravar({ id: p.novoEventoId(), pedido: `Recuperar ${escolhidos.length} campo(s) pelo histórico`, docAntes: antes, docDepois: clonar(depois), memAntes, memDepois: clonar(p.memoria.decisoes) });
    this.avisoRecuperacao = "Recuperação aplicada. Voltar desfaz a recuperação e Refazer reaplica.";
    this.posNavegar();
    return true;
  }

  renomearPadronizado(id, nome, manter = false) {
    return this.definir(id, { nome: manter ? String(nome).trim() : normalizarTitulo(nome) }, `Renomear ${this.rotulo(id)}`);
  }

  auditarNomes() {
    return this.elementos().flatMap(el => ["nome", "rotulo"].filter(k => typeof el[k] === "string" && el[k].trim()).flatMap(k => {
      const para = normalizarTitulo(el[k]);
      return para !== el[k] ? [{ id: el.id, campo: k, de: el[k], para }] : [];
    }));
  }

  padronizarNomes(itens = this.auditarNomes()) {
    const mapa = {};
    for (const i of itens) (mapa[i.id] ??= {})[i.campo] = i.para;
    if (itens.length) this.definirVarios(mapa, "Padronizar nomes e rótulos");
    return itens.length;
  }

  // ----------------------------------------------------------
  // Persistência
  // ----------------------------------------------------------
  novo(emitir = true) {
    this.caminhoArquivo = null;
    clearTimeout(this._timer);
    if (emitir) { this.bloquearAutosave = false; this.avisoRecuperacao = null; }
    this.projeto = new Projeto("hefestus", {
      elementos: { __canvas: { nome: "Projeto sem título", largura: 1280, altura: 800, fundo: "#ffffff" } },
    }, aplicarLayouts);
    this.selecao = null;
    this.multi = [];
    this.sujo = false;
    if (emitir) {
      this.autosalvar();
      this.emitir("novo");
    }
  }

  serializar(limite = LIMITE_HISTORICO) {
    const p = this.projeto;
    // Mantém o cursor dentro da janela. Cortar pela cauda perdia o estado de Voltar.
    const corte = limite ? Math.max(0, p.cursor - limite) : p.historico.length;
    const fim = limite ? Math.min(p.historico.length, Math.max(p.cursor, corte + limite)) : corte;
    return {
      formato: "hefestus",
      versao: 1,
      salvoEm: new Date().toISOString(),
      documento: p.doc,
      memoria: { decisoes: p.memoria.decisoes, aliases: p.memoria.aliases },
      perguntasIgnoradas: [...p.perguntasIgnoradas],
      historico: { eventos: p.historico.slice(corte, fim), cursor: Math.max(0, p.cursor - corte) },
      ...this.ramosSerializados(limite, p.historico.slice(corte, fim)),
    };
  }

  /** Projeto sem histórico (leve) + histórico em JSONL de patches compactos. */
  serializarSeparado() {
    const dados = this.serializar(0);
    dados.historico = { eventos: [], cursor: 0 };
    delete dados.ramos; delete dados.eventosRamos;
    return { projeto: dados, historico: exportarHistorico(this.projeto, { projeto: this.nome ?? "" }) };
  }

  /** Reaplica um histórico JSONL ao projeto aberto, se o estado final dele for o mesmo do projeto. */
  abrirHistoricoJSONL(texto) {
    const h = importarHistorico(texto);
    for (const ev of [...h.eventos, ...h.ramos.flatMap(r=>r.eventos)]) { sincronizarObjetosForja(ev.docAntes); sincronizarObjetosForja(ev.docDepois); }
    const ult = h.cursor ? h.eventos[h.cursor - 1].docDepois : h.eventos[0]?.docAntes;
    if (ult && JSON.stringify(ult) !== JSON.stringify(this.projeto.doc)) throw new Error("Este histórico não pertence ao projeto aberto (o estado final é diferente).");
    const p = this.projeto;
    p.historico = h.eventos; p.cursor = h.cursor; p.ramos = h.ramos;
    p.seqRamo = Math.max(0, ...h.ramos.map(r => Number(String(r.id).replace("ramo_", "")) || 0));
    p.seqEvento = Math.max(p.seqEvento ?? 0, ...h.eventos.map(e => Number(String(e.id).replace("evt_", "")) || 0));
    this.emitir?.("historico");
    return { passos: h.eventos.length, variacoes: h.ramos.length };
  }

  exportarProjetoSeparado() {
    const { projeto, historico } = this.serializarSeparado();
    this.baixar(`${this.slug()}-projeto-historico.zip`, criarZIP({[`${this.slug()}.hefestus.json`]:JSON.stringify(projeto),[`${this.slug()}.historico.jsonl`]:historico,...documentosProjeto(this.doc,{projeto})}), "application/zip");
    return { bytesProjeto: JSON.stringify(projeto).length, bytesHistorico: historico.length };
  }

  restaurar(dados) {
    dados = migrarProjeto(dados);
    const eventos = Array.isArray(dados.historico?.eventos) ? dados.historico.eventos : [];
    const cursor = Math.max(0, Math.min(Number.isInteger(dados.historico?.cursor) ? dados.historico.cursor : eventos.length, eventos.length));
    const referencia = ultimoEstadoValido({ historico: eventos, cursor });
    const exame = examinarDocumento(dados.documento, referencia?.doc);
    this.originalRecuperacao = exame.valido ? null : clonar(dados);
    this.relatorioRecuperacao = exame.problemas;
    this.avisoRecuperacao = exame.valido ? null : `${exame.problemas.length} campo(s) recuperado(s). O original está disponível em Histórico e recuperação.`;
    const p = new Projeto("hefestus", exame.doc, aplicarLayouts);
    p.memoria.decisoes = Array.isArray(dados.memoria?.decisoes) ? dados.memoria.decisoes.filter(d => d && typeof d.propriedade === "string" && typeof d.alvo === "string") : [];
    p.memoria.aliases = dados.memoria?.aliases && typeof dados.memoria.aliases === "object" ? dados.memoria.aliases : {};
    // Só estados válidos podem ser acessados por Voltar/Refazer. O arquivo bruto é preservado.
    const integro = ev => { try { return ev && typeof ev.id === "string" && Array.isArray(ev.memAntes) && Array.isArray(ev.memDepois) && examinarDocumento(ev.docAntes).valido && examinarDocumento(ev.docDepois).valido; } catch { return false; } };
    const historicoValido = eventos.every(integro);
    p.historico = historicoValido ? eventos : [];
    p.cursor = historicoValido ? cursor : 0;
    if (!historicoValido) { this.originalRecuperacao = clonar(dados); this.avisoRecuperacao = "O histórico contém estados inválidos e foi isolado. O projeto foi mantido e o original pode ser exportado."; }
    p.perguntasIgnoradas = new Set(Array.isArray(dados.perguntasIgnoradas) ? dados.perguntasIgnoradas : []);
    const tabela = new Map([...p.historico, ...Object.values(dados.eventosRamos ?? {})].map(e => [e.id, e]));
    p.ramos = (Array.isArray(dados.ramos) ? dados.ramos : []).filter(r => Array.isArray(r.ids)).map(r => ({ id: r.id, nome: r.nome, criadoEm: r.criadoEm, eventos: r.ids.map(i => tabela.get(i)).filter(integro) })).filter(r => r.eventos.length);
    p.seqRamo = Math.max(0, ...p.ramos.map(r => Number(String(r.id).replace("ramo_", "")) || 0));
    const maior = (lista, prefixo) => Math.max(0, ...lista.map(x => Number(String(x.id).replace(prefixo, "")) || 0));
    p.seqEvento = maior(p.historico, "evt_");
    p.memoria.seq = maior(p.memoria.decisoes, "dec_");
    // Um histórico desconectado do documento não pode sobrescrever edições silenciosamente.
    if (p.historico.length && compararEstados(p.doc, p.docEm(p.historico, p.cursor)).length) {
      const base = clonar(p.docEm(p.historico, p.cursor));
      p.gravar({ id: p.novoEventoId(), pedido: "Conciliar dados carregados com o histórico", docAntes: base, docDepois: clonar(p.doc), memAntes: clonar(p.memoria.decisoes), memDepois: clonar(p.memoria.decisoes) });
    }
    clearTimeout(this._timer);
    this.projeto = p;
    this.selecao = null;
    this.multi = [];
  }

  carregarLocal() {
    let original;
    for (const chave of [CHAVE, `${CHAVE}.valido`]) {
      try {
        const bruto = localStorage.getItem(chave);
        if (!bruto) continue;
        this.restaurar(JSON.parse(bruto));
        try { const guardado = localStorage.getItem(`${CHAVE}.original`); if (guardado && !this.originalRecuperacao) this.originalRecuperacao = JSON.parse(guardado); } catch {}
        if (original) { this.originalRecuperacao = original; this.avisoRecuperacao = "A cópia principal falhou. Foi aberta a última cópia válida; o original foi preservado."; this.bloquearAutosave = true; }
        return true;
      } catch { try { original ??= localStorage.getItem(chave); } catch {} }
    }
    if (original) { this.originalRecuperacao = original; this.bloquearAutosave = true; this.avisoRecuperacao = "Não foi possível abrir os dados salvos. Eles foram preservados. Exporte o original em Histórico e recuperação."; }
    return false;
  }

  autosalvar() {
    clearTimeout(this._timer);
    if (this.bloquearAutosave) return;
    this._timer = setTimeout(() => this.salvarLocalAgora(), 300);
  }

  salvarLocalAgora() {
      clearTimeout(this._timer);
      if (this.bloquearAutosave) return false;
      if (this.originalRecuperacao) {
        try {
          if (!localStorage.getItem(`${CHAVE}.original`)) localStorage.setItem(`${CHAVE}.original`, JSON.stringify(this.originalRecuperacao));
        } catch { this.erroSalvamento = "Não há espaço para preservar o original. Exporte a recuperação antes de continuar."; this.emitir("persistencia"); return false; }
      }
      if (!examinarDocumento(this.doc).valido) { this.avisoRecuperacao = "Salvamento suspenso: há dados inválidos. A última cópia íntegra foi preservada."; this.emitir("persistencia"); return false; }
      for (const limite of [LIMITE_HISTORICO, 40, 10, 0]) {
        try {
          const anterior = localStorage.getItem(CHAVE);
          // O backup é o estado que estava salvo, nunca uma cópia degradada do presente.
          if (anterior) { try { const d = JSON.parse(anterior); if (examinarDocumento(d.documento).valido) localStorage.setItem(`${CHAVE}.valido`, anterior); } catch {} }
          localStorage.setItem(CHAVE, JSON.stringify(this.serializar(limite)));
          this.erroSalvamento = null;
          return true;
        } catch { /* cota cheia: tenta com menos histórico */ }
      }
      this.erroSalvamento = "Não foi possível salvar no navegador. As alterações estão nesta sessão; exporte o projeto para preservá-las.";
      this.emitir("persistencia");
      return false;
  }

  /**
   * Entrega um arquivo. Na página publicada usa o recurso "downloads" (o visualizador pede
   * confirmação); aberto localmente, usa um link de download comum.
   * Devolve "salvo", "recusado" ou "indisponivel".
   */
  retomarSalvamento() {
    if (this.originalRecuperacao) localStorage.setItem(`${CHAVE}.original`, JSON.stringify(this.originalRecuperacao));
    this.bloquearAutosave = false;
    return this.salvarLocalAgora();
  }

  async baixar(nomeArquivo, conteudo, tipo) {
    this._downloads ??= Promise.resolve(globalThis.claude?.use?.("downloads") ?? null).catch(() => null);
    const dl = await this._downloads;
    if (dl) {
      try {
        await dl.save({ filename: nomeArquivo, data: conteudo });
        return "salvo";
      } catch (e) {
        return e?.code === "declined" ? "recusado" : "indisponivel";
      }
    }
    if (globalThis.claude) return "indisponivel"; // dentro do visualizador sem o recurso: link seria bloqueado
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const a = Object.assign(document.createElement("a"), { href: url, download: nomeArquivo });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "salvo";
  }

  slug() {
    return this.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "projeto";
  }

  /**
   * Salva o projeto. Na janela própria grava o arquivo .hefestus em disco
   * (pergunta onde só na primeira vez ou em "Salvar como"); no navegador, baixa o arquivo.
   */
  async salvarArquivo(comoNovo = false) {
    const texto = textoDoProjeto(this.serializar());
    let r;
    if (emJanelaNativa()) {
      try {
        if (this.caminhoArquivo && !comoNovo) {
          await gravarEm(this.caminhoArquivo, texto);
          r = "salvo";
        } else {
          const caminho = await salvarComDialogo(nomeArquivoProjeto(this.slug()), texto);
          if (caminho) { this.caminhoArquivo = caminho; r = "salvo"; } else r = "recusado";
        }
      } catch (e) {
        console.error("[Hefestus] falha ao gravar o arquivo", e);
        r = "indisponivel";
      }
    } else {
      r = await this.baixar(nomeArquivoProjeto(this.slug()), texto, "application/json");
    }
    if (r === "salvo") {
      this.sujo = false;
      this.emitir("salvo");
    }
    return r;
  }

  /** Nome do arquivo aberto na janela própria (ou null). */
  arquivoAtual() {
    return this.caminhoArquivo ? nomeDoCaminho(this.caminhoArquivo) : null;
  }

  /** Abre um projeto a partir do texto de um arquivo. */
  abrirTexto(texto, caminho = null) {
    this.restaurar(lerProjeto(texto));
    this.caminhoArquivo = caminho;
    this.sujo = false;
    this.autosalvar();
    this.emitir("novo");
  }

  /** Janela própria: mostra o diálogo "Abrir". Devolve false se o usuário cancelar. */
  async abrirNativo() {
    const r = await abrirComDialogo();
    if (!r) return false;
    this.abrirTexto(r.conteudo, r.caminho);
    return true;
  }

  /** Formata a seleção e seus filhos num único evento, incluindo a fonte do formulário. */
  autoformatarArtefato(ids = this.selecionados()) {
    if (!ids.length) return { ok: false, mensagem: "Selecione o menu ou controlador no canvas." };
    const elementos = this.elementos();
    const plano = planoFormatacao(elementos, ids);
    const donos = new Set();
    const escopo = new Set(ids);
    let mudou = true;
    while (mudou) { mudou = false; for (const e of elementos) if (escopo.has(e.pai) && !escopo.has(e.id)) { escopo.add(e.id); mudou = true; } }
    for (const e of elementos) if (escopo.has(e.id) && e.construtor) donos.add(e.construtor);
    const spec = this.construtor();
    const itens = spec.itens.filter(i => donos.has(i.id) && ["ribbon", "menu"].includes(i.tipo));
    const elegiveis = itens.filter(i => !elementos.some(e => e.construtor === i.id && e.travado));
    for (const i of elegiveis) formatarSpec(i);
    const gerados = elegiveis.flatMap(i => gerarItem(i, this.tela));
    const antigos = elementos.filter(e => elegiveis.some(i => i.id === e.construtor));
    const alvos = [...new Set([...Object.keys(plano), ...antigos.map(e => e.id), ...gerados.map(e => e.id), ...(elegiveis.length ? ["__construtor"] : [])])];
    if (!alvos.length) return { ok: false, mensagem: "A seleção não contém controles editáveis compatíveis. Conteúdos HTML incorporados mantêm sua formatação interna." };
    const r = this.comando({ texto: "Autoformatar menu ou controlador", alvos, propriedades: ["*"] }, d => {
      for (const [id, patch] of Object.entries(plano)) for (const [c,v] of Object.entries(patch)) definirCaminho(d.elementos[id],c,v);
      if (elegiveis.length) {
        d.elementos.__construtor = spec;
        const z = new Map(antigos.map(e => [e.id,e.z]));
        for (const e of antigos) delete d.elementos[e.id];
        for (const { id, el } of gerados) d.elementos[id] = { ...el, z: z.get(id) ?? el.z };
      }
    });
    return { ok: r.acao === "aplicado", mensagem: r.acao === "aplicado" ? "Artefato formatado. Ctrl+Z restaura. A exportação usa esta organização." : "A formatação não foi aplicada; verifique as decisões protegidas." };
  }

  /** Problemas de acessibilidade e consistência da interface atual. */
  auditar() {
    return [...auditar(this.elementos(), this.tela), ...auditarContratos(this.elementos()), ...auditarSuperficies(this.doc.elementos.__construtor)];
  }

  /** Aplica as correções automáticas (todas, ou só dos itens passados) num único passo desfazível. */
  corrigirAuditoria(itens = this.auditar()) {
    const mapa = correcoes(itens);
    const n = Object.values(mapa).reduce((s, v) => s + Object.keys(v).length, 0);
    if (!n) return { corrigidos: 0 };
    this.definirVarios(mapa, `Corrigir ${itens.filter(i => i.correcao).length} problema(s) da auditoria`);
    return { corrigidos: itens.filter(i => i.correcao).length, resto: this.auditar() };
  }

  explicarElemento(id) { const el = this.elemento(id); return el ? explicar({ ...el, id }, this.elementos()) : null; }

  documentacao() { return documentar(this.elementos(), this.tela, this.nome || "Interface"); }

  artefato(tipo) { return gerarArtefato(this.doc, tipo); }

  exportarArtefato(tipo) {
    const a = ARTEFATOS[tipo];
    if (!a) throw new Error(`artefato desconhecido: ${tipo}`);
    const nome=`${this.slug()}.${tipo === "tema" ? "tema." : ""}${a.ext}`;
    return this.baixar(`${this.slug()}-${tipo}.zip`,criarZIP({[nome]:this.artefato(tipo),...documentosProjeto(this.doc)}),'application/zip');
  }

  exportarDocumentacao() { return this.baixar(`${this.slug()}-contrato.md`, this.documentacao(), "text/markdown"); }

  exportarHTML() {
    return this.baixar(`${this.slug()}-html.zip`, criarZIP({[`${this.slug()}.html`]:this.html(),...documentosProjeto(this.doc)}), "application/zip");
  }

  /** Pacote .zip com o projeto e a documentação gerada (recurso da linha do trabalho, 0.40). */
  async salvarPacoteDocumentado() {
    const projeto = this.serializar();
    return this.baixar(`${this.slug()}.hefestus.zip`, criarZIP({ [`${this.slug()}.hefestus.json`]: textoDoProjeto(projeto), ...documentosProjeto(this.doc, { projeto }) }), "application/zip");
  }

  async abrirArquivo(arquivo) {
    if(/\.zip$/i.test(arquivo.name||'')) {
      const arquivos=lerZIP(await arquivo.arrayBuffer()),nomes=Object.keys(arquivos).filter(n=>/^[^/]+\.hefestus(\.json)?$/.test(n));
      if(nomes.length!==1)throw new Error('O pacote deve conter um único projeto Hefestus.');
      this.abrirTexto(new TextDecoder('utf-8',{fatal:true}).decode(arquivos[nomes[0]]));
    } else this.abrirTexto(await arquivo.text());
  }
}
export { Nucleo };
