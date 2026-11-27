// Painel Primeiros passos: o roteiro da primeira sessão com o cronômetro do "teste dos 5 minutos".
// Só observa o que a pessoa faz (inserir, editar, Prévia, salvar modelo, exportar) e marca o passo.
import { h } from "./dom.js";
import { icone } from "./icones.js";
import { RoteiroPrimeirosPassos, META_TOTAL } from "../nucleo/primeirosPassos.js";

const mmss = s => (s == null ? "—" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);

export class PainelPrimeirosPassos {
  constructor(app) {
    this.app = app;
    this.roteiro = new RoteiroPrimeirosPassos(app.ui.primeirosPassos ?? null);
    this._timer = null;
  }

  guardar() { this.app.ui.primeirosPassos = this.roteiro.guardar(); this.app.salvarUI(); }

  /** Chamado pela App quando algo acontece (texto do histórico ou ação da interface). */
  observar(texto) { if (this.roteiro.ativo && this.roteiro.observar(texto)) this.aoMarcar(); }
  marcar(id) { if (this.roteiro.ativo && this.roteiro.marcar(id)) this.aoMarcar(); }
  aoMarcar() {
    this.guardar();
    const prox = this.roteiro.proximo();
    this.app.mensagem(prox ? `Passo feito. Próximo: ${prox.nome}.` : `Pronto! ${mmss(this.roteiro.relatorio().total)} no total.`, "ok");
    if (this.app.ui.esq === "primeiros") this.app.render();
  }

  comecar() {
    this.roteiro.comecar();
    this.guardar();
    this.relogio();
    this.app.render();
  }

  /** Atualiza só o cronômetro (sem redesenhar a tela inteira) enquanto o roteiro está ativo e visível. */
  relogio() {
    clearInterval(this._timer);
    this._timer = setInterval(() => {
      if (!this.roteiro.ativo) { clearInterval(this._timer); return; }
      const el = document.querySelector("[data-painel='primeiros'] .pp-tempo");
      if (el) el.textContent = mmss(this.roteiro.relatorio().total);
    }, 1000);
  }

  render() {
    const r = this.roteiro.relatorio();
    const ativo = this.roteiro.ativo;
    if (ativo && !this._timer) this.relogio();
    return [
      h("p", { class: "painel-vazio" }, "Meta: de abrir até exportar o código em menos de 5 minutos, sem ajuda. O cronômetro só conta; você faz cada passo."),
      h("div", { class: "pp-cabeca" },
        h("span", { class: "pp-tempo", "aria-live": "off" }, mmss(r.total)),
        h("span", { class: "chip" }, `meta ${mmss(META_TOTAL)}`),
        r.aprovado ? h("span", { class: "chip pp-ok" }, "aprovado") : null),
      h("ol", { class: "pp-passos" }, r.passos.map(p => h("li", { class: p.feito ? (p.dentroDaMeta ? "feito" : "feito tarde") : "" },
        h("span", { class: "pp-marca", html: icone(p.feito ? "check" : "relogio", 14) }),
        h("span", { class: "pp-nome" }, p.nome, h("small", {}, p.feito ? ` ${mmss(p.tempo)} (meta ${mmss(p.meta)})` : ` · ${p.dica}`))))),
      h("div", { class: "aud-acoes" },
        h("button", { type: "button", class: "bt-texto", onclick: () => this.comecar() }, ativo || this.roteiro.concluido ? "Recomeçar o teste" : "Começar o teste dos 5 minutos")),
    ];
  }
}
