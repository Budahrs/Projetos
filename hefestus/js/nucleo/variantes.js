// Variantes de componente (tamanhos P/M/G e estilos) e modo "refinar" (3 opções para escolher).
import { CATALOGO } from "./catalogo.js";
import { clonar } from "./protecao.js";

const TAMANHOS = [["P", 0.8], ["M", 1], ["G", 1.3]];
const ESTILOS = {
  primario: { nome: "Primário", estilo: { fundo: "#2563eb", cor: "#ffffff", borda: "transparent", larguraBorda: 0 } },
  secundario: { nome: "Secundário", estilo: { fundo: "#e5e7eb", cor: "#111827", borda: "transparent", larguraBorda: 0 } },
  contorno: { nome: "Contorno", estilo: { fundo: "transparent", cor: "#2563eb", borda: "#2563eb", larguraBorda: 2 } },
  fantasma: { nome: "Fantasma", estilo: { fundo: "transparent", cor: "#374151", borda: "transparent", larguraBorda: 0 } },
  perigo: { nome: "Perigo", estilo: { fundo: "#dc2626", cor: "#ffffff", borda: "transparent", larguraBorda: 0 } },
};
const OPCOES = [
  { chave: "suave", nome: "Suave", estilo: { raio: 16, sombra: "0 6px 18px rgba(15,23,42,0.12)" }, escala: 1 },
  { chave: "contraste", nome: "Contraste", estilo: { fundo: "#111827", cor: "#ffffff", borda: "#111827", larguraBorda: 2, peso: 700 }, escala: 1 },
  { chave: "minimalista", nome: "Minimalista", estilo: { fundo: "transparent", borda: "#d1d5db", larguraBorda: 1, raio: 6, sombra: "none" }, escala: 1 },
];
export const NOMES_ESTILOS = Object.keys(ESTILOS);

function idsLivres(n, tipo, qtd) {
  const usados = new Set(Object.keys(n.doc.elementos)), out = [];
  let k = 1;
  while (out.length < qtd) { const id = `${tipo}_${k++}`; if (!usados.has(id)) out.push(id); }
  return out;
}
const proximoNum = (n, tipo) => n.novoId(tipo).n;

function copiaEscalada(el, f) {
  const c = clonar(el);
  c.largura = Math.round(el.largura * f); c.altura = Math.round(el.altura * f);
  if (c.estilo?.tamanhoFonte) c.estilo.tamanhoFonte = Math.round(c.estilo.tamanhoFonte * f);
  return c;
}

function montarGrupo(n, id, copias, titulo, linha = true) {
  const el = { ...n.elemento(id), id };
  const ids = idsLivres(n, el.tipo, copias.length);
  const { id: idC, n: numC } = n.novoId("container");
  const gap = 24;
  let x = el.x + el.largura + 40, y = el.y;
  const zMax = Math.max(0, ...n.elementos().map(e => e.z ?? 0));
  const novos = copias.map((c, i) => {
    const copia = { ...c, x, y, z: zMax + 1 + i, pai: idC };
    delete copia.id;
    if (linha) x += copia.largura + gap; else y += copia.altura + gap;
    return [ids[i], copia];
  });
  const minX = Math.min(...novos.map(([, c]) => c.x)), minY = Math.min(...novos.map(([, c]) => c.y));
  const maxX = Math.max(...novos.map(([, c]) => c.x + c.largura)), maxY = Math.max(...novos.map(([, c]) => c.y + c.altura));
  const def = CATALOGO.container.padrao();
  const cont = {
    ...def, tipo: "container", nome: `${titulo}`, x: minX - 12, y: minY - 12, largura: maxX - minX + 24, altura: maxY - minY + 24, z: zMax,
    layout: { ...def.layout, modo: "livre", margem: 0, abracar: false },
    estilo: { ...def.estilo, fundo: "transparent", borda: "#cbd5e1", larguraBorda: 1, raio: 12 },
  };
  void numC;
  const r = n.comando({ texto: `Criar ${titulo}`, alvos: [idC, ...ids], propriedades: ["*"] }, d => {
    d.elementos[idC] = cont;
    for (const [i, c] of novos) d.elementos[i] = c;
  });
  if (r.acao === "aplicado") { n.projeto.memoria.aliases[cont.nome.toLowerCase()] = [idC]; n.selecionar(idC); }
  return { container: idC, ids, resultado: r };
}

/** P/M/G: três cópias em escala 0,8 / 1 / 1,3 agrupadas em "Tamanhos de X". */
export function gerarTamanhos(n, id) {
  const el = n.elemento(id);
  if (!el) throw new Error("elemento não encontrado");
  const copias = TAMANHOS.map(([sufixo, f]) => ({ ...copiaEscalada(el, f), nome: `${el.nome} ${sufixo}` }));
  return montarGrupo(n, id, copias, `Tamanhos de ${el.nome}`);
}

/** Variantes de estilo (botão e similares): primário, secundário, contorno, fantasma, perigo. */
export function gerarEstilos(n, id, quais = NOMES_ESTILOS) {
  const el = n.elemento(id);
  if (!el) throw new Error("elemento não encontrado");
  const lista = quais.filter(q => ESTILOS[q]);
  if (!lista.length) throw new Error(`estilos disponíveis: ${NOMES_ESTILOS.join(", ")}`);
  const copias = lista.map(q => {
    const c = clonar(el);
    c.estilo = { ...(c.estilo ?? {}), ...ESTILOS[q].estilo };
    c.nome = `${el.nome} · ${ESTILOS[q].nome}`;
    if (c.estados?.hover) c.estados = { ...c.estados, hover: { ...c.estados.hover, fundo: undefined } };
    return c;
  });
  return montarGrupo(n, id, copias, `Variantes de ${el.nome}`);
}

/** Modo refinar: 3 opções lado a lado (suave, contraste, minimalista) para o usuário escolher. */
export function refinar(n, id) {
  const el = n.elemento(id);
  if (!el) throw new Error("elemento não encontrado");
  const copias = OPCOES.map((o, i) => {
    const c = clonar(el);
    c.estilo = { ...(c.estilo ?? {}), ...o.estilo };
    c.nome = `Opção ${i + 1} · ${o.nome}`;
    c.opcaoDe = id; c.opcaoN = i + 1;
    return c;
  });
  const g = montarGrupo(n, id, copias, `Opções para ${el.nome}`);
  return { ...g, opcoes: OPCOES.map((o, i) => ({ n: i + 1, nome: o.nome, id: g.ids[i] })) };
}

/** Mantém a opção N: ela substitui o original (mesmo lugar e id) e o resto some, num passo só. */
export function manterOpcao(n, num) {
  const op = n.elementos().find(e => e.opcaoN === num && e.opcaoDe && n.elemento(e.opcaoDe));
  if (!op) throw new Error(`não há opções abertas com o número ${num}`);
  const origem = op.opcaoDe;
  const orig = n.elemento(origem);
  const irmaos = n.elementos().filter(e => e.opcaoDe === origem);
  const cont = op.pai;
  return n.comando({ texto: `Manter a opção ${num} de ${orig.nome}`, alvos: [origem, cont, ...irmaos.map(i => i.id)].filter(Boolean), propriedades: ["*"], tipo: "remover" }, d => {
    const o = d.elementos[origem];
    o.estilo = { ...(o.estilo ?? {}), ...clonar(op.estilo ?? {}) };
    for (const i of irmaos) delete d.elementos[i.id];
    if (cont && d.elementos[cont]) delete d.elementos[cont];
  });
}
