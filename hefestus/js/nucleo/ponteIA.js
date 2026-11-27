// Ponte com IA paga na consolidação. Regra: IA propõe, fixtures determinísticas decidem, humano aprova.
// Só três usos valem o custo: explicar divergências, gerar fixtures de borda e propor estratégia de fusão.
// Gestão de custo: cache por hash, cascata (barato para triagem, caro só quando precisa), lote
// (desconto), teto por ciclo. Código privado só vai para IA local.
import { hashTexto, canonico } from "./armazem.js";

export const TAREFAS_IA = {
  explicarDivergencia: { nome: "Explicar divergências", profundoPadrao: false },
  gerarFixturesBorda: { nome: "Gerar fixtures de borda", profundoPadrao: false },
  proporFusao: { nome: "Propor estratégia de fusão", profundoPadrao: true },
};

/** O que a IA não faz, e por quê (aparece como erro para quem tentar). */
export const PROIBIDAS_IA = {
  compararContratos: "comparar contratos é determinístico (consolidacao.js), não precisa de IA",
  rodarFixtures: "rodar fixtures é determinístico (consolidacao.js), não precisa de IA",
  aplicarFusao: "aplicar fusão automaticamente causa regressão silenciosa: fusão é sempre humana",
  decidirMelhor: "a IA não decide o melhor; no máximo vira um sinal no ranking",
};

/** Preços por milhão de tokens: ESTIMATIVA editável (confira a tabela atual do provedor). */
export const MODELOS_PADRAO = {
  triagem: { id: "claude-haiku-5-5", tier: "quick", entrada: 1, saida: 5, maxSaida: 1200 },
  profundo: { id: "claude-sonnet-5-5", tier: "default", entrada: 3, saida: 15, maxSaida: 2400 },
};

const tokensDe = texto => Math.ceil(String(texto ?? "").length / 4);

/** Texto do pedido, em português, por tarefa. A resposta pedida é JSON para poder ser conferida. */
export function montarPrompt(tarefa, entrada) {
  const dados = JSON.stringify(entrada, null, 1).slice(0, 24000);
  const base = {
    explicarDivergencia: `Duas ferramentas com o mesmo contrato deram saídas diferentes nas fixtures abaixo. Explique em português, em até 5 frases, a causa provável de cada divergência (ex.: regra de preenchimento nonzero × evenodd). Não diga qual é melhor.\nResponda só JSON: {"explicacoes":[{"fixture":"…","causa":"…"}],"confianca":0..1,"escalar":true|false}`,
    gerarFixturesBorda: `Sugira até 8 fixtures de borda (casos que o desenvolvedor provavelmente não testou) para comparar as duas ferramentas pelo contrato abaixo. Elas serão RODADAS nas duas; você não decide nada.\nResponda só JSON: {"fixtures":[{"nome":"…","entrada":…}],"confianca":0..1,"escalar":true|false}`,
    proporFusao: `Proponha uma estratégia de fusão para as duas ferramentas, com base nas divergências e nas coberturas abaixo (ex.: "use A como padrão e delegue a B em mode === 'high-precision'"). É só uma proposta para revisão humana.\nResponda só JSON: {"estrategia":"…","base":"a"|"b","delegar":[{"quando":"…","para":"a"|"b"}],"riscos":["…"],"confianca":0..1,"escalar":false}`,
  }[tarefa];
  return `${base}\n\nDados:\n${dados}`;
}

/** Lê o JSON da resposta (tolerante a texto em volta). */
export function lerResposta(texto) {
  const t = String(texto ?? "");
  const i = t.indexOf("{"), j = t.lastIndexOf("}");
  if (i < 0 || j < i) return { texto: t, confianca: 0, escalar: true };
  try { return { ...JSON.parse(t.slice(i, j + 1)), texto: t }; } catch { return { texto: t, confianca: 0, escalar: true }; }
}

export class PonteIA {
  /**
   * @param {object} o
   * @param {object} o.transportes { remoto?: fn, local?: fn } — fn({prompt, modelo, lote}) → {texto, uso?: {entrada, saida}}
   * @param {number} o.teto  US$ por ciclo
   */
  constructor({ transportes = {}, modelos = MODELOS_PADRAO, teto = 5, cache = new Map(), agora = () => new Date().toISOString() } = {}) {
    this.transportes = transportes;
    this.modelos = modelos;
    this.teto = teto;
    this.cache = cache;
    this.agora = agora;
    this.gasto = 0;
    this.registro = [];
    this.fila = [];
  }

  disponivel(privado = false) { return !!(privado ? this.transportes.local : this.transportes.remoto || this.transportes.local); }
  novoCiclo() { this.gasto = 0; }
  restante() { return Math.max(0, this.teto - this.gasto); }

  estimar(prompt, modelo, lote = false) {
    const custo = (tokensDe(prompt) * modelo.entrada + modelo.maxSaida * modelo.saida) / 1e6;
    return lote ? custo / 2 : custo;
  }

  /**
   * Pede uma tarefa permitida. Cache por hash (tarefa + modelo + entrada): mudar o modelo pinado refaz a análise.
   * `privado`: código com propriedade intelectual — só IA local.
   * Cascata: começa no modelo de triagem; sobe para o profundo se a resposta pedir ("escalar") ou vier com confiança < 0,6.
   */
  async pedir(tarefa, entrada, { privado = false, lote = false, profundo } = {}) {
    if (PROIBIDAS_IA[tarefa]) throw new Error(PROIBIDAS_IA[tarefa]);
    if (!TAREFAS_IA[tarefa]) throw new Error(`tarefa de IA desconhecida: ${tarefa}`);
    const transporte = privado ? this.transportes.local : (this.transportes.remoto ?? this.transportes.local);
    if (!transporte) throw new Error(privado ? "código privado só vai para IA local, e nenhuma IA local está configurada" : "nenhuma IA configurada");
    const local = transporte === this.transportes.local;
    // desconto de lote só vale para transporte que usa a API de lotes de verdade
    lote = lote && transporte.suportaLote === true;
    const niveis = (profundo ?? TAREFAS_IA[tarefa].profundoPadrao) ? ["profundo"] : ["triagem", "profundo"];
    let ultima = null;
    for (const nivel of niveis) {
      const modelo = this.modelos[nivel];
      const prompt = montarPrompt(tarefa, entrada);
      const chave = await hashTexto(canonico({ tarefa, modelo: local ? "local" : modelo.id, entrada }));
      if (this.cache.has(chave)) {
        ultima = { ...this.cache.get(chave), doCache: true };
        this.registro.push({ tarefa, nivel, modelo: ultima.modelo, custo: 0, doCache: true, em: this.agora() });
      } else {
        const estimado = local ? 0 : this.estimar(prompt, modelo, lote);
        if (this.gasto + estimado > this.teto) {
          this.registro.push({ tarefa, nivel, modelo: modelo.id, custo: 0, recusado: "teto", em: this.agora() });
          if (ultima) break;
          throw new Error(`teto do ciclo atingido (US$ ${this.gasto.toFixed(2)} de ${this.teto.toFixed(2)}); tente no próximo ciclo ou aumente o teto`);
        }
        const r = await transporte({ prompt, modelo, lote });
        const custo = local ? 0 : r.uso ? ((r.uso.entrada * modelo.entrada + r.uso.saida * modelo.saida) / 1e6) * (lote ? 0.5 : 1) : estimado;
        this.gasto += custo;
        ultima = { ...lerResposta(r.texto), modelo: local ? "local" : modelo.id, nivel, custo };
        this.cache.set(chave, ultima);
        this.registro.push({ tarefa, nivel, modelo: ultima.modelo, custo, em: this.agora() });
      }
      if (local || !(ultima.escalar === true || (typeof ultima.confianca === "number" && ultima.confianca < 0.6))) break;
    }
    return { ...ultima, papel: "proposta", aviso: "IA propõe; quem decide são as fixtures e a revisão humana." };
  }

  /** Lote (batch noturno): guarda o pedido para rodar depois. O desconto só vale se o transporte usar a API de lotes. */
  enfileirar(tarefa, entrada, opcoes = {}) {
    if (PROIBIDAS_IA[tarefa]) throw new Error(PROIBIDAS_IA[tarefa]);
    this.fila.push({ tarefa, entrada, opcoes: { ...opcoes, lote: true } });
    return this.fila.length;
  }
  async processarFila() {
    const saida = [];
    while (this.fila.length) {
      const p = this.fila.shift();
      try { saida.push({ ...p, resposta: await this.pedir(p.tarefa, p.entrada, p.opcoes) }); }
      catch (e) { saida.push({ ...p, erro: e.message }); }
    }
    return saida;
  }
}

// ---------------------------------------------------------- transportes

/** Claude da página publicada no claude.ai (o mesmo recurso que o Agente usa). Sem custo por token para o projeto. */
export function transporteClaudeSample(obterSample) {
  return async ({ prompt, modelo }) => {
    const sample = await obterSample();
    if (!sample) throw new Error("Claude indisponível nesta página (abra a versão publicada no claude.ai)");
    const r = await sample([{ role: "user", content: prompt }], { modelTier: modelo.tier ?? "default" });
    return { texto: r.text };
  };
}

/** Ollama local (http://localhost:11434). Se o navegador bloquear, configure OLLAMA_ORIGINS. */
export function transporteOllama({ url = "http://localhost:11434", modeloLocal = "llama3.1", buscar = globalThis.fetch } = {}) {
  return async ({ prompt }) => {
    const r = await buscar(`${url.replace(/\/$/, "")}/api/chat`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: modeloLocal, stream: false, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) throw new Error(`Ollama respondeu ${r.status}`);
    const j = await r.json();
    return { texto: j.message?.content ?? "" };
  };
}

/** API da Anthropic com chave própria (a chave fica só na memória desta aba). */
export function transporteAnthropic({ chave, buscar = globalThis.fetch, url = "https://api.anthropic.com/v1/messages" } = {}) {
  if (!chave) throw new Error("informe a chave da API");
  return async ({ prompt, modelo }) => {
    const r = await buscar(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": chave, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: modelo.id, max_tokens: modelo.maxSaida, messages: [{ role: "user", content: prompt }] }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`API respondeu ${r.status}: ${j.error?.message ?? "erro"}`);
    return { texto: (j.content ?? []).filter(c => c.type === "text").map(c => c.text).join(""), uso: j.usage ? { entrada: j.usage.input_tokens, saida: j.usage.output_tokens } : undefined };
  };
}
