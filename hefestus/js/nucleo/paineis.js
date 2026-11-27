// Painéis divididos (estilo VS Code / Qt dock): regiões esquerda, direita, inferior e centro,
// com divisores arrastáveis e botão de recolher. A geometria é calculada aqui para o desenho
// inicial e repetida no runtime (exportar/runtime.js) para arrastar e recolher.
import { cont, texto } from "./modelos.js";

export const CAB = 30, TRILHO = 36, MIN = 80, GLIFOS = { esq: ["‹", "›"], dir: ["›", "‹"], baixo: ["⌄", "⌃"] };
const num = (v, r, min = 0, max = 5000) => (Number.isFinite(+v) ? Math.max(min, Math.min(max, +v)) : r);
const hexOk = (v, r) => (/^#[0-9a-f]{3,8}$/i.test(String(v ?? "")) || v === "transparent" ? v : r);

export function novoPaineis(seq) {
  return { id: `pn${seq}`, tipo: "paineis", nome: `Painéis divididos ${seq}`, x: 40, y: 40, largura: 900, altura: 520,
    regioes: ["esq", "dir", "baixo"], tamEsq: 220, tamDir: 240, tamBaixo: 150, divisor: 6,
    titulos: { esq: "Explorador", dir: "Propriedades", baixo: "Console", centro: "Área de trabalho" },
    fundo: "#111827", borda: "#1f2a44", cor: "#e2e8f0", acento: "#22d3ee", raio: 8 };
}

/** Retângulos {x,y,w,h} (relativos ao raiz) de cada região, dados os tamanhos e o que está recolhido. */
export function geometria(W, H, D, usa, tam, rec) {
  const L = k => (usa[k] ? (rec[k] ? TRILHO : tam[k]) : 0);
  const Le = L("esq"), Ld = L("dir"), Lb = L("baixo");
  const dE = usa.esq ? D : 0, dD = usa.dir ? D : 0, dB = usa.baixo ? D : 0;
  const cx = Le + dE, cw = Math.max(0, W - Le - dE - Ld - dD), ch = Math.max(0, H - Lb - dB);
  return {
    esq: { x: 0, y: 0, w: Le, h: H }, dir: { x: W - Ld, y: 0, w: Ld, h: H }, baixo: { x: cx, y: H - Lb, w: cw, h: Lb },
    centro: { x: cx, y: 0, w: cw, h: ch },
    div: { esq: { x: Le, y: 0, w: D, h: H }, dir: { x: W - Ld - D, y: 0, w: D, h: H }, baixo: { x: cx, y: H - Lb - D, w: cw, h: D } },
  };
}

export function arvorePaineis(c) {
  const id = c.id, W = num(c.largura, 900, 240, 4000), H = num(c.altura, 520, 160, 3000), D = num(c.divisor, 6, 2, 16);
  const fundo = hexOk(c.fundo, "#111827"), borda = hexOk(c.borda, "#1f2a44"), cor = hexOk(c.cor, "#e2e8f0"), ac = hexOk(c.acento, "#22d3ee"), raio = num(c.raio, 8, 0, 40);
  const regioes = (c.regioes ?? []).filter(k => ["esq", "dir", "baixo"].includes(k));
  const usa = { esq: regioes.includes("esq"), dir: regioes.includes("dir"), baixo: regioes.includes("baixo") };
  const tam = { esq: num(c.tamEsq, 220, MIN, W), dir: num(c.tamDir, 240, MIN, W), baixo: num(c.tamBaixo, 150, MIN, H) };
  const g = geometria(W, H, D, usa, tam, {});
  const tit = k => String(c.titulos?.[k] ?? { esq: "Esquerda", dir: "Direita", baixo: "Inferior", centro: "Centro" }[k]);
  const regiao = k => {
    const r = g[k], p = `${id}_${k}`;
    const tem = k !== "centro";
    return [
      cont(r.x, r.y, r.w, r.h, { modo: "livre" }, { ref: p, "estilo.fundo": fundo, "estilo.borda": borda, "estilo.larguraBorda": 1, "estilo.raio": raio }, `Painel ${tit(k)}`, [
        texto(10, 7, Math.max(20, r.w - (tem ? 50 : 20)), 18, tit(k), cor, 12, { ref: `${p}_tit`, "estilo.peso": 700 }, `Título ${tit(k)}`),
        ...(tem ? [cont(r.w - 28, 4, 24, 24, { modo: "livre" }, { ref: `${p}_btn`, "estilo.raio": 6, "estados.hover.fundo": "#ffffff1f", acessibilidade: { role: "button", ariaLabel: `Recolher ${tit(k)}` } }, `Recolher ${tit(k)}`, [
          texto(0, 1, 24, 20, GLIFOS[k][0], cor, 16, { ref: `${p}_btn_tx`, "estilo.alinhamento": "centro" }, "Glifo")])] : []),
        cont(6, CAB + 4, Math.max(10, r.w - 12), Math.max(10, r.h - CAB - 10), { modo: "livre" }, { ref: `${p}_corpo` }, `Conteúdo ${tit(k)}`),
      ])];
  };
  const divisor = k => { const r = g.div[k]; return cont(r.x, r.y, r.w, r.h, { modo: "livre" }, { ref: `${id}_div_${k}`, "estilo.fundo": borda, "estados.hover.fundo": ac, "estilo.raio": 2 }, `Divisor ${tit(k)}`); };
  const filhos = [...regiao("centro"), ...["esq", "dir", "baixo"].filter(k => usa[k]).flatMap(regiao), ...["esq", "dir", "baixo"].filter(k => usa[k]).map(divisor)];
  return cont(0, 0, W, H, { modo: "livre" }, { ref: id, painelDock: JSON.stringify({ r: regioes, t: tam, d: D }) }, c.nome, filhos);
}
