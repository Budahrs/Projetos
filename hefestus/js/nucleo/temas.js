// Temas completos de um clique: uma paleta + formato que se aplica a TODOS os itens do formulário.
export const TEMAS = {
  axiom: { nome: "Axiom (azul escuro)", fundo: "#0b1a2e", painel: "#10243d", borda: "#1f4166", texto: "#e6f1f8", sub: "#8fb3c9", acento: "#22d3ee", acentoTexto: "#041b24", hover: "#ffffff14", raio: 10, efeito: "brilho", formatoAba: "arredondada", banda: "#071221" },
  hefestus: { nome: "Hefestus (forja âmbar)", fundo: "#14110f", painel: "#201a15", borda: "#4a3320", texto: "#f5e9dc", sub: "#b79a7c", acento: "#f59e0b", acentoTexto: "#1c1003", hover: "#ffffff12", raio: 8, efeito: "brilho", formatoAba: "quadrada", banda: "#0c0a08" },
  hospitalar: { nome: "Hospitalar (claro limpo)", fundo: "#f4f9fa", painel: "#ffffff", borda: "#cfe3e8", texto: "#12333b", sub: "#5b7f88", acento: "#0d9488", acentoTexto: "#ffffff", hover: "#0d94881a", raio: 10, efeito: "nenhum", formatoAba: "arredondada", banda: "#0d9488" },
  vidro: { nome: "Vidro (glassmorphism)", fundo: "#1b2a58", painel: "#ffffff1f", borda: "#ffffff40", texto: "#f3f7ff", sub: "#c4d3f5", acento: "#9ec1ff", acentoTexto: "#0b1a3d", hover: "#ffffff22", raio: 16, efeito: "vidro", formatoAba: "pilula", banda: "#16224a" },
  neon: { nome: "Neon (cyber)", fundo: "#0a0614", painel: "#120a22", borda: "#a21caf", texto: "#f5e8ff", sub: "#c084fc", acento: "#e879f9", acentoTexto: "#1b0524", hover: "#e879f922", raio: 12, efeito: "neon", formatoAba: "pilula", banda: "#06030d" },
  industrial: { nome: "Industrial (aço)", fundo: "#1f2328", painel: "#2b3037", borda: "#454c55", texto: "#e5e7eb", sub: "#9aa3ad", acento: "#fbbf24", acentoTexto: "#201600", hover: "#ffffff14", raio: 4, efeito: "sombra", formatoAba: "cartao", banda: "#15181b" },
  minimalista: { nome: "Minimalista (claro)", fundo: "#ffffff", painel: "#ffffff", borda: "#e5e7eb", texto: "#1f2937", sub: "#6b7280", acento: "#2563eb", acentoTexto: "#ffffff", hover: "#f3f4f6", raio: 6, efeito: "nenhum", formatoAba: "sublinhada", banda: "#ffffff" },
  fluent: { nome: "Fluent (Office moderno)", fundo: "#f3f3f3", painel: "#ffffff", borda: "#d6d6d6", texto: "#1b1b1b", sub: "#605e5c", acento: "#0f6cbd", acentoTexto: "#ffffff", hover: "#0f6cbd14", raio: 6, efeito: "sombra", formatoAba: "quadrada", banda: "#0f6cbd" },
  retro: { nome: "Retrô (madeira / jogo)", fundo: "#3b2a1a", painel: "#4a3522", borda: "#8a6a3f", texto: "#f6e7c8", sub: "#c9ab78", acento: "#e0a93b", acentoTexto: "#2a1a05", hover: "#ffffff14", raio: 6, efeito: "borda", formatoAba: "cartao", banda: "#2a1d11" },
};
export const FORMATOS_ABA = [["quadrada", "Quadrada"], ["arredondada", "Arredondada"], ["pilula", "Pílula"], ["cartao", "Cartão (cantos de cima)"], ["sublinhada", "Sublinhada"], ["paralelogramo", "Paralelogramo (inclinada)"], ["hexagono", "Hexágono (pontas)"], ["pasta", "Pasta (aba une ao painel)"], ["curva", "Curva suave (estilo navegador)"], ["chanfrada", "Chanfrada (cantos cortados)"], ["mista", "Mista (borda esquerda de um + direita de outro)"]];
export const BORDAS_ABA = [["reta", "Reta |"], ["barra", "Inclinada /"], ["contra", "Inclinada contra"], ["ponta", "Ponta ‹ ›"], ["redonda", "Redonda ( )"], ["suave", "Curva suave S"], ["chanfro", "Chanfro (canto cortado)"], ["degrau", "Degrau"]];
export const ANIM_HOVER = [["nenhuma", "Nenhuma"], ["brilho", "Brilho"], ["elevar", "Elevar"], ["escala", "Crescer"], ["balanco", "Balançar"]];
export const ANIM_CLIQUE = [["nenhuma", "Nenhuma"], ["afundar", "Afundar"], ["pulso", "Pulso"], ["ondulacao", "Ondulação (onda)"]];
export const ANIM_TEMA = { neon: ["brilho", "ondulacao"], vidro: ["elevar", "ondulacao"], retro: ["balanco", "afundar"], industrial: ["brilho", "afundar"], fluent: ["brilho", "ondulacao"] };
export const MASCARAS_ABA = { paralelogramo: "M12 0 L100 0 L88 100 L0 100 Z", hexagono: "M10 0 L90 0 L100 50 L90 100 L10 100 L0 50 Z" };
export const VARIANTES_LATERAL = [["solida", "Sólida"], ["flutuante", "Flutuante (cantos e sombra)"], ["vidro", "Vidro"], ["neon", "Neon"]];

/** Aplica o tema a todos os itens do formulário (muta o spec). */
export function aplicarTema(spec, chave) {
  const t = TEMAS[chave]; if (!t) return false;
  spec.tema = chave;
  const an = ANIM_TEMA[chave] ?? ["brilho", "afundar"];
  const ef = t.efeito;
  for (const it of spec.itens) {
    it.animHover = an[0]; it.animClique = an[1];
    switch (it.tipo) {
      case "ribbon":
        Object.assign(it, { estilo: "", banda: t.banda, corpoFundo: t.painel === "#ffffff1f" ? t.fundo : t.painel, corpoBorda: t.borda, abaTexto: ["hospitalar", "fluent"].includes(chave) ? "#ffffff" : t.texto,
          abaAtivaFundo: t.painel === "#ffffff1f" ? t.fundo : t.painel, abaAtivaTexto: t.acento, corRotulo: t.texto, formatoAba: t.formatoAba });
        for (const a of it.abas) for (const g of a.grupos) Object.assign(g, { cor: t.acento, hoverFundo: t.hover, raio: 0 });
        break;
      case "menu": Object.assign(it, { fundo: t.painel, borda: t.borda, cor: t.texto, corAtalho: t.sub, hoverFundo: t.hover, raio: t.raio, efeito: ef === "borda" ? "nenhum" : ef, acento: t.acento }); break;
      case "blocos": Object.assign(it, { fundo: t.painel, borda: t.borda, cor: t.texto, corSub: t.sub, corIcone: t.acento, hoverFundo: t.hover, raio: t.raio, efeito: ef, acento: t.acento }); break;
      case "lateral": Object.assign(it, { fundo: t.fundo, cor: t.sub, fundoAtivo: t.acento, corAtiva: t.acentoTexto, corMarca: t.texto, hoverFundo: t.hover, raio: chave === "vidro" || chave === "neon" ? t.raio : 0, variante: chave === "vidro" ? "vidro" : chave === "neon" ? "neon" : "solida", acento: t.acento }); break;
      case "abasDoc": Object.assign(it, { fundo: t.fundo, corAba: t.painel, cor: t.sub, corAtiva: t.acento, corTextoAtivo: t.acentoTexto, formato: t.formatoAba, acento: t.acento }); break;
      case "componente": Object.assign(it, { fundo: t.painel, borda: t.borda, cor: t.texto, corSub: t.sub, acento: t.acento, corAcentoTexto: t.acentoTexto, raio: t.raio, efeito: ef === "borda" ? "nenhum" : ef }); break;
      case "caixa":
        it.estilo = { ...(it.estilo ?? {}), fundo: t.painel, borda: t.borda, larguraBorda: Math.max(1, it.estilo?.larguraBorda ?? 0), raio: t.raio };
        it.efeito = ef; it.acento = t.acento;
        for (const f of it.filhos ?? []) {
          if (f.tipo === "botao") Object.assign(f, { fundo: t.acento, cor: t.acentoTexto });
          else if (f.tipo === "icone") f.cor = t.acento;
          else f.cor = t.texto;
        }
        break;
    }
  }
  return true;
}

const ESQ = {
  reta: { ini: 0, bot: 0, sobe: "L 0 0" }, barra: { ini: 12, bot: 0, sobe: "L 12 0" }, contra: { ini: 0, bot: 12, sobe: "L 0 0" },
  ponta: { ini: 10, bot: 10, sobe: "L 0 50 L 10 0" }, redonda: { ini: 12, bot: 12, sobe: "C 3 100 0 85 0 50 C 0 15 3 0 12 0" },
  suave: { ini: 16, bot: 0, sobe: "C 5 100 7 92 8 75 L 10 25 C 11 8 12 0 16 0" }, chanfro: { ini: 10, bot: 0, sobe: "L 0 30 L 10 0" }, degrau: { ini: 8, bot: 0, sobe: "L 0 50 L 8 50 L 8 0" },
};
const DIR = {
  reta: { topo: 100, desce: "L 100 100" }, barra: { topo: 100, desce: "L 88 100", bot: 88 }, contra: { topo: 88, desce: "L 100 100" },
  ponta: { topo: 90, desce: "L 100 50 L 90 100", bot: 90 }, redonda: { topo: 88, desce: "C 97 0 100 15 100 50 C 100 85 97 100 88 100", bot: 88 },
  suave: { topo: 84, desce: "C 88 0 89 8 90 25 L 92 75 C 93 92 95 100 100 100" }, chanfro: { topo: 90, desce: "L 100 30 L 100 100" }, degrau: { topo: 92, desce: "L 92 50 L 100 50 L 100 100" },
};
/** Contorno (viewBox 0–100, esticado) de uma aba com a borda esquerda de um estilo e a direita de outro. */
export function mascaraMista(esq, dir) {
  const E = ESQ[esq] ?? ESQ.barra, D = DIR[dir] ?? DIR.ponta;
  return `M ${E.ini} 0 L ${D.topo} 0 ${D.desce} L ${E.bot} 100 ${E.sobe} Z`;
}
/** Fração da largura "perdida" nas pontas (usada para a aba se ajustar ao texto sem cortá-lo). */
export const recuoAba = (fmt, it = {}) => {
  const par = fmt === "mista" ? [it.abaEsq ?? "barra", it.abaDir ?? "ponta"] : PARES[fmt];
  if (par) { const E = ESQ[par[0]] ?? ESQ.barra, D = DIR[par[1]] ?? DIR.ponta; return Math.min(0.4, (E.ini + (100 - D.topo)) / 100); }
  return fmt === "paralelogramo" ? 0.24 : fmt === "hexagono" ? 0.2 : 0;
};
/** Largura estimada de um texto (fonte do sistema): estreitas, largas e maiúsculas pesam diferente. */
export const larguraTexto = (t, px = 13) => Math.ceil([...String(t ?? "")].reduce((a, c) => a + (/[ilj.,;:'!|ft]/.test(c) ? .34 : /[mwMW@]/.test(c) ? .92 : /[A-Z0-9]/.test(c) ? .66 : .56), 0) * px);
/** Largura da aba: texto + respiro + recuo das pontas (+ botão de fechar). */
export const larguraAba = (nome, fmt, it = {}, extra = 0, px = 13, min = 56) => Math.max(min, Math.ceil((larguraTexto(nome, px) + 24 + extra) / (1 - recuoAba(fmt, it))));
const PARES = { curva: ["suave", "suave"], chanfrada: ["chanfro", "chanfro"] };
/** Máscara da aba conforme o formato do item (null quando o formato não usa máscara). */
export const mascaraAba = (fmt, it = {}) => (fmt === "mista" ? mascaraMista(it.abaEsq ?? "barra", it.abaDir ?? "ponta") : PARES[fmt] ? mascaraMista(...PARES[fmt]) : MASCARAS_ABA[fmt] ?? null);
