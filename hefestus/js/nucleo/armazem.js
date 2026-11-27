// Armazém de referências compactadas: o Hefestus guarda CÓPIAS (não ponteiros) das ferramentas,
// artefatos e modelos dos programas. Funciona com os programas fechados ou ausentes.
//
// No navegador o armazém vive no IndexedDB (MeioIndexedDB), não em pastas: o Hefestus roda em
// file:// e não pode escrever no disco. Para levar o armazém a outra máquina, exporte/importe o
// pacote .json. Nos testes usa-se MeioMemoria. A resolução é sempre id → índice → cópia: o
// programa de origem nunca é consultado em tempo de execução.
import { maiorQueSatisfaz, versaoValida, compararVersoes } from "./versoes.js";

export const TIPOS_ARMAZEM = {
  ferramenta: "Ferramenta",
  artefato: "Artefato",
  modelo: "Modelo",
  compartilhado: "Compartilhado (ícones, fontes, tokens)",
};

// ---------------------------------------------------------- utilitários (puros)

/** JSON canônico: chaves em ordem, sem espaços. Dois objetos iguais dão o mesmo texto (e o mesmo hash). */
export function canonico(v) {
  if (v === undefined) return "null";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonico).join(",")}]`;
  return `{${Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => `${JSON.stringify(k)}:${canonico(v[k])}`).join(",")}}`;
}

const cod = new TextEncoder(), decod = new TextDecoder();

/** FNV-1a de 64 bits: só quando o navegador não oferece SHA-256 (o prefixo deixa isso claro). */
function fnv1a64(bytes) {
  let h = 0xcbf29ce484222325n;
  for (const b of bytes) { h ^= BigInt(b); h = (h * 0x100000001b3n) & 0xffffffffffffffffn; }
  return h.toString(16).padStart(16, "0");
}

/** "sha256:…" do texto (ou dos bytes). */
export async function hashTexto(texto) {
  const bytes = typeof texto === "string" ? cod.encode(texto) : texto;
  const sutil = globalThis.crypto?.subtle;
  if (sutil) {
    const d = new Uint8Array(await sutil.digest("SHA-256", bytes));
    return `sha256:${[...d].map(b => b.toString(16).padStart(2, "0")).join("")}`;
  }
  return `fnv1a64:${fnv1a64(bytes)}`;
}

async function passarPor(fluxo, bytes) {
  const saida = new Blob([bytes]).stream().pipeThrough(fluxo);
  return new Uint8Array(await new Response(saida).arrayBuffer());
}

/** Compacta texto em gzip (CompressionStream). Sem suporte, guarda como está e diz isso. */
export async function compactar(texto) {
  const bytes = cod.encode(texto);
  if (typeof CompressionStream === "undefined") return { bytes, compactacao: "nenhuma" };
  return { bytes: await passarPor(new CompressionStream("gzip"), bytes), compactacao: "gzip" };
}

export async function descompactar(bytes, compactacao) {
  if (compactacao === "nenhuma" || !compactacao) return decod.decode(bytes);
  if (compactacao !== "gzip") throw new Error(`compactação desconhecida: ${compactacao}`);
  return decod.decode(await passarPor(new DecompressionStream("gzip"), bytes));
}

export function paraBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export function deBase64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** "ferramenta/vetoria/vectorize@1.2.0" */
export const chaveDe = ({ tipo, programa, id, versao }) => `${tipo}/${programa}/${id}@${versao}`;

/** Lê uma referência "tipo/programa/id@faixa" (a faixa é opcional: "*" quando falta). */
export function lerRef(ref) {
  if (ref && typeof ref === "object") return { tipo: ref.tipo ?? "ferramenta", programa: ref.programa, id: ref.id, faixa: ref.faixa ?? ref.versao ?? "*" };
  const m = /^([a-z]+)\/([^/@\s]+)\/([^@\s]+)(?:@(\S+))?$/i.exec(String(ref ?? "").trim());
  if (!m) throw new Error(`referência inválida: "${ref}" (use tipo/programa/id@versão, ex.: ferramenta/vetoria/pen@^1.0.0)`);
  return { tipo: m[1], programa: m[2], id: m[3], faixa: m[4] ?? "*" };
}

// ---------------------------------------------------------- meios de guarda

/** Guarda em memória (testes, ou quando o navegador não oferece IndexedDB). */
export class MeioMemoria {
  constructor() { this.indice = new Map(); this.blobs = new Map(); this.config = new Map(); this.nome = "memória"; }
  async lerIndice() { return [...this.indice.values()].map(e => structuredClone(e)); }
  async gravarEntrada(e) { this.indice.set(e.chave, structuredClone(e)); }
  async removerEntrada(chave) { this.indice.delete(chave); }
  async lerBlob(hash) { return this.blobs.get(hash) ?? null; }
  async gravarBlob(hash, registro) { this.blobs.set(hash, registro); }
  async removerBlob(hash) { this.blobs.delete(hash); }
  async lerConfig(chave) { return structuredClone(this.config.get(chave)); }
  async gravarConfig(chave, valor) { this.config.set(chave, structuredClone(valor)); }
}

/** Guarda no IndexedDB do navegador: sobrevive a recarregar a página, fica só nesta máquina/navegador. */
export class MeioIndexedDB {
  constructor(nomeBanco = "hefestus-armazem") { this.nomeBanco = nomeBanco; this.nome = "IndexedDB"; this._db = null; }
  static disponivel() { return typeof indexedDB !== "undefined"; }
  abrirBanco() {
    return (this._db ??= new Promise((ok, erro) => {
      const req = indexedDB.open(this.nomeBanco, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const loja of ["indice", "blobs", "config"]) if (!db.objectStoreNames.contains(loja)) db.createObjectStore(loja);
      };
      req.onsuccess = () => ok(req.result);
      req.onerror = () => erro(req.error ?? new Error("IndexedDB indisponível"));
    }));
  }
  async tx(loja, modo, fazer) {
    const db = await this.abrirBanco();
    return new Promise((ok, erro) => {
      const t = db.transaction(loja, modo);
      const req = fazer(t.objectStore(loja));
      t.oncomplete = () => ok(req?.result);
      t.onerror = () => erro(t.error);
      t.onabort = () => erro(t.error ?? new Error("transação abortada"));
    });
  }
  async lerIndice() { return (await this.tx("indice", "readonly", s => s.getAll())) ?? []; }
  gravarEntrada(e) { return this.tx("indice", "readwrite", s => s.put(e, e.chave)); }
  removerEntrada(chave) { return this.tx("indice", "readwrite", s => s.delete(chave)); }
  async lerBlob(hash) { return (await this.tx("blobs", "readonly", s => s.get(hash))) ?? null; }
  gravarBlob(hash, registro) { return this.tx("blobs", "readwrite", s => s.put(registro, hash)); }
  removerBlob(hash) { return this.tx("blobs", "readwrite", s => s.delete(hash)); }
  lerConfig(chave) { return this.tx("config", "readonly", s => s.get(chave)); }
  gravarConfig(chave, valor) { return this.tx("config", "readwrite", s => s.put(valor, chave)); }
}

// ---------------------------------------------------------- o armazém

export class Armazem {
  constructor(meio = new MeioMemoria()) {
    this.meio = meio;
    this.indice = new Map();
    this.aberto = false;
  }

  async abrir() {
    if (this.aberto) return this;
    for (const e of await this.meio.lerIndice()) this.indice.set(e.chave, e);
    this.aberto = true;
    return this;
  }

  /**
   * Guarda uma cópia. `conteudo` é texto (código, SVG, CSS) ou objeto (vira JSON canônico).
   * Mesmo hash = o conteúdo é guardado uma vez só (deduplicação). A proveniência (_origin) nunca é
   * compactada: fica legível em `entrada.origem`.
   * @returns {{entrada, acao: "novo"|"deduplicado"|"igual"}}
   */
  async guardar({ tipo = "ferramenta", programa, id, versao, conteudo, contrato = null, runtime = null, origem = {}, metricas = {} }) {
    await this.abrir();
    if (!TIPOS_ARMAZEM[tipo]) throw new Error(`tipo desconhecido no armazém: ${tipo}`);
    if (!programa || !id) throw new Error("programa e id são obrigatórios");
    if (!versaoValida(versao)) throw new Error(`versão inválida para ${programa}/${id}: "${versao}"`);
    if (conteudo === undefined || conteudo === null) throw new Error(`${programa}/${id}: conteúdo vazio`);
    const formato = typeof conteudo === "string" ? "texto" : "json";
    const texto = formato === "texto" ? conteudo : canonico(conteudo);
    const hash = await hashTexto(texto);
    const chave = chaveDe({ tipo, programa, id, versao });
    const existente = this.indice.get(chave);
    if (existente) {
      if (existente.hash === hash) return { entrada: existente, acao: "igual" };
      throw new Error(`${chave} já existe com outro conteúdo. Publique uma versão nova em vez de sobrescrever.`);
    }
    let blob = await this.meio.lerBlob(hash);
    const acao = blob ? "deduplicado" : "novo";
    if (!blob) {
      const { bytes, compactacao } = await compactar(texto);
      blob = { bytes, compactacao, tamanhoOriginal: cod.encode(texto).length };
      await this.meio.gravarBlob(hash, blob);
    }
    const entrada = {
      chave, tipo, programa, id, versao, hash, formato,
      tamanhoOriginal: blob.tamanhoOriginal, tamanhoCompactado: blob.bytes.length, compactacao: blob.compactacao,
      contrato, runtime, metricas, usadoPor: [],
      origem: { programa, versao, ...origem, guardadoEm: origem.guardadoEm ?? new Date().toISOString() },
    };
    this.indice.set(chave, entrada);
    await this.meio.gravarEntrada(entrada);
    return { entrada, acao };
  }

  listar({ tipo, programa, id } = {}) {
    return [...this.indice.values()]
      .filter(e => (!tipo || e.tipo === tipo) && (!programa || e.programa === programa) && (!id || e.id === id))
      .sort((a, b) => a.programa.localeCompare(b.programa) || a.id.localeCompare(b.id) || compararVersoes(a.versao, b.versao));
  }

  versoes(tipo, programa, id) { return this.listar({ tipo, programa, id }).map(e => e.versao); }
  entrada(chave) { return this.indice.get(chave) ?? null; }

  /** Entrada que atende à referência (a maior versão dentro da faixa), sem ler o conteúdo. */
  localizar(ref) {
    const r = lerRef(ref);
    const v = maiorQueSatisfaz(this.versoes(r.tipo, r.programa, r.id), r.faixa);
    return v ? this.indice.get(chaveDe({ ...r, versao: v })) : null;
  }

  /** id → índice → cópia compactada → conteúdo. Nunca consulta o programa de origem. */
  async resolver(ref) {
    await this.abrir();
    const entrada = this.localizar(ref);
    if (!entrada) {
      const r = lerRef(ref);
      throw new Error(`não está no armazém: ${r.tipo}/${r.programa}/${r.id}@${r.faixa}`);
    }
    const conteudo = await this.ler(entrada.chave);
    return { entrada, conteudo, dados: entrada.formato === "json" ? JSON.parse(conteudo) : undefined };
  }

  async ler(chave) {
    const e = this.indice.get(chave);
    if (!e) throw new Error(`não está no armazém: ${chave}`);
    const blob = await this.meio.lerBlob(e.hash);
    if (!blob) throw new Error(`${chave}: a cópia sumiu do armazém (hash ${e.hash})`);
    return descompactar(blob.bytes, blob.compactacao);
  }

  /** Marca quem usa a versão (projeto, vínculo, outra ferramenta). Versão em uso nunca é removida. */
  async marcarUso(chave, quem) {
    const e = this.indice.get(chave);
    if (!e) throw new Error(`não está no armazém: ${chave}`);
    if (!e.usadoPor.includes(quem)) { e.usadoPor = [...e.usadoPor, quem]; await this.meio.gravarEntrada(e); }
  }
  async desmarcarUso(chave, quem) {
    const e = this.indice.get(chave);
    if (e && e.usadoPor.includes(quem)) { e.usadoPor = e.usadoPor.filter(q => q !== quem); await this.meio.gravarEntrada(e); }
  }

  async remover(chave) {
    const e = this.indice.get(chave);
    if (!e) return false;
    if (e.usadoPor.length) throw new Error(`${chave} está em uso (${e.usadoPor.join(", ")}): versão em uso nunca é removida.`);
    this.indice.delete(chave);
    await this.meio.removerEntrada(chave);
    if (![...this.indice.values()].some(o => o.hash === e.hash)) await this.meio.removerBlob(e.hash);
    return true;
  }

  async atualizarMetricas(chave, metricas) {
    const e = this.indice.get(chave);
    if (!e) throw new Error(`não está no armazém: ${chave}`);
    e.metricas = { ...e.metricas, ...metricas };
    await this.meio.gravarEntrada(e);
    return e;
  }

  estatisticas() {
    const itens = [...this.indice.values()];
    const porHash = new Map();
    for (const e of itens) if (!porHash.has(e.hash)) porHash.set(e.hash, e);
    const bytesOriginais = itens.reduce((s, e) => s + e.tamanhoOriginal, 0);
    const bytesGuardados = [...porHash.values()].reduce((s, e) => s + e.tamanhoCompactado, 0);
    return {
      itens: itens.length, copias: porHash.size, deduplicados: itens.length - porHash.size,
      programas: new Set(itens.map(e => e.programa)).size,
      bytesOriginais, bytesGuardados,
      economia: bytesOriginais ? Math.round((1 - bytesGuardados / bytesOriginais) * 100) : 0,
    };
  }

  // ---------- configurações do armazém (assinaturas de propagação, decisões, fixtures)
  async config(chave, padrao) { return (await this.meio.lerConfig(chave)) ?? padrao; }
  async definirConfig(chave, valor) { await this.meio.gravarConfig(chave, valor); return valor; }

  // ---------- levar para outra máquina
  /** Pacote .json com índice e cópias (base64). É assim que o armazém vai de uma máquina para a outra. */
  async exportar() {
    await this.abrir();
    const blobs = {};
    for (const e of this.indice.values()) {
      if (blobs[e.hash]) continue;
      const b = await this.meio.lerBlob(e.hash);
      if (b) blobs[e.hash] = { compactacao: b.compactacao, tamanhoOriginal: b.tamanhoOriginal, base64: paraBase64(b.bytes) };
    }
    const config = {};
    for (const k of ["assinaturas", "decisoes", "fixtures"]) { const v = await this.meio.lerConfig(k); if (v !== undefined) config[k] = v; }
    return { formato: "hefestus-armazem", versao: 1, exportadoEm: new Date().toISOString(), indice: [...this.indice.values()], blobs, config };
  }

  /** Junta um pacote exportado. Confere o hash de cada cópia; conflitos de versão não sobrescrevem nada. */
  async importar(pacote) {
    await this.abrir();
    if (pacote?.formato !== "hefestus-armazem") throw new Error("arquivo não é um armazém do Hefestus");
    const relatorio = { novos: 0, iguais: 0, conflitos: [], corrompidos: [] };
    for (const e of pacote.indice ?? []) {
      const b = pacote.blobs?.[e.hash];
      if (!b) { relatorio.corrompidos.push(e.chave); continue; }
      const bytes = deBase64(b.base64);
      const texto = await descompactar(bytes, b.compactacao);
      if (await hashTexto(texto) !== e.hash) { relatorio.corrompidos.push(e.chave); continue; }
      const atual = this.indice.get(e.chave);
      if (atual) { atual.hash === e.hash ? relatorio.iguais++ : relatorio.conflitos.push(e.chave); continue; }
      if (!(await this.meio.lerBlob(e.hash))) await this.meio.gravarBlob(e.hash, { bytes, compactacao: b.compactacao, tamanhoOriginal: b.tamanhoOriginal });
      const nova = { ...e, usadoPor: [] };
      this.indice.set(e.chave, nova);
      await this.meio.gravarEntrada(nova);
      relatorio.novos++;
    }
    for (const [k, v] of Object.entries(pacote.config ?? {})) if ((await this.meio.lerConfig(k)) === undefined) await this.meio.gravarConfig(k, v);
    return relatorio;
  }
}
