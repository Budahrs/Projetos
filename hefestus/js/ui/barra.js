// Barra de ferramentas solta (não grudada no menu) e ocultável (F6): ferramentas de
// seleção e desenho, voltar/avançar com dica e lista "voltar até", posição e tamanho do
// selecionado, alinhamento rápido e pesquisa recolhível. Oculta, as ferramentas voltam
// para a lateral esquerda.
import { h, botaoIcone } from "./dom.js";
import { icone } from "./icones.js";
import { CATALOGO } from "../nucleo/catalogo.js";
import { gruposFerramentas } from "./blocosFerramentas.js";
import { TEMAS_UI } from "./temas.js";
import { comandosDaInterface } from "./ribbon.js";

export class BarraFina {
  constructor(app) {
    this.app = app;
    const n = app.n;

    this.btDesf = botaoIcone("desfazer", "Desfazer (Ctrl+Z)", () => n.desfazer());
    this.btRefz = botaoIcone("refazer", "Refazer (Ctrl+Y)", () => n.refazer());
    this.barraProg = h("i");
    this.contador = h("span", { class: "contador num" });
    this.pontoSujo = h("span", { class: "nao-salvo", title: "Há alterações não salvas em arquivo" });
    for (const [bt, lado] of [[this.btDesf, -1], [this.btRefz, 1]]) {
      bt.removeAttribute("title");
      bt.addEventListener("mouseenter", () => this.dica(bt, lado));
      bt.addEventListener("mouseleave", () => this.esconderDica());
      this.pressaoLonga(bt);
    }

    this.geo = {};
    const geo = h("div", { class: "geo bf-bloco" });
    for (const [k, r] of [["x", "X"], ["y", "Y"], ["largura", "L"], ["altura", "A"]]) {
      const inp = h("input", {
        id: `geo-${k}`, type: "number", class: "num", "aria-label": { x: "Posição X", y: "Posição Y", largura: "Largura", altura: "Altura" }[k],
        onchange: e => {
          const v = Number(e.target.value);
          if (Number.isNaN(v)) return;
          const ids = n.selecionados();
          if (ids.length > 1) {
            const b = n.limites(ids);
            if (k === "x") n.moverVarios(ids, v - b.x, 0);
            if (k === "y") n.moverVarios(ids, 0, v - b.y);
            return;
          }
          const id = ids[0] ?? "__canvas";
          if (id === "__canvas" && (k === "x" || k === "y")) return;
          n.geometria(id, { [k]: v }, `Ajustar ${r} de ${n.rotulo(id)}`);
        },
      });
      this.geo[k] = inp;
      geo.append(h("label", { for: `geo-${k}` }, r), inp);
    }

    this.rot = h("input", {
      id: "geo-rot", type: "number", class: "num", "aria-label": "Rotação em graus", min: -360, max: 360,
      onchange: e => { const v = Number(e.target.value); if (!Number.isNaN(v) && n.selecionados().length) n.definirRotacao(n.selecionados(), v); },
    });
    geo.append(h("label", { for: "geo-rot", title: "Rotação" }, "°"), this.rot);
    const alinhar = h("div", { class: "bf-bloco bf-al" },
      ...[["esquerda", "al-esq", "Alinhar à esquerda"], ["centroH", "al-centroH", "Centralizar na horizontal"], ["direita", "al-dir", "Alinhar à direita"],
        ["topo", "al-topo", "Alinhar ao topo"], ["centroV", "al-centroV", "Centralizar na vertical"], ["base", "al-base", "Alinhar à base"]]
        .map(([m, ic, t]) => (this[`al_${m}`] = botaoIcone(ic, `${t} (com vários: entre si; com um: na tela)`, () => n.alinharVarios(n.selecionados(), m), { tam: 16 }))),
      (this.distH = botaoIcone("distH", "Distribuir na horizontal (3 ou mais)", () => n.distribuir(n.selecionados(), "h"), { tam: 16 })),
      (this.distV = botaoIcone("distV", "Distribuir na vertical (3 ou mais)", () => n.distribuir(n.selecionados(), "v"), { tam: 16 })));

    // Pesquisa
    this.entrada = h("input", {
      id: "busca", type: "search", placeholder: "Buscar elemento ou comando (Ctrl+P)", "aria-label": "Buscar",
      oninput: () => this.buscar(), onfocus: () => this.buscar(),
      onkeydown: e => this.teclaBusca(e),
    });
    this.resultados = h("div", { class: "resultados", hidden: true, role: "listbox" });
    this.btBusca = botaoIcone("buscar", "Mostrar pesquisa", () => this.alternarBusca(true), { tam: 16 });
    this.btRecolherBusca = botaoIcone("setaDir", "Recolher pesquisa", () => this.alternarBusca(false), { tam: 14 });
    this.caixaBusca = h("div", { class: "busca" },
      h("span", { class: "lupa", html: icone("buscar", 15) }), this.entrada, this.btRecolherBusca, this.resultados);
    document.addEventListener("pointerdown", e => { if (!this.caixaBusca.contains(e.target)) this.resultados.hidden = true; });

    this.ferramentas = h("div", { class: "bf-bloco bf-ferr", role: "group", "aria-label": "Ferramentas" });
    this.btOcultar = botaoIcone("setaCima", "Ocultar a barra de ferramentas (F6)", () => app.alternarBarra(), { tam: 14, class: "bf-ocultar" });
    this.raiz = h("div", { class: "barra-fina", role: "toolbar", "aria-label": "Barra de ferramentas" },
      this.ferramentas,
      h("div", { class: "bf-div" }),
      h("div", { class: "bf-bloco" }, this.btDesf, h("div", { class: "progresso", title: "Posição no histórico" }, this.barraProg), this.btRefz, this.contador, this.pontoSujo),
      h("div", { class: "bf-div" }),
      geo,
      h("div", { class: "bf-div bf-al" }),
      alinhar,
      h("div", { class: "bf-espaco" }),
      this.caixaBusca,
      this.btBusca,
      this.btOcultar
    );
    document.addEventListener("pointerdown", e => { if (this.menuFerr && !this.menuFerr.contains(e.target) && !this.ferramentas.contains(e.target) && !this.origemFerr?.contains(e.target)) this.fecharFerramentas(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && this.menuFerr) { this.fecharFerramentas(); this.origemFerr?.focus(); } });
  }

  fecharFerramentas() { this.menuFerr?.remove(); this.menuFerr = null; this.origemFerr?.setAttribute("aria-expanded", "false"); }

  abrirFerramentas(origem, lista) {
    const aberto = this.menuFerr && this.origemFerr === origem;
    this.fecharFerramentas(); if (aberto) return;
    this.origemFerr = origem; origem.setAttribute("aria-expanded", "true");
    const r = origem.getBoundingClientRect();
    this.menuFerr = h("div", { class: "ferramentas-lista", role: "menu", "aria-label": "Variações da ferramenta", style: `left:${Math.max(8, Math.min(r.left, window.innerWidth - 260))}px;top:${Math.max(8, Math.min(r.bottom + 5, window.innerHeight - lista.length * 38 - 20))}px` },
      lista.map(f => h("button", { type: "button", role: "menuitem", class: "bt-texto", onclick: () => { this.fecharFerramentas(); if (f.acao) f.acao(); else this.app.setFerramenta(f.id); } },
        h("span", { html: icone(f.icone, 17) }), f.nome, h("small", {}, f.tecla))));
    document.body.append(this.menuFerr);
    this.menuFerr.querySelector("button")?.focus();
  }

  render() {
    const n = this.app.n;
    this.raiz.hidden = this.app.ui.barraFerr === false;
    const atual = this.app.ui.ferramenta ?? "selecao";
    const grupos = gruposFerramentas(this.app);
    this.ferramentas.replaceChildren(...grupos.map(([nome, lista]) => {
      const ativo = lista.find(f => f.id === atual) ?? lista[0];
      let bt;
      bt = botaoIcone(ativo.icone, `${nome}: ${ativo.nome}${lista.length > 1 ? ". Abrir variações" : ""}`, () => lista.length > 1 ? this.abrirFerramentas(bt, lista) : this.app.setFerramenta(ativo.id),
        { tam: 17, class: "ferramenta", attrs: { "aria-pressed": String(lista.some(f => f.id === atual)), ...(lista.length > 1 ? { "aria-haspopup": "menu", "aria-expanded": "false", "data-irmas": String(lista.length) } : {}) } });
      return bt;
    }));
    const { itens, cursor } = n.historico();
    this.btDesf.disabled = cursor === 0;
    this.btRefz.disabled = cursor === itens.length;
    this.barraProg.style.width = itens.length ? `${(cursor / itens.length) * 100}%` : "0%";
    this.contador.textContent = `${cursor}/${itens.length}`;
    this.pontoSujo.hidden = !n.sujo;

    const ids = n.selecionados();
    const varios = ids.length > 1;
    const sel = n.selecionado();
    const alvo = varios ? n.limites(ids) : sel ?? { ...n.tela, x: "", y: "" };
    for (const k of ["x", "y", "largura", "altura"]) {
      const inp = this.geo[k];
      if (document.activeElement !== inp) inp.value = alvo[k] ?? "";
      inp.disabled = (!sel && (k === "x" || k === "y")) || (varios && (k === "largura" || k === "altura"));
    }
    if (document.activeElement !== this.rot) this.rot.value = sel ? sel.rotacao ?? 0 : "";
    this.rot.disabled = !sel;
    for (const m of ["esquerda", "centroH", "direita", "topo", "centroV", "base"]) this[`al_${m}`].disabled = !ids.length;
    this.distH.disabled = this.distV.disabled = ids.length < 3;

    const visivel = this.app.ui.busca !== false;
    this.caixaBusca.hidden = !visivel;
    this.btBusca.hidden = visivel;
  }

  alternarBusca(v) {
    this.app.ui.busca = v;
    this.app.salvarUI();
    this.render();
    if (v) this.entrada.focus();
  }

  focarBusca() {
    this.app.ui.barraFerr = true;
    this.app.render();
    if (this.app.ui.busca === false) this.alternarBusca(true);
    this.entrada.focus();
    this.entrada.select();
  }

  // ---------- dica de desfazer/refazer ----------
  dica(bt, lado) {
    const { itens, cursor } = this.app.n.historico();
    const ev = lado < 0 ? itens[cursor - 1] : itens[cursor];
    const titulo = lado < 0 ? "Desfazer" : "Refazer";
    this.esconderDica();
    const r = bt.getBoundingClientRect();
    this.elDica = h("div", { class: "dica", role: "tooltip" },
      h("b", {}, ev ? `${titulo}: ${ev.texto}` : lado < 0 ? "Nada para desfazer" : "Nada para refazer"),
      ev ? `${titulo === "Desfazer" ? "Ctrl+Z" : "Ctrl+Y"} · segure para escolher um ponto` : "");
    this.elDica.style.left = `${r.left}px`;
    this.elDica.style.top = `${r.bottom + 6}px`;
    document.body.append(this.elDica);
  }
  esconderDica() {
    this.elDica?.remove();
    this.elDica = null;
  }

  // ---------- segurar o botão: lista "voltar até" ----------
  pressaoLonga(bt) {
    let t;
    let abriu = false;
    bt.addEventListener("pointerdown", () => {
      abriu = false;
      t = setTimeout(() => { abriu = true; this.listaVoltar(bt); }, 500);
    });
    const cancelar = () => clearTimeout(t);
    bt.addEventListener("pointerup", cancelar);
    bt.addEventListener("pointerleave", cancelar);
    bt.addEventListener("click", e => { if (abriu) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  }

  listaVoltar(bt) {
    this.esconderDica();
    const n = this.app.n;
    const { itens, cursor } = n.historico();
    const r = bt.getBoundingClientRect();
    const fechar = () => { lista.remove(); document.removeEventListener("pointerdown", fora, true); };
    const fora = e => { if (!lista.contains(e.target)) fechar(); };
    const linhas = [{ indice: 0, texto: "Início do projeto" }, ...itens].slice(-16).reverse();
    const lista = h("div", { class: "lista-hist", role: "menu" },
      h("header", {}, "Ir para"),
      linhas.map(it => h("button", {
        type: "button", role: "menuitem", class: `item ${it.indice === cursor ? "ativo atual" : ""} ${it.indice > cursor ? "futuro" : ""}`,
        onclick: () => { n.irPara(it.indice); fechar(); },
      }, h("span", { class: "item-meta num" }, String(it.indice).padStart(3, " ")), h("span", { class: "item-nome" }, it.texto))));
    lista.style.left = `${r.left}px`;
    lista.style.top = `${r.bottom + 6}px`;
    document.body.append(lista);
    setTimeout(() => document.addEventListener("pointerdown", fora, true));
  }

  // ---------- pesquisa ----------
  candidatos() {
    const app = this.app;
    const n = app.n;
    const q = this.entrada.value.trim().toLowerCase();
    const casa = s => !q || s.toLowerCase().includes(q);
    const elementos = n.elementos().filter(e => casa(`${e.nome} ${e.id} ${e.rotulo ?? ""} ${e.texto ?? ""}`)).slice(0, 8)
      .map(e => ({ grupo: "Elementos", rotulo: e.nome, meta: e.id, icone: CATALOGO[e.tipo]?.icone, fazer: () => n.selecionar(e.id) }));
    // comandos: os mesmos dos menus (uma fonte só), mais alguns atalhos de interface
    // sem texto: o que a pessoa usou por último e o que mais usa (a busca aprende com o uso)
    if (!q) {
      const reg = new Map(comandosDaInterface(app).map(c => [c.id, c]));
      const dos = (ids, grupo) => ids.map(i => reg.get(i)).filter(c => c && !c.desabilitado?.()).map(c => ({ grupo, rotulo: c.rotulo, icone: c.icone, meta: c.atalho ?? c.caminho.split(" › ")[0], fazer: () => { app.usou(c.id); c.acao(); } }));
      const rec = dos(app.recentes(5), "Recentes");
      const nomes = new Set(rec.map(c => c.rotulo));
      return [...rec, ...dos(app.maisUsados(8), "Mais usados").filter(c => !nomes.has(c.rotulo)).slice(0, 4)];
    }
    const pesoUso = new Map(app.maisUsados(40).map((id, i) => [id, 40 - i]));
    const comandos = [
      ...comandosDaInterface(app).filter(c => !c.desabilitado?.()).map(c => ({ rotulo: c.rotulo, icone: c.icone, meta: c.atalho ?? c.caminho.split(" › ")[0], fazer: c.acao, busca: `${c.rotulo} ${c.caminho}`, uso: pesoUso.get(c.id) ?? 0 })),
      ...Object.entries(TEMAS_UI).map(([k, t]) => ({ rotulo: `Tema da interface: ${t.nome}`, icone: "tema", fazer: () => app.definirTemaUI(k) })),
      { rotulo: "Menu: barra de menus clássica", icone: "lista", fazer: () => app.definirEstiloMenu("classico") },
      { rotulo: "Menu: faixa de opções", icone: "ferramentas", fazer: () => app.definirEstiloMenu("faixa") },
      ...["quadrado", "arredondado", "moderno"].map(f => ({ rotulo: `Formato ${f}`, icone: "contorno", fazer: () => app.definirFormato(f) })),
      { rotulo: "Biblioteca (modelos, fontes, ícones)", icone: "biblioteca", fazer: () => app.abrirPainelEsq("biblioteca") },
    ].filter(c => casa(c.busca ?? c.rotulo))
      .filter((c, i, l) => l.findIndex(x => x.rotulo === c.rotulo) === i)
      .sort((a, b) => (Number(!a.rotulo.toLowerCase().includes(q)) - Number(!b.rotulo.toLowerCase().includes(q))) || ((b.uso ?? 0) - (a.uso ?? 0)))
      .slice(0, 10).map(c => ({ ...c, grupo: "Comandos" }));
    return [...elementos, ...comandos];
  }

  buscar() {
    this.lista = this.candidatos();
    this.ativo = 0;
    this.desenharResultados();
  }

  desenharResultados() {
    const grupos = {};
    this.lista.forEach((c, i) => (grupos[c.grupo] ??= []).push([c, i]));
    this.resultados.replaceChildren(
      ...(this.lista.length ? [] : [h("div", { class: "painel-vazio", style: "padding:8px" }, "Nada encontrado.")]),
      ...Object.entries(grupos).flatMap(([g, cs]) => [
        h("div", { class: "res-grupo" }, g),
        ...cs.map(([c, i]) => h("button", {
          type: "button", role: "option", class: `res-item ${i === this.ativo ? "ativo" : ""}`,
          onclick: () => this.executar(c),
          html: `${icone(c.icone ?? "caixa", 16)}<span></span>${c.meta ? `<small class="num"></small>` : ""}`,
        })),
      ])
    );
    // textos via textContent (nomes vêm do usuário)
    const itens = [...this.resultados.querySelectorAll(".res-item")];
    itens.forEach((b, k) => {
      const c = this.lista[k];
      b.querySelector("span").textContent = c.rotulo;
      if (c.meta) b.querySelector("small").textContent = c.meta;
    });
    this.resultados.hidden = false;
  }

  teclaBusca(e) {
    if (!this.lista?.length) return;
    if (e.key === "ArrowDown") { this.ativo = (this.ativo + 1) % this.lista.length; this.desenharResultados(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { this.ativo = (this.ativo - 1 + this.lista.length) % this.lista.length; this.desenharResultados(); e.preventDefault(); }
    else if (e.key === "Enter") { this.executar(this.lista[this.ativo]); e.preventDefault(); }
    else if (e.key === "Escape") { this.resultados.hidden = true; this.entrada.blur(); }
  }

  executar(c) {
    this.resultados.hidden = true;
    this.entrada.value = "";
    this.entrada.blur();
    c.fazer();
  }
}
