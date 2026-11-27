// Peças da comunidade para o banco de ferramentas.
//
//   exportar <armazem.json> <chave...> --autor "Nome <email>" --licenca Apache-2.0 [--descricao T] [--saida peca.json]
//       Tira do pacote exportado pelo editor (Armazém › "Exportar armazém (.json)") só as peças pedidas e
//       as dependências delas. Dependências que já estão no banco oficial, iguais, não vão de novo.
//   validar <peca.json...>
//       Confere cada pacote antes de entrar em banco-comunidade/: integridade (hash), formato, contrato,
//       licença compatível, tamanho, conflito com o banco oficial, código perigoso e segredos.
//       Sai com código 1 se houver erro. É o que o CI roda em cada PR.
//
// Não executa o conteúdo das peças: só lê e confere texto.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { Armazem, MeioMemoria, TIPOS_ARMAZEM, chaveDe, hashTexto, descompactar, deBase64 } from "../js/nucleo/armazem.js";
import { versaoValida } from "../js/nucleo/versoes.js";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const BANCO_OFICIAL = join(raiz, "banco", "ferramentas.hefestus.json");

/** Licenças compatíveis com a Apache 2.0 do projeto (identificadores SPDX). */
export const LICENCAS_ACEITAS = ["Apache-2.0", "MIT", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "CC0-1.0", "Unlicense", "Zlib"];
/** Tamanho máximo de cada conteúdo novo (descompactado). Peças grandes pedem conversa antes, numa issue. */
export const LIMITE_BYTES = 1024 * 1024;

const PERIGOSOS = [
  [/\beval\s*\(/, "eval()"],
  [/\bnew\s+Function\s*\(/, "new Function()"],
  [/child_process/, "child_process"],
  [/\brequire\s*\(\s*["'](node:)?(fs|net|http|https|dgram|tls|worker_threads)["']/, "require de módulo do sistema"],
  [/\bfrom\s+["'](node:)?(fs|net|http|https|dgram|tls|child_process|worker_threads)["']/, "import de módulo do sistema"],
  [/\bfetch\s*\(/, "fetch() (acesso à rede)"],
  [/XMLHttpRequest/, "XMLHttpRequest (acesso à rede)"],
  [/\bWebSocket\b/, "WebSocket (acesso à rede)"],
  [/\bprocess\.env\b/, "process.env"],
  [/document\.cookie/, "document.cookie"],
];
const SEGREDOS = [
  [/AKIA[0-9A-Z]{16}/, "chave da AWS"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "chave privada"],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}/, "token do GitHub"],
  [/\bsk-[A-Za-z0-9_-]{20,}/, "chave de API (sk-…)"],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, "token do Slack"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "chave do Google"],
];

const lerJSON = arq => JSON.parse(readFileSync(arq, "utf8"));
const oficial = () => (existsSync(BANCO_OFICIAL) ? lerJSON(BANCO_OFICIAL) : { indice: [] });

/** Monta o pacote de contribuição a partir de um armazém exportado. */
export async function exportarPeca(pacoteArmazem, chaves, { autor, licenca, descricao = "", banco = oficial() } = {}) {
  const armazem = new Armazem(new MeioMemoria());
  const rel = await armazem.importar(pacoteArmazem);
  if (rel.corrompidos.length) throw new Error(`armazém com cópias corrompidas: ${rel.corrompidos.join(", ")}`);
  const pacote = await armazem.exportarPecas(chaves, { contribuicao: { autor, licenca, descricao } });
  const jaNoBanco = new Map((banco.indice ?? []).map(e => [e.chave, e.hash]));
  const pedidas = new Set(pacote.contribuicao.pecas.map(c => armazem.localizar(c)?.chave ?? c));
  const noBanco = e => !pedidas.has(e.chave) && jaNoBanco.get(e.chave) === e.hash;
  pacote.contribuicao.dependenciasNoBanco = pacote.indice.filter(noBanco).map(e => e.chave);
  pacote.indice = pacote.indice.filter(e => !noBanco(e));
  const usados = new Set(pacote.indice.map(e => e.hash));
  for (const h of Object.keys(pacote.blobs)) if (!usados.has(h)) delete pacote.blobs[h];
  return pacote;
}

/** Lista de erros (bloqueiam) e avisos de um pacote de contribuição. Não executa nada. */
export async function validarPeca(pacote, { banco = oficial() } = {}) {
  const erros = [], avisos = [];
  if (pacote?.formato !== "hefestus-armazem" || pacote.versao !== 1) erros.push('formato: esperado "hefestus-armazem" versão 1');
  const c = pacote?.contribuicao;
  if (!c) erros.push("falta o bloco contribuicao (autor, licenca, descricao): use o comando exportar");
  else {
    if (!c.autor || !/\S+/.test(c.autor)) erros.push("contribuicao.autor vazio");
    if (!LICENCAS_ACEITAS.includes(c.licenca)) erros.push(`contribuicao.licenca "${c.licenca ?? ""}" não aceita; use uma de: ${LICENCAS_ACEITAS.join(", ")}`);
    if (!c.descricao) avisos.push("contribuicao.descricao vazia: diga para que serve a peça");
  }
  const indice = Array.isArray(pacote?.indice) ? pacote.indice : [];
  if (!indice.length) erros.push("pacote sem peças");
  const doBanco = new Map((banco.indice ?? []).map(e => [e.chave, e.hash]));
  for (const e of indice) {
    const nome = e.chave ?? "(sem chave)";
    if (!TIPOS_ARMAZEM[e.tipo]) erros.push(`${nome}: tipo "${e.tipo}" desconhecido`);
    if (!versaoValida(e.versao)) erros.push(`${nome}: versão "${e.versao}" inválida`);
    if (e.chave !== chaveDe(e)) erros.push(`${nome}: chave não confere com tipo/programa/id@versão`);
    if (e.usadoPor?.length) erros.push(`${nome}: usadoPor deve sair vazio (não envie nomes de projetos)`);
    if (e.tipo === "ferramenta" && (!e.contrato || typeof e.contrato !== "object" || !e.contrato.type)) erros.push(`${nome}: ferramenta sem contrato (JSON Schema com "type")`);
    if (doBanco.has(e.chave)) {
      if (doBanco.get(e.chave) !== e.hash) erros.push(`${nome}: já existe no banco oficial com outro conteúdo; publique uma versão nova`);
      else avisos.push(`${nome}: já está no banco oficial, igual (pode sair do pacote)`);
    }
    const b = pacote.blobs?.[e.hash];
    if (!b) { erros.push(`${nome}: conteúdo ausente (hash ${e.hash})`); continue; }
    let texto;
    try { texto = await descompactar(deBase64(b.base64), b.compactacao); } catch { erros.push(`${nome}: conteúdo ilegível`); continue; }
    if ((await hashTexto(texto)) !== e.hash) { erros.push(`${nome}: hash não confere (conteúdo alterado ou corrompido)`); continue; }
    if (!doBanco.has(e.chave) && texto.length > LIMITE_BYTES) erros.push(`${nome}: ${Math.round(texto.length / 1024)} KB, acima do limite de ${LIMITE_BYTES / 1024} KB; abra uma issue antes`);
    if (e.formato === "json") { try { JSON.parse(texto); } catch { erros.push(`${nome}: formato json, mas o conteúdo não é JSON`); } }
    for (const [re, o] of PERIGOSOS) if (re.test(texto)) erros.push(`${nome}: usa ${o}; peças do banco não acessam rede, disco nem executam texto`);
    for (const [re, o] of SEGREDOS) if (re.test(texto) || re.test(JSON.stringify(e))) erros.push(`${nome}: parece conter ${o}; remova antes de enviar`);
  }
  return { ok: !erros.length, erros, avisos, pecas: indice.map(e => e.chave) };
}

// ---------------------------------------------------------------- linha de comando
function opcoes(args) {
  const o = { _: [] };
  for (let i = 0; i < args.length; i++) args[i].startsWith("--") ? (o[args[i].slice(2)] = args[++i]) : o._.push(args[i]);
  return o;
}

async function principal([comando, ...resto]) {
  const o = opcoes(resto);
  if (comando === "exportar") {
    const [arquivo, ...chaves] = o._;
    if (!arquivo || !chaves.length || !o.autor || !o.licenca) throw new Error('uso: exportar <armazem.json> <chave...> --autor "Nome <email>" --licenca Apache-2.0 [--descricao T] [--saida peca.json]');
    const pacote = await exportarPeca(lerJSON(arquivo), chaves, { autor: o.autor, licenca: o.licenca, descricao: o.descricao ?? "" });
    const saida = o.saida ?? `${chaves[0].split("@")[0].replaceAll("/", "-")}.peca.json`;
    writeFileSync(saida, JSON.stringify(pacote, null, 1) + "\n");
    const v = await validarPeca(pacote);
    console.log(JSON.stringify({ ok: v.ok, saida: resolve(saida), pecas: v.pecas, dependenciasNoBanco: pacote.contribuicao.dependenciasNoBanco, erros: v.erros, avisos: v.avisos }, null, 2));
    return v.ok ? 0 : 1;
  }
  if (comando === "validar") {
    if (!o._.length) throw new Error("uso: validar <peca.json...>");
    let falhou = false;
    for (const arq of o._) {
      const v = await validarPeca(lerJSON(arq));
      falhou ||= !v.ok;
      console.log(`${v.ok ? "ok  " : "ERRO"} ${basename(arq)} (${v.pecas.length} peça(s))`);
      for (const e of v.erros) console.log(`     erro:  ${e}`);
      for (const a of v.avisos) console.log(`     aviso: ${a}`);
    }
    return falhou ? 1 : 0;
  }
  console.log("Comandos: exportar <armazem.json> <chave...> --autor A --licenca L [--descricao D] [--saida S] | validar <peca.json...>");
  return comando ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  principal(process.argv.slice(2)).then(c => process.exit(c), e => { console.error(`erro: ${e.message}`); process.exit(1); });
