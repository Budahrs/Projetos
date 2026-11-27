// ============================================================
// Vetores: caminhos SVG editáveis (nós + alças de Bézier) e operações booleanas.
// Tudo puro (sem DOM), em coordenadas livres; quem chama decide o espaço (viewBox 0..100 ou px do documento).
//
// Contorno = { fechado, nos: [{ x, y, a: [x,y]|null, b: [x,y]|null }] }
//   a = alça de entrada (absoluta), b = alça de saída (absoluta). Sem alça = vértice reto.
// Escrito aqui (sem biblioteca externa): o booleano trabalha sobre os contornos achatados em polilinhas.
// ============================================================

const K = 0.5522847498; // círculo por 4 Béziers
const r2 = n => +(+n).toFixed(2);
const num = v => (Number.isFinite(+v) ? +v : 0);

// ------------------------------------------------------------ leitura do "d"
function tokens(d) {
  const t = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
  let m;
  while ((m = re.exec(String(d)))) t.push(m[1] ?? parseFloat(m[2]));
  return t;
}

/** Arco SVG → Béziers cúbicas (conversão padrão ponto-final → centro). Devolve [[c1x,c1y,c2x,c2y,x,y],...] */
function arcoParaCurvas(x0, y0, rx, ry, rot, grande, varre, x, y) {
  if (!rx || !ry || (x0 === x && y0 === y)) return [[x0, y0, x, y, x, y]];
  rx = Math.abs(rx); ry = Math.abs(ry);
  const fi = (rot * Math.PI) / 180, cf = Math.cos(fi), sf = Math.sin(fi);
  const dx = (x0 - x) / 2, dy = (y0 - y) / 2;
  const x1 = cf * dx + sf * dy, y1 = -sf * dx + cf * dy;
  const lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s; }
  const num_ = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const co = (grande === varre ? -1 : 1) * Math.sqrt(Math.max(0, num_ / (den || 1)));
  const cx1 = (co * rx * y1) / ry, cy1 = (-co * ry * x1) / rx;
  const cx = cf * cx1 - sf * cy1 + (x0 + x) / 2, cy = sf * cx1 + cf * cy1 + (y0 + y) / 2;
  const ang = (ux, uy, vx, vy) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
  const t1 = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let dt = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!varre && dt > 0) dt -= 2 * Math.PI;
  if (varre && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
  const passo = dt / n, k = (4 / 3) * Math.tan(passo / 4), saida = [];
  const pt = (a, ex, ey) => [cf * rx * ex - sf * ry * ey + cx, sf * rx * ex + cf * ry * ey + cy];
  for (let i = 0; i < n; i++) {
    const a0 = t1 + i * passo, a1 = a0 + passo;
    const p1 = pt(a0, Math.cos(a0) - k * Math.sin(a0), Math.sin(a0) + k * Math.cos(a0));
    const p2 = pt(a1, Math.cos(a1) + k * Math.sin(a1), Math.sin(a1) - k * Math.cos(a1));
    const p3 = pt(a1, Math.cos(a1), Math.sin(a1));
    saida.push([p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]]);
  }
  return saida;
}

/** Lê um "d" SVG (M L H V C S Q T A Z, absolutos e relativos) e devolve os contornos. */
export function lerCaminho(d) {
  const t = tokens(d);
  const contornos = [];
  let c = null, i = 0, cmd = "", cx = 0, cy = 0, sx = 0, sy = 0, ultC2 = null, ultQ = null;
  const nova = (x, y) => { c = { fechado: false, nos: [{ x, y, a: null, b: null }] }; contornos.push(c); cx = sx = x; cy = sy = y; };
  const reta = (x, y) => { c.nos.push({ x, y, a: null, b: null }); cx = x; cy = y; };
  const curva = (x1, y1, x2, y2, x, y) => {
    const ant = c.nos[c.nos.length - 1];
    ant.b = [x1, y1];
    c.nos.push({ x, y, a: [x2, y2], b: null });
    cx = x; cy = y; ultC2 = [x2, y2];
  };
  const n = () => (typeof t[i] === "number" ? t[i++] : NaN);
  let guarda = 0;
  while (i < t.length && guarda++ < 200000) {
    if (typeof t[i] === "string") cmd = t[i++];
    else if (!cmd) break;
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const ox = rel ? cx : 0, oy = rel ? cy : 0;
    if (C === "Z") { if (c) { c.fechado = true; cx = sx; cy = sy; const f = c.nos[0], u = c.nos[c.nos.length - 1]; if (c.nos.length > 1 && Math.abs(f.x - u.x) < 1e-6 && Math.abs(f.y - u.y) < 1e-6) { f.a = u.a; c.nos.pop(); } } ultC2 = ultQ = null; cmd = ""; continue; }
    if (C === "M") { const x = n() + ox, y = n() + oy; if (!Number.isFinite(x + y)) break; nova(x, y); cmd = rel ? "l" : "L"; ultC2 = ultQ = null; continue; }
    if (!c) { nova(cx, cy); }
    if (c.fechado) { nova(cx, cy); }
    if (C === "L") { const x = n() + ox, y = n() + oy; if (!Number.isFinite(x + y)) break; reta(x, y); ultC2 = ultQ = null; }
    else if (C === "H") { const x = n() + ox; if (!Number.isFinite(x)) break; reta(x, cy); ultC2 = ultQ = null; }
    else if (C === "V") { const y = n() + oy; if (!Number.isFinite(y)) break; reta(cx, y); ultC2 = ultQ = null; }
    else if (C === "C") { const a = [n() + ox, n() + oy, n() + ox, n() + oy, n() + ox, n() + oy]; if (a.some(v => !Number.isFinite(v))) break; curva(...a); ultQ = null; }
    else if (C === "S") { const a = [n() + ox, n() + oy, n() + ox, n() + oy]; if (a.some(v => !Number.isFinite(v))) break; const r = ultC2 ? [2 * cx - ultC2[0], 2 * cy - ultC2[1]] : [cx, cy]; curva(r[0], r[1], a[0], a[1], a[2], a[3]); ultQ = null; }
    else if (C === "Q" || C === "T") {
      let qx, qy;
      if (C === "Q") { qx = n() + ox; qy = n() + oy; } else { qx = ultQ ? 2 * cx - ultQ[0] : cx; qy = ultQ ? 2 * cy - ultQ[1] : cy; }
      const x = n() + ox, y = n() + oy;
      if (![qx, qy, x, y].every(Number.isFinite)) break;
      curva(cx + (2 / 3) * (qx - cx), cy + (2 / 3) * (qy - cy), x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), x, y);
      ultQ = [qx, qy]; ultC2 = null;
    } else if (C === "A") {
      const rx = n(), ry = n(), rot = n(), g = n(), v = n(), x = n() + ox, y = n() + oy;
      if (![rx, ry, rot, g, v, x, y].every(Number.isFinite)) break;
      for (const k of arcoParaCurvas(cx, cy, rx, ry, rot, !!g, !!v, x, y)) curva(...k);
      ultQ = null;
    } else break;
  }
  return contornos.filter(k => k.nos.length > 1 || k.fechado);
}

// ------------------------------------------------------------ escrita
export function escreverCaminho(contornos) {
  let d = "";
  for (const c of contornos) {
    const ns = c.nos;
    if (!ns.length) continue;
    d += `M${r2(ns[0].x)} ${r2(ns[0].y)}`;
    const seg = (p, q) => {
      if (p.b || q.a) { const b = p.b ?? [p.x, p.y], a = q.a ?? [q.x, q.y]; d += `C${r2(b[0])} ${r2(b[1])} ${r2(a[0])} ${r2(a[1])} ${r2(q.x)} ${r2(q.y)}`; }
      else d += `L${r2(q.x)} ${r2(q.y)}`;
    };
    for (let i = 1; i < ns.length; i++) seg(ns[i - 1], ns[i]);
    if (c.fechado) { if (ns.length > 1 && (ns[ns.length - 1].b || ns[0].a)) seg(ns[ns.length - 1], ns[0]); d += "Z"; }
  }
  return d;
}

// ------------------------------------------------------------ geometria
export const clonarContornos = cs => cs.map(c => ({ fechado: c.fechado, nos: c.nos.map(n => ({ x: n.x, y: n.y, a: n.a ? [...n.a] : null, b: n.b ? [...n.b] : null })) }));

/** Aplica uma transformação (x,y)→[x',y'] em nós e alças. */
export function transformar(contornos, fn) {
  return contornos.map(c => ({
    fechado: c.fechado,
    nos: c.nos.map(n => { const p = fn(n.x, n.y); return { x: p[0], y: p[1], a: n.a ? fn(...n.a) : null, b: n.b ? fn(...n.b) : null }; }),
  }));
}

function cubica(p0, p1, p2, p3, t) {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** Segmentos de um contorno: [{p0,p1,p2,p3,reta}] */
export function segmentos(c) {
  const ns = c.nos, out = [], n = ns.length, fim = c.fechado ? n : n - 1;
  for (let i = 0; i < fim; i++) {
    const p = ns[i], q = ns[(i + 1) % n];
    out.push({ p0: [p.x, p.y], p1: p.b ?? [p.x, p.y], p2: q.a ?? [q.x, q.y], p3: [q.x, q.y], reta: !p.b && !q.a, de: i, para: (i + 1) % n });
  }
  return out;
}

/** Achata um contorno em polilinha. `tol` ≈ distância entre pontos em unidades de quem chama. */
export function achatar(c, tol = 4) {
  const pts = [];
  for (const s of segmentos(c)) {
    if (!pts.length) pts.push(s.p0);
    if (s.reta) { pts.push(s.p3); continue; }
    const comp = Math.hypot(s.p1[0] - s.p0[0], s.p1[1] - s.p0[1]) + Math.hypot(s.p2[0] - s.p1[0], s.p2[1] - s.p1[1]) + Math.hypot(s.p3[0] - s.p2[0], s.p3[1] - s.p2[1]);
    const n = Math.min(64, Math.max(6, Math.ceil(comp / tol)));
    for (let k = 1; k <= n; k++) pts.push(cubica(s.p0, s.p1, s.p2, s.p3, k / n));
  }
  if (c.fechado && pts.length > 1) { const a = pts[0], b = pts[pts.length - 1]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-9) pts.pop(); }
  return pts;
}

export function limitesDe(contornos, tol = 1) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of contornos) for (const [x, y] of achatar(c, tol)) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (!Number.isFinite(x0)) return null;
  return { x: x0, y: y0, largura: x1 - x0, altura: y1 - y0 };
}

/** Distância de um ponto ao contorno + posição (segmento e t) do ponto mais próximo — para inserir nós. */
export function maisProximo(c, px, py) {
  let melhor = null;
  segmentos(c).forEach((s, idx) => {
    const n = s.reta ? 1 : 40;
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n;
      const a = s.reta ? s.p0 : cubica(s.p0, s.p1, s.p2, s.p3, t0), b = s.reta ? s.p3 : cubica(s.p0, s.p1, s.p2, s.p3, t1);
      const vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy || 1e-12;
      const u = Math.max(0, Math.min(1, ((px - a[0]) * vx + (py - a[1]) * vy) / l2));
      const dist = Math.hypot(px - (a[0] + u * vx), py - (a[1] + u * vy));
      if (!melhor || dist < melhor.dist) melhor = { dist, seg: idx, t: t0 + (t1 - t0) * u };
    }
  });
  return melhor;
}

/** Insere um nó no segmento `seg` (índice de segmentos(c)) em t, preservando a forma (de Casteljau). */
export function inserirNo(c, seg, t) {
  const s = segmentos(c)[seg];
  if (!s) return c;
  const ns = c.nos, i = s.de, j = s.para;
  let novo;
  if (s.reta) {
    novo = { x: s.p0[0] + (s.p3[0] - s.p0[0]) * t, y: s.p0[1] + (s.p3[1] - s.p0[1]) * t, a: null, b: null };
  } else {
    const L = (a, b) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const p01 = L(s.p0, s.p1), p12 = L(s.p1, s.p2), p23 = L(s.p2, s.p3), p012 = L(p01, p12), p123 = L(p12, p23), m = L(p012, p123);
    ns[i].b = p01; ns[j].a = p23;
    novo = { x: m[0], y: m[1], a: p012, b: p123 };
  }
  ns.splice(i + 1, 0, novo);
  return c;
}

/** Alterna vértice reto ↔ suave (alças simétricas na direção dos vizinhos). */
export function alternarSuave(c, i) {
  const ns = c.nos, n = ns.length, p = ns[i];
  if (p.a || p.b) { p.a = p.b = null; return; }
  const ant = ns[(i - 1 + n) % n], prox = ns[(i + 1) % n];
  const dx = prox.x - ant.x, dy = prox.y - ant.y, l = Math.hypot(dx, dy) || 1;
  const k = Math.min(Math.hypot(p.x - ant.x, p.y - ant.y), Math.hypot(prox.x - p.x, prox.y - p.y)) / 3;
  p.a = [p.x - (dx / l) * k, p.y - (dy / l) * k];
  p.b = [p.x + (dx / l) * k, p.y + (dy / l) * k];
}

// ------------------------------------------------------------ elementos → contornos (px do documento)
export const elipseContornos = (x, y, w, h) => {
  const rx = w / 2, ry = h / 2, cx = x + rx, cy = y + ry;
  return [{ fechado: true, nos: [
    { x: cx, y: y, a: [cx - rx * K, y], b: [cx + rx * K, y] },
    { x: x + w, y: cy, a: [x + w, cy - ry * K], b: [x + w, cy + ry * K] },
    { x: cx, y: y + h, a: [cx + rx * K, y + h], b: [cx - rx * K, y + h] },
    { x: x, y: cy, a: [x, cy + ry * K], b: [x, cy - ry * K] },
  ] }];
};

/** Retângulo com raios [tl,tr,br,bl]. */
export function retanguloContornos(x, y, w, h, raios = [0, 0, 0, 0]) {
  const max = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = raios.map(r => Math.max(0, Math.min(num(r), max)));
  const nos = [];
  const cant = (px, py, r, dx1, dy1, dx2, dy2) => {
    // canto com entrada em (px+dx1*r, py+dy1*r) e saída em (px+dx2*r, py+dy2*r)
    if (!r) { nos.push({ x: px, y: py, a: null, b: null }); return; }
    const e = { x: px + dx1 * r, y: py + dy1 * r }, s = { x: px + dx2 * r, y: py + dy2 * r };
    nos.push({ x: e.x, y: e.y, a: null, b: [e.x - dx1 * r * K, e.y - dy1 * r * K] });
    nos.push({ x: s.x, y: s.y, a: [s.x - dx2 * r * K, s.y - dy2 * r * K], b: null });
  };
  cant(x, y, tl, 0, 1, 1, 0);
  cant(x + w, y, tr, -1, 0, 0, 1);
  cant(x + w, y + h, br, 0, -1, -1, 0);
  cant(x, y + h, bl, 1, 0, 0, -1);
  return [{ fechado: true, nos }];
}

// ------------------------------------------------------------ booleanas
const EPS = 1e-7;
const cruza = (ax, ay, bx, by) => ax * by - ay * bx;

function arestas(polis) {
  const out = [];
  for (const poli of polis) {
    const p = poli.filter((q, i) => { const r = poli[(i + 1) % poli.length]; return Math.hypot(q[0] - r[0], q[1] - r[1]) > 1e-9; });
    for (let i = 0; i < p.length; i++) out.push([p[i], p[(i + 1) % p.length]]);
  }
  return out;
}

function dentro(polis, x, y) {
  let c = false;
  for (const poli of polis) {
    for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
      const a = poli[i], b = poli[j];
      if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
    }
  }
  return c;
}

function noBordo(arest, x, y, tol) {
  for (const [a, b] of arest) {
    const vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy;
    if (!l2) continue;
    const u = Math.max(0, Math.min(1, ((x - a[0]) * vx + (y - a[1]) * vy) / l2));
    if (Math.hypot(x - (a[0] + u * vx), y - (a[1] + u * vy)) < tol) return true;
  }
  return false;
}

/** Parte cada aresta nos cruzamentos com as arestas do outro conjunto. */
function dividir(A, B) {
  return A.map(([a, b]) => {
    const ts = [0, 1];
    const rx = b[0] - a[0], ry = b[1] - a[1], l2 = rx * rx + ry * ry;
    const minx = Math.min(a[0], b[0]) - EPS, maxx = Math.max(a[0], b[0]) + EPS, miny = Math.min(a[1], b[1]) - EPS, maxy = Math.max(a[1], b[1]) + EPS;
    for (const [c, d] of B) {
      if (Math.max(c[0], d[0]) < minx || Math.min(c[0], d[0]) > maxx || Math.max(c[1], d[1]) < miny || Math.min(c[1], d[1]) > maxy) continue;
      const sx = d[0] - c[0], sy = d[1] - c[1], den = cruza(rx, ry, sx, sy);
      if (Math.abs(den) < 1e-12 * (Math.sqrt(l2) * Math.hypot(sx, sy) || 1)) {
        // paralelas: se colineares, projeta os extremos do outro
        if (Math.abs(cruza(c[0] - a[0], c[1] - a[1], rx, ry)) / (Math.sqrt(l2) || 1) < 1e-6) for (const q of [c, d]) { const t = ((q[0] - a[0]) * rx + (q[1] - a[1]) * ry) / l2; if (t > 0 && t < 1) ts.push(t); }
        continue;
      }
      const t = cruza(c[0] - a[0], c[1] - a[1], sx, sy) / den, u = cruza(c[0] - a[0], c[1] - a[1], rx, ry) / den;
      if (t > -1e-9 && t < 1 + 1e-9 && u > -1e-9 && u < 1 + 1e-9) ts.push(Math.min(1, Math.max(0, t)));
    }
    ts.sort((p, q) => p - q);
    const pts = [];
    for (const t of ts) { const p = [a[0] + rx * t, a[1] + ry * t]; const u = pts[pts.length - 1]; if (!u || Math.hypot(u[0] - p[0], u[1] - p[1]) > 1e-7) pts.push(p); }
    const subs = [];
    for (let i = 0; i + 1 < pts.length; i++) subs.push([pts[i], pts[i + 1]]);
    return subs;
  }).flat();
}

function costurar(segs) {
  const chave = p => `${Math.round(p[0] * 1e4)},${Math.round(p[1] * 1e4)}`;
  const adj = new Map();
  segs.forEach((s, i) => { for (const p of s) { const k = chave(p); if (!adj.has(k)) adj.set(k, []); adj.get(k).push(i); } });
  const usado = new Set(), loops = [];
  for (let i = 0; i < segs.length; i++) {
    if (usado.has(i)) continue;
    usado.add(i);
    const ini = chave(segs[i][0]);
    const loop = [segs[i][0]];
    let atual = segs[i][1], ok = false;
    for (let g = 0; g < segs.length + 2; g++) {
      const k = chave(atual);
      if (k === ini) { ok = true; break; }
      loop.push(atual);
      const prox = (adj.get(k) ?? []).find(j => !usado.has(j));
      if (prox === undefined) break;
      usado.add(prox);
      const s = segs[prox];
      atual = chave(s[0]) === k ? s[1] : s[0];
    }
    if (ok && loop.length >= 3) loops.push(loop);
  }
  return loops;
}

function limpar(loop) {
  // remove colineares e repetidos
  let p = loop.slice();
  let mudou = true;
  while (mudou && p.length > 3) {
    mudou = false;
    for (let i = 0; i < p.length; i++) {
      const a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length];
      const cr = Math.abs(cruza(b[0] - a[0], b[1] - a[1], c[0] - b[0], c[1] - b[1]));
      if (cr < 1e-6 * (Math.hypot(b[0] - a[0], b[1] - a[1]) + Math.hypot(c[0] - b[0], c[1] - b[1]))) { p.splice(i, 1); mudou = true; break; }
    }
  }
  return p;
}

const caixa = polis => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of polis) for (const [x, y] of p) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };

/**
 * Booleana entre dois conjuntos de contornos (A = base, B = outro).
 * op: "unir" | "subtrair" | "intersectar" | "excluir". Devolve contornos (preenchimento par-ímpar).
 * Excluir e formas que não se tocam preservam as curvas originais; o resto sai em polilinhas finas.
 */
export function booleana(contA, contB, op, tol = 2) {
  const fecha = cs => cs.filter(c => c.nos.length >= 3).map(c => ({ ...c, fechado: true }));
  const cA = fecha(contA), cB = fecha(contB);
  if (op === "excluir") return clonarContornos([...cA, ...cB]);
  const PA = cA.map(c => achatar(c, tol)), PB = cB.map(c => achatar(c, tol));
  const bA = caixa(PA), bB = caixa(PB);
  const sep = bA[2] < bB[0] || bB[2] < bA[0] || bA[3] < bB[1] || bB[3] < bA[1];
  if (sep) return op === "unir" ? clonarContornos([...cA, ...cB]) : op === "subtrair" ? clonarContornos(cA) : [];
  const tam = Math.max(bA[2] - bA[0], bA[3] - bA[1], bB[2] - bB[0], bB[3] - bB[1], 1);
  const tolB = tam * 1e-6, delta = tam * 1e-4;
  const EA = arestas(PA), EB = arestas(PB);
  const sA = dividir(EA, EB), sB = dividir(EB, EA);
  const manter = [];
  const classe = (seg, outro, arOutro, proprio, arProprio) => {
    const mx = (seg[0][0] + seg[1][0]) / 2, my = (seg[0][1] + seg[1][1]) / 2;
    if (noBordo(arOutro, mx, my, tolB)) {
      const vx = seg[1][0] - seg[0][0], vy = seg[1][1] - seg[0][1], l = Math.hypot(vx, vy) || 1;
      const px = mx - (vy / l) * delta, py = my + (vx / l) * delta;
      return dentro(proprio, px, py) === dentro(outro, px, py) ? "mesmo" : "oposto";
    }
    return dentro(outro, mx, my) ? "dentro" : "fora";
  };
  for (const s of sA) {
    const c = classe(s, PB, EB, PA, EA);
    if (c === "fora" && op !== "intersectar") manter.push(s);
    else if (c === "dentro" && op === "intersectar") manter.push(s);
    else if (c === "mesmo" && (op === "unir" || op === "intersectar")) manter.push(s);
    else if (c === "oposto" && op === "subtrair") manter.push(s);
  }
  for (const s of sB) {
    const c = classe(s, PA, EA, PB, EB);
    if (c === "mesmo" || c === "oposto") continue; // a cópia de A já decidiu
    if (c === "fora" && op === "unir") manter.push(s);
    else if (c === "dentro" && (op === "intersectar" || op === "subtrair")) manter.push(s);
  }
  const loops = costurar(manter).map(limpar).filter(l => l.length >= 3);
  const poli = loops.map(l => ({ fechado: true, nos: l.map(p => ({ x: p[0], y: p[1], a: null, b: null })) }));
  return ajustarCurvas(poli, Math.max(tam * 2e-3, 0.15));
}

// ------------------------------------------------------------ ajuste de curvas (Schneider)
// A booleana trabalha em polilinhas; aqui os trechos suaves voltam a ser Béziers (menos nós, curvas de verdade).
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const norma = a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
const esc = (a, k) => [a[0] * k, a[1] * k];
const soma = (a, b) => [a[0] + b[0], a[1] + b[1]];

function gerarBezier(pts, u, t1, t2) {
  const n = pts.length, p0 = pts[0], p3 = pts[n - 1];
  let c00 = 0, c01 = 0, c11 = 0, x0 = 0, x1 = 0;
  for (let i = 0; i < n; i++) {
    const t = u[i], m = 1 - t;
    const b0 = m * m * m, b1 = 3 * m * m * t, b2 = 3 * m * t * t, b3 = t * t * t;
    const A1 = esc(t1, b1), A2 = esc(t2, b2);
    c00 += dot(A1, A1); c01 += dot(A1, A2); c11 += dot(A2, A2);
    const tmp = sub(pts[i], soma(esc(p0, b0 + b1), esc(p3, b2 + b3)));
    x0 += dot(A1, tmp); x1 += dot(A2, tmp);
  }
  const det = c00 * c11 - c01 * c01;
  const seg = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]);
  let al = Math.abs(det) > 1e-12 ? (x0 * c11 - x1 * c01) / det : 0, ar = Math.abs(det) > 1e-12 ? (c00 * x1 - c01 * x0) / det : 0;
  if (al < 1e-6 * seg || ar < 1e-6 * seg || !Number.isFinite(al + ar)) al = ar = seg / 3;
  return [p0, soma(p0, esc(t1, al)), soma(p3, esc(t2, ar)), p3];
}
const bezPt = (b, t) => cubica(b[0], b[1], b[2], b[3], t);
function bezDeriv(b, t) {
  const m = 1 - t;
  return [3 * m * m * (b[1][0] - b[0][0]) + 6 * m * t * (b[2][0] - b[1][0]) + 3 * t * t * (b[3][0] - b[2][0]),
    3 * m * m * (b[1][1] - b[0][1]) + 6 * m * t * (b[2][1] - b[1][1]) + 3 * t * t * (b[3][1] - b[2][1])];
}
function reparam(b, pts, u) {
  return u.map((t, i) => {
    const d = sub(bezPt(b, t), pts[i]), d1 = bezDeriv(b, t);
    const m = 1 - t, d2 = [6 * m * (b[2][0] - 2 * b[1][0] + b[0][0]) + 6 * t * (b[3][0] - 2 * b[2][0] + b[1][0]), 6 * m * (b[2][1] - 2 * b[1][1] + b[0][1]) + 6 * t * (b[3][1] - 2 * b[2][1] + b[1][1])];
    const num = dot(d, d1), den = dot(d1, d1) + dot(d, d2);
    return den ? Math.max(0, Math.min(1, t - num / den)) : t;
  });
}
function erroMax(b, pts, u) {
  let m = 0, k = Math.floor(pts.length / 2);
  for (let i = 1; i < pts.length - 1; i++) { const p = bezPt(b, u[i]), d = (p[0] - pts[i][0]) ** 2 + (p[1] - pts[i][1]) ** 2; if (d > m) { m = d; k = i; } }
  return [m, k];
}
function ajustar(pts, t1, t2, tol2, saida, prof = 0) {
  if (pts.length === 2) { saida.push([pts[0], pts[0], pts[1], pts[1]]); return; }
  const u = [0];
  for (let i = 1; i < pts.length; i++) u.push(u[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = u[u.length - 1] || 1; for (let i = 0; i < u.length; i++) u[i] /= L;
  let b = gerarBezier(pts, u, t1, t2), [e, k] = erroMax(b, pts, u);
  if (e < tol2) { saida.push(b); return; }
  if (e < tol2 * 16) for (let it = 0; it < 4; it++) { const u2 = reparam(b, pts, u); b = gerarBezier(pts, u2, t1, t2); [e, k] = erroMax(b, pts, u2); if (e < tol2) { saida.push(b); return; } for (let i = 0; i < u.length; i++) u[i] = u2[i]; }
  if (prof > 12) { saida.push(b); return; }
  const c = norma(sub(pts[k - 1], pts[k + 1]));
  ajustar(pts.slice(0, k + 1), t1, c, tol2, saida, prof + 1);
  ajustar(pts.slice(k), esc(c, -1), t2, tol2, saida, prof + 1);
}
const emReta = (pts, tol) => {
  const a = pts[0], b = pts[pts.length - 1], d = norma(sub(b, a));
  return pts.every(p => Math.abs((p[0] - a[0]) * d[1] - (p[1] - a[1]) * d[0]) <= tol);
};

/** Troca trechos suaves de polilinhas por Béziers. Quinas (viradas > `quina` graus) e trechos retos são mantidos. */
export function ajustarCurvas(contornos, tol = 0.3, quina = 38) {
  return contornos.map(c => {
    const P = achatar(c, 1e9).map((p, i) => p);
    const n = P.length;
    if (n < 5 || !c.fechado) return c;
    const virada = i => {
      const a = sub(P[i], P[(i - 1 + n) % n]), b = sub(P[(i + 1) % n], P[i]);
      const la = Math.hypot(...a), lb = Math.hypot(...b);
      if (!la || !lb) return 0;
      return (Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (la * lb)))) * 180) / Math.PI;
    };
    let quinas = [];
    const arest = i => Math.hypot(P[(i + 1) % n][0] - P[i][0], P[(i + 1) % n][1] - P[i][1]);
    for (let i = 0; i < n; i++) {
      const la = arest((i - 1 + n) % n), lb = arest(i);
      // quina de verdade, ou transição entre um trecho reto (aresta longa) e um curvo (arestas curtas)
      if (virada(i) > quina || Math.max(la, lb) > 4 * Math.min(la, lb)) quinas.push(i);
    }
    if (!quinas.length) {
      // sem quinas (círculo, elipse): quebra em dois pontos opostos
      quinas = [0, Math.floor(n / 2)];
    }
    const nos = [];
    for (let q = 0; q < quinas.length; q++) {
      const i0 = quinas[q], i1 = quinas[(q + 1) % quinas.length];
      const trecho = [];
      for (let i = i0; ; i = (i + 1) % n) { trecho.push(P[i]); if (i === i1 && trecho.length > 1) break; if (trecho.length > n + 1) break; }
      if (trecho.length < 2) continue;
      if (trecho.length === 2 || emReta(trecho, tol)) { nos.push({ x: trecho[0][0], y: trecho[0][1], a: null, b: null, reta: true }); continue; }
      // tangentes nas pontas olhando alguns pontos adiante
      const k = Math.min(3, trecho.length - 1);
      const t1 = norma(sub(trecho[k], trecho[0])), t2 = norma(sub(trecho[trecho.length - 1 - k], trecho[trecho.length - 1]));
      const segs = [];
      ajustar(trecho, t1, t2, tol * tol, segs);
      segs.forEach((b, j) => {
        nos.push({ x: b[0][0], y: b[0][1], a: null, b: b[1], _fim: b });
        void j;
      });
    }
    // monta alças de entrada a partir do segmento anterior
    const out = nos.map(o => ({ x: o.x, y: o.y, a: null, b: o.b && !o.reta ? o.b : null, _s: o._fim }));
    for (let i = 0; i < out.length; i++) {
      const ant = out[(i - 1 + out.length) % out.length];
      if (ant._s) out[i].a = ant._s[2];
    }
    // se o segmento seguinte é reto, o nó não pode ter alça de saída; já tratado (b nulo para retos)
    return { fechado: true, nos: out.map(({ x, y, a, b }) => ({ x, y, a, b })) };
  });
}
