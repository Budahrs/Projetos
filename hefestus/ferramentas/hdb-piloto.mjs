// Piloto F1/HDB: preserva uma capacidade real e suas dependências de teste.
// Não importa código de outros projetos, não executa conteúdo de pacotes e não altera o banco existente.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Armazem, MeioMemoria } from '../js/nucleo/armazem.js';
import { versaoValida } from '../js/nucleo/versoes.js';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROJETO = 'prj-hefestus';
const sha = (alg, bytes) => createHash(alg).update(bytes).digest('hex');
// Catálogo explícito: só fontes revisadas, nunca varredura ou execução de scripts arbitrários.
export const CAPACIDADES_HDB = Object.freeze({
  'armazem-piloto': { nome: 'Armazém de fontes e artefatos', entrada: 'js/nucleo/armazem.js', teste: 'testes/armazem.test.mjs',
    dependencias: ['js/nucleo/versoes.js', 'js/nucleo/sincronizar.js'] },
  'versoes': { nome: 'Versionamento semântico', entrada: 'js/nucleo/versoes.js', teste: 'testes/hdb-versoes.test.mjs', dependencias: [] },
  'areas-shell': { nome: 'Áreas e abas do App Shell', entrada: 'js/shell/areas.js', teste: 'testes/hdb-areas.test.mjs', dependencias: [] },
  'sessao-conversa': { nome: 'Sessões de conversa por persona', entrada: 'js/shell/sessaoConversa.js', teste: 'testes/hdb-sessao.test.mjs', dependencias: [] },
  'comandos': { nome: 'Registro de comandos da interface', entrada: 'js/nucleo/comandos.js', teste: 'testes/hdb-comandos.test.mjs', dependencias: [] },
  'perfil-validacao': { nome: 'Validação de perfil do App Shell', entrada: 'js/shell/perfil.js', teste: 'testes/hdb-perfil.test.mjs',
    dependencias: ['perfis/perfil.schema.json', 'perfis/l-seed.perfil.json'] },
  'temas-compartilhados': { nome: 'Temas compartilhados e contraste', entrada: 'js/nucleo/temasCompartilhados.js', teste: 'testes/hdb-temas.test.mjs', dependencias: [] },
  'formas-vetoriais': { nome: 'Biblioteca de formas vetoriais', entrada: 'js/nucleo/formas.js', teste: 'testes/hdb-formas.test.mjs',
    dependencias: ['js/nucleo/estiloAvancado.js'] },
});
const fontes = d => [d.entrada, ...d.dependencias, d.teste, 'package.json'];
const idCap = d => 'cap-' + sha('sha1', `${PROJETO}|${d.entrada}`).slice(0, 10);

async function guardarCapacidade(banco, raiz, id, versaoPreservacao) {
  const d = CAPACIDADES_HDB[id];
  if (!Object.hasOwn(CAPACIDADES_HDB, id)) throw new Error('Capacidade não cadastrada para HDB');
  const arquivos = {};
  const itens = [];
  for (const caminho of fontes(d)) {
    const bytes = readFileSync(join(raiz, caminho));
    const texto = bytes.toString('utf8');
    if (!Buffer.from(texto, 'utf8').equals(bytes)) throw new Error(`Fonte não é UTF-8: ${caminho}`);
    arquivos[caminho] = texto;
    itens.push({ caminho, sha256: sha('sha256', bytes), bytes: bytes.length });
  }
  const versaoAplicativo = JSON.parse(arquivos['package.json']).version;
  const versao = versaoPreservacao ?? versaoAplicativo;
  if (!versaoValida(versaoAplicativo) || !versaoValida(versao)) throw new Error('Versão inválida');
  const manifesto = {
    formato: 'lseed.capacidade', versaoFormato: 1, id: idCap(d), projeto: PROJETO,
    capacidade: d.nome, versao, entrada: d.entrada,
    ...(versaoPreservacao ? { versaoAplicativo } : {}),
    origem: { tipo: 'fontes-locais', projeto: 'hefestus', status: 'verificado' },
    licenca: { status: 'nao-verificada-para-redistribuicao', escopo: 'uso local autorizado' },
    runtime: { tipo: 'node', minimo: '22', dependenciasExternas: [] },
    receita: { tipo: 'teste', executavel: 'node', argumentos: ['--test', d.teste], esperado: 'codigo 0' },
    efeitos: { restauracao: 'pasta-nova', teste: 'fixtures locais', rede: false },
    arquivos: itens, estado: 'preservado',
  };
  const { entrada } = await banco.guardar({ tipo: 'compartilhado', programa: 'hefestus', id, versao,
    conteudo: { formato: 'hefestus.fontes-ferramentas', versao: 1, arquivos, manifesto }, runtime: 'dados',
    origem: { capacidade: idCap(d), caminho: d.entrada } });
  return { referencia: entrada.chave, manifesto };
}

export async function criarPiloto(raiz = RAIZ) {
  const banco = await new Armazem(new MeioMemoria()).abrir();
  const r = await guardarCapacidade(banco, raiz, 'armazem-piloto');
  return { pacote: await banco.exportar(), ...r };
}

export async function criarLote(raiz = RAIZ, versaoPreservacao) {
  const banco = await new Armazem(new MeioMemoria()).abrir();
  const referencias = [];
  for (const id of Object.keys(CAPACIDADES_HDB)) referencias.push(await guardarCapacidade(banco, raiz, id, versaoPreservacao));
  return { pacote: await banco.exportar(), referencias };
}

export async function conferirPiloto(pacote, referencia) {
  const banco = await new Armazem(new MeioMemoria()).abrir();
  const importacao = await banco.importar(pacote);
  if (importacao.conflitos.length || importacao.corrompidos.length) throw new Error('Pacote com conflitos ou conteúdo corrompido');
  const { dados, entrada } = await banco.resolver(referencia);
  const m = dados?.manifesto;
  if (!Object.hasOwn(CAPACIDADES_HDB, entrada.id)) throw new Error('Capacidade não cadastrada para HDB');
  const d = CAPACIDADES_HDB[entrada.id];
  const fontesEsperadas = fontes(d);
  if (dados?.formato !== 'hefestus.fontes-ferramentas' || m?.formato !== 'lseed.capacidade' || m.versaoFormato !== 1) throw new Error('Manifesto incompatível');
  if (!Array.isArray(m.arquivos) || m.arquivos.length !== fontesEsperadas.length || Object.keys(dados.arquivos ?? {}).length !== fontesEsperadas.length) throw new Error('Quantidade de fontes incorreta');
  const esperados = new Set(fontesEsperadas);
  for (const item of m.arquivos) {
    if (!esperados.delete(item.caminho) || typeof dados.arquivos[item.caminho] !== 'string') throw new Error('Fonte inesperada ou repetida');
    const bytes = Buffer.from(dados.arquivos[item.caminho], 'utf8');
    if (bytes.length !== item.bytes || sha('sha256', bytes) !== item.sha256) throw new Error(`Hash divergente: ${item.caminho}`);
  }
  if (m.id !== idCap(d) || m.projeto !== PROJETO || m.entrada !== d.entrada ||
      m.versao !== entrada.versao || JSON.parse(dados.arquivos['package.json']).version !== (m.versaoAplicativo ?? m.versao) ||
      entrada.chave !== `compartilhado/hefestus/${entrada.id}@${m.versao}` || referencia !== entrada.chave)
    throw new Error('Identidade ou versão do manifesto divergente; use referência exata');
  if (m.receita?.tipo !== 'teste' || m.receita.executavel !== 'node' ||
      JSON.stringify(m.receita.argumentos) !== JSON.stringify(['--test', d.teste]) || m.receita.esperado !== 'codigo 0')
    throw new Error('Receita divergente do catálogo explícito');
  // SHA-1 somente para interoperar com o baseline legado do catálogo; SHA-256
  // continua sendo a verificação de integridade das fontes preservadas.
  return { id: m.id, versao: m.versao, arquivos: m.arquivos.length, referencia,
    sha1Entrada: sha('sha1', Buffer.from(dados.arquivos[d.entrada], 'utf8')),
    status: 'integridade-verificada', manifesto: m };
}

export async function conferirLote(pacote) {
  if (!Array.isArray(pacote?.indice) || !pacote.indice.length || pacote.indice.length > Object.keys(CAPACIDADES_HDB).length)
    throw new Error('Quantidade de capacidades fora do catálogo HDB explícito');
  const referencias = [...new Set(pacote.indice.map(e => e.chave))];
  if (referencias.length !== pacote.indice.length) throw new Error('Referências repetidas no lote');
  const resultados = [];
  for (const ref of referencias) resultados.push(await conferirPiloto(pacote, ref));
  return resultados;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const [acao, destino, referencia] = process.argv.slice(2);
  if (acao === 'gerar' && destino) {
    const { pacote, referencia: ref, manifesto } = await criarPiloto();
    await conferirPiloto(pacote, ref);
    writeFileSync(destino, JSON.stringify(pacote), { flag: 'wx' });
    console.log(JSON.stringify({ referencia: ref, id: manifesto.id, versao: manifesto.versao, arquivos: manifesto.arquivos.length }));
  } else if (acao === 'gerar-lote' && destino) {
    const { pacote, referencias } = await criarLote(RAIZ, referencia || undefined);
    for (const r of referencias) await conferirPiloto(pacote, r.referencia);
    writeFileSync(destino, JSON.stringify(pacote), { flag: 'wx' });
    console.log(JSON.stringify(referencias.map(r => ({ referencia: r.referencia, id: r.manifesto.id, versao: r.manifesto.versao, arquivos: r.manifesto.arquivos.length }))));
  } else if (acao === 'conferir' && destino && referencia) {
    console.log(JSON.stringify(await conferirPiloto(JSON.parse(readFileSync(destino, 'utf8')), referencia)));
  } else if (acao === 'conferir-lote' && destino) {
    console.log(JSON.stringify(await conferirLote(JSON.parse(readFileSync(destino, 'utf8')))));
  } else {
    console.error('Uso: node ferramentas/hdb-piloto.mjs gerar <novo.json> | gerar-lote <novo.json> [versao-preservacao] | conferir <pacote.json> <referencia> | conferir-lote <pacote.json>');
    process.exitCode = 2;
  }
}
