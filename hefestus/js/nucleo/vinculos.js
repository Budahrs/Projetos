// Vínculos declarativos (linker): "quando clicar aqui, chame a ferramenta X do armazém".
// O vínculo guarda a REFERÊNCIA versionada ("ferramenta/vetoria/vectorize@^1.0.0"), nunca uma cópia do código.
// Na interface exportada ele vira um evento que emite um sinal { sinal, origem, vinculo }: quem consome
// resolve a ferramenta. Na Prévia do Hefestus, ferramentas "web" podem rodar de verdade (cópia do armazém).
import { lerRef } from "./armazem.js";
import { executavelEm } from "./sincronizar.js";

const limpo = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/** Novo vínculo; `ref` é validada aqui (formato), a existência no armazém é conferida em validarVinculos. */
export function novoVinculo(el, { evento = "onClick", ref, args = {}, id } = {}) {
  const r = lerRef(ref);
  const existentes = el?.vinculos ?? [];
  let n = existentes.length + 1;
  while (existentes.some(v => v.id === `v${n}`)) n++;
  return { id: id ?? `v${n}`, evento, ref: `${r.tipo}/${r.programa}/${r.id}@${r.faixa}`, args, sinal: `${limpo(el?.nome ?? "elemento")}_chama_${limpo(r.id)}` };
}

/** Evento equivalente (o runtime e os exportadores já sabem emitir sinais). */
export const eventoDoVinculo = v => ({ tipo: v.evento, dispara: v.sinal, acao: "", alvo: "", vinculo: v.ref, vinculoId: v.id });

/**
 * Problemas dos vínculos do documento, no formato da auditoria. Um vínculo com erro aparece com ⚡
 * (referência ausente, versão fora da faixa, runtime que não roda no navegador).
 */
export function validarVinculos(elementos, armazem, hosts = ["navegador"]) {
  const out = [];
  for (const el of elementos) for (const v of el.vinculos ?? []) {
    const add = (gravidade, mensagem) => out.push({ regra: "vinculo", gravidade, id: el.id, nome: el.nome ?? el.id, mensagem: `⚡ ${mensagem}` });
    let r;
    try { r = lerRef(v.ref); } catch (e) { add("erro", e.message); continue; }
    if (!(el.eventos ?? []).some(e => e.vinculoId === v.id)) add("aviso", `o vínculo ${v.ref} perdeu o evento que o dispara`);
    if (!armazem) continue;
    const entrada = armazem.localizar(r);
    if (!entrada) {
      const tem = armazem.versoes(r.tipo, r.programa, r.id);
      add("erro", tem.length ? `${r.programa}/${r.id}: nenhuma versão em ${r.faixa} (há ${tem.join(", ")})` : `${r.programa}/${r.id} não está no armazém (sincronize o programa)`);
      continue;
    }
    if (entrada.runtime && !executavelEm(entrada.runtime, hosts)) add("info", `${r.id} roda em ${entrada.runtime}: na interface exportada vira só um sinal`);
  }
  return out;
}

/** Referências usadas pelo documento (para marcar "em uso" no armazém: versão em uso nunca é removida). */
export function referenciasUsadas(elementos, armazem) {
  const out = new Map();
  for (const el of elementos) for (const v of el.vinculos ?? []) {
    try {
      const e = armazem.localizar(v.ref);
      if (e) out.set(e.chave, [...(out.get(e.chave) ?? []), `${el.nome ?? el.id}#${v.id}`]);
    } catch { /* referência inválida: a auditoria já mostra */ }
  }
  return out;
}

/**
 * Transforma a cópia de uma ferramenta "web" em função. Convenção do conteúdo: uma expressão de função,
 * ex. "(entrada, opcoes) => entrada.toUpperCase()". Só para a Prévia e a consolidação (grau 2).
 */
export function funcaoDaFerramenta(conteudo) {
  const texto = String(conteudo ?? "").trim();
  if (!texto) throw new Error("ferramenta sem conteúdo");
  const f = new Function(`"use strict"; return (${texto});`)();
  if (typeof f !== "function") throw new Error("o conteúdo da ferramenta precisa ser uma função (ex.: (entrada) => …)");
  return f;
}

/** Resolve no armazém e executa (só runtime web). */
export async function executarVinculo(v, armazem, entrada) {
  const { entrada: e, conteudo } = await armazem.resolver(v.ref);
  if (e.runtime !== "web") throw new Error(`${e.id} roda em ${e.runtime}; no navegador o vínculo só emite o sinal "${v.sinal}"`);
  return funcaoDaFerramenta(conteudo)(entrada, v.args ?? {});
}
