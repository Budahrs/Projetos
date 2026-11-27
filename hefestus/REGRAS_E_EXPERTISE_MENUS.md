# Hefestus 0.36 — regras e expertise de menus

Atualização aplicada na aplicação central em `Documents\Codex\Projetos\Hefestus\aplicacao`. Recarregue o Hefestus para usar a versão 0.36.0.

## Melhorias aplicadas

1. **Teclado:** um ponto de entrada por barra, setas entre comandos e Home/End. Campos e seletores preservam suas teclas de edição. A navegação acompanha controles inseridos ou revelados. As exportações recebem o mesmo comportamento nas barras declaradas como toolbar e tablist.
2. **Foco:** o overflow é um diálogo não modal identificado como tal; Tab sai e Esc devolve foco ao gatilho. O drawer minimal da sidebar conserva seu comportamento de sobreposição com controle de foco. Menus clássicos usam itens com foco por setas, sem uma sequência inteira de Tab.
3. **Estabilidade:** cache da largura medida, tolerância para diferenças subpixel, invalidação por mudanças de conteúdo e fontes, uma medição agendada por quadro e limite finito de reduções do plano. Eventos de ResizeObserver causados pelo próprio layout não obrigam uma nova medição da mesma largura.
4. **Intenção do mouse:** corredor geométrico com prazo limitado para alcançar submenus em diagonal, aplicado aos menus clássicos do editor e aos menus de hover exportados. Toque não usa essa tolerância de mouse.
5. **Posicionamento:** regra compartilhada para trocar o lado, ajustar às bordas, limitar dimensões e atualizar painéis durante rolagem e redimensionamento. O runtime preserva sua compensação de ancestrais com transform/zoom.
6. **Estados:** itens indisponíveis dos menus continuam descobertos pelas setas, mas clique, ativação e atalhos não executam o comando. O editor mostra esses itens com estado ARIA e aparência própria. Busca por letras foi acrescentada aos menus.

## Conhecimento do próprio programa

O módulo `expertiseMenus.js` reúne as regras, a proveniência e o recomendador de tipos. Isso é uma base explícita de conhecimento; não é treinamento de um novo modelo de IA.

- **Planejamento:** recomenda Ribbon para comandos de edição, sidebar para navegação entre áreas, contextual para ações sobre objetos, radial para poucas ações frequentes e menubar para hierarquias de ações.
- **Agente com ferramentas:** ganhou `planejar_menu`, que consulta o conhecimento sem modificar o projeto. As instruções do agente incluem as regras e orientam auditar o resultado criado.
- **Agente local:** entende pedidos de planejamento e criação adaptativa, usando modelos existentes e editáveis.
- **Auditoria:** detecta conflito entre sidebar e Ribbon no mesmo container, ausência dos dois grupos da sidebar, faixa fora do layout horizontal, faixa sem grupos, motivo ausente de indisponibilidade e menus temporários sem fechamento por Esc/clique fora.
- **Correções:** os ajustes mecânicos seguem o histórico do núcleo e podem ser desfeitos. Problemas ambíguos são apontados, sem inventar uma composição.
- **Reutilização:** recomendador e auditoria de menus entram no manifesto local; a semente passa a publicar 21 ferramentas. Isso não modifica o Axiom automaticamente.

Exemplos de pedidos no agente:

```text
Planejar menu para navegação entre páginas
Crie uma barra lateral adaptativa
Crie um menu profissional para edição com muitos comandos
Auditar interface
```

O planejamento explica a escolha. A criação insere a estrutura visual e seus sinais; as operações reais do documento hospedeiro continuam sob responsabilidade do programa que integra a interface.

## Fontes utilizadas

- [W3C: padrão de toolbar](https://github.com/w3c/aria-practices/blob/main/content/patterns/toolbar/toolbar-pattern.html).
- [W3C: navegação por teclado e estados indisponíveis](https://github.com/w3c/aria-practices/blob/main/content/practices/keyboard-interface/keyboard-interface-practice.html).
- [Radix: menus modais e não modais](https://www.radix-ui.com/primitives/docs/components/dropdown-menu).
- [Fluent UI: relato de oscilação do overflow](https://github.com/microsoft/fluentui/issues/36601), usado como caso de prevenção, não como norma ou prova de falha no Hefestus.
- [Floating UI: corredor seguro](https://github.com/floating-ui/floating-ui/blob/master/packages/react/src/safePolygon.ts) e [posicionamento](https://github.com/floating-ui/floating-ui).

As regras foram implementadas no motor existente, sem instalar essas bibliotecas ou copiar seu código.

## Verificação e limites

194 testes passaram no conjunto completo. Após a revisão final dos observadores e limpeza, os 16 testes específicos de menus foram executados novamente e passaram. Os testes incluem geometria, corredor diagonal, estabilidade de medições, teclado com DOM simulado, tipos recomendados, agente, correções com Undo e sintaxe dos scripts exportados.

Não houve verificação visual em navegador real nesta sessão, pois a navegação para arquivo local foi bloqueada. Testes com DOM simulado não substituem conferência com leitor de tela, mouse, toque e diferentes tamanhos de janela. Não se declara certificação de acessibilidade.

A tradução integral, o espelhamento RTL de toda a aplicação, o Live Preview transacional e os demais itens do checklist anterior continuam fora desta atualização; aqui foram aplicadas as seis melhorias pesquisadas no GitHub e o conhecimento para utilizá-las.

O backup anterior à atualização está em `Hefestus\versoes\antes_menus_036_<data_hora>`. Nenhum projeto do usuário foi regravado ou removido.
