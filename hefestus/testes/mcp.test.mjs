// PROC-MCP-001: contrato do servidor MCP e equivalência com o motor do editor e a CLI (HEF-003).
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, statSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { EFEITOS, anotacoes } from "../ferramentas/efeitosMcp.mjs";
import { novoProjeto, executarPassos, abrirProjeto, gravarProjeto, resumoDocumento } from "../ferramentas/motor-projetos.mjs";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pastaTemp = () => mkdtempSync(join(tmpdir(), "hefestus-mcp-teste-"));

/** Servidor MCP real por stdio, com chamadas JSON-RPC em ordem. */
async function servidor(pasta) {
  const srv = spawn(process.execPath, [join(raiz, "ferramentas/hefestus-mcp.mjs"), pasta], { stdio: ["pipe", "pipe", "ignore"] });
  const pendentes = new Map();
  let buffer = "", id = 0;
  srv.stdout.on("data", d => {
    buffer += d;
    let i;
    while ((i = buffer.indexOf("\n")) >= 0) {
      const m = JSON.parse(buffer.slice(0, i));
      buffer = buffer.slice(i + 1);
      pendentes.get(m.id)?.(m);
      pendentes.delete(m.id);
    }
  });
  const rpc = (method, params) => new Promise(ok => { const n = ++id; pendentes.set(n, ok); srv.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: n, method, params }) + "\n"); });
  const r = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "teste", version: "1" } });
  assert.equal(r.result.protocolVersion, "2025-06-18");
  return {
    rpc,
    chamar: async (name, args) => (await rpc("tools/call", { name, arguments: args })).result,
    fechar: () => srv.kill(),
  };
}

const PASSOS = [
  { ferramenta: "criar_elemento", args: { tipo: "botao", x: 40, y: 40, propriedades: { rotulo: "Salvar" } } },
  { ferramenta: "criar_elemento", args: { tipo: "texto", x: 10, y: 100 } },
  { ferramenta: "alterar_elemento", args: { id: "botao_1", propriedades: { rotulo: "Gravar" } } },
];

test("toda ferramenta listada tem efeitos declarados e indicações derivadas deles", async () => {
  const pasta = pastaTemp();
  writeFileSync(join(pasta, "hefestus-contexto.json"), JSON.stringify({ formato: "hefestus.contexto", versao: 1 }));
  const s = await servidor(pasta);
  try {
    const { tools } = (await s.rpc("tools/list")).result;
    assert.ok(tools.length >= 40);
    const nomes = new Set(tools.map(t => t.name));
    for (const t of tools) {
      assert.match(t.name, /^hefestus_[a-z_]+$/);
      assert.ok(t.description?.trim(), `${t.name} sem descrição`);
      assert.equal(t.inputSchema?.type, "object", `${t.name} sem schema de entrada`);
      assert.ok(EFEITOS[t.name], `${t.name} sem linha em ferramentas/efeitosMcp.mjs`);
      assert.deepEqual(t.annotations, anotacoes(t.name));
    }
    for (const nome of Object.keys(EFEITOS)) assert.ok(nomes.has(nome), `efeito declarado para ferramenta inexistente: ${nome}`);
  } finally { s.fechar(); rmSync(pasta, { recursive: true, force: true }); }
});

test("fichas em docs/ia/mcp estão em dia com o servidor", () => {
  const r = spawnSync(process.execPath, [join(raiz, "ferramentas/fichas-mcp.mjs"), "--verificar"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
});

test("mesmos passos pelo motor do editor, pela CLI e pelo MCP geram o mesmo projeto", async () => {
  const pasta = pastaTemp();
  try {
    // motor: o mesmo núcleo e as mesmas ferramentas que o agente do editor usa
    const n = novoProjeto(pasta, { nome: "Igual" });
    assert.equal((await executarPassos(n, PASSOS)).ok, true);
    gravarProjeto(n, join(pasta, "motor.hefestus"));

    // CLI
    const cli = (...a) => spawnSync(process.execPath, [join(raiz, "ferramentas/hefestus-cli.mjs"), ...a], { cwd: pasta, encoding: "utf8" });
    assert.equal(cli("novo", "cli.hefestus", "--nome", "Igual").status, 0);
    writeFileSync(join(pasta, "passos.json"), JSON.stringify(PASSOS));
    const lote = cli("lote", "cli.hefestus", "passos.json");
    assert.equal(lote.status, 0, lote.stdout);

    // MCP
    const s = await servidor(pasta);
    try {
      assert.ok(!(await s.chamar("hefestus_novo_projeto", { arquivo: "mcp.hefestus", nome: "Igual" })).isError);
      const r = await s.chamar("hefestus_lote", { arquivo: "mcp.hefestus", passos: PASSOS });
      assert.ok(!r.isError, r.content?.[0]?.text);
      assert.equal(r.structuredContent.salvo, true);
    } finally { s.fechar(); }

    const resumo = f => resumoDocumento(abrirProjeto(join(pasta, f), pasta));
    const esperado = resumo("motor.hefestus");
    assert.equal(esperado.elementos.length, 2);
    assert.equal(esperado.elementos.find(e => e.id === "botao_1").rotulo, "Gravar");
    assert.deepEqual(resumo("cli.hefestus"), esperado);
    assert.deepEqual(resumo("mcp.hefestus"), esperado);
  } finally { rmSync(pasta, { recursive: true, force: true }); }
});

test("o mesmo erro sai igual pelo motor, pela CLI e pelo MCP, e nada é gravado", async () => {
  const pasta = pastaTemp();
  const ruim = [{ ferramenta: "criar_elemento", args: { tipo: "inexistente", x: 0, y: 0 } }];
  try {
    const n = novoProjeto(pasta, {});
    const motor = await executarPassos(n, ruim);
    assert.equal(motor.ok, false);

    const cli = (...a) => spawnSync(process.execPath, [join(raiz, "ferramentas/hefestus-cli.mjs"), ...a], { cwd: pasta, encoding: "utf8" });
    cli("novo", "p.hefestus");
    const antes = readFileSync(join(pasta, "p.hefestus"), "utf8");
    const c = cli("executar", "p.hefestus", "criar_elemento", JSON.stringify(ruim[0].args));
    assert.equal(c.status, 1);
    assert.equal(JSON.parse(c.stdout).erro, motor.erro);

    const s = await servidor(pasta);
    try {
      const r = await s.chamar("hefestus_criar_elemento", { arquivo: "p.hefestus", ...ruim[0].args });
      assert.equal(r.isError, true);
      assert.equal(r.structuredContent.erro, motor.erro);
      assert.equal(r.structuredContent.salvo, false);
    } finally { s.fechar(); }
    assert.equal(readFileSync(join(pasta, "p.hefestus"), "utf8"), antes, "projeto alterado apesar do erro");
  } finally { rmSync(pasta, { recursive: true, force: true }); }
});

test("MCP recusa caminhos fora da pasta de trabalho e extensões não permitidas", async () => {
  const pasta = pastaTemp();
  const s = await servidor(pasta);
  try {
    const fora = await s.chamar("hefestus_resumo", { arquivo: "../fora.hefestus" });
    assert.equal(fora.isError, true);
    assert.match(fora.content[0].text, /Fora da pasta de trabalho/);
    const ext = await s.chamar("hefestus_novo_projeto", { arquivo: "notas.txt" });
    assert.equal(ext.isError, true);
    assert.match(ext.content[0].text, /Extensão não permitida/);
    const desconhecida = await s.chamar("hefestus_apagar_tudo", {});
    assert.equal(desconhecida.isError, true);
  } finally { s.fechar(); rmSync(pasta, { recursive: true, force: true }); }
});

test("ferramenta de leitura não regrava o projeto", async () => {
  const pasta = pastaTemp();
  const s = await servidor(pasta);
  try {
    await s.chamar("hefestus_novo_projeto", { arquivo: "l.hefestus" });
    await s.chamar("hefestus_criar_elemento", { arquivo: "l.hefestus", tipo: "botao", x: 1, y: 1 });
    const caminho = join(pasta, "l.hefestus");
    const antes = { texto: readFileSync(caminho, "utf8"), mtime: statSync(caminho).mtimeMs };
    await new Promise(r => setTimeout(r, 30));
    assert.ok(!(await s.chamar("hefestus_explicar_elemento", { arquivo: "l.hefestus", id: "botao_1" })).isError);
    assert.ok(!(await s.chamar("hefestus_resumo", { arquivo: "l.hefestus" })).isError);
    assert.equal(readFileSync(caminho, "utf8"), antes.texto);
    assert.equal(statSync(caminho).mtimeMs, antes.mtime);
  } finally { s.fechar(); rmSync(pasta, { recursive: true, force: true }); }
});
