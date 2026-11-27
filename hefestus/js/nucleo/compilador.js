import { executarScript, scriptParaRuntime, alvosDoScript } from "./visualScript.js";
import { motorMenus } from "./motorMenus.js";
// Compilador responsivo: documento → árvore HTML + CSS que se adapta à largura da tela.
// · Containers em linha/coluna viram flexbox (espaço, margem, alinhar, distribuir,
//   preencher, quebrar linha e empilhar em telas pequenas).
// · Os outros elementos ficam ancorados ao pai (tela ou container livre) conforme as
//   restrições: esquerda, direita, esticar, centro ou proporcional. "Automático" escolhe
//   pela posição no desenho.
// · Ocultar/mostrar por largura de tela usa container queries da própria arte, então a
//   Prévia redimensionável e o arquivo exportado se comportam igual.
// Usado pela Prévia e pelo HTML exportado. O Designer continua com as peças planas.
import { listar, marcacaoCompleta, css, cssBase, esc } from "./exportar.js";
import { linkGoogleFonts } from "./fontes.js";
import { dadosRuntime, ligarRuntime } from "./runtime.js";
import { codigoDosGrupos, executarCodigoGrupos } from "./codigoGrupo.js";
import { controlesDaLista } from "./controlador.js";
const auto = el => el?.tipo === "container" && (el.layout?.modo === "linha" || el.layout?.modo === "coluna");
const px = v => `${Math.round(v * 100) / 100}px`;
const pct = (v, t) => `${t ? Math.round((v / t) * 10000) / 100 : 0}%`;
const ALINHAR = { inicio: "flex-start", centro: "center", fim: "flex-end", esticar: "stretch" };
const JUSTIFICAR = { inicio: "flex-start", centro: "center", fim: "flex-end", entre: "space-between" };

/** Restrição escolhida pela posição no desenho (o que um designer faria). */
function restricaoAuto(el, P) {
  const esq = el.x - P.x;
  const dir = P.x + P.largura - (el.x + el.largura);
  const topo = el.y - P.y;
  const base = P.y + P.altura - (el.y + el.altura);
  const margemH = Math.max(32, P.largura * 0.05);
  const margemV = Math.max(32, P.altura * 0.05);
  let h = "esquerda";
  if (esq <= margemH && dir <= margemH && el.largura >= P.largura * 0.6) h = "ambos";
  else if (Math.abs(esq - dir) <= Math.max(4, P.largura * 0.01)) h = "centro";
  else if (dir < esq && dir <= Math.max(24, P.largura * 0.05)) h = "direita";
  let v = "topo";
  if (topo <= margemV && base <= margemV && el.altura >= P.altura * 0.6) v = "ambos";
  else if (base < topo && base <= margemV) v = "base";
  else if (Math.abs(topo - base) <= Math.max(4, P.altura * 0.01) && el.altura < P.altura * 0.9) v = "centro";
  return { h, v };
}

/** Restrições efetivas de um elemento dentro do pai P. */
function restricoes(el, P) {
  const r = el.restricoes ?? {};
  const a = r.h && r.h !== "auto" && r.v && r.v !== "auto" ? null : restricaoAuto(el, P);
  return { h: r.h && r.h !== "auto" ? r.h : a.h, v: r.v && r.v !== "auto" ? r.v : a.v };
}

/** CSS de posição de um elemento ancorado ao pai (posição absoluta). */
function posicaoAbsoluta(el, P, r) {
  const bw = P.borda ?? 0;
  const pw = P.largura - 2 * bw;
  const ph = P.altura - 2 * bw;
  const x = el.x - P.x - bw;
  const y = el.y - P.y - bw;
  const d = pw - x - el.largura;
  const b = ph - y - el.altura;
  // nunca sai da tela: posição presa entre 0 e "100% − largura", e largura no máximo 100%
  const w = px(el.largura);
  const larg = el._abracar ? "width:auto;max-width:100%;" : `width:min(${w}, 100%);`;
  const alt = el._abracar ? "height:auto;" : null;
  const H = {
    esquerda: `left:max(0px, min(${px(x)}, calc(100% - ${w})));right:auto;${larg}`,
    direita: `left:auto;right:max(0px, min(${px(d)}, calc(100% - ${w})));${larg}`,
    ambos: `left:${px(x)};right:${px(d)};width:auto;`,
    centro: `left:clamp(0px, calc(50% + ${px(x - pw / 2)}), calc(100% - ${w}));right:auto;${larg}`,
    escala: `left:${pct(x, pw)};right:auto;width:${pct(el.largura, pw)};`,
  }[r.h];
  const V = {
    topo: `top:${px(y)};bottom:auto;${alt ?? `height:${px(el.altura)};`}`,
    base: `top:auto;bottom:${px(b)};${alt ?? `height:${px(el.altura)};`}`,
    ambos: `top:${px(y)};bottom:${px(b)};height:auto;`,
    centro: `top:calc(50% + ${px(y - ph / 2)});bottom:auto;${alt ?? `height:${px(el.altura)};`}`,
    escala: `top:${pct(y, ph)};bottom:auto;height:${pct(el.altura, ph)};`,
  }[r.v];
  return (H ?? "") + (V ?? "");
}

/** CSS de um filho dentro de um container em linha/coluna (flexbox). */
function posicaoFlex(el, pai) {
  const linha = pai.layout.modo === "linha";
  const [P, C] = linha ? ["largura", "altura"] : ["altura", "largura"];
  const cssP = linha ? "width" : "height";
  const cssC = linha ? "height" : "width";
  const dim = k => el.dimensao?.[k] ?? "fixa";
  let s = "position:relative;left:auto;top:auto;right:auto;bottom:auto;flex:0 0 auto;";
  if (dim(P) === "preencher") s += `flex:1 1 0;min-${cssP}:0;${cssP}:auto;`;
  else if (dim(P) === "abracar" || el._abracar) s += `${cssP}:auto;`;
  else s += `${cssP}:${px(el[P])};`;
  if (dim(C) === "preencher" || pai.layout.alinhar === "esticar") s += `align-self:stretch;${cssC}:auto;`;
  else if (dim(C) === "abracar" || el._abracar) s += `${cssC}:auto;`;
  else s += `${cssC}:${px(el[C])};`;
  return s;
}

/** CSS próprio de um container em linha/coluna. */
function cssFlex(el) {
  const l = el.layout;
  const bw = Number(el.estilo?.larguraBorda) || 0;
  const pad = Math.max(0, Number(l.margem ?? 12) - bw);
  return `display:flex;flex-direction:${l.modo === "linha" ? "row" : "column"};gap:${px(Number(l.espaco ?? 8))};padding:${px(pad)};` +
    `align-items:${ALINHAR[l.alinhar] ?? "flex-start"};justify-content:${JUSTIFICAR[l.justificar] ?? "flex-start"};flex-wrap:${l.quebrar ? "wrap" : "nowrap"};`;
}

/** Regras que dependem da largura da tela (container queries da arte). */
function cssLargura(el, sel) {
  const out = [];
  const abaixo = Number(el.responsivo?.ocultarAbaixo) || 0;
  const so = Number(el.responsivo?.mostrarAbaixo) || 0;
  if (abaixo) out.push(`@container hf (max-width:${abaixo - 0.02}px){${sel}{display:none!important}}`);
  if (so) out.push(`@container hf (min-width:${so}px){${sel}{display:none!important}}`);
  const emp = Number(el.layout?.empilharAbaixo) || 0;
  if (auto(el) && emp && el.layout.modo === "linha") {
    out.push(`@container hf (max-width:${emp - 0.02}px){${sel}{flex-direction:column;align-items:stretch;height:auto}${sel}>.hf-el{width:auto;flex:0 0 auto}}`);
  }
  return out;
}

/**
 * Compila o documento. modo: "pagina" (arquivo exportado) ou "previa" (dentro do editor).
 * Devolve { html, css, elementos, responsivo }.
 */
function compilar(doc, { escopo = ".hf-arte", modo = "pagina" } = {}) {
  const tela = doc.elementos.__canvas ?? { largura: 1280, altura: 800, fundo: "#ffffff" };
  const responsivo = tela.responsivo !== false;
  const els = controlesDaLista(listar(doc));
  const porId = Object.fromEntries(els.map(e => [e.id, e]));
  const filhos = {};
  for (const e of els) if (e.pai && porId[e.pai]) (filhos[e.pai] ??= []).push(e);
  const caixaTela = { x: 0, y: 0, largura: tela.largura, altura: tela.altura, borda: 0 };

  const regras = [];
  for (const el of els) {
    const pai = el.pai ? porId[el.pai] : null;
    const sel = `${escopo} #${el.id}`;
    // container que abraça o conteúdo encolhe junto (largura/altura automáticas)
    if (auto(el) && el.layout.abracar !== false) el._abracar = true;
    regras.push(css(el, escopo));
    let pos;
    if (auto(pai)) pos = posicaoFlex(el, pai);
    else {
      const P = pai ? { x: pai.x, y: pai.y, largura: pai.largura, altura: pai.altura, borda: Number(pai.estilo?.larguraBorda) || 0 } : caixaTela;
      const r = responsivo ? restricoes(el, P) : { h: "esquerda", v: "topo" };
      pos = posicaoAbsoluta(el, P, r);
    }
    regras.push(`${sel}{${pos}${auto(el) ? cssFlex(el) : ""}}`);
    if (responsivo) regras.push(...cssLargura(el, sel));
    delete el._abracar;
  }

  const montar = el => {
    const m = marcacaoCompleta(el,{executarHTML:true});
    const kids = (filhos[el.id] ?? []).map(montar).join("");
    return kids ? m.replace(/<\/div>$/, `${kids}</div>`) : m;
  };
  const html = els.filter(e => !e.pai || !porId[e.pai]).map(montar).join("\n");

  const arte = responsivo
    ? `${escopo}{position:relative;overflow:hidden;width:100%;height:${tela.altura}px;${modo === "pagina" ? "min-height:100vh;" : "min-height:100%;"}background:${tela.fundo};container:hf/inline-size}`
    : `${escopo}{position:relative;overflow:hidden;width:${tela.largura}px;height:${tela.altura}px;background:${tela.fundo};container:hf/inline-size}`;
  return { html, css: [arte, cssBase(escopo), ...regras].join("\n"), elementos: els, responsivo };
}

/** Documento completo: HTML + CSS + script de comportamento e sinais. */
function gerarHTML(doc, { titulo, depurar = false } = {}) {
  const script = scriptParaRuntime(doc.elementos.__script);
  const tela = doc.elementos.__canvas ?? { largura: 1280, altura: 800, fundo: "#ffffff" };
  const c = compilar(doc, { escopo: ".hf-arte", modo: "pagina" });
  const nome = titulo ?? tela.nome ?? "Interface";
  const link = linkGoogleFonts(c.elementos.map(e => e.estilo?.fonte));
  const corpo = c.responsivo
    ? `body{margin:0;background:${tela.fundo};font-family:system-ui,-apple-system,"Segoe UI",sans-serif}`
    : `body{margin:0;min-height:100vh;display:grid;place-items:center;background:#e5e7eb;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}`;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(nome)}</title>
${link ? `<link rel="stylesheet" href="${link}">\n` : ""}<style>
${corpo}
${c.css}
${tela.complemento?.css ?? ""}
</style>
</head>
<body>
<main class="hf-arte">
${c.html}
</main>
<script>
// Sinais: escute com document.addEventListener("hefestus:sinal", e => console.log(e.detail))
const motorMenus = ${motorMenus.toString()};
(${ligarRuntime.toString()})(document.querySelector(".hf-arte"), ${JSON.stringify(dadosRuntime(c.elementos, alvosDoScript(doc.elementos.__script))).replace(/</g, "\\u003c")});
${script ? `(${executarScript.toString()})(document.querySelector(".hf-arte"), ${JSON.stringify(script).replace(/</g, "\\u003c")}, ${depurar ? "{ depurar: true }" : "{}"});` : ""}
(${executarCodigoGrupos.toString()})(${JSON.stringify(codigoDosGrupos(c.elementos)).replace(/</g, "\\u003c")});
<\/script>${tela.complemento?.js ? `
<script>
window.RADIOS_EMBUTIDAS=${JSON.stringify(tela.complemento.emissoras ?? []).replace(/</g, "\\u003c")};
${tela.complemento.js.replace(/<\/script/gi, "<\\/script")}
<\/script>` : ""}
</body>
</html>
`;
}
export { restricaoAuto, restricoes, compilar, gerarHTML };
