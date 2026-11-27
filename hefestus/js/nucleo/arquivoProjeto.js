// Formato de arquivo do projeto Hefestus (.hefestus).
// O conteúdo é o mesmo JSON de Nucleo.serializar(): { formato: "hefestus", versao, documento, ... }.
// Toda mudança de estrutura sobe VERSAO_PROJETO e ganha uma migração aqui,
// para que projetos antigos sempre abram nas versões novas.

import { documentosSoftware } from './especificacaoSoftware.js';
import { pacoteProjeto } from './pacoteProjeto.js';

export const VERSAO_PROJETO = 1;
export const EXTENSAO_PROJETO = "hefestus";

/**
 * Migrações: MIGRACOES[n] recebe um projeto na versão n e devolve na versão n + 1.
 * Exemplo para o futuro:
 *   MIGRACOES[1] = d => ({ ...d, versao: 2, documento: { ...d.documento, novoCampo: [] } });
 */
const MIGRACOES = {};

/** Leva qualquer projeto válido para a versão atual. Lança Error se não for um projeto Hefestus. */
export function migrarProjeto(dados) {
  if (dados?.formato !== "hefestus" || !dados.documento?.elementos) throw new Error("Arquivo não é um projeto Hefestus.");
  let d = dados;
  let versao = Number.isInteger(d.versao) && d.versao > 0 ? d.versao : 1;
  if (versao > VERSAO_PROJETO) throw new Error(`Projeto salvo por um Hefestus mais novo (formato ${versao}; este lê até ${VERSAO_PROJETO}). Atualize o Hefestus.`);
  while (versao < VERSAO_PROJETO) {
    const migrar = MIGRACOES[versao];
    if (!migrar) throw new Error(`Falta a migração do formato ${versao} para ${versao + 1}.`);
    d = migrar(d);
    versao += 1;
  }
  return { ...d, versao: VERSAO_PROJETO };
}

/** Lê o texto de um arquivo .hefestus (ou .hefestus.json antigo) e devolve o projeto migrado. */
export function lerProjeto(texto) {
  let dados;
  try {
    dados = JSON.parse(String(texto).replace(/^﻿/, ""));
  } catch {
    throw new Error("Arquivo corrompido ou não é JSON.");
  }
  return migrarProjeto(dados);
}

/** Texto para gravar em disco: JSON indentado, fácil de comparar no Git. */
export function textoDoProjeto(dados) {
  const documentacao = documentosSoftware(dados.documento, dados.documento?.especificacaoSoftware);
  return JSON.stringify({ ...dados, formato: "hefestus", versao: VERSAO_PROJETO,
    documentacao: { formato: 'hefestus.documentacao', versao: 1, arquivos: documentacao },
    pacote: pacoteProjeto(dados.documento, documentacao),
  }, null, 2) + "\n";
}

/** Nome de arquivo sugerido a partir do slug do projeto. */
export function nomeArquivoProjeto(slug) {
  return `${slug || "projeto"}.${EXTENSAO_PROJETO}`;
}
