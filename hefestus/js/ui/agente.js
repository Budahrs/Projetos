// Painel do agente: conversa, ações feitas em cada turno, parar, rápido/pensar mais.
// O nó raiz é persistente (a lateral só o move de lugar), para não perder o que está
// sendo digitado quando o resto da interface redesenha.
import { h } from "./dom.js";
import { icone } from "./icones.js";

const SUGESTOES = [
  "Cria um botão verde escrito Cadastrar abaixo do Entrar",
  "Quando clicar em Esqueci a senha, abre o Aviso de envio",
  "Insere o modelo menu suspenso",
  "Tema grafite",
];

export class PainelAgente {
  constructor(app) {
    this.app = app;
    this.modo = null;
    this.rapido = true;
    this.controle = null;
    this.vivo = null; // bolha da resposta em andamento

    this.chip = h("span", { class: "chip" }, "…");
    this.btRapido = h("button", { type: "button", class: "seg", "aria-pressed": "true", onclick: () => this.setRapido(true) }, "Rápido");
    this.btPensar = h("button", { type: "button", class: "seg", "aria-pressed": "false", onclick: () => this.setRapido(false) }, "Pensar mais");
    this.seletor = h("div", { class: "segmentos", role: "group", "aria-label": "Velocidade do agente", hidden: true }, this.btRapido, this.btPensar);
    this.lista = h("div", { class: "chat-lista", role: "log", "aria-live": "polite", "aria-label": "Conversa com o agente" });
    this.entrada = h("textarea", {
      id: "agente-entrada", class: "chat-entrada", rows: 2, placeholder: "Peça uma mudança na interface…", "aria-label": "Pedido ao agente",
      onkeydown: e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.enviar(); } },
    });
    this.btEnviar = h("button", { type: "button", class: "bt primario chat-enviar", onclick: () => (this.app.agente.ocupado ? this.parar() : this.enviar()) }, "Enviar");
    this.raiz = h("div", { class: "agente" },
      h("div", { class: "agente-topo" }, this.chip, this.seletor),
      this.lista,
      h("div", { class: "chat-compor" }, this.entrada, this.btEnviar));

    app.agente.modo().then(m => this.definirModo(m));
  }

  definirModo(m) {
    this.modo = m;
    this.chip.className = `chip ${m === "claude" ? "prot" : ""}`;
    this.chip.textContent = m === "claude" ? "Conectado ao Claude" : "Modo local";
    this.chip.title = m === "claude"
      ? "O agente entende qualquer pedido. Cada pedido usa a sua conta do Claude."
      : "Sem conexão com o Claude (por exemplo, arquivo aberto no computador). Entendo os pedidos mais comuns; digite \"ajuda\" para ver exemplos.";
    this.seletor.hidden = m !== "claude";
    this.app.renderStatus?.();
  }

  setRapido(v) {
    this.rapido = v;
    this.btRapido.setAttribute("aria-pressed", String(v));
    this.btPensar.setAttribute("aria-pressed", String(!v));
  }

  /** Redesenha a conversa a partir do documento (que muda com desfazer/refazer). */
  render() {
    if (this.vivo) return; // não apaga a resposta em andamento
    const msgs = this.app.n.conversa();
    if (!msgs.length) {
      this.lista.replaceChildren(h("div", { class: "chat-vazio" },
        h("p", {}, "Descreva o que quer na tela. Eu crio e ajusto elementos, estados e eventos, e tudo passa pela proteção do editor."),
        h("p", { class: "painel-vazio" }, "Cada pedido vira um passo no histórico: um Ctrl+Z desfaz o pedido inteiro, conversa incluída."),
        h("div", { class: "sugestoes" }, SUGESTOES.map(s => h("button", { type: "button", class: "sugestao", onclick: () => { this.entrada.value = s; this.enviar(); } }, s)))));
      return;
    }
    this.lista.replaceChildren(...msgs.map(m => this.bolha(m)));
    this.rolarFim();
  }

  bolha(m) {
    if (m.papel === "usuario") return h("div", { class: "msg msg-usuario" }, m.texto);
    return h("div", { class: "msg msg-agente" },
      m.acoes?.length ? h("ul", { class: "msg-acoes" }, m.acoes.map(a => h("li", { html: icone("escudo", 12) }, a))) : null,
      h("div", { class: "msg-texto" }, m.texto));
  }

  rolarFim() {
    requestAnimationFrame(() => { this.lista.scrollTop = this.lista.scrollHeight; });
  }

  async enviar() {
    const ag = this.app.agente;
    if (ag.ocupado) return;
    const texto = this.entrada.value.trim();
    if (!texto) return;
    this.entrada.value = "";

    // bolhas provisórias enquanto o turno roda
    if (this.lista.querySelector(".chat-vazio")) this.lista.replaceChildren();
    this.lista.append(h("div", { class: "msg msg-usuario" }, texto));
    const acoes = h("ul", { class: "msg-acoes" });
    const corpo = h("div", { class: "msg-texto pensando" }, "Pensando…");
    this.vivo = h("div", { class: "msg msg-agente" }, acoes, corpo);
    this.lista.append(this.vivo);
    this.rolarFim();

    this.controle = new AbortController();
    this.ocupar(true);
    try {
      const r = await ag.enviar(texto, {
        signal: this.controle.signal,
        rapido: this.rapido,
        aoTexto: t => { corpo.classList.remove("pensando"); corpo.textContent = t; this.rolarFim(); },
        aoAcao: linha => { acoes.append(h("li", { html: icone("escudo", 12) }, linha)); this.rolarFim(); },
        aoModo: m => this.definirModo(m),
      });
      if (r?.navegou) {
        this.vivo = null;
        this.render();
        this.app.mensagem(r.resposta, "ok");
      } else if (r?.acoes?.length) {
        this.app.mensagem("Pedido do agente aplicado. Desfazer volta o pedido inteiro.", "ok");
      }
    } catch (e) {
      corpo.classList.remove("pensando");
      corpo.textContent = `Algo deu errado: ${e?.message ?? e}`;
    } finally {
      this.vivo = null;
      this.controle = null;
      this.ocupar(false);
      this.render();
      this.entrada.focus();
    }
  }

  parar() {
    this.controle?.abort();
  }

  ocupar(sim) {
    document.getElementById("app")?.classList.toggle("agente-ocupado", sim);
    this.btEnviar.textContent = sim ? "Parar" : "Enviar";
    this.btEnviar.classList.toggle("primario", !sim);
    this.entrada.disabled = sim;
    this.app.renderStatus?.();
  }
}
