// Tema completo a partir de uma descrição ("escuro com azul ciano e cantos suaves"):
// escolhe matiz, modo claro/escuro e raio, e gera as cores de cada tipo de elemento.
import { contraste } from "./auditoria.js";

const sem = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const MATIZ = {
  ciano: 188, turquesa: 174, azul: 221, anil: 235, indigo: 235, roxo: 262, violeta: 270, lilas: 280, rosa: 330, magenta: 310, vermelho: 0, bordo: 350,
  laranja: 24, ambar: 38, dourado: 43, amarelo: 48, lima: 84, verde: 142, esmeralda: 158, marrom: 25, grafite: 215, cinza: 215,
};

function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255, a: 1 };
}
const hex = c => `#${[c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const H = (h, s, l) => hex(hsl(h, s, l));
const sobre = c => (contraste(hsl(0, 0, 100), c) >= contraste(hsl(0, 0, 7), c) ? "#ffffff" : "#111827");

/** Devolve { nome, tela, tipos, raio, modo, matiz, tokens } ou null se o texto não descreve um tema. */
export function gerarTema(texto) {
  const t = sem(texto);
  const achados = Object.keys(MATIZ).filter(k => new RegExp(`\\b${k}\\b`).test(t));
  const escuro = /\b(escur[oa]|dark|noturn[oa]|noite|preto)\b/.test(t) && !/\b(claro|clara|light)\b/.test(t);
  if (!achados.length && !/\b(escur[oa]|claro|clara|dark|light|noturn[oa]|vibrante|pastel|neutro|suave|cantos|minimalista)\b/.test(t)) return null;
  // com duas cores ("azul ciano"), o matiz é a média; "neutro/cinza/grafite" reduz a saturação
  const hs = achados.map(k => MATIZ[k]);
  const h = hs.length ? Math.round(hs.reduce((a, b) => a + b, 0) / hs.length) : 221;
  const neutro = /\b(neutro|cinza|grafite|monocromatic[oa]|minimalista)\b/.test(t) && !hs.filter((_, i) => !["grafite", "cinza"].includes(achados[i])).length;
  const sat = neutro ? 8 : /\bpastel\b/.test(t) ? 45 : /\b(vibrante|forte|vivo|saturad[oa])\b/.test(t) ? 90 : 72;
  const raio = /\b(retos?|quadrad[oa]s?|sem arredondar)\b/.test(t) ? 0 : /\b(pilula|redond[oa]s?|bem arredondad[oa]s?)\b/.test(t) ? 24 : /\b(suaves?|arredondad[oa]s?|macios?)\b/.test(t) ? 12 : null;
  const acento = escuro ? H(h, sat, 58) : H(h, sat, 44);
  const hover = escuro ? H(h, sat, 66) : H(h, sat, 36);
  const tela = escuro ? H(h, neutro ? 8 : 30, 9) : H(h, neutro ? 6 : 28, 97);
  const sup = escuro ? H(h, neutro ? 8 : 24, 14) : "#ffffff";
  const texto1 = escuro ? H(h, 18, 92) : H(h, 30, 14);
  const borda = escuro ? H(h, 18, 24) : H(h, 16, 86);
  const campo = escuro ? H(h, neutro ? 8 : 26, 11) : "#ffffff";
  const toggle = escuro ? H(h, 14, 30) : H(h, 14, 80);
  const nome = `${escuro ? "Escuro" : "Claro"} ${achados.length ? achados.join(" ") : "azul"}`;
  const tipos = {
    botao: [acento, sobre(hsl(h, sat, escuro ? 58 : 44)), hover], caixa: [sup, texto1, borda], texto: ["transparent", texto1, "transparent"],
    campo: [campo, texto1, borda], toggle: [toggle, "#ffffff", "transparent"], menu: [sup, texto1, borda], modal: [sup, texto1, borda],
    toast: [escuro ? H(h, 18, 92) : H(h, 30, 12), escuro ? H(h, 30, 10) : H(h, 20, 96), "transparent"],
  };
  return { nome, tela, tipos, raio, modo: escuro ? "escuro" : "claro", matiz: h, tokens: { acento, hover, superficie: sup, texto: texto1, borda } };
}

/** Aplica o tema gerado em todos os elementos num único comando desfazível. */
export function aplicarTemaGerado(n, tema) {
  return n.aplicarEmTodos(["estilo.fundo", "estilo.cor", "estilo.borda", "estilo.raio", "estados.hover.fundo", "estados.focus.contorno", "fundo"], el => {
    const c = tema.tipos[el.tipo];
    if (!c) return;
    el.estilo ??= {};
    [el.estilo.fundo, el.estilo.cor, el.estilo.borda] = c;
    if (el.tipo === "botao") { el.estados ??= {}; el.estados.hover = { ...(el.estados.hover ?? {}), fundo: c[2] }; }
    if (tema.raio !== null && ["botao", "caixa", "campo", "menu", "modal", "toast", "container"].includes(el.tipo)) el.estilo.raio = tema.raio;
    if (["botao", "campo", "toggle", "menu"].includes(el.tipo)) { el.estados ??= {}; el.estados.focus = { ...(el.estados.focus ?? {}), contorno: tema.tokens.acento }; }
  }, `Tema ${tema.nome} nos elementos`, tela => { tela.fundo = tema.tela; });
}
