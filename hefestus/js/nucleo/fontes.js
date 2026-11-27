// Biblioteca de fontes. Cada fonte tem uma pilha CSS com alternativas do sistema.
// As marcadas com `google` são carregadas do Google Fonts no editor e no HTML exportado.

export const FONTES_BIB = {
  // Sem serifa
  sistema: { nome: "Sistema", cat: "Sem serifa", pilha: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
  segoe: { nome: "Segoe UI", cat: "Sem serifa", pilha: '"Segoe UI", system-ui, sans-serif' },
  arial: { nome: "Arial", cat: "Sem serifa", pilha: "Arial, Helvetica, sans-serif" },
  verdana: { nome: "Verdana", cat: "Sem serifa", pilha: "Verdana, Geneva, sans-serif" },
  tahoma: { nome: "Tahoma", cat: "Sem serifa", pilha: "Tahoma, Verdana, sans-serif" },
  trebuchet: { nome: "Trebuchet MS", cat: "Sem serifa", pilha: '"Trebuchet MS", Helvetica, sans-serif' },
  calibri: { nome: "Calibri", cat: "Sem serifa", pilha: "Calibri, Carlito, sans-serif" },
  inter: { nome: "Inter", cat: "Sem serifa", pilha: '"Inter", system-ui, sans-serif', google: "Inter:wght@400;500;600;700" },
  roboto: { nome: "Roboto", cat: "Sem serifa", pilha: '"Roboto", system-ui, sans-serif', google: "Roboto:wght@400;500;700" },
  opensans: { nome: "Open Sans", cat: "Sem serifa", pilha: '"Open Sans", system-ui, sans-serif', google: "Open+Sans:wght@400;600;700" },
  montserrat: { nome: "Montserrat", cat: "Sem serifa", pilha: '"Montserrat", system-ui, sans-serif', google: "Montserrat:wght@400;600;700" },
  poppins: { nome: "Poppins", cat: "Sem serifa", pilha: '"Poppins", system-ui, sans-serif', google: "Poppins:wght@400;600;700" },
  plex: { nome: "IBM Plex Sans", cat: "Sem serifa", pilha: '"IBM Plex Sans", system-ui, sans-serif', google: "IBM+Plex+Sans:wght@400;500;600" },
  // Serifa
  serifa: { nome: "Georgia", cat: "Serifa", pilha: 'Georgia, "Times New Roman", serif' },
  times: { nome: "Times New Roman", cat: "Serifa", pilha: '"Times New Roman", Times, serif' },
  cambria: { nome: "Cambria", cat: "Serifa", pilha: "Cambria, Caladea, Georgia, serif" },
  garamond: { nome: "Garamond", cat: "Serifa", pilha: 'Garamond, "EB Garamond", Georgia, serif' },
  lora: { nome: "Lora", cat: "Serifa", pilha: '"Lora", Georgia, serif', google: "Lora:wght@400;600;700" },
  merriweather: { nome: "Merriweather", cat: "Serifa", pilha: '"Merriweather", Georgia, serif', google: "Merriweather:wght@400;700" },
  playfair: { nome: "Playfair Display", cat: "Serifa", pilha: '"Playfair Display", Georgia, serif', google: "Playfair+Display:wght@400;600;700" },
  // Monoespaçada
  mono: { nome: "Monoespaçada", cat: "Monoespaçada", pilha: 'ui-monospace, "Cascadia Mono", Consolas, monospace' },
  consolas: { nome: "Consolas", cat: "Monoespaçada", pilha: 'Consolas, "Cascadia Mono", monospace' },
  courier: { nome: "Courier New", cat: "Monoespaçada", pilha: '"Courier New", Courier, monospace' },
  jetbrains: { nome: "JetBrains Mono", cat: "Monoespaçada", pilha: '"JetBrains Mono", Consolas, monospace', google: "JetBrains+Mono:wght@400;600" },
  firacode: { nome: "Fira Code", cat: "Monoespaçada", pilha: '"Fira Code", Consolas, monospace', google: "Fira+Code:wght@400;600" },
  // Arredondada
  arredondada: { nome: "Nunito", cat: "Arredondada", pilha: '"Nunito", "Varela Round", system-ui, sans-serif', google: "Nunito:wght@400;600;700" },
  quicksand: { nome: "Quicksand", cat: "Arredondada", pilha: '"Quicksand", system-ui, sans-serif', google: "Quicksand:wght@400;600;700" },
  varela: { nome: "Varela Round", cat: "Arredondada", pilha: '"Varela Round", system-ui, sans-serif', google: "Varela+Round" },
  // Títulos e destaque
  oswald: { nome: "Oswald", cat: "Títulos", pilha: '"Oswald", Impact, sans-serif', google: "Oswald:wght@400;600" },
  bebas: { nome: "Bebas Neue", cat: "Títulos", pilha: '"Bebas Neue", Impact, sans-serif', google: "Bebas+Neue" },
  impact: { nome: "Impact", cat: "Títulos", pilha: 'Impact, "Arial Narrow Bold", sans-serif' },
  cinzel: { nome: "Cinzel", cat: "Títulos", pilha: '"Cinzel", Georgia, serif', google: "Cinzel:wght@400;600" },
  // Manuscrita
  caveat: { nome: "Caveat", cat: "Manuscrita", pilha: '"Caveat", "Segoe Print", cursive', google: "Caveat:wght@400;600" },
  pacifico: { nome: "Pacifico", cat: "Manuscrita", pilha: '"Pacifico", "Segoe Script", cursive', google: "Pacifico" },
  segoeprint: { nome: "Segoe Print", cat: "Manuscrita", pilha: '"Segoe Print", "Comic Sans MS", cursive' },
};

export const CATEGORIAS_FONTES = ["Sem serifa", "Serifa", "Monoespaçada", "Arredondada", "Títulos", "Manuscrita"];

/** Pilhas CSS por chave (usado pelo exportador). */
export const FONTES = Object.fromEntries(Object.entries(FONTES_BIB).map(([k, f]) => [k, f.pilha]));

/** Link do Google Fonts para um conjunto de chaves (ou todas). Vazio se nenhuma precisa. */
export function linkGoogleFonts(chaves = Object.keys(FONTES_BIB)) {
  const fams = [...new Set(chaves.map(k => FONTES_BIB[k]?.google).filter(Boolean))];
  if (!fams.length) return "";
  return `https://fonts.googleapis.com/css2?${fams.map(f => `family=${f}`).join("&")}&display=swap`;
}
