# Hefestus — correções e híbrido simplificado

Abra hefestus.html. O mesmo editor também está em dist/hefestus.html, e o build mantém os dois sincronizados.

## Fluxo do modo híbrido

1. Criar e configurar: adicione containers, menus e componentes. O catálogo de criação e os temas podem ser recolhidos.
2. Clique no objeto para configurar. Editar seleção mostra uma seção por vez: propriedades, cores, efeitos, responsivo, comportamento, eventos ou acessibilidade.
3. Testar abre a prévia interativa. Designer retorna ao modo híbrido anterior.

Use 50 / 50 para equilibrar canvas e formulário. Selecionar na tela alterna com Mover na tela. O híbrido ajusta a escala visual sem mudar o tamanho do documento ou criar eventos de redimensionamento no histórico. Formulários preservam rolagem, cartões abertos e foco durante a edição da mesma seleção.

## Correções

- Prévia isolada por Shadow DOM: estilos do artefato não afetam o editor.
- Complementos usam buscas, eventos e elementos dentro da própria prévia. Áudio, timers, animações e estilos são liberados ao sair.
- Erros do complemento aparecem na barra de status, em vez de falharem silenciosamente.
- Prévia reajusta a escala ao redimensionar a janela.
- Containers são selecionados com um clique; Alt no fundo de um container inicia o retângulo de seleção.
- O retângulo inclui containers vazios e seleciona o pai uma única vez quando engloba seus filhos. Alt aceita interseção parcial.
- Objetos ocultos ou bloqueados por um pai são ignorados na seleção por retângulo e em selecionar tudo/inverter.
- Tab percorre objetos sem exigir uma cópia prévia para a área de transferência.
- Gestos cancelados ou perda de foco não deixam arrastos e a ferramenta Mão presos.
- Menus mostram nome, largura e conteúdo primeiro; posição, cores e efeitos ficam em opções recolhíveis.
- Containers têm aparência e comportamento em grupos recolhíveis.

## Verificação

A suíte original executada antes das alterações passou em 100 testes JavaScript e 15 testes TypeScript. Após as alterações, passaram os 10 testes de distribuição, seleção e complemento e os testes direcionados do núcleo para seleção, exportação HTML, responsividade e modelo de rádio. Também foram verificados no navegador: criação de menu, formulários híbridos, divisão 50/50, ida e volta da prévia e interação do controlador de rádios sem erros de console.

Os testes específicos estão em testes/selecao.test.mjs e testes/complemento.test.mjs. Rode node build.mjs e node --test testes/dist.test.mjs testes/selecao.test.mjs testes/complemento.test.mjs.

Esta entrega trata os problemas identificados e verificados; não representa uma auditoria de todas as funções do editor.

## 0.32.0: estado antigo de Prévia + Híbrido
Preferências antigas são normalizadas na inicialização. A prévia não mantém o dock híbrido aberto; voltar ao Designer restaura o híbrido anterior. O painel inferior também exige modo Designer antes de montar o formulário. Os 13 testes de workspace, distribuição, seleção e complemento passaram. A migração foi reproduzida no navegador com preferências antigas incompatíveis.

