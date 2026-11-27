import { h, botaoIcone } from "./dom.js";
import { icone } from "./icones.js";

/** Janela de teste isolada. Minimizar preserva a execução do projeto no iframe. */
export class JanelaTeste {
  constructor(app) {
    this.app = app;
    this.anterior = document.activeElement;
    this.frame = h("iframe", { title: "Teste funcional do projeto", sandbox: "allow-scripts", class: "forja-previa", srcdoc: app.n.html() });
    this.btMax = botaoIcone("telaCheia", "Restaurar tamanho do teste", () => this.maximizar());
    this.janela = h("section", { class: "janela-teste maximizada", role: "dialog", "aria-modal": "true", "aria-labelledby": "teste-titulo", tabindex: "-1" },
      h("header", { class: "teste-cabecalho" }, h("h2", { id: "teste-titulo" }, h("span", { html: icone("previa", 20) }), "Testar interface"),
        h("div", { class: "teste-controles" }, botaoIcone("menos", "Minimizar teste", () => this.minimizar()), this.btMax, botaoIcone("fechar", "Fechar teste", () => this.fechar()))),
      this.frame,
      h("footer", { class: "teste-rodape" }, h("span", {}, "Prévia interativa do projeto")));
    this.veu = h("div", { class: "veu teste-veu" }, this.janela);
    this.reabrir = h("button", { type: "button", class: "teste-restaurar bt", hidden: true, onclick: () => this.restaurar() }, "Restaurar teste da interface");
    this.tecla = e => {
      if (this.veu.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); this.fechar(); }
      if (e.key === "Tab" && !this.janela.contains(document.activeElement)) { e.preventDefault(); this.janela.querySelector("button").focus(); }
    };
    this.foco = e => { if (!this.veu.hidden && !this.janela.contains(e.target)) this.janela.focus(); };
    document.addEventListener("keydown", this.tecla, true);
    document.addEventListener("focusin", this.foco);
    document.body.append(this.veu, this.reabrir);
    this.janela.focus();
  }
  maximizar() {
    const ativa = this.janela.classList.toggle("maximizada");
    this.btMax.setAttribute("aria-label", ativa ? "Restaurar tamanho do teste" : "Maximizar teste");
    this.btMax.title = ativa ? "Restaurar tamanho do teste" : "Maximizar teste";
  }
  minimizar() { this.veu.hidden = true; this.reabrir.hidden = false; this.reabrir.focus(); }
  restaurar() { this.veu.hidden = false; this.reabrir.hidden = true; this.janela.focus(); }
  fechar() {
    document.removeEventListener("keydown", this.tecla, true); document.removeEventListener("focusin", this.foco);
    this.veu.remove(); this.reabrir.remove(); this.app.janelaTeste = null; this.anterior?.focus?.();
  }
}
