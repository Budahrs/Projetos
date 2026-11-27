// Diferença entre dois documentos: o que foi criado, removido ou alterado (propriedade a propriedade).
const achatar = (obj, pre = "", out = {}) => {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const c = pre ? `${pre}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) achatar(v, c, out); else out[c] = v;
  }
  return out;
};
const txt = v => { const s = typeof v === "string" ? v : JSON.stringify(v); return s === undefined ? "—" : s.length > 40 ? s.slice(0, 38) + "…" : s; };

/** Itens: { id, nome, tipo: "novo"|"removido"|"alterado", campos?: [{ caminho, de, para }] } */
export function diferenca(a, b) {
  const ea = a?.elementos ?? {}, eb = b?.elementos ?? {};
  const itens = [];
  for (const id of Object.keys(eb)) {
    if (id.startsWith("__")) continue;
    if (!ea[id]) { itens.push({ id, nome: eb[id].nome ?? id, tipo: "novo" }); continue; }
    const fa = achatar(ea[id]), fb = achatar(eb[id]);
    const campos = [];
    for (const k of new Set([...Object.keys(fa), ...Object.keys(fb)])) {
      if (k === "z" || JSON.stringify(fa[k]) === JSON.stringify(fb[k])) continue;
      campos.push({ caminho: k, de: txt(fa[k]), para: txt(fb[k]) });
    }
    if (campos.length) itens.push({ id, nome: eb[id].nome ?? id, tipo: "alterado", campos });
  }
  for (const id of Object.keys(ea)) if (!id.startsWith("__") && !eb[id]) itens.push({ id, nome: ea[id].nome ?? id, tipo: "removido" });
  const cv = achatar(a?.elementos?.__canvas), cn = achatar(b?.elementos?.__canvas);
  const campos = Object.keys({ ...cv, ...cn }).filter(k => JSON.stringify(cv[k]) !== JSON.stringify(cn[k])).map(k => ({ caminho: k, de: txt(cv[k]), para: txt(cn[k]) }));
  if (campos.length) itens.push({ id: "__canvas", nome: "Tela", tipo: "alterado", campos });
  return itens;
}
