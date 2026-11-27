import { h, campo, ler } from "./dom.js";
import { CATALOGO, CAMPOS_ESTILO, CAMPOS_TEXTO, CAMPOS_TRANSFORMACAO, CAMPOS_COMPORTAMENTO, CAMPOS_ABERTURA, TIPOS_COM_TEXTO, CAMPOS_CANVAS } from "../nucleo/catalogo.js";
import { COMPORTAMENTOS } from "../nucleo/comportamentos.js";

export class ControladorFormulario {
  constructor(app) { this.app = app; this.abertos = new Set(); }
  bloco(nome, conteudo, aberto = true) {
    const detalhe = h("details", { class: "forja-secao controlador-bloco", open: aberto }, h("summary", {}, nome), h("div", { class: "forja-secao-corpo" }, conteudo));
    return detalhe;
  }
  detalhes(chave, titulo, conteudo) {
    const aberto = this.abertos.has(chave), corpo = h("div", { class: "forja-secao-corpo" });
    const montar = () => corpo.replaceChildren(...[typeof conteudo === "function" ? conteudo() : conteudo].flat(Infinity).filter(Boolean));
    if (aberto) montar();
    const no = h("details", { class: "forja-secao controlador-bloco", open: aberto }, h("summary", {}, titulo), corpo);
    no.addEventListener("toggle", () => {
      if (!no.isConnected) return;
      if (no.open) { this.abertos.add(chave); if (!corpo.childNodes.length) montar(); }
      else this.abertos.delete(chave);
    });
    return no;
  }

  campo(rotulo, caminho, tipo, opcoes, extra = {}) {
    const n = this.app.n, el = n.selecionado();
    return campo({ rotulo, caminho, tipo, opcoes, ...extra }, ler(el, caminho) ?? extra.padrao,
      v => n.definirNosSelecionados({ [caminho]: v }, `${rotulo} de ${n.descreverGrupo(n.selecionados())}`));
  }
  interruptor(rotulo, chave) {
    const n = this.app.n, el = n.selecionado(), ativo = el.controlador?.[chave] !== false;
    return campo({ rotulo, caminho: `controlador.${chave}`, tipo: "check" }, ativo,
      v => n.definirNosSelecionados({ [`controlador.${chave}`]: v }, `${v ? "Ligar" : "Desligar"} ${rotulo.toLowerCase()}`));
  }
  opcao(nome, chave, campoPrincipal, parametros) {
    const el = this.app.n.selecionado(), ligado = el.controlador?.[chave] !== false;
    return h("div", { class: "controlador-opcao" },
      h("div", { class: "controlador-linha" }, h("strong", {}, nome),
        h("div", { class: "controlador-principal" }, ligado ? campoPrincipal : h("span", { class: "controlador-desligado" }, "Desligado")),
        this.interruptor(`${nome} ativo`, chave)),
      ligado && parametros ? this.detalhes(`parametros-${chave}`, `Ajustar ${nome.toLowerCase()}`, parametros) : null);
  }

  aparencia() {
    const n = this.app.n, el = n.selecionado(), d = this.app.dir;
    const forma = el.tipo === "forma" ? d.campos(CATALOGO.forma.campos.filter(c => c.caminho === "forma"), el.id, el)
      : null;
    const est = caminhos => d.campos(CAMPOS_ESTILO.filter(c => caminhos.includes(c.caminho)), el.id, el);
    return this.bloco("Aparência", [forma,
      this.opcao("Contorno", "contorno", this.campo("Contorno", "controlador.tipoContorno", "select", [["solido", "Sólido"], ["tracejado", "Tracejado"], ["pontilhado", "Pontilhado"]], { padrao: el.estilo?.tracos?.[0]?.estilo ?? "solido" }), [this.campo("Cor do contorno", "estilo.borda", "cor"), ...est(["estilo.larguraBorda"])]),
      this.opcao("Borda", "borda", campo({ rotulo: "Borda", caminho: "tipoBorda", tipo: "select", opcoes: [["reta", "Reta"], ["arredondada", "Arredondada"]] }, el.controlador?.tipoBorda ?? (el.estilo?.raio ? "arredondada" : "reta"), v => n.definirNosSelecionados({ "controlador.tipoBorda": v, ...(v === "arredondada" && !el.estilo?.raio ? { "estilo.raio": 12 } : {}) }, `Borda ${v}`)), this.campo("Raio da borda", "estilo.raio", "numero", null, { min: 0, max: 200, padrao: 0 })),
      this.opcao("Efeito", "sombra", est(["estilo.sombra"]), null),
      ...est(["estilo.fundo", "estilo.cor", "estilo.opacidade"]),
      this.detalhes("aparencia-avancada", "Mais opções de aparência", () => d.p_estilo())]);
  }
  efeitos() {
    return this.bloco("Efeitos especiais", [
      this.opcao("Sombra", "sombra", this.app.dir.campos(CAMPOS_ESTILO.filter(c => c.caminho === "estilo.sombra"), this.app.n.selecao, this.app.n.selecionado()), null),
      this.opcao("Desfoque", "desfoque", this.campo("Desfoque (px)", "estilo.desfoque", "numero", null, { min: 0, max: 40, padrao: 0 }), null),
      this.opcao("Vidro", "vidro", this.campo("Vidro (px)", "estilo.vidro", "numero", null, { min: 0, max: 40, padrao: 0 }), null),
      this.detalhes("movimento", "Movimento e transições", this.app.dir.campos(CAMPOS_COMPORTAMENTO.filter(c => c.caminho.startsWith("transicao.")), this.app.n.selecao, this.app.n.selecionado())),
      this.detalhes("transformacao", "Transformação", this.app.dir.campos(CAMPOS_TRANSFORMACAO, this.app.n.selecao, this.app.n.selecionado()))]);
  }
  reacoes() {
    const n = this.app.n;
    let pai = n.elemento(n.selecionado().pai), bloqueado = false;
    const vistos = new Set();
    while (pai && !vistos.has(pai.id ?? pai)) {
      vistos.add(pai.id ?? pai);
      if (pai.controlador?.reacoes === false) { bloqueado = true; break; }
      pai = n.elemento(pai.pai);
    }
    return this.bloco("Reações", [this.interruptor("Reações ativas", "reacoes"),
      bloqueado ? h("p", { role: "status" }, "As reações estão suspensas pelo grupo pai. Reative o grupo para executá-las.") : null,
      this.app.n.selecionado().controlador?.reacoes === false ? h("p", {}, "Reações desligadas. Os eventos e seus parâmetros continuam salvos.") : this.app.dir.p_eventos()]);
  }
  comportamentos() {
    const n = this.app.n, el = n.selecionado(), ids = n.selecionados(), d = this.app.dir;
    const gatilho = ids.length === 2 ? ids[0] : el.id;
    const outros = n.elementos().filter(e => e.id !== gatilho);
    this.receita ??= Object.keys(COMPORTAMENTOS)[0];
    if (ids.length === 2) this.alvo = ids[1];
    if (!outros.some(e => e.id === this.alvo)) this.alvo = "";
    return this.bloco("Comportamentos", [
      h("p", {}, `Gatilho: ${n.rotulo(gatilho)}`),
      campo({ rotulo: "Comportamento", caminho: "receita", tipo: "select", opcoes: Object.entries(COMPORTAMENTOS).map(([k,v]) => [k,v.nome]) }, this.receita, v => { this.receita = v; this.app.render(); }),
      h("small", {}, COMPORTAMENTOS[this.receita]?.desc ?? ""),
      campo({ rotulo: "Elemento controlado", caminho: "alvo", tipo: "select", opcoes: [["", "Escolha…"], ...outros.map(e => [e.id,e.nome])] }, this.alvo, v => { this.alvo = v; this.app.render(); }),
      h("button", { type: "button", class: "bt-texto", disabled: !this.alvo || ids.length > 2, onclick: () => {
        try { n.aplicarComportamento(this.receita, gatilho, this.alvo); } catch(e) { this.app.mensagem(e.message, "alerta"); }
      } }, "Aplicar comportamento"),
      this.detalhes("abertura", "Abrir, fechar e recolher", d.campos(CAMPOS_ABERTURA, el.id, el)),
      this.detalhes("estados", "Reações visuais por estado", d.campos(CAMPOS_COMPORTAMENTO, el.id, el))]);
  }
  render(aba) {
    const n = this.app.n, el = n.selecionado(), d = this.app.dir;
    if (!el) return h("div", { class: "controlador-vazio" },
      h("header", { class: "controlador-cabecalho" }, h("strong", {}, "Tela do projeto"), h("small", {}, "Selecione um objeto no canvas para editar suas propriedades.")),
      h("div", { class: "controlador-tela" }, d.campos(CAMPOS_CANVAS.filter(c => ["largura", "altura", "fundo", "nome"].includes(c.caminho)), "__canvas", n.tela)),
      h("button", { type: "button", class: "bt-texto", onclick: () => { this.app.ui.dockAba = "modelos"; this.app.render(); } }, "Inserir um modelo"));
    const cabecalho = h("header", { class: "controlador-cabecalho" }, h("div", {}, h("strong", {}, el.nome), h("small", {}, n.selecionados().length > 1 ? `${n.selecionados().length} objetos · alteração conjunta` : CATALOGO[el.tipo]?.nome ?? "Objeto")),
      h("button", { type: "button", class: "bt-texto", onclick: () => this.app.setModo("previa") }, "Testar resultado"),
      h("button", { type: "button", class: "bt-texto", disabled: !n.projeto.cursor, onclick: () => n.desfazer() }, "Voltar"));
    let blocos, navegacao = null;
    if (aba === "efeitos") blocos = [this.efeitos(), this.detalhes("adaptacao", "Adaptação à tela", () => d.p_responsivo()), this.detalhes("auditoria", "Auditoria e padronização", () => this.app.esq.p_auditoria())];
    else if (aba === "comportamento") blocos = [this.comportamentos(), this.reacoes(), this.detalhes("acessibilidade", "Acessibilidade", () => d.p_acessibilidade())];
    else {
      const secoes = [["aparencia", "Aparência"], ["geometria", "Geometria"], ...(TIPOS_COM_TEXTO.includes(el.tipo) ? [["texto", "Texto"]] : []), ["avancado", "Avançado"]];
      if (!secoes.some(([id]) => id === this.pagina)) this.pagina = "aparencia";
      navegacao = h("nav", { class: "controlador-secoes", "aria-label": "Propriedades da seleção" }, secoes.map(([id, nome]) => h("button", {
        type: "button", class: "bt-texto", "aria-pressed": String(this.pagina === id), onclick: () => { this.pagina = id; this.app.render(); }
      }, nome)));
      if (this.pagina === "geometria") blocos = [this.bloco("Posição e tamanho", h("div", { class: "controlador-campos" }, [["X", "x"], ["Y", "y"], ["Largura", "largura"], ["Altura", "altura"]].map(([r,k]) => this.campo(r,k,"numero",null,{ min: ["largura","altura"].includes(k) ? 1 : undefined })))), this.detalhes("layout", "Layout e adaptação", () => d.p_responsivo())];
      else if (this.pagina === "texto") blocos = [this.bloco("Texto e tipografia", [d.campos(CATALOGO[el.tipo].campos.filter(c => ["texto", "rotulo"].includes(c.caminho)), el.id, el), d.campos(CAMPOS_ESTILO.filter(c => ["estilo.tamanhoFonte", "estilo.peso", "estilo.cor"].includes(c.caminho)), el.id, el), d.campos(CAMPOS_TEXTO, el.id, el)])];
      else if (this.pagina === "avancado") blocos = [this.detalhes("propriedades", "Todas as propriedades", () => d.p_propriedades()), this.detalhes("composicao", "Componentes e composição", () => d.p_componentes()), this.detalhes("acessibilidade", "Acessibilidade", () => d.p_acessibilidade())];
      else blocos = [this.aparencia()];
    }
    return h("div", { class: `controlador-formulario inspetor-${aba}` }, cabecalho, navegacao, h("div", { class: "forja-grade" }, blocos));
  }
}
