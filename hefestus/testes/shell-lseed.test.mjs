// App Shell (#43, fase S2): perfil L-SEED — ponte com a Central, conversas e comandos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lerLinhasNdjson, mensagensParaCentral, criarMotorLseed } from "../js/shell/motorLseed.js";
import { criarSessao, adicionarFala, exportarSessao, importarSessao, carregarConversa, FORMATO_SESSAO } from "../js/shell/sessaoConversa.js";
import { registrarComandosLseed } from "../js/shell/comandosLseed.js";
import { CommandRegistry } from "../js/nucleo/comandos.js";
import { validarPerfil } from "../js/shell/perfil.js";
import { TEMAS_UI, ALIAS_TEMA_UI } from "../js/ui/temas.js";

const ler = c => JSON.parse(readFileSync(new URL("../" + c, import.meta.url), "utf8"));
const PERFIL = ler("perfis/l-seed.perfil.json");
const PERSONAS = PERFIL.areas.find(a => a.id === "conversa").abas;

/** Resposta em fluxo cortada em pedaços de 3 bytes (corta no meio de caracteres acentuados). */
function respostaFluxo(eventos, status = 200) {
  const bytes = new TextEncoder().encode(eventos.map(e => JSON.stringify(e)).join("\n") + "\n");
  let i = 0;
  const corpo = new ReadableStream({ pull(c) { if (i >= bytes.length) c.close(); else { c.enqueue(bytes.slice(i, i + 3)); i += 3; } } });
  return new Response(corpo, { status, headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
}
const respostaJson = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

test("NDJSON: junta linhas cortadas entre pedaços e ignora linhas vazias", () => {
  const l = lerLinhasNdjson();
  assert.deepEqual(l.empurrar('{"a":1}\n{"b"'), [{ a: 1 }]);
  assert.deepEqual(l.empurrar(':2}\n\n{"c":3}'), [{ b: 2 }]);
  assert.deepEqual(l.fechar(), [{ c: 3 }]);
  assert.deepEqual(l.fechar(), []);
});

test("só falas de texto do usuário e da IA vão para a Central", () => {
  assert.deepEqual(mensagensParaCentral([{ role: "user", content: "oi", extra: 1 }, { role: "system", content: "x" },
    { role: "assistant", content: "" }, { role: "assistant", content: "olá" }]),
  [{ role: "user", content: "oi" }, { role: "assistant", content: "olá" }]);
});

test("conversar: monta o texto em fluxo, repassa os eventos e envia o pedido no formato da Central", async () => {
  let pedido;
  const motor = criarMotorLseed({ fetch: async (url, op) => { pedido = { url, corpo: JSON.parse(op.body) };
    return respostaFluxo([{ tipo: "contexto", fontes: ["cofre"] }, { tipo: "texto", t: "Olá, " }, { tipo: "texto", t: "coração ção" }, { tipo: "fim", tokens: 3 }]); } });
  const tipos = [];
  const r = await motor.conversar({ persona: "aura", mensagens: [{ role: "user", content: "oi" }], modelo: "m", busca: true }, e => tipos.push(e.tipo));
  assert.equal(r.texto, "Olá, coração ção");
  assert.equal(r.fim.tokens, 3);
  assert.deepEqual(tipos, ["contexto", "texto", "texto", "fim"]);
  assert.equal(pedido.url, "/api/conversar");
  assert.deepEqual(pedido.corpo, { persona: "aura", mensagens: [{ role: "user", content: "oi" }], modelo: "m", memoria: true, busca: true });
});

test("conversar: erro da Central vira exceção legível", async () => {
  const recusa = criarMotorLseed({ fetch: async () => respostaJson({ erro: "persona desconhecida" }, 400) });
  await assert.rejects(recusa.conversar({ persona: "x", mensagens: [{ role: "user", content: "oi" }] }), /persona desconhecida/);
  const semOllama = criarMotorLseed({ fetch: async () => respostaFluxo([{ tipo: "contexto" }, { tipo: "erro", msg: "Ollama não respondeu" }]) });
  await assert.rejects(semOllama.conversar({ persona: "leila", mensagens: [{ role: "user", content: "oi" }] }), /Ollama não respondeu/);
});

test("memória BRS3 é opção explícita no pedido", async () => {
  let corpo;
  const motor=criarMotorLseed({fetch:async (_,op)=>{corpo=JSON.parse(op.body);return respostaFluxo([{tipo:"fim",tokens:0}]);}});
  await motor.conversar({persona:"aura",mensagens:[{role:"user",content:"HDB"}],memoria_brs3:true});
  assert.equal(corpo.memoria_brs3,true);
});

test("estado e salvar usam a API da Central", async () => {
  const chamadas = [];
  const motor = criarMotorLseed({ base: "http://127.0.0.1:8765", fetch: async (url, op) => {
    chamadas.push([url, op?.method ?? "GET", op?.body && JSON.parse(op.body)]);
    return url.endsWith("/api/estado") ? respostaJson({ ollama: true, modelos: ["auto"] }) : respostaJson({ arquivo: "PARA/x.md" });
  } });
  assert.equal((await motor.estado()).ollama, true);
  assert.equal((await motor.salvar({ persona: "leila", mensagens: [{ role: "user", content: "a" }, { role: "assistant", content: "" }] })).arquivo, "PARA/x.md");
  assert.deepEqual(chamadas[1], ["http://127.0.0.1:8765/api/salvar", "POST", { persona: "leila", mensagens: [{ role: "user", content: "a" }] }]);
  const falha = criarMotorLseed({ fetch: async () => respostaJson({ erro: "conversa vazia" }, 400) });
  await assert.rejects(falha.salvar({ persona: "leila", mensagens: [] }), /conversa vazia/);
});

test("sessão: exportar e abrir de novo devolve as mesmas conversas", () => {
  const s = criarSessao(PERSONAS, "clara");
  adicionarFala(s, "clara", "user", "oi"); adicionarFala(s, "clara", "assistant", "olá");
  const arquivo = JSON.parse(JSON.stringify(exportarSessao(s, new Date("2026-11-21T00:00:00Z"))));
  assert.equal(arquivo.formato, FORMATO_SESSAO);
  assert.deepEqual(importarSessao(arquivo, PERSONAS), s);
  assert.throws(() => adicionarFala(s, "ninguem", "user", "x"), /persona desconhecida/);
});

test("sessão: abrir recusa arquivo de outro formato ou com falas inválidas", () => {
  assert.throws(() => importarSessao(null, PERSONAS), /inválido/);
  assert.throws(() => importarSessao({ formato: "outro", versao: 1, conversas: {} }, PERSONAS), /formato/);
  assert.throws(() => importarSessao({ formato: FORMATO_SESSAO, versao: 1, conversas: { leila: [{ role: "system", content: "x" }], zeca: [] } }, PERSONAS),
    /leila\[0\]: fala inválida; persona desconhecida: zeca/);
});

test("comandos: todo atalho do perfil existe no registro, com estados corretos", () => {
  const ui = {}; let falas = [], ocupado = false, escolhida = ""; const feitos = [];
  const registro = new CommandRegistry();
  const ids = registrarComandosLseed(registro, { ui, falas: () => falas, ocupado: () => ocupado,
    salvar: () => feitos.push("salvar"), abrir: () => feitos.push("abrir"), exportar: () => feitos.push("exportar"), parar: () => feitos.push("parar"),
    abrirCofre: () => feitos.push("cofre"), escolhida: () => escolhida });
  for (const id of PERFIL.acessoRapido) assert.ok(ids.includes(id), `atalho sem comando: ${id}`);
  assert.equal(registro.estado("lseed.salvar").habilitado, false);
  assert.equal(registro.estado("lseed.parar").visivel, false);
  assert.equal(registro.executar("lseed.abrirCofre"), false, "sem conversa escolhida");
  escolhida = "2026-11-21 0012 Leila - oi.md";
  assert.equal(registro.executar("lseed.abrirCofre"), 1);
  feitos.length = 0;
  falas = [{ role: "user", content: "oi" }];
  assert.equal(registro.executar("lseed.salvar"), 1);
  ocupado = true;
  assert.equal(registro.estado("lseed.salvar").habilitado, false);
  assert.equal(registro.executar("lseed.parar"), 2);
  assert.deepEqual([registro.estado("lseed.dados").marcado, registro.estado("lseed.buscar").marcado], [true, false]);
  registro.executar("lseed.dados"); registro.executar("lseed.buscar");
  assert.deepEqual([ui.memoria, ui.busca], [false, true]);
  registro.executar("lseed.dados");
  assert.equal(ui.memoria, true);
  assert.deepEqual(feitos, ["salvar", "parar"]);
});

test("perfil L-SEED continua válido e a página aponta para os módulos do shell", () => {
  assert.deepEqual(validarPerfil(PERFIL, ler("perfis/perfil.schema.json"), { temas: TEMAS_UI, apelidos: ALIAS_TEMA_UI }), []);
  const html = readFileSync(new URL("../shell/l-seed.html", import.meta.url), "utf8");
  assert.ok(PERFIL.areas.find(a=>a.id==="projetos").abas.includes("smartqueue"));
  assert.match(html,/id="atualizar-painel"[^>]*>Atualizar painel/);
  assert.match(html, /<script type="module" src="\.\.\/js\/shell\/paginaLseed\.js"><\/script>/);
  for (const id of ["modelo", "tema", "areas", "abas", "falas", "form", "mensagem", "enviar", "acesso", "aviso", "arquivo", "conversa", "painel", "consulta", "consulta-rotulo", "consulta-q", "itens", "painel-aviso", "painel-texto", "salvas", "abrir-cofre"])
    assert.match(html, new RegExp(`id="${id}"`), `falta #${id}`);
});

test("refresh SMARTQUEUE consulta a Central sem cache e sem escrever dados",async()=>{
  const calls=[];
  const motor=criarMotorLseed({fetch:async(url,op)=>{calls.push({url,op});return respostaJson({area:"projetos",aba:"smartqueue",texto:`P0 pendentes: ${calls.length}`});}});
  const args={area:"projetos",aba:"smartqueue"};
  assert.equal((await motor.painel(args)).texto,"P0 pendentes: 1");
  assert.equal((await motor.painel(args)).texto,"P0 pendentes: 2");
  assert.ok(calls.every(c=>c.url==="/api/painel?area=projetos&aba=smartqueue&q=&item="&&c.op.cache==="no-store"&&!c.op.method&&!c.op.body));
});

test("painel, conversas e abrirConversa usam as rotas de leitura da Central", async () => {
  const urls = [];
  const motor = criarMotorLseed({ fetch: async url => { urls.push(url);
    if (url.startsWith("/api/painel")) return respostaJson({ area: "projetos", aba: "dna", itens: ["prj-a"], texto: "" });
    if (url === "/api/conversas") return respostaJson({ conversas: [{ arquivo: "a b.md", nome: "a b" }] });
    if (url.startsWith("/api/conversa?")) return respostaJson({ persona: "aura", titulo: "t", mensagens: [{ role: "user", content: "oi" }] });
    return respostaJson({ erro: "conversa não encontrada" }, 404); } });
  assert.deepEqual((await motor.painel({ area: "projetos", aba: "dna", item: "prj-a" })).itens, ["prj-a"]);
  assert.deepEqual(await motor.conversas(), [{ arquivo: "a b.md", nome: "a b" }]);
  assert.equal((await motor.abrirConversa("a b.md")).persona, "aura");
  assert.deepEqual(urls, ["/api/painel?area=projetos&aba=dna&q=&item=prj-a", "/api/conversas", "/api/conversa?arquivo=a+b.md"]);
  const falha = criarMotorLseed({ fetch: async () => respostaJson({ erro: "conversa não encontrada" }, 404) });
  await assert.rejects(falha.abrirConversa("x.md"), /conversa não encontrada/);
});

test("conversa aberta do cofre substitui só a da persona e descarta falas estranhas", () => {
  const s = criarSessao(PERSONAS, "leila");
  adicionarFala(s, "leila", "user", "fica");
  carregarConversa(s, "aura", [{ role: "user", content: "oi" }, { role: "system", content: "x" }, { role: "assistant", content: "olá" }]);
  assert.deepEqual(s.conversas.aura, [{ role: "user", content: "oi" }, { role: "assistant", content: "olá" }]);
  assert.deepEqual(s.conversas.leila, [{ role: "user", content: "fica" }]);
  assert.equal(s.personaAtiva, "aura");
  assert.throws(() => carregarConversa(s, "zeca", []), /persona desconhecida/);
});
