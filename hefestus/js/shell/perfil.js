// App Shell (issue #43, fase S0): validação de perfis contra perfis/perfil.schema.json.
// Fonte única: o esquema JSON. Este validador entende só o subconjunto que o esquema usa
// (type, const, enum, pattern, required, properties, additionalProperties, items, minItems,
// minLength, maxLength) e acrescenta as regras que um esquema não expressa (referências internas).
// Sem dependências; roda no navegador, no Node e no Tauri. Só informa: devolve a lista de erros.

const tipoDe = v => Array.isArray(v) ? "array" : v === null ? "null" : Number.isInteger(v) ? "integer" : typeof v;

export function validarEsquema(valor, esquema, caminho = "perfil") {
  const erros = [];
  const e = m => erros.push(`${caminho}: ${m}`);
  if ("const" in esquema && valor !== esquema.const) e(`deve ser ${JSON.stringify(esquema.const)}`);
  if (esquema.enum && !esquema.enum.includes(valor)) e(`deve ser um de ${esquema.enum.join(", ")}`);
  if (esquema.type) {
    const t = tipoDe(valor);
    const ok = esquema.type === t || (esquema.type === "number" && (t === "integer" || t === "number"));
    if (!ok) { e(`tipo ${t}, esperado ${esquema.type}`); return erros; }
  }
  if (typeof valor === "string") {
    if (esquema.minLength != null && valor.length < esquema.minLength) e("texto curto demais");
    if (esquema.maxLength != null && valor.length > esquema.maxLength) e("texto longo demais");
    if (esquema.pattern && !new RegExp(esquema.pattern).test(valor)) e(`fora do padrão ${esquema.pattern}`);
  }
  if (Array.isArray(valor)) {
    if (esquema.minItems != null && valor.length < esquema.minItems) e(`precisa de pelo menos ${esquema.minItems} item(ns)`);
    if (esquema.items) valor.forEach((v, i) => erros.push(...validarEsquema(v, esquema.items, `${caminho}[${i}]`)));
  }
  if (tipoDe(valor) === "object") {
    for (const r of esquema.required ?? []) if (!(r in valor)) e(`falta o campo "${r}"`);
    const props = esquema.properties ?? {};
    for (const [k, v] of Object.entries(valor)) {
      if (props[k]) erros.push(...validarEsquema(v, props[k], `${caminho}.${k}`));
      else if (esquema.additionalProperties === false) e(`campo não previsto "${k}"`);
    }
  }
  return erros;
}

/**
 * Valida um perfil: esquema + referências internas (área inicial existe, aba inicial pertence à área,
 * abas e áreas sem repetição) e, se informado, o tema contra o catálogo de temas da interface.
 * @param {object} perfil
 * @param {object} esquema conteúdo de perfis/perfil.schema.json
 * @param {{temas?: object, apelidos?: object}} [opcoes] TEMAS_UI e ALIAS_TEMA_UI de js/ui/temas.js
 */
export function validarPerfil(perfil, esquema, { temas, apelidos } = {}) {
  const erros = validarEsquema(perfil, esquema);
  if (erros.length) return erros;
  const ids = perfil.areas.map(a => a.id);
  if (new Set(ids).size !== ids.length) erros.push("perfil.areas: id de área repetido");
  if (!ids.includes(perfil.areaInicial)) erros.push(`perfil.areaInicial: "${perfil.areaInicial}" não é uma das áreas`);
  for (const a of perfil.areas) {
    if (new Set(a.abas).size !== a.abas.length) erros.push(`perfil.areas.${a.id}: aba repetida`);
    if (!a.abas.includes(a.abaInicial)) erros.push(`perfil.areas.${a.id}.abaInicial: "${a.abaInicial}" não é uma das abas`);
  }
  if (temas) {
    const chave = temas[perfil.temaPadrao] ? perfil.temaPadrao : apelidos?.[perfil.temaPadrao];
    if (!chave || !temas[chave]) erros.push(`perfil.temaPadrao: "${perfil.temaPadrao}" não existe no catálogo de temas`);
  }
  return erros;
}

/** Preferências iniciais de interface (formato de js/app/areasHephaestus.js) a partir de um perfil. */
export function preferenciasDoPerfil(perfil) {
  const area = perfil.areas.find(a => a.id === perfil.areaInicial);
  return {
    perfil: perfil.id,
    areaAtiva: perfil.areaInicial,
    aba: area.abaInicial,
    esq: perfil.paineis.esquerda[0] ?? null,
    dir: [...perfil.paineis.direita],
    qat: [...perfil.acessoRapido],
    temaUI: perfil.temaPadrao,
  };
}
