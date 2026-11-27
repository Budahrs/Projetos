#!/usr/bin/env node
// Gera as fichas das ferramentas MCP (PROC-MCP-001) a partir do próprio servidor:
//   docs/ia/mcp/FERRAMENTAS.md   — uma ficha por ferramenta, legível
//   docs/ia/mcp/ferramentas.json — tools/list completo (schemas e indicações), para validar clientes
// Uso: npm run mcp:fichas            (regrava os dois arquivos)
//      npm run mcp:fichas -- --verificar   (falha se estiverem desatualizados; usado no teste)
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { EFEITOS } from "./efeitosMcp.mjs";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destino = join(raiz, "docs/ia/mcp");

/** Sobe o servidor numa pasta temporária (com snapshot, para listar também as ferramentas legadas) e devolve tools/list. */
export async function listarFerramentas() {
  const pasta = mkdtempSync(join(tmpdir(), "hefestus-fichas-"));
  writeFileSync(join(pasta, "hefestus-contexto.json"), JSON.stringify({ formato: "hefestus.contexto", versao: 1 }));
  try {
    const srv = spawn(process.execPath, [join(raiz, "ferramentas/hefestus-mcp.mjs"), pasta], { stdio: ["pipe", "pipe", "ignore"] });
    let buffer = "";
    const resposta = new Promise((ok, erro) => {
      srv.stdout.on("data", d => {
        buffer += d;
        for (const linha of buffer.split("\n").slice(0, -1)) {
          const m = JSON.parse(linha);
          if (m.id === 2) { srv.kill(); m.error ? erro(new Error(m.error.message)) : ok(m.result.tools); }
        }
        buffer = buffer.slice(buffer.lastIndexOf("\n") + 1);
      });
      srv.on("error", erro);
    });
    srv.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "fichas", version: "1" } } }) + "\n");
    srv.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }) + "\n");
    return await resposta;
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}

const EFEITO_TXT = { leitura: "Leitura", documento: "Altera o projeto", arquivo: "Grava arquivo na pasta de trabalho", fora: "Grava fora da pasta de trabalho" };
const sim = v => (v ? "sim" : "não");
const celula = t => String(t ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");

export function fichasMarkdown(tools) {
  const versao = JSON.parse(readFileSync(join(raiz, "package.json"), "utf8")).version;
  const linhas = tools.map(t => {
    const e = EFEITOS[t.name];
    return `| \`${t.name}\` | ${EFEITO_TXT[e.efeito]} | ${sim(e.destrutiva)} | ${sim(e.idempotente)} | ${sim(e.confirmar)} |`;
  });
  const fichas = tools.map(t => {
    const e = EFEITOS[t.name];
    const props = Object.entries(t.inputSchema.properties ?? {});
    const req = new Set(t.inputSchema.required ?? []);
    const params = props.length
      ? props.map(([k, v]) => `| \`${k}\` | ${v.type ?? "—"} | ${req.has(k) ? "sim" : "não"} | ${celula(v.description)} |`).join("\n")
      : "| — | — | — | Sem parâmetros |";
    return `### \`${t.name}\`

${celula(t.description)}

- **Efeito:** ${EFEITO_TXT[e.efeito]}. Destrutiva: ${sim(e.destrutiva)}. Idempotente: ${sim(e.idempotente)}. Pedir confirmação: ${sim(e.confirmar)}.${e.nota ? `\n- **Nota:** ${e.nota}` : ""}
- **Indicações MCP:** \`${JSON.stringify(t.annotations)}\`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
${params}
`;
  });
  return `# Ferramentas MCP do Hefestus — fichas

Gerado por \`npm run mcp:fichas\` a partir do servidor \`ferramentas/hefestus-mcp.mjs\` (versão ${versao}, protocolo 2025-06-18) e dos efeitos declarados em \`ferramentas/efeitosMcp.mjs\`. Não editar à mão. Procedimento: PROC-MCP-001 (\`padroes/PROCEDIMENTOS_IA.md\` §4, bíblia §11.1). Schemas completos: [ferramentas.json](ferramentas.json).

Estado: **implementado e testado** (\`testes/mcp.test.mjs\`: contrato, equivalência motor/CLI/MCP, erros e caminhos). Não homologado com clientes MCP reais.

Todas as ferramentas usam o mesmo núcleo e as mesmas ferramentas do agente do editor e da CLI. Nenhuma conversa com serviços externos. Erros voltam com \`isError: true\` e mensagem acionável; o resultado sai como texto JSON e como \`structuredContent\`.

## Resumo (${tools.length} ferramentas)

| Ferramenta | Efeito | Destrutiva | Idempotente | Confirmar |
| --- | --- | --- | --- | --- |
${linhas.join("\n")}

## Fichas

${fichas.join("\n")}`;
}

async function principal() {
  const tools = await listarFerramentas();
  const faltam = tools.filter(t => !EFEITOS[t.name]).map(t => t.name);
  if (faltam.length) throw new Error(`Sem efeitos declarados: ${faltam.join(", ")}`);
  const md = fichasMarkdown(tools);
  const json = JSON.stringify({ protocolo: "2025-06-18", ferramentas: tools }, null, 2) + "\n";
  const arquivos = [[join(destino, "FERRAMENTAS.md"), md], [join(destino, "ferramentas.json"), json]];
  if (process.argv.includes("--verificar")) {
    // compara sem CR: no Windows o Git pode entregar o arquivo com CRLF
    const velhos = arquivos.filter(([f, c]) => !existsSync(f) || readFileSync(f, "utf8").replaceAll("\r\n", "\n") !== c).map(([f]) => f);
    if (velhos.length) { console.error(`Fichas desatualizadas: rode npm run mcp:fichas\n${velhos.join("\n")}`); process.exit(1); }
    console.log(`Fichas em dia (${tools.length} ferramentas).`);
    return;
  }
  mkdirSync(destino, { recursive: true });
  for (const [f, c] of arquivos) writeFileSync(f, c);
  console.log(`docs/ia/mcp: ${tools.length} fichas geradas.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal().catch(e => { console.error(e.message); process.exit(1); });
