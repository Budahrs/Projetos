// Motor de PDF embutido nos programas do Hefestus (documento.tipo = "pdf").
//  - visualizador próprio (pdf.js): páginas, zoom, página atual, texto selecionável, seleção de área, impressão;
//  - edições em memória (pdf-lib): girar, mover, duplicar, excluir, numerar, marca-d'água, recortar, imagens,
//    comentários, realce, formulários, assinatura desenhada, dividir, intercalar, censurar, exportar imagens…
// Cada operação recebe o contexto do executor (programa-ligacoes.js) e devolve
// { bytes } (nova versão do documento, entra no desfazer) e/ou { mensagem, texto, irPara }.
// Bibliotecas: pdf.js (Apache-2.0, versão "legacy": funciona em WebView2 mais antigos) e pdf-lib (MIT),
// na pasta hefestus/ do programa.

import * as pdfjs from "./pdf.min.js";
import {
  PDFDocument, degrees, rgb, StandardFonts, BlendMode, PDFName, PDFHexString, PDFString,
  PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFOptionList,
  pushGraphicsState, popGraphicsState, setFillingRgbColor, setStrokingRgbColor, setLineWidth,
  rectangle, fillAndStroke, moveTo, lineTo, stroke,
} from "./pdf-lib.esm.min.js";

const BASE = new URL("./", import.meta.url).href;
pdfjs.GlobalWorkerOptions.workerSrc = BASE + "pdf.worker.min.js";
/** Dados do pdf.js (cmaps, fontes padrão, wasm) vêm de um arquivo só: dados-pdf.pack (ferramentas/vendor/empacotar-pdf.mjs). */
let pacote = null;
function lerPacote() {
  pacote ??= fetch(BASE + "dados-pdf.pack").then(r => { if (!r.ok) throw new Error("dados-pdf.pack não encontrado"); return r.arrayBuffer(); }).then(buf => {
    const tam = new DataView(buf).getUint32(0, true);
    const indice = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, tam)));
    return nome => { const e = indice[nome]; return e ? new Uint8Array(buf, 4 + tam + e[0], e[1]).slice() : null; };
  });
  return pacote;
}
class DadosDoPacote {
  constructor() { /* o pdf.js passa as URLs; os dados vêm do pacote */ }
  async fetch({ kind, filename }) {
    const pasta = { cMapUrl: "cmaps/", standardFontDataUrl: "fonts/", wasmUrl: "wasm/" }[kind];
    const dados = pasta && (await lerPacote())(pasta + filename);
    if (!dados) throw new Error(`Dado do pdf.js não encontrado: ${filename}`);
    return dados;
  }
}
const OPCOES_PDFJS = {
  cMapUrl: BASE + "cmaps/", cMapPacked: true,
  standardFontDataUrl: BASE + "fonts/",
  wasmUrl: BASE + "wasm/",
  BinaryDataFactory: DadosDoPacote,
  useWorkerFetch: false,
  isEvalSupported: false,
};
const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];

export async function abrirPdfjs(bytes) {
  const tarefa = pdfjs.getDocument({ ...OPCOES_PDFJS, data: bytes.slice() });
  const doc = await tarefa.promise;
  doc.fechar = () => { try { tarefa.destroy(); } catch { /* já fechado */ } };
  return doc;
}

// ======================================================================== visualizador
export function criarVisor(raiz, { aoMudar } = {}) {
  raiz.innerHTML = `<div class="hp-paginas" tabindex="0" aria-label="Páginas do documento"></div><div class="hp-impressao" aria-hidden="true"></div>`;
  const area = raiz.querySelector(".hp-paginas");
  const impressao = raiz.querySelector(".hp-impressao");
  let doc = null, paginas = [], escala = 1, ajustarLargura = true, atual = 1, geracao = 0;
  const dpr = () => Math.min(window.devicePixelRatio || 1, 3);

  const avisar = () => aoMudar?.({ atual, total: paginas.length, escala });

  const observador = new IntersectionObserver(entradas => {
    for (const e of entradas) if (e.isIntersecting) desenhar(paginas[Number(e.target.dataset.n) - 1]);
  }, { root: area, rootMargin: "800px 0px" });

  function medir() {
    for (const p of paginas) {
      const vp = p.base.clone({ scale: escala });
      p.div.style.width = Math.floor(vp.width) + "px";
      p.div.style.height = Math.floor(vp.height) + "px";
      p.div.style.setProperty("--total-scale-factor", escala);
      p.div.style.setProperty("--scale-factor", escala);
      if (p.escalaDesenhada !== escala) p.sujo = true;
    }
  }
  async function desenhar(p) {
    if (!p || !p.sujo || p.desenhando) return;
    p.desenhando = true; p.sujo = false;
    const minha = geracao, esc = escala;
    try {
      const pagina = await doc.getPage(p.n);
      if (minha !== geracao) return;
      const vp = pagina.getViewport({ scale: esc });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(vp.width * dpr()); canvas.height = Math.floor(vp.height * dpr());
      canvas.style.width = Math.floor(vp.width) + "px"; canvas.style.height = Math.floor(vp.height) + "px";
      await pagina.render({ canvas, viewport: vp, transform: dpr() !== 1 ? [dpr(), 0, 0, dpr(), 0, 0] : undefined }).promise;
      if (minha !== geracao) return;
      const texto = document.createElement("div");
      texto.className = "textLayer";
      const camada = new pdfjs.TextLayer({ textContentSource: pagina.streamTextContent(), container: texto, viewport: vp });
      p.div.replaceChildren(canvas, texto);
      await camada.render().catch(() => {});
      p.escalaDesenhada = esc;
      if (escala !== esc) { p.sujo = true; }
    } catch (e) {
      if (e?.name !== "RenderingCancelledException") console.warn("[pdf] página", p.n, e);
      p.sujo = true;
    } finally {
      p.desenhando = false;
      if (p.sujo && minha === geracao && visivel(p)) requestAnimationFrame(() => desenhar(p));
    }
  }
  const visivel = p => { const r = p.div.getBoundingClientRect(), a = area.getBoundingClientRect(); return r.bottom > a.top - 800 && r.top < a.bottom + 800; };

  function escalaDeAjuste() {
    const p = paginas[atual - 1] ?? paginas[0];
    if (!p) return 1;
    return Math.max(0.1, Math.min(1.5, (area.clientWidth - 40) / p.base.width));
  }
  function aplicarEscala(nova, manter = true) {
    const antes = manter ? atual : null;
    escala = Math.round(nova * 1000) / 1000;
    medir();
    if (antes) irPara(antes, false);
    for (const p of paginas) if (visivel(p)) desenhar(p);
    avisar();
  }
  area.addEventListener("scroll", () => {
    const meio = area.scrollTop + area.clientHeight / 3;
    let n = 1;
    for (const p of paginas) { if (p.div.offsetTop <= meio) n = p.n; else break; }
    if (n !== atual) { atual = n; avisar(); }
  }, { passive: true });
  area.addEventListener("wheel", e => {
    if (!e.ctrlKey || !doc) return;
    e.preventDefault();
    api.zoom(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  new ResizeObserver(() => { if (ajustarLargura && doc) aplicarEscala(escalaDeAjuste()); }).observe(area);

  function irPara(n, suave = true) {
    n = Math.max(1, Math.min(paginas.length, n | 0));
    const p = paginas[n - 1];
    if (!p) return;
    area.scrollTo({ top: p.div.offsetTop - 12, behavior: suave && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
    atual = n; avisar();
  }

  const api = {
    get documento() { return doc; },
    get total() { return paginas.length; },
    get atual() { return atual; },
    get escala() { return escala; },
    async mostrar(bytes, { manterPosicao = false } = {}) {
      const novo = await abrirPdfjs(bytes);
      const voltar = manterPosicao ? atual : 1;
      // numa edição, o desenho anterior fica no lugar até a página nova ficar pronta (sem piscar em branco)
      const anteriores = manterPosicao ? paginas.map(p => p.div.querySelector("canvas")) : [];
      const topo = area.scrollTop;
      geracao++;
      observador.disconnect();
      doc?.fechar();
      doc = novo;
      paginas = [];
      area.replaceChildren();
      for (let n = 1; n <= doc.numPages; n++) {
        const pg = await doc.getPage(n);
        const div = document.createElement("div");
        div.className = "hp-pag"; div.dataset.n = n;
        div.setAttribute("aria-label", `Página ${n}`);
        const velho = anteriores[n - 1];
        if (velho) { velho.style.width = "100%"; velho.style.height = "100%"; div.append(velho); }
        paginas.push({ n, div, base: pg.getViewport({ scale: 1 }), sujo: true });
        area.append(div);
      }
      for (const p of paginas) observador.observe(p.div);
      atual = Math.min(voltar, paginas.length) || 1;
      if (!manterPosicao) ajustarLargura = true;
      aplicarEscala(ajustarLargura ? escalaDeAjuste() : escala, false);
      if (manterPosicao) { area.scrollTop = topo; if (Math.abs(paginas[atual - 1].div.offsetTop - topo) > area.clientHeight) irPara(atual, false); }
      else irPara(atual, false);
    },
    limpar() { geracao++; observador.disconnect(); doc?.fechar(); doc = null; paginas = []; area.replaceChildren(); avisar(); },
    irPara,
    pagina(passo) { irPara(atual + passo); },
    zoom(passo) {
      ajustarLargura = false;
      const i = ZOOMS.findIndex(z => z >= escala - 0.001);
      const alvo = passo > 0 ? ZOOMS.find(z => z > escala + 0.001) ?? ZOOMS.at(-1) : [...ZOOMS].reverse().find(z => z < escala - 0.001) ?? ZOOMS[0];
      aplicarEscala(i < 0 && passo > 0 ? ZOOMS.at(-1) : alvo);
    },
    ajustar() { ajustarLargura = true; aplicarEscala(escalaDeAjuste()); },

    /** Arrastar um retângulo sobre uma página. Devolve { pagina, x1, y1, x2, y2 } no espaço do PDF, ou null. */
    selecionarArea({ ponto = false } = {}) {
      return new Promise(resolver => {
        area.classList.add("hp-selecionando");
        let inicio = null, caixa = null, pag = null;
        const fim = valor => {
          area.classList.remove("hp-selecionando");
          caixa?.remove();
          area.removeEventListener("pointerdown", baixo); window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", cima); window.removeEventListener("keydown", tecla, true);
          resolver(valor);
        };
        const local = (e, div) => { const r = div.getBoundingClientRect(); return [Math.max(0, Math.min(r.width, e.clientX - r.left)), Math.max(0, Math.min(r.height, e.clientY - r.top))]; };
        const baixo = e => {
          const div = e.target.closest(".hp-pag");
          if (!div || e.button !== 0) return;
          e.preventDefault();
          pag = paginas[Number(div.dataset.n) - 1];
          inicio = local(e, div);
          caixa = document.createElement("div"); caixa.className = "hp-caixa-sel";
          Object.assign(caixa.style, { left: inicio[0] + "px", top: inicio[1] + "px", width: "0px", height: "0px" });
          div.append(caixa);
          area.setPointerCapture?.(e.pointerId);
        };
        const move = e => {
          if (!inicio) return;
          const [x, y] = local(e, pag.div);
          Object.assign(caixa.style, { left: Math.min(x, inicio[0]) + "px", top: Math.min(y, inicio[1]) + "px", width: Math.abs(x - inicio[0]) + "px", height: Math.abs(y - inicio[1]) + "px" });
        };
        const cima = e => {
          if (!inicio) return;
          let [x, y] = local(e, pag.div);
          let [a, b] = inicio;
          if (Math.abs(x - a) < 6 && Math.abs(y - b) < 6) {
            if (!ponto) { inicio = null; caixa.remove(); caixa = null; return; } // clique solto: continua esperando o arraste
            x = a + 24; y = b + 24;
          }
          const vp = pag.base.clone({ scale: escala });
          const [p1x, p1y] = vp.convertToPdfPoint(a, b), [p2x, p2y] = vp.convertToPdfPoint(x, y);
          fim({ pagina: pag.n, x1: Math.min(p1x, p2x), y1: Math.min(p1y, p2y), x2: Math.max(p1x, p2x), y2: Math.max(p1y, p2y) });
        };
        const tecla = e => { if (e.key === "Escape") { e.stopPropagation(); fim(null); } };
        area.addEventListener("pointerdown", baixo); window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", cima); window.addEventListener("keydown", tecla, true);
      });
    },

    /** Desenha a página n (1…) num canvas, na resolução pedida. */
    async renderizar(n, dpi = 150) {
      const pg = await doc.getPage(n);
      const vp = pg.getViewport({ scale: dpi / 72 });
      const c = document.createElement("canvas");
      c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvas: c, viewport: vp }).promise;
      return { canvas: c, viewport: vp };
    },

    async imprimir() {
      if (!doc) { window.print(); return; }
      impressao.replaceChildren();
      for (let n = 1; n <= paginas.length; n++) {
        const { canvas } = await api.renderizar(n, 150);
        const img = new Image();
        img.src = canvas.toDataURL("image/jpeg", 0.92);
        await img.decode().catch(() => {});
        impressao.append(img);
      }
      document.documentElement.classList.add("hp-imprimindo");
      const limpar = () => { document.documentElement.classList.remove("hp-imprimindo"); impressao.replaceChildren(); };
      window.addEventListener("afterprint", limpar, { once: true });
      window.print();
      setTimeout(limpar, 60000);
    },
  };
  return api;
}

// ======================================================================== utilidades
async function carregar(bytes) {
  try { return await PDFDocument.load(bytes, { updateMetadata: false }); }
  catch (e) {
    if (/encrypt/i.test(String(e))) throw new Error("Este PDF está protegido por senha; as edições precisam de uma cópia sem senha.");
    throw e;
  }
}
const salvar = doc => doc.save({ useObjectStreams: true });
const indices = (lista, total) => lista.map(Number).filter(n => n >= 1 && n <= total).map(n => n - 1);
const nomeArquivo = t => String(t).normalize("NFC").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "parte";
const comNumero = (base, sufixo, ext) => base.replace(/\.[^.\\/]+$/, "") + sufixo + "." + ext;
const pad = (n, total) => String(n).padStart(String(total).length, "0");

/** Converte um ponto "visual" (fração da largura/altura como a página aparece) para o espaço do PDF. */
function visual(page, fx, fy) {
  const { x, y, width: w, height: h } = page.getCropBox();
  const r = ((page.getRotation().angle % 360) + 360) % 360;
  const vw = r % 180 ? h : w, vh = r % 180 ? w : h;
  const u = fx * vw, v = fy * vh;
  const [px, py] = r === 90 ? [w - v, u] : r === 180 ? [w - u, h - v] : r === 270 ? [v, h - u] : [u, v];
  return { x: x + px, y: y + py, angulo: r, largura: vw, altura: vh };
}
/** Escreve um texto centrado num ponto visual, legível na orientação em que a página aparece. */
function textoCentrado(page, texto, fx, fy, { font, size, color, opacity = 1, giro = 0 }) {
  const p = visual(page, fx, fy);
  const ang = (p.angulo + giro) * Math.PI / 180;
  const larg = font.widthOfTextAtSize(texto, size), alt = font.heightAtSize(size) * 0.7;
  const x = p.x - Math.cos(ang) * larg / 2 + Math.sin(ang) * alt / 2;
  const y = p.y - Math.sin(ang) * larg / 2 - Math.cos(ang) * alt / 2;
  page.drawText(texto, { x, y, size, font, color, opacity, rotate: degrees(p.angulo + giro) });
}
async function bytesDoCanvas(canvas, tipo = "image/png", qualidade) {
  const blob = await new Promise(r => canvas.toBlob(r, tipo, qualidade));
  return new Uint8Array(await blob.arrayBuffer());
}
const ehPng = b => b[0] === 0x89 && b[1] === 0x50;
const ehJpg = b => b[0] === 0xff && b[1] === 0xd8;
async function embutirImagem(doc, bytes) {
  if (ehPng(bytes)) return doc.embedPng(bytes);
  if (ehJpg(bytes)) return doc.embedJpg(bytes);
  // outros formatos (bmp, gif, webp…): passa por um canvas
  const bmp = await createImageBitmap(new Blob([bytes]));
  const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
  c.getContext("2d").drawImage(bmp, 0, 0);
  return doc.embedPng(await bytesDoCanvas(c));
}
/** Coloca a imagem dentro da área (mantendo a proporção) ou centrada na página. */
function desenharImagem(page, img, area) {
  const caixa = area ? { x: area.x1, y: area.y1, w: area.x2 - area.x1, h: area.y2 - area.y1 } : (() => {
    const c = page.getCropBox(); return { x: c.x + c.width * 0.1, y: c.y + c.height * 0.1, w: c.width * 0.8, h: c.height * 0.8 };
  })();
  const r = ((page.getRotation().angle % 360) + 360) % 360;
  const deitada = r % 180 !== 0;
  const iw = deitada ? img.height : img.width, ih = deitada ? img.width : img.height;
  const k = Math.min(caixa.w / iw, caixa.h / ih, area ? Infinity : 1);
  const w = iw * k, h = ih * k;
  const cx = caixa.x + caixa.w / 2, cy = caixa.y + caixa.h / 2;
  // a imagem gira junto com a página para aparecer em pé
  const dw = deitada ? h : w, dh = deitada ? w : h; // tamanho no espaço da imagem
  const ang = r * Math.PI / 180;
  const x = cx - (Math.cos(ang) * dw - Math.sin(ang) * dh) / 2;
  const y = cy - (Math.sin(ang) * dw + Math.cos(ang) * dh) / 2;
  page.drawImage(img, { x, y, width: dw, height: dh, rotate: degrees(r) });
}
/** Texto de cada página (linhas), pelo pdf.js. */
async function textoPorPagina(docjs) {
  const out = [];
  for (let n = 1; n <= docjs.numPages; n++) {
    const tc = await (await docjs.getPage(n)).getTextContent();
    let linha = "", linhas = [];
    for (const it of tc.items) { linha += it.str ?? ""; if (it.hasEOL) { linhas.push(linha); linha = ""; } }
    if (linha) linhas.push(linha);
    out.push(linhas.map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean));
  }
  return out;
}
/** Diferença por linhas (LCS), com limite para documentos enormes. */
function diferenca(a, b) {
  const n = a.length, m = b.length;
  if (n * m > 4e6) return null;
  const t = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push(["=", a[i]]); i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) out.push(["-", a[i++]]);
    else out.push(["+", b[j++]]);
  }
  while (i < n) out.push(["-", a[i++]]);
  while (j < m) out.push(["+", b[j++]]);
  return out;
}

// ======================================================================== operações
// ctx: { bytes, nome, visor, pedirTexto(titulo, exemplo, valor), pedirPaginas(titulo, padrao), escolher(titulo, opcoes),
//        confirmar(texto), escolherArquivos(titulo, filtros, varios), escolherDestino(titulo, sugestao, filtros),
//        lerArquivo(caminho), salvarBytes(caminho, bytes), pedirFormulario(titulo, campos), desenharAssinatura(),
//        status(texto) }
const FILTRO_PDF = [{ nome: "PDF", extensoes: ["pdf"] }];
const FILTRO_IMG = [{ nome: "Imagens", extensoes: ["png", "jpg", "jpeg", "bmp", "gif", "webp"] }];

/** Grava várias partes (cada uma uma lista de índices) a partir de um nome base escolhido no diálogo. */
async function gravarPartes(ctx, doc, partes, rotulo, nomes = null) {
  const destino = await ctx.escolherDestino(`${rotulo}: nome base dos arquivos`, `${ctx.nome}.pdf`, FILTRO_PDF);
  if (!destino) return null;
  const pasta = destino.replace(/[^\\/]*$/, "");
  let i = 0;
  for (const idx of partes) {
    i++;
    const novo = await PDFDocument.create();
    for (const p of await novo.copyPages(doc, idx)) novo.addPage(p);
    const caminho = nomes ? pasta + nomeArquivo(nomes[i - 1]) + ".pdf" : comNumero(destino, `-parte${pad(i, partes.length)}`, "pdf");
    ctx.status(`${rotulo}: gravando ${i} de ${partes.length}`);
    await ctx.salvarBytes(caminho, await salvar(novo));
  }
  return { mensagem: `${rotulo}: ${partes.length} arquivo${partes.length > 1 ? "s" : ""} em ${pasta}` };
}

export const operacoes = {
  async girar(ctx) {
    const sel = await ctx.pedirPaginas("Girar 90° no sentido horário: quais páginas?", String(ctx.visor.atual));
    if (!sel) return null;
    const doc = await carregar(ctx.bytes), pgs = doc.getPages();
    for (const i of indices(sel, pgs.length)) pgs[i].setRotation(degrees((pgs[i].getRotation().angle + 90) % 360));
    return { bytes: await salvar(doc), mensagem: `Girada${sel.length > 1 ? "s" : ""}: ${sel.length} página${sel.length > 1 ? "s" : ""}.` };
  },
  async moverAntes(ctx) { return mover(ctx, -1); },
  async moverDepois(ctx) { return mover(ctx, +1); },
  async duplicar(ctx) {
    const i = ctx.visor.atual - 1;
    const doc = await carregar(ctx.bytes);
    const [copia] = await doc.copyPages(doc, [i]);
    doc.insertPage(i + 1, copia);
    return { bytes: await salvar(doc), irPara: i + 2, mensagem: `Página ${i + 1} duplicada.` };
  },
  async paginaBranca(ctx) {
    const i = ctx.visor.atual - 1;
    const doc = await carregar(ctx.bytes);
    const ref = doc.getPage(i), { width, height } = ref.getCropBox();
    const r = ref.getRotation().angle % 180 ? [height, width] : [width, height];
    doc.insertPage(i + 1, r);
    return { bytes: await salvar(doc), irPara: i + 2, mensagem: `Página em branco depois da página ${i + 1}.` };
  },
  async excluir(ctx) {
    const sel = await ctx.pedirPaginas("Excluir quais páginas?", String(ctx.visor.atual));
    if (!sel) return null;
    const doc = await carregar(ctx.bytes);
    const idx = [...new Set(indices(sel, doc.getPageCount()))].sort((a, b) => b - a);
    if (idx.length >= doc.getPageCount()) throw new Error("Não dá para excluir todas as páginas.");
    if (!await ctx.confirmar(`Excluir ${idx.length} página${idx.length > 1 ? "s" : ""}? (dá para desfazer)`)) return null;
    for (const i of idx) doc.removePage(i);
    return { bytes: await salvar(doc), irPara: Math.min(ctx.visor.atual, doc.getPageCount()), mensagem: `Excluída${idx.length > 1 ? "s" : ""}: ${idx.length} página${idx.length > 1 ? "s" : ""}.` };
  },
  async numerar(ctx) {
    const modelo = await ctx.pedirTexto("Numerar páginas: modelo do número", "Página {n} de {total}", "{n} / {total}");
    if (!modelo) return null;
    const doc = await carregar(ctx.bytes), font = await doc.embedFont(StandardFonts.Helvetica), pgs = doc.getPages();
    pgs.forEach((pg, i) => textoCentrado(pg, modelo.replaceAll("{n}", i + 1).replaceAll("{total}", pgs.length), 0.5, 0.035, { font, size: 10, color: rgb(0.2, 0.2, 0.2) }));
    return { bytes: await salvar(doc), mensagem: `${pgs.length} páginas numeradas.` };
  },
  async marcaDagua(ctx) {
    const texto = await ctx.pedirTexto("Marca-d'água: texto", "CONFIDENCIAL", "CONFIDENCIAL");
    if (!texto) return null;
    const doc = await carregar(ctx.bytes), font = await doc.embedFont(StandardFonts.HelveticaBold);
    for (const pg of doc.getPages()) {
      const v = visual(pg, 0.5, 0.5);
      const diag = Math.hypot(v.largura, v.altura);
      const size = Math.max(12, Math.min(110, diag * 0.7 / Math.max(1, font.widthOfTextAtSize(texto, 1))));
      textoCentrado(pg, texto, 0.5, 0.5, { font, size, color: rgb(0.55, 0.55, 0.55), opacity: 0.22, giro: Math.atan2(v.altura, v.largura) * 180 / Math.PI });
    }
    return { bytes: await salvar(doc), mensagem: `Marca-d'água "${texto}" aplicada.` };
  },
  async intercalar(ctx) {
    const [outro] = await ctx.escolherArquivos("PDF para intercalar com o atual", FILTRO_PDF, false) ?? [];
    if (!outro) return null;
    const a = await carregar(ctx.bytes), b = await carregar(await ctx.lerArquivo(outro));
    const novo = await PDFDocument.create();
    const pa = await novo.copyPages(a, a.getPageIndices()), pb = await novo.copyPages(b, b.getPageIndices());
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) { if (pa[i]) novo.addPage(pa[i]); if (pb[i]) novo.addPage(pb[i]); }
    return { bytes: await salvar(novo), irPara: 1, mensagem: `Intercalado: ${pa.length} + ${pb.length} páginas.` };
  },
  async dividirPaginas(ctx) {
    const doc = await carregar(ctx.bytes);
    return gravarPartes(ctx, doc, doc.getPageIndices().map(i => [i]), "Dividir por página");
  },
  async dividirGrupos(ctx) {
    const t = await ctx.pedirTexto("Dividir em grupos: páginas por arquivo", "2", "2");
    const k = Number(t);
    if (!t) return null;
    if (!Number.isInteger(k) || k < 1) throw new Error("Informe um número inteiro de páginas, ex.: 2.");
    const doc = await carregar(ctx.bytes), idx = doc.getPageIndices(), partes = [];
    for (let i = 0; i < idx.length; i += k) partes.push(idx.slice(i, i + k));
    return gravarPartes(ctx, doc, partes, "Dividir em grupos");
  },
  async dividirIntervalos(ctx) {
    const t = await ctx.pedirTexto("Intervalos: um arquivo por grupo, separados por ;", "1-3; 4-6; 7, 9");
    if (!t) return null;
    const doc = await carregar(ctx.bytes);
    const partes = t.split(";").map(s => s.trim()).filter(Boolean).map(s => indices(ctx.expandirPaginas(s), doc.getPageCount()));
    if (!partes.length || partes.some(p => !p.length)) throw new Error("Algum intervalo não tem páginas válidas.");
    return gravarPartes(ctx, doc, partes, "Intervalos personalizados");
  },
  async dividirTamanho(ctx) {
    const t = await ctx.pedirTexto("Dividir por tamanho: máximo de cada arquivo (MB)", "5", "5");
    if (!t) return null;
    const limite = Number(String(t).replace(",", ".")) * 1024 * 1024;
    if (!(limite > 0)) throw new Error("Informe o tamanho em MB, ex.: 5.");
    const doc = await carregar(ctx.bytes), n = doc.getPageCount();
    const tamanhos = [];
    for (let i = 0; i < n; i++) {
      ctx.status(`Medindo página ${i + 1} de ${n}`);
      const um = await PDFDocument.create(); um.addPage((await um.copyPages(doc, [i]))[0]);
      tamanhos.push((await salvar(um)).length);
    }
    const partes = []; let atual = [], soma = 0;
    tamanhos.forEach((tam, i) => { if (atual.length && soma + tam > limite) { partes.push(atual); atual = []; soma = 0; } atual.push(i); soma += tam; });
    if (atual.length) partes.push(atual);
    return gravarPartes(ctx, doc, partes, "Dividir por tamanho");
  },
  async dividirMarcadores(ctx) {
    const djs = ctx.visor.documento;
    const marcadores = (await djs.getOutline()) ?? [];
    const inicios = [];
    for (const m of marcadores) {
      try {
        const dest = typeof m.dest === "string" ? await djs.getDestination(m.dest) : m.dest;
        if (!dest?.[0]) continue;
        const idx = typeof dest[0] === "number" ? dest[0] : await djs.getPageIndex(dest[0]);
        inicios.push({ idx, titulo: m.title });
      } catch { /* marcador sem destino */ }
    }
    inicios.sort((a, b) => a.idx - b.idx);
    const unicos = inicios.filter((m, i) => i === 0 || m.idx !== inicios[i - 1].idx);
    if (!unicos.length) throw new Error("Este PDF não tem marcadores para dividir.");
    if (unicos[0].idx > 0) unicos.unshift({ idx: 0, titulo: "Início" });
    const doc = await carregar(ctx.bytes), n = doc.getPageCount();
    const partes = unicos.map((m, i) => Array.from({ length: (unicos[i + 1]?.idx ?? n) - m.idx }, (_, k) => m.idx + k));
    return gravarPartes(ctx, doc, partes, "Dividir por marcadores", unicos.map((m, i) => `${pad(i + 1, unicos.length)} ${m.titulo}`));
  },
  async recortar(ctx) {
    ctx.status("Recortar: arraste sobre a página a área que deve ficar (Esc cancela).");
    const a = await ctx.visor.selecionarArea();
    if (!a) return null;
    const onde = await ctx.escolher("Aplicar o recorte em:", [`Só na página ${a.pagina}`, "Todas as páginas"]);
    if (onde == null) return null;
    const doc = await carregar(ctx.bytes), pgs = doc.getPages();
    for (const pg of onde === 0 ? [pgs[a.pagina - 1]] : pgs) pg.setCropBox(a.x1, a.y1, a.x2 - a.x1, a.y2 - a.y1);
    return { bytes: await salvar(doc), mensagem: "Recorte aplicado. \"Remover recorte\" volta a página inteira." };
  },
  async removerRecorte(ctx) {
    const doc = await carregar(ctx.bytes);
    for (const pg of doc.getPages()) { pg.node.delete(PDFName.of("CropBox")); }
    return { bytes: await salvar(doc), mensagem: "Recorte removido de todas as páginas." };
  },
  async inserirImagem(ctx) {
    const [arq] = await ctx.escolherArquivos("Imagem para inserir", FILTRO_IMG, false) ?? [];
    if (!arq) return null;
    return colocarImagem(ctx, await ctx.lerArquivo(arq), "Inserir imagem");
  },
  async colarImagem(ctx) {
    let bytes = null;
    try {
      for (const item of await navigator.clipboard.read()) {
        const tipo = item.types.find(t => t.startsWith("image/"));
        if (tipo) { bytes = new Uint8Array(await (await item.getType(tipo)).arrayBuffer()); break; }
      }
    } catch { /* sem permissão ou sem imagem */ }
    if (!bytes) throw new Error("Não há imagem na área de transferência (copie uma imagem e tente de novo).");
    return colocarImagem(ctx, bytes, "Colar imagem");
  },
  async capturarTela(ctx) {
    if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Esta janela não permite capturar a tela.");
    const fluxo = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).catch(() => null);
    if (!fluxo) return null;
    try {
      const video = document.createElement("video");
      video.muted = true; video.srcObject = fluxo; await video.play();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const c = document.createElement("canvas"); c.width = video.videoWidth; c.height = video.videoHeight;
      c.getContext("2d").drawImage(video, 0, 0);
      const doc = await carregar(ctx.bytes), img = await doc.embedPng(await bytesDoCanvas(c));
      const w = img.width * 0.75, h = img.height * 0.75; // 96 dpi → pontos
      const i = ctx.visor.atual;
      const pg = doc.insertPage(i, [w, h]);
      pg.drawImage(img, { x: 0, y: 0, width: w, height: h });
      return { bytes: await salvar(doc), irPara: i + 1, mensagem: `Captura inserida como página ${i + 1}.` };
    } finally { fluxo.getTracks().forEach(t => t.stop()); }
  },
  async comentario(ctx) {
    ctx.status("Comentário: clique na página onde ele fica (Esc cancela).");
    const a = await ctx.visor.selecionarArea({ ponto: true });
    if (!a) return null;
    const texto = await ctx.pedirTexto("Texto do comentário", "Escreva o comentário");
    if (!texto) return null;
    const doc = await carregar(ctx.bytes), pg = doc.getPage(a.pagina - 1), c = doc.context;
    const ap = c.register(c.formXObject([
      pushGraphicsState(), setFillingRgbColor(1, 0.85, 0.2), setStrokingRgbColor(0.6, 0.45, 0), setLineWidth(1),
      rectangle(0.5, 0.5, 19, 19), fillAndStroke(),
      setStrokingRgbColor(0.45, 0.33, 0), moveTo(4, 14), lineTo(16, 14), moveTo(4, 10), lineTo(16, 10), moveTo(4, 6), lineTo(12, 6), stroke(),
      popGraphicsState(),
    ], { BBox: [0, 0, 20, 20] }));
    const nota = c.register(c.obj({
      Type: "Annot", Subtype: "Text", Rect: [a.x1, a.y2 - 20, a.x1 + 20, a.y2], Contents: PDFHexString.fromText(texto),
      T: PDFHexString.fromText("Comentário"), Name: "Comment", C: [1, 0.85, 0.2], F: 4, Open: false,
      M: PDFString.fromDate(new Date()), AP: { N: ap },
    }));
    pg.node.addAnnot(nota);
    return { bytes: await salvar(doc), mensagem: `Comentário na página ${a.pagina}. Passe o mouse no ícone em outros leitores de PDF para ler.` };
  },
  async realcar(ctx) {
    ctx.status("Realçar: arraste sobre o trecho (Esc cancela).");
    const a = await ctx.visor.selecionarArea();
    if (!a) return null;
    const doc = await carregar(ctx.bytes);
    doc.getPage(a.pagina - 1).drawRectangle({ x: a.x1, y: a.y1, width: a.x2 - a.x1, height: a.y2 - a.y1, color: rgb(1, 0.92, 0.2), opacity: 0.45, blendMode: BlendMode.Multiply });
    return { bytes: await salvar(doc), mensagem: `Realce na página ${a.pagina}.` };
  },
  async retangulo(ctx) {
    ctx.status("Retângulo: arraste sobre a página (Esc cancela).");
    const a = await ctx.visor.selecionarArea();
    if (!a) return null;
    const doc = await carregar(ctx.bytes);
    doc.getPage(a.pagina - 1).drawRectangle({ x: a.x1, y: a.y1, width: a.x2 - a.x1, height: a.y2 - a.y1, borderColor: rgb(0.85, 0.1, 0.1), borderWidth: 2 });
    return { bytes: await salvar(doc), mensagem: `Retângulo na página ${a.pagina}.` };
  },
  async assinaturaDesenhada(ctx) {
    const png = await ctx.desenharAssinatura();
    if (!png) return null;
    return colocarImagem(ctx, png, "Assinatura");
  },
  async censurar(ctx) {
    ctx.status("Censurar: arraste sobre o que deve sumir (Esc cancela).");
    const a = await ctx.visor.selecionarArea();
    if (!a) return null;
    if (!await ctx.confirmar(`A página ${a.pagina} vira imagem e o que estiver sob a tarja preta é apagado de verdade (texto, imagens e campos dessa página deixam de ser editáveis). Continuar?`)) return null;
    const { canvas, viewport } = await ctx.visor.renderizar(a.pagina, 200);
    const [x1, y1] = viewport.convertToViewportPoint(a.x1, a.y1), [x2, y2] = viewport.convertToViewportPoint(a.x2, a.y2);
    const g = canvas.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(Math.min(x1, x2) - 1, Math.min(y1, y2) - 1, Math.abs(x2 - x1) + 2, Math.abs(y2 - y1) + 2);
    const doc = await carregar(ctx.bytes), img = await doc.embedJpg(await bytesDoCanvas(canvas, "image/jpeg", 0.9));
    const w = viewport.width * 72 / 200, h = viewport.height * 72 / 200;
    const nova = doc.insertPage(a.pagina - 1, [w, h]);
    nova.drawImage(img, { x: 0, y: 0, width: w, height: h });
    doc.removePage(a.pagina);
    return { bytes: await salvar(doc), mensagem: `Área censurada na página ${a.pagina} (conteúdo removido).` };
  },
  async preencherFormulario(ctx) {
    const doc = await carregar(ctx.bytes), form = doc.getForm(), campos = form.getFields();
    if (!campos.length) throw new Error("Este PDF não tem campos de formulário. Use \"Criar campo…\" para criar.");
    const descr = campos.map(f => {
      const nome = f.getName();
      if (f instanceof PDFTextField) return { nome, tipo: "texto", valor: f.getText() ?? "" };
      if (f instanceof PDFCheckBox) return { nome, tipo: "caixa", valor: f.isChecked() };
      if (f instanceof PDFDropdown) return { nome, tipo: "lista", opcoes: f.getOptions(), valor: f.getSelected()[0] ?? "" };
      if (f instanceof PDFOptionList) return { nome, tipo: "lista", opcoes: f.getOptions(), valor: f.getSelected()[0] ?? "" };
      if (f instanceof PDFRadioGroup) return { nome, tipo: "lista", opcoes: f.getOptions(), valor: f.getSelected() ?? "" };
      return null;
    }).filter(Boolean);
    const valores = await ctx.pedirFormulario("Preencher formulário", descr);
    if (!valores) return null;
    for (const d of descr) {
      const f = form.getField(d.nome), v = valores[d.nome];
      if (f instanceof PDFTextField) f.setText(String(v ?? ""));
      else if (f instanceof PDFCheckBox) v ? f.check() : f.uncheck();
      else if (v && (f instanceof PDFDropdown || f instanceof PDFOptionList || f instanceof PDFRadioGroup)) f.select(v);
    }
    return { bytes: await salvar(doc), mensagem: `${descr.length} campo${descr.length > 1 ? "s" : ""} preenchido${descr.length > 1 ? "s" : ""}.` };
  },
  async criarCampo(ctx, lig) {
    const nomes = { texto: "campo de texto", caixa: "caixa de seleção", lista: "lista", escolha: "escolha única" };
    ctx.status(`Criar ${nomes[lig.tipo]}: arraste sobre a página onde ele fica (Esc cancela).`);
    const a = await ctx.visor.selecionarArea();
    if (!a) return null;
    const doc = await carregar(ctx.bytes), form = doc.getForm(), pg = doc.getPage(a.pagina - 1);
    const existentes = new Set(form.getFields().map(f => f.getName()));
    let sugestao = 1; while (existentes.has(`campo${sugestao}`)) sugestao++;
    const nome = await ctx.pedirTexto("Nome do campo", `campo${sugestao}`, `campo${sugestao}`);
    if (!nome) return null;
    if (existentes.has(nome)) throw new Error(`Já existe um campo chamado "${nome}".`);
    const caixa = { x: a.x1, y: a.y1, width: Math.max(12, a.x2 - a.x1), height: Math.max(12, a.y2 - a.y1) };
    if (lig.tipo === "texto") form.createTextField(nome).addToPage(pg, caixa);
    else if (lig.tipo === "caixa") { const l = Math.min(caixa.width, caixa.height); form.createCheckBox(nome).addToPage(pg, { ...caixa, width: l, height: l }); }
    else {
      const t = await ctx.pedirTexto("Opções, separadas por vírgula", "Sim, Não, Talvez");
      const opcoes = (t ?? "").split(",").map(s => s.trim()).filter(Boolean);
      if (!opcoes.length) return null;
      if (lig.tipo === "lista") { const d = form.createDropdown(nome); d.setOptions(opcoes); d.addToPage(pg, caixa); }
      else {
        const g = form.createRadioGroup(nome), passo = caixa.width / opcoes.length, l = Math.min(passo * 0.8, caixa.height);
        opcoes.forEach((o, i) => g.addOptionToPage(o, pg, { x: caixa.x + i * passo, y: caixa.y, width: l, height: l }));
      }
    }
    return { bytes: await salvar(doc), mensagem: `Campo "${nome}" criado na página ${a.pagina}.` };
  },
  async exportarImagens(ctx, lig) {
    const ext = lig.formato === "jpg" ? "jpg" : "png";
    let lista;
    if (lig.paginas === "atual") lista = [ctx.visor.atual];
    else if (lig.paginas === "todas") lista = Array.from({ length: ctx.visor.total }, (_, i) => i + 1);
    else {
      const sel = await ctx.pedirPaginas(`Páginas para ${ext.toUpperCase()} (vazio = todas)`, "", true);
      if (sel === null) return null;
      lista = sel.length ? indices(sel, ctx.visor.total).map(i => i + 1) : Array.from({ length: ctx.visor.total }, (_, i) => i + 1);
    }
    const um = lista.length === 1;
    const destino = await ctx.escolherDestino(um ? `Página ${lista[0]} em ${ext.toUpperCase()}` : `${lista.length} páginas em ${ext.toUpperCase()}: nome base`,
      um ? `${ctx.nome}-p${lista[0]}.${ext}` : `${ctx.nome}.${ext}`, [{ nome: ext.toUpperCase(), extensoes: [ext] }]);
    if (!destino) return null;
    for (const [k, n] of lista.entries()) {
      ctx.status(`Gerando imagem ${k + 1} de ${lista.length}`);
      const { canvas } = await ctx.visor.renderizar(n, 150);
      const caminho = um ? destino : comNumero(destino, `-p${pad(n, ctx.visor.total)}`, ext);
      await ctx.salvarBytes(caminho, await bytesDoCanvas(canvas, ext === "jpg" ? "image/jpeg" : "image/png", 0.92));
    }
    return { mensagem: `${lista.length} ${lista.length > 1 ? "imagens" : "imagem"} ${ext.toUpperCase()} gravada${lista.length > 1 ? "s" : ""} (150 dpi).` };
  },
  async extrairImagens(ctx) {
    const djs = ctx.visor.documento, OPS = pdfjs.OPS;
    const achadas = [];
    for (let n = 1; n <= djs.numPages; n++) {
      ctx.status(`Procurando imagens na página ${n} de ${djs.numPages}`);
      const pg = await djs.getPage(n);
      const ops = await pg.getOperatorList();
      const nomes = new Set();
      ops.fnArray.forEach((fn, i) => { if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) nomes.add(ops.argsArray[i][0]); });
      for (const nome of nomes) {
        const obj = await new Promise(r => { try { (nome.startsWith("g_") ? pg.commonObjs : pg.objs).get(nome, r); } catch { r(null); } });
        if (obj && obj.width >= 16 && obj.height >= 16) achadas.push({ n, obj });
      }
    }
    if (!achadas.length) throw new Error("Nenhuma imagem encontrada neste PDF.");
    const destino = await ctx.escolherDestino(`${achadas.length} imagens: nome base`, `${ctx.nome}-imagem.png`, [{ nome: "PNG", extensoes: ["png"] }]);
    if (!destino) return null;
    for (const [k, { n, obj }] of achadas.entries()) {
      const c = document.createElement("canvas"); c.width = obj.width; c.height = obj.height;
      const g = c.getContext("2d");
      if (obj.bitmap) g.drawImage(obj.bitmap, 0, 0);
      else if (obj.data) {
        const px = g.createImageData(obj.width, obj.height), d = obj.data;
        if (d.length === obj.width * obj.height * 4) px.data.set(d);
        else if (d.length === obj.width * obj.height * 3) for (let i = 0, j = 0; i < d.length; i += 3, j += 4) { px.data[j] = d[i]; px.data[j + 1] = d[i + 1]; px.data[j + 2] = d[i + 2]; px.data[j + 3] = 255; }
        else continue;
        g.putImageData(px, 0, 0);
      } else continue;
      await ctx.salvarBytes(comNumero(destino, `-p${n}-${pad(k + 1, achadas.length)}`, "png"), await bytesDoCanvas(c));
    }
    return { mensagem: `${achadas.length} ${achadas.length > 1 ? "imagens" : "imagem"} extraída${achadas.length > 1 ? "s" : ""}.` };
  },
  async comparar(ctx) {
    const [outro] = await ctx.escolherArquivos("PDF para comparar com o atual", FILTRO_PDF, false) ?? [];
    if (!outro) return null;
    ctx.status("Comparando textos");
    const djsB = await abrirPdfjs(await ctx.lerArquivo(outro));
    try {
      const A = await textoPorPagina(ctx.visor.documento), B = await textoPorPagina(djsB);
      const la = A.flatMap((ls, i) => ls.map(l => `[p${i + 1}] ${l}`)), lb = B.flatMap((ls, i) => ls.map(l => `[p${i + 1}] ${l}`));
      const semPag = s => s.replace(/^\[p\d+\] /, "");
      const d = diferenca(la.map(semPag), lb.map(semPag));
      const nomeB = outro.split(/[\\/]/).pop();
      const cab = [`Comparação: ${ctx.nome}.pdf (A, ${A.length} páginas)  ×  ${nomeB} (B, ${B.length} páginas)`, ""];
      if (!d) return { texto: cab.concat("Documentos grandes demais para comparar linha a linha aqui.").join("\n") };
      const rem = d.filter(x => x[0] === "-").length, add = d.filter(x => x[0] === "+").length;
      if (!rem && !add) return { texto: cab.concat("O texto dos dois documentos é igual.").join("\n"), mensagem: "Textos iguais." };
      let ia = 0, ib = 0;
      const linhas = d.map(([t, s]) => t === "=" ? (ia++, ib++, null) : t === "-" ? `− A ${la[ia++].match(/^\[p\d+\]/)[0]} ${s}` : `+ B ${lb[ib++].match(/^\[p\d+\]/)[0]} ${s}`).filter(Boolean);
      return { texto: cab.concat(`${rem} linha${rem !== 1 ? "s" : ""} só em A (−), ${add} só em B (+).`, "", ...linhas).join("\n"), mensagem: `${rem + add} diferenças.` };
    } finally { djsB.fechar(); }
  },
  async propriedades(ctx) {
    const doc = await carregar(ctx.bytes);
    const v = await ctx.pedirFormulario("Propriedades do documento", [
      { nome: "Título", tipo: "texto", valor: doc.getTitle() ?? "" }, { nome: "Autor", tipo: "texto", valor: doc.getAuthor() ?? "" },
      { nome: "Assunto", tipo: "texto", valor: doc.getSubject() ?? "" }, { nome: "Palavras-chave", tipo: "texto", valor: (doc.getKeywords() ?? "") },
    ]);
    if (!v) return null;
    doc.setTitle(v["Título"]); doc.setAuthor(v["Autor"]); doc.setSubject(v["Assunto"]);
    doc.setKeywords(String(v["Palavras-chave"]).split(/[,;]/).map(s => s.trim()).filter(Boolean));
    doc.setModificationDate(new Date());
    return { bytes: await salvar(doc), mensagem: "Propriedades atualizadas." };
  },
};

async function mover(ctx, passo) {
  const i = ctx.visor.atual - 1, j = i + passo;
  const doc = await carregar(ctx.bytes);
  if (j < 0 || j >= doc.getPageCount()) throw new Error(passo < 0 ? "Já é a primeira página." : "Já é a última página.");
  const pagina = doc.getPage(i); // a mesma página (não uma cópia): marcadores e links continuam apontando para ela
  doc.removePage(i);
  doc.insertPage(j, pagina);
  return { bytes: await salvar(doc), irPara: j + 1, mensagem: `Página ${i + 1} agora é a ${j + 1}.` };
}

async function colocarImagem(ctx, bytes, rotulo) {
  ctx.status(`${rotulo}: arraste sobre a página onde ela fica (Esc = centralizar na página atual).`);
  const a = await ctx.visor.selecionarArea();
  const doc = await carregar(ctx.bytes);
  const img = await embutirImagem(doc, bytes);
  const n = a?.pagina ?? ctx.visor.atual;
  desenharImagem(doc.getPage(n - 1), img, a);
  return { bytes: await salvar(doc), mensagem: `${rotulo} na página ${n}.` };
}
