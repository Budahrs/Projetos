// App Shell (issue #43, fase S2): conversas do perfil L-SEED, uma por persona.
// "Abrir" e "exportar" usam um arquivo JSON do shell (formato hefestus.conversa v1);
// "salvar" grava no cofre pela Central (motorLseed.salvar), no formato do próprio L-SEED.

export const FORMATO_SESSAO = "hefestus.conversa";
export const VERSAO_SESSAO = 1;

export function criarSessao(personas, personaAtiva = personas[0]) {
  return { personaAtiva, conversas: Object.fromEntries(personas.map(p => [p, []])) };
}

export function adicionarFala(sessao, persona, role, content) {
  if (!(persona in sessao.conversas)) throw new Error(`persona desconhecida: ${persona}`);
  const fala = { role, content };
  sessao.conversas[persona].push(fala);
  return fala;
}

export function exportarSessao(sessao, agora = new Date()) {
  return { formato: FORMATO_SESSAO, versao: VERSAO_SESSAO, criado: agora.toISOString(),
    personaAtiva: sessao.personaAtiva, conversas: structuredClone(sessao.conversas) };
}

/** Valida e devolve uma sessão nova; lança erro com a lista do que está errado. */
export function importarSessao(dados, personas) {
  const erros = [];
  if (!dados || typeof dados !== "object") throw new Error("arquivo de conversa inválido");
  if (dados.formato !== FORMATO_SESSAO) erros.push(`formato deve ser "${FORMATO_SESSAO}"`);
  if (dados.versao !== VERSAO_SESSAO) erros.push(`versão ${dados.versao} não suportada`);
  const conversas = dados.conversas && typeof dados.conversas === "object" ? dados.conversas : {};
  if (!dados.conversas) erros.push("faltam as conversas");
  const sessao = criarSessao(personas, personas.includes(dados.personaAtiva) ? dados.personaAtiva : personas[0]);
  for (const [p, falas] of Object.entries(conversas)) {
    if (!personas.includes(p)) { erros.push(`persona desconhecida: ${p}`); continue; }
    if (!Array.isArray(falas)) { erros.push(`${p}: as falas devem ser uma lista`); continue; }
    falas.forEach((f, i) => {
      if (!["user", "assistant"].includes(f?.role) || typeof f?.content !== "string") erros.push(`${p}[${i}]: fala inválida`);
      else sessao.conversas[p].push({ role: f.role, content: f.content });
    });
  }
  if (erros.length) throw new Error(erros.join("; "));
  return sessao;
}

/** Troca a conversa de uma persona pelas falas lidas do cofre (motorLseed.abrirConversa). */
export function carregarConversa(sessao, persona, mensagens) {
  if (!(persona in sessao.conversas)) throw new Error(`persona desconhecida: ${persona}`);
  sessao.conversas[persona] = (mensagens || [])
    .filter(m => ["user", "assistant"].includes(m?.role) && typeof m?.content === "string")
    .map(m => ({ role: m.role, content: m.content }));
  sessao.personaAtiva = persona;
  return sessao;
}
