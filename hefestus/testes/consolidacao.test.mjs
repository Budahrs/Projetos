import { test } from "node:test";
import assert from "node:assert/strict";
import { Armazem } from "../js/nucleo/armazem.js";
import { lerAssinatura, candidatosEquivalencia, compararComportamento, ranquear, proporFusao, registrarDecisao, cadeiaDaDecisao } from "../js/nucleo/consolidacao.js";
import { PonteIA, PROIBIDAS_IA, lerResposta } from "../js/nucleo/ponteIA.js";
import { funcaoDaFerramenta } from "../js/nucleo/vinculos.js";

async function armazemComDuplicatas() {
  const a = await new Armazem().abrir();
  await a.guardar({ programa: "vetoria", id: "pathfinder", versao: "1.0.0", runtime: "web", contrato: { assinatura: "(shapes, op) => shape" }, conteudo: "(f) => f.filter(x => x > 0).length" });
  await a.guardar({ programa: "axiom", id: "pathFinder", versao: "2.1.0", runtime: "web", contrato: { assinatura: "(shapes, op) => shape" }, conteudo: "(f) => f.filter(x => x >= 0).length" });
  await a.guardar({ programa: "axiom", id: "exportarPdf", versao: "1.0.0", runtime: "python", contrato: { assinatura: "(doc) => pdf" }, conteudo: "def f(): pass" });
  return a;
}

test("grau 1: compara contratos (não código) e acha os equivalentes", async () => {
  assert.deepEqual(lerAssinatura("(image, opts?: Opcoes) => svg"), { entradas: ["image", "opts"], saida: "svg" });
  const a = await armazemComDuplicatas();
  const pares = candidatosEquivalencia(a.listar());
  assert.equal(pares.length, 1);
  assert.deepEqual([pares[0].a, pares[0].b].sort(), ["ferramenta/axiom/pathFinder@2.1.0", "ferramenta/vetoria/pathfinder@1.0.0"]);
  assert.ok(pares[0].pontuacao >= 0.9);
  assert.ok(pares[0].motivos.includes("mesma saída (shape)"));
});

test("grau 2: fixtures rodam nas duas, divergências aparecem e a cobertura é medida", async () => {
  const a = await armazemComDuplicatas();
  const fa = funcaoDaFerramenta(await a.ler("ferramenta/vetoria/pathfinder@1.0.0"));
  const fb = funcaoDaFerramenta(await a.ler("ferramenta/axiom/pathFinder@2.1.0"));
  const fixtures = [
    { nome: "positivos", entrada: [1, 2, 3], esperado: 3 },
    { nome: "com zero", entrada: [0, 1], esperado: 2 },
    { nome: "vazio", entrada: [], esperado: 0 },
  ];
  const c = await compararComportamento(fixtures, (qual, f) => (qual === "a" ? fa : fb)(f.entrada));
  assert.equal(c.veredito, "divergem");
  assert.equal(c.mesmas, 2);
  assert.deepEqual(c.divergencias.map(d => d.fixture), ["com zero"]);
  assert.deepEqual(c.cobertura, { a: 2 / 3, b: 1, fixtures: 3 });
  assert.equal((await compararComportamento([], () => 1)).veredito, "inconclusivo");
  const comErro = await compararComportamento([{ entrada: 1 }], q => { if (q === "a") throw new Error("quebrou"); return 1; });
  assert.equal(comErro.erros[0].erro, "quebrou");
});

test("ranking: critérios visíveis, sem dado não conta, empate não decide sozinho", () => {
  const r = ranquear([
    { chave: "A", metricas: { cobertura: 1, uso: 4, dependencias: 2, tamanho: 900, recencia: 10 } },
    { chave: "B", metricas: { cobertura: 0.6, uso: 1, dependencias: 0, tamanho: 400, recencia: 20 } },
  ]);
  assert.equal(r.melhor, "A");
  assert.deepEqual(r.criterios, ["cobertura", "uso", "dependencias", "tamanho", "recencia"]);
  assert.equal(r.linhas[0].notas.dependencias, 0, "mais dependências = pior");
  const semCobertura = ranquear([{ chave: "A", metricas: { cobertura: null, uso: 1 } }, { chave: "B", metricas: { cobertura: 1, uso: 1 } }]);
  assert.ok(semCobertura.ignorados.includes("cobertura"));
  assert.equal(semCobertura.empate, true);
  assert.equal(semCobertura.melhor, null);
  assert.match(semCobertura.porque, /falta informação/);
  const manual = ranquear([{ chave: "A", metricas: { uso: 1 } }, { chave: "B", metricas: { uso: 1 } }], { escolhaManual: "B" });
  assert.equal(manual.melhor, "B");
  assert.match(manual.porque, /manual/);
});

test("grau 3: fusão é só proposta; decisão exige quem decidiu e nunca aplica", async () => {
  const comp = { grau: 2, total: 3, mesmas: 2, veredito: "divergem", cobertura: { a: 2 / 3, b: 1 },
    divergencias: [{ fixture: "com zero", saidaA: 1, saidaB: 2, esperado: 2 }] };
  const p = proporFusao("A", "B", comp, "IA: B trata zero como válido");
  assert.equal(p.base, "B");
  assert.equal(p.estado, "proposta");
  assert.equal(p.requerRevisao, true);
  assert.throws(() => proporFusao("A", "B", null), /grau 2/);
  assert.throws(() => registrarDecisao(p, { aprovado: true, por: " " }), /quem decidiu/);
  const d = registrarDecisao(p, { aprovado: true, por: "Ricardo" }, () => "2026-10-20");
  assert.equal(d.estado, "aprovada");
  assert.equal(d.aplicada, false);
  assert.deepEqual(cadeiaDaDecisao(d, comp).map(e => e.feito), [true, true, true]);
  assert.throws(() => registrarDecisao(d, { aprovado: false, por: "x" }), /proposta em aberto/);
});

test("ponte de IA: tarefas proibidas, cache por hash, cascata, teto e código privado só local", async () => {
  const chamadas = [];
  const remoto = async ({ modelo }) => { chamadas.push(modelo.id); return { texto: modelo.id.includes("haiku") ? '{"explicacoes":[],"confianca":0.3,"escalar":true}' : '{"explicacoes":[{"fixture":"z","causa":"evenodd"}],"confianca":0.9}', uso: { entrada: 1000, saida: 200 } }; };
  const ia = new PonteIA({ transportes: { remoto }, teto: 1 });
  for (const t of Object.keys(PROIBIDAS_IA)) await assert.rejects(ia.pedir(t, {}), new RegExp(PROIBIDAS_IA[t].slice(0, 20).replace(/[()]/g, ".")));
  const r = await ia.pedir("explicarDivergencia", { a: 1 });
  assert.deepEqual(chamadas, ["claude-haiku-5-5", "claude-sonnet-5-5"], "triagem pediu para escalar");
  assert.equal(r.explicacoes[0].causa, "evenodd");
  assert.equal(r.papel, "proposta");
  const r2 = await ia.pedir("explicarDivergencia", { a: 1 });
  assert.equal(r2.doCache, true);
  assert.equal(chamadas.length, 2, "cache não chama de novo");
  ia.gasto = 0.9999;
  await assert.rejects(ia.pedir("explicarDivergencia", { b: 2 }), /teto do ciclo/);
  ia.novoCiclo();
  await assert.rejects(ia.pedir("gerarFixturesBorda", {}, { privado: true }), /só vai para IA local/);
  const local = async () => ({ texto: '{"fixtures":[{"nome":"vazio","entrada":[]}],"confianca":0.4}' });
  const ia2 = new PonteIA({ transportes: { remoto, local } });
  const r3 = await ia2.pedir("gerarFixturesBorda", { x: 1 }, { privado: true });
  assert.equal(r3.modelo, "local");
  assert.equal(ia2.gasto, 0);
  assert.equal(lerResposta("texto sem json").escalar, true);
});

test("grau 3: quando a base acerta tudo, a proposta é manter a base (não 'sem resposta')", () => {
  const comp = { grau: 2, total: 2, mesmas: 1, veredito: "divergem", cobertura: { a: 1, b: 0.5 },
    divergencias: [{ fixture: "com zero", saidaA: 2, saidaB: 1, esperado: 2 }] };
  const p = proporFusao("A", "B", comp);
  assert.equal(p.tipo, "manter-base");
  assert.equal(p.base, "A");
  assert.match(p.texto, /acertou onde B errou \(com zero\)/);
  const semEsperado = proporFusao("A", "B", { ...comp, cobertura: null, divergencias: [{ fixture: "x", saidaA: 1, saidaB: 2 }] });
  assert.equal(semEsperado.tipo, "revisar-divergencias");
});
