// App Shell (issue #43, fase S2): ponte entre o shell e o motor do L-SEED.
// O motor continua sendo a Central do L-SEED (Python). Este módulo só fala com a API dela,
// na mesma origem (a Central serve o shell), sem CORS e sem afrouxar a checagem de origem.

/** Lê NDJSON aos pedaços: devolve os objetos completos e guarda a linha incompleta. */
export function lerLinhasNdjson() {
  let resto = "";
  const ler = linhas => linhas.filter(l => l.trim()).map(l => JSON.parse(l));
  return {
    empurrar(texto) { resto += texto; const partes = resto.split("\n"); resto = partes.pop(); return ler(partes); },
    fechar() { const l = resto; resto = ""; return ler([l]); },
  };
}

/** Só o que a Central aceita: falas de texto do usuário e da IA. */
export function mensagensParaCentral(mensagens) {
  return (mensagens || [])
    .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content)
    .map(m => ({ role: m.role, content: m.content }));
}

async function* pedacos(resposta) {
  if (resposta.body?.getReader) {
    const leitor = resposta.body.getReader();
    for (;;) { const { done, value } = await leitor.read(); if (done) return; yield value; }
  }
  yield new TextEncoder().encode(await resposta.text());
}

async function erroDe(resposta) {
  let dados = {};
  try { dados = await resposta.json(); } catch { /* corpo sem JSON */ }
  return new Error(dados.erro || `A Central respondeu ${resposta.status}`);
}

/**
 * @param {{fetch?: Function, base?: string}} [opcoes] base vazia = mesma origem da Central
 */
export function criarMotorLseed({ fetch: buscar = globalThis.fetch?.bind(globalThis), base = "" } = {}) {
  const post = corpo => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  async function json(caminho, opcoes) {
    const r = await buscar(base + caminho, opcoes);
    if (!r.ok) throw await erroDe(r);
    const dados = await r.json();
    if (dados?.erro) throw new Error(dados.erro);
    return dados;
  }
  return {
    /** Modelos, personas e o que está ligado (GET /api/estado). */
    estado: () => json("/api/estado"),
    /** Área Memória ou Projetos (GET /api/painel): {texto, aviso?, consulta?, itens?, item?}. Só leitura. */
    painel: ({ area, aba, q = "", item = "" }) => json("/api/painel?" + new URLSearchParams({ area, aba, q, item }), { cache: "no-store" }),
    /** Conversas salvas no cofre, mais recentes primeiro (GET /api/conversas). */
    conversas: async () => (await json("/api/conversas")).conversas ?? [],
    /** Lê de volta uma conversa salva (GET /api/conversa): {persona, titulo, mensagens}. */
    abrirConversa: arquivo => json("/api/conversa?" + new URLSearchParams({ arquivo })),
    /** Grava a conversa no cofre (POST /api/salvar); devolve {arquivo}. */
    salvar: ({ persona, mensagens, titulo }) =>
      json("/api/salvar", post({ persona, mensagens: mensagensParaCentral(mensagens), titulo })),
    /**
     * Conversa em fluxo (POST /api/conversar, NDJSON). aoEvento recebe cada evento da Central
     * ({tipo: contexto|texto|fim|erro}). Devolve {texto, fim, erro}.
     */
    async conversar({ persona, mensagens, modelo, memoria = true, busca = false, memoria_brs3 = false, sinal } = {}, aoEvento = () => {}) {
      const r = await buscar(base + "/api/conversar",
        { ...post({ persona, mensagens: mensagensParaCentral(mensagens), modelo, memoria, busca, ...(memoria_brs3 === true ? { memoria_brs3: true } : {}) }), signal: sinal });
      if (!r.ok || !(r.headers?.get?.("Content-Type") || "").includes("ndjson")) throw await erroDe(r);
      const leitor = lerLinhasNdjson(), dec = new TextDecoder();
      let texto = "", fim = null, erro = null;
      const tratar = ev => {
        if (ev.tipo === "texto") texto += ev.t ?? "";
        else if (ev.tipo === "fim") fim = ev;
        else if (ev.tipo === "erro") erro = ev.msg ?? "erro";
        aoEvento(ev);
      };
      for await (const p of pedacos(r)) leitor.empurrar(dec.decode(p, { stream: true })).forEach(tratar);
      leitor.empurrar(dec.decode()).forEach(tratar);
      leitor.fechar().forEach(tratar);
      if (erro && !texto) throw new Error(erro);
      return { texto, fim, erro };
    },
  };
}
