// Conhecimento declarativo compartilhado pelo agente, auditoria e manifesto de ferramentas.
export const REPERTORIO_MENUS = [
  {id:'fluent-ribbon',url:'https://github.com/fluentribbon/Fluent.Ribbon',licenca:'MIT',plataforma:'WPF',uso:'Galerias, abas e atalhos; adaptar comportamentos ao JavaScript.',incorporado:false},
  {id:'fluent-ui',url:'https://github.com/microsoft/fluentui',licenca:'MIT; fontes e ícones possuem termos próprios',plataforma:'Web',uso:'Estados acessíveis e organização de componentes.',incorporado:false},
  {id:'genoffice',url:'https://github.com/genspark-ai/genoffice',licenca:'Apache-2.0; ee/ possui licença própria',plataforma:'Suíte desktop e ferramentas de IA',uso:'Referência para contratos de ferramentas e documentos estruturados.',incorporado:false},
  {id:'elixiroffice',url:'https://github.com/leag1234/elixiroffice',licenca:'AGPL-3.0',plataforma:'Desktop e servidor',uso:'Referência de organização de uma suíte com Ribbon.',incorporado:false},
  {id:'onlyoffice',url:'https://github.com/ONLYOFFICE/DocumentServer',licenca:'AGPL-3.0 na edição Community',plataforma:'Servidor',uso:'Referência de separação entre núcleo, SDK e interface.',incorporado:false},
  {id:'euro-office',url:'https://github.com/euro-office',licenca:'Verificar por repositório; DocumentServer AGPL-3.0',plataforma:'Organização com múltiplos projetos',uso:'Referência complementar; não é uma biblioteca única.',incorporado:false},
];
export const REGRAS_MENUS = [
  {id:'limite-tela',regra:'Nenhum menu pode exceder a janela visível: limitar largura e altura, rolar internamente e reposicionar ao abrir ou redimensionar.',fonte:'hefestus:contrato-local/limite-tela'},
  {id:'movimento',regra:'Animações de menus são opcionais, curtas e respeitam movimento reduzido. Painéis laterais ficam acima do conteúdo; configurações e confirmações permanecem acessíveis.',fonte:'hefestus:contrato-local/movimento-e-camadas'},
  {id:'galerias',regra:'Organizar formas básicas em uma única galeria com miniaturas e nomes; evitar grupos duplicados para a mesma tarefa.',fonte:'https://github.com/fluentribbon/Fluent.Ribbon'},
  {id:'agrupamento',regra:'Agrupar deve preservar os vínculos e mover os descendentes juntos, inclusive por teclado e painel de propriedades; um desfazer restaura a operação inteira.',fonte:'hefestus:contrato-local/agrupamento'},
  {id:'contratos',regra:'Separar núcleo, ferramentas e conexões. Descrever capacidades reais em JSON; uma referência a uma suíte Office não habilita seus editores no Hefestus.',fonte:'https://github.com/genspark-ai/genoffice'},
  {id:'procedencia',regra:'Registrar origem e licença antes de reutilizar código ou recursos; não prometer compatibilidade perfeita ou aprovação com base em publicidade.',fonte:'https://github.com/microsoft/fluentui#licenses'},
  {id:'teclado',regra:'Tab entra e sai da barra; setas navegam entre comandos; Home/End vão aos extremos. Campos mantêm suas teclas nativas.',fonte:'https://github.com/w3c/aria-practices/blob/main/content/patterns/toolbar/toolbar-pattern.html'},
  {id:'foco',regra:'Separar menu, popover não modal e diálogo modal. Escape devolve foco ao gatilho; não prender Tab em popover não modal.',fonte:'https://www.radix-ui.com/primitives/docs/components/dropdown-menu'},
  {id:'overflow',regra:'Medir controles reais, preservar grupos e prioridades, reservar o botão Mais e limitar as medições por quadro. O layout deve estabilizar sem atividade em repouso.',fonte:'https://github.com/microsoft/fluentui/issues/36601'},
  {id:'intencao',regra:'Ao atravessar diagonalmente até um submenu, manter uma área segura com prazo limitado, sem bloquear toque.',fonte:'https://github.com/floating-ui/floating-ui/blob/master/packages/react/src/safePolygon.ts'},
  {id:'posicao',regra:'Trocar o lado quando faltar espaço, ajustar às bordas, limitar altura e reposicionar durante rolagem e redimensionamento.',fonte:'https://github.com/floating-ui/floating-ui'},
  {id:'estados',regra:'Foco, seleção e indisponibilidade são estados distintos. Menu indisponível continua descoberto pelas setas, mas não executa ações.',fonte:'https://github.com/w3c/aria-practices/blob/main/content/practices/keyboard-interface/keyboard-interface-practice.html'},
];
export function recomendarMenu(descricao='') {
  const t=String(descricao).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const tipo=/sidebar|barra lateral|navegacao|secoes|paginas/.test(t)?'sidebar':/context|botao direito/.test(t)?'contexto':/radial|pie|circular/.test(t)?'radial':/ribbon|faixa|office|comandos|edicao/.test(t)?'ribbon':'menubar';
  const modelo={sidebar:'sidebarAdaptativa',ribbon:'faixaHibrida',contexto:'menuContexto',radial:'menuRadial',menubar:'barraMenus'}[tipo];
  return {versao:1,tipo,modelo,
    motivo:{sidebar:'Navegação entre áreas pede sidebar adaptativa; não use compactação de comandos como substituto.',ribbon:'Muitos comandos de edição pedem abas e grupos, com estados contextuais e overflow.',contexto:'Ações sobre o objeto selecionado pedem menu contextual próximo ao gatilho.',radial:'Poucas ações frequentes podem usar menu radial, mantendo alternativa acessível por teclado.',menubar:'Uma hierarquia de ações pode usar barra de menus e submenus em cascata.'}[tipo],
    regras:REGRAS_MENUS.map(r=>r.id),repertorio:REPERTORIO_MENUS,criterios:['IDs estáveis independentes do rótulo','nome acessível em comandos só com ícone','estados derivados do documento','um commit por edição; desfazer no núcleo','testar 390, 768, 1024 e 1440 px; zoom e texto longo','nunca inventar lógica de negócio para sinais de interface']};
}
export function auditarMenus(elementos, somente=null) {
  const itens=[];
  const add=(e,regra,mensagem,correcao)=>itens.push({id:e.id,nome:e.nome||'',regra:'menu-'+regra,gravidade:'aviso',mensagem,...(correcao?{correcao,resumo:'Ajustar contrato do menu'}:{})});
  for(const e of elementos){
    if(somente&&!somente.has(e.id))continue;
    const filhos=elementos.filter(f=>f.pai===e.id&&f.tipo==='container');
    if(e.menu?.sidebar&&e.menu?.adaptativo)add(e,'contrato','Sidebar e faixa precisam de containers independentes.',{'menu.adaptativo':false});
    if(e.menu?.sidebar&&filhos.length!==2)add(e,'sidebar','Sidebar precisa de dois grupos diretos: navegação e conteúdo.');
    if(e.menu?.adaptativo&&e.layout?.modo!=='linha')add(e,'layout','A faixa adaptativa deve organizar os grupos em linha.',{'layout.modo':'linha'});
    if(e.menu?.adaptativo&&!filhos.length)add(e,'grupos','A faixa adaptativa não possui grupos de comandos.');
    if(e.acessibilidade?.indisponivel&&!e.acessibilidade?.motivo)add(e,'estado','Explique o motivo da indisponibilidade para quem navega pelo menu.');
    if((e.acessibilidade?.role==='menu'||e.tipo==='menu')&&e.abertura?.iniciaFechado&&(!e.abertura?.fecharEsc||!e.abertura?.fecharFora))add(e,'fechamento','Menu temporário deve fechar por Escape e clique fora.',{'abertura.fecharEsc':true,'abertura.fecharFora':true});
  }
  return itens;
}

