// Migra apenas preferências de interface; nunca modifica o projeto do usuário.
export function normalizarWorkspace(preferencias = {}) {
  const ui = { ...preferencias };
  if (!["designer", "web", "previa"].includes(ui.modo)) ui.modo = "designer";
  ui.dir = Array.isArray(ui.dir) ? ui.dir : [];
  if (ui.modo !== "designer" && ui.hibrido) {
    ui.hibridoPausado = true;
    ui.hibrido = false;
  }
  if (ui.modo === "previa") {
    ui.paineisAntes ??= { esq: ui.esq, dir: [...ui.dir] };
    ui.esq = null; ui.dir = [];
  }
  if (ui.dockAlt !== undefined) ui.dockAlt = Math.max(0.25, Math.min(0.75, Number(ui.dockAlt) || 0.5));
  if (!["geral", "faixa", "elemento", "agente"].includes(ui.dockAba)) ui.dockAba = "geral";
  return ui;
}
