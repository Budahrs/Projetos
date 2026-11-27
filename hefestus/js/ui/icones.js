import { iconeHephaestus } from './iconesHephaestus.js';
import { ICONES_MD, CATEGORIAS_MD } from "./icones-md.js";
import { ICONES_WINDOWS } from "./iconesWindows.js";
import { P_EXTRA, CATEGORIAS_EXTRA, COR, NOMES_COR, COR_CATEGORIA, COR_SEMANTICA } from "./icones-extra.js";

// Ícones de traço (24×24, stroke 1.6). Desenhados para o Hefestus.
const P = {
  aplicativo: "M3 4h18v16H3zM3 9h18M6 6.5h.01M9 6.5h.01M8 13h8M8 16h5",
  instalador: "M3 9l9-6 9 6v11H3zM3 9h18M12 10v7M9 14l3 3 3-3",
  // rede e monitoramento (NOC)
  switchRede: "M2 8h20v8H2zM5 12h2M9 12h2M13 12h2M17 12h2",
  roteador: "M3 14h18v6H3zM7 17h.01M11 17h.01M7 14l-2-4M17 14l2-4M12 14V8M9 5.5a4.2 4.2 0 0 1 6 0",
  firewall: "M3 5h18v14H3zM3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19",
  accessPoint: "M3 16h18v4H3zM7 18h.01M12 16v-4M8.5 9.5a5 5 0 0 1 7 0M6 7a8.5 8.5 0 0 1 12 0",
  servidor: "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01M12 7h4M12 17h4",
  rack: "M5 3h14v18H5zM5 8h14M5 13h14M5 18h14M8 5.5h.01M8 10.5h.01M8 15.5h.01",
  bancoDados: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  nobreak: "M5 3h14v18H5zM13 7l-3 5h4l-3 5",
  tablet: "M6 2h12v20H6zM11 19h2",
  televisao: "M3 5h18v12H3zM8 21h8M12 17v4",
  impressora: "M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z",
  cameraIp: "M3 8h13v8H3zM16 11.5l5-3v7l-5-3M7 16v3h6v-3",
  sensor: "M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM7.5 7.5a6 6 0 0 0 0 9M16.5 7.5a6 6 0 0 1 0 9M4.5 5a10 10 0 0 0 0 14M19.5 5a10 10 0 0 1 0 14",
  vpn: "M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6zM9.5 12h5v4h-5zM10.5 12v-1.5a1.5 1.5 0 0 1 3 0V12",
  dns: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  topologia: "M9 3h6v5H9zM3 16h6v5H3zM15 16h6v5h-6zM12 8v4M6 16v-4h12v4",
  pulso: "M3 12h4l2-6 4 12 2-6h6",
  monitorPulso: "M3 4h18v12H3zM8 20h8M12 16v4M6 10h3l1.5-3 2 6 1.5-3h2",
  hospital: "M4 21V6l8-3 8 3v15zM12 8v6M9 11h6M10 21v-4h4v4",
  velocimetro: "M4 18a8.5 8.5 0 1 1 16 0M12 18l4-6M8 18h.01",
  linkAtivo: "M2 12h5M17 12h5M7 8h10v8H7z",
  linkInativo: "M2 12h5M17 12h5M7 8h10v8H7zM4 20L20 4",
  linkLento: "M2 12h3M8 12h3M14 12h3M20 12h2",
  // arquivo
  novo: "M6 3h8l4 4v14H6zM14 3v4h4M12 11v6M9 14h6",
  abrir: "M3 7h6l2 2h10v10H3zM3 7V5h6",
  salvar: "M5 3h11l3 3v15H5zM8 3v5h7V3M8 21v-7h8v7",
  exportar: "M12 3v12M7 8l5-5 5 5M5 15v6h14v-6",
  copiar: "M8 8h11v13H8zM5 16H4V3h11v1",
  // edição
  desfazer: "M9 7H4V2M4 7a9 9 0 1 1-1 7",
  refazer: "M15 7h5V2M20 7a9 9 0 1 0 1 7",
  duplicar: "M8 8h12v12H8zM4 4h12v2M4 4v12h2M14 11v6M11 14h6",
  excluir: "M4 7h16M10 3h4M6 7l1 14h10l1-14M10 11v6M14 11v6",
  frente: "M8 8h12v12H8zM4 4h10v2H6v8H4z",
  tras: "M4 4h12v12H4zM18 8h2v12H8v-2",
  travar: "M7 11h10v10H7zM9 11V7a3 3 0 0 1 6 0v4",
  destravar: "M7 11h10v10H7zM9 11V7a3 3 0 0 1 6 0",
  alinhar: "M4 3v18M8 7h12v4H8zM8 14h7v4H8z",
  "al-esq": "M4 3v18M8 7h12v4H8zM8 14h7v4H8z",
  "al-centroH": "M12 3v18M6 7h12v4H6zM8 14h8v4H8z",
  "al-dir": "M20 3v18M4 7h12v4H4zM9 14h7v4H9z",
  "al-topo": "M3 4h18M7 8h4v12H7zM14 8h4v7h-4z",
  "al-centroV": "M3 12h18M7 6h4v12H7zM14 8h4v8h-4z",
  "al-base": "M3 20h18M7 4h4v12H7zM14 9h4v7h-4z",
  // inserir
  caixa: "M4 5h16v14H4z",
  texto: "M5 5h14M12 5v14M9 19h6",
  botao: "M3 8h18v8H3zM8 12h8",
  campo: "M3 7h18v10H3zM7 10v4",
  toggle: "M3 8h18v8H3zM15 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0",
  menu: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
  modal: "M3 3h18v18H3zM7 7h10v8H7zM7 18h10",
  toast: "M4 14h16v6H4zM7 17h7M12 4v6M9 7l3 3 3-3",
  // design
  tema: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-1.3-1.2-1.5-1.2-2.6 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8zM7.5 12h.01M9.5 8h.01M14.5 8h.01",
  tela: "M3 4h18v12H3zM8 20h8M12 16v4",
  grade: "M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18",
  ima: "M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3zM6 7h4M14 7h4",
  // comportamento
  previa: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  estados: "M4 12h4l3-7 3 14 3-7h3",
  raio: "M13 2 4 14h7l-1 8 9-12h-7z",
  sinal: "M4 12a8 8 0 0 1 16 0M8 12a4 4 0 0 1 8 0M12 12v8",
  acess: "M12 4m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 8l7 2 7-2M12 10v5l-3 6M12 15l3 6",
  // histórico e proteção
  relogio: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 2",
  escudo: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  // painéis
  ferramentas: "M14 4l6 6-9 9H5v-6zM12 6l6 6",
  camadas: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  propriedades: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4",
  caneta: "M12 3l7 9-7 9-7-9zM12 3v9.5M10.5 14a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0",
  nos: "M4 18C7 5 17 5 20 18M3 17h3v3H3zM18 17h3v3h-3zM10.5 5h3v3h-3z",
  boolUnir: "M3 3h11v7h7v11H10v-7H3z",
  boolSubtrair: "M3 3h11v7h-4v4H3zM10 14v7h11V10h-7",
  boolInterseccao: "M3 3h11v11H3zM10 10h11v11H10zM10 14l4-4M10 12l2-2M12 14l2-2",
  boolExcluir: "M3 3h11v7h7v11H10v-7H3zM10 10h4v4h-4z",
  agrupar: "M2 2h4M10 2h4M18 2h4M2 22h4M10 22h4M18 22h4M2 2v4M2 10v4M2 18v4M22 2v4M22 10v4M22 18v4M6 7h7v7H6zM11 11h7v7h-7z",
  desagrupar: "M3 3h8v8H3zM13 13h8v8h-8zM15 5l4 4M19 5l-4 4",
  mascaraCriar: "M3 3h18v18H3zM12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10",
  mascaraLiberar: "M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10",
  pincel: "M18 3l3 3-9 9-3-3zM9 12c-3 0-5 2-5 5 0 1-1 2-2 2 2 2 5 2 7 0 1.5-1.5 2-3 2-4z",
  // ui
  buscar: "M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M21 21l-5-5",
  fechar: "M6 6l12 12M18 6 6 18",
  setaBaixo: "M6 9l6 6 6-6",
  setaCima: "M6 15l6-6 6 6",
  setaDiagonal: "M7 7h10v10M17 7L7 17",
  setaDir: "M9 6l6 6-6 6",
  mais: "M12 5v14M5 12h14",
  menos: "M5 12h14",
  olho: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  olhoFechado: "M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.4 4M6.5 7.6C3.8 9.4 2 12 2 12s4 7 10 7c1.7 0 3.2-.5 4.5-1.2",
  codigo: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16",
  design: "M3 21l4-1L19 8l-3-3L4 17zM14 7l3 3",
  chat: "M4 5h16v11H10l-5 4v-4H4zM8 9.5h8M8 12.5h5",
  // ferramentas e formas
  seta: "M5 3l13 8-6 1.5L9 19z",
  mao: "M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.6-2.2L3 15.5a1.5 1.5 0 0 1 2.3-1.9L8 16",
  zoom: "M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M21 21l-5-5M8 11h6M11 8v6",
  elipse: "M12 12m-9 0a9 7 0 1 0 18 0a9 7 0 1 0-18 0",
  linha: "M5 19L19 5",
  icone: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  contaGotas: "M14 4l6 6M17 7l-9 9-4 1 1-4 9-9M4 20l1-1",
  girar: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  girarEsq: "M4 11a8 8 0 1 1 2.3 5.7M4 4v7h7",
  espelharH: "M12 3v18M8 7l-5 5 5 5zM16 7l5 5-5 5z",
  espelharV: "M3 12h18M7 8l5-5 5 5zM7 16l5 5 5-5z",
  distH: "M4 3v18M20 3v18M9 8h6v8H9z",
  distV: "M3 4h18M3 20h18M8 9h8v6H8z",
  regua: "M3 15l12-12 6 6-12 12zM7 11l2 2M10 8l2 2M13 5l2 2",
  guia: "M3 9h18M9 3v18",
  telaCheia: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  efeitos: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  selTudo: "M4 4h4M10 4h4M16 4h4v4M20 10v4M20 16v4h-4M14 20h-4M8 20H4v-4M4 14v-4M4 8V4M8 8h8v8H8z",
  // biblioteca de ícones de menu
  imprimir: "M7 9V3h10v6M7 17H4V9h16v8h-3M7 14h10v7H7z",
  pasta: "M3 6h7l2 2h9v12H3z",
  documento: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  baixar: "M12 4v11M7 10l5 5 5-5M5 20h14",
  enviarArquivo: "M12 20V9M7 14l5-5 5 5M5 4h14",
  nuvem: "M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z",
  cortar: "M3 6a3 3 0 1 0 6 0 3 3 0 1 0-6 0M3 18a3 3 0 1 0 6 0 3 3 0 1 0-6 0M8.5 7.6 20 18M8.5 16.4 20 6",
  colar: "M9 3h6v3H9zM9 4.5H6V21h12V4.5h-3",
  editar: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  hamburguer: "M4 6h16M4 12h16M4 18h16",
  setaEsq: "M15 6l-6 6 6 6",
  voltar: "M19 12H5M11 6l-6 6 6 6",
  avancar: "M5 12h14M13 6l6 6-6 6",
  maisOpcoes: "M4 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0M10.5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0M17 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0",
  lista: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  painelLateral: "M3 4h18v16H3zM9 4v16",
  grafico: "M4 20V11M10 20V5M16 20v-6M21 20H3",
  usuarios: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2.5.6 4 2.8 4 6",
  sair: "M10 4H5v16h5M15 8l4 4-4 4M19 12H9",
  entrar: "M14 4h5v16h-5M10 8l4 4-4 4M14 12H4",
  chave: "M4 15a4 4 0 1 0 8 0 4 4 0 1 0-8 0M11 12l8-8M16 7l2 2M18 5l2 2",
  compartilhar: "M15.5 5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M3.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M15.5 19a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  enviar: "M21 3 3 10l7 3 3 7zM10 13l5-5",
  imagem: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M14 9a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM8.5 13.5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0",
  play: "M7 4l13 8-13 8z",
  pausa: "M7 4h3v16H7zM14 4h3v16h-3z",
  volume: "M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12",
  microfone: "M9 4a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8",
  ajuda: "M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01",
  calendario: "M4 5h16v16H4zM4 10h16M8 3v4M16 3v4",
  filtro: "M3 4h18l-7 9v7l-4-2v-5z",
  ordenar: "M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4",
  etiqueta: "M3 3h8l10 10-8 8L3 11zM7.5 7.5h.01",
  sacola: "M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2",
  cartao: "M3 6h18v12H3zM3 10h18M7 15h4",
  presente: "M4 10h16v11H4zM3 7h18v3H3zM12 7v14M12 7c-2-4-6-4-6-1s6 1 6 1zM12 7c2-4 6-4 6-1s-6 1-6 1z",
  localizacao: "M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM9.5 10a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0",
  wifi: "M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
  biblioteca: "M4 4h4v16H4zM10 4h4v16h-4zM16 5l3.5-1 2.5 15-3.5 1z",
  modelo: "M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z",
  fonte: "M4 20 10 4h1l6 16M6.5 14h8M17 20h4M19 11v9",
  // ícones para usar como elemento
  casa: "M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10",
  usuario: "M12 8m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M4 21c0-4 4-6 8-6s8 2 8 6",
  sino: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  coracao: "M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z",
  estrela: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  carrinho: "M3 4h2l2.5 11h11L21 7H6.3M9 20h.01M18 20h.01",
  engrenagem: "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1",
  check: "M5 12l5 5L20 7",
  info: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 11v6M12 7.5h.01",
  alerta: "M12 3l10 18H2zM12 10v5M12 18h.01",
  email: "M3 5h18v14H3zM3 6l9 7 9-7",
  telefone: "M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z",
  alfinete: "M9 3h6l-1 6 3 3v2H7v-2l3-3zM12 14v7",
  preencher: "M5 11l7-7 7 7-7 7zM19 15s2 2.4 2 3.5a2 2 0 0 1-4 0c0-1.1 2-3.5 2-3.5M3 21h12",
  contorno: "M4 4h16v16H4zM8 8h8v8H8z",
  altura: "M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4",
  largura: "M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4",
  bigorna: "M3 7h13c0 3 2 4 5 4v2c-3 0-5 1-6 3H9c-1-2-3-3-6-3zM8 16v3h8v-3M6 21h12",
};

/** Biblioteca de ícones de menu, por categoria. Todos podem virar elemento (tipo "icone"). */
export const ICONES_MENU = [
  { nome: "Rede e monitoramento", itens: ["switchRede", "roteador", "firewall", "accessPoint", "servidor", "rack", "bancoDados", "nobreak", "tablet", "televisao", "impressora", "cameraIp", "sensor", "vpn", "dns", "topologia", "pulso", "monitorPulso", "hospital", "velocimetro", "linkAtivo", "linkInativo", "linkLento"] },
  { nome: "Arquivo", itens: ["novo", "abrir", "salvar", "pasta", "documento", "imprimir", "exportar", "baixar", "enviarArquivo", "nuvem"] },
  { nome: "Edição", itens: ["desfazer", "refazer", "cortar", "copiar", "colar", "editar", "excluir", "duplicar", "buscar", "selTudo"] },
  { nome: "Navegação", itens: ["casa", "hamburguer", "voltar", "avancar", "setaEsq", "setaDir", "setaCima", "setaBaixo", "maisOpcoes", "lista", "grade", "painelLateral", "telaCheia"] },
  { nome: "Ações", itens: ["mais", "menos", "fechar", "check", "travar", "destravar", "olho", "olhoFechado", "filtro", "ordenar", "girar", "alfinete"] },
  { nome: "Conta e acesso", itens: ["usuario", "usuarios", "entrar", "sair", "chave", "escudo", "engrenagem", "ferramentas"] },
  { nome: "Comunicação", itens: ["email", "chat", "sino", "telefone", "enviar", "compartilhar", "link"] },
  { nome: "Mídia", itens: ["imagem", "camera", "play", "pausa", "volume", "microfone"] },
  { nome: "Estado e informação", itens: ["info", "alerta", "ajuda", "relogio", "calendario", "estrela", "coracao", "etiqueta", "localizacao", "wifi", "grafico"] },
  { nome: "Loja", itens: ["carrinho", "sacola", "cartao", "presente"] },
  { nome: "Design", itens: ["pincel", "caneta", "nos", "boolUnir", "boolSubtrair", "boolInterseccao", "boolExcluir", "tema", "camadas", "propriedades", "texto", "fonte", "caixa", "elipse", "linha", "seta", "mao", "zoom", "contaGotas", "regua", "codigo", "modelo", "biblioteca"] },
];

// ---------- Ícones extras (traço) ----------
for (const k of Object.keys(P_EXTRA)) if (Object.hasOwn(P, k)) throw new Error(`Ícone duplicado: ${k}`);
Object.assign(P, P_EXTRA);
ICONES_MENU.push(...CATEGORIAS_EXTRA);

// ---------- Material Design Icons (preenchidos, "md-…") e ícones importados pelo usuário ("usr-…") ----------
Object.assign(P, ICONES_MD);
export const ehPreenchido = nome => Object.hasOwn(ICONES_MD, nome);
// Ícones do Windows: PNG coloridos, desenhados como imagem (não assumem a cor do tema).
const windows = new Map(ICONES_WINDOWS.map(([nome, rotulo, b64]) => [nome, { rotulo, uri: `data:image/png;base64,${b64}` }]));
export const ehWindows = nome => typeof nome === "string" && windows.has(nome);
export const uriWindows = nome => windows.get(nome)?.uri ?? null;
ICONES_MENU.push({ nome: "Windows (imageres, shell32, pifmgr, user32)", itens: [...windows.keys()] });
const MAPA_WINDOWS = {"salvar": "win-shell32-258", "abrir": "win-shell32-308", "pasta": "win-imageres-005", "excluir": "win-shell32-101", "duplicar": "win-imageres-248", "copiar": "win-shell32-054", "colar": "win-shell32-260", "cortar": "win-shell32-259", "desfazer": "win-shell32-295", "refazer": "win-imageres-252", "buscar": "win-imageres-168", "zoom": "win-imageres-168", "info": "win-imageres-076", "ajuda": "win-imageres-094", "check": "win-imageres-156", "fechar": "win-imageres-084", "relogio": "win-shell32-249", "estrela": "win-imageres-204", "travar": "win-imageres-054", "setaCima": "win-shell32-315", "novo": "win-imageres-002", "documento": "win-imageres-014", "exportar": "win-imageres-194", "tela": "win-imageres-104", "camadas": "win-shell32-250", "ferramentas": "win-shell32-314", "escudo": "win-imageres-073", "previa": "win-imageres-281", "volume": "win-imageres-167", "sinal": "win-imageres-329", "codigo": "win-imageres-263", "biblioteca": "win-pifmgr-013", "alerta": "win-imageres-079", "impressora": "win-imageres-071", "usuario": "win-imageres-083", "nuvem": "win-imageres-218", "home": "win-shell32-317", "download": "win-imageres-175", "importar": "win-imageres-111"};
let modoWin = false;
/** Troca os ícones de traço pelos do Windows nos menus (só na interface; elementos e exportação não mudam). */
export function definirIconesWindows(v) { modoWin = !!v; }
export const iconesWindowsAtivos = () => modoWin;
export const iconeMenu = (nome, tam = 20) => (modoWin && MAPA_WINDOWS[nome] ? icone(MAPA_WINDOWS[nome], tam) : icone(nome, tam));
export const ehUsuario = nome => typeof nome === "string" && nome.startsWith("usr-");

const CHAVE_ICONES_USUARIO = "hefestus.iconesUsuario";
const MAX_ICONES_USUARIO = 80;
const MAX_BYTES_ICONE = 200_000;
const usuario = new Map(); // nome → { rotulo, uri }
try {
  for (const i of JSON.parse(globalThis.localStorage?.getItem(CHAVE_ICONES_USUARIO) ?? "[]")) {
    if (ehUsuario(i?.nome) && /^data:image\/(svg\+xml|png)[;,]/.test(i.uri ?? "")) usuario.set(i.nome, { rotulo: String(i.rotulo ?? i.nome), uri: i.uri });
  }
} catch { /* sem armazenamento: os ícones importados valem só nesta sessão */ }

function guardarUsuario() {
  try {
    globalThis.localStorage?.setItem(CHAVE_ICONES_USUARIO, JSON.stringify([...usuario].map(([nome, v]) => ({ nome, ...v }))));
    return true;
  } catch { return false; }
}

/** Remove o que pode rodar ou puxar coisa de fora de um SVG. Ele só é usado como máscara de imagem. */
export function limparSvg(texto) {
  if (!/<svg[\s>]/i.test(texto)) throw new Error("o arquivo não parece um SVG");
  return texto
    .replace(/<\?xml[^>]*\?>|<!DOCTYPE[^>]*>|<!--[\s\S]*?-->/gi, "")
    .replace(/<(script|foreignObject|iframe|object|embed)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/(href|xlink:href)\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi, "")
    .trim();
}

/** Registra um ícone importado. `dados` é o texto do SVG ou, no PNG, a data URI. Devolve o nome (usr-…). */
export function adicionarIconeUsuario(rotulo, tipo, dados) {
  if (usuario.size >= MAX_ICONES_USUARIO) throw new Error(`o limite é ${MAX_ICONES_USUARIO} ícones importados`);
  let uri;
  if (tipo === "svg") {
    const limpo = limparSvg(dados);
    if (limpo.length > MAX_BYTES_ICONE) throw new Error("SVG maior que 200 KB");
    uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(limpo)}`;
  } else if (tipo === "png") {
    if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(dados)) throw new Error("PNG inválido");
    if (dados.length > MAX_BYTES_ICONE * 1.4) throw new Error("PNG maior que 200 KB");
    uri = dados;
  } else throw new Error("use SVG ou PNG");
  const base = String(rotulo).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "icone";
  let nome = `usr-${base}`;
  for (let k = 2; usuario.has(nome); k++) nome = `usr-${base}-${k}`;
  usuario.set(nome, { rotulo: String(rotulo).slice(0, 60), uri });
  if (!guardarUsuario()) { usuario.delete(nome); throw new Error("o navegador não deixou guardar (sem espaço)"); }
  return nome;
}
export function removerIconeUsuario(nome) { const ok = usuario.delete(nome); if (ok) guardarUsuario(); return ok; }
export const iconesUsuario = () => [...usuario].map(([nome, v]) => ({ nome, ...v }));
export const uriIconeUsuario = nome => usuario.get(nome)?.uri ?? null;
export const rotuloIcone = nome => usuario.get(nome)?.rotulo ?? windows.get(nome)?.rotulo ?? nome.replace(/^md-/, "");

/** Máscara CSS: o ícone importado assume a cor do elemento (currentColor). */
export const estiloMascara = uri => `background:currentColor;-webkit-mask:url('${uri}') center/contain no-repeat;mask:url('${uri}') center/contain no-repeat`;

/** Todas as categorias: as do Hefestus, as do Material e os ícones importados. */
export function categoriasIcones() {
  const meus = usuario.size ? [{ nome: "Meus ícones importados", itens: [...usuario.keys()] }] : [];
  return [...meus, ...ICONES_MENU, ...CATEGORIAS_MD];
}

/** Ícones que podem virar elemento na tela (tipo "icone"). */
export const ICONES_ELEMENTO = [...new Set([...ICONES_MENU, ...CATEGORIAS_MD].flatMap(c => c.itens))];
export const caminhoIcone = nome => P[nome] ?? P.estrela;
export const temIcone = nome => !!P[nome] || ehWindows(nome) || (ehUsuario(nome) && !!uriIconeUsuario(nome));

export function icone(nome, tam = 20) {
  const hp=iconeHephaestus(nome,tam);if(hp)return hp;
  if (ehWindows(nome)) return `<img class="ic ic-win" src="${uriWindows(nome)}" width="${tam}" height="${tam}" alt="" aria-hidden="true" style="image-rendering:pixelated;object-fit:contain">`;
  const uri = ehUsuario(nome) ? uriIconeUsuario(nome) : null;
  if (uri) return `<span class="ic ic-usr" style="display:inline-block;width:${tam}px;height:${tam}px;${estiloMascara(uri)}" aria-hidden="true"></span>`;
  const d = P[nome] ?? P.caixa;
  if (ehPreenchido(nome)) return `<svg class="ic" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="${d}"/></svg>`;
  return `<svg class="ic" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}

// ---------- Conjunto colorido ----------
export { NOMES_COR, COR };
const nomeCategoria = new Map();
const indexarCategorias = () => { if (nomeCategoria.size) return; for (const c of [...ICONES_MENU, ...CATEGORIAS_MD]) for (const i of c.itens) if (!nomeCategoria.has(i)) nomeCategoria.set(i, c.nome); };
const hash = t => { let h = 0; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

/** Cor (hex) do ícone no conjunto colorido: escolha explícita > significado > categoria > hash. */
export function corDoIcone(nome, forca) {
  if (forca && COR[forca]) return COR[forca];
  if (/^#[0-9a-f]{6}$/i.test(forca ?? "")) return forca;
  indexarCategorias();
  const k = COR_SEMANTICA[nome] ?? COR_CATEGORIA[nomeCategoria.get(nome)] ?? NOMES_COR[hash(nomeCategoria.get(nome) ?? nome) % NOMES_COR.length];
  return COR[k];
}

/** Miolo SVG colorido (sem a tag <svg>): fundo suave arredondado + glifo na cor + tom translúcido. */
export function miolloColorido(nome, cor) {
  const d = caminhoIcone(nome);
  const fundo = `<rect x="1" y="1" width="22" height="22" rx="6" fill="${cor}" fill-opacity=".14"/>`;
  if (ehPreenchido(nome)) return `${fundo}<path d="${d}" fill="${cor}" stroke="none" transform="translate(3.84 3.84) scale(.68)"/>`;
  return `${fundo}<path d="${d}" fill="${cor}" fill-opacity=".22" stroke="${cor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(3.84 3.84) scale(.68)"/>`;
}

/** Ícone colorido pronto para a interface. */
let modoCor = false;
/** Ícones monocromáticos (traço fino que herda a cor do tema) são o padrão; o colorido por categoria é opcional. */
export function definirIconesColoridos(v) { modoCor = !!v; }
export function iconeColorido(nome, tam = 20, forca) {
  if (!modoCor || ehUsuario(nome) || ehWindows(nome)) return icone(nome, tam);
  return `<svg class="ic ic-cor" width="${tam}" height="${tam}" viewBox="0 0 24 24" aria-hidden="true">${miolloColorido(nome, corDoIcone(nome, forca))}</svg>`;
}
