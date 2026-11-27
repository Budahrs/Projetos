// Classificador: depois de vetorizar ou importar um SVG, sobram formas soltas. Ele olha a geometria e
// os textos e PROPÕE o que aquilo é (botão, campo, selo, interruptor, cartão, menu, barra de navegação,
// avatar, ícone), com a confiança e os motivos. É construção assistida: nada muda sem o usuário aceitar.
const FORMAS_BASE = new Set(["caixa", "forma", "container", "vetor", "elipse", "botao", "campo"]);
const TEXTOS = new Set(["texto", "botao", "campo"]);

export const TIPOS_RECONHECIDOS = {
  botao: { nome: "Botão", tipo: "botao" },
  campo: { nome: "Campo", tipo: "campo" },
  selo: { nome: "Selo", tipo: "container" },
  interruptor: { nome: "Interruptor", tipo: "toggle" },
  cartao: { nome: "Cartão", tipo: "container" },
  menu: { nome: "Menu", tipo: "menu" },
  navegacao: { nome: "Barra de navegação", tipo: "container" },
  avatar: { nome: "Avatar", tipo: "container" },
  icone: { nome: "Ícone", tipo: "icone" },
};

const textoDe = e => String(e.tipo === "texto" ? e.texto ?? "" : e.rotulo ?? e.texto ?? "").trim();
const centro = e => ({ x: e.x + e.largura / 2, y: e.y + e.altura / 2 });
const dentro = (a, b, folga = 2) => a.x >= b.x - folga && a.y >= b.y - folga && a.x + a.largura <= b.x + b.largura + folga && a.y + a.altura <= b.y + b.altura + folga;
const area = e => e.largura * e.altura;
const raio = e => Number(e.estilo?.raio ?? 0);
const ehCirculo = e => e.tipo === "elipse" || (e.tipo === "forma" && e.forma === "elipse") || (Math.abs(e.largura - e.altura) <= 2 && raio(e) >= e.largura / 2 - 1);
const corClara = c => { const m = /^#([0-9a-f]{6})/i.exec(String(c ?? "")); if (!m) return String(c ?? "") === "transparent" || !c; const n = parseInt(m[1], 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 200; };
const regular = vals => { if (vals.length < 2) return false; const m = vals.reduce((s, v) => s + v, 0) / vals.length; if (m <= 0) return false; const d = Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length); return d / m < 0.25; };

/**
 * Propostas para um conjunto de elementos (os selecionados, ou os de um grupo).
 * @param {object[]} elementos — { id, tipo, x, y, largura, altura, estilo, texto/rotulo, ... }
 * @param {{largura, altura}} tela
 * @returns {{tipo, nome, confianca, motivos: string[], ids: string[], base: string|null}[]} da mais confiável para a menos
 */
export function classificar(elementos, tela = { largura: 1280, altura: 800 }, limiar = 0.6) {
  const els = elementos.filter(e => e && e.visivel !== false && e.largura > 0 && e.altura > 0);
  if (!els.length) return [];
  const ids = els.map(e => e.id);
  const bases = els.filter(e => FORMAS_BASE.has(e.tipo) && !TEXTOS.has(e.tipo)).sort((a, b) => area(b) - area(a));
  const base = bases[0] ?? null;
  const textos = els.filter(e => e !== base && TEXTOS.has(e.tipo) && textoDe(e));
  const nos = base ? els.filter(e => e !== base && dentro(e, base)) : [];
  const props = [];
  const propor = (tipo, confianca, motivos) => { if (confianca >= limiar) props.push({ tipo, nome: TIPOS_RECONHECIDOS[tipo].nome, confianca: Math.min(0.98, Math.round(confianca * 100) / 100), motivos, ids, base: base?.id ?? null }); };

  if (base) {
    const L = base.largura, A = base.altura, prop = L / A;
    const tx = textos.filter(t => dentro(t, base));
    const um = tx.length === 1 ? tx[0] : null;
    const pilula = raio(base) >= A / 2 - 2;
    // botão: forma baixa e larga com um texto curto centralizado
    if (um && A >= 24 && A <= 72 && prop >= 1.5 && prop <= 8 && textoDe(um).length <= 24) {
      const c = centro(um), cb = centro(base);
      if (Math.abs(c.x - cb.x) <= L * 0.15 && Math.abs(c.y - cb.y) <= A * 0.25) {
        const m = ["forma baixa e larga", "um texto curto centralizado"];
        let k = 0.62;
        if (raio(base) > 0) { k += 0.12; m.push("cantos arredondados"); }
        if (!corClara(base.estilo?.fundo)) { k += 0.12; m.push("fundo com cor de destaque"); }
        if ((um.estilo?.peso ?? 400) >= 600) { k += 0.06; m.push("texto em negrito"); }
        propor("botao", k, m);
      }
    }
    // campo: retângulo claro com borda, texto à esquerda
    if (A >= 28 && A <= 60 && prop >= 4 && (!um || um.x - base.x <= L * 0.25) && nos.length <= 2) {
      const m = ["retângulo baixo e comprido"];
      let k = 0.5;
      if (corClara(base.estilo?.fundo)) { k += 0.12; m.push("fundo claro"); }
      if (base.estilo?.borda && base.estilo.borda !== "transparent") { k += 0.12; m.push("tem borda"); }
      if (um) { k += 0.06; m.push("texto alinhado à esquerda"); if (/^#(9|a|b)/i.test(um.estilo?.cor ?? "")) { k += 0.06; m.push("texto cinza (parece dica)"); } }
      if (!um || Math.abs(centro(um).x - centro(base).x) > L * 0.15) propor("campo", k, m);
    }
    // selo: pílula pequena com texto curtíssimo
    if (um && A <= 28 && L <= 140 && pilula && textoDe(um).length <= 12) propor("selo", 0.78, ["pílula pequena", "texto curto"]);
    // interruptor: pílula com um círculo dentro e sem texto
    if (!tx.length && pilula && prop >= 1.5 && prop <= 2.8 && A <= 44 && nos.some(ehCirculo)) propor("interruptor", 0.82, ["pílula", "círculo dentro", "sem texto"]);
    // cartão: área grande com vários conteúdos
    if (L >= 160 && A >= 120 && nos.length >= 2) {
      const m = ["área grande", `${nos.length} conteúdos dentro`];
      let k = 0.6;
      const tam = tx.map(t => t.estilo?.tamanhoFonte ?? 14);
      if (tam.length >= 2 && Math.max(...tam) >= Math.min(...tam) * 1.3) { k += 0.1; m.push("título maior que o texto"); }
      if (raio(base) > 0 || base.estilo?.sombra) { k += 0.06; m.push("cantos ou sombra de cartão"); }
      propor("cartao", k, m);
    }
  }
  // listas de texto: menu (vertical) ou navegação (horizontal)
  const soltos = textos.length >= 3 ? textos : [];
  if (soltos.length >= 3) {
    const porY = [...soltos].sort((a, b) => a.y - b.y), porX = [...soltos].sort((a, b) => a.x - b.x);
    const mesmaColuna = porY.every(t => Math.abs(t.x - porY[0].x) <= 8);
    const mesmaLinha = porX.every(t => Math.abs(centro(t).y - centro(porX[0]).y) <= 8);
    if (mesmaColuna && regular(porY.slice(1).map((t, i) => t.y - porY[i].y))) propor("menu", base ? 0.78 : 0.7, [`${soltos.length} textos empilhados`, "espaçamento regular", ...(base ? ["sobre um fundo"] : [])]);
    if (mesmaLinha && regular(porX.slice(1).map((t, i) => t.x - (porX[i].x + porX[i].largura)))) {
      const topo = Math.min(...soltos.map(t => t.y)) < (tela.altura ?? 800) * 0.15;
      propor("navegacao", topo ? 0.8 : 0.66, [`${soltos.length} textos lado a lado`, "espaçamento regular", ...(topo ? ["no topo da tela"] : [])]);
    }
  }
  // avatar e ícone: um só elemento pequeno
  if (els.length <= 2) {
    const c = els.find(ehCirculo);
    const ini = textos.find(t => textoDe(t).length <= 2);
    if (c && c.largura <= 96 && (ini || els.length === 1 || els.some(e => e.tipo === "imagem"))) propor("avatar", ini ? 0.8 : 0.62, ["círculo pequeno", ...(ini ? ["iniciais dentro"] : [])]);
    const v = els.length === 1 ? els[0] : null;
    if (v && (v.tipo === "vetor" || v.tipo === "forma") && v.largura <= 48 && v.altura <= 48 && Math.abs(v.largura - v.altura) <= 8) propor("icone", 0.66, ["forma pequena e quase quadrada"]);
  }
  return props.sort((a, b) => b.confianca - a.confianca);
}
