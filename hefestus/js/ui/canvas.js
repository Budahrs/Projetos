import { executarScript, scriptParaRuntime, alvosDoScript } from "../nucleo/visualScript.js";
import { enquadrar } from "../nucleo/enquadramento.js";
// Área de trabalho em três modos:
//  Designer: canvas com ferramentas (selecionar, mão, zoom, desenhar, texto, conta-gotas),
//            laço de seleção, alça de rotação, réguas e guias com encaixe
//  Web:      o código gerado (HTML ou JSON do projeto)
//  Prévia:   a interface funcionando, com os sinais que ela emite
import { h, botaoIcone } from "./dom.js";
import { sons } from "./sons.js";
import { icone } from "./icones.js";
import { CATALOGO } from "../nucleo/catalogo.js";
import { cssBase, css, marcacaoCompleta, esc } from "../nucleo/exportar.js";
import { dadosRuntime, ligarRuntime } from "../nucleo/runtime.js";
import { compilar } from "../nucleo/compilador.js";
import { ligarComplemento } from "../nucleo/complemento.js";
import { abrirMenuCanvas } from "./menuCanvas.js";
import { Caneta } from "./caneta.js";
import { selecionarNoRetangulo } from "../nucleo/selecao.js";
const ALCAS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const DESENHO = ["caixa", "elipse", "linha", "texto", "botao"];
const IMA = 6; // px de tela para encaixar em guia

const FERRAMENTAS = [
  { id: "selecao", nome: "Selecionar", icone: "seta", tecla: "V" },
  { id: "mao", nome: "Mão (mover a tela)", icone: "mao", tecla: "H" },
  { id: "zoom", nome: "Zoom (Alt diminui)", icone: "zoom", tecla: "Z" },
  null,
  { id: "caixa", nome: "Caixa", icone: "caixa", tecla: "R" },
  { id: "elipse", nome: "Elipse", icone: "elipse", tecla: "E" },
  { id: "linha", nome: "Linha", icone: "linha", tecla: "L" },
  { id: "caneta", nome: "Caneta (desenhar vetor)", icone: "caneta", tecla: "P" },
  { id: "texto", nome: "Texto", icone: "texto", tecla: "T" },
  { id: "botao", nome: "Botão", icone: "botao", tecla: "B" },
  null,
  { id: "conta", nome: "Conta-gotas (Shift: cor do texto)", icone: "contaGotas", tecla: "I" },
];

class Area {
  constructor(app) {
    this.app = app;
    this.raiz = h("main", { class: "area", "aria-label": "Área de trabalho" });
    this.sinais = [];
    this.gesto = null;
    this.espaco = false;
    this.codigoAba = "html";
    this.caneta = new Caneta(this);
    window.addEventListener("pointermove", e => this.mover(e));
    window.addEventListener("pointerup", e => this.soltar(e));
    window.addEventListener("resize", () => {
      if (this.ui.hibrido && this.ui.modo === "designer") this.render();
      else this.desenharReguas();
      this.ajustarPrevia?.();
    });
    window.addEventListener("blur", () => { this.espaco = false; this.cancelarGesto(); });
    window.addEventListener("pointercancel", () => this.cancelarGesto());
  }

  get n() { return this.app.n; }
  get ui() { return this.app.ui; }
  get zoom() { return this.ui.zoom ?? 1; }
  /** Modo híbrido: a tela de cima inteira é a tela real (sem prancheta, régua, grade nem zoom). */
  get reguasOn() { return !this.ui.hibrido && this.ui.reguas !== false; }
  tamanhoReal() { const r = this.raiz.getBoundingClientRect(); return [Math.max(320, Math.floor(r.width)), Math.max(200, Math.floor(r.height))]; }
  get ferramenta() { return this.espaco ? "mao" : this.ui.ferramenta ?? "selecao"; }

  idNoClique(id, direto = false) {
    if (direto) return id;
    let atual = id;
    const vistos = new Set([id]), escopo = this.ui.grupoEdicao;
    while (this.n.elemento(atual)?.pai) {
      const pai = this.n.elemento(atual).pai;
      if (pai === escopo || vistos.has(pai)) break;
      vistos.add(pai);
      if (this.n.elemento(pai)?.tipo !== "container") break;
      atual = pai;
    }
    return atual;
  }

  /** A área vazia de um vetor e objetos bloqueados não encobrem os de baixo. */
  alvoNoPonto(e) {
    const vistos = new Set();
    for (const hit of document.elementsFromPoint(e.clientX, e.clientY)) {
      const no = hit.closest?.('[data-hf]');
      if (!no || !this.arte.contains(no) || vistos.has(no)) continue;
      vistos.add(no);
      const el = this.n.elemento(no.dataset.hf);
      if (!el) continue;
      let bloqueado = false;
      const pais = new Set();
      for (let atual = el; atual && !pais.has(atual.id); atual = this.n.elemento(atual.pai)) {
        pais.add(atual.id);
        if (atual.travado) { bloqueado = true; break; }
      }
      if (bloqueado) continue;
      if (el.tipo === 'forma' || el.tipo === 'vetor') {
        const paths = [...no.querySelectorAll('svg path')].filter(p => !p.closest('defs'));
        if (paths.length && !paths.some(path => {
          const matriz = path.getScreenCTM();
          if (!matriz) return false;
          const ponto = new DOMPoint(e.clientX, e.clientY).matrixTransform(matriz.inverse());
          return path.isPointInFill(ponto) || path.isPointInStroke(ponto);
        })) continue;
      }
      return no;
    }
    return null;
  }

  render() {
    if (this.ui.modo !== "previa") this.ajustarPrevia = null;
    const modo = this.ui.modo;
    if (modo !== "previa" && this.desligar) { this.desligar(); this.desligar = null; }
    if (modo === "web") return this.renderWeb();
    if (modo === "previa") return this.renderPrevia();
    return this.renderDesigner();
  }

  // ----------------------------------------------------------
  // Montagem do palco (Designer e Prévia)
  // ----------------------------------------------------------
  montarPalco(idArte, extra = "") {
    const t = this.n.tela;
    const z = this.zoom;
    const anterior = this.prancheta?.isConnected ? this.prancheta.getBoundingClientRect() : null;
    const vista = this.rolagem?.getBoundingClientRect();
    const zoomAnterior = this.zoomMontado ?? z;
    this.centroVista = this.centroPendente ?? (anterior && vista && this.tamanhoMontado === `${t.largura}x${t.altura}` ? [(vista.left + this.rolagem.clientWidth / 2 - anterior.left) / zoomAnterior, (vista.top + this.rolagem.clientHeight / 2 - anterior.top) / zoomAnterior] : [t.largura / 2, t.altura / 2]);
    this.centroPendente = null;
    this.zoomMontado = z;
    this.tamanhoMontado = `${t.largura}x${t.altura}`;
    this.arte = h("div", { class: "hf-arte", id: idArte, style: `background:${t.fundo}` });
    this.estilo = h("style");
    this.prancheta = h("div", { class: `prancheta ${extra}`, style: `width:${t.largura}px;height:${t.altura}px;transform:scale(${z})` }, this.estilo, this.arte);
    this.palco = h("div", { class: "palco", style: `width:${t.largura * z}px;height:${t.altura * z}px` }, this.prancheta);
    this.rolagem = h("div", { class: "rolagem" }, this.palco);
    this.modoAnterior = this.ui.modo;
  }

  renderDesigner() {
    // nada mudou no documento nem na vista: só a seleção e o cursor da ferramenta se atualizam
    const chave = [this.n.versao ?? 0, this.zoom, this.ui.grade, this.ui.hibrido, this.reguasOn, this.n.tela.largura, this.n.tela.altura, this.ui.hibrido ? this.tamanhoReal().join("x") : ""].join("|");
    if (chave === this.chaveDesigner && this.prancheta?.isConnected && this.raiz.classList.contains("designer") && !this.gesto) {
      this.raiz.className = `area designer ${this.reguasOn ? "com-reguas" : ""} ${this.ui.hibrido ? "tela-real" : ""} ferr-${this.ferramenta}`;
      this.desenharSelecao();
      return;
    }
    this.chaveDesigner = chave;
    const els = this.n.elementos();
    this.montarPalco("arte-designer", this.ui.grade && !this.ui.hibrido ? "com-grade" : "");
    this.estilo.textContent = cssBase("#arte-designer") + "\n" + els.map(el => css({ ...el, visivel: true }, "#arte-designer")).join("\n");
    this.arte.innerHTML = els.map(marcacaoCompleta).join("");
    const porId = Object.fromEntries(els.map(e => [e.id, e]));
    const REG_FORA = /_corpo_|_aba_|_exp$|_rec$|_exp_|_rec_|_var_|_dd$|_dd_/;
    const ehForaEmulado = e => e.construtor && (REG_FORA.test(e.id));
    // modo híbrido: estados que o menu fecha (abas inativas, grupo recolhido…) somem junto com os descendentes
    const escondidoPorPai = e => { for (let a = porId[e.pai], n = 0; a && n < 40; a = porId[a.pai], n++) if (a.visivel === false && ehForaEmulado(a)) return true; return false; };
    // peças dentro de um pai oculto ou "fechado no início" (corpo de aba inativa, menu suspenso…) também ficam fora do desenho
    const fechadoPorPai = e => { for (let a = porId[e.pai], n = 0; a && n < 40; a = porId[a.pai], n++) if (a.visivel === false || a.abertura?.iniciaFechado) return true; return false; };
    for (const el of els) {
      const d = this.no(el.id);
      if (!d) continue;
      d.dataset.hf = el.id;
      if (this.ui.hibrido && el.visivel !== false && escondidoPorPai(el)) d.classList.add("oculto", "fora-emulado");
      if (el.travado) d.classList.add("travado");
      if (el.visivel === false) {
        d.classList.add("oculto");
        // modo híbrido: menus e caixas que começam ocultos aparecem abertos (só abas inativas da faixa ficam apagadas)
        if (this.ui.hibrido && el.construtor) d.classList.add(ehForaEmulado(el) ? "fora-emulado" : "aberto-emulado");
      }
      d.tabIndex = -1;
      if (d.tagName === "INPUT") d.readOnly = true;
      if (el.tipo === "container") d.classList.add(`layout-${el.layout?.modo ?? "livre"}`);
      if (el.abertura?.iniciaFechado && !(this.ui.hibrido && el.construtor)) { d.classList.add("fechado-inicio"); d.title = `${el.nome}: começa fechado e abre por um evento`; }
      else if (el.visivel === false && !this.ui.hibrido) { d.classList.add("fechado-inicio"); d.title = `${el.nome}: oculto (aparece ao ser selecionado ou com “Mostrar ocultos”)`; }
      else if (!this.ui.hibrido && fechadoPorPai(el)) d.classList.add("fechado-inicio");
    }
    if (this.animacao) {
      const { ids, classe } = this.animacao;
      this.animacao = null;
      for (const id of ids) this.no(id)?.classList.add(classe);
    }

    const comReguas = this.reguasOn;
    this.reguaH = comReguas ? h("canvas", { class: "regua regua-h", title: "Arraste para criar uma guia horizontal" }) : null;
    this.reguaV = comReguas ? h("canvas", { class: "regua regua-v", title: "Arraste para criar uma guia vertical" }) : null;
    this.raiz.className = `area designer ${comReguas ? "com-reguas" : ""} ${this.ui.hibrido ? "tela-real" : ""} ferr-${this.ferramenta}`;
    this.raiz.replaceChildren(...(comReguas ? [h("div", { class: "regua-canto" }), this.reguaH, this.reguaV] : []), this.rolagem);

    const vp = this.rolagem.getBoundingClientRect(), folha = this.prancheta.getBoundingClientRect();
    this.rolagem.scrollLeft += folha.left + this.centroVista[0] * this.zoom - vp.left - this.rolagem.clientWidth / 2;
    this.rolagem.scrollTop += folha.top + this.centroVista[1] * this.zoom - vp.top - this.rolagem.clientHeight / 2;
    this.desenharGuias();
    this.desenharSelecao();
    requestAnimationFrame(() => this.desenharReguas());

    this.rolagem.addEventListener("pointerdown", e => this.iniciar(e));
    this.rolagem.addEventListener("dblclick", e => {
      if (this.ferramenta !== "selecao" || e.target.closest?.(".vet-ov")) return;
      const id = this.alvoNoPonto(e)?.dataset.hf;
      const grupo = id && this.idNoClique(id);
      if (grupo && this.n.elemento(grupo)?.tipo === "container") {
        e.preventDefault(); this.ui.grupoEdicao = grupo;
        this.n.selecionar(id === grupo ? grupo : id);
        this.app.mensagem(`Editando ${this.n.rotulo(grupo)}. Esc volta à seleção do grupo.`);
        return;
      }
      if (id && this.app.editarNos(id)) e.preventDefault();
    });
    this.rolagem.addEventListener("contextmenu", e => {
      if (this.ferramenta === "caneta" || e.target.closest?.(".vet-ov")) return;
      e.preventDefault();
      const id = this.alvoNoPonto(e)?.dataset.hf;
      if (id && !this.app.n.selecionados().includes(id)) this.app.n.selecionar(id);
      abrirMenuCanvas(this.app, e.clientX, e.clientY, id ?? null);
    });
    this.rolagem.addEventListener("scroll", () => this.desenharReguas());
    this.rolagem.addEventListener("wheel", e => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      this.app.zoomEm(this.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX, e.clientY);
    }, { passive: false });
    if (comReguas) {
      this.reguaH.addEventListener("pointerdown", e => this.iniciarGuia(e, "h"));
      this.reguaV.addEventListener("pointerdown", e => this.iniciarGuia(e, "v"));
    }

    // soltar peças da paleta
    this.palco.addEventListener("dragover", e => {
      if (![...e.dataTransfer.types].some(t => t.startsWith("text/hefestus-"))) return;
      e.preventDefault();
      this.prancheta.classList.add("soltar-aqui");
    });
    this.palco.addEventListener("dragleave", () => this.prancheta.classList.remove("soltar-aqui"));
    this.palco.addEventListener("drop", e => {
      const tipo = e.dataTransfer.getData("text/hefestus-tipo");
      this.prancheta.classList.remove("soltar-aqui");
      const modelo = e.dataTransfer.getData("text/hefestus-modelo");
      const ic = e.dataTransfer.getData("text/hefestus-icone");
      if (modelo || ic) {
        e.preventDefault();
        const p = this.ponto(e);
        if (ic) this.app.inserirIcone(ic, this.encaixar(p.x - 16), this.encaixar(p.y - 16));
        else {
          const m = this.app.acharModelo(modelo);
          if (m) this.app.inserirModelo(m, this.encaixar(p.x - m.largura / 2), this.encaixar(p.y - m.altura / 2));
        }
        if (this.ui.sons !== false) sons.encaixar();
        return;
      }
      if (!CATALOGO[tipo]) return;
      e.preventDefault();
      const p = this.ponto(e);
      const def = CATALOGO[tipo].padrao();
      this.n.criar(tipo, this.encaixar(p.x - def.largura / 2), this.encaixar(p.y - def.altura / 2));
    });
  }

  enquadrarConteudo() {
    if (this.ui.hibrido || this.ui.modo === "previa") return;
    const base = this.prancheta?.getBoundingClientRect();
    if (!base || !this.rolagem) return;
    const els = this.n.elementos();
    const pais = new Set(els.map(e => e.pai).filter(Boolean));
    const caixas = els.filter(e => !pais.has(e.id)).flatMap(e => {
      const no = this.no(e.id);
      if (!no || !no.getClientRects().length || getComputedStyle(no).visibility === "hidden" || getComputedStyle(no).display === "none") return [];
      const r = no.getBoundingClientRect();
      return [{ x:(r.left-base.left)/this.zoom, y:(r.top-base.top)/this.zoom, largura:r.width/this.zoom, altura:r.height/this.zoom }];
    });
    const plano = enquadrar(caixas, this.rolagem.clientWidth, this.rolagem.clientHeight);
    this.centroPendente = plano?.centro ?? [this.n.tela.largura/2,this.n.tela.altura/2];
    this.chaveDesigner = null;
    this.app.definirZoom(plano?.zoom ?? this.ajustarZoom());
  }
  ajustarZoom() {
    const t = this.n.tela;
    const r = this.raiz.getBoundingClientRect();
    const sobra = this.ui.reguas !== false ? 82 : 64;
    const z = Math.min((r.width - sobra) / t.largura, (r.height - sobra) / t.altura);
    return Math.max(0.1, Math.min(2, Math.floor(z * 20) / 20));
  }

  no(id) {
    return this.arte?.querySelector(`#${CSS.escape(id)}`);
  }

  /** Ponto do evento em coordenadas da tela de design (px reais, sem zoom). */
  ponto(e) {
    const r = this.prancheta.getBoundingClientRect();
    return { x: (e.clientX - r.left) / this.zoom, y: (e.clientY - r.top) / this.zoom };
  }

  encaixar(v) {
    return this.ui.snap ? Math.round(v / 8) * 8 : Math.round(v);
  }

  /** Linhas de encaixe: guias, bordas e centro da tela e bordas/centros dos outros elementos. */
  linhasIma(excluir = new Set()) {
    const t = this.n.tela;
    const g = this.n.guias();
    const v = [0, t.largura / 2, t.largura, ...g.v];
    const hz = [0, t.altura / 2, t.altura, ...g.h];
    for (const e of this.n.elementos()) {
      if (excluir.has(e.id) || e.visivel === false) continue;
      v.push(e.x, e.x + e.largura / 2, e.x + e.largura);
      hz.push(e.y, e.y + e.altura / 2, e.y + e.altura);
    }
    return { v, h: hz };
  }

  /** Valor isolado (borda em redimensionamento) puxado para a linha mais próxima. */
  imaValor(v, lista) {
    const lim = IMA / this.zoom;
    let melhor = null;
    for (const l of lista) if (Math.abs(v - l) <= lim && (!melhor || Math.abs(v - l) < Math.abs(v - melhor))) melhor = l;
    return melhor;
  }

  /** Ajusta um deslocamento para que bordas/centro de um retângulo encostem numa linha próxima. */
  imantar(ret, dx, dy, linhas = this.linhasIma()) {
    const lim = IMA / this.zoom;
    const ajustar = (inicio, tam, d, lista) => {
      const bordas = [inicio + d, inicio + d + tam / 2, inicio + d + tam];
      let melhor = null;
      for (const b of bordas) for (const l of lista) {
        const dist = Math.abs(b - l);
        if (dist <= lim && (!melhor || dist < melhor.dist)) melhor = { d: d + (l - b), linha: l, dist };
      }
      return melhor;
    };
    const ax = ajustar(ret.x, ret.largura, dx, linhas.v);
    const ay = ajustar(ret.y, ret.altura, dy, linhas.h);
    return {
      dx: ax ? ax.d : this.ui.snap ? Math.round((ret.x + dx) / 8) * 8 - ret.x : Math.round(dx),
      dy: ay ? ay.d : this.ui.snap ? Math.round((ret.y + dy) / 8) * 8 - ret.y : Math.round(dy),
      linhaV: ax?.linha, linhaH: ay?.linha,
    };
  }

  // ----------------------------------------------------------
  // Seleção desenhada
  // ----------------------------------------------------------
  /** Elementos que "começam fechados" (menus, painéis, gavetas) somem do desenho para não se empilhar sobre os visíveis; aparecem ao selecioná-los ou com "Mostrar fechados". */
  marcarFechados() {
    const a = this.arte; if (!a) return;
    const esconder = this.ui.verFechados !== true && this.ui.modo === "designer" && !this.ui.hibrido;
    a.classList.toggle("ocultar-fechados", esconder);
    for (const d of a.querySelectorAll(".ver-fechado")) d.classList.remove("ver-fechado");
    if (!esconder) return;
    const sel = this.n.selecionados();
    if (!sel.length || sel.length > 5) return; // inserir um modelo seleciona tudo: não revela os fechados em bloco
    const els = this.n.elementos(), porId = Object.fromEntries(els.map(e => [e.id, e]));
    const mostrar = new Set();
    for (const id of sel) {
      for (let e = porId[id], k = 0; e && k < 40; e = porId[e.pai], k++) mostrar.add(e.id);   // o elemento e os pais (menu aberto até ele)
      const desce = (pai) => { for (const e of els) if (e.pai === pai && !mostrar.has(e.id)) { mostrar.add(e.id); desce(e.id); } };
      if (this.no(id)?.classList.contains("fechado-inicio")) desce(id);                       // fechado selecionado: mostra também o conteúdo dele
    }
    for (const id of mostrar) this.no(id)?.classList.add("ver-fechado");
  }

  desenharSelecao() {
    this.marcarFechados();
    this.palco?.querySelector(".camada-sel")?.remove();
    this.caneta?.desenhar();
    if (this.caneta?.edicao) return;
    const ids = this.n.selecionados();
    if (!ids.length || !this.palco) return;
    const z = this.zoom;
    const camada = h("div", { class: "camada-sel" });
    const caixa = (el, classe) => {
      const c = h("div", { class: classe });
      c.style.cssText = `left:${el.x * z}px;top:${el.y * z}px;width:${el.largura * z}px;height:${el.altura * z}px;${el.rotacao ? `transform:rotate(${el.rotacao}deg)` : ""}`;
      return c;
    };
    if (ids.length === 1) {
      const el = this.n.selecionado();
      const pequeno = el.largura * z < 56 || el.altura * z < 56;
      const c = caixa(el, `selecao ${el.travado ? "travado" : ""} ${pequeno ? "pequena" : ""}`);
      c.append(h("div", { class: "etiqueta" }, `${el.nome} · ${el.largura}×${el.altura}${el.rotacao ? ` · ${el.rotacao}°` : ""}`));
      if (!el.travado) {
        for (const a of ALCAS) {
          const al = h("div", { class: "alca", "data-a": a });
          al.style.left = `${a.includes("w") ? 0 : a.includes("e") ? 100 : 50}%`;
          al.style.top = `${a.includes("n") ? 0 : a.includes("s") ? 100 : 50}%`;
          c.append(al);
        }
        c.append(h("div", { class: "haste-girar" }), h("div", { class: "alca-girar", title: "Girar (Shift: de 15 em 15°)" }));
      }
      camada.append(c);
    } else {
      for (const id of ids) camada.append(caixa(this.n.elemento(id), "selecao-item"));
      const b = this.n.limites(ids);
      const grupo = caixa(b, "selecao grupo");
      grupo.append(h("div", { class: "etiqueta" }, `${ids.length} elementos · ${b.largura}×${b.altura}`));
      camada.append(grupo);
    }
    this.palco.append(camada);
    this.camadaSel = camada;
  }

  desenharGuias() {
    this.palco.querySelector(".camada-guias")?.remove();
    const g = this.n.guias();
    const t = this.n.tela;
    const z = this.zoom;
    const camada = h("div", { class: "camada-guias" });
    g.v.forEach((x, i) => {
      const l = h("div", { class: "guia guia-v", title: `Guia em x ${x}. Arraste para mover; solte fora da tela para remover.`, style: `left:${x * z}px;height:${t.altura * z}px` });
      l.addEventListener("pointerdown", e => this.iniciarGuia(e, "v", i));
      camada.append(l);
    });
    g.h.forEach((y, i) => {
      const l = h("div", { class: "guia guia-h", title: `Guia em y ${y}. Arraste para mover; solte fora da tela para remover.`, style: `top:${y * z}px;width:${t.largura * z}px` });
      l.addEventListener("pointerdown", e => this.iniciarGuia(e, "h", i));
      camada.append(l);
    });
    this.palco.append(camada);
  }

  desenharReguas() {
    if (!this.reguaH || !this.rolagem || this.ui.modo !== "designer") return;
    const css = getComputedStyle(this.raiz);
    const cor = css.getPropertyValue("--texto-3").trim() || "#888";
    const fundo = css.getPropertyValue("--chrome").trim() || "#eee";
    const linhaCor = css.getPropertyValue("--linha-forte").trim() || "#bbb";
    const z = this.zoom;
    const passo = [5, 10, 25, 50, 100, 200, 250, 500, 1000].find(p => p * z >= 50) ?? 1000;
    const rp = this.prancheta.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    for (const [cv, horizontal] of [[this.reguaH, true], [this.reguaV, false]]) {
      const r = cv.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const ht = Math.max(1, Math.round(r.height));
      cv.width = w * dpr;
      cv.height = ht * dpr;
      const c = cv.getContext("2d");
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = fundo;
      c.fillRect(0, 0, w, ht);
      c.strokeStyle = linhaCor;
      c.fillStyle = cor;
      c.font = "10px 'IBM Plex Mono', ui-monospace, monospace";
      const origem = horizontal ? rp.left - r.left : rp.top - r.top;
      const comprimento = horizontal ? w : ht;
      const ini = Math.floor(-origem / z / passo) * passo;
      const fim = (comprimento - origem) / z;
      c.beginPath();
      for (let v = ini; v <= fim; v += passo / 5) {
        const p = Math.round(origem + v * z) + 0.5;
        const maior = Math.abs(v % passo) < 1e-6;
        const tam = maior ? 10 : 4;
        if (horizontal) { c.moveTo(p, ht); c.lineTo(p, ht - tam); } else { c.moveTo(w, p); c.lineTo(w - tam, p); }
        if (maior) {
          if (horizontal) c.fillText(String(Math.round(v)), p + 3, 10);
          else { c.save(); c.translate(10, p - 3); c.rotate(-Math.PI / 2); c.fillText(String(Math.round(v)), 0, 0); c.restore(); }
        }
      }
      c.stroke();
    }
  }

  // ----------------------------------------------------------
  // Gestos
  // ----------------------------------------------------------
  iniciar(e) {
    if (e.button !== 0 || this.ui.modo !== "designer") return;
    const f = this.ferramenta;
    const p = this.ponto(e);
    if(f==='pincel') {
      e.preventDefault();
      const alvo=this.alvoNoPonto(e);
      if(alvo)this.app.pintarFormatacao(alvo.dataset.hf);
      return;
    }

    // modo formulário: a tela só mostra e seleciona; tudo se edita no formulário de baixo
    if (this.app.ui.hibrido && this.app.ui.travaTela !== false && f === "selecao") {
      const alvo = this.alvoNoPonto(e);
      if (alvo) { e.preventDefault(); this.app.aoClicarNaTela(this.idNoClique(alvo.dataset.hf, e.altKey), e.shiftKey); }
      else if (!e.target.closest?.(".alca, .alca-girar, .vet-ov")) this.n.selecionar(null);
      return;
    }
    if (e.target.closest?.(".vet-ov") && this.caneta.edicao) return;
    if (f === "caneta") { e.preventDefault(); this.caneta.pressionar(e); return; }
    if (this.caneta.edicao) this.caneta.sair();

    if (f === "mao") {
      e.preventDefault();
      this.gesto = { tipo: "mao", x0: e.clientX, y0: e.clientY, sl: this.rolagem.scrollLeft, st: this.rolagem.scrollTop };
      this.raiz.classList.add("arrastando");
      return;
    }
    if (f === "zoom") {
      e.preventDefault();
      this.app.zoomEm(this.zoom * (e.altKey ? 1 / 1.25 : 1.25), e.clientX, e.clientY);
      return;
    }
    let alvoEl = this.alvoNoPonto(e);
    // Alt no fundo de um container permite iniciar o retângulo sem movê-lo.
    if (alvoEl && f === "selecao" && e.altKey && this.n.elemento(alvoEl.dataset.hf)?.tipo === "container") alvoEl = null;
    if (f === "conta") {
      e.preventDefault();
      if (alvoEl) this.app.contaGotas(alvoEl.dataset.hf, e.shiftKey);
      return;
    }
    if (DESENHO.includes(f)) {
      e.preventDefault();
      const fant = h("div", { class: `fantasma ${f === "elipse" ? "redondo" : ""}` });
      this.palco.append(fant);
      this.gesto = { tipo: "desenhar", ferramenta: f, p0: { x: this.encaixar(p.x), y: this.encaixar(p.y) }, fant, x0: e.clientX, y0: e.clientY };
      return;
    }

    // ferramenta Selecionar
    if (e.target.closest(".alca-girar")) {
      e.preventDefault();
      const el = this.n.selecionado();
      this.gesto = { tipo: "girar", id: el.id, centro: { x: el.x + el.largura / 2, y: el.y + el.altura / 2 }, rot0: el.rotacao ?? 0, atual: null };
      return;
    }
    const alca = e.target.closest(".alca");
    if (alca) {
      e.preventDefault();
      const el = this.n.selecionado();
      this.gesto = { tipo: "redimensionar", id: el.id, alca: alca.dataset.a, x0: e.clientX, y0: e.clientY, orig: { x: el.x, y: el.y, largura: el.largura, altura: el.altura }, atual: null };
      return;
    }
    if (alvoEl) {
      e.preventDefault();
      const id = this.idNoClique(alvoEl.dataset.hf, e.altKey);
      if (e.shiftKey || e.ctrlKey || e.metaKey) { this.n.selecionar(id, { somar: true }); return; }
      if (!this.n.selecionados().includes(id)) this.n.selecionar(id);
      const topo = this.n.selecionados().filter(i => !this.n.elemento(i).travado);
      if (!topo.length) return;
      const ids = this.n.comDescendentes(topo);
      const excluir = new Set(ids);
      const orig = Object.fromEntries(ids.map(i => { const el = this.n.elemento(i); return [i, { x: el.x, y: el.y }]; }));
      this.gesto = { tipo: "mover", clicado: id, topo, ids, excluir, linhas: this.linhasIma(excluir), orig, ret: this.n.limites(topo), x0: e.clientX, y0: e.clientY, d: null };
      return;
    }
    // vazio: laço de seleção
    e.preventDefault();
    const laco = h("div", { class: "laco" });
    this.palco.append(laco);
    this.gesto = { tipo: "laco", p0: p, laco, somar: e.shiftKey || e.ctrlKey || e.metaKey, x0: e.clientX, y0: e.clientY, movido: false };
  }

  iniciarGuia(e, eixo, indice = null) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const linha = h("div", { class: `guia guia-${eixo} guia-nova` });
    const t = this.n.tela;
    const z = this.zoom;
    if (eixo === "v") linha.style.height = `${t.altura * z}px`; else linha.style.width = `${t.largura * z}px`;
    this.palco.append(linha);
    this.gesto = { tipo: "guia", eixo, indice, linha, pos: null };
    this.mover(e);
  }

  mover(e) {
    const g = this.gesto;
    if (!g) { if (this.caneta.pena) this.caneta.cursor(e); return; }
    const z = this.zoom;
    if (g.tipo === "caneta") { this.caneta.arrastar(e); return; }
    if (g.tipo === "no") { this.caneta.mover(e); return; }
    if (g.tipo === "mao") {
      this.rolagem.scrollLeft = g.sl - (e.clientX - g.x0);
      this.rolagem.scrollTop = g.st - (e.clientY - g.y0);
      return;
    }
    if (g.tipo === "guia") {
      const p = this.ponto(e);
      g.pos = Math.round(g.eixo === "v" ? p.x : p.y);
      if (g.eixo === "v") g.linha.style.left = `${g.pos * z}px`; else g.linha.style.top = `${g.pos * z}px`;
      return;
    }
    if (g.tipo === "mover") {
      const bruto = { dx: (e.clientX - g.x0) / z, dy: (e.clientY - g.y0) / z };
      if (!g.d && Math.abs(bruto.dx) + Math.abs(bruto.dy) < 3 / z) return;
      const im = this.imantar(g.ret, bruto.dx, bruto.dy, g.linhas);
      const preso = `${im.linhaV ?? ""}|${im.linhaH ?? ""}`;
      if (preso !== "|" && preso !== g.preso) this.tremer(g.ids);
      g.preso = preso;
      g.d = im;
      this.destacarContainer(g, im);
      for (const id of g.ids) {
        const d = this.no(id);
        if (d) Object.assign(d.style, { left: `${g.orig[id].x + im.dx}px`, top: `${g.orig[id].y + im.dy}px` });
      }
      if (this.camadaSel) this.camadaSel.style.transform = `translate(${im.dx * z}px, ${im.dy * z}px)`;
      const et = this.camadaSel?.querySelector(".selecao .etiqueta");
      if (et) et.textContent = `x ${Math.round(g.ret.x + im.dx)} · y ${Math.round(g.ret.y + im.dy)}`;
      this.mostrarLinhasIma(im.linhaV, im.linhaH);
      return;
    }
    if (g.tipo === "redimensionar") {
      const dx = (e.clientX - g.x0) / z;
      const dy = (e.clientY - g.y0) / z;
      const o = g.orig;
      const m = { ...o };
      if (g.alca.includes("e")) m.largura = Math.max(8, this.encaixar(o.largura + dx));
      if (g.alca.includes("s")) m.altura = Math.max(8, this.encaixar(o.altura + dy));
      if (g.alca.includes("w")) { const nx = this.encaixar(o.x + dx); m.largura = Math.max(8, o.x + o.largura - nx); m.x = o.x + o.largura - m.largura; }
      if (g.alca.includes("n")) { const ny = this.encaixar(o.y + dy); m.altura = Math.max(8, o.y + o.altura - ny); m.y = o.y + o.altura - m.altura; }
      if (e.shiftKey && o.altura) { const prop = o.largura / o.altura; if (g.alca.length === 2) m.altura = Math.round(m.largura / prop); }
      g.linhas ??= this.linhasIma(new Set([g.id]));
      let lv;
      let lh;
      if (g.alca.includes("e")) { const l = this.imaValor(m.x + m.largura, g.linhas.v); if (l !== null) { m.largura = Math.max(8, Math.round(l - m.x)); lv = l; } }
      if (g.alca.includes("w")) { const l = this.imaValor(m.x, g.linhas.v); if (l !== null) { m.largura = Math.max(8, Math.round(o.x + o.largura - l)); m.x = Math.round(l); lv = l; } }
      if (g.alca.includes("s")) { const l = this.imaValor(m.y + m.altura, g.linhas.h); if (l !== null) { m.altura = Math.max(8, Math.round(l - m.y)); lh = l; } }
      if (g.alca.includes("n")) { const l = this.imaValor(m.y, g.linhas.h); if (l !== null) { m.altura = Math.max(8, Math.round(o.y + o.altura - l)); m.y = Math.round(l); lh = l; } }
      const preso = `${lv ?? ""}|${lh ?? ""}`;
      if (preso !== "|" && preso !== g.preso) this.tremer([g.id]);
      g.preso = preso;
      this.mostrarLinhasIma(lv, lh);
      g.atual = m;
      const d = this.no(g.id);
      if (d) Object.assign(d.style, { left: `${m.x}px`, top: `${m.y}px`, width: `${m.largura}px`, height: `${m.altura}px` });
      const sel = this.camadaSel?.querySelector(".selecao");
      if (sel) {
        Object.assign(sel.style, { left: `${m.x * z}px`, top: `${m.y * z}px`, width: `${m.largura * z}px`, height: `${m.altura * z}px` });
        const et = sel.querySelector(".etiqueta");
        if (et) et.textContent = `${m.largura}×${m.altura}`;
      }
      return;
    }
    if (g.tipo === "girar") {
      const p = this.ponto(e);
      let ang = (Math.atan2(p.y - g.centro.y, p.x - g.centro.x) * 180) / Math.PI + 90;
      if (e.shiftKey) ang = Math.round(ang / 15) * 15;
      ang = Math.round(((ang % 360) + 540) % 360 - 180);
      g.atual = ang;
      const el = this.n.elemento(g.id);
      const d = this.no(g.id);
      const extra = `${el.espelharH ? " scaleX(-1)" : ""}${el.espelharV ? " scaleY(-1)" : ""}`;
      if (d) d.style.transform = `rotate(${ang}deg)${extra}`;
      const sel = this.camadaSel?.querySelector(".selecao");
      if (sel) {
        sel.style.transform = `rotate(${ang}deg)`;
        const et = sel.querySelector(".etiqueta");
        if (et) et.textContent = `${ang}°`;
      }
      return;
    }
    if (g.tipo === "laco" || g.tipo === "desenhar") {
      const p = this.ponto(e);
      g.movido = g.movido || Math.abs(e.clientX - g.x0) + Math.abs(e.clientY - g.y0) > 3;
      if (!g.movido) return;
      const el = g.tipo === "laco" ? g.laco : g.fant;
      if (g.tipo === "desenhar" && g.ferramenta === "linha") {
        const p0 = g.p0;
        const p1 = { x: this.encaixar(p.x), y: this.encaixar(p.y) };
        const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        const ang = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
        el.className = "fantasma linha";
        Object.assign(el.style, { left: `${p0.x * z}px`, top: `${p0.y * z}px`, width: `${len * z}px`, height: "0px", transform: `rotate(${ang}deg)`, transformOrigin: "0 0" });
        g.p1 = p1;
        return;
      }
      const a = g.tipo === "desenhar" ? g.p0 : g.p0;
      const b = g.tipo === "desenhar" ? { x: this.encaixar(p.x), y: this.encaixar(p.y) } : p;
      const r = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), largura: Math.abs(b.x - a.x), altura: Math.abs(b.y - a.y) };
      if (g.tipo === "desenhar" && e.shiftKey) r.largura = r.altura = Math.max(r.largura, r.altura);
      g.ret = r;
      Object.assign(el.style, { left: `${r.x * z}px`, top: `${r.y * z}px`, width: `${r.largura * z}px`, height: `${r.altura * z}px` });
      if (g.tipo === "laco") { g.tocar = e.altKey; this.destacarLaco(this.noLaco(r, g.tocar)); }
    }
  }

  /** Estilo PowerPoint: o retângulo seleciona só o que está INTEIRO dentro dele (Alt: tudo o que ele toca); de um container com conteúdo vale o container. */
  noLaco(r, tocar = false) {
    return selecionarNoRetangulo(this.n.elementos(), r, tocar);
  }

  cancelarGesto() {
    const g = this.gesto;
    if (!g) { this.raiz.classList.remove("ferr-mao"); return; }
    this.gesto = null;
    g.laco?.remove(); g.fant?.remove(); g.linha?.remove();
    this.raiz.classList.remove("arrastando");
    this.destacarLaco([]); this.mostrarLinhasIma();
    this.chaveDesigner = null;
    if (this.ui.modo === "designer") this.render();
  }
  /** Contorno ao vivo nos elementos que entrariam na seleção enquanto o retângulo é arrastado. */
  destacarLaco(ids) {
    const novos = new Set(ids);
    for (const d of this.arte?.querySelectorAll(".no-laco") ?? []) if (!novos.has(d.dataset.hf)) d.classList.remove("no-laco");
    for (const id of novos) this.no(id)?.classList.add("no-laco");
  }

  /** Tremidinha de quem chegou perto do ímã (e um tique bem baixo). */
  tremer(ids) {
    for (const id of ids) {
      const d = this.no(id);
      if (!d) continue;
      d.classList.remove("ima-treme");
      void d.offsetWidth;
      d.classList.add("ima-treme");
    }
    if (this.ui.sons !== false) sons.aproximar();
  }

  /** Mostra qual container vai receber o que está sendo arrastado. */
  destacarContainer(g, im) {
    const ret = { ...g.ret, x: g.ret.x + im.dx, y: g.ret.y + im.dy };
    const alvo = g.topo.length && g.topo.every(id => !g.topo.includes(this.n.elemento(id).pai)) ? this.n.containerEm(ret, g.excluir) : null;
    if (alvo === g.alvoCont) return;
    if (g.alvoCont) this.no(g.alvoCont)?.classList.remove("alvo-container");
    g.alvoCont = alvo;
    if (alvo) {
      this.no(alvo)?.classList.add("alvo-container");
      if (this.ui.sons !== false) sons.aproximar();
    }
  }

  /** Animação de encaixe aplicada depois do próximo desenho. */
  animarDepois(ids, classe) {
    this.animacao = { ids, classe };
  }

  mostrarLinhasIma(v, hz) {
    this.palco?.querySelectorAll(".linha-ima").forEach(l => l.remove());
    const t = this.n.tela;
    const z = this.zoom;
    if (v !== undefined) this.palco.append(h("div", { class: "linha-ima linha-ima-v", style: `left:${v * z}px;height:${t.altura * z}px` }));
    if (hz !== undefined) this.palco.append(h("div", { class: "linha-ima linha-ima-h", style: `top:${hz * z}px;width:${t.largura * z}px` }));
  }

  soltar(e) {
    const g = this.gesto;
    this.gesto = null;
    if (!g) return;
    this.raiz.classList.remove("arrastando");
    this.mostrarLinhasIma();
    const n = this.n;
    if (g.tipo === "caneta") return;
    if (g.tipo === "no") { this.caneta.soltar(g); return; }
    if (g.tipo === "guia") {
      g.linha.remove();
      const t = n.tela;
      const max = g.eixo === "v" ? t.largura : t.altura;
      const dentro = g.pos !== null && g.pos >= 0 && g.pos <= max;
      if (g.indice === null) { if (dentro) n.adicionarGuia(g.eixo, g.pos); }
      else if (!dentro) n.removerGuia(g.eixo, g.indice);
      else if (g.pos !== n.guias()[g.eixo][g.indice]) n.moverGuia(g.eixo, g.indice, g.pos);
      return;
    }
    if (g.tipo === "mover") {
      if (g.alvoCont) this.no(g.alvoCont)?.classList.remove("alvo-container");
      if (g.d && (g.d.dx || g.d.dy)) {
        const somOk = this.ui.sons !== false;
        const imantado = g.d.linhaV !== undefined || g.d.linhaH !== undefined;
        const r0 = { entrou: [], saiu: [] };
        this.animarDepois(g.topo, "encaixe");
        const r = n.moverEncaixando(g.topo, g.d.dx, g.d.dy) ?? r0;
        if (r.entrou.length) { if (somOk) sons.entrar(); this.app.mensagem(`Encaixado em ${n.rotulo(n.elemento(r.entrou[0])?.pai)}.`, "ok"); }
        else if (r.saiu.length) { if (somOk) sons.sair(); }
        else if (imantado && somOk) sons.encaixar();
      } else {
        if (this.camadaSel) this.camadaSel.style.transform = "";
        // clique sem arrastar num item de uma seleção múltipla: fica só ele
        if (!g.d && n.selecionados().length > 1) n.selecionar(g.clicado);
      }
      return;
    }
    if (g.tipo === "redimensionar") {
      const o = g.orig;
      const m = g.atual;
      if (m && (m.x !== o.x || m.y !== o.y || m.largura !== o.largura || m.altura !== o.altura)) {
        if (g.preso && g.preso !== "|") { this.animarDepois([g.id], "encaixe"); if (this.ui.sons !== false) sons.encaixar(); }
        n.geometria(g.id, m);
      }
      return;
    }
    if (g.tipo === "girar") {
      if (g.atual !== null && g.atual !== g.rot0) n.definirRotacao([g.id], g.atual);
      return;
    }
    if (g.tipo === "laco") {
      g.laco.remove();
      if (!g.movido) { if (!g.somar) n.selecionar(null); return; }
      this.destacarLaco([]);
      const dentro = this.noLaco(g.ret, g.tocar);
      n.selecionarVarios(g.somar ? [...n.selecionados(), ...dentro] : dentro);
      return;
    }
    if (g.tipo === "desenhar") {
      g.fant.remove();
      const f = g.ferramenta;
      const def = CATALOGO[f].padrao();
      let id;
      if (f === "linha") {
        if (g.movido && g.p1) {
          const { p0, p1 } = g;
          const len = Math.max(8, Math.round(Math.hypot(p1.x - p0.x, p1.y - p0.y)));
          const ang = Math.round((Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI);
          const cx = (p0.x + p1.x) / 2;
          const cy = (p0.y + p1.y) / 2;
          id = n.criar("linha", Math.round(cx - len / 2), Math.round(cy - def.altura / 2), { largura: len, ...(ang ? { rotacao: ang } : {}) });
        } else id = n.criar("linha", g.p0.x, g.p0.y);
      } else if (g.movido && g.ret && g.ret.largura >= 4 && g.ret.altura >= 4) {
        id = n.criar(f, g.ret.x, g.ret.y, { largura: Math.round(g.ret.largura), altura: Math.round(g.ret.altura) });
      } else {
        id = n.criar(f, g.p0.x, g.p0.y);
      }
      if (!this.app.ferramentaFixa) this.app.setFerramenta("selecao");
      return id;
    }
  }

  // ----------------------------------------------------------
  // Web (código)
  // ----------------------------------------------------------
  renderWeb() {
    const texto = this.codigoAba === "json" ? JSON.stringify(this.n.serializar(0), null, 2) : this.n.html();
    const aba = (id, r) => h("button", { type: "button", class: "aba", "aria-selected": String(this.codigoAba === id), onclick: () => { this.codigoAba = id; this.render(); } }, r);
    const pre = h("pre", { tabindex: "0", "aria-label": "Código gerado" });
    pre.textContent = texto;
    this.raiz.className = "area web";
    this.raiz.replaceChildren(h("div", { class: "codigo" },
      h("div", { class: "codigo-barra", role: "tablist" },
        aba("html", "HTML + CSS + sinais"), aba("json", "Projeto (JSON)"),
        h("button", { type: "button", class: "bt-texto", onclick: () => this.app.copiar(this.codigoAba), html: `${icone("copiar", 14)} Copiar` })),
      pre));
  }

  // ----------------------------------------------------------
  // Prévia
  // ----------------------------------------------------------
  /** Prévia: o HTML responsivo de verdade, numa moldura com a largura que você escolher. */
  renderPrevia() {
    if (this.desligar) this.desligar();
    const t = this.n.tela;
    const W = Math.max(280, Math.round(this.ui.larguraPrevia ?? t.largura));
    const c = compilar(this.n.doc, { escopo: "#arte-previa", modo: "previa" });
    this.estilo = h("style");
    this.estilo.textContent = c.css;
    this.arte = h("div", { class: "hf-arte", id: "arte-previa" });
    this.arte.innerHTML = c.html;
    // Estilos e complementos do artefato ficam isolados do próprio editor.
    const host = h("div", { class: "previa-documento", style: `width:100%;height:${t.altura}px;contain:layout paint` });
    const sombra = host.attachShadow({ mode: "open" });
    sombra.append(this.estilo, this.arte);
    const alca = h("div", { class: "previa-alca", title: "Arraste para mudar a largura", role: "separator", "aria-orientation": "vertical" });
    this.quadro = h("div", { class: "previa-quadro", style: `width:${W}px;height:${t.altura}px` }, host, alca);
    const moldura = h("div", { class: "previa-moldura" }, this.quadro);
    this.rolagem = h("div", { class: "rolagem previa-rolagem" }, moldura);
    const medida = h("span", { class: "previa-medida num" }, `${W} px`);
    const presets = [["Como desenhado", t.largura, "tela"], ["Desktop", 1440, "tela"], ["Notebook", 1024, "tela"], ["Tablet", 768, "painelLateral"], ["Celular", 390, "telefone"]];
    const definir = w => { this.ui.larguraPrevia = w; this.app.salvarUI(); this.render(); };
    const barra = h("div", { class: "previa-barra", role: "toolbar", "aria-label": "Largura da prévia" },
      ...presets.map(([r, w, ic]) => h("button", {
        type: "button", class: "bt-texto previa-preset", "aria-pressed": String(W === w), title: `${r}: ${w} px`,
        onclick: () => definir(w), html: `${icone(ic, 14)}<span>${r}</span>`,
      })),
      medida,
      h("button", { type: "button", class: "bt-texto previa-preset", title: "Volta tudo ao estado inicial: abas, menus abertos, painéis recolhidos…", onclick: () => this.render(), html: `${icone("desfazer", 14)}<span>Reiniciar</span>` }),
      h("span", { class: "chip", title: "Tudo funciona de verdade: passe o mouse, clique, arraste divisores, use atalhos e abra menus. Os sinais aparecem ao lado." }, "Interativa"),
      ...(this.arte.querySelector("[data-perfis]") ? (() => {
        const nomes = [...new Set([...this.arte.querySelectorAll("[data-perfis]")].flatMap(e => e.dataset.perfis.split(",").map(x => x.trim()).filter(Boolean)))];
        const sel = h("select", { class: "previa-perfil", "aria-label": "Ver como perfil", onchange: () => this.arte.hefestusPerfil(sel.value) },
          h("option", { value: "" }, "Todos os perfis"), ...nomes.map(n => h("option", { value: n }, n)));
        return [h("label", { class: "chip", title: "Ver a interface como este perfil" }, "Ver como ", sel)];
      })() : []),
      h("span", { class: `chip ${c.responsivo ? "prot" : ""}`, title: "Muda em Propriedades da tela" }, c.responsivo ? "Responsivo" : "Tamanho fixo"));
    this.raiz.className = "area previa";
    this.listaSinais = h("ol");
    this.desenharSinais();
    this.raiz.replaceChildren(barra, this.rolagem,
      h("aside", { class: "sinais", "aria-label": "Sinais emitidos" },
        h("header", {}, h("span", { html: icone("sinal", 14) }), "Sinais emitidos",
          botaoIcone("excluir", "Limpar sinais", () => { this.sinais = []; this.desenharSinais(); }, { tam: 13, class: "", attrs: { style: "margin-left:auto" } })),
        this.listaSinais));
    // cabe na janela: reduz a escala só da visualização (a largura usada pelo layout continua W)
    const ajustar = w => {
      const disp = Math.max(200, this.rolagem.clientWidth - 48);
      const k = Math.min(1, disp / w);
      this.quadro.style.width = `${w}px`;
      this.quadro.style.transform = k < 1 ? `scale(${k})` : "";
      moldura.style.width = `${w * k}px`;
      moldura.style.height = `${t.altura * k}px`;
      medida.textContent = `${Math.round(w)} px${k < 1 ? ` · vista em ${Math.round(k * 100)}%` : ""}`;
      return k;
    };
    requestAnimationFrame(() => ajustar(W));
    this.ajustarPrevia = () => ajustar(W);
    alca.addEventListener("pointerdown", e => {
      e.preventDefault();
      const x0 = e.clientX;
      const k = ajustar(W);
      let atual = W;
      const mover = ev => { atual = Math.max(280, Math.min(2560, Math.round(W + (ev.clientX - x0) / k))); ajustar(atual); };
      const soltar = () => {
        window.removeEventListener("pointermove", mover);
        window.removeEventListener("pointerup", soltar);
        definir(atual);
      };
      window.addEventListener("pointermove", mover);
      window.addEventListener("pointerup", soltar);
    });
    this.arte.addEventListener("hefestus:erro-complemento", e => this.app.mensagem(`Falha no complemento da prévia: ${e.detail.mensagem}`, "alerta"));
    const dRuntime = ligarRuntime(this.arte, dadosRuntime(c.elementos, alvosDoScript(this.n.doc.elementos.__script)), d => this.registrarSinal(d));
    const dComp = ligarComplemento(this.n.tela.complemento, this.arte);
    const dScript=executarScript(this.arte,scriptParaRuntime(this.n.doc.elementos.__script),{});
    this.desligar = () => { dComp(); dScript(); dRuntime(); };
  }

  registrarSinal(d) {
    const agora = new Date();
    this.sinais.unshift({ ...d, hora: agora.toLocaleTimeString("pt-BR") });
    this.sinais = this.sinais.slice(0, 30);
    this.desenharSinais();
    this.app.mensagem(`Sinal ${d.sinal} emitido por ${this.n.rotulo(d.origem)}`, "ok");
  }

  desenharSinais() {
    if (!this.listaSinais) return;
    this.listaSinais.replaceChildren(...(this.sinais.length
      ? this.sinais.map(s => h("li", {}, h("code", {}, s.sinal), h("span", { class: "num" }, s.hora)))
      : [h("li", { class: "painel-vazio" }, "Interaja com a interface para ver os sinais.")]));
  }
}
export { esc, FERRAMENTAS, Area };
