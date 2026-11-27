// O formato do menu evolui sem renomear IDs nem alterar o documento durante uma prévia.
export function migrarMenu(entrada = {}) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) throw new Error('Definição de menu deve ser um objeto.');
  const versao = entrada.versao ?? 0;
  if (![0,1].includes(versao)) throw new Error('Versão de menu não suportada: ' + versao);
  const menu = { ...entrada, versao:1 };
  for (const chave of Object.keys(menu)) if (!['versao','adaptativo','prioridade','sidebar','rotuloSidebar'].includes(chave)) throw new Error('Propriedade de menu desconhecida: ' + chave);
  if (menu.adaptativo !== undefined && typeof menu.adaptativo !== 'boolean') throw new Error('adaptativo deve ser booleano.');
  if (menu.prioridade !== undefined && (!Number.isFinite(menu.prioridade) || menu.prioridade < 0 || menu.prioridade > 1000)) throw new Error('Prioridade deve estar entre 0 e 1000.');
  if (menu.sidebar !== undefined && typeof menu.sidebar !== 'boolean' && (!menu.sidebar || typeof menu.sidebar !== 'object' || Array.isArray(menu.sidebar))) throw new Error('sidebar deve ser booleano ou configuração.');
  if (menu.sidebar && typeof menu.sidebar === 'object') {
    for (const chave of Object.keys(menu.sidebar)) if (!['modo','compactoAbaixo','minimalAbaixo','expandida','compacta'].includes(chave)) throw new Error('Propriedade de sidebar desconhecida: ' + chave);
    if (menu.sidebar.modo && !['auto','open','compact','minimal'].includes(menu.sidebar.modo)) throw new Error('Modo de sidebar inválido.');
    for (const campo of ['compactoAbaixo','minimalAbaixo','expandida','compacta']) {
      if (menu.sidebar[campo] !== undefined && (!Number.isFinite(menu.sidebar[campo]) || menu.sidebar[campo] < 0)) throw new Error('Dimensão de sidebar inválida: ' + campo);
    }
    menu.sidebar = { ...menu.sidebar };
  }
  return menu;
}
