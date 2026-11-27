// Aparência da interface: tema, estilo do menu, formato, barra de ferramentas, sons e
// agrupamento em containers. Métodos misturados na classe App (veja js/app.js).
import { avisar, h } from "../ui/dom.js";
import { TEMAS_UI, ESTILOS_MENU, FORMATOS, aplicarTemaUI } from "../ui/temas.js";
import { linkGoogleFonts } from "../nucleo/fontes.js";
import { MODELOS } from "../nucleo/modelos.js";
import { ligarSons, sons } from "../ui/sons.js";
class Aparencia {
  // ---------------- aparência da interface (nunca muda o canvas) ----------------
  aplicarAparencia() {
    aplicarTemaUI(this.ui.temaUI,{reduzirMovimento:this.ui.reduzirMovimento});
    document.documentElement.dataset.forma = FORMATOS[this.ui.formato] ? this.ui.formato : "arredondado";
    document.documentElement.dataset.menu = ESTILOS_MENU[this.ui.estiloMenu] ? this.ui.estiloMenu : "faixa";
    ligarSons(this.ui.sons !== false);
  }
  alternarSons() {
    this.ui.sons = this.ui.sons === false;
    this.aplicarAparencia();
    this.salvarUI();
    this.render();
    if (this.ui.sons) sons.encaixar();
  }
  acharModelo(id) { return [...this.modelosUsuario(), ...MODELOS].find(m => m.id === id); }
  agrupar(modo = "livre") {
    const ids = this.n.selecionados();
    if (!ids.length) return avisar("Selecione os objetos que deseja agrupar.", "alerta");
    const id = this.n.agruparEmContainer(ids, modo);
    if (id) {
      this.mensagem(modo === "livre" ? "Grupo criado: composição e código reunidos. Configure as relações na aba Comportamento." : `Grupo em ${modo}: os itens se organizam juntos.`, "ok");
      if (this.ui.sons !== false) sons.entrar();
    }
  }
  desagrupar() {
    const c = this.n.selecionados().map(id => this.n.elemento(id)).find(e => e?.tipo === "container");
    const id = this.n.selecionados().find(i => this.n.elemento(i)?.tipo === "container");
    if (!c) return avisar("Selecione um grupo para desagrupar.", "alerta");
    try { this.n.desagrupar(id); } catch (e) { avisar(e.message, "alerta"); }
  }
  definirTemaUI(k) {
    if (!TEMAS_UI[k]) return;
    this.ui.temaUI = k;
    this.aplicarAparencia();
    this.salvarUI();
    this.render();
    this.mensagem(`Tema da interface: ${TEMAS_UI[k].nome}. O canvas não muda.`, "ok");
  }
  definirEstiloMenu(k) {
    if (!ESTILOS_MENU[k]) return;
    this.ui.estiloMenu = k;
    this.ui.flyout = null;
    this.aplicarAparencia();
    this.salvarUI();
    this.render();
    this.mensagem(k === "classico" ? "Barra de menus: clique num menu ou use F10 para navegar pelo teclado." : "Faixa de opções ativada.", "ok");
  }
  definirFormato(k) {
    if (!FORMATOS[k]) return;
    this.ui.formato = k;
    this.aplicarAparencia();
    this.salvarUI();
    this.render();
  }
  alternarBarra() {
    this.ui.barraFerr = this.ui.barraFerr === false;
    this.salvarUI();
    this.render();
    this.mensagem(this.ui.barraFerr ? "Barra de ferramentas visível." : "Barra oculta: as ferramentas voltaram para a lateral. F6 mostra a barra de novo.");
  }
  carregarFontesWeb() {
    const href = linkGoogleFonts();
    if (!href || document.querySelector("link[data-fontes-bib]")) return;
    document.head.append(h("link", { rel: "stylesheet", href, "data-fontes-bib": "" }));
  }

}
export { Aparencia };
