// Estilos de botão com acabamento de designer de UI: relevo, 3D, neumorfismo, vidro, brilho, neon, gradiente
// brilhante, contorno, pílula e animações (ondulação, pulso). Cada estilo devolve as propriedades de estilo
// (fundo, borda, camadas de preenchimento, sombras) e, quando há, a animação ao passar o mouse e ao clicar.
// Vale para botão, caixa, container e forma; o resultado é CSS puro no HTML exportado.

import { fundoCSS, efeitosCSS } from "./estiloAvancado.js";

const lim = (v, a, b) => Math.max(a, Math.min(b, v));
function rgb(hex, reserva = "#2563eb") {
  let h = String(hex || "").trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(h)) h = reserva;
  h = h.slice(1);
  if (h.length === 3) h = [...h].map(c => c + c).join("");
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}
const para = ([r, g, b]) => `#${[r, g, b].map(v => lim(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`;
/** Mistura com branco (k > 0) ou preto (k < 0). */
export const matiz = (hex, k) => { const c = rgb(hex); const alvo = k >= 0 ? 255 : 0; return para(c.map(v => v + (alvo - v) * Math.abs(k))); };
export const comAlfa = (hex, a) => `${para(rgb(hex))}${Math.round(lim(a, 0, 1) * 255).toString(16).padStart(2, "0")}`;
const luz = hex => { const [r, g, b] = rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
/** Cor de texto legível sobre o fundo. */
export const textoSobre = hex => (luz(hex) > 0.62 ? "#111827" : "#ffffff");

const sombra = (x, y, blur, cor, espalhar = 0, tipo = "sombra") => ({ tipo, visivel: true, x, y, blur, espalhar, cor });
const solido = cor => ({ tipo: "solido", visivel: true, opacidade: 1, cor, paradas: [] });
const linear = (angulo, paradas) => ({ tipo: "linear", visivel: true, opacidade: 1, cor: paradas[0].cor, angulo, paradas });

export const EFEITOS_BOTAO = [
  { id: "plano", nome: "Plano", desc: "Cor chapada, sem sombra" },
  { id: "elevado", nome: "Elevado", desc: "Sombra suave, como cartão" },
  { id: "relevo", nome: "Relevo (bisel)", desc: "Luz em cima, sombra embaixo, borda fina" },
  { id: "tridimensional", nome: "3D (tecla)", desc: "Base grossa que afunda ao clicar" },
  { id: "neumorfico", nome: "Neumorfismo", desc: "Saliência suave no mesmo tom do fundo" },
  { id: "afundado", nome: "Afundado", desc: "Parece pressionado para dentro" },
  { id: "brilhante", nome: "Gradiente brilhante", desc: "Reflexo de vidro na metade de cima" },
  { id: "pilula", nome: "Pílula com gradiente", desc: "Cantos totalmente redondos e degradê" },
  { id: "brilho", nome: "Brilho (glow)", desc: "Halo de luz na cor de destaque" },
  { id: "neon", nome: "Neon", desc: "Contorno e luz na cor de destaque" },
  { id: "vidro", nome: "Vidro fosco", desc: "Translúcido com desfoque do fundo" },
  { id: "contorno", nome: "Contorno", desc: "Só a borda, fundo transparente" },
  { id: "ondulacao", nome: "Ondulação ao clicar", desc: "Onda a partir do ponto do clique" },
  { id: "pulso", nome: "Pulso ao clicar", desc: "Cresce ao passar o mouse e pulsa ao clicar" },
];

/**
 * Propriedades de estilo de um efeito de botão.
 * @param {string} id efeito (EFEITOS_BOTAO)
 * @param {string} fundo cor base do botão
 * @param {string} acento cor de destaque (brilho, neon, contorno)
 */
export function propsEfeitoBotao(id, fundo = "#2563eb", acento = fundo) {
  const f = rgb(fundo) && para(rgb(fundo)), a = para(rgb(acento, f));
  const limpo = { "estilo.efeitos": [], "estilo.preenchimentos": [], "estilo.sombra": "nenhuma", "estilo.vidro": 0, "animacao.hover": "brilho", "animacao.clique": "afundar" };
  const base = (extra = {}) => ({ ...limpo, "estilo.fundo": f, "estilo.borda": f, "estilo.larguraBorda": 0, "estilo.cor": textoSobre(f), ...extra });
  switch (id) {
    case "plano": return base();
    case "elevado": return base({ "estilo.efeitos": [sombra(0, 6, 16, "#00000040"), sombra(0, 1, 3, "#00000030")], "animacao.hover": "elevar" });
    case "relevo": return base({
      "estilo.borda": matiz(f, -0.35), "estilo.larguraBorda": 1,
      "estilo.preenchimentos": [linear(180, [{ pos: 0, cor: matiz(f, 0.22), alfa: 1 }, { pos: 100, cor: matiz(f, -0.14), alfa: 1 }])],
      "estilo.efeitos": [sombra(0, 1, 0, "#ffffff73", 0, "sombraInterna"), sombra(0, -1, 0, "#00000040", 0, "sombraInterna"), sombra(0, 2, 4, "#00000059")],
    });
    case "tridimensional": return base({
      "estilo.efeitos": [sombra(0, 6, 0, matiz(f, -0.4)), sombra(0, 10, 12, "#00000040")],
      "estilo.preenchimentos": [linear(180, [{ pos: 0, cor: matiz(f, 0.12), alfa: 1 }, { pos: 100, cor: f, alfa: 1 }])],
    });
    case "neumorfico": {
      const m = luz(f) > 0.5 ? f : matiz(f, 0.0);
      return base({ "estilo.fundo": m, "estilo.cor": textoSobre(m), "estilo.efeitos": [sombra(-6, -6, 12, comAlfa(matiz(m, 0.7), 0.9)), sombra(6, 6, 12, comAlfa(matiz(m, -0.28), 0.8))], "animacao.hover": "nenhuma" });
    }
    case "afundado": return base({
      "estilo.efeitos": [sombra(3, 3, 6, comAlfa(matiz(f, -0.5), 0.75), 0, "sombraInterna"), sombra(-3, -3, 6, comAlfa(matiz(f, 0.45), 0.55), 0, "sombraInterna")],
      "animacao.hover": "nenhuma", "animacao.clique": "nenhuma",
    });
    case "brilhante": return base({
      "estilo.borda": matiz(f, -0.3), "estilo.larguraBorda": 1,
      "estilo.preenchimentos": [
        linear(180, [{ pos: 0, cor: "#ffffff", alfa: 0.55 }, { pos: 50, cor: "#ffffff", alfa: 0.12 }, { pos: 51, cor: "#ffffff", alfa: 0 }, { pos: 100, cor: "#ffffff", alfa: 0 }]),
        linear(180, [{ pos: 0, cor: matiz(f, 0.1), alfa: 1 }, { pos: 100, cor: matiz(f, -0.18), alfa: 1 }]),
      ],
      "estilo.efeitos": [sombra(0, 1, 0, "#ffffff8c", 0, "sombraInterna"), sombra(0, 3, 6, "#00000059")],
    });
    case "pilula": return base({
      "estilo.raio": 999,
      "estilo.preenchimentos": [linear(90, [{ pos: 0, cor: matiz(a, 0.12), alfa: 1 }, { pos: 100, cor: matiz(a, -0.22), alfa: 1 }])],
      "estilo.efeitos": [sombra(0, 6, 14, comAlfa(a, 0.45))], "estilo.cor": textoSobre(a),
    });
    case "brilho": return base({ "estilo.efeitos": [sombra(0, 0, 22, comAlfa(a, 0.65)), sombra(0, 0, 6, comAlfa(a, 0.5))], "animacao.hover": "brilho" });
    case "neon": return base({
      "estilo.fundo": "#0b1020", "estilo.borda": a, "estilo.larguraBorda": 2, "estilo.cor": a,
      "estilo.efeitos": [sombra(0, 0, 18, comAlfa(a, 0.75)), sombra(0, 0, 10, comAlfa(a, 0.3), 0, "sombraInterna")], "animacao.hover": "brilho",
    });
    case "vidro": return base({ "estilo.fundo": "#ffffff26", "estilo.borda": "#ffffff59", "estilo.larguraBorda": 1, "estilo.cor": "#ffffff", "estilo.vidro": 14, "estilo.efeitos": [sombra(0, 8, 24, "#00000040")], "animacao.hover": "elevar" });
    case "contorno": return base({ "estilo.fundo": "transparent", "estilo.borda": a, "estilo.larguraBorda": 2, "estilo.cor": a, "animacao.hover": "brilho" });
    case "ondulacao": return base({ "animacao.hover": "brilho", "animacao.clique": "ondulacao" });
    case "pulso": return base({ "estilo.efeitos": [sombra(0, 4, 12, comAlfa(f, 0.5))], "animacao.hover": "escala", "animacao.clique": "pulso" });
    default: return base();
  }
}

/** CSS inline de uma miniatura "Abc" do efeito (para galerias e menus). */
export function miniaturaEfeitoBotao(id, fundo = "#2563eb", acento = fundo) {
  const p = propsEfeitoBotao(id, fundo, acento), ef = efeitosCSS(p["estilo.efeitos"]);
  const fills = p["estilo.preenchimentos"];
  const bg = fills.length ? fundoCSS(fills, p["estilo.fundo"]) : p["estilo.fundo"];
  const borda = p["estilo.larguraBorda"] ? `${Math.min(2, p["estilo.larguraBorda"])}px solid ${p["estilo.borda"]}` : "0";
  return `background:${bg};color:${p["estilo.cor"]};border:${borda};border-radius:${id === "pilula" ? 999 : 6}px;box-shadow:${ef.sombras.join(",") || "none"};${p["estilo.vidro"] ? "backdrop-filter:blur(4px);" : ""}`;
}
