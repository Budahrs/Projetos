// Estilo avançado de formas, no espírito dos editores de design modernos:
//   preenchimentos  lista em camadas: sólido, gradiente linear/radial/cônico, imagem
//   tracos          lista de contornos: cor, largura, posição (dentro/centro/fora), tracejado, pontas e junções
//   efeitos         sombra, sombra interna, desfoque e vidro fosco (quantos quiser)
//   cantos          raio individual dos quatro cantos
//   mistura         modo de mistura (multiply, screen...)
// Tudo aqui é puro (sem DOM) e igual no editor, na Prévia e no HTML exportado.

const COR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%/-]+\)|hsla?\([\d\s.,%/deg-]+\)|transparent|currentcolor|[a-z]{3,20})$/i;
/** Aceita só cores; qualquer outra coisa vira o valor de reserva (nada de injeção de CSS pelo JSON). */
export const corSegura = (c, reserva = "#000000") => (typeof c === "string" && COR.test(c.trim()) ? c.trim() : reserva);
const num = (v, reserva = 0, min = -1e4, max = 1e4) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : reserva;
};

export const MODOS_MISTURA = [
  ["normal", "Normal"], ["multiply", "Multiplicar"], ["screen", "Tela"], ["overlay", "Sobrepor"], ["darken", "Escurecer"],
  ["lighten", "Clarear"], ["color-dodge", "Subexposição de cor"], ["color-burn", "Superexposição de cor"], ["hard-light", "Luz direta"],
  ["soft-light", "Luz suave"], ["difference", "Diferença"], ["exclusion", "Exclusão"], ["hue", "Matiz"], ["saturation", "Saturação"],
  ["color", "Cor"], ["luminosity", "Luminosidade"],
];
const MISTURAS = new Set(MODOS_MISTURA.map(m => m[0]));

// ------------------------------------------------------------ valores padrão
export const novoPreenchimento = (tipo = "solido", cor = "#4472c4") => ({
  tipo, visivel: true, opacidade: 1, cor, angulo: 90,
  paradas: tipo === "solido" ? [] : [{ pos: 0, cor, alfa: 1 }, { pos: 100, cor: "#9333ea", alfa: 1 }],
  ...(tipo === "imagem" ? { url: "", ajuste: "cobrir" } : {}),
});
export const novoTraco = (cor = "#1f2937") => ({ visivel: true, cor, largura: 2, posicao: "dentro", estilo: "solido", ponta: "reta", juncao: "reta" });
export const novoEfeito = (tipo = "sombra") => ({
  tipo, visivel: true, x: 0, y: 4, blur: tipo === "desfoque" || tipo === "vidro" ? 8 : 12, espalhar: 0, cor: "#00000040",
});

export const PRESETS_GRADIENTE = {
  "Pôr do sol": ["#f97316", "#ec4899"], "Oceano": ["#06b6d4", "#2563eb"], "Floresta": ["#22c55e", "#065f46"],
  "Violeta": ["#8b5cf6", "#ec4899"], "Grafite": ["#475569", "#0f172a"], "Aurora": ["#34d399", "#3b82f6", "#a855f7"],
  "Ouro": ["#fde68a", "#f59e0b"], "Gelo": ["#e0f2fe", "#7dd3fc"],
};
export const gradientePreset = (nome, tipo = "linear", angulo = 135) => {
  const cores = PRESETS_GRADIENTE[nome] ?? PRESETS_GRADIENTE.Oceano;
  return { ...novoPreenchimento(tipo, cores[0]), angulo, paradas: cores.map((cor, i) => ({ pos: Math.round(i * 100 / (cores.length - 1)), cor, alfa: 1 })) };
};

// ------------------------------------------------------------ cores com alfa
/** "#rrggbb" + alfa → "rgba(...)" (cores que não são hex passam como estão). */
export function comAlfa(cor, alfa = 1) {
  const c = corSegura(cor);
  const a = num(alfa, 1, 0, 1);
  if (a >= 1) return c;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (!m) return c;
  const h = m[1].length === 3 ? [...m[1]].map(x => x + x).join("") : m[1];
  const n = parseInt(h, 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${+a.toFixed(3)})`;
}

const paradas = f => {
  const p = (f.paradas?.length ? f.paradas : [{ pos: 0, cor: f.cor, alfa: 1 }, { pos: 100, cor: f.cor, alfa: 1 }])
    .map(s => ({ pos: num(s.pos, 0, 0, 100), cor: comAlfa(s.cor, s.alfa ?? 1) }))
    .sort((a, b) => a.pos - b.pos);
  return p.map(s => `${s.cor} ${s.pos}%`).join(",");
};

/** Um preenchimento como valor de `background-image`/`background` (CSS). */
export function preenchimentoCSS(f) {
  const op = num(f.opacidade, 1, 0, 1);
  if (f.tipo === "linear") return `linear-gradient(${num(f.angulo, 90, -720, 720)}deg,${paradas(f)})`;
  if (f.tipo === "radial") return `radial-gradient(circle at ${num(f.cx, 50, 0, 100)}% ${num(f.cy, 50, 0, 100)}%,${paradas(f)})`;
  if (f.tipo === "conico") return `conic-gradient(from ${num(f.angulo, 0, -720, 720)}deg at ${num(f.cx, 50, 0, 100)}% ${num(f.cy, 50, 0, 100)}%,${paradas(f)})`;
  if (f.tipo === "imagem") {
    const u = typeof f.url === "string" && /^(data:image\/(png|jpe?g|webp|gif|svg\+xml)|https?:)/i.test(f.url) ? f.url.replace(/["()\\]/g, encodeURIComponent) : "";
    if (u && f.ajuste === "recortar") return `url("${u}") ${num(f.posX, 50, 0, 100)}% ${num(f.posY, 50, 0, 100)}%/${num(f.zoom, 100, 10, 500)}% auto no-repeat`;
    return u ? `url("${u}") center/${{ cobrir: "cover", conter: "contain", esticar: "100% 100%" }[f.ajuste] ?? "cover"} no-repeat` : "none";
  }
  const c = comAlfa(f.cor, op);
  return `linear-gradient(${c},${c})`;
}

/** Camadas de preenchimento → `background` completo. O primeiro item da lista fica por cima (como nos editores). */
export function fundoCSS(fills, reserva = "transparent") {
  const vis = (fills ?? []).filter(f => f && f.visivel !== false);
  if (!vis.length) return reserva;
  return vis.map(f => {
    const css = preenchimentoCSS(f);
    // opacidade da camada nos gradientes: aplica via mistura no alfa das paradas
    if (f.tipo !== "solido" && f.tipo !== "imagem" && num(f.opacidade, 1, 0, 1) < 1) {
      const g = { ...f, paradas: (f.paradas ?? []).map(s => ({ ...s, alfa: (s.alfa ?? 1) * num(f.opacidade, 1, 0, 1) })) };
      return preenchimentoCSS(g);
    }
    return css;
  }).join(",");
}

// ------------------------------------------------------------ traços, cantos, efeitos
const DASH = { solido: "", tracejado: "6 4", pontilhado: "1 4" };
export const dashDe = t => (t.estilo === "personalizado" && typeof t.dash === "string" ? t.dash.replace(/[^\d. ]/g, "").trim() : DASH[t.estilo] ?? "");

/**
 * Traços de uma caixa (CSS): o contorno vira `border` (se tracejado) ou anéis de box-shadow.
 * Devolve { border, sombras[] }.
 */
export function tracosBox(tracos) {
  const vis = (tracos ?? []).filter(t => t && t.visivel !== false && num(t.largura, 0, 0, 200) > 0);
  const sombras = [];
  let border = "";
  for (const t of vis) {
    const w = num(t.largura, 1, 0, 200), cor = corSegura(t.cor, "#000");
    if (!border && (t.estilo === "tracejado" || t.estilo === "pontilhado") && t.posicao !== "fora") {
      border = `${w}px ${t.estilo === "pontilhado" ? "dotted" : "dashed"} ${cor}`;
    } else if (t.posicao === "fora") sombras.push(`0 0 0 ${w}px ${cor}`);
    else if (t.posicao === "centro") { sombras.push(`inset 0 0 0 ${w / 2}px ${cor}`); sombras.push(`0 0 0 ${w / 2}px ${cor}`); }
    else sombras.push(`inset 0 0 0 ${w}px ${cor}`);
  }
  return { border, sombras };
}

/** border-radius de quatro cantos: [topo-esq, topo-dir, base-dir, base-esq]. */
export function cantosCSS(cantos, raio = 0) {
  if (!Array.isArray(cantos) || cantos.length !== 4) return `${num(raio, 0, 0, 9999)}px`;
  return cantos.map(c => `${num(c, 0, 0, 9999)}px`).join(" ");
}

/** Efeitos → { sombras[] (box-shadow), filtro (filter), vidro (backdrop-filter), dropShadows[] (para formas SVG), internas[] }. */
export function efeitosCSS(efeitos) {
  const r = { sombras: [], dropShadows: [], internas: [], filtro: "", vidro: "" };
  for (const e of efeitos ?? []) {
    if (!e || e.visivel === false) continue;
    const x = num(e.x, 0, -500, 500), y = num(e.y, 0, -500, 500), b = num(e.blur, 0, 0, 500), s = num(e.espalhar, 0, -500, 500), cor = corSegura(e.cor, "#00000040");
    if (e.tipo === "sombra") { r.sombras.push(`${x}px ${y}px ${b}px ${s}px ${cor}`); r.dropShadows.push(`drop-shadow(${x}px ${y}px ${b / 2}px ${cor})`); }
    else if (e.tipo === "sombraInterna") { r.sombras.push(`inset ${x}px ${y}px ${b}px ${s}px ${cor}`); r.internas.push({ x, y, b, cor }); }
    else if (e.tipo === "desfoque") r.filtro += ` blur(${b}px)`;
    else if (e.tipo === "vidro") r.vidro += ` blur(${b}px)`;
  }
  r.filtro = r.filtro.trim(); r.vidro = r.vidro.trim();
  return r;
}

export const misturaCSS = m => (MISTURAS.has(m) && m !== "normal" ? m : "");

/** Este elemento usa o estilo avançado? (se não, o renderizador usa os campos simples como sempre) */
export const temAvancado = s => !!(s && ((s.preenchimentos && s.preenchimentos.length) || (s.tracos && s.tracos.length) || (s.efeitos && s.efeitos.length) || (Array.isArray(s.cantos) && s.cantos.length === 4) || misturaCSS(s.mistura)));

// ------------------------------------------------------------ formas paramétricas
const r2 = n => +n.toFixed(2);

/** Polígono regular de n lados dentro do viewBox 0..100, com cantos arredondados opcionais (raio em % do tamanho). */
export function caminhoPoligono(lados = 6, canto = 0, giro = 0) {
  const n = Math.round(num(lados, 6, 3, 60));
  const pts = [...Array(n)].map((_, i) => { const a = ((i / n) * 360 - 90 + num(giro, 0, -360, 360)) * Math.PI / 180; return [50 + 50 * Math.cos(a), 50 + 50 * Math.sin(a)]; });
  return caminhoArredondado(ajustarAoQuadro(pts), num(canto, 0, 0, 50));
}

/** Estrela de n pontas; `razao` é o raio interno / externo (0.1 a 0.95). */
export function caminhoEstrela(pontas = 5, razao = 0.45, canto = 0, giro = 0) {
  const n = Math.round(num(pontas, 5, 3, 60)), rz = num(razao, 0.45, 0.1, 0.95);
  const pts = [...Array(n * 2)].map((_, i) => {
    const a = ((i / (n * 2)) * 360 - 90 + num(giro, 0, -360, 360)) * Math.PI / 180, r = i % 2 ? 50 * rz : 50;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  });
  return caminhoArredondado(ajustarAoQuadro(pts), num(canto, 0, 0, 50));
}

/** Arco/anel: de `inicio` a `fim` (graus, 0 = topo) com `espessura` em % do raio (100 = fatia cheia). */
export function caminhoArco(inicio = 0, fim = 270, espessura = 30) {
  const a0 = num(inicio, 0, -360, 720), a1 = num(fim, 270, -360, 720);
  let varre = a1 - a0;
  if (Math.abs(varre) >= 359.99) varre = 359.99;
  const e = num(espessura, 30, 1, 100);
  const rin = 50 - 50 * (e / 100);
  const pt = (r, a) => { const rad = (a - 90) * Math.PI / 180; return [50 + r * Math.cos(rad), 50 + r * Math.sin(rad)]; };
  const [x0, y0] = pt(50, a0), [x1, y1] = pt(50, a0 + varre), [x2, y2] = pt(rin, a0 + varre), [x3, y3] = pt(rin, a0);
  const grande = Math.abs(varre) > 180 ? 1 : 0, sentido = varre >= 0 ? 1 : 0;
  if (e >= 99.5) return `M50 50L${r2(x0)} ${r2(y0)}A50 50 0 ${grande} ${sentido} ${r2(x1)} ${r2(y1)}Z`;
  return `M${r2(x0)} ${r2(y0)}A50 50 0 ${grande} ${sentido} ${r2(x1)} ${r2(y1)}L${r2(x2)} ${r2(y2)}A${r2(rin)} ${r2(rin)} 0 ${grande} ${1 - sentido} ${r2(x3)} ${r2(y3)}Z`;
}

/** Reenquadra os pontos para ocupar todo o 0..100 (o polígono/estrela estica com o elemento, como as outras formas). */
function ajustarAoQuadro(pts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = x1 - x0 || 1, h = y1 - y0 || 1;
  return pts.map(([x, y]) => [((x - x0) / w) * 100, ((y - y0) / h) * 100]);
}

/** Liga os pontos com cantos arredondados por curvas (raio proporcional ao menor lado adjacente). */
function caminhoArredondado(pts, canto) {
  const n = pts.length;
  if (!canto) return `M${pts.map(p => `${r2(p[0])} ${r2(p[1])}`).join("L")}Z`;
  const k = canto / 50; // 0..1 do meio do lado
  let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const a = [p1[0] + (p0[0] - p1[0]) * k * 0.5, p1[1] + (p0[1] - p1[1]) * k * 0.5];
    const b = [p1[0] + (p2[0] - p1[0]) * k * 0.5, p1[1] + (p2[1] - p1[1]) * k * 0.5];
    d += `${i ? "L" : "M"}${r2(a[0])} ${r2(a[1])}Q${r2(p1[0])} ${r2(p1[1])} ${r2(b[0])} ${r2(b[1])}`;
  }
  return d + "Z";
}

/** Caminho (viewBox 0..100) de uma forma, resolvendo as paramétricas e o vetor livre. `base` é o catálogo FORMAS. */
export function caminhoDaForma(el, base) {
  if (el.forma === "poligono") return { d: caminhoPoligono(el.lados, el.canto, el.giro) };
  if (el.forma === "estrela") return { d: caminhoEstrela(el.lados, el.razao, el.canto, el.giro) };
  if (el.forma === "arco") return { d: caminhoArco(el.inicio, el.fim, el.espessura) };
  if (el.forma === "vetor" && typeof el.caminho === "string" && el.caminho.trim()) return { d: el.caminho.replace(/[^MmLlHhVvCcSsQqTtAaZz0-9eE.,\s-]/g, ""), evenodd: !!el.evenodd };
  const f = base[el.forma] ?? base.retangulo;
  return { d: f.d, evenodd: f.evenodd };
}

// ------------------------------------------------------------ validação (agente, importação)
const TIPOS_F = new Set(["solido", "linear", "radial", "conico", "imagem"]);
const TIPOS_E = new Set(["sombra", "sombraInterna", "desfoque", "vidro"]);
const pick = (v, ok, reserva) => (ok.includes(v) ? v : reserva);
const lista = (v, max = 12) => {
  if (typeof v === "string") { try { v = JSON.parse(v); } catch { throw new Error("precisa ser uma lista (JSON)"); } }
  if (!Array.isArray(v)) throw new Error("precisa ser uma lista");
  return v.slice(0, max).filter(x => x && typeof x === "object");
};

export function limparPreenchimentos(v) {
  return lista(v).map(f => {
    const tipo = TIPOS_F.has(f.tipo) ? f.tipo : "solido";
    const o = { tipo, visivel: f.visivel !== false, opacidade: num(f.opacidade, 1, 0, 1), cor: corSegura(f.cor, "#4472c4"), angulo: num(f.angulo, tipo === "linear" ? 90 : 0, -720, 720) };
    if (tipo !== "solido" && tipo !== "imagem") {
      o.paradas = (Array.isArray(f.paradas) && f.paradas.length >= 2 ? f.paradas : [{ pos: 0, cor: o.cor }, { pos: 100, cor: "#9333ea" }]).slice(0, 12)
        .map(p => ({ pos: num(p.pos, 0, 0, 100), cor: corSegura(p.cor, "#000000"), alfa: num(p.alfa, 1, 0, 1) }));
      if (tipo !== "linear") { o.cx = num(f.cx, 50, 0, 100); o.cy = num(f.cy, 50, 0, 100); }
    }
    if (tipo === "imagem") { o.url = typeof f.url === "string" ? f.url.slice(0, 2_000_000) : ""; o.ajuste = pick(f.ajuste, ["cobrir", "conter", "esticar", "recortar"], "cobrir"); if (o.ajuste === "recortar") { o.zoom = num(f.zoom, 100, 10, 500); o.posX = num(f.posX, 50, 0, 100); o.posY = num(f.posY, 50, 0, 100); } }
    return o;
  });
}
export function limparTracos(v) {
  return lista(v).map(t => ({
    visivel: t.visivel !== false, cor: corSegura(t.cor, "#1f2937"), largura: num(t.largura, 1, 0, 200),
    posicao: pick(t.posicao, ["dentro", "centro", "fora"], "dentro"), estilo: pick(t.estilo, ["solido", "tracejado", "pontilhado"], "solido"),
    ponta: pick(t.ponta, ["reta", "redonda", "quadrada"], "reta"), juncao: pick(t.juncao, ["reta", "redonda", "chanfrada"], "reta"),
  }));
}
export function limparEfeitos(v) {
  return lista(v).map(e => ({
    tipo: TIPOS_E.has(e.tipo) ? e.tipo : "sombra", visivel: e.visivel !== false, x: num(e.x, 0, -500, 500), y: num(e.y, 4, -500, 500),
    blur: num(e.blur, 8, 0, 500), espalhar: num(e.espalhar, 0, -500, 500), cor: corSegura(e.cor, "#00000040"),
  }));
}
export function limparCantos(v) {
  if (v === null || v === "" || (Array.isArray(v) && !v.length)) return undefined;
  if (typeof v === "string") v = v.split(/[ ,]+/).map(Number);
  if (typeof v === "number") v = [v, v, v, v];
  if (!Array.isArray(v) || v.length !== 4) throw new Error("cantos precisa de 4 números: [topo-esquerda, topo-direita, base-direita, base-esquerda]");
  return v.map(c => num(c, 0, 0, 9999));
}
