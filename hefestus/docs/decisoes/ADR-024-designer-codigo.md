# ADR-024 — Designer/Código e representações contextuais

28/10/2026. Estado: implementado e testado no escopo descrito. Autorizado pelo pedido de continuar a proposta de alternância.

O toggle principal passa a Designer/Código. O identificador persistido visual-script e os aliases Forja/Web continuam compatíveis. Dentro de Código, Blocos/Grafo/Código-fonte são representações da mesma área; não criar terceiro workspace.

Blocos projeta os nós e portas reais do grafo e reutiliza os editores de valores existentes. Não converte ou simplifica nós avançados descartando informação. Código-fonte reutiliza o editor HTML/CSS/JS da seleção, com rascunhos na mesma sessão e aplicação via Nucleo. Runtime gerado é revisão somente leitura, não JavaScript arbitrário convertido para grafo.

Trocas de área/representação alteram apenas preferências; não geram novo documento/histórico. Preservar seleção, grafo e rascunhos. Atalho F7 e estado acessível; animações respeitam movimento reduzido.

Retorno: reverter adaptadores e preferências novas; formato .hefestus v1 e IDs não mudam. Testes de preservação do documento e execução, além de QA no navegador.

Aceite: 350 testes passaram; sete testes novos cobrem representações, identidades, execução, histórico, campos inválidos e revisão obsoleta. QA no navegador confirmou rascunhos entre representações, aplicação/desfazer/refazer em blocos e F7/rascunho/aplicação/desfazer em CSS. Aplicar campos é explícito e transacional. Código-fonte não equivale a conversão bidirecional irrestrita entre texto e grafo.
