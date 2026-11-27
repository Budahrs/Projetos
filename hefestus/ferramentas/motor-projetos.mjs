// Base comum do hefestus-cli e do servidor MCP: abrir, editar e gravar projetos .hefestus
// sem o editor aberto, com o mesmo núcleo, as mesmas ferramentas do agente e o mesmo histórico.

import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Nucleo } from "../js/nucleo/nucleo.js";
import { criarFerramentas, resumoDocumento } from "../js/agente/ferramentas.js";
import { lerProjeto, textoDoProjeto, VERSAO_PROJETO } from "../js/nucleo/arquivoProjeto.js";
import { PALETAS } from "../js/ui/temas.js";
import { MODELOS, deComponente } from "../js/nucleo/modelos.js";

export { resumoDocumento, VERSAO_PROJETO };

// Ferramentas que só fazem sentido com o editor aberto (mudam a aparência do próprio editor).
const SO_NO_EDITOR = new Set(["tema_interface"]);

/** Núcleo sem navegador. Arquivos que o núcleo "baixaria" vão para `pastaSaida` e entram em `gerados`. */
export function nucleoSemEditor(pastaSaida, gerados = []) {
  const n = new Nucleo();
  n.autosalvar = () => {};
  n.baixar = async (nome, conteudo) => {
    mkdirSync(pastaSaida, { recursive: true });
    writeFileSync(join(pastaSaida, nome), conteudo);
    gerados.push(join(pastaSaida, nome));
    return "salvo";
  };
  return n;
}

/** As ferramentas do agente, prontas para uso fora do editor. */
export function ferramentasSemEditor(n) {
  const app = {
    aplicarPaleta(chave) {
      const t = PALETAS[chave];
      if (!t) return;
      return n.aplicarEmTodos(["estilo.fundo", "estilo.cor", "estilo.borda", "fundo"], el => {
        const c = t.tipos[el.tipo];
        if (!c) return;
        [el.estilo.fundo, el.estilo.cor, el.estilo.borda] = c;
      }, `Paleta ${t.nome} nos elementos`, tela => { tela.fundo = t.tela; });
    },
  };
  return criarFerramentas(n, app).filter(f => !SO_NO_EDITOR.has(f.name));
}

/** Abre um .hefestus. Lança Error com mensagem clara. */
export function abrirProjeto(caminho, pastaSaida, gerados) {
  if (!existsSync(caminho)) throw new Error(`Arquivo não encontrado: ${caminho}`);
  const n = nucleoSemEditor(pastaSaida, gerados);
  n.restaurar(lerProjeto(readFileSync(caminho, "utf8")));
  return n;
}

/** Projeto vazio com tela configurada. */
export function novoProjeto(pastaSaida, { nome, largura, altura, fundo } = {}) {
  const n = nucleoSemEditor(pastaSaida);
  n.novo(false);
  const tela = n.projeto.doc.elementos.__canvas;
  if (nome) tela.nome = String(nome);
  if (largura) tela.largura = Math.max(200, Math.round(Number(largura)));
  if (altura) tela.altura = Math.max(200, Math.round(Number(altura)));
  if (fundo) tela.fundo = String(fundo);
  return n;
}

/** Grava sem risco de arquivo pela metade. */
export function gravarProjeto(n, caminho) {
  const temporario = `${caminho}.tmp`;
  writeFileSync(temporario, textoDoProjeto(n.serializar()));
  renameSync(temporario, caminho);
}

/**
 * Executa uma lista de passos [{ ferramenta, args }] em ordem. Para no primeiro erro.
 * Quem chama decide se grava (só deve gravar quando ok === true).
 */
export async function executarPassos(n, passos) {
  const ferramentas = ferramentasSemEditor(n);
  const resultados = [];
  for (const [i, passo] of passos.entries()) {
    const f = ferramentas.find(x => x.name === passo?.ferramenta);
    if (!f) return { ok: false, passo: i, erro: `Ferramenta desconhecida: ${passo?.ferramenta}.`, resultados };
    try {
      const r = await f.execute(passo.args ?? {});
      resultados.push({ ferramenta: f.name, ...r });
      if (r?.ok === false) return { ok: false, passo: i, erro: r.erro ?? r.aviso ?? "a ferramenta não aplicou a mudança", resultados };
    } catch (e) {
      return { ok: false, passo: i, erro: e.message, resultados };
    }
  }
  return { ok: true, resultados };
}

/** Lista curta dos modelos da biblioteca, para quem monta programas escolher peças prontas. */
export function listaModelos() {
  return MODELOS.map(m => ({ id: m.id, nome: m.nome, categoria: m.cat, descricao: m.desc, largura: m.largura, altura: m.altura }));
}

/**
 * Abre um componente do Hefestus (hefestus.componente, exportado pela Biblioteca ou pela Oficina de menus)
 * dentro do projeto, como o "Inserir modelo" do editor. Um passo no histórico. Devolve os ids criados.
 */
export function importarComponente(n, dados, x = 0, y = 0) {
  const modelo = deComponente(dados);
  if (!Array.isArray(modelo.elementos) || !modelo.elementos.length) throw new Error("O componente não tem elementos.");
  const ids = n.inserirModelo(modelo, x, y);
  return { ids, nome: modelo.nome, largura: modelo.largura, altura: modelo.altura };
}
