// Consolidação (modo ④): ferramentas equivalentes de programas diferentes, em três graus.
//  Grau 1 — Detecção (automático): compara CONTRATOS, não código.
//  Grau 2 — Comparação comportamental (automático): roda as mesmas fixtures nas duas e compara saídas.
//  Grau 3 — Fusão (humano confirma): propõe; nunca aplica. Não existe função que funda código sozinha.
// Ranking do "melhor e mais completo" por critérios medidos; empate não se desempata sozinho.
import { iguais } from "./protecao.js";
import { compararVersoes } from "./versoes.js";

// ---------------------------------------------------------- grau 1: contratos

/** "(image, opts) => svg" → { entradas: ["image", "opts"], saida: "svg" }. Aceita objeto pronto. */
export function lerAssinatura(sig) {
  if (!sig) return { entradas: [], saida: null };
  if (typeof sig === "object") return { entradas: (sig.entradas ?? []).map(String), saida: sig.saida ?? null };
  const m = /^\s*\(([^)]*)\)\s*=>\s*(.+?)\s*$/.exec(String(sig));
  if (!m) return { entradas: [], saida: String(sig).trim() || null };
  const entradas = m[1].split(",").map(s => s.trim().replace(/[?:].*$/, "").trim()).filter(Boolean);
  return { entradas, saida: m[2].trim() };
}

const tokens = s => new Set(String(s ?? "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter(Boolean));
const jaccard = (a, b) => { if (!a.size && !b.size) return 1; let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); };

/** 0..1: quanto os contratos de duas entradas do armazém se parecem (e por quê). */
export function similaridadeContrato(a, b) {
  const sa = lerAssinatura(a.contrato?.assinatura), sb = lerAssinatura(b.contrato?.assinatura);
  const motivos = [];
  let s = 0;
  if (sa.saida && sb.saida && sa.saida.toLowerCase() === sb.saida.toLowerCase()) { s += 0.4; motivos.push(`mesma saída (${sa.saida})`); }
  if (sa.entradas.length && sa.entradas.length === sb.entradas.length) { s += 0.2; motivos.push(`${sa.entradas.length} entrada(s) nas duas`); }
  const je = jaccard(new Set(sa.entradas.map(x => x.toLowerCase())), new Set(sb.entradas.map(x => x.toLowerCase())));
  if (sa.entradas.length || sb.entradas.length) { s += 0.2 * je; if (je >= 0.5) motivos.push("entradas com nomes parecidos"); }
  if (a.runtime && a.runtime === b.runtime) { s += 0.1; motivos.push(`mesmo runtime (${a.runtime})`); }
  const jn = jaccard(tokens(a.id), tokens(b.id));
  s += 0.1 * jn;
  if (jn >= 0.5) motivos.push("nomes parecidos");
  return { pontuacao: Math.round(s * 100) / 100, motivos };
}

/**
 * Pares candidatos a equivalência (de ids ou programas diferentes), do mais para o menos parecido.
 * Usa só a maior versão de cada ferramenta.
 */
export function candidatosEquivalencia(entradas, limiar = 0.75) {
  const ultimos = new Map();
  for (const e of entradas.filter(e => e.tipo === "ferramenta")) {
    const k = `${e.programa}/${e.id}`;
    if (!ultimos.has(k) || compararVersoes(e.versao, ultimos.get(k).versao) > 0) ultimos.set(k, e);
  }
  const lista = [...ultimos.values()];
  const pares = [];
  for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
    const a = lista[i], b = lista[j];
    if (a.programa === b.programa && a.id === b.id) continue;
    const { pontuacao, motivos } = similaridadeContrato(a, b);
    if (pontuacao >= limiar) pares.push({ a: a.chave, b: b.chave, pontuacao, motivos, grau: 1 });
  }
  return pares.sort((x, y) => y.pontuacao - x.pontuacao);
}

// ---------------------------------------------------------- grau 2: fixtures

/**
 * Roda as fixtures nas duas ferramentas. `executar(qual, fixture)` → saída (pode ser async; qual = "a" | "b").
 * Fixture: { nome, entrada, esperado? }. Com `esperado`, mede a cobertura de cada uma (acertos/total).
 * Veredito: "equivalentes" (todas as saídas iguais), "divergem" ou "inconclusivo" (sem fixtures ou só erros).
 */
export async function compararComportamento(fixtures, executar, comparar = iguais) {
  const divergencias = [], erros = [];
  let mesmas = 0, comEsperado = 0, acertosA = 0, acertosB = 0;
  for (const [i, f] of (fixtures ?? []).entries()) {
    const nome = f.nome ?? `fixture ${i + 1}`;
    let sa, sb;
    try { sa = await executar("a", f); } catch (e) { erros.push({ fixture: nome, qual: "a", erro: e.message }); sa = { __erro: e.message }; }
    try { sb = await executar("b", f); } catch (e) { erros.push({ fixture: nome, qual: "b", erro: e.message }); sb = { __erro: e.message }; }
    if ("esperado" in f) {
      comEsperado++;
      if (comparar(sa, f.esperado)) acertosA++;
      if (comparar(sb, f.esperado)) acertosB++;
    }
    if (comparar(sa, sb)) mesmas++;
    else divergencias.push({ fixture: nome, entrada: f.entrada, saidaA: sa, saidaB: sb, ...("esperado" in f ? { esperado: f.esperado } : {}) });
  }
  const total = fixtures?.length ?? 0;
  const validas = total - new Set(erros.map(e => e.fixture)).size;
  const veredito = !total || !validas ? "inconclusivo" : divergencias.length ? "divergem" : "equivalentes";
  return {
    grau: 2, total, mesmas, divergencias, erros, veredito,
    cobertura: comEsperado ? { a: acertosA / comEsperado, b: acertosB / comEsperado, fixtures: comEsperado } : null,
  };
}

// ---------------------------------------------------------- ranking

/** Pesos: alto = 3, médio = 2, baixo = 1. */
export const PESOS = { cobertura: 3, uso: 3, dependencias: 2, tamanho: 2, recencia: 1 };
const MENOR_MELHOR = new Set(["dependencias", "tamanho"]);
export const CRITERIOS = {
  cobertura: "Cobertura de fixtures", uso: "Uso real (referências)", dependencias: "Número de dependências",
  tamanho: "Tamanho compactado", recencia: "Recência",
};

/** Métricas de uma entrada do armazém, para o ranking. */
export function metricasDe(e) {
  return {
    cobertura: e.metricas?.cobertura ?? null,
    uso: e.usadoPor?.length ?? e.metricas?.uso ?? 0,
    dependencias: e.metricas?.dependencias ?? 0,
    tamanho: e.tamanhoCompactado ?? null,
    recencia: Date.parse(e.origem?.sincronizadoEm ?? e.origem?.guardadoEm ?? "") || null,
  };
}

/**
 * Ranking visível: cada candidato com a nota por critério (0..1) e a nota final.
 * Critério sem dado em algum candidato não conta para ninguém (falta informação ≠ nota zero).
 * Se os dois primeiros ficam a menos de `margem`, `melhor` = null: empate é falta de informação.
 * `escolhaManual` (chave) sobrescreve, e fica registrado como escolha humana.
 */
export function ranquear(candidatos, { pesos = PESOS, margem = 0.02, escolhaManual = null } = {}) {
  const linhas = candidatos.map(c => ({ chave: c.chave, metricas: c.metricas ?? metricasDe(c) }));
  const usados = Object.keys(pesos).filter(k => linhas.length && linhas.every(l => typeof l.metricas[k] === "number"));
  for (const l of linhas) l.notas = {};
  for (const k of usados) {
    const vals = linhas.map(l => l.metricas[k]);
    const min = Math.min(...vals), max = Math.max(...vals);
    for (const l of linhas) {
      // todos iguais neste critério: nota cheia para todos (o critério não desempata)
      if (max === min) { l.notas[k] = 1; continue; }
      const n = (l.metricas[k] - min) / (max - min);
      l.notas[k] = Math.round((MENOR_MELHOR.has(k) ? 1 - n : n) * 1000) / 1000;
    }
  }
  const soma = usados.reduce((s, k) => s + pesos[k], 0);
  for (const l of linhas) l.nota = soma ? Math.round(usados.reduce((s, k) => s + pesos[k] * l.notas[k], 0) / soma * 1000) / 1000 : 0;
  linhas.sort((a, b) => b.nota - a.nota);
  const ignorados = Object.keys(pesos).filter(k => !usados.includes(k));
  const empate = linhas.length > 1 && linhas[0].nota - linhas[1].nota < margem;
  const manual = escolhaManual && linhas.some(l => l.chave === escolhaManual) ? escolhaManual : null;
  return {
    linhas, criterios: usados, ignorados, empate,
    melhor: manual ?? (empate || !linhas.length ? null : linhas[0].chave),
    porque: manual ? "escolha manual (sobrescreve o ranking)" : empate ? "empate: falta informação, nenhuma escolha automática" : linhas.length ? "maior nota nos critérios medidos" : "sem candidatos",
  };
}

// ---------------------------------------------------------- grau 3: proposta de fusão

/**
 * Proposta (nunca aplicada): usa como base a de maior cobertura e lista os casos em que delegar à outra.
 * `notaIA` (opcional) entra como texto de apoio, sem poder de decisão.
 */
export function proporFusao(a, b, comparacao, notaIA = null) {
  if (!comparacao || comparacao.grau !== 2) throw new Error("rode a comparação com fixtures (grau 2) antes de propor fusão");
  const base_ = { grau: 3, estado: "proposta", requerRevisao: true, notaIA };
  if (comparacao.veredito === "equivalentes") return { ...base_, tipo: "manter-uma", base: a, outra: b, delegar: [], texto: "Saídas iguais em todas as fixtures: manter uma e marcar a outra como equivalente." };
  const cobA = comparacao.cobertura?.a ?? null, cobB = comparacao.cobertura?.b ?? null;
  const base = cobB !== null && cobA !== null && cobB > cobA ? b : a;
  const outra = base === a ? b : a;
  const saida = (d, quem) => (quem === a ? d.saidaA : d.saidaB);
  const comEsperado = comparacao.divergencias.filter(d => "esperado" in d);
  const semEsperado = comparacao.divergencias.length - comEsperado.length;
  // casos em que a base erra e a outra acerta: candidatos a delegar
  const delegar = comEsperado.filter(d => iguais(saida(d, outra), d.esperado) && !iguais(saida(d, base), d.esperado)).map(d => ({ quando: d.fixture, para: outra }));
  const outraErra = comEsperado.filter(d => iguais(saida(d, base), d.esperado) && !iguais(saida(d, outra), d.esperado)).map(d => d.fixture);
  const pendente = semEsperado ? ` ${semEsperado} divergência(s) sem resposta esperada: revise antes de decidir.` : "";
  if (delegar.length) return { ...base_, tipo: "base-com-delegacao", base, outra, delegar, texto: `Usar ${base} como padrão e delegar a ${outra} em ${delegar.length} caso(s): ${delegar.map(d => d.quando).join(", ")}.${pendente}` };
  if (outraErra.length) return { ...base_, tipo: "manter-base", base, outra, delegar: [], texto: `Usar ${base}: acertou onde ${outra} errou (${outraErra.join(", ")}). Marcar ${outra} como substituível depois de revisar quem a usa.${pendente}` };
  return { ...base_, tipo: "revisar-divergencias", base, outra, delegar: [], texto: `As duas divergem em ${comparacao.divergencias.length} fixture(s) sem resposta esperada que desempate. Revise as divergências antes de decidir.` };
}

/** Registra a decisão humana. Sem `por` (quem decidiu), não registra: a cadeia precisa ser visível. */
export function registrarDecisao(proposta, { aprovado, por, nota = "" }, agora = () => new Date().toISOString()) {
  if (!proposta || proposta.estado !== "proposta") throw new Error("só uma proposta em aberto pode ser decidida");
  if (!String(por ?? "").trim()) throw new Error("diga quem decidiu: fusão sempre tem revisão humana registrada");
  return { ...proposta, estado: aprovado ? "aprovada" : "rejeitada", decisao: { por: String(por).trim(), nota, em: agora() }, aplicada: false };
}

/** Cadeia de responsabilidade, para mostrar na tela: IA propôs → fixtures confirmaram → humano aprovou. */
export function cadeiaDaDecisao(proposta, comparacao) {
  return [
    { etapa: "IA propôs", feito: !!proposta?.notaIA, detalhe: proposta?.notaIA ? "texto de apoio anexado" : "sem IA (só regras determinísticas)" },
    { etapa: "Fixtures confirmaram", feito: !!comparacao && comparacao.veredito !== "inconclusivo", detalhe: comparacao ? `${comparacao.mesmas}/${comparacao.total} iguais, ${comparacao.divergencias.length} divergência(s)` : "não rodou" },
    { etapa: "Humano aprovou", feito: proposta?.estado === "aprovada", detalhe: proposta?.decisao ? `${proposta.estado} por ${proposta.decisao.por}` : "pendente" },
  ];
}
