// Grafo de modelos (template-graph): tudo vira modelo, e modelos usam modelos.
// É um DAG versionado (semver): cada nó é um modelo numa versão, com os modelos que usa (por faixa de
// versão), os encaixes (slots) que aceita e a linhagem (de qual modelo derivou). Ciclo é recusado na entrada.
// Níveis: átomo → molécula → organismo → artefato → meta (o próprio editor).
import { compararVersoes, maiorQueSatisfaz, proximaVersao, versaoValida, satisfaz } from "./versoes.js";

export const NIVEIS = {
  atomo: { nome: "Átomo", exemplo: "forma, ícone, texto", contrato: "tokens" },
  molecula: { nome: "Molécula", exemplo: "botão, campo, selo", contrato: "variante, tamanho, rótulo" },
  organismo: { nome: "Organismo", exemplo: "menu, barra de ferramentas, painel NOC", contrato: "itens[], layout" },
  artefato: { nome: "Artefato", exemplo: "página web, painel", contrato: "rota, estado, eventos" },
  meta: { nome: "Meta", exemplo: "o próprio editor", contrato: "os mesmos contratos" },
};
const ORDEM_NIVEL = Object.keys(NIVEIS);

const chaveNo = (id, versao) => `${id}@${versao}`;

export class GrafoModelos {
  constructor() { this.nos = new Map(); this.porId = new Map(); }

  /**
   * Adiciona um modelo numa versão.
   * { id, nome, nivel, versao, usa: [{ id, faixa }], slots: [{ nome, aceita: [ids ou níveis] }], derivadoDe: "id@versão", contrato }
   */
  adicionar(m) {
    if (!m?.id) throw new Error("modelo sem id");
    if (!NIVEIS[m.nivel]) throw new Error(`${m.id}: nível desconhecido "${m.nivel}" (${ORDEM_NIVEL.join(", ")})`);
    const versao = m.versao ?? "1.0.0";
    if (!versaoValida(versao)) throw new Error(`${m.id}: versão inválida "${versao}"`);
    const chave = chaveNo(m.id, versao);
    if (this.nos.has(chave)) throw new Error(`${chave} já existe: publique uma versão nova`);
    const usa = (m.usa ?? []).map(u => (typeof u === "string" ? { id: u, faixa: "*" } : { id: u.id, faixa: u.faixa ?? "*" }));
    const no = { id: m.id, nome: m.nome ?? m.id, nivel: m.nivel, versao, usa, slots: m.slots ?? [], derivadoDe: m.derivadoDe ?? null, contrato: m.contrato ?? null, dados: m.dados ?? null };
    this.nos.set(chave, no);
    this.porId.set(m.id, [...(this.porId.get(m.id) ?? []), versao].sort(compararVersoes));
    // só um nó que usa outros pode fechar um ciclo
    if (usa.length) {
      try { this.ordem(); }
      catch (e) { this.nos.delete(chave); this.porId.set(m.id, this.porId.get(m.id).filter(v => v !== versao)); throw e; }
    }
    return no;
  }

  versoes(id) { return [...(this.porId.get(id) ?? [])]; }
  ids() { return [...this.porId.keys()].filter(id => this.porId.get(id).length).sort(); }

  /** O nó que atende a faixa (a maior versão dentro dela). */
  resolver(id, faixa = "*") {
    const v = maiorQueSatisfaz(this.versoes(id), faixa);
    return v ? this.nos.get(chaveNo(id, v)) : null;
  }

  /**
   * Publica a próxima versão a partir da última. `mudanca`: "quebra" | "recurso" | "correcao".
   * A linhagem aponta para a versão anterior.
   */
  publicar(id, mudanca, alteracoes = {}) {
    const ultima = this.resolver(id);
    if (!ultima) throw new Error(`modelo desconhecido: ${id}`);
    const versao = proximaVersao(ultima.versao, mudanca);
    return this.adicionar({ ...ultima, ...alteracoes, id, versao, derivadoDe: chaveNo(id, ultima.versao) });
  }

  /** Arestas resolvidas: para cada nó, os nós que ele usa (na versão escolhida pela faixa). */
  arestas() {
    const out = [];
    for (const no of this.nos.values()) for (const u of no.usa) {
      const alvo = this.resolver(u.id, u.faixa);
      out.push({ de: chaveNo(no.id, no.versao), para: alvo ? chaveNo(alvo.id, alvo.versao) : null, id: u.id, faixa: u.faixa });
    }
    return out;
  }

  /** Dependências que não se resolvem (modelo ausente ou nenhuma versão na faixa). */
  pendencias() { return this.arestas().filter(a => !a.para); }

  /** Ordem topológica (dependências antes de quem usa). Lança Error se houver ciclo. */
  ordem() {
    const ordem = [], estado = new Map();
    const porChave = new Map(this.arestas().filter(a => a.para).reduce((m, a) => m.set(a.de, [...(m.get(a.de) ?? []), a.para]), new Map()));
    const visitar = (k, caminho) => {
      if (estado.get(k) === 2) return;
      if (estado.get(k) === 1) throw new Error(`ciclo entre modelos: ${[...caminho, k].join(" → ")}`);
      estado.set(k, 1);
      for (const p of porChave.get(k) ?? []) visitar(p, [...caminho, k]);
      estado.set(k, 2);
      ordem.push(k);
    };
    for (const k of this.nos.keys()) visitar(k, []);
    return ordem;
  }

  /** Quem usa este modelo (direta e indiretamente): o impacto de uma mudança nele. */
  impacto(id, versao) {
    const alvo = versao ? chaveNo(id, versao) : null;
    const diretos = new Map();
    for (const a of this.arestas()) if (a.para && (alvo ? a.para === alvo : a.id === id)) (diretos.get(a.para) ?? diretos.set(a.para, new Set()).get(a.para)).add(a.de);
    const resultado = new Set();
    const todas = this.arestas();
    const fila = [...diretos.values()].flatMap(s => [...s]);
    while (fila.length) {
      const k = fila.shift();
      if (resultado.has(k)) continue;
      resultado.add(k);
      for (const a of todas) if (a.para === k) fila.push(a.de);
    }
    return [...resultado].sort();
  }

  /** Linhagem: a cadeia de versões de que este nó derivou, da mais recente à original. */
  linhagem(id, versao) {
    const out = [];
    let no = versao ? this.nos.get(chaveNo(id, versao)) : this.resolver(id);
    const vistos = new Set();
    while (no && !vistos.has(chaveNo(no.id, no.versao))) {
      vistos.add(chaveNo(no.id, no.versao));
      out.push(chaveNo(no.id, no.versao));
      no = no.derivadoDe ? this.nos.get(no.derivadoDe) : null;
    }
    return out;
  }

  /** O encaixe `slot` do modelo aceita o modelo `idFilho`? (por id ou por nível) */
  slotAceita(id, slot, idFilho, versao) {
    const no = versao ? this.nos.get(chaveNo(id, versao)) : this.resolver(id);
    const s = no?.slots.find(x => x.nome === slot);
    if (!s) return { aceita: false, motivo: `${id} não tem o encaixe "${slot}"` };
    const filho = this.resolver(idFilho);
    if (!filho) return { aceita: false, motivo: `modelo desconhecido: ${idFilho}` };
    if (!s.aceita?.length) return { aceita: true, motivo: "encaixe livre" };
    const ok = s.aceita.includes(filho.id) || s.aceita.includes(filho.nivel);
    return { aceita: ok, motivo: ok ? "ok" : `"${slot}" aceita ${s.aceita.join(", ")}; ${filho.id} é ${NIVEIS[filho.nivel].nome.toLowerCase()}` };
  }

  /** Atualizações disponíveis para quem usa por faixa fixa (ex.: "1.2.0" quando já existe 1.3.0 compatível). */
  atualizacoes() {
    const out = [];
    for (const no of this.nos.values()) for (const u of no.usa) {
      const atual = this.resolver(u.id, u.faixa);
      const ultima = this.resolver(u.id);
      if (atual && ultima && compararVersoes(ultima.versao, atual.versao) > 0) {
        out.push({ em: chaveNo(no.id, no.versao), usa: u.id, faixa: u.faixa, atual: atual.versao, ultima: ultima.versao, compativel: satisfaz(ultima.versao, `^${atual.versao}`) });
      }
    }
    return out;
  }

  serializar() { return { formato: "hefestus-grafo-modelos", versao: 1, nos: this.ordem().map(k => this.nos.get(k)) }; }

  static carregar(dados) {
    const g = new GrafoModelos();
    for (const no of dados?.nos ?? []) g.adicionar(no);
    return g;
  }
}

const slug = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Semente meta: o próprio editor como modelos (meta-circularidade). A partir da especificação do menu
 * real (HEFESTUS_MENU_SPEC), registra editor (meta) → abas (organismo) → grupos (molécula) → comandos (átomo).
 */
export function sementeMeta(spec, versao = "1.0.0") {
  const g = new GrafoModelos();
  const comandos = new Map();
  for (const aba of spec) for (const gr of aba.grupos ?? []) for (const c of gr.comandos ?? []) if (!comandos.has(c.id)) comandos.set(c.id, c);
  for (const c of comandos.values()) g.adicionar({ id: `hefestus.cmd.${c.id}`, nome: c.nome, nivel: "atomo", versao, contrato: { icone: c.icone, tam: c.tam, atalho: c.atalho ?? null } });
  for (const aba of spec) {
    const grupos = [];
    for (const gr of aba.grupos ?? []) {
      const id = `hefestus.grupo.${aba.id}.${slug(gr.nome)}`;
      if (g.resolver(id)) continue;
      g.adicionar({ id, nome: gr.nome, nivel: "molecula", versao, usa: [...new Set((gr.comandos ?? []).map(c => c.id))].map(c => ({ id: `hefestus.cmd.${c}`, faixa: `^${versao}` })) });
      grupos.push(id);
    }
    g.adicionar({ id: `hefestus.aba.${aba.id}`, nome: aba.nome, nivel: "organismo", versao, usa: grupos.map(id => ({ id, faixa: `^${versao}` })), slots: [{ nome: "grupos", aceita: ["molecula"] }] });
  }
  g.adicionar({ id: "hefestus.editor", nome: "Hefestus", nivel: "meta", versao, usa: spec.map(a => ({ id: `hefestus.aba.${a.id}`, faixa: `^${versao}` })), slots: [{ nome: "abas", aceita: ["organismo"] }] });
  return g;
}
