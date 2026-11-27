// Sincronização (modo ① Sincronizar) e propagação (③) do ciclo do Hefestus.
//
// Fluxo PULL, nos dois sentidos:
//  • entrada: o Hefestus lê o MANIFESTO de um programa, compara hash e versão com o armazém,
//    pega só o que mudou, compacta, indexa com a proveniência e deduplica;
//  • saída: o Hefestus nunca escreve no repositório de outro programa. Ele monta um PACOTE DE
//    ATUALIZAÇÃO (no mesmo formato de manifesto) e o programa, se tiver assinado (opt-in), puxa.
//
// Todo item do manifesto declara o RUNTIME em que roda, não só a assinatura: uma ferramenta "web"
// roda no Hefestus (navegador), mas não no Anima Studio (PySide6) sem um QWebEngine; "wasm" roda nos
// dois (wasmtime no Python).
import { versaoValida, compararVersoes, satisfaz } from "./versoes.js";
import { chaveDe, hashTexto, canonico } from "./armazem.js";

/** Onde cada runtime executa. "dados" não executa: é só lido. */
export const RUNTIMES = {
  web: { nome: "Navegador (JS/HTML/CSS)", hosts: ["navegador", "qtwebengine", "electron"] },
  wasm: { nome: "WebAssembly", hosts: ["navegador", "wasmtime", "node", "electron", "qtwebengine"] },
  python: { nome: "Python", hosts: ["python", "pyodide"] },
  node: { nome: "Node.js", hosts: ["node", "electron"] },
  nativo: { nome: "Executável nativo", hosts: ["sistema"] },
  dados: { nome: "Dados (JSON, SVG, fontes, tokens)", hosts: ["*"] },
};

/** Hosts conhecidos: o que cada programa consegue executar. */
export const HOSTS = {
  hefestus: ["navegador"],
  "anima-studio": ["python", "wasmtime"],
  "3d-sprite-studio": ["python", "wasmtime"],
  axiom: ["python", "navegador"],
  heartpulse: ["python", "navegador"],
};

export function executavelEm(runtime, hosts) {
  const r = RUNTIMES[runtime];
  if (!r) return false;
  if (r.hosts.includes("*")) return true;
  return [].concat(hosts ?? []).some(h => r.hosts.includes(h));
}

const KIND_RUNTIME = { wasm: "wasm", js: "web", web: "web", json: "dados", svg: "dados", css: "dados", font: "dados", py: "python", python: "python" };

/**
 * Confere e normaliza um manifesto. Aceita o formato do VetorIA (program, version, tools[{id, kind, sig}])
 * e o do Hefestus (programa, versao, ferramentas, artefatos, modelos).
 * @returns {{manifesto, erros: string[], avisos: string[]}}
 */
export function validarManifesto(m) {
  const erros = [], avisos = [];
  if (!m || typeof m !== "object") return { manifesto: null, erros: ["manifesto vazio ou não é JSON"], avisos };
  const programa = m.programa ?? m.program;
  const versao = m.versao ?? m.version;
  if (!programa || !/^[a-z0-9][a-z0-9._-]*$/i.test(programa)) erros.push(`programa inválido: "${programa ?? ""}" (use letras, números, ponto, hífen)`);
  if (!versaoValida(versao)) erros.push(`versão do programa inválida: "${versao ?? ""}"`);
  const itens = [];
  const grupos = [["ferramenta", m.ferramentas ?? m.tools], ["artefato", m.artefatos ?? m.artifacts], ["modelo", m.modelos ?? m.templates], ["compartilhado", m.compartilhados ?? m.shared]];
  const vistos = new Set();
  for (const [tipo, lista] of grupos) {
    if (lista === undefined) continue;
    if (!Array.isArray(lista)) { erros.push(`${tipo}s: precisa ser uma lista`); continue; }
    for (const [i, t] of lista.entries()) {
      const onde = `${tipo} ${t?.id ?? `#${i + 1}`}`;
      if (!t?.id || !/^[a-z0-9][a-z0-9._-]*$/i.test(t.id)) { erros.push(`${onde}: id inválido`); continue; }
      if (vistos.has(`${tipo}/${t.id}`)) { erros.push(`${onde}: id repetido`); continue; }
      vistos.add(`${tipo}/${t.id}`);
      const kind = t.tipo ?? t.kind ?? null;
      let runtime = t.runtime ?? null;
      if (!runtime && KIND_RUNTIME[kind]) { runtime = KIND_RUNTIME[kind]; avisos.push(`${onde}: runtime inferido de kind "${kind}" → ${runtime}. Declare "runtime" no manifesto.`); }
      if (!runtime && (tipo === "artefato" || tipo === "modelo" || tipo === "compartilhado")) runtime = "dados";
      if (!runtime) { erros.push(`${onde}: declare "runtime" (${Object.keys(RUNTIMES).join(", ")}). Ferramenta com UI precisa dizer onde roda.`); continue; }
      if (!RUNTIMES[runtime]) { erros.push(`${onde}: runtime desconhecido "${runtime}"`); continue; }
      const v = t.versao ?? t.version ?? versao;
      if (!versaoValida(v)) { erros.push(`${onde}: versão inválida "${v}"`); continue; }
      if (tipo === "ferramenta" && !(t.assinatura ?? t.sig)) avisos.push(`${onde}: sem assinatura; a consolidação não consegue comparar contratos.`);
      itens.push({
        tipo, id: t.id, versao: v, runtime, kind,
        assinatura: t.assinatura ?? t.sig ?? null,
        hash: t.hash ?? null, arquivo: t.arquivo ?? t.file ?? null,
        conteudo: t.conteudo ?? t.content,
        descricao: t.descricao ?? t.description ?? "",
        fixtures: t.fixtures ?? null,
      });
    }
  }
  if (!itens.length && !erros.length) avisos.push("o manifesto não lista nenhum item");
  return { manifesto: erros.length ? null : { programa, versao, itens, privado: m.privado === true }, erros, avisos };
}

/**
 * Compara o manifesto com o armazém (nada é baixado aqui).
 * estado: "novo" | "atualizado" (versão maior) | "igual" | "conflito" (mesma versão, conteúdo diferente)
 *         | "antigo" (o armazém já tem uma versão maior: mantida, nada a fazer).
 */
export function planoSincronizacao(manifesto, armazem) {
  const itens = manifesto.itens.map(it => {
    const chave = chaveDe({ tipo: it.tipo, programa: manifesto.programa, id: it.id, versao: it.versao });
    const existentes = armazem.versoes(it.tipo, manifesto.programa, it.id);
    const mesma = armazem.entrada(chave);
    const maior = existentes.at(-1) ?? null;
    let estado;
    if (mesma) estado = it.hash && it.hash !== mesma.hash ? "conflito" : "igual";
    else if (!maior) estado = "novo";
    else estado = compararVersoes(it.versao, maior) > 0 ? "atualizado" : "antigo";
    return { ...it, chave, estado, versaoNoArmazem: maior };
  });
  const noManifesto = new Set(itens.map(i => `${i.tipo}/${i.id}`));
  const mantidos = armazem.listar({ programa: manifesto.programa }).filter(e => !noManifesto.has(`${e.tipo}/${e.id}`)).map(e => e.chave);
  const conta = e => itens.filter(i => i.estado === e).length;
  return { programa: manifesto.programa, versao: manifesto.versao, itens, mantidos, resumo: { novos: conta("novo"), atualizados: conta("atualizado"), iguais: conta("igual"), conflitos: conta("conflito"), antigos: conta("antigo") } };
}

/**
 * Executa o plano: só baixa o que é novo ou atualizado. `obterConteudo(item)` devolve o texto/objeto
 * do item (do próprio manifesto, de um arquivo escolhido ou de uma URL). Conflitos nunca entram:
 * o armazém não sobrescreve versão publicada.
 */
export async function sincronizar(armazem, manifesto, obterConteudo, { agora = () => new Date().toISOString() } = {}) {
  await armazem.abrir();
  const plano = planoSincronizacao(manifesto, armazem);
  const log = [], erros = [];
  const contagem = { novos: 0, atualizados: 0, deduplicados: 0, iguais: plano.resumo.iguais, conflitos: plano.resumo.conflitos, antigos: plano.resumo.antigos };
  for (const it of plano.itens) {
    if (it.estado === "igual") { log.push(`= ${it.chave}`); continue; }
    if (it.estado === "antigo") { log.push(`· ${it.chave}: o armazém já tem ${it.versaoNoArmazem}`); continue; }
    if (it.estado === "conflito") { erros.push(`${it.chave}: mesma versão com conteúdo diferente. O programa precisa subir a versão.`); continue; }
    try {
      const conteudo = it.conteudo !== undefined ? it.conteudo : await obterConteudo(it);
      if (conteudo === undefined || conteudo === null) throw new Error("conteúdo não encontrado (inclua o arquivo junto com o manifesto)");
      if (it.hash) {
        const h = await hashTexto(typeof conteudo === "string" ? conteudo : canonico(conteudo));
        if (h !== it.hash) throw new Error(`hash não confere (manifesto ${it.hash.slice(0, 18)}…, arquivo ${h.slice(0, 18)}…)`);
      }
      const r = await armazem.guardar({
        tipo: it.tipo, programa: manifesto.programa, id: it.id, versao: it.versao, conteudo,
        runtime: it.runtime,
        contrato: it.assinatura ? { assinatura: it.assinatura, kind: it.kind, runtime: it.runtime } : null,
        origem: { programa: manifesto.programa, versaoPrograma: manifesto.versao, arquivo: it.arquivo, sincronizadoEm: agora(), ...(manifesto.privado ? { privado: true } : {}) },
        metricas: it.fixtures ? { fixtures: it.fixtures.length } : {},
      });
      if (r.acao === "deduplicado") contagem.deduplicados++;
      it.estado === "novo" ? contagem.novos++ : contagem.atualizados++;
      log.push(`${it.estado === "novo" ? "+" : "↑"} ${it.chave}${r.acao === "deduplicado" ? " (mesmo conteúdo de outro item: guardado uma vez)" : ""}`);
    } catch (e) {
      erros.push(`${it.chave}: ${e.message}`);
    }
  }
  return { plano, contagem, log, erros };
}

// ---------------------------------------------------------- propagação (③), sempre opt-in

/**
 * Assinatura de um programa: o que ele aceita receber do Hefestus.
 * { programa, hosts: ["python"], optIn: true, aceita: ["ferramenta/hefestus/*", "modelo/*"], fixar: { "ferramenta/vetoria/pen": "^1.0.0" } }
 */
export function normalizarAssinatura(a) {
  if (!a?.programa) throw new Error("assinatura sem programa");
  return {
    programa: a.programa,
    hosts: a.hosts ?? HOSTS[a.programa] ?? ["navegador"],
    optIn: a.optIn === true,
    aceita: Array.isArray(a.aceita) && a.aceita.length ? a.aceita : [],
    fixar: a.fixar ?? {},
  };
}

const casa = (padrao, texto) => new RegExp(`^${padrao.split("*").map(p => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`).test(texto);

/** Por que um item (não) é propagado a este programa. */
export function motivoPropagacao(assinatura, entrada) {
  const a = normalizarAssinatura(assinatura);
  const base = `${entrada.tipo}/${entrada.programa}/${entrada.id}`;
  if (!a.optIn) return { permitido: false, motivo: `${a.programa} não aceitou receber atualizações (opt-in desligado)` };
  if (entrada.programa === a.programa) return { permitido: false, motivo: "é do próprio programa" };
  if (!a.aceita.some(p => casa(p, base))) return { permitido: false, motivo: "fora do que o programa aceita" };
  if (entrada.runtime && !executavelEm(entrada.runtime, a.hosts)) return { permitido: false, motivo: `runtime ${entrada.runtime} não roda em ${a.hosts.join("/")}` };
  const faixa = a.fixar[base];
  if (faixa && !satisfaz(entrada.versao, faixa)) return { permitido: false, motivo: `programa fixou ${faixa}` };
  return { permitido: true, motivo: "ok" };
}

/**
 * Pacote de atualização para um programa puxar. `instalados` = { "tipo/programa/id": "versão" } que o
 * programa já tem. Só entram itens permitidos e mais novos que o instalado (a maior versão de cada um).
 */
export async function pacoteParaPrograma(armazem, assinatura, instalados = {}, { agora = () => new Date().toISOString() } = {}) {
  await armazem.abrir();
  const a = normalizarAssinatura(assinatura);
  const ultimos = new Map();
  for (const e of armazem.listar()) ultimos.set(`${e.tipo}/${e.programa}/${e.id}`, e);
  const itens = [], recusados = [];
  for (const [base, e] of ultimos) {
    const m = motivoPropagacao(a, e);
    if (!m.permitido) { recusados.push({ chave: e.chave, motivo: m.motivo }); continue; }
    if (instalados[base] && versaoValida(instalados[base]) && compararVersoes(e.versao, instalados[base]) <= 0) continue;
    const conteudo = await armazem.ler(e.chave);
    itens.push({ tipo: e.tipo, programaOrigem: e.programa, id: e.id, versao: e.versao, runtime: e.runtime, hash: e.hash, assinatura: e.contrato?.assinatura ?? null, formato: e.formato, conteudo, origem: e.origem });
  }
  return {
    formato: "hefestus-pacote-atualizacao", versao: 1, para: a.programa, geradoEm: agora(),
    regra: "pull: o programa decide se e quando aplicar; o Hefestus não escreve no repositório dele",
    itens, recusados,
  };
}
