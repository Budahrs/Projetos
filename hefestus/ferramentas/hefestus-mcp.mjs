#!/usr/bin/env node
// Servidor MCP do Hefestus (stdio, protocolo 2025-06-18).
// Deixa o Claude, o Codex ou outra IA criar e editar projetos .hefestus com as mesmas ferramentas
// do agente do editor: mesmas validações, mesma proteção contra mudanças não pedidas, mesmo histórico.
// Cada edição é gravada no arquivo; abra o projeto no Hefestus para ver, refinar ou desfazer (Ctrl+Z).
//
// Uso (na configuração do cliente MCP):
//   comando: node
//   argumentos: <pasta do Hefestus>/ferramentas/hefestus-mcp.mjs <pasta de trabalho com os .hefestus>
//
// Segurança: lê e grava arquivos .hefestus e .html dentro da pasta de trabalho; a exceção é
// hefestus_exportar_programa, que grava em programas/ dentro da pasta do Hefestus.
// Efeitos de cada ferramenta: ferramentas/efeitosMcp.mjs; fichas: docs/ia/mcp/FERRAMENTAS.md.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { resolve, join, relative, isAbsolute, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { createHash } from "node:crypto";
import {
  nucleoSemEditor, ferramentasSemEditor, abrirProjeto, novoProjeto, gravarProjeto,
  executarPassos, listaModelos, resumoDocumento, VERSAO_PROJETO,
} from "./motor-projetos.mjs";
import { exportarPrograma, ligacoesDoPrograma } from "./exportarPrograma.mjs";
import { EFEITOS, anotacoes } from "./efeitosMcp.mjs";
import { ferramentasEngenhariaMcp } from "./engenhariaMcp.mjs";

const PROTOCOLO = "2025-06-18";
const pasta = resolve(process.argv[2] ?? process.cwd());
const raizHefestus = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERSAO = JSON.parse(readFileSync(join(raizHefestus, "package.json"), "utf8")).version;
if (!existsSync(pasta) || !statSync(pasta).isDirectory()) {
  process.stderr.write(`[hefestus-mcp] pasta de trabalho não existe: ${pasta}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------- caminhos seguros
function caminhoNaPasta(arquivo, extensoes) {
  if (typeof arquivo !== "string" || !arquivo.trim()) throw new Error("Informe o arquivo (caminho dentro da pasta de trabalho).");
  const absoluto = resolve(pasta, arquivo);
  const rel = relative(pasta, absoluto);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error(`Fora da pasta de trabalho: ${arquivo}`);
  if (!extensoes.includes(extname(absoluto).toLowerCase())) throw new Error(`Extensão não permitida: use ${extensoes.join(" ou ")}.`);
  return absoluto;
}
const projetoEm = arquivo => caminhoNaPasta(arquivo, [".hefestus"]);

function listarProjetos(dir = pasta, nivel = 0, saida = []) {
  if (nivel > 3) return saida;
  for (const nome of readdirSync(dir)) {
    if (nome.startsWith(".") || nome === "node_modules" || nome === "target") continue;
    const p = join(dir, nome);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) listarProjetos(p, nivel + 1, saida);
    else if (nome.toLowerCase().endsWith(".hefestus")) saida.push({ arquivo: relative(pasta, p).replaceAll("\\", "/"), bytes: st.size, alterado: st.mtime.toISOString() });
  }
  return saida;
}

// ---------------------------------------------------------------- ferramentas
const ARQUIVO = { type: "string", description: "Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: \"painel-noc.hefestus\")." };
const fixas = [
  {
    name: "hefestus_manual",
    description: "Lê o manual de como montar programas no Hefestus (AGENTS.md): fluxo, peças, convenções e checagem final. Leia antes de começar um programa.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    executar: () => {
      const m = join(raizHefestus, "AGENTS.md");
      return { manual: existsSync(m) ? readFileSync(m, "utf8") : "AGENTS.md não encontrado na pasta do Hefestus." };
    },
  },
  {
    name: "hefestus_listar_projetos",
    description: "Lista os projetos .hefestus da pasta de trabalho.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    executar: () => ({ pasta, projetos: listarProjetos() }),
  },
  {
    name: "hefestus_modelos",
    description: "Lista os modelos prontos da biblioteca (menus, faixas, barras, abas, diálogos…). Use o id em hefestus_inserir_modelo: montar com peças prontas é melhor que montar elemento por elemento.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    executar: () => ({ modelos: listaModelos() }),
  },
  {
    name: "hefestus_novo_projeto",
    description: "Cria um projeto .hefestus vazio, com nome e tamanho da tela.",
    inputSchema: {
      type: "object",
      properties: {
        arquivo: ARQUIVO, nome: { type: "string" }, largura: { type: "number", description: "px (padrão 1280)" }, altura: { type: "number", description: "px (padrão 800)" },
        fundo: { type: "string", description: "#rrggbb" }, substituir: { type: "boolean", description: "sobrescrever se já existir" },
      },
      required: ["arquivo"], additionalProperties: false,
    },
    executar: a => {
      const caminho = projetoEm(a.arquivo);
      if (existsSync(caminho) && !a.substituir) throw new Error(`Já existe: ${a.arquivo}. Use substituir: true para sobrescrever.`);
      mkdirSync(dirname(caminho), { recursive: true });
      const n = novoProjeto(dirname(caminho), a);
      gravarProjeto(n, caminho);
      return { ok: true, arquivo: a.arquivo, tela: n.tela };
    },
  },
  {
    name: "hefestus_resumo",
    description: "Mostra a tela e todos os elementos do projeto (id, tipo, posição, tamanho, textos, cores, eventos). Use os ids para alterar, ligar eventos e organizar.",
    inputSchema: { type: "object", properties: { arquivo: ARQUIVO }, required: ["arquivo"], additionalProperties: false },
    executar: a => { const n = abrirProjeto(projetoEm(a.arquivo), pasta); return { ok: true, arquivo: a.arquivo, nome: n.nome, ...resumoDocumento(n) }; },
  },
  {
    name: "hefestus_lote",
    description: "Executa vários passos de uma vez no projeto: lista de { ferramenta, args }, onde ferramenta é o nome sem o prefixo hefestus_ (ex.: \"criar_elemento\"). Tudo ou nada: se um passo falhar, nada é gravado. Prefira lote para montar um esqueleto inteiro.",
    inputSchema: {
      type: "object",
      properties: {
        arquivo: ARQUIVO,
        passos: { type: "array", items: { type: "object", properties: { ferramenta: { type: "string" }, args: { type: "object" } }, required: ["ferramenta"] } },
      },
      required: ["arquivo", "passos"], additionalProperties: false,
    },
    executar: async a => {
      if (!Array.isArray(a.passos) || !a.passos.length) throw new Error("passos precisa ser uma lista com pelo menos um passo.");
      const caminho = projetoEm(a.arquivo);
      const gerados = [];
      const n = abrirProjeto(caminho, dirname(caminho), gerados);
      const passos = a.passos.map(p => ({ ...p, ferramenta: String(p.ferramenta ?? "").replace(/^hefestus_/, "") }));
      const r = await executarPassos(n, passos);
      if (r.ok) gravarProjeto(n, caminho);
      return { ...r, arquivo: a.arquivo, salvo: r.ok, gerados: gerados.map(g => relative(pasta, g)) };
    },
  },
  {
    name: "hefestus_exportar_html",
    description: "Gera o HTML final do projeto (abre em qualquer navegador, com comportamentos e responsivo).",
    inputSchema: { type: "object", properties: { arquivo: ARQUIVO, saida: { type: "string", description: "arquivo .html (padrão: mesmo nome do projeto)" } }, required: ["arquivo"], additionalProperties: false },
    executar: a => {
      const caminho = projetoEm(a.arquivo);
      const destino = caminhoNaPasta(a.saida ?? a.arquivo.replace(/\.hefestus$/i, ".html"), [".html"]);
      const n = abrirProjeto(caminho, pasta);
      writeFileSync(destino, n.html());
      return { ok: true, html: relative(pasta, destino) };
    },
  },
  {
    name: "hefestus_exportar_programa",
    description: "Exporta o projeto como PROGRAMA com janela própria e instalador (projeto Tauri) em programas/<nome> dentro do Hefestus. Todos os comandos saem ligados (veja hefestus_ligacoes). Leva junto o projeto (para reabrir no Hefestus) e programa.json (descrição em linguagem de máquina). O usuário gera o instalador com npm install e npm run instalador nessa pasta.",
    inputSchema: {
      type: "object",
      properties: {
        arquivo: ARQUIVO, nome: { type: "string", description: "nome do programa (padrão: nome do projeto)" },
        versao: { type: "string", description: "x.y.z (padrão 1.0.0)" }, largura: { type: "number", description: "largura da janela" }, altura: { type: "number", description: "altura da janela" },
        ligacoes: { type: "string", description: "arquivo de ligações dentro de ligacoes/ do Hefestus (ex.: \"pdf-studio.json\"): vale sobre ligacoes/<nome>.json, que é usado sozinho quando existe" },
      },
      required: ["arquivo"], additionalProperties: false,
    },
    executar: a => {
      const n = abrirProjeto(projetoEm(a.arquivo), pasta);
      const nome = a.nome || n.nome;
      const slug = String(nome).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "programa";
      let ligacoes = null;
      if (a.ligacoes) {
        const arq = resolve(raizHefestus, "ligacoes", a.ligacoes);
        if (relative(join(raizHefestus, "ligacoes"), arq).startsWith("..")) throw new Error("As ligações precisam estar na pasta ligacoes/ do Hefestus.");
        ligacoes = JSON.parse(readFileSync(arq, "utf8").replace(/^\uFEFF/, ""));
        if (ligacoes?.formato !== "hefestus.ligacoes") throw new Error("Arquivo de ligações inválido (formato).");
      }
      const r = exportarPrograma(n, { nome, versao: a.versao, pasta: join(raizHefestus, "programas", slug), larguraJanela: a.largura, alturaJanela: a.altura, ligacoes });
      return { ok: true, ...r, arquivos: r.arquivos.length, ligacoes: { total: r.ligacoes.total, ligados: r.ligacoes.ligados, porOrigem: r.ligacoes.porOrigem, pendentes: r.ligacoes.itens.filter(i => i.origem === "pendente").map(i => i.rotulo) }, proximoPasso: [`cd "${r.pasta}"`, "npm install", "npm run instalador"] };
    },
  },
  {
    name: "hefestus_ligacoes",
    description: "Mostra como cada comando do programa será ligado ao exportar (o Hefestus liga todos por padrão): pelo arquivo ligacoes/<programa>.json, por um motor externo, pelo motor de PDF embutido ou por ações da janela. Lista os pendentes, que precisam de um motor novo.",
    inputSchema: {
      type: "object",
      properties: { arquivo: ARQUIVO, nome: { type: "string", description: "nome do programa (padrão: nome do projeto); escolhe ligacoes/<nome>.json" } },
      required: ["arquivo"], additionalProperties: false,
    },
    executar: a => {
      const n = abrirProjeto(projetoEm(a.arquivo), pasta);
      const { relatorio } = ligacoesDoPrograma(n, { nome: a.nome || n.nome });
      return { ok: true, ...relatorio };
    },
  },
];

// As 27 ferramentas do agente, cada uma com o parâmetro "arquivo".
const doNucleo = ferramentasSemEditor(nucleoSemEditor(pasta)).map(f => ({
  name: `hefestus_${f.name}`,
  description: `${f.description} (Edita e grava o projeto indicado em "arquivo".)`,
  inputSchema: {
    ...f.inputSchema,
    properties: { arquivo: ARQUIVO, ...(f.inputSchema.properties ?? {}) },
    required: ["arquivo", ...(f.inputSchema.required ?? [])],
  },
  executar: async a => {
    const { arquivo, ...args } = a;
    const caminho = projetoEm(arquivo);
    const gerados = [];
    const n = abrirProjeto(caminho, dirname(caminho), gerados);
    const r = await executarPassos(n, [{ ferramenta: f.name, args }]);
    // ferramenta só de leitura não regrava o arquivo
    if (r.ok && EFEITOS[`hefestus_${f.name}`]?.efeito !== "leitura") gravarProjeto(n, caminho);
    return { ...(r.resultados[0] ?? {}), ok: r.ok, ...(r.ok ? {} : { erro: r.erro }), arquivo, salvo: r.ok, gerados: gerados.map(g => relative(pasta, g)) };
  },
}));

// Compatibilidade com a 0.37: snapshot exportado do editor e propostas de layout.
const legado = existsSync(join(pasta, "hefestus-contexto.json")) ? [
  {
    name: "hefestus_contexto",
    description: "Lê o snapshot exportado do editor (hefestus-contexto.json), com data e hash. Não representa o estado vivo.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    executar: () => snapshot(),
  },
  {
    name: "hefestus_propor_layout",
    description: "Grava uma proposta de layout revisável em propostas/, para importar manualmente no editor.",
    inputSchema: { type: "object", properties: { layout: { type: "object" }, justificativa: { type: "string", minLength: 1 } }, required: ["layout", "justificativa"], additionalProperties: false },
    executar: a => {
      if (!a.layout || typeof a.layout !== "object" || Array.isArray(a.layout) || typeof a.justificativa !== "string" || !a.justificativa.trim()) throw new Error("Layout e justificativa obrigatórios.");
      const atual = snapshot();
      const proposta = { formato: "hefestus.layout", versao: 1, layout: a.layout, justificativa: a.justificativa, contextoSha256: atual.sha256, criadaEm: new Date().toISOString() };
      const nome = `proposta-layout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
      mkdirSync(join(pasta, "propostas"), { recursive: true });
      writeFileSync(join(pasta, "propostas", nome), JSON.stringify(proposta, null, 2), { encoding: "utf8", flag: "wx" });
      return { arquivo: join("propostas", nome), aplicada: false };
    },
  },
] : [];
function snapshot() {
  const arquivo = join(pasta, "hefestus-contexto.json");
  if (statSync(arquivo).size > 10_000_000) throw new Error("Snapshot excede 10 MB.");
  const texto = readFileSync(arquivo, "utf8").replace(/^﻿/, "");
  const dados = JSON.parse(texto);
  if (dados.formato !== "hefestus.contexto" || dados.versao !== 1) throw new Error("Snapshot incompatível.");
  return { sha256: createHash("sha256").update(texto).digest("hex"), dados };
}

const engenharia = ferramentasEngenhariaMcp({pasta,projetoEm});
const ferramentas = [...fixas, ...engenharia, ...doNucleo, ...legado].map(f => ({ ...f, annotations: anotacoes(f.name) }));
const porNome = new Map(ferramentas.map(f => [f.name, f]));

// ---------------------------------------------------------------- JSON-RPC por stdio
let iniciado = false;
const enviar = obj => process.stdout.write(JSON.stringify(obj) + "\n");
const responder = (id, result) => enviar({ jsonrpc: "2.0", id, result });
const erroRpc = (id, code, message) => enviar({ jsonrpc: "2.0", id, error: { code, message } });

async function tratar(m) {
  if (m.method === "notifications/initialized" || m.id === undefined) return;
  switch (m.method) {
    case "initialize":
      iniciado = true;
      return responder(m.id, {
        protocolVersion: PROTOCOLO,
        capabilities: { tools: {} },
        serverInfo: { name: "hefestus", version: VERSAO },
        instructions: `Hefestus: fábrica visual de programas. Pasta de trabalho: ${pasta}. Comece por hefestus_manual. Monte com hefestus_lote e modelos prontos (hefestus_modelos); confira com hefestus_resumo. Formato de projeto ${VERSAO_PROJETO}.`,
      });
    case "ping":
      return responder(m.id, {});
    case "tools/list":
      if (!iniciado) return erroRpc(m.id, -32002, "Inicialize a sessão primeiro.");
      return responder(m.id, { tools: ferramentas.map(({ executar, ...f }) => f) });
    case "tools/call": {
      if (!iniciado) return erroRpc(m.id, -32002, "Inicialize a sessão primeiro.");
      const f = porNome.get(m.params?.name);
      if (!f) return responder(m.id, { isError: true, content: [{ type: "text", text: `Ferramenta desconhecida: ${m.params?.name}` }] });
      try {
        const r = await f.executar(m.params?.arguments ?? {});
        const falhou = r && r.ok === false;
        const estruturado = r && typeof r === "object" && !Array.isArray(r) ? { structuredContent: r } : {};
        return responder(m.id, { ...(falhou ? { isError: true } : {}), content: [{ type: "text", text: JSON.stringify(r, null, 1) }], ...estruturado });
      } catch (e) {
        return responder(m.id, { isError: true, content: [{ type: "text", text: e.message }] });
      }
    }
    default:
      return erroRpc(m.id, -32601, `Método desconhecido: ${m.method}`);
  }
}

// Uma mensagem por vez, na ordem em que chegam (duas edições no mesmo arquivo nunca se cruzam).
let fila = Promise.resolve();
createInterface({ input: process.stdin, crlfDelay: Infinity }).on("line", linha => {
  if (!linha.trim()) return;
  let m;
  try {
    if (linha.length > 5_000_000) throw new Error("Mensagem muito grande.");
    m = JSON.parse(linha);
    if (m.jsonrpc !== "2.0" || typeof m.method !== "string") throw new Error("Mensagem JSON-RPC inválida.");
  } catch (e) {
    return erroRpc(m?.id ?? null, -32700, e.message);
  }
  fila = fila.then(() => tratar(m)).catch(e => erroRpc(m.id ?? null, -32603, e.message));
});
process.stderr.write(`[hefestus-mcp] ${ferramentas.length} ferramentas; pasta de trabalho: ${pasta}\n`);
