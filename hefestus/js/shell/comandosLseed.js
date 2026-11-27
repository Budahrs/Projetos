// App Shell (issue #43, fase S2): comandos do perfil L-SEED no CommandRegistry do núcleo.
// O registro decide visível/habilitado/marcado; a página só desenha e chama executar().

/**
 * @param {import('../nucleo/comandos.js').CommandRegistry} registro
 * @param {{ui: object, falas: () => object[], ocupado: () => boolean, salvar: Function, abrir: Function,
 *          exportar: Function, parar: Function, abrirCofre: Function, escolhida: () => string, aoMudar?: Function}} app
 */
export function registrarComandosLseed(registro, app) {
  const vazio = () => app.falas().length === 0;
  const ligado = { busca: () => app.ui.busca === true, memoria: () => app.ui.memoria !== false };
  const alternar = chave => () => { app.ui[chave] = !ligado[chave](); app.aoMudar?.(chave); };
  const comandos = [
    { id: "lseed.salvar", rotulo: "Salvar no cofre", desabilitado: () => vazio() || app.ocupado(), acao: app.salvar },
    { id: "lseed.abrir", rotulo: "Abrir conversa", desabilitado: () => app.ocupado(), acao: app.abrir },
    { id: "lseed.abrirCofre", rotulo: "Abrir do cofre", desabilitado: () => app.ocupado() || !app.escolhida(), acao: app.abrirCofre },
    { id: "lseed.exportar", rotulo: "Exportar conversa", desabilitado: vazio, acao: app.exportar },
    { id: "lseed.parar", rotulo: "Parar resposta", visivel: () => app.ocupado(), acao: app.parar },
    { id: "lseed.buscar", rotulo: "Buscar no cofre", ativo: ligado.busca, acao: alternar("busca") },
    { id: "lseed.dados", rotulo: "Usar memória e dados", ativo: ligado.memoria, acao: alternar("memoria") },
  ];
  for (const c of comandos) registro.registrar(c);
  return comandos.map(c => c.id);
}
