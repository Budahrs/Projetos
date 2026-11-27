// Contrato de ferramenta MCP do acervo (PROC-MCP-001; piloto L-SEED ↔ Hephaestus do issue #44).
// O verificador é único e mora no orquestrador; o Hephaestus é um dos consumidores (o outro é o L-SEED).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// O verificador mora no Orquestrador do acervo completo. Na cópia pública (só hefestus/) ele não existe: o teste é pulado.
const verificador = resolve(raiz, "../orquestrador/lib/contrato-mcp.mjs");
const semOrquestrador = existsSync(verificador) ? false : "Orquestrador do acervo ausente (cópia só com hefestus/)";
const { verificarServidor, verificarNegociacao } = semOrquestrador ? {} : await import(verificador);

test("servidor MCP do Hefestus cumpre o contrato do acervo (sem erros)", { skip: semOrquestrador }, async () => {
  const pasta = mkdtempSync(join(tmpdir(), "hefestus-contrato-"));
  const args = [join(raiz, "ferramentas/hefestus-mcp.mjs"), pasta];
  const r = await verificarServidor({ comando: process.execPath, args });
  assert.deepEqual(r.erros, []);
  assert.equal(r.prefixo, "hefestus");
  assert.ok(r.ferramentas.length >= 30);
  assert.deepEqual((await verificarNegociacao({ comando: process.execPath, args })).avisos, []);
});
