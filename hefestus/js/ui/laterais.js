// Laterais. Esquerda: pilha de botões que abre UM painel por vez (criação, camadas,
// linha do tempo, decisões). Direita: vários painéis empilhados, contextuais ao
// elemento selecionado. As duas empurram o canvas em vez de cobri-lo.
import { componentesHephaestus } from './componentesHephaestus.js';
import { motorMenus } from "../nucleo/motorMenus.js";
import { secaoAparencia, TIPOS_AVANCADOS } from "./aparencia.js";
import { h, campo, botaoIcone, ler, avisar } from "./dom.js";
import { icone } from "./icones.js";
import { CATALOGO, CAMPOS_ESTILO, CAMPOS_COMPORTAMENTO, CAMPOS_ACESSIBILIDADE, CAMPOS_LAYOUT, CAMPOS_CANVAS, ACOES, CAMPOS_TEXTO, CAMPOS_TRANSFORMACAO, CAMPOS_EFEITOS, TIPOS_COM_TEXTO, CAMPOS_RESPONSIVO, CAMPOS_FILHO, CAMPOS_ABERTURA } from "../nucleo/catalogo.js";
import { COMPORTAMENTOS, CATEGORIAS_COMPORTAMENTOS } from "../nucleo/comportamentos.js";
import { restricoes } from "../nucleo/compilador.js";
import { gruposFerramentas } from "./blocosFerramentas.js";
import { VARIANTES } from "./ribbon.js";
import { Formulario } from "./construtor.js";
import { PALETAS } from "./temas.js";
import { MODELOS, CATEGORIAS_MODELOS, miniaturaModelo } from "../nucleo/modelos.js";
import { FONTES_BIB, CATEGORIAS_FONTES } from "../nucleo/fontes.js";
import { categoriasIcones, rotuloIcone, ehUsuario, iconeColorido } from "./icones.js";
import { normalizarTitulo } from "../nucleo/recuperacao.js";
import { FORMAS } from "../nucleo/formas.js";
import { CAMPOS_CONTRATO } from "../nucleo/contrato.js";
import { TIPOS_RECONHECIDOS } from "../nucleo/classificador.js";
const PAINEIS_ESQ = [
  ["agente", "Agente", "chat"],
  ["ferramentas", "Componentes", "mais"],
  ["biblioteca", "Biblioteca", "biblioteca"],
  ["camadas", "Camadas", "camadas"],
  null,
  ["auditoria", "Auditoria", "check"],
  ["historico", "Linha do tempo", "relogio"],
  ["decisoes", "Decisões protegidas", "escudo"],
  null,
  ["armazem", "Armazém e consolidação", "servidor"],
  // abre pela Ajuda (sem botão no trilho)
  ["primeiros", "Primeiros passos", "play", { oculto: true }],
];

const PAINEIS_DIR = [
  ["inspetor", "Inspetor", "ferramentas"],
  ["propriedades", "Propriedades", "propriedades"],
  ["estilo", "Estilo e cores", "pincel"],
  ["efeitos", "Transformação e efeitos", "efeitos"],
  ["responsivo", "Responsivo", "telaCheia"],
  ["comportamento", "Comportamento", "estados"],
  ["eventos", "Eventos e sinais", "raio"],
  ["acessibilidade", "Acessibilidade", "acess"],
];

function painel(icon, titulo, corpo, aoFechar, id) {
  return h("section", { class: "painel", "aria-label": titulo, "data-painel": id },
    h("header", {}, h("span", { html: icone(icon, 15) }), titulo, aoFechar ? botaoIcone("fechar", `Fechar ${titulo}`, aoFechar, { tam: 14 }) : null),
    h("div", { class: "painel-corpo" }, corpo));
}

class LateralEsquerda {
  constructor(app) {
    this.app = app;
    this.pilha = h("nav", { class: "pilha", "aria-label": "Ferramentas de criação" });
    this.paineis = h("div", { class: "paineis" });
    this.raiz = h("aside", { class: "lateral esq" }, this.pilha, this.paineis);
    this.adaptar = () => { this.raiz.dataset.sidebarModo = motorMenus().sidebar(this.raiz.parentElement?.clientWidth || window.innerWidth, { aberto: !!app.ui.esq }).modo; };
    window.addEventListener('resize', this.adaptar);
    document.addEventListener('pointerdown', e => { if (this.raiz.dataset.sidebarModo === 'minimal' && app.ui.esq && !this.raiz.contains(e.target)) app.abrirPainelEsq(null); });
    this.raiz.addEventListener('keydown', e => { if (e.key === 'Escape' && app.ui.esq) { e.preventDefault(); app.abrirPainelEsq(null); this.pilha.querySelector('button')?.focus(); } });
  }

  render() {
    const ui = this.app.ui;
    this.adaptar();
    const ferramenta = ui.ferramenta ?? "selecao";
    // ferramentas ficam na barra de ferramentas; se ela estiver oculta, voltam para cá
    const ferrAqui = ui.barraFerr === false;
    this.pilha.replaceChildren(
      ...(ferrAqui ? [
        h("div", { class: "pilha-rotulo", "aria-hidden": "true" }, "Ferr."),
        ...gruposFerramentas(this.app).map(([nome, lista]) => {
          const ativo = lista.find(f => f.id === ferramenta) ?? lista[0];
          let bt;
          bt = botaoIcone(ativo.icone, `${nome}: ${ativo.nome}${lista.length > 1 ? ". Abrir variações" : ""}`, () => lista.length > 1 ? this.app.barra.abrirFerramentas(bt, lista) : this.app.setFerramenta(ativo.id), {
            class: "ferramenta", attrs: { "aria-pressed": String(lista.some(f => f.id === ferramenta)), ...(lista.length > 1 ? { "aria-haspopup": "menu", "aria-expanded": "false", "data-irmas": String(lista.length) } : {}) }
          });
          return bt;
        }),
        h("div", { class: "pilha-sep forte" }),
      ] : []),
      h("div", { class: "pilha-rotulo", "aria-hidden": "true" }, "Painéis"),
      botaoIcone("buscar", "Buscar elemento ou comando (Ctrl+P)", () => this.app.barra.focarBusca()),
      ...PAINEIS_ESQ.filter(p => !p?.[3]?.oculto).map(p => p
        ? botaoIcone(p[2], p[1], () => this.app.abrirPainelEsq(ui.esq === p[0] ? null : p[0]), { attrs: { "aria-pressed": String(ui.esq === p[0]) } })
        : h("div", { class: "pilha-sep" })));
    const def = PAINEIS_ESQ.find(p => p && p[0] === ui.esq);
    if(!ui.hibrido){
      this.paineis.hidden=false;this.paineis.classList.add('hp-project-pinned');
      this.paineis.replaceChildren(painel('camadas','Camadas',this.p_camadas(),null,'camadas'),componentesHephaestus(this.app),...(def&&def[0]!=='camadas'?[painel(def[2],def[1],this[`p_${def[0]}`](),()=>this.app.abrirPainelEsq('camadas'),def[0])]:[]));
      return;
    }
    this.paineis.hidden = !def;
    if (!def) return;
    const fechar = () => this.app.abrirPainelEsq(null);
    const foco = document.activeElement;
    const corpo = this[`p_${def[0]}`]();
    this.paineis.classList.toggle("largo", def[0] === "agente" || def[0] === "armazem");
    this.paineis.replaceChildren(painel(def[2], def[1], corpo, fechar, def[0]));
    if (foco && foco !== document.body && document.contains(foco)) foco.focus();
  }

  p_agente() {
    this.app.painelAgente.render();
    return this.app.painelAgente.raiz;
  }

  p_armazem() { return this.app.painelArmazem.render(); }
  p_primeiros() { return this.app.primeiros.render(); }

  p_ferramentas() {
    const grupos = {};
    for (const [tipo, d] of Object.entries(CATALOGO)) if (tipo !== "container") (grupos[d.grupo] ??= []).push([tipo, d]);
    return [
      h("p", { class: "painel-vazio" }, "Clique para inserir no centro ou arraste até a tela."),
      ...Object.entries(grupos).flatMap(([g, itens]) => [
        h("div", { class: "sub" }, g),
        h("div", { class: "paleta" }, itens.map(([tipo, d]) => h("button", {
          type: "button", class: "peca", draggable: "true", title: `Inserir ${d.nome}`,
          onclick: () => this.app.inserir(tipo),
          ondragstart: e => { e.dataTransfer.setData("text/hefestus-tipo", tipo); e.dataTransfer.effectAllowed = "copy"; },
        }, h("span", { html: icone(d.icone, 22) }), h("span", {}, d.nome)))),
      ]),
    ];
  }

  /** Biblioteca: modelos (prontos e seus), fontes e ícones de menu. */
  p_biblioteca() {
    const app = this.app;
    const ui = app.ui;
    const aba = ["modelos", "fontes", "icones"].includes(ui.abaBib) ? ui.abaBib : "modelos";
    const filtro = (this.filtroBib ?? "").toLowerCase();
    const casa = t => !filtro || t.toLowerCase().includes(filtro);
    const busca = h("input", {
      type: "search", class: "cp-entrada", placeholder: aba === "modelos" ? "Buscar modelo" : aba === "fontes" ? "Buscar fonte" : "Buscar ícone",
      value: this.filtroBib ?? "", "aria-label": "Buscar na biblioteca",
      oninput: e => { this.filtroBib = e.target.value; app.render(); requestAnimationFrame(() => { const b = (ui.hibrido ? app.dir.paineis : this.paineis).querySelector(".bib-busca input"); b?.focus(); b?.setSelectionRange(b.value.length, b.value.length); }); },
    });
    const abas = h("div", { class: "segmentos bib-abas", role: "tablist" }, [["modelos", "Modelos"], ["fontes", "Fontes"], ["icones", "Ícones"]].map(([k, r]) =>
      h("button", { type: "button", class: "seg", role: "tab", "aria-selected": String(aba === k), "aria-pressed": String(aba === k), onclick: () => { ui.abaBib = k; this.filtroBib = ""; app.salvarUI(); app.render(); } }, r)));
    const topo = [abas, h("div", { class: "bib-busca" }, busca)];

    if (aba === "modelos") {
      const todos = [...MODELOS, ...app.modelosUsuario()].filter(m => casa(`${m.nome} ${m.desc} ${m.cat} ${(m.meta?.tags ?? []).join(" ")}`));
      const blocos = CATEGORIAS_MODELOS.map(cat => {
        const itens = todos.filter(m => m.cat === cat);
        if (!itens.length && cat !== "Meus modelos") return null;
        return [
          h("div", { class: "sub" }, cat),
          itens.length
            ? h("div", { class: "bib-modelos" }, itens.map(m => h("div", { class: "bib-modelo" },
                h("button", {
                  type: "button", class: "bib-modelo-bt", draggable: "true", title: `${m.nome}: ${m.desc}. Clique para inserir ou arraste até a tela.`,
                  onclick: () => app.inserirModelo(m),
                  ondragstart: e => { e.dataTransfer.setData("text/hefestus-modelo", m.id); e.dataTransfer.effectAllowed = "copy"; },
                  html: `<span class="bib-mini">${miniaturaModelo(m, 104, 52)}</span>`,
                }, h("span", { class: "bib-nome" }, m.nome)),
                m.usuario ? botaoIcone("excluir", `Excluir modelo ${m.nome}`, () => app.removerModelo(m.id), { tam: 13, class: "bib-excluir" }) : null)))
            : h("p", { class: "painel-vazio" }, "Selecione elementos e use Salvar seleção como modelo. Eles ficam aqui para usar em novos projetos."),
        ];
      });
      return [...topo, ...blocos.flat().filter(Boolean),
        h("div", { class: "botoes-linha bib-acoes" },
          h("button", { type: "button", class: "bt-texto", disabled: !app.n.selecionados().length, onclick: () => app.salvarModelo(), html: `${icone("modelo", 14)} Salvar seleção` }),
          h("button", { type: "button", class: "bt-texto", onclick: () => app.importarModelos(), html: `${icone("abrir", 14)} Importar` }),
          h("button", { type: "button", class: "bt-texto", disabled: !app.modelosUsuario().length, onclick: () => app.exportarModelos(), html: `${icone("exportar", 14)} Exportar` }))];
    }

    if (aba === "fontes") {
      const sel = app.n.selecionado();
      const atual = sel?.estilo?.fonte;
      const semSel = !app.n.selecionados().length;
      return [...topo,
        h("p", { class: "painel-vazio" }, semSel ? "Selecione um elemento com texto e clique numa fonte." : `Clique para aplicar em ${app.n.descreverGrupo(app.n.selecionados())}.`),
        ...CATEGORIAS_FONTES.flatMap(cat => {
          const fs = Object.entries(FONTES_BIB).filter(([, f]) => f.cat === cat && casa(`${f.nome} ${cat}`));
          if (!fs.length) return [];
          return [h("div", { class: "sub" }, cat), h("div", { class: "lista bib-fontes" }, fs.map(([k, f]) => h("button", {
            type: "button", class: `item bib-fonte ${atual === k ? "ativo" : ""}`, title: `${f.nome}${f.google ? " · carregada do Google Fonts" : " · do sistema"}`,
            "aria-pressed": String(atual === k), onclick: () => app.aplicarFonte(k),
          }, h("span", { class: "item-nome", style: `font-family:${f.pilha}` }, f.nome), h("span", { class: "bib-amostra", style: `font-family:${f.pilha}` }, "Aa Menu 123"))))];
        })];
    }

    const temIconeSel = app.n.selecionados().some(id => app.n.elemento(id)?.tipo === "icone");
    const colorido = ui.estiloIcones === "colorido";
    const estilos = h("div", { class: "segmentos", role: "group", "aria-label": "Estilo dos ícones" }, [["traco", "Traço"], ["colorido", "Colorido"]].map(([k, r]) =>
      h("button", { type: "button", class: "seg", "aria-pressed": String((ui.estiloIcones ?? "traco") === k), onclick: () => { ui.estiloIcones = k; app.salvarUI(); this.render(); } }, r)));
    return [...topo, estilos,
      h("p", { class: "painel-vazio" }, temIconeSel ? "Clique para trocar o símbolo dos ícones selecionados." : "Clique para inserir ou arraste até a tela."),
      h("button", { type: "button", class: "item", title: "Traga ícones baixados do Flaticon, Icons8, IconScout, Icon-Icons ou outro site. Confira a licença de cada um.", onclick: () => app.importarIcones() },
        h("span", { class: "item-nome" }, "Importar SVG/PNG…")),
      ...categoriasIcones().flatMap(cat => {
        const itens = cat.itens.filter(i => casa(`${i} ${rotuloIcone(i)} ${cat.nome}`));
        if (!itens.length) return [];
        return [h("div", { class: "sub" }, cat.nome), h("div", { class: "bib-icones" }, itens.map(i => h("button", {
          type: "button", class: "bib-icone", title: rotuloIcone(i), "aria-label": `Ícone ${rotuloIcone(i)}`, draggable: "true",
          onclick: () => (temIconeSel ? app.trocarIcone(i) : app.inserirIcone(i)),
          ondragstart: e => { e.dataTransfer.setData("text/hefestus-icone", i); e.dataTransfer.effectAllowed = "copy"; },
          html: colorido ? iconeColorido(i, 22) : icone(i, 20),
        })))];
      })];
  }

  p_camadas() {
    const n = this.app.n;
    const els = n.elementos();
    if (!els.length) return h("p", { class: "painel-vazio" }, "Nenhum elemento ainda. Use Inserir para começar.");
    // árvore: containers mostram os filhos recuados (como camadas de um sistema profissional)
    const ids = new Set(els.map(e => e.id));
    const filhos = id => els.filter(e => e.pai === id).sort((a, b) => (b.z ?? 0) - (a.z ?? 0));
    const ordem = [];
    const visitar = (e, nivel) => { ordem.push([e, nivel]); for (const f of filhos(e.id)) visitar(f, nivel + 1); };
    for (const e of els.filter(x => !x.pai || !ids.has(x.pai)).sort((a, b) => (b.z ?? 0) - (a.z ?? 0))) visitar(e, 0);
    return h("div", { class: "lista", role: "tree", "aria-label": "Camadas" }, ordem.map(([e, nivel]) => {
      const marcado = n.selecionados().includes(e.id);
      const modo = e.tipo === "container" ? { linha: " · linha", coluna: " · coluna" }[e.layout?.modo] ?? "" : "";
      const linha = h("div", { class: `item ${marcado ? "ativo" : ""}`, role: "treeitem", "aria-selected": String(marcado), "aria-level": String(nivel + 1), style: nivel ? `padding-left:${6 + nivel * 14}px` : "" },
        h("span", { html: icone(CATALOGO[e.tipo]?.icone, 15) }),
        h("button", { type: "button", class: "item-nome", title: "Shift+clique para somar à seleção", style: "border:0;background:none;text-align:left;padding:0", onclick: ev => n.selecionar(e.id, { somar: ev.shiftKey }) }, `${e.nome}${modo}`),
        e.travado ? h("span", { html: icone("travar", 13), title: "Posição travada" }) : null,
        botaoIcone(e.visivel === false ? "olhoFechado" : "olho", e.visivel === false ? "Mostrar" : "Ocultar",
          () => n.definir(e.id, { visivel: e.visivel === false }, `${e.visivel === false ? "Mostrar" : "Ocultar"} ${e.nome}`), { tam: 14 }));
      return linha;
    }));
  }

  p_auditoria() {
    const n = this.app.n;
    const itens = n.auditar();
    const cont = g => itens.filter(i => i.gravidade === g).length;
    const corrigiveis = itens.filter(i => i.correcao);
    const rot = { erro: "Erro", aviso: "Aviso", info: "Info" };
    const nomes = n.auditarNomes();
    return [
      h("details", { class: "forja-secao" }, h("summary", {}, `Padronização de títulos (${nomes.length})`),
        h("div", { class: "forja-secao-corpo" }, h("p", {}, "Convenção do Hephaestus: iniciais maiúsculas, conectivos em minúsculas e exceções para siglas. Revise os nomes antes de aplicar."),
          nomes.map(i => h("p", {}, `${i.de} → ${i.para}`)),
          h("button", { type: "button", class: "bt-texto", disabled: !nomes.length, onclick: () => n.padronizarNomes(nomes) }, "Aplicar padronização revisada"))),
      h("p", { class: "painel-vazio" }, itens.length
        ? `${cont("erro")} erro(s), ${cont("aviso")} aviso(s), ${cont("info")} informação(ões). Contraste, rótulos, hover, transições, alvos de clique e eventos soltos.`
        : "Nenhum problema encontrado: contraste, rótulos acessíveis, estados, transições e eventos estão em ordem."),
      h("div", { class: "aud-acoes" },
        h("button", { type: "button", class: "bt-texto", disabled: corrigiveis.length ? null : "", onclick: () => { const r = n.corrigirAuditoria(); this.app.mensagem(`${r.corrigidos} problema(s) corrigido(s). Desfazer volta tudo de uma vez.`); } }, `Corrigir tudo que dá (${corrigiveis.length})`),
        h("button", { type: "button", class: "bt-texto", onclick: () => this.app.baixarDocumentacao() }, "Baixar documentação (.md)")),
      h("div", { class: "lista" }, itens.map(i => h("div", { class: `item aud g-${i.gravidade}` },
        h("button", { type: "button", class: "item-nome aud-msg", title: i.mensagem, onclick: () => i.id && n.selecionar(i.id) },
          h("b", { class: `aud-grav ${i.gravidade}` }, rot[i.gravidade]), ` ${i.nome ? i.nome + ": " : ""}${i.mensagem}`),
        i.correcao ? h("button", { type: "button", class: "bt-texto aud-fix", title: i.resumo, onclick: () => n.corrigirAuditoria([i]) }, "Corrigir") : null))),
    ];
  }

  /** Lista de mudanças (diferenca.js) como linhas clicáveis. */
  listaMudancas(itens) {
    const n = this.app.n;
    if (!itens.length) return h("p", { class: "painel-vazio" }, "Sem diferenças.");
    const sinal = { novo: "+", removido: "−", alterado: "~" };
    return h("div", { class: "hist-dif" }, itens.slice(0, 40).map(i => h("div", { class: `hist-dif-item ${i.tipo}` },
      h("button", { type: "button", class: "hist-dif-nome", onclick: () => i.tipo !== "removido" && n.elemento(i.id) && n.selecionar(i.id) }, `${sinal[i.tipo]} ${i.nome}${i.tipo === "novo" ? " (novo)" : i.tipo === "removido" ? " (removido)" : ""}`),
      ...(i.campos ?? []).slice(0, 8).map(c => h("div", { class: "hist-dif-campo" }, h("span", { class: "mono" }, c.caminho), ": ", h("s", {}, c.de), " → ", h("b", {}, c.para))))));
  }

  p_historico() {
    const n = this.app.n;
    const app = this.app;
    const { itens, cursor } = n.historico();
    const ramos = n.ramos();
    const abertos = (this.histAbertos ??= new Set());
    const abertosRamo = (this.ramosAbertos ??= new Set());
    const alternar = (conj, k) => { conj.has(k) ? conj.delete(k) : conj.add(k); this.app.render(); };
    const linhas = [{ indice: 0, texto: "Início do projeto" }, ...itens].reverse();
    const tocando = !!app.replay;
    return [
      h("p", { class: "painel-vazio" }, `${cursor} de ${itens.length}. Clique num ponto para voltar ou avançar até ele; "±" mostra o que mudou naquele passo.`),
      h("div", { class: "aud-acoes" },
        h("button", { type: "button", class: "bt-texto", disabled: itens.length ? null : "", onclick: () => app.reproduzirHistorico() }, tocando ? "■ Parar" : "▶ Reproduzir a construção"),
        h("button", { type: "button", class: "bt-texto", disabled: cursor ? null : "", title: "Guarda a linha até este ponto para voltar depois; depois volte atrás e experimente outro caminho", onclick: () => { n.guardarVariacao(); app.mensagem("Variação guardada. Desfaça e tente outro caminho; as duas linhas ficam salvas."); } }, "Guardar como variação")),
      ...(ramos.length ? [h("div", { class: "hist-secao" }, `Variações (${ramos.length})`), h("div", { class: "lista" }, ramos.map(r => h("div", { class: "hist-ramo" },
        h("div", { class: "item" },
          h("span", { class: "item-nome", title: r.ultimo }, `${r.nome} · ${r.passos} passos`),
          h("button", { type: "button", class: "bt-texto aud-fix", onclick: () => { if (n.irParaVariacao(r.id)) app.mensagem(`Agora você está em "${r.nome}". A linha anterior ficou guardada como outra variação.`); } }, "Abrir"),
          h("button", { type: "button", class: "bt-texto aud-fix", title: "O que muda entre o estado atual e esta variação", onclick: () => alternar(abertosRamo, r.id) }, "±"),
          h("button", { type: "button", class: "bt-texto aud-fix", title: "Excluir variação", onclick: () => n.removerVariacao(r.id) }, "×")),
        abertosRamo.has(r.id) ? this.listaMudancas(n.mudancasContraVariacao(r.id)) : null)))] : []),
      h("div", { class: "hist-secao" }, "Passos"),
      h("div", { class: "lista" }, linhas.map(it => h("div", { class: "hist-passo" },
        h("div", { class: `item ${it.indice === cursor ? "ativo atual" : ""} ${it.indice > cursor ? "futuro" : ""}` },
          h("button", { type: "button", class: "item-nome", style: "border:0;background:none;text-align:left;display:flex;gap:8px;align-items:center;min-width:0;flex:1", onclick: () => n.irPara(it.indice) },
            h("span", { class: "item-meta num" }, String(it.indice)), h("span", { class: "item-nome", title: it.texto }, it.texto)),
          it.indice ? h("button", { type: "button", class: "bt-texto aud-fix", title: "O que mudou neste passo", onclick: () => alternar(abertos, it.indice) }, "±") : null),
        abertos.has(it.indice) ? this.listaMudancas(n.mudancasDoPasso(it.indice)) : null))),
    ];
  }

  p_decisoes() {
    const n = this.app.n;
    const decs = n.projeto.memoria.ativas().filter(d => d.status === "protegida" && !d.alvo.startsWith("__") && !["tipo", "nome", "z"].includes(d.propriedade));
    const porAlvo = {};
    for (const d of decs) (porAlvo[d.alvo] ??= []).push(d);
    return [
      h("p", { class: "painel-vazio" }, "O que você definiu fica protegido: mudanças que você não pediu são desfeitas na hora."),
      ...(decs.length ? [] : [h("p", { class: "painel-vazio" }, "Nenhuma decisão protegida ainda.")]),
      ...Object.entries(porAlvo).map(([alvo, ds]) => h("div", { class: "lista" },
        h("button", { type: "button", class: "item", onclick: () => n.selecionar(alvo) },
          h("span", { html: icone("escudo", 14) }), h("span", { class: "item-nome" }, n.rotulo(alvo))),
        ds.map(d => h("div", { class: "item", style: "padding-left:26px" },
          h("span", { class: "item-nome mono", title: d.pedidoOriginal ?? "" }, d.propriedade),
          h("span", { class: "chip prot num" }, typeof d.valor === "object" ? JSON.stringify(d.valor) : String(d.valor)))))),
    ];
  }
}

class LateralDireita {
  constructor(app) {
    this.app = app;
    this.pilha = h("nav", { class: "pilha", "aria-label": "Propriedades e comportamento" });
    this.paineis = h("div", { class: "paineis" });
    this.divisor = h("div", { class: "dock-divisor", role: "separator", "aria-orientation": "horizontal", "aria-label": "Redimensionar o editor inferior", tabindex: "0",
      onpointerdown: e => this.arrastarDivisor(e),
      onkeydown: e => { if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); this.definirAltura((this.app.ui.dockAlt ?? 0.36) + (e.key === "ArrowUp" ? 0.05 : -0.05), true); } } });
    this.barraDock = h("div", { class: "dock-barra" });
    this.raiz = h("aside", { class: "lateral dir" }, this.divisor, this.barraDock, this.pilha, this.paineis);
  }

  // ---------- modo híbrido: o editor completo fica embaixo do canvas, abre ao selecionar ----------
  definirAltura(f, salvar) {
    const a = Math.max(0.25, Math.min(0.75, f));
    this.app.ui.dockAlt = a;
    this.divisor.setAttribute("aria-valuemin", "25");
    this.divisor.setAttribute("aria-valuemax", "75");
    this.divisor.setAttribute("aria-valuenow", String(Math.round(a * 100)));
    this.app.aplicarDock?.();
    if (salvar) this.app.salvarUI();
  }
  arrastarDivisor(e) {
    e.preventDefault();
    const meio = this.raiz.parentElement, r = meio.getBoundingClientRect();
    const mover = ev => this.definirAltura((r.bottom - ev.clientY) / r.height, false);
    const fim = () => { document.removeEventListener("pointermove", mover); document.removeEventListener("pointerup", fim); this.app.salvarUI(); this.app.render(); setTimeout(() => { if (this.app.ui.hibrido) this.app.ajustarTelaReal(); this.app.render(); }, 30); };
    document.addEventListener("pointermove", mover); document.addEventListener("pointerup", fim);
  }

  renderHibrido() {
    const { app } = this, n = app.n, ui = app.ui;
    const ids = n.selecionados();
    const visivel = true; // o formulário é a forma de construir: fica sempre aberto no modo híbrido
    this.raiz.classList.add("dock");
    this.raiz.hidden = !visivel;
    this.pilha.hidden = true;
    app.aplicarDock?.();
    if (!visivel) return;
    const el = n.selecionado();
    const titulo = ids.length > 1 ? `${ids.length} elementos` : el?.nome ?? "Nada selecionado";
    this.formulario ??= new Formulario(app);
    let aba = ui.dockAba ?? "geral";
    // selecionar algo gerado pelo formulário (na tela, pelo agente ou pela lista) abre o cartão dele
    if (el?.construtor && ui.dockItem !== el.construtor) {
      ui.dockItem = el.construtor;
      const t = n.construtor().itens.find(i => i.id === el.construtor);
      // A seleção acompanha o formulário sem tirar o usuário da aba Código/Histórico.
    }
    const ABAS = [["blocos", "Construção"], ["principal", "Aparência"], ["comportamento", "Comportamentos"], ["codigo", "Código"], ["documentacao", "Documentação do programa"], ["efeitos", "Efeitos"], ["modelos", "Modelos"], ["geral", "Composição"], ["faixa", "Ribbon"], ["historico", "Histórico e recuperação"], ["agente", "Agente"]];
    if (aba === "elemento") aba = "principal";
    this.barraDock.replaceChildren(
      h("div", { class: "dock-abas", role: "tablist" }, ABAS.slice(0,4).map(([id, t]) => h("button", { type: "button", role: "tab", class: `dock-aba ${aba === id ? "ativa" : ""}`, "aria-selected": String(aba === id),
        onclick: () => { ui.dockAba = id; app.salvarUI(); app.render(); } }, t))),
      h("select", { class: "dock-ferramentas", "aria-label": "Biblioteca e ferramentas da Visual Script", onchange: e => { if (!e.target.value) return; ui.dockAba = e.target.value; app.salvarUI(); app.render(); } },
        h("option", { value: "", selected: !ABAS.slice(4).some(([id]) => id === aba) }, "Biblioteca e ferramentas…"),
        ABAS.slice(4).map(([id, t]) => h("option", { value: id, selected: aba === id }, t))),
      ...[
      aba === "elemento" && el?.construtor ? h("button", { type: "button", class: "bt-texto ap-mini", title: "Voltar ao formulário que gerou este elemento", onclick: () => { const t = n.construtor().itens.find(i => i.id === el.construtor); ui.dockAba = t?.tipo === "ribbon" ? "faixa" : "geral"; ui.dockItem = el.construtor; app.salvarUI(); app.render(); } }, "Abrir no formulário") : null].filter(Boolean),
      h("button", { type: "button", class: "bt-texto ap-mini", "aria-pressed": String(!!ui.dockFixo), title: "Manter o editor aberto mesmo sem seleção", onclick: () => { ui.dockFixo = !ui.dockFixo; app.salvarUI(); app.render(); } }, ui.dockFixo ? "Fixo" : "Fixar"),
      botaoIcone("previa", "Testar interface", () => app.setModo("previa"), { tam: 14 }),
      botaoIcone("salvar", "Salvar projeto", () => n.salvarArquivo(), { tam: 14 }),
      botaoIcone("fechar", "Voltar ao Designer", () => app.setModo("designer"), { tam: 14 }));
    this.paineis.hidden = false;
    const corpoForja = app.ambiente?.painel(aba);
    if (corpoForja) {
      this.paineis.classList.add("modo-form");
      this.paineis.replaceChildren(h("div", { class: "forja-pagina" }, corpoForja));
      return;
    }
    if (aba === "agente") {
      this.paineis.classList.add("modo-form");
      app.painelAgente.render();
      this.paineis.replaceChildren(h("div", { class: "fm-pagina dock-agente" }, app.painelAgente.raiz));
      return;
    }
    if (aba !== "elemento") {
      this.paineis.classList.add("modo-form");
      this.paineis.replaceChildren(h("div", { class: "fm-pagina" }, aba === "faixa" ? this.formulario.faixa() : this.formulario.geral()));
      return;
    }
    this.paineis.classList.remove("modo-form");
    const foco = document.activeElement;
    const idFoco = this.paineis.contains(foco) ? foco.id : null;
    this.paineis.replaceChildren(
      painel("modelo", "Componentes e presets", this.p_componentes(), null, "componentes"),
      ...PAINEIS_DIR.filter(([id]) => id !== "inspetor").map(([id, t, ic]) => painel(ic, t, this[`p_${id}`](), null, id)));
    if (idFoco) document.getElementById(idFoco)?.focus();
  }

  /** Adicionar/remover componentes, presets de estilo e jeitos de organizar: tudo usa comandos que já existem. */
  p_componentes() {
    const { app } = this, n = app.n, ids = n.selecionados();
    const tem = ids.length > 0;
    const dentro = ids.length === 1 && n.elemento(ids[0])?.tipo === "container";
    const bt = (rot, fn, extra = {}) => h("button", { type: "button", class: `bt-texto dock-bt ${extra.perigo ? "perigo" : ""}`, disabled: extra.desab, title: extra.titulo ?? rot, onclick: fn }, extra.ic ? h("span", { html: icone(extra.ic, 14) }) : null, rot);
    const grupos = {};
    for (const [tipo, d] of Object.entries(CATALOGO)) if (tipo !== "container") (grupos[d.grupo ?? "Outros"] ??= []).push([tipo, d]);
    return h("div", { class: "dock-corpo" },
      h("div", { class: "sub" }, dentro ? `Adicionar dentro de ${n.rotulo(ids[0])}` : "Adicionar componente"),
      dentro ? h("small", { class: "dock-dica" }, "Container selecionado: os novos componentes entram nele.") : null,
      ...Object.entries(grupos).map(([g, itens]) => h("div", { class: "dock-grupo" }, h("small", {}, g),
        h("div", { class: "botoes-linha" }, itens.map(([tipo, d]) => bt(d.nome, () => app.inserir(tipo), { ic: d.icone }))))),
      h("div", { class: "sub" }, "Selecionado"),
      h("div", { class: "botoes-linha" },
        bt("Duplicar", () => n.duplicarVarios(ids), { desab: !tem, ic: "copiar" }),
        bt("Remover", () => n.removerVarios(ids), { desab: !tem, ic: "excluir", perigo: true }),
        bt("Subir na ordem", () => n.moverNaOrdem(ids[0], 1), { desab: ids.length !== 1, titulo: "Troca de lugar com o irmão de cima (mesmo container)" }),
        bt("Descer na ordem", () => n.moverNaOrdem(ids[0], -1), { desab: ids.length !== 1 }),
        bt("Testar (prévia)", () => app.setModo("previa"), { titulo: "Abre a prévia interativa para ver os sinais" }),
        bt("Para frente", () => ids.forEach(i => n.camada(i, "frente")), { desab: !tem }),
        bt("Para trás", () => ids.forEach(i => n.camada(i, "tras")), { desab: !tem })),
      h("div", { class: "sub" }, "Organização"),
      h("div", { class: "botoes-linha" },
        ...["livre", "linha", "coluna"].map(m => bt(`Agrupar: ${m}`, () => app.agrupar(m), { desab: !tem })),
        bt("Desagrupar", () => app.desagrupar(), { desab: !ids.some(i => n.elemento(i)?.tipo === "container") })),
      ids.length === 1 && n.elemento(ids[0])?.tipo === "container"
        ? h("div", { class: "botoes-linha" }, ...["livre", "linha", "coluna"].map(m => bt(`Layout ${m}`, () => n.definir(ids[0], { "layout.modo": m }, `Layout ${m} em ${n.rotulo(ids[0])}`), { titulo: "Muda o modo de organização do container selecionado" })))
        : null,
      h("div", { class: "sub" }, "Presets de estilo"),
      h("div", { class: "botoes-linha" }, Object.entries(VARIANTES).map(([k, v]) => bt(v.nome, () => n.definirNosSelecionados(v.v, `Estilo ${v.nome}`), { desab: !tem }))),
      h("div", { class: "botoes-linha" },
        bt("Tamanhos P/M/G", () => app.variantes("tamanhos"), { desab: ids.length !== 1 }),
        bt("Variantes de estilo", () => app.variantes("estilos"), { desab: ids.length !== 1 }),
        bt("Refinar (3 opções)", () => app.variantes("refinar"), { desab: ids.length !== 1 })),
      h("div", { class: "sub" }, "Paleta em todos os elementos"),
      h("div", { class: "botoes-linha" }, Object.entries(PALETAS).map(([k, p]) => bt(p.nome, () => app.aplicarPaleta(k), { titulo: "Recolore TODOS os elementos; o que você definiu antes vira pergunta" }))));
  }

  render() {
    const ui = this.app.ui;
    if (ui.hibrido && ui.modo === "designer") {
      // Os campos possuem ids novos a cada montagem; preserve o foco pela posição
      // semântica e a rolagem somente enquanto se edita a mesma seleção e aba.
      const chave = `${ui.dockAba}|${ui.dockSecao}|${this.app.n.selecionados().join(",")}`;
      const mesmaVista = this.chaveFormulario === chave;
      const seletores = "input,textarea,select,button,summary";
      const controles = [...this.paineis.querySelectorAll(seletores)];
      const foco = document.activeElement, indice = controles.indexOf(foco);
      const cursor = indice >= 0 ? [foco.selectionStart, foco.selectionEnd] : null;
      const scroll = this.paineis.scrollTop;
      const detalhes = [...this.paineis.querySelectorAll("details")].map(el => el.open);
      this.renderHibrido();
      const chaveAtual = `${ui.dockAba}|${ui.dockSecao}|${this.app.n.selecionados().join(",")}`;
      if (mesmaVista && chave === chaveAtual) {
        [...this.paineis.querySelectorAll("details")].forEach((el, i) => { if (i < detalhes.length) el.open = detalhes[i]; });
        this.paineis.scrollTop = scroll;
        if (indice >= 0) { const novo = this.paineis.querySelectorAll(seletores)[indice]; novo?.focus({ preventScroll: true }); if (cursor && typeof novo?.setSelectionRange === "function" && cursor[0] !== null) { try { novo.setSelectionRange(...cursor); } catch { /* campos numéricos não têm cursor de texto */ } } }
      }
      this.chaveFormulario = chaveAtual;
      return;
    }
    this.paineis.removeAttribute("role"); this.paineis.removeAttribute("aria-labelledby");
    this.raiz.classList.remove("dock"); this.raiz.hidden = false; this.pilha.hidden = false;
    this.paineis.classList.remove("modo-form");
    const abertos = ui.dir ?? [];
    this.pilha.replaceChildren(...PAINEIS_DIR.map(([id, t, ic]) =>
      botaoIcone(ic, t, () => this.app.alternarPainelDir(id), { attrs: { "aria-pressed": String(abertos.includes(id)) } })));
    this.paineis.hidden = !abertos.length;
    if (!abertos.length) return;
    const foco = document.activeElement;
    const idFoco = this.paineis.contains(foco) ? foco.id : null;
    this.paineis.replaceChildren(...PAINEIS_DIR.filter(([id]) => abertos.includes(id)).map(([id, t, ic]) =>
      painel(ic, t, this[`p_${id}`](), () => this.app.alternarPainelDir(id), id)));
    if (idFoco) document.getElementById(idFoco)?.focus();
  }

  /** Campos ligados ao elemento; com vários selecionados, a mudança vale para todos. */
  campos(defs, id, el) {
    const n = this.app.n;
    const varios = id !== "__canvas" && n.selecionados().length > 1;
    return defs.filter(d => !d.quando || d.quando(el)).map(def => campo(def, ler(el, def.caminho) ?? def.padrao, v => {
      if (def.caminho === "rotulo" && typeof v === "string" && !this.app.ui.manterNomes) v = normalizarTitulo(v);
      return varios
      ? n.definirNosSelecionados({ [def.caminho]: v }, `${def.rotulo}: ${Array.isArray(v) ? v.join(", ") : v} em ${n.selecionados().length} elementos`)
      : n.definir(id, { [def.caminho]: v }, `${def.rotulo}: ${Array.isArray(v) ? v.join(", ") : v} em ${n.rotulo(id)}`);
    }));
  }

  /** Esconde o campo simples quando a lista avançada correspondente está em uso (ela é quem vale). */
  campoSimplesAtivo(c, el) {
    const e = el.estilo ?? {};
    const ocultar = { "estilo.fundo": (e.preenchimentos ?? []).length, "estilo.borda": (e.tracos ?? []).length, "estilo.larguraBorda": (e.tracos ?? []).length,
      "estilo.raio": Array.isArray(e.cantos) && e.cantos.length === 4, "estilo.sombra": (e.efeitos ?? []).length };
    return !ocultar[c.caminho];
  }

  /** Preenchimentos, traços, efeitos, cantos e mistura (vale para todos os selecionados). */
  aparencia(el) {
    const n = this.app.n;
    const gravar = (caminho, valor, texto) => {
      const t = `${texto} em ${n.selecionados().length > 1 ? n.selecionados().length + " elementos" : n.rotulo(el.id)}`;
      return n.selecionados().length > 1 ? n.definirNosSelecionados({ [caminho]: valor }, t) : n.definir(el.id, { [caminho]: valor }, t);
    };
    return [h("div", { class: "sub ap-titulo" }, "Aparência avançada"), ...secaoAparencia({ el, ler: c => ler(el, c), gravar })];
  }

  semSelecao(texto) {
    return h("p", { class: "painel-vazio" }, texto);
  }

  /** Elemento de referência (o principal) e se há vários. */
  alvo() {
    const n = this.app.n;
    return { el: n.selecionado(), ids: n.selecionados() };
  }

  /** Cores usadas no projeto, para aplicar com um clique. */
  amostras() {
    const n = this.app.n;
    const cores = new Set();
    const ok = c => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
    if (ok(n.tela.fundo)) cores.add(n.tela.fundo.toLowerCase());
    for (const e of n.elementos()) for (const c of [e.estilo?.fundo, e.estilo?.cor, e.estilo?.borda]) if (ok(c)) cores.add(c.toLowerCase());
    const lista = [...cores].slice(0, 16);
    if (!lista.length) return null;
    return h("div", { class: "amostras-bloco" },
      h("div", { class: "sub" }, "Cores do projeto"),
      h("div", { class: "amostras", role: "group", "aria-label": "Cores do projeto" }, lista.map(c => h("button", {
        type: "button", class: "amostra", style: `background:${c}`, title: `${c} · clique: fundo · Shift+clique: texto`, "aria-label": `Aplicar ${c}`,
        onclick: ev => n.definirNosSelecionados({ [ev.shiftKey ? "estilo.cor" : "estilo.fundo"]: c }, `${ev.shiftKey ? "Cor do texto" : "Fundo"} ${c} em ${n.descreverGrupo(n.selecionados())}`),
      }))),
      h("p", { class: "painel-vazio" }, "Clique: fundo · Shift+clique: cor do texto"));
  }

  p_propriedades() {
    const n = this.app.n;
    const { el, ids } = this.alvo();
    if (!el) {
      return [h("div", { class: "sub" }, "Tela"), h("div", { class: "grade-2" }, this.campos(CAMPOS_CANVAS.slice(0, 2), "__canvas", n.tela)), this.campos(CAMPOS_CANVAS.slice(2), "__canvas", n.tela)];
    }
    if (ids.length > 1) {
      const b = n.limites(ids);
      const bt = (ic, t, f, des = false) => botaoIcone(ic, t, f, { tam: 16, attrs: { disabled: des } });
      return [
        h("div", { class: "item", style: "padding:0" }, h("span", { html: icone("selTudo", 16) }), h("span", { class: "item-nome" }, `${ids.length} elementos selecionados`), h("span", { class: "chip num" }, `${b.largura}×${b.altura}`)),
        h("div", { class: "lista" }, ids.map(id => h("button", { type: "button", class: "item", title: "Clique para selecionar só este", onclick: () => n.selecionar(id) }, h("span", { html: icone(CATALOGO[n.elemento(id).tipo]?.icone, 14) }), h("span", { class: "item-nome" }, n.rotulo(id))))),
        h("div", { class: "sub" }, "Alinhar entre si"),
        h("div", { class: "botoes-linha" },
          bt("al-esq", "Alinhar à esquerda", () => n.alinharVarios(ids, "esquerda")), bt("al-centroH", "Centralizar na horizontal", () => n.alinharVarios(ids, "centroH")),
          bt("al-dir", "Alinhar à direita", () => n.alinharVarios(ids, "direita")), bt("al-topo", "Alinhar ao topo", () => n.alinharVarios(ids, "topo")),
          bt("al-centroV", "Centralizar na vertical", () => n.alinharVarios(ids, "centroV")), bt("al-base", "Alinhar à base", () => n.alinharVarios(ids, "base"))),
        h("div", { class: "sub" }, "Distribuir e transformar"),
        h("div", { class: "botoes-linha" },
          bt("distH", "Distribuir na horizontal", () => n.distribuir(ids, "h"), ids.length < 3), bt("distV", "Distribuir na vertical", () => n.distribuir(ids, "v"), ids.length < 3),
          bt("girar", "Girar 90°", () => n.girar(ids, 90)), bt("espelharH", "Espelhar horizontal", () => n.espelhar(ids, "H")),
          bt("duplicar", "Duplicar", () => n.duplicarVarios(ids)), bt("excluir", "Excluir", () => n.removerVarios(ids))),
        this.campos(CAMPOS_LAYOUT.slice(5), el.id, el),
      ];
    }
    const def = CATALOGO[el.tipo];
    return [
      h("div", { class: "item", style: "padding:0" }, h("span", { html: icone(def.icone, 16) }), h("span", { class: "item-nome" }, el.nome), h("span", { class: "chip num" }, el.id)),
      campo({ rotulo: "Nome na lista de camadas", caminho: "nome", tipo: "texto" }, el.nome, v => n.renomearPadronizado(el.id, v || el.nome, !!this.app.ui.manterNomes)),
      campo({ rotulo: "Preservar a escrita dos nomes", caminho: "manterNomes", tipo: "check" }, this.app.ui.manterNomes, v => { this.app.ui.manterNomes = v; this.app.salvarUI(); this.render(); }),
      ...this.campos(def.campos, el.id, el),
      h("div", { class: "sub" }, "Layout"),
      h("div", { class: "grade-2" }, this.campos(CAMPOS_LAYOUT.slice(0, 4), el.id, el)),
      this.campos(CAMPOS_LAYOUT.slice(4), el.id, el),
      ...this.secaoContrato({ ...el, id: el.id }),
    ];
  }

  /**
   * Contrato do container conceitual: tipo fixo (migração explícita), limites, ligações com o código
   * e os vínculos a ferramentas do armazém. Fica fechado até a pessoa abrir ("fácil por fora").
   */
  secaoContrato(el) {
    const n = this.app.n;
    const tipo = el.semantica?.tipo ?? el.tipo;
    const aberto = (this.contratoAberto ??= false);
    const d = h("details", { class: "insp-secao contrato", open: aberto },
      h("summary", {}, `Contrato e vínculos${el.vinculos?.length ? ` (${el.vinculos.length} ⚡)` : ""}`),
      h("div", { class: "insp-corpo" },
        h("div", { class: "item", style: "padding:0" }, h("span", { class: "item-nome" }, "Tipo conceitual"), h("span", { class: "chip" }, tipo),
          el.semantica?.confianca ? h("span", { class: "chip", title: (el.semantica.motivos ?? []).join(", ") }, `${Math.round(el.semantica.confianca * 100)}%`) : null,
          h("button", { type: "button", class: "bt-texto", title: "O tipo é fixo: mudar exige migração explícita, registrada no elemento", onclick: () => this.migrarTipo(el) }, "Migrar…")),
        h("div", { class: "grade-2" }, this.campos(CAMPOS_CONTRATO.slice(0, 4), el.id, el)),
        this.campos(CAMPOS_CONTRATO.slice(4), el.id, el),
        h("div", { class: "sub" }, "Vínculos"),
        (el.vinculos ?? []).length
          ? h("div", { class: "lista" }, el.vinculos.map(v => h("div", { class: "item" }, h("span", { class: "item-nome", title: `Sinal: ${v.sinal}` }, `⚡ ${v.evento} → ${v.ref}`),
              botaoIcone("fechar", `Desvincular ${v.ref}`, () => { n.desvincular(el.id, v.id); this.app.painelArmazem.marcarUsos().then(() => this.app.render()); }, { tam: 14 }))))
          : h("p", { class: "painel-vazio" }, "Sem vínculos."),
        h("button", { type: "button", class: "bt-texto", onclick: () => this.app.vincularSelecao() }, "Vincular a ferramenta do armazém…")));
    d.addEventListener("toggle", () => { this.contratoAberto = d.open; });
    return [d];
  }

  migrarTipo(el) {
    const tipos = [...new Set([...Object.keys(TIPOS_RECONHECIDOS), ...Object.keys(CATALOGO)])].filter(t => t !== (el.semantica?.tipo ?? el.tipo));
    const sel = h("select", { class: "cp-entrada", "aria-label": "Novo tipo" }, tipos.map(t => h("option", { value: t }, TIPOS_RECONHECIDOS[t]?.nome ?? CATALOGO[t]?.nome ?? t)));
    const motivo = h("input", { type: "text", class: "cp-entrada", placeholder: "Por que mudar o tipo", "aria-label": "Motivo" });
    this.app.dialogo({
      titulo: `Migrar o tipo de ${el.nome}`, icone: "alerta",
      texto: "O código gerado e quem consome este elemento esperam o tipo atual. A migração fica registrada no elemento e pode ser desfeita.",
      corpo: h("div", { class: "cp" }, h("span", { class: "cp-rotulo" }, "Novo tipo"), sel, h("span", { class: "cp-rotulo" }, "Motivo"), motivo),
      opcoes: [
        { id: "migrar", rotulo: "Migrar", primario: true, fazer: () => { try { this.app.n.migrarTipoSemantico(el.id, sel.value, motivo.value); } catch (e) { avisar(e.message, "alerta"); } } },
        { id: "cancelar", rotulo: "Cancelar", fazer: () => {} },
      ],
    });
  }

  /**
   * Inspetor único (como Figma/Webflow): seções em sanfona para o que está selecionado.
   * Reaproveita os mesmos campos dos painéis separados, que continuam disponíveis.
   */
  p_inspetor() {
    const { el, ids } = this.alvo();
    const abertas = (this.inspAbertas ??= new Set(["pos", "estilo"]));
    const secao = (id, titulo, corpo) => {
      const d = h("details", { class: "insp-secao", open: abertas.has(id) }, h("summary", {}, titulo), h("div", { class: "insp-corpo" }, corpo));
      d.addEventListener("toggle", () => { if (d.open) abertas.add(id); else abertas.delete(id); });
      return d;
    };
    const out = [secao("pos", el ? "Propriedades do objeto" : "Tela", this.p_propriedades())];
    if (!el) return out;
    out.push(secao("estilo", "Cores e estilos", this.p_estilo()));
    out.push(secao("efeitos", "Transformação e efeitos", this.p_efeitos()));
    if (ids.length === 1) {
      const bt = (r, tipo) => h("button", { type: "button", class: "bt-texto", onclick: () => this.app.variantes(tipo) }, r);
      out.push(secao("var", "Variantes", h("div", { class: "botoes-linha" }, bt("Tamanhos P/M/G", "tamanhos"), bt("Estilos", "estilos"), bt("Refinar (3 opções)", "refinar"))));
    }
    return out;
  }

  p_estilo() {
    const { el, ids } = this.alvo();
    if (!el) return this.semSelecao("Selecione um ou mais elementos para editar cores, borda, fonte e sombra.");
    const temTexto = ids.some(id => TIPOS_COM_TEXTO.includes(this.app.n.elemento(id).tipo));
    return [
      ids.length > 1 ? h("p", { class: "painel-vazio" }, `Mudanças valem para os ${ids.length} selecionados.`) : null,
      this.amostras(),
      h("div", { class: "sub" }, "Cores e forma"),
      ...this.campos(CAMPOS_ESTILO.filter(c => this.campoSimplesAtivo(c, el)), el.id, el),
      ...(ids.every(id => TIPOS_AVANCADOS.includes(this.app.n.elemento(id).tipo)) ? this.aparencia(el) : []),
      ...(temTexto ? [h("div", { class: "sub" }, "Texto"), ...this.campos(CAMPOS_TEXTO, el.id, el)] : []),
    ];
  }

  p_efeitos() {
    const { el, ids } = this.alvo();
    if (!el) return this.semSelecao("Selecione um ou mais elementos para girar, espelhar e aplicar efeitos.");
    return [
      ids.length > 1 ? h("p", { class: "painel-vazio" }, `Mudanças valem para os ${ids.length} selecionados.`) : null,
      h("div", { class: "sub" }, "Transformação"),
      ...this.campos(CAMPOS_TRANSFORMACAO, el.id, el),
      h("div", { class: "sub" }, "Efeitos"),
      ...this.campos(CAMPOS_EFEITOS, el.id, el),
    ];
  }

  /** Como o elemento se adapta à largura da tela. */
  p_responsivo() {
    const n = this.app.n;
    const { el, ids } = this.alvo();
    if (!el) {
      return [
        h("p", { class: "painel-vazio" }, n.tela.responsivo === false
          ? "O HTML sai no tamanho fixo da tela. Ligue o responsivo em Propriedades da tela."
          : "O HTML se adapta à largura de quem abre. Selecione um elemento para dizer onde ele fica preso e em que telas aparece."),
        h("button", { type: "button", class: "bt-texto", onclick: () => this.app.setModo("previa"), html: `${icone("previa", 14)} Testar na Prévia` }),
      ];
    }
    const pai = el.pai ? n.elemento(el.pai) : null;
    const emFlex = pai?.tipo === "container" && (pai.layout?.modo === "linha" || pai.layout?.modo === "coluna");
    const out = [];
    if (ids.length > 1) out.push(h("p", { class: "painel-vazio" }, `Mudanças valem para os ${ids.length} selecionados.`));
    if (emFlex) {
      out.push(h("p", { class: "painel-vazio" }, `Dentro de ${pai.nome} (${pai.layout.modo}): a posição vem do container. Escolha como o tamanho se adapta.`));
      out.push(...this.campos(CAMPOS_FILHO, el.id, el));
    } else {
      const P = pai ? pai : { x: 0, y: 0, largura: n.tela.largura, altura: n.tela.altura };
      const r = restricoes(el, P);
      const nomeH = { esquerda: "preso à esquerda", direita: "preso à direita", ambos: "estica com a tela", centro: "centralizado", escala: "proporcional" }[r.h];
      const nomeV = { topo: "preso ao topo", base: "preso à base", ambos: "estica na altura", centro: "centralizado", escala: "proporcional" }[r.v];
      out.push(this.diagramaRestricoes(r));
      out.push(h("p", { class: "painel-vazio" }, `Hoje: ${nomeH}, ${nomeV}${pai ? ` dentro de ${pai.nome}` : " na tela"}.`));
      out.push(...this.campos(CAMPOS_RESPONSIVO.slice(0, 2), el.id, el));
    }
    out.push(h("div", { class: "sub" }, "Por tamanho de tela"));
    out.push(...this.campos(CAMPOS_RESPONSIVO.slice(2), el.id, el));
    out.push(h("button", { type: "button", class: "bt-texto", onclick: () => this.app.setModo("previa"), html: `${icone("previa", 14)} Testar na Prévia (arraste a borda)` }));
    return out;
  }

  /** Desenho das âncoras: as linhas cheias mostram a que lado o elemento está preso. */
  diagramaRestricoes(r) {
    const c = "var(--acento)";
    const f = "var(--linha-forte)";
    const esq = r.h === "esquerda" || r.h === "ambos";
    const dir = r.h === "direita" || r.h === "ambos";
    const topo = r.v === "topo" || r.v === "ambos";
    const base = r.v === "base" || r.v === "ambos";
    const ch = r.h === "centro";
    const cv = r.v === "centro";
    return h("div", { class: "diagrama-ancoras", "aria-hidden": "true", html: `<svg viewBox="0 0 120 80" width="120" height="80">
      <rect x="1" y="1" width="118" height="78" rx="4" fill="none" stroke="${f}" stroke-dasharray="3 3"/>
      <rect x="40" y="26" width="40" height="28" rx="3" fill="color-mix(in srgb, ${c} 18%, transparent)" stroke="${c}"/>
      <line x1="2" y1="40" x2="40" y2="40" stroke="${esq ? c : f}" stroke-width="${esq ? 2.5 : 1}" ${esq ? "" : 'stroke-dasharray="2 3"'}/>
      <line x1="80" y1="40" x2="118" y2="40" stroke="${dir ? c : f}" stroke-width="${dir ? 2.5 : 1}" ${dir ? "" : 'stroke-dasharray="2 3"'}/>
      <line x1="60" y1="2" x2="60" y2="26" stroke="${topo ? c : f}" stroke-width="${topo ? 2.5 : 1}" ${topo ? "" : 'stroke-dasharray="2 3"'}/>
      <line x1="60" y1="54" x2="60" y2="78" stroke="${base ? c : f}" stroke-width="${base ? 2.5 : 1}" ${base ? "" : 'stroke-dasharray="2 3"'}/>
      ${ch ? `<line x1="60" y1="30" x2="60" y2="50" stroke="${c}" stroke-width="2"/>` : ""}${cv ? `<line x1="46" y1="40" x2="74" y2="40" stroke="${c}" stroke-width="2"/>` : ""}
      ${r.h === "escala" || r.v === "escala" ? `<text x="60" y="44" font-size="11" text-anchor="middle" fill="${c}">%</text>` : ""}
    </svg>` });
  }

  /** Comportamentos prontos, como o elemento abre e fecha, e estados visuais. */
  p_comportamento() {
    const n = this.app.n;
    const { el, ids } = this.alvo();
    if (!el) return this.semSelecao("Selecione o gatilho (o que o usuário clica ou aponta) para ligar um comportamento, ou o elemento que abre para ajustar como ele aparece.");
    const out = [];
    if (ids.length <= 2) {
      const gatilho = ids.length === 2 ? ids[0] : el.id;
      const outros = n.elementos().filter(e => e.id !== gatilho);
      this.alvoComp = ids.length === 2 ? ids[1] : outros.some(o => o.id === this.alvoComp) ? this.alvoComp : "";
      out.push(h("div", { class: "sub" }, "Comportamentos prontos"));
      out.push(h("p", { class: "painel-vazio" }, `Gatilho: ${n.rotulo(gatilho)}. Escolha o que abre e clique num comportamento.`));
      out.push(campo({ rotulo: "O que abre (alvo)", caminho: "alvo-comportamento", tipo: "select", opcoes: [["", "Escolha..."], ...outros.map(o => [o.id, o.nome])] }, this.alvoComp, v => { this.alvoComp = v; this.render(); }));
      out.push(campo({rotulo:'Tipo de comportamento',caminho:'tipo-comportamento',tipo:'select',opcoes:[['','Todos os tipos'],...CATEGORIAS_COMPORTAMENTOS.map(c=>[c.id,c.nome])]},this.app.ui.tipoComportamento??'',v=>{this.app.ui.tipoComportamento=v;this.render();}));
      out.push(...CATEGORIAS_COMPORTAMENTOS.filter(cat=>!this.app.ui.tipoComportamento||this.app.ui.tipoComportamento===cat.id).map(cat=>h('section',{'aria-label':cat.nome},h('h3',{class:'sub'},cat.nome),h("div", { class: "comportamentos" }, cat.itens.map(k => {const c=COMPORTAMENTOS[k];return h("button", {
        type: "button", class: "comp-bt", title: c.desc, disabled: !this.alvoComp,
        onclick: () => {
          try { n.aplicarComportamento(k, gatilho, this.alvoComp); this.app.mensagem(`${c.nome} ligado. Teste na Prévia.`, "ok"); }
          catch (e) { this.app.mensagem(e.message, "alerta"); }
        },
      }, h("strong", {}, c.nome), h("span", {}, c.desc));})))));
    } else {
      out.push(h("p", { class: "painel-vazio" }, `Mudanças valem para os ${ids.length} selecionados.`));
    }
    out.push(h("div", { class: "sub" }, "Ao abrir e fechar"));
    out.push(...this.campos(CAMPOS_ABERTURA, el.id, el));
    out.push(h("div", { class: "sub" }, "Estados"));
    out.push(...this.campos(CAMPOS_COMPORTAMENTO, el.id, el));
    return out;
  }

  p_acessibilidade() {
    const { el, ids } = this.alvo();
    if (!el) return this.semSelecao("Selecione um elemento para ajustar papel e rótulo para leitores de tela.");
    if (ids.length > 1) return this.semSelecao("Acessibilidade é definida um elemento por vez. Selecione só um.");
    const avisos = [];
    if (el.tipo === "botao" && !el.rotulo && !el.acessibilidade?.ariaLabel) avisos.push("Botão sem rótulo nem aria-label.");
    if (["toggle", "campo", "icone"].includes(el.tipo) && !el.acessibilidade?.ariaLabel) avisos.push("Dê um rótulo acessível: leitores de tela não têm outro texto para ler aqui.");
    return [...avisos.map(a => h("p", { class: "painel-vazio", style: "color:var(--alerta)" }, a)), ...this.campos(CAMPOS_ACESSIBILIDADE, el.id, el)];
  }

  p_eventos() {
    const n = this.app.n;
    const el = n.selecionado();
    if (!el) return this.semSelecao("Selecione um elemento para ligar eventos a sinais e ações visuais.");
    if (n.selecionados().length > 1) return this.semSelecao("Eventos são definidos um elemento por vez. Selecione só um.");
    const tipos = el.codigo?.isolado?[...new Set([...CATALOGO[el.tipo].eventos,'onChange','onFocus'])]:CATALOGO[el.tipo].eventos;
    if (!tipos.length) return this.semSelecao("Este tipo de elemento não emite eventos.");
    const eventos = el.eventos ?? [];
    const outros = n.elementos().filter(e => e.id !== el.id);
    const salvar = (lista, texto) => n.definir(el.id, { eventos: lista }, texto);
    const mudar = (i, chave, valor) => {
      const lista = structuredClone(eventos);
      lista[i][chave] = valor;
      salvar(lista, `Evento ${lista[i].tipo} de ${el.nome}: ${chave} = ${valor || "nenhum"}`);
    };
    return [
      h("p", { class: "painel-vazio" }, "Cada evento emite um sinal com o nome que você der. O código que usa a interface decide o que fazer com ele."),
      ...eventos.map((ev, i) => h("div", { class: "evento" },
        h("header", {}, h("strong", {}, ev.tipo), botaoIcone("excluir", "Remover evento", () => salvar(eventos.filter((_, k) => k !== i), `Remover evento ${ev.tipo} de ${el.nome}`), { tam: 14 })),
        ev.suspenso ? h("p", { class: "painel-vazio" }, "Evento suspenso. Corrija o alvo e reative quando estiver pronto.") : null,
        campo({ rotulo: "Evento ativo", caminho: `ev${i}.ativo`, tipo: "check" }, !ev.suspenso, v => mudar(i, "suspenso", !v)),
        campo({ rotulo: "Quando", caminho: `ev${i}.tipo`, tipo: "select", opcoes: tipos.map(t => [t, t]) }, ev.tipo, v => mudar(i, "tipo", v)),
        campo({ rotulo: "Sinal emitido", caminho: `ev${i}.dispara`, tipo: "texto" }, ev.dispara, v => mudar(i, "dispara", v.replace(/\s+/g, "_"))),
        campo({ rotulo: "Ação visual", caminho: `ev${i}.acao`, tipo: "select", opcoes: ACOES }, ev.acao ?? "", v => mudar(i, "acao", v)),
        ev.acao==='animar'?[
          campo({rotulo:'Animação',caminho:`ev${i}.animacao`,tipo:'select',opcoes:[['aparecer','Aparecer suavemente'],['revelar','Revelar'],['pulsar','Pulsar']]},ev.animacao?.tipo??'aparecer',v=>mudar(i,'animacao',{...ev.animacao,tipo:v})),
          campo({rotulo:'Duração (ms)',caminho:`ev${i}.duracaoAnimacao`,tipo:'numero',min:80,max:2000,passo:20},ev.animacao?.duracao??180,v=>mudar(i,'animacao',{...ev.animacao,duracao:v})),
        ]:null,
        ev.acao === "aplicarForma" ? campo({ rotulo: "Forma aplicada", caminho: `ev${i}.forma`, tipo: "select", opcoes: Object.entries(FORMAS).map(([k,f]) => [k,f.nome]) }, ev.forma ?? "retangulo", v => mudar(i, "forma", v)) : null,
        ev.acao === "aplicarEstilo" ? [
          campo({ rotulo: "Preenchimento aplicado", caminho: `ev${i}.fundo`, tipo: "cor", vazio: true }, ev.estilo?.fundo ?? "", v => mudar(i, "estilo", { ...ev.estilo, fundo: v })),
          campo({ rotulo: "Cor de texto aplicada", caminho: `ev${i}.cor`, tipo: "cor", vazio: true }, ev.estilo?.cor ?? "", v => mudar(i, "estilo", { ...ev.estilo, cor: v })),
          campo({ rotulo: "Cor de contorno aplicada", caminho: `ev${i}.borda`, tipo: "cor", vazio: true }, ev.estilo?.borda ?? "", v => mudar(i, "estilo", { ...ev.estilo, borda: v })),
          campo({ rotulo: "Espessura aplicada", caminho: `ev${i}.larguraBorda`, tipo: "numero", min: 0 }, ev.estilo?.larguraBorda, v => mudar(i, "estilo", { ...ev.estilo, larguraBorda: v })),
          campo({ rotulo: "Raio aplicado", caminho: `ev${i}.raio`, tipo: "numero", min: 0 }, ev.estilo?.raio, v => mudar(i, "estilo", { ...ev.estilo, raio: v }))
        ] : null,
        ev.acao ? campo({ rotulo: "Em qual elemento", caminho: `ev${i}.alvo`, tipo: "select", opcoes: [["", "Escolha..."], ...outros.map(o => [o.id, o.nome])] }, ev.alvo ?? "", v => mudar(i, "alvo", v)) : null)),
      h("button", { type: "button", class: "bt-texto", onclick: () => salvar([...eventos, { tipo: tipos[0], dispara: `${el.id}_${tipos[0].replace(/^on/, "").toLowerCase()}`, acao: "", alvo: "" }], `Adicionar evento em ${el.nome}`), html: `${icone("mais", 14)} Adicionar evento` }),
    ];
  }
}
export { LateralEsquerda, LateralDireita };
