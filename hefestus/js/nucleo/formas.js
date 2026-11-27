import { caminhoPoligono, caminhoEstrela, caminhoArco } from "./estiloAvancado.js";

// Biblioteca de formas vetoriais (viewBox 0 0 100 100), organizada como a galeria
// de Formas do PowerPoint. Cada forma vira um <path> que estica com o elemento.

export const FORMAS = {
  // Retângulos
  retangulo: { nome: "Retângulo", cat: "Retângulos", d: "M0 0H100V100H0Z" },
  retArredondado: { nome: "Retângulo arredondado", cat: "Retângulos", d: "M15 0H85Q100 0 100 15V85Q100 100 85 100H15Q0 100 0 85V15Q0 0 15 0Z" },
  cantoCortado: { nome: "Canto cortado", cat: "Retângulos", d: "M0 0H80L100 20V100H0Z" },
  cantosCortados: { nome: "Cantos cortados", cat: "Retângulos", d: "M20 0H80L100 20V100H0V20Z" },
  cantoArredondado: { nome: "Canto arredondado", cat: "Retângulos", d: "M0 0H80Q100 0 100 20V100H0Z" },
  // Formas básicas
  elipse: { nome: "Elipse", cat: "Formas básicas", d: "M50 0A50 50 0 1 1 49.99 0Z" },
  triangulo: { nome: "Triângulo", cat: "Formas básicas", d: "M50 0L100 100H0Z" },
  trianguloRetangulo: { nome: "Triângulo retângulo", cat: "Formas básicas", d: "M0 0L100 100H0Z" },
  losango: { nome: "Losango", cat: "Formas básicas", d: "M50 0L100 50L50 100L0 50Z" },
  paralelogramo: { nome: "Paralelogramo", cat: "Formas básicas", d: "M25 0H100L75 100H0Z" },
  trapezio: { nome: "Trapézio", cat: "Formas básicas", d: "M20 0H80L100 100H0Z" },
  pentagono: { nome: "Pentágono", cat: "Formas básicas", d: "M50 0L100 38L81 100H19L0 38Z" },
  hexagono: { nome: "Hexágono", cat: "Formas básicas", d: "M25 0H75L100 50L75 100H25L0 50Z" },
  octogono: { nome: "Octógono", cat: "Formas básicas", d: "M30 0H70L100 30V70L70 100H30L0 70V30Z" },
  cruz: { nome: "Cruz", cat: "Formas básicas", d: "M35 0H65V35H100V65H65V100H35V65H0V35H35Z" },
  anel: { nome: "Anel", cat: "Formas básicas", d: "M50 0A50 50 0 1 1 49.99 0ZM50 25A25 25 0 1 0 50.01 25Z", evenodd: true },
  moldura: { nome: "Moldura", cat: "Formas básicas", d: "M0 0H100V100H0ZM14 14V86H86V14Z", evenodd: true },
  coracao: { nome: "Coração", cat: "Formas básicas", d: "M50 96C22 74 0 57 0 32A25 25 0 0 1 50 20A25 25 0 0 1 100 32C100 57 78 74 50 96Z" },
  lua: { nome: "Lua", cat: "Formas básicas", d: "M72 4A48 48 0 1 0 72 96A40 40 0 1 1 72 4Z" },
  raio: { nome: "Raio", cat: "Formas básicas", d: "M58 0L14 58H47L37 100L86 38H53Z" },
  nuvem: { nome: "Nuvem", cat: "Formas básicas", d: "M24 86A20 20 0 0 1 20 47A24 24 0 0 1 64 28A20 20 0 0 1 93 54A16 16 0 0 1 80 86Z" },
  // Setas largas
  setaDireita: { nome: "Seta para a direita", cat: "Setas", d: "M0 30H60V5L100 50L60 95V70H0Z" },
  setaEsquerda: { nome: "Seta para a esquerda", cat: "Setas", d: "M100 30H40V5L0 50L40 95V70H100Z" },
  setaCima: { nome: "Seta para cima", cat: "Setas", d: "M30 100V40H5L50 0L95 40H70V100Z" },
  setaBaixo: { nome: "Seta para baixo", cat: "Setas", d: "M30 0V60H5L50 100L95 60H70V0Z" },
  setaDupla: { nome: "Seta dupla", cat: "Setas", d: "M0 50L25 15V35H75V15L100 50L75 85V65H25V85Z" },
  setaPentagono: { nome: "Pentágono (seta)", cat: "Setas", d: "M0 0H75L100 50L75 100H0Z" },
  chevron: { nome: "Divisa", cat: "Setas", d: "M0 0H70L100 50L70 100H0L30 50Z" },
  // Estrelas e faixas
  estrela4: { nome: "Estrela de 4 pontas", cat: "Estrelas e faixas", d: "M50 0L62 38L100 50L62 62L50 100L38 62L0 50L38 38Z" },
  estrela5: { nome: "Estrela de 5 pontas", cat: "Estrelas e faixas", d: "M50 0L61 35H98L68 57L79 92L50 70L21 92L32 57L2 35H39Z" },
  estrela6: { nome: "Estrela de 6 pontas", cat: "Estrelas e faixas", d: "M50 0L63 27H93L78 50L93 73H63L50 100L37 73H7L22 50L7 27H37Z" },
  explosao: { nome: "Explosão", cat: "Estrelas e faixas", d: "M50 0L60 26L85 15L74 40L100 50L74 60L85 85L60 74L50 100L40 74L15 85L26 60L0 50L26 40L15 15L40 26Z" },
  faixa: { nome: "Faixa", cat: "Estrelas e faixas", d: "M0 20H100L88 50L100 80H0L12 50Z" },
  selo: { nome: "Selo", cat: "Estrelas e faixas", d: "M50 0L58 10L71 6L74 19L87 22L83 35L94 44L84 53L90 66L77 70L76 83L63 82L56 94L50 84L44 94L37 82L24 83L23 70L10 66L16 53L6 44L17 35L13 22L26 19L29 6L42 10Z" },
  // Textos explicativos (balões)
  balao: { nome: "Balão retangular", cat: "Textos explicativos", d: "M0 0H100V70H45L25 100L28 70H0Z" },
  balaoArredondado: { nome: "Balão arredondado", cat: "Textos explicativos", d: "M10 0H90Q100 0 100 10V60Q100 70 90 70H45L25 100L28 70H10Q0 70 0 60V10Q0 0 10 0Z" },
  balaoOval: { nome: "Balão oval", cat: "Textos explicativos", d: "M50 0C78 0 100 15 100 35S78 70 50 70Q42 70 35 68L18 100L24 63C9 57 0 47 0 35C0 15 22 0 50 0Z" },
  // Fluxograma
  processo: { nome: "Processo", cat: "Fluxograma", d: "M0 0H100V100H0Z" },
  decisao: { nome: "Decisão", cat: "Fluxograma", d: "M50 0L100 50L50 100L0 50Z" },
  terminal: { nome: "Terminação", cat: "Fluxograma", d: "M25 0H75A25 50 0 0 1 75 100H25A25 50 0 0 1 25 0Z" },
  dados: { nome: "Dados", cat: "Fluxograma", d: "M20 0H100L80 100H0Z" },
  documento: { nome: "Documento", cat: "Fluxograma", d: "M0 0H100V82Q75 66 50 82T0 82Z" },
  banco: { nome: "Banco de dados", cat: "Fluxograma", d: "M0 14A50 14 0 0 1 100 14V86A50 14 0 0 1 0 86ZM0 14A50 14 0 0 0 100 14" },
  conector: { nome: "Conector", cat: "Fluxograma", d: "M50 0A50 50 0 1 1 49.99 0Z" },
  // Paramétricas: o desenho vem dos números (lados, razão, ângulos), editáveis no painel
  poligono: { nome: "Polígono", cat: "Paramétricas", d: caminhoPoligono(6), param: true },
  estrela: { nome: "Estrela", cat: "Paramétricas", d: caminhoEstrela(5, 0.45), param: true },
  arco: { nome: "Arco / anel", cat: "Paramétricas", d: caminhoArco(0, 270, 30), param: true },
  vetor: { nome: "Vetor livre", cat: "Paramétricas", d: "M10 90L50 10L90 90Z", param: true },
};

export const CATEGORIAS_FORMAS = ["Retângulos", "Formas básicas", "Setas", "Estrelas e faixas", "Textos explicativos", "Fluxograma", "Paramétricas"];

/** Formas por categoria, na ordem da galeria. */
export function formasPorCategoria() {
  return CATEGORIAS_FORMAS.map(cat => ({
    nome: cat,
    itens: Object.entries(FORMAS).filter(([, f]) => f.cat === cat).map(([id, f]) => ({ id, ...f })),
  }));
}

/** Miniatura SVG de uma forma para galerias (contorno na cor do texto). */
export function miniaturaForma(id, tam = 20) {
  const f = FORMAS[id] ?? FORMAS.retangulo;
  return `<svg class="ic" width="${tam}" height="${tam}" viewBox="-6 -6 112 112" aria-hidden="true"><path d="${f.d}" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"${f.evenodd ? ' fill-rule="evenodd"' : ""}/></svg>`;
}

/** Estilos de forma prontos (como os "Abc" do PowerPoint): fundo, borda, texto. */
export const ESTILOS_FORMA = [
  { nome: "Contorno azul", fundo: "#ffffff", borda: "#4472c4", cor: "#1f2937" },
  { nome: "Contorno verde", fundo: "#ffffff", borda: "#70ad47", cor: "#1f2937" },
  { nome: "Preto", fundo: "#000000", borda: "#000000", cor: "#ffffff" },
  { nome: "Azul", fundo: "#4472c4", borda: "#2f528f", cor: "#ffffff" },
  { nome: "Laranja", fundo: "#ed7d31", borda: "#ae5a21", cor: "#ffffff" },
  { nome: "Cinza", fundo: "#a5a5a5", borda: "#787878", cor: "#ffffff" },
  { nome: "Amarelo", fundo: "#ffc000", borda: "#bc8c00", cor: "#1f2937" },
  { nome: "Verde", fundo: "#70ad47", borda: "#507e32", cor: "#ffffff" },
  { nome: "Azul suave", fundo: "#dae3f3", borda: "#4472c4", cor: "#1f2937" },
  { nome: "Laranja suave", fundo: "#fbe5d6", borda: "#ed7d31", cor: "#1f2937" },
  { nome: "Verde suave", fundo: "#e2f0d9", borda: "#70ad47", cor: "#1f2937" },
  { nome: "Grafite", fundo: "#44546a", borda: "#2c3846", cor: "#ffffff" },
];

/** Paleta para Preenchimento e Contorno (cores do tema, como no Office). */
export const PALETA = [
  "#ffffff", "#000000", "#e7e6e6", "#44546a", "#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5", "#70ad47",
  "#f2f2f2", "#7f7f7f", "#d0cece", "#d6dce5", "#dae3f3", "#fbe5d6", "#ededed", "#fff2cc", "#deebf7", "#e2f0d9",
  "#c00000", "#ff0000", "#ffc000", "#ffff00", "#92d050", "#00b050", "#00b0f0", "#0070c0", "#002060", "#7030a0",
];
