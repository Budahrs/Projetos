// Containers inteligentes. Um elemento com `pai` pertence a um container; containers
// em modo "linha" ou "coluna" arrumam os filhos sozinhos (espaço, margem, alinhamento)
// e podem abraçar o conteúdo. Roda como recálculo derivado dentro da transação da
// skill: o que o container controla (posição dos filhos, tamanho abraçado) não é
// decisão do usuário e por isso não vira "regressão".

export const MODOS_LAYOUT = [["livre", "Livre (posição manual)"], ["linha", "Em linha (horizontal)"], ["coluna", "Em coluna (vertical)"]];
export const ALINHAR_LAYOUT = [["inicio", "Início"], ["centro", "Centro"], ["fim", "Fim"], ["esticar", "Esticar"]];
export const JUSTIFICAR_LAYOUT = [["inicio", "Juntos no início"], ["centro", "Juntos no centro"], ["fim", "Juntos no fim"], ["entre", "Espaço igual entre eles"]];

const auto = el => el?.tipo === "container" && (el.layout?.modo === "linha" || el.layout?.modo === "coluna");

/** Filhos diretos de um container, na ordem visual do eixo principal. */
export function filhosDe(elementos, id) {
  const pai = elementos[id];
  const eixo = pai?.layout?.modo === "linha" ? "x" : "y";
  return Object.entries(elementos)
    .filter(([k, e]) => k !== "__canvas" && !k.startsWith("__") && e.pai === id)
    .sort(([, a], [, b]) => (a[eixo] - b[eixo]) || ((a.z ?? 0) - (b.z ?? 0)))
    .map(([k]) => k);
}

/** Todos os descendentes (filhos, netos…). */
export function descendentes(elementos, id, vistos = new Set()) {
  const out = [];
  for (const f of filhosDe(elementos, id)) {
    if (vistos.has(f)) continue;
    vistos.add(f);
    out.push(f, ...descendentes(elementos, f, vistos));
  }
  return out;
}

function profundidade(elementos, id) {
  let p = 0;
  let atual = elementos[id]?.pai;
  const vistos = new Set([id]);
  while (atual && elementos[atual] && !vistos.has(atual)) { vistos.add(atual); p++; atual = elementos[atual].pai; }
  return p;
}

function deslocar(elementos, id, dx, dy) {
  for (const d of descendentes(elementos, id)) {
    elementos[d].x = Math.round(elementos[d].x + dx);
    elementos[d].y = Math.round(elementos[d].y + dy);
  }
}

const dim = (e, eixo) => e.dimensao?.[eixo] ?? "fixa";

/** Arruma um container (só os filhos diretos; netos acompanham o filho que se move).
 *  Igual ao flexbox do HTML exportado: espaço, margem, alinhar, distribuir e "preencher". */
function arrumar(elementos, id, comTamanho) {
  const c = elementos[id];
  const l = c.layout ?? {};
  const linha = l.modo === "linha";
  const [P, C] = linha ? ["largura", "altura"] : ["altura", "largura"]; // eixo principal / cruzado
  const esp = Number(l.espaco ?? 8);
  const m = Number(l.margem ?? 12);
  const abracar = l.abracar !== false;
  const filhos = filhosDe(elementos, id).filter(f => elementos[f].visivel !== false);
  const enche = f => !abracar && dim(elementos[f], P) === "preencher";
  if (comTamanho && abracar && filhos.length) {
    const principal = filhos.reduce((s, f) => s + elementos[f][P], 0) + esp * (filhos.length - 1) + 2 * m;
    const cruzado = l.alinhar === "esticar" ? c[C] : Math.max(...filhos.filter(f => dim(elementos[f], C) !== "preencher").map(f => elementos[f][C]), 0) + 2 * m;
    c[P] = Math.round(principal);
    c[C] = Math.round(Math.max(cruzado, 2 * m + 4));
  }
  // preencher: o que sobra no eixo principal é dividido igualmente
  const fixos = filhos.filter(f => !enche(f)).reduce((s, f) => s + elementos[f][P], 0);
  const cheios = filhos.filter(enche);
  const livre = c[P] - 2 * m - esp * Math.max(0, filhos.length - 1) - fixos;
  if (cheios.length) for (const f of cheios) elementos[f][P] = Math.max(8, Math.round(livre / cheios.length));
  const ocupado = filhos.reduce((s, f) => s + elementos[f][P], 0) + esp * Math.max(0, filhos.length - 1);
  const sobra = Math.max(0, c[P] - 2 * m - ocupado);
  const j = cheios.length ? "inicio" : l.justificar ?? "inicio";
  const extra = j === "entre" && filhos.length > 1 ? sobra / (filhos.length - 1) : 0;
  let cursor = (linha ? c.x : c.y) + m + (j === "centro" ? sobra / 2 : j === "fim" ? sobra : 0);
  for (const f of filhos) {
    const e = elementos[f];
    const [x0, y0] = [e.x, e.y];
    const espacoCruz = c[C] - 2 * m;
    if (l.alinhar === "esticar" || dim(e, C) === "preencher") e[C] = Math.max(4, Math.round(espacoCruz));
    const offCruz = l.alinhar === "centro" ? (espacoCruz - e[C]) / 2 : l.alinhar === "fim" ? espacoCruz - e[C] : 0;
    if (linha) { e.x = Math.round(cursor); e.y = Math.round(c.y + m + offCruz); }
    else { e.y = Math.round(cursor); e.x = Math.round(c.x + m + offCruz); }
    cursor += e[P] + esp + extra;
    if (e.x !== x0 || e.y !== y0) deslocar(elementos, f, e.x - x0, e.y - y0);
  }
}

/** Recalcula todos os containers automáticos do documento. Limpa `pai` inválido. */
export function aplicarLayouts(doc) {
  const els = doc.elementos;
  for (const [k, e] of Object.entries(els)) {
    if (!e || typeof e !== "object" || k.startsWith("__")) continue;
    if ("pai" in e && (!e.pai || !els[e.pai] || els[e.pai].tipo !== "container" || e.pai === k)) delete e.pai;
  }
  // ciclos: um container não pode estar dentro de si mesmo
  for (const k of Object.keys(els)) {
    const vistos = new Set([k]);
    let a = els[k]?.pai;
    while (a) { if (vistos.has(a)) { delete els[k].pai; break; } vistos.add(a); a = els[a]?.pai; }
  }
  const conts = Object.keys(els).filter(k => auto(els[k]));
  if (!conts.length) return;
  // de dentro para fora: tamanhos (abraçar) dependem dos filhos
  const porProf = conts.map(k => [k, profundidade(els, k)]);
  for (const [k] of [...porProf].sort((a, b) => b[1] - a[1])) arrumar(els, k, true);
  // de fora para dentro: posições finais
  for (const [k] of [...porProf].sort((a, b) => a[1] - b[1])) arrumar(els, k, false);
}

/** Pares (alvo, propriedade) que os containers controlam — não são decisões do usuário. */
export function controladosPorLayout(elementos) {
  const out = [];
  for (const [k, e] of Object.entries(elementos)) {
    if (k.startsWith("__") || !e) continue;
    const pai = elementos[e.pai];
    if (auto(pai)) {
      const [P, C] = pai.layout.modo === "linha" ? ["largura", "altura"] : ["altura", "largura"];
      out.push([k, "x"], [k, "y"]);
      if (pai.layout.alinhar === "esticar" || dim(e, C) === "preencher") out.push([k, C]);
      if (pai.layout.abracar === false && dim(e, P) === "preencher") out.push([k, P]);
    }
    if (auto(e) && e.layout.abracar !== false) out.push([k, "largura"], [k, "altura"]);
  }
  return out;
}
