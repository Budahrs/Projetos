// Importação de SVG sem DOM (roda no navegador e no Node): tokeniza as tags, resolve <g>/transform
// e devolve contornos em coordenadas do SVG. Gradientes, filtros, texto e <use> não são importados.
import { lerCaminho, transformar, elipseContornos, retanguloContornos } from "./vetor.js";

const MAT_ID = [1, 0, 0, 1, 0, 0];
const mult = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];

function lerTransform(s) {
  let m = MAT_ID;
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let r;
  while ((r = re.exec(s ?? ""))) {
    const a = r[2].split(/[\s,]+/).filter(Boolean).map(Number);
    if (a.some(v => !Number.isFinite(v))) continue;
    let t = MAT_ID;
    if (r[1] === "matrix" && a.length === 6) t = a;
    else if (r[1] === "translate") t = [1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0];
    else if (r[1] === "scale") t = [a[0] ?? 1, 0, 0, a[1] ?? a[0] ?? 1, 0, 0];
    else if (r[1] === "rotate") {
      const g = ((a[0] ?? 0) * Math.PI) / 180, c = Math.cos(g), sn = Math.sin(g), cx = a[1] ?? 0, cy = a[2] ?? 0;
      t = [c, sn, -sn, c, cx - c * cx + sn * cy, cy - sn * cx - c * cy];
    } else if (r[1] === "skewX") t = [1, 0, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 1, 0, 0];
    else if (r[1] === "skewY") t = [1, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0];
    m = mult(m, t);
  }
  return m;
}

function atributos(s) {
  const o = {};
  const re = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(s))) o[m[1]] = m[2] ?? m[3];
  if (o.style) for (const p of o.style.split(";")) { const [k, v] = p.split(":"); if (k && v !== undefined) o[k.trim()] = v.trim(); }
  return o;
}

const corOk = c => {
  if (c == null) return undefined;
  c = String(c).trim();
  if (!c || c === "none" || c === "transparent") return "none";
  if (/^currentcolor$/i.test(c)) return "#111827";
  if (/^url\(/i.test(c)) return "#9ca3af";
  if (/^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%/]+\)|hsla?\([\d\s.,%/deg]+\)|[a-z]{3,20})$/i.test(c)) return c;
  return undefined;
};
const nm = (v, r = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : r; };

/** { largura, altura, formas: [{ contornos, fill, stroke, sw, opacidade, nome }] } ou null se não houver nada. */
export function lerSVG(texto) {
  const src = String(texto ?? "").replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|defs|metadata|title|desc|mask|clipPath|filter|linearGradient|radialGradient|pattern|symbol)\b[\s\S]*?<\/\1>/gi, "");
  const raiz = src.match(/<svg\b([^>]*)>/i);
  if (!raiz) return null;
  const ra = atributos(raiz[1]);
  let vb = (ra.viewBox ?? "").split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some(v => !Number.isFinite(v))) vb = [0, 0, nm(ra.width, 100), nm(ra.height, 100)];
  const formas = [];
  const pilha = [{ m: lerTransform(ra.transform), h: { fill: "#000000", stroke: "none", sw: 1, op: 1 } }];
  const re = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
  let t, nomeN = 0;
  while ((t = re.exec(src))) {
    const [, fecha, tag, resto, auto] = t;
    const nome = tag.toLowerCase();
    if (nome === "svg") continue;
    if (fecha) { if (nome === "g" && pilha.length > 1) pilha.pop(); continue; }
    const a = atributos(resto);
    const topo = pilha.at(-1);
    const h = {
      fill: corOk(a.fill) ?? topo.h.fill, stroke: corOk(a.stroke) ?? topo.h.stroke,
      sw: a["stroke-width"] != null ? nm(a["stroke-width"], 1) : topo.h.sw,
      op: topo.h.op * (a.opacity != null ? nm(a.opacity, 1) : 1),
    };
    const m = mult(topo.m, lerTransform(a.transform));
    if (nome === "g") { if (!auto) pilha.push({ m, h }); continue; }
    let cs = null;
    if (nome === "path") cs = lerCaminho(a.d ?? "");
    else if (nome === "rect") {
      const w = nm(a.width), hh = nm(a.height), rx = nm(a.rx, nm(a.ry));
      if (w > 0 && hh > 0) cs = retanguloContornos(nm(a.x), nm(a.y), w, hh, [rx, rx, rx, rx].map(v => Math.min(v, w / 2, hh / 2)));
    } else if (nome === "circle") { const r = nm(a.r); if (r > 0) cs = elipseContornos(nm(a.cx) - r, nm(a.cy) - r, 2 * r, 2 * r); }
    else if (nome === "ellipse") { const rx = nm(a.rx), ry = nm(a.ry); if (rx > 0 && ry > 0) cs = elipseContornos(nm(a.cx) - rx, nm(a.cy) - ry, 2 * rx, 2 * ry); }
    else if (nome === "polygon" || nome === "polyline") {
      const p = (a.points ?? "").split(/[\s,]+/).filter(Boolean).map(Number);
      if (p.length >= 4 && p.every(Number.isFinite)) { const nos = []; for (let i = 0; i + 1 < p.length; i += 2) nos.push({ x: p[i], y: p[i + 1], a: null, b: null }); cs = [{ fechado: nome === "polygon", nos }]; }
    } else if (nome === "line") cs = [{ fechado: false, nos: [{ x: nm(a.x1), y: nm(a.y1), a: null, b: null }, { x: nm(a.x2), y: nm(a.y2), a: null, b: null }] }];
    if (!cs?.length) continue;
    cs = transformar(cs, (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]);
    const fill = nome === "line" || nome === "polyline" ? (corOk(a.fill) ?? "none") : h.fill;
    formas.push({ contornos: cs, fill, stroke: h.stroke, sw: h.sw, opacidade: Math.max(0, Math.min(1, h.op)), nome: a.id ? String(a.id).slice(0, 40) : `${nome} ${++nomeN}` });
    if (formas.length >= 500) break;
  }
  if (!formas.length) return null;
  return { x: vb[0], y: vb[1], largura: vb[2], altura: vb[3], formas };
}
