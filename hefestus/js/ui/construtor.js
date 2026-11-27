// Formulários do modo híbrido: aba "Geral" (containers e menus/boxes do botão direito) e aba "Faixa de opções".
// Tudo é dado em `__construtor`; cada mudança regenera os elementos daquele item (um passo desfazível).
import { h, campo, botaoIcone } from "./dom.js";
import { icone, rotuloIcone } from "./icones.js";
import { VARIANTES_MODAL, MESES, ACOES_CLIQUE, MODOS_LAYOUT, TIPOS_FILHO, ICONES_COMANDO, validarConstrutor, novoFilho, novaAba, novoGrupo, novoItem, novoItemMenu, novoSeparador, ESTILOS_FAIXA, aplicarEstiloFaixa, novoBloco, novoItemLateral, novaAbaDoc, novoSubitem, VARIANTES_BLOCO, TIPOS_OBJETO, COMPORTAMENTOS_FAIXA, ABRIR_COM, ANIMACOES_FAIXA, ORGANIZACOES_GRUPO, TAMANHOS_COMANDO, SOMBRAS_GRUPO, EFEITOS, MODELOS_COMP, ESTILOS_BARRA, FORMATOS_PROGRESSO, novoItemComp, TEMAS, FORMATOS_ABA, VARIANTES_LATERAL, ANIM_HOVER, ANIM_CLIQUE, BORDAS_ABA } from "../nucleo/construtor.js";
const SOMBRAS = [["nenhuma", "Nenhuma"], ["pequena", "Pequena"], ["media", "Média"], ["grande", "Grande"]];
const ALINHAR = [["inicio", "Início"], ["centro", "Centro"], ["fim", "Fim"], ["esticar", "Esticar"]];
const iconeOpcoes = (atual, permitirAuto = true) => [...new Set([atual, ...ICONES_COMANDO].filter(i => i && (permitirAuto || i !== "auto")))].map(i => [i, i === "auto" ? "Automático — pelo nome do comando" : rotuloIcone(i)]);
const mover = (lista, i, d) => { const j = i + d; if (j < 0 || j >= lista.length) return; [lista[i], lista[j]] = [lista[j], lista[i]]; };

class Formulario {
  constructor(app) { this.app = app; this.paginas = {}; this.ativos = {}; this.linhasAbertas = new Set(); }
  get n() { return this.app.n; }

  /** Aplica uma edição ao item e regenera. */
  editar(idItem, texto, fn) { return this.n.atualizarConstrutor(spec => fn(spec.itens.find(i => i.id === idItem), spec), texto, idItem); }

  f(rotulo, valor, aoMudar, tipo = "texto", extra = {}) { return campo({ rotulo, caminho: rotulo, tipo, ...extra }, valor, aoMudar); }
  bt(rot, fn, o = {}) { return h("button", { type: "button", class: `bt-texto dock-bt ${o.perigo ? "perigo" : ""}`, title: o.titulo ?? rot, "aria-label": o.aria, disabled: o.desab, onclick: fn }, o.ic ? h("span", { html: icone(o.ic, 14) }) : null, rot); }
  grade(...cs) { return h("div", { class: "fm-grade" }, ...cs); }
  cartao(item, titulo, corpo, abertoPadrao) {
    const ui = this.app.ui;
    const aberto = ui.dockItem === item.id || (abertoPadrao && !ui.dockItem);
    const conteudo = h("div", { class: "fm-corpo" });
    const montar = () => conteudo.replaceChildren(...[typeof corpo === "function" ? corpo() : corpo].flat(Infinity).filter(Boolean));
    if (aberto) montar();
    const det = h("details", { class: "fm-cartao", open: aberto },
      h("summary", {}, h("span", { class: "fm-nome" }, item.nome), h("small", {}, ({ caixa: "grupo", menu: "menu contextual", ribbon: "faixa", blocos: "blocos", lateral: "barra lateral", abasDoc: "abas de documento", componente: "componente", paineis: "painéis divididos" })[item.tipo]),
        this.bt("Ver na tela", e => { e.preventDefault(); this.app.ui.dockItem = item.id; this.n.selecionar(item.id); this.app.salvarUI(); }, { ic: "buscar" }),
        this.bt("Remover", e => { e.preventDefault(); if (confirm(`Remover "${item.nome}" e tudo o que foi gerado a partir dele?`)) this.n.atualizarConstrutor(spec => { spec.itens = spec.itens.filter(i => i.id !== item.id); }, `Remover ${item.nome}`, item.id, { remover: true }); }, { ic: "excluir", perigo: true })), conteudo);
    det.addEventListener("toggle", () => {
      if (!det.isConnected || !det.open) return;
      this.app.ui.dockItem = item.id;
      if (!conteudo.childNodes.length) montar();
    });
    return det;
  }

  seletorEstrutura(lista, chave) {
    const ui = this.app.ui;
    const item = lista.find(i => i.id === ui.dockItem) ?? lista.find(i => i.id === this.ativos[chave]) ?? lista.at(-1);
    if (!item) return { item: null, campo: null };
    this.ativos[chave] = item.id; ui.dockItem = item.id;
    return { item, campo: this.f("Estrutura em edição", item.id, v => { ui.dockItem = v; this.ativos[chave] = v; this.app.salvarUI(); this.n.selecionar(v); this.app.render(); }, "select", { opcoes: lista.map(i => [i.id, i.nome]) }) };
  }

  corpoOrganizado(item, gerar) {
    const nos = [gerar()].flat(Infinity).filter(Boolean);
    const inicio = nos.findIndex(no => no.matches?.("details.fm-aba") || (no.classList?.contains("sub") && /^(Conteúdo|Itens|Blocos|Entradas|Abas)/.test(no.textContent)));
    if (inicio < 1) return nos;
    const pagina = this.paginas[item.id] ?? "conteudo";
    const conteudo = nos.slice(inicio).map((no,i) => {
      if (!no.classList?.contains("fm-linha")) return no;
      const chave = `${item.id}:${i}`;
      const nome = no.querySelector('input[type="text"]')?.value || `Item ${i}`;
      const detalhe = h("details", { class: "fm-item", open: this.linhasAbertas.has(chave) },
        h("summary", {}, h("strong", {}, nome), h("span", {}, "Editar")), no);
      detalhe.addEventListener("toggle", () => {
        if (!detalhe.isConnected) return;
        detalhe.open ? this.linhasAbertas.add(chave) : this.linhasAbertas.delete(chave);
      });
      return detalhe;
    });
    return [h("nav", { class: "fm-tarefas", "aria-label": "Edição da estrutura" }, [["conteudo", "Conteúdo"], ["configuracao", "Configuração"]].map(([id,rotulo]) =>
      h("button", { type: "button", class: "bt-texto", "aria-pressed": String(id === pagina), onclick: () => { this.paginas[item.id] = id; this.app.render(); } }, rotulo))),
      h("div", { class: "fm-tarefa" }, pagina === "conteudo" ? conteudo : nos.slice(0,inicio))];
  }

  erros(spec) {
    const e = validarConstrutor(spec);
    return e.length ? h("ul", { class: "fm-erros", role: "alert" }, e.map(m => h("li", {}, m))) : h("p", { class: "dock-dica" }, "Sem problemas: sinais únicos e alvos válidos.");
  }

  // ------------------------------------------------------------ aba Geral: containers + menus/boxes do botão direito
  geral() {
    const spec = this.n.construtor();
    const lista = spec.itens.filter(i => i.tipo !== "ribbon"), menus = lista.filter(i => i.tipo === "menu");
    const alvos = [["", "—"], ...lista.map(i => [i.id, i.nome])];
    const {item, campo: seletor} = this.seletorEstrutura(lista, "geral");
    const criar = () => { const [tipo, modelo] = (this.tipoNovo ?? "caixa").split(":"); const r = this.n.adicionarItemConstrutor(tipo, modelo); if (r.ok) { this.app.ui.dockItem = r.id; this.ativos.geral = r.id; this.app.render(); } };
    const corpo = () => item.tipo === "caixa" ? this.corpoCaixa(item,spec,alvos,menus) : this[({menu:"corpoMenu",blocos:"corpoBlocos",lateral:"corpoLateral",abasDoc:"corpoAbasDoc",componente:"corpoComponente",paineis:"corpoPaineis"})[item.tipo]](item);
    return h("div", { class: "fm fm-foco" },
      this.temasCompactos(spec),
      h("div", { class: "fm-navegacao" }, seletor,
        this.f("Nova estrutura", this.tipoNovo ?? "caixa", v => { this.tipoNovo = v; }, "select", { opcoes: [["caixa","Grupo"],["menu","Menu contextual"],["blocos","Blocos"],["lateral","Barra lateral"],["abasDoc","Abas de documento"],["paineis","Painéis divididos"],...MODELOS_COMP.map(([id,nome])=>[`componente:${id}`,nome])] }),
        this.bt("Criar", criar, { ic: "mais" })),
      item ? this.cartao(item,item.nome,()=>this.corpoOrganizado(item,corpo),true) : h("p", {class:"painel-vazio"}, "Escolha um tipo e clique em Criar para começar."), this.erros(spec));
  }

  /** Cabeçalho comum: nome, posição e aparência. */
  basico(x, ed, extra = []) {
    return this.grade(this.f("Nome", x.nome, v => ed("Nome", it => { it.nome = v || it.nome; }), "texto"),
      this.f("X", x.x, v => ed("Posição", it => { it.x = v; }), "numero"), this.f("Y", x.y, v => ed("Posição", it => { it.y = v; }), "numero"), ...extra);
  }
  /** Efeito visual + cor de destaque, comuns a quase todos os itens. */
  efeito(x, ed) {
    return [this.f("Efeito visual", x.efeito ?? "nenhum", v => ed("Efeito", it => { it.efeito = v; }), "select", { opcoes: EFEITOS }),
      this.f("Cor de destaque (efeito)", x.acento ?? "#22d3ee", v => ed("Cor de destaque", it => { it.acento = v; }), "cor"),
      ...(["ribbon", "menu", "lateral", "blocos"].includes(x.tipo) ? [this.f("Estilo dos ícones", x.estiloIcone ?? (["ribbon", "blocos"].includes(x.tipo) ? "colorido" : "traco"), v => ed("Estilo dos ícones", it => { it.estiloIcone = v; }), "select", { opcoes: [["colorido", "Colorido"], ["traco", "Traço"]] })] : []),
      this.f("Animação ao passar o mouse", x.animHover ?? "brilho", v => ed("Animação do mouse", it => { it.animHover = v; }), "select", { opcoes: ANIM_HOVER }),
      this.f("Animação ao clicar", x.animClique ?? "afundar", v => ed("Animação do clique", it => { it.animClique = v; }), "select", { opcoes: ANIM_CLIQUE })];
  }
  /** Linha de temas: um clique reaplica cores, formato e efeito em todos os itens. */
  temasCompactos(spec) {
    const detalhe = h("details", { class: "fm-temas-opcoes", open: !!this.temasAberto },
      h("summary", {}, `Tema visual de todas as estruturas${spec.tema ? ` · ${TEMAS[spec.tema]?.nome ?? spec.tema}` : ""}`), this.temas(spec));
    detalhe.addEventListener("toggle", () => { if (detalhe.isConnected) this.temasAberto = detalhe.open; });
    return detalhe;
  }

  temas(spec) {
    return h("details", { class: "fm-temas fm-catalogo" },
      h("summary", {}, "Aparência: escolher um tema"),
      h("div", { class: "sub" }, `Temas completos${spec.tema ? ` — atual: ${TEMAS[spec.tema]?.nome ?? ""}` : ""} (aplicam em todos os itens)`),
      h("div", { class: "fm-temas-grade" }, Object.entries(TEMAS).map(([k, t]) => h("button", {
        type: "button", class: `fm-tema ${spec.tema === k ? "ativo" : ""}`, title: `Aplicar o tema ${t.nome}`, "aria-pressed": String(spec.tema === k), disabled: !spec.itens.length,
        onclick: () => this.n.construtorTema(k),
      }, h("span", { class: "fm-tema-amostra", style: `background:${t.fundo};border-color:${t.borda}` }, h("i", { style: `background:${t.painel}` }), h("i", { style: `background:${t.acento}` }), h("i", { style: `background:${t.texto}` })), h("span", {}, t.nome)))));
  }
  corPar(rot, caminho, x, ed) { return this.f(rot, x[caminho], v => ed(rot, it => { it[caminho] = v; }), "cor"); }

  corpoBlocos(b) {
    const ed = (txt, fn) => this.editar(b.id, `${txt} em ${b.nome}`, fn);
    const n = (rot, k, min = 0) => this.f(rot, b[k], v => ed(rot, it => { it[k] = v; }), "numero", { min });
    return [
      this.basico(b, ed, [this.f("Estilo dos blocos", b.variante ?? "icone", v => ed("Estilo", it => { it.variante = v; }), "select", { opcoes: VARIANTES_BLOCO }),
        n("Colunas", "colunas", 1), n("Largura do bloco", "larguraBloco", 60), n("Altura do bloco", "alturaBloco", 40), n("Espaço entre blocos", "espaco"),
        this.corPar("Fundo", "fundo", b, ed), this.corPar("Borda", "borda", b, ed), this.corPar("Título", "cor", b, ed), this.corPar("Subtítulo", "corSub", b, ed), this.corPar("Ícone", "corIcone", b, ed), this.corPar("Ao passar o mouse", "hoverFundo", b, ed),
        n("Raio", "raio"), this.f("Sombra", b.sombra ?? "nenhuma", v => ed("Sombra", it => { it.sombra = v; }), "select", { opcoes: SOMBRAS_GRUPO }), ...this.efeito(b, ed)]),
      h("div", { class: "sub" }, `Blocos (${b.itens.length})`),
      ...b.itens.map((it, i) => {
        const e2 = (txt, fn) => this.editar(b.id, `${txt} em ${b.nome}`, x => fn(x.itens[i]));
        return h("div", { class: "fm-linha" },
          this.f("Título", it.titulo, v => e2("Título", x => { x.titulo = v; }), "texto"),
          this.f("Descrição", it.subtitulo, v => e2("Descrição", x => { x.subtitulo = v; }), "texto"),
          this.f("Ícone", it.icone, v => e2("Ícone", x => { x.icone = v; }), "select", { opcoes: iconeOpcoes(it.icone) }),
          this.f("Sinal", it.sinal, v => e2("Sinal", x => { x.sinal = v.trim(); }), "texto"),
          this.f("Cor do status (vazio = sem)", it.status || "", v => e2("Status", x => { x.status = v; }), "texto"),
          h("div", { class: "fm-acoes" },
            this.bt("←", () => this.editar(b.id, `Mover bloco em ${b.nome}`, x => mover(x.itens, i, -1)), { desab: i === 0 }), this.bt("→", () => this.editar(b.id, `Mover bloco em ${b.nome}`, x => mover(x.itens, i, 1)), { desab: i === b.itens.length - 1 }),
            this.bt("×", () => this.editar(b.id, `Remover bloco de ${b.nome}`, x => { x.itens.splice(i, 1); }), { perigo: true, titulo: "Remover bloco" })));
      }),
      this.bt("Adicionar bloco", () => ed("Novo bloco", it => { it.itens.push(novoBloco(it)); }), { ic: "mais" }),
    ];
  }

  corpoLateral(l) {
    const ed = (txt, fn) => this.editar(l.id, `${txt} em ${l.nome}`, fn);
    const n = (rot, k, min = 0) => this.f(rot, l[k], v => ed(rot, it => { it[k] = v; }), "numero", { min });
    return [
      this.basico(l, ed, [this.f("Marca / título", l.marca ?? "", v => ed("Marca", it => { it.marca = v; }), "texto"), n("Largura", "largura", 120), n("Largura só ícones", "larguraRecolhida", 40), n("Altura", "altura", 120),
        this.f("Item ativo", String(l.ativo ?? 0), v => ed("Item ativo", it => { it.ativo = Number(v); }), "select", { opcoes: l.itens.map((i, k) => [String(k), i.rotulo]) }),
        this.f("Começa só com ícones (retraída)", !!l.recolhida, v => ed("Retraída", it => { it.recolhida = !!v; }), "check"),
        this.corPar("Fundo", "fundo", l, ed), this.corPar("Texto", "cor", l, ed), this.corPar("Fundo do ativo", "fundoAtivo", l, ed), this.corPar("Texto do ativo", "corAtiva", l, ed), this.corPar("Ao passar o mouse", "hoverFundo", l, ed), n("Raio", "raio"),
        this.f("Variante visual", l.variante ?? "solida", v => ed("Variante", it => { it.variante = v; }), "select", { opcoes: VARIANTES_LATERAL }), ...this.efeito(l, ed)]),
      h("div", { class: "sub" }, `Itens (${l.itens.length}) — o botão ☰ do topo alterna entre larga e só ícones`),
      ...l.itens.map((it, i) => {
        const e2 = (txt, fn) => this.editar(l.id, `${txt} em ${l.nome}`, x => fn(x.itens[i]));
        return h("div", { class: "fm-linha" },
          this.f("Rótulo", it.rotulo, v => e2("Rótulo", x => { x.rotulo = v; }), "texto"),
          this.f("Ícone", it.icone, v => e2("Ícone", x => { x.icone = v; }), "select", { opcoes: iconeOpcoes(it.icone) }),
          this.f("Sinal", it.sinal, v => e2("Sinal", x => { x.sinal = v.trim(); }), "texto"),
          h("div", { class: "fm-acoes" },
            this.bt("↑", () => this.editar(l.id, `Mover item em ${l.nome}`, x => mover(x.itens, i, -1)), { desab: i === 0 }), this.bt("↓", () => this.editar(l.id, `Mover item em ${l.nome}`, x => mover(x.itens, i, 1)), { desab: i === l.itens.length - 1 }),
            this.bt("×", () => this.editar(l.id, `Remover item de ${l.nome}`, x => { x.itens.splice(i, 1); x.ativo = Math.min(x.ativo ?? 0, Math.max(0, x.itens.length - 1)); }), { perigo: true, titulo: "Remover item" })));
      }),
      this.bt("Adicionar item", () => ed("Novo item", it => { it.itens.push(novoItemLateral(it)); }), { ic: "mais" }),
    ];
  }

  corpoAbasDoc(d) {
    const ed = (txt, fn) => this.editar(d.id, `${txt} em ${d.nome}`, fn);
    return [
      this.basico(d, ed, [this.f("Altura", d.altura, v => ed("Altura", it => { it.altura = v; }), "numero", { min: 24 }),
        this.f("Aba ativa", String(d.ativa ?? 0), v => ed("Aba ativa", it => { it.ativa = Number(v); }), "select", { opcoes: d.abas.map((a, k) => [String(k), a.nome]) }),
        this.f("Botão × em cada aba", !!d.fechavel, v => ed("Fechável", it => { it.fechavel = !!v; }), "check"), this.f("Botão + (nova aba)", !!d.botaoMais, v => ed("Botão mais", it => { it.botaoMais = !!v; }), "check"),
        this.corPar("Fundo da barra", "fundo", d, ed), this.corPar("Aba", "corAba", d, ed), this.corPar("Texto", "cor", d, ed), this.corPar("Aba ativa", "corAtiva", d, ed), this.corPar("Texto da ativa", "corTextoAtivo", d, ed),
        this.f("Formato das abas", d.formato ?? "arredondada", v => ed("Formato", it => { it.formato = v; }), "select", { opcoes: FORMATOS_ABA }),
        ...(d.formato === "mista" ? [this.f("Borda esquerda", d.abaEsq ?? "barra", v => ed("Borda esquerda", it => { it.abaEsq = v; }), "select", { opcoes: BORDAS_ABA }), this.f("Borda direita", d.abaDir ?? "ponta", v => ed("Borda direita", it => { it.abaDir = v; }), "select", { opcoes: BORDAS_ABA })] : []), ...this.efeito(d, ed)]),
      h("div", { class: "sub" }, `Abas (${d.abas.length})`),
      ...d.abas.map((a, i) => h("div", { class: "fm-linha" },
        this.f("Nome", a.nome, v => this.editar(d.id, `Nome de aba em ${d.nome}`, x => { x.abas[i].nome = v; }), "texto"),
        this.f("Sinal (vazio = automático)", a.sinal || "", v => this.editar(d.id, `Sinal de aba em ${d.nome}`, x => { x.abas[i].sinal = v.trim(); }), "texto"),
        h("div", { class: "fm-acoes" },
          this.bt("←", () => this.editar(d.id, `Mover aba em ${d.nome}`, x => mover(x.abas, i, -1)), { desab: i === 0 }), this.bt("→", () => this.editar(d.id, `Mover aba em ${d.nome}`, x => mover(x.abas, i, 1)), { desab: i === d.abas.length - 1 }),
          this.bt("×", () => this.editar(d.id, `Remover aba de ${d.nome}`, x => { x.abas.splice(i, 1); x.ativa = Math.min(x.ativa ?? 0, Math.max(0, x.abas.length - 1)); }), { perigo: true, desab: d.abas.length < 2 })))),
      this.bt("Adicionar aba", () => ed("Nova aba", it => { it.abas.push(novaAbaDoc(it)); }), { ic: "mais" }),
    ];
  }

  corpoPaineis(c) {
    const ed = (txt, fn) => this.editar(c.id, `${txt} em ${c.nome}`, fn);
    const tem = k => (c.regioes ?? []).includes(k);
    const alt = (k, v) => ed("Regiões", it => { const s = new Set(it.regioes ?? []); v ? s.add(k) : s.delete(k); it.regioes = ["esq", "dir", "baixo"].filter(x => s.has(x)); });
    return h("div", {}, this.basico(c, ed, [this.f("Largura", c.largura, v => ed("Largura", it => { it.largura = v; }), "numero", { min: 240 }), this.f("Altura", c.altura, v => ed("Altura", it => { it.altura = v; }), "numero", { min: 160 })]),
      this.grade(
        this.f("Painel esquerdo", tem("esq"), v => alt("esq", !!v), "check"), this.f("Painel direito", tem("dir"), v => alt("dir", !!v), "check"), this.f("Painel inferior", tem("baixo"), v => alt("baixo", !!v), "check"),
        this.f("Largura esquerdo", c.tamEsq, v => ed("Tamanho", it => { it.tamEsq = v; }), "numero", { min: 80 }), this.f("Largura direito", c.tamDir, v => ed("Tamanho", it => { it.tamDir = v; }), "numero", { min: 80 }), this.f("Altura inferior", c.tamBaixo, v => ed("Tamanho", it => { it.tamBaixo = v; }), "numero", { min: 80 }),
        ...[["esq", "Título esquerdo"], ["dir", "Título direito"], ["baixo", "Título inferior"], ["centro", "Título central"]].map(([k, r]) => this.f(r, c.titulos?.[k] ?? "", v => ed("Título", it => { it.titulos = { ...it.titulos, [k]: v }; }), "texto")),
        this.f("Fundo", c.fundo, v => ed("Fundo", it => { it.fundo = v; }), "cor"), this.f("Borda", c.borda, v => ed("Borda", it => { it.borda = v; }), "cor"), this.f("Cor do texto", c.cor, v => ed("Cor", it => { it.cor = v; }), "cor"), this.f("Cor do divisor ao passar o mouse", c.acento, v => ed("Destaque", it => { it.acento = v; }), "cor")),
      h("p", { class: "dock-dica" }, "No resultado: arraste o divisor (ou use as setas, Home restaura, duplo clique restaura) e use o botão ‹ › ⌄ para recolher em trilho. Coloque seus elementos sobre “Conteúdo …”. Sinais: <id>_<região>_recolhido / _expandido / _redimensionado."));
  }

  corpoComponente(c) {
    const ed = (txt, fn) => this.editar(c.id, `${txt} em ${c.nome}`, fn);
    const m = c.modelo;
    const extra = [
      ...(m === "paginacao" ? [this.f("Página atual", c.valor, v => ed("Página", it => { it.valor = v; }), "numero", { min: 1 }), this.f("Total de páginas", c.total, v => ed("Total", it => { it.total = v; }), "numero", { min: 1 })] : []),
      ...(m === "stepper" ? [this.f("Etapa atual (1…)", c.valor, v => ed("Etapa", it => { it.valor = v; }), "numero", { min: 1 })] : []),
      ...(m === "progresso" ? [this.f("Formato", c.formato ?? "barra", v => ed("Formato", it => { it.formato = v; }), "select", { opcoes: FORMATOS_PROGRESSO }), this.f("Largura", c.largura, v => ed("Largura", it => { it.largura = v; }), "numero", { min: 160 })] : []),
      ...(m === "toast" ? [this.f("Largura", c.largura, v => ed("Largura", it => { it.largura = v; }), "numero", { min: 200 })] : []),
      ...(m === "modal" ? [this.f("Tipo de janela", c.variante ?? "confirmacao", v => ed("Tipo de janela", it => { it.variante = v; }), "select", { opcoes: VARIANTES_MODAL }), this.f("Título", c.titulo ?? "", v => ed("Título", it => { it.titulo = v; }), "texto"),
        this.f("Mensagem", c.mensagem ?? "", v => ed("Mensagem", it => { it.mensagem = v; }), "texto"), this.f("Largura", c.largura, v => ed("Largura", it => { it.largura = v; }), "numero", { min: 240 }),
        this.f("Começa oculto (aparece pela ação “abrir”)", !!c.iniciaOculto, v => ed("Visibilidade", it => { it.iniciaOculto = !!v; }), "check")] : []),
      ...(m === "calendario" ? [this.f("Mês", String(c.mes ?? 10), v => ed("Mês", it => { it.mes = Number(v); }), "select", { opcoes: MESES.map((x, k) => [String(k + 1), x]) }), this.f("Ano", c.ano, v => ed("Ano", it => { it.ano = v; }), "numero", { min: 1900 }), this.f("Dia selecionado (0 = nenhum)", c.valor, v => ed("Dia", it => { it.valor = v; }), "numero", { min: 0 })] : []),
      ...(m === "slider" ? [this.f("Largura", c.largura, v => ed("Largura", it => { it.largura = v; }), "numero", { min: 200 })] : []),
      ...(m === "tabela" ? [this.f("Largura", c.largura, v => ed("Largura", it => { it.largura = v; }), "numero", { min: 280 }), this.f("Colunas (2 a 6, separadas por vírgula)", (c.colunas ?? []).join(", "), v => ed("Colunas", it => { const l = String(v).split(",").map(x => x.trim()).filter(Boolean).slice(0, 6); if (l.length) it.colunas = l; }), "texto")] : []),
      ...(m === "grafico" ? [this.f("Tipo de gráfico", c.tipoGrafico ?? "barras", v => ed("Tipo de gráfico", it => { it.tipoGrafico = v; }), "select", { opcoes: [["barras", "Barras"], ["linha", "Linha (área)"], ["rosca", "Rosca (percentual)"]] }), this.f("Percentual da rosca (0–100)", c.valor, v => ed("Percentual", it => { it.valor = v; }), "numero", { min: 0 }), this.f("Título", c.titulo ?? "", v => ed("Título", it => { it.titulo = v; }), "texto"), this.f("Valor em destaque", c.mensagem ?? "", v => ed("Valor", it => { it.mensagem = v; }), "texto"), this.f("Variação", c.legenda ?? "", v => ed("Variação", it => { it.legenda = v; }), "texto"),
        this.f("Série (números separados por vírgula)", c.serie ?? "", v => ed("Série", it => { it.serie = v; }), "texto"), this.f("Largura", c.largura, v => ed("Largura", it => { it.largura = v; }), "numero", { min: 160 })] : []),
      ...(m === "radial" ? [this.f("Forma dos botões", c.formaMenu ?? "circulo", v => ed("Forma", it => { it.formaMenu = v; }), "select", { opcoes: [["circulo", "Círculo"], ["hexagono", "Hexágono"]] }), this.f("Raio do círculo", c.raioMenu ?? 90, v => ed("Raio", it => { it.raioMenu = v; }), "numero", { min: 50 })] : []),
      ...(m === "toolbar" ? [this.f("Estilo da barra", c.estiloBarra ?? "moderna", v => ed("Estilo da barra", it => { it.estiloBarra = v; }), "select", { opcoes: ESTILOS_BARRA }),
        this.f("Vertical", !!c.vertical, v => ed("Orientação", it => { it.vertical = !!v; }), "check"), this.f("Ferramenta ativa (0…)", c.ativo ?? 0, v => ed("Ativa", it => { it.ativo = v; }), "numero", { min: -1 })] : []),
    ];
    const campos = { modal: ["rotulo", "cor", "sinal"], calendario: [], slider: ["rotulo", "valor", "cor"], tabela: ["rotulo", "valor", "detalhe", "extra", "cor"], grafico: [], radial: ["rotulo", "icone", "sinal"], chips: ["rotulo", "icone", "cor", "sinal"], badges: ["rotulo", "valor", "cor", "sinal"], progresso: ["rotulo", "valor", "cor"], stepper: ["rotulo", "sinal"],
      toast: ["rotulo", "detalhe", "icone", "cor", "sinal"], status: ["rotulo", "valor", "icone", "cor", "sinal"], toolbar: ["rotulo", "icone", "cor", "sinal"], breadcrumb: ["rotulo", "icone", "sinal"], paginacao: [] }[m] ?? ["rotulo"];
    const R = { rotulo: "Rótulo", valor: ["progresso", "slider"].includes(m) ? "Valor (0–100)" : m === "tabela" ? "Status" : "Valor", detalhe: m === "tabela" ? "3ª coluna" : "Detalhe", extra: "Colunas 4 a 6 (vírgula)", icone: "Ícone", cor: "Cor", sinal: "Sinal" };
    return [
      this.basico(c, ed, [...extra, this.corPar("Fundo", "fundo", c, ed), this.corPar("Borda", "borda", c, ed), this.corPar("Texto", "cor", c, ed), this.corPar("Texto secundário", "corSub", c, ed),
        this.f("Raio", c.raio, v => ed("Raio", it => { it.raio = v; }), "numero"), ...this.efeito(c, ed)]),
      ...(campos.length ? [h("div", { class: "sub" }, `Itens (${c.itens.length})`),
        ...c.itens.map((it, i) => {
          const e2 = (txt, fn) => this.editar(c.id, `${txt} em ${c.nome}`, x => fn(x.itens[i]));
          return h("div", { class: "fm-linha" }, ...campos.map(k => k === "icone"
            ? this.f(R[k], it.icone ?? "", v => e2(R[k], x => { x.icone = v; }), "select", { opcoes: [["", "Sem ícone"], ...iconeOpcoes(it.icone)] })
            : k === "cor" ? this.f(R[k], it.cor ?? "#3b82f6", v => e2(R[k], x => { x.cor = v; }), "cor")
            : k === "extra" ? this.f(R[k], (it.extra ?? []).join(", "), v => e2(R[k], x => { x.extra = String(v).split(",").map(t => t.trim()); }), "texto")
            : this.f(R[k], it[k] ?? "", v => e2(R[k], x => { x[k] = k === "valor" && ["progresso", "slider"].includes(m) ? Number(v) : k === "sinal" ? String(v).trim() : v; }), k === "valor" && ["progresso", "slider"].includes(m) ? "numero" : "texto")),
          h("div", { class: "fm-acoes" },
            this.bt("↑", () => this.editar(c.id, `Mover item em ${c.nome}`, x => mover(x.itens, i, -1)), { desab: i === 0 }), this.bt("↓", () => this.editar(c.id, `Mover item em ${c.nome}`, x => mover(x.itens, i, 1)), { desab: i === c.itens.length - 1 }),
            this.bt("×", () => this.editar(c.id, `Remover item de ${c.nome}`, x => { x.itens.splice(i, 1); }), { perigo: true, titulo: "Remover item" })));
        }),
        this.bt("Adicionar item", () => ed("Novo item", it => { it.itens.push(novoItemComp(it)); }), { ic: "mais" })] : []),
    ];
  }

  corpoCaixa(c, spec, alvos, menus) {
    const ed = (txt, fn) => this.editar(c.id, `${txt} em ${c.nome}`, fn);
    const e = c.estilo ?? {}, l = c.layout ?? {}, cp = c.comportamento ?? {};
    return [
      this.grade(this.f("Nome", c.nome, v => ed("Nome", it => { it.nome = v || it.nome; }), "texto"),
        this.f("X", c.x, v => ed("Posição", it => { it.x = v; }), "numero"), this.f("Y", c.y, v => ed("Posição", it => { it.y = v; }), "numero"),
        this.f("Largura", c.largura, v => ed("Largura", it => { it.largura = v; }), "numero"), this.f("Altura", c.altura, v => ed("Altura", it => { it.altura = v; }), "numero")),
      h("div", { class: "sub" }, "Organização"),
      this.grade(this.f("Modo", l.modo, v => ed("Layout", it => { it.layout.modo = v; }), "select", { opcoes: MODOS_LAYOUT }),
        this.f("Espaço", l.espaco, v => ed("Espaço", it => { it.layout.espaco = v; }), "numero"), this.f("Margem", l.margem, v => ed("Margem", it => { it.layout.margem = v; }), "numero"),
        this.f("Alinhar", l.alinhar, v => ed("Alinhamento", it => { it.layout.alinhar = v; }), "select", { opcoes: ALINHAR }),
        this.f("Abraçar o conteúdo", !!l.abracar, v => ed("Abraçar", it => { it.layout.abracar = v; }), "check")),
      h("details", { class: "fm-catalogo" }, h("summary", {}, "Aparência e efeitos"),
      this.grade(this.f("Fundo", e.fundo, v => ed("Fundo", it => { it.estilo.fundo = v; }), "cor"), this.f("Borda", e.borda, v => ed("Borda", it => { it.estilo.borda = v; }), "cor"),
        this.f("Largura da borda", e.larguraBorda, v => ed("Borda", it => { it.estilo.larguraBorda = v; }), "numero"), this.f("Raio", e.raio, v => ed("Raio", it => { it.estilo.raio = v; }), "numero"),
        this.f("Sombra", e.sombra, v => ed("Sombra", it => { it.estilo.sombra = v; }), "select", { opcoes: SOMBRAS_GRUPO }), ...this.efeito(c, ed))),
      h("details", { class: "fm-catalogo" }, h("summary", {}, "Ações e comportamento"),
      this.grade(this.f("Sinal ao clicar", cp.sinal, v => ed("Sinal", it => { it.comportamento.sinal = v.trim(); }), "texto"),
        this.f("Ação ao clicar", cp.acao, v => ed("Ação", it => { it.comportamento.acao = v; }), "select", { opcoes: ACOES_CLIQUE }),
        this.f("Alvo da ação", cp.alvo, v => ed("Alvo", it => { it.comportamento.alvo = v; }), "select", { opcoes: alvos.filter(([id]) => id !== c.id) }),
        this.f("Cor ao passar o mouse", cp.hoverFundo, v => ed("Hover", it => { it.comportamento.hoverFundo = v; }), "cor", { vazio: true }),
        this.f("Menu do botão direito", cp.menuContexto, v => ed("Menu de contexto", it => { it.comportamento.menuContexto = v; }), "select", { opcoes: [["", "Nenhum"], ...menus.map(m => [m.id, m.nome])] }),
        this.f("Começa oculto", !!cp.iniciaOculto, v => ed("Visibilidade", it => { it.comportamento.iniciaOculto = v; }), "check"))),
      h("div", { class: "sub" }, `Conteúdo (${(c.filhos ?? []).length})`),
      ...(c.filhos ?? []).map((f, i) => this.linhaFilho(c, f, i)),
      this.bt("Adicionar conteúdo", () => ed("Novo conteúdo", it => { (it.filhos ??= []).push(novoFilho(it)); }), { ic: "mais" }),
    ];
  }

  linhaFilho(c, f, i) {
    const ed = (txt, fn) => this.editar(c.id, `${txt} em ${c.nome}`, it => fn(it.filhos[i]));
    return h("div", { class: "fm-linha" },
      this.f("Tipo", f.tipo, v => ed("Tipo", x => { x.tipo = v; if (v === "botao" && !x.rotulo) x.rotulo = x.texto ?? "Botão"; if (v === "texto" && !x.texto) x.texto = x.rotulo ?? "Texto"; if (v === "icone" && !x.simbolo) x.simbolo = "estrela"; }), "select", { opcoes: TIPOS_FILHO }),
      f.tipo === "icone"
        ? this.f("Ícone", f.simbolo, v => ed("Ícone", x => { x.simbolo = v; }), "select", { opcoes: iconeOpcoes(f.simbolo, false) })
        : this.f(f.tipo === "botao" ? "Rótulo" : "Texto", f.tipo === "botao" ? f.rotulo : f.texto, v => ed("Texto", x => { if (x.tipo === "botao") x.rotulo = v; else x.texto = v; }), "texto"),
      this.f("Sinal", f.sinal, v => ed("Sinal", x => { x.sinal = v.trim(); }), "texto"),
      this.f("L", f.largura, v => ed("Largura", x => { x.largura = v; }), "numero"), this.f("A", f.altura, v => ed("Altura", x => { x.altura = v; }), "numero"),
      f.tipo === "botao" ? this.f("Fundo", f.fundo, v => ed("Fundo", x => { x.fundo = v; }), "cor") : null,
      this.f("Cor", f.cor, v => ed("Cor", x => { x.cor = v; }), "cor"),
      h("div", { class: "fm-acoes" },
        this.bt("↑", () => this.editar(c.id, `Mover conteúdo em ${c.nome}`, it => mover(it.filhos, i, -1)), { titulo: "Subir", desab: i === 0 }),
        this.bt("↓", () => this.editar(c.id, `Mover conteúdo em ${c.nome}`, it => mover(it.filhos, i, 1)), { titulo: "Descer", desab: i === c.filhos.length - 1 }),
        this.bt("×", () => this.editar(c.id, `Remover conteúdo de ${c.nome}`, it => { it.filhos.splice(i, 1); }), { perigo: true, titulo: "Remover" })));
  }

  corpoMenu(m) {
    const ed = (txt, fn) => this.editar(m.id, `${txt} em ${m.nome}`, fn);
    return [
      this.grade(this.f("Nome", m.nome, v => ed("Nome", it => { it.nome = v || it.nome; }), "texto"),
        this.f("Largura", m.largura, v => ed("Largura", it => { it.largura = v; }), "numero"),
        this.f("Abrir apenas por um botão ou clique direito", !!m.iniciaOculto, v => ed("Visibilidade", it => { it.iniciaOculto = v; }), "check")),
      h("details", { class: "fm-catalogo" }, h("summary", {}, "Posição, cores e efeitos"), this.grade(
        this.f("X", m.x, v => ed("Posição", it => { it.x = v; }), "numero"), this.f("Y", m.y, v => ed("Posição", it => { it.y = v; }), "numero"),
        this.f("Fundo", m.fundo, v => ed("Fundo", it => { it.fundo = v; }), "cor"), this.f("Borda / separador", m.borda, v => ed("Borda", it => { it.borda = v; }), "cor"),
        this.f("Cor do texto", m.cor, v => ed("Cor", it => { it.cor = v; }), "cor"), this.f("Cor do atalho", m.corAtalho, v => ed("Cor do atalho", it => { it.corAtalho = v; }), "cor"),
        this.f("Cor ao passar o mouse", m.hoverFundo, v => ed("Hover", it => { it.hoverFundo = v; }), "cor"),
        this.f("Raio", m.raio, v => ed("Raio", it => { it.raio = v; }), "numero"), this.f("Sombra", m.sombra, v => ed("Sombra", it => { it.sombra = v; }), "select", { opcoes: SOMBRAS_GRUPO }),
        ...this.efeito(m, ed))),
      h("p", { class: "dock-contexto" }, "Edite os rótulos abaixo. Use Sinal para identificar o comando no seu software e + subitem para criar níveis de menu."),
      h("div", { class: "sub" }, `Itens (${m.itens.length})`),
      ...m.itens.map((it, i) => {
        const e2 = (txt, fn) => this.editar(m.id, `${txt} em ${m.nome}`, x => fn(x.itens[i]));
        return h("div", { class: "fm-linha" },
          it.separador ? h("span", { class: "fm-sep" }, "── separador ──") : [
            this.f("Rótulo", it.rotulo, v => e2("Rótulo", x => { x.rotulo = v; }), "texto"),
            this.f("Ícone", it.icone, v => e2("Ícone", x => { x.icone = v; }), "select", { opcoes: [["", "Sem ícone"], ...iconeOpcoes(it.icone)] }),
            this.f("Atalho", it.atalho, v => e2("Atalho", x => { x.atalho = v; }), "texto"),
            this.f("Sinal", it.sinal, v => e2("Sinal", x => { x.sinal = v.trim(); }), "texto"),
            this.f("Perigo", !!it.perigo, v => e2("Perigo", x => { x.perigo = v; }), "check"),
            this.f("Desabilitado (cinza)", !!it.desabilitado, v => e2("Desabilitado", x => { x.desabilitado = v; }), "check"),
            ...(it.submenu ?? []).flatMap((sb, k) => [h("div", { class: "fm-linha fm-sub" }, h("small", {}, "↳ subitem"),
              this.f("Rótulo", sb.rotulo, v => e2("Subitem", x => { x.submenu[k].rotulo = v; }), "texto"), this.f("Atalho", sb.atalho, v => e2("Subitem", x => { x.submenu[k].atalho = v; }), "texto"),
              this.f("Sinal", sb.sinal, v => e2("Subitem", x => { x.submenu[k].sinal = v.trim(); }), "texto"),
              this.bt("×", () => e2("Remover subitem", x => { x.submenu.splice(k, 1); }), { perigo: true, titulo: "Remover subitem" }))]),
            this.bt("+ subitem (abre ao passar o mouse)", () => e2("Novo subitem", x => { x.submenu ??= []; x.submenu.push(novoSubitem(x)); }), { titulo: "Cria um submenu à direita deste item" })],
          h("div", { class: "fm-acoes" },
            this.bt("↑", () => this.editar(m.id, `Mover item em ${m.nome}`, x => mover(x.itens, i, -1)), { desab: i === 0, titulo: "Subir" }),
            this.bt("↓", () => this.editar(m.id, `Mover item em ${m.nome}`, x => mover(x.itens, i, 1)), { desab: i === m.itens.length - 1, titulo: "Descer" }),
            this.bt("×", () => this.editar(m.id, `Remover item de ${m.nome}`, x => { x.itens.splice(i, 1); }), { perigo: true, titulo: "Remover" })));
      }),
      h("div", { class: "botoes-linha" },
        this.bt("Adicionar item", () => ed("Novo item", it => { it.itens.push(novoItemMenu(it)); }), { ic: "mais" }),
        this.bt("Adicionar separador", () => ed("Novo separador", it => { it.itens.push(novoSeparador(it)); }), { ic: "mais" })),
    ];
  }

  // ------------------------------------------------------------ aba Faixa de opções
  faixa() {
    const spec = this.n.construtor();
    const faixas = spec.itens.filter(i => i.tipo === "ribbon");
    const {item, campo: seletor} = this.seletorEstrutura(faixas, "faixa");
    return h("div", { class: "fm fm-foco" },
      this.temasCompactos(spec),
      h("div", { class: "fm-navegacao" }, seletor, this.bt("Nova faixa de opções", () => {
        const r = this.n.adicionarItemConstrutor("ribbon"); if (r.ok) { this.app.ui.dockItem = r.id; this.ativos.faixa = r.id; this.app.render(); }
      }, { ic: "mais" })),
      item ? this.cartao(item,item.nome,()=>this.corpoOrganizado(item,()=>this.corpoFaixa(item)),true) : h("p", {class:"painel-vazio"}, "Crie uma faixa para editar suas abas, grupos e comandos."), this.erros(spec));
  }

  corpoFaixa(f) {
    const ed = (txt, fn) => this.editar(f.id, `${txt} em ${f.nome}`, fn);
    return [
      this.grade(this.f("Nome", f.nome, v => ed("Nome", it => { it.nome = v || it.nome; }), "texto"),
        this.f("X", f.x, v => ed("Posição", it => { it.x = v; }), "numero"), this.f("Y", f.y, v => ed("Posição", it => { it.y = v; }), "numero"),
        this.f("Largura (0 = tela inteira)", f.largura, v => ed("Largura", it => { it.largura = v; }), "numero", { min: 0 }), this.f("Cor da banda", f.banda, v => ed("Banda", it => { it.banda = v; }), "cor"),
        this.f("Aba aberta", String(f.abaAtiva ?? 0), v => ed("Aba aberta", it => { it.abaAtiva = Number(v); }), "select", { opcoes: f.abas.map((a, i) => [String(i), a.nome]) }),
        this.f("Simular objeto selecionado", f.simulaSelecao ?? "", v => ed("Seleção simulada", it => { it.simulaSelecao = v; }), "select", { opcoes: [["", "Nenhum objeto"], ...TIPOS_OBJETO] })),
      this.grade(this.f("Formato das abas", f.formatoAba ?? "arredondada", v => ed("Formato das abas", it => { it.formatoAba = v; }), "select", { opcoes: FORMATOS_ABA }),
        ...(f.formatoAba === "mista" ? [this.f("Borda esquerda", f.abaEsq ?? "barra", v => ed("Borda esquerda", it => { it.abaEsq = v; }), "select", { opcoes: BORDAS_ABA }), this.f("Borda direita", f.abaDir ?? "ponta", v => ed("Borda direita", it => { it.abaDir = v; }), "select", { opcoes: BORDAS_ABA })] : []), this.f("Estilo pronto da faixa", f.estilo ?? "", v => { if (v) ed("Estilo da faixa", it => aplicarEstiloFaixa(it, v)); }, "select", { opcoes: [["", "Personalizado"], ...Object.entries(ESTILOS_FAIXA).map(([k, e]) => [k, e.nome])] }),
        this.f("Fundo do corpo", f.corpoFundo ?? "#ffffff", v => ed("Fundo do corpo", it => { it.corpoFundo = v; it.estilo = ""; }), "cor"),
        this.f("Borda do corpo", f.corpoBorda ?? "#d2d6df", v => ed("Borda do corpo", it => { it.corpoBorda = v; it.estilo = ""; }), "cor"),
        this.f("Texto das abas", f.abaTexto ?? "#ffffff", v => ed("Texto das abas", it => { it.abaTexto = v; it.estilo = ""; }), "cor"),
        this.f("Aba ativa: fundo", f.abaAtivaFundo ?? "#ffffff", v => ed("Aba ativa", it => { it.abaAtivaFundo = v; it.estilo = ""; }), "cor"),
        this.f("Aba ativa: texto", f.abaAtivaTexto ?? f.banda ?? "#8a4f0d", v => ed("Aba ativa", it => { it.abaAtivaTexto = v; it.estilo = ""; }), "cor"),
        this.f("Texto dos comandos", f.corRotulo ?? "#1c2130", v => ed("Texto dos comandos", it => { it.corRotulo = v; it.estilo = ""; }), "cor")),
      this.grade(this.f("Comportamento da faixa", f.comportamento ?? "fixa", v => ed("Comportamento da faixa", it => { it.comportamento = v; }), "select", { opcoes: COMPORTAMENTOS_FAIXA }),
        ...(f.comportamento === "retrai" ? [
          this.f("Abre ao", f.abrirCom ?? "clique", v => ed("Abrir com", it => { it.abrirCom = v; }), "select", { opcoes: ABRIR_COM }),
          this.f("Animação", f.animacao ?? "deslizar", v => ed("Animação", it => { it.animacao = v; }), "select", { opcoes: ANIMACOES_FAIXA }),
          this.f("Retrai ao clicar fora", f.retraiFora !== false, v => ed("Retrair fora", it => { it.retraiFora = !!v; }), "check"),
          this.f("Retrai ao tirar o mouse", f.retraiMouse !== false, v => ed("Retrair mouse", it => { it.retraiMouse = !!v; }), "check"),
          this.f("Retrai com Esc", f.retraiEsc !== false, v => ed("Retrair Esc", it => { it.retraiEsc = !!v; }), "check"),
          this.f("Botão de pino (fixar aberta)", f.pino !== false, v => ed("Pino", it => { it.pino = !!v; }), "check")] : []),
        this.f("Campo de busca na faixa", !!f.busca, v => ed("Busca", it => { it.busca = !!v; }), "check")),
      ...f.abas.map((a, ia) => h("details", { class: "fm-aba", open: ia === (f.abaAtiva ?? 0) },
        h("summary", {}, h("b", {}, a.nome), h("small", {}, `${a.grupos.length} grupo(s)`)),
        this.grade(this.f("Nome da aba", a.nome, v => ed("Aba", it => { it.abas[ia].nome = v || it.abas[ia].nome; }), "texto"),
          this.f("Cor da aba", a.corAba || (a.quando?.length ? "#2563eb" : f.banda), v => ed("Cor da aba", it => { it.abas[ia].corAba = v; }), "cor"),
          a.grupos.some(g => g.recolher) ? this.f("Grupo expandido", String(a.grupoAtivo ?? 0), v => ed("Grupo expandido", it => { it.abas[ia].grupoAtivo = Number(v); }), "select", { opcoes: a.grupos.filter(g => g.recolher).map((g, i) => [String(i), g.nome]) }) : null,
          h("div", { class: "fm-quando" }, h("small", {}, "Aparece só quando selecionar (vazio = sempre):"),
            h("div", { class: "botoes-linha" }, TIPOS_OBJETO.map(([k, r]) => h("button", { type: "button", class: "bt-texto dock-bt", "aria-pressed": String(!!a.quando?.includes(k)), title: `Aba condicional: aparece com ${r} selecionado`,
              onclick: () => ed("Aba condicional", it => { const q = new Set(it.abas[ia].quando ?? []); q.has(k) ? q.delete(k) : q.add(k); it.abas[ia].quando = [...q]; }) }, r)))),
          h("div", { class: "fm-acoes" },
            this.bt("←", () => ed("Mover aba", it => mover(it.abas, ia, -1)), { desab: ia === 0, titulo: "Aba para a esquerda" }),
            this.bt("→", () => ed("Mover aba", it => mover(it.abas, ia, 1)), { desab: ia === f.abas.length - 1, titulo: "Aba para a direita" }),
            this.bt("Remover aba", () => ed("Remover aba", it => { it.abas.splice(ia, 1); it.abaAtiva = Math.min(it.abaAtiva ?? 0, Math.max(0, it.abas.length - 1)); }), { perigo: true, desab: f.abas.length < 2 }))),
        ...a.grupos.map((g, ig) => h("div", { class: "fm-grupo" },
          h("div", { class: "fm-linha" },
            this.f("Grupo", g.nome, v => ed("Grupo", it => { it.abas[ia].grupos[ig].nome = v || g.nome; }), "texto"),
            this.f("Organização", g.organizacao ?? "linha", v => ed("Organização", it => { it.abas[ia].grupos[ig].organizacao = v; }), "select", { opcoes: ORGANIZACOES_GRUPO }),
            this.f("Tamanho dos comandos", g.tamanho ?? "grande", v => ed("Tamanho", it => { it.abas[ia].grupos[ig].tamanho = v; }), "select", { opcoes: TAMANHOS_COMANDO }),
            this.f("Recolher em botão", !!g.recolher, v => ed("Recolher", it => { it.abas[ia].grupos[ig].recolher = !!v; }), "check"),
            g.recolher ? this.f("Ícone do botão", g.iconePrincipal || g.itens[0]?.icone || "estrela", v => ed("Ícone principal", it => { it.abas[ia].grupos[ig].iconePrincipal = v; }), "select", { opcoes: iconeOpcoes(g.iconePrincipal || g.itens[0]?.icone) }) : null,
            this.f("Cor do texto e ícones", g.cor ?? "#5a6274", v => ed("Cor", it => { it.abas[ia].grupos[ig].cor = v; }), "cor"),
            this.f("Fundo", g.fundo || "#ffffff", v => ed("Fundo", it => { it.abas[ia].grupos[ig].fundo = v; }), "cor"),
            this.f("Borda", g.borda || "#d2d6df", v => ed("Borda", it => { it.abas[ia].grupos[ig].borda = v; }), "cor"),
            this.f("Raio", g.raio ?? 0, v => ed("Raio", it => { it.abas[ia].grupos[ig].raio = v; }), "numero"),
            this.f("Sombra", g.sombra ?? "nenhuma", v => ed("Sombra", it => { it.abas[ia].grupos[ig].sombra = v; }), "select", { opcoes: SOMBRAS_GRUPO }),
            this.f("Cor ao passar o mouse", g.hoverFundo ?? "#eef1f6", v => ed("Hover", it => { it.abas[ia].grupos[ig].hoverFundo = v; }), "cor"),
            h("div", { class: "fm-acoes" },
              this.bt("←", () => ed("Mover grupo", it => mover(it.abas[ia].grupos, ig, -1)), { desab: ig === 0 }), this.bt("→", () => ed("Mover grupo", it => mover(it.abas[ia].grupos, ig, 1)), { desab: ig === a.grupos.length - 1 }),
              this.bt("Remover grupo", () => ed("Remover grupo", it => { it.abas[ia].grupos.splice(ig, 1); }), { perigo: true }))),
          ...g.itens.map((c, ic) => h("div", { class: "fm-linha" },
            this.f("Rótulo", c.rotulo, v => ed("Comando", it => { it.abas[ia].grupos[ig].itens[ic].rotulo = v; }), "texto"),
            this.f("Ícone", c.icone, v => ed("Ícone", it => { it.abas[ia].grupos[ig].itens[ic].icone = v; }), "select", { opcoes: iconeOpcoes(c.icone) }),
            this.f("Sinal", c.sinal, v => ed("Sinal", it => { it.abas[ia].grupos[ig].itens[ic].sinal = v.trim(); }), "texto"),
            this.f("Desabilitado", !!c.desabilitado, v => ed("Desabilitado", it => { it.abas[ia].grupos[ig].itens[ic].desabilitado = !!v; }), "check"),
            this.f("Atalho (ex.: Ctrl+S)", c.atalho ?? "", v => ed("Atalho", it => { it.abas[ia].grupos[ig].itens[ic].atalho = v.trim(); }), "texto"),
            this.f("Opções do ▾ (uma por linha: rótulo | sinal | atalho)", (c.submenu ?? []).map(s => [s.rotulo, s.sinal ?? "", s.atalho ?? ""].join(" | ").replace(/( \| )+$/, "")).join("\n"),
              v => ed("Opções do ▾", it => { it.abas[ia].grupos[ig].itens[ic].submenu = String(v).split("\n").map(l => l.split("|").map(x => x.trim())).filter(p => p[0]).map((p, k) => ({ id: `s${k + 1}`, rotulo: p[0], icone: "", sinal: p[1] || "", atalho: p[2] || "" })); }), "area"),
            h("div", { class: "fm-acoes" },
              this.bt("←", () => ed("Mover comando", it => mover(it.abas[ia].grupos[ig].itens, ic, -1)), { desab: ic === 0 }), this.bt("→", () => ed("Mover comando", it => mover(it.abas[ia].grupos[ig].itens, ic, 1)), { desab: ic === g.itens.length - 1 }),
              this.bt("×", () => ed("Remover comando", it => { it.abas[ia].grupos[ig].itens.splice(ic, 1); }), { perigo: true, titulo: "Remover comando" })))),
          this.bt("Adicionar comando", () => ed("Novo comando", it => { const gr = it.abas[ia].grupos[ig]; gr.itens.push(novoItem(gr)); }), { ic: "mais" }))),
        this.bt("Adicionar grupo", () => ed("Novo grupo", it => { const ab = it.abas[ia]; ab.grupos.push(novoGrupo(ab)); }), { ic: "mais" }))),
      this.bt("Adicionar aba", () => ed("Nova aba", it => { it.abas.push(novaAba(it)); }), { ic: "mais" }),
    ];
  }
}
export { Formulario };
