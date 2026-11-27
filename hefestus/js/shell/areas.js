// App Shell (issue #43, fase S1): áreas e abas a partir de um perfil (perfis/perfil.schema.json).
// Genérico: não sabe nada do Hefestus. Cada projeto passa o seu perfil e, se precisar, ganchos para o
// que é só dele (apelidos de área, preferências extras, ajustes depois de trocar de área).

/**
 * @param {object} perfil perfil validado (formato hefestus.perfil v1)
 * @param {{apelidos?: Record<string,string>, iniciais?: object, marcador?: string,
 *          aoIniciar?: (ui:object)=>void, aoTrocar?: (ui:object, area:string)=>void}} [ganchos]
 */
export function criarAreas(perfil, ganchos = {}) {
  const porId = new Map(perfil.areas.map(a => [a.id, a]));
  const apelidos = ganchos.apelidos ?? {};
  const marcador = ganchos.marcador ?? `shellLayout:${perfil.id}`;
  const resolver = area => porId.has(area) ? area : (apelidos[area] ?? perfil.areaInicial);
  const abasDe = id => porId.get(id).abas;

  function trocarArea(ui, area) {
    const destino = resolver(area);
    const anterior = ui.areaAtiva || perfil.areaInicial;
    ui.abasPorArea ??= {};
    if (ui.aba) ui.abasPorArea[anterior] = ui.aba;
    ui.areaAtiva = destino;
    ui.aba = ui.abasPorArea[destino] || ui.aba;
    if (!abasDe(destino).includes(ui.aba)) ui.aba = porId.get(destino).abaInicial;
    ganchos.aoTrocar?.(ui, destino);
    return ui;
  }

  function iniciarAreas(ui) {
    if (!ui[marcador]) {
      const area = porId.get(perfil.areaInicial);
      Object.assign(ui, {
        [marcador]: 1, areaAtiva: perfil.areaInicial, aba: area.abaInicial,
        esq: perfil.paineis.esquerda[0] ?? null, dir: [...perfil.paineis.direita],
        qat: [...perfil.acessoRapido], temaUI: perfil.temaPadrao,
      }, ganchos.iniciais ?? {});
    }
    ganchos.aoIniciar?.(ui);
    trocarArea(ui, ui.areaAtiva || perfil.areaInicial);
    return ui;
  }

  return { iniciarAreas, trocarArea, abasDe };
}
