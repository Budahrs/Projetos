# ADR-022 — Referências para a IDE visual

Estado: direção aceita; capacidades futuras dependem de implementação. Data: 28/10/2026. Origem: referências indicadas pelo usuário, conferidas em documentação oficial.

Preservar apenas Designer e Visual Script. Event sheets/blocos, grafo e código serão projeções/contextos da mesma área de lógica e do mesmo documento; não criar cópias concorrentes nem terceiro workspace. A interface atual não ganha compilador TypeScript por mudar um rótulo.

Nesta rodada: melhorar Localizar diagnóstico para abrir Designer ou grafo/nó correto e fechar o diálogo sem alterar o projeto. Preservar runtime compartilhado e saídas de sucesso/erro já entregues.

Evolução: ações/condições/expressões com assinatura e versão; mensagens tipadas e rastreamento; funções de código isoladas com portas declaradas; conclusão/erro/cancelamento assíncrono; transpilação TS explícita; paridade prévia/exportação; reutilização com dependências seletivas. Tudo vinculado aos HEF existentes na matriz.

Retorno: navegação apenas muda seleção/área; novo retorno de dialogo é aditivo. Reverter módulos desta decisão retorna a navegação anterior sem migrar documento .hefestus v1. Fontes e limites em docs/referencias-evolucao.md.
