# Hefestus 0.35 - prioridade de implementação

Data: 19/10/2026. O usuário priorizou Hefestus antes da próxima evolução do Antares.

## Mudanças aplicadas

- Opções reúne os controles antes apresentados em Design, preservando o ID interno e os comandos existentes.
- Catálogo canônico de interface: System/Auto, Light, Dark, Dim e High Contrast. Variantes legadas permanecem disponíveis; aliases mantêm escolhas antigas compatíveis.
- System acompanha mudanças de claro/escuro e contraste do ambiente do navegador/SO. Uma escolha explícita permanece fixa.
- Superfícies neutras sem branco puro; documento/canvas editado não é recolorido. Movimento da interface reduzido por padrão e por preferência do sistema; há controle em Opções.
- Criar/importar/exportar temas na interface, com validação de cores e contraste. Importação valida o lote antes de gravar; paletas equivalentes são reaproveitadas. O pacote JSON é preparado para adaptadores dos outros sistemas, que ainda não foram todos integrados.
- Menu de contexto do grupo oferece fixar/desafixar e recolher/expandir por aba. A compactação prioriza grupos menos usados e preserva os protegidos.
- Métricas locais de chamadas, retorno, falhas e tempo dos handlers, exportáveis em Opções. Elas não coletam texto do documento e não comprovam o resultado de operações externas.
- Oficina de menus inclui análise de curadoria: contratos declarados, identificadores, candidatos equivalentes e variantes. Nomes iguais não autorizam remover ferramentas.
- Núcleo de curadoria permite unificar referências após revisão/evidências, preserva aliases e histórico e recusa reversão que sobrescreveria alteração posterior de layout. Não faz fusão automática de código. Depois de unificar referências, regenerar/sincronizar o pacote antes de usar códigos exportados.
- HTML gerado inclui catálogo de temas, acompanhamento do modo do sistema, overflow real em Mais, âncoras para recolher/expandir grupos, sinais ao host e navegação de abas por teclado. Execução PDF depende do host; XAML continua fragmento e adaptador mobile permanece pendente.

## Como abrir e usar

Abra Hefestus.html nesta pasta ou Projeto/hefestus.html. Na instalação original, recarregue hefestus.html/dist/hefestus.html e confira v0.35.0 no rodapé. A janela já aberta pode continuar mostrando o código antigo até recarregar.

Em Opções, selecione o tema ou Criar e importar temas. Em um grupo, use o botão direito para fixar ou recolher. Na Oficina de menus, use Analisar curadoria. Exportar catálogo compartilhável gera hefestus.temas versão 1.

Fontes editáveis ficam em Projeto. O backup anterior está em work/hefestus-antes-035.zip na área de trabalho desta tarefa; preservar os dados do navegador e documentos do usuário durante retorno de versão.

## Verificação

- 119 testes da suíte selecionada passaram, incluindo agentes, menus, oficina, temas, curadoria, métricas, seleção, construção, preview e distribuição.
- Quatro cenários adicionais do núcleo passaram: criação/undo-redo, proteção de cor, serialização e HTML exportado.
- Root e dist idênticos; sintaxe dos scripts empacotados verificada. A CLI real gerou pacote, componente, HTML, XAML, layout e banco com 66 comandos/16 grupos/6 abas.
- A execução ampliada encontrou o arquivo nucleo.test.mjs que não terminou no prazo operacional; o processo de teste pertencente a esta execução foi interrompido. Não foi declarada aprovação da suíte completa do núcleo. Os quatro cenários acima foram executados separadamente.
- Testes de DOM/contrato e medidas de contraste não substituem inspeção interativa completa nem avaliação pessoal de conforto visual. Estas avaliações continuam pendentes.

## Ainda pendente no Hefestus

Contrato completo de arte vetorial e controladores, todos os menus contextuais por tipo de alvo, editor de curadoria com mescla funcional comprovada, organização e herança de layout completas, propagação real a todos os sistemas, aprendizado/importação de temas de outros aplicativos, integração MCP/IA suportada, microinterações configuráveis completas e aplicações mobile/desktop/web compiladas e executadas conforme a matriz.

As métricas novas de renderização, localização de comandos, overflow e satisfação ainda precisam de coleta específica; não receberam valores fictícios. A evolução seguinte do Antares permanece depois do Hefestus. Sua versão 1.1 estável foi mantida; código de continuidade não validado ficou separado em work.
