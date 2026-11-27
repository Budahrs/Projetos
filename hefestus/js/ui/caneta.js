// Caneta vetorial e edição de nós, desenhadas numa camada SVG por cima do palco (px de tela = px do documento × zoom).
//  Caneta:  clique = vértice reto · arraste = curva suave · clique no 1º ponto fecha · Enter/duplo clique termina
//           Backspace apaga o último ponto · Esc termina (ou cancela se só há 1 ponto)
//  Nós:     arraste nós e alças · clique na linha insere um nó · duplo clique no nó alterna reto/suave
//           Delete apaga o nó · Alt segura a alça sem espelhar a oposta · Enter/Esc/clique fora saem
import { maisProximo, inserirNo, alternarSuave, clonarContornos } from "../nucleo/vetor.js";

const NS = "http://www.w3.org/2000/svg";
function sv(tag, attrs = {}, ...filhos) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  e.append(...filhos);
  return e;
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export class Caneta {
  constructor(area) {
    this.area = area;
    this.pena = null;      // { nos, cursor }
    this.edicao = null;    // { id, cs, sel: {c,i} | null }
    this.ultimoClique = null;
  }
  get n() { return this.area.n; }
  get app() { return this.area.app; }
  get z() { return this.area.zoom; }
  get ativa() { return !!(this.pena || this.edicao); }

  // ------------------------------------------------------------ caneta
  pressionar(e) {
    const p = this.area.ponto(e);
    const q = [this.area.encaixar(p.x), this.area.encaixar(p.y)];
    if (!this.pena) this.pena = { nos: [], cursor: q };
    const nos = this.pena.nos;
    const agora = performance.now();
    const ult = this.ultimoClique;
    this.ultimoClique = { t: agora, p: q };
    if (ult && agora - ult.t < 350 && dist(ult.p, q) * this.z < 6 && nos.length >= 2) { // duplo clique: termina sem repetir o ponto
      if (nos.length > 2 && dist([nos.at(-1).x, nos.at(-1).y], q) * this.z < 6) nos.pop();
      return this.finalizar(false);
    }
    if (nos.length >= 2 && dist([nos[0].x, nos[0].y], q) * this.z < 9) { this.finalizar(true); return; }
    nos.push({ x: q[0], y: q[1], a: null, b: null });
    this.area.gesto = { tipo: "caneta", no: nos.at(-1), x0: e.clientX, y0: e.clientY };
    this.desenhar();
  }

  arrastar(e) {
    const g = this.area.gesto, p = this.area.ponto(e), no = g.no;
    if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 3) return;
    no.b = [p.x, p.y];
    no.a = [2 * no.x - p.x, 2 * no.y - p.y];
    this.desenhar();
  }

  cursor(e) {
    if (!this.pena) return;
    const p = this.area.ponto(e);
    this.pena.cursor = [this.area.encaixar(p.x), this.area.encaixar(p.y)];
    this.desenhar();
  }

  apagarUltimo() {
    if (!this.pena) return;
    this.pena.nos.pop();
    if (!this.pena.nos.length) this.cancelar(); else this.desenhar();
  }

  finalizar(fechado = false) {
    const nos = this.pena?.nos ?? [];
    this.pena = null;
    this.limparOverlay();
    if (nos.length < 2) { this.app.setFerramenta("selecao"); return null; }
    const id = this.n.criarVetor([{ fechado, nos }], { aberto: !fechado, texto: fechado ? "Desenhar forma com a caneta" : "Desenhar linha com a caneta" });
    this.app.setFerramenta("selecao");
    if (id) this.app.mensagem("Vetor criado. Dê dois cliques nele (ou Enter) para editar os nós.");
    return id;
  }

  cancelar() {
    this.pena = null;
    this.limparOverlay();
    this.app.setFerramenta("selecao");
  }

  // ------------------------------------------------------------ edição de nós
  editar(id) {
    const cs = this.n.contornosDoVetor(id);
    if (!cs) return false;
    this.edicao = { id, cs: clonarContornos(cs), sel: null };
    this.n.selecionar(id);
    this.area.render();
    this.app.mensagem("Editando nós: arraste nós e alças · clique na linha para inserir · duplo clique no nó alterna reto/suave · Delete apaga · Enter sai");
    return true;
  }

  sair() {
    if (!this.edicao) return;
    this.edicao = null;
    this.limparOverlay();
    this.area.render();
  }

  apagarNo() {
    const ed = this.edicao;
    if (!ed?.sel) return false;
    const c = ed.cs[ed.sel.c];
    if (c.nos.length <= (c.fechado ? 3 : 2)) { this.app.mensagem("Um caminho precisa de mais nós; apague o elemento inteiro se quiser removê-lo.", "alerta"); return true; }
    c.nos.splice(ed.sel.i, 1);
    ed.sel = null;
    this.gravar("Apagar nó");
    return true;
  }

  gravar(texto = "Editar nós") {
    const ed = this.edicao;
    if (!ed) return;
    this.n.definirVetor(ed.id, ed.cs, texto);
    ed.cs = clonarContornos(this.n.contornosDoVetor(ed.id) ?? ed.cs);
    this.desenhar();
  }

  iniciarArraste(e, alvo) {
    e.preventDefault();
    e.stopPropagation();
    const ed = this.edicao;
    ed.sel = { c: alvo.c, i: alvo.i };
    const no = ed.cs[alvo.c].nos[alvo.i];
    this.area.gesto = {
      tipo: "no", alvo, alt: e.altKey, x0: e.clientX, y0: e.clientY, movido: false,
      orig: { x: no.x, y: no.y, a: no.a && [...no.a], b: no.b && [...no.b] },
      op: alvo.k === "a" || alvo.k === "b" ? (alvo.k === "a" ? no.b && Math.hypot(no.b[0] - no.x, no.b[1] - no.y) : no.a && Math.hypot(no.a[0] - no.x, no.a[1] - no.y)) : null,
    };
    this.desenhar();
  }

  mover(e) {
    const g = this.area.gesto, ed = this.edicao;
    if (!ed) return;
    g.movido = g.movido || Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > 3;
    if (!g.movido) return;
    const p = this.area.ponto(e), no = ed.cs[g.alvo.c].nos[g.alvo.i], k = g.alvo.k;
    if (k === "no") {
      const nx = this.area.encaixar(p.x), ny = this.area.encaixar(p.y);
      const mx = nx - g.orig.x, my = ny - g.orig.y;
      no.x = nx; no.y = ny;
      if (g.orig.a) no.a = [g.orig.a[0] + mx, g.orig.a[1] + my];
      if (g.orig.b) no.b = [g.orig.b[0] + mx, g.orig.b[1] + my];
    } else {
      const [px, py] = [p.x, p.y];
      no[k] = [px, py];
      const outro = k === "a" ? "b" : "a";
      if (!e.altKey && no[outro]) { // alças opostas colineares, mantendo o comprimento da outra
        const vx = no.x - px, vy = no.y - py, l = Math.hypot(vx, vy) || 1;
        const len = g.op ?? Math.hypot(no[outro][0] - no.x, no[outro][1] - no.y);
        no[outro] = [no.x + (vx / l) * len, no.y + (vy / l) * len];
      }
    }
    this.desenhar();
  }

  soltar(g) {
    if (g?.movido) this.gravar("Mover nó");
  }

  clicarLinha(e) {
    e.preventDefault();
    e.stopPropagation();
    const ed = this.edicao, p = this.area.ponto(e);
    let melhor = null;
    ed.cs.forEach((c, ci) => { const m = maisProximo(c, p.x, p.y); if (m && (!melhor || m.dist < melhor.m.dist)) melhor = { m, ci }; });
    if (!melhor) return;
    const c = ed.cs[melhor.ci];
    inserirNo(c, melhor.m.seg, melhor.m.t);
    const idx = melhor.m.seg + 1;
    ed.sel = { c: melhor.ci, i: idx };
    this.gravar("Inserir nó");
  }

  alternarNo(alvo) {
    const ed = this.edicao;
    alternarSuave(ed.cs[alvo.c], alvo.i);
    ed.sel = { c: alvo.c, i: alvo.i };
    this.gravar("Alternar nó reto/suave");
  }

  // ------------------------------------------------------------ desenho da camada
  limparOverlay() { this.area.palco?.querySelector(".vet-ov")?.remove(); }

  /** Chamado a cada render do Designer e a cada movimento. */
  desenhar() {
    const palco = this.area.palco;
    if (!palco) return;
    this.limparOverlay();
    if (!this.pena && !this.edicao) return;
    const z = this.z, t = this.n.tela;
    const svg = sv("svg", { class: "vet-ov", width: t.largura * z, height: t.altura * z, viewBox: `0 0 ${t.largura * z} ${t.altura * z}` });
    const S = ([x, y]) => `${(x * z).toFixed(1)} ${(y * z).toFixed(1)}`;
    const trilha = (c, extra) => {
      const nos = c.nos, n = nos.length;
      let d = `M${S([nos[0].x, nos[0].y])}`;
      const seg = (p, q) => { if (p.b || q.a) d += `C${S(p.b ?? [p.x, p.y])} ${S(q.a ?? [q.x, q.y])} ${S([q.x, q.y])}`; else d += `L${S([q.x, q.y])}`; };
      for (let i = 1; i < n; i++) seg(nos[i - 1], nos[i]);
      if (c.fechado) { seg(nos[n - 1], nos[0]); d += "Z"; }
      if (extra) d += extra;
      return d;
    };
    if (this.pena) {
      const { nos, cursor } = this.pena;
      if (nos.length) {
        const ult = nos.at(-1);
        const prev = { nos: [...nos, { x: cursor[0], y: cursor[1], a: null, b: null }], fechado: false };
        svg.append(sv("path", { class: "vet-linha", d: trilha(prev) }));
        const pri = nos[0];
        if (nos.length >= 2) svg.append(sv("circle", { class: "vet-fecha", cx: pri.x * z, cy: pri.y * z, r: 8 }));
        nos.forEach(no => {
          if (no.b) svg.append(sv("line", { class: "vet-alca-l", x1: no.x * z, y1: no.y * z, x2: no.b[0] * z, y2: no.b[1] * z }), sv("line", { class: "vet-alca-l", x1: no.x * z, y1: no.y * z, x2: no.a[0] * z, y2: no.a[1] * z }), sv("circle", { class: "vet-alca", cx: no.b[0] * z, cy: no.b[1] * z, r: 3.5 }), sv("circle", { class: "vet-alca", cx: no.a[0] * z, cy: no.a[1] * z, r: 3.5 }));
          svg.append(sv("rect", { class: `vet-no ${no === ult ? "sel" : ""}`, x: no.x * z - 4, y: no.y * z - 4, width: 8, height: 8 }));
        });
      }
    } else {
      const ed = this.edicao;
      ed.cs.forEach((c, ci) => {
        svg.append(sv("path", { class: "vet-linha", d: trilha(c) }));
        const caminho = sv("path", { class: "vet-hit", d: trilha(c) });
        caminho.addEventListener("pointerdown", e => this.clicarLinha(e));
        svg.append(caminho);
      });
      ed.cs.forEach((c, ci) => c.nos.forEach((no, i) => {
        const sel = ed.sel && ed.sel.c === ci && ed.sel.i === i;
        if (sel) for (const k of ["a", "b"]) if (no[k]) {
          svg.append(sv("line", { class: "vet-alca-l", x1: no.x * z, y1: no.y * z, x2: no[k][0] * z, y2: no[k][1] * z }));
          const al = sv("circle", { class: "vet-alca", cx: no[k][0] * z, cy: no[k][1] * z, r: 4.5 });
          al.addEventListener("pointerdown", e => this.iniciarArraste(e, { c: ci, i, k }));
          svg.append(al);
        }
        const r = sv("rect", { class: `vet-no ${sel ? "sel" : ""} ${no.a || no.b ? "suave" : ""}`, x: no.x * z - 4.5, y: no.y * z - 4.5, width: 9, height: 9, rx: no.a || no.b ? 5 : 0 });
        r.addEventListener("pointerdown", e => this.iniciarArraste(e, { c: ci, i, k: "no" }));
        r.addEventListener("dblclick", e => { e.stopPropagation(); this.alternarNo({ c: ci, i }); });
        svg.append(r);
      }));
    }
    palco.append(svg);
  }
}

