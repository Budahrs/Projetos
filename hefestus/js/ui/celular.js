// Designer no celular em pé (até 700 px), no padrão dos editores profissionais de celular
// (PowerPoint, Word, Figma): barra de app no topo, canvas em tela cheia, barra inferior com
// ícones grandes, painéis que sobem de baixo e barra de contexto quando há seleção.
// Reaproveita os mesmos comandos da faixa (ribbon.registro) e os mesmos painéis de Camadas e
// Propriedades (como gavetas). O estado de gaveta e painel fica em <html data-*>, fora de #app,
// para sobreviver aos render() da App. A faixa de computador continua no Visual Script.
import { h } from "./dom.js";
import { icone } from "./icones.js";

const CELULAR = "(max-width: 700px)";

/** Painéis da barra inferior: título e abas da faixa que cada um mostra. */
const PAINEIS = {
  ferramentas: { titulo: "Ferramentas", abas: [] },
  inserir: { titulo: "Inserir", abas: ["inserir"] },
  editar: { titulo: "Editar", abas: ["inicio", "modificar", "aparencia", "layout"] },
  arquivo: { titulo: "Arquivo", abas: ["arquivo"] },
  mais: { titulo: "Mais opções", abas: ["exibir"] },
};

const FERRAMENTAS = [
  ["selecao", "Selecionar", "selecao"], ["direta", "Editar nós", "nos"], ["caneta", "Caneta", "caneta"],
  ["texto", "Texto", "texto"], ["caixa", "Retângulo", "caixa"], ["elipse", "Elipse", "elipse"],
  ["linha", "Linha", "linha"], ["conta", "Conta-gotas", "contaGotas"], ["mao", "Mover a vista", "mao"], ["zoom", "Zoom", "zoom"],
];

export function iniciarCelular(app) {
  const raiz = document.documentElement;
  const midia = globalThis.matchMedia?.(CELULAR);
  const ic = (nome, tam = 22) => h("span", { class: "hpc-ic", html: icone(nome, tam) });
  const bt = (rotulo, nomeIcone, acao, extra = {}) => h("button", { type: "button", title: rotulo, "aria-label": rotulo, onclick: acao, ...extra }, ic(nomeIcone), extra.comRotulo ? h("span", {}, rotulo) : null);

  // ---------------- gavetas (Camadas à esquerda, Propriedades à direita) ----------------
  const gaveta = () => raiz.dataset.gaveta || "";
  const definirGaveta = lado => {
    fecharPainel();
    if (lado === "dir" && !app.ui.dir?.length) app.abrirPainelDir("inspetor");
    if (lado) raiz.dataset.gaveta = lado; else delete raiz.dataset.gaveta;
    atualizar();
  };

  // ---------------- painel que sobe (comandos da faixa como lista) ----------------
  const folha = h("section", { class: "hpc-folha", role: "dialog", "aria-modal": "false" });
  let painel = null, abaPainel = null;
  function fecharPainel() { painel = null; delete raiz.dataset.painel; folha.replaceChildren(); atualizar(); }
  function abrirPainel(id, aba) {
    if (painel === id && !aba) return fecharPainel();
    delete raiz.dataset.gaveta;
    painel = id; abaPainel = aba ?? (abaPainel && PAINEIS[id].abas?.includes(abaPainel) ? abaPainel : PAINEIS[id].abas?.[0]);
    raiz.dataset.painel = id;
    desenharPainel();
    atualizar();
  }
  const executar = (fn, manterAberto = false) => { fn(); if (!manterAberto) fecharPainel(); app.render(); };

  function linhaComando(c) {
    const r = app.ribbon.registro;
    r.registrar(c);
    const estado = r.estado(c.id);
    if (!estado.visivel) return null;
    if (c.tipo === "spinner") {
      const valor = c.valor?.();
      const campo = h("input", { type: "number", min: c.min, max: c.max, step: c.passo ?? 1, value: valor ?? "", disabled: valor == null, "aria-label": c.rotulo,
        onchange: e => { const v = Number(e.target.value); if (Number.isFinite(v)) { c.aoMudar?.(v); app.render(); } } });
      return h("label", { class: "hpc-linha hpc-campo" }, ic(c.icone ?? "propriedades"), h("span", {}, c.rotulo), campo, c.unidade ? h("small", {}, c.unidade) : null);
    }
    if (c.flyout) {
      const itens = (typeof c.flyout === "function" ? c.flyout() : c.flyout).filter(Boolean);
      const sub = h("div", { class: "hpc-sub", hidden: true }, itens.map(linhaComando));
      return h("div", { class: "hpc-grupo-sub" },
        h("button", { type: "button", class: "hpc-linha", disabled: !estado.habilitado, "aria-expanded": "false",
          onclick: e => { sub.hidden = !sub.hidden; e.currentTarget.setAttribute("aria-expanded", String(!sub.hidden)); } },
          ic(c.icone ?? "caixa"), h("span", {}, c.rotulo), ic("setaBaixo", 14)), sub);
    }
    const marcado = c.ativo ? !!estado.marcado : null;
    return h("button", { type: "button", class: "hpc-linha", disabled: !estado.habilitado, ...(marcado === null ? {} : { "aria-pressed": String(marcado) }),
      onclick: () => executar(() => r.executar(c.id), marcado !== null) },
      ic(c.icone ?? "caixa"), h("span", {}, c.rotulo), marcado ? ic("check", 16) : null);
  }

  function desenharPainel() {
    const def = PAINEIS[painel];
    const fechar = bt("Fechar", "fechar", fecharPainel, { class: "hpc-fechar" });
    let corpo;
    if (painel === "ferramentas") {
      const atual = app.ui.ferramenta;
      corpo = h("div", { class: "hpc-grade" }, FERRAMENTAS.map(([id, nome, nomeIcone]) =>
        h("button", { type: "button", class: "hpc-tile", "aria-pressed": String(atual === id),
          onclick: () => executar(() => id === "direta" ? app.editarSelecaoDireta() : app.setFerramenta(id)) }, ic(nomeIcone, 26), h("span", {}, nome))));
    } else {
      const todas = app.ribbon.faixa.abasVisiveis(app.ribbon.todas ?? []);
      const abas = def.abas.map(id => todas.find(a => a.id === id)).filter(Boolean);
      const aba = abas.find(a => a.id === abaPainel) ?? abas[0];
      corpo = h("div", { class: "hpc-lista" }, (aba?.grupos ?? []).map(g => {
        const linhas = (g.cmds ?? []).filter(Boolean).map(linhaComando).filter(Boolean);
        return linhas.length ? h("section", { class: "hpc-secao" }, h("h3", {}, g.nome), linhas) : null;
      }));
      if (abas.length > 1) {
        const seletor = h("div", { class: "hpc-abas", role: "tablist" }, abas.map(a =>
          h("button", { type: "button", role: "tab", "aria-selected": String(a.id === aba.id), onclick: () => abrirPainel(painel, a.id) }, a.rotulo)));
        folha.replaceChildren(h("div", { class: "hpc-alca" }), h("header", {}, h("h2", {}, def.titulo), fechar), seletor, corpo);
        folha.setAttribute("aria-label", def.titulo);
        return;
      }
    }
    const titulo = painel === "ferramentas" ? "Ferramentas" : def.titulo;
    folha.setAttribute("aria-label", titulo);
    folha.replaceChildren(h("div", { class: "hpc-alca" }), h("header", {}, h("h2", {}, titulo), fechar), corpo);
  }

  // ---------------- barra de app (topo) ----------------
  const titulo = h("button", { type: "button", class: "hpc-titulo", title: "Arquivo", onclick: () => abrirPainel("arquivo") });
  const btDesfazer = bt("Desfazer", "desfazer", () => { app.n.desfazer(); app.render(); });
  const btRefazer = bt("Refazer", "refazer", () => { app.n.refazer(); app.render(); });
  const topo = h("header", { class: "hpc-topo" },
    bt("Arquivo", "menu", () => abrirPainel("arquivo")), titulo, btDesfazer, btRefazer,
    bt("Prévia interativa", "play", () => { fecharPainel(); app.setModo("previa"); }),
    bt("Visual Script", "nos", () => { fecharPainel(); delete raiz.dataset.gaveta; app.setModo("visual-script"); app.render(); }),
    bt("Mais opções", "maisOpcoes", () => abrirPainel("mais")));

  // ---------------- barra de contexto (com seleção) ----------------
  const cmdId = id => () => executar(() => app.ribbon.registro.executar(id));
  const contexto = h("nav", { class: "hpc-contexto", "aria-label": "Ações da seleção" },
    bt("Duplicar", "duplicar", cmdId("hp-duplicar"), { comRotulo: true }),
    bt("Copiar", "copiar", cmdId("copiar-el"), { comRotulo: true }),
    bt("Trazer à frente", "frente", cmdId("hp-frente"), { comRotulo: true }),
    bt("Enviar para trás", "tras", cmdId("hp-tras"), { comRotulo: true }),
    bt("Estilo", "pincel", () => abrirPainel("editar", "aparencia"), { comRotulo: true }),
    bt("Excluir", "excluir", () => { app.n.removerVarios(app.n.selecionados()); app.render(); }, { comRotulo: true, class: "perigo" }));

  // ---------------- barra inferior ----------------
  const item = (id, rotulo, nomeIcone, acao) => h("button", { type: "button", "data-item": id, "aria-label": rotulo, onclick: acao }, ic(nomeIcone, 24), h("span", {}, rotulo));
  const barra = h("nav", { class: "hpc-barra", "aria-label": "Designer" },
    item("ferramentas", "Ferramentas", "selecao", () => abrirPainel("ferramentas")),
    item("inserir", "Inserir", "mais", () => abrirPainel("inserir")),
    item("editar", "Editar", "pincel", () => abrirPainel("editar")),
    item("esq", "Camadas", "camadas", () => definirGaveta(gaveta() === "esq" ? "" : "esq")),
    item("dir", "Propriedades", "propriedades", () => definirGaveta(gaveta() === "dir" ? "" : "dir")));

  const casca = h("div", { class: "hpc" }, topo, contexto, folha, barra);
  document.body.append(casca);

  function atualizar() {
    titulo.textContent = app.n.nome || "Sem título";
    const ferr = FERRAMENTAS.find(f => f[0] === app.ui.ferramenta) ?? FERRAMENTAS[0];
    barra.querySelector('[data-item="ferramentas"] .hpc-ic').innerHTML = icone(ferr[2], 24);
    for (const b of barra.querySelectorAll("button")) {
      const id = b.dataset.item;
      b.setAttribute("aria-pressed", String(id === painel || id === gaveta()));
    }
    contexto.hidden = !app.n.selecionados().length || !!painel || !!gaveta();
  }
  app.n.on(atualizar);

  // toque no canvas fecha gaveta e painel (o toque ainda chega ao canvas)
  document.addEventListener("pointerdown", e => {
    if ((gaveta() || painel) && e.target.closest?.("#app .meio > .area")) { delete raiz.dataset.gaveta; fecharPainel(); }
  }, true);
  addEventListener("keydown", e => { if (e.key === "Escape" && (gaveta() || painel)) { delete raiz.dataset.gaveta; fecharPainel(); } });

  // pinça com dois dedos: zoom e mover a vista, como nos apps de celular
  const toques = new Map();
  let pinca = null;
  const centro = () => { const [a, b] = [...toques.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) || 1 }; };
  document.addEventListener("pointerdown", e => {
    if (e.pointerType !== "touch" || !midia?.matches || !e.target.closest?.("#app .meio > .area")) return;
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (toques.size === 2) { const c = centro(); pinca = { ...c, zoom: app.area.zoom }; }
  }, true);
  addEventListener("pointermove", e => {
    if (!toques.has(e.pointerId)) return;
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!pinca || toques.size < 2) return;
    e.stopImmediatePropagation(); // o canvas não recebe o gesto de dois dedos
    const c = centro(), rolagem = app.area.rolagem;
    rolagem.scrollLeft -= c.x - pinca.x; rolagem.scrollTop -= c.y - pinca.y;
    const z = pinca.zoom * c.d / pinca.d;
    if (Math.abs(z - app.area.zoom) > 0.02) app.zoomEm(z, c.x, c.y);
    pinca.x = c.x; pinca.y = c.y;
  }, true);
  const soltar = e => { toques.delete(e.pointerId); if (toques.size < 2) pinca = null; };
  addEventListener("pointerup", soltar, true);
  addEventListener("pointercancel", soltar, true);

  // no Visual Script a faixa de computador continua, recolhida: abas embaixo abrem os comandos por cima
  const recolher = () => { if (midia?.matches && !app.ui.ribbonRecolhido && !app.ribbon.classico) app.ribbon.alternarRecolhido(); };
  recolher();
  midia?.addEventListener?.("change", () => { recolher(); if (!midia.matches) { delete raiz.dataset.gaveta; fecharPainel(); } app.render(); });
  atualizar();
}
