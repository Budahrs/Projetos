import { test } from "node:test";
import assert from "node:assert/strict";
import { satisfaz, proximaVersao, maiorQueSatisfaz, compararVersoes } from "../js/nucleo/versoes.js";
import { Armazem, MeioMemoria, canonico, hashTexto, lerRef } from "../js/nucleo/armazem.js";
import { validarManifesto, planoSincronizacao, sincronizar, pacoteParaPrograma, motivoPropagacao, executavelEm } from "../js/nucleo/sincronizar.js";

test("versões: faixas ^ ~ >= e próxima versão por tipo de mudança", () => {
  assert.ok(satisfaz("1.4.2", "^1.2.0"));
  assert.ok(!satisfaz("2.0.0", "^1.2.0"));
  assert.ok(!satisfaz("0.3.0", "^0.2.0"), "0.x: recurso pode quebrar");
  assert.ok(satisfaz("1.2.9", "~1.2.0") && !satisfaz("1.3.0", "~1.2.0"));
  assert.ok(satisfaz("3.0.0", ">=2.1.0") && satisfaz("9.9.9", "*"));
  assert.equal(proximaVersao("1.4.2", "quebra"), "2.0.0");
  assert.equal(proximaVersao("1.4.2", "recurso"), "1.5.0");
  assert.equal(proximaVersao("1.4.2", "correcao"), "1.4.3");
  assert.equal(maiorQueSatisfaz(["1.0.0", "1.9.0", "2.1.0"], "^1.0.0"), "1.9.0");
  assert.ok(compararVersoes("1.10.0", "1.9.0") > 0);
  assert.throws(() => proximaVersao("1.0", "correcao"), /versão inválida/);
});

test("JSON canônico e hash não dependem da ordem das chaves", async () => {
  assert.equal(canonico({ b: 1, a: [2, { d: 1, c: 2 }] }), canonico({ a: [2, { c: 2, d: 1 }], b: 1 }));
  assert.equal(await hashTexto(canonico({ x: 1, y: 2 })), await hashTexto(canonico({ y: 2, x: 1 })));
  assert.match(await hashTexto("abc"), /^sha256:ba7816bf/);
});

test("armazém: guarda compactado, deduplica pelo hash e resolve sem o programa", async () => {
  const a = await new Armazem(new MeioMemoria()).abrir();
  const codigo = "(entrada) => entrada.split('').reverse().join('')\n".repeat(40);
  const r1 = await a.guardar({ programa: "vetoria", id: "inverter", versao: "1.0.0", conteudo: codigo, runtime: "web", origem: { arquivo: "inverter.js" } });
  assert.equal(r1.acao, "novo");
  assert.ok(r1.entrada.tamanhoCompactado < r1.entrada.tamanhoOriginal, "compactado é menor");
  assert.equal(r1.entrada.origem.programa, "vetoria", "proveniência legível");
  const r2 = await a.guardar({ programa: "anima", id: "reverso", versao: "0.1.0", conteudo: codigo, runtime: "web" });
  assert.equal(r2.acao, "deduplicado");
  assert.equal(a.estatisticas().copias, 1);
  assert.equal(a.estatisticas().deduplicados, 1);
  assert.equal((await a.guardar({ programa: "vetoria", id: "inverter", versao: "1.0.0", conteudo: codigo })).acao, "igual");
  await assert.rejects(a.guardar({ programa: "vetoria", id: "inverter", versao: "1.0.0", conteudo: "outro" }), /versão nova/);
  await a.guardar({ programa: "vetoria", id: "inverter", versao: "1.1.0", conteudo: "(e) => e" });
  const { entrada, conteudo } = await a.resolver("ferramenta/vetoria/inverter@^1.0.0");
  assert.equal(entrada.versao, "1.1.0");
  assert.equal(conteudo, "(e) => e");
  assert.equal((await a.resolver("ferramenta/vetoria/inverter@~1.0.0")).conteudo, codigo);
  await assert.rejects(a.resolver("ferramenta/vetoria/inverter@^2.0.0"), /não está no armazém/);
  assert.deepEqual(lerRef("modelo/hefestus/menu"), { tipo: "modelo", programa: "hefestus", id: "menu", faixa: "*" });
});

test("armazém: versão em uso nunca é removida; a cópia sai só quando ninguém mais a usa", async () => {
  const a = await new Armazem().abrir();
  const { entrada } = await a.guardar({ programa: "p", id: "f", versao: "1.0.0", conteudo: { x: 1 } });
  await a.guardar({ programa: "q", id: "g", versao: "1.0.0", conteudo: { x: 1 } });
  await a.marcarUso(entrada.chave, "Projeto Login#v1");
  await assert.rejects(a.remover(entrada.chave), /em uso/);
  await a.desmarcarUso(entrada.chave, "Projeto Login#v1");
  assert.ok(await a.remover(entrada.chave));
  assert.equal((await a.resolver("ferramenta/q/g")).dados.x, 1, "a outra entrada mantém a cópia");
});

test("armazém: exportar e importar leva tudo para outra máquina e confere o hash", async () => {
  const a = await new Armazem().abrir();
  await a.guardar({ programa: "vetoria", id: "pen", versao: "1.0.0", conteudo: "(ev) => ev", runtime: "wasm" });
  await a.definirConfig("assinaturas", [{ programa: "anima-studio", optIn: true, aceita: ["*"] }]);
  const pacote = JSON.parse(JSON.stringify(await a.exportar()));
  const b = await new Armazem().abrir();
  const r = await b.importar(pacote);
  assert.equal(r.novos, 1);
  assert.equal((await b.resolver("ferramenta/vetoria/pen")).conteudo, "(ev) => ev");
  assert.equal((await b.config("assinaturas"))[0].programa, "anima-studio");
  assert.equal((await b.importar(pacote)).iguais, 1);
  pacote.indice[0].hash = "sha256:00";
  pacote.blobs["sha256:00"] = Object.values(pacote.blobs)[0];
  const c = await new Armazem().abrir();
  assert.deepEqual((await c.importar(pacote)).corrompidos, ["ferramenta/vetoria/pen@1.0.0"]);
});

test("manifesto: aceita o formato do VetorIA, exige runtime e avisa quando infere", () => {
  const v = validarManifesto({ program: "vetoria", version: "1.0.0", tools: [
    { id: "vectorize", kind: "wasm", sig: "(image, opts) => svg" },
    { id: "pen", kind: "wasm", sig: "(events) => path" },
  ] });
  assert.deepEqual(v.erros, []);
  assert.equal(v.manifesto.itens[0].runtime, "wasm");
  assert.match(v.avisos[0], /runtime inferido/);
  const ui = validarManifesto({ programa: "x", versao: "1.0.0", ferramentas: [{ id: "editor", kind: "ui" }] });
  assert.match(ui.erros[0], /declare "runtime"/);
  assert.ok(validarManifesto({ programa: "x y", versao: "1" }).erros.length >= 2);
  assert.ok(executavelEm("wasm", ["python", "wasmtime"]) && !executavelEm("web", ["python"]));
});

test("sincronizar: só baixa o que mudou, confere hash e nunca sobrescreve versão publicada", async () => {
  const a = await new Armazem().abrir();
  const conteudos = { "a.js": "(x) => x + 1", "b.js": "(x) => x * 2" };
  const m1 = validarManifesto({ programa: "calc", versao: "1.0.0", ferramentas: [
    { id: "somar", runtime: "web", assinatura: "(x) => numero", arquivo: "a.js" },
    { id: "dobrar", runtime: "web", assinatura: "(x) => numero", arquivo: "b.js", hash: await hashTexto(conteudos["b.js"]) },
  ] }).manifesto;
  const obter = it => conteudos[it.arquivo];
  const r1 = await sincronizar(a, m1, obter, { agora: () => "2026-10-20T10:00:00Z" });
  assert.deepEqual(r1.erros, []);
  assert.equal(r1.contagem.novos, 2);
  assert.equal(a.entrada("ferramenta/calc/somar@1.0.0").origem.sincronizadoEm, "2026-10-20T10:00:00Z");
  // segunda vez: nada muda
  assert.equal((await sincronizar(a, m1, obter)).contagem.iguais, 2);
  // nova versão de uma só
  conteudos["a.js"] = "(x) => x + 1 // v2";
  const m2 = validarManifesto({ programa: "calc", versao: "1.1.0", ferramentas: [
    { id: "somar", runtime: "web", versao: "1.1.0", arquivo: "a.js" },
    { id: "dobrar", runtime: "web", versao: "1.0.0", arquivo: "b.js", hash: "sha256:diferente" },
  ] }).manifesto;
  const plano = planoSincronizacao(m2, a);
  assert.deepEqual(plano.itens.map(i => i.estado), ["atualizado", "conflito"]);
  const r2 = await sincronizar(a, m2, obter);
  assert.equal(r2.contagem.atualizados, 1);
  assert.match(r2.erros[0], /subir a versão/);
  assert.deepEqual(a.versoes("ferramenta", "calc", "somar"), ["1.0.0", "1.1.0"]);
  // hash errado no manifesto não entra
  const m3 = validarManifesto({ programa: "calc", versao: "2.0.0", ferramentas: [{ id: "triplicar", runtime: "web", arquivo: "c.js", hash: "sha256:abc" }] }).manifesto;
  const r3 = await sincronizar(a, m3, () => "(x) => x * 3");
  assert.match(r3.erros[0], /hash não confere/);
  assert.equal(a.entrada("ferramenta/calc/triplicar@2.0.0"), null);
});

test("propagação é pull e opt-in: só o permitido, compatível e mais novo que o instalado", async () => {
  const a = await new Armazem().abrir();
  await a.guardar({ programa: "vetoria", id: "pen", versao: "1.0.0", conteudo: "w1", runtime: "wasm" });
  await a.guardar({ programa: "vetoria", id: "pen", versao: "1.2.0", conteudo: "w2", runtime: "wasm" });
  await a.guardar({ programa: "hefestus", id: "auditar", versao: "0.34.0", conteudo: "(e) => []", runtime: "web" });
  await a.guardar({ programa: "anima-studio", id: "bob", versao: "1.0.0", tipo: "modelo", conteudo: { ossos: 12 } });
  const fora = await pacoteParaPrograma(a, { programa: "anima-studio", optIn: false, aceita: ["*"] });
  assert.equal(fora.itens.length, 0);
  assert.match(fora.recusados[0].motivo, /opt-in/);
  const ass = { programa: "anima-studio", optIn: true, aceita: ["ferramenta/*"] };
  const p = await pacoteParaPrograma(a, ass, { "ferramenta/vetoria/pen": "1.0.0" });
  assert.deepEqual(p.itens.map(i => `${i.id}@${i.versao}`), ["pen@1.2.0"], "web não roda em PySide6; modelo fora do aceito; o próprio bob não volta");
  assert.equal(p.itens[0].conteudo, "w2");
  assert.match(p.regra, /pull/);
  assert.equal((await pacoteParaPrograma(a, ass, { "ferramenta/vetoria/pen": "1.2.0" })).itens.length, 0);
  const fixado = motivoPropagacao({ ...ass, fixar: { "ferramenta/vetoria/pen": "~1.0.0" } }, a.entrada("ferramenta/vetoria/pen@1.2.0"));
  assert.equal(fixado.permitido, false);
});
