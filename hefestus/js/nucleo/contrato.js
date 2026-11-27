// Contrato do container conceitual: um grupo com significado de programação.
// Regras: o tipo é fixo (mudar exige migração explícita); os filhos são privados; as props são a
// única API; renomear é seguro (o id não muda); os limites do contrato avisam antes de o código quebrar.
/** Campos do painel Propriedades (seção Contrato). Ficam em `contrato.*` (restricoes.* é do responsivo). */
export const CAMPOS_CONTRATO = [
  { rotulo: "Largura mínima (px)", caminho: "contrato.larguraMin", tipo: "numero", min: 0 },
  { rotulo: "Largura máxima (px)", caminho: "contrato.larguraMax", tipo: "numero", min: 0 },
  { rotulo: "Altura mínima (px)", caminho: "contrato.alturaMin", tipo: "numero", min: 0 },
  { rotulo: "Altura máxima (px)", caminho: "contrato.alturaMax", tipo: "numero", min: 0 },
  { rotulo: "Elemento HTML", caminho: "contrato.elementoHTML", tipo: "texto" },
  { rotulo: "Classes CSS (separadas por espaço)", caminho: "contrato.classes", tipo: "texto" },
  { rotulo: "Componente React equivalente", caminho: "contrato.react", tipo: "texto" },
];

/** Elemento HTML que o exportador usa para cada tipo (o contrato pode trocar). */
const ELEMENTO_HTML = { botao: "button", campo: "input", toggle: "button", texto: "p", menu: "nav", modal: "dialog", imagem: "img", container: "div", caixa: "div", icone: "span" };

const PROPS_POR_TIPO = {
  botao: ["rotulo", "variante", "icone", "desabilitado"],
  campo: ["rotulo", "placeholder", "valor", "tipoCampo"],
  toggle: ["ligado", "rotulo"],
  texto: ["texto"],
  menu: ["itens"],
  icone: ["simbolo"],
};

/** O tipo conceitual: o que o classificador ou o usuário declarou, senão o tipo do catálogo. */
export const tipoSemantico = el => el?.semantica?.tipo ?? el?.tipo ?? null;

/**
 * Limites declarados no contrato do elemento. Alvo mínimo de toque e legibilidade já são da auditoria
 * (regras de acessibilidade); aqui só vale o que o usuário escreveu no contrato.
 */
export function limitesDe(el) {
  const c = el?.contrato ?? {};
  const out = {};
  for (const k of ["larguraMin", "larguraMax", "alturaMin", "alturaMax"]) if (typeof c[k] === "number" && c[k] > 0) out[k] = c[k];
  return out;
}

/** Contrato público do elemento: o que o código consome. */
export function contratoDe(el, id = el?.id) {
  const tipo = el?.tipo;
  const props = {};
  for (const k of PROPS_POR_TIPO[tipo] ?? []) if (el[k] !== undefined) props[k] = el[k];
  for (const [k, v] of Object.entries(el?.propsPublicas ?? {})) props[k] = v;
  const c = el?.contrato ?? {};
  return {
    id, nome: el?.nome ?? id, tipo, tipoSemantico: tipoSemantico(el),
    props,
    bindings: {
      elementoHTML: c.elementoHTML || ELEMENTO_HTML[tipo] || "div",
      classes: String(c.classes ?? "").split(/\s+/).filter(Boolean),
      react: c.react || null,
    },
    limites: limitesDe(el),
  };
}

/**
 * Confere os limites com a geometria (atual ou proposta). Devolve avisos com a correção sugerida,
 * no formato da auditoria (patch caminho → valor).
 */
export function verificarLimites(el, geo = el) {
  const l = limitesDe(el);
  const avisos = [];
  const fora = (eixo, campo, valor, alvo, texto) => avisos.push({ campo: eixo, mensagem: texto, correcao: { [campo]: alvo }, valor });
  if (l.larguraMin && geo.largura < l.larguraMin) fora("largura", "largura", geo.largura, l.larguraMin, `largura ${Math.round(geo.largura)} px abaixo do mínimo do contrato (${l.larguraMin} px)`);
  if (l.larguraMax && geo.largura > l.larguraMax) fora("largura", "largura", geo.largura, l.larguraMax, `largura ${Math.round(geo.largura)} px acima do máximo do contrato (${l.larguraMax} px)`);
  if (l.alturaMin && geo.altura < l.alturaMin) fora("altura", "altura", geo.altura, l.alturaMin, `altura ${Math.round(geo.altura)} px abaixo do mínimo do contrato (${l.alturaMin} px)`);
  if (l.alturaMax && geo.altura > l.alturaMax) fora("altura", "altura", geo.altura, l.alturaMax, `altura ${Math.round(geo.altura)} px acima do máximo do contrato (${l.alturaMax} px)`);
  return avisos;
}

/** Itens de auditoria (mesmo formato de auditoria.js) para todos os elementos fora do contrato. */
export function auditarContratos(elementos) {
  const out = [];
  for (const el of elementos) for (const a of verificarLimites(el)) {
    out.push({ regra: "contrato", gravidade: "aviso", id: el.id, nome: el.nome ?? el.id, mensagem: `Contrato: ${a.mensagem}.`, correcao: a.correcao, resumo: `Ajustar ${a.campo} para ${Object.values(a.correcao)[0]} px` });
  }
  return out;
}

/**
 * Migração explícita de tipo conceitual. Sem `confirmado`, recusa: "um botão não vira cartão sem migração".
 * Devolve o patch (caminho → valor) a aplicar num comando desfazível.
 */
export function migrarTipo(el, novoTipo, { confirmado = false, motivo = "" } = {}) {
  if (!novoTipo) throw new Error("diga para qual tipo migrar");
  const atual = tipoSemantico(el);
  if (atual === novoTipo) return {};
  if (!confirmado) throw new Error(`o tipo de "${el?.nome}" é fixo (${atual}). Migrar para ${novoTipo} exige confirmação explícita.`);
  return {
    "semantica.tipo": novoTipo,
    "semantica.migracoes": [...(el?.semantica?.migracoes ?? []), { de: atual, para: novoTipo, motivo, em: new Date().toISOString() }],
  };
}
