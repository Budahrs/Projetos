// Versões semânticas (semver) dos modelos, ferramentas e artefatos do armazém.
// "1.4.2" = quebra.recurso.correção. Faixas aceitas: "1.4.2" (exata), "^1.4.0" (mesma quebra),
// "~1.4.0" (mesmo recurso), ">=1.2.0", "*" ou vazio (qualquer). Sem pré-lançamentos: o Hefestus
// guarda cópias publicadas, não rascunhos.

const RE = /^v?(\d+)\.(\d+)\.(\d+)$/;

/** "1.4.2" → [1, 4, 2]; lança Error se não for semver. */
export function lerVersao(v) {
  const m = RE.exec(String(v ?? "").trim());
  if (!m) throw new Error(`versão inválida: "${v}" (use quebra.recurso.correção, ex.: 1.0.0)`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export const versaoValida = v => RE.test(String(v ?? "").trim());

/** Negativo se a < b, zero se iguais, positivo se a > b. */
export function compararVersoes(a, b) {
  const x = lerVersao(a), y = lerVersao(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

/** Próxima versão pelo tipo de mudança: "quebra" (contrato público mudou), "recurso" (algo novo, compatível) ou "correcao". */
export function proximaVersao(v, mudanca = "correcao") {
  const [M, m, c] = lerVersao(v);
  if (mudanca === "quebra") return `${M + 1}.0.0`;
  if (mudanca === "recurso") return `${M}.${m + 1}.0`;
  if (mudanca === "correcao") return `${M}.${m}.${c + 1}`;
  throw new Error(`tipo de mudança desconhecido: ${mudanca} (quebra, recurso ou correcao)`);
}

/** A versão `v` atende à faixa? */
export function satisfaz(v, faixa) {
  const f = String(faixa ?? "").trim();
  if (!f || f === "*" || f === "latest") return versaoValida(v);
  const [M, m, c] = lerVersao(v);
  if (f.startsWith("^")) {
    const [a, b, d] = lerVersao(f.slice(1));
    if (M !== a) return false;
    if (a === 0 && m !== b) return false; // 0.x: cada recurso pode quebrar
    return compararVersoes(v, `${a}.${b}.${d}`) >= 0;
  }
  if (f.startsWith("~")) {
    const [a, b, d] = lerVersao(f.slice(1));
    return M === a && m === b && c >= d;
  }
  if (f.startsWith(">=")) return compararVersoes(v, f.slice(2).trim()) >= 0;
  if (f.startsWith(">")) return compararVersoes(v, f.slice(1).trim()) > 0;
  if (f.startsWith("<=")) return compararVersoes(v, f.slice(2).trim()) <= 0;
  if (f.startsWith("<")) return compararVersoes(v, f.slice(1).trim()) < 0;
  return compararVersoes(v, f.replace(/^=/, "")) === 0;
}

/** A maior versão da lista que atende à faixa (ou null). */
export function maiorQueSatisfaz(versoes, faixa) {
  return versoes.filter(v => versaoValida(v) && satisfaz(v, faixa)).sort(compararVersoes).at(-1) ?? null;
}

/** Ordena versões da menor para a maior (ignora as inválidas). */
export const ordenarVersoes = versoes => versoes.filter(versaoValida).sort(compararVersoes);
