// Histórico em arquivo separado (JSONL). O projeto fica leve; o histórico guarda só o que mudou em cada passo.
// Linhas: {t:"cab"} · {t:"base", doc, mem} · {t:"ev", id, pai, pedido, texto, patch} · {t:"ramo", ...} · {t:"cursor", n}
// Cada evento diz quem é o "pai" (evento anterior no mesmo caminho); o estado vem de aplicar os patches em cadeia.

const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const porId = lista => Object.fromEntries((lista ?? []).map(d => [d.id, d]));

/** Diferença entre dois mapas id → objeto: { set: {id: objetoOuCamposMudados}, del: [ids] }. Nível de campo para elementos. */
function diffMapa(a = {}, b = {}) {
  const set = {}, del = [];
  for (const [id, v] of Object.entries(b)) {
    if (!(id in a)) { set[id] = { _novo: clone(v) }; continue; }
    if (igual(a[id], v)) continue;
    const campos = {}, fora = [];
    for (const k of new Set([...Object.keys(a[id]), ...Object.keys(v)])) {
      if (!(k in v)) fora.push(k); else if (!igual(a[id][k], v[k])) campos[k] = clone(v[k]);
    }
    set[id] = { campos, ...(fora.length ? { fora } : {}) };
  }
  for (const id of Object.keys(a)) if (!(id in b)) del.push(id);
  return { set, del };
}
function aplicarMapa(base, d) {
  const out = clone(base ?? {});
  for (const id of d.del ?? []) delete out[id];
  for (const [id, m] of Object.entries(d.set ?? {})) {
    if (m._novo) { out[id] = clone(m._novo); continue; }
    out[id] = { ...(out[id] ?? {}), ...clone(m.campos) };
    for (const k of m.fora ?? []) delete out[id][k];
  }
  return out;
}
/** Documento = { elementos: mapa, ...resto }. O resto (tela, nome…) vai inteiro se mudou. */
function diffDoc(a, b) {
  const { elementos: ea, ...ra } = a, { elementos: eb, ...rb } = b;
  return { el: diffMapa(ea, eb), ...(igual(ra, rb) ? {} : { resto: clone(rb) }) };
}
function aplicarDoc(base, p) {
  const { elementos, ...resto } = base;
  return { ...(p.resto ? clone(p.resto) : clone(resto)), elementos: aplicarMapa(elementos, p.el) };
}
const diffMem = (a, b) => diffMapa(porId(a), porId(b));
const aplicarMem = (base, d) => Object.values(aplicarMapa(porId(base), d));

/** Texto JSONL do histórico (caminho principal + variações). */
export function exportarHistorico(projeto, meta = {}) {
  const linhas = [JSON.stringify({ t: "cab", formato: "hefestus-historico", versao: 1, ...meta, salvoEm: new Date().toISOString() })];
  const vistos = new Set();
  const caminhos = [projeto.historico, ...projeto.ramos.map(r => r.eventos)];
  const primeiro = projeto.historico[0] ?? projeto.ramos[0]?.eventos[0];
  if (primeiro) linhas.push(JSON.stringify({ t: "base", doc: primeiro.docAntes, mem: primeiro.memAntes }));
  for (const caminho of caminhos) {
    caminho.forEach((ev, i) => {
      if (vistos.has(ev.id)) return;
      vistos.add(ev.id);
      linhas.push(JSON.stringify({ t: "ev", id: ev.id, pai: i ? caminho[i - 1].id : null, pedido: ev.pedido, patch: { doc: diffDoc(ev.docAntes, ev.docDepois), mem: diffMem(ev.memAntes, ev.memDepois) }, ...(ev.texto ? { texto: ev.texto } : {}) }));
    });
  }
  for (const r of projeto.ramos) linhas.push(JSON.stringify({ t: "ramo", id: r.id, nome: r.nome, criadoEm: r.criadoEm, ids: r.eventos.map(e => e.id) }));
  linhas.push(JSON.stringify({ t: "cursor", n: projeto.cursor, principal: projeto.historico.map(e => e.id) }));
  return linhas.join("\n") + "\n";
}

/** Reconstrói { eventos, cursor, ramos } a partir do JSONL. Lança erro se o arquivo estiver incompleto. */
export function importarHistorico(texto) {
  const linhas = String(texto).split("\n").filter(l => l.trim()).map((l, i) => { try { return JSON.parse(l); } catch { throw new Error(`Linha ${i + 1} do histórico não é JSON válido.`); } });
  if (linhas[0]?.formato !== "hefestus-historico") throw new Error("Arquivo não é um histórico do Hefestus.");
  const base = linhas.find(l => l.t === "base");
  const porEv = new Map();
  for (const l of linhas.filter(x => x.t === "ev")) {
    const pai = l.pai ? porEv.get(l.pai) : null;
    if (l.pai && !pai) throw new Error(`Histórico incompleto: falta o passo ${l.pai}.`);
    const docAntes = pai ? pai.docDepois : base?.doc, memAntes = pai ? pai.memDepois : base?.mem;
    if (!docAntes) throw new Error("Histórico sem estado inicial.");
    porEv.set(l.id, { id: l.id, pedido: l.pedido, ...(l.texto ? { texto: l.texto } : {}), docAntes: clone(docAntes), memAntes: clone(memAntes ?? []), docDepois: aplicarDoc(docAntes, l.patch.doc), memDepois: aplicarMem(memAntes ?? [], l.patch.mem) });
  }
  const cur = linhas.find(l => l.t === "cursor") ?? { n: 0, principal: [] };
  const eventos = (cur.principal ?? []).map(i => porEv.get(i)).filter(Boolean);
  const ramos = linhas.filter(l => l.t === "ramo").map(r => ({ id: r.id, nome: r.nome, criadoEm: r.criadoEm, eventos: r.ids.map(i => porEv.get(i)).filter(Boolean) })).filter(r => r.eventos.length);
  return { eventos, cursor: Math.min(cur.n ?? eventos.length, eventos.length), ramos };
}
