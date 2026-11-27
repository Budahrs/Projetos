// Superfícies condicionais: a mesma gramática no editor e no artefato, só muda a FONTE DE ESTADO.
//  • editor   → selecao.* (o que está selecionado), tela.*
//  • artefato → user.* / usuario.* e state.* / estado.* (quem usa e o estado em produção), tela.*
// Condições são texto declarativo ("selecao.tipo == texto && selecao.quantidade == 1"), avaliadas sem eval.
// Também: orçamento de superfície (impede poluição da UI) e o encaixe do ribbon da aba ativa (ribbon-slot).
import { lerRef } from "./armazem.js";

/** Orçamento fixo de superfície (seção 5 do documento do Hefestus). */
export const ORCAMENTO = {
  barraSuperior: 7, abas: 6, blocosRibbon: 6,
  menuPrimeiroNivel: 8, menuProfundidade: 2, itensSubmenu: 20,
};

const RAIZES = {
  editor: ["selecao", "tela", "editor"],
  artefato: ["user", "usuario", "state", "estado", "tela"],
};
const SINONIMO = { usuario: "user", estado: "state" };

/**
 * Fonte de estado de um contexto. `ler("selecao.tipo")` no artefato devolve undefined e anota um aviso:
 * selecao.* só existe na edição.
 */
export function criarEstado(contexto, fontes = {}) {
  if (!RAIZES[contexto]) throw new Error(`contexto desconhecido: ${contexto} (editor ou artefato)`);
  const avisos = new Set();
  return {
    contexto, avisos,
    raizes: RAIZES[contexto],
    ler(caminho) {
      const [raiz, ...resto] = String(caminho).split(".");
      if (!RAIZES[contexto].includes(raiz)) { avisos.add(`${raiz}.* não existe no ${contexto === "editor" ? "editor" : "artefato"}`); return undefined; }
      let o = fontes[SINONIMO[raiz] ?? raiz] ?? fontes[raiz];
      for (const k of resto) o = o == null ? o : o[k];
      return o;
    },
  };
}

/** Estado do editor a partir do núcleo: seleção e tela. */
export function estadoDoEditor(n) {
  const ids = n.selecionados?.() ?? (n.selecao ? [n.selecao] : []);
  const els = ids.map(id => n.elemento(id)).filter(Boolean);
  const tipos = [...new Set(els.map(e => e.semantica?.tipo ?? e.tipo))];
  return criarEstado("editor", {
    selecao: {
      quantidade: els.length, vazia: !els.length, tipos,
      tipo: tipos.length === 1 ? tipos[0] : els.length ? "varios" : "",
      id: els.length === 1 ? ids[0] : "", nome: els.length === 1 ? els[0].nome : "",
      travado: els.length > 0 && els.every(e => e.travado),
    },
    tela: { largura: n.tela?.largura, altura: n.tela?.altura },
  });
}

// ---------------------------------------------------------- linguagem de condição

const PALAVRAS = { verdadeiro: true, true: true, falso: false, false: false, nulo: null, null: null, vazio: "" };

function lexar(t) {
  const out = [];
  let i = 0;
  while (i < t.length) {
    const c = t[i];
    if (/\s/.test(c)) { i++; continue; }
    const dois = t.slice(i, i + 2);
    if (["==", "!=", ">=", "<=", "&&", "||"].includes(dois)) { out.push({ op: dois }); i += 2; continue; }
    if ("<>!()[],".includes(c)) { out.push({ op: c }); i++; continue; }
    if (c === "'" || c === '"') {
      const j = t.indexOf(c, i + 1);
      if (j < 0) throw new Error("texto sem aspas de fechamento");
      out.push({ str: t.slice(i + 1, j) }); i = j + 1; continue;
    }
    const m = /^-?\d+(\.\d+)?/.exec(t.slice(i));
    if (m && (c === "-" || /\d/.test(c))) { out.push({ num: Number(m[0]) }); i += m[0].length; continue; }
    const w = /^[\p{L}_][\p{L}\p{N}_.-]*/u.exec(t.slice(i));
    if (!w) throw new Error(`caractere inesperado: ${c}`);
    const p = w[0];
    if (p === "e" || p === "and") out.push({ op: "&&" });
    else if (p === "ou" || p === "or") out.push({ op: "||" });
    else if (p === "nao" || p === "não" || p === "not") out.push({ op: "!" });
    else if (p === "em" || p === "in") out.push({ op: "em" });
    else out.push({ palavra: p });
    i += p.length;
  }
  return out;
}

/** Compila a condição numa função (estado → booleano). Erro de sintaxe vira Error com a mensagem. */
export function compilarCondicao(expr) {
  const toks = lexar(String(expr ?? ""));
  let k = 0;
  const ver = op => toks[k]?.op === op;
  const comer = op => { if (!ver(op)) throw new Error(`esperava "${op}" na condição "${expr}"`); k++; };
  const valor = () => {
    const t = toks[k++];
    if (!t) throw new Error(`condição incompleta: "${expr}"`);
    if (t.op === "(") { const f = ou(); comer(")"); return f; }
    if (t.op === "[") {
      const itens = [];
      while (!ver("]")) { itens.push(valor()); if (ver(",")) k++; else break; }
      comer("]");
      return e => itens.map(f => f(e));
    }
    if ("num" in t) return () => t.num;
    if ("str" in t) return () => t.str;
    if (t.palavra !== undefined) {
      if (t.palavra in PALAVRAS) return () => PALAVRAS[t.palavra];
      if (t.palavra.includes(".")) return e => e.ler(t.palavra);
      return () => t.palavra; // palavra solta é texto: selecao.tipo == texto, user.papel em [admin, editor]
    }
    throw new Error(`não entendi "${t.op}" na condição "${expr}"`);
  };
  const comparacao = () => {
    const a = valor();
    const op = toks[k]?.op;
    if (!["==", "!=", ">", "<", ">=", "<=", "em"].includes(op)) return a;
    k++;
    const b = valor();
    return e => {
      const x = a(e), y = b(e);
      switch (op) {
        case "==": return x == y; // eslint-disable-line eqeqeq -- "1" == 1 é desejado em condições digitadas
        case "!=": return x != y; // eslint-disable-line eqeqeq
        case ">": return x > y;
        case "<": return x < y;
        case ">=": return x >= y;
        case "<=": return x <= y;
        default: return Array.isArray(y) ? y.includes(x) : typeof y === "string" && y.includes(x);
      }
    };
  };
  const nao = () => { if (ver("!")) { k++; const f = nao(); return e => !f(e); } return comparacao(); };
  const e_ = () => { let f = nao(); while (ver("&&")) { k++; const a = f, b = nao(); f = s => !!a(s) && !!b(s); } return f; };
  const ou = () => { let f = e_(); while (ver("||")) { k++; const a = f, b = e_(); f = s => !!a(s) || !!b(s); } return f; };
  if (!toks.length) return () => true;
  const f = ou();
  if (k < toks.length) throw new Error(`sobrou texto na condição "${expr}"`);
  return e => !!f(e);
}

const cacheCond = new Map();
export function avaliarCondicao(expr, estado) {
  if (!cacheCond.has(expr)) cacheCond.set(expr, compilarCondicao(expr));
  return cacheCond.get(expr)(estado);
}

/**
 * Visibilidade de uma superfície. `quando`:
 *  • vazio/ausente → sempre;
 *  • lista de tipos (formato antigo das faixas: ["texto", "botao"]) → o tipo selecionado (ou simulado) está na lista;
 *  • texto → condição declarativa.
 * Condição inválida esconde a superfície (e não quebra a tela).
 */
export function visivel(quando, estado) {
  if (quando == null || quando === "" || (Array.isArray(quando) && !quando.length)) return true;
  if (Array.isArray(quando)) {
    const tipo = estado?.ler?.("selecao.tipo") ?? estado?.simulado ?? "";
    const tipos = estado?.ler?.("selecao.tipos") ?? [];
    return quando.includes(tipo) || tipos.some(t => quando.includes(t));
  }
  try { return avaliarCondicao(quando, estado); } catch { return false; }
}

/** Estado simulado para as faixas feitas pelo formulário ("Simular objeto selecionado"). */
export const estadoSimulado = tipo => criarEstado("editor", { selecao: { tipo: tipo ?? "", tipos: tipo ? [tipo] : [], quantidade: tipo ? 1 : 0, vazia: !tipo } });

/**
 * Abas que aparecem. Aba do editor é assistiva (aparece quando o contexto bate); aba do artefato é autoral
 * (declarada pelo usuário). Acima do orçamento, as excedentes vão para um menu "Mais" em vez de sumir.
 */
export function resolverAbas(abas, estado, { limite = ORCAMENTO.abas, ativa = null } = {}) {
  const vis = abas.filter(a => visivel(a.quando, estado));
  const fixas = vis.filter(a => a.contexto || a.fixa);
  const normais = vis.filter(a => !(a.contexto || a.fixa));
  const cabem = Math.max(0, limite - fixas.length);
  const visiveis = [...normais.slice(0, cabem), ...fixas];
  const excedentes = normais.slice(cabem);
  const ids = new Set(visiveis.map(a => a.id));
  const ativaFinal = ativa && (ids.has(ativa) || excedentes.some(a => a.id === ativa)) ? ativa : visiveis[0]?.id ?? null;
  return { visiveis, excedentes, ativa: ativaFinal };
}

/**
 * Encaixe do ribbon (ribbon-slot): a aba aponta para um ribbon por REFERÊNCIA ("modelo/programa/id@faixa"),
 * que é montado ao entrar na aba e desmontado ao sair. Devolve o nó do grafo de modelos.
 */
export function ribbonDaAba(aba, grafo) {
  if (!aba?.ribbon) return null;
  const r = lerRef(aba.ribbon);
  return grafo.resolver(r.id, r.faixa);
}

// ---------------------------------------------------------- orçamento nos artefatos

const itensReais = lista => (lista ?? []).filter(i => !i.separador);
function profundidade(itens, nivel = 1) {
  let max = nivel;
  for (const i of itens ?? []) if (i.submenu?.length) max = Math.max(max, profundidade(i.submenu, nivel + 1));
  return max;
}

/**
 * Itens de auditoria (mesmo formato de auditoria.js) para menus, faixas e abas feitos pelo formulário
 * que estouram o orçamento de superfície. É aviso, não erro: a decisão continua do usuário.
 */
export function auditarSuperficies(construtor) {
  const out = [];
  const add = (it, mensagem) => out.push({ regra: "orcamento", gravidade: "info", id: null, nome: it.nome ?? it.id, mensagem });
  for (const it of construtor?.itens ?? []) {
    if (it.tipo === "menu") {
      const n1 = itensReais(it.itens).length;
      if (n1 > ORCAMENTO.menuPrimeiroNivel) add(it, `${n1} itens no primeiro nível (orçamento: ${ORCAMENTO.menuPrimeiroNivel}). Agrupe em submenus.`);
      const p = profundidade(it.itens);
      if (p > ORCAMENTO.menuProfundidade) add(it, `${p} níveis de menu (orçamento: ${ORCAMENTO.menuProfundidade}). Prefira um diálogo ou galeria.`);
      for (const i of it.itens ?? []) if (itensReais(i.submenu).length > ORCAMENTO.itensSubmenu) add(it, `submenu "${i.rotulo}" com ${itensReais(i.submenu).length} itens (orçamento: ${ORCAMENTO.itensSubmenu}).`);
    }
    if (it.tipo === "ribbon") {
      if ((it.abas ?? []).length > ORCAMENTO.abas) add(it, `${it.abas.length} abas (orçamento: ${ORCAMENTO.abas}). Use abas condicionais (quando) para as de contexto.`);
      for (const a of it.abas ?? []) if ((a.grupos ?? []).length > ORCAMENTO.blocosRibbon) add(it, `aba "${a.nome}" com ${a.grupos.length} grupos (orçamento: ${ORCAMENTO.blocosRibbon}).`);
    }
    if (it.tipo === "abasDoc" && (it.abas ?? []).length > ORCAMENTO.abas) add(it, `${it.abas.length} abas abertas (orçamento: ${ORCAMENTO.abas}).`);
  }
  return out;
}
