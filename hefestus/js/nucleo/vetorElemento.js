// Ponte entre elementos do documento e o motor de vetores (vetor.js):
// converte formas, caixas e elipses em contornos (px do documento) e monta o elemento resultante.
import { CATALOGO } from "./catalogo.js";
import { FORMAS } from "./formas.js";
import { caminhoDaForma } from "./estiloAvancado.js";
import { lerCaminho, escreverCaminho, transformar, retanguloContornos, elipseContornos, limitesDe, booleana } from "./vetor.js";

export const TIPOS_VETORIZAVEIS = ["forma", "caixa", "container", "botao", "elipse", "campo"];
export const OPERACOES = { unir: "União", subtrair: "Subtração", intersectar: "Interseção", excluir: "Exclusão" };

const num = (v, r = 0) => (Number.isFinite(+v) ? +v : r);

/** Contornos do elemento em coordenadas do documento (com rotação aplicada), ou null se o tipo não serve. */
export function contornosDoElemento(el) {
  if (!el || !TIPOS_VETORIZAVEIS.includes(el.tipo)) return null;
  const { x, y, largura: w, altura: h } = el;
  let cs;
  if (el.tipo === "forma") {
    const { d } = caminhoDaForma(el, FORMAS);
    cs = transformar(lerCaminho(d), (px, py) => [x + (px / 100) * w, y + (py / 100) * h]);
  } else if (el.tipo === "elipse") cs = elipseContornos(x, y, w, h);
  else {
    const e = el.estilo ?? {};
    const raios = Array.isArray(e.cantos) && e.cantos.length === 4 ? e.cantos : [num(e.raio), num(e.raio), num(e.raio), num(e.raio)];
    cs = retanguloContornos(x, y, w, h, raios);
  }
  const rot = num(el.rotacao);
  if (rot) {
    const a = (rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), cx = x + w / 2, cy = y + h / 2;
    cs = transformar(cs, (px, py) => [cx + (px - cx) * c - (py - cy) * s, cy + (px - cx) * s + (py - cy) * c]);
  }
  return cs;
}

/** Caixa + caminho normalizado (0..100) a partir de contornos em px do documento. */
export function normalizarContornos(cs) {
  const b = limitesDe(cs, 0.5);
  if (!b) return null;
  const w = Math.max(1, b.largura), h = Math.max(1, b.altura);
  const caminho = escreverCaminho(transformar(cs, (px, py) => [((px - b.x) / w) * 100, ((py - b.y) / h) * 100]));
  return { x: Math.round(b.x * 100) / 100, y: Math.round(b.y * 100) / 100, largura: Math.round(w * 100) / 100, altura: Math.round(h * 100) / 100, caminho };
}

/** Estilo herdado para um vetor nascido de `base`. */
export function estiloParaVetor(base) {
  const e = JSON.parse(JSON.stringify(base?.estilo ?? CATALOGO.forma.padrao().estilo));
  delete e.cantos;
  e.raio = 0;
  return e;
}

/** Aplica a operação em cadeia: o 1º (mais ao fundo) é a base; os demais entram um a um. */
export function operar(listaContornos, op) {
  let acc = listaContornos[0];
  for (const c of listaContornos.slice(1)) acc = booleana(acc, c, op);
  return acc;
}

/** Máscara de `fonte` sobre `alvo`: caminho 0..100 no sistema local do alvo (rotação do alvo compensada). */
export function mascaraPara(alvo, fonte) {
  let cs = contornosDoElemento(fonte);
  if (!cs) return null;
  const rot = num(alvo.rotacao);
  if (rot) {
    const a = (-rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), cx = alvo.x + alvo.largura / 2, cy = alvo.y + alvo.altura / 2;
    cs = transformar(cs, (px, py) => [cx + (px - cx) * c - (py - cy) * s, cy + (px - cx) * s + (py - cy) * c]);
  }
  const w = Math.max(1, alvo.largura), h = Math.max(1, alvo.altura);
  const d = escreverCaminho(transformar(cs, (px, py) => [((px - alvo.x) / w) * 100, ((py - alvo.y) / h) * 100]));
  return { d, evenodd: fonte.tipo === "forma" && !!fonte.evenodd };
}
