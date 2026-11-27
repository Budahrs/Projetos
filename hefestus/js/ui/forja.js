import { motorMenus } from "../nucleo/motorMenus.js";
import { h, avisar } from "./dom.js";
import { icone } from './icones.js';
import { abrirImportacaoHTML } from './importarHTML.js';
import { analisarHTMLImportado } from '../nucleo/importarHTML.js';
import { CATALOGO } from "../nucleo/catalogo.js";
import { compilar } from "../nucleo/compilador.js";
import { compararEstados } from "../nucleo/recuperacao.js";
import { dadosRuntime, ligarRuntime } from "../nucleo/runtime.js";
import { ControladorFormulario } from "./controlador.js";

const resumo = v => v === undefined ? "Ausente" : typeof v === "string" ? v : JSON.stringify(v);
const tentar = fn => { try { return fn(); } catch (e) { avisar(e.message, "alerta"); } };

export class AmbienteForja {
  constructor(app) {
    this.app = app;
    this.busca = "";
    this.rascunhos = new Map();
    this.fechados = new Set();
    this.raiz = h("nav", { class: "ambiente-topo", "aria-label": "Ambiente de criação" });
    this.camadas = h("section", { class: "camadas-flutuantes", hidden: true, "aria-label": "Camadas do projeto" });
    document.addEventListener("pointerdown", e => {
      if (!this.camadas.hidden && !this.camadas.contains(e.target) && !this.raiz.contains(e.target)) this.fecharCamadas();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !this.camadas.hidden) { e.preventDefault(); this.fecharCamadas(); this.btCamadas?.focus(); }
    });
  }
  fecharCamadas() { this.camadas.hidden = true; this.btCamadas?.setAttribute("aria-expanded", "false"); }
  render() {
    const app = this.app, forja = !!app.ui.hibrido;
    const aberto = !this.camadas.hidden;
    const bt = (titulo, ativo, fn) => h("button", { type: "button", class: "ambiente-bt", "aria-pressed": String(ativo), onclick: fn }, titulo);
    this.btCamadas = h("button", { type: "button", class: "ambiente-bt", "aria-expanded": String(aberto), "aria-controls": "hefestus-camadas", onclick: () => {
      this.camadas.hidden = !this.camadas.hidden; this.render();
      if (!this.camadas.hidden) this.camadas.querySelector("input")?.focus();
    } }, "Camadas ", h("span", { "aria-hidden": "true" }, aberto ? "▴" : "▾"));
    this.raiz.replaceChildren(bt("Designer", !forja && app.ui.modo==='designer', () => app.setModo("designer")), bt("Código", forja, () => {app.ui.dockAba='blocos';app.setModo("forja");}),h('button',{type:'button',class:'ambiente-bt',title:'Prévia interativa do projeto aplicado','aria-label':'Prévia interativa','aria-pressed':String(app.ui.modo==='previa'),onclick:()=>app.setModo('previa')},h('span',{html:icone('previa',18)}),h('span',{},'Prévia interativa')), this.btCamadas);
    if(forja)this.raiz.append(h('button',{type:'button',class:'ambiente-bt',title:'Colar uma página HTML e criar um artefato',onclick:()=>abrirImportacaoHTML(app)},h('span',{html:icone('codigo',18)}),'Colar HTML'));
    if (aberto) this.renderCamadas();
    document.getElementById("app").classList.toggle("ambiente-forja", forja);
  }
  renderCamadas() {
    const app = this.app, n = app.n;
    this.camadas.id = "hefestus-camadas";
    this.camadas.style.top = `${Math.min(window.innerHeight - 100, this.raiz.getBoundingClientRect().bottom + 4)}px`;
    const entrada = h("input", { type: "search", class: "cp-entrada", "aria-label": "Pesquisar camadas", placeholder: "Pesquisar nome ou tipo…", value: this.busca, oninput: e => {
      this.busca = e.target.value; this.renderListaCamadas();
    } });
    this.listaCamadas = h("div", { class: "camadas-lista" });
    this.camadas.replaceChildren(entrada, h("div", { class: "botoes-linha" },
      h("button", { type: "button", class: "bt-texto", disabled: !n.selecionados().length, onclick: () => tentar(() => app.agrupar("livre")) }, "Agrupar"),
      h("button", { type: "button", class: "bt-texto", disabled: n.selecionado()?.tipo !== "container", onclick: () => tentar(() => app.desagrupar()) }, "Desagrupar"),
      h("button", { type: "button", class: "bt-texto", onclick: () => { app.setModo("forja"); app.ui.dockAba = "historico"; this.fecharCamadas(); app.render(); } }, "Histórico e recuperação")), this.listaCamadas);
    this.renderListaCamadas();
    motorMenus().limitarPainel(this.camadas,this.raiz.getBoundingClientRect());
  }
  renderListaCamadas() {
    const n = this.app.n, els = n.elementos(), q = this.busca.toLocaleLowerCase("pt-BR");
    const todos = new Map(els.map(e => [e.id, e]));
    const tipo = e => e.grupo ? "grupo" : e.construtor ? n.construtor().itens.find(i => i.id === e.construtor)?.tipo ?? e.tipo : e.tipo === "container" ? "grupo" : CATALOGO[e.tipo]?.nome ?? e.tipo;
    const visiveis = new Set(els.filter(e => `${e.nome} ${tipo(e)}`.toLocaleLowerCase("pt-BR").includes(q)).map(e => e.id));
    if (q) for (const id of [...visiveis]) {
      let el = todos.get(id); const vistos = new Set();
      while (el?.pai && !vistos.has(el.pai)) { vistos.add(el.pai); visiveis.add(el.pai); el = todos.get(el.pai); }
    }
    const montar = (el, vistos = new Set()) => {
      if (vistos.has(el.id) || !visiveis.has(el.id)) return null;
      const prox = new Set([...vistos, el.id]);
      const filhos = els.filter(e => e.pai === el.id);
      const linha = h("div", { class: "camada-linha" },
        filhos.length ? h("button", { type: "button", class: "bt-texto", "aria-label": `Expandir ${el.nome}`, "aria-expanded": String(!this.fechados.has(el.id)), onclick: () => { this.fechados.has(el.id) ? this.fechados.delete(el.id) : this.fechados.add(el.id); this.renderListaCamadas(); } }, this.fechados.has(el.id) ? "▸" : "▾") : null,
        h("button", { type: "button", class: "camada-nome", "aria-pressed": String(n.selecionados().includes(el.id)), onclick: ev => n.selecionar(el.id, { somar: ev.shiftKey }), title: `${el.nome} (${tipo(el)})` }, el.nome, h("small", {}, ` (${tipo(el)})`)),
        h("button", { type: "button", class: "bt-texto", "aria-label": `${el.visivel === false ? "Mostrar" : "Ocultar"} ${el.nome}`, onclick: () => n.definir(el.id, { visivel: el.visivel === false }) }, el.visivel === false ? "○" : "●"));
      return h("div", { class: "camada-ramo" }, linha, (!this.fechados.has(el.id) || q) && filhos.length ? h("div", { class: "camada-filhos" }, filhos.map(f => montar(f, prox))) : null);
    };
    const categorias = new Map();
    for (const el of els.filter(e => !e.pai || !todos.has(e.pai))) {
      if (!visiveis.has(el.id)) continue;
      const k = tipo(el); if (!categorias.has(k)) categorias.set(k, []); categorias.get(k).push(el);
    }
    const partes = [...categorias].map(([k, lista]) => h("section", { class: "camadas-categoria" },
      lista.length > 1 ? h("div", { class: "sub" }, `${k} (${lista.length})`) : null, lista.map(e => montar(e))));
    this.listaCamadas.replaceChildren(...(partes.length ? partes : [h("p", {}, "Nenhum objeto encontrado.")]));
  }
  secao(titulo, conteudo) {
    return h("details", { class: "forja-secao", open: true }, h("summary", {}, titulo), h("div", { class: "forja-secao-corpo" }, conteudo));
  }
  painel(aba) {
    const app = this.app;
    this.controlador ??= new ControladorFormulario(app);
    if (["principal", "elemento", "efeitos", "comportamento"].includes(aba)) return this.controlador.render(aba);
    if (aba === "codigo") return this.painelCodigo();
    if (aba === "documentacao") return this.painelDocumentacao();
    if (aba === "modelos") return h("div", { class: "forja-modelos" }, h("div", { class: "botoes-linha" },
      h("button", { type: "button", class: "bt-texto", onclick: () => app.salvarModelo() }, "Salvar seleção como artefato"),
      h("button", { type: "button", class: "bt-texto", onclick: () => app.importarModelos() }, "Importar biblioteca"),
      h("button", { type: "button", class: "bt-texto", onclick: () => app.exportarModelos() }, "Exportar meus artefatos")), app.esq.p_biblioteca());
    if (aba === "historico") return this.painelHistorico();
    return null;
  }
  painelDocumentacao() {
    const n=this.app.n, base=n.tela.especificacaoSoftware||n.doc.especificacaoSoftware||{};
    const campo=(titulo,caminho,lista=false)=>{
      const atual=caminho.split('.').reduce((v,k)=>v?.[k],base);
      return h('label',{},h('strong',{},titulo),h('textarea',{'aria-label':titulo,'data-foco-campo':'especificacao.'+caminho,rows:3,value:lista?(atual||[]).join('\n'):atual||'',placeholder:'A definir pelo autor',onchange:e=>{
        const valor=structuredClone(n.tela.especificacaoSoftware||n.doc.especificacaoSoftware||{}),partes=caminho.split('.');let pai=valor;
        for(const k of partes.slice(0,-1)){pai[k]??={};pai=pai[k];}
        pai[partes.at(-1)]=lista?e.target.value.split('\n').map(v=>v.trim()).filter(Boolean):e.target.value;
        n.definir('__canvas',{especificacaoSoftware:valor},'Editar documentação: '+titulo);
      }}));
    };
    return h('section',{class:'forja-documentacao'},h('h2',{},'Especificação do programa'),h('p',{},'Defina o propósito e os requisitos. O Hephaestus extrai a estrutura e os eventos reais, preserva estas declarações e inclui os documentos ao salvar.'),
      campo('Objetivo do produto — PRD','produto.objetivo'),campo('Público-alvo — PRD','produto.publico'),campo('Requisitos funcionais e critérios de aceite — um por linha','requisitos',true),campo('Requisitos não funcionais e restrições — um por linha','restricoes',true),campo('Persistência e modelo de dados','dados.persistencia'),
      campo('Referências — um link, arquivo ou descrição por linha','referencias',true),
      h('p',{},'Arquitetura, contratos, inventário de eventos, plano de testes, manual e registro de decisões são incluídos no pacote. Resultados de testes exigem evidências; a geração da documentação não declara aprovação.'),
      h('button',{type:'button',class:'bt',onclick:()=>n.salvarPacoteDocumentado()},'Baixar projeto com documentação'));
  }
  painelCodigo() {
    const app = this.app, n = app.n, el = n.selecionado();
    const importar=h('button',{type:'button',class:'bt-texto',onclick:()=>abrirImportacaoHTML(app)},h('span',{html:icone('codigo',16)}),' Colar HTML e recriar artefato…');
    const escopo = el ? [el.id, ...n.comDescendentes([el.id])] : n.elementos().map(e => e.id);
    const doc = { elementos: { __canvas: n.tela, ...Object.fromEntries([...new Set(escopo)].map(id => [id, { ...n.elemento(id), ...(!escopo.includes(n.elemento(id)?.pai) ? { pai: undefined } : {}) }])) } };
    const c = compilar(doc);
    const gerado = this.secao("Código gerado da seleção", h("div", {}, h("p", {}, "A estrutura visual gera este código. As extensões autorais abaixo são preservadas nas trocas de modo."),
      h("pre", { class: "forja-gerado", tabindex: "0" }, `<!-- HTML -->\n${c.html}\n\n/* CSS */\n${c.css}\n\n// JavaScript dos comportamentos\nconst motorMenus = ${motorMenus.toString()};
(${ligarRuntime.toString()})(document.querySelector('.hf-arte'), ${JSON.stringify(dadosRuntime(c.elementos), null, 2)});`)));
    if (!el) return [importar,h("p", {}, "Cole HTML para criar um artefato novo, ou selecione um objeto para editar seu código."), gerado];
    const chave = el.id;
    let draft = this.rascunhos.get(chave);
    if (!draft || !draft.sujo) { draft = { html: el.codigo?.html ?? "", css: el.codigo?.css ?? "", js: el.codigo?.js ?? "", sujo: false }; this.rascunhos.set(chave, draft); }
    const aviso = h("p", { role: "status", class: "forja-aviso" });
    const aplicar = () => {
      try {
        new Function("raiz", draft.js);
        const r = n.definir(el.id, { codigo: { ...el.codigo,html: draft.html, css: draft.css, js: draft.js,...(el.codigo?.isolado?{analise:analisarHTMLImportado(draft.html)}:{}) } }, `Editar código de ${el.nome}`);
        if (r?.acao === "aplicado") { this.rascunhos.delete(chave); aviso.textContent = "Código aplicado. Voltar desfaz a alteração."; return true; }
      } catch (e) { aviso.textContent = `Código preservado no rascunho: ${e.message}`; }
      return false;
    };
    return h("div", { class: "forja-codigo" },
      importar,
      el.codigo?.isolado ? h('label', {class:'cp cp-linha'}, h('input', {type:'checkbox',checked:el.codigo.preservarFundoPagina===true,onchange:e=>n.definir(el.id,{codigo:{...el.codigo,preservarFundoPagina:e.target.checked}},'Fundo da página HTML')}), 'Preservar fundo da página HTML') : null,
      h("p", {},el.codigo?.isolado?`Código de ${el.nome}. O HTML completo funciona em um componente isolado. CSS e JavaScript adicionais atuam dentro dele; raiz é o body desse componente.`:`Código de ${el.nome}. HTML acrescenta conteúdo ao objeto; CSS usa seletores dentro do seu escopo; JavaScript recebe a variável raiz da instância.`),
      h("div", { class: "forja-codigo-colunas" }, ["html", "css", "js"].map(k => h("label", {}, k === "js" ? "JavaScript" : k.toUpperCase(),
        h("textarea", { class: "cp-entrada mono", rows: 9, spellcheck: false, "aria-label": `Código ${k.toUpperCase()}`, oninput: e => { draft[k] = e.target.value; draft.sujo = true; } }, draft[k])))),
      h("div", { class: "botoes-linha" },
        h("button", { type: "button", class: "bt-texto", onclick: aplicar }, "Aplicar código"),
        h("button", { type: "button", class: "bt-texto", onclick: () => { if (aplicar()) app.setModo("previa"); } },h('span',{html:icone('previa',16)}), " Aplicar e testar"),
        h("button", { type: "button", class: "bt-texto", onclick: () => { this.rascunhos.delete(chave); app.render(); } }, "Descartar rascunho"),
        h("button", { type: "button", class: "bt-texto", onclick: () => n.exportarHTML() }, "Exportar HTML funcional")), aviso, gerado);
  }
  painelHistorico() {
    const app = this.app, n = app.n, p = n.projeto;
    const select = h("select", { class: "cp-entrada", "aria-label": "Estado do histórico para comparar" },
      h("option", { value: 0 }, "Estado inicial"), p.historico.map((ev, i) => h("option", { value: i + 1, selected: i + 1 === Math.max(0, p.cursor - 1) }, `${i + 1}. ${ev.pedido}`)));
    const lista = h("div", { class: "comparacao-lista" }), status = h("p", { role: "status" });
    let comparacao, escolhidos;
    const comparar = () => {
      comparacao = n.compararComHistorico(Number(select.value)); escolhidos = new Set();
      lista.replaceChildren(...comparacao.mudancas.map((m, i) => {
        const valores = h("div", { class: "comparacao-valores" },
          h("span", {}, "Atual: ", h("code", {}, resumo(m.atual))),
          h("span", {}, "Anterior: ", h("code", {}, resumo(m.anterior))));
        const controle = h("input", { type: "checkbox", "aria-label": `Recuperar ${n.rotulo(m.id)} ${m.campo}`, onchange: e => e.target.checked ? escolhidos.add(i) : escolhidos.delete(i) });
        return h("label", { class: "comparacao-item" }, controle, h("div", {}, h("strong", {}, `${n.rotulo(m.id)} · ${m.campo}`), valores));
      }));
      status.textContent = comparacao.mudancas.length ? `${comparacao.mudancas.length} diferença(s). Marque os campos que deseja recuperar.` : "O estado atual é igual ao ponto escolhido.";
    };
    select.addEventListener("change", comparar); comparar();
    return h("div", { class: "forja-historico" },
      h("p", {}, n.avisoRecuperacao ?? "Voltar, Refazer e recuperação usam o mesmo histórico. Compare antes de recuperar campos."),
      n.erroSalvamento ? h("p", { role: "alert" }, n.erroSalvamento) : null,
      h("div", { class: "botoes-linha" },
        h("button", { type: "button", class: "bt-texto", disabled: !p.cursor, onclick: () => n.desfazer() }, "Voltar"),
        h("button", { type: "button", class: "bt-texto", disabled: p.cursor === p.historico.length, onclick: () => n.refazer() }, "Refazer"),
        h("button", { type: "button", class: "bt-texto", onclick: () => n.salvarArquivo() }, "Exportar projeto"),
        n.bloquearAutosave ? h("button", { type: "button", class: "bt-texto", onclick: () => tentar(() => { n.retomarSalvamento(); app.render(); }) }, "Preservar original e retomar salvamento") : null,
        n.originalRecuperacao ? h("button", { type: "button", class: "bt-texto", onclick: () => n.baixar("hefestus-original-recuperacao.json", typeof n.originalRecuperacao === "string" ? n.originalRecuperacao : JSON.stringify(n.originalRecuperacao, null, 2), "application/json") }, "Exportar original preservado") : null),
      h("label", {}, "Comparar com: ", select), status, lista,
      h("button", { type: "button", class: "bt-texto", onclick: () => tentar(() => {
        if (!escolhidos.size) { status.textContent = "Marque pelo menos um campo na comparação."; return; }
        // Uma comparação aberta não pode reverter alterações feitas depois dela.
        const nova = n.compararComHistorico(comparacao.cursor);
        if (JSON.stringify(nova.mudancas) !== JSON.stringify(comparacao.mudancas)) { comparar(); status.textContent = "O projeto mudou. Revise a comparação atualizada."; return; }
        n.recuperarCampos(comparacao, [...escolhidos].map(i => comparacao.mudancas[i]));
      }) }, "Recuperar campos marcados"),
      n.relatorioRecuperacao?.length ? this.secao("Dados recuperados ao abrir", n.relatorioRecuperacao.map(r => h("p", {}, `${r.id} · ${r.campo}: ${r.motivo}`))) : null,
      this.secao("Linha do tempo e variações", app.esq.p_historico()));
  }
}
