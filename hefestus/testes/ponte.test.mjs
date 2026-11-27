import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const codigo = readFileSync(new URL("../src-tauri/ponte.js", import.meta.url), "utf8");
const CHAVE = "hefestus.projeto.v1";
const MARCA = `${CHAVE}.pendente-disco`;
const projeto = nome => JSON.stringify({ formato: "hefestus", documento: { elementos: { __canvas: { nome } } } });

function ambiente({ inicial = {}, disco = null, salvar = async () => {}, cheio = false, carregando = false } = {}) {
  const dados = new Map(Object.entries(inicial));
  class Storage {
    getItem(k) { return dados.get(k) ?? null; }
    setItem(k, v) { if (cheio) throw new Error("cota cheia"); dados.set(k, String(v)); }
    removeItem(k) { dados.delete(k); }
  }
  const timers = new Map();
  const eventos = {};
  const nos = [];
  const chamadas = [];
  let id = 0;
  const document = {
    readyState: carregando ? "loading" : "complete", visibilityState: "visible",
    body: carregando ? null : { append(n) { nos.push(n); } },
    createElement() { return { style: {}, setAttribute() {} }; },
    addEventListener(k, fn) { (eventos[k] ??= []).push(fn); },
  };
  const window = {
    __HEFESTUS_DISCO__: disco,
    __TAURI_INTERNALS__: { invoke(comando, args) {
      if (comando !== "salvar_disco") return Promise.resolve();
      chamadas.push(args.conteudo);
      return salvar(args.conteudo);
    } },
    addEventListener(k, fn) { (eventos[k] ??= []).push(fn); },
  };
  window.top = window;
  const localStorage = new Storage();
  window.localStorage = localStorage;
  vm.runInNewContext(codigo, {
    window, document, localStorage, Storage, performance: { now: () => 0 },
    console: { info() {}, error() {} }, requestAnimationFrame: fn => fn(),
    setTimeout(fn, ms) { const n = ++id; timers.set(n, { fn, ms }); return n; },
    clearTimeout(n) { timers.delete(n); },
  });
  return { dados, chamadas, localStorage, nos, eventos, timers, document,
    async rodar() {
      const [n, t] = timers.entries().next().value;
      timers.delete(n);
      await t.fn();
    },
  };
}

test("falha de disco mantém recuperação, avisa e tenta novamente", async () => {
  let tentativas = 0;
  const a = ambiente({ salvar: async () => { if (++tentativas === 1) throw new Error("disco ocupado"); } });
  a.localStorage.setItem(CHAVE, projeto("novo"));
  await a.rodar();
  assert.equal(a.dados.get(MARCA), "1");
  assert.match(a.nos[0].textContent, /Não foi possível salvar/);
  assert.equal([...a.timers.values()][0].ms, 1000);
  await a.rodar();
  assert.equal(a.chamadas.length, 2);
  assert.equal(a.dados.has(MARCA), false);
  assert.equal(a.nos[0].hidden, true);
});

test("reabertura recupera alterações locais em vez do disco antigo", async () => {
  const novo = projeto("recuperado");
  const a = ambiente({ inicial: { [CHAVE]: novo, [MARCA]: "1" }, disco: projeto("antigo") });
  assert.equal(a.localStorage.getItem(CHAVE), novo);
  await a.rodar();
  assert.deepEqual(a.chamadas, [novo]);
  assert.equal(a.dados.has(MARCA), false);
});

test("sem pendências, carrega o disco; recuperação inválida não substitui projeto válido", () => {
  for (const inicial of [{ [CHAVE]: projeto("local antigo") }, { [CHAVE]: "quebrado", [MARCA]: "1" }]) {
    const disco = projeto("disco");
    const a = ambiente({ inicial, disco });
    assert.equal(a.localStorage.getItem(CHAVE), disco);
  }
});

test("serializa gravações e não descarta edição feita durante uma gravação", async () => {
  let liberar;
  let primeira = true;
  const a = ambiente({ salvar: () => {
    if (!primeira) return Promise.resolve();
    primeira = false;
    return new Promise(resolve => { liberar = resolve; });
  } });
  a.localStorage.setItem(CHAVE, projeto("A"));
  const emCurso = a.rodar();
  a.localStorage.setItem(CHAVE, projeto("B"));
  await a.rodar();
  assert.equal(a.chamadas.length, 1);
  liberar();
  await emCurso;
  assert.equal(a.dados.get(MARCA), "1");
  await a.rodar();
  assert.deepEqual(a.chamadas, [projeto("A"), projeto("B")]);
  assert.equal(a.dados.has(MARCA), false);
});

test("armazenamento cheio avisa e propaga o erro para reduzir o histórico", () => {
  const a = ambiente({ cheio: true });
  assert.throws(() => a.localStorage.setItem(CHAVE, projeto("novo")), /cota cheia/);
  assert.match(a.nos[0].textContent, /armazenamento local/);
});

test("antes de fechar, mantém marcador até a confirmação do disco", async () => {
  const a = ambiente({ salvar: async () => { throw new Error("sem acesso"); } });
  a.localStorage.setItem(CHAVE, projeto("novo"));
  await a.eventos.beforeunload[0]();
  assert.equal(a.dados.get(MARCA), "1");
  assert.equal(a.localStorage.getItem(CHAVE), projeto("novo"));
});

test("falhas sucessivas limitam o intervalo a 30 segundos e preservam a cópia local", async () => {
  const a = ambiente({ salvar: async () => { throw new Error("disco indisponível"); } });
  a.localStorage.setItem(CHAVE, projeto("novo"));
  const intervalos = [];
  for (let i = 0; i < 8; i++) {
    await a.rodar();
    intervalos.push([...a.timers.values()][0].ms);
  }
  assert.deepEqual(intervalos, [1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000]);
  assert.equal(a.dados.get(MARCA), "1");
  assert.equal(a.localStorage.getItem(CHAVE), projeto("novo"));
});

test("falha antes de carregar a tela exibe aviso quando o documento fica pronto", async () => {
  const a = ambiente({ carregando: true, salvar: async () => { throw new Error("sem acesso"); } });
  a.localStorage.setItem(CHAVE, projeto("novo"));
  await a.rodar();
  assert.equal(a.nos.length, 0);
  a.document.body = { append(n) { a.nos.push(n); } };
  for (const fn of a.eventos.DOMContentLoaded) fn();
  assert.match(a.nos[0].textContent, /Não foi possível salvar/);
  assert.equal(a.nos[0].hidden, false);
});
