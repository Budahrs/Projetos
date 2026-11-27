// Marcação e estilo de cada elemento (a peça básica do compilador).
// O Designer usa estas peças "planas" (posições absolutas na tela de design);
// compilador.js monta a árvore responsiva para a Prévia e o HTML exportado;
// runtime.js dá vida aos eventos e comportamentos.

import { SOMBRAS } from "./catalogo.js";
import { documentoHTMLImportado } from './importarHTML.js';
import { aplicarControles } from "./controlador.js";
import { caminhoIcone, ehPreenchido, ehUsuario, uriIconeUsuario, ehWindows, uriWindows, estiloMascara, corDoIcone, miolloColorido } from "../ui/icones.js";
import { FORMAS } from "./formas.js";
import { FONTES, linkGoogleFonts } from "./fontes.js";
import { temAvancado, fundoCSS, tracosBox, cantosCSS, efeitosCSS, misturaCSS, caminhoDaForma, corSegura, dashDe } from "./estiloAvancado.js";
export { FONTES };

const SOMBRAS_FORMA = {
  nenhuma: "", pequena: "drop-shadow(0 1px 1px rgba(0,0,0,.18))",
  media: "drop-shadow(0 4px 6px rgba(0,0,0,.2))", grande: "drop-shadow(0 10px 14px rgba(0,0,0,.28))",
};


export const esc = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Elementos do documento (sem os internos __canvas), ordenados por camada. */
/**
 * Elementos do documento (sem os internos __), na ordem de desenho: por camada (z),
 * e cada container logo antes dos seus filhos, que ficam sempre por cima dele.
 * `zr` é a ordem efetiva usada como z-index.
 */
export const listar = doc => {
  const todos = Object.entries(doc.elementos)
    .filter(([id]) => !id.startsWith("__"))
    .map(([id, el]) => ({ id, ...el }))
    .sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  const ids = new Set(todos.map(e => e.id));
  const filhos = {};
  for (const e of todos) if (e.pai && ids.has(e.pai)) (filhos[e.pai] ??= []).push(e);
  const out = [];
  const vistos = new Set();
  const visitar = e => {
    if (vistos.has(e.id)) return;
    vistos.add(e.id);
    out.push(e);
    for (const f of filhos[e.id] ?? []) visitar(f);
  };
  for (const e of todos) if (!e.pai || !ids.has(e.pai)) visitar(e);
  for (const e of todos) visitar(e); // segurança contra ciclos
  out.forEach((e, i) => { e.zr = i + 1; });
  return out;
};

/** "&Arquivo" → A sublinhado (tecla de acesso Alt+A); "&&" vira um "&" literal. */
export function teclaDoRotulo(s) {
  const m = /&([^&\s])/.exec(String(s ?? "").replace(/&&/g, "\u0001"));
  return m ? m[1].toLowerCase() : "";
}
export function comTecla(s) {
  const t = String(s ?? "").replace(/&&/g, "\u0001");
  const m = /&([^&\s])/.exec(t);
  const lit = x => esc(x).replace(/\u0001/g, "&amp;");
  if (!m) return lit(t);
  return lit(t.slice(0, m.index)) + "<u>" + lit(m[1]) + "</u>" + lit(t.slice(m.index + 2).replace(/&(?=[^&\s])/g, ""));
}
const aria = el => {
  const a = el.acessibilidade ?? {};
  const k = a.tecla || teclaDoRotulo(el.rotulo ?? el.texto);
  return `${a.role ? ` role="${esc(a.role)}"` : ""}${a.ariaLabel ? ` aria-label="${esc(a.ariaLabel)}"` : ""}${a.atalho ? ` aria-keyshortcuts="${esc(String(a.atalho).replace(/ctrl/i, "Control"))}"` : k ? ` aria-keyshortcuts="Alt+${esc(k.toUpperCase())}"` : ""}${a.indisponivel ? ` aria-disabled="true" data-indisp="1" title="${esc(a.motivo || "Indisponível")}"` : ""}${a.perfis ? ` data-perfis="${esc(a.perfis)}"` : ""}`;
};

/** Marcação HTML de um elemento. */
export function marcacao(el) {
  const id = esc(el.id);
  const c = `hf-el hf-${el.tipo}`;
  switch (el.tipo) {
    case "botao":
      return `<button id="${id}" class="${c}" type="button"${el.desabilitado ? " disabled" : ""}${aria(el)}>${comTecla(el.rotulo)}</button>`;
    case "texto":
      return `<div id="${id}" class="${c}"${aria(el)}>${comTecla(el.texto)}</div>`;
    case "caixa":
    case "container":
      return `<div id="${id}" class="${c}"${el.painelDock ? ` data-hf-dock="${esc(el.painelDock)}"` : ""}${aria(el)}></div>`;
    case "campo":
      return `<input id="${id}" class="${c}" type="${["text","number","password","email"].includes(el.tipoCampo)?el.tipoCampo:"text"}" value="${esc(el.valor??'')}" placeholder="${esc(el.placeholder)}"${aria(el)}>`;
    case "toggle":
      return `<button id="${id}" class="${c}" type="button" role="switch" aria-checked="${el.ligado ? "true" : "false"}"${el.acessibilidade?.ariaLabel ? ` aria-label="${esc(el.acessibilidade.ariaLabel)}"` : ""}><span class="hf-bolinha"></span></button>`;
    case "menu":
      return `<ul id="${id}" class="${c}"${aria(el)}>${(el.itens ?? []).map(i => `<li role="menuitem" tabindex="0">${comTecla(i)}</li>`).join("")}</ul>`;
    case "modal":
      return `<div id="${id}" class="${c}"${aria(el)}><div class="hf-modal-titulo">${esc(el.titulo)}</div><div class="hf-modal-msg">${esc(el.mensagem)}</div><div class="hf-modal-acoes"><button type="button" data-fechar="${id}">Fechar</button></div></div>`;
    case "toast":
      return `<div id="${id}" class="${c}"${aria(el)}>${esc(el.mensagem)}</div>`;
    case "forma": {
      const f = caminhoDaForma(el, FORMAS);
      const s = el.estilo ?? {};
      const av = temAvancado(s);
      const eo = f.evenodd ? ' fill-rule="evenodd"' : "";
      const texto = el.texto ? `<span class="hf-forma-texto">${comTecla(el.texto)}</span>` : "";
      if (!av) return `<div id="${id}" class="${c}"${aria(el)}><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${f.d}" vector-effect="non-scaling-stroke"${eo}/></svg>${texto}</div>`;
      // estilo avançado: preenchimentos em camadas (CSS recortado pela forma), sombra interna e traços em SVG
      const ef = efeitosCSS(s.efeitos);
      const L = Math.max(1, Number(el.largura) || 100), A = Math.max(1, Number(el.altura) || 100);
      const temFill = (s.preenchimentos ?? []).some(x => x && x.visivel !== false);
      const defs = [];
      const shapes = [];
      ef.internas.forEach((e, i) => {
        const fid = `${id}_in${i}`;
        defs.push(`<filter id="${fid}" x="-20%" y="-20%" width="140%" height="140%"><feComponentTransfer in="SourceAlpha"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer><feGaussianBlur stdDeviation="${+(e.b / 2 * 100 / Math.sqrt(L * A)).toFixed(3)}"/><feOffset dx="${+(e.x * 100 / L).toFixed(3)}" dy="${+(e.y * 100 / A).toFixed(3)}" result="o"/><feFlood flood-color="${esc(e.cor)}"/><feComposite in2="o" operator="in"/><feComposite in2="SourceAlpha" operator="in"/></filter>`);
        shapes.push(`<path d="${f.d}" fill="#000" stroke="none"${eo} filter="url(#${fid})"/>`);
      });
      (s.tracos ?? []).forEach((t, i) => {
        if (!t || t.visivel === false || !(Number(t.largura) > 0)) return;
        const w = Math.min(200, Number(t.largura));
        const dash = dashDe(t);
        const dashAttr = dash ? ` stroke-dasharray="${dash.split(/\s+/).map(n => (Number(n) || 1) * (t.estilo === "pontilhado" ? w : Math.max(1, w / 2))).join(" ")}"` : "";
        const cap = { redonda: "round", quadrada: "square" }[t.ponta] ?? "butt";
        const join = { redonda: "round", chanfrada: "bevel" }[t.juncao] ?? "miter";
        let extra = "", ww = w;
        if (t.posicao === "dentro") { defs.push(`<clipPath id="${id}_c${i}"><path d="${f.d}"${eo}/></clipPath>`); extra = ` clip-path="url(#${id}_c${i})"`; ww = w * 2; }
        else if (t.posicao === "fora") { defs.push(`<mask id="${id}_m${i}" maskUnits="userSpaceOnUse" x="-200" y="-200" width="500" height="500"><rect x="-200" y="-200" width="500" height="500" fill="#fff"/><path d="${f.d}" fill="#000"${eo}/></mask>`); extra = ` mask="url(#${id}_m${i})"`; ww = w * 2; }
        shapes.push(`<path d="${f.d}" fill="none" stroke="${esc(corSegura(t.cor, "#000"))}" stroke-width="${ww}" stroke-linecap="${cap}" stroke-linejoin="${join}"${dashAttr} vector-effect="non-scaling-stroke"${extra}/>`);
      });
      const fundo = temFill ? `<div class="hf-forma-fill"></div>` : "";
      const base = !temFill && !(s.tracos ?? []).length ? `<path d="${f.d}" vector-effect="non-scaling-stroke"${eo}/>` : "";
      return `<div id="${id}" class="${c}"${aria(el)}>${fundo}<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${defs.length ? `<defs>${defs.join("")}</defs>` : ""}${base}${shapes.join("")}</svg>${texto}</div>`;
    }
    case "elipse":
    case "linha":
      return `<div id="${id}" class="${c}"${aria(el)}></div>`;
    case "icone": {
      if (ehWindows(el.simbolo)) return `<div id="${id}" class="${c}"${aria(el)}><img alt="" src="${uriWindows(el.simbolo)}" style="display:block;width:100%;height:100%;object-fit:contain;image-rendering:pixelated"></div>`;
      const uri = ehUsuario(el.simbolo) ? uriIconeUsuario(el.simbolo) : null;
      if (uri) return `<div id="${id}" class="${c}"${aria(el)}><span style="display:block;width:100%;height:100%;${estiloMascara(uri)}"></span></div>`;
      if (el.estiloIcone === "colorido") return `<div id="${id}" class="${c}"${aria(el)}><svg viewBox="0 0 24 24" aria-hidden="true">${miolloColorido(el.simbolo, corDoIcone(el.simbolo, el.corIcone))}</svg></div>`;
      if (ehPreenchido(el.simbolo)) return `<div id="${id}" class="${c}"${aria(el)}><svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="${esc(caminhoIcone(el.simbolo))}"/></svg></div>`;
      return `<div id="${id}" class="${c}"${aria(el)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${Number(el.traco) || 1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${esc(caminhoIcone(el.simbolo))}"/></svg></div>`;
    }
    default:
      return `<div id="${id}" class="hf-el"></div>`;
  }
}

/** Regras CSS de um elemento, com um seletor de escopo opcional. */
export function css(el, escopo = "") {
  el = aplicarControles(el);
  const s = el.estilo ?? {};
  const t = el.transicao ?? {};
  const sel = `${escopo} #${el.id}`.trim();
  const dur = `${t.duracao ?? 150}ms ${t.easing ?? "ease-out"}`;
  const transformar = [
    el.rotacao ? `rotate(${Number(el.rotacao)}deg)` : "",
    el.espelharH ? "scaleX(-1)" : "",
    el.espelharV ? "scaleY(-1)" : "",
  ].filter(Boolean).join(" ");
  const alinhar = { esquerda: ["left", "flex-start"], centro: ["center", "center"], direita: ["right", "flex-end"] }[s.alinhamento];
  const av = temAvancado(s);
  const ef = av ? efeitosCSS(s.efeitos) : null;
  const tr = av && (s.tracos ?? []).length ? tracosBox(s.tracos) : null;
  const raio = el.tipo === "elipse" ? "50%" : av ? cantosCSS(s.cantos, s.raio) : `${s.raio ?? 0}px`;
  const fundoBase = av && (s.preenchimentos ?? []).length ? fundoCSS(s.preenchimentos, s.fundo) : s.fundo;
  const bordaBase = tr ? (tr.border || "0") : `${s.larguraBorda ?? 0}px solid ${s.borda}`;
  const sombraPreset = SOMBRAS[s.sombra] ?? "none";
  const sombraBase = av ? ([...(tr ? tr.sombras : []), ...ef.sombras, ...(!ef.sombras.length && sombraPreset !== "none" ? [sombraPreset] : [])].join(",") || "none") : sombraPreset;
  const regras = [
    `${sel}{left:${el.x}px;top:${el.y}px;width:${el.largura}px;height:${el.altura}px;z-index:${el.zr ?? el.z ?? 0};` +
      `background:${fundoBase};color:${s.cor};border:${bordaBase};border-radius:${raio};` +
      `font-size:${s.tamanhoFonte}px;font-weight:${s.peso};box-shadow:${sombraBase};opacity:${s.opacidade ?? 1};` +
      (misturaCSS(s.mistura) ? `mix-blend-mode:${misturaCSS(s.mistura)};` : "") +
      (s.fonte && s.fonte !== "sistema" && FONTES[s.fonte] ? `font-family:${FONTES[s.fonte]};` : "") +
      (s.entrelinha && s.entrelinha !== 1.3 ? `line-height:${s.entrelinha};` : "") +
      (alinhar ? `text-align:${alinhar[0]};justify-content:${alinhar[1]};` : "") +
      (transformar ? `transform:${transformar};` : "") +
      (s.desfoque || (ef && ef.filtro) ? `filter:${[s.desfoque ? `blur(${s.desfoque}px)` : "", ef ? ef.filtro : ""].filter(Boolean).join(" ")};` : "") +
      (s.vidro || (ef && ef.vidro) ? `backdrop-filter:${[s.vidro ? `blur(${s.vidro}px)` : "", ef ? ef.vidro : ""].filter(Boolean).join(" ")};-webkit-backdrop-filter:${[s.vidro ? `blur(${s.vidro}px)` : "", ef ? ef.vidro : ""].filter(Boolean).join(" ")};` : "") +
      `transition:background-color ${dur},color ${dur},transform ${dur},box-shadow ${dur},translate ${dur},scale ${dur},filter ${dur};${el.visivel === false ? "display:none;" : ""}}`,
  ];
  if (el.mascara && typeof el.mascara.d === "string" && /^[MLCZmlcz\d\s.,-]+$/.test(el.mascara.d)) {
    const msvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${el.mascara.d}' fill='black'${el.mascara.evenodd ? " fill-rule='evenodd'" : ""}/></svg>`;
    const mv = `url("data:image/svg+xml,${encodeURIComponent(msvg)}") 0 0/100% 100% no-repeat`;
    regras.push(`${sel}{-webkit-mask:${mv};mask:${mv}}`);
  }
  if (el.tipo === "forma") {
    // a cor vai no desenho, não na caixa: preenchimento, contorno e sombra seguem a forma
    regras[0] = regras[0]
      .replace(`background:${fundoBase};`, "background:transparent;")
      .replace(`border:${bordaBase};`, "border:0;")
      .replace(`box-shadow:${sombraBase};`, "box-shadow:none;");
    const sombra = av && ef.dropShadows.length ? ef.dropShadows.join(" ") : (SOMBRAS_FORMA[s.sombra] ?? "");
    const filtros = [sombra, s.desfoque ? `blur(${s.desfoque}px)` : "", ef ? ef.filtro : ""].filter(Boolean).join(" ");
    regras[0] = regras[0].replace(/filter:[^;]*;/, "");
    if (filtros) regras.push(`${sel}{filter:${filtros}}`);
    if (av) {
      const fm = caminhoDaForma(el, FORMAS);
      const maskSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${fm.d}' fill='black'${fm.evenodd ? " fill-rule='evenodd'" : ""}/></svg>`;
      const mascara = `url("data:image/svg+xml,${encodeURIComponent(maskSvg)}") 0 0/100% 100% no-repeat`;
      regras.push(`${sel} .hf-forma-fill{position:absolute;inset:0;background:${fundoCSS(s.preenchimentos, "transparent")};-webkit-mask:${mascara};mask:${mascara}}`);
      regras.push(`${sel} path{transition:fill ${dur}}`);
      if (!(s.preenchimentos ?? []).some(x => x && x.visivel !== false) && !(s.tracos ?? []).length) regras.push(`${sel} path{fill:${s.fundo};stroke:${s.larguraBorda ? s.borda : "none"};stroke-width:${s.larguraBorda ?? 0}px}`);
    } else
    regras.push(`${sel} path{fill:${s.fundo};stroke:${s.larguraBorda ? s.borda : "none"};stroke-width:${s.larguraBorda ?? 0}px;transition:fill ${dur}}`);
    if (el.estados?.hover?.fundo) regras.push(`${sel}:hover path{fill:${el.estados.hover.fundo}}`);
    if (el.estados?.active?.fundo) regras.push(`${sel}:active path{fill:${el.estados.active.fundo}}`);
    return regras.join("\n");
  }
  const hover = el.estados?.hover?.fundo;
  const active = el.estados?.active?.fundo;
  const ativo = el.estados?.ativo ?? {};
  // foco por teclado e desabilitado/indisponível (valem para todos os tipos com caixa)
  const foco = el.estados?.focus ?? {}, desab = el.estados?.disabled ?? {};
  const fcor = corSegura(foco.contorno, ""), ffundo = corSegura(foco.fundo, "");
  if (fcor || ffundo) regras.push(`${sel}:focus-visible${el.tipo === "menu" ? `,${sel} li:focus-visible` : ""}{${fcor ? `outline:2px solid ${fcor};outline-offset:2px;` : ""}${ffundo ? `background:${ffundo};` : ""}}`);
  const dfundo = corSegura(desab.fundo, ""), dcor = corSegura(desab.cor, "");
  const dop = typeof desab.opacidade === "number" && desab.opacidade !== 0.5 ? Math.max(0, Math.min(1, desab.opacidade)) : null;
  if (dfundo || dcor || dop !== null) regras.push(`${sel}:disabled,${sel}[aria-disabled="true"],${sel}[data-indisp]{${dfundo ? `background:${dfundo};` : ""}${dcor ? `color:${dcor};` : ""}${dop !== null ? `opacity:${dop};` : ""}}`);
  const sub = corSegura(ativo.sublinha, "");
  if (ativo.fundo || ativo.cor || sub) regras.push(`${sel}.hf-ativo{${ativo.fundo ? `background:${ativo.fundo};` : ""}${ativo.cor ? `color:${ativo.cor};` : ""}${sub ? `box-shadow:inset 0 -3px 0 ${sub};` : ""}}`);
  // estado ativo desde o início (abas, itens de barra…): o visual ativo vale até outro irmão assumir (classe hf-inativo)
  if (el.ativoInicial && (ativo.fundo || ativo.cor || sub)) {
    regras.push(`${sel}{${ativo.fundo ? `background:${ativo.fundo};` : ""}${ativo.cor ? `color:${ativo.cor};` : ""}${sub ? `box-shadow:inset 0 -3px 0 ${sub};` : ""}}`);
    regras.push(`${sel}.hf-inativo{background:${s.fundo};color:${s.cor};box-shadow:none;}`);
  }
  if (el.tipo === "menu") {
    if (hover) regras.push(`${sel} li:hover,${sel} li:focus{background:${hover}}`);
  } else if (el.tipo === "toggle") {
    regras.push(`${sel}[aria-checked="true"]{background:${active || "#2563eb"}}`);
  } else {
    // item ativo mantém o visual ativo mesmo com o mouse em cima
    const sufHover = ativo.fundo ? (el.ativoInicial ? ".hf-inativo" : "") : "";
    const semAtivo = ativo.fundo && !el.ativoInicial ? ":not(.hf-ativo)" : "";
    if (hover) regras.push(`${sel}${sufHover}:hover:not(:disabled)${semAtivo}{background:${hover}}`);
    if (active) regras.push(`${sel}:active:not(:disabled){background:${active}}`);
  }
  const an = el.animacao;
  if (an && el.tipo !== "menu") {
    const h = { brilho: "filter:brightness(1.16);", elevar: "translate:0 -2px;filter:drop-shadow(0 5px 6px rgba(0,0,0,.35));", escala: "scale:1.06;", balanco: "animation:hf-balanco .45s ease-in-out;" }[an.hover];
    const pode = `${sel}:not(:disabled):not([aria-disabled="true"])`;
    const bloco = [];
    if (h) bloco.push(`${pode}:hover{${h}}`);
    if (an.clique === "afundar") bloco.push(`${pode}:active{scale:.94;filter:brightness(.92);transition-duration:60ms}`);
    if (an.clique === "pulso") bloco.push(`${sel}.hf-pulsa{animation:hf-pulso .38s ease-out}`);
    if (an.clique === "ondulacao") bloco.push(`${sel}{overflow:hidden}`);
    if (bloco.length) regras.push(`@media (prefers-reduced-motion:no-preference){${bloco.join("")}}`);
  }
  return regras.join("\n");
}

/** CSS-base dos tipos, igual no editor e no exportado. */
export function cssBase(escopo = "") {
  const e = escopo ? `${escopo} ` : "";
  return `
${e}.hf-el{position:absolute;box-sizing:border-box;margin:0;font-family:inherit;line-height:1.3}
${e}.hf-el[hidden],${e}.hf-overlay[hidden]{display:none!important}
${e}.hf-botao{cursor:pointer;padding:0 16px;display:flex;align-items:center;justify-content:center;white-space:nowrap;overflow:hidden}
${e}.hf-botao:disabled{opacity:.5;cursor:not-allowed}
${e}[data-indisp]{opacity:.5;cursor:not-allowed}
${e}[data-indisp] *{pointer-events:none}
${e}[data-perfis][hidden]{display:none!important}
${e} u{text-decoration:underline;text-underline-offset:2px}
${e}.hf-botao:focus-visible,${e}.hf-toggle:focus-visible,${e}.hf-campo:focus-visible{outline:2px solid #93c5fd;outline-offset:2px}
${e}.hf-texto{white-space:pre-wrap;overflow:hidden;padding:2px 0}
${e}.hf-campo{padding:0 12px}
${e}.hf-toggle{cursor:pointer;padding:0}
${e}.hf-bolinha{position:absolute;top:3px;left:3px;width:calc(var(--h,28px) - 6px);aspect-ratio:1;border-radius:50%;background:currentColor;transition:transform .15s ease-out}
${e}.hf-toggle[aria-checked="true"] .hf-bolinha{transform:translateX(calc(var(--w,52px) - var(--h,28px)))}
${e}.hf-menu{list-style:none;padding:6px;overflow:auto}
${e}.hf-menu li{padding:8px 12px;border-radius:4px;cursor:pointer;outline:none}
${e}.hf-modal{padding:20px;display:flex;flex-direction:column;gap:10px}
${e}.hf-modal-titulo{font-size:1.15em;font-weight:600}
${e}.hf-modal-msg{flex:1;opacity:.85}
${e}.hf-modal-acoes{display:flex;justify-content:flex-end}
${e}.hf-modal-acoes button{font:inherit;padding:6px 14px;border-radius:6px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer}
${e}.hf-toast{display:flex;align-items:center;padding:0 16px}
${e}.hf-overlay{position:absolute;inset:0;background:rgba(15,23,42,.45)}
${e}.hf-icone{display:grid;place-items:center}
${e}.hf-forma svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
${e}.hf-forma-fill{pointer-events:none}
${e}.hf-forma-texto{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:6px 10px;white-space:pre-wrap;overflow:hidden}
${e}.hf-icone svg{width:100%;height:100%}
${e}.hf-destaque{animation:hf-pulso .6s ease-out}
${e}[role="menuitem"]{cursor:pointer}
${e}[data-hf-ev],.hf-botao,.hf-toggle,[role="button"],[role="tab"]{user-select:none;-webkit-user-select:none}
${e}[role="menuitem"]:focus-visible{outline:2px solid #93c5fd;outline-offset:-2px}
${e}.hf-entra-aparecer{animation:hf-aparecer var(--hf-dur,160ms) ease-out}
${e}.hf-sai-aparecer{animation:hf-aparecer var(--hf-dur,160ms) ease-in reverse forwards}
${e}.hf-entra-deslizar{animation:hf-deslizar var(--hf-dur,160ms) ease-out}
${e}.hf-sai-deslizar{animation:hf-deslizar var(--hf-dur,160ms) ease-in reverse forwards}
${e}.hf-entra-crescer{animation:hf-crescer var(--hf-dur,160ms) cubic-bezier(.2,1.2,.4,1);transform-origin:top center}
${e}.hf-sai-crescer{animation:hf-crescer var(--hf-dur,160ms) ease-in reverse forwards;transform-origin:top center}
${e}.hf-onda{position:absolute;border-radius:50%;pointer-events:none;background:currentColor;opacity:.32;transform:scale(0);animation:hf-onda .6s ease-out forwards}
@keyframes hf-onda{to{transform:scale(1);opacity:0}}
@keyframes hf-pulso{0%{scale:1}35%{scale:.9}70%{scale:1.06}100%{scale:1}}
@keyframes hf-balanco{0%,100%{rotate:0deg}25%{rotate:-3deg}75%{rotate:3deg}}
${e}.hf-entra-lateral{animation:hf-lateral var(--hf-dur,200ms) ease-out}
${e}.hf-sai-lateral{animation:hf-lateral var(--hf-dur,200ms) ease-in reverse forwards}
@keyframes hf-aparecer{from{opacity:0}}
@keyframes hf-deslizar{from{opacity:0;translate:0 -8px}}
@keyframes hf-crescer{from{opacity:0;scale:.94}}
@keyframes hf-lateral{from{opacity:0;translate:-32px 0}}
@media (prefers-reduced-motion:reduce){${e}[class*="hf-entra-"],${e}[class*="hf-sai-"]{animation:none!important}}
@keyframes hf-pulso{0%{box-shadow:0 0 0 0 rgba(37,99,235,.7)}100%{box-shadow:0 0 0 14px rgba(37,99,235,0)}}
`;
}

/** Variáveis usadas pelo toggle para posicionar a bolinha. */
const varsToggle = el => (el.tipo === "toggle" ? ` style="--w:${el.largura}px;--h:${el.altura}px"` : "");

/** Insere as variáveis do toggle na marcação. */
export const marcacaoCompleta = (el,opcoes={}) => {
  let m = marcacao(el);
  if(el.codigo?.isolado&&!el.codigo.suspenso){
    const executar=opcoes.executarHTML===true,src=documentoHTMLImportado(el.codigo,{executar});
    const quadro=`<iframe class="hf-html-importado" title="${esc(el.nome||'Artefato HTML')}" sandbox="${executar?'allow-scripts':''}" referrerpolicy="no-referrer" tabindex="${executar?'0':'-1'}" style="display:block;width:100%;height:100%;border:0;background:transparent;color-scheme:normal;${executar?'':'pointer-events:none;'}" srcdoc="${esc(src)}"></iframe>`;
    m=m.replace(/<\/div>$/,quadro+'</div>');
  }
  const v = varsToggle(el);
  return v ? m.replace(/^<(\w+) /, `<$1${v} `) : m;
};
