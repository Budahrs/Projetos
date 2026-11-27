# Hefestus 0.39 — menus, configuração contextual e prévia

Atualizado na central: Projetos\Hefestus\aplicacao\dist\hefestus.html. Recarregue o arquivo aberto no navegador para sair da versão 0.38.

Botão direito: menu principal compacto de 272 px, com ações rápidas, Inserir rápido e Biblioteca apresentados por ícones com nomes acessíveis e dicas. Edição, Organização, Exibir, Mais usados e demais categorias abrem submenus laterais. Os submenus trocam de lado, limitam tamanho à janela visível e usam rolagem interna. A abertura por passagem do mouse tem atraso; o corredor diagonal existente protege o movimento até o submenu. Setas para direita/esquerda entram e voltam, cima/baixo percorrem itens e Esc fecha níveis. Busca continua disponível.

Configuração: ao clicar com o botão direito num elemento, Configuração oferece Aparência, Comportamento e Conectar evento. Cada opção abre um painel flutuante com os controles reais do editor. O painel acompanha o documento; fecha se outro elemento for selecionado, por Esc ou clique fora. Vínculos a ferramentas reutilizam a seleção de ferramentas do armazém e suas referências versionadas.

Eventos: nova ação Disparar animação no alvo, com efeitos Aparecer, Revelar e Pulsar e duração entre 80 e 2000 ms. Atua sobre um elemento existente sem trocar conteúdo, código ou geometria. Respeita movimento reduzido do sistema. Ferramentas externas continuam dependendo da sua disponibilidade no armazém/runtime; conectar um sinal não cria backend automaticamente.

Ribbon: opções em Exibir > Movimento > Animação dos menus: Sem animação, Aparecer suavemente e Revelar ao abrir; durações Rápida, Normal e Lenta. Preferências ficam salvas. Abrir/recolher e trocar de aba recebem transição; a cópia visual usada ao fechar não aceita foco nem cliques. Movimento reduzido desativa os efeitos. As opções se aplicam à interface do editor; as animações dos elementos criados são configuradas no próprio projeto.

Comportamento: categorias Navegação e menus, Conteúdo e organização, Ajuda e dicas, Janelas e sobreposições. Atalhos na faixa abrem o painel já filtrado. O painel mostra gatilho, escolha do alvo e modelos prontos por categoria.

Limites: galerias, menus de contexto, submenus, overflow, faixas suspensas e configuração compartilham limites de largura/altura e reposicionamento. Correção da altura mínima de 160 px, que podia ultrapassar o espaço disponível. Viewport visual considera zoom e deslocamento quando disponível. Há tratamento de redimensionamento; menus gerados também recebem limites no runtime.

Barras laterais: ficam acima dos elementos do projeto. O conteúdo ganha contexto de empilhamento próprio para impedir que um elemento com z-index alto cubra o painel. Janelas de configuração e confirmação do editor mantêm camadas superiores. Sidebar gerada em janela estreita passa para overlay mesmo se configurada aberta; possui rolagem interna, altura limitada, foco devolvido ao botão quando o painel é ocultado e fechamento após escolher um item de navegação sem submenu.

Forja: botão Prévia interativa com ícone no topo, acessível em Designer e Forja. Aplicar e testar também recebeu o ícone. A prévia do topo testa o projeto já aplicado; o botão Aplicar e testar aplica o rascunho antes de abrir.

Repertório: as regras de limite da tela e camadas/movimento também passam a integrar as orientações do agente.

Validação: compilação do HTML aprovada; bateria completa com 215 testes aprovados. Novos testes cobrem limites em janelas extremas e zoom, movimento reduzido, categorias completas, sidebar estreita e configuração do evento de animação. A captura fornecida pelo usuário foi usada como referência da versão anterior. Validação visual interativa de todos os novos menus continua pendente nesta sessão.

Backup: Hefestus\versoes\antes_menus_039_20261020. Nenhum arquivo de projeto do usuário foi alterado para migrar menus automaticamente.
