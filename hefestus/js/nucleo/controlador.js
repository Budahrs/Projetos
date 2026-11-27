// Os interruptores mudam a execução, sem apagar os parâmetros do projeto.
export function aplicarControles(elemento) {
  const c = elemento.controlador;
  if (!c) return elemento;
  const el = structuredClone(elemento);
  el.estilo ??= {};
  if (c.tipoContorno) el.estilo.tracos = (el.estilo.tracos?.length ? el.estilo.tracos : [{ cor: el.estilo.borda, largura: el.estilo.larguraBorda ?? 1, posicao: "dentro", visivel: true }]).map(t => ({ ...t, estilo: c.tipoContorno }));
  if (c.tipoBorda === "reta") { el.estilo.raio = 0; el.estilo.cantos = [0, 0, 0, 0]; }
  if (c.contorno === false) { el.estilo.larguraBorda = 0; el.estilo.tracos = []; }
  if (c.borda === false) { el.estilo.raio = 0; el.estilo.cantos = [0, 0, 0, 0]; }
  if (c.sombra === false) {
    el.estilo.sombra = "nenhuma";
    el.estilo.efeitos = (el.estilo.efeitos ?? []).filter(e => !String(e.tipo).includes("sombra"));
  }
  if (c.desfoque === false) { el.estilo.desfoque = 0; el.estilo.efeitos = (el.estilo.efeitos ?? []).filter(e => e.tipo !== "desfoque"); }
  if (c.vidro === false) { el.estilo.vidro = 0; el.estilo.efeitos = (el.estilo.efeitos ?? []).filter(e => e.tipo !== "vidro"); }
  if (c.reacoes === false) { el.eventos = []; if (el.codigo) el.codigo.js = ""; }
  return el;
}

export function controlesDaLista(elementos) {
  const porId = new Map(elementos.map(e => [e.id, e]));
  return elementos.map(el => {
    let pai = porId.get(el.pai), bloqueado = false;
    const vistos = new Set([el.id]);
    while (pai && !vistos.has(pai.id)) {
      vistos.add(pai.id);
      if (pai.controlador?.reacoes === false) { bloqueado = true; break; }
      pai = porId.get(pai.pai);
    }
    return aplicarControles(bloqueado ? { ...el, controlador: { ...el.controlador, reacoes: false } } : el);
  });
}
