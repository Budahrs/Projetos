#!/usr/bin/env node
// hefestus-cli: cria e edita projetos .hefestus sem abrir o editor.
// Usa o mesmo núcleo e as mesmas ferramentas do agente do editor: as mesmas validações,
// a mesma proteção contra mudanças não pedidas e o mesmo histórico (Ctrl+Z desfaz no editor).
// Toda resposta sai em JSON, para pessoas, scripts e IAs (Claude, Codex) usarem igual.
//
//   node ferramentas/hefestus-cli.mjs descrever
//   node ferramentas/hefestus-cli.mjs modelos
//   node ferramentas/hefestus-cli.mjs novo  painel.hefestus --nome "Painel NOC" --largura 1920 --altura 1080
//   node ferramentas/hefestus-cli.mjs resumo painel.hefestus
//   node ferramentas/hefestus-cli.mjs executar painel.hefestus criar_elemento "{\"tipo\":\"botao\",\"x\":40,\"y\":40}"
//   node ferramentas/hefestus-cli.mjs lote painel.hefestus passos.json
//   node ferramentas/hefestus-cli.mjs html painel.hefestus painel.html
//   node ferramentas/hefestus-cli.mjs ligacoes painel.hefestus --nome "Daedalus NOC"
//   node ferramentas/hefestus-cli.mjs exportar-programa painel.hefestus --nome "Daedalus NOC" --versao 1.0.0
//   node ferramentas/hefestus-cli.mjs importar pdf-studio.hefestus componente.hefestus.json --nome "PDF Studio"

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { exportarPrograma, ligacoesDoPrograma } from "./exportarPrograma.mjs";
import {
  nucleoSemEditor, ferramentasSemEditor, abrirProjeto, novoProjeto, gravarProjeto,
  executarPassos, listaModelos, resumoDocumento, importarComponente, VERSAO_PROJETO,
} from "./motor-projetos.mjs";

const VERSAO_CLI = "0.45.0";
const gerados = [];

function sair(obj, codigo = 0) {
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
  process.exit(codigo);
}
function falhar(mensagem, extra = {}) {
  sair({ ok: false, erro: mensagem, ...extra }, 1);
}

/** Separa --chave valor das posições. */
function argumentos(lista) {
  const pos = [];
  const op = {};
  for (let i = 0; i < lista.length; i++) {
    const a = lista[i];
    if (a.startsWith("--")) {
      const chave = a.slice(2);
      const prox = lista[i + 1];
      if (prox === undefined || prox.startsWith("--")) op[chave] = true;
      else { op[chave] = prox; i++; }
    } else pos.push(a);
  }
  return { pos, op };
}

function abrir(caminho, pastaSaida) {
  try { return abrirProjeto(caminho, pastaSaida, gerados); } catch (e) { falhar(e.message, { arquivo: caminho }); }
}

const { pos, op } = argumentos(process.argv.slice(2));
const [comando, arquivoArg, ...resto] = pos;
const arquivo = arquivoArg ? resolve(arquivoArg) : null;
const pastaSaida = resolve(op.saida ?? (arquivo ? dirname(arquivo) : "."));

switch (comando) {
  case undefined:
  case "ajuda":
  case "--help":
    sair({
      ok: true, programa: "hefestus-cli", versao: VERSAO_CLI, formatoProjeto: VERSAO_PROJETO,
      comandos: {
        descrever: "Lista as ferramentas com descrição e parâmetros (JSON Schema).",
        modelos: "Lista os modelos prontos da biblioteca (id para usar em inserir_modelo).",
        "novo <arquivo> [--nome N] [--largura L] [--altura A] [--fundo #rrggbb] [--substituir]": "Cria um projeto vazio.",
        "resumo <arquivo>": "Mostra a tela e os elementos do projeto.",
        "executar <arquivo> <ferramenta> [json]": "Executa uma ferramenta e salva o projeto.",
        "lote <arquivo> <passos.json>": "Executa uma lista [{ferramenta, args}]. Se um passo falhar, nada é salvo.",
        "html <arquivo> <saida.html>": "Gera o HTML final do projeto.",
        "ligacoes <arquivo> [--nome N] [--ligacoes ligacoes/x.json]": "Mostra como cada comando do programa será ligado (arquivo de ligações, motor, PDF embutido, interface) e o que ainda está pendente.",
        "exportar-programa <arquivo> [--pasta P] [--nome N] [--versao 1.0.0] [--largura L] [--altura A] [--ligacoes ligacoes/x.json]": "Gera o programa com janela própria e instalador (projeto Tauri) em programas/<nome> do Hefestus. Todos os comandos saem ligados: usa ligacoes/<nome>.json se existir (ou --ligacoes) e liga o resto sozinho.",
        "importar <arquivo> <componente.json> [--nome N] [--x X] [--y Y]": "Abre um componente do Hefestus (Biblioteca/Oficina de menus) no projeto. Se o projeto não existir, cria do tamanho do componente.",
      },
      opcoes: { "--saida <pasta>": "Onde gravar arquivos exportados (padrão: pasta do projeto).", "--simular": "Executa sem salvar o projeto." },
    });
    break;

  case "descrever": {
    const n = nucleoSemEditor(pastaSaida);
    sair({ ok: true, programa: "hefestus-cli", versao: VERSAO_CLI, ferramentas: ferramentasSemEditor(n).map(f => ({ nome: f.name, descricao: f.description, parametros: f.inputSchema })) });
    break;
  }

  case "modelos":
    sair({ ok: true, modelos: listaModelos() });
    break;

  case "novo": {
    if (!arquivo) falhar("Informe o arquivo: novo <arquivo.hefestus>");
    if (existsSync(arquivo) && !op.substituir) falhar(`Já existe: ${arquivo}. Use --substituir para sobrescrever.`);
    const n = novoProjeto(pastaSaida, op);
    gravarProjeto(n, arquivo);
    const tela = n.projeto.doc.elementos.__canvas;
    sair({ ok: true, arquivo, tela: { nome: tela.nome, largura: tela.largura, altura: tela.altura, fundo: tela.fundo } });
    break;
  }

  case "resumo": {
    if (!arquivo) falhar("Informe o arquivo: resumo <arquivo.hefestus>");
    const n = abrir(arquivo, pastaSaida);
    sair({ ok: true, arquivo, nome: n.nome, ...resumoDocumento(n) });
    break;
  }

  case "executar": {
    const [ferramenta, json = "{}"] = resto;
    if (!arquivo || !ferramenta) falhar("Uso: executar <arquivo> <ferramenta> [json]");
    let args;
    try { args = JSON.parse(json); } catch { falhar("Os argumentos precisam ser JSON válido."); }
    const n = abrir(arquivo, pastaSaida);
    const r = await executarPassos(n, [{ ferramenta, args }]);
    if (r.ok && !op.simular) gravarProjeto(n, arquivo);
    sair({ ...r, arquivo, salvo: r.ok && !op.simular, gerados }, r.ok ? 0 : 1);
    break;
  }

  case "lote": {
    const [arquivoPassos] = resto;
    if (!arquivo || !arquivoPassos) falhar("Uso: lote <arquivo> <passos.json>");
    let passos;
    try { passos = JSON.parse(readFileSync(resolve(arquivoPassos), "utf8")); } catch (e) { falhar(`Não li os passos: ${e.message}`); }
    if (!Array.isArray(passos)) falhar("O arquivo de passos precisa ser uma lista [{ferramenta, args}].");
    const n = abrir(arquivo, pastaSaida);
    const r = await executarPassos(n, passos);
    if (r.ok && !op.simular) gravarProjeto(n, arquivo);
    sair({ ...r, arquivo, passos: passos.length, salvo: r.ok && !op.simular, gerados }, r.ok ? 0 : 1);
    break;
  }

  case "html": {
    const [saida] = resto;
    if (!arquivo || !saida) falhar("Uso: html <arquivo> <saida.html>");
    const n = abrir(arquivo, pastaSaida);
    const destino = resolve(saida);
    writeFileSync(destino, n.html());
    sair({ ok: true, arquivo, html: destino });
    break;
  }

  case "ligacoes": {
    if (!arquivo) falhar("Uso: ligacoes <arquivo.hefestus> [--nome N] [--ligacoes ligacoes/x.json]");
    const n = abrir(arquivo, pastaSaida);
    let explicitas = null;
    if (op.ligacoes) {
      try { explicitas = JSON.parse(readFileSync(resolve(op.ligacoes), "utf8").replace(/^\uFEFF/, "")); } catch (e) { falhar(`Não li as ligações: ${e.message}`); }
    }
    const { relatorio } = ligacoesDoPrograma(n, { nome: op.nome ?? n.nome, ligacoes: explicitas });
    sair({ ok: true, arquivo, ...relatorio, pendentes: relatorio.itens.filter(i => i.origem === "pendente"), itens: undefined });
    break;
  }

  case "exportar-programa": {
    if (!arquivo) falhar("Uso: exportar-programa <arquivo.hefestus> [--pasta P] [--nome N] [--versao 1.0.0]");
    const n = abrir(arquivo, pastaSaida);
    const raiz = resolve(dirname(fileURLToPath(import.meta.url)), ".."); // caminho real, com espaços e acentos
    const nome = op.nome ?? n.nome;
    const slug = String(nome).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "programa";
    const pasta = resolve(op.pasta ?? join(raiz, "programas", slug));
    let r;
    let ligacoes = null;
    if (op.ligacoes) {
      try { ligacoes = JSON.parse(readFileSync(resolve(op.ligacoes), "utf8").replace(/^\uFEFF/, "")); } catch (e) { falhar(`Não li as ligações: ${e.message}`); }
      if (ligacoes?.formato !== "hefestus.ligacoes") falhar("O arquivo de ligações precisa ter formato \"hefestus.ligacoes\".");
    }
    try { r = exportarPrograma(n, { nome, versao: op.versao, pasta, larguraJanela: op.largura, alturaJanela: op.altura, ligacoes }); } catch (e) { falhar(e.message); }
    sair({ ok: true, ...r, arquivos: r.arquivos.length, ligacoes: { total: r.ligacoes.total, ligados: r.ligacoes.ligados, porOrigem: r.ligacoes.porOrigem, pendentes: r.ligacoes.itens.filter(i => i.origem === "pendente").map(i => i.rotulo) }, proximoPasso: [`cd "${r.pasta}"`, "npm install", "npm run instalador"] });
    break;
  }

  case "importar": {
    const [arquivoComp] = resto;
    if (!arquivo || !arquivoComp) falhar("Uso: importar <arquivo.hefestus> <componente.json>");
    let dados;
    try { dados = JSON.parse(readFileSync(resolve(arquivoComp), "utf8").replace(/^\uFEFF/, "")); } catch (e) { falhar(`Não li o componente: ${e.message}`); }
    const existia = existsSync(arquivo);
    let n;
    if (existia) n = abrir(arquivo, pastaSaida);
    else {
      const tam = dados?.tamanho ?? {};
      n = novoProjeto(pastaSaida, { nome: op.nome ?? dados?.meta?.nome ?? "Projeto importado", largura: Math.max(1280, Math.round((tam.largura ?? 0) + 40)), altura: Math.max(800, Math.round((tam.altura ?? 0) + 40)), fundo: op.fundo });
    }
    let r;
    try { r = importarComponente(n, dados, Number(op.x ?? 20), Number(op.y ?? 20)); } catch (e) { falhar(e.message); }
    if (!op.simular) gravarProjeto(n, arquivo);
    sair({ ok: true, arquivo, projetoNovo: !existia, componente: r.nome, elementos: r.ids.length, tamanho: { largura: r.largura, altura: r.altura }, salvo: !op.simular });
    break;
  }

  default:
    falhar(`Comando desconhecido: ${comando}. Rode sem argumentos para ver a ajuda.`);
}
