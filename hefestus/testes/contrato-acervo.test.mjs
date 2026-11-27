// Contrato de ferramenta MCP do acervo (PROC-MCP-001; piloto L-SEED ↔ Hephaestus do issue #44).
// O verificador é único e mora no orquestrador; o Hephaestus é um dos consumidores (o outro é o L-SEED).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { verificarServidor, verificarNegociacao } from "../../orquestrador/lib/contrato-mcp.mjs";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("servidor MCP do Hefestus cumpre o contrato do acervo (sem erros)", async () => {
  const pasta = mkdtempSync(join(tmpdir(), "hefestus-contrato-"));
  const args = [join(raiz, "ferramentas/hefestus-mcp.mjs"), pasta];
  const r = await verificarServidor({ comando: process.execPath, args });
  assert.deepEqual(r.erros, []);
  assert.equal(r.prefixo, "hefestus");
  assert.ok(r.ferramentas.length >= 30);
  assert.deepEqual((await verificarNegociacao({ comando: process.execPath, args })).avisos, []);
});
