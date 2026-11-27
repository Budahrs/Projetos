import {definirVisaoCodigo} from '../app/representacoesCodigo.js';
import {renderRepresentacoesCodigo} from './representacoesCodigo.js';
import { listaPreferenciaUI } from '../nucleo/preferenciasUI.js';
// Visual Script: estúdio de Visual Script. Projeto e paleta à esquerda, grafo no centro (com prévia ao
// vivo ao lado), inspetor à direita e depurador embaixo. Toda edição grava `__script` no
// documento por um comando do núcleo, então Voltar/Refazer e a recuperação valem aqui também.
import { componentesHephaestus } from './componentesHephaestus.js';
import { h, avisar, copiar } from "./dom.js";
import { icone } from "./icones.js";
import { ehVisual, NOS, TIPOS, CATEGORIAS, SINONIMOS, scriptVazio, grafoVazio, valoresPadrao, tipoPorta, compativel, validarScript, scriptParaRuntime, novoIdLocal } from "./../nucleo/visualScript.js";
import { gerarHTML } from "./../nucleo/compilador.js";
import { Formulario } from "./construtor.js";
import { CATALOGO } from "./../nucleo/catalogo.js";

const HEAD = 30, ROW = 24, PAD = 6, GRADE = 16, PASTA_L = 250, PASTA_A = 66;
const clonar = o => JSON.parse(JSON.stringify(o));
const CORES_GRUPO = [["#FFFFFF", "Branco"], ["#000000", "Preto"], ["#E7E6E6", "Cinza claro"], ["#44546A", "Ardósia"], ["#4472C4", "Azul"], ["#FFC000", "Âmbar"], ["#5B9BD5", "Azul claro"], ["#70AD47", "Verde"], ["#ED7D31", "Laranja"], ["#22b8cf", "Ciano"], ["#e5534b", "Vermelho"], ["#d94fd1", "Magenta"], ["#a371f7", "Roxo"], ["#84cc16", "Lima"]];
const TIPOS_PASTA = {
  geral: { nome: "Geral", cor: "#4472C4", dica: "Organização livre: qualquer nó" },
  funcao: { nome: "Código", cor: "#5B9BD5", dica: "Função real do objeto: abre e fecha outros menus, ferramentas, sinais e links" },
  visual: { nome: "Designer", cor: "#FFC000", dica: "Aparência: forma, cor, transições, efeitos e efeitos especiais" },
  eventos: { nome: "Eventos", cor: "#ED7D31", dica: "Gatilhos: cliques, teclas, início, temporizadores e sinais recebidos" },
  dados: { nome: "Dados", cor: "#70AD47", dica: "Variáveis, contas, textos e listas que o resto do grafo usa" },
  teste: { nome: "Teste", cor: "#44546A", dica: "Depuração: logs, pontos de parada e experimentos fora do fluxo final" },
};
/** Aceita o nome atual, o nome antigo (Visual/Função) e a chave interna. */
const tipoPastaDeNome = nome => {
  const n = String(nome ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (!n) return "geral";
  if (/^(visual|designer|design)$/.test(n)) return "visual";
  if (/^(funcao|codigo|code)$/.test(n)) return "funcao";
  for (const [k, t] of Object.entries(TIPOS_PASTA)) if (k === n || t.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === n) return k;
  return "geral";
};
const hexRgb = c => { let x = String(c ?? "").replace("#", ""); if (x.length === 3) x = [...x].map(d => d + d).join(""); const v = parseInt(x.slice(0, 6), 16); return Number.isFinite(v) ? [v >> 16 & 255, v >> 8 & 255, v & 255] : [128, 128, 128]; };
const misturar = (c, alvo, t) => { const a = hexRgb(c), b = hexRgb(alvo); return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
const luz = c => { const [r, g, b] = hexRgb(c).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
/** Ícone de pasta no modelo do Hephaestus: aba de trás mais clara, corpo arredondado e o selo do tipo no canto (escuro em pastas claras, branco nas escuras). */
function svgPasta(cor = "#FFC000", aberta = false, tipo = "geral", tam = 16) {
  const clara = luz(cor) > 0.42, sel = clara ? "#1f2733" : "#ffffff";
  const tras = luz(cor) < 0.02 ? "#5a5f68" : misturar(cor, "#ffffff", clara ? 0.55 : 0.32);
  const contorno = luz(cor) > 0.8 ? ` stroke="#00000033" stroke-width=".6"` : "";
  const frente = aberta
    ? `<path d="M4.4 9h17.4a1.4 1.4 0 0 1 1.33 1.8l-2.1 7a2 2 0 0 1-1.9 1.45H2.8a1.3 1.3 0 0 1-1.25-1.66l1.6-6.8A1.8 1.8 0 0 1 4.4 9z" fill="${cor}"${contorno}/>`
    : `<rect x="1" y="7.2" width="22" height="12.3" rx="2.4" fill="${cor}"${contorno}/>`;
  const o = aberta ? 0.6 : 0;
  const glifo = {
    funcao: `<g fill="none" stroke="${sel}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" transform="translate(${o} ${o})"><rect x="13.6" y="10.6" width="7.6" height="6.4" rx="1.1"/><path d="M13.6 12.3h7.6"/><path d="M15.9 13.6l-.9.9.9.9M18.9 13.6l.9.9-.9.9M17.8 13.4l-.8 2.4" stroke-width=".8"/></g>`,
    visual: `<g transform="translate(${o} ${o})"><path d="M17 10.4c-2.3 0-3.9 1.4-3.9 3.2s1.6 3.2 3.6 3.2c.7 0 1-.4.8-.9-.3-.6 0-1.1.7-1.1h.8a1.9 1.9 0 0 0 1.9-1.8c0-1.5-1.7-2.6-3.9-2.6z" fill="${sel}"/><circle cx="15.2" cy="13.2" r=".62" fill="${cor}"/><circle cx="16.7" cy="11.9" r=".62" fill="${cor}"/><circle cx="18.6" cy="12.2" r=".62" fill="${cor}"/><path d="M19.6 17.4l2.6-3.6" stroke="${sel}" stroke-width="1.15" stroke-linecap="round"/></g>`,
    eventos: `<path d="M18.4 10.2l-3.6 4.4h2.5l-1 3 3.7-4.5h-2.5z" fill="${sel}" transform="translate(${o} ${o})"/>`,
    dados: `<g fill="none" stroke="${sel}" stroke-width="1" transform="translate(${o} ${o})"><ellipse cx="17.6" cy="11.6" rx="3" ry="1.1"/><path d="M14.6 11.6v4.4c0 .6 1.3 1.1 3 1.1s3-.5 3-1.1v-4.4M14.6 13.8c0 .6 1.3 1.1 3 1.1s3-.5 3-1.1"/></g>`,
    teste: `<g fill="none" stroke="${sel}" stroke-width="1" stroke-linecap="round" transform="translate(${o} ${o})"><ellipse cx="17.6" cy="14.4" rx="2" ry="2.6" fill="${sel}"/><path d="M16.6 11.4l-.7-.9M18.6 11.4l.7-.9M15.6 13.6h-1.4M19.6 13.6h1.4M15.7 15.6l-1.2.8M19.5 15.6l1.2.8"/></g>`,
  }[tipo] ?? "";
  return `<svg width="${tam}" height="${Math.round(tam * 0.86)}" viewBox="0 0 24 20.6" aria-hidden="true"><path d="M1 4.2A2 2 0 0 1 3 2.2h5.4l2.2 2.2H21a2 2 0 0 1 2 2V10H1z" fill="${tras}"${contorno}/>${frente}${glifo}</svg>`;
}
const corGrupo = gr => gr.cor ?? TIPOS_PASTA[gr.tipo ?? "geral"].cor;
const CORES_NOTA = [["#f6d365", "Amarela"], ["#8ec5ff", "Azul"], ["#ffadd2", "Rosa"], ["#b5f0c6", "Verde"]];
const TIPOS_VAR = [["numero", "Número", "num", 0], ["texto", "Texto", "txt", ""], ["logico", "Lógico", "bool", false], ["elemento", "Elemento", "el", ""]];
const normal = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const SVG_NS = "http://www.w3.org/2000/svg";
const ESTILOS_FIO = [["curva", "Conector curvo"], ["suave", "Curvo suave"], ["reta", "Conector reto"], ["angulado", "Conector angulado"], ["ortogonal", "Angulado arredondado"], ["circuito", "Circuito 45°"], ["pendurado", "Pendurado"]];
const TRACOS_FIO = [["solido", "Sólido", ""], ["pontilhadoRedondo", "Pontilhado redondo", "0.01 2.6"], ["pontilhadoQuadrado", "Pontilhado quadrado", "1 1"], ["tracejadoCurto", "Tracejado curto", "3 1.6"], ["tracejado", "Tracejado", "5 2.4"], ["tracoPonto", "Traço-ponto", "5 2.4 1 2.4"], ["tracoLongo", "Traço longo", "9 3"], ["tracoLongoPonto", "Traço longo-ponto", "9 3 1 3"]];
const PONTAS_FIO = [["nenhuma", "Nenhuma", ""], ["seta", "Seta", "M0 0L-9 -4.5L-9 4.5Z"], ["aberta", "Seta aberta", "M-9 -4.5L0 0L-9 4.5"], ["furtiva", "Seta furtiva", "M0 0L-10 -5L-7 0L-10 5Z"], ["losango", "Losango", "M0 0L-5.5 -4L-11 0L-5.5 4Z"], ["oval", "Oval", "M0 0a4 4 0 1 0 -8 0a4 4 0 1 0 8 0Z"]];
const DOBRA_FIO = new Set(["curva", "angulado", "ortogonal", "circuito"]);
const RAIO_FIO = { curva: 34, suave: 40, pendurado: 40, ortogonal: 12, circuito: 6, angulado: 0, reta: 0 };
const dashFio = (traco, esp) => { const t = TRACOS_FIO.find(x => x[0] === traco); return t && t[2] ? t[2].split(" ").map(n => Math.max(0.01, Number(n) * esp).toFixed(2)).join(" ") : ""; };
const ANIMS_FIO = [["nenhuma", "Nenhuma"], ["unity", "Unity (ao rodar)"], ["fluxo", "Fluxo"], ["setas", "Setas"], ["pontos", "Pontos"], ["pacotes", "Pacotes"], ["pulso", "Pulso"], ["cometa", "Cometa"], ["particulas", "Partículas"], ["bidirecional", "Ida e volta"], ["respirar", "Respirar"], ["eletrico", "Elétrico"], ["arcoiris", "Arco-íris"]];
const ROTULOS_FIO = [["nenhum", "Nenhum"], ["atividade", "Atividade"], ["valores", "Valores"], ["latencia", "Latência"]];
const CORES_FIO = [["tipo", "Tipo de dado"], ["calor", "Mapa de calor"]];
/** Verde → âmbar → vermelho conforme a carga do enlace (como em mapas de rede). */
function corCalor(n) {
  const P = [[0, [46, 168, 107]], [0.5, [227, 160, 8]], [1, [229, 83, 75]]];
  n = Math.max(0, Math.min(1, n));
  const i = n <= 0.5 ? 0 : 1, [a, ca] = P[i], [b, cb] = P[i + 1], k = (n - a) / (b - a);
  return `rgb(${ca.map((v, j) => Math.round(v + (cb[j] - v) * k)).join(",")})`;
}
const fmtValor = v => { const t = typeof v === "string" ? `“${v}”` : typeof v === "number" ? String(Math.round(v * 1000) / 1000) : v === true ? "verdadeiro" : v === false ? "falso" : v == null ? "vazio" : String(v); return t.length > 22 ? t.slice(0, 21) + "…" : t; };
const QUAIS_FIO = [["todos", "Todas"], ["exec", "Execução"], ["dados", "Dados"], ["selecao", "Seleção"]];
const VELOCIDADES = [[60, "Lenta"], [140, "Normal"], [300, "Rápida"]];
/** Linha com cantos arredondados (traçados ortogonal e circuito). */
function cantos(pts, r) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [cx, cy] = pts[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    if (rr < 0.5) { d += ` L${bx} ${by}`; continue; }
    const p1x = bx - (bx - ax) / l1 * rr, p1y = by - (by - ay) / l1 * rr, p2x = bx + (cx - bx) / l2 * rr, p2y = by + (cy - by) / l2 * rr;
    d += ` L${p1x.toFixed(1)} ${p1y.toFixed(1)} Q${bx} ${by} ${p2x.toFixed(1)} ${p2y.toFixed(1)}`;
  }
  const u = pts[pts.length - 1];
  return `${d} L${u[0]} ${u[1]}`;
}
/** Pontos de uma curva cúbica (para testar colisão). */
function amostraCubica(p0, p1, p2, p3, n = 28) {
  const r = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    r.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
  }
  return r;
}
/**
 * Geometria de um fio da saída (x1,y1) até a entrada (x2,y2), como os conectores do PowerPoint.
 * `meio` (0..1) é a alça amarela: onde fica a dobra dos conectores angulados e curvos.
 * Devolve { d, pts, alca } — pts para colisão; alca = posição da alça de ajuste.
 */
function geoFio(x1, y1, x2, y2, estilo, meio) {
  const S = 22, temMeio = Number.isFinite(meio);
  if (estilo === "reta") return { d: `M${x1} ${y1} L${x2} ${y2}`, pts: [[x1, y1], [x2, y2]] };
  if (estilo === "ortogonal" || estilo === "circuito" || estilo === "angulado") {
    let pts, alca = null;
    if (x2 - x1 >= S * 2) {
      const k = temMeio ? meio : 0.5, mx = Math.round(x1 + (x2 - x1) * k), dx = x2 - x1 - S * 2, dy = Math.abs(y2 - y1);
      if (estilo === "circuito" && dy <= dx) {
        const ini = Math.max(x1 + S, Math.min(x2 - S - dy, mx - dy / 2));
        pts = [[x1, y1], [ini, y1], [ini + dy, y2], [x2, y2]];
      } else pts = [[x1, y1], [mx, y1], [mx, y2], [x2, y2]];
      alca = [mx, (y1 + y2) / 2];
    } else {
      // a entrada está atrás da saída: contorna por fora; a alça move a faixa horizontal do contorno
      const topo = Math.min(y1, y2) - 90, faixa = Math.abs(y2 - y1) + 180;
      const ym = temMeio ? topo + faixa * meio : (Math.abs(y2 - y1) > 60 ? (y1 + y2) / 2 : Math.max(y1, y2) + 50);
      pts = [[x1, y1], [x1 + S, y1], [x1 + S, ym], [x2 - S, ym], [x2 - S, y2], [x2, y2]];
      alca = [(x1 + x2) / 2, ym];
    }
    return { d: cantos(pts, RAIO_FIO[estilo]), pts, alca };
  }
  if (estilo === "curva" && temMeio) {
    // conector curvo do PowerPoint: duas curvas que se encontram na alça
    const xm = x1 + (x2 - x1) * meio, ym = (y1 + y2) / 2;
    const pts = [...amostraCubica([x1, y1], [xm, y1], [xm, y1], [xm, ym], 14), ...amostraCubica([xm, ym], [xm, y2], [xm, y2], [x2, y2], 14)];
    return { d: `M${x1} ${y1} Q${xm.toFixed(1)} ${y1} ${xm.toFixed(1)} ${ym.toFixed(1)} Q${xm.toFixed(1)} ${y2} ${x2} ${y2}`, pts, alca: [xm, ym] };
  }
  const suave = estilo === "suave";
  const dx = Math.max(suave ? 24 : 36, Math.abs(x2 - x1) * (suave ? 0.3 : 0.5)) + (x2 < x1 ? Math.min(120, (x1 - x2) * 0.25) : 0);
  let c1 = [x1 + dx, y1], c2 = [x2 - dx, y2];
  if (estilo === "pendurado") { const sag = Math.min(150, 24 + Math.abs(x2 - x1) * 0.2 + Math.abs(y2 - y1) * 0.12); c1 = [x1 + dx * 0.55, y1 + sag]; c2 = [x2 - dx * 0.55, y2 + sag]; }
  const pts = amostraCubica([x1, y1], c1, c2, [x2, y2]);
  return { d: `M${x1} ${y1} C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${x2} ${y2}`, pts, alca: estilo === "curva" ? pts[14] : null };
}
const tracarFio = (x1, y1, x2, y2, estilo, meio) => geoFio(x1, y1, x2, y2, estilo, meio).d;
/** O caminho atravessa algum obstáculo? (ignora as pontas: o fio nasce e chega nas bordas dos nós) */
function colide(pts, obst) {
  if (!obst.length) return false;
  const ini = pts[0], fim = pts[pts.length - 1];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / 7));
    for (let k = 0; k <= n; k++) {
      const x = ax + (bx - ax) * k / n, y = ay + (by - ay) * k / n;
      if (Math.hypot(x - ini[0], y - ini[1]) < 22 || Math.hypot(x - fim[0], y - fim[1]) < 22) continue;
      for (const r of obst) if (x > r[0] && x < r[0] + r[2] && y > r[1] && y < r[1] + r[3]) return true;
    }
  }
  return false;
}
/**
 * Roteamento que desvia dos nós (como o Visio/draw.io): A* numa grade de 16 px, só com trechos
 * horizontais e verticais, penalidade para curvas e para células já usadas por outros fios.
 */
function rotear(p1, p2, obst, usados, C = 16) {
  const s1 = [p1[0] + 20, p1[1]], s2 = [p2[0] - 20, p2[1]], M = 280;
  const minX = Math.floor((Math.min(s1[0], s2[0]) - M) / C) * C, minY = Math.floor((Math.min(s1[1], s2[1]) - M) / C) * C;
  const W = Math.ceil((Math.max(s1[0], s2[0]) + M - minX) / C), H = Math.ceil((Math.max(s1[1], s2[1]) + M - minY) / C);
  if (W * H > 60000) return null;
  const bloq = new Uint8Array(W * H);
  for (const [x, y, w, h] of obst) {
    const i0 = Math.max(0, Math.floor((x - minX) / C)), i1 = Math.min(W - 1, Math.floor((x + w - minX) / C));
    const j0 = Math.max(0, Math.floor((y - minY) / C)), j1 = Math.min(H - 1, Math.floor((y + h - minY) / C));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) bloq[j * W + i] = 1;
  }
  const cel = ([x, y]) => [Math.max(0, Math.min(W - 1, Math.floor((x - minX) / C))), Math.max(0, Math.min(H - 1, Math.floor((y - minY) / C)))];
  const [si, sj] = cel(s1), [gi, gj] = cel(s2);
  bloq[sj * W + si] = 0; bloq[gj * W + gi] = 0;
  const DX = [1, -1, 0, 0], DY = [0, 0, 1, -1];
  const custo = new Float32Array(W * H * 4).fill(Infinity), de = new Int32Array(W * H * 4).fill(-1);
  const heap = [];
  const push = (f, st) => { heap.push([f, st]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const t = heap[0], u = heap.pop(); if (heap.length) { heap[0] = u; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return t; };
  const hx = (i, j) => Math.abs(i - gi) + Math.abs(j - gj);
  const ini = (sj * W + si) * 4;
  custo[ini] = 0; push(hx(si, sj), ini);
  let fimSt = -1, passos = 0;
  while (heap.length && passos++ < 120000) {
    const [, st] = pop();
    const idx = st >> 2, dir = st & 3, i = idx % W, j = (idx / W) | 0, g = custo[st];
    if (i === gi && j === gj) { fimSt = st; if (dir === 0) break; }
    for (let nd = 0; nd < 4; nd++) {
      if ((dir ^ nd) === 1) continue; // sem meia-volta
      const ni = i + DX[nd], nj = j + DY[nd];
      if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
      const nidx = nj * W + ni;
      if (bloq[nidx]) continue;
      const ng = g + 1 + (nd !== dir ? 4 : 0) + (usados.has(`${Math.floor((minX + ni * C) / C)}|${Math.floor((minY + nj * C) / C)}`) ? 2.5 : 0) + (ni === gi && nj === gj && nd !== 0 ? 6 : 0);
      const nst = nidx * 4 + nd;
      if (ng < custo[nst]) { custo[nst] = ng; de[nst] = st; push(ng + hx(ni, nj), nst); }
    }
  }
  if (fimSt < 0) return null;
  const celulas = [];
  for (let st = fimSt; st >= 0; st = de[st]) celulas.push(st >> 2);
  celulas.reverse();
  const centro = idx => [minX + (idx % W) * C + C / 2, minY + ((idx / W) | 0) * C + C / 2];
  // só os cantos interessam
  const K = [];
  for (let k = 0; k < celulas.length; k++) {
    const c = centro(celulas[k]);
    if (k === 0 || k === celulas.length - 1) { K.push(c); continue; }
    const a = centro(celulas[k - 1]), b = centro(celulas[k + 1]);
    if ((a[0] === c[0]) !== (c[0] === b[0])) K.push(c);
  }
  // a primeira e a última corrida horizontal ficam alinhadas às portas
  if (K.length >= 2 && K[0][1] === K[1][1]) { const y = K[0][1]; for (const p of K) { if (p[1] !== y) break; p[1] = p1[1]; } }
  if (K.length >= 2 && K[K.length - 1][1] === K[K.length - 2][1]) { const y = K[K.length - 1][1]; for (let k = K.length - 1; k >= 0 && K[k][1] === y; k--) K[k][1] = p2[1]; }
  const bruto = [p1, s1, ...K, s2, p2], pts = [bruto[0]];
  for (let k = 1; k < bruto.length; k++) {
    const a = pts[pts.length - 1], b = bruto[k];
    if (a[0] !== b[0] && a[1] !== b[1]) pts.push([b[0], a[1]]);
    pts.push(b);
  }
  // simplifica: tira pontos repetidos e colineares
  const lim = [pts[0]];
  for (let k = 1; k < pts.length; k++) {
    const b = pts[k], a = lim[lim.length - 1];
    if (Math.abs(a[0] - b[0]) < 0.5 && Math.abs(a[1] - b[1]) < 0.5) continue;
    if (lim.length >= 2) { const z = lim[lim.length - 2]; if ((Math.abs(z[0] - a[0]) < 0.5 && Math.abs(a[0] - b[0]) < 0.5) || (Math.abs(z[1] - a[1]) < 0.5 && Math.abs(a[1] - b[1]) < 0.5)) { lim[lim.length - 1] = b; continue; } }
    lim.push(b);
  }
  for (const c of celulas) usados.add(`${Math.floor((minX + (c % W) * C) / C)}|${Math.floor((minY + ((c / W) | 0) * C) / C)}`);
  return lim;
}
/** Acrescenta a animação escolhida a um grupo <g> de fio. Marchas e brilhos são CSS; corpos que viajam usam animateMotion. */
function enfeitarFio(grupo, d, anim, { vel = 140, esp = 2.2, comprimento = 200 } = {}) {
  grupo.dataset.anim = anim;
  const sv = (tag, at) => { const e = document.createElementNS(SVG_NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
  if (anim === "fluxo" || anim === "pontos" || anim === "eletrico") grupo.append(sv("path", { d, class: `vs-anim vs-anim-${anim}` }));
  else if (anim === "respirar" || anim === "arcoiris") grupo.classList.add(`anim-${anim}`);
  else if (anim === "unity") grupo.append(sv("path", { d, class: "vs-anim vs-anim-unity" }));
  else if (anim === "setas" || anim === "pacotes" || anim === "bidirecional") {
    // direção do tráfego como em mapas de rede: corpos orientados pela tangente (rotate="auto")
    const dur = Math.max(0.5, comprimento / Math.max(10, vel));
    const passo = anim === "setas" ? 30 : anim === "pacotes" ? 44 : 48;
    const n = Math.max(1, Math.min(16, Math.round(comprimento / passo)));
    const faixas = anim === "bidirecional" ? [0, 1] : [0];
    const s = esp;
    for (const volta of faixas) for (let i = 0; i < n; i++) {
      let forma;
      if (anim === "setas") forma = sv("path", { d: `M${(-1.8 * s).toFixed(1)} ${(-2 * s).toFixed(1)} L${(1.4 * s).toFixed(1)} 0 L${(-1.8 * s).toFixed(1)} ${(2 * s).toFixed(1)}`, class: "vs-mov vs-mov-seta" });
      else if (anim === "pacotes") forma = sv("rect", { x: (-2.6 * s).toFixed(1), y: (-1.5 * s).toFixed(1), width: (5.2 * s).toFixed(1), height: (3 * s).toFixed(1), rx: (0.8 * s).toFixed(1), class: "vs-mov vs-mov-pacote" });
      // faixa deslocada para o lado: com rotate="auto", ida e volta ficam em lados opostos do fio
      else forma = sv("circle", { cy: (1.9 * s).toFixed(1), r: (1.05 * s).toFixed(2), class: `vs-mov ${volta ? "vs-mov-volta" : "vs-mov-ida"}` });
      const irregular = anim === "pacotes" ? ((i * 7) % 3) * dur / (n * 4) : 0;
      const at = { dur: `${dur.toFixed(2)}s`, repeatCount: "indefinite", path: d, rotate: "auto", begin: `${(-(dur * i / n) - irregular).toFixed(3)}s` };
      if (volta) Object.assign(at, { keyPoints: "1;0", keyTimes: "0;1", calcMode: "linear", begin: `${(-(dur * (i + 0.5) / n)).toFixed(3)}s` });
      forma.append(sv("animateMotion", at));
      grupo.append(forma);
    }
  }
  else if (anim === "pulso" || anim === "cometa" || anim === "particulas") {
    const dur = Math.max(0.35, comprimento / Math.max(10, vel));
    const n = anim === "particulas" ? Math.max(2, Math.min(9, Math.round(comprimento / 70))) : anim === "cometa" ? 7 : 1;
    for (let i = 0; i < n; i++) {
      const r = anim === "cometa" ? esp * Math.max(0.35, 1.9 - i * 0.24) : esp * (anim === "pulso" ? 1.9 : 1.2);
      const c = sv("circle", { r: r.toFixed(2), class: `vs-mov vs-mov-${anim}` });
      if (anim === "cometa") c.style.opacity = String(Math.max(0.12, 1 - i * 0.14));
      // inícios negativos: tudo já começa em movimento, sem piscar na origem
      const atraso = anim === "particulas" ? dur * i / n : anim === "cometa" ? Math.max(0, dur - i * 0.03 * Math.min(1, 160 / vel)) : 0;
      c.append(sv("animateMotion", { dur: `${dur.toFixed(2)}s`, repeatCount: "indefinite", path: d, begin: `${(-atraso).toFixed(3)}s` }));
      grupo.append(c);
    }
  }
}
const MARCA_INI = "=== HEFESTUS-FORJA-DADOS ===", MARCA_FIM = "=== FIM-HEFESTUS-FORJA-DADOS ===";
/** Hash curto para saber se o texto legível foi editado depois de exportado. */
const hashTexto = t => { let h = 5381; for (const c of String(t).replace(/\s+/g, " ").trim()) h = ((h << 5) + h + c.codePointAt(0)) >>> 0; return h.toString(36); };
const hora = t => new Date(t).toLocaleTimeString("pt-BR", { hour12: false }) + "." + String(new Date(t).getMilliseconds()).padStart(3, "0").slice(0, 2);

/** Pontuação de busca aproximada: palavras em sequência e iniciais valem mais. */
function pontuar(q, alvo) {
  q = normal(q).trim(); alvo = normal(alvo);
  if (!q) return 1;
  if (alvo.startsWith(q)) return 100 - alvo.length / 100;
  const i = alvo.indexOf(q);
  if (i >= 0) return 80 - i;
  let j = 0, pts = 0, seguidas = 0;
  for (const ch of alvo) { if (ch === q[j]) { j++; seguidas++; pts += seguidas; } else seguidas = 0; if (j === q.length) break; }
  return j === q.length ? 10 + pts : 0;
}

class EstudioVS {
  constructor(app) {
    this.app = app;
    this.raiz = h("section", { class: "vs-estudio", "aria-label": "Visual Script", tabindex: "-1" });
    this.sel = new Set();
    this.fioSel = null;
    this.logs = [];
    this.contagem = new Map();
    this.aoVivo = {};
    this.metricas = new Map(); this.ultimoNo = new Map(); this.rastros = []; this.seqRastro = 0;
    this.versaoLida = -1;
    this.filtroPaleta = "";
    this.filtroElementos = "";
    this.filtroLog = "todos";
    this.fechadas = new Set(listaPreferenciaUI(this.lerUI("vsCatFechadas", "[]")));
    this.mouse = { x: 200, y: 200 };
    window.addEventListener("message", e => this.aoMensagem(e));
    this.raiz.addEventListener("keyup", e => this.teclaSolta(e));
  }
  get n() { return this.app.n; }
  get ui() { return this.app.ui; }
  lerUI(k, padrao) { return this.ui?.[k] ?? padrao; }

  // ================================================================
  // Estado: cópia de trabalho do script e gravação no documento
  // ================================================================
  sincronizar() {
    if (this.arrasto) return;
    if (this.versaoLida === this.n.versao && this.s) return;
    const doc = this.n.doc.elementos.__script;
    if (doc?.grafos?.length) { this.s = clonar(doc); this.semDoc = false; }
    else { this.sPadrao ??= scriptVazio(); this.s = clonar(this.sPadrao); this.semDoc = true; }
    for (const g of this.s.grafos) { g.nos ??= []; g.ligacoes ??= []; g.grupos ??= []; g.notas ??= []; }
    this.s.variaveis ??= [];
    this.versaoLida = this.n.versao;
    if (!this.s.grafos.some(g => g.id === this.ui.vsGrafo)) this.ui.vsGrafo = (this.s.grafos.find(g=>g.origem==="designer") ?? this.s.grafos[0]).id;
    const ids = new Set(this.s.grafos.map(g => g.id));
    this.ui.vsAbas = (this.ui.vsAbas ?? []).filter(id => ids.has(id));
    if (!this.ui.vsAbas.includes(this.ui.vsGrafo)) this.ui.vsAbas.push(this.ui.vsGrafo);
    // seleção que aponta para algo apagado (desfazer) sai da seleção
    const g = this.g;
    const vivos = new Set([...g.nos.map(x => "n:" + x.id), ...g.grupos.map(x => "c:" + x.id), ...g.notas.map(x => "t:" + x.id)]);
    for (const k of [...this.sel]) if (!vivos.has(k)) this.sel.delete(k);
    if (this.fioSel && !g.ligacoes.some(l => l.id === this.fioSel)) this.fioSel = null;
  }
  sincronizarSelecaoObjeto() {
    const ids=this.n.selecionados(), chave=ids.join("|");
    if (chave===this._objetosSelecionados) return;
    this._objetosSelecionados=chave;
    if (this._selecionandoObjeto || !ids.length) return;
    const g=this.s.grafos.find(g=>g.origem==="designer");
    if (g && ids.some(id=>g.nos.some(n=>n.id===id))) {this.ui.vsGrafo=g.id;this.sel=new Set(ids.map(id=>"n:"+id));this.fioSel=null;this.varSel=null;}
  }
  selecionarObjetosDosNos() {
    const ids=[...this.sel].filter(k=>k.startsWith("n:")).map(k=>this.no(k.slice(2))).filter(n=>n?.origem==="designer").map(n=>n.v.alvo);
    if (!ids.length || ids.join("|")===this.n.selecionados().join("|")) return;
    this._selecionandoObjeto=true;
    try {this.n.selecionarVarios(ids);this._objetosSelecionados=ids.join("|");} finally {this._selecionandoObjeto=false;}
  }
  mostrarNoObjeto(id) { const g=this.s.grafos.find(g=>g.origem==="designer"); if(g) this.irPara(g.id,id);this.n.selecionar(id); }
  get g() { return this.s.grafos.find(x => x.id === this.ui.vsGrafo) ?? this.s.grafos[0]; }
  /** Grava a cópia de trabalho como um passo do histórico. */
  gravar(texto) {
    const novo = clonar(this.s);
    try {
      const r = this.n.comando({ texto: `Visual Script: ${texto}`, alvos: ["__script"], propriedades: ["*"] }, d => { d.elementos.__script = novo; });
      if (r?.acao !== "aplicado") this.versaoLida = -1;
      this.semDoc = false;
    } catch (e) { avisar(e.message, "alerta"); this.versaoLida = -1; }
    this.agendarRecarga();
  }
  mudar(texto, fn) { fn(this.s, this.g); this.gravar(texto); }

  // ================================================================
  // Consultas
  // ================================================================
  no(id, g = this.g) { return g.nos.find(x => x.id === id); }
  def(no) { return NOS[no?.tipo]; }
  largura(no) { const d = this.def(no); if (!d) return 200; if (d.desvio) return 16; if (d.puro) return d.ent.length > 2 || d.ent.some(p => p.tipo === "el") ? 210 : 180; return d.evento ? 230 : 250; }
  altura(no) { const d = this.def(no); if (!d) return HEAD + 30; if (d.desvio) return 16; return HEAD + PAD * 2 + Math.max(1, d.ent.length, d.sai.length) * ROW; }
  posPorta(no, porta, lado) {
    const oc = this.ocultos?.get(no.id);
    if (oc) { const p = this.posG(oc); return lado === "sai" ? [p.x + PASTA_L, p.y + this.altPasta(oc) / 2] : [p.x, p.y + this.altPasta(oc) / 2]; }
    const d = this.def(no);
    if (!d) return [no.x, no.y];
    if (d.desvio) return lado === "sai" ? [no.x + 16, no.y + 8] : [no.x, no.y + 8];
    const lista = lado === "sai" ? d.sai : d.ent;
    const i = Math.max(0, lista.findIndex(p => p.id === porta));
    return [lado === "sai" ? no.x + this.largura(no) : no.x, no.y + HEAD + PAD + i * ROW + ROW / 2];
  }
  tipo(noId, porta, lado, g = this.g) { return tipoPorta(g, noId, porta, lado); }
  elementos() { return this.n.elementos(); }
  nomeEl(id) { const e = this.n.elemento(id); return e ? (e.nome ?? id) : id ? `${id} (ausente)` : "—"; }
  nomeVar(id) { return this.s.variaveis.find(v => v.id === id)?.nome ?? "—"; }
  titulo(no) { const d = this.def(no); return no.titulo || d?.nome || no.tipo; }
  subtitulo(no) {
    const d = this.def(no); if (!d) return "";
    const v = no.v ?? {};
    if (d.ent.some(p => p.id === "alvo" && p.prop)) return v.alvo ? this.nomeEl(v.alvo) : "escolha o elemento";
    if (no.tipo === "ev.tecla") return v.tecla || "";
    if (no.tipo === "ev.personalizado" || no.tipo === "fl.disparar") return v.nome ? `“${v.nome}”` : "";
    if (no.tipo === "ev.sinal") return v.nome ? `“${v.nome}”` : "qualquer sinal";
    if (no.tipo === "ev.intervalo") return `${v.ms ?? 1000} ms`;
    if (d.ent.some(p => p.tipo === "var")) return this.nomeVar(v.variavel);
    return "";
  }
  problemas() {
    if (this._probVer !== this.n.versao + ":" + this.versaoLida) {
      this._prob = validarScript(this.s, this.elementos().map(e => e.id));
      this._probVer = this.n.versao + ":" + this.versaoLida;
    }
    return this._prob;
  }
  cam(gid = this.g.id) {
    this.ui.vsCams ??= {};
    return (this.ui.vsCams[gid] ??= { x: 80, y: 60, z: 1 });
  }
  paraMundo(cx, cy) {
    const r = this.tela.getBoundingClientRect(), c = this.cam();
    return [(cx - r.left - c.x) / c.z, (cy - r.top - c.y) / c.z];
  }
  centroVisivel() { const r = this.tela.getBoundingClientRect(); return this.paraMundo(r.left + r.width / 2, r.top + r.height / 2); }
  encaixe(v) { return this.ui.vsEncaixe === false ? Math.round(v) : Math.round(v / GRADE) * GRADE; }

  // ================================================================
  // Render
  // ================================================================
  render() {
    this.sincronizar();
    this.sincronizarSelecaoObjeto();
    if (!this.montado) this.montar();
    this.renderTopo();
    this.renderProjeto();
    this.renderPaleta();
    this.renderAbas();
    this.renderGrafo();
    this.renderInspetor();
    this.renderPainel();
    this.renderRepresentacoes();
    this.aplicarLayout();
    this.renderBarraMobile();
  }
  mudarRepresentacao(visao){definirVisaoCodigo(this.ui,visao);this._representacaoChave=null;this.salvarUI();this.render();}
  renderRepresentacoes(){renderRepresentacoesCodigo(this);}
  /** Celular: uma gaveta ou folha por vez; abrir uma fecha as outras. */
  abrirFolha(qual) {
    const u = this.ui, aberta = qual === "projeto" ? !u.vsEsqFechada : qual === "props" ? !u.vsDirFechada : !u.vsPainelFechado;
    u.vsEsqFechada = true; u.vsDirFechada = true; u.vsPainelFechado = true;
    if (!aberta) { if (qual === "projeto") u.vsEsqFechada = false; else if (qual === "props") u.vsDirFechada = false; else u.vsPainelFechado = false; }
    this.salvarUI(); this.aplicarLayout(); this.renderBarraMobile();
    if (qual === "painel" && !u.vsPainelFechado) this.renderPainel();
  }
  fecharFolhas() {
    const u = this.ui;
    if (u.vsEsqFechada && u.vsDirFechada && u.vsPainelFechado) return false;
    u.vsEsqFechada = true; u.vsDirFechada = true; u.vsPainelFechado = true;
    this.aplicarLayout(); this.renderBarraMobile();
    return true;
  }
  renderBarraMobile() {
    if (!this.barraMob) return;
    const u = this.ui, rodando = !this.previa.hidden, nSel = this.sel.size;
    const probs = this.problemas().filter(p => p.nivel === "erro").length, erros = this.logs.filter(l => l.nivel === "erro").length;
    const bt = (ic, rot, ativo, fn, extra = {}) => h("button", { type: "button", class: `vs-mob-bt ${extra.class ?? ""}`, "aria-pressed": ativo == null ? null : String(!!ativo), "aria-label": extra.titulo ?? rot, onclick: fn },
      h("span", { class: "vs-mob-ic", html: icone(ic, 20) }), h("span", { class: "vs-mob-rot" }, rot), extra.conta ? h("span", { class: "vs-conta erro" }, extra.conta) : null);
    this.barraMob.replaceChildren(
      bt("pasta", "Projeto", !u.vsEsqFechada, () => this.abrirFolha("projeto")),
      bt("mais", "Adicionar", null, () => { this.fecharFolhas(); const r = this.tela.getBoundingClientRect(); this.abrirBuscaNos(r.left + r.width / 2, r.top + r.height / 2, {}); }),
      bt(rodando ? "pausa" : "play", rodando ? "Parar" : "Executar", rodando, () => { this.fecharFolhas(); this.alternarExecucao(); }, { class: `principal ${rodando ? "rodando" : ""}` }),
      bt("propriedades", nSel ? `Editar (${nSel})` : "Propriedades", !u.vsDirFechada, () => this.abrirFolha("props"), { conta: probs || null }),
      bt("lista", "Console", !u.vsPainelFechado, () => this.abrirFolha("painel"), { conta: erros || null }));
  }
  montar() {
    this.montado = true;
    this.barraMob = h("nav", { class: "vs-barra-mobile", "aria-label": "Ações da Visual Script" });
    window.addEventListener("resize", () => { if (this.raiz.isConnected && this.s) { this.aplicarLayout(); this.renderBarraMobile(); this.aplicarDispositivo?.(); } });
    this.topo = h("header", { class: "vs-topo" });
    this.colEsq = h("aside", { class: "vs-esq", "aria-label": "Projeto e paleta" });
    this.projeto = h("section", { class: "vs-projeto" });
    this.paleta = h("section", { class: "vs-paleta" });
    this.colEsq.append(this.projeto, this.paleta);
    this.abas = h("div", { class: "vs-abas", role: "tablist", "aria-label": "Grafos abertos" });
    this.mundo = h("div", { class: "vs-mundo" });
    this.camGrupos = h("div", { class: "vs-camada" });
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("class", "vs-fios");
    this.camNos = h("div", { class: "vs-camada" });
    this.camNotas = h("div", { class: "vs-camada" });
    this.mundo.append(this.camGrupos, this.svg, this.camNos, this.camNotas);
    this.tituloTela = h("div", { class: "vs-titulo-tela", "aria-hidden": "true" });
    this.vazio = h("div", { class: "vs-vazio" });
    this.barraSel = h("div", { class: "vs-barra-sel", role: "toolbar", "aria-label": "Ações da seleção" });
    this.minimapa = h("canvas", { class: "vs-minimapa", width: 200, height: 128, "aria-label": "Minimapa: clique para navegar", role: "img" });
    this.zoomCtl = h("div", { class: "vs-zoom" });
    this.marquee = h("div", { class: "vs-marquee", hidden: true });
    this.dicaFio = h("div", { class: "vs-dica-fio", hidden: true });
    this.barraRastro = h("div", { class: "vs-rastro", hidden: true, role: "group", "aria-label": "Caminho percorrido pelo último comando" });
    this.tela = h("div", { class: "vs-tela", tabindex: "0", "aria-label": "Grafo. Espaço ou Tab abre a busca de nós; F enquadra; Delete remove." },
      this.mundo, this.tituloTela, this.barraRastro, this.vazio, this.barraSel, this.minimapa, this.zoomCtl, this.marquee, this.dicaFio);
    this.previa = h("section", { class: "vs-previa", hidden: true, "aria-label": "Prévia ao vivo" });
    this.divPrevia = h("div", { class: "vs-divisor-v", role: "separator", "aria-orientation": "vertical", "aria-label": "Largura da prévia", tabindex: "0" });
    this.palcoEl = h("div", { class: "vs-palco" }, this.tela, this.divPrevia, this.previa);
    this.visoesNav=h('nav',{class:'codigo-representacoes',role:'group','aria-label':'Representação do código'});
    this.representacao=h('section',{class:'codigo-representacao',hidden:true,'aria-label':'Conteúdo da representação'});
    this.centro = h("div", { class: "vs-centro" }, this.visoesNav, this.abas, this.palcoEl,this.representacao);
    this.inspetor = h("aside", { class: "vs-inspetor", "aria-label": "Inspetor" });
    this.divPainel = h("div", { class: "vs-divisor-h", role: "separator", "aria-orientation": "horizontal", "aria-label": "Altura do painel inferior", tabindex: "0" });
    this.painel = h("section", { class: "vs-painel", "aria-label": "Depurador e ferramentas" });
    this.raiz.append(this.topo, this.colEsq, this.centro, this.inspetor, this.divPainel, this.painel, this.barraMob);
    this.ligarTela();
    this.ligarDivisores();
  }
  ehMobile() {
    const m = this.ui.vsMobile;
    if (m === "sim") return true;
    if (m === "nao") return false;
    return window.innerWidth < 900 || (window.matchMedia?.("(pointer: coarse)").matches && window.innerWidth < 1200);
  }
  aplicarLayout() {
    const mob = this.ehMobile();
    this.raiz.classList.toggle("mobile", mob);
    document.getElementById("app")?.classList.toggle("forja-mobile", mob && !!this.ui.hibrido);
    if (mob !== this._mobAnt) {
      this._mobAnt = mob;
      if (mob) { this.ui.vsEsqFechada = true; this.ui.vsDirFechada = true; this.ui.vsPainelFechado = true; }
      else { this.ui.vsEsqFechada = false; this.ui.vsDirFechada = false; }
      this.renderBarraMobile?.();
    }
    const alt = this.ui.vsPainelFechado ? 34 : Math.round(this.ui.vsPainelAlt ?? 210);
    this.raiz.style.setProperty("--vs-painel", `${alt}px`);
    this.ui.vsEsqFechada=false;
    this.raiz.style.setProperty("--vs-esq", "215px");
    this.raiz.style.setProperty("--vs-dir", this.ui.vsDirFechada ? "0px" : "285px");
    this.raiz.classList.toggle("esq-fechada", !!this.ui.vsEsqFechada);
    this.raiz.classList.toggle("dir-fechada", !!this.ui.vsDirFechada);
    this.raiz.classList.toggle("painel-fechado", !!this.ui.vsPainelFechado);
    // celular: prévia em cima, nós embaixo (dá para ver o caminho acender enquanto testa)
    if (mob) { this.previa.style.width = ""; this.previa.style.height = `${Math.round((this.ui.vsPreviaAltMob ?? 0.46) * 100)}%`; }
    else { this.previa.style.height = ""; this.previa.style.width = `${Math.round(this.ui.vsPreviaLarg ?? 420)}px`; }
  }
  salvarUI() { clearTimeout(this._tSalvar); this._tSalvar = setTimeout(() => this.app.salvarUI(), 300); }

  // ---------------- barra superior ----------------
  renderTopo() {
    const app = this.app, n = this.n;
    const probs = this.problemas().filter(p => p.nivel === "erro").length;
    const rodando = !this.previa.hidden;
    const bt = (ic, rot, fn, extra = {}) => h("button", { type: "button", class: `vs-bt ${extra.class ?? ""}`, title: extra.titulo ?? rot, "aria-label": extra.titulo ?? rot, onclick: fn, disabled: extra.desab, "aria-pressed": extra.pressed }, h("span", { html: icone(ic, 16) }), extra.texto ? h("span", { class: "vs-bt-txt" }, extra.texto) : null);
    this.busca ??= h("input", { type: "search", class: "vs-busca-topo", placeholder: "Pesquisar nós, grafos, variáveis e comandos…", "aria-label": "Paleta de comandos (Ctrl+K)",
      onfocus: () => this.abrirPaletaComandos(), oninput: () => this.abrirPaletaComandos(), onkeydown: e => this.navegarLista(e) });
    this.busca.placeholder = this.ehMobile() ? "Pesquisar…" : "Pesquisar nós, grafos, variáveis e comandos…";
    this.topo.replaceChildren(
      h("div", { class: "vs-topo-esq" },
        h("button", { type: "button", class: "vs-bt", title: this.ui.vsEsqFechada ? "Mostrar projeto e paleta" : "Esconder projeto e paleta", "aria-pressed": String(!this.ui.vsEsqFechada), html: icone("painelLateral", 16), onclick: () => { this.ui.vsEsqFechada = !this.ui.vsEsqFechada; this.salvarUI(); this.aplicarLayout(); } }),
        h("div", { class: "vs-modos", role: "group", "aria-label": "Ambiente" },
          h("button", { type: "button", class: "vs-modo", "aria-pressed": "false", onclick: () => app.setModo("designer") }, "Designer"),
          h("button", { type: "button", class: "vs-modo", "aria-pressed": "true" }, h("span", { html: icone("nos", 14) }), "Visual Script")),
        h("nav", { class: "vs-trilha", "aria-label": "Local" }, h("span", {}, n.nome), ...(this.g.pasta ?? "").split("/").filter(Boolean).flatMap(p => [h("span", { "aria-hidden": "true" }, "›"), h("span", {}, `📁 ${p}`)]), h("span", { "aria-hidden": "true" }, "›"), h("strong", {}, this.g.nome))),
      h("div", { class: "vs-topo-meio" }, h("span", { class: "vs-busca-ic", html: icone("buscar", 15) }), this.busca, h("kbd", {}, "Ctrl K")),
      h("div", { class: "vs-topo-dir" },
        h("button", { type: "button", class: `vs-executar ${rodando ? "rodando" : ""}`, title: rodando ? "Parar a prévia (F5)" : "Executar na prévia ao vivo (F5)", onclick: () => this.alternarExecucao() },
          h("span", { html: icone(rodando ? "pausa" : "play", 15) }), rodando ? "Parar" : "Executar", h("kbd", {}, "F5")),
        bt("modelo", "Exemplos para testar", e => this.menuExemplos(e.currentTarget), { texto: "Exemplos", class: "mob-ok" }),
        bt("tablet", this.ehMobile() ? "Sair do modo mobile" : "Modo mobile (celular e tablet)", () => { this.ui.vsMobile = this.ehMobile() ? "nao" : "sim"; this.salvarUI(); this.render(); }, { class: "mob-ok", pressed: String(this.ehMobile()) }),
        bt("desfazer", "Voltar (Ctrl+Z)", () => n.desfazer(), { desab: !n.projeto.cursor }),
        bt("refazer", "Refazer (Ctrl+Y)", () => n.refazer(), { desab: n.projeto.cursor === n.projeto.historico.length }),
        bt("alerta", "Problemas", () => this.abrirAba("problemas"), { texto: probs ? String(probs) : "", class: probs ? "com-erro" : "" }),
        bt("enviarArquivo", "Importar (.txt da Visual Script, texto ou .json)", () => this.abrirImportar(), { texto: "Importar", class: "mob-ok" }),
        bt("documento", "Exportar (.txt / .html)", e => this.menuExportar(e.currentTarget), { texto: "Exportar", class: "mob-ok" }),
        bt("ajuda", "Atalhos do Visual Script", () => this.mostrarAjuda()),
        h("button", { type: "button", class: "vs-bt", title: this.ui.vsDirFechada ? "Mostrar inspetor" : "Esconder inspetor", "aria-pressed": String(!this.ui.vsDirFechada), html: icone("propriedades", 16), onclick: () => { this.ui.vsDirFechada = !this.ui.vsDirFechada; this.salvarUI(); this.aplicarLayout(); } })));
  }

  // ---------------- coluna esquerda: projeto ----------------
  renderProjeto() {
    const s = this.s;
    const rolagem = this.projeto.querySelector(".vs-rolagem")?.scrollTop ?? 0;
    const sec = (id, titulo, acoes, corpo, conta) => {
      const aberto = !this.fechadas.has("p:" + id);
      return h("div", { class: "vs-sec" },
        h("div", { class: "vs-sec-cab" },
          h("button", { type: "button", class: "vs-sec-tit", "aria-expanded": String(aberto), onclick: () => this.alternarSecao("p:" + id) }, h("span", { class: "vs-seta", "aria-hidden": "true" }, aberto ? "▾" : "▸"), titulo, conta != null ? h("span", { class: "vs-conta" }, conta) : null),
          acoes),
        aberto ? corpo : null);
    };
    const disc = (chave, aberto, rot) => h("button", { type: "button", class: "vs-disc", "aria-expanded": String(aberto), "aria-label": `${aberto ? "Recolher" : "Expandir"} ${rot}`, onclick: () => this.alternarSecao(chave) }, aberto ? "▾" : "▸");
    const pasta = (aberta, cor, tipo) => h("span", { class: "vs-ic-pasta", html: svgPasta(cor ?? "#e3a008", aberta, tipo, 16) });
    const botaoCor = (rot, cor, aoEscolher, extra = {}) => h("button", { type: "button", class: "vs-mini vs-cor-bt", title: `Cor${extra.comTipo ? " e tipo" : ""} de ${rot}`, "aria-label": `Cor de ${rot}`, style: `--c:${cor ?? "#e3a008"}`, onclick: e => this.menuPasta(e.currentTarget, { cor, ...extra, aoEscolher }) });

    // ---------- grafos em pastas (Menus/Arquivo, Menus/Editar…) ----------
    const todas = new Set(s.pastas ?? []);
    for (const g of s.grafos) if (g.pasta) { const p = g.pasta.split("/"); for (let i = 1; i <= p.length; i++) todas.add(p.slice(0, i).join("/")); }
    const subpastas = pai => [...todas].filter(p => pai ? p.startsWith(pai + "/") && p.split("/").length === pai.split("/").length + 1 : !p.includes("/")).sort((x, y) => x.localeCompare(y, "pt-BR"));
    const soltarGrafo = destino => ({
      ondragover: e => { if (e.dataTransfer.types.includes("text/x-vs-grafo")) { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add("alvo-soltar"); } },
      ondragleave: e => e.currentTarget.classList.remove("alvo-soltar"),
      ondrop: e => {
        const id = e.dataTransfer.getData("text/x-vs-grafo"); e.currentTarget.classList.remove("alvo-soltar");
        if (!id) return; e.preventDefault(); e.stopPropagation();
        this.mudar(destino ? `mover grafo para ${destino}` : "mover grafo para a raiz", s2 => { const g = s2.grafos.find(x => x.id === id); if (destino) g.pasta = destino; else delete g.pasta; });
      },
    });
    const itemGrafo = g => {
      const ativo = g.id === this.g.id;
      const chave = "gg:" + g.id, aberto = g.grupos.length > 0 && !this.fechadas.has(chave) && ativo || this.fechadas.has("ga:" + g.id);
      const grupos = [...g.grupos].sort((x, y) => x.y - y.y || x.x - y.x);
      return h("li", {},
        h("div", { class: `vs-item ${ativo ? "ativo" : ""} ${g.desativado ? "desligado" : ""}`, draggable: "true", title: `${g.nome} — ${g.nos.length} nó(s). Arraste para uma pasta. Duplo clique renomeia.`,
          ondragstart: e => { e.dataTransfer.setData("text/x-vs-grafo", g.id); e.dataTransfer.effectAllowed = "move"; } },
          g.grupos.length ? h("button", { type: "button", class: "vs-disc", "aria-expanded": String(aberto), "aria-label": `Pastas de ${g.nome}`, onclick: () => {
            if (aberto) { this.fechadas.add(chave); this.fechadas.delete("ga:" + g.id); } else { this.fechadas.delete(chave); this.fechadas.add("ga:" + g.id); }
            this.renderProjeto(); } }, aberto ? "▾" : "▸") : h("span", { class: "vs-disc-vazio" }),
          h("button", { type: "button", class: "vs-item-nome", "aria-current": ativo ? "true" : null, onclick: () => this.abrirGrafo(g.id), ondblclick: () => this.renomearGrafo(g.id) },
            h("span", { class: "vs-ic-grafo", html: icone("nos", 14) }), h("span", { class: "vs-rot" }, g.nome), h("small", {}, g.nos.length)),
          h("button", { type: "button", class: "vs-mini", title: g.desativado ? "Ativar grafo" : "Desativar grafo (não roda na prévia nem no HTML)", "aria-label": g.desativado ? `Ativar ${g.nome}` : `Desativar ${g.nome}`, html: icone(g.desativado ? "olhoFechado" : "olho", 13), onclick: () => this.mudar(g.desativado ? "ativar grafo" : "desativar grafo", s2 => { const x = s2.grafos.find(y => y.id === g.id); x.desativado = !x.desativado; }) }),
          s.grafos.length > 1 ? h("button", { type: "button", class: "vs-mini", title: "Apagar grafo", "aria-label": `Apagar ${g.nome}`, html: icone("excluir", 13), onclick: () => this.apagarGrafo(g.id) }) : null),
        aberto ? h("ul", { class: "vs-arvore" }, grupos.map(gr => {
          const n = this.membros(gr, g).nos.size;
          return h("li", {}, h("div", { class: `vs-item vs-grupo-item ${this.sel.has("c:" + gr.id) && ativo ? "ativo" : ""}`, style: `--g:${gr.cor ?? CORES_GRUPO[0][0]}` },
            h("span", { class: "vs-disc-vazio" }),
            h("button", { type: "button", class: "vs-item-nome", title: "Ir para esta pasta do grafo", onclick: () => this.irParaGrupo(g.id, gr.id) },
              pasta(!gr.recolhido, corGrupo(gr), gr.tipo), h("span", { class: "vs-rot" }, gr.titulo || "Grupo"), h("small", {}, n)),
            botaoCor(gr.titulo || "grupo", corGrupo(gr), ({ cor, tipo }) => this.mudar("pasta do grafo", (s2) => { const x = s2.grafos.find(y => y.id === g.id).grupos.find(y => y.id === gr.id); if (cor !== undefined) { if (cor) x.cor = cor; else delete x.cor; } if (tipo) { if (tipo === "geral") delete x.tipo; else x.tipo = tipo; } }), { tipo: gr.tipo, comTipo: true }),
            h("button", { type: "button", class: "vs-mini vs-mini-pasta", title: gr.recolhido ? "Abrir pasta no grafo" : "Recolher em pasta no grafo", "aria-label": gr.recolhido ? "Abrir pasta" : "Recolher em pasta", html: icone(gr.recolhido ? "setaBaixo" : "setaCima", 12), onclick: () => this.alternarPasta(gr.id, !gr.recolhido, g.id) })));
        })) : null);
    };
    const ramoPasta = p => {
      const aberta = !this.fechadas.has("pg:" + p);
      const conta = s.grafos.filter(g => g.pasta === p || (g.pasta ?? "").startsWith(p + "/")).length;
      return h("li", {},
        h("div", { class: "vs-item vs-pasta-item", title: `${p} — arraste grafos para cá. Duplo clique renomeia.`, ...soltarGrafo(p) },
          disc("pg:" + p, aberta, p),
          h("button", { type: "button", class: "vs-item-nome", onclick: () => this.alternarSecao("pg:" + p), ondblclick: () => this.renomearPastaGrafos(p) }, pasta(aberta, s.coresPastas?.[p]), h("span", { class: "vs-rot" }, p.split("/").pop()), h("small", {}, conta)),
          botaoCor(p, s.coresPastas?.[p], ({ cor }) => this.mudar(`cor da pasta ${p}`, s2 => { s2.coresPastas ??= {}; if (cor) s2.coresPastas[p] = cor; else delete s2.coresPastas[p]; })),
          h("button", { type: "button", class: "vs-mini", title: "Novo grafo nesta pasta", "aria-label": `Novo grafo em ${p}`, html: icone("mais", 13), onclick: () => this.novoGrafo(p) }),
          h("button", { type: "button", class: "vs-mini", title: "Nova subpasta", "aria-label": `Nova subpasta em ${p}`, onclick: () => this.novaPastaGrafos(p) }, "📁"),
          h("button", { type: "button", class: "vs-mini", title: "Apagar pasta (os grafos sobem um nível)", "aria-label": `Apagar pasta ${p}`, html: icone("excluir", 13), onclick: () => this.apagarPastaGrafos(p) })),
        aberta ? h("ul", { class: "vs-arvore" }, subpastas(p).map(ramoPasta), s.grafos.filter(g => g.pasta === p).map(itemGrafo)) : null);
    };
    const grafos = h("ul", { class: "vs-arvore vs-raiz-soltar", role: "list", ...soltarGrafo("") }, subpastas("").map(ramoPasta), s.grafos.filter(g => !g.pasta).map(itemGrafo));

    // ---------- variáveis ----------
    const vars = h("ul", { class: "vs-arvore", role: "list" }, s.variaveis.length ? s.variaveis.map(v => {
      const t = TIPOS_VAR.find(x => x[0] === v.tipo) ?? TIPOS_VAR[0];
      return h("li", {}, h("div", { class: "vs-item vs-var", draggable: "true", title: "Arraste para o grafo: solta = Ler; Alt ao soltar = Definir",
        ondragstart: e => { e.dataTransfer.setData("text/x-vs", JSON.stringify({ var: v.id })); e.dataTransfer.effectAllowed = "copy"; } },
        h("span", { class: "vs-ponto", style: `--c:${TIPOS[t[2]].cor}`, "aria-hidden": "true" }),
        h("input", { class: "vs-var-nome", value: v.nome, "aria-label": "Nome da variável", spellcheck: false, onchange: e => this.mudar("renomear variável", s2 => { s2.variaveis.find(x => x.id === v.id).nome = e.target.value.trim() || v.nome; }) }),
        h("button", { type: "button", class: "vs-mini", title: "Selecionar variável no inspetor", "aria-label": `Editar ${v.nome}`, html: icone("editar", 13), onclick: () => { this.varSel = v.id; this.sel.clear(); this.fioSel = null; this.renderInspetor(); } }),
        h("button", { type: "button", class: "vs-mini", title: "Apagar variável", "aria-label": `Apagar ${v.nome}`, html: icone("excluir", 13), onclick: () => this.mudar("apagar variável", s2 => { s2.variaveis = s2.variaveis.filter(x => x.id !== v.id); }) })));
    }) : h("li", { class: "vs-vazio-lista" }, "Nenhuma variável. Use + para criar."));

    // ---------- elementos da tela em árvore: grupos e containers viram pastas ----------
    const els = this.elementos(), porId = new Map(els.map(e => [e.id, e]));
    const filhos = new Map();
    for (const e of els) { const pai = e.pai && porId.has(e.pai) ? e.pai : ""; if (!filhos.has(pai)) filhos.set(pai, []); filhos.get(pai).push(e); }
    const q = normal(this.filtroElementos);
    const visiveis = new Set();
    if (q) for (const e of els) if (normal(`${e.nome} ${e.tipo}`).includes(q)) { let x = e; const vistos = new Set(); while (x && !vistos.has(x.id)) { vistos.add(x.id); visiveis.add(x.id); x = porId.get(x.pai); } }
    const usados = new Map();
    for (const g of s.grafos) for (const nn of g.nos) { const a2 = nn.v?.alvo; if (a2) usados.set(a2, (usados.get(a2) ?? 0) + 1); }
    const marcados = new Set(this.n.selecionados());
    const desc = id => (filhos.get(id) ?? []).reduce((k, f) => k + 1 + desc(f.id), 0);
    const ic = e => icone(e.tipo === "botao" ? "botao" : e.tipo === "texto" ? "texto" : e.tipo === "campo" ? "campo" : e.tipo === "menu" ? "menu" : e.tipo === "toggle" ? "toggle" : "caixa", 13);
    const ramoEl = e => {
      if (q && !visiveis.has(e.id)) return null;
      const fs = filhos.get(e.id) ?? [];
      const ehPasta = fs.length > 0 || e.tipo === "container";
      const aberta = !!q || !this.fechadas.has("pe:" + e.id);
      return h("li", {},
        h("div", { class: `vs-item vs-el ${marcados.has(e.id) ? "marcado" : ""} ${ehPasta ? "vs-el-pasta" : ""}`, draggable: "true", title: `${e.nome} (${ehPasta ? "pasta · " : ""}${e.tipo}). Clique seleciona (Ctrl/Shift soma); arraste para o grafo; duplo clique renomeia.`,
          ondragstart: ev => { ev.dataTransfer.setData("text/x-vs", JSON.stringify({ el: e.id })); ev.dataTransfer.effectAllowed = "copy"; } },
          ehPasta && fs.length ? disc("pe:" + e.id, aberta, e.nome) : h("span", { class: "vs-disc-vazio" }),
          h("button", { type: "button", class: "vs-item-nome", onclick: ev => { if(ev.shiftKey||ev.ctrlKey||ev.metaKey) this.n.selecionar(e.id,{somar:true}); else this.mostrarNoObjeto(e.id); }, ondblclick: () => this.renomearElemento(e.id) },
            ehPasta ? pasta(aberta && fs.length > 0, s.coresEl?.[e.id]) : h("span", { class: "vs-ic-el", html: ic(e) }),
            h("span", { class: "vs-rot" }, e.nome),
            ehPasta ? h("small", { title: `${desc(e.id)} objeto(s) dentro` }, desc(e.id)) : null),
          usados.get(e.id) ? h("small", { class: "vs-uso", title: `${usados.get(e.id)} nó(s) usam este elemento` }, `⚡${usados.get(e.id)}`) : null,
          ehPasta ? botaoCor(e.nome, s.coresEl?.[e.id], ({ cor }) => this.mudar(`cor da pasta ${e.nome}`, s2 => { s2.coresEl ??= {}; if (cor) s2.coresEl[e.id] = cor; else delete s2.coresEl[e.id]; })) : null,
          h("button", { type: "button", class: "vs-mini vs-mini-duas", title: "Pastas do objeto: separa no grafo o que é Código (conexões) e o que é Designer (forma, cor, efeitos)", "aria-label": `Pastas Código e Visual de ${e.nome}`, html: svgPasta(TIPOS_PASTA.funcao.cor, false, "funcao", 13) + svgPasta(TIPOS_PASTA.visual.cor, false, "visual", 13), onclick: () => this.pastasDoObjeto(e.id) }),
          h("button", { type: "button", class: "vs-mini", title: "Criar evento Ao clicar para este elemento", "aria-label": `Ao clicar em ${e.nome}`, html: icone("mais", 13), onclick: () => this.criarNo("ev.clique", ...this.centroVisivel(), { alvo: e.id }) })),
        ehPasta && aberta && fs.length ? h("ul", { class: "vs-arvore" }, fs.map(ramoEl)) : null);
    };
    const umaPasta = marcados.size === 1 && this.n.elemento([...marcados][0])?.tipo === "container";
    const elementos = h("div", {},
      h("input", { type: "search", class: "vs-filtro", placeholder: "Filtrar elementos…", "aria-label": "Filtrar elementos", value: this.filtroElementos, oninput: e => { this.filtroElementos = e.target.value; this.renderProjeto(); const f = this.projeto.querySelector(".vs-filtro"); f?.focus(); f?.setSelectionRange(f.value.length, f.value.length); } }),
      marcados.size ? h("div", { class: "vs-acoes-arvore" },
        h("span", {}, `${marcados.size} selecionado(s)`),
        h("button", { type: "button", class: "vs-bt-pasta", title: "Junta os objetos selecionados num grupo, que aparece aqui como pasta", onclick: () => { try { this.app.agrupar("livre"); } catch (err) { avisar(err.message, "alerta"); } } }, "📁 Agrupar em pasta"),
        umaPasta ? h("button", { type: "button", class: "vs-bt-pasta", title: "Desfaz a pasta: os objetos ficam soltos", onclick: () => { try { this.app.desagrupar(); } catch (err) { avisar(err.message, "alerta"); } } }, "Desfazer pasta") : null) : null,
      h("div", { class: "vs-acoes-arvore discreto" },
        h("button", { type: "button", class: "vs-link", onclick: () => { for (const e of els) if ((filhos.get(e.id) ?? []).length) this.fechadas.add("pe:" + e.id); this.renderProjeto(); } }, "Recolher tudo"),
        h("button", { type: "button", class: "vs-link", onclick: () => { for (const k of [...this.fechadas]) if (k.startsWith("pe:")) this.fechadas.delete(k); this.renderProjeto(); } }, "Expandir tudo")),
      h("ul", { class: "vs-arvore vs-lista-el", role: "tree", "aria-label": "Objetos ativos" }, (filhos.get("") ?? []).map(ramoEl)));
    this.projeto.replaceChildren(
      h("div", { class: "vs-col-tit" }, h("span", { html: icone("pasta", 14) }), "Projeto"),
      h("div", { class: "vs-rolagem" },
        sec("els", "Camadas · Objetos ativos", null, elementos, els.length),
        componentesHephaestus(this.app),
        sec("grafos", "Grafos", [h("button", { type: "button", class: "vs-mini", title: "Nova pasta de grafos", "aria-label": "Nova pasta de grafos", onclick: () => this.novaPastaGrafos("") }, "📁"), h("button", { type: "button", class: "vs-mini", title: "Novo grafo", "aria-label": "Novo grafo", html: icone("mais", 13), onclick: () => this.novoGrafo() })], grafos, s.grafos.length),
        sec("vars", "Variáveis", h("button", { type: "button", class: "vs-mini", title: "Nova variável", "aria-label": "Nova variável", html: icone("mais", 13), onclick: () => this.novaVariavel() }), vars, s.variaveis.length)));
    if (rolagem) this.projeto.querySelector(".vs-rolagem").scrollTop = rolagem;
  }
  renomearElemento(id) {
    const e = this.n.elemento(id); if (!e) return;
    const nome = prompt("Nome do objeto:", e.nome ?? id);
    if (nome && nome.trim() && nome.trim() !== e.nome) this.n.definir(id, { nome: nome.trim() }, `Renomear ${e.nome} para ${nome.trim()}`);
  }
  novaPastaGrafos(pai) {
    const nome = prompt(pai ? `Nova subpasta em “${pai}”:` : "Nome da pasta (use / para subpastas, ex.: Menus/Arquivo):", "");
    const limpo = nome?.split("/").map(x => x.trim()).filter(Boolean).join("/");
    if (!limpo) return;
    const caminho = pai ? `${pai}/${limpo}` : limpo;
    this.fechadas.delete("pg:" + caminho);
    this.mudar(`nova pasta ${caminho}`, s2 => { s2.pastas = [...new Set([...(s2.pastas ?? []), caminho])]; });
  }
  renomearPastaGrafos(p) {
    const nome = prompt("Renomear pasta:", p.split("/").pop());
    const limpo = nome?.trim().replace(/\//g, "-");
    if (!limpo) return;
    const novo = [...p.split("/").slice(0, -1), limpo].join("/");
    const troca = x => x === p ? novo : x?.startsWith(p + "/") ? novo + x.slice(p.length) : x;
    this.mudar(`renomear pasta ${p}`, s2 => { s2.pastas = (s2.pastas ?? []).map(troca); for (const g of s2.grafos) if (g.pasta) g.pasta = troca(g.pasta); });
  }
  apagarPastaGrafos(p) {
    const pai = p.split("/").slice(0, -1).join("/");
    const troca = x => x === p ? pai : x?.startsWith(p + "/") ? (pai ? pai + "/" : "") + x.slice(p.length + 1) : x;
    this.mudar(`apagar pasta ${p}`, s2 => {
      s2.pastas = (s2.pastas ?? []).filter(x => x !== p).map(troca).filter(Boolean);
      for (const g of s2.grafos) if (g.pasta) { const n = troca(g.pasta); if (n) g.pasta = n; else delete g.pasta; }
    });
  }
  alternarSecao(k) {
    this.fechadas.has(k) ? this.fechadas.delete(k) : this.fechadas.add(k);
    this.ui.vsCatFechadas = JSON.stringify([...this.fechadas]); this.salvarUI();
    this.renderProjeto(); this.renderPaleta();
  }

  // ---------------- coluna esquerda: paleta ----------------
  renderPaleta() {
    if (this._paletaFiltro === this.filtroPaleta && this._paletaFech === [...this.fechadas].join() && this.listaPaleta) return;
    this._paletaFiltro = this.filtroPaleta; this._paletaFech = [...this.fechadas].join();
    const q = this.filtroPaleta;
    const entrada = this.entradaPaleta ??= h("input", { type: "search", class: "vs-filtro", placeholder: "Filtrar nós…", "aria-label": "Filtrar a paleta de nós", oninput: e => { this.filtroPaleta = e.target.value; this.renderPaleta(); } });
    const cats = Object.entries(CATEGORIAS).map(([cid, c]) => {
      const itens = Object.entries(NOS).filter(([t, d]) => d.cat === cid && (!q || pontuar(q, `${d.nome} ${SINONIMOS[t] ?? ""}`) > 0));
      if (!itens.length) return null;
      const aberto = q || !this.fechadas.has("c:" + cid);
      return h("div", { class: "vs-cat", style: `--cat:${c.cor}` },
        h("button", { type: "button", class: "vs-cat-cab", "aria-expanded": String(!!aberto), title: c.dica, onclick: () => this.alternarSecao("c:" + cid) },
          h("span", { class: "vs-cat-ic", html: icone(c.icone, 15) }), h("span", { class: "vs-rot" }, c.nome), h("span", { class: "vs-conta" }, itens.length), h("span", { class: "vs-seta", "aria-hidden": "true" }, aberto ? "▾" : "▸")),
        aberto ? h("ul", { class: "vs-cat-itens", role: "list" }, itens.map(([t, d]) => h("li", {},
          h("button", { type: "button", class: "vs-paleta-item", draggable: "true", title: `${d.desc}\nClique adiciona no centro; arraste para posicionar.`,
            onclick: () => { const [x, y] = this.centroVisivel(); this.criarNo(t, x - 100, y - 30); },
            ondragstart: e => { e.dataTransfer.setData("text/x-vs", JSON.stringify({ tipo: t })); e.dataTransfer.effectAllowed = "copy"; } },
            h("span", { class: `vs-forma ${d.evento ? "ev" : d.puro ? "puro" : "acao"}`, "aria-hidden": "true" }), d.nome)))) : null);
    }).filter(Boolean);
    if (!this.listaPaleta) {
      this.listaPaleta = h("div", { class: "vs-rolagem" });
      this.paleta.replaceChildren(h("div", { class: "vs-col-tit" }, h("span", { html: icone("biblioteca", 14) }), "Paleta"), h("div", { class: "vs-paleta-busca" }, entrada), this.listaPaleta);
    }
    this.listaPaleta.replaceChildren(...(cats.length ? cats : [h("p", { class: "vs-vazio-lista" }, "Nenhum nó com esse nome.")]));
  }

  // ---------------- abas de grafos ----------------
  renderAbas() {
    this.abas.replaceChildren(...this.ui.vsAbas.map(id => {
      const g = this.s.grafos.find(x => x.id === id); if (!g) return null;
      const ativo = id === this.g.id;
      return h("div", { class: `vs-aba ${ativo ? "ativa" : ""}`, role: "presentation" },
        h("button", { type: "button", role: "tab", "aria-selected": String(ativo), onclick: () => this.abrirGrafo(id), ondblclick: () => this.renomearGrafo(id) }, h("span", { html: icone("nos", 13) }), g.nome),
        this.ui.vsAbas.length > 1 ? h("button", { type: "button", class: "vs-aba-x", "aria-label": `Fechar aba ${g.nome}`, title: "Fechar aba (o grafo continua no projeto)", onclick: () => { this.ui.vsAbas = this.ui.vsAbas.filter(x => x !== id); if (ativo) this.ui.vsGrafo = this.ui.vsAbas[0]; this.salvarUI(); this.render(); } }, "×") : null);
    }), h("button", { type: "button", class: "vs-aba-nova", title: "Novo grafo", "aria-label": "Novo grafo", html: icone("mais", 14), onclick: () => this.novoGrafo() }));
  }
  abrirGrafo(id) {
    this.ui.vsGrafo = id;
    if (!this.ui.vsAbas.includes(id)) this.ui.vsAbas.push(id);
    this.sel.clear(); this.fioSel = null; this.varSel = null;
    this.salvarUI(); this.render();
  }
  novoGrafo(pasta) {
    const nomes = new Set(this.s.grafos.map(g => g.nome));
    let k = this.s.grafos.length + 1; while (nomes.has(`Grafo ${k}`)) k++;
    const g = grafoVazio(`Grafo ${k}`);
    if (pasta) g.pasta = pasta;
    this.mudar("novo grafo", s => { s.grafos.push(g); });
    this.abrirGrafo(g.id);
  }
  renomearGrafo(id) {
    const g = this.s.grafos.find(x => x.id === id);
    const nome = prompt("Nome do grafo:", g.nome);
    if (nome && nome.trim() && nome.trim() !== g.nome) this.mudar("renomear grafo", s => { s.grafos.find(x => x.id === id).nome = nome.trim(); });
  }
  apagarGrafo(id) {
    const g = this.s.grafos.find(x => x.id === id);
    if (g.nos.length && !confirm(`Apagar “${g.nome}” com ${g.nos.length} nó(s)? Dá para desfazer com Ctrl+Z.`)) return;
    this.mudar("apagar grafo", s => { s.grafos = s.grafos.filter(x => x.id !== id); });
    this.ui.vsAbas = this.ui.vsAbas.filter(x => x !== id);
    if (this.ui.vsGrafo === id) this.ui.vsGrafo = (this.s.grafos.find(g=>g.origem==="designer") ?? this.s.grafos[0]).id;
    this.render();
  }
  novaVariavel(tipo = "numero") {
    const nomes = new Set(this.s.variaveis.map(v => v.nome));
    let k = this.s.variaveis.length + 1; while (nomes.has(`variavel${k}`)) k++;
    const t = TIPOS_VAR.find(x => x[0] === tipo);
    const v = { id: novoIdLocal("v"), nome: `variavel${k}`, tipo, valor: t[3] };
    this.mudar("nova variável", s => { s.variaveis.push(v); });
    this.varSel = v.id; this.sel.clear(); this.renderInspetor();
    requestAnimationFrame(() => { const i = this.projeto.querySelectorAll(".vs-var-nome"); i[i.length - 1]?.select(); });
    return v;
  }

  // ================================================================
  // Grafo
  // ================================================================
  renderGrafo() { this._renderGrafo(); this.aplicarFoco(); }
  _renderGrafo() {
    const g = this.g, c = this.cam();
    this.aplicarCamera();
    this.tituloTela.textContent = g.nome;
    this.noEls = new Map();
    const probs = new Map();
    for (const p of this.problemas()) if (p.grafo === g.id && p.no && p.nivel !== "info") probs.set(p.no, p);
    // grupos (comentários de área); recolhidos viram pastas e escondem o que está dentro
    this.ocultos = new Map(); this.notasOcultas = new Set(); this.pastaEls = new Map();
    const membrosDe = new Map();
    for (const gr of g.grupos) { const m = this.membros(gr, g); membrosDe.set(gr.id, m); if (this.fechada(gr)) { for (const id of m.nos) if (!this.ocultos.has(id)) this.ocultos.set(id, gr); for (const id of m.notas) this.notasOcultas.add(id); } }
    this.calcPrateleira(g, membrosDe);
    this.camGrupos.replaceChildren(...g.grupos.map(gr => {
      const cor = corGrupo(gr), m = membrosDe.get(gr.id), tipo = TIPOS_PASTA[gr.tipo] ? gr.tipo : "geral";
      if (this.fechada(gr)) {
        const pp = this.posG(gr), prat = this.posPastas.has(gr.id);
        const dentro = id => this.ocultos.get(id) === gr;
        const ent = g.ligacoes.filter(l => dentro(l.para) && !dentro(l.de)).length, sai = g.ligacoes.filter(l => dentro(l.de) && !dentro(l.para)).length;
        const nosDentro = g.nos.filter(n => m.nos.has(n.id));
        const el = h("div", { class: `vs-grupo vs-pasta tipo-${tipo} ${prat ? "na-prateleira" : ""} ${this.sel.has("c:" + gr.id) ? "sel" : ""} ${ent ? "tem-ent" : ""} ${sai ? "tem-sai" : ""}`, "data-grupo": gr.id, style: `left:${pp.x}px;top:${pp.y}px;width:${PASTA_L}px;height:${this.altPasta(gr)}px;--g:${cor};--cat:${cor}` },
          h("div", { class: "vs-grupo-cab vs-pasta-cab", title: prat ? `Pasta ${TIPOS_PASTA[tipo].nome} — duplo clique abre esta pasta e fecha a atual.` : `Pasta ${TIPOS_PASTA[tipo].nome} — duplo clique abre só ela (as outras viram pastas). Arraste para mover tudo junto.` },
            h("span", { class: "vs-pasta-ic", html: svgPasta(cor, false, tipo, 44) }),
            h("div", { class: "vs-pasta-txt" },
              h("strong", {}, gr.titulo || "Pasta"),
              h("small", {}, `${tipo !== "geral" ? TIPOS_PASTA[tipo].nome + " · " : ""}${m.nos.size} nó(s) · ${ent}↘ ${sai}↗`),
              tipo !== "geral" ? this.resumoPasta(tipo, nosDentro) : null),
            h("button", { type: "button", class: "vs-pasta-bt", title: "Abrir esta pasta (as outras viram pastas)", onclick: () => this.focarPasta(gr.id) }, "Abrir")));
        this.pastaEls.set(gr.id, el);
        return el;
      }
      return h("div", { class: `vs-grupo tipo-${tipo} ${this.sel.has("c:" + gr.id) ? "sel" : ""}`, "data-grupo": gr.id, style: `left:${gr.x}px;top:${gr.y}px;width:${gr.w}px;height:${gr.h}px;--g:${cor}` },
        h("div", { class: "vs-grupo-cab", title: "Arraste para mover o grupo com o que está dentro. Duplo clique renomeia." },
          h("span", { class: "vs-grupo-ic", html: svgPasta(cor, true, tipo, 22) }),
          h("span", { class: "vs-grupo-tit" }, gr.titulo || "Grupo"),
          tipo !== "geral" ? h("span", { class: "vs-grupo-tipo" }, TIPOS_PASTA[tipo].nome) : null,
          this.focoAtual(g) === gr.id
            ? h("button", { type: "button", class: "vs-pasta-bt mini", title: "Fechar a pasta e ver o grafo inteiro (Esc)", onclick: () => this.sairFoco() }, "Ver tudo")
            : h("button", { type: "button", class: "vs-pasta-bt mini", title: `Recolher em pasta (${m.nos.size} nó(s))`, "aria-label": "Recolher em pasta", onclick: () => this.alternarPasta(gr.id, true) }, "Recolher")),
        h("div", { class: "vs-redim", "data-redim": "c:" + gr.id, "aria-hidden": "true" }));
    }));
    // nós
    const ligadas = new Set(), saem = new Set();
    for (const l of g.ligacoes) { ligadas.add(l.para + "|" + l.ep); saem.add(l.de + "|" + l.sp); }
    this.camNos.replaceChildren(...g.nos.filter(no => !this.ocultos.has(no.id)).map(no => {
      const el = this.elNo(no, ligadas, saem, probs.get(no.id));
      this.noEls.set(no.id, el);
      return el;
    }));
    // notas
    this.camNotas.replaceChildren(...g.notas.filter(t => !this.notasOcultas.has(t.id)).map(t => h("div", { class: `vs-nota ${this.sel.has("t:" + t.id) ? "sel" : ""}`, "data-nota": t.id, style: `left:${t.x}px;top:${t.y}px;width:${t.w}px;min-height:${t.h}px;--nota:${t.cor ?? CORES_NOTA[0][0]}`, title: "Duplo clique para editar" },
      h("span", { class: "vs-alfinete", html: icone("alfinete", 14), "aria-hidden": "true" }),
      h("div", { class: "vs-nota-txt" }, t.texto || "Nota"),
      h("div", { class: "vs-redim", "data-redim": "t:" + t.id, "aria-hidden": "true" }))));
    this.desenharFios();
    // estado vazio
    this.vazio.hidden = g.nos.length > 0 || g.notas.length > 0;
    if (!this.vazio.hidden) this.vazio.replaceChildren(
      h("div", { class: "vs-vazio-cartao" },
        h("div", { class: "vs-vazio-ic", html: icone("nos", 30) }),
        h("h3", {}, "Comece por um evento"),
        h("p", {}, "Todo fluxo nasce num evento (um clique, a interface abrindo, uma tecla). Ligue a saída ▶ dele às ações."),
        h("div", { class: "vs-vazio-bts" },
          h("button", { type: "button", class: "vs-bt-pri", onclick: () => this.criarNo("ev.iniciar", ...this.centroVisivel().map((v, i) => v - (i ? 30 : 110))) }, "Ao iniciar"),
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => { const r = this.tela.getBoundingClientRect(); this.abrirBuscaNos(r.left + r.width / 2 - 160, r.top + r.height / 2 - 120, { categoria: "eventos" }); } }, "Escolher evento…"),
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.inserirExemplo() }, "Inserir exemplo"),
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.inserirMenuExemplo() }, "✦ Menu de sistema"),
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.abrirImportar() }, "Importar .txt")),
        h("p", { class: "vs-vazio-dica" }, h("kbd", {}, "Espaço"), " ou clique direito abre a busca · arraste da paleta ou dos elementos")));
    this.renderBarraSel();
    this.renderZoom();
    this.desenharMinimapa();
  }
  elNo(no, ligadas, saem, prob) {
    const d = this.def(no);
    const w = this.largura(no);
    const sel = this.sel.has("n:" + no.id);
    if (!d) return h("div", { class: "vs-no vs-desconhecido", "data-no": no.id, style: `left:${no.x}px;top:${no.y}px;width:${w}px` }, h("div", { class: "vs-no-cab" }, `Nó desconhecido: ${no.tipo}`));
    const cat = CATEGORIAS[d.cat];
    if (d.desvio) {
      const t = this.tipo(no.id, "out", "sai");
      return h("div", { class: `vs-no vs-desvio ${sel ? "sel" : ""}`, "data-no": no.id, style: `left:${no.x}px;top:${no.y}px;--pt:${TIPOS[t]?.cor ?? "#ccc"}`, title: "Desvio" },
        h("span", { class: "vs-porta vs-porta-desvio ent", "data-no": no.id, "data-porta": "in", "data-lado": "ent" }),
        h("span", { class: "vs-porta vs-porta-desvio sai", "data-no": no.id, "data-porta": "out", "data-lado": "sai" }));
    }
    const conta = this.contagem.get(this.g.id + "|" + no.id);
    const sub = this.subtitulo(no);
    const linhas = [];
    const rows = Math.max(1, d.ent.length, d.sai.length);
    for (let i = 0; i < rows; i++) {
      const pe = d.ent[i], ps = d.sai[i];
      linhas.push(h("div", { class: "vs-linha" },
        h("div", { class: "vs-lado-ent" }, pe ? this.elEntrada(no, pe, ligadas.has(no.id + "|" + pe.id)) : null),
        h("div", { class: "vs-lado-sai" }, ps ? this.elSaida(no, ps, saem.has(no.id + "|" + ps.id)) : null)));
    }
    return h("div", { class: `vs-no ${d.evento ? "evento" : d.puro ? "puro" : "acao"} ${sel ? "sel" : ""} ${no.desativado ? "desativado" : ""} ${prob ? "com-" + prob.nivel : ""}`, "data-no": no.id, style: `left:${no.x}px;top:${no.y}px;width:${w}px;--cat:${cat.cor}` },
      no.nota ? h("div", { class: "vs-bolha", title: "Comentário do nó" }, no.nota) : null,
      h("div", { class: "vs-no-cab", title: `${d.nome} — ${d.desc}${prob ? "\n⚠ " + prob.msg : ""}` },
        h("span", { class: "vs-no-ic", html: icone(d.evento ? "raio" : d.puro ? "info" : cat.icone, 13), "aria-hidden": "true" }),
        h("span", { class: "vs-no-tit" }, this.titulo(no), sub ? h("small", {}, sub) : null),
        prob ? h("span", { class: `vs-no-alerta ${prob.nivel}`, title: prob.msg, html: icone("alerta", 13) }) : null,
        conta ? h("span", { class: "vs-cont", title: "Execuções nesta sessão de prévia" }, `×${conta}`) : null),
      h("div", { class: "vs-no-corpo" }, linhas));
  }
  elEntrada(no, p, ligada) {
    const t = p.prop ? null : p.tipo;
    const pt = t ? h("span", { class: `vs-porta ${t === "exec" ? "exec" : "dado"} ${ligada ? "ligada" : ""}`, style: `--pt:${TIPOS[t]?.cor}`, "data-no": no.id, "data-porta": p.id, "data-lado": "ent", title: `${p.nome || "Entrada"} · ${TIPOS[t]?.nome}` }) : null;
    const rot = p.nome ? h("span", { class: "vs-rot-porta" }, p.nome) : null;
    const editor = t === "exec" || ligada ? null : this.editorValor(no, p, true);
    return [pt, rot, editor];
  }
  elSaida(no, p, ligada) {
    return [p.nome ? h("span", { class: "vs-rot-porta" }, p.nome) : null,
      h("span", { class: `vs-porta ${p.tipo === "exec" ? "exec" : "dado"} ${ligada ? "ligada" : ""}`, style: `--pt:${TIPOS[p.tipo]?.cor}`, "data-no": no.id, "data-porta": p.id, "data-lado": "sai", title: `${p.nome || "Saída"} · ${TIPOS[p.tipo]?.nome}` })];
  }
  /** Editor de valor de uma entrada (no nó, compacto; no inspetor, completo). */
  editorValor(no, p, compacto) {
    const salvar = x => this.mudar(`${this.titulo(no)}: ${p.nome || p.id}`, (s, g) => { const alvo = g.nos.find(y => y.id === no.id); alvo.v = { ...(alvo.v ?? {}), [p.id]: x }; });
    return this.controle(p, no.v?.[p.id], salvar, `${no.id}.${p.id}${compacto ? "" : ".i"}`, `${p.nome || p.id} de ${this.titulo(no)}`, compacto);
  }
  editorValorVar(v, p) {
    return this.controle(p, v.valor, x => this.mudar("valor inicial da variável", s => { s.variaveis.find(y => y.id === v.id).valor = x; }), "var.valor", `Valor inicial de ${v.nome}`, false);
  }
  controle(p, v, salvar, k, rot, compacto) {
    const cls = `vs-ed ${compacto ? "compacto" : ""}`;
    if (p.tipo === "bool") return h("input", { type: "checkbox", class: `${cls} vs-check`, checked: !!v, "data-k": k, "aria-label": rot, onchange: e => salvar(e.target.checked) });
    if (p.tipo === "num") return h("input", { type: "number", class: cls, value: String(v ?? 0), step: "any", "data-k": k, "aria-label": rot, onchange: e => { const x = Number(e.target.value); if (Number.isFinite(x)) salvar(x); } });
    if (p.tipo === "el") {
      const els = this.elementos();
      return h("select", { class: cls, "data-k": k, "aria-label": rot, onchange: e => salvar(e.target.value) },
        h("option", { value: "" }, "— elemento —"),
        v && !els.some(e => e.id === v) ? h("option", { value: v, selected: true }, `${v} (ausente)`) : null,
        els.map(e => h("option", { value: e.id, selected: e.id === v }, e.nome)));
    }
    if (p.tipo === "var") {
      return h("select", { class: cls, "data-k": k, "aria-label": rot, onchange: e => { if (e.target.value === "__nova") { const nv = this.novaVariavel(); salvar(nv.id); } else salvar(e.target.value); } },
        h("option", { value: "" }, "— variável —"),
        this.s.variaveis.map(x => h("option", { value: x.id, selected: x.id === v }, x.nome)),
        h("option", { value: "__nova" }, "+ Nova variável…"));
    }
    if (p.tipo === "sel") return h("select", { class: cls, "data-k": k, "aria-label": rot, onchange: e => salvar(e.target.value) }, p.opcoes.map(([a, b]) => h("option", { value: a, selected: a === v }, b)));
    if (!compacto && p.tipo === "txt" && String(v ?? "").length > 24) return h("textarea", { class: cls, rows: 3, "data-k": k, "aria-label": rot, spellcheck: false, onchange: e => salvar(e.target.value) }, v ?? "");
    return h("input", { type: "text", class: cls, value: String(v ?? ""), "data-k": k, "aria-label": rot, spellcheck: false, placeholder: p.tipo === "any" ? "valor" : "", onchange: e => {
      let x = e.target.value;
      if (p.tipo === "any" && x.trim() !== "" && !Number.isNaN(Number(x))) x = Number(x);
      salvar(x);
    } });
  }

  // ---------------- fios ----------------
  cfgFios() {
    const u = this.ui;
    return { estilo: u.vsFioEstilo ?? "curva", anim: u.vsFioAnim ?? "unity", quais: u.vsFioQuais ?? "todos", vel: u.vsFioVel ?? 140, esp: u.vsFioEsp ?? 2.2, brilho: u.vsFioBrilho !== false,
      traco: u.vsFioTraco ?? "solido", pontaIni: u.vsFioPontaIni ?? "nenhuma", pontaFim: u.vsFioPontaFim ?? "nenhuma", desviar: u.vsFioDesviar !== false,
      rotulos: u.vsFioRotulos ?? "atividade", cor: u.vsFioCor ?? "tipo", seta: !!u.vsFioSeta, esmaecer: u.vsFioEsmaecer !== false, falhas: u.vsFioFalhas !== false, rastro: u.vsFioRastro !== false };
  }
  caminho(x1, y1, x2, y2, estilo = this.cfgFios().estilo) { return tracarFio(x1, y1, x2, y2, estilo); }
  /** Retângulos que os fios devem contornar: nós visíveis, pastas recolhidas e notas (com folga). */
  obstaculos(g = this.g) {
    const r = [], F = 14;
    for (const no of g.nos) { if (this.ocultos?.has(no.id)) continue; const desvio = this.def(no)?.desvio, f = desvio ? 4 : F; r.push([no.x - f, no.y - f, this.largura(no) + f * 2, this.altura(no) + f * 2]); }
    for (const gr of g.grupos) if (this.fechada(gr)) { const p = this.posG(gr); r.push([p.x - F, p.y - F, PASTA_L + F * 2, this.altPasta(gr) + F * 2]); }
    for (const t of g.notas) if (!this.notasOcultas?.has(t.id)) r.push([t.x - 6, t.y - 6, t.w + 12, t.h + 12]);
    return r;
  }
  /** Caminho de uma ligação: o conector escolhido; se ele atravessar nós, uma rota que desvia. A alça manual vence. */
  geoLigacao(l, a, b, estilo, cfg, obst, usados) {
    const [x1, y1] = this.posPorta(a, l.sp, "sai"), [x2, y2] = this.posPorta(b, l.ep, "ent");
    const base = geoFio(x1, y1, x2, y2, estilo, l.meio);
    base.x1 = x1; base.x2 = x2; base.y1 = y1; base.y2 = y2;
    if (obst && !Number.isFinite(l.meio) && colide(base.pts, obst)) {
      const pts = rotear([x1, y1], [x2, y2], obst, usados);
      if (pts) return { ...base, d: cantos(pts, RAIO_FIO[estilo] ?? 12), pts, rota: true, alca: pts[Math.floor(pts.length / 2)] };
    }
    if (usados) for (let i = 1; i < base.pts.length; i++) { const [ax, ay] = base.pts[i - 1], [bx, by] = base.pts[i], n = Math.ceil(Math.hypot(bx - ax, by - ay) / 16); for (let k = 0; k <= n; k++) usados.add(`${Math.floor((ax + (bx - ax) * k / n) / 16)}|${Math.floor((ay + (by - ay) * k / n) / 16)}`); }
    return base;
  }
  /** Animação efetiva de uma ligação: a escolha do próprio fio vence; senão vale a regra geral. */
  animDoFio(l, tipo, cfg) {
    if (l.anim) return l.anim;
    const q = cfg.quais;
    const vale = q === "todos" || (q === "exec" && tipo === "exec") || (q === "dados" && tipo !== "exec")
      || (q === "selecao" && (this.sel.has("n:" + l.de) || this.sel.has("n:" + l.para) || this.fioSel === l.id));
    return vale ? cfg.anim : "nenhuma";
  }
  aplicarVarsFio() {
    const c = this.cfgFios();
    this.raiz.style.setProperty("--vs-vel", String(c.vel));
    this.raiz.style.setProperty("--vs-esp", String(c.esp));
    this.raiz.classList.toggle("sem-brilho", !c.brilho);
  }
  desenharFios() {
    const g = this.g, cfg = this.cfgFios();
    this.aplicarVarsFio();
    this.fioEls = new Map();
    const partes = [], medir = [];
    const obst = cfg.desviar ? this.obstaculos(g) : null, usados = new Set();
    this.geoFios = new Map();
    const caidos = new Set(cfg.falhas ? this.problemas().filter(p => p.grafo === g.id && p.nivel === "erro" && p.no).map(p => p.no) : []);
    for (const l of g.ligacoes) {
      const a = this.no(l.de), b = this.no(l.para);
      if (!a || !b) continue;
      if (this.ocultos?.get(l.de) && this.ocultos.get(l.de) === this.ocultos.get(l.para)) continue; // dentro da mesma pasta recolhida
      const t = this.tipo(l.de, l.sp, "sai");
      const tt = t === "*" ? this.tipo(l.para, l.ep, "ent") : t;
      const estilo = l.estilo ?? cfg.estilo;
      const geo = this.geoLigacao(l, a, b, estilo, cfg, obst, usados), d = geo.d;
      this.geoFios.set(l.id, geo);
      const grupo = document.createElementNS(SVG_NS, "g");
      grupo.setAttribute("class", `vs-fio ${tt === "exec" ? "exec" : "dado"} ${this.fioSel === l.id ? "sel" : ""} ${a.desativado || b.desativado ? "desligado" : ""}`);
      grupo._cor = l.cor || TIPOS[tt]?.cor || "#ccc";
      grupo._ligacao = l;
      grupo.style.setProperty("--pt", grupo._cor);
      grupo.dataset.estilo = estilo;
      const caido = caidos.has(l.de) || caidos.has(l.para);
      if (caido) grupo.classList.add("falha");
      const hit = document.createElementNS(SVG_NS, "path"); hit.setAttribute("d", d); hit.setAttribute("class", "vs-fio-hit"); hit.dataset.fio = l.id;
      const p = document.createElementNS(SVG_NS, "path"); p.setAttribute("d", d); p.setAttribute("class", "vs-fio-linha");
      const traco = l.traco ?? cfg.traco;
      if (traco !== "solido") { p.style.strokeDasharray = dashFio(traco, cfg.esp * (tt === "exec" ? 1.35 : 1)); if (traco === "pontilhadoRedondo") p.style.strokeLinecap = "round"; }
      if (geo.rota) grupo.classList.add("desviado");
      grupo.append(hit, p);
      grupo._pontas = [l.pontaIni ?? cfg.pontaIni, l.pontaFim ?? cfg.pontaFim];
      const anim = a.desativado || b.desativado || caido ? "nenhuma" : this.animDoFio(l, tt, cfg);
      if (["pulso", "cometa", "particulas", "setas", "pacotes", "bidirecional"].includes(anim)) medir.push([grupo, p, d, anim]);
      else enfeitarFio(grupo, d, anim, cfg);
      const fluxo = document.createElementNS(SVG_NS, "path"); fluxo.setAttribute("d", d); fluxo.setAttribute("class", "vs-fio-fluxo"); fluxo.setAttribute("pathLength", "100");
      grupo.append(fluxo);
      partes.push(grupo);
      this.fioEls.set(`${l.de}|${l.sp}|${l.para}|${l.ep}`, grupo);
    }
    if (this.fioTemp) partes.push(this.fioTemp);
    this.svg.replaceChildren(...partes);
    // corpos que viajam precisam do comprimento real do caminho para manter a mesma velocidade em fios curtos e longos
    for (const [grupo, p, d, anim] of medir) {
      let comprimento = 200;
      try { comprimento = p.getTotalLength() || 200; } catch { /* sem geometria ainda */ }
      const fluxo = grupo.lastChild; fluxo.remove();
      enfeitarFio(grupo, d, anim, { ...cfg, comprimento });
      grupo.append(fluxo);
    }
    // pontas de seta (início e fim), como no PowerPoint
    const k = cfg.esp / 2.2;
    for (const grupo of this.fioEls.values()) {
      const [pi, pf] = grupo._pontas ?? [];
      for (const [qual, tipo] of [["ini", pi], ["fim", pf]]) {
        const def = PONTAS_FIO.find(x => x[0] === tipo);
        if (!def || !def[2]) continue;
        const pp = document.createElementNS(SVG_NS, "path");
        pp.setAttribute("class", `vs-ponta ${qual} ${tipo}`); pp.setAttribute("d", def[2]); pp.dataset.k = String(Math.max(0.7, k));
        grupo.append(pp);
      }
    }
    // alça amarela do fio selecionado: ajusta a dobra (conectores angulados e curvos)
    const lsel = this.fioSel && g.ligacoes.find(l => l.id === this.fioSel), geoSel = lsel && this.geoFios.get(lsel.id);
    if (geoSel && DOBRA_FIO.has(lsel.estilo ?? cfg.estilo) && geoSel.alca) {
      const al = document.createElementNS(SVG_NS, "g");
      al.setAttribute("class", "vs-alca"); al.dataset.fio = lsel.id;
      al.setAttribute("transform", `translate(${geoSel.alca[0].toFixed(1)} ${geoSel.alca[1].toFixed(1)})`);
      const r = document.createElementNS(SVG_NS, "path"); r.setAttribute("d", "M0 -7L7 0L0 7L-7 0Z");
      const ti = document.createElementNS(SVG_NS, "title"); ti.textContent = Number.isFinite(lsel.meio) ? "Arraste para ajustar a dobra · duplo clique volta ao automático" : "Arraste para ajustar a dobra deste fio";
      al.append(r, ti); this.svg.append(al);
    }
    // seta de direção no meio do enlace (mapas de rede)
    if (cfg.seta) for (const grupo of this.fioEls.values()) {
      const seta = document.createElementNS(SVG_NS, "path");
      seta.setAttribute("class", "vs-seta-dir"); seta.setAttribute("d", "M-5 -5 L4 0 L-5 5 Z");
      grupo.append(seta);
    }
    for (const grupo of this.fioEls.values()) this.posicionarExtras(grupo);
    this.tela.classList.toggle("esmaecer", !!this.frame && cfg.esmaecer);
    this.atualizarTelemetria();
    this.aplicarRastro();
  }
  /** Ponto e ângulo numa fração do comprimento do fio. */
  pontoFio(el, frac) {
    const p = el.querySelector(".vs-fio-linha"), d = p.getAttribute("d");
    if (el._dL !== d) { try { el._L = p.getTotalLength(); } catch { el._L = 0; } el._dL = d; }
    const L = el._L || 0;
    if (!L) return [0, 0, 0];
    const a = p.getPointAtLength(L * frac), b = p.getPointAtLength(Math.min(L, L * frac + 1.5));
    return [a.x, a.y, Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI];
  }
  posicionarExtras(el) {
    for (const x of el.querySelectorAll(".vs-ponta")) {
      const p = el.querySelector(".vs-fio-linha"); let L = 0;
      try { L = p.getTotalLength(); } catch { /* sem geometria */ }
      if (!L) continue;
      const fim = x.classList.contains("fim"), recuo = Math.min(6, L / 3);
      const a = p.getPointAtLength(fim ? Math.max(0, L - recuo - 3) : Math.min(L, recuo + 3)), b = p.getPointAtLength(fim ? L - recuo : recuo);
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      x.setAttribute("transform", `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${x.dataset.k})`);
    }
    for (const x of el.querySelectorAll(".vs-rotfio, .vs-seta-dir, .vs-salto")) {
      const ehSalto = x.classList.contains("vs-salto"), ehSeta = x.classList.contains("vs-seta-dir");
      const [px, py, ang] = this.pontoFio(el, ehSalto ? 0.22 : 0.5);
      x.setAttribute("transform", ehSeta ? `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${ang.toFixed(1)})` : `translate(${px.toFixed(1)} ${(py - (ehSalto ? 0 : 15)).toFixed(1)})`);
    }
  }
  /** Telemetria dos enlaces durante a prévia: cor por carga, espessura, rótulos de passagens/valores/latência. */
  atualizarTelemetria() {
    if (!this.fioEls) return;
    const cfg = this.cfgFios(), agora = Date.now(), gid = this.g.id;
    for (const [key, el] of this.fioEls) {
      const m = this.metricas.get(gid + "|" + key);
      const taxa = m ? m.ts.filter(t => agora - t < 3000).length / 3 : 0;
      if (cfg.cor === "calor" && !el._ligacao?.cor && !el.classList.contains("falha")) {
        const nivel = Math.min(1, taxa / 4);
        el.style.setProperty("--pt", m ? corCalor(Math.max(nivel, 0.04)) : "#4b5263");
        el.style.setProperty("--vs-esp", String(cfg.esp * (1 + nivel * 1.6)));
        el.classList.toggle("ocioso", !m || agora - m.ultimo > 3000);
      } else { el.style.setProperty("--pt", el._cor); el.style.removeProperty("--vs-esp"); el.classList.remove("ocioso"); }
      let texto = "", classe = "";
      if (el.classList.contains("falha")) { texto = "✕ falha"; classe = "erro"; }
      else if (m && cfg.rotulos === "atividade") texto = `×${m.n}${taxa ? ` · ${taxa.toFixed(1)}/s` : ""}`;
      else if (m && cfg.rotulos === "valores") texto = m.valor !== undefined ? fmtValor(m.valor) : `×${m.n}`;
      else if (m && cfg.rotulos === "latencia") texto = m.lat != null ? `${m.lat} ms` : m.valor !== undefined ? fmtValor(m.valor) : "";
      this.rotuloFio(el, texto, classe);
    }
  }
  rotuloFio(el, texto, classe = "") {
    let r = el.querySelector(".vs-rotfio");
    if (!texto) { r?.remove(); return; }
    if (!r) {
      r = document.createElementNS(SVG_NS, "g"); r.setAttribute("class", "vs-rotfio");
      r.append(document.createElementNS(SVG_NS, "rect"), document.createElementNS(SVG_NS, "text"));
      el.append(r);
    }
    if (r._t === texto && r._c === classe) return;
    r._t = texto; r._c = classe;
    r.setAttribute("class", `vs-rotfio ${classe}`);
    const w = Math.round(texto.length * 6.3 + 14);
    const [rect, t] = r.children;
    rect.setAttribute("x", -w / 2); rect.setAttribute("y", -9); rect.setAttribute("width", w); rect.setAttribute("height", 18); rect.setAttribute("rx", 9);
    t.textContent = texto;
    this.posicionarExtras(el);
  }
  agendarTelemetria() {
    if (this._rafTel) return;
    this._rafTel = requestAnimationFrame(() => { this._rafTel = null; this.atualizarTelemetria(); });
  }

  // ---------------- rastro do caminho (traceroute dos comandos) ----------------
  defNo(gid, id) { const g = this.s.grafos.find(x => x.id === gid); return this.def(g?.nos.find(n => n.id === id)); }
  passoRastro(d) {
    const ehEvento = d.tipo === "no" && this.defNo(d.grafo, d.no)?.evento;
    let r = this.rastros[this.rastros.length - 1];
    // eventos disparados dentro de uma cadeia (Disparar evento, Ao mudar variável) continuam o mesmo caminho
    if (ehEvento && !(r && d.t - r.fim < 6)) {
      r = { id: ++this.seqRastro, grafo: d.grafo, evento: d.no, inicio: d.t, fim: d.t, passos: [] };
      this.rastros.push(r);
      if (this.rastros.length > 30) this.rastros.shift();
      if (!this.rastroFixo) this.rastroVer = r.id;
    }
    if (!r || r.passos.length > 600) return;
    r.passos.push({ tipo: d.tipo, grafo: d.grafo, no: d.no, de: d.de, sp: d.sp, para: d.para, ep: d.ep, t: d.t });
    r.fim = d.t;
    if (r.id === this.rastroVer && !this._rafRastro) this._rafRastro = requestAnimationFrame(() => { this._rafRastro = null; this.aplicarRastro(); });
  }
  aplicarRastro() {
    if (!this.fioEls) return;
    for (const x of this.svg.querySelectorAll(".vs-salto")) x.remove();
    for (const x of this.svg.querySelectorAll(".vs-fio.rastro")) x.classList.remove("rastro");
    this.noEls?.forEach(el => el.classList.remove("no-rastro"));
    this.pastaEls?.forEach(el => el.classList.remove("no-rastro"));
    const r = this.cfgFios().rastro ? this.rastros.find(x => x.id === this.rastroVer) : null;
    this.tela.classList.toggle("com-rastro", !!r && r.passos.some(p => p.grafo === this.g.id));
    this.renderBarraRastro(r);
    if (!r) return;
    let salto = 0;
    const nums = new Map();
    for (const p of r.passos) {
      if (p.tipo === "fio") salto++;
      if (p.grafo !== this.g.id) continue;
      if (p.tipo === "no") { (this.noEls?.get(p.no) ?? this.pastaEls?.get(this.ocultos?.get(p.no)?.id))?.classList.add("no-rastro"); continue; }
      const el = this.fioEls.get(`${p.de}|${p.sp}|${p.para}|${p.ep}`);
      if (!el) continue;
      el.classList.add("rastro");
      if (p.tipo === "fio") { if (!nums.has(el)) nums.set(el, []); nums.get(el).push(salto); }
    }
    for (const [el, lista] of nums) {
      const b = document.createElementNS(SVG_NS, "g"); b.setAttribute("class", "vs-salto");
      const c = document.createElementNS(SVG_NS, "circle"); c.setAttribute("r", "9");
      const t = document.createElementNS(SVG_NS, "text"); t.textContent = lista.length > 1 ? `${lista[0]}+` : String(lista[0]);
      const ti = document.createElementNS(SVG_NS, "title"); ti.textContent = `Salto ${lista.join(", ")} do caminho`;
      b.append(c, t, ti); el.append(b);
      this.posicionarExtras(el);
    }
  }
  renderBarraRastro(r) {
    const b = this.barraRastro;
    if (!b) return;
    b.hidden = !r;
    if (!r) return;
    const nos = r.passos.filter(p => p.tipo === "no");
    const saltos = r.passos.filter(p => p.tipo === "fio").length;
    const i = this.rastros.indexOf(r);
    const nomeNo = p => { const g = this.s.grafos.find(x => x.id === p.grafo), n = g?.nos.find(x => x.id === p.no); return n ? this.titulo(n) + (this.def(n)?.evento && this.subtitulo(n) ? ` · ${this.subtitulo(n)}` : "") : "?"; };
    const lista = nos.length > 9 ? [...nos.slice(0, 4), null, ...nos.slice(-4)] : nos;
    const bt = (ic, tit, fn, desab) => h("button", { type: "button", class: "vs-mini", title: tit, "aria-label": tit, disabled: desab, html: icone(ic, 13), onclick: fn });
    b.replaceChildren(
      h("span", { class: "vs-rastro-tit" }, h("span", { html: icone("topologia", 13) }), "Caminho"),
      bt("setaEsq", "Caminho anterior", () => { this.rastroFixo = true; this.rastroVer = this.rastros[Math.max(0, i - 1)].id; this.aplicarRastro(); }, i <= 0),
      h("small", { class: "vs-rastro-n" }, `${i + 1}/${this.rastros.length}`),
      bt("setaDir", "Próximo caminho", () => { this.rastroVer = this.rastros[Math.min(this.rastros.length - 1, i + 1)].id; this.rastroFixo = i + 1 < this.rastros.length - 1; this.aplicarRastro(); }, i >= this.rastros.length - 1),
      this.rastroFixo ? h("button", { type: "button", class: "vs-rastro-vivo", title: "Seguir sempre o caminho mais recente", onclick: () => { this.rastroFixo = false; this.rastroVer = this.rastros[this.rastros.length - 1]?.id; this.aplicarRastro(); } }, "Ao vivo") : h("span", { class: "vs-rastro-vivo ativo", title: "Mostrando o caminho mais recente" }, "● ao vivo"),
      h("ol", { class: "vs-rastro-passos" }, lista.map(p => p ? h("li", {}, h("button", { type: "button", onclick: () => this.irPara(p.grafo, p.no), title: p.grafo !== this.g.id ? "Em outro grafo" : "" }, nomeNo(p))) : h("li", { class: "elipse" }, "…"))),
      h("small", { class: "vs-rastro-info" }, `${saltos} salto(s) · ${Math.max(0, r.fim - r.inicio)} ms`),
      bt("play", "Reproduzir o caminho passo a passo", () => this.reproduzirRastro(r)),
      bt("fechar", "Limpar caminhos", () => { this.rastros = []; this.rastroVer = null; this.rastroFixo = false; this.aplicarRastro(); }));
  }
  reproduzirRastro(r) {
    clearTimeout(this._tRepro);
    const passos = r.passos.filter(p => p.grafo === this.g.id && p.tipo !== "dado");
    let i = 0;
    const tela = this.tela; tela.classList.add("reproduzindo");
    const prox = () => {
      const p = passos[i++];
      if (!p) { tela.classList.remove("reproduzindo"); return; }
      if (p.tipo === "no") this.acenderNo({ grafo: p.grafo, no: p.no }, true);
      else this.efeitoFio(this.fioEls.get(`${p.de}|${p.sp}|${p.para}|${p.ep}`), 1);
      this._tRepro = setTimeout(prox, p.tipo === "no" ? 160 : 320);
    };
    prox();
  }

  /** Só atualiza a geometria (durante o arraste). Com desvio ligado, todos os fios podem mudar de rota. */
  atualizarFios(ids) {
    this._idsFios = this._idsFios === undefined ? ids : (this._idsFios && ids ? new Set([...this._idsFios, ...ids]) : null);
    if (this._rafFios) return;
    this._rafFios = requestAnimationFrame(() => { const x = this._idsFios; this._rafFios = null; this._idsFios = undefined; this.atualizarFiosAgora(x); });
  }
  atualizarFiosAgora(ids) {
    const g = this.g, cfg = this.cfgFios();
    const obst = cfg.desviar ? this.obstaculos(g) : null, usados = new Set();
    for (const l of g.ligacoes) {
      const el = this.fioEls?.get(`${l.de}|${l.sp}|${l.para}|${l.ep}`); if (!el) continue;
      if (!obst && ids && !ids.has(l.de) && !ids.has(l.para)) continue;
      const a = this.no(l.de), b = this.no(l.para);
      const geo = this.geoLigacao(l, a, b, l.estilo ?? cfg.estilo, cfg, obst, usados), d = geo.d;
      this.geoFios?.set(l.id, geo);
      el.classList.toggle("desviado", !!geo.rota);
      if (el._d === d) continue;
      el._d = d;
      for (const p of el.querySelectorAll(":scope > path:not(.vs-seta-dir):not(.vs-ponta)")) p.setAttribute("d", d);
      for (const m of el.querySelectorAll("animateMotion")) m.setAttribute("path", d);
      this.posicionarExtras(el);
    }
    const al = this.svg.querySelector(".vs-alca"), geo = al && this.geoFios?.get(al.dataset.fio);
    if (geo?.alca) al.setAttribute("transform", `translate(${geo.alca[0].toFixed(1)} ${geo.alca[1].toFixed(1)})`);
  }
  // ---------------- aparência das ligações ----------------
  previaFio(estilo, anim, ativo, rotulo, aoEscolher) {
    const cfg = this.cfgFios();
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 84 34"); svg.setAttribute("class", "vs-prev-svg"); svg.setAttribute("aria-hidden", "true");
    const d = tracarFio(8, 26, 76, 8, estilo);
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "vs-fio exec");
    g.style.setProperty("--pt", "#e9edf5");
    const p = document.createElementNS(SVG_NS, "path"); p.setAttribute("d", d); p.setAttribute("class", "vs-fio-linha");
    g.append(p);
    enfeitarFio(g, d, anim, { ...cfg, vel: cfg.vel * 0.55, esp: Math.min(2.2, cfg.esp), comprimento: 90 });
    if (anim === "unity") g.classList.add("unity-ativo");
    for (const [x, y] of [[8, 26], [76, 8]]) { const c = document.createElementNS(SVG_NS, "circle"); c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", "3"); c.setAttribute("class", "vs-prev-ponta"); g.append(c); }
    svg.append(g);
    return h("button", { type: "button", class: "vs-prev", "aria-pressed": String(!!ativo), title: rotulo, onclick: aoEscolher }, svg, h("span", {}, rotulo));
  }
  previaTraco(traco, ativo, rotulo, fn) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 84 14"); svg.setAttribute("class", "vs-prev-svg traco"); svg.setAttribute("aria-hidden", "true");
    const p = document.createElementNS(SVG_NS, "path"); p.setAttribute("d", "M6 7H78");
    p.setAttribute("style", `stroke:#e9edf5;stroke-width:2.4;fill:none;stroke-dasharray:${dashFio(traco, 2.4) || "none"};stroke-linecap:${traco === "pontilhadoRedondo" ? "round" : "butt"}`);
    svg.append(p);
    return h("button", { type: "button", class: "vs-prev", "aria-pressed": String(!!ativo), title: rotulo, onclick: fn }, svg, h("span", {}, rotulo));
  }
  seletorPonta(atual, fn, inicio) {
    return h("div", { class: "vs-pontas", role: "radiogroup", "aria-label": inicio ? "Ponta inicial" : "Ponta final" }, PONTAS_FIO.map(([v, r, d]) => {
      const svg = `<svg viewBox="-22 -8 26 16" width="30" height="16" aria-hidden="true" style="transform:${inicio ? "scaleX(-1)" : "none"}"><path d="M-22 0H${d ? -3 : 2}" stroke="#e9edf5" stroke-width="1.8"/>${d ? `<path d="${d}" transform="scale(.9)" fill="${v === "aberta" ? "none" : "#e9edf5"}" stroke="#e9edf5" stroke-width="${v === "aberta" ? 1.6 : 0}"/>` : ""}</svg>`;
      return h("button", { type: "button", role: "radio", "aria-checked": String(v === atual), title: r, "aria-label": r, html: svg, onclick: () => fn(v) });
    }));
  }
  alternarPopFios() {
    if (this.popFios) { this.fecharPopFios(); return; }
    this.popFios = h("div", { class: "vs-pop-fios", role: "dialog", "aria-label": "Aparência das ligações" });
    this.tela.append(this.popFios);
    this.renderPopFios();
    this.popFios.querySelector("[aria-pressed='true']")?.focus();
    this._foraPop = e => { if (this.popFios && !this.popFios.contains(e.target) && !e.target.closest?.("[data-bt-fios]")) this.fecharPopFios(); };
    this._escPop = e => { if (e.key === "Escape" && this.popFios) { e.stopPropagation(); this.fecharPopFios(); this.tela.focus(); } };
    document.addEventListener("pointerdown", this._foraPop, true);
    this.popFios.addEventListener("keydown", this._escPop);
    this.renderZoom();
  }
  fecharPopFios() {
    this.popFios?.remove(); this.popFios = null;
    document.removeEventListener("pointerdown", this._foraPop, true);
    this.renderZoom();
  }
  definirFios(chave, valor) {
    this.ui[chave] = valor; this.salvarUI();
    this.desenharFios(); if (this.popFios) this.renderPopFios();
  }
  renderPopFios() {
    const cfg = this.cfgFios();
    const individuais = this.s.grafos.reduce((k, g) => k + g.ligacoes.filter(l => l.estilo || l.anim || l.cor || l.traco || l.pontaIni || l.pontaFim || Number.isFinite(l.meio)).length, 0);
    const seg = (opcoes, atual, fn, rot) => h("div", { class: "vs-seg", role: "radiogroup", "aria-label": rot }, opcoes.map(([v, r]) => h("button", { type: "button", role: "radio", "aria-checked": String(v === atual), onclick: () => fn(v) }, r)));
    const foco = this.popFios.contains(document.activeElement) ? document.activeElement.title || document.activeElement.textContent : null;
    this.popFios.replaceChildren(
      h("header", {}, h("strong", {}, "Ligações"), h("button", { type: "button", class: "vs-mini", "aria-label": "Fechar", html: icone("fechar", 14), onclick: () => this.fecharPopFios() })),
      h("div", { class: "vs-pop-sec" }, h("span", { class: "vs-pop-tit" }, "Conector (tipos do PowerPoint)"),
        h("div", { class: "vs-prevs" }, ESTILOS_FIO.map(([v, r]) => this.previaFio(v, "nenhuma", cfg.estilo === v, r, () => this.definirFios("vsFioEstilo", v))))),
      h("div", { class: "vs-pop-sec" }, h("span", { class: "vs-pop-tit" }, "Linha"),
        h("label", { class: "vs-campo-linha vs-desviar", title: "Fios contornam os nós em vez de passar por cima ou por baixo deles" }, h("input", { type: "checkbox", checked: cfg.desviar, onchange: e => this.definirFios("vsFioDesviar", e.target.checked) }), h("strong", {}, "Desviar dos nós"), h("small", {}, "rotas automáticas pelos espaços livres")),
        h("div", { class: "vs-prevs vs-prevs-traco" }, TRACOS_FIO.map(([v, r]) => this.previaTraco(v, cfg.traco === v, r, () => this.definirFios("vsFioTraco", v)))),
        h("div", { class: "vs-pop-2", style: "margin-top:8px" },
          h("label", {}, h("span", { class: "vs-pop-tit" }, "Ponta inicial"), this.seletorPonta(cfg.pontaIni, v => this.definirFios("vsFioPontaIni", v), true)),
          h("label", {}, h("span", { class: "vs-pop-tit" }, "Ponta final"), this.seletorPonta(cfg.pontaFim, v => this.definirFios("vsFioPontaFim", v), false)))),
      h("div", { class: "vs-pop-sec" }, h("span", { class: "vs-pop-tit" }, "Animação"),
        h("div", { class: "vs-prevs" }, ANIMS_FIO.map(([v, r]) => this.previaFio("curva", v, cfg.anim === v, r, () => this.definirFios("vsFioAnim", v))))),
      h("div", { class: "vs-pop-sec" }, h("span", { class: "vs-pop-tit" }, "Animar"), seg(QUAIS_FIO, cfg.quais, v => this.definirFios("vsFioQuais", v), "Quais ligações animam")),
      h("div", { class: "vs-pop-sec vs-pop-2" },
        h("label", {}, h("span", { class: "vs-pop-tit" }, "Velocidade ", h("output", {}, VELOCIDADES.reduce((m, x) => Math.abs(x[0] - cfg.vel) < Math.abs(m[0] - cfg.vel) ? x : m)[1])),
          h("input", { type: "range", min: 30, max: 420, step: 10, value: String(cfg.vel), "aria-label": "Velocidade da animação",
            oninput: e => { this.ui.vsFioVel = Number(e.target.value); this.aplicarVarsFio(); e.target.previousElementSibling.querySelector("output").textContent = `${e.target.value} px/s`; },
            onchange: () => this.definirFios("vsFioVel", this.ui.vsFioVel) })),
        h("label", {}, h("span", { class: "vs-pop-tit" }, "Espessura ", h("output", {}, `${cfg.esp.toFixed(1)} px`)),
          h("input", { type: "range", min: 1, max: 5, step: 0.2, value: String(cfg.esp), "aria-label": "Espessura dos fios",
            oninput: e => { this.ui.vsFioEsp = Number(e.target.value); this.aplicarVarsFio(); e.target.previousElementSibling.querySelector("output").textContent = `${Number(e.target.value).toFixed(1)} px`; },
            onchange: () => this.definirFios("vsFioEsp", this.ui.vsFioEsp) }))),
      h("div", { class: "vs-pop-sec" }, h("span", { class: "vs-pop-tit" }, "Ao testar (prévia ao vivo)"),
        h("div", { class: "vs-pop-checks" },
          [["vsFioRastro", cfg.rastro, "Rastro do caminho", "Acende a rota completa do último comando, com a ordem dos saltos (traceroute)"],
           ["vsFioEsmaecer", cfg.esmaecer, "Esmaecer o que não roda", "Como no Unity: o que não está executando fica apagado"],
           ["vsFioFalhas", cfg.falhas, "Link caído em vermelho", "Fios ligados a nós com erro piscam como enlace fora do ar"],
           ["vsFioSeta", cfg.seta, "Seta de direção", "Seta no meio de cada fio, como em mapas de rede"]].map(([k, v, r, t]) =>
            h("label", { class: "vs-campo-linha", title: t }, h("input", { type: "checkbox", checked: v, onchange: e => this.definirFios(k, e.target.checked) }), r))),
        h("div", { class: "vs-pop-2" },
          h("div", {}, h("span", { class: "vs-pop-tit" }, "Rótulos no fio"), seg(ROTULOS_FIO, cfg.rotulos, v => this.definirFios("vsFioRotulos", v), "Rótulos de telemetria")),
          h("div", {}, h("span", { class: "vs-pop-tit" }, "Cor"), seg(CORES_FIO, cfg.cor, v => this.definirFios("vsFioCor", v), "Cor dos fios"))),
        cfg.cor === "calor" ? h("div", { class: "vs-legenda-calor" }, h("span", {}, "ocioso"), h("i", {}), h("span", {}, "carga alta")) : null),
      h("div", { class: "vs-pop-sec vs-pop-linha" },
        h("label", { class: "vs-campo-linha" }, h("input", { type: "checkbox", checked: cfg.brilho, onchange: e => this.definirFios("vsFioBrilho", e.target.checked) }), "Brilho neon"),
        individuais ? h("button", { type: "button", class: "vs-link", title: "Fios com traçado, animação ou cor próprios voltam ao padrão", onclick: () => this.mudar("limpar estilos dos fios", s2 => { for (const g of s2.grafos) for (const l of g.ligacoes) { for (const k of ["estilo", "anim", "cor", "traco", "pontaIni", "pontaFim", "meio"]) delete l[k]; } }) }, `Limpar ${individuais} fio(s) personalizados`) : h("small", {}, "Personalize um fio selecionando-o")),
      h("p", { class: "vs-pop-dica" }, "“Unity” anima só o fio por onde o comando está passando. Animações respeitam “reduzir movimento” do sistema."));
    if (foco) [...this.popFios.querySelectorAll("button")].find(b => (b.title || b.textContent) === foco)?.focus();
  }
  /** Controles de aparência para uma ou várias ligações (inspetor). */
  controlesFio(ligs, texto) {
    const um = ligs.length === 1 ? ligs[0] : null, cfg = this.cfgFios();
    const ids = new Set(ligs.map(l => l.id));
    const aplicar = (k, v, t) => this.mudar(t, (s2, g) => { for (const l of g.ligacoes) if (ids.has(l.id)) { if (v) l[k] = v; else delete l[k]; } });
    const valor = k => { const vs = new Set(ligs.map(l => l[k] ?? "")); return vs.size === 1 ? [...vs][0] : "__misto"; };
    const sel = (k, opcoes, padrao, rot) => {
      const v = valor(k);
      return h("label", { class: "vs-campo" }, h("span", {}, rot),
        h("select", { class: "vs-ed", "data-k": `fio.${k}`, onchange: e => aplicar(k, e.target.value, `${rot.toLowerCase()} de ${texto}`) },
          v === "__misto" ? h("option", { value: "__misto", selected: true, disabled: true }, "Vários") : null,
          h("option", { value: "", selected: v === "" }, `Padrão (${opcoes.find(o => o[0] === padrao)?.[1]})`),
          opcoes.map(([o, r]) => h("option", { value: o, selected: v === o }, r))));
    };
    const cor = valor("cor");
    const comMeio = ligs.filter(l => Number.isFinite(l.meio)).length;
    return [sel("estilo", ESTILOS_FIO, cfg.estilo, "Conector"), sel("traco", TRACOS_FIO.map(t => [t[0], t[1]]), cfg.traco, "Traço"),
      h("div", { class: "vs-pop-2" }, sel("pontaIni", PONTAS_FIO.map(t => [t[0], t[1]]), cfg.pontaIni, "Ponta inicial"), sel("pontaFim", PONTAS_FIO.map(t => [t[0], t[1]]), cfg.pontaFim, "Ponta final")),
      comMeio ? h("p", { class: "vs-dica" }, `Dobra ajustada à mão${um ? "" : ` em ${comMeio} fio(s)`} (não desvia sozinho). `, h("button", { type: "button", class: "vs-link", onclick: () => this.mudar("dobra automática", (s2, g) => { for (const l of g.ligacoes) if (ids.has(l.id)) delete l.meio; }) }, "Voltar ao automático")) : (um && DOBRA_FIO.has(um.estilo ?? cfg.estilo) ? h("p", { class: "vs-dica" }, "Arraste a alça amarela ◆ no fio para ajustar a dobra.") : null),
      sel("anim", ANIMS_FIO, cfg.anim, "Animação"),
      h("div", { class: "vs-campo" }, h("span", {}, "Cor"),
        h("div", { class: "vs-cor-fio" },
          h("input", { type: "color", class: "vs-cor-amostra", value: /^#[0-9a-f]{6}$/i.test(cor) ? cor : "#e9edf5", "aria-label": "Cor do fio", onchange: e => aplicar("cor", e.target.value, `cor de ${texto}`) }),
          h("span", {}, cor && cor !== "__misto" ? cor : cor === "__misto" ? "Várias" : "Cor do tipo"),
          cor ? h("button", { type: "button", class: "vs-link", onclick: () => aplicar("cor", "", `cor de ${texto}`) }, "Usar cor do tipo") : null))];
  }

  // ---------------- câmera, zoom e minimapa ----------------
  aplicarCamera() {
    const c = this.cam();
    this.mundo.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.z})`;
    const s = GRADE * c.z;
    this.tela.style.backgroundSize = `${s}px ${s}px, ${s}px ${s}px, ${s * 8}px ${s * 8}px, ${s * 8}px ${s * 8}px`;
    this.tela.style.backgroundPosition = `${c.x}px ${c.y}px`;
    this.tela.classList.toggle("longe", c.z < 0.55);
  }
  zoomEm(cx, cy, z) {
    const c = this.cam(), r = this.tela.getBoundingClientRect();
    z = Math.max(0.1, Math.min(2.5, z));
    const px = cx - r.left, py = cy - r.top;
    c.x = px - (px - c.x) * (z / c.z); c.y = py - (py - c.y) * (z / c.z); c.z = z;
    this.aplicarCamera(); this.renderZoom(); this.desenharMinimapa(); this.salvarUI();
  }
  renderZoom() {
    const c = this.cam(), r = () => this.tela.getBoundingClientRect();
    const bt = (rot, tit, fn) => h("button", { type: "button", title: tit, "aria-label": tit, onclick: fn }, rot);
    this.zoomCtl.replaceChildren(
      bt("−", "Afastar", () => { const b = r(); this.zoomEm(b.left + b.width / 2, b.top + b.height / 2, c.z / 1.2); }),
      bt(`${Math.round(c.z * 100)}%`, "Zoom 100%", () => { const b = r(); this.zoomEm(b.left + b.width / 2, b.top + b.height / 2, 1); }),
      bt("+", "Aproximar", () => { const b = r(); this.zoomEm(b.left + b.width / 2, b.top + b.height / 2, c.z * 1.2); }),
      h("button", { type: "button", title: "Enquadrar tudo (F)", "aria-label": "Enquadrar tudo", html: icone("telaCheia", 14), onclick: () => this.enquadrar() }),
      h("button", { type: "button", title: this.ui.vsEncaixe === false ? "Encaixe na grade: desligado" : "Encaixe na grade: ligado", "aria-pressed": String(this.ui.vsEncaixe !== false), html: icone("ima", 14), onclick: () => { this.ui.vsEncaixe = this.ui.vsEncaixe === false; this.salvarUI(); this.renderZoom(); } }),
      this.raiz.classList.contains("mobile") ? h("button", { type: "button", title: this.modoSelecao ? "Arrastar com um dedo seleciona (toque para voltar a mover a vista)" : "Arrastar com um dedo move a vista (toque para selecionar por área)", "aria-pressed": String(!!this.modoSelecao), html: icone(this.modoSelecao ? "selTudo" : "mao", 14), onclick: () => { this.modoSelecao = !this.modoSelecao; this.renderZoom(); } }) : "",
      h("button", { type: "button", "data-bt-fios": "", title: "Aparência das ligações: traçado e animação", "aria-label": "Aparência das ligações", "aria-expanded": String(!!this.popFios), html: icone("link", 14), onclick: () => this.alternarPopFios() }),
      h("button", { type: "button", title: this.ui.vsMinimapa === false ? "Mostrar minimapa" : "Esconder minimapa", "aria-pressed": String(this.ui.vsMinimapa !== false), html: icone("grade", 14), onclick: () => { this.ui.vsMinimapa = this.ui.vsMinimapa === false; this.salvarUI(); this.desenharMinimapa(); this.renderZoom(); } }));
  }
  limites(ids) {
    const g = this.g; let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    const somar = (x, y, w, hh) => { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x + w); y2 = Math.max(y2, y + hh); };
    for (const no of g.nos) if ((!ids || ids.has("n:" + no.id)) && !this.ocultos?.has(no.id)) somar(no.x, no.y, this.largura(no), this.altura(no));
    for (const gr of g.grupos) if (!ids || ids.has("c:" + gr.id)) { const f = this.fechada(gr), p = this.posG(gr); somar(p.x, p.y, f ? PASTA_L : gr.w, f ? this.altPasta(gr) : gr.h); }
    for (const t of g.notas) if ((!ids || ids.has("t:" + t.id)) && !this.notasOcultas?.has(t.id)) somar(t.x, t.y, t.w, t.h);
    return x1 === Infinity ? null : { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }
  enquadrar(ids) {
    const b = this.limites(ids?.size ? ids : null); if (!b) { Object.assign(this.cam(), { x: 80, y: 60, z: 1 }); this.aplicarCamera(); return; }
    const r = this.tela.getBoundingClientRect(), mob = this.raiz.classList.contains("mobile"), m = mob ? 16 : 60;
    // área livre de verdade: desconta a barra do Caminho (em cima) e a de zoom (embaixo)
    const topo = (this.barraRastro && !this.barraRastro.hidden ? (mob ? 46 : 40) : 0) + (mob ? 6 : 0), base = mob ? 52 : 0;
    const W = r.width - m * 2, H = r.height - m * 2 - topo - base;
    const z = Math.max(0.1, Math.min(1.25, Math.min(W / Math.max(1, b.w), Math.max(40, H) / Math.max(1, b.h))));
    Object.assign(this.cam(), { z, x: (r.width - b.w * z) / 2 - b.x * z, y: m + topo + (H - b.h * z) / 2 - b.y * z });
    this.aplicarCamera(); this.renderZoom(); this.desenharMinimapa(); this.salvarUI();
  }
  desenharMinimapa() {
    const cv = this.minimapa, ctx = cv.getContext("2d");
    const g = this.g;
    cv.hidden = this.ui.vsMinimapa === false || !g.nos.length;
    if (cv.hidden) return;
    const r = this.tela.getBoundingClientRect(), c = this.cam();
    const vista = { x: -c.x / c.z, y: -c.y / c.z, w: r.width / c.z, h: r.height / c.z };
    const b = this.limites() ?? vista;
    const x1 = Math.min(b.x, vista.x) - 40, y1 = Math.min(b.y, vista.y) - 40;
    const x2 = Math.max(b.x + b.w, vista.x + vista.w) + 40, y2 = Math.max(b.y + b.h, vista.y + vista.h) + 40;
    const k = Math.min(cv.width / (x2 - x1), cv.height / (y2 - y1));
    const ox = (cv.width - (x2 - x1) * k) / 2, oy = (cv.height - (y2 - y1) * k) / 2;
    this.mmT = { x1, y1, k, ox, oy };
    const X = x => ox + (x - x1) * k, Y = y => oy + (y - y1) * k;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const gr of g.grupos) { const f = this.fechada(gr), p = this.posG(gr), w = f ? PASTA_L : gr.w, hh = f ? this.altPasta(gr) : gr.h; ctx.fillStyle = corGrupo(gr) + (f ? "cc" : "33"); ctx.strokeStyle = corGrupo(gr) + "aa"; ctx.fillRect(X(p.x), Y(p.y), w * k, hh * k); ctx.strokeRect(X(p.x), Y(p.y), w * k, hh * k); }
    for (const no of g.nos) { if (this.ocultos?.has(no.id)) continue; const d = this.def(no); ctx.fillStyle = CATEGORIAS[d?.cat]?.cor ?? "#888"; ctx.globalAlpha = this.sel.has("n:" + no.id) ? 1 : 0.8; ctx.fillRect(X(no.x), Y(no.y), Math.max(2, this.largura(no) * k), Math.max(2, this.altura(no) * k)); }
    ctx.globalAlpha = 1;
    for (const t of g.notas) { ctx.fillStyle = t.cor ?? "#f6d365"; ctx.fillRect(X(t.x), Y(t.y), t.w * k, t.h * k); }
    ctx.strokeStyle = "#ffffffcc"; ctx.lineWidth = 1.5; ctx.strokeRect(X(vista.x), Y(vista.y), vista.w * k, vista.h * k);
  }

  // ---------------- barra flutuante da seleção ----------------
  renderBarraSel() {
    const nos = [...this.sel].filter(k => k.startsWith("n:"));
    this.renderBarraMobile?.();
    this.barraSel.hidden = !this.sel.size;
    if (this.barraSel.hidden) return;
    const bt = (ic, tit, fn, desab) => h("button", { type: "button", title: tit, "aria-label": tit, disabled: desab, html: icone(ic, 15), onclick: fn });
    this.barraSel.replaceChildren(
      h("span", { class: "vs-barra-txt" }, `${this.sel.size} selecionado(s)`),
      bt("alinhar", "Alinhar à esquerda", () => this.alinhar("esq"), nos.length < 2),
      bt("distV", "Alinhar pelo topo", () => this.alinhar("topo"), nos.length < 2),
      bt("distH", "Distribuir na vertical", () => this.alinhar("distV"), nos.length < 3),
      bt("camadas", "Criar grupo em volta (Ctrl+G)", () => this.agrupar(), !nos.length),
      h("button", { type: "button", class: "vs-bt-pasta-sel", title: "Guardar a seleção numa pasta recolhida (Ctrl+Shift+G)", "aria-label": "Guardar numa pasta", disabled: !nos.length, html: svgPasta("#e3a008", false, "geral", 18), onclick: () => this.agrupar(true) }),
      h("button", { type: "button", class: "vs-bt-pasta-sel", title: "Pasta Designer: forma, cor e efeitos", "aria-label": "Guardar numa pasta Designer", disabled: !nos.length, html: svgPasta(TIPOS_PASTA.visual.cor, false, "visual", 18), onclick: () => this.agrupar(false, "visual") }),
      h("button", { type: "button", class: "vs-bt-pasta-sel", title: "Pasta Código: conexões com outros menus e ferramentas", "aria-label": "Guardar numa pasta Código", disabled: !nos.length, html: svgPasta(TIPOS_PASTA.funcao.cor, false, "funcao", 18), onclick: () => this.agrupar(false, "funcao") }),
      bt("duplicar", "Duplicar (Ctrl+D)", () => this.duplicar()),
      bt("olhoFechado", "Desativar/ativar nós", () => this.alternarDesativado(), !nos.length),
      bt("excluir", "Remover (Delete)", () => this.remover()),
      this.raiz.classList.contains("mobile") ? h("button", { type: "button", class: "vs-bt-editar", title: "Editar propriedades", "aria-label": "Editar propriedades", onclick: () => this.abrirFolha("props") }, "Editar") : "");
  }

  // ================================================================
  // Interação com a tela
  // ================================================================
  ligarTela() {
    const t = this.tela;
    t.addEventListener("pointerdown", e => this.aoApertar(e));
    t.addEventListener("pointermove", e => { this.mouse = { x: e.clientX, y: e.clientY }; this.dicaSobreFio(e); });
    t.addEventListener("wheel", e => {
      e.preventDefault();
      // roda do mouse = zoom no ponteiro (como Unreal/Unity); trackpad de dois dedos = mover; pinça (Ctrl) = zoom
      const trackpad = e.deltaMode === 0 && (e.deltaX !== 0 || !Number.isInteger(e.deltaY) || Math.abs(e.deltaY) < 30);
      if (e.ctrlKey || e.metaKey || (!trackpad && !e.shiftKey)) {
        const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
        this.zoomEm(e.clientX, e.clientY, this.cam().z * Math.pow(1.0018, -dy));
      } else {
        const c = this.cam();
        c.x -= e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX; c.y -= e.shiftKey && !e.deltaX ? 0 : e.deltaY;
        this.aplicarCamera(); this.desenharMinimapa(); this.salvarUI();
      }
    }, { passive: false });
    t.addEventListener("contextmenu", e => e.preventDefault());
    t.addEventListener("dblclick", e => this.aoDuploClique(e));
    t.addEventListener("dragover", e => { if (e.dataTransfer.types.includes("text/x-vs") || e.dataTransfer.types.includes("Files")) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } });
    t.addEventListener("drop", e => this.aoSoltarArrastado(e));
    this.minimapa.addEventListener("pointerdown", e => {
      e.stopPropagation(); e.preventDefault();
      const ir = ev => {
        const b = this.minimapa.getBoundingClientRect(), m = this.mmT; if (!m) return;
        const wx = m.x1 + (ev.clientX - b.left - m.ox) / m.k, wy = m.y1 + (ev.clientY - b.top - m.oy) / m.k;
        const r = this.tela.getBoundingClientRect(), c = this.cam();
        c.x = r.width / 2 - wx * c.z; c.y = r.height / 2 - wy * c.z;
        this.aplicarCamera(); this.desenharMinimapa();
      };
      ir(e);
      const fim = () => { window.removeEventListener("pointermove", ir); window.removeEventListener("pointerup", fim); this.salvarUI(); };
      window.addEventListener("pointermove", ir); window.addEventListener("pointerup", fim);
    });
    new ResizeObserver(() => { if (this.raiz.isConnected && this.s) this.desenharMinimapa(); }).observe(t);
    window.addEventListener("pointermove", e => {
      if (e.pointerType !== "touch" || !this.toques?.has(e.pointerId)) return;
      const q = this.toques.get(e.pointerId); q.x = e.clientX; q.y = e.clientY;
      if (Math.hypot(q.x - q.x0, q.y - q.y0) > 9) clearTimeout(this._tLongo);
      if (this.pinca && this.toques.size === 2) this.atualizarPinca();
    }, { passive: true });
    const soltarToque = e => {
      if (!this.toques?.has(e.pointerId)) return;
      this.toques.delete(e.pointerId); clearTimeout(this._tLongo);
      if (this.pinca && this.toques.size < 2) { this.pinca = null; this.renderZoom(); this.desenharMinimapa(); this.salvarUI(); }
    };
    window.addEventListener("pointerup", soltarToque); window.addEventListener("pointercancel", soltarToque);
  }
  /** Um único lugar decide o que o ponteiro faz: fio, porta, nó, grupo, nota, pan ou seleção em área. */
  aoApertar(e) {
    const alvo = e.target;
    this.fecharFlutuantes();
    if (alvo.closest(".vs-minimapa, .vs-zoom, .vs-barra-sel, .vs-vazio-cartao, .vs-rastro, .vs-pop-fios")) return;
    if (alvo.closest("input, select, textarea, button, [contenteditable='true']")) return;
    if (this.raiz.classList.contains("mobile") && this.fecharFolhas()) return; // toque na tela fecha a gaveta/folha aberta
    if (e.pointerType === "touch" && this.toque(e)) return;
    if (document.activeElement !== this.tela) this.tela.focus({ preventScroll: true });
    const pan = e.button === 1 || e.button === 2 || this.espaco;
    if (pan) return this.iniciarPan(e, e.button === 2 && !this.espaco);
    if (e.button !== 0) return;
    const alca = alvo.closest(".vs-alca");
    if (alca) return this.iniciarAlca(e, alca.dataset.fio);
    const porta = alvo.closest(".vs-porta") ?? (e.pointerType === "touch" ? this.portaProxima(e.clientX, e.clientY, ".vs-porta", 20) : null);
    if (porta) return this.iniciarFio(e, porta);
    const redim = alvo.closest("[data-redim]");
    if (redim) return this.iniciarRedim(e, redim.dataset.redim);
    const fio = alvo.closest(".vs-fio-hit");
    if (fio) {
      const l = this.g.ligacoes.find(x => x.id === fio.dataset.fio);
      if (e.altKey) { this.mudar("cortar ligação", (s, g) => { g.ligacoes = g.ligacoes.filter(x => x.id !== l.id); }); return; }
      this.fioSel = l.id; this.sel.clear(); this.varSel = null; this.desenharFios(); this.renderInspetor(); this.renderBarraSel();
      return;
    }
    const noEl = alvo.closest(".vs-no"), grEl = alvo.closest(".vs-grupo-cab"), ntEl = alvo.closest(".vs-nota");
    const chave = noEl ? "n:" + noEl.dataset.no : ntEl ? "t:" + ntEl.dataset.nota : grEl ? "c:" + grEl.parentElement.dataset.grupo : null;
    if (chave) {
      if (noEl && e.altKey) { const id = noEl.dataset.no; this.mudar("desligar nó", (s, g) => { g.ligacoes = g.ligacoes.filter(l => l.de !== id && l.para !== id); }); return; }
      const somar = e.shiftKey || e.ctrlKey || e.metaKey;
      if (somar) { this.sel.has(chave) && (e.ctrlKey || e.metaKey) ? this.sel.delete(chave) : this.sel.add(chave); }
      else if (!this.sel.has(chave)) { this.sel.clear(); this.sel.add(chave); }
      this.fioSel = null; this.varSel = null;
      this.marcarSelecao();
      this.iniciarMover(e, chave);
      return;
    }
    if (e.pointerType === "touch" && !this.modoSelecao) return this.iniciarPan(e, false); // no toque, um dedo no vazio move a vista
    this.iniciarMarquee(e);
  }
  /** Porta mais próxima do ponto (o dedo não precisa acertar o pontinho). */
  portaProxima(x, y, seletor, raio) {
    let melhor = null, dist = raio;
    for (const p of this.tela.querySelectorAll(seletor)) {
      const r = p.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
      if (d < dist) { dist = d; melhor = p; }
    }
    return melhor;
  }
  /** Gestos de toque. Devolve true quando o gesto já foi tratado (pinça ou toque duplo). */
  toque(e) {
    this.toques ??= new Map();
    this.toques.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    clearTimeout(this._tLongo);
    if (this.toques.size === 2) { this.iniciarPinca(); return true; }
    if (this.toques.size > 2) return true;
    const x0 = e.clientX, y0 = e.clientY, alvo = e.target, agora = Date.now();
    if (this._ultToque && agora - this._ultToque.t < 320 && Math.hypot(x0 - this._ultToque.x, y0 - this._ultToque.y) < 26) {
      this._ultToque = null;
      this.aoDuploClique({ target: alvo, clientX: x0, clientY: y0 });
      return true;
    }
    this._ultToque = { t: agora, x: x0, y: y0 };
    // toque longo = menu de contexto (no vazio, a busca de nós)
    this._tLongo = setTimeout(() => {
      if (!this.toques?.has(e.pointerId)) return;
      this.arrasto?.cancelar?.();
      navigator.vibrate?.(12);
      this.menuContexto({ clientX: x0, clientY: y0 });
    }, 480);
    return false;
  }
  iniciarPinca() {
    this.arrasto?.cancelar?.();
    clearTimeout(this._tLongo);
    const [a, b] = [...this.toques.values()], c = this.cam();
    this.pinca = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: c.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cx: c.x, cy: c.y };
  }
  atualizarPinca() {
    const [a, b] = [...this.toques.values()], p = this.pinca, r = this.tela.getBoundingClientRect(), c = this.cam();
    const z = Math.max(0.1, Math.min(2.5, p.z0 * Math.hypot(a.x - b.x, a.y - b.y) / p.d0));
    const wx = (p.mx - r.left - p.cx) / p.z0, wy = (p.my - r.top - p.cy) / p.z0, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    c.z = z; c.x = mx - r.left - wx * z; c.y = my - r.top - wy * z;
    this.aplicarCamera();
  }
  marcarSelecao() {
    this.selecionarObjetosDosNos();
    for (const [id, el] of this.noEls ?? []) el.classList.toggle("sel", this.sel.has("n:" + id));
    this.camGrupos.querySelectorAll(".vs-grupo").forEach(el => el.classList.toggle("sel", this.sel.has("c:" + el.dataset.grupo)));
    this.camNotas.querySelectorAll(".vs-nota").forEach(el => el.classList.toggle("sel", this.sel.has("t:" + el.dataset.nota)));
    this.svg.querySelectorAll(".vs-fio.sel").forEach(el => el.classList.remove("sel"));
    if (this.cfgFios().quais === "selecao") this.desenharFios();
    this.renderInspetor(); this.renderBarraSel(); this.desenharMinimapa();
  }
  arrastar(e, mover, soltar, cursor) {
    const id = e.pointerId;
    let ultimo = e;
    this.arrasto = { mover, soltar, cancelar: () => fim(ultimo) };
    try { this.tela.setPointerCapture(id); } catch { /* ponteiro já liberado */ }
    if (cursor) this.tela.style.cursor = cursor;
    const mv = ev => { if (ev.pointerId === id && !this.pinca) { ultimo = ev; mover(ev); } };
    const fim = ev => {
      if (ev.pointerId !== id || !this.arrasto) return;
      window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", fim); window.removeEventListener("pointercancel", fim);
      this.tela.style.cursor = "";
      this.arrasto = null;
      soltar(ev);
    };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", fim); window.addEventListener("pointercancel", fim);
  }
  iniciarPan(e, botaoDireito) {
    const c = this.cam(), x0 = e.clientX, y0 = e.clientY, cx = c.x, cy = c.y;
    let andou = false;
    this.arrastar(e, ev => {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 4) andou = true;
      if (this.espaco) this.panComEspaco = true;
      c.x = cx + ev.clientX - x0; c.y = cy + ev.clientY - y0; this.aplicarCamera();
    }, ev => {
      this.desenharMinimapa(); this.salvarUI();
      if (botaoDireito && !andou) this.menuContexto(ev);
    }, "grabbing");
  }
  iniciarMover(e, chave) {
    const g = this.g;
    const [mx, my] = this.paraMundo(e.clientX, e.clientY);
    // grupos levam junto o que está dentro deles
    const mover = new Set([...this.sel].filter(k => !(k.startsWith("c:") && this.posPastas?.has(k.slice(2)))));
    for (const k of mover) if (k.startsWith("c:")) {
      const gr = g.grupos.find(x => "c:" + x.id === k); if (!gr) continue;
      const m = this.membros(gr, g);
      for (const id of m.nos) mover.add("n:" + id);
      for (const id of m.notas) mover.add("t:" + id);
    }
    const itens = [...mover].map(k => {
      const [tp, id] = [k.slice(0, 1), k.slice(2)];
      const o = tp === "n" ? g.nos.find(x => x.id === id) : tp === "c" ? g.grupos.find(x => x.id === id) : g.notas.find(x => x.id === id);
      const el = tp === "n" ? this.noEls.get(id) : tp === "c" ? this.camGrupos.querySelector(`[data-grupo="${CSS.escape(id)}"]`) : this.camNotas.querySelector(`[data-nota="${CSS.escape(id)}"]`);
      return o ? { o, el, x: o.x, y: o.y } : null;
    }).filter(Boolean);
    const idsNos = new Set([...mover].filter(k => k.startsWith("n:")).map(k => k.slice(2)));
    const ancora = itens.find(i => i.o.id === chave.slice(2)) ?? itens[0];
    let andou = false;
    this.arrastar(e, ev => {
      const [wx, wy] = this.paraMundo(ev.clientX, ev.clientY);
      let dx = wx - mx, dy = wy - my;
      if (!andou && Math.hypot(dx, dy) * this.cam().z < 3) return;
      andou = true;
      if (ancora && this.ui.vsEncaixe !== false && !ev.altKey) { dx = this.encaixe(ancora.x + dx) - ancora.x; dy = this.encaixe(ancora.y + dy) - ancora.y; }
      for (const i of itens) { i.o.x = Math.round(i.x + dx); i.o.y = Math.round(i.y + dy); if (i.el) { i.el.style.left = i.o.x + "px"; i.el.style.top = i.o.y + "px"; } }
      this.atualizarFios(idsNos);
    }, () => {
      if (andou) this.gravar(itens.length > 1 ? `mover ${itens.length} itens` : "mover");
      else this.renderInspetor();
    }, "grabbing");
  }
  iniciarMarquee(e) {
    const r = this.tela.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY;
    const somar = e.shiftKey || e.ctrlKey || e.metaKey;
    const antes = new Set(somar ? this.sel : []);
    let andou = false;
    this.arrastar(e, ev => {
      const x = Math.min(x0, ev.clientX), y = Math.min(y0, ev.clientY), w = Math.abs(ev.clientX - x0), hh = Math.abs(ev.clientY - y0);
      if (w + hh > 4) andou = true;
      if (!andou) return;
      Object.assign(this.marquee.style, { left: `${x - r.left}px`, top: `${y - r.top}px`, width: `${w}px`, height: `${hh}px` });
      this.marquee.hidden = false;
      const [ax, ay] = this.paraMundo(x, y), [bx, by] = this.paraMundo(x + w, y + hh);
      const dentro = (ox, oy, ow, oh) => ox < bx && ox + ow > ax && oy < by && oy + oh > ay;
      this.sel = new Set(antes);
      for (const no of this.g.nos) if (!this.ocultos?.has(no.id) && dentro(no.x, no.y, this.largura(no), this.altura(no))) this.sel.add("n:" + no.id);
      for (const gr of this.g.grupos) if (this.fechada(gr) && dentro(this.posG(gr).x, this.posG(gr).y, PASTA_L, this.altPasta(gr))) this.sel.add("c:" + gr.id);
      for (const t of this.g.notas) if (dentro(t.x, t.y, t.w, t.h)) this.sel.add("t:" + t.id);
      for (const [id, el] of this.noEls) el.classList.toggle("sel", this.sel.has("n:" + id));
    }, () => {
      this.marquee.hidden = true;
      if (!andou) { this.sel.clear(); this.fioSel = null; this.varSel = null; this.desenharFios(); }
      this.marcarSelecao();
    }, "crosshair");
  }
  iniciarRedim(e, chave) {
    const g = this.g, id = chave.slice(2);
    const o = chave.startsWith("c:") ? g.grupos.find(x => x.id === id) : g.notas.find(x => x.id === id);
    const el = e.target.closest(".vs-grupo, .vs-nota");
    const [mx, my] = this.paraMundo(e.clientX, e.clientY), w0 = o.w, h0 = o.h;
    this.arrastar(e, ev => {
      const [wx, wy] = this.paraMundo(ev.clientX, ev.clientY);
      o.w = Math.max(140, this.encaixe(w0 + wx - mx)); o.h = Math.max(70, this.encaixe(h0 + wy - my));
      el.style.width = o.w + "px"; el.style[chave.startsWith("c:") ? "height" : "minHeight"] = o.h + "px";
    }, () => this.gravar("redimensionar"), "nwse-resize");
  }
  iniciarFio(e, porta) {
    const g = this.g;
    let { no: noId, porta: pid, lado } = porta.dataset;
    let tipo = this.tipo(noId, pid, lado);
    // pegar um fio já ligado numa entrada de dado: solta dela e continua arrastando a partir da origem
    if (lado === "ent" && tipo !== "exec") {
      const l = g.ligacoes.find(x => x.para === noId && x.ep === pid);
      if (l && !e.altKey) { g.ligacoes = g.ligacoes.filter(x => x !== l); this.pegouFio = true; noId = l.de; pid = l.sp; lado = "sai"; tipo = this.tipo(noId, pid, lado); this.renderGrafo(); }
    }
    if (e.altKey) { this.mudar("desligar porta", (s, gg) => { gg.ligacoes = gg.ligacoes.filter(l => !(lado === "sai" ? l.de === noId && l.sp === pid : l.para === noId && l.ep === pid)); }); return; }
    const origem = this.no(noId);
    const [ox, oy] = this.posPorta(origem, pid, lado);
    const NS = "http://www.w3.org/2000/svg";
    this.fioTemp = document.createElementNS(NS, "path");
    this.fioTemp.setAttribute("class", `vs-fio-temp ${tipo === "exec" ? "exec" : ""}`);
    this.fioTemp.style.setProperty("--pt", TIPOS[tipo]?.cor ?? "#ccc");
    this.svg.append(this.fioTemp);
    // portas compatíveis acendem; as outras apagam
    this.tela.classList.add("ligando");
    for (const p of this.tela.querySelectorAll(".vs-porta")) {
      const ok = p.dataset.lado !== lado && p.dataset.no !== noId && (lado === "sai" ? compativel(tipo, this.tipo(p.dataset.no, p.dataset.porta, "ent")) : compativel(this.tipo(p.dataset.no, p.dataset.porta, "sai"), tipo));
      p.classList.toggle("compat", ok);
    }
    let sobre = null;
    this.arrastar(e, ev => {
      const [wx, wy] = this.paraMundo(ev.clientX, ev.clientY);
      const alvo = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".vs-porta.compat") ?? this.portaProxima(ev.clientX, ev.clientY, ".vs-porta.compat", ev.pointerType === "touch" ? 30 : 16);
      sobre?.classList.remove("mira"); sobre = alvo; sobre?.classList.add("mira");
      const [tx, ty] = alvo ? this.posPorta(this.no(alvo.dataset.no), alvo.dataset.porta, alvo.dataset.lado) : [wx, wy];
      this.fioTemp.setAttribute("d", lado === "sai" ? this.caminho(ox, oy, tx, ty) : this.caminho(tx, ty, ox, oy));
    }, ev => {
      this.tela.classList.remove("ligando");
      this.tela.querySelectorAll(".vs-porta.compat").forEach(p => p.classList.remove("compat", "mira"));
      this.fioTemp?.remove(); this.fioTemp = null;
      const pegou = this.pegouFio; this.pegouFio = false;
      if (sobre) {
        const d = sobre.dataset;
        if (lado === "sai") this.ligar(noId, pid, d.no, d.porta); else this.ligar(d.no, d.porta, noId, pid);
      } else if (!document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".vs-no")) {
        const [wx, wy] = this.paraMundo(ev.clientX, ev.clientY);
        if (pegou) this.gravar("desligar entrada");
        this.abrirBuscaNos(ev.clientX, ev.clientY, { de: { no: noId, porta: pid, lado, tipo }, mundo: [wx, wy] });
      } else if (pegou) this.gravar("desligar entrada");
      else this.desenharFios();
    }, "crosshair");
  }
  /** Liga saída → entrada. Entrada de dado aceita um fio; saída de execução também (substitui). */
  ligar(de, sp, para, ep, gravar = true) {
    const g = this.g;
    const ts = this.tipo(de, sp, "sai"), te = this.tipo(para, ep, "ent");
    if (de === para || !compativel(ts, te)) { avisar("Essas portas não combinam.", "alerta"); return false; }
    const exec = ts === "exec" || te === "exec";
    g.ligacoes = g.ligacoes.filter(l => !(exec ? l.de === de && l.sp === sp : l.para === para && l.ep === ep));
    g.ligacoes.push({ id: novoIdLocal("l"), de, sp, para, ep });
    if (gravar) this.gravar("ligar");
    return true;
  }
  /** Arrasta a alça amarela: muda onde o conector dobra (fica manual e deixa de desviar sozinho). */
  iniciarAlca(e, id) {
    const g = this.g, l = g.ligacoes.find(x => x.id === id); if (!l) return;
    const geo = this.geoFios.get(id), frente = geo.x2 - geo.x1 >= 44;
    let andou = false;
    this.arrastar(e, ev => {
      const [wx, wy] = this.paraMundo(ev.clientX, ev.clientY);
      let m;
      if (frente || (l.estilo ?? this.cfgFios().estilo) === "curva") m = (wx - geo.x1) / ((geo.x2 - geo.x1) || 1);
      else { const topo = Math.min(geo.y1, geo.y2) - 90, faixa = Math.abs(geo.y2 - geo.y1) + 180; m = (wy - topo) / faixa; }
      l.meio = Math.round(Math.max(0.03, Math.min(0.97, m)) * 1000) / 1000;
      andou = true;
      this.atualizarFiosAgora(new Set([l.de, l.para]));
    }, () => { if (andou) this.gravar("ajustar dobra do fio"); }, frente ? "ew-resize" : "ns-resize");
  }
  aoDuploClique(e) {
    const alca = e.target.closest(".vs-alca");
    if (alca) { const id = alca.dataset.fio; this.mudar("dobra automática", (s, g) => { delete g.ligacoes.find(x => x.id === id).meio; }); return; }
    const fio = e.target.closest(".vs-fio-hit");
    if (fio) {
      const l = this.g.ligacoes.find(x => x.id === fio.dataset.fio);
      const [wx, wy] = this.paraMundo(e.clientX, e.clientY);
      const rr = { id: novoIdLocal("n"), tipo: "rr", x: Math.round(wx - 8), y: Math.round(wy - 8), v: {} };
      this.mudar("inserir desvio", (s, g) => {
        g.nos.push(rr);
        g.ligacoes = g.ligacoes.filter(x => x.id !== l.id);
        g.ligacoes.push({ id: novoIdLocal("l"), de: l.de, sp: l.sp, para: rr.id, ep: "in" }, { id: novoIdLocal("l"), de: rr.id, sp: "out", para: l.para, ep: l.ep });
      });
      return;
    }
    const gr = e.target.closest(".vs-grupo-cab");
    if (!gr && !e.target.closest(".vs-no, .vs-nota")) {
      // zoom longe: o cartão pode ser pequeno demais para o alvo do clique; acha a pasta pela posição
      const [wx, wy] = this.paraMundo(e.clientX, e.clientY), F = 6 / this.cam().z;
      const alvoP = this.g.grupos.find(x => { if (!this.fechada(x)) return false; const p = this.posG(x); return wx > p.x - F && wx < p.x + PASTA_L + F && wy > p.y - F && wy < p.y + this.altPasta(x) + F; });
      if (alvoP) { this.focarPasta(alvoP.id); return; }
    }
    if (gr && gr.parentElement.classList.contains("vs-pasta")) { this.focarPasta(gr.parentElement.dataset.grupo); return; }
    if (gr) { const id = gr.parentElement.dataset.grupo; const o = this.g.grupos.find(x => x.id === id); const t = prompt("Título do grupo:", o.titulo ?? ""); if (t != null) this.mudar("renomear grupo", (s, g) => { g.grupos.find(x => x.id === id).titulo = t.trim(); }); return; }
    const nt = e.target.closest(".vs-nota");
    if (nt) return this.editarNota(nt);
    const noEl = e.target.closest(".vs-no");
    if (noEl && !e.target.closest("input,select,textarea")) { this.sel = new Set(["n:" + noEl.dataset.no]); this.marcarSelecao(); this.inspetor.querySelector("[data-foco-titulo]")?.focus(); return; }
    if (!e.target.closest(".vs-no, .vs-grupo, .vs-nota") && e.target.closest(".vs-tela")) this.abrirBuscaNos(e.clientX, e.clientY, {});
  }
  editarNota(el) {
    const id = el.dataset.nota, t = el.querySelector(".vs-nota-txt");
    t.contentEditable = "true"; t.focus();
    document.getSelection()?.selectAllChildren(t);
    const fim = () => {
      t.removeEventListener("blur", fim); t.contentEditable = "false";
      const texto = t.innerText.trim();
      const o = this.g.notas.find(x => x.id === id);
      if (o && texto !== o.texto) this.mudar("editar nota", (s, g) => { g.notas.find(x => x.id === id).texto = texto; });
    };
    t.addEventListener("blur", fim);
    t.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Escape" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) { e.preventDefault(); t.blur(); } });
  }
  dicaSobreFio(e) {
    const fio = e.target.closest?.(".vs-fio-hit");
    if (!fio || this.arrasto) { this.dicaFio.hidden = true; return; }
    const l = this.g.ligacoes.find(x => x.id === fio.dataset.fio); if (!l) return;
    const a = this.no(l.de), b = this.no(l.para);
    const pa = this.def(a)?.sai.find(p => p.id === l.sp), pb = this.def(b)?.ent.find(p => p.id === l.ep);
    const t = this.tipo(l.de, l.sp, "sai");
    const r = this.tela.getBoundingClientRect();
    const m = this.metricas.get(`${this.g.id}|${l.de}|${l.sp}|${l.para}|${l.ep}`);
    const tel = m ? [`×${m.n}`, m.lat != null ? `${m.lat} ms` : null, m.valor !== undefined ? `valor: ${fmtValor(m.valor)}` : null].filter(Boolean).join(" · ") : null;
    this.dicaFio.replaceChildren(h("strong", {}, TIPOS[t === "*" ? this.tipo(l.para, l.ep, "ent") : t]?.nome ?? ""), ` ${this.titulo(a)}${pa?.nome ? "." + pa.nome : ""} → ${this.titulo(b)}${pb?.nome ? "." + pb.nome : ""}`, tel ? h("code", { class: "vs-dica-tel" }, tel) : null, h("small", {}, "Duplo clique: desvio · Alt+clique: cortar"));
    Object.assign(this.dicaFio.style, { left: `${e.clientX - r.left + 14}px`, top: `${e.clientY - r.top + 14}px` });
    this.dicaFio.hidden = false;
  }
  aoSoltarArrastado(e) {
    const arq = [...(e.dataTransfer.files ?? [])].find(f => /\.(txt|json)$/i.test(f.name) || /^text\/|json/.test(f.type));
    if (arq) { e.preventDefault(); arq.text().then(t => this.abrirImportar(t, arq.name)); return; }
    const dado = e.dataTransfer.getData("text/x-vs"); if (!dado) return;
    e.preventDefault();
    let d; try { d = JSON.parse(dado); } catch { return; }
    const [wx, wy] = this.paraMundo(e.clientX, e.clientY);
    if (d.tipo) this.criarNo(d.tipo, wx - 20, wy - 14);
    else if (d.var) this.criarNo(e.altKey ? "var.definir" : "var.obter", wx - 20, wy - 14, { variavel: d.var });
    else if (d.el && this.n.elemento(d.el)) {
      const existente=this.g.nos.find(no=>no.tipo==='ui.objeto'&&no.v?.alvo===d.el);
      if(existente){this.mudar('Posicionar objeto no grafo',(s,g)=>{const no=g.nos.find(no=>no.id===existente.id);no.x=this.encaixe(wx-20);no.y=this.encaixe(wy-14);});this.sel=new Set(['n:'+existente.id]);this.marcarSelecao();}
      else this.criarNo('ui.objeto',wx-20,wy-14,{alvo:d.el});
    }
  }

  // ================================================================
  // Comandos do grafo
  // ================================================================
  criarNo(tipo, x, y, valores = {}, ligarCom) {
    const d = NOS[tipo]; if (!d) return null;
    const no = { id: novoIdLocal("n"), tipo, x: this.encaixe(x), y: this.encaixe(y), v: { ...valoresPadrao(tipo), ...valores } };
    if (d.desvio) { no.x = Math.round(x); no.y = Math.round(y); }
    this.g.nos.push(no);
    if (ligarCom) {
      const { no: outro, porta, lado, tipo: t } = ligarCom;
      const lista = lado === "sai" ? d.ent : d.sai;
      const alvo = lista.find(p => !p.prop && (lado === "sai" ? compativel(t, p.tipo) : compativel(p.tipo, t)) && (t === "exec") === (p.tipo === "exec"))
        ?? lista.find(p => !p.prop && (lado === "sai" ? compativel(t, p.tipo) : compativel(p.tipo, t)));
      if (alvo) {
        if (lado === "sai") { no.y = this.encaixe(y - (HEAD + PAD + lista.indexOf(alvo) * ROW + ROW / 2)); this.ligar(outro, porta, no.id, alvo.id, false); }
        else { no.x = this.encaixe(x - this.largura(no)); no.y = this.encaixe(y - (HEAD + PAD + lista.indexOf(alvo) * ROW + ROW / 2)); this.ligar(no.id, alvo.id, outro, porta, false); }
      }
    }
    this.sel = new Set(["n:" + no.id]); this.fioSel = null; this.varSel = null;
    this.gravar(`adicionar ${d.nome}`);
    return no;
  }
  remover() {
    if (this.fioSel) { const id = this.fioSel; this.fioSel = null; this.mudar("cortar ligação", (s, g) => { g.ligacoes = g.ligacoes.filter(l => l.id !== id); }); return; }
    if (!this.sel.size) return;
    const objetos=[...this.sel].filter(k=>k.startsWith("n:")).map(k=>this.no(k.slice(2))).filter(n=>n?.origem==="designer");
    if (objetos.length) { avisar("Este nó representa um objeto. Exclua o objeto no Designer para remover também seu nó.","alerta"); return; }
    const ks = new Set(this.sel); this.sel.clear();
    this.mudar(`remover ${ks.size} item(ns)`, (s, g) => {
      // desvios removidos religam as pontas, para não quebrar o fluxo
      for (const no of g.nos.filter(x => ks.has("n:" + x.id) && x.tipo === "rr")) {
        const ent = g.ligacoes.find(l => l.para === no.id), sais = g.ligacoes.filter(l => l.de === no.id);
        if (ent) for (const s2 of sais) g.ligacoes.push({ id: novoIdLocal("l"), de: ent.de, sp: ent.sp, para: s2.para, ep: s2.ep });
      }
      g.nos = g.nos.filter(x => !ks.has("n:" + x.id));
      const vivos = new Set(g.nos.map(x => x.id));
      g.ligacoes = g.ligacoes.filter(l => vivos.has(l.de) && vivos.has(l.para));
      g.grupos = g.grupos.filter(x => !ks.has("c:" + x.id));
      g.notas = g.notas.filter(x => !ks.has("t:" + x.id));
    });
  }
  copiarSel(recortar = false) {
    const g = this.g;
    const nos = g.nos.filter(x => this.sel.has("n:" + x.id));
    const ids = new Set(nos.map(x => x.id));
    const pacote = { hefestusVS: 1, nos: clonar(nos), ligacoes: clonar(g.ligacoes.filter(l => ids.has(l.de) && ids.has(l.para))), notas: clonar(g.notas.filter(x => this.sel.has("t:" + x.id))), grupos: clonar(g.grupos.filter(x => this.sel.has("c:" + x.id))) };
    if (!pacote.nos.length && !pacote.notas.length && !pacote.grupos.length) return;
    this.prancheta = pacote;
    copiar(JSON.stringify(pacote));
    if (recortar) this.remover();
    else this.app.mensagem?.(`${pacote.nos.length} nó(s) copiados. Ctrl+V cola onde está o ponteiro.`);
  }
  async colar() {
    let p = this.prancheta;
    try { const t = await navigator.clipboard.readText(); const x = JSON.parse(t); if (x?.hefestusVS) p = x; } catch { /* usa a prancheta interna */ }
    if (!p) return;
    this.inserirPacote(p, this.paraMundo(this.mouse.x, this.mouse.y), "colar");
  }
  inserirPacote(p, [mx, my], texto) {
    const b = [...p.nos.map(n => [n.x, n.y]), ...p.notas.map(n => [n.x, n.y]), ...p.grupos.map(n => [n.x, n.y])];
    const x0 = Math.min(...b.map(v => v[0])), y0 = Math.min(...b.map(v => v[1]));
    const mapa = {};
    const novos = p.nos.map(n => { const id = novoIdLocal("n"); mapa[n.id] = id; return { ...clonar(n), id, x: this.encaixe(n.x - x0 + mx), y: this.encaixe(n.y - y0 + my) }; });
    const varsOk = new Set(this.s.variaveis.map(v => v.id));
    for (const n of novos) if (n.v?.variavel && !varsOk.has(n.v.variavel)) n.v.variavel = "";
    const ligs = p.ligacoes.map(l => ({ ...l, id: novoIdLocal("l"), de: mapa[l.de], para: mapa[l.para] }));
    const notas = p.notas.map(t => ({ ...clonar(t), id: novoIdLocal("t"), x: t.x - x0 + mx, y: t.y - y0 + my }));
    const grupos = p.grupos.map(t => ({ ...clonar(t), id: novoIdLocal("c"), x: t.x - x0 + mx, y: t.y - y0 + my }));
    this.mudar(texto, (s, g) => { g.nos.push(...novos); g.ligacoes.push(...ligs); g.notas.push(...notas); g.grupos.push(...grupos); });
    this.sel = new Set([...novos.map(n => "n:" + n.id), ...notas.map(n => "t:" + n.id), ...grupos.map(n => "c:" + n.id)]);
    this.render();
  }
  duplicar() {
    if ([...this.sel].some(k=>k.startsWith("n:") && this.no(k.slice(2))?.origem==="designer")) { avisar("Duplique o objeto no Designer; seu novo nó aparecerá automaticamente.","alerta"); return; }
    const g = this.g, nos = g.nos.filter(x => this.sel.has("n:" + x.id));
    if (!nos.length && !this.sel.size) return;
    const ids = new Set(nos.map(x => x.id));
    const b = this.limites(this.sel);
    this.inserirPacote({ nos, ligacoes: g.ligacoes.filter(l => ids.has(l.de) && ids.has(l.para)), notas: g.notas.filter(x => this.sel.has("t:" + x.id)), grupos: g.grupos.filter(x => this.sel.has("c:" + x.id)) }, [b.x + 32, b.y + 32], "duplicar");
  }
  alternarDesativado() {
    const ks = [...this.sel].filter(k => k.startsWith("n:")).map(k => k.slice(2));
    const algum = this.g.nos.some(n => ks.includes(n.id) && !n.desativado);
    this.mudar(algum ? "desativar nós" : "ativar nós", (s, g) => { for (const n of g.nos) if (ks.includes(n.id)) n.desativado = algum || undefined; });
  }
  novaPastaGrafo(tipo = "geral") {
    const [cx, cy] = this.centroVisivel();
    const gr = { id: novoIdLocal("c"), x: this.encaixe(cx - 180), y: this.encaixe(cy - 100), w: 360, h: 220, titulo: tipo === "geral" ? "Nova pasta" : TIPOS_PASTA[tipo].nome, cor: TIPOS_PASTA[tipo].cor };
    if (tipo !== "geral") gr.tipo = tipo;
    this.mudar(`nova pasta ${TIPOS_PASTA[tipo].nome}`, (s, g) => { g.grupos.push(gr); });
    this.sel = new Set(["c:" + gr.id]); this.render();
  }
  // ---------------- navegação por pasta (foco) ----------------
  /** Pasta aberta no momento (só da vista; não mexe no documento). */
  focoAtual(g = this.g) { const id = this.focoPastas?.[g?.id]; return id && g.grupos.some(x => x.id === id) ? id : null; }
  /** Estado efetivo: com uma pasta em foco, todas as outras são pastas fechadas. */
  fechada(gr) { const f = this.focoAtual(); return f ? gr.id !== f : !!gr.recolhido; }
  posG(gr) { return this.posPastas?.get(gr.id) ?? gr; }
  /** Arruma as outras pastas numa prateleira à esquerda do que está aberto, sem cobrir nada. */
  calcPrateleira(g, membrosDe) {
    this.posPastas = new Map();
    const f = this.focoAtual(g); if (!f) return;
    const fg = g.grupos.find(x => x.id === f), outras = g.grupos.filter(x => x.id !== f);
    if (!outras.length) return;
    // o que fica solto (fora de qualquer grupo) continua na tela: a prateleira não pode cobrir
    const deAlguem = new Set(), notasDeAlguem = new Set();
    for (const m of membrosDe.values()) { for (const id of m.nos) deAlguem.add(id); for (const id of m.notas) notasDeAlguem.add(id); }
    const soltos = [...g.nos.filter(n => !deAlguem.has(n.id)).map(n => [n.x, n.y, this.largura(n), this.altura(n)]), ...g.notas.filter(t => !notasDeAlguem.has(t.id)).map(t => [t.x, t.y, t.w, t.h])];
    const bate = (x, y, w, hh) => soltos.filter(r => r[0] < x + w + 24 && r[0] + r[2] > x - 24 && r[1] < y + hh + 24 && r[1] + r[3] > y - 24);
    const mob = this.raiz.classList.contains("mobile");
    if (mob) {
      // celular: faixa logo acima da pasta aberta, em linhas
      const porLinha = Math.max(1, Math.floor((fg.w + 20) / (PASTA_L + 20))), alt = Math.max(...outras.map(x => this.altPasta(x))) + 16;
      const linhas = Math.ceil(outras.length / porLinha), W = Math.min(outras.length, porLinha) * (PASTA_L + 20), H = linhas * alt;
      let y = fg.y - 40 - H;
      for (let k = 0, c; k < 30 && (c = bate(fg.x, y, W, H)).length; k++) y = Math.min(...c.map(r => r[1])) - 40 - H;
      outras.forEach((gr, i) => this.posPastas.set(gr.id, { x: fg.x + (i % porLinha) * (PASTA_L + 20), y: y + Math.floor(i / porLinha) * alt }));
      return;
    }
    const POR_COL = Math.max(4, Math.ceil(outras.length / Math.ceil(outras.length / 8))), cols = Math.ceil(outras.length / POR_COL);
    const W = cols * (PASTA_L + 28), H = Math.min(outras.length, POR_COL) * (Math.max(...outras.map(x => this.altPasta(x))) + 18);
    let x = fg.x - 96 - W;
    for (let k = 0, c; k < 30 && (c = bate(x, fg.y, W, H)).length; k++) x = Math.min(...c.map(r => r[0])) - 96 - W;
    let col = 0, yy = fg.y;
    outras.forEach((gr, i) => {
      if (i && i % POR_COL === 0) { col++; yy = fg.y; }
      this.posPastas.set(gr.id, { x: x + (cols - 1 - col) * (PASTA_L + 28), y: yy });
      yy += this.altPasta(gr) + 18;
    });
  }
  focarPasta(id, gid = this.g.id) {
    if (gid !== this.g.id) this.abrirGrafo(gid);
    if (!this.g.grupos.some(x => x.id === id)) return;
    (this.focoPastas ??= {})[this.g.id] = id;
    this.sel = new Set(["c:" + id]); this.fioSel = null; this.varSel = null;
    this.render();
    // enquadra a pasta aberta e a prateleira, para trocar de pasta sem procurar
    requestAnimationFrame(() => this.enquadrar(new Set(["c:" + id, ...[...this.posPastas.keys()].map(k => "c:" + k)])));
  }
  sairFoco() {
    const f = this.focoAtual(); if (!f) return false;
    delete this.focoPastas[this.g.id];
    this.sel = new Set(["c:" + f]);
    this.render();
    requestAnimationFrame(() => this.enquadrar(null));
    return true;
  }
  pastaVizinha(d) {
    const l = this.g.grupos, f = this.focoAtual(); if (!f || l.length < 2) return;
    const i = l.findIndex(x => x.id === f);
    this.focarPasta(l[(i + d + l.length) % l.length].id);
  }
  /** Depois de desenhar: esmaece o que está fora da pasta aberta e mostra a barra de navegação. */
  aplicarFoco() {
    const g = this.g, f = this.focoAtual(g);
    this.tela.classList.toggle("foco-pasta", !!f);
    if (!this.barraFoco) { this.barraFoco = h("div", { class: "vs-barra-foco", role: "navigation", "aria-label": "Pasta aberta", hidden: true }); this.tela.append(this.barraFoco); }
    this.barraFoco.hidden = !f;
    if (!f) { for (const el of this.noEls.values()) el.classList.remove("fora-foco"); return; }
    const fg = g.grupos.find(x => x.id === f), m = this.membros(fg, g), tipo = TIPOS_PASTA[fg.tipo] ? fg.tipo : "geral";
    for (const [id, el] of this.noEls) el.classList.toggle("fora-foco", !m.nos.has(id));
    for (const el of this.camNotas?.querySelectorAll?.("[data-nota]") ?? []) el.classList.toggle("fora-foco", !m.notas.has(el.dataset.nota));
    this.camGrupos.querySelector(`[data-grupo="${CSS.escape(f)}"]`)?.classList.add("em-foco");
    const i = g.grupos.indexOf(fg), n = g.grupos.length;
    this.barraFoco.replaceChildren(
      h("button", { type: "button", class: "vs-foco-raiz", title: "Ver o grafo inteiro (Esc)", onclick: () => this.sairFoco() }, h("span", { html: icone("topologia", 13) }), g.nome),
      h("span", { class: "vs-foco-sep", "aria-hidden": "true" }, "›"),
      h("span", { class: "vs-foco-atual", style: `--g:${corGrupo(fg)}` }, h("span", { html: svgPasta(corGrupo(fg), true, tipo, 20) }), h("strong", {}, fg.titulo || "Pasta"), h("small", {}, `${TIPOS_PASTA[tipo].nome} · ${m.nos.size} nó(s)`)),
      n > 1 ? h("span", { class: "vs-foco-nav" },
        h("button", { type: "button", title: "Pasta anterior", "aria-label": "Pasta anterior", onclick: () => this.pastaVizinha(-1) }, "‹"),
        h("small", {}, `${i + 1}/${n}`),
        h("button", { type: "button", title: "Próxima pasta", "aria-label": "Próxima pasta", onclick: () => this.pastaVizinha(1) }, "›")) : null,
      h("button", { type: "button", class: "vs-foco-sair", title: "Fechar a pasta e ver tudo (Esc)", onclick: () => this.sairFoco() }, "Ver tudo"));
  }
  altPasta(gr) { return (gr.tipo ?? "geral") === "geral" ? PASTA_A : 96; }
  /** O que a pasta recolhida guarda, em resumo: cores e efeitos (Visual) ou destinos e sinais (Função). */
  resumoPasta(tipo, nos) {
    const chips = [];
    if (tipo === "visual") {
      const cores = new Set(), efeitos = new Set();
      for (const n of nos) {
        const v = n.v ?? {};
        if ((n.tipo === "ui.estilo" || n.tipo === "ui.transicao") && ["fundo", "cor", "borda"].includes(v.propriedade) && typeof v.valor === "string" && CSS.supports("color", v.valor)) cores.add(v.valor);
        if (n.tipo === "ui.efeito") efeitos.add(NOS["ui.efeito"].ent.find(p => p.id === "efeito").opcoes.find(o => o[0] === v.efeito)?.[1] ?? v.efeito);
        if (n.tipo === "ui.forma") efeitos.add("forma");
        if (n.tipo === "ui.transicao" && !["fundo", "cor", "borda"].includes(v.propriedade)) efeitos.add(v.propriedade);
      }
      for (const c of [...cores].slice(0, 6)) chips.push(h("i", { class: "vs-amostra", style: `--c:${c}`, title: c }));
      for (const e of [...efeitos].slice(0, 3)) chips.push(h("span", { class: "vs-chip" }, e));
    } else {
      const destinos = new Set(), sinais = new Set(), eventos = new Set();
      for (const n of nos) {
        const v = n.v ?? {};
        if (this.def(n)?.evento) eventos.add(`▶ ${this.def(n).nome.replace(/^Ao /, "")}`);
        if (["ui.abrir", "ui.fechar", "ui.alternar", "ui.mostrarSo", "ui.focar", "ui.habilitar", "ui.texto"].includes(n.tipo) && v.alvo) destinos.add(this.nomeEl(v.alvo));
        if (n.tipo === "ui.sinal" && v.nome) sinais.add(`⚡${v.nome}`);
        if (n.tipo === "fl.disparar" && v.nome) sinais.add(`↪ ${v.nome}`);
        if (n.tipo === "ui.link" && v.url) sinais.add("🔗 link");
      }
      for (const ev of [...eventos].slice(0, 2)) chips.push(h("span", { class: "vs-chip ev" }, ev));
      for (const d of [...destinos].slice(0, 3)) chips.push(h("span", { class: "vs-chip" }, `→ ${d}`));
      for (const x of [...sinais].slice(0, 2)) chips.push(h("span", { class: "vs-chip" }, x));
      const resto = destinos.size + sinais.size - Math.min(3, destinos.size) - Math.min(2, sinais.size);
      if (resto > 0) chips.push(h("span", { class: "vs-chip" }, `+${resto}`));
    }
    return h("div", { class: "vs-pasta-chips" }, chips.length ? chips : h("span", { class: "vs-chip vazio" }, tipo === "visual" ? "sem efeitos ainda" : tipo === "dados" ? "sem dados ainda" : "sem conexões ainda"));
  }
  /** Paleta pequena para colorir uma pasta (e, nas do grafo, escolher o tipo). */
  menuPasta(ancora, { cor, tipo, comTipo = false, aoEscolher }) {
    this.fecharFlutuantes();
    const menu = h("div", { class: "vs-menu vs-menu-cor", role: "dialog", "aria-label": "Cor da pasta" },
      comTipo ? h("div", { class: "vs-tipos-pasta" }, Object.entries(TIPOS_PASTA).map(([k, t]) => h("button", { type: "button", "aria-pressed": String(k === (tipo ?? "geral")), title: t.dica, onclick: () => { this.fecharFlutuantes(); aoEscolher({ tipo: k }); } }, h("span", { html: svgPasta(t.cor, false, k, 18) }), t.nome))) : null,
      h("div", { class: "vs-cores", role: "radiogroup", "aria-label": "Cor" }, CORES_GRUPO.map(([c, nome]) => h("button", { type: "button", role: "radio", "aria-checked": String(c === cor), title: nome, "aria-label": nome, style: `--c:${c}`, onclick: () => { this.fecharFlutuantes(); aoEscolher({ cor: c }); } }))),
      h("label", { class: "vs-campo-linha" }, h("input", { type: "color", class: "vs-cor-amostra", value: /^#[0-9a-f]{6}$/i.test(cor ?? "") ? cor : "#e3a008", onchange: e => { this.fecharFlutuantes(); aoEscolher({ cor: e.target.value }); } }), "Outra cor…"),
      cor ? h("button", { type: "button", class: "vs-link", onclick: () => { this.fecharFlutuantes(); aoEscolher({ cor: null }); } }, "Cor padrão") : null);
    this.raiz.append(menu);
    const r = ancora.getBoundingClientRect(), rr = this.raiz.getBoundingClientRect();
    Object.assign(menu.style, { left: `${Math.min(r.left - rr.left, rr.width - 260)}px`, top: `${Math.min(r.bottom - rr.top + 4, rr.height - 220)}px` });
    this.flutuante = menu;
    menu.querySelector("button")?.focus();
    menu.addEventListener("keydown", ev => { if (ev.key === "Escape") { ev.stopPropagation(); this.fecharFlutuantes(); ancora.focus?.(); } });
    setTimeout(() => document.addEventListener("pointerdown", ev => { if (this.flutuante === menu && !menu.contains(ev.target)) this.fecharFlutuantes(); }, { once: true }), 0);
  }
  /**
   * Separa o que um objeto faz em duas pastas no grafo: Função (eventos e conexões com outros
   * menus/ferramentas) e Visual (forma, cor, efeitos). Reaproveita as pastas se já existirem.
   */
  pastasDoObjeto(elId) {
    const g = this.g, nome = this.nomeEl(elId);
    const nos = g.nos.filter(n => n.v?.alvo === elId && !this.def(n)?.desvio);
    const fun = nos.filter(n => !ehVisual(n.tipo)).sort((a, b) => a.y - b.y || a.x - b.x);
    const vis = nos.filter(n => ehVisual(n.tipo)).sort((a, b) => a.y - b.y || a.x - b.x);
    const existente = tipo => g.grupos.find(x => x.objeto === elId && x.tipo === tipo);
    let x0, y0;
    const ef = existente("funcao");
    if (ef) { x0 = ef.x; y0 = ef.y; }
    else {
      // espaço livre logo abaixo de todo o resto: as pastas nunca engolem nós de outros objetos
      const meus = new Set(nos.map(n => n.id)), caixas = [];
      for (const n of g.nos) if (!meus.has(n.id)) caixas.push([n.x, n.y, this.largura(n), this.altura(n)]);
      for (const gr of g.grupos) if (gr.objeto !== elId) caixas.push([gr.x, gr.y, gr.recolhido ? PASTA_L : gr.w, gr.recolhido ? this.altPasta(gr) : gr.h]);
      for (const t of g.notas) caixas.push([t.x, t.y, t.w, t.h]);
      if (caixas.length) { x0 = Math.min(...caixas.map(c => c[0])); y0 = Math.max(...caixas.map(c => c[1] + c[3])) + 96; }
      else { const [cx, cy] = this.centroVisivel(); x0 = cx - 340; y0 = cy - 120; }
    }
    x0 = this.encaixe(x0); y0 = this.encaixe(y0);
    const montar = (lista, x, y) => {
      const w = Math.max(280, ...lista.map(n => this.largura(n) + 48));
      let yy = y + 56; const pos = [];
      for (const n of lista) { pos.push([n.id, x + 24, yy]); yy += this.altura(n) + 24; }
      return { w, h: Math.max(150, yy - y + 8), pos };
    };
    const A = montar(fun, x0, y0), B = montar(vis, x0 + A.w + 64, y0);
    this.mudar(`pastas de ${nome}`, (s2, gg) => {
      const por = new Map(gg.nos.map(n => [n.id, n]));
      for (const [id, x, y] of [...A.pos, ...B.pos]) { const n = por.get(id); n.x = this.encaixe(x); n.y = this.encaixe(y); }
      const colocar = (tipo, x, caixa, titulo) => {
        let gr = gg.grupos.find(z => z.objeto === elId && z.tipo === tipo);
        if (!gr) { gr = { id: novoIdLocal("c"), objeto: elId, tipo, titulo, cor: TIPOS_PASTA[tipo].cor }; gg.grupos.push(gr); }
        Object.assign(gr, { x, y: y0, w: caixa.w, h: caixa.h });
        delete gr.recolhido; delete gr.membros; delete gr.membrosNotas;
      };
      colocar("funcao", x0, A, `${nome} · Função`);
      colocar("visual", x0 + A.w + 64, B, `${nome} · Visual`);
    });
    const ids = new Set(g.grupos.filter(x => x.objeto === elId).map(x => "c:" + x.id));
    this.sel = ids; this.render();
    requestAnimationFrame(() => this.enquadrar(ids));
    this.app.mensagem?.(`${nome}: ${fun.length} nó(s) de função e ${vis.length} visual(is) organizados em pastas.`);
  }
  /** Nós e notas dentro da área de um grupo (o mesmo critério do arraste). */
  membros(gr, g = this.g) {
    // recolhida, a pasta guarda a lista do que tinha dentro: nada entra nem sai por estar "embaixo" dela
    if (gr.recolhido && Array.isArray(gr.membros)) {
      const vivos = new Set(g.nos.map(n => n.id)), notasVivas = new Set(g.notas.map(t => t.id));
      return { nos: new Set(gr.membros.filter(id => vivos.has(id))), notas: new Set((gr.membrosNotas ?? []).filter(id => notasVivas.has(id))) };
    }
    const nos = new Set(), notas = new Set();
    for (const no of g.nos) { const cx = no.x + this.largura(no) / 2, cy = no.y + 12; if (cx > gr.x && cx < gr.x + gr.w && cy > gr.y && cy < gr.y + gr.h) nos.add(no.id); }
    for (const t of g.notas) if (t.x > gr.x && t.x < gr.x + gr.w && t.y > gr.y && t.y < gr.y + gr.h) notas.add(t.id);
    return { nos, notas };
  }
  alternarPasta(id, recolher, gid = this.g.id) {
    if (gid !== this.g.id) this.abrirGrafo(gid);
    this.mudar(recolher ? "recolher em pasta" : "abrir pasta", (s, g) => {
      const gr = g.grupos.find(x => x.id === id);
      if (recolher) { const m = this.membros({ ...gr, recolhido: false }, g); gr.membros = [...m.nos]; gr.membrosNotas = [...m.notas]; gr.recolhido = true; }
      else { const antes = this.membros(gr, g); delete gr.recolhido; delete gr.membros; delete gr.membrosNotas; this.empurrarAbaixo(g, gr, antes); }
    });
    this.sel = new Set(["c:" + id]); this.render();
    if (!recolher) requestAnimationFrame(() => this.enquadrar(new Set(["c:" + id])));
  }
  /** Ao abrir uma pasta, o que está embaixo dela desce (com o conteúdo) em vez de ficar coberto. */
  empurrarAbaixo(g, gr, proprios) {
    const toca = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    // o que era da pasta continua dela; o que só estava embaixo dela é empurrado
    const membrosDe = new Map(g.grupos.map(x => [x.id, x.id === gr.id && proprios ? proprios : this.membros(x, g)]));
    const emGrupo = new Set(); for (const m of membrosDe.values()) for (const id of m.nos) emGrupo.add(id);
    const notasEmGrupo = new Set(); for (const m of membrosDe.values()) for (const id of m.notas) notasEmGrupo.add(id);
    const area = { x: gr.x, y: gr.y, w: gr.w, h: gr.h };
    const blocos = [
      ...g.grupos.filter(x => x.id !== gr.id).map(x => ({ o: x, grupo: x, r: { x: x.x, y: x.y, w: x.recolhido ? PASTA_L : x.w, h: x.recolhido ? this.altPasta(x) : x.h } })),
      ...g.nos.filter(n => !emGrupo.has(n.id)).map(n => ({ o: n, r: { x: n.x, y: n.y, w: this.largura(n), h: this.altura(n) } })),
      ...g.notas.filter(t => !notasEmGrupo.has(t.id)).map(t => ({ o: t, r: { x: t.x, y: t.y, w: t.w, h: t.h } })),
    ].filter(b => b.r.y >= gr.y - 4 || toca(b.r, area)).sort((a, b) => a.r.y - b.r.y);
    const ocupados = [area];
    for (const b of blocos) {
      let dy = 0;
      for (let volta = 0; volta < 4; volta++) {
        let mudou = false;
        for (const o of ocupados) if (toca({ ...b.r, y: b.r.y + dy }, { x: o.x - 24, y: o.y, w: o.w + 48, h: o.h + 32 })) { const n = o.y + o.h + 32 - b.r.y; if (n > dy) { dy = n; mudou = true; } }
        if (!mudou) break;
      }
      dy = Math.ceil(dy / 16) * 16;
      if (dy > 0) {
        b.o.y += dy;
        if (b.grupo) { const m = membrosDe.get(b.grupo.id); for (const n of g.nos) if (m.nos.has(n.id)) n.y += dy; for (const t of g.notas) if (m.notas.has(t.id)) t.y += dy; }
      }
      ocupados.push({ ...b.r, y: b.r.y + dy });
    }
  }
  irParaGrupo(gid, id) {
    if (this.g.id !== gid) this.abrirGrafo(gid);
    const alvoGr = this.g.grupos.find(x => x.id === id);
    if (alvoGr && (this.focoAtual() || alvoGr.recolhido)) return this.focarPasta(id);
    this.sel = new Set(["c:" + id]); this.fioSel = null; this.varSel = null;
    this.render();
    requestAnimationFrame(() => this.enquadrar(this.sel));
  }
  agrupar(recolher = false, tipo = "geral") {
    const b = this.limites(new Set([...this.sel].filter(k => !k.startsWith("c:"))));
    if (!b) return;
    const gr = { id: novoIdLocal("c"), x: b.x - 24, y: b.y - 52, w: b.w + 48, h: b.h + 76, titulo: tipo !== "geral" ? TIPOS_PASTA[tipo].nome : recolher ? "Nova pasta" : "Novo grupo", cor: tipo === "geral" ? CORES_GRUPO[this.g.grupos.length % CORES_GRUPO.length][0] : TIPOS_PASTA[tipo].cor };
    if (tipo !== "geral") gr.tipo = tipo;
    if (recolher) { gr.recolhido = true; gr.membros = [...this.sel].filter(k => k.startsWith("n:")).map(k => k.slice(2)); gr.membrosNotas = [...this.sel].filter(k => k.startsWith("t:")).map(k => k.slice(2)); }
    this.mudar(recolher ? "criar pasta" : "criar grupo", (s, g) => { g.grupos.push(gr); });
    this.sel = new Set(["c:" + gr.id]); this.render();
  }
  novaNota(x, y) {
    const t = { id: novoIdLocal("t"), x: this.encaixe(x), y: this.encaixe(y), w: 200, h: 96, texto: "", cor: CORES_NOTA[0][0] };
    this.mudar("nova nota", (s, g) => { g.notas.push(t); });
    this.sel = new Set(["t:" + t.id]); this.render();
    requestAnimationFrame(() => { const el = this.camNotas.querySelector(`[data-nota="${t.id}"]`); if (el) this.editarNota(el); });
  }
  alinhar(modo) {
    const nos = this.g.nos.filter(x => this.sel.has("n:" + x.id));
    if (nos.length < 2) return;
    this.mudar("alinhar", (s, g) => {
      const alvo = g.nos.filter(x => this.sel.has("n:" + x.id));
      if (modo === "esq") { const x = Math.min(...alvo.map(n => n.x)); alvo.forEach(n => n.x = x); }
      if (modo === "topo") { const y = Math.min(...alvo.map(n => n.y)); alvo.forEach(n => n.y = y); }
      if (modo === "distV") {
        alvo.sort((a, b) => a.y - b.y);
        let y = alvo[0].y; for (const n of alvo) { n.y = this.encaixe(y); y += this.altura(n) + 24; }
      }
    });
  }
  /** Organiza em colunas pela ordem do fluxo (eventos à esquerda), mantendo grupos de cada evento juntos. */
  organizar() {
    const g = this.g; if (!g.nos.length) return;
    const nivel = new Map(), visto = new Set();
    for (const n of g.nos) nivel.set(n.id, 0);
    for (let k = 0; k < g.nos.length; k++) {
      let mudou = false;
      for (const l of g.ligacoes) {
        const exec = this.tipo(l.de, l.sp, "sai") === "exec";
        const a = nivel.get(l.de) ?? 0, b = nivel.get(l.para) ?? 0;
        if (exec && b < a + 1) { nivel.set(l.para, a + 1); mudou = true; }
      }
      if (!mudou) break;
    }
    // nós de valor ficam uma coluna antes de quem os usa
    for (let k = 0; k < 6; k++) for (const l of g.ligacoes) {
      if (this.tipo(l.de, l.sp, "sai") === "exec") continue;
      const dn = this.def(this.no(l.de)); if (!dn?.puro && !dn?.desvio) continue;
      nivel.set(l.de, Math.max(0, (nivel.get(l.para) ?? 0) - 0.5));
    }
    const colunas = new Map();
    for (const n of g.nos) { const c = nivel.get(n.id); if (!colunas.has(c)) colunas.set(c, []); colunas.get(c).push(n); }
    const x0 = Math.min(...g.nos.map(n => n.x)), y0 = Math.min(...g.nos.map(n => n.y));
    this.mudar("organizar automaticamente", (s, gg) => {
      const por = new Map(gg.nos.map(n => [n.id, n]));
      for (const [c, lista] of [...colunas].sort((a, b) => a[0] - b[0])) {
        lista.sort((a, b) => a.y - b.y);
        let y = y0;
        for (const n of lista) { const o = por.get(n.id); o.x = this.encaixe(x0 + c * 300); o.y = this.encaixe(y); y += this.altura(o) + 32; visto.add(n.id); }
      }
    });
    requestAnimationFrame(() => this.enquadrar());
  }
  inserirExemplo() {
    const els = this.elementos();
    const botao = els.find(e => e.tipo === "botao") ?? els[0];
    const alvo = els.find(e => e.abertura?.iniciaFechado || ["modal", "menu", "toast"].includes(e.tipo)) ?? els.find(e => e.tipo === "container" || e.tipo === "caixa") ?? els[1] ?? els[0];
    const [cx, cy] = this.centroVisivel();
    const x = this.encaixe(cx - 520), y = this.encaixe(cy - 200);
    let v = this.s.variaveis.find(x2 => x2.nome === "cliques");
    const novaVar = !v;
    if (!v) v = { id: novoIdLocal("v"), nome: "cliques", tipo: "numero", valor: 0 };
    const id = () => novoIdLocal("n");
    const n = {
      ini: { id: id(), tipo: "ev.iniciar", x, y }, log: { id: id(), tipo: "d.log", x: x + 288, y },
      cli: { id: id(), tipo: "ev.clique", x, y: y + 144 }, alt: { id: id(), tipo: "ui.alternar", x: x + 288, y: y + 144 },
      inc: { id: id(), tipo: "var.incrementar", x: x + 576, y: y + 144 }, fmt: { id: id(), tipo: "t.formatar", x: x + 576, y: y + 288 },
      av: { id: id(), tipo: "ui.aviso", x: x + 864, y: y + 144 },
    };
    for (const k in n) n[k].v = valoresPadrao(n[k].tipo);
    Object.assign(n.log.v, { mensagem: "Interface pronta." });
    if (botao) n.cli.v.alvo = botao.id;
    if (alvo) n.alt.v.alvo = alvo.id;
    n.inc.v.variavel = v.id;
    n.fmt.v.modelo = "Você clicou {0} vez(es).";
    const L = (de, sp, para, ep) => ({ id: novoIdLocal("l"), de, sp, para, ep });
    const ligs = [L(n.ini.id, "exec", n.log.id, "exec"), L(n.cli.id, "exec", n.alt.id, "exec"), L(n.alt.id, "exec", n.inc.id, "exec"), L(n.inc.id, "exec", n.av.id, "exec"), L(n.inc.id, "valor", n.fmt.id, "a"), L(n.fmt.id, "r", n.av.id, "texto")];
    this.mudar("inserir exemplo", (s, g) => {
      if (novaVar) s.variaveis.push(v);
      g.nos.push(...Object.values(n)); g.ligacoes.push(...ligs);
      g.grupos.push({ id: novoIdLocal("c"), x: x - 32, y: y + 96, w: 1180, h: 330, titulo: "Clique: alterna e conta", cor: "#3d8bfd" });
      g.notas.push({ id: novoIdLocal("t"), x: x + 600, y: y - 112, w: 260, h: 96, texto: "Aperte Executar (F5): clique no botão da prévia e veja o fluxo acender aqui.", cor: "#f6d365" });
    });
    requestAnimationFrame(() => this.enquadrar());
  }

  // ================================================================
  // Exportar o código criado em .txt
  // ================================================================
  textoExportacao(modo = "tudo") {
    const n = this.n, s = this.s, agora = new Date();
    const linha = t => `\n${"=".repeat(72)}\n${t}\n${"=".repeat(72)}\n`;
    const leitura = s.grafos.map(g => [`### Grafo: ${g.nome}${g.pasta ? `  (pasta: ${g.pasta})` : ""}${g.desativado ? "  [DESATIVADO]" : ""}`, g.desc ?? "",
      g.grupos.length ? `Pastas: ${g.grupos.map(gr => `${gr.titulo || "Grupo"}${gr.tipo && gr.tipo !== "geral" ? ` [${TIPOS_PASTA[gr.tipo].nome}]` : ""}${gr.recolhido ? " (recolhida)" : ""}`).join(" · ")}` : "", "", this.lerEmTexto(g)].filter((x, i) => i === 3 || x !== "").join("\n")).join("\n\n");
    const partes = [`HEFESTUS · FORJA — código exportado\nProjeto: ${n.nome}\nData: ${agora.toLocaleString("pt-BR")}\nGrafos: ${s.grafos.length} · Nós: ${s.grafos.reduce((k, g) => k + g.nos.length, 0)} · Variáveis: ${s.variaveis.length}\n` +
      (modo === "html" ? "" : "\nPara importar de volta: Visual Script › Importar. Se você editar o texto da seção 1, a Visual Script monta os nós a partir do texto.\n")];
    let sec = 1;
    if (modo !== "html") {
      partes.push(linha(`${sec++}. LEITURA DO SCRIPT (o que cada evento faz, em ordem)`), leitura);
      partes.push(linha(`${sec++}. VARIÁVEIS`));
      partes.push(s.variaveis.length ? s.variaveis.map(v => `${v.nome} (${TIPOS_VAR.find(x => x[0] === v.tipo)?.[1] ?? v.tipo}) = ${JSON.stringify(v.valor)}`).join("\n") : "(nenhuma)");
      const probs = validarScript(s, this.elementos().map(e => e.id)).filter(p => p.nivel !== "info");
      if (probs.length) { partes.push(linha(`${sec++}. PROBLEMAS ENCONTRADOS`)); partes.push(probs.map(p => `- [${p.nivel}] ${p.msg}`).join("\n")); }
    }
    if (modo === "tudo" || modo === "html") {
      partes.push(linha(`${sec++}. CÓDIGO COMPLETO (HTML + CSS + JavaScript, pronto para salvar como .html)`));
      partes.push(gerarHTML(n.doc));
    }
    if (modo === "forja" || modo === "tudo" || modo === "leitura") {
      // bloco de dados: permite reimportar exatamente (posições, pastas, cores)
      const elementos = Object.fromEntries(this.elementos().map(e => [e.id, e.nome]));
      partes.push(linha(`${sec++}. DADOS PARA IMPORTAR (não edite; para mudar o script edite a seção 1)`));
      partes.push(MARCA_INI, JSON.stringify({ formato: "hefestus-forja@1", hashLeitura: hashTexto(leitura), elementos, script: s }), MARCA_FIM);
    }
    return partes.join("\n");
  }
  /** Referência do formato de texto, gerada da biblioteca de nós: para escrever scripts à mão ou pedir a uma IA. */
  guiaFormato() {
    const tipoTxt = p => p.tipo === "el" ? "«Elemento»" : p.tipo === "var" ? "nomeDaVariavel" : p.tipo === "bool" ? "verdadeiro|falso" : p.tipo === "num" ? "número" : p.tipo === "sel" ? p.opcoes.map(o => o[1]).join(" | ") : p.tipo === "txt" ? '"texto"' : "valor";
    const L = [
      "HEFESTUS · FORJA — guia do formato de texto (importável)",
      "",
      "Escreva o script em texto e importe em Visual Script › Importar. A Visual Script cria os nós, as ligações, as pastas e organiza tudo.",
      "",
      "ESTRUTURA",
      "  ### Grafo: Nome do grafo  (pasta: Menus/Arquivo)",
      "  Descrição opcional numa linha",
      "  Pastas: Abrir menus [Código] · Efeitos [Designer] (recolhida) · Atalhos [Eventos] · Contas [Dados] · Testes [Teste]",
      "",
      "  quando <Evento> [propriedades] ⟦Pasta⟧:",
      "      <Ação>(Parâmetro: valor, Parâmetro: valor)",
      "      <Ação>(...)                      ← cada linha continua o fluxo",
      "        ↳ <Saída>:                     ← ramos de nós com várias saídas (Se, Sequência…)",
      "            <Ação>(...)",
      "",
      "VALORES",
      '  "texto entre aspas" · 42 · 3,5 · verdadeiro / falso · «Nome do elemento da tela» · nomeDaVariavel',
      '  Expressões viram nós de valor:  (cliques > 3) · (a + b) · Montar texto("Olá {0}", nome, "", "") · Tamanho da tela().Largura',
      "  Saída de um passo anterior:  Somar à variável.Novo valor · Ao mudar valor.Valor",
      '  Título próprio de um nó:  Mostrar aviso ‹Boas-vindas›(Mensagem: "Oi")',
      "  Entrada especial:  @Reiniciar Só uma vez   ·   Nó desligado:  // (desativado) Registrar(...)",
      "",
      "VARIÁVEIS (seção opcional)",
      "  2. VARIÁVEIS",
      "  ===",
      '  cliques (Número) = 0',
      '  temaNeon (Lógico) = false',
      "",
      "EXEMPLO",
      "  ### Grafo: Contador",
      "  quando Ao clicar [«Botão Entrar»] ⟦Cliques⟧:",
      "      Somar à variável(Variável: cliques, Passo: 1)",
      "      Se(Condição: (cliques > 2))",
      "        ↳ Verdadeiro:",
      '            Mostrar aviso(Mensagem: Montar texto("Já foram {0} cliques", cliques, "", ""))',
      "        ↳ Falso:",
      "            Efeito especial(Elemento: «Botão Entrar», Efeito: Pulsar)",
      "",
      "NÓS DISPONÍVEIS",
    ];
    for (const [cid, c] of Object.entries(CATEGORIAS)) {
      L.push("", `--- ${c.nome.toUpperCase()} ---`);
      for (const [t, d] of Object.entries(NOS)) {
        if (d.cat !== cid || d.desvio) continue;
        const ents = d.ent.filter(p => p.tipo !== "exec");
        const saidas = d.sai.filter(p => p.tipo !== "exec").map(p => p.nome || "resultado");
        const ramos = d.sai.filter(p => p.tipo === "exec" && p.nome).map(p => p.nome);
        if (d.evento) L.push(`quando ${d.nome}${ents.length ? ` [${ents.map(p => tipoTxt(p)).join(", ")}]` : ""}:`);
        else L.push(`${d.nome}${ents.length ? `(${ents.map(p => `${p.nome || "Valor"}: ${tipoTxt(p)}`).join(", ")})` : ""}`);
        L.push(`    ${d.desc}${saidas.length ? ` Saídas: ${saidas.join(", ")}.` : ""}${ramos.length > 1 ? ` Ramos: ${ramos.map(r => `↳ ${r}:`).join(" ")}` : ""}`);
      }
    }
    const els = this.elementos();
    L.push("", "ELEMENTOS DESTA TELA (use entre « »)", ...(els.length ? els.map(e => `  «${e.nome}»  (${e.tipo})`) : ["  (nenhum)"]));
    L.push("", "VARIÁVEIS DESTE PROJETO", ...(this.s.variaveis.length ? this.s.variaveis.map(v => `  ${v.nome} (${TIPOS_VAR.find(x => x[0] === v.tipo)?.[1]}) = ${JSON.stringify(v.valor)}`) : ["  (nenhuma)"]));
    return L.join("\n");
  }
  async exportarTxt(modo = "tudo") {
    const nomes = { forja: "forja", tudo: "codigo-completo", leitura: "leitura-do-script", html: "codigo-html" };
    const texto = modo === "guia" ? this.guiaFormato() : this.textoExportacao(modo), arquivo = modo === "guia" ? "forja-guia-do-formato.txt" : `${this.n.slug?.() ?? "projeto"}.${nomes[modo]}.txt`;
    let r = "indisponivel";
    try { r = await this.n.baixar(arquivo, texto, "text/plain;charset=utf-8"); } catch { /* sem download */ }
    if (r === "salvo") { avisar(`Baixado: ${arquivo}`); return; }
    this.janelaTexto(arquivo, texto);
  }
  /** Quando o download não é permitido (ex.: visualizador do app): mostra o texto para copiar ou compartilhar. */
  janelaTexto(arquivo, texto) {
    const area = h("textarea", { class: "vs-txt-area", readonly: true, spellcheck: false, "aria-label": "Código exportado" }, texto);
    const status = h("span", { class: "vs-txt-status", role: "status" });
    const fechar = () => { veu.remove(); this.tela.focus(); };
    const podeCompartilhar = typeof navigator.share === "function";
    const veu = h("div", { class: "veu vs-ajuda-veu", onclick: e => { if (e.target === veu) fechar(); } },
      h("section", { class: "vs-ajuda vs-txt", role: "dialog", "aria-modal": "true", "aria-label": "Código exportado", tabindex: "-1" },
        h("header", {}, h("h2", {}, arquivo), h("button", { type: "button", class: "vs-mini", "aria-label": "Fechar", html: icone("fechar", 16), onclick: fechar })),
        h("p", { class: "vs-dica" }, "O download não está disponível aqui. Copie o texto ou compartilhe como arquivo."),
        area,
        h("div", { class: "vs-insp-acoes" },
          h("button", { type: "button", class: "vs-bt-pri", onclick: async () => { const ok = await copiar(texto); if (!ok) { area.focus(); area.select(); } status.textContent = ok ? "Copiado ✓" : "Selecionado: use Copiar do sistema"; } }, "Copiar tudo"),
          podeCompartilhar ? h("button", { type: "button", class: "vs-bt-sec", onclick: async () => {
            try {
              const f = new File([texto], arquivo, { type: "text/plain" });
              if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: arquivo });
              else await navigator.share({ title: arquivo, text: texto });
              status.textContent = "Compartilhado ✓";
            } catch (e) { if (e?.name !== "AbortError") status.textContent = "Não foi possível compartilhar."; }
          } }, "Compartilhar") : null,
          status)));
    veu.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); fechar(); } });
    document.body.append(veu);
    veu.querySelector("section").focus();
  }
  menuExportar(ancora) {
    this.fecharFlutuantes();
    const it = (rot, sub, fn) => h("button", { type: "button", role: "menuitem", onclick: () => { this.fecharFlutuantes(); fn(); } }, h("span", { class: "vs-ex-txt" }, h("strong", {}, rot), h("small", {}, sub)));
    const menu = h("div", { class: "vs-menu vs-menu-ex", role: "menu" },
      it("⇄ Visual Script em .txt (reimportável)", "Leitura do script + variáveis + dados para importar de volta, igualzinho", () => this.exportarTxt("forja")),
      it("📄 Tudo em .txt (reimportável)", "O de cima + o código HTML/CSS/JS completo", () => this.exportarTxt("tudo")),
      it("📝 Leitura do script (.txt)", "O que cada evento faz, em ordem; editável e reimportável", () => this.exportarTxt("leitura")),
      it("🧩 Código HTML + CSS + JS (.txt)", "A página funcional; renomeie para .html para abrir", () => this.exportarTxt("html")),
      it("🌐 HTML funcional (.html)", "A página pronta para abrir no navegador", () => this.n.exportarHTML()),
      it("📘 Guia do formato (.txt)", "Todos os nós e parâmetros, para escrever scripts à mão ou pedir a uma IA", () => this.exportarTxt("guia")));
    this.raiz.append(menu);
    const r = ancora.getBoundingClientRect(), rr = this.raiz.getBoundingClientRect();
    Object.assign(menu.style, { left: `${Math.max(8, Math.min(r.left - rr.left, rr.width - 340))}px`, top: `${r.bottom - rr.top + 4}px` });
    this.flutuante = menu;
    menu.querySelector("button")?.focus();
    menu.addEventListener("keydown", ev => { if (ev.key === "Escape") { ev.stopPropagation(); this.fecharFlutuantes(); } });
    setTimeout(() => document.addEventListener("pointerdown", ev => { if (this.flutuante === menu && !menu.contains(ev.target)) this.fecharFlutuantes(); }, { once: true }), 0);
  }

  // ================================================================
  // Importar (.txt da Visual Script, texto legível escrito à mão ou por IA, .json)
  // ================================================================
  abrirImportar(textoInicial = "", nomeArquivo = "") {
    const entrada = h("input", { type: "file", accept: ".txt,.json,text/plain,application/json", hidden: true, onchange: async e => { const f = e.target.files[0]; if (!f) return; area.value = await f.text(); nome.textContent = f.name; analisar(); } });
    const area = h("textarea", { class: "vs-txt-area vs-imp-area", spellcheck: false, placeholder: "Cole aqui o .txt exportado pela Visual Script, ou escreva no formato:\n\n### Grafo: Meu menu\nquando Ao clicar [«Menu Arquivo»]:\n    Alternar visibilidade(Elemento: «Painel Arquivo»)\n    Mostrar aviso(Mensagem: \"Abriu!\")", "aria-label": "Texto para importar", oninput: () => { clearTimeout(this._tImp); this._tImp = setTimeout(analisar, 350); } }, textoInicial);
    const nome = h("span", { class: "vs-imp-nome" }, nomeArquivo);
    const resumo = h("div", { class: "vs-imp-resumo", role: "status" });
    let res = null, modo = "adicionar", fonte = "auto";
    const bImportar = h("button", { type: "button", class: "vs-bt-pri", disabled: true, onclick: () => { if (!res?.script) return; this.aplicarImportacao(res, modo); fechar(); } }, "Importar");
    const seg = (opcoes, atual, fn) => h("div", { class: "vs-seg vs-seg-claro", role: "radiogroup" }, opcoes.map(([v, r]) => h("button", { type: "button", role: "radio", "aria-checked": String(v === atual), onclick: e => { fn(v); e.currentTarget.parentElement.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", String(b === e.currentTarget))); analisar(); } }, r)));
    const analisar = () => {
      const t = area.value;
      if (!t.trim()) { resumo.replaceChildren(h("p", { class: "vs-dica" }, "Escolha um arquivo ou cole o texto.")); bImportar.disabled = true; return; }
      res = this.analisarImportacao(t, fonte);
      bImportar.disabled = !res.script;
      const nNos = res.script ? res.script.grafos.reduce((k, g) => k + g.nos.length, 0) : 0;
      resumo.replaceChildren(...[
        res.script ? h("p", { class: "vs-imp-ok" }, `${res.origem === "dados" ? "⇄ Dados exatos" : "📝 Lido do texto"} · ${res.script.grafos.length} grafo(s) · ${nNos} nó(s) · ${res.script.variaveis.length} variável(is)`) : h("p", { class: "vs-imp-erro" }, "Não encontrei nada para importar."),
        res.textoEditado ? h("p", { class: "vs-dica" }, "O texto foi editado depois de exportado: por padrão uso o texto. Escolha “Dados exatos” para ignorar as edições.") : null,
        res.faltando.length ? h("p", { class: "vs-imp-aviso" }, `Elementos não encontrados nesta tela (ficam para você escolher): ${res.faltando.slice(0, 8).map(x => `«${x}»`).join(", ")}${res.faltando.length > 8 ? "…" : ""}`) : null,
        res.avisos.length ? h("ul", { class: "vs-imp-avisos" }, res.avisos.slice(0, 8).map(a => h("li", {}, a))) : null].filter(Boolean));
    };
    const fechar = () => { veu.remove(); this.tela.focus(); };
    const veu = h("div", { class: "veu vs-ajuda-veu", onclick: e => { if (e.target === veu) fechar(); } },
      h("section", { class: "vs-ajuda vs-txt vs-imp", role: "dialog", "aria-modal": "true", "aria-label": "Importar para a Visual Script", tabindex: "-1" },
        h("header", {}, h("h2", {}, "Importar para a Visual Script"), h("button", { type: "button", class: "vs-mini", "aria-label": "Fechar", html: icone("fechar", 16), onclick: fechar })),
        h("div", { class: "vs-insp-acoes", style: "padding:0" }, h("button", { type: "button", class: "vs-bt-sec", onclick: () => entrada.click() }, "📂 Escolher arquivo .txt / .json"), nome, entrada),
        area,
        h("div", { class: "vs-imp-opcoes" },
          h("label", {}, h("span", { class: "vs-pop-tit" }, "Como importar"), seg([["adicionar", "Adicionar como novos grafos"], ["substituir", "Substituir todo o script"]], modo, v => { modo = v; })),
          h("label", {}, h("span", { class: "vs-pop-tit" }, "Usar"), seg([["auto", "Automático"], ["dados", "Dados exatos"], ["texto", "O texto"]], fonte, v => { fonte = v; }))),
        resumo,
        h("div", { class: "vs-insp-acoes", style: "justify-content:flex-end;padding-bottom:0" }, h("button", { type: "button", class: "vs-bt-sec", onclick: fechar }, "Cancelar"), bImportar)));
    veu.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); fechar(); } });
    document.body.append(veu);
    veu.querySelector("section").focus();
    analisar();
  }
  /** Descobre o que importar: bloco de dados exato, JSON puro ou o texto legível. */
  analisarImportacao(texto, fonte = "auto") {
    const avisos = [], t = texto.replace(/\r/g, "");
    let dados = null;
    const i = t.indexOf(MARCA_INI), j = t.indexOf(MARCA_FIM);
    try {
      if (i >= 0 && j > i) dados = JSON.parse(t.slice(i + MARCA_INI.length, j).trim());
      else if (/^\s*[{[]/.test(t)) {
        const o = JSON.parse(t);
        dados = o.script ? o : o.grafos ? { script: o } : o.doc?.elementos?.__script ? { script: o.doc.elementos.__script } : o.elementos?.__script ? { script: o.elementos.__script } : null;
      }
    } catch (e) { avisos.push(`Bloco de dados ilegível (${e.message}); vou tentar pelo texto.`); dados = null; }
    const secao1 = this.extrairLeitura(t);
    const soLeitura = secao1 ? secao1.split("\n\n#VARIAVEIS")[0] : null;
    const textoEditado = !!(dados?.hashLeitura && soLeitura && hashTexto(soLeitura) !== dados.hashLeitura);
    const usarDados = dados?.script && (fonte === "dados" || (fonte === "auto" && !textoEditado));
    if (usarDados) {
      const sc = clonar(dados.script);
      sc.grafos ??= []; sc.variaveis ??= [];
      for (const g of sc.grafos) { g.nos ??= []; g.ligacoes ??= []; g.grupos ??= []; g.notas ??= []; }
      const faltando = this.remapearElementos(sc, dados.elementos ?? {});
      return { origem: "dados", script: sc, avisos, faltando, textoEditado };
    }
    if (fonte === "dados") return { origem: "dados", script: null, avisos: [...avisos, "Este texto não tem bloco de dados."], faltando: [], textoEditado };
    const r = this.lerTextoForja(secao1 ?? t);
    return { origem: "texto", script: r.script.grafos.some(g => g.nos.length) ? r.script : null, avisos: [...avisos, ...r.avisos], faltando: r.faltando, textoEditado };
  }
  /** Só a seção de leitura (do primeiro “### Grafo”/“quando” até a próxima seção numerada ou o bloco de dados). */
  extrairLeitura(t) {
    const linhas = t.split("\n");
    let ini = linhas.findIndex(l => /^###\s*Grafo:/i.test(l.trim()) || /^quando\s/i.test(l.trim()));
    if (ini < 0) return null;
    let fim = linhas.findIndex((l, k) => k > ini && (/^={10,}$/.test(l.trim()) || l.includes(MARCA_INI)));
    if (fim < 0) fim = linhas.length;
    // inclui também a seção de variáveis (para recriar as variáveis pelo texto)
    const vi = linhas.findIndex(l => /^\d+\.\s*VARI[AÁ]VEIS/i.test(l.trim()));
    let vars = "";
    if (vi >= 0) { let vf = linhas.findIndex((l, k) => k > vi + 1 && /^={10,}$/.test(l.trim())); const corpo = linhas.slice(vi + 2, vf < 0 ? undefined : vf); if (corpo.length) vars = "\n\n#VARIAVEIS\n" + corpo.join("\n"); }
    return linhas.slice(ini, fim).join("\n").trim() + vars;
  }
  /** Elementos com outro id nesta tela (mas mesmo nome) passam a apontar para o certo; devolve os que não existem. */
  remapearElementos(sc, nomesOrigem) {
    const atuais = this.elementos(), porId = new Map(atuais.map(e => [e.id, e])), porNome = new Map(atuais.map(e => [normal(e.nome), e.id]));
    const faltando = new Set();
    const mapear = id => {
      if (!id) return id;
      const nomeOrig = nomesOrigem[id];
      if (porId.has(id) && (!nomeOrig || normal(porId.get(id).nome) === normal(nomeOrig))) return id;
      const achado = nomeOrig && porNome.get(normal(nomeOrig));
      if (achado) return achado;
      faltando.add(nomeOrig ?? id);
      return id;
    };
    for (const g of sc.grafos) {
      for (const n of g.nos) { const d = NOS[n.tipo]; if (!d) continue; for (const p of d.ent) if (p.tipo === "el" && n.v?.[p.id]) n.v[p.id] = mapear(n.v[p.id]); }
      for (const gr of g.grupos) if (gr.objeto) gr.objeto = mapear(gr.objeto);
    }
    for (const v of sc.variaveis) if (v.tipo === "elemento" && v.valor) v.valor = mapear(v.valor);
    return [...faltando];
  }
  /**
   * Lê o formato de texto da Visual Script e monta os nós:
   *   ### Grafo: Nome  (pasta: X)
   *   quando Ao clicar [«Botão»]:
   *       Alternar visibilidade(Elemento: «Painel»)
   *       Se(Condição: (cliques > 3))
   *         ↳ Verdadeiro:
   *             Mostrar aviso(Mensagem: "Muitos cliques")
   */
  lerTextoForja(texto) {
    const avisos = [], faltando = new Set();
    const els = this.elementos(), elPorNome = new Map(els.map(e => [normal(e.nome), e.id]));
    const variaveis = clonar(this.s.variaveis), varPorNome = new Map(variaveis.map(v => [normal(v.nome), v]));
    const novasVars = [];
    const defPorNome = new Map();
    for (const [t, d] of Object.entries(NOS)) if (!defPorNome.has(normal(d.nome))) defPorNome.set(normal(d.nome), t);
    const script = { versao: 1, grafos: [], variaveis: [] };
    let g = null;
    const novoGrafo = (nome, pasta, desativado) => { g = grafoVazio(nome || "Importado"); if (pasta) g.pasta = pasta; if (desativado) g.desativado = true; script.grafos.push(g); return g; };
    const linhas = texto.split("\n");
    // ----- variáveis (seção #VARIAVEIS) -----
    const vi = linhas.findIndex(l => l.trim() === "#VARIAVEIS");
    if (vi >= 0) {
      for (const l of linhas.slice(vi + 1)) {
        const m = /^\s*([^\s(]+)\s*\(([^)]+)\)\s*=\s*(.*)$/.exec(l); if (!m) continue;
        const tipo = TIPOS_VAR.find(x => normal(x[1]) === normal(m[2]))?.[0] ?? "texto";
        let valor; try { valor = JSON.parse(m[3]); } catch { valor = m[3]; }
        const ex = varPorNome.get(normal(m[1]));
        if (ex) { ex.tipo = tipo; ex.valor = valor; continue; }
        const v = { id: novoIdLocal("v"), nome: m[1], tipo, valor }; variaveis.push(v); novasVars.push(v); varPorNome.set(normal(v.nome), v);
      }
      linhas.length = vi;
    }
    const acharVar = (nome, criar = true) => {
      const k = normal(nome).trim(); if (!k) return null;
      let v = varPorNome.get(k);
      if (!v && criar) { v = { id: novoIdLocal("v"), nome: nome.trim(), tipo: "numero", valor: 0 }; variaveis.push(v); novasVars.push(v); varPorNome.set(k, v); avisos.push(`Variável “${v.nome}” criada (tipo Número; ajuste se precisar).`); }
      return v;
    };
    const acharTipo = nome => { const k = normal(nome).trim(); return defPorNome.get(k) ?? [...defPorNome].find(([n]) => n.startsWith(k))?.[1] ?? null; };
    const dividir = str => { const out = []; let prof = 0, aspas = false, cur = ""; for (let k = 0; k < str.length; k++) { const c = str[k]; if (c === '"' && str[k - 1] !== "\\") aspas = !aspas; if (!aspas) { if (c === "(" || c === "«" || c === "‹") prof++; else if (c === ")" || c === "»" || c === "›") prof--; else if (c === "," && prof === 0) { out.push(cur.trim()); cur = ""; continue; } } cur += c; } if (cur.trim()) out.push(cur.trim()); return out; };
    const cabeca = str => { // "Nome ‹Título›(args).Porta" → partes
      const m = /^(.+?)(?:\s*‹([^›]*)›)?\s*(?:\((.*)\))?(?:\.([^.()"«»]+))?$/s.exec(str.trim());
      return m ? { nome: m[1].trim(), titulo: m[2], args: m[3], porta: m[4] } : null;
    };
    let criados = [];
    const criarNo = (tipo, titulo) => { const no = { id: novoIdLocal("n"), tipo, x: 0, y: 0, v: valoresPadrao(tipo) }; if (titulo) no.titulo = titulo; g.nos.push(no); criados.push(no); return no; };
    const ligar = (de, sp, para, ep) => g.ligacoes.push({ id: novoIdLocal("l"), de: de.id, sp, para: para.id, ep });
    const OPS = [[" == ", "l.comparar", "=="], [" != ", "l.comparar", "!="], [" >= ", "l.comparar", ">="], [" <= ", "l.comparar", "<="], [" > ", "l.comparar", ">"], [" < ", "l.comparar", "<"], [" + ", "m.somar"], [" − ", "m.subtrair"], [" - ", "m.subtrair"], [" × ", "m.multiplicar"], [" * ", "m.multiplicar"], [" ÷ ", "m.dividir"], [" / ", "m.dividir"], [" resto ", "m.resto"], [" e ", "l.e"], [" ou ", "l.ou"], [" & ", "t.juntar"]];
    const topo = (str, sep) => { let prof = 0, aspas = false; for (let k = 0; k <= str.length - sep.length; k++) { const c = str[k]; if (c === '"') aspas = !aspas; if (aspas) continue; if (c === "(" || c === "«") prof++; else if (c === ")" || c === "»") prof--; else if (prof === 0 && str.startsWith(sep, k)) return k; } return -1; };
    const literal = (raw, p) => {
      raw = raw.trim();
      if (p.tipo === "el") { const m = /^«(.*)»$/.exec(raw), nome = m ? m[1] : raw.replace(/^"|"$/g, ""); if (!nome || nome === "—") return ""; const id = elPorNome.get(normal(nome)) ?? (els.some(e => e.id === nome) ? nome : null); if (!id) { faltando.add(nome); return ""; } return id; }
      if (p.tipo === "var") return acharVar(raw.replace(/^"|"$/g, ""))?.id ?? "";
      if (p.tipo === "sel") { const k = normal(raw.replace(/^"|"$/g, "")); return p.opcoes.find(o => normal(o[1]) === k || normal(o[0]) === k)?.[0] ?? p.padrao; }
      if (p.tipo === "bool") return /^(verdadeiro|true|sim|1)$/i.test(raw);
      if (p.tipo === "num") { const x = Number(raw.replace(",", ".")); return Number.isFinite(x) ? x : p.padrao; }
      if (/^".*"$/s.test(raw)) { try { return JSON.parse(raw); } catch { return raw.slice(1, -1); } }
      if (p.tipo === "any") { if (/^-?\d+([.,]\d+)?$/.test(raw)) return Number(raw.replace(",", ".")); if (/^(verdadeiro|falso)$/i.test(raw)) return /^v/i.test(raw); }
      return raw;
    };
    /** Expressão de valor → nó de dados (chamada, operação, referência a saída, variável). null = é literal. */
    const expr = (raw, prof = 0) => {
      raw = raw.trim();
      if (!raw || prof > 10 || /^".*"$/s.test(raw) || /^«.*»$/.test(raw) || /^-?\d+([.,]\d+)?$/.test(raw) || /^(verdadeiro|falso)$/i.test(raw)) return null;
      if (raw.startsWith("(") && raw.endsWith(")") && topo(raw.slice(1, -1), ")") < 0 || (raw.startsWith("(") && raw.endsWith(")"))) {
        const dentro = raw.slice(1, -1);
        for (const [sep, tipo, op] of OPS) {
          const k = topo(dentro, sep);
          if (k < 0) continue;
          const no = criarNo(tipo), d = NOS[tipo], ents = d.ent.filter(p => p.tipo !== "exec" && !p.prop);
          if (op) no.v.op = op;
          valor(no, ents[0], dentro.slice(0, k), prof + 1); valor(no, ents[ents.length - 1], dentro.slice(k + sep.length), prof + 1);
          return { no, porta: d.sai[0].id };
        }
      }
      const c = cabeca(raw);
      if (c) {
        // referência à saída de um nó anterior: “Somar à variável.Novo valor”
        if (c.args === undefined && c.porta) {
          const alvo = [...criados].reverse().find(n => normal(n.titulo ?? NOS[n.tipo]?.nome) === normal(c.titulo ?? c.nome) || normal(NOS[n.tipo]?.nome) === normal(c.nome));
          const p = alvo && NOS[alvo.tipo].sai.find(x => normal(x.nome) === normal(c.porta) || x.id === c.porta);
          if (p) return { no: alvo, porta: p.id };
        }
        const tipo = c.args !== undefined ? acharTipo(c.nome) : null;
        if (tipo && NOS[tipo].puro) {
          const no = criarNo(tipo, c.titulo), d = NOS[tipo], ents = d.ent.filter(p => p.tipo !== "exec");
          dividir(c.args).forEach((a, k) => { if (ents[k]) valor(no, ents[k], a, prof + 1); });
          const p = c.porta ? d.sai.find(x => normal(x.nome) === normal(c.porta)) : null;
          return { no, porta: (p ?? d.sai[0]).id };
        }
      }
      const v = varPorNome.get(normal(raw));
      if (v) { const no = criarNo("var.obter"); no.v.variavel = v.id; return { no, porta: "r" }; }
      return null;
    };
    const valor = (no, p, raw, prof = 0) => {
      if (!p) return;
      if (!p.prop && p.tipo !== "var" && p.tipo !== "sel") { const f = expr(raw, prof); if (f) { ligar(f.no, f.porta, no, p.id); (no._dados ??= []).push(f.no); return; } }
      no.v[p.id] = literal(raw, p);
    };
    const aplicarArgs = (no, argsStr, soProps) => {
      if (argsStr === undefined || !argsStr.trim()) return;
      const d = NOS[no.tipo], ents = d.ent.filter(p => p.tipo !== "exec" && (!soProps || true));
      let pos = 0;
      for (const a of dividir(argsStr)) {
        const m = /^([^:"«(‹]+?):\s*(.*)$/s.exec(a);
        const p = m && ents.find(x => normal(x.nome) === normal(m[1]) || x.id === m[1].trim());
        if (p) valor(no, p, m[2]); else { valor(no, ents[pos], a); }
        pos++;
      }
    };
    // ----- linhas → árvore de eventos -----
    let k = 0;
    const blocos = [];
    while (k < linhas.length) {
      const bruta = linhas[k], l = bruta.trim();
      let m;
      if ((m = /^###\s*Grafo:\s*(.+?)(?:\s+\(pasta:\s*([^)]+)\))?(\s+\[DESATIVADO\])?\s*$/i.exec(l))) {
        novoGrafo(m[1].trim(), m[2]?.trim(), !!m[3]); g._pastas = new Map(); k++;
        let primeira = true;
        while (k < linhas.length && linhas[k].trim() && !/^quando\s/i.test(linhas[k].trim()) && !/^###/.test(linhas[k].trim())) {
          const x = linhas[k].trim();
          if (/^Pastas:/i.test(x)) for (const parte of x.replace(/^Pastas:\s*/i, "").split(" · ")) { const mp = /^(.+?)(?:\s*\[([^\]]+)\])?(\s*\(recolhida\))?$/i.exec(parte.trim()); if (mp) g._pastas.set(mp[1].trim(), { tipo: tipoPastaDeNome(mp[2]), recolhida: !!mp[3] }); }
          else if (primeira && !/^Este grafo/i.test(x)) g.desc = x;
          primeira = false; k++;
        }
        continue;
      }
      if ((m = /^quando\s+(.+?)\s*(?:\[(.*)\])?\s*(?:⟦(.+?)⟧)?\s*:\s*$/i.exec(l))) {
        if (!g) novoGrafo("Importado");
        const corpo = [];
        k++;
        while (k < linhas.length && (linhas[k].trim() === "" || /^\s/.test(linhas[k])) && !/^quando\s/i.test(linhas[k].trim())) { if (linhas[k].trim()) corpo.push(linhas[k]); k++; }
        blocos.push({ g, evento: m[1], props: m[2], pasta: m[3]?.trim(), corpo });
        continue;
      }
      if (l && !/^\/\//.test(l) && !/^Pastas:/i.test(l) && !/^Este grafo/i.test(l)) avisos.push(`Linha ignorada: “${l.slice(0, 60)}”`);
      k++;
    }
    for (const bl of blocos) {
      g = bl.g; criados = [];
      const tipoEv = acharTipo(bl.evento);
      if (!tipoEv || !NOS[tipoEv].evento) { avisos.push(`Evento desconhecido: “${bl.evento}”`); continue; }
      const ev = criarNo(tipoEv);
      if (bl.props) { const ents = NOS[tipoEv].ent; dividir(bl.props).forEach((a, i2) => { if (ents[i2]) ev.v[ents[i2].id] = literal(a, ents[i2]); }); }
      const itens = bl.corpo.map(x => ({ ind: x.match(/^\s*/)[0].replace(/\t/g, "    ").length, t: x.trim() })).filter(x => x.t !== "(nada ligado)" && !x.t.startsWith("↻") && !/^\/\/(?!\s*\(desativado\))/.test(x.t));
      const ler = (i0, ind) => { const out = []; let i2 = i0; while (i2 < itens.length && itens[i2].ind >= ind) { const it = itens[i2]; const mb = /^↳\s*(.+?):$/.exec(it.t); if (it.ind > ind && !mb) { i2++; continue; } if (mb) { const filhoInd = itens[i2 + 1]?.ind > it.ind ? itens[i2 + 1].ind : Infinity; const [filhos, j2] = ler(i2 + 1, filhoInd); out.push({ ramo: mb[1], filhos }); i2 = j2; } else { out.push({ passo: it.t }); i2++; } } return [out, i2]; };
      const [arvore] = itens.length ? ler(0, itens[0].ind) : [[]];
      const passo = txt => {
        let desativado = false, entrada = null, m;
        if ((m = /^\/\/\s*\(desativado\)\s*/.exec(txt))) { desativado = true; txt = txt.slice(m[0].length); }
        if ((m = /^@(\S+)\s+/.exec(txt))) { entrada = m[1].replace(/_/g, " "); txt = txt.slice(m[0].length); }
        const c = cabeca(txt);
        const tipo = c && acharTipo(c.nome);
        if (!tipo) { avisos.push(`Nó desconhecido: “${txt.slice(0, 50)}”`); return null; }
        const no = criarNo(tipo, c.titulo);
        if (desativado) no.desativado = true;
        aplicarArgs(no, c.args);
        no._entrada = entrada ? (NOS[tipo].ent.find(p => p.tipo === "exec" && normal(p.nome) === normal(entrada))?.id ?? "exec") : (NOS[tipo].ent.find(p => p.tipo === "exec")?.id ?? "exec");
        return no;
      };
      const montar = (lista, origem) => {
        let ant = origem, ultimo = origem?.no;
        for (const item of lista) {
          if (item.passo) {
            const no = passo(item.passo); if (!no) continue;
            if (ant?.porta) ligar(ant.no, ant.porta, no, no._entrada);
            ultimo = no;
            ant = { no, porta: NOS[no.tipo].sai.find(p => p.tipo === "exec")?.id };
          } else if (item.ramo && ultimo) {
            const p = NOS[ultimo.tipo].sai.find(x => x.tipo === "exec" && (normal(x.nome) === normal(item.ramo) || x.id === item.ramo));
            if (!p) { avisos.push(`Saída “${item.ramo}” não existe em ${NOS[ultimo.tipo].nome}.`); continue; }
            montar(item.filhos, { no: ultimo, porta: p.id });
          }
        }
      };
      montar(arvore, { no: ev, porta: "exec" });
      bl.ev = ev;
    }
    // ----- posições: um evento por faixa, a cadeia da esquerda para a direita, ramos em linhas abaixo -----
    for (const gr of script.grafos) {
      let yBase = 0;
      const lig = new Map();
      for (const l of gr.ligacoes) { if (!lig.has(l.de)) lig.set(l.de, []); lig.get(l.de).push(l); }
      const porId = new Map(gr.nos.map(n => [n.id, n]));
      const posto = new Set();
      const meus = blocos.filter(b => b.g === gr && b.ev);
      const ordem = [...new Set(meus.map(b => b.pasta ?? ""))];
      meus.sort((a, b) => ordem.indexOf(a.pasta ?? "") - ordem.indexOf(b.pasta ?? ""));
      let pastaAtual;
      // duas colunas, como no editor: Função/Geral à esquerda, Visual à direita
      const colDe = bl => (gr._pastas?.get(bl.pasta ?? "")?.tipo === "visual" ? 1 : 0);
      const yCol = [0, 0];
      for (const bl of meus) {
        const c = colDe(bl);
        if (bl.pasta !== pastaAtual) { if (pastaAtual !== undefined) yCol[colDe({ pasta: pastaAtual })] += 120; pastaAtual = bl.pasta; }
        yBase = yCol[c]; bl.col = c;
        bl.ids = new Set();
        let linhaMax = 0;
        const colocar = (no, col, lin) => {
          if (posto.has(no.id)) return; posto.add(no.id); bl.ids.add(no.id);
          no.x = col * 300; no.y = yBase + lin * 230;
          (no._dados ?? []).forEach((d, i2) => { if (posto.has(d.id)) return; posto.add(d.id); bl.ids.add(d.id); for (const d2 of d._dados ?? []) bl.ids.add(d2.id); d.x = no.x - 20 + i2 * 30; d.y = no.y + this.altura(no) + 28 + i2 * 12; (d._dados ?? []).forEach((d2, i3) => { if (!posto.has(d2.id)) { posto.add(d2.id); d2.x = d.x - 210; d2.y = d.y + i3 * 90; } }); });
          const saidas = (lig.get(no.id) ?? []).filter(l => { const t = tipoPorta(gr, l.de, l.sp, "sai"); return t === "exec"; });
          saidas.forEach((l, i2) => { const filho = porId.get(l.para); if (!filho) return; let lnova = lin; if (i2 > 0) lnova = ++linhaMax; colocar(filho, col + 1, lnova); });
        };
        colocar(bl.ev, 0, 0);
        yBase += (linhaMax + 1) * 230 + 70;
        yCol[c] = yBase;
      }
      const porIdF = new Map(gr.nos.map(n => [n.id, n]));
      const col0 = meus.filter(b => b.col === 0).flatMap(b => [...b.ids].map(id => porIdF.get(id))).filter(Boolean);
      const desloc = (col0.length ? Math.max(...col0.map(n => n.x + this.largura(n))) : 0) + 200;
      for (const bl of meus.filter(b => b.col === 1)) for (const id of bl.ids) { const n = porIdF.get(id); if (n) n.x += desloc; }
      yBase = Math.max(...yCol);
      for (const n of gr.nos) { if (!posto.has(n.id)) { n.x = 0; n.y = yBase; yBase += 120; } n.x = Math.round(n.x / 16) * 16; n.y = Math.round(n.y / 16) * 16; delete n._dados; delete n._filhos; delete n._entrada; }
      // molduras das pastas em volta dos eventos de cada uma
      for (const nomePasta of ordem.filter(Boolean)) {
        const ids = new Set(meus.filter(b => b.pasta === nomePasta).flatMap(b => [...b.ids]));
        const nos = gr.nos.filter(n => ids.has(n.id)); if (!nos.length) continue;
        const x1 = Math.min(...nos.map(n => n.x)), y1 = Math.min(...nos.map(n => n.y)), x2 = Math.max(...nos.map(n => n.x + this.largura(n))), y2 = Math.max(...nos.map(n => n.y + this.altura(n)));
        const info = gr._pastas?.get(nomePasta) ?? { tipo: "geral" };
        const grupo = { id: novoIdLocal("c"), x: x1 - 28, y: y1 - 64, w: x2 - x1 + 56, h: y2 - y1 + 92, titulo: nomePasta, cor: TIPOS_PASTA[info.tipo].cor };
        if (info.tipo !== "geral") grupo.tipo = info.tipo;
        if (info.recolhida) { grupo.recolhido = true; grupo.membros = nos.map(n => n.id); grupo.membrosNotas = []; }
        gr.grupos.push(grupo);
      }
      delete gr._pastas;
    }
    script.variaveis = variaveis;
    return { script, avisos, faltando: [...faltando] };
  }
  /** Aplica a importação como um passo do histórico (Ctrl+Z desfaz). */
  aplicarImportacao(res, modo) {
    const sc = clonar(res.script);
    let primeiro = null;
    this.mudar(modo === "substituir" ? "importar (substituir script)" : `importar ${sc.grafos.length} grafo(s)`, s2 => {
      if (modo === "substituir") {
        s2.grafos = sc.grafos; s2.variaveis = sc.variaveis; s2.pastas = sc.pastas ?? []; s2.coresPastas = sc.coresPastas ?? {}; s2.coresEl = sc.coresEl ?? {};
        primeiro = (s2.grafos.find(g => g.nos.length) ?? s2.grafos[0])?.id;
        return;
      }
      // adicionar: variáveis de mesmo nome são reaproveitadas; grafos ganham ids novos e nome único
      const mapaVar = {};
      for (const v of sc.variaveis) {
        const ex = s2.variaveis.find(x => normal(x.nome) === normal(v.nome));
        if (ex) mapaVar[v.id] = ex.id;
        else { const id = s2.variaveis.some(x => x.id === v.id) ? novoIdLocal("v") : v.id; mapaVar[v.id] = id; s2.variaveis.push({ ...v, id }); }
      }
      const nomes = new Set(s2.grafos.map(x => x.nome));
      for (const g of sc.grafos) {
        g.id = novoIdLocal("g");
        let nome = g.nome; for (let k = 2; nomes.has(nome); k++) nome = `${g.nome} (${k})`;
        g.nome = nome; nomes.add(nome);
        for (const n of g.nos) for (const p of NOS[n.tipo]?.ent ?? []) if (p.tipo === "var" && n.v?.[p.id] && mapaVar[n.v[p.id]]) n.v[p.id] = mapaVar[n.v[p.id]];
        s2.grafos.push(g);
        if (g.nos.length) primeiro ??= g.id;
      }
      s2.pastas = [...new Set([...(s2.pastas ?? []), ...(sc.pastas ?? [])])];
      s2.coresPastas = { ...(sc.coresPastas ?? {}), ...(s2.coresPastas ?? {}) };
      primeiro ??= s2.grafos[s2.grafos.length - 1]?.id;
    });
    if (primeiro) { this.ui.vsAbas = []; this.abrirGrafo(primeiro); setTimeout(() => this.enquadrar(), 160); }
    avisar(`Importado: ${sc.grafos.length} grafo(s)${res.faltando.length ? ` · ${res.faltando.length} elemento(s) para escolher` : ""}. Ctrl+Z desfaz.`);
  }

  // ================================================================
  // Exemplo: menu de sistema moderno (design + script organizado em pastas)
  // ================================================================
  inserirMenuExemplo() {
    const n = this.n, tela = n.tela;
    const W = Math.max(720, Math.min(1180, (tela.largura ?? 960) - 32));
    const fundir = (a, b) => { const r = structuredClone(a); for (const [k, v] of Object.entries(b)) r[k] = v && typeof v === "object" && !Array.isArray(v) && r[k] && typeof r[k] === "object" ? fundir(r[k], v) : v; return r; };
    const el = (tipo, props) => fundir(CATALOGO[tipo].padrao(), { tipo, eventos: [], ...props });
    const vidro = (a = "#1b1f3b", b = "#121628", c = "#2a1640") => ({ fundo: b, borda: "transparent", larguraBorda: 0, raio: 16,
      preenchimentos: [{ tipo: "linear", angulo: 110, visivel: true, paradas: [{ pos: 0, cor: a }, { pos: 55, cor: b }, { pos: 100, cor: c }] }],
      tracos: [{ cor: "#8b7bff", largura: 1, visivel: true, posicao: "dentro", estilo: "solido" }],
      efeitos: [{ tipo: "sombra", x: 0, y: 14, blur: 34, espalhar: 0, cor: "#6d4bff59", visivel: true }, { tipo: "sombraInterna", x: 0, y: 1, blur: 0, espalhar: 0, cor: "#ffffff26", visivel: true }, { tipo: "vidro", blur: 14, visivel: true }] });
    const botaoMenu = (rotulo, x, extra = {}) => el("botao", { x, y: 10, largura: 88, altura: 36, rotulo, estilo: { fundo: "transparent", cor: "#c9cdf2", borda: "transparent", larguraBorda: 0, raio: 10, peso: 500, tamanhoFonte: 14 }, estados: { hover: { fundo: "#ffffff14" }, active: { fundo: "#ffffff22" } }, ...extra });
    const item = (rotulo, ordem) => el("botao", { x: 8, y: 8 + ordem * 36, largura: 224, altura: 34, rotulo, estilo: { fundo: "transparent", cor: "#e3e6ff", borda: "transparent", larguraBorda: 0, raio: 9, peso: 400, tamanhoFonte: 13.5, alinhamento: "esquerda" }, estados: { hover: { fundo: "#7c5cff38" }, active: { fundo: "#7c5cff55" } } });
    const separador = ordem => el("caixa", { x: 16, y: 12 + ordem * 36, largura: 208, altura: 1, estilo: { fundo: "#ffffff1f", borda: "transparent", larguraBorda: 0, raio: 0 } });
    const painel = (nome, x, itens, largura = 240, y = 70) => {
      let k = 0; const filhos = [];
      for (const it of itens) { if (it === "-") filhos.push(["sep" + k, separador(k)]); else filhos.push([it[0], item(it[1], k)]); k++; }
      const alt = 16 + itens.length * 36;
      return { ref: nome, el: el("container", { x, y, largura, altura: alt, nome, layout: { modo: "coluna", espaco: 2, margem: 8, alinhar: "estica", abracar: true },
        estilo: { ...vidro("#20254a", "#151a30", "#22163a"), raio: 14 }, abertura: { iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "crescer", fundoEscuro: false, ancorar: false } }), filhos };
    };
    const X = { arquivo: 180, editar: 272, exibir: 364, ferramentas: 456 };
    const paineis = [
      painel("Painel Arquivo", X.arquivo, [["iNovo", "📄  Novo projeto"], ["iAbrir", "📂  Abrir…"], ["iSalvar", "💾  Salvar"], ["iExportar", "✦  Exportar  ▸"], "-", ["iSairA", "⏻  Sair"]]),
      painel("Painel Editar", X.editar, [["iDesfazer", "↶  Desfazer"], ["iRefazer", "↷  Refazer"], "-", ["iCopiar", "⧉  Copiar"], ["iColar", "📋  Colar"]]),
      painel("Painel Exibir", X.exibir, [["iTema", "🌈  Tema neon"], ["iFoco", "🎯  Modo foco"], ["iZoom", "🔍  Ampliar ícones"]]),
      painel("Painel Ferramentas", X.ferramentas, [["iConfete", "🎉  Lançar confete"], ["iFaiscas", "✨  Faíscas no logo"], ["iTremer", "📳  Sacudir a barra"]]),
      painel("Painel Notificações", W - 360, [["iN1", "✅  Build concluído"], ["iN2", "💬  Nova mensagem de Ana"], ["iN3", "⚠️  Disco quase cheio"], "-", ["iLidas", "✓  Marcar todas como lidas"]], 270),
      painel("Painel Exportar", X.arquivo + 244, [["iPng", "🖼  Imagem PNG"], ["iPdf", "📑  Documento PDF"], ["iHtml", "🌐  Página HTML"]], 210, 178),
      painel("Gaveta móvel", 8, [["gArquivo", "📁  Arquivo"], ["gEditar", "✏️  Editar"], ["gExibir", "👁  Exibir"], ["gFerramentas", "🧰  Ferramentas"], "-", ["gNotif", "🔔  Notificações"]], 230),
      painel("Painel Perfil", W - 256, [["iPerfil", "👤  Meu perfil"], ["iPrefs", "⚙️  Preferências"], ["iTema2", "🌗  Alternar tema"], "-", ["iSair", "⏻  Sair"]]),
    ];
    const elementos = [
      { ref: "menu", el: el("container", { x: 0, y: 0, largura: W, altura: 56, nome: "Menu de sistema", layout: { modo: "livre", abracar: false, margem: 0, espaco: 0 }, estilo: { fundo: "transparent", borda: "transparent", larguraBorda: 0, raio: 16 } }) },
      { ref: "barra", el: el("caixa", { x: 0, y: 0, largura: W, altura: 56, nome: "Barra de vidro", pai: "menu", estilo: vidro() }) },
      { ref: "logo", el: el("forma", { x: 14, y: 10, largura: 36, altura: 36, nome: "Logo", pai: "menu", forma: "hexagono", texto: "✦", estilo: { fundo: "#7c5cff", cor: "#ffffff", borda: "transparent", larguraBorda: 0, peso: 700, tamanhoFonte: 16,
        preenchimentos: [{ tipo: "conico", angulo: 0, cx: 50, cy: 50, visivel: true, paradas: [{ pos: 0, cor: "#ff5f6d" }, { pos: 25, cor: "#ffc371" }, { pos: 50, cor: "#7cf29c" }, { pos: 75, cor: "#5ec8ff" }, { pos: 100, cor: "#b28dff" }] }],
        efeitos: [{ tipo: "sombra", x: 0, y: 0, blur: 16, espalhar: 0, cor: "#b28dffaa", visivel: true }] } }) },
      { ref: "hamburguer", el: botaoMenu("☰", 60, { nome: "Botão de menu (celular)", pai: "menu", largura: 44, estilo: { fundo: "#ffffff12", cor: "#eef0ff", borda: "transparent", larguraBorda: 0, raio: 12, tamanhoFonte: 18 }, abertura: { iniciaFechado: true } }) },
      { ref: "relogio", el: el("texto", { x: W - 340, y: 18, largura: 64, altura: 20, nome: "Relógio", pai: "menu", texto: "--:--", estilo: { cor: "#c9cdf2", tamanhoFonte: 13, peso: 600, fundo: "transparent", borda: "transparent", alinhamento: "direita" } }) },
      { ref: "titulo", el: el("texto", { x: 60, y: 17, largura: 116, altura: 22, nome: "Título do sistema", pai: "menu", texto: "Hephaestus OS", estilo: { cor: "#eef0ff", peso: 700, tamanhoFonte: 15, fundo: "transparent", borda: "transparent" } }) },
      { ref: "bArquivo", el: botaoMenu("Arquivo", X.arquivo, { nome: "Menu Arquivo", pai: "menu" }) },
      { ref: "bEditar", el: botaoMenu("Editar", X.editar, { nome: "Menu Editar", pai: "menu" }) },
      { ref: "bExibir", el: botaoMenu("Exibir", X.exibir, { nome: "Menu Exibir", pai: "menu" }) },
      { ref: "bFerramentas", el: botaoMenu("Ferramentas", X.ferramentas, { nome: "Menu Ferramentas", pai: "menu", largura: 108 }) },
      ...(W >= 1060 ? [{ ref: "busca", el: el("campo", { x: W - 470, y: 11, largura: 150, altura: 34, nome: "Busca do sistema", pai: "menu", placeholder: "🔍  Pesquisar…", estilo: { fundo: "#ffffff12", cor: "#eef0ff", borda: "#ffffff26", raio: 10, tamanhoFonte: 13 } }) }] : []),
      { ref: "status", el: el("forma", { x: W - 262, y: 23, largura: 10, altura: 10, nome: "Ponto de status", pai: "menu", forma: "elipse", estilo: { fundo: "#3ddc97", borda: "transparent", larguraBorda: 0, efeitos: [{ tipo: "sombra", x: 0, y: 0, blur: 10, espalhar: 0, cor: "#3ddc97cc", visivel: true }] } }) },
      { ref: "statusTxt", el: el("texto", { x: W - 246, y: 18, largura: 52, altura: 20, nome: "Texto de status", pai: "menu", texto: "Online", estilo: { cor: "#9ae6c3", tamanhoFonte: 12, peso: 600, fundo: "transparent", borda: "transparent" } }) },
      { ref: "sino", el: botaoMenu("🔔", W - 160, { nome: "Sino de notificações", pai: "menu", largura: 40, estilo: { fundo: "#ffffff0d", cor: "#eef0ff", borda: "transparent", larguraBorda: 0, raio: 12, tamanhoFonte: 16 } }) },
      { ref: "badge", el: el("forma", { x: W - 130, y: 6, largura: 18, altura: 18, nome: "Contador de notificações", pai: "menu", forma: "elipse", texto: "3", estilo: { fundo: "#ff4d6d", cor: "#ffffff", borda: "transparent", larguraBorda: 0, peso: 700, tamanhoFonte: 10,
        preenchimentos: [{ tipo: "linear", angulo: 135, visivel: true, paradas: [{ pos: 0, cor: "#ff7a59" }, { pos: 100, cor: "#ff2e6e" }] }], efeitos: [{ tipo: "sombra", x: 0, y: 2, blur: 8, espalhar: 0, cor: "#ff2e6e99", visivel: true }] } }) },
      { ref: "avatar", el: el("forma", { x: W - 62, y: 10, largura: 36, altura: 36, nome: "Avatar", pai: "menu", forma: "elipse", texto: "RS", estilo: { fundo: "#5ec8ff", cor: "#ffffff", borda: "transparent", larguraBorda: 0, peso: 700, tamanhoFonte: 13,
        preenchimentos: [{ tipo: "linear", angulo: 135, visivel: true, paradas: [{ pos: 0, cor: "#5ec8ff" }, { pos: 100, cor: "#7c5cff" }] }], tracos: [{ cor: "#ffffff", largura: 2, visivel: true, posicao: "dentro", estilo: "solido" }] } }) },
      ...paineis.flatMap(p => [{ ref: p.ref, el: p.el }, ...p.filhos.map(([ref, e]) => ({ ref, el: { ...e, nome: ref.startsWith("sep") ? `Separador (${p.ref})` : e.rotulo.replace(/^\S+\s+/, ""), pai: p.ref } }))]),
    ];
    for (const e of elementos) e.el.nome ??= e.ref;
    // nomes únicos: o exemplo pode ser inserido mais de uma vez
    const existentes = new Set(n.elementos().map(e => e.nome));
    let sufixo = "";
    for (let k = 2; elementos.some(e => existentes.has(e.el.nome + sufixo)); k++) sufixo = ` ${k}`;
    if (sufixo) for (const e of elementos) e.el.nome += sufixo;
    const antes = new Set(n.elementos().map(e => e.id));
    n.inserirModelo({ id: "menuSistemaVS", nome: "Menu de sistema moderno", largura: W, altura: 360, elementos: elementos.map(e => ({ ref: e.ref, el: e.el })) }, 16, 14);
    const novos = n.elementos().filter(e => !antes.has(e.id));
    const id = ref => { const nome = elementos.find(e => e.ref === ref)?.el.nome; return novos.find(e => e.nome === nome)?.id; };
    if (!id("barra")) { avisar("Não foi possível inserir o menu de exemplo.", "alerta"); return; }

    // ---------- script organizado em pastas Função e Visual ----------
    this.sincronizar();
    const varTema = { id: novoIdLocal("v"), nome: "temaNeon", tipo: "logico", valor: false };
    const varNotif = { id: novoIdLocal("v"), nome: "notificacoes", tipo: "numero", valor: 3 };
    const g = grafoVazio("Menu de sistema");
    g.pasta = "Exemplos";
    g.desc = "Menu avançado: submenu Exportar ▸, ☰ e gaveta em telas estreitas, atalhos Alt+A/E/X/N, relógio ao vivo, notificações com contador, tema neon e efeitos. Pastas Função (o que o menu faz) e Visual (como aparece).";
    const nos = [], ligs = [];
    const no = (tipo, v = {}) => { const x = { id: novoIdLocal("n"), tipo, x: 0, y: 0, v: { ...valoresPadrao(tipo), ...v } }; nos.push(x); return x; };
    const L = (a, sp, b, ep = "exec") => ligs.push({ id: novoIdLocal("l"), de: a.id, sp, para: b.id, ep });
    // cadeia: [nó, [porta de saída para o próximo]] ligados em sequência
    const cadeia = (...lista) => { for (let i = 1; i < lista.length; i++) { const [a, sp] = Array.isArray(lista[i - 1]) ? lista[i - 1] : [lista[i - 1], "exec"]; const b = Array.isArray(lista[i]) ? lista[i][0] : lista[i]; L(a, sp, b); } return lista.map(x => Array.isArray(x) ? x[0] : x); };
    const pastas = [];
    const pasta = (titulo, tipo, linhas, recolhida = false) => pastas.push({ titulo, tipo, linhas, recolhida });

    // FUNÇÃO: abrir menus (cada botão alterna o seu painel; clicar fora/Esc fecha)
    pasta("Abrir menus", "funcao", [
      ["bArquivo", "Painel Arquivo"], ["bEditar", "Painel Editar"], ["bExibir", "Painel Exibir"], ["bFerramentas", "Painel Ferramentas"], ["sino", "Painel Notificações"], ["avatar", "Painel Perfil"],
    ].map(([b, p]) => cadeia(no("ev.clique", { alvo: id(b) }), no("ui.alternar", { alvo: id(p) }))));
    // VISUAL: brilho ao passar o mouse nos botões do menu
    pasta("Brilho ao passar o mouse", "visual", ["bArquivo", "bEditar", "bExibir", "bFerramentas"].flatMap(b => [
      cadeia(no("ev.entrar", { alvo: id(b) }), no("ui.transicao", { alvo: id(b), propriedade: "cor", valor: "#ffffff", ms: 160 }), no("ui.estilo", { alvo: id(b), propriedade: "sombra", valor: "0 0 18px rgba(139,123,255,.65)" })),
      cadeia(no("ev.sair", { alvo: id(b) }), no("ui.transicao", { alvo: id(b), propriedade: "cor", valor: "#c9cdf2", ms: 220 }), no("ui.estilo", { alvo: id(b), propriedade: "sombra", valor: "none" })),
    ]), true);
    // FUNÇÃO: ações dos itens
    pasta("Ações dos itens", "funcao", [
      cadeia(no("ev.clique", { alvo: id("iNovo") }), no("ui.aviso", { texto: "📄 Projeto novo criado" })),
      cadeia(no("ev.clique", { alvo: id("iSalvar") }), no("ui.aviso", { texto: "💾 Tudo salvo" }), no("d.log", { mensagem: "Salvar acionado pelo menu" })),
      cadeia(no("ev.clique", { alvo: id("iExportar") }), no("fl.disparar", { nome: "exportar" })),
      cadeia(no("ev.clique", { alvo: id("iDesfazer") }), no("ui.aviso", { texto: "↶ Desfeito" })),
      cadeia(no("ev.clique", { alvo: id("iTema") }), no("fl.disparar", { nome: "alternarTema" })),
      cadeia(no("ev.clique", { alvo: id("iTema2") }), no("fl.disparar", { nome: "alternarTema" })),
      cadeia(no("ev.clique", { alvo: id("iSair") }), no("ui.aviso", { texto: "Até logo! 👋" })),
    ], true);
    // FUNÇÃO: submenu Exportar ▸ (abre ao passar o mouse; fecha junto com o Arquivo)
    const sub = [
      cadeia(no("ev.entrar", { alvo: id("iExportar") }), no("ui.abrir", { alvo: id("Painel Exportar") })),
      cadeia(no("ev.fechar", { alvo: id("Painel Arquivo") }), no("ui.fechar", { alvo: id("Painel Exportar") })),
      ...[["iPng", "PNG"], ["iPdf", "PDF"], ["iHtml", "HTML"]].map(([it, f]) => cadeia(no("ev.clique", { alvo: id(it) }), no("ui.fechar", { alvo: id("Painel Arquivo") }), no("fl.disparar", { nome: "exportar", dado: f }))),
    ];
    pasta("Submenu Exportar ▸", "funcao", sub);
    // FUNÇÃO: layout responsivo (☰ e gaveta quando a tela é estreita)
    const evTam = no("ev.redimensionar", { inicio: true }), cmp = no("l.comparar", { op: "<", b: 760 }), seTam = no("fl.se", {});
    L(evTam, "exec", seTam); L(evTam, "largura", cmp, "a"); L(cmp, "r", seTam, "condicao");
    const botoesTopo = ["bArquivo", "bEditar", "bExibir", "bFerramentas", "titulo"];
    const estreito = botoesTopo.map(b => no("ui.fechar", { alvo: id(b) })).concat([no("ui.abrir", { alvo: id("hamburguer") })]);
    const largo = botoesTopo.map(b => no("ui.abrir", { alvo: id(b) })).concat([no("ui.fechar", { alvo: id("hamburguer") }), no("ui.fechar", { alvo: id("Gaveta móvel") })]);
    L(seTam, "verdadeiro", estreito[0]); for (let i = 1; i < estreito.length; i++) L(estreito[i - 1], "exec", estreito[i]);
    L(seTam, "falso", largo[0]); for (let i = 1; i < largo.length; i++) L(largo[i - 1], "exec", largo[i]);
    const gaveta = [
      cadeia(no("ev.clique", { alvo: id("hamburguer") }), no("ui.alternar", { alvo: id("Gaveta móvel") }), no("ui.efeito", { alvo: id("hamburguer"), efeito: "gelatina", ms: 500 })),
      ...[["gArquivo", "Painel Arquivo"], ["gEditar", "Painel Editar"], ["gExibir", "Painel Exibir"], ["gFerramentas", "Painel Ferramentas"], ["gNotif", "Painel Notificações"]].map(([it, p]) => cadeia(no("ev.clique", { alvo: id(it) }), no("ui.alternar", { alvo: id(p) }))),
    ];
    pasta("Layout responsivo ☰", "funcao", [[evTam, cmp, seTam], estreito, largo, ...gaveta]);
    // FUNÇÃO: atalhos de teclado
    pasta("Atalhos de teclado", "funcao", [["Alt+A", "Painel Arquivo"], ["Alt+E", "Painel Editar"], ["Alt+X", "Painel Exibir"], ["Alt+N", "Painel Notificações"]].map(([t, p]) => cadeia(no("ev.tecla", { tecla: t }), no("ui.alternar", { alvo: id(p) }))), true);
    // VISUAL: efeitos especiais
    const confete = no("ev.clique", { alvo: id("iConfete") });
    pasta("Efeitos especiais", "visual", [
      cadeia(confete, no("ui.efeito", { alvo: id("logo"), efeito: "confete", ms: 1400 })),
      cadeia(no("ev.clique", { alvo: id("iFaiscas") }), no("ui.efeito", { alvo: id("logo"), efeito: "faiscas", ms: 900 }), no("ui.efeito", { alvo: id("logo"), efeito: "girar", ms: 700 })),
      cadeia(no("ev.clique", { alvo: id("iTremer") }), no("ui.efeito", { alvo: id("barra"), efeito: "tremer", ms: 450 })),
      (() => { const ev = no("ev.personalizado", { nome: "exportar" }), f1 = no("ui.efeito", { alvo: id("logo"), efeito: "faiscas", ms: 1000 }), f2 = no("ui.efeito", { alvo: id("barra"), efeito: "brilhar", ms: 600 }), msg = no("t.formatar", { modelo: "✦ Exportado: {0}" }), av = no("ui.aviso", {});
        L(ev, "exec", f1); L(f1, "exec", f2); L(f2, "fim", av); L(ev, "dado", msg, "a"); L(msg, "r", av, "texto"); return [ev, f1, f2, av, msg]; })(),
      cadeia(no("ev.entrar", { alvo: id("logo") }), no("ui.efeito", { alvo: id("logo"), efeito: "gelatina", ms: 600 })),
    ]);
    // VISUAL + lógica: tema neon (variável, Se, transições)
    const evTema = no("ev.personalizado", { nome: "alternarTema" }), inv = no("var.inverter", { variavel: varTema.id }), se = no("fl.se", {});
    L(evTema, "exec", inv); L(inv, "exec", se); L(inv, "valor", se, "condicao");
    const neon = no("ui.estilo", { alvo: id("barra"), propriedade: "fundo", valor: "linear-gradient(110deg,#3b0a5c,#0b3d5c 55%,#5c0a3b)" });
    const neon2 = no("ui.efeito", { alvo: id("barra"), efeito: "brilhar", ms: 700 });
    const normal = no("ui.estilo", { alvo: id("barra"), propriedade: "fundo", valor: "linear-gradient(110deg,#1b1f3b,#121628 55%,#2a1640)" });
    L(se, "verdadeiro", neon); L(neon, "exec", neon2); L(se, "falso", normal);
    pasta("Tema neon", "visual", [[evTema, inv, se, neon, neon2], [normal]]);
    // FUNÇÃO: notificações (contador com fio de dado até o texto do selo)
    const n1 = no("ev.clique", { alvo: id("iN1") }), dec = no("var.incrementar", { variavel: varNotif.id, passo: -1 }), txt = no("ui.texto", { alvo: id("badge") }), pulo = no("ui.efeito", { alvo: id("badge"), efeito: "saltar", ms: 500 });
    L(n1, "exec", dec); L(dec, "exec", txt); L(dec, "valor", txt, "texto"); L(txt, "exec", pulo);
    const lidas = cadeia(no("ev.clique", { alvo: id("iLidas") }), no("var.definir", { variavel: varNotif.id, valor: 0 }), no("ui.efeito", { alvo: id("badge"), efeito: "sumir", ms: 300 }), no("ui.aviso", { texto: "Tudo lido ✓" }));
    pasta("Notificações", "funcao", [[n1, dec, txt, pulo], lidas]);
    // VISUAL: vida da barra (ao iniciar e em ciclo)
    pasta("Vida da barra", "visual", [
      cadeia(no("ev.iniciar"), no("ui.efeito", { alvo: id("barra"), efeito: "deslizar", ms: 550 }), [no("ui.efeito", { alvo: id("badge"), efeito: "saltar", ms: 600 }), "fim"], no("d.log", { mensagem: "Menu de sistema pronto ✦" })),
      cadeia(no("ev.intervalo", { ms: 1800 }), no("ui.efeito", { alvo: id("status"), efeito: "pulsar", ms: 900 })),
      (() => { const ev = no("ev.intervalo", { ms: 1000 }), tx = no("ui.texto", { alvo: id("relogio") }), hr = no("t.hora", { formato: "hm" }); L(ev, "exec", tx); L(hr, "r", tx, "texto"); return [ev, tx, hr]; })(),
    ]);

    // layout: duas colunas de pastas; dentro de cada pasta, uma cadeia por linha
    const largura = x => this.largura(x), altura = x => this.altura(x), PASSO = 40;
    const cols = [[0, 3, 4, 8, 2, 5], [6, 7, 9, 1]], yCol = [0, 0], xCol = [0, 0];
    const caixas = pastas.map(p => {
      let yy = 64, w = 0;
      const pos = [];
      for (const linha of p.linhas) {
        let xx = 28, h = 0;
        for (const x of linha) { pos.push([x, xx, yy]); xx += largura(x) + PASSO; h = Math.max(h, altura(x)); }
        w = Math.max(w, xx - PASSO + 28); yy += h + 36;
      }
      return { w: Math.max(w, 360), h: yy, pos };
    });
    xCol[1] = Math.max(...cols[0].map(i => caixas[i].w)) + 120;
    const grupos = [];
    cols.forEach((lista, c) => lista.forEach(i => {
      const p = pastas[i], cx = caixas[i], gx = xCol[c], gy = yCol[c];
      for (const [x, ox, oy] of cx.pos) { x.x = gx + ox; x.y = gy + oy; }
      grupos.push({ id: novoIdLocal("c"), x: gx, y: gy, w: cx.w, h: cx.h, titulo: p.titulo, tipo: p.tipo, cor: TIPOS_PASTA[p.tipo].cor, ...(p.recolhida ? { recolhido: true, membros: cx.pos.map(([x]) => x.id), membrosNotas: [] } : {}) });
      yCol[c] += (p.recolhida ? 140 : cx.h) + 90;
    }));
    for (const x of nos) { x.x = Math.round(x.x / 16) * 16; x.y = Math.round(x.y / 16) * 16; }
    g.nos = nos; g.ligacoes = ligs; g.grupos = grupos;
    g.notas = [{ id: novoIdLocal("t"), x: xCol[1], y: -150, w: 330, h: 110, cor: "#f6d365", texto: "Teste: Executar (F5). Arquivo › passe em Exportar ▸ · Exibir › Tema neon · Ferramentas › Confete · sino e avatar · Alt+A/E/X/N. Prévia em Celular: aparece o ☰ com a gaveta." }];
    this.mudar("exemplo: menu de sistema moderno", s2 => {
      s2.grafos.push(g);
      s2.variaveis.push(varTema, varNotif);
      s2.pastas = [...new Set([...(s2.pastas ?? []), "Exemplos"])];
    });
    this.abrirGrafo(g.id);
    setTimeout(() => this.enquadrar(), 160);
    this.app.mensagem?.("Menu de sistema inserido no topo da tela e o grafo “Menu de sistema” criado em Exemplos. Aperte F5 para testar.");
  }
  menuExemplos(ancora) {
    this.fecharFlutuantes();
    const it = (rot, sub, fn) => h("button", { type: "button", role: "menuitem", onclick: () => { this.fecharFlutuantes(); fn(); } }, h("span", { class: "vs-ex-txt" }, h("strong", {}, rot), h("small", {}, sub)));
    const menu = h("div", { class: "vs-menu vs-menu-ex", role: "menu" },
      it("✦ Menu de sistema moderno", "Barra de vidro, menus, notificações, perfil e tema neon — design + script em pastas", () => this.inserirMenuExemplo()),
      it("Fluxo básico", "Clique que alterna, conta e mostra um aviso", () => this.inserirExemplo()));
    this.raiz.append(menu);
    const r = ancora.getBoundingClientRect(), rr = this.raiz.getBoundingClientRect();
    Object.assign(menu.style, { left: `${Math.min(r.left - rr.left, rr.width - 340)}px`, top: `${r.bottom - rr.top + 4}px` });
    this.flutuante = menu;
    menu.querySelector("button")?.focus();
    menu.addEventListener("keydown", ev => { if (ev.key === "Escape") { ev.stopPropagation(); this.fecharFlutuantes(); } });
    setTimeout(() => document.addEventListener("pointerdown", ev => { if (this.flutuante === menu && !menu.contains(ev.target)) this.fecharFlutuantes(); }, { once: true }), 0);
  }

  // ================================================================
  // Busca de nós (Espaço/Tab/clique direito/arrastar fio para o vazio)
  // ================================================================
  fecharFlutuantes() { this.flutuante?.remove(); this.flutuante = null; if (this.paletaCmd) { this.paletaCmd.remove(); this.paletaCmd = null; } }
  abrirBuscaNos(cx, cy, ctx = {}) {
    this.fecharFlutuantes();
    const mundo = ctx.mundo ?? this.paraMundo(cx, cy);
    const caixa = h("div", { class: "vs-busca-nos", role: "dialog", "aria-label": "Adicionar nó" });
    const titulo = ctx.de ? `Ligar a ${TIPOS[ctx.de.tipo]?.nome ?? ""}` : ctx.elemento ? `Para “${this.nomeEl(ctx.elemento)}”` : "Adicionar nó";
    const entrada = h("input", { type: "search", class: "vs-busca-ent", placeholder: "Pesquisar nó…", "aria-label": "Pesquisar nó", autocomplete: "off" });
    const lista = h("ul", { class: "vs-busca-lista", role: "listbox" });
    const desc = h("p", { class: "vs-busca-desc" });
    caixa.append(h("div", { class: "vs-busca-tit" }, titulo, h("small", {}, "↑↓ Enter · Esc")), entrada, lista, desc);
    const candidatos = Object.entries(NOS).filter(([t, d]) => {
      if (ctx.categoria && d.cat !== ctx.categoria) return false;
      if (ctx.elemento && !d.ent.some(p => p.tipo === "el")) return false;
      if (ctx.de) {
        const lista2 = ctx.de.lado === "sai" ? d.ent : d.sai;
        return lista2.some(p => !p.prop && (ctx.de.lado === "sai" ? compativel(ctx.de.tipo, p.tipo) : compativel(p.tipo, ctx.de.tipo)));
      }
      return true;
    });
    let itens = [], ativo = 0;
    const criar = ([t]) => {
      this.fecharFlutuantes();
      const valores = ctx.elemento ? { alvo: ctx.elemento } : {};
      if (ctx.de) this.criarNo(t, mundo[0], mundo[1], valores, ctx.de);
      else this.criarNo(t, mundo[0] - 20, mundo[1] - 14, valores);
      this.tela.focus({ preventScroll: true });
    };
    const desenhar = () => {
      const q = entrada.value;
      itens = candidatos.map(([t, d]) => [t, d, pontuar(q, `${d.nome} ${SINONIMOS[t] ?? ""} ${CATEGORIAS[d.cat].nome}`) + (pontuar(q, d.nome) > 0 ? 5 : 0)]).filter(x => x[2] > 0);
      if (q) itens.sort((a, b) => b[2] - a[2]);
      ativo = Math.min(ativo, Math.max(0, itens.length - 1));
      let catAnt = null;
      lista.replaceChildren(...itens.flatMap(([t, d], i) => {
        const out = [];
        if (!q && d.cat !== catAnt) { catAnt = d.cat; out.push(h("li", { class: "vs-busca-cat", role: "presentation", style: `--cat:${CATEGORIAS[d.cat].cor}` }, CATEGORIAS[d.cat].nome)); }
        out.push(h("li", { role: "option", class: `vs-busca-item ${i === ativo ? "ativo" : ""}`, "aria-selected": String(i === ativo), style: `--cat:${CATEGORIAS[d.cat].cor}`,
          onpointerdown: e => { e.preventDefault(); criar([t]); }, onpointerenter: () => { ativo = i; marcar(); } },
          h("span", { class: `vs-forma ${d.evento ? "ev" : d.puro ? "puro" : "acao"}` }), h("span", { class: "vs-rot" }, d.nome), q ? h("small", {}, CATEGORIAS[d.cat].nome) : null));
        return out;
      }));
      if (!itens.length) lista.append(h("li", { class: "vs-vazio-lista" }, "Nada encontrado."));
      marcar();
    };
    const marcar = () => {
      lista.querySelectorAll(".vs-busca-item").forEach((el, i) => { el.classList.toggle("ativo", i === ativo); el.setAttribute("aria-selected", String(i === ativo)); if (i === ativo) el.scrollIntoView({ block: "nearest" }); });
      desc.textContent = itens[ativo]?.[1].desc ?? "";
    };
    entrada.addEventListener("input", () => { ativo = 0; desenhar(); });
    entrada.addEventListener("keydown", e => {
      e.stopPropagation();
      if (e.key === "ArrowDown") { e.preventDefault(); ativo = Math.min(itens.length - 1, ativo + 1); marcar(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); ativo = Math.max(0, ativo - 1); marcar(); }
      else if (e.key === "Enter") { e.preventDefault(); if (itens[ativo]) criar(itens[ativo]); }
      else if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); this.fecharFlutuantes(); this.tela.focus({ preventScroll: true }); }
    });
    this.raiz.append(caixa);
    const r = this.raiz.getBoundingClientRect();
    const L = Math.min(Math.max(8, cx - r.left), r.width - 330), T = Math.min(Math.max(8, cy - r.top), r.height - 420);
    Object.assign(caixa.style, { left: `${L}px`, top: `${Math.max(8, T)}px` });
    const mob = this.raiz.classList.contains("mobile");
    if (mob) { caixa.classList.add("folha"); Object.assign(caixa.style, { left: "8px", right: "8px", top: "auto", width: "auto" }); }
    this.flutuante = caixa;
    desenhar();
    if (!mob) entrada.focus(); // no celular o teclado só abre se a pessoa tocar na busca
    setTimeout(() => document.addEventListener("pointerdown", ev => { if (this.flutuante === caixa && !caixa.contains(ev.target)) this.fecharFlutuantes(); }, { once: true }), 0);
  }
  /** Menu de contexto (clique direito sem arrastar). */
  menuContexto(e) {
    const alvo = document.elementFromPoint(e.clientX, e.clientY);
    const noEl = alvo?.closest(".vs-no"), fio = alvo?.closest(".vs-fio-hit"), gr = alvo?.closest(".vs-grupo-cab"), nt = alvo?.closest(".vs-nota");
    const [wx, wy] = this.paraMundo(e.clientX, e.clientY);
    if (!noEl && !fio && !gr && !nt) return this.abrirBuscaNos(e.clientX, e.clientY, {});
    if (noEl && !this.sel.has("n:" + noEl.dataset.no)) { this.sel = new Set(["n:" + noEl.dataset.no]); this.marcarSelecao(); }
    if (nt && !this.sel.has("t:" + nt.dataset.nota)) { this.sel = new Set(["t:" + nt.dataset.nota]); this.marcarSelecao(); }
    if (gr && !this.sel.has("c:" + gr.parentElement.dataset.grupo)) { this.sel = new Set(["c:" + gr.parentElement.dataset.grupo]); this.marcarSelecao(); }
    const it = (rot, atalho, fn, perigo) => h("button", { type: "button", role: "menuitem", class: perigo ? "perigo" : "", onclick: () => { this.fecharFlutuantes(); fn(); } }, h("span", {}, rot), atalho ? h("kbd", {}, atalho) : null);
    const itens = fio
      ? [it("Inserir desvio", "Duplo clique", () => this.aoDuploClique({ target: alvo, clientX: e.clientX, clientY: e.clientY })), it("Cortar ligação", "Alt+clique", () => { this.fioSel = fio.dataset.fio; this.remover(); }, true)]
      : [gr ? (gr.parentElement.classList.contains("vs-pasta") ? it("📂 Abrir pasta", "Duplo clique", () => this.focarPasta(gr.parentElement.dataset.grupo)) : this.focoAtual() === gr.parentElement.dataset.grupo ? it("🗂 Ver tudo", "Esc", () => this.sairFoco()) : it("📁 Recolher em pasta", "", () => this.alternarPasta(gr.parentElement.dataset.grupo, true))) : null,
        gr && gr.parentElement.classList.contains("vs-pasta") ? it("↕ Expandir aqui, junto do resto", "", () => { const id = gr.parentElement.dataset.grupo, x = this.g.grupos.find(y => y.id === id); if (this.focoAtual()) delete this.focoPastas[this.g.id]; if (x?.recolhido) this.alternarPasta(id, false); else this.render(); }) : null,
        it("Duplicar", "Ctrl+D", () => this.duplicar()), it("Copiar", "Ctrl+C", () => this.copiarSel()), it("Criar grupo em volta", "Ctrl+G", () => this.agrupar()), noEl ? it("📁 Guardar em pasta", "Ctrl+Shift+G", () => this.agrupar(true)) : null,
        noEl ? it("Desativar / ativar", "", () => this.alternarDesativado()) : null,
        noEl ? it("Desligar todas as ligações", "Alt+clique", () => { const id = noEl.dataset.no; this.mudar("desligar nó", (s, g) => { g.ligacoes = g.ligacoes.filter(l => l.de !== id && l.para !== id); }); }) : null,
        it("Nota aqui", "N", () => this.novaNota(wx, wy)),
        it("Remover", "Delete", () => this.remover(), true)].filter(Boolean);
    const menu = h("div", { class: "vs-menu", role: "menu" }, itens);
    this.fecharFlutuantes();
    this.raiz.append(menu);
    const r = this.raiz.getBoundingClientRect();
    Object.assign(menu.style, { left: `${Math.min(e.clientX - r.left, r.width - 230)}px`, top: `${Math.min(e.clientY - r.top, r.height - 40 - itens.length * 32)}px` });
    this.flutuante = menu;
    menu.querySelector("button")?.focus();
    menu.addEventListener("keydown", ev => {
      const bs = [...menu.querySelectorAll("button")], i = bs.indexOf(document.activeElement);
      if (ev.key === "ArrowDown") { ev.preventDefault(); bs[(i + 1) % bs.length].focus(); }
      if (ev.key === "ArrowUp") { ev.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
      if (ev.key === "Escape") { ev.preventDefault(); this.fecharFlutuantes(); this.tela.focus(); }
      ev.stopPropagation();
    });
    setTimeout(() => document.addEventListener("pointerdown", ev => { if (this.flutuante === menu && !menu.contains(ev.target)) this.fecharFlutuantes(); }, { once: true }), 0);
  }
  /** Paleta de comandos (barra superior, Ctrl+K): ir para nós e grafos, criar nós, rodar comandos. */
  abrirPaletaComandos() {
    const q = this.busca.value;
    const res = [];
    for (const g of this.s.grafos) {
      const pg = pontuar(q, `grafo ${g.nome}`);
      if (q && pg > 0) res.push({ p: pg + 2, ic: "nos", rot: g.nome, sub: "Grafo", fn: () => this.abrirGrafo(g.id) });
      if (q) for (const n of g.nos) {
        const p = pontuar(q, `${this.titulo(n)} ${this.subtitulo(n)}`);
        if (p > 0) res.push({ p, ic: "seta", rot: `${this.titulo(n)}${this.subtitulo(n) ? " · " + this.subtitulo(n) : ""}`, sub: `em ${g.nome}`, fn: () => this.irPara(g.id, n.id) });
      }
    }
    for (const v of this.s.variaveis) { const p = q ? pontuar(q, `variavel ${v.nome}`) : 0; if (p > 0) res.push({ p, ic: "etiqueta", rot: v.nome, sub: "Variável", fn: () => { this.varSel = v.id; this.sel.clear(); this.renderInspetor(); } }); }
    const CMD = [["Executar / parar prévia", "play", () => this.alternarExecucao()], ["Organizar automaticamente", "grade", () => this.organizar()], ["Enquadrar tudo", "telaCheia", () => this.enquadrar()], ["Novo grafo", "mais", () => this.novoGrafo()], ["Nova variável", "etiqueta", () => this.novaVariavel()], ["Nova nota", "alfinete", () => this.novaNota(...this.centroVisivel())], ["Inserir exemplo", "modelo", () => this.inserirExemplo()], ["Exemplo: menu de sistema moderno", "modelo", () => this.inserirMenuExemplo()], ["Ver problemas", "alerta", () => this.abrirAba("problemas")], ["Ler o grafo em texto", "codigo", () => this.abrirAba("codigo")], ["Exportar HTML funcional", "exportar", () => this.n.exportarHTML()], ["Importar .txt / texto / .json", "enviarArquivo", () => this.abrirImportar()], ["Guia do formato de texto (.txt)", "documento", () => this.exportarTxt("guia")], ["Exportar Visual Script em .txt (reimportável)", "documento", () => this.exportarTxt("forja")], ["Exportar código completo em .txt", "documento", () => this.exportarTxt("tudo")], ["Exportar leitura do script em .txt", "documento", () => this.exportarTxt("leitura")], ["Exportar HTML+CSS+JS em .txt", "documento", () => this.exportarTxt("html")], ["Voltar ao Designer", "design", () => this.app.setModo("designer")], ["Atalhos", "ajuda", () => this.mostrarAjuda()]];
    CMD.push(["Aparência das ligações…", "link", () => this.alternarPopFios()]);
    for (const [k, t] of Object.entries(TIPOS_PASTA)) CMD.push([`Nova pasta ${t.nome} no grafo`, "pasta", () => this.novaPastaGrafo(k)]);
    for (const e of q ? this.elementos() : []) CMD.push([`Pastas do objeto: ${e.nome}`, "pasta", () => this.pastasDoObjeto(e.id)]);
    for (const [v, r] of ESTILOS_FIO) CMD.push([`Ligações: traçado ${r}`, "link", () => this.definirFios("vsFioEstilo", v)]);
    for (const [v, r] of ANIMS_FIO) CMD.push([`Ligações: animação ${r}`, "link", () => this.definirFios("vsFioAnim", v)]);
    for (const [rot, ic, fn] of CMD) { const p = pontuar(q, rot); if (p > 0) res.push({ p: q ? p : 1, ic, rot, sub: "Comando", fn }); }
    if (q) for (const [t, d] of Object.entries(NOS)) { const p = pontuar(q, `${d.nome} ${SINONIMOS[t] ?? ""}`); if (p > 0) res.push({ p: p - 1, ic: "mais", rot: `Adicionar: ${d.nome}`, sub: CATEGORIAS[d.cat].nome, fn: () => { const [x, y] = this.centroVisivel(); this.criarNo(t, x - 100, y - 30); } }); }
    res.sort((a, b) => b.p - a.p);
    const top = res.slice(0, 12);
    this.paletaCmd?.remove();
    if (!top.length || !q) { if (!q) top.splice(12); if (!top.length) { this.paletaCmd = null; return; } }
    this.cmdAtivo = 0; this.cmdItens = top;
    this.paletaCmd = h("ul", { class: "vs-cmd", role: "listbox" }, top.map((r, i) => h("li", { role: "option", class: i === 0 ? "ativo" : "", "aria-selected": String(i === 0), onpointerdown: e => { e.preventDefault(); this.executarCmd(i); } },
      h("span", { html: icone(r.ic, 14) }), h("span", { class: "vs-rot" }, r.rot), h("small", {}, r.sub))));
    const b = this.busca.getBoundingClientRect(), rr = this.raiz.getBoundingClientRect();
    Object.assign(this.paletaCmd.style, { left: `${b.left - rr.left}px`, top: `${b.bottom - rr.top + 4}px`, width: `${b.width}px` });
    this.raiz.append(this.paletaCmd);
    if (!this._fecharCmd) { this._fecharCmd = true; this.busca.addEventListener("blur", () => setTimeout(() => { this.paletaCmd?.remove(); this.paletaCmd = null; }, 120)); }
  }
  navegarLista(e) {
    e.stopPropagation();
    if (!this.paletaCmd) return;
    const lis = [...this.paletaCmd.children];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      this.cmdAtivo = (this.cmdAtivo + (e.key === "ArrowDown" ? 1 : -1) + lis.length) % lis.length;
      lis.forEach((li, i) => { li.classList.toggle("ativo", i === this.cmdAtivo); li.setAttribute("aria-selected", String(i === this.cmdAtivo)); });
    } else if (e.key === "Enter") { e.preventDefault(); this.executarCmd(this.cmdAtivo); }
    else if (e.key === "Escape") { e.preventDefault(); this.busca.value = ""; this.busca.blur(); this.tela.focus(); }
  }
  executarCmd(i) {
    const r = this.cmdItens?.[i]; if (!r) return;
    this.busca.value = ""; this.paletaCmd?.remove(); this.paletaCmd = null; this.busca.blur();
    r.fn();
  }
  irPara(gid, noId) {
    definirVisaoCodigo(this.ui,"grafo");this._representacaoChave=null;
    if (this.g.id !== gid) this.abrirGrafo(gid);
    // nó dentro de pasta recolhida: abre a pasta para mostrar
    const fo = this.focoAtual();
    if (fo) { const dono = this.g.grupos.find(gr => this.membros(gr).nos.has(noId)); if (dono && dono.id !== fo) this.focoPastas[this.g.id] = dono.id; }
    const no = this.no(noId), pasta = !fo && no && this.g.grupos.find(gr => gr.recolhido && this.membros(gr).nos.has(noId));
    if (pasta) this.mudar("abrir pasta", (s, g) => { const gr = g.grupos.find(x => x.id === pasta.id); delete gr.recolhido; delete gr.membros; delete gr.membrosNotas; });
    this.sel = new Set(["n:" + noId]); this.fioSel = null; this.varSel = null;
    this.render();
    requestAnimationFrame(() => { this.enquadrar(this.sel); const el = this.noEls.get(noId); el?.classList.add("vs-achado"); setTimeout(() => el?.classList.remove("vs-achado"), 1200); });
  }

  // ================================================================
  // Teclado (App.teclado chama antes dos atalhos do Designer)
  // ================================================================
  tecla(e, digitando) {
    if (!this.raiz.isConnected || this.raiz.offsetParent === null) return false;
    const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (ctrl && k === "k") { e.preventDefault(); this.busca.focus(); this.busca.select(); return true; }
    if (e.key === "F5") { e.preventDefault(); this.alternarExecucao(); return true; }
    if (digitando) return false;
    const naTela = this.tela.contains(e.target) || e.target === document.body || e.target === this.raiz;
    if (!naTela) return false;
    if (ctrl && k === "f") { e.preventDefault(); this.busca.focus(); return true; }
    if (ctrl && k === "a") { e.preventDefault(); this.sel = new Set([...this.g.nos.filter(n => !this.ocultos?.has(n.id)).map(n => "n:" + n.id), ...this.g.notas.filter(n => !this.notasOcultas?.has(n.id)).map(n => "t:" + n.id), ...this.g.grupos.filter(x => this.fechada(x)).map(x => "c:" + x.id)]); this.marcarSelecao(); return true; }
    if (ctrl && k === "c") { e.preventDefault(); this.copiarSel(); return true; }
    if (ctrl && k === "x") { e.preventDefault(); this.copiarSel(true); return true; }
    if (ctrl && k === "v") { e.preventDefault(); this.colar(); return true; }
    if (ctrl && k === "d") { e.preventDefault(); this.duplicar(); return true; }
    if (ctrl && k === "g") { e.preventDefault(); this.agrupar(e.shiftKey); return true; }
    if (ctrl) return false;
    if (k === "w") {e.preventDefault();this.modoSelecao=true;this.ui.hpFerrScript='fio';this.app.caixaFerramentas.render();return true;}
    if (k === "+" || k === "=") {e.preventDefault();const r=this.tela.getBoundingClientRect();this.abrirBuscaNos(r.left+r.width/2,r.top+r.height/2,{});return true;}
    if (k === "c" && !ctrl) {e.preventDefault();this.novaNota(...this.centroVisivel());return true;}
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); this.remover(); return true; }
    if (e.key === "Escape" && this.focoAtual() && !this.flutuante) { this.sairFoco(); return true; }
    if (e.key === "Escape") { this.sel.clear(); this.fioSel = null; this.varSel = null; this.fecharFlutuantes(); this.desenharFios(); this.marcarSelecao(); return true; }
    if (e.key === " " && !e.repeat) { e.preventDefault(); this.espaco = true; this.panComEspaco = false; this.tela.classList.add("pan"); return true; }
    if (e.key === " ") { e.preventDefault(); return true; }
    if (e.key === "Tab") { e.preventDefault(); this.abrirBuscaNos(this.mouse.x, this.mouse.y, {}); return true; }
    if (k === "f") { this.enquadrar(this.sel.size ? this.sel : null); return true; }
    if (e.key === "Home") { this.enquadrar(); return true; }
    if (k === "n") { this.novaNota(...this.paraMundo(this.mouse.x, this.mouse.y)); return true; }
    if (k === "q") { this.alinhar("topo"); return true; }
    if (e.key.startsWith("Arrow") && this.sel.size) {
      e.preventDefault();
      const p = e.shiftKey ? GRADE * 4 : GRADE, dx = { ArrowLeft: -p, ArrowRight: p }[e.key] ?? 0, dy = { ArrowUp: -p, ArrowDown: p }[e.key] ?? 0;
      this.mudar("mover", (s, g) => { for (const col of [g.nos, g.notas, g.grupos]) for (const o of col) if (this.sel.has((col === g.nos ? "n:" : col === g.notas ? "t:" : "c:") + o.id)) { o.x += dx; o.y += dy; } });
      return true;
    }
    return true; // dentro da Visual Script os atalhos do Designer não valem
  }
  teclaSolta(e) {
    if (e.key !== " " || !this.espaco) return;
    this.espaco = false; this.tela.classList.remove("pan");
    if (!this.panComEspaco && !e.target.closest?.("input,textarea,select")) this.abrirBuscaNos(this.mouse.x, this.mouse.y, {});
  }

  // ================================================================
  // Inspetor
  // ================================================================
  renderInspetor() {
    const foco = document.activeElement, kFoco = this.inspetor.contains(foco) ? foco.dataset?.k : null;
    const rolagem = this.inspetor.querySelector(".vs-rolagem")?.scrollTop ?? 0;
    const g = this.g;
    const corpo = [];
    const secao = (titulo, ...conteudo) => h("section", { class: "vs-insp-sec" }, h("h4", {}, titulo), ...conteudo);
    const campo = (rot, controle, dica) => h("label", { class: "vs-campo" }, h("span", {}, rot), controle, dica ? h("small", {}, dica) : null);
    const nos = [...this.sel].filter(k => k.startsWith("n:")).map(k => this.no(k.slice(2))).filter(Boolean);
    const var_ = this.varSel ? this.s.variaveis.find(v => v.id === this.varSel) : null;
    if (var_) {
      const t = TIPOS_VAR.find(x => x[0] === var_.tipo) ?? TIPOS_VAR[0];
      const p = { id: "valor", nome: "Valor inicial", tipo: t[2] };
      const usos = this.s.grafos.flatMap(gg => gg.nos.filter(n => n.v?.variavel === var_.id).map(n => [gg, n]));
      corpo.push(h("div", { class: "vs-insp-cab", style: `--cat:${CATEGORIAS.variaveis.cor}` }, h("span", { html: icone("etiqueta", 16) }), h("div", {}, h("strong", {}, var_.nome), h("small", {}, `Variável · ${t[1]}`))),
        secao("Variável",
          campo("Nome", h("input", { class: "vs-ed", value: var_.nome, "data-k": "var.nome", "data-foco-titulo": "", onchange: e => this.mudar("renomear variável", s => { s.variaveis.find(x => x.id === var_.id).nome = e.target.value.trim() || var_.nome; }) })),
          campo("Tipo", h("select", { class: "vs-ed", "data-k": "var.tipo", onchange: e => this.mudar("tipo da variável", s => { const x = s.variaveis.find(y => y.id === var_.id); x.tipo = e.target.value; x.valor = TIPOS_VAR.find(y => y[0] === x.tipo)[3]; }) }, TIPOS_VAR.map(([v, r]) => h("option", { value: v, selected: v === var_.tipo }, r)))),
          campo("Valor inicial", this.editorValorVar(var_, p)),
          this.aoVivo[var_.id] !== undefined ? h("p", { class: "vs-ao-vivo" }, "Na prévia agora: ", h("code", {}, JSON.stringify(this.aoVivo[var_.id]))) : null),
        secao(`Usada em ${usos.length} nó(s)`, usos.length ? h("ul", { class: "vs-usos" }, usos.map(([gg, n]) => h("li", {}, h("button", { type: "button", class: "vs-link", onclick: () => this.irPara(gg.id, n.id) }, `${this.titulo(n)} · ${gg.nome}`)))) : h("p", { class: "vs-dica" }, "Arraste a variável da lista para o grafo: solta = Ler, com Alt = Definir.")),
        h("div", { class: "vs-insp-acoes" },
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.criarNo("var.obter", ...this.centroVisivel(), { variavel: var_.id }) }, "Criar Ler"),
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.criarNo("var.definir", ...this.centroVisivel(), { variavel: var_.id }) }, "Criar Definir")));
    } else if (this.fioSel) {
      const l = g.ligacoes.find(x => x.id === this.fioSel);
      const a = this.no(l.de), b = this.no(l.para), t = this.tipo(l.de, l.sp, "sai");
      corpo.push(h("div", { class: "vs-insp-cab", style: `--cat:${TIPOS[t]?.cor}` }, h("span", { html: icone("link", 16) }), h("div", {}, h("strong", {}, "Ligação"), h("small", {}, TIPOS[t]?.nome))),
        secao("De → Para", h("p", {}, h("button", { type: "button", class: "vs-link", onclick: () => this.irPara(g.id, a.id) }, this.titulo(a)), ` · ${this.def(a)?.sai.find(p => p.id === l.sp)?.nome || l.sp}`),
          h("p", {}, h("button", { type: "button", class: "vs-link", onclick: () => this.irPara(g.id, b.id) }, this.titulo(b)), ` · ${this.def(b)?.ent.find(p => p.id === l.ep)?.nome || l.ep}`)),
        (() => {
          const m = this.metricas.get(`${g.id}|${l.de}|${l.sp}|${l.para}|${l.ep}`);
          if (!m) return secao("Telemetria", h("p", { class: "vs-dica" }, this.frame ? "Ainda não passou nada por este fio." : "Aperte Executar (F5): passagens, taxa, latência e valores aparecem aqui."));
          const taxa = m.ts.filter(t => Date.now() - t < 3000).length / 3;
          return secao("Telemetria", h("div", { class: "vs-numeros vs-tel" },
            h("div", {}, h("strong", {}, m.n), h("small", {}, "passagens")),
            h("div", {}, h("strong", {}, taxa.toFixed(1)), h("small", {}, "por segundo")),
            h("div", {}, h("strong", {}, m.lat != null ? m.lat : "—"), h("small", {}, "ms latência")),
            h("div", {}, h("strong", { title: m.valor !== undefined ? String(m.valor) : "" }, m.valor !== undefined ? fmtValor(m.valor) : "—"), h("small", {}, "último valor"))));
        })(),
        secao("Aparência deste fio", ...this.controlesFio([l], "fio")),
        h("div", { class: "vs-insp-acoes" }, h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.alternarPopFios() }, "Padrão de todos os fios…"), h("button", { type: "button", class: "vs-bt-perigo", onclick: () => this.remover() }, "Cortar ligação")));
    } else if (nos.length === 1 && this.sel.size === 1) {
      const no = nos[0], d = this.def(no);
      if (!d) corpo.push(h("p", {}, `Tipo desconhecido: ${no.tipo}`));
      else {
        const cat = CATEGORIAS[d.cat];
        const ligadas = new Map(g.ligacoes.filter(l => l.para === no.id).map(l => [l.ep, l]));
        const conta = this.contagem.get(g.id + "|" + no.id);
        const probs = this.problemas().filter(p => p.grafo === g.id && p.no === no.id);
        corpo.push(h("div", { class: "vs-insp-cab", style: `--cat:${cat.cor}` }, h("span", { html: icone(cat.icone, 16) }), h("div", {}, h("strong", {}, this.titulo(no)), h("small", {}, `${cat.nome} · ${d.evento ? "evento" : d.puro ? "valor" : "ação"}`))),
          h("p", { class: "vs-insp-desc" }, d.desc),
          probs.length ? h("div", { class: "vs-assistente" }, h("strong", {}, h("span", { html: icone("info", 14) }), "Assistente"), probs.map(p => h("p", { class: p.nivel }, p.msg, this.sugestao(no, p)))) : null,
          secao("Nó",
            campo("Título", h("input", { class: "vs-ed", value: no.titulo ?? "", placeholder: d.nome, readOnly: no.origem==="designer", "data-k": "no.titulo", "data-foco-titulo": "", onchange: e => this.mudar("renomear nó", (s, gg) => { const x = gg.nos.find(y => y.id === no.id); if(x.origem!=="designer") x.titulo = e.target.value.trim() || undefined; }) })),
            campo("Comentário", h("textarea", { class: "vs-ed", rows: 2, "data-k": "no.nota", placeholder: "Aparece num balão sobre o nó", onchange: e => this.mudar("comentário do nó", (s, gg) => { const x = gg.nos.find(y => y.id === no.id); x.nota = e.target.value.trim() || undefined; }) }, no.nota ?? ""))),
          d.ent.some(p => p.tipo !== "exec" && p.tipo !== "*") ? secao("Entradas", ...d.ent.filter(p => p.tipo !== "exec" && p.tipo !== "*").map(p => {
            const l = ligadas.get(p.id);
            return campo(`${p.nome || "Valor"}${p.prop ? "" : ` · ${TIPOS[p.tipo]?.nome ?? ""}`}`, l
              ? h("div", { class: "vs-ligado" }, h("span", { class: "vs-ponto", style: `--c:${TIPOS[p.tipo]?.cor}` }), "Ligado a ", h("button", { type: "button", class: "vs-link", onclick: () => this.irPara(g.id, l.de) }, this.titulo(this.no(l.de))))
              : this.editorValor(no, p, false));
          })) : null,
          d.sai.some(p => p.tipo !== "exec") ? secao("Saídas", h("ul", { class: "vs-saidas" }, d.sai.filter(p => p.tipo !== "exec").map(p => h("li", {}, h("span", { class: "vs-ponto", style: `--c:${TIPOS[p.tipo]?.cor}` }), `${p.nome || "Resultado"} · ${TIPOS[p.tipo]?.nome}`)))) : null,
          secao("Execução", h("p", { class: "vs-dica" }, conta ? `Executou ${conta} vez(es) nesta prévia.` : d.puro ? "Nós de valor são calculados quando alguém usa a saída." : "Ainda não executou. Aperte Executar (F5) e interaja com a prévia.")),
          h("div", { class: "vs-insp-acoes" },
            no.v?.alvo ? h("button", { type: "button", class: "vs-bt-sec", onclick: () => { this.n.selecionar(no.v.alvo); this.app.setModo("designer"); } }, "Ver elemento no Designer") : null,
            no.v?.alvo ? h("button", { type: "button", class: "vs-bt-sec", title: "Separa os nós deste objeto em pastas Função e Visual", onclick: () => this.pastasDoObjeto(no.v.alvo) }, "Pastas do objeto") : null,
            h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.duplicar() }, "Duplicar"),
            h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.alternarDesativado() }, no.desativado ? "Ativar" : "Desativar"),
            h("button", { type: "button", class: "vs-bt-perigo", onclick: () => this.remover() }, "Remover")));
      }
    } else if (this.sel.size === 1 && [...this.sel][0].startsWith("c:")) {
      const id = [...this.sel][0].slice(2), gr = g.grupos.find(x => x.id === id), tipo = gr.tipo ?? "geral", cor = corGrupo(gr);
      corpo.push(h("div", { class: "vs-insp-cab", style: `--cat:${cor}` }, h("span", { html: svgPasta(cor, !gr.recolhido, tipo, 22) }), h("div", {}, h("strong", {}, gr.titulo || "Grupo"), h("small", {}, `Pasta ${TIPOS_PASTA[tipo].nome}${gr.objeto ? ` · ${this.nomeEl(gr.objeto)}` : ""}`))),
        secao("Pasta",
          campo("Título", h("input", { class: "vs-ed", value: gr.titulo ?? "", "data-k": "gr.titulo", "data-foco-titulo": "", onchange: e => this.mudar("renomear grupo", (s, gg) => { gg.grupos.find(x => x.id === id).titulo = e.target.value; }) })),
          h("div", { class: "vs-campo" }, h("span", {}, "Tipo"),
            h("div", { class: "vs-tipos-pasta grande", role: "radiogroup", "aria-label": "Tipo da pasta" }, Object.entries(TIPOS_PASTA).map(([k, t]) => h("button", { type: "button", role: "radio", "aria-checked": String(k === tipo), title: t.dica, onclick: () => this.mudar(`pasta ${t.nome}`, (s, gg) => { const x = gg.grupos.find(y => y.id === id); if (k === "geral") delete x.tipo; else x.tipo = k; if (!x.cor || Object.values(TIPOS_PASTA).some(tp => tp.cor === x.cor)) x.cor = t.cor; }) },
              h("span", { html: svgPasta(t.cor, false, k, 26) }), h("strong", {}, t.nome), h("small", {}, t.dica))))),
          h("div", { class: "vs-campo" }, h("span", {}, "Cor"),
            h("div", { class: "vs-cores", role: "radiogroup", "aria-label": "Cor da pasta" }, CORES_GRUPO.map(([c, nome]) => h("button", { type: "button", role: "radio", "aria-checked": String(cor === c), title: nome, "aria-label": nome, style: `--c:${c}`, onclick: () => this.mudar("cor da pasta", (s, gg) => { gg.grupos.find(x => x.id === id).cor = c; }) })),
              h("input", { type: "color", class: "vs-cor-amostra", value: /^#[0-9a-f]{6}$/i.test(cor) ? cor : "#3d8bfd", title: "Outra cor", "aria-label": "Outra cor", onchange: e => this.mudar("cor da pasta", (s, gg) => { gg.grupos.find(x => x.id === id).cor = e.target.value; }) })))),
        (() => {
          const m = this.membros(gr);
          const nos = g.nos.filter(n => m.nos.has(n.id)).sort((a, b) => a.y - b.y || a.x - b.x);
          return secao(`Conteúdo (${nos.length})`,
            h("div", { class: "vs-insp-acoes", style: "padding:0 0 8px" }, this.focoAtual() === gr.id ? h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.sairFoco() }, "🗂 Ver tudo") : this.fechada(gr) ? h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.focarPasta(gr.id) }, "📂 Abrir pasta") : h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.alternarPasta(gr.id, true) }, "📁 Recolher em pasta")),
            nos.length ? h("ul", { class: "vs-usos" }, nos.slice(0, 40).map(n => h("li", {}, h("button", { type: "button", class: "vs-link", onclick: () => this.irPara(g.id, n.id) }, `${this.titulo(n)}${this.subtitulo(n) ? " · " + this.subtitulo(n) : ""}`)))) : h("p", { class: "vs-dica" }, "Arraste nós para dentro da área do grupo."));
        })(),
        h("p", { class: "vs-dica" }, gr.recolhido ? "Recolhida, a pasta esconde os nós e mantém as ligações nas bordas. Ela pisca quando algo dentro dela executa." : "Arrastar o título move o grupo junto com os nós de dentro. O canto inferior direito redimensiona."),
        h("div", { class: "vs-insp-acoes" }, h("button", { type: "button", class: "vs-bt-perigo", onclick: () => this.remover() }, "Remover grupo (mantém os nós)")));
    } else if (this.sel.size === 1 && [...this.sel][0].startsWith("t:")) {
      const id = [...this.sel][0].slice(2), t = g.notas.find(x => x.id === id);
      corpo.push(h("div", { class: "vs-insp-cab", style: `--cat:${t.cor}` }, h("span", { html: icone("alfinete", 16) }), h("div", {}, h("strong", {}, "Nota"), h("small", {}, "Lembrete no grafo"))),
        secao("Nota",
          campo("Texto", h("textarea", { class: "vs-ed", rows: 5, "data-k": "nota.texto", "data-foco-titulo": "", onchange: e => this.mudar("editar nota", (s, gg) => { gg.notas.find(x => x.id === id).texto = e.target.value; }) }, t.texto ?? "")),
          h("div", { class: "vs-cores", role: "radiogroup", "aria-label": "Cor da nota" }, CORES_NOTA.map(([c, nome]) => h("button", { type: "button", role: "radio", "aria-checked": String(t.cor === c), title: nome, "aria-label": nome, style: `--c:${c}`, onclick: () => this.mudar("cor da nota", (s, gg) => { gg.notas.find(x => x.id === id).cor = c; }) })))),
        h("div", { class: "vs-insp-acoes" }, h("button", { type: "button", class: "vs-bt-perigo", onclick: () => this.remover() }, "Remover nota")));
    } else if (this.sel.size > 1) {
      corpo.push(h("div", { class: "vs-insp-cab" }, h("span", { html: icone("selTudo", 16) }), h("div", {}, h("strong", {}, `${this.sel.size} itens`), h("small", {}, `${nos.length} nó(s)`))),
        secao("Organizar", h("div", { class: "vs-insp-acoes" },
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.alinhar("esq") }, "Alinhar à esquerda"),
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.alinhar("topo") }, "Alinhar pelo topo"),
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.alinhar("distV") }, "Distribuir na vertical"),
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.agrupar() }, "Criar grupo em volta"))),
        (() => { const ids = new Set(nos.map(n => n.id)); const ligs = g.ligacoes.filter(l => ids.has(l.de) && ids.has(l.para)); return ligs.length ? secao(`Ligações entre eles (${ligs.length})`, ...this.controlesFio(ligs, "ligações")) : null; })(),
        h("div", { class: "vs-insp-acoes" }, h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.duplicar() }, "Duplicar"), h("button", { type: "button", class: "vs-bt-perigo", onclick: () => this.remover() }, "Remover")));
    } else {
      const probs = this.problemas().filter(p => p.grafo === g.id);
      const evs = g.nos.filter(n => this.def(n)?.evento).length;
      corpo.push(h("div", { class: "vs-insp-cab" }, h("span", { html: icone("nos", 16) }), h("div", {}, h("strong", {}, g.nome), h("small", {}, "Grafo"))),
        secao("Grafo",
          campo("Nome", h("input", { class: "vs-ed", value: g.nome, "data-k": "g.nome", onchange: e => this.mudar("renomear grafo", (s, gg) => { gg.nome = e.target.value.trim() || gg.nome; }) })),
          campo("Pasta", h("input", { class: "vs-ed", value: g.pasta ?? "", placeholder: "ex.: Menus/Arquivo", "data-k": "g.pasta", list: "vs-pastas-lista", onchange: e => { const p = e.target.value.split("/").map(x => x.trim()).filter(Boolean).join("/"); this.mudar("mover grafo de pasta", (s2, gg) => { if (p) gg.pasta = p; else delete gg.pasta; }); } }),
            h("datalist", { id: "vs-pastas-lista" }, [...new Set([...(this.s.pastas ?? []), ...this.s.grafos.map(x => x.pasta).filter(Boolean)])].map(p => h("option", { value: p })))),
          campo("Descrição", h("textarea", { class: "vs-ed", rows: 2, "data-k": "g.desc", placeholder: "Para que serve este grafo?", onchange: e => this.mudar("descrição do grafo", (s, gg) => { gg.desc = e.target.value; }) }, g.desc ?? "")),
          h("label", { class: "vs-campo-linha" }, h("input", { type: "checkbox", checked: !g.desativado, onchange: e => this.mudar(e.target.checked ? "ativar grafo" : "desativar grafo", (s, gg) => { gg.desativado = !e.target.checked || undefined; }) }), "Ativo (roda na prévia e no HTML exportado)")),
        h("div", { class: "vs-numeros" },
          h("div", {}, h("strong", {}, g.nos.length), h("small", {}, "nós")),
          h("div", {}, h("strong", {}, evs), h("small", {}, "eventos")),
          h("div", {}, h("strong", {}, g.ligacoes.length), h("small", {}, "ligações")),
          h("div", { class: probs.some(p => p.nivel === "erro") ? "erro" : "" }, h("strong", {}, probs.filter(p => p.nivel !== "info").length), h("small", {}, "problemas"))),
        probs.length ? h("div", { class: "vs-assistente" }, h("strong", {}, h("span", { html: icone("info", 14) }), "Assistente"),
          probs.slice(0, 4).map(p => h("p", { class: p.nivel }, h("button", { type: "button", class: "vs-link", onclick: () => this.irPara(p.grafo, p.no) }, p.msg))),
          probs.length > 4 ? h("button", { type: "button", class: "vs-link", onclick: () => this.abrirAba("problemas") }, `Ver todos (${probs.length})`) : null) : null,
        secao("Dicas rápidas", h("ul", { class: "vs-dicas" },
          h("li", {}, h("kbd", {}, "Espaço"), " ou ", h("kbd", {}, "Tab"), " busca nós onde está o ponteiro"),
          h("li", {}, "Arraste de uma porta para o vazio: só aparecem nós que combinam"),
          h("li", {}, h("kbd", {}, "Alt"), "+clique num fio corta; duplo clique cria desvio"),
          h("li", {}, h("kbd", {}, "Ctrl G"), " agrupa · ", h("kbd", {}, "N"), " cria nota · ", h("kbd", {}, "F"), " enquadra"))),
        h("div", { class: "vs-insp-acoes" },
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.organizar(), disabled: !g.nos.length }, "Organizar automaticamente"),
          h("button", { type: "button", class: "vs-bt-sec", onclick: () => this.abrirAba("codigo") }, "Ler em texto")));
    }
    if (nos.length===1 && nos[0].origem==="designer") {
      const no=nos[0];
      corpo.unshift(secao("Objeto vinculado",h("p",{},"ID: "+no.v.alvo),h("button",{type:"button",class:"vs-bt-sec",onclick:()=>this.renomearElemento(no.v.alvo)},"Renomear objeto"),this.app.ambiente.painel("elemento")));
    }
    this.inspetor.replaceChildren(h("div", { class: "vs-col-tit" }, h("span", { html: icone("propriedades", 14) }), "Inspetor"), h("div", { class: "vs-rolagem" }, corpo));
    if (rolagem) this.inspetor.querySelector(".vs-rolagem").scrollTop = rolagem;
    if (kFoco) this.inspetor.querySelector(`[data-k="${CSS.escape(kFoco)}"]`)?.focus();
  }
  /** Botão de correção rápida para alguns problemas. */
  sugestao(no, p) {
    if (/nada leva o fluxo/.test(p.msg)) return h("button", { type: "button", class: "vs-link", onclick: () => { const [x, y] = this.posPorta(no, this.def(no).ent.find(e => e.tipo === "exec").id, "ent"); const c = this.cam(), r = this.tela.getBoundingClientRect(); this.abrirBuscaNos(r.left + c.x + (x - 60) * c.z, r.top + c.y + y * c.z, { de: { no: no.id, porta: this.def(no).ent.find(e => e.tipo === "exec").id, lado: "ent", tipo: "exec" }, mundo: [x - 60, y] }); } }, " Ligar um evento…");
    if (/não está ligado a nenhuma ação/.test(p.msg)) return h("button", { type: "button", class: "vs-link", onclick: () => { const [x, y] = this.posPorta(no, "exec", "sai"); const c = this.cam(), r = this.tela.getBoundingClientRect(); this.abrirBuscaNos(r.left + c.x + (x + 60) * c.z, r.top + c.y + y * c.z, { de: { no: no.id, porta: "exec", lado: "sai", tipo: "exec" }, mundo: [x + 60, y] }); } }, " Adicionar ação…");
    return null;
  }

  // ================================================================
  // Painel inferior: depurador, problemas, observar, código, histórico, agente…
  // ================================================================
  abrirAba(id) { this.ui.vsAba = id; this.ui.vsPainelFechado = false; this.salvarUI(); this.renderPainel(); this.aplicarLayout(); }
  renderPainel() {
    const aba = this.ui.vsAba ?? "depurador";
    const probs = this.problemas();
    const nErros = probs.filter(p => p.nivel === "erro").length;
    const ABAS = [["depurador", "Depurador", this.logs.filter(l => l.nivel === "erro").length || null], ["problemas", "Problemas", nErros || null], ["observar", "Observar", null], ["codigo", "Ler em texto", null], ["codigoEl", "Código por elemento", null], ["historico", "Histórico", null], ["agente", "Agente", null], ["modelos", "Modelos", null], ["composicao", "Composição", null], ["faixa", "Ribbon", null], ["efeitos", "Efeitos", null], ["comportamento", "Comportamentos", null], ["documentacao", "Documentação", null]];
    if (!this.painelCab) {
      this.painelCab = h("div", { class: "vs-painel-cab" });
      this.painelCorpo = h("div", { class: "vs-painel-corpo" });
      this.painel.append(this.painelCab, this.painelCorpo);
    }
    this.painelCab.replaceChildren(
      h("div", { class: "vs-painel-abas", role: "tablist" }, ABAS.map(([id, rot, conta]) => h("button", { type: "button", role: "tab", class: aba === id ? "ativa" : "", "aria-selected": String(aba === id), onclick: () => this.abrirAba(id) }, rot, conta ? h("span", { class: "vs-conta erro" }, conta) : null))),
      h("div", { class: "vs-painel-ferr" },
        aba === "depurador" ? [
          h("select", { class: "vs-ed compacto", "aria-label": "Filtrar mensagens", onchange: e => { this.filtroLog = e.target.value; this.renderPainel(); } }, [["todos", "Tudo"], ["log", "Mensagens"], ["exec", "Execução"], ["erro", "Alertas e erros"]].map(([v, r]) => h("option", { value: v, selected: v === this.filtroLog }, r))),
          h("button", { type: "button", class: "vs-mini", title: "Limpar depurador", "aria-label": "Limpar depurador", html: icone("excluir", 13), onclick: () => { this.logs = []; this.contagem.clear(); this.renderPainel(); this.renderGrafo(); } })] : null,
        h("button", { type: "button", class: "vs-mini", title: this.ui.vsPainelFechado ? "Abrir painel" : "Recolher painel", "aria-label": this.ui.vsPainelFechado ? "Abrir painel" : "Recolher painel", html: icone(this.ui.vsPainelFechado ? "setaCima" : "setaBaixo", 13), onclick: () => { this.ui.vsPainelFechado = !this.ui.vsPainelFechado; this.salvarUI(); this.aplicarLayout(); this.renderPainel(); } })));
    if (this.ui.vsPainelFechado) { this.painelCorpo.replaceChildren(); return; }
    // o agente e a composição mantêm estado próprio: não remontar a cada mudança do documento
    if (aba === this._abaMontada && (aba === "agente" || aba === "composicao" || aba === "modelos" || aba === "historico" || aba === "codigoEl") && this.painelCorpo.contains(document.activeElement)) return;
    this._abaMontada = aba;
    const amb = this.app.ambiente;
    let c;
    if (aba === "depurador") c = this.corpoDepurador();
    else if (aba === "problemas") c = probs.length ? h("ul", { class: "vs-problemas" }, probs.map(p => {
      const g = this.s.grafos.find(x => x.id === p.grafo);
      return h("li", { class: p.nivel }, h("span", { class: "vs-nivel", html: icone(p.nivel === "info" ? "info" : "alerta", 13) }), h("button", { type: "button", class: "vs-link", onclick: () => this.irPara(p.grafo, p.no) }, p.msg), h("small", {}, g?.nome));
    })) : h("p", { class: "vs-ok" }, h("span", { html: icone("check", 14) }), "Nenhum problema encontrado.");
    else if (aba === "observar") c = this.corpoObservar();
    else if (aba === "codigo") c = this.corpoCodigo();
    else if (aba === "codigoEl") c = this.ui.codigoVisao==="fonte"?h("p",{},"O editor de código do objeto está na área central."):h("div", { class: "forja-pagina" }, amb.painelCodigo());
    else if (aba === "historico") c = h("div", { class: "forja-pagina" }, amb.painelHistorico());
    else if (aba === "modelos") c = h("div", { class: "forja-pagina" }, amb.painel("modelos"));
    else if (aba === "agente") { this.app.painelAgente.render(); c = h("div", { class: "fm-pagina dock-agente" }, this.app.painelAgente.raiz); }
    else if (["efeitos","comportamento","documentacao"].includes(aba)) c=h("div",{class:"forja-pagina"},amb.painel(aba));
    else if (aba === "faixa") { this.formulario ??=new Formulario(this.app);c=h("div",{class:"fm-pagina"},this.formulario.faixa()); }
    else if (aba === "composicao") { this.formulario ??= new Formulario(this.app); c = h("div", { class: "fm-pagina" }, this.formulario.geral()); }
    this.painelCorpo.replaceChildren(c);
    if (aba === "depurador") this.painelCorpo.scrollTop = this.painelCorpo.scrollHeight;
  }
  corpoDepurador() {
    const f = this.filtroLog;
    const vis = this.logs.filter(l => f === "todos" || (f === "log" && l.tipo === "log") || (f === "exec" && l.tipo === "no") || (f === "erro" && (l.nivel === "erro" || l.nivel === "alerta"))).slice(-400);
    if (!vis.length) return h("div", { class: "vs-console-vazio" }, h("span", { html: icone("play", 16) }), this.previa.hidden ? "Aperte Executar (F5) para rodar o script numa prévia ao vivo. Mensagens, execuções e erros aparecem aqui." : "Interaja com a prévia: o que o script fizer aparece aqui.");
    return h("ol", { class: "vs-console", "aria-live": "polite" }, vis.map(l => {
      const g = this.s.grafos.find(x => x.id === l.grafo), no = g?.nos.find(x => x.id === l.no);
      return h("li", { class: `vs-log ${l.nivel ?? l.tipo}` },
        h("time", {}, `[${hora(l.t)}]`),
        h("span", { class: "vs-log-nivel" }, l.tipo === "no" ? "EXEC" : l.tipo === "var" ? "VAR" : l.tipo === "inicio" ? "INÍCIO" : (l.nivel ?? "info").toUpperCase()),
        h("span", { class: "vs-log-msg" }, l.tipo === "no" ? this.titulo(no ?? { tipo: "?" }) : l.tipo === "var" ? `${l.nome} = ${JSON.stringify(l.valor)}` : l.tipo === "inicio" ? `Script iniciado (${l.grafos} grafo(s) ativo(s)).` : l.msg),
        no ? h("button", { type: "button", class: "vs-link", onclick: () => this.irPara(g.id, no.id) }, `${g.nome} › ${this.titulo(no)}`) : null);
    }));
  }
  corpoObservar() {
    if (!this.s.variaveis.length) return h("p", { class: "vs-dica" }, "Crie variáveis no painel Projeto para acompanhar os valores aqui durante a prévia.");
    return h("table", { class: "vs-tabela" }, h("thead", {}, h("tr", {}, h("th", {}, "Variável"), h("th", {}, "Tipo"), h("th", {}, "Inicial"), h("th", {}, "Na prévia"))),
      h("tbody", {}, this.s.variaveis.map(v => h("tr", {}, h("td", {}, h("button", { type: "button", class: "vs-link", onclick: () => { this.varSel = v.id; this.sel.clear(); this.renderInspetor(); } }, v.nome)), h("td", {}, TIPOS_VAR.find(x => x[0] === v.tipo)?.[1]), h("td", {}, h("code", {}, JSON.stringify(v.valor))), h("td", {}, this.aoVivo[v.id] === undefined ? "—" : h("code", { class: "vivo" }, JSON.stringify(this.aoVivo[v.id])))))));
  }
  /** Transcrição legível do grafo: ajuda a revisar e a explicar o que o script faz. */
  /** Nome do nó no texto: o nome do tipo e, se houver, o título próprio entre ‹ ›. */
  rotuloTexto(n) { const d = this.def(n); return `${d?.nome ?? n.tipo}${n.titulo ? ` ‹${n.titulo}›` : ""}`; }
  lerEmTexto(g) {
    const linhas = [], por = new Map(g.nos.map(n => [n.id, n]));
    const lit = (p, v) => p.tipo === "el" ? `«${this.nomeEl(v)}»` : p.tipo === "var" ? this.nomeVar(v) : p.tipo === "bool" ? (v ? "verdadeiro" : "falso") : p.tipo === "sel" ? (p.opcoes.find(o => o[0] === v)?.[1] ?? v) : p.tipo === "num" ? String(v ?? 0) : JSON.stringify(v ?? "");
    const OPS = { "m.somar": "+", "m.subtrair": "−", "m.multiplicar": "×", "m.dividir": "÷", "m.resto": "resto", "l.e": "e", "l.ou": "ou", "t.juntar": "&" };
    const expr = (id, porta, d = 0) => {
      const n = por.get(id), dd = this.def(n); if (!n || !dd || d > 8) return "…";
      if (!dd.puro && !dd.desvio) { const p = dd.sai.find(x => x.id === porta); return `${this.rotuloTexto(n)}.${p?.nome || porta}`; }
      const args = dd.ent.map(p => [p, arg(n, p, d)]);
      if (dd.desvio) return args[0][1];
      if (OPS[n.tipo]) return `(${args[0][1]} ${OPS[n.tipo]} ${args[1][1]})`;
      if (n.tipo === "l.comparar") return `(${args[0][1]} ${n.v?.op ?? "=="} ${args[2][1]})`;
      if (n.tipo === "var.obter") return this.nomeVar(n.v?.variavel);
      if (n.tipo.startsWith("c.")) return args[0][1];
      return `${this.rotuloTexto(n)}(${args.map(a => a[1]).join(", ")})${dd.sai.length > 1 ? "." + (dd.sai.find(x => x.id === porta)?.nome || porta) : ""}`;
    };
    const arg = (n, p, d) => { const l = g.ligacoes.find(x => x.para === n.id && x.ep === p.id); return l ? expr(l.de, l.sp, d + 1) : lit(p, n.v?.[p.id]); };
    const passo = (id, ind, vistos, ep) => {
      const n = por.get(id), dd = this.def(n); if (!n || !dd) return;
      if (vistos.has(id)) { linhas.push(`${ind}↻ volta para ${this.titulo(n)}`); return; }
      vistos = new Set([...vistos, id]);
      if (!dd.desvio) {
        const args = dd.ent.filter(p => p.tipo !== "exec").map(p => `${p.nome ? p.nome + ": " : ""}${arg(n, p, 0)}`);
        const execEnt = dd.ent.filter(p => p.tipo === "exec"), entrada = ep && execEnt.length > 1 && ep !== execEnt[0].id ? `@${(execEnt.find(p => p.id === ep)?.nome || ep).replace(/\s+/g, "_")} ` : "";
        linhas.push(`${ind}${n.desativado ? "// (desativado) " : ""}${entrada}${this.rotuloTexto(n)}${args.length ? `(${args.join(", ")})` : ""}`);
      }
      const execs = dd.sai.filter(p => p.tipo === "exec" || p.tipo === "*");
      for (const p of execs) {
        const ls = g.ligacoes.filter(l => l.de === id && l.sp === p.id);
        if (!ls.length) continue;
        if (execs.length > 1) { linhas.push(`${ind}  ↳ ${p.nome || p.id}:`); for (const l of ls) passo(l.para, ind + "      ", vistos, l.ep); }
        else for (const l of ls) passo(l.para, ind, vistos, l.ep);
      }
    };
    const pastaDe = new Map();
    for (const gr of g.grupos) for (const id of this.membros(gr, g).nos) if (!pastaDe.has(id)) pastaDe.set(id, gr);
    const ordemPasta = gr => gr ? g.grupos.indexOf(gr) : -1;
    const eventos = g.nos.filter(n => this.def(n)?.evento).sort((a, b) => ordemPasta(pastaDe.get(a.id)) - ordemPasta(pastaDe.get(b.id)) || a.y - b.y || a.x - b.x);
    for (const ev of eventos) {
      const dd = this.def(ev), gr = pastaDe.get(ev.id);
      const props = dd.ent.map(p => lit(p, ev.v?.[p.id])).join(", ");
      linhas.push(`quando ${dd.nome}${props ? ` [${props}]` : ""}${gr ? ` ⟦${gr.titulo || "Grupo"}⟧` : ""}:`);
      const ls = g.ligacoes.filter(l => l.de === ev.id && l.sp === "exec");
      if (!ls.length) linhas.push("    (nada ligado)");
      for (const l of ls) passo(l.para, "    ", new Set([ev.id]));
      linhas.push("");
    }
    if (!eventos.length) linhas.push("Este grafo ainda não tem eventos.");
    return linhas.join("\n");
  }
  corpoCodigo() {
    const g = this.g;
    const rt = scriptParaRuntime(this.s);
    const texto = this.lerEmTexto(g);
    return h("div", { class: "vs-codigo" },
      h("div", {}, h("div", { class: "vs-sub" }, h("strong", {}, `Leitura de “${g.nome}”`), h("button", { type: "button", class: "vs-mini", title: "Copiar", "aria-label": "Copiar leitura", html: icone("copiar", 13), onclick: () => copiar(texto).then(ok => ok && avisar("Leitura copiada.")) }),
        h("button", { type: "button", class: "vs-bt-sec vs-bt-txt-mini", onclick: () => this.exportarTxt("leitura") }, "Baixar .txt"), h("button", { type: "button", class: "vs-bt-sec vs-bt-txt-mini", onclick: () => this.exportarTxt("tudo") }, "Tudo em .txt")),
        h("pre", { class: "vs-pre", tabindex: "0" }, texto)),
      h("div", {}, h("div", { class: "vs-sub" }, h("strong", {}, "Dados embutidos no HTML exportado"), h("small", {}, `${JSON.stringify(rt ?? {}).length.toLocaleString("pt-BR")} bytes`)),
        h("pre", { class: "vs-pre", tabindex: "0" }, rt ? JSON.stringify(rt, null, 2) : "// Nenhum grafo ativo com nós: o HTML exportado não leva script.")));
  }

  // ================================================================
  // Prévia ao vivo e depuração
  // ================================================================
  alternarExecucao() {
    if (!this.previa.hidden) { this.pararPrevia(); return; }
    this.previa.hidden = false; this.divPrevia.hidden = false;
    this.contagem.clear(); this.aoVivo = {};
    this.logs.push({ tipo: "log", nivel: "info", msg: "Prévia ao vivo iniciada.", t: Date.now() });
    this.montarPrevia();
    this.ui.vsAba = this.ui.vsAba && this.ui.vsAba !== "problemas" ? this.ui.vsAba : "depurador";
    this.render();
    // no celular o grafo fica na metade de baixo: reenquadra para os nós caberem ali
    if (this.raiz.classList.contains("mobile")) requestAnimationFrame(() => requestAnimationFrame(() => this.enquadrar()));
  }
  pararPrevia() {
    this.previa.hidden = true; this.divPrevia.hidden = true; this.frame = null; this.previa.replaceChildren();
    clearInterval(this._tick); this.metricas.clear(); this.rastros = []; this.rastroVer = null; this.rastroFixo = false;
    this.logs.push({ tipo: "log", nivel: "info", msg: "Prévia parada.", t: Date.now() });
    this.render();
  }
  montarPrevia() {
    const cab = h("div", { class: "vs-previa-cab" },
      h("span", { class: "vs-vivo", "aria-hidden": "true" }), h("strong", {}, "Prévia ao vivo"),
      h("label", { class: "vs-campo-linha", title: "Recarrega a prévia a cada edição do projeto" }, h("input", { type: "checkbox", checked: this.ui.vsAutoRecarga !== false, onchange: e => { this.ui.vsAutoRecarga = e.target.checked; this.salvarUI(); } }), "Auto"),
      h("div", { class: "vs-disp", role: "radiogroup", "aria-label": "Tamanho da prévia" }, [["auto", "Ajustado: a tela do projeto inteira, centralizada", "telaCheia"], ["livre", "Livre (ocupa a área toda)", "editar"], ["celular", "Celular 390×844", "tablet"], ["tablet", "Tablet 820×1180", "tablet"], ["desktop", "Desktop 1440×900", "tela"]].map(([v, r, ic]) =>
        h("button", { type: "button", role: "radio", class: `disp-${v}`, "aria-checked": String((this.ui.vsDispositivo ?? "auto") === v), title: r, "aria-label": r, html: icone(ic, 14), onclick: e => { this.ui.vsDispositivo = v; this.salvarUI(); e.currentTarget.parentElement.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", String(b === e.currentTarget))); this.aplicarDispositivo(); } }))),
      h("button", { type: "button", class: "vs-mini", title: "Girar (retrato/paisagem)", "aria-label": "Girar prévia", html: icone("girar", 14), onclick: () => { this.ui.vsDispGirado = !this.ui.vsDispGirado; this.salvarUI(); this.aplicarDispositivo(); } }),
      h("button", { type: "button", class: "vs-mini", title: "Recarregar", "aria-label": "Recarregar prévia", html: icone("refazer", 14), onclick: () => this.recarregar() }),
      h("button", { type: "button", class: "vs-mini", title: "Abrir em janela grande", "aria-label": "Abrir prévia em janela", html: icone("telaCheia", 14), onclick: () => this.app.setModo("previa") }),
      h("button", { type: "button", class: "vs-mini", title: "Parar", "aria-label": "Parar prévia", html: icone("fechar", 14), onclick: () => this.pararPrevia() }));
    clearInterval(this._tick);
    this._tick = setInterval(() => { if (this.frame) this.atualizarTelemetria(); }, 1000);
    this.frame = h("iframe", { title: "Prévia ao vivo do projeto", sandbox: "allow-scripts allow-popups allow-modals", class: "vs-frame" });
    this.molduraPrev = h("div", { class: "vs-moldura" }, this.frame);
    this.palcoPrev = h("div", { class: "vs-previa-palco" }, this.molduraPrev, this.rotuloDisp = h("small", { class: "vs-disp-rot" }));
    this.previa.replaceChildren(cab, this.palcoPrev);
    this._roPrev ??= new ResizeObserver(() => this.aplicarDispositivo());
    this._roPrev.observe(this.palcoPrev);
    this.aplicarDispositivo();
    this.recarregar();
  }
  /** Celular, tablet ou desktop: a página roda no tamanho real e a moldura é reduzida para caber. */
  aplicarDispositivo() {
    if (!this.molduraPrev || !this.palcoPrev?.isConnected) return;
    this.previa.querySelectorAll(".vs-disp button").forEach(b => b.setAttribute("aria-checked", String(b.classList.contains("disp-" + (this.ui.vsDispositivo ?? "auto")))));
    const disp = this.ui.vsDispositivo ?? "auto", tela = this.n.tela ?? {};
    const tam = { celular: [390, 844], tablet: [820, 1180], desktop: [1440, 900], auto: [Number(tela.largura) || 960, Number(tela.altura) || 600] }[disp];
    const m = this.molduraPrev;
    m.className = `vs-moldura ${disp === "auto" ? "ajustada" : tam ? "disp-" + disp : ""}`;
    this.palcoPrev.classList.toggle("centro", disp === "auto");
    if (!tam) { Object.assign(m.style, { width: "", height: "", transform: "" }); this.rotuloDisp.textContent = ""; return; }
    let [w, hh] = tam;
    if (this.ui.vsDispGirado) [w, hh] = [hh, w];
    const r = this.palcoPrev.getBoundingClientRect(), borda = disp === "auto" ? 0 : disp === "desktop" ? 12 : 28;
    const k = Math.min(1, (r.width - (disp === "auto" ? 12 : 24)) / (w + borda), (r.height - (disp === "auto" ? 12 : 40)) / (hh + borda));
    Object.assign(m.style, { width: `${w}px`, height: `${hh}px`, transform: `scale(${Math.max(0.05, k).toFixed(3)})` });
    this.rotuloDisp.textContent = `${disp === "auto" ? "Ajustado · " : ""}${w}×${hh} · ${Math.round(k * 100)}%`;
  }
  recarregar() {
    if (!this.frame) return;
    this.contagem.clear(); this.aoVivo = {}; this.metricas.clear(); this.ultimoNo.clear(); this.rastros = []; this.rastroVer = null; this.rastroFixo = false;
    if (this.fioEls) { this.atualizarTelemetria(); this.aplicarRastro(); }
    try { this.frame.srcdoc = gerarHTML(this.n.doc, { depurar: true }); }
    catch (e) { this.logs.push({ tipo: "log", nivel: "erro", msg: `Falha ao gerar a prévia: ${e.message}`, t: Date.now() }); this.renderPainel(); }
    this.versaoPrevia = this.n.versao;
  }
  agendarRecarga() {
    if (!this.frame || this.ui.vsAutoRecarga === false) return;
    clearTimeout(this._tRecarga);
    this._tRecarga = setTimeout(() => { if (this.frame && this.versaoPrevia !== this.n.versao) this.recarregar(); }, 450);
  }
  aoMensagem(e) {
    const d = e.data?.hefestusVS;
    if (!d) return;
    const fontes = [this.frame?.contentWindow, this.app.janelaTeste?.frame?.contentWindow].filter(Boolean);
    if (!fontes.includes(e.source)) return;
    if (d.tipo === "fio" || d.tipo === "dado") {
      const k = `${d.grafo}|${d.de}|${d.sp}|${d.para}|${d.ep}`;
      const m = this.metricas.get(k) ?? { n: 0, ts: [] };
      m.n++; m.ts.push(d.t); if (m.ts.length > 40) m.ts.shift(); m.ultimo = d.t;
      if (d.tipo === "dado") m.valor = d.valor;
      else { const t0 = this.ultimoNo.get(d.grafo + "|" + d.de); if (t0 != null) m.lat = Math.max(0, d.t - t0); }
      this.metricas.set(k, m);
      this.acenderFio(d);
      this.passoRastro(d);
      this.agendarTelemetria();
      return;
    }
    if (d.tipo === "no") {
      this.ultimoNo.set(d.grafo + "|" + d.no, d.t);
      this.passoRastro(d);
      const k = d.grafo + "|" + d.no;
      this.contagem.set(k, (this.contagem.get(k) ?? 0) + 1);
      this.acenderNo(d);
    }
    if (d.tipo === "var") this.aoVivo[d.id] = d.valor;
    this.logs.push(d);
    if (this.logs.length > 1500) this.logs.splice(0, this.logs.length - 1200);
    clearTimeout(this._tLog);
    this._tLog = setTimeout(() => {
      if ((this.ui.vsAba ?? "depurador") === "depurador" || this.ui.vsAba === "observar") this.renderPainel();
      if (d.tipo === "log" && d.nivel === "erro") this.renderPainel();
      if (this.varSel || this.sel.size === 1) this.renderInspetor();
    }, 60);
  }
  acenderNo(d, soVisual) {
    if (d.grafo !== this.g.id) return;
    const el = this.noEls?.get(d.no) ?? this.pastaEls?.get(this.ocultos?.get(d.no)?.id); if (!el) return;
    el.classList.remove("vs-pulso"); void el.offsetWidth; el.classList.add("vs-pulso");
    el.classList.add("recente"); clearTimeout(el._tr); el._tr = setTimeout(() => el.classList.remove("recente"), 1800);
    if (soVisual) return;
    const c = this.contagem.get(d.grafo + "|" + d.no);
    let b = el.querySelector(".vs-cont");
    if (!b && c) { b = h("span", { class: "vs-cont", title: "Execuções nesta sessão de prévia" }); el.querySelector(".vs-no-cab")?.append(b); }
    if (b) b.textContent = `×${c}`;
  }
  acenderFio(d) {
    if (d.grafo !== this.g.id) return;
    this.efeitoFio(this.fioEls?.get(`${d.de}|${d.sp}|${d.para}|${d.ep}`), d.tipo === "dado" ? 0.6 : 1);
  }
  /** Passagem de um comando: clarão percorrendo o fio + fluxo estilo Unity enquanto estiver ativo. */
  efeitoFio(el, forca = 1) {
    if (!el) return;
    el.classList.remove("corre"); void el.getBoundingClientRect(); el.classList.add("corre");
    el.classList.toggle("fraco", forca < 1);
    el.classList.add("unity-ativo");
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("corre"), 900);
    clearTimeout(el._tu); el._tu = setTimeout(() => el.classList.remove("unity-ativo"), 1600);
  }

  // ---------------- divisores ----------------
  ligarDivisores() {
    const arrastar = (alvo, fn) => alvo.addEventListener("pointerdown", e => {
      e.preventDefault();
      const mv = ev => fn(ev);
      const fim = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", fim); this.app.salvarUI(); this.desenharMinimapa(); };
      window.addEventListener("pointermove", mv); window.addEventListener("pointerup", fim);
    });
    arrastar(this.divPainel, ev => {
      const r = this.raiz.getBoundingClientRect();
      this.ui.vsPainelFechado = false;
      this.ui.vsPainelAlt = Math.max(90, Math.min(r.height - 220, r.bottom - ev.clientY));
      this.aplicarLayout();
    });
    arrastar(this.divPrevia, ev => {
      if (this.raiz.classList.contains("mobile")) {
        const r = this.palcoEl.getBoundingClientRect();
        this.ui.vsPreviaAltMob = Math.max(0.2, Math.min(0.8, (ev.clientY - r.top) / r.height));
      } else {
        const r = this.centro.getBoundingClientRect();
        this.ui.vsPreviaLarg = Math.max(260, Math.min(r.width - 240, r.right - ev.clientX));
      }
      this.aplicarLayout();
    });
    this.divPainel.addEventListener("keydown", e => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault(); this.ui.vsPainelAlt = Math.max(90, (this.ui.vsPainelAlt ?? 210) + (e.key === "ArrowUp" ? 24 : -24)); this.aplicarLayout(); this.salvarUI();
    });
    this.divPrevia.addEventListener("keydown", e => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault(); this.ui.vsPreviaLarg = Math.max(260, (this.ui.vsPreviaLarg ?? 420) + (e.key === "ArrowLeft" ? 24 : -24)); this.aplicarLayout(); this.salvarUI();
    });
    this.divPrevia.hidden = true;
  }

  mostrarAjuda() {
    const linhas = [["Espaço / Tab / clique direito", "Buscar e adicionar nó"], ["Espaço + arrastar, botão do meio ou direito", "Mover a vista"], ["Roda do mouse", "Zoom (Shift+roda: rolar)"], ["Arrastar de uma porta para o vazio", "Criar nó já ligado"], ["Arrastar entrada ligada", "Soltar o fio e religar"], ["Alt + clique em fio/porta/nó", "Cortar ligações"], ["Duplo clique no fio", "Inserir desvio"], ["Ctrl+C / Ctrl+X / Ctrl+V / Ctrl+D", "Copiar, recortar, colar, duplicar"], ["Ctrl+G", "Agrupar seleção"], ["N", "Nova nota"], ["F / Home", "Enquadrar seleção / tudo"], ["Setas (Shift: passo maior)", "Mover seleção"], ["Ctrl+K", "Paleta de comandos"], ["F5", "Executar / parar prévia"], ["Ctrl+Z / Ctrl+Y", "Voltar / refazer"]];
    const veu = h("div", { class: "veu vs-ajuda-veu", onclick: e => { if (e.target === veu) fechar(); } },
      h("section", { class: "vs-ajuda", role: "dialog", "aria-modal": "true", "aria-label": "Atalhos do Visual Script", tabindex: "-1" },
        h("header", {}, h("h2", {}, "Atalhos do Visual Script"), h("button", { type: "button", class: "vs-mini", "aria-label": "Fechar", html: icone("fechar", 16), onclick: () => fechar() })),
        h("dl", {}, linhas.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]))));
    const fechar = () => { veu.remove(); this.tela.focus(); };
    veu.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); fechar(); } });
    document.body.append(veu);
    veu.querySelector("section").focus();
  }
}

export { EstudioVS };
