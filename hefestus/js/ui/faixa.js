// Faixa de Opções: o estado e o comportamento da faixa, como no PowerPoint/Office.
//  • recolher/fixar (Ctrl+F1) e abas que podem ser ocultadas
//  • Barra de Acesso Rápido personalizável (acima ou abaixo da faixa)
//  • menu de contexto (botão direito) na faixa, nas abas e em cada comando
// A classe guarda só o estado (em app.ui, salvo no navegador) e monta menus e diálogos;
// quem desenha a faixa (Ribbon) pergunta a ela o que mostrar.
import { h, avisar } from "./dom.js";
import { icone } from "./icones.js";
/** Comandos que já vêm na Barra de Acesso Rápido, na ordem de fábrica. */
const QAT_PADRAO = ["_salvar", "_desfazer", "_refazer", "_barra", "_previa"];

class FaixaDeOpcoes {
  constructor(ribbon) {
    this.r = ribbon;
    this.menu = null;
    this._fora = e => { if (this.menu && !this.menu.contains(e.target)) this.fecharMenu(); };
    this._esc = e => { if (e.key === "Escape" && this.menu) { e.stopPropagation(); this.fecharMenu(true); } };
  }

  get app() { return this.r.app; }
  get ui() { return this.r.app.ui; }
  salvar() { this.app.salvarUI(); this.app.render(); }

  // ---------- estado ----------
  get recolhida() { return !!this.ui.ribbonRecolhido; }
  alternarRecolhida() { this.r.alternarRecolhido(); }

  get qatIds() { return Array.isArray(this.ui.qat) ? this.ui.qat : QAT_PADRAO; }
  get qatAbaixo() { return !!this.ui.qatAbaixo; }
  set qatAbaixo(v) { this.guardarLayout(); this.ui.qatAbaixo = !!v; this.salvar(); }
  get abasOcultas() { return Array.isArray(this.ui.abasOcultas) ? this.ui.abasOcultas : []; }

  /** Abas que aparecem: as ocultas saem, menos a que está em uso e as contextuais. */
  abasVisiveis(todas) {
    const oc = new Set(this.abasOcultas);
    const v = todas.filter(a => a.contexto || !oc.has(a.id));
    return v.length ? v : todas;
  }

  noQat(id) { return this.qatIds.includes(id); }
  adicionarAoQat(id) { if (!this.noQat(id)) { this.guardarLayout(); this.ui.qat = [...this.qatIds, id]; this.salvar(); avisar("Adicionado à Barra de Acesso Rápido.", "ok"); } }
  removerDoQat(id) { this.guardarLayout(); this.ui.qat = this.qatIds.filter(x => x !== id); this.salvar(); }
  restaurar() { this.ui.qat = null; this.ui.qatAbaixo = false; this.ui.abasOcultas = []; this.salvar(); }

  // ---------- menu de contexto ----------
  /** Itens do menu, no padrão do PowerPoint. `cmd` é o comando clicado, se houver. */
  itensMenu(cmd,grupo=null) {
    const lista = [];
    lista.push({rotulo:"Layouts salvos, importar e restaurar…",ic:"design",fazer:()=>this.layouts()},
      {rotulo:"Desfazer alteração de layout",ic:"desfazer",desab:!this.ui.layoutAnterior,fazer:()=>this.desfazerLayout()},"-");
    lista.push({rotulo:"Organizar esta aba",ic:"design",fazer:()=>this.organizarEscopo()},
      {rotulo:"Densidade compacta / confortável",ic:"ferramentas",fazer:()=>{this.guardarLayout();this.ui.densidadeFaixa=this.ui.densidadeFaixa==='compacta'?'confortavel':'compacta';this.salvar();}},"-");
    if(grupo){
      lista.push({rotulo:"Organizar este grupo",ic:"design",fazer:()=>this.organizarEscopo(grupo)});
      const chave=this.ui.aba+'::'+grupo;
      lista.push({rotulo:this.ui.gruposFixados?.[chave]?'Desafixar grupo':'Fixar grupo',ic:'alfinete',fazer:()=>{this.guardarLayout();this.ui.gruposFixados??={};this.ui.gruposFixados[chave]=!this.ui.gruposFixados[chave];this.salvar();}},
        {rotulo:this.ui.gruposRecolhidos?.[chave]?'Expandir grupo':'Recolher grupo',ic:'setaBaixo',fazer:()=>{this.guardarLayout();this.ui.gruposRecolhidos??={};this.ui.gruposRecolhidos[chave]=!this.ui.gruposRecolhidos[chave];this.ui.grupoAberto=null;this.salvar();}},'-');
    }
    if (cmd) {
      lista.push(this.noQat(cmd.id)
        ? { rotulo: "Remover da Barra de Acesso Rápido", ic: "menos", fazer: () => this.removerDoQat(cmd.id) }
        : { rotulo: "Adicionar à Barra de Acesso Rápido", ic: "mais", fazer: () => this.adicionarAoQat(cmd.id) }, "-");
    }
    lista.push(
      { rotulo: "Personalizar a Barra de Ferramentas de Acesso Rápido…", ic: "ferramentas", fazer: () => this.personalizarQat() },
      { rotulo: this.qatAbaixo ? "Mostrar a Barra de Acesso Rápido acima da Faixa de Opções" : "Mostrar a Barra de Acesso Rápido abaixo da Faixa de Opções", ic: this.qatAbaixo ? "setaCima" : "setaBaixo", fazer: () => { this.qatAbaixo = !this.qatAbaixo; } },
      "-",
      { rotulo: "Personalizar a Faixa de Opções…", ic: "engrenagem", fazer: () => this.personalizarFaixa() });
    if (!this.r.classico) lista.push({ rotulo: this.recolhida ? "Fixar a Faixa de Opções" : "Recolher a Faixa de Opções", atalho: "Ctrl+F1", ic: this.recolhida ? "alfinete" : "setaCima", fazer: () => this.alternarRecolhida() });
    return lista;
  }

  abrirMenu(x, y, cmd,grupo=null) {
    this.fecharMenu();
    this.r.metricaInteracao("menu-contexto");
    const itens = this.itensMenu(cmd,grupo);
    const menu = h("div", { class: "menu-ctx", role: "menu", "aria-label": "Faixa de Opções" },
      itens.map(i => i === "-"
        ? h("div", { class: "menu-ctx-sep", role: "separator" })
        : h("button", { type: "button", role: "menuitem", class: "menu-ctx-item", disabled:!!i.desab, onclick: () => { this.fecharMenu(); i.fazer(); } },
            h("span", { class: "mc-ic", html: icone(i.ic ?? "caixa", 15) }), h("span", { class: "mc-rot" }, i.rotulo), i.atalho ? h("span", { class: "mc-at" }, i.atalho) : null)));
    menu.addEventListener("keydown", e => {
      const bs = [...menu.querySelectorAll("button:not(:disabled)")];
      const i = bs.indexOf(document.activeElement);
      if (e.key === "Home") { e.preventDefault(); bs[0]?.focus(); }
      if (e.key === "End") { e.preventDefault(); bs.at(-1)?.focus(); }
      if (e.key === "Tab") { this.fecharMenu(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
    });
    document.body.append(menu);
    const l = Math.max(4, Math.min(x, window.innerWidth - menu.offsetWidth - 4));
    const t = Math.max(4, Math.min(y, window.innerHeight - menu.offsetHeight - 4));
    menu.style.left = `${l}px`; menu.style.top = `${t}px`;
    this.menu = menu;
    this.anterior = document.activeElement;
    menu.querySelector("button:not(:disabled)")?.focus();
    document.addEventListener("pointerdown", this._fora, true);
    document.addEventListener("keydown", this._esc, true);
  }

  fecharMenu(devolverFoco = false) {
    if (!this.menu) return;
    this.menu.remove(); this.menu = null;
    document.removeEventListener("pointerdown", this._fora, true);
    document.removeEventListener("keydown", this._esc, true);
    if (devolverFoco) this.anterior?.focus?.();
  }

  /** Liga o botão direito (e a tecla de menu) à faixa inteira. */
  ligar(elemento) {
    elemento.addEventListener("contextmenu", e => {
      if (e.target.closest("input, textarea, select")) return;
      e.preventDefault();
      const b = e.target.closest("[data-cmd], [data-qat]");
      const id = b?.dataset.cmd ?? b?.dataset.qat;
      const cmd = id && this.todos().find(c => c.id === id);
      const grupo=e.target.closest('[data-grupo]')?.dataset.grupo;
      const rect=e.target.getBoundingClientRect();
      this.abrirMenu(e.clientX || rect.left, e.clientY || rect.bottom, cmd || null,grupo||null);
    });
  }

  organizarEscopo(grupo=null) {
    const limite=h('input',{type:'number',min:3,max:12,value:6,'aria-label':'Comandos visíveis'});
    this.app.dialogo({titulo:grupo?'Organizar grupo '+grupo:'Organizar aba atual',icone:'design',texto:'Ajusta a quantidade de ações simples antes de Mais. Galerias e controles especializados são preservados.',corpo:h('label',{},'Limite de comandos ',limite),opcoes:[{id:'aplicar',rotulo:'Aplicar',fazer:()=>{const n=Number(limite.value);if(!Number.isFinite(n))return;this.guardarLayout();this.ui.orquestrador??={};const tipo=grupo?'grupos':'abas',chave=grupo?this.ui.aba+'::'+grupo:this.ui.aba;this.ui.orquestrador[tipo]??={};this.ui.orquestrador[tipo][chave]={limite:Math.max(3,Math.min(12,Math.round(n)))};this.r.metricaInteracao('reorganizar');this.salvar();}},{id:'cancelar',rotulo:'Cancelar',fazer:()=>{}}]});
  }
  capturarLayout() {
    const chaves=["qat","qatAbaixo","abasOcultas","ribbonRecolhido","gruposFixados","gruposRecolhidos","orquestrador","densidadeFaixa"];
    return Object.fromEntries(chaves.map(k=>[k,JSON.parse(JSON.stringify(this.ui[k]??null))]));
  }
  guardarLayout() { this.ui.layoutAnterior=this.capturarLayout(); }
  validarLayout(valor) {
    if(!valor || typeof valor!=="object" || Array.isArray(valor)) throw new Error("Layout inválido.");
    const lista=(v)=>v===null || (Array.isArray(v)&&v.length<=300&&v.every(x=>typeof x==="string"&&x.length<=200));
    const mapa=(v)=>v===null || (typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).length<=500&&Object.entries(v).every(([k,b])=>k.length<=250&&typeof b==="boolean"));
    for(const k of ["qat","abasOcultas"]) if(k in valor&&!lista(valor[k])) throw new Error("Lista inválida: "+k);
    for(const k of ["gruposFixados","gruposRecolhidos"]) if(k in valor&&!mapa(valor[k])) throw new Error("Grupos inválidos.");
    for(const k of ["qatAbaixo","ribbonRecolhido"]) if(valor[k]!=null&&typeof valor[k]!=="boolean") throw new Error("Opção inválida.");
    const saida={densidadeFaixa:valor.densidadeFaixa==="compacta"?"compacta":"confortavel"};
    for(const k of ["qat","qatAbaixo","abasOcultas","ribbonRecolhido","gruposFixados","gruposRecolhidos"]) if(k in valor) saida[k]=JSON.parse(JSON.stringify(valor[k]));
    if(valor.orquestrador!=null){
      const o=valor.orquestrador;
      if(typeof o!=="object" || !["completo","criacao","revisao"].includes(o.perfil??"completo") || !Number.isFinite(o.limite??6)) throw new Error("Organização inválida.");
      saida.orquestrador={perfil:o.perfil??"completo",limite:Math.max(3,Math.min(12,Math.round(o.limite??6))),organizar:o.organizar!==false,autoformatar:!!o.autoformatar};
    } else saida.orquestrador=null;
    if(valor.orquestrador){for(const tipo of ['abas','grupos']){const mapa=valor.orquestrador[tipo]??{};if(!mapa||typeof mapa!=='object'||Array.isArray(mapa)||Object.keys(mapa).length>500)throw Error('Escopos inválidos.');saida.orquestrador[tipo]=Object.fromEntries(Object.entries(mapa).map(([k,v])=>{if(k.length>250||!v||!Number.isFinite(v.limite))throw Error('Limite de escopo inválido.');return [k,{limite:Math.max(3,Math.min(12,Math.round(v.limite)))}];}));}}
    return saida;
  }
  aplicarLayout(valor) { const limpo=this.validarLayout(valor);this.guardarLayout();Object.assign(this.ui,limpo);this.ui.flyout=null;this.ui.grupoAberto=null;this.salvar(); }
  desfazerLayout() { if(!this.ui.layoutAnterior)return;const anterior=this.ui.layoutAnterior;const atual=this.capturarLayout();Object.assign(this.ui,anterior);this.ui.layoutAnterior=atual;this.ui.flyout=null;this.ui.grupoAberto=null;this.salvar(); }
  preverLayout(valor) {
    const limpo=this.validarLayout(valor),antes=this.capturarLayout();
    const voltar=()=>{Object.assign(this.ui,antes);this.app.render();};
    Object.assign(this.ui,limpo);this.app.render();
    this.app.dialogo({titulo:'Prévia do layout',icone:'design',texto:'O layout está sendo mostrado temporariamente. Aplicar salva; cancelar restaura.',opcoes:[{id:'aplicar',rotulo:'Aplicar e salvar',primario:true,fazer:()=>{this.ui.layoutAnterior=antes;this.salvar();}},{id:'cancelar',rotulo:'Cancelar prévia',fazer:voltar}],aoFecharSem:voltar});
  }
  layouts() {
    const nome=h("input",{class:"cp-entrada",maxlength:80,placeholder:"Nome do layout","aria-label":"Nome do layout"});
    const lista=h("select",{"aria-label":"Layouts salvos"},Object.entries(this.ui.layoutsSalvos??{}).map(([id,v])=>h("option",{value:id},v.nome)));
    const status=h("p",{role:"status"},"Layouts afetam somente os menus deste navegador. O documento é preservado.");
    const importar=h("input",{type:"file",accept:".json,application/json","aria-label":"Importar layout"});
    importar.addEventListener("change",async()=>{try{
      const arquivo=importar.files?.[0];if(!arquivo)return;if(arquivo.size>250000)throw new Error("Arquivo muito grande.");
      const pacote=JSON.parse(await arquivo.text());if(pacote.formato!=="hefestus.layout"||pacote.versao!==1)throw new Error("Formato de layout incompatível.");
      const layout=this.validarLayout(pacote.layout);this.aplicarLayout(layout);avisar("Layout importado. A opção Desfazer restaura o anterior.","ok");
    }catch(e){status.textContent=e.message;avisar(e.message);}});
    const acao=(rotulo,fazer)=>h("button",{type:"button",class:"cp-botao",onclick:()=>{try{fazer();}catch(e){status.textContent=e.message;}}},rotulo);
    this.app.dialogo({titulo:"Layouts da Faixa de Opções",icone:"design",corpo:h("div",{class:"corpo-pers"},nome,lista,
      acao("Salvar layout atual",()=>{const n=nome.value.trim();if(!n)throw new Error("Informe um nome.");this.ui.layoutsSalvos??={};const existente=Object.keys(this.ui.layoutsSalvos).find(k=>this.ui.layoutsSalvos[k].nome===n);if(!existente&&Object.keys(this.ui.layoutsSalvos).length>=50)throw new Error("Limite de 50 layouts.");const id=existente??("layout-"+Date.now());this.ui.layoutsSalvos[id]={nome:n,layout:this.capturarLayout()};this.app.salvarUI();if(!existente)lista.append(h("option",{value:id},n));lista.value=id;status.textContent="Layout salvo.";}),
      acao("Prévia do selecionado",()=>{const v=this.ui.layoutsSalvos?.[lista.value];if(v)this.preverLayout(v.layout);}),
      acao("Aplicar selecionado",()=>{const v=this.ui.layoutsSalvos?.[lista.value];if(v){this.aplicarLayout(v.layout);status.textContent="Aplicado; pode desfazer.";}}),
      acao("Excluir selecionado",()=>{delete this.ui.layoutsSalvos?.[lista.value];lista.selectedOptions[0]?.remove();this.app.salvarUI();}),
      acao("Exportar atual",()=>this.app.baixarJSON({formato:"hefestus.layout",versao:1,layout:this.capturarLayout()},"hefestus-layout.json")),
      h("label",{},"Importar layout ",importar),
      acao("Padrão recomendado",()=>this.aplicarLayout({qat:null,qatAbaixo:false,abasOcultas:[],ribbonRecolhido:false,gruposFixados:{},gruposRecolhidos:{},orquestrador:{perfil:"completo",limite:6,organizar:true,autoformatar:true}})),
      acao("Desfazer / refazer layout",()=>this.desfazerLayout()),status),opcoes:[{id:"fechar",rotulo:"Fechar",fazer:()=>{}}]});
  }

  // ---------- Barra de Acesso Rápido ----------
  /** Comandos de fábrica da barra. */
  fixos() {
    const app = this.app, n = app.n, { itens, cursor } = n.historico();
    return {
      _salvar: { rotulo: "Salvar", titulo: "Salvar (Ctrl+S)", icone: "salvar", acao: () => app.salvar() },
      _desfazer: { rotulo: "Desfazer", titulo: "Desfazer (Ctrl+Z)", icone: "desfazer", acao: () => n.desfazer(), desab: cursor === 0 },
      _refazer: { rotulo: "Refazer", titulo: "Refazer (Ctrl+Y)", icone: "refazer", acao: () => n.refazer(), desab: cursor === itens.length },
      _barra: { rotulo: "Barra de ferramentas", titulo: `${this.ui.barraFerr === false ? "Mostrar" : "Ocultar"} a barra de ferramentas (F6)`, icone: "ferramentas", acao: () => app.alternarBarra(), pressionado: this.ui.barraFerr !== false },
      _previa: { rotulo: "Prévia interativa", titulo: "Prévia interativa", icone: "previa", acao: () => app.setModo(this.ui.modo === "previa" ? "designer" : "previa") },
    };
  }

  /** Todos os comandos da faixa que podem ir para a barra. */
  todos() { return this.r.comandos(); }

  /** Botões da Barra de Acesso Rápido na ordem escolhida. */
  botoesQat(criar) {
    const fixos = this.fixos(), outros = new Map(this.todos().map(c => [c.id, c]));
    return this.qatIds.map(id => {
      const c = fixos[id] ?? outros.get(id);
      if (!c) return null;
      return criar(id, { titulo: c.titulo ?? (c.atalho ? `${c.rotulo} (${c.atalho})` : c.rotulo), icone: c.icone ?? "caixa", acao: c.acao, desab: c.desab ?? c.desabilitado?.(), pressionado: c.pressionado, fixo: id in fixos });
    }).filter(Boolean);
  }

  // ---------- diálogos de personalização ----------
  personalizarQat() {
    const fixos = this.fixos();
    const itens = [
      ...Object.entries(fixos).map(([id, c]) => ({ id, rotulo: c.rotulo, ic: c.icone, caminho: "Comandos básicos" })),
      ...this.todos().map(c => ({ id: c.id, rotulo: c.rotulo, ic: c.icone, caminho: c.caminho })),
    ];
    const marcados = new Set(this.qatIds);
    const busca = h("input", { type: "search", class: "cp-entrada", placeholder: "Buscar comando…", "aria-label": "Buscar comando" });
    const lista = h("div", { class: "lista-pers", role: "group", "aria-label": "Comandos" });
    const desenhar = () => {
      const q = busca.value.trim().toLowerCase();
      lista.replaceChildren(...itens.filter(i => !q || `${i.rotulo} ${i.caminho}`.toLowerCase().includes(q)).slice(0, 120).map(i =>
        h("label", { class: "item-pers" },
          h("input", { type: "checkbox", checked: marcados.has(i.id), onchange: e => (e.target.checked ? marcados.add(i.id) : marcados.delete(i.id)) }),
          h("span", { html: icone(i.ic ?? "caixa", 15) }), h("span", { class: "ip-rot" }, i.rotulo), h("span", { class: "ip-cam" }, i.caminho ?? ""))));
    };
    busca.addEventListener("input", desenhar); desenhar();
    this.app.dialogo({
      titulo: "Personalizar a Barra de Acesso Rápido", icone: "ferramentas",
      texto: "Marque os comandos que devem ficar sempre à mão. Clique com o botão direito em qualquer comando da faixa para adicioná-lo direto.",
      corpo: h("div", { class: "corpo-pers" }, busca, lista),
      opcoes: [
        { id: "ok", rotulo: "OK", primario: true, fazer: () => { this.guardarLayout(); this.ui.qat = itens.filter(i => marcados.has(i.id)).map(i => i.id); this.salvar(); } },
        { id: "pad", rotulo: "Restaurar padrão", fazer: () => { this.ui.qat = null; this.salvar(); } },
        { id: "cancelar", rotulo: "Cancelar", fazer: () => {} },
      ],
    });
  }

  personalizarFaixa() {
    const abas = (this.r.todas ?? []).filter(a => !a.contexto);
    const ocultas = new Set(this.abasOcultas);
    const corpo = h("div", { class: "corpo-pers" }, h("div", { class: "lista-pers", role: "group", "aria-label": "Guias principais" },
      abas.map(a => h("label", { class: "item-pers" },
        h("input", { type: "checkbox", checked: !ocultas.has(a.id), onchange: e => (e.target.checked ? ocultas.delete(a.id) : ocultas.add(a.id)) }),
        h("span", { class: "ip-rot" }, a.rotuloMenu ?? a.rotulo)))));
    this.app.dialogo({
      titulo: "Personalizar a Faixa de Opções", icone: "engrenagem",
      texto: "Escolha as guias (abas) que aparecem. Ao menos uma fica sempre visível.",
      corpo,
      opcoes: [
        { id: "ok", rotulo: "OK", primario: true, fazer: () => {
          if (abas.every(a => ocultas.has(a.id))) ocultas.clear();
          this.guardarLayout(); this.ui.abasOcultas = [...ocultas];
          if (ocultas.has(this.ui.aba)) this.ui.aba = (abas.find(a => !ocultas.has(a.id)) ?? abas[0]).id;
          this.salvar();
        } },
        { id: "pad", rotulo: "Restaurar padrão", fazer: () => { this.ui.abasOcultas = []; this.salvar(); } },
        { id: "cancelar", rotulo: "Cancelar", fazer: () => {} },
      ],
    });
  }
}
export { QAT_PADRAO, FaixaDeOpcoes };
