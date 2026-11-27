import { test } from "node:test";
import assert from "node:assert/strict";
import { criarEstado, avaliarCondicao, compilarCondicao, visivel, resolverAbas, estadoDoEditor, estadoSimulado, auditarSuperficies, ribbonDaAba, ORCAMENTO } from "../js/nucleo/superficies.js";
import { GrafoModelos, sementeMeta } from "../js/nucleo/grafoModelos.js";
import { manifestoDoHefestus, catalogoMeta, sementeCompleta } from "../js/nucleo/semente.js";
import { validarManifesto } from "../js/nucleo/sincronizar.js";
import { HEFESTUS_MENU_SPEC } from "../js/nucleo/hefestusMenuSpec.js";
import { Nucleo } from "../js/nucleo/nucleo.js";
import { abaVisivel } from "../js/nucleo/construtor.js";

test("condições: mesma gramática, a fonte de estado muda entre editor e artefato", () => {
  const ed = criarEstado("editor", { selecao: { tipo: "texto", quantidade: 1 } });
  const art = criarEstado("artefato", { user: { papel: "admin" }, state: { menuAberto: true, itens: 3 } });
  assert.equal(avaliarCondicao("selecao.tipo == texto && selecao.quantidade == 1", ed), true);
  assert.equal(avaliarCondicao("selecao.tipo == 'botao' ou selecao.quantidade > 1", ed), false);
  assert.equal(avaliarCondicao("user.papel em [admin, editor] e state.menuAberto", art), true);
  assert.equal(avaliarCondicao("não (usuario.papel == admin)", art), false, "usuario é sinônimo de user");
  assert.equal(avaliarCondicao("estado.itens >= 3", art), true);
  assert.equal(avaliarCondicao("selecao.tipo == texto", art), false, "selecao.* não existe em produção");
  assert.ok([...art.avisos][0].includes("selecao"));
  assert.throws(() => compilarCondicao("selecao.tipo == "), /incompleta/);
  assert.throws(() => compilarCondicao("(a == b"), /esperava/);
  assert.equal(visivel("selecao.tipo ==", ed), false, "condição inválida esconde, não quebra");
});

test("abas: formato antigo (lista de tipos) continua valendo, excedentes vão para Mais", () => {
  assert.equal(visivel(["texto", "botao"], estadoSimulado("texto")), true);
  assert.equal(visivel(["texto"], estadoSimulado("")), false);
  assert.equal(abaVisivel({ quando: ["botao"] }, "botao"), true);
  assert.equal(abaVisivel({ quando: "selecao.tipo == campo" }, "campo"), true, "faixa do formulário aceita condição em texto");
  assert.equal(abaVisivel({ quando: "selecao.tipo == campo" }, "botao"), false);
  const abas = Array.from({ length: 8 }, (_, i) => ({ id: `a${i}` }));
  abas.push({ id: "tipografia", quando: "selecao.tipo == texto", contexto: true });
  const r = resolverAbas(abas, criarEstado("editor", { selecao: { tipo: "texto" } }), { ativa: "a7" });
  assert.equal(r.visiveis.length, ORCAMENTO.abas);
  assert.ok(r.visiveis.some(a => a.id === "tipografia"), "contextual não vai para Mais");
  assert.deepEqual(r.excedentes.map(a => a.id), ["a5", "a6", "a7"]);
  assert.equal(r.ativa, "a7");
  assert.equal(resolverAbas(abas, criarEstado("editor", {})).visiveis.some(a => a.id === "tipografia"), false);
});

test("estado do editor vem da seleção do núcleo", () => {
  const n = new Nucleo(); n.novo(false);
  const id = n.criar("texto", 10, 10);
  const e = estadoDoEditor(n);
  assert.equal(e.ler("selecao.tipo"), "texto");
  assert.equal(e.ler("selecao.id"), id);
  n.selecionarVarios([id, n.criar("botao", 10, 60)]);
  assert.equal(estadoDoEditor(n).ler("selecao.tipo"), "varios");
  assert.equal(avaliarCondicao("selecao.quantidade == 2", estadoDoEditor(n)), true);
});

test("orçamento de superfície nos menus e faixas feitos pelo formulário", () => {
  const itens = Array.from({ length: 10 }, (_, i) => ({ id: `i${i}`, rotulo: `Item ${i}` }));
  itens[0].submenu = [{ id: "s1", rotulo: "Sub", submenu: [{ id: "x", rotulo: "Neto" }] }];
  const aud = auditarSuperficies({ itens: [
    { tipo: "menu", nome: "Menu grande", itens: [...itens, { id: "sep", separador: true }] },
    { tipo: "ribbon", nome: "Faixa", abas: Array.from({ length: 7 }, (_, i) => ({ nome: `A${i}`, grupos: [] })) },
  ] });
  assert.deepEqual(aud.map(a => a.regra), ["orcamento", "orcamento", "orcamento"]);
  assert.match(aud[0].mensagem, /10 itens no primeiro nível/);
  assert.match(aud[1].mensagem, /3 níveis/);
  assert.match(aud[2].mensagem, /7 abas/);
});

test("grafo de modelos: semver, ciclo recusado, impacto, linhagem e encaixes", () => {
  const g = new GrafoModelos();
  g.adicionar({ id: "icone", nivel: "atomo" });
  g.adicionar({ id: "botao", nivel: "molecula", usa: [{ id: "icone", faixa: "^1.0.0" }] });
  g.adicionar({ id: "toolbar", nivel: "organismo", usa: ["botao"], slots: [{ nome: "itens", aceita: ["molecula"] }] });
  g.adicionar({ id: "painelNoc", nivel: "artefato", usa: ["toolbar"] });
  assert.deepEqual(g.ordem().map(k => k.split("@")[0]), ["icone", "botao", "toolbar", "painelNoc"]);
  assert.deepEqual(g.impacto("icone"), ["botao@1.0.0", "painelNoc@1.0.0", "toolbar@1.0.0"]);
  assert.throws(() => g.adicionar({ id: "icone", nivel: "atomo", versao: "1.1.0", usa: ["painelNoc"] }), /ciclo/);
  assert.equal(g.versoes("icone").length, 1, "o nó recusado não fica");
  const v2 = g.publicar("icone", "recurso", { contrato: { tamanhos: [16, 24] } });
  assert.equal(v2.versao, "1.1.0");
  assert.deepEqual(g.linhagem("icone"), ["icone@1.1.0", "icone@1.0.0"]);
  g.publicar("icone", "quebra");
  assert.equal(g.resolver("icone", "^1.0.0").versao, "1.1.0", "faixa protege da quebra");
  assert.deepEqual(g.atualizacoes().map(a => [a.usa, a.ultima, a.compativel]), [["icone", "2.0.0", false]]);
  assert.equal(g.slotAceita("toolbar", "itens", "botao").aceita, true);
  assert.equal(g.slotAceita("toolbar", "itens", "painelNoc").aceita, false);
  const copia = GrafoModelos.carregar(JSON.parse(JSON.stringify(g.serializar())));
  assert.equal(copia.nos.size, g.nos.size);
  assert.equal(ribbonDaAba({ ribbon: "modelo/hefestus/toolbar@^1.0.0" }, g).id, "toolbar");
});

test("semente meta: o próprio editor como modelos e o manifesto do Hefestus", () => {
  const g = catalogoMeta();
  const editor = g.resolver("hefestus.editor");
  assert.equal(editor.nivel, "meta");
  assert.equal(editor.usa.length, HEFESTUS_MENU_SPEC.length);
  assert.deepEqual(g.pendencias(), []);
  assert.ok(g.impacto("hefestus.cmd.salvar").includes("hefestus.editor@1.0.0"), "mudar um comando afeta o editor");
  const m = validarManifesto(manifestoDoHefestus());
  assert.deepEqual(m.erros, []);
  assert.ok(m.manifesto.itens.every(i => i.runtime === "web"));
  const s = sementeCompleta();
  assert.equal(s.formato, "hefestus-semente");
  assert.ok(s.grafo.nos.length > 150);
  assert.equal(sementeMeta([{ id: "x", nome: "X", grupos: [{ nome: "G", comandos: [{ id: "c", nome: "C" }] }] }]).ordem().length, 4);
});
