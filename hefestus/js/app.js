import { exportarWindows } from "./ui/exportarWindows.js";
import { capturarFormatacao, aplicarFormatacao } from "./nucleo/pincelFormatacao.js";
import { definirIconesColoridos, definirIconesWindows } from "./ui/icones.js";
// Hephaestus — ponto de entrada. Liga o núcleo às partes da interface.
import { Nucleo } from "./nucleo/nucleo.js";
import { FORMAS } from "./nucleo/formas.js";
import { h, botaoIcone, avisar, copiar, capturarFoco } from "./ui/dom.js";
import { icone } from "./ui/icones.js";
import { Ribbon } from "./ui/ribbon.js";
import { PALETAS } from "./ui/temas.js";
import { BarraFina } from "./ui/barra.js";
import { LateralEsquerda, LateralDireita } from "./ui/laterais.js";
import { Area } from "./ui/canvas.js";
import { Agente } from "./agente/agente.js";
import { Aparencia } from "./app/aparencia.js";
import { Biblioteca } from "./app/biblioteca.js";
import { PainelAgente } from "./ui/agente.js";
import { normalizarWorkspace } from "./app/workspace.js";
import { emJanelaNativa } from "./nucleo/nativo.js";
import { JanelaTeste } from "./ui/janelaTeste.js";
import { AmbienteForja } from "./ui/forja.js";
import { Armazem, MeioIndexedDB, MeioMemoria } from "./nucleo/armazem.js";
import { carregarBancoInicial } from "./nucleo/bancoFerramentasInicial.js";
import { PainelArmazem } from "./ui/armazem.js";
import { PainelPrimeirosPassos } from "./ui/primeirosPassos.js";
import { ArmazemApp } from "./app/armazem.js";
import { VERSAO } from "./nucleo/semente.js";
import { EstudioVS } from "./ui/visualScript.js";
import { iniciarAreas, trocarArea } from "./app/areasHephaestus.js";
import { HephaestusApp } from "./app/hephaestus.js";
import { FerramentasHephaestus } from "./ui/ferramentasHephaestus.js";
import { contextoSelecao } from "./nucleo/designerHephaestus.js";
import { mostrarAbertura } from "./ui/abertura.js";
import { iniciarCelular } from "./ui/celular.js";
const CHAVE_UI = "hefestus.workspace.v1";
const UI_PADRAO = {
  aba: "inicio", modo: "designer", ribbonRecolhido: true, flyout: null, grupoAberto: null,
  esq: "agente", dir: ["propriedades", "estilo"], zoom: null, grade: true, snap: true, busca: true,
  ferramenta: "selecao", reguas: true,
  temaUI: "automatico", estiloMenu: "faixa", formato: "arredondado", barraFerr: true, abaBib: "modelos", estiloIcones: "traco", sons: true,
};

class App {
  constructor(raiz) {
    this.n = new Nucleo();
    // a tela do projeto representa o monitor: projeto ainda intocado já nasce com a largura do PC
    if (!this.n.historico().itens.length) this.n.ajustarTelaAoMonitor(true);
    this.ui = normalizarWorkspace({ ...UI_PADRAO, ...this.lerUI() });
    if(this.ui.ferramenta==='pincel')this.ui.ferramenta='selecao';
    // Migração da interface antiga: Código vira aba, Híbrido vira Visual Script.
    if (this.ui.modo === "web") { this.ui.hibrido = true; this.ui.dockAba = "codigo"; }
    this.ui.modo = "designer";
    this.ui.travaTela = false;
    this.salvarUI();
    this.ui.flyout = null;
    this.ui.grupoAberto = null;
    // v0.4: a faixa passa a se recolher quando não está em uso (pode ser fixada no alfinete)
    if ((this.ui.versaoUI ?? 0) < 4) { this.ui.ribbonRecolhido = true; this.ui.versaoUI = 4; this.salvarUI(); }
    if (!this.ui.layoutTrilhos) {
      Object.assign(this.ui, { layoutTrilhos: 1, esq: null, dir: [], barraFerr: false, temaUI: "meiaNoite", ribbonRecolhido: true });
      this.salvarUI();
    }
    // v0.33: tema Âmbar (grafite + dourado) vira o padrão uma única vez; depois a escolha da pessoa vale
    if ((this.ui.versaoUI ?? 0) < 5) { this.ui.temaUI = "ambar"; this.ui.versaoUI = 5; this.salvarUI(); }
    // v0.33: faixa de opções fixa, como no PowerPoint (a pessoa pode voltar ao menu clássico em Exibir)
    if ((this.ui.versaoUI ?? 0) < 6) { this.ui.menusCompactos = 1; this.ui.estiloMenu = "faixa"; this.ui.ribbonRecolhido = false; this.ui.aba = "inicio"; this.ui.versaoUI = 6; this.salvarUI(); }
    if ((this.ui.versaoUI ?? 0) < 7) { this.ui.inspetorFixo = true; this.ui.dir = ["inspetor"]; this.ui.versaoUI = 7; this.salvarUI(); }
    if ((this.ui.versaoUI ?? 0) < 8) { this.ui.iconesCor = false; this.ui.versaoUI = 8; this.salvarUI(); }
    if ((this.ui.versaoUI ?? 0) < 9) { this.ui.iconesWindows = true; this.ui.versaoUI = 9; this.salvarUI(); }
    definirIconesColoridos(this.ui.iconesCor === true);
    definirIconesWindows(this.ui.iconesWindows !== false);
    if ((this.ui.versaoMenuProfissional??0)<1) {
      this.ui.menuAntesProfissional={orquestrador:this.ui.orquestrador,ribbonRecolhido:this.ui.ribbonRecolhido};
      this.ui.orquestrador={...(this.ui.orquestrador??{}),perfil:"criacao",organizar:true,autoformatar:true,limite:6};
      this.ui.areaTrabalho="interface";this.ui.ribbonRecolhido=false;this.ui.versaoMenuProfissional=1;this.salvarUI();
    }
    if (this.estreito()) { this.ui.esq = null; this.ui.dir = []; }
    if (!this.ui.menusCompactos) {
      this.ui.menusCompactos = 1; this.ui.estiloMenu = "classico"; this.salvarUI();
    }
    iniciarAreas(this.ui);
    this.aplicarAparencia();
    this.carregarFontesWeb();

    // armazém de referências: IndexedDB deste navegador (memória quando o navegador não oferece)
    this.armazem = new Armazem(MeioIndexedDB.disponivel() ? new MeioIndexedDB() : new MeioMemoria());
    this.painelArmazem = new PainelArmazem(this);
    this.bancoPronto = carregarBancoInicial(this.armazem).then(() => this.painelArmazem.render()).catch(e => avisar('Banco de ferramentas: '+e.message,'alerta'));
    this.primeiros = new PainelPrimeirosPassos(this);
    this.agente = new Agente(this.n, this);
    this.status = this.criarStatus();
    this.painelAgente = new PainelAgente(this);
    this.ribbon = new Ribbon(this);
    this.barra = new BarraFina(this);
    this.esq = new LateralEsquerda(this);
    this.dir = new LateralDireita(this);
    this.area = new Area(this);
    this.ambiente = new AmbienteForja(this);
    this.estudio = new EstudioVS(this);
    this.caixaFerramentas=new FerramentasHephaestus(this);
    this.barra.caixaBusca.classList.add("hp-title-search");
    this.barra.entrada.placeholder="Pesquisar ferramentas";
    this.ribbon.barraTitulo.insertBefore(this.barra.caixaBusca,this.ribbon.qat);
    this.ribbon.barraTitulo.append(this.ribbon.qat);
    this.entradaArquivo = h("input", { type: "file", accept: ".hefestus,.json,.zip,application/json,application/zip", hidden: true, onchange: e => this.carregarArquivo(e.target.files[0]) });
    this.entradaModelos = h("input", { type: "file", accept: ".json,application/json", hidden: true, onchange: e => this.carregarModelos(e.target.files[0]) });

    this.entradaSVG = h("input", { type: "file", accept: ".svg,image/svg+xml", hidden: true, onchange: e => this.carregarSVG(e.target.files[0]) });
    this.entradaHistorico = h("input", { type: "file", accept: ".jsonl,.ndjson,application/x-ndjson,text/plain", hidden: true, onchange: e => this.carregarHistorico(e.target.files[0]) });
    raiz.replaceChildren(
      this.ribbon.raiz,
      this.ambiente.raiz,
      this.ambiente.camadas,
      this.barra.raiz,
      h("div", { class: "meio" }, this.caixaFerramentas.raiz, this.esq.raiz, this.area.raiz, this.dir.raiz, this.estudio.raiz),
      this.status.raiz,
      this.entradaArquivo,
      this.entradaModelos,
      this.entradaSVG,
      this.entradaHistorico
    );

    const recolherLaterais = () => {
      if (this.ui.hibrido || (!this.ui.esq && !this.ui.dir?.length)) return;
      const fixo = this.ui.inspetorFixo !== false && this.ui.dir?.length === 1 && this.ui.dir[0] === "inspetor";
      if (fixo && !this.ui.esq) return;
      this.ui.esq = null; this.ui.dir = fixo ? ["inspetor"] : []; this.salvarUI(); this.render();
    };
    document.addEventListener("pointerdown", e => {
      if (e.target.closest(".area") && !e.target.closest(".veu")) recolherLaterais();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && this.semInterface) { this.alternarSemInterface(); return; }
      if (e.key === "Escape" && !document.querySelector(".veu:not([hidden])")) recolherLaterais();
    });
    this.n.on(motivo => this.aoMudar(motivo));
    document.addEventListener("keydown", e => { this._altSolo = e.key === "Alt" && !e.repeat; this.teclado(e); });
    document.addEventListener("keyup", e => {
      if (e.key === "Alt" && this._altSolo && !this.agente?.ocupado && !document.querySelector(".veu:not([hidden])") && this.ui.estiloMenu !== "classico") {
        e.preventDefault();
        this.ribbon.dicas ? this.ribbon.fecharDicas() : this.ribbon.dicasDeTecla();
      }
      this._altSolo = false;
    });
    document.addEventListener("keyup", e => this.tecladoSolto(e));
    window.addEventListener("beforeunload", e => { this.n.salvarLocalAgora(); if (this.n.sujo || [...this.ambiente.rascunhos.values()].some(r => r.sujo)) e.preventDefault(); });

    if (!this.n.elementos().length && !this.n.originalRecuperacao) this.exemploHephaestus();
    this.render();
    if (!this.ui.zoom) requestAnimationFrame(() => { if (!this.ui.zoom) { this.ui.zoom = this.area.ajustarZoom(); this.render(); } });
    requestAnimationFrame(() => { if (!this.ui.enquadramento0351 && !this.ui.hibrido && !["previa","web"].includes(this.ui.modo)) { this.ui.enquadramento0351 = true; this.area.enquadrarConteudo(); this.salvarUI(); } });
    this.mensagem(this.n.avisoRecuperacao ?? "Pronto. Designer cria a forma; Visual Script configura função, código e artefatos.");
  }

  // ---------------- estado da área de trabalho ----------------
  lerUI() {
    try { return JSON.parse(localStorage.getItem(CHAVE_UI)) ?? {}; } catch { return {}; }
  }
  /** Uso de comandos: contagem + última vez. Guardado na interface (localStorage), no máximo 80 comandos. */
  usou(id) {
    if (!id || String(id).startsWith("_")) return;
    const u = (this.ui.uso ??= {});
    const a = u[id] ?? { n: 0, t: 0 };
    u[id] = { n: a.n + 1, t: Date.now() };
    const ids = Object.keys(u);
    if (ids.length > 80) for (const k of ids.sort((x, y) => u[x].t - u[y].t).slice(0, ids.length - 80)) delete u[k];
    this.salvarUI();
  }
  recentes(max = 6) { return Object.entries(this.ui.uso ?? {}).sort((a, b) => b[1].t - a[1].t).slice(0, max).map(([id]) => id); }
  /** Mais usados: contagem com peso maior para o que foi usado há pouco (meia-vida de ~7 dias). */
  maisUsados(max = 6) {
    const agora = Date.now();
    return Object.entries(this.ui.uso ?? {}).map(([id, v]) => [id, v.n * Math.pow(0.5, (agora - v.t) / 6.048e8)]).sort((a, b) => b[1] - a[1]).slice(0, max).map(([id]) => id);
  }

  salvarUI() {
    try {
      const { flyout, grupoAberto, ...resto } = this.ui;
      localStorage.setItem(CHAVE_UI, JSON.stringify(resto));
    } catch { /* armazenamento indisponível: segue sem lembrar */ }
  }
  /** Liga/desliga uma opção. padraoLigado: valores ausentes contam como ligados. */
  alternarUI(chave, padraoLigado = false) {
    this.ui[chave] = padraoLigado ? this.ui[chave] === false : !this.ui[chave];
    this.salvarUI();
    this.render();
  }
  /** Ao sair do híbrido, a tela volta ao tamanho que tinha antes de ser ajustada ao espaço real. */
  restaurarTela() {
    const t = this.ui.telaAntes; this.ui.telaAntes = null;
    if (t && (t.largura !== this.n.tela.largura || t.altura !== this.n.tela.altura)) this.n.definir("__canvas", t, "Tela volta ao tamanho original");
  }
  setModo(m) {
    if (m === "previa") {
      this.primeiros?.marcar("previa");
      if (this.janelaTeste) this.janelaTeste.restaurar();
      else this.janelaTeste = new JanelaTeste(this);
      return;
    }
    if(this.ui.hibrido && !["codigo","code","forja","visual-script","web"].includes(m)) this.estudio?.pararPrevia();
    trocarArea(this.ui,m);
    if(m==="web")this.ui.vsAba="codigoEl";
    this.ui.flyout = null; this.ui.grupoAberto = null;
    this.barra?.fecharFerramentas();
    this.ribbon?.fecharMenus();
    this.salvarUI();
    this.render();
    setTimeout(() => { if (m === "designer" && this.ui.hibrido) this.ajustarTelaReal(); else if (m === "previa") this.render(); }, 50);
  }
  estreito() { return window.innerWidth < 900; }
  abrirPainelEsq(nome) {
    if(this.ui.hibrido)this.setModo("designer");
    this.ui.esq = nome;
    if (nome && !this.ui.hibrido) this.ui.dir = [];
    this.salvarUI();
    this.render();
  }
  alternarPainelDir(nome) {
    this.ui.dir = (this.ui.dir ?? []).includes(nome) ? [] : [nome];
    if (!this.ui.hibrido) this.ui.esq = null;
    this.salvarUI();
    this.render();
  }
  abrirPainelDir(nome) {
    if(this.ui.hibrido)this.setModo("designer");
    this.ui.dir = [nome];
    if (!this.ui.hibrido) this.ui.esq = null;
    this.salvarUI();
    this.render();
    requestAnimationFrame(() => this.dir.paineis.querySelector(`[data-painel="${nome}"]`)?.scrollIntoView({ block: "nearest" }));
  }

  // ---------------- render ----------------
  /** Clique na tela no modo formulário: seleciona e abre a aba de edição completa do elemento. */
  aoClicarNaTela(id, somar) {
    this.n.selecionar(id, { somar });
    if (!somar) { this.ui.dockAba = "elemento"; this.ui.dockItem = this.n.elemento(id)?.construtor ?? null; this.salvarUI(); this.render(); }
  }

  alternarHibrido() {
    this.setModo(this.ui.hibrido ? "designer" : "forja");
  }
  /** Ajusta somente a visualização: o híbrido não altera a tela nem o histórico. */
  ajustarTelaReal() {
    // Redimensionar painéis ou trocar de modo nunca altera o documento.
  }
  /** Divide o espaço entre canvas e editor inferior (grade do .meio). */
  aplicarDock() {
    if (this.ui.hibrido) { this.dir.raiz.parentElement.style.gridTemplateRows = "minmax(0,1fr)"; return; }
    const meio = this.dir.raiz.parentElement;
    if (!meio) return;
    meio.classList.toggle("forja-construcao",!!this.ui.hibrido&&this.ui.dockAba==="blocos");
    const ativo = !!this.ui.hibrido && this.ui.modo === "designer";
    meio.classList.toggle("hibrido", ativo);
    meio.classList.toggle("insp-fixo", !ativo && this.ui.inspetorFixo !== false && (this.ui.dir ?? []).includes("inspetor"));
    const aberto = ativo && !this.dir.raiz.hidden;
    const a = this.ui.dockAlt ?? 0.36;
    meio.style.gridTemplateRows = aberto ? `minmax(0,${(1 - a).toFixed(3)}fr) minmax(0,${a.toFixed(3)}fr)` : "";
  }

  /** Tab: esconde faixa, barra, painéis e status para ver só a arte; Tab de novo traz tudo de volta. */
  alternarSemInterface() {
    this.semInterface = !this.semInterface;
    document.documentElement.classList.toggle("sem-interface", this.semInterface);
    this.mensagem(this.semInterface ? "Interface oculta. Tab ou Esc traz de volta." : "Interface visível.");
  }
  render() {
    const restaurarFoco = capturarFoco();
    this.ribbon.render();
    this.barra.render();
    this.esq.render();
    if (!this.ui.hibrido) this.dir.render();
    this.aplicarDock();
    if (!this.ui.hibrido) this.area.render();
    if (this.ui.hibrido) {this.estudio.render();this.estudio.raiz.prepend(this.caixaFerramentas.raiz);}
    else this.esq.raiz.before(this.caixaFerramentas.raiz);
    this.caixaFerramentas.render();
    this.area.raiz.inert=!!this.ui.hibrido;
    this.estudio.raiz.inert=!this.ui.hibrido;
    document.getElementById("app").dataset.workspace=this.ui.areaAtiva;
    this.area.raiz.classList.toggle("hp-aramado",!!this.ui.hpAramado);
    this.renderStatus();
    this.ambiente?.render();
    restaurarFoco();
  }

  aoMudar(motivo) {
    if (this.estudio?._selecionandoObjeto) { this.renderStatus(); return; }
    if (motivo === "persistencia" || motivo === "recuperacao") avisar(this.n.erroSalvamento ?? this.n.avisoRecuperacao, "alerta");
    const r = this.n.ultimoResultado;
    if (motivo === "documento" && r) {
      if (r.regressoesCorrigidas?.length) {
        const lista = r.regressoesCorrigidas.map(d => `${this.n.rotulo(d.alvo)}.${d.propriedade}`).join(", ");
        this.mensagem(`Protegido: desfiz uma mudança não pedida em ${lista}.`, "alerta");
        avisar(`Mudança não pedida em ${lista} foi desfeita.`, "alerta");
      } else if (r.avisos?.length) {
        this.mensagem(r.avisos.join(" "), "ok");
      } else if (r.acao === "aplicado_parcial") {
        this.mensagem("Aplicado no resto. Falta decidir sobre o que você definiu antes.", "alerta");
      } else if (r.acao === "cancelado") {
        this.mensagem("Mantido como estava.", "ok");
      } else if (r.acao === "aplicado") {
        const texto = this.n.historico().itens.at(-1)?.texto;
        if (!this.conferirContratoDaSelecao()) this.mensagem(texto ?? "Aplicado.");
        this.primeiros.observar(texto);
      }
      this.n.ultimoResultado = null;
    }
    if (motivo === "historico") {
      const { itens, cursor } = this.n.historico();
      this.mensagem(cursor ? `No ponto ${cursor}: ${itens[cursor - 1].texto}` : "No início do projeto.");
    }
    this.render();
    if (motivo === "pergunta") this.perguntar(this.n.pendente());
  }

  // ---------------- status ----------------
  criarStatus() {
    const zoom = h("input", { type: "range", min: "10", max: "400", step: "5", "aria-label": "Zoom", oninput: e => { this.definirZoom(Number(e.target.value) / 100); } });
    const pct = h("span", { class: "num", style: "min-width:38px;text-align:right" });
    const msg = h("span", { class: "msg", role: "status", "aria-live": "polite" });
    const prot = h("span", { class: "st opcional", title: "Decisões suas protegidas neste projeto" });
    const salvo = h("span", { class: "st" });
    const ferramenta = h("span", { class: "st opcional", style: "color:var(--texto)" });
    const agente = h("button", { type: "button", class: "st bt-texto opcional", style: "border:0;padding:0 4px", onclick: () => this.abrirPainelEsq("agente") });
    const sugestao = h("span", { class: "st sugestao", hidden: true });
    const raiz = h("footer", { class: "status" },
      h("span", { class: "st" }, botaoIcone("menos", "Diminuir zoom", () => this.zoomPasso(-0.1), { tam: 14 }), zoom, botaoIcone("mais", "Aumentar zoom", () => this.zoomPasso(0.1), { tam: 14 }), pct,
        h("button", { type: "button", class: "bt-texto opcional", style: "padding:1px 6px;border-style:solid", onclick: () => { if(this.ui.hibrido){this.estudio.enquadrar();this.renderStatus();}else{this.ui.zoom = this.area.ajustarZoom(); this.render();} } }, "Ajustar tela"),
        h("button", { type:"button", class:"bt-texto", title:"Ampliar e centralizar os elementos visíveis sem redimensionar o projeto", style:"padding:1px 6px;border-style:solid", onclick:()=>this.ui.hibrido?this.estudio.enquadrar():this.area.enquadrarConteudo() }, "Enquadrar conteúdo")),
      ferramenta, sugestao, msg, agente, prot, salvo);
    return { sugestao, raiz, zoom, pct, msg, prot, salvo, agente, ferramenta };
  }
  renderStatus() {
    const s = this.status;
    const z = this.ui.hibrido && this.estudio?.s ? this.estudio.cam().z : this.ui.zoom ?? 1;
    s.zoom.value = String(Math.round(z * 100));
    s.pct.textContent = `${Math.round(z * 100)}%`;
    const prot = this.n.projeto.memoria.ativas().filter(d => d.status === "protegida" && !d.alvo.startsWith("__") && !["tipo", "nome", "z"].includes(d.propriedade)).length;
    s.prot.innerHTML = `${icone("escudo", 14)}<span class="num">${prot}</span> protegidas`;
    const NOMES_F = { selecao: "Selecionar", mao: "Mão", zoom: "Lupa", caixa: "Caixa", elipse: "Elipse", linha: "Linha", texto: "Texto", botao: "Botão", conta: "Conta-gotas", pincel: this.pincel?.continuo ? "Pincel contínuo" : "Pincel de formatação" };
    s.ferramenta.textContent = contextoSelecao(this.n,this.ui.hibrido);
    const qtd = this.n.selecionados().length;
    s.ferramenta.textContent += qtd > 1 ? ` · ${qtd} selecionados` : "";
    this.renderSugestao();
    const modo = this.painelAgente?.modo;
    s.agente.innerHTML = `${icone("chat", 14)}<span>${this.agente?.ocupado ? "Agente trabalhando…" : modo === "claude" ? "Agente: Claude" : modo === "local" ? "Agente: local" : "Agente"}</span>`;
    s.salvo.title = `Hephaestus ${VERSAO} · Preview de desenvolvimento`;
    s.salvo.innerHTML = `<span class="ponto ${this.n.sujo ? "alerta" : ""}"></span>${this.n.sujo ? "Não salvo em arquivo" : "Salvo"} · v${VERSAO}`;
  }
  /** Sugestão inline: o primeiro problema corrigível do elemento selecionado, com Aplicar / dispensar. */
  renderSugestao() {
    const el = this.status.sugestao;
    const id = this.n.selecionados().length === 1 ? this.n.selecao : null;
    this.dispensadas ??= new Set();
    const item = id ? this.n.auditar().find(i => i.id === id && i.correcao && !this.dispensadas.has(`${i.id}|${i.regra}`)) : null;
    if (!item) { el.hidden = true; el.replaceChildren(); return; }
    el.hidden = false;
    el.title = item.mensagem;
    el.replaceChildren(
      h("span", {}, "Sugestão: " + item.resumo),
      h("button", { type: "button", class: "bt-texto", style: "padding:0 6px;border-style:solid", onclick: () => { this.n.definirVarios({ [item.id]: item.correcao }, `Sugestão: ${item.resumo}`); } }, "Aplicar"),
      h("button", { type: "button", class: "bt-texto", "aria-label": "Dispensar sugestão", style: "padding:0 6px;border:0", onclick: () => { this.dispensadas.add(`${item.id}|${item.regra}`); this.renderSugestao(); } }, "×"));
  }
  mensagem(texto, tipo = "") {
    this.status.msg.textContent = texto;
    this.status.msg.className = `msg ${tipo}`;
  }
  setFerramenta(id) {
    if(id!=='pincel')this.pincel=null;
    this.ui.ferramenta = id;
    if (id !== "selecao" && this.ui.modo !== "designer") this.ui.modo = "designer";
    this.salvarUI();
    this.render();
    const f = { selecao: "Selecionar", mao: "Mão: arraste para mover a tela", zoom: "Lupa: clique aproxima, Alt+clique afasta", caixa: "Caixa: arraste na tela para desenhar", elipse: "Elipse: arraste para desenhar (Shift: círculo)", linha: "Linha: arraste do início ao fim", texto: "Texto: clique onde o texto deve ficar", botao: "Botão: clique ou arraste para desenhar", caneta: "Caneta: clique cria vértice, arraste cria curva, clique no 1º ponto fecha, Enter termina", conta: "Conta-gotas: clique num elemento para copiar a cor dele para a seleção" }[id];
    if (f) this.mensagem(f);
  }

  /** Entra na edição de nós (converte formas/caixas/elipses em vetor se preciso). */
  ativarPincel() {
    const agora=Date.now();
    if(this.pincel&&this.ui.ferramenta==='pincel') {
      if(agora-this.pincel.inicio<650){this.pincel.continuo=true;this.render();this.mensagem('Pincel contínuo: clique nos destinos. Esc encerra.');}
      else this.setFerramenta('selecao');
      return;
    }
    const ids=this.n.selecionados();
    if(ids.length!==1){this.mensagem('Selecione um único elemento para copiar a formatação.');return;}
    const origem=this.n.elemento(ids[0]);
    if(!origem?.estilo)return;
    this.pincel={origem:ids[0],formato:capturarFormatacao({...origem,id:ids[0]},true),inicio:agora,continuo:false};
    this.setFerramenta('pincel');
    this.mensagem('Pincel: clique no destino. Copia as categorias marcadas em Opções do pincel; duplo clique mantém o uso; Esc cancela.');
  }

  pintarFormatacao(id) {
    const p=this.pincel;
    if(!p||id===p.origem)return;
    const r=aplicarFormatacao(this.n,p.formato,[id],this.ui.pincelOpcoes??{visual:true,efeitos:true,interacoes:true,codigo:true});
    if(r?.acao==='ignorado'){this.mensagem('Nenhuma categoria marcada ou destino bloqueado. Confira as opções do pincel.');return;}
    if(r?.acao!=='aplicado'){this.mensagem('A alteração aguarda a resolução das decisões protegidas.');return;}
    if(!p.continuo)this.setFerramenta('selecao');
    this.mensagem(p.continuo?'Formatação aplicada. Clique em outro destino ou pressione Esc.':'Formatação aplicada. Ctrl+Z desfaz.');
  }

  editarNos(id) {
    const el = this.n.elemento(id);
    if (!el || !["forma", "caixa", "container", "botao", "elipse", "campo"].includes(el.tipo)) return false;
    if (el.tipo !== "forma" || el.forma !== "vetor") {
      const novos = this.n.converterEmVetor([id]);
      if (!novos.length) return false;
      id = novos[0];
    }
    if (this.ui.ferramenta !== "selecao") this.ui.ferramenta = "selecao";
    return this.area.caneta.editar(id);
  }

  /** Unir, subtrair, interseccionar ou excluir as formas selecionadas. */
  async combinar(op) {
    const r = await this.n.booleanaPrecisa(this.n.selecionados(), op);
    if (r.erro) this.mensagem(r.erro, "alerta");
    else this.mensagem(`Formas combinadas em um vetor${r.motor === "craft" ? " (curvas exatas, motor Craft)" : ""}. Desfazer volta ao estado anterior.`);
    return r;
  }

  /** Converter traço em forma (motor Craft, janela própria). */
  async tracoEmForma() {
    const id = this.n.selecionados()[0];
    const r = await this.n.converterTracoEmForma(id);
    if (r.erro) this.mensagem(r.erro, "alerta");
    else this.mensagem("Traço convertido em forma (motor Craft). Desfazer volta ao estado anterior.");
    return r;
  }

  definirZoom(z) {
    if(this.ui.hibrido && this.estudio?.s) {const r=this.estudio.tela.getBoundingClientRect();this.estudio.zoomEm(r.left+r.width/2,r.top+r.height/2,Math.max(.1,Math.min(2.5,z)));this.renderStatus();return;}
    this.ui.zoom = Math.max(0.1, Math.min(4, Math.round(z * 100) / 100));
    this.salvarUI();
    this.render();
  }

  /** Zoom mantendo fixo o ponto da tela sob o cursor. */
  zoomEm(z, cx, cy) {
    this.definirZoom(z);
    this.area.desenharReguas();
  }

  /** Copia a cor do elemento clicado para a seleção (Shift: cor do texto). Sem seleção, copia o código. */
  async contaGotas(idOrigem, doTexto) {
    const el = this.n.elemento(idOrigem);
    if (!el) return;
    const cor = doTexto ? el.estilo?.cor : el.estilo?.fundo;
    const alvos = this.n.selecionados().filter(id => id !== idOrigem);
    if (!alvos.length) {
      const ok = await copiar(cor);
      avisar(ok ? `Cor ${cor} copiada.` : `Cor de ${el.nome}: ${cor}`, "ok");
      return;
    }
    this.n.definirVarios(Object.fromEntries(alvos.map(id => [id, { [doTexto ? "estilo.cor" : "estilo.fundo"]: cor }])),
      `Conta-gotas: ${doTexto ? "cor do texto" : "fundo"} ${cor} de ${el.nome} em ${this.n.descreverGrupo(alvos)}`);
    this.setFerramenta("selecao");
  }

  async telaCheia() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      avisar("O navegador não permitiu tela cheia aqui. Tente F11.", "alerta");
    }
  }

  zoomPasso(d) {
    if(this.ui.hibrido && this.estudio?.s)return this.definirZoom(this.estudio.cam().z+d);
    this.ui.zoom = Math.max(0.1, Math.min(4, Math.round(((this.ui.zoom ?? 1) + d) * 20) / 20));
    this.salvarUI();
    this.render();
  }

  // ---------------- ações ----------------
  inserir(tipo) {
    if (this.ui.modo !== "designer") this.setModo("designer");
    const id = this.n.criar(tipo);

    return id;
  }

  inserirForma(forma) {
    if (this.ui.modo !== "designer") this.setModo("designer");
    const id = this.n.criar("forma", undefined, undefined, { forma });
    this.n.definir(id, { nome: `${FORMAS[forma]?.nome ?? "Forma"} ${id.split("_")[1]}` }, `Nomear ${id}`);
    return id;
  }

  /** Recolore os ELEMENTOS do canvas com uma paleta (só quando pedido explicitamente). */
  aplicarPaleta(chave) {
    const t = PALETAS[chave];
    if (!t) return;
    return this.n.aplicarEmTodos(["estilo.fundo", "estilo.cor", "estilo.borda", "fundo"], el => {
      const c = t.tipos[el.tipo];
      if (!c) return;
      [el.estilo.fundo, el.estilo.cor, el.estilo.borda] = c;
    }, `Paleta ${t.nome} nos elementos`, tela => { tela.fundo = t.tela; });
  }

  // ---------------- área de transferência (copiar, recortar e colar elementos) ----------------
  copiarSelecao(cortar = false) {
    const ids = this.n.selecionados();
    if (!ids.length) { avisar(cortar ? "Selecione o que recortar." : "Selecione o que copiar.", "alerta"); return false; }
    const todos = this.n.comDescendentes(ids);
    const b = this.n.limites(todos);
    this.prancheta = { modelo: this.n.modeloDaSelecao(ids, "Área de transferência"), x: b.x, y: b.y, vezes: 0 };
    const descr = this.n.descreverGrupo(ids);
    if (cortar) this.n.removerVarios(ids);
    this.mensagem(`${cortar ? "Recortado" : "Copiado"}: ${descr}. Cole com Ctrl+V.`, "ok");
    return true;
  }
  recortarSelecao() { return this.copiarSelecao(true); }
  colarSelecao(mesmoLugar = false) {
    const p = this.prancheta;
    if (!p) { avisar("Nada copiado ainda. Selecione elementos e use Copiar.", "alerta"); return []; }
    if (this.ui.modo !== "designer") this.setModo("designer");
    p.vezes += 1;
    const d = mesmoLugar ? 0 : 16 * p.vezes;
    const ids = this.n.inserirModelo(p.modelo, p.x + d, p.y + d);
    if (ids.length) this.mensagem(`Colado: ${ids.length} elemento${ids.length > 1 ? "s" : ""}. Um Ctrl+Z desfaz.`, "ok");
    return ids;
  }

  async copiar(o) {
    const texto = o === "json" ? JSON.stringify(this.n.serializar(), null, 2) : this.n.html();
    if (await copiar(texto)) avisar(o === "json" ? "Projeto copiado em JSON." : "HTML copiado.", "ok");
    else {
      this.setModo("web");
      this.area.codigoAba = o;
      this.area.render();
      const pre = this.area.raiz.querySelector("pre");
      const sel = getSelection();
      sel.selectAllChildren(pre);
      avisar("O navegador não deixou copiar. O código está selecionado: use Ctrl+C.", "alerta");
    }
  }

  /** Salvar (Ctrl+S) ou Salvar como (Ctrl+Shift+S). */
  async salvar(comoNovo = false) {
    const r = await this.n.salvarArquivo(comoNovo);
    if (r === "salvo") avisar(this.n.arquivoAtual() ? `Projeto salvo em ${this.n.arquivoAtual()}.` : "Projeto salvo.", "ok");
    else if (r === "indisponivel") avisar("Não deu para baixar aqui. Use Arquivo > Copiar JSON.", "alerta");
    this.render();
  }

  /** Reproduz a construção da interface passo a passo (e volta ao ponto em que estava). */
  reproduzirHistorico() {
    if (this.replay) { this.pararReplay(); return; }
    const n = this.n;
    const total = n.historico().itens.length;
    if (!total) return;
    const volta = n.historico().cursor;
    this.replay = { volta, i: 0 };
    const passo = () => {
      if (!this.replay) return;
      if (this.replay.i > total) { this.pararReplay(true); return; }
      n.irPara(this.replay.i++);
      this.replay.t = setTimeout(passo, 650);
    };
    passo();
  }

  pararReplay(fim = false) {
    if (!this.replay) return;
    clearTimeout(this.replay.t);
    const volta = this.replay.volta;
    this.replay = null;
    this.n.irPara(fim ? this.n.historico().itens.length : volta);
    this.mensagem(fim ? "Reprodução concluída." : "Reprodução interrompida; voltei ao ponto em que você estava.");
  }

  async baixarArtefato(tipo) {
    this.primeiros.marcar("exportar");
    const r = await this.n.exportarArtefato(tipo);
    if (r === "indisponivel") avisar("Não deu para baixar aqui.", "alerta");
    else this.mensagem("Arquivo gerado. Ele só leva a casca visual e emite sinais; a lógica fica com quem usa.");
  }

  async baixarDocumentacao() {
    const r = await this.n.exportarDocumentacao();
    if (r === "indisponivel") avisar("Não deu para baixar aqui.", "alerta");
    else this.mensagem("Documentação do contrato de sinais gerada (Markdown).");
  }

  exportarAplicativoWindows() { exportarWindows(this); }

  async baixarHTML() {
    this.primeiros.marcar("exportar");
    const r = await this.n.exportarHTML();
    if (r === "indisponivel") avisar("Não deu para baixar aqui. Use Arquivo > Copiar HTML.", "alerta");
  }

  abrirArquivo() {
    if (emJanelaNativa()) {
      this.confirmarDescartar("Abrir outro projeto", async () => {
        try {
          if (!(await this.n.abrirNativo())) return;
          this.ui.zoom = this.area.ajustarZoom();
          avisar(`${this.n.arquivoAtual()} aberto.`, "ok");
        } catch (e) {
          avisar(`Não abri o arquivo: ${e.message}`, "alerta");
        }
      });
      return;
    }
    this.confirmarDescartar("Abrir outro projeto", () => this.entradaArquivo.click());
  }

  async carregarArquivo(arq) {
    if (!arq) return;
    try {
      await this.n.abrirArquivo(arq);
      this.ui.zoom = this.area.ajustarZoom();
      avisar(`${this.n.nome} aberto.`, "ok");
    } catch (e) {
      avisar(`Não abri o arquivo: ${e.message}`, "alerta");
    }
    this.entradaArquivo.value = "";
  }

  async carregarSVG(arq) {
    if (!arq) return;
    try {
      const r = this.n.importarSVG(await arq.text(), undefined, undefined, arq.name.replace(/\.svg$/i, ""));
      if (r.erro) avisar(r.erro, "alerta"); else avisar(`SVG importado: ${r.formas} forma(s) editável(is).`, "ok");
    } catch (e) { avisar(`Não importei o SVG: ${e.message}`, "alerta"); }
    this.entradaSVG.value = "";
  }

  baixarSeparado() {
    const r = this.n.exportarProjetoSeparado();
    avisar(`Salvei 2 arquivos: projeto (${Math.ceil(r.bytesProjeto / 1024)} KB) e histórico (${Math.ceil(r.bytesHistorico / 1024)} KB).`, "ok");
  }
  async carregarHistorico(arq) {
    if (!arq) return;
    try {
      const r = this.n.abrirHistoricoJSONL(await arq.text());
      avisar(`Histórico aberto: ${r.passos} passo(s) e ${r.variacoes} variação(ões).`, "ok");
    } catch (e) { avisar(`Não abri o histórico: ${e.message}`, "alerta"); }
    this.entradaHistorico.value = "";
  }

  mascara() {
    const r = this.n.criarMascara(this.n.selecionados());
    this.mensagem(r.erro ?? "Máscara criada: a forma da frente recorta os outros. Desfazer volta.", r.erro ? "alerta" : "");
  }
  liberarMascara() {
    const r = this.n.liberarMascara(this.n.selecionados()[0]);
    this.mensagem(r.erro ?? "Máscara liberada.", r.erro ? "alerta" : "");
  }
  variantes(tipo) {
    const id = this.n.selecionados()[0];
    if (!id) return;
    if (tipo === "refinar") { this.n.refinar(id); this.mensagem("3 opções geradas. Clique na que gostou e use \"Manter opção\", ou diga ao agente \"mantém a opção 2\"."); }
    else if (tipo === "estilos") this.n.gerarEstilos(id);
    else this.n.gerarTamanhos(id);
  }

  novoProjeto() {
    this.confirmarDescartar("Novo projeto", () => { this.n.novo(); this.n.ajustarTelaAoMonitor(true); this.ui.zoom = this.area.ajustarZoom(); this.render(); });
  }

  confirmarDescartar(titulo, fazer) {
    if (!this.n.sujo) return fazer();
    this.dialogo({
      titulo, icone: "salvar",
      texto: "O projeto atual tem alterações que não foram salvas em arquivo. Elas continuam guardadas neste navegador, mas serão substituídas.",
      opcoes: [
        { id: "salvar", rotulo: "Salvar antes", primario: true, fazer: async () => { const salvo=await this.n.salvarArquivo(); if(salvo==="salvo")fazer();else this.mensagem("Documento atual preservado: o salvamento não foi concluído.","alerta"); } },
        { id: "seguir", rotulo: "Continuar sem salvar", fazer },
        { id: "cancelar", rotulo: "Cancelar", fazer: () => {} },
      ],
    });
  }

  mostrarSinais() {
    const sinais = this.n.elementos().flatMap(el => (el.eventos ?? []).filter(e => e.dispara).map(e => ({ el, e })));
    const corpo = sinais.length
      ? h("div", { class: "lista" }, sinais.map(({ el, e }) => h("div", { class: "item" },
          h("code", { class: "mono", style: "color:var(--acento-forte)" }, e.dispara),
          h("span", { class: "item-nome", style: "text-align:right" }, `${el.nome} · ${e.tipo}`))))
      : h("p", {}, "Nenhum elemento emite sinais ainda. Adicione eventos no painel Eventos e sinais.");
    this.dialogo({
      titulo: "Sinais emitidos por esta interface", icone: "sinal",
      texto: "Quem usa o HTML exportado escuta com document.addEventListener(\"hefestus:sinal\", e => e.detail).",
      corpo,
      opcoes: [{ id: "ok", rotulo: "Fechar", primario: true, fazer: () => {} }],
    });
  }

  /** Pergunta vinda da skill de proteção. */
  perguntar(p) {
    if (!p) return;
    const pend = this.n.pendenteCompleto();
    const ids = new Set(this.n.elementos().map(e => e.id));
    const rotuloOpcao = o => (ids.has(o.id) ? this.n.rotulo(o.id) : o.rotulo);
    let texto = p.contexto.replace(/\b([a-z]+_\d+)\b/g, m => this.n.rotulo(m));
    if (pend?.tipo === "conflito") texto = `Apliquei "${pend.pedido.texto}" no resto. Isto foi definido por você e ficou como estava: ${this.n.descrever(pend.envolvidos)}.`;
    if (pend?.tipo === "falha_correcao") texto = `"${pend.pedido.texto}" mudaria ${this.n.descrever(pend.envolvidos)}, que você definiu, e não consegui evitar. Nada foi aplicado.`;
    this.dialogo({
      titulo: p.pergunta, icone: "escudo", texto,
      opcoes: p.opcoes.map(o => ({ id: o.id, rotulo: rotuloOpcao(o), primario: o.id === p.padrao, fazer: () => this.n.responder(o.id) })),
      aoFecharSem: () => this.n.responder(p.padrao),
    });
  }

  dialogo({ titulo, icone: ic, texto, corpo, opcoes, aoFecharSem }) {
    const anterior = document.activeElement;
    const tituloId="dlg-titulo-"+(this._dialogoSeq=(this._dialogoSeq??0)+1);
    const fechar = () => { veu.remove(); document.removeEventListener("keydown", esc, true); anterior?.focus?.(); };
    const esc = e => {
      if([...document.querySelectorAll('.veu')].at(-1)!==veu)return;
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dispensar();}
      if(e.key==='Tab'){const bs=[...veu.querySelectorAll('button:not(:disabled),input:not(:disabled):not([type="hidden"]),textarea:not(:disabled),select:not(:disabled),a[href]')].filter(b=>b.getClientRects().length);const primeiro=bs[0],ultimo=bs.at(-1);if(!primeiro){e.preventDefault();return;}if(e.shiftKey&&(document.activeElement===primeiro||!veu.contains(document.activeElement))){e.preventDefault();ultimo.focus();}else if(!e.shiftKey&&(document.activeElement===ultimo||!veu.contains(document.activeElement))){e.preventDefault();primeiro.focus();}}
    };
    const encerramento = (opcoes ?? []).find(o => /^(fechar|cancelar)$/.test(o.id ?? "") || /^(fechar|cancelar|voltar ao projeto)$/i.test(o.rotulo.trim()));
    const dispensar = () => { fechar(); if (aoFecharSem) aoFecharSem(); else encerramento?.fazer?.(); };
    const btFechar = botaoIcone("fechar", "Fechar " + titulo, dispensar);
    const botoes = (opcoes ?? []).filter(o => o !== encerramento).map(o => h("button", { type: "button", class: `bt ${o.primario ? "primario" : ""}`, onclick: () => { fechar(); o.fazer(); } }, o.rotulo));
    const veu = h("div", { class: "veu" },
      h("div", { class: "dialogo", role: "dialog", "aria-modal": "true", "aria-labelledby": tituloId },
        h("header", { class: "dialogo-cabecalho" }, h("h2", { id: tituloId }, h("span", { html: icone(ic ?? "escudo", 18) }), titulo), btFechar),
        h("div", { class: "dialogo-conteudo" }, texto ? h("p", {}, texto) : null, corpo ?? null),
        botoes.length ? h("div", { class: "acoes" }, botoes) : null));
    document.body.append(veu);
    document.addEventListener("keydown", esc, true);
    (botoes.find(b => b.classList.contains("primario")) ?? botoes[0] ?? btFechar)?.focus();
    return fechar;
  }

  // ---------------- teclado ----------------
  teclado(e) {
    if(e.key==="F7" && !e.defaultPrevented){e.preventDefault();this.setModo(this.ui.hibrido?"designer":"visual-script");return;}
    const hpDigitando=e.target.closest?.("input,textarea,select,[contenteditable]");
    if(!e.defaultPrevented && !this.ui.hibrido && !hpDigitando) {
      const ctrl=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
      if(ctrl && k==="y"){e.preventDefault();this.alternarUI("hpAramado");return;}
      if(ctrl && k==="b"){e.preventDefault();this.colarNaCamada("tras");return;}
      if(ctrl && k==="f"){e.preventDefault();this.colarNaCamada("frente");return;}
      if(!ctrl && !e.altKey && k==="a"){e.preventDefault();this.editarSelecaoDireta();return;}
    }
    if (this.ui.hibrido && !e.defaultPrevented) {
      const ctrl=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
      if (ctrl && k==="s") { e.preventDefault(); this.salvar(e.shiftKey); }
      else if (ctrl && k==="z") { e.preventDefault(); e.shiftKey?this.n.refazer():this.n.desfazer(); }
      else if (ctrl && k==="y") { e.preventDefault(); this.n.refazer(); }
      if (!e.defaultPrevented) this.estudio?.tecla(e,!!e.target.closest?.("input,textarea,select,[contenteditable]"));
      return;
    }
    if (!e.defaultPrevented && e.key==="F7") {e.preventDefault();this.setModo(this.ui.hibrido?"designer":"visual-script");return;}
    if (e.defaultPrevented) return; // a Prévia já tratou (ex.: Esc fechando um menu)
    if (this.ui.hibrido && this.ui.dockAba === "blocos" && e.target.closest?.('.oficina-em-blocos')) return;
    const alvo = e.composedPath?.()[0] ?? e.target;
    // Atalhos do artefato pertencem à prévia, inclusive dentro do Shadow DOM.
    if (this.ui.modo === "previa" && this.area.arte?.contains(alvo)) return;
    const digitando = alvo.closest?.("input, textarea, select, [contenteditable]");
    const ctrl = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (document.querySelector(".veu:not([hidden])")) return;
    if(e.key==='Escape'&&this.ui.ferramenta==='pincel'){e.preventDefault();this.setFerramenta('selecao');this.mensagem('Pincel encerrado.');return;}
    if (!digitando && e.key === "Escape" && this.ui.grupoEdicao) {
      e.preventDefault(); const id = this.ui.grupoEdicao; this.ui.grupoEdicao = null;
      this.n.selecionar(id); this.mensagem("Seleção do grupo. Duplo clique entra; Alt+clique seleciona uma peça."); return;
    }
    if (this.agente.ocupado) {
      if (e.key === "Escape") this.painelAgente.parar();
      return;
    }

    if (e.key === "Tab" && !ctrl && !e.altKey && !digitando && this.ui.modo === "designer" && (alvo === document.body || alvo.closest?.(".area"))) {
      e.preventDefault(); this.alternarSemInterface(); return;
    }
    if (ctrl && e.key === "F1") { e.preventDefault(); this.ribbon.alternarRecolhido(); return; }
    if (e.key === "F6") { e.preventDefault(); this.alternarBarra(); return; }

    if (e.key === "F7" || (ctrl && e.shiftKey && (k === "o" || k === "O"))) { e.preventDefault(); this.ribbon.btOficina?.click(); return; }
    if (e.key === "F10" && this.ui.estiloMenu === "classico") { e.preventDefault(); this.ribbon.focarMenubar(); return; }
    if (e.key === "F1" && !ctrl) { e.preventDefault(); this.mostrarAtalhos(); return; }
    if (ctrl && k === "s") { e.preventDefault(); this.salvar(e.shiftKey); return; }
    if (ctrl && (k === "p" || k === "f" || k === "k")) { e.preventDefault(); this.barra.focarBusca(); return; }
    if (digitando) return;
    if (ctrl && k === "z" && !e.shiftKey) { e.preventDefault(); this.n.desfazer(); return; }
    if (ctrl && (k === "y" || (k === "z" && e.shiftKey))) { e.preventDefault(); this.n.refazer(); return; }
    if (ctrl && (k === "=" || k === "+")) { e.preventDefault(); this.zoomPasso(0.1); return; }
    if (ctrl && k === "-") { e.preventDefault(); this.zoomPasso(-0.1); return; }
    if (ctrl && k === "0") { e.preventDefault(); this.definirZoom(this.area.ajustarZoom()); return; }
    if (ctrl && k === "1") { e.preventDefault(); this.definirZoom(1); return; }

    if (this.ui.modo !== "designer") {
      if (e.key === "Escape" && this.ui.modo === "previa") this.setModo("designer");
      return;
    }
    const cn = this.area.caneta;
    if (cn.pena) {
      if (e.key === "Enter") { e.preventDefault(); cn.finalizar(false); return; }
      if (e.key === "Escape") { e.preventDefault(); if (cn.pena.nos.length >= 2) cn.finalizar(false); else cn.cancelar(); return; }
      if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); cn.apagarUltimo(); return; }
    }
    if (cn.edicao) {
      if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); cn.sair(); return; }
      if ((e.key === "Backspace" || e.key === "Delete") && cn.edicao.sel) { e.preventDefault(); cn.apagarNo(); return; }
    }
    // Tab / Shift+Tab percorrem os objetos (como no PowerPoint)
    if (e.key === "Tab" && !ctrl && !e.altKey && this.area.prancheta && (this.area.raiz.contains(alvo) || alvo === document.body)) {
      const lista = this.n.elementos().filter(x => !x.travado && x.visivel !== false && x.tipo !== "container");
      if (lista.length) {
        e.preventDefault();
        const atual = lista.findIndex(x => x.id === this.n.selecionado()?.id);
        const prox = (atual + (e.shiftKey ? -1 : 1) + lista.length) % lista.length;
        this.n.selecionar(lista[atual < 0 && e.shiftKey ? lista.length - 1 : atual < 0 ? 0 : prox].id);
      }
      return;
    }
    if (ctrl && e.shiftKey && k === "a") { e.preventDefault(); this.n.inverterSelecao(); return; }
    if (ctrl && k === "a") { e.preventDefault(); this.n.selecionarTudo(); return; }
    if (ctrl && k === "c" && this.n.selecionados().length) { e.preventDefault(); this.copiarSelecao(); return; }
    if (ctrl && k === "x" && this.n.selecionados().length) { e.preventDefault(); this.recortarSelecao(); return; }
    if (ctrl && k === "v" && this.prancheta) { e.preventDefault(); this.colarSelecao(e.shiftKey); return; }

    // espaço segurado: mão temporária
    if (e.key === " " && !e.repeat) {
      e.preventDefault();
      this.area.espaco = true;
      this.area.raiz.classList.add("ferr-mao");
      return;
    }

    // atalhos de ferramenta (uma letra, sem modificadores)
    if (!ctrl && !e.altKey) {
      const ferr = { v: "selecao", h: "mao", z: "zoom", m: "caixa", r: "caixa", e: "elipse", l: "linha", t: "texto", b: "botao", i: "conta", p: "caneta" }[k];
      if (e.shiftKey && (k === "h" || k === "v") && this.n.selecionados().length) {
        e.preventDefault();
        this.n.espelhar(this.n.selecionados(), k === "h" ? "H" : "V");
        return;
      }
      if (ferr && !e.shiftKey) { e.preventDefault(); this.setFerramenta(ferr); return; }
    }

    const ids = this.n.selecionados();
    if (e.key === "Escape") {
      if (this.ui.ferramenta !== "selecao") this.setFerramenta("selecao");
      else this.n.selecionar(null);
      return;
    }
    if (!ids.length) return;
    if (ctrl && k === "d") { e.preventDefault(); this.n.duplicarVarios(ids); return; }
    if (ctrl && k === "g") { e.preventDefault(); if (e.shiftKey) this.desagrupar(); else this.agrupar(); return; }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); this.n.removerVarios(ids); return; }
    if (ctrl && k === "]") { e.preventDefault(); this.n.camadaVarios(ids, "frente"); return; }
    if (ctrl && k === "[") { e.preventDefault(); this.n.camadaVarios(ids, "tras"); return; }
    const setas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (setas[e.key]) {
      e.preventDefault();
      const passo = e.shiftKey ? 8 : 1;
      const [dx, dy] = setas[e.key];
      this.n.moverVarios(ids, dx * passo, dy * passo);
    }
  }

  tecladoSolto(e) {
    if (e.key === " " && this.area.espaco) {
      this.area.espaco = false;
      this.area.raiz.classList.remove("ferr-mao");
      this.area.raiz.classList.add(`ferr-${this.area.ferramenta}`);
    }
  }

  // ---------------- projeto de exemplo ----------------
  exemplo() {
    const n = this.n;
    n.definir("__canvas", { nome: "Tela de login (exemplo)", largura: 960, altura: 600, fundo: "#eef1f6" }, "Criar projeto de exemplo");
    const card = n.criar("caixa", 300, 90, { largura: 360, altura: 400 });
    n.definir(card, { "estilo.fundo": "#ffffff", "estilo.borda": "#dbe1ea", "estilo.raio": 14, "estilo.sombra": "media", nome: "Cartão de login" }, "Estilizar cartão de login");
    const titulo = n.criar("texto", 336, 122, { largura: 288, altura: 34 });
    n.definir(titulo, { texto: "Entrar na conta", "estilo.tamanhoFonte": 22, "estilo.peso": 600, nome: "Título" }, "Escrever título");
    const email = n.criar("campo", 336, 186, { largura: 288 });
    n.definir(email, { placeholder: "seu@email.com", "acessibilidade.ariaLabel": "E-mail", nome: "Campo de e-mail" }, "Configurar campo de e-mail");
    const senha = n.criar("campo", 336, 240, { largura: 288 });
    n.definir(senha, { placeholder: "Senha", "acessibilidade.ariaLabel": "Senha", nome: "Campo de senha" }, "Configurar campo de senha");
    const lembrar = n.criar("toggle", 336, 298);
    n.definir(lembrar, { "acessibilidade.ariaLabel": "Lembrar de mim", nome: "Lembrar de mim" }, "Configurar lembrar de mim");
    const rotuloLembrar = n.criar("texto", 398, 300, { largura: 200, altura: 24 });
    n.definir(rotuloLembrar, { texto: "Lembrar de mim", "estilo.tamanhoFonte": 14, "estilo.cor": "#475569", nome: "Rótulo Lembrar" }, "Escrever rótulo do toggle");
    const toast = n.criar("toast", 340, 528, { iniciaAberto: false });
    n.definir(toast, { mensagem: "Enviamos um link de acesso para o seu e-mail", largura: 360, nome: "Aviso de envio" }, "Configurar aviso");
    const entrar = n.criar("botao", 336, 352, { largura: 288, altura: 44 });
    n.definir(entrar, {
      rotulo: "Entrar", nome: "Botão Entrar",
      eventos: [{ tipo: "onClick", dispara: "login_enviado", acao: "abrir", alvo: toast }],
    }, "Ligar Entrar ao aviso");
    const esqueci = n.criar("botao", 336, 410, { largura: 288, altura: 36 });
    n.definir(esqueci, {
      rotulo: "Esqueci a senha", nome: "Esqueci a senha",
      "estilo.fundo": "transparent", "estilo.cor": "#2563eb", "estilo.borda": "transparent", "estilo.peso": 400, "estados.hover.fundo": "#eff6ff",
      eventos: [{ tipo: "onClick", dispara: "recuperar_senha", acao: "", alvo: "" }],
    }, "Configurar Esqueci a senha");
    // O exemplo é o ponto de partida: o histórico começa limpo a partir dele.
    n.projeto.historico = [];
    n.projeto.cursor = 0;
    n.selecionar(null);
    n.sujo = false;
  }
}

/** Junta à App os métodos de outros módulos (mesma classe, arquivos menores). */
for (const fonte of [Aparencia, Biblioteca, ArmazemApp, HephaestusApp]) {
  for (const nome of Object.getOwnPropertyNames(fonte.prototype)) {
    if (nome !== "constructor") Object.defineProperty(App.prototype, nome, Object.getOwnPropertyDescriptor(fonte.prototype, nome));
  }
}

// acessível no console do navegador para depuração: hefestus.n.doc, hefestus.render()
globalThis.hefestus = new App(document.getElementById("app"));
globalThis.hephaestus=globalThis.hefestus;
iniciarCelular(globalThis.hefestus);
// abertura com marteladas e a voz "Hephaestus" (Exibir > Abertura com sons desliga)
if(globalThis.hefestus.ui.abertura!==false) mostrarAbertura({sons:globalThis.hefestus.ui.sons!==false,reduzirMovimento:!!globalThis.hefestus.ui.reduzirMovimento});
if(typeof globalThis.__HEFESTUS_ARQUIVO_INICIAL__==='string') {
  const conteudo=globalThis.__HEFESTUS_ARQUIVO_INICIAL__;
  globalThis.__HEFESTUS_ARQUIVO_INICIAL__=null;
  setTimeout(()=>globalThis.hefestus.confirmarDescartar('Abrir arquivo Hephaestus',()=>{
    try {globalThis.hefestus.n.abrirTexto(conteudo);globalThis.hefestus.setModo('designer');globalThis.hefestus.area.enquadrarConteudo();globalThis.hefestus.render();}
    catch(e){avisar('Não foi possível abrir o projeto: '+e.message,'alerta');}
  }),0);
}
